---
name: anysite-market-research
description: Conduct comprehensive market research using Y Combinator data, SEC filings, social media insights, and web scraping via anysite MCP server. Analyze tech markets, research startup ecosystems, study public companies, identify market opportunities, and understand competitive dynamics. Supports startup discovery, industry analysis, public company research, and social sentiment analysis. Use when users need to analyze market opportunities, research industries, evaluate startups, study public companies, or gather market intelligence for strategic planning and investment decisions.
---

# anysite Market Research

Comprehensive market research using Y Combinator, SEC, social media, and web data through anysite MCP. Analyze tech markets, research startups, and study competitive landscapes.

## Overview

- **Research startup ecosystems** via Y Combinator data
- **Analyze public companies** through SEC filings
- **Gather market intelligence** from social platforms
- **Study industry trends** across communities
- **Identify market opportunities** through data analysis

**Coverage**: 70% - Excellent for tech/startup markets; pivoted from local business to tech focus

## Supported Platforms

- ✅ **Y Combinator**: Startup research, batch analysis, founder discovery, funding data
- ✅ **SEC**: Public company filings, financial data, disclosures
- ✅ **Reddit**: Market sentiment, community insights, product discussions
- ✅ **LinkedIn**: Industry trends, company intelligence, professional discussions
- ✅ **Twitter/X**: Market pulse, news, influencer opinions
- ✅ **Web Scraping**: Company websites, industry reports, market data

## Quick Start

**Step 1: Define Research Scope**

Choose focus:
- Startup ecosystem: `search_yc_companies`
- Public companies: `sec_search_companies`
- Industry sentiment: `search_reddit_posts`, `search_twitter_posts`
- Company intelligence: `search_linkedin_companies`

**Step 2: Gather Data**

Execute searches:
```
# Startup research
search_yc_companies(industries=["fintech"], batches=["W24", "S23"])

# Public company research
sec_search_companies(entity_name="tech company", forms=["10-K"])

# Market sentiment
search_reddit_posts(query="fintech trends", count=100)
```

**Step 3: Analyze Results**

Extract insights:
- Market size indicators
- Competitive landscape
- Technology trends
- Consumer sentiment
- Funding patterns

**Step 4: Synthesize Findings**

Deliver:
- Market opportunity assessment
- Competitive analysis
- Trend identification
- Strategic recommendations

## Common Workflows

### Workflow 1: Startup Ecosystem Analysis

**Scenario**: Analyze fintech startup landscape

**Steps**:

1. **Find Startups**
```
search_yc_companies(
  industries=["fintech"],
  batches=["W24", "S23", "W23", "S22"],
  count=100
)
```

2. **Categorize by Focus**
```
For each startup:
  get_yc_company(company)

Group by:
- Payments
- Lending
- Investment/Trading
- Banking
- Insurance
- B2B fintech tools
```

3. **Analyze Patterns**
```
Identify:
- Hot subcategories (most startups)
- Team size distribution
- Geographic concentration
- Common tech stacks (from job postings)
```

4. **Research Traction**
```
For promising startups:
  search_linkedin_companies(keywords=startup_name)
  → Check employee growth

  search_twitter_posts(query=startup_name)
  → Check social presence and buzz

  parse_webpage(startup_website)
  → Check positioning and features
```

5. **Identify White Spaces**
```
Compare:
- Overcrowded categories
- Underserved segments
- Emerging opportunities
- Geographic gaps
```

**Expected Output**:
- 50-100 startup landscape map
- Category distribution
- Funding trends
- Market gaps identified
- Competitive intensity by segment

### Workflow 2: Public Company Competitive Analysis

**Scenario**: Research public competitors in cloud infrastructure

**Steps**:

1. **Find Companies**
```
sec_search_companies(
  entity_name="cloud",
  forms=["10-K", "10-Q"],
  count=50
)
```

2. **Get Financial Data**
```
For each company:
  sec_document(document_url)

Extract:
- Revenue and growth
- Operating margins
- R&D spending
- Geographic breakdown
- Risk factors mentioned
```

3. **Analyze Strategy**
```
From 10-K filings:
- Business model
- Target markets
- Competitive advantages
- Growth initiatives
- Challenges and risks
```

4. **Track Changes**
```
Compare year-over-year:
- Revenue growth trends
- Market focus shifts
- New initiatives
- Risk factor changes
```

5. **Supplement with Social Intel**
```
search_linkedin_companies(keywords=company_name)
→ Employee count, hiring patterns

get_linkedin_company_posts(urn)
→ Strategic messaging

search_reddit_posts(query=company_name)
→ Customer sentiment
```

**Expected Output**:
- Competitive landscape map
- Financial benchmarks
- Strategic positioning
- Growth trajectories
- Market opportunities

### Workflow 3: Industry Trend Analysis

**Scenario**: Understand AI/ML market evolution

**Steps**:

1. **YC Startup Trends**
```
search_yc_companies(
  query="AI OR machine learning OR artificial intelligence",
  count=200
)

Group by batch to see:
- Trend over time
- Focus area shifts
- Team size changes
```

2. **Public Market Signals**
```
sec_search_companies(
  entity_name="artificial intelligence",
  count=50
)

Check 10-K mentions of:
- "AI" or "machine learning" frequency
- AI-related investments
- AI revenue segments
```

3. **Community Sentiment**
```
search_reddit_posts(
  query="AI trends 2026",
  count=100
)

Analyze for:
- Excitement vs. concern
- Adoption barriers
- Use case validation
- Technology maturity
```

4. **Professional Discussion**
```
search_linkedin_posts(
  keywords="artificial intelligence",
  count=50
)

Check:
- Industry adoption
- Job market signals
- Skill requirements
- Thought leader opinions
```

5. **Web Intelligence**
```
For key AI companies:
  parse_webpage(website + "/blog")
→ Technology updates, product launches

get_sitemap(website)
→ Content focus areas
```

**Expected Output**:
- Market evolution timeline
- Technology adoption curves
- Sentiment analysis
- Opportunity identification
- Risk assessment

## MCP Tools Reference

### Y Combinator Research
- `search_yc_companies` - Find startups by industry, batch, filters
- `get_yc_company` - Get detailed company profile
- `search_yc_founders` - Research founders

### SEC Research
- `sec_search_companies` - Find public companies and filings
- `sec_document` - Get full document content

### Social Intelligence
- `search_reddit_posts` - Community insights and sentiment
- `search_twitter_posts` - Real-time market pulse
- `search_linkedin_posts` - Professional trends

### Company Intelligence
- `search_linkedin_companies` - Find companies
- `get_linkedin_company` - Company details
- `parse_webpage` - Extract website data

### Market Discovery
- `duckduckgo_search` - General web research
- `get_sitemap` - Comprehensive website analysis

## Market Analysis Frameworks

**TAM/SAM/SOM Analysis**:
```
Total Addressable Market (TAM):
- Count YC companies in category × avg market size
- SEC filing market size mentions
- Industry reports (web scraping)

Serviceable Addressable Market (SAM):
- Filter by geography, segment
- LinkedIn company search by ICP
- YC companies by batch/stage

Serviceable Obtainable Market (SOM):
- Realistic capture based on competition
- Competitive analysis via LinkedIn/social
- Market share indicators
```

**Porter's Five Forces**:
```
Using anysite data:

1. Competitive Rivalry:
   - YC startups in space
   - LinkedIn company counts
   - Social mention volume

2. Threat of New Entrants:
   - Recent YC batches
   - Funding announcements
   - Talent movement (LinkedIn)

3. Supplier Power:
   - Technology dependencies
   - Integration partners

4. Buyer Power:
   - Customer reviews (Reddit)
   - Pricing transparency
   - Switching costs mentioned

5. Threat of Substitutes:
   - Alternative solutions
   - Adjacent markets
```

## Output Formats

**Chat Summary**:
- Key market insights
- Competitive landscape summary
- Opportunity identification
- Strategic recommendations

**CSV Export**:
- Company list with metrics
- Market segmentation data
- Trend indicators

**JSON Export**:
- Complete research data
- Time-series analysis
- Cross-platform correlations

## Reference Documentation

- **[RESEARCH_METHODS.md](references/RESEARCH_METHODS.md)** - Market research methodologies, analysis frameworks, and data synthesis techniques

---

**Ready for market research?** Ask Claude to help you analyze markets, research startups, or study competitive landscapes using this skill!
