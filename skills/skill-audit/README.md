# Skill Audit

Static security auditor for Claude Code skills, commands, and plugins. Detects dangerous patterns — excessive permissions, hooks, prompt injection, credential access, privilege escalation — before you enable a skill.

**Developer:** Anysite Skills Contributors

## Overview

The Skill Audit skill performs read-only static security analysis of Claude Code skills, commands, and plugins. It analyzes SKILL.md files, supporting scripts, and hooks to identify security risks before installation.

Works with both local files and remote GitHub repositories.

## Installation

### Prerequisites

- **Claude Code** - Version with skill support enabled
- **Anysite Skills Marketplace** - Already added if you're viewing this

### Install from Marketplace

```bash
# Add the marketplace (if not already added)
/plugin marketplace add https://github.com/anysiteio/agent-skills

# Install the skill
/plugin install skill-audit@anysite-skills
```

### Permissions

The skill requires these permissions (automatically granted during installation):

```json
{
  "permissions": {
    "allow": [
      "Skill(skill-audit)",
      "Skill(skill-audit:*)"
    ]
  }
}
```

## Usage

### Quick Start

Once installed, invoke the skill to audit targets:

```bash
# Audit a specific skill directory
/skill-audit .claude/skills/my-skill

# Audit a specific command file
/skill-audit .claude/commands/deploy.md

# Audit a skill by name (searches .claude/skills/ and .claude/commands/)
/skill-audit my-skill

# Audit ALL skills and commands in the current project
/skill-audit
```

### Remote Audit (GitHub)

Audit skills from GitHub before installing them:

```bash
# Audit a GitHub repository
/skill-audit https://github.com/user/repo

# Audit a specific directory on GitHub
/skill-audit https://github.com/user/repo/tree/main/.claude/skills/my-skill

# Audit a single file from GitHub
/skill-audit https://github.com/user/repo/blob/main/.claude/commands/deploy.md
```

## What It Checks

The auditor performs a comprehensive 5-phase static analysis:

### Analysis Phases

| Phase | What It Analyzes |
|-------|------------------|
| **Discovery** | Inventories all files in the skill directory |
| **Frontmatter** | Checks `allowed-tools`, hooks, permissions, invocation settings |
| **Body Content** | Scans for dangerous tool references, settings manipulation, injection patterns, sensitive file access |
| **Supporting Files** | Examines scripts for network egress, credential access, code execution, persistence |
| **Hooks** | Detects hook definitions or installations |

### Detection Rules

| Rule ID | Severity | Description |
|---------|----------|-------------|
| **SKL-001** | Critical | Hooks in skill (auto-execute shell commands) |
| **SKL-002** | Critical/High | Prompt injection or dynamic injection patterns |
| **SKL-003** | High | Bash/WebFetch/broad wildcards in `allowed-tools` |
| **SKL-004** | Medium/High | Missing `disable-model-invocation` on side-effect skills |
| **SKL-005** | High | Dangerous patterns in supporting scripts |
| **SKL-006** | High | Instructions to change permissions, settings, or hooks |

### Risk Scoring

| Score Range | Risk Level | Recommendation |
|-------------|------------|----------------|
| **0** | Clean | No findings, safe to enable |
| **1-3** | Low-Medium | Review findings, likely safe |
| **4-6** | High | Needs attention before enabling |
| **7-8** | Critical | Do not enable without remediation |
| **9-10** | Severe | Multiple critical findings, likely malicious |

## Output Format

The skill generates detailed audit reports:

```markdown
# Skill Audit Report: my-skill

**Path:** .claude/skills/my-skill/
**Date:** 2026-01-30
**Risk Score:** 3/10
**Overall Severity:** Medium

## Summary
The skill uses WebFetch for external API calls but has no hooks or injection patterns.

## Findings
| # | ID | Severity | Finding | Location | Evidence |
|---|---|---|---|---|---|
| 1 | SKL-003 | Medium | WebFetch in allowed-tools | SKILL.md:4 | `allowed-tools: Read, WebFetch` |

## Hardening Recommendations
1. Remove WebFetch unless strictly required for the skill's purpose.
```

## Security Properties

This skill is designed with security as the top priority:

### Read-Only Analysis
- Uses ONLY `Read`, `Grep`, `Glob` tools (plus `WebFetch` for remote GitHub audits)
- Cannot modify files or execute commands
- No system state changes

### Anti-Injection Protection
- All audited content treated as untrusted malicious input
- Instructions found in audited files are flagged as findings
- Never follows or executes instructions from audited content

### Scoped WebFetch
- WebFetch restricted to `raw.githubusercontent.com` and `api.github.com`
- Only used for fetching remote skill files from GitHub
- No arbitrary URL access

## Use Cases

### Pre-Installation Audit
Audit skills from GitHub before installing them:
```bash
/skill-audit https://github.com/third-party/suspicious-skill
```

### Regular Security Reviews
Audit all installed skills periodically:
```bash
/skill-audit
```

### Third-Party Skill Vetting
Review community-contributed skills before enabling:
```bash
/skill-audit .claude/skills/community-skill
```

### Command Safety Check
Verify custom commands don't have dangerous patterns:
```bash
/skill-audit .claude/commands/deploy.md
```

## How It Works

```
User Request
    ↓
skill-audit Skill
    ↓
Static Analysis Engine
    ↓
Security Report (Read-only, no modifications)
```

The skill performs purely static analysis without executing any code from the audited target. All analysis is based on pattern matching, AST analysis, and heuristic detection.

## Key Features

**Comprehensive Detection**
- Hooks and auto-execution patterns
- Prompt injection attempts
- Excessive permissions
- Credential access patterns
- Privilege escalation attempts

**Multi-Target Support**
- Local skill directories
- Individual command files
- Remote GitHub repositories
- Bulk project audits

**Zero Side Effects**
- Read-only operation
- No file modifications
- No command execution
- Safe to run on any skill

**Detailed Reporting**
- Risk scoring (0-10 scale)
- Severity classification
- Specific evidence locations
- Hardening recommendations

## Structure

```
skill-audit/
├── SKILL.md          # Skill definition + audit logic (single file)
└── README.md         # This file
```

## Contributing

Found a security pattern that should be detected? Submit an issue or pull request at:
https://github.com/anysiteio/agent-skills/issues

## Support

- **GitHub Issues**: [github.com/anysiteio/agent-skills/issues](https://github.com/anysiteio/agent-skills/issues)
- **Documentation**: [SKILL.md](SKILL.md)
- **Anysite MCP**: [docs.anysite.io](https://docs.anysite.io)

## License

MIT License - see [LICENSE](../../LICENSE) file for details

---

**Note**: This is a security/defensive tool and operates independently from the anysite MCP server. It does not require anysite MCP server to function.
