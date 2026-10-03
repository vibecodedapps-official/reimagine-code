// The SessionStart staleness notice and setup's old-plugin report. Targets live in temporary directories; the Claude
// plugin list and the Codex config are fixture text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { targets } from '../../plugins/recode/scripts/rules.mjs';
import { codexEnabled, notice, oldPluginReport, staleTargets } from '../../plugins/recode/scripts/suite.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/recode/scripts/suite.mjs', import.meta.url));
const TEXTS = { 'core.md': 'C1\nC2\n', 'windows-claude.md': 'WC\n', 'windows-codex.md': 'WX\n', 'writing-codex.md': 'WR\n' };
const END = '<!-- recode:house-rules end -->';
const block = (options, digest, body) => `<!-- recode:house-rules begin version=0.0.1 options=${options} join=none digest=${digest} -->\n${body}${END}\n`;
const NONE = { options: {}, created: {}, declined: {} };

// Shaped like `claude plugin list --json` from Claude Code 2.1.284.
const CLAUDE_LIST = JSON.stringify([
  { id: 'codex-lite@vibecodedapps-codex-lite', version: '0.9.0', scope: 'user', enabled: true },
  { id: 'cca@vibecodedapps-claude-codex-audit', version: '0.3.0', scope: 'user', enabled: true },
  { id: 'recode@reimagine-code', version: '0.1.0', scope: 'user', enabled: true },
  { id: 'repo-docs@repo-docs', version: '0.1.1', scope: 'user', enabled: false },
]);
const CODEX_TOML = [
  'model = "gpt-5"',
  '',
  '[plugins."codex-code-review-general@codex-code-review"]',
  'enabled = true',
  '',
  '[plugins."repo-docs@repo-docs"]',
  'enabled = false',
  '',
  '[plugins."recode@reimagine-code"]',
  'enabled = true # the new one',
  '',
  '[projects."/work"]',
  'enabled = true',
  '',
].join('\n');

test('codexEnabled lists each [plugins."<id>"] table with enabled = true, in LF or CRLF', () => {
  assert.deepEqual(codexEnabled(CODEX_TOML), ['codex-code-review-general@codex-code-review', 'recode@reimagine-code']);
  assert.deepEqual(codexEnabled(CODEX_TOML.replace(/\n/g, '\r\n')), ['codex-code-review-general@codex-code-review', 'recode@reimagine-code']);
  assert.deepEqual(codexEnabled(''), []);
});

test('R16: the report lists each old plugin with the command that removes it, and never the audit plugin', () => {
  assert.deepEqual(oldPluginReport(CLAUDE_LIST, CODEX_TOML), [
    'old plugins: the reimagine-code suite replaces these; remove each once its replacement works for you:',
    '  claude plugin uninstall codex-lite@vibecodedapps-codex-lite',
    '  claude plugin uninstall repo-docs@repo-docs',
    '  codex plugin remove codex-code-review-general@codex-code-review',
  ]);
});

test('R16: with no old plugins the report says so, and a list that could not be read is named', () => {
  assert.deepEqual(oldPluginReport('[]', null), ['old plugins: none found']);
  assert.deepEqual(oldPluginReport(JSON.stringify([{ id: 'recode@reimagine-code' }]), '[plugins."repo-docs@repo-docs"]\nenabled = false\n'),
    ['old plugins: none found']);
  assert.deepEqual(oldPluginReport(null, null), [
    'old plugins: the Claude plugin list could not be read, so Claude plugins were not checked', 'old plugins: none found']);
  assert.deepEqual(oldPluginReport('not json', '[plugins."codex-code-review@codex-code-review"]\nenabled = true\n'), [
    'old plugins: the Claude plugin list could not be read, so Claude plugins were not checked',
    'old plugins: the reimagine-code suite replaces these; remove each once its replacement works for you:',
    '  codex plugin remove codex-code-review@codex-code-review',
  ]);
});

function sandbox(fn) {
  return () => {
    const root = mkdtempSync(join(tmpdir(), 'recode-suite-'));
    const s = { root, claudeDir: join(root, 'claude'), codexDir: join(root, 'codex'), data: join(root, 'data'), home: join(root, 'home') };
    for (const d of [s.claudeDir, s.codexDir, s.home]) mkdirSync(d);
    s.claude = join(s.claudeDir, 'CLAUDE.md');
    s.codex = join(s.codexDir, 'AGENTS.md');
    s.env = { CLAUDE_CONFIG_DIR: s.claudeDir, CODEX_HOME: s.codexDir };
    s.spawn = (...argv) => spawnSync(process.execPath, [SCRIPT, ...argv],
      { env: { ...process.env, ...s.env, HOME: s.home, USERPROFILE: s.home }, encoding: 'utf8' });
    try { fn(s); } finally { rmSync(root, { recursive: true, force: true }); }
  };
}

test('R45: a block whose shipped text changed is stale; current, edited, absent and declined ones are not', sandbox((s) => {
  const all = () => targets(s.env, s.home);
  writeFileSync(s.claude, `mine\n${block('core', 'be1ba97540b68c56', 'C1\nOLD\n')}`);
  writeFileSync(s.codex, block('core,writing', '39143b59312d5a81', 'C1\nC2\n\nWR\n'));
  assert.deepEqual(staleTargets(all(), TEXTS, NONE), [s.claude]);
  writeFileSync(s.codex, block('core', 'be1ba97540b68c56', 'C1\nOLD\n'));
  assert.deepEqual(staleTargets(all(), TEXTS, NONE), [s.claude, s.codex]);
  assert.deepEqual(staleTargets(all(), TEXTS, { ...NONE, declined: { codex: ['cb477dddc15de845'] } }), [s.claude]);
  writeFileSync(s.codex, block('core', 'be1ba97540b68c56', 'C1\nEDIT\n'));
  assert.deepEqual(staleTargets(all(), TEXTS, NONE), [s.claude]);
  rmSync(s.codex);
  assert.deepEqual(staleTargets(all(), TEXTS, NONE), [s.claude]);
  writeFileSync(join(s.codexDir, 'AGENTS.override.md'), 'override\n');
  writeFileSync(s.codex, block('core', 'be1ba97540b68c56', 'C1\nOLD\n'));
  assert.deepEqual(staleTargets(all(), TEXTS, NONE), [s.claude]);
}));

test('R45: the notice is one line naming the files and /recode:rules, and nothing when none is stale', () => {
  assert.deepEqual(JSON.parse(notice(['/h/.claude/CLAUDE.md'])),
    { systemMessage: "recode: the house rules in /h/.claude/CLAUDE.md are older than this plugin's; run /recode:rules to update them" });
  assert.deepEqual(JSON.parse(notice(['/a/CLAUDE.md', '/b/AGENTS.md'])),
    { systemMessage: "recode: the house rules in /a/CLAUDE.md and /b/AGENTS.md are older than this plugin's; run /recode:rules to update them" });
  assert.equal(notice([]), '');
  assert.equal(notice(['/a/CLAUDE.md']).split('\n').length, 2);
});

test('R45: session-start prints the notice for a stale block, writes nothing, and exits 0', sandbox((s) => {
  writeFileSync(s.claude, `mine\n\n${block('core', '6d3e610aaf815551', 'old rules\n').replace('join=none', 'join=blank')}`);
  const r = s.spawn('session-start', s.data);
  assert.deepEqual(JSON.parse(r.stdout),
    { systemMessage: `recode: the house rules in ${s.claude} are older than this plugin's; run /recode:rules to update them` });
  assert.equal(r.status, 0);
  assert.equal(existsSync(s.data), false);
}));

test('R43, R45: session-start is quiet with no block, and quiet when the state file cannot be read', sandbox((s) => {
  writeFileSync(s.claude, 'mine\n');
  const quiet = s.spawn('session-start', s.data);
  assert.equal(quiet.stdout, '');
  assert.equal(quiet.status, 0);
  writeFileSync(s.claude, `mine\n\n${block('core', '6d3e610aaf815551', 'old rules\n').replace('join=none', 'join=blank')}`);
  mkdirSync(s.data);
  writeFileSync(join(s.data, 'rules-state.json'), '{ not json');
  const broken = s.spawn('session-start', s.data);
  assert.equal(broken.stdout, '');
  assert.equal(broken.status, 0);
}));

test('R16: old-plugins with no claude on PATH names the unread list and still reads the Codex config', sandbox((s) => {
  writeFileSync(join(s.codexDir, 'config.toml'), CODEX_TOML);
  const r = spawnSync(process.execPath, [SCRIPT, 'old-plugins'],
    { env: { ...s.env, HOME: s.home, USERPROFILE: s.home, PATH: s.home, SystemRoot: process.env.SystemRoot ?? '' }, encoding: 'utf8' });
  assert.equal(r.stdout, 'old plugins: the Claude plugin list could not be read, so Claude plugins were not checked\n' +
    'old plugins: the reimagine-code suite replaces these; remove each once its replacement works for you:\n' +
    '  codex plugin remove codex-code-review-general@codex-code-review\n');
  assert.equal(r.status, 0);
}));
