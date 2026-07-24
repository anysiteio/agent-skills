---
name: anysite-crm-signals
description: Sweep CRM target accounts for buying signals - funding rounds, executive hires, hiring surges, layoffs, news, brand mentions - using Crunchbase, LinkedIn jobs/posts and news sources, then prioritize accounts and optionally stamp signal fields back into the CRM. Use when the user asks "what's new with my accounts", wants signal-based prioritization, account monitoring, or a "who should I reach out to today" answer. Pairs with a cron/loop for always-on monitoring. Requires an active CRM connection.
---

# CRM Signals

Turn a static account list into a prioritized "act now" list. One signal is a guess; 2+
signals within ~30 days is a pattern. Signal-triggered outreach converts several times
better than cold cadence (vendor-reported benchmarks: exec hires and job changes lead,
then funding) — treat the ordering as solid, the exact percentages as marketing.

## Prerequisites

Active CRM connection (`crm_list_connections`). Profile optional for read-only sweeps;
required if the user wants signal fields written back — and then the Writing rules in
`anysite-crm-setup` apply.

## Flow

### 1. Pick the account set

```
crm_query_records(object_type="companies", list_id=<target list> | search=...,
                  properties=[record_id, name, domain, <mapped signal fields if any>])
```

Cap a single sweep at ~50 accounts (each account costs several source calls). More →
propose splitting or narrowing.

### 2. Per-account signal collection

Run the cheap universal chain for every account; add optional probes when relevant.

**Funding / exec hires / news / layoffs (one lookup covers four signals):**
```
execute crunchbase/search {keywords: "<company name>", count: 3}   # resolve alias, once
execute crunchbase/company {company: "<alias>"}
  → funding_rounds[] (date, type, amount, lead investors)
  → leadership_hires[] (date, role, description)
  → news[] (title, date, publisher)
  → layoffs[]
```
Alias resolution is case-sensitive and costs credits — if the profile maps a
`crunchbase_alias` field, read/write it so each account is resolved once, ever.

**Hiring (what they're building):**
```
execute linkedin/search/search_companies {keywords: "<name>", count: 1}
  → urn like "fsd_company:1441" → numeric id "1441"
execute linkedin/search/search_jobs {company: [{"type": "company", "value": "1441"}],
                                     count: 20, sort: "recent"}
```
The `company` filter takes typed objects with the numeric id, not raw URN strings.
Look for roles in the buyer function (e.g. RevOps/Growth/Data roles for a data product).

**Mentions / social activity (optional):**
```
execute linkedin/search/search_posts {keywords: "\"<company name>\"",
                                      date_posted: "past-month", count: 20}
execute techmeme/stories/stories_search {keyword: "<company name>", count: 5}
```
Do NOT use gdelt (times out). Filter false positives for generic company names by checking
the author/context before counting a mention as a signal.

### 3. Score and stack

Per account, count signals in the last 30/90 days, weighted by conversion value:
exec hire in buyer function > funding round > hiring surge in relevant roles > news >
mentions. Layoffs = negative budget signal for expansion, positive for cost-saving pitches —
interpret against the user's product.

Output tiers: **Act now** (2+ fresh signals), **Watch** (1 signal), **Quiet**.

### 4. Report (and optionally write back)

Always produce the human report first: account → signals → suggested angle ("congratulate
on Series B, reference the new VP Sales hire").

If the profile maps signal fields (e.g. `last_signal_type`, `last_signal_date`,
`signal_summary`) and the user wants them stored:
```
crm_upsert_companies(records=[{domain: "<domain>", properties:{...}}], allow_create=false,
                     overwrite_properties=[<signal fields — they are volatile by nature,
                     profile must mark them overwrite>], dry_run=true)
```
Company upserts match ONLY by domain — pull `domain` in step 1; accounts without one are
report-only. → confirm → write → report `run_id`.

## Recurrence

This skill is a one-shot sweep. For always-on monitoring suggest scheduling: a Claude Code
cron / `/loop`, or an operator habit ("run signals every Monday"). Note what was swept and
when in your report so the next run compares against it. Post search granularity is coarse
(`date_posted`: past-24h / past-week / past-month only) — a weekly cadence fits it best;
funding/news items carry their own dates, filter those by date in-session.
