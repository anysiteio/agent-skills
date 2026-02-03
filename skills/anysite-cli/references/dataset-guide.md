# Dataset Pipeline & Database Guide

## Dataset YAML Configuration

### Full Structure

```yaml
name: my-dataset
description: Optional description

sources:
  - id: source_id              # Unique identifier
    endpoint: /api/...         # API endpoint path
    params: {}                 # Static API parameters
    from_file: inputs.txt      # Input file (txt/JSONL/CSV)
    file_field: column_name    # CSV column to extract
    input_key: param_name      # API parameter for input values
    input_template: {}         # Transform values before API call
    dependency:                # Link to parent source
      from_source: parent_id
      field: urn.value         # Dot-notation field to extract
      match_by: name           # Alternative: fuzzy match by name
      dedupe: true             # Remove duplicate values
    parallel: 3                # Concurrent requests
    rate_limit: "10/s"         # Rate limiting
    on_error: skip             # stop or skip
    refresh: always            # auto (default) or always — re-collect every run
    transform:                 # Post-collection transform (for exports only)
      filter: '.count > 10'   # Safe filter expression
      fields: [name, url]     # Field selection with aliases
      add_columns:             # Static columns to inject
        batch: "q1-2026"
    export:                    # Per-source export destinations
      - type: file
        path: ./output/{{source}}-{{date}}.csv
        format: csv            # json, jsonl, csv
      - type: webhook
        url: https://example.com/hook
        headers: {X-Token: abc}
    llm:                       # LLM enrichment (after collection, before Parquet)
      - type: enrich           # enrich, classify, summarize, generate
        add:                   # Field specs for enrich type
          - "sentiment:positive/negative/neutral"
          - "language:string"
        fields: [name, headline]  # Record fields to include in LLM prompt
      - type: classify
        categories: "dev,recruiter,exec"  # Omit for auto-detect
        output_column: role    # Default: "category"
      - type: summarize
        max_length: 50
        output_column: bio     # Default: "summary"
      - type: generate
        prompt: "Pitch for {name}"  # Required for generate
        output_column: pitch   # Default: "text"
        temperature: 0.7       # Per-step overrides
    db_load:                   # Database loading config
      table: custom_name       # Override table name
      key: urn.value           # Unique key for diff-based incremental sync
      sync: full               # full (INSERT/DELETE/UPDATE) or append (no DELETE)
      fields: [name, url, sentiment, language, role, bio, pitch]
      exclude: [_input_value]  # Fields to exclude

storage:
  format: parquet
  path: ./data/
  partition_by: [source_id, collected_date]

schedule:                      # Collection schedule
  cron: "0 9 * * *"           # Standard cron expression

notifications:                 # Webhook notifications
  on_complete:
    - url: "https://hooks.slack.com/xxx"
      headers: {X-Token: abc}
  on_failure:
    - url: "https://alerts.example.com/fail"
```

### Three Source Types

**Independent** — single API call with static params:
```yaml
- id: search_results
  endpoint: /api/linkedin/search/users
  params:
    keywords: "software engineer"
    count: 50
```

**from_file** — iterate over values from a file:
```yaml
- id: companies
  endpoint: /api/linkedin/company
  from_file: companies.txt      # One value per line
  input_key: company             # API parameter name
  parallel: 3
```

**Dependent** — extract values from parent source output:
```yaml
- id: employees
  endpoint: /api/linkedin/company/employees
  dependency:
    from_source: companies       # Parent source ID
    field: urn.value             # Dot-notation path in parent records
    dedupe: true                 # Deduplicate extracted values
  input_key: companies           # API parameter name
  input_template:                # Transform value before API call
    companies:
      - type: company
        value: "{value}"         # {value} is replaced with extracted value
    count: 5
```

### Dependency Chains

Sources are topologically sorted — parents always run before children. Multi-level chains work automatically:

```
companies → employees → profiles → posts → comments
```

**Common dependency fields:**
- `/api/linkedin/company/employees` returns: `name`, `headline`, `url`, `image`, `location`, `internal_id`, `urn` — use `urn.value` (not `alias`) to chain into `/api/linkedin/user`
- `/api/linkedin/user` accepts both human-readable aliases (`satyanadella`) and URN values as the `user` parameter

Always run `anysite describe <endpoint>` to verify available fields before setting up dependencies.

### input_template

Transforms extracted values before passing to the API. Use `{value}` placeholder:

```yaml
input_template:
  urn: "urn:li:fsd_profile:{value}"
  count: 5
```

If `field: urn.value` extracts `"ACoAABCDEF"`, the API receives:
```json
{"urn": "urn:li:fsd_profile:ACoAABCDEF", "count": 5}
```

### Dot-Notation Field Extraction

When Parquet stores nested objects as JSON strings, dot-notation traverses them:

- `urn.value` — parses JSON string in `urn` field, extracts `.value`
- `experience[0].company_urn` — array index + nested field
- `internal_id.value` — nested object access

---

## Collection Commands

```bash
# Preview collection plan with estimated request counts
anysite dataset collect dataset.yaml --dry-run

# Full collection
anysite dataset collect dataset.yaml

# Collect and auto-load into database
anysite dataset collect dataset.yaml --load-db pg

# Incremental — skip inputs already collected
anysite dataset collect dataset.yaml --incremental --load-db pg

# Single source + its dependencies
anysite dataset collect dataset.yaml --source employees

# Quiet mode
anysite dataset collect dataset.yaml --quiet
```

### Provenance Tracking

Dependent and from_file records automatically get metadata columns:
- `_input_value` — the raw extracted value that produced this record
- `_parent_source` — parent source ID (dependent sources only)

These enable FK linking when loading into a database.

### Incremental Collection

With `--incremental`:
1. Independent sources: skipped if already collected today
2. Dependent/from_file sources: skips individual input values already in `metadata.json`
3. New values are still collected and tracked

### Refresh Mode

Per-source `refresh` field controls behavior with `--incremental`:

```yaml
- id: posts
  endpoint: /api/linkedin/user/posts
  dependency: { from_source: profiles, field: urn.value }
  input_key: user
  refresh: always    # Re-collect every run even with --incremental
```

| Setting | `--incremental` | No flag |
|---------|----------------|---------|
| `refresh: auto` (default) | Skip collected inputs | Collect all |
| `refresh: always` | Collect all (ignore cache) | Collect all |

Use `refresh: always` for sources with frequently changing data (e.g., posts, activity feeds) where you want fresh snapshots each run while still caching stable parent data.

### Storage Layout

```
<storage.path>/
  raw/<source_id>/<YYYY-MM-DD>.parquet
  metadata.json
```

---

## Query Commands (DuckDB)

Each source becomes a DuckDB view named after its ID.

```bash
# Direct SQL
anysite dataset query dataset.yaml --sql "SELECT * FROM companies LIMIT 10"

# Shorthand: --source auto-generates SELECT
anysite dataset query dataset.yaml --source profiles

# Dot-notation field extraction
anysite dataset query dataset.yaml --source profiles \
  --fields "name, urn.value AS urn_id, headline"
# Generates: SELECT name, json_extract_string(urn, '$.value') AS urn_id, headline FROM profiles

# Output options
anysite dataset query dataset.yaml --sql "SELECT * FROM companies" \
  --format csv --output companies.csv

# Interactive SQL shell
anysite dataset query dataset.yaml --interactive

# Column statistics
anysite dataset stats dataset.yaml --source companies

# Data profiling (completeness, record counts)
anysite dataset profile dataset.yaml
```

---

## Database Loading (load-db)

Load Parquet data into a relational database with automatic FK linking.

```bash
anysite dataset load-db dataset.yaml -c <connection_name> [OPTIONS]
```

### Options
```
--connection, -c TEXT    Database connection name (required)
--source, -s TEXT        Load specific source + dependencies
--drop-existing          Drop tables before creating
--snapshot TEXT           Load a specific snapshot date (YYYY-MM-DD)
--dry-run                Show plan without executing
--quiet, -q              Suppress output
```

### What load-db Does

1. Reads Parquet files for each source (in topological order)
2. Infers SQL schema from data (integer, float, text, json, etc.)
3. Creates tables with auto-increment `id` primary key
4. Inserts rows, tracking which `_input_value` maps to which `id`
5. For child sources: adds `{parent_source}_id` FK column using provenance

### Incremental Sync with `db_load.key`

When `db_load.key` is set and the table already exists with >=2 snapshots, `load-db` uses diff-based incremental sync instead of full re-insertion:

1. Compares the two most recent Parquet snapshots using `DatasetDiffer`
2. **Added** records → INSERT into DB
3. **Removed** records → DELETE from DB (by key) — only in `sync: full` mode
4. **Changed** records → UPDATE modified fields (by key)

This keeps the database in sync without duplicates.

**Sync modes** (`db_load.sync`):
- `full` (default) — applies INSERT, DELETE, and UPDATE from diff
- `append` — applies INSERT and UPDATE only, skips DELETE. Use for sources where the API returns only the latest N items (e.g., posts, comments) and you want to accumulate records over time.

| Scenario | Behavior |
|----------|----------|
| First load (table doesn't exist) | Full INSERT of latest snapshot |
| Table exists + `db_load.key` + >=2 snapshots | Diff-based sync (INSERT/DELETE/UPDATE delta) |
| `--drop-existing` | Drop table, full INSERT of latest snapshot |
| `--snapshot 2026-01-15` | Full INSERT of that specific snapshot |
| No `db_load.key` set | Full INSERT of latest snapshot (no diff) |

### db_load Config

Control which fields go to the database per source:

```yaml
db_load:
  table: people                    # Custom table name (default: source ID)
  key: urn.value                   # Unique key for diff-based incremental sync
  sync: append                     # full (default) or append (no DELETE on diff)
  fields:                          # Explicit field list
    - name
    - url
    - urn.value AS urn_id          # Dot-notation with alias
    - experience                   # JSON columns stored as TEXT/JSONB
  exclude:                         # Fields to skip (default: _input_value, _parent_source)
    - _input_value
    - _parent_source
    - raw_html
```

Without `db_load`: all fields except `_input_value` and `_parent_source` are loaded.

### FK Linking Example

Given: companies → employees → posts

Result in database:
- `companies` table: `id`, name, url, ...
- `employees` table: `id`, name, ..., `companies_id` (FK to companies.id)
- `posts` table: `id`, text, ..., `employees_id` (FK to employees.id)

---

## Database Commands (anysite db)

### Connection Management
```bash
anysite db add <name> --type postgres --host localhost --database mydb --user app --password secret
anysite db add <name> --type postgres --host localhost --database mydb --user app --password-env DB_PASS
anysite db list                    # List all connections
anysite db test <name>             # Test connectivity
anysite db info <name>             # Show connection details
anysite db remove <name>           # Delete connection
```

Connections stored in `~/.anysite/connections.yaml`. Passwords use env var references for security.

### Schema Inspection
```bash
anysite db schema <name>                  # List all tables
anysite db schema <name> --table users    # Show columns
```

### Data Operations
```bash
# Insert from stdin (auto-create table)
cat data.jsonl | anysite db insert <name> --table users --stdin --auto-create

# Insert from file
anysite db insert <name> --table users --file data.jsonl

# Upsert (update on conflict)
anysite db upsert <name> --table users --conflict-columns id --stdin

# Insert with conflict handling
anysite db insert <name> --table users --file data.jsonl \
  --on-conflict ignore --conflict-columns email
```

### SQL Queries
```bash
anysite db query <name> --sql "SELECT * FROM users" --format table
anysite db query <name> --file report.sql --format csv --output report.csv
```

### Supported Databases
- **SQLite** — `--type sqlite --path ./data.db`
- **PostgreSQL** — `--type postgres --host localhost --database mydb --user app --password-env DB_PASS`
- PostgreSQL also supports `--url-env DATABASE_URL` for connection strings

---

## Per-Source Transform

Transforms apply to export destinations only. Parquet always stores full records (needed for dependency resolution).

```yaml
transform:
  filter: '.employee_count > 10 and .status == "active"'
  fields:
    - name
    - url
    - urn.value AS urn_id          # Dot-notation with alias
    - employee_count
  add_columns:
    batch: "q1-2026"
    source: "linkedin"
```

### Filter Syntax
Safe expression parser (no `eval()`). Supported operators: `==`, `!=`, `>`, `<`, `>=`, `<=`. Connectors: `and`, `or`. Values: strings (`"..."`), numbers, `null`.

```
.field > 10
.status == "active"
.location != ""
.name != null
.count > 5 and .count < 100
.status == "active" or .status == "pending"
```

---

## LLM Enrichment

Optional `llm` list per source. Steps run **after collection, before Parquet write**, so enriched fields are stored in Parquet and flow to DB via `db_load.fields`.

### Step Types

| Type | Purpose | Required | Output |
|------|---------|----------|--------|
| `enrich` | Extract structured attributes | `add` specs | One column per spec |
| `classify` | Categorize records | `categories` (optional — auto-detects if omitted) | `category` + `category_confidence` |
| `summarize` | Concise text summary | — | `summary` |
| `generate` | Custom text from prompt template | `prompt` | `text` |

### Config Example

```yaml
sources:
  - id: profiles
    endpoint: /api/linkedin/user
    llm:
      - type: enrich
        add:
          - "sentiment:positive/negative/neutral"
          - "language:string"
          - "quality_score:1-10"
        fields: [headline, summary]     # Fields sent to LLM (empty = all)
      - type: classify
        categories: "developer,recruiter,executive"
        output_column: role_type        # Default: "category"
        fields: [headline]
      - type: summarize
        max_length: 50
        output_column: bio              # Default: "summary"
      - type: generate
        prompt: "Write a pitch for {name} who works as {headline}"
        output_column: pitch            # Default: "text"
        temperature: 0.7                # Higher for creative generation
    db_load:
      fields: [name, headline, sentiment, language, quality_score, role_type, bio, pitch]
```

### Enrich Field Spec Formats

| Format | Example | JSON Schema Type |
|--------|---------|-----------------|
| Enum | `sentiment:positive/negative/neutral` | `string` with `enum` |
| String | `language:string` | `string` |
| Integer | `count:integer` | `integer` |
| Range | `score:1-10` | `integer` |
| Number | `weight:number` | `number` |
| Boolean | `active:boolean` | `boolean` |

### Per-Step Overrides

Each step supports: `provider`, `model`, `temperature`, `max_tokens`, `fields`, `output_column`.

### Collect Flags

```bash
# Collect with LLM enrichment (default when llm: is configured)
anysite dataset collect dataset.yaml

# Skip LLM steps
anysite dataset collect dataset.yaml --no-llm

# Dry run shows LLM step count per source
anysite dataset collect dataset.yaml --dry-run
```

### Incremental Behavior

`--incremental` skips already-collected inputs at collection stage — only new records reach LLM enrichment. LLM response cache provides additional savings for repeated content.

---

## Per-Source Export

Export destinations run after Parquet write. Transform is applied to export records if configured.

### File Export
```yaml
export:
  - type: file
    path: ./output/{{source}}-{{date}}.csv
    format: csv                    # json, jsonl, csv
```

Template variables: `{{date}}` (YYYY-MM-DD), `{{datetime}}` (ISO), `{{source}}` (source ID), `{{dataset}}` (dataset name).

### Webhook Export
```yaml
export:
  - type: webhook
    url: https://example.com/hook
    headers:
      X-Token: abc
```

Sends POST with JSON body: `{dataset, source, count, records, timestamp}`.

---

## Run History & Logs

Every `collect` run is automatically recorded in SQLite (`~/.anysite/dataset_history.db`).

```bash
# View run history
anysite dataset history my-dataset
anysite dataset history my-dataset --limit 5

# View logs for a specific run
anysite dataset logs my-dataset --run 42

# View latest run logs
anysite dataset logs my-dataset
```

---

## Scheduling

Generate cron or systemd entries from the `schedule.cron` config.

```bash
# Crontab entry (default)
anysite dataset schedule dataset.yaml --incremental --load-db pg

# Systemd timer units
anysite dataset schedule dataset.yaml --systemd --incremental --load-db pg
```

Output example:
```
0 9 * * * /path/to/anysite dataset collect dataset.yaml --incremental --load-db pg >> ~/.anysite/logs/my-dataset_cron.log 2>&1
```

---

## Notifications

Webhook notifications sent on collection complete or failure.

```yaml
notifications:
  on_complete:
    - url: "https://hooks.slack.com/services/xxx"
      headers: {Authorization: "Bearer token"}
  on_failure:
    - url: "https://alerts.example.com/fail"
```

Payload: `{event: "complete"|"failure", dataset, timestamp, record_count, source_count, duration, error}`.

---

## Comparing Snapshots (Diff)

Compare two collection snapshots to find added, removed, and changed records.

```bash
# Compare two most recent snapshots (auto-detect dates)
anysite dataset diff dataset.yaml --source profiles --key _input_value

# Compare with dot-notation key (JSON fields)
anysite dataset diff dataset.yaml --source profiles --key urn.value

# Compare specific dates
anysite dataset diff dataset.yaml --source profiles --key urn.value --from 2026-01-30 --to 2026-02-01

# Only compare specific fields
anysite dataset diff dataset.yaml --source profiles --key urn --fields "name,headline,follower_count"

# Output as JSON/CSV
anysite dataset diff dataset.yaml --source profiles --key urn --format json --output diff.json
```

**Options:**
- `--source, -s` (required) — source to compare
- `--key, -k` (required) — field to match records by. Supports dot-notation for JSON fields (e.g., `urn.value`)
- `--from` / `--to` — snapshot dates (default: two most recent)
- `--fields, -f` — restrict both comparison and output to these fields
- `--format` — output format (table, json, jsonl, csv)
- `--output, -o` — write to file

**Output** shows summary counts and a table of changes:
- **added** — records in the new snapshot but not the old
- **removed** — records in the old snapshot but not the new
- **changed** — records with the same key but different values (shows `old → new`)

---

## Reset Incremental State

Clear collected input tracking to force re-collection.

```bash
# Reset all sources
anysite dataset reset-cursor dataset.yaml

# Reset specific source
anysite dataset reset-cursor dataset.yaml --source profiles
```
