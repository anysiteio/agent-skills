# Competitive Analysis Patterns

Frameworks and templates for analyzing competitors using anysite MCP data.

## SWOT Analysis Framework

### Data Collection for SWOT

**Strengths**:
```
LinkedIn:
- execute("linkedin", "company", "company", {"company": "..."}) → Company size, growth
- execute("linkedin", "company", "company_posts", {"urn": ..., "count": 20}) → Messaging, brand strength
- execute("linkedin", "search", "search_users", {"company_keywords": "...", "title": "...", "count": 50}) → Leadership quality

Y Combinator:
- execute("yc", "company", "get", {"slug": "..."}) → Funding, pedigree

Social:
- Follower counts, engagement rates
- Content quality and frequency
- Use query_cache(cache_key, aggregate=[{"field": "like_count", "function": "avg"}]) for engagement benchmarks
```

**Weaknesses**:
```
Reddit:
- execute("reddit", "search", "search_posts", {"query": "competitor", "count": 50}) → Customer complaints
- Product gaps, feature requests
- Use query_cache(cache_key, sort_by=[{"field": "comment_count", "order": "desc"}]) to find most-discussed issues

LinkedIn:
- Employee turnover (departures)
- Job re-postings (hiring challenges)

Web:
- Website quality, user experience
- Missing features vs. competitors
```

**Opportunities**:
```
Market gaps identified through:
- Competitor job postings (expansion areas)
- Customer requests in forums
- Underserved geographies
- Unaddressed use cases
```

**Threats**:
```
Competitive threats:
- YC batch analysis (new entrants): execute("yc", "search", "search_companies", {"query": "...", "count": 50})
- Hiring velocity (aggressive growth): execute("linkedin", "company", "company_employee_stats", {"urn": ...})
- New product launches
- Pricing changes
```

## Competitive Positioning Matrix

**Dimensions to Track**:
1. Market Focus (Enterprise vs. SMB)
2. Product Complexity (Simple vs. Feature-Rich)
3. Pricing Strategy (Premium vs. Value)
4. Customer Type (Technical vs. Business Users)

**Data Sources**:
- Website messaging: `execute("webparser", "parse", "parse", {"url": "..."})`
- LinkedIn company description: `execute("linkedin", "company", "company", {"company": "..."})`
- Pricing pages: `execute("webparser", "parse", "parse", {"url": "<website>/pricing"})`
- Job postings: `execute("linkedin", "search", "search_jobs", {"keywords": "...", "count": 50})`

**Export**: Use `export_data(cache_key, "csv")` to build comparison spreadsheets.

## Porter's Five Forces Analysis

**Threat of New Entrants**:
- Monitor YC batches for new competitors: `execute("yc", "search", "search_companies", {"query": "...", "count": 50})`
- Track LinkedIn company formations in space: `execute("linkedin", "search", "search_companies", {"keywords": "...", "count": 50})`
- Watch for well-funded startups

**Competitive Rivalry**:
- Employee count growth rates
- Content output and engagement
- Product launch frequency
- Market share signals

**Supplier Power**:
- Identify common technology partners
- Track integrations and partnerships
- Monitor platform dependencies

**Buyer Power**:
- Analyze customer segments (from job postings)
- Track pricing transparency
- Monitor customer communities

**Threat of Substitutes**:
- Identify adjacent solutions
- Track feature overlap
- Monitor market positioning shifts
