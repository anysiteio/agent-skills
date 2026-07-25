# Anysite MCP Skills

Official anysite agent skills for LinkedIn intelligence, social media analysis, and data extraction. Works with Claude Code, Cursor, and other AI coding assistants that support MCP.

## 💎 MCP Unlimited Plan

Unlimited access to all 65+ Anysite MCP tools for just $30/month - perfect for AI agents and automation.

Get unlimited requests through Remote MCP Server with no request limits. Ideal for Claude Desktop, Cursor, n8n, and any MCP-compatible client.

📖 Learn more about MCP Unlimited https://docs.anysite.io/mcp-server/unlimited-plan

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
| `skill-audit` | Static security auditor for Claude Code skills. Detects hooks, prompt injection, and dangerous permissions. | [SKILL.md](skills/skill-audit/SKILL.md) |
| `anysite-cli` | Command-line tool operator for anysite CLI. Execute data extraction, batch processing, dataset pipelines, scheduling, and database operations. | [SKILL.md](skills/anysite-cli/SKILL.md) |
| `competitor-discovery` | Find a startup's real competitors — the alternatives customers actually compare them to. Maps direct competitors, substitutes, workarounds, and convergence threats across LinkedIn, Reddit, YouTube, Twitter, YC, and SEC. | [SKILL.md](skills/competitor-discovery/SKILL.md) |
| `customer-pain-mining` | Extract verbatim customer complaints about competitors for landing-page copy, custdev prep, and product strategy. Returns pain clusters with exact quotes plus a white-space section of unmet feature requests. | [SKILL.md](skills/customer-pain-mining/SKILL.md) |
| `positioning-map` | Build a positioning map for 3–5 competitors and identify the empty quadrant to own. Maps 5 signal axes and returns a comparison table, candidate positioning moves, and a one-sentence positioning statement. | [SKILL.md](skills/positioning-map/SKILL.md) |
| `anysite-crm-setup` | Connect the user's CRM (HubSpot) and configure safe AI enrichment: guided discovery, deterministic local field mapping, dry-run previews, fill-blank policy and undo. | [SKILL.md](skills/anysite-crm-setup/SKILL.md) |
| `anysite-mcp` | Usage guide for the anysite MCP: meta-tools, GTM source map (funding, hiring, tech stack, reviews, news), email cascades, and cost-aware calling patterns. | [SKILL.md](skills/anysite-mcp/SKILL.md) |
| `anysite-crm-enrich` | Enrich existing CRM records with fresh data - titles, LinkedIn profiles, firmographics, emails. Fill-blank policy, dry-run previews, undo. | [SKILL.md](skills/anysite-crm-enrich/SKILL.md) |
| `anysite-crm-signals` | Sweep CRM target accounts for buying signals - funding, exec hires, hiring surges, news, mentions - and prioritize who to reach out to today. | [SKILL.md](skills/anysite-crm-signals/SKILL.md) |
| `anysite-crm-champions` | Detect job changes among CRM contacts, flag past champions at new accounts, propose re-engagement plays. | [SKILL.md](skills/anysite-crm-champions/SKILL.md) |
| `anysite-crm-prospect` | Find net-new leads and push them into the CRM deduplicated - companies first, then contacts with associations. | [SKILL.md](skills/anysite-crm-prospect/SKILL.md) |
| `anysite-crm-audit` | Read-only CRM data quality audit: field completeness, duplicate candidates, stale records, enrichability estimate. | [SKILL.md](skills/anysite-crm-audit/SKILL.md) |
| `anysite-crm-score` | Score CRM companies against your ICP with an explicit rubric and write the score into the mapped field. | [SKILL.md](skills/anysite-crm-score/SKILL.md) |
| `anysite-crm-competitor-intel` | Displacement hunting: who uses a competitor (technographics), what their users complain about (review mining), tagged into the CRM. | [SKILL.md](skills/anysite-crm-competitor-intel/SKILL.md) |
| `anysite-crm-account-brief` | Pre-meeting one-pager for a CRM account: CRM context + funding, exec changes, news, key people's recent activity. | [SKILL.md](skills/anysite-crm-account-brief/SKILL.md) |
| `anysite-crm-lookalikes` | Derive your real ICP from closed-won customers and find lookalike companies across 70M+ company records. | [SKILL.md](skills/anysite-crm-lookalikes/SKILL.md) |
<!-- END_SKILLS_TABLE -->

## Installation

One line — installs skills into Claude Code / Codex and registers the anysite remote MCP server (sign-in happens in your browser on first use):

```bash
# GTM package (recommended for sales/growth teams): CRM workflows + MCP
npx @anysiteio/agent-skills gtm

# Everything: all skills + MCP
npx @anysiteio/agent-skills
```

You can also just send this line to your agent (Claude Code / Codex) — it will run it for you.

Other commands:

```bash
npx @anysiteio/agent-skills --list        # list bundles and skills
npx @anysiteio/agent-skills --status      # what is installed
npx @anysiteio/agent-skills --skill NAME  # install specific skill(s)
npx @anysiteio/agent-skills --uninstall   # remove anysite skills
npx @anysiteio/agent-skills --no-mcp      # skills only, skip MCP registration
```

After installing the GTM package, restart your agent session and say `/anysite-crm-setup` — it connects your HubSpot and configures safe field mapping.

To update, re-run the same command: `npx` always fetches the latest published version.

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
