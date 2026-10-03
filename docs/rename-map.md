# Rename map: four source repos into reimagine-code

Appendix to [implementation-plan-v0.1.0.md](implementation-plan-v0.1.0.md), built
2026-10-03 from the four source repos at their pinned commits. Counts came from a scratch
script that is not kept, so rerun the greps at M2 and M4 start before relying on a count.
Where this map and the architecture disagree, the architecture wins.

The questions in section 4 were settled in the architecture and plan on 2026-10-03:

1. Root `AGENTS.md` hub: added in M1, with no `CLAUDE.md` adapter, per repo-docs.
2. History docs: frozen verbatim under `docs/history/`. Acceptance is rerun under the new
   names from a list drawn at M2 and M4 start.
3. The codex-code-review README becomes `plugins/recode-codex/README.md`.
4. The audit plugin's bridge calls: switched to `recode` in the audit repo's 0.4.0 work,
   before cutover (plan M7 step 0).
5. Every plugin directory carries the Apache-2.0 LICENSE (R5).
6. Same plugin name on two hosts: every install line in a README names its host.
7. The Codex root `plugin.json` form is kept for v0.1.0; a later Codex hook needs the
   `.codex-plugin` form. Versions: recode family 0.1.0 in lockstep, repo-docs 0.1.2.
8. The recode-codex LICENSE keeps the source file; its NOTICE keeps the upstream block
   (R28).
9. Orphaned user state: the loop blocks on `.ccl.json` (R23), and the changelog lists
   every renamed path under a Breaking heading.
10. New code goes in `rules.mjs` and `suite.mjs` with their own budgets (R14).
11. Old tags are not imported or rewritten.
12. `.gitignore`, dependabot, and LICENSE: as in sections 1 and 3.

The rest of this file is the map as built, unedited.


Date 2026-10-03. Read-only on the four source repos. Labels: **ran** = I ran it and read the exit code or output;
**read** = I read it in a file; **(inference)** = my reasoning, not run or read.

## 0. Evidence and method

- File lists: `git ls-files` at HEAD in each source. Counts 27 / 19 / 23 / 15 = 84 tracked files. All four trees have no
  changes to tracked files (ran `git status --porcelain --untracked-files=no`, 0 lines each).
  Inventory discrepancies: inventory-bridge says 26 tracked files (actual 27); inventory-loop says 16 shipped but lists 19
  paths (the miscount is the number, not the list).
- Counts come from `.scratch/rename_counts.py` (first-match-wins regex classes over tracked files only; run it with
  `python3 rename_counts.py`). Its totals match the inventories: bridge `codex-lite` 203 occurrences, loop `codex-lite:` 127. The
  class splits differ slightly from the inventories (for example the inventory counts script-name references as 23, this table
  22 + 1 double-escaped form at spawn.test:177 that the pattern misses); the totals agree.
- **Dry runs (ran, in /tmp/rm/mono*, outside every repo):** `git archive HEAD`, moved files per section 1, applied the
  ordered rules of section 2.0.
  - Bridge: `node tools/lint.mjs` exit 0 (`lint: ok (10 modules checked, runtime 697/700 lines)`) with NO lint edit, because the
    token rename fixed every path. `node --test tests/recode/*.test.mjs` first failed (`ERR_MODULE_NOT_FOUND`
    `tests/plugins/recode/scripts/codex.mjs` from `pure.test.mjs`), then after the two relative-path edits of section 3
    gave exit 0: 208 tests, 198 pass, 0 fail, 10 skipped (the same as the baseline in inventory-bridge).
  - Moving the README into `plugins/recode/` made lint exit 1 (`README.md: cannot read (ENOENT)`); see 3.1.
  - Loop: after the rules, 0 occurrences of `ccl` and 0 of `codex-lite` remain outside `docs/history/`; every `cca`
    string (`/cca:audit`, `/cca:handoff`, `cca-manifest.json`, `cca@`) is unchanged.
  - codex-code-review: `plugin.json` still valid JSON after the rename; the LICENSE is byte-identical (ran `cmp`); the five
    SKILL.md files have 0 hits of the old names (ran `git grep`) and no rule touches them, so they are unchanged by construction;
    skill `name` equals directory name in all five (ran).
  - repo-docs: all three JSON files valid; `hooks/pre-commit.sh` run from `plugins/repo-docs/hooks/` printed the
    audit-reminder JSON for `git commit` with an AGENTS.md in the index and nothing for `ls`, exit 0 both. Moving the plugin
    does not change hook behaviour.
- Not run: `npm test` / `npm run lint` through npm (I called `node --test` and `node` directly), the Windows job, the Codex
  marketplace load, any Claude or Codex plugin install, repo-docs's own audit against the proposed AGENTS.md split. The windows
  regex was checked with a Node one-liner only. The dry-run trees in /tmp/rm were deleted afterwards.
- Not migrating, nothing to map (read from `git status --ignored` and each `.git/info/exclude`):
  - codex-lite-cc: `.scratch/` (5 files: impl-plan.md, transport-gate.md, probe-prompt.txt, probe-prompt2.txt, sig.mjs).
    Its `.git/info/exclude` names `docs/anti-build-spec.md`, `architecture.md`, `measurements.md`, `plan.md`; none exists on disk.
    Per inventory-bridge, `transport-gate.md` is the only record of why the data dir is passed as argv; if you want that fact kept it needs a home in `docs/`.
  - claude-codex-loop: `SPEC.md`, `docs/architecture.md`, `docs/build-plan-v0.1.0.md`, `docs/spec-amendments-draft.md`
    (excluded via `.git/info/exclude`), `.ccl/` (4 run dirs), `scratch/`. No tracked file mentions any of the four docs
    (ran `git grep`, no output).
  - codex-code-review: nothing untracked. repo-docs: `.DS_Store`, `.claude/` (contains only a `.DS_Store`).
  - Excluded and ignored files were never committed: no path appears in any repo's history that is absent at HEAD (ran
    `git log --all --name-only` against `ls-files`, all four empty). So a history-preserving import cannot drag them in.
- Tags collide across the four repos (ran): `v0.1.0` is in all four; `v0.2.0` through `v0.9.0` are in both codex-lite-cc and
  claude-codex-loop. `git subtree` imports commits not tags; `git filter-repo --tag-rename` can prefix them. See 4.

## 1. Move tables

Legend: **move** = same content, new path. **edit** = moves and needs content edits (section 2 and 3). **merge** = content
feeds a root file. **history** = `docs/history/<old-repo>/`. **dropped** = not in the monorepo. Modes: only
`tests/fixtures/fake-codex.mjs` and `tools/lint.mjs` are 100755 in the migrating set (ran `git ls-files --stage`); both must
keep the bit (the dry run's `git archive | tar` kept it).

### 1.1 codex-lite-cc (27 files)

| Source | Target | Action and reason |
|---|---|---|
| `.claude-plugin/marketplace.json` | root `.claude-plugin/marketplace.json` | merge: seed of the root file (name, owner), entry rewritten, two more entries added |
| `.github/dependabot.yml` | `.github/dependabot.yml` | move, unchanged. Not in the decided root list (see 4). github-actions entry useful; npm entry has nothing to track (no dependencies) |
| `.github/workflows/ci.yml` | `.github/workflows/ci.yml` | move, unchanged (see 3.5) |
| `.gitignore` | root `.gitignore` | merge: add `node_modules/` and `*.log`; `.DS_Store` and `.scratch/` are already in the root file |
| `LICENSE` | root `LICENSE` | move. Chosen as root: canonical Apache text with the `vibecodedapps.net` appendix line. Ran `diff -w -B` against the others: repo-docs's is identical ignoring whitespace; the loop's differs only in whitespace and an unfilled appendix line (`Copyright [yyyy] [name of copyright owner]`); codex-code-review's has `Copyright 2025 OpenAI` |
| `NOTICE` | root `NOTICE` | merge (see 3.7) |
| `README.md` | `plugins/recode/README.md` | edit (see 3.2) |
| `docs/acceptance.md` | `docs/history/codex-lite-cc/acceptance.md` | history |
| `package.json` | root `package.json` | dropped as a file; replaced by the root one (see 3.4) |
| `plugins/codex-lite/.claude-plugin/plugin.json` | `plugins/recode/.claude-plugin/plugin.json` | edit: `name`, `repository` |
| `plugins/codex-lite/CHANGELOG.md` | `docs/history/codex-lite-cc/CHANGELOG.md` | history (it no longer ships in the plugin dir) |
| `plugins/codex-lite/commands/ask.md` | `plugins/recode/commands/ask.md` | edit (class A, C) |
| `.../commands/do.md` | `plugins/recode/commands/do.md` | edit (class C) |
| `.../commands/implement.md` | `plugins/recode/commands/implement.md` | edit (class A, C) |
| `.../commands/review.md` | `plugins/recode/commands/review.md` | edit (class A, C) |
| `.../commands/setup.md` | `plugins/recode/commands/setup.md` | edit (class C) |
| `.../hooks/hooks.json` | `plugins/recode/hooks/hooks.json` | edit (class C) |
| `.../scripts/codex-lite.mjs` | `plugins/recode/scripts/recode.mjs` | edit and rename (A, C, D, T, ROUTING) |
| `.../scripts/codex.mjs` | `plugins/recode/scripts/codex.mjs` | edit (2 comment hits: A, C) |
| `tests/fixtures/fake-codex.mjs` | `tests/recode/fixtures/fake-codex.mjs` | move, unchanged, keep 100755 |
| `tests/fixtures/harness.mjs` | `tests/recode/fixtures/harness.mjs` | edit (line 8 path depth, C, D, T) |
| `tests/fixtures/node-as-codex.mjs` | `tests/recode/fixtures/node-as-codex.mjs` | move, unchanged |
| `tests/git.test.mjs` | `tests/recode/git.test.mjs` | edit (A, T) |
| `tests/pure.test.mjs` | `tests/recode/pure.test.mjs` | edit (line 9 path depth, T) |
| `tests/spawn.test.mjs` | `tests/recode/spawn.test.mjs` | edit (A, C, D, T, NOTE) |
| `tests/windows.test.mjs` | `tests/recode/windows.test.mjs` | edit (A, C, D, line 101 regex) |
| `tools/lint.mjs` | `tools/lint.mjs` | edit, keep 100755 (see 3.1) |

### 1.2 claude-codex-loop (19 files)

| Source | Target | Action and reason |
|---|---|---|
| `.claude-plugin/marketplace.json` | (root `.claude-plugin/marketplace.json`) | dropped as a file; its `recode-loop` entry is written into the root file |
| `.claude-plugin/plugin.json` | `plugins/recode-loop/.claude-plugin/plugin.json` | edit: `name`, `repository`; new `dependencies` entry on `recode` (new, not a rename) |
| `.gitignore` | none | dropped: one line `scratch/`; the root ignores `.scratch/` |
| `CHANGELOG.md` | `docs/history/claude-codex-loop/CHANGELOG.md` | history |
| `LICENSE` | none | dropped: same Apache text as the root LICENSE; differs only in whitespace and an unfilled appendix line that names no holder (ran `diff -w -B`) |
| `NOTICE` | root `NOTICE` | merge (line 1 is the brand string `claude-codex-loop`; the rest is the Apache boilerplate) |
| `README.md` | `plugins/recode-loop/README.md` | edit (see 3.2) |
| `commands/plan.md` | `plugins/recode-loop/commands/plan.md` | edit (B, prose) |
| `commands/run.md` | `plugins/recode-loop/commands/run.md` | edit (B, prose) |
| `docs/acceptance.md` | `docs/history/claude-codex-loop/acceptance.md` | history |
| `docs/decisions.md` | `docs/history/claude-codex-loop/decisions.md` | history |
| `skills/ccl/SKILL.md` | `plugins/recode-loop/skills/recode-loop/SKILL.md` | edit and dir rename (A, B, N, prose, `name:`) |
| `skills/ccl/ci-watch.md` | `.../skills/recode-loop/ci-watch.md` | move, unchanged (0 hits) |
| `skills/ccl/handoff.md` | `.../skills/recode-loop/handoff.md` | edit (N, prose; `cca` untouched) |
| `skills/ccl/multi-repo.md` | `.../skills/recode-loop/multi-repo.md` | edit (A, N) |
| `skills/ccl/pr-body.md` | `.../skills/recode-loop/pr-body.md` | edit (1 prose string, line 78) |
| `skills/ccl/report.md` | `.../skills/recode-loop/report.md` | edit (N, header line 35) |
| `skills/ccl/tiers.md` | `.../skills/recode-loop/tiers.md` | edit (A) |
| `skills/ccl/worktree.md` | `.../skills/recode-loop/worktree.md` | edit (A, N) |

### 1.3 codex-code-review (23 files)

| Source | Target | Action and reason |
|---|---|---|
| `.agents/plugins/marketplace.json` | root `.agents/plugins/marketplace.json` | merge: seed of the root file; mirror entry dropped, general entry renamed, `repo-docs` entry added (the old file had no repo-docs) |
| `.gitattributes` | root `.gitattributes` | move: `* text=auto eol=lf` (all migrating files are LF, read from the inventory). Keep repo-docs's `*.sh text eol=lf` line too (see repo-docs row) |
| `.github/workflows/upstream-drift.yml` | none | dropped (decided) |
| `.gitignore` | none | dropped: `scratch/`, covered by root `.scratch/` |
| `LICENSE` | `plugins/recode-codex/LICENSE` | move verbatim (cmp identical). It is the upstream-form text (appendix line `Copyright 2025 OpenAI`). Decided "copies": I kept the upstream-form file rather than a copy of the root file (see 4, item 8) |
| `NOTICE` | `plugins/recode-codex/NOTICE` and root `NOTICE` | edit (see 3.7) |
| `README.md` | `plugins/recode-codex/README.md` | rewrite. NO target in the decided layout (see 4, item 3). Keep lines 1-13 reworded, 48-57 per-skill summary, 64-65 provenance statement, 93-95 license; drop 37-46, 59-62, 67-91 |
| `plugins/codex-code-review-general/plugin.json` | `plugins/recode-codex/plugin.json` | edit: `name`, `repository` |
| `plugins/codex-code-review-general/skills/general-code-review/SKILL.md` | `plugins/recode-codex/skills/general-code-review/SKILL.md` | move, byte-unchanged |
| `.../general-code-review-breaking-changes/SKILL.md` | `plugins/recode-codex/skills/general-code-review-breaking-changes/SKILL.md` | move, byte-unchanged |
| `.../general-code-review-change-size/SKILL.md` | `plugins/recode-codex/skills/general-code-review-change-size/SKILL.md` | move, byte-unchanged |
| `.../general-code-review-context/SKILL.md` | `plugins/recode-codex/skills/general-code-review-context/SKILL.md` | move, byte-unchanged |
| `.../general-code-review-testing/SKILL.md` | `plugins/recode-codex/skills/general-code-review-testing/SKILL.md` | move, byte-unchanged |
| `plugins/codex-code-review/plugin.json` | none | dropped: verbatim mirror |
| `plugins/codex-code-review/skills/code-review/SKILL.md` | none | dropped: mirror |
| `.../code-review-breaking-changes/SKILL.md` | none | dropped: mirror |
| `.../code-review-change-size/SKILL.md` | none | dropped: mirror |
| `.../code-review-context/SKILL.md` | none | dropped: mirror |
| `.../code-review-testing/SKILL.md` | none | dropped: mirror |
| `scripts/check-local.sh` | none | dropped: guards only the mirror via `upstream.lock` |
| `scripts/check-upstream.sh` | none | dropped (decided) |
| `scripts/sync-upstream.sh` | none | dropped (decided) |
| `upstream.lock` | none | dropped (decided). The pinned commit `f53f5a6fed66...` then survives only in the five provenance comments |

All 23 are LF, modes 100644 except the three scripts (100755, dropped). The five general SKILL.md files contain 0 hits of
`codex-code-review` (ran `git grep`), so the rename rules never touch them. Do not write any rule on the substring
`code-review`: the provenance comments (`openai/codex .codex/skills/code-review/SKILL.md`) must stay verbatim.

### 1.4 repo-docs (15 files)

| Source | Target | Action and reason |
|---|---|---|
| `.claude-plugin/marketplace.json` | none | dropped (decided); the root marketplace gets a `repo-docs` entry with `source: ./plugins/repo-docs` and no `version` keys |
| `.claude-plugin/plugin.json` | `plugins/repo-docs/.claude-plugin/plugin.json` | move, unchanged (authoritative version 0.1.1) |
| `.codex-plugin/plugin.json` | `plugins/repo-docs/.codex-plugin/plugin.json` | move, unchanged (version 0.1.1 copy) |
| `.gitattributes` | none | dropped: root file covers `*.sh`. Keep its one line `*.sh text eol=lf` in the root file, since the hook script must stay LF on a Windows checkout |
| `.gitignore` | root `.gitignore` | merge: `skills-lock.json` only (`/scratch/` is not needed) |
| `AGENTS.md` | `plugins/repo-docs/AGENTS.md` | edit: directory spoke (see 3.3) |
| `LICENSE` | none | dropped: identical to the root text ignoring whitespace (ran `diff -w -B`). Regression: see 4, item 5 |
| `README.md` | `plugins/repo-docs/README.md` | edit: install lines, "its own marketplace" (assumed target; the decided layout does not list it) |
| `hooks/hooks.json` | `plugins/repo-docs/hooks/hooks.json` | move, unchanged (uses `${CLAUDE_PLUGIN_ROOT}`) |
| `hooks/pre-commit.sh` | `plugins/repo-docs/hooks/pre-commit.sh` | move, unchanged. Stays: it is `hooks/`, not `scripts/*.sh` |
| `scripts/sync-version.sh` | none | dropped (decided). Its job needs a replacement lint check (see 3.1) |
| `skills/repo-docs/SKILL.md` | `plugins/repo-docs/skills/repo-docs/SKILL.md` | move, unchanged |
| `skills/repo-docs/references/placement.md` | `plugins/repo-docs/skills/repo-docs/references/placement.md` | move, unchanged |
| `skills/repo-docs/references/platforms.md` | `plugins/repo-docs/skills/repo-docs/references/platforms.md` | move, unchanged |
| `skills/repo-docs/references/spokes.md` | `plugins/repo-docs/skills/repo-docs/references/spokes.md` | move, unchanged |

### 1.5 New files, from no source (not migrations)

Root `.claude-plugin/marketplace.json` (seeded from the bridge's), root `.agents/plugins/marketplace.json` (seeded from
codex-code-review's), root `README.md`, suite `CHANGELOG.md`, root `package.json`, merged `.gitignore`, root `NOTICE`,
`plugins/recode/commands/rules.md`, `plugins/recode-codex/README.md`, and, if you take 4 item 1, a root `AGENTS.md` hub
(plus a one-line `CLAUDE.md` adapter if Claude Code should load it).

## 2. String renames

### 2.0 Ordered rule list (what the dry runs applied; order matters)

Bridge files (live, not `docs/history/`):

```
s#https://github.com/vibecodedapps-official/codex-lite-cc#https://github.com/vibecodedapps-official/reimagine-code#g
s#vibecodedapps-official/codex-lite-cc#vibecodedapps-official/reimagine-code#g
s#vibecodedapps-codex-lite#reimagine-code#g
s#CODEX_LITE_#RECODE_#g
s#codex-lite-cc#reimagine-code#g          (must precede the bare rule, or it yields "recode-cc")
s#codex-lite#recode#g                     (one bare token rule covers classes A, C, T, prose, and the escaped paths)
```

Loop files add, before the bare `codex-lite` rule: `claude-codex-loop` URL, slug and marketplace forms -> `reimagine-code`, then:

```
s#ccl:ccl#recode-loop:recode-loop#g  s#ccl:#recode-loop:#g  s#ccl@#recode-loop@#g
s#ccl run#recode run#g                    (decided report header; also the PR comment opener, see F)
s#skills/ccl#skills/recode-loop#g  s#\.ccl\.json#.recode.json#g  s#\.ccl/#.recode/#g  s#\.ccl\b#.recode#g
s#specs/ccl#specs/recode#g  s#-ccl-#-recode-#g
s#\bccl\b#recode-loop#g                   (ASSUMED prose rule, see 2.2; must be last)
```

Never write `s#cca#...#`: `cca:`, `/cca:`, `cca-manifest.json`, `cca@`, `cca-handoff: 1` stay. Do not apply any rule to
`docs/history/` unless you choose option (b) in 4 item 2. Do not edit the five general SKILL.md files.

### 2.1 Decided classes. Counts are occurrences in tracked files: live | frozen in `docs/history/` (dropped files excluded)

| Class | Pattern -> replacement | Files affected (live, count) | Count live | Count frozen | Judgment |
|---|---|---|---:|---:|---|
| A1 bridge slash prefix | `/codex-lite:` -> `/recode:` | bridge: README 14, commands ask 2, review 2, implement 1, script 2, spawn.test 3 (NOTE x2, one hook-test prompt) | 24 | 36 (acceptance 25, CHANGELOG 11) | The `description` of ask, review, implement names `/codex-lite:do` (5 literal) so these are hand-readable too. Slash names themselves follow the plugin `name`, not the directory |
| A2 bridge output prefix | `codex-lite: ` -> `recode: ` | bridge: script 8, codex.mjs 1 (comment), README 1, git.test 11, spawn.test 39, windows.test 5 | 65 | 2 (CHANGELOG, both bare `/codex-lite:` mentions, lines 76 and 146) | The 65 include 6 regex literals in spawn.test (`/codex-lite: the run failed.../`, where the leading `/` is the regex delimiter, not a slash prefix) and 1 test title (spawn.test:60). Tests mix exact `assert.equal` on whole stdout and anchored regexes; both take plain text replacement because expected values are literals. The prefix is not parsed by the loop: 0 hits of `codex-lite: ` in loop files (ran, closes inventory-bridge 8.5 "none seen; unverified") |
| A3 loop calls to bridge | `codex-lite:<ask\|review\|implement>` (Skill form) -> `recode:...`; `/codex-lite:` -> `/recode:` | loop: SKILL 34+1, multi-repo 11, tiers 10, worktree 2, README 2+3 | 63 | 64 (acceptance 47, CHANGELOG 9, decisions 8) | 8 of the 63 sit in text the dependency decision deletes (SKILL 530 `/codex-lite:setup` and 550-554: 5; README 51-52: 3) |
| B1 skill id | `ccl:ccl` -> `recode-loop:recode-loop` | loop: commands/plan.md:56, commands/run.md:57 | 2 | 2 | These two plus `name:` in SKILL.md:2 are the only load-bearing self-references (read, inventory-loop 2.5) |
| B2 loop slash | `/ccl:run`, `/ccl:plan` -> `/recode-loop:run`, `/recode-loop:plan` | README 7, plan.md 5, run.md 2, SKILL 4 | 18 | 191 (acceptance 182, CHANGELOG 7, decisions 1, bridge acceptance 1) | command names kept. `plan.md:15` carries 3 of its 5 as rejection pointers |
| B3 loop colon forms | `ccl:run`, `ccl:plan` without slash, other `ccl:` -> `recode-loop:` | none live | 0 | 3 (acceptance 2, CHANGELOG 1) | frozen only |
| C script file | `codex-lite.mjs` -> `recode.mjs` (also `codex-lite\.mjs`; plus 1 double-escaped `codex-lite\\.mjs` in a template literal at spawn.test:177, which the pattern did not count) | commands 10 (5 allowed-tools, 5 step 3), hooks.json 1, script 3, codex.mjs 1, harness 1, spawn.test 2, windows.test 1, lint 3 | 22 (+1) | 0 | The `allowed-tools` rule and the step-3 Bash line of each command must stay byte-identical; no lint check ties them (read lint.mjs), so a miss shows only as a runtime permission prompt. The bare token rule changes all 10 together |
| C-dir path | `plugins/codex-lite` -> `plugins/recode` | marketplace.json 1, README 1, harness 1, pure.test 1, lint 14 | 18 (+1) | 3 (bridge acceptance, `.../codex-lite/<ver>` cache paths) | Plus 1 in escaped form (`plugins\/codex-lite`, windows.test:101), see 2.3. A path-based rule misses that one |
| D env vars | `CODEX_LITE_CODEX_BIN`, `CODEX_LITE_TIMEOUT_MS`, `CODEX_LITE_PROBE_TARGET` -> `RECODE_CODEX_BIN`, `RECODE_TIMEOUT_MS`, `RECODE_PROBE_TARGET` | README 3, script 9, harness 3, spawn.test 13, windows.test 8 | 36 | 2 (bridge acceptance) | Test-only seams, read once at startup. No `RECODE_` string exists anywhere in the four repos today (ran `git grep -i recode`, 0 hits), so no collision |
| E1 run dir | `.ccl/` -> `.recode/` | README 10, SKILL 27, multi-repo 7, worktree 4, handoff 3, report 3 | 54 | 30 | The directory must stay git-ignored (the bridge reads request files only from an ignored dir); the loop adds `.recode/` to `.git/info/exclude` itself (read, SKILL 383-388) |
| E2 bare `.ccl` | `.ccl` -> `.recode` | SKILL:385 (`git check-ignore .ccl`) | 1 | 0 | |
| E3 repo config | `.ccl.json` -> `.recode.json` | README 3, SKILL 8, multi-repo 1, report 1 | 13 | 16 | Heading `## Repo config: .ccl.json` (README:258). User-facing contract: see 4 item 9 |
| E4 snapshot dir | `specs/ccl/` -> `specs/recode/` | README 4, SKILL 7, multi-repo 1, report 1, worktree 1 | 14 | 7 | Committed into user repos when `"commit": true` |
| E5 worktree suffix | `-ccl-` -> `-recode-` | SKILL:345, SKILL:846 | 2 | 1 | |
| E6 skill dir | `skills/ccl` -> `skills/recode-loop` | no live prose hit; the directory itself moves (section 1.2) | 0 | 7 | Supporting files are found by "this skill's base directory", not by path, so nothing else in SKILL.md depends on the dir name (read) |
| F report headers | `ccl run report` -> `recode run report` (report.md:35) | report.md 1 | 1 | 0 | Decided |
| F2 PR comment opener | `Status from the ccl run` -> `Status from the recode run` (pr-body.md:78) | pr-body.md 1 | 1 | 2 | NOT in the decided list. Same class (text that lands in user PRs and issues). Applied by the `ccl run` rule; confirm |
| G marketplace names | `vibecodedapps-codex-lite`, `vibecodedapps-claude-codex-loop` -> `reimagine-code` | bridge marketplace.json 1, bridge README 1, loop marketplace.json 1, loop README 2 (:63 the bridge's install id, which goes with the dependency decision; :80 the loop's own id) | 5 | 1 (loop CHANGELOG) | `repo-docs@repo-docs` -> `repo-docs@reimagine-code` (rd README 2, lines 29 and 36); `codex-code-review` marketplace -> `reimagine-code` (ccr marketplace 1, README 5 incl. config keys, NOTICE 1) |
| H repo URLs and slugs | `https://github.com/vibecodedapps-official/<old>` -> `.../reimagine-code`; slug form `vibecodedapps-official/<old>` -> `vibecodedapps-official/reimagine-code` | URLs: bridge plugin.json 1, loop plugin.json 1, loop README 2, ccr general plugin.json 1. Slugs: bridge README 1, loop README 2, ccr README 1, repo-docs README 2 | 5 URLs, 6 slugs | 0 | The decision lists URLs only. The `/plugin marketplace add <owner>/<repo>` lines use the slug form, and lint check 3 derives its expected slug from `plugin.repository`, so both must agree. `codex-code-review-general` plugin.json also carries `repository` |
| I plugin ids | `codex-lite@` -> `recode@`; `ccl@` -> `recode-loop@` | loop README 2 (bridge id line 63; own id line 80), bridge README 1 | 3 | 1 (loop CHANGELOG) | Install ids are `<plugin>@reimagine-code` after the rename |

### 2.2 Classes not in the decided list (judgment, with what I assumed)

| Class | Pattern -> assumed replacement | Files affected | Count live (frozen) | Judgment |
|---|---|---|---:|---|
| T temp and probe names | `.codex-lite-probe-`, `.codex-lite-sandbox-probe-`, `codex-lite-test-`, `codex-lite-pure-` -> `.recode-probe-`, `.recode-sandbox-probe-`, `recode-test-`, `recode-pure-` | README 1, script 2, harness 2, git.test 3, pure.test 6, spawn.test 2 | 16 (0) | The probe dir is created in the user's working dir and `~/.codex-lite-sandbox-probe-<pid>` in home, so this is visible to users. Tests assert the patterns (git.test 229, 247, 276; spawn 155, 169; pure 105-113; harness 67) and pass because script and tests move together (ran). Recommend rename: zero cost, consistent. A leftover probe dir from an old version would not match the new prefix; low impact (inference). `.recode-probe-*` does not collide with the loop's `.recode/` ignore line (a directory-name pattern, inference) |
| Prose `codex-lite` | `codex-lite` -> `recode` | bridge: marketplace.json:8 `name`, plugin.json:2 `name`, script:364 (ROUTING "Use codex-lite for Codex requests"), spawn.test:38 (NOTE), plus 2 escaped path forms (spawn.test:177, windows.test:101, see 2.3); loop README 6, SKILL 14, multi-repo 3, tiers 1, worktree 1 | 31 (53) | One bare rule handles it. 18 of the 92 live `codex-lite` hits in the loop sit in text that context.md deletes (SKILL 522-530: 2, 550-557: 4, 866-870: 2; README 50-64: 10): delete, do not rename |
| Prose `ccl` (19 live) | `ccl` -> `recode-loop` (assumed), except the two strings of F, plus 3 phrases where the result reads badly | marketplace.json 2 (:7 description, :11 name), plugin.json:2, README :3 `` `ccl` is a Claude Code plugin ``, :101, :414, :425; plan.md :2 (twice), :7; run.md :2, :7; SKILL :2 `name: ccl`, :3 description, :46 `# ccl orchestrator`, :48; handoff.md :8, :176 (`ccl does not record the user's name`), :238 (example branch `ccl/sync-retry`) | 19 (11) | The decision names prefixes and paths but not the word. The rule yields "the recode-loop loop" at run.md:2, plan.md:2 and SKILL.md:48: hand-edit to "the recode loop" (inference: better reading). README:101 "The plugin name is `ccl`, so the commands do not collide with the built-in `/loop`" stays true with `recode-loop`. handoff.md:238 is an example in a `cca` format sample: rename is harmless, leaving it is also fine (cca has no machine-read `ccl` string; its prose mentions are in 4 item 4) |
| Repo names in prose | `codex-lite-cc`, `claude-codex-loop`, `codex-code-review` (as repo name) -> `reimagine-code` or the plugin name by context | bridge README:1 title, README:352 `--plugin-dir` path, NOTICE:1, package.json:2; loop README:1 title, NOTICE:1; ccr NOTICE:1, README:1 (the ccr README is a rewrite) | 8 | Titles become the plugin names (`# recode`, `# recode-loop`); the `--plugin-dir` path becomes `/path/to/reimagine-code/plugins/recode` |
| ccr plugin name | `codex-code-review-general` -> `recode` | marketplace 2, plugin.json:3, README 3, NOTICE 1 | 7 | Config keys in README :27, :30 become `[plugins."recode@reimagine-code"]`. NOTICE:9 is a path: `plugins/recode-codex` |
| Line length | n/a | live loop files | 148 lines change under the prefix and path rules alone (ran); 23 of them go over 92 columns | The loop docs are hard-wrapped at about 88-92 columns (inventory-loop 1.6). `recode-loop:` is 9 characters longer than `ccl:`. Decide whether to rewrap; no rule or tool needs it |

### 2.3 Cases that need care

1. **`tests/windows.test.mjs:101`** (skipped off Windows, so only the `windows-latest` job would show a miss):
   ``assert.match(rule, /^  "Bash\(node \\"[A-Za-z]:\/[^\\"]*\/plugins\/codex-lite\/scripts\/codex-lite\.mjs\\" \*\)"$/)``. The path
   is regex-escaped (`plugins\/codex-lite`): `git grep 'plugins/codex-lite/'` finds 0 hits in that file, 1 for `plugins\\/codex-lite`
   (ran). A path rule misses it; the bare token rule catches it. Result:
   `/^  "Bash\(node \\"[A-Za-z]:\/[^\\"]*\/plugins\/recode\/scripts\/recode\.mjs\\" \*\)"$/`. Checked with a Node one-liner
   against `  "Bash(node \"C:/Users/x/reimagine-code/plugins/recode/scripts/recode.mjs\" *)"`: new regex true, old regex false.
2. **ROUTING and NOTE.** `scripts/codex-lite.mjs:364-368` (`ROUTING`) and `tests/spawn.test.mjs:38-42` (`NOTE`) are byte-for-byte
   copies; both contain `Use codex-lite for Codex requests` and `/codex-lite:do`, `/codex-lite:setup`. The token rule edits both
   identically (ran: tests pass). Keep them in step by hand afterwards. The hook trigger is `/codex/i` on the user prompt; `recode`
   does not contain `codex`, so the new plugin name does not fire it (read the regex, inference on the name).
3. **Hook tests** use `/codex-lite:do ... ask codex nothing` (spawn.test:61). It stays a valid "typed command gets nothing" test
   after the rename because the prompt still contains "codex" and starts with a slash command.
4. **`setup` prints the Bash rule** with `scripts/codex-lite.mjs` (script:357) and assumes the script is exactly two levels below the
   plugin root. `plugins/recode/scripts/recode.mjs` keeps that. The spawn.test:160/175/177 literals follow the token rule.
5. **Frozen history.** The five `docs/history/` files hold about 430 matches of the rules above (sum of the frozen column; see 4
   item 2). The bridge acceptance has 19 `codex-lite` or `CODEX_LITE` hits in item bodies and 14 in its `## Record` table; the
   loop acceptance has 291 `ccl` or `codex-lite` hits in item bodies and 0 in `## Record of runs` (ran).
6. **Output that lands outside the repo** (PRs, issues, reports): `# recode run report`, `Status from the recode run`, the
   `specs/recode/<run-id>/` snapshot path, the `-recode-` worktree suffix, the `.recode/` ignore line. Existing user repos keep
   `.ccl.json`, `.ccl/` exclude lines and committed `specs/ccl/` snapshots (see 4 item 9).
7. **Do not touch:** `cca:` forms; `cca-manifest.json`; `cca-handoff: 1`; `skills/cca/...`; author `vibecodedapps.net` (NOTICE:2,
   LICENSE:189, `author` blocks); the five provenance comments; the upstream NOTICE block; the schema URL
   `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json` (the Codex build supports only 1.0.0, read in codex-platform.md).
8. **Historical names that must stay (not renamed):** the five `docs/history/` files; git history, including commit scopes such as
   `feat(codex-lite): ...` and the old tags; the bridge NOTICE line naming `openai/codex-plugin-cc` and
   `vibecodedapps-official/codex-plugin-cc` (a different project, not a rename target); and the OpenAI attribution strings. Any
   new CHANGELOG entry that says "renamed from codex-lite" keeps the old name by design.
9. **Old names the new `setup` must contain.** context.md has `setup` detect the old plugins and print uninstall commands. That text
   needs `codex-lite@vibecodedapps-codex-lite`, `ccl@vibecodedapps-claude-codex-loop`, `repo-docs@repo-docs` and
   `codex-code-review-general@codex-code-review` verbatim. A "no residual old name" check, like the one in my dry runs, would need an
   allowlist for that file (inference).
10. **Name rule.** Codex plugin names allow lowercase letters, digits, `.`, `-` (read, codex-platform.md); `recode` fits. Marketplace
   `reimagine-code` fits `[A-Za-z0-9_-]`.

## 3. Edits forced by the move (not renames)

### 3.1 `tools/lint.mjs` (read; line numbers of the bridge file; dry run showed which are pure renames)

| Lines | Edit | Verified |
|---|---|---|
| 30 | `["plugins","tests","tools"]` walk is recursive: `tests/recode/**` is checked, no change | ran (10 modules checked) |
| 37-39 | runtime list `plugins/recode/scripts/{codex,recode}.mjs`. Check 2 rejects any other `.mjs` under `plugins/`: fine for recode-loop, recode-codex, repo-docs (none ship `.mjs`). It also blocks any new script for `rules` or a hook change | ran (rename only) |
| 48-55 | check 3 compares `package.json`, one `plugin.json`, one marketplace entry. With three plugins it must iterate the marketplace entries and each plugin's `plugin.json`. `package.json.version` has no meaning for a suite: drop it from the equality or pin it (see 4 item 7b) | read |
| 56-62 | reads **root** `README.md` and requires two whole lines: `/plugin marketplace add vibecodedapps-official/reimagine-code` and `/plugin install recode@reimagine-code`. The decided layout moves the bridge README to `plugins/recode/README.md`: **lint exit 1, `README.md: cannot read (ENOENT)`** (ran). Fix: the new root README carries one install block with those lines for every plugin, and check 3 loops over the entries (recommended). The alternative is to point check 3 at each plugin README | ran |
| 65, 67, 71 | `plugins/recode/commands/<name>.md`. The `hidden` map needs an entry for the new `rules` command (its `disable-model-invocation` is undecided) | read |
| 75-81 | hooks.json path and the deep-equal object `args: ["${CLAUDE_PLUGIN_ROOT}/scripts/recode.mjs","hook"]` | ran (rename only) |
| 84-98 | check 6 reads `.git/info/exclude` of the repo it runs in and scans every file for `<stem>.md` and `<stem> <n>`. In the monorepo the exclude file is unrelated, and the walk now covers every plugin and `docs/history/`; if the exclude ever lists `docs/plan.md`, the text "plan 3" in ordinary prose fails. Recommend deleting check 6 (inference); no shipped file in the four repos names an excluded doc (ran `git grep`) | read |
| 104, 109, 113, 120-125 | paths only (token rename) | ran |
| new | replacement for `sync-version.sh`: repo-docs `.claude-plugin/plugin.json` `version` must equal `.codex-plugin/plugin.json` `version` (both 0.1.1 today, ran). Optional: every marketplace `source` directory exists and holds a manifest; `recode-codex/plugin.json` keeps the `$schema` | (inference) |

### 3.2 READMEs and links (read)

- **`plugins/recode/README.md`** (from bridge README): :1 title; :9-10 install lines (lint wants them in the root README, see 3.1);
  :299 and :355 name `docs/acceptance.md` (item 19) -> `docs/history/codex-lite-cc/acceptance.md`, or a repo URL because the file
  will not be inside an installed plugin copy (inference: only the plugin directory is copied; the cache evidence for `source: ./`
  versus a subdirectory is in inventory-review-and-docs B7.8, itself an inference); :329-355 `## Development` (npm test, npm run
  lint, CI, test env vars, `claude --plugin-dir /path/to/codex-lite-cc/plugins/codex-lite`) describes tests and lint, which no
  longer ship in the plugin dir: move it to the root README or `docs/`; :359 `[LICENSE](LICENSE)` and `[NOTICE](NOTICE)` are dead
  relative links inside `plugins/recode/`.
- **`plugins/recode-loop/README.md`**: :38-72 Prerequisites (the bridge install block :62-63 and the 0.8.0/0.9.0 wording go; a
  `dependencies` note replaces it); :74-88 Install says "The repo is its own marketplace" and `git clone` + `claude --plugin-dir
  <path-to-clone>`, which now needs `<clone>/plugins/recode-loop` (and, inference, the `recode` dependency may not resolve in a
  `--plugin-dir` session; unverified); :100-101 naming rationale; :258 heading; :475-476 `docs/decisions.md` and
  `docs/acceptance.md` -> `docs/history/claude-codex-loop/...`; :481 `LICENSE` and `NOTICE`.
- **`plugins/repo-docs/README.md`**: :23 "This repository is its own plugin marketplace" is false; :28-29 and :35-36 install lines
  use `vibecodedapps-official/repo-docs` and `repo-docs@repo-docs`; :43 "See `LICENSE`" (no LICENSE in the plugin dir).
- **`plugins/recode-codex/README.md`**: see 1.3.

### 3.3 `plugins/repo-docs/AGENTS.md` (read; line numbers of the source file)

Pointer grammar: "The path is bare and relative to the repo root", and a directory spoke "holds only rules for tasks confined to
`<dir>`" (read, `spokes.md:16-22`, `SKILL.md:24`).

| Lines | Problem after the move | Edit |
|---|---|---|
| 46-51 | `## Spokes` index with 4 pointers `skills/repo-docs/...`; from the monorepo root these paths do not exist, which repo-docs's own audit classes as an error | Remove the index from the spoke; add the 4 pointers to the **root hub** as `plugins/repo-docs/skills/repo-docs/...`, and one hub pointer `plugins/repo-docs/AGENTS.md: ... Read before editing under plugins/repo-docs/.` |
| 10-14, 25, 34-36 | `sh scripts/sync-version.sh` and "copies the version into the other two manifests" (script dropped; the marketplace no longer holds a version) | rewrite to the new rule: version in `.claude-plugin/plugin.json`, copy in `.codex-plugin/plugin.json`, checked by lint |
| 13-14 | release: tag `vX.Y.Z`; "There is no changelog file" | tag `repo-docs--vX.Y.Z` (decided scheme); the suite now has a CHANGELOG with component scopes |
| 15-16, 29 | `hooks/pre-commit.sh` paths | `plugins/repo-docs/hooks/pre-commit.sh`, or keep plugin-relative if the spoke says so; the sample-event commands were run from the new location (ran, same output) |
| 27-28 | "CLAUDE.md is exactly `@AGENTS.md`, and this repo has none" | false for the monorepo if the root gets an adapter; scope the sentence to the plugin directory |
| 20-44 | "Hard constraints" (no markdown parser, POSIX sh, one hook, line budgets) would read as repo-wide if left at the root; as a directory spoke they apply to `plugins/repo-docs/` only | keep in the spoke; do not copy to the root hub (placement.md: a rule repeated at two scopes is a finding) |
| 37-41 | paths `skills/repo-docs/...` | plugin-relative, fine inside the spoke |

### 3.4 `package.json` and tests

- Root `package.json`: `name` `reimagine-code`, `private`, `type: module`, `engines.node ">=22"`, `description`, `license`.
  `scripts.test`: `node --test tests/*.test.mjs` -> `node --test tests/recode/*.test.mjs` (not run through npm; the dry run called
  node directly). On Windows npm runs the script through cmd.exe, which does not expand `*`; Node 22 expands the glob itself
  (inference; the Windows job is the proof). `scripts.lint` unchanged.
- `tests/recode/fixtures/harness.mjs:8`: `new URL('../../plugins/codex-lite/scripts/codex-lite.mjs', import.meta.url)` ->
  `'../../../plugins/recode/scripts/recode.mjs'` (one directory deeper). Without it every spawn test fails (ran).
- `tests/recode/pure.test.mjs:9`: `'../plugins/codex-lite/scripts/codex.mjs'` -> `'../../plugins/recode/scripts/codex.mjs'` (ran:
  `ERR_MODULE_NOT_FOUND` before the edit, exit 0 after).
- Other imports are relative inside `tests/recode/` (`./fixtures/harness.mjs`, `./fake-codex.mjs`, `./fixtures/node-as-codex.mjs`)
  and need no edit (read).

### 3.5 CI

`.github/workflows/ci.yml` has no `working-directory`, no `cd`, no path filter (read): it runs `npm run lint` and `npm test` at the
repo root, where the new root `package.json` sits. So it moves byte-identical. Job names `test (ubuntu-latest|macos-latest|windows-latest)`
are unchanged. Nothing else forced.

### 3.6 Manifests and marketplaces (read)

- Root `.claude-plugin/marketplace.json`: `name` `reimagine-code`; entries `recode` (`./plugins/recode`), `recode-loop`
  (`./plugins/recode-loop`), `repo-docs` (`./plugins/repo-docs`). Old `source: "./"` (loop, repo-docs) is gone. The loop's
  `metadata.description` ("The ccl plugin for Claude Code...") needs a new text. Entry `version` keys: lint check 3 requires them
  equal to `plugin.json`; repo-docs's `metadata.version` and entry version must not carry over.
- Root `.agents/plugins/marketplace.json`: `name` `reimagine-code`; `interface.displayName` was `Codex Code Review` (new text needed);
  entries `recode` with `source.path` `./plugins/recode-codex` and `repo-docs` with `./plugins/repo-docs`; keep `policy` and `category`.
  Codex reads this file first and then never reads `.claude-plugin/marketplace.json` (read, codex-platform.md section 2); I did not
  load it in Codex.
- `plugins/recode/.claude-plugin/plugin.json`, `plugins/recode-loop/.claude-plugin/plugin.json`, `plugins/recode-codex/plugin.json`:
  `repository` -> `https://github.com/vibecodedapps-official/reimagine-code`. repo-docs has no `repository`; a generalized lint
  check 3 either requires one or skips it.
- `plugins/recode-loop/.claude-plugin/plugin.json`: new `dependencies` entry on `recode` (decided in context.md, not a rename).

### 3.7 NOTICE and LICENSE text that becomes false (read)

| File:line | Text | After the move |
|---|---|---|
| bridge `NOTICE:1` | `codex-lite-cc` (repo name) | root NOTICE heading |
| bridge `NOTICE:17-19` | "This is an independent implementation. It contains no source code from openai/codex-plugin-cc or vibecodedapps-official/codex-plugin-cc." | still true for the bridge; scope it ("the recode plugin") because root text covers more |
| loop `NOTICE:1` | `claude-codex-loop` | root heading |
| ccr `NOTICE:1` | `codex-code-review` | root heading |
| ccr `NOTICE:4-7` | "This repository redistributes, unmodified, the code-review skills ... The pinned upstream commit is recorded in upstream.lock." | **false**: mirror and `upstream.lock` are gone. Delete |
| ccr `NOTICE:9-10` | "The skills under plugins/codex-code-review-general are modified derivatives of those same upstream files. Each modified file carries a notice saying so." | still true; path -> `plugins/recode-codex` |
| ccr `NOTICE:12-19` | upstream NOTICE block (OpenAI Codex, Ratatui MIT lines) | keep verbatim in both root NOTICE and `plugins/recode-codex/NOTICE` |
| `LICENSE:189` variants | bridge and repo-docs `Copyright 2026 vibecodedapps.net`; loop unfilled template; ccr `Copyright 2025 OpenAI` | root takes the bridge file; recode-codex keeps the ccr file |

## 4. Contradictions, gaps and decisions

1. **The decided layout has no root AGENTS.md, but moving repo-docs's AGENTS.md as a directory spoke needs one.** The skill's own
   Codex rule requires a hub pointer "Read before editing under `plugins/repo-docs/`", and the pointer index lives in the hub (read).
   Without a root hub the spoke fails repo-docs's own audit. Recommendation: add a root `AGENTS.md` hub (with the 4+1 pointers of
   3.3) and a `CLAUDE.md` containing exactly `@AGENTS.md`. This also fixes "repo-docs unchanged": its manifests and skill files are
   unchanged, but AGENTS.md, README and the version tooling are not.
2. **docs/history versus live procedures.** Both acceptance files are the only test surface of their plugins and say when to rerun
   items; the loop's has 12 "Not yet run" lines. Their item bodies are commands (`/codex-lite:ask`, `/ccl:run`; 291 name hits in the
   loop's items, 19 in the bridge's). Decision needed:
   (a) freeze verbatim in `docs/history/` (recommended: the dated Record rows were true under the old names; the live suite
   acceptance doc is new work); or (b) rename item bodies only, leaving Record rows. The map assumes (a): no rule touches
   `docs/history/`. Under (b) about 310 of the 430 frozen matches (the acceptance item bodies) would change.
3. **codex-code-review's README has no target in the layout** (recode-codex lists only plugin.json, skills, LICENSE, NOTICE). After
   `upstream.lock` goes, the README's "Generalized variant" per-skill summary is the Apache 2.0 section 4(b) record of what changed
   (inference; the provenance comments say only "Modified."). Recommend `plugins/recode-codex/README.md`.
4. **`cca` is a separate plugin, but it hard-codes the bridge's old name.** Read-only `git grep` in
   `/Users/joe/Code/Local/claude-codex-audit` (a fifth repo, outside your four; I changed nothing there): 34 occurrences of
   `codex-lite` on 33 lines in 7 files, including calls to the Skill `codex-lite:ask` (`skills/cca/stages/6-second-opinion.md:120`, `SKILL.md:120`) and a lookup of plugin ids starting
   `codex-lite@` with a 0.7.0 floor (`6-second-opinion.md:43-46`). After the rename, stage 6 would take its documented swap
   ("codex-lite not installed or version unreadable") (read, not run). So "audit stays separate for now" is not free: cca needs the
   same rename pass before cutover. In the other direction nothing machine-read breaks: cca has no `.ccl`, `ccl:`, `specs/ccl`, `run report`
   or `Status from the` string (ran), and it receives absolute paths. Its prose still says `ccl` and links
   `github.com/vibecodedapps-official/claude-codex-loop` (README 20-21, 226, 645-651; docs/decisions.md, 10 lines): stale, not broken.
5. **LICENSE regression.** Today repo-docs installs with a LICENSE (its cache holds the whole repo; read in
   inventory-review-and-docs B7.8) and, by the same `source: "./"`, so probably does the loop; the bridge already installed without
   one (`source: ./plugins/codex-lite`). After the move, only `recode-codex` ships one, as decided; the other three would install
   without it (inference). Decide whether each plugin dir gets a LICENSE copy.
6. **Codex plugin named `recode` and Claude plugin named `recode`** do not clash: Codex stops at `.agents/plugins/marketplace.json`
   when it exists (read), and `recode-loop` and the Claude `recode` are not listed in it. Both resolve to `recode@reimagine-code`
   on different hosts, so every README must say which host an install line is for.
7. **Contradiction with context.md.** context.md says Codex-only skills live in a directory named only by
   `.codex-plugin/plugin.json` `skills`. The decided layout uses a root `plugin.json` (Agent Plugins format), which has no `skills`
   field (it hard-codes `./skills`) and, in Codex 0.159.2, discards hooks, commands and apps for that format (read,
   codex-platform.md sections 3, 5 and 6). Host segregation still holds because `plugins/recode-codex/` is not in the Claude
   marketplace, but a future Codex reverse bridge with hooks cannot live in this plugin as laid out.
   **7b. Unstated: version numbers.** The sources are recode 0.9.0 (bridge), recode-loop 0.10.0, repo-docs 0.1.1, recode-codex 0.1.0.
   Whether the new names keep or restart those numbers decides the `recode-loop` dependency range, the tags `<plugin>--v<ver>`
   (item 11), the marketplace entry versions that lint compares, and whether root `package.json` carries a version at all.
8. **LICENSE for recode-codex: "copies" is ambiguous.** I kept the ccr file (appendix `Copyright 2025 OpenAI`, byte-identical to the
   source) because the plugin ships derivatives of OpenAI files. A copy of the root file is also valid Apache text. NOTICE: the plugin
   copy must carry the upstream block, so it is not a copy of a root NOTICE that omits it.
9. **User-side state is orphaned by the decided renames.** Users' `.ccl.json`, `.git/info/exclude` lines `.ccl/`, and committed
   `specs/ccl/<run-id>/` snapshots are keyed on the old names (read, inventory-loop 5 and 9.7). The map assumes no compatibility read of
   the old names; that is a breaking change for loop users and needs a CHANGELOG line. Likewise the bridge's data dir
   `<plugin>-<marketplace>` changes, so the Edit and Bash allow rules printed by `setup` are new (old thread files are not carried
   over; harmless, they are per session).
10. **Lint constraints on new work.** The runtime budget is 697 of 700 lines and check 2 allows exactly two `.mjs` files under
    `plugins/`. The new `rules` command and "hook exits silently when plugin data records no Codex" both need code or a budget change
    (inference); a prompt-only `rules` command fits.
11. **Tags.** See section 0. `git subtree add` brings no tags; `git filter-repo --tag-rename` can map `v0.9.0` to
    `recode--v0.9.0` and `v0.10.0` to `recode-loop--v0.10.0` once item 7 settles the version numbers. The one commit of
    codex-code-review contains the mirror, scripts and `upstream.lock`: a history import keeps them in history unless stripped (with
    `--invert-paths`); for a single commit, copying the files may be simpler than importing it (inference).
12. **`.gitignore`, `.github/dependabot.yml`, `LICENSE` choice** are not in the decided root list; handled in section 1 (merge,
    keep with the github-actions entry as the useful one, bridge file as root).
