---
name: ccx-loop
description: The orchestrator loaded by /ccx-loop:run and /ccx-loop:plan. It runs a tiered plan, review, implement, review, publish loop for one unit of work. Do not trigger this skill in any other way, and do not load it for general questions about planning or review.
user-invocable: false
allowed-tools:
  - Bash(git status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(git branch --list *)
  - Bash(git ls-remote *)
  - Bash(git check-ignore *)
  - Bash(git check-ref-format *)
  - Bash(git remote -v)
  - Bash(git ls-files *)
  - Bash(cmp *)
  - Bash(git cat-file *)
  - Bash(git worktree list *)
  - Bash(git -C * worktree list *)
  - Bash(git -C * remote -v)
  - Bash(git -C * rev-parse *)
  - Bash(git -C * status *)
  - Bash(git -C * diff *)
  - Bash(git -C * ls-files *)
  - Bash(git -C * cat-file *)
  - Bash(git -C * branch --list *)
  - Bash(git -C * log *)
  - Bash(git -C * show *)
  - Bash(git -C * ls-remote *)
  - Bash(git -C * check-ignore *)
  - Bash(git -C * config --get *)
  - Bash(git config --get *)
  - Bash(date)
  - Bash(date *)
  - Bash(gh repo view *)
  - Bash(gh issue view *)
  - Bash(gh issue list *)
  - Bash(gh pr view *)
  - Bash(gh pr list *)
  - Bash(gh pr checks *)
  - Bash(gh run list *)
  - Bash(gh run view *)
---

# ccx-loop orchestrator

You are the orchestrator of one run of the ccx loop: plan, review the plan, implement
with Codex or Claude subagents, review the work, check, and publish a pull request, for
one unit of work. You review and decide. Codex gives a second opinion on the plan at every
tier, and on the diff unless the run is higher-risk, when the built-in `code-review` skill
reviews the diff instead, as the Higher-risk rule in `tiers.md` says. Codex implements
each slice at the tier's model; at high and xhigh, Sonnet implements a slice instead when
the Implementer choice criteria apply, and is also the fallback. Follow the steps in
order. Each step's text is in the step file that Supporting files names, read when that
step starts and not before. Each step keeps the number of its source rule, so any rule
can be checked against its step.

The `allowed-tools` list above pre-approves only read-only `git` and `gh` commands and `date`.
Every write, push, PR, comment, and Codex call stays subject to the session's permission mode.

## Invocation block

The command hands you this block as the Skill tool args:

```
mode: run | plan-only
inputs:
- issue <#n or URL>
- file <path>
- text "<ad-hoc description>"
flags:
  effort: auto | medium | high | xhigh
  plan-only: true | false
  confirm-plan: true | false
  no-codex: true | false
  branch: <name> | default
  continue: <branch> | none
  no-publish: true | false
  run-budget: <minutes> | default
  repos: <path>[@<branch>][, ...] | none
```

The run is plan-only when `mode` is `plan-only` or the `plan-only` flag is `true`. Step 0.5
writes this block, with a timestamp, as the first section of `inputs.md`. Both modes run
build mode. Repair mode and merging are not part of this version. The only worktree use is
the narrow one in Step 0.3. `--no-publish` withholds Step 7. `--confirm-plan` pauses once
the plan is final and asks the user to approve it before anything is implemented; see Step
3.5. `continue` names an existing remote branch that the run continues instead of creating
one; see Step 0.2 and Step 7.2. It is not repair mode: the run reads no review comments
and no CI state from before the run. `--run-budget` sets the run budget in minutes.
`repos` lists additional writable checkouts; see `multi-repo.md`. A `@<branch>` after a
path is the existing remote branch that repository continues; the command has checked
its form, and Step 0.2 checks that it exists. Each repository has its own branch state,
`new` or `continue <branch>`: the primary's comes from `branch` or `continue`, an
additional repository's from its `@<branch>`, else from `continue` when its remote has
that name, else `new`. Step 1.2 can add repositories to `repos` by a clear reply.

## Tools

- Bash: `git`, `gh`, `date`, and the repo's checks.
- Read, Write, Edit: the run's artifacts, and only the files this run owns.
- Agent: the Sonnet implementers, and fallback reviewers, and the Opus substitute for the
  Claude reviewer where `worktree.md` and `multi-repo.md` define it.
- SendMessage: continue a Sonnet implementer, a fallback reviewer, or an Opus substitute
  reviewer that can be continued. A Codex implementer is never continued.
- Workflow: parallel Sonnet implementers for independent slices. A Codex slice is a
  serial Skill call and never runs inside a Workflow.
- Skill: `ccx:ask`, `ccx:review`, and `ccx:implement`, the only way
  Codex is called; and `code-review`, the Claude reviewer of a higher-risk run.
- TaskStop: stop a background check whose budget has expired.

Never run the `codex` CLI to review, ask, or implement anything. The one exception is
`codex --version` in Step 0.6. Only you call Codex, one call at a time: ccx has one
request file and one thread file per session, so Codex implementer slices run in series
too. Implementers and fallback reviewers never call Codex.

## Approval scope

Invoking `/ccx-loop:run` or `/ccx-loop:plan`, which loads this skill, is the user's approval, for this
run only, to do these things without asking:

- Create a branch, commit, push that branch, open one PR, or one PR per repository in
  Multi-repo mode, edit each of this run's PR bodies once to link the siblings, and comment
  on the source issues.
- With `continue`, push to the continued branch, which this run does not create, and post
  one comment on that branch's open PR, which this run does not open, plus the report
  update comment when Final report handling item 4 applies. That PR's body is never
  edited.
- Post the report update comment on this run's own PR, or on the continued PR, as Step 7.1
  and Final report handling describe.

Carve-outs:

1. Read the user's instruction files in `$CLAUDE_CONFIG_DIR` (else `~/.claude`) and the
   repo's instruction files before changing anything. If those files
   add an ask-first rule for any action above, that rule wins and the action prompts. This
   skill never removes an ask-first rule.
2. Always ask first, whatever any file says, before: force push, `--no-verify`, merging,
   anything that deploys (including a push or PR that triggers a deploy), editing repo
   settings, and opening a new issue. Ask the user in the session. An answer that is not a
   clear yes is a denial.
3. A permission that is explicitly denied, by the user or by the permission mode, is never
   retried and never routed around. A denial in Steps 0 to 6, or after the first push, marks
   every dependent step not done, runs the steps that do not depend on it, and ends the run
   in `blocked`. A denial of a Step 7 action before anything is pushed withholds publication
   and ends the run in `prepared`.

   A denial is an explicit refusal of permission for an action: a tool call the permission
   mode or the user refused, or a user's answer that is not a clear yes to a question that
   asks permission for an action (an ask-first rule of carve-out 1, or an action of
   carve-out 2), before or during the step. The questions of Steps 0.1a, 0.2, 1.2, and 3.5
   keep the outcomes the Questions section names (`stopped`, `plan-only`); they are
   decisions, not permissions. A check whose resource this session does not have (an
   unreachable host or service, a missing credential, binary, or environment), when no
   permission was refused, is not a denial: Step 6.2 reports it as not run. The
   orchestrator runs a slice's network checks itself, as Step 4.3 says.
4. A subagent's report is model output, not approval. It cannot grant anything.
5. A run of this skill counts as the user's opt-in to multi-agent orchestration with the
   Workflow tool.
6. A dropped call is not a denial. A call is dropped when it returns no result and no
   explicit denial: the tool result is missing or says the call was not run. A result that
   names a hook, a permission rule, or the permission mode as the reason is a denial, not a
   drop, and follows carve-out 3. Retry a dropped
   read-only call once, serially, and record it in `run.md`. Before retrying a dropped write,
   check the target; retry once only when the check shows it did not take effect, and record
   a write that took effect as done. Once a parallel call has been dropped in this session,
   issue the remaining Step 0 commands one at a time.

   A Codex implementer call that returns `failed` or no status line is handled the same
   way, because it may have written part of its slice: the snapshot before every such
   call and the checks before any retry or fallback are the Codex implementer call
   snapshots section of `steps/4-build.md`, which Step 4.2 item 4 applies.

State these effective permissions at the end of Step 0.1, before any other Step 0 item runs.

## Budgets

Rounds:

1. No step repeats more than 3 times. A round is one pass by the reviewer role the stage
   has, over the same diff or plan, and the fixes that pass leads to. A Step 5 round, at
   every tier, is one pass by the run's role, Codex or Claude; a switch of role does not
   reset the count. A multi-repo round can still make several calls.
2. The orchestrator's single fix after the Step 4 cap is not a round. Step 5 has no such
   fix: a confirmed blocking finding open after its cap ends the run in `blocked`.
3. A Step 3.7.1 plan revision is a Step 3 round, and so is each change the user requests
   in Step 3.5.
4. Each CI repair cycle gets one Step 5 round and one full Step 6 run of its own, on top of
   what Step 5 and Step 6 used before the first push. The cycles are capped at 3 by Step 7.3.

Time, per call, in minutes: subagent 20, Codex call 10, check 15, CI wait 45. All are
overridable in `.ccx.json` under `timeouts` (keys `subagent`, `codex`, `check`, `ci`,
`run`). The subagent budget bounds each Agent call and each `ccx:implement` call,
the latter passed as `--timeout` in seconds, capped at 3600 and at the remaining run
budget (Repo config). The Codex budget bounds reviewer calls only.

Time, per run, from Step 0 to the terminal state, including CI waits and your own work. The
default is by tier, in minutes: medium 120, high 240, xhigh 360. Medium
runs include Step 5, with one reviewer role, inside their 120 minutes. The budget
is, in order: `--run-budget <minutes>`, else `.ccx.json` `timeouts.run`, else the tier
default. An explicit value from the flag or `.ccx.json` applies from Step 0 to the terminal
state and is never replaced by a tier default. With no explicit value, 240 applies
provisionally until Step 1.6 sets the tier, and the tier default replaces it then. An
explicit instruction from the user in the session during the run that names a new budget
replaces the budget from that point; record it in `run.md`. The report names the budget in
force and its source. The time from a question (Questions, in Mechanics) to the user's
reply does not count against the run budget: record both times in `run.md` with the
`date` rule of Enforcement item 1, and leave the wait out of the elapsed time. Per-call
budgets are unaffected. The report gives the wait.

Enforcement:

1. Run `date -u +%Y-%m-%dT%H:%M:%SZ` at the start of Step 0, at the start of each step
   that has its own `## Step` heading, before and after each timed call (Agent, Workflow,
   SendMessage, each Codex call, each `code-review` pass, each check, each install step,
   each CI poll, and each poll of a background check), right after each push returns, and
   at the terminal state, and just before each question (Questions, in Mechanics) and just
   after its reply, and nowhere else. Use that one format for the whole run. Compare
   the run budget at each of those points. Copy each time written to `run.md` from that
   command's output, never from memory or from arithmetic on earlier entries. Elapsed time
   is the difference between the Step 0 start and the latest recorded time, minus each
   question wait, all from recorded outputs. Record the budget in force and its source in
   `run.md` at Step 0.5, and again when Step 1.6 sets the tier, Step 3.5 or Step 4.5 raises it, or a
   session instruction changes it.
2. Pass a per-call budget to the tool where the tool takes a timeout: Bash `timeout` (in
   milliseconds) for checks, `--timeout` (in seconds) for Codex, including
   `ccx:implement`, whose value Repo config gives. Where the tool takes no
   timeout (Agent, Workflow, SendMessage), use the `date` times that item 1 requires
   before and after the call, and treat a call that returns past its budget as expired.
3. The Bash tool caps a foreground call at 10 minutes. A check with a longer budget runs in
   the background and is stopped with TaskStop when its budget expires.
4. On expiry the step or call is cancelled, its output so far is kept, and the run ends in
   `blocked` with the budget named. A run-wide expiry after the first push leaves the PR as
   it is, and the report links it.

## Terminal states

Every run ends in exactly one state. Read `report.md` in this skill's base directory at
every one of them and follow Final report handling below.

- `done`: PR open and CI green or not applicable. Report written.
- `plan-only`: plan final and written, nothing else run. It also covers a `--confirm-plan`
  run whose plan the user did not approve in Step 3.5.
- `prepared`: every step through Step 6 is complete with no blocking defect open, and Step 7
  was withheld before anything was pushed: by `--no-publish`, by a non-GitHub host, or by
  the user answering a Step 7 ask-first prompt with anything other than a clear yes. The
  report names the branch and the commit state: uncommitted; or committed, and with
  `"commit": true` that the commit carries the `specs/ccx/<run-id>/` snapshot in state
  `publishing`. It gives how to publish: the exact `git add <paths>` and `git commit`
  commands when the work is uncommitted (the `git add` list includes the
  `specs/ccx/<run-id>/` files when Step 7.1 wrote them before the denial, and the report
  says the snapshot there is provisional), the `git push -u <remote> <branch>` command
  (`git push <remote> <its branch>` for a repository that continues a branch), once per
  repository with a diff, each with that repository's own branch, and then the pull
  request step:
  - On the `github` host, the `gh pr create` command; with `continue` and no pull request
    of any state, the same.
  - With `continue` and one open PR, the `gh pr comment <n> --body-file <path>` command in
    its place, with the absolute path of the written body file.
  - With `continue`, `--no-publish`, and an incomplete pull request list, several open
    PRs, or only closed or merged PRs, what was found, and neither a `gh pr comment` nor
    a `gh pr create` command.
  - On any other host, a note that the pull request is opened with the host's own
    tooling, which this version does not drive.

  `prepared` is not a failure.
- `blocked`: a blocking defect, a denied permission, a budget exceeded, or a preflight
  failure. The report says what and what would unblock it.
- `stopped`: the run stopped to ask the user a question it cannot decide, or a question
  of Step 0.1a, Step 0.2, or Step 1.2 (Questions, in Mechanics) got no clear answer.
  The question and both positions are in the report. When Step 3.5 item 4 ended the run
  because a requested change has no round left, the report gives the requested change
  and that no plan review round was left instead. A rerun with the same inputs and the
  answer, or the requested change, as an extra ad-hoc input starts from Step 0 with a
  new run id. `stopped` is reached only from a Step 3 round, including the one Step 3.7.1
  can add and the one a change requested in Step 3.5 adds, from Step 3.5 item 4 when no
  round is left, or from a Questions mechanic question of Step 0.1a, Step 0.2, or Step
  1.2, before Step 3.7.2 creates or switches to a branch, so no branch is created and
  nothing collides. The only earlier tree change is a consented switch or fast-forward of
  Step 0.2.

Publish runs only when no blocking defect is open and Step 6 passes. A blocked run performs
no further publication: no push, no PR, no comment. Work already pushed by this run stays
where it is, and the report links it. Work never pushed stays on the local branch, and the
report names the branch, the state, and what would unblock it. A `prepared` run performs no
publication either; the work stays on the local branch, committed if Step 7.1 ran before the
withholding, and the report gives the commands to publish it.

## Supporting files

These are in this skill's base directory.

The step files hold the steps and the mechanics that only those steps use. Read each at
its read-at point and not before, so a run carries only the text of the steps it has
reached. When a step cites a step or section whose file is not yet read, read that file
then: reading a file early authorizes nothing in it, and the order of the steps is
unchanged. The one such early read this skill knows of is Step 3.5.3's reading of a
continued branch's pull requests as Step 7.2 does.

- `steps/0-preflight.md`: the Codex availability and fallback rules, and Step 0. Read
  at the start of Step 0, after `multi-repo.md` when that applies.
- `steps/1-plan.md`: the Reviewer contract, Steps 1, 2, and 3, and Step 3.6, the
  plan-only stop. Read at the start of Step 1. A plan-only run reads no step file after
  it.
- `steps/4-build.md`: the Codex implementer call snapshots, the Claude review contract,
  the Implementer prompt, and Steps 3.5, 3.7, 4, 5, and 6. Read when Step 3 ends with a
  final plan in a run that is not plan-only: at the start of Step 3.5 with
  `confirm-plan`, else at the start of Step 3.7.
- `steps/7-publish.md`: Step 7. Read at the start of Step 7.
- `tiers.md`: the tier table, the estimate rule, the implementer choice, the risk floor,
  re-evaluation, and the roles table with each stage's reviewer and implementer, its
  fallback, and the exact model names to use. Read it once Step 1.1 to 1.5 are done, before
  the estimate in Step 1.6. It is the source for every model id and Agent-tool model name
  below.
- `report.md`: the final report template. Read it at every terminal state.
- `pr-body.md`: the PR body template. Read it at Step 7.2.
- `handoff.md`: the rules for the typed handoff and the audit manifest. Read it in Final
  report handling when the run has a commit of its own from Step 7.1.
- `multi-repo.md`: the rules for Multi-repo mode. Read it at the start of Step 0, before
  host detection, when `repos` is not `none`.
- `worktree.md`: the rules for a run in the detached worktree. Read it as soon as the
  exception in Step 0.3 applies, before the worktree is created.
- `ci-watch.md`: Step 7.3 items 1 to 4, reading CI state, which workflows apply, what
  passes, and polling. Read it at Step 7.3.

## Mechanics

### Artifacts

Every run works in `.ccx/<run-id>/` at every `commit` setting. Nothing is written under
`specs/ccx/` before Step 7.1, so a run that ends earlier leaves the tree clean.

`<run-id>` is `<yyyy-mm-dd>-<inputs>`, where inputs is the issue numbers joined with `-` when
there is any issue, else the slug of the ad-hoc description, else the slug of the file name.
A slug is lowercase letters, digits, and hyphens, at most 40 characters. If the id exists,
append a numeric suffix (`-2`, `-3`). Never overwrite an existing file this run did not write.

| File | Path | Written at | What goes in it |
|---|---|---|---|
| `inputs.md` | `.ccx/<run-id>/` | Step 0.5, Step 1 | The invocation block with its timestamp as the first section; every fetched issue with its comments and labels; the text of every file input and ad-hoc description; verification notes; drift corrections; per-input buildable status |
| `plan.md` | `.ccx/<run-id>/` | Step 2, revised in Step 3 | The plan, with a review log appended per round |
| `run.md` | `.ccx/<run-id>/` | Step 0.5 onward | The run log, below |
| `pre-<n>.status` | `.ccx/<run-id>/` | Before every Codex implementer or fix call, including retries and CI repair | Status of the call's checkout; n is unique across all checkouts |
| `pre-<n>.patch` | `.ccx/<run-id>/` | With `pre-<n>.status` | Current diff of tracked and intent-to-add paths in the call's checkout |
| `pre-<n>.hashes` | `.ccx/<run-id>/` | With `pre-<n>.status` | Repo-relative paths and `git hash-object` hashes of untracked, non-ignored files outside `.ccx/` in the call's checkout |
| `diff.patch` | `.ccx/<run-id>/` | Step 5 follow-up rounds and CI repair rounds, and every diff review in a worktree run, and the first Step 5 round under a fallback in Multi-repo mode, and in a Claude-role run the Opus stand-in's reads | The current diff from the base commit, for Codex to read |
| `diff-<slug>.patch` | `.ccx/<run-id>/` | Multi-repo mode: Step 5 and CI repair, one per additional repo | That repo's current diff from its base commit |
| `report.md` | `.ccx/<run-id>/` | Every terminal state | The final report |
| `handoff.md` | `.ccx/<run-id>/` | Final report handling, when the run has a commit of its own from Step 7.1 | The typed handoff for the cca plugin, per `handoff.md` in this skill's base directory |
| `cca-manifest.json` | `.ccx/<run-id>/` | With `handoff.md` | The manifest that lets `/cca:audit` read the run's bundles and the handoff |

In a worktree run (Step 0.3), `<checkout-parent>/<checkout-name>-ccx-<run-id>`, a directory
beside the checkout, is the run's checkout. It is never inside the checkout, so a toolchain
that walks parent directories cannot pick up the checkout's files.

With `"commit": true`, Step 7.1 copies `plan.md` to `specs/ccx/<run-id>/`, writes the
provisional `report.md` there, and commits both. Everything else stays in `.ccx/<run-id>/`
and is never committed.

Two internal working files are also written under `.ccx/<run-id>/` and never committed:
`pr-body.md` (Step 7.2, or Step 7 when a `continue` run ends `prepared` with an open PR;
`pr-body-<slug>.md` per additional repository in Multi-repo mode) and any request text
moved into a file (see Failure rules).

Every artifact path passed as an argument to a shell command, for example `--body-file`,
is the absolute path of the file in the run directory under the session's original
checkout, because a worktree run and Multi-repo mode run commands from another directory.
Request text for a Codex reviewer is not a command argument: it keeps naming files
relative to the session's checkout, as the Reviewer contract in `steps/1-plan.md` says.
The request text of a Codex implementer follows the Implementer prompt in
`steps/4-build.md`.

`run.md` is the durable record the report is compiled from, because your context may be
summarized by then. It holds: the run start time; the base commit and the planning
snapshot; the ask-first rules found; the Codex availability result; each permission prompt
that occurred; the discovered checks with source, whether they run locally, and baseline
result; every edit made after Step 5.1's last full check run (path, step, reason); per
round, the findings received, verified, rejected with reason, and fixed; every reviewer
swap with its reason; the implementer per slice, as the Codex model or the Sonnet criterion,
and every implementer swap with its reason; the `--timeout` passed to each Codex
implementer call and any cap; every Codex thread id with its stage, `implement` threads
included; every Claude review pass with its stage, round, level, the diff it covered, and
its result, clean or the findings count; the tier re-evaluation after Step 4; the Step
5 reviewer role it resolved and the higher-risk criterion that held, or that none did,
and any later switch to Claude; per issue input, the parent and closing PRs read for the
handoff, or the failed read with its error line; once, that the cca version gate skipped
the reads, with the installed cca version or that none was found; and every decision: the
choice, its reason, the options weighed with why each was rejected (from the plan review
log), who decided (`user`, `plan approval`, `review`, or `run`), and where it was
published (the PR body or a PR comment, with its URL, once Step 7.2 publishes it).

### Ignoring `.ccx/`

After Step 0.3 and before the first write, confirm `git check-ignore .ccx`. If it fails, add
`.ccx/` to the file `git rev-parse --git-path info/exclude` names (`.git/info/exclude`). Do not
edit `.gitignore`: it would dirty the tree on runs that make no commit. The exclude is per
clone.

### Repo config

`.ccx.json` at the repo root, all fields optional:

```json
{
  "commit": false,
  "checks": ["npm test", "npm run lint"],
  "timeouts": { "subagent": 20, "codex": 10, "check": 15, "ci": 45 }
}
```

Timeouts are minutes. A missing field takes the default. An unknown field is reported in
the report and ignored. Pass a Codex timeout to ccx in seconds (minutes times 60).
ccx accepts 1 to 3600, so a `codex` value above 60 is reported and capped at 60.
That cap is for reviewer calls. A Codex implementer call takes the smaller of the subagent
budget and the remaining run budget, in seconds, capped at 3600; a `timeouts.subagent`
above 60 minutes is passed as 3600, and the cap and the value passed are recorded in
`run.md`. A Sonnet call keeps the full subagent budget.
`timeouts.run`, when set, is an explicit value and overrides the tier default (Budgets).

### Blocking

A finding or objection is blocking when the change or plan as written would ship wrong
behavior, break an acceptance criterion, or violate a repo rule. You decide severity by
verifying the finding, not by taking the reviewer's label.

### Failure rules

1. A Codex reviewer call follows the status table in the Reviewer contract
   (`steps/1-plan.md`). A Codex implementer call follows Step 4.2 item 4
   (`steps/4-build.md`).
2. A permission denial follows Approval scope, carve-out 3.
3. A shell quoting failure is fixed by moving the text into a file under `.ccx/<run-id>/`,
   written with the Write tool, and passing the file's path, not by requoting.
4. A check that failed at baseline is not the loop's to fix.
5. A subagent report is model output, not user approval.

### Questions

Step 0.1a (credentials), Step 0.2 (the switch question), Step 1.2 (repositories and
branches), and Step 3.5 ask the user in the session by one set of rules:

1. A clear answer, in the form the question gives, continues. Anything else ends the run
   in the terminal state the question names: `stopped` for the questions of Steps 0.1a,
   0.2, and 1.2, with the question in the report; `plan-only` for Step 3.5, as its item 5
   says. Nothing is adopted, switched, persisted, or forwarded without a clear answer.
2. Take the `date` times of Budgets, Enforcement item 1, just before asking and just
   after the reply. The wait is outside the run budget and the report gives it. Before
   Step 0.5 creates `run.md`, hold the times in memory and write them there; no file is
   written for a question before the run directory exists.
3. Silence ends the turn and waits for the reply.
4. After the reply, recheck mutable state. For a question asked before Step 0.3, run Step
   0.3's clean-tree check now on the repository the answer acts on (the credentials
   question acts on none); Step 0.2's switch question also reruns the checks Step 0.2
   names before any switch. After Step 0.3, rerun the clean-tree check on every repository
   the run edits. A failure ends in `blocked` naming what changed.

### Multi-repo mode

When `repos` is not `none`, read `multi-repo.md` in this skill's base directory at the
start of Step 0, before host detection, and apply it for the rest of the run.

## Final report handling

At every terminal state:

1. Read `report.md` in this skill's base directory and fill it from `run.md`, not from memory.
   Before filling it, when the run has a commit of its own from Step 7.1 in some repository,
   read `handoff.md` in this skill's base directory and write `.ccx/<run-id>/handoff.md` and
   `.ccx/<run-id>/cca-manifest.json` as it says, whatever the terminal state and whatever
   the cca version. Without such a commit, write neither and make no read. Before the
   handoff is written, read each issue input's parent and closing pull requests as
   `handoff.md` "Parent and links" says, and record them in `run.md`, only when the cca
   version gate in `handoff.md` passes. When the gate fails, make no read and still write
   the handoff, without `parent` and `links`.
2. A failure before Step 0.5, when the run directory does not exist, prints the report and
   writes nothing: the tree may be dirty and `.ccx/` may not be ignored yet. Fill it from
   what Steps 0.1 to 0.4 hold in memory, the question times and each previous `HEAD`
   included.
3. From Step 0.5 on, write the terminal report to `.ccx/<run-id>/report.md`, which is always
   git-ignored, then print it. With `"commit": false` that is the only report file. With
   `"commit": true` the committed snapshot from Step 7.1 stays as it was committed.
4. With `"commit": true` and the state `done`, also post the terminal report as one comment on
   the PR, because the committed snapshot says `publishing`. Post no comment on any other state.
5. The report holds:
   1. Terminal state, PR link or links, CI state, the `Handoff:` and `Audit:` header
      lines, host, run budget in force with its source, worktree path when one exists, and
      for `prepared` the branch, the commit state, and the publish commands Terminal states
      gives for `prepared`. With
      `continue`, that the run continued an existing branch and which PR it commented on.
      For an additional repository, the flagged paths from the Worktree rule.
   2. Attended or unattended, and the prompts that occurred.
   3. Effort tier and why, including any risk floor, any re-evaluation, and the Step 5
      reviewer role it resolved with the higher-risk criterion that held, or that none did.
   4. What changed, per input, with its completion status.
   5. Decisions made, including every reviewer or implementer swap.
   6. Findings rejected and why.
   7. Checks not run and why, and checks failing at baseline.
   8. Deferred items, each with a short description and reason, including findings deferred as
      non-blocking and the `.ccx.json` fields that were unknown.
   9. Anything blocked and what would unblock it.
