# Requirements: v0.1.0

Drafted 2026-10-03 alongside [architecture.md](architecture.md) and the
[implementation plan](implementation-plan-v0.1.0.md). Where this document and the
architecture disagree, this document wins until it is amended. Nothing here is
implemented.

Each requirement ends with how it is checked:

- **test**: an automated test in `tests/`, run by `npm test` and CI.
- **lint**: a rule in `tools/lint.mjs`, run by `npm run lint` and CI.
- **acceptance**: a hand-run item in `docs/acceptance.md`, recorded with date, machine,
  and CLI versions.
- **review**: checked by reading, once, in the PR that merges it.

A requirement that depends on an M0 spike says so. If the spike fails, the requirement
changes as the architecture says, and this document is amended before that milestone
is merged.

## Scope

v0.1.0 migrates the bridge (codex-lite-cc), the loop (claude-codex-loop), the general
code review skills (codex-code-review), and repo-docs into one repository that is both a
Claude Code marketplace and a Codex marketplace. It adds the house rules command, ships
the Writing style and the chat instructions, and keeps every existing behavior unless a
requirement below changes it. The audit plugin was not part of v0.1.0; it joined on
2026-10-05 as `cca` 0.9.0 (R61 to R65).

## Distribution

1. **Claude catalog.** `.claude-plugin/marketplace.json` is named `reimagine-code` and
   lists exactly `ccx`, `ccx-loop`, `cca` (since 2026-10-05), and `repo-docs`, each
   with a relative source under `./plugins/`. Check: lint;
   `claude plugin validate --strict` on the root.
2. **Codex catalog.** `.agents/plugins/marketplace.json` is named `reimagine-code` and
   lists exactly `ccx` (source `./plugins/ccx-codex`) and `repo-docs`, each with
   policy `AVAILABLE` and `ON_INSTALL`. Depends on spike M0.5. Check: lint; acceptance:
   after `codex plugin marketplace add`, Codex offers exactly these two.
3. **Install from GitHub.** On macOS and on Windows 11 with npm-installed CLIs, these
   work from the published repo:

   ```
   claude plugin marketplace add vibecodedapps-official/reimagine-code
   claude plugin install ccx@reimagine-code
   codex plugin marketplace add vibecodedapps-official/reimagine-code
   codex plugin add ccx@reimagine-code
   ```

   Check: acceptance.
4. **Dependency install.** Installing `ccx-loop` alone also installs `ccx`.
   Disabling `ccx` is refused while `ccx-loop` is enabled. Updating either plugin
   first, then the other, leaves no error. With `ccx` out of the declared range,
   `ccx-loop` is disabled with a message naming the dependency.
   Depends on spike M0.1. Check: acceptance.
5. **Self-contained plugins.** No shipped file reads a path outside its own plugin
   directory, apart from the home targets of the house rules, the plugin data
   directory, and the user's working repository. Each plugin directory holds the
   Apache-2.0 LICENSE, because an installed plugin holds only its own directory.
   Check: review; lint for the LICENSE files.
6. **ASCII.** Every shipped file is ASCII. Check: lint.
7. **No old names.** Shipped files match neither `codex[-_]lite` in any case nor the
   word `ccl`, and name neither `vibecodedapps-codex-lite` nor
   `vibecodedapps-claude-codex-loop`, except the
   migration literals lint lists by file: the old plugin and marketplace names in
   setup's old-plugin report (R16) and `.ccl.json` in the loop's orphaned-config check
   (R23). The audit plugin's names (`cca`, `/cca:audit`, `cca-manifest.json`) are
   allowed in `ccx-loop`. Files under `docs/history/` are exempt. Check: lint.
8. **Always-on cost.** Measured with `claude plugin details` in a logged-in profile,
   `ccx` costs at most 1,300 tokens always on: codex-lite 0.9.0's 1,220 plus about 40
   for the `rules` command, which costs that much even with model invocation off. `ccx-loop` costs
   at most ccl 0.10.0's 510. Check: acceptance at release.

## Bridge: ccx on Claude Code

9. **Behavior carried over.** `ask`, `review`, `do`, `implement`, and `setup` behave as
   codex-lite 0.9.0 with names changed. Every test in the codex-lite-cc suite exists in
   `tests/ccx/` and passes; its baseline on macOS was 208 tests, 198 passing and 10
   skipped (the Windows-only tests). Check: test on three operating systems.
10. **Frozen contract.** Every output string and flag in the architecture's bridge
    contract is emitted or accepted exactly as in codex-lite 0.9.0, under the same
    conditions. Check: test, one assertion per string and flag.
11. **Prefix.** Bridge messages start with `ccx: `. Check: test.
12. **Hook.** The UserPromptSubmit hook prints its routing note only for a prompt that
    matches `/codex/i` and does not start with a slash command, and names the `ccx:`
    commands. On every prompt it deletes the session's request file, so a run whose
    Write failed on a leftover is refused instead of sending the earlier task. Check: test.
13. **Data directory.** Scripts receive the data directory as an argument from the
    command text or the hook's `args`, and never read it from the environment. Depends
    on spike M0.4 for the hook. Check: test; lint.
14. **Runtime budget.** `ccx.mjs` and `codex.mjs` together stay at or under 710 lines.
    `rules.mjs` has its own budget of 400 lines and `suite.mjs` of 200. Check: lint.

## Setup

15. **Diagnostics.** `/ccx:setup` keeps the codex-lite 0.9.0 report: Codex version,
    login, Windows sandbox mode, the write probe, and the allow rules for the new data
    directory. It writes no file. Check: test; acceptance. Since 0.1.2
    (2026-10-04), setup prints only the Bash rule; `docs/decisions.md` Part 8 says why.
16. **Old plugins.** Setup lists any installed `codex-lite`, `ccl`, or `repo-docs` from
    their old Claude marketplaces, and any enabled `codex-code-review-general`,
    `codex-code-review`, or `repo-docs` from an old marketplace in the Codex
    `config.toml`, with the uninstall command for each.
    It never runs them and never lists the audit plugin. Check: test with fixture
    outputs; acceptance.

## Loop: ccx-loop on Claude Code

17. **Commands.** `plan` and `run` keep ccl 0.10.0's inputs, flags, defaults, and
    rejection rules, and invoke the `ccx-loop:ccx-loop` skill with the same
    invocation block. Check: acceptance.
18. **Dependency.** The manifest declares `ccx` with the range `>=<floor> <1.0.0`,
    where the floor is at or below the family version; it is `>=0.1.0 <1.0.0` at
    release. Check: lint.
19. **Gates removed.** No loop text reads the bridge's installed version or compares it
    to 0.8.0 or 0.9.0. Check: lint; review.
20. **Fallbacks kept.** With the `codex` binary absent, or with `--no-codex`, every Codex
    role runs on its Claude fallback from the roles table, and the report says so.
    Check: acceptance, one run each.
21. **Persistent Claude-only.** A `userConfig` option `codex`, boolean, default true, is
    shown in `/config`. When false, every run behaves as `--no-codex`. Depends on spike
    M0.2; if it fails, this requirement moves to 0.2.0. Check: acceptance.
22. **State names.** The run directory is `.ccx/<run-id>/`, the repo config is
    `.ccx.json`, committed snapshots go to `specs/ccx/<run-id>/`, worktrees are
    `<checkout>-ccx-<run-id>`, and the report header is `# ccx run report`. The run
    directory is excluded through `.git/info/exclude`, as `.ccl/` was. Check: acceptance.
23. **Orphaned config.** A repo with `.ccl.json` and no `.ccx.json` ends the run in
    `blocked` with a message to rename the file. Check: acceptance.
24. **Skill listing.** The "skill not listed in session" retry is removed, because spike
    M0.6 showed a fresh session lists the dependency's skills after install and after
    an update. Check: review against `docs/decisions.md` Part 1 item 7.
25. **Audit coupling.** The handoff file, `cca-manifest.json`, and the `/cca:audit`
    suggestion behave as in ccl 0.10.0, and a run without the audit plugin ends
    normally. Check: acceptance.

## Code review skills: ccx on Codex

26. **Skills.** The five `general-code-review*` skills ship with names and text unchanged
    from codex-code-review-general 0.1.0. Check: review, by diff against the source.
27. **Manifest.** `plugins/ccx-codex/plugin.json` uses the `agent-plugins.org` schema
    1.0.0, is named `ccx`, and carries the family version. Depends on spike M0.5.
    Check: lint.
28. **Attribution.** The directory holds the Apache-2.0 LICENSE and a NOTICE that credits
    openai/codex, names the upstream commit the skills were adapted from, keeps the
    upstream NOTICE text, and no longer claims unmodified redistribution or a lock file.
    Each skill keeps its provenance comment. Check: lint for the files; review for the
    text.
29. **Runs on Codex.** Invoking `general-code-review` in a Codex session on a small diff
    produces a review, and the session shows each of the four companion skills was
    used. Check: acceptance.

## repo-docs

30. **Behavior carried over.** The skill and the hook behave as repo-docs 0.1.1. Both
    manifests carry 0.1.2. Check: acceptance on each host: the skill audits a repo, and
    the hook fires on a commit (under Codex after it is trusted).
31. **Spoke.** `plugins/repo-docs/AGENTS.md` has paths relative to its directory and is
    reachable from the root hub. The repo-docs skill reports no errors on this repository.
    Check: acceptance.

## House rules

32. **Command.** `/ccx:rules` is typed by the user; the model cannot invoke it.
    Check: lint for `disable-model-invocation: true`.
33. **Targets.** It reads and writes only `CLAUDE.md` in `$CLAUDE_CONFIG_DIR` (else
    `~/.claude`), `AGENTS.md` in `$CODEX_HOME` (else `~/.codex`), their backups, and its
    data directory. A symlinked target is written at the file it points to, with its
    backup and temporary file beside that file; a hard-linked target or a link to a
    missing file is refused; a Codex target that is the same file as the Claude target
    is skipped; the target's permissions are kept.
    It creates the Claude file if missing. It never creates the Codex
    home or anything in it when that directory is absent. When `AGENTS.override.md`
    exists in the Codex home, it reports that Codex reads that file instead and leaves
    the Codex target alone. It never edits `settings.json`. Depends on spike M0.7.
    Check: test with temporary directories for both variables.
34. **Content.** The core text is the ask-first line plus the Working, Code, Tests, Done,
    and Ask first sections of forge-ops `claude/CLAUDE.md` at its `main` when M3 starts,
    byte for byte, with that commit recorded. Check: review at import; afterwards this
    repository is the source. Release 0.1.3 synced it to forge-ops 9faabda on 2026-10-04;
    `docs/decisions.md` Part 9.
35. **Options.** `core` is on by default. `windows` is offered only when the command runs
    on Windows and is on by default there. `writing` is off by default. On a rerun the
    recorded options are kept unless the user asks to change them. Check: test.
36. **Block format.** The block starts with
    `<!-- ccx:house-rules begin version=<v> options=<list> join=<j> digest=<hex> -->`
    and ends with `<!-- ccx:house-rules end -->`. `join` is `none`, `blank`, or
    `newline`, as the architecture defines. The digest covers the body with CRLF read as
    LF; a digest of the CRLF body is accepted too.
    Check: test.
37. **States.** The command tells apart absent, current, stale, edited, malformed, and
    declined, and acts as the architecture's table says. It writes nothing for current,
    edited, or malformed. Check: test, one case per state.
38. **Consent.** Each target's change is shown as a diff and applied only after the user
    agrees to that target. Check: acceptance.
39. **Plan and apply.** Applying refuses when the target changed after the diff was
    shown. Check: test.
40. **Preservation.** Text outside the block is unchanged byte for byte, including line
    endings, a byte order mark, and the presence or absence of a final newline. The
    block uses the file's line ending. Check: test with LF, CRLF, BOM, and
    no-final-newline fixtures.
41. **Safe write.** A change to an existing file first copies it to
    `<file>.ccx-backup-<timestamp>`. A missing Claude file is created and recorded as
    created. Every write goes to a temporary file in the same directory, renamed over
    the target. Check: test.
42. **Remove.** `/ccx:rules --remove` deletes the block and the bytes its `join`
    names. After install then remove, an existing file equals its original bytes, and a
    file the command created is deleted if nothing else was added. Check: test, one case
    per `join` value.
43. **Decline.** A decline is recorded with the target and digest. The staleness notice
    stays quiet for that digest. Check: test.
44. **Imports.** An `@` import line in the Claude file is reported as a possible
    duplicate. The command neither follows nor changes it. Check: test.
45. **Staleness notice.** At session start, when a block is stale and not declined, the
    user sees one line naming the file and `/ccx:rules`. Otherwise the hook prints
    nothing and writes nothing. Depends on spike M0.4. Check: test for the output;
    acceptance for what the user sees.
46. **Writing style.** The plugin ships forge-ops Concise Plain v4.4 as an output style
    named `Concise Plain`, selectable in `/output-style` as `ccx:Concise Plain`. When
    `writing` is chosen, the command prints how to select it and adds Codex's Writing
    section to the Codex block. Depends on spike M0.3. Check: acceptance.
47. **Chat instructions.** `plugins/ccx/chat/instructions.md` holds the one block
    used for both claude.ai and ChatGPT, with its dated sync header and a note of
    ChatGPT's 5,000-character cap, which the block fits. Nothing installs it. The README
    and the rules command name its path. Check: lint for presence and length; review.

## Audit plugin: cca on Claude Code

Added 2026-10-05, when claude-codex-audit 0.8.1 at `eed9fba` joined the suite as `cca`
0.9.0. Its earlier requirements are its own spec, decisions, and acceptance records under
`docs/history/claude-codex-audit/`.

61. **Catalog and version.** `plugins/cca` is listed in the Claude catalog only, on its
    own version line, like repo-docs, and tagged `cca--v<version>`. The suite version
    does not move for a cca release. The skill's three `plugin_version` literals equal
    the manifest version, and the release tool sets them. Check: lint; release record.
62. **Behavior carried over.** The commands `audit`, `resume`, `act`, and `handoff`, the
    five agents, the skill, and the eight sh scripts behave as cca 0.8.1 with the bridge
    names changed. Every sh suite and fixture build of the source repository runs through
    `npm test`, from `tests/cca/`, on the three CI systems, plus mawk on Ubuntu. Check:
    test; acceptance for a run.
63. **Bridge detection.** Stage 6 calls `ccx:ask` and takes the version of the plugin id
    starting `ccx@` from `claude plugin list --json`; 0.1.0 or later counts. Without it,
    with Codex absent, or with `--no-codex`, the second opinion swaps to `cca:adversary`.
    The manifest declares no dependency, so the plugin installs and runs without `ccx`.
    Check: review of stage 6; acceptance.
64. **Clean and self-contained.** `plugins/cca` holds LICENSE, is ASCII, and names no old
    plugin or marketplace (R5 to R7 apply to it), and its own lint, `tests/cca/lint.sh`,
    passes with `plugins/cca` as root. Check: lint; test.
65. **Loop coupling unchanged.** `ccx-loop` keeps writing `handoff.md` and
    `cca-manifest.json` and suggesting `/cca:audit` without reading the audit plugin, so
    R25 holds, and those names, with `cca:` and `cca-handoff: 1`, are frozen interfaces
    inside one repository. Check: acceptance.

## Release

48. **Versions.** `ccx`, `ccx-loop`, and the Codex `ccx` are 0.1.0 in every
    manifest and catalog entry. `repo-docs` is 0.1.2 in both manifests and both
    catalogs. Check: lint.
49. **Tags and release ref.** Each Claude plugin is tagged `<plugin>--v<version>` with
    `claude plugin tag`, `ccx` before `ccx-loop`. No bare `v` tags are created.
    `main` is the release ref: once a plugin has a tag, a change under its directory
    merges to `main` only with its version above that tag. Check: release record; lint
    in CI for the version rule.
50. **Changelog.** The root `CHANGELOG.md` has `## 0.1.0 - <date>` with one subsection per
    component. The source repos' changelogs move to `docs/history/`. Check: lint for the
    heading; review.
51. **Floors.** The README states as supported only the oldest Claude Code and Codex CLI
    versions the acceptance ran on, and Node 22 or later. It may say that Claude Code
    before 2.1.269 lacks features the suite uses, without promising that 2.1.269 works.
    Check: review against the acceptance record.

## Quality

52. **CI.** Lint and tests pass on Ubuntu, macOS, and Windows with Node 22 for every PR,
    and `claude plugin validate --strict` passes on the root and on each plugin
    directory, using a pinned Claude Code version. Check: CI.
53. **Windows.** On the work machine (Windows 11, both CLIs from npm): bridge ask and
    implement, the rules command against a CRLF file, and the repo-docs hook on both
    hosts from a checkout whose path contains a space. The README states Git for
    Windows as the repo-docs prerequisite, with Git's `bin` folder on `PATH` for Codex.
    Check: acceptance.
54. **Line endings.** `.gitattributes` keeps `*.sh`, `*.mjs`, and `*.md` at LF. Check:
    lint.

## Migration

55. **History.** Each source is imported without squash, so `2b2454d`, `16b8ee7`,
    `f5c7687`, and `83b14a2` are ancestors of the release commit. Moves and string
    renames land in separate commits. Check: `git merge-base --is-ancestor` for each.
56. **Untracked docs.** claude-codex-loop's untracked `SPEC.md`, `docs/architecture.md`,
    `docs/build-plan-v0.1.0.md`, and `docs/spec-amendments-draft.md` are in
    `docs/history/claude-codex-loop/`. Check: review.
57. **Dropped.** The upstream mirror plugin, its sync scripts, `upstream.lock`, the
    upstream drift workflow, and repo-docs `scripts/sync-version.sh` are not in the
    tree. Check: review.

## Cutover

Cutover follows the release and gates archiving the old repos. It is not part of the
v0.1.0 acceptance.

58. **forge-ops first.** Both forge-ops installers stop writing `~/.claude/CLAUDE.md` and
    `~/.codex/AGENTS.md` before a block is written on any machine they manage, and their
    plugin declarations name the new marketplace and plugins instead of the old ones.
    forge-ops keeps its policy files until every machine has replaced its import, so no
    import points at a deleted file. These are changes in another repo, asked for
    separately.
59. **Gate.** On each machine forge-ops manages: one full loop run with Codex
    implementing and Claude publishing; the repo-docs hook firing on both hosts; the
    rules command on a Windows machine against a file with local overrides below the
    block. The work machine is out of the gate (`docs/decisions.md` Part 10).
60. **Retire.** Old plugins are uninstalled on every machine, including Codex's
    `config.toml` entries. Old repos are archived private only after every machine
    passes.

## Non-goals

- The Codex adapter, Codex-only mode, and the reverse bridge.
- Applying house rules from Codex.
- Generating the chat blocks from the style file.
- `claude plugin eval` in CI.
