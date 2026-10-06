#!/usr/bin/env node
// House rules: node rules.mjs <status|plan|remove|apply|decline> <dataDir> [args]; plan takes --options <list> and --adopt. Keeps one marked block of rules in the
// user's Claude CLAUDE.md and Codex AGENTS.md. Everything above main() is pure: it takes file text, options and rule texts.
// Instruction files use latin1, so every byte outside the block, a BOM or a stray non-UTF-8 byte included, survives.
import { createHash } from 'node:crypto';
import { chmodSync, constants, lstatSync, copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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
const BEGIN = /^<!-- ccx:house-rules begin version=(\S+) options=([a-z,]+) join=(none|blank|newline) digest=([0-9a-f]{16}) -->$/;
const JOINS = { none: 0, blank: 1, newline: 2 };
const BOM = '\u00ef\u00bb\u00bf';
const HOPS = 4, MAX_FILES = 50, MAX_BYTES = 256 * 1024;
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
  const list = String(value ?? '').split(',').map((s) => s.trim());
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
  let at = text.startsWith(BOM) ? 3 : 0, n = 0;
  while (at < text.length) {
    const nl = text.indexOf('\n', at);
    const next = nl < 0 ? text.length : nl + 1;
    const line = text.slice(at, nl < 0 ? text.length : nl).replace(/\r$/, '');
    n++;
    if (line.startsWith(BEGIN_PREFIX)) begins.push({ n, at, next, line });
    else if (line === END) ends.push({ n, at, next, line });
    at = next;
  }
  if (!begins.length && !ends.length) return { kind: 'absent' };
  const lines = [...begins, ...ends].map((m) => m.n).sort((a, b) => a - b);
  if (begins.length !== 1 || ends.length !== 1) return { kind: 'malformed', lines, reason: `${begins.length} begin and ${ends.length} end markers` };
  const [b] = begins, [e] = ends;
  if (e.n < b.n) return { kind: 'malformed', lines, reason: 'the end marker comes before the begin marker' };
  const m = b.line.match(BEGIN);
  const options = m?.[2].split(',');
  if (!m || options.some((o) => !OPTIONS.includes(o))) return { kind: 'malformed', lines, reason: 'the begin marker cannot be read' };
  return { kind: 'block', start: b.at, bodyStart: b.next, bodyEnd: e.at, end: e.next, version: m[1], options, join: m[3], digest: m[4] };
}

// The text with the block and the bytes its join added taken out. Join bytes that are no longer there are not taken.
export function removeBlock(text, found) {
  const eol = eolOf(text);
  const joinBytes = eol.repeat(JOINS[found.join]);
  const from = text.slice(found.start - joinBytes.length, found.start) === joinBytes ? found.start - joinBytes.length : found.start;
  return text.slice(0, from) + text.slice(found.end);
}

// The first line (1-based) outside the block that holds Markdown adopt does not handle: a comment mark, a fence, a quote, a
// table pipe, or a line starting with `<`. Adopt only edits a file with none; 0 when there is none.
export function gate(text, found) {
  const bad = (t) => t.includes('<!--') || t.includes('-->') || t.includes('|') || /^[ \t]*(`{3,}|~{3,}|>|<)/.test(t);
  let n = 0, at = text.startsWith(BOM) ? 3 : 0;
  while (at < text.length) {
    const nl = text.indexOf('\n', at), end = nl < 0 ? text.length : nl + 1;
    n++;
    if (!(found?.kind === 'block' && at >= found.start && at < found.end) && bad(text.slice(at, end).replace(/\r?\n$/, ''))) return n;
    at = end;
  }
  return 0;
}

// One target's plan. text is the file's content, or null when it does not exist. Returns the state, the content to
// write (null for no change), the digest of the proposed body, and the options it records. imported holds what scanImports
// found in the files the Claude file imports; adopt moves rules the file already holds into the block.
export function planTarget({
  target, text, options, recorded, version, texts, platform, declined = [], remove = false, adopt: adopting = false, imported = [],
}) {
  const found = inspect(text ?? '');
  if (found.kind === 'malformed') return { state: 'malformed', after: null, note: `${found.reason}, at lines ${found.lines.join(', ')}` };
  if (remove) {
    return found.kind === 'absent' ? { state: 'absent', after: null, note: 'there is no block to remove' }
      : { state: 'remove', after: removeBlock(text, found), options: found.options, recommend: 'apply' };
  }
  const eol = eolOf(text ?? '');
  // The state's plan once the body is known: the plain change, or the adopted one when the file already holds rules.
  const propose = (state, opts, body, plain) => {
    const base = found.kind === 'block' ? removeBlock(text, found) : text ?? '';
    const ov = overlap(body, base, imported);
    const stop = gate(text ?? '', found), adopt = adopting && ov.n > 0 && !stop;
    const after = adopt ? adoptRules(base, `${beginLine(version, opts, 'none', body)}${eol}${body}${END}${eol}`, body) : plain;
    if (after === null) return { state, after, options: opts };
    const recommend = ov.n && stop ? 'decline' : ov.n && !adopting ? 'adopt' : ov.k ? 'decline' : 'apply';
    return {
      state, after, digest: digest(body), options: opts, declined: isDeclined(declined, body),
      overlap: { ...ov, n: adopt ? 0 : ov.n, gate: stop }, recommend,
    };
  };
  if (found.kind === 'absent') {
    const opts = options ?? recorded ?? defaultOptions(platform);
    const body = render(target, opts, texts, eol);
    if (!body) return { state: 'absent', after: null, note: 'these options add nothing for this target' };
    const before = text ?? '';
    const join = before === '' ? 'none' : before.endsWith('\n') ? 'blank' : 'newline';
    return propose('absent', opts, body, before + eol.repeat(JOINS[join]) + beginLine(version, opts, join, body) + eol + body + END + eol);
  }
  const inFile = text.slice(found.bodyStart, found.bodyEnd);
  if (!digests(inFile).includes(found.digest)) {
    return { state: 'edited', after: null, options: found.options, edits: [render(target, found.options, texts, eol), inFile],
      note: 'the block was edited by hand; move your lines below the end marker, then run /ccx:rules again' };
  }
  const opts = options ?? found.options;
  const body = render(target, opts, texts, eol);
  if (digests(body).includes(found.digest) && opts.join() === found.options.join()) {
    return adopting ? propose('current', opts, body, null) : { state: 'current', after: null, options: opts };
  }
  const block = beginLine(version, opts, found.join, body) + eol + body + END + eol;
  // The end marker may have lost its line break; the replacement keeps the file's last byte as it was.
  const tail = found.end === text.length && !text.endsWith('\n') ? block.slice(0, -eol.length) : block;
  return propose('stale', opts, body, text.slice(0, found.start) + tail + text.slice(found.end));
}

const ITEM = /^( {0,3})([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const QUOTE = /^ *>/;
const BREAK = /^ {0,3}(=+|-{2,}|\*{3,}|_{3,})[ \t]*$/;
const HTML = /^ {0,3}<([A-Za-z]|\/)/;
const RAW_OPEN = /^ {0,3}<(script|pre|style|textarea)\b/i, RAW_CLOSE = /<\/(script|pre|style|textarea)>/i;
const lead = (t) => { const m = t.match(ITEM); return m ? lead(m[4]) : t; };
const itemCol = (m) => m[1].length + m[2].length + Math.min(m[3].length, 4);
// The fence state after a line: the opening run while inside a fenced block, else null. extra is the indent a list item allows.
const fenceAfter = (fence, t, extra = 0) => {
  const m = t.match(new RegExp(`^ {0,${3 + extra}}(\`{3,}|~{3,})(.*)$`));
  if (!fence) return m && !(m[1][0] === '`' && m[2].includes('`')) ? m[1] : null;
  return m && m[1][0] === fence[0] && m[1].length >= fence.length && isBlank(m[2]) ? null : fence;
};
// Text is latin1, where the byte A0 of a UTF-8 character reads as U+00A0, so white space here is a space or a tab only.
const HEAD = /^ {0,3}#{1,6}([ \t]|$)/;
// The one definition of a segment, within which code spans pair: a heading line, or consecutive lines up to a blank line, a
// marker, a heading, a new list item, a fence, or a quote. continues(prev, t) says whether line t joins the segment of prev.
const continues = (prev, t) => !(HEAD.test(prev) || isBlank(t) || t.startsWith(BEGIN_PREFIX) || t === END
  || ITEM.test(t) || HEAD.test(t) || QUOTE.test(t) || fenceAfter(null, t));
const isBlank = (t) => /^[ \t]*$/.test(t);
const words = (s) => s.replace(/[ \t]+/g, ' ').replace(/^ | $/g, '');
const within = (skip, s) => skip && s >= skip.start && s < skip.end;

// t with its HTML comments blanked, and the comment and code-span state at its end. A backtick run is a code span when a run
// of the same length follows on the line or, through ahead(), later in the paragraph; a comment mark inside one is text.
// Masked text, in comments and code spans, is NUL: a character that is neither a boundary nor part of an import path.
const MASK = '\0';
function strip(t, open, span, ahead) {
  const marks = [...t.matchAll(/(?<!\\)`+|<!--|-->/g)];
  let out = '', at = 0;
  for (let k = 0; k < marks.length; k++) {
    const [mark, x] = [marks[k][0], marks[k].index];
    if (span) { if (mark[0] === '`' && mark.length === span) span = 0; }
    else if (open) { if (mark === '-->') { out += MASK.repeat(x + 3 - at); at = x + 3; open = false; } }
    else if (mark === '<!--') { out += t.slice(at, x); at = x; open = true; }
    else if (mark[0] === '`') {
      const partner = marks.findIndex((r, j) => j > k && r[0] === mark);
      if (partner > 0) k = partner;
      else if ([...ahead().matchAll(/(?<!\\)`+/g)].some((r) => r[0].length === mark.length)) span = mark.length;
    }
  }
  return [out + (open ? MASK.repeat(t.length - at) : t.slice(at)), open, span];
}

// The lines of a text (byte offsets in the original, a BOM left out) and its units: headings, list items and paragraphs,
// each with its first and last line, its normalized text, and whether it is odd. A unit may match a rule only in the
// plain shape described in docs/decisions.md Part 17; every line also records whether it is scanned for imports.
export function units(text, skip) {
  const lines = [], list = [];
  for (let at = text.startsWith(BOM) ? 3 : 0; at < text.length;) {
    const nl = text.indexOf('\n', at), e = nl < 0 ? text.length : nl + 1;
    lines.push({ s: at, e, t: text.slice(at, nl < 0 ? text.length : nl).replace(/\r$/, ''), scan: false });
    at = e;
  }
  // own is the list item that an open fence or comment belongs to; html is how the open HTML block ends.
  let cur = null, fence = null, comment = false, html = null, own = null, span = 0;
  const flush = () => { if (cur) { cur.norm = words(cur.parts.join(' ')); list.push(cur); } cur = null; };
  lines.forEach((ln, i) => {
    const { s, t } = ln;
    const indent = t.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
    const start = (kind, parts, more) => { flush(); cur = { kind, a: i, b: i, parts, odd: false, bad: false, ...more }; };
    const nested = () => cur?.kind === 'item' && (indent >= cur.col || !cur.gap);
    const hold = () => { cur.parts.push(t); cur.b = i; cur.gap = false; cur.odd = true; };
    const classify = () => {
      if (within(skip, s) || t.startsWith(BEGIN_PREFIX) || t === END) { flush(); fence = html = own = null; comment = false; span = 0; return; }
      if (own && !isBlank(t) && indent < own.col) { fence = own = null; comment = false; flush(); }
      if (QUOTE.test(t) && (fence || comment)) return;
      if (fence) { fence = fenceAfter(fence, t, own?.col ?? 0); if (own) hold(); return; }
      if (html) {
        if (!(html === 'blank' ? isBlank(t) : html.test(t))) return;
        html = null;
        if (!isBlank(t)) return;
      }
      if (i && !continues(lines[i - 1].t, t)) span = 0;
      const ahead = () => {
        let end = i + 1;
        while (end < lines.length && continues(lines[end - 1].t, lines[end].t)) end++;
        return lines.slice(i + 1, end).map((l) => l.t).join('\n');
      };
      const [stripped, open, inSpan] = QUOTE.test(t) ? [t, false, span] : strip(t, comment, span, ahead);
      const hadComment = comment || stripped !== t;
      comment = open;
      span = inSpan;
      const rebase = (x) => ' '.repeat(indent) + x.replace(/^[ \t]+/, '').replace(/[ \t]+$/, ' ');
      const m = stripped === t ? t : rebase(stripped.replaceAll(MASK, ' ')), shown = stripped === t ? t : rebase(stripped);
      if (hadComment && isBlank(m)) { if (nested()) { cur.odd = true; cur.gap = false; } else flush(); return; }
      if (isBlank(m)) { if (cur?.kind === 'item') cur.gap = true; else flush(); return; }
      if (QUOTE.test(m) || BREAK.test(m) || HTML.test(m)) {
        if (cur) { cur.odd = true; cur.skip ||= cur.kind === 'para' && BREAK.test(m); }
        flush();
        if (HTML.test(m)) html = RAW_OPEN.test(m) ? (RAW_CLOSE.test(m) ? null : RAW_CLOSE) : 'blank';
        return;
      }
      const item = m.match(ITEM), head = m.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/);
      const starts = item && !(cur?.kind === 'item' && item[1].length > cur.indent);
      if (fence = fenceAfter(null, item ? lead(m) : m, cur?.kind === 'item' ? cur.col : 0)) {
        if (starts) { start('item', [item[4]], { indent: item[1].length, col: itemCol(item) }); cur.odd = true; }
        else if (nested()) hold(); else flush();
        return;
      }
      if (head && !(cur?.kind === 'item' && indent >= cur.col)) {
        flush();
        list.push(ln.u = { kind: 'head', level: head[1].length, a: i, b: i, odd: false, norm: words(`${head[1]} ${head[2] ?? ''}`) });
        ln.m = shown;
        ln.scan = !t.includes('\t');
        return;
      }
      if (starts) start('item', [item[4]], { indent: item[1].length, col: itemCol(item) });
      else if (cur?.kind === 'item' && cur.gap && indent < cur.col) start('para', [m]);
      else if (cur) { cur.gap = false; cur.parts.push(m); cur.b = i; }
      else if (indent < 4) start('para', [m]);
      else return;
      const plain = starts ? item[3].length === 1 && item[4] !== '' && !ITEM.test(item[4]) && !QUOTE.test(item[4])
        : cur.a === i || cur.kind === 'para' ? indent <= 3 : indent >= cur.col && indent <= cur.col + 3 && !item && !head;
      cur.bad ||= !plain || t.includes('\t') || m.includes('|');
      cur.odd ||= cur.bad || hadComment;
      ln.u = cur;
      ln.m = shown;
      ln.scan = !cur.bad;
    };
    const wasOpen = !!(fence || comment);
    classify();
    if (!wasOpen && (fence || comment)) own = cur?.kind === 'item' && (cur.a === i || indent >= cur.col) ? cur : null;
    if (!fence && !comment) own = null;
  });
  flush();
  // A unit matches only when it starts at column 0, since indented text may belong to a container, when its raw lines are
  // its match text (nothing was stripped or hidden from it), and when what follows it ends it: a blank line, the end, a
  // heading, a ccx marker, or a plain item.
  const ends = (t) => t === undefined || isBlank(t) || /^#{1,6}([ \t]|$)/.test(t) || t.startsWith(BEGIN_PREFIX) || t === END
    || /^([-*+]|\d{1,9}[.)]) [^ \t]/.test(t);
  for (const u of list) {
    u.odd ||= /^[ \t]/.test(lines[u.a].t) || !ends(lines[u.b + 1]?.t);
    const raw = words(lines.slice(u.a, u.b + 1).map((l) => l.t).join(' '));
    u.odd ||= raw.replace(u.kind === 'item' ? /^([-*+]|\d{1,9}[.)])( |$)/ : /^$/, '') !== u.norm;
  }
  return { lines, list };
}
const ruleNorms = (list) => list.filter((u) => u.kind !== 'head' && !u.odd).map((u) => u.norm);

// How the rules in body overlap what is already there: n of them in base (the file without its block), k in what the
// imported files hold, and per import. total counts the body's items and paragraphs, not its headings.
function overlap(body, base, imported) {
  const rules = ruleNorms(units(body).list), mine = new Set(ruleNorms(units(base).list));
  const count = (set) => rules.filter((r) => set.has(r)).length;
  return { total: rules.length, n: count(mine), k: count(new Set(imported.flatMap((i) => [...i.units]))),
    imports: imported.map(({ ref, units: set, missed, unreadable }) => ({ ref, n: count(set), missed, unreadable })) };
}

// The text with every rule unit that body also holds taken out, a heading of body too when its section held only such
// units, and one blank line after a removed run that had blank lines around it. block goes where the first removed line was.
export function adoptRules(text, block, body) {
  const { lines, list } = units(text), mine = units(body).list;
  const same = (head) => new Set(mine.filter((u) => (u.kind === 'head') === head).map((u) => u.norm));
  const rules = same(false), heads = same(true), gone = lines.map(() => false), extra = new Set();
  const blank = (i) => isBlank(lines[i].t);
  list.filter((u) => u.kind !== 'head' && !u.odd && rules.has(u.norm)).forEach((u) => { for (let i = u.a; i <= u.b; i++) gone[i] = true; });
  // Last heading first, so a removed subheading counts when its parent's section is judged.
  list.filter((u) => u.kind === 'head' && !u.odd && heads.has(u.norm)).reverse().forEach((h) => {
    const end = list.find((u) => u.kind === 'head' && u.a > h.a && u.level <= h.level)?.a ?? lines.length;
    const only = lines.slice(h.a + 1, end).every((_, i) => blank(h.a + 1 + i) || gone[h.a + 1 + i]);
    if (only && list.some((u) => u.kind !== 'head' && u.a > h.a && u.a < end && gone[u.a])) gone[h.a] = true;
  });
  gone.forEach((g, i) => {
    if (!g || gone[i - 1]) return;
    let y = i;
    while (gone[y + 1]) y++;
    if (i > 0 && blank(i - 1) && y + 1 < lines.length && blank(y + 1)) extra.add(y + 1);
  });
  let out = text.slice(0, lines[0]?.s ?? 0), put = false;
  lines.forEach((l, i) => {
    if (!gone[i] && !extra.has(i)) out += text.slice(l.s, l.e);
    else if (gone[i] && !put) { out += block; put = true; }
  });
  return out;
}

// A unit's text with its code spans blanked. A span is a backtick run and the next run of the same length in the unit; a
// run with no partner, or after a backslash, is literal text.
function hide(par) {
  const runs = [...par.matchAll(/(?<!\\)`+/g)];
  let out = '', at = 0;
  for (let k = 0; k < runs.length; k++) {
    const close = runs.slice(k + 1).find((r) => r[0].length === runs[k][0].length);
    if (!close) continue;
    const end = close.index + close[0].length;
    out += par.slice(at, runs[k].index) + par.slice(runs[k].index, end).replace(/[^\n]/g, MASK);
    at = end;
    k = runs.indexOf(close);
  }
  return out + par.slice(at);
}

// Imports as Claude reads them: an @ at a line start or after white space, in the lines units() marks as scanned, outside
// code spans; the path runs to the first space not escaped with a backslash, or the first masked character (cut).
export function imports(text, found) {
  const { lines } = units(text, found?.kind === 'block' ? found : null), groups = new Map(), out = [];
  lines.forEach((ln, i) => { if (ln.scan && !ln.u.skip) groups.set(ln.u, [...(groups.get(ln.u) ?? []), i]); });
  // Spans pair within a segment: a run of consecutive scanned lines that continues() joins.
  const runs = [];
  for (const rows of groups.values()) {
    rows.forEach((i, k) => (rows[k - 1] === i - 1 && continues(lines[i - 1].t, lines[i].t) ? runs.at(-1).push(i) : runs.push([i])));
  }
  for (const rows of runs) {
    const seen = hide(rows.map((i) => lines[i].m).join('\n')).split('\n');
    rows.forEach((i, k) => {
      for (const m of seen[k].matchAll(/(?<=^|[ \t])@(?!["'])((?:\\ |[^ \t\0])+)/g)) {
        out.push({ n: i + 1, token: `@${m[1]}`, path: m[1].replace(/\\ /g, ' ') });
      }
    });
  }
  return out;
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
    claude: { path: resolved(join(claudeDir, 'CLAUDE.md')), logical: join(claudeDir, 'CLAUDE.md') },
    codex: !existsSync(codexDir) ? { path: join(codexDir, 'AGENTS.md'), skip: `there is no Codex home at ${codexDir}, so nothing is written there` }
      : existsSync(join(codexDir, 'AGENTS.override.md'))
        ? { path: join(codexDir, 'AGENTS.md'), skip: `Codex reads ${join(codexDir, 'AGENTS.override.md')} instead of AGENTS.md, so the Codex file is left alone` }
        : { path: resolved(join(codexDir, 'AGENTS.md')) },
  };
  if (!all.codex.skip && existsSync(all.claude.path) && existsSync(all.codex.path)) {
    const a = statSync(all.claude.path, { bigint: true }), b = statSync(all.codex.path, { bigint: true });
    if (a.ino !== 0n && a.dev === b.dev && a.ino === b.ino) all.codex.skip = 'it is the same file as the Claude target, so the Codex file is left alone';
  }
  return all;
}

// Reads what the Claude file imports, as Claude loads it: relative paths against the importing file's directory, breadth
// first, four hops. Each top-level import gets the rule units of every file it reaches, the count of imports that could
// not be followed (unreadable or over a bound; imports past the last hop are not loaded by Claude, so are not counted),
// and whether its own file could not be read.
export function scanImports(text, file, found, home, logical = file) {
  const cache = new Map();
  const load = (path) => {
    let key = path;
    try { key = realpathSync(path); } catch {}
    if (!cache.has(key)) {
      let got = null;
      try {
        const info = statSync(path);
        if (cache.size < MAX_FILES && info.isFile() && info.size <= MAX_BYTES) got = readFileSync(path, 'latin1');
      } catch {}
      cache.set(key, got);
    }
    return cache.get(key);
  };
  const where = (from, raw) => {
    const path = Buffer.from(raw, 'latin1').toString('utf8');
    return path.startsWith('~/') ? join(home, path.slice(2)) : resolve(dirname(from), path);
  };
  return imports(text, found).map(({ n, token, path }) => {
    const beside = where(logical, path), first = beside !== where(file, path) && load(beside) === null ? where(file, path) : beside;
    const reach = { ref: `${n}: ${token}`, units: new Set(), missed: 0, unreadable: false }, seen = new Set([first]);
    for (const queue = [[first, 1]]; queue.length;) {
      const [at, hop] = queue.shift(), body = load(at);
      if (body === null) { reach.missed++; reach.unreadable ||= hop === 1; continue; }
      ruleNorms(units(body).list).forEach((u) => reach.units.add(u));
      for (const next of imports(body).map((i) => where(at, i.path))) {
        if (seen.has(next)) continue;
        if (hop < HOPS) { seen.add(next); queue.push([next, hop + 1]); }
      }
    }
    return reach;
  });
}

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const loadTexts = (root = ROOT) =>
  Object.fromEntries([...new Set(Object.values(PARTS).flatMap(Object.values))].map((f) => [f, readFileSync(join(root, 'rules', f), 'latin1')]));
export const pluginVersion = (root = ROOT) => JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8')).version;
export const readText = (path) => { try { return readFileSync(path, 'latin1'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };
const readJson = (path) => { try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return undefined; throw e; } };
export const loadState = (dataDir) => ({ options: {}, created: {}, declined: {}, ...readJson(join(dataDir, STATE_FILE)) });
const save = (dataDir, file, value) => { mkdirSync(dataDir, { recursive: true }); writeAtomic(join(dataDir, file), `${JSON.stringify(value, null, 2)}\n`, undefined, 'utf8'); };
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
function writeAtomic(path, text, backup, encoding = 'latin1') {
  const tmp = `${path}.ccx-tmp-${process.pid}`;
  writeFileSync(tmp, text, encoding);
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
  const shown = (text) => Buffer.from(text, 'latin1').toString('utf8');
  const lines = [`target: ${name} ${t.path}`];
  if (t.skip) return [...lines, `state: skipped; ${t.skip}`, 'change: none'];
  const declined = plan.declined ? ' (you declined this text before)' : '';
  lines.push(`state: ${plan.state}${declined}${plan.note ? `; ${plan.note}` : ''}`);
  if (plan.options) lines.push(`options: ${plan.options.join(',')}`);
  const ov = plan.overlap;
  for (const i of ov?.imports ?? []) {
    const holds = i.missed ? `holds at least ${i.n} of ${ov.total} rules; ${i.missed} import${i.missed === 1 ? '' : 's'} could not be read`
      : i.n ? `holds ${i.n} of ${ov.total} rules` : 'holds none of the rules';
    lines.push(`note: line ${shown(i.ref)} imports a file that ${i.unreadable ? 'cannot be read' : holds}; it is left as it is`);
  }
  if (ov?.n) lines.push(`note: ${ov.n} of ${ov.total} rules already present outside the block; applying duplicates them`);
  if (ov?.n && ov.gate) {
    lines.push(`note: adopt leaves this file alone because line ${ov.gate} holds Markdown it does not handle; trim the copy by hand, then run /ccx:rules`);
  }
  if (plan.edits) lines.push(diff(...plan.edits.map(shown), 'the rules this plugin would write', `the block in ${t.path}`));
  if (plan.after === null) return [...lines, 'change: none'];
  const advice = {
    adopt: ['note: /ccx:rules --adopt moves those lines into the block'],
    decline: [`note: ${ov?.k} of ${ov?.total} rules come from imports; applying duplicates them; declining leaves this file unchanged`],
  }[plan.recommend] ?? [];
  const proposed = diff(shown(t.text ?? ''), shown(plan.after), t.path, `${t.path} (proposed)`);
  return [...lines, 'change: ready', `recommend: ${plan.recommend}`, ...advice, proposed];
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
  const adopt = rest.includes('--adopt');
  if (adopt && verb !== 'plan') refuse(`--adopt goes with plan, not ${verb}`);
  const args = rest.filter((a) => a !== '--adopt');
  const at = args.indexOf('--options');
  if (at >= 0 && args.length > at + 2) refuse(`unexpected argument "${args[at + 2]}" after --options list`);
  if (at >= 0) options = parseOptions(args[at + 1], platform);
  const texts = loadTexts();
  const version = pluginVersion();
  const out = [], plans = {};
  let recorded = false;
  for (const [name, t] of Object.entries(all)) {
    if (!t.skip) t.text = readText(t.path);
    const imported = verb === 'plan' && name === 'claude' && t.text ? scanImports(t.text, t.path, inspect(t.text), home, t.logical) : [];
    const plan = t.skip ? { after: null } : planTarget({ target: name, text: t.text, options, recorded: state.options[name], version, texts, platform,
      declined: state.declined[name] ?? [], remove: verb === 'remove', adopt, imported });
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
