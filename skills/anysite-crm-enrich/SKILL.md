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
- Only email → try reverse lookup first: `execute linkedin/email/email_sql_user` (cached,
  cheap) → remainder via `email_user` (live). Both take ONE email per call — loop, don't
  batch, and expect misses (verified to return empty even for people who are on LinkedIn).
  Then the cascade that actually works, because the CRM knows the name: email domain →
  resolve company (verified, per anysite-mcp recipe) → `organizational_urn` →
  `search_users {first_name, last_name, current_company: [{"type": "company",
  "value": "<id>"}]}` → usually exactly one match, WITH the profile URN as a bonus.
  Company filter mandatory — bare names return namesakes. Still nothing → leave record,
  report.
- Needs email → `user_email` (batch ≤10 profiles, low yield — set expectations honestly).
  A higher-yield `find_email_by_url` exists in the API but may be disabled in MCP — trust
  `discover("linkedin", "user")`; if absent, stop at `user_email` and report coverage as-is.

Re-use cache (`query_cache`) instead of re-fetching anything twice.

### 3. Resolve companies

- By domain — with MANDATORY exact verification on every resolve (the `website` search is
  substring match: stripe.com → Soundstripe; stlabs.com → five other *labs.com companies).
  Default one domain per call; OR-DSL batching is an optimization with a tax — any domain
  that didn't come back exact-matched gets re-queried individually:
  ```
  execute linkedin/search/search_sql_companies {website: "acme.com", count: 5}
  # batched variant: {website: "acme.com|globex.io", count: 10× domains}, then per domain:
  query_cache {conditions: [{"field": "website", "op": "=", "value": "acme.com"}],
               limit: <fetched count>}
  # query_cache filters over the WHOLE cached set; `limit` (default 10) caps only how many
  # rows come BACK. One domain → the default is fine; a multi-domain batch → pass a limit.
  ```
  Only an exact-website match (normalized: lowercase, no protocol/www/path) counts as
  resolved. Gives industry, employee_count, description, locations.

  **No exact match? Do NOT stop there** — a whole class of domains never appears in its own
  substring results (verified: `{website: "stlabs.com", count: 5}` returns five other
  *labs.com companies and never STLabs, a live company with a LinkedIn page). Standard second
  step, ~1cr:
  ```
  execute webparser/parse {url: "https://acme.com", extract_minimal: true}
    → top-level `title` = who they say they are
    → links[] usually carries their own linkedin.com/company/... URL
  execute linkedin/company {company: "<that URL>"}      # exact, no fuzzy matching
  ```
  Only after that fails is the domain genuinely unresolved — report it, never write.
- Deeper firmographics (funding, size range): take the alias from `crunchbase_link`, which
  the domain-resolve above ALREADY returned — free. Only when that field is empty and the
  company is plausibly venture-backed, fall back to the live `crunchbase/search` by name
  (20cr, fuzzy — verify name+domain before trusting it):
  ```
  # crunchbase_link: "https://www.crunchbase.com/organization/acme" → alias "acme"
  execute crunchbase/company {company: "acme"}
  ```
  Only when the profile maps such fields. Normalize `contacts.email` before use — trailing
  dots observed ("founders@reducto.ai."), and a match key with a trailing dot matches nothing.

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
