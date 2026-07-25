#!/usr/bin/env node

/**
 * Anysite agent setup: installs skills into Claude Code / Codex and registers
 * the anysite remote MCP server (https://mcp.anysite.io/mcp, OAuth on first use).
 *
 * Usage:
 *   npx @anysiteio/agent-skills             Install ALL skills + register MCP
 *   npx @anysiteio/agent-skills gtm         Install the GTM bundle + register MCP
 *   npx @anysiteio/agent-skills --list      List skills and bundles
 *   npx @anysiteio/agent-skills --status    Show what is installed
 *   npx @anysiteio/agent-skills --skill N   Install specific skill(s), no MCP
 *   npx @anysiteio/agent-skills --uninstall Remove anysite skills (MCP entry is kept)
 *
 * Flags: --no-mcp | --target claude|codex | --help
 */

import { execFileSync } from "node:child_process";
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_SRC = join(PKG_ROOT, "skills");
const BUNDLES = JSON.parse(readFileSync(join(PKG_ROOT, "bundles.json"), "utf8"));
const PKG_VERSION = JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;

const HOME = process.env.HOME || homedir();
const CLAUDE_DIR = join(HOME, ".claude");
const CLAUDE_SKILLS_DIR = join(CLAUDE_DIR, "skills");
const CODEX_DIR = join(HOME, ".codex");
const CODEX_CONFIG = join(CODEX_DIR, "config.toml");
const MANIFEST_PATH = join(CLAUDE_SKILLS_DIR, ".anysite-skills.json");

const MCP_NAME = "anysite";
const MCP_URL = "https://mcp.anysite.io/mcp";

// ── args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = { bundle: null, list: false, status: false, uninstall: false, help: false, mcp: true, skills: [], targets: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--list" || a === "-l") flags.list = true;
  else if (a === "--status") flags.status = true;
  else if (a === "--uninstall" || a === "--remove") flags.uninstall = true;
  else if (a === "--help" || a === "-h") flags.help = true;
  else if (a === "--no-mcp") flags.mcp = false;
  else if (a === "--skill" || a === "-s") { if (args[++i]) flags.skills.push(args[i]); }
  else if (a === "--target") { if (args[++i]) flags.targets.push(args[i]); }
  else if (!a.startsWith("-") && BUNDLES[a]) flags.bundle = a;
  else { console.error(`Unknown argument: ${a} (see --help)`); process.exit(1); }
}

// ── helpers ─────────────────────────────────────────────────────────────────

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

function readManifest() {
  try { return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")); } catch { return null; }
}

function detectTargets() {
  if (flags.targets.length) return flags.targets;
  const t = [];
  if (existsSync(CLAUDE_DIR)) t.push("claude");
  if (existsSync(CODEX_DIR)) t.push("codex");
  return t;
}

function hasClaudeCli() {
  try { execFileSync("claude", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

// ── skills install / uninstall ──────────────────────────────────────────────

function installSkills(names) {
  mkdirSync(CLAUDE_SKILLS_DIR, { recursive: true });
  const installed = [];
  const missing = [];
  for (const name of names) {
    const src = join(SKILLS_SRC, name);
    if (!existsSync(join(src, "SKILL.md"))) { missing.push(name); continue; }
    const dst = join(CLAUDE_SKILLS_DIR, name);
    rmSync(dst, { recursive: true, force: true });
    cpSync(src, dst, { recursive: true });
    installed.push(name);
  }
  const prev = readManifest();
  const all = [...new Set([...(prev?.skills ?? []), ...installed])].sort();
  writeFileSync(MANIFEST_PATH, JSON.stringify({
    version: PKG_VERSION,
    bundle: flags.bundle ?? prev?.bundle ?? null,
    installedAt: new Date().toISOString(),
    skills: all,
  }, null, 2));
  return { installed, missing };
}

function uninstallSkills() {
  const manifest = readManifest();
  const tracked = new Set(manifest?.skills ?? []);
  const removed = [];
  if (existsSync(CLAUDE_SKILLS_DIR)) {
    for (const d of readdirSync(CLAUDE_SKILLS_DIR, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      // remove tracked skills plus legacy anysite-* installs; never touch anything else
      if (tracked.has(d.name) || d.name.startsWith("anysite-")) {
        rmSync(join(CLAUDE_SKILLS_DIR, d.name), { recursive: true, force: true });
        removed.push(d.name);
      }
    }
  }
  rmSync(MANIFEST_PATH, { force: true });
  return removed;
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

// ── commands ────────────────────────────────────────────────────────────────

if (flags.help) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").match(/\/\*\*([\s\S]*?)\*\//)[1].replace(/^ \* ?/gm, ""));
  process.exit(0);
}

if (flags.list) {
  const manifest = readManifest();
  const installed = new Set(manifest?.skills ?? []);
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
  const manifest = readManifest();
  if (!manifest) { console.log("\nNo anysite skills installed (no manifest found).\n"); process.exit(0); }
  console.log(`\nInstalled: ${manifest.skills.length} skills (package v${manifest.version}, ${manifest.installedAt})`);
  if (manifest.bundle) console.log(`Bundle: ${manifest.bundle}`);
  for (const s of manifest.skills) console.log(`  ✓ ${s}`);
  console.log(`\nUpdate: npx @anysiteio/agent-skills@latest ${manifest.bundle ?? ""}\n`);
  process.exit(0);
}

if (flags.uninstall) {
  const removed = uninstallSkills();
  console.log(removed.length
    ? `\nRemoved ${removed.length} skills from ${CLAUDE_SKILLS_DIR}:\n  ${removed.join("\n  ")}\n`
    : "\nNothing to remove.\n");
  console.log(`The MCP entry is kept. To remove it: claude mcp remove ${MCP_NAME}\n`);
  process.exit(0);
}

// install (default: all skills; `gtm`: bundle; --skill: explicit list)
const names = flags.skills.length ? flags.skills
  : flags.bundle ? BUNDLES[flags.bundle].skills
  : availableSkills();
const withMcp = flags.mcp && !flags.skills.length;
const targets = detectTargets();

console.log(`\nanysite setup v${PKG_VERSION} — ${flags.bundle ? `bundle "${flags.bundle}"` : flags.skills.length ? "selected skills" : "all skills"}`);
if (!targets.length) {
  console.log("\nNo supported agents detected (~/.claude or ~/.codex not found).");
  console.log("Install Claude Code or Codex first, then re-run this command.\n");
  process.exit(1);
}

const { installed, missing } = installSkills(names);
console.log(`\nSkills → ${CLAUDE_SKILLS_DIR}: ${installed.length} installed${missing.length ? `, unknown: ${missing.join(", ")}` : ""}`);
if (!installed.length) {
  console.error("Nothing was installed — check skill names with --list.");
  process.exit(1);
}

if (withMcp) {
  for (const t of targets) {
    const res = t === "claude" ? registerMcpClaude() : registerMcpCodex();
    console.log(`MCP [${t}]: ${res.note}`);
  }
}

const next = flags.bundle ? BUNDLES[flags.bundle].next_step
  : "Restart your agent session to pick up the new skills.";
console.log(`\nDone. Next step: ${next}\n`);
