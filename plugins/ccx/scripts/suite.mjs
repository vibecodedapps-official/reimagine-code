#!/usr/bin/env node
// Suite checks. node suite.mjs session-start <dataDir>, the SessionStart hook: prints one notice when a house rules block
// is stale and not declined, else nothing, and writes nothing.
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { digests, inspect, loadState, loadTexts, readText, render, targets } from './rules.mjs';

// Stale: the block still matches its digest, but the shipped rules differ. A block edited by hand is left to
// the command, and a text the user declined stays quiet.
export function staleTargets(all, texts, state) {
  const stale = [];
  for (const [name, t] of Object.entries(all)) {
    const text = t.skip ? null : readText(t.path);
    const found = text === null ? { kind: 'absent' } : inspect(text);
    if (found.kind !== 'block' || !digests(text.slice(found.bodyStart, found.bodyEnd)).includes(found.digest)) continue;
    const shipped = digests(render(name, found.options, texts));
    if (!shipped.includes(found.digest) && !shipped.some((d) => (state.declined[name] ?? []).includes(d))) stale.push(t.path);
  }
  return stale;
}

export const notice = (paths) => (paths.length
  ? `${JSON.stringify({ systemMessage: `ccx: the house rules in ${paths.join(' and ')} are older than this plugin's; run /ccx:rules to update them` })}\n`
  : '');

// Node resolves the entry point through symlinks, so compare with the resolved path.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const [verb, dataDir] = process.argv.slice(2);
  if (verb === 'session-start') {
    // A hook must never fail a session start: any error prints nothing.
    try { process.stdout.write(notice(staleTargets(targets(process.env), loadTexts(), loadState(dataDir)))); } catch {}
  } else {
    process.stdout.write('ccx: use session-start <dataDir>\n');
    process.exitCode = 1;
  }
}
