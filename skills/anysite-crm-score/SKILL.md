---
name: anysite-crm-score
description: Score CRM companies or contacts against the user's ICP using anysite data (firmographics, funding stage, hiring, tech signals) and write the score into the single mapped score field. Use when the user asks to score leads, rank accounts, prioritize the pipeline, or apply ICP criteria to CRM records. Requires an active CRM connection and a profile with a score field marked overwrite.
---

# CRM Score

Deterministic-ish prioritization: explicit rubric, evidence per company, score written to
exactly one mapped field.

## Prerequisites

Active CRM connection. Profile must map a score target field with `mode: overwrite`
(scores are re-computed by design). Not mapped → offer to store nothing and just report,
or send the user to re-run `/anysite-crm-setup`. The Writing rules in `anysite-crm-setup`
apply to every write. Cap a scoring run at ~50 companies and state the credit estimate
(evidence calls × price) before fetching; more → propose tiers or a narrower list.

## Flow

### 1. Fix the rubric BEFORE fetching data

Get ICP criteria from the user, or derive them with `anysite-crm-lookalikes` logic from
closed-won records. Turn them into a written rubric with weights, e.g.:

```
industry match (0-3), size band (0-2), geo (0-1), funding stage (0-2),
hiring in buyer function (0-1), tech/context signal (0-1)  → 0-10
```

Show the rubric, get a nod. The rubric goes into the report verbatim — scores must be
explainable and reproducible.

### 2. Fetch evidence (cheap-first)

```
crm_query_records(object_type="companies", ...) → record_id, name, domain, existing fields
```
- Base firmographics: `search_sql_companies` by `website` — default one domain per call;
  OR-DSL batching (`{website: "a.com|b.com|...", count: 10× domains}`) is an optimization
  with a verification tax (see the anysite-mcp resolve recipe). Never `count: 1` — the search
  is substring match, and a common-token domain comes back with only look-alikes even in a
  single-domain call. Verify the exact `website` match per domain via `query_cache` with an
  explicit `limit` (default is 10 — a 20-domain batch needs more). Unverified match = no
  evidence, score that criterion "unknown"; a domain that never comes back exact-matched is
  resolved via `webparser/parse` on the site itself, per the same recipe.
- Stage/funding (only if the rubric needs it): take the alias from `crunchbase_link`, which
  the domain-resolve above ALREADY returned — free, no lookup. Only when it is empty and the
  company is plausibly venture-backed, fall back to the live `crunchbase/search` (20cr, fuzzy
  — verify name+domain) → `crunchbase/company`. Skip entirely for obviously non-venture
  companies. Note `leadership_hires[]` is unusable as an ICP criterion for SMB/startup targets
  — measured empty on 6 of 6 live accounts, including a 281-person one.
- Hiring probe (only if in rubric): prefer the numeric id from `organizational_urn` of the
  domain-resolve you already did → `search_jobs {company: [{"type": "company", "value":
  "<id>"}], count: 20}`. No resolve → `search_companies {keywords: name, count: 5}` +
  verify by name/industry (its `urn` is already the `{type, value}` object).
- Team-shape evidence (great for "engineering-led vs sales-led" criteria):
  `linkedin/company/company_employee_stats` (1cr, needs company URN) — absolute headcounts
  by function (verified: Engineering 26 / Sales 14 on a 79-person company). Don't sum its
  `locations` array (nested buckets: US ⊃ state ⊃ metro); cross-check totals against
  `employee_count`.

Company size in the rubric: use `employee_count`, never `employee_count_range` — the two
can contradict each other in one record (verified: 1465 vs "201-500"), and the range would
misfile the size band silently. Range only as fallback when the count is empty, noted.

Skip any evidence source whose rubric weight is zero. State per-company data gaps —
a company with missing data gets a confidence note, not a silently low score.

### 3. Score

Apply the rubric in-session. For every company keep one line of evidence per criterion.
No evidence → that criterion scores 0 with an "unknown" marker, never a guessed value.

### 4. Write and report

```
crm_upsert_companies(records=[{domain: "<domain>", properties:{<score field>: <value>}}],
                     allow_create=false, overwrite_properties=[<score field>],
                     dry_run=true)  → confirm → write → run_id
```
Company upserts match ONLY by domain — pull `domain` when querying records; companies
without one get a score in the report but no write. Write ONLY the score field (plus
`scored_at` if mapped). Report: top-N with evidence lines,
distribution summary, gaps. Contacts scoring (persona fit) works the same way against
contact records with `linkedin/user` evidence — same rubric-first discipline.

## Boundaries

- Score ≠ routing: never touch owner/stage/status based on a score.
- Re-scoring overwrites by design — that's why the profile must explicitly mark the field.
- Intent-level signals (fresh funding, exec hires) belong to `anysite-crm-signals`; this
  skill measures fit. The two compose: fit × recency of signals = priority.
