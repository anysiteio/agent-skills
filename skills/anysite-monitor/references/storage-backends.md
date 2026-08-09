# Storage Backends

State must survive between headless scheduled runs. There are two ways to get
that: a **ledger** in external storage (the default design), or — for a specific
class of monitors — **no ledger at all**: diff each fetch against the previous
runs' fetches, which Anysite's own request cache keeps for 7 days across
sessions (`ledger_mode: "cache_diff"`, below). Pick the mode first, then (for
ledger mode) the backend. Pick the highest tier that is
actually reachable by a token-authenticated headless run.

## Selection algorithm (run at setup)

0. **`cache_diff` (ledgerless)** if ALL of: cadence ≤ 2 days; every source's
   fingerprint is a stable platform id; the user confirms digest-tolerance ("a
   missed item occasionally resurfacing, or being lost after a failed delivery,
   is acceptable"). Zero storage, zero persist step, no update_trigger rewrites.
   NOT for: weekly+ cadences (one skipped run rides the 7-day TTL edge),
   must-not-miss monitors, or long-memory suppression (an item gone >7 days
   resurfaces as new).
1. Else if the user explicitly asked for a database or already has a monitoring
   DB → `db`.
2. Else if a hosted file connector is connected and works headless (Google Drive
   via the hosted `Google_Drive` MCP — NOT the device-bridge one, which needs the
   laptop online) → `gdrive`.
3. Else → `embedded`. Always available; the safe ledger default. Zero setup.

## Mode: cache_diff (ledgerless)

The state IS the request cache. Each run:

1. **Find prior fetches (free).** `search_requests(endpoint=<spec's endpoint>,
   query=<a stable target handle from params>, since=<now − 7d>, limit=10)` —
   match by endpoint + handle substring, NOT exact params (the time-window param
   differs run to run). Collect the cache_keys of prior runs for this source.
2. **Union prior ids (free).** For each prior cache_key, `query_cache` the
   fingerprint field (with an explicit `limit` ≥ items) and union the id sets
   across ALL prior fetches in the window — diffing against only the latest
   fetch resurfaces anything that skipped one run.
3. **Diff in session.** new = current ids − union. For hashed sources, "changed"
   = current extract hash ≠ hash of the extract recomputed from the LATEST prior
   cache's raw content (it is still in the cache — nothing was stored).
4. **No persist.** The current fetch's own cache entry becomes history for the
   next run automatically.

Baseline: no prior fetches found → this run seeds by simply fetching; emit the
one-line init message. Same happens after a gap longer than the cache TTL — a
quiet re-seed with a note, not a flood.

Failure honesty: in ledger mode a failed persist causes *repeats*; in cache_diff
a failed delivery causes *silent loss* (the fetch is cached, so the next run
treats those items as seen). State this at setup and don't offer the mode for
monitors where a missed item has a cost.

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
