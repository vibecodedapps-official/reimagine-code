// Each case copies the repository to a temporary directory, breaks one thing, and checks that lint reports it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const skipped = /^[/\\]?(\.git|node_modules|\.scratch|imports)([/\\]|$)/;

const lint = (mutate) => {
  const dir = mkdtempSync(join(tmpdir(), 'recode-lint-'));
  try {
    cpSync(root, dir, { recursive: true, filter: (p) => !skipped.test(p.slice(root.length - 1).replace(/^[/\\]/, '/')) });
    mutate(dir);
    const r = spawnSync(process.execPath, [join(dir, 'tools', 'lint.mjs')], { encoding: 'utf8' });
    return { status: r.status, out: r.stdout + r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
const editJson = (dir, file, fn) => {
  const p = join(dir, file);
  const j = JSON.parse(readFileSync(p, 'utf8'));
  fn(j);
  writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`);
};
const dropLine = (dir, file, line) => {
  const p = join(dir, file);
  const lines = readFileSync(p, 'utf8').split(/\r?\n/);
  assert.ok(lines.some((l) => l.trim() === line), `${file} lacks the line ${line}`);
  writeFileSync(p, lines.filter((l) => l.trim() !== line).join('\n'));
};
const fails = (mutate, ...want) => {
  const r = lint(mutate);
  assert.equal(r.status, 1, r.out);
  for (const w of want) assert.ok(r.out.includes(w), `lint output lacks: ${w}\n${r.out}`);
};

test('lint passes on an unmodified copy', () => {
  const r = lint(() => {});
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^lint: ok /);
});

test('lint rejects a runtime module no budget lists', () => fails(
  (d) => writeFileSync(join(d, 'plugins/recode/scripts/extra.mjs'), 'export {};\n'),
  'runtime modules no plugin budget lists: plugins/recode/scripts/extra.mjs'));

test('lint rejects bridge scripts over their 700-line budget', () => fails(
  (d) => appendFileSync(join(d, 'plugins/recode/scripts/codex.mjs'), '\n'.repeat(700)),
  'plugins/recode: codex.mjs + recode.mjs total ', ' lines, budget is 700'));

test('lint rejects a plugin directory with no row in its table', () => fails(
  (d) => { mkdirSync(join(d, 'plugins/foo')); writeFileSync(join(d, 'plugins/foo/x.md'), 'x\n'); },
  'plugins/foo: no row in PLUGINS in tools/lint.mjs'));

test('lint rejects a catalog with another name', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.name = 'other'; }),
  '.claude-plugin/marketplace.json: name must be reimagine-code, not other'));

test('lint rejects a catalog with no metadata.description', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { delete j.metadata.description; }),
  '.claude-plugin/marketplace.json: metadata.description is missing'));

test('lint rejects a catalog metadata.version other than the suite version', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.metadata.version = '9.9.9'; }),
  '.claude-plugin/marketplace.json: metadata.version 9.9.9 differs from the suite version'));

test('lint rejects a catalog source that does not exist, and the plugin it no longer lists', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'recode').source = './plugins/nope'; }),
  '.claude-plugin/marketplace.json: recode: source ./plugins/nope does not exist',
  '.claude-plugin/marketplace.json: no entry for plugins/recode'));

test('lint rejects a catalog entry whose version differs from its manifest', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'recode').version = '9.9.9'; }),
  '.claude-plugin/marketplace.json: entry recode 9.9.9 differs from plugins/recode manifest recode '));

test('lint rejects a suite plugin off the suite version', () => fails(
  (d) => {
    editJson(d, 'plugins/recode/.claude-plugin/plugin.json', (j) => { j.version = '9.9.9'; });
    editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'recode').version = '9.9.9'; });
  },
  'plugins/recode: version 9.9.9 differs from the suite version'));

test('lint rejects a root README without a plugin install line', () => fails(
  (d) => dropLine(d, 'README.md', '/plugin install recode@reimagine-code'),
  'README.md install block lacks the line: /plugin install recode@reimagine-code'));

test('lint rejects a non-ASCII byte in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/recode/x.md'), 'plain\ncaf\u00e9\n'),
  'plugins/recode/x.md:2: non-ASCII byte'));

test('lint rejects codex-lite in any case in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/recode/x.md'), 'See Codex_Lite.\n'),
  'plugins/recode/x.md:1: old name /codex[-_]lite/'));

test('lint rejects the word ccl in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/recode/x.md'), 'ok\nLike CCL did.\n'),
  'plugins/recode/x.md:2: old name /\\bccl\\b/'));

test('lint rejects the old loop marketplace name in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/recode/x.md'), 'vibecodedapps-claude-codex-loop\n'),
  'plugins/recode/x.md:1: old name /vibecodedapps-claude-codex-loop/'));

test('lint rejects a plugin directory with no LICENSE', () => fails(
  (d) => rmSync(join(d, 'plugins/recode/LICENSE')),
  'plugins/recode/LICENSE: missing or not the Apache-2.0 license'));

test('lint rejects a .gitattributes that drops an LF rule', () => fails(
  (d) => dropLine(d, '.gitattributes', '*.sh text eol=lf'),
  '.gitattributes lacks the line: *.sh text eol=lf'));

test('lint rejects rules.mjs over its 400-line budget', () => fails(
  (d) => appendFileSync(join(d, 'plugins/recode/scripts/rules.mjs'), '\n'.repeat(400)),
  'plugins/recode: rules.mjs total ', ' lines, budget is 400'));

test('lint rejects a rules command the model can invoke', () => fails(
  (d) => dropLine(d, 'plugins/recode/commands/rules.md', 'disable-model-invocation: true'),
  'plugins/recode/commands/rules.md: disable-model-invocation must be set'));

test('lint rejects hooks without the SessionStart notice', () => fails(
  (d) => editJson(d, 'plugins/recode/hooks/hooks.json', (j) => { delete j.hooks.SessionStart; }),
  'plugins/recode/hooks/hooks.json must declare exactly these hooks'));

test('lint rejects missing chat instructions', () => fails(
  (d) => rmSync(join(d, 'plugins/recode/chat/instructions.md')),
  'plugins/recode/chat/instructions.md: missing'));

test('lint rejects chat instructions with a second fenced block', () => fails(
  (d) => appendFileSync(join(d, 'plugins/recode/chat/instructions.md'), '\n```\nmore\n```\n'),
  'plugins/recode/chat/instructions.md: must hold exactly one fenced block, found 4 fence lines'));

test('lint rejects a chat block over 5,000 characters', () => fails(
  (d) => {
    const p = join(d, 'plugins/recode/chat/instructions.md');
    const s = readFileSync(p, 'utf8');
    const close = s.lastIndexOf('\n```');
    writeFileSync(p, `${s.slice(0, close)}\n${'x'.repeat(2000)}${s.slice(close)}`);
  },
  'plugins/recode/chat/instructions.md: the block is ', ", over ChatGPT's 5,000"));
