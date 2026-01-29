# Anysite MCP Skills

Official anysite agent skills for LinkedIn intelligence, social media analysis, and data extraction. Works with Claude Code, Cursor, and other AI coding assistants that support MCP.

## Available Skills

<!-- BEGIN_SKILLS_TABLE -->
| Name | Description | Documentation |
|------|-------------|---------------|
| `anysite-lead-generation` | Find and enrich prospects with LinkedIn search, email discovery, and contact extraction from websites. Build qualified prospect lists for sales, recruiting, and business development. | [SKILL.md](skills/anysite-lead-generation/SKILL.md) |
| `anysite-competitor-intelligence` | Track competitors across LinkedIn, social media, Y Combinator, and the web. Analyze hiring patterns, monitor content strategies, and benchmark market positioning. | [SKILL.md](skills/anysite-competitor-intelligence/SKILL.md) |
| `anysite-influencer-discovery` | Discover and analyze influencers across Instagram, Twitter/X, LinkedIn, and YouTube. Evaluate engagement metrics, audience quality, and partnership opportunities. | [SKILL.md](skills/anysite-influencer-discovery/SKILL.md) |
| `anysite-content-analytics` | Track post performance, engagement metrics, and content strategy effectiveness across Instagram, YouTube, LinkedIn, Twitter/X, and Reddit. | [SKILL.md](skills/anysite-content-analytics/SKILL.md) |
| `anysite-trend-analysis` | Detect emerging trends and viral content across Twitter/X, Reddit, YouTube, LinkedIn, and Instagram. Monitor topic momentum and market shifts. | [SKILL.md](skills/anysite-trend-analysis/SKILL.md) |
| `anysite-market-research` | Analyze tech markets, research startup ecosystems via Y Combinator, study public companies through SEC filings, and gather market intelligence from social platforms. | [SKILL.md](skills/anysite-market-research/SKILL.md) |
| `anysite-audience-analysis` | Analyze audience demographics, engagement patterns, and follower behavior across Instagram, YouTube, and LinkedIn. | [SKILL.md](skills/anysite-audience-analysis/SKILL.md) |
| `anysite-brand-reputation` | Monitor brand mentions, sentiment, and social media conversations across Twitter/X, Reddit, Instagram, YouTube, and LinkedIn. Track customer feedback and identify reputation risks. | [SKILL.md](skills/anysite-brand-reputation/SKILL.md) |
| `anysite-person-analyzer` | Deep multi-platform intelligence analysis for people combining LinkedIn (profile, posts, activity), Twitter/X, Reddit, GitHub, and web presence. Perfect for networking, sales, partnerships, recruitment, and investor relations. | [SKILL.md](skills/anysite-person-analyzer/SKILL.md) |
| `anysite-vc-analyst` | Universal startup investor research and outreach agent. Verify investor roles, score based on stage fit and thesis alignment, detect portfolio conflicts, and generate personalized outreach messages. | [SKILL.md](skills/anysite-vc-analyst/SKILL.md) |
| `anysite-competitor-analyzer` | Comprehensive competitive intelligence combining web scraping, LinkedIn analysis, social media monitoring, leadership profiling, GitHub review, and community sentiment tracking. | [SKILL.md](skills/anysite-competitor-analyzer/SKILL.md) |
<!-- END_SKILLS_TABLE -->

## Installation

### Step 1: Install anysite MCP Server

First, install the anysite MCP server following the instructions at [docs.anysite.io/mcp-server](https://docs.anysite.io/mcp-server).

### Step 2: Install Skills Marketplace

#### Claude Code

```bash
# Add the marketplace
/plugin marketplace add https://github.com/anysiteio/agent-skills

# Install a skill
/plugin install anysite-lead-generation@anysite-skills
```

#### Cursor / Windsurf

Add to your project's `.cursor/settings.json` or use the same Claude Code plugin format.

#### Other AI Tools

Any AI tool that supports markdown context can use the skills by pointing to:
- `skills/*/SKILL.md` - Individual skill documentation
- `.claude-plugin/marketplace.json` - Skill metadata

## Prerequisites

1. **anysite MCP Server** - [docs.anysite.io/mcp-server](https://docs.anysite.io/mcp-server)
2. **Claude Code / Cursor** - With MCP support enabled

That's it! No API tokens, .env files, or CLI tools required. Authentication is handled at the MCP server level.

## Platform Coverage

### Supported Platforms

| Platform | Tools | Primary Use Cases |
|----------|-------|-------------------|
| **LinkedIn** | 30+ tools | B2B lead generation, company research, employee discovery, email finding |
| **Instagram** | 8 tools | Influencer discovery, content analytics, audience analysis, engagement tracking |
| **Twitter/X** | 4 tools | Trend analysis, sentiment monitoring, user research, content discovery |
| **Reddit** | 5 tools | Community insights, sentiment analysis, market research, trend detection |
| **YouTube** | 5 tools | Content analytics, channel research, comment analysis, video trends |
| **Y Combinator** | 3 tools | Startup research, founder discovery, batch analysis |
| **SEC** | 2 tools | Public company filings, financial data extraction |
| **GitHub** | Available | Repository analysis, technical contributions, developer activity |
| **Web Scraping** | 3 tools | Contact extraction, sitemap parsing, general web data |

### Platform Limitations

The anysite MCP server currently supports LinkedIn, Instagram, Twitter/X, Reddit, YouTube, Y Combinator, SEC, and web scraping. Additional platforms may be added in future updates.

## Key Features

**Zero Configuration**
- No API tokens or .env files required
- No external CLI tools needed
- Server-level authentication handled automatically

**Synchronous Execution**
- Immediate results without polling
- No async job management required
- Real-time data access

**Native Integration**
- Direct Claude tool calls
- Seamless conversation flow
- No external scripts to manage

**Professional Grade**
- Built for sales teams, marketers, researchers, and analysts
- Production-ready workflows
- Comprehensive documentation

## Output Formats

All skills support three output formats:

- **Chat Summary** (Default) - Natural language insights directly in conversation
- **CSV Export** - Structured data for spreadsheet analysis and CRM import
- **JSON Export** - Raw data for programmatic processing and integrations

## Quick Start

Once installed, skills are automatically available. Simply ask Claude to perform tasks:

```
"Find 20 sales prospects in San Francisco who work in SaaS companies"
→ Uses anysite-lead-generation skill

"Analyze my competitor's LinkedIn company page and recent posts"
→ Uses anysite-competitor-intelligence skill

"Find Instagram influencers in sustainable fashion with 10k-100k followers"
→ Uses anysite-influencer-discovery skill

"Research this person's LinkedIn and Twitter activity"
→ Uses anysite-person-analyzer skill

"Evaluate this investor for our seed round"
→ Uses anysite-vc-analyst skill
```

## How It Works

```
Claude Code
    ↓
Anysite MCP Skills (This Repository)
    ↓
Anysite MCP Server
    ↓
Platform APIs (LinkedIn, Instagram, Twitter, etc.)
```

The anysite MCP server handles all authentication and API communication. Skills provide structured workflows and analysis frameworks that Claude uses to extract, process, and present data.

## Use Cases

### Sales & Business Development
- **Lead Generation**: Build prospect lists from LinkedIn and web sources
- **Account Research**: Deep-dive on target companies and decision makers
- **Competitive Intelligence**: Track competitor activities and positioning
- **Person Intelligence**: Research prospects before meetings

### Marketing & Social Media
- **Influencer Marketing**: Discover and evaluate partnership opportunities
- **Content Strategy**: Analyze performance and optimize posting
- **Brand Monitoring**: Track mentions and sentiment across platforms
- **Trend Analysis**: Identify emerging topics and viral content

### Recruiting & HR
- **Candidate Sourcing**: Find qualified candidates on LinkedIn
- **Background Research**: Analyze candidate profiles and activity
- **Talent Intelligence**: Track hiring patterns at target companies
- **Network Analysis**: Map connections and referral paths

### Fundraising & Investing
- **Investor Research**: Qualify and score potential investors
- **Due Diligence**: Research founders, teams, and companies
- **Market Analysis**: Study startup ecosystems and trends
- **Competitive Landscape**: Map competitors and market dynamics

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

1. Fork this repository
2. Create your skill in `skills/anysite-your-skill/`
3. Add `SKILL.md` with proper frontmatter:
   ```yaml
   ---
   name: anysite-your-skill
   description: What your skill does and when to use it
   ---
   ```
4. Add entry to `.claude-plugin/marketplace.json`
5. Update this README.md skills table
6. Submit a pull request

## Support

- **GitHub Issues**: [github.com/anysiteio/agent-skills/issues](https://github.com/anysiteio/agent-skills/issues)
- **Documentation**: Full skill documentation in each `skills/*/SKILL.md` file
- **MCP Server**: [docs.anysite.io/mcp-server/tools](https://docs.anysite.io/mcp-server/tools)

## Changelog

### Version 1.1.0 (2026-01-29)

- Added 3 new advanced skills:
  - `anysite-person-analyzer` - Deep multi-platform person intelligence
  - `anysite-vc-analyst` - Investor research and fundraising workflows
  - `anysite-competitor-analyzer` - Comprehensive competitor intelligence
- Enhanced GitHub integration support
- Updated documentation structure

### Version 1.0.0 (2026-01-29)

- Initial release with 8 core skills
- Support for LinkedIn, Instagram, Twitter/X, Reddit, YouTube, Y Combinator, SEC, and web scraping
- Zero-configuration setup
- Complete skill documentation and reference guides
- Marketplace integration for easy installation
