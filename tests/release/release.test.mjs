// Each case copies the repository to a temporary directory and runs tools/release.mjs there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const skipped = /^[/\\]?(\.git|node_modules|\.scratch|imports)([/\\]|$)/;

const inCopy = (fn) => {
  const dir = mkdtempSync(join(tmpdir(), 'ccx-release-'));
  try {
    cpSync(root, dir, { recursive: true, filter: (p) => !skipped.test(p.slice(root.length - 1).replace(/^[/\\]/, '/')) });
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
const release = (dir, ...args) => {
  const r = spawnSync(process.execPath, [join(dir, 'tools', 'release.mjs'), ...args], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout + r.stderr };
};
const json = (dir, file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));
// A Windows checkout holds the JSON files with CRLF endings, so lines are compared without them.
const lines = (dir, file) => readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
const versions = (dir) => {
  const market = json(dir, '.claude-plugin/marketplace.json');
  return {
    suite: json(dir, 'package.json').version,
    ccx: json(dir, 'plugins/ccx/.claude-plugin/plugin.json').version,
    loop: json(dir, 'plugins/ccx-loop/.claude-plugin/plugin.json').version,
    range: json(dir, 'plugins/ccx-loop/.claude-plugin/plugin.json').dependencies[0].version,
    codex: json(dir, 'plugins/ccx-codex/plugin.json').version,
    docsClaude: json(dir, 'plugins/repo-docs/.claude-plugin/plugin.json').version,
    docsCodex: json(dir, 'plugins/repo-docs/.codex-plugin/plugin.json').version,
    cca: json(dir, 'plugins/cca/.claude-plugin/plugin.json').version,
    catalog: market.metadata.version,
    entries: Object.fromEntries(market.plugins.map((e) => [e.name, e.version])),
  };
};
const heading = (dir, line) => {
  const p = join(dir, 'CHANGELOG.md');
  writeFileSync(p, readFileSync(p, 'utf8').replace(/^## /m, `${line}\n\n## `));
};

test('release sets the suite version and the range everywhere, then lint asks for the changelog heading', () => inCopy((d) => {
  const r = release(d, 'ccx', '0.4.0', '--floor', '0.4.0');
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('CHANGELOG.md: no heading "## 0.4.0 - <YYYY-MM-DD>" for the suite version'), r.out);
  assert.deepEqual(versions(d), {
    suite: '0.4.0', ccx: '0.4.0', loop: '0.4.0', range: '>=0.4.0 <1.0.0', codex: '0.4.0',
    docsClaude: '0.1.4', docsCodex: '0.1.4', cca: '0.9.1', catalog: '0.4.0', entries: { ccx: '0.4.0', 'ccx-loop': '0.4.0', cca: '0.9.1', 'repo-docs': '0.1.4' },
  });
  assert.ok(lines(d, 'plugins/ccx-loop/.claude-plugin/plugin.json').includes('    { "name": "ccx", "version": ">=0.4.0 <1.0.0" }'));
  heading(d, '## 0.4.0 - 2026-10-04');
  const again = release(d, 'ccx', '0.4.0', '--floor', '0.4.0');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /^lint: ok /m);
}));

test('release sets repo-docs in its two manifests and its catalog entry only', () => inCopy((d) => {
  const r = release(d, 'repo-docs', '0.1.5');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(versions(d), {
    suite: '0.3.2', ccx: '0.3.2', loop: '0.3.2', range: '>=0.2.0 <1.0.0', codex: '0.3.2',
    docsClaude: '0.1.5', docsCodex: '0.1.5', cca: '0.9.1', catalog: '0.3.2', entries: { ccx: '0.3.2', 'ccx-loop': '0.3.2', cca: '0.9.1', 'repo-docs': '0.1.5' },
  });
  assert.ok(lines(d, 'plugins/repo-docs/.codex-plugin/plugin.json').includes('  "author": { "name": "vibecodedapps.net" },'));
}));

test('release sets cca in its manifest and its catalog entry only', () => inCopy((d) => {
  const r = release(d, 'cca', '0.9.2');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(versions(d), {
    suite: '0.3.2', ccx: '0.3.2', loop: '0.3.2', range: '>=0.2.0 <1.0.0', codex: '0.3.2',
    docsClaude: '0.1.4', docsCodex: '0.1.4', cca: '0.9.2', catalog: '0.3.2', entries: { ccx: '0.3.2', 'ccx-loop': '0.3.2', cca: '0.9.2', 'repo-docs': '0.1.4' },
  });
  assert.ok(lines(d, 'plugins/cca/.claude-plugin/plugin.json').includes('  "license": "Apache-2.0",'));
}));

test('release rejects a malformed request', () => inCopy((d) => {
  for (const args of [['ccx', '0.2'], ['repo-docs', '0.1.3', '--floor', '0.1.0'], ['cca', '0.9.1', '--floor', '0.1.0'], ['ccx-loop', '0.3.2'], ['ccx', '0.3.2', '--floor']]) {
    const r = release(d, ...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.out}`);
    assert.ok(r.out.startsWith('usage: node tools/release.mjs ccx <version> [--floor <version>]'), r.out);
  }
  assert.equal(versions(d).suite, '0.3.2');
}));

test('release writes no file when one cannot be edited cleanly', () => inCopy((d) => {
  const p = join(d, 'plugins/ccx-codex/plugin.json');
  writeFileSync(p, readFileSync(p, 'utf8').replace('\n  "version": "0.3.2",', '\n\t"version": "0.3.2",'));
  const r = release(d, 'ccx', '0.4.0');
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('release: plugins/ccx-codex/plugin.json: cannot set the version without changing anything else; no file was written'), r.out);
  assert.equal(versions(d).suite, '0.3.2');
  assert.equal(versions(d).ccx, '0.3.2');
}));

test('release raises a plugin changed since its tag, so lint passes again', () => inCopy((d) => {
  const git = (...args) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args],
    { cwd: d, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'release');
  git('tag', 'ccx--v0.3.2');
  git('tag', 'ccx-loop--v0.3.2');
  appendFileSync(join(d, 'plugins/ccx-loop/README.md'), 'More.\n');
  heading(d, '## 0.3.3 - 2026-10-04');
  const r = release(d, 'ccx', '0.3.3');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual([versions(d).loop, versions(d).range], ['0.3.3', '>=0.2.0 <1.0.0']);
}));

test('release keeps CRLF line endings, as in a Windows checkout', () => inCopy((d) => {
  const files = ['.claude-plugin/marketplace.json', 'plugins/repo-docs/.claude-plugin/plugin.json', 'plugins/repo-docs/.codex-plugin/plugin.json'];
  for (const f of files) writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').replace(/\r?\n/g, '\r\n'));
  const r = release(d, 'repo-docs', '0.1.5');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual([versions(d).docsClaude, versions(d).docsCodex, versions(d).entries['repo-docs']], ['0.1.5', '0.1.5', '0.1.5']);
  for (const f of files) assert.ok(!/[^\r]\n/.test(readFileSync(join(d, f), 'utf8')), `${f} has a bare LF`);
}));
