// House rules. The pure functions run on fake rule texts with literal digests; main() runs on temporary directories set
// through CLAUDE_CONFIG_DIR, CODEX_HOME and home, so no test reads or writes the real ~/.claude or ~/.codex.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultOptions, diff, imports, inspect, loadTexts, main, parseOptions, planTarget, removeBlock, render, targets,
} from '../../plugins/ccx/scripts/rules.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/ccx/scripts/rules.mjs', import.meta.url));
// The bytes EF BB BF (a UTF-8 byte order mark) and FF (never valid UTF-8), as latin1 reads them.
const BOM = '\u00ef\u00bb\u00bf';
const FF = '\u00ff';
const TEXTS = { 'core.md': 'C1\nC2\n', 'windows-claude.md': 'WC\n', 'windows-codex.md': 'WX\n', 'writing-codex.md': 'WR\n' };
const END = '<!-- ccx:house-rules end -->';
const begin = (options, join, digest, version = '0.0.1') =>
  `<!-- ccx:house-rules begin version=${version} options=${options} join=${join} digest=${digest} -->`;
const plan = (text, more = {}) => planTarget({ target: 'claude', text, version: '9.9.9', texts: TEXTS, platform: 'linux', ...more });
// The current block for core on LF, as this file's fake texts render it.
const CORE_LF = `${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`;

test('render joins the parts with one empty line, in the order windows, core, writing, in the line ending given', () => {
  assert.equal(render('claude', ['core'], TEXTS), 'C1\nC2\n');
  assert.equal(render('claude', ['core', 'windows'], TEXTS), 'WC\n\nC1\nC2\n');
  assert.equal(render('claude', ['core', 'writing'], TEXTS), 'C1\nC2\n');
  assert.equal(render('codex', ['writing', 'core', 'windows'], TEXTS), 'WX\n\nC1\nC2\n\nWR\n');
  assert.equal(render('claude', ['core'], TEXTS, '\r\n'), 'C1\r\nC2\r\n');
});

test('R35: core is the default, with windows added on Windows; writing is never a default', () => {
  assert.deepEqual(defaultOptions('linux'), ['core']);
  assert.deepEqual(defaultOptions('darwin'), ['core']);
  assert.deepEqual(defaultOptions('win32'), ['core', 'windows']);
  assert.deepEqual(plan(null, { platform: 'win32' }).options, ['core', 'windows']);
  assert.equal(plan(null, { platform: 'win32' }).digest, 'd6a8ad4498204e38');
});

test('R35: --options is checked and put in order, and windows is refused off Windows', () => {
  assert.deepEqual(parseOptions('writing, core', 'linux'), ['core', 'writing']);
  assert.deepEqual(parseOptions('windows,core', 'win32'), ['core', 'windows']);
  assert.throws(() => parseOptions('windows', 'darwin'), { message: 'the windows option is offered only on Windows' });
  assert.throws(() => parseOptions('core,bogus', 'linux'),
    { message: '--options takes a comma-separated list of core, windows, writing; got "core,bogus"' });
  assert.throws(() => parseOptions('', 'linux'), { message: '--options takes a comma-separated list of core, windows, writing; got ""' });
});

test('R35: recorded options are kept on a rerun, and --options overrides them', () => {
  const codex = (more) => planTarget({ target: 'codex', text: null, version: '9.9.9', texts: TEXTS, platform: 'linux', ...more });
  assert.deepEqual(codex({ recorded: ['core', 'writing'] }).options, ['core', 'writing']);
  assert.equal(codex({ recorded: ['core', 'writing'] }).digest, '39143b59312d5a81');
  assert.deepEqual(codex({ recorded: ['core', 'writing'], options: ['core'] }).options, ['core']);
  // A block in the file keeps its own options, whatever the platform default.
  assert.equal(plan(`mine\n\n${CORE_LF}`, { platform: 'win32' }).state, 'current');
});

test('R36, R41: a missing file gets the block with join=none, and the block ends with a line ending', () => {
  const p = plan(null);
  assert.equal(p.state, 'absent');
  assert.equal(p.after, `${begin('core', 'none', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`);
  assert.equal(p.digest, 'cb477dddc15de845');
  assert.deepEqual(p.options, ['core']);
  assert.equal(plan('').after, `${begin('core', 'none', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`);
});

test('R36, R40: a file with a final newline gets join=blank, one empty line', () => {
  assert.equal(plan('mine\n').after, `mine\n\n${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`);
});

test('R36, R40: a file without a final newline gets join=newline, a line break and an empty line', () => {
  assert.equal(plan('mine').after, `mine\n\n${begin('core', 'newline', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`);
});

test('R40: a CRLF file gets a CRLF block, with the digest of the body in LF', () => {
  assert.equal(plan('mine\r\n').after,
    `mine\r\n\r\n${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\r\nC1\r\nC2\r\n${END}\r\n`);
});

test('R40: a byte order mark and a byte that is not UTF-8 are kept, as latin1 characters', () => {
  const bom = `${BOM}mine ${FF}\n`;
  assert.equal(plan(bom).after, `${bom}\n${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}\n`);
});

test('R37: absent, current, stale, edited and declined each plan as the table says', () => {
  assert.equal(plan('mine\n').state, 'absent');
  assert.deepEqual(plan(`mine\n\n${CORE_LF}`), { state: 'current', after: null, options: ['core'] });
  const stale = plan(`mine\n\n${begin('core', 'blank', 'be1ba97540b68c56')}\nC1\nOLD\n${END}\n`);
  assert.equal(stale.state, 'stale');
  assert.equal(stale.after, `mine\n\n${CORE_LF}`);
  assert.equal(stale.declined, false);
  assert.deepEqual(plan(`mine\n\n${begin('core', 'blank', 'cb477dddc15de845')}\nC1\nEDIT\n${END}\n`), {
    state: 'edited', after: null, options: ['core'], edits: ['C1\nC2\n', 'C1\nEDIT\n'],
    note: 'the block was edited by hand; move your lines below the end marker, then run /ccx:rules again',
  });
  assert.equal(plan('mine\n', { declined: ['cb477dddc15de845'] }).declined, true);
  assert.equal(plan(`${begin('core', 'none', 'be1ba97540b68c56')}\nC1\nOLD\n${END}\n`, { declined: ['cb477dddc15de845'] }).declined, true);
});

test('R37: a block reads the same after its file changes line ending, and a legacy CRLF digest still reads', () => {
  const lf = `mine\n\n${CORE_LF}`;
  const crlf = `mine\r\n\r\n${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\r\nC1\r\nC2\r\n${END}\r\n`;
  assert.equal(plan(lf).state, 'current');
  assert.equal(plan(crlf).state, 'current');
  assert.equal(plan(crlf.replace(/\r\n/g, '\n')).state, 'current');
  assert.equal(plan(lf.replace(/\n/g, '\r\n')).state, 'current');
  // 0.1.3 took the digest over the CRLF body.
  const legacy = `mine\r\n\r\n${begin('core', 'blank', 'd9ccd27017096bcc')}\r\nC1\r\nC2\r\n${END}\r\n`;
  assert.equal(plan(legacy).state, 'current');
  assert.equal(plan(legacy.replace(/\r\n/g, '\n')).state, 'current');
  const legacyStale = `mine\r\n\r\n${begin('core', 'blank', '38b8fa30cf40c6eb')}\r\nC1\r\nOLD\r\n${END}\r\n`;
  assert.equal(plan(legacyStale).state, 'stale');
  assert.equal(plan(legacyStale.replace(/\r\n/g, '\n')).state, 'stale');
  assert.equal(plan(crlf.replace('C2', 'EDIT')).state, 'edited');
  assert.equal(plan(crlf.replace('C2', 'EDIT').replace(/\r\n/g, '\n')).state, 'edited');
});

test('R43: a decline recorded over a CRLF body still matches, and the digest recorded now is the LF one', () => {
  assert.equal(plan('mine\r\n', { declined: ['d9ccd27017096bcc'] }).declined, true);
  assert.equal(plan('mine\r\n', { declined: ['cb477dddc15de845'] }).declined, true);
  assert.equal(plan('mine\r\n').digest, 'cb477dddc15de845');
});

test('R37: a version change alone, with the same rules, is current', () => {
  assert.equal(plan(`${begin('core', 'none', 'cb477dddc15de845', '0.0.1')}\nC1\nC2\n${END}\n`).state, 'current');
});

test('R37, R40: a stale block in the middle is replaced in place, and the text below the end marker is kept', () => {
  const p = plan(`top\n\n${begin('core', 'blank', 'be1ba97540b68c56')}\nC1\nOLD\n${END}\nbelow\n`);
  assert.equal(p.after, `top\n\n${CORE_LF}below\n`);
});

test('R40: a stale CRLF block stays CRLF', () => {
  const p = plan(`mine\r\n\r\n${begin('core', 'blank', '38b8fa30cf40c6eb')}\r\nC1\r\nOLD\r\n${END}\r\n`);
  assert.equal(p.after, `mine\r\n\r\n${begin('core', 'blank', 'cb477dddc15de845', '9.9.9')}\r\nC1\r\nC2\r\n${END}\r\n`);
});

test('R40: an end marker with no final newline is replaced without adding one', () => {
  const p = plan(`${begin('core', 'none', 'be1ba97540b68c56')}\nC1\nOLD\n${END}`);
  assert.equal(p.after, `${begin('core', 'none', 'cb477dddc15de845', '9.9.9')}\nC1\nC2\n${END}`);
});

test('R37: each malformed shape is reported with its line numbers and writes nothing', () => {
  const b = begin('core', 'none', 'cb477dddc15de845');
  const cases = [
    [`a\n${b}\nC1\n`, '1 begin and 0 end markers, at lines 2'],
    [`a\n${END}\n`, '0 begin and 1 end markers, at lines 2'],
    [`${b}\n${b}\nC1\n${END}\n`, '2 begin and 1 end markers, at lines 1, 2, 4'],
    [`${END}\nC1\n${b}\n`, 'the end marker comes before the begin marker, at lines 1, 3'],
    ['<!-- ccx:house-rules begin version=1 options=core -->\nC1\n' + `${END}\n`, 'the begin marker cannot be read, at lines 1, 3'],
    [`${begin('core,bogus', 'none', 'cb477dddc15de845')}\nC1\n${END}\n`, 'the begin marker cannot be read, at lines 1, 3'],
  ];
  for (const [text, note] of cases) {
    assert.deepEqual(plan(text), { state: 'malformed', after: null, note });
    assert.deepEqual(plan(text, { remove: true }), { state: 'malformed', after: null, note });
  }
});

test('inspect finds a CRLF block by its byte offsets', () => {
  const text = `ab\r\n${begin('core', 'none', 'cb477dddc15de845')}\r\nC1\r\n${END}\r\nz`;
  const found = inspect(text);
  assert.deepEqual(found, { kind: 'block', start: 4, bodyStart: 97, bodyEnd: 101, end: 131, version: '0.0.1', options: ['core'], join: 'none', digest: 'cb477dddc15de845', legacy: false });
  assert.equal(text.slice(found.bodyStart, found.bodyEnd), 'C1\r\n');
});

test('R42: remove takes the block and the bytes of its join, for each join value', () => {
  const b = (j) => `${begin('core', j, 'cb477dddc15de845')}\nC1\nC2\n${END}\n`;
  assert.equal(removeBlock(b('none'), inspect(b('none'))), '');
  assert.equal(removeBlock(`mine\n\n${b('blank')}`, inspect(`mine\n\n${b('blank')}`)), 'mine\n');
  assert.equal(removeBlock(`mine\n\n${b('newline')}`, inspect(`mine\n\n${b('newline')}`)), 'mine');
  const crlf = `mine\r\n\r\n${begin('core', 'blank', 'd9ccd27017096bcc')}\r\nC1\r\nC2\r\n${END}\r\n`;
  assert.equal(removeBlock(crlf, inspect(crlf)), 'mine\r\n');
  // Join bytes the user has since deleted are not taken from the user's text.
  assert.equal(removeBlock(`mine\n${b('blank').replace('blank', 'newline')}`, inspect(`mine\n${b('newline')}`)), 'mine\n');
  const middle = `top\n\n${b('blank')}below\n`;
  assert.deepEqual(plan(middle, { remove: true }), { state: 'remove', after: 'top\nbelow\n', options: ['core'] });
  assert.deepEqual(plan('mine\n', { remove: true }), { state: 'absent', after: null, note: 'there is no block to remove' });
});

// A block as 0.1.x wrote it, under the old marker.
const OLD = (text) => text.replace(/ccx:house-rules/g, 'recode:house-rules');

test('R42: remove takes out a block under the old marker, with the bytes of its join', () => {
  const old = OLD(`${begin('core', 'blank', 'cb477dddc15de845')}\nC1\nC2\n${END}\n`);
  assert.equal(old, '<!-- recode:house-rules begin version=0.0.1 options=core join=blank digest=cb477dddc15de845 -->\nC1\nC2\n<!-- recode:house-rules end -->\n');
  assert.equal(inspect(`mine\n\n${old}`).legacy, true);
  assert.equal(inspect(CORE_LF).legacy, false);
  assert.deepEqual(plan(`mine\n\n${old}`, { remove: true }), { state: 'remove', after: 'mine\n', options: ['core'] });
  assert.equal(plan(`mine\r\n\r\n${old.replace(/\n/g, '\r\n')}`, { remove: true }).after, 'mine\r\n');
});

test('R37: a current block under the old marker is stale, and its rewrite carries the new marker', () => {
  const old = OLD(`${begin('core', 'blank', 'cb477dddc15de845')}\nC1\nC2\n${END}\n`);
  const p = plan(`mine\n\n${old}`);
  assert.equal(p.state, 'stale');
  assert.equal(p.after, `mine\n\n${CORE_LF}`);
  assert.equal(p.digest, 'cb477dddc15de845');
  assert.equal(plan(`mine\n\n${CORE_LF}`).state, 'current');
  assert.equal(plan(`mine\n\n${old.replace('C2', 'EDIT')}`).state, 'edited');
});

test('R37: an old block and a new block in one file are malformed, and so are mixed begin and end markers', () => {
  const old = OLD(`${begin('core', 'none', 'cb477dddc15de845')}\nC1\nC2\n${END}\n`);
  const fresh = `${begin('core', 'none', 'cb477dddc15de845')}\nC1\nC2\n${END}\n`;
  const note = '2 begin and 2 end markers, at lines 1, 4, 5, 8';
  assert.deepEqual(plan(old + fresh), { state: 'malformed', after: null, note });
  assert.deepEqual(plan(old + fresh, { remove: true }), { state: 'malformed', after: null, note });
  const mixed = `${begin('core', 'none', 'cb477dddc15de845')}\nC1\nC2\n<!-- recode:house-rules end -->\n`;
  assert.deepEqual(plan(mixed), { state: 'malformed', after: null, note: 'the begin and end markers carry different names, at lines 1, 4' });
});

test('R42: install then remove gives back the original bytes for LF, CRLF, BOM and no final newline', () => {
  for (const original of ['', 'mine\n', 'mine', 'one\r\ntwo\r\n', 'one\r\ntwo', `${BOM}mine\n`, `${BOM}mine`]) {
    const installed = plan(original).after;
    assert.equal(plan(installed, { remove: true }).after, original, JSON.stringify(original));
  }
});

test('R44: @ import lines outside the block are listed with their line numbers, and lines in the block are not', () => {
  const text = `@~/extra.md\nmine\n\n${begin('core', 'blank', 'd0c78d0f2fb160ad')}\n@x\n${END}\n@after.md\r\n email@example.com\n`;
  assert.deepEqual(imports(text), ['1: @~/extra.md', '7: @after.md']);
  assert.deepEqual(imports('no imports\n'), []);
});

test('diff shows the changed lines with three lines of context', () => {
  assert.equal(diff('a\nb\nc\nd\n', 'a\nb\nc\nd\n\nX\n', 'f', 'f (proposed)'), '--- f\n+++ f (proposed)\n@@ line 2 @@\n b\n c\n d\n+\n+X');
  assert.equal(diff('a\nOLD\nz\n', 'a\nNEW\nz\n', 'f', 'g'), '--- f\n+++ g\n@@ line 1 @@\n a\n-OLD\n+NEW\n z');
  assert.equal(diff('', 'X\n', 'f', 'g'), '--- f\n+++ g\n@@ line 1 @@\n+X');
});

// main() on temporary directories. AT and LATER are the injected clocks for backup names.
const AT = new Date('2026-10-03T12:00:00Z');
const LATER = new Date('2026-10-03T12:00:01Z');
const SHIPPED = loadTexts();

function sandbox(fn, { codex = true } = {}) {
  return async () => {
    const root = mkdtempSync(join(tmpdir(), 'ccx-rules-'));
    const s = { root, claudeDir: join(root, 'claude'), codexDir: join(root, 'codex'), data: join(root, 'data'), home: join(root, 'home') };
    s.claude = join(s.claudeDir, 'CLAUDE.md');
    s.codex = join(s.codexDir, 'AGENTS.md');
    s.env = { CLAUDE_CONFIG_DIR: s.claudeDir, CODEX_HOME: s.codexDir };
    mkdirSync(s.home);
    if (codex) mkdirSync(s.codexDir);
    s.run = (verb, rest = [], { now = AT, platform = 'linux' } = {}) => main([verb, s.data, ...rest], { env: s.env, platform, now, home: s.home });
    s.state = () => JSON.parse(readFileSync(join(s.data, 'rules-state.json'), 'utf8'));
    try { return await fn(s); } finally { rmSync(root, { recursive: true, force: true }); }
  };
}
const bytes = (path) => readFileSync(path, 'latin1');
const put = (path, text) => { mkdirSync(join(path, '..'), { recursive: true }); writeFileSync(path, text, 'latin1'); };

test('R33: the targets come from CLAUDE_CONFIG_DIR and CODEX_HOME, else from the home directory', sandbox((s) => {
  assert.deepEqual(targets(s.env, s.home), { claude: { path: s.claude }, codex: { path: s.codex } });
  const t = targets({}, s.home);
  assert.equal(t.claude.path, join(s.home, '.claude', 'CLAUDE.md'));
  assert.equal(t.codex.skip, `there is no Codex home at ${join(s.home, '.codex')}, so nothing is written there`);
}));

test('R33: with no Codex home, the Codex target is skipped and nothing is created there', sandbox((s) => {
  const out = s.run('plan');
  assert.deepEqual(out.slice(-3), [`target: codex ${s.codex}`,
    `state: skipped; there is no Codex home at ${s.codexDir}, so nothing is written there`, 'change: none']);
  assert.deepEqual(s.run('apply', ['claude']), [`ccx: wrote ${s.claude}`]);
  assert.throws(() => s.run('apply', ['codex']), { message: 'there is no planned change for codex; run /ccx:rules again' });
  assert.equal(existsSync(s.codexDir), false);
  assert.deepEqual(readdirSync(s.root).sort(), ['claude', 'data', 'home']);
}, { codex: false }));

test('R33: with AGENTS.override.md in the Codex home, the Codex target is left alone', sandbox((s) => {
  put(join(s.codexDir, 'AGENTS.override.md'), 'override\n');
  assert.equal(s.run('status')[1], `codex: skipped ${s.codex}`);
  const out = s.run('plan');
  assert.equal(out.at(-2),
    `state: skipped; Codex reads ${join(s.codexDir, 'AGENTS.override.md')} instead of AGENTS.md, so the Codex file is left alone`);
  assert.deepEqual(readdirSync(s.codexDir), ['AGENTS.override.md']);
}));

test('R35: status reports the default options on a first run, and the recorded ones after an apply', sandbox((s) => {
  assert.deepEqual(s.run('status'), [`claude: absent ${s.claude} options=core (default)`, `codex: absent ${s.codex} options=core (default)`,
    'options recorded: no', 'options offered: core, writing']);
  assert.equal(s.run('status', [], { platform: 'win32' }).at(-1), 'options offered: core, windows, writing');
  s.run('plan', ['--options', 'core,writing']);
  s.run('apply', ['codex']);
  assert.deepEqual(s.state().options, { codex: ['core', 'writing'] });
  // Options are recorded per target: Claude, not applied, still shows the default.
  assert.deepEqual(s.run('status'), [`claude: absent ${s.claude} options=core (default)`, `codex: current ${s.codex} options=core,writing`,
    'options recorded: yes', 'options offered: core, writing']);
  // A rerun with no --options keeps Codex's recorded options, so it plans no change there.
  assert.deepEqual(s.run('plan').slice(-4), [`target: codex ${s.codex}`, 'state: current', 'options: core,writing', 'change: none']);
  assert.throws(() => s.run('plan', ['--options', 'windows']), { message: 'the windows option is offered only on Windows' });
}));

test('R35, R46: the writing option adds the shipped Writing section to the Codex block only', sandbox((s) => {
  s.run('plan', ['--options', 'core,writing']);
  s.run('apply', ['claude']);
  s.run('apply', ['codex']);
  const codexBody = bytes(s.codex).split('\n').slice(1).join('\n');
  assert.equal(codexBody, `${SHIPPED['core.md']}\n${SHIPPED['writing-codex.md']}${END}\n`);
  assert.equal(bytes(s.claude).split('\n').slice(1).join('\n'), `${SHIPPED['core.md']}${END}\n`);
  assert.match(bytes(s.codex).split('\n')[0],
    /^<!-- ccx:house-rules begin version=0\.3\.1 options=core,writing join=none digest=[0-9a-f]{16} -->$/);
}));

test('R37: plan writes nothing for current, edited and malformed targets', sandbox((s) => {
  s.run('plan');
  s.run('apply', ['claude']);
  put(s.codex, `mine\n${END}\n`);
  const out = s.run('plan');
  assert.ok(out.includes('state: current'));
  assert.ok(out.includes('state: malformed; 0 begin and 1 end markers, at lines 2'));
  assert.equal(out.filter((l) => l === 'change: none').length, 2);
  assert.deepEqual(JSON.parse(readFileSync(join(s.data, 'rules-plan.json'), 'utf8')), {});
  put(s.claude, bytes(s.claude).replace('## Working', '## Working (mine)'));
  assert.equal(s.run('status')[0], `claude: edited ${s.claude} options=core`);
  const edited = s.run('plan');
  assert.ok(edited.includes('state: edited; the block was edited by hand; move your lines below the end marker, then run /ccx:rules again'));
  const shown = edited.join('\n');
  assert.ok(shown.includes(`--- the rules this plugin would write\n+++ the block in ${s.claude}\n@@ line `));
  assert.ok(shown.includes('\n-## Working\n+## Working (mine)\n'));
  assert.deepEqual(JSON.parse(readFileSync(join(s.data, 'rules-plan.json'), 'utf8')), {});
}));

test('R39: apply refuses when the target changed after the plan, and writes nothing', sandbox((s) => {
  put(s.claude, 'mine\n');
  s.run('plan');
  put(s.claude, 'mine, changed\n');
  assert.throws(() => s.run('apply', ['claude']),
    { message: `${s.claude} changed after the diff was shown, so nothing was written; run /ccx:rules again` });
  assert.equal(bytes(s.claude), 'mine, changed\n');
  assert.deepEqual(readdirSync(s.claudeDir), ['CLAUDE.md']);
  assert.throws(() => s.run('apply', ['bogus']), { message: 'there is no planned change for bogus; run /ccx:rules again' });
}));

test('R39: a file created after the plan, where none was, is a change too', sandbox((s) => {
  s.run('plan');
  put(s.claude, 'new\n');
  assert.throws(() => s.run('apply', ['claude']),
    { message: `${s.claude} changed after the diff was shown, so nothing was written; run /ccx:rules again` });
  assert.equal(bytes(s.claude), 'new\n');
}));

test('R41: an existing file is backed up with the time in its name, and no temporary file is left', sandbox((s) => {
  put(s.claude, 'mine\n');
  s.run('plan');
  assert.deepEqual(s.run('apply', ['claude']),
    [`ccx: wrote ${s.claude}; the earlier content is in ${s.claude}.ccx-backup-20261003120000`]);
  assert.deepEqual(readdirSync(s.claudeDir).sort(), ['CLAUDE.md', 'CLAUDE.md.ccx-backup-20261003120000']);
  assert.equal(bytes(`${s.claude}.ccx-backup-20261003120000`), 'mine\n');
  assert.ok(bytes(s.claude).startsWith('mine\n\n<!-- ccx:house-rules begin version=0.3.1 options=core join=blank digest='));
  assert.deepEqual(s.state().created, {});
  assert.deepEqual(readdirSync(s.data).sort(), ['rules-plan.json', 'rules-state.json']);
}));

test('R41: a backup that already exists is never overwritten, and nothing is written', sandbox((s) => {
  put(s.claude, 'mine\n');
  put(`${s.claude}.ccx-backup-20261003120000`, 'older backup\n');
  s.run('plan');
  assert.throws(() => s.run('apply', ['claude']),
    { message: `could not back up ${s.claude} to ${s.claude}.ccx-backup-20261003120000 (EEXIST); nothing was written` });
  assert.equal(bytes(s.claude), 'mine\n');
  assert.equal(bytes(`${s.claude}.ccx-backup-20261003120000`), 'older backup\n');
}));

test('R41, R42: a missing Claude file is created and recorded, and remove deletes it with no backup', sandbox((s) => {
  rmSync(s.codexDir, { recursive: true });
  s.run('plan');
  assert.deepEqual(s.run('apply', ['claude']), [`ccx: wrote ${s.claude}`]);
  assert.deepEqual(s.state().created, { claude: true });
  assert.deepEqual(readdirSync(s.claudeDir), ['CLAUDE.md']);
  s.run('remove', [], { now: LATER });
  assert.deepEqual(s.run('apply', ['claude'], { now: LATER }),
    [`ccx: removed ${s.claude}, which /ccx:rules had created and which held nothing else`]);
  assert.deepEqual(readdirSync(s.claudeDir), []);
  assert.deepEqual(s.state(), { options: {}, created: {}, declined: {} });
}));

test('R42: a created file that the user added to is kept on remove, holding only the user text', sandbox((s) => {
  s.run('plan');
  s.run('apply', ['claude']);
  put(s.claude, `${bytes(s.claude)}mine\n`);
  s.run('remove', [], { now: LATER });
  assert.deepEqual(s.run('apply', ['claude'], { now: LATER }),
    [`ccx: wrote ${s.claude}; the earlier content is in ${s.claude}.ccx-backup-20261003120001`]);
  assert.equal(bytes(s.claude), 'mine\n');
}));

test('R40, R42: install then remove leaves each fixture file equal to its original bytes', async () => {
  const fixtures = {
    'join none, an empty file': '',
    'join blank, LF': '# Mine\n\nKeep this.\n',
    'join newline, no final newline': '# Mine\n\nKeep this.',
    CRLF: '# Mine\r\n\r\nKeep this.\r\n',
    'CRLF, no final newline': '# Mine\r\n\r\nKeep this.',
    'BOM and a non-UTF-8 byte': `${BOM}# Mine ${FF}\n`,
  };
  for (const [label, original] of Object.entries(fixtures)) {
    await sandbox((s) => {
      put(s.claude, original);
      put(s.codex, original);
      s.run('plan');
      s.run('apply', ['claude']);
      s.run('apply', ['codex']);
      const installed = bytes(s.claude);
      assert.ok(installed.startsWith(original), label);
      if (label.startsWith('CRLF')) assert.equal(installed.replace(/\r\n/g, '').includes('\n'), false, 'the block uses CRLF');
      else assert.equal(installed.includes('\r'), false, label);
      s.run('remove', [], { now: LATER });
      s.run('apply', ['claude'], { now: LATER });
      s.run('apply', ['codex'], { now: LATER });
      assert.equal(bytes(s.claude), original, label);
      assert.equal(bytes(s.codex), original, label);
      assert.equal(bytes(`${s.claude}.ccx-backup-20261003120000`), original, label);
    })();
  }
});

test('R43: a decline is recorded with its digest, and the next plan says so', sandbox((s) => {
  put(s.claude, `mine\n\n${begin('core', 'blank', '6d3e610aaf815551')}\nold rules\n${END}\n`);
  rmSync(s.codexDir, { recursive: true });
  assert.ok(s.run('plan').includes('state: stale'));
  assert.deepEqual(s.run('decline', ['claude']), [`ccx: declined the change to ${s.claude}; the session notice stays quiet for this text`]);
  const { declined } = s.state();
  assert.deepEqual(Object.keys(declined), ['claude']);
  assert.match(declined.claude[0], /^[0-9a-f]{16}$/);
  assert.equal(declined.claude.length, 1);
  assert.ok(s.run('plan').includes('state: stale (you declined this text before)'));
  assert.equal(bytes(s.claude), `mine\n\n${begin('core', 'blank', '6d3e610aaf815551')}\nold rules\n${END}\n`);
}));

test('R44: an @ import in the Claude file is noted and left as it is', sandbox((s) => {
  put(s.claude, '@~/shared/rules.md\nmine\n');
  const out = s.run('plan');
  assert.ok(out.includes('note: line 1: @~/shared/rules.md imports a file that may hold the same rules; it is left as it is'));
  s.run('apply', ['claude']);
  assert.ok(bytes(s.claude).startsWith('@~/shared/rules.md\nmine\n\n<!-- ccx:house-rules begin'));
}));

test('R41, R42: two applies started at once both land in the state and plan files', sandbox(async (s) => {
  // Claude sends the two apply calls in one message, so the processes run side by side.
  const env = { ...process.env, ...s.env, HOME: s.home, USERPROFILE: s.home };
  const apply = (target) => new Promise((done) => spawn(process.execPath, [SCRIPT, 'apply', s.data, target], { env }).on('close', done));
  for (let i = 0; i < 10; i++) {
    rmSync(s.claude, { force: true });
    rmSync(s.codex, { force: true });
    rmSync(s.data, { recursive: true, force: true });
    s.run('plan');
    assert.deepEqual(await Promise.all([apply('claude'), apply('codex')]), [0, 0]);
    assert.deepEqual(JSON.parse(readFileSync(join(s.data, 'rules-plan.json'), 'utf8')), {}, `pair ${i}`);
    assert.deepEqual(s.state().created, { claude: true, codex: true }, `pair ${i}`);
    assert.deepEqual(s.state().options, { claude: ['core'], codex: ['core'] }, `pair ${i}`);
    assert.deepEqual(readdirSync(s.data).sort(), ['rules-plan.json', 'rules-state.json'], `pair ${i}`);
  }
}));

test('a step waits while another holds the lock, and takes over a lock left by a run that died', sandbox(async (s) => {
  const env = { ...process.env, ...s.env, HOME: s.home, USERPROFILE: s.home };
  const lock = join(s.data, 'rules.lock');
  mkdirSync(lock, { recursive: true });
  const started = Date.now();
  const plan = new Promise((done) => spawn(process.execPath, [SCRIPT, 'plan', s.data], { env }).on('close', done));
  await new Promise((r) => setTimeout(r, 600));
  assert.equal(existsSync(join(s.data, 'rules-plan.json')), false);
  rmSync(lock, { recursive: true });
  assert.equal(await plan, 0);
  assert.ok(Date.now() - started >= 600);
  assert.equal(existsSync(join(s.data, 'rules-plan.json')), true);
  mkdirSync(lock);
  utimesSync(lock, new Date('2026-10-03T11:00:00Z'), new Date('2026-10-03T11:00:00Z'));
  assert.deepEqual(s.run('apply', ['claude']), [`ccx: wrote ${s.claude}`]);
  assert.equal(existsSync(lock), false);
}));

test('the script prints a refusal on stdout and exits 1, and a status exits 0', sandbox((s) => {
  const env = { ...process.env, ...s.env, HOME: s.home, USERPROFILE: s.home };
  const bad = spawnSync(process.execPath, [SCRIPT, 'bogus', s.data], { env, encoding: 'utf8' });
  assert.equal(bad.stdout, 'ccx: unknown command bogus; use status, plan, remove, apply or decline\n');
  assert.equal(bad.status, 1);
  const ok = spawnSync(process.execPath, [SCRIPT, 'status', s.data], { env, encoding: 'utf8' });
  // The spawned script runs on the real platform, where Windows adds its option to the default (R35).
  const defaults = process.platform === 'win32' ? 'core,windows' : 'core';
  assert.equal(ok.stdout.split('\n')[0], `claude: absent ${s.claude} options=${defaults} (default)`);
  assert.equal(ok.status, 0);
}));

test('the script runs when its path goes through a symlink, as under a linked ~/.claude', sandbox((s) => {
  // A junction on Windows, which needs no extra rights; the type is ignored elsewhere.
  const linked = join(s.root, 'linked');
  symlinkSync(join(SCRIPT, '..', '..'), linked, 'junction');
  try {
    const env = { ...process.env, ...s.env, HOME: s.home, USERPROFILE: s.home };
    const r = spawnSync(process.execPath, [join(linked, 'scripts', 'rules.mjs'), 'status', s.data], { env, encoding: 'utf8' });
    const defaults = process.platform === 'win32' ? 'core,windows' : 'core';
    assert.equal(r.stdout.split('\n')[0], `claude: absent ${s.claude} options=${defaults} (default)`);
    assert.equal(r.status, 0);
  } finally {
    unlinkSync(linked);
  }
}));
