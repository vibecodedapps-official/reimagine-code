# Decisions

This file records the design decisions behind cca 0.1.0, 0.2.0, and 0.3.0: the questions
the design settled, the five platform decisions confirmed against Claude Code before the
build, the choices made while building 0.1.0, the 0.2.0 and 0.3.0 decisions, the fixes
after 0.3.0, what is still open, and what is deferred past 0.3. It replaces the
pre-implementation spec, architecture, and build plan documents, in the repository
history before this change; their user-facing content is in `README.md`.

## Resolved questions (2026-09-30)

Settled during the design and its review rounds.

1. **Role agents.** Plugin agent definitions under `agents/`, with tool lists that
   exclude Edit and NotebookEdit, plus the read-only check at the end of every stage,
   because tool lists alone do not constrain Bash.
2. **Worktrees.** Not used. An exact export of the pinned tree into the run directory,
   with symlinks as placeholder files, gives agents a pinned tree without writing any
   repo metadata, so the read-only boundary needs no worktree exception.
3. **Azure DevOps.** Deferred. Exported ticket and thread files cover it in 0.1 (see
   "Exported forge files" in `README.md`).
4. **Run location.** The primary repo is the session's repo if it is a bundle, else the
   first bundle. The absolute run path is stored in `runs.json`.

## Platform decisions confirmed before the build (2026-09-30)

Probed on Claude Code 2.1.284, from the Claude Code documentation and from what a
session on that version showed. Each entry says which part is documented and which is
only observed.

1. **Agent type name.** Documented: a plugin agent's type for the Agent tool is
   `<plugin>:<agent>`, and agents are read from `agents/` at the plugin root. So the
   types are `cca:digester`, `cca:mapper`, `cca:auditor`, `cca:adversary`, and
   `cca:merger`.
2. **Model override.** Documented: the Agent tool's `model` parameter takes precedence
   over an agent's frontmatter `model` since Claude Code 2.1.251. Frontmatter accepts
   `sonnet`, `opus`, `haiku`, `fable`, a full model id, or `inherit`. cca records the
   model it requested; it does not collect the model actually used, so the report says
   "requested".
3. **Tokens and duration.** Documented: background agent completion notifications
   carry no token or duration fields. Observed: the task notification in a 2.1.284
   session carried `subagent_tokens`, `tool_uses`, and `duration_ms`. The scope of
   `subagent_tokens` is not documented. `usage.md` therefore labels every token number
   "task notification, subagent_tokens; scope not documented", and no total is
   presented as exact.
4. **Plugin data and root paths.** Documented: `${CLAUDE_PLUGIN_DATA}` resolves to the
   plugin's data directory under `~/.claude/plugins/data/`, and it and
   `${CLAUDE_PLUGIN_ROOT}` are substituted in skill, command, and agent content. They
   are not exported into the Bash tool's environment. The skill text carries them
   literally so they are substituted at load. Observed: codex-lite writes its request
   and thread files into its own data directory, and no permission prompt appeared for
   that in the probing session, which ran in auto mode.
5. **Fan-out.** The Agent tool, not the Workflow tool. This is a design choice, not a
   platform fact: the queue mixes stages and reacts to each completion, and the
   orchestrator must stay able to ask the user mid-run. Workflow agents cannot be
   continued or interleaved with user questions.

## Implementation decisions (2026-09-30)

Choices made while building 0.1.0 where the design left room.

- **Scope of the release.** 0.1.0 implements the whole design, milestones M0 to M7, as
  files. Tagging and publishing the release are separate steps that need approval.
- **Unapplied map corrections.** A map correction that a top-up raises is not reissued
  (one round). It is recorded under "Map corrections not applied" in `ledger/5.md` and
  in the stage 5 entry of `stages.json`, not appended to `audit-brief.md`. The brief is
  a stage 1 output whose hash every later stage records, so editing it would make resume
  rerun every stage.
- **Finding ids and origin tags.** Pass one findings are `<group>-F<n>`. A pass-two
  addition is `<group>-P<n>` with `origin: pass2`; a map-correction top-up finding is
  `<group>-T<n>` with `origin: topup`; a second-opinion addition is `X<n>` with
  `origin: codex`; a late adversary finding is `L<n>` with `origin: late`. Converged
  items are `C<n>`.
- **Contested items in the verdict.** A contested item whose counted severity is
  `blocker` or `high` gives `not ready`, as an agreed one does. The counted severity
  follows the contested rules (the higher severity only when that position is a
  `verified fact`).
- **`--models` values.** Only the Agent tool's short model names are accepted: `opus`,
  `sonnet`, `haiku`, `fable`. Any other value is rejected in one line.
- **Empty inputs.** A command with no prompt inputs states `inputs: none` in the
  invocation block it hands to the skill.
- **Paths between skill files.** The skill and its stage files and templates refer to
  each other through `${CLAUDE_PLUGIN_ROOT}`, and the orchestrator reads them with the
  Read tool, not through Bash.
- **Group derivation (2026-10-01).** A changed file touched by a commit whose message
  references a ticket belongs to that ticket's group, and to each such group when
  several tickets' commits touch it, so a file three tickets touch reaches
  `cross-cutting`. The pre-implementation text counted only files the ticket, PR, or
  commit texts name, and files touched by one ticket's commits alone.
- **Planning documents.** The pre-implementation spec, architecture, and build plan
  documents were removed from source control once implemented. Their user-facing
  content moved to `README.md`, and their decisions, open items, and deferred list to
  this file. Acceptance results are in `docs/acceptance.md`.

## Open items

- **`gh api` pre-approval.** Whether `gh api` GET calls can be pre-approved narrowly
  enough in `allowed-tools` is not settled. They are left out of `allowed-tools`, so the
  session prompts for them at run time.
- **Path substitution in stage files.** Whether `${CLAUDE_PLUGIN_ROOT}` is substituted
  inside stage files that the orchestrator reads later with the Read tool is not
  confirmed. `SKILL.md` tells the orchestrator to resolve such a reference to the same
  directory it learned when the skill loaded.
- **Data directory depends on how the plugin is loaded.** Observed 2026-10-01: with
  `--plugin-dir`, the plugin data directory id was `cca-inline`, so `runs.json` lives
  under `~/.claude/plugins/data/cca-inline/` in a plugin-dir session and under the
  marketplace install's id in an installed one. A run started one way is not found by
  `/cca:resume` or `/cca:act` started the other way.
- **Status of stages the budget skips (2026-10-01).** In the budget-0 acceptance run the
  orchestrator improvised a free-text status for stages 4 to 7, outside the skill's
  status set, so the skill now records a never-started stage as `failed` with the reason
  "not run: budget expired"; whether later runs follow it is not yet observed.
- **Inline Codex requests (resolved 2026-10-01, in 0.2.0).** The first request no
  longer has an inline form, so the cap and the diff dropping left it. See "Absolute-path
  Codex requests" under the 0.2.0 decisions. The follow-up still carries an input Codex
  could not open inline, under the 450,000-byte cap.
  Stage 6 also checks that the answer gives a position for every mandatory finding id
  (every blocker or high finding and every pass-two downgrade or drop).

## Round 4 review fixes (2026-09-30)

- B1: fetches are explicit and tag-free into remote-tracking refs only, with no
  `--prune`; the pinned shas are verified after the fetch and the commands are recorded
  in the approval, which covers only those commands (different planned commands are
  asked again), except that an approval for a bare name covers the `ls-remote` check and
  either candidate refspec for it, with the resolved kind (`tag` or `branch`) recorded
  in the entry's `resolved` map so resume matches it without contacting the remote; the
  fetch also covers tags (to `refs/remotes/<remote>/tags/<name>`) and shas (to
  `refs/remotes/<remote>/cca/<sha>`) from each repo's selected remote, and a
  `<other remote>/<branch>` ref from that configured remote. Every ref mapping is
  recorded in the brief for resume. The remote of a GitHub PR bundle is the one whose
  URL names the PR's owner and repo (from `url` in `pr.json`), else `origin`, else the
  only remote, settled at section C; for other repos it is selected lazily, only when
  step 1a needs a fetch, and several remotes without `origin` stop the run only then. A
  PR bundle whose repo has no remote stops with `bundle <name>: no remote`.
- B2: a GitHub PR bundle's base is pinned to the local sha of `<remote>/<baseRefName>`
  after step 1a and its approved fetch, which refreshes the base branch for every
  GitHub PR bundle and every remote-tracking `base` ref. The
  PR's `baseRefOid` is GitHub's cached base at the last sync, not the live branch tip,
  so it is recorded in the brief as information only and never pinned or compared.
  Whenever any fetch for a bundle's repo is approved, the base branch is fetched with
  it, since a present remote-tracking ref may be behind. Every restricted fetch passes
  `--refmap=` so a configured refspec cannot write a local tag. Resume stops for a
  changed head or a changed base sha alike: the brief's base commit list and overlap
  set depend on the base tip, so an unchanged merge base does not make them current
  (a 2026-09-30 review reversed the earlier merge-base shortcut).
- B3: each `gh` call is made once and saved by shell redirect, never through the model;
  the PR output is saved unprojected as `pr.json`, and `pr.hash.json`, a `jq` projection
  without the shas and viewer-dependent fields (which would otherwise invalidate stage 1
  under another login), is what `forge_hashes` hashes. Resume re-queries once into
  `pr.json.new`, projects it the same way, and hashes by `git hash-object --stdin`; a
  `gh` or `jq` failure stops resume. `jq` is required for GitHub PRs.
- Run directory: it is created before the PR is read (the run id comes from the
  manifest, with no `gh` call; for a `file:` PR export the slug uses the export's `id`,
  else the bundle's `branch`, never the path), so `pr.json` can be written by redirect;
  a stop in that section removes it.
- B4: resume reads `manifest.json` and `stages.json` first and reruns from stage 1 when
  stage 1 is missing, running, or has no brief, or when `stages.json` is missing; only
  a missing `manifest.json` is unrecoverable. Resume never moves `manifest.json`, its
  walk list includes `tmp/`, and on the stage-1-rerun path stale `pr.json.new` files
  are removed first.
- B5: stage 6 requires a position for every mandatory id, and every mandatory id is
  requested in a run that completes. Above 60 ids the asks are batched: Codex gets the
  first batch in the request, and its one follow-up asks for at most 60 positions
  (missing first-batch ids first, then second-batch ids as far as 60 allows); every id
  neither carries goes to the fallback in batches of at most 60, one launch per batch
  (scope `second-opinion-<k>`), recorded as a partial swap (reason "mandatory ids
  beyond the Codex request and follow-up"). With no Codex the fallback is launched once
  per batch. A fallback batch fails stage 6 only when it fails after the ladder;
  `missing_positions` holds the ids Codex was asked for and left without a position
  after the follow-up and those of a failed fallback
  batch.
- C1: a text file over 450,000 bytes is split into byte-range chunks, listed in
  `split_files` and in the report's Coverage. The orchestrator measures an exported
  file in place and copies a directly read tree's file once under the run's `tmp/` (run
  state, never an input or output, removed on every exit of step 3) to compute the
  ranges, and a digester reads its range in slices of up to 24,000 bytes ending at the
  last LF (a Bash result is cut near 30,000 characters), numbering lines through one
  `awk` stage so every quoted line has an absolute number, ending `status: failed at
  byte <offset>` when it did not reach the end.
- C2: split-mode group mergers read a per-group slice under `ledger/slices/`, not the
  whole ledger files; a ledger file or section a merger opens is recorded under
  `opened:`. The slices are written by shell (`awk`, `grep`, `printf`, redirects), never
  through the model, with `<run dir>/tmp/block.md` as scratch.
- C3: an over-cap Codex request is reduced by dropping the diffs of bundles whose repo
  is the session repository (others are never dropped, since Codex cannot reach them)
  before the swap, recorded as `inline_reduced`; still over the cap, or with none
  droppable, it swaps with the reason "request too large for inline form". (Removed in
  0.2.0; see "Absolute-path Codex requests".)

## 0.2.0 decisions (2026-10-01)

0.2.0 closes five gaps that one real audit of 0.1.0 found (F1 to F5) and adds a typed
handoff from the build session to the audit with a return trip (H1 to H5). The plan was
reviewed twice by a second opinion before implementation; the settled findings are listed
below. Nothing was run against a live audit; the acceptance record keeps every
agent-driven case `not run` until one runs.

- **Manifest `scratch` key (F1).** A repo may keep its scratch directory under any
  ignored name. The key must name a path inside the primary repo that the repo ignores,
  or the run stops before stage 1. The run directory then lands in the repo, under the
  name the repo already uses for scratch. A resumed run keeps its
  recorded directory, since moving it would orphan the run's state.
- **Absolute-path Codex requests (2026-10-01).** A probe ran Codex in codex-lite's
  read-only sandbox on Windows with the elevated sandbox. It read a token file outside
  every repository by absolute path and quoted it exactly. So the request now names every
  input by absolute path, for any run directory, and the inline first request, its cap,
  the diff dropping, and `inline_reduced` are gone. Only an input Codex did not acknowledge
  with its sentinel goes inline, in the one follow-up, under the 450,000-byte cap; over
  it, stage 6 fails. No codex-lite change was needed, so the `--cwd` item (F6) is dropped
  from the deferred list. Limits: Linux and macOS rely on Codex's documented read-only
  policy, not a run here. The sentinel check catches a read that fails, so a platform
  where it fails is detected, not trusted. Audited sources were never sentinel-checked
  and stay named by read path and sha.
- **Release wording (F2).** The README says what ran and what has not, matching the
  acceptance record. The first medium-tier run on a real bundle is the acceptance run.
- **The read-only check is a script (F3).** The check is the step most likely to be
  skipped or botched on a long run, so `readonly.sh` takes a snapshot and compares it, and
  the orchestrator keeps only the judgment the script cannot make. Exit 2 (the check could
  not complete) ends the run `blocked`, since the boundary could not be checked.
- **Sub-second mtime replaces the second channel.** 0.1 caught a same-size rewrite within
  one second with a second "newer than the marker" channel. The inventory now records
  modification time at sub-second precision, so the channel is not needed, and a write
  made while a snapshot ran is not reported again once it is in an accepted inventory.
  Each audited repo has its own marker. The ignored base for the next check is the last
  check that passed. Pending ignored differences are reconciled after every check that
  did not exit 1 or 2, so a pending write never escapes attribution.
- **Quoted paths are unsupported.** A path git prints quoted (one holding a double quote,
  backslash, tab, newline, or control character) fails the check with exit 2 naming it,
  instead of risking a wrong comparison. Failing closed fits the boundary.
- **Sizing note (F4).** The README tells a user to size sources before a first run, since
  an export copies every tracked blob at the pinned sha, and agents run no test or lint
  command in an exported tree. `skills/cca/common.md` now states that as broadly as the
  auditor's boundary does.
- **Work-item operations plan (F5).** Stage 8 writes `work-items.jsonl`, one JSON object
  per operation, with `$new:<key>` placeholders, for a forge adapter or a person to apply.
  It is validated before the report is hashed and carries no report revision: a resume
  that rewrites the report supersedes the file with it. `/cca:act` applies none of it, so
  no write path to a forge is added.
- **The handoff command is an inline command, not a skill.** A skill named `handoff` would
  collide with the command name, so `commands/handoff.md` holds the whole procedure.
- **Typed claims (H2).** Five kinds, so each is checked the way its kind needs. A
  handoff's kinds come from `handoff.sh claims`, never from judgment, and one item is one
  claim, never split further. Prose files keep the sentence split with a kind per sentence,
  by an ordered rule (verification first).
- **Verification claims (departure from the feedback).** The feedback says a verification
  claim "counts as false unless the audit reproduces the check". 0.2.0 never marks an
  unreproduced verification claim `true`, but marks it `not verified` with the reason
  `not reproduced`, and lists it in `claims-verdicts.md` as a recheck request, not a
  correction. `false` stays reserved for counter-evidence. Reason: an audit that lacks
  access (a declined live check, an expired budget, an exported tree) would otherwise tell
  the build session to correct a statement that may be accurate, which is the memory
  damage the return trip exists to prevent. The acceptance case reads: a verification claim
  the fixture cannot reproduce is never reported `true`, and appears as a recheck request.
  The owner can reverse this.
- **A run under another setup is not counter-evidence.** A suite run without an
  environment variable it needs, or in another directory, can fail for that reason alone.
  Such a run leaves the claim `not verified, not reproduced`, because a `false` from it
  would rewrite an accurate statement, which the departure above exists to prevent.
- **Reproduction is not proof the check ran.** A reproduced result does not show that the
  build session ran its stated check, and the report says so once.
- **Decision classes (H3).** The class follows from three dimensions read from the record:
  resolution (taken, open deferral, settled later), authority (a person, a role, a
  checkpoint, not recorded), and evidence (alternatives weighed, or not). The classes are
  `stale deferral`, `needs <owner>`, `default taken`, and `evidenced`, the first that
  holds, with the reversibility class 0.1 already had. Evidence counts only from a record
  the auditor can open; the handoff's own `rejected` lines are claims, not that record.
  A checkpoint pointer cannot be opened, so a build session that wants a checkpoint choice
  to count records it in a commit body or ticket comment. A deferral stays a deferral:
  `/cca:handoff` never rewrites its status.
- **Decision and scope entries are not findings.** They are report items with their own
  sections, never enter `ledger/5.md`, `ledger/6.md`, or `ledger/7.md`, have no review
  gate, and never change the verdict counts. When an entry shows a defect, the auditor
  files a separate Q4 finding, which goes through the gate like any other. This keeps the
  review gate's meaning, and the verdict counts, unchanged. For the same reason a missing
  entry or challenge line does not fail a scope: a missing auditor entry is recorded as
  `not assessed` (verdict `not verified`, reason "not assessed"), and a missing adversary
  line as `not challenged`. The completeness gate for `verification` claims is unchanged.
- **Scope check (H4).** For a raised ticket, the hygiene scope states whether the bundle
  introduced the behavior, whether the fix lies inside the bundle's repos, and the cost,
  then include or defer. It records disagreement with the handoff on the facts and on the
  recommendation separately, since a handoff can be right on one and wrong on the other.
  The acceptance case asserts the facts, not the recommendation.
- **Return trip (H5).** `claims-verdicts.md` carries the report's revision and, for each
  claims file, its hash, and each line carries the claim's text. A line applies only when
  the hash and text match, so a file edited since the audit is not silently corrected.
  `/cca:handoff --verdicts` reads the file before anything else.
- **Base of a bundle in `/cca:handoff`.** The manifest's `base`, else the PR's base
  branch, else the repository's default branch with a confirmation. A branch's upstream
  tracking ref is never the base, since it is the branch's own remote copy.
- **Handoff identity and grammar.** Bundle names are slugs that match the stage 1 names,
  ticket ids are unique across the handoff and qualified when short ids collide, a
  decision's ticket resolves among tickets first, every key appears once in a fixed order,
  and a `## Bundles` line is split from the right. Each rule exists so the script can
  validate with no judgment and every error carries a line number.
- **A handoff needs a bundle.** `## Bundles` needs at least one bundle, while `## Tickets`,
  `## Decisions`, and `## Raised tickets` may each hold `none`. Every other item refers to a bundle, and a
  bundle with no tickets is valid.
- **Relative `repo` paths in a handoff.** A relative `repo` path is relative to the handoff
  file, as manifest paths are to the manifest. `/cca:handoff` writes absolute paths, so the
  file can move.
- **`claims-verdicts.md` entry layout.** `text:` and `correction:` sit on their own
  indented lines under each entry's main line, so a `; ` inside either cannot be misread
  as a field separator.
- **Version string.** A 0.1.0 run resumed under 0.2.0 reruns from stage 1, by the existing
  input-hash rule, since the stage files it was built from changed.

Review findings on the first plan draft, and how each was settled:

1. Unreproduced verification is not false: taken (the departure above).
2. The ignored check lost the newer-than-marker channel: taken, with a marker per snapshot
   and the last passing check as the ignored base, then superseded by sub-second mtime.
3. A branch's upstream is not its base: taken.
4. Decision classes mixed dimensions, and the handoff command erased deferrals: taken, with
   the three dimensions and the rule that a deferral keeps its status.
5. Handoff identities (bundle suffixes, ticket-to-bundle links, qualified refs, and the
   mapping to manifest ids): taken.
6. Grammar ambiguity (key multiplicity and order, non-empty values, option cardinality,
   first-occurrence splits, tabs, CR, versions): taken.
7. Script failure and filename handling, and portability coverage: taken, with exit 2 and
   the CI matrix.
8. Completeness of decision and scope entries, and defect promotion: taken, with completion
   checks in stages 4 and 5.
9. Return-trip provenance (file hash and claim text) and reading `--verdicts` first: taken.
10. The work-item contract contradicted itself on forge ids and had no real validation:
    taken.
11. The raised-ticket case asserted a recommendation: it now asserts the facts only.
12. Conditional acceptance expectations, the export-runs policy, and more grammar test
    cases: taken.

Review findings on the second plan draft:

- Ticket identity: ids unique across the handoff, qualified when short ids collide, raised
  `ticket` values unique, and a decision's ticket resolves among tickets first.
- Grammar: bundle names are slugs, the Bundles line is split from the right, and every
  listed bundle must exist.
- Operations validation: the validator also checks `run`, `C<n>`, and claim references
  against the report body and `claims.md`, before hashing, and operations carry no
  revision.
- Pending ignored writes: reconciled after every check that did not exit 1 or 2.
- Self-certified decision evidence: only a record the auditor opened counts.
- Validation after the report was final: moved before hashing.
- A write during a snapshot reported again: sub-second mtime replaces the marker channel
  for ignored files.
- GNU-only `touch -d` in the test: the ISO form both GNU and macOS accept, with the times
  asserted before the result.

## 0.3.0 decisions (2026-10-01)

0.3.0 closes issues #5 to #11: auditing uncommitted work, env tags, live results fed back
into a run, parent and links keys, more work-item operations, a ticket token, and memory
reconciliation. The plan was reviewed ten times by a second opinion before implementation;
the settled findings are listed below. Nothing was run against a live audit; the
acceptance record keeps every agent-driven case `not run` until one runs.

Decisions taken with the user:

- **gh 2.73.0 for GitHub tickets.** Hygiene checks closing-PR links, which
  `closedByPullRequestsReferences` gives and older gh lacks. Azure DevOps and other forges
  are unaffected: their exports already carry parent and links.
- **Live results for `X<n>` and `L<n>`.** Accepted, through carried findings (below).
- **Live bookkeeping is a script.** `live.sh` (`check`, `import`, `active`, `carry`,
  `assemble`, `retire`) holds the file bookkeeping; the orchestrator keeps only the
  derivation, a judgment.
- **`ticket_token` takes a string or a list of templates.**
- **New fixture material.** The `tokens` fixture, and `manifest-working-tree.json` in
  `solo` and `solo-dirty`.

Settled choices:

- **Working-tree head (#5).** The bundle key `head: working-tree` is manifest only and
  needs the bundle's branch checked out. Stage 1 step 1c builds the head with
  `working-tree.sh build`, into a temp index, with a fixed author, date, and message and
  `--no-gpg-sign`, so the same tree gives the same sha and a resume can rebuild a pruned
  head. The only writes are objects, disclosed in Coverage along with the head having no
  ref. The bundle is read directly, searched with `git grep <head sha>`; untracked files
  at audit time are part of the head.
- **Refusals.** No HEAD commit, a sparse checkout, skip-worktree or assume-unchanged
  paths, unmerged paths, a dirty submodule, an untracked nested repository, Git LFS, a
  filter with a `clean` or `process` program, and a quoted path. A dirty submodule's files
  are not in the parent's tree, so a rebuild could give the same sha after they change.
  Filters are never disabled, since the tree would then differ from the user's own commit.
- **Act drift.** Decided by the committed tree, not ancestry, plus any commit act did not
  log; an unchanged clean `HEAD` and a rewritten history with the same tree are not drift.
- **Resume after a pruned head.** Resume snapshots, rebuilds, and checks read-only; an
  unchanged tree gives the same sha, a different one is a changed head, handled as before.
- **Env tags (#6).** A verified entry whose check starts `env: ` must read
  `env: <name>; <check>`. Such a claim is never `true` or `false` from a run here, since a
  run here is another environment. It is `not verified, not reproduced`, listed in section
  9, and `claims-verdicts.md` calls it `not reproducible here`, not a recheck request.
  `--verdicts` applies nothing for it and `memory.sh` ignores it.
- **Live file format (#11).** A `--live` file names a finding id of a Live checks block, or
  `claim <n>`, never `C<n>`, which is not stable across a rerun. The validator recomputes
  the report body's SHA-256, matches the report's revision and the block's query exactly,
  and, for a claim, its `env`. An environment named only inside free-text `where` does not
  identify it.
- **Imports are the record.** `live/results-<k>.md` is an import once renamed into place,
  numbered across the run and never moved. Only retirements are logged
  (`live/retired.md`). The derived `live/findings.md`, `live/claims.md`, and
  `live/carried/` are rebuilt from the active imports, never created empty, and a `.pending`
  copy is never read.
- **Carried findings.** A rerun renumbers `X<n>` and `L<n>`, so a result for one carries
  the finding's block in `live/carried/<id>.md`, written once. The id is reserved on the
  rerun, and the carried finding goes through both reviews like any other.
- **Review of a live result.** A finding in `live/findings.md` counts only after stage 6
  gave a position and the late adversary a verdict. Until then every position on it from the
  rerun, and its derivation, is `pending review` and cannot set an item's severity, label,
  or disposition. Reruns from stage 5 or earlier retire the imports first.
- **Script exit codes.** `live.sh` exits 0, 1 for named validation and state errors on
  stdout, and 2 for usage and any failed operation on stderr. Writes go through a temp file
  and a rename, and a rerun after a failure completes the job.
- **Parent and links (#7).** Optional keys `parent` and `links` on tickets and raised
  tickets; `links: none` is a checkable claim. `cca-handoff: 1` stays, so ccl must check for
  cca 0.3.0 or later before writing them. `/cca:handoff` fills them from the record only.
  `gh issue view` has no parent field, so stage 1 and `/cca:handoff` read a GitHub
  ticket's parent with a GraphQL query, saved as `<ticket>.parent.json` and hashed.
- **Work items (#8).** `update_comment`, `remove_link`, and `set_fields`; `mentions` on
  every op with `text`; `W<n>` items for an op that exists only to support another. The
  validator rejects unknown keys and an op that reaches no `C<n>` or `claim <n>`, directly
  or through a `W<n>`, so a `W` cycle fails.
- **Ticket token (#9).** A literal template with `{n}` once, never a regex, matched with
  the base boundary outside the whole token, for exported tickets only. A list is allowed
  because `#{n}` does not match `AB#4567`, and Azure DevOps commits write both.
- **Memory reconciliation (#10).** `memory.sh find` prints, never edits. Keys are the
  ticket id, quoted names, and words that are a number, a sha, or an id; a free phrase is
  never a key. Stage 8 writes a `ticket:` sub-line to `claims-verdicts.md` so the script
  needs no second file. A 0.2.0 file has none, and the script uses the text alone.
- **Not done.** Keeping `C<n>` stable across a stage 7 rerun: live entries use finding ids,
  and act binds to the revision.

Probes (2026-10-01, git 2.55.0.windows.5, gh 2.91.0, Git Bash, isolated config):

- Building a commit from a temp index with `read-tree`, `add -A`, `write-tree`, and
  `commit-tree` twice gave the same sha, left `.git/index` unchanged, and made no ref.
- With `commit.gpgSign=true` and `gpg.program=false`, `commit-tree` still exited 0, so this
  git does not sign from config; the script passes `--no-gpg-sign` anyway.
- A skip-worktree file removed from disk was missing from the built tree, so it would read
  as a deletion; flagged paths and sparse checkouts are refused. (Note, 2026-10-02: this
  probe built from `read-tree HEAD`. The shipped build copies the repo's index, which
  holds the flag, so the path stays at its index version; see Fixes after 0.3.1.)
- `git check-attr --stdin filter` printed `lfs` for a `filter=lfs` path and `unspecified`
  for the rest.
- `gh issue view --json` has no parent field and offers `closedByPullRequestsReferences`,
  first named in the gh v2.73.0 release notes.
- ccl#25 is the merged ccl 0.9.0 PR, not an open issue; ccl writing `parent` and `links`
  is ccl#26, opened 2026-10-02.

Review findings, by round, and how each was settled:

1. Round 1, 11 findings, all taken. `X<n>` and `L<n>` ids do not survive a rerun
   (replaced in round 2); results could be installed for a resume that cannot use them
   (eligibility first, retire on early reruns); a reviewed duplicate could let an item count
   at an unreviewed severity (unreviewed derivations stay out of positions); clean filters
   other than LFS can run programs (refuse any driver with `clean` or `process`, resume
   snapshots and checks around its rebuild); act kept an ancestry test (drift is the
   committed tree); a result of another query could settle a finding (the validator requires
   the query exactly); hygiene could not check GitHub links (fetch the closing PRs); memory
   keys dropped literals and took words with digits (explicit grammars); a claim-only
   import would create an empty `live/findings.md` (derived files never empty); `ticket_token`
   did not say literal or regex (literal templates, boundary outside the token); test gaps.
2. Round 2: round 1 items 4 to 10 resolved, 4 reopened, 7 new, all taken. `X<n>`/`L<n>`
   results now carry the finding and reserve its id;
   approval sources could collide after a retirement
   (imports numbered across the run); a position on a live finding could promote it before
   the late adversary saw it (`pending review`); the validated file was not the imported one
   (validate the copy, then rename); an environment as a word in `where` did not identify it
   (an exact `env` key); the validator trusted the revision header (recompute the body hash);
   a recorded `absent` input read as missing (the optional-input rule); low-tier rules made
   live-reviewed `P`/`T` findings provisional (a live exception); stage 8 read challenge
   lines from an unhashed file (`late/adversary.md` is an input); dirty submodules and
   untracked nested repositories are not in the synthetic tree (refused); test gaps.
3. Round 3, 2 reopened, 2 new, all taken, by simplifying the import model: the results
   files are the import record, only retirements are logged, derived files are rebuilt from
   the active imports; a carried finding is kept once in `live/carried/<id>.md`; a deleted
   derived file is rebuilt; carried text counts toward the split threshold.
4. Round 4, 2 findings, both taken: stage 8's fallback includes carried findings, gated by
   the live rule (V3-y); a discarded `.pending` number may be reused, since only committed
   imports have approvals to protect. The agent-driven cases were renumbered V3-j to V3-ah.
5. Round 5 found nothing in a full reread. A later reread found reconciliation ordered
   before step 6 picks the rerun stage, which retirement depends on. Round 6 on that fix:
   reconcile also when no stage reruns, recompute after reconciling, apply the eligibility
   stop with `--live` only, and remove `.pending` copies on the retirement path. Taken.
6. Round 7, on the move of bookkeeping into `live.sh`, 3 findings, all taken: exit codes for
   every mode and resume stopping on any nonzero one; literal outputs, errors, and grammars
   for entries, derived files, and `retired.md`; tests for replay, rebuild, numeric order,
   `carry L1`, malformed state, operational failures, and recovery after a partial `retire`
   or `assemble`.
7. Round 8, 2 left, both taken: the malformed derived file message got its exact text and
   order; "exit 1 writes nothing" now allows `import`'s `.pending` cleanup and an empty
   `live/`.
8. Round 9, 1 open, taken: `retire` read `live/retired.md` after removing `.pending` files,
   so it checks first and exits 1 having changed nothing.
9. Round 10 found nothing in a full reread of the `live.sh` contract and its tests.

The final review of the branch against `main` found 2, both taken:

1. The stage 1 baseline ran `git status` before `working-tree.sh` refused a program
   filter, so a clean filter or an fsmonitor hook could run first. `working-tree.sh check`
   runs the refusals alone, writing nothing, in A.4 and before resume's snapshot, and
   `readonly.sh` runs its index-reading git calls with fsmonitor off.
2. Building from `read-tree HEAD` dropped a file staged with `git add -f` despite an
   ignore rule. The temporary index is now a copy of the repo's own index (`cp -p`), so
   the head is what `git add -A && git commit` would make.

Later rounds of the same review, each fix shown failing on the old script first, all in
`working-tree.sh`:

3. A submodule's own clean filter ran inside the recursive `git status` on a same-size
   edit. The filter scan now covers every checked-out submodule before any status.
4. A `post-index-change` hook ran during `add -A`; every git call now points
   `core.hooksPath` at an empty directory. A dirty submodule staged as a rename was a
   porcelain type 2 record the refusal did not read; status now runs with
   `--no-renames`.
5. A driver literally named `set`, `unset`, or `unspecified` was skipped; it is now
   checked like any other. The skip-worktree and assume-unchanged refusal now runs in
   every checked-out submodule.
6. A missing index file let attributes the scan could not see come back from HEAD in a
   fallback build. A repo or checked-out submodule with no index file is now refused,
   and the fallback is gone.

A review of PR #12 on 2026-10-02 found 6. Two were taken, each shown failing first:

1. A submodule path git quotes was skipped by the filter scan, yet `git status` still ran
   and recursed into it, running its clean filter (a DEL in the name reproduces it on
   Windows too). Inside a submodule, the quoted path was not refused at all. Such a path,
   at any depth, is now refused as a quoted path, and `git status` is skipped.
2. Without `jq`, `live.sh import` kept the results file and the `active` that follows
   failed, so every later resume of the run stopped. `import` now exits 2 before it
   writes anything, and the README lists `jq` for `--live`.

Three findings about unbounded agent inputs (a live result value of any length, every
memory match, and every untracked file in the brief) join the deferred bounded-loading
item below. The proposal to split the PR was declined: 0.3.0 was planned as one PR.

A PR comment the same day found that hygiene checked a GitHub ticket's `parent` against
forge data that held none: stage 1 saved no parent, and `/cca:handoff` wrote none. With
ccl writing a GitHub `parent` (ccl#26), a right value could read as a mismatch. Taken:
stage 1 saves the parent from GraphQL as `<ticket>.parent.json`, hashed in
`forge_hashes` and rechecked by resume, `<ticket>.md` lists it, and `/cca:handoff` fills
it. The query and its projection were run on 2026-10-02 against an issue with a parent
(cli/cli#14529, giving `{"parent":{"number":14563,"repo":"cli/cli","url":...}}`) and one
without (giving `{"parent":null}`). Documenting the gap instead was rejected: every
handoff with a GitHub parent would carry a permanent gap line.

## Fixes after 0.3.0 (2026-10-02)

- **Forge host (#13).** Stage 1's four GitHub reads (`gh pr view`, the review threads,
  `gh issue view`, and the GraphQL parent read) named no host, so gh sent them to its
  default host: `GH_HOST` when set, else the only saved login. With only a GitHub
  Enterprise login saved and `GH_TOKEN` holding a github.com token, the reads of a
  github.com bundle went to the Enterprise host. There they failed, so the audit had no
  forge data, or, when that host had a repository with the same owner and name, returned
  that repository's PR, ticket, and parent. Every read now names its host:
  `-R <host>/<owner>/<repo>` for `gh pr view` and `gh issue view`, and
  `--hostname <host>` for both `gh api` calls. `github.com` is named too, so no read
  depends on gh's default.
- **Where the host comes from.** A3 settles `<host>` for every GitHub PR and ticket id it
  normalizes, PR first, by first match: the host of its URL, when the id was given as
  one; else the host of the bundle repo's remote whose fetch URL names that owner and
  repo and gives a host, taking `origin`'s when such remotes differ and `origin` is one
  of them, and stopping the run when it is not; else, for a ticket, the host of its
  bundle's PR; else `github.com`. Only fetch URLs count, so a push URL on another host
  does not stop the run. No rule takes the host of an unrelated remote such as `origin`,
  since a GitLab `origin` would send GitHub reads to GitLab. So a branch-only bundle on
  an Enterprise host, whose ticket names a repository no remote names, falls to
  `github.com`, where gh's default host used to get it right; the workaround is to give
  the ticket as a URL. A local path, including a Windows path such as `C:/src/app`,
  gives no host. An `https://` host keeps its `:port`, since gh names such a host with
  its port; userinfo such as `user:token@` is dropped. Hosts are compared lowercased and
  without a default port. Each repo's remote hosts are resolved once per run. These ids
  are settled before any read because nothing read later can give their host: the
  normalized id `github:owner/repo#n` holds no host, and A5 selects the remote from the
  `url` in `pr.json`, which is the output of the read that needs the host. A ticket
  known only from the PR's `closingIssuesReferences` takes the host of its `url` there.
  The host is not stored in the id, so `manifest.json` and the id formats are
  unchanged. Section C reuses a `pr.json.new` only when its `url` names the bundle's
  host as well as its owner, repo, and PR number.
- **SSH hosts.** An SSH remote names `github.com` or `ssh.github.com` (GitHub's SSH over
  port 443), both read as `github.com`, or another host, which may be an SSH config
  alias such as `github-work` that gh does not know. Such a host counts only when gh
  knows it: `gh auth status --json hosts --hostname <host>` lists it, run once per
  distinct host. An unknown host gives no host and the next rule applies. The check asks
  whether gh knows the host, never whether its login works: plain
  `gh auth status --hostname <host>` exits 1 when any account on the host has a broken
  login, and reading that as "unknown" would send an Enterprise ticket with an expired
  token to `github.com`, where a same-named public repository could feed the audit
  wrong data. A known host with a broken login stays the host, and its read fails and
  stops the run. The `--json` form exits 0 in both cases; it needs gh 2.81.0, and with
  an older gh, or any other output, the run stops and asks for the id as a URL rather
  than guess. The check is not pre-approved, since a `*` pattern would also allow
  `--show-token`, so it may prompt. Resolving aliases with `ssh -G` was tried and
  dropped: OpenSSH runs `Match exec` commands from the SSH config during `ssh -G`, which
  breaks the read-only contract. When the PR read or a named ticket's read fails, stage
  1 stops with one line that names the host it queried and says to give the id as a URL
  when the host is wrong. Before this change such a read went to gh's default host and
  might have worked.
- **Gaps, not stops.** A ticket known only from the PR's `closingIssuesReferences`, and
  any ticket's parent read, take their host from a read that succeeded, so their
  failure is not a wrong host. The token may not reach the closing issue's repository,
  or a GitHub Enterprise Server version may have no `parent` field on its GraphQL
  `Issue` type. Stopping there would end every such audit with a hint the user cannot
  act on, so the read is a gap: the brief lists it with the host and gh's error, the
  ticket file says `not read` or `parent: not read`, and the auditor treats `not read`
  as a gap in what could be checked, never a mismatch. A gap writes no file, so
  `forge_hashes` cannot recheck it; stage 1 records it in `forge_gaps` with the
  ticket's URL instead, and resume retries each one. A read that now succeeds
  invalidates stage 1, so evidence that became readable is not left out for good; one
  that still fails leaves the gap and does not stop resume, since a missing `parent`
  field never comes back on its own.
- **Resume.** Unless stage 1 reruns, resume names the host stage 1 used, read from the
  `url` in the saved `forge/<bundle>/pr.json` for the PR reads and in
  `forge/<bundle>/<ticket>.json` for that ticket's two reads. A manifest URL or a remote
  whose host changed normalizes to the same `manifest.json`, so step 5's manifest
  comparison cannot see it. Resume therefore resolves each manifest PR and ticket host
  again by A3 from `source` and compares it with the saved `url`. A difference, a
  missing file, or a `url` `jq` cannot read sends resume to stage 1 before any query, so
  no file read from the old host is reused; with `--live` it stops, as it does for a
  missing brief. Closing-issue tickets are not compared, since their host comes from
  `pr.json`.
- **Handoff.** `/cca:handoff` runs the stage 1 parent read, which now holds `<host>`, so
  it resolves the host by the same A3 rule and names it on its `gh pr view` (unless the
  id is a URL, which names its own host), its `gh issue view`, and the parent read. Its
  `allowed-tools` patterns `Bash(gh pr view *)` and `Bash(gh issue view *)` still match,
  and it gains `Bash(git -C * remote -v)`, as `SKILL.md` has, for the remote lookup of
  the host rule.
- **Lint.** In every backtick span under `agents/`, `skills/`, and `commands/`,
  `tests/lint.sh` fails on a `gh pr <sub>` or `gh issue <sub>` command with an argument
  that passes neither `-R` or `--repo` with a `<host>/<owner>/<repo>` value nor an
  argument that starts with `https://` or `http://` or is `<url>`, and on a `gh api`
  command with an argument that lacks the option `--hostname` with a value (text such
  as `q=--hostname` inside another argument does not count). A command may start
  after `;`, `|`, `&`, or `(`. A single-quoted argument with no blank or separator in
  it counts without its quotes; other single-quoted text is ignored. A span with no argument, such as
  "`gh api` calls", is prose, and an argument starting with `*`, as in an allowed-tools
  pattern, does not count. A span across lines and fenced code blocks are not checked.
  A self-test runs the check on fixed lines against fixed results, and an awk failure
  fails the lint instead of passing it.

Probes (2026-10-02, gh 2.91.0, Git Bash): `GH_CONFIG_DIR` pointed at a throwaway
directory whose `hosts.yml` listed only `enterprise.example.invalid`, with a `users:`
block (a bare `user:` entry was rewritten to `{}` by gh and did not reproduce), and
`GH_TOKEN` set to a github.com token.

- `gh issue view 7 -R vibecodedapps-official/claude-codex-audit`,
  `gh api --paginate repos/vibecodedapps-official/claude-codex-audit/pulls/12/comments`,
  and the stage 1 parent query each printed
  `error connecting to enterprise.example.invalid`.
- `gh pr view 12 -R vibecodedapps-official/claude-codex-audit` reached github.com and
  succeeded in this setup. It names the host too: the issue's fix asks for it, gh does
  not document its default host for `gh pr view`, and one rule then covers all four
  reads.
- With the host named, `-R github.com/...` and `--hostname github.com`, all four reads
  succeeded.
- With OpenSSH 10.5p1, `ssh -F <file> -G example.com`, where the file held
  `Match exec "echo MATCH-EXEC-RAN >&2"`, printed `MATCH-EXEC-RAN`: `ssh -G` runs
  programs from the SSH config, so the host rule does not use it.
- With the same throwaway config and `GH_TOKEN` unset,
  `gh auth status --json hosts --hostname enterprise.example.invalid --jq '.hosts | length'`
  printed `1` and exited 0, though that login's state was `error`; the same command for
  `github-work` printed `0` and exited 0. `gh auth status --help` says the plain form
  exits 1 when an account on the host has authentication issues. `--json` for
  `gh auth status` first appears in the gh v2.81.0 release notes (2025-10-01).

## Fixes after 0.3.1 (2026-10-02)

- **Flagged paths are built, not refused.** `working-tree.sh` refused any path that
  `ls-files -v` tags `S`, `h`, or `s` (skip-worktree or assume-unchanged), so a bundle
  whose repo used either flag could not be audited. The refusal rested on the 2026-10-01
  probe, which built from `read-tree HEAD`. The build has since copied the repo's index,
  flags included, so `add -A` leaves a flagged entry at its index version whether its
  file is edited or missing on disk. In a checked-out submodule, the parent's tree holds
  the submodule's `HEAD`, and a staged change there is refused as a dirty submodule, so a
  flagged file there is at its index version too. `build` now builds such a repo and
  prints one `flagged <path>` line per flagged path after the `untracked` lines, in scan
  order: the top level, then each checked-out submodule depth first, with its prefix.
  Stage 1 keeps the lines, and the brief lists the paths as "flagged at audit time, held
  at the index version".
- **What is still refused.** A flagged path the build cannot hold at its index version is
  refused, in `check` and `build`, in the old refusal's place among the others:
  `working-tree: refused: <n> flagged paths cannot be held at the index version, first <path>`.
  The five cases of the line above:
  - A flagged gitlink: it hides the submodule from the parent's `git status`, so the
    dirty-submodule refusal would not see a change in it.
  - A flagged intent-to-add entry: `write-tree` leaves it out of the tree, and it is not
    an untracked file either. Only when a flagged entry has the empty-blob object, the
    script runs `git diff-index --cached --name-status --no-renames HEAD` with
    `--ita-visible-in-index` and with `--ita-invisible-in-index`; a path with a
    `status<TAB>path` line in one run that the other run lacks, in either direction, is
    intent-to-add. That also catches a path `HEAD` tracks that was added again with
    `git add -N`: over a tracked file it prints `M` in one run and `D` in the other, and
    over a tracked empty file of the same mode it prints only `D`, in the invisible run.
  - A path that is a directory on disk, not a symlink: `add -A` adds the files under it
    and drops the flagged entry.
  - A path with a leading component that is a symlink, or anything but a directory, on
    disk: `add -A` adds that entry and drops the flagged one.
  - A path git prints quoted: it cannot be checked on disk, so it is not taken as held.
    At the top level the quoted-path reason refuses it as well; inside a submodule only
    this line does.
  After `write-tree`, the script checks that each flagged path of the top level is in the
  tree with the mode and object of its entry in the copied index, and exits 2 if not.
  The refusals should make that unreachable, so case 6p reaches it through a copy of the
  script with the refusal removed.
- **Sparse checkout in submodules.** A sparse checkout marks the paths it leaves out
  skip-worktree, so the old flagged-path refusal also refused a sparse submodule. With
  that refusal gone, the sparse-checkout refusal now runs in every checked-out submodule
  too: `working-tree: refused: sparse checkout is on in <path>`.
- **Read from an export.** A working-tree bundle was read directly unless `ls-files -v`
  of the top level showed a flag, which missed a flag in a submodule. It is now read
  directly only when `HEAD` is the build's `parent` and the build printed no `flagged`
  line, which covers the checked-out submodules. Otherwise it is exported from the head's
  tree, which holds the untracked files and the flagged paths at their index version, so
  no agent reads a local flagged file. Resume applies the same test to its rebuild, so a
  path flagged after a direct-read audit reruns stage 1, and it reruns stage 1 for any
  working-tree bundle whose rebuild lists other flagged paths than the brief. Other
  trees keep the top-level `ls-files -v` test.
- **What the audit does not see.** A flagged path's local content is not in the head, so
  an edit to it, before or during the run, is not audited and does not change the head
  sha. The read-only check does not compare a flagged file's content: `git status` does
  not report it, so a change during the run may escape the check. This was already so
  for any audited repo with flagged paths. Coverage lists the flagged paths with this
  limit, and the check record labels a `touched` line for a flagged path "touched,
  content not compared".

Probes (2026-10-02, Git Bash, a scratch copy of `working-tree.sh` with the refusal
removed):

- A skip-worktree file edited, a skip-worktree file deleted, an assume-unchanged file
  edited, and an assume-unchanged file deleted, each in its own repo: every tree held the
  committed blob, `.git/index` was unchanged, no `untracked` line was printed, and a
  rebuild gave the same sha.
- A file staged and then flagged was built at the staged blob, its index version.
- A skip-worktree `p` replaced on disk by `p/child` built a tree with `p/child` and no
  `p`. A skip-worktree `dir/f` whose `dir` became a file built a tree with `dir` and no
  `dir/f`. Assume-unchanged gave the same.
- A flagged intent-to-add `n.txt` was in neither the tree nor the `untracked` lines.
  `ls-files -v --debug` showed its `flags:` as `60004000` with skip-worktree and
  `2000c000` with assume-unchanged, bit `0x20000000` set in both. The shipped check uses
  the documented `diff-index` options instead, since the debug format is internal.
- A case-only rename of a deleted skip-worktree file with `core.ignorecase=true` kept
  `README.md` at its committed blob, so it is not refused.

## `result_file` for live results (0.4.0, 2026-10-02)

The client asked for a file beside the one-line `result`, hashed into the import, so a
query that returns rows is kept verbatim rather than summarized by hand.

- **The copy is the record.** The results files are the record of what was imported,
  so a path alone would let the result change or vanish after the import. `import`
  copies each file under `live/results-<k>/` and hashes the copies, not the originals.
  The kept `.md` stays the user's file byte for byte, so the bytes validated are still
  the bytes kept; the copy is found by the heading line, the same number the approval's
  `source` already uses.
- **One commit point.** The copies are staged in `live/results-<k>.pending/` and renamed
  before the `.md`, whose rename stays the commit point. A result directory without its
  `.md` was never committed, and `import` and `retire` remove it, as they remove a
  `.pending` file. Each copy is tested again after the copy, since a file can change
  between the check and the copy.
- **Checked before every reconcile.** `active` and `assemble` check every active
  import's copies against `SHA256SUMS`, and the import's entries say which copies must
  exist, so deleting the whole directory is caught too. The copies are not stage input
  hashes: they never change, a new result changes the derived file's `- source:` line,
  and the check above runs first. A retired import is not checked, since nothing decides
  from it.
- **Reviewers read the result, not a summary.** A one-line result reaches the reviewers
  through the derivation lines. A file does not fit there, so the second opinion (with a
  sentinel copy) and the late adversary get each result copy as an input. The merger
  does not: it merges the positions they gave.
- **File errors after format errors.** `check` tests the files only when the format is
  clean, so every error line stays in line order without merging two sources.
- **Limits.** A result file has no size cap, so it adds another unbounded input to the
  bounded-loading item below; agents read a large one in slices. A copy over the
  follow-up cap that Codex does not acknowledge cannot be inlined, so stage 6 fails for
  it. Every copy of an active import is hashed on each `import`, `active`, and
  `assemble`, so each resume reads every copy more than once.
- **Only under the `--live` file's directory.** A copy goes to Codex and into the report,
  so a `--live` file written by someone else could otherwise send a key or an `.env`
  off the machine. An absolute path, a drive letter, or a `..` component is refused; a
  symlink inside the directory is still followed, as the user placed it there.
- **`import` checks first.** A broken copy of an active import stops every reconcile, so
  `import` checks the copies before it commits. Otherwise each retried `--live` would
  commit one more import before the reconcile failed again.

## Review of 0.4.0 (2026-10-02)

A review of 0.4.0 found that stages 5 to 7 trusted the orchestrator to carry every id
through three hand-written ledgers, that a medium finding could count with no position,
and a few documented paths no stage used. A second opinion converged on the plan; every
change stays inside the plugin.

- **The ledger script.** `skills/cca/scripts/ledger.sh` builds what is mechanical and
  checks coverage. Scripted: the finding sections of `ledger/5.md` (originals, verdict
  lines, state after pass two) from the output files listed in `ledger/inventory.txt`,
  the mandatory id set, the list of ids seen without a position, `gate.md` (a pure
  function of the ledgers, the stage status, the tier, and `live/findings.md`), and these
  checks: the finding part of `ledger/5.md` equals what the script builds from the pass
  files (the inventory is reconciled against `pass1/` and `pass2/`); at stage 6, every
  mandatory id has a position with provenance in a response file, and every other
  `ledger/5.md` id has a position or is on the seen list; Codex and late additions match
  the raw answers; `gate.md` equals the computed gate; every id is absorbed by exactly
  one converged item with a matching gate. Model-judged, as before: whether evidence
  holds, the map corrections and their rejection reasons, the stage 6 positions
  (condensed from the second opinion's answer), the severity and contested checks,
  dedupe, and the report.
  The parsing rules are one paragraph in `common.md`, so an agent's output and the script
  agree on what a block is. A problem fails the stage; it is never repaired silently.
- **The medium rule.** A stage 6 position is now mandatory for every finding at medium
  severity or above after pass two, plus every downgraded or dropped id and every live
  id, as before. The gate requires a position for medium and above; a low or note
  finding may count on the acknowledgment alone, and the gate reason names which. Before,
  a medium finding listed as seen with no position counted, so a run could end `merge
  after fixes` on one reviewer's word. A missing mandatory position still fails stage 6,
  so the run is `audit incomplete`, never `ready to merge`. Eligibility is the severity
  after pass two, and a later recalibration upward is itself a position, so a reviewer
  cannot bypass it. A counted item's severity, label, and disposition come only from
  absorbed ids that count, so a provisional duplicate never raises them.
- **One live path.** `live.md` is the only path: the orchestrator never asks for live
  access during a run, a needed check becomes a report item, and approvals come only from
  a `--live` file through `/cca:resume`. The stages never asked, so the older text (hard
  rule 5, the orchestrator preamble) described a path that did not exist, and the agent
  boundary clause "use one only when your prompt says the user approved that named check"
  was emitted by no stage. It is removed from the four agent files that carried it. The
  boundary itself stays in each agent file: an agent definition loads before `common.md`,
  and a safety rule belongs where the agent reads it first.
- **Launch order.** The queue now starts digests, then maps, then pass one. The barrier
  waits for digests and maps, and pass one that starts first reaches it before them, which
  is what forces a top-up auditor to read what the first auditor missed. Starting the
  digests and maps first lets more of them finish before the barrier. It reduces misses
  and cannot remove them, since a digest can still outlast an auditor or the queue cap
  can delay it, so top-ups stay. The cost is that auditors may start a little later.
- **Invocations on disk.** The invocation block is appended to `invocations.md` in the
  run directory once the run directory is known, one block per command, never rewritten.
  After a compaction the last block is re-read. `manifest.json` held the audit's inputs,
  but a resume's `--from` and `--live`, and an act's items and `--per-item`, were on no
  disk, although the orchestrator was told to re-read them. A run from 0.4.0 or earlier
  has no file, and the block in context stays the only copy.
- **Disclosure, not a mechanism, for attribution and one blind spot.** An ignored-file
  write is accepted when an agent's own `runs:` list logs a run in that repo, so the
  attribution is self-reported and repo-level. A `.git` created inside a tracked
  directory is pruned by the scan and is not seen. The README says both in its limits. A
  mechanism for either would cost a trace of every agent command or a full scan for
  nested `.git` entries, which is not worth it for this check.
- **Fault injection moved out.** The `_test` rules are in
  `skills/cca/fault-injection.md`, read only when the manifest has `_test`. They are test
  scaffolding, unused outside the acceptance runs, and 28 lines of every run's
  orchestrator context. The stage files keep their one-line mentions.
- **`exported_by` stays required.** Stage 1 copies it into every provenance block, so
  dropping the requirement would leave blocks with a hole, and a missing key is cheap to
  fix.
- **Findings of a failed output are kept, provisional.** A failed pass or top-up file
  used to drop out of `ledger/5.md`, so a finding it held vanished. The script now keeps
  every well-formed finding with the state `no verdict: output failed` and no verdict
  credit from the failed review, so it is visible. A pass-one finding then stays
  provisional; a pass-two or top-up addition can count only through the late adversary
  and a second-opinion position, like any late addition, since excluding a reviewed
  finding would only make the verdict more lenient. A block it cannot parse is counted on the
  file's `## Failed outputs` line, which is the one place nothing is listed.
- **Resume rule instead of a version bump.** A complete stage 5 entry without
  `ledger/inventory.txt` among its outputs is not reusable, so a run from 0.4.0 or earlier
  reruns from stage 5. Bumping `plugin_version` is a release decision, and it would rerun
  every old run from stage 1, which rereads the forge for no reason.
- **Not changed.** Stage 1's label order (editorial, a large diff in a 732-line file for
  no behavior gain), live.sh's size, the line formats of the ledgers, forge adapters, and
  a first full multi-agent run are follow-ups.

## 0.5.1 decisions (2026-10-03)

- **The late adversary's ids come from a script.** Stage 7 used to list the ids to
  challenge in the prompt by hand, from three rules in prose, so a dropped id meant a
  finding with no late verdict and a provisional gate nobody saw. `ledger.sh late-ids`
  builds the list, the prompt passes the file, and `check --through 7` reports any id of
  the list without a verdict. The orchestrator still judges nothing there; the rules are
  the ones the stage text already stated.
- **The follow-up is a file.** The Codex follow-up carried its id list in the tool
  argument, typed by the model, and its inline inputs in the same argument. It is now
  `codex/followup.md`, filled by shell from `tmp/missing.txt` and the batch files, and the
  call only says to read it. The cost is one more file in the run directory; the gain is
  that no id passes through a typed argument and the byte cap applies to a file that can
  be measured and kept.

## Auditor reach: tests, base producers, and run-once scripts (2026-10-03)

A hand-run audit sweep of a real bundle on 2026-10-02 confirmed 20 defects. Issues #17
to #21 grouped the ones cca would have missed. This change takes #18, #19, and part of
#20. #17 changes the pass-one and pass-two contracts and the ledger script, so it waits
for the 0.5.1 ledger work.

- **Weak tests are read, not run (#18).** The tests checklist flags a test that asserts
  the code's own constant, pins text without running the code that makes it, or accepts
  a wrong outcome. A flag is a lead. It becomes a finding only when the auditor names the
  regression the test would miss. A text pin or several allowed outcomes can be correct,
  so the flag alone proves nothing. Running each test with the change reverted would
  prove it, but it breaks two rules: no test runs in an export, and agents write only
  their output. That check is #22.
- **Base producers are read at the base sha (#19).** For each literal or shape the change
  matches on, the auditor reads its producer at the head and at the base sha. The issue
  proposed listing base commits since the fix's author date. Author dates survive a
  rebase and a cherry-pick, so the commit range from the merge-base to the base is the
  lead instead, and the base read is the evidence. A finding needs the producer to
  survive integration unchanged by the head. A disagreement alone is not enough, since
  the change may handle both forms. Only group and `combined` scopes run it, so
  specialists do not repeat it.
- **Run-once scripts, narrow part (#20).** A bundle may list `run_once` glob patterns.
  Stage 1 lists the changed files that match, with whether each exists at the
  merge-base, so the auditor does not recompute it. An edit that changes what an
  existing script does is an `unverified assumption` with a live check, since only the
  target environment's journal shows whether the script ran. Only a modified script
  counts. A runner that journals by name runs a renamed script again, so a rename is
  not skipped. The other two checks need a
  design first. A name collision with another open pull request needs a new forge query.
  Rerun safety depends on the runner and the script's guards, not on each statement. The
  `solo` fixture's guarded `002_add_status.sh` shows a per-statement rule would flag
  correct scripts. Both are #23.
- **A fixture with planted cases (#21).** The `patterns` fixture plants one case each
  for #17 to #20, with decoys. `verify.sh` shows each defect is real by running the
  fixture's own scripts in temp copies. Detection is recorded per audit run in
  `docs/acceptance.md`, before and after this change, as observed results. One run each
  is one sample, not a rate. The reviewer's 20 cases were not in the repo yet; the
  `ground-truth` fixture plants them (see "Ground-truth fixture" below).

## Outward trace (#17, 2026-10-03)

The same sweep found 8 of 20 defects next to a change, not in it: a sibling that lacked
the change, a callee's failure branch, a consumer of a widened input. Group and
`combined` auditors now write `## Outward trace`, one entry per changed symbol, and the
pass-two adversary challenges it.

- **No ledger change.** `ledger.sh` captures only `## Verified OK challenged` and
  `## Coverage gaps` from a pass-two file and passes other sections by. The trace and
  its challenge are report items, like Decisions and Scope. An omission is written in
  `## Coverage gaps`, which the ledger and the report already carry. `tests/ledger.sh`
  shows the new sections, with fenced heading examples, parse to the same ledger.
- **Bounded.** At most 15 symbols per scope, riskiest first; one hop from each, with at
  most 5 siblings, 5 callees, and 10 consumers checked. The rest are listed, never
  dropped silently, and the report's Coverage names them. Removed symbols count, since
  their consumers break first. A search that could not finish is `incomplete`, not
  `sound`. The second opinion traces at most 10 symbols before it picks new findings.
- **Siblings need a shared contract.** A sibling without the change is a finding only
  when the auditor cites the contract it shares (the ticket, a ranked source, a shared
  interface or caller, or the same input contract) and shows the violation. Otherwise
  two functions that look alike would raise findings by resemblance.
- **Consumers in every tree.** The trace searches every tree the brief maps. A low-tier
  audit of several bundles has no `interactions` scope, so a trace limited to its own
  bundle would miss cross-bundle consumers there. At medium and high, `interactions`
  still owns cross-bundle contracts, and stage 7 merges a duplicate.
- **Challenges by tier, completeness always.** The adversary checks at every tier that
  every changed symbol is traced or listed as not traced. Entries are attacked like
  Verified OK: none at low, up to 5 at medium, all at high. A missing trace or challenge
  is recorded as not assessed or not challenged, not a failed scope, as for Decisions.

## 0.5.2 decisions (2026-10-03)

- **The late adversary's file is checked by script before the merge.** `check --through
  7` already found a listed id without a late verdict, but only after the merger ran, so
  the miss went down the merger's ladder, which cannot add a verdict. `late-check` runs
  on the adversary's file alone, so a miss is a late adversary failure and gets a
  relaunch. It is a separate op because `check --through 7` needs `converged.md`, which
  does not exist yet, and `late-ids` generates a list rather than checking one. The
  check after the merge stays, as a guard on the orchestrator's copy into `ledger/7.md`.
- **An extra late verdict is a problem.** The late adversary is asked for verdicts on
  the listed ids only. A verdict on another id would reach `ledger/7.md` and could set
  a severity the merger then follows, so `late-check` rejects it and the adversary is
  relaunched.
- **The follow-up goes inline when an input was unacknowledged.** 0.5.1 made the
  follow-up a file read by path, so that no id passes through text the model writes.
  When an input went unacknowledged, Codex may be unable to open run-directory files at
  all, and then it cannot open the follow-up either. In that case only, the orchestrator
  reads the file in full and passes its text in the call. Shell still writes the ids into
  the file, but the model carries the text, and neither the sentinels nor `missing`
  proves the text arrived unchanged. When every input was acknowledged, the call stays
  by path.
- **A partial `ledger/6.md` is read leniently only when stage 6 failed.** A failed stage
  6 can leave the file mid-block, and nothing in it passes the gate on stage 6's
  account. Failing `late-ids` and `gate` on it then failed stage 7 for no gain. With
  stage 6 complete the file was already checked, so its problems stay errors.

## Merger item shape (#27, 2026-10-03)

- **The shape goes in the merger's own file.** The merger's prompt holds only paths, and
  its agent file never gave the item heading or the `- tickets:` and `- recommended
  change:` lines; those were only in stage 7, which the merger does not read. Two runs'
  mergers guessed `## C<n>:` and one guessed `### C<n>:`. Putting the shape in
  `agents/merger.md` reaches the merger on every launch without growing the prompt. The
  orchestrator keeps its copy in stage 7 for its own fallback merge, and a lint check
  keeps the two the same.
- **The default model stays.** The failure was a missing instruction, not a reading
  error: the same model wrote the shape correctly on the two other runs, and the
  grouping and positions of the failed file were usable. A stronger model would have
  guessed too. Revisit if a merger fails the check again with the shape in its file.

## Ground-truth fixture (#21, 2026-10-03)

- **The reviewer's cases, as given.** `tests/fixture/ground-truth-cases.md` holds 20
  confirmed findings from one reviewer's threads, de-identified. The `ground-truth`
  fixture plants each one under its own id, S1 to H2, in shell over CSV files like the
  other fixtures, so the build adds no dependency. Where a case rests on what the forge
  shows, an export carries it: R3's journal is pasted in a PR-1 thread, and R2's other
  open pull request is a line in PR-1's body and a branch in the repo.
- **Two bundles in one repo.** B1 is a pull request stacked on a target that was later
  rebased, so it needs its own branch and base. A second bundle holds it. The other 19
  cases share bundle 1, so a medium run also gets the `interactions` scope.
- **Expectations are observed, not predicted.** `expected.md` gives each case's
  location, the finding that describes it, its severity, and its decoys. It does not say
  which stage should raise it. The case set's reason for the original miss stays as
  context. `docs/acceptance.md` records, per run, the stage that raised each case, or
  `none`.
- **B2 has no forge view.** Its defect is the forge showing a rename near 60% similarity
  as a deletion and an addition. Git detects the rename, and exporting a forge rendering
  would invent one. A `none` on B2 measures missing evidence as well as detection.
- **The journal stays ignored.** As in `patterns`, `data/applied.txt` is not tracked.
  R1's evidence is the runner and the script, and R3's is the pasted journal.
- **Runs see only the plugin.** An audit of this fixture passes `--plugin-dir` a copy
  holding only `.claude-plugin`, `agents`, `commands`, and `skills`, so no agent can read
  the cases or `expected.md`. Its 13 tickets select `high`, so a run passes
  `--effort medium` to compare with the `patterns` runs.
- **#22 comes before #23.** Five of the 20 cases are about tests, and T1 was caught only
  by running the test, which is what #22 adds. #23's collision check, which R2 needs,
  waits longer. The reviewer asked for this order. Their other request, that an exported
  forge file can list the target branch's other open pull requests and their changed
  files, is a comment on #23, so R2 can be caught without `gh`.

## Changed tests with the change reverted (#22, 2026-10-04)

- **Opt-in by manifest key.** Running a bundle's own commands is new for the
  orchestrator, so nothing runs without `test_command`, and setting it is the consent.
  The commands get the user's environment and credentials, as an agent's test run in a
  directly read tree already does. Stripping credentials would break suites that read
  a config file under the home directory, and a sandbox would need a dependency per
  platform.
- **By path, not by hunk.** A changed path that matches `test_paths` is test code whole
  and keeps its head state in the reverted copy; every other path goes back to the
  merge-base. A file that mixes tests and code is not split, since that needs a parser
  per language. The result file lists the changed paths outside `test_paths`, and the
  auditor must cite an implementation hunk outside `test_paths` before a pass in both
  copies supports `verified fact`.
- **Copies outside every repo and the run directory.** Both copies are written with
  stage 1's `cat-file` export method under `${CLAUDE_PLUGIN_DATA}/revert-work/`, so no
  checkout, filter, or worktree touches an audited repo, the read-only check sees nothing
  new, and agents never read a copy. The script removes them on every exit.
- **Every exit status is a run.** Exit 127 was going to mean "could not run". In
  `patterns`, `tests/test_users.sh` exits 127 under bash in the reverted copy from
  inside the test, because a script it calls is absent, which is a real failure. Only a
  failed setup, a timeout in the reverted copy, a path conflict, or a cap gives
  `not run`; the auditor reads the tail for the rest.
- **One verdict per file, tests by name from the tail.** Per-test verdicts need a
  runner per framework. The tail does the same job when it names tests: in `patterns`,
  the file fails without the change, but its tail shows P18's test passing first.
- **The script supervises process groups itself.** GNU `timeout` exits when its direct
  child dies on TERM, before its KILL, so a grandchild that ignores TERM lives on. Each
  command runs as a job under `set -m`, and the group always gets KILL when the command
  ends, with `kill -<sig> -<pgid>` (dash rejects `kill -- -<pgid>`). A process that
  leaves the group, and on Windows a native program's own children, are out of reach;
  the README says so.
- **This one script runs under bash.** dash turns job control off when it has no
  controlling terminal (`set: can't access tty; job control turned off`), so every job
  would share the script's group and no deadline would kill anything. Bash keeps job
  control without a terminal, and ships on Linux, macOS, and Git Bash, so the script
  re-executes itself under bash when another `sh` starts it. The other scripts stay
  POSIX sh. `setsid` would also give each command its own group, but macOS and Git Bash
  lack it.
- **Caps.** 20 files, `test_timeout` (default 300 seconds) per command, 30 minutes per
  bundle, and no run over 1 GB. `REVERT_TESTS_CAP` overrides the 30 minutes so the test
  suite's cap case runs in seconds.

## Rerun of renamed run-once scripts (#23 part B, 2026-10-04)

The 2026-10-03 note on run-once scripts (#20) said a runner that journals by name runs
a renamed script again, but the rule did not check renames: item 2 flagged only an edit
to an existing script and said it did not judge rerun safety. Case R1 of the `ground-truth` fixture, a renamed journaled migration
that drops and adds the records key unconditionally, passed both acceptance runs. Each
judged the end state: `migrations-OK8` and the late verdict on C43 in 0.6.0, and
`migrations-OK4` in 0.7.0, with pass two upholding both.

- **No repeated work, not the same end state.** A rerun of a script written to converge
  leaves the same end state, so that test clears R1 and every other rename. The harm is
  the rebuild on every install that ran the old name. A per-statement idempotency rule,
  the issue's first proposal, fails the other way: it flags `solo`'s guarded
  `002_add_status.sh` and the function scripts, which rewrite their own line on purpose.
- **The test is by effect, not by the diff.** The auditor compares the old script with
  the new one directly and, for each step, asks whether an install that ran the old script
  already has its result. A step whose result is new there (a new column, a definition
  that differs from the old one) is needed work, and the rule does not judge it. A step
  whose result is already there is repeated work unless a guard stops it. Each result is
  judged apart, so a new result in the same command does not excuse a repeated one. A
  first design split a script into changed and kept steps by the diff's hunks. That fails
  twice: the saved patch is made without `-M`, so with `diff.renames=false` a rename shows
  as a pure add and every step looks changed; and a log-line edit inside the key step
  would exempt a rebuild. An "in place, constant cost" exemption was left out too: the key
  step and the function steps have the same shape in the fixture, so an exemption would
  clear R1 by the argument that cleared it before. The three function scripts stay silent
  against the merge-base because each one's step installs a definition that differs from
  the old one, not because a rerun leaves the same lines. Severity follows the cost: `medium` for a
  rebuild, a walk over rows, or an outside effect; `low` for a definition set to the value
  the old run set.
- **A guard tests the step's result, and every needed step still runs.** A guard on "a
  key exists" skips an older install whose key is still `id`, and that install needs the
  step. A guard may wrap one step or the whole script; what it must not do is skip a
  needed step. A whole-script exit that tests only the old step's result skips the new
  steps on every install that ran the old name, and it is the obvious fix for R1. A guard
  may also test a fact that shows the result is there, such as the old name's journal
  entry, as long as it holds both ways.
- **The runner comes from the repo; no manifest key.** The auditor needs one fact: how the
  runner derives a script's journal key. Both runs found the runner and quoted it with no
  key. A key is hearsay the auditor must still cite, and it adds validation, README text,
  and a resume input. When the runner is outside the audited repos, the finding says so,
  assumes the file name is the key, and the live check reads the old script's journal
  entry, which also shows the key form. When the rename keeps the key, the runner does not
  see it, and the file is judged as an edit.
- **The label stays `unverified assumption`.** The repo shows that the new name runs where
  the old one ran, but not that any environment ran the old one. A journal a ticket or PR
  thread lists shows one environment on one date. The cap stays `medium`, as for P20.
- **By status.** `R` and `C` are checked (the list now carries the old path and score).
  `A` is not: it has no journal entry under any name. Stage 1 passes only `-M`, so a
  copy of an unchanged script lists as `A`; finding it needs `--find-copies-harder` and
  would flag templates. A rewrite under 50% similarity lists as `D` plus `A` and is not
  paired. A rerun after a failed first run depends on whether the runner wraps a script
  in a transaction, and is not checked.
- **Pass two holds the same test.** The adversary upheld the end-state argument twice, so
  `common.md` carries the rule and the adversary treats an item that clears a renamed
  script as among the riskiest.
- **No new cap.** The auditor already reads every changed file. The added reads are the
  old script and the runner once per scope.
- **Fixture.** The lookup and audit renames are the decoys, with no new commit. The rank
  rename is one only against the merge-base: `main`'s `732d4ba` gives the old name the
  same score filter, so on an install that ran that later body the renamed script sets
  the same definition again, a `low` finding by this rule. The acceptance run of
  2026-10-04 raised it, and the decoy note was narrowed to match. `solo`'s
  `002_add_status.sh` is an added file, which the rule does not check. No
  `verify.sh` check runs the function scripts twice: under the effect test they are
  decoys because their definition changed, so a second run that leaves the same lines
  would prove the wrong thing.

## Decision points in the outward trace (#32, 2026-10-04)

C2 of the ground-truth fixture: the change passed a settings map where the merge-base
passed `null`, so the `office_code` rule in `src/rules.sh` began to follow
`require_office`, and `GT-6` names only the flag and office rules. Both runs' trace found
the consumer (`bulk-rules-OT2` in 0.6.0, `bulk-rules-OT1` in 0.7.0) and pass two upheld
it, but each judged `check` as one reader and never set its three rules beside the
ticket.

- **Prose only.** `ledger.sh` classifies a line as a heading only at the left margin and
  as an end line only when the whole line is `runs:`, `consumed:`, `opened:`, or
  `status: complete` (`classify`, `isend`), and reads a pass-one `## Outward trace`
  never. An indented decision line under an entry is text. A probe on a copy of the
  `tests/ledger.sh` trace fixture gave identical `build5`, `check`, and `mandatory`
  output with decision lines added. The fixture gains the lines so the claim stays tested.
- **Decision lines inside the entry.** One line per decision point, indented under the
  entry, with a `decisions:` field before `result:`. Separate entries would spend the 15
  per scope (C2 alone takes 3) and each would need an id and a challenge line; a
  separate section would grow the output contract, stage 4, stage 5, and stage 8.
- **Eight per entry, uncovered first.** Counted per entry, not per consumer, so the
  worst case is 8 lines per entry and not 10 consumers times that. Decision lines do not
  count toward the 15 entries or the 10 consumers. Enumerating the decisions is a
  search; judging each is the cost. When there are more than 8, a search of the
  ticket, PR, and claims for each one's field or message picks the unmentioned ones
  first, then direct readers, then file order. The marker is the existing
  `(<k> of <n> checked)`, and the unlisted are named by location, so the report's
  Coverage shows them. Eight is a judgment from one case with three; reopen it if a run
  shows a cut list hiding a miss.
- **Covered means named and followed.** A source covers a decision when it names it by
  its field, message, or condition and says it follows the change. Naming the setting is
  not enough: `GT-6` names `require_office`, which keys both the office and the
  `office_code` rules, so a key test covers all three and misses C2 again. "The flag and
  office rules" names two rules; `office` is not `office_code`. A ranked source is not a
  coverage source: it says what a rule does, not that it should follow the new input. An
  edit to the decision's own lines is not coverage: it shows what to review, not that the
  change is meant.
- **Outcome is judged over the values the input can now carry.** The repo's cache holds
  `yes` for both keys, so judged on today's data the third rule is unchanged. A changed
  outcome with no coverage is a finding under Q2, `verified fact` on the quote pair
  (merge-base value, head value, the decision) and an empty coverage search,
  `unverified assumption` when a source's wording could reach the decision. The agent
  cannot run `bulk_import.sh` (hard rule 2), so the quotes carry it. This is not a
  "missing rationale": it rests on a changed outcome.
- **Strict on the boundary.** "Office rules" could be read to include `office_code`. The
  strict reading is picked because the message and the condition differ, and because a
  wrong finding is at most `medium` and the adversary can drop it with the covering
  quote.
- **Not done here.** A script check of the decision lines; decision lines for the
  specialist `interactions` scope, which writes no trace; the ticket exports as Codex
  inputs (the request names them through the brief instead); a completeness check of the
  decision list at low tier, where no entry is challenged.

## A test that runs as an account with more rights than it needs (#33, 2026-10-04)

Case H1 of the `ground-truth` fixture: `tests/scenario_hrn_lookup.sh` reads two columns as
`svc_writer`, the account the service writes with. Both medium runs missed it. The harness
auditor's entry (`harness-OK5` in 0.6.0, `harness-OK6` in 0.7.0) checked only that the
scenario's role tag names the account it reads as.

- **The route was fine.** The file is in the harness group, which does not get the tests
  checklist, but the tests scope reads every changed file of every bundle at every tier:
  `combined` at low, `tests-hygiene` at medium, `tests` at high. In both runs
  `tests-hygiene` listed the file and held the row. In 0.6.0 it signed the file off on the
  same shallow check (`tests-hygiene-OK8`: the declared role exists in dev and qa). The
  gap was a missing item. The item goes in the tests checklist only. Group scopes keep
  the matcher and run-once checks, and specialists do not repeat those; the same rule of
  one scope per check keeps this item out of group scopes.
- **Three levels of evidence.** A grant or role definition shows the rights. Code outside
  the tests that writes as the account, or a name that says writer, owner, or admin, only
  points to them. An account with neither is not flagged, since an accounts file entry
  holds a name and a secret reference, not rights; an account such as `api_user`, with no
  write shown anywhere, must not be flagged. In the fixture the pointer is `src/upsert.sh`:
  line 7 sets `svc_writer` as the default account, and `put_row` writes the table and
  reports `wrote ... as $DB_ACCOUNT`.
- **The label follows the evidence.** A quoted grant can support `verified fact`. A
  pointer only gives an `unverified assumption`. No tree holds the fixture's grants, so
  H1 is an `unverified assumption`, at most `medium`, with a `live check` on the grants and
  on whether a read-only role exists in each environment. That matches the case set's
  rating.
- **Q1, not Q2.** The weak-test clause files under Q2 because the change is not shown to
  work. Here the change works and gives the test more rights than it uses, which is the
  best-practice question. The custom-list fallback is the weak-test clause's.
- **Its own item, outside the weak-test gate.** A weak-test flag becomes a finding only
  with a named regression. A test with sound assertions can still run as too strong an
  account, so the item says it applies whether or not the assertions are adequate.
- **Flagged where the account is chosen.** `step_find_by_hrn` takes the role as a
  parameter, so the finding sits on the scenario that passes `svc_writer`. One finding per
  account names every test that uses it.
- **The narrower role comes from a sibling.** The bundle adds `report_reader` for other
  GT-9 reads, in dev only (`harness-F8`), and the unchanged `scenario_audit_event.sh`
  reads the same table as `api_user`, present in dev and qa. The live check picks one.
- **Not done.** No run and no live access. No second copy in group scopes. No rule that a
  Verified OK entry must state an account's rights. The pass-two adversary is unchanged.
  The two copies of the checklist are not linked by lint, as for #18.
- **Measured once.** The acceptance run of 2026-10-04 found H1 in pass one, and pass two
  cut it to note: in the fixture the role only picks an accounts file entry, so no path
  to write rights is shown. One medium run is one sample (`docs/acceptance.md`).

## Headless runs and the reverted test step (#37, 2026-10-05)

The first try of the 0.8.0 acceptance run ended in stage 1. The orchestrator started
`revert-tests.sh run` in the background, as the step allowed past the Bash tool's limit,
and ended its turn to wait for the completion notification. A headless session
(`claude -p`) ends when its turn ends with only a background command running.

- **Waiting must keep the turn going.** A foreground command that reaches its timeout
  moves to the background, unless it starts with `sleep` (Claude Code's tools
  reference); a probe on 2026-10-05 (Claude Code 2.1.289, Windows) moved `true; sleep
  30` there at a 10-second timeout. In an interactive session the completion
  notification then arrives. In `claude -p` it does not: the session ends with the turn,
  and the headless docs say a background shell is terminated about five seconds after
  the final result. So the orchestrator must never end its turn while the run is in
  the background, and no single call may stand in for the whole run.
- **Background run, foreground waits.** A third probe started a background command and
  then blocked on it with a foreground loop; the headless session stayed alive and
  finished. Stage 1 now starts `revert-tests.sh bg` in the background and repeats
  `revert-tests.sh wait`, which returns within 9 minutes, at most 8 times. It works the
  same headless and interactive, and keeps the #22 cap. Lowering the cap to fit one
  foreground call was rejected: it cuts the cap by three quarters and still fails on a
  slow copy build. No reliable signal tells headless from interactive.
- **The status comes from a parent shell.** `bg` runs `run` as a child, keeps its
  output in `<result file>.err`, and writes the child's exit status to `.exit` by rename.
  An earlier design had `run` write a pid file and a status file from its own exit trap.
  Review found a half-written pid file read as a dead run, a `die` inside a command
  substitution losing its message, and pid reuse keeping a waiter alive. With a parent
  shell, a KILLed `run` still gets a status (137, by design; no test KILLs it), and
  nothing needs a pid.
- **Bounded at both ends.** `bg` sends the child's process group TERM at its own deadline
  (3600 s), and KILL 60 seconds later, so copy building, which the 30-minute cap does not
  count, cannot run on without end. The group matters: bash holds off `run`'s TERM trap
  while a foreground git step runs, so TERM to `run` alone waits for that step. The
  stage's 8 waits (72 minutes) outlast that deadline plus cleanup; an eighth "still
  running" means the wrapper died, and the stage stops.
- **The run ends with the session.** Probes showed that when a headless session ends,
  the harness kills its background shell without a signal the shell can catch, while a
  process group the shell started survives. A run that outlived its session could race a
  resumed stage 1, which deletes and reuses the same paths. So the group's leader is a
  small shell that checks `bg` every second and, once `bg` is gone, sends its own group
  TERM, and KILL 60 seconds later. A TERM to `bg` also wakes the leader, which then
  found `bg` gone and sent a second TERM about a millisecond after the first. That one
  landed as `run`'s exit trap began and killed it before its cleanup, which left the work
  dir and an orphaned test (a trace on two CPUs showed it; on CI it failed case 15f in
  some runs). So the leader skips its TERM when the group already had one, and `run`'s
  TERM trap ignores HUP, INT, and TERM before it exits.
- **Not done.** Headless runs stay acceptance-only, so the README does not document
  `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`.
- **Stage 6 has the same gap (#39).** codex-lite's `ask` runs Codex in one foreground
  call with a 600000 ms timeout, and the tier timeouts run to 3,600 seconds. A call past
  10 minutes moves to the background and waits for its notification, which works
  interactively but ends a headless session. No recorded run hit it. The fix needs
  either a lower cca timeout or a change in codex-lite, so it is not part of #37.

## Deferred past 0.3

- ccl emitting a handoff, and a ccl hint suggesting `/cca:audit` (F7 and H6). Both are ccl
  changes. `skills/cca/handoff.md` is the format ccl can adopt, and `/cca:handoff` can run
  in any session, including one that ran ccl.
- Applying `work-items.jsonl` to a forge. 0.2.0 writes and validates the plan; no adapter
  ships.
- Native Azure DevOps and other forge fetching. Exported files are accepted.
- Automatic trigger from ccl. A ccl run's report is passed as a claims file, or
  `/cca:handoff` writes a handoff.
- Exact token accounting.
- A PreToolUse hook that enforces the read-only boundary mechanically.
- `readonly.sh` takes its snapshots with `git status`, which runs a clean or process
  filter on a modified file of a dirty checkout, in any audit (found in the 0.3.0 final
  review; older than 0.3.0). A `head: working-tree` bundle is safe, since its refusals
  run first. Other repos need a snapshot that never runs a filter.
- Bounded loading for every agent input (2026-09-30 review). Today the unit is the
  450,000-byte chunk or ledger slice, an ordinary corpus file is read in full, a single
  finding larger than the split threshold is passed whole as an `over threshold` part,
  and a merger may reopen a full ledger file for a duplicate check. A per-agent byte
  cap with sectioned inputs is a later design change, still deferred. 0.3.0 adds three
  unbounded inputs (2026-10-02 review): a live result value of any length, the
  `memory.sh` output (one claim with "Step 1" and "version 2" against 300 memory files
  printed 601 lines, all but one from the keys `1` and `2`; a cap per key with a count of
  the rest would fix it), and the brief's list of untracked files. 0.4.0 adds two more
  (2026-10-02 review): a `result_file` copy, read in full by both reviews of a live
  result (see its Limits above), and the brief's list of flagged paths, one line per
  path, which a repo with thousands of skip-worktree bits (left after sparse checkout
  was turned off by hand) would make long. Like the untracked list, a count with the
  first paths in the brief and the full list in a run file would bound it.
