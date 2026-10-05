// Runs the audit plugin's POSIX sh suites, so npm test covers them on every CI system. One test per script, so a
// failure names it. The suites need sh, git, awk, and jq on PATH; a missing sh fails here rather than skipping.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sh = (script, args = [], env = {}) => {
  const r = spawnSync('sh', [join(root, 'tests', 'cca', script), ...args], { cwd: root, encoding: 'utf8', env: { ...process.env, ...env } });
  assert.equal(r.error, undefined, `cannot start sh for ${script}: ${r.error?.message}`);
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, text: `${script} ${args.join(' ')}\n${r.stdout}${r.stderr}` };
};
const passes = (script, args, env) => {
  const r = sh(script, args, env);
  assert.equal(r.status, 0, r.text);
  return r;
};

test('lint.sh passes on plugins/cca', () => {
  assert.match(passes('lint.sh').stdout, /^lint: ok$/m);
});

const fixtures = ['solo', 'solo-dirty', 'full', 'tokens', 'patterns', 'ground-truth'];
const build = (name, env) => {
  const r = passes('fixture/build.sh', [name], env);
  const manifest = r.stdout.trim();
  assert.ok(manifest, `build.sh ${name} printed no manifest path`);
  return manifest;
};
for (const name of fixtures) {
  test(`fixture ${name} builds and verifies`, () => {
    const r = passes('fixture/verify.sh', [build(name), name]);
    assert.match(r.stdout, new RegExp(`^verify ${name}: ok$`, 'm'));
  });
}
// A global git config that forbids merges (merge.ff = only) must not reach the fixture builds.
for (const name of ['patterns', 'ground-truth']) {
  test(`fixture ${name} verifies under a hostile global git config`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'cca-gitconfig-'));
    try {
      const config = join(dir, 'hostile.gitconfig');
      writeFileSync(config, '[merge]\n\tff = only\n');
      const env = { GIT_CONFIG_GLOBAL: config };
      const r = passes('fixture/verify.sh', [build(name, env), name], env);
      assert.match(r.stdout, new RegExp(`^verify ${name}: ok$`, 'm'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

for (const name of ['readonly', 'handoff', 'work-items', 'working-tree', 'live', 'memory', 'ledger', 'revert-tests']) {
  test(`${name}.sh passes`, () => {
    const r = passes(`${name}.sh`);
    assert.match(r.stdout, new RegExp(`^${name} test: ok$`, 'm'));
  });
}
