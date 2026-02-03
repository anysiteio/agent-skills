---
name: anysite-cli
description: Operate the anysite command-line tool for web data extraction, batch API processing, multi-source dataset pipelines with scheduling/transforms/exports, database operations, and LLM-powered data analysis. Use when users ask to collect data from LinkedIn, Instagram, Twitter, or any web source via CLI; create or run dataset pipelines; schedule automated collection; batch-process API calls; query collected data with SQL; load data into PostgreSQL or SQLite; analyze data with LLM (summarize, classify, enrich, match, deduplicate); or work with anysite commands. Triggers on anysite CLI usage, data collection, dataset creation, scraping, API batch calls, scheduling, database loading, or LLM analysis tasks.
---

# Anysite CLI

Command-line tool for web data extraction, dataset pipelines, and database operations. All commands use `anysite` prefix and execute via Bash.

## Agent Workflow

Step-by-step guide for AI agents working with anysite CLI.

### Quick Start Checklist

Before executing any data collection task, verify these in order:

1. **Check CLI is available**
   ```bash
   anysite --version
   ```
   If not found: activate venv (`source .venv/bin/activate`) or install (`pip install anysite-cli`).

2. **Update schema cache** (required for endpoint discovery)
   ```bash
   anysite schema update
   ```
   Run this if `anysite describe` returns empty or outdated results.

3. **Verify API key is configured**
   ```bash
   anysite config get api_key
   ```
   If not set: get key at https://app.anysite.io, then `anysite config set api_key sk-xxxxx`

### Endpoint Discovery

**ALWAYS discover endpoints before writing API calls or dataset configs.**

```bash
# List all available endpoints
anysite describe

# Search by keyword
anysite describe --search "company"
anysite describe --search "linkedin"
anysite describe --search "posts"

# Get full details: input parameters + output fields
anysite describe /api/linkedin/company
anysite describe /api/linkedin/user
```

Use `describe` output to:
- Find the correct `endpoint` path for dataset.yaml
- Identify required vs optional input parameters
- Know which output fields are available for `--fields` selection

### Database Setup

**Database connections MUST be configured before using `--load-db` or `anysite db` commands.**

```bash
# List existing connections
anysite db list

# Add PostgreSQL connection
anysite db add pg --type postgres --host localhost --port 5432 \
  --database mydb --user myuser --password-env PGPASS

# Add SQLite connection
anysite db add local --type sqlite --path ./data.db

# Test connection
anysite db test pg
```

Connection names (e.g., `pg`, `local`) are then used in:
- `anysite dataset collect --load-db pg`
- `anysite dataset load-db dataset.yaml -c pg`
- `anysite db query pg --sql "..."`

### LLM Setup

**For LLM analysis commands, configure provider first:**

```bash
anysite llm setup
# Interactive: choose provider (openai/anthropic), set API key env var, test connection
```

### Common Gotchas

1. **Schema not updated** → `anysite describe` returns nothing
   - Fix: `anysite schema update`

2. **Wrong endpoint path** → API returns 404 or unexpected data
   - Fix: Use `anysite describe --search "keyword"` to find correct path

3. **Missing input parameter** → API returns validation error
   - Fix: Check `anysite describe /api/endpoint` for required params (marked with `*`)

4. **DB connection not found** → `Error: Connection 'pg' not found`
   - Fix: Run `anysite db add pg ...` first

5. **LinkedIn identifier wrong** → Returns wrong company/person
   - Fix: Use URL slug (e.g., `anthropicresearch` not `anthropic` for Anthropic AI)
   - Verify with: `anysite api /api/linkedin/company company=anthropicresearch --fields "name,url"`

## Prerequisites

```bash
# Ensure CLI is installed (activate venv if installed from source)
source .venv/bin/activate  # if using a virtual environment
anysite --version

# Install extras for dataset pipelines and database support
pip install "anysite-cli[data]"       # DuckDB + PyArrow for dataset commands
pip install "anysite-cli[postgres]"   # PostgreSQL adapter
pip install "anysite-cli[all]"        # All optional dependencies

# Configure API key (one-time) — get yours at https://app.anysite.io
anysite config set api_key sk-xxxxx

# Update schema cache (required for endpoint discovery and type inference)
anysite schema update
```

## Workflow 1: Single API Call

```bash
# Basic call — parameters as key=value pairs
anysite api /api/linkedin/user user=satyanadella

# With output options
anysite api /api/linkedin/company company=anthropic --format table
anysite api /api/linkedin/search/users title=CTO count=50 --format csv --output ctos.csv

# Search with specific parameters (always check with `anysite describe` first)
anysite api /api/linkedin/search/users first_name=Andrew last_name=Kulikov company_keywords=Anysite count=5

# Field selection
anysite api /api/linkedin/user user=satyanadella --fields "name,headline,follower_count"
anysite api /api/linkedin/user user=satyanadella --exclude "certifications,patents"

# Quiet mode for piping
anysite api /api/linkedin/user user=satyanadella -q | jq '.follower_count'
```

**Discover endpoints first:**
```bash
anysite describe                          # List all endpoints
anysite describe /api/linkedin/company    # Show input params + output fields
anysite describe --search "company"       # Search by keyword
```

See [api-reference.md](references/api-reference.md) for complete option reference.

## Workflow 2: Batch Processing

Process multiple inputs from file or stdin with parallel execution and rate limiting.

```bash
# From text file (one value per line)
anysite api /api/linkedin/user --from-file users.txt --input-key user --parallel 5

# From JSONL
anysite api /api/linkedin/user --from-file users.jsonl --parallel 3 --on-error skip

# With rate limiting and progress
anysite api /api/linkedin/user --from-file users.txt --input-key user \
  --rate-limit "10/s" --on-error skip --progress --stats

# Pipe from stdin
cat companies.txt | anysite api /api/linkedin/company --stdin --input-key company \
  --format csv --output results.csv
```

**Key options:** `--parallel N`, `--rate-limit "10/s"`, `--on-error stop|skip|retry`, `--progress`, `--stats`

## Workflow 3: Dataset Pipeline (Multi-Source Collection)

For complex data collection with dependencies between sources. Full guide: [dataset-guide.md](references/dataset-guide.md).

### Step 1: Initialize
```bash
anysite dataset init my-dataset
# Creates my-dataset/dataset.yaml with template config
```

### Step 2: Configure dataset.yaml

Three source types:
- **Independent** — single API call with static `params`
- **from_file** — batch calls iterating over input file values
- **Dependent** — batch calls using values extracted from a parent source

Per-source optional blocks: `transform` (filter/fields/add_columns for exports), `export` (file/webhook), `db_load` (fields for DB loading).

Top-level optional blocks: `schedule` (cron), `notifications` (webhooks on complete/failure).

```yaml
name: my-dataset
sources:
  - id: companies
    endpoint: /api/linkedin/company
    from_file: companies.txt
    input_key: company
    parallel: 3
    transform:                        # Applied to exports only (Parquet keeps all fields)
      filter: '.employee_count > 10'
      fields: [name, url, employee_count]
      add_columns:
        batch: "q1-2026"
    export:                           # Export after Parquet write
      - type: file
        path: ./output/companies-{{date}}.csv
        format: csv
    db_load:
      key: _input_value                   # Unique key for diff-based incremental sync
      sync: full                          # full (INSERT/DELETE/UPDATE) or append (no DELETE)
      fields: [name, url, employee_count]

  - id: employees
    endpoint: /api/linkedin/company/employees
    dependency:
      from_source: companies
      field: urn.value          # Dot-notation for nested JSON fields
      dedupe: true
    input_key: companies
    input_template:             # Transform extracted values
      companies:
        - type: company
          value: "{value}"
      count: 5
    parallel: 3
    on_error: skip
    refresh: always             # Re-collect every run even with --incremental
    llm:                          # LLM enrichment (after collection, before Parquet)
      - type: enrich
        add: ["sentiment:positive/negative/neutral", "language:string"]
        fields: [headline]
      - type: classify
        categories: "developer,recruiter,executive"
        output_column: role_type
        fields: [headline]

storage:
  format: parquet
  path: ./data/

schedule:
  cron: "0 9 * * *"              # Daily at 9 AM

notifications:
  on_complete:
    - url: "https://hooks.slack.com/xxx"
  on_failure:
    - url: "https://alerts.example.com/fail"
```

### Step 3: Collect
```bash
# Preview plan
anysite dataset collect dataset.yaml --dry-run

# Run collection
anysite dataset collect dataset.yaml

# Collect and auto-load into database
anysite dataset collect dataset.yaml --load-db pg

# Incremental (skip already-collected inputs)
anysite dataset collect dataset.yaml --incremental --load-db pg

# Single source and its dependencies
anysite dataset collect dataset.yaml --source employees

# Skip LLM enrichment steps
anysite dataset collect dataset.yaml --no-llm
```

### Step 4: Query with DuckDB
```bash
# SQL query
anysite dataset query dataset.yaml --sql "SELECT * FROM companies LIMIT 10"

# Shorthand with dot-notation field extraction
anysite dataset query dataset.yaml --source profiles \
  --fields "name, urn.value AS urn_id, headline"

# Interactive SQL shell
anysite dataset query dataset.yaml --interactive

# Stats and profiling
anysite dataset stats dataset.yaml --source companies
anysite dataset profile dataset.yaml
```

### Step 5: Load into Database
```bash
# Load all sources with FK linking
anysite dataset load-db dataset.yaml -c pg --drop-existing

# Incremental sync (uses diff when db_load.key is set)
anysite dataset load-db dataset.yaml -c pg

# Load a specific snapshot date
anysite dataset load-db dataset.yaml -c pg --snapshot 2026-01-15

# Dry run
anysite dataset load-db dataset.yaml -c pg --dry-run
```

`load-db` auto-creates tables with inferred schema, adds `id` primary key, and links child tables to parents via `{parent}_id` FK columns using provenance data.

**Incremental sync**: When `db_load.key` is set and the table already exists with >=2 snapshots, `load-db` diffs the two most recent snapshots and applies only the delta (INSERT added, DELETE removed, UPDATE changed). Without `db_load.key`, it does a full INSERT of the latest snapshot.

**Sync modes** (`db_load.sync`):
- `full` (default) — applies INSERT, DELETE, and UPDATE from diff
- `append` — applies INSERT and UPDATE only, skips DELETE (keeps records that disappeared from the API). Use for sources where the API returns only the latest N items (e.g., posts, activity feeds).

Optional `db_load` config per source controls which fields go to DB:
```yaml
  - id: profiles
    endpoint: /api/linkedin/user
    db_load:
      table: people              # Custom table name
      key: urn.value             # Unique key for diff-based incremental sync
      sync: append               # Keep old records (no DELETE on diff)
      fields:                    # Select specific fields
        - name
        - urn.value AS urn_id    # Dot-notation extraction
        - headline
        - experience
      exclude: [_input_value]    # Fields to skip
```

## Workflow 4: Database Operations

```bash
# Add connection
anysite db add pg --type postgres --host localhost --port 5432 --database mydb --user myuser --password mypass
# Or use env var reference (password not stored in config):
anysite db add pg --type postgres --host localhost --database mydb --user myuser --password-env PGPASS

# Test and inspect
anysite db test pg
anysite db list
anysite db schema pg --table users

# Insert data (auto-create table from schema inference)
cat data.jsonl | anysite db insert pg --table users --stdin --auto-create

# Upsert
cat updates.jsonl | anysite db upsert pg --table users --conflict-columns id --stdin

# Query
anysite db query pg --sql "SELECT * FROM users" --format table

# Pipe API output directly to database
anysite api /api/linkedin/user user=satyanadella -q --format jsonl \
  | anysite db insert pg --table profiles --stdin --auto-create
```

### Step 6: Compare Snapshots
```bash
# Diff two most recent snapshots
anysite dataset diff dataset.yaml --source employees --key _input_value

# Diff with dot-notation key (for JSON fields like urn)
anysite dataset diff dataset.yaml --source profiles --key urn.value

# Diff specific dates, compare and output only certain fields
anysite dataset diff dataset.yaml --source employees --key _input_value \
  --from 2026-01-30 --to 2026-02-01 --fields "name,headline"
```

`--key` supports dot-notation for JSON fields (e.g., `urn.value`). `--fields` restricts both comparison and output columns.

### Step 7: History, Scheduling, and Notifications
```bash
# View run history
anysite dataset history my-dataset

# View logs for a specific run
anysite dataset logs my-dataset --run 42

# Generate cron entry (with auto-load to DB)
anysite dataset schedule dataset.yaml --incremental --load-db pg

# Generate systemd timer units
anysite dataset schedule dataset.yaml --systemd --incremental --load-db pg

# Reset incremental state (re-collect everything)
anysite dataset reset-cursor dataset.yaml
anysite dataset reset-cursor dataset.yaml --source profiles
```

## Workflow 5: LLM Analysis

Analyze collected dataset records using LLM providers (OpenAI or Anthropic). Requires `pip install "anysite-cli[llm]"`.

### Setup
```bash
anysite llm setup
# Configures provider, API key env var, default model, tests connection
```

### Summarize
```bash
anysite llm summarize dataset.yaml --source profiles --fields "name,headline" --max-length 50 --format table
```

### Classify
```bash
# With explicit categories
anysite llm classify dataset.yaml --source posts --categories "positive,negative,neutral" --format table

# Auto-detect categories from data
anysite llm classify dataset.yaml --source posts --format table
```

### Enrich
```bash
anysite llm enrich dataset.yaml --source profiles \
  --add "sentiment:positive/negative/neutral" \
  --add "language:string" \
  --add "quality_score:1-10"
```

### Generate
```bash
anysite llm generate dataset.yaml --source profiles \
  --prompt "Write a LinkedIn intro for {name} who works as {headline}" \
  --temperature 0.7 --output intros.json
```

### Match (cross-source)
```bash
anysite llm match dataset.yaml --source-a profiles --source-b companies \
  --fields-a "name,headline" --fields-b "name,industry" --top-k 3
```

### Deduplicate
```bash
anysite llm deduplicate dataset.yaml --source profiles --key name --threshold 0.8
```

### Cache
```bash
anysite llm cache-stats
anysite llm cache-clear
```

**Common options:** `--provider`, `--model`, `--fields`, `--format`, `--output`, `--parallel`, `--rate-limit`, `--temperature`, `--dry-run`, `--no-cache`, `--prompt`, `--prompt-file`, `--quiet`.

**Key patterns:**
- All commands read from Parquet snapshots (latest by default)
- `--fields` controls which record fields are included in the LLM prompt
- `--dry-run` shows the prompt without calling the LLM
- Responses are cached in SQLite (`~/.anysite/llm_cache.db`) — use `--no-cache` to bypass
- Structured output via JSON Schema (OpenAI) or system-prompt (Anthropic)

## Key Patterns

### Output Formats
`--format json` (default) | `jsonl` | `csv` | `table`

### Field Selection
- Include: `--fields "name,headline,urn.value"`
- Exclude: `--exclude "certifications,patents"`
- Presets: `--fields-preset minimal|contact|recruiting`
- Dot-notation for nested: `experience.company`, `urn.value`

### Error Handling
- `--on-error stop` — halt on first error (default)
- `--on-error skip` — continue processing, skip failures
- `--on-error retry` — auto-retry with backoff

### Config Priority
CLI args > Environment vars (`ANYSITE_API_KEY`) > `~/.anysite/config.yaml` > defaults

## Common Recipes

### Collect company intel and store in Postgres
```bash
anysite dataset init company-intel
# Edit dataset.yaml with sources, transform, schedule, notifications...
anysite dataset collect company-intel/dataset.yaml --load-db pg
anysite db query pg --sql "SELECT c.name, COUNT(e.id) FROM companies c JOIN employees e ON e.companies_id = c.id GROUP BY c.name" --format table

# Set up daily schedule
anysite dataset schedule company-intel/dataset.yaml --incremental --load-db pg
# Add output to crontab
```

### Batch lookup and save to CSV
```bash
anysite api /api/linkedin/user --from-file people.txt --input-key user \
  --parallel 5 --rate-limit "10/s" --on-error skip \
  --fields "name,headline,location,follower_count" \
  --format csv --output people.csv --stats
```

### Quick endpoint exploration
```bash
anysite describe --search "linkedin"
anysite describe /api/linkedin/company
anysite api /api/linkedin/company company=anthropic --format table
```
