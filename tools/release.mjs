#!/usr/bin/env node
// Sets one component's version in every manifest and catalog entry that carries it, and for recode, when --floor is given,
// the floor of recode-loop's dependency range. Then runs lint, which checks that the copies agree, the range, and the
// changelog heading. Tagging stays with `claude plugin tag`.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = fileURLToPath(new URL("..", import.meta.url));
const usage = "usage: node tools/release.mjs recode <version> [--floor <version>]\n       node tools/release.mjs repo-docs <version>";
const semver = /^\d+\.\d+\.\d+$/;
const [component, version, flag, floor, ...extra] = process.argv.slice(2);
const valid = ["recode", "repo-docs"].includes(component) && semver.test(version ?? "") && !extra.length
  && (flag === undefined || (component === "recode" && flag === "--floor" && semver.test(floor ?? "")));
if (!valid) {
  console.error(usage);
  process.exit(2);
}

// Each edit names a file, the change to its JSON, and the line replacements that make that change, so a hand-formatted
// manifest keeps its layout. An edit with no replacements rewrites a file that is already canonical JSON.
const topVersion = [/^ {2}"version": "[^"]*"/m, `  "version": "${version}"`];
const setVersion = (j) => { j.version = version; };
const edits = {
  recode: [
    ["package.json", setVersion, [topVersion]],
    ["plugins/recode/.claude-plugin/plugin.json", setVersion, [topVersion]],
    ["plugins/recode-loop/.claude-plugin/plugin.json", (j) => {
      j.version = version;
      const dep = floor && j.dependencies?.find((d) => d?.name === "recode");
      if (dep) dep.version = `>=${floor} <1.0.0`;
    }, [topVersion, ...(floor ? [[/("name": "recode", "version": ")[^"]*"/, `$1>=${floor} <1.0.0"`]] : [])]],
    ["plugins/recode-codex/plugin.json", setVersion, [topVersion]],
    [".claude-plugin/marketplace.json", (j) => {
      j.metadata.version = version;
      for (const e of j.plugins) if (e.name === "recode" || e.name === "recode-loop") e.version = version;
    }],
  ],
  "repo-docs": [
    ["plugins/repo-docs/.claude-plugin/plugin.json", setVersion, [topVersion]],
    ["plugins/repo-docs/.codex-plugin/plugin.json", setVersion, [topVersion]],
    [".claude-plugin/marketplace.json", (j) => { for (const e of j.plugins) if (e.name === "repo-docs") e.version = version; }],
  ],
}[component];

// Every file is computed before any is written, so a file that cannot be edited cleanly leaves all of them as they were.
const out = [];
for (const [file, change, lines] of edits) {
  const before = readFileSync(join(root, file), "utf8");
  const want = JSON.parse(before);
  change(want);
  let after;
  if (lines) after = lines.reduce((s, [re, to]) => s.replace(re, to), before);
  else if (before === `${JSON.stringify(JSON.parse(before), null, 2)}\n`) after = `${JSON.stringify(want, null, 2)}\n`;
  if (after === undefined || !isDeepStrictEqual(JSON.parse(after), want)) {
    console.error(`release: ${file}: cannot set the version without changing anything else; no file was written`);
    process.exit(1);
  }
  out.push([file, after]);
}
for (const [file, after] of out) writeFileSync(join(root, file), after);
console.log(`release: ${component} ${version}${floor ? `, recode range >=${floor} <1.0.0` : ""}: ${out.map(([f]) => f).join(", ")}`);
process.exit(spawnSync(process.execPath, [join(root, "tools", "lint.mjs")], { stdio: "inherit" }).status ?? 1);
