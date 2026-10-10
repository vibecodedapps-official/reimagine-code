# Step 7: publish

Read this file at the start of Step 7. It holds Step 7; Step 7.3 items 1 to 4 are in
`ci-watch.md`, read at Step 7.3.

## Step 7: publish

Publish runs only when no blocking defect is open and Step 6 passes. Otherwise end in
`blocked`, with no further publication (see Terminal states). Step 7 runs only on the
`github` host and when `--no-publish` is not set. Otherwise the run ends in `prepared` here.
When a run with `continue` ends `prepared` and its branch has one open PR, and Step 7.2
has not written the body, read `pr-body.md` and write the continued-PR body first, so the
report can give the `gh pr comment` command. Each repository's body is written to its own
path under `.ccx/<run-id>/`, as `multi-repo.md` gives it: `pr-body.md` for the primary
and `pr-body-<slug>.md` for each additional repository.
If an ask-first prompt for commit, push, or PR is not answered with a clear yes before
anything is pushed, stop Step 7 and end in `prepared`.

1. Commit with conventional commit messages (`type(scope): subject`), following the repo's
   instruction files if they set a different format. Stage only paths the loop changed, by
   name, never `git add -A` or `git add .`. Check `git diff --cached --name-only` and confirm
   nothing under `.ccx/` is staged, and nothing under `specs/ccx/` unless `"commit": true`. With
   `"commit": true`, read `report.md` in this skill's base directory, write the report with the
   provisional state `publishing` to `specs/ccx/<run-id>/report.md`, copy `plan.md` to
   `specs/ccx/<run-id>/plan.md`, and commit both before the push, in one commit. Never modify
   that committed snapshot afterwards. Later report updates go only to the printed report and
   to the PR comment. After this run's first Step 7 push, commit only CI repairs.
2. Push the branch to the selected remote (`git push -u <remote> <branch>`, never
   forced) and open one PR against the default branch. In Multi-repo mode, open one PR per
   repository that has a diff, each body with a "Related pull requests" section, then edit
   each body once to link the siblings, as `multi-repo.md` describes. Before
   pushing, check whether the push or the PR would trigger a deploy
   (workflows that run on `push`, `pull_request`, or `pull_request_target` and deploy or
   release). Judge `pull_request_target` from its file on the default branch with
   `git show <remote>/<default>:<path>`. If so, ask first.
   Read `pr-body.md` in this skill's base directory, write the body to
   `.ccx/<run-id>/pr-body.md`, and pass it with `gh pr create --body-file`. The body has what
   changed per input, decisions a reviewer needs to understand the shipped change, drift
   corrections, checks not run, and a closing reference per input. Decide completion per input
   after implementation, the tier's required reviews, and Step 6: `Closes #n` when every
   acceptance criterion in the plan is confirmed met, `Refs #n` with a status comment
   otherwise. Pass every `--body-file` as an absolute path, as Mechanics, Artifacts,
   requires.
   In each repository that continues a branch (`continue` or `@<branch>`), with its own
   branch:
   - Before the run's first push, run `git ls-remote --heads <remote> refs/heads/<branch>`
     and compare the head with the base commit. Before each CI repair push, compare it
     with the last commit this run pushed. If the remote head differs, end `blocked`
     naming the branch. Never force push, and never rebase or reset to catch up.
   - Before the run's first push, also read the pull requests of the branch again with
     the `gh pr list` queries of Step 0.2, with the same filter. If the recorded open PR
     is now closed or merged or has a different base branch, a PR now exists where none
     did, several are open, or the list is incomplete, end `blocked` naming the change.
     Nothing is pushed yet.
   - Push with `git push <remote> <branch>`, never forced, in place of the command above.
   - With an open PR (Step 0.2), do not run `gh pr create`. Write the body from the
     continued-PR variant in `pr-body.md` and post it as one comment with `gh pr comment
     <n> --body-file <absolute path of the repository's body file>`: `pr-body.md` for the
     primary, `pr-body-<slug>.md` for an additional repository. Never edit that PR's body:
     it belongs to the PR's author.
   - With no PR, open one with `gh pr create --head <branch>` and the other arguments as
     above. When `git log --oneline <remote>/<default-branch>..<base-commit>` is not empty
     in that repository, the body says, in "Decisions for the reviewer", that the branch
     carries that many earlier commits this run did not review. Closing references keep
     their rules.
3. Watch CI:
   Read `ci-watch.md` in this skill's base directory at this step. It holds sub-items 1
   to 4; sub-item 5 below follows them.
   5. A CI failure that needs a code change re-enters Step 5 and Step 6 for the new diff,
      with the round allowance the Budgets section gives each cycle, one Step 5 round
      with the run's reviewer role before the fix is pushed. Judge the higher-risk rule
      again first on the new diff; a run that turns higher-risk here moves to Claude, with
      the skill check of the Claude review contract, and never moves back. Refresh
      `diff.patch`. For the Codex role, continue the active fallback subagent under Codex
      availability item 3 when swapped; only when Codex is active, use the Step 5 Codex
      thread when one exists, else `ccx:review --base <base-commit>`, which covers
      committed work. In a worktree
      run, refresh `diff.patch` from the worktree and continue the Step 5 reviewer, the
      Codex thread with `ccx:ask --resume` when Codex reviewed Step 5, else the
      fallback subagent under Codex availability item 3; never `ccx:review`. For the
      Claude role, rerun the skill fresh at the tier's level with the range
      `<base-commit>...HEAD` as its target, as on every pass; in a worktree run, continue
      the Opus substitute with SendMessage. Up to 3 CI repair cycles. If CI is still red
      after the third, end in `blocked` with the PR linked and nothing further pushed.
4. Comment on each source issue with status and evidence, including partial completion, in
   the issue status comment shape from `pr-body.md`. No issue comment is made before the plan
   is final, and none on a `blocked` run. In Multi-repo mode each comment carries every PR
   link.
5. List deferred and out-of-scope items in the report, each with a short description and the
   reason it was deferred. Do not open issues.
