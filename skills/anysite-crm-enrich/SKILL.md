---
name: anysite-crm-enrich
description: Enrich existing CRM records (HubSpot contacts and companies) with fresh data from anysite - job titles, LinkedIn profiles, firmographics, emails. Reads records from the connected CRM, finds gaps in mapped fields, fills them from LinkedIn/Crunchbase/web sources, and writes back safely (fill-blank, dry-run, undo). Use when the user asks to enrich CRM records, fill missing fields, update contact or company data, or refresh a CRM list. Requires an active CRM connection and the anysite-crm-profile mapping.
---

# CRM Enrich

Fill gaps in existing CRM records with anysite data. The most common flow: pull a list from
the CRM, enrich only what is missing, write back only to mapped fields.

## Prerequisites

1. `crm_list_connections` → an `active` connection. Missing → send the user to
   `/anysite-crm-setup` (or Profile → CRM Integration in the dashboard).
2. The `anysite-crm-profile` skill exists → its mapping is law. Missing → minimal safe mode:
   standard properties only, recommend running setup.
3. Read the Writing rules in `anysite-crm-setup` — they apply to every write below.

## Flow

### 1. Scope — what to enrich

Ask (or infer from the request): which records and which fields. Pull them:

```
crm_query_records(object_type="contacts", list_id=<working list> | search=... | emails=[...],
                  properties=[record_id + match keys + mapped target fields])
```

Page through everything in scope. Locally split records into:
- **complete** — all mapped target fields filled → skip (report count),
- **enrichable** — has a match key (email / linkedin_url / domain) and gaps,
- **unmatchable** — no key at all → report, do not guess identities.

### 2. Resolve identities (contacts)

- Has `linkedin_url` → `execute linkedin/user/user` (full profile: title, company, location).
- Only email → reverse lookup: `execute linkedin/email/email_sql_user` (cached, cheap) →
  remainder via `email_user` (live). Both take ONE email per call — loop, don't batch.
  No profile found → leave record, report.
- Needs email → `user_email` (batch ≤10 profiles, low yield — set expectations honestly).
  A higher-yield `find_email_by_url` exists in the API but may be disabled in MCP — trust
  `discover("linkedin", "user")`; if absent, stop at `user_email` and report coverage as-is.

Re-use cache (`query_cache`) instead of re-fetching anything twice.

### 3. Resolve companies

- By domain: `execute linkedin/search/search_sql_companies {website: "<domain>", count: 1}` —
  batch by looping domains; gives industry, employee_count, description, locations.
- Deeper firmographics (funding, size range): `crunchbase/search` by name → alias →
  `crunchbase/company` — only when profile maps such fields (cost-aware: 20cr each).

### 4. Write back

Build upsert records keyed by the CRM `record_id` you pulled in step 1 — never re-search
the CRM for a record you already hold, and never create from an enrich flow:

```
crm_upsert_contacts(records=[{record_id, properties:{<mapped fields only>}}],
                    allow_create=false,
                    overwrite_properties=[<only fields marked overwrite in profile>],
                    dry_run=true)
```

Show the diff (old → new, counts of fill/skip), get confirmation, re-run with
`dry_run=false`. Companies go through `crm_upsert_companies`, which matches ONLY by
`domain` — always include `domain` in the properties you pull in step 1; a company record
without a domain is unwritable (report it, don't improvise a match). Keep request batches
reasonable (≤100 records per call). Save the returned `run_id`.

### 5. Report

Written / filled-blank-skipped (`fill_blank_skip` = policy working, not an error) /
enum warnings / unmatchable. Mention `crm_undo(run_id)` availability. If the profile maps
`anysite_last_enriched_at`, it was stamped by the mapping — say so.

## Rules specific to enrichment

- Never write a value you did not get from a source this session. No invented data.
- A profile field with no fresh source value → leave it out of `properties` entirely.
- Enum targets (e.g. industry): pick from the CRM schema `options` list, translating the
  source value; no match → skip with a note, don't force.
- >10 records or any overwrite → dry-run first, always.
