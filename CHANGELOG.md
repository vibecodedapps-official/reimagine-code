# Changelog

One changelog for the suite. Each release has a subsection per component. The source
repos' own changelogs are kept under `docs/history/`.

## 0.3.0 - 2026-10-04

### ccx

- Version 0.3.0, to stay in step with `ccx-loop`. No change.

### ccx-loop

- The loop has four effort tiers: `low`, `medium`, `high`, and `xhigh`. The max tier is
  gone, and an xhigh-shaped change with a risk floor trigger is now xhigh.
- The final review has one reviewer role per run, not Codex and Claude together. A run
  is higher-risk when the change carries a risk floor trigger, touches more than eight
  distinct files across all slices, or adds a new module, type, interface, or rule
  section that another file cites. A higher-risk run gets Claude: `code-review` at the
  tier's level, or its Opus stand-in in a worktree run and for each additional
  repository. Any other run gets Codex `gpt-6-astra`. The rule is judged on the plan and
  again before every review, and a run that turns higher-risk stays on Claude. It picks
  the reviewer only and never raises the tier.
- Plan review is Codex `gpt-6-astra` at every tier. Implementation is `gpt-6.1-sol` at
  low and medium and `gpt-6-astra` at high and xhigh. `gpt-6-luna` is no longer used.
- At high and xhigh, a slice that has a risk floor trigger, owns more than eight files,
  or adds a cited new module is implemented by Sonnet, not Opus. Opus no longer
  implements. A Sonnet slice whose call errors stops the run.
- `code-review` is needed only for a higher-risk run. A lower-risk run, including one
  under `--no-codex`, does not need it. A lower-risk run that turns higher-risk in the
  final review or a CI repair, and finds the skill missing, ends `blocked`. A higher-risk
  run under `--no-codex` still gets Claude.
- In a multi-repo run the chosen role covers every changed repository, and the patch
  files are written whichever role is chosen.

### ccx (Codex)

- Version 0.3.0, to stay in step with `ccx-loop`. No change.

### Breaking

- `--effort max` is removed from `/ccx-loop:run` and `/ccx-loop:plan`. Both commands
  reject it and point to `--effort xhigh`.
- A run no longer gets a Codex review and a Claude review of the same diff. A higher-risk
  run gets Claude only, and any other run gets Codex only.

## 0.2.0 - 2026-10-04

### ccx

- Renamed from `recode`. The commands are `/ccx:setup`, `rules`, `ask`, `review`, `do`,
  and `implement`, and the bridge script is `scripts/ccx.mjs`.
- `/ccx:rules` reads the block that `/recode:rules` wrote, under the `recode:house-rules`
  markers. The session notice names such a block, a run of `/ccx:rules` rewrites it under
  the `ccx:house-rules` markers after the usual diff, and `/ccx:rules --remove` takes
  out either. A file holding both blocks is reported as malformed.
- Setup also lists `recode-loop@reimagine-code`, then `recode@reimagine-code`, on Claude
  Code, and `recode@reimagine-code` on Codex, as old plugins.
- Fixed a rules block reading as edited by hand after its file's line endings changed,
  as when an editor or Git turns a CRLF file into LF. The block then stopped updating
  and the session notice went quiet. A marker's digest is now taken over the body with
  CRLF read as LF, and the two older digests are still accepted.
- The plugin data directory is not carried over, so the rules state starts empty. If
  `/recode:rules` created your `CLAUDE.md`, `/ccx:rules --remove` leaves it empty instead
  of deleting it, and a rules text you declined can raise the session notice again. You
  can delete `~/.claude/plugins/data/recode-reimagine-code/`.

### ccx-loop

- Renamed from `recode-loop`, and it depends on `ccx` `>=0.2.0 <1.0.0`. The commands are
  `/ccx-loop:run` and `/ccx-loop:plan`, and the skill is `ccx-loop:ccx-loop`. It calls the
  bridge as `ccx:ask`, `ccx:review`, and `ccx:implement`.
- A repository with `.recode.json` or `.ccl.json` and no `.ccx.json` ends the run
  `blocked`, with a message to rename the file. Ignoring it would drop the owner's
  `checks` and `timeouts`.

### ccx (Codex)

- Renamed from `recode`. The config table is `[plugins."ccx@reimagine-code"]`. Codex has no
  rename: run `codex plugin add ccx@reimagine-code`, then `codex plugin remove
  recode@reimagine-code`.

### Breaking

Claude Code moves the plugins by itself, but nothing else. The Claude catalog has a
`renames` map from `recode` to `ccx` and from `recode-loop` to `ccx-loop`. The first
plugin command or session start after the marketplace updates renames the plugins in your
`enabledPlugins`, and keeps the loop's `codex` option. It also drops the install
records, so install the new names once. Old uninstall lines then fail, because those plugins
are no longer installed.

- **Plugins.** `recode@reimagine-code` is now `ccx@reimagine-code` on Claude Code, and
  `recode-loop@reimagine-code` is now `ccx-loop@reimagine-code`. On Codex,
  `recode@reimagine-code` is now `ccx@reimagine-code`, with the config table
  `[plugins."ccx@reimagine-code"]`.
- **Install lines.** `/plugin install ccx@reimagine-code`, `/plugin install
  ccx-loop@reimagine-code`, and `codex plugin add ccx@reimagine-code`. The uninstall
  lines change the same way. The option is set with `/plugin configure
  ccx-loop@reimagine-code`.
- **Commands.** `/recode:ask`, `review`, `implement`, `do`, `setup`, and `rules` are now
  `/ccx:ask` and so on. A Skill call to `recode:<name>` is now `ccx:<name>`.
  `/recode-loop:run` and `/recode-loop:plan` are now `/ccx-loop:run` and
  `/ccx-loop:plan`, and the skill is `ccx-loop:ccx-loop`.
- **Output style.** `recode:Concise Plain` is now `ccx:Concise Plain`. The renaming does
  not move the setting: select the style again.
- **Allow rule.** The Bash rule from `/ccx:setup` names `scripts/ccx.mjs`, so paste the
  new one.
- **Bridge paths.** `scripts/recode.mjs` is now `scripts/ccx.mjs`, and messages start
  `ccx: `. The data directory is now `~/.claude/plugins/data/ccx-reimagine-code/` and starts
  empty. Probe names start `.ccx-probe-` and `.ccx-sandbox-probe-`. The test-only
  variables start `CCX_`.
- **House rules.** The markers are `<!-- ccx:house-rules begin ... -->` and `<!--
  ccx:house-rules end -->`, and the old ones are still read. Backups are
  `<file>.ccx-backup-<timestamp>`.
- **Loop paths in your repositories.** `.recode/<run-id>/` is now `.ccx/<run-id>/`, and
  `.recode.json` is now `.ccx.json`. Snapshots go to `specs/ccx/<run-id>/`. Worktrees
  are `<checkout>-ccx-<run-id>`. Reports start `# ccx run report`, and the PR status
  comment starts `Status from the ccx run`.

What still reads an old name: the old rules markers, `.recode.json` and `.ccl.json` (to
block with a message), and the `renames` map. Nothing else does. repo-docs is unchanged
at 0.1.3.

## 0.1.3 - 2026-10-04

### recode

- The house rules gain two rules, from forge-ops at commit 9faabda. Under Working:
  before naming a cause or acting on one, run the check that could rule it out, or call
  the cause unverified. Under Code: a code comment only where the code is unclear, with
  ticket numbers and change history in the commit message. If you added the rules
  block, the session start notice now says it is out of date; run `/recode:rules` to
  update it.
- Fixed `/recode:rules`, the session start notice, and setup's list of old plugins doing
  nothing when the plugin's path goes through a symlink, such as a linked `~/.claude`.
  Their scripts exited with no output and no error.
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
