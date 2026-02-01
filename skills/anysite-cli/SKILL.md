---
name: anysite-cli
description: Operate the anysite command-line tool for web data extraction, batch API processing, multi-source dataset pipelines with scheduling/transforms/exports, and database operations. Use when users ask to collect data from LinkedIn, Instagram, Twitter, or any web source via CLI; create or run dataset pipelines; schedule automated collection; batch-process API calls; query collected data with SQL; load data into PostgreSQL or SQLite; or work with anysite commands. Triggers on anysite CLI usage, data collection, dataset creation, scraping, API batch calls, scheduling, or database loading tasks.
---

# Anysite CLI

Command-line tool for web data extraction, dataset pipelines, and database operations. All commands use `anysite` prefix and execute via Bash.

## Prerequisites

```bash
# Ensure CLI is installed
anysite --version

# Configure API key (one-time)
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

# Dry run
anysite dataset load-db dataset.yaml -c pg --dry-run
```

`load-db` auto-creates tables with inferred schema, adds `id` primary key, and links child tables to parents via `{parent}_id` FK columns using provenance data.

Optional `db_load` config per source controls which fields go to DB:
```yaml
  - id: profiles
    endpoint: /api/linkedin/user
    db_load:
      table: people              # Custom table name
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
anysite db add pg    # Interactive prompts for type, host, port, etc.

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

### Step 6: History, Scheduling, and Notifications
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
