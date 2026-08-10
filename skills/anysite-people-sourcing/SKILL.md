---
name: anysite-people-sourcing
description: Source people from Anysite's 856M-profile LinkedIn database (search_sql_users) with ~60 filters - derived seniority/function, company domain/id incl. past employers (alumni), career-shape (new in role, tenure, promotions), education, skills, lookalike graph, deterministic territory buckets. Use when the user wants to find people in bulk - build persona lists, find buyers/candidates by role and company traits, competitor alumni, "new VP hires", recruiting searches - "найди людей", "собери список персон", "кто недавно сменил работу". For company lists first use anysite-company-sourcing; for one known person use linkedin/user; for CRM push use anysite-crm-prospect.
---

# People Sourcing

`linkedin/search/sql/users` (endpoint `search_sql_users`) searches 856M profiles
with filters no live LinkedIn search has: derived seniority and function,
career-shape maths (tenure, promotions, months in role), past-employer alumni,
company domains, a lookalike graph and deterministic bucketing. It is the bulk
people workhorse; live `search_users` stays the tool for one-off lookups and
namesake disambiguation.

Verified live: filters compose correctly (a seniority_min=head + function=sales
+ US + 51–500 headcount + new-in-role query returned exactly that, with dated
role histories fresh to the current quarter).

## The one semantic that changes how you work

**When more people match than `count`, you get an unbiased SAMPLE — and
repeating the same request returns the SAME people.** Calling again is not
pagination. To take more than 1000, walk deterministic buckets:
`bucket_total: N, bucket_index: 0..N-1` — disjoint, stable parts (also the
built-in territory splitter for teams).

## Filter map (grouped; full contract via `discover(linkedin, search)`)

- **Batch identity:** `alias[]`, `urn[]`, `member_id[]` — exact lookups;
  `last_name[]` (diacritics/case/spacing-folded) + `first_initial[]` for
  "J. Smith" searches.
- **Text DSL** (whitespace=AND, `|`=OR, `"phrase"`, `-not`): `name`, `headline`,
  `summary`, `current_title`, `any_title` (past roles included), `skills`,
  `languages`, `location`.
- **Derived — the crown jewels:** `seniority` / `seniority_min`
  (entry→ic→senior_ic→manager→head→vp→founder→cxo), `function` / `any_function`
  (sales, marketing, engineering, product, data, finance, hr, ops, legal,
  support, exec, …). Cheaper and more recall than title-text fishing — start
  here, refine with `current_title` DSL only if needed.
- **Company:** `current_company_id[]` / `current_company_domain[]` (bare
  domains) / `current_company_name` DSL; `any_company_id/domain` (ever worked),
  **`past_company_id[]` (worked and LEFT — the alumni filter)**; `industry[]` /
  `any_industry[]` (labels, e.g. "has fintech experience"); `employee_range[]`
  or `employee_count_min/max` of the current company.
- **Geo:** `country[]` ISO2 (reliable), `location` DSL (free-text, use for
  cities/metros).
- **Education:** `edu_slug[]`, `edu_institution`, `edu_field`,
  `edu_ended_year_min/max` (≈ graduation cohort / age proxy).
- **Career shape:** `months_in_role_max` (new in role), `months_in_role_min`,
  `months_since_change_max` (recently started OR ended a role — job-change
  radar), `experience_years_min`, `n_roles_*`, `n_companies_*` (stability vs
  hopping), `promotion_count_min` (promoted without changing employer),
  `avg_tenure_months_*`.
- **Quality & coverage:** `profile_score_min` (0–8 completeness — 5+ for
  outreach-grade profiles), and the `has_*` family (`has_current_role`,
  `has_role_dates`, `has_education`, `has_company_size`, `has_engagement`…).
- **Badges/engagement:** `open_to_work`, `hiring`, `verified`, `is_premium`,
  `is_top_voice`, `follower_count_min`, `connection_count_min`.
- **Lookalike graph:** `similar_to: [aliases]` (tight), `also_viewed: [aliases]`
  (looser) — seed with your best customer contacts.
- **Freshness:** `fetched_after` (unix ts) — only recently refreshed profiles.

## Coverage honesty (encode it, don't discover it in production)

Not every profile states a current employer, industry, company size or dated
roles — company/size/tenure filters answer **only for people who do**. The
`has_*` flags make that narrowing explicit instead of silent: when your query
depends on such a field, SET the matching `has_*` flag deliberately and tell the
user the trade-off ("filtering by company size skips people whose company
doesn't state one"). `open_to_work: false` means "no badge observed", not "not
looking". Follower/connection counts exist on a small share of profiles —
gate with `has_engagement` before using them.

## The loop

1. **Start from the most selective structural filters** (seniority/function/
   company/country), never bare `keywords` — `keywords` only helps for
   distinctive words and must always ride along a selective filter.
2. **Probe `count: 10` and validate against the INTENT, not the filters.**
   Structural filters are not semantic: "Director of Sales, 51–200, US" happily
   returns a coffee wholesaler (measured). ICP precision comes from adding
   `industry[]`, `current_company_domain[]` (feed a list from
   `anysite-company-sourcing`), or headline/skills DSL.
3. **Tighten or widen**, re-probe, then fetch; >1000 → bucket walk.
4. **Free re-cuts** with `query_cache`; export with `export_data`.

## Recipes that map to real asks

- *"VPs of Sales at US SaaS 50–500"*: `seniority_min: "vp", function: ["sales"],
  country: ["US"], employee_count_min: 50, employee_count_max: 500,
  industry: [<SaaS-ish labels>], profile_score_min: 5`.
- *"New decision-makers"* (best-converting timing): add `months_in_role_max: 6`.
- *"Competitor alumni"*: `past_company_id: [<competitor ids>]` (+ function/
  seniority) — people who left; `any_company_domain` for ever-worked.
- *"People like our champion"*: `similar_to: ["<champion alias>"]` + filters.
- *Recruiting*: `skills`/`edu_field` DSL + `avg_tenure_months_min` (stability) +
  `open_to_work: true` as a bonus tier, never the only tier.
- *Territory split*: same query, `bucket_total: <reps>, bucket_index: <rep #>`.

## Handoffs and hygiene

- Company lists IN (`current_company_id`/`domain`) come from
  **`anysite-company-sourcing`**; people OUT go to **`anysite-crm-prospect`**
  for dedup + CRM push (its create rules apply), or to `email/find` cascade for
  work emails (verified addresses only).
- **Before outreach, live-verify the shortlist**: the DB is fresh but not
  realtime — for the 20 people you'll actually touch, confirm current role via
  `linkedin/user` (also yields the vanity URL for `user_find_email_by_url`).
  For job-change detection on CRM contacts, `anysite-crm-champions` owns the
  flow (live check is its evidence standard; this DB's
  `months_since_change_max` is its cheap pre-filter).
- Sourcing individuals is personal-data processing: search to the stated
  business need, don't hoard.
