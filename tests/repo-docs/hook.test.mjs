import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const hook = fileURLToPath(new URL('../../plugins/repo-docs/hooks/pre-commit.sh', import.meta.url));
const reminder = '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"repo-docs: this command commits, and the commit goes ahead. Unless you already ran the repo-docs audit on these changes, run it once the commit finishes and report what it finds; fix errors in a follow-up change."}}\n';
const skip = process.platform === 'win32' && spawnSync('sh', ['-c', 'exit 0']).error && 'sh is not on PATH';
function repository(t) {
  const root = mkdtempSync(join(tmpdir(), 'repo-docs-hook-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q', root]);
  mkdirSync(join(root, 'nested'));
  writeFileSync(join(root, 'AGENTS.md'), 'Instructions\n');
  execFileSync('git', ['add', 'AGENTS.md'], { cwd: root });
  return root;
}
function run(cwd, input, env = {}) {
  const result = spawnSync('sh', [hook], { cwd, input, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  return result.stdout;
}
test('A1-U5-1: commit from a subdirectory uses the work-tree index with literal pathspecs', { skip }, (t) => {
  const root = repository(t);
  assert.equal(run(join(root, 'nested'), '{"tool_input":{"command":"git commit"}}', { GIT_LITERAL_PATHSPECS: '1' }), reminder);
});
const commits = [
  ['git commit', '{"tool_input":{"command":"git commit"}}'],
  ['git -C dir commit', '{"tool_input":{"command":"git -C dir commit"}}'],
  ['git -C "my dir" commit', '{"tool_input":{"command":"git -C \\"my dir\\" commit"}}'],
  ['PowerShell quoted path', '{"tool_input":{"command":"git -C \'C:\\\\my dir\' commit"}}'],
  ['git -c k=v commit', '{"tool_input":{"command":"git -c k=v commit"}}'],
  ['git directory options', '{"tool_input":{"command":"git --git-dir=x --work-tree=y commit"}}'],
  ['git --no-pager commit', '{"tool_input":{"command":"git --no-pager commit"}}'],
  ['assignment prefix', '{"tool_input":{"command":"NAME=v git commit"}}'],
  ['env prefix', '{"tool_input":{"command":"env NAME=v git commit"}}'],
  ['sudo prefix', '{"tool_input":{"command":"sudo git commit"}}'],
  ['subshell', '{"tool_input":{"command":"(git commit)"}}'],
  ['bash -c', '{"tool_input":{"command":"bash -c \'git commit\'"}}'],
  ['and separator', '{"tool_input":{"command":"cd x && git commit"}}'],
  ['semicolon separator', '{"tool_input":{"command":"cd x; git commit"}}'],
  ['PowerShell call operator', '{"tool_input":{"command":"& git commit"}}'],
  ['PowerShell location', '{"tool_input":{"command":"Set-Location x; git commit"}}'],
  ['git.exe commit', '{"tool_input":{"command":"git.exe commit"}}'],
  ['escaped newline', '{"tool_input":{"command":"git status\\ngit commit"}}'],
];
for (const [name, input] of commits) test(`A1-U5-2: reminds for ${name}`, { skip }, (t) => {
  assert.equal(run(repository(t), input), reminder);
});
for (const command of ['git -c user.name="Joe User" commit', 'git -C "O\'Brien" commit']) {
  test(`A2-U5-1: reminds for ${command}`, { skip }, (t) => {
    assert.equal(run(repository(t), JSON.stringify({ tool_input: { command } })), reminder);
  });
}
for (const command of ['git -C C:\\tools\\repo commit', 'git -C C:\\new commit']) {
  test(`O2-U5-1: reminds for ${command}`, { skip }, (t) => {
    assert.equal(run(repository(t), JSON.stringify({ tool_input: { command } })), reminder);
  });
}
const others = [
  ['git log --grep commit', '{"tool_input":{"command":"git log --grep commit"}}'],
  ['echo git commit', '{"tool_input":{"command":"echo git commit"}}'],
  ['PR body', '{"tool_input":{"command":"gh pr create --body \\"run git commit later\\""}}'],
  ['git status', '{"tool_input":{"command":"git status"}}'],
  ['description', '{"tool_input":{"command":"ls","description":"git commit"}}'],
];
for (const [name, input] of others) test(`A1-U5-2: stays quiet for ${name}`, { skip }, (t) => {
  assert.equal(run(repository(t), input), '');
});
