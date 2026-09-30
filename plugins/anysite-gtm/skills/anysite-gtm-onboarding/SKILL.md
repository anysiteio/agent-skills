---
name: anysite-gtm-onboarding
description: First-run onboarding for the anysite GTM pack - a short interview that captures who the user sells to and how (company, offer, ICP, buyer personas, competitors, best customers, buying signals, CRM, outreach voice, 30-day goal), pre-filled from their own website so the user confirms instead of typing, and saves it as a GTM profile every other anysite GTM skill reads first. Use right after installing the GTM plugin, when the user says "set up anysite", "onboard me", "start here", "настрой меня", "онбординг", when a GTM skill needs ICP/persona/offer context that was never saved, or when the user wants to change their ICP, personas, competitors or offer. Re-run to update - it edits the saved profile instead of starting over.
---

# Anysite GTM Onboarding

Every GTM skill in this pack needs the same few facts about the user's business: who
they sell to, which people buy, what they offer, whom they compete with. Without a saved
answer each skill asks again, and the user retypes their ICP five times a week. This
skill asks once, well, and saves a **GTM profile** the other skills treat as the
default context.

The interview is not a form. The user's website already answers half of it — research
first, then ask them to confirm and correct. A good onboarding takes 5-10 minutes and
ends with a first useful result, not with "setup complete".

## Step 0 — Existing profile?

Look for `~/.claude/skills/anysite-gtm-profile/SKILL.md`.

- **Found** — show it as a compact summary and ask what changed. Update only the
  sections the user touches, keep the rest, bump the `Updated` date. Do not re-interview.
- **Not found** — continue with Step 1.

## Step 1 — Their company, researched before asking

Ask one question: **the company website** (and the user's role, if not obvious).

Then research it yourself with the anysite MCP before asking anything else — typically
3-6 credits, say so in one line:

1. Parse the homepage and the pricing/customers page with `webparser` (via `discover` →
   `execute`) — positioning, product, pricing model, named customers, logos, case studies.
2. Pull the company's own profile (`discover` a company-profile source) — industry,
   size, HQ, locations.
3. If the site names competitors or "alternative to X" pages, note them.

From that, draft answers for Steps 2-5 and present them as a proposal to confirm. The
user edits a draft much faster than they write from scratch, and the draft shows the
agent understood the business.

If the anysite tools are not available, say the MCP connector is not connected (the GTM
plugin ships it — the user may need to authenticate it once) and run the interview
without the pre-fill.

## Step 2 — Offer and motion

Confirm or collect:

- **What you sell**, one plain line in the buyer's words (not the tagline).
- **Price point / ACV band** and pricing model — it decides how much research per lead
  is worth it.
- **Sales motion** — outbound, inbound, PLG, ABM, partner-led (can be several).
- **Proof points** — 1-3 named customers or hard numbers usable in outreach.
- **Words to avoid** — competitor names in first touch, internal jargon, claims legal
  forbids.

## Step 3 — ICP (the account)

Push for **filterable** criteria — every criterion should map to something a search can
filter on. "Innovative mid-market companies" is not a criterion; "B2B SaaS, 50-500
employees, US/UK, Series A-C" is.

- **Industries / verticals** (and explicit exclusions: agencies, consultancies,
  government, competitors).
- **Company size** — employee range; revenue only if the user insists.
- **Geography** — countries/regions where they can sell and support.
- **Stage / funding** — bootstrapped, seed, A-C, public.
- **Traits** — tech they use, business model (B2B/B2C), hiring for a function,
  regulated or not.
- **Disqualifiers** — what makes an account a hard no.

## Step 4 — Personas (the people)

Usually 1-3 personas. For each:

- **Titles** as they appear on profiles (3-6 variants: "Head of RevOps", "VP Revenue
  Operations", "RevOps Lead").
- **Seniority** and **function**.
- **Role in the deal** — economic buyer, champion, user, blocker.
- **Their pain** in one line — what this person loses sleep over that the offer fixes.

## Step 5 — Market context

- **Competitors** — 3-7 names with domains; mark the ones customers most often switch
  from.
- **Best customers** — 3-5 company names or domains that are the ideal fit. These seed
  lookalike search and scoring, so real names beat descriptions.
- **Buying signals** that historically preceded deals — funding round, new exec in the
  buyer function, hiring for a role, expansion to a region, tech adoption, a competitor
  complaint. Ask "what was going on at your last three customers when they bought?"

## Step 6 — Tools and goal

- **CRM** — HubSpot, Pipedrive, other, none. HubSpot/Pipedrive → offer
  `anysite-crm-setup` right after this skill (it connects the CRM and agrees the field
  mapping). Other/none → work with exports.
- **Outreach channels and language** — email, LinkedIn, both; the language and tone of
  messages; who signs them.
- **Anysite plan** — credit-based or Unlimited; it decides whether bulk runs get a
  credit estimate or a time estimate first.
- **Goal for the next 30 days** — the one outcome this setup should serve: "200
  qualified accounts for outbound", "clean and enrich the CRM", "catch buying signals on
  our pipeline", "win deals from competitor X".

## How to ask

- Use `AskUserQuestion` when the client has it: at most 4 questions per call, options
  pre-filled from the research, the recommended/likely option first. Everything
  open-ended (titles, competitors, best customers) is free text, not a fake multiple
  choice.
- One step per message. Reflect back what you heard in one line before moving on.
- Never block on a question the user skips — write `unknown` and move on; the profile can
  be completed later.
- Do not invent answers. A drafted value the user did not confirm is marked
  `(inferred from website)` in the profile.

## Step 7 — Save the profile

Show the whole profile as one readable summary, invite corrections, then save it.

**Claude Code** — write `~/.claude/skills/anysite-gtm-profile/SKILL.md` (create the
directory) with the structure in `references/profile-template.md`. Saved as a skill, it
is discovered automatically in every future session, so other skills pick it up without
being told.

**claude.ai / Claude Desktop / Cowork without file access** — give the same profile as a
single block and ask the user to paste it into the Project instructions (or the
account-level custom instructions) so every chat starts with it.

## Step 8 — First result, not "done"

Close with a concrete first run derived from the 30-day goal, and offer to start it now:

| Goal | First run | Skill |
|---|---|---|
| Build an outbound list | Source 25 ICP accounts, then personas at them | `anysite-company-sourcing` → `anysite-people-sourcing` |
| Grow from best customers | Derive the real ICP from them and find lookalikes | `anysite-crm-lookalikes` |
| CRM hygiene | Audit the CRM, then enrich the gaps | `anysite-crm-audit` → `anysite-crm-enrich` |
| Catch buying signals | Sweep signals on the open pipeline | `anysite-crm-signals` |
| Take share from a competitor | Map the competitor's customers and their pains | `anysite-crm-competitor-intel` |
| Qualify inbound faster | Verdict on the next inbound lead | `anysite-crm-inbound` |

If a CRM was named but not connected, the first step is `anysite-crm-setup`.

Company and people lists open as an interactive table in clients that render MCP Apps
(`show_entity_table`), and "go through them one by one" is `review_leads` — mention both
when the first list lands, so the user knows they can filter, enrich and triage in place
(`anysite-mcp` → Tables, joins and lead review).

## Rules

- The profile is the user's, not anysite's: never copy anysite's own pitch, pricing or
  positioning into it.
- Keep it short — a profile past ~80 lines stops being read. Criteria, not essays.
- No secrets in the profile: no API keys, passwords or tokens.
- Personal data stays minimal: names of the user's customers are fine; do not store
  individual people's contact details.
