# Audit evidence rules for this run

This file is copied into the run directory as `audit-evidence.md` in stage 1, next to
`common.md`. Only the auditor and the adversary read it, and the Codex request and the
second-opinion fallback, which stand in for them. The digester, the mapper, and the merger
do not. It holds three sections that `common.md` points to: "Reverted test runs" and
"Rerun of a renamed run-once script", which belong to the "Evidence" rules, and
"Outward trace", which belongs to the finding schema and the output contract. They are
moved from `common.md` unchanged, and every rule of `common.md` still applies to them. A
section, rule, or hard rule named in them without a file is in `common.md`.

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
