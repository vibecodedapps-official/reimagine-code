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
  const dir = mkdtempSync(join(tmpdir(), 'recode-release-'));
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
    recode: json(dir, 'plugins/recode/.claude-plugin/plugin.json').version,
    loop: json(dir, 'plugins/recode-loop/.claude-plugin/plugin.json').version,
    range: json(dir, 'plugins/recode-loop/.claude-plugin/plugin.json').dependencies[0].version,
    codex: json(dir, 'plugins/recode-codex/plugin.json').version,
    docsClaude: json(dir, 'plugins/repo-docs/.claude-plugin/plugin.json').version,
    docsCodex: json(dir, 'plugins/repo-docs/.codex-plugin/plugin.json').version,
    catalog: market.metadata.version,
    entries: Object.fromEntries(market.plugins.map((e) => [e.name, e.version])),
  };
};
const heading = (dir, line) => {
  const p = join(dir, 'CHANGELOG.md');
  writeFileSync(p, readFileSync(p, 'utf8').replace(/^## /m, `${line}\n\n## `));
};

test('release sets the suite version and the range everywhere, then lint asks for the changelog heading', () => inCopy((d) => {
  const r = release(d, 'recode', '0.2.0', '--floor', '0.2.0');
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('CHANGELOG.md: no heading "## 0.2.0 - <YYYY-MM-DD>" for the suite version'), r.out);
  assert.deepEqual(versions(d), {
    suite: '0.2.0', recode: '0.2.0', loop: '0.2.0', range: '>=0.2.0 <1.0.0', codex: '0.2.0',
    docsClaude: '0.1.3', docsCodex: '0.1.3', catalog: '0.2.0', entries: { recode: '0.2.0', 'recode-loop': '0.2.0', 'repo-docs': '0.1.3' },
  });
  assert.ok(lines(d, 'plugins/recode-loop/.claude-plugin/plugin.json').includes('    { "name": "recode", "version": ">=0.2.0 <1.0.0" }'));
  heading(d, '## 0.2.0 - 2026-10-04');
  const again = release(d, 'recode', '0.2.0', '--floor', '0.2.0');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /^lint: ok /m);
}));

test('release sets repo-docs in its two manifests and its catalog entry only', () => inCopy((d) => {
  const r = release(d, 'repo-docs', '0.1.4');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(versions(d), {
    suite: '0.1.2', recode: '0.1.2', loop: '0.1.2', range: '>=0.1.0 <1.0.0', codex: '0.1.2',
    docsClaude: '0.1.4', docsCodex: '0.1.4', catalog: '0.1.2', entries: { recode: '0.1.2', 'recode-loop': '0.1.2', 'repo-docs': '0.1.4' },
  });
  assert.ok(lines(d, 'plugins/repo-docs/.codex-plugin/plugin.json').includes('  "author": { "name": "vibecodedapps.net" },'));
}));

test('release rejects a malformed request', () => inCopy((d) => {
  for (const args of [['recode', '0.2'], ['repo-docs', '0.1.3', '--floor', '0.1.0'], ['recode-loop', '0.2.0'], ['recode', '0.2.0', '--floor']]) {
    const r = release(d, ...args);
    assert.equal(r.status, 2, `${args.join(' ')}: ${r.out}`);
    assert.ok(r.out.startsWith('usage: node tools/release.mjs recode <version> [--floor <version>]'), r.out);
  }
  assert.equal(versions(d).suite, '0.1.2');
}));

test('release writes no file when one cannot be edited cleanly', () => inCopy((d) => {
  const p = join(d, 'plugins/recode-codex/plugin.json');
  writeFileSync(p, readFileSync(p, 'utf8').replace('\n  "version": "0.1.2",', '\n\t"version": "0.1.2",'));
  const r = release(d, 'recode', '0.2.0');
  assert.equal(r.status, 1, r.out);
  assert.ok(r.out.includes('release: plugins/recode-codex/plugin.json: cannot set the version without changing anything else; no file was written'), r.out);
  assert.equal(versions(d).suite, '0.1.2');
  assert.equal(versions(d).recode, '0.1.2');
}));

test('release raises a plugin changed since its tag, so lint passes again', () => inCopy((d) => {
  const git = (...args) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args],
    { cwd: d, encoding: 'utf8' });
  git('init', '-q', '-b', 'main');
  git('add', '-A');
  git('commit', '-q', '-m', 'release');
  git('tag', 'recode--v0.1.2');
  git('tag', 'recode-loop--v0.1.2');
  appendFileSync(join(d, 'plugins/recode-loop/README.md'), 'More.\n');
  heading(d, '## 0.1.3 - 2026-10-04');
  const r = release(d, 'recode', '0.1.3');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual([versions(d).loop, versions(d).range], ['0.1.3', '>=0.1.0 <1.0.0']);
}));

test('release keeps CRLF line endings, as in a Windows checkout', () => inCopy((d) => {
  const files = ['.claude-plugin/marketplace.json', 'plugins/repo-docs/.claude-plugin/plugin.json', 'plugins/repo-docs/.codex-plugin/plugin.json'];
  for (const f of files) writeFileSync(join(d, f), readFileSync(join(d, f), 'utf8').replace(/\r?\n/g, '\r\n'));
  const r = release(d, 'repo-docs', '0.1.4');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual([versions(d).docsClaude, versions(d).docsCodex, versions(d).entries['repo-docs']], ['0.1.4', '0.1.4', '0.1.4']);
  for (const f of files) assert.ok(!/[^\r]\n/.test(readFileSync(join(d, f), 'utf8')), `${f} has a bare LF`);
}));
