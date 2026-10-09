# Spokes

Platform behavior named here is recorded, with its source, in `references/platforms.md`.

## Pointer grammar

- Each spoke is listed once: `- <path>: <what it holds>. <when to read it>.` The hub
  has at most one line that is exactly `## Spokes` once a carriage return is stripped.
  The index is the lines after it, up to the next line starting with `#` or the end of
  the file. A hub with no such line has no index, which is a finding.
- A pointer matches the POSIX basic regular expression `^- [^ ][^ ]*: .`. The path is
  the text between the leading `- ` and the first `: `; the rest is prose. A blank line
  (empty, or only spaces and tabs, once a carriage return is stripped) is a separator. A
  column-0 `- ` line that does not match is a malformed pointer and an error. Any other
  such line is a finding.
- The path is bare and relative to the repo root: no backticks, markdown link, trailing
  slash, or leading `@`. A leading `@` makes Claude Code import the file at launch.
- A path with a space or `: ` cannot be expressed. Rename the file, a move maintain
  mode proposes, or leave it unindexed with a finding.
- The prose says what the spoke holds and when to read it. A directory spoke's condition
  reads "Read before editing under `<dir>/`", so a Codex session started at the root can
  reach it. A pointer outside the index, or an index in free prose, is a finding.

## Adapters

- Default: none. Claude Code reads `AGENTS.md` directly unless a `CLAUDE.md`,
  `.claude/CLAUDE.md`, or `CLAUDE.local.md` exists in or above the working directory.
- Add adapters only when a session in use cannot read `AGENTS.md` under the applicable
  version or configuration conditions in `references/platforms.md`, or when someone
  needs a `CLAUDE.local.md`. For a first session after an upgrade, try a fresh session.
- All or nothing, since once any `CLAUDE.md` counts Claude Code reads only `CLAUDE.md`
  files: no tracked `CLAUDE.md`, or each is an adapter beside an `AGENTS.md` and each
  tracked `AGENTS.md` has one. A tracked `CLAUDE.md` test fixture leaves this to judgment.
- An adapter is exactly `@AGENTS.md` plus at most one `LF` or `CRLF`, in a regular file,
  never a symlink, which a Windows checkout can turn into a text file.
- Claude-only mechanics go in `.claude/rules/`, never in an adapter, and that directory
  never holds a rule another agent must follow. The user-level **Project instructions**
  value `claude-md-and-agents-md` is not part of the framework; a repo cannot set it.

## Judgment checks

1. A factual claim (command, path, behavior, default) that the code contradicts.
2. A rule in both the hub and a directory spoke with the same meaning.
3. A rule scoped by a path it names rather than by the tasks it governs.
4. A file an agent needs that no pointer routes to, or a pointer with no reading
   condition. A file only humans read may stay unindexed.
5. A hub that holds anything outside its four sections.
6. An index in free prose, a pointer outside the index, an index line that is neither
   a pointer, a blank, nor a column-0 `- ` line, or a spoke that cannot be indexed.
7. `AGENTS.override.md` or `AGENTS.local.md` (Codex reads the first in place of
   `AGENTS.md`; Claude Code reads neither), `.claude/AGENTS.md` (the platforms load it
   under different conditions), or a `.claude/rules/` rule other agents need.
8. Size: a file long enough to be skimmed. Platform limits are facts, not thresholds.
9. Effective loading, confirmed by the session verification.

## Maintain-mode safeguards

- Adopt existing file locations; a pointer beats a move. Exceptions: a spoke whose
  filename has a space or `: `, and moving the sole instruction file out of `.claude/`.
- Never rewrite dated or historical entries; append a correction. Repair inbound links in
  the same change that moves content. Never delete a real constraint to shorten a file.
- Make each `@path` import but an adapter line a pointer or inline it. Drop an import of
  an `AGENTS.md` unless it is an adapter line. Report, never inline, an import of a file
  the repo does not track: keep its line where it is in a file that stays or is renamed,
  and when its file is deleted or made exact, name the import in the report for the user
  to place.
- A repo whose only tracked instruction file is a `CLAUDE.md` or `.claude/AGENTS.md`: make
  it the root `AGENTS.md`, rewriting relative paths when it leaves `.claude/`. Move
  Claude-only lines to `.claude/rules/`, add `## Spokes`, and no adapter unless required.
  An untracked sole file is left alone; the repo gets first setup.
- A repo with a tracked symlinked `AGENTS.md` or `CLAUDE.md`, a tracked
  `.claude/AGENTS.md` or `.claude/CLAUDE.md`, or a tracked `CLAUDE.md` that is not
  exact, keeps its file locations unless it is the sole instruction file covered above;
  the first maintain run normalizes it. Replace each symlink with a regular file. Route
  every line but an import through the placement rule, so only Claude-only mechanics
  reach `.claude/rules/`. Rename a tracked `CLAUDE.md` outside `.claude/` with no sibling
  `AGENTS.md` to `AGENTS.md` and place its lines the same way. Delete a tracked
  `.claude/AGENTS.md` or `.claude/CLAUDE.md`; delete every other tracked `CLAUDE.md`, or,
  if the adapter policy requires adapters, make each exact and add any missing one. Write
  `## Spokes` and report each change. Except for that sole-file move, no file leaves its
  directory, so normalization is not a move.

## Modes and severity

Audit reads only; maintain writes, under the safeguards above. Whether Claude Code loads
the hub also depends on files and settings outside the repo (an ancestor `CLAUDE.md`, a
`CLAUDE.local.md`, the user-level **Project instructions** setting), so audit ends with a
session verification: a fresh session at the repo root lists `AGENTS.md` among the
instruction files it loaded or, with adapters, lists the `CLAUDE.md` files.

An **error** is a finding that cannot be wrong: two or more `## Spokes` lines, a
malformed pointer, a missing pointer path, or a tracked adapter set neither empty nor
complete and exact (a symlink is never exact; a repo with a `CLAUDE.md` fixture is
judgment). All else is a **finding**. No script tests for errors yet; audit reports them
by reading. A mechanical check is a later, optional add-on. The plugin's one hook only
reminds the agent to audit when it runs `git commit`; it never blocks the commit.
