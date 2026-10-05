#!/usr/bin/env node
// House rules: node rules.mjs <status|plan|remove|apply|decline> <dataDir> [args]. Keeps one marked block of rules in the
// user's Claude CLAUDE.md and Codex AGENTS.md. Everything above main() is pure: it takes file text, options and rule texts.
// Files are read and written as latin1, so every byte outside the block, a BOM or a stray non-UTF-8 byte included, survives.
import { createHash } from 'node:crypto';
import { chmodSync, constants, lstatSync, copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const OPTIONS = ['core', 'windows', 'writing'];
// Body order, as forge-ops lays the files out: the Windows line first, then the core, then Codex's Writing section.
const ORDER = ['windows', 'core', 'writing'];
export const PARTS = {
  claude: { windows: 'windows-claude.md', core: 'core.md' },
  codex: { windows: 'windows-codex.md', core: 'core.md', writing: 'writing-codex.md' },
};
export const END = '<!-- ccx:house-rules end -->';
const BEGIN_PREFIX = '<!-- ccx:house-rules begin';
// The markers an earlier name of the plugin wrote; a block under them is read, and rewritten under the current ones.
const OLD_END = '<!-- recode:house-rules end -->';
const OLD_BEGIN_PREFIX = '<!-- recode:house-rules begin';
const BEGIN = /^<!-- [a-z]+:house-rules begin version=(\S+) options=([a-z,]+) join=(none|blank|newline) digest=([0-9a-f]{16}) -->$/;
const JOINS = { none: 0, blank: 1, newline: 2 };
const PLAN_FILE = 'rules-plan.json';
const STATE_FILE = 'rules-state.json';

class Refusal extends Error {}
const refuse = (message) => { throw new Refusal(message); };

const hash = (body) => createHash('sha256').update(body, 'latin1').digest('hex').slice(0, 16);
// A marker's digest is over the body with CRLF as LF, so a change of line ending does not read as an edit.
const lf = (body) => body.replace(/\r\n/g, '\n');
export const digest = (body) => hash(lf(body));
// Every digest a marker may hold for a body: the LF one, the CRLF one, and the raw bytes. An older marker hashed the body
// in the file's own line ending.
export const digests = (body) => [digest(body), hash(lf(body).replace(/\n/g, '\r\n')), hash(body)];
const isDeclined = (declined, body) => digests(body).some((d) => declined.includes(d));
const fileHash = (text) => (text === null ? 'missing' : createHash('sha256').update(text, 'latin1').digest('hex'));
// The file's line ending is that of its first line; a file with no line break takes LF.
export const eolOf = (text) => { const i = text.indexOf('\n'); return i > 0 && text[i - 1] === '\r' ? '\r\n' : '\n'; };
export const defaultOptions = (platform) => (platform === 'win32' ? ['core', 'windows'] : ['core']);

export function parseOptions(value, platform) {
  const list = String(value ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const bad = list.filter((o) => !OPTIONS.includes(o));
  if (!list.length || bad.length) refuse(`--options takes a comma-separated list of ${OPTIONS.join(', ')}; got "${value}"`);
  if (list.includes('windows') && platform !== 'win32') refuse('the windows option is offered only on Windows');
  return OPTIONS.filter((o) => list.includes(o));
}

// The rules for a target and options, parts joined by one empty line, in the file's line ending. texts maps a part file
// name to its LF text.
export function render(target, options, texts, eol = '\n') {
  const body = ORDER.filter((o) => options.includes(o) && PARTS[target][o]).map((o) => texts[PARTS[target][o]]).join('\n');
  return body.replace(/\n/g, eol);
}

const beginLine = (version, options, join, body) =>
  `${BEGIN_PREFIX} version=${version} options=${options.join(',')} join=${join} digest=${digest(body)} -->`;

// Finds the block. Line numbers in a malformed report are 1-based.
export function inspect(text) {
  const begins = [], ends = [];
  let at = text.startsWith('\u00ef\u00bb\u00bf') ? 3 : 0, n = 0;
  while (at < text.length) {
    const nl = text.indexOf('\n', at);
    const next = nl < 0 ? text.length : nl + 1;
    const line = text.slice(at, nl < 0 ? text.length : nl).replace(/\r$/, '');
    n++;
    if (line.startsWith(BEGIN_PREFIX) || line.startsWith(OLD_BEGIN_PREFIX)) begins.push({ n, at, next, line });
    else if (line === END || line === OLD_END) ends.push({ n, at, next, line });
    at = next;
  }
  if (!begins.length && !ends.length) return { kind: 'absent' };
  const lines = [...begins, ...ends].map((m) => m.n).sort((a, b) => a - b);
  if (begins.length !== 1 || ends.length !== 1) return { kind: 'malformed', lines, reason: `${begins.length} begin and ${ends.length} end markers` };
  const [b] = begins, [e] = ends;
  if (e.n < b.n) return { kind: 'malformed', lines, reason: 'the end marker comes before the begin marker' };
  const legacy = b.line.startsWith(OLD_BEGIN_PREFIX);
  if (legacy !== (e.line === OLD_END)) return { kind: 'malformed', lines, reason: 'the begin and end markers carry different names' };
  const m = b.line.match(BEGIN);
  const options = m?.[2].split(',');
  if (!m || options.some((o) => !OPTIONS.includes(o))) return { kind: 'malformed', lines, reason: 'the begin marker cannot be read' };
  return { kind: 'block', start: b.at, bodyStart: b.next, bodyEnd: e.at, end: e.next, version: m[1], options, join: m[3], digest: m[4], legacy };
}

// The text with the block and the bytes its join added taken out. Join bytes that are no longer there are not taken.
export function removeBlock(text, found) {
  const eol = eolOf(text);
  const joinBytes = eol.repeat(JOINS[found.join]);
  const from = text.slice(found.start - joinBytes.length, found.start) === joinBytes ? found.start - joinBytes.length : found.start;
  return text.slice(0, from) + text.slice(found.end);
}

// One target's plan. text is the file's content, or null when it does not exist. Returns the state, the content to
// write (null for no change), the digest of the proposed body, and the options it records.
export function planTarget({ target, text, options, recorded, version, texts, platform, declined = [], remove = false }) {
  const found = inspect(text ?? '');
  if (found.kind === 'malformed') return { state: 'malformed', after: null, note: `${found.reason}, at lines ${found.lines.join(', ')}` };
  if (remove) {
    return found.kind === 'absent' ? { state: 'absent', after: null, note: 'there is no block to remove' }
      : { state: 'remove', after: removeBlock(text, found), options: found.options };
  }
  const eol = eolOf(text ?? '');
  if (found.kind === 'absent') {
    const opts = options ?? recorded ?? defaultOptions(platform);
    const body = render(target, opts, texts, eol);
    if (!body) return { state: 'absent', after: null, note: 'these options add nothing for this target' };
    const before = text ?? '';
    const join = before === '' ? 'none' : before.endsWith('\n') ? 'blank' : 'newline';
    const after = before + eol.repeat(JOINS[join]) + beginLine(version, opts, join, body) + eol + body + END + eol;
    return { state: 'absent', after, digest: digest(body), options: opts, declined: isDeclined(declined, body) };
  }
  const inFile = text.slice(found.bodyStart, found.bodyEnd);
  if (!digests(inFile).includes(found.digest)) {
    return { state: 'edited', after: null, options: found.options, edits: [render(target, found.options, texts, eol), inFile],
      note: 'the block was edited by hand; move your lines below the end marker, then run /ccx:rules again' };
  }
  const opts = options ?? found.options;
  const body = render(target, opts, texts, eol);
  if (!found.legacy && digests(body).includes(found.digest) && opts.join() === found.options.join()) return { state: 'current', after: null, options: opts };
  const block = beginLine(version, opts, found.join, body) + eol + body + END + eol;
  // The end marker may have lost its line break; the replacement keeps the file's last byte as it was.
  const tail = found.end === text.length && !text.endsWith('\n') ? block.slice(0, -eol.length) : block;
  const after = text.slice(0, found.start) + tail + text.slice(found.end);
  return { state: 'stale', after, digest: digest(body), options: opts, declined: isDeclined(declined, body) };
}

// Lines that import another file into Claude's instructions, outside the block: they may carry the same rules.
export function imports(text) {
  const found = inspect(text);
  const lines = [];
  let at = 0;
  text.split('\n').forEach((l, i) => {
    const inside = found.kind === 'block' && at >= found.start && at < found.end;
    const line = i === 0 ? l.replace(/^\u00ef\u00bb\u00bf/, '') : l;
    if (!inside && /^@\S/.test(line)) lines.push(`${i + 1}: ${line.replace(/\r$/, '')}`);
    at += l.length + 1;
  });
  return lines;
}

// A small line diff: the changed run between the common head and tail, with three lines of context on each side.
export function diff(before, after, from, to) {
  const a = before === '' ? [] : before.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  const b = after === '' ? [] : after.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;
  const ctx = (lines) => lines.map((l) => ` ${l}`);
  return [`--- ${from}`, `+++ ${to}`, `@@ line ${Math.max(head - 2, 1)} @@`,
    ...ctx(a.slice(Math.max(head - 3, 0), head)),
    ...a.slice(head, a.length - tail).map((l) => `-${l}`), ...b.slice(head, b.length - tail).map((l) => `+${l}`),
    ...ctx(a.slice(a.length - tail, a.length - tail + 3))].join('\n');
}

// Where each target lives, from the environment the command runs in.
export function targets(env, home = homedir()) {
  const claudeDir = env.CLAUDE_CONFIG_DIR || join(home, '.claude');
  const codexDir = env.CODEX_HOME || join(home, '.codex');
  const resolved = (path) => existsSync(path) && lstatSync(path).isSymbolicLink() ? realpathSync(path) : path;
  const all = {
    claude: { path: resolved(join(claudeDir, 'CLAUDE.md')) },
    codex: !existsSync(codexDir) ? { path: join(codexDir, 'AGENTS.md'), skip: `there is no Codex home at ${codexDir}, so nothing is written there` }
      : existsSync(join(codexDir, 'AGENTS.override.md'))
        ? { path: join(codexDir, 'AGENTS.md'), skip: `Codex reads ${join(codexDir, 'AGENTS.override.md')} instead of AGENTS.md, so the Codex file is left alone` }
        : { path: resolved(join(codexDir, 'AGENTS.md')) },
  };
  if (!all.codex.skip && existsSync(all.claude.path) && existsSync(all.codex.path)) {
    const a = statSync(all.claude.path), b = statSync(all.codex.path);
    if (a.dev === b.dev && a.ino === b.ino) all.codex.skip = 'it is the same file as the Claude target, so the Codex file is left alone';
  }
  return all;
}

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const loadTexts = (root = ROOT) =>
  Object.fromEntries([...new Set(Object.values(PARTS).flatMap(Object.values))].map((f) => [f, readFileSync(join(root, 'rules', f), 'latin1')]));
export const pluginVersion = (root = ROOT) => JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version;
export const readText = (path) => { try { return readFileSync(path, 'latin1'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; } };
export const loadState = (dataDir) => ({ options: {}, created: {}, declined: {}, ...readJson(join(dataDir, STATE_FILE)) });
const save = (dataDir, file, value) => { mkdirSync(dataDir, { recursive: true }); writeAtomic(join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`); };
const stamp = (now) => now.toISOString().replace(/\D/g, '').slice(0, 14);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// Each step but status reads, changes and writes the shared plan and state files, and Claude may run two applies at
// once, so steps take turns through a lock directory. A lock older than a minute is from a run that died.
function locked(dataDir, fn) {
  const lock = join(dataDir, 'rules.lock');
  mkdirSync(dataDir, { recursive: true });
  for (let tries = 0; ; tries++) {
    try { mkdirSync(lock); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - statSync(lock).mtimeMs > 60_000) { rmSync(lock, { recursive: true, force: true }); continue; } } catch {}
      if (tries >= 200) refuse(`another /ccx:rules step holds ${lock}; nothing was written; run /ccx:rules again`);
      sleep(50);
    }
  }
  try { return fn(); } finally { rmSync(lock, { recursive: true, force: true }); }
}

// Writes beside the target, then renames over it. On Windows a rename that fails, as when another process holds the
// file, is retried once after a short wait.
function writeAtomic(path, text, backup) {
  const tmp = `${path}.ccx-tmp-${process.pid}`;
  writeFileSync(tmp, text, 'latin1');
  if (existsSync(path)) chmodSync(tmp, statSync(path).mode & 0o777);
  try { renameSync(tmp, path); } catch (e) {
    if (process.platform === 'win32') {
      sleep(500);
      try { renameSync(tmp, path); return; } catch {}
    }
    rmSync(tmp, { force: true });
    refuse(`could not replace ${path} (${e.code})${backup ? `; the earlier content is in ${backup}` : ''}`);
  }
}

function report(name, t, plan) {
  const lines = [`target: ${name} ${t.path}`];
  if (t.skip) return [...lines, `state: skipped; ${t.skip}`, 'change: none'];
  const declined = plan.declined ? ' (you declined this text before)' : '';
  lines.push(`state: ${plan.state}${declined}${plan.note ? `; ${plan.note}` : ''}`);
  if (plan.options) lines.push(`options: ${plan.options.join(',')}`);
  for (const l of name === 'claude' && t.text ? imports(t.text) : []) lines.push(`note: line ${l} imports a file that may hold the same rules; it is left as it is`);
  if (plan.edits) lines.push(diff(...plan.edits, 'the rules this plugin would write', `the block in ${t.path}`));
  if (plan.after === null) return [...lines, 'change: none'];
  return [...lines, 'change: ready', diff(t.text ?? '', plan.after, t.path, `${t.path} (proposed)`)];
}

export function main(argv, { env = process.env, platform = process.platform, now = new Date(), home = homedir() } = {}) {
  const [verb, dataDir, ...rest] = argv;
  if (!['status', 'plan', 'remove', 'apply', 'decline'].includes(verb)) refuse(`unknown command ${verb}; use status, plan, remove, apply or decline`);
  if (!dataDir) refuse('the data directory argument is missing');
  const step = () => run(verb, dataDir, rest, { env, platform, now, home });
  return verb === 'status' ? step() : locked(dataDir, step);
}

function run(verb, dataDir, rest, { env, platform, now, home }) {
  const all = targets(env, home);
  const state = loadState(dataDir);
  if (verb === 'apply' || verb === 'decline') {
    const name = rest[0];
    const plans = readJson(join(dataDir, PLAN_FILE)) ?? {};
    const p = plans[name];
    if (!p) refuse(`there is no planned change for ${name}; run /ccx:rules again`);
    delete plans[name];
    if (verb === 'decline') {
      state.declined[name] = [...new Set([...(state.declined[name] ?? []), p.digest])].filter(Boolean);
      save(dataDir, STATE_FILE, state);
      save(dataDir, PLAN_FILE, plans);
      return [`ccx: declined the change to ${p.path}; the session notice stays quiet for this text`];
    }
    if (all[name]?.skip) { save(dataDir, PLAN_FILE, plans); return report(name, all[name], { after: null }); }
    const before = readText(p.path);
    if (lstatSync(p.path, { throwIfNoEntry: false })?.isSymbolicLink()) refuse(`${p.path} is a symbolic link that points to a missing file, so nothing was written`);
    if (fileHash(before) !== p.before) refuse(`${p.path} changed after the diff was shown, so nothing was written; run /ccx:rules again`);
    if (before !== null && statSync(p.path).nlink > 1) refuse(`${p.path} has multiple hard links, so nothing was written`);
    const after = Buffer.from(p.after, 'base64').toString('latin1');
    if (p.remove && state.created[name] && after === '') {
      rmSync(p.path);
      delete state.created[name];
      delete state.options[name];
      save(dataDir, STATE_FILE, state);
      save(dataDir, PLAN_FILE, plans);
      return [`ccx: removed ${p.path}, which /ccx:rules had created and which held nothing else`];
    }
    let backup;
    if (before !== null) {
      backup = `${p.path}.ccx-backup-${stamp(now)}`;
      try { copyFileSync(p.path, backup, constants.COPYFILE_EXCL); } catch (e) { refuse(`could not back up ${p.path} to ${backup} (${e.code}); nothing was written`); }
    } else mkdirSync(dirname(p.path), { recursive: true });
    writeAtomic(p.path, after, backup);
    if (before === null) state.created[name] = true;
    if (p.remove) delete state.options[name]; else state.options[name] = p.options;
    save(dataDir, STATE_FILE, state);
    save(dataDir, PLAN_FILE, plans);
    return [`ccx: wrote ${p.path}${backup ? `; the earlier content is in ${backup}` : ''}`];
  }
  let options;
  const at = rest.indexOf('--options');
  if (at >= 0) options = parseOptions(rest[at + 1], platform);
  const texts = loadTexts();
  const version = pluginVersion();
  const out = [], plans = {};
  let recorded = false;
  for (const [name, t] of Object.entries(all)) {
    if (!t.skip) t.text = readText(t.path);
    const plan = t.skip ? { after: null } : planTarget({ target: name, text: t.text, options, recorded: state.options[name], version, texts, platform,
      declined: state.declined[name] ?? [], remove: verb === 'remove' });
    if (verb === 'status') {
      const kept = ['current', 'stale', 'edited'].includes(plan.state) || state.options[name];
      if (kept) recorded = true;
      out.push(`${name}: ${t.skip ? 'skipped' : plan.state} ${t.path}${plan.options ? ` options=${plan.options.join(',')}${kept ? '' : ' (default)'}` : ''}`);
      continue;
    }
    out.push(...report(name, t, plan), '');
    if (plan.after !== null) {
      plans[name] = { path: t.path, before: fileHash(t.text), after: Buffer.from(plan.after, 'latin1').toString('base64'),
        digest: plan.digest, options: plan.options, remove: verb === 'remove' };
    }
  }
  if (verb === 'status') {
    return [...out, `options recorded: ${recorded ? 'yes' : 'no'}`, `options offered: ${platform === 'win32' ? 'core, windows, writing' : 'core, writing'}`];
  }
  save(dataDir, PLAN_FILE, plans);
  return out.slice(0, -1);
}

// Node resolves the entry point through symlinks, so compare with the resolved path.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try {
    process.stdout.write(`${main(process.argv.slice(2)).join('\n')}\n`);
  } catch (e) {
    process.stdout.write(`${e instanceof Refusal ? `ccx: ${e.message}` : `ccx: unexpected error: ${e?.stack ?? e}`}\n`);
    process.exitCode = 1;
  }
}
