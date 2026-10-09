### Codex availability and fallback

1. Codex is available when `codex --version` succeeds, `--no-codex` is not set, and the
   plugin option `codex` does not turn it off. That option reads `${user_config.codex}`:
   only the exact value `false` turns Codex off for the run, as `--no-codex` does, and any
   other text there, including the placeholder left when the option was never set, leaves
   it on. The `ccx` plugin is a dependency of this one, so the host keeps it installed
   in a supported version and no version check is made. When Codex is unavailable, the
   reason is recorded in `run.md` and named in the report. Login and model problems
   surface on the first call as `failed`. You cannot run `/ccx:setup`.
2. Choose each stage's reviewer, and each Codex slice's implementer, when it starts, from
   the availability recorded in Step 0.6 and the failures recorded since. Use the roles
   table in `tiers.md` for the default and the fallback of each stage.
3. A fallback reviewer is a Claude subagent started with the Agent tool at the model `tiers.md`
   names for the Codex model it replaces (`fable`, then `opus` on an
   Agent error, for `gpt-6-astra`, at any tier), given the same request text, the same files,
   and the same required reply shape, and told to read and report only, never edit. For a
   diff stage it reads `git diff <base-commit>` itself, after new files are marked with
   `git add -N`. In a worktree run the fallback reviewer is given the worktree path and reads
   `git -C <worktree> diff <base-commit>`. Record any Fable error. A later round continues the
   same subagent with SendMessage when possible, else starts a fresh one given the earlier
   objections and how each was resolved.
4. A swap replaces one reviewer and never removes a stage. The fallback becomes the active
   reviewer for every later reviewer call in the run, including plan follow-ups and CI
   repair reviews. A `--no-codex` run never calls a `ccx:` skill. The tier never changes
   because a reviewer is unavailable. Only the Codex role is ever swapped: the Claude
   role of a higher-risk run is unchanged by
   `--no-codex` or by any Codex failure, and runs every Step 5 round.
5. Write every swap to `run.md` with its reason. Each one appears in the report.
6. If no reviewer is available for a required stage, end in `blocked`.

## Step 0: preflight

Echo, first: before any tool call of this step, write as text in your reply the invocation
block as received, then two lines: `run id: <yyyy-mm-dd of today>-<inputs>` by the Artifacts
rule, followed by "(-2, -3, ... is appended when `.ccx/<run id>/` exists)", and `branch:
<name>` by Step 3.7 item 2: the `branch` value; else, with `continue`, that branch marked
"(continued)"; else, with no issue input, `work/<slug>`; else the rule itself, `fix/<ids>-<slug>
when any issue has a bug label or a title starting with "fix", else feat/<ids>-<slug>`, since
no label or title has been fetched yet. In plan-only mode the line is `branch: none (plan-only
creates no branch; a run would use <name>)`. When the ad-hoc description is only numbers and
joining words (the command's step 3 rule), add the line "hint: the description is only numbers;
the run id and branch above are derived from it. Ticket text goes in a file input, which the
credential scan covers, and `--branch <name>` sets the branch (README, non-GitHub hosts)." Write
all of it even when the command already printed it; a run id that Host detection or Step 0.2
later leaves unallocated still gets its line here. Step 0.5 copies these lines into `run.md`
after the invocation block.

Host detection, before 0.1: select the remote. It is the remote that `gh repo view` resolves
(the remote whose URL matches the repo it names) when `gh repo view` succeeds; else `origin`
when it exists; else the only remote. Several remotes and no `origin` is a preflight failure
naming them. Read its URL from `git remote -v`. Classify the host as `github` when `gh repo
view` succeeds for the selected remote, or when it fails and the URL host is `github.com`
(then the preflight failure says `gh` is not authenticated for this remote). Classify it as
`other` when it fails and the URL host is anything else. Record the hostname in both
cases. A
GitHub Enterprise host counts as `github` only when `gh` is authenticated for it; otherwise
the run treats it as `other` and ends in `prepared`, and the README says so. Record the
selected remote and the class.

On `other`, the run accepts only file and text inputs, runs Steps 0 to 6, never runs Step 7,
and ends in `prepared`. Step 0.2 resolves the default branch from the selected remote's
`HEAD` symref (`git ls-remote --symref <remote> HEAD`) and fetches it. With `continue`, it
also fetches the branch and reads no pull request. Step 0.5 fetches nothing. Step 3.7.2
creates the branch locally and checks the remote with `git ls-remote --heads <remote>
refs/heads/<name>`; with `continue` it switches to the branch instead. The report names
the host and says publication is handed to the repo's own tooling; for each repository
that continues a branch it gives `git push <remote> <its branch>`.

Input guard, before 0.1: every issue input must belong to the repo of the current checkout,
and no input may be a pull request. Check with `gh repo view` and `gh pr view <n>` (a `#n`
that `gh` reports as a pull request is a pull request). A token that is an issue URL or `#n`
is an issue; a token that names an existing file is a file input; the remaining text, joined,
is one ad-hoc description. A pull request or a cross-repo issue is a preflight failure.
`continue` names a branch, not a pull request, and is not an input. On a non-GitHub host
an issue input is a preflight failure: only file and text inputs are accepted there. Ticket
text obtained by any means, an integration or a forge CLI included, is passed as a file
input so Step 0.1's credential scan sees it; writing it straight into `inputs.md` skips
that scan. `--branch <name>` sets the branch, else it is `work/<slug>` from the description
or file name (Step 3.7 item 2). In Multi-repo mode a bare `#n` names an issue of the
primary; an issue of another listed repo must be a full URL and is accepted when its owner
and repo match a listed checkout's remote.

A stop at any item before 0.5 prints the report and writes nothing, except in a worktree run
(Step 0.3), where the run directory already exists and the report is written as Final report
handling item 3 says. The printed report says which preflight item failed and what would fix
it. Step 0 creates nothing except artifacts.

1. Read the user's instruction files in `$CLAUDE_CONFIG_DIR` (else `~/.claude`), the
   repo's instruction files, and `.ccx.json`. Record every
   ask-first rule. A malformed `.ccx.json` stops the run in `blocked`. Once
   the permission mode has dropped a parallel call in this session, issue Step 0's
   commands one at a time (Approval scope, carve-out 6). Then scan every file input and
   the description for a credential shape, before the permission statement is printed,
   and hold the result in memory. The shape is any of: a line whose key, case-insensitive, is `password`,
   `passwd`, `secret`, `token`, `api_key`, `apikey`, `client_secret`, `private_key`, or
   `connection_string`, in `key: value`, `"key": "value"`, or `key=value` form with a
   non-empty value; a fenced or `{ ... }` block under a heading that contains `cred`,
   `secret`, or `password`; an AWS access key id (`AKIA` plus 16 upper-case alphanumerics);
   a PEM header. With no match, continue. Then, before any other Step 0 item runs, state
   the effective permissions for this run:
   1. Print the Approval scope actions above as approved by this invocation for this run only,
      with the carve-outs: the always-ask list and the instruction files' ask-first rules.
   2. For each action the run takes, say whether the session's permission mode or an
      instruction file's ask-first rule will prompt for it: fetching the default branch,
      the consented `git switch` or fast-forward of Step 0.2, writing `.git/info/exclude`
      and the artifacts under `.ccx/`, the Codex availability
      command of item 6 (`codex --version`), running the repo's
      checks, branch creation, commit, push, opening the PR, the comment on the continued
      PR (with `continue`), issue comments, the PR report comment, the CI watch's `gh`
      calls, each Codex call if Codex is used, subagents, and any
      other command this skill does not pre-approve. Take the mode from what the session
      states and from the settings files' default mode and allow rules: user settings in
      `$CLAUDE_CONFIG_DIR/settings.json` (else `~/.claude/settings.json`), project settings
      in `<repo>/.claude/settings.json`, and local settings in
      `<repo>/.claude/settings.local.json`. An action whose outcome cannot be determined
      counts as one that will prompt. In default mode, each Codex call prompts for ccx's request-file write
      unless the user has allowed it.
   3. Before printing, run the flagged-file check of Step 0.3 (`git ls-files -v` and `git
      cat-file --filters`, both pre-approved) so the statement can predict a worktree run:
      when one is coming, list its prompts (`git worktree add` and every command wrapped in
      `cd <checkout> && ...`). With `confirm-plan` and a run that is not plan-only,
      the plan approval question of Step 3.5 counts as a prompt: list it. When the
      credential scan matched, the credentials question of Step 0.1a is the first entry of
      the list. With `continue` set or a path given as `@<branch>`, list Step 0.2's switch
      question for each repository that continues a branch, as one that may be asked,
      without fetching: nothing is fetched before this statement is printed, because the
      fetch itself is a prompt the statement predicts. The list is made before printing,
      so every prediction precedes its prompt. If any will prompt, print "this run will
      prompt at:" with the list and continue. The run is attended, and the report says so.
      If none will, print "this run is unattended" and continue. Then, when the inputs
      could lead to them, add a line "may prompt at Step 1.2:" naming the repository
      question and the branch question, which cannot be predicted before Step 1.2 reads
      the inputs. A possible question does not by itself make the run attended; one that
      is asked does.
1a. Step 0.1a, only when the credential scan matched, right after the permission statement:
   list each match by key name and line number only, never the value, then ask, under
   Questions: "The inputs contain credentials. Reply `keep` to write them to `inputs.md`
   and forward them to Codex with the other inputs, or `drop` to replace each value with
   `<redacted: key>` in every artifact and every Codex request the run writes." A clear
   `keep` or `drop` continues; anything else ends in `stopped` with the question in the
   report. Hold the `date` times in memory for Step 0.5. With `drop`, Step 0.5 writes
   `inputs.md` redacted, and every implementer prompt, reviewer request, and patch file
   carries the redacted form. Keep the originals in the session for a read-only probe the
   inputs ask for, and for nothing else. Step 0.5 records the decision in `run.md`.
2. Resolve the default branch from the selected remote (Host detection), via `gh` on
   `github` and via the `HEAD` symref on `other`, and fetch it. Record the base commit.
   Each repository that continues a branch (`continue` or its `@<branch>`) uses its own
   branch in what follows, and a repository whose state is `new` is not affected. An
   `@<branch>` missing on that repository's selected remote (Host detection), checked with
   `git -C <path> ls-remote --heads <remote> refs/heads/<branch>`, is a preflight failure,
   never a creation; the command does not check existence for an additional repository.
   With `continue`, also fetch the branch with the explicit refspec
   `+refs/heads/<branch>:refs/remotes/<remote>/<branch>`, because `git fetch <remote>
   <branch>` updates `<remote>/<branch>` only when the fetch refspec covers it, and record
   `<remote>/<branch>` after that fetch as the base commit, in place of the default branch
   head. Still record the default branch. A branch equal to the default branch is a
   preflight failure, also in a plan-only run, because the run would push straight to it.
   A local branch of that name that is neither equal to `<remote>/<branch>` nor behind it
   with a fast-forward, so ahead or divergent, is a preflight failure; never reset local
   work. With `continue`, `HEAD` of the session's checkout must also be at the base
   commit, either on the branch or detached at it, so that the plan review and the Step
   1.3 reproduction read the branch's own code. When `HEAD` is not at the base commit, or
   the local branch exists and is behind the remote, so that Step 3.7.2 would switch to a
   stale branch even from a `HEAD` detached at the tip, and the tree is clean (Step
   0.3's check), and the local branch is absent, equal to the remote, or behind it with a
   fast-forward, switch with consent instead of failing: `git -C <path> switch <branch>`
   when the local branch equals the remote; `git -C <path> switch -c <branch>
   <remote>/<branch>` when it is absent; `git -C <path> switch <branch>` followed by `git
   -C <path> merge --ff-only <remote>/<branch>` when it is behind, the switch being
   skipped when `HEAD` is already on it, and `git -C <path> switch <branch>` followed by
   the same fast-forward when `HEAD` was detached at the tip and the local branch is
   behind. After the switch, `HEAD` and the local branch are both at the base commit,
   which Step 3.5 item 3 rechecks. The consent, under Questions, is the branch
   question's reply (Step 1.2) for a repository it adopted; for an explicit `@<branch>` or
   `continue`, ask one line: "<path> is at <short sha> on <branch or detached>. Switch to
   <branch>?", answered `yes`, else `stopped`. After the reply that consents, this
   question's or the branch question's, and before any switch or fast-forward, rerun on
   that repository the clean-tree check (`git status --porcelain`, `git diff --cached
   --quiet`), the comparison of the local branch with `<remote>/<branch>`, the `HEAD`
   check (`HEAD` is still where the question said), and the `git worktree list
   --porcelain` check. A change ends in `blocked` naming it. Before asking the primary's
   switch question outside Multi-repo mode, run Step 0.3's flagged-file check (`git
   ls-files -v` and `git cat-file --filters`, both pre-approved). When it predicts a
   worktree run, the session's files are not touched: no switch is asked or run, because
   a checkout to another commit would be refused when a flagged file differs between the
   commits, and the `HEAD` requirement above is met by the worktree, which Step 0.3
   creates at the base commit and which the plan reads. Two ref changes may still be
   needed so that Step 3.7.2 can switch to the branch inside the worktree: when the
   session is on the continued branch, `git -C <path> switch --detach` at its current
   commit, which changes no file and frees the branch; and when a local branch of that
   name is behind the remote, `git -C <path> fetch .
   refs/remotes/<remote>/<branch>:refs/heads/<branch>`, which moves the ref without a
   checkout and refuses anything but a fast-forward. Ask once for whichever apply:
   "<path> will run in a worktree. Detach the session from <branch> at <short sha>, and
   fast-forward local <branch> to <remote>/<branch>?", answered `yes`, else `stopped`.
   Neither is needed when the session is elsewhere and the local branch is absent or at
   the tip. Step 0.1 item 3 predicts this question, so Step 0.7 records it as predicted.
   Hold each repository's previous `HEAD` in memory and write it to `run.md` at Step 0.5,
   as the question times are, so a report printed by an earlier stop can still give it;
   the report lists each switch under "Where the work is", a detach as detached. The run
   does not switch back: it leaves each repository on the branch it pushed or prepared,
   or, after a detach, the session's checkout detached at its previous commit. This
   applies in a plan-only run too, because the plan must read the branch's code. When
   `HEAD` is not at the base commit and the switch does not apply (the tree is dirty,
   the local branch
   is ahead or divergent, or the branch is checked out in another worktree, below), it is
   a preflight failure whose message gives `git merge --ff-only <remote>/<branch>` when
   the session is on that branch and the local branch is behind the remote, `git switch
   <branch>` when the session is elsewhere and the local branch equals the remote or is
   absent, and `git switch --detach <remote>/<branch>` otherwise, and says a dirty tree
   must be cleaned first. A switch would not repair
   these cases.
   In Multi-repo mode the same holds for each repository that continues a branch. With
   `continue`, also run
   `git worktree list --porcelain`: a branch checked out in a worktree other than the one
   the run will use is a preflight failure naming that worktree, because `git switch`
   refuses it. The run uses the session's checkout, unless Step 0.3 creates a worktree,
   where `worktree.md` makes the session's checkout a failure too, so a session on the
   branch blocks a worktree run and one detached does not, which is why Step 0.2 detaches
   the session in place, with consent, when it predicts a worktree run. On `github`,
   read the open pull requests of the branch with `gh pr list --head <branch> --state open
   --limit 100 --json number,state,baseRefName,url,isCrossRepository`, and keep only the
   entries whose `isCrossRepository` is false, so a fork's branch of the same name is
   ignored. `--head` also matches forks, so a query that returns 100 entries may be
   incomplete. When the open query returns fewer than 100 entries and none is kept, read
   the rest the same way with `--state all`. On `other`, read no pull request. Then
   exactly one case holds:
   - An incomplete list: the open query returned 100 entries, or the `--state all` query
     returned 100 entries of which none is kept. A preflight failure saying the pull
     request list is incomplete. The cases below apply only to a complete list.
   - One open pull request: record its number, URL, and base branch. Closed or merged pull
     requests beside it are ignored. Step 7.3 uses its base branch in place of the default
     branch.
   - No pull request: Step 7.2 opens one against the default branch.
   - Only closed or merged pull requests, or several open ones: a preflight failure naming
     them.

   In a plan-only run, a local branch that differs from the remote, a branch checked out
   in another worktree, and the pull request failures above do not fail the run: record
   each in `run.md` and in the report. The `HEAD` requirement above still applies. A
   `--no-publish` run never publishes, so the pull request failures above (an incomplete
   list, only closed or merged pull requests, or several open ones) do not fail it
   either: record them in `run.md` and in the report. The local branch and worktree
   failures stay for it, because it still switches to the branch and commits locally.
3. Require a clean working tree and an empty index: `git status --porcelain` prints nothing
   (untracked files that are not ignored count as dirty) and `git diff --cached --quiet`
   passes. If either is dirty, stop with `blocked` and say what is dirty. Do not stash.
   Git hides skip-worktree and assume-unchanged edits from both commands, so when both pass,
   run `git ls-files -v` and, for each path marked `S`, `h`, or `s` (both flags), compare
   its content with `git cat-file --filters HEAD:<path>` (`cmp`), which applies the
   checkout's line-ending conversion so a CRLF working copy is not read as an edit. When
   status and index are clean and at least one flagged path differs, the exception applies:
   read `worktree.md` in this skill's base directory before creating the worktree, and
   follow it for the rest of the run. Then create a detached
   worktree beside the checkout, at
   `<checkout-parent>/<checkout-name>-ccx-<run-id>`, from the base commit with `git worktree
   add --detach`, use it as the run's checkout for every later step, and record it in
   `run.md`. The worktree is never placed inside the checkout: a toolchain that resolves
   dependencies or config by walking parent directories would otherwise read the checkout's
   skip-worktree files, the state the worktree exists to escape. When status is dirty for
   any other reason,
   the run ends in `blocked` as above. The exception is not available in Multi-repo mode.
4. Record `HEAD` as the planning snapshot. If the snapshot is not the base commit, say so
   in `run.md` once Step 0.5 creates it. Steps 1 and 2 read the snapshot, and Step 3.7.1
   reverifies against the base commit.
5. Ignore `.ccx/` as described in Mechanics. Allocate `<run-id>` and create the run
   directory. Write `inputs.md` with the invocation block and timestamp first, then fetch
   every issue with `gh issue view <n> --json number,title,body,labels,comments,url,state,assignees,milestone`
   into it, with file and ad-hoc text. In a worktree run the run directory already exists
   (Step 0.3); on the `other` host fetch nothing. Start `run.md` with the records from 0.1 to
   0.4, the run start time, and the run budget in force with its source. Also write the
   question and reply times held in memory (Step 0.1a, Step 0.2), the credentials
   decision, and each repository's previous `HEAD` when Step 0.2 switched or detached
   it. With `drop`, write `inputs.md` and every later artifact with
   each credential value replaced by `<redacted: key>`.
6. Check Codex availability as described in Mechanics. Record the result and any reason.
   Apply `--no-codex` and the `codex` plugin option. When Codex is unavailable, or
   `--no-codex` is set, implementers fall back to `sonnet` (Step 4.2).
7. Record in `run.md` every prompt that occurred in items 1 to 6 and its outcome. If item 6
   found Codex unavailable, say that the Codex prompts no longer apply. A prompt that was not
   predicted in 0.1 makes the run attended, and the report says so. A question that Step
   0.1 predicted, or listed as one that may prompt at Step 1.2, and that was then asked
   counts as predicted.

Branch creation and the baseline check happen in Step 3.7.2 and 3.7.3. Planning changes no
file content and discards none. The one tree change before Step 3.7.2 is a consented `git
switch` or fast-forward of a clean checkout (Step 0.2), recorded in `run.md`.

