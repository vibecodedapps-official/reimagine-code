# Steps 3.5 to 6: build

Read this file when Step 3 ends with a final plan in a run that is not plan-only: at the
start of Step 3.5 with `confirm-plan`, else at the start of Step 3.7. It holds the Codex
implementer call snapshots that Approval scope carve-out 6 names, the Claude review
contract, the Implementer prompt, and Steps 3.5, 3.7, 4, 5, and 6. Step 3.5.3 reads a
continued branch's pull requests as Step 7.2 does; read `steps/7-publish.md` for that
item when it applies, which authorizes nothing in Step 7.

## Codex implementer call snapshots

A Codex implementer call that returns `failed` or no status line is handled like a
dropped call (Approval scope, carve-out 6), because it may have written part of its
slice. So before every Codex implementer or fix call, including a retry or CI repair,
in the checkout the call runs in, record `git status --porcelain
--untracked-files=all` without `--ignored`, the current `git diff` of tracked and
intent-to-add paths, and `git hash-object` of each
untracked, non-ignored file outside `.ccx/`, with its repo-relative path. Save them as
`.ccx/<run-id>/pre-<n>.status`, `pre-<n>.patch`, and `pre-<n>.hashes` under the
session's original checkout. Number calls from 1 across all checkouts, retries and
CI repairs included; record each call's checkout in `run.md`. Keep every set.
After a call that returns
`failed` or no status line, before its retry or the Sonnet fallback after a second
failure:
- The previous call must have returned its output, in the foreground or as a background
  completion notification, since ccx ends the Codex process when its turn ends
  or the Bash call times out. A call whose output never arrives is a budget expiry: end
  the run in `blocked`, and start no other writer on that checkout. A Bash tool result
  that is a timeout error or is cut off, with no `status:` line from ccx, is
  output that never arrived, not a "no status line" result: it takes this path, on
  every platform.
- Output that says Codex may still be running (ccx prints "codex may still be
  running as pid" when the process outlived its hard end, and on Windows warns that
  child processes may still be running after a timeout) is treated the same way: end
  in `blocked` naming it, and start no other writer.
- A `failed` result on Windows has no such warning even though a command Codex started
  may outlive it, and nothing available to you proves its process tree is gone; a
  result with no status line was cut off before the runner could warn at all. On
  Windows a Codex implementer call that returns `failed` or no status line is
  therefore not retried and gets no Sonnet fallback: end the run in `blocked` naming
  the possible surviving process. On POSIX the runner stops the process group, so the
  returned output is the evidence.
- Compare `git status --porcelain --untracked-files=all` and the current diff with
  that call's snapshot and patch, and compare the hashes of untracked files with
  its saved hashes. An untracked file outside the slice whose hash changed ends
  the run in `blocked` naming it, even when its status line is unchanged.
  Never touch an ignored (`!!`) path or anything
  under `.ccx/`. Cleanup applies only outside the slice to a status line new or
  different from the snapshot. For a path clean before the call, restore a tracked
  file with `git checkout -- <path>` or delete an untracked, non-ignored file. If a
  path was already dirty or intent-to-add before the call and now differs from its
  saved state or patch, end in `blocked` naming it; never run `git checkout --` on
  it. Check the saved patch even when its status line is unchanged. Leave unchanged
  earlier work alone. Log each cleanup action or block in `run.md`. Then give the
  next call the current diff with the same slice prompt.

The threshold stays two failures in a row. Step 4.2 item 4 applies this rule.

## Claude review contract

The Claude reviewer is the built-in `code-review` skill. It is the one reviewer role of a
higher-risk run in Step 5, as the Higher-risk rule in `tiers.md` says, not a fallback,
and nothing replaces it. A lower-risk run never uses it.

1. When Step 5 starts for a higher-risk run, including one that rose at Step 4.5, confirm
   `code-review` is listed among the session's available skills. A lower-risk run that
   turns higher-risk in Step 5 or in a CI repair makes the same check at the switch. If
   it is not listed, end the run in `blocked` naming the missing skill and, for a switch,
   the switch to Claude as well. Do not check it earlier, never in a plan-only run, and
   never for a lower-risk run that has not switched. A worktree run uses only the Opus
   substitute of item 7, so it needs no such check.
2. Call it through the Skill tool with the level `tiers.md` names for the tier as the first
   argument, always explicit, because the skill reuses the last typed level when none is
   given. Never pass `--comment` (no PR exists at Step 5, and comments are ask-first) and
   never `--fix` (fixes go to the implementer through Step 5.3).
3. On every pass, pass the level first and then the range `<base-commit>...HEAD` as the
   target, with the full base SHA, so the review covers the same diff Codex would see: the
   base commit to the working tree, committed and uncommitted. With that target the skill
   runs `git diff <base-commit>...HEAD` and `git diff HEAD`, which together cover both.
   Never pass the level alone. Without a target the skill picks its own range, the upstream,
   else local `main`, else `HEAD~1`, plus uncommitted changes; the work branch has no
   upstream before the push, and a local `main` behind the fetched base would put
   unrelated commits under review, which can raise
   blocking findings the task did not cause. Never pass a bare commit: the skill then
   reviews only that commit. Mark new files with `git add -N` first, as for Codex, because
   `git diff HEAD` shows intent-to-add files. Acceptance item 58 rechecks the range target
   after a Claude Code upgrade.
4. Run it under the subagent budget: take the `date` times that Budgets, enforcement 1
   requires before and after, and treat a call that returns past the budget as expired
   (Budgets, enforcement 4).
5. Its output is a findings list, or a statement that it found nothing. Use it as it comes.
   Record in `run.md` the stage, round, level, the diff covered, and the result, clean or
   the findings count, so the report can show the pass ran. A pass that returns an error
   is retried once; a second error ends the run in `blocked` naming the skill.
6. Each round's pass is fresh: the skill keeps no thread. A finding it repeats that was
   already rejected with a recorded reason keeps that disposition, unless the new finding
   cites evidence the rejection did not cover. Step 5.3 applies this before verifying.
7. The skill reviews only the session's checkout. A worktree run that is higher-risk
   therefore uses the Opus subagent substitute that `multi-repo.md` defines for additional
   repositories, in place of the skill: an Agent call at model `opus`, given the patch
   file `<artifacts>/diff.patch` produced from `<checkout>`, the acceptance criteria, and
   the reply shape of item 8 of the Reviewer contract, and told to read and report only.
   It is not a swap. Record it in `run.md` per pass and name it in the report. Like the
   additional repositories' subagents, it is continued with SendMessage in later rounds.
   In Multi-repo mode the pass covers the primary; each additional repository's Claude
   role is the Opus subagent `multi-repo.md` describes. A run that turns higher-risk after
   Codex rounds starts these fresh: there is no earlier subagent to continue.

## Implementer prompt

Each implementer runs at the slice's effective model. A Codex slice goes through the Skill
tool to `ccx:implement`, with the prompt below as the request text and the args
`--model <id> --timeout <seconds>`, where `--timeout` is the value Repo config gives. For
a worktree run or an additional repository, the args end with `--cwd <absolute path of the
checkout>`, which is the last option because its value is the rest of its line verbatim;
the request text starts on the next line. Without `--cwd`, Codex runs in the shell's
directory, the session's checkout. A Sonnet slice goes to the Agent tool at model
`sonnet` (or the Workflow's agent with the same model). Its prompt contains:

1. Its slice from `plan.md`: the files it owns, the change, the acceptance criteria it serves,
   and the tests it must add or change, and, in a worktree run or Multi-repo mode, the path
   of the only checkout it edits. A request for the session's checkout may name files
   relative to it; with `--cwd` to another checkout, it names them by absolute path or
   carries their content inline, as `worktree.md` says.
2. The paths of the repo's instruction files, with an instruction to read them first.
3. The checks it must pass before it reports, from `run.md`.
4. The rule that it edits only the files in its slice and reports, rather than edits,
   anything it finds outside them.
5. The rule that it does not commit, push, or run `gh`.
6. The rule that it matches the repository's line endings for every new file: the `eol=`
   attribute when `git ls-files --eol` shows one in its `attr/` column; else, when `text` or
   `text=auto` applies with no `eol=`, git normalizes on commit and any ending is
   acceptable; else the majority `w/` ending of existing files in the same directory, else
   of tracked files in the repository. It never changes the line endings of a file it edits.
7. The rule that the orchestrator may mark new files intent-to-add (`git add -N`) between
   rounds for the diff review, which `git status` shows as added with no content staged; it
   leaves them as they are and does not stage, unstage, or remove them.

After a `drop` answer (Step 0.1a), the prompt carries each credential value in its
redacted form, `<redacted: key>`.

Codex has no network. The orchestrator installs any dependency the plan adds in Step 3.7,
before any implementer starts, so the prompt tells the implementer not to install
anything. A check of the slice that needs the network is left out of its required checks:
you run it after the call returns, and a failure goes back to the same implementer as a
finding. For a Codex slice that is a fresh call, as Step 4.3 says.

It reports the files changed, the checks run with results, and anything it could not do.
The output of a Codex call ends with a status line and a tree footer that covers the whole
repository. Confirm the report against the working tree with `git status` and `git diff`
before reviewing. Only one agent edits a given file at a time. Parallel agents share one
working tree, and Codex slices run in series.

## Step 3.5: plan approval

Runs only when `confirm-plan` is true and the run is not plan-only. Otherwise go to Step
3.6.

1. Run Step 3.7.1's reverification now. It is read-only. A revision it causes gets its
   Step 3 round here, inside the cap of 3, so the plan is final before the user sees it.
   Step 3.7.1 then does not repeat. That round follows Step 3 items 2 to 6, so an open
   blocking objection at the cap ends in `blocked`. When the reverification needs a
   revision and no Step 3 round remains, the run ends in `blocked` naming the unreviewed
   revision, the same as a Step 3 cap with an open blocking objection.
2. Print the plan path and a short summary of the plan. Ask the user in the session to
   reply yes to implement, or to describe a change. Take the `date` times of Budgets,
   Enforcement item 1, just before asking and just after the reply, and record both in
   `run.md`. End the turn and wait for the reply. The wait does not count against the run
   budget.
3. A clear yes continues to Step 3.6 and Step 3.7. Before Step 3.7.2, in each repository
   the run edits, rerun Step 0.3's clean-tree check (`git status --porcelain` and
   `git diff --cached --quiet`) and its flagged-file comparison, on the worktree in a
   worktree run. A flagged path that differs from `HEAD` and that `run.md` does not
   already record for that checkout is a failure; it never starts the worktree exception.
   In each repository that continues a branch, also rerun Step 0.2's check that a local
   branch of that name, when one exists, equals the base commit, Step 0.2's worktree check,
   and that `HEAD` of the repository's checkout is at the base commit. A failure ends in `blocked` naming
   what changed. Also, in each repository that continues a branch, run `git ls-remote
   --heads <remote> refs/heads/<its branch>` and compare its head with that repository's
   base commit. If it moved, end in `blocked` naming the branch. For a repository that
   continues a branch on `github`,
   and not with `--no-publish`, also read the pull requests of the branch again as Step
   7.2 does before the first push, with the same outcomes, so a PR closed, opened, or
   retargeted during the wait blocks the run before anything is implemented. The base
   commit stays the one fetched in Step 0.2: the default branch moving during the wait
   changes nothing.
4. A requested change is recorded in `inputs.md` as an ad-hoc input. Rerun Step 1.3's
   verification on the changed input. When the planning snapshot is not the base commit,
   also verify the changed input against the base commit with Step 3.7.1's read-only
   method. Then apply the risk floor without re-estimating effort; the tier never falls
   below the one already chosen.
   When the tier rises and no explicit run budget is set, the budget becomes the new
   tier's default from that point; record it in `run.md`. Update the plan and choose
   each slice's implementer again under `tiers.md`, and judge its higher-risk rule again.
   It gets one more Step 3 round, inside the cap of 3 that Step 3 and Step 3.7.1 share.
   That round follows Step 3 items 2 to 6: an open blocking objection at the cap ends in
   `blocked` (Step 3 item
   6), and the question is asked again only when the round ends with no blocking
   objection. When no round remains, end in `stopped` with the requested change as the
   question.
5. Any other reply, including a no, is not approval: end in `plan-only`.

## Step 3.7: execution setup

1. If the planning snapshot was not the base commit, repeat Step 1.3's verification against the
   base commit and revise the plan where it differs. Read without changing the tree, for
   example `git show <base-commit>:<path>` and `git diff <planning-snapshot> <base-commit>`.
   A revision gets one more Step 3 round, at every tier, inside the cap of 3; with no
   round left, the run ends in `blocked` naming the unreviewed revision. With
   `confirm-plan`, Step 3.5 already ran this verification, so it does not repeat here.
2. Create the branch from the base commit. The name is, in order: the `--branch` value; else
   `fix/<id>-<slug>` when any source issue has a `bug` label or a title starting with "fix"
   (any case); else `feat/<id>-<slug>`. `<id>` is the issue numbers joined with `-` and
   `<slug>` comes from the first issue's title. With no issue, `work/<slug>` from the ad-hoc
   description or file name. If the name exists locally (`git branch --list`) or on the remote
   (`git ls-remote --heads <remote> refs/heads/<name>`), stop with `blocked`. Create it
   with `git switch -c <name> <base-commit>`. On the `other` host, create the branch
   locally and check the remote the same way. In Multi-repo mode, the check and the
   creation run in every repository.
   In each repository that continues a branch, skip the naming and the collision check,
   and switch to its own branch instead of creating it: `git switch <its branch>` when
   it exists locally, else `git switch -c <its branch> <base-commit>`. Step 0.2's
   consented switch may already have done this. In a worktree run, use `git -C
   <checkout> switch` for this. In Multi-repo mode, a repository whose remote lacks the
   `continue` value, and that has no `@<branch>`, does not use that branch: its state is
   `new`, and the naming rule and the collision check apply to it, as to any `new`
   repository.
3. Discover the repo's checks as Step 6.1 lists, record them in `run.md`, and run each once on
   the base commit. This is the baseline. A check that fails here is pre-existing and is
   reported, not fixed. Record the failing output as the baseline evidence for that check.
4. Install any dependency the plan adds. Codex has no network, so you install it, after
   the baseline checks of item 3 have run on the unchanged base, after any ask-first rule
   for adding a dependency has been answered with a clear yes, and before any implementer
   starts. Run the install step the repository's instruction files or lockfile name, under
   the check budget like a check (Budgets, enforcement items 2 and 3), inside `<checkout>`
   in a worktree run and in the repository that needs it in Multi-repo mode. The manifest
   and lockfile edits are part of the run's diff and are reviewed in Step 5 like any other
   change; log them in `run.md` as edits. This is distinct from the install of the
   checkout's existing dependencies before the baseline (`worktree.md`). A plan that adds
   no dependency skips this item.

## Step 4: implement and iterate

1. Give each implementer the implementer prompt from Mechanics. No two agents edit the same
   file at the same time.
2. Run one implementer per slice, at every tier, at the slice's effective model: the
   tier's Codex model by default, `gpt-6-luna` for a slice the small-slice rule picks, or
   `sonnet` by the plan's choice at high and xhigh.
   `sonnet` is also the fallback, used under item 4 and when
   `--no-codex` is set or Step 0.6 found Codex unavailable. In those two cases, log the
   swap with its reason for each slice. Log each slice's model in `run.md` when its
   implementer starts, with the `--timeout` passed and any cap for a Codex slice.
   1. One slice: one call, a `ccx:implement` Skill call for a Codex slice, else one
      Agent call.
   2. Several slices that the plan's order of work shows are independent: run the Codex
      slices in series, one `ccx:implement` call at a time, because Codex calls are
      one at a time per session; a Codex slice never runs inside a Workflow. No Sonnet
      slice runs while a Codex implementer call is running: a Codex call runs
      alone on its checkout, because its tree footer covers the whole repository and a
      failed call stops every other writer. Sonnet slices, before or after the
      Codex slices, may run in parallel with each other, either as one Workflow whose
      script runs one agent per slice, or as parallel Agent calls issued in one message.
      You choose. Agent calls are the default when review rounds are expected, because
      they can be continued with SendMessage and Workflow agents cannot. Log the choice
      and the reason in `run.md`. This skill's use of the Workflow tool is the user's
      opt-in. If you choose a Workflow and a Workflow authoring skill is listed, load it
      before writing the script.
   3. Slices with an ordering dependency: one call each, in that order.
   4. If an implementer call at model `sonnet`, through the Agent tool or inside a
      Workflow, returns a tool error, stop the run and record the error. There is no
      further fallback. A permission denial follows Approval scope, carve-out 3, and a call
      that runs past its subagent timeout is a budget expiry (Budgets, enforcement 4).

      A Codex implementer call is handled by its status line. `refused` ends the run in
      `blocked` with ccx's message, with one exception: a message that contains
      "implement was not run:" means the host's write sandbox refused before Codex ran
      (the Windows sandbox setting or the write probe), which Step 0.6 cannot see. That
      slice goes to `sonnet` with the same prompt, no tree check needed because Codex
      never ran; record Codex implementation as unavailable for the rest of the run, so
      later Codex slices go to `sonnet` at once; log the swap with the message and name
      it in the report. Codex reviewers are not affected. `timeout` is a budget expiry (Budgets,
      enforcement 4): end in `blocked` naming the implementer `--timeout`, and start no
      other writer on that checkout. `failed`, or no status line, may have left part of
      the slice written, so the preconditions of Approval scope item 6 apply before any
      retry or fallback: the previous call returned its output; it did not say Codex may
      still be running; on Windows a `failed` call, or one with no status line, ends the
      run in `blocked` instead; and you have compared the pre-call snapshot, patch, and hashes
      and completed only the safe cleanup in Approval scope item 6, with no block.
      Then retry once as a fresh `ccx:implement`
      call with the same slice prompt and the slice's current diff. A second `failed` or
      no status line in a row, with the same preconditions met, falls back to `sonnet`
      with the same prompt and the current diff: the slice's effective model becomes
      `sonnet`; log the error and the swap in `run.md`, and name it in the report as an
      implementer swap. The swap holds for that slice only: the next Codex slice tries
      Codex again, unless Step 0.6 recorded it unavailable or `--no-codex` is set.
3. Review each slice's diff against the plan and its acceptance criteria (`git diff
   <base-commit> -- <slice files>`, new files marked with `git add -N`). Run each of the
   slice's checks that needs the network yourself, since Codex has no network; a failure
   goes back to the slice's implementer as a finding. Send findings back to the same Sonnet
   agent with SendMessage when it can be continued. A Codex implementer is never
   continued: its fix round is a fresh `ccx:implement` call at the slice's
   effective model, given the findings and the slice's current diff. Agents run inside a
   Workflow do not persist, and an agent that cannot be continued is replaced: give a
   fresh agent at the slice's effective model the findings and the slice's current diff.
   Either way it counts as a round. After `git add -N` and before review, run `git
   ls-files --eol -- <slice files>`. The expected ending is the one implementer prompt
   item 6 defines (the `eol=` attribute in the `attr/` column; no comparison when `text`
   or `text=auto` applies with no `eol=`, since git normalizes on commit; else the
   majority `w/` of the directory, else of the repository). A new file whose `w/` differs
   from it is a finding for the implementer. A file whose `w/` is `-text` (binary) or
   `none` (no line ending) is not compared.
4. Repeat until a round has no blocking findings, with a cap of 3 rounds per slice. A
   round for a Codex slice is one fresh `ccx:implement` call (item 3). Fix a
   non-blocking finding in the same round only when the fix stays inside the slice's files and
   the plan's scope. Otherwise list it in the report as deferred, with a short description and
   the reason. After the cap, fix any blocking finding that remains yourself, once. A blocking
   finding still open after that ends the run in `blocked`.
5. Tier re-evaluation: when Step 4 ends, apply the risk floor from `tiers.md` to the
   actual diff and log the result in `run.md`. If a trigger now exists and the run is
   below high tier, the run rises to high tier. When it rises and no explicit run budget
   is set, the budget becomes the new tier's default from that point; record it in
   `run.md`. Then judge the higher-risk rule on the actual diff, integration fixes
   included, and resolve the Step 5 role from the tier table in `tiers.md`: Claude
   `code-review` at the tier's level when the run is higher-risk, else the tier's Codex reviewer.
   A run already judged higher-risk stays so. Log the role and the criterion that held, or
   that none did. Step 5 then runs with that role before Step 6. The plan review of Step 3
   is not repeated after implementation. The report says so. If the floor does not apply
   to an edit in a sensitive area, the report says why not.

## Step 5: final review

Every tier runs Step 5 with one reviewer role, the one Step 4.5 resolved: the
tier's Codex reviewer (`gpt-6.1-sol` at medium, `gpt-6-astra` at high and xhigh), or, for
a higher-risk run, the Claude reviewer, the `code-review` skill at
the tier's level (in a worktree run, the Opus substitute of the Claude review contract,
item 7). For a higher-risk run, confirm the skill is listed as the Claude review contract
says before 5.1 runs; a worktree run needs no such check, and a lower-risk run needs none
at all. A lower-risk run that turns higher-risk in this step makes the check, and ends
`blocked` naming both the switch to Claude and the missing skill when the skill is not
listed.

1. Integrate all slices and run the full check suite. This is the first full run since the
   baseline, because Step 4 runs only the checks each slice names. A check that passed at
   baseline and fails now must be fixed before review, and the fix is reviewed in Step 5 like
   any other change. Rerun the full set after such a fix, so the last full run recorded in
   `run.md` is the one after the last edit. From here on, log every edit you or a subagent
   makes in `run.md`.
2. Judge the higher-risk rule again on the diff as it stands, before every round; a
   positive result sticks and the run never moves back to Codex. Send the complete diff to
   the run's one reviewer role: the tier's Codex reviewer with `ccx:review` as the Reviewer
   contract describes, or the Claude reviewer with `code-review` at the tier's level as
   the Claude review contract describes. Make no edit during the pass. The round is
   complete when the role has returned. In Multi-repo mode the role covers every changed
   repository, as the Step 5.2 rules in `multi-repo.md` say. Record the role and the
   criterion in `run.md`, and any switch to Claude with its reason.
3. Merge the findings into one list, keeping each finding's source, and drop duplicates that
   name the same defect. Check each finding first against the findings recorded as
   rejected with a reason: this stage's rounds in `run.md`, and Step 3's review log in
   `plan.md`. A finding that names the same defect and cites no evidence the rejection did
   not cover is recorded as repeated, keeps that disposition, and is not verified again. A
   finding that cites evidence the rejection did not cover is verified like any other.
   Verify each other finding before acting on it, and decide whether it is blocking. Fix
   confirmed blocking findings. Fix a confirmed non-blocking finding only when the fix stays inside the plan's scope. Otherwise defer it and list it in the report.
   Reject findings that do not hold and record the reason. Fixes go to the slice's
   implementer at its effective model, in one batch per round: for a Codex slice, a fresh
   `ccx:implement` call given the findings and the slice's current diff; for an
   Sonnet slice, the agent continued, or a fresh one with the finding and the
   current diff. A fix is made only when a round remains to review it. In
   the third round nothing is fixed: a confirmed blocking finding ends the run in
   `blocked`, and a confirmed non-blocking finding is deferred and listed in the report.
4. After the fixes, judge the rule again and run the next round with the active reviewer:
   for Codex, resend in the same thread with `ccx:ask --resume <thread id>` and `diff.patch`;
   for its fallback, continue the subagent under Codex availability item 3;
   for Claude, rerun the skill fresh at the same level, and in a worktree run continue the
   Opus substitute with SendMessage. In Multi-repo mode, resend each additional
   repository's patch the same way, and continue its Claude subagent with SendMessage, as
   `multi-repo.md` says. When the rule has newly turned the run higher-risk, the next
   round is a fresh Claude pass, whose Opus subagents start fresh, and the Codex threads
   are left. Repeat until the reviewer has no confirmed blocking finding, with one shared
   cap of 3 rounds for the stage, whichever role ran them. So at most two rounds fix
   anything, and the third can only confirm. A confirmed blocking finding in the third
   round ends the run in `blocked`; there is no orchestrator fix after the Step 5 cap,
   because every Step 5 fix must be seen by a later round. Any fix made in Step 5 is
   covered by the next round's review and by Step 6's checks.
5. Put rejected findings and their reasons in the report, the role of each round with the
   criterion that made the run higher-risk (or that none held), and every Claude pass
   with its round, level, and result.

## Step 6: checks

1. Discover checks from, in order: the `checks` list in `.ccx.json` if present; then package
   scripts named `test`, `lint`, `typecheck`, or `build`; `Makefile` targets with those names;
   `pyproject` tool sections that imply `pytest`, `ruff`, or `mypy`; and CI workflow jobs whose
   steps run one of the above. Merge the sources in that order and drop duplicate commands. A
   CI job that runs anything else is listed as CI-only. Record for each check the command, its
   source, whether it can run locally, and its baseline result. Run every check that can run
   locally, each with its check budget. Step 6 runs the full set after the last edit of the
   run. If `run.md` records no edit after Step 5.1's last full run, report that run as Step
   6's result instead of repeating it. Any edit after that run, including a Step 5 fix or a CI
   repair, means the full set runs again.
2. Name every check that cannot run locally in the report as not run, with the reason and
   the exact command, with its working directory when it is not the checkout root, so the
   user can run it. A check cannot run locally when a resource it needs is not available to
   this session, as carve-out 3 defines; a check that was refused permission is a denial
   under carve-out 3, not a check that cannot run. Skip nothing quietly.
3. Every locally runnable check in the current set must pass before publish, including checks
   this run added and checks that could not run at baseline. The one exception is a failure
   that matches the recorded baseline failure for the same check (same command, same failing
   tests or error). Report it with the baseline run as evidence. It is not the loop's to fix. A
   check that can only run in CI is deferred to the CI gate in Step 7.3 and named in the
   report as deferred.
4. A behavior change gets a test if the repo has a suite.
5. Fix a failing check that is not a baseline match. The fix goes through a Step 5 round,
   at every tier, with the run's reviewer role, within Step 5's cap of 3 (if that
   cap is already used up, end in `blocked`, naming the round cap).
   Then run the full set again. Step 6 runs at most 3 times. A failure still open after the
   third ends the run in `blocked`.
