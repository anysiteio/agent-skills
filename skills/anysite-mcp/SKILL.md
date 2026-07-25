---
name: anysite-mcp
description: How to use the anysite MCP server effectively - the universal meta-tools (discover, execute, get_page, query_cache, export_data), the source map for GTM signals (funding, hiring, tech stack, reviews, news, launches), email finding cascades, and cost-aware calling patterns. Consult this before any anysite data work. Use when unsure which source or endpoint covers a data need, how to paginate or re-filter cached results, or how to combine sources into a signal chain.
---

# Anysite MCP — usage guide

The anysite MCP exposes hundreds of data sources through five universal meta-tools. This skill
is the map: how to call them, which sources cover which GTM need, and how to not waste credits.

## The five meta-tools

| Tool | Purpose | Credits |
|---|---|---|
| `discover(source, category)` | List endpoints + exact params for a source/category | free |
| `execute(source, category, endpoint, params)` | Run an endpoint; returns first 10 items + `cache_key` | paid |
| `get_page(cache_key, offset, limit)` | Page through a cached result | free |
| `query_cache(cache_key, conditions, sort_by, sort_order, aggregate, group_by, limit, offset)` | Filter/sort/aggregate cached data with SQL-like ops | free |
| `export_data(cache_key, format)` | Export cached data (CSV/JSON) | free |

### Rules that prevent 90% of failures

1. **Always `discover` before `execute`.** Endpoint names and params are not guessable, and a
   wrong source name returns the full source list — a wrong guess self-corrects for free.
   `execute` takes the endpoint NAME exactly as discover returns it (`products_reviews`),
   never a REST path segment (`reviews`) — resolution is an exact-match lookup.
2. **Never guess identifiers.** LinkedIn aliases, URNs, Crunchbase aliases, Greenhouse board
   tokens are unpredictable. Resolve them through the search endpoint of the same source first.
3. **Re-use the cache.** `execute` returns a `cache_key`; further filtering, sorting, counting
   and paging of that result is free. Never re-run `execute` to look at the same data twice.
4. **Cheap-first cascade.** When several endpoints can answer, call the cached/DB one first
   (`*/db/*`, `*sql*` endpoints, ~1 credit) and the live one only for the remainder.
5. **Estimate volume before bulk runs — plan-aware.** First know the user's plan (the CRM
   profile stores it after setup; if unknown, ask once: MCP Unlimited or credit-based?).
   - **Credit-based plan:** before anything above ~100 calls, state the estimate
     (`N targets × credits-per-call`) and get a nod. Prefer cheap DB endpoints, batch hard.
   - **MCP Unlimited:** credit warnings off, but keep batch sizes sane anyway — the real
     limits are latency and upstream rate limits, so cap sweeps the same way and say
     "this will take ~N minutes" instead of a price.
6. **Avoid `gdelt`** — it has repeatedly timed out in practice. Use techmeme or google news
   instead.

## GTM source map

**Company discovery (bulk):**
- `linkedin/search/search_sql_companies` — the workhorse. Up to 1000 companies per call with
  DSL filters (keywords, industry_name, employee_count_min/max, country_hq, founded_on_min/max,
  has_website). Also does batch lookup by `urn` list and search by `website`.
  ⚠️ **`website` search is SUBSTRING match, ordered by last_modified. Verification is
  MANDATORY on every resolve — position in the results means nothing.** Verified live:
  `{website: "stripe.com", count: 1}` → Soundstripe; `{website: "stlabs.com", count: 5}` →
  five *labs.com companies, none of them stlabs.com (common tokens flood the result even in
  a single-domain call). The domain-resolve rules:
  1) **Verify exact `website` match** (normalize both sides: lowercase, strip
     protocol/`www.`/path) on EVERY resolve, single or batched. No exact match =
     **unresolved** — never write anything to the CRM for it; wrong-company data lands in
     blank fields where nobody will catch it.
  2) Default: one domain per call, small count. OR-DSL batching
     (`{website: "a.com|b.io", count: 10× domains}`) is an optimization with a verification
     tax: a domain with a common token can be flooded out of the batch entirely — every
     domain that didn't come back exact-matched must be re-queried individually.
  3) `query_cache` filters over the WHOLE cached set (verified) but returns at most `limit`
     rows (default 10) — pass an explicit `limit` when you expect more matches back. Sanity
     rule: `aggregate {op: "count"}` should equal the `total` from execute; if not, page
     with `get_page` before concluding anything.
  4) A whole class of domains never appears in its own substring results (common-token
     domains like stlabs.com) — so the website's own page is the STANDARD second step, not
     an emergency: `webparser/parse {url: "https://<domain>", extract_minimal: true}` →
     top-level `title` says who they are, `links[]` usually carries their own
     linkedin.com/company/... URL → `linkedin/company` for the exact URN (verified, ~1cr).
     Live shape on stlabs.com: `title: "STLabs — Intelligent Service Management"` at the TOP
     level, while `metadata` came back `{}` and `cleaned_html` empty — read `title`, and treat
     `metadata` as a fallback only, not the primary location.
     Secondary fallback: `crunchbase/search` by name → `contacts.linkedin_url`. Name search
     alone is never a source of truth.
  Bonus from a successful resolve: the `search_sql_companies` row already carries
  `crunchbase_link` (free crunchbase alias — skip the live 20cr search) and
  `organizational_urn` (`company:<id>` — the numeric id goes straight into `search_jobs`).
  ⚠️ For company SIZE use `employee_count`, never `employee_count_range` — the two fields
  can contradict each other in the same record (verified: Clay returns `employee_count:
  1465` alongside `employee_count_range: "201-500"`). The range field looks like the natural
  key for size segmentation and would misfile that company by ~3x, silently. Fall back to
  the range only when the exact count is empty, and say that you did.
- `crunchbase/db/db_search` — filters by funding stage, last funding date, investors,
  employee range; count ≤100, dates as Unix timestamps. 1 credit/result. Response includes
  `funding_rounds[]`, `leadership_hires[]`, `layoffs[]`, `news[]`, `technologies[]`,
  `employees[]`.
- `crunchbase/search` (live, 20cr/50) — adds `hiring`, `event`, `spotlight`,
  `shares_investors_with`, `it_spend_*`, `revenue_*`, `valuation_*` filters. Check discover
  for its date format — it differs from db_search.
- `yc/search/search_companies`, `betalist`, `tracxn/companies/companies_search` —
  early-stage supplements (check discover for exact endpoint names before calling).

**Company detail:** `crunchbase/company` (by alias — resolve via `crunchbase/search` first),
`linkedin/company`. One `crunchbase/company` call also carries free extras worth reading:
`bombora_surges[]` (B2B intent topics — but they show what THAT company's staff researches,
i.e. what they BUY; treat as a signal only when a topic matches what the user sells),
`related.competitors[]`, `predictions.funding_score`, `awards[]`. Coverage caveat:
`leadership_hires[]` is often EMPTY for smaller companies — absence of the field is not
absence of hires. Normalize `contacts.email` (trailing dots observed: "x@y.ai.").
A third resolve path when crunchbase is already fetched: `contacts.linkedin_url` →
`linkedin/company` → exact URN (verified; bypasses both fuzzy searches).
Note: `owler` endpoints need an owler alias and its search has no name/keyword parameter —
not usable for looking up a named account.

**Engagement graph (who interacted with content):** `linkedin/post/post_comments`,
`post_reactions`, `post_reposts` and `linkedin/company/company_posts` (~1cr/10) — answers
"who paid attention to this content", incl. people outside your title filters. Identifiers:
comments/reposts carry a vanity alias; reactions give only an obfuscated `/in/ACoAA...` URL
plus `internal_id` — `user_email` accepts the `internal_id`, never the obfuscated URL.
Honest scaling: volume follows the SEED's audience, not the target's importance (large brand
post → dozens of engagers; 80-person company → 0–2 per post), and on a small account those
few are mostly the company's OWN staff plus engagement farmers (verified: 3 of 4 commenters
were employees) — filter by the author's company first and expect nothing left. Use this on
seeds with a real audience (a competitor's page), not on SMB target lists. For small accounts
the reliable nugget is `company_posts` → `mentioned[]`: hiring announcements name new people
with their vanity aliases. `linkedin/company/company_employee_stats` (1cr) gives
function/skill/location breakdown — cross-check totals against `employee_count` from
`linkedin/company` before trusting absolutes, and never sum the `locations` array: its
buckets are nested (US ⊃ California ⊃ SF Bay Area), so summing double-counts badly. Its
`llm_hint` promises seniority and growth trends that the response does not contain.

**Ads as a budget signal:** the `ad-transparency` sources (incl. LinkedIn Ad Library) are
untapped — a company running B2B ads is telling you it has budget and who its ICP is.
Listing is cheap; per-ad detail is a separate call each (N+1) — budget accordingly.

**People:** `linkedin/search/search_users` (use `job_title` + `current_company` or
`company_keywords`; never bare `keywords` alone — returns empty), `linkedin/user` (full
profile, needs alias/URL/URN — never guess the alias), `linkedin/user/user_posts`,
`user_experience`, `user_comments`.

**Email finding (cascade, cheap → expensive):**
1. `linkedin/user/user_email` — batch up to 10 profiles, cheap, low yield. Truths from live
   testing: it returns mostly PERSONAL addresses (gmail/yahoo), one row per EMAIL — not per
   profile (group by `alias`/`internal_id` or you duplicate contacts), and its `found` field
   is always true (useless as a check). Personal addresses are not work emails — never
   present them as outreach-ready.
2. `linkedin/user/user_find_email_by_url {url}` — high yield but expensive (50cr), run only
   on the remainder after step 1. Takes a VANITY profile URL (`/in/satyanadella/`);
   URN-style URLs (`/in/ACoA...`) are rejected — get the vanity URL from `linkedin/user`
   first. Response includes `email_status` and `valid_email` — check them and pass only
   valid work emails onward; an address with a bad status is a bounce, not a find.
3. No work email found → keep the lead anyway; CRM contact upserts match by `linkedin_url`
   too (but note: creating a NEW contact requires an email — no email means update-only).

**Reverse lookup (email → person), reliability order:**
1. `linkedin/email/email_sql_user` (cached DB) → `email_user` (live) — cheap, but verified
   to return empty even for people who are definitely on LinkedIn. Try, don't rely.
2. The cascade that works when you know the name (a CRM does): email domain → resolve the
   company (verified, see above) → `organizational_urn` → `search_users {first_name,
   last_name, current_company: [{"type": "company", "value": "<id>"}]}` → usually exactly
   one match, delivered WITH the `fsd_profile` URN needed for `user_posts`. The company
   filter is mandatory — a bare name returns namesakes.

**Hiring signals:**
- `linkedin/search/search_jobs` — by company; works for any company. The `company` param
  takes `[{"type": "company", "value": "<numeric id>"}]`. `linkedin/search/search_companies`
  returns `urn` ALREADY in that object form — pass it through as-is. Only `search_sql_companies`
  returns string URNs (`fsd_company:<id>`) — there, extract the numeric id yourself. And
  verify the company before using its URN: the first search hit is often a namesake
  (verified: "Notion" → NOTION Media Production first, the real notionhq second) — check
  name + industry + alias.
- `greenhouse/jobs/jobs_search {board_token, count}` — full descriptions via `content=true`;
  `ashby/jobs/jobs_search {board_name, count}` — descriptions always included. Both need the
  company slug; 412 = wrong token, fall back to linkedin jobs.
- `glassdoor` (resolve employer id via `companies_search` first), `builtin`, `adzuna` —
  supplements; `blind/layoffs/layoffs_search` for layoffs.

**Tech stack:** `wappalyzer/technologies` — technology slug → who uses it (`top_websites`
sample), category alternatives (`alternatives[]`), country/language breakdown. Note: it is a
sample, not an exhaustive site list.

**Software reviews:** `g2/products/products_search` (search only),
`capterra/products/products_reviews` (includes `switched_from[]` and `switching_reason` —
direct competitor-switch evidence), `trustradius` and `getapp` `products_reviews`,
`gartner/products` — competitor review mining. Employer sentiment:
`glassdoor/companies/companies_ratings` (employer id via `companies_search`), `kununu`,
`comparably`, `blind/companies/companies_reviews`.

**News & mentions:** `techmeme/stories/stories_search {keyword, count}` (archive) and
`stories_front_page`; `google/news/news_articles_search`;
`linkedin/search/search_posts` (keyword or `mentioned` company URN; `date_posted` accepts
only past-24h / past-week / past-month); `reddit`, `hackernews`, `twitter`, `bluesky` for
community chatter; `substack`/`medium` for content signals.

**Launches & products:** `producthunt/launches/launches_search`,
`producthunt/products/products_alternatives`, `products_reviews`; `indiehackers`,
`kickstarter`/`indiegogo` for niche ICPs.

**Web fallback:** `webparser/parse` (static pages) → `webparser/render` (JS-rendered).
Covers any URL when no named source fits. Web search: `duckduckgo/search`, `brave/search`.

## Combining into signal chains

The standard pattern for account signals (used by the crm-signals skill):

```
company domain
  → search_sql_companies {website} + exact verify        (firmographics
     ↳ crunchbase_link → alias FREE   ↳ organizational_urn)
  → crunchbase/company {alias} → funding_rounds, leadership_hires, news, layoffs, bombora
  → search_jobs {company: [{type, value from organizational_urn}]} → what they hire for
  → search_posts (company name, past-month) → mentions
```
Three paid calls per account instead of four — the live crunchbase/search drops out.

Stack signals: one signal is a guess, 2–3 signals within ~30 days is a pattern worth acting on.

## Working with CRM

CRM read/write goes through the `crm_*` tools, NOT through execute. Before any CRM write,
consult the `anysite-crm-profile` skill (field mapping law) and the Writing rules in
`anysite-crm-setup`. The server enforces fill-blank policy, protected fields and write logging
regardless of what you pass.
