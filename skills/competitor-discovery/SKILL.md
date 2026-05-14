---
name: competitor-discovery
description: Find a startup's REAL competitors — the alternatives customers actually compare them to, not just the names on the pitch deck. Use when a founder asks "who are my real competitors?", asks "what does the choice landscape look like for X?", wants to validate or expand a pitch-deck competitor slide, or needs to map alternatives before pain mining or positioning work. Combines Anysite MCP (LinkedIn company/search, LinkedIn posts `mentioned[]` extraction + aggregation, Reddit, YouTube video search + subtitles + comments, Twitter search, YC, SEC for public incumbents, DuckDuckGo as Exa fallback) and Exa MCP (semantic web search + JS-page fetch) to surface direct competitors, substitutes, "doing nothing" workarounds, and convergence threats. Supports two modes: `top5` (5 anchor names) and `landscape` (5 anchors + 25–70-name long-tail + suggested strategic-group axes). Run this before customer-pain-mining or positioning-map.
---

# Competitor Discovery

The pitch deck usually names 2–3 lookalikes. The real comparison set is whatever the customer almost picked instead — including substitutes, free generic tools, "doing nothing," and adjacent-market players one feature-pivot away. This skill produces that map.

## Framing (so the categories don't drift)

Three industry frameworks converge on what to capture:

- **Christensen JTBD**: The customer is "hiring" your product for a job. The true competitor is anything else they could hire for the same job — including bananas (vs. milkshakes), spreadsheets (vs. SaaS), boredom (vs. Facebook).
- **April Dunford (Obviously Awesome)**: Competitive alternatives are the *starting point* of positioning. Ask "what would the customer do if our product didn't exist?" — this surfaces **"do nothing"** as the #1 alternative in ~25% of lost enterprise deals. Beware "phantom competitors" — theoretical companies that never show up in real deals; they dilute positioning.
- **Porter's Five Forces — Substitutes + New Entrants**: Substitutes solve the same outcome with a different category. New entrants are adjacent-market players one feature pivot away.

These map to our four output categories (Direct / Substitute / Workaround / Convergence). Detectors, app stores, compliance tools, payment processors, distribution platforms — these are "rule-setters" that shape the market, not competitors. Note them in context.

## When this skill applies

- A founder names 1–3 obvious competitors; you validate or expand
- Pre-flight before `customer-pain-mining` or `positioning-map`
- Mapping a product into a category when the category is fuzzy
- Sanity-checking a pitch deck competitor slide

## What you need

1. **Product name** (e.g. "Anysite")
2. **One-liner** — what it does, for whom (e.g. "AI writing for college students that drafts, cites, runs integrity checks")
3. **Pitch-deck competitors** if named (optional)
4. **Segment indicator** — consumer / SMB / B2B / DevTool / DeepTech. This determines which source order to use.
5. **Mode** — `top5` (default; produces 5 anchor names + 1 workaround) or `landscape` (produces 5 anchors + 25-70 name long-tail + 2 suggested strategic-group axes for `positioning-map`).

Ask for missing info before running. Don't guess from the product name.

## Tools

**Anysite MCP** (call `mcp__claude_ai_Anysite__discover(source, category)` once before first execute):
- `mcp__claude_ai_Anysite__execute(source="linkedin", category="search", endpoint="search_companies", params={...})` — broad competitor search by keywords. Best primitive for consumer / mid-market.
- `mcp__claude_ai_Anysite__execute(source="linkedin", category="search", endpoint="search_posts", params={...})` — listicle posts naming competitors with structured `mentioned[]` field. Landscape mode aggregates this across N posts.
- `mcp__claude_ai_Anysite__execute(source="reddit", category="search", endpoint="search_posts", params={...})` — real comparison threads.
- `mcp__claude_ai_Anysite__execute(source="twitter", category="search", endpoint="search_posts", params={...})` — viral category quotes. Set `min_likes` ≥ 5 to filter noise; for breakthrough quotes set ≥ 50.
- `mcp__claude_ai_Anysite__execute(source="yc", category="search", endpoint="search_companies", params={...})` — useful for B2B / DeepTech, also for niches where the latest YC batches surge into a consumer category (check w/o assumption).
- `mcp__claude_ai_Anysite__execute(source="youtube", category="search", endpoint="search_videos", params={...})` — listicle videos for B2C / prosumer niches. Filter by view_count ≥ 10K.
- `mcp__claude_ai_Anysite__execute(source="youtube", category="video", endpoint="video_subtitles", params={...})` — fetch the transcript of 1 head-to-head comparison video for deep-dive context. Auto-captions can garble product names ("Elicit" → "illicit", "SciSpace" → "size space") — use for cross-validation, not primary extraction.
- `mcp__claude_ai_Anysite__execute(source="youtube", category="video", endpoint="video_comments", params={...})` — comments under listicle videos cross-validate which competitors customers compare against. Filter `like_count >= 5`. Watch for affiliate astroturf (same product praised in 5+ short identical comments).
- `mcp__claude_ai_Anysite__execute(source="duckduckgo", category="search", endpoint="search", params={...})` — Exa fallback for budget-constrained runs.
- `mcp__claude_ai_Anysite__execute(source="sec", category="search", endpoint="search_companies", params={...})` — for niches with a public incumbent (e.g. Chegg in EdTech, Salesforce in B2B sales). Pull the latest 10-K, fetch the Competition section via Exa.
- `mcp__claude_ai_Anysite__query_cache(cache_key, conditions, sort_by, aggregate, group_by, ...)` — slice cached results. Landscape mode aggregates LinkedIn `mentioned[]` here.

**Exa MCP**:
- `mcp__claude_ai_Exa__web_search_exa(query, numResults)` — semantic search. Describe the ideal page, not keywords.
- `mcp__claude_ai_Exa__web_fetch_exa(urls)` — read JS-heavy pages (modern SaaS marketing sites the webparser can't render).

**Budget**:
- `top5` mode: ~6 Anysite executes + ~3 Exa calls.
- `landscape` mode: ~10 Anysite + ~4 Exa. Includes 1 YouTube subtitle deep-dive, 1 SEC fetch if public incumbent, 1 landscape-mode aggregation.

After the budget, marginal signal drops fast.

## How to run

Source order depends on segment:

- **Consumer / Prosumer / EdTech / SMB SaaS:** Exa → LinkedIn `search_companies` → LinkedIn `search_posts` (with `mentioned[]`) → YouTube `search_videos` → Reddit. Skip YC unless recent batch surge. Skip Instagram for software (validated).
- **B2B / Enterprise / DeepTech / DevTool:** YC → LinkedIn `search_companies` → LinkedIn `search_posts` → Exa → Reddit. Skip YouTube unless niche has analyst-channel ecosystem. SEC 10-K if public incumbent.
- **Public-incumbent niche (EdTech, B2B sales, HR, fintech with public anchors):** SEC 10-K Competition section is canonical — add as Step 8.

If Exa is rate-limited or returns thin results, fall back to `duckduckgo/search/search` — covers different long-tail URLs.

If `mode = landscape`, also run Step 3.5 (LinkedIn `mentioned[]` aggregation) and optionally Step 4a (YouTube subtitle deep-dive on the highest-view-count head-to-head video).

### Step 1 — Exa: category listicles (consumer-first niches)

Find the "best X" comparison pages. These already did the clustering for you.

`mcp__claude_ai_Exa__web_search_exa(query="listicle ranking best <category> tools for <audience> 2025 — detailed comparison with pricing pros and cons", numResults=8)`

Read the highlights — most listicles return 3–5 named competitors right in the snippet, often with prices. If a listicle looks dense, fetch it:

`mcp__claude_ai_Exa__web_fetch_exa(urls=["<top listicle URL>"])`

For Anysite (`API-first web data platform with MCP for AI agents`), the search "listicle ranking best web scraping APIs and AI agent data extraction platforms 2025 — detailed comparison with pricing and pros and cons" surfaces Bright Data, Apify, Firecrawl, ScrapingBee, ScraperAPI, Oxylabs, Zyte, Diffbot, Octoparse in the first page. That is the canonical set.

### Step 2 — LinkedIn company search (broad category discovery)

`mcp__claude_ai_Anysite__execute(source="linkedin", category="search", endpoint="search_companies", params={"keywords": "<2-3 named-feature keywords>", "count": 20})`

Pick keywords that name what the product *does*, not what it *is*. "AI writing assistant students academic" beats "EdTech AI" by 10x.

Returns 10+ companies with URN, name, industry. Cross-reference with Step 1 — companies appearing in both are strong direct competitors.

If keyword combo returns 0 results, broaden it (drop one term) — narrow queries fail silently on LinkedIn.

### Step 3 — LinkedIn search_posts: listicle-shaped posts

Founders + creators in your niche routinely cross-post "10 tools for X" listicles. These contain structured competitor lists:

`mcp__claude_ai_Anysite__execute(source="linkedin", category="search", endpoint="search_posts", params={"keywords": "<seed competitor 1> <seed competitor 2> <niche keyword>", "sort": "recent", "date_posted": "past-month", "count": 15})`

Use seed-competitor + niche keywords (e.g. `"Firecrawl Bright Data web scraping"` or `"Paperpal academic writing"`). Broad market queries like `"AI writing tools students best 2025"` tend to return discourse posts (ethics, policy, hiring) rather than competitor listicles.

Each post has a `mentioned[]` array — extract company names and URLs directly. A single high-engagement listicle post typically names 6–12 competitors. Empirically, one well-targeted query on the web-scraping niche surfaced a 50-like "AI consensus" post naming 10 competitors (Bright Data, Zyte, ScrapingBee, Firecrawl, Scrape.do, ScraperAPI, Apify, Scrapingdog, Oxylabs, Scrapfly) with LinkedIn URLs attached.

Filter the spam: much of LinkedIn is SEO accounts cross-posting identical tool lists. Keep only posts where `comment_count + sum(reactions[].count) >= 10`. Use `query_cache`:

```
mcp__claude_ai_Anysite__query_cache(cache_key="<from step 3>", conditions=[{"field": "comment_count", "op": ">=", "value": 5}])
```

### Step 3.5 — Landscape-mode aggregation (only if `mode = "landscape"`)

For market-mapping or pitch-deck-validation use cases, you don't want a top-5 — you want the full long-tail. Aggregate the `mentioned[]` field across the 15+ posts from Step 3 into one ranked list. Anysite's `query_cache` `group_by` only handles single-level fields, so do the aggregation in your head / inline:

1. Use `query_cache(cache_key=<from step 3>, sort_by="comment_count", sort_order="desc", limit=15)` to surface the top engagement-weighted posts.
2. For each post in the cache, walk `mentioned[]` and pull `name` where `@type == "@linkedin_search_post_mentioned_company"`.
3. Tally name → count across all posts. Sort descending. Names with ≥2 cross-post citations are your **anchor candidates** (high-confidence landscape members); names with 1 citation are the **long-tail watch list**.

Empirically: 1 broad LinkedIn search (Step 3, count=25) tends to surface 10–28 unique competitor names, with 5+ having ≥2 cross-post citations. The cross-post citation count is your phantom-competitor filter: keep names with ≥2 citations as candidates, set the rest aside in a "long-tail / watch list" section. You can optionally run Step 3 twice with different keyword combinations (e.g. one query with niche keywords + one with seed-trio competitors) and merge tallies.

Bonus: use the same cached posts to surface the top creator-analyst in the niche (highest-engagement repeat author) — useful for `linkedin/user/posts` follow-up if you later want creator-commentary signal.

### Step 4 — YouTube listicle videos (B2C / prosumer / EdTech / consumer-AI / DevTool)

`mcp__claude_ai_Anysite__execute(source="youtube", category="search", endpoint="search_videos", params={"query": "best <category> tools <year> comparison review", "count": 15})`

Filter for view_count ≥ 10K — that's the affiliate-spam vs. real-creator line. Look for title patterns: `"X vs Y"`, `"best N tools for <audience>"`, `"I tried N tools"`. Each high-view-count video names 5–15 competitors with feature comparison. Validated on the web-scraping niche: `"Apify Bright Data Firecrawl comparison review"` returned a Greg Isenberg Firecrawl explainer at 169K views and an Apify-vs-Octoparse-vs-BrowseAI head-to-head.

For the single highest-view-count head-to-head comparison video, optionally fetch the transcript:

`mcp__claude_ai_Anysite__execute(source="youtube", category="video", endpoint="video_subtitles", params={"video": "<id>", "lang": "en"})`

Auto-caption caveat: names can garble ("Elicit" → "illicit", "SciSpace" → "size space"). Use the transcript to cross-validate names already in your candidate list, not to extract new names via regex.

Optionally fetch top comments:

`mcp__claude_ai_Anysite__execute(source="youtube", category="video", endpoint="video_comments", params={"video": "<id>", "count": 30})`

Filter `like_count >= 5`. Watch for affiliate astroturf — the same product praised in 5+ short identical-tone comments from different accounts is paid promotion, not signal. Skip the cluster.

YouTube has stronger affordance for B2C / prosumer / DevTool niches than for enterprise B2B. For DeepTech / strict-B2B niches, prefer YC + SEC over YouTube.

### Step 5 — Reddit alternative-hunting (real comparison set)

For 2–3 of your strongest candidates from Steps 1–3:

`mcp__claude_ai_Anysite__execute(source="reddit", category="search", endpoint="search_posts", params={"query": "<competitor> alternative", "sort": "relevance", "time_filter": "year", "count": 15})`

Useful query patterns (pick 2 of these per run, not all):
- `"<competitor> alternative"` — direct substitution
- `"<job-to-be-done> tool recommendations"` — discovery threads
- `"better than <competitor>"` — explicit comparisons

Use `sort=relevance`, not `sort=top`, because top sorts by virality and floods you with off-topic viral content. Relevance is per-query.

Single-phrase queries beat OR-chains. `"Bright Data alternative expensive"` works; OR-chained queries like `"Bright Data alternative sucks expensive overpriced"` confuse Reddit's relevance ranking and return off-topic threads.

In each thread, capture: competitor names mentioned in the title and top comments, subreddit, post title, vote_count. Vote count is your relevance signal.

### Step 6 — Workaround / "doing nothing"

The real competitor is often free + manual. Search Reddit for the manual workaround:

`mcp__claude_ai_Anysite__execute(source="reddit", category="search", endpoint="search_posts", params={"query": "<job-to-be-done> manually OR spreadsheet OR diy OR self-host", "count": 10, "sort": "relevance", "time_filter": "year"})`

If users describe a free-and-manual recipe in detail, that recipe is a competitor. Founders systematically underrate this. For Anysite, "self-host Crawl4AI + bring your own LLM key + manage proxies yourself" is the dominant developer workaround across r/webscraping, r/LocalLLaMA — explicitly costed out in multiple comparison blogs.

### Step 7 — (B2B / DevTool / DeepTech) YC search

Worth running for B2B / DeepTech / Enterprise / Dev Tool. YC tends to be thin for most consumer / EdTech niches; spot-check first. Exception: if the niche has had a recent YC batch surge (e.g. agentic-AI-consumer in W25/F25), check before skipping.

`mcp__claude_ai_Anysite__execute(source="yc", category="search", endpoint="search_companies", params={"query": "<2-3 niche keywords>", "count": 20})`

Read `one_liner`, `industries`, `subindustry`. Keep names whose tagline overlaps the JTBD. Validated on the web-scraping niche: `"web scraping browser automation agent"` returned **Browser Use** (W25, 50K stars in 3 months) and **StableBrowse** (S26) — two convergence threats from the agentic-browser side that the named-competitor set missed.

### Step 8 — (Public-incumbent niche only) SEC Competition section

For niches where a public-company incumbent exists (EdTech: Chegg, Duolingo; B2B sales: Salesforce; HR: Workday; etc.):

`mcp__claude_ai_Anysite__execute(source="sec", category="search", endpoint="search_companies", params={"entity_name": "<incumbent>", "forms": ["10-K"], "count": 3})`

Pick the latest 10-K, fetch its document_url via Exa: `mcp__claude_ai_Exa__web_fetch_exa(urls=["<doc_url>"])`. Look for the "Competition" and "Risk Factors" sections — these contain a legal-grade enumerated competitor list (Chegg's 10-K names Course Hero, ChatGPT, Quizlet directly). Skip when no public incumbent exists.

### Step 9 — Synthesize

Cluster everything into four buckets:

1. **Direct competitors** — same job, same audience, same category (e.g. Firecrawl for Anysite)
2. **Substitutes** — different category, same outcome / JTBD (e.g. ChatGPT for an academic AI writer — Christensen lens)
3. **Workarounds / "doing nothing"** — no product, but a habit the customer already has (Dunford lens — often the #1 alternative the pitch deck misses)
4. **Convergence threats (optional)** — adjacent-market players one feature-pivot away (e.g. Browser Use's agentic browser is a convergence threat for Anysite's web-data API). Porter "new entrants from adjacent markets." Include only if you can name ≥1 candidate with cross-source signal.

Sort within each bucket by **independent-source count**: a name appearing in Exa + LinkedIn + Reddit + YouTube is much stronger evidence than one appearing only in a single SEO listicle. **Apply the phantom-competitor filter:** drop any name with only 1 source unless it's the founder's own pitch-deck-named competitor (validate or invalidate explicitly).

**In `landscape` mode**, identify 2 strategic-group axes that best separate the comparison set — e.g. `Pricing (free → $30/mo)` and `Audience breadth (academic-only → general)`. Pass these to `positioning-map` as the suggested axes.

## Output

Markdown report.

### `top5` mode (default, ~400–600 words)

```
# Competitor Discovery — <Product>

## Executive summary
3 sentences: top-5 real alternatives, the dominant workaround, the one finding the founder probably didn't expect.

## The comparison set

| # | Name | Category | Evidence | Source |
|---|------|----------|----------|--------|
| 1 | ... | Direct / Substitute / Workaround / Convergence | 1-line, e.g. "Cited in 6 of 8 listicles + r/college thread" | Exa, LinkedIn, Reddit, YouTube |

## Rule-setters / context players (shape the market but aren't substitutes)
- e.g. GPTZero, Turnitin for AI writing
- e.g. Apple App Store for consumer mobile

## So what
- Names missing from the pitch deck
- Dominant workaround pattern
- Strongest cross-source signal
- Convergence threats to watch
```

### `landscape` mode (~700–1000 words, includes long-tail)

```
# Competitor Landscape — <Product>

## Executive summary
3-4 sentences: 5 anchor names by independent-source count, the dominant workaround, the convergence threat, the 2 axes that best separate the field.

## Anchor comparison set (top 5 by cross-source signal)

(same table as top5 mode)

## Long-tail (named in 1-2 sources only — watch list)

Grouped by category:
- **Direct**: <name1>, <name2>, ... (each with single-line citation)
- **Substitute**: <name1>, ...
- **Convergence**: <name1>, ...

## Suggested axes for positioning-map handoff
1. <Axis A — e.g. "Pricing: free → $30/mo">
2. <Axis B — e.g. "Audience breadth: academic-only → general writing">

## Rule-setters / context players

(same as top5)

## So what
(same as top5)
```

Keep tone factual. If a query returned no signal, write "no signal found" rather than padding.

## Don't

- Don't trust `similar_organizations[]` on the LinkedIn company endpoint for small companies — the field returns unrelated noise. Use `linkedin/search/search_companies` results instead.
- Don't run YC for consumer SaaS niches without checking. YC has historically been B2B-heavy, but recent batches surface in unexpected categories (e.g. agentic-AI-consumer in W25/S26). Spot-check before skipping.
- Don't include every LinkedIn search result. Filter to top-5 corroborated names in `top5` mode; even in `landscape` mode, separate anchor names (≥2 sources) from the long-tail watch list (1 source).
- Don't use Reddit `sort=top` for category-level queries — top sorts by global virality (off-topic viral content surfaces) not relevance.
- Don't include the founder's own product as a competitor (it sometimes shows up in search).
- Don't search LinkedIn `search_posts` by broad market keywords — broad phrases tend to return ethics/discourse posts, not competitor listicles. Use seed-competitor + niche keywords like `"Firecrawl Bright Data web scraping"` or `"Apify Bright Data alternatives"`.
- Don't run Instagram for SaaS / AI-tools / software competitor discovery — Instagram's affordance is image-first; structured 10+ tool lists live on LinkedIn / YouTube. Instagram is useful for DTC physical-goods niches only.
- Don't extract product names from YouTube auto-subtitles by regex — auto-captions garble names. Use transcripts to cross-validate names already in your candidate list.
- Don't trust clusters of identical short positive comments under YouTube reviews — that pattern is affiliate astroturf. Skip the cluster.
- Don't include phantom competitors (Dunford) — theoretical competitors with only 1 source and no real-deal evidence dilute positioning. Rule: keep only names with ≥2 independent sources, or names explicitly named on the pitch deck (validate or invalidate them explicitly).
- Don't conflate rule-setters with competitors — bot defense (DataDome/Cloudflare/Akamai), app stores, payment processors, compliance tools, distribution platforms shape the rules but aren't substitutes. Note them in context, not in the main table.
- Don't include a complementor / ecosystem player as a competitor — a product that enhances yours (e.g. LangChain or n8n for a scraping API) doesn't compete; it expands the JTBD. Note in context.
- Don't exceed budget — `top5` ~6 Anysite + 3 Exa; `landscape` ~10 Anysite + 4 Exa. After that, marginal signal drops fast.
- Don't use GitHub / Crunchbase / BuiltWith via Anysite right now — those sources are registered but their categories are not currently exposed via this MCP. For OSS-adjacent or funding-data signal, fall back to Exa search + fetch on the relevant GitHub or Crunchbase URL.

## Example session — Anysite (`top5` mode)

User: "Find real competitors for Anysite — API-first web data platform with 40+ sources + MCP server for AI agents. Pitch deck names Apify, Bright Data, ScrapingBee. DevTool / B2B niche. Top-5 mode."

```
1. mcp__claude_ai_Exa__web_search_exa(query="listicle ranking best web scraping APIs and AI agent data extraction platforms 2025 — detailed comparison with pricing and pros and cons", numResults=10)
   → Canonical set: Bright Data, Apify, Firecrawl, ScrapingBee, ScraperAPI, Oxylabs, Zyte, Diffbot, Octoparse, Browse AI, Thunderbit. Prices range $0 free → $500+/mo enterprise.

2. mcp__claude_ai_Anysite__execute(linkedin/search/search_posts, keywords="Firecrawl Bright Data web scraping", sort="relevance", count=25)
   → Jason Grad's "AI consensus" post (50 likes, 13K char trail): mentioned[] gives Bright Data, Zyte, ScrapingBee, Firecrawl, Scrape.do, ScraperAPI, Apify, Scrapingdog, Oxylabs.io, Scrapfly — 10 named competitors via LinkedIn URL in one call.

3. mcp__claude_ai_Anysite__execute(linkedin/search/search_companies, keywords="web scraping API agent data extraction", count=20)
   → 3 niche results (fastCRW, Getdataforme, Scrapeclaw) — long-tail watch.

4. mcp__claude_ai_Anysite__execute(reddit/search/search_posts, query="Firecrawl Apify web scraping AI agents", sort="relevance", time_filter="year", count=20)
   → "What Are the Best AI Web Scraping Tools in 2026?" (r/WebScrapingInsider, 11 votes, 45 comments), "8 Best Web Scraping Tools 2026: AI-Native Scrapers Compared" (r/Agent_AI, 38 votes).

5. mcp__claude_ai_Anysite__execute(reddit/search/search_posts, query="Bright Data alternative expensive", count=20)
   → "Bright Data is getting too expensive for failed requests" (r/WebScrapingInsider) — direct evidence of pricing pain.

6. mcp__claude_ai_Anysite__execute(youtube/search/search_videos, query="Apify Bright Data Firecrawl comparison review", count=15)
   → "Firecrawl AI clearly explained" (169K views, Greg Isenberg), "Apify vs Octoparse vs BrowseAI" head-to-head. Confirms Firecrawl + Apify as top anchors with view-count signal.

7. mcp__claude_ai_Anysite__execute(yc/search/search_companies, query="web scraping browser automation agent", count=30)
   → Browser Use (W25, 50K stars in 3 months), StableBrowse (S26, "browser for AI agents") — two convergence threats from the agentic-browser side.

8. Synthesize 4-category map (Direct / Substitute / Workaround / Convergence).
```

## Example session — Anysite (`landscape` mode)

User: "Map the full web-data-API landscape, including long-tail and AI-agent disruptors. I'm raising — investor wants the competitive-landscape view."

```
1-3. Same as top5 mode Steps 1-3.

3.5. mcp__claude_ai_Anysite__execute(linkedin/search/search_posts, keywords="Bright Data Apify Firecrawl ScrapingBee", count=25)
     Walk mentioned[] across cached posts, tally @linkedin_search_post_mentioned_company.name. (query_cache group_by handles single-level fields only — aggregate nested array client-side.)
     → 12+ unique names; landscape long-tail surfaces.

4. mcp__claude_ai_Anysite__execute(youtube/search/search_videos, ...) — same as top5.

4a. mcp__claude_ai_Anysite__execute(youtube/video/video_subtitles, video="eH8JdttKIdA") on Firecrawl explainer
    → Full transcript; cross-validates Firecrawl's positioning vs Apify and Bright Data.

4b. mcp__claude_ai_Anysite__execute(youtube/video/video_comments, video="eH8JdttKIdA", count=30)
    → Genuine: "dont use the firecrawl agent, it sucks"; affiliate cluster: spotted and skipped.

5-7. Same as top5 Steps 5-7.

8. (Optional — SEC) No mature public incumbent yet in pure web-data API category; skip SEC. (Bright Data is private; ScrapeNetworks/Brightecore not public.)

9. Synthesize with 4 categories. Suggested axes for positioning-map:
   Axis A: Pricing predictability (credit-multiplier surprise → records-priced → flat-rate)
   Axis B: Agent-native vs developer-native (structured endpoints + MCP → raw proxy/Actor + bring-your-own-schema)
```

Final table:

| # | Name | Category | Evidence | Source |
|---|------|----------|----------|--------|
| 1 | Firecrawl | Direct (AI-agent-first) | Top 3 in 6/8 Exa listicles; 119K GitHub stars; named "best for LLM pipelines" everywhere | Exa, LinkedIn (50-like consensus post), Reddit, YouTube (169K-view explainer) |
| 2 | Apify | Direct (full-stack platform) | "Best default 2026" per 4 comparison blogs; 20K+ Actor marketplace | Exa, LinkedIn, Reddit (Apify-cost-math thread) |
| 3 | Bright Data | Direct (enterprise proxies + APIs) | 355 employees; #1 in AI-search-consensus rankings; $500/mo entry | Exa, LinkedIn, Reddit (cost-pain thread) |
| 4 | ScrapingBee | Direct (developer API) | Named in every listicle; $49/mo entry; recurring "API simplicity" theme | Exa, LinkedIn |
| 5 | "Build it yourself: Crawl4AI + LLM key + proxies + maintenance" | Workaround / "doing nothing" (Dunford) | Dominant Reddit + blog cost-comparison pattern | Reddit, Exa (3 cost-comparison blogs) |
| — | Browser Use, StableBrowse, Parallel Web Systems, Tavily, Scrapling | Convergence threat (Porter "new entrants") | Agentic-browser / agent-native-API disruption from below; Browser Use 50K stars in 3 months; Parallel Web Systems $100M Series B at $2B | YC (2 hits), LinkedIn (2K-like Scrapling launch), Exa |
| — | DataDome, Cloudflare, Akamai | Rule-setter (anti-bot defense) | They set the anti-bot bar; not substitutes but shape every roadmap | LinkedIn (DataDome's own content) |
| — | LangChain, LlamaIndex, n8n, Zapier | Complementor | Every scraper integrates with these; they expand the JTBD, don't compete on it | Exa (every comparison blog) |

So what:
- Pitch deck named Apify/Bright Data/ScrapingBee but missed Firecrawl as the closest direct threat in messaging (Firecrawl is "AI agent–native" by branding).
- The dominant workaround is "Crawl4AI + your own LLM key + proxies + your own maintenance" — explicitly costed out in multiple comparison posts.
- Browser Use and StableBrowse are convergence threats one feature-pivot away; the pitch deck should add them.
