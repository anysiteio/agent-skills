---
name: anysite-crm-champions
description: Detect job changes among CRM contacts (champion tracking) - find contacts who moved to a new company, flag past champions at new accounts, update the CRM and propose re-engagement plays. The single highest-converting B2B signal (12-25% to meeting). Use when the user asks to track job changes, find champions who moved, check if contacts are still at their companies, or clean up outdated contact-company links. Requires an active CRM connection and contacts with linkedin_url or email.
---

# CRM Champion Tracking

People move; CRMs rot (typically ~25%/year of contacts change jobs). A past champion at a
new company is warm pipeline. This skill finds the movers and turns them into plays.

## Prerequisites

Active CRM connection. Profile mapping for any writes. Contacts need `linkedin_url` or
`email` — run `anysite-crm-enrich` first if coverage is poor.

## Flow

### 1. Pick who to track

Priority order (ask the user which tier, default to the first available):
1. **Key champions** — closed-won contacts, power users, admins (if such a list/field exists),
2. **Open/closed-lost opportunity contacts**,
3. The working list / everyone with a linkedin_url.

```
crm_query_records(object_type="contacts", list_id=... | search=...,
                  properties=[record_id, email, linkedin_url, <company field>, jobtitle])
```

Cap a run at ~100 contacts (one profile call each); more → propose batching by tier.

### 2. Detect moves

Per contact:
- `linkedin_url` → `execute linkedin/user/user {user: <url>}` → current experience.
- email only → `execute linkedin/email/email_sql_user {email}` → profile (live `email_user`
  for the remainder).

Compare the profile's **current company** against the CRM company. Normalize before
comparing (legal suffixes, casing, known rebrands); when unsure, treat as "same" — false
move-alarms erode trust. Also catch **promotions** (same company, new title) — a secondary
but useful signal.

### 3. Classify and propose plays

- **Moved to an in-ICP company** → hottest: "past champion at new account" play. Propose:
  update old record, create the new-company record and a fresh contact entry.
- **Moved out of ICP** → update CRM only.
- **Promoted** → update title; suggest congratulation touch if they're an active deal contact.
- **Profile gone/private** → report, no change.

### 4. Write back (with explicit user confirmation)

Job-change writes touch the fields most likely to collide with CRM automations, so always
dry-run and show the diff, even for small batches:

- Update the old contact: new title/company per profile mapping (these need `overwrite` in
  the profile — job data is volatile by design).
- New account: `crm_upsert_companies` (match by domain, `allow_create` per profile).
- Optionally new email at the new company: `execute linkedin/user/find_email_by_url` →
  include in the update.
- Association: pass `associate_company_domain` so the contact links to the new company;
  the server keeps the old association unless `overwrite_associations=true` — set it only
  if the user confirms the contact should be re-linked.

Save `run_id`s; mention `crm_undo`.

### 5. Report

Table: contact → old → new → play. Lead with movers into ICP accounts. Include suggested
opener anchored on the shared history ("you used X at <old company>...") — personalization
from facts, never invented familiarity.
