#!/usr/bin/env node

/**
 * Anysite agent setup: installs skills and registers the anysite remote MCP
 * server (https://mcp.anysite.io/mcp, OAuth on first use) for:
 *   - Claude Code   (~/.claude: skills dir + `claude mcp add`)
 *   - Codex         (~/.codex: skills dir + config.toml via mcp-remote)
 *   - Claude Desktop & Cowork (one app: claude_desktop_config.json via
 *     mcp-remote; skills are account-level -> ready-to-upload zips)
 *
 * Usage:
 *   npx @anysiteio/agent-skills             Install ALL skills + register MCP
 *   npx @anysiteio/agent-skills gtm         Install the GTM bundle + register MCP
 *   npx @anysiteio/agent-skills --list      List skills and bundles
 *   npx @anysiteio/agent-skills --status    Show what is installed
 *   npx @anysiteio/agent-skills --skill N   Install specific skill(s), no MCP
 *   npx @anysiteio/agent-skills --uninstall Remove anysite skills (MCP entries kept)
 *
 * Flags: --no-mcp | --target claude|codex|desktop (repeatable) | --yes | --help
 * In an interactive terminal with several agents detected, a picker is shown;
 * non-interactive runs (e.g. an agent executing this line) install everywhere.
 */

import { execFileSync } from "node:child_process";
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_SRC = join(PKG_ROOT, "skills");
const BUNDLES = JSON.parse(readFileSync(join(PKG_ROOT, "bundles.json"), "utf8"));
const PKG_VERSION = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;

const HOME = process.env.HOME || homedir();
const CLAUDE_DIR = join(HOME, ".claude");
const CODEX_DIR = join(HOME, ".codex");
const CODEX_CONFIG = join(CODEX_DIR, "config.toml");
// Claude Desktop and Cowork are the same app sharing one config file.
const DESKTOP_DIR = process.platform === "darwin"
  ? join(HOME, "Library", "Application Support", "Claude")
  : process.platform === "win32"
    ? join(process.env.APPDATA || join(HOME, "AppData", "Roaming"), "Claude")
    : join(HOME, ".config", "Claude");
const DESKTOP_CONFIG = join(DESKTOP_DIR, "claude_desktop_config.json");
const ZIPS_DST = join(HOME, "Downloads", "anysite-skills");
// Claude Code and Codex share the same skills convention: <dir>/skills/<name>/SKILL.md
const SKILLS_DST = { claude: join(CLAUDE_DIR, "skills"), codex: join(CODEX_DIR, "skills") };
const manifestPath = (dstRoot) => join(dstRoot, ".anysite-skills.json");

const MCP_NAME = "anysite";
const MCP_URL = "https://mcp.anysite.io/mcp";

// ── args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = { bundle: null, list: false, status: false, uninstall: false, help: false, mcp: true, yes: false, skills: [], targets: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--list" || a === "-l") flags.list = true;
  else if (a === "--status") flags.status = true;
  else if (a === "--uninstall" || a === "--remove") flags.uninstall = true;
  else if (a === "--help" || a === "-h") flags.help = true;
  else if (a === "--no-mcp") flags.mcp = false;
  else if (a === "--yes" || a === "-y") flags.yes = true;
  else if (a === "--skill" || a === "-s") { if (args[++i]) flags.skills.push(args[i]); }
  else if (a === "--target") { if (args[++i]) flags.targets.push(args[i]); }
  else if (!a.startsWith("-") && BUNDLES[a]) flags.bundle = a;
  else { console.error(`Unknown argument: ${a} (see --help)`); process.exit(1); }
}

// ── helpers ─────────────────────────────────────────────────────────────────

const TARGET_LABEL = { claude: "Claude Code", codex: "Codex", desktop: "Claude Desktop + Cowork" };

function availableSkills() {
  if (!existsSync(SKILLS_SRC)) return [];
  return readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(SKILLS_SRC, d.name, "SKILL.md")))
    .map((d) => d.name)
    .sort();
}

function skillDescription(name) {
  try {
    const m = readFileSync(join(SKILLS_SRC, name, "SKILL.md"), "utf8")
      .match(/^description:\s*(.+)$/m);
    return m ? m[1].trim().replace(/\s+/g, " ").slice(0, 96) : "";
  } catch { return ""; }
}

function readManifest(dstRoot) {
  try { return JSON.parse(readFileSync(manifestPath(dstRoot), "utf8")); } catch { return null; }
}

function detectTargets() {
  if (flags.targets.length) return flags.targets;
  const t = [];
  if (existsSync(CLAUDE_DIR)) t.push("claude");
  if (existsSync(CODEX_DIR)) t.push("codex");
  if (existsSync(DESKTOP_DIR)) t.push("desktop");
  return t;
}

async function pickTargets(detected) {
  // Interactive picker: only in a real terminal, when nothing was forced.
  if (flags.targets.length || flags.yes || detected.length < 2) return detected;
  if (!process.stdin.isTTY || !process.stdout.isTTY) return detected;
  console.log("\nDetected agents:");
  detected.forEach((t, i) => console.log(`  ${i + 1}. ${TARGET_LABEL[t]}`));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("\nInstall for which? [Enter = all, or numbers like 1,3]: ")).trim();
  rl.close();
  if (!answer) return detected;
  const picked = answer.split(/[,\s]+/)
    .map((n) => detected[parseInt(n, 10) - 1])
    .filter(Boolean);
  return picked.length ? [...new Set(picked)] : detected;
}

function hasClaudeCli() {
  try { execFileSync("claude", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

// ── skills install / uninstall (Claude Code, Codex) ─────────────────────────

function installSkills(names, dstRoot) {
  mkdirSync(dstRoot, { recursive: true });
  const installed = [];
  const missing = [];
  for (const name of names) {
    const src = join(SKILLS_SRC, name);
    if (!existsSync(join(src, "SKILL.md"))) { missing.push(name); continue; }
    const dst = join(dstRoot, name);
    rmSync(dst, { recursive: true, force: true });
    cpSync(src, dst, { recursive: true });
    installed.push(name);
  }
  const prev = readManifest(dstRoot);
  const all = [...new Set([...(prev?.skills ?? []), ...installed])].sort();
  writeFileSync(manifestPath(dstRoot), JSON.stringify({
    version: PKG_VERSION,
    bundle: flags.bundle ?? prev?.bundle ?? null,
    installedAt: new Date().toISOString(),
    skills: all,
  }, null, 2));
  return { installed, missing };
}

function uninstallSkills(dstRoot) {
  const manifest = readManifest(dstRoot);
  const tracked = new Set(manifest?.skills ?? []);
  const removed = [];
  if (existsSync(dstRoot)) {
    for (const d of readdirSync(dstRoot, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      // remove tracked skills plus legacy anysite-* installs; never touch anything else
      if (tracked.has(d.name) || d.name.startsWith("anysite-")) {
        rmSync(join(dstRoot, d.name), { recursive: true, force: true });
        removed.push(d.name);
      }
    }
  }
  rmSync(manifestPath(dstRoot), { force: true });
  return removed;
}

// ── skills for Claude Desktop / Cowork: ready-to-upload zips ────────────────
// Desktop/Cowork skills are account-level (uploaded once, they work in Desktop,
// Cowork AND claude.ai). We can't install files for them — we prepare the zips.

function buildSkillZips(names) {
  rmSync(ZIPS_DST, { recursive: true, force: true });
  mkdirSync(ZIPS_DST, { recursive: true });
  const built = [];
  const failed = [];
  for (const name of names) {
    if (!existsSync(join(SKILLS_SRC, name, "SKILL.md"))) continue;
    const out = join(ZIPS_DST, `${name}.zip`);
    try {
      if (process.platform === "win32") {
        execFileSync("powershell", ["-NoProfile", "-Command",
          `Compress-Archive -Path '${join(SKILLS_SRC, name)}' -DestinationPath '${out}' -Force`], { stdio: "ignore" });
      } else {
        execFileSync("zip", ["-rq", out, name], { cwd: SKILLS_SRC, stdio: "ignore" });
      }
      built.push(name);
    } catch { failed.push(name); }
  }
  return { built, failed };
}

// ── MCP registration ────────────────────────────────────────────────────────

function registerMcpClaude() {
  if (!hasClaudeCli()) {
    return { ok: false, note: `claude CLI not found — run manually:\n  claude mcp add --scope user --transport http ${MCP_NAME} ${MCP_URL}` };
  }
  try {
    execFileSync("claude", ["mcp", "get", MCP_NAME], { stdio: "ignore" });
    return { ok: true, note: `MCP "${MCP_NAME}" already registered in Claude Code — kept as is.` };
  } catch { /* not registered yet */ }
  try {
    execFileSync("claude", ["mcp", "add", "--scope", "user", "--transport", "http", MCP_NAME, MCP_URL], { stdio: "ignore" });
    return { ok: true, note: `MCP "${MCP_NAME}" registered in Claude Code (user scope). Sign-in happens in the browser on first use.` };
  } catch (e) {
    return { ok: false, note: `Could not register MCP automatically (${e.message}). Run manually:\n  claude mcp add --scope user --transport http ${MCP_NAME} ${MCP_URL}` };
  }
}

function registerMcpCodex() {
  mkdirSync(CODEX_DIR, { recursive: true });
  let cfg = "";
  try { cfg = readFileSync(CODEX_CONFIG, "utf8"); } catch { /* new file */ }
  if (cfg.includes(`[mcp_servers.${MCP_NAME}]`)) {
    return { ok: true, note: `MCP "${MCP_NAME}" already present in Codex config — kept as is.` };
  }
  const block = `\n[mcp_servers.${MCP_NAME}]\ncommand = "npx"\nargs = ["-y", "mcp-remote", "${MCP_URL}"]\n`;
  writeFileSync(CODEX_CONFIG, cfg + block);
  return { ok: true, note: `MCP "${MCP_NAME}" added to ${CODEX_CONFIG} (via mcp-remote, OAuth in browser on first use).` };
}

function registerMcpDesktop() {
  let cfg = {};
  let raw = null;
  try { raw = readFileSync(DESKTOP_CONFIG, "utf8"); cfg = JSON.parse(raw); }
  catch (e) {
    if (raw !== null) {
      // The file exists but is not valid JSON — do NOT touch it, a bad write
      // here breaks every configured connector of the user's Desktop app.
      return { ok: false, note: `Claude Desktop config exists but is not valid JSON — not touching it. Add manually to ${DESKTOP_CONFIG}:\n  "mcpServers": { "${MCP_NAME}": { "command": "npx", "args": ["-y", "mcp-remote", "${MCP_URL}"] } }` };
    }
  }
  if (typeof cfg.mcpServers !== "object" || cfg.mcpServers === null) cfg.mcpServers = {};
  if (cfg.mcpServers[MCP_NAME]) {
    return { ok: true, note: `MCP "${MCP_NAME}" already in Claude Desktop config — kept as is.` };
  }
  if (raw !== null) writeFileSync(`${DESKTOP_CONFIG}.backup-anysite`, raw);
  cfg.mcpServers[MCP_NAME] = { command: "npx", args: ["-y", "mcp-remote", MCP_URL] };
  mkdirSync(DESKTOP_DIR, { recursive: true });
  writeFileSync(DESKTOP_CONFIG, JSON.stringify(cfg, null, 2));
  return { ok: true, note: `MCP "${MCP_NAME}" added to Claude Desktop config — covers Desktop chat AND Cowork. Restart the Claude app to pick it up (backup saved next to the config).` };
}

// ── commands ────────────────────────────────────────────────────────────────

if (flags.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ""));
  process.exit(0);
}

if (flags.list) {
  const installed = new Set(detectTargets().filter((t) => SKILLS_DST[t]).flatMap((t) => readManifest(SKILLS_DST[t])?.skills ?? []));
  console.log("\nBundles:");
  for (const [name, b] of Object.entries(BUNDLES)) {
    console.log(`  ${name} (${b.skills.length} skills) — ${b.description}`);
  }
  const skills = availableSkills();
  console.log(`\nSkills (${skills.length}):`);
  for (const name of skills) {
    console.log(`  ${installed.has(name) ? "✓" : " "} ${name.padEnd(34)} ${skillDescription(name)}`);
  }
  console.log("");
  process.exit(0);
}

if (flags.status) {
  for (const t of detectTargets()) {
    if (t === "desktop") {
      let has = false;
      try { has = !!JSON.parse(readFileSync(DESKTOP_CONFIG, "utf8")).mcpServers?.[MCP_NAME]; } catch { /* absent */ }
      console.log(`\n[desktop] MCP "${MCP_NAME}": ${has ? "registered" : "not registered"} (skills are account-level — check claude.ai → Settings → Skills)`);
      continue;
    }
    const manifest = readManifest(SKILLS_DST[t]);
    if (!manifest) { console.log(`\n[${t}] no anysite skills installed.`); continue; }
    console.log(`\n[${t}] ${manifest.skills.length} skills (package v${manifest.version}, ${manifest.installedAt})${manifest.bundle ? `, bundle: ${manifest.bundle}` : ""}`);
    for (const s of manifest.skills) console.log(`  ✓ ${s}`);
    console.log(`\nUpdate: npx @anysiteio/agent-skills@latest ${manifest.bundle ?? ""}`);
  }
  console.log("");
  process.exit(0);
}

if (flags.uninstall) {
  for (const t of detectTargets()) {
    if (t === "desktop") {
      console.log(`\n[desktop] nothing to remove locally (skills are account-level; to drop the MCP entry, delete "${MCP_NAME}" from ${DESKTOP_CONFIG}).`);
      continue;
    }
    const removed = uninstallSkills(SKILLS_DST[t]);
    console.log(removed.length
      ? `\n[${t}] removed ${removed.length} skills from ${SKILLS_DST[t]}`
      : `\n[${t}] nothing to remove.`);
  }
  console.log(`\nThe MCP entries are kept. To remove: claude mcp remove ${MCP_NAME} / edit the Codex or Desktop config.\n`);
  process.exit(0);
}

// install (default: all skills; `gtm`: bundle; --skill: explicit list)
const names = flags.skills.length ? flags.skills
  : flags.bundle ? BUNDLES[flags.bundle].skills
  : availableSkills();
const withMcp = flags.mcp && !flags.skills.length;
const detected = detectTargets();

console.log(`\nanysite setup v${PKG_VERSION} — ${flags.bundle ? `bundle "${flags.bundle}"` : flags.skills.length ? "selected skills" : "all skills"}`);
if (!detected.length) {
  console.log("\nNo supported agents detected (~/.claude, ~/.codex or the Claude Desktop app).");
  console.log("Install Claude Code, Codex or Claude Desktop first, then re-run this command.\n");
  process.exit(1);
}
const targets = await pickTargets(detected);

let installedTotal = 0;
for (const t of targets) {
  if (t === "desktop") {
    const { built, failed } = buildSkillZips(names);
    installedTotal += built.length;
    console.log(`\nSkills [desktop/cowork] — install the plugin (skills + MCP connector in one step):`);
    console.log(`  A. From a terminal (fastest, also works for Claude Code):`);
    console.log(`       claude plugin marketplace add anysiteio/agent-skills`);
    console.log(`       claude plugin install anysite-skills@anysite`);
    console.log(`     Inside a Claude Code session: /plugin marketplace add anysiteio/agent-skills`);
    console.log(`  B. In the Claude app UI: Customize → Plugins → + → Add marketplace →`);
    console.log(`     anysiteio/agent-skills → Install "anysite-skills"`);
    console.log(`     (Cowork itself has no /plugin slash command — there it is UI-only.)`);
    console.log(`  Toggle individual skills after install. Per-skill zips for claude.ai web:`);
    console.log(`  ${built.length} prepared in ${ZIPS_DST}${failed.length ? ` (failed: ${failed.join(", ")})` : ""}.`);
    continue;
  }
  const { installed, missing } = installSkills(names, SKILLS_DST[t]);
  installedTotal += installed.length;
  console.log(`\nSkills [${t}] → ${SKILLS_DST[t]}: ${installed.length} installed${missing.length ? `, unknown: ${missing.join(", ")}` : ""}`);
}
if (!installedTotal) {
  console.error("Nothing was installed — check skill names with --list.");
  process.exit(1);
}

if (withMcp) {
  for (const t of targets) {
    const res = t === "claude" ? registerMcpClaude() : t === "codex" ? registerMcpCodex() : registerMcpDesktop();
    console.log(`MCP [${t}]: ${res.note}`);
  }
}

const next = flags.bundle ? BUNDLES[flags.bundle].next_step
  : "Restart your agent session to pick up the new skills.";
console.log(`\nDone. Next step: ${next}\n`);
