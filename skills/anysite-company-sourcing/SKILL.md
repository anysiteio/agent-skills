---
name: anysite-company-sourcing
description: The craft of sourcing companies from Anysite's 70M+ LinkedIn company database (search_sql_companies) - turning a fuzzy ICP into per-field DSL filters that return real matches instead of token soup. Fixes the default failure mode where naive keyword queries return companies from the wrong country, wrong industry and stub pages. Use when the user asks to find/source companies, build a company list, complains that company search results are bad or irrelevant, or needs a target-account universe - "найди компании", "плохие результаты поиска компаний", "source accounts". For people at those companies use anysite-people-sourcing; for funding-stage filters use crunchbase; for pushing into a CRM use anysite-crm-prospect.
---

# Company Sourcing

`linkedin/search/search_sql_companies` searches 70M+ companies and is the single
best bulk company tool in the catalog — **and its naive use is the single most
common source of garbage lists.** Measured live, same intent, same day:

- `{keywords: "AI startup San Francisco"}` → **1 relevant of 5**: a Tel-Aviv
  gaming-data firm, a Sydney fintech and a Ho-Chi-Minh beauty e-commerce all
  matched — each had the token "startup" somewhere in its description and
  "San Francisco" among *secondary* office locations.
- The same intent as structured filters (below) → **5 of 5** genuine SF AI
  companies in the right size band.

The difference is the whole skill. Never ship results from a naive query.

## Why naive queries fail (mechanics, not opinion)

1. `keywords` token-matches across ALL text fields — name, description,
   specialities, hashtags, **and the locations array** — so "San Francisco"
   matches a Hanoi company with a two-person SF sales office.
2. Results are ordered by `last_modified_at` desc: **recently edited first, not
   most relevant**. Page one is whoever touched their page this month.
3. Millions of company pages are stubs. Without hygiene filters they dominate.
4. `employee_count_range` can contradict `employee_count` in the same record
   (measured: 305 employees with range "11-50"). Never filter or segment by the
   range string.

## The method: decompose intent into fields

Take the user's ICP sentence apart and map each fragment to its OWN field:

| Intent fragment | Field | Notes |
|---|---|---|
| "based in X" | `country_hq: ["US"]` + `headquarter_location: "\"san francisco\""` | token-aware; NEVER the `locations` field — that matches branch offices |
| "present in X" (offices count too) | `country_any` | this is the only right use of the locations array |
| "does AI / fintech / logistics" | `specialities` OR `industry_name` OR `description` together, not specialities alone | `industry` array wants URNs; `industry_name` resolves labels — see the specialities caveat below |
| "in the orbit of company X" | `similar_organizations: "\"fsd_company:<id>\""` | queryable filter, not just an output field — the reverse-graph expander; see below |
| "startup / SMB / enterprise" | `employee_count_min` / `employee_count_max` | integers; ignore `employee_count_range` entirely |
| "founded recently" | `founded_on_min` | year |
| named company lookup | `name` or `alias` DSL + exact verification | never trust first hit; resolve by domain via the anysite-mcp resolve recipe |
| always, every query | `is_active: true, has_website: true, min_description_length: 100` | the hygiene trio kills stubs and dead pages |

DSL in every text field: whitespace = AND, `|` = OR (no spaces around it),
`"phrase"` = exact phrase, `-token` = NOT. Example:
`specialities: "\"artificial intelligence\"|\"machine learning\" -agency"`.
(`hashtags` is the exception — exact element match, not substring.)

**Specialities caveat:** self-declared tags are the highest-signal field WHEN
present, but hot young startups often leave them blank — measured: 2/10 in a
US/Software slice had empty `specialities[]`, one of them Hebbia ($160M-funded,
empty short_description too). So `specialities` is a widening OR alongside
`industry_name` and `description`, never the sole gate, or you silently drop
exactly the fresh-funded targets a list is built for.

## The loop (never skip step 3)

1. **Build** the per-field query from the decomposition above.
2. **Probe** with `count: 10`.
3. **Validate against the intent, not the filters**: for each of the 10 check
   HQ country/city, what the company actually does (short_description), and
   `employee_count`. Fewer than ~8 on target → the query is wrong, not the data:
   move misused fragments to their proper field, add `-tokens`, tighten
   phrases. On target → widen coverage with `|` synonyms in the same fields
   (`"machine learning"|"computer vision"|"nlp"`), re-probe.
4. **Fetch** the real volume (`count` up to 1000). More than 1000 matches →
   split by size bands / countries / founded ranges into disjoint queries.
5. **Free re-cuts**: `query_cache` on the result for sorting, counting,
   sub-segmenting — don't re-execute.

## Two hard limits to state up front (TAM planning)

Unlike people search, company search has **no `bucket_total` and no count-only
mode**. That means:

- **You cannot ask "how big is my ICP universe" cheaply** — there's no total
  count without pulling rows. Size the split blind, or probe representative
  sub-slices and extrapolate; tell the user the number is an estimate.
- **Results are ordered `last_modified_at` desc, so a >1000 match is a
  recency-HEAD, not a sample** — and card freshness lags (a US/Software/11–200
  slice topped out at pages ~13 months old, which is also why `employee_count`
  drifts from reality). Splitting by size/country/founded is the only way to full
  coverage, and each sub-query must itself be < 1000 or you're back to a recency
  head inside the band. Use `last_modified_after` both as a freshness lever and as
  the basis for a "new since last run" sweep. Dedup on the band boundaries by
  `urn` (`query_cache uniq`).

## Read the bonus fields — they're the handoff

Every row carries, at no extra cost:

- `organizational_urn` (`company:<id>`) → **feeds `anysite-people-sourcing`**
  (`current_company_id`) and `search_jobs` directly;
- `website` → domain for CRM matching and `current_company_domain` people filters;
- `crunchbase_link` → free crunchbase alias, skip the live 20cr search;
- `similar_organizations[]` → both an output list AND a **queryable filter** (the
  bigger lever — see below);
- `specialities[]` → the company's own vocabulary, reuse it to widen synonyms.

## similar_organizations as a filter — the reverse-orbit expander

Verified live: `similar_organizations: "\"fsd_company:1441\""` (Salesforce) +
`country_hq:["US"]` + size band returned 8 companies, all 8 carrying Salesforce in
their own similar-orgs graph. This is "who sits in the orbit of company X" — the
right tool for two jobs no keyword query does well:

- **ICP expansion from a seed account** — feed your best customer's `fsd_company`
  id, get its competitive/adjacent set.
- **Competitor-adjacency lists** — the closest this skill gets to "companies like
  my competitor". (It is NOT the competitor's customers — for that,
  `anysite-crm-competitor-intel` via wappalyzer/reviews.)

Noisy — roughly 3/8 were on-target in the test — so always combine with
`industry_name`/`specialities` and run the probe-validate loop. Batch-fetching the
output `similar_organizations[]` by `urn:[...]` (≤12 at a time) is the weaker,
one-hop version; the filter is the scalable one.

## When a different tool is right

- Funding stage / investors / valuation → `crunchbase/db/db_search` (dates as
  unix ts, count ≤100) or live `crunchbase/search` (`hiring`, `it_spend` filters).
- One known company by domain → the resolve recipe in `anysite-mcp` (substring
  trap: stripe.com → Soundstripe; verification mandatory).
- Early-stage / launches → `yc/search/search_companies`, `producthunt`, `betalist`.
- People at the sourced companies → `anysite-people-sourcing` with the URNs/domains
  from step "bonus fields". CRM push → `anysite-crm-prospect` (dedup + create rules).
