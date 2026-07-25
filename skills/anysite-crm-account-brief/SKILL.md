---
name: anysite-crm-account-brief
description: Pre-meeting brief for an account that lives in the connected CRM - what the CRM already knows (fields, contacts, history) merged with fresh outside data (funding, exec changes, news, key people's recent LinkedIn activity) into a one-page brief with talking points. Read-only. Use when the user preps for a call/meeting/demo with a CRM account or asks for account research in the context of their pipeline. Requires an active CRM connection - for briefs on arbitrary companies without CRM context, other research skills apply.
---

# CRM Account Brief

One account, twenty minutes of research, one page the user can read in the elevator.

## Flow

### 1. CRM context (if connected)

```
crm_query_records(object_type="companies", search="<name or domain>")
crm_query_records(object_type="contacts", search="<domain>")   # linked people
```
What we already know: fields, mapped scores/signals, who we talk to, what stage. The brief
must not contradict the CRM — where outside data disagrees (e.g. new title), flag it as
an update candidate for `anysite-crm-enrich`/`anysite-crm-champions`.

### 2. Company snapshot

- `execute crunchbase/search {keywords: name}` → alias (verify name+domain, first hit may
  be a namesake) → `crunchbase/company` → funding history, `leadership_hires[]` (often empty
  for smaller companies — not a negative), `news[]`, `layoffs[]`, employee range, investors.
  Same response, free extras for the brief: `related.competitors[]` (their competitive set),
  `bombora_surges[]` (what their team is researching — mention only if relevant to the
  meeting), `predictions.funding_score` (likelihood of a next round).
- `search_sql_companies {website: "<domain>", count: 10}` + exact `website` match check
  (substring search returns look-alike domains — verify before trusting) → description,
  specialities, locations, employee_count.

### 3. What's happening now

- Hiring: `search_companies {keywords: "<name>", count: 5}` → pick the right company by
  name/industry/alias (first hit is often a namesake), its `urn` comes back already as the
  `{type, value}` object → `search_jobs {company: [<urn object>], sort: "recent", count: 20}`
  — what functions they're growing (that's their current priorities, use in talking points).
- News: crunchbase `news[]` first (already fetched); add
  `techmeme/stories/stories_search {keyword: "<name>", count: 5}` for tech companies.
- Employer sentiment (optional, for bigger companies): resolve the employer id first via
  `glassdoor/companies/companies_search {company: "<name>", count: 1}` → then
  `companies_ratings {company: <id>}`; `blind/companies/companies_reviews` — morale,
  attrition themes. Use with care in messaging — background context, never a quoted opener.

### 4. The people in the room

For each known attendee / key CRM contact with linkedin_url:
```
execute linkedin/user/user {user: <url>}                       → role, tenure, background
execute linkedin/user/user_posts {urn, count: 10,
                                  posted_after: <90 days ago>} → what they talk about
```
Caveat: `user` called with a URL may omit the `urn` in its response, and `user_posts`
accepts ONLY a URN. If the urn is missing, recover it via
`search_users {first_name, last_name, current_company: [<company urn object>], count: 3}`
— the company-filtered search returns the URN directly (same cascade crm-enrich uses for
email-only contacts). Posts are personalization gold: real interests, stated problems,
conference activity. Quiet posters: `user_comments` and `user_reactions` (posts they
engaged with) reveal what a lurker actually reads — often better meeting fuel than their
own posts.
No posts ≠ no signal — check `user_comments` for lurker activity if it matters.

### 5. The brief

One page, this order:
1. **Snapshot** — what they do, size, stage, funding, trajectory (3 lines).
2. **What's new** — dated events (funding, hires, launches, layoffs), newest first.
3. **People** — attendees with one-line "who they are + what they care about".
4. **Angle** — 3 talking points tied to evidence, 1–2 risks/landmines (layoffs, churned
   history in CRM, competitor relationship).
5. **Sources** — links for every claim. No link → don't claim it.

## Writes

None by default. If the user asks to save the brief: a note via the CRM UI is their
fastest path (note-writing is not exposed through crm_* tools); offer the brief as text
they can paste, or stamp mapped summary fields via `crm_upsert_companies` (dry-run first)
only if the profile maps them.
