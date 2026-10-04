#!/usr/bin/env node
// Suite checks. node suite.mjs session-start <dataDir>, the SessionStart hook: prints one notice when a house rules block
// is stale and not declined, else nothing, and writes nothing. node suite.mjs old-plugins, run by setup: lists the plugins
// this suite replaces that are still installed, with the command that removes each. It never runs those commands.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { digests, inspect, loadState, loadTexts, readText, render, targets } from './rules.mjs';

// The source plugins, by their old ids. The audit plugin is not one of them and is never listed.
// The loop comes before the bridge it depends on: Claude Code refuses to disable the bridge while the loop needs it.
export const OLD_CLAUDE = ['codex-lite@vibecodedapps-codex-lite', 'ccl@vibecodedapps-claude-codex-loop', 'repo-docs@repo-docs',
  'recode-loop@reimagine-code', 'recode@reimagine-code'];
export const OLD_CODEX = ['codex-code-review-general@codex-code-review', 'codex-code-review@codex-code-review', 'repo-docs@repo-docs',
  'recode@reimagine-code'];

// Stale: the block still matches its digest, but the rules this plugin ships for its options differ, or it carries the
// old marker. A block edited by hand is left to the command, and a text the user declined stays quiet.
export function staleTargets(all, texts, state) {
  const stale = [];
  for (const [name, t] of Object.entries(all)) {
    const text = t.skip ? null : readText(t.path);
    const found = text === null ? { kind: 'absent' } : inspect(text);
    if (found.kind !== 'block' || !digests(text.slice(found.bodyStart, found.bodyEnd)).includes(found.digest)) continue;
    const shipped = digests(render(name, found.options, texts));
    if ((found.legacy || !shipped.includes(found.digest)) && !shipped.some((d) => (state.declined[name] ?? []).includes(d))) stale.push(t.path);
  }
  return stale;
}

// The files whose block carries the old marker.
export const legacyTargets = (all) => Object.values(all).filter((t) => !t.skip && readText(t.path) !== null && inspect(readText(t.path)).legacy).map((t) => t.path);

export const notice = (paths, legacy = []) => (paths.length
  ? `${JSON.stringify({ systemMessage: `ccx: the house rules in ${paths.join(' and ')} are older than this plugin's${legacy.length
    ? `; ${legacy.join(' and ')} still uses the old marker recode:house-rules` : ''}; run /ccx:rules to update them` })}\n`
  : '');

// Plugin ids enabled in a Codex config.toml: each [plugins."<id>"] table with enabled = true.
export function codexEnabled(toml) {
  const ids = [];
  let id = null;
  for (const raw of toml.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('[')) id = line.match(/^\[plugins\."([^"]+)"\]$/)?.[1] ?? null;
    else if (id && /^enabled\s*=\s*true\s*(#.*)?$/.test(line)) ids.push(id);
  }
  return ids;
}

// claudeList is the stdout of `claude plugin list --json`, or null when it could not be run; codexToml is the Codex
// config, or null when there is none.
export function oldPluginReport(claudeList, codexToml) {
  const lines = [];
  let installed = [];
  try { installed = JSON.parse(claudeList).map((p) => p.id); } catch { lines.push('old plugins: the Claude plugin list could not be read, so Claude plugins were not checked'); }
  const enabled = codexToml === null ? [] : codexEnabled(codexToml);
  const found = [
    ...OLD_CLAUDE.filter((id) => installed.includes(id)).map((id) => `  claude plugin uninstall ${id}`),
    ...OLD_CODEX.filter((id) => enabled.includes(id)).map((id) => `  codex plugin remove ${id}`),
  ];
  if (!found.length) return [...lines, 'old plugins: none found'];
  return [...lines, 'old plugins: the reimagine-code suite replaces these; remove each once its replacement works for you:', ...found];
}

function listClaudePlugins() {
  // On Windows an npm install puts claude.cmd on PATH, which only a shell can start; the command line is constant.
  const r = process.platform === 'win32'
    ? spawnSync('claude plugin list --json', { shell: true, encoding: 'utf8', timeout: 30_000, windowsHide: true })
    : spawnSync('claude', ['plugin', 'list', '--json'], { encoding: 'utf8', timeout: 30_000 });
  return r.status === 0 ? r.stdout : null;
}

// Node resolves the entry point through symlinks, so compare with the resolved path.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [verb, dataDir] = process.argv.slice(2);
  if (verb === 'session-start') {
    // A hook must never fail a session start: any error prints nothing.
    try { process.stdout.write(notice(staleTargets(targets(process.env), loadTexts(), loadState(dataDir)), legacyTargets(targets(process.env)))); } catch {}
  } else if (verb === 'old-plugins') {
    const codexDir = process.env.CODEX_HOME || join(homedir(), '.codex');
    process.stdout.write(`${oldPluginReport(listClaudePlugins(), readText(join(codexDir, 'config.toml'))).join('\n')}\n`);
  } else {
    process.stdout.write('ccx: use session-start <dataDir> or old-plugins\n');
    process.exitCode = 1;
  }
}
