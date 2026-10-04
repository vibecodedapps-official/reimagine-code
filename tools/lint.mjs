#!/usr/bin/env node
// Repository checks with no dependencies. Exits 1 listing every failure.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const fail = (msg) => failures.push(msg);
const rel = (p) => relative(root, p).split(sep).join("/");
const read = (p) => {
  try { return readFileSync(join(root, p), "utf8"); } catch (e) { fail(`${p}: cannot read (${e.code})`); return null; }
};
const json = (p) => {
  const s = read(p);
  try { return s === null ? null : JSON.parse(s); } catch (e) { fail(`${p}: invalid JSON (${e.message})`); return null; }
};
const walk = (dir, skip = () => false) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (skip(rel(p))) return [];
    return d.isDirectory() ? walk(p, skip) : [p];
  });
};

// The plugins this repository ships, one row each; every directory under plugins/ must have one.
// catalogs: the catalogs that list it. family: versioned in lockstep with the suite version in package.json.
// budgets: the only runtime modules the plugin may hold, in groups, each with its line limit.
const PLUGINS = [
  { dir: "plugins/ccx", catalogs: ["claude"], family: true, budgets: [
    { files: ["scripts/codex.mjs", "scripts/ccx.mjs"], max: 700 }, { files: ["scripts/rules.mjs"], max: 400 }, { files: ["scripts/suite.mjs"], max: 200 },
  ] },
  { dir: "plugins/ccx-loop", catalogs: ["claude"], family: true, budgets: [] },
  { dir: "plugins/ccx-codex", catalogs: ["codex"], family: true, budgets: [] },
  { dir: "plugins/repo-docs", catalogs: ["claude", "codex"], family: false, budgets: [] },
];
// Old names a shipped file may still contain, by repository-relative path: the migration literals of R7.
const OLD_NAME_LITERALS = {
  "plugins/ccx/scripts/rules.mjs": ["recode:house-rules"],
  "plugins/ccx/scripts/suite.mjs": ["codex-lite@vibecodedapps-codex-lite", "ccl@vibecodedapps-claude-codex-loop", "recode:house-rules", "recode-loop@reimagine-code", "recode@reimagine-code"],
  "plugins/ccx-loop/skills/ccx-loop/SKILL.md": [".ccl.json"],
};

// 1. Syntax of every module.
const modules = ["plugins", "tests", "tools"].flatMap((d) => walk(join(root, d))).filter((p) => p.endsWith(".mjs"));
for (const p of modules) {
  const r = spawnSync(process.execPath, ["--check", p], { encoding: "utf8" });
  if (r.status !== 0) fail(`${rel(p)}: node --check failed\n${(r.stderr || r.error?.message || "").trim()}`);
}

// 2. Runtime budgets: a plugin holds only the modules its row lists, and each group stays within its limit (counted as wc -l does).
const listed = PLUGINS.flatMap((pl) => pl.budgets.flatMap((b) => b.files.map((f) => `${pl.dir}/${f}`)));
const extra = modules.map(rel).filter((p) => p.startsWith("plugins/") && !listed.includes(p));
if (extra.length) fail(`runtime modules no plugin budget lists: ${extra.join(", ")}`);
const usage = [];
for (const pl of PLUGINS) {
  for (const b of pl.budgets) {
    let lines = 0;
    for (const f of b.files) {
      const s = read(`${pl.dir}/${f}`);
      if (s !== null) lines += s.split("\n").length - 1;
    }
    const name = b.files.map((f) => basename(f)).join(" + ");
    if (lines > b.max) fail(`${pl.dir}: ${name} total ${lines} lines, budget is ${b.max}`);
    usage.push(`${name} ${lines}/${b.max}`);
  }
}

// 3. The Claude catalog lists exactly the Claude plugins above, from sources that exist; each entry agrees with its manifest;
// the suite's plugins share the suite version; and the root README install block names the marketplace and every plugin.
const pkg = json("package.json");
const market = json(".claude-plugin/marketplace.json");
const dirs = readdirSync(join(root, "plugins"), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `plugins/${d.name}`);
for (const d of dirs) if (!PLUGINS.some((pl) => pl.dir === d)) fail(`${d}: no row in PLUGINS in tools/lint.mjs`);
const claude = PLUGINS.filter((pl) => pl.catalogs.includes("claude"));
const manifests = new Map(claude.map((pl) => [pl.dir, json(`${pl.dir}/.claude-plugin/plugin.json`)]));
if (market) {
  if (market.name !== "reimagine-code") fail(`.claude-plugin/marketplace.json: name must be reimagine-code, not ${market.name}`);
  if (!market.metadata?.description) fail(".claude-plugin/marketplace.json: metadata.description is missing, and claude plugin validate --strict requires it");
  if (market.metadata?.version !== pkg?.version) fail(`.claude-plugin/marketplace.json: metadata.version ${market.metadata?.version} differs from the suite version ${pkg?.version}`);
  if (!isDeepStrictEqual(market.renames, { recode: "ccx", "recode-loop": "ccx-loop" })) {
    fail(`.claude-plugin/marketplace.json: renames must be exactly ${JSON.stringify({ recode: "ccx", "recode-loop": "ccx-loop" })}, which moves 0.1.x installs and settings to the new names; found ${JSON.stringify(market.renames ?? null)}`);
  }
  const entries = market.plugins ?? [];
  for (const e of entries) {
    const src = String(e.source ?? "").replace(/^\.\//, "");
    if (!existsSync(join(root, src))) { fail(`.claude-plugin/marketplace.json: ${e.name}: source ${e.source} does not exist`); continue; }
    if (!manifests.has(src)) { fail(`.claude-plugin/marketplace.json: ${e.name}: source ${e.source} is not a Claude plugin in PLUGINS`); continue; }
    const m = manifests.get(src);
    if (m && (e.name !== m.name || e.version !== m.version)) {
      fail(`.claude-plugin/marketplace.json: entry ${e.name} ${e.version} differs from ${src} manifest ${m.name} ${m.version}`);
    }
  }
  for (const pl of claude) {
    if (!entries.some((e) => String(e.source ?? "").replace(/^\.\//, "") === pl.dir)) fail(`.claude-plugin/marketplace.json: no entry for ${pl.dir}`);
  }
}
// A Codex plugin's manifest is .codex-plugin/plugin.json when the plugin also serves Claude Code, else plugin.json at its root.
const codexPath = (dir) => (existsSync(join(root, dir, ".codex-plugin", "plugin.json")) ? `${dir}/.codex-plugin/plugin.json` : `${dir}/plugin.json`);
const codexManifests = new Map(PLUGINS.filter((pl) => pl.catalogs.includes("codex")).map((pl) => [pl.dir, json(codexPath(pl.dir))]));
for (const pl of PLUGINS.filter((p) => p.family)) {
  const v = (manifests.get(pl.dir) ?? codexManifests.get(pl.dir))?.version;
  if (pkg && v !== undefined && v !== pkg.version) fail(`${pl.dir}: version ${v} differs from the suite version ${pkg.version} in package.json`);
}
const repos = [...new Set([...manifests.values(), ...codexManifests.values()].filter(Boolean).map((m) => String(m.repository ?? "")).filter((r) => r))];
if (repos.length > 1) fail(`Plugin manifests name different repositories: ${repos.join(", ")}`);
const readme = read("README.md");
if (readme !== null && market && repos.length === 1) {
  const repo = repos[0].replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  const want = [`/plugin marketplace add ${repo}`, ...(market.plugins ?? []).map((e) => `/plugin install ${e.name}@${market.name}`)];
  for (const line of want) {
    if (!readme.split("\n").some((l) => l.trim() === line)) fail(`README.md install block lacks the line: ${line}`);
  }
}

// 4. Only do, setup and rules are hidden from the model; ask, review and implement must stay visible so a plain-words request, or a skill's delegation, can reach them.
const hidden = { ask: false, review: false, implement: false, do: true, setup: true, rules: true };
for (const [name, want] of Object.entries(hidden)) {
  const s = read(`plugins/ccx/commands/${name}.md`);
  if (s === null) continue;
  const front = s.split(/\r?\n---\r?\n/)[0];
  const has = /^disable-model-invocation:\s*true\s*$/m.test(front);
  if (has !== want) fail(`plugins/ccx/commands/${name}.md: disable-model-invocation must be ${want ? "set" : "absent"}`);
}

// 5. The plugin's two hooks, each run once in exec form with the data directory as an argument: UserPromptSubmit as
// node <plugin root>/scripts/ccx.mjs hook, and SessionStart, at startup only, as node <plugin root>/scripts/suite.mjs session-start.
const hooks = json("plugins/ccx/hooks/hooks.json");
if (hooks) {
  const want = {
    UserPromptSubmit: [{ hooks: [{ type: "command", command: "node", args: ["${CLAUDE_PLUGIN_ROOT}/scripts/ccx.mjs", "hook", "${CLAUDE_PLUGIN_DATA}"] }] }],
    SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: "node", args: ["${CLAUDE_PLUGIN_ROOT}/scripts/suite.mjs", "session-start", "${CLAUDE_PLUGIN_DATA}"] }] }],
  };
  if (!isDeepStrictEqual(hooks.hooks, want)) fail(`plugins/ccx/hooks/hooks.json must declare exactly these hooks: ${JSON.stringify(want)}`);
}
// repo-docs' one hook, before each Bash and each PowerShell tool call: Claude Code on Windows runs commands through either.
const docsHooks = json("plugins/repo-docs/hooks/hooks.json");
if (docsHooks) {
  const run = [{ type: "command", command: "sh \"${CLAUDE_PLUGIN_ROOT}/hooks/pre-commit.sh\"" }];
  const want = { PreToolUse: [{ matcher: "Bash", hooks: run }, { matcher: "PowerShell", hooks: run }] };
  if (!isDeepStrictEqual(docsHooks.hooks, want)) fail(`plugins/repo-docs/hooks/hooks.json must declare exactly these hooks: ${JSON.stringify(want)}`);
}

// 6. No file names a docs/*.md file listed in .git/info/exclude, or cites a numbered entry of one ("<name> 12").
// A fresh clone's exclude file lists none, so the check runs only in a working copy that has such files.
const excludes = join(root, ".git", "info", "exclude");
const stems = existsSync(excludes)
  ? readFileSync(excludes, "utf8").split("\n").map((l) => l.trim().match(/^docs\/([\w-]+)\.md$/)?.[1]).filter(Boolean) : [];
if (stems.length) {
  const named = new RegExp(`(${stems.join("|")})\\.md`);
  const numbered = new RegExp(`\\b(${stems.map((s) => s.replace(/s$/, "")).join("|")})s? \\d+`, "i");
  const skip = (p) => [".git", ".scratch", "node_modules"].includes(p) || p.endsWith(".DS_Store") || stems.some((s) => p === `docs/${s}.md`);
  for (const p of walk(root, skip)) {
    readFileSync(p, "utf8").split("\n").forEach((l, i) => {
      if (named.test(l) || numbered.test(l)) fail(`${rel(p)}:${i + 1}: names a locally excluded file: ${l.trim()}`);
    });
  }
}

// 7. ask, review and implement say, in step 4, when the output is the whole reply and when Claude continues, and their step 4 stays identical.
const endTurn = "that output is your whole reply: add nothing after it, run no other command, and end your turn.";
const resume = "If you invoked this command as one step of a larger request, such as a plan to converge or findings to address, continue with that request's remaining steps after the output, using Codex's answer as input.";
const step4 = ["ask", "review", "implement"].map((name) => {
  const s = read(`plugins/ccx/commands/${name}.md`);
  if (s === null) return null;
  // Step 4 runs from its "4. " line to the next blank line, joined, so a wrapped step still matches.
  const text = s.match(/^4\. .*(?:\r?\n(?!\s*\r?$).*)*/m)?.[0].replace(/\s*\r?\n\s*/g, " ") ?? "";
  for (const want of [endTurn, resume]) {
    if (!text.includes(want)) fail(`plugins/ccx/commands/${name}.md: step 4 lacks the sentence: ${want}`);
  }
  return text;
});
if (step4.every((t) => t !== null) && !step4.every((t) => t === step4[0])) fail("plugins/ccx/commands/ask.md, review.md and implement.md: step 4 differs between the files");

// 8. ask, review, implement and do write the request file first and read it only after a failed Write: the script deletes the file after
// every run, so a read-first step fails on almost every call. Any other failed Write stops the command: running the script
// then would send a leftover request file, possibly an earlier task, to Codex.
const stop = "If the Write failed for any other reason, or the second Write fails, stop: report the failure and do not run step 3.";
for (const name of ["ask", "review", "implement", "do"]) {
  const s = read(`plugins/ccx/commands/${name}.md`);
  if (s === null) continue;
  if (!/^1\. With the Write tool, /m.test(s)) fail(`plugins/ccx/commands/${name}.md: step 1 must be the Write of the request file`);
  const step2 = s.match(/^2\. If that Write failed .*$/m)?.[0] ?? "";
  if (!step2) fail(`plugins/ccx/commands/${name}.md: step 2 must be the Read after a failed Write`);
  else if (!step2.includes(stop)) fail(`plugins/ccx/commands/${name}.md: step 2 lacks the sentence: ${stop}`);
}

// 9. Shipped files are ASCII (R6).
const shipped = walk(join(root, "plugins"), (p) => p.endsWith(".DS_Store"));
for (const p of shipped) {
  const buf = readFileSync(p);
  const at = buf.findIndex((b) => b > 0x7f);
  if (at >= 0) fail(`${rel(p)}:${buf.subarray(0, at).toString("latin1").split("\n").length}: non-ASCII byte`);
}

// 10. No shipped file names a source plugin or its marketplace (R7), apart from the migration literals listed for it.
const oldNames = [/codex[-_]lite/i, /\bccl\b/i, /vibecodedapps-claude-codex-loop/i, /recode/i];
for (const p of shipped) {
  const allowed = OLD_NAME_LITERALS[rel(p)] ?? [];
  readFileSync(p, "utf8").split("\n").forEach((l, i) => {
    const rest = allowed.reduce((s, lit) => s.split(lit).join(""), l);
    const hit = oldNames.find((re) => re.test(rest));
    if (hit) fail(`${rel(p)}:${i + 1}: old name /${hit.source}/: ${l.trim()}`);
  });
}

// 11. Each plugin directory holds an Apache-2.0 LICENSE, because an installed plugin holds only its own directory (R5).
for (const pl of PLUGINS) {
  const p = join(root, pl.dir, "LICENSE");
  const s = existsSync(p) ? readFileSync(p, "utf8") : "";
  if (!/Apache License\s+Version 2\.0, January 2004/.test(s)) fail(`${pl.dir}/LICENSE: missing or not the Apache-2.0 license`);
}

// 12. Scripts and docs keep LF line endings on Windows checkouts, where a CRLF hook script fails (R54).
const attrs = read(".gitattributes");
if (attrs !== null) {
  for (const line of ["*.sh text eol=lf", "*.mjs text eol=lf", "*.md text eol=lf"]) {
    if (!attrs.split(/\r?\n/).some((l) => l.trim() === line)) fail(`.gitattributes lacks the line: ${line}`);
  }
}

// 13. The chat instructions hold one fenced block that fits ChatGPT's 5,000-character cap, counted as the file's header says (R47).
const chat = read("plugins/ccx/chat/instructions.md");
if (chat === null) fail("plugins/ccx/chat/instructions.md: missing");
else {
  const fences = chat.split(/\r?\n/).map((l, i) => (l === "```" ? i : -1)).filter((i) => i >= 0);
  const block = fences.length === 2 ? chat.split(/\r?\n/).slice(fences[0] + 1, fences[1]).map((l) => `${l}\n`).join("") : null;
  if (block === null) fail(`plugins/ccx/chat/instructions.md: must hold exactly one fenced block, found ${fences.length} fence lines`);
  else if (block.length > 5000) fail(`plugins/ccx/chat/instructions.md: the block is ${block.length} characters, over ChatGPT's 5,000`);
}

// 14. ccx-loop depends on ccx with the range >=<floor> <1.0.0, its floor at or below the suite version (R18).
const loopManifest = json("plugins/ccx-loop/.claude-plugin/plugin.json");
if (loopManifest && pkg) {
  const deps = Array.isArray(loopManifest.dependencies) ? loopManifest.dependencies : [];
  const range = deps.find((d) => d?.name === "ccx")?.version;
  const floor = typeof range === "string" ? range.match(/^>=(\d+)\.(\d+)\.(\d+) <1\.0\.0$/)?.slice(1).map(Number) : null;
  const suite = String(pkg.version).split(".").map(Number);
  const above = floor && (floor[0] - suite[0] || floor[1] - suite[1] || floor[2] - suite[2]) > 0;
  if (!floor || above) fail(`plugins/ccx-loop/.claude-plugin/plugin.json: dependencies must hold { "name": "ccx", "version": ">=<floor> <1.0.0" } with the floor at or below ${pkg.version}; found ${JSON.stringify(range ?? null)}`);
}

// 15. No loop text reads the bridge's installed version or compares it to the old gates, 0.8.0 and 0.9.0: the dependency range covers both (R19).
const gates = [/\b0\.[89]\.0\b/, /\bccx@/];
for (const p of shipped.filter((f) => rel(f).startsWith("plugins/ccx-loop/"))) {
  readFileSync(p, "utf8").split("\n").forEach((l, i) => {
    const hit = gates.find((re) => re.test(l));
    if (hit) fail(`${rel(p)}:${i + 1}: bridge version gate /${hit.source}/: ${l.trim()}`);
  });
}

// 16. Each loop command applies the codex plugin option to its no-codex flag (R21).
for (const f of ["run", "plan"].map((n) => `plugins/ccx-loop/commands/${n}.md`)) {
  const text = read(f);
  if (text !== null && !text.includes("`${user_config.codex}`")) fail(`${f}: must read the codex option as \`\${user_config.codex}\``);
}

// 17. The Codex catalog lists exactly the Codex plugins above, each available and authenticated on install (R2), and agrees with
// their manifests; the root plugin.json form is pinned to the agent-plugins.org 1.0.0 schema, which Codex accepts (R27); a plugin
// with both manifests carries one version (R48); and the review skills keep the upstream NOTICE and their provenance comments (R28).
const codexMarket = json(".agents/plugins/marketplace.json");
const codexRows = PLUGINS.filter((pl) => pl.catalogs.includes("codex"));
if (codexMarket) {
  const at = ".agents/plugins/marketplace.json";
  if (codexMarket.name !== "reimagine-code") fail(`${at}: name must be reimagine-code, not ${codexMarket.name}`);
  const entries = codexMarket.plugins ?? [];
  for (const e of entries) {
    const src = String(e.source?.path ?? "").replace(/^\.\//, "");
    if (e.source?.source !== "local" || !codexRows.some((pl) => pl.dir === src)) { fail(`${at}: ${e.name}: source ${e.source?.path} is not a Codex plugin in PLUGINS`); continue; }
    if (e.policy?.installation !== "AVAILABLE" || e.policy?.authentication !== "ON_INSTALL") fail(`${at}: ${e.name}: policy must be installation AVAILABLE and authentication ON_INSTALL`);
    const m = codexManifests.get(src);
    if (m && e.name !== m.name) fail(`${at}: entry ${e.name} differs from ${src} manifest ${m.name}`);
  }
  for (const pl of codexRows) {
    if (!entries.some((e) => String(e.source?.path ?? "").replace(/^\.\//, "") === pl.dir)) fail(`${at}: no entry for ${pl.dir}`);
  }
}
const schema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
for (const pl of codexRows) {
  const p = codexPath(pl.dir);
  const m = codexManifests.get(pl.dir);
  if (m && p === `${pl.dir}/plugin.json` && m.$schema !== schema) fail(`${p}: $schema must be ${schema}`);
  const c = manifests.get(pl.dir);
  if (m && c && m.version !== c.version) fail(`${p}: version ${m.version} differs from ${c.version} in .claude-plugin/plugin.json`);
}
const notice = existsSync(join(root, "plugins/ccx-codex/NOTICE")) ? readFileSync(join(root, "plugins/ccx-codex/NOTICE"), "utf8") : "";
if (!/The upstream NOTICE file reads:\s+OpenAI Codex\s+Copyright 2025 OpenAI/.test(notice)) fail("plugins/ccx-codex/NOTICE: missing, or without the upstream NOTICE text");
for (const p of shipped.filter((f) => /^plugins\/ccx-codex\/skills\/[^/]+\/SKILL\.md$/.test(rel(f)))) {
  if (!readFileSync(p, "utf8").split("\n").some((l) => l.startsWith("<!-- Modified. Adapted from openai/codex "))) fail(`${rel(p)}: lacks its provenance comment`);
}

// 18. main is the release ref: once a plugin has a <name>--v<version> tag, a change under its directory since its highest tag
// needs a version above that tag (R49). The Codex ccx shares its name, and so its tags, with the bridge. The rule needs the
// tags, so a shallow clone fails it; outside a git work tree, as in the lint tests' copies, it does not apply.
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const below = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };
if (git("rev-parse", "--is-inside-work-tree").stdout?.trim() === "true") {
  if (git("rev-parse", "--is-shallow-repository").stdout.trim() === "true") {
    fail("R49: this clone is shallow, so release tags may be missing; fetch the full history (actions/checkout: fetch-depth: 0)");
  } else {
    const tags = git("tag", "--list", "*--v*").stdout.split("\n").filter(Boolean);
    for (const pl of PLUGINS) {
      const m = manifests.get(pl.dir) ?? codexManifests.get(pl.dir);
      if (!m?.name || typeof m.version !== "string") continue;
      const last = tags.map((t) => t.match(new RegExp(`^${m.name}--v(\\d+\\.\\d+\\.\\d+)$`))?.[1]).filter(Boolean).sort(below).at(-1);
      if (!last) continue;
      const diff = git("diff", "--quiet", `refs/tags/${m.name}--v${last}`, "--", pl.dir);
      if (diff.status !== 0 && diff.status !== 1) fail(`${pl.dir}: cannot compare with ${m.name}--v${last}: ${diff.stderr.trim()}`);
      else if (diff.status === 1 && below(m.version, last) <= 0) fail(`${pl.dir}: changed since ${m.name}--v${last}, so its version must be above ${last}; found ${m.version}`);
    }
  }
}

// 19. The changelog has a dated heading for the suite version, "## <version> - <YYYY-MM-DD>" (R50).
const changelog = read("CHANGELOG.md");
if (changelog !== null && pkg && !new RegExp(`^## ${String(pkg.version).replace(/\./g, "\\.")} - \\d{4}-\\d{2}-\\d{2}$`, "m").test(changelog)) {
  fail(`CHANGELOG.md: no heading "## ${pkg.version} - <YYYY-MM-DD>" for the suite version`);
}

if (failures.length) {
  console.error(`lint: ${failures.length} failure(s)\n${failures.map((f) => `- ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`lint: ok (${modules.length} modules checked; runtime ${usage.join(", ")} lines)`);
