# Changelog

One changelog for the suite. Each release has a subsection per component. The source
repos' own changelogs are kept under `docs/history/`.

## Unreleased

### Suite

- Started the reimagine-code suite and imported the histories of codex-lite-cc,
  claude-codex-loop, codex-code-review, and repo-docs, unchanged, under `imports/`.
- Added the Codex catalog, `.agents/plugins/marketplace.json`, which lists `recode` and
  `repo-docs`. The Claude catalog lists `recode`, `recode-loop`, and `repo-docs`.

### recode

- Moved codex-lite 0.9.0 into the suite as `recode` 0.1.0. The plugin, the command
  prefix `/recode:`, the script `recode.mjs`, the message prefix `recode: `, and the
  test-only variables `RECODE_*` are renamed. The plugin data directory becomes
  `~/.claude/plugins/data/recode-reimagine-code/`. Behavior is otherwise unchanged.
- Fixed a timed-out run leaving Codex's shell commands running, so they could change files
  after the result was printed. Codex 0.159.2 runs each command in its own process group,
  which the timeout's SIGTERM missed. The timeout now sends SIGINT, and Codex stops its
  commands before it exits.
- Fixed a stopped run's request reaching Codex. When Claude sent the request Write and the
  script call together and the Write failed on a file left by a stopped run, the script
  sent that earlier task. The prompt hook now deletes the session's request file, so the
  script refuses instead.
- Added `/recode:rules`, which adds, updates, or removes one marked block of house rules in
  the Claude `CLAUDE.md` and the Codex `AGENTS.md`. Each change is shown as a diff and made
  only when the user agrees to that file, after a backup. The rules come from forge-ops at
  commit 948ce5f.
- Added a session start notice for when the house rules block is older than the plugin's.
- `/recode:setup` now lists the old plugins this suite replaces, with the command that
  removes each. It runs none of them.
- Added the Concise Plain output style, `recode:Concise Plain`, and the same writing rules
  for claude.ai and ChatGPT in `chat/instructions.md`.

### recode-loop

- Moved ccl 0.10.0 into the suite as `recode-loop` 0.1.0. The commands become
  `/recode-loop:run` and `/recode-loop:plan`, with the same inputs and flags, and they
  call the bridge as `recode:ask`, `recode:review`, and `recode:implement`.
- Installing the loop installs `recode`, at any version from 0.1.0 up to, not including,
  1.0.0. The checks for codex-lite 0.8.0 and 0.9.0 are gone, and an additional repository
  in Multi-repo mode is always reviewed with `recode:review --cwd`.
- Removed the retry for a Codex skill missing from the session's skill list. A fresh
  session lists a dependency's skills, so a failed call follows the usual fallback.
- Added the `codex` option. Set to false, every run behaves as `--no-codex`.
- Fixed: on a private repository without GitHub Pro, every run ended `blocked` at the CI
  watch, because GitHub refuses the branch rules read there. That refusal now means no
  rulesets apply, and the required checks come from branch protection alone.

#### Breaking

The loop's files in your repositories take the new name, and the old ones are not read:

- The run directory `.ccl/<run-id>/` becomes `.recode/<run-id>/`, and the loop adds
  `.recode/` to `.git/info/exclude`. An old `.ccl/` line there can be deleted.
- The repo config `.ccl.json` becomes `.recode.json`. A repo with `.ccl.json` and no
  `.recode.json` ends the run in `blocked` with a message to rename the file.
- Committed snapshots go to `specs/recode/<run-id>/`, not `specs/ccl/<run-id>/`.
- Worktrees are `<checkout>-recode-<run-id>`, not `<checkout>-ccl-<run-id>`.
- Reports start `# recode run report`, and the PR status comment starts
  `Status from the recode run`.

### recode (Codex)

- Moved codex-code-review-general 0.1.0 into the suite as the Codex plugin `recode`
  0.1.0. The five `general-code-review*` skills are unchanged. Install it as
  `recode@reimagine-code`, after removing `codex-code-review-general@codex-code-review`.
- Dropped the verbatim `codex-code-review` plugin and its upstream sync scripts. The
  NOTICE now names the upstream commit the skills were adapted from.

### repo-docs

- Moved repo-docs 0.1.1 into the suite as 0.1.2, with no change in behavior. On both
  hosts it installs as `repo-docs@reimagine-code`.
