// The entry script run end to end against a fake Codex that records what it was given. Git is real, in scratch repos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, symlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ASK, ASK_RESUME, FAKE, ID, ID2, RESUME, RESUME2, SANDBOX, SCRIPT, THREAD, THREAD2,
  alive, calls, cli, dead, git, pids, probeLeftovers, requestLeft, run, savedThread, spawning, stdin, threadFile, withScratch,
} from './fixtures/harness.mjs';

test('ask: the recorded argv and stdin match, and a good run renders the answer', spawning, withScratch((s) => {
  const request = 'say "hi" `x` $(id) \\ back\n--dangerously-leading-hyphen\n';
  const r = run(s, 'ask', { request });
  assert.deepEqual(calls(s), [ASK]);
  assert.equal(stdin(s), request);
  assert.equal(r.stdout, 'requested: codex exec --json --ignore-user-config -c approval_policy="never" -c sandbox_mode="read-only" -\n' +
    `cwd: ${s.repo}\nnetwork: none in the read-only sandbox; Codex cannot fetch issues, pull requests or pages\n\nfake answer\n\n` +
    `thread ${THREAD}\n${RESUME}\nstatus: ok\n`);
  assert.equal(r.status, 0);
  assert.equal(requestLeft(s), false);
}));

test('ask with a leading --model passes it to Codex and sends only the question', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: '--model gpt-5 critique this plan\n' });
  assert.deepEqual(calls(s), [[...ASK.slice(0, -1), '--model', 'gpt-5', '-']]);
  assert.equal(stdin(s), 'critique this plan\n');
  assert.equal(r.status, 0);
}));

test('ask with a model and no question is refused before Codex starts', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: '--model gpt-5\n' });
  assert.equal(r.stdout, 'ccx: the request is empty; nothing was sent to Codex\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

const NOTE = 'Use ccx for Codex requests: ask for questions, plan critiques, and second opinions; review only for working-tree or ' +
  'base-ref diffs. Put options before the question, in any order: an explicit model choice as --model <name>, and for a follow-up in ' +
  'the same Codex thread, --resume <thread id>, or a bare --resume followed by a line break or another option; the follow-up then needs ' +
  'only the new question. A skill that delegates implementation to Codex uses implement; for a plain request to change files, direct the user to ' +
  '/ccx:do <task>; for setup checks, /ccx:setup. Do not invoke Codex directly.\n';
const hook = (input, ...args) => {
  const r = spawnSync(process.execPath, [SCRIPT, 'hook', ...args], { input, encoding: 'utf8', timeout: 10_000 });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
};

test('hook: a prompt that mentions Codex, in any case, gets the routing note', () => {
  for (const prompt of ['review it with codex astra', 'Ask CODEX why']) {
    const r = hook(JSON.stringify({ prompt }));
    assert.deepEqual([r.stdout, r.status], [NOTE, 0], prompt);
  }
});

test('hook: a prompt that does not mention Codex gets nothing', () => {
  const r = hook(JSON.stringify({ prompt: 'draft a plan' }));
  assert.deepEqual([r.stdout, r.status], ['', 0]);
});

test('hook: a prompt deletes this session\'s leftover request file and no other session\'s', withScratch((s) => {
  for (const id of [ID, ID2]) writeFileSync(join(s.data, `request-${id}.txt`), 'an earlier task');
  const r = hook(JSON.stringify({ session_id: ID, prompt: 'draft a plan' }), s.data);
  assert.deepEqual([r.stdout, r.status], ['', 0]);
  assert.equal(requestLeft(s), false);
  assert.equal(existsSync(join(s.data, `request-${ID2}.txt`)), true);
}));

test('do after a prompt, with no request written, is refused rather than sending an earlier stopped run\'s task', spawning, withScratch((s) => {
  writeFileSync(join(s.data, `request-${ID}.txt`), 'Create LEFTOVER.txt');
  hook(JSON.stringify({ session_id: ID, prompt: '/ccx:do Create NEW.txt' }), s.data);
  const r = run(s, 'do');
  assert.equal(r.stdout, `ccx: no request file at ${join(s.data, `request-${ID}.txt`)}; run the command again\nstatus: refused\n`);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

test('hook: a typed /ccx: command gets nothing', () => {
  const r = hook(JSON.stringify({ prompt: ' /ccx:do Report the current directory; ask codex nothing' }));
  assert.deepEqual([r.stdout, r.status], ['', 0]);
});

test('hook: a typed slash command of another plugin that mentions Codex gets nothing', () => {
  const r = hook(JSON.stringify({ prompt: '/other:cmd mentions codex' }));
  assert.deepEqual([r.stdout, r.status], ['', 0]);
});

test('hook: a prompt that starts with an absolute path, not a command, still gets the note', () => {
  for (const prompt of ['/Users/joe/app/build.log fails on line 40, ask codex what it means', '/tmp/x.txt: codex?', '/ codex']) {
    const r = hook(JSON.stringify({ prompt }));
    assert.deepEqual([r.stdout, r.status], [NOTE, 0], prompt);
  }
});

test('hook: a prompt with a leading space and no slash still gets the note', () => {
  const r = hook(JSON.stringify({ prompt: ' codex please' }));
  assert.deepEqual([r.stdout, r.status], [NOTE, 0]);
});

test('hook: missing or malformed input prints nothing and exits 0', () => {
  for (const input of [undefined, '', 'codex', 'null', '{"prompt":42}']) {
    const r = hook(input);
    assert.deepEqual([r.stdout, r.stderr, r.status], ['', '', 0], String(input));
  }
});

test('the same complete stream followed by exit 1 is a failure that prints Codex stderr', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'exit1' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /\n\nccx: the run failed: codex exited with status 1\nfake failure on stderr\n\n/);
  assert.doesNotMatch(r.stdout, /fake answer/);
  assert.match(r.stdout, /\nthread \S+\nResume: .*\nstatus: failed\n$/);
}));

test('a message with no turn.completed and exit 0 is a failure', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'no-turn' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: no turn.completed event arrived\n/);
  assert.match(r.stdout, /\nstatus: failed\n$/);
}));

test('turn.completed with no agent_message and exit 0 is a failure', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'no-message' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: no final message arrived\n/);
  assert.match(r.stdout, /\nstatus: failed\n$/);
}));

test('a child that exits on stderr before reading a 1 MB stdin is a failure, with no resume line and no request left', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'x'.repeat(1 << 20), env: { FAKE_CODEX: 'stderr-early' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: codex exited with status 1; no turn.completed event arrived; no final message arrived\n/);
  assert.match(r.stdout, /\nNot inside a trusted directory and --skip-git-repo-check was not specified.\n/);
  assert.doesNotMatch(r.stdout, /Resume:|thread /);
  assert.equal(requestLeft(s), false);
}));

test('a 1 MB request against a child that writes 1 MB before reading does not deadlock', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'y'.repeat(1 << 20), env: { FAKE_CODEX: 'floods-stdout', CCX_TIMEOUT_MS: '20000' } });
  assert.equal(r.status, 0);
  assert.equal(stdin(s).length, 1048576);
  assert.match(r.stdout, /\n\nfake answer\n\n/);
}));

const refusesDo = (setup, pattern) => withScratch((s) => {
  const env = setup(s);
  const r = run(s, 'do', { request: 'go', env });
  assert.match(r.stdout, pattern);
  assert.equal(r.status, 1);
  assert.equal(calls(s).some((c) => c[0] === 'exec'), false);
  assert.deepEqual(probeLeftovers(s), [false, []]);
});

test('do refuses when the probe target cannot be written without a sandbox', spawning, refusesDo(
  (s) => ({ CCX_PROBE_TARGET: join(s.root, 'missing', 'probe') }),
  /^ccx: do was not run: reachability check failed: .*\(ENOENT\)/));

test('do refuses when a sandboxed write inside the working directory fails', spawning, refusesDo(
  () => ({ FAKE_CODEX: 'sandbox-broken' }), /^ccx: do was not run: positive control failed: .* gave exit 71, file not created;/));

test('do refuses when a sandboxed write outside the workspace lands', spawning, refusesDo(
  () => ({ FAKE_CODEX: 'sandbox-open' }), /^ccx: do was not run: negative control failed: .* gave exit 0, file created;/));

test('do refuses from the home directory, saying the probe target is unusable rather than blaming the host', spawning, refusesDo(
  (s) => ({ HOME: s.repo }), /^ccx: do was not run: the probe target .* is inside this working directory .* This says nothing about whether the host can sandbox\nstatus: refused\n$/));

test('setup: version, login and both probe rows, and the printed allow rule', spawning, withScratch((s) => {
  const r = cli(s, ['setup', s.data], { cwd: s.plain });
  const [version, login, positive, negative] = calls(s);
  assert.deepEqual(version, ['--version']);
  assert.deepEqual(login, ['login', 'status']);
  assert.deepEqual(positive.slice(0, -1), SANDBOX);
  assert.equal(positive.at(-1).startsWith(`${s.plain}/.ccx-probe-`), true);
  assert.deepEqual(negative, [...SANDBOX, s.target]);
  assert.equal(r.stdout, 'codex: codex-cli 0.155.1\nlogin: Logged in using ChatGPT\n' +
    'sandbox: workspace-write proven: an inside write landed and an outside write was denied (EPERM)\n\n' +
    'Allow rule for this plugin, as a JSON string. setup does not add it; to use it, paste it into the permissions.allow array in your Claude Code settings:\n' +
    `  "Bash(node \\"${dirname(dirname(SCRIPT))}/scripts/ccx.mjs\\" *)"\n` +
    'It names the installed version\'s path, so it changes with every release.\n');
  assert.equal(r.status, 0);
  assert.deepEqual(readdirSync(s.plain), []);
}));

test('setup waits for a probe control past the local limit, as Codex can need in a new Codex home', spawning, withScratch((s) => {
  const r = cli(s, ['setup', s.data], { cwd: s.plain, env: { FAKE_CODEX: 'sandbox-slow', CCX_TIMEOUT_MS: '1500' } });
  assert.match(r.stdout, /\nsandbox: workspace-write proven: an inside write landed and an outside write was denied \(EPERM\)\n/);
}));

test('by default each run probes its own file in the home directory', spawning, withScratch((s) => {
  const home = join(s.root, 'outside');
  cli(s, ['setup', s.data], { cwd: s.plain, env: { HOME: home, CCX_PROBE_TARGET: '' } });
  assert.match(calls(s)[3].at(-1), new RegExp(`^${home}/\\.ccx-sandbox-probe-\\d+$`));
}));

test('setup prints the Bash rule for the script path as invoked, even through a symlinked plugin root', spawning, withScratch((s) => {
  const link = join(s.root, 'plugin-link');
  symlinkSync(dirname(dirname(SCRIPT)), link);
  const r = spawnSync(process.execPath, [join(link, 'scripts', 'ccx.mjs'), 'setup', s.data],
    { cwd: s.plain, encoding: 'utf8', env: { ...process.env, CCX_CODEX_BIN: FAKE, CCX_PROBE_TARGET: s.target } });
  assert.match(r.stdout, new RegExp(`\\n  "Bash\\(node \\\\"${link}/scripts/ccx\\.mjs\\\\" \\*\\)"\\n`));
}));

test('setup from the home directory reports the toolchain and says the probe target is unusable from here', spawning, withScratch((s) => {
  const r = cli(s, ['setup', s.data], { cwd: s.plain, env: { HOME: s.plain } });
  assert.match(r.stdout, /^codex: codex-cli 0.155.1\nlogin: Logged in using ChatGPT\nsandbox: the probe target .* cannot be tested from here;/);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), [['--version'], ['login', 'status']]);
}));

test('setup: a --version that ignores SIGINT and SIGTERM gives a refusal naming it within 10 s of the deadline', spawning, withScratch((s) => {
  const r = cli(s, ['setup', s.data], { cwd: s.plain, env: { FAKE_CODEX: 'version-ignores-signals', CCX_TIMEOUT_MS: '500' } });
  assert.match(r.stdout, /^codex: ccx: codex --version did not finish within 0.5 s and was stopped\nlogin: Logged in/);
  assert.equal(r.status, 1);
  assert.equal(r.ms < 10_500, true, `${r.ms} ms`);
  assert.equal(alive(pids(s)[0]), false);
}));

test('a run past its deadline has its whole process group killed, grandchild included', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'hang', CCX_TIMEOUT_MS: '1000' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /\n\nccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(await dead(pids(s)[0]), true);
}));

const processGroupCheck = spawnSync('ps', ['-o', 'ppid=', '-p', String(process.pid)]).error;
for (const [command, mode] of [['ask', 'hang'], ['ask', 'ignores-signals'], ['do', 'hang']]) for (const signal of ['SIGINT', 'SIGTERM']) test(`${command} ${mode} interrupted by ${signal} stops Codex and reports failure`,
  { ...spawning, skip: spawning.skip || (command === 'ask' && mode === 'hang' && processGroupCheck && `process-group pid lookup unavailable: ${processGroupCheck.code}`) }, withScratch(async (s) => {
  writeFileSync(join(s.data, `request-${ID}.txt`), 'q');
  const bridge = spawn(process.execPath, [SCRIPT, command, s.data, ID], {
    cwd: s.repo, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CCX_CODEX_BIN: FAKE, CCX_PROBE_TARGET: s.target, CCX_TIMEOUT_MS: '1000', FAKE_CODEX: mode, FAKE_CODEX_PIDS: join(s.root, 'pids') },
  });
  let stdout = '';
  bridge.stdout.on('data', (b) => { stdout += b; });
  const ended = new Promise((resolve, reject) => { bridge.on('error', reject); bridge.on('exit', (code, sig) => resolve({ code, sig })); });
  const closed = new Promise((resolve) => bridge.on('close', resolve));
  const deadline = setTimeout(() => bridge.kill('SIGKILL'), 15_000);
  let codexPid;
  try {
    for (let i = 0; i < 100 && !existsSync(join(s.root, 'pids')); i++) await new Promise((r) => setTimeout(r, 50));
    assert.equal(existsSync(join(s.root, 'pids')), true, 'Codex fixture started');
    const childPid = pids(s)[0];
    if (mode === 'hang' && command === 'ask') {
      const parent = spawnSync('ps', ['-o', 'ppid=', '-p', String(childPid)], { encoding: 'utf8' });
      assert.equal(parent.status, 0, 'read Codex pid from its recorded child');
      codexPid = Number(parent.stdout.trim());
    } else if (mode !== 'hang') codexPid = childPid;
    assert.equal(bridge.kill(signal), true);
    const result = await ended;
    if (codexPid) assert.equal(await dead(codexPid), true, 'Codex process stopped');
    if (mode === 'hang') assert.equal(await dead(childPid), true, 'Codex child stopped');
    await closed;
    assert.equal(result.code, 1);
    assert.equal(result.sig, null);
    assert.match(stdout, /\nstatus: failed\n$/);
    assert.doesNotMatch(stdout, /timed out|status: timeout/);
    if (command === 'do') assert.match(stdout, /\nworking tree after the run: clean, nothing untracked or ignored\n/);
  } finally {
    clearTimeout(deadline);
    bridge.kill('SIGKILL');
    if (codexPid) try { process.kill(-codexPid, 'SIGKILL'); } catch {}
    if (existsSync(join(s.root, 'pids'))) for (const pid of pids(s)) try { process.kill(pid, 'SIGKILL'); } catch {}
    bridge.stdout.destroy(); bridge.stderr.destroy();
    await ended;
  }
}));

test('review interrupted during pre-turn git starts no Codex and refuses', spawning, withScratch(async (s) => {
  const monitor = join(s.root, 'fsmonitor');
  const marker = join(s.root, 'git-started');
  writeFileSync(monitor, `#!${process.execPath}\nimport { writeFileSync } from 'node:fs';\nwriteFileSync(${JSON.stringify(marker)}, 'started');\nsetTimeout(() => {}, 30000);\n`, { mode: 0o755 });
  git(s.repo, 'config', 'core.fsmonitor', monitor);
  writeFileSync(join(s.repo, 'tracked.txt'), 'two\n');
  writeFileSync(join(s.data, `request-${ID}.txt`), '--base HEAD');
  const bridge = spawn(process.execPath, [SCRIPT, 'review', s.data, ID], {
    cwd: s.repo, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CCX_CODEX_BIN: FAKE, FAKE_CODEX: '', FAKE_CODEX_ARGV: join(s.root, 'argv.jsonl') },
  });
  let stdout = '';
  bridge.stdout.on('data', (b) => { stdout += b; });
  const ended = new Promise((resolve, reject) => { bridge.on('error', reject); bridge.on('close', (code) => resolve(code)); });
  const deadline = setTimeout(() => bridge.kill('SIGKILL'), 15000);
  try {
    for (let i = 0; i < 100 && !existsSync(marker); i++) await new Promise((r) => setTimeout(r, 50));
    assert.equal(existsSync(marker), true, 'pre-turn git reached fsmonitor');
    assert.equal(bridge.kill('SIGTERM'), true);
    const code = await ended;
    assert.deepEqual(calls(s), [], 'interrupted pre-turn git must not start Codex');
    assert.match(stdout, /\nstatus: refused\n$/);
    assert.equal(code, 1);
  } finally {
    clearTimeout(deadline);
    bridge.kill('SIGKILL');
    bridge.stdout.destroy(); bridge.stderr.destroy();
    await ended;
  }
}));

test('ask --timeout 1 with no environment override ends the turn after 1 s, and the flag does not reach Codex', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: '--timeout 1 q', env: { FAKE_CODEX: 'hang' } });
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), [ASK]);
  assert.equal(r.stdout.split('\n')[0], 'requested: codex exec --json --ignore-user-config -c approval_policy="never" -c sandbox_mode="read-only" -');
  assert.match(r.stdout, /\n\nccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('implement --timeout 1 ends the turn after 1 s as status: timeout, and the flag does not reach Codex', spawning, withScratch(async (s) => {
  const r = run(s, 'implement', { request: '--timeout 1\nslow task', env: { FAKE_CODEX: 'hang' } });
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s).at(-1), ['exec', '--json', '--ignore-user-config', '-c', 'approval_policy="never"', '-c', 'sandbox_mode="workspace-write"', '-']);
  assert.match(r.stdout, /\n\nccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(await dead(pids(s).at(-1)), true);
}));

test('implement with --cwd outside a repository is refused with Codex never started', spawning, withScratch((s) => {
  const r = run(s, 'implement', { request: `--cwd ${s.plain}\ngo` });
  assert.match(r.stdout, /^ccx: not inside a git repository, so nothing was run \(fatal: not a git repository/);
  assert.match(r.stdout, /\nstatus: refused\n$/);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

test('implement with a relative --cwd, a repeated option or an empty task is refused before Codex starts', spawning, withScratch((s) => {
  const refused = (request) => run(s, 'implement', { request }).stdout;
  assert.equal(refused('--cwd rel\ngo'), 'ccx: implement arguments refused: --cwd "rel" is empty or not an absolute path; refused\nstatus: refused\n');
  assert.equal(refused('--timeout 5 --timeout 6\ngo'), 'ccx: implement arguments refused: --timeout given more than once; refused\nstatus: refused\n');
  assert.equal(refused(`--cwd ${s.repo}\n`), 'ccx: the request is empty; nothing was sent to Codex\nstatus: refused\n');
  assert.deepEqual(calls(s), []);
}));

test('review --timeout 1 with no environment override ends the turn after 1 s, and the flag does not reach Codex', spawning, withScratch(async (s) => {
  writeFileSync(join(s.repo, 'tracked.txt'), 'two\n');
  const r = run(s, 'review', { request: '--timeout 1', env: { FAKE_CODEX: 'hang' } });
  assert.equal(r.status, 1);
  assert.equal(r.stdout.split('\n')[0],
    'requested: codex exec review --json --ignore-user-config -c approval_policy="never" -c sandbox_mode="read-only" --uncommitted');
  assert.match(r.stdout, /\n\nccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('ask --timeout 5 against a fast Codex succeeds', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: '--timeout 5 q' });
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(calls(s), [ASK]);
  assert.equal(stdin(s), 'q');
  assert.match(r.stdout, /\n\nfake answer\n\n.*\nstatus: ok\n$/s);
}));

test('ask --timeout wins over CCX_TIMEOUT_MS for the turn', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: '--timeout 1 q', env: { FAKE_CODEX: 'hang', CCX_TIMEOUT_MS: '20000' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /\n\nccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(r.ms < 15_000, true, `${r.ms} ms`);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('a child that ignores SIGINT and SIGTERM is killed by the escalation, within 10 s of the deadline', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'ignores-signals', CCX_TIMEOUT_MS: '1000' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.equal(r.ms < 11_000, true, `${r.ms} ms`);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('a timed-out run whose own child ignores SIGINT and SIGTERM has that child killed too', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'hang-stubborn-child', CCX_TIMEOUT_MS: '1000' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('a timed-out run stops a command Codex runs in its own process group, so it writes nothing after the result', spawning, withScratch(async (s) => {
  const late = join(s.root, 'late.txt');
  const r = run(s, 'implement', { request: '--timeout 1\nslow task', env: { FAKE_CODEX: 'hang-detached-command', FAKE_CODEX_LATE: late } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: timed out after 1 s; its process group was stopped\n/);
  assert.match(r.stdout, /\nstatus: timeout\n$/);
  assert.equal(await dead(pids(s)[0]), true);
  await new Promise((done) => setTimeout(done, 1000));
  assert.equal(existsSync(late), false);
}));

test('a background process left by a successful run is stopped before the result is printed', spawning, withScratch(async (s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'leaves-stubborn-child' } });
  assert.equal(r.status, 0, r.stdout);
  assert.equal(await dead(pids(s)[0]), true);
}));

test('an error Codex reports only in the JSON stream is printed with the failure', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'turn-failed' } });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /\n\nccx: the run failed: codex exited with status 1; no turn.completed event arrived; no final message arrived; codex reported: usage limit reached\n/);
}));

test('a child that exits 0 while its own child holds stdout renders within the drain bound', spawning, withScratch(async (s) => {
  try {
    const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'holds-stdout' } });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /\n\nfake answer\n\n/);
    assert.equal(r.ms < 6000, true, `${r.ms} ms`);
  } finally { for (const pid of pids(s)) try { process.kill(pid, 'SIGKILL'); } catch {} }
}));

test('a child that exits 0 just before the deadline, while its own child holds stdout, is not a timeout', spawning, withScratch(async (s) => {
  try {
    const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'holds-stdout', CCX_TIMEOUT_MS: '1000' } });
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /\n\nfake answer\n\n/);
  } finally { for (const pid of pids(s)) try { process.kill(pid, 'SIGKILL'); } catch {} }
}));

test('a Codex that cannot be started is a failure for ask and a refusal naming the command for setup', spawning, withScratch((s) => {
  const env = { CCX_CODEX_BIN: join(s.root, 'no-such-codex') };
  const r = run(s, 'ask', { request: 'q', env });
  assert.match(r.stdout, /\n\nccx: the run failed: could not start codex: spawn \S+no-such-codex ENOENT\n\nstatus: failed\n$/);
  assert.equal(r.status, 1);
  assert.equal(requestLeft(s), false);
  const d = run(s, 'do', { request: 'go', env });
  assert.match(d.stdout, /^ccx: do was not run: could not start codex sandbox \(positive control\): spawn \S+no-such-codex ENOENT\nstatus: refused\n$/);
  assert.equal(d.status, 1);
  const setup = cli(s, ['setup', s.data], { cwd: s.plain, env });
  assert.match(setup.stdout, /^codex: ccx: could not start codex --version: spawn \S+no-such-codex ENOENT\nlogin: ccx: could not start codex login status: /);
  assert.equal(setup.status, 1);
}));

test('setup, the hook and an unknown command print no status line', spawning, withScratch((s) => {
  const setup = cli(s, ['setup', s.data], { cwd: s.plain });
  assert.equal(setup.status, 0, setup.stdout);
  assert.doesNotMatch(setup.stdout, /status:/);
  assert.equal(hook(JSON.stringify({ prompt: 'ask codex' })).stdout, NOTE);
  const unknown = cli(s, ['nope', s.data, ID]);
  assert.equal(unknown.stdout, 'ccx: unknown command "nope"; expected review, ask, do, implement or setup\n');
  assert.equal(unknown.status, 1);
}));

test('a session id carrying a command substitution is refused with nothing opened', spawning, withScratch((s) => {
  const planted = join(s.data, 'request-$(id)aaaa.txt');
  writeFileSync(planted, 'q');
  const r = cli(s, ['ask', s.data, '$(id)aaaa']);
  assert.equal(r.stdout, 'ccx: the session id is missing or malformed, so no request file was opened\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.equal(existsSync(planted), true);
  assert.deepEqual(calls(s), []);
}));

test('an unexpected error before the turn ends with status: failed, not refused', spawning, withScratch((s) => {
  mkdirSync(join(s.data, `request-${ID}.txt`));
  const r = run(s, 'ask');
  assert.match(r.stdout, /^ccx: unexpected error: .*\nstatus: failed\n$/s);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

test('a relative data directory is refused', spawning, withScratch((s) => {
  const r = cli(s, ['ask', 'data', ID]);
  assert.equal(r.stdout, 'ccx: the plugin data directory must be an absolute path, not "data"\nstatus: refused\n');
  assert.equal(r.status, 1);
}));

test('a request file older than ten minutes is refused and deleted', spawning, withScratch((s) => {
  writeFileSync(join(s.data, `request-${ID}.txt`), 'q');
  const old = new Date(Date.now() - 11 * 60_000);
  utimesSync(join(s.data, `request-${ID}.txt`), old, old);
  const r = run(s, 'ask');
  assert.equal(r.stdout, 'ccx: the request file is 11 minutes old, so it was treated as abandoned and deleted; run the command again\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.equal(requestLeft(s), false);
  assert.deepEqual(calls(s), []);
}));

test('a missing request file is refused, for review as well as ask', spawning, withScratch((s) => {
  for (const command of ['ask', 'review']) {
    const r = run(s, command);
    assert.equal(r.stdout, `ccx: no request file at ${join(s.data, `request-${ID}.txt`)}; run the command again\nstatus: refused\n`);
    assert.equal(r.status, 1);
  }
  assert.deepEqual(calls(s), []);
}));

test('a whitespace-only request is refused and deleted', spawning, withScratch((s) => {
  const r = run(s, 'do', { request: ' \n\t\n', cwd: s.plain });
  assert.equal(r.stdout, 'ccx: the request is empty; nothing was sent to Codex\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.equal(requestLeft(s), false);
  assert.deepEqual(calls(s), []);
}));

// --resume: exec resume argv, the saved-thread file, and the refusals around it.

test('an explicit --resume id builds the literal resume argv, sends only the question, and its thread becomes the saved one',
  spawning, withScratch((s) => {
    const r = run(s, 'ask', { request: `--resume ${THREAD2} what about the second objection\n` });
    assert.deepEqual(calls(s), [ASK_RESUME(THREAD2)]);
    assert.equal(stdin(s), 'what about the second objection\n');
    assert.equal(r.stdout, `requested: codex exec resume ${THREAD2} --json --ignore-user-config -c approval_policy="never" -c sandbox_mode="read-only" -\n` +
      `cwd: ${s.repo}\nnetwork: none in the read-only sandbox; Codex cannot fetch issues, pull requests or pages\n\nfake answer\n\n` +
      `thread ${THREAD2}\n${RESUME2}\nstatus: ok\n`);
    assert.equal(r.status, 0);
    assert.equal(requestLeft(s), false);
    assert.equal(savedThread(s), `${THREAD2}\n`);
  }));

test('a bare --resume after a prior successful ask in the same session resumes the saved thread', spawning, withScratch((s) => {
  const first = run(s, 'ask', { request: 'the first question\n' });
  assert.equal(first.status, 0, first.stdout);
  const second = run(s, 'ask', { request: '--resume\nthe follow-up question\n' });
  assert.equal(second.status, 0, second.stdout);
  assert.deepEqual(calls(s), [ASK, ASK_RESUME(THREAD)]);
  assert.equal(stdin(s), 'the follow-up question\n');
}));

test('a bare --resume with trailing whitespace on its line still resumes the saved thread', spawning, withScratch((s) => {
  const first = run(s, 'ask', { request: 'the first question\n' });
  assert.equal(first.status, 0, first.stdout);
  const second = run(s, 'ask', { request: '--resume \nthe follow-up question\n' });
  assert.equal(second.status, 0, second.stdout);
  assert.deepEqual(calls(s), [ASK, ASK_RESUME(THREAD)]);
  assert.equal(stdin(s), 'the follow-up question\n');
}));

test('a bare --resume with no saved thread id is refused before Codex starts, and the request file is deleted', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: '--resume\nthe follow-up question\n' });
  assert.equal(r.stdout, 'ccx: ask arguments refused: --resume with no id, and no earlier Codex thread is saved for this Claude ' +
    'session; pass --resume <thread id>\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
  assert.equal(requestLeft(s), false);
}));

test('a malformed --resume id is refused before Codex starts', spawning, withScratch((s) => {
  const r = run(s, 'ask', { request: '--resume bad;id q' });
  assert.equal(r.stdout, 'ccx: ask arguments refused: --resume id "bad;id" is malformed; refused\nstatus: refused\n');
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

test('--resume <id> together with --model reaches Codex as both flags, in either order', spawning, withScratch((s) => {
  const requests = [`--resume ${THREAD2} --model x q\n`, `--model x --resume ${THREAD2} q\n`];
  for (const request of requests) {
    const r = run(s, 'ask', { request });
    assert.equal(r.status, 0, r.stdout);
  }
  assert.deepEqual(calls(s), requests.map(() => ASK_RESUME(THREAD2, ['--model', 'x'])));
}));

test('a bare --resume together with --model reaches Codex as both flags, using the saved thread id', spawning, withScratch((s) => {
  const seed = run(s, 'ask', { request: 'seed the saved thread\n' });
  assert.equal(seed.status, 0, seed.stdout);
  const r = run(s, 'ask', { request: '--model x --resume\nthe follow-up question\n' });
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(calls(s).at(-1), ASK_RESUME(THREAD, ['--model', 'x']));
}));

test('a successful review saves its thread id', spawning, withScratch((s) => {
  writeFileSync(join(s.repo, 'tracked.txt'), 'two\n');
  const r = run(s, 'review', { request: '' });
  assert.equal(r.status, 0, r.stdout);
  assert.equal(savedThread(s), `${THREAD}\n`);
}));

test('a successful do saves its thread id', spawning, withScratch((s) => {
  const r = run(s, 'do', { request: 'go' });
  assert.equal(r.status, 0, r.stdout);
  assert.equal(savedThread(s), `${THREAD}\n`);
}));

test('two Claude sessions keep separate saved thread-id files', spawning, withScratch((s) => {
  const r1 = run(s, 'ask', { request: 'the first session question\n' });
  assert.equal(r1.status, 0, r1.stdout);
  writeFileSync(join(s.data, `request-${ID2}.txt`), `--resume ${THREAD2} the second session question\n`);
  const r2 = cli(s, ['ask', s.data, ID2]);
  assert.equal(r2.status, 0, r2.stdout);
  assert.equal(savedThread(s, ID), `${THREAD}\n`);
  assert.equal(savedThread(s, ID2), `${THREAD2}\n`);
}));

test('a run that starts a thread and then fails leaves a previously saved thread id unchanged', spawning, withScratch((s) => {
  writeFileSync(threadFile(s), 'seed-0000000000\n');
  const r = run(s, 'ask', { request: 'q', env: { FAKE_CODEX: 'exit1' } });
  assert.equal(r.status, 1);
  assert.equal(savedThread(s), 'seed-0000000000\n');
}));

test('a resumed run that fails leaves the saved thread id unchanged', spawning, withScratch((s) => {
  writeFileSync(threadFile(s), `${THREAD2}\n`);
  const r = run(s, 'ask', { request: `--resume ${THREAD} q\n`, env: { FAKE_CODEX: 'exit1' } });
  assert.deepEqual(calls(s), [ASK_RESUME(THREAD)]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /ccx: the run failed: codex exited with status 1\n/);
  assert.equal(savedThread(s), `${THREAD2}\n`);
}));

test('a stale saved thread id fails the resume with Codex\'s own error, and leaves the saved id unchanged', spawning, withScratch((s) => {
  writeFileSync(threadFile(s), 'stale-0000000000\n');
  const r = run(s, 'ask', { request: '--resume\nq\n', env: { FAKE_CODEX: 'resume-unknown' } });
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), [ASK_RESUME('stale-0000000000')]);
  assert.match(r.stdout, /(?:^|\n)Error: thread\/resume: thread\/resume failed: no rollout found for thread id stale-0000000000 \(code -32600\)\n/);
  assert.equal(savedThread(s), 'stale-0000000000\n');
}));

test('a saved-thread path that is a directory is refused, naming the file, before Codex starts', spawning, withScratch((s) => {
  const file = threadFile(s);
  mkdirSync(file);
  const r = run(s, 'ask', { request: '--resume\nq\n' });
  assert.equal(r.stdout, `ccx: ask arguments refused: could not read the saved thread in ${file}: EISDIR\nstatus: refused\n`);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));

test('a saved thread file holding a malformed id is refused, naming the file, before Codex starts', spawning, withScratch((s) => {
  const file = threadFile(s);
  writeFileSync(file, 'bad;id\n');
  const r = run(s, 'ask', { request: '--resume\nq\n' });
  assert.equal(r.stdout, `ccx: ask arguments refused: could not read the saved thread in ${file}: it does not hold a thread id\nstatus: refused\n`);
  assert.equal(r.status, 1);
  assert.deepEqual(calls(s), []);
}));
