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
5. **Estimate volume before bulk runs.** `N targets × credits-per-call`. Say the number to the
   user before launching anything above ~100 calls.
6. **Avoid `gdelt`** — it has repeatedly timed out in practice. Use techmeme or google news
   instead.

## GTM source map

**Company discovery (bulk):**
- `linkedin/search/search_sql_companies` — the workhorse. Up to 1000 companies per call with
  DSL filters (keywords, industry_name, employee_count_min/max, country_hq, founded_on_min/max,
  has_website). Also does batch lookup by `urn` list and search by `website` — use it to
  resolve domains from a CRM into LinkedIn company records.
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
`linkedin/company`. Note: `owler` endpoints need an owler alias and its search has no
name/keyword parameter — not usable for looking up a named account.

**People:** `linkedin/search/search_users` (use `job_title` + `current_company` or
`company_keywords`; never bare `keywords` alone — returns empty), `linkedin/user` (full
profile, needs alias/URL/URN — never guess the alias), `linkedin/user/user_posts`,
`user_experience`, `user_comments`.

**Email finding (cascade, cheap → expensive):**
1. `linkedin/user/user_email` — batch up to 10 profiles, cheap, low yield.
2. `linkedin/user/find_email_by_url` — by vanity URL, high yield but expensive (50cr).
   **May be disabled on the server** — trust `discover("linkedin", "user")`: if it is not
   listed there, it does not exist; stop at step 1 and say so honestly.
3. No email found → keep the lead anyway; CRM contact upserts match by `linkedin_url` too
   (but note: creating a NEW contact requires an email — no email means update-only).

**Reverse lookup (email → person):** `linkedin/email/email_sql_user` (cached DB) →
`linkedin/email/email_user` (live) for the remainder.

**Hiring signals:**
- `linkedin/search/search_jobs` — by company; works for any company. The `company` param
  takes `[{"type": "company", "value": "<numeric id>"}]` — extract the id from the
  `fsd_company:<id>` URN returned by `search_companies` (raw URN strings are not accepted).
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
company name/domain
  → crunchbase/search (resolve alias, once; cache it)
  → crunchbase/company → funding_rounds, leadership_hires, news, layoffs
  → linkedin search_jobs(company urn) → what they hire for
  → linkedin search_posts(company name, past-month) → mentions
```

Stack signals: one signal is a guess, 2–3 signals within ~30 days is a pattern worth acting on.

## Working with CRM

CRM read/write goes through the `crm_*` tools, NOT through execute. Before any CRM write,
consult the `anysite-crm-profile` skill (field mapping law) and the Writing rules in
`anysite-crm-setup`. The server enforces fill-blank policy, protected fields and write logging
regardless of what you pass.
