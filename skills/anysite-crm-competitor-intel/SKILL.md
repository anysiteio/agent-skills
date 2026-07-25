---
name: anysite-crm-competitor-intel
description: Displacement hunting tied to the CRM - find companies using a competitor's product (Wappalyzer technographics), mine switching reasons and pains from software reviews (Capterra switched_from/switching_reason, TrustRadius, GetApp), cross-reference with CRM accounts and tag displacement targets. Use ONLY when the goal is a CRM-tied displacement list or competitor-user tagging. For general competitor strategy research (content, hiring, positioning, no CRM) use anysite-competitor-intelligence.
---

# CRM Competitor Intel

Competitor-switch signals are the highest-intent plays in signal-based selling. This skill
builds the target list and the ammunition: who uses the competitor, and what their users
complain about.

## Prerequisites

Active CRM connection for the cross-reference/tagging part (Writing rules from
`anysite-crm-setup` apply to tagging). The research part works without one.

## Flow

### 1. Who uses the competitor (technographics)

Only works for competitors whose product is detectable on websites (martech, analytics,
chat widgets, ecommerce...):
```
execute wappalyzer/technologies {technology: "<competitor slug>"}
  → website_count (market size), top_websites[] (sample of users, with traffic/tech-spend),
    alternatives[] (the category landscape), top_countries
```
Honest limitation: `top_websites` is a **sample**, not an exhaustive list. Frame it as
"examples + market sizing", supplement with `linkedin/search/search_sql_companies`
searching the competitor name in `specialities`/`description`, and with
`producthunt/products/products_alternatives` for the category graph.

Not website-detectable (e.g. a database vendor)? Skip to reviews and search: job posts
mentioning the tool (`linkedin/search/search_jobs {keywords: "<tool>"}` — companies whose
vacancies require competitor experience are its customers), reddit/community mentions.

### 2. What their users complain about (review mining)

```
execute capterra/products/products_search {query: "<competitor>", count: 5}  → seo_id
execute capterra/products/products_reviews {product: "<seo_id>", count: 50}
```
The `product` param wants the `seo_id` field (not `id`). Reviews include `switched_from[]`,
`switching_reason` and `chosen_reason` — direct competitor-switch evidence, mine these
first. Same pattern via `trustradius` and `getapp` `products_reviews` (g2 exposes search
only). Filter low-rating reviews with `query_cache` (free), then extract with the LLM:
recurring pains, switching triggers, praised alternatives, verbatim quotes worth reusing.
Keep 3–7 pains with quote + source URL each — this is the personalization ammunition.

Second ammunition source — the competitor's own ads (`ad-transparency` sources, incl.
LinkedIn Ad Library): their current claims and positioning in their own words. Scope it to
the 1–3 competitors under analysis (NOT per-account sweeps — per-ad detail is a separate
call each); use server filters (`impressions_min`, `countries`, `date_option`) and open
only the cards that matter. ~10–15cr for a whole competitor analysis. Their engagement
graph (`post_comments`/`post_reactions` on the competitor's page — a seed with a real
audience) adds who's actively following them.

### 3. Cross-reference with the CRM

```
crm_query_records(object_type="companies", search=<domain from step 1>)
```
Split: already in CRM (mark as competitor-user) / net-new fits (candidates for
`anysite-crm-prospect`).

### 4. Tag and hand off

If the profile maps a field like `competitor_tool` / `displacement_target`:
```
crm_upsert_companies(records=[{domain: "<domain>", properties:{...}}], allow_create=false,
                     dry_run=true) → confirm → write
```
(Company upserts match only by domain.)
Report: market sizing, tagged accounts, pain library with quotes, and suggested play
("lead with <pain #1>, they're on <competitor> per <evidence>"). Evidence links always —
a displacement claim without a source is a guess, label it as such.

## Boundaries

- CRM-tied targeting lives here; broad competitor strategy analysis (content, hiring,
  positioning) → `anysite-competitor-intelligence` skill.
- Net-new companies go through `anysite-crm-prospect` (dedup + create rules), not directly.
