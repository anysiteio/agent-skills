---
name: anysite-crm-prospect
description: Find net-new leads with anysite (LinkedIn and Crunchbase search, email finding) and push them into the CRM deduplicated - companies first, then contacts with associations, into the working list. The only CRM flow where creating records is allowed. Use when the user asks to find new leads/prospects/accounts AND add them to the CRM, build a list in HubSpot, or import prospects. For research without CRM push, prefer anysite-lead-generation. Requires an active CRM connection and profile.
---

# CRM Prospect

Search → resolve → dedup → create. Order matters: companies before contacts, dedup before
create, dry-run before both.

## Prerequisites

Active CRM connection + profile (`allow_create: true` agreed in profile — if not, stop and
ask). Read Writing rules in `anysite-crm-setup`.

## Flow

### 1. Define the search

Get concrete criteria from the user (persona titles, industry, geography, size, stage).
Estimate volume and confirm before running anything large.

**Companies:**
- `execute linkedin/search/search_sql_companies` — main path: `keywords`/`industry_name`
  DSL, `employee_count_min/max`, `country_hq`, up to 1000/call, 1cr-class.
- `execute crunchbase/db/db_search` — when stage/funding filters matter
  (`last_funding_type`, `last_funding_date_after`, `investors`).
- `execute crunchbase/search` — live, adds `hiring: true`, `it_spend_*`, `valuation_*`
  filters (20cr/50 — use for precision, not volume).

**People at those companies:**
- `execute linkedin/search/search_users {job_title, current_company: [urn] |
  company_keywords, location, count}` — never bare `keywords` alone (empty results).
  Company URNs come from the company search results.

### 2. Emails (cheap-first cascade)

1. `execute linkedin/user/user_email` — batches of ≤10 profiles.
2. Remainder → `execute linkedin/user/find_email_by_url` (vanity URL, ~75% yield, 50cr) —
   estimate cost on large lists before running.
3. Still nothing → **keep the lead**. Contacts upsert matches by `linkedin_url`; email can
   be enriched later. Never drop a fitting lead over a missing email.

### 3. Dedup against the CRM (before any create)

```
crm_query_records(object_type="companies", search=<domain>)     # or batch by domains
crm_query_records(object_type="contacts", emails=[...])         # plus linkedin_url search
```
Existing company → reuse its record (maybe enrich); existing contact → this is an update,
not a create. Report how many were already known — it calibrates the user's trust.

### 4. Push — companies first, then contacts

```
crm_upsert_companies(records=[{domain, properties per profile}],
                     allow_create=true, dry_run=true)            → confirm → write
crm_upsert_contacts(records=[{email | linkedin_url,
                              properties per profile,
                              associate_company_domain: <domain>}],
                    allow_create=true, dry_run=true)             → confirm → write
```
Server requires email to create a contact; contacts without email that don't match an
existing record will be skipped with a warning — report them as "found, pending email",
don't retry blindly. Add created contacts to the working list from the profile. Save
`run_id`s.

### 5. Report

Created / updated / already-known / pending-email, with the list link. Never call data
"verified" unless a verification step actually ran.

## Boundaries

- This is the ONLY crm-* flow with `allow_create=true`. If the user wants research without
  CRM push, hand off to `anysite-lead-generation`.
- Don't set owner, lifecycle stage, or any protected field — routing belongs to the CRM's
  own automation.
- ICP scoring of the found leads → `anysite-crm-score`; lookalike seeding → 
  `anysite-crm-lookalikes`.
