# Architecture

Pre-implementation design for the `ccl` plugin, drafted 2026-09-28 from `SPEC.md` and
updated the same day for the spec's amendments, then on 2026-09-29 for the five-tier
matrix, the removal of the Step 4.4 round review, and the second final reviewer, and on
2026-09-30 for Codex implementers and the final review at every tier. The
spec says what the loop must do. This document says how the pieces fit, pins down the
mechanics the spec leaves open, and records the decisions that need approval before any
plugin file is written. Where this document and the spec disagree, the spec wins until
the spec is amended.

## Shape

The plugin is prompt-only. It contains no hooks, no scripts, and no code that runs
outside a Claude Code session. Everything the loop does is done by the orchestrating
Claude model following `skills/ccl/SKILL.md`, using the tools Claude Code already has:
Bash for `git` and `gh`, Read and Write for artifacts, the codex-lite commands for
Codex implementing and reviewing, Agent and Workflow for Opus and Sonnet implementers,
and the built-in `code-review` skill as the second final reviewer at every tier.

```
user
  │  /ccl:run | /ccl:plan
  ▼
commands/*.md            thin: normalize args, set mode and flags, load the skill
  │
  ▼
skills/ccl/SKILL.md      the orchestrator: Step 0 to Step 7, one section each
  ├── tiers.md           tier table, estimate rule, risk floor
  ├── report.md          final report template
  └── pr-body.md         PR body template
  │
  ├──► Bash: git, gh                  branch, fetch, checks, PR, CI watch, comments
  ├──► Read, Write                    <artifacts>/<run-id>/{inputs,plan,run,report}.md
  ├──► /codex-lite:implement          implementer, one per slice, in series; the default
  ├──► Agent (Opus, or Sonnet)        implementer for a slice that meets the Opus criteria
  │                                   at high and above; Sonnet only as the fallback
  ├──► Workflow, or parallel Agents   parallel Opus or Sonnet slices, never Codex slices
  ├──► /codex-lite:ask                plan review, Step 3, every tier
  ├──► /codex-lite:review --base ..   final review, Step 5, every tier
  └──► /code-review <level> <base>    final review beside Codex, Step 5, every tier
```

There is one skill and two entry points. The commands differ only in what they set
before the skill runs: `plan` sets `--plan-only`. The skill never asks which command
invoked it; it reads the flags the command stated in the handoff. Repair mode and the
`/ccl:pr` command are deferred to 0.2.

## Components

### Commands

Each command file is a thin forwarder in the style of the codex-lite command files: it
does not interpret the request, it records what the user typed and hands off. The
frontmatter carries the description Claude uses for triggering, an `argument-hint`, and
an `allowed-tools` list scoped to what the skill actually runs (see Permissions below).

The body of each command does three things:

1. Validate the shape of the input with the spec's token rules. A PR reference is
   rejected, including a `#n` that `gh` reports as a pull request. A cross-repo issue
   is rejected here, before setup, by comparing the issue's repo to `gh repo view`,
   unless it belongs to a listed `--repo` checkout in Multi-repo mode, where a bare `#n`
   always names the primary's issue. When `gh repo view` fails, the command runs `git
   remote -v`: on a non-GitHub host it rejects issue inputs only and accepts file and
   text inputs. When it fails and the URL host is `github.com`, it rejects the request as
   unauthenticated.
2. State the parsed invocation in the handoff: inputs as given and every flag with its
   effective value.
3. Hand off to `skills/ccl/SKILL.md` and start at Step 0.

The command writes no file. Before Step 0.3 the tree must stay clean and `.ccl/` may
not be ignored yet, so any file written there would fail the run's own clean tree
check. Step 0.5 writes the parsed invocation, with the timestamp, as the first section
of `inputs.md` in the run directory. From then on it is the durable record of what the
run was asked to do.

How a command body hands off to a skill is not yet verified. The two candidates are
the Skill tool, invoked from the command body with the skill's name, and a plain
instruction to read `SKILL.md` and follow it. The Skill tool is the default assumption
because it loads the skill's own frontmatter and allowed tools; the M0 check in the
build plan confirms which one works.

### Skill

`SKILL.md` is the orchestrator. It is written as a procedure the model follows in
order, with one section per spec step and the same numbering as the spec, so a reader
can check any rule against its source. It opens with a preamble that:

- Names the tools the skill will use and the actions it will take without asking, so the
  invocation is the user's approval for those actions (spec, Approval scope).
- Restates the round and time budgets and the five terminal states.
- Tells the orchestrator to read `tiers.md` after Step 1 and `report.md` and
  `pr-body.md` at Step 7.

The three supporting files are kept separate so the tier table and the two templates
can be edited without touching the procedure, and so the procedure stays short enough
to be followed as a whole.

### Artifacts

Every run owns one directory, `<artifacts>/<run-id>/`, holding:

| File | Written at | Purpose |
|---|---|---|
| `inputs.md` | Step 0.5, Step 1.4 | The invocation (inputs, flags, timestamp), fetched issues, verification notes, drift corrections, buildable status |
| `plan.md` | Step 2, revised in Step 3 | The plan, with a review log appended per round |
| `run.md` | Step 0.5 onward, starting with Step 0.2 to 0.4's records | The run log: base commit and planning snapshot, discovered checks and their baseline results from Step 3.7, every edit the orchestrator makes after Step 5.1, then per round the findings received, verified, rejected with reason, and fixed, every reviewer swap, every thread id, and the tier re-evaluation after Step 4 |
| `diff.patch` | Step 5 follow-up rounds, CI repair rounds, and every diff review in a worktree run | The current diff from the base commit, for Codex to read |
| `diff-<slug>.patch` | Step 5 and CI repair, one per additional repository in Multi-repo mode | That repository's diff from its base commit, for Codex or the Claude subagent to read |
| `report.md` | every terminal state | The final report |

`run.md` and `diff.patch` are additions to the spec's file list. `run.md` exists so
that the report in Step 7 is compiled from a durable record rather than from the
orchestrator's context, which may have been summarized by then. `diff.patch` exists
because Codex cannot be handed a diff any other way in a resumed thread, and is
created only when a follow-up round, a CI repair round, or a worktree run's diff review
needs it. Both are internal and never committed. In a worktree run, a detached worktree beside
the checkout (`<checkout-parent>/<checkout-name>-ccl-<run-id>`, never inside it, so
parent-directory lookups cannot reach the checkout's files) is the run's checkout, and every artifact is still written under the original
checkout's `.ccl/<run-id>/`.

Every artifact is written under `.ccl/<run-id>/`. With `"commit": true`, Step 7.1
copies `plan.md` and the provisional `report.md` to `specs/ccl/<run-id>/` and commits
them; nothing is written there earlier, so `plan-only`, `stopped`, and a `blocked` run
before Step 7.1 leave the tree clean. Two consequences:

- `.ccl/` is always git-ignored. Between the clean tree check in Step 0.3 and the
  first artifact write in Step 0.5, Step 0 confirms `git check-ignore .ccl` and, if
  it fails, adds
  `.ccl/` to `.git/info/exclude` rather than to `.gitignore`. The exclude file
  satisfies codex-lite's ignored-directory requirement, needs no commit, and never
  dirties the tree. That matters on the paths that make no commit: `plan-only` and
  `stopped` would otherwise leave an uncommitted `.gitignore` edit that fails the next
  run's Step 0.3. The cost is that the ignore is per clone. A repo that wants it in
  `.gitignore` adds the line itself.
- Codex reads files only from a directory the repository already ignores (codex-lite
  requirement), so every file sent to Codex is under `.ccl/`, including the plan at
  every setting of `commit`.

### Repo config

`.ccl.json` at the repo root, all fields optional:

```json
{
  "commit": false,
  "checks": ["npm test", "npm run lint"],
  "timeouts": {
    "subagent": 20, "codex": 10, "check": 15, "ci": 45, "run": 240
  }
}
```

Timeouts are minutes. A missing field takes the spec's default. The `run` default is by
tier: 120 at low and medium, which now includes Step 5, 240 at high, 360 at xhigh and max.
The precedence is `--run-budget`, else `timeouts.run`, else the tier default. An explicit
value applies from Step 0 and is never replaced by a tier default; with none, 240 applies
until Step 1.5 sets the tier. An explicit instruction in the session replaces it from that
point. The report names the budget in force and its source. An unknown field is reported
and ignored. A malformed file ends the run in `blocked` at Step 0.1, with the report
printed only, since no run directory exists yet. The `codex` timeout is passed to
codex-lite in seconds, which accepts 1 to 3600, so a value above 60 minutes is reported
and capped at 60. That cap is for reviewer calls. A Codex implementer call takes the
smaller of the `subagent` timeout and the remaining run budget, in seconds and capped at
3600, so a `subagent` value above 60 minutes is passed as 3600; the cap and the value
passed are logged in `run.md`.

## Reviewer interface

All Codex calls go through the codex-lite commands, version 0.8.0 or later: `ask` and
`review` for reviewing, `implement` for implementing (see Implementer interface). Their
contracts constrain the design, and the spec's Reviewer contract section records the
resulting rules. Every reviewer call carries `--timeout <seconds>` from the `codex`
budget, 600 by default.

| Stage | Command | What Codex can see |
|---|---|---|
| Step 3 plan review, round 1 | `/codex-lite:ask --model <id> --timeout <s> <request>` | The request text and any file under `.ccl/` named in it |
| Step 3 follow-up rounds | `/codex-lite:ask --resume <thread id> --model <id> --timeout <s> <request>` | The earlier thread plus the new request |
| Step 5 final review, round 1 | `/codex-lite:review --base <base-commit> --model <id> --timeout <s>`; in a worktree run, or for an additional repository, `/codex-lite:ask` naming a patch file | The same diff, after integration |
| Step 5 follow-up rounds | `/codex-lite:ask --resume <thread id> --model <id> --timeout <s> <request>` naming `.ccl/<run-id>/diff.patch` | The earlier thread plus the new diff file |

These facts about codex-lite 0.7.0, read from its source and changelog on 2026-09-28,
shape the table:

- `review --base <ref>` reviews the net difference from the merge base of the ref and
  `HEAD` to the working tree. That covers uncommitted work before Step 7.1 and
  committed plus uncommitted work during CI repair cycles. One form serves both.
- `review --base` compares tracked files only. A file an implementer creates is
  untracked and would be missed. Before every Codex review, the orchestrator marks
  each new file the run created with `git add -N <path>`, by name, never a directory
  and never anything under `.ccl/`. Whether Codex reviews a file marked this way, and
  not only the pre-check, is unverified and is an M2 acceptance check.
- `review` accepts only `--base`, `--model`, and `--timeout`. It takes no prose and no
  `--resume`. So the first round of Step 5 uses `review`, and every follow-up round
  writes the current diff to `.ccl/<run-id>/diff.patch` and continues the thread with
  `ask --resume <thread id>`. `review` reads only the session's checkout, so in a
  worktree run every diff review goes through `ask` with `diff.patch`, in a fresh
  thread, and in Multi-repo mode each additional repository goes through `ask` with its
  own patch file. The same applies when a Step 5 finding must be judged
  against an acceptance criterion: the criteria go in the `ask` request.
- Both commands save the thread id per Claude session and print `thread <id>`. Step 3
  and Step 5 are separate threads, so a bare `--resume` in Step 5 would continue the
  plan review thread. The orchestrator
  records the id from each call in `run.md` and passes it with `--resume <id>` on
  every follow-up, together with the same `--model <id>`, which codex-lite 0.7.0
  passes to `codex exec resume`.
- codex-lite supports one call at a time per Claude session, with one request file and
  one thread file. Only the orchestrator calls Codex, one call at a time, and that
  includes `implement`, so Codex slices run in series. Agent implementers and fallback
  reviewers never call Codex.
- Every result ends with a status line, which drives the failure rules below.

The Claude reviewer at every tier is the built-in `code-review` skill, called through
the Skill tool with the tier's level (`low` at low, `medium` at medium, `high` at high
with a trigger and `medium` without one, `high` at xhigh, `xhigh` at max) and the base
range as its target on every pass. The target is not optional: read from the Claude Code
2.1.284 prompt, the skill otherwise diffs `@{upstream}...HEAD`, else `main...HEAD`, else
`HEAD~1`, and the work branch has no upstream before the push while local `main` may sit
behind the fetched base. The skill keeps no thread, so each round's pass is fresh; a
finding it repeats keeps its recorded disposition. A Step 5 round is both passes over the
same unchanged diff, one merged findings list, one fix batch, one shared cap of 3. The
third round fixes nothing, since no round would remain to review the fix. The slot is
fixed: it is not a fallback, nothing replaces it, `--no-codex` does not touch it, and a
missing skill ends the run in `blocked` when the stage starts, never earlier, so a
plan-only run needs no skill and a low or medium run needs it at Step 5. Because the skill
reviews only the session's checkout, a worktree run, at any tier, and each additional
repository in Multi-repo mode use the Opus subagent slot described below.

In Multi-repo mode the Claude slot for the primary is the `code-review` pass; in a
worktree run the slot is the same subagent, for the worktree. For each additional
repository with a diff, the slot is a Claude subagent at Agent model `opus`,
given the repository's `diff-<slug>.patch`, the acceptance criteria, and the findings
shape of the Claude review contract, and told to read and report only. It is a defined
substitute for a checkout the skill cannot target, not a swap. Unlike the `code-review`
pass it is continued, with SendMessage, for Step 5 follow-ups. Under `--no-codex` or
after a swap, the stage's fallback subagent is given every repository's patch file and
continued the same way, including in CI repair.

The orchestrator is the only reviewer that checks the diff against the plan in Step
4, because `review` cannot be told what the plan is and Codex no longer reviews rounds.

codex-lite's status does not name the cause of a failure, so the spec's failure rule
is keyed on status:

| Status | Meaning in codex-lite | Loop action |
|---|---|---|
| `ok` | Run and reporting completed | Use the result |
| `refused` | Stopped before the turn: bad arguments, not a repo, nothing to review | No retry, for a reviewer and for an implementer. The refusal is a loop defect or a missing precondition, recorded as `blocked` with the message |
| `failed`, or no status line | The turn ran and failed, or the output was cut off | Reviewer: retry once with the same arguments, then swap to the fallback. Implementer: see Implementer interface |
| `timeout` | The turn hit `--timeout` | Budget expired: the spec's expiry rule applies and the run ends in `blocked` with the budget named, the Codex budget for a reviewer and the implementer `--timeout` for an implementer |

Every reviewer call has a fixed request shape so the reply is parseable by the
orchestrator:

- Plan review asks for a numbered list, each item marked `blocking` or `non-blocking`,
  with a confidence of `high`, `medium`, or `low`, and a one-line reason. It asks the
  reviewer to end with `NO BLOCKING OBJECTIONS` when that is the case.
- Diff review uses codex-lite's own output. The orchestrator treats each finding as a
  claim to verify, never as an instruction.

Step 0.6 cannot run `/codex-lite:setup`, because only the user can invoke it. The
availability check is therefore that `codex --version` succeeds and the installed
codex-lite version, read with `claude plugin list --json`, is 0.8.0 or later. The
session's skill list is not consulted: which skills a session lists is decided by the
host, not the plugin. A Skill call for `codex-lite:ask`, `codex-lite:review`, or
`codex-lite:implement` that errors because the skill is not listed counts as a `failed`
call: retry once with the same arguments, then swap the stage to the Claude fallback (for
`implement`, under the fallback rules in Implementer interface), record Codex unavailable
for the rest of the run, and record "skill not listed in session". Login and model
problems surface on the first call as `failed` and follow the table above.

Fallback selection happens per stage at the moment the stage starts, using the
availability recorded in Step 0.6 and any failures recorded since. The fallback for a
stage is a Claude subagent given the same request text, the same files, and the same
required reply shape. It runs with the Agent tool at the model the spec names. Every
swap is written to `run.md` with the reason and appears in the report.

## Implementer interface

The implementer for a slice receives the content below as the request text of a
`codex-lite:implement` call for a Codex slice, or as the prompt of an Agent call for an
Opus or Sonnet slice:

1. The slice from `plan.md`: files it owns, the change, the acceptance criteria it
   serves, and the tests it must add or change.
2. The path to the repo's instruction files, with an instruction to read them first.
3. The checks it must pass before it reports, from `run.md`.
4. The rule that it edits only the files in its slice and reports, rather than edits,
   anything it finds outside them.
5. The rule that it does not commit, push, or run `gh`.
6. The rule that every new file matches the repository's line endings, taken from
   `.gitattributes`, else the majority of files in the same directory, else the
   majority of tracked files, and that it never changes the endings of a file it edits.
   Before review the orchestrator checks new files with `git ls-files --eol`.

It reports a list of files changed, checks run with their results, and anything it
could not do. The orchestrator diffs the working tree against the last known state to
confirm the report before reviewing.

One implementer runs per slice, and Codex is the default at every tier: `gpt-6-luna` at
low, `gpt-6.1-sol` at medium and high, `gpt-6-astra` at xhigh and max. At high, xhigh, and
max a slice that meets the Implementer choice criteria (a risk floor trigger, more than
eight files, or a new module, type, interface, or rule section that another file cites)
gets an Opus agent instead. The plan records "codex" or the criterion per slice at every
tier. Sonnet is never chosen at the plan. It is the fallback: under `--no-codex`, when
Codex was unavailable at Step 0.6, when a Codex implementer call returns `failed` or no
status line twice in a row, and when an Opus call errors. The slice's effective model is
recorded in `run.md`.

A Codex slice is one `/codex-lite:implement --model <id> --timeout <s>` call, with
`--cwd <checkout>` as the last option for a worktree run or an additional repository, and
the request text on the next line. The call starts a new thread every time: there is no
`--resume` for `implement`, so a Step 4.3 or Step 5.3 fix round for a Codex slice is a
fresh call given the findings and the slice's current diff. The thread can be questioned
read-only with `ask --resume`, but it is not used to write. Its output has the lines of
`codex-lite:do`, including the status line and the tree footer. In a worktree run, and for
an additional repository, Codex runs in that checkout, so the request names files by
absolute path or carries the content inline; the rule that reviewer requests name files
relative to the session's checkout does not apply to it. A Codex implementer call takes
the smaller of the subagent budget and the remaining run budget, in seconds and capped at
3600, since codex-lite refuses a larger `--timeout`. Opus and Sonnet agents keep the full
subagent budget. A `refused` status ends the run in `blocked`, and a `timeout` status is a
budget expiry.

Codex has no network. The orchestrator installs any dependency the plan adds in Step 3.7,
after the baseline checks of Step 3.7.3 ran on the unchanged base and after the ask-first
rule, before any implementer starts, and the manifest and lockfile edits are part of the
diff that Step 5 reviews. A slice's checks that need the network are run by the
orchestrator after the implementer returns, and a failure goes back to the implementer as
a finding. The implementer choice does not change because of this.

A Codex implementer call that returns `failed` or no status line may have written part of
the slice. Before the retry or the Sonnet fallback, the previous call must have returned
its output, in the foreground or as a background completion notification, because
codex-lite ends the Codex process when its turn ends or the Bash call times out. A call
whose output never arrives is a budget expiry: the run ends in `blocked` and no other
writer starts on that checkout. Output that says Codex may still be running ("codex may
still be running as pid", or on Windows a warning that child processes may still be
running after a timeout) has the same result, naming it. A `failed` result on Windows
carries no such warning, yet a command Codex started may outlive it and nothing the
orchestrator can read proves the process tree is gone, so on Windows a `failed` Codex
implementer call is not retried and gets no Sonnet fallback: the run ends in `blocked`
naming the possible surviving process. On POSIX the runner stops the process group, so the
returned output is the evidence. The orchestrator then reads the tree state from the
footer or `git status` and gives the next call the current diff with the same slice
prompt. This is the dropped-write rule applied to implementers, and the threshold stays
two failures in a row.

A one-slice plan makes a single call at any tier. A plan with several slices runs the
Codex slices one after another, since Codex calls are one at a time per session, and never
inside a Workflow. Opus and Sonnet slices that are independent may run in parallel, either
as one Workflow whose script runs one agent per slice, or as parallel Agent calls issued
in one message, and dependent slices run in order. The orchestrator chooses. Agent calls
are the default when review rounds are expected, because they can be continued with
SendMessage and Workflow agents cannot. The choice and the reason go in `run.md`. The
Workflow tool's own rule is that a skill whose instructions call for it counts as the
user's opt-in; the skill text says so where it invokes the tool. A slice that fails review
goes back to the same Opus or Sonnet agent through SendMessage when that agent can be
continued, and SendMessage never continues a Codex implementer. Agents run inside a
Workflow do not persist, so their findings go to a fresh agent with the slice's current
diff. Either way this counts against the round cap.

Parallel slices share one working tree. The plan's slicing rule, no two slices share a
file, is what makes that safe. The design does not give each agent its own worktree
in v0.1: merging per-agent worktrees adds a step the spec does not have, and the
no-shared-file rule already prevents the conflicts that would justify it. The Step 0.3
worktree, used when a clean tree has skip-worktree edits that differ from `HEAD`, is not
a per-agent worktree: it is one checkout for the whole run.

Multi-repo mode adds one rule to slicing: no slice spans repositories, and every
implementer prompt names the path of the one checkout its slice edits, and a Codex slice
for an additional repository passes it as `--cwd`. Each repository
has its own base commit, branch, baseline, and checks. The `.ccl/` exclude is written in
every repository, and artifacts live only in the primary's `.ccl/<run-id>/`. Step 7 opens
one PR per repository with a diff, each body carrying a "Related pull requests" section
that a second `gh pr edit` pass fills with the sibling links. An issue is closed only by
the PR in its own repository; every other PR cites it as `Refs <owner>/<repo>#n`. A
worktree run is not allowed in this mode, so a primary that would qualify ends in
`blocked`. Every `gh` call for an additional repository is run from that checkout or targeted
with `-R <owner>/<repo>` where the subcommand accepts it (`gh api` does not, so its
endpoint is spelled out), and every `git` call uses `git -C <path>`.
The primary's `.ccl.json` governs `commit` and `timeouts`, and each repository's own
`checks` list is read for it. With `"commit": true` the snapshot is committed in the
first repository, the primary first and then the `--repo` order, that has a diff; a
repository with no diff never receives it and gets no PR.

After Step 4 the orchestrator re-evaluates the tier against the actual diff. If a risk
floor trigger now exists and the run is below high, it rises to high. Then, at every
tier, the Step 5 reviewers are resolved from the tier table; only the high cell depends
on the diff, taking `gpt-6-astra` and `code-review high` when a trigger was present at the
estimate or is in the diff, else `gpt-6.1-sol` and `code-review medium`. A medium run that
rises to high always has a trigger in the diff, so it gets the trigger cell. The xhigh and
max cells are fixed. The re-evaluation and the resolved reviewers are logged in `run.md`.

## Control flow and terminal states

```
Step 0 preflight ──dirty tree, bad config──► blocked
   │  no side effects: nothing created but artifacts
Step 1 review and verify
   │  estimate tier, apply risk floor
Step 2 plan
Step 3 plan review (every tier)
   │  cap hit with blocking open ─► blocked
   │  user's call ────────────────► stopped
   ▼
Step 3.6 plan-only stop
   │  --plan-only ────────────────► plan-only
Step 3.7 execution setup
   │  branch exists ──────────────► blocked
   │  create branch, reverify if snapshot != base, baseline, install added dependencies
Step 4 implement and iterate
   │  cap hit, orchestrator fix, blocking still open ─► blocked
   │  tier re-evaluated against the diff, Step 5 reviewers resolved
Step 5 final review (Codex and code-review, every tier)
   │  code-review missing ─► blocked
   │  confirmed blocking in round 3 ─► blocked
   ▼
Step 6 checks
   │  runnable check fails, not baseline ─► fix and rerun, else blocked
   │  --no-publish, other host, or withheld Step 7 ─► prepared
Step 7 publish
   │  denied permission before any push ─► prepared
   │  denied permission after a push ─► blocked
   │  CI red after 3 repair cycles ─► blocked
   │  CI budget expired ─► blocked
   ▼
done
```

Every path ends by writing `report.md` and printing it. The state decides what else
happens at the end:

| State | Before the first push | After the first push |
|---|---|---|
| `done` | not reachable | PR open, CI green or not applicable |
| `plan-only` | plan printed and written, no branch created | not reachable |
| `prepared` | every step through Step 6 done, work on the local branch, uncommitted or committed; the report gives the publish commands | not reachable |
| `blocked` | nothing pushed, work on the local branch if one exists | no further publication; the report links the PR and says what is unblocked by what |
| `stopped` | nothing pushed, question and both positions in the report | not reachable |

`stopped` is reached only from a Step 3 round in v0.1, including the one Step 3.7.1
can add, before Step 3.7.2 has created a branch, so a rerun with the same inputs and the answer as an extra ad-hoc input starts
from Step 0 with a new run id and collides with nothing.

A denied permission in Step 7 follows the spec's rule: the dependent steps are marked
not done, the steps that do not depend on it still run, and the state is `blocked`,
except that a denial before any push ends in `prepared`, since nothing was published.
The report says where the work is. A dropped call, one that returns no result and no
explicit denial, is not a denial: a read-only call is retried once, serially, and a
write is checked before any retry.

## Checks

Check discovery in Step 3.7.3 produces an ordered list in `run.md` with, per check:
the command, where it came from, whether it can run locally, and its baseline result.
The sources in order are `.ccl.json` `checks`, package scripts named `test`, `lint`,
`typecheck`, or `build`, `Makefile` targets with those names, `pyproject` tool sections
that imply `pytest`, `ruff`, or `mypy`, and CI workflow jobs whose steps run one of the
above. A CI job that runs something else is listed as CI-only and deferred to Step 7.3.

Step 4 runs only the checks each slice names. Step 5.1 runs the full set. Step 6
reuses that result only when `run.md` records no edit after it; the orchestrator logs
every edit it makes from Step 5.1 onward, so the record, not a tree hash, is the key.
Any logged edit reruns the full set.

A fix for a failing Step 6 check goes through a Step 5 round with every reviewer the stage
has, at every tier, within Step 5's cap; an open blocking finding at the cap ends the run
in `blocked`. A CI repair at every tier uses the Step 5 Codex thread when one exists,
else `codex-lite:review --base <base-commit>`, plus the Claude reviewer, and each cycle
keeps its one extra review round.

Each check runs through Bash with `timeout` set to the check budget. The Bash tool caps
a foreground call at 10 minutes, so a check with a longer budget runs in the background
and is stopped when its budget expires.

## Permissions

The plugin runs under whatever permission mode the session has. It does not require
auto mode. The skill's preamble names the actions it takes without asking, which is
what makes the invocation an approval, but a permission prompt from Claude Code is
still honored: a denied prompt is a denied permission and follows the failure rule.

The intent is that the commands' `allowed-tools` lists cover only what is safe to
pre-approve: `git` read commands and `gh` read commands. Writes, pushes, PR creation,
and comments stay subject to the session's normal rules. This keeps the plugin usable
in default mode at the cost of prompts, and silent in auto mode. Whether one plugin's
command can pre-approve another plugin's Bash call, here codex-lite's, is unverified
and is listed under decisions; the default assumption is that it cannot, and the
codex-lite calls prompt in default mode unless the user has added codex-lite's own
allow rules.

Even with those rules, each Codex call prompts in default mode for the Write of
codex-lite's request file. codex-lite's own acceptance notes record that the prompt
persists because the file is under `~/.claude`, and 0.7.0 does not change that.
Step 0.1 is where the run tells the user this: it lists every action that will prompt
under the session's mode and the instruction files, and prints whether the run is
attended or unattended before any other Step 0 action. The report records the prompts
that occurred.
The README states that unattended runs need auto mode or `--no-codex`, plus allow
rules for the git and `gh` writes.

## Decisions to confirm before implementation

The reviewer rules that earlier drafts listed here as spec deviations are now the
spec's Reviewer contract section and are not repeated.

1. `run.md` and `diff.patch` are added to the artifact set, always under `.ccl/`.
   The invocation is recorded in `inputs.md`. The command writes no file; Step 0.5
   writes the first artifact.
2. With `"commit": true`, the plan stays under `.ccl/` until Step 7.1 copies it and the
   provisional report to `specs/ccl/<run-id>/` for the commit.
3. Requires codex-lite 0.8.0 or later, for `implement` and for `--timeout`, the status
   line, and base reviews that include uncommitted work. Whether Codex reviews a file
   marked with `git add -N` is confirmed at M2. 4. Default permission mode prompts at
   every Codex call, so unattended runs need auto
   mode or `--no-codex`.
5. Parallel slices share one working tree; no per-agent worktrees in v0.1. The Step 0.3
   worktree for a clean tree with skip-worktree edits is one checkout for the
   whole run, not a per-agent worktree.
6. `.ccl/` is ignored through `.git/info/exclude`, written after Step 0.3, never
   through a committed `.gitignore` edit.
7. `allowed-tools` pre-approves read-only `git` and `gh` only, plus `date`, which the
   run budget calls before the permissions statement. Whether it can also
   cover codex-lite's Bash call is unverified; assume not.
8. How a command hands off to the skill is unverified; assume the Skill tool and
   confirm at M0.
9. The `gpt-6-astra` reviewer fallback, at any tier, tries the Fable model override on the
   Agent tool first and uses Opus on an error; no session model detection. The
   `gpt-6.1-sol` reviewer fallback is Opus. A Codex implementer falls back to `sonnet`
   only.
10. A CI job that cannot be mapped to a local command is deferred, not guessed.
11. Edits after Step 5.1 are logged in `run.md` and that log, not a tree hash, decides
    whether Step 6 reruns the full check set.
