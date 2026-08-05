# Config & Ledger Schema

The config is the **compiled output of onboarding**: every source in it was found
in the live catalog, checked with `discover`, and probed with a real call. A run
never re-derives sources — it executes what's here. That is what makes headless
runs cheap and repeatable.

## Monitor config

```json
{
  "monitor": {
    "id": "acme-watch-2026",
    "name": "Acme + market watch",
    "created_at": "2026-08-02",
    "schedule_cron_utc": "17 6 * * *",
    "timezone": "Europe/Amsterdam",
    "trigger_id": "<id returned at registration>",
    "baseline": "silent",
    "retention_days": 45,
    "delivery": "email",
    "focus": null,
    "storage": { "backend": "embedded" },
    "diff_mode": "script",
    "targets": [
      { "label": "Acme", "handles": { "domain": "acme.com", "linkedin_urn": "1441", "greenhouse_board": "acme" } }
    ],
    "sources": [
      {
        "signal": "new job postings",
        "target": "Acme",
        "source": "greenhouse",
        "category": "jobs",
        "endpoint": "jobs_search",
        "params": { "board_token": "acme", "count": 40 },
        "time_filter": null,
        "max_items": 40,
        "fingerprint": { "template": "job:acme:{id}", "fields": ["id"] },
        "hash_fields": null,
        "label_field": "title",
        "url_field": "url",
        "verified_at": "2026-08-02"
      },
      {
        "signal": "pricing changes",
        "target": "Acme",
        "source": "webparser",
        "category": "parse",
        "endpoint": "parse",
        "params": { "url": "https://acme.com/pricing", "extract_minimal": true },
        "time_filter": null,
        "max_items": 1,
        "fingerprint": { "template": "page:{url}", "fields": ["url"] },
        "hash_fields": ["plans_text"],
        "extract_note": "keep plan names + prices only, drop nav/footer",
        "verified_at": "2026-08-02"
      }
    ]
  }
}
```

### `sources[]` — one entry per signal×target

| Field | Meaning |
|---|---|
| `signal` | plain-language name, used as the digest sub-heading |
| `source`/`category`/`endpoint` | exactly what `discover` returned — never guessed |
| `params` | the call template; the run fills in the time window if `time_filter` is set |
| `time_filter` | `{"param":"posted_after","kind":"unix_ts","overlap_hours":6}` \| `{"param":"time_filter","kind":"enum","buckets":["hour","day","week","month"],"baseline":"day"}` \| `null`. **Set it whenever `discover` shows one** — fetching only since the last run is the single biggest cost saver. `baseline` names the window used on the seed run (there is no `last_ok_run` yet); conversion rules in `source-discovery.md` |
| `max_items` | page cap. If a run returns exactly this many new items, the window overflowed: warn in the digest and suggest a tighter cadence or a bigger cap |
| `fingerprint` | `template` with `{field}` placeholders + the `fields` it needs, chosen from the endpoint's real `response_fields` |
| `hash_fields` | fields whose combined text is hashed for change detection; `null` = new-items-only signal |
| `label_field`/`url_field` | what to print in the digest line |
| `verified_at` | date of the probe. Older than ~90 days and repeatedly empty → re-verify |

Other fields: `baseline` = `silent` (default) or `initial_snapshot`; `delivery` =
`email` | `push` | `telegram` | `slack` | `session` (session only for dry runs);
`focus` = optional string prioritizing some signals in the digest;
`storage.backend` = `embedded` | `gdrive` | `db` (see `storage-backends.md`);
`diff_mode` = `script` (default, runs `scripts/ledger.py`) or `in_session` when the
scheduled surface has no shell/Python — decided and tested at setup, not at run time.

## Ledger schema

Separate JSON object, kept apart from the config so a ledger write can never
corrupt the monitor's definition.

```json
{
  "ledger_version": 1,
  "monitor_id": "acme-watch-2026",
  "last_run": "2026-08-11",
  "last_ok_run": "2026-08-11",
  "runs": 6,
  "items": {
    "job:acme:4021847": { "s": "2026-08-11" },
    "page:acme.com/pricing": { "s": "2026-08-11", "h": "9f2c1a3d" }
  }
}
```

`s` = last seen (drives the rolling window), `h` = content hash where the source
is hashed. `last_ok_run` is stamped only after a successful persist — if it lags
`last_run`, the previous run reported deltas it failed to save, so treat the next
run's repeats as expected and say so.

Persist rules: upsert `s` for everything seen, update `h` where hashed, drop
entries older than `retention_days`. `scripts/ledger.py diff` does all of this
deterministically — use it rather than diffing by hand.

## URL normalization

Applied by `ledger.py` to every URL-based fingerprint: lowercase host, strip
tracking params (`utm_*`, `fbclid`, `gclid`, `ref`…), drop fragment and trailing
slash. If a source's URLs carry other volatile params, note them in
`extract_note` and strip them before building the fingerprint.
