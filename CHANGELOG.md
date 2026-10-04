# Changelog

One changelog for the suite. Each release has a subsection per component. The source
repos' own changelogs are kept under `docs/history/`.

## 0.1.3 - 2026-10-04

### recode

- The house rules gain two rules, from forge-ops at commit 9faabda. Under Working:
  before naming a cause or acting on one, run the check that could rule it out, or call
  the cause unverified. Under Code: a code comment only where the code is unclear, with
  ticket numbers and change history in the commit message. If you added the rules
  block, the session start notice now says it is out of date; run `/recode:rules` to
  update it.
- The README now says the old Edit rule also breaks auto mode on Windows.

### recode-loop

- Version 0.1.3, to stay in step with `recode`. No change.

### recode (Codex)

- Version 0.1.3, to stay in step with `recode`. No change.

## 0.1.2 - 2026-10-04

### recode

- `/recode:setup` no longer prints an Edit allow rule for the plugin's data directory.
  That rule never stopped the prompt for the request file: Claude Code treats the file
  as sensitive and asks in default mode with or without the rule. In auto mode the rule
  made the request file's Write fail with "The server-side auto mode classifier gave no
  verdict". If you added it, remove it from `permissions.allow` in your Claude Code
  settings. It starts with `Edit(` and names `plugins/data/recode-reimagine-code`. Setup
  still prints the Bash rule.
- The README now says that in default mode no allow rule or hook stops the request-file
  prompt, so a headless run in default mode stops there. For unattended calls, use auto
  mode.

### recode-loop

- Version 0.1.2, to stay in step with `recode`. No change.

### recode (Codex)

- Version 0.1.2, to stay in step with `recode`. No change.

## 0.1.1 - 2026-10-04

### recode

- Fixed `/recode:setup`, `do`, and `implement` failing the sandbox probe on their first
  run in a new Codex home on Windows. There, one of Codex's first sandboxed commands
  took about 30 s, and the probe stopped each call at 30 s. Each probe call now gets
  120 s. Other local commands keep 30 s.

### recode-loop

- Version 0.1.1, to stay in step with `recode`. No change.

### recode (Codex)

- Version 0.1.1, to stay in step with `recode`. No change.

### repo-docs

- Released as 0.1.3. The commit reminder now also runs before Claude Code's PowerShell
  tool, which a new profile on Windows uses as its primary shell. Before, a commit made
  through it got no reminder.
- The README now says Codex on Windows needs Git's `bin` folder, such as
  `C:\Program Files\Git\bin`, on `PATH`. Without it the hook does nothing.

## 0.1.0 - 2026-10-03

### Suite

- First release. The suite joins codex-lite-cc, claude-codex-loop, codex-code-review,
  and repo-docs in one repository, with their git histories. Every renamed command,
  path, and data directory is listed under Breaking below.
- Two catalogs, both named `reimagine-code`. The Claude catalog lists `recode`,
  `recode-loop`, and `repo-docs`. The Codex catalog, `.agents/plugins/marketplace.json`,
  lists `recode` and `repo-docs`.
- Each Claude plugin is tagged `<plugin>--v<version>`. `main` is the release ref, so a
  Codex user who needs to hold back can add the marketplace at a tag.

### recode

- Moved codex-lite 0.9.0 into the suite as `recode` 0.1.0. Apart from the renames under
  Breaking and the changes below, behavior is unchanged.
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

### recode (Codex)

- Moved codex-code-review-general 0.1.0 into the suite as the Codex plugin `recode`
  0.1.0. The five `general-code-review*` skills are unchanged. Install it as
  `recode@reimagine-code`, after removing `codex-code-review-general@codex-code-review`.
- Dropped the verbatim `codex-code-review` plugin and its upstream sync scripts. The
  NOTICE now names the upstream commit the skills were adapted from.

### repo-docs

- Moved repo-docs 0.1.1 into the suite as 0.1.2, with no change in behavior. On both
  hosts it installs as `repo-docs@reimagine-code`.

### Breaking

Nothing reads the old names.

- **Plugins.**
  - `codex-lite@vibecodedapps-codex-lite` is now `recode@reimagine-code`.
  - `ccl@vibecodedapps-claude-codex-loop` is now `recode-loop@reimagine-code`.
  - On Codex, `codex-code-review-general@codex-code-review` is now
    `recode@reimagine-code`, with the config table `[plugins."recode@reimagine-code"]`.
  - `repo-docs@repo-docs` is now `repo-docs@reimagine-code` on both hosts.
  - `/recode:setup` lists the old plugins it finds, with the command that removes each.
- **Commands.**
  - `/codex-lite:ask`, `review`, `implement`, `do`, and `setup` are now `/recode:ask`
    and so on, and a Skill call to `codex-lite:<name>` is now `recode:<name>`.
  - `/ccl:run` and `/ccl:plan` are now `/recode-loop:run` and `/recode-loop:plan`.
- **Bridge paths.**
  - The script `scripts/codex-lite.mjs` is now `scripts/recode.mjs`, and its messages
    start `recode: `.
  - The data directory `~/.claude/plugins/data/codex-lite-vibecodedapps-codex-lite/` is
    now `~/.claude/plugins/data/recode-reimagine-code/`. The allow rules that
    `/recode:setup` prints name the new paths. Rules naming the old ones can be deleted.
  - The sandbox probe's temporary names start `.recode-probe-` and
    `.recode-sandbox-probe-`, not `.codex-lite-probe-` and `.codex-lite-sandbox-probe-`.
  - The test-only variables `CODEX_LITE_CODEX_BIN`, `CODEX_LITE_TIMEOUT_MS`, and
    `CODEX_LITE_PROBE_TARGET` are now `RECODE_CODEX_BIN`, `RECODE_TIMEOUT_MS`, and
    `RECODE_PROBE_TARGET`.
- **Loop paths in your repositories.**
  - The run directory `.ccl/<run-id>/` is now `.recode/<run-id>/`, and the loop adds
    `.recode/` to `.git/info/exclude`. An old `.ccl/` line there can be deleted.
  - The repo config `.ccl.json` is now `.recode.json`. A repo with `.ccl.json` and no
    `.recode.json` ends the run in `blocked` with a message to rename the file.
  - Committed snapshots go to `specs/recode/<run-id>/`, not `specs/ccl/<run-id>/`.
  - Worktrees are `<checkout>-recode-<run-id>`, not `<checkout>-ccl-<run-id>`.
  - Reports start `# recode run report`, and the PR status comment starts
    `Status from the recode run`.
