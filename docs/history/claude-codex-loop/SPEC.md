# claude-codex-loop

A Claude Code plugin that runs a tiered plan, review, implement, review, publish loop
for one unit of work. Claude orchestrates and reviews. Codex gives a second opinion.
Codex implements the slices, and Claude subagents are the fallback implementer and the
choice for some slices at high, xhigh, and max. The user types one command instead of a
hand-written workflow prompt.

Status: final draft, amended 2026-09-28 and 2026-09-29. Reviewed by Codex astra over four rounds, and
again on the amendments; no blocking findings remain. No code exists yet. Repair mode,
`--merge`, and `--worktree` are deferred to 0.2 and preserved at the end of this file.

## Problem

The same eight to ten line workflow prompt has been typed by hand roughly 35 times in
three weeks, across seven repos. The prompt drifts between runs, so hard-won rules such
as round caps, full Codex model ids, up-front approval grants, and the pre-PR check step
get dropped. Each drop costs a stalled run or a manual follow-up.

## Goals

1. One command replaces the hand-written prompt.
2. Effort is sized per task, so a small fix does not pay for a large loop.
3. The loop is safe to leave unattended: bounded rounds and time, explicit approval
   scope, defined terminal states, no quiet skips.
4. The plan and the final report are durable files, in the target repo when the repo
   opts in.
5. Works without Codex, with a stated downgrade.

## Non-goals

- Replacing Spec Kit or OpenSpec. This plugin does not maintain a living system spec.
- Merging or deploying by default.
- Anything specific to one repo, org, or CI vendor. The plugin discovers what it needs
  from the target repo and `gh`.

## Roles

Reviewers are keyed by reviewer, not by tier. The Effort tiers table says which
reviewer each stage uses at each tier.

| Role | Default | Fallback when the default is unavailable |
|---|---|---|
| Orchestrator and primary reviewer | The session's current Claude model (Opus or Fable) | none, the run stops |
| Codex reviewer, `gpt-6.1-sol` | `/codex-lite:ask` or `/codex-lite:review`, model `gpt-6.1-sol` | Opus subagent |
| Codex reviewer, `gpt-6-astra` | `/codex-lite:ask` or `/codex-lite:review`, model `gpt-6-astra` | Fable subagent, else Opus subagent, at any tier |
| Claude reviewer (Step 5, every tier) | The built-in `code-review` skill at the tier's level | none; a missing skill ends the run in `blocked` when the stage starts |
| Implementer, Codex | `codex-lite:implement` through the Skill tool, model per the Effort tiers table | Agent tool `sonnet` |
| Implementer, Opus | Agent tool `opus`, for a slice that meets the written criteria at high, xhigh, and max | Sonnet on an Opus tool error, recorded as a swap |

Codex model ids are always the full id. Bare `sol` fails on a ChatGPT account.
`gpt-6-luna` implements at low tier and is never a reviewer.

A fallback swaps one reviewer or one implementer. It never removes a stage. The tier is
set by the task's risk and does not change because a reviewer is unavailable. Every swap
is named in the final report. If no reviewer is available for a required stage, the run
ends in the `blocked` state. The Claude reviewer is a fixed slot beside the Codex slot:
it is not a fallback, nothing replaces it, `--no-codex` does not touch it, and its
availability is checked only when a stage that needs it starts. In a worktree run, and in
Multi-repo mode for each additional repository, an Opus subagent fills the Claude slot,
because the skill reviews only the session's checkout; that substitute is recorded and is
not a swap. Every Claude pass is
given the base commit as its target, so it reviews the same base-to-working-tree diff
Codex does; the level is always explicit, and `--comment` and `--fix` are never passed.

## Prerequisites

- Claude Code with a strong reasoning model selected. The selected model becomes the
  orchestrator.
- `gh` authenticated for the target repo. It is needed for GitHub remotes. On any other
  host the run ends in `prepared` with a handoff (see Step 7). On a GitHub remote where
  `gh` is not authenticated and the URL host is `github.com`, the command rejects the
  request.
- Optional but preferred: Codex CLI and the `codex-lite` plugin. All Codex calls go
  through `/codex-lite:ask` for plans and questions, `/codex-lite:review` for diffs, and
  `/codex-lite:implement` for slices.
- The built-in `code-review` skill, for every run that reaches Step 5. Plan-only runs do
  not need it.
  The orchestrator never runs the `codex` CLI directly. Codex has no network access, so
  every input Codex needs is fetched first and passed in the request or in a file it can
  read. Codex requires a git repository as its working directory.

## Reviewer contract

- Every Codex reviewer call passes the full model id and `--timeout` from the Codex
  budget, capped at 60 minutes because codex-lite accepts 1 to 3600 seconds.
- Plan review uses `/codex-lite:ask`. Follow-ups pass the thread id explicitly with
  `--resume <id>`, never bare.
- Diff review uses `/codex-lite:review --base <base-commit>`, which covers committed
  and uncommitted work from the base to the working tree. Before each review, every
  new file the run created is marked with `git add -N` by name so it is compared.
- Diff review follow-ups go through `/codex-lite:ask --resume <id>` with the current
  diff written to a file under `<artifacts>`, because `review` cannot resume. In a
  worktree run (Step 0.3), and for an additional repository in Multi-repo mode, every
  diff review goes through `/codex-lite:ask` with a patch file, because `review` reads
  only the session's checkout.
- Codex availability is decided from `codex --version` and the installed codex-lite
  version, 0.8.0 or later. The session's skill list is not consulted. A Skill call for a
  codex-lite command that errors because the skill is not listed counts as a `failed`
  call: retry once, then swap, recording "skill not listed in session" and Codex as
  unavailable for the rest of the run.
- codex-lite's status line decides failure handling: for a reviewer call, `failed` or a
  missing status is retried once, then swapped to the fallback; `refused` is not retried
  and ends the run in `blocked` with the message; `timeout` is a budget expiry.
  Implementer calls follow the Failure rules, because they write.
- An implementer call is `codex-lite:implement` through the Skill tool, with `--model`
  from the Effort tiers table, `--timeout` (1 to 3600), and, for a worktree run or an
  additional repository, `--cwd <absolute path>` as the last option, since its value is
  the rest of its line verbatim; the request text starts on the next line. `--timeout`
  is the smaller of the subagent budget and the remaining run budget, in seconds, capped
  at 3600. The run log records the cap and the value passed. Its output lines, including
  the `status:` line and the tree footer, are identical to `codex-lite:do`. It has no
  `--resume`: every call starts a new thread.
- Only the orchestrator calls Codex, one call at a time, because codex-lite has one
  request file and one thread file per session. Independent Codex slices therefore run
  in series.

## Command

```
/ccl:run <inputs...> [--effort low|medium|high] [--plan-only] [--no-codex]
         [--no-publish] [--run-budget <minutes>] [--repo <path>]... [--branch <name>]
/ccl:plan <inputs...> [--effort low|medium|high] [--no-codex]
          [--run-budget <minutes>] [--repo <path>]... [--branch <name>]
```

The plugin name is `ccl`, so every command is namespaced and none collides with the
built-in `/loop`, which reruns a prompt on an interval. `/ccl:plan` is `/ccl:run
--plan-only`. The two commands share one skill.

### Inputs

Both commands run **build mode**. A PR reference is not an input in 0.1 and is
rejected before setup.

Inputs, any number, mixed:

- Issue URLs or `#123` numbers. Several issues are bundled into one PR. All must belong
  to the same repo as the current checkout; any other is rejected before setup. In
  Multi-repo mode an issue may also belong to a `--repo` checkout, given as a full URL,
  and a bare `#n` names an issue of the current checkout. On a non-GitHub host an issue
  input is rejected: only file and text inputs are accepted there.
- A quoted ad-hoc description.
- A path to a file with handoff notes or pasted review output.

A token that is an issue URL or `#n` is an issue; a `#n` that `gh` reports as a pull
request, or any pull request URL, is rejected. A token that names an existing file is
a file input. The remaining text, joined, is one ad-hoc description.

### Flags

- `--effort`: skip the estimate and force a tier. Cannot lower a task below the risk
  floor (see Effort tiers).
- `--plan-only`: stop after the plan is final, in every tier, and print it. Nothing
  after the plan runs.
- `--no-codex`: use the Claude fallbacks even if Codex is installed.
- `--no-publish` (`/ccl:run` only): withhold Step 7. The run ends in `prepared`.
- `--run-budget <minutes>`: the run budget for this run, a positive integer.
- `--repo <path>`: an additional writable checkout, repeatable. See Multi-repo mode.
- `--branch`: the branch name to work on. Default is a new branch off the resolved
  default branch in the current checkout. With `--plan-only` it is only recorded in
  the plan.

## Approval scope

The plugin reads the repo's and the user's instruction files before it changes anything.
If those files add an ask-first rule, that rule wins. The plugin never removes one.

With no rule to the contrary, the plugin does these without asking:

- Create a branch, commit, push that branch, open one PR, or one PR per repository in
  Multi-repo mode, edit each of this run's PR bodies once to link the siblings, comment
  on the source issues, and post the report update on that PR that Step 7.1 describes.

The skill text lists these actions so that invoking the command is the user's
explicit approval for them, for this run only. The skill states the effective
permissions and their carve-outs at the start of every run, subject to the applicable
instruction files. A rule in those files that requires asking still wins.

It always asks before:

- Force push, `--no-verify`, merging, anything that deploys, including a push or PR
  that triggers a deploy, editing repo settings, opening a new issue.

A denied permission is never retried or routed around. Every step that depends on the
denied action is marked not done, and the run ends in the `blocked` state after any
steps that do not depend on it. A denial of a Step 7 action before anything is pushed
withholds publication and ends the run in `prepared` instead.

A dropped call is not a denial. A call is dropped when it returns no result and no
explicit denial: the tool result is missing or says the call was not run. A dropped
read-only call is retried once, serially, and recorded in the run log. A dropped write
is not retried blindly: its target is checked first, and it is retried once only when
the check shows it did not take effect. A write that took effect is recorded as done.
Once a parallel call has been dropped in a session, Step 0's remaining commands run one
at a time.

## Effort tiers

Five tiers: `low`, `medium`, `high`, `xhigh`, `max`.

| Step | Low | Medium | High | xhigh | Max |
|---|---|---|---|---|---|
| 1 Review and verify | yes | yes | yes | yes | yes |
| 2 Plan | orchestrator drafts, one or more slices | same | same | same | same |
| 3 Plan review and converge | Codex `gpt-6.1-sol` | Codex `gpt-6.1-sol` | Codex `gpt-6-astra` with a trigger, else `gpt-6.1-sol` | Codex `gpt-6-astra` | Codex `gpt-6-astra` |
| 4 Implement | Codex `gpt-6-luna` per slice, orchestrator reviews | Codex `gpt-6.1-sol` per slice, orchestrator reviews | Codex `gpt-6.1-sol`, or Opus by criteria, per slice | Codex `gpt-6-astra`, or Opus by criteria, per slice | Codex `gpt-6-astra`, or Opus by criteria, per slice |
| 5 Final review | Codex `gpt-6.1-sol` and Claude `code-review low` | Codex `gpt-6.1-sol` and Claude `code-review medium` | Codex `gpt-6-astra` and Claude `code-review high` with a trigger, else `gpt-6.1-sol` and `code-review medium` | Codex `gpt-6-astra` and Claude `code-review high` | Codex `gpt-6-astra` and Claude `code-review xhigh` |
| 6 Checks | yes | yes | yes | yes | yes |
| 7 Publish | yes | yes | yes | yes | yes |

"With a trigger" means the change has a risk floor trigger, whether or not the floor
raised the tier. It is judged at high tier only and decides two cells. The high tier
plan review is judged from the Step 1.5 floor check. The high tier final review is
judged from a trigger present at the estimate or in the diff after Step 4. A medium run
that rises to high always has a trigger in the diff, so it gets the trigger cell. xhigh
and max do not depend on the trigger. Every other cell is fixed by the tier.

At every tier a Step 5 round is both reviewers over the same unchanged diff, with one
shared cap of 3 rounds; findings from both are merged, with the source kept, and fixed
in one batch. The Codex thread is resumed; the Claude pass is fresh each round, except
the Opus subagent that fills the Claude slot for an additional repository in Multi-repo
mode, or in a worktree run, which is continued.

Estimate rule, applied after Step 1. Low, medium, and high are sized from behavioral
risk; xhigh and max from how many areas that share no file the change spans:

- Low: one file or one function, a clear fix, none of the risk floor triggers.
- Medium: several files in one area, or one issue with tests, or any doc restructure.
- High: a cross-cutting change inside one deliverable, or any risk floor trigger.
- xhigh: one change whose scope spans several areas that share no file. This sets
  review depth only; slice count is a plan property at every tier.
- Max: an xhigh-shaped change that also has a risk floor trigger.

Bundling issues does not by itself raise the tier; the bundle is estimated as one
change. `--effort` skips the estimate and forces a tier, subject to the floor.

Implementer choice, per slice, recorded in the plan as "codex" or the criterion. Codex
at the tier's model is the default at every tier. At high, xhigh, and max, Opus replaces
it when the slice carries a risk floor trigger, owns more than eight files, or adds a
new module, type, interface, or rule section that another file cites. Sonnet is never
chosen at the plan. It is the fallback: with `--no-codex`, when Codex is unavailable at
Step 0.6, when a Codex implementer call returns `failed` or no status line twice in a
row, and when an Opus call returns a tool error. The swap is recorded, and so is the
slice's effective model.

Risk floor: a change that adds, alters, or removes an auth check, a permission rule, a
schema or migration, a row-level security policy, a data access path, or a public API's
signature or behavior is at least high tier, whether directly or through shared code or
configuration those depend on. Editing a file in one of those areas without changing
such behavior does not trigger the floor; the report says why not. `--effort low` or
`medium` on a floored task is refused with the reason and the run continues at high;
`xhigh` and `max` are above the floor and honored.

Re-evaluation after Step 4 is floor-only: the estimate rule is not applied again, so a
run never rises above high after implementation. If a trigger now exists and the run is
below high, it rises to high and gets the trigger cell of the high column at Step 5,
`gpt-6-astra` and `code-review high`. Then, at every tier, the Step 5 reviewers are
resolved from the table; only the high cell depends on a trigger, judged at the estimate
or in the diff.
The tier never falls, and the reviewers never weaken. Plan review is not repeated. The
estimate, its reason, any floor applied, the re-evaluation, and the Step 5 reviewers it
resolved go in the report.

## Steps

### Step 0: preflight

1. Read the user's and the repo's instruction files and `.ccl.json`. Record any
   ask-first rules. A malformed `.ccl.json` stops the run in `blocked`. Then, before
   any other item runs, state the effective permissions for this run. For each action
   the run will take, say whether the session's permission mode or an instruction
   file's ask-first rule will prompt for it: fetching the default branch, writing
   `.git/info/exclude` and the artifacts under `.ccl/`, the Codex availability
   commands of item 6, running the repo's checks, branch creation, commit, push,
   opening the PR, issue comments, the PR report comment, each Codex call if Codex is
   used, subagents, and any other command the skill does not pre-approve. The mode
   comes from what the session states and from the settings files' default mode and
   allow rules; an action whose outcome cannot be determined counts as one that will
   prompt. If any will prompt, print "this run will prompt at:" with the list and
   continue; the run is then attended, and the report says so. If none will, print
   "this run is unattended" and continue.
2. Select the remote: the one `gh repo view` resolves when it succeeds, else `origin`,
   else the only remote; several remotes and no `origin` is a preflight failure naming
   them. Classify the host: `github` when `gh repo view` succeeds (GitHub Enterprise
   included). When it fails and the remote's URL host in `git remote -v` is `github.com`,
   reject the request because `gh` is not authenticated; otherwise the host is `other`.
   Resolve the default branch from the selected remote, on `other` from its `HEAD`
   symref (`git ls-remote --symref <remote> HEAD`), and fetch it. Record the base
   commit.
3. Require a clean working tree and an empty index. If either is dirty, stop with the
   `blocked` state and say what is dirty. The plugin does not stash. A stop here, or
   at any item before 5, prints the report and writes nothing (see Final report).
   One exception: git hides skip-worktree and assume-unchanged edits from
   `git status --porcelain`. If status and index are clean and at least one path marked
   `S`, `h`, or `s` in `git ls-files -v` differs from `HEAD` (through `git cat-file
   --filters`), the run creates a detached worktree beside the
   checkout, `<checkout-parent>/<checkout-name>-ccl-<run-id>`, from the base commit with `git worktree add
   --detach`, uses it as the run's checkout for every later step, and records it in the
   run log. `.ccl/` is ignored and the run id allocated first, so the run directory
   exists and a later failure writes its report. Every later command acts on the
   worktree, never on the original tree. The exception is allowed at every tier; the
   Claude reviewer slot is then the Opus subagent substitute (see Roles). It is not
   available in Multi-repo mode. The worktree is kept, and
   the report names its path and how to remove it. This is a narrow use of the deferred
   `--worktree` feature, not the feature.
4. Record `HEAD` as the planning snapshot. If it is not the base commit, say so in the
   run log once Step 0.5 creates it; Steps 1 and 2 read the snapshot, and Step 3.7 reverifies against the base
   commit.
5. Allocate `<run-id>` and create `<artifacts>/<run-id>/`. Fetch every issue with `gh`
   into `<artifacts>/<run-id>/inputs.md`; on a non-GitHub host there is no issue to
   fetch. Record the run budget in force and its source.
6. Check Codex availability: plugin installed and enabled at version 0.8.0 or later,
   `codex` on PATH. Record the result. Apply `--no-codex`.
7. Record in the run log every prompt that occurred in items 1 to 6 and its outcome.
   If item 6 found Codex unavailable, say that the Codex prompts no longer apply. A
   prompt that was not predicted makes the run attended, and the report says so.

Branch creation and the baseline check run happen in Step 3.7, after the plan is
final, so planning never changes the tree.

### Step 1: review and verify

1. Read the inputs.
2. Verify each claim in code. For a bug, reproduce it or run a check that confirms or
   rejects the explanation.
3. If the issue text has drifted from the code, record what changed and why in
   `inputs.md`, plan against the corrected text, and put the correction in the PR body.
4. Mark each input as buildable here, partial, or blocked, with the reason. Partial and
   blocked inputs stay in the run and are reported per input.
5. Estimate effort, apply the risk floor, and record the reason.

### Step 2: plan

The orchestrator writes the plan to `<artifacts>/<run-id>/plan.md`. A plan covers,
per input: scope, acceptance criteria, and buildable-here status. Across inputs: shared
changes, migrations or RPCs, tests, checks to run, order of work, and how the work
splits into slices that do not share files. A plan at any tier has one or more slices;
the count comes from the change, not the tier. The plan records the implementer per
slice: "codex" or the criterion that picked Opus.

### Step 3: plan review and converge

Every tier. The reviewer comes from the Effort tiers table.

1. Send the plan file path and `inputs.md` to the reviewer with `/codex-lite:ask` as
   the Reviewer contract describes. Ask for objections ranked by impact, each marked
   blocking or not, with a confidence level. Blocking means the plan as written would
   ship wrong behavior, break an acceptance criterion, or violate a repo rule.
2. Verify each objection against the code before accepting it.
3. Revise the plan and resend in the same thread so it keeps context.
4. Repeat until the reviewer has no blocking objections, with a cap of 3 rounds.
5. If a disagreement is the user's call, write the question and both positions to the
   report, then stop in the `stopped` state.
6. If the cap is hit with a blocking objection open, end in `blocked` with the
   objection in the report. Non-blocking objections left open are listed in the plan.

### Step 3.6: plan-only stop

`--plan-only` stops here at every tier. The
plan is printed and written; nothing else runs.

### Step 3.7: execution setup

1. If the planning snapshot was not the base commit, repeat Step 1.2's verification
   against the base commit, read without changing the tree, and revise the plan where
   it differs. A revision gets one more Step 3 round at every tier, inside the
   existing cap. This comes before the branch, so a `stopped` run has no branch.
2. Create the branch from the base commit. Name: the `--branch` value, else
   `fix/<id>-<slug>` when any source issue has a `bug` label or a title starting with
   "fix", else `feat/<id>-<slug>`, where `<id>` is the issue numbers joined with `-` and
   `<slug>` comes from the first issue's title. With no issue, `work/<slug>` from the
   ad-hoc description or file name. A slug is lowercase letters, digits, and hyphens,
   at most 40 characters. If the name exists locally or on the remote, stop with
   `blocked`. On a non-GitHub host the branch is created locally and the remote is
   checked with `git ls-remote --heads`. In Multi-repo mode the check and the creation
   run in every repository.
3. Discover the repo's checks (see Step 6) and run them once on the base commit. This
   is the baseline. A check that fails here is pre-existing and is reported, not fixed.
4. If the plan adds a dependency, the orchestrator installs it now, after the baseline
   of item 3 has run on the unchanged base and after the ask-first rule, before any
   implementer starts, because Codex has no network. The manifest and lockfile edits
   are part of the run's diff and are reviewed in Step 5 like any other change.

### Step 4: implement and iterate

1. Give each implementer its plan slice, the repo's instruction files, and the checks
   it must pass. No two agents edit the same file at the same time. Each implementer
   also matches the repository's line endings for every new file, and never changes the
   line endings of a file it edits. Before review, the orchestrator checks new files
   with `git ls-files --eol` and treats a mismatch as a finding. A check of a slice that
   needs the network is run by the orchestrator after the implementer returns, and a
   failure goes back under item 3 as a finding. The implementer choice does not change
   because of this.
2. One implementer per slice at every tier, as the plan records it: Codex at the tier's
   model by default, Opus for a slice that meets the criteria at high, xhigh, and max,
   Sonnet as the fallback. A Codex slice is one `codex-lite:implement` call through the
   Skill tool, with `--cwd` for a worktree run or an additional repository. Codex calls
   run one at a time per session, so Codex slices run in series, in the plan's order of
   work. An Opus or Sonnet slice runs with the Agent tool. When the plan has one such
   slice, one agent runs. When it has more, and the plan's order of work shows the
   slices are independent, they run in parallel with each other; slices with an
   ordering dependency run in that order, one agent each. Independent slices run
   either as one Workflow whose script runs one agent per slice, or as parallel Agent
   calls issued in one message. The orchestrator chooses. Agent calls are the default
   when review rounds are expected, because they can be continued and Workflow agents
   cannot. The choice and the reason are logged in the run log. A run of this plugin
   counts as the user's opt-in to multi-agent orchestration. The tier sets review
   depth, not concurrency.
3. The orchestrator reviews each slice's diff against the plan and the acceptance
   criteria, then sends findings back to the same agent when it can be continued, else
   to a fresh agent given the findings and the slice's current diff. A Codex slice's
   fix round is always a fresh `implement` call given the findings and the slice's
   current diff, because `implement` threads are not resumed.
4. Repeat until a round has no blocking findings, with a cap of 3 rounds per slice. A
   finding is blocking by Step 3's definition: the change as written would ship wrong
   behavior, break an acceptance criterion, or violate a repo rule. The orchestrator
   decides severity by verifying the finding, not by taking the reviewer's label. A
   non-blocking finding is fixed in the same round only when the fix stays inside the
   slice's files and the plan's scope; otherwise it is listed in the report as
   deferred. After the cap the orchestrator fixes any blocking finding that remains
   itself, once. A blocking finding still open after that ends the run in `blocked`.
5. Tier re-evaluation against the actual diff, and the Step 5 reviewers resolved from
   it, as the Effort tiers section describes.

### Step 5: final review

Every tier has two reviewers, the Codex reviewer Step 4.5 resolved and the `code-review`
skill at the tier's level, whose presence is confirmed before 5.1 runs. In a worktree
run, and for an additional repository in Multi-repo mode, the Opus subagent substitute
fills the Claude slot instead.

1. Integrate all slices and run the full check suite; this is the first full run of
   the set since the baseline, since Step 4 runs only the checks each slice names. A check that passed at
   baseline and fails now must be fixed before review, and the fix is reviewed in
   Step 5 like any other change.
2. Send the complete diff to every reviewer the stage has, over the same unchanged
   tree: Codex with `/codex-lite:review` as the Reviewer contract describes, and the
   `code-review` skill with the base commit as its target. The
   round is complete only when both have returned.
3. Merge the findings into one list, keeping the source. Verify each before acting on
   it, and decide whether it is blocking by Step 3's definition. Fix confirmed blocking
   findings. Fix a confirmed non-blocking finding only when the fix stays inside the
   plan's scope; otherwise defer it and list it in the report. Reject findings that do
   not hold and record the reason. Fixes go to the slice's implementer in one batch per
   round; for a Codex slice that is a fresh `implement` call with the findings and the
   slice's current diff. A fix is made only when a round remains to review it: the
   third round fixes nothing, a blocking finding there ends the run in `blocked`, and
   a non-blocking one is deferred.
4. Resend Codex in the same thread, and rerun the Claude pass fresh (the Opus
   substitute is continued), until no reviewer
   has a confirmed blocking finding, with one shared cap of 3 rounds. There is no
   orchestrator fix after the Step 5 cap. Any fix made in Step 5 is covered by the next
   round's review and by Step 6's checks.
5. Rejected findings and their reasons, and every Claude pass with its round, level,
   and result, go in the report.

### Step 6: checks

1. Checks are discovered from, in order: a `checks` list in the plugin's repo config
   file if present, then package scripts, `Makefile`, `pyproject`, and CI workflow
   jobs. Run every one that can run locally. Step 6 runs the full set after the last
   edit of the run. If no file changed after Step 5.1's full run, as recorded in the
   run log, Step 6 reports that run as its result instead of repeating it. Any edit
   after that run, including a Step 5 fix or a CI repair, means the full set runs
   again.
2. A check that cannot run locally is named in the report as not run, with the reason.
   Nothing is skipped quietly.
3. Every locally runnable check in the current set must pass before publish,
   including checks added by this run and checks that could not run at baseline. The
   one exception is a failure that matches the recorded baseline failure for the same
   check; that one is reported with the baseline run as evidence and is not the loop's
   to fix. A check that can only run in CI is deferred to the CI gate in Step 7.3 and
   named in the report as deferred.
4. A behavior change gets a test if the repo has a suite.
5. A failing check that is not a baseline match is fixed, and the fix goes through
   a Step 5 round with every reviewer the stage has, at every tier, within Step 5's cap;
   when the cap is exhausted the run ends in `blocked`. Step 6 then
   runs the full set again. Step 6 runs at most 3 times; a failure still open after the third ends the run in `blocked`.

### Step 7: publish

Publish runs only on the `github` host, when `--no-publish` is not set, when no
blocking defect is open, and when Step 6 passes. On another host, or with
`--no-publish`, the run ends in `prepared` here. A run whose Step 7 is withheld before
any push ends in `prepared`, including when an ask-first prompt for a commit, a push, or
a PR is answered with anything other than a clear yes. Otherwise, on a defect, the run
ends in `blocked`. A blocked run performs no further publication: no push, no PR,
no comment. Work already pushed by this run before it blocked, such as a PR whose CI
repair cycles ran out, stays where it is and the report links it. Work never pushed
stays on the local branch, and the report names the branch, the state, and what would
unblock it.

1. Commit with conventional commit messages. Stage only paths the loop changed, by
   name. Confirm nothing under `<artifacts>` is staged unless the repo opts in. With
   `"commit": true`, write the report with the provisional state `publishing` and
   commit it before the push, in the same commit as the plan when the run created one.
   Later report updates go only to the printed report and to a PR comment; after this
   run's first Step 7 push, the plugin commits only CI repairs.
2. Push the branch and open one PR, one per repository that has a diff in Multi-repo
   mode. The body: what changed per input, decisions a reviewer needs to understand the
   shipped change, checks not run, and a closing reference per input. Completion is
   decided per input after implementation, the tier's required reviews, and Step 6:
   `Closes #n` when every acceptance criterion is confirmed met, `Refs #n` with a
   status comment otherwise. The criteria come from the plan. In Multi-repo mode an
   issue is closed only by the PR in its own repository, and every other PR of the run
   cites it as `Refs <owner>/<repo>#n`.
3. Watch CI. The watch reads four things with `gh`, all readable with read access to
   the repo.
   - Required checks: the branch's `protection.required_status_checks` from the
     branch endpoint, and the `required_status_checks` rules from the branch rules
     endpoint, which includes organization rulesets. Each entry is a name and, when
     set, the app that must report it. Ruleset `workflows` rules name required
     workflows by file path and repository. If either read fails, CI cannot be verified and the run ends in
     `blocked`, naming the failed read.
   - Applicable workflows: a workflow applies to the PR when it triggers on pull
     requests, its `types` filter, if any, includes the event the watched head commit
     produced (`opened` for the first watch after the PR is created, `synchronize`
     after a CI repair push to the open PR), its branch and path filters (`branches`,
     `branches-ignore`, `paths`, `paths-ignore`) match the PR's base branch and
     changed files, and, for a workflow triggered by `pull_request` rather than
     `pull_request_target`, the PR head commit's message carries no skip instruction
     (`[skip ci]`, `[ci skip]`, `[no ci]`, `[skip actions]`, `[actions skip]`, or a
     `skip-checks:true` or `skip-checks: true` trailer). A filter that cannot be
     evaluated with confidence counts as a match. The report names each workflow a
     skip instruction made not applicable.
   - Expected deferred checks: every check Step 6 deferred to CI whose workflow
     applies, matched by job name. A deferred check whose workflow does not apply is
     named in the report as not triggered, with the filter that excluded it, unless it
     is also a required check.
   - Results: the check runs and commit statuses on the PR head commit and on the
     PR's test merge commit (`merge_commit_sha`). Only the latest result counts: the
     latest status per context, and the latest attempt of each check run within its
     own check suite, so same-named checks from different workflows are judged
     separately. Earlier attempts are kept in the report as history only. A missing `merge_commit_sha` is
     read again on the next poll, and both commits are read again after every push.
   A result passes when it is `success`, `neutral`, or `skipped`; any other finished
   result (`failure`, `cancelled`, `timed_out`, `action_required`, `stale`, or a
   commit status of `failure` or `error`) is a failure. The gated commit is the test
   merge commit when it has any status or check run, else the head commit, because
   GitHub judges required checks on the test merge commit when it has a status. A
   required check is met when its latest result on the gated commit passes, from the
   required app when one is set, and, when the name exists both as a check run and as
   a status, both pass. A required app is verified from a check run's app. A commit
   status carries no app, so when a required check names an app and only a status
   carries that name, its source cannot be verified: the run ends in `blocked` at once,
   naming the check, rather than risk `done` while GitHub rejects the source. A required workflow is met when
   its latest run for the head commit, matched by the rule's workflow file path
   and repository, passes; a match that cannot be confirmed counts as unmet; a required workflow whose run cannot be matched is named in the report and
   treated as unmet.
   CI is not judged until 2 minutes after the push. If the PR has a merge conflict,
   `pull_request` workflows do not run, so the run ends in `blocked` at once, naming
   the conflict. CI is green when every required check and required workflow is met,
   every expected deferred check has passed on the head commit, every applicable
   workflow has reported at least one check on the head commit, and every latest
   result on either commit has finished and passed. The last condition is stricter
   than GitHub's merge gate, on purpose: the loop publishes only fully green work,
   and the report says so when an optional check blocked it. Anything unmet or not
   yet reported is pending until the CI budget expires, then `blocked`. A failure in
   a latest result is a CI failure. CI is not applicable only when there are no
   required checks or workflows, no workflow applies, no deferred check is expected,
   and no result has appeared on either commit within 2 minutes of the push; the
   report says so. A result that appears on either commit keeps the watch open until
   it finishes. A CI failure that needs a code change re-enters Step 5
   and Step 6 for the new diff, with the round allowance the Budgets section gives each
   cycle, one round holding every reviewer the stage has, before the fix is pushed. The
   Codex reviewer of a repair round uses the Step 5 Codex thread when one exists, else
   `codex-lite:review --base <base-commit>`; the Claude reviewer runs beside it. Up to 3
   CI repair cycles.
4. Comment on each source issue with status and evidence, including partial completion.
   In Multi-repo mode the comment names every PR of the run.
5. List deferred or out-of-scope items in the report, each with a short description
   and the reason it was deferred. The plugin does not open issues in v0.1.

### Terminal states

Every run ends in exactly one:

- `done`: PR open and CI green or not applicable. Report written.
- `plan-only`: plan final and written, nothing else run.
- `prepared`: every step through Step 6 is complete with no blocking defect open, and
  Step 7 was withheld before anything was pushed, by `--no-publish`, by a non-GitHub
  host, or by the user answering a Step 7 ask-first prompt with anything other than a
  clear yes. The report names the branch, the commit state, and how to publish: the
  `git add` and `git commit` commands when the work is uncommitted, the `git push -u
  <remote> <branch>` command, and on the `github` host the `gh pr create` command; on
  any other host a note that the pull request is opened with the host's own tooling. It
  is not a failure.
- `blocked`: a blocking defect, a denied permission after the first push or in Steps 0
  to 6, a budget exceeded, or a preflight failure. Report says what and what would
  unblock it.
- `stopped`: the run stopped to ask the user a question it cannot decide. The
  question and both positions are in the report. A rerun with the same inputs and
  the answer as an extra ad-hoc input starts from Step 0 with a new run id; no branch
  exists yet, so nothing collides.

### Final report

Written at every terminal state and printed. A failure before Step 0.5, when the run
directory does not exist yet, prints the report and writes nothing, because the tree
may be dirty and `<artifacts>` may not be ignored yet; the printed report says which
preflight item failed and what would fix it. From Step 0.5 on, with `"commit": false`,
the path is `<artifacts>/<run-id>/report.md`. With `"commit": true` the committed snapshot from
Step 7.1 is never modified after its commit; the terminal report is written to
`.ccl/<run-id>/report.md`, which is always git-ignored. Contents:

- Terminal state, PR link or links, CI state, the host, the run budget in force with
  its source, and the worktree path when one exists. For `prepared`, the branch, the
  commit state, and the commands to publish.
- Attended or unattended, and the prompts that occurred.
- Effort tier and why, including any risk floor, any re-evaluation, and the Step 5
  reviewers it resolved.
- What changed, per input, with its completion status.
- Decisions made, including every reviewer swap.
- Findings rejected and why.
- Checks not run and why; checks failing at baseline.
- Deferred items, each with a short description and reason, including findings
  deferred as non-blocking.
- Anything blocked and what would unblock it.

## Artifacts

`<artifacts>` is `.ccl/` in the repo root, git-ignored by the plugin on first run. If the
repo's `.ccl.json` sets `"commit": true`, the run still works in `.ccl/<run-id>/`, and
Step 7.1 copies the plan and the provisional report to `specs/ccl/<run-id>/` and commits
them on the work branch before the push. Nothing is written under `specs/ccl/` before
Step 7.1, so a run that ends earlier leaves the tree clean.

`<run-id>` is `<yyyy-mm-dd>-<inputs>`, where inputs is the issue numbers joined with
`-` when there is any issue, else the slug of the ad-hoc description or file name. A rerun with the same id appends a numeric suffix. The
plugin never overwrites an existing file it did not write in this run.

`.ccl.json` fields, all optional: `commit`, `checks` (list of commands), `timeouts`.

## Budgets

- Rounds: no step repeats more than 3 times. A round is one pass by each reviewer the
  stage has, over the same diff or plan, and the fixes those passes lead to. The
  orchestrator's single fix after the Step 4 cap is not a round; Step 5 has none. A Step
  3.7.1 revision is a Step 3 round. Each CI repair cycle gets one Step 5 round and one
  full Step 6 run of its own, on top of whatever Step 5 used before the push, because
  the cycles are already capped at 3 by Step 7.3.
- Time, per call: each subagent 20 minutes, each Codex reviewer call 10 minutes, each
  check 15 minutes, CI wait 45 minutes. A Codex implementer call gets the smaller of the
  subagent budget and the remaining run budget, capped at 3600 seconds, and the run log
  records the cap and the value passed; Opus and Sonnet calls keep the full subagent
  budget. A budget is passed to the tool where the tool takes a
  timeout; otherwise the orchestrator records the start time and treats a call that
  returns past its budget as expired.
- Time, per run: from Step 0 to the terminal state, including CI waits and the
  orchestrator's own work. The default is by tier: 120 minutes at low and medium, 240 at
  high, 360 at xhigh and max. Every tier runs Step 5, so the low and medium defaults
  include it. Precedence: `--run-budget <minutes>`, else `.ccl.json`
  `timeouts.run`, else the tier default. An explicit value from the flag or the file
  applies from Step 0 to the terminal state and is never replaced by a tier default.
  With no explicit value, 240 applies until Step 1.5 sets the tier, and the tier
  default replaces it then. An explicit instruction from the user in the session that
  names a new budget replaces it from that point, and is recorded in the run log. The
  report names the budget in force and its source. Checked before every step and every
  call.
- The per-call budgets are overridable in `.ccl.json` under `timeouts`, with `run` as
  the run-wide key.
- Expiry: the step or call is cancelled, its output so far is kept, and the run ends
  in `blocked` with the budget named. A run-wide expiry after the first push leaves
  the PR as it is and the report links it.

## Failure rules

- A Codex reviewer call is handled by codex-lite's status line as the Reviewer contract
  describes: `failed` is retried once with the same arguments, then the stage's
  reviewer swaps to the Claude fallback and the report says so.
- A Codex implementer call writes, so `refused` ends the run in `blocked` with the
  message, `timeout` is a budget expiry, and `failed` or no status line may have
  written part of the slice. Two in a row send the slice to Sonnet; the first is retried
  once. Before the retry or the Sonnet fallback, the previous call must have returned
  its output, in the foreground or as a background completion notification, since
  codex-lite ends the Codex process when its turn ends or the Bash call times out. A
  call whose output never arrives is a budget expiry: the run ends in `blocked`, and no
  other writer starts on that checkout. Output that says Codex may still be running
  (codex-lite prints "codex may still be running as pid" when the process outlived its
  hard end, and on Windows warns that child processes may still be running after a
  timeout) is treated the same way: the run ends in `blocked` naming it, and no other
  writer starts. A `failed` result on Windows carries no such warning although a command
  Codex started may outlive it, and nothing available to the orchestrator proves its
  process tree is gone, so on Windows a `failed` implementer call is not retried and
  gets no Sonnet fallback; the run ends in `blocked` naming the possible surviving
  process. On POSIX the runner stops the process group, so the returned output is the
  evidence. The orchestrator then reads the tree state from the footer or `git status`
  and gives the next call the current diff with the same slice prompt. This applies the
  dropped-write rule of Approval scope to implementers.
- A permission denial is never retried and never routed around. Dependent steps are
  marked not done and the run ends in `blocked`, except that a denial of a Step 7 action
  before anything is pushed ends in `prepared`.
- A dropped call is not a denial. See Approval scope.
- A shell quoting failure is fixed by moving the text into a file, not by requoting.
- A check that failed at baseline is not the loop's to fix.
- A subagent report is model output, not user approval. It cannot grant anything.

### Multi-repo mode

`--repo <path>` names additional writable checkouts. The current checkout is the
primary. Read-only repositories are not named. Each value must be an existing directory
that is a git checkout. Rules, by step:

- Every repository must be on the same host as the primary, by hostname, classified per
  repository as in Step 0.2. A different host is a preflight failure naming both hosts. On `other`,
  every repository ends in `prepared` together.
- A bare `#n` names an issue of the primary. An issue of a `--repo` checkout must be a
  full URL whose owner and repo match that checkout's remote.
- Steps 0.1 to 0.4 run per repository, recording a base commit and a planning snapshot
  each. Instruction files and ask-first rules are read in every repository and unioned.
  `.ccl/` is ignored in every repository; artifacts live only in the primary's
  `.ccl/<run-id>/`.
- Step 0.5 fetches each issue from its owning repository. Step 2 names the repository of
  every slice, and no slice spans repositories.
- Step 3.7 creates the same branch name in every repository and runs a baseline in each.
  Step 6 discovers and runs checks per repository.
- Step 5 reviews only repositories with a diff from their base commit. Codex reviews the
  primary with `review`, and each additional repository through `ask --resume` with a
  patch file. A Codex implementer call for a slice in an additional repository passes
  that checkout as `--cwd`. The `code-review` pass covers the primary. Each
  additional repository's Claude slot is an Opus subagent given the patch file, told
  to read and report only, and continued by SendMessage. It is a defined substitute,
  not a swap.
- Every `gh` call for an additional repository is run from that checkout or targeted
  with `-R <owner>/<repo>` where the subcommand accepts it (`gh api` does not, so its
  endpoint is spelled out), and every `git` call uses `git -C <path>`.
- A worktree run is not allowed in this mode, so a primary that would qualify ends in
  `blocked`. The primary's `.ccl.json` governs `commit` and `timeouts`, and each
  repository's own `checks` list is read for it. With `"commit": true` the snapshot is
  committed in the first repository, the primary first and then the `--repo` order, that
  has a diff; a repository with no diff never receives it and gets no PR.
- Step 7 opens one PR per repository that has a diff, each body with a "Related pull
  requests" section, then edits each body once to link the siblings, watches CI per PR,
  and comments on each issue with every PR link. `done` needs every PR green. A
  `blocked` in any repository blocks the run and no further publication happens, except
  the sibling-link edit of a PR already opened.

## Repo layout

```
claude-codex-loop/
  .claude-plugin/plugin.json  name: ccl
  commands/run.md             /ccl:run, thin: parses args and loads the skill
  commands/plan.md            /ccl:plan, same with --plan-only set
  skills/ccl/SKILL.md         the orchestrator instructions, one section per step
  skills/ccl/tiers.md         tier table, estimate rule, risk floor
  skills/ccl/report.md        final report template
  skills/ccl/pr-body.md       PR body template
  docs/decisions.md           why each rule exists, with the failure that taught it
  README.md
  CHANGELOG.md
```

No hooks and no scripts in v0.1. Everything the loop needs is available through
Claude Code tools, `gh`, and the codex-lite plugin.

## Out of scope for v0.1

- Repo settings such as branch protection or Dependabot.
- A persistent system spec. If agents keep missing how existing features behave, try
  OpenSpec.
- Cross-machine handoff automation. The final report is the handoff.
- Gemini or other third reviewers.
- Cross-repo inputs, except issues of a `--repo` checkout in Multi-repo mode.

## Decisions taken from the review round

1. Artifacts default to a git-ignored path. Committing needs a repo opt-in, since a
   `specs/` folder alone does not say what convention it follows.
2. Substantive auth, schema, RLS, data access, and public API changes are always high
   tier, and the tier is re-checked against the diff. A single extra review at low
   tier would conflict with the classification.
3. The round cap stays at 3 for every tier. Time budgets and a `blocked` outcome do the
   bounding that a higher cap would not.
4. The plugin branches from the fetched default branch after the plan is final. It
   does not refuse to start on it, and planning never changes the tree.

## Amendments of 2026-09-28

Taken after a second review of the architecture and build plan, with a second opinion
from Codex astra. Each is applied above.

1. Steps 4 and 5 converge on no blocking findings, by Step 3's definition, instead of
   no findings. Optional improvements no longer consume bounded rounds.
2. Step 6 reuses Step 5.1's full check run only when the run log shows no edit since.
3. Branch creation and the baseline move to Step 3.7, after the plan is final.
   `--plan-only` never changes the tree.
4. One implementer per slice at every tier; parallel only for independent slices.
5. No issue comment before the plan, and no new publication on `blocked`.
6. Expected CI checks come from branch protection and Step 6's deferred checks, not
   from every workflow file, because path and branch filters make workflow-derived
   expectations false blockers.
7. Effort is estimated from behavioral risk; bundling issues does not raise the tier,
   and the tier is re-evaluated against the diff after Step 4.
8. The Reviewer contract section records how the loop uses codex-lite.
9. Repair mode, `--merge`, and `--worktree` are deferred to 0.2. Qualified on
   2026-09-29: the narrow worktree use in Step 0.3 is not the deferred `--worktree`
   feature.
10. Rounds are defined, the post-cap fix is not a round, each CI repair cycle has its
    own round, and a run-wide time budget bounds the whole run.
11. Step 0.1 states before any other action whether the run will prompt, and the report records
    the prompts that occurred.
12. A failure before the run directory exists prints the report and writes nothing.

## Clarifications of 2026-09-28, before implementation

Gaps closed before the 0.1.0 build, each applied above: input token rules and PR
rejection by `gh`; `--branch` under `--plan-only`; `.ccl.json` read at Step 0.1; the
remote used at Step 0.2; the run log starts at Step 0.5; how Step 0.7 determines
prompts; branch naming for several issues; continuing or replacing an implementer;
Step 5 at low tier, which ran no review until 0.7.0; the Step 6 fix loop; CI repair at
low tier, which used the orchestrator's review until 0.7.0; the unknown
expected CI set; the run id without `pr-<n>`; how per-call budgets are enforced; with
`"commit": true`, nothing is written under `specs/ccl/` before Step 7.1; Step 3.7
reverifies before it creates the branch; the Step 7.1 PR comment is in the approval
scope; Step 0.6 requires codex-lite 0.8.0 or later (0.7.0 before ccl 0.7.0); required
checks are judged on the gated commit, the test merge commit when it has a status,
else the head commit; Step 7.3
was rewritten after a full review against GitHub's rules: required checks and required
workflows are read from the branch and branch rules endpoints, which need only read access,
and a failed read blocks; only the latest result per check counts; a required check can
name its app; a merge conflict blocks at once; the all-green policy is stated as stricter
than GitHub's gate on purpose; latest results are kept per check suite; a required
workflow is matched by file path; a required check that names an app and is met only by a status blocks at once,
since a status's app cannot be verified; a required workflow is matched by path and
repository; the permissions statement moves
from Step 0.7 to Step 0.1, before the first action that can prompt, and covers Step 0's
own actions, with Step 0.7 recording the prompts that occurred; CI is not judged before
2 minutes after the push, green needs a report from every applicable workflow, and a
deferred check whose workflow filters exclude the PR is not expected; a workflow's
`types` filter counts toward whether it applies; the skill pre-approves `date`, which the
run budget needs before Step 0.1's statement; a skip instruction in the PR head commit's
message makes `pull_request` workflows not applicable, while required checks stay
expected; CI also judges the statuses and check runs on the PR's test merge commit,
including in the not-applicable decision; a check passes on `success`, `neutral`, or
`skipped`, and every other finished result is a failure.

## Amendments of 2026-09-29, and the 0.2.0 and 0.3.0 changes applied late

This file was not updated for 0.2.0 or 0.3.0. Those changes are applied above together
with the 2026-09-29 amendments, so the sections above describe the plugin as it stands.

From 0.2.0 and 0.3.0: five tiers replace three; the Codex round review in Step 4 is
removed; slice count is a plan property at every tier; xhigh and max choose Sonnet or
Opus per slice (Codex is the default implementer from 0.7.0); the risk floor targets high; re-evaluation is floor-only.

From 2026-09-29:

1. Every tier reviews the plan with Codex. Low no longer skips Step 3.
2. Medium gets a `gpt-6.1-sol` diff review. Low tier skipped Step 5 until 0.7.0.
3. Two cells follow the risk trigger: the high plan review, judged at the estimate, and
   the final review, judged from the estimate or the diff. From 0.7.0 the trigger is
   judged at high tier only. Every other cell is fixed by the tier.
4. The built-in `code-review` skill reviews the diff beside Codex, at the level the
   Effort tiers table gives each tier; until 0.7.0 it ran from high tier up only, at
   medium, high, and xhigh for high, xhigh, and max. It is a fixed slot, never
   swapped, untouched by `--no-codex`, and a missing skill blocks only where needed.
   Every pass is given the base commit as its target, because the skill's own range can
   include unrelated commits when local `main` is behind the fetched base.
5. A Step 5 round is both passes over the same diff under one
   shared cap of 3. The third round fixes nothing. There is no post-cap fix in Step 5.
6. CI repair and Step 6 repair use the paired round, at every tier from 0.7.0 (medium
   tier and above before).
7. The reviewer fallback follows the Codex model, not the tier.

## Amendments of 2026-09-29, second set

Taken after eight issues from live runs. Each is applied above.

1. Step 0 detects the remote host. On a host other than GitHub the run ends in `prepared`
   after Step 6; a full Azure DevOps path is out of scope. (#4)
2. Multi-repo mode: a repeatable `--repo <path>` flag, with a base commit, branch,
   baseline, checks, and PR per repository. (#5)
3. The `prepared` terminal state and the `--no-publish` flag. (#6)
4. Codex availability no longer depends on the session's skill list. (#7)
5. Implementers match the repository's line endings, and Step 4.3 checks them. (#8)
6. Independent slices run as one Workflow or as parallel Agent calls, with the choice
   logged. (#9)
7. The run budget default is by tier, and `--run-budget` overrides it. (#10)
8. A dropped call is not a denial, and a clean tree with skip-worktree edits runs in a
   detached worktree. (#11)

## Amendments of 2026-09-30, ccl 0.7.0

Codex implements, and the final review runs at every tier. Each is applied above.

1. The implementer is Codex at every tier, through `codex-lite:implement`, at one model
   per tier: `gpt-6-luna` at low, `gpt-6.1-sol` at medium and high, `gpt-6-astra` at
   xhigh and max. At high, xhigh, and max the plan picks Opus for a slice by the
   existing criteria. Sonnet is never chosen at the plan; it is the fallback.
2. `implement` has no resume, so a fix round for a Codex slice is a fresh call given the
   findings and the slice's current diff. Codex calls run one at a time per session, so
   Codex slices run in series; Opus and Sonnet slices may still run in parallel.
3. Codex has no network. The orchestrator installs any dependency the plan adds in
   Step 3.7, after the baseline and before any implementer starts, and runs a slice's
   network checks after the implementer returns.
4. Two budgets and two fallback chains, by role. Reviewer calls keep the Codex budget
   and the Opus and Fable fallbacks. Implementer calls take the smaller of the subagent
   budget and the remaining run budget, capped at 3600 seconds, and fall back to Sonnet
   only.
5. A failed Codex implementer call may have written part of the slice. The retry and the
   Sonnet fallback wait for the previous call's output, a possibly surviving process
   ends the run in `blocked`, and on Windows a `failed` call is not retried.
6. Every tier runs Step 5 with both reviewers, at a `code-review` level that rises with
   the tier. The risk trigger is judged at high tier only. A worktree run is allowed at
   every tier and uses the Opus substitute for the Claude slot. Step 6 and CI repairs go
   through a Step 5 round at every tier.
7. ccl requires codex-lite 0.8.0 or later, and calls its `ask`, `review`, and
   `implement`.

## Planned for 0.2

Preserved from the pre-amendment spec, not normative for 0.1.

Repair mode, `/ccl:pr <n> [--no-codex]`: input is exactly one PR number or URL in the
current repo. The plugin checks out the PR's head branch at its current remote commit,
records the acceptance criteria from the PR body and its linked issues in `inputs.md`
in place of the plan's criteria, runs Step 1 and Steps 5 to 7 against the PR's diff,
pushes fixes to that same branch, and updates the existing PR. It never creates a
branch or a PR. Build and repair inputs do not mix. `done` means fixes pushed and CI
green or not applicable.

`--merge`: after CI is green, merge, watch CI on the resolved default branch and any
deploy the repo's CI defines, then delete the local and remote branch. Off by default.
Deploy wait budget 30 minutes. `done` means PR merged, default-branch CI green or not
applicable, branch deleted. Deleting a branch the plugin did not create always asks.

`--worktree`: run the whole loop in a new worktree from the base commit instead of a
branch in the current checkout. The narrow worktree use in Step 0.3 for a clean tree
with skip-worktree edits is not this feature.
