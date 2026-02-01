# Anysite CLI

Command-line tool operator for anysite CLI. Execute web data extraction, batch API processing, multi-source dataset pipelines, and database operations through Claude.

**Developer:** Anysite Skills Contributors

## Overview

The Anysite CLI skill enables Claude to operate the anysite command-line tool for data collection and processing. Claude can execute anysite commands via Bash to collect data from LinkedIn, Instagram, Twitter/X, Y Combinator, and other web sources, create dataset pipelines, run SQL queries, and load data into PostgreSQL or SQLite databases.

This skill is designed for users who have the anysite CLI installed and want Claude to help orchestrate data collection workflows.

## Prerequisites

**Anysite CLI must be installed:**

```bash
pip install anysite-cli
```

**Configure your API key:**

```bash
anysite config set api_key sk-xxxxx
```

Or set environment variable:

```bash
export ANYSITE_API_KEY=sk-xxxxx
```

**Update schema cache (required):**

```bash
anysite schema update
```

See full installation guide: https://docs.anysite.io/cli

## Installation

### Install from Marketplace

```bash
# Add the marketplace (if not already added)
/plugin marketplace add https://github.com/anysiteio/agent-skills

# Install the skill
/plugin install anysite-cli@anysite-skills
```

## Usage

Once installed, Claude can execute anysite CLI commands to help with data collection tasks.

### Quick Start Examples

**Single API call:**
```
"Get LinkedIn profile for satyanadella"
→ Executes: anysite api /api/linkedin/user user=satyanadella --format table
```

**Batch processing:**
```
"Collect LinkedIn profiles for all users in users.txt, save as CSV"
→ Executes: anysite api /api/linkedin/user --from-file users.txt --input-key user --format csv --output profiles.csv --parallel 5 --stats
```

**Endpoint discovery:**
```
"Show me all LinkedIn API endpoints"
→ Executes: anysite describe --search "linkedin"
```

**Dataset creation:**
```
"Create a dataset to collect company info and their employees"
→ Creates dataset.yaml with sources and dependencies
→ Executes: anysite dataset collect dataset.yaml
```

**Database loading:**
```
"Load the collected dataset into PostgreSQL"
→ Executes: anysite dataset load-db dataset.yaml -c pg
```

## Key Workflows

### Workflow 1: Single API Call

Execute individual API calls with field selection and output formatting:

```bash
# Basic call
anysite api /api/linkedin/user user=satyanadella

# With formatting
anysite api /api/linkedin/company company=anthropic --format table

# Field selection
anysite api /api/linkedin/user user=satyanadella --fields "name,headline,follower_count"

# Save to file
anysite api /api/linkedin/search/users title=CTO count=50 --format csv --output ctos.csv
```

### Workflow 2: Batch Processing

Process multiple inputs with parallel execution and rate limiting:

```bash
# From text file (one value per line)
anysite api /api/linkedin/user --from-file users.txt --input-key user --parallel 5

# With rate limiting and progress
anysite api /api/linkedin/user --from-file users.txt --input-key user \
  --rate-limit "10/s" --on-error skip --progress --stats

# Pipe from stdin
cat companies.txt | anysite api /api/linkedin/company --stdin --input-key company \
  --format csv --output results.csv
```

### Workflow 3: Dataset Pipeline

Create multi-source datasets with dependencies, transforms, and exports:

**Initialize:**
```bash
anysite dataset init my-dataset
```

**Configure dataset.yaml:**
```yaml
name: my-dataset
sources:
  - id: companies
    endpoint: /api/linkedin/company
    from_file: companies.txt
    input_key: company
    transform:
      filter: '.employee_count > 10'
      fields: [name, url, employee_count]
    export:
      - type: file
        path: ./output/companies-{{date}}.csv
        format: csv

  - id: employees
    endpoint: /api/linkedin/company/employees
    dependency:
      from_source: companies
      field: urn.value
    input_key: companies
    input_template:
      companies:
        - type: company
          value: "{value}"
      count: 5

storage:
  format: parquet
  path: ./data/

schedule:
  cron: "0 9 * * *"
```

**Collect and query:**
```bash
# Preview plan
anysite dataset collect dataset.yaml --dry-run

# Run collection
anysite dataset collect dataset.yaml

# Collect and auto-load into database
anysite dataset collect dataset.yaml --load-db pg

# Query with SQL
anysite dataset query dataset.yaml --sql "SELECT * FROM companies LIMIT 10"

# Interactive SQL shell
anysite dataset query dataset.yaml --interactive
```

### Workflow 4: Database Operations

Manage database connections and load data:

```bash
# Add connection
anysite db add pg    # Interactive prompts

# Test and inspect
anysite db test pg
anysite db schema pg --table users

# Insert data
cat data.jsonl | anysite db insert pg --table users --stdin --auto-create

# Query
anysite db query pg --sql "SELECT * FROM users" --format table
```

## Key Features

**Universal API Access**
- Single `api` command for all endpoints
- Auto-type conversion via schema cache
- Field selection with dot-notation
- Multiple output formats (JSON, JSONL, CSV, table)

**Batch Processing**
- Parallel execution with rate limiting
- Error handling (stop, skip, retry)
- Progress tracking and statistics
- Input from files or stdin

**Dataset Pipelines**
- Multi-source collection with dependencies
- Parquet storage for efficient queries
- Per-source transforms and exports
- Scheduled collection with cron/systemd
- Webhook notifications

**Database Integration**
- Auto-create tables from schema inference
- Automatic FK linking for dependent sources
- Support for PostgreSQL and SQLite
- Upsert with conflict handling

**DuckDB Querying**
- SQL queries on Parquet data
- Dot-notation field extraction
- Interactive SQL shell
- Column statistics and profiling

## How It Works

```
User Request
    ↓
anysite-cli Skill (This)
    ↓
Bash Execution
    ↓
Anysite CLI Commands
    ↓
Anysite API / Local Database
```

Claude interprets your data collection needs and executes the appropriate anysite CLI commands via Bash. All commands use the `anysite` prefix and follow the patterns documented in the skill.

## Common Recipes

### Collect company intel and store in Postgres

```bash
# Initialize dataset
anysite dataset init company-intel

# Edit dataset.yaml with sources, transforms, schedule...
# Then collect and load
anysite dataset collect company-intel/dataset.yaml --load-db pg

# Query results
anysite db query pg --sql "SELECT c.name, COUNT(e.id) FROM companies c JOIN employees e ON e.companies_id = c.id GROUP BY c.name" --format table

# Set up daily schedule
anysite dataset schedule company-intel/dataset.yaml --incremental --load-db pg
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

## Reference Documentation

The skill includes comprehensive reference guides:

- **[SKILL.md](SKILL.md)** - Main skill definition with workflows
- **[api-reference.md](references/api-reference.md)** - Complete CLI command reference
- **[dataset-guide.md](references/dataset-guide.md)** - Dataset pipeline and database guide

## Output Formats

All API commands support multiple output formats:

- `--format json` - Pretty JSON (default)
- `--format jsonl` - Newline-delimited JSON for streaming
- `--format csv` - CSV with headers
- `--format table` - Rich table for terminal display

## Use Cases

### Data Engineering
- Build automated data collection pipelines
- Schedule incremental updates with cron
- Load data into PostgreSQL/SQLite with FK linking
- Query collected data with SQL

### Market Research
- Batch collect company information
- Track competitor employees and activity
- Monitor social media accounts
- Export data for analysis

### Lead Generation
- Collect prospect lists from LinkedIn
- Enrich contact data
- Build custom CRM datasets
- Automate regular updates

### Analytics
- Create multi-source datasets
- Run SQL analytics on collected data
- Export to CSV for visualization
- Schedule regular reports

## Supported Platforms

The anysite CLI provides access to 65+ API endpoints across platforms:

| Platform | Example Endpoints |
|----------|-------------------|
| **LinkedIn** | Users, companies, search, posts, comments, employees |
| **Instagram** | Users, posts, comments, followers |
| **Twitter/X** | Users, posts, search |
| **Reddit** | Posts, comments, subreddits |
| **YouTube** | Videos, channels, comments |
| **Y Combinator** | Companies, founders, batches |
| **SEC** | Company filings, documents |
| **Web** | Page parsing, sitemap extraction |

Use `anysite describe` to discover all available endpoints.

## Configuration

The anysite CLI uses a config file at `~/.anysite/config.yaml`.

**Configuration priority:**
1. CLI arguments (`--api-key`)
2. Environment variables (`ANYSITE_API_KEY`)
3. Config file (`~/.anysite/config.yaml`)
4. Defaults

**Manage config:**
```bash
anysite config set api_key sk-xxxxx
anysite config get api_key
anysite config list
anysite config init
```

## Structure

```
anysite-cli/
├── SKILL.md                      # Skill definition
├── README.md                     # This file
└── references/
    ├── api-reference.md          # CLI command reference
    └── dataset-guide.md          # Pipeline and database guide
```

## Troubleshooting

**"anysite: command not found"**
- Install anysite CLI: `pip install anysite-cli`
- Verify installation: `anysite --version`

**"API key not configured"**
- Set API key: `anysite config set api_key sk-xxxxx`
- Or use env var: `export ANYSITE_API_KEY=sk-xxxxx`

**"Schema cache not found"**
- Update schema: `anysite schema update`
- Required for endpoint discovery and type conversion

**"Database connection failed"**
- Test connection: `anysite db test <name>`
- Check credentials in `~/.anysite/connections.yaml`

## Contributing

Found a bug or have a feature request? Submit an issue at:
https://github.com/anysiteio/agent-skills/issues

## Support

- **GitHub Issues**: [github.com/anysiteio/agent-skills/issues](https://github.com/anysiteio/agent-skills/issues)
- **Skill Documentation**: [SKILL.md](SKILL.md)
- **CLI Documentation**: [docs.anysite.io/cli](https://docs.anysite.io/cli)
- **API Documentation**: [docs.anysite.io/api](https://docs.anysite.io/api)

## License

MIT License - see [LICENSE](../../LICENSE) file for details

---

**Note**: This skill requires the anysite CLI to be installed and configured. Get your API key at [anysite.io](https://anysite.io).
