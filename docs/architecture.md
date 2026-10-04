# Architecture: v0.1.0

Drafted 2026-10-03 from the pre-planning handoff of 2026-10-02, an inventory of the four
source repos on 2026-10-03, and a read of the Claude Code docs and the Codex 0.159.2
source the same day. Nothing here is implemented. Where this document and
[requirements.md](requirements.md) disagree, the requirements win until they are amended.
The [implementation plan](implementation-plan-v0.1.0.md) follows both.

A fact marked "verified" was read from official docs, source, or a run. The facts the
design rests on are also run once in plan milestone M0 before the milestone that needs
them, and the design names what changes if a spike fails.

## Shape

reimagine-code is one repository that is two plugin catalogs: a Claude Code marketplace and a
Codex marketplace, both named `reimagine-code`. It replaces four repos: codex-lite-cc
(the bridge), claude-codex-loop (the loop), the general half of codex-code-review, and
repo-docs. The audit plugin (claude-codex-audit) joins in a later release.

The suite has four layers:

- **Bridge**: Claude dispatches the Codex CLI for a question, a review, or an edit.
  Plugin `ccx`.
- **Loop** (process): plan, review, implement, review, publish for one unit of work,
  with Codex as implementer and second reviewer. Plugin `ccx-loop`. Audit joins it
  later.
- **House rules** (policy): working rules written into the user's home instruction files,
  plus an optional writing style. Shipped and applied by `ccx`.
- **Setup**: diagnostics, old-plugin detection, and the house rules command. Part of
  `ccx`.

repo-docs is a separate, independent plugin in the same catalogs.

```
reimagine-code/
  .claude-plugin/marketplace.json     Claude catalog: ccx, ccx-loop, repo-docs
  .agents/plugins/marketplace.json    Codex catalog: ccx, repo-docs
  plugins/
    ccx/                           Claude only
      .claude-plugin/plugin.json
      commands/                       ask review do implement setup rules
      scripts/                        ccx.mjs codex.mjs rules.mjs suite.mjs
      hooks/hooks.json                UserPromptSubmit, SessionStart
      rules/                          house rules sources
      output-styles/                  the Writing style, opt-in
      chat/                           claude.ai and ChatGPT blocks, copy by hand
    ccx-loop/                      Claude only
      .claude-plugin/plugin.json      depends on ccx
      commands/                       plan run
      skills/ccx-loop/
    ccx-codex/                     Codex only, plugin name `ccx`
      plugin.json                     agent-plugins schema 1.0.0
      skills/general-code-review*/
      LICENSE NOTICE                  every plugin carries LICENSE
    repo-docs/                        both hosts
      .claude-plugin/plugin.json
      .codex-plugin/plugin.json
      skills/ hooks/ AGENTS.md
  tests/  tools/  docs/  package.json  CHANGELOG.md  README.md  LICENSE  NOTICE
```

## Plugins and hosts

| Plugin | Directory | Claude | Codex | Depends on | Version line |
|---|---|---|---|---|---|
| `ccx` | `plugins/ccx` | yes | no | none | ccx family |
| `ccx-loop` | `plugins/ccx-loop` | yes | no | `ccx` `>=0.1.0 <1.0.0` | ccx family |
| `ccx` | `plugins/ccx-codex` | no | yes | none | ccx family |
| `repo-docs` | `plugins/repo-docs` | yes | yes | none | its own |

What each host gets in v0.1.0:

- **Claude Code**: the bridge commands, setup, house rules, the Writing style, the loop,
  and repo-docs.
- **Codex**: the five general code review skills (the Codex counterpart of Claude's
  built-in `/code-review`) and repo-docs. The loop and the bridge are not offered on
  Codex, because both depend on Claude commands, the Skill tool, and Claude subagents
  (verified, `claude-codex-loop/skills/ccl/SKILL.md`). They come with the Codex adapter.

The suite's cross-vendor claim is a second opinion from the other vendor at every review
point, with a documented fallback when it is absent. In v0.1.0 that holds on Claude Code
only. Codex gets it with the reverse bridge, later.

## Catalogs and host segregation

Segregation lives in the catalogs, not in the plugin manifests.

- Claude Code reads `.claude-plugin/marketplace.json`. It ignores `.agents/`.
- Codex looks for `.agents/plugins/marketplace.json` first and stops at the first
  catalog it finds (verified, Codex source at `rust-v0.159.2`). So the Codex catalog
  never sees the Claude-only plugins.

The manifest-level design in the handoff, a shared `skills/` with Codex-only skills in a
directory named by `.codex-plugin/plugin.json`, is dropped for v0.1.0 for two verified
reasons:

- Codex reads `.claude-plugin/plugin.json` as a fallback manifest, and in that legacy
  format it converts `commands/*.md` into skills at install. Listing the bridge in the
  Codex catalog would give Codex one skill per bridge command, each telling it to run a
  Claude-side script.
- Codex's manifest `skills` field replaces the default `skills/` scan, while Claude's
  adds to it. One directory serving both hosts would need two different skill lists.

The Codex `ccx` therefore has its own directory, `plugins/ccx-codex/`. It keeps the
manifest form the general review plugin uses today: a root `plugin.json` with the
`agent-plugins.org` schema 1.0.0. That plugin is installed and enabled on this machine
now (verified, `~/.codex/config.toml`). This form loads skills only; it skips commands
and discards hooks, which the review skills do not need. A later Codex hook, for the
reverse bridge, would need the `.codex-plugin` form. Codex rejects schema 1.1.0, so the
schema URL is pinned and linted.

repo-docs keeps its `.codex-plugin/plugin.json`, the legacy form, because it needs its
hook and Codex loads a Claude-format `hooks/hooks.json` in that form (verified in source;
the user must trust the hook once in `/hooks`).

Two plugins named `ccx` live in two catalogs. They share one version line, enforced by
lint, so the `ccx--v<version>` tag names one commit for both.

## Components

### ccx (Claude)

Behavior carries over from codex-lite 0.9.0 unchanged except for names.

- **Commands.** `ask`, `review`, `implement` as today. `do` and `setup` keep
  `disable-model-invocation: true`, so they cost nothing until typed. New: `rules`, also
  `disable-model-invocation: true`.
- **Scripts.** `ccx.mjs` (was `codex-lite.mjs`) and `codex.mjs` keep their 700-line
  runtime budget and change only by renames; the budget has 3 lines of headroom today.
  New code goes in two new modules with their own budgets: `rules.mjs` (house rules,
  pure file logic, spawns nothing) and `suite.mjs` (the old-plugin report and the
  SessionStart notice, which spawn `claude plugin list --json` or read files).
- **Data directory.** The command text, or the hook's `args`, passes
  `${CLAUDE_PLUGIN_DATA}` to the script as an argument, never through the environment.
  This is the existing pattern: the variable inside the Bash tool once held another
  plugin's value (recorded in an untracked note in codex-lite-cc). Substitution in hook
  `args` is checked in spike M0.4. The directory becomes
  `~/.claude/plugins/data/ccx-reimagine-code/`. It survives updates and is deleted on
  uninstall (verified, docs).
- **UserPromptSubmit hook.** It prints a routing note only when the prompt matches
  `/codex/i` and does not start with a slash command. It also deletes the session's
  request file, which at a prompt can only be left from a stopped run, so a script call
  that Claude batched with a failed Write is refused rather than sending the earlier task
  (found in the M2 acceptance run, 2026-10-03). It reads no other state, so it adds nothing
  to a Claude-only user's prompts and needs no recorded mode.
- **SessionStart hook.** New. `suite.mjs` prints one line to the user when a house rules
  block is stale (see below) and nothing otherwise. Claude Code has no install or update
  hook; a SessionStart check is the documented pattern (verified, docs).
- **Setup.** Keeps today's diagnostics: Codex version, login, Windows sandbox mode, the
  write probe, and the allow rule to paste, for the bridge script only since 0.1.2
  (2026-10-04, `docs/decisions.md` Part 8). Adds one section from `suite.mjs`: old
  plugins found installed, with the uninstall command for each, never run. It records
  nothing.
- **Output style.** `output-styles/concise-plain.md`, made from forge-ops
  `concise-plain-v4.4.md` with its `name` changed to `Concise Plain` and the version
  moved into the description, so a user's selection survives style updates. A plugin
  style shows in `/output-style` as `ccx:<name>` (verified, docs; selecting it with
  an argument needs Claude Code 2.1.269). The rules command prints how to select it;
  nothing edits `settings.json`.
- **Chat instructions.** `chat/instructions.md`: the one block forge-ops pastes into both
  claude.ai and ChatGPT, with its dated sync header and ChatGPT's 5,000-character cap.
  Installed with the plugin, never applied. The README and the rules command point at
  it.

**Bridge contract.** The loop parses the bridge's output and passes its flags. Every
string the loop matches is emitted exactly as codex-lite 0.9.0 emits it, under the same
conditions, and tests pin each one. A change to any of them is a breaking change for the
loop, so they are frozen across 0.x:

- The status values `ok`, `refused`, `failed`, and `timeout`.
- `thread <id>`, printed when Codex reported a thread id, and not otherwise.
- `implement was not run:` when the write probe or the Windows sandbox check refuses
  before Codex starts. Implement also prints a tree footer after a run.
- On a timeout, `codex may still be running as pid <n>` when the process could not be
  stopped, a stopped message when it was, and the Windows child-process warning on
  Windows.
- Flags: `--model <id>`, `--timeout <seconds>` from 1 to 3600, `--resume` for ask only,
  `--base <ref>` for review, `--cwd <absolute path>` as the last option for review and
  implement.
- One request file and one thread file per Claude session, in the plugin data
  directory, so calls are serial.

A caller that wants Codex to read a file puts it under a directory the repository
ignores; that is why the loop's run directory must stay ignored. The message prefix
changes from `codex-lite: ` to `ccx: `; the loop does not parse it.

### ccx-loop (Claude)

Behavior carries over from ccl 0.10.0 except as listed.

- **Commands.** `plan` and `run`, with today's flags and rejection rules. Both end by
  invoking the `ccx-loop:ccx-loop` skill with the same invocation block, so the
  skill's interface does not change. The handoff retired `run` in favor of `loop`; `run`
  was kept on 2026-10-03, because `/ccx-loop:loop` repeats itself and Claude Code
  has a built-in `/loop` that does something else.
- **Dependency.** `{ "name": "ccx", "version": ">=0.1.0 <1.0.0" }`. The host
  installs the bridge with the loop, refuses to disable the bridge while the loop is
  enabled, holds a bridge update inside the loop's range, and disables the loop when the
  bridge is missing or out of range (verified, spike M0.1).
- **Removed.** The bridge version gates: present and at least 0.8.0
  (`SKILL.md:522-530`, `:866-870`), and at least 0.9.0 for `review --cwd`
  (`SKILL.md:430-436`, `multi-repo.md`). The dependency floor covers both.
- **Kept.** `codex --version` and the fallback when Codex is absent or broken;
  `--no-codex`; the Claude fallback roles table (`tiers.md:13-20`); the status table; the
  presence checks on the built-in `code-review` and Workflow skills, which no plugin
  dependency can cover.
- **Removed after spike M0.6.** The "skill not listed in session" retry
  (`SKILL.md:550-557`), which came from a live incident on 2026-09-29. A fresh session
  listed the dependency's commands and skills after install and after an update
  (`docs/decisions.md` Part 1 item 7). The generic `failed` row of the status table
  still covers a Skill call that errors.
- **Persistent Claude-only mode.** A `userConfig` option `codex`, boolean, default true,
  shown in `/config` (verified, docs: `userConfig` since 2.1.83, its `/config` rows since
  2.1.269). False makes every run behave as `--no-codex`.
  This replaces the handoff's mode file in plugin data: the host already stores,
  displays, and edits the value. The per-run `--no-codex` still works; there is no
  per-run override back to Codex in v0.1.0. Spike M0.2 showed `${user_config.codex}` is
  substituted into command text, but an option never set stays the literal placeholder.
  The run and plan commands read it while parsing flags: only `false` adds `--no-codex`
  (`docs/decisions.md` Part 4 items 1 and 2).
- **State names.** Renamed with the plugin:

  | Was | Becomes |
  |---|---|
  | `.ccl/<run-id>/` | `.ccx/<run-id>/` |
  | `.ccl.json` | `.ccx.json` |
  | `specs/ccl/<run-id>/` | `specs/ccx/<run-id>/` |
  | `<checkout>-ccl-<run-id>` worktree | `<checkout>-ccx-<run-id>` |
  | `# ccl run report` | `# ccx run report` |

  A repo with `.ccl.json` and no `.ccx.json` ends the run in `blocked` with a message
  to rename the file. Silently ignoring it would drop the owner's `checks` and
  `timeouts`.
- **Audit coupling.** Unchanged. The loop writes `handoff.md` and `cca-manifest.json` and
  suggests `/cca:audit`, all optional, and works without the audit plugin. These names
  stay until the audit plugin joins the suite.

### ccx (Codex)

The five `general-code-review*` skills from codex-code-review-general 0.1.0, names and
text unchanged. The orchestrator skill names its four companions, so the skill names are
frozen. The directory carries copies of the Apache-2.0 LICENSE and a rewritten NOTICE,
because an installed plugin holds only its own directory and the upstream attribution
must travel with it. The old NOTICE says the plugin redistributes upstream skills
unmodified at a locked commit; that becomes false when the mirror is dropped.

### repo-docs

Moves to `plugins/repo-docs/` with both manifests. Its skill and hook are unchanged;
its `AGENTS.md` and README are rewritten for the new home.
The hook is a shell-form command, `sh "${CLAUDE_PLUGIN_ROOT}/hooks/pre-commit.sh"`, run
before each `Bash` tool call and, for Claude Code on Windows, each `PowerShell` one. On
Windows it needs Git for Windows, whose Git Bash Claude Code uses for shell-form hooks,
and Codex needs Git's `bin` folder on `PATH` to find `sh`; the README states both
prerequisites, and acceptance runs the hook from a path with a space.
Its `AGENTS.md` becomes a directory spoke under the root hub: its paths are rewritten
relative to the plugin directory, its POSIX-only constraints apply to that directory,
not the suite, and its references to the version script and plain `v` tags go. The
README's install lines name the suite marketplace. `scripts/sync-version.sh` is dropped;
it rewrites every `version` key in a marketplace file, which would overwrite the other
plugins' versions.

## House rules

### Content

Sources live in `plugins/ccx/rules/`, because an installed plugin holds only its own
directory.

- `core.md`: the line "Any instruction file can add an ask-first rule; none removes
  one." and the sections Working, Code, Tests, Done, and Ask first. Copied byte for byte
  from forge-ops `claude/CLAUDE.md` at a pinned commit. The Claude and Codex copies of
  these sections are identical today (verified, `diff`).
- `windows-claude.md` and `windows-codex.md`: the Git Bash line and the PowerShell line.
- `writing-codex.md`: Codex's inline Writing section.

Claude's Writing rules are the output style, not part of the block.

| Option | Default | Claude block | Codex block |
|---|---|---|---|
| core | on | `core.md` | `core.md` |
| windows | on, offered only on Windows | `windows-claude.md` | `windows-codex.md` |
| writing | off | none; the command prints how to select the style | `writing-codex.md` |

### Targets

- `CLAUDE.md` in the Claude config directory: `$CLAUDE_CONFIG_DIR` when set, else
  `~/.claude`. Created if missing. Whether Claude Code reads the user file from
  `$CLAUDE_CONFIG_DIR` is spike M0.7; acceptance profiles depend on it.
- `AGENTS.md` in the Codex home: `$CODEX_HOME` when set, else `~/.codex`. Written only
  when that directory exists. The command never creates it. When `AGENTS.override.md`
  exists there, Codex reads it instead of `AGENTS.md` (verified, source), so the command
  reports that and leaves the Codex target alone.

Nothing else is read or written, apart from the plugin's data directory and backups next
to the targets. Repo-level instruction files belong to repo-docs.

### Block format

```
<!-- ccx:house-rules begin version=0.1.0 options=core,windows join=blank digest=<hex> -->
...rules...
<!-- ccx:house-rules end -->
```

`join` records the bytes the command added in front of the begin marker, so removal
takes back exactly those: `none` when the file was empty or created, `blank` for one
empty line after a file that ended with a newline, and `newline` for a line break plus
an empty line after a file that did not. The block ends with the file's line ending.

The digest is over the block body with CRLF read as LF, so a change of line ending is not
an edit. A marker whose digest is over the CRLF body is accepted too. It tells two things
apart:

- **Edited**: the body in the file no longer matches the recorded digest.
- **Stale**: the body the current plugin would write for the recorded options differs
  from the recorded digest. A plugin update that leaves the rules unchanged is not
  stale, so most updates raise no notice.

### States and actions

| State | Found | Action |
|---|---|---|
| absent | no markers | propose appending the block at the end |
| current | digest matches the file and the shipped text | report, write nothing |
| stale | file matches its digest, shipped text differs | show the diff, ask, replace in place |
| edited | file does not match its digest | show the local edits, ask the user to move them below the end marker, write nothing |
| malformed | a lone marker, two begins, or end before begin | report the line numbers, write nothing |
| declined | user said no to this digest before | ask again only when the command is typed; the SessionStart notice stays quiet |

### Writing

- Each target is shown as a diff and asked about separately.
- Text outside the block is preserved byte for byte, including line endings, a byte order
  mark, and the final newline. The block takes the file's line ending.
- Before a change to an existing file, it is copied to
  `<file>.ccx-backup-<timestamp>`. A missing file is created, and the data directory
  records that the command created it. The new content goes to a temporary file in the
  same directory, then is renamed over the target. On Windows a failed rename is
  retried once, then reported with the backup's path.
- The script plans and applies in two calls. The apply call refuses if the target
  changed since the plan, so a diff the user approved is the diff that is written.
  Every call but `status` holds a lock directory in the data directory while it reads
  and writes the plan and state files, because Claude may run two applies at once.
- `--remove` deletes the block and the bytes its `join` names, and nothing else. When
  the command created the file and nothing else is in it, the file is deleted. Install
  then remove gives back the original bytes.
- An `@` import line in the Claude file is reported as a possible duplicate of the
  rules. The command does not follow or rewrite it.

### Staleness notice

The SessionStart hook reads the begin marker in each target and compares the digest with
the shipped text for the recorded options. When stale and not declined, it shows the user
one line naming the file and `/ccx:rules`. It writes nothing. The line is the hook's
`systemMessage`, which Claude Code shows on screen at startup (spike M0.4, in
docs/decisions.md). The hook matches `startup` only, so resume, clear, and compaction do
not repeat it.

### Local overrides

Personal rules go below the end marker, under a heading the user chooses. The block never
states a conflict order. On the author's work machine, which has no forge-ops and whose
files are kept by hand, its own lines go there, so the block stays identical to what
ships.

## Versions, tags, and dependencies

- **ccx family in lockstep.** `ccx`, `ccx-loop`, and the Codex `ccx` share one
  version, starting at 0.1.0 under their earlier names and at 0.2.0 as `ccx` (the rename of
  `docs/decisions.md` Part 11). This is the suite version that the changelog and the
  Claude catalog's `metadata.version` carry.
- **repo-docs on its own line.** It continues from 0.1.1 to 0.1.2: a new home, no change
  in behavior.
- **Tags.** `<plugin>--v<version>`, made by `claude plugin tag`, which checks that the
  manifest and the catalog entry agree (verified, docs). No bare `v` tags. The source
  repos' tags are not imported; their `v0.1.0` tags collide.
- **Dependency range `>=0.1.0 <1.0.0`.** The floor is the oldest bridge the loop works
  with and rises only when the loop needs a newer bridge feature. The upper bound is
  safe because the bridge contract is frozen across 0.x: a breaking change needs 1.0.0,
  which the range excludes. Spike M0.1 chose this over `^0.1.0`. With a caret range,
  updating the loop to a new minor before the bridge left it disabled with
  `Requires "a@spike-mkt" ^0.2.0, installed 0.1.1` until the bridge caught up; with the
  bounded floor range, either update order worked (`docs/decisions.md` Part 1 item 2).
- **Release order.** `ccx` is tagged before `ccx-loop`, because installing the loop
  from git resolves the bridge against the highest satisfying tag (verified, docs).
- **`main` is the release ref.** Codex has no dependencies and no tag convention, and a
  git marketplace upgrades at Codex startup from its ref (verified, source), so Codex
  users get whatever is on `main`. After v0.1.0, a change under a plugin directory
  merges to `main` only with that plugin's version above its last tag; CI checks this.
  Work in progress lives on branches. A Codex user who needs to hold back pins the
  marketplace to a tag with `codex plugin marketplace add <repo>@<tag>`. A bad release
  is fixed forward with a patch release.
- **Floors.** The README promises only the oldest versions the acceptance ran on. No
  single documented floor exists: features the suite uses arrived between 2.1.78
  (plugin data) and 2.1.269 (`userConfig` rows in `/config`, `/output-style` with an
  argument), and plugin `dependencies` had fixes through 2.1.143 with no documented
  start (verified, docs and changelog). So the floor is at least 2.1.269 and is set by
  the acceptance record. Codex CLI 0.159.2. Node 22 or later.

## Modes

- **Cross-vendor** (default): Codex is installed and logged in.
- **Claude-only**: automatic when the `codex` binary is absent or broken; persistent with
  the loop's `codex` option set to false; per run with `--no-codex`. The bridge commands
  report that Codex is missing.
- **Bridge only**: install `ccx` alone.
- **Loop without bridge**: not possible; the dependency installs the bridge.
- **Codex-only**: not offered in v0.1.0. A Codex user gets the review skills and
  repo-docs. The house rules command runs only from Claude Code in v0.1.0.

## Repo tooling

- **Root `package.json`**: private, no dependencies, Node 22 or later. `npm test` and
  `npm run lint`.
- **Tests** live under `tests/`, never in a plugin directory, so they do not ship:
  `tests/ccx/` (the bridge suite and its fixtures, moved) and `tests/rules/` (house
  rules and `suite.mjs`). Catalog and manifest checks are lint rules.
- **Lint** (`tools/lint.mjs`) generalizes the bridge's lint: manifests and catalog
  entries agree; the ccx family is in lockstep; the loop's dependency range is
  `>=<floor> <1.0.0` with a floor at or below the family version; every catalog source
  exists; no old names remain in shipped files,
  apart from the migration literals it lists by file; shipped files are ASCII;
  per-module line budgets; the Codex schema URL is 1.0.0;
  every plugin directory holds LICENSE, and `plugins/ccx-codex/` also NOTICE; a
  plugin changed since its highest `<name>--v<version>` tag carries a higher version,
  the Codex `ccx` against the bridge's tags, which share its name; and the changelog
  has a dated heading for the suite version.
- **Release** (`tools/release.mjs`): `ccx <version> [--floor <version>]` or
  `repo-docs <version>` sets the version line in every manifest and catalog entry that
  carries it, and with `--floor` the loop's dependency range, writing no file unless all
  can be set cleanly. It then runs lint, which checks the copies, the range, and the
  changelog heading. Tagging stays with `claude plugin tag`.
- **CI**: GitHub Actions on Ubuntu, macOS, and Windows with Node 22, running lint and
  tests, then `claude plugin validate --strict` on the root and on each plugin
  directory. CI installs the Claude Code npm package, pinned to a version, for that step
  only (approved 2026-10-03). The test job checks out the full history and tags, which
  the tag rule needs; lint fails in a shallow clone.
- **`.gitattributes`** keeps `*.sh`, `*.mjs`, and `*.md` at LF, so Windows checkouts do not
  break the repo-docs hook script.

## Migration

- **History.** Each source is imported with `git subtree add` into `imports/<repo>/`,
  without squash, so the original commit IDs stay reachable and old PR links still
  resolve. Then one commit moves files into place and a second renames strings. Moves and
  renames are never mixed, so `git log --follow` and review stay readable.
- **Pinned sources.** codex-lite-cc `2b2454d`, claude-codex-loop `16b8ee7`,
  codex-code-review `f5c7687`, repo-docs `83b14a2`. The house rules, style, and chat
  block come from forge-ops `main` when M3 starts, recorded in the PR; it was `948ce5f`
  on 2026-10-03, which added two rules after the 2026-10-02 handoff. Release 0.1.3 synced
  the core rules to `9faabda` on 2026-10-04 (`docs/decisions.md` Part 9).
- **Untracked design docs.** claude-codex-loop's `SPEC.md`, `docs/architecture.md`,
  `docs/build-plan-v0.1.0.md`, and `docs/spec-amendments-draft.md` are excluded from git
  in that repo, so no import carries them. They exist only on the author's disk. They are
  copied by hand into `docs/history/claude-codex-loop/`.
- **Old plugins.** Setup lists, with uninstall commands: on Claude Code, `codex-lite`,
  `ccl`, and `repo-docs` from their old marketplaces, and `recode-loop` then `recode`
  from this one; on Codex, `codex-code-review`, `codex-code-review-general`, and
  `repo-docs` from an old marketplace, and `recode` from this one. The Claude catalog's
  `renames` map moves `recode` and `recode-loop` installs to `ccx` and `ccx-loop`, so
  setup finds the Claude ones only after a move that did not happen. It never lists
  the audit plugin, which stays separate. Running old and new together duplicates the
  bridge hook and the review skills.
- **Audit plugin.** It calls the bridge as `codex-lite:ask` and finds it by the
  `codex-lite@` plugin id on 33 lines. Uninstalling `codex-lite` breaks it until those
  lines say `ccx`. Decided 2026-10-03: the audit repo switches them to `ccx` before
  cutover uninstalls `codex-lite`. As of 0.6.0 it has not, so `codex-lite` stays.
- **Cutover**, after release, in three steps so no machine is left without rules:
  1. forge-ops installers stop writing the home instruction files. Today
     `claude/install.mjs` rewrites `~/.claude/CLAUDE.md` to its one-line import whenever
     it differs, and `codex/install.mjs` copies over `~/.codex/AGENTS.md`; either would
     erase the block. Their plugin declarations switch to the new marketplace in the
     same change: `settings.common.json` enables `codex-lite` and `ccl` from the old
     marketplaces, and Codex `config.toml` enables `codex-code-review-general`, so the
     next installer run would reinstall what cutover removes. The policy files stay in
     forge-ops for now, so existing imports keep working.
  2. On each machine, the one-line import is replaced by the block plus a Local
     overrides section, a quoted rule is confirmed in a new session, and the old plugins
     are uninstalled. The rules command reports the import but never rewrites it, so this
     is a hand edit with a backup.
  3. After every machine has moved, forge-ops drops its policy files and the old repos
     are archived.

## Security and permissions

- The bridge's sandboxes are unchanged: ask and review read-only, do and implement
  workspace-write after the probe. Codex has no network.
- `rules.mjs` touches only the two targets, their backups, and its data directory. It
  makes no network call and spawns nothing. `suite.mjs` reads the targets and the Codex
  `config.toml`, runs `claude plugin list --json`, and writes nothing.
- The allow rules setup printed in 0.1.0 and 0.1.1 changed with the data directory path,
  so the old rules stop matching. Since 0.1.2 setup prints only the Bash rule, which
  names the installed version's path.
- Uninstalling `ccx` cannot remove the block, because there is no uninstall hook. The
  README says to run `/ccx:rules --remove` first.

## Out of scope for v0.1.0

- The audit plugin and its commands.
- The Codex adapter: loop and audit as Codex skills, Codex-only mode, the reverse bridge.
- House rules applied from Codex.
- Generating the chat blocks from the style file.
- `claude plugin eval` in CI.
