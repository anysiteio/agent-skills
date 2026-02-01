# Anysite CLI API Reference

## anysite api

Call any API endpoint. Parameters are `key=value` pairs, auto-typed via schema cache.

```
anysite api <endpoint> [key=value ...] [OPTIONS]
```

### Output Options
```
--format, -f TEXT        json|jsonl|csv|table (default: json)
--fields TEXT            Comma-separated fields to include (dot-notation supported)
--exclude TEXT           Comma-separated fields to exclude
--fields-preset TEXT     Built-in preset: minimal|contact|recruiting
--compact                Compact JSON (no indentation)
--output, -o PATH        Save to file
--append                 Append to existing output file
--quiet, -q              Suppress non-data output (use for piping)
```

### Batch Input Options
```
--from-file PATH         Input file (txt/JSONL/CSV)
--stdin                  Read from stdin
--input-key TEXT         Parameter name for input values
--parallel, -j INT       Parallel requests (default: 1)
--delay FLOAT            Delay between requests (seconds)
--rate-limit TEXT        Rate limit: "10/s", "100/m", "1000/h"
--on-error TEXT          Error handling: stop|skip|retry (default: stop)
```

### Progress Options
```
--progress/--no-progress   Show/hide progress bar
--stats                    Display statistics after completion
--verbose                  Detailed debug output
```

### Examples
```bash
# Single call
anysite api /api/linkedin/user user=satyanadella --format table

# Batch with rate limiting
anysite api /api/linkedin/user --from-file users.txt --input-key user \
  --parallel 5 --rate-limit "10/s" --on-error skip --format csv --output results.csv

# Pipe to jq
anysite api /api/linkedin/company company=anthropic -q | jq '.employee_count'

# Pipe to database
anysite api /api/linkedin/user user=satyanadella -q --format jsonl \
  | anysite db insert mydb --table profiles --stdin --auto-create
```

---

## anysite describe

Discover and inspect API endpoints.

```
anysite describe [endpoint] [OPTIONS]
```

```
--search, -s TEXT    Search endpoints by keyword
--json               Output as JSON
--quiet, -q          Show only paths
```

### Examples
```bash
anysite describe                          # List all endpoints
anysite describe /api/linkedin/company    # Full endpoint details
anysite describe --search "company"       # Search by keyword
anysite describe --json -q                # Machine-readable output
```

Output shows: endpoint path, description, input parameters (name, type, required), output fields (name, type).

---

## anysite config

Manage configuration in `~/.anysite/config.yaml`.

```bash
anysite config set <key> <value>    # Set value (supports nesting: defaults.format)
anysite config get <key>            # Get value
anysite config list                 # Show all settings
anysite config path                 # Show config file location
anysite config init                 # Interactive setup
anysite config reset --force        # Reset to defaults
```

### Config Priority
1. CLI arguments (`--api-key`)
2. Environment variables (`ANYSITE_API_KEY`, `ANYSITE_BASE_URL`)
3. Config file (`~/.anysite/config.yaml`)
4. Defaults

---

## anysite schema

Manage the API schema cache.

```bash
anysite schema update    # Fetch and cache OpenAPI spec
```

Schema is cached to `~/.anysite/schema.json`. Required for `anysite describe` and auto-type conversion in `anysite api`.

---

## Global Options

```
--api-key TEXT     Override API key
--base-url TEXT    Override API base URL
--debug            Enable debug output
--no-color         Disable colored output
--version, -v      Show version
```

---

## Common API Endpoints

### LinkedIn
```
/api/linkedin/user                    user=<username>
/api/linkedin/company                 company=<alias>
/api/linkedin/search/users            keywords=<text> count=<n>
/api/linkedin/company/employees       companies=[{type,value}] count=<n>
/api/linkedin/user/posts              urn=<urn> count=<n>
/api/linkedin/post/comments           urn=<urn> count=<n>
```

### Instagram
```
/api/instagram/user                   user=<username>
/api/instagram/user/posts             user=<username> count=<n>
```

### Twitter/X
```
/api/twitter/user                     user=<username>
/api/twitter/user/posts               user_id=<id> count=<n>
```

### Web
```
/api/web/parse                        url=<url>
```

Use `anysite describe --search <keyword>` to discover more endpoints.
