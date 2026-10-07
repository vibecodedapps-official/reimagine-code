# Implementation plan: recode v0.1.0

Drafted 2026-10-03. It builds what [requirements.md](requirements.md) asks for, in the
shape [architecture.md](architecture.md) describes; both win over this plan. Requirement
numbers are cited as R1 to R60. The file moves and string renames are listed in
[rename-map.md](rename-map.md).

Nothing in this plan has started. Approving it covers every local commit it describes,
creating the GitHub repository private in M1, pushing `main` in M1, pushing tags and
making the repository public in M6. Each pull request is asked for separately. Cutover
(M7) touches other repos and the author's home files and is asked for separately.

Acceptance before M7 runs in scratch profiles: `CLAUDE_CONFIG_DIR` and `CODEX_HOME`
pointing at directories outside the repo. The author's own Claude Code and Codex setup
does not change before cutover, and the old plugins stay installed there. Each scratch
profile needs one login.

## Order of work

Each milestone after M1 is one pull request, merged in this order. Each is tested before
the next starts.

| # | Milestone | Adds | Depends on |
|---|---|---|---|
| M0 | Spikes | Answers to seven platform questions, recorded in `docs/decisions.md` | none |
| M1 | Skeleton and imports | Root files; four histories imported unchanged | M0 |
| M2 | Bridge | `plugins/recode`, its tests, generalized lint, CI | M1 |
| M3 | House rules and setup | `rules.mjs`, `/recode:rules`, SessionStart notice, old-plugin report, style, chat files | M2 |
| M4 | Loop | `plugins/recode-loop` with the dependency, `codex` option, state renames | M2 |
| M5 | Codex plugin and repo-docs | `plugins/recode-codex`, `plugins/repo-docs`, the Codex catalog | M2 |
| M6 | Release | Versions, changelog, README, tags, install from GitHub | M2 to M5 |
| M7 | Cutover | earlier source repository change, old plugins removed, old repos
archived | M6, separate asks |

M5 needs the Claude catalog and the lint from M2. It can run beside M3 and M4.

## M0: spikes

Each spike runs in a scratch directory outside the repo, installs at project scope or
under a scratch `CODEX_HOME`, and is removed afterwards, so the author's user-level setup
is not changed. Results go into `docs/decisions.md` as Part 1, one item per spike, each
closing with what was observed and the CLI version.

Work items:

1. **M0.1 Dependencies.** A scratch git marketplace with plugins `a` and `b`, where `b`
   depends on `a` at `^0.1.0` and `a` is tagged `a--v0.1.0`. Install `b` alone; confirm
   `a` comes with it, and that disabling `a` is refused while `b` is enabled. Bump `a` to
   0.2.0 and update it alone; record the message and whether `b` is disabled. Decides
   R4.
2. **M0.2 `userConfig` in command text.** A scratch plugin with a boolean option and a
   command that prints `${user_config.<key>}`. Decides R21.
3. **M0.3 Plugin output style.** A scratch plugin with `output-styles/x.md`; confirm it
   appears in `/output-style` and under what name. Decides the name in R46.
4. **M0.4 SessionStart notice.** A scratch exec-form hook that receives
   `${CLAUDE_PLUGIN_DATA}` in its `args` and prints a `systemMessage`. Confirm the path
   arrives substituted and the user sees the message at session start. Decides R13 and
   R45.
5. **M0.5 Codex catalog isolation.** A scratch repo with both catalogs, added to Codex
   with `CODEX_HOME` pointing at a scratch directory. Confirm Codex lists only the
   `.agents` entries, and that a root `plugin.json` plugin named `recode` loads its
   skills. Decides R2 and R27.
6. **M0.6 Dependency skills listed.** With only `b` installed from M0.1, start a fresh
   session and confirm `a`'s commands are listed for the model. Then update `a` and run
   `/reload-plugins`, and confirm they are still listed. Decides R24.
7. **M0.7 Config directory.** Start Claude Code with `CLAUDE_CONFIG_DIR` set to a scratch
   directory holding a `CLAUDE.md` with a marker rule, and confirm the session quotes
   it. Decides R33 and every scratch-profile acceptance item.

Check:

- `docs/decisions.md` Part 1 has seven items, each with the CLI version and the result.
- Any failed spike amends the requirement it decides before its milestone starts.

## M1: skeleton and imports

Work items:

1. Root files: `README.md` (a stub naming the suite and its status), `LICENSE`
   (Apache-2.0, as all four sources use), `NOTICE`, `.gitignore`, `.gitattributes`,
   `package.json` (private, no dependencies, Node 22 or later), `CHANGELOG.md` (an
   Unreleased heading), and `AGENTS.md` as the root hub in the repo-docs layout, with no
   `CLAUDE.md` adapter, which is repo-docs' default. Commit: `chore(repo): start the reimagine-code suite`.
2. Confirm each source's `main` is still at its pinned commit, then import it with
   `git subtree add --prefix=imports/<repo> <local path> main`, without `--squash`, in
   this order: codex-lite-cc `2b2454d`, claude-codex-loop `16b8ee7`, codex-code-review
   `f5c7687`, repo-docs `83b14a2`. One merge commit each. A source that moved since
   2026-10-03 is re-inventoried before import.
3. Copy claude-codex-loop's four untracked design docs into
   `docs/history/claude-codex-loop/`. Commit:
   `docs(history): keep the loop's untracked design docs`.
4. Commit the approved architecture, requirements, plan, rename map, and
   `docs/decisions.md` from M0, and start `docs/acceptance.md` in the item format the
   source repos use. Commit: `docs(plan): add the v0.1.0 design`.
5. Create `vibecodedapps-official/reimagine-code` on GitHub, private, and push `main`.

Check:

- For each source, `git diff --stat <sha> HEAD:imports/<repo>` prints nothing, and
  `git merge-base --is-ancestor <sha> HEAD` exits 0 (R55).
- `git ls-files imports/claude-codex-loop` shows no `.ccl/` or `scratch/` files.

## M2: bridge

Work items:

1. Move commit: `imports/codex-lite-cc/plugins/codex-lite/` to `plugins/recode/`; its
   `tests/` to `tests/recode/`; `tools/lint.mjs` and `.github/` to the root; its README
   into `plugins/recode/README.md`, with its install lines copied to the root README,
   where lint's README check now reads them; its changelog and `docs/acceptance.md` into
   `docs/history/codex-lite-cc/`. Delete what is left of `imports/codex-lite-cc/`. The
   exec bit on `tests/recode/fixtures/fake-codex.mjs` is kept.
2. Rename commit, per the rename map: plugin and command prefix `recode`, script
   `recode.mjs`, message prefix `recode: `, environment variables `RECODE_*`, the
   routing note and its byte-for-byte test copy together, the Windows-only path regex in
   `tests/recode/windows.test.mjs`, which is regex-escaped, and the two relative paths in
   `tests/recode/fixtures/harness.mjs` and `tests/recode/pure.test.mjs`.
3. Manifest: name `recode`, version 0.1.0, repository URL. Claude catalog with the
   `recode` entry.
4. Generalize lint per the architecture's tooling section. Keep every bridge check:
   plugin checks scoped to `plugins/recode/`, repo-wide checks repo-wide. Give each
   plugin its own allowed-script list and budget.
5. Root `package.json` scripts run `tests/**/*.test.mjs` and `tools/lint.mjs`. CI runs
   them on Ubuntu, macOS, and Windows with Node 22. Dependabot keeps only the
   `github-actions` entry. CI also installs the Claude Code npm package, pinned, and
   runs `claude plugin validate --strict` on the root and each plugin directory (R52).

Check:

- `npm run lint` and `npm test` pass locally, each run as its own command. All 208 source
  tests are present; on macOS 198 pass and 10 skip, matching the baseline (R9).
- CI passes on all three systems, including the Windows-only tests.
- In a scratch profile: `/recode:setup` reports Codex and the new allow rules;
  `/recode:ask` answers; `/recode:implement` from a test skill edits a scratch repo
  (R9, R15).
- The codex-lite acceptance items whose commands or output name the plugin are rerun
  under the new names. The list is drawn from `docs/history/codex-lite-cc/acceptance.md`
  at M2 start and recorded with the results.

## M3: house rules and setup

Work items:

1. `plugins/recode/rules/`: `core.md`, `windows-claude.md`, `windows-codex.md`,
   `writing-codex.md`, cut by section, byte for byte, from the earlier source
   repository's `main` at M3 start
   (`948ce5f` on 2026-10-03). The PR records the commit.
2. `scripts/rules.mjs` with `status`, `plan`, `apply`, `remove`, and `decline`. Pure
   functions take the target directories and file bytes as inputs, so tests need no
   mocks; only the clock is injected, for backup names.
3. `commands/rules.md`, typed by the user only. It runs `plan`, shows each diff, asks per
   target, then runs `apply` or `decline`. First run asks for the options; reruns keep
   them. `--remove` and `--options` change that.
4. `scripts/suite.mjs` with `session-start`, which uses `rules.mjs` to find stale
   blocks, and `old-plugins`, which reads `claude plugin list --json` and the Codex
   `config.toml`. A SessionStart entry in `hooks/hooks.json`, exec form, calls it
   directly. `recode.mjs` is not touched, so its budget holds.
5. `commands/setup.md` runs `recode.mjs setup` as today, then `suite.mjs old-plugins`.
6. `output-styles/concise-plain.md` from the earlier source repository's
   `concise-plain-v4.4.md`, with `name`
   set to `Concise Plain`, and `chat/instructions.md` from its
   `claude/chat-instructions.md` with its sync header and the ChatGPT cap note.

Check:

- `tests/rules/` has a case for each of R33, R35 to R37, and R39 to R45, using fixture
  files with literal expected bytes: LF, CRLF, BOM, no final newline, each `join` value,
  a block in the middle, each malformed shape, an `@` import, and an
  `AGENTS.override.md`.
- `tests/rules/` covers the old-plugin report with fixture command output and a fixture
  `config.toml` (R16).
- Acceptance in a scratch profile with a `CLAUDE.md` that holds text of its own: run
  `/recode:rules`, accept, start a new session and confirm a quoted rule is in effect,
  then `--remove` and confirm the file equals its backup. Repeat with a scratch
  `CODEX_HOME` holding an `AGENTS.md`, and with no Codex home at all.

## M4: loop

Work items:

1. Move commit: `commands/` and `skills/ccl/` into `plugins/recode-loop/` (the skill
   directory becomes `skills/recode-loop/`), the README into the plugin, and the
   changelog, decisions, and acceptance docs into `docs/history/claude-codex-loop/`.
2. Rename commit, per the rename map: `recode:` for bridge calls, `recode-loop:` for its
   own, the state names in the architecture's table, the report headers. `cca` names
   stay.
3. Manifest: name `recode-loop`, version 0.1.0, the `recode` dependency at
   `>=0.1.0 <1.0.0`, and
   the `codex` option if M0.2 passed.
4. Delete the two bridge version gates and their cross-references in `tiers.md`,
   `report.md`, `multi-repo.md`, and the README. Only the gate text goes; the
   `diff-<slug>.patch` files and the Claude reviewer's use of them stay. Delete the
   skill-listing retry and its cross-references, per M0.6.
5. Add the `.ccl.json` check to Step 0 and the `codex` option to the fallback rule.
6. Claude catalog entry.

Check:

- Lint passes, including R7, R18, and R19.
- Acceptance, against the throwaway GitHub repo the ccl acceptance used:
  - the commands are listed and reach `recode-loop:recode-loop`;
  - a low-tier run with Codex implementing and Claude publishing;
  - a `--no-publish` run that ends `prepared`, and a `--confirm-plan` run where the plan
    is not approved, which ends `plan-only`;
  - a `--no-codex` run, a run with `codex` absent from `PATH`, and a run with the
    option set to false (R20, R21);
  - one run each in Multi-repo mode, in a worktree, with `--continue`, and with
    `"commit": true` in `.recode.json`, so every renamed path in R22 is exercised;
  - a repo holding only `.ccl.json` ends `blocked` (R23);
  - disabling `recode` is refused while the loop is enabled (R4).
- The ccl acceptance items whose commands, paths, or report text name the plugin are
  rerun under the new names. The list is drawn from
  `docs/history/claude-codex-loop/acceptance.md` at M4 start and recorded with the
  results.

## M5: Codex plugin and repo-docs

Work items:

1. Move `plugins/codex-code-review-general/` to `plugins/recode-codex/`. Set the manifest
   name to `recode` and the version to 0.1.0. Keep its LICENSE and rewrite NOTICE. Fold
   the README's install, per-skill summary, and license sections into the plugin
   README. Copy the root LICENSE into the other three plugin directories (R5).
2. Drop the mirror plugin, `scripts/`, `upstream.lock`, and the upstream drift workflow.
3. Move repo-docs to `plugins/repo-docs/`. Drop `scripts/sync-version.sh` and its
   marketplace file. Set both manifests to 0.1.2. Rewrite its `AGENTS.md` as a spoke,
   without the version script and plain `v` tags, and point the root hub at it. Rewrite
   its README install lines for the suite marketplace.
4. Write `.agents/plugins/marketplace.json` and add `repo-docs` to the Claude catalog.

Check:

- Lint passes, including R27, R28, and R48.
- Acceptance on Codex with a scratch `CODEX_HOME`: the catalog lists two plugins;
  `general-code-review` reviews a small diff and the session shows all four companion
  skills used; the repo-docs skill audits a repo; the repo-docs hook, once trusted,
  fires on a commit (R2, R29, R30).
- Acceptance on Claude Code: the repo-docs skill and hook work, and the skill reports no
  errors on this repo (R30, R31).

## M6: release

Work items:

1. `tools/release.mjs` sets and checks every version and the dependency range. The
   changelog gets `## 0.1.0 - <date>` with a subsection per component and a Breaking
   heading listing every renamed command, path, and data directory. Lint gains the R49
   version rule, active once tags exist.
2. Root README: what the suite is, install on each host, the modes, the floors from the
   acceptance record, the Windows prerequisite, and that `/recode:rules --remove` comes
   before uninstalling `recode`.
3. Measure always-on cost with `claude plugin details` for `recode` and `recode-loop`
   (R8).
4. Tag and push, in order: `recode--v0.1.0`, `recode-loop--v0.1.0`, `repo-docs--v0.1.2`,
   each with `claude plugin tag --push`, while the repository is still private.
5. Install from the private GitHub repository on the Mac and the Windows work machine,
   on both hosts, in scratch profiles (R3, R4, R53). A failure is fixed and released as
   0.1.1 before going on.
6. Make the GitHub repository public, then repeat one install per host from the public
   repository.

Check:

- R3, R4, R8, R49, R51, and R53 are recorded in `docs/acceptance.md`.

## M7: cutover

Each step is a separate ask. Status 2026-10-06: the suite's side is complete, and ccx
0.4.0 removed the migration paths, so the gate of step 2 (R59) and the uninstall check
(R60) no longer exist; R58 to R60 are retired (`docs/decisions.md` Part 16). Steps 3
and 4 are not recorded here.

0. Prerequisite: the audit plugin calls the bridge as `recode`, done in the audit repo
   in a release after 0.6.0, which still calls `codex-lite:ask`. Until then `codex-lite`
   stays installed on every machine that uses the audit. Done 2026-10-05, in this
   repository instead: the audit plugin joined as `cca` 0.9.0 and calls `ccx:ask`.
1. The earlier source repository, first change: both installers stop writing the home
   instruction files,
   and its Claude settings and Codex config declare the new marketplace and plugins in
   place of the old ones. The policy files stay, so existing imports keep working
   (R58).
2. On each machine: back up the home files, run `/recode:rules`, replace the one-line
   import with Local overrides below the block, confirm a quoted rule in a new session,
   run the cutover gate (R59), then uninstall the old plugins (R60). The work machine
   keeps no copy of the earlier source repository and its files are kept by hand, so it
   may adopt the block without
   the gate (`docs/decisions.md` Part 10).
3. The earlier source repository, second change, after every machine that imports its
   files has moved: drop
   the policy files and point its README here.
4. Archive codex-lite-cc, claude-codex-loop, codex-code-review, and repo-docs as private
   after every machine passes and none has `codex-lite` installed.

## Shipped files are self-contained

A plugin directory is everything a user installs. Tests, lint, release tooling, and
design docs stay outside `plugins/`. A file inside a plugin never reads a sibling plugin's
files; the loop reaches the bridge only through its commands.

## Acceptance record

`docs/acceptance.md` uses the source repos' item form: number, title, setup, command,
expected result, and when to rerun. Each run is recorded with the date, the machine, and
the Claude Code, Codex, and Node versions.

## Open items

Decided 2026-10-03:

1. **Loop command name.** `run` is kept. The handoff's `loop` would read
   `/recode-loop:loop`, and Claude Code has a built-in `/loop` that does something else.
2. **Claude Code CLI in CI.** Approved. CI installs the Claude Code npm package, pinned
   to a version, to run `claude plugin validate --strict` (M2 item 5, R52).
3. **The audit plugin's bridge calls.** The audit repo switches its 33 `codex-lite`
   lines to `recode` as part of its 0.4.0 work, before M7 uninstalls `codex-lite` (M7
   step 0). That change is made in the audit repo and asked for there. Superseded
   2026-10-05: the audit plugin joined this repository as `cca`, and the rename was made
   here (`docs/rename-map.md` section 6).

To verify:

1. The seven M0 spikes.
2. The minimum Claude Code version for plugin `dependencies`; undocumented, so the
   tested versions are recorded instead.
3. Whether Codex caps the size of `~/.codex/AGENTS.md`; the block is about 6 KB, under
   the 32 KB project limit.
4. Whether the repo-docs hook runs under Codex on Windows; covered by R53.
5. Whether the Codex Windows line, which says the shell is PowerShell 7, holds for other
   users. Windows PowerShell 5.1 users would get a false statement. The text ships as
   the earlier source repository had it until you decide on a general wording.

## Out of scope

Amended 2026-10-05: the audit plugin joined as `cca` (`docs/architecture.md`).

As in the requirements: the audit plugin, the Codex adapter, Codex-only mode, the
reverse bridge, house rules from Codex, generated chat blocks, and `claude plugin eval`
in CI.
