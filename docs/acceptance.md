# Acceptance

Hand-run checks for the suite. Each milestone adds its items. An item is
`N. **Title.** Setup: ... Command: ... Expected: ... Rerun when ...`, and an item not yet
run says "Not yet run." Runs before cutover use scratch profiles: `CLAUDE_CONFIG_DIR` and
`CODEX_HOME` pointing at directories outside the repo, so the author's own setup does not
change.

The source repos' acceptance files are kept under `docs/history/`. Items from them that
name a plugin are rerun under the new names and recorded here.

## Items

1. **Bridge in a scratch profile.** Setup: scratch `CLAUDE_CONFIG_DIR` and `CODEX_HOME`,
   `recode` installed from this repository's catalog, and a scratch git repository.
   Command: `/recode:setup`, then `/recode:ask` with a short question, then
   `/recode:implement` from a test skill that asks for a one-line edit. Expected: setup
   reports the Codex version and login, and an allow rule that names the installed
   `recode` path (before 0.1.2, also an Edit rule for the `recode-reimagine-code` data
   directory); ask prints Codex's answer; implement edits the scratch repository and its
   footer shows the change. Covers R9 and R15. Rerun when a bridge command, the setup
   report, or the data directory changes. Run 2026-10-03, setup rerun 2026-10-04; see the
   record.
2. **codex-lite items under the new names.** Setup: as each item says, in scratch
   profiles. Command: items 1, 5, 8, 11, 12, 16, 17, 18, and 19 of
   `docs/history/codex-lite-cc/acceptance.md`, the items that name the plugin or its
   variables, with `/codex-lite:` read as `/recode:` and `CODEX_LITE_` as `RECODE_`.
   Item 15, the Windows install, runs on the Windows work machine with R53. List drawn
   2026-10-03 at the start of M2. Expected: each item's own result. Rerun when that
   file's own conditions say. Run 2026-10-03; see the record.
3. **House rules in a scratch profile.** Setup: scratch `CLAUDE_CONFIG_DIR` whose
   `CLAUDE.md` holds text of its own, scratch `CODEX_HOME` holding an `AGENTS.md`, and
   `recode` installed from this repository's catalog. Command: `/recode:rules`, choose
   the options, and accept each target; start a new session and ask it to quote a rule
   from the block; then `/recode:rules --remove` and accept each target. Repeat with no
   Codex home. Expected: each target's diff is shown and asked about separately; the new
   session quotes the rule; after removal each file equals its backup byte for byte; with
   no Codex home the Codex target is reported as skipped and no directory is created.
   Covers R33, R38, R41, and R42. Rerun when `rules.mjs`, the rules command, or a rules
   file changes. Run 2026-10-03; see the record.
4. **Staleness notice and decline.** Setup: as item 3, with this block after the text
   of `CLAUDE.md` and an empty line, whose digest matches its body: begin line
   `<!-- recode:house-rules begin version=0.0.1 options=core join=blank digest=6d3e610aaf815551 -->`,
   then the line `old rules`, then `<!-- recode:house-rules end -->`. Command: start an
   interactive session; then `/recode:rules` and decline the Claude change; then start
   another session. Expected: the first session shows one line naming the file and
   `/recode:rules`; after the decline the next session shows nothing. Covers R43 and
   R45. Rerun when `suite.mjs` or the hooks change. Run 2026-10-03; see the record.
5. **Output style and old plugins.** Setup: as item 3, with `codex-lite` also installed
   from its old marketplace. Command: `/output-style`, then `/recode:setup`. Expected: the
   picker lists `recode:Concise Plain`, and replies follow it once chosen; setup's
   output ends with `claude plugin uninstall codex-lite@vibecodedapps-codex-lite`, and
   nothing is uninstalled. Covers R16 and R46. Rerun when the style or the old-plugin
   list changes. Run 2026-10-03; see the record.
6. **Loop install and its dependency.** Setup: a scratch profile with this
   repository's catalog added and neither plugin installed. Command: `claude plugin
   install recode-loop@reimagine-code`, then `claude plugin disable
   recode@reimagine-code`, then `claude plugin uninstall recode-loop@reimagine-code`.
   Expected: the install also installs `recode`; the disable is refused, naming
   `recode-loop`; the uninstall reports `recode` as no longer needed, for `claude plugin
   prune`. Covers R4 with the real plugins; spike M0.1 covered the update order. Rerun
   when the loop's `dependencies` change. Run 2026-10-03; see the record.
7. **Loop plan runs on a local remote.** Setup: scratch git repositories, each with
   `math.mjs`, `test.mjs`, a `package.json` whose `test` script passes, and a local bare
   `origin`; one also holds `.ccl.json` with `{"checks":["npm test"]}`. Command:
   `/recode-loop:plan "<a one-function change>" --effort low`, in headless sessions: with
   `--no-codex`; in the repository with `.ccl.json`; with `codex` absent from `PATH`;
   with the `codex` option set to false, never set, and set to true. Expected: each run
   calls `recode-loop:recode-loop` with the invocation block. The `.ccl.json` run ends
   `blocked` before writing anything and says to rename the file. The others end
   `plan-only` with the plan and a report headed `# recode run report` under
   `.recode/<run-id>/`, and `.recode/` in `.git/info/exclude`. With `--no-codex`, `codex`
   absent, or the option false, no Codex call is made, each Codex role runs on its Claude
   fallback, and the report says why. With the option unset or true, the block says
   `no-codex: false` and Codex is called. Covers R17, R20, R21, R23, and part of R22.
   Rerun when a loop command, the option, or Step 0 changes. Run 2026-10-03; see the
   record.
8. **Loop runs to the end on a local remote.** Setup: as item 7, without `.ccl.json`.
   Command: `/recode-loop:run "<the same change>" --no-codex --effort low`, in separate
   repositories: with `--no-publish` and a committed `.recode.json` of
   `{"commit": true}`; with `--no-publish` alone; after `git update-index
   --skip-worktree` on an edited file; with `--confirm-plan`, answering no; with
   `--continue` naming a branch on the remote; and with `--repo` naming a second such
   repository. Also `/recode-loop:plan` with the committed `.recode.json`. Expected: the
   plan run ends `plan-only` with nothing under `specs/recode/` and a clean tree; the
   `--no-publish` runs and the runs on a local remote end `prepared` with no commit,
   nothing under `specs/recode/`, and the report giving the commit and push commands;
   the `--no-publish` run writes no `handoff.md` or `cca-manifest.json` and says why;
   the skip-worktree run works in `<parent>/<checkout>-recode-<run-id>` and names its
   removal; the declined plan ends `plan-only`; the `--continue` run works on that
   branch; the `--repo` run changes both repositories. Covers ccl items 16, 65, 72, and
   172 under the new names, and the local parts of R22. Rerun when Step 0, Step 7, or an
   artifact path changes. Run 2026-10-03; see the record.
9. **Loop runs that publish.** Setup: a throwaway GitHub repository with issue #1, a
   one-line bug, and a passing `npm test`; a second one on the same host for the
   multi-repo run; Codex logged in. Command: `/recode-loop:run #1 --effort low`; then
   ccl items 4, 75, and 114 under the new names, and a `--continue` run on a branch with
   an open PR. Expected: Codex implements and Claude publishes a PR that closes #1;
   with `"commit": true` the snapshot lands in `specs/recode/<run-id>/`; each item's own
   result. Covers the rest of R22 and R25. Rerun when Step 7 or the CI watch changes. Run
   2026-10-03; see the record.
10. **ccl items under the new names.** The list was drawn 2026-10-03 at the start of M4
    from `docs/history/claude-codex-loop/acceptance.md`: of its 174 items, 58 name a
    renamed string, 35 of them only through bridge calls. The items rerun hinge on a
    renamed path or a removed gate: 1 (in item 7), 16, 65, 72, and 172 (in item 8), and
    4, 75, and 114 (in item 9). Item 66 tested the skill-listing retry that R24 removed;
    item 7's runs check what is left of it, that `run.md` records the availability check.
    Expected: each item's own result with `/ccl:` read as `/recode-loop:`, `.ccl` as
    `.recode`, and `specs/ccl` as `specs/recode`. Rerun when that file's own conditions
    say. Items 1, 4, 16, 65, 72, 75, 114, and 172 run 2026-10-03; see the record.

11. **Codex catalog and install.** Setup: a new scratch `CODEX_HOME` holding a
    `config.toml` with only the model, effort, sandbox, and approval settings, and a
    Codex login. Command: `codex plugin marketplace add
    vibecodedapps-official/reimagine-code`, with `--ref <branch>` before the branch is
    merged; `codex plugin list`; `codex plugin add recode@reimagine-code`; `codex plugin
    add repo-docs@reimagine-code`. Expected: the `reimagine-code` marketplace lists
    exactly `recode` and `repo-docs`, from `plugins/recode-codex` and `plugins/repo-docs`,
    and they install at 0.1.0 and 0.1.2. Covers R2. Rerun when the Codex catalog or a
    Codex manifest changes. Run 2026-10-03; see the record.
12. **Code review on Codex.** Setup: as item 11, in a scratch git repository with
    `math.mjs`, `test.mjs`, and a `package.json` whose `test` script passes, then an
    uncommitted change that renames an export, gives `add` a third argument with a
    default, and adds an untested function. Command: `codex exec --json -s read-only "Run
    the general-code-review skill on the uncommitted changes in this repository." <
    /dev/null`. Expected: a review with findings; under `$CODEX_HOME/sessions`, the main
    session reads `general-code-review/SKILL.md` and its subagent sessions read each of
    `general-code-review-breaking-changes`, `-change-size`, `-context`, and `-testing`
    from the installed plugin. Covers R29. Rerun when a skill changes. Run 2026-10-03;
    see the record.
13. **repo-docs on Codex.** Setup: as item 11, in a scratch git repository whose
    `AGENTS.md` index points to `docs/style.md`, which exists, and `docs/missing.md`,
    which does not. Command: `codex exec --json -s read-only "Use repo-docs to audit this
    repository's instructions." < /dev/null`; then `codex` in that repository, choosing
    "Review hooks" at the "Hooks need review" prompt and pressing `t` to trust all; then
    `codex exec --json -s danger-full-access "Append the line 'Prefer plain words.' to
    docs/style.md, then run exactly: git commit -am 'docs: extend the style guide'" <
    /dev/null`. Expected: the audit reads the skill from the installed 0.1.2 and reports
    the missing spoke as an error; `config.toml` gains a `trusted_hash` for the hook; the
    commit goes ahead and its session file holds the hook's message starting "repo-docs:
    this command commits". Without `< /dev/null`, `codex exec` waits for input and never
    starts. Covers R30 on Codex. Rerun when the skill or the hook changes. Run
    2026-10-03; see the record.
14. **repo-docs on Claude Code.** Setup: a scratch profile with this repository's
    catalog added and `repo-docs` installed; a copy of item 13's repository before its
    commit. Command: `claude -p "Use repo-docs to audit this repository's
    instructions."`, then `claude -p` with item 13's commit request, each with
    `--output-format stream-json --verbose`. Expected: the audit calls the Skill tool with
    `repo-docs:repo-docs` and reports the missing spoke as an error; the commit goes
    ahead, and the session transcript under the profile's `projects/` holds a
    `hook_additional_context` attachment for that Bash call, starting "repo-docs: this
    command commits". The stream output does not show hook context. Covers R30 on Claude
    Code. Rerun when the skill or the hook changes. Run 2026-10-03; see the record.
15. **repo-docs on this repository.** Setup: as item 14. Command: `claude -p "Use
    repo-docs to audit this repository's instructions. This is a read-only audit: change
    no file."` at this repository's root. Expected: no errors, and `git status`
    unchanged. The audit's session check needs a session that loads `AGENTS.md`: with
    `CLAUDE_CONFIG_DIR` set elsewhere, `~/.claude/CLAUDE.md` loads as a project file for
    a repository under the home directory, and `AGENTS.md` does not, so that check is
    made in the author's own profile. Covers R31. Rerun when the hub, a file under
    `plugins/repo-docs/`, or the skill changes. Run 2026-10-03; see the record.

16. **Always-on cost.** Setup: a logged-in scratch profile with this repository's
    catalog added from `main` and `recode-loop` and `repo-docs` installed. Command:
    `claude plugin details <plugin>@reimagine-code` for `recode` and `recode-loop`.
    Expected: "Always-on" at most 1,300 tokens for `recode` and at most 510 for
    `recode-loop`. Covers R8. Rerun at each release. Run 2026-10-03 for 0.1.0, and
    2026-10-04 for 0.1.1 and 0.1.2; see the records.
17. **Tags.** Setup: the release commit on `main`. Command: `claude plugin tag --push`
    on `plugins/recode`, then `plugins/recode-loop`, then `plugins/repo-docs`; then
    `git ls-remote --tags origin`. Expected: each tag command checks the manifest against
    its catalog entry and pushes; the remote holds a `<plugin>--v<version>` tag for each
    plugin's new version, and no bare `v` tag. Covers R49. Rerun at each release. Run
    2026-10-03 for 0.1.0, and 2026-10-04 for 0.1.1 and 0.1.2; see the records.
18. **Install from GitHub.** Setup: on macOS and on Windows 11 with both CLIs from npm,
    new scratch profiles on each host. Command: the four lines of R3, then `claude plugin
    install recode-loop@reimagine-code` and `codex plugin add
    repo-docs@reimagine-code`; then `/recode:setup` and `/recode:ask` with a short
    question. Expected: each install succeeds at the tagged version; the loop's install
    also installs `recode`; setup passes; the ask prints Codex's answer; `codex plugin
    list` shows both Codex plugins. Run from the private repository after tagging, then
    once per host from the public one. Covers R3 and R4. Rerun at each release. Run on
    macOS and Windows 2026-10-03 for 0.1.0, from the private repository. Run
    2026-10-04 for 0.1.1 on macOS, from the private repository and then the public one,
    and on Windows from the public one. Run 2026-10-04 for 0.1.2 on macOS and Windows,
    from the public repository; see the records.
19. **Windows.** Setup: the Windows 11 work machine with both CLIs from npm, the suite
    installed as in item 18, and a test repository checked out under a path that holds
    a space. Command: `/recode:ask` and `/recode:implement` with a one-line change;
    `/recode:rules` against a `CLAUDE.md` with CRLF line endings; a commit by the agent
    in each host, Codex after trusting the hook. Expected: the ask and implement succeed;
    the rules block is added with the file's CRLF endings kept; the repo-docs hook adds
    its reminder on both hosts. Covers R53. Rerun when the bridge's spawn code, the rules
    command, or the hook changes. Run 2026-10-03; see the record.

## Record of runs

Each entry gives the date, the machine, the Claude Code, Codex, and Node versions, the
items run, and the result.

### 2026-10-03: M2, recode 0.1.0

macOS 27.0, Claude Code 2.1.284, codex-cli 0.159.2, Node 26.4.0. The scratch profile was
`~/.cache/recode-acceptance/`, with a copy of the Codex config and login as its
`CODEX_HOME`. recode was installed from the GitHub marketplace at `feat/bridge`, commit
6674c3c, and was byte for byte the branch's `plugins/recode/`. Every run was a headless
`claude -p` session or the entry script. No interactive session ran, because the scratch
profile opens first-run onboarding and a login screen.

- **Always-on cost.** `claude plugin details` reported about 1,190 tokens, and R8 allows
  1,300.
- **Item 1 passed.** `/recode:setup` reported Codex 0.159.2, the login, a proven
  `workspace-write` sandbox, and rules naming `recode-reimagine-code` and the installed
  `recode/0.1.0` path. `/recode:ask` answered. A test skill's `implement` edited a
  worktree and the footer showed both changed files.
- **Item 2, codex-lite items under the new names:**
  - 1 passed in auto mode: the request and a denied flag name arrived byte for byte, the
    Bash command was the constant one, and `--base topic/$(id)` reached git literally. In
    default mode the Write is refused as "a sensitive file", as since codex-lite 0.2.0.
  - 5 passed: a missing probe runtime and a probe target inside the working directory each
    made `setup` and `do` refuse. Windows parts not run.
  - 8 passed: the rules parse as JSON, and the Bash rule runs only the installed path.
  - 11 passed: plain words reached `review --base main` and `ask` with no approvals, and a
    plain-words `do` made no call.
  - 12 passed in part. A fresh session with an unread leftover read it, rewrote it, and
    succeeded. A resumed session counts its own leftover as read, so the quit-and-resume
    route no longer reaches step 2. The `do` case failed; see the first defect.
  - 16 passed, checked in debug logs and transcripts: one routing note per plain-words
    prompt, none for a typed `/recode:do` or a project command naming Codex, and Claude
    converged after Codex's answer in the same turn. `--model astra` reached Codex, which
    refused the model for this account.
  - 17 passed: both resume forms reused the thread read-only and Codex remembered it. A
    bare `--resume` in a fresh session was refused before Codex ran.
  - 18 passed in part: the 1 s and 30 s timeouts, typed, model-invoked, and resumed, all
    ended `status: timeout`, and the Bash-tool cut-off printed no `status:` line. The
    status line in a background-task notification was not run. See the second defect.
  - 19 passed in part: the skill's three lines reached the request file exactly, the run
    edited only the worktree, and the three refusals and the read-only resume held. The
    interactive default-mode prompt was not run; headless, the Skill call was gated as
    "Execute skill: recode:implement".
  - 15 is Windows only and was not run.
- **Defect: a leftover request can reach Codex through `do`.** With an unread leftover, in
  2 of 5 runs Claude sent the Write and the script's Bash call in one message. The Write
  failed with "File has not been read yet", the pre-approved Bash call ran anyway, and
  Codex did the leftover task. The command text is identical to codex-lite 0.9.0 after the
  rename, which batched in 0 of 4 runs, so the defect is probably inherited.
- **Defect: a timeout leaves Codex's shell commands running.** codex-cli 0.159.2 starts
  each command in its own process group, so stopping Codex's group misses it. An
  `implement --timeout 25` running `sleep 40 && echo late > late.txt` printed a clean tree
  and `status: timeout`, then wrote `late.txt`. codex-lite 0.9.0 did the same in a run of
  the same day, so the defect is inherited.
- **Observed, not judged:** a timed-out `ask` saves no thread, so a bare `--resume` right
  after it is refused. In one default-mode run Claude ran the Bash step after a failed
  Write; the script refused with "no request file", so nothing reached Codex.

### 2026-10-03: M3, recode 0.1.0

macOS 27.0, Claude Code 2.1.288 (the native install updated itself after M2),
codex-cli 0.159.2, Node 26.4.0. The scratch profile was `~/.cache/recode-acceptance/`,
now past onboarding, in auto mode. Its `CODEX_HOME` is a copy of the Codex config with
no login. recode was installed from the GitHub marketplace at `feat/house-rules`, commit
32867ba, and was byte for byte the branch's `plugins/recode/`. Commands ran as headless
`claude -p` sessions, each answer sent with `--resume`. The interactive sessions ran in
a pseudo-terminal, and their screen text was saved. The real `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md` had the same sha256 after the runs as before, and no backup
appeared beside them.

- **Always-on cost.** `claude plugin details` in the scratch profile reported about
  1,256 tokens, with `rules` at about 50, and R8 allows 1,300. In an empty profile with
  no login, the same version reported about 985. The estimate depends on the profile,
  probably on the model, so R8 is measured in a logged-in profile.
- **Item 3 passed.** The scratch `CLAUDE.md` held a heading and a marker line, and the
  Codex `AGENTS.md` held two lines. `/recode:rules` ran `status`, then asked for options,
  offering `core` and `writing`. After `core,writing` it ran `plan`, showed both diffs
  verbatim, and asked about each file separately. After "yes" to both, each file was
  written, with a backup named `.recode-backup-20261003152710`, in UTC. A new session
  answered the marker, and quoted "Before adding a dependency, once per package, with
  the reason." and the first line of the Tests section. `/recode:rules --remove`, with
  "yes" to both, left each file equal to its original and to its first backup (`cmp`).
  With no `CLAUDE.md` and `CODEX_HOME` set to a missing directory, status showed
  `codex: skipped`. The plan said "there is no Codex home at ..., so nothing is written
  there". Applying created `CLAUDE.md` with `join=none` and recorded it as created.
  Removal printed "removed ..., which /recode:rules had created and which held nothing
  else", and the file was gone. The missing Codex home was never created.
- **Item 4 passed.** With the stale block planted, an interactive session showed, at
  startup, "SessionStart:startup says: recode: the house rules in
  /Users/joe/.cache/recode-acceptance/claude/CLAUDE.md are older than this plugin's; run
  /recode:rules to update them". `/recode:rules` planned the Claude block as `stale`,
  without asking for options, because the block records them. After "no" to both
  targets, the state recorded both declines. The next interactive session reached its
  prompt with no notice. The installed hook, run by hand, printed nothing and exited 0.
- **Item 5 passed.** `/output-style` listed `recode:Concise Plain` with its description.
  A session with that style set reported `output_style` `recode:Concise Plain` in its
  init event, and answered in two plain sentences. With codex-lite 0.9.0 installed from
  its old marketplace, `/recode:setup` ran its two commands. Its block ended with
  `claude plugin uninstall codex-lite@vibecodedapps-codex-lite` and
  `codex plugin remove codex-code-review-general@codex-code-review`, from the copied
  Codex config. Both plugins were still installed afterward. codex-lite was then
  removed from the scratch profile.
- **Defect, fixed.** Claude sent `apply claude` and `apply codex` in one message in
  every run, so they ran at once. These runs came out right, but in a sandbox 16 of 20
  such pairs lost one target's update. Fixed in aad54df with a lock; see decision 4 of
  Part 3 in docs/decisions.md.
- **Item 3, rerun at aad54df.** Reinstalled from the branch, `core`, then "yes" to
  both: Claude again sent both applies in one message, the state recorded both
  targets' options, and the plan file was empty. `--remove`, "yes" to both: each file
  equaled its original.
- **Not run.** A Codex session quoting a rule from its `AGENTS.md`, because the scratch
  Codex home has no login. The Windows parts: the `windows` option and its default.

### 2026-10-03: M4, recode-loop 0.1.0

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The scratch profile
was `~/.cache/recode-acceptance/`, in auto mode, with a Codex home that has no login.
`recode-loop` was installed from the GitHub marketplace at `feat/loop`: commit f01a1f4
first, then 1b657af and 8cc36de for the option fixes below. Each repository was a
scratch git repository under `/tmp` with a local bare `origin`, so every run saw host
`other`. Commands ran as headless `claude -p` sessions, each reply sent with `--resume`.
No run had a permission denial.

- **Always-on cost.** `claude plugin details` reported about 497 tokens for the loop,
  under ccl 0.10.0's 510 measured in the same profile, after the description trim in
  `docs/decisions.md` Part 4 item 3.
- **Item 6 passed.** Installing `recode-loop` printed "+ 1 dependency: recode".
  `claude plugin disable recode@reimagine-code` was refused: "recode is still required
  by recode-loop". Uninstalling the loop printed "1 auto-installed dependency no longer
  needed: recode. Run `claude plugin prune` to remove." Uninstalling also cleared the
  saved option, as spike M0.2 found.
- **Item 7, at f01a1f4.** Every run called the Skill tool with
  `recode-loop:recode-loop` and the invocation block. With `--no-codex`, the run ended
  `plan-only` with `plan.md`, `run.md`, `inputs.md`, and a `report.md` headed
  `# recode run report` under `.recode/<run-id>/`, `.recode/` appended to
  `.git/info/exclude`, and the swap reported as "Codex `gpt-6.1-sol` -> Agent `opus`,
  reason `--no-codex`". The repository holding `.ccl.json` ended `blocked` at Step 0.1 in
  3 seconds: "rename `.ccl.json` to `.recode.json` and run the same command again", with
  nothing created. With `codex` absent from `PATH`, the swap reason was "`codex
  --version`: command not found". No run file named `ccl` or `codex-lite` except to
  record that no `.ccl.json` existed.
- **Defect, fixed.** With the option saved as false, the skill text read "That option
  reads `false`", yet `run.md` recorded "Codex availability: available (codex-cli
  0.159.2); --no-codex not set", and the run called `recode:ask` twice. Fixed in
  1b657af and 8cc36de; see `docs/decisions.md` Part 4 item 2.
- **Item 7, at 1b657af.** With the option unset, the block said `no-codex: false` and the
  run called `recode:ask`. With it false, three runs at once each sent
  `no-codex: true`, made no Codex call, and named the option in the report. With it
  true, the block said `no-codex: true` and `run.md` recorded "`--no-codex` set (plugin
  option `codex` = true, flag decides)": a second defect, from the wording.
- **Item 7 passed, at 8cc36de.** In fresh repositories, all eight runs ended
  `plan-only` and sent the right value. With the option unset, twice, and set to true,
  three times at once, the block said `no-codex: false` and each run called
  `recode:ask` twice, which failed with 401 on the scratch Codex home and swapped to
  `opus`. With it false, three times at once, the block said `no-codex: true`, no run
  called Codex, and each report named the option as the reason. The option was left
  set to true.
- **`/config`.** Typing `codex` in `/config` showed a "Use Codex" row for `recode-loop`
  with the value `true`. The install message names `/plugin configure
  recode-loop@reimagine-code`, the command the loop's README gives.
- **Item 8 passed, at 1b657af, with `--no-codex --effort low`.** The plan run with a
  committed `{"commit": true}` ended `plan-only`, with a clean tree and no `specs/`.
  The `--no-publish` run with that config ended `prepared`, on a new local branch with
  `math.mjs` and `test.mjs` modified, no new commit, no `specs/`, the commit and push
  commands in the report, and "Handoff: not written" with "no commit from this run".
  The `--no-publish` run without it ended the same way, wrote no `handoff.md` or
  `cca-manifest.json`, and reported "Audit: not suggested". The audit plugin was not
  installed, so the report said `/cca:handoff` needs it, rather than that it can write
  one after a commit. With `notes.txt` flagged skip-worktree and edited, the run worked
  in `/private/tmp/recode-accept/m4/c72-recode-<run-id>`, left the checkout on `main`
  with the flag in place, ran Step 5 with two Opus reviewers, and reported "Worktree:
  <path> (kept; remove with `git worktree remove <path>`)". With `--confirm-plan`, the
  run asked for approval; after "no" it ended `plan-only` with no branch, and the report
  recorded the question, the reply, and the wait. With `--continue feat-sub`, Step 0.2
  asked to switch from `main`; after "yes" it worked on `feat-sub` from
  `origin/feat-sub`, ended `prepared`, and reported "Continued: yes, feat-sub. No PR was
  read or commented on (host other)". With `--repo` naming a second repository, both
  were changed on one new branch by two Sonnet subagents, and the report listed both
  with their base commits.
- **Item 9, at 8cc36de: every run ended `blocked` at the CI watch.** Setup: private
  repositories `vibecodedapps-dev/recode-accept-a` and `recode-accept-b`, created for
  this run, each with four one-line bugs in `math.mjs`, a test of `add` only, a committed
  `.recode.json` of `{"commit": true}`, and a workflow running `npm test` on pushes to
  `main` and on PRs; an issue per run; PR 5 opened by hand on branch `t114`. The scratch
  Codex home held a copy of the author's Codex login, and cca 0.5.1 was installed from
  its marketplace. All four runs started at once, each in its own clone. Each pushed,
  opened or updated its PR, saw the `test` check pass, and then stopped on `gh api
  repos/vibecodedapps-dev/recode-accept-a/rules/branches/main`, which returned "Upgrade
  to GitHub Pro or make this repository public to enable this feature." (HTTP 403).
  `ci-watch.md` item 1 ends the run in `blocked` on any failed read, so no run posted
  its issue status comment or its PR report comment, and none reached `done`.
  - `/recode-loop:run #1 --effort low`: Codex reviewed the plan, Codex implemented in one
    round, and Codex and `code-review low` reviewed the diff, with no swaps. Commit
    3e01518 held the fix and `specs/recode/2026-10-03-1/plan.md` and `report.md`; PR 7
    said `Closes #1`. `handoff.md` and `cca-manifest.json` were written and passed
    cca's check.
  - ccl item 4, `/recode-loop:run #2 --no-codex`: Opus took each Codex review and a
    Sonnet subagent implemented; PR 6 said `Closes #2` and held the snapshot. The tier
    came out medium, not the low the item expects: the estimate rule in `tiers.md` lists
    "one issue with tests" under medium, text the rename did not change.
  - ccl item 114, `/recode-loop:run #3 --no-codex --continue t114`, detached at
    `origin/t114` with an edited skip-worktree file: the run worked in
    `<parent>/a3-recode-2026-10-03-3`, pushed the fix and the snapshot to `t114`, and
    posted its comment on PR 5 with `gh pr comment 5 --body-file` set to the absolute
    path `/private/tmp/recode-accept/m4/gh/a3/.recode/2026-10-03-3/pr-body.md`.
  - ccl item 75, `/recode-loop:run #4 <URL of recode-accept-b issue 1> --repo <its
    checkout> --effort medium`: one branch name in both repositories; PR 8 in `a` and PR
    2 in `b`, each saying `Closes` for its own issue and `Refs` for the other's, under a
    "Related pull requests" section linking the sibling; Codex implemented both slices,
    the second with `--cwd`, and reviewed both, the second with `--cwd`; the second
    body was written to `pr-body-recode-accept-b.md` in the primary's run directory. The
    report suggested `/cca:audit` with the manifest path.
- **Defect, fixed.** The rules read is refused on a private repository without GitHub
  Pro, and the CI watch blocked on it like any failed read. Fixed in b1ccbee; see
  `docs/decisions.md` Part 4 item 4.
- **Item 9 passed, at b1ccbee.** The same four runs, on new issues 9 to 12 in `a` and 3
  in `b`, in fresh clones, all ended `done` with CI green. Each report's CI line named
  the 403 and said no rulesets apply. Each issue got a comment starting "Status from the
  recode run", and each PR that holds a snapshot got the report as a comment starting
  `# recode run report`. The Codex run (PR 14) was low tier with no swaps. The
  `--no-codex` run (PR 13) was again medium. The continued run worked in
  `<parent>/r3-recode-2026-10-03-11`, posted to PR 5 with `--body-file` set to
  `/private/tmp/recode-accept/m4/gh/r3/.recode/2026-10-03-11/pr-body.md`, then posted
  the report there. The two-repo run opened PR 15 in `a` and PR 4 in `b`, with the
  snapshot and the report comment on the primary's PR only, and suggested `/cca:audit`
  for its two bundles; the single-repo runs did not, being within cca's low tier. Every
  run wrote `handoff.md` and `cca-manifest.json`, and `handoff.sh check` printed
  `handoff: ok`. The copied Codex login was deleted afterward. The repositories, their
  open PRs, and the two worktrees were kept.

### 2026-10-03: M5, recode for Codex 0.1.0 and repo-docs 0.1.2

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. Codex ran with a new
`CODEX_HOME` at `~/.cache/recode-acceptance/codex-m5`, holding a copy of the author's
Codex login that was deleted after the runs. Claude Code ran in the M4 scratch profile, in
auto mode. Both hosts installed from this repository's catalogs at
`feat/codex-and-repo-docs`, commit e85d09e. Repositories were scratch git repositories
under `/tmp/recode-accept/m5/`.

- **Item 11 passed.** `codex plugin marketplace add vibecodedapps-official/reimagine-code
  --ref feat/codex-and-repo-docs` added `reimagine-code` from
  `.agents/plugins/marketplace.json`. `codex plugin list` showed exactly
  `recode@reimagine-code` and `repo-docs@reimagine-code` under it, from
  `plugins/recode-codex` and `plugins/repo-docs`. Both installed and enabled, at 0.1.0
  and 0.1.2.
- **Item 12 passed.** The change renamed `mul` to `multiply`, gave `add` a third
  argument `c = 0`, and added `div`. The review gave three findings: P1, restore the
  `mul` export, since `npm test` fails; P2, keep two-argument `add` behavior, since
  `add(1n, 2n)` now throws; P2, test the new behavior. It reported no change-size or
  context findings and changed no file. The main session read
  `general-code-review/SKILL.md` and spawned five subagents, which read
  `general-code-review-context`, `-change-size`, `-testing`, and `-breaking-changes`,
  the last in two of them, all from the installed 0.1.0.
- **Item 13 passed.** The audit read `SKILL.md` and `references/spokes.md` from the
  installed 0.1.2 and reported "Error: AGENTS.md:16 points to `docs/missing.md`, which
  does not exist", with a finding that `npm test` runs `true`. It changed no file. The
  first try, without `< /dev/null`, printed "Reading additional input from stdin..." and
  waited until stopped. In the TUI, "Hooks need review" offered "Review hooks", "Trust
  all", and "Continue without trusting"; choosing the first and pressing `t` wrote
  `[hooks.state."repo-docs@reimagine-code:hooks/hooks.json:pre_tool_use:0:0"]` with a
  `trusted_hash` to `config.toml`. The commit run then made commit 448b93e, and its
  session file held a developer message starting "repo-docs: this command commits, and
  the commit goes ahead." `--dangerously-bypass-hook-trust` was not used.
- **Item 14 passed.** In a copy of item 13's repository at its first commit, the audit
  called the Skill tool with `repo-docs:repo-docs`, read `references/spokes.md` from
  0.1.2, and reported the missing `docs/missing.md` as its one error, with the same
  `npm test` finding. Its session loaded that repository's `AGENTS.md` as project
  instructions. The commit run made commit fcbb18f. Its transcript holds a `hook_success`
  for `PreToolUse:Bash` with the hook's JSON, and a `hook_additional_context` attachment
  with the hook's text, both for the commit's Bash call. The reply said a hook asked for
  an audit and reported the audit it ran after the commit.
- **Item 15 passed, with the session check from the author's profile.** The audit
  reported no errors: all 11 pointers well formed and present, no carriage returns, and
  no adapters. It ran `npm test` and `npm run lint`, both exit 0, and the three hook
  cases in `plugins/repo-docs/AGENTS.md`, and it changed no file: `git status` showed
  only the untracked `.claude/` that was there before. Its session check failed, because
  that session loaded `~/.claude/CLAUDE.md` as a project file and not `AGENTS.md`. With
  `CLAUDE_CONFIG_DIR` pointing at the scratch profile, `~/.claude/CLAUDE.md` is no
  longer the user file; for a repository under the home directory it is a
  `.claude/CLAUDE.md` above the working directory, and repo-docs' own rule then says
  only `CLAUDE.md` files load. Item 14's audit, under `/tmp`, loaded its `AGENTS.md`. A
  session in the author's own profile at this repository's root, the same day, loaded
  `~/.claude/CLAUDE.md` as user instructions and `AGENTS.md` as project instructions.
  The audit's two findings were not acted on: the pointers to the repo-docs skill files
  could sit in `plugins/repo-docs/AGENTS.md` (see `docs/decisions.md` Part 5 item 1),
  and `docs/architecture.md`, `docs/rename-map.md`, and this file are long.
- **Not run.** The hook on Windows from a path with a space (R53), and installing from
  the published repository (R3), which waits for M6.

### 2026-10-03: M6, release 0.1.0, before tagging

macOS 27.0, Claude Code 2.1.288, Node 26.4.0. The M4 scratch profile, with the catalog
removed and added again from `main` at 6dc678e.

- **Item 16 passed.** `claude plugin details` reported "Always-on: ~1,256 tok" for
  `recode`, under R8's 1,300, and "~497 tok" for `recode-loop`, under 510. `repo-docs`
  reported ~169.
- **R51, by review.** The README states Claude Code 2.1.288 and Codex CLI 0.159.2, the
  versions the M3 to M5 items ran on, and Node 22 or later, and says Claude Code before
  2.1.269 lacks features the suite uses (`docs/decisions.md` Part 6 item 1).

### 2026-10-03: M6, tags and the macOS install

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
d928f13, the merge of PR 7.

- **Item 17 passed.** `claude plugin tag --dry-run` on each plugin named the tag and the
  push it would make. `claude plugin tag --push` then created and pushed
  `recode--v0.1.0`, `recode-loop--v0.1.0`, and `repo-docs--v0.1.2`, in that order, each
  at d928f13. `git ls-remote --tags origin` listed those three and no other tag. Lint on
  `main` passed with the tags. With one line appended to `plugins/recode/README.md`, it
  failed with "plugins/recode: changed since recode--v0.1.0, so its version must be
  above 0.1.0; found 0.1.0".
- **Item 18 passed on macOS, from the private repository.** In a new Claude profile,
  `~/.cache/recode-acceptance/claude-m6`, the catalog came from `main` at d928f13, and
  `recode`, `recode-loop`, and `repo-docs` installed at 0.1.0, 0.1.0, and 0.1.2. With the
  bridge uninstalled, installing the loop alone printed "(+ 1 dependency: recode)". In a
  new Codex home, `~/.cache/recode-acceptance/codex-m6`, `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` fetched d928f13, and `recode` 0.1.0 and
  `repo-docs` 0.1.2 installed and showed as enabled.
- **Setup and ask, in the M4 profile.** The new Claude profile has no login, and
  `claude -p` there replied that it was not logged in. So setup and the ask
  ran in the M4 scratch profile, after its catalog was removed and added again from
  GitHub, at d928f13. Installing the loop alone there also printed "(+ 1 dependency:
  recode)". `/recode:setup` reported codex-cli 0.159.2, the ChatGPT login, the
  `workspace-write` sandbox proven, and "old plugins: none found". `/recode:ask` with
  "What is 17 times 3? Reply with the number only." printed "51" and `status: ok`. The
  new Codex home held a copy of the author's Codex login for the ask, deleted afterward.
- **Windows and the public repository.** See the next two records.

### 2026-10-03: M6, Windows, recode 0.1.0 and repo-docs 0.1.2

Windows 11 Pro 10.0.26200, Claude Code 2.1.283 and codex-cli 0.157.1 from npm, the
newest that npm's 7-day minimum release age allowed, Node 26.4.0, Git 2.55.0.windows.5,
and PowerShell 7.6.6 from the Microsoft Store. The scratch `CLAUDE_CONFIG_DIR` and
`CODEX_HOME` were under `~/.cache/recode-acceptance`, the Codex home set `[windows]
sandbox = "unelevated"`, and the test repositories were under `C:\recode accept\`. The
runs were made by a session on the work machine and reported here.

- **Item 18 passed, from the private repository at d928f13.** Both catalogs were added.
  `recode` 0.1.0, `recode-loop` 0.1.0, and `repo-docs` 0.1.2 installed, and installing
  the loop alone printed "(+ 1 dependency: recode)". `codex plugin list` showed `recode`
  0.1.0 and `repo-docs` 0.1.2. `/recode:setup` passed. `/recode:ask` printed "51" and
  `status: ok` in an interactive session in default mode.
- **Known, not fixed: the ask's request-file Write on Windows.** In headless runs, the
  Write was refused as sensitive in default and acceptEdits modes. In auto mode the
  classifier gave no verdict, in 4 of 4 runs, one of them interactive. Corrected
  2026-10-04: these runs did try the Edit allow rule that `/recode:setup` prints, and
  it did not help; see the Windows record of 2026-10-04. Without that rule, auto mode
  passed on Windows on 2026-10-04; see the recode 0.1.2 record.
- **Item 19 passed, after the fixes below.**
  - Implement, called through a test skill, edited `math.mjs`. Codex reported "Shell
    startup failed", the limit of Store PowerShell that the bridge's README describes.
  - `/recode:rules` on a `CLAUDE.md` with CRLF endings added the block with 84 CRLF and
    no bare LF, and `--remove` restored the file byte for byte. The `windows` option
    was offered and on by default.
  - The hook reminded before a commit through Claude Code's Bash tool (commit d61c01b).
    Through the PowerShell tool, which a new profile used as its primary shell, there
    was no reminder (26def5c). In Codex there was no reminder (d2d0059): only `Git\cmd`
    was on `PATH`, so `sh` was not found. With `Git\bin` on `PATH`, it reminded
    (015f362).
- **Defects, fixed in recode 0.1.1 and repo-docs 0.1.3.** These were fixed in PR 8;
  `docs/decisions.md` Part 7 has the evidence.
  - In a new Codex home, one of Codex's first sandboxed commands took 28.8 to 31.6 s,
    and 1 of 5 setups failed at the probe's 30 s limit.
  - The hook gained a `PowerShell` entry, and a commit through that tool then got the
    reminder (865cb70).
  - The README now says Codex needs Git's `bin` folder on `PATH`. With it there, the
    hook reminded (593f6c1), and the trust record made for 0.1.2 still held.
  - The fixes were checked from the branch, not from the 0.1.1 tags.

### 2026-10-04: M6, release 0.1.1 and the public repository

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
e0a27de, the merge of PR 8.

- **Item 17 passed for 0.1.1.** The dry runs named `recode--v0.1.1`,
  `recode-loop--v0.1.1`, and `repo-docs--v0.1.3`. `claude plugin tag --push` then
  created and pushed them in that order, each at e0a27de. The remote holds those three
  and the three tags of 0.1.0, and no bare `v` tag. Lint on `main` passed with them.
- **Item 16 passed for 0.1.1.** `claude plugin details` reported about 1,256 always-on
  tokens for `recode`, 497 for `recode-loop`, and 169 for `repo-docs`.
- **Item 18 passed on macOS for 0.1.1, from the private repository.** In `claude-m6`,
  with the catalog removed and added again at e0a27de, installing the loop alone printed
  "(+ 1 dependency: recode)". `recode-loop` 0.1.1, `recode` 0.1.1, and `repo-docs`
  0.1.3 installed. In `codex-m6`, with the marketplace removed and added again at
  e0a27de, `recode` 0.1.1 and `repo-docs` 0.1.3 installed and showed as enabled. In the
  M4 profile, reinstalled the same way, setup ran recode 0.1.1's script and reported the
  sandbox proven and no old plugins. The ask with "What is 19 times 3? Reply with the
  number only." printed "57" and `status: ok`. The copy of the Codex login was deleted
  afterward.
- **The repository was made public on 2026-10-04.** Before that, a scan of the full
  history found no credentials. The four source repositories were already public.
- **Item 18 passed on macOS from the public repository.** Git credentials were turned
  off with `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null`, and
  `GIT_TERMINAL_PROMPT=0`, with no GitHub token in the environment. `git ls-remote`
  then read `main` at e0a27de. In `claude-m6` the catalog was added again, and the loop
  alone installed with `recode`, both 0.1.1. In `codex-m6` the marketplace was added
  again, and `recode` 0.1.1 installed.
- **Default mode, with setup's Edit rule.** With that rule in the M4 profile's
  `settings.json`, a headless `/recode:ask` in default mode was refused: "Claude
  requested permissions to edit
  /Users/joe/.cache/recode-acceptance/claude/plugins/data/recode-reimagine-code/request-b1ea5887-4167-40d5-9a99-3aebbbb390d0.txt
  which is a sensitive file." The script, called in the same turn, then refused with
  "no request file". So on macOS too, the rule does not get the Write past the
  sensitive-file check. The settings were restored afterward.

### 2026-10-04: M6, Windows, the public repository

Windows 11 Pro 10.0.26200, Claude Code 2.1.283 and codex-cli 0.157.1 from npm, Node
26.4.0, Git 2.55.0.windows.5. The scratch profiles were `claude-m6` and `codex-m6`. The
runs were made by a session on the work machine and reported here.

- **Item 18 passed on Windows from the public repository.** Git credentials were turned
  off with `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL` set to an empty file,
  `GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never`, and `GH_CONFIG_DIR` set to an empty
  folder, with `GIT_ASKPASS` and any GitHub token removed. `git config --list` printed
  nothing, and `git ls-remote` read `main` at 07dc98e and the 0.1.1 tags at e0a27de.
  - In `claude-m6`, the plugins and the local catalog were removed, and the old plugin
    cache was moved aside. With the catalog added from GitHub, installing the loop alone
    printed "(+ 1 dependency: recode)". `recode-loop` 0.1.1, `recode` 0.1.1, and
    `repo-docs` 0.1.3 installed, each recording commit 07dc98e and a GitHub source.
    07dc98e is the docs-only merge of PR 9, with no plugin change since e0a27de.
  - In `codex-m6`, the plugins and the local marketplace were removed, and the
    marketplace was added from GitHub at 07dc98e. `recode` 0.1.1 and `repo-docs` 0.1.3
    installed, and `codex plugin list` showed both as enabled.
  - Headless `/recode:setup` passed in 12 s: codex-cli 0.157.1, the `unelevated`
    sandbox, the ChatGPT login, `workspace-write` proven, and no old plugins. `codex-m6`
    was not a new Codex home, so this run did not meet the slow first sandboxed command.
    The copy of the Codex login was deleted afterward.
  - The ask was not run from the public install, as on macOS.
- **The Edit allow rule, tried.** At 03:14 UTC on 2026-10-04 with recode 0.1.0, with
  setup's rule in `settings.json`, a headless ask in default mode was still refused:
  "Claude requested permissions to edit ...\request-ce2a146e-....txt which is a
  sensitive file." With 0.1.1 the same day, a plain Write into that folder got the same
  refusal with the same rule present. In a control on a folder that is not sensitive,
  the Write was refused with no rule ("but you haven't granted it yet") and created the
  file with a rule of the same `//c/...` form. So the rule form matches on Windows, and
  the sensitive-file check refuses anyway. The two data-folder runs read the rule from
  `settings.json` and the control from `--settings`; the different wording of the two
  refusals points to the sensitive-file check, not the rule source. Every refused run
  exited 0, so each was judged by the tool's message and whether the file existed.

### 2026-10-04: recode 0.1.2, setup's Edit rule

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The scratch profiles
were `claude` and `codex-m6`, with recode 0.1.1 installed from GitHub, in a scratch git
repository. Each run changed only `permissions.allow` in the scratch `settings.json`,
and the settings were restored afterward.

- **Auto mode, with setup's Edit rule.** With only that rule, the request file's Write
  failed with "The server-side auto mode classifier gave no verdict (it skipped this
  action)" in 3 of 3 runs of `/recode:ask`: two headless, one interactive. With no rule,
  3 of 3 passed: two headless, and one interactive that printed 111 and `status: ok`.
- **Auto mode, with setup's Bash rule.** With only that rule, 3 of 3 headless runs
  passed: two typed asks, which printed 123 and 126 with `status: ok`, and one in plain
  words, which Claude routed to `recode:ask` and which answered 141.
- **Default mode, with a hook.** A PreToolUse hook that returned `allow` for the request
  file ran, and the Write was still refused as "a sensitive file".
- **Control.** In headless default mode, a Write to a folder that is not sensitive was
  refused with no rule ("but you haven't granted it yet") and created the file with a
  matching Edit rule.
- **Item 1, setup only, rerun with 0.1.2 from its branch.** The script was run directly
  with `node`, with a scratch `CODEX_HOME`: Codex 0.159.2, the ChatGPT login,
  `workspace-write` proven, and one allow rule, the Bash rule naming the script's path.
  It wrote no file. The copy of the Codex login was deleted afterward.
- **Windows, auto mode without the Edit rule.** On Windows 11 with Claude Code 2.1.283
  and codex-cli 0.157.1, in `claude-m6` and `codex-m6` with recode 0.1.1 from GitHub,
  and from a folder whose path holds a space, 2 of 2 headless asks in auto mode passed.
  Each Write created the request file, and each run printed 123 and `status: ok`. The
  only allow rule named the 0.1.0 script, so it did not match, and auto mode approved
  the Bash call itself. The 2026-10-03 runs with the rule got no verdict on the same
  Claude Code version. The rule was not retried on this day, so on Windows this is
  consistent with the macOS result rather than a second proof of it. The runs were made
  by a session on the work machine and reported here.

### 2026-10-04: release 0.1.2

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
c696321, the merge of PR 11. Git credentials were turned off as in the 0.1.1 public
run, and `git ls-remote` read `main` at c696321.

- **Item 17 passed for 0.1.2.** The dry runs named `recode--v0.1.2` and
  `recode-loop--v0.1.2`. The repo-docs dry run refused, because `repo-docs--v0.1.3`
  already exists and repo-docs did not change. `claude plugin tag --push` then created
  and pushed the two tags, each at c696321. The remote holds them, the tags of 0.1.0
  and 0.1.1, and no bare `v` tag. Lint on `main` passed with them.
- **Item 16 passed for 0.1.2.** `claude plugin details` reported about 1,256 always-on
  tokens for `recode`, 497 for `recode-loop`, and 169 for `repo-docs`, as for 0.1.1.
- **Item 18 passed on macOS for 0.1.2, from the public repository.** In `claude-m6`,
  with the catalog removed and added again, installing the loop alone printed "(+ 1
  dependency: recode)". `recode-loop` 0.1.2, `recode` 0.1.2, and `repo-docs` 0.1.3
  installed, each recording c696321. In `codex-m6`, with the marketplace removed and
  added again, `recode` 0.1.2 and `repo-docs` 0.1.3 installed and showed as enabled. In
  the M4 profile, reinstalled the same way, `/recode:setup` reported the sandbox proven,
  one allow rule naming the 0.1.2 script, and no old plugins. A headless `/recode:ask`
  in auto mode with "What is 23 times 3? Reply with the number only." printed "69" and
  `status: ok`. The copy of the Codex login was deleted afterward.

### 2026-10-04: release 0.1.2, Windows

Windows 11 with Claude Code 2.1.283 and codex-cli 0.157.1 from npm, Node 26.4.0. The
scratch profiles were `claude-m6` and `codex-m6`. Git credentials were turned off as in
the 0.1.1 Windows public run: `git config --list` printed nothing, and `git ls-remote`
read `main` and the two 0.1.2 tags at c696321. The runs were made by a session on the
work machine and reported here.

- **Item 18 passed on Windows for 0.1.2, from the public repository.**
  - In `claude-m6`, the plugins were uninstalled and the catalog removed and added
    again. Installing the loop alone printed "(+ 1 dependency: recode)". `recode-loop`
    0.1.2, `recode` 0.1.2, and `repo-docs` 0.1.3 installed and were enabled, each
    recording c696321 and a GitHub source.
  - In `codex-m6`, both plugins and the marketplace were removed and added again.
    `recode` 0.1.2 and `repo-docs` 0.1.3 showed as installed and enabled, with the
    clone at c696321.
  - Headless `/recode:setup` passed in 10 s: `workspace-write` proven, one allow rule
    naming the 0.1.2 script with forward slashes, and no old plugins.
  - With the Edit rule that 0.1.1's setup printed removed from `settings.json`, as the
    0.1.2 changelog says, a headless `/recode:ask` in auto mode wrote the request file,
    printed "129" for "What is 43 times 3?", and ended with `status: ok`.
- **Auto mode with the old Edit rule, on Windows.** Before the rule was removed, the
  same ask failed: "The server-side auto mode classifier gave no verdict (it skipped
  this action), so auto mode cannot determine the safety of Write. This is a hard
  failure, not a transient one". With the two rechecks earlier the same day, that is
  1 of 1 failing with the rule and 3 of 3 passing without it.
- **The prune notice.** Uninstalling `recode-loop` printed "1 auto-installed dependency
  no longer needed: recode. Run `claude plugin prune` to remove." Uninstalling
  `repo-docs` afterward printed the same line. On macOS the same day, uninstalling
  `repo-docs` while the loop was installed printed nothing, and after the loop was
  uninstalled it printed the line again. So Claude Code repeats the notice for the
  orphaned `recode` after any uninstall; `repo-docs` declares no dependency.
- The settings were restored and the copy of the Codex login was deleted afterward.
