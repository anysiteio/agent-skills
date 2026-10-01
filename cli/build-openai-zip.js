#!/usr/bin/env node
/**
 * Builds the OpenAI (ChatGPT / Codex) plugin ZIP for plugins/anysite-gtm and checks it
 * against the submission limits documented at
 * https://developers.openai.com/plugins/deploy/submission before you upload it.
 *
 *   node cli/build-openai-zip.js            -> dist/anysite-gtm-openai-<version>.zip
 *
 * Errors stop the build; warnings (e.g. no demo recording yet) are printed and the ZIP is
 * still written, because the portal accepts partial review material in a draft.
 */
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN = join(REPO, "plugins", "anysite-gtm");
const EXCLUDE = new Set([".claude-plugin", ".DS_Store"]);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const isHttps = (u) => typeof u === "string" && /^https:\/\/[^\s@]+$/.test(u) && u.length <= 1024;

const manifest = readJson(join(PLUGIN, ".codex-plugin", "plugin.json"));
const ui = manifest.interface ?? {};
const oa = manifest.extensions?.["com.openai"] ?? {};

// package identity
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(manifest.name ?? "") || manifest.name.length > 64) err("name: lowercase letters, digits and single hyphens, <=64");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) err("version: semantic version required");
if (!manifest.description || manifest.description.length > 4000) err("description: required, <=4000");
if (!manifest.author?.name || manifest.author.name.length > 120) err("author.name: required, <=120");

// listing
const limit = (field, max, required = true) => {
  const v = ui[field];
  if (v == null || v === "") { if (required) err(`interface.${field}: required`); return; }
  if (typeof v !== "string" || v.length > max) err(`interface.${field}: <=${max} characters (has ${String(v).length})`);
};
limit("displayName", 30);
limit("shortDescription", 30);
limit("longDescription", 4000);
limit("developerName", 80);
limit("category", 200);
const CATEGORIES = ["Productivity", "Creativity", "Developer Tools", "Business & Operations", "Data & Analytics",
  "Communication", "Education & Research", "Security", "Finance", "Healthcare", "Travel", "Entertainment", "Other"];
if (ui.category && !CATEGORIES.includes(ui.category)) err(`interface.category: one of ${CATEGORIES.join(", ")}`);
const PROMO = /\b(pric(e|es|ing)|plans?|subscriptions?|free|trials?|discounts?|promo(tion)?s?|credits?|unlimited|\$\d)/i;
for (const f of ["shortDescription", "longDescription"]) {
  const hit = ui[f]?.match(PROMO);
  if (hit) err(`interface.${f}: mentions "${hit[0]}" - descriptions must not advertise pricing, plans, trials or promotions`);
}
if (oa.review?.commerce_description?.match(PROMO)) err("review.commerce_description: no pricing or plan wording");
for (const f of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) if (!isHttps(ui[f])) err(`interface.${f}: HTTPS URL required for MCP review`);
const caps = ui.capabilities ?? [];
if (!Array.isArray(caps) || caps.length > 20 || caps.some((c) => typeof c !== "string" || c.length > 120)) err("interface.capabilities: <=20 strings of <=120");
const prompts = [].concat(ui.defaultPrompt ?? []);
if (prompts.length > 3 || prompts.some((p) => p.length > 128) || new Set(prompts).size !== prompts.length) err("interface.defaultPrompt: <=3 unique prompts of <=128");
for (const c of ["brandColor", "brandColorDark"]) if (ui[c] && !/^#[0-9A-Fa-f]{6}$/.test(ui[c])) err(`interface.${c}: #RRGGBB`);

// images
for (const f of ["logo", "logoDark", "composerIcon", "composerIconDark"]) {
  if (!ui[f]) { if (f === "logo" || f === "composerIcon") err(`interface.${f}: required`); continue; }
  const p = join(PLUGIN, ui[f]);
  if (!ui[f].startsWith("./") || !existsSync(p)) { err(`interface.${f}: ${ui[f]} not found`); continue; }
  if (p.endsWith(".svg")) {
    const vb = readFileSync(p, "utf8").match(/viewBox="\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*"/);
    if (!vb || vb[1] !== vb[2] || Number(vb[1]) < 48) err(`interface.${f}: SVG needs a square viewBox of at least 48`);
  }
}

// onboarding and review
if (oa.onboardingSkill && !existsSync(join(PLUGIN, oa.onboardingSkill))) err(`onboardingSkill: ${oa.onboardingSkill} not found`);
const pos = oa.review?.test_cases?.positive ?? [];
const neg = oa.review?.test_cases?.negative ?? [];
if (pos.length !== 5) err(`review.test_cases.positive: exactly 5 required (has ${pos.length})`);
if (neg.length !== 3) err(`review.test_cases.negative: exactly 3 required (has ${neg.length})`);
pos.forEach((c, i) => ["description", "prompt", "tools_triggered", "expected_behavior"].forEach((k) => { if (!c[k]) err(`positive[${i}].${k}: required`); }));
neg.forEach((c, i) => ["description", "prompt"].forEach((k) => { if (!c[k]) err(`negative[${i}].${k}: required`); }));
if (!oa.review?.demo_recording_url) warn("review.demo_recording_url: missing - required before Submit for review (add it here or in the portal)");

// MCP server
const mcp = readJson(join(PLUGIN, ".mcp.json")).mcpServers ?? {};
const servers = Object.entries(mcp);
if (servers.length !== 1) err(`.mcp.json: exactly one server expected for plugin-level review cases (has ${servers.length})`);
for (const [n, s] of servers) if (!isHttps(s.url)) err(`.mcp.json ${n}: public HTTPS url required`);

// skills
const skillsDir = join(PLUGIN, "skills");
const known = new Set();
for (const d of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const p = join(skillsDir, d.name, "SKILL.md");
  if (!existsSync(p)) { err(`skills/${d.name}: SKILL.md missing`); continue; }
  const text = readFileSync(p, "utf8");
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const name = fm?.[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  const desc = fm?.[1].match(/^description:\s*(.+)$/m)?.[1].trim();
  if (name !== d.name) err(`skills/${d.name}: frontmatter name must equal the folder name`);
  if (!desc) err(`skills/${d.name}: frontmatter description required`);
  known.add(d.name);
  text.split("\n").forEach((line, i) => {
    if (/\bclaude\b/i.test(line) && !/claude\.ai|claude code|claude desktop|~\/\.claude/i.test(line)) warn(`skills/${d.name}/SKILL.md:${i + 1} mentions Claude - keep only if it names that product`);
  });
}
if (!known.size) err("skills/: no skills found");

for (const w of warnings) console.log(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} error(s) - ZIP not built.`);
  process.exit(1);
}

// package: plugin folder without the Claude manifest, files at the archive root
const stage = mkdtempSync(join(tmpdir(), "anysite-gtm-openai-"));
for (const entry of readdirSync(PLUGIN)) if (!EXCLUDE.has(entry)) cpSync(join(PLUGIN, entry), join(stage, entry), { recursive: true });
const outDir = join(REPO, "dist");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${manifest.name}-openai-${manifest.version}.zip`);
rmSync(out, { force: true });
execFileSync("zip", ["-rqX", out, ".", "-x", "*.DS_Store"], { cwd: stage });
rmSync(stage, { recursive: true, force: true });
console.log(`\n${known.size} skills, ${pos.length}+${neg.length} review cases -> ${out}`);
