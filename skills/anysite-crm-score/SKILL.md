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
or send the user to re-run `/anysite-crm-setup`.

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
- Base firmographics: `execute linkedin/search/search_sql_companies {website: <domain>}` —
  batch resolve; industry, employee_count, locations, description.
- Stage/funding (only if the rubric needs it): `crunchbase/search` → alias →
  `crunchbase/company` (cache aliases; skip for obviously non-venture companies).
- Hiring probe (only if in rubric): `linkedin/search/search_jobs` by company URN.

Skip any evidence source whose rubric weight is zero. State per-company data gaps —
a company with missing data gets a confidence note, not a silently low score.

### 3. Score

Apply the rubric in-session. For every company keep one line of evidence per criterion.
No evidence → that criterion scores 0 with an "unknown" marker, never a guessed value.

### 4. Write and report

```
crm_upsert_companies(records=[{record_id, properties:{<score field>: <value>}}],
                     allow_create=false, overwrite_properties=[<score field>],
                     dry_run=true)  → confirm → write → run_id
```
Write ONLY the score field (plus `scored_at` if mapped). Report: top-N with evidence lines,
distribution summary, gaps. Contacts scoring (persona fit) works the same way against
contact records with `linkedin/user` evidence — same rubric-first discipline.

## Boundaries

- Score ≠ routing: never touch owner/stage/status based on a score.
- Re-scoring overwrites by design — that's why the profile must explicitly mark the field.
- Intent-level signals (fresh funding, exec hires) belong to `anysite-crm-signals`; this
  skill measures fit. The two compose: fit × recency of signals = priority.
