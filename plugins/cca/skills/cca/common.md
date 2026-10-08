# Common rules for this run

This file is copied into the run directory as `common.md` in stage 1, with the header
below filled in. Every agent in the run reads it. It is the single home of the finding
schema, the evidence rules, and the output contract; stage files and agent definitions
cite it and do not restate it.

```
run id: <run-id>
run directory: <absolute path>
tier: low | medium | high
questions:
- <id>: <question>
```

## Hard rules

These hold for every stage, for the orchestrator and every agent.

1. **Read-only boundary.** During `/cca:audit` and `/cca:resume`, nothing changes an
   audited repo's tracked files, untracked non-ignored files, the index, branches, tags,
   stashes, config, or remotes. "Audited repo" means every bundle, reference, and source
   of truth. Allowed writes: the run directory; cca's data directory (`runs.json`,
   its `runs.json.lock` directory including the owner directory, and its
   `runs.json.<owner>.tmp` temporary file);
   ccx's own request, thread, and output files in ccx's data directory, written
   when cca calls it, including ccx's own removal of output files older than a day, and
   the orchestrator's removal of the output file it just copied (stage 6 step 9); `git fetch` into remote-tracking refs, after the user approves it
   once per run; and, for a bundle with `head: working-tree`, the loose git objects that
   `working-tree.sh build` writes in the repo's object store (stage 1 step 1c, and resume
   step 3 when it rebuilds the head), which the report discloses; and, in stage 1 step
   6b, the orchestrator's copies in cca's data directory (`revert-work/<run id>/`),
   removed when the step ends, and whatever a bundle's own test commands write outside
   every audited repo and the run directory, under the consent its `test_command` key
   gives, which the report discloses. Nothing else. An ignored
   file written by a run that an agent logged under its `runs:` heading is allowed
   and reported, never silently.
2. **Prevention and detection.** Agent tool lists exclude Edit and NotebookEdit. An
   agent with Bash runs only these commands: `git show`, `git log`,
   `git diff --no-ext-diff --no-textconv --no-color <base>...<head>`, `git grep`, `git ls-files`, `rg`, `ls`,
   `git hash-object --no-filters` (never `-w`) for the `consumed:` hashes, `cat` of an
   exported file with `tail -c`, `head -c`, `wc -c`, `sed '$d'`, and one `awk`
   line-numbering stage for a digester's byte range, and, when a question needs a run in
   a directly read tree, the repo's test or lint commands, which may write ignored build
   output. A diff always names two commits: a working-tree `git diff` refreshes the index
   even with `--no-optional-locks`, so it is never run. In a bundle with
   `head: working-tree`, `git grep` always names the head sha, since a plain `git grep` or
   an `rg` over `git ls-files` would miss the untracked files that are part of the head.
   The orchestrator's `git status` runs as `git -C <repo> --no-optional-locks status ...`,
   and the snapshot script sets `GIT_OPTIONAL_LOCKS=0`, so no status check rewrites the
   index. An agent may redirect a command's output into its own scratch folder, which its
   prompt names (`<run dir>/tmp/agents/...`), and keeps it raw; no agent edits a file in
   place. This is instruction, not enforcement: nothing blocks Bash mechanically. The
   orchestrator snapshots every audited repo in stage 1 and compares after every stage. A
   change to tracked files, untracked non-ignored files, refs, the index, stashes, or
   config, including an added or deleted file, stops the run `blocked`, unless an approved
   fetch caused it. A change among ignored files that no logged run accounts for stops it
   too, unless it is another cca run's or a handoff's file under an audited repository's
   `<scratch>/cca/`, outside this run's directory. Not detected: an ignored file replaced
   with one of the same size and a restored modification time, changes inside `.git/`
   other than refs, stashes, and config, a change to a nested repository's refs other than
   its HEAD, its stashes, or its config, a change inside a repository that sits in an
   ignored directory, such as a linked worktree, other than an entry added or removed at
   its top level, and changes outside the audited repos. The user should not edit audited
   repos during a run, since their own edits trip the check too.
3. **No model, agent, or tool names** in anything external: commit messages, PR or
   ticket text, and drafted comments. The report is internal and may name them.
4. **No advisor tool**, in the orchestrator or any agent.
5. **Live data.** Credentials and live systems (databases, dashboards, production APIs)
   are used only when a question cannot be answered from code, and only on a result the
   user supplies in a `--live` file after approving the access. There is one path: a needed check becomes a report item in
   the Live checks section. Neither an agent nor the orchestrator asks for or uses live
   access during a run; an agent writes a `live check` field and nothing more. The user
   runs the check and returns the result in a `--live` file through `/cca:resume`
   (`live.md`), and the approval is recorded from that file. Each access is logged in
   the report.
6. **Evidence.** A claim is not a fact until evidence is cited (see Evidence).
7. **Disk first.** Every agent writes its output file before it reports back and
   returns only the path and a one-line status.
8. **Claims are not facts.** The session summary being audited, and every sentence in
   `claims.md`, is a claim to verify, never a source of truth.

## Evidence

Every piece of evidence names its repo and the commit it was read at. Four kinds:

- **Quote:** `repo@sha:path:line`, with the quoted lines.
- **Search:** the exact command, its scope, and its result, including an empty result.
  This is how absence is shown.
- **Run:** the exact command, where it ran, and the output, marked as cut where cut.
  Every run is logged under the agent's `runs:` heading.
- **Live result:** the result of an approved live check, fed back with `--live` and cited
  by its `live/` file and line (`live/results-<k>.md:<line>`, or the carried file for a
  finding the ledger no longer holds), and for a result kept as a file, by its copy
  `live/results-<k>/<line>.txt`. It counts as a run the approver made, so it can
  demonstrate a defect. It is evidence only after it has passed the review gate
  (`stages/7-converge.md`, step 4).

Forge evidence is a URL with a quote. A finding separates what the evidence
**demonstrates** from what it **infers**. The label `verified fact` requires that the
defect itself is demonstrated, by a quote plus a causal explanation, or by a run.
Otherwise the label is `unverified assumption` and the severity may not exceed `medium`.
`convention` marks a finding that rests on a ranked source's rule, not on broken
behavior.

A digest (`guidelines/digest-N.md`) or a map (`domain/<source>-map.md`) is a pointer,
not evidence. Cite the original document or source at its pinned sha.

A finding with a `live check` keeps `unverified assumption` and its cap until a live
result for it has passed the review gate. A missing rationale in the ticket or PR is not
by itself a defect. The diff is always the three-dot diff in `diffs/<bundle>.diff`; never
compare base and head with a two-dot diff, which shows the base's later changes as
reversals on the head.

### Reading trees and searching

`audit-brief.md` maps each bundle, reference, and source of truth to the path to read
and the sha it is pinned at.

- **Directly read tree** (the repo's own checkout, at the pinned sha with no tracked
  changes): search with `git -C <repo> grep <pattern> <sha>`, or with `rg` over the
  files `git -C <repo> ls-files` lists. Never search the working tree with a plain `rg`,
  which also sees untracked and ignored files. Do not follow a symlink outside the
  repo. A citation to an untracked, ignored, or outside path is invalid evidence, except
  as the next item says.
- **Working-tree bundle** (`head: working-tree`; the brief's mode is
  `direct (working tree)`): the head is a commit built from the working tree, with no
  ref, so it holds the modified files and the untracked files that are not ignored.
  Search it only with `git -C <repo> grep <pattern> <head sha>`, never with `rg` over
  `git ls-files`, which misses the untracked files. The files the brief lists as
  untracked at audit time are part of the head and valid evidence, cited at the head sha
  as `repo@sha:path:line`; an ignored or outside path is still invalid. When the brief
  lists a path as flagged at audit time, the bundle is read from an export of its head
  instead (mode `export`), which holds the untracked files too and each flagged path at
  its index version, not the local file. A flagged path in a submodule is absent, as
  every submodule path is.
- **Exported tree** (`<run dir>/trees/<name>/`): tracked files only, at the pinned sha.
  The export of a working-tree bundle's head also holds the files the brief lists as
  untracked at audit time, which are valid evidence as the item above says.
  A symlink is a regular file holding its target; do not resolve it. Submodules are
  listed in the brief and absent. Git LFS files are their pointer files. Cite as
  `repo@sha:path:line` with the repo-relative path, not the export path. No test or lint
  command runs in an export, whether or not it needs installed dependencies; mark that
  question "not run". The one exception is stage 1's own run of a bundle's changed
  tests, in its own copies, which you read as "Reverted test runs" below says.
- **Read by `git show`** (an export over 1 GB the user declined): read with
  `git -C <repo> show <sha>:<path>`. Only agents with Bash are assigned to it.

### Reverted test runs

For a bundle whose manifest sets `test_command`, stage 1 ran the bundle's changed test
files twice, outside every audited repo: in a copy of the head, and in a copy of the
merge-base with the test code (each changed path under `test_paths`) at its head state.
`revert/<bundle>.md` gives one verdict per file, what each copy held, and each run's exit
status and output tail. It counts as a run: cite the result file's line
(`revert/<bundle>.md:<line>`), the file, and the copy. A verdict means this much:

- Before any verdict counts as evidence, show from the output tail that the tests the
  bundle added or changed in that file ran in that copy, by name, and were not skipped.
  Other tests in the file running is not enough: an unchanged test can pass while the
  changed one skips. When the tail cannot show it (no names, cut, an empty collection, a
  wrapper), the verdict is a lead only.
- `passes at head and without the change` is a lead with a run behind it. It supports
  `verified fact` only when the tail shows the changed tests ran in both copies, you
  name the behavior the ticket asks for that those tests should detect, and you cite the
  diff hunk outside `test_paths` that implements it, so the reverted copy lacked it.
  When the implementation sits in a changed test-code path (kept at its head state; the
  result file lists these), or you cannot find it, the verdict stays a lead. A file can
  rightly pass without the change: a refactor, or a test of older behavior.
- `passes at head only` does not prove the file detects the behavior: the reverted copy
  may lack a file, import, or command the bundle added. Read the tail and judge the file
  as you would without the run.
- `does not pass at head` is a lead, never a finding by itself. Without `test_setup` a
  copy has no installed dependencies; the result file shows whether setup ran, and the
  tail shows why the run failed.
- One verdict per file. When the reverted copy's tail shows a changed test passed by name
  before a later test failed, that test passes without the change, whatever the file's
  verdict, and the rules for a file that passes in both copies apply to it.
- A changed file outside `test_paths` stays at the merge-base in the reverted copy, so
  tests inside it are not measured. `not run` verdicts give their reason.
- Output tails are recorded unredacted. Quote no more than the finding needs, and never
  a credential.

### Rerun of a renamed run-once script

The brief's run-once list gives a renamed or copied script (`R` or `C`) with its old path.
A runner that journals by name does not know the new name, so the script runs again on
every install that ran the old one. "Safe to rerun" means no repeated work, not the same
end state. A rerun can leave the same end state and still rebuild, copy, or send the same
thing again on every install, and that repeat is the defect. An argument from the end
state ("a second run leaves one key line", "the step is idempotent") does not clear a
script.

- The runner. Find how the runner turns a script into its journal key: the file name, a
  version prefix, a hash of the content, or an id inside the file. Search the audited
  repos at the head sha for the run-once patterns' directory and for the terms the
  runner uses for an applied script (`journal`, `applied`, `migrat`, or its own), and
  quote the lines that read and write the journal. Compare
  the key of the old path with the key of the new one. They differ (the key is the file
  name): the script runs again where the old one ran. They are the same (a version
  prefix or an id the rename keeps): the runner does not see the rename, so judge the
  file as an edit to an existing run-once script. No rule found in the audited repos (a
  tool the repo only names, or a runner outside them): say so, write the finding as if
  the key were the file name, and let the live check settle it.
- Steps. A step is the part of the script that changes one thing: a key, a column, a
  function, a data set. Read the old script at the merge-base and the new one at the
  head sha, and compare the two directly; how the diff shows the rename does not matter.
  For each step of the new script, work out what an install that ran the old script
  already has. A step whose result that install does not have yet, such as a new column
  or a definition that differs from the old one, is needed work: it is what the change
  is for, and this check does not judge it. A step whose result that install already has
  is repeated work when nothing stops it, whatever its end state. Judge each result
  apart: a new result does not excuse repeated work on another one, even inside the same
  command or the same rewrite of a file. A comment, a log line, or a formatting change
  does not change a step's result.
- Repeated work. Say what the step does again: drops and adds a key or index, rewrites
  or copies rows or files, sends something outside the store, or sets a definition to the
  value it already has.
- Guards. A guard clears repeated work only when it tests the result the step produces,
  or a fact that shows the result is there (such as the old name's entry in the
  journal), and holds both ways: it skips the work on an install that already has the
  result, and runs it on an install that does not (an older install, a fresh one). Work
  out both installs from the earlier scripts and quote them. A guard on something
  weaker, such as "a key exists", skips work that an older install still needs, whose
  key has other columns. A guard may wrap one step or the whole script, but every needed
  step must still run: a whole-script exit that tests only the old step's result skips
  the new steps where the old name ran.
- The finding. One per script, naming each repeated step with its lines in the old and
  the new script. The label is `unverified assumption`, because the repo does not show
  that any environment ran the old name. A journal that a ticket, PR, or thread lists
  shows one environment on one date: cite it, and keep the live check. Severity is at
  most `medium`: `medium` when the repeated step drops and adds an object, walks rows or
  files, or sends something; `low` when it only sets a definition to the value the old
  run set. The live check looks up the entry of the old script in the journal of each
  target environment and reads the key it holds. Its results: the key is the file name,
  so the new name runs there and repeats the step, and the recommended change applies. A
  key the rename keeps: the new name does not run there. No entry: the new name runs
  once there, with nothing to repeat. The recommended change guards the repeated step
  on its own result, or leaves the old name alone and puts the needed steps in a new
  script.
- A script you check and clear gets a `## Verified OK` line that names the guard, or says
  that each step's result is new to an install that ran the old name. Where the tier
  lets pass two attack Verified OK items, it counts such an item among the riskiest and
  holds it to this section.

## Finding schema

Each finding uses exactly this block:

```
### <scope>-F<n>: <one-line title>
- severity: blocker | high | medium | low | note
- question: Q1 | Q2 | Q3 | Q4 | <custom id>
- label: verified fact | unverified assumption | convention
- claims: <claim numbers tested, or none>
- evidence: <quote, search, or run, per Evidence>
- demonstrated: <what the evidence shows>
- inferred: <what follows from it but is not shown>
- what the code does:
- what breaks, and for whom:
- recommended change: <repo> <path> <change>
- alternatives: <each weighed, and the one recommended>
- live check: <query>; <where it runs>; <what each result changes>; or none
- work-item impact: <ticket, acceptance criterion, or none>
```

In the `live check` field, the query, the place, and the results hold no semicolon, since the report splits the field at its semicolons; join outcomes with periods.

Ids and origin tags:

- Pass one: `<scope>-F<n>`. A barrier top-up appended to `pass1/<scope>.md` continues
  the numbering under a `## Top-up` heading.
- A new finding raised by a pass-two adversary is `<scope>-P<n>` and adds the line
  `- origin: pass2` after the title.
- A finding written by a top-up auditor after a map correction, in
  `pass2/<scope>-topup.md`, is `<scope>-T<n>` and adds `- origin: topup`.
- A finding the second opinion adds is `X<n>` and adds `- origin: codex`; one the late
  adversary raises is `L<n>` and adds `- origin: late`.

A scope is a group or a specialist scope; its id has no space or colon.
Every finding with an origin line is a **late addition**.

## Verified OK list

Items checked and found sound, each with evidence:

```
## Verified OK
- <scope>-OK<n>: <what was checked>; evidence: <quote, search, or run>
```

## Outward trace

A group scope and the `combined` scope write `## Outward trace` after `## Verified OK`
and before `## Claims`. No other scope writes it. It records what the auditor checked
outside the changed lines, so that pass two can challenge it. It is a report section, not
a finding list.

```
## Outward trace
- <scope>-OT<n>: <repo>:<path>:<symbol> (<repo>@<sha>:<path>:<line>); siblings: <names with citations, or none>; callees: <newly called functions and the failure branches the change handles or does not, or none>; consumers: <readers of any input or output the change widens, or none>; decisions: <listed below, or none>; result: sound, evidence: <...> | finding <id>[, <id>] | incomplete: <what was not resolved>
  - decision <repo>@<sha>:<path>:<line> <what it decides>; reads: <the widened part>; outcome: unchanged | changed from <merge-base branch> to <head branch> | new value, <branch taken>; covered: yes, <source:line and quote> | no, <texts searched and term> | n/a[; finding <id>]
- not traced: <repo>:<path>:<symbol> (<path>:<line>), ... (cap reached)
```

- A changed symbol is each function, method, query, type, config key, or endpoint the
  change adds, alters, or removes. Its identity is `<repo>:<path>:<symbol>`, and the
  citation is at the head sha. A removed symbol is cited at the merge-base sha, the entry
  says `removed`, and it is traced for its consumers. An input the change widens that is
  none of these, such as an argument or a variable passed on to existing code, is a
  changed symbol too, named by where the new value enters.
- The cap is 15 entries per scope, riskiest first: public entry points, changed
  signatures, widened inputs, then error paths. The symbols over the cap go on one
  `not traced:` line. Write no `not traced:` line when the cap was not reached. Write
  `none` under the heading, and nothing else, when the scope changes no symbol, such as a
  docs-only scope.
- The trace goes one hop from each changed symbol. Siblings are its direct siblings: the
  same family, the same query branches, and the types the ticket names. Callees are the
  functions it directly calls that the change adds. Consumers are the code that directly
  reads an input or output the change widens. Per symbol, check at most 5 siblings, 5
  callees, 10 consumers, and 8 decision points, riskiest first. When a list is cut, write
  `(<k> of <n> checked)` after it.
- A change widens an input or output when its readers can now receive a value, key, or
  shape they could not receive at the merge-base. These widen: a fixed value replaced by
  a variable one (`null` or a constant replaced by a real map or setting); a larger type,
  range, or set of allowed values (a new enum member, a required field made optional, a
  scalar made a list); a new key, field, column, header, or option that existing code
  reads; a source replaced by one that can return other values. These do not: a
  narrowing, a rename that keeps the same values, a value that only new code reads, and a
  refactor that passes the same values. The decision rules below apply only to a consumer
  of a widened input or output.
- A decision point runs, skips, or changes something because of the widened part: a
  rule, a branch (`if`, `case`, a guard, an early return), or a key lookup. A helper that
  only tests the input and returns the answer, such as a predicate, is the reader, not a
  decision point: list the decisions that act on its answer. Code that does not use the
  widened part is not a decision point, and it is not counted. The decision rules apply
  to consumers in product code. A test that reads the widened input is judged by the
  tests checklist, not here.
- Write `decisions:` after `consumers:`, and list the decision points of every consumer
  on `  - decision` lines under the entry, with `decisions: none` when `consumers` is
  none. Decision lines are not entries: they do not count toward the 15 entries of a
  scope or the 10 consumers of a symbol. List at most 8 per entry, across its consumers.
  Count every decision point that reads the widened part as `n` first. When `n` is over
  8, list first the ones that no ticket, PR, or claim text mentions (search each one's
  field, message, or condition), then the ones whose own condition uses the widened part,
  then the rest in file order. Write `(<k> of <n> checked)` after `decisions:` and
  `not listed:` with the `<path>:<line>` of each one left out.
- A decision is covered when a source names it and says it follows the change. A source
  names it by its own field, message, or condition, alone or in a group the text states
  in full. "The flag and office rules" names two rules, not a third, and a word that is
  only part of a name does not match (`office` is not `office_code`). The sources are the
  ticket and its acceptance criteria; the PR title, body, and threads; the bundle's
  commit messages; the claims; and a test that asserts the decision's outcome for a value
  the widened input can now carry. An edit to the decision's own lines is not coverage: it
  shows what to review, not that the change is meant. Naming only the key or setting the
  decision reads does not cover it. Neither does a source that names the decision but not
  the change (a ticket that adds a column the decision tests), nor a test whose input
  satisfies every rule. Write `covered: yes` with the source, line, and quote. Write
  `covered: no` with the texts searched and the term, which is the evidence of absence.
  Write `covered: n/a` when the outcome is `unchanged`.
- A decision whose outcome is `changed` or `new value` and that is not covered is a
  finding. Judge the outcome over the values the widened input can now carry, not only
  the values the repo holds today. Quote the value at the merge-base, the value at the
  head, and the decision, and explain why its branch differs. The label follows
  "Evidence": `verified fact` when those quotes and an empty coverage search show it,
  `unverified assumption` when a source's wording could reach the decision. Put under
  `inferred` that nobody may have meant the change. File it under the question that asks
  for no more than the ticket says (`Q2` by default), or the closest one, and say so. It
  is not a missing rationale: it rests on a changed outcome. One finding names every
  uncovered decision of one consumer.
- Search for consumers in every tree the brief maps, not only the scope's bundle, as
  "Reading trees and searching" says, with the commands hard rule 2 allows.
- Result `sound` needs evidence (a quote, or a search with its empty result), and every
  decision line `unchanged` or `covered: yes`. Result `finding` names the findings the
  entry raised. Result `incomplete` names what the auditor could not resolve, such as a
  consumer outside the mapped trees; the report lists it.
- A sibling that lacks the change is a finding only when the entry cites the shared
  contract and shows the sibling violates it. The contract is the ticket, a ranked source,
  a shared interface or caller, or the same input contract. A ranked source's rule alone,
  with no broken behavior shown, gives label `convention`. Otherwise the entry says why
  the missing change is not a defect.

The entry lines are `- ` list lines, and a decision line is an indented `  - ` line under
its entry, with no id. Never write a `### ` line or a line that is only `runs:` or
`status: complete` inside the section, so no trace line reads as a finding, a verdict, or
the end of a block under the parsing rules.

Pass two writes `## Outward trace challenged` when the pass-one report has
`## Outward trace`:

```
## Outward trace challenged
- <scope>-OT<n>: upheld | broken, finding <scope>-P<n>; evidence: <...>
```

At every tier, the adversary checks the list for completeness against the scope's diff.
Each changed symbol that is neither traced nor on the `not traced:` line, and each symbol
on the `not traced:` line, goes in `## Coverage gaps` as
`outward trace: <repo>:<path>:<symbol> not traced`. Entries are attacked by tier: at
`low` none, at `medium` up to 5 entries, the riskiest, and at `high` all of them. An
attack repeats the entry's search or run and looks for a sibling, callee, consumer, or
decision point it missed. It also opens the source each `covered: yes` line cites, and
searches the ticket, PR, claims, and tests where a line says `covered: no`. Write one line
for each attacked entry, or `none` when none was attacked. A broken entry becomes a new
pass-two finding `<scope>-P<n>`, and the line names it. These lines are challenge lines,
not findings, and are not in the ledger files.

## Claim kinds

Every claim in `claims.md` has a kind. For a handoff, the kind comes from the handoff's
own script, never from judgment. For prose, the first rule that applies types the
sentence:

1. `verification`: says something was checked, tested, verified, confirmed, reproduced, or
   passes.
2. `decision`: states a choice made or rejected, a deferral, or who decided.
3. `scope`: says what belongs in or out of the bundle, or ranks a ticket for inclusion.
4. `status`: a work item's type, state, iteration, owner, or links.
5. `code`: any other checkable statement about code, data, or behavior.

A claim's target in `claims.md` is a group id from `groups.md`, or `hygiene`. Every
`scope` and `status` claim targets `hygiene`; the stage files say which scope receives
those claims.

## Claims list

Each claim assigned to the scope in `claims.md`:

```
## Claims
- claim <n>: true | false | not verified; <finding id, or evidence>
```

`not verified` gives the reason, such as "needs a live check". A `verification` claim uses
these lines instead:

```
- claim <n>: true, reproduced; <the run or quote that reproduces the stated result>
- claim <n>: false, contradicted; <evidence>
- claim <n>: not verified, not reproduced; <why: not run, no access, needs a live check, budget expired, exported tree, or setup differs>
```

A `verification` claim is `true` only when you reproduced the stated result yourself, by a
run, or by a quote when the stated result is a fact of the code at the pinned sha. A quote
of other text saying it was checked is not a reproduction. `false` needs counter-evidence.
A run under a different setup than the stated check needs is not counter-evidence: another
directory, a missing environment variable, service, or account, or another environment
than the one the statement names. The claim is then `not verified, not reproduced`, and
the reason names what differs. Reproducing a result does not show that the build session
ran its stated check; the report says so once in its Claims section.

## Env claims

An env claim is a `verification` claim whose check part, the text after the first
`; check: ` of its entry, starts with `env: ` (`env: <name>; <check>`, as `handoff.md`
defines it). The rule is mechanical: stage 1 adds no marker to `claims.md`. The check
ran against the environment `<name>`, which the audit cannot reach, so a run here is a
run against another environment. Pass one writes it
`not verified, not reproduced; needs a live check: env <name>`, never `true` or `false`
from a run here. The report lists each env claim by claim number in its Live checks
section, with its environment and command, and `claims-verdicts.md` gives it the verdict
`not reproducible here` until a live result settles it (`live.md`).

## Decisions

Every scope writes `## Decisions` after `## Claims`: one line for every `decision` claim
assigned to the scope, by claim number, or `none` when the scope has none.

```
## Decisions
- claim <n> (<handoff ref or none>): <class>; resolution: <taken | open deferral | settled later by <record>>; alternatives weighed: <yes, <evidence> | no>; authority: <person: <name> | role: <role> | checkpoint | not recorded>; tracked by: <where | nothing>; work depends on it: <yes, <why> | no>; reversibility: <reversible | hard to reverse | contract change>; recommendation: <text>; finding: <finding id or none>
```

Read three dimensions from the record, then the class follows.

- Resolution: `taken` (status `taken` or `default taken`), `open deferral` (status
  `deferred` or `deferred to <owner>`), or `settled later` (a deferral that a later
  commit, comment, ticket field, or document shows decided; treat it as `taken`, with that
  record as `recorded_at`).
- Authority: `person: <name>`, `role: <role>`, `checkpoint`, or `not recorded`. For a
  deferral, the owner in `deferred to <owner>`, judged the same way.
- Evidence: alternatives weighed, or not. Weighed means you read, in a record you can open
  (a commit body in a bundle, a ticket or PR comment in the forge data, or a document at a
  pinned sha), at least one alternative with the reason it was not taken. The handoff's own
  `rejected: ...; why:` lines are claims, not that record: a `recorded_at` you opened and
  found to support them counts; a `checkpoint:` pointer or `not recorded` cannot be opened,
  so the entry says `alternatives weighed: no (not in a readable record)`.

Class, the first that holds:

1. `stale deferral`: an open deferral with no `person:` owner, or that nothing in the forge
   data or the repos tracks (no ticket, comment, or document names it as open).
2. `needs <owner>`: an open deferral with a `person:` owner that the record tracks; or a
   taken decision whose reversibility is `hard to reverse` or `contract change` and whose
   authority is not `person:`. `<owner>` is the deferral's owner, else the person or role
   the tickets or threads name for it, else `owner (not recorded)`.
3. `default taken`: a taken decision without alternatives weighed.
4. `evidenced`: a taken decision with alternatives weighed.

Every decision lands in exactly one class: an open deferral is 1 or 2; a taken decision is
2, 3, or 4. A prose claims file's decision sentences are classed the same way, from what
the record shows.

## Scope

A scope that holds `hygiene` claims (`hygiene`, `tests-hygiene`, `combined`) also writes
`## Scope` after `## Decisions`: one line for every `scope` claim, or `none` when there is
none.

```
## Scope
- claim <n> (<handoff ref or none>): introduced by the bundle: <yes | no | partly>, <evidence against the merge-base>; fix inside the bundle's repos: <yes | no, <repo>>; cost: <small | medium | large>, <why>; recommendation: <include | defer>, <reason>; handoff ranking: <rank and confidence, or none>; facts disagree with the handoff: <yes, <what the handoff states that the evidence contradicts> | no>; recommendation differs from the handoff: <yes | no>; finding: <finding id or none>
```

Decision and scope entries are report items, not findings. They never enter `ledger/5.md`,
`ledger/6.md`, or `ledger/7.md`, have no review gate, and never change the verdict counts.
An entry the auditor did not write is `not assessed`, and one the adversary left without a
line is `not challenged`; neither fails a scope. The agents still write every entry and
line.
When an entry shows a defect (a `stale deferral` or `needs <owner>` the bundle's work
depends on, or a scope fact that ships a regression), file a separate Q4 finding and name it
in the entry's `finding:` field. A defect the adversary finds first is a pass-two addition
(`<scope>-P<n>`). Those findings go through the gate like any other.

## Pass-two verdicts

An adversary gives each finding exactly one verdict, with evidence:

- `survives`: the finding stands as written.
- `downgraded`: the finding stands at a lower severity or a weaker label; give both.
- `reworded`: the defect is real but the title, scope, or reasoning is wrong; give the
  corrected text.
- `dropped`: the finding is wrong; give the counter-evidence.

```
### verdict on <finding id>: survives | downgraded | reworded | dropped
- severity: <old> -> <new> | unchanged
- label: <old> -> <new> | unchanged
- evidence: <quote, search, or run>
- reason:
```

After the verdicts, a pass-two adversary attacks the Verified OK list as the tier
allows (`## Verified OK challenged`, one line per item with its result), then, when the
pass-one report has `## Outward trace`, writes `## Outward trace challenged` (see
"Outward trace"), then writes `## Coverage gaps` and `## Map corrections`: map file,
line, what is wrong, and the source quote that shows it, or `none`.

At every tier, after `## Map corrections`, the adversary writes three challenge sections:

```
## Claims challenged
- claim <n>: upheld | overturned to <true, reproduced | false, contradicted | not verified, not reproduced>; evidence: <...>
## Decisions challenged
- claim <n>: agree | disagree, <class>; evidence: <...>
## Scope challenged
- claim <n>: agree | disagree, <what differs>; evidence: <...>
```

`## Claims challenged` has a line for every `verification` claim the report marks true, and
may add any other claim the adversary finds misjudged. `## Decisions challenged` and
`## Scope challenged` have a line for every entry of the report's `## Decisions` and
`## Scope`. Each heading is present, with `none` only when the report gives nothing to
challenge under it. A `disagree` line names the class or the field it disputes. Challenge
lines are not findings and are not in the ledger files.

## Output contract

Every agent:

1. Writes one output file, at the path its prompt names, and no other file, except
   command output in its own scratch folder when its prompt names one, kept raw. It runs
   no `sed -i` or other in-place edit; it rewrites its own output file with Write. A pass-one
   file holds, in order, its findings, `## Verified OK`, `## Outward trace` (a group or
   `combined` scope only), `## Claims`, `## Decisions`, and, in a scope that holds
   `hygiene` claims, `## Scope`. A pass-two file holds its verdicts,
   `## Verified OK challenged`, `## Outward trace challenged` (when the pass-one report
   has `## Outward trace`), `## Coverage gaps`, `## Map corrections`,
   `## Claims challenged`, `## Decisions challenged`, and `## Scope challenged`.
2. Lists every command it ran under a `runs:` heading, one per line: the command, the
   directory it ran in, and the exit status. `runs: none` when there were none.
3. Lists every digest and map file it read under a `consumed:` heading, one per line:
   the run-directory path and its hash from `git hash-object --no-filters <file>`.
   `consumed: none` when there were none.
4. Ends the file with the line `status: complete`, as its last line.
5. Returns only the output path and one line of status.

The merger alone may add an optional `opened:` heading, before `consumed:`, listing
each ledger file or section it opened (the path and the reason, one per line). It is not a
`runs:` entry, since the merger has no shell and `runs:` stays command, directory, and
exit status, or `none`.

A file without `status: complete` as its last line is a failed output, whatever the
agent returned.

```
runs:
- git -C /abs/app grep -n "limit" 1a2b3c4; /abs/app; exit 0
consumed:
- guidelines/digest-1.md 9f8e7d6c5b4a39281706f5e4d3c2b1a098765432
status: complete
```

Parsing rules, which `scripts/ledger.sh` enforces on every output it reads. A finding block
starts at a line `### <id>: <title>` and a verdict block at
`### verdict on <id>: <verdict>`. A block ends at the next line that starts `## ` or
`### `, or at a line that is exactly `runs:`, `runs: none`, `consumed:`,
`consumed: none`, `opened:`, `opened: none`, or `status: complete`; any other line that
starts with one of those words is body text. A complete file ends with `status: complete`
(the script checks it against the inventory). A fence line is one whose first non-blank
characters are three backticks; lines between two fence lines never start or end a block,
and a file that ends inside a fence is an error. An id is `<scope>-F<n>`,
`<scope>-P<n>`, `<scope>-T<n>`, `X<n>`, or `L<n>`, and is case-sensitive: a mis-cased id
heading is an error. A position line in a second-opinion answer may start with a list
number (`1. <id>: ...`).
A finding block has exactly one `- severity:` line and one `- label:` line, each with an
allowed value. A verdict block has exactly one verdict word and one `- severity:`,
`- label:`, and nonempty `- evidence:` line. A duplicate id, two verdicts for one id, a
verdict for an id with no finding, a pass-one finding with no verdict in a complete pass-two
file, and a malformed block are errors; the script prints
them and the stage that ran it fails.
