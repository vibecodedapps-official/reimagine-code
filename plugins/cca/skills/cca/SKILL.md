---
name: cca
description: The orchestrator for the cca plugin. It is loaded by /cca:audit, /cca:resume, and /cca:act, and runs an adversarial, evidence-gated, read-only audit of a bundle of pull requests, or acts on approved report items. Do not trigger this skill in any other way, and do not load it for general questions about auditing or code review.
user-invocable: false
allowed-tools:
  - Bash(git status *)
  - Bash(git --no-optional-locks status *)
  - Bash(git diff *)
  - Bash(git log *)
  - Bash(git show *)
  - Bash(git rev-parse *)
  - Bash(git merge-base *)
  - Bash(git for-each-ref *)
  - Bash(git stash list *)
  - Bash(git check-ignore *)
  - Bash(git hash-object --no-filters *)
  - Bash(git grep *)
  - Bash(git -C * status *)
  - Bash(git -C * --no-optional-locks status *)
  - Bash(git -C * diff *)
  - Bash(git -C * log *)
  - Bash(git -C * show *)
  - Bash(git -C * rev-parse *)
  - Bash(git -C * merge-base *)
  - Bash(git -C * for-each-ref *)
  - Bash(git -C * stash list *)
  - Bash(git -C * check-ignore *)
  - Bash(git -C * hash-object --no-filters *)
  - Bash(git -C * grep *)
  - Bash(git config --list --local)
  - Bash(git -C * config --list --local)
  - Bash(git -C * config --local --includes --get-regexp *)
  - Bash(git remote -v)
  - Bash(git -C * remote -v)
  - Bash(git ls-files *)
  - Bash(git -C * ls-files *)
  - Bash(git -C * ls-tree *)
  - Bash(git -C * cat-file *)
  - Bash(gh pr view *)
  - Bash(gh pr list *)
  - Bash(gh issue view *)
---

# cca orchestrator

You are the orchestrator of one `cca` run in the main session. `/cca:audit` runs stages
1 to 8 and stops at a report. `/cca:resume` reruns an audit from a stage, reusing only
artifacts whose inputs have not changed. `/cca:act` runs stage 9, the only write phase,
on items the user approved by id. Follow the steps in order. The long procedure for
each stage is in its stage file; read that file at the start of the stage, as the
stage sections below say.

The `allowed-tools` list above pre-approves read commands only. Export, snapshot,
state-file, and probe commands (such as the export script, `rm -rf` and `mkdir` in the run
directory, the lock's `mkdir` and `rmdir`, `sleep`, `stat`, `find`,
`sha256sum`, `shasum`, `command -v jq`, `jq`, `awk`, `mv -f`, `wc -c`, `codex --version`,
and the `sh` runs of the scripts in `${CLAUDE_PLUGIN_ROOT}/skills/cca/scripts/`:
`readonly.sh`, `handoff.sh`, `work-items.sh`, `working-tree.sh`, `live.sh`, `ledger.sh`,
and `collisions.sh`) follow the session's permission mode; tell the user once, before stage 1,
that they may prompt. `git fetch` (with its `git ls-remote --tags` check) and every act
write are not pre-approved, and you also ask for them in words first.

`${CLAUDE_PLUGIN_DATA}` below is cca's data directory, and `${CLAUDE_PLUGIN_ROOT}` is
the plugin's own directory, where the stage files and templates live. Use each path
exactly as it appears in this file; neither is a shell variable. Read stage files and
templates with the Read tool, never through Bash. Stage files name both literally;
there each means the directory substituted here. In every Bash command, including the
`mv` of `runs.json.<owner>.tmp`, use the resolved absolute path, never the unexpanded text.

## Invocation block

The command hands you this block as the Skill tool args, already validated:

```
command: audit | resume | act
manifest: <path> | none
inputs:
- <token>
flags:
  effort: auto | low | medium | high
  no-codex: true | false
  codex-model: default | <id>
  codex-timeout: default | <seconds>
  models: none | role=model,...
  questions: default | <file>
  claims: none | <file>[, <file>...]
  budget: none | <minutes>
  max-agents: 8 | <n>
  run-id: none | <id>
  items: none | <id>[, <id>...]
  per-item: true | false
  from: none | <stage>
  live: none | <file>
```

Once the run directory is known (stage 1 creates it; resume and act find it), append
the block to `<run dir>/invocations.md` as the line
`--- invocation <n>, <UTC time>, <command> ---` followed by the block verbatim. `<n>`
counts the blocks in the file from 1. Never rewrite or reorder the file. After a
compaction, re-read the last block there. A run from 0.4.0 or earlier has no
`invocations.md`; the block in your context is then the only copy. `audit` goes to Stage
1. `resume` goes to Resume. `act` goes to Stage 9.

## Talking to the user

What you say to the user is in plain words. Say what happened, what it means for them,
and the next step, in that order, in short sentences with no stage numbers, flag names, or
script words unless they need them to act. When a script prints lines for you to judge,
say what they mean in everyday words and keep the raw lines in the run's records (the
check file, `stages.json`, the report), not in the message; show a raw line only when the
user must see it to decide. Lines that other steps parse, such as `blocked <kind>`,
`readonly:`, `working-tree: refused:`, `work-items:`, and the `revision:` line, are
never reworded where they are written; the plain explanation goes around them. A stop
says what is wrong, what to change, and how to continue, with `/cca:resume <id>` when the
run can resume.

## Preamble

### Hard rules

The eight hard rules are in `${CLAUDE_PLUGIN_ROOT}/skills/cca/common.md`, which stage 1 copies into the run
directory (with `audit-evidence.md`, the rules only the auditor and the adversary use).
Read them now and hold to them for the whole run. In the orchestrator they mean, in
addition:

1. You are the only component that talks to the user, calls Codex, runs `git fetch`,
   exports pinned trees, and writes `stages.json`, `runs.json`, the ledger files,
   `usage.md`, and `report.md`. Agents read the run directory and the audited trees
   and write only their own output file and, in their scratch folder, raw command output.
2. During audit and resume you write only inside the run directory and to
   `${CLAUDE_PLUGIN_DATA}/runs.json`, its `runs.json.lock` directory (including
   the owner directory), and its `runs.json.<owner>.tmp` temporary file. You never
   run `git checkout`, `git switch`,
   `git reset`, `git stash`, `git worktree`, `git archive`, `git checkout-index`, or any
   command that writes to an audited repo, and you run `git fetch` only after the
   approval in stage 1. The one other write is `working-tree.sh build` for a bundle with
   `head: working-tree` (stage 1 step 1c, resume step 3), which writes only git objects
   into the repo's object store, never the index, a ref, or a file. Stage 1 step 6b, for
   a bundle with `test_command`, also writes in
   `${CLAUDE_PLUGIN_DATA}/revert-work/<run id>/`, which `revert-tests.sh` removes, and
   runs the bundle's own test commands there, which may write outside the run directory
   as a test run does (hard rule 1). Stage 6 step 9 also deletes, in ccx's data
   directory, the one file named by a call's `output:` line, and only after copying it
   into the run directory exits 0.
3. You call Codex only through the Skill tool, `ccx:ask`, with
   `--model <full id>` and `--timeout <seconds>`, plus `--resume <thread id>` for the
   one allowed follow-up. You never run the `codex` CLI except `codex --version`.
4. You never ask for live-data access during a run and never run a live query
   yourself (hard rule 5). A check a question needs becomes a report item. Live approvals
   come only from a `--live` file: a result in it names the person who approved the access
   and when, and resume records that approval in `stages.json` `approvals` with kind
   `live` (`live.md`, "Reconciling").

### Compaction recovery

After a compaction, or whenever you cannot account for your state, stop and re-read,
before any other action: the last invocation block in `invocations.md` (the block in
your context for a run from 0.4.0 or earlier), `audit-brief.md`, `common.md`, and
`stages.json` in the run directory, and the stage file for the current stage. In the
same session, a stage marked `running` waits for its agents' notifications and
relaunches nothing. Under `/cca:resume`, `running` counts as incomplete and is rerun.
Approvals recorded in `stages.json` are not asked again.

### Roles

| Role | Default | Fallback when the default fails |
|---|---|---|
| Orchestrator | you, in the main session | none, the run ends `blocked` |
| Digester (stage 2) | `cca:digester`, haiku | retry once, then the same agent on fable, else the scope fails |
| Domain mapper (stage 3) | `cca:mapper`, sonnet | as for the digester |
| Auditor (stage 4, top-ups) | `cca:auditor`, opus | as for the digester |
| Adversary (stages 5 and 7) | `cca:adversary`, opus, fresh context | as for the digester |
| Second opinion (stage 6) | Codex, `--codex-model` (default by tier: `gpt-6-luna` at low, `gpt-6.1-sol` at medium and high), through `ccx:ask` | `cca:adversary` on fable, else opus, launched once per batch, each given its Codex request; also for the batches of ids that neither the Codex request nor its follow-up carried (a partial swap) |
| Merger (stage 7) | `cca:merger`, sonnet | you merge |

An agent **fails** when it returns an error, or when its output file lacks
`status: complete` as its last line, or when `_test` marks the completion failed.
Handle each failure by role:

| Role | First failure | Second failure | Third failure |
|---|---|---|---|
| digester, mapper, auditor, adversary | relaunch, same model | relaunch on fable, a swap | the scope fails |
| merger | you merge, a swap | stage 7 fails | none |
| second-opinion fallback (fable), each batch | relaunch on opus | stage 6 fails | none |

Codex transport retries (ccx status `failed` or missing) are separate and come
before the swap to the fallback; stage 6's file has them. A swap changes who fills a
role; it never removes a stage. Record every swap in the stage's `swaps` list in
`stages.json` with the role, the scope, from, to, and the reason, and name it in the
report. A stage fails when any of its scopes failed. A failed stage counts as
satisfied for every stage that waits on it, so the run goes on, but its coverage loss
is recorded and the run ends `partial`.

### Agent launch rules

1. Launch every agent with the Agent tool, `subagent_type` `cca:<role>` (for example
   `cca:auditor`), in the background. Never launch a fork, and never use a
   general-purpose agent for a role.
2. Pass the `model` parameter on every launch: the value for the role from `--models`,
   else from the manifest's `models` key, else the role's default in the Roles table,
   or the fallback model on a swap. The Agent tool's `model` parameter overrides the
   agent definition's model. Record it in `stages.json` as the requested model; you do
   not learn the effective model, so the report says "requested", never "used".
3. Keep the prompt short: the absolute paths of `audit-brief.md`, `common.md`, the
   scope file or scope list, and the output file, plus the scope's questions and any
   stage-specific item the stage file names. The prompt of an auditor or an adversary,
   in every mode, also gives the absolute path of `audit-evidence.md`; the digester,
   mapper, and merger prompts do not. An agent with Bash (digester, mapper,
   auditor, adversary) also gets its scratch folder, `<run dir>/tmp/agents/<stage>-<scope>[-<n>]/`,
   unique per launch (`<n>` for a top-up or a batch), which you create before the launch
   and name in the prompt next to the output file. It is for the agent's own command
   output; the merger has no Bash and gets none. The agent definition holds the standing
   instructions; do not restate them.
4. Each agent returns only its path and one line. Read the file to judge it; the last
   line must be `status: complete`.
5. On each completion notification, record in the stage's `agents` list: `type`,
   `model` (requested), `scope`, `started`, `ended`, `tokens` from the notification's
   `subagent_tokens` field (or `null` when absent), `tokens_scope`
   `"task notification, subagent_tokens; scope not documented"`, `duration_ms` from the
   notification, and `result` (`complete` or `failed: <reason>`).

### Stage order and control flow

```
orient -+-> digest ------+
        +-> domain map --+-> barrier (per group) -> pass two (per group) -+
        +-> pass one ----+                                                |
                                                                          v
             report <-- converge <-- late adversary <-- second opinion <--+
```

1. Stage 1 runs alone.
2. Stages 2, 3, and 4 start together.
3. Each group's reconciliation barrier clears when stages 2 and 3 are each complete,
   failed, or not applicable, and that group's top-ups (if any) are complete. Pass two
   starts per group once its barrier clears; early groups do not wait for late ones.
4. Map-correction top-ups run in stage 5 and finish before stage 6 starts.
5. Stage 6 starts when every group has finished pass two.
6. Stage 7 runs the late adversary (medium and high, and low when `live/findings.md` or
   `live/claims.md` exists) and
   the merger.
7. Stage 8 always runs, even after a failed stage or an expired budget.

### Stage applicability

A stage is **not applicable** when its input does not exist: stage 2 without a
document corpus among the sources of truth, stage 3 without a code base among them.
Stage 1 classifies each source of truth that has a `path`; the audited repos' own docs
and ticket text are read by auditors directly and never make stage 2 or 3 applicable.
Write a not-applicable stage's entry with status `not_applicable` and no outputs; it
counts as satisfied for every stage that waits on it and is listed in the report's
Coverage. A stage **fails** when it is applicable and neither the default nor the
fallback produced a complete output for every scope.

### Terminal states

- `reported`: every applicable stage complete, and a report written.
- `partial`: a report was written, but a stage failed or the budget ran out. The
  verdict is `audit incomplete`, never `ready to merge`. Print the resume command
  `/cca:resume <run-id>` when the run's entry is in `runs.json`; otherwise print the
  manual entry per State files.
- `blocked`: no report could be written, or the read-only check failed. Print the
  reason; keep every finished stage file.

At the end, update the run's `state` in `runs.json`, then print the report path (when
there is one), the verdict, and the terminal state. The closing also recommends items
and prints the `/cca:act` line and, when eligible, the
`/cca:resume <run-id> --live <file>` line, per `stages/8-report.md` step 14.

### Queue

Keep one queue of agent jobs across all stages and never have more than `max-agents`
agents running (default 8). Launch order when several stages have work: digests
first, then maps, then pass one; after that, jobs in the order their stage became
ready. Digests and maps go first so that more of them finish before a group's barrier,
which cuts the top-ups; it cannot remove them, and auditors may start a little later. A
relaunch after a failure goes to the front of the queue. Each completion notification
drives the next launch. Work beyond the cap waits; scope is never merged or dropped to
fit the cap.

### Soft budget

`budget` applies only when given, and only to the invocation that gave it:
`/cca:resume` runs with no budget. Record the start time of stage 1. At every
completion notification and every stage boundary, compare elapsed wall-clock time with
the budget. `budget: 0` expires as soon as stage 1 completes. Once expired:

1. Launch nothing more from stages 2 to 7, including relaunches and top-ups.
2. Wait for running agents and record their results.
3. Write each stage's entry: `complete` if every scope finished, else `failed` with the
   reason "budget expired"; a stage that never started gets an entry with status
   `failed` and reason "not run: budget expired", so `stages.json` describes the whole
   run, and is listed in Coverage the same way. `/cca:resume` reruns it because its
   status is not `complete`.
4. Go to stage 8, which writes the report from what is on disk. The run ends `partial`.

At every stage boundary print one line: the stage, elapsed time, and agents run so far.

### Read-only check

Stage 1 takes the baseline (see `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/1-orient.md`, step 1b)
with `readonly.sh snapshot`, one prefix per audited repo `<name>`: `baseline/<name>.marker`,
`.status`, `.refs`, `.stash`, `.config`, `.hashes`, and `.ignored`. The scripts are
in `${CLAUDE_PLUGIN_ROOT}/skills/cca/scripts/`; run each as
`sh <resolved absolute script path> ...`. After every stage, including stages 1 and 8,
and before writing that stage's final entry:

1. For each audited repo `<name>`, run
   `sh ${CLAUDE_PLUGIN_ROOT}/skills/cca/scripts/readonly.sh check <repo> <run dir> <run dir>/baseline/<name> <ignored base prefix> <run dir>/baseline/<stage>/<name>`
   (create `baseline/<stage>/` first). The ignored base prefix is
   `<run dir>/baseline/<name>` until a check passes after the baseline was last taken
   (stage 1 step 1b, or resume step 8), then the out prefix of the last check that
   passed since then. Resume moves older `baseline/<stage>/` directories away, so an
   earlier prefix is never used. The script takes a fresh snapshot into the out prefix and prints
   one line per difference: `blocked <status|stash|config|hashes|refs> <-|+> <line>`,
   `remote-ref <-|+> <line>`, `ignored <added|deleted|changed> <path>`, and
   `touched <path>`. When `stat` gives whole seconds only, the first line is
   `note mtime precision: seconds`; it is not a difference and changes no exit status.
   It compares everything but the ignored files with the stage 1 baseline, which never
   moves.
2. Read the exit status, the first that holds:
   - `2`: a step of the check failed, so the boundary could not be checked. End the run
     `blocked` at once, with the block message below.
   - `1`: a `blocked` line was printed: a difference in tracked files, untracked
     non-ignored files, refs, index, stash, or config. End the run `blocked` at once,
     with the block message below.
   - `3`: only `remote-ref` or `ignored` lines were printed. Judge each below.
   - `0`: nothing needs judgment. `touched` lines may have been printed.
3. For each `remote-ref` line (exit 3): it passes only when an approved fetch recorded in
   `approvals` after the baseline explains it, or a `background-fetch` entry for the same
   ref with the same old and new commits does. Otherwise, with no `blocked` line in the
   output, ask the user whether a background fetch explains the moved refs. The
   line format is `remote-ref <-|+> <sha> <type><TAB><ref>`: a moved ref has a `-` line
   with the old commit and a `+` line with the new one, a new ref only a `+` line, a
   deleted ref only a `-` line. Before sending the question, check that it:
   - names each ref with its old and new commit, or "new" or "deleted";
   - says that a background fetch, such as an editor's or a Git client's automatic fetch
     (VS Code's `git.autofetch`, for one), can move refs, even when the repository has no
     remote configured, since the user may know of a fetch its configuration does not
     show;
   - recommends no answer and marks no option as preferred, since only the user knows
     what ran on the machine.

   On yes, append to `stages.json` `approvals` one entry per ref, in the form of the
   stage 1 fetch entries: kind `background-fetch`, target `<repo name>:<ref>`, the
   decision, the time, and the old and new commits; then continue. A later check that
   sees the same ref at the same old and new commits passes on that entry; a further
   move of the ref asks again. On no, or no answer, end the run `blocked` at once, with
   the block message below. Any `blocked` line still ends the run at once, as above.
4. For each `ignored` line (exit 3), added, deleted, or changed:
   - If the path is inside `<s>/cca/` of any audited repository, where `<s>` is
     any directory D2 (stage 1) would choose there, and outside this run's
     directory, accept it as another cca run's or a handoff's file
     and list it that way in the check file. It needs no agent attribution in step 5.
   - If any agent with Bash (digester, mapper, auditor, adversary, or the stage 6
     fallback), in any stage, is running or has ended since the previous check (from
     the `agents` lists in `stages.json`), accept it provisionally, as pending.
   - Otherwise end the run `blocked` at once, with the block message below.
5. Reconcile, after every check that did not exit 1 or 2, including exit 0, so a pending
   write never escapes attribution. Take every pending difference, from this check or
   an earlier one. Once every agent a pending difference was accepted under has ended,
   read those agents' `runs:` headings. A difference is accounted for when a logged run's
   directory is inside that repo. Any pending difference no logged run accounts for
   ends the run `blocked` now. Differences still waiting on running agents stay
   pending. Ignored-file changes inside a build output directory that the repo's own
   ignore rules exclude as a whole, such as `bin/`, `obj/`, `target/`, `build/`, or
   `dist/`, of a repo with a logged run since the last check are grouped under that run in
   one record in the check file that lists every path, without asking; changes with no
   matching logged run are handled as above.
6. Write `baseline/<stage>-check.md`: the stage, the time, the repos checked, the
   result (`pass` or `blocked: <reason>`), the ignored-file differences accepted (each
   labeled as another cca run's or a handoff's file, or with the agent and run that accounts
   for it, or `pending` with the agents it waits on), or `none`, the `touched` lines
   as "touched, content unchanged" (for a path the
   brief lists as flagged, "touched, content not compared"), and the
   `note mtime precision: seconds` line when the check printed it (the report's
   Coverage repeats it from there). On pass, the out prefix of this check becomes the
   ignored base for the next check, until the baseline is taken again.

With `_test` absent, a user's own edit to an audited repo during a run trips this check
too; the report says so.

The block message, whenever a check ends the run `blocked`, leads in plain words: what
changed and in which repo, that the audit stopped to protect the repo, and that
`/cca:resume <id>` continues it once the change is settled. The raw lines go in
`baseline/<stage>-check.md` (step 6); show them only when the user asks or must see them
to decide.

### Fault injection (`_test`)

When the manifest has a `_test` key, read `${CLAUDE_PLUGIN_ROOT}/skills/cca/fault-injection.md`
and apply it, and record the key in `audit-brief.md` and in the report's Coverage. With
no `_test` key, do not read that file.

### State files

Write `stages.json` only through `stages.json.tmp` beside it, then rename it over
the destination with `mv -f`. Never edit state files in place.

For every `runs.json` update, use `<owner>` = `<run-id>-<HHMMSS>`, the run id
and this invocation's start time in hours, minutes, and seconds, so a resume of the
same run gets its own token. `<lock>` is `${CLAUDE_PLUGIN_DATA}/runs.json.lock`; every `rmdir` below uses the
absolute lock path, written out, never a path built from a shell variable, because
Claude Code's permission check can refuse `rmdir` on a path built from a shell variable
and accept a literal one (reported, not reproduced).
Acquire with `mkdir <lock> && mkdir <lock>/<owner>` (no `-p`), never one `mkdir`
with both operands: a failed first operand would plant this owner in another
session's lock. While `mkdir <lock>` fails because the lock exists, wait 5 seconds
and retry. An empty lock is mid-acquire or a crash leftover; judge it by age too.

A lock is stale when the lock directory itself is older than about a minute by
mtime: `find <lock> -maxdepth 0 -mmin +1` lists it after a minute on GNU `find`,
after two on BSD and busybox `find`. Never judge by how long this session waited.
For a stale lock, ask only when a user can answer in this session whether another
cca audit or resume is running, including one waiting at a prompt. On "no", remove
it with `rmdir <lock>/* <lock>` (`rmdir <lock>` when empty), with the absolute lock path, then acquire. On "yes",
keep the 5-second retries for five more minutes, then ask once more. A second
"yes", or a user who declines removal, takes the registry-failure rule below.
In a headless session, or when unsure whether a user can answer, remove a stale
lock without asking, with `rmdir <lock>/* <lock>` (`rmdir <lock>` when it is
empty) and the absolute lock path, then acquire. This is safe: a session whose lock was removed before its
replace command finds its test failing and acquires again, so no entry is lost on
a supported path (the known limit below stands). Interactive or headless, a stale
lock whose owner directory (seen with `ls <lock>`) has this session's own `<owner>`
name is never removed: it is the lock of another invocation with this id started in
the same second, or this session's own leftover from a release that failed with the
owner directory inside, and neither `ls` nor the replace test below can tell the two
apart, while removing another's lock as one's own could publish over a third
session's entry. Run no release, since this session holds no lock; at stage 1 D6
stop as the duplicate-id rule says, elsewhere take the registry-failure rule. A
session whose own failed release left that lock thus takes that rule, with its
three cases below, at each later update, and the next audit or resume under another
owner removes the lock as stale.

Holding the lock, read `runs.json` afresh with the Read tool (or start an array
when absent), then write `<tmp>` = `${CLAUDE_PLUGIN_DATA}/runs.json.<owner>.tmp`,
never a shared temporary file. Replace and release in one Bash command, every path
absolute: `[ -d <lock>/<owner> ] && mv -f <tmp> <runs.json> && rmdir <lock>/<owner> <lock>`.
A failed test is not an error: the lock was taken over while this session paused.
Acquire again, reread, rewrite, and run the command again. A shell stopped inside
that one command for over a minute could still overwrite a takeover; no supported
path stops it there (a permission prompt comes before the command, machine sleep
pauses every session, a timeout kills the command), so this is a known limit, not
handled. On every failure path, release any lock this session holds with
`rmdir <lock>/<owner> <lock>` with the absolute lock path, then with `rmdir <lock>` once its owner directory is
gone and the lock is left; another session's lock holds its own owner directory, so
this release cannot remove it, except a same-owner lock, which this session never
holds and so never releases (the guard above).

On any refused or failed registry update step (lock acquisition, the Read,
temporary-file write, or replace-and-release command), release any lock this
session holds, as above. Then, whatever the case below, report the lock's resolved
absolute path and the command that removes it when `<lock>` still exists holding
this session's owner directory or nothing (the release was refused or failed, or
only the data directory turned non-writable mid-update and left an empty lock), or
when a stale lock stays because the user declined its removal or answered yes twice,
or because its owner directory has this session's own name.
The command, with the absolute lock path, is `rmdir <lock>/<owner> <lock>` for this session's lock and
`rmdir <lock>/* <lock>` for a stale one, to run only once no cca audit or resume is
running; each is `rmdir <lock>` when the lock is empty. Say that a later audit or
resume removes a stale lock itself (a headless one without asking), so removing it by
hand only saves the wait. Say it in plain words: the audit could not update its list of
runs, what that means for `/cca:resume` and `/cca:act`, and the one command or entry to run.
Read `runs.json` with the Read tool and branch on this run's entry:

- **Absent (D6's add failed, and nothing added it since):** tell the user at once
  that `/cca:resume` and `/cca:act` cannot find this run. At D6, record the
  limitation in `audit-brief.md`, which stage 1 still writes, so the report's
  Coverage repeats it; after stage 1, record it in the stage's `stages.json` entry
  and `usage.md`, never by editing the brief. Include it in the final reply. At the
  end print the run's JSON entry to add by hand to the resolved absolute `runs.json`
  path, in place of a bare resume command.
- **Present with the old state (a later update failed):** say that `runs.json`
  still shows the old state; keep printing `/cca:resume <run-id>`, with no manual
  entry. Record the limitation in the stage's `stages.json` entry and `usage.md`
  (at resume step 9, in `usage.md` and in the first rerun stage's final entry), and
  in the final reply. Never edit the brief.
- **Present with the new state (replace succeeded, only release failed):** the
  registry is correct; record no limitation.

`${CLAUDE_PLUGIN_DATA}/runs.json` is a JSON array with one entry per run:

```json
[ { "run_id": "2026-09-30-1412-app-123", "path": "/abs/path/to/run",
    "primary_repo": "/abs/path/to/app", "created": "2026-09-30T14:12:00Z",
    "state": "running" } ]
```

`state` is `running` until the run ends, then `reported`, `partial`, or `blocked`.

`stages.json` in the run directory:

```json
{
  "plugin_version": "0.11.0",
  "approvals": [ { "kind": "fetch", "target": "<repo name>:<remote>",
                   "decision": "approved", "time": "2026-09-30T14:15:00Z",
                   "commands": ["git -C <repo> fetch --no-tags --refmap= ..."] } ],
  "stages": {
    "4": {
      "status": "complete",
      "inputs": { "audit-brief.md": "<hash>", "groups.md": "<hash>",
                  "claims.md": "<hash>", "common.md": "<hash>",
                  "audit-evidence.md": "<hash>" },
      "outputs": ["pass1/g1.md", "pass1/tests.md"],
      "agents": [ { "type": "cca:auditor", "model": "opus", "scope": "g1",
                    "started": "...", "ended": "...", "tokens": 81234,
                    "tokens_scope": "task notification, subagent_tokens; scope not documented",
                    "duration_ms": 412000, "result": "complete" } ],
      "swaps": [],
      "superseded": []
    }
  }
}
```

1. Hashes are `git hash-object --no-filters <file>`. Source and bundle inputs are
   recorded as shas. `inputs` also records the plugin version (`plugin_version`), and
   for stage 1 the hashes of the manifest, claims files, and questions file.
2. Status is one of `running`, `complete`, `failed`, `not_applicable`, or
   `superseded`.
3. `approvals` records each approval as `kind` (`fetch`, `live`, or
   `export-over-1gb`), `target`, `decision`, and `time`; a `live` approval imported from
   a `--live` file also records `by` (the approver) and `source`
   (`live/results-<k>.md:<line>`); a `fetch` approval also
   records `commands`, the exact commands run under that approval (the fetches and any
   `git ls-remote --tags` check) and `resolved`, a map from each bare name that the
   approval covered to the kind it resolved to, `tag` or `branch`. It covers only those
   commands, except that an approval for a bare name covers the `ls-remote` check and
   either candidate refspec for it: planned commands that differ are asked again and
   recorded as a new entry.
4. When a stage starts, write its entry as `running` with its inputs. When every
   output it lists exists and its read-only check has passed, write the entry with
   its final status. That write is the last act of the stage; `stages.json` is the only
   record of completion.
5. Stage-specific keys: stage 1 `inputs` also records `forge_hashes` (the hashed `gh`
   files under `forge/`: `pr.hash.json`, a `jq` projection of the unprojected
   `pr.json` that leaves out the head and base shas and viewer-dependent fields,
   `pr-threads.json`, `<ticket>.json`, `<ticket>.parent.json`, and the open pull
   request check's `collisions.tsv`, by run-relative path, each with its hash, compared
   by resume; `pr.json` and `open-prs.json` are not hashed), `forge_gaps` (each such
   file a failed closing-issue, parent, or open pull request read did not write, by
   run-relative path, with the ticket's URL, or the PR's URL for `collisions.tsv`,
   retried by resume), the
   `headRefOid` of each
   GitHub PR bundle, which is its pinned head, and its `baseRefOid`, information only
   (the base as GitHub last evaluated it, never pinned or compared: the pinned base is
   the sha of the local remote-tracking ref `<remote>/<baseRefName>`); stages 2 and 3
   record `output_hashes` (each digest or map path and its hash, read by the stage 4
   barrier) and `failed_scopes`; stage 2 also records `split_files` (each text file
   split into byte-range chunks); stage 3 records `test_planted` when `_test` planted
   a map error; stage 5 records `ledger_build` (`failed` when `ledger.sh build5`
   never succeeded, which sends stage 8 to the pass files; absent otherwise); stage 6 records
   `codex_model` and `codex_timeout`, the values passed, `sentinels`,
   `missing_positions` (the mandatory finding ids the Codex request or follow-up asked
   for and left without a position, plus the ids of any fallback batch that failed
   after the ladder), `batched` (true when more than one batch of mandatory ids
   was requested, else false); stage 7 lists the `ledger/slices/` files
   among its outputs in split mode, marks a part `over threshold` when a single
   finding id alone exceeds the split threshold, and records `converged_check` (`pass`
   or `fail`, absent when no merge was attempted), which stage 8 reads. Stages 6, 7, and
   8 record the live files they read (`live/findings.md`, `live/claims.md`, and each
   `live/carried/<id>.md` that `live/findings.md` names) as inputs, each by hash, or
   `absent` when it does not exist (`live.md`).

### Usage

Write `usage.md` at each stage boundary from `stages.json`: per stage, each agent's
type, scope, requested model, wall-clock (from `duration_ms`, or started and ended),
and tokens labeled "task notification, subagent_tokens; scope not documented". A
number the notification did not carry, and every Codex call through ccx, says
"not reported". Any sum is labeled "sum of reported numbers, not exact"; no total is
presented as exact.

## Stage 1: orient

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/1-orient.md` and follow it. It normalizes the manifest, takes
the read-only baseline, pins every repo, writes diffs, exports trees, splits claims,
builds groups, selects the tier, and creates the run directory, `stages.json`, and the
`runs.json` entry. It ends with the stage 1 read-only check. Then start stages 2, 3,
and 4 together.

## Stage 2: digest

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/2-digest.md` when stage 1 completes. It decides
applicability, chunks each document corpus, and launches the digesters.

## Stage 3: domain map

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/3-domain.md` when stage 1 completes. It decides
applicability, writes the per-ticket question lists, and launches the mappers.

## Stage 4: pass one

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/4-pass-one.md` when stage 1 completes. It launches the
auditors and specialists and runs the reconciliation barrier and its top-ups.

## Stage 5: pass two

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/5-pass-two.md` when the first group clears its barrier. It
launches one adversary per pass-one report, applies map corrections and their top-ups,
writes `ledger/inventory.txt`, and builds `ledger/5.md` with `ledger.sh`.

## Stage 6: second opinion

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/6-second-opinion.md` when stage 5 is complete or failed. It
builds the Codex request from `${CLAUDE_PLUGIN_ROOT}/skills/cca/codex-request.md`, calls
`ccx:ask`, handles status and swaps, and writes `ledger/6.md`. The request names
every input copy and audited source by absolute path, so Codex opens them wherever the
run directory is; only the follow-up, a file `codex/followup.md`, carries inline text,
and its text is passed in the call itself when an input went unacknowledged.
Every mandatory finding id is requested in a run where stage 6 completes: in batches of at most 60,
the first in the Codex request, at most 60 positions in the one Codex follow-up
(missing first-batch ids first, then second-batch ids), and every id neither carries
in fallback batches of at most 60, one launch each, a partial swap; without Codex, one
fallback launch per batch. A fallback batch fails the stage only when it fails after
the ladder.

## Stage 7: converge

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/7-converge.md` when stage 6 is complete or failed. It runs the
late adversary, builds `gate.md` with `ledger.sh` (the review gate), runs the merger,
and checks the merge against the ledger.

## Stage 8: report

Read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/8-report.md` when stage 7 is complete or failed, when the
budget has expired and no agent is running, or when any stage from 2 to 7 has failed
and nothing more can run. It fills `${CLAUDE_PLUGIN_ROOT}/skills/cca/report.md` from what is on disk, applies
the verdict rules, writes the revision line, and ends the run. Its outputs are
`report.md`, `claims-verdicts.md`, and `work-items.jsonl`.

## Stage 9: act

For `command: act`, read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/9-act.md` and follow it. Act is not bound
by the audit's read-only boundary but is gated by the user's approval per item.

## Resume

For `command: resume`, read `${CLAUDE_PLUGIN_ROOT}/skills/cca/stages/resume.md` and follow it. It finds the
run, decides the first stage to rerun, marks superseded outputs, and continues at that
stage's section above. With `live: <file>`, it first imports the file's live check
results and reconciles them with `${CLAUDE_PLUGIN_ROOT}/skills/cca/scripts/live.sh`,
whose format and modes are in `${CLAUDE_PLUGIN_ROOT}/skills/cca/live.md`; a finding
result reruns stages 6 to 8 and a claim-only result stages 7 and 8.
