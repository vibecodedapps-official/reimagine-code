---
description: "Plan one unit of work with the ccx loop and stop once the plan is final, changing no code. Use when the user asks to plan with the ccx loop. Inputs are issue URLs or #n numbers of this repo, file paths, and a quoted description. Flags are --effort medium|high|xhigh, --no-codex, --branch <name>, --continue <branch>, --run-budget <minutes>, and --repo <path>[@<branch>]. Pull request references are rejected. To also build and publish, use /ccx-loop:run."
argument-hint: '<#n | issue URL | file path | "description">... [--effort medium|high|xhigh] [--no-codex] [--branch <name>] [--continue <branch>] [--run-budget <minutes>] [--repo <path>[@<branch>]]...'
allowed-tools: Bash(git status:*), Bash(git rev-parse:*), Bash(git remote:*), Bash(gh repo view:*), Bash(gh issue view:*), Bash(gh pr view:*), Bash(git ls-remote *), Bash(git check-ref-format *), Bash(git -C * remote -v), Bash(git -C * rev-parse *), Read, Skill
---

You are a thin forwarder for the ccx-loop orchestrator, in plan-only mode. Do the steps below in order. Your reply has two parts, in this order: the text of step 3, then the Skill call of step 4. The tool calls of step 2 may come first; a reply that goes from them straight to the Skill call has skipped step 3, and the user then sees nothing of the invocation until the skill reports.

1. Parse the arguments shown between the markers below. They are what the user typed after the command. Split them into inputs and flags with these rules.

<user-text>
"$ARGUMENTS"
</user-text>

   - A flag is a token that starts with `--`. Accepted flags: `--effort`, `--no-codex`, `--branch`, `--continue`, `--run-budget`, `--repo`. `--effort` takes exactly one value, one of `medium`, `high`, `xhigh`; without it, effort is `auto`. `--branch` takes exactly one value, a branch name; without it, branch is `default`. `--continue` takes exactly one value, the name of an existing branch on the remote; without it, continue is `none`. Reject a `--continue` value that starts with `-` or that has any character other than letters, digits, `.`, `_`, `/`, and `-`; step 2 validates the rest of the value. Reject `--continue` together with `--branch`. Reject any other flag, a missing flag value, and any `--effort` value other than `medium`, `high`, `xhigh`. For `--effort low`, say that the low tier is gone and point to `--effort medium`. For `--effort max`, say that the max tier is gone and point to `--effort xhigh`. `--no-codex` takes no value. `--run-budget` takes exactly one value, a positive integer number of minutes; without it, run-budget is `default`. Reject any other value. `--repo` takes exactly one value, a path or `<path>@<branch>`, and may be repeated. Without `--repo`, repos is `none`. Parse a `--repo` value like this: when the whole value is an existing directory, it is a path and no split happens, so an existing path containing `@` keeps working. Otherwise split at the last `@` when the part to its right passes the `--continue` charset rule above and the part to its left is an existing directory: the left part is the path and the right part is that repository's branch. Any other value is rejected as a missing directory. Use the path alone in every directory and git check. In the block of step 3, list the value as `<path>@<branch>` when it carries a branch, else `<path>`. `@<branch>` does not require `--continue`. `--plan-only` is not accepted here because this command always plans only; reject it as redundant and point to `/ccx-loop:run --plan-only`. `--no-publish` is not accepted here either, because this command never publishes; reject it as redundant and point to `/ccx-loop:run --no-publish`. `--confirm-plan` is not accepted here either, because this command never implements and there is no plan to approve before implementation; reject it as not applicable and point to `/ccx-loop:run --confirm-plan`.
   - The plugin option Use Codex is set to `${user_config.codex}`. Only when that is exactly `false`, handle the arguments as if they included `--no-codex`. Any other text there, including a placeholder left when the option was never set, changes nothing.
   - An input token that is an issue URL (`https://<host>/<owner>/<repo>/issues/<n>`, where `<host>` is `github.com` or the GitHub host that `gh repo view` resolves for the current checkout, as with GitHub Enterprise) or `#<n>` is an issue. Several issues are allowed. With `--repo`, a bare `#<n>` always names an issue of the current checkout, the primary. An issue of a `--repo` checkout must be given as a full URL.
   - A pull request URL (`https://<host>/<owner>/<repo>/pull/<n>`, with the same `<host>` rule) is a pull request. A `#<n>` is a pull request if `gh issue view <n> --json url` returns a URL containing `/pull/`. Check each `#<n>` this way against the primary only, and check any issue URL's repo the same way.
   - A token that names an existing file is a file input. Check with the Read tool. Any number of file inputs is allowed.
   - The remaining text, joined with single spaces, is one ad-hoc description. It may be empty.
   - There must be at least one input of some kind.

2. Before anything else, run `gh repo view --json nameWithOwner` and reject the request, with a short one-line message and no further action, if any of these is true:
   - An input is a pull request, by URL or by `#<n>`. Pull request references are not inputs; only issues, files, and text are. To continue a pull request's branch, pass `--continue <branch>`.
   - `--continue` is given together with `--branch`.
   - `--continue <branch>` is a value that `git check-ref-format --branch <value>` rejects.
   - `--continue <branch>` names a branch that is not on the primary's selected remote. Check this on every host with `git ls-remote --heads <remote> refs/heads/<branch>`, which prints nothing when the branch does not exist. Query the exact ref: a bare branch name also matches any ref whose path ends in it. The selected remote is the one `gh repo view` resolves when it succeeds, else the one selected below. An additional `--repo` checkout is checked here only when its value carries `@<branch>`, and only for the form of the branch part: it is rejected when `git check-ref-format --branch <branch>` rejects it. The command does not check whether that branch exists. The skill checks it once, in Step 0.2, on the remote Host detection selects, and a missing explicit branch fails preflight there, never a creation.
   - An issue number or issue URL that gh cannot find, meaning `gh issue view <n or URL> --json url` fails. Name the input in the message.
   - An issue belongs to a different repository than the one `gh repo view` reports for the current checkout. With `--repo`, an issue URL is accepted when its owner and repo match the current checkout or any `--repo` checkout's remote (`git -C <path> remote -v`); otherwise reject it.
   - A `--repo` path that is not an existing directory or not a git checkout, checked with `git -C <path> rev-parse --git-dir`.
   - A flag is unknown, a flag value is missing or invalid, or there are no inputs.

   When `gh repo view` succeeds, the host is GitHub (GitHub Enterprise included) and the checks above apply. When it fails, run `git remote -v` and select the remote: `origin` when it exists, else the only remote. Several remotes and no `origin` is a rejection that names them. If the selected remote's URL host is `github.com`, reject with the message that `gh` is not authenticated for this remote. Otherwise the host is treated as non-GitHub: reject issue inputs only, with the message "issue inputs are not accepted on a non-GitHub host; pass a file or a description", accept file and text inputs, and continue. A GitHub Enterprise checkout without a `gh` login for that host therefore runs as non-GitHub.

   Run no other command, write no file, and do not load the skill when you reject.

3. Write, as text in your reply, the parsed invocation as this block, with every flag at its effective value. List each input on its own line, as `issue <#n or URL>`, `file <path>`, or `text "<description>"`. This step's text (the hint when it applies, the block, and the two lines after it) is required output in every session, headless included. It is a text block of your reply, written before the Skill call of step 4; the call's arguments repeat the block and do not replace this text, and a sentence that paraphrases the values is not this text.

   When the ad-hoc description is numbers only, print this one line before the block, and go on: "hint: the description is only numbers; the run id below, and the branch a run would create, are derived from it. Ticket text goes in a file input, which the credential scan covers, and `--branch <name>` sets the branch (README, non-GitHub hosts)." A description is numbers only when it is not empty, holds at least one number, and every token, after splitting on spaces, is a number or a joining word. A number is digits with an optional `#` prefix and an optional trailing `,` or `;`. A joining word is `and`, `or`, `plus`, `with`, `then`, `also`, `to`, `&`, `+`, `,`, `;`, or `/`, case-insensitive. A token such as `12345,67890` is not a number, so that description is not numbers only.

```
mode: plan-only
inputs:
- issue <#n or URL>
- file <path>
- text "<ad-hoc description>"
flags:
  effort: auto | medium | high | xhigh
  plan-only: true
  confirm-plan: false
  no-codex: true | false
  no-publish: false
  branch: <name> | default
  continue: <branch> | none
  run-budget: <minutes> | default
  repos: <path>[@<branch>][, ...] | none
```

   After the block, print these two lines as preflight output. They are not part of the block and are not passed to the skill. `run id: <yyyy-mm-dd of today>-<inputs>`, where inputs is the issue numbers joined with `-`, else the slug of the description, else the slug of the file name (a slug is lowercase letters, digits, and hyphens, at most 40 characters), followed by "(-2, -3, ... is appended when `.ccx/<run id>/` exists)". `branch: none (plan-only creates no branch; a run would use <name>)`, where `<name>` is: the `--branch` value; else, with `--continue`, that branch marked "(continued)"; else, with no issue input, `work/<slug>`; else, with issue inputs, `fix/<ids>-<slug> when any issue has a bug label or a title starting with "fix", else feat/<ids>-<slug>; settled in Step 3.7 item 2` (this command fetches no labels or titles, so it states the rule, not a name). The run id rule is the skill's Artifacts section and the branch rule is its Step 3.7 item 2.

4. Only after step 3's text is in your reply, invoke the Skill tool with skill `ccx-loop:ccx-loop` and that same block as the args. Then follow the skill from Step 0. Do not interpret the request, plan, or act on it yourself, and write no file: the skill records the invocation in its own first step.
