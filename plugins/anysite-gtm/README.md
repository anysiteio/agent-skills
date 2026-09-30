# Anysite GTM

A go-to-market pack for Claude built on the [anysite](https://anysite.io) MCP server. It starts
with a short onboarding interview that learns your business once, then uses that context in
every sales and growth workflow: sourcing companies and people, qualifying leads, enriching and
scoring your CRM, catching buying signals and drafting cold outreach.

## Start here

Install the plugin, start a new session and run `/anysite-gtm-onboarding`. It reads your
company website, drafts answers for you to confirm, and asks about what you sell, your ideal
customer profile, buyer personas, competitors, best customers, buying signals, CRM and outreach
voice, plus your goal for the next 30 days. Re-run it any time to change the profile.

## Skills

| Skill | What it does |
|---|---|
| `anysite-gtm-onboarding` | The interview above; saves your GTM profile |
| `anysite-mcp` | How to use the anysite tools well: sources, costs, tables, joins, lead review |
| `anysite-company-sourcing` | Build company lists from a 70M+ company database with precise filters |
| `anysite-people-sourcing` | Find buyers and personas across 856M+ professional profiles |
| `anysite-crm-setup` | Connect HubSpot or Pipedrive and agree a safe field mapping |
| `anysite-crm-enrich` | Fill missing titles, profiles, firmographics and emails in the CRM |
| `anysite-crm-prospect` | Find net-new leads and add them to the CRM without duplicates |
| `anysite-crm-score` | Score accounts against your ICP with an explicit rubric |
| `anysite-crm-signals` | Sweep target accounts for funding, hires, hiring surges and news |
| `anysite-crm-champions` | Spot past champions who moved to new companies |
| `anysite-crm-inbound` | Fast verdict on one inbound lead: real, fit, route, talking points |
| `anysite-crm-account-brief` | One-page brief before a meeting |
| `anysite-crm-lookalikes` | Find companies like your best customers |
| `anysite-crm-competitor-intel` | Find competitors' customers and what they complain about |
| `anysite-crm-audit` | Read-only CRM data quality audit |
| `anysite-outreach` | Cold first-touch and follow-ups grounded in a real, dated detail |

Lists of companies and people open as an interactive table in Claude apps that render MCP Apps,
where you can filter, enrich and go through leads one by one (Yes / No / Skip).

## What the plugin connects to and stores

- **MCP connector:** the plugin adds the remote anysite MCP server at
  `https://mcp.anysite.io/mcp`. You sign in with your anysite account on first use. Data
  requests are sent to anysite and use your anysite plan (credits or Unlimited).
- **CRM:** only when you run `anysite-crm-setup` and connect HubSpot or Pipedrive through
  anysite. Writes to the CRM are fill-blank by default, previewed as a dry run for bulk changes,
  and can be undone.
- **Local files:** in Claude Code, onboarding saves your GTM profile to
  `~/.claude/skills/anysite-gtm-profile/SKILL.md` and CRM setup saves the field mapping to
  `~/.claude/skills/anysite-crm-profile/SKILL.md`. In apps without file access you get the profile
  as text to paste into your project instructions. No API keys or passwords are stored.
- The plugin runs no hooks, scripts or local servers.

## More

The full anysite suite, including research, social and monitoring skills, is the
`anysite-skills` plugin in the same marketplace. Install one of the two, not both.
- Website: [anysite.io](https://anysite.io)
- Documentation: [app.anysite.io/docs/mcp/overview](https://app.anysite.io/docs/mcp/overview)
- Support: support@anysite.io
- Source and issues: [github.com/anysiteio/agent-skills](https://github.com/anysiteio/agent-skills)
- License: MIT
