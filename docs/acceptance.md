# Acceptance

Hand-run checks for the suite. Each milestone adds its items. An item is
`N. **Title.** Setup: ... Command: ... Expected: ... Rerun when ...`, and an item not yet
run says "Not yet run." Runs use scratch profiles: `CLAUDE_CONFIG_DIR` and `CODEX_HOME`
pointing at directories outside the repo, so the author's own setup does not change.

The source repos' acceptance files are kept under `docs/history/`. Items from them that
name a plugin are rerun under the new names and recorded here.

## Items

1. **Bridge in a scratch profile.** Setup: scratch `CLAUDE_CONFIG_DIR` and `CODEX_HOME`,
   `ccx` installed from this repository's catalog, and a scratch git repository.
   Command: `/ccx:setup`, then `/ccx:ask` with a short question, then
   `/ccx:implement` from a test skill that asks for a one-line edit. Expected: setup
   reports the Codex version and login, and an allow rule that names the installed
   `ccx` path (before 0.1.2, also an Edit rule for the plugin's data
   directory); ask prints Codex's answer; implement edits the scratch repository and its
   footer shows the change. Covers R9 and R15. Rerun when a bridge command, the setup
   report, or the data directory changes. Run 2026-10-03, setup rerun 2026-10-04, and run
   2026-10-04 for 0.2.0, 2026-10-05 for 0.3.1, and 2026-10-06 for 0.3.2 and 0.4.0; see
   the records.
2. **codex-lite items under the new names.** Setup: as each item says, in scratch
   profiles. Command: items 1, 5, 8, 11, 12, 16, 17, 18, and 19 of
   `docs/history/codex-lite-cc/acceptance.md`, the items that name the plugin or its
   variables, with `/codex-lite:` read as `/ccx:` and `CODEX_LITE_` as `CCX_`.
   Item 15, the Windows install, runs on the Windows work machine with R53. List drawn
   2026-10-03 at the start of M2. Expected: each item's own result. Rerun when that
   file's own conditions say. Run 2026-10-03; see the record.
3. **House rules in a scratch profile.** Setup: scratch `CLAUDE_CONFIG_DIR` whose
   `CLAUDE.md` holds text of its own, scratch `CODEX_HOME` holding an `AGENTS.md`, and
   `ccx` installed from this repository's catalog. Command: `/ccx:rules`, choose
   the options, and accept each target; start a new session and ask it to quote a rule
   from the block; then `/ccx:rules --remove` and accept each target. Repeat with no
   Codex home. Expected: each target's diff is shown and asked about separately; the new
   session quotes the rule; after removal each file equals its backup byte for byte; with
   no Codex home the Codex target is reported as skipped and no directory is created.
   Covers R33, R38, R41, and R42. Rerun when `rules.mjs`, the rules command, or a rules
   file changes. Run 2026-10-03, 2026-10-04 for 0.1.3 and 0.2.0, 2026-10-05 for 0.3.1,
   and 2026-10-06 for 0.3.2 and 0.4.0; see the records.
   Adopt run, added for 0.5.0: put the shipped core rules into the scratch `AGENTS.md`
   by hand under a heading of your own, run `/ccx:rules`, and expect the note that the
   rules are already there with `recommend: adopt`; choose adopt, then apply; expected:
   the heading and the block remain, the hand copy is gone, and `/ccx:rules --remove`
   leaves the heading. Covers R66 and R67. Run 2026-10-06 for 0.5.0; see the record.
4. **Staleness notice and decline.** Setup: as item 3, with this block after the text
   of `CLAUDE.md` and an empty line, whose digest matches its body: begin line
   `<!-- ccx:house-rules begin version=0.0.1 options=core join=blank digest=6d3e610aaf815551 -->`,
   then the line `old rules`, then `<!-- ccx:house-rules end -->`. Command: start an
   interactive session; then `/ccx:rules` and decline the Claude change; then start
   another session. Expected: the first session shows one line naming the file and
   `/ccx:rules`; after the decline the next session shows nothing. Covers R43 and
   R45. Rerun when `suite.mjs` or the hooks change. Run 2026-10-03, and 2026-10-04 for
   0.1.3 and 0.2.0; see the records.
5. **Output style.** Setup: as item 3. Command: `/output-style`. Expected: the picker
   lists `ccx:Concise Plain`, and replies follow it once chosen. Covers R46. Until
   0.4.0 the item also checked setup's listing of the old plugins, retired with R16.
   Rerun when the style changes. Run 2026-10-03, and 2026-10-04 for 0.2.0; see the
   records.
6. **Loop install and its dependency.** Setup: a scratch profile with this
   repository's catalog added and neither plugin installed. Command: `claude plugin
   install ccx-loop@reimagine-code`, then `claude plugin disable
   ccx@reimagine-code`, then `claude plugin uninstall ccx-loop@reimagine-code`.
   Expected: the install also installs `ccx`; the disable is refused, naming
   `ccx-loop`; the uninstall reports `ccx` as no longer needed, for `claude plugin
   prune`. Covers R4 with the real plugins; spike M0.1 covered the update order. Rerun
   when the loop's `dependencies` change. Run 2026-10-03, and 2026-10-04 for 0.2.0; see
   the records.
7. **Loop plan runs on a local remote.** Setup: scratch git repositories, each with
   `math.mjs`, `test.mjs`, a `package.json` whose `test` script passes, and a local bare
   `origin`. Command: `/ccx-loop:plan "<a one-function change>" --effort low`, in
   headless sessions: with `--no-codex`; with `codex` absent from `PATH`; with the
   `codex` option set to false, never set, and set to true. Expected: each run calls
   `ccx-loop:ccx-loop` with the invocation block and ends `plan-only` with the plan and
   a report headed `# ccx run report` under `.ccx/<run-id>/`, and `.ccx/` in
   `.git/info/exclude`. With `--no-codex`, `codex` absent, or the option false, no Codex
   call is made, each Codex role runs on its Claude fallback, and the report says why.
   With the option unset or true, the block says `no-codex: false` and Codex is called.
   Covers R17, R20, R21, and part of R22. Until 0.4.0 the item also ran in a repository
   holding an old loop's config file, which ended `blocked`; that gate is retired with
   R23. Rerun when a loop command, the option, or Step 0 changes. Run 2026-10-03, and
   2026-10-04 for 0.2.0 and 0.3.0; see the records.
8. **Loop runs to the end on a local remote.** Setup: as item 7.
   Command: `/ccx-loop:run "<the same change>" --no-codex --effort low`, in separate
   repositories: with `--no-publish` and a committed `.ccx.json` of
   `{"commit": true}`; with `--no-publish` alone; after `git update-index
   --skip-worktree` on an edited file; with `--confirm-plan`, answering no; with
   `--continue` naming a branch on the remote; and with `--repo` naming a second such
   repository. Also `/ccx-loop:plan` with the committed `.ccx.json`. Expected: the
   plan run ends `plan-only` with nothing under `specs/ccx/` and a clean tree; the
   `--no-publish` runs and the runs on a local remote end `prepared` with no commit,
   nothing under `specs/ccx/`, and the report giving the commit and push commands;
   the `--no-publish` run writes no `handoff.md` or `cca-manifest.json` and says why;
   the skip-worktree run works in `<parent>/<checkout>-ccx-<run-id>` and names its
   removal; the declined plan ends `plan-only`; the `--continue` run works on that
   branch; the `--repo` run changes both repositories. Covers ccl items 16, 65, 72, and
   172 under the new names, and the local parts of R22. Rerun when Step 0, Step 7, or an
   artifact path changes. Run 2026-10-03, 2026-10-04 for 0.2.0 and 0.3.0, and
   2026-10-05 for 0.3.1; see the records.
9. **Loop runs that publish.** Setup: a throwaway GitHub repository with issue #1, a
   one-line bug, and a passing `npm test`; a second one on the same host for the
   multi-repo run; Codex logged in. Command: `/ccx-loop:run #1 --effort low`; then
   ccl items 4, 75, and 114 under the new names, and a `--continue` run on a branch with
   an open PR. Expected: Codex implements and Claude publishes a PR that closes #1;
   with `"commit": true` the snapshot lands in `specs/ccx/<run-id>/`; each item's own
   result. Covers the rest of R22 and R25. Rerun when Step 7 or the CI watch changes. Run
   2026-10-03, 2026-10-04 for 0.2.0 and 0.3.0, and 2026-10-05 for 0.3.1; see the
   records.
10. **ccl items under the new names.** The list was drawn 2026-10-03 at the start of M4
    from `docs/history/claude-codex-loop/acceptance.md`: of its 174 items, 58 name a
    renamed string, 35 of them only through bridge calls. The items rerun hinge on a
    renamed path or a removed gate: 1 (in item 7), 16, 65, 72, and 172 (in item 8), and
    4, 75, and 114 (in item 9). Item 66 tested the skill-listing retry that R24 removed;
    item 7's runs check what is left of it, that `run.md` records the availability check.
    Expected: each item's own result with `/ccl:` read as `/ccx-loop:`, `.ccl` as
    `.ccx`, and `specs/ccl` as `specs/ccx`. Rerun when that file's own conditions
    say. Items 1, 4, 16, 65, 72, 75, 114, and 172 run 2026-10-03, and 2026-10-04 for
    0.2.0 within items 7 to 9; see the records.

11. **Codex catalog and install.** Setup: a new scratch `CODEX_HOME` holding a
    `config.toml` with only the model, effort, sandbox, and approval settings, and a
    Codex login. Command: `codex plugin marketplace add
    vibecodedapps-official/reimagine-code`, with `--ref <branch>` before the branch is
    merged; `codex plugin list`; `codex plugin add ccx@reimagine-code`; `codex plugin
    add repo-docs@reimagine-code`. Expected: the `reimagine-code` marketplace lists
    exactly `ccx` and `repo-docs`, from `plugins/ccx-codex` and `plugins/repo-docs`,
    and they install at the versions their manifests give. Covers R2. Rerun when the
    Codex catalog or a Codex manifest changes. Run 2026-10-03, 2026-10-04 for 0.2.0 and
    0.3.0, 2026-10-05 for 0.3.1, and 2026-10-06 for 0.3.2 and repo-docs 0.1.5, for
    0.4.0, and for 0.5.0; see the records.
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
    /dev/null`. Expected: the audit reads the skill from the installed plugin and reports
    the missing spoke as an error; `config.toml` gains a `trusted_hash` for the hook; the
    commit goes ahead and its session file holds the hook's message starting "repo-docs:
    this command commits". Without `< /dev/null`, `codex exec` waits for input and never
    starts. Covers R30 on Codex. Rerun when the skill or the hook changes. Run
    2026-10-03, and 2026-10-05 for 0.1.4; see the records.
14. **repo-docs on Claude Code.** Setup: a scratch profile with this repository's
    catalog added and `repo-docs` installed; a copy of item 13's repository before its
    commit. Command: `claude -p "Use repo-docs to audit this repository's
    instructions."`, then `claude -p` with item 13's commit request, each with
    `--output-format stream-json --verbose`. Expected: the audit calls the Skill tool with
    `repo-docs:repo-docs` and reports the missing spoke as an error; the commit goes
    ahead, and the session transcript under the profile's `projects/` holds a
    `hook_additional_context` attachment for that Bash call, starting "repo-docs: this
    command commits". The stream output does not show hook context. Covers R30 on Claude
    Code. Rerun when the skill or the hook changes. Run 2026-10-03, and 2026-10-05 for
    0.1.4; see the records.
15. **repo-docs on this repository.** Setup: as item 14. Command: `claude -p "Use
    repo-docs to audit this repository's instructions. This is a read-only audit: change
    no file."` at this repository's root. Expected: no errors, and `git status`
    unchanged. The audit's session check needs a session that loads `AGENTS.md`: with
    `CLAUDE_CONFIG_DIR` set elsewhere, `~/.claude/CLAUDE.md` loads as a project file for
    a repository under the home directory, and `AGENTS.md` does not, so that check is
    made in the author's own profile. Covers R31. Rerun when the hub, a file under
    `plugins/repo-docs/`, or the skill changes. Run 2026-10-03, and 2026-10-05 for
    0.1.4; see the records.

16. **Always-on cost.** Setup: a logged-in scratch profile with this repository's
    catalog added from `main` and `ccx-loop` and `repo-docs` installed. Command:
    `claude plugin details <plugin>@reimagine-code` for `ccx` and `ccx-loop`.
    Expected: "Always-on" at most 1,300 tokens for `ccx` and at most 510 for
    `ccx-loop`. Covers R8. Rerun at each release. Run 2026-10-03 for 0.1.0, and
    2026-10-04 for 0.1.1, 0.1.2, 0.1.3, 0.2.0, and 0.3.0, 2026-10-05 for 0.3.1 before
    and after the merge, and 2026-10-06 for 0.3.2 and 0.4.0 before the merge; see the
    records.
17. **Tags.** Setup: the release commit on `main`. Command: `claude plugin tag --push`
    on `plugins/ccx`, then `plugins/ccx-loop`, then `plugins/repo-docs`; then
    `git ls-remote --tags origin`. Expected: each tag command checks the manifest against
    its catalog entry and pushes; the remote holds a `<plugin>--v<version>` tag for each
    plugin's new version, and no bare `v` tag. Covers R49. Rerun at each release. Run
    2026-10-03 for 0.1.0, 2026-10-04 for 0.1.1, 0.1.2, 0.1.3, 0.2.0, and 0.3.0,
    2026-10-05 for 0.3.1 and cca 0.9.0, and 2026-10-06 for 0.3.2, cca 0.9.1, and
    repo-docs 0.1.5, for 0.4.0, and for 0.5.0; see the records.
18. **Install from GitHub.** Setup: on macOS and on Windows 11 with both CLIs from npm,
    new scratch profiles on each host. Command: the four lines of R3, then `claude plugin
    install ccx-loop@reimagine-code` and `codex plugin add
    repo-docs@reimagine-code`; then `/ccx:setup` and `/ccx:ask` with a short
    question. Expected: each install succeeds at the tagged version; the loop's install
    also installs `ccx`; setup passes; the ask prints Codex's answer; `codex plugin
    list` shows both Codex plugins. Run from the private repository after tagging, then
    once per host from the public one. Covers R3 and R4. Rerun at each release. Run on
    macOS and Windows 2026-10-03 for 0.1.0, from the private repository. Run
    2026-10-04 for 0.1.1 on macOS, from the private repository and then the public one,
    and on Windows from the public one. Run 2026-10-04 for 0.1.2, 0.1.3, 0.2.0, and
    0.3.0, and 2026-10-05 for 0.3.1, each on macOS and Windows, from the public
    repository, 2026-10-06 for 0.3.2, cca 0.9.1, and repo-docs 0.1.5 on macOS and
    Windows, and 2026-10-06 for 0.4.0 and 0.5.0 on macOS; see the records.
19. **Windows.** Setup: a Windows 11 machine with both CLIs from npm, the suite
    installed as in item 18, and a test repository checked out under a path that holds
    a space. Command: `/ccx:ask` and `/ccx:implement` with a one-line change;
    `/ccx:rules` against a `CLAUDE.md` with CRLF line endings, then its status after
    the file is converted to LF; a commit by the agent in each host, Codex after
    trusting the hook. Expected: the ask and implement succeed; the rules block is added
    with the file's CRLF endings kept, and still reads `current` in LF; the repo-docs
    hook adds its reminder on both hosts. Covers R53. Rerun when the bridge's spawn code,
    the rules command, or the hook changes. Run 2026-10-03, 2026-10-04 for 0.2.0,
    2026-10-05 for 0.3.1 except the symbolic links and a real Ctrl-C, and 2026-10-06 for
    0.3.2 except the symbolic links and a folder name ending in a space; see the
    records.
20. **Reviewer routing.** Setup: scratch git repositories as in item 7, with a local bare
    `origin`; `ccx-loop` installed from this repository's catalog; Codex logged in.
    Command:
    - `/ccx-loop:plan` once at each tier, with `--effort`;
    - plans or `--no-publish` runs whose change, in turn, carries a risk floor trigger,
      touches nine files across two slices, touches eight files across two slices, adds
      a module that another file imports, or edits only a comment in an auth module;
    - in a session where `code-review` is not listed, through `--settings
      '{"skillOverrides":{"code-review":"off"}}'`, a lower-risk `--no-publish` run and
      then a higher-risk one;
    - a higher-risk `--no-publish` run in a worktree, and one in Multi-repo mode;
    - where one can be staged, a run that turns higher-risk after the plan.

    Expected:
    - every plan review is `gpt-6-astra`;
    - the plan names each slice's implementer, and the Step 5 role with the criterion
      that held, or "none";
    - the trigger, nine-file, and imported-module runs are higher-risk and get Claude;
      the eight-file and comment-only runs get Codex;
    - without the skill, the lower-risk run passes Step 5 with Codex, and the higher-risk
      run ends `blocked` at the start of Step 5, naming the missing skill;
    - the worktree and Multi-repo runs give the Opus stand-in each checkout the skill
      cannot reach;
    - a run that turns higher-risk later moves to Claude inside the cap of 3, and the
      report names the switch.

    Rerun when the tier table, the higher-risk rule, or the Claude review contract
    changes. Run 2026-10-04 for 0.3.0, except the late switch, which could not be
    staged then or in two tries on 2026-10-05; see the records.
21. **cca install and a budget-0 audit.** Setup: a scratch profile with this
    repository's catalog added and `cca` installed from it; the `solo` fixture built with
    `sh tests/cca/fixture/build.sh solo`, which prints its manifest path. Command: in a
    session whose directory is the fixture's `app` repository,
    `claude -p "/cca:audit <manifest> --budget 0 --no-codex" --model opus`, as cca's own
    case M0-c' ran it (`docs/history/claude-codex-audit/acceptance.md`). Expected: the
    four `cca:` commands are listed; stage 1 runs and stage 8 writes the report; the run
    ends `partial` with verdict `audit incomplete` and prints a `/cca:resume <run-id>`
    line, or, when the run's entry is not in `runs.json`, the entry to add by hand;
    `stages.json` records `plugin_version` `0.9.1`; no `runs.json.lock` is left in the
    data directory; the fixture repository's `git status --porcelain` is unchanged by
    the run. Covers R61 and R62. Rerun when a cca command, the skill, the catalog
    entry, or the plugin version changes. Run 2026-10-05 for 0.9.0, and 2026-10-06 for
    0.9.1 on macOS and Windows; see the records.
22. **cca second opinion through ccx.** Setup: as item 21, with `ccx` installed from
    this catalog, Codex logged in, and the `patterns` fixture. Command: `/cca:audit
    <manifest> --effort low`; then uninstall `ccx` and run `/cca:resume <run-id> --from 6`.
    Expected: in the first run, stage 6 records the `ccx` version, calls `ccx:ask` with
    a timeout of at most 540 seconds when the session is headless or cannot tell
    whether a user can answer, and its ledger entry has `codex.called` true, a
    `codex.ccx_version`, and that `codex_timeout`; in the second, the stage swaps to
    `cca:adversary` with the reason "ccx not installed or version unreadable" and the
    run still ends `reported`. Covers R63. Rerun when stage 6, the bridge's output
    lines, or the catalog changes. Run 2026-10-06 for 0.9.1; see the records.
23. **cca items under the new names.** The list was drawn 2026-10-05 from
    `docs/history/claude-codex-audit/acceptance.md`: only case M3-c (a session started
    outside any git repository, where the bridge refuses and the run swaps) names the
    bridge, read as `ccx`; it was never run there. Every other case keeps its result and
    reruns under that file's conditions. Expected: M3-c's own result. Rerun when stage 6
    changes. Not yet run.

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

### 2026-10-04: recode 0.1.3, the rules synced to the earlier source repository

macOS 27.0, Claude Code 2.1.288, Node 26.4.0. recode was installed in the M4 profile
from a local catalog: the branch commit 526139d exported with `git archive`, and the
installed plugin matched the branch's `plugins/recode/` byte for byte (`diff -r`). The
Codex home was a new scratch directory. The real `~/.claude/CLAUDE.md` and
`~/.codex/AGENTS.md` had the same sha256 after the runs as before. Afterward the profile
got back its own `CLAUDE.md` and the GitHub catalog at 0.1.2.

- **The rebuild.** The shipped Windows part, an empty line, and `core.md` equal the
  earlier source repository's `claude/CLAUDE.md` at 9faabda, and the Codex parts equal
  its `codex/AGENTS.md` (`cmp`).
- **An old block is reported.** In a scratch home, a block written with the 0.1.2 rules
  got no session start notice. After the sync, the notice named both files, `status`
  said `stale` for both, and a plan and apply made both `current` and kept the text
  above the block.
- **Item 3 passed for 0.1.3.** The scratch `CLAUDE.md` held a heading and a marker
  line, and the Codex `AGENTS.md` held two lines. Headless `/recode:rules` asked for
  options, offering `core` and `writing`. After `core,writing` it showed both diffs,
  each with the two new rules, and asked about each file separately. After "yes" to
  both, each file got a 0.1.3 block, with a backup. A new session gave the marker and
  quoted both new rules word for word, in one turn and without reading a file.
  `/recode:rules --remove`, with "yes" to both, left each file equal to its original and
  to its first backup (`cmp`). The repeat with no `CLAUDE.md` and a missing Codex home
  was run through `rules.mjs` directly, because that path reads no rule text the sync
  changed: the Codex target was skipped, `CLAUDE.md` was created with `join=none` and
  then removed as created, and the Codex home was never made.
- **Found: `rules.mjs` and `suite.mjs` do nothing when their path goes through a
  symlink.** The first try used the export under `/tmp`, which on macOS is a symlink to
  `/private/tmp`. `/recode:rules` stopped, because `rules.mjs status` printed nothing
  and exited 0. Run from the `/tmp` path, `rules.mjs status` and `suite.mjs old-plugins`
  each printed 0 bytes with exit 0. From the `/private/tmp` path, the same commands
  printed their reports. Both scripts run `main()` only when `import.meta.url`, which
  Node resolves through symlinks, equals the unresolved `process.argv[1]`. `recode.mjs`
  has no such check and ran from both paths. So with a symlink anywhere in the plugin's
  path, the rules command, the session start notice, and setup's old-plugin list fail
  silently. A linked `~/.claude` should do the same; that is reasoned from the check,
  not run. Present since 0.1.0. Fixed in 0.1.3: both scripts compare with the resolved
  path. A test for each script, run through a linked folder, failed before the fix
  with empty output and passes after it, and the `/tmp` commands above then printed
  their reports.

### 2026-10-04: release 0.1.3

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
5da2c2c, the merge of PR 13. Items 3 and 4 ran after the merge and before tagging, in
the M4 profile with the suite installed from GitHub `main` at 5da2c2c; the installed
`recode` matched `plugins/recode/` apart from Claude Code's own `.in_use` marker. The
real `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` had the same sha256 after the runs
as before, and the profile got back its own `CLAUDE.md`.

- **Item 3 passed for 0.1.3, from GitHub.** As in the branch run: both diffs carried the
  two new rules and each file was asked about separately; a new session gave the marker
  and quoted both new rules in one turn without reading a file; `/recode:rules --remove`
  left each file equal to its original and its first backup (`cmp`). The repeat with no
  `CLAUDE.md` and a missing Codex home, run through the installed `rules.mjs`, skipped
  the Codex target, created and then removed `CLAUDE.md`, and never made the Codex home.
- **Item 4 passed for 0.1.3.** With the item's `version=0.0.1` block after the text of
  `CLAUDE.md`, an interactive session showed "SessionStart:startup says: recode: the
  house rules in .../claude/CLAUDE.md are older than this plugin's; run /recode:rules to
  update them". `/recode:rules` offered to replace the block; after "no" it printed
  "declined the change ...; the session notice stays quiet for this text", and the file
  kept the old block. The next interactive session showed no notice.
- **Item 17 passed for 0.1.3.** The dry runs named `recode--v0.1.3` and
  `recode-loop--v0.1.3`, and `claude plugin tag --push` created and pushed both at
  5da2c2c. repo-docs did not change and keeps `repo-docs--v0.1.3`. The remote holds no
  bare `v` tag, and lint on `main` passed with the tags.
- **Item 16 passed for 0.1.3.** About 1,256 always-on tokens for `recode`, 497 for
  `recode-loop`, and 169 for `repo-docs`, as for 0.1.2.
- **Item 18 passed on macOS for 0.1.3, from the public repository.** With git
  credentials off, `git ls-remote` read `main` and `recode--v0.1.3` at 5da2c2c. In
  `claude-m6`, installing the loop alone printed "(+ 1 dependency: recode)", and
  `recode-loop` 0.1.3, `recode` 0.1.3, and `repo-docs` 0.1.3 installed from 5da2c2c. In
  `codex-m6`, `recode` 0.1.3 and `repo-docs` 0.1.3 installed and showed as enabled. In
  the M4 profile, `/recode:setup` reported the sandbox proven, one allow rule naming the
  0.1.3 script, and "old plugins: none found", which `suite.mjs` prints. A headless
  `/recode:ask` in auto mode printed "81" and `status: ok`. The copy of the Codex login
  was deleted afterward.

### 2026-10-04: release 0.1.3, Windows

Windows 11 with Claude Code 2.1.283 and codex-cli 0.157.1 from npm, Node 26.4.0. The
scratch profiles were `claude-m6` and `codex-m6`. Git credentials were turned off as in
the earlier public runs: `git config --list` printed nothing, and `git ls-remote` read
`main` and the two 0.1.3 tags at 5da2c2c. The runs were made by a session on the work
machine and reported here.

- **Item 18 passed on Windows for 0.1.3, from the public repository.**
  - In `claude-m6`, the plugins were uninstalled and the catalog removed and added
    again. Installing the loop alone printed "(+ 1 dependency: recode)". `recode-loop`,
    `recode`, and `repo-docs` installed at 0.1.3 and were enabled, each recording
    5da2c2c and a GitHub source. Uninstalling printed the prune notice again, as in the
    0.1.2 run.
  - In `codex-m6`, both plugins and the marketplace were removed and added again.
    `recode` 0.1.3 and `repo-docs` 0.1.3 showed as installed and enabled, with the clone
    at 5da2c2c.
  - Headless `/recode:setup` passed in 11 s: `workspace-write` proven, one allow rule
    naming the 0.1.3 script with forward slashes, and "old plugins: none found".
  - With no Edit rule for the data directory in `settings.json`, a headless
    `/recode:ask` in auto mode wrote the request file, printed "141" for "What is 47
    times 3?", and ended with `status: ok`.
- **The rules script, from the installed path.** `rules.mjs status`, run directly from
  the installed 0.1.3 with the scratch profiles, exited 0 and printed four lines:
  `claude: absent ... options=core,windows (default)`, the same for `codex`,
  `options recorded: no`, and `options offered: core, windows, writing`. Both targets
  were correctly absent. So the entry check added in 0.1.3 runs the script on a
  standard Windows install path.
- The copy of the Codex login was deleted afterward. The old Edit rule was left out of
  `claude-m6`'s `settings.json`, with the earlier file kept beside it.

### 2026-10-04: M7 step 2, macOS

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The author's real
profiles, with the earlier source repository at 9faabda. `codex-lite` stays, because cca
0.6.0 still calls
`codex-lite:ask`. The home files, both settings files, and the plugin lists were backed
up with their sha256 first.

- **Update and rules.** `recode` and `recode-loop` went from 0.1.2 to 0.1.3 on Claude
  Code and `recode` on Codex. `/recode:rules --options core,writing` noted the import of
  the earlier source repository on line 1 of `CLAUDE.md`, showed both diffs, and wrote
  both blocks after "yes"
  to each. The text above each block was then removed by hand: the import in
  `CLAUDE.md`, and in `AGENTS.md` an old copy of the earlier source repository's
  `codex/AGENTS.md` that lacked
  only the cause-check rule. No local overrides: the rules parts equal that repository's
  files
  apart from blank lines. `rules.mjs status` then read `current` for both.
- **Quoted rule.** New `claude -p` and `codex exec -s read-only` sessions each quoted the
  cause-check rule word for word. The old Codex copy lacked that rule, so the quote came
  from the block.
- **Gate: loop.** In a clone of `recode-accept-a`, headless `/recode-loop:run "neg in
  math.mjs returns its input unchanged; ..." --effort low`. Codex reviewed the plan,
  implemented through `recode:implement` with status ok, and reviewed the diff;
  `code-review low` found nothing. The run asked before publishing, as the house rules
  require; after a `--resume` yes it committed 0fc3741, opened PR 16 with CI green, and
  posted the report comment.
- **Gate: hook.** Codex: after trusting the hook in the TUI, a `codex exec` commit in a
  scratch repository tracking `AGENTS.md` made 7dc9406, whose session file holds
  "repo-docs: this command commits". The same commit in a repository without a tracked
  instruction file got no message, as designed. Claude Code: after the old `repo-docs`
  was removed, a `claude -p` commit in the same repository made 1b5e557, whose
  transcript holds the message.
- **Retired.** `ccl` and `repo-docs@repo-docs` with their marketplaces on Claude Code;
  `codex-code-review-general` and the `codex-code-review` marketplace on Codex, which
  left no `codex-code-review` entry in `config.toml`.

### 2026-10-04: M7 step 2, Windows

A personal Windows 11 machine, not the work machine. Claude Code 2.1.287, codex-cli
0.160.0, Node 26.4.0, Git 2.55.0.windows.5. A session on that machine ran a brief and
reported here, first as a dry run in scratch profiles, then on the real profile. Nothing
was committed in this repository.

- **Dry run.** Every step passed in scratch profiles, and the real home files kept their
  hashes. It found the earlier source repository at e5429ef, behind 9faabda, and only
  `Git\cmd` on the
  Windows `PATH`. Two scratch steps were denied in auto mode as "Security Weaken". The
  loop opened PR 17, which the session then closed as agreed.
- **Start of the real run.** Claude Code had `ccl` 0.10.0, `repo-docs@repo-docs` 0.1.1,
  `codex-lite` 0.9.0, and `cca` 0.5.0; Codex had `codex-code-review-general` 0.1.0;
  neither host had the `reimagine-code` marketplace. `CLAUDE.md` was the import of the
  earlier source repository and `AGENTS.md` equalled its `codex/AGENTS.md`, CRLF
  included. With the
  author's approval, that repository was fast-forwarded to 9faabda, with no installer
  run, and
  `C:\Program Files\Git\bin` was added to the user `PATH`.
- **Install and rules.** The marketplace and the 0.1.3 plugins were added on both hosts.
  `/recode:rules --options core,windows,writing` wrote both blocks after "yes" to each.
  The text above each block was removed with Node, which keeps CRLF. `AGENTS.md` got a
  `## Local overrides` section holding a Links section from an older backup, at the
  author's choice; `CLAUDE.md` has none. New `claude -p` and `codex exec` sessions quoted
  the cause-check rule.
- **Gate: rules (R59).** On the real files, `status` and `plan` read `current` and
  `change: none`, and both hashes were unchanged. In a scratch profile, a stale block
  with a local overrides section below it was replaced, and the 36 bytes after the end
  marker were unchanged (`cmp`).
- **Gate: loop.** Codex `gpt-6-luna` implemented through `recode:implement` with status
  ok and no fallback; commit fbfc0bf, PR 18 open with the `test` check passing and the
  report comment posted.
- **Gate: hook.** Codex, started from PowerShell with the new `PATH`: commit 578bba3,
  with the message in its session file. Claude Code, after the old plugins were
  removed: commit 2c5e1e9, with the message in its transcript.
- **Retired.** `ccl`, `repo-docs@repo-docs`, `codex-code-review-general`, and their
  marketplaces. `codex-lite` and `cca` stay.
- **Found.** A CRLF block converted to LF reads as edited by hand (issue 16).

### 2026-10-04: ccx 0.2.0, before the merge

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. These checks are the
acceptance criteria of issue 15, run at bd21369 on `feat/rename-ccx`. The catalog was a
local clone with the two `ccx` tags made in the clone only, checked out at
`recode--v0.1.3` for the old state and at the branch for the new one. The runs used the
M4 profile and new scratch profiles. The real `~/.claude` and `~/.codex` files had the
same sha256 after the runs as before.

- **Claude upgrade.** With `recode` and `recode-loop` 0.1.3 installed and the loop's
  `codex` option false, the branch checkout and the next `claude plugin list` rewrote
  `enabledPlugins` to `ccx@reimagine-code` and `ccx-loop@reimagine-code`, and
  `pluginConfigs` to `ccx-loop@reimagine-code` with `codex` false. The old installs
  were dropped, and `claude plugin install` for `ccx` and `ccx-loop` installed 0.2.0.
  `outputStyle` stayed `recode:Concise Plain`. The data directory did not carry over;
  `ccx-reimagine-code` appeared on the first `/ccx:setup`.
- **Old plugins.** With the 0.1.3 plugins installed and a Codex `recode` table,
  `suite.mjs old-plugins` listed `recode-loop@reimagine-code`, then
  `recode@reimagine-code`, then the Codex `recode@reimagine-code`.
- **Session and rules.** The session start notice named the files still under the old
  marker. `/ccx:setup` proved the sandbox, with an allow rule naming `scripts/ccx.mjs`.
  `/ccx:ask` printed "42." and `status: ok`. `/ccx:rules` read both old-marker blocks as
  `stale`, and after "yes" to each, wrote `ccx:house-rules` blocks with the same digest;
  the text above each block was unchanged. `/ccx:rules --remove` then left each file
  equal to its copy from before the block (`cmp`), and so did a removal straight from
  the 0.1.3 block.
- **Line endings (issue 16).** A block applied to a CRLF `CLAUDE.md` read `current`
  after the file was converted to LF. The 0.1.3 script read the same file as `edited`.
- **Fresh install.** In new profiles, `ccx-loop` alone printed "(+ 1 dependency: ccx)",
  both at 0.2.0, and Codex added `ccx` 0.2.0 and `repo-docs` 0.1.3.
- **Codex upgrade.** `codex plugin add ccx@reimagine-code` and `codex plugin remove
  recode@reimagine-code` both exited 0, leaving only the `ccx` table.
- **Old loop config.** A loop run in a repository with `.recode.json` and no `.ccx.json`
  ended `blocked`, said to run `git mv .recode.json .ccx.json`, and created nothing.
- **Defect, fixed in 757dbbc.** With both files under the old marker, the notice read
  "... and ... still uses the old marker". It now says "use" for two files.

### 2026-10-04: release 0.2.0

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
b3806f2, the merge of PR 18. Git credentials were turned off for the GitHub runs with
`GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_TERMINAL_PROMPT=0`, and no
GitHub token. The real `~/.claude` and `~/.codex` files had the same sha256 after the
runs as before.

- **Item 17 passed for 0.2.0.** The dry runs named `ccx--v0.2.0` and
  `ccx-loop--v0.2.0`. The repo-docs dry run refused, because `repo-docs--v0.1.3` already
  exists and repo-docs did not change. `claude plugin tag --push` then created and
  pushed both tags at b3806f2. The `recode` and `recode-loop` tags still point where
  they did, 0.1.3 at 5da2c2c, and the remote holds no bare `v` tag. Lint and tests on
  `main` passed with the tags.
- **Upgrade from GitHub.** In the M4 profile, with 0.1.3 installed from GitHub,
  `claude plugin marketplace update reimagine-code` printed nothing about the rename and
  left `settings.json` unchanged. The next `claude plugin list` still printed the old
  plugins and rewrote `enabledPlugins` to the `ccx` names; the one after showed neither.
  `claude plugin install ccx-loop@reimagine-code` printed "(+ 1 dependency: ccx)", and
  both installed at 0.2.0 from b3806f2. In `claude-m6`, a `codex` option set to false
  on `recode-loop` came through as false on `ccx-loop`. In `codex-m6`, with 0.1.3 from
  GitHub, `codex plugin marketplace upgrade reimagine-code` dropped `recode` from
  `codex plugin list` while its `config.toml` table stayed; `codex plugin add
  ccx@reimagine-code` and `codex plugin remove recode@reimagine-code` then left only
  the `ccx` and `repo-docs` tables.
- **Item 16 passed for 0.2.0.** `claude plugin details` reported about 1,268
  always-on tokens for `ccx`, 508 for `ccx-loop`, and 169 for `repo-docs`, up from
  1,256 and 497 for 0.1.3. `ccx-loop` is 2 tokens under its limit.
- **Item 18 passed on macOS for 0.2.0, from the public repository.** `git ls-remote`
  read both tags at b3806f2. In `claude-m6`, with the catalog removed and added again,
  installing the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.2.0, `ccx`
  0.2.0, and `repo-docs` 0.1.3 installed, each recording b3806f2 and a GitHub source.
  In `codex-m6`, with the marketplace removed and added again, `ccx` 0.2.0 and
  `repo-docs` 0.1.3 installed and showed as enabled. In the M4 profile, `/ccx:setup`
  reported the sandbox proven, one allow rule naming the 0.2.0 `scripts/ccx.mjs`, and
  "old plugins: none found". A headless `/ccx:ask` with "What is 17 times 3? Reply with
  the number only." printed "51" and `status: ok`. The copy of the Codex login was
  deleted afterward.
- **Items 1 and 3 to 9 passed for 0.2.0.** The rename changed a file each of them
  reruns on. They ran in the M4 profile and new scratch profiles, with the suite from
  GitHub at b3806f2.
  - Item 1: setup and ask passed in item 18. `/ccx:implement`, from a test skill in a
    scratch repository, printed "sandbox: workspace-write proven on this host before the
    run", changed one line of `math.mjs`, and ended `status: ok`.
  - Item 3: each target's diff was asked about separately. A new session in a folder
    outside the home directory quoted "Before adding a dependency, once per package,
    with the reason." After `/ccx:rules --remove`, both files equalled their originals
    (`cmp`). With no Codex home, the Codex target was skipped and nothing was written
    there, and the removal took out the `CLAUDE.md` that `/ccx:rules` had created.
  - Item 4: in interactive sessions, the first showed "SessionStart:startup says: ccx:
    the house rules in .../claude/CLAUDE.md are older than this plugin's; run
    /ccx:rules to update them". After both targets were declined, `/ccx:rules` printed
    "declined the change ...; the session notice stays quiet for this text", both files
    were unchanged (`cmp`), and the next session showed no notice.
  - Item 5: `/output-style` listed `ccx:Concise Plain`, and a session with it chosen
    reported that style and replied in it. With `codex-lite` installed from its old
    marketplace, `/ccx:setup` ended with `claude plugin uninstall
    codex-lite@vibecodedapps-codex-lite`, and `codex-lite` stayed installed. With an old
    Codex review plugin also enabled, a `codex plugin remove` line followed.
  - Item 6: the loop's install printed "(+ 1 dependency: ccx)". `claude plugin disable
    ccx@reimagine-code` was refused: "ccx is still required by ccx-loop". Uninstalling
    the loop printed "1 auto-installed dependency no longer needed: ccx. Run `claude
    plugin prune` to remove."
  - Item 7: each run called `ccx-loop:ccx-loop` with the invocation block. With
    `--no-codex`, `codex` absent from `PATH`, or the option false, no Codex call was
    made and the report named the reason; with the option unset or true, the block said
    `no-codex: false` and `ccx:ask` was called. These ended `plan-only` with `# ccx run
    report` under `.ccx/<run-id>/` and `.ccx/` excluded. The `.ccl.json` run, and a run
    with `.recode.json` and no `.ccx.json`, each ended `blocked` at Step 0.1, said to
    rename the file to `.ccx.json`, and created nothing.
  - Item 8: the plan run ended `plan-only` with a clean tree and nothing under `specs/`.
    The `--no-publish` runs and the local-remote runs ended `prepared` with no commit,
    the commit and push commands in the report, and no handoff, with the reason. The
    skip-worktree run worked in `<parent>/r-skip-ccx-<run-id>` and named `git worktree
    remove`. The declined plan ended `plan-only` with no branch. The `--continue
    feat-sub` run worked on `feat-sub` from `origin/feat-sub`. The `--repo` run changed
    both repositories.
  - Item 9: in `vibecodedapps-dev/recode-accept-a` and `recode-accept-b`, `.recode.json`
    was first renamed to `.ccx.json` on `main` (77babd7 and dacbf45) and on `t114`
    (653d69b). Four runs on new issues a#19 to a#22 and b#5, each in a fresh clone, all
    ended `done` with CI green. The Codex run opened PR 24, with Codex reviewing the
    plan and the diff. The `--no-codex` run opened PR 23. The `--continue t114` run,
    with a skip-worktree edit, worked in `<parent>/r3-ccx-2026-10-04-20` and posted to
    PR 5. The `--repo` run opened PR 25 in `a` and PR 6 in `b`, each closing its own
    issue and referring to the other's. Each issue got a comment starting "Status from
    the ccx run", each PR holding a snapshot got one starting `# ccx run report`, the
    snapshots are under `specs/ccx/<run-id>/`, and cca's `handoff.sh check` printed
    `handoff: ok` for all four.
- **Item 11 passed for 0.2.0.** In a new Codex home holding only the model, effort,
  sandbox, and approval settings, and no login, which these commands do not use, `codex
  plugin marketplace add vibecodedapps-official/reimagine-code` cloned b3806f2. `codex
  plugin list` showed exactly `ccx` from `plugins/ccx-codex` and `repo-docs` from
  `plugins/repo-docs`. They installed at 0.2.0 and 0.1.3 and showed as enabled.
- **Found, not fixed.** Two `apply` runs within the same second pick the same backup
  name, so the second refuses: "could not back up ... (EEXIST); nothing was written".
  It fails safe, and 0.1.3 names backups the same way.

### 2026-10-04: release 0.2.0, Windows

A personal Windows 11 machine, not the work machine. The scratch CLIs from npm were
Claude Code 2.1.283 and codex-cli 0.157.1, with Node 26.4.0 and Git 2.55.0.windows.5.
The scratch profiles were `claude-m6` and `codex-m6`. Git credentials were turned off
as in the earlier public runs: `git config --list` printed nothing, and `git ls-remote`
read `main` and both tags at b3806f2. A session on that machine ran a brief and
reported here. The real profile's five files had the same sha256 after the run as
before.

- **Upgrade from GitHub.** `claude-m6` had the 0.1.3 plugins from GitHub at 5da2c2c.
  `claude plugin marketplace update reimagine-code` printed "Successfully updated
  marketplace: reimagine-code" and left `enabledPlugins` on the `recode` keys. The next
  `claude plugin list` still showed the old plugins, each with a note such as `Renamed
  to "ccx-loop" in the "reimagine-code" marketplace`, and moved the keys to the `ccx`
  names; the one after showed only `repo-docs`. Installing `ccx-loop` printed "(+ 1
  dependency: ccx)", both at 0.2.0 from b3806f2. The old data directory stayed, and
  `ccx-reimagine-code` did not exist yet. In `codex-m6`, after `codex plugin marketplace
  upgrade reimagine-code`, `codex plugin list` showed `ccx` as not installed and no
  `recode` line, while `config.toml` still enabled `recode`. `codex plugin add
  ccx@reimagine-code` and `codex plugin remove recode@reimagine-code` exited 0 and left
  the `ccx` and `repo-docs` tables.
- **Item 18 passed on Windows for 0.2.0, from the public repository.**
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.2.0, `ccx` 0.2.0, and
    `repo-docs` 0.1.3 installed and were enabled, each recording b3806f2 and a GitHub
    source.
  - In `codex-m6`, `ccx` 0.2.0 and `repo-docs` 0.1.3 showed as installed and enabled,
    with the clone at b3806f2.
  - Headless `/ccx:setup` passed in 11 s: the `unelevated` sandbox, the ChatGPT login,
    `workspace-write` proven, one allow rule naming the 0.2.0 `scripts/ccx.mjs` with
    forward slashes, and "old plugins: none found".
  - A first `/ccx:ask` from a folder outside any git repository was refused by the
    bridge, as 0.1.3 does: "ccx: not inside a git repository, so nothing was run". From
    the item 19 repository, in auto mode, it printed "141" and `status: ok`.
- **Item 19 passed for 0.2.0.** The repository was `C:\recode accept\ccx020\repo`.
  - A project skill that delegates to `ccx:implement` printed "Changed a - b to a + b
    in the add definition in math.mjs" and `status: ok`.
  - The installed 0.2.0 rules script, with a scratch `CLAUDE.md` in CRLF holding text of
    its own, planned `absent` and `change: ready`, and `apply` exited 0. All 89 line
    breaks stayed CRLF, and the text above the block was kept.
  - With that file converted to LF, `status` read `current` and `plan` read `change:
    none`, where 0.1.3 read `edited` in the M7 step 2 run. This is the issue 16 fix.
  - Codex, started from PowerShell, made commit a315823, and its session file holds the
    repo-docs reminder. The hook was already trusted in `codex-m6` and stayed trusted
    through the reinstall. Claude Code made commit d0af8f0, with the reminder in its
    transcript.
  - The copy of the Codex login was deleted afterward.

### 2026-10-04: ccx-loop 0.3.0, before the merge

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The runs installed the
suite from a local clone of `feat/loop-tiers` at 5bd6ee9, with the two 0.3.0 tags made in
the clone only, into the M4 profile, which was restored afterward. Installing the loop
printed "(+ 1 dependency: ccx)". The runs were headless, in auto mode, with a copy of the
Codex login that was deleted afterward. No permission denial occurred. The real
`~/.claude` and `~/.codex` files had the same sha256 after the runs as before.

- **Item 16 passed before the release.** About 1,268 always-on tokens for `ccx` and 504
  for `ccx-loop`, down from 508.
- **Item 7 passed.** Each run called `ccx-loop:ccx-loop` with the invocation block.
  With the option unset or true, the plan review was `ccx:ask` at `gpt-6-astra`. With
  `--no-codex`, `codex` absent from `PATH`, or the option false, it was the `fable`
  fallback and the report named the reason. The `.ccl.json` run and a run with
  `.recode.json` ended `blocked` and created nothing. Every plan recorded Codex
  `gpt-6-astra` as the Step 5 role, with no higher-risk criterion.
- **Item 8 passed.** Every run ended as the item expects, with the Codex role served by
  its `fable` fallback under `--no-codex`.
- **Item 20 passed, except the late switch.**
  - **Plan review.** It was `gpt-6-astra` in all 14 runs that called Codex. Plans at
    low, medium, and high for a one-function change got Codex, with `gpt-6.1-sol`
    implementing at low and medium and `gpt-6-astra` at high.
  - **Higher-risk cases.** A risk floor trigger got Claude `code-review high` and a
    Sonnet slice. Nine files over two slices got Claude `code-review medium`. A new
    module imported by another file got Claude `code-review low`.
  - **Lower-risk cases.** Eight files over two slices got Codex, and so did a comment-only
    edit in an auth module.
  - **xhigh.** The same one-function change at xhigh came out higher-risk: Codex's plan
    review called the new export a public API change, and the plan accepted it. Whether a
    change carries a trigger is the plan's judgment, so the role can differ between runs.
  - **Without `code-review`.** With the skill turned off through `skillOverrides`, a
    lower-risk run passed Step 5 with Codex and ended `prepared`. A higher-risk run ended
    `blocked` at the start of Step 5, naming the missing skill. `--disallowedTools
    'Skill(code-review)'` left the skill listed.
  - **Worktree and Multi-repo.** A higher-risk worktree run got the Opus stand-in and no
    `code-review` call. A higher-risk Multi-repo run got `code-review low` for the primary
    and the Opus stand-in for the second repository.
  - **Late switch.** It could not be staged. In the one try, the planner read the check
    that needed a ninth file and planned it, so the run was higher-risk from the plan.
    The switch to Claude after the plan is not yet checked by a run.
- **Item 9 passed.** In `vibecodedapps-dev/recode-accept-a` and `recode-accept-b`, four
  runs on new issues a#26 to a#29 and b#7, each in a fresh clone, all ended `done` with
  CI green.
  - The Codex run opened PR 30, with `gpt-6-astra` reviewing the plan and the diff and
    `gpt-6.1-sol` implementing.
  - The `--no-codex` run opened PR 31.
  - The `--continue t114` run, with a skip-worktree edit, worked in
    `<parent>/r3-ccx-2026-10-04-26` and posted to PR 5.
  - The `--repo` run opened PR 32 in `a` and PR 8 in `b`, each closing its own issue and
    referring to the other's.
  - Every run had the Codex role, with no higher-risk criterion. The issue and PR comments,
    the snapshots under `specs/ccx/<run-id>/`, and cca's `handoff.sh check` were as for
    0.2.0.

### 2026-10-04: release 0.3.0

macOS 27.0, Claude Code 2.1.288, codex-cli 0.159.2, Node 26.4.0. The release commit was
a4b7fd8, the merge of PR 21. Git credentials were turned off for the GitHub runs as for
0.2.0. No permission denial occurred. The real `~/.claude` and `~/.codex` files had the
same sha256 after the runs as before.

- **Item 17 passed for 0.3.0.** The dry runs named `ccx--v0.3.0` and
  `ccx-loop--v0.3.0`. The repo-docs dry run refused, because `repo-docs--v0.1.3` already
  exists and repo-docs did not change. `claude plugin tag --push` then created and
  pushed both tags at a4b7fd8. The 0.2.0 tags still point at b3806f2, and the remote
  holds no bare `v` tag. Lint and tests on `main` passed with the tags.
- **Update from GitHub.** In the M4 profile, with 0.2.0 installed from GitHub,
  `claude plugin marketplace update reimagine-code` printed "Successfully updated
  marketplace: reimagine-code". `claude plugin update`, run once per plugin, printed
  `Plugin "ccx-loop" updated from 0.2.0 to 0.3.0` and the same for `ccx`, each with
  "Restart to apply changes". Both recorded a4b7fd8. `repo-docs` was "already at the
  latest version (0.1.3)" and kept its earlier commit.
- **Item 16 passed for 0.3.0.** `claude plugin details` reported about 1,268
  always-on tokens for `ccx`, 504 for `ccx-loop`, and 169 for `repo-docs`. `ccx-loop`
  is down from 508 and 6 tokens under its limit.
- **Item 18 passed on macOS for 0.3.0, from the public repository.** `git ls-remote`
  read `main` and both tags at a4b7fd8.
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.3.0, `ccx` 0.3.0, and
    `repo-docs` 0.1.3 installed and were enabled, each recording a4b7fd8 and a GitHub
    source.
  - In `codex-m6`, with the marketplace removed and added again, `ccx` 0.3.0 and
    `repo-docs` 0.1.3 installed and showed as enabled, with the clone at a4b7fd8.
  - In the M4 profile, `/ccx:setup` reported the sandbox proven, one allow rule naming
    the 0.3.0 `scripts/ccx.mjs`, and "old plugins: none found". A headless `/ccx:ask`
    with "What is 17 times 3? Reply with the number only." printed "51" and `status:
    ok`. The copy of the Codex login was deleted afterward.
  - In a scratch repository with a local bare `origin`, `/ccx-loop:plan "add a mul
    function to math.mjs" --effort max` was refused: "`--effort max` isn't valid because
    the max tier has been removed. Use `--effort xhigh` for the highest tier instead".
    No branch, commit, or `.ccx/` folder was created.
- **Item 11 passed for 0.3.0.** In a new Codex home holding only the model, effort,
  sandbox, and approval settings, and no login, `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` cloned a4b7fd8. `codex plugin list` showed
  exactly `ccx` from `plugins/ccx-codex` and `repo-docs` from `plugins/repo-docs`. They
  installed at 0.3.0 and 0.1.3 and showed as enabled.
- **Not rerun.** Items 1, 3 to 6, 12 to 15, and 19: `ccx`, the Codex `ccx`, and
  `repo-docs` changed only their version since 0.2.0. Items 7 to 9 and 20 ran before the
  merge on the same loop files; see the record before this one.

### 2026-10-04: release 0.3.0, Windows

The personal Windows 11 machine, with the scratch CLIs from npm: Claude Code 2.1.283 and
codex-cli 0.157.1, with Node 26.4.0 and Git 2.55.0.windows.5. The scratch profiles were
`claude-m6` and `codex-m6`, both at the 0.2.0 plugins from GitHub. Git credentials were
turned off as in the earlier public runs: `git config --list` printed nothing, and `git
ls-remote` read `main` and both 0.3.0 tags at a4b7fd8 and the 0.2.0 tags at b3806f2. A
session on that machine ran a brief and reported here. The real profile's five files had
the same sha256 after the run as before.

- **Update from GitHub.**
  - In `claude-m6`, `claude plugin marketplace update reimagine-code` printed
    "Successfully updated marketplace: reimagine-code". `claude plugin update
    ccx-loop@reimagine-code` moved `ccx-loop` to 0.3.0 and left its dependency `ccx` at
    0.2.0. `claude plugin update ccx@reimagine-code` then moved `ccx` to 0.3.0. Both
    recorded a4b7fd8, and `repo-docs` stayed at 0.1.3. The old version folders stay in
    the plugin cache.
  - In `codex-m6`, `codex plugin marketplace upgrade reimagine-code` alone moved `ccx`
    to 0.3.0, installed and enabled, with `repo-docs` at 0.1.3. The 0.2.0 folder was
    removed from the cache.
- **Item 18 passed on Windows for 0.3.0, from the public repository.**
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.3.0, `ccx` 0.3.0, and
    `repo-docs` 0.1.3 installed and were enabled, each recording a4b7fd8 and a GitHub
    source.
  - In `codex-m6`, `ccx` 0.3.0 and `repo-docs` 0.1.3 showed as installed and enabled,
    with the clone at a4b7fd8.
  - In the item 19 repository from the 0.2.0 run, headless `/ccx:setup` passed in 11 s:
    `workspace-write` proven, one allow rule naming the 0.3.0 `scripts/ccx.mjs` with
    forward slashes, and "old plugins: none found". `/ccx:ask` in auto mode printed
    "141" and `status: ok`.
  - In a scratch repository with a local bare `origin`, `/ccx-loop:plan "add a mul
    function to math.mjs" --effort max` was refused with no tool call: "`--effort max`
    isn't a valid value anymore because the max tier is gone. Use `--effort xhigh`
    instead". The repository and its origin were unchanged.
  - The copy of the Codex login was deleted afterward.
- **Not rerun.** Item 19: the bridge's spawn code, the rules command, and the hook did
  not change.

### 2026-10-05: ccx 0.3.1, before the merge

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The runs installed the
suite from a local clone of `fix/review-rounds` at dfdb503, with the three tags made in
the clone only, into the M4 profile, which was restored afterward. Installing the loop
printed "(+ 1 dependency: ccx)", and `ccx` 0.3.1, `ccx-loop` 0.3.1, and `repo-docs`
0.1.4 were installed. Git credentials were off for every item except item 9. The runs
were headless, in auto mode, with copies of the Codex login that were deleted
afterward. No permission denial occurred. The real `~/.claude` and `~/.codex` files had
the same sha256 after the runs as before.

- **Item 16 passed before the release.** About 1,268 always-on tokens for `ccx`, 504 for
  `ccx-loop`, and 169 for `repo-docs`, as for 0.3.0.
- **Item 1 passed.** `/ccx:setup` reported codex-cli 0.160.0, the ChatGPT login, and a
  proven `workspace-write` sandbox. Its allow rule named the clone's
  `plugins/ccx/scripts/ccx.mjs`, because a catalog from a local folder runs the plugin
  from that folder; the clone and the cache copy were identical. `/ccx:ask` printed "51"
  and `status: ok`. A test skill's `ccx:implement` changed one line of `math.mjs`, and
  the footer showed ` M math.mjs` and `status: ok`.
- **Item 3 passed.** Both diffs were shown and asked about separately. A new session
  quoted "Before adding a dependency, once per package, with the reason." After
  `--remove`, each file equaled its original and its first backup (`cmp`). With the Codex
  home missing, status showed `codex: skipped` and no folder was created.
  - **New in 0.3.1.** Through the installed `rules.mjs`, a symlinked target got its block
    in the file the link points to, the link stayed a link, and the backup sat beside
    that file; removal restored it exactly. A `CLAUDE.md` with mode 600 kept mode 600
    after apply and removal, and so did its backups.
- **Signals from Claude Code.** A test command that records the signal it gets showed
  SIGTERM in each case that sent one. A Bash call that reached its 5 s timeout moved to
  the background with no signal, and got SIGTERM only when the session ended. With
  `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`, the timeout sent SIGTERM, exit 143. A
  background task stopped with `TaskStop` got SIGTERM. So the bridge's SIGTERM handling
  covers what Claude Code sends.
- **Item 8 passed.** All seven cases under `--no-codex` ended as the item expects. No
  run made a Codex call, and no `pre-<n>.*` file was written.
- **Item 9 passed.** In `vibecodedapps-dev/recode-accept-a` and `recode-accept-b`, four
  runs on new issues a#33 to a#36 and b#9, each in a fresh clone, all ended `done` with
  CI green.
  - The Codex run opened PR 37, with `gpt-6-astra` reviewing the plan and the diff and
    `gpt-6.1-sol` implementing. It wrote `pre-1.status`, `pre-1.patch`, and
    `pre-1.hashes`, empty on a clean tree, and `run.md` recorded the call's checkout. The
    cca manifest named the PR, whose live head was the run's commit.
  - The `--no-codex` run opened PR 38 and wrote no snapshot.
  - The `--no-codex --continue t114` run worked in `<parent>/r3-ccx-2026-10-05-35` and
    posted to PR 5. Its issue asked for a missing function, because earlier runs had
    already fixed every bug on `t114`.
  - The `--repo` run opened PR 39 in `a` and PR 10 in `b`, each closing its own issue and
    referring to the other's. It wrote `pre-1` for the first checkout and `pre-2` for
    the second.
  - The comments, the snapshots under `specs/ccx/<run-id>/`, and cca's `handoff.sh
    check` were as for 0.3.0.
- **Item 11 passed.** In a new Codex home holding only the model,
  effort, sandbox, and approval settings, `codex plugin marketplace add` with the
  clone's path listed exactly `ccx` from `plugins/ccx-codex` and `repo-docs` from
  `plugins/repo-docs`. They installed at 0.3.1 and 0.1.4 and showed as enabled. After
  the push, the same check passed from GitHub with `--ref fix/review-rounds`, credentials
  off.
- **Item 13 passed.** The audit read the skill from the installed 0.1.4 and reported the
  missing `docs/missing.md` as an error. After "Review hooks" and `t`, `config.toml`
  held a `trusted_hash` for each of the two hooks. The commit run's session file holds
  the reminder starting "repo-docs: this command commits".
- **Item 14 passed.** The audit called the Skill tool with `repo-docs:repo-docs` and
  reported the missing spoke. The commit's transcript holds a `hook_additional_context`
  attachment with the reminder. New in 0.1.4, `echo "git commit"` got no reminder, and
  `git -C "./" commit` got one.
- **Item 15 passed.** The audit reported no errors and changed no file. Its session check
  failed in the scratch profile, as in M5. This repository's session in the author's own
  profile, the same day, loaded `AGENTS.md` as project instructions.
- **Item 20, the late switch, could not be staged.** Two tries hid a check that failed
  unless the new function moved to its own imported module. The loop read the check's
  source in Step 0, the second time after decoding it, and planned the module up front,
  so each run was higher-risk from the plan. Both ended `prepared` with Claude
  `code-review low`, and both wrote the `pre-1.*` snapshot before the Codex implementer.
- **Observed.** Two loop runs read a file in the real `~/.claude`: `settings.json` in one
  and `CLAUDE.md` in another, while scanning for instructions. Neither wrote there.
- **Not rerun.** Item 2: how a request reaches Codex, the sandbox flags, and the footer
  did not change, except the footer of a run stopped by a signal, which the tests cover.
  codex-cli moved from 0.159.2 to 0.160.0, and items 1, 9, and 13 ran on it.
  Items 4 to 7, 10, and 12: `suite.mjs`, the hooks of `ccx`, the style, the loop's
  dependencies, Step 0, and the Codex skills did not change. Items 17 and 18 wait for the
  tags. Item 19 ran on Windows after the push; see the next record.

### 2026-10-05: ccx 0.3.1, before the merge, Windows

The personal Windows 11 machine, with the scratch CLIs from npm: Claude Code 2.1.283 and
codex-cli 0.157.1, with Node 26.4.0 and Git 2.55.0.windows.5. The scratch profiles were
`claude-m6` and `codex-m6`, with the suite installed from `fix/review-rounds` at
d3ce17a. Git credentials were turned off, with `GIT_CONFIG_GLOBAL` set to an empty file
in PowerShell. A session on that machine ran a brief and reported here. The real
profile's five files had the same sha256 after the run as before.

- **Install from the branch.** `claude plugin marketplace add` with
  `#fix/review-rounds` recorded a `git` source with that ref. Installing `ccx-loop`
  alone printed "(+ 1 dependency: ccx)" but installed `ccx` 0.3.0 from a4b7fd8, and
  `claude plugin update ccx@reimagine-code` said `ccx` was "already at the latest
  version satisfying >=0.2.0 <1.0.0". The dependency probably resolves through the
  release tags, and `ccx--v0.3.1` did not exist yet; after the tags it resolved to 0.3.1
  on both hosts. Installing `ccx` and then `ccx-loop` gave 0.3.1, 0.3.1, and 0.1.4 at
  d3ce17a. Codex installed `ccx` 0.3.1 and `repo-docs` 0.1.4 with `--ref`.
- **Item 19 passed for 0.3.1, except two parts.** The repository was
  `C:\recode accept\ccx031\repo`.
  - Setup proved `workspace-write` in 13 s, with one allow rule naming the 0.3.1
    `scripts/ccx.mjs` with forward slashes. The ask printed "159" and `status: ok`. A
    project skill's `ccx:implement` added one line to `math.mjs`, with ` M math.mjs` and
    `status: ok`.
  - The installed rules script kept all 90 line breaks of a CRLF `CLAUDE.md` as CRLF and
    the text above the block, and after the file was converted to LF, `status` read
    `current`.
  - With the Codex `AGENTS.md` a hard link to the Claude `CLAUDE.md` (`mklink /H`),
    `plan` read "state: skipped; it is the same file as the Claude target, so the Codex
    file is left alone", and `apply claude` refused with "has multiple hard links, so
    nothing was written", exit 1. Two different files both planned `absent` and
    `ready`. This is the first Windows run of the same-file check.
  - Codex made commit ee66e5e with the reminder in its session file, and Claude Code made
    68ae12c and 5328e36, the second through `git -C "C:\recode accept\ccx031\repo"`,
    each with the reminder from `PreToolUse:PowerShell`. `echo "git commit"` got none.
    Auto mode, and then default mode, denied the Codex commit, so the user ran it.
  - With `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` and a 20 s Bash timeout, Claude Code
    stopped an ask with exit 143. No `codex` or bridge process was left after 5 s.
  - **Not run.** The symbolic link cases, because `mklink` and Node's `symlinkSync`
    lacked the privilege without Developer Mode. A real Ctrl-C and the bridge's last line
    after it, which need an interactive session.
  - The copies of the Codex login were deleted afterward.

### 2026-10-05: release 0.3.1

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The release commit was
b09112e, the merge of PR 23. Git credentials were turned off for the GitHub runs. No
permission denial occurred. The real `~/.claude` and `~/.codex` files had the same
sha256 after the runs as before.

- **Item 17 passed for 0.3.1.** The dry runs named `ccx--v0.3.1`, `ccx-loop--v0.3.1`,
  and `repo-docs--v0.1.4`. `claude plugin tag --push` created and pushed all three at
  b09112e, and the remote holds no bare `v` tag. Lint and tests on `main` passed.
- **Update from GitHub.** In the M4 profile, with 0.3.0 installed from GitHub,
  `claude plugin marketplace update reimagine-code` and `claude plugin update`, once per
  plugin, moved `ccx-loop` and `ccx` from 0.3.0 to 0.3.1 and `repo-docs` from 0.1.3 to
  0.1.4.
- **Item 16 passed for 0.3.1.** About 1,268 always-on tokens for `ccx`, 504 for
  `ccx-loop`, and 169 for `repo-docs`.
- **Item 18 passed on macOS for 0.3.1, from the public repository.** `git ls-remote`
  read `main` and the three tags at b09112e.
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.3.1, `ccx` 0.3.1, and
    `repo-docs` 0.1.4 installed, each recording b09112e.
  - In `codex-m6`, with the marketplace removed and added again, `ccx` 0.3.1 and
    `repo-docs` 0.1.4 installed and showed as enabled, with the clone at b09112e.
  - In the M4 profile, `/ccx:setup` reported the sandbox proven and one allow rule naming
    the 0.3.1 `scripts/ccx.mjs`. Its old-plugins line named
    `codex-code-review-general@codex-code-review`, which that profile's copy of the Codex
    config enables. A headless `/ccx:ask` with "What is 17 times 3? Reply with the number
    only." printed "51" and `status: ok`. The copy of the Codex login was deleted
    afterward.
- **Item 11 passed for 0.3.1.** In a new Codex home holding only the model, effort,
  sandbox, and approval settings, and no login, `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` cloned b09112e. `codex plugin list` showed
  exactly `ccx` and `repo-docs`, which installed at 0.3.1 and 0.1.4 and showed as enabled.

### 2026-10-05: release 0.3.1, Windows

The personal Windows 11 machine, with Claude Code 2.1.283, codex-cli 0.157.1, Node
26.4.0, and Git 2.55.0.windows.5. Git credentials were turned off: `git config --list`
printed nothing. A session on that machine ran a brief and reported here. The real
profile's five files had the same sha256 after the run as before.

- **Item 18 passed on Windows for 0.3.1, from the public repository.** `git ls-remote`
  read `main` and the three tags at b09112e.
  - In `claude-m6`, with the catalog removed and added again with no ref, installing the
    loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.3.1, `ccx` 0.3.1, and
    `repo-docs` 0.1.4 installed and were enabled, each recording b09112e. The install
    finding of the run before the merge is gone.
  - In `codex-m6`, with the marketplace added again with no ref, `ccx` 0.3.1 and
    `repo-docs` 0.1.4 showed as installed and enabled, with the clone at b09112e.
  - In the item 19 repository, headless `/ccx:setup` passed in 33 s: `workspace-write`
    proven, one allow rule naming the 0.3.1 `scripts/ccx.mjs` with forward slashes, and
    "old plugins: none found". `/ccx:ask` in auto mode printed "51" and `status: ok`.
  - The copy of the Codex login was deleted afterward.

### 2026-10-05: release cca 0.9.0

macOS 27.0, Claude Code 2.1.289, Node 26.4.0. The release commit was 17a7859, the merge of
PR 25, which imported claude-codex-audit 0.8.1 at eed9fba as `plugins/cca`. CI run
37339721318 on the PR passed on ubuntu-latest, macos-latest, and windows-latest, the
Windows job in 16 minutes with the cca suites under `npm test` for the first time there,
and the Ubuntu mawk step printed `<name> test: ok` for all seven awk suites. The scratch
profile was the M4 one, `~/.cache/recode-acceptance/claude`, backed up first with `cp -a`
and left with `cca` 0.9.0 installed afterward. Every `claude -p` and plugin command below
ran with `CLAUDE_CONFIG_DIR` set to it; only `claude plugin tag` and `validate`, which
read the repository, ran without it.

- **Item 17 passed for cca 0.9.0.** `claude plugin tag --dry-run plugins/cca` named
  `cca--v0.9.0` at HEAD, and `claude plugin tag --push plugins/cca` created the annotated
  tag at 17a7859 and pushed it. `npm run lint` printed `lint: ok` with the tag present.
- **Item 18 passed for cca, macOS.** In the scratch profile, after
  `claude plugin uninstall cca@vibecodedapps-claude-codex-audit` (0.5.1) and
  `claude plugin marketplace remove vibecodedapps-claude-codex-audit`,
  `claude plugin marketplace update reimagine-code` (the GitHub source) and
  `claude plugin install cca@reimagine-code` installed `cca` 0.9.0. Windows: not run.
- **Item 21 passed, with one headless limit.** The `solo` fixture was built with
  `sh tests/cca/fixture/build.sh solo`. From the fixture's `app` repository,
  `claude -p "/cca:audit <manifest> --budget 0 --no-codex" --model opus
  --permission-mode acceptEdits --allowedTools <Read, Write, Skill, and Bash patterns>`:
  stage 1 ran, stage 8 wrote `report.md`, the run ended `partial` with
  `verdict: audit incomplete`, the reply printed `/cca:resume 2026-10-05-1243-app-feature`,
  and `stages.json` recorded `plugin_version` `0.9.0`. The fixture's
  `git status --porcelain` was the same before and after (its own untracked `notes/`),
  and `HEAD` stayed on `feature`. The limit: in a headless run under `CLAUDE_CONFIG_DIR`,
  Claude Code refuses `mkdir` and writes under that directory as a sensitive location,
  so two first tries stopped in stage 1 setup when the run directory fell back to the
  plugin data directory (the first left an empty run directory there, removed by hand;
  the second was refused at the `mkdir`), and the passing run used a manifest copy with
  `"scratch": "./app/.test-output/cca"` (the fixture's ignored path); even then
  `runs.json` in the data directory could not be written, so the run is not registered
  for resume by id. An interactive session probably asks instead of refusing; not run.
  The second opinion was not involved (`--no-codex`).
- **Not run.** Item 22 (stage 6 through `ccx`, which needs a logged-in Codex and a live
  multi-agent run) and item 23 (cca's M3-c). Both are listed for the review rounds.

### 2026-10-06: ccx 0.3.2, ccx-loop 0.3.2, cca 0.9.1, repo-docs 0.1.5, before the merge

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The runs installed the
suite from a local clone of `fix/review-rounds-2`, first at e8f91d1 (items 1, 3, 7, 8, 9,
11, 16, 20), then at a8e8448 after the approved fixes (items 13, 14, 15, 21, 22), and
last at cfebd40, the branch head, for the rerun of two maintain cases, with the four tags
made in the clone only, into the M4 profile, which was restored afterward. `ccx` 0.3.2,
`ccx-loop` 0.3.2, `cca` 0.9.1, and `repo-docs` 0.1.5 were installed; the loop's install
printed no dependency line, since `ccx` was already installed. Git credentials were off
for every item except item 9. The runs were headless, in auto mode, except item 21's
interactive step, with copies of the Codex login in per-runner Codex homes that were
deleted afterward, and at most two Codex sessions at once. No permission denial
occurred, except Claude Code's built-in removal check on cca's registry command, noted
under item 21, which every run recovered from. The real `~/.claude` and `~/.codex`
files had the same sha256, and the same `auth.json` and `installed_plugins.json` times,
after the runs as before; one transcript was left under `~/.claude/projects/`, noted
under item 15. The branch's later commits (465a59f to cfebd40) changed docs, the skill
texts the later installs carried, and the description's line breaks; the first install's
runs stand for the code they exercised, which those commits did not touch.

- **Item 16 passed before the release.** About 1,268 always-on tokens for `ccx` (of
  1,300), 504 for `ccx-loop` (of 510), 176 for `repo-docs` (169 at 0.1.4), and 1,173
  for `cca`.
- **Item 1 passed.** `/ccx:setup` reported codex-cli 0.160.0, the ChatGPT login, and a
  proven `workspace-write` sandbox; its allow rule named the clone's
  `plugins/ccx/scripts/ccx.mjs`, the path the init event lists. `/ccx:ask` printed "51"
  and `status: ok`; a test skill's `ccx:implement` changed one line of `math.mjs`, with
  ` M math.mjs` and `status: ok` in the footer.
  - **New in 0.3.2.** An ask from a repository whose directory name ends in a space
    printed "42"; the init event, the bridge's `cwd:` line, and Codex's session log kept
    the trailing space, and no sibling directory appeared.
- **Item 3 passed.** Both diffs were shown and asked about separately; a new session
  quoted the dependency rule; after `--remove`, `cmp` matched each file against its
  original and its first backup; with the Codex home missing, status showed
  `codex: skipped` and no folder was created; the profile's `CLAUDE.md` was
  byte-identical afterward.
  - **New in 0.3.2.** Through the installed `rules.mjs`: a config directory named
    `cafe` with an acute accent on the `e` got a valid UTF-8 JSON plan with its path as
    written, and the block applied; a diff line reading `Le cafe est pret.` with its
    two accented letters showed as written; the unquoted `--options core, writing` was
    refused, exit 1, nothing changed, with `ccx: unexpected argument "writing" after
    --options list`, which names the stray argument rather than the form to use (the
    command text gives the form); the quoted `"core, writing"` was trimmed and accepted
    as `core,writing`. A control run with 0.3.1's `rules.mjs` showed all three old
    defects: an invalid plan, the directory name shown as two mojibake characters, and
    `writing` dropped.
  - Observed: a refused `plan` still updates the data directory's modification time
    through its lock directory; Claude ran `cat` on the profile's `CLAUDE.md` after the
    removal applied, read-only and outside the command's allowed tools, as at 0.3.1;
    with only `core` chosen, Claude pointed at the writing-rules file too.
- **Item 7 passed.** Six cases: `--no-codex`, `codex` off `PATH` (its `codex --version`
  exit 127), and the plugin option set to false each ended `plan-only` with a `# ccx run
  report`, `.ccx/` excluded, no Codex call, and the `fable` fallback named with its
  reason; a `.ccl.json` ended `blocked` at Step 0.1 in 28 seconds with "rename to
  `.ccx.json`" and nothing created; with the option unset and true, `no-codex: false`
  and the plan review called `ccx:ask --model gpt-6-astra`, `status: ok`. The option
  cases ran first: `claude plugin configure ccx-loop@reimagine-code --values-stdin`
  with `{"codex":"false"}` saved a boolean, and `settings.json` was restored by `cp`
  (`cmp` equal twice).
  - **New in 0.3.2.** A `--continue feat-sub --confirm-plan --no-codex --no-publish` run
    ended `prepared`; `run.md` recorded the second check of the changed request ("also
    add a mul function, with a test"), "tier stays low", the implementer unchanged, and
    "Rounds used 2/3". A run detached at `origin/feat-sub`, with no local branch of that
    name, reached the fixed path: "Step 3.5 item 3 rechecks: ... no local feat-sub ...
    Passed".
- **Item 8 passed.** Seven cases as at 0.3.1: no `pre-*` file, no Codex call beyond
  `codex --version`, 14 reports with the template's sections, nothing pushed; the two
  `--no-publish` runs read the user settings from `$CLAUDE_CONFIG_DIR`. Across items 7
  and 8: 21 headless turns in 15 sessions, all exit 0, empty stderr.
  - Observed: two runs still read the real `~/.claude` read-only (a `cat
    ~/.claude/CLAUDE.md` at Step 0.1 before the profile's copy, and a listing of
    `~/.claude/plugins/cache` while checking for cca), although the skill now names the
    location; one run checked the branch name after creating the branch, the reverse of
    Step 3.7.2's order, and recorded this itself; one run records the skipped snapshot
    only in `run.md`; some plan-only chat summaries say a run would commit.
- **Item 9 passed, with one run `blocked` by design.** In
  `vibecodedapps-dev/recode-accept-a` and `recode-accept-b`, five runs on new issues
  a#40 to a#44 and b#11, each in a fresh clone, credentials on.
  - The Codex run (`#40 --effort low`) opened PR 45 with `Closes #40`, CI green, `done`;
    `pre-1.*` empty on a clean tree, the snapshot under `specs/ccx/2026-10-06-40/`, the
    cca manifest naming `#45`, and `handoff.sh check` printing `handoff: ok`.
  - The `--no-codex` run (`#41`) opened PR 46, `done`, tier medium, no `pre-*`.
  - The `--no-codex --continue t114` run (`#42`) worked in
    `<parent>/r3-ccx-2026-10-06-42`, pushed to `t114`, posted to PR 5, `done`; its issue
    asked for a missing `abs`, since `t114` has every bug fixed.
  - The `--repo` run (a#43 with b#11) made one branch in both repositories, PR 47 in `a`
    and PR 12 in `b`, each closing its own issue and referring to the other, with
    `pre-1` and `pre-2`, CI green on both, `done`.
  - **New in 0.3.2.** The `--no-codex` run on `#44` had its PR 48 closed by the runner
    at the watch's first PR read while the check was pending (taken under the item 9
    approval, which did not list it). The run ended `blocked`, the report said
    `PR: .../pull/48 (CLOSED, not merged)`, no `done`, and no comment was posted on the
    issue or the PR; PR 48 stays closed and unmerged.
  - **`--hostname` check, a model-adherence gap.** Of 51 `gh api` calls across the runs,
    13 lacked `--hostname`: ten in polling loops the model wrote as one shell loop in
    runs 2 and 5, and three in ad hoc reads (two diagnostic reads in run 4, one
    `issues/48/events` read in run 5). Every call the skill writes carries the flag
    (lint enforces it), every handoff read and every call to `recode-accept-b` had it,
    and all calls reached github.com, so nothing broke; on a GitHub Enterprise host the
    bare calls would go to gh's default host. The same loop form made run 5 end
    `blocked` 79 seconds after it first read `CLOSED`. The CI watch's polling item now
    says one read per Bash call and never a shell loop over several reads (a8b6bfb,
    17dbd8d), text that no live run has exercised yet.
  - Observed: run 4's first branch-protection read 404'd on a path it built itself,
    then reread correctly; runs 1 and 4 wrote `pre-<n>.hashes` as empty files on clean
    trees; runs 2 and 5 ran `codex --version` under `--no-codex` without a session; no
    run read the real `~/.claude` or `~/.codex`.
  - Left on GitHub: issues a#40 to a#44 and b#11 open; PRs a#45, a#46, a#47, and b#12
    open; new pushes to PR 5; PR a#48 closed; the runs' status and report comments.
    Nothing merged, no settings changed, nothing pushed to `main`.
- **Item 11 passed in its local form.** In a new Codex home holding only the model,
  effort, sandbox, and approval settings, `codex plugin marketplace add` with the
  clone's path listed exactly `ccx` from `plugins/ccx-codex` and `repo-docs` from
  `plugins/repo-docs`; they installed at 0.3.2 and 0.1.5 and showed as enabled, every
  command exit 0. With the login present, `codex plugin list` also showed the account's
  `openai-curated-remote` catalog. The GitHub form waits for the push.
- **Item 20 partial.** Try 1 passed: a lower-risk first judgment with the Step 5 role
  Codex `gpt-6-astra` and the implementer Codex `gpt-6.1-sol`; the plan-approval reply
  "Put clamp in its own module lib/clamp.mjs and re-export it from math.mjs, then go
  ahead." was recorded as an ad-hoc input; the verification and the risk floor reran,
  the implementer was chosen again (still Codex), the second judgment was higher-risk
  under the third criterion, and the Step 5 role moved to Claude `code-review low`, tier
  low and the 120-minute budget kept, plan review 2 of 3 rounds. The run asked again
  instead of acting on "then go ahead", as Step 3.5 says, so a second reply "yes"
  followed; `prepared`; the report names the switch and the reason; `pre-1.*` empty on
  a clean tree; `run.md` records "session checkout". Try 2, the Step 4.5 switch, was not
  staged: the only device left was changing an ignored lint tool during the approval
  wait, a covert change. Not reached: the base-commit comparison (the planning snapshot
  was the base) and the budget reset on a tier rise.
  - Observed: try 1 read the profile's `settings.json`, not the real `~/.claude`, where
    0.3.1's runs had read the real one; the low-tier `code-review` recipe skips test
    files by design, so `test.mjs` was not reviewed.
- **Slip.** One `codex --version` without `CODEX_HOME` while a runner oriented created a
  per-invocation temporary folder under the real `~/.codex/tmp/arg0/`, holding an empty
  lock and three symlinks to the codex binary, which Codex itself removed later; the
  five hashes and the two times were unchanged.
- **Setup observation.** After the clone moved from e8f91d1 to a8e8448, `claude plugin
  update` reported ccx-loop, cca, and repo-docs "already at the latest version" and left
  the cached copies unchanged, while `ccx` went "from 0.3.2 to 0.3.2-a8e84482c22d
  (highest tag satisfying >=0.2.0 <1.0.0 from ccx-loop)". Removing and re-adding the
  marketplace and reinstalling the four plugins refreshed the copies; the removal also
  deleted the plugins' data directories in the profile.

- **Item 13 passed.** In a scratch Codex home holding a login copy, repo-docs 0.1.5 and
  ccx 0.3.2 installed from the clone; the audit read the installed skill, reported the
  missing spoke `docs/missing.md` as an error, and left `git status --porcelain` empty;
  after "Review hooks" and `t`, `config.toml` held a `trusted_hash` for each of the two
  hooks; the commit run's session file holds the hook's "repo-docs: this command
  commits" line; the login copy was deleted afterward. The commit run added an
  untracked `docs/missing.md` placeholder as its follow-up, where 0.1.4's run had
  removed the pointer.
- **Item 14 passed.** The audit called the Skill tool with `repo-docs:repo-docs`,
  reported the missing spoke as an error, and changed nothing; the commit's transcript
  holds a `hook_additional_context` attachment the stream output does not show;
  `echo "git commit"` got no reminder, and `git -C "./" commit --allow-empty` got it.
  Maintain mode, four scratch repositories, every change left staged and uncommitted:
  (a) a sole tracked `.claude/CLAUDE.md` became the root `AGENTS.md` with `## Spokes`,
  no `.claude/` directory, `.claude/AGENTS.md`, or adapter left; (b) a tracked
  `.claude/CLAUDE.md` holding `@AGENTS.md` and one rule beside a hub: the import was
  dropped, the rule went into the hub, the file was deleted, no adapter added; (c) an
  ignored personal `CLAUDE.md` beside a hub stayed byte- and mtime-identical, read and
  mentioned, not touched; (d) a sole tracked root `CLAUDE.md` with two rules and
  `@~/.claude/notes.md` was renamed to `AGENTS.md`, the import reported and neither
  inlined nor made a pointer, its line kept in the renamed hub. These ran against the
  a8e8448 install; b60c91b then reworded the sole-file rule ("only tracked instruction
  file") and the import rule ("a file that stays or is renamed"), which is what case
  (d) did. Cases (a) and (d) were rerun with the install at cfebd40, whose cached
  `spokes.md` equals the clone's and this repository's: both passed again, (a) with the
  three lines in the root `AGENTS.md`, the path already root-relative, no `.claude/`
  left, and (d) with the two lines in the renamed hub, the import kept as a bare line
  there, reported under "Needs your decision", not inlined and not made a pointer.
  - Observed: the headless maintain runs read the real home, `ls -a ~/.claude` in (a)
    and `cat ~/.claude/notes.md` (absent) in (d), reads only; the hubs they wrote use
    `## Constraints`, and (d) left an empty `## Spokes` with the import as a bare line
    after the bullets; (a) and (d) used `git mv` plus a rewrite, (b) `git rm`.
- **Item 15 passed, on the second run.** The first run read files while the wording
  commits 0d6e4a2 to 2bcadf9 were being made in the working tree and was discarded.
  The second, on a clean tree at 2bcadf9 under the scratch profile, reported no
  errors (one `## Spokes` line, 11 well-formed pointers, every path present, no tracked
  `CLAUDE.md`, `.claude/AGENTS.md`, override, local file, or symlink), left `git status
  --porcelain --ignored` identical, and found: the session check failing under the
  scratch profile, as expected (with `CLAUDE_CONFIG_DIR` elsewhere, `~/.claude/CLAUDE.md`
  loads as the `.claude/CLAUDE.md` of an ancestor directory, so `AGENTS.md` does not);
  `references/platforms.md:9` ("the user's `~/.claude/CLAUDE.md` does not count")
  holding only while `~/.claude` is the active config directory; and four pointers that
  could be narrower. The author-profile session check answered YES with
  `reimagine-code/AGENTS.md` listed: the audit ran it itself, and this record's
  orchestrating session loaded the hub in the author's profile too.
  - Observed: the audit's own control run, `env -u CLAUDE_CONFIG_DIR claude -p` under
    auto mode, used the real `~/.claude` and left a 28-line transcript under
    `~/.claude/projects/-Users-joe-Code-Local-reimagine-code/`; it was not deleted.

- **Item 21 passed.** cca 0.9.1 read from the clone; the init event listed the four
  `cca:` commands. The headless budget-0 run exited 0 with stages 1 and 8 complete and
  stages 4 to 7 `not run: budget expired`, state `partial`, verdict `audit incomplete`,
  the `/cca:resume <run-id>` line printed, the entry in `runs.json`, `plugin_version`
  `0.9.1` in `stages.json`, no `runs.json.lock` left, and the fixture's `git status
  --porcelain` and HEAD unchanged. Without the `scratch` key, an interactive session in
  auto mode wrote the data directory under the auto classifier with one prompt, the lock
  release, answered yes; in default mode the data-directory `mkdir` and every Write
  asked, about 33 one-time yeses, and nothing was refused: 0.9.0's refusal under
  `acceptEdits` did not recur in either mode, and `acceptEdits` itself was not rerun.
  - Observed: Claude Code's built-in removal check denied the registry command when the
    run wrote its release as `rmdir $L/$O $L` with shell variables, five times in five
    runs, headless and interactive; each run re-issued it with literal absolute paths,
    as the denial text suggests, and recovered at the cost of one turn, though the first
    denied command in the headless run also held the `mkdir` acquisition, so the lock
    was not taken until the retry. The check says no permission rule can allow it.
    `build.sh` landed both fixtures under `/var/folders/` because macOS `mktemp -d`
    ignores `TMPDIR`; they were moved before use. A headless run emits a `result` event
    each time it waits on a background agent, four in item 22, so only the last one is
    the end. The interactive budget-0 reply volunteered code opinions the empty report
    did not hold.
- **Item 22 passed.** With `ccx` 0.3.2 installed and a login copy in a scratch Codex
  home, stage 6 called `ccx:ask` with `--model gpt-6.1-sol --timeout 540`; the ledger
  entry has `codex.called` true, `ccx_version` `0.3.2`, `codex_timeout` 540, and
  `timeout_note` "capped at 540 s: unsure whether a user can answer prompts in this
  session"; the run ended `reported`, verdict `not ready`. After `ccx` and `ccx-loop`
  were uninstalled, `/cca:resume <run-id> --from 6` swapped to `cca:adversary` with
  the reason "ccx not installed or version unreadable", `codex.called` false,
  `ccx_version` "not installed", and ended `reported`. The login copy was deleted and
  the Codex slot released.
  - Observed: the swapped run's stage 6 entry keeps `codex_model`, `codex_timeout`, and
    `timeout_note` from the first run although no Codex call was made. The headless
    runs reported `claude-opus-5-5`; the fallback adversary ran on Fable.
- **Install note.** Items 13, 14 (the first maintain run), 15, 21, and 22 ran with the
  plugins installed from the clone at a8e8448. The later commits 0d6e4a2 to cfebd40
  change skill text only: the cca same-owner lock paragraph, its lock report trigger,
  and the README lock sentence, which no item exercises; the repo-docs sole-file and
  import clauses, rerun under item 14; and the ccx-loop polling sentence, which item 9
  had already exercised in its earlier wording.

- **Not run.** Item 19 (Windows; a brief is ready), item 11's GitHub form, and items 17
  and 18, which need the push and the tags.

### 2026-10-06: release ccx 0.3.2, ccx-loop 0.3.2, cca 0.9.1, repo-docs 0.1.5

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The release commit was
e6c9ee2, the merge of PR 29, whose CI run 37462456379 passed on ubuntu-latest,
macos-latest, and windows-latest, the Windows job in 16 minutes. Git credentials were
off for the GitHub runs except the tag pushes. No permission denial occurred. The real
`~/.claude` and `~/.codex` files had the same sha256, and the same `auth.json` and
`installed_plugins.json` times, after the runs as before.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.3.2`,
  `ccx-loop--v0.3.2`, `cca--v0.9.1`, and `repo-docs--v0.1.5` at HEAD. `claude plugin tag
  --push` created and pushed all four at e6c9ee2, `ccx` first, then `ccx-loop`, `cca`,
  and `repo-docs`; the remote holds the four and no bare `v` tag. `npm run lint` on
  `main` printed `lint: ok` with the tags present.
- **Update from GitHub.** In the M4 profile, restored to its state before the review
  rounds with 0.3.1, 0.3.1, 0.9.0, and 0.1.4 installed from GitHub, `claude plugin
  marketplace update reimagine-code` moved the catalog clone to e6c9ee2, and `claude
  plugin update`, once per plugin, moved `ccx` and `ccx-loop` to 0.3.2, `cca` to 0.9.1,
  and `repo-docs` to 0.1.5.
- **Item 18 passed on macOS for this release, from the public repository.** `git
  ls-remote` read `main` at e6c9ee2 and the four tags peeling to it.
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.3.2, `ccx` 0.3.2,
    `cca` 0.9.1, and `repo-docs` 0.1.5 installed, each recording e6c9ee2.
  - In `codex-m6`, with the marketplace removed and added again, `ccx` 0.3.2 and
    `repo-docs` 0.1.5 installed and showed as enabled, with the clone at e6c9ee2. Right
    after the re-add, before the two `codex plugin add` commands, `codex plugin list`
    still showed 0.3.1 and 0.1.4; not explained.
  - In the M4 profile, `/ccx:setup` proved the sandbox as `workspace-write` and printed
    one allow rule naming the 0.3.2 `scripts/ccx.mjs`. A headless `/ccx:ask` with "What
    is 17 times 3? Reply with the number only." printed "51" and `status: ok`, with no
    permission denial. The copy of the Codex login was deleted afterward.
- **Item 11 passed for this release.** In a new Codex home holding only the model,
  effort, sandbox, and approval settings, and no login, `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` cloned e6c9ee2. `codex plugin list` showed
  exactly `ccx`, from `plugins/ccx-codex`, and `repo-docs`, which installed at 0.3.2
  and 0.1.5 and showed as enabled.
- Windows: items 18, 19, and 21 ran on the user's machine the same day; see the next
  record.

### 2026-10-06: release ccx 0.3.2, ccx-loop 0.3.2, cca 0.9.1, repo-docs 0.1.5, Windows

The personal Windows 11 machine, with Claude Code 2.1.283, codex-cli 0.157.1, Node
26.4.0, and Git 2.55.0.windows.5. Git credentials were turned off (`GIT_CONFIG_GLOBAL`
set to an empty file, since the commands ran in PowerShell): `git config --list` printed
nothing. A session on that machine ran a brief and reported here. `git ls-remote` read
`main` and the four tags, all peeling to e6c9ee2. The real profile's five files had the
same sha256 after the runs as before; every copy of the Codex login was deleted after its
run. Nothing in the checkout changed, nothing was committed, nothing was posted.

- **Item 18 passed on Windows for this release, from the public repository.**
  - In `claude-m6`, with the catalog removed (which uninstalled the three old plugins)
    and added again with no ref, `ccx`, `ccx-loop`, `cca`, and `repo-docs` installed at
    0.3.2, 0.3.2, 0.9.1, and 0.1.5, enabled, each recording e6c9ee2; with `ccx`
    installed first, the loop printed no dependency line.
  - In `codex-m6`, with the marketplace added again, `ccx` 0.3.2 and `repo-docs` 0.1.5
    showed as installed and enabled, with the clone at e6c9ee2.
- **Item 19 passed on Windows for 0.3.2, except two skipped parts.** In the repository
  under `C:\recode accept\ccx032\repo` (`npm test`: 1 pass):
  - Headless `/ccx:setup` passed in 11 s: `workspace-write` proven, one allow rule naming
    the 0.3.2 `scripts/ccx.mjs` with forward slashes, "old plugins: none found".
    `/ccx:ask` in auto mode printed "57" and `status: ok`; `/ccx:implement` through a
    project skill reported the same HEAD before and after, ` M math.mjs`, and
    `status: ok`, having added one line to `math.mjs`.
  - New in 0.3.2: a `config.toml` copy beginning with a `notes` string that holds an
    escaped `\"""` let 0.3.2's setup read the Windows sandbox setting and prove
    `workspace-write`, where 0.3.1's `ccx.mjs` on the same file printed that the mode is
    not set and left the sandbox untested. The rules command, in a config directory
    named `cafe-` plus an accented `e`, wrote `rules-plan.json` as strict UTF-8 JSON with
    the path as written, showed the diff line ` Order a cafe before noon.` (with its
    accent) in UTF-8, and applied the block keeping that line. The unquoted
    `--options core, writing` was refused, exit 1, nothing written, with
    `ccx: unexpected argument "writing" after --options list`; the quoted
    `"core, writing"` was trimmed and accepted, and `core,writing` worked.
  - Rules with CRLF: 90 CRLF lines, 0 bare LF, the text above the block kept; after
    converting to LF, status read `current` with `options=core,windows`. The hard-link
    and two-file cases match 0.3.1: the plan skipped the Codex file as the same file,
    `apply claude` refused the multiply linked `CLAUDE.md` with exit 1, and two separate
    files both planned absent and ready.
  - Hook: two Claude Code commits, one through `git -C "<path>" commit --allow-empty`,
    carry the reminder in their transcripts from `PreToolUse:PowerShell`, and
    `echo "git commit"` got none; a Codex commit run by the user from PowerShell through
    a script has the reminder in its session file, and Codex did not ask about the hook.
  - Ctrl-C: with the bridge started from PowerShell and Ctrl-C pressed while Codex ran,
    it printed `ccx: the run failed: codex was ended by SIGTERM; no turn.completed event
    arrived`, the thread id, the Resume line, and `status: failed`; no `codex` or
    `ccx.mjs` process was left, and the request file was removed. In an interactive
    `/ccx:ask`, Ctrl-C stopped Codex and left no process, but Claude Code showed only its
    own "The user doesn't want to proceed with this tool use" and none of the bridge's
    output. Unverified: whether Node on Windows reports the stopped child as SIGTERM or
    the bridge ends Codex with SIGTERM after Ctrl-C; a macOS Ctrl-C run would tell.
  - Skipped: a repository whose folder name ends in a space, since Windows drops the
    space on `mkdir` and `git init` fails in a folder made with the `\\?\` prefix; and the
    symbolic-link rules cases, since Developer Mode is off and `mklink` needs it.
- **Item 21 passed on Windows for 0.9.1.** `sh tests/cca/fixture/build.sh solo` worked in
  Git Bash. With `"scratch": "./app/.test-output/cca"` in a manifest copy, headless
  `/cca:audit <manifest> --budget 0 --no-codex` in auto mode ran in 313 s, exit 0: the
  four `cca:` commands listed; stage 1 ran and stage 8 wrote `report.md` with
  `terminal state: partial` and `verdict: audit incomplete`; the reply ended with the
  `/cca:resume <run-id>` line; `stages.json` records `plugin_version` `0.9.1`; `runs.json`
  in the data folder holds the run as `partial`, where the 0.9.0 run could not write it;
  no `runs.json.lock` is left; the fixture's `git status --porcelain` is unchanged and
  HEAD stays on `feature`. Inside the audited session, the built-in removal check
  blocked the lock release once, and the session reran it with literal paths, as on
  macOS; none of the outer session's calls were denied.
- **Observed.** The bridge prints nothing until Codex ends, so a Ctrl-C test has no cue
  for when to press it. Left on the machine: an empty `repo2 ` folder, the test
  repositories and rules folders under `C:\recode accept\ccx032`, and the fixture under
  `%TEMP%`.

### 2026-10-06: ccx 0.4.0 and ccx-loop 0.4.0, before the merge

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The runs installed the
suite from a local clone of `chore/drop-migration` at a428d21, with the tags
`ccx--v0.4.0` and `ccx-loop--v0.4.0` made in the clone only, into the M4 profile, which
was restored afterward. `ccx` 0.4.0, `ccx-loop` 0.4.0, `cca` 0.9.1, and `repo-docs`
0.1.5 were installed. Git credentials were off. The runs were headless, in auto mode,
with one copy of the Codex login in item 1's Codex home, deleted right after the
implement run, and one Codex session at a time. No permission denial occurred. The real
`~/.claude` and `~/.codex` files had the same sha256, and the same `auth.json` and
`installed_plugins.json` times, after the runs as before. The release's other changes,
the removed README sections, catalog map, and loop gate, have no item left to run: items
5 and 7 dropped their retired cases in the same commit.

- **Item 16 passed before the release.** About 1,241 always-on tokens for `ccx` (of
  1,300; 1,268 at 0.3.2, before the shorter setup description), 504 for `ccx-loop` (of
  510), 180 for `repo-docs`, and 1,173 for `cca`. Unverified: `repo-docs` reads 180
  against 176 at 0.3.2 with no change in the plugin since; the clone's path differs from
  the earlier run's, and no run changing only that was made.
- **Item 1 passed.** `/ccx:setup` reported codex-cli 0.160.0, the ChatGPT login, and a
  proven `workspace-write` sandbox; its allow rule named the clone's
  `plugins/ccx/scripts/ccx.mjs`, the path the init event lists. `/ccx:ask` printed "51"
  and `status: ok`; a test skill's `ccx:implement` changed one line of `math.mjs`, with
  ` M math.mjs` and `status: ok` in the footer.
  - **New in 0.4.0.** Setup's output was the three Codex lines and the allow rule, with
    no `old plugins` line and no uninstall or remove command, though the copied
    `config.toml` still enables an old Codex review plugin, which the 0.3.2 setup had
    listed; the command runs one command, and its description reads "Check Codex
    version, login, sandbox mode, write sandbox, and the allow rule";
    `suite.mjs old-plugins` printed `ccx: use session-start <dataDir>` and exited 1.
- **Item 3 passed.** Both diffs were shown and asked about separately; a new session
  quoted the dependency rule; after `--remove`, `cmp` matched each file against its
  original and its first backup; with the Codex home missing, status showed
  `codex: skipped` and no folder was created; the profile's `CLAUDE.md` was
  byte-identical afterward. Claude made only the expected `rules.mjs` calls, with no
  extra read of the profile's `CLAUDE.md`.
  - **New in 0.4.0.** Through the installed `rules.mjs` and `suite.mjs`, on a `CLAUDE.md`
    holding a line of its own and a well-formed block under the old `recode:house-rules`
    marker: `status` reported the target `absent`; `plan` and `apply` added a
    `ccx:house-rules` block after it, with the old three lines kept byte for byte, and
    `status` then read `current`. Session start with the old block in both targets
    printed nothing and exited 0, while a positive control with item 4's stale block
    printed the notice. A control with 0.3.2's scripts, from a worktree at
    `ccx--v0.3.2`, read the same file as `stale` and printed a session notice naming
    `recode:house-rules`.
  - Not run: a Codex session quoting a rule, since the rules Codex home has no login;
    the `windows` option; the Codex target of the old-block case.

### 2026-10-06: release ccx 0.4.0 and ccx-loop 0.4.0

macOS 27.0, Claude Code 2.1.289, codex-cli 0.160.0, Node 26.4.0. The release commit was
63bb082, the merge of PR 32, whose CI run 37487887863 passed on ubuntu-latest,
macos-latest, and windows-latest, the Windows job in 12 minutes. cca 0.9.1 and repo-docs
0.1.5 were not released again. Git credentials were off for the GitHub runs except the
tag pushes. No permission denial occurred. The real `~/.claude` and `~/.codex` files had
the same sha256, and the same `auth.json` and `installed_plugins.json` times, after the
runs as before; with the user's approval, the author's real profile was updated to the
released versions before the runs, and its two house-rules blocks read as current under
0.4.0's session-start check.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.4.0` and
  `ccx-loop--v0.4.0` at HEAD. `claude plugin tag --push` created and pushed both at
  63bb082, `ccx` first; the remote holds them, with `cca--v0.9.1` and `repo-docs--v0.1.5`
  still at e6c9ee2, and no bare `v` tag. `npm run lint` on `main` printed `lint: ok`
  with the tags present.
- **Update from GitHub.** In the M4 profile, with 0.3.2, 0.3.2, 0.9.1, and 0.1.5
  installed from GitHub, `claude plugin marketplace update reimagine-code` moved the
  catalog clone to 63bb082, and `claude plugin update`, once per plugin, moved `ccx` and
  `ccx-loop` to 0.4.0 and said `cca` and `repo-docs` were already at the latest version.
- **Item 18 passed on macOS for this release, from the public repository.** `git
  ls-remote` read `main` at 63bb082 and the two new tags peeling to it.
  - In `claude-m6`, with the plugins and catalog removed and added again, installing
    the loop alone printed "(+ 1 dependency: ccx)". `ccx-loop` 0.4.0, `ccx` 0.4.0,
    `cca` 0.9.1, and `repo-docs` 0.1.5 installed, each recording 63bb082, the catalog
    clone's head at install time.
  - In `codex-m6`, with the marketplace removed and added again, `ccx` 0.4.0 and
    `repo-docs` 0.1.5 installed and showed as enabled, with the clone at 63bb082. Right
    after the re-add, before the two `codex plugin add` commands, `codex plugin list`
    still showed `ccx` 0.3.2, as it had shown the old versions at 0.3.2; the cache then
    held only that version, so the list probably reads the installed cache. Unverified.
  - In the M4 profile, `/ccx:setup` reported codex-cli 0.160.0 and the login, proved the
    sandbox as `workspace-write`, printed one allow rule naming the 0.4.0
    `scripts/ccx.mjs`, and printed no `old plugins` line, though that Codex home's
    `config.toml` still enables an old review plugin. A headless `/ccx:ask` with "What
    is 17 times 3? Reply with the number only." printed "51" and `status: ok`, with no
    permission denial. The copy of the Codex login was deleted afterward.
- **Item 11 passed for this release.** In a new Codex home holding only the model,
  effort, sandbox, and approval settings, and no login, `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` cloned 63bb082. `codex plugin list` showed
  exactly `ccx`, from `plugins/ccx-codex`, and `repo-docs`, which installed at 0.4.0 and
  0.1.5 and showed as enabled.
- Windows: items 18 and 19 for 0.4.0 run on the user's work machine through its clean
  install; not yet recorded.
- Observed: the `main` CI run for the merge, 37490608650, failed its macOS job on cca's
  `working-tree.sh`, case 6h, "dirty submodule: the object count changed", while ubuntu
  and Windows passed and the same tree had passed the PR's macOS job minutes earlier;
  the `main` run for PR 30, 37472970721, failed the same job on `revert-tests.sh`.
  Neither suite changed since 0.9.1.

### 2026-10-06: ccx 0.5.0, adopt run before the merge

macOS 27.0, Claude Code 2.1.292, Node 26.4.0. The user ran item 3's adopt run by hand in
an interactive session, in scratch profiles under `/tmp/ccx-accept-050` (a
`CLAUDE_CONFIG_DIR` and a `CODEX_HOME`, deleted afterward), with `ccx` 0.5.0 installed
from `feat/rules-adopt` at 482496e. No Codex run was needed. The scratch `CLAUDE.md`
held a note of its own; the scratch `AGENTS.md` held `# My Codex notes`, the shipped
core rules, and a `## Mine` section with one line of its own.

- **The adopt run passed.** `/ccx:rules` with `core` showed `claude` as `absent` with
  `recommend: apply` and no overlap note, and `codex` with `note: 30 of 30 rules already
  present outside the block; applying duplicates them`, `recommend: adopt`, and the
  `--adopt` hint. The user declined `claude` and chose adopt for `codex`; the second
  pass showed `recommend: apply` and a diff that removed the hand copy and put the block
  after `# My Codex notes`, before `## Mine`. After apply, `AGENTS.md` equalled the
  planned content byte for byte, held one copy of the rules, inside the block, and kept
  `## Mine` and its line; the backup equalled the original file's sha256, and
  `CLAUDE.md` was unchanged.
- **Remove after adopt left the headings.** `/ccx:rules --remove` showed `claude` as
  having no block and a `codex` diff that removed only the block lines. After apply,
  `AGENTS.md` was exactly `# My Codex notes`, `## Mine`, and its line, as R42 says for
  a file adopted into. Before the confirmation, the session warned that removing the
  adopted block also removes the rules the file held before adopting.
- Observed: `/plugin install ccx@reimagine-code` typed in the scratch session installed
  nothing (no `installed_plugins.json`, `/reload-plugins` reported 0 plugins); `claude
  plugin install ccx@reimagine-code` run from the shell with the same
  `CLAUDE_CONFIG_DIR` installed it. Not investigated further.

### 2026-10-06: release ccx 0.5.0 and ccx-loop 0.5.0

macOS 27.0, Claude Code 2.1.292, codex-cli 0.160.0, Node 26.4.0. The release commit was
95e66bc, the merge of PR 34; its tree equals 4a14bee, whose PR CI run 37547103100 passed
on ubuntu-latest, macos-latest, and windows-latest after one rerun of the macOS job (see
the observation below), and the `main` run for the merge, 37551283726, passed on all
three. cca 0.9.1 and repo-docs 0.1.5 were not released again. The
GitHub runs used new scratch profiles under `/tmp/ccx-rel-050`, deleted afterward. The
real `~/.claude` and `~/.codex` files had the same sha256 and modification times after
the runs as before.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.5.0` and
  `ccx-loop--v0.5.0` at HEAD. `claude plugin tag --push` created and pushed both at
  95e66bc, `ccx` first; `git ls-remote` showed both tags peeling to 95e66bc, and no bare
  `v` tag. `npm run lint` on `main` printed `lint: ok` with the tags present.
- **Item 18 passed on macOS for this release, from the public repository, except for
  setup and ask.** `git ls-remote` read `main` at 95e66bc. In a new scratch Claude
  profile, installing the loop alone printed "(+ 1 dependency: ccx)"; `ccx-loop` 0.5.0,
  `ccx` 0.5.0, `cca` 0.9.1, and `repo-docs` 0.1.5 installed, each recording 95e66bc. In a
  new scratch Codex home, `ccx` 0.5.0 and `repo-docs` 0.1.5 installed and showed as
  enabled. `/ccx:setup` and `/ccx:ask` were not run: the scratch profiles had no login.
- **Item 11 passed for this release.** In a new Codex home with no login, `codex plugin
  marketplace add vibecodedapps-official/reimagine-code` cloned 95e66bc. `codex plugin
  list` showed exactly `ccx`, from `plugins/ccx-codex`, and `repo-docs`, which installed
  at 0.5.0 and 0.1.5.
- Not run: item 16, the always-on token check; the update from GitHub of a profile
  holding 0.4.0; and Windows, items 18 and 19.
- Observed: the PR's macOS job first failed the rules speed test, `not ok 446 - units and
  imports grow about linearly: four times the input takes under eight times as long`,
  at `grows(stray, (t) => imports(t), 8000) < 8`; the rerun passed. Locally the ratio at
  that size was 3.95 to 4.14 over five runs, so a slow runner is the likely cause,
  unverified. In the agent shell, `codex plugin` commands exited 1 with `Error: stdin is
  not a terminal` until stdin came from `/dev/null`.
