---
name: anysite-crm-prospect
description: Find net-new leads with anysite (LinkedIn and Crunchbase search, email finding) and push them into the CRM deduplicated - companies first, then contacts with associations. Creating records is gated by the profile's allow_create. Use when the user asks to find new leads/prospects/accounts AND add them to the CRM, build a list in HubSpot, or import prospects. For research without CRM push, prefer anysite-lead-generation. Requires an active CRM connection and profile.
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

1. `execute linkedin/user/user_email` — batches of ≤10 profiles. Warn the user upfront:
   yield is low, a large share of leads will come back email-less.
2. Remainder → `user_find_email_by_url {url: <vanity profile URL>}` — high yield, 50cr
   each: estimate the cost (50cr × remainder) and confirm before running on large lists.
   Vanity URLs only (`/in/name/`, not `/in/ACoA...`). Its `valid_email`/`email_status`
   fields are the deliverability gate: only validated work addresses go into the push;
   the rest stay "found, unverified".
3. Still nothing → **keep the lead in the report**, but know the server requires an email
   to CREATE a contact — email-less leads can only update existing records (matched by
   `linkedin_url`). Report them as "found, pending email"; never silently drop them.

### 3. Dedup against the CRM (before any create)

```
crm_query_records(object_type="companies", search=<domain>)     # or batch by domains
crm_query_records(object_type="contacts", emails=[...])
```
Dedup is reliable by email and domain. By `linkedin_url` it is best-effort only (free-text
`search`) — for a lead with no email whose search comes up empty, do NOT create; put it in
a manual-review bucket and say why. Existing company → reuse its record; existing contact →
update, not create. Report how many were already known — it calibrates the user's trust.

### 4. Push — companies first, then contacts

```
crm_upsert_companies(records=[{domain, properties per profile}],
                     allow_create=true, dry_run=true)            → confirm → write
crm_upsert_contacts(records=[{email | linkedin_url,
                              properties per profile,
                              associate_company_domain: <domain>}],
                    allow_create=true, dry_run=true)             → confirm → write
```
Before pushing, split found emails by domain: personal addresses (gmail/yahoo/outlook and
similar — `user_email` returns mostly these) are NOT work emails — never feed them into a
work-email sequence; keep those leads in a "personal email only" bucket alongside
"pending email", and say so in the report. Server requires email to create a contact;
contacts without email that don't match an existing record will be skipped with a
warning — report them as "found, pending email", don't retry blindly. When associating to companies created in the same run, prefer
`associate_company_id` from the company upsert result. Save `run_id`s.

Note: crm_* tools cannot add records to CRM lists (list_id is read-only in queries). If
the user wants the new leads in a HubSpot list, suggest an active-list filter on a mapped
property (e.g. `lead_source = "anysite"`) — set that property during the upsert instead.

### 5. Report

Created / updated / already-known / pending-email / manual-review. Never call data
"verified" unless a verification step actually ran.

## Boundaries

- Creating records (`allow_create=true`) is permitted here and in `anysite-crm-champions`,
  in both cases only when the profile's `allow_create` agrees. If the user wants research
  without CRM push, hand off to `anysite-lead-generation`.
- Don't set owner, lifecycle stage, or any protected field — routing belongs to the CRM's
  own automation.
- ICP scoring of the found leads → `anysite-crm-score`; lookalike seeding → 
  `anysite-crm-lookalikes`.
