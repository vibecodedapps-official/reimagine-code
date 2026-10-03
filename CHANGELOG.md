# Changelog

One changelog for the suite. Each release has a subsection per component. The source
repos' own changelogs are kept under `docs/history/`.

## Unreleased

### Suite

- Started the reimagine-code suite and imported the histories of codex-lite-cc,
  claude-codex-loop, codex-code-review, and repo-docs, unchanged, under `imports/`.

### recode

- Moved codex-lite 0.9.0 into the suite as `recode` 0.1.0. The plugin, the command
  prefix `/recode:`, the script `recode.mjs`, the message prefix `recode: `, and the
  test-only variables `RECODE_*` are renamed. The plugin data directory becomes
  `~/.claude/plugins/data/recode-reimagine-code/`. Behavior is otherwise unchanged.
- Fixed a timed-out run leaving Codex's shell commands running, so they could change files
  after the result was printed. Codex 0.159.2 runs each command in its own process group,
  which the timeout's SIGTERM missed. The timeout now sends SIGINT, and Codex stops its
  commands before it exits.
