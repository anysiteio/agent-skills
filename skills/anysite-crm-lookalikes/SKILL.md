---
name: anysite-crm-lookalikes
description: Derive the actual ICP from the CRM's closed-won/best customers and find lookalike companies with anysite bulk search (LinkedIn company DB, Crunchbase filters), scored and deduplicated against the CRM. Use when the user asks to find companies like their best customers, expand the target list, derive their real ICP from data, or seed a prospecting campaign. Requires an active CRM connection with some won/customer records.
---

# CRM Lookalikes

Your real ICP is written in your closed-won list, not in your pitch deck. Extract the
pattern, then search 70M+ companies for more of it.

## Flow

### 1. Collect the seed set

```
crm_query_records(object_type="companies", list_id=<customers list> | search=...,
                  properties=[record_id, name, domain, industry, <size/stage if mapped>])
```
Need the user's help to identify "best": a customers list, a lifecycle/status field, or an
explicit pick of 10–30 names. Fewer than ~8 seeds → warn that the pattern will be weak.

### 2. Profile the seeds

Resolve each seed to structured firmographics — exact verification is mandatory on every
resolve (the `website` search is substring match and can return only look-alike domains;
a wrong seed poisons the whole ICP pattern downstream):
```
execute linkedin/search/search_sql_companies {website: "seed1.com", count: 5}   # per seed
# batched variant allowed, but: query_cache needs explicit limit (default 10!), and any
# seed without an exact match must be re-queried individually
query_cache {conditions: [{"field": "website", "op": "=", "value": "seed1.com"}], limit: 50}
```
A seed with no exact website match is excluded from profiling (say so), not guessed —
or resolved via crunchbase → contacts.linkedin_url → linkedin/company.
Plus `crunchbase/company` for stage/funding on a subset (venture-relevant seeds only).
Derive the pattern in-session and SHOW it:

```
Industries: X (60%), Y (25%) · Size: 11-200 dominant · Geo: US+UK 80%
Stage: seed-B · Common traits: has API docs page, hiring in data roles, ...
```

The user confirms/edits the pattern — it's their ICP, the data only proposes it.

### 3. Search for lookalikes

- `execute linkedin/search/search_sql_companies` — industry_name/keywords DSL from the
  pattern, employee_count band, country filter, count up to 1000.
- `execute crunchbase/db/db_search` — when stage matters (`last_funding_type`,
  `last_funding_date_after`); `crunchbase/search` live for `hiring: true` or
  `shares_investors_with: [<seed investors>]` (a strong hidden-similarity filter).
- Niche supplements per pattern: `yc/search/search_companies` (early-stage), `builtin`
  (US tech hubs), `producthunt` (product-led).

Search wide, profile narrow: the searches themselves are cheap even at count 1000, but do
NOT enrich every candidate — score on the fields the search already returned, and fetch
extra evidence (crunchbase lookups etc.) only for the top ~50. State the credit estimate
before any per-candidate enrichment.

### 4. Score and dedup

Score candidates against the confirmed pattern (same rubric discipline as
`anysite-crm-score` — weighted criteria, evidence per company, no guessed values).
Dedup against the CRM by domain (`crm_query_records`) — existing accounts drop out or get
flagged "already in CRM, unworked".

### 5. Hand off

Output: top-N table (name, domain, why-it-matches, score) + the confirmed ICP pattern for
reuse. Pushing to CRM → `anysite-crm-prospect` (its dedup/create/working-list rules apply);
finding people at these companies → same skill. This skill itself writes nothing.
