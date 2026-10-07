// The attribution hook: it denies a git commit or gh pr create/edit that carries a Claude attribution line while the
// user's settings turn attribution off. Runs the module under node itself, so it also runs on Windows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MODULE = fileURLToPath(new URL('../../plugins/ccx/scripts/attribution.mjs', import.meta.url));
const TRAILER = 'Co-Authored-By: Claude <noreply@anthropic.com>';

// A temp tree with a user config dir, a home dir, and a project dir; user and project are their settings objects, files
// extra project files (a name starting with ~/ goes in the home dir), and command a string or a function of the project dir.
function scenario({ user, project, files = {} }, tool, command) {
  const root = mkdtempSync(join(tmpdir(), 'ccx-attr-'));
  try {
    const cfg = join(root, 'config');
    const home = join(root, 'home');
    const proj = join(root, 'proj');
    mkdirSync(join(proj, '.claude'), { recursive: true });
    mkdirSync(cfg, { recursive: true });
    mkdirSync(home);
    if (user) writeFileSync(join(cfg, 'settings.json'), JSON.stringify(user));
    if (project) writeFileSync(join(proj, '.claude', 'settings.json'), JSON.stringify(project));
    for (const [name, text] of Object.entries(files)) {
      const path = name.startsWith('~/') ? join(home, name.slice(2)) : join(proj, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
    const text = typeof command === 'function' ? command(proj) : command;
    const payload = typeof text === 'string'
      ? JSON.stringify({ tool_name: tool, tool_input: { command: text }, cwd: proj }) : command.raw;
    const r = spawnSync(process.execPath, [MODULE], {
      input: payload, encoding: 'utf8',
      env: { ...process.env, CLAUDE_CONFIG_DIR: cfg, CLAUDE_PROJECT_DIR: proj, HOME: home, USERPROFILE: home },
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
  const r = scenario({ user: OFF, files: { 'repo/msg.txt': `fix: x\n\n${TRAILER}\n` } }, 'Bash', 'git -C repo -c user.name=x commit -Fmsg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a gh pr create body file with the Generated with line is denied when attribution.pr is empty', () => {
  const r = scenario({ user: OFF, files: { 'my body.md': 'Done.\n\nGenerated with Claude Code\n' } }, 'Bash', 'gh --repo o/r pr create --body-file "my body.md"');
  assert.equal(r.out.trim(), denial(`ccx: remove the Generated with Claude Code line; attribution.pr is "" in ${r.userPath}`));
});

test('a pull request chained after a clean commit is still checked against attribution.pr', () => {
  const r = scenario({ user: { attribution: { pr: '' } } }, 'Bash', 'git commit -m clean && gh pr create --body "Generated with Claude Code"');
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

test('git options that take a separate value, --config-env and --attr-source, still mark a commit', () => {
  for (const opts of ['--config-env user.name=USERNAME', '--attr-source HEAD']) {
    const r = scenario({ user: OFF }, 'Bash', `git ${opts} commit -m "x" -m "${TRAILER}"`);
    assert.match(r.out, /"permissionDecision":"deny"/, opts);
  }
});

test('a message file after git -C is read from the -C directory', () => {
  const r = scenario({ user: OFF, files: { 'sub/msg.txt': `fix: x\n\n${TRAILER}\n` } }, 'Bash', 'git -C sub commit -F msg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a message file after git -C is not read from the call directory', () => {
  const files = { 'msg.txt': `fix: x\n\n${TRAILER}\n`, 'sub/msg.txt': 'fix: x\n' };
  const r = scenario({ user: OFF, files }, 'Bash', 'git -C sub commit -F msg.txt');
  assert.deepEqual([r.status, r.out], [0, '']);
});

test('a gh body file is read from the call directory even after a git -C commit', () => {
  const files = { 'body.md': 'Done.\n\nGenerated with Claude Code\n', 'sub/body.md': 'Done.\n' };
  const r = scenario({ user: OFF, files }, 'Bash', 'git -C sub commit -m "x" && gh pr create --body-file body.md');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

// The managed directory is redirected by a preload; the reason names the system path the hook resolved.
test('managed drop-ins merge after managed-settings.json in name order, skipping hidden files', () => {
  const root = mkdtempSync(join(tmpdir(), 'ccx-attr-managed-'));
  try {
    const managed = join(root, 'managed');
    mkdirSync(join(managed, 'managed-settings.d'), { recursive: true });
    mkdirSync(join(root, 'proj'));
    const run = () => spawnSync(process.execPath,
      ['--import', pathToFileURL(fileURLToPath(new URL('./fixtures/managed-dir.mjs', import.meta.url))).href, MODULE], {
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: `git commit -m "x" -m "${TRAILER}"` }, cwd: join(root, 'proj') }),
        encoding: 'utf8',
        env: { ...process.env, MANAGED_DIR: managed, CLAUDE_CONFIG_DIR: join(root, 'config'), CLAUDE_PROJECT_DIR: join(root, 'proj') },
      }).stdout;
    const reason = (file) => denial(`ccx: remove the Co-Authored-By line naming Claude; attribution.commit is "" in ${file}`);
    const base = { win32: 'C:\\Program Files\\ClaudeCode', darwin: '/Library/Application Support/ClaudeCode' }[process.platform] ?? '/etc/claude-code';
    const sep = process.platform === 'win32' ? '\\' : '/';
    writeFileSync(join(managed, 'managed-settings.json'), JSON.stringify(OFF));
    writeFileSync(join(managed, 'managed-settings.d', '.hidden.json'), JSON.stringify({ attribution: { commit: 'x' } }));
    assert.equal(run(), reason(`${base}${sep}managed-settings.json`));
    writeFileSync(join(managed, 'managed-settings.d', '10-a.json'), JSON.stringify({ attribution: { commit: 'x' } }));
    assert.equal(run(), '');
    writeFileSync(join(managed, 'managed-settings.d', '20-b.json'), JSON.stringify(OFF));
    assert.equal(run(), reason(`${base}${sep}managed-settings.d${sep}20-b.json`));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// A main checkout with a linked worktree: the session starts in the worktree, and the opt-out is in the main checkout's local file.
test('in a linked worktree the local settings file is read from the main checkout, except on Windows', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'ccx-attr-wt-')));
  try {
    const main = join(root, 'main');
    const wt = join(root, 'wt');
    const cfg = join(root, 'config');
    mkdirSync(main);
    mkdirSync(cfg);
    const git = (...args) => assert.equal(spawnSync('git', args, { cwd: main, encoding: 'utf8' }).status, 0, args.join(' '));
    git('init', '-q');
    git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-m', 'init');
    git('worktree', 'add', '-q', wt);
    mkdirSync(join(main, '.claude'));
    const local = join(main, '.claude', 'settings.local.json');
    writeFileSync(local, JSON.stringify(OFF));
    const r = spawnSync(process.execPath, [MODULE], {
      input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: `git commit -m "x" -m "${TRAILER}"` }, cwd: wt }),
      encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: cfg, CLAUDE_PROJECT_DIR: wt },
    });
    assert.equal(r.stdout, process.platform === 'win32' ? ''
      : denial(`ccx: remove the Co-Authored-By line naming Claude; attribution.commit is "" in ${local}`));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('a message file named by a Git Bash drive path is read on Windows', { skip: process.platform !== 'win32' }, () => {
  const toBash = (p) => `/${p[0].toLowerCase()}${p.slice(2).split('\\').join('/')}`;
  const r = scenario({ user: OFF, files: { 'msg.txt': `fix: x\n\n${TRAILER}\n` } }, 'Bash', (proj) => `git commit -F ${toBash(join(proj, 'msg.txt'))}`);
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a message file under /tmp in a Bash call is read, which Git Bash maps to the temp directory on Windows', () => {
  const name = `ccx-attr-${process.pid}-${Date.now()}.txt`;
  const path = process.platform === 'win32' ? join(tmpdir(), name) : join('/tmp', name);
  writeFileSync(path, `fix: x\n\n${TRAILER}\n`);
  try {
    const r = scenario({ user: OFF }, 'Bash', `git commit -F /tmp/${name}`);
    assert.match(r.out, /"permissionDecision":"deny"/);
  } finally { rmSync(path, { force: true }); }
});

test('a message file under ~/ in a Bash call is read from the home directory', () => {
  const r = scenario({ user: OFF, files: { '~/msg.txt': `fix: x\n\n${TRAILER}\n` } }, 'Bash', 'git commit -F ~/msg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a quoted bare git.exe called with & in PowerShell is a commit', () => {
  const r = scenario({ user: OFF }, 'PowerShell', `& "git.exe" commit -m "${TRAILER}"`);
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a -C inside a quoted -c value does not move where the message file is read', () => {
  const files = { 'b/msg.txt': `fix: x\n\n${TRAILER}\n` };
  const r = scenario({ user: OFF, files }, 'Bash', 'git -c "core.editor=code -C missing" -C b commit -F msg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('each commit in a call reads its message file from its own -C directory', () => {
  const files = { 'b/msg.txt': `fix: x\n\n${TRAILER}\n`, 'a/.keep': '' };
  const r = scenario({ user: OFF, files }, 'Bash', 'git -C a commit -m clean && git -C b commit -F msg.txt');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a trailer naming only Claude is denied when an option follows the message', () => {
  const r = scenario({ user: OFF }, 'Bash', 'git commit -m "Co-Authored-By: Claude" --allow-empty');
  assert.match(r.out, /"permissionDecision":"deny"/);
});

test('a trailer naming someone whose name starts with Claude is allowed when an option follows the message', () => {
  const r = scenario({ user: OFF }, 'Bash', 'git commit -m "Co-Authored-By: Claudette" --allow-empty');
  assert.deepEqual([r.status, r.out], [0, '']);
});
