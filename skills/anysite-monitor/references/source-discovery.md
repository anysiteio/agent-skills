# Source Discovery — find the right endpoints at setup time, never from a list

This skill ships **no catalog of sources**. Anysite has 566 sources / 3300+
endpoints and they change; any list baked into a skill file is wrong within
weeks, and worse, it silently steers monitors toward endpoints that no longer do
what the name suggests. Instead, every monitor **compiles its own source specs
during onboarding** from the live catalog, verifies each one with a real call,
and stores the verified spec in the config. Runs then execute what was proven to
work, not what someone guessed.

## Two ways to browse the catalog — both work, pick by surface

**Path A — MCP-only (always available, no shell, no web fetch, free).** The MCP
tools enumerate themselves at every level, so you can walk the catalog blind:

| You need | Call | You get back |
|---|---|---|
| all source names | `discover(source: "__list__", category: "x")` | error + `available_sources` (all 566) |
| categories of a source | `execute(source, category: "__list__", endpoint: "x", params: {})` | error + `available_categories` |
| endpoints of a category | `execute(source, category, endpoint: "__list__", params: {})` | error + `available_endpoints` |
| full contract of a category | `discover(source, category)` | params, `response_fields`, `llm_hint`, errors |

These error responses are the documented discovery mechanism, not a hack — they
cost nothing and cannot return stale data. **This is the default path.** It needs
no shell, no network policy exception, and works identically in every surface.

**Path B — text catalog (faster when a shell is available).**
`https://docs.anysite.io/llms-full.txt` lists all ~3200 endpoints with one-line
descriptions, as `- POST /api/<source>/<category>/<endpoint> — what it returns`.
~680 KB: **grep it, never read it whole**, and never fetch the 12 MB
`openapi.json` — it will blow up any client.

```bash
curl -s https://docs.anysite.io/llms-full.txt -o /tmp/anysite-catalog.txt   # once per setup
grep -i "^- POST" /tmp/anysite-catalog.txt | grep -iE "review|rating" | head -30
grep "POST /api/reddit/" /tmp/anysite-catalog.txt          # every endpoint of one source
```

Its advantage over Path A is *semantic search*: you can grep the descriptions by
what the user said ("pricing", "layoffs", "reviews") instead of guessing which
source name might cover it. Use it when you have shell access; if the surface
forbids shell or blocks the fetch, drop to Path A without apology — the only
thing you lose is keyword search over descriptions, and the source-name list from
`discover` is itself a usable menu.

Note on the section headers in that file: most are path-style (`### /reddit`) but
some curated groups are human-named (`### LinkedIn Companies`). Don't parse
headers — grep the `- POST /api/...` lines; they always carry source, category
and endpoint.

## Procedure: goal → verified source spec

Run this per signal the user actually asked for. Four steps, the first two free.

**1. Find candidates (free).** Path B: grep the catalog by the user's own words
plus synonyms. Path A: pull `available_sources`, pick plausible source names for
the signal, then list their categories and endpoints via the `__list__` probes
above. Either way, shortlist 1–3 endpoints per signal.

Prefer an endpoint that *lists* items (a search/feed) over one that fetches a
single known item, and a cached/DB endpoint (`*/sql/*`, `*/db/*`) over a live one
when both exist.

**2. Get the exact contract (free).** `discover(source, category)` — on Path B the
category comes from the catalog path, on Path A from `available_categories`. The
response is authoritative — it lists every endpoint of that category with:

- `params` — **read these for a time filter** (`posted_after`, `published_after`,
  `date_posted`, `time_filter`, `last_modified_after`, `sort: recent`…). Many
  Anysite endpoints do have one. If it exists, the monitor MUST use it: it cuts
  the fetch to the window since the last run instead of re-pulling history that
  the ledger will just discard. The ledger still runs — it dedupes and detects
  edits — but it should not be doing the time filtering.
  Record it in the spec with its shape, because runs convert `last_ok_run` into
  a value differently per shape:
  - `unix_ts` (`posted_after`, `published_after`) → seconds since epoch of
    `last_ok_run` **minus a safety overlap** (one cadence interval, min 6 h).
    Overlap costs nothing — the ledger dedupes it — while a gap loses items.
  - `enum` (`time_filter: hour|day|week|month`, `date_posted: past-24h|past-week|
    past-month`) → the **smallest bucket that fully covers the gap** since
    `last_ok_run`, one size up if the gap is close to the boundary. If the gap
    exceeds the largest bucket (missed runs), take the largest and say in the
    digest that coverage may be partial.
  - `sort: recent` with no window → not a time filter; rely on `max_items`.
- `response_fields` — **pick the fingerprint from this list**, not from
  imagination. Prefer a platform id/URN field (`urn`, `id`, `activity_urn`,
  `t3_id`) over a URL; use a URL only when there is no id, and normalize it.
- `llm_hint` and `errors` — resolution requirements (many endpoints need an id
  resolved from a search endpoint first) and what a miss looks like.

Note: `discover` does **not** enumerate the categories of a source — a wrong
category returns a bare "not found". That is why step 1 (catalog grep) exists;
the path in the catalog line is the category.

**3. Probe once (cheap, costs credits).** Call `execute` with the smallest
possible `count` on a real target from the interview. Confirm:

- the endpoint returns items at all for this target (a monitor on an empty
  source is the most common silent failure);
- the field you chose as fingerprint is present and stable-looking on every item;
- whether the item carries a timestamp you can show in the digest;
- for page-style sources: whether the meaningful content is extractable (if
  `webparser/parse` comes back near-empty, switch to `webparser/render`).

If the probe fails, go back to step 1 — do not register a monitor with an
unverified source. Record the probe result and date in the spec.

**4. Write the spec into the config.** See `config-schema.md` → `sources[]`. It
carries source/category/endpoint, the params template (with the time-filter
param named explicitly), the fingerprint field path, whether to content-hash,
and `verified_at`. A run never re-derives any of this — it fills in the time
window and executes.

## Choosing a fingerprint from response_fields

| What the source returns | Fingerprint | Hash content? |
|---|---|---|
| Any platform id / URN field | `<source>:<id field>` | no |
| Only a permalink URL | `<source>:<normalized url>` | no |
| A page (pricing, landing, changelog, tech stack) | `page:<normalized url>` | **yes** — hash only the meaningful extract (plan names + prices, feature list), never raw HTML: nav, banners and tokens change every fetch and fake "changed" |
| A count that moves (followers, review count, rating) | `<source>:<entity>:<metric>` | yes — store the value as the hash and report the delta; set a threshold so a daily ±3 doesn't ping |

An unstable fingerprint is the #1 way a monitor turns into a spam machine: every
run reports everything as new. If in doubt, run the probe twice and confirm the
fingerprints match across calls.

## Re-verification

Sources change. When a run gets zero items from a source that used to produce
them, or an error that isn't a rate limit, mark that source `degraded` in the
digest and re-run steps 1–3 for it at the next setup conversation. Never silently
drop a signal the user asked for.
