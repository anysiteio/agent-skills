---
name: anysite-crm-inbound
description: Instant read-only verdict on ONE inbound lead - who they really are, whether the company is real and ICP-fit, route suggestion and talking points - in 2-5 anysite calls. Takes an email, a name+company, or a linkedin_url; checks the CRM for prior history but writes nothing. Use when a single new lead just arrived (demo request, reply, form fill, DM) and the user wants a fast qualify/route decision. For batch prospecting use anysite-crm-prospect; for accounts already worked in the CRM use anysite-crm-account-brief.
---

# CRM Inbound — one lead, one minute

Every skill in this pack is batch-shaped except the most frequent moment in GTM life:
a single lead just landed and someone asks "is this real / are they our ICP / who takes
the call?". This skill answers that in 2 calls (verdict) to 4–5 calls (full mini-brief).
Strictly read-only.

## Input

Whatever the user has: an email, a name + company, a linkedin_url, or a forwarded
demo-request text. Extract identifiers yourself; don't interrogate the user.

## Flow (cheap-first, stop as soon as the verdict is clear)

### 1. Identify the person and company

- **linkedin_url** → `execute linkedin/user/user {user: <url>}` → done.
- **email with a work domain** → resolve the company by domain (anysite-mcp recipe: exact
  verify; `webparser/parse` fallback for common-token domains) → `organizational_urn` →
  `search_users {first_name, last_name, current_company: [{"type": "company",
  "value": "<id>"}]}`. Note: `email_sql_user` reverse lookup is a cheap first try but
  verified to miss often — don't stop on its empty result.
- **email with a personal domain** (gmail etc.) → reverse lookup try, else name+company if
  the form/message carries them. A lead reachable ONLY via personal email = flag it.
- **name + company** → resolve company → `search_users` with the company filter (bare
  names return namesakes).

### 2. Company reality check (1 call, often already done in step 1)

The verified `search_sql_companies` row gives industry, employee_count, locations,
description, `crunchbase_link`, `organizational_urn`. Funding stage matters → 
`crunchbase/company` via the free alias from `crunchbase_link` (skip for obviously
non-venture companies).

### 3. CRM history (free, crm_* reads)

```
crm_query_records(object_type="contacts", emails=[...])       # known already?
crm_query_records(object_type="companies", search="<domain>")  # account history?
```
Existing record with an owner → this is a routing question, not a research question; say
who owns it. Closed-lost history → the verdict must mention it.

### 4. Verdict

One compact block, in this order:
1. **Real?** — person verified (profile ↔ claimed company match), company verified.
2. **ICP fit** — against the profile's known criteria (or the user's stated ICP); one line
   of evidence per criterion, "unknown" where no data.
3. **Route** — new/known, suggested owner if CRM history names one, urgency (fresh funding
   or hiring in the buyer function raises it).
4. **3 talking points** with dates and links (recent posts, funding, launches, hiring).
5. **Red flags** — personal-email-only, unresolvable company, competitor employee,
   student/job-seeker pattern.

## Rules

- **Read-only.** No upserts, no dry-runs. If the user wants the lead in the CRM afterwards,
  hand off to `anysite-crm-prospect` (its dedup and create rules apply).
- Never claim "verified" on an unverified identity — the namesake trap applies to inbound
  more than anywhere (people misspell their own company in forms).
- Cost: ~2 credits for a verdict, 4–5 calls for the full brief. Cheap enough to run on
  every inbound; say so if the user hesitates.
