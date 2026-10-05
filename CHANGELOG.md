# Changelog

One changelog for the suite. Each release has a subsection per component. The source
repos' own changelogs are kept under `docs/history/`.

## 0.3.2 - 2026-10-05

### ccx

- `ask` and `review` run in a repository whose directory name ends in a space. Before,
  the path lost its trailing spaces, so the bridge could not start Codex, or ran it in a
  sibling checkout without the space.
- The Windows sandbox setting is read from a `config.toml` in which an earlier multiline
  string holds an escaped `\"""`. Before, such a file read as having no setting, so
  setup's sandbox rows failed and `ask` and `review` ran without the sandbox flag.
- `/ccx:rules` saves its plan as UTF-8, so a config directory with a non-ASCII name
  works. Before, the plan held a corrupted path or invalid JSON, and apply refused, or
  wrote under a wrong directory.
- `/ccx:rules` shows UTF-8 text in its diffs and import notes as written. Before, an
  accented letter showed as two garbled characters. The bytes written were always right.
- `/ccx:rules` refuses `--options core, writing`, a list split by a space, instead of
  silently dropping `writing`, and the command text says to write the list with no
  spaces.

### ccx-loop

- After the reviewer swaps to its Claude fallback, every later reviewer call in the run,
  plan follow-up rounds, Step 5 rounds, and CI repair reviews, goes to that fallback.
  Before, those steps read as Codex, so a `--no-codex` run could call a `ccx:` skill
  after a CI failure.
- A change requested at plan approval reruns the plan's verification and the risk floor
  and chooses each slice's implementer again; the tier never falls. Before, it got only
  one more review round.
- Plan confirmation compares a local branch with the base commit only when the branch
  exists. Before, a run that continued a branch with no local branch of that name ended
  `blocked` there.
- The skill names where the user's instruction and settings files are read from:
  `$CLAUDE_CONFIG_DIR`, else `~/.claude`.
- Every `gh api` call in the CI watch, handoff, and multi-repo texts passes
  `--hostname <host>`, the host Step 0 recorded. Before, the calls went to gh's default
  host, so a GitHub Enterprise run with a github.com login also saved published its PR
  and then ended `blocked` on the first CI read.
- The CI watch reads the PR's `state` at every poll and ends `blocked` when it is not
  `OPEN`, naming the state. Before, a PR closed during the watch could be reported as
  `done`.
- A `pull_request_target` workflow is judged by its file on the default branch, in the
  CI watch and in the deploy ask-first before pushing. Before, one the PR itself added
  could make the watch wait for a check that never comes.

### ccx (Codex)

- Version 0.3.2, to stay in step with `ccx`. No change.

### cca

- Moved claude-codex-audit 0.8.1 into the suite as `cca` 0.9.0, with its git history.
  It installs as `cca@reimagine-code` from this repository's Claude catalog; the old
  marketplace `vibecodedapps-claude-codex-audit` is retired.
- Stage 6 calls the bridge as `ccx:ask` and looks for a plugin id starting `ccx@` at
  0.1.0 or later, where it called `codex-lite:ask` and looked for `codex-lite@` at
  0.7.0 or later. Without `ccx`, the second opinion swaps to `cca:adversary` as before.
- The stage 6 ledger entry's `codex.codex_lite_version` key is now `codex.ccx_version`.
- A run started under 0.8.1 or earlier reruns from stage 1 on resume, since the plugin
  version is an input of every stage.
- The sh suites and fixtures run through `npm test` from `tests/cca/`. The records from
  before the move are under `docs/history/claude-codex-audit/`.
- Released as 0.9.1; the move above shipped as 0.9.0.
- The README's standalone check commands name `tests/cca/lint.sh`,
  `tests/cca/fixture/build.sh`, and `tests/cca/fixture/verify.sh`. Before, each had an
  extra `cca/` in its path and exited 127.
- The README's pairing section describes the handoff `ccx-loop` writes, `handoff.md` and
  `cca-manifest.json` under `.ccx/<run-id>/`, and the `/cca:audit` command it suggests.
  Before, it said the pairing was manual and the loop wrote no handoff.
- `/cca:handoff` prints a manifest for the session's bundles as a fenced JSON block when
  it was given neither a manifest nor a PR as a URL or `github:owner/repo#n`, since
  `/cca:audit` cannot learn the branch and base otherwise. Before, the printed command
  stopped in stage 1 for want of a branch and base.
- `/cca:handoff` copies check commands, paths, and commit subjects as recorded, tool
  names included, and rewrites only prose that credits a model, agent, or tool with the
  work. Before, the rule read as rewriting the commands too, so an auditor could not
  reproduce a check.
- Every `runs.json` update holds a `runs.json.lock` directory in the plugin data
  directory and rereads the registry under it. Before, two audits running at once could
  lose each other's entry, so `/cca:resume` and `/cca:act` could not find a run.
- A refused or failed `runs.json` write no longer ends with a bare `/cca:resume <run-id>`
  that cannot work: the run says at once that resume and act cannot find it, records
  that in the brief so the report's Coverage repeats it, and prints the entry to add by
  hand.
- The read-only check accepts another cca run's or a handoff's file under the primary
  repository's `<scratch>/cca/` and lists it as such. Before, two audits of the same
  repository ended each other `blocked`.
- The report's revision hash falls back to `shasum -a 256` when `sha256sum` is absent,
  and the step stops, writing no `report.md`, unless it has a 64-character hex digest.
  Before, a PATH without `sha256sum` wrote `revision: sha256:` with no digest, which
  `live.sh check` and `/cca:act` then rejected.
- A manifest `groups` entry whose slugged name is `tests`, `hygiene`, `tests-hygiene`,
  `interactions`, `combined`, or `unticketed`, or that shares its slug with another
  entry, stops the run before stage 1 with one line. Before, such a group wrote the
  same scope files as a specialist scope and the ledger rejected its ids as duplicates.
- The late adversary runs at low tier when `live/findings.md` or `live/claims.md`
  exists, and at every tier its prompt names the live files and carried files that
  exist. Before, a claim-only live result at low launched no late adversary, and at
  medium and high the prompt never named `live/claims.md`, so a live `true, reproduced`
  claim could end `not verified, not reproduced`.
- A second barrier top-up passes the preservation check when the saved copy, less its
  final `status: complete` line, equals the same number of leading lines of the new
  file. Before, a correct second top-up failed the check, so the scope failed and the
  run ended `partial`.
- Every patch diff in the stage files and the agents' commands passes `--no-ext-diff
  --no-textconv --no-color`. Before, a user's `diff.external` or `color.ui=always` put
  tool output or escape codes in `diffs/<bundle>.diff`.
- The rule that a live check's query, place, and results hold no semicolon sits in the
  finding schema, where every finding reads it. Before, it sat only in the run-once
  section, and a semicolon in any other finding's live check field was cut when the
  report split the field.
- The attribution rule in `common.md` says an ignored file written by a run an agent
  logged is allowed and reported, matching `SKILL.md` and the README. Before, it said
  "a check run".
- `revert-tests.sh` refuses a partial clone with `partial clones are not supported`,
  exit 2, and sets `GIT_NO_LAZY_FETCH=1` for every git call. Before, on a
  `--filter=blob:none` clone it fetched the missing blobs into the audited repository
  over the network and wrote a full result, and the read-only check noticed nothing.
- `memory.sh` follows a symlink given as the memory directory. Before, such a path
  printed `none` for every key.
- `ledger.sh` reports a finding heading with extra leading spaces, or an id wrapped in
  `**` or backticks, as malformed. Before, it read the heading as text and dropped the
  finding, so a blocker could leave the ledger without an error.
- `ledger.sh check --through 7` fails when `converged.md` ends inside a code fence.
  Before, every item after a stray opening fence was ignored and the check passed.
- `revert-tests.sh` lists a test-code path holding a tab as not used and never runs it.
  Before, it ran the path, which failed to copy, and the result showed an empty verdict
  and a counts line short by one.
- `readonly.sh check` no longer fails when `find` cannot read an ignored directory, such
  as a `pgdata/` with mode 000, or when an ignored directory changes under it; the
  diagnostic still prints. Before, every check exited 2 and the run ended `blocked`.

### repo-docs

- Migrating a repository whose only instruction file is `.claude/CLAUDE.md` makes it the
  root `AGENTS.md`, rewriting relative paths. Before, the text could be read as renaming
  it in place to `.claude/AGENTS.md`, which Claude Code loads and Codex never does.
- The adapter guidance no longer names Amazon Bedrock or disabled telemetry as sessions
  that cannot read `AGENTS.md`; `references/platforms.md` version-qualifies them, with
  the first session after an upgrade, and says to try a fresh session first.
- Released as 0.1.5.

## 0.3.1 - 2026-10-05

### ccx

- `/ccx:rules` writes through a symlinked `CLAUDE.md` or `AGENTS.md` to the file it
  points to, so the link survives. Before, apply replaced the link with a regular file.
  A target with more than one hard link, or a link to a missing file, is refused, and
  nothing is written. When `CLAUDE.md` and `AGENTS.md` are the same file, the Codex
  target is skipped.
- `/ccx:rules` keeps the target file's permissions. Before, a `0600` file became `0644`.
- `/ccx:rules` skips the Codex file at apply time when the Codex home was removed, or an
  `AGENTS.override.md` was added, after the diff was shown. Before, it wrote anyway.
- `/ccx:rules` reads a block or an import on the first line of a file that starts with a
  UTF-8 byte order mark. Before, such a block read as malformed.
- Stopping `ask`, `do`, `implement`, or `review` with SIGINT or SIGTERM now stops Codex,
  and on macOS and Linux the commands it started, and ends with `status: failed`. A
  signal during the bridge's git calls before the Codex turn, or during `setup`'s
  checks, stops the run before anything else starts, with `status: refused`. Before,
  Codex kept running after the bridge was gone.
- `ask` with `--resume <id>` or `--resume=<id>` and a Windows line ending after the id
  forwards the question without a leading newline.
- `/ccx:rules` says that `--options` replaces the options in use, so adding Codex's
  Writing section takes `--options core,writing`. Before, `--options writing` read as an
  addition and removed the core rules.
- The README says the sandbox probe reads your Codex configuration; only the Codex turns
  run with `--ignore-user-config`. It also gives update steps, and says that updating
  `ccx-loop` does not update `ccx`.

### ccx-loop

- A failed Codex implementer or fix call is cleaned up against a snapshot taken before
  the call. Only paths that call changed outside its slice are restored, ignored paths and
  `.ccx/` are never touched, and a path that was already changed before the call ends the
  run in `blocked`, as does an untracked file outside the slice whose content changed.
  Before, the cleanup could revert earlier slices' work and delete ignored files such as
  `.env`.
- The CI watch compares the PR head with the commit the run pushed, at every poll and
  before it reports green, and ends in `blocked` on a mismatch. Before, a push by someone
  else during the watch could be reported as `done`. The cca manifest names the PR only
  when its live remote head is the run's commit.
- The CI watch reads every page of active rules, commit statuses, and workflow runs.
  Before, a required check or a failing status past the first 30 was missed.
- The README and the catalog entry say that updating `ccx-loop` does not update `ccx`, and
  that one reviewer, Codex or Claude, reviews a run.

### ccx (Codex)

- Version 0.3.1, to stay in step with `ccx`. No change.

### repo-docs

- Released as 0.1.4.
- The commit reminder now fires for a commit made from a subdirectory of the repository.
  Before, it looked for instruction files only below the current directory.
- The reminder fires only when the command itself runs `git commit`, including with git
  options such as `-C` with a quoted or Windows path, after `cd`, or in PowerShell.
  Before, it also fired for commands that only mentioned it, such as
  `git log --grep commit` or a commit message in a PR body.

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
