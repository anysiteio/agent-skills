# Storage Backends

The ledger must survive between headless scheduled runs. Each run is a fresh
session, so state lives outside the session. Pick the highest tier that is
actually reachable by a token-authenticated headless run.

## Selection algorithm (run at setup)

1. If the user explicitly asked for a database or already has a monitoring DB →
   `db`.
2. Else if a hosted file connector is connected and works headless (Google Drive
   via the hosted `Google_Drive` MCP — NOT the device-bridge one, which needs the
   laptop online) → `gdrive`.
3. Else → `embedded`. Always available; the safe default. Zero setup.

State the choice to the user and why. Record it in `config.storage.backend`.

Headless caveat: tools proxied through the user's desktop (`mcp__remote-devices__*`,
device bridge) are NOT reliable in a scheduled run — the laptop may be closed.
Only depend on hosted, token-auth MCPs (Anysite, hosted Google connectors) and the
scheduled-task tools for anything a run needs.

## Backend: embedded (default)

The ledger lives inside the scheduled task's own prompt, right after the config.
The run rewrites the task each time via `update_trigger`.

Read: the ledger JSON is already in the prompt you were invoked with — parse it.
If absent → baseline run.

Write (BEFORE delivering the digest — a reported-but-unsaved delta repeats next run):
1. Build the refreshed prompt = Run-mode instruction + the **unchanged config
   block** + the updated ledger block (minified). Keep them as two separate
   blocks so a ledger write can never corrupt the monitor's definition.
2. Call `update_trigger` with `trigger_id` = this task's id and `prompt` = that.
   Stamp `last_ok_run` in the ledger only after the call succeeds.
   - You need the trigger id. It's passed in the run prompt at setup (store
     `config.monitor.trigger_id`), or find it via `list_triggers` by name.
3. Keep it bounded: apply the rolling window (drop entries older than
   `retention_days`) before writing. If the minified ledger exceeds a few hundred
   KB or ~1500 entries, add a note to the digest recommending a move to `gdrive`.

Trade-offs: zero setup and fully self-contained, but prompt-size bound, and the
config lives in the same prompt — so a malformed write can brick the monitor, not
just lose a delta. Rewrite the whole prompt in one call, never partially. Mitigate by always writing the ledger
as the last action and keeping the window tight.

## Backend: gdrive (recommended when available)

A single JSON file per monitor, e.g. `anysite-monitor-<id>.json`, in Google Drive.

Uses the hosted `Google_Drive` tools (load via ToolSearch: `search_files`,
`read_file_content`, `create_file`, plus metadata as needed).

Setup: `create_file` the initial ledger (`{"ledger_version":1,...,"items":{}}`)
and store its file id in `config.storage.file_id`.

Read: `read_file_content` on `config.storage.file_id` → parse JSON. If the id is
missing, `search_files` by name, else treat as baseline and create it.

Write: overwrite the file with the updated ledger. If the connector has no
in-place update, `create_file` a new version and update `config.storage.file_id`
(via `update_trigger` on the task, storing only the small id — not the whole
ledger — in the prompt). Apply the rolling window before writing.

Trade-offs: not bound by prompt size, survives offline, easy for the user to
inspect. Needs the Google connector authorized for headless use.

## Backend: db (scale / multi-monitor)

For large volumes or many monitors, follow the Anysite CLI dataset pattern
(Postgres/ClickHouse): a `seen_items` table keyed by `(monitor_id, fingerprint)`
with `last_seen` and optional `content_hash`. Diffing becomes a SQL anti-join
(fetched rows LEFT JOIN seen WHERE seen IS NULL) and change detection a hash
comparison; persist is an upsert plus a `DELETE ... WHERE last_seen < now() -
retention`.

Only choose this when a DB connection is reachable headless (a hosted/cloud DB
with a connection string the run can use, or the Anysite CLI configured with a
persistent target). A device-bridge Postgres that requires the laptop online is
not headless-safe — fall back to `gdrive`/`embedded` for the ledger even if the
user has one for other work.

## First-run detection

Baseline = no ledger found (embedded: none in prompt; gdrive: file absent/empty;
db: table empty for this monitor). On baseline, seed all fingerprints, then follow
the config's `baseline` mode (`silent` default, or `initial_snapshot`).
