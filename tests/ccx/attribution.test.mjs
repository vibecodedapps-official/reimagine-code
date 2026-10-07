// The attribution hook: it denies a git commit or gh pr create/edit that carries a Claude attribution line while the
// user's settings turn attribution off. Runs the module under node itself, so it also runs on Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE = fileURLToPath(new URL('../../plugins/ccx/scripts/attribution.mjs', import.meta.url));
const TRAILER = 'Co-Authored-By: Claude <noreply@anthropic.com>';

// A temp tree with a user config dir and a project dir; user and project are their settings objects, files extra project files.
function scenario({ user, project, files = {} }, tool, command) {
  const root = mkdtempSync(join(tmpdir(), 'ccx-attr-'));
  try {
    const cfg = join(root, 'config');
    const proj = join(root, 'proj');
    mkdirSync(join(proj, '.claude'), { recursive: true });
    mkdirSync(cfg, { recursive: true });
    if (user) writeFileSync(join(cfg, 'settings.json'), JSON.stringify(user));
    if (project) writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify(project));
    for (const [name, text] of Object.entries(files)) writeFileSync(join(proj, name), text);
    const payload = typeof command === 'string'
      ? JSON.stringify({ tool_name: tool, tool_input: { command }, cwd: proj }) : command.raw;
    const r = spawnSync(process.execPath, [MODULE], {
      input: payload, encoding: 'utf8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: cfg, CLAUDE_PROJECT_DIR: proj },
    });
    return { status: r.status, out: r.stdout, err: r.stderr, userPath: join(cfg, 'settings.json') };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

const denial = (reason) => JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } });
const OFF = { attribution: { commit: '', pr: '' } };

test('a commit message with the Claude trailer is denied when attribution.commit is empty', () => {
  const r = scenario({ user: OFF }, 'Bash', `git commit -m "x" -m "${TRAILER}"`);
  assert.equal(r.status, 0);
  assert.equal(r.out.trim(), denial(`ccx: remove the Co-Authored-By line naming Claude; attribution.commit is "" in ${r.userPath}`));
});

test('a heredoc message with the trailer is denied', () => {
  const cmd = `git commit -F - <<'EOF'\nfix: x\n\n${TRAILER}\nEOF`;
  const r = scenario({ user: OFF }, 'Bash', cmd);
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a PowerShell here-string with the trailer is denied', () => {
  const cmd = `git commit -m @'\nfix: x\n\n${TRAILER}\n'@`;
  const r = scenario({ user: OFF }, 'PowerShell', cmd);
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a message file named after git options is read and denied', () => {
  const r = scenario({ user: OFF, files: { 'msg.txt': `fix: x\n\n${TRAILER}\n` } }, 'Bash', 'git -C repo -c user.name=x commit -Fmsg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a gh pr create body file with the Generated with line is denied when attribution.pr is empty', () => {
  const r = scenario({ user: OFF, files: { 'my body.md': 'Done.\n\nGenerated with Claude Code\n' } }, 'Bash', 'gh --repo o/r pr create --body-file "my body.md"');
  assert.equal(r.out.trim(), denial(`ccx: remove the Generated with Claude Code line; attribution.pr is "" in ${r.userPath}`));
});

test('nothing is denied when no settings file sets attribution', () => {
  const r = scenario({}, 'Bash', `git commit -m "${TRAILER}"`);
  assert.deepEqual([r.status, r.out, r.err], [0, '', '']);
});

test('a pull request is allowed when only attribution.commit is empty', () => {
  const r = scenario({ user: { attribution: { commit: '' } }, files: { 'b.md': 'Generated with Claude Code' } }, 'Bash', 'gh pr create --body-file b.md');
  assert.deepEqual([r.status, r.out], [0, '']);
});

test('a project setting overrides the user setting', () => {
  const r = scenario({ user: OFF, project: { attribution: { commit: 'x' } } }, 'Bash', `git commit -m "${TRAILER}"`);
  assert.deepEqual([r.status, r.out], [0, '']);
});

test('a Co-Authored-By trailer for another person named Claude is allowed', () => {
  const r = scenario({ user: OFF }, 'Bash', 'git commit -m "x" -m "Co-Authored-By: Claude Dupont <claude@example.com>"');
  assert.deepEqual([r.status, r.out], [0, '']);
});

test('git log with the trailer as a search string is allowed', () => {
  const r = scenario({ user: OFF }, 'Bash', `git log --grep "${TRAILER}"`);
  assert.deepEqual([r.status, r.out, r.err], [0, '', '']);
});

test('the legacy includeCoAuthoredBy false denies a commit when attribution.commit is unset', () => {
  const r = scenario({ user: { includeCoAuthoredBy: false } }, 'Bash', `git commit -m "${TRAILER}"`);
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('malformed stdin is allowed with no output', () => {
  const r = scenario({ user: OFF }, 'Bash', { raw: '{not json' });
  assert.deepEqual([r.status, r.out, r.err], [0, '', '']);
});
