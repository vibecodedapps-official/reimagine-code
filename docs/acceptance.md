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
   reports the Codex version and login, and allow rules that name the
   `recode-reimagine-code` data directory and the installed `recode` path; ask prints
   Codex's answer; implement edits the scratch repository and its footer shows the
   change. Covers R9 and R15. Rerun when a bridge command, the setup report, or the data
   directory changes. Run 2026-10-03; see the record.
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
   result. Covers the rest of R22 and R25. Rerun when Step 7 changes. Run 2026-10-03 up
   to the CI watch; see the record.
10. **ccl items under the new names.** The list was drawn 2026-10-03 at the start of M4
    from `docs/history/claude-codex-loop/acceptance.md`: of its 174 items, 58 name a
    renamed string, 35 of them only through bridge calls. The items rerun hinge on a
    renamed path or a removed gate: 1 (in item 7), 16, 65, 72, and 172 (in item 8), and
    4, 75, and 114 (in item 9). Item 66 tested the skill-listing retry that R24 removed;
    item 7's runs check what is left of it, that `run.md` records the availability check.
    Expected: each item's own result with `/ccl:` read as `/recode-loop:`, `.ccl` as
    `.recode`, and `specs/ccl` as `specs/recode`. Rerun when that file's own conditions
    say. Items 1, 16, 65, 72, and 172 run 2026-10-03, and 4, 75, and 114 up to the CI
    watch; see the record.

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
- **Not reached.** `done`, the CI watch past the rules read, the issue status comments,
  and the PR report comments.
