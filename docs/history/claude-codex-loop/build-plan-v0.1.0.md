# Build plan: v0.1.0

Pre-implementation plan for the first release of `ccl`, drafted 2026-09-28 from
`SPEC.md` and `docs/architecture.md` and updated the same day for the spec's
amendments. Status on 2026-09-29: M0 to M4 shipped as 0.1.0, and 0.2.0 and 0.3.0
followed. The milestone rows and the tier prose below were re-cut on 2026-09-29 to the
current five-tier matrix, so the plan reads against the plugin as it stands; the
work-item lists are kept as the history of what was built. Each
milestone ends with a check that is run by hand against a throwaway repo, because the
spec forbids scripts in v0.1 and the plugin has no automated test surface.

## Order of work

The milestones are cut by tier, not by spec step, so that the smallest end-to-end
path works first and each later milestone adds one capability to a loop that already
runs. Repair mode, `--merge`, and `--worktree` are deferred to 0.2 by the spec and
have no milestone here.

| # | Milestone | Adds | Depends on |
|---|---|---|---|
| M0 | Skeleton | Plugin manifest, two commands, empty skill sections, license, README stub | nothing |
| M1 | Low tier, no Codex | Steps 0, 1, 2, 3 with the Opus fallback, 3.6, 3.7, 4, 6, 7; Step 5 skipped | M0 |
| M2 | Medium tier | Step 3 and Step 5 with Codex `gpt-6-sol`, parallel slices with Workflow, Claude fallbacks | M1 |
| M3 | High tier | Codex `gpt-6-sol`, or `gpt-6-astra` for the plan review with a trigger; the `code-review medium` pass beside Codex in Step 5; risk floor and re-evaluation | M2 |
| M3b | xhigh and max | `gpt-6-astra` reviews, `code-review high` and `xhigh`, Sonnet or Opus per slice, the Fable-then-Opus fallback | M3 |
| M4 | Release | Decisions doc, README, changelog, version 0.1.0, marketplace entry | M0 to M3 |

## M0: skeleton

Files, per the spec's repo layout:

- `.claude-plugin/plugin.json` with name `ccl`, version `0.1.0`, description, license
  `Apache-2.0`, author `vibecodedapps.net`, repository
  `https://github.com/vibecodedapps-official/claude-codex-loop`.
- `commands/run.md` and `commands/plan.md`: frontmatter and a body that
  validates input shape, states the parsed invocation, and hands off to the skill. The
  command writes no file.
- `skills/ccl/SKILL.md` with the preamble and eight step headings, each holding only a
  pointer to the spec section until its milestone fills it.
- `skills/ccl/tiers.md`, `skills/ccl/report.md`, `skills/ccl/pr-body.md` as templates
  copied from the spec's tables and lists.
- `README.md` stub, `CHANGELOG.md` with an unreleased section, `LICENSE`, `NOTICE`.

Check: `claude --plugin-dir .` loads the plugin, both commands appear in the command
list, the command body's handoff to the skill works by the mechanism chosen in
architecture decision 8, and `/ccl:plan "x"` reaches Step 0 and stops with a message
that says Step 0 is not implemented. `/ccl:run 123` in a repo whose issue 123 lives
elsewhere is rejected before Step 0, and so is `/ccl:run` with a PR reference.

## M1: low tier, no Codex

Fill Steps 0, 1, 2, 3, 3.6, 3.7, 4, 6, 7 with `--no-codex` implied, so Step 3 runs
with the Opus fallback in place of `gpt-6-sol`. Step 5 is skipped at low tier. Step 4
uses one Agent call for a one-slice plan.

Work items:

1. Step 0: instruction file discovery, default branch resolution, clean tree check,
   planning snapshot, run id allocation with suffix on collision, `.ccl/` ignore
   through `.git/info/exclude`, invocation and issue fetch into `inputs.md`, Codex
   availability check from the skill list and `codex --version`, the Step 0.7
   permissions statement. No branch and no baseline here.
2. Step 1: claim verification, drift recorded in `inputs.md`, per-input status, tier
   estimate with risk floor, all into `inputs.md`.
3. Step 2: plan template and slicing rule; slice count comes from the change, and a
   low change is one file or one function, so in practice one slice.
4. Step 3.6 and 3.7: plan-only stop, branch naming from labels and title or
   `--branch`, reverification when the snapshot is not the base commit, check
   discovery and baseline run into `run.md`.
5. Step 4: single-agent implementer prompt with the slice's named checks, orchestrator
   review loop converging on no blocking findings, non-blocking fixes only inside
   scope, orchestrator's one fix after the cap, the round log in `run.md`, tier
   re-evaluation against the diff.
6. Step 6: full check run, baseline comparison, reuse of Step 5.1's run only when the
   run log shows no edit since, not-run reporting.
7. Step 7: commit with named paths, push, PR body from template with drift
   corrections, CI watch with expected checks from branch protection plus deferred
   checks, CI repair cycles, issue status comments, report from template. No
   publication on blocked.
8. Blocked and stopped exits at every point the spec names, each writing the report
   before stopping, or printing it only when the run directory does not exist yet.
9. Budgets: per-call timeouts, the run-wide budget checked before every step and
   call, and round accounting that gives each CI repair cycle its own Step 5 round.

Check, in a throwaway repo with one open issue describing a one-line bug and a
`package.json` test script:

- `/ccl:run #1 --no-codex` ends in `done` with a PR whose body has `Closes #1`, a
  comment on the issue, and `.ccl/<run-id>/report.md` naming the tier as low with a
  reason, one Step 3 round by an Opus subagent named as the swap, and no Step 5.
- The same command with a dirty working tree ends in `blocked` in Step 0, prints the
  report, and writes nothing under `.ccl/`.
- In default permission mode the run prints "this run will prompt at:" with the git
  and `gh` writes listed before Step 1; in auto mode it prints "this run is
  unattended".
- With the `run` timeout set to 1 minute, the run ends in `blocked` naming the
  run-wide budget, and the report is written.
- In a clone where `.ccl/` is not ignored, a first run passes its own clean tree check
  and leaves `git status` clean after `plan-only`.
- `/ccl:plan #1 --no-codex` ends in `plan-only` with `plan.md` written, no branch
  created, no check run, and `git branch` and `git status` unchanged.
- With the checkout on a feature branch behind the default branch, the plan is made
  against that snapshot and Step 3.7 logs a reverification against the base commit.
- With the test script failing at baseline, the run reports the failure as
  pre-existing and still reaches `done`.
- With a reviewer finding that is a valid but optional improvement outside the plan's
  scope, the run reaches `done` and the report lists it as deferred.
- With a repo whose CI has a workflow filtered by `paths` that the diff does not
  match, the run reaches `done` without waiting for that workflow.
- With a run that fails a check after the first push and exhausts its CI repair
  cycles, the run ends in `blocked` with the PR linked and nothing further pushed.
- `/ccl:run "rename the README heading" --no-codex` produces a `work/<slug>` branch.

## M2: medium tier

Fill Step 3 and Step 5 with Codex `gpt-6-sol`, parallel slices with Workflow, and the
Claude fallback path for both reviewer stages.

Work items:

1. Step 3: request shape, objection verification, plan revision, explicit thread id
   capture and `--resume <id>`, `--timeout` from the `codex` budget on every call,
   round cap, the user's-call exit to `stopped`.
2. Step 4.2: Workflow script shape with one agent per slice, used only when the plan
   has more than one independent slice; ordered slices run one Agent call each.
3. Step 5: `git add -N` on each new file the run created, `review --base
   <base-commit>` for round 1, then `ask --resume <thread id>` with `diff.patch` for
   follow-up rounds, finding verification, rejection log, round cap.
4. Failure handling from codex-lite's status line: `failed` or a missing status is
   retried once, then swapped to an Opus subagent with the same request; `refused` is
   not retried; `timeout` ends in `blocked` with the budget named. Swaps are named in
   `run.md` and the report.
5. `--effort medium` forcing.

Check, in a throwaway repo with two issues in one area:

- `/ccl:run #1 #2` ends in `done`, the plan shows at least one Step 3 round with the
  thread id recorded, the report lists any rejected findings with reasons, and the PR
  body has a closing reference per issue. The tier is medium, not high, because
  bundling alone does not raise it.
- With a plan of two independent slices, both run in one Workflow; with a plan whose
  order of work makes the second depend on the first, they run in sequence.
- `/ccl:run #1 #2 --no-codex` runs the same path with Opus subagents and the report
  names both swaps.
- With Codex installed but `codex` removed from PATH, the report names the swap and
  the reason.
- A plan review that returns a blocking objection the orchestrator cannot decide ends
  in `stopped` with both positions printed.
- A slice that only adds a new file gets a Step 5 finding that names the new file.
  This confirms Codex reviews files marked with `git add -N`, not only that the
  pre-check passes. If it does not, stop and revisit architecture decision 3.
- With the `codex` timeout set to 1 minute and a large plan, the Step 3 call ends in
  `timeout` and the run ends in `blocked` naming the Codex budget.

## M3: high tier

Fill the high tier column: `gpt-6-sol` for Step 5 and for a plan review without a
trigger, `gpt-6-astra` for the plan review of a floored change, the `code-review
medium` pass beside Codex in Step 5 as a paired round under one shared cap, and risk
floor enforcement with re-evaluation after Step 4. The xhigh and max column, with the
Fable-then-Opus fallback chain, is M3b.

Work items:

1. Step 5 paired round: confirm the `code-review` skill is listed when the stage starts,
   pass the level and the base commit as the target on every pass, merge the two
   findings lists with the source kept, fix in one batch, and fix nothing in the third
   round.
2. Risk floor: behavioral triggers for auth, permissions, schema, migrations, RLS,
   data access, and public API, including indirect changes through shared code or
   configuration. `--effort low` on a floored task is refused with the reason. An
   incidental edit in a sensitive area is explained in the report. The tier is
   re-evaluated against the diff after Step 4 and the extra reviews run if it rises.
3. Fallback chain for astra: Agent tool with the Fable model override, Opus on error.

Check, in a throwaway repo with a migration file:

- `/ccl:run "add a column" --effort low` runs at high tier and the report says the
  floor was applied and why.
- `/ccl:run "fix a typo in the migrations README"` runs at low tier and the report
  says why the floor did not apply.
- A run estimated medium whose implementation ends up removing an auth check rises to
  high after Step 4, and the report shows a `gpt-6-sol` final review beside a
  `code-review medium` pass.
- `/ccl:run "add a column" --effort high` shows a `gpt-6-astra` plan review and a
  `gpt-6-sol` final review.
- At M3b, `--no-codex --effort max` names a Fable subagent for both Codex slots, or Opus
  with the Fable error recorded, and the `code-review xhigh` pass still runs.

## M4: release

- `docs/decisions.md`: one entry per rule in the spec's decisions list and per
  decision in `docs/architecture.md`, each with the failure that taught it where the
  spec or architecture records one, else the reason alone. No invented incidents.
- `README.md`: install, prerequisites including codex-lite 0.7.0 or later, the two
  commands, flags, `.ccl.json`, the approval scope, terminal states, a pointer to
  `docs/decisions.md`, and the limit that default permission mode prompts at every Codex call, so
  unattended runs need auto mode or `--no-codex`.
- `CHANGELOG.md` entry for 0.1.0.
- Marketplace entry in the same form the codex-lite plugin uses, in the marketplace
  repo. That repo is not named by the spec and editing it needs a separate approval.

Check: a fresh install from the marketplace passes the M1 check.

## Shipped files are self-contained

`SPEC.md`, `docs/architecture.md`, this plan, and `docs/spec-amendments-draft.md` are
pre-implementation artifacts and are not committed. No shipped file names or links to
them. The skill carries every rule it needs; `docs/decisions.md` carries the reasons.

## Acceptance record

`docs/acceptance.md` is created at M1 and holds every hand-run check above, in the
form the codex-lite plugin uses: a numbered list, when to rerun each item, and a
dated record of runs at the end. It is the plugin's only test surface in v0.1.

## Open items

Two lists. The first needs your decision, because each item adds a dependency, edits
another repo, or is information only you have. The second is for the implementer to
verify at the milestone named, with no approval needed.

Your decision:

1. **Markdown linter or link checker.** The repo has no automated check. Adding one is
   a new dependency. The default is none in v0.1 and hand-run acceptance only.
2. **Marketplace repo.** M4 edits a repo the spec does not name.
3. **Repository URL.** Resolved: `https://github.com/vibecodedapps-official/claude-codex-loop`.

To verify:

1. **Command to skill handoff.** At M0, confirm which mechanism works (architecture
   decision 8).
2. **`claude plugin eval`.** At M1, spike whether the plugin eval runner can drive a
   multi-step loop against a throwaway repo before committing acceptance checks to
   hand runs only.
3. **Codex model ids.** Before M2, confirm `gpt-6-sol` and `gpt-6-astra` are the
   current full ids on the account.
4. **Intent-to-add files in Codex review.** At M2, confirm Codex reviews a file marked
   with `git add -N` (architecture decision 3).
5. **Fable fallback.** At M3, confirm the Agent tool accepts the Fable model override
   in this session and that an error on it falls through to Opus. No session model
   detection is needed.

## Out of scope

Unchanged from the spec: repo settings, a persistent system spec, cross-machine
handoff, third reviewers, cross-repo inputs, opening issues. Deferred to 0.2 by the
spec: repair mode, `--merge`, `--worktree`.
