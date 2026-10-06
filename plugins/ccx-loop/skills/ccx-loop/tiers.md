# Tiers, roles, and fallbacks

Read this file during Step 1, before the estimate in Step 1.6. It holds the effort tier
table, the higher-risk rule, the estimate rule, the implementer choice, the risk floor,
re-evaluation, and the reviewer and implementer roles with their fallbacks.

## Roles

The reviewers and implementers are keyed by role, not by tier. The tier table below says
which model each stage uses at each tier. `gpt-6.1-sol` is an implementer model only and is
never a reviewer.

| Role | Default | Fallback when the default is unavailable |
|---|---|---|
| Orchestrator and primary reviewer | The session's current Claude model (Opus or Fable) | none, the run stops |
| Codex reviewer | Skill tool, `ccx:ask` or `ccx:review`, model `gpt-6-astra` | Agent tool, model `fable`; on an error from that call, model `opus` |
| Claude reviewer (Step 5, higher-risk runs) | Skill tool, `code-review`, at the tier's level; in a worktree run, an Opus subagent for the worktree as `worktree.md` describes, and in Multi-repo mode, an Opus subagent for each additional repository, as `multi-repo.md` describes | none; if the skill is not listed when the stage starts, the run ends in `blocked` (a worktree run needs no skill) |
| Implementer, Codex | Skill tool, `ccx:implement`, model per the tier table | Agent tool, model `sonnet` |
| Implementer, Sonnet | Agent tool model `sonnet`, at high and xhigh tier, when the Sonnet criteria apply to the slice | none; on a tool error the run stops |

Rules for roles:

- Codex model ids are always the full id, `gpt-6.1-sol` or `gpt-6-astra`.
  A bare id such as `sol` or `astra` fails on a ChatGPT account. Pass the full id
  on every Codex call, including `--resume` follow-ups. On every reviewer call, also pass
  `--timeout` from the Codex budget.
- Codex is reached only through the Skill tool, with `ccx:ask` for plans and
  questions, `ccx:review` for diffs, and `ccx:implement` for implementers.
  Never run the `codex` CLI directly.
- An implementer call to `ccx:implement` passes `--timeout` in seconds: the smaller
  of the subagent budget and the remaining run budget, capped at 3600, because ccx
  refuses a larger value. Log the cap and the value passed in `run.md`. The Codex budget
  does not apply to it. There is no `--resume` for `implement`: every call starts a new
  thread.
- For a Codex reviewer stage, at any tier, the fallback tries the `fable` model
  on the Agent tool first. If that call returns an error, use `opus` and record the error.
  Do not detect the session's model. This is for reviewer calls only: a Codex
  implementer's fallback is `sonnet` alone.
- The Claude reviewer is the built-in `code-review` skill, called through the Skill tool
  with the level the tier table names as the first argument, then the range
  `<base-commit>...HEAD` as the target, as the Claude review contract in `SKILL.md` says,
  never `--comment` and never `--fix`. It is the final review's one reviewer role for a
  higher-risk run, chosen by the higher-risk rule below. It is not a fallback for the
  Codex reviewer, and nothing falls back to it or replaces it. A lower-risk run never uses
  it. `--no-codex` does not touch it: a higher-risk run under `--no-codex` gets Claude as
  its role anyway, so `--no-codex` changes nothing for its final review. Its availability
  is checked only when a higher-risk Step 5 starts, so plan-only runs and lower-risk runs
  do not need it. The Reviewer contract in `SKILL.md` gives the call shape and the budget.
  In a worktree run, and in Multi-repo mode for each additional repository, the Claude
  role is an Opus subagent, a defined substitute for a checkout the skill cannot target,
  and not a swap.
- A fallback swaps one reviewer or one implementer. It never removes a stage. The tier is
  set by the task's risk and does not change because a reviewer is unavailable.
- A fallback reviewer gets the same request text, the same files, and the same required
  reply shape as the Codex reviewer it replaces.
- Fall back to the Claude subagent when `--no-codex` is set, when Codex was found
  unavailable in Step 0.6, or when a Codex call returns `failed` or no status line twice
  in a row. The fallback model is the one the roles table gives: `fable`, then `opus`, for a
  reviewer, and `sonnet` for an implementer. A Codex implementer call that returns
  `failed` or no status line is retried or swapped only under the preconditions of Step
  4.2.4 in `SKILL.md`, which include the state of the process and the tree. A `refused`
  status is not retried and is not swapped: it ends the run in `blocked` with the
  message, for a reviewer and for an implementer, except an implementer refusal whose
  message contains "implement was not run:", the host's write sandbox, which swaps
  the slice to `sonnet` and marks Codex implementation unavailable for the run (Step
  4.2.4 in `SKILL.md`). A `timeout` status is a budget expiry
  and ends the run in `blocked` with the budget named: the Codex budget for a reviewer,
  the implementer `--timeout` for an implementer.
- Write every swap to the run log with the stage, the reason, and the fallback model. Every
  swap is named in the final report.
- If no reviewer is available for a required stage, the run ends in `blocked`. If the
  orchestrator is unavailable, or an implementer call at `sonnet` errors, the run stops.

## Effort tiers

| Step | Low | Medium | High | xhigh |
|---|---|---|---|---|
| 3 Plan review and converge | Codex `gpt-6-astra` | Codex `gpt-6-astra` | Codex `gpt-6-astra` | Codex `gpt-6-astra` |
| 4 Implement | Codex `gpt-6.1-sol` per slice, orchestrator reviews | Codex `gpt-6.1-sol` per slice, orchestrator reviews | Codex `gpt-6-astra`, or Sonnet by criteria, per slice | Codex `gpt-6-astra`, or Sonnet by criteria, per slice |
| 5 Final review | Codex `gpt-6-astra`, or Claude `code-review low` | Codex `gpt-6-astra`, or Claude `code-review medium` | Codex `gpt-6-astra`, or Claude `code-review high` | Codex `gpt-6-astra`, or Claude `code-review xhigh` |

Steps 1, 2, 6, and 7 run the same at every tier. The rows keep their step numbers,
because `SKILL.md` refers to the table by step.

The final review has one reviewer role per run, chosen by the higher-risk rule below. A
higher-risk run gets Claude: the `code-review` skill at the tier's level, or its defined
Opus stand-in where the skill cannot reach. Any other run gets Codex `gpt-6-astra`.

Every tier reviews the plan in Step 3 and runs Step 5. Every Step 5 round is one reviewer
role over the diff, at every tier. Every implementer call keeps the per-call subagent
timeout (a Codex implementer call the smaller of that and the remaining run budget,
capped at 3600 seconds), Step 4 keeps its cap of 3 rounds per slice, and the run budget
still bounds the whole run. A plan with three slices has three independent round caps, and
an implementer swap adds a call to that slice. `--plan-only` stops at Step 3.6 at every
tier.

## Higher-risk rule

A run is higher-risk when any of these hold for the run as a whole:

- the change carries a risk floor trigger: it adds, alters, or removes an item in the
  risk floor list, directly or through shared code;
- the change touches more than eight distinct files across all slices, counting created
  files;
- it adds a new module, type, interface, or rule section that another file cites.

These are the Sonnet criteria of the Implementer choice section with one difference: the
file count is taken over the whole run, not per slice, so splitting nine files into two
slices does not change the reviewer. Choosing the implementer stays per slice. An
incidental edit in a risk area (see the Risk floor section) is not a trigger.

The rule picks the Step 5 reviewer role and nothing else. When it is judged:

- At the plan. A trigger is known from the Step 1.6 floor check. The file count and the
  cited-module criterion are known once Step 2 has the slices, so Step 2 records the
  result on the plan, with the criterion that held or that none did.
- Before every review. Step 4.5 judges it again on the actual diff, integration fixes
  included. Step 5 judges it again before each later round, and Step 7.3.5 before each CI
  repair review.
- Once higher-risk, always. A positive result sticks. A run that turns higher-risk later
  moves to Claude for its remaining rounds and never moves back. The shared cap of 3
  rounds does not reset. `run.md` and the report record the switch, the role, and the
  criterion.
- Reviewer only. The rule never raises the tier; only a risk floor trigger does. It never
  reruns Step 3 or the implementation. Each slice keeps its effective model, and the run
  budget changes only on a tier rise.

Two edges:

- A lower-risk run can turn higher-risk during Step 5 or a CI repair and then find
  `code-review` missing. It ends `blocked` at that point, and the report names both the
  switch to Claude and the missing skill. A worktree run needs no skill.
- A higher-risk run under `--no-codex` gets Claude as its role anyway, so `--no-codex`
  changes nothing for its final review. A lower-risk run under `--no-codex` uses the
  Codex reviewer's fallback.

## Estimate rule

Apply after Step 1. Low, medium, and high are sized from the behavior the change has, not
from how many issues there are. xhigh is sized from how many areas that share no
file the change spans, on top of that.

- Low: one file or one function, a clear fix, and none of the risk floor triggers.
- Medium: several files in one area, or one issue with tests, or any doc restructure.
- High: a cross-cutting change inside one deliverable, or any risk floor trigger.
- xhigh: one change whose scope spans several areas of the code that share no file. This
  sets review depth. Slice count is set by the plan at every tier. A risk floor trigger
  does not change it: such a change is still xhigh.

Bundling issues does not by itself raise the tier; estimate the bundle as one change. Two
issues that each touch one file in one area are still medium. A bundle is xhigh only when
the change it describes, taken as one change, spans several areas with no shared file.

`--effort low|medium|high|xhigh` skips the estimate and forces that tier, subject to
the risk floor below. `--effort max` is rejected with a pointer to `xhigh`.

Record the estimate, the reason, any floor applied, and any re-evaluation in the run log
and in the final report.

## Implementer choice

At every tier the default implementer is Codex at the tier's model, one call per slice:
`gpt-6.1-sol` at low and medium, `gpt-6-astra` at high and xhigh. Choose the implementer
per slice in Step 2 and again after a requested plan change at Step 3.5. At high and xhigh,
choose `sonnet` for a slice when any of these
hold; otherwise keep Codex. At low and medium tier it is always Codex. Opus never
implements. `sonnet` is also the fallback for a Codex slice (see Rules for roles).

- the slice carries a risk floor trigger: its change adds, alters, or removes an item in
  the risk floor list
- the slice owns more than eight files, counting files it creates
- the slice adds a new module, type, interface, or rule section that another file in the
  slice, or in another slice, calls, implements, or cites

Record the choice in the plan next to the slice, as "codex" or the criterion that
applied. Log it in the run log when the slice's implementer starts, and list it in the
final report per slice with the reason. The plan reviewer may object to a choice; the
objection is handled like any other. Codex having no network does not change the choice:
see Step 3.7 and Step 4.3 in `SKILL.md`.

The slice's effective model is the chosen model (the tier's Codex model, or `sonnet`), or
`sonnet` after an implementer swap (see Rules for roles). Every later call for that
slice, in Step 4.3, Step 5.3, and CI repair, uses the effective model. For a Codex slice
each later call is a fresh `ccx:implement` call at its effective model, never
resumed, given the findings and the slice's current diff. For a Sonnet slice,
the agent is continued or fresh, including a fresh agent replacing one that ran inside a
Workflow. The single fix after the Step 4 cap stays the orchestrator's.

## Risk floor

A change is at least high tier if it adds, alters, or removes any of these, whether
directly or through shared code or configuration that they depend on:

- an auth check
- a permission rule
- a schema or a migration
- a row-level security policy
- a data access path
- a public API's signature or behavior

After a requested plan change at Step 3.5, rerun Step 1.3's verification and apply this
floor without re-estimating effort. Keep at least the tier already chosen, then choose
each slice's implementer again and judge the higher-risk rule on the updated plan.

The triggers are about behavior. Editing a file in one of these areas without changing
such behavior does not trigger the floor. Examples are a typo fix in a migrations README,
a comment change in an auth module, or a rename that changes no signature. This is the
incidental-edit exception. When it applies, the final report says why the floor did not.

The floor is `high`. `--effort` cannot lower a task below it. If the user passes
`--effort low` or `--effort medium` for a task the floor covers, refuse the request, state
the reason (which trigger applies), and continue the run at high tier. Do not stop the
run. `--effort xhigh` is above the floor and is honored.

## Re-evaluation after Step 4

After Step 4, apply the risk floor to the actual diff. This is a floor check only: the
estimate rule is not applied again, so a diff that turned out larger or more independent
than planned does not move the run to xhigh. The check has two outputs: whether the tier
rises, and whether the run is higher-risk, which fixes the Step 5 reviewer role.

- If a trigger now exists and the run is below high tier, the run rises to high tier. Log
  the rise and the reason. A run already at high or xhigh tier keeps its tier, whatever
  the diff contains.
- Judge the higher-risk rule on the actual diff, integration fixes included, as the
  Higher-risk rule section says, and resolve the Step 5 role from the tier table: Claude
  `code-review` at the tier's level when the run is higher-risk, else Codex `gpt-6-astra`.
  A run that was higher-risk at the plan stays so, even if the diff no longer shows it.
- Complete Step 5 with that role before Step 6. It stays inside the round caps in the
  budgets. Plan review at Step 3 is not repeated after Step 4, so a run that rose keeps
  the plan review it already had.
- The tier never falls after Step 4 because the diff turned out smaller than planned, and
  the Step 5 role never weakens: a run that is higher-risk stays on Claude.
- The estimate, its reason, any floor applied, the re-evaluation, and the Step 5 role it
  resolved, with the criterion that made the run higher-risk or a note that none held, go
  in the final report.
