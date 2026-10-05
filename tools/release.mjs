#!/usr/bin/env node
// Sets one component's version (ccx, repo-docs, or cca) in every manifest and catalog entry that carries it, for ccx, when --floor is given,
// the floor of ccx-loop's dependency range, and for cca the three plugin_version literals in its skill. Then runs lint, which checks
// that the copies agree, the range, and the changelog heading. Tagging stays with `claude plugin tag`.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const usage = "usage: node tools/release.mjs ccx <version> [--floor <version>]\n       node tools/release.mjs repo-docs <version>\n       node tools/release.mjs cca <version>";
const semver = /^\d+\.\d+\.\d+$/;
const [component, version, flag, floor, ...extra] = process.argv.slice(2);
const valid = ["ccx", "repo-docs", "cca"].includes(component) && semver.test(version ?? "") && !extra.length
  && (flag === undefined || (component === "ccx" && flag === "--floor" && semver.test(floor ?? "")));
if (!valid) {
  console.error(usage);
  process.exit(2);
}

// Each edit names a file, the change to its JSON, and the line replacements that make that change, so a hand-formatted
// manifest keeps its layout. An edit with no replacements rewrites a file that is already canonical JSON.
const topVersion = [/^ {2}"version": "[^"]*"/m, `  "version": "${version}"`];
const setVersion = (j) => { j.version = version; };
const edits = {
  ccx: [
    ["package.json", setVersion, [topVersion]],
    ["plugins/ccx/.claude-plugin/plugin.json", setVersion, [topVersion]],
    ["plugins/ccx-loop/.claude-plugin/plugin.json", (j) => {
      j.version = version;
      const dep = floor && j.dependencies?.find((d) => d?.name === "ccx");
      if (dep) dep.version = `>=${floor} <1.0.0`;
    }, [topVersion, ...(floor ? [[/("name": "ccx", "version": ")[^"]*"/, `$1>=${floor} <1.0.0"`]] : [])]],
    ["plugins/ccx-codex/plugin.json", setVersion, [topVersion]],
    [".claude-plugin/marketplace.json", (j) => {
      j.metadata.version = version;
      for (const e of j.plugins) if (e.name === "ccx" || e.name === "ccx-loop") e.version = version;
    }],
  ],
  "repo-docs": [
    ["plugins/repo-docs/.claude-plugin/plugin.json", setVersion, [topVersion]],
    ["plugins/repo-docs/.codex-plugin/plugin.json", setVersion, [topVersion]],
    [".claude-plugin/marketplace.json", (j) => { for (const e of j.plugins) if (e.name === "repo-docs") e.version = version; }],
  ],
  cca: [
    ["plugins/cca/.claude-plugin/plugin.json", setVersion, [topVersion]],
    [".claude-plugin/marketplace.json", (j) => { for (const e of j.plugins) if (e.name === "cca") e.version = version; }],
  ],
}[component];

// Every file is computed before any is written, so a file that cannot be edited cleanly leaves all of them as they were.
const out = [];
for (const [file, change, lines] of edits) {
  const before = readFileSync(join(root, file), "utf8");
  const want = JSON.parse(before);
  change(want);
  // A Windows checkout may hold the JSON files with CRLF endings; a rewrite keeps the file's ending.
  const eol = before.includes("\r\n") ? "\r\n" : "\n";
  const canonical = (j) => `${JSON.stringify(j, null, 2)}\n`.replace(/\n/g, eol);
  let after;
  if (lines) after = lines.reduce((s, [re, to]) => s.replace(re, to), before);
  else if (before === canonical(JSON.parse(before))) after = canonical(want);
  if (after === undefined || !isDeepStrictEqual(JSON.parse(after), want)) {
    console.error(`release: ${file}: cannot set the version without changing anything else; no file was written`);
    process.exit(1);
  }
  out.push([file, after]);
}
// cca's skill spells its version out in three places, which lint holds to the manifest, so a cca release sets them too.
const literals = component !== "cca" ? [] : [
  ["plugins/cca/skills/cca/SKILL.md", /("plugin_version": ")[^"]*(")/],
  ["plugins/cca/skills/cca/stages/1-orient.md", /(`plugin_version` `)[^`]*(`)/],
  ["plugins/cca/skills/cca/stages/resume.md", /(for this release is `)[^`]*(`)/],
];
for (const [file, re] of literals) {
  const before = readFileSync(join(root, file), "utf8");
  if (!re.test(before)) {
    console.error(`release: ${file}: no plugin_version literal to set; no file was written`);
    process.exit(1);
  }
  out.push([file, before.replace(re, `$1${version}$2`)]);
}
for (const [file, after] of out) writeFileSync(join(root, file), after);
console.log(`release: ${component} ${version}${floor ? `, ccx range >=${floor} <1.0.0` : ""}: ${out.map(([f]) => f).join(", ")}`);
process.exit(spawnSync(process.execPath, [join(root, "tools", "lint.mjs")], { stdio: "inherit" }).status ?? 1);
