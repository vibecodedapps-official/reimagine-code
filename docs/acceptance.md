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
   `origin`. Command: `/ccx-loop:plan "<a one-function change>" --effort medium`, in
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
   Command: `/ccx-loop:run "<the same change>" --no-codex --effort medium`, in separate
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
   multi-repo run; Codex logged in. Command: `/ccx-loop:run #1 --effort medium`; then
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
    0.4.0, and for 0.5.0, 2026-10-07 for 0.6.0 on Windows, 2026-10-10 for 0.7.0 on
    macOS, and 2026-10-10 for 0.7.1 on Windows and on macOS; see the records.
12. **Code review on Codex.** Setup: as item 11, in a scratch git repository with
    `math.mjs`, `test.mjs`, and a `package.json` whose `test` script passes, then an
    uncommitted change that renames an export, gives `add` a third argument with a
    default, and adds an untested function. Command: `codex exec --json -s read-only "Run
    the general-code-review skill on the uncommitted changes in this repository." <
    /dev/null`. Expected: a review with findings; under `$CODEX_HOME/sessions`, the main
    session reads `general-code-review/SKILL.md` and its subagent sessions read each of
    `general-code-review-breaking-changes`, `-context`, and `-testing` from the installed
    plugin. Covers R29. Rerun when a skill changes. Run 2026-10-03, and 2026-10-07 for
    0.6.0 on Windows; see the records.
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
    and after the merge, 2026-10-06 for 0.3.2 and 0.4.0 before the merge, and
    2026-10-07 for 0.6.0 on Windows, 2026-10-10 for 0.7.0 on macOS without a login, and
    2026-10-10 for 0.7.1 on Windows and on macOS; see the records.
17. **Tags.** Setup: the release commit on `main`. Command: `claude plugin tag --push`
    on `plugins/ccx`, then `plugins/ccx-loop`, then `plugins/repo-docs`; then
    `git ls-remote --tags origin`. Expected: each tag command checks the manifest against
    its catalog entry and pushes; the remote holds a `<plugin>--v<version>` tag for each
    plugin's new version, and no bare `v` tag. Covers R49. Rerun at each release. Run
    2026-10-03 for 0.1.0, 2026-10-04 for 0.1.1, 0.1.2, 0.1.3, 0.2.0, and 0.3.0,
    2026-10-05 for 0.3.1 and cca 0.9.0, and 2026-10-06 for 0.3.2, cca 0.9.1, and
    repo-docs 0.1.5, for 0.4.0, and for 0.5.0, 2026-10-07 for 0.6.0 and cca 0.10.0, and
    2026-10-09 for 0.6.1, cca 0.10.1, and repo-docs 0.1.6, and 2026-10-09 for 0.6.2 and
    cca 0.10.2, 2026-10-10 for 0.7.0 and cca 0.11.0, and 2026-10-10 for 0.7.1 and cca
    0.12.0; see the records.
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
    Windows, 2026-10-06 for 0.4.0 and 0.5.0 on macOS, and 2026-10-07 for 0.6.0 and cca
    0.10.0 on Windows, 2026-10-10 for 0.7.0 and cca 0.11.0 on macOS and Windows, and
    2026-10-10 for 0.7.1 and cca 0.12.0 on Windows and on macOS; see the records.
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
    0.3.2 except the symbolic links and a folder name ending in a space, and
    2026-10-10 for 0.7.0 except the Ctrl-C, the symbolic links, and the trailing space,
    and 2026-10-10 for 0.7.1 except those and the Codex hook; see the records.
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
    - every plan review is on the tier's Codex reviewer (`gpt-6.1-sol` at medium,
      `gpt-6-astra` at high and xhigh);
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
    this catalog, Codex logged in, and the `patterns` fixture, run with a manifest copy
    whose `scratch` is `./app/.test-output/cca`, a path that ends in `cca`. Command:
    `/cca:audit <manifest> --effort low`; then uninstall `ccx` and run `/cca:resume
    <run-id> --from 6`.
    Expected: in the first run, stage 6 records the `ccx` version, calls `ccx:ask` with
    a timeout of at most 540 seconds when the session is headless or cannot tell
    whether a user can answer, and its ledger entry has `codex.called` true, a
    `codex.ccx_version`, and that `codex_timeout`; in the second, the stage swaps to
    `cca:adversary` with the reason "ccx not installed or version unreadable" and the
    run still ends `reported`. From cca 0.10.0 and ccx 0.6.0, also in the first run:
    the session's tool calls include `cp -- "<src>" "<run dir>/codex/response.md"` and
    no Write or Edit of that file; `codex/response.md` starts with the text ccx printed
    for the call, without its `output:` line; the `<src>` file is gone from ccx's data
    directory afterward; and when step 8 makes a follow-up, its answer is appended after
    a `--- follow-up, thread <id> ---` line of its own. From cca 0.10.1, also: stage 1
    writes out the run directory and `<scratch>/cca` as whole paths before its `mkdir`;
    the run directory is `.test-output/cca/cca/<run-id>/`, with the doubled `cca`, and
    the `runs.json` entry's `path` is that directory; and the resume reuses that
    recorded directory, creating no other directory under the scratch path and leaving
    one `runs.json` entry for the id. Covers R63 and R71. Rerun when stage 6, the
    bridge's output lines, the run directory step of stage 1, or the catalog changes.
    Run 2026-10-06 for 0.9.1, 2026-10-07 for cca 0.10.0 and ccx 0.6.0 on Windows, and
    2026-10-09 for cca 0.10.1 and ccx 0.6.1 on Windows; see the records.
23. **cca items under the new names.** The list was drawn 2026-10-05 from
    `docs/history/claude-codex-audit/acceptance.md`: only case M3-c (a session started
    outside any git repository, where the bridge refuses and the run swaps) names the
    bridge, read as `ccx`; it was never run there. Every other case keeps its result and
    reruns under that file's conditions. Expected: M3-c's own result. Rerun when stage 6
    changes. Run 2026-10-07 for cca 0.10.0 and ccx 0.6.0 on Windows; see the records.
24. **cca background-fetch question.** Setup: as item 21, interactive, in a session
    whose directory is the fixture's `app` repository, which has no remote configured
    (`git remote` prints nothing), after `git update-ref refs/remotes/origin/main HEAD`
    there, with a manifest copy whose `scratch` is `./app/.test-output`, a path that
    does not end in `cca`. Command: `/cca:audit <manifest> --no-codex`; while stage 4
    runs, move that ref from a second shell with
    `git update-ref refs/remotes/origin/main HEAD~1`. Expected:
    the run directory is `.test-output/cca/<run-id>/`, one `cca` level below the scratch
    path. The next boundary check asks whether a background fetch explains the moved
    ref, and the question, before the user answers, names the ref with its old and new
    commits, says that a background fetch, such as an editor's or a Git client's
    automatic fetch, can move refs even though the repository has no remote, and
    recommends no answer and marks no option as preferred. On yes, `stages.json`
    `approvals` gains one `background-fetch` entry with target
    `app:refs/remotes/origin/main` and both commits, the run goes on, and the next check
    passes without asking. Moving the ref again asks again. On no, the run ends
    `blocked`. Moving the ref together with an edit to a tracked file ends the run
    `blocked` without asking. Covers Part 19 item 1 in `docs/decisions.md`. Rerun when
    the boundary check or the run directory step in the cca skill changes. Run
    2026-10-07 for 0.10.0 and 2026-10-09 for 0.10.1, both on Windows; see the records.
25. **Loop inputs, repeated findings, and not-run checks.** Setup: a scratch git
    repository as in item 7 whose only remote is a `dev.azure.com` URL, in a session
    with no `gh` login for that host; a second such repository with a local bare
    `origin`; for the GitHub case, a throwaway GitHub repository with two issues, only
    the second labeled `bug`. Command, in headless sessions:
    - on the Azure remote, `/ccx-loop:run 12345 and 67890`, `/ccx-loop:plan 12345 and
      67890`, and `/ccx-loop:plan 12345 and 67890 --branch work/ab-12345`, each stopped
      after step 3 of the command;
    - on the GitHub repository, `/ccx-loop:plan #1 #2`, stopped after step 3, and a
      `--no-codex --effort medium` run of `#1 #2` stopped after Step 3.7 creates the branch;
    - on the local remote, `/ccx-loop:run "<a one-function change>" --no-codex --effort
      medium --no-publish` three times, with `.ccx.json` `checks` listing in turn a command
      against an unreachable host, the same command against a reachable one, and a
      command the permission mode denies;
    - a run whose Sonnet implementer is continued into a second round;
    - a run where a reviewer repeats a finding rejected in an earlier round without new
      evidence, and one where the repeat cites evidence the rejection did not cover.

    Expected: for the three Azure commands, the report's header carries `Run id: not
    allocated (would have been <today>-12345-and-67890)`, the `Hint:` line, and
    `Branch: none created (a run would use work/12345-and-67890)`, the same with
    `work/ab-12345` for the `--branch` run; when the session also prints text before the
    Skill call or before the skill's first tool call, that text is the hint, the block,
    and the `run id:` and `branch:` lines of step 3, with the suffix rule, and nothing
    else; the invocation block is unchanged from 0.6.1. The GitHub plan's report names the
    branch a run would use, and the run creates `fix/1-2-<slug>`. The
    unreachable check is reported as not run with its exact command and the reason; the
    reachable one runs; the denied one ends the run `blocked`. The continued
    implementer's prompt carries the intent-to-add sentence. The repeated finding with
    no new evidence is recorded as repeated and not re-verified; the one with new
    evidence is verified. Covers Part 22 items 1 and 2 in `docs/decisions.md` and issue
    47. Rerun when a loop command's step 3, carve-out 3, Step 5.3, Step 6.2, or the
    implementer prompt changes. Run on Windows on 2026-10-09 (the record below): the
    checks and the branch rule passed, the command's step 3 text did not appear headless,
    and the `fix/` branch, the continued prompt, and the new-evidence repeat were left
    pending. Run on macOS on 2026-10-09 (the record below): the checks, both branch
    forms, and the no-new-evidence repeat passed; the step 3 text was absent in every
    headless session and in an interactive one, which moved the lines into the report
    header, rerun and passed the same day; the continued prompt and the new-evidence
    repeat did not arise.
26. **Audit closing, act closing, live import, and placement.** Setup: as item 21, with
    the `solo` fixture and `--no-codex`; a copy of the fixture whose `app/AGENTS.md`
    says that history and rationale go in commit messages, not file headers, and whose
    change adds a comment block of history to a source file; a scratch
    `CLAUDE_CONFIG_DIR` whose `CLAUDE.md` holds one placement rule. Command, in
    headless sessions where a run is long:
    - `/cca:audit <manifest> --budget 0`, then `/cca:audit <manifest> --effort low`;
    - a run whose report leaves one live check `not run: not approved`; then
      `/cca:act <run-id> <one recommended id>`, approving the commit; then
      `/cca:resume <run-id> --live <file>` with a valid file;
    - a fresh run with an open live check, `/cca:resume <run-id> --live <file>` with
      refs unchanged, and again after `git update-ref` moves the base ref alone;
    - the placement fixture at `--effort low`, then `/cca:act` on the item that
      recommends moving the history;
    - a run whose `runs.json` entry is removed before stage 8 ends;
    - a `partial` run whose stages 2 and 3 are `not_applicable` and whose unfinished
      work is at stage 6 or later, with a live check open;
    - a report that holds an other decision the change needs and a scope claim
      recommended `defer`;
    - a run, then an edit to the scratch `CLAUDE.md` placement rule, then
      `/cca:resume <run-id>` and `/cca:resume <run-id> --from 1`.

    Expected: the `--budget 0` run prints the plain resume line and the `next:` list with
    `act first: none`; the low run's closing prints `act first` with ids and reasons, the
    `/cca:act <run-id> <ids>` line with `C<n>` ids only, `your decision`, and no `--live`
    line when it leaves no live check open, and the report's section 1 holds the same lines after the verdict line under
    `next:`, with no line starting `#### C`, `- claim `, or `#### live `. With an open
    live check the closing prints the `--live` line with the sentence about the file;
    act's step 1.3 confirmation carries the live warning; act's closing says `runs.json`
    is unchanged, gives the log's path, and prints the `live results needed` line with
    the committed clause; `runs.json` shows the audit's state as before and `act/log.md`
    holds the approve, baseline, stage, check, and commit entries; the `--live` import
    after act's commit is refused with the recorded and current head shas, the head
    marked `(moved)`. The import with unchanged refs succeeds; the moved base alone is
    refused with both base shas and `(moved)` on the base. The placement fixture's
    recommendation names the commit message as the home, and act's edit lands there, not
    in the file header. The missing-entry run prints the JSON entry and says the act and
    `--live` lines need it first. The inapplicable-stages `partial` run prints the
    `--live` line. The other decision and the deferred scope claim appear under `your
    decision`. The plain resume after the `CLAUDE.md` edit changes nothing in the brief;
    `--from 1` writes the new rule into Placement rules. A trailing explanation on a
    verdict line is rejected by `ledger.sh`, in `tests/cca/ledger.sh` on every CI
    system. Covers Part 22 items 3, 4, and 5 in `docs/decisions.md` and issue 46.
    Rerun when stage 8 step 14, `report.md` section 1, act's steps 1.3, 4, or 8,
    resume's `--live` guard, or the placement rule changes. Run on Windows on 2026-10-09
    (the record below): the closings, the act and `--live` cases, the placement cases, and
    the missing entry passed; the inapplicable-stages run with a live check open and the
    deferred scope claim were not produced. Run on macOS on 2026-10-09 (the record
    below): every case passed, the two not produced on Windows included, and the PR
    bundle's act text; the `under review` and mapped-ref clauses of act did not arise.
27. **Three tiers, routed models, step files, and cca's cheaper roles.** Setup: the
    scratch profile of item 7 with `ccx-loop` and `cca` installed from this repository's
    catalog; the three-file loop fixture with a local bare `origin`; the `full` cca
    fixture from `sh tests/cca/fixture/build.sh full`. Command, headless:
    - `/ccx-loop:plan "<a one-function change>" --effort low`;
    - `/ccx-loop:plan "<the same change>" --no-codex --effort medium`;
    - `/ccx-loop:run "<the same change>" --effort medium --no-publish`, with Codex;
    - the same run with a committed `.ccx.json` of `{"models": {"plan-review":
      "gpt-6-astra", "small-slice": "off", "final-review": "nope"}}`;
    - `/cca:audit <full manifest> --effort low`.

    Expected: the `--effort low` run prints the one-line rejection naming `--effort
    medium` and makes no Skill call. The `--no-codex` plan run ends `plan-only` at tier
    medium with budget 120 from the tier default, and the report's `Plan review:` line
    names the fallback; the log's Read calls name `steps/0-preflight.md`,
    `steps/1-plan.md`, `tiers.md`, and `report.md`, and neither `steps/4-build.md` nor
    `steps/7-publish.md`. The Codex run ends `prepared`, with the plan review and the diff
    review on `gpt-6.1-sol`, the implementer `gpt-6.1-sol` or `gpt-6-luna` with "codex" or
    "luna" recorded per slice, and `Model overrides in force: none`. The override run puts
    the plan review on `gpt-6-astra`, has no `luna` slice, and the report names
    `final-review` as reported and ignored. The audit ends `reported`; `stages.json`
    records the requested models `haiku` for each digester, `sonnet` for the mapper,
    `opus` for the auditors and the adversary, `sonnet` for the merger, and `codex_model`
    `gpt-6-luna`; `audit-evidence.md` is in the run directory and in the stage 4 to 7
    input hashes. Covers R72 to R76. Rerun when a tier, a model default, a step file's
    read-at point, or `audit-evidence.md`'s readers change. Run 2026-10-10 on
    Windows, the audit through stage 4, and on macOS, the audit to `reported`; see the
    records.

28. **Open pull request collisions in the audit.** Setup: a GitHub repository the
    author owns, with `migrations/` holding `001_init.sql` on `main`, and three open PRs on
    `main`: A adds `migrations/002_add_status.sql`, B adds the same path, and C adds
    `migrations/002_add_index.sql`; the repository's runner journals by file name (a
    script that records each applied file's name). Command, headless:
    `/cca:audit <manifest with A as a github: PR and "run_once": ["migrations/*.sql"]>
    --effort low`. Expected: `forge/<bundle>/open-prs.json` and `collisions.tsv` are in the
    run directory, and `collisions.tsv` is in the stage 1 `forge_hashes`; the brief lists
    B as a `same name` candidate and C as a `same version` candidate under the new name;
    the report has a finding on `002_add_status.sql` for B, labeled `unverified
    assumption`, with a live check on merge order; C is cleared in the auditor's output
    with the quoted runner lines, since the runner keys by name. A resume with no
    change reuses stage 1; closing B and resuming reruns stage 1. The gap path (`open PRs
    not read` and the `forge_gaps` entry) cannot be forced on demand, since a token that
    cannot list the PRs cannot read the bundle's own PR either; it is checked by reading
    stage 1 step 3 and resume step 5. Covers R77. Rerun when stage 1's open pull
    request check, `collisions.sh`, or the auditor's candidate rule changes. Run
    2026-10-10 for cca 0.12.0 on Windows; see the record.

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

### 2026-10-07: ccx 0.6.0, the hand checks before the merge

Windows 11, Claude Code 2.1.292, Node 26.4.0. Both runs loaded `ccx` 0.6.0 from
`feat/ccx-0.6.0-attribution` at 8a77ef4 with `--plugin-dir`, beside the installed
`ccx` 0.5.0, which has no PreToolUse hook. No settings file outside the scratch
repository was edited.

- **The attribution hook passed.** In a new scratch git repository with one staged file,
  `claude -p` was asked to run `git commit -m "test commit" -m "Co-Authored-By: Claude
  <noreply@anthropic.com>"`, with `Bash(git *)` allowed. With `attribution.commit` set to
  `""` in the repository's `.claude/settings.local.json`, the call was denied with `ccx:
  remove the Co-Authored-By line naming Claude; attribution.commit is "" in
  <repository>\.claude\settings.local.json`, and no commit was made. With that file
  removed, the call was again denied, now naming the user's `~/.claude/settings.json`,
  which also sets `attribution.commit` to `""`. With the project file setting
  `attribution.commit` to a non-empty value, the commit was made with the trailer. The
  user setting was overridden, not removed, so the user's settings stayed unchanged.
- **Links in a draft passed.** The user started an interactive session in this repository
  with the branch's plugin; `/config` listed `ccx:Concise Plain` once, already selected.
  Asked to draft a comment for issue #35 saying the fix is in PR #38 and is waiting on
  review, without posting it, the session ran `git remote -v` and showed the draft in a
  blockquote with `#38` as a link, which opened.
- Observed: the session start notice said the house rules in `~/.codex/AGENTS.md` are
  older than the plugin's, as expected for an unreleased rules change; `/ccx:rules` was
  not run.

### 2026-10-07: ccx 0.6.0, item 12 on Windows before the merge

Windows 11 Pro 10.0.26200, codex-cli 0.160.1, Node 26.4.0, PowerShell 7.6.6 from the
Microsoft Store. A new scratch `CODEX_HOME` held a `config.toml` with only the model,
effort, sandbox, and approval settings and `[windows] sandbox = "elevated"`, and a copy of
the author's Codex login, deleted after the run. `codex plugin marketplace add
vibecodedapps-official/reimagine-code --ref feat/ccx-0.6.0-attribution` cloned c00c3c7,
and `ccx` installed at 0.6.0 with `general-code-review` and its three companions only.

- **Item 12 passed.** The scratch repository's change renamed `mul` to `multiply`, gave
  `add` a third argument `c = 0`, and added `div`. The review gave three findings: P1,
  restore the `mul` export, since `test.mjs` fails to load; P2, keep two-argument `add`
  behavior, since `add(1n, 2n)` now throws; P2, test the new operations. It changed no
  file. The main session read `general-code-review/SKILL.md`, and three subagent sessions,
  `breaking`, `context`, and `testing`, read `general-code-review-breaking-changes`,
  `-context`, and `-testing`, all from the installed 0.6.0. No session mentions
  change-size.
- Observed: two earlier tries failed before the review, with no file changed. With
  `[windows] sandbox = "unelevated"`, every shell call failed with `CreateProcessAsUserW
  failed: -1073283067` starting the Store `pwsh.exe`. With `"elevated"`, the first try
  failed with `ShellExecuteExW failed to launch setup helper: 1223`, a cancelled
  administrator prompt; the passing run followed once the author approved that prompt.

### 2026-10-07: cca 0.10.0, before the merge, Windows

Windows 11 Pro, Git Bash, Claude Code 2.1.292, Node 26.4.0, git 2.55.0. The branch head
was 69961c1. Each run used a new `solo` fixture with `refs/remotes/origin/main` set to
`0c23936` first and a manifest copy with `"scratch": "./app/.test-output/cca"`, in an
interactive session under a scratch `CLAUDE_CONFIG_DIR` with cca loaded by
`--plugin-dir` from the branch, not installed from the catalog. Each ran
`/cca:audit <manifest> --no-codex --effort low`, and the ref was moved by hand from a
second shell with `git update-ref`.

- **Item 24 passed.** Three runs covered its five cases.
  - Run A: the stage 4 check named the move `0c23936 -> 9c5f77c` and asked. On yes,
    `approvals` gained one `background-fetch` entry for `app:refs/remotes/origin/main`
    with both full commits, and the run went on. A second move, to `2b5e8f3`, was seen by
    the stage 5 check, which asked again. On no, stage 5 was recorded `failed` with a
    `blocked:` reason and `runs.json` showed `blocked`.
  - Run B: the ref move and an edit to `README.md` together ended the run `blocked` at
    the stage 1 check, with `blocked hashes` and `blocked status` lines and no question;
    `approvals` stayed empty.
  - Run C: one move, approved at the stage 5 check. The checks of stages 6, 7, and 8
    passed on that entry without asking, and the run ended `reported`.
- Observed: Run A's question left out the line the skill asks for, that an editor's
  automatic fetch such as `git.autofetch` can move refs; it said a fetch looked unlikely
  since the fixture has no remote, and recommended no. Runs B and C made their run
  directory at `<scratch>/cca/<run-id>/`, as stage 1 says; Run A made it one level
  higher, at `.test-output/cca/<run-id>/`. Neither was investigated further.

### 2026-10-07: cca 0.10.0 and ccx 0.6.0, item 22, before the merge, Windows

Windows 11 Pro, Git Bash, Claude Code 2.1.292, codex-cli 0.160.1, Node 26.4.0. The branch
head was 0977f6a. A scratch `CLAUDE_CONFIG_DIR` added the branch's working tree as a
local catalog and installed `ccx` 0.6.0 and `cca` 0.10.0 from it; Codex used the real
login. The `patterns` fixture ran with a manifest copy holding
`"scratch": "./app/.test-output/cca"`, in an interactive session.

- **Item 22 passed, except the follow-up, which did not occur.** `/cca:audit <manifest>
  --effort low` called `ccx:ask` with `--timeout 1200` and recorded `ccx_version`
  `0.6.0`, `called` true, status `ok`, no retry, and no follow-up, since every input was
  acknowledged. The session log shows one Bash call, `cp -- "$SRC"
  "$RD/codex/response.md" && rm -f -- "$SRC" && echo copied`, which printed `copied`,
  with `$SRC` the path of the `output:` line, and no Write or Edit of
  `codex/response.md`. The copied file was byte for byte the text ccx printed without
  its `output:` line (6517 bytes, `cmp` equal). After `claude plugin uninstall
  ccx@reimagine-code`, `/cca:resume <run-id> --from 6` swapped to `cca:adversary` with
  the reason "ccx not installed or version unreadable", moved the first answer to
  `superseded/1/codex/`, and the run ended `reported`.
- Observed: the run directory was `.test-output/cca/<run-id>/`, one level short of
  `<scratch>/cca/<run-id>/`, as in item 24's Run A (issue #41). With a local catalog the
  installed `ccx` ran its script from the branch's working tree, not from the plugin
  cache.

### 2026-10-07: cca 0.10.0 and ccx 0.6.0, items 22 and 23, before the merge, Windows

Windows 11 Pro, Git Bash, Claude Code 2.1.292, codex-cli 0.160.1, Node 26.4.0. The branch
head was c4e5eaa. As in the item 22 record above, a scratch `CLAUDE_CONFIG_DIR` installed
`ccx` 0.6.0 and `cca` 0.10.0 from the branch's working tree, and Codex used the real
login. Two `patterns` fixtures ran at the same time, in two interactive sessions, each
with `"scratch": "./app/.test-output/cca"` and `--effort low`.

- **Item 22's follow-up passed.** The manifest held `"_test": {"drop_ack": {"input":
  "ledger/5.md", "times": 1}}`. The first answer was copied with `cp -- "$SRC"
  "$RD/codex/response.md" && rm -f -- "$SRC"`. The follow-up went to the same thread
  with `--resume`, and its answer was appended with `printf '%s
' '--- follow-up,
  thread <id> ---' >> ... && cat -- "$SRC" >> ... && rm -f -- "$SRC"`. No Write or Edit
  touched `codex/response.md`. The file was byte for byte the first printed answer, the
  header line, and the second printed answer, each without its `output:` line (7057
  bytes, `cmp` equal). The stage 6 entry recorded `follow_up` true, status `ok`, and no
  unacknowledged input. ccx's data directory held no `output-*.txt` file afterward.
- **Item 23 passed (M3-c).** The session started in the fixture's root, outside any git
  repository. `ccx:ask` printed `ccx: not inside a git repository, so nothing was run
  (...)` and `status: refused`, with no retry. Stage 6 swapped to `cca:adversary` with
  the reason "ccx refused: not inside a git repository, so nothing was run", recorded
  `called` true and status `refused`, and the run ended `reported`.
- Both run directories were at `<scratch>/cca/<run-id>/`, as stage 1 says.

### 2026-10-07: release ccx 0.6.0, ccx-loop 0.6.0, and cca 0.10.0

Windows 11 Pro 10.0.26200, Claude Code 2.1.292, codex-cli 0.160.1, Node 26.4.0. The release
commit was a75040c, the merge of PR 38. PR 39's branch was merged into PR 38's at df972dd
first, since both set the ccx family to 0.6.0 and `main` is the release ref: one merge put
both on `main` together, so no update could get a 0.6.0 missing either. PR 39 then showed as
merged, and issues 35 and 36 closed. PR 38's CI run 37658661580 at df972dd passed on
ubuntu-latest, macos-latest, and windows-latest after one rerun of the macOS job, and the
`main` run for the merge, 37662700159, passed after one rerun of its macOS job (see the
observations below). repo-docs 0.1.5 was not released again.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.6.0`,
  `ccx-loop--v0.6.0`, and `cca--v0.10.0` at HEAD. `claude plugin tag --push` created and
  pushed the three at a75040c in that order; `git ls-remote` showed each peeling to
  a75040c, and no bare `v` tag. `npm run lint` on `main` printed `lint: ok` with the tags
  present.
- Not run: items 11 and 18, the installs from GitHub, for this release; item 16.
- Observed: pushing df972dd failed four times over about seven minutes with `! [remote
  rejected] feat/ccx-0.6.0-attribution -> feat/ccx-0.6.0-attribution (Internal Server
  Error)`, while githubstatus.com read "All Systems Operational" and no ruleset or branch
  protection applied. The same push succeeded unchanged on a later retry, after
  17:00:55Z. Cause unknown.
- Observed: the PR's macOS job first failed the rules speed test, `not ok 482 - units and
  imports grow about linearly`, at `grows(stray, (t) => units(t), 8000) < 8`, as before
  0.5.0; neither PR changed that code. The `main` run's macOS job first failed
  `working-tree.sh` case 6n, "the object count changed", the check tracked in issue 40.
  Both reruns passed.

### 2026-10-07: release ccx 0.6.0, ccx-loop 0.6.0, and cca 0.10.0, Windows

Windows 11 Pro 10.0.26200, Claude Code 2.1.292, codex-cli 0.160.1, Node 26.4.0,
PowerShell 7.6.6, Git 2.55.0.windows.5. Git credentials were turned off
(`GIT_CONFIG_GLOBAL` set to an empty file): `git config --global --list` printed
nothing. `git ls-remote` read the three new tags peeling to a75040c and `main` at
50a4867, the merge of PR 42, which changed only `docs/acceptance.md`; so the installs
came from 50a4867 with the same plugin files as a75040c. The macOS half of item 18 was
not run.

- **Item 16 passed for 0.6.0.** In `claude-m6`, `claude plugin details` reported about
  1,245 always-on tokens for `ccx` (of 1,300; 1,241 at 0.4.0), 504 for `ccx-loop` (of
  510), 180 for `repo-docs`, and 1,173 for `cca`.
- **Item 11 passed for 0.6.0.** A new scratch `CODEX_HOME` held a `config.toml` with
  only the model, effort, sandbox, and approval settings and `[windows] sandbox =
  "elevated"`, and a copy of the author's Codex login. `codex plugin marketplace add
  vibecodedapps-official/reimagine-code` cloned 50a4867; the `reimagine-code`
  marketplace listed exactly `ccx` from `plugins/ccx-codex` and `repo-docs` from
  `plugins/repo-docs`. Both installed and showed as enabled, at 0.6.0 and 0.1.5;
  the installed `ccx` holds `general-code-review` and its three companions only.
- **Item 18 passed on Windows for 0.6.0, from the public repository.**
  - In `claude-m6`, with the catalog removed (which uninstalled the four old plugins)
    and added again with no ref, `ccx`, `ccx-loop`, `cca`, and `repo-docs` installed at
    0.6.0, 0.6.0, 0.10.0, and 0.1.5, enabled, each recording 50a4867; with `ccx`
    installed first, the loop printed no dependency line.
  - The Codex plugins are as in item 11.
  - In a new repository under `C:\recode accept\ccx060\repo`, headless `/ccx:setup`
    passed in 43 s: `windows sandbox: elevated` read from the scratch `config.toml`,
    the ChatGPT login, `workspace-write` proven, and one allow rule naming the 0.6.0
    `scripts/ccx.mjs` with forward slashes. No administrator prompt appeared.
    `/ccx:ask` in auto mode printed "51" and `status: ok`, and `git status` stayed
    clean.
  - The copy of the Codex login was deleted afterward. Four of the real profile's five
    files had the same sha256 after the runs as before. `~/.claude.json` differed, but
    it also changed between two reads 45 s apart with no scratch run, so the session
    driving the runs wrote it; the scratch runs used `claude-m6`'s own copy.
- Observed: installing `ccx-loop` printed "1 userConfig option not yet set", followed by
  how to set it with `/plugin configure` or `--config`. The option is `codex`, which
  defaults to true, so the loop works unset. No earlier record shows this line; it
  probably comes from Claude Code 2.1.292.
- Left on the machine: the scratch `CODEX_HOME` at
  `~/.cache/recode-acceptance/codex-060`, without the login, and the test repository.

### 2026-10-09: cca 0.10.1 and ccx 0.6.1, items 22 and 24, before the merge, Windows

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.292, codex-cli 0.160.1, Node
26.4.0, Git 2.55.0.windows.5. The branch head was 5cc498c. A new scratch
`CLAUDE_CONFIG_DIR` with a copy of the M6 login added the branch's working tree as a
local catalog and installed `cca` 0.10.1 and `ccx` 0.6.1 from it, so both ran from the
working tree. A new scratch `CODEX_HOME` held a copy of the author's Codex login,
deleted after the runs. The real profile's `installed_plugins.json` kept its 2026-10-06
time. Every run was headless: `claude -p --input-format stream-json --output-format
stream-json --permission-mode auto --model opus`, driven by a script that moved the ref
on the first `cca:auditor` launch, sent `yes` or `no` only when a turn ended on a
question that named a fetch, and closed the session's input when `runs.json` showed a
terminal state. No call was denied in any run. Run ids use local time, and the runs
started on the evening of 2026-10-08. Every recorded run started in its own minute,
since every fixture's id is `app-feature`: a first launch of four runs in one minute
had three stop with "run id ... was taken by another audit in the same minute; run the
command again", as stage 1 says; the two sessions that went on were killed, their
fixtures discarded, and the scratch `runs.json` emptied before the recorded runs.

- **Item 24 passed, headless, at `--effort low`.** Three `solo` fixtures, each with no remote,
  `refs/remotes/origin/main` at `0c23936`, and `"scratch": "./app/.test-output"`. Every
  run directory was `.test-output/cca/<run-id>/`, one `cca` below the scratch path, and
  the `runs.json` `path` matched it.
  - Run A: the stage 4 check asked. The question, before any answer, named the ref with
    both full commits, said "An automatic fetch by an editor or Git client (VS Code's
    `git.autofetch`, for one) moves refs like this. It can do so even though this repo
    has no remote configured, because you may know of a fetch the repo's settings don't
    show. Only you know what ran here, so I'm not suggesting an answer.", and listed
    yes and no with no preferred option. On yes, `approvals` gained one
    `background-fetch` entry for `app:refs/remotes/origin/main`, `approved`, with both
    full commits, and stage 5 ran. A second move, to `bd5d5e1`, was seen by the stage 5
    check, which asked again with the same three parts. On no, stage 5 was recorded
    `failed` with a `blocked:` reason and `runs.json` showed `blocked`.
  - Run B: the ref move and a one-line edit to `README.md`, both 12 s after the auditor
    started, ended the run `blocked` at the stage 4 check without a question: the check
    file has `blocked hashes` and `blocked status` lines and "remote-ref differences:
    not judged", `approvals` stayed empty, and `runs.json` showed `blocked`.
  - Run C: one move, approved at the stage 4 check with a question of the same three
    parts. Stages 5 to 8 passed their checks on that entry without asking, and the run
    ended `reported`.
- **Item 22 passed, headless.** The `patterns` fixture with `"scratch":
  "./app/.test-output/cca"` and `"_test": {"drop_ack": {"input": "ledger/5.md",
  "times": 1}}`, at `--effort low`. Stage 1 printed `run dir:`, `parent:`, and
  `scratch/cca:` as whole paths and `parent-ok` before its `mkdir`; the run directory was
  `.test-output/cca/cca/2026-10-08-2343-app-feature/`, with the doubled `cca`, and the
  `runs.json` `path` was that directory. Stage 6 recorded `ccx_version` `0.6.1`,
  `codex_version` `codex-cli 0.160.1`, called `ccx:ask` with `--timeout 540`, the
  headless cap, and its entry has `called` true, `codex_timeout` 540, status `ok`, no
  retry, and `follow_up` true. The session's tool calls include `cp -- "<src>"
  "$R/codex/response.md" && rm -f -- "<src>"` and, for the follow-up, `printf '%s\n'
  '--- follow-up, thread <id> ---' >> codex/response.md && cat -- "<src>" >>
  codex/response.md && rm -f -- "<src>"`, with no Write or Edit of
  `codex/response.md`. The file was byte for byte the first printed answer, the header
  line, and the second printed answer, each without its `output:` line (8255 bytes,
  `cmp` equal). ccx's data directory held no `output-*.txt` file afterward, and the
  fixture's `git status --porcelain` was empty before and after. After `claude plugin
  uninstall ccx@reimagine-code` in the scratch profile, `/cca:resume <run-id> --from 6`
  swapped to `cca:adversary` with the reason "ccx not installed or version unreadable"
  and `ccx_version` "not installed (absent from claude plugin list --json)", moved the
  first answer to `superseded/1/codex/`, reused the recorded directory with no new
  directory under the scratch path, left one `runs.json` entry for the id, and ended
  `reported`.
- Observed, item 22: the follow-up came from a real gap, not the `drop_ack` setting.
  Codex's first answer opened no file: its command runner failed to start with
  `CreateProcessAsUserW` error -1073283067 under `windows.sandbox = "unelevated"` in
  the nested headless session, so no input was acknowledged. The inline follow-up on
  the same thread acknowledged every input. The orchestrator invoked the `ccx:ask`
  skill twice for the follow-up with the same text; the bridge ran once. Not
  investigated.
- Observed, item 24: in run A the second `approvals` entry was recorded as `declined`
  with `old` `0c23936`, the stage 1 baseline, not `9c5f77c`; the skill only says to
  append an entry on yes. In run B the stage 4 entry stayed `running` with a `blocked`
  field where run A's stage 5 was recorded `failed`. Two earlier attempts at run B
  were discarded: the driver's edit command did not reach `README.md` under `cmd.exe`
  quoting, so only the ref moved and both asked as run A did; their runs stay
  `running` in the scratch `runs.json`. Neither observation was judged.
- Left on the machine: the scratch profiles at `~/.cache/recode-acceptance/claude-pr45`
  and `codex-pr45`, without the login, the session logs there as `pr45-*.jsonl`, and
  the fixtures under `%TEMP%`.

### 2026-10-09: release ccx 0.6.1, ccx-loop 0.6.1, cca 0.10.1, and repo-docs 0.1.6

macOS 27.0, Claude Code 2.1.293, codex-cli 0.161.0, Node 26.4.0. The release commit was
a9af646, the merge of PR 45, which bundled issues 40, 41, and 44; issues 40 and 41 closed
with it and 44 stays open for its deferred behavior changes. PR 45's last CI run,
37888044599 at bd3b561, passed on ubuntu-latest, macos-latest, and windows-latest with no
rerun, and the `main` run for the merge, 37889382185, passed on all three with no rerun.
The branch's earlier CI failures, each fixed before the merge, are in docs/decisions.md
Part 20.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.6.1`,
  `ccx-loop--v0.6.1`, `cca--v0.10.1`, and `repo-docs--v0.1.6` at HEAD. `claude plugin tag
  --push` created and pushed the four at a9af646 in that order; `git ls-remote` showed
  each peeling to a9af646, and no bare `v` tag. `npm run lint` on `main` printed
  `lint: ok` with the tags present.
- Not run: items 11 and 18, the installs from GitHub, and item 16, for this release.

### 2026-10-09: ccx-loop 0.6.2 and cca 0.10.2, items 25 and 26, before the merge, Windows

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.292, codex-cli 0.160.1, Node
26.4.0, Git 2.56.0.windows.2. The branch head moved during the runs; each run below names
the head it ran at. A new scratch `CLAUDE_CONFIG_DIR` at
`~/.cache/recode-acceptance/claude-46-47`, with a copy of the author's login, added the
branch's working tree as a directory marketplace and installed `ccx-loop` 0.6.2 (with
`ccx` 0.6.2) and `cca` 0.10.2 from it, so every run read the working tree. Every run was
headless: `claude -p --input-format stream-json --output-format stream-json
--permission-mode auto --model opus`, driven by a script that sent one message, ended the
session on the result event or when a stop pattern matched, and answered a question only
where a case says. Two profile incidents, both before the runs they affected were
discarded: the copied login expired mid-batch once ("OAuth session expired and could not
be refreshed") when the real profile refreshed, and a copy made right before each batch
fixed it; and a runner script rewrote the profile's `settings.json` without its
`enabledPlugins`, so the sessions it started saw no plugin commands and did the task by
hand; those runs were discarded and rerun after the file was restored.

- **Item 25, the three Azure preflight cases: the block was never stated.** Six runs
  at 2c5dd43 and 0e8d4c1 (the second with step 3's text marked required output, headless
  included), on the repository whose only remote is an unreachable `dev.azure.com` URL:
  `/ccx-loop:run 12345 and 67890`, `/ccx-loop:plan 12345 and 67890`, and the plan with
  `--branch work/ab-12345`. In every run the forwarder ran `gh repo view`, `Test-Path` or
  `Read` on the three tokens, and `git remote -v`, then invoked the Skill tool with the
  invocation block as its args, with no text block in the reply before the call: no
  hint, no block, no `run id:` or `branch:` line. The block passed as the args matched
  the 0.6.1 shape byte for byte, with `text "12345 and 67890"` and `branch:
  work/ab-12345` where given. The skill then ended each run `blocked` at Step 0.2
  (`git ls-remote --symref origin HEAD` exit 128, the URL not found) and printed the
  report, whose header line read `Run id: not allocated (would be
  2026-10-09-12345-and-67890)` and whose closing told the user to export the work items
  to a file and pass it, with `--branch`. So the derived names reached the user from the
  skill's report, not from the command's step 3, and the hint did not appear. Not
  judged here whether an interactive session prints step 3; it has not been tried.
- **Item 25, the Azure plan with `--model sonnet`: no block either, and a different
  end.** One run at dafbc11 of `/ccx-loop:plan 12345 and 67890`. The forwarder first
  wrote that the command was not installed (it was; the Skill call that followed ran),
  ran `gh repo view` and `git remote -v`, then invoked the Skill tool with the same
  block as the opus runs and no text before it. The skill did not stop at Step 0.2: it
  recorded the unreachable remote, used the local `main` as an unverified base, wrote a
  plan with zero slices, ended `plan-only`, and said a run would use
  `work/12345-and-67890`, the name step 3 derives. Recorded as a second observation of
  the same gap; the two terminal states are the skill's, not the command's.
- **Item 25, the unreachable check: not run, with the command.** One run at dafbc11 on
  the repository with a local bare `origin`, `.ccx.json` listing `psql -h
  db.internal.invalid -U app -d app -c "select 1"`: `/ccx-loop:run "add a sub function
  that subtracts two numbers to math.mjs and test it" --no-codex --effort low
  --no-publish`. The run ended `prepared` with the change uncommitted on
  `work/add-a-sub-function-that-subtracts-two-nu`. The report's `Checks not run and
  why:` line quoted the command exactly, named `.ccx.json` as its source, and gave the
  reason (`psql` not installed, the `.invalid` host cannot resolve); `run.md`'s checks
  table and its Step 3.7, 5, and 6 entries said the same. Passed.
- **Item 25, the reachable check: run.** One run at dafbc11 with `.ccx.json` listing a
  `node -e` request to `https://api.github.com/`: the square-function change, same
  flags. The orchestrator ran the check itself at baseline and after the change, both
  passing, and the report listed it under `Checks run:` with `Checks not run and why:
  none`. Passed.
- **Item 25, the denied check, first form: not a denial.** One run at dafbc11 with the
  `psql` check and the profile's `settings.json` denying `Bash(psql:*)` and
  `PowerShell(psql:*)`: the neg-function change, same flags. The orchestrator found no
  `psql` binary and never invoked the command, so no permission was refused; the run
  ended `prepared` and reported the check as not run with its command and reason. That
  is what carve-out 3's last paragraph says for a missing binary, so the case tested the
  not-run path twice and the denial not at all. Rerun below with a check whose binary
  exists.
- **Item 25, the denied check, second form: `blocked`.** One run at dafbc11 with
  `.ccx.json` listing `node check-db.mjs` (a two-line script in the repository that exits
  0) and the profile's `settings.json` denying `Bash(node check-db.mjs:*)` and
  `PowerShell(node check-db.mjs:*)`, with and without the `:*`: the half-function change,
  same flags. At Step 3.7.3 the orchestrator issued `npm test` and the check in one
  PowerShell command, which the deny rule refused as a whole; it then issued each once on
  its own through Bash, where the rule refused the check and the auto-mode classifier
  refused `npm test`, and made no further attempt. It recorded the denial in `run.md`,
  marked the baseline, slice checks, Step 5.1, and Step 6 not done, let the implementer
  and the diff review run with the implementer told not to run checks, and ended the run
  `blocked` with the report naming the denied permission and both commands under
  `Checks not run and why:`. Passed for the terminal state and the report; the second
  issue of the denied compound command's parts is noted as an open question about
  carve-out 3's "never retried", not judged here. In the same run the Step 5 reviewer
  repeated the plan reviewer's rejected `half(0)` case; `run.md` recorded it as a repeat
  with the disposition kept, and the report listed it once as rejected with both rounds
  named. That covers Step 5.3's no-new-evidence path across reviews, not within Step 5's
  own rounds; the within-step case and the new-evidence case did not arise in any run.
- **Item 25, the GitHub two-issue cases: the rule applied, the block again never
  stated.** On a fresh clone of a private throwaway repository with twenty-five open
  issues, none labeled `bug`, two runs at dafbc11 with `#43 #42` (titles "isEven is wrong
  for even numbers (ccx-loop 0.3.2)" and "math.mjs has no abs function (ccx-loop 0.3.2)").
  `/ccx-loop:plan #43 #42`: the forwarder's first act was the Skill call, with
  `- issue #43` and `- issue #42` as the inputs and no text before it, so the `fix/` or
  `feat/` rule was not printed by the command; the skill ran, reviewed the plan with
  Codex, ended `plan-only`, and said a run would create
  `feat/43-42-iseven-is-wrong-for-even-numbers-ccx-loo`, the rule's else branch with the
  slug cut at forty characters. `/ccx-loop:run #43 #42 --no-codex --effort low
  --no-publish`: Step 3.7 created `feat/43-42-iseven-is-wrong-for-even-numbers-ccx` from
  `main` (the same rule, the slug cut at a word boundary five characters earlier), the
  run went on to `prepared` with the change uncommitted, and nothing was pushed or
  posted. The `fix/` form needs an issue with a `bug` label; none of the repository's
  issues has one and adding a label was not done, so that case is pending. A first plan
  run on the clone ended `blocked` at Step 0.3 because the clone, made with the system
  Git config, showed every file modified to a session that ran without it (line
  endings); the clone's own config was set to match and the run repeated.
- **Item 25, not produced.** No run reached a second implementer round, so the
  intent-to-add sentence of a continued prompt was not observed; no reviewer repeated a
  finding with new evidence. Both stay pending, with the `fix/` branch and the macOS run.
- **Item 26, the audits and closings.** Eight cases on the `solo` fixture and on a copy
  of it whose `app/AGENTS.md` sends history and rationale to commit messages and whose
  change adds a history comment to `src/users.sh`, every audit with `--no-codex`. The
  first run read `8-report.md` before dafbc11's edit of it; every later run read the text
  after it. `--budget 0` ended `partial` and printed the plain `/cca:resume <run-id>`
  line, `act first: none`, and `your decision:`; no `/cca:act` or `--live` line. The
  chat closing did not print the word `next:`; the report's section 1 holds the block
  under it after the verdict line. `--effort low` ended `reported` (1 blocker, 1 high, 1
  medium, 2 low, 3 note, 2 provisional) and closed with `next:`, `act first: C1 (...),
  C2 (...), C4 (...)` with a reason each, `/cca:act 2026-10-09-0427-app-feature C1 C2
  C4`, and `your decision:` naming C9, C10, C7, and C4; no `--live` line, section 9
  `none`. The report's `next:` block held the same three lines with no `#### C`,
  `- claim `, or `#### live ` line, and `work-items.sh check` printed `work-items: ok`
  before and after a later stage 8 rerun. Observed, unjudged: the `--budget 0` closing
  added findings of the session's own reading after the block, and the low run's brief
  quoted the real profile's `CLAUDE.md` rather than the scratch profile's.
- **Item 26, act and `--live`.** The solo fixture produced no live check, so these ran on
  the placement run, whose report left `combined-F4` and `combined-F6` at `not run: not
  approved` and whose closing printed the `--live` line with the sentence about the
  file. `/cca:act <run-id> C3`: the step 1.3 confirmation said the commit "stops the
  pending live checks from being imported", that the repository has no remote mapping so
  the commit moves the recorded head, and that `--live` would be refused after it; one
  `yes` led to commit `709f7f7` with no second question. The closing said the entry in
  `runs.json` is unchanged, gave the log's absolute path, and printed `live results
  needed: combined-F4, combined-F6; /cca:resume ... --live <file> imports them while
  resume's eligibility checks pass: ...` with the committed clause `This act committed
  709f7f7 on feature, the bundle's branch, so a bundle whose recorded head was read from
  that local branch no longer matches (one read through a remote mapping in the brief's
  Read paths moves on push); resume without --live to re-audit it`. `runs.json` was
  byte-identical before and after; `act/log.md` holds the approve, check-repo, drift,
  baseline, stage, check, and commit entries. `/cca:resume <run-id> --live <file>` with
  a file `live.sh check` accepted was refused: `app: head recorded 6f93f17... now
  709f7f7... (moved); base recorded 2b5e8f3... now 2b5e8f3...` (full shas in the
  output). On the solo run, a file naming `C1` was stopped by `live.sh check` (`'C1' is
  not a live check of the report`) with no state changed; after `git update-ref` moved
  `main` back one commit, `--live` was refused with `head recorded 0c23936... now
  0c23936...; base recorded 2b5e8f3... now bd5d5e1... (moved)`. On the placement run
  after the `--from 1` re-audit, with refs unchanged, a valid file imported, stages 6 to
  8 reran, and the run ended `reported` with no `--live` line. Passed. Observed,
  unjudged: one closing called a report hash "unverified" with a figure that is not the
  body hash, and one wrote "C1 to C9" for a report with C10.
- **Item 26, placement.** With the scratch `CLAUDE.md` holding "Rationale goes in
  docs/decisions.md, never in code comments.", the brief's Placement rules section held
  the snapshot sentence and that line. C3 (medium, agreed) recommended: `delete lines
  3-6; put the rationale in app docs/decisions.md; the ticket reference and history go in
  the commit message`. Act's commit `709f7f7` removed the four header lines from
  `src/users.sh`, added a three-line entry to `docs/decisions.md`, and carried the
  history in the commit body; nothing went into a header and the untracked `notes/` was
  not staged. Then, with the line changed to "Rationale goes in the commit message, and
  nowhere else.", a plain `/cca:resume <run-id>` reran nothing and left `audit-brief.md`
  byte-identical, and `/cca:resume <run-id> --from 1` (after act's commit; it asked to
  restart from stage 1 and the driver answered yes) wrote the new line into Placement
  rules and flagged the `docs/decisions.md` entry under it. Passed. Observed, unjudged:
  an act attempt made while the line differed from the snapshot stopped before step 1.3
  with a question about the home; the plain resume's closing quoted the new line though
  its log shows no Read of the file.
- **Item 26, the missing entry.** Deleting the entry before `/cca:resume <run-id> --from
  8` only stops resume at once (`run ... not found in runs.json`), so a watcher removed it
  when stage 8 wrote `claims-verdicts.md`. The closing printed the JSON entry with the
  registry's path and said `The act command below stops at its first step until the
  entry is back`, then the `act first`, `/cca:act`, and `your decision` lines. No live
  check was open, so the `--live` clause did not apply. Passed for the entry and the act
  line; the session attributed the loss to an outside rewrite and did not re-add it.
- **Item 26, not produced.** The `--budget 0` run's stages 2 and 3 were
  `not_applicable` and 4 to 7 `failed`, with no live check open, so the inapplicable-
  stages case with an open live check did not arise; no report held a scope claim
  recommended `defer`. The `ledger.sh` trailing-explanation check runs in `npm test`
  (`tests/cca/ledger.sh` cases lc9 and lc10), not here. Left on the machine for the
  macOS runner's reference: the fixtures under `C:/Users/Joe/AppData/Local/Temp`
  (`tmp.zUDHqYdZnx`, `tmp.eTsj66RTX4`, `tmp.CvUHNTYG4D`, `tmp.YgFPWXIYS2`), the
  placement and loop fixtures and logs under `~/.cache/recode-acceptance/acc-46-47/`,
  and the scratch profile.
- **Item 26, text changed after the runs.** A confirmation pass on the diff, after the
  runs above, changed act's step 1.3 and step 8 (the warning and the committed clause now
  name a GitHub PR bundle, whose recorded head is the PR's `headRefOid`, as one a local
  commit does not move; the mapped case moves when a push updates that ref; the `under
  review` line says resume asks to restart and approval retires the imports). The runs
  above used a local-branch bundle with no mapping, whose text did not change; the PR
  and mapped cases are pending with the macOS run.

### 2026-10-09: ccx-loop 0.6.2 and cca 0.10.2, items 25 and 26, before the merge, macOS

macOS 27.0, Claude Code 2.1.293, codex-cli 0.162.0, Node 26.4.0, git 2.54.0 (Apple
Git-157). The branch head was cbb68b9 for every run. A clone of the branch at
`/tmp/acc-46-47/clone` replaced the M4 profile's `reimagine-code` catalog, and `ccx`
0.6.2, `ccx-loop` 0.6.2, and `cca` 0.10.2 were installed from it, each read from the
clone; the loop's `codex` option was unset. The profile was backed up first and restored
from the backup afterwards; the real `~/.claude` and `~/.codex` files had the same sha256
and times after the runs as before. Every run was headless, `claude -p --output-format
stream-json --verbose --permission-mode auto --model opus`, with a question answered by
`--resume`, except item 25's one interactive probe in a pty. Codex ran once, the critique
of the GitHub plan, from a login copy deleted afterwards; every other run was `--no-codex`.
`npm run lint`, `npm test` (495 tests, 483 passed, 12 skipped, exit 0), and `claude plugin
validate --strict` on the root and each plugin passed on the branch head before the
runs. Three Sonnet runners did the work in parallel, the cca cases in one sequence.

- **Item 25, the three Azure preflight cases: the step 3 text failed, headless and
  interactive.** Three headless runs on a repository whose only remote is an unreachable
  `dev.azure.com` URL: `/ccx-loop:run 12345 and 67890`, `/ccx-loop:plan 12345 and 67890`,
  and the plan with `--branch work/ab-12345`. In each, the assistant events before the
  Skill call held only tool calls (`gh repo view`, `git remote -v`, Reads of the tokens)
  and no text block: no hint, no block, no `run id:` or `branch:` line, as on Windows.
  The block passed as the Skill's args matched the 0.6.1 shape, with `branch:
  work/ab-12345` where given. Each run ended `blocked` at Step 0.2 (`git ls-remote` failed
  with "Authentication failed" here, where Windows saw the URL not found), with the
  report's `Run id: not allocated (would have been 2026-10-09-12345-and-67890)` and the
  closing telling the user to export the work items to a file. The interactive probe,
  `/ccx-loop:plan 12345 and 67890` typed into a pty after the trust question, showed the
  same tool calls and then one paraphrased sentence before the Skill call: "I've derived
  the run config: a plan-only mode with the text input "12345 and 67890", run id
  2026-10-09-12345-and-67890, and no branch created since plan-only runs don't branch (a
  real run would use work/12345-and-67890)." The values were right; the hint line, the
  block, and the `run id:` and `branch:` lines in step 3's form were not printed. So
  the clause is judged: the command's step 3 output does not appear in either session
  type at cbb68b9. The suffix rule was not observable on these runs, which stopped before
  a run id was allocated; the GitHub run below showed it.
- **Item 25, the GitHub cases: both branch forms passed, the rule line again absent.**
  On fresh clones of the private throwaway repository, with issue 44 given the `bug`
  label for this run (no issue had one on Windows). `/ccx-loop:plan #43 #42`: no text
  before the Skill call, so no `fix/` or `feat/` rule line; Codex critiqued the plan with
  no blocking objection; the run ended `plan-only` and its report said a run would use
  `feat/43-42-iseven-is-wrong-for-even-numbers-ccx-loop-0-3-2`. `/ccx-loop:run #43 #42
  --no-codex --effort low --no-publish`: run id `2026-10-09-43-42-2` (the suffix rule,
  since the plan's `.ccx/2026-10-09-43-42/` existed), Step 3.7 created
  `feat/43-42-iseven-is-wrong-for-even-numbers-ccx-loo`, `prepared`, the change
  uncommitted. `/ccx-loop:run #43 #44 --no-codex --effort low --no-publish` in a second
  clone: Step 3.7 created `fix/43-44-iseven-is-wrong-for-even-numbers-ccx-loo`, the
  `fix/` form from the second issue's label alone, `prepared`, the change uncommitted.
  In every GitHub run `git log origin/main..` was empty and the remote's head count and
  the repository's pull request count were the same before and after.
- **Item 25, the three check cases: passed.** Three repositories with a local bare
  `origin`, each `/ccx-loop:run "<one-function change>" --no-codex --effort low
  --no-publish`. Unreachable (`psql -h db.internal.invalid ...`): `prepared`; the
  report's `Checks not run and why:` quoted the command exactly, named `.ccx.json`, and
  said `psql` is not installed and the host does not resolve. Reachable (a `node -e`
  fetch of `https://api.github.com/`): `prepared`; the orchestrator ran it at baseline and
  after the change, both passing, listed under `Checks run:`. Denied (`node check-db.mjs`,
  a committed script, with `Bash(node check-db.mjs)` denied in the repository's
  `.claude/settings.local.json`): `blocked`; the orchestrator issued the command once,
  was refused, did not retry, and the report named the deny rule and the command under
  `Checks not run and why:`. `npm test` was not refused; the orchestrator ran the script's
  body `node test.mjs` instead of the literal `npm test`, noted, not judged. Nothing
  reached any bare origin.
- **Item 25, the repeated finding: the no-new-evidence path passed; the rest not
  produced.** On the half-function run, the Step 5 reviewer repeated the plan reviewer's
  rejected `half(0)` and `half(1)` finding and added a coercion point; `run.md` recorded
  the edge-case part as a repeat with the disposition kept and the coercion part as
  verified and rejected for scope; the report's rejected list holds one entry per round,
  the second naming the repeat. A repeat citing new evidence for a rejected finding did
  not arise. A stats-module run meant to need a second implementer round converged in
  one, so no continued prompt was produced; the first prompt already carried the
  intent-to-add sentence. Both stay pending.
- **Item 26, the audits and closings: passed.** `--budget 0` on the solo fixture ended
  `partial` with the plain `/cca:resume <run-id>` line, `act first: none`, and `your
  decision: none`, no `/cca:act` or `--live` line; section 1 held the `next:` block after
  the verdict line with no `#### C`, `- claim `, or `#### live ` line, and `work-items.sh
  check` printed `work-items: ok`. `--effort low` ended `reported` (1 blocker, 1 high, 1
  medium, 2 low, 1 note, 2 provisional) with `act first: C1 (...), C2 (...), C3 (...)`,
  `/cca:act 2026-10-09-1005-app-feature C1 C2 C3`, and `your decision`, the same block in
  section 1, `work-items: ok`. This run left one live check open (`combined-F6`, the
  ticket's acceptance criteria), so its closing also printed the `--live` line with the
  sentence about the file and the import-before-commit warning, as stage 8 step 14 says
  for an open check; the item's "no `--live` line" clause describes the Windows solo run,
  which had none, and holds only then. The chat closings printed the lines in prose
  without the literal `next:` header; the report's section 1 has it.
- **Item 26, act and `--live`: passed.** On the placement run (two live checks `not run:
  not approved`), `/cca:act <run-id> C3` with `yes` twice: step 1.3 said "Two live checks
  from the audit are still open (C5 and C9). This branch has no pull request or remote,
  so a commit here moves the commit the audit recorded. After that, importing live
  results will be refused." Commit `9ec10fb` followed; the closing said the run's entry
  is unchanged, gave the log's absolute path, and said results are still needed for C5
  and C9, that the import works only while the recorded head and base still match, and
  that this commit moved `feature` past the audited commit so the import will be refused
  and a plain resume re-audits; the step 8 content in paraphrase. `runs.json` was
  byte-identical; `act/log.md` holds the approve, check-repo, drift, baseline, stage,
  check, and commit entries. `--live` with a valid file was refused with `app: head
  recorded 45c1967... now 9ec10fb... (moved); base recorded 2b5e8f3... now 2b5e8f3...`.
  On the solo low run, `git update-ref` moving `main` alone gave `base recorded
  2b5e8f3... now bd5d5e1... (moved)` with the head unmarked and `stages.json` unchanged;
  with `main` restored the same file imported, stages 6 to 8 reran, the run ended
  `reported` with the earlier report under `superseded/1/` and no `--live` line. Both
  checks ran on that one run rather than two fresh ones.
- **Item 26, placement and the rule edit: passed.** Stage 1 snapshots the user's
  instruction files in `CLAUDE_CONFIG_DIR`, not the repository's, so the first placement
  run put the rules in the fixture's `app/AGENTS.md`: the brief's Placement rules held
  the snapshot sentence with `none` and a "Repository rules" line quoting both, and C3
  recommended removing the header lines and putting the history in the commit message
  and the rationale in `docs/decisions.md`; act's commit did exactly that, nothing in a
  header, `notes/` left untracked. Then, with "Rationale goes in docs/decisions.md, never
  in code comments." added to the scratch profile's `CLAUDE.md`, a fresh placement run
  snapshotted it as `CLAUDE.md:5`; the line changed to "Rationale goes in the commit
  message, and nowhere else.", a plain `/cca:resume <run-id>` reran nothing with
  `audit-brief.md` byte-identical and a closing that said the report is out of date
  against the edited rule, and `--from 1` (no restart question headless) reran the audit
  and wrote the new line into Placement rules, with C3 now naming the commit message. The
  profile's `CLAUDE.md` was restored and `cmp` matched.
- **Item 26, the missing entry: passed.** A watcher removed the entry when stage 8 wrote
  `claims-verdicts.md`. The closing printed the JSON entry with the registry's absolute
  path and said resume and act cannot find the run until it is added back, then the
  `act first`, `/cca:act`, `your decision`, and `--live` lines; looser than stage 8's
  "act stops at its first step" wording, the same substance.
- **Item 26, the two cases Windows did not produce: produced, passed.** `--budget 9` on
  a solo fixture ended `partial` with stages 2 and 3 `not_applicable`, 4 to 6 complete, 7
  `failed` (budget expired), 8 complete, three live checks open; the closing and the
  report's `next:` printed the `--live` line with the sentence about the file. A
  `--claims` file asking for a CSV export feature's inclusion and recording an audit-log
  deferral: the report's section 8 gave the scope claim `defer`, and `your decision`
  listed the deferred claim, the stale deferral, and one other decision (inactive users
  in list and count); a second other decision in section 8 (whether the tracked CSV is
  the migrated store) was not on the line, since its item C3 sat under `act first`.
- **Item 26, the PR bundle: act's new text passed; two clauses did not arise.** A
  manifest naming the throwaway repository's open PR 47 (head `9c9a2ef`) audited at
  `--effort low --no-codex`, after a `yes` to stage 1's fetch question, ended `reported`,
  `ready to merge` with notes only, one live check open, `act first: none`. `/cca:act
  <run-id> C3` on the provisional note, with the PR branch checked out locally: step 1.3
  said "One open live check (C1, ...) is still unrun. This is a GitHub PR, so a local
  commit doesn't change the head the audit recorded. Only a push that updates the PR
  would."; the local commit `6ef698b` was made and not pushed, the PR's `headRefOid`
  unchanged; the closing said the run's entry is unchanged, gave the log's path, and said
  the import works while the PR's recorded head and base still match and that the commit
  does not change the recorded head until pushed. A `--live` import after the commit
  succeeded, confirming it. The `under review` wording and the mapped-ref clause did
  not arise: no imported result was awaiting review at an act, and the bundle's Read
  paths had no mapping line.
- **Item 25, the step 3 text after the fix: the report carries the lines.** The runs
  above showed the reply text absent in every session type, so the commands' step 3 and
  a new echo at the start of the skill's Step 0 were restated as reply text, and the
  report's header gained the run id in its `would have been` form, a `Hint:` line, and
  the branch a run would use. With the working tree installed in the same profile, the
  Azure plan with no `--branch` printed no reply text either way, before or after the
  skill's echo was added; then `/ccx-loop:run 12345 and 67890` and `/ccx-loop:plan 12345
  and 67890 --branch work/ab-12345` both ended `blocked` with report headers reading
  `Run id: not allocated (would have been 2026-10-09-12345-and-67890)`, the `Hint:` line
  in full, and `Branch: none created (a run would use work/12345-and-67890)` and `(a
  run would use work/ab-12345)` in turn. The reply text before the Skill call stayed
  absent in all four runs, as the revised Expected allows.
- Observed, not judged: in the denied-check run the implementer and both reviews still
  ran with Step 6 marked not complete, as carve-out 3 allows; several `result` events
  per cca session, the closing being the last; a second resume reported the refused
  attempt a minute earlier from `invocations.md` as abandoned. Left on the machine:
  `/tmp/acc-46-47/` (the clone, the profile backup, the used profile as `claude-after`
  with its eight cca runs, the loop and GitHub clones with their uncommitted or unpushed
  changes, and the logs), and six cca fixtures under the system temp directory.

### 2026-10-09: ccx-loop 0.6.2, item 25's step 3 cases, before the merge, Windows, after the fix

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.292, Node 26.4.0, Git
2.56.0.windows.2. The branch head was f6990fa for every run, read from the working tree
through the scratch profile of the Windows section above. Four headless runs, `claude -p
--output-format stream-json --permission-mode auto --model opus`, each sent one message
and ended on the result event; Codex ran once, the critique of the GitHub plan.

- **Item 25, the three Azure cases: the report header carried the lines; the reply text
  stayed absent.** On the repository whose only remote is the unreachable `dev.azure.com`
  URL: `/ccx-loop:run 12345 and 67890`, `/ccx-loop:plan 12345 and 67890`, and the plan
  with `--branch work/ab-12345`. Each ended `blocked` at Step 0.2 (`git ls-remote` exit
  128, the repository not found) and printed the report with `Run id: not allocated
  (would have been 2026-10-09-12345-and-67890)`, a `Hint:` line, and `Branch: none
  created (a run would use work/12345-and-67890)`, the same with `work/ab-12345` for the
  `--branch` run. Passed for the header. In the first two runs the `Hint:` line was the
  rule's text in full; in the `--branch` run it ended at "sets the branch." without
  "(README, non-GitHub hosts)", and that run set the branch name in backticks and shaped
  the rest of the report as prose sections rather than the template's. Before the Skill
  call, the `run` reply held tool calls only; the two `plan` replies held one progress
  sentence each ("gh failed; need git remote -v." and "gh failed, so select the remote."),
  not the hint, the block, or the `run id:` and `branch:` lines, so where text appeared it
  was not step 3's text. After the Skill call, every run's first event was a tool call:
  the Step 0 echo did not appear as text either. The block passed as the Skill's args was
  unchanged from 0.6.1, with `branch: work/ab-12345` where given.
- **Item 25, the GitHub plan with a `bug`-labeled issue: `fix/` named.** On a fresh clone
  of the throwaway repository, `/ccx-loop:plan #43 #44` (#44 labeled `bug`): the run
  fetched both issues, reproduced both defects, had Codex review the plan (no blocking
  objection), and ended `plan-only` with `Run id: 2026-10-09-43-44` and `Branch: none
  created (a run would use fix/43-44-iseven-is-wrong-for-even-numbers-ccx-loo)`, the
  name set in backticks in the report. The clone kept `main` only, with a clean tree;
  nothing was pushed or posted. Passed. The reply before the Skill call was the call
  itself, and the skill's first event after it was a tool call.
- Left on the machine: the clone `~/.cache/recode-acceptance/acc-46-47/gh-app2` with its
  `.ccx/2026-10-09-43-44/`, and the logs `item25f-*.jsonl` and `item25-f.out` beside it.

### 2026-10-09: release ccx 0.6.2, ccx-loop 0.6.2, and cca 0.10.2

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.292, codex-cli 0.160.1, Node 26.4.0.
The release commit was 7b5fe58, the merge of PR 52, which bundled issues 46 and 47 and the
four CodeQL alerts; both issues closed with it, and CodeQL marks alerts 1 to 4 fixed.
PR 52's last CI run, 37974074867 at c95785a, passed on ubuntu-latest, macos-latest, and
windows-latest with no rerun, and the `main` run for the merge, 37975649437, passed on all
three with no rerun. repo-docs stays at 0.1.6 and was not tagged.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.6.2`,
  `ccx-loop--v0.6.2`, and `cca--v0.10.2` at HEAD. `claude plugin tag --push` created and
  pushed the three at 7b5fe58 in that order; `git ls-remote` showed each peeling to
  7b5fe58, and no bare `v` tag. `npm run lint` on `main` printed `lint: ok` with the tags
  present.
- Not run: items 11 and 18, the installs from GitHub, and item 16, for this release.

### 2026-10-10: ccx-loop 0.7.0 and cca 0.11.0, item 27, before the merge, Windows

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.296, codex-cli 0.162.1, Node
26.4.0. A scratch `CLAUDE_CONFIG_DIR` at `~/.cache/recode-acceptance/survey-54/profile-after`,
with a copy of the author's login, added a clone of the branch as a directory marketplace
(at 9414f03 for the audit, 42497ae for the loop runs) and installed `ccx-loop` 0.7.0
(with `ccx` 0.7.0) and `cca` 0.11.0 from it. Every run was headless as in the items 25
and 26 record, driven by the same script, one message, ended on the result event. The
loop fixtures were fresh clones of the three-file repository with a local bare `origin`;
the audit used `sh tests/cca/fixture/build.sh full` from the clone. The runs doubled as
the after-survey of decisions Part 23 item 9, which holds their token figures.

- **`--effort low` rejected.** `/ccx-loop:plan "<the change>" --effort low`: one turn,
  no Skill call, the reply "Rejected: the `--effort low` tier no longer exists, so
  nothing was run. Use `--effort medium` instead:" followed by the same command with
  `--effort medium`. Passed.
- **Plan-only at medium.** `/ccx-loop:plan "<the change>" --no-codex --effort medium`:
  ended `plan-only` with `Tier: medium`, `Run budget: 120 (tier default)`, `Plan review:
  Claude subagent, model fable (fallback for Codex gpt-6.1-sol, swapped because of
  --no-codex)`, `Model overrides in force: none (no .ccx.json)`, and the slice recorded
  as luna by the small-slice rule with `sonnet` effective under `--no-codex`. The Read
  calls on the skill directory named `steps/0-preflight.md`, `steps/1-plan.md`,
  `tiers.md`, and `report.md`, and neither `steps/4-build.md` nor `steps/7-publish.md`.
  Passed.
- **Codex run at medium.** `/ccx-loop:run "<the change>" --effort medium --no-publish`:
  ended `prepared` with `npm test` passing on the uncommitted change; `Plan review:
  Codex gpt-6.1-sol`; the Step 5 reviewer `gpt-6.1-sol`; `Implementer per slice: slice
  1, gpt-6-luna ("luna"), --timeout 1200`; `Model overrides in force: none`; no swap.
  The Codex rollouts show the plan review and the final review on `gpt-6.1-sol` and the
  implement thread on `gpt-6-luna`. `steps/4-build.md` was read after the plan was
  final and `steps/7-publish.md` not at all under `--no-publish`. Passed.
- **The override run.** The same run on a clone whose `main` commits `.ccx.json` as
  `{"models": {"plan-review": "gpt-6-astra", "small-slice": "off", "final-review":
  "nope"}}`: ended `prepared`; `Plan review: Codex gpt-6-astra (.ccx.json override
  models.plan-review)`; `Model overrides in force: plan-review = gpt-6-astra,
  small-slice = off. Reported and ignored: final-review = "nope", which is not a full
  Codex model id, so Step 5 used the tier's gpt-6.1-sol`; the slice on `gpt-6.1-sol`
  with "codex", "rather than luna, because the .ccx.json override small-slice: off
  disabled the small-slice rule"; the deviations table lists the ignored key. Passed.
- **The audit at low: passed through stage 4, stopped in stage 5 by the account.**
  `/cca:audit <full manifest> --effort low`: `stages.json` records `haiku` for each of
  the three digesters, `sonnet` for the mapper, `opus` for the pass-one auditor and its
  top-up, and `opus` for the adversary; `audit-evidence.md` is in the run directory and
  in the stage 4 and stage 5 input hashes beside `common.md`. The session ended in
  stage 5, during a map-correction top-up, with "You've hit your monthly spend limit";
  stages 6 to 8 did not run, so `codex_model` `gpt-6-luna`, the merger's `sonnet`, and
  `reported` are not shown by this run. Not resumed; decisions Part 23 item 10 lists the
  resume as open.
- Left on the machine: `~/.cache/recode-acceptance/survey-54/` with the profiles, the
  clones, the fixtures, and the logs (`S1-after.jsonl`, `S2-after.jsonl`,
  `S3-after.jsonl`, `A27-reject.jsonl`, `A27-override.jsonl`), and the cca fixture in
  the temp directory named by `after-manifest.txt` there.

### 2026-10-10: ccx-loop 0.7.0 and cca 0.11.0, item 27, before the merge, macOS

macOS 27.0.1, Claude Code 2.1.293, codex-cli 0.162.0, Node 26.4.0, git 2.54.0 (Apple
Git-157). The branch head was 4ec2c5c for every run. A clone of the branch at
`/tmp/acc-54/clone` replaced the M4 profile's `reimagine-code` catalog as a directory
marketplace, and `ccx` 0.7.0, `ccx-loop` 0.7.0, and `cca` 0.11.0 were installed from
it, each read from the clone; the loop's `codex` option was unset. Observed, not judged:
installing `ccx-loop` alone resolved its `ccx` dependency to 0.6.2 at 7b5fe58, not the
catalog's 0.7.0, so `ccx` was installed first and `ccx-loop` after it. The profile was
backed up first and restored from the backup afterwards; the Codex login was copied into
the scratch `CODEX_HOME` for the runs and deleted after them; `~/.codex` had the same
sha256s after the runs as before, and the only `~/.claude` files that changed were the
author's own session's bookkeeping (`history.jsonl`, the two usage caches, and
`.last-cleanup`). `npm run lint`, `npm test` (499 tests, 487 passed, 0 failed, 12
skipped, exit 0), and `claude plugin validate --strict` on the root and each plugin
passed on the clone before the runs, each as its own command. Every run was headless,
`claude -p --output-format stream-json --verbose --permission-mode auto --model opus`,
one message, ended on the result event. The loop fixtures were fresh clones of the
three-file repository, each with its own local bare `origin`; the change was "Add a
function half(n) to math.mjs that returns n divided by 2, and a test for it in
test.mjs."; the audit used `sh tests/cca/fixture/build.sh full` from the clone, started
from the fixture's `app` directory. Sonnet runners pulled the evidence from the logs.

- **Two runs discarded for a fixture mistake.** The first plan-only and Codex runs
  shared one bare `origin` with the override clone, whose `.ccx.json` commit reached it
  before they fetched, so both reported the override in force (plan review
  `gpt-6-astra`, slice `codex`). They are not judged; the two runs below reran on
  clones with their own origins.
- **`--effort low` rejected.** `/ccx-loop:plan "<the change>" --effort low`: one turn,
  no Skill call, the reply "Rejected: `--effort low` isn't accepted because the low tier
  is gone. Use `--effort medium`, or leave out `--effort` to get `auto`. Nothing was
  run." Passed.
- **Plan-only at medium.** `/ccx-loop:plan "<the change>" --no-codex --effort medium`:
  ended `plan-only` with `Tier: medium`, `Run budget: 120 (tier default)`, `Plan review:
  fable (Claude fallback for Codex gpt-6.1-sol, because --no-codex is set)`, `Model
  overrides in force: none`, and `Implementer per slice: Slice 1 (math.mjs, test.mjs):
  planned as gpt-6-luna ("luna", small-slice rule); not run`. The skill files were read
  through `cat` in Bash calls, not the Read tool: `steps/0-preflight.md` at Step 0,
  `steps/1-plan.md` at Step 1, `tiers.md` before the estimate, and `report.md` before the
  report, and neither `steps/4-build.md` nor `steps/7-publish.md`. No `codex` call; one
  Agent call, the `fable` plan reviewer, which ended with no blocking objection. The tree
  was clean on `main` after the run, with `.ccx/` in `.git/info/exclude`. Passed.
  Observed: the run id was the title truncated to
  `2026-10-10-add-a-function-half-n-to-math-mjs-that-r`.
- **Codex run at medium.** `/ccx-loop:run "<the change>" --effort medium --no-publish`:
  ended `prepared` on `work/add-a-function-half-n-to-math-mjs-that` with `math.mjs` and
  `test.mjs` modified, nothing committed or pushed, and `npm test` passing at baseline,
  Step 5.1, and Step 6; `Plan review: Codex gpt-6.1-sol`; `Step 5 reviewer role
  resolved: Codex gpt-6.1-sol`; `Implementer per slice: slice 1 used gpt-6-luna
  ("luna"), --timeout 1200, no cap, no swap`; `Model overrides in force: none`. The
  bridge calls were `ccx:ask --model gpt-6.1-sol --timeout 600`, `ccx:implement --model
  gpt-6-luna --timeout 1200`, and `ccx:review --base <main sha> --model gpt-6.1-sol
  --timeout 600`, and the Codex rollouts in the scratch `CODEX_HOME` show the plan
  review on `gpt-6.1-sol`, the implement thread on `gpt-6-luna`, and the review thread
  and its review subagent on `gpt-6.1-sol`. `steps/4-build.md` was read (through `cat`)
  in the same Bash call that recorded "NO BLOCKING OBJECTIONS. Plan final." in `run.md`,
  before Step 3.7 began; `steps/7-publish.md` was not read; the skill's `report.md` was
  read before the run's report was written. Passed.
- **The override run: the models passed; two read-at points were skipped.** The same
  run on a clone whose `main` commits `.ccx.json` as `{"models": {"plan-review":
  "gpt-6-astra", "small-slice": "off", "final-review": "nope"}}`: ended `prepared` with
  the same tree shape; `Plan review: gpt-6-astra (.ccx.json models.plan-review
  override)`; `Model overrides in force: plan-review = gpt-6-astra (applied);
  small-slice = off (applied). final-review = "nope" is not a Codex model id, so it was
  reported and ignored`; `Implementer per slice: S1 used gpt-6.1-sol ("codex";
  small-slice off)`; the Step 5 reviewer `gpt-6.1-sol`; the rollouts show
  `gpt-6-astra` for the plan review and `gpt-6.1-sol` for the implement and review
  threads, and no rollout names `gpt-6-luna`. The ignored key is listed under "Deferred
  items", not in a deviations table. Judged against the core's read-at lines, not the
  item's text for this run: the orchestrator read `steps/0-preflight.md`,
  `steps/1-plan.md`, and `tiers.md`, then ran Steps 3.7 to 6 and wrote the report
  without reading `steps/4-build.md` or the skill's `report.md`, which the core says to
  read at Step 3.7 and at every terminal state, and which R73 claims for every step
  file. The Codex run above read both. Not fixed; one miss in two runs with the same
  core, so the cause is unverified. Rechecked: the run read both files, each through a
  `cat` at the end of a long Bash call; see the record "ccx-loop 0.7.0, item 27's
  override run log rechecked for issue 56, macOS".
- **The audit at low: passed to `reported`, with one gap in stage 6's input list.**
  `/cca:audit <full manifest> --effort low`: ended `reported` with the verdict `not
  ready | counted: 1 blocker, 3 high, 4 medium, 4 low, 1 note | provisional: 0 |
  contested: 1 | dismissed: 0`, `act first: C1 ... C10`, the `/cca:act` line, `your
  decision: C7 contested ...`, and the `--live` resume line. The `full` fixture's
  expected outcomes are in the report: the drift as C1 (blocker), the skipped test and
  the false claim as C2 (high), the export break as C3 (high), the paging as C5 (high)
  with the off-by-one C4 and its test C6, the migration claim as C10 (`unverified
  assumption`, medium), and the `MUST` rule as C8 citing
  `guidelines@cfda47b:style/shell-scripts.md:5`. The two expected `contested` outcomes
  (`formatRow`, C9; `print_page`, C4) came out `agreed`, as in the survey; the one
  contested item is C7, the audit log, where the adversary's downgrade was refused by
  the second opinion. `stages.json` records every stage `complete`, with `haiku` for each
  of the three digesters, `sonnet` for the mapper, `opus` for the pass-one auditor and
  its top-up after the barrier, `opus` for the adversary, `sonnet` for the merger, and
  stage 6 `codex_model` `gpt-6-luna`, `codex_timeout` 1200, called once, status `ok`,
  thread `01a12582-b624-7f72-9350-02041fde0306`, `unacknowledged: []`; the rollout
  shows `gpt-6-luna`, 8 calls, 290,538 tokens. `audit-evidence.md` is in the run
  directory, byte-equal to the plugin's, named by the auditor, top-up, and adversary
  prompts and by `codex/request.md`, and not by the digester, mapper, or merger
  prompts; it is in the stage 4, 5, and 7 `inputs` beside `common.md`. In stage 6 it is
  under `sentinels` (with `common.md`, `audit-brief.md`, `claims.md`, the diffs and
  stats, `ledger/5.md`, and `pass2/combined.md`), and the stage's `inputs` holds only
  `ledger/5.md`, `pass2/combined.md`, and `live/findings.md: absent`. So the item's
  "stage 4 to 7 input hashes" clause, and R76's "hashed as an input of stages 4 to 7",
  fail for stage 6 as written, and since `resume.md` step 5 recomputes only what
  `inputs` records, a changed `audit-evidence.md` would not rerun stage 6 on resume.
  The stage 6 file's "Inputs" paragraph lists the request's run-directory files but
  says only the live inputs are "recorded in the stage entry with its hash", so the
  orchestrator followed its text. Fixed after this run: the paragraph now says every
  input is recorded in `inputs` with its hash and the `sentinels` map is not a
  substitute; not rerun. Nothing in the fixture's
  repositories changed (`verify full:
  ok`; the auditor's `run-tests.sh` left the ignored `.test-output/` in `app`). Cost
  $10.13: opus 13.8M input and 152,889 output, haiku 6.7M input and 57,152 output,
  sonnet 200K input and 9,346 output; 166 orchestrator turns.
- Left on the machine: `/tmp/acc-54/` (the clone, the profile backups, the used
  profiles as `claude-after` with the audit run under its plugin data and `codex-after`
  with the rollouts and no login, the loop clones with their origins, and the logs
  `A27-reject.jsonl`, `A27-planonly2.jsonl`, `A27-codex2.jsonl`, `A27-override.jsonl`,
  `A27-audit.jsonl`, plus the discarded `A27-planonly.jsonl` and `A27-codex.jsonl`),
  and the cca fixture in the temp directory named by `full-manifest.txt` there.

### 2026-10-10: release ccx 0.7.0, ccx-loop 0.7.0, and cca 0.11.0

macOS 27.0.1, Claude Code 2.1.293, codex-cli 0.162.0, Node 26.4.0. The release commit
was 3dc918e, the merge of PR 55, which closed issue 54. PR 55's last CI run passed on
ubuntu-latest, macos-latest, and windows-latest, and the `main` run for the merge,
38050687366, passed. repo-docs stays at 0.1.6 and was not tagged. The GitHub runs used
new scratch profiles under `/tmp/ccx-rel-070`; setup and ask used the M4 profile,
backed up first and restored afterwards, with a copy of the Codex login deleted after
the runs. The real `~/.claude` files had the same sha256s after the runs as before; in
`~/.codex`, `models_cache.json` and the `logs_2.sqlite` journal files changed, probably
written by the Codex app-server daemon that runs from that home, since every run here
set its own `CODEX_HOME`.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.7.0`,
  `ccx-loop--v0.7.0`, and `cca--v0.11.0` at HEAD. `claude plugin tag --push` created and
  pushed the three at 3dc918e in that order; `git ls-remote` showed each peeling to
  3dc918e, and no bare `v` tag. `npm run lint` on `main` printed `lint: ok` with the tags
  present.
- **Item 18 passed on macOS for this release, from the public repository.** `git
  ls-remote` read `main` at 3dc918e. In a new scratch Claude profile, installing the
  loop alone printed "(+ 1 dependency: ccx)"; `ccx-loop` 0.7.0, `ccx` 0.7.0, `cca`
  0.11.0, and `repo-docs` 0.1.6 installed, each recording 3dc918e. So the loop resolved
  its dependency to the new tag from GitHub; the 0.6.2 resolution in the item 27 macOS
  record came from a directory catalog. In a new scratch Codex home, `ccx` 0.7.0 and
  `repo-docs` 0.1.6 installed and showed as enabled. The new profile had no Claude
  login, so the M4 profile was updated from GitHub (`ccx` and `ccx-loop` 0.4.0 to 0.7.0,
  `cca` 0.9.1 to 0.11.0, `repo-docs` 0.1.5 to 0.1.6, each recording 3dc918e) and ran
  headless: `/ccx:setup` reported codex-cli 0.162.0, "Logged in using ChatGPT", and the
  workspace-write sandbox proven; `/ccx:ask` with a short question printed Codex's
  answer, the thread, and `status: ok`.
- **Item 11 passed for this release.** In the new Codex home with no login, `codex
  plugin marketplace add vibecodedapps-official/reimagine-code` cloned the catalog, and
  `codex plugin list` showed exactly `ccx`, from `plugins/ccx-codex`, and `repo-docs`, at
  0.7.0 and 0.1.6.
- **Item 16 passed for this release.** In the new profile, `claude plugin details`
  reported about 956 always-on tokens for `ccx` and about 318 for `ccx-loop`, under 1,300
  and 510.
- Items 18 and 19 on Windows: see the next record.

### 2026-10-10: release ccx 0.7.0, ccx-loop 0.7.0, and cca 0.11.0, items 18 and 19, Windows

Windows 11 Pro 10.0.26200, PowerShell 7.6.6, Git 2.56.0.windows.2, Node 26.4.0, with
Claude Code 2.1.288 and codex-cli 0.160.0 installed from npm into a scratch prefix (the
newest versions the machine's seven-day `min-release-age` allowed; npm's allow-scripts
rule skipped Claude Code's postinstall, and both CLIs ran). Git credentials were off as
in the 0.6.0 Windows record. `git ls-remote` read `main` at 3dc918e and the three tags
peeling to it.

- **Item 18 passed on Windows for 0.7.0, from the public repository.**
  - New scratch profiles `claude-070` and `codex-070`, with copies of the author's logins.
    `claude plugin marketplace add vibecodedapps-official/reimagine-code`, then `claude
    plugin install ccx-loop@reimagine-code` first, which printed "(+ 1 dependency:
    ccx)"; `install ccx` then said it was already installed. `ccx` and `ccx-loop` 0.7.0,
    `cca` 0.11.0, and `repo-docs` 0.1.6 installed and enabled, each recording 3dc918e.
    The install printed "1 userConfig option not yet set", as in 0.6.0.
  - `codex plugin marketplace add` and `codex plugin add` for `ccx` and `repo-docs`:
    `codex plugin list` showed `ccx` 0.7.0 from `plugins/ccx-codex` and `repo-docs` 0.1.6,
    installed and enabled.
  - In a new repository under `C:\recode accept\ccx070\repo`, headless `/ccx:setup`
    passed: `windows sandbox: elevated` from the scratch `config.toml`, the ChatGPT login,
    `workspace-write` proven, and the allow rule naming the 0.7.0 `scripts/ccx.mjs` with
    forward slashes. `/ccx:ask` printed "51" and `status: ok`; `git status` stayed clean.
- **Item 19 passed on Windows for 0.7.0.**
  - `/ccx:implement` through a project skill added one line to `math.mjs`, reported HEAD
    unchanged and ` M math.mjs`, and `status: ok`. A first run made no change, because
    the fixture copied from 0.3.2 already held the line the skill named; the skill was
    pointed at a new line and run again.
  - `/ccx:rules --options core,windows` on a `CLAUDE.md` of 4 CRLF lines: both targets
    planned `ready`; after apply the file held 90 CRLF lines and no bare LF, the four
    lines above the block kept, and a backup written. Status read `current` for both
    targets, and still `current` after the file was converted to LF.
  - Hook, Claude Code: `git commit --allow-empty` through `PreToolUse:Bash` and `git -C
    "<path>" commit --allow-empty` through `PreToolUse:PowerShell` each carry the
    reminder in their transcripts; `echo "git commit"` got none.
  - Hook, Codex: a `codex exec` commit run by the author before trusting the hook got no
    reminder. After the author trusted the two `pre_tool_use` entries in `/hooks`, the
    same commit's session file holds the reminder as a developer message.
  - Observed: step 3 of the rules command asks about each target separately, but the
    session asked about both in one message and took one "yes" as applying both.
  - The login copies were deleted after each run.
- Not run: the Ctrl-C, symbolic-link, and trailing-space cases.
- Left on the machine: the scratch profiles `claude-070` and `codex-070` without the
  Codex login, the test repository, and the logs under `~/.cache/recode-acceptance/i070`.

### 2026-10-10: ccx-loop 0.7.1, the step hand-offs of issue 56, item 27's override run, Windows

Windows 11 Pro 10.0.26200, Git Bash, Claude Code 2.1.296, codex-cli 0.162.1, Node
26.4.0, git 2.56.0. Each run was the item 27 override run, headless (`claude -p
--output-format stream-json --verbose --permission-mode auto --model opus`, one
message, ended on the result event): `/ccx-loop:run "add a sub function that subtracts
two numbers to math.mjs and test it" --effort medium --no-publish` on a fresh clone of
the override fixture with its own local bare `origin`, so the host was `other`. The
reads were counted from the logs, Read calls and `cat` calls both.

- **Before, on 0.7.0's skill** (the item 27 clone at 42497ae, whose loop skill equals
  `main` at fd2b1d7): three runs, all ended `prepared`, and each read
  `steps/0-preflight.md`, `steps/1-plan.md`, `tiers.md`, `steps/4-build.md` after the
  plan was final, and the skill's `report.md` before the report; one read them through
  `cat` in Bash calls, two with the Read tool. With the two item 27 build runs on this
  machine, that is 0 misses in 5; the macOS miss did not reproduce, so its cause is
  unverified.
- **After, on the branch's 0.7.1 skill** (a copy of the working tree as a directory
  marketplace): three runs, all ended `prepared`, each read the same five files at the
  same points, and none read `steps/7-publish.md`, as the Step 6 hand-off says for the
  `other` host. Passed for the hand-offs. Not run: the `github` host under
  `--no-publish`, where the run now reads `steps/7-publish.md`, and a continued PR's
  body; both need a GitHub remote.
- Cost: $1.53 to $1.81 per run, six runs.
- Left on the machine: `~/.cache/recode-acceptance/i56/` with the two profiles, the six
  fixture clones, and the logs `before-1.jsonl` to `before-3.jsonl` and `after-1.jsonl`
  to `after-3.jsonl`.

### 2026-10-10: ccx-loop 0.7.0, item 27's override run log rechecked for issue 56, macOS

macOS 27.0.1, Claude Code 2.1.293, codex-cli 0.162.0, Node 26.4.0, git 2.54.0 (Apple
Git-157). The log of the item 27 macOS override run, `/tmp/acc-54/A27-override.jsonl`
(branch head 4ec2c5c, the record "ccx-loop 0.7.0 and cca 0.11.0, item 27, before the
merge, macOS"), was read again before any new run. Every orchestrator tool call (an
`assistant` event with no `parent_tool_use_id`) was listed with its full input, Bash
calls included, and searched for the skill's file paths.

- **The run read both files; the miss was a measurement error.** The log has 33
  orchestrator tool calls and no subagent tool calls. Call 18 is one Bash call that
  appends "NO BLOCKING OBJECTIONS ... Plan final." to `plan.md` and `run.md` and then
  runs `cat .../skills/ccx-loop/steps/4-build.md`; call 20 creates the work branch, so
  the read came after the plan was final and before Step 3.7. Call 30 is one Bash call
  that appends Steps 5 and 6 and the terminal state to `run.md` and then runs `cat
  .../skills/ccx-loop/report.md`; call 33 writes the run's `report.md`. Each result
  holds the file's heading ("Steps 3.5 to 6: build", "Final report template"). The other
  reads were `steps/0-preflight.md` (call 3), `steps/1-plan.md` (call 11), and
  `tiers.md` (call 12); `steps/7-publish.md` was not read. So the run read the same five
  files at the same points as the Codex run, and the macOS count is 0 misses in 2
  build runs. Each `cat` sat at the end of a long command, past where the earlier reader
  cut the input.
- **No new override runs.** A clone of the branch at 015540d passed `npm run lint`,
  `npm test` (502 tests, 490 passed, 0 failed, 12 skipped, exit 0), and `claude plugin
  validate --strict` on the root and each plugin, and `ccx` and `ccx-loop` 0.7.1 were
  installed from it in the M4 profile, byte-equal to the clone. The first of three
  planned runs was stopped after its third tool call, the read of
  `steps/0-preflight.md`, once the recheck above settled the question; it made no
  Codex call and changed no file in its clone, and it is not judged.
- Left on the machine: `/tmp/acc-54/` as the earlier record left it, now with the
  numbered call list `A27-override.calls.txt`; `/tmp/acc-56/` with the branch clone,
  the M4 profile's backup and its used copy `claude-after`, the empty scratch
  `CODEX_HOME`, the fixture with its three origins and clones, and the stopped run's log
  `run-1.jsonl`. The M4 profile was restored from the backup; the Codex login copy was
  deleted; `~/.codex` had the same sha256s before and after except one `tmp/arg0` lock
  file, and the only `~/.claude` files that changed were the session's own bookkeeping.

### 2026-10-10: release ccx 0.7.1, ccx-loop 0.7.1, and cca 0.12.0, Windows

Windows 11 Pro 10.0.26200, Git 2.56.0.windows.2, Node 26.4.0, with Claude Code 2.1.288
and codex-cli 0.160.0 from the scratch npm prefix of the 0.7.0 Windows record, and git
credentials off as there. The release commit was bf32784, the merge of PR 58, which
closed issues 27 and 51. PR 58's last CI run passed on ubuntu-latest, macos-latest, and
windows-latest, and the `main` runs for the merge, `ci` 38077600819 and CodeQL
38077600688, passed. repo-docs stays at 0.1.6 and was not tagged. Every run used new
scratch profiles `claude-071` and `codex-071` with copies of the author's logins,
deleted after the runs.

- **Item 17 passed for this release.** The dry runs named `ccx--v0.7.1`,
  `ccx-loop--v0.7.1`, and `cca--v0.12.0` at HEAD, each matching its catalog entry.
  `claude plugin tag --push` created and pushed the three at bf32784 in that order; `git
  ls-remote` showed each peeling to bf32784, and no bare `v` tag. `npm run lint` on
  `main` printed `lint: ok` with the tags present.
- **Item 18 passed on Windows for this release, from the public repository.**
  - `claude plugin marketplace add vibecodedapps-official/reimagine-code`, then `claude
    plugin install ccx-loop@reimagine-code` first, which printed "(+ 1 dependency:
    ccx)"; `install ccx` then said it was already installed. `ccx` and `ccx-loop` 0.7.1,
    `cca` 0.12.0, and `repo-docs` 0.1.6 installed and enabled, each recording bf32784.
    The install printed "1 userConfig option not yet set", as before.
  - In a new repository under `C:\recode accept\ccx071\repo`, headless `/ccx:setup`
    passed: `windows sandbox: elevated` from the scratch `config.toml`, the ChatGPT login,
    `workspace-write` proven, and the allow rule naming the 0.7.1 `scripts/ccx.mjs` with
    forward slashes. `/ccx:ask` printed "51" and `status: ok`; `git status` stayed clean.
- **Item 11 passed for this release.** `codex plugin marketplace add` from GitHub, then
  `codex plugin add` for `ccx` and `repo-docs`: `codex plugin list` showed exactly `ccx`
  0.7.1 from `plugins/ccx-codex` and `repo-docs` 0.1.6, installed and enabled.
- **Item 16 passed for this release.** `claude plugin details` reported about 1,245
  always-on tokens for `ccx` and about 500 for `ccx-loop`, under 1,300 and 510. Observed,
  not explained: both are higher than the macOS figures for 0.7.0 (about 956 and 318),
  on an older Claude Code here (2.1.288 against 2.1.293); `ccx-loop` is 10 tokens under
  its cap.
- **Item 19 passed on Windows for 0.7.1, except the Codex hook.**
  - `/ccx:implement` through a project skill added `export const sub = (a, b) => a -
    b;` to `math.mjs`, reported HEAD unchanged and ` M math.mjs`, and `status: ok`.
  - `/ccx:rules --options core,windows` on a `CLAUDE.md` of 4 CRLF lines: both targets
    planned `ready`; after apply the file held 90 CRLF lines and no bare LF, the four
    lines above the block kept, and a backup written. The Codex `AGENTS.md` holds the
    0.7.1 Windows rule, "On Windows the shell is PowerShell.", and no "PowerShell 7".
    Status read `current` for both targets, and still `current` after the file was
    converted to LF.
  - Hook, Claude Code: `git commit --allow-empty` through `PreToolUse:Bash` and `git -C
    "<path>" commit --allow-empty` through `PreToolUse:PowerShell` each carry the
    reminder in their transcripts; `echo "git commit"` got none.
  - Observed again: the session asked about both rules targets in one message and took
    one "yes" as applying both.
- Not run: item 18 on macOS; the Codex hook of item 19, which needs the author to trust
  the hook in `/hooks`; the Ctrl-C, symbolic-link, and trailing-space cases. The
  fixture's `npm test` line printed nothing in the driver's filter and is not judged.
- Left on the machine: the scratch profiles `claude-071` and `codex-071` without logins,
  the test repository, and the logs under `~/.cache/recode-acceptance/i071`.

### 2026-10-10: item 16's figures for 0.7.1 explained, Windows

Windows 11 Pro 10.0.26200. The `claude-071` profile of the record above, with `ccx` and
`ccx-loop` 0.7.1 installed from GitHub at bf32784, unchanged. `claude plugin details`
for each, under Claude Code 2.1.288 and 2.1.296 in turn:

- With no login in the profile, both versions reported about 956 always-on tokens for
  `ccx` and about 318 for `ccx-loop`.
- With a copy of the author's login, both versions reported about 1,245 and about 500,
  the figures of the record above. The copy was deleted after.

So the login moves the estimate and the Claude Code version does not, as the record
"M3, recode 0.1.0" found. The 0.7.0 macOS figures, 956 and 318, came from a new profile
its record says had no login, so they are not measurements under item 16's setup.
Nothing grew: `ccx-loop` read 497 to 504 in the earlier logged-in records, so its 10
tokens under 510 are its usual margin.

### 2026-10-10: item 28 and the loop's `github` paths under `--no-publish`, ccx-loop 0.7.1 and cca 0.12.0, Windows

Windows 11 Pro 10.0.26200, Claude Code 2.1.296, codex-cli 0.162.1, Node 26.4.0, Git
2.56.0.windows.2, gh 2.91.0. The `claude-071` and `codex-071` profiles of the release
record, with the plugins installed from GitHub at bf32784 and the `CLAUDE.md` block that
item 19 applied there, with copies of the author's logins deleted after each run, and the
author's own gh and git credentials. The repository was a new private
`vibecodedapps-dev/ccx-acceptance-scratch`, seeded with the three-file loop fixture.
Every run was headless through the stream-json driver of the issue 56 record, `--model
opus`, each in a new clone, with `git ls-remote` and the PR list saved before and after.

- **The `github` host under `--no-publish` passed.** `/ccx-loop:run "<the item 27
  change>" --effort medium --no-codex --no-publish` read `steps/4-build.md` in the call
  that logged the plan review and `steps/7-publish.md` in the call that logged the diff
  review, both through `cat` in Bash calls, then `report.md`. It ended `prepared` on a
  local `work/` branch with the change uncommitted. The remote heads and the PR list
  were the same after as before.
- **A continued PR's body under `--no-publish` passed.** A `feat-mul` branch with one
  commit was pushed and opened as PR 1. The same command with `--continue feat-mul` asked
  to switch from `main`, took the driver's `yes`, and read `steps/0-preflight.md`,
  `steps/1-plan.md`, `steps/4-build.md`, `steps/7-publish.md`, `pr-body.md`, and
  `report.md` with the Read tool, in that order. It wrote the continued-PR body to
  `.ccx/<run-id>/pr-body.md` and ended `prepared`. The report gave `git push origin
  feat-mul` and `gh pr comment 1 --body-file "<absolute path of that body>"`, and said the
  commit, push, and comment were held back. The remote heads and PR 1's comments were
  unchanged. PR 1 was closed after.
- **Item 28 passed.** `main` gained `migrations/001_init.sql` and `migrate.mjs`, which
  journals each applied file's name to `journal.txt`. Then PR 3 (A, `a-status`) added
  `migrations/002_add_status.sql`, PR 4 (B, `b-status`) the same path, and PR 5 (C,
  `c-index`) `migrations/002_add_index.sql`, with issue 2 as A's ticket. The manifest
  named A as `github:vibecodedapps-dev/ccx-acceptance-scratch#3` with `"run_once":
  ["migrations/*.sql"]`, from a clone holding `main` and `a-status`.
  - `/cca:audit <manifest> --effort low`, with Codex: ended `reported`, verdict `ready to
    merge`. `forge/repo/open-prs.json` and `collisions.tsv` were in the run directory,
    and `collisions.tsv` in stage 1's `forge_hashes`. The brief listed B as `same name`
    and C as `same version` under `002_add_status.sql`, with "open PRs on main read: 2
    besides this one; no cut rows". The auditor filed B as a medium finding labeled
    `unverified assumption`, quoting `migrate.mjs` lines 2, 8, and 10, with a live check
    on which PR merges first. It cleared C with the same quoted lines, since the journal
    keys by file name. The second opinion recalibrated B's finding to low, so the report
    counts it as contested at low. Stage 6 recorded `codex_model` `gpt-6-luna`, `called`
    true, status `ok`.
  - `/cca:resume <run id>` with no change: "The run is already up to date, so nothing
    was rerun", with the open PRs read again and the same two candidates.
  - B was closed, then `/cca:resume <run id>`: stage 1 reran. `collisions.tsv` held only
    C's row, its `forge_hashes` entry changed from 0268c07 to 33c0965, the earlier
    outputs moved to `superseded/1/`, and the run ended `reported` with no finding on B.
  - Observed, not judged: the auditor tried `git show b-status:...` and `c-index:...`,
    which failed because the clone held neither branch, so the report says B's and C's
    contents were not read.
- Cost by the result events: $2.25 and $2.64 for the two loop runs, and $5.88, $0.85,
  and $5.80 for the audit and its two resumes.
- Left: the scratch repository, kept as item 28's fixture, with PR 3, PR 5, and issue 2
  open (reopen PR 4 before a rerun); the logs and clones under
  `~/.cache/recode-acceptance/i3`; and the audit run under the `claude-071` profile's
  plugin data.

### 2026-10-10: item 19's Codex hook for 0.7.1, Windows

Windows 11 Pro 10.0.26200, codex-cli 0.160.0 from the scratch npm prefix. The release
record left the Codex hook not run, because the author had trusted the hook in
`codex-070`, the 0.7.0 scratch home, and in `~/.codex`, but not in `codex-071`. 0.7.1
did not release `repo-docs`: its `hooks/hooks.json` and `hooks/pre-commit.sh` have the
same sha256 in both scratch homes. So the check ran with `CODEX_HOME` at `codex-070`, a
copy of the Codex login deleted after, in the 0.7.1 test repository: `codex exec` made
the commit 8d0c98d, exit 0, and the session file carries the line "repo-docs: this
command commits" once. Passed.

### 2026-10-10: release ccx 0.7.1, ccx-loop 0.7.1, and cca 0.12.0, macOS

macOS 27.0.1, Claude Code 2.1.296, codex-cli 0.162.1, Node 26.4.0, git 2.54.0 (Apple
Git-157). `git ls-remote` read `ccx--v0.7.1`, `ccx-loop--v0.7.1`, and `cca--v0.12.0`
each peeling to bf32784, and `main` at 3430c63, the merge of PR 60, which changes only
`docs/acceptance.md` after bf32784. repo-docs stays at 0.1.6. Every run used a new
scratch Claude profile and new scratch Codex homes under
`~/.cache/recode-acceptance/i071-mac`. The Claude login on macOS is in the Keychain,
so the profile was not given a copy: the author signed in to it with `claude auth
login`, and it was logged out after the runs. The Codex homes held copies of the
author's Codex login, deleted after the runs. The real `~/.claude` and `~/.codex` files
had the same sha256s after the runs as before, except `~/.claude.json`, which the
session running the checks writes.

- **Item 18 passed on macOS for this release, from the public repository.**
  - `claude plugin marketplace add vibecodedapps-official/reimagine-code`, then `claude
    plugin install ccx-loop@reimagine-code` first, which printed "(+ 1 dependency:
    ccx)"; `install ccx` then said it was already installed. `ccx` and `ccx-loop` 0.7.1,
    `cca` 0.12.0, and `repo-docs` 0.1.6 installed and enabled. Each recorded 3430c63,
    the head of `main`, not bf32784: the catalog installs from `main`, and nothing under
    `plugins/` differs between the two. The install printed "1 userConfig option not yet
    set", as before.
  - In a new repository, headless `/ccx:setup` passed: codex-cli 0.162.1, "Logged in
    using ChatGPT", `workspace-write` proven, and the allow rule naming the 0.7.1
    `scripts/ccx.mjs`, printed for pasting and not written. `/ccx:ask` printed "51", the
    thread, and `status: ok`; `git status` stayed clean.
- **Item 11 passed for this release.** In a new Codex home, `codex plugin marketplace
  add` from GitHub, then `codex plugin add` for `ccx` and `repo-docs`: under
  `reimagine-code`, `codex plugin list` showed exactly `ccx` 0.7.1 from
  `plugins/ccx-codex` and `repo-docs` 0.1.6, installed and enabled. The list also held
  an `openai-curated-remote` marketplace with seven plugins enabled that nothing in this
  home installed, probably from the Codex account.
- **Item 16 passed for this release.** In the logged-in profile, `claude plugin
  details` reported about 1,245 always-on tokens for `ccx` and about 500 for
  `ccx-loop`, under 1,300 and 510, the same as the Windows figures. The profile was
  logged in; without a login the estimate is lower, as the 0.7.0 macOS figures of about
  956 and 318 show.
- Not run: item 19, which is Windows only.
- Left on the machine: `~/.cache/recode-acceptance/i071-mac` with the logged-out
  profile, the two Codex homes without logins, the test repository, and the logs.
