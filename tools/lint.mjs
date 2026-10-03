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
  { dir: "plugins/recode", catalogs: ["claude"], family: true, budgets: [{ files: ["scripts/codex.mjs", "scripts/recode.mjs"], max: 700 }] },
];
// Old names a shipped file may still contain, by repository-relative path: the migration literals of R7.
const OLD_NAME_LITERALS = {};

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
for (const pl of PLUGINS.filter((p) => p.family)) {
  const v = manifests.get(pl.dir)?.version;
  if (pkg && v !== undefined && v !== pkg.version) fail(`${pl.dir}: version ${v} differs from the suite version ${pkg.version} in package.json`);
}
const repos = [...new Set([...manifests.values()].filter(Boolean).map((m) => String(m.repository ?? "")))];
if (repos.length > 1) fail(`Claude manifests name different repositories: ${repos.join(", ")}`);
const readme = read("README.md");
if (readme !== null && market && repos.length === 1) {
  const repo = repos[0].replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "");
  const want = [`/plugin marketplace add ${repo}`, ...(market.plugins ?? []).map((e) => `/plugin install ${e.name}@${market.name}`)];
  for (const line of want) {
    if (!readme.split("\n").some((l) => l.trim() === line)) fail(`README.md install block lacks the line: ${line}`);
  }
}

// 4. Only do and setup are hidden from the model; ask, review and implement must stay visible so a plain-words request, or a skill's delegation, can reach them.
const hidden = { ask: false, review: false, implement: false, do: true, setup: true };
for (const [name, want] of Object.entries(hidden)) {
  const s = read(`plugins/recode/commands/${name}.md`);
  if (s === null) continue;
  const front = s.split(/\r?\n---\r?\n/)[0];
  const has = /^disable-model-invocation:\s*true\s*$/m.test(front);
  if (has !== want) fail(`plugins/recode/commands/${name}.md: disable-model-invocation must be ${want ? "set" : "absent"}`);
}

// 5. The plugin's one hook: UserPromptSubmit, run in exec form as node <plugin root>/scripts/recode.mjs hook <plugin data>.
const hooks = json("plugins/recode/hooks/hooks.json");
if (hooks) {
  const want = { type: "command", command: "node", args: ["${CLAUDE_PLUGIN_ROOT}/scripts/recode.mjs", "hook", "${CLAUDE_PLUGIN_DATA}"] };
  const got = hooks.hooks?.UserPromptSubmit?.flatMap((g) => g.hooks ?? []);
  if (Object.keys(hooks.hooks ?? {}).join() !== "UserPromptSubmit" || got?.length !== 1 || !isDeepStrictEqual(got[0], want)) {
    fail(`plugins/recode/hooks/hooks.json must declare exactly one UserPromptSubmit hook: ${JSON.stringify(want)}`);
  }
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
  const s = read(`plugins/recode/commands/${name}.md`);
  if (s === null) return null;
  // Step 4 runs from its "4. " line to the next blank line, joined, so a wrapped step still matches.
  const text = s.match(/^4\. .*(?:\r?\n(?!\s*\r?$).*)*/m)?.[0].replace(/\s*\r?\n\s*/g, " ") ?? "";
  for (const want of [endTurn, resume]) {
    if (!text.includes(want)) fail(`plugins/recode/commands/${name}.md: step 4 lacks the sentence: ${want}`);
  }
  return text;
});
if (step4.every((t) => t !== null) && !step4.every((t) => t === step4[0])) fail("plugins/recode/commands/ask.md, review.md and implement.md: step 4 differs between the files");

// 8. ask, review, implement and do write the request file first and read it only after a failed Write: the script deletes the file after
// every run, so a read-first step fails on almost every call. Any other failed Write stops the command: running the script
// then would send a leftover request file, possibly an earlier task, to Codex.
const stop = "If the Write failed for any other reason, or the second Write fails, stop: report the failure and do not run step 3.";
for (const name of ["ask", "review", "implement", "do"]) {
  const s = read(`plugins/recode/commands/${name}.md`);
  if (s === null) continue;
  if (!/^1\. With the Write tool, /m.test(s)) fail(`plugins/recode/commands/${name}.md: step 1 must be the Write of the request file`);
  const step2 = s.match(/^2\. If that Write failed .*$/m)?.[0] ?? "";
  if (!step2) fail(`plugins/recode/commands/${name}.md: step 2 must be the Read after a failed Write`);
  else if (!step2.includes(stop)) fail(`plugins/recode/commands/${name}.md: step 2 lacks the sentence: ${stop}`);
}

// 9. Shipped files are ASCII (R6).
const shipped = walk(join(root, "plugins"), (p) => p.endsWith(".DS_Store"));
for (const p of shipped) {
  const buf = readFileSync(p);
  const at = buf.findIndex((b) => b > 0x7f);
  if (at >= 0) fail(`${rel(p)}:${buf.subarray(0, at).toString("latin1").split("\n").length}: non-ASCII byte`);
}

// 10. No shipped file names a source plugin or its marketplace (R7), apart from the migration literals listed for it.
const oldNames = [/codex[-_]lite/i, /\bccl\b/i, /vibecodedapps-claude-codex-loop/i];
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

if (failures.length) {
  console.error(`lint: ${failures.length} failure(s)\n${failures.map((f) => `- ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`lint: ok (${modules.length} modules checked; runtime ${usage.join(", ")} lines)`);
