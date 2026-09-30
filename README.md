# Anysite Agent Skills

Official [anysite](https://anysite.io) skills and plugins for AI agents: go-to-market workflows,
people and company sourcing, CRM enrichment, market and social research, and recurring
monitoring — on top of the anysite MCP server. Works in Claude (claude.ai, Claude Desktop,
Cowork, Claude Code), Codex and any client that supports remote MCP.

**What the agent gets access to:**

- **900+ data sources and 5,000+ endpoints** — professional networks, companies and funding,
  jobs, social media, reviews, e-commerce, finance and crypto, real estate, academic papers,
  government registries, maps and local businesses, news — plus a universal web parser for
  any other page. The live catalog is always one free `discover` call away.
- **Two databases for bulk sourcing** — 856M+ professional profiles and 70M+ companies,
  filterable by role, seniority, industry, size, geography and more.
- **10 MCP tools**, plus 8 CRM tools when CRM integration is on (below).

Plans and pricing: [anysite.io/pricing](https://anysite.io/pricing/).

## Plugins

The marketplace ships two plugins. Each installs its skills **and** the anysite MCP connector
in one step. Install one of them, not both — `anysite-gtm` is a subset of `anysite-skills`, and
installing both duplicates the skills and the connector.

| Plugin | For | Skills |
|---|---|---|
| `anysite-gtm` | Sales, growth and RevOps teams | 16 GTM skills, starting with `/anysite-gtm-onboarding` |
| `anysite-skills` | Everything: GTM plus research, social, investors and monitoring | all 34 skills |

## MCP tools

| Tool | What it does | Credits |
|---|---|---|
| `discover` | Lists sources, endpoints and their exact parameters | free |
| `execute` | Calls an endpoint; returns the first results and a `cache_key` | paid |
| `get_page` | Pages through a cached result | free |
| `query_cache` | Filters, sorts and aggregates a cached result | free |
| `search_requests` | Finds your earlier calls and their cache keys (7-day history, across sessions) | free |
| `merge_data` | Stacks results, or enriches one list with another by a shared key (`join_on`) | free |
| `export_data` | Exports a result as JSON, CSV or JSONL | free |
| `show_entity_table` | Opens companies or people as an interactive table: filter, sort, select, enrich, export | free |
| `review_leads` | Goes through companies one card at a time: Yes / No / Skip | free |
| `record_review` | Saves lead review answers given in chat | free |

**CRM tools** (HubSpot, Pipedrive) appear after you enable CRM integration in your anysite
dashboard: `crm_list_connections`, `crm_connect`, `crm_connect_status`, `crm_get_schema`,
`crm_query_records`, `crm_upsert_contacts`, `crm_upsert_companies`, `crm_undo`. Writes are
fill-blank by default, previewable as a dry run and reversible with `crm_undo`.

The interactive table and lead review render in clients that support MCP Apps (claude.ai,
Claude Desktop, ChatGPT). In Claude Code the same results are available through `get_page`,
`query_cache` and `export_data`.

## Available Skills

<!-- BEGIN_SKILLS_TABLE -->
| Name | Description | Documentation |
|------|-------------|---------------|
| **GTM** — in both `anysite-gtm` and `anysite-skills` | | |
| `anysite-gtm-onboarding` | Start here for GTM: a short interview, pre-filled from your website, that saves your offer, ICP, personas, competitors and best customers as a profile every GTM skill reads first. | [SKILL.md](plugins/anysite-gtm/skills/anysite-gtm-onboarding/SKILL.md) |
| `anysite-mcp` | Usage guide for the anysite MCP: tools, GTM source map (funding, hiring, tech stack, reviews, news), tables, joins and lead review, email cascades, cost-aware calling patterns. | [SKILL.md](plugins/anysite-gtm/skills/anysite-mcp/SKILL.md) |
| `anysite-company-sourcing` | Query craft for the 70M-company database - per-field filters instead of keyword soup (measured: naive 1/5 relevant vs structured 5/5). | [SKILL.md](plugins/anysite-gtm/skills/anysite-company-sourcing/SKILL.md) |
| `anysite-people-sourcing` | Source people from the 856M-profile database - derived seniority/function, alumni, career shape, territory buckets. | [SKILL.md](plugins/anysite-gtm/skills/anysite-people-sourcing/SKILL.md) |
| `anysite-crm-setup` | Connect HubSpot or Pipedrive and configure safe AI enrichment: guided discovery, deterministic field mapping, dry-run previews, fill-blank policy and undo. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-setup/SKILL.md) |
| `anysite-crm-enrich` | Enrich existing CRM records with fresh data - titles, profiles, firmographics, funding, emails. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-enrich/SKILL.md) |
| `anysite-crm-prospect` | Find net-new leads, let the user pick them, and push them into the CRM deduplicated - companies first, then contacts. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-prospect/SKILL.md) |
| `anysite-crm-score` | Score CRM companies against your ICP with an explicit rubric and write the score into the mapped field. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-score/SKILL.md) |
| `anysite-crm-signals` | Sweep target accounts for buying signals - funding, exec hires, hiring surges, news - and prioritize who to reach out to today. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-signals/SKILL.md) |
| `anysite-crm-champions` | Detect job changes among CRM contacts, flag past champions at new accounts, propose re-engagement plays. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-champions/SKILL.md) |
| `anysite-crm-inbound` | Instant read-only verdict on one inbound lead - identity, company reality check, ICP fit, route and talking points. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-inbound/SKILL.md) |
| `anysite-crm-account-brief` | Pre-meeting one-pager for a CRM account: CRM context plus funding, exec changes, news, key people's recent activity. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-account-brief/SKILL.md) |
| `anysite-crm-lookalikes` | Derive your real ICP from your best customers and find lookalike companies across 70M+ company records. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-lookalikes/SKILL.md) |
| `anysite-crm-competitor-intel` | Displacement hunting: who uses a competitor (technographics), what their users complain about (review mining), tagged into the CRM. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-competitor-intel/SKILL.md) |
| `anysite-crm-audit` | Read-only CRM data quality audit: field completeness, duplicate candidates, stale records, enrichability estimate. | [SKILL.md](plugins/anysite-gtm/skills/anysite-crm-audit/SKILL.md) |
| `anysite-outreach` | Cold first-touch and follow-ups (email, DM) grounded in a real, dated detail - funding, job change, post, competitor switch - not generic. | [SKILL.md](plugins/anysite-gtm/skills/anysite-outreach/SKILL.md) |
| **Research, social, investors and monitoring** — in `anysite-skills` | | |
| `anysite-lead-generation` | Find and enrich prospects with profile search, email discovery and contact extraction from websites. | [SKILL.md](skills/anysite-lead-generation/SKILL.md) |
| `anysite-person-analyzer` | Deep multi-platform analysis of a person: professional profile, posts and activity, Twitter/X, Reddit, GitHub and web presence. | [SKILL.md](skills/anysite-person-analyzer/SKILL.md) |
| `anysite-competitor-intelligence` | Track competitors across professional networks, social media, Y Combinator and the web: hiring, content, positioning. | [SKILL.md](skills/anysite-competitor-intelligence/SKILL.md) |
| `anysite-competitor-analyzer` | Comprehensive competitive intelligence: web, company data, social monitoring, leadership, GitHub and community sentiment. | [SKILL.md](skills/anysite-competitor-analyzer/SKILL.md) |
| `competitor-discovery` | Find a startup's real competitors - direct competitors, substitutes, workarounds and convergence threats. | [SKILL.md](skills/competitor-discovery/SKILL.md) |
| `customer-pain-mining` | Extract verbatim customer complaints about competitors for landing-page copy, customer development and product strategy. | [SKILL.md](skills/customer-pain-mining/SKILL.md) |
| `positioning-map` | Build a positioning map for 3-5 competitors and find the empty quadrant to own. | [SKILL.md](skills/positioning-map/SKILL.md) |
| `anysite-market-research` | Research tech markets and startup ecosystems via Y Combinator, SEC filings and social platforms. | [SKILL.md](skills/anysite-market-research/SKILL.md) |
| `anysite-trend-analysis` | Detect emerging trends and viral content across Twitter/X, Reddit, YouTube, LinkedIn and Instagram. | [SKILL.md](skills/anysite-trend-analysis/SKILL.md) |
| `anysite-brand-reputation` | Monitor brand mentions and sentiment across social platforms and identify reputation risks. | [SKILL.md](skills/anysite-brand-reputation/SKILL.md) |
| `anysite-influencer-discovery` | Discover and evaluate influencers across Instagram, Twitter/X, LinkedIn and YouTube. | [SKILL.md](skills/anysite-influencer-discovery/SKILL.md) |
| `anysite-content-analytics` | Track post performance and content strategy across Instagram, YouTube, LinkedIn, Twitter/X and Reddit. | [SKILL.md](skills/anysite-content-analytics/SKILL.md) |
| `anysite-audience-analysis` | Analyze audience demographics, engagement and follower behavior across Instagram, YouTube and LinkedIn. | [SKILL.md](skills/anysite-audience-analysis/SKILL.md) |
| `anysite-vc-analyst` | Investor research and outreach: verify roles, score stage and thesis fit, detect portfolio conflicts, draft messages. | [SKILL.md](skills/anysite-vc-analyst/SKILL.md) |
| `anysite-monitor` | Recurring monitoring that reports only what's new or changed since the last run, on a schedule. | [SKILL.md](skills/anysite-monitor/SKILL.md) |
| `anysite-cli` | Operate the anysite command-line tool: extraction, batch processing, dataset pipelines, scheduling, database loads. | [SKILL.md](skills/anysite-cli/SKILL.md) |
| `anysite-mcp-migration` | Migrate old skills and prompts from the first-generation anysite MCP tools to the current meta-tools. | [SKILL.md](skills/anysite-mcp-migration/SKILL.md) |
| `skill-audit` | Static security audit of Claude Code skills and plugins - hooks, prompt injection, dangerous permissions. Run manually with `/skill-audit`. | [SKILL.md](skills/skill-audit/SKILL.md) |
<!-- END_SKILLS_TABLE -->

## Installation

### Plugin — Claude Code, Claude Desktop, Cowork

```bash
claude plugin marketplace add anysiteio/agent-skills
claude plugin install anysite-gtm@anysite      # GTM pack
# or
claude plugin install anysite-skills@anysite   # full suite
```

Inside a Claude Code session use `/plugin marketplace add anysiteio/agent-skills` instead.
In Claude Desktop and Cowork install from the UI: **Customize → Plugins → + → Add marketplace →
`anysiteio/agent-skills` → Install "Anysite GTM" or "anysite-skills"**. Toggle individual
skills after install; type `/` in a session to see what a plugin exposes. You sign in to
anysite in the browser the first time the connector is used.

### One-line installer — Claude Code, Codex, Claude Desktop

```bash
# GTM package (recommended for sales/growth teams)
npx @anysiteio/agent-skills gtm

# Everything
npx @anysiteio/agent-skills
```

Installs skills and registers the anysite remote MCP server. Supported agents are
auto-detected (in an interactive terminal you get a picker, `--target` forces):

- **Claude Code** — skills into `~/.claude/skills`, MCP via `claude mcp add`
- **Codex** — skills into `~/.codex/skills`, MCP via `config.toml` (mcp-remote)
- **Claude Desktop + Cowork** — MCP merged into `claude_desktop_config.json` (restart the
  app); skills are account-level, so the installer prepares ready-to-upload zips in
  `~/Downloads/anysite-skills/` — upload once at Settings → Skills and they work in Desktop,
  Cowork and claude.ai.

You can also just send the line to your agent (Claude Code / Codex) — it will run it for you.

```bash
npx @anysiteio/agent-skills --list        # list bundles and skills
npx @anysiteio/agent-skills --status      # what is installed
npx @anysiteio/agent-skills --skill NAME  # install specific skill(s)
npx @anysiteio/agent-skills --uninstall   # remove anysite skills
npx @anysiteio/agent-skills --no-mcp      # skills only, skip MCP registration
```

### Other MCP clients

Connect the remote MCP server `https://mcp.anysite.io/mcp` (OAuth sign-in on first use) —
setup guides for each client: [docs.anysite.io/mcp-server](https://docs.anysite.io/mcp-server).

## GTM onboarding

After installing the GTM pack, start a new session and run `/anysite-gtm-onboarding`. It reads
your website first, then asks you to confirm and complete a short profile: what you sell, your
ICP, buyer personas, competitors, best customers, buying signals, CRM, outreach voice and your
goal for the next 30 days. In Claude Code the profile is saved as
`~/.claude/skills/anysite-gtm-profile/SKILL.md`; in claude.ai, Desktop or Cowork without file
access you get it as a block to paste into Project instructions. Every GTM skill then uses it
as the default ICP, personas and offer, so you stop retyping them. Re-run the skill to change
the profile. If you use HubSpot or Pipedrive, it hands off to `/anysite-crm-setup` next.

## Quick start

Once installed, just ask:

```
"Set me up"                                              → anysite-gtm-onboarding
"Find 200 B2B SaaS companies in Germany, 50-500 people"  → anysite-company-sourcing (opens a table)
"Let me go through them one by one"                      → review_leads cards
"Add funding data and find the VP Sales at the yes ones" → Crunchbase join + anysite-people-sourcing
"Which of my HubSpot accounts raised money this month?"  → anysite-crm-signals
"Write a first email to this lead"                       → anysite-outreach
"Research this person before my call"                    → anysite-person-analyzer
"Tell me every week what my competitors changed"         → anysite-monitor
```

## Updating

- **npx:** re-run the same command — `npx` always fetches the latest published version.
- **Plugin:** updates are two-stage — the plugin's Update button compares against the
  marketplace's local catalog, not GitHub. If it says "On latest version" right after a
  release, first update the marketplace row (Plugins → Personal plugins → agent-skills), then
  the plugin's Update button activates. "Sync automatically" on the marketplace does this on a
  schedule.

## Privacy

Data requests go to the anysite MCP server and use your anysite plan. The plugins run no hooks,
scripts or local servers; the GTM and CRM profiles are plain files under `~/.claude/skills/`.
Privacy policy: [app.anysite.io/docs/legal/privacy-policy](https://app.anysite.io/docs/legal/privacy-policy).

## Contributing

1. Fork this repository.
2. Add the skill as `skills/<name>/SKILL.md` — or, for a GTM skill, as
   `plugins/anysite-gtm/skills/<name>/SKILL.md` — with frontmatter:
   ```yaml
   ---
   name: your-skill
   description: What the skill does and when to use it
   ---
   ```
3. Add its path to `.claude-plugin/plugin.json` (and to `bundles.json` for a GTM skill).
4. Add it to the skills table in this README.
5. Run `claude plugin validate .` and open a pull request.

## Support

- **Issues:** [github.com/anysiteio/agent-skills/issues](https://github.com/anysiteio/agent-skills/issues)
- **MCP server docs:** [docs.anysite.io/mcp-server](https://docs.anysite.io/mcp-server)
- **Email:** support@anysite.io

## License

MIT — see [LICENSE](LICENSE).
