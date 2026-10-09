// Each case copies the repository to a temporary directory, breaks one thing, and checks that lint reports it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const skipped = /^[/\\]?(\.git|node_modules|\.scratch|imports)([/\\]|$)/;

const lint = (mutate) => {
  const dir = mkdtempSync(join(tmpdir(), 'ccx-lint-'));
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
  (d) => writeFileSync(join(d, 'plugins/ccx/scripts/extra.mjs'), 'export {};\n'),
  'runtime modules no plugin budget lists: plugins/ccx/scripts/extra.mjs'));

test('lint rejects bridge scripts over their 740-line budget', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx/scripts/codex.mjs'), '\n'.repeat(700)),
  'plugins/ccx: codex.mjs + ccx.mjs total ', ' lines, budget is 740'));

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

test('lint rejects a catalog carrying renames', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.renames = { recode: 'ccx' }; }),
  '.claude-plugin/marketplace.json: renames must be absent'));

test('lint rejects a catalog source that does not exist, and the plugin it no longer lists', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'ccx').source = './plugins/nope'; }),
  '.claude-plugin/marketplace.json: ccx: source ./plugins/nope does not exist',
  '.claude-plugin/marketplace.json: no entry for plugins/ccx'));

test('lint rejects a catalog entry whose version differs from its manifest', () => fails(
  (d) => editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'ccx').version = '9.9.9'; }),
  '.claude-plugin/marketplace.json: entry ccx 9.9.9 differs from plugins/ccx manifest ccx '));

test('lint rejects a suite plugin off the suite version', () => fails(
  (d) => {
    editJson(d, 'plugins/ccx/.claude-plugin/plugin.json', (j) => { j.version = '9.9.9'; });
    editJson(d, '.claude-plugin/marketplace.json', (j) => { j.plugins.find((e) => e.name === 'ccx').version = '9.9.9'; });
  },
  'plugins/ccx: version 9.9.9 differs from the suite version'));

test('lint rejects a root README without a plugin install line', () => fails(
  (d) => dropLine(d, 'README.md', '/plugin install ccx@reimagine-code'),
  'README.md install block lacks the line: /plugin install ccx@reimagine-code'));

test('lint rejects a root README without a plugin uninstall line', () => fails(
  (d) => dropLine(d, 'README.md', '/plugin uninstall ccx@reimagine-code'),
  'README.md uninstall block lacks the line: /plugin uninstall ccx@reimagine-code'));

for (const file of ['SKILL.md', 'stages/1-orient.md', 'stages/resume.md']) {
  const path = `plugins/cca/skills/cca/${file}`;
  test(`lint rejects a cca plugin_version mismatch in ${file}`, () => fails(
    (d) => {
      const p = join(d, path);
      const s = readFileSync(p, 'utf8');
      assert.ok(s.includes('0.10.2'), `${path} lacks the version`);
      writeFileSync(p, s.replace('0.10.2', '0.9.0'));
    },
    `${path}: plugin_version 0.9.0 differs from the cca manifest version 0.10.2`));
}

test('lint rejects a non-ASCII byte in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'plain\ncaf\u00e9\n'),
  'plugins/ccx/x.md:2: non-ASCII byte'));

test('lint rejects codex-lite in any case in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'See Codex_Lite.\n'),
  'plugins/ccx/x.md:1: old name /codex[-_]lite/'));

test('lint rejects recode in any case in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'Run /Recode:rules.\n'),
  'plugins/ccx/x.md:1: old name /recode/'));

test('lint rejects the old rules marker in rules.mjs', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx/scripts/rules.mjs'), '// recode:house-rules\n'),
  'plugins/ccx/scripts/rules.mjs:', 'old name /recode/'));

test('lint rejects the word ccl in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'ok\nLike CCL did.\n'),
  'plugins/ccx/x.md:2: old name /\\bccl\\b/'));

test('lint rejects the old loop marketplace name in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'vibecodedapps-claude-codex-loop\n'),
  'plugins/ccx/x.md:1: old name /vibecodedapps-claude-codex-loop/'));

test('lint rejects the old Codex marketplace name in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'codex-code-review-general@codex-code-review\n'),
  'plugins/ccx/x.md:1: old name /codex-code-review/: codex-code-review-general@codex-code-review'));

test('lint rejects the old repo-docs install id in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'repo-docs@repo-docs\n'),
  'plugins/ccx/x.md:1: old name /repo-docs@repo-docs/: repo-docs@repo-docs'));

test('lint rejects the old audit marketplace name in a shipped file', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx/x.md'), 'vibecodedapps-claude-codex-audit\n'),
  'plugins/ccx/x.md:1: old name /vibecodedapps-claude-codex-audit/: vibecodedapps-claude-codex-audit'));

test('lint rejects a plugin directory with no LICENSE', () => fails(
  (d) => rmSync(join(d, 'plugins/ccx/LICENSE')),
  'plugins/ccx/LICENSE: missing or not the Apache-2.0 license'));

test('lint rejects a .gitattributes that drops an LF rule', () => fails(
  (d) => dropLine(d, '.gitattributes', '*.sh text eol=lf'),
  '.gitattributes lacks the line: *.sh text eol=lf'));

test('lint rejects rules.mjs over its 640-line budget', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx/scripts/rules.mjs'), '\n'.repeat(640)),
  'plugins/ccx: rules.mjs total ', ' lines, budget is 640'));

test('lint rejects a rules command the model can invoke', () => fails(
  (d) => dropLine(d, 'plugins/ccx/commands/rules.md', 'disable-model-invocation: true'),
  'plugins/ccx/commands/rules.md: disable-model-invocation must be set'));

test('lint rejects hooks without the SessionStart notice', () => fails(
  (d) => editJson(d, 'plugins/ccx/hooks/hooks.json', (j) => { delete j.hooks.SessionStart; }),
  'plugins/ccx/hooks/hooks.json must declare exactly these hooks'));

test('lint rejects hooks without the PreToolUse attribution check', () => fails(
  (d) => editJson(d, 'plugins/ccx/hooks/hooks.json', (j) => { delete j.hooks.PreToolUse; }),
  'plugins/ccx/hooks/hooks.json must declare exactly these hooks'));

test('lint rejects repo-docs hooks that skip the PowerShell tool', () => fails(
  (d) => editJson(d, 'plugins/repo-docs/hooks/hooks.json', (j) => { j.hooks.PreToolUse.pop(); }),
  'plugins/repo-docs/hooks/hooks.json must declare exactly these hooks'));

test('lint rejects missing chat instructions', () => fails(
  (d) => rmSync(join(d, 'plugins/ccx/chat/instructions.md')),
  'plugins/ccx/chat/instructions.md: missing'));

test('lint rejects chat instructions with a second fenced block', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx/chat/instructions.md'), '\n```\nmore\n```\n'),
  'plugins/ccx/chat/instructions.md: must hold exactly one fenced block, found 4 fence lines'));

test('lint rejects a chat block over 5,000 characters', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx/chat/instructions.md');
    const s = readFileSync(p, 'utf8');
    const close = s.lastIndexOf('\n```');
    writeFileSync(p, `${s.slice(0, close)}\n${'x'.repeat(2000)}${s.slice(close)}`);
  },
  'plugins/ccx/chat/instructions.md: the block is ', ", over ChatGPT's 5,000"));

test('lint rejects a loop dependency range with a caret', () => fails(
  (d) => editJson(d, 'plugins/ccx-loop/.claude-plugin/plugin.json', (j) => { j.dependencies = [{ name: 'ccx', version: '^0.1.0' }]; }),
  'plugins/ccx-loop/.claude-plugin/plugin.json: dependencies must hold', 'found "^0.1.0"'));

test('lint rejects a loop dependency floor above the suite version', () => fails(
  (d) => editJson(d, 'plugins/ccx-loop/.claude-plugin/plugin.json', (j) => { j.dependencies = [{ name: 'ccx', version: '>=0.7.0 <1.0.0' }]; }),
  'with the floor at or below 0.6.2; found ">=0.7.0 <1.0.0"'));

test('lint rejects a loop with no ccx dependency', () => fails(
  (d) => editJson(d, 'plugins/ccx-loop/.claude-plugin/plugin.json', (j) => { delete j.dependencies; }),
  'plugins/ccx-loop/.claude-plugin/plugin.json: dependencies must hold', 'found null'));

test('lint rejects a bridge version gate in the loop', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/tiers.md'), 'Codex needs ccx 0.9.0 or later.\n'),
  'plugins/ccx-loop/skills/ccx-loop/tiers.md:', 'bridge version gate /\\b0\\.[89]\\.0\\b/'));

test('lint rejects a loop lookup of the installed ccx', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/SKILL.md'), 'Take the entry whose id starts with ccx@.\n'),
  'plugins/ccx-loop/skills/ccx-loop/SKILL.md:', 'bridge version gate /\\bccx@/'));

test('lint rejects the old config name in shipped text', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx-loop/README.md'), 'Rename .ccl.json to .ccx.json.\n'),
  'plugins/ccx-loop/README.md:', 'old name /\\bccl\\b/'));

test('lint rejects a loop command that does not read the codex option', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/commands/plan.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('`${user_config.codex}`'), 'plan.md lacks the option');
    writeFileSync(p, s.replace('`${user_config.codex}`', '`true`'));
  },
  'plugins/ccx-loop/commands/plan.md: must read the codex option as `${user_config.codex}`'));

test('lint rejects a loop command that lists the max effort value in its description', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/commands/run.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('--effort medium|high|xhigh,'), 'run.md lacks the description list');
    writeFileSync(p, s.replace('--effort medium|high|xhigh,', '--effort medium|high|xhigh|max,'));
  },
  'plugins/ccx-loop/commands/run.md: the description must list the effort values exactly medium, high, xhigh; found "medium,high,xhigh,max"'));

test('lint rejects a loop command that drops an effort value from its argument hint', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/commands/plan.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('[--effort medium|high|xhigh]'), 'plan.md lacks the hint list');
    writeFileSync(p, s.replace('[--effort medium|high|xhigh]', '[--effort medium|high]'));
  },
  'plugins/ccx-loop/commands/plan.md: the argument-hint must list the effort values exactly medium, high, xhigh; found "medium,high"'));

test('lint rejects a loop command whose flag check accepts max', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/commands/run.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('one of `medium`, `high`, `xhigh`;'), 'run.md lacks the flag check list');
    writeFileSync(p, s.replace('one of `medium`, `high`, `xhigh`;', 'one of `medium`, `high`, `xhigh`, `max`;'));
  },
  'plugins/ccx-loop/commands/run.md: the flag check must list the effort values exactly medium, high, xhigh; found "medium,high,xhigh,max"'));

test('lint rejects an invocation block that lists the low effort value', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/skills/ccx-loop/SKILL.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('  effort: auto | medium | high | xhigh'), 'SKILL.md lacks the invocation block line');
    writeFileSync(p, s.replace('  effort: auto | medium | high | xhigh', '  effort: auto | low | medium | high | xhigh'));
  },
  'plugins/ccx-loop/skills/ccx-loop/SKILL.md: the invocation block must list the effort values exactly auto | medium | high | xhigh; found "low,medium,high,xhigh"'));

test('lint rejects a loop core over its word cap', () => fails(
  (d) => appendFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/SKILL.md'), `\n${'word '.repeat(600)}\n`),
  'plugins/ccx-loop/skills/ccx-loop/SKILL.md: ', ' words, cap is 5800'));

test('lint rejects a Supporting files entry that names a missing file', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-loop/skills/ccx-loop/SKILL.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('- `ci-watch.md`: Step 7.3 items'), 'SKILL.md lacks the ci-watch entry');
    writeFileSync(p, s.replace('- `ci-watch.md`: Step 7.3 items', '- `ci-watch-gone.md`: Step 7.3 items'));
  },
  'plugins/ccx-loop/skills/ccx-loop/SKILL.md: Supporting files names ci-watch-gone.md, which does not exist'));

test('lint rejects a step file that Supporting files does not name', () => fails(
  (d) => writeFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/steps/9-extra.md'), '# Extra\n'),
  'plugins/ccx-loop/skills/ccx-loop/steps/9-extra.md: not named in the Supporting files section of SKILL.md'));

test('lint rejects a codex catalog with another name', () => fails(
  (d) => editJson(d, '.agents/plugins/marketplace.json', (j) => { j.name = 'codex-code-review'; }),
  '.agents/plugins/marketplace.json: name must be reimagine-code, not codex-code-review'));

test('lint rejects a codex catalog entry that is not available on install', () => fails(
  (d) => editJson(d, '.agents/plugins/marketplace.json', (j) => { j.plugins[0].policy.installation = 'NOT_AVAILABLE'; }),
  '.agents/plugins/marketplace.json: ccx: policy must be installation AVAILABLE and authentication ON_INSTALL'));

test('lint rejects a codex catalog that lists a claude-only plugin', () => fails(
  (d) => editJson(d, '.agents/plugins/marketplace.json', (j) => {
    j.plugins.push({ name: 'ccx-loop', source: { source: 'local', path: './plugins/ccx-loop' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' } });
  }),
  '.agents/plugins/marketplace.json: ccx-loop: source ./plugins/ccx-loop is not a Codex plugin in PLUGINS'));

test('lint rejects a codex catalog without repo-docs', () => fails(
  (d) => editJson(d, '.agents/plugins/marketplace.json', (j) => { j.plugins = j.plugins.filter((e) => e.name !== 'repo-docs'); }),
  '.agents/plugins/marketplace.json: no entry for plugins/repo-docs'));

test('lint rejects a codex catalog entry named apart from its manifest', () => fails(
  (d) => editJson(d, '.agents/plugins/marketplace.json', (j) => { j.plugins[0].name = 'codex-code-review-general'; }),
  '.agents/plugins/marketplace.json: entry codex-code-review-general differs from plugins/ccx-codex manifest ccx'));

test('lint rejects the codex manifest on another schema', () => fails(
  (d) => editJson(d, 'plugins/ccx-codex/plugin.json', (j) => { j.$schema = 'https://agent-plugins.org/schemas/1.1.0/plugin.schema.json'; }),
  'plugins/ccx-codex/plugin.json: $schema must be https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'));

test('lint rejects the codex ccx off the suite version', () => fails(
  (d) => editJson(d, 'plugins/ccx-codex/plugin.json', (j) => { j.version = '0.7.0'; }),
  'plugins/ccx-codex: version 0.7.0 differs from the suite version 0.6.2 in package.json'));

test('lint rejects repo-docs manifests with different versions', () => fails(
  (d) => editJson(d, 'plugins/repo-docs/.codex-plugin/plugin.json', (j) => { j.version = '0.1.1'; }),
  'plugins/repo-docs/.codex-plugin/plugin.json: version 0.1.1 differs from 0.1.6 in .claude-plugin/plugin.json'));

test('lint rejects the codex plugin without its NOTICE', () => fails(
  (d) => rmSync(join(d, 'plugins/ccx-codex/NOTICE')),
  'plugins/ccx-codex/NOTICE: missing, or without the upstream NOTICE text'));

test('lint rejects a review skill without its provenance comment', () => fails(
  (d) => {
    const p = join(d, 'plugins/ccx-codex/skills/general-code-review-testing/SKILL.md');
    const s = readFileSync(p, 'utf8');
    assert.ok(s.includes('<!-- Modified. Adapted from openai/codex '), 'the skill lacks its comment');
    writeFileSync(p, s.split('\n').filter((l) => !l.startsWith('<!-- Modified. Adapted from openai/codex ')).join('\n'));
  },
  'plugins/ccx-codex/skills/general-code-review-testing/SKILL.md: lacks its provenance comment'));

test('lint rejects a changelog without a dated heading for the suite version', () => fails(
  (d) => {
    const p = join(d, 'CHANGELOG.md');
    const s = readFileSync(p, 'utf8');
    assert.match(s, /^## 0\.6\.2 - \d{4}-\d{2}-\d{2}$/m, 'the changelog lacks the heading');
    writeFileSync(p, s.replace(/^## 0\.6\.2 - \d{4}-\d{2}-\d{2}$/m, '## Unreleased'));
  },
  'CHANGELOG.md: no heading "## 0.6.2 - <YYYY-MM-DD>" for the suite version'));

// The copy becomes a git repository with one commit, tagged as each named release.
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false', ...args],
  { cwd, encoding: 'utf8' });
const tagged = (d, ...tags) => {
  git(d, 'init', '-q', '-b', 'main');
  git(d, 'add', '-A');
  git(d, 'commit', '-q', '-m', 'release');
  for (const t of tags) git(d, 'tag', t);
};

test('lint passes on a tagged copy with no change since its tags', () => {
  const r = lint((d) => tagged(d, 'ccx--v0.6.2', 'ccx-loop--v0.6.2', 'repo-docs--v0.1.6'));
  assert.equal(r.status, 0, r.out);
});

test('lint rejects a change to a tagged plugin that keeps its version', () => fails(
  (d) => { tagged(d, 'ccx--v0.6.2'); appendFileSync(join(d, 'plugins/ccx/README.md'), 'More.\n'); },
  'plugins/ccx: changed since ccx--v0.6.2, so its version must be above 0.6.2; found 0.6.2'));

test('lint holds the codex ccx to the bridge tag', () => fails(
  (d) => { tagged(d, 'ccx--v0.6.2'); appendFileSync(join(d, 'plugins/ccx-codex/README.md'), 'More.\n'); },
  'plugins/ccx-codex: changed since ccx--v0.6.2, so its version must be above 0.6.2; found 0.6.2'));

test('lint compares a change with the highest tag by number', () => fails(
  (d) => { tagged(d, 'repo-docs--v0.1.9', 'repo-docs--v0.1.10'); appendFileSync(join(d, 'plugins/repo-docs/README.md'), 'More.\n'); },
  'plugins/repo-docs: changed since repo-docs--v0.1.10, so its version must be above 0.1.10; found 0.1.6'));

test('lint rejects a shallow clone, which may lack the tags', () => fails(
  (d) => { tagged(d); writeFileSync(join(d, '.git', 'shallow'), git(d, 'rev-parse', 'HEAD')); },
  'R49: this clone is shallow, so release tags may be missing'));

for (const [name, text, message] of [
  ['a hostless loop API command', '`gh api repos/x/y`', 'gh api command must pass --hostname'],
  ['a loop API span across lines', '`gh api\nrepos/x/y`', 'gh api span runs across lines'],
]) {
  test(`lint rejects ${name}`, () => fails(
    (d) => appendFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/ci-watch.md'), `${text}\n`),
    'plugins/ccx-loop/skills/ccx-loop/ci-watch.md:', message));
}

test('lint accepts explicit loop API hosts and ignores prose and fenced commands', () => {
  const r = lint((d) => appendFileSync(join(d, 'plugins/ccx-loop/skills/ccx-loop/ci-watch.md'),
    '`gh api --hostname <host> repos/x/y`\n`gh api repos/x/y --hostname=<host>`\n`gh api`\n```\n`gh api repos/x/y`\n```\n'));
  assert.equal(r.status, 0, r.out);
});

test('lint rejects a missing cca README test path in a backtick span', () => fails(
  (d) => {
    const p = join(d, 'plugins/cca/README.md');
    writeFileSync(p, readFileSync(p, 'utf8').replace('tests/cca/lint.sh', 'tests/cca/missing.sh'));
  },
  'missing test path tests/cca/missing.sh'));

test('lint rejects a missing cca README test path in a fenced block', () => fails(
  (d) => appendFileSync(join(d, 'plugins/cca/README.md'), '\n```sh\nsh tests/cca/missing.sh\n```\n'),
  'missing test path tests/cca/missing.sh'));

// The token is built from parts so that this file does not hold the name it checks for.
const RETIRED = ['forge', 'ops'].join('-');

test('lint rejects a tracked doc that names the retired source repository', () => fails(
  (d) => appendFileSync(join(d, 'docs/decisions.md'), `\nThe rules came from ${RETIRED.toUpperCase()}.\n`),
  'docs/decisions.md:', 'names the retired source repository'));

test('lint ignores the retired source repository named only under .scratch', () => {
  const r = lint((d) => {
    mkdirSync(join(d, '.scratch'));
    writeFileSync(join(d, '.scratch', 'note.md'), `${RETIRED}\n`);
  });
  assert.equal(r.status, 0, r.out);
});
