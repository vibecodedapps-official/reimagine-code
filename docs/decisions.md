# Decisions

Each part records decisions and the evidence behind them. An item closes with what was
observed, or with "No incident is recorded" when it rests on reading alone.

## Part 1: M0 spikes, 2026-10-03

Run on macOS with Claude Code 2.1.284 and Codex CLI 0.159.2, in a scratch marketplace
under `/tmp/recode-spikes/`. Claude plugins were installed at project scope in a scratch
project; Codex used a scratch `CODEX_HOME`.

1. **M0.1 Dependencies install, hold, and refuse as documented.** Installing `b` alone
   also installed `a` ("+ 1 dependency: a"). `claude plugin disable a` while `b` was
   enabled was refused: "a is still required by b". Updating `a` alone stopped at the
   newest tag inside `b`'s range: "a is already at the latest version satisfying ^0.1.0
   (0.1.1, required by b)". Observed on a run of 2026-10-03.
2. **The loop's range becomes `>=0.1.0 <1.0.0`, not `^0.1.0`.** With `^0.2.0`, updating
   `b` to 0.2.0 before `a` left `b` with the error `Requires "a@spike-mkt" ^0.2.0,
   installed 0.1.1` until `a` was updated too. With `>=0.2.0 <1.0.0`, `b` and `a` were
   updated in either order with no error. A caret range would put the loop in that error
   state after every minor release whenever the loop updates first, and the order of
   automatic updates is not documented. The bounded floor range is safe because the
   bridge contract is frozen across 0.x (requirements R10): a breaking change needs
   1.0.0, which the range excludes. The floor rises only when the loop needs a newer
   bridge. Supersedes the `^0.1.0` range drafted the same day. Observed on a run of
   2026-10-03.
3. **M0.2 `userConfig` values reach command and skill text.** With
   `--config codex=false`, a command body `CMD=${user_config.codex}` printed
   `CMD=false`, and a skill body printed `SKILL=false`. The docs list only skill and
   agent content; command content works too. The value was saved under `pluginConfigs`
   in the user-level `~/.claude/settings.json` even for a project-scope install, and
   uninstalling removed it. Acceptance profiles must account for that. Observed on a run
   of 2026-10-03.
4. **M0.3 A plugin output style is named `<plugin>:<frontmatter name>`.** The picker
   listed `c:Spike Style`. Set as `outputStyle` in project settings, it applied in an
   interactive session. A headless `claude -p` run did not apply it under any name form,
   so acceptance of the style is interactive. The shipped style is therefore
   `recode:Concise Plain`. Observed on a run of 2026-10-03.
5. **M0.4 SessionStart hooks get the data directory and can notify the user.** An
   exec-form hook with `${CLAUDE_PLUGIN_DATA}` in `args` received
   `<home>/.claude/plugins/data/c-spike-mkt`, the same value as its
   `CLAUDE_PLUGIN_DATA` environment variable. Its `systemMessage` showed on screen at
   startup as `SessionStart:startup says: <message>`. Observed on a run of 2026-10-03.
6. **M0.5 Codex reads only the `.agents` catalog.** With both catalogs in one repo,
   `codex plugin list` showed only `y` from `.agents/plugins/marketplace.json`, and
   `codex plugin add a@spike-mkt` failed: "plugin `a` was not found in marketplace
   `spike-mkt`". The root `plugin.json` plugin with the agent-plugins 1.0.0 schema
   installed to `plugins/cache/spike-mkt/y/0.1.0`. Skill loading in a Codex session was
   not run, because the scratch home has no login; the same manifest form is in use on
   this machine today. Observed on a run of 2026-10-03.
7. **M0.6 A fresh session lists the dependency's commands and skills.** With only `b`
   installed, a new headless session listed `a:hello` and `a:a-skill`, and still did
   after `a` was updated within range. So the loop's "skill not listed in session" retry
   is deleted in M4, as R24 provides. Observed on a run of 2026-10-03.
8. **The scratch marketplace needed a description.** `claude plugin validate --strict`
   on a catalog without `metadata.description` failed on that warning alone, so the
   suite catalog carries one. Observed on a run of 2026-10-03.
9. **M0.7 A scratch config directory loads its own CLAUDE.md.** A first attempt found the
   scratch `CLAUDE_CONFIG_DIR` "Not logged in", so the run waited for one interactive
   login. Then, with a marker rule in that directory's `CLAUDE.md`, a headless session
   in an empty directory replied with the marker, and a control session in the real
   profile replied that it had none. So R33 stands, and acceptance runs in a scratch
   profile. Observed on Claude Code 2.1.284 on a run of 2026-10-03.

## Part 2: M2 bridge, 2026-10-03

Run on macOS with Claude Code 2.1.284 from the native installer, and 2.1.283 from npm.

1. **Each plugin manifest names an author.** `claude plugin validate --strict` on the
   recode manifest failed on one warning: "author: No author information provided".
   The catalog run failed on the same warning through its entry. recode's manifest now
   names vibecodedapps.net, as the other source manifests already do. Observed on a run
   of 2026-10-03, on both versions.
2. **CI pins Claude Code 2.1.283, not 2.1.284.** The pin is a release at least seven
   days old, so a bad release has time to be pulled; 2.1.284 was published on
   2026-09-28. Installed from npm into a scratch prefix, 2.1.283 passed strict
   validation on the root and on `plugins/recode`, and failed on a copy with no author.
   The npm package needs its install script to place the native binary. Without it,
   `claude` exits with "claude native binary not installed". The npm bundled with Node
   22, which CI uses, runs install scripts by default. Observed on a run of 2026-10-03.
3. **The LICENSE rule checks for Apache-2.0 text, not a copy of the root file.**
   codex-code-review's LICENSE reads "Copyright 2025 OpenAI", so `plugins/recode-codex/`
   keeps that copy in M5. The loop's and repo-docs' copies differ from the root one
   only in whitespace. No incident is recorded.

## Part 3: M3 house rules, 2026-10-03

1. **The rules come from commit 948ce5f of the earlier source repository.**
   `rules/core.md` is lines 6 to the
   end of `claude/CLAUDE.md`, and `rules/windows-claude.md` is lines 1 to 4.
   `rules/windows-codex.md` is lines 1 to 2 of `codex/AGENTS.md`, and
   `rules/writing-codex.md` is its lines 78 to the end. The Windows part, an empty line,
   and the core rebuild `claude/CLAUDE.md` byte for byte. The Codex parts joined the same
   way, with the Writing part last, rebuild `codex/AGENTS.md`. The chat block matches
   `claude/chat-instructions.md`. The output style matches
   `claude/output-styles/concise-plain-v4.4.md` except its `name` line, now
   `Concise Plain`. Checked with `cmp` on a run of 2026-10-03. From here this repository
   is the source.
2. **Options are recorded per target.** A target's options are recorded when its change
   is applied. A target that was declined or skipped keeps the default until it is
   applied. The other choice, one shared list, would record a choice for a file the user
   said no to. Decided 2026-10-03; tests in `tests/rules/rules.test.mjs`.
3. **The session notice runs on startup only.** The `SessionStart` entry matches
   `startup`, so resume, clear, and compaction do not repeat the notice inside one
   session. Decided 2026-10-03.
4. **Rules steps take turns through a lock directory.** In acceptance, Claude sent
   `apply claude` and `apply codex` in one message, so both ran at once. In a sandbox,
   pairs started together lost one target's update in 16 of 20 runs: its plan entry
   stayed, and its `created` and `options` entries were missing, so removal would have
   kept a file the command created. With a `rules.lock` directory held around every
   step but `status`, 50 of 50 pairs kept both. A lock older than a minute is taken
   over. Per-target state files would also work, but they change the files every test
   and the hook read. Observed on a run of 2026-10-03.

## Part 4: M4 loop, 2026-10-03

Run on macOS with Claude Code 2.1.288 and Codex CLI 0.159.2, in the scratch profile
`~/.cache/recode-acceptance/`, with `recode-loop` installed from this repository's
catalog at `feat/loop`.

1. **An option that was never set stays a placeholder.** With the `codex` option never
   set, the skill text kept the literal `${user_config.codex}`: the manifest's
   `default: true` was not put in its place. A saved value was. So the loop treats only
   the exact text `false` as off, and anything else, the placeholder included, as on.
   Observed on a run of 2026-10-03.
2. **The commands apply the `codex` option while parsing flags.** In a plan run with
   the option saved as false, the skill text read "That option reads `false`", yet Step
   0.6 recorded "Codex availability: available (codex-cli 0.159.2); --no-codex not set"
   and called Codex. The skill trusts the invocation block's `no-codex` field. A first
   fix, 1b657af, stated in step 3 that `no-codex` is `true` when the option is off,
   next to "The option reads: `true`"; a run with the option true then also sent
   `no-codex: true`. In 8cc36de the option sits in step 1 with the flags, as one rule:
   when it is exactly `false`, handle the arguments as if they included `--no-codex`.
   The skill keeps its own sentence, so the report names the option as the reason. The
   block keeps its shape, so R17 holds. Lint check 16 fails if a command stops reading
   the option. At 8cc36de, eight runs sent the right value: two with the option unset
   and three with it true sent `no-codex: false` and called Codex, and three with it
   false sent `no-codex: true`, made no Codex call, and named the option in the report.
   Observed on runs of 2026-10-03.
3. **The command descriptions lost their "or types" clauses.** In the scratch profile,
   `claude plugin details` put the loop at about 532 tokens always on, over the 510
   that ccl 0.10.0 measured in the same profile (R8). Dropping "or types
   /recode-loop:run" and "or types /recode-loop:plan", and shortening the skill's
   description, brought it to about 497. A typed slash command runs without matching
   its description, so the clauses only cost tokens. Decided 2026-10-03.
4. **A rules read refused for the plan means no rulesets apply.** On the private
   throwaway repositories, `gh api repos/<owner>/<repo>/rules/branches/main` returned
   HTTP 403, "Upgrade to GitHub Pro or make this repository public to enable this
   feature.", so all four publishing runs ended `blocked` with CI green. ccl decision 12
   blocks on a failed read so that a run never reports done while GitHub blocks the
   merge. GitHub enforces no rulesets on a repository where it refuses that read for
   the plan, so that risk is absent there; the required checks come from branch
   protection alone, and the run records why. Any other failure of that read still
   blocks. On a public repository the read succeeds, so nothing changes there. Chosen
   2026-10-03 by the author over keeping ccl's behavior for 0.2.0. At b1ccbee the same
   four runs on the same private repositories each ended `done` with CI green, and each
   report named the 403. Observed on runs of 2026-10-03.

## Part 5: M5 Codex plugin and repo-docs, 2026-10-03

Run on macOS with Claude Code 2.1.288 and Codex CLI 0.159.2, with both plugins
installed from this repository's catalogs at `feat/codex-and-repo-docs`.

1. **The pointers to the repo-docs skill files stay in the root hub.** repo-docs
   0.1.1 indexed its skill files in its own `AGENTS.md`. As a directory spoke, that
   file holds no index, and the hub points to it and to each skill file. repo-docs
   counts "a pointer outside the index" as a finding, and the index is the hub's
   `## Spokes` section (`references/spokes.md`, pointer grammar). The audit of this
   repository on 2026-10-03 reported no errors and flagged these pointers' scope as a
   finding; moving them into the spoke would trade that finding for the other one.
2. **The spoke dropped its copy of the `@token` rule.** repo-docs 0.1.1 told agents
   to put a bare `@token` in backticks in commit subjects and release notes. The hub
   already said so for commit subjects and PR text, and repo-docs counts a rule in both
   the hub and a directory spoke with the same meaning as a finding (judgment check
   2). The hub's rule now names release notes too, and the spoke has none.

## Part 6: M6 release, 2026-10-03

1. **R51 names 2.1.269, not 2.1.139.** R51 let the README name 2.1.139 as the
   documented feature floor. The architecture's floor note, from the Claude Code docs and
   changelog, puts the newest feature the suite uses at 2.1.269: `userConfig` rows in
   `/config` and `/output-style` with an argument. 2.1.139 would be a false floor. R51
   now lets the README say Claude Code before 2.1.269 lacks features the suite uses,
   without promising 2.1.269. The README states 2.1.288 and Codex CLI 0.159.2: the
   items from M3 on ran on 2.1.288, and M2's on 2.1.284, so only 2.1.288 has run the
   whole suite.
2. **The Codex `recode` is held to the bridge's tags.** R49 tags the Claude plugins
   only, and Codex installs whatever is on `main`. The Codex plugin shares the bridge's
   name and the family version, so lint compares a change under `plugins/recode-codex/`
   with the highest `recode--v` tag, and a change to it alone needs a family release.
3. **A shallow clone fails lint.** actions/checkout fetches one commit and no tags by
   default, which would turn the tag rule off without a word. The test job now fetches
   the full history, and lint fails in a shallow clone, so a later change to the
   checkout cannot switch the rule off unnoticed.

## Part 7: M6 Windows fixes, 2026-10-03

Run on Windows 11 with Claude Code 2.1.283 and Codex CLI 0.157.1 from npm, in scratch
profiles, with the suite installed from GitHub at the 0.1.0 release commit.

1. **The sandbox probe gets four times the local limit.** In a new `CODEX_HOME`, one of
   Codex's first sandboxed commands took 28.8 to 31.6 s, with the npm 0.157.1 and the
   standalone 0.160.0: run alone, the first one, in four homes; in setup, either
   control. Later ones took about 0.13 s. The bridge stopped local commands at 30 s, so
   one of five first setups failed. A run stopped at 20 s saved nothing: the next one
   took 28.8 s again, so a slower machine would fail every time. Each probe control now
   gets 120 s, four times the local limit, so the test seam still scales it. Other
   local commands keep 30 s.
2. **repo-docs' hook also runs before the PowerShell tool.** A new Claude Code profile
   on Windows, with no setting for it, reported PowerShell as its primary shell. A
   commit made through the PowerShell tool got no reminder, because the hook matched
   `Bash` only. The hook gains a second entry with the matcher `PowerShell`, not the
   pattern `Bash|PowerShell`: Codex documents its matcher as a tool name, and the
   `Bash` entry stays byte for byte as it was. Lint pins both entries.
3. **Codex on Windows needs Git's `bin` folder on `PATH`, and the README says so.**
   Codex ran the hook's `sh` from `PATH`. A default Git for Windows install puts only
   `Git\cmd` there, so the hook did nothing, with no error, and the commit went ahead.
   With `C:\Program Files\Git\bin` on `PATH`, the same run got the reminder. Finding
   `sh` without `PATH` would need a Windows-only command form, so the prerequisite is
   stated instead.

## Part 8: recode 0.1.2, setup's Edit rule, 2026-10-04

Run on macOS with Claude Code 2.1.288 and on Windows 11 with Claude Code 2.1.283, in
scratch profiles, with recode 0.1.0 and 0.1.1 installed from GitHub.

1. **Setup no longer prints an Edit rule for the data directory.** R15 kept codex-lite's
   two rules. The Edit rule was meant to stop the prompt for the request file's Write in
   default mode, and it never did: the file is under `~/.claude`, which Claude Code treats
   as sensitive, and that check refused the Write with the rule present on macOS and on
   Windows, and with a PreToolUse hook returning `allow` on macOS. In auto mode the rule
   did harm. With only that rule in the settings, the Write failed with "The server-side
   auto mode classifier gave no verdict (it skipped this action)" in 3 of 3 runs on
   macOS, two headless and one interactive. Without it, 3 of 3 passed. On Windows the
   same held: with the rule a headless run got no verdict, and without it 3 of 3
   headless runs passed. The Bash rule stays: with only that rule, 3 of 3 headless auto
   runs passed on macOS, two typed and one in plain words. On a folder that is not sensitive, a matching Edit rule did let the
   Write through in headless default mode, on both hosts, so moving the request file out
   of `~/.claude` would allow unattended default-mode calls. That move is deferred: auto
   mode already covers unattended calls, and the bridge script is at its line budget.

## Part 9: recode 0.1.3, the rules sync and the symlink fix, 2026-10-04

1. **The core rules come from commit 9faabda of the earlier source repository.** Since
   948ce5f, it had added two bullets to both of its files: the cause check under
   Working, from its PR
   68, and the code comment rule under Code. M7 step 2 replaces each machine's import
   of those files with the block, so a block without them would drop both. `rules/core.md`
   is again lines 6 to the end of `claude/CLAUDE.md`, now at 9faabda. The other three
   rules files, the output style, and the chat block's pasted text already matched
   9faabda, apart from the style's `name` line and the chat file's own header, so they
   are unchanged. The Windows part, an empty line, and the core rebuild
   `claude/CLAUDE.md` byte for byte, and the Codex parts rebuild `codex/AGENTS.md`, whose
   Writing section now starts at line 83. Checked with `cmp` on 2026-10-04. This
   repository stays the source; a later change there reaches the block only through a
   sync like this one.
2. **The rules and suite scripts compare their path after resolving it.** Each ran its
   `main()` only when `import.meta.url` equalled `process.argv[1]` as a file URL. Node
   resolves the entry point through symlinks and `argv[1]` keeps the link, so with a
   link in the plugin's path neither script did anything, with exit 0. Found while
   running item 3 from a path under `/tmp`, a symlink on macOS. Both now compare with
   `realpathSync(process.argv[1])`, the same resolution Node applies. `recode.mjs` has
   no such check and is unchanged. A test per script runs it through a linked folder,
   a junction on Windows so it needs no extra rights.

## Part 10: M7 step 2, the cutover on each machine, 2026-10-04

Run on macOS with Claude Code 2.1.288 and codex-cli 0.159.2, and on a personal Windows
11 machine with Claude Code 2.1.287 and codex-cli 0.160.0, in the author's real profiles,
with recode 0.1.3. `docs/acceptance.md` has both records.

1. **The work machine is out of the gate.** Decided by the author on 2026-10-04. It has
   no checkout of the earlier source repository, and its `CLAUDE.md` and `AGENTS.md` are
   kept by hand on
   purpose. It may adopt the block from a brief without the steps for that repository,
   with its own
   lines below the end marker, but runs no gate. R59's rules check, against a file with
   local overrides below the block, ran on the personal Windows machine instead: its
   Codex file keeps a Links section there, and `/recode:rules` read `current` and
   changed nothing. The second change to the earlier source repository waits only for
   machines that import its
   files.
2. **The loop asks before publishing once the house rules are in the user's file.** The
   rules' Ask first list covers commits, pushes, PRs, and comments, so a headless run on
   each machine ended with the question, and a `--resume` reply let it publish. Scratch
   profiles without the rules never showed this. It is the rules working, not a defect.
3. **Auto mode refuses some step 2 actions.** Removing the old text from the home
   files was denied as "Self-Modification", and the `--resume` that approves the
   publish as "External System Writes". In a Windows dry run, changing a scratch Codex
   `config.toml` and running `claude -p` with a scratch `CLAUDE_CONFIG_DIR` were denied
   as "Security Weaken". Each went through after the author left auto mode and asked
   for the same call again.
4. **A hook check needs a repository that tracks an instruction file.** The repo-docs
   hook reminds only where `git ls-files` finds an `AGENTS.md` or `CLAUDE.md`. The
   first Codex check on macOS used a repository without one and got no message; the
   same commit after adding a tracked `AGENTS.md`, nothing else changed, got it. On
   Windows, Codex started from PowerShell needs `Git\bin` on the user `PATH`: without it
   a commit got no message, and Git Bash hides the gap because it passes its own
   `usr\bin` to child processes.
5. **An old checkout of the earlier source repository must not run its installer after
   step 2.** Before its commit 0847634 (its PR 67), `claude/install.mjs` rewrites
   `~/.claude/CLAUDE.md` to
   the one-line import, which erases the block. Each machine's checkout was confirmed at
   or after 9faabda first; the Windows one was fast-forwarded from e5429ef.
6. **A line-ending change makes the block read as edited by hand.** Found on Windows and
   confirmed with `planTarget`: a block written into a CRLF file reads `current`, and
   the same file converted to LF reads `edited`, so the block stops updating and the
   session notice goes quiet. Tracked in issue 16.

## Part 11: ccx 0.2.0, the rename from recode, 2026-10-04

Issue 15 settled four choices. The spikes ran on 2026-10-04 on macOS with Claude Code
2.1.288 and codex-cli 0.159.2, in scratch profiles, never the real one. CI's pinned
Claude Code 2.1.283 was not tested.

1. **The Claude catalog carries a `renames` map.** It maps `recode` to `ccx` and
   `recode-loop` to `ccx-loop`. `claude plugin validate --strict` accepts it, rejects a
   chain that ends at no listed plugin ("chain does not resolve (target-missing)"), and
   rejects a loop ("cycle"). The docs call the map append-only history, so it stays
   after everyone has moved. Lint pins it, because the manifest check never asks that
   the old names be listed.
2. **The rewrite is lazy and drops the install records.** Nothing happens during the
   marketplace update, which prints nothing about it. The first plugin command or
   session start after it rewrites the keys of `enabledPlugins` and `pluginConfigs`, and
   the loop's `codex` option survived under `ccx-loop@reimagine-code`. It also deletes
   the old entries from `installed_plugins.json` instead of renaming them, so
   `claude plugin list` shows no plugin at all, not "not cached", until the user runs
   `/plugin install ccx@reimagine-code`, and `ccx-loop@reimagine-code` for the loop.
   Installing `ccx-loop` alone resolved its dependency on `ccx` through the
   `ccx--v0.2.0` tag. This corrects the issue, which expected "not cached".
3. **The README does not tell Claude Code users to uninstall the old plugins.** After
   the rewrite, `claude plugin uninstall recode@reimagine-code` fails with "not found in
   installed plugins". Setup's Claude old-plugin entries are only a fallback for an
   install the map did not move, listed with the loop first because Claude Code refuses
   to disable the bridge while the loop needs it (Part 1 item 1).
4. **Two settings are not migrated.** `outputStyle` stays `recode:Concise Plain`,
   pointing at a style that no longer exists, until the user selects `ccx:Concise
   Plain`. The data directory is not migrated either: `plugins/data/recode-reimagine-code/`
   stays, orphaned, and `ccx` starts with an empty one. That confirms the issue's
   unverified guess. Its two effects, a created `CLAUDE.md` left empty by `--remove` and a
   declined rules text raising the notice again, are minor and stay in the changelog
   instead of a migration.
5. **Codex has no rename mechanism.** After the catalog drops `recode`, `codex plugin
   list` no longer shows it, though `config.toml` keeps its table. `codex plugin add
   ccx@reimagine-code` and then `codex plugin remove recode@reimagine-code` both
   succeed, and the remove deletes the old table. The README gives those two lines.
6. **`/ccx:rules` keeps reading the old block.** A plain rename would have read a block
   under `recode:house-rules` as absent: a second block below it, `--remove` finding
   nothing, and no notice. `inspect()` reads both markers; a block under the old one
   plans as `stale` even when its rules match, so one run of `/ccx:rules` rewrites it
   under the new marker; a file holding both blocks, or one block with a begin line of
   one name and an end line of the other, is `malformed`. Telling users to run
   `/recode:rules --remove` first would not work, because the map moves them with no
   command of theirs.
7. **The loop's repository paths follow the plugin name.** `.recode/`, `.recode.json`,
   `specs/recode/`, and `<checkout>-recode-<run-id>` become the `ccx` forms, as the 0.1.0
   rename did for `ccl`. A repository with `.recode.json` or `.ccl.json` and no
   `.ccx.json` ends `blocked`, for the reason of R23: ignoring the file would drop its
   `checks` and `timeouts`.
8. **`ccx`, `ccx-loop`, and the Codex `ccx` are released as 0.2.0.** A minor bump marks a
   breaking change in 0.x. 1.0.0 is not needed, because the bridge contract the loop
   parses (R10) does not change. The loop's range becomes `>=0.2.0 <1.0.0`, because no
   `ccx` below 0.2.0 exists. repo-docs is unchanged and stays at 0.1.3. The old
   `recode--v` and `recode-loop--v` tags stay as they are.
9. **repo-docs was unaffected** by the rename in every spike.
10. **The rules digest ignores line endings.** The commit before the rename, for issue
    16 and Part 10 item 6, takes a marker's digest over the block body with CRLF read as
    LF, and still accepts the two older digests, so a block no longer reads as edited by
    hand after its file's line endings change.

## Part 12: ccx-loop 0.3.0, four tiers and one final reviewer, 2026-10-04

Issue 20 settled these choices. A `gpt-6-astra` second opinion on the issue, the same
day, added the file count over the whole run, the checks before every review, the
narrower need for `code-review`, and the multi-repo rules.

1. **Four tiers; max is gone.** An xhigh-shaped change with a risk floor trigger is now
   xhigh. `--effort max` is rejected with a pointer to `xhigh` rather than read as
   `xhigh`, so a script that passes it learns of the change. Lint check 16c fails if
   either command lists any other set of values. This replaces the max bucket of ccl
   Part 5 item 6.
2. **The tier alone fixes every cell.** Plan review is `gpt-6-astra` at every tier. The
   implementer is `gpt-6.1-sol` at low and medium and `gpt-6-astra` at high and xhigh, and
   `gpt-6-luna` is no longer used. No cell follows a trigger, which supersedes ccl Part
   10 item 4.
3. **Sonnet, not Opus, implements a slice that meets the criteria at high and xhigh.**
   The criteria are unchanged. This reverses ccl Part 10 item 2, which kept Sonnet as a
   fallback only, by the author's choice. Opus no longer implements, and a Sonnet call
   that errors stops the run, as an erroring Sonnet fallback already did.
4. **The final review has one reviewer role per run.** By the author's choice, a
   higher-risk run gets Claude, the `code-review` skill at the tier's level, and any
   other run gets Codex `gpt-6-astra`. This reverses ccl Part 10 item 3, both reviewers
   at every tier, and Part 7 item 5, a round is both passes. Issue 20 records the costs:
   - a higher-risk slice is implemented by Sonnet and reviewed by Claude, so Codex sees
     that work only at the plan review;
   - a lower-risk run at high or xhigh is implemented and reviewed by `gpt-6-astra`.
5. **Higher-risk means the Sonnet criteria, taken over the whole run.** That is a risk
   floor trigger, more than eight distinct files across all slices, or a new module,
   type, interface, or rule section that another file cites. The count covers the run,
   so splitting work into slices cannot change the reviewer. A trigger alone was the
   other candidate. It misses internal structure and documentation contracts, and since a
   trigger raises a run to high, it would never pick Claude at low or medium.
6. **The rule is judged at the plan and before every review, and a positive result
   sticks.**
   - **At the plan.** A trigger is known at Step 1.6, and the file count and the cited
     module once Step 2 has the slices, so Step 2 records the result.
   - **Before every review.** Step 4.5 judges the diff, Step 5 each later round, and Step
     7.3.5 each CI repair review.
   - **A late switch.** A run that turns higher-risk moves to Claude for its remaining
     rounds, inside the same cap of 3, and never moves back. The second opinion proposed
     blocking such a run instead. The switch was kept because it only deepens the review,
     and blocking would throw away a nearly finished run.
   - **Reviewer only.** The rule never raises the tier, reruns Step 3, or changes a
     slice's model.
7. **`code-review` is needed only by a higher-risk run.** A lower-risk run, under
   `--no-codex` too, uses Codex or its Fable, then Opus, fallback. A lower-risk run that
   turns higher-risk and finds the skill missing ends `blocked`, naming both the switch and
   the skill. A higher-risk run under `--no-codex` still gets Claude.
8. **In Multi-repo mode the role covers every changed repository.** The patch files are
   written whichever role is chosen, because the Claude stand-in reads them too.
9. **The suite moves to 0.3.0 together.** `tools/release.mjs` keeps one suite version, so
   `ccx` and the Codex `ccx` move with no change, as at earlier releases. The loop's
   range stays `>=0.2.0 <1.0.0`.

## Part 13: ccx 0.3.1, the review rounds, 2026-10-05

1. **`/ccx:rules` writes through a symlinked target instead of refusing it.** Apply
   wrote a temporary file and renamed it over the target, which turned a symlinked
   `CLAUDE.md` or `AGENTS.md` into a regular file and left the link's target unchanged.
   A `~/.claude/CLAUDE.md` linked into a dotfiles repository is a supported setup, and
   the R45 tests run through a linked `~/.claude`, so refusing links would break those
   users. The target is resolved once where targets are computed, so the hash, backup,
   temporary file, and rename all land on the file the link points to, and the link
   stays a link. Paths through a linked config directory stay as given.
2. **A hard-linked target and a link to a missing file are refused.** A rename cannot
   keep a hard link, and a link to a missing file has no file to write through to;
   running again gives the same result, so the refusal says what is wrong instead of
   asking for another run. When the Codex target is the same file as the Claude target,
   compared by device and inode with bigint stats so that large NTFS file ids do not
   collide, the Codex target is skipped. Two plans for one file made each apply stale the
   other. The Windows side of that comparison is not yet checked by a run.
3. **A signal stops the bridge's run before anything else starts.** On SIGINT or SIGTERM
   the bridge stops Codex's process group and ends `status: failed`. A git call before the
   turn, or one of `setup`'s checks, that a signal interrupts is a refusal, so no Codex
   turn or later check starts, and the run ends `status: refused`. `setup` printed no
   status line before; it now prints one only in this case, an addition to its output.
   The check reads the interrupted call's own result, not a process-wide flag: a flag
   made a signal during a `do` turn drop the tree footer.
4. **The loop cleans up a failed Codex call against a snapshot taken before it.** The
   earlier rule reverted every path outside the slice, which could undo an earlier
   slice's work and delete ignored files such as `.env`. Before every Codex implementer
   or fix call, the run saves the status, the diff, and the hashes of untracked files as
   `pre-<n>.status`, `.patch`, and `.hashes`. After a failure, only a path that was clean
   before the call and changed outside the slice is restored; a path that was already
   changed, or an untracked file whose content changed, ends the run in `blocked`.
5. **The CI watch and the cca manifest read the live remote head.** `git ls-remote`
   does not update the tracking ref, so a push by someone else during the watch could be
   judged green on a head without the run's commits. The watch compares the live head
   with the commit the run pushed at every poll, and the manifest names the PR only when
   they match.
6. **In the repo-docs hook, a quote is never a command boundary, and wrappers are matched
   explicitly.** Three fix rounds swung between false positives (`echo "git commit"`)
   and false negatives (`git -c user.name="A B" commit`), each round's boundary reopening
   the other's cases. The boundary is now the start of the command or `;`, `&`, `|`, or
   `(`, and `bash`, `sh`, or `zsh` with `-c` or `-lc` and a quote is matched as a
   wrapper. Some forms stay quiet, such as `pwsh -Command`, `cmd /c`, and `if git commit`,
   and some quoted separators still remind; these are listed as known limitations. A
   missed reminder costs one audit prompt and never blocks a commit.
7. **The bridge stays at 700 lines by joining statements, for now.** `ccx.mjs` plus
   `codex.mjs` were at the R14 limit, and three fixes each needed a line, so three lines
   of `ccx.mjs` now hold two statements each. Raising the limit is the author's call.
8. **A shared rules plan replaced by another session stays a known limitation.** By the
   author's choice. A clean fix needs `apply` to carry a plan token, which changes its
   command line, and refusing while a plan is pending would block re-planning after a
   decline.

## Part 14: cca 0.9.0, the audit plugin joins, 2026-10-05

Decided with the user on 2026-10-05, before the import. The user is the only user of
every plugin in the suite, so no step redirects other users from the old repositories.

1. **`plugins/cca`, Claude catalog only.** cca is commands, agents, and Claude subagents,
   so it has no Codex side. Imported with `git subtree add` from claude-codex-audit
   `eed9fba` (the 0.8.1 release) without squash, then one move commit and one rename
   commit, as the four earlier sources were (`docs/rename-map.md` section 6).
2. **Own version line, first release 0.9.0.** The install id and the bridge it detects
   both change, so a minor bump, not a patch. Tagged `cca--v0.9.0`; the bare `v0.8.x`
   tags stay in the archived repository. `tools/release.mjs cca <version>` sets it. The
   suite version does not move, so the changelog carries the entry under Unreleased
   until the next suite release dates it.
3. **The bridge stays optional, found as `ccx@` at 0.1.0 or later.** The
   `cca:adversary` fallback is a supported mode, so a `dependencies` entry on `ccx`
   would make a Claude-only user install a bridge they do not use. The old floor,
   codex-lite 0.7.0, was for the `status:` line and `--timeout`, which every `ccx`
   carries, so the honest floor is the oldest `ccx`. Issue 39's fix may raise it.
4. **The sh suites run through `npm test`.** `tests/cca/sh.test.mjs` spawns `sh` for
   cca's lint, each fixture build and verify (two of them again under a hostile global
   git config), and the eight script suites, one test per script so a failure names it,
   and fails rather than skips when `sh` is missing. The mawk run is an Ubuntu-only CI
   step. The root lint's catalog, ASCII, old-name, LICENSE, and tag rules cover
   `plugins/cca` by walking it; rule 15 (no bridge version gate) stays scoped to the
   loop, since cca reads the bridge version by design. cca's own lint takes
   `plugins/cca` as its root and drops its catalog check.
5. **No old-plugins entry for cca.** Setup's list exists to move other users; with one
   user, who moves by hand, adding it would only force a suite bump of `ccx`. R16 stays
   as written. The test paths the move forces (`tests/cca/*.sh`) changed with the
   rename, as M2 did for the bridge; the `plugin_version` literals the skill writes
   changed in the build commits that set the version.
6. **The old repository is archived after `cca--v0.9.0` and the user's own install
   moves.** Its two open issues, 39 (a stage 6 Codex call past 10 minutes ends a
   headless session) and 23 (run-once artifact collisions and rerun safety), are
   reopened here first with a link each way. Issue 39's two fixes, a 540-second cap in
   cca or a background mode in the bridge, are decided after the migration, since the
   bridge now lives here and `ccx` 0.3.1 already stops Codex on SIGTERM.
7. **The review-rounds transport stays `recode` 0.1.3** on the author's real profile,
   which this work never changes; the user updates it to `ccx` when they choose.

## Part 15: ccx 0.3.2, cca 0.9.1, and repo-docs 0.1.5, the second review rounds, 2026-10-05

Decided during the second review-rounds run, under a plan the user approved before it
started, with local commits, the loop acceptance runs, and the audit acceptance run
pre-approved.

1. **The bridge budget is 710 lines, and the three joined lines are split.** Part 13
   item 7's "for now" ends here: the release preparation raised R14 to 710 and split
   `ccx.mjs` lines 51, 90, and 323 (commit 33b84bf), with the author's approval in the
   plan. At 0.3.2 the two scripts use 703 lines; lint prints the figure on every run.
2. **A reviewer that fell back stays the active reviewer.** After a Codex failure swaps
   the loop's reviewer to the Claude fallback, every later reviewer call (plan follow-ups
   in Step 3.3, the later final-review rounds in Step 5.4, and the CI repair review in
   Step 7.3.5) goes to the active reviewer, and a `--no-codex` run never calls a `ccx:`
   skill (5f78769). The round 1 review found the three steps still reading as Codex after
   a swap, and a failed reviewer call printing a thread id the step would have resumed.
3. **A PR closed or merged by someone else during the CI watch ends the run `blocked`.**
   `ci-watch.md` reads the PR's `state` and ends `blocked` on anything but `OPEN`
   (5f78769), matching the pre-push rule and the `done` definition. A closed, unmerged
   PR read like an open one on every field the watch used (head, base, merge commit,
   `mergeable`, green checks), so a watch could end `done` on it. Treating a merge by
   someone else as `done` instead is the author's call and reopens this.
4. **cca's registry lock is a directory with an owner directory inside it, and a
   headless session removes a stale lock without asking.** Every `runs.json` update
   holds `runs.json.lock` with `<run-id>-<HHMMSS>` inside it, rereads the registry,
   writes a per-owner temporary file, and replaces the registry only while its owner
   directory still exists (567f711, 35c6535, 2818c2f). A lock older than about a minute
   is stale; an interactive session removes it after a user says no other audit or
   resume is running, and a headless session, or one unsure whether a user can answer,
   removes it at once (35c6535 and 2818c2f had it treat the lock as refused, and
   2cd5b27 added the report; 337db4c takes the automatic variant with the user's
   approval). The round 3 scenario scripts, under sh, dash, and busybox on APFS and
   ext4, lost an entry or removed a live lock in three schedules with a minute-based
   lock and kept every entry with the owner directory. A session whose stale lock is
   removed before its replace command only rereads and rewrites, so the automatic
   removal loses no entry on a supported path. A stale lock whose owner directory has
   this session's own `<owner>` name is never removed: two invocations of one run id
   started in the same second share the owner and the temporary file, so the replace
   test could not tell the locks apart; the session holds no lock then and runs no
   release, stops at stage 1 D6 as a duplicate id so two runs never share
   `revert-work/<run-id>/`, and elsewhere takes the registry-failure rule (cc2ad41 and
   b1cd5fe). 247eb9a had a session remove such a lock as its own leftover when its
   earlier release had failed; 1895a62 reverts that, since `ls <lock>` cannot tell that
   leftover from a same-second collision, and the fourth diff review pass showed a
   three-session schedule where a session that removed another's lock as its own
   published over a third session's registered entry. The cost is a session whose own
   release left its owner directory inside the lock: each later update takes the
   registry-failure rule with its three cases (a manual entry only when the entry is
   absent, the old state reported when present, nothing when the registry is already
   right; cfee3b3, after the fifth pass found the first wording promised a manual entry
   in every case), and the next audit or resume removes the lock. A
   collision-resistant owner token would remove the case but
   changes the owner form the plan froze, and is the user's call. The lock
   report fires when the lock directory is left holding this session's owner directory
   or nothing, or a stale lock stays because the user kept it or it bears this
   session's own name, and every printed command has its empty-lock form (337db4c,
   1895a62). Known limits: a shell stopped inside the
   one replace-and-release command for over a minute, which no supported path does; and
   two sessions that remove one stale lock at once, an interactive "no" included, where
   the slower removal can fail the faster session's acquisition, which then takes the
   registry-failure rule and overwrites no registered entry, its own printed for hand
   entry, or lands after the owner directory exists, so the faster session's replace
   test fails and it acquires again.
5. **The revert-tests script and stage 1 both refuse a partial clone.**
   `GIT_NO_LAZY_FETCH=1` is exported beside `GIT_OPTIONAL_LOCKS`, and a repository with
   a promisor remote or `extensions.partialclone` ends `partial clones are not
   supported`, exit 2, before the first object read (2168b93). On a blobless clone a run
   had fetched four packs into the audited repository over the network while the
   read-only check noticed nothing. The agents' own `git show` and `git diff` fetch
   lazily too, so stage 1 stops before any read when
   `git -C <repo> config --local --includes --get-regexp '^(remote\..*\.promisor|extensions\.partialclone)$'`
   matches for any audited repository, with `<repo>: partial clones are not supported`
   (337db4c, with the user's approval; `--local` and the pre-approved probe in cc2ad41,
   so the probe reads the repository's own config only, and `--includes` in b1cd5fe,
   since `--local` alone skips the file's `include` directives: a promisor setting in
   an included file passed the probe and was found with the flag).
6. **The read-only check's advisory `touched` walk never stops a run.** Its `find`
   errors are printed and ignored (2168b93); the hash walk stays fatal. An ignored
   directory with mode 000 had made every check exit 2, and a directory churning during
   a check did so in two of thirty runs.
7. **A custom group's name is slugged like the run id, with no length cap, and a
   reserved or shared slug stops the run.** Lowercase, with runs of characters outside
   `a-z0-9` turned into one `-`; a slug that is empty, a reserved scope name, another
   group's slug, or the `-topup` or `-maptopup` name of another group or a reserved scope
   stops the run before stage 1 (2cc90e5, 35c6535). The ledger script had failed on a
   group named `auth api` (`expected 5 fields, got 7`), and a name equal to a specialist
   scope wrote that scope's files.
8. **repo-docs maintain mode deletes a tracked `.claude/AGENTS.md` or `.claude/CLAUDE.md`,
   drops an `AGENTS.md` import that is not an adapter line, and reports an import of a
   file the repository does not track.** A tracked `.claude/CLAUDE.md` or
   `.claude/AGENTS.md` beside a root `AGENTS.md` has its lines placed and is deleted,
   never renamed in place or made an adapter, because Claude Code loads
   `.claude/AGENTS.md` when it reads `AGENTS.md` directly, Codex only from a session
   started inside `.claude/`, and an adapter there would import an absent
   `.claude/AGENTS.md` (d773f04, 0aff3bb, a3df9cb, 6ea123b). A sole tracked `CLAUDE.md`
   or `.claude/AGENTS.md` moves to the root hub, and an untracked sole file is left
   alone, the repo getting first setup, though the new hub does not load in Claude Code
   for that user while the untracked `CLAUDE.md` exists, which the audit's session
   check then reports. The reference budget rose from 90 to 100 lines with the user's
   approval, so the round 6 findings fit without dropping a reason clause (dfc5d75,
   3eeb3ce, b60c91b): an `AGENTS.md` import is dropped unless it is an adapter line,
   since inlining it would copy a hub into the file; an import of a file the repository
   does not track, outside it or ignored, is reported and never inlined, its line kept
   only in a file that stays or is renamed and otherwise named in the report, since the
   run cannot share what it holds, so a sole file that becomes the hub keeps the line
   and the next audit reports it by design (the diff review widened "outside the
   repository" to "not tracked", the same hazard one step in; the user may narrow it
   back); every normalization trigger, rename, and deletion names a tracked file, so an
   ignored personal `CLAUDE.md` is never moved or deleted; and the deletion reaches only
   the two `.claude/` files, not a tracked `.claude/skills/<name>/AGENTS.md`. Open:
   under a required-adapters policy, "add any missing one" where an ignored personal
   `CLAUDE.md` already sits.
9. **A cca run id is settled under the registry lock, and a duplicate stops the run.**
   Stage 1's suffix check at D3 is a first pass; D4 creates the run directory with a
   `mkdir` that fails when it exists and takes the next suffix; D6, under the lock after
   the fresh read, stops before stage 1 when another audit registered the same id in
   the same minute, removing this run's directory (337db4c), and the same stop applies
   before acquiring when a stale lock bears this run's own owner name (b1cd5fe, item 4).
   The cumulative review found
   that two audits started in the same minute could share a run directory and overwrite
   each other's `manifest.json`, or register one id twice, since D3 read the registry
   without the lock.
10. **Stage 6 passes Codex at most 540 seconds in a headless session.** Issue 26, the
    audit repository's issue 39 in Part 14 item 6, had two fixes, a cap in cca or a
    background mode in the bridge; the cap is taken (337db4c). In a headless session, or
    when cca cannot tell whether a user can answer, a larger `--codex-timeout` or tier
    value is replaced by 540, so the `ccx:ask` call ends inside the Bash tool's
    10-minute foreground limit and never moves to the background, where the turn's end
    would end the session; step 6 says so, as stage 1 step 6b does for the test run. Every
    tier value is above 540, so a headless run with no `--codex-timeout` always passes
    540, and a longer Codex answer swaps to the fallback with the reason `codex timeout
    after 540 s`. An interactive session keeps its value and waits for the background
    notification.
11. **The loop's CI watch polls with one read per Bash call.** Acceptance run 6 for
    0.3.2 found 13 of 51 `gh api` calls without `--hostname`, ten of them in shell loops
    the model wrote in two runs and three in ad hoc reads, and a PR closed during the
    watch ending it `blocked` 79 seconds after the first `CLOSED` read, from one of those
    loops; the text was right and the loop form bypassed it. Item 4 of the watch says one
    read per Bash call, each `gh api` written out with the host, each rule applied as
    soon as the reads it needs are in, and never a shell loop over several reads
    (a8b6bfb, 17dbd8d, 0d6e4a2).

## Part 16: ccx 0.4.0 and ccx-loop 0.4.0, the migration paths removed, 2026-10-06

Decided with the user on 2026-10-06, after the 0.3.2 release: the old plugins and their
config files are gone from every machine, and the suite has one user, so the paths that
served the move from them are removed rather than kept in the shipped files. A Codex
`gpt-6.1-sol` session made the change from a brief, a `gpt-6-astra` review found three
leftovers, fixed in the same tree, and lint, the tests, and the manifest checks pass at
a428d21.

1. **The `renames` map is dropped, reversing Part 11 item 1.** The map moved 0.1.x
   installs lazily, on the first plugin command after a marketplace update, and every
   install has moved, so it has nothing left to move. Lint now fails on a catalog that
   carries `renames` at all; the manifest check never asked for the map either way.
2. **`/ccx:rules` reads only the current marker, reversing Part 11 item 6.** A file that
   still carries a `recode:house-rules` block reads as `absent`, so `apply` adds a
   `ccx:house-rules` block beside it and `--remove` finds nothing; the changelog says to
   remove the old block by hand first, and the work-machine handoff checks for one
   before its rules step. The session-start notice no longer reports old markers.
3. **The loop no longer blocks on an old config file, reversing Part 11 item 7.** No
   repository on any machine holds a `.recode.json` or `.ccl.json`, so R23's reason, a
   dropped `checks` or `timeouts`, has no case left. R23 and the lint check for the gate
   are retired.
4. **Setup prints only its Codex diagnostics and allow rule, superseding Part 14 item
   5.** The old-plugin lists and the `old-plugins` verb of `suite.mjs` are gone, with
   the `claude plugin list` call they spawned, so the script reads files and spawns
   nothing. R16 is retired and the setup description is shorter.
5. **The migration literals lose their per-file allowances.** Lint check 10 rejects
   every old plugin, marketplace, and install id in any shipped file, with three
   patterns the review added for the old Codex review marketplace, the old audit
   marketplace, and the old repo-docs install id. The README sections "Moving from the
   old plugins" and "From recode 0.1.x", the Codex README's removal lines, and the
   migration-only tests are removed. R7's exceptions and R58 to R60 are retired; the
   history under `docs/history/`, the rename map, and Parts 10, 11, and 14 keep the
   record.
6. **The release is 0.4.0 for `ccx`, `ccx-loop`, and the Codex `ccx`.** A minor bump
   marks the dropped behaviors in 0.x, as Part 11 item 8 did; the bridge contract (R10)
   does not change, so the loop's range stays `>=0.2.0 <1.0.0`. cca and repo-docs are
   unchanged.

## Part 17: ccx 0.5.0, rules already present are found, recommended on, and adopted, 2026-10-06

Found 2026-10-06 on main b0c7b6d, then planned with a Codex `gpt-6-astra` review over
four rounds and reviewed over 21 rounds until a review found nothing.

1. **The finding.** `plan` never compared the rules with the text outside the block. Its
   only signal was `imports()`, which matched a line-start `@` and never read the file.
   The command text asked per target with no basis for a recommendation, and a user who
   had copied the rules by hand got a second copy beside the block with no way to move
   them in. The check: a Claude file holding the shipped core, rewrapped, planned as a
   plain `absent` with no note.
2. **Units, not lines or files.** The comparison unit is a heading, a list item, or a
   paragraph, with whitespace collapsed and the list marker dropped, so a rewrapped copy
   matches and a reworded line does not. A list item takes the lines indented from its
   content column to three columns past it, so a qualification keeps the whole item; a
   lazy or deeper line makes the item odd (item 7), and an odd unit never matches. Fenced
   code, HTML comments, and indented code are never units. A reworded unit is never
   partly removed. Headings are not counted as rules.
3. **Imports follow Claude's documented rules.** Source:
   https://code.claude.com/docs/en/memory, "Import additional files", checked
   2026-10-06: relative to the importing file, `~/` is home, absolute allowed, at most
   four hops here, code spans and fences skipped, `@` may appear mid-line, `\ ` escapes a
   space, a quoted path is not an import. Traversal is breadth first, keyed by the path as
   written so a symlinked file resolves its relative imports against its own directory,
   with reads cached by real path and bounds of four hops, 50 files, and 256 KiB. Every
   read error and size or count bound hit is recorded as incomplete and reported as "at
   least", never as an exact count. An import past the fourth hop is neither followed nor
   counted, since Claude does not load it. Overlap is over the union of each file's unit
   sets, never concatenated text. Claude's behavior for a symlinked CLAUDE.md is not
   documented, so each relative import in that file is tried beside the link first, then
   beside its destination, and the first that exists is used; writes still go to the
   destination. The import scan never reads the Claude file itself: a chain of imports
   that leads back to it is cut there, so the file's own block is not counted as an import.
   Codex documents no automatic import syntax, so nothing is scanned for it.
4. **One recommendation per target.** In-file overlap on an ungated file recommends
   `adopt` when `--adopt` was not given; otherwise `decline` only when the rules already
   present cover every rule, counted over the file and the imports as one set (after
   adopt moved the file's own copies, over the imports alone); otherwise `apply`, with the
   overlap notes kept so the duplicates are visible. The user chose this after review:
   one copied rule beside a table line, or a few imported rules, no longer reads as
   "decline". The command text asks
   per target and passes the recommendation on; adopt is a second pass per target, so the
   user sees the adopted diff before anything is written.
5. **Adopt removes the least.** It removes matching units, a matching heading only when
   its section held nothing else, and one blank line after a removed run that had blank
   lines on both sides. Everything else is an original slice. It strips an existing block
   first and inserts a `join=none` block before the first level 1 or 2 heading at column 0
   after the first removed line, else at the end of the file, because a block put where the
   removed lines were left the user's next lines after the end marker, where they read as
   part of the block's last section. Remove after adopt leaves the trimmed file, not the
   original, and no removal meets bytes a marker owns. Apply, backup, and decline are unchanged.
6. **The budget for `rules.mjs` rises from 400 to 640 lines, with no compression.** The
   units, the import scan, and adopt are pure logic that belongs beside the block logic.
   It rose in steps: to 520 for the plan, 560 after review round 9 (the shared line
   classifier, and readability, since the file stood at the 520 cap with more long lines
   than at HEAD), 570 after round 11 (span-aware comment stripping), 580 after round 12
   (the column-0 invariant), 600 after round 14 (the file-level gate), and 610 after round
   18 (one shared segmentation for spans and comments), and 640 after the review of the
   pull request (block placement before a heading, the root file in the visited set,
   notes in every state, one pairing rule for spans, and the parse-once import scan).
   R14 and lint change with it. The
   release is 0.5.0 for the lockstep family.
7. **Scope of `units()` and `imports()`, set after review rounds 1 to 9.** Each round
   found one more Markdown construct that flattened into a false match or a false import,
   so the contract is now stated and everything else is out of scope by rule.
   - Handled: top-level text at indent 0 to 3; one level of list items in plain shape,
     meaning a marker followed by one space and continuations indented from the content
     column to the content column plus three, with no tab; fences and HTML comments at
     top level, indented into an item, or opening on an item's first line; inline code
     spans and inline comments within a paragraph; the ccx begin and end lines as hard
     boundaries that reset every open construct, except inside an open fence, where they
     are ordinary text, so a fenced example of a block holds no rules (a marker inside an
     open comment closes it, as its `-->` does).
   - A code span is an unescaped backtick run and the next run of the same length; a
     backslash escapes only an opening run, counting backslashes, and is literal inside
     a span. One pairing function serves the comment scan and the import scan.
   - Comments and code spans are masked with a non-whitespace character, so they never
     create an import boundary; a token is cut at the first masked character.
   - Out of scope: block quotes, tables, HTML blocks other than comments, nested
     containers, setext headings, thematic breaks, tab-indented text, and indented code.
   - Indented text is never a rule, since it may belong to a container: a unit matches or
     is removed only when its first line starts at column 0 and its raw lines equal its
     match text.
   - A unit also matches only when the line after it is blank, the end of the text, a
     column-0 heading, a ccx marker, or a column-0 plain item, so an underline, quote, table
     row, lone marker, or HTML right after it makes it odd.
   - File-level gate: `--adopt` removes nothing from a file that, outside the block, has a
     comment mark, a fence line, a quote line, a line with a pipe, or a line starting with `<`;
     it plans as plain `plan` does, names the first such line, and never recommends adopt,
     so the command cannot loop; it recommends decline only when every rule is covered
     (item 4), else apply.
   - Safety direction: a unit outside the scope is marked odd and never matches a rule,
     so `--adopt` never removes it; a line outside it is never scanned for an import, so
     a duplicate there is missed, the recommendation errs toward apply, and the diff shows
     the duplicate. A false negative costs a duplicate line the user can see; a false
     positive would delete the user's text or hide a real import.
   - Left as debatable, so decided conservatively: any tab on a line stops it from being
     scanned, although Claude may scan text after a tab; a pipe anywhere in a unit makes it
     odd, which means a rule that holds a pipe would never match (none ships with one);
     a fence or comment under an item at column 0 with no blank line stays with the item
     but a later dedented line ends it; an unclosed comment hides the rest of its segment.

## Part 18: ccx 0.6.0, the attribution hook, links in drafts, and the retired source, 2026-10-06

Built for issue #35. The hook's facts come from the Claude Code docs, read on 2026-10-06
through the claude-code-guide agent: settings.md, managed-settings.md, settings-reference.md,
and hooks.md under https://code.claude.com/docs/en/. They were not checked against a live
Claude Code, so the hand check in the PR is what confirms them.

1. **A separate module.** The hook runs before every shell call, so it is its own file that
   imports only `node:` built-ins, never `rules.mjs` or the bridge. Cost, 2026-10-06 on
   Windows 11 (AMD64 Family 26 Model 68), Node v26.4.0, 50 runs each, timed one at a time:
   a payload that is not a commit has a median of 53 ms and a slowest of 119 ms; a commit
   with no opt-out set has a median of 52 ms and a slowest of 115 ms. Most of it is Node's
   own start. Its lint budget was 90 lines; the file was 69 lines, 90 after item 10, and
   118 after item 11, which raised the budget to 120 so its fixes fit with lines wrapped.
   Item 10 adds one `git rev-parse` on macOS and Linux, for a commit or PR call only; its
   cost is not measured, since only Windows was at hand.
2. **Settings order and what is not read.** The docs order managed, `--settings`, local
   project, shared project, then user. The hook reads managed (Windows
   `C:\Program Files\ClaudeCode\managed-settings.json`, macOS
   `/Library/Application Support/ClaudeCode/managed-settings.json`, Linux
   `/etc/claude-code/managed-settings.json`), the two project files, and the user file under
   `CLAUDE_CONFIG_DIR` or `~/.claude`. It cannot see the session's `--settings` flag, and it
   does not read registry or MDM policies. `includeCoAuthoredBy` is deprecated but still
   honored, so a commit is also denied when `attribution.commit` is unset everywhere and the
   first file that sets `includeCoAuthoredBy` sets it false. The agent's summary said "false
   (or omitting it)" removes the trailer; only an explicit false counts here, since the
   default adds the trailer. A managed file on the machine that runs the tests would override
   their settings; none is isolated. Item 10 adds the managed drop-ins and the local file at
   the repository root.
3. **Deny form.** JSON on stdout with exit 0, `permissionDecision: deny`, and the line in
   `permissionDecisionReason`. The line names the matched text (the Co-Authored-By line or the
   Generated with line), the setting, and the file that set it.
4. **The recognizer and its limits.** It matches `git` or `gh` as a word, any options, then
   the subcommand words, on the command string. Not handled: a message built from a variable,
   a pipe, or a file written earlier in the same command; a `cd` before the commit, which
   moves where a `-F` file is found; a git alias for commit. A commit chained with a search
   for the same text, such as `git commit ... && git log --grep "Co-Authored-By: Claude"`,
   is read as one text and denied. Text that only quotes `git commit`, as in an `echo`, is
   treated as a commit. A call holding both a commit and a PR command is checked as one
   text against whichever of the two settings is off, so a commit-only opt-out can deny a
   PR body in the same call. Any error allows the call.
5. **The tests spawn the module with `process.execPath`**, not the ccx harness, which skips on
   Windows. The module honors `CLAUDE_CONFIG_DIR` and `CLAUDE_PROJECT_DIR`, so no test-only
   override was needed.
6. **v4.5 in the description, not the name.** The issue named the style's name line. The name
   stays `Concise Plain` so a saved `ccx:Concise Plain` selection survives, and the version
   already lives in the description (`docs/architecture.md`, Output style).
7. **The change-size skill is dropped.** It flagged a diff over 800 changed lines (500 for
   complex logic) and suggested stages; that advice is not wanted in these reviews. The
   skill directory and its line in `general-code-review` are deleted, the README, R26, R29,
   and the acceptance item name three companions, and the rename map keeps the row with a
   note. Past run records keep what ran then.
8. **The retired source repository.** No tracked file names it. Living text says this
   repository is the source; past records say "the earlier source repository". R58 stays
   retired, and lint 20 (R69) fails on a new mention.
9. **Version literals in tests.** The lint, release, and rules tests quote the suite version
   and the Writing rule count. The release commit left them at 0.5.0, so they were raised to
   0.6.0 (and the release tests' next version to 0.7.0, the Writing count to 41) in the
   commits that needed them.
10. **Fixes from the 2026-10-07 review.** A review of the PR found four gaps; each was
    checked before the fix.
    - `git --config-env <name>=<var> commit` and `git --attr-source <tree> commit` were not
      read as commits; git accepts both (git 2.55.0). The review's third case, `git -C.
      commit`, is not a fix: git rejects it with `unknown option`, so nothing commits.
    - A `-F` file after `git -C <dir> commit` was read from the call's `cwd`, but git reads
      it from `<dir>`. The test for it placed the file where git would not look. A file named
      after a later `gh` call still resolves against `cwd`.
    - On macOS and Linux, Claude Code keeps `.claude/settings.local.json` at the repository
      root, the main checkout's root in a linked worktree, except outside git, at the home
      directory, or under another owner; it still reads a copy in the starting directory, and
      the root's value wins (settings docs, "Where Claude Code keeps the local file in a git
      repository", read 2026-10-07). The hook now finds the root with `git rev-parse
      --git-common-dir`, and keeps the project directory when that is not `<root>/.git`, as
      in a submodule or a bare repository; the docs do not say what Claude Code does there.
      Windows keeps the file in the project directory, so only the Windows case ran here;
      the macOS and Linux case runs in CI.
    - Managed settings also merge `managed-settings.d/*.json` after `managed-settings.json`,
      in name order, a later value replacing an earlier one (managed settings docs, read
      2026-10-07). The hook reads them last name first. The managed directory is a fixed
      system path, so its test loads `tests/ccx/fixtures/managed-dir.mjs`, a preload that
      redirects reads under that path to a temp directory; the hook itself has no test seam.
    - Left as a limit: after a session moves into a worktree mid-session, `CLAUDE_PROJECT_DIR`
      keeps the starting directory, while Claude Code reads the shared settings from the new
      one. The review's first point, a very long settings path in the denial, needs a path of
      thousands of characters and is not bounded.
11. **Fixes from the second 2026-10-07 review.** A second review found five more ways past
    the hook, each reproduced before the fix:
    - In a Bash call on Windows, `-F /c/...` (or any `/<letter>/`) and `-F /tmp/...` name
      files Git Bash reads at `C:/...` and in the temp directory, but the hook read them as
      Windows paths and found nothing. A message file under `/tmp` is a likely way for
      Claude to commit, so this was the most important. The hook now reads them as Git
      Bash does, and reads an unquoted leading `~` as the home directory in any Bash call.
    - `& "git.exe" commit` in PowerShell was not a commit: a quote before the name was
      accepted only before a path.
    - Item 10's `-C` scan read the option text as a string, so `-c "core.editor=code -C x"`
      moved the directory; it now reads `-C` only as a whole argument.
    - Item 10 used the first commit's directory for every file, so a second commit with its
      own `-C` read its file from the wrong place; each file now belongs to the nearest commit
      or `gh` call before it.
    - `Co-Authored-By: Claude` with no email was allowed when an option followed the quoted
      message, which R68 says is denied. The name may now end at a closing quote that ends
      the argument.
    - Not changed: the denial's path length (item 10) and a request to split the PR by the
      change-size skill, which item 7 drops.
    - The line budget went from 90 to 120 (item 1).
    - After this round, a further shell form the recognizer misses goes to an issue and does
      not block the release: the hook fails open, and 0.5.0 had no check at all.

## Part 19: cca 0.10.0 and ccx 0.6.0, fixes from the Windows audit run, 2026-10-06

Found in a 2026-10-06 audit run on Windows 11 with Git Bash (issue #36), planned and built
in one pull request.

1. **A background fetch asks; it does not warn.** The check stays strict: a moved
   remote-tracking ref with no approved fetch still ends the run `blocked`, unless the
   user says a background fetch explains it. Reason: any other change still blocks at once,
   an agent's unapproved fetch is still caught unless the user vouches for that exact change,
   and a run left with an editor's auto-fetch on is not lost. A warning alone stays strict
   but loses the run. The answer is recorded as a `background-fetch` entry per ref with its
   old and new commits, so a later check passes on it and a further move asks again. The
   start summary tells the user to pause auto-fetch. The ask and no paths are orchestrator
   prose with no script behind them, so they are hand checks (`docs/acceptance.md`).
2. **Stage 6 needs ccx 0.6.0; there is no retyping fallback.** The defect is the retyping,
   so keeping it for an older ccx would keep the defect. An older ccx swaps to
   `cca:adversary`, a supported mode. R63 is amended, R70 and R71 added.
3. **One file per answer, and a 24-hour cleanup.** ccx saves `output-<id>.txt`, where `<id>`
   is a UUID ccx makes for each call, so two calls never share a file. The request id the
   caller passes is the Claude session id, the same for every call in a session, so a
   name built on it let a second call overwrite the first answer; a review of the branch
   found that before release. cca deletes its source after the copy, and ccx removes `output-*.txt` and
   `output-*.txt.tmp` older than a day when a run starts, for a caller that never deletes
   its file. The cleanup is not a size bound. A refused call writes nothing. The bridge
   line budget rises from 710 to 740.
4. **The scratch folder.** `<run dir>/tmp/agents/<stage>-<scope>[-<n>]/`, one level below
   the orchestrator's own `tmp/`, unique per launch, created by the orchestrator and named
   in the agent's prompt. It lies outside what the ledger reads (`pass1`, `pass2`,
   `live/carried`, `codex`), outside the ignored-file list of `readonly.sh`, and resume moves
   `tmp/` away whole. Stage 2 removes `<run dir>/tmp/` before it launches, so it never removes
   an agent folder. Steps that list or glob the run directory: none found. The merger has no
   Bash and gets no folder. `sed -i` and any in-place edit are barred for agents.
5. **Build output is grouped by logged run.** The rule stays: the same repo and a logged
   `runs:` entry. Ignored changes under `bin/` or `obj/` of such a repo since the last check
   become one record under that run, listing every path, with no question. Accepting any
   `bin/` or `obj/` change whenever a `dotnet` run is logged was rejected: it would loosen
   the check.
6. **The message rewrite kept the parsed lines.** Unchanged: every script's printed format,
   including `blocked <kind>`, `readonly:`, `working-tree: refused:`, and `work-items:`
   lines; the verdict values; the terminal states; the `revision:` line; the three
   `plugin_version` lines; and ccx's `status:` line, still last. The args block the commands
   pass to the skill keeps every flag; only what the user is shown changed. Plain wording
   goes around the stop lines, never in place of them.

## Part 20: cca 0.10.1 and ccx 0.6.1, the CI flakes, two drifts, and the generality audit, 2026-10-08

Issues #40, #41, and #44, planned with two Codex critique rounds and built in one pull
request, with the issue 44 rewrites as one commit per plugin so they read apart.

1. **The object count is git's.** `tests/cca/working-tree.sh` counted every regular
   file under `.git/objects` outside `pack/` and `info/`. A probe with `GIT_TRACE2_EVENT`
   on git 2.54 showed every `git commit` spawning `git maintenance run --auto --detach`,
   which holds `.git/objects/maintenance.lock` for about a millisecond after the commit
   has returned; a watcher saw the lock 75 times across 60 two-commit repos. Both CI
   failures were the first count after `add_sub`, which ends in a commit, and both
   later counts disagreed with that one count, which fits a lock counted once. The
   flake itself did not reproduce in 1,200 tries, idle and under load, so the cause is
   probable, not verified. The count is now `git count-objects -v`, chosen over a
   `find` of the fan-out directories because git writes `tmp_obj_*` files there too,
   and a failed count fails the run rather than reading as zero. Case 21 keeps both
   controls. Setting `maintenance.auto=false` in the test's git wrapper would remove the
   process; not done, since the count fix is sufficient and the wrapper is not the only
   git call in the suite.
2. **Bash's `child setpgid` line is dropped, and a job's group is checked.** The line
   is bash's own, printed by the forked child under `set -m` when its own `setpgid` call
   fails. A loop of job starts on this Mac (bash 3.2.57) printed it about once in 2,000
   starts, 8 times in 20,000 with a live job, and every time the job's group id was its
   pid, so the parent's call had placed it; why the child's call fails is unverified.
   `set -m` stays: there is no portable replacement (no `setsid` on macOS, no perl
   guarantee). Each job now starts inside a brace group whose fd 2 is a per-job file, so
   only the fork-time lines land there and the job's own redirections are untouched;
   `forkdone` drops that one line by its text without the localized strerror part,
   forwards anything else, and fails the start with exit 2 when `kill -0 -<pid>` fails
   while `kill -0 <pid>` succeeds, since the deadline's group kill would miss such a job.
   `ps -o pgid=` was rejected because MSYS2's `ps` has no `-o`. The two-way readiness
   handshake the Codex critique proposed was not built: the group check runs before the
   job's own first step can matter for the deadline, and the isolation failure it
   guards was never observed; it is the next step if a run ever prints the exit 2 line.
   Cases 18a and 18b cover the filter and the check; the race cannot be forced. The
   first CI run then failed Ubuntu's mawk step with `date: write error: Broken pipe`:
   the fork check delays the watchdog's start past a fast job's end, so the kill that
   ends the watchdog lands on its first `date` child, and the runner's step shell runs
   with SIGPIPE ignored, so `date` reports the broken pipe instead of dying silently.
   Reproduced in an Ubuntu container with SIGPIPE ignored (3 of 3 runs failed on the
   new script, main's passed) and fixed by timing the watchdog with bash's `SECONDS`,
   which forks nothing (3 of 3 passed). The second CI run then lost a run's work
   directory mid-run on Ubuntu, after `wait_for: No record of process` from bash: six
   suites in parallel in the same container reproduced it in 10 of 12 runs with the
   helper's `sed` and `rm` children, in 0 of 12 on main, and in 0 of 18 with the helper
   written in builtins only and the capture file removed later. So a child forked right
   after the job's start under toggled job control loses its record in bash 5.2; why
   bash then runs the exit trap is not traced. The helper now forks nothing before its
   check. An adversarial review on 2026-10-08 found one condition, deferred: on macOS,
   `kill -0 -<pgid>` fails for a group whose only member is a zombie, while
   `kill -0 <pid>` still succeeds until bash reaps it, so a job that exits before the
   check would be rejected as misgrouped (exit 2, `cannot start a job in its own process
   group`). An isolated empty job `{ ( : ) & }` tripped it in 23 of 300 starts on macOS
   bash 3.2.57 and in 0 of 300 on Linux bash 5.2.21, where a zombie stays in its group.
   Through the real script, 150 runs (300 job starts) under 14 CPU hogs and 18 suite
   runs, 6 in parallel, on macOS showed 0, because the job does `cd`, a command
   substitution, and exports before it can exit. Windows is untested. A fix needs a
   child-side handshake or a fork-free recheck; a rejection seen in practice reopens it.
   The same review found that a failed open of the fork capture file left `bg` with no
   terminal state (`$!` unset under `set -u`); the capture file is now created before
   the start, before `.err`, so a failure leaves `wait` reporting no run started. The
   guard uses `true`, not `:`: Git Bash runs the script as bash 5.2 in POSIX mode, where
   a redirection error on a special builtin exits the shell with status 1 before `die`
   runs, which the Windows CI run of case 18c showed and `bash --posix` reproduced.
3. **The speed guard times batches and allows ten.** The old guard took the best of three
   single runs of a few milliseconds per side, so noise was a large share; in-process
   reruns reached 6.6 and 7.3 against the limit of 8, and the three CI failures came
   with no related change. Sustained contention or a GC pause landing on all three
   large runs is the likely shape; unverified. Each side is now its best of five
   batches after warm-up, the small count doubled toward 50 ms and capped at 256
   iterations, sizes alternated, numbers printed on failure. The limit of 10 sits between
   the measured real ratios (3.9 to 4.6, 5.3 with every core busy) and the quadratic
   mutations of each guarded path (12.4 to 19.3), which `git log -S` and a per-path
   mutation identified. Linux and Windows figures come from the PR's CI runs; a failure
   there reopens 10.
4. **Two cca drifts are met with tighter text, not a script.** The fetch question is a
   pre-send checklist, with the auto-fetch sentence kept when the repository has no
   remote and no recommended answer; the run directory step states the doubled `cca`
   example and compares the resolved parent with the resolved `<scratch>/cca` as whole
   paths, since a check that the parent is merely named `cca` accepts the defective path
   from the issue. A script that refuses a run directory outside `<scratch>/cca/` is
   deferred until an acceptance run shows the tightened step is not enough. Both are
   hand checks, in acceptance items 22 and 24, with one scratch path that ends in `cca`
   and one that does not.
5. **The generality audit, and what it kept.** Four read-only auditors read every
   shipped prose file and the design docs, starting from this file and the requirements
   to trace which rules came from one machine or one run. 85 entries: 24 rewrites
   proposed, of which 19 landed; 14 behavior changes deferred by the auditors and 4
   more after review; 45 kept with a reason, and one rewrite downgraded to keep. Every
   rewrite passed a semantic gate: it keeps each obligation, permission, stop
   condition, default, and limit; a rewrite that turns a must into a may or moves
   a number is a behavior change and is deferred. Two landed rewrites are agreed
   exceptions, both in `general-code-review`: `xhigh` became "the highest reasoning
   effort available", a different choice where an effort above `xhigh` exists, and
   "GitHub" became "the hosting platform", a wider prohibition on posting comments. They
   were accepted because a fixed effort name may not exist on every model and the
   prohibition should hold on any forge; R26 records them. Kept with a reason, the
   specifics a reader may flag: the Bash tool's 10-minute foreground cap and the
   540-second and 72-minute figures derived from it; the lock timings, verified on three
   shells and two filesystems (Part 15 item 4); the design budgets (450,000 bytes, 60 ids,
   3,000 words, the tier thresholds, 1 GB, 300 s), which are bounded-cost defaults with
   overrides; the tool and plugin version floors, each named with its feature; the
   Windows-only no-retry rule for a failed implementer, an OS fact; the line-ending rule,
   derived from git's own attributes; the skip-worktree mode, an ordinary git state; the
   run budgets and the round and file caps, design limits with overrides; the credential
   shapes, generic; the install hints and platform caveats, each with its platform named;
   the `rmdir` workaround, hedged in its sentence; and the house rules, output style, and
   chat block, which are the author's stated preferences shipped as an opt-in style.
   Deferred as behavior changes, for separate changes: the vendor link forms in the output
   style and chat block; "PowerShell 7" in the installed Windows rule; the sandbox probe's
   120-second limit; the token thresholds and the integration-test obligation in the
   upstream review skills (R26); the check discovery list, the branch naming rule, and the
   403 wording in the loop; the `bin/` and `obj/` grouping (Part 19 item 5), the
   tests-account check, the handoff schema's ticket-system fields, the Codex model id
   written ten times, the model-name ladder, and the 540-second cap in cca; the "one user"
   premise behind Parts 14 and 16; and the "0.4.0 or earlier" compatibility clauses, whose
   vaguer rewrite was rejected. The five rewrites rejected after review: the `.scratch/`
   example in the ccx README (already hedged) and the four above that moved an obligation
   or a number.
6. **One PR, with "Refs #44".** Issue 44 asks for separate PRs per plugin or theme, and
   the Codex critique recommended that split; the request for this work was one PR for
   the three issues, so the rewrites ride here as one commit per plugin. The issue
   stays open until the deferred list is decided.

## Part 21: the Windows CI job, the sh suites run concurrently, 2026-10-09

Issue 48, planned with two Codex critique rounds and built as two separate experiments
on branch `ci/windows-sh-suites`, so each one's numbers read apart. Every figure below
comes from CI's TAP output, pairing each `ok` line with its `duration_ms`; the step time
is the `npm test` step's elapsed time from the job API.

1. **The baseline.** Run 37888044599 (main at bd3b561): the `npm test` step took 906 s
   on Windows, 110 s on Ubuntu, 210 s on macOS. Windows leaf durations: readonly.sh
   242 s (12 s on Ubuntu), revert-tests.sh 191 s (75 s), working-tree.sh 128 s (6 s),
   live.sh 65 s, ledger.sh 61 s, the ground-truth fixture 55 s and 48 s, handoff.sh and
   work-items.sh 18 s each. The 494 leaf subtests sum to 1153 s on Windows, 237 s on
   Ubuntu, 370 s on macOS. Windows passed 383 and skipped 111 (the ccx spawn tests skip
   there); Ubuntu and macOS passed 482 and skipped 12. The Windows runner has 4 cores.
2. **The cause.** `sh.test.mjs` ran its 17 tests one after another with `spawnSync`.
   The fork-heavy suites are 15 to 23 times slower on Windows (MSYS2 process creation),
   while revert-tests.sh is only 2.5 times slower because its cost is fixed contract
   waits. So the file's time was the sum of its suites, with most of the sum in three.
3. **Change 1: run the suites concurrently** (`test(cca): run the sh suites
   concurrently`). One `describe` with concurrency `availableParallelism() - 1`, each
   suite through an async spawn that settles on `close` with both streams drained and
   stdin ignored, the slowest suites registered first. Nothing under `plugins/`
   changed, and the file name stays because five documents name it. Locally, `npm test`
   on a 10-core Mac went from 145 s to 77 s over three runs, and 68 s on Linux Node 22
   in Docker, all passing.
4. **Experiment 1 on CI.** Run 37892760276: Windows step 412 s (job 7 min 10 s against
   15 min 28 s), Ubuntu 74 s, macOS 137 s. Windows leaves: readonly.sh 342 s,
   revert-tests.sh 276 s, working-tree.sh 178 s; leaf sum 1498 s. The pass and skip
   counts matched the baseline on every runner.
5. **Experiment 2, a Defender exclusion step, dropped.** Runs 37893465314 and
   37894288406. The step set exclusions for the workspace, `RUNNER_TEMP`, and `TEMP`
   and verified them. Git Bash's `mktemp` and Node's `tmpdir` both resolve under
   `C:\Users\runneradmin\AppData\Local\Temp`, and `TEMP` arrives in 8.3 form
   (`RUNNER~1`), so the second run excluded the long-name paths too.
   `(Get-MpComputerStatus).RealTimeProtectionEnabled` printed False: real-time
   protection is already off on `windows-latest`, so an exclusion cannot change the
   cost. The Windows step took 473 s with the step (short-name paths) and 299 s (long
   names), against 412 s without: the runner's own variance, not the step. `ci.yml` is
   back to what main has.
6. **The final configuration.** Commit 37b5b3f, the concurrent suites with the header
   wording from the review. Consecutive runs of the same commit: run 37895131595, 462 s
   on Windows (readonly.sh 394 s, revert-tests.sh 271 s, working-tree.sh 208 s), Ubuntu
   77 s, macOS 124 s; run 2: 436 s (readonly.sh 374 s), Ubuntu 76 s, macOS 175 s; run 3:
   439 s (readonly.sh 389 s), Ubuntu 76 s, macOS 142 s. The plan's rule was the step
   under 420 s in three consecutive runs, and it was not met: over the six Windows runs
   with the concurrent suites the step took 412, 473, 299, 462, 436, and 439 s, under
   420 s in two. The job as a whole went from about 15.5 minutes to 7.5.
7. **What the numbers say.** The Windows step is bounded by readonly.sh under
   contention. The leaf sum on Windows rose from 1153 s to about 1500 to 1700 s under
   concurrency while the step fell from 906 s to 299 to 473 s. That is the shape of a
   shared bottleneck in process creation: more concurrency cannot help, and any further
   gain would come from the suites forking less.
8. **Fallbacks considered and not taken.** Inner concurrency 2: the heavy suites alone
   bound the step at about 413 s. Outer `--test-concurrency=1`: adds the other files'
   time. Shorter contract windows: helps every runner equally, and the remaining waits
   are the contract. A `paths` filter on the Windows job: trades coverage, and the last
   two revert-tests.sh fixes needed the Windows run.
9. **Review.** Two Codex gpt-6-astra rounds on the plan (the async contract, separate
   experiments, the Defender step's guard and diagnostics, the 420 s rule), then a final
   review of the diff: no blocking finding, and the header wording that became 37b5b3f.

## Part 22: ccx 0.6.2 and cca 0.10.2, act and live follow-up, the loop's inputs and not-run checks, and the CodeQL alerts, 2026-10-09

Issues #46 and #47, planned with three Codex gpt-6-astra critique rounds and built in
one pull request, with the four open CodeQL alerts on `main`. Each issue sorts its items
into wording, a clarification of what the text already requires, and behavior, a new
obligation; the behavior items are the decisions below, written before the text changed.
Every rewrite passed the semantic gate of Part 20 item 5: each obligation, permission,
stop condition, default, and limit kept, no must turned into a may, no number moved.

1. **The loop's commands preview the derived run id and branch, and hint when a
   description is only numbers.** A description made of ticket numbers and joining words
   (`12345 and 67890`) became the run id and the `work/<slug>` branch of one run on a
   non-GitHub host, and the branch needed a rename before publishing. `run.md` and
   `plan.md` step 3 now print, after the invocation block and outside it, the run id
   the skill's Artifacts rule derives (with the suffix rule stated, since the command
   cannot list `.ccx/`) and the branch: the `--branch` value, the `--continue` branch,
   `work/<slug>` with no issue, or, with issues, the rule of Step 3.7 item 2 and not a
   name, because the command fetches no label or title and `fix/` turns on any issue's
   label; in plan-only mode the line says `none` and what a run would use, since Step 3.6
   creates no branch. When every token of a non-empty description is a number (digits, optional `#`,
   optional trailing `,` or `;`) or one of the joining words `and`, `or`, `plus`,
   `with`, `then`, `also`, `to`, `&`, `+`, `,`, `;`, `/`, and at least one is a number,
   one hint line names the file-input path and `--branch`; the run goes on. The lines sit
   outside the block so the Skill args, Step 0.5's record, and acceptance item 7 are
   unchanged. `12345,67890` is one token and gets no hint; the hint is for the plain
   case reported. No incident is recorded beyond the one run. The acceptance runs
   (item 25, Windows and macOS, 2026-10-09) showed the command's reply text absent in
   every headless session and in an interactive one, with the values right in the
   model's reasoning and in the skill's report: the model goes from the preflight tool
   calls straight to the Skill call, and three wordings of the requirement, the last
   stating the reply's shape, changed nothing; an echo at the start of the skill's Step
   0 was skipped the same way. So the report header is the carrier that holds in every
   run: `Run id` keeps its `would have been` form, a `Hint:` line appears when the
   description is only numbers, and `Branch` names what a run would use; the reply text
   stays required in the command and the skill, and item 25 checks the report and
   accepts the reply text when it appears.
2. **A not-run check carries its command, and a denial is a refusal of permission.**
   Carve-out 3 ends a run in `blocked` on any denial in Steps 0 to 6, and Step 6.2 named
   checks that "cannot run locally" without defining locally; one run was denied a remote
   database and ended `prepared`, a drift not reproduced here and not judged. The text
   now says what a denial is: a tool call the permission mode or the user refused, or an
   answer that is not a clear yes to a question asking permission for an action; the
   questions of Steps 0.1a, 0.2, 1.2, and 3.5 keep their named outcomes, since they are
   decisions, not permissions. A check whose resource the session does not have, with no
   permission refused, is not a denial: it is reported as not run with the reason and the
   exact command, with its directory when not the checkout root, so the user can run it.
   The report's "Checks not run" line requires the command. An optional-check exception
   to carve-out 3 stays deferred, as the issue says: the carve-out is unconditional on
   purpose.
3. **The audit's closing recommends items and prints the next commands, and the report
   carries the same list.** The audit ended with a verdict, a path, and a state, and the
   user worked out the next command and its ids. Stage 8 step 14 now prints `act first`
   with the ids and one reason each, the exact `/cca:act <run-id> <ids>` line, `your
   decision` for what needs the user, and, only when eligible, the `/cca:resume <run-id>
   --live <file>` line with what the file holds; the report's section 1 carries the same
   list under a plain `next:` line, with no heading and no line that `work-items.sh`,
   `memory.sh`, or `live.sh` parses, so the counting rules and validators are untouched.
   An item is recommended when it is counted, `agreed`, at `medium` or above (the floor
   stage 8 step 5 uses for `merge after fixes`), and fixable inside the bundle's repos;
   a `low` or `note` item is not dismissed by being left out, and the closing says so.
   Only `C<n>` ids appear in the act line: decision and scope entries carry no id and
   work-item operations are not act arguments. `your decision` lists contested and
   provisional items, items whose fix is outside the bundle, and from section 8 only what
   is open and needs the user's authority: `needs <owner>` and `stale deferral` decision
   claims, every scope claim with its `include` or `defer` recommendation (a
   recommendation is not the user's acceptance), and the other decisions the change needs
   and has not made. The `--live` line prints only when a check still has `status` `not
   run: not approved` and no stage before 6 needs a rerun by resume's preliminary rule
   (every stage 1 to 5 entry `complete` or `not_applicable` with its outputs present),
   because resume refuses `--live` otherwise; a result already imported and under review
   gets plain resume instead. The run's entry in `runs.json` is not a condition of any
   line, so the report's block and the closing hold the same list; when the entry is
   absent at the close, the missing-entry exception still prints the JSON entry and says
   the act and `--live` lines need it added first. Codex's critique caught three first
   drafts: a `partial` test that excluded runs with inapplicable stages 2 and 3, a `your
   decision` list that named every section 8 entry, settled ones included, and a closing
   whose `--live` line depended on the registry while the report's did not.
4. **Act says what it leaves behind, and resume's refusal shows the shas.** Act writes
   `act/log.md` and leaves the audit state as it was, which one user read as nothing
   recorded; and when a bundle's branch resolves to the local branch act commits on,
   act's own commit moves the head, so a later `--live` import is refused by the guard in
   `resume.md` step 3. By reading, not reproduced. Act now closes, on every end, with the
   `runs.json` state unchanged, the log's path, and one of four live lines: none
   outstanding; results needed, with resume's eligibility conditions stated (recorded
   head and base still resolve, no stage before 6 to rerun) and, when this invocation
   committed, that the head moved and resume without `--live` re-audits; results
   imported and awaiting review, which plain resume reconciles while no stage before 6
   needs a rerun, and which an approved restart after a head or base change retires; or
   not checked, when act stopped before reading the report. Act resolves no ref, which
   is why it states the condition and names resume as the check; prior invocations are
   covered by the condition. Step 1.3's confirmation warns before the first commit when
   live checks are open, the bundle is not a GitHub PR, and the brief's Read paths map
   the bundle's branch to no remote ref, so its recorded head is the local branch act
   commits on; for a PR, whose recorded head is its `headRefOid`, or with a mapping, the
   commit does not move it and a push that updates that ref does.
   The `--live` refusal in resume prints,
   per changed bundle, the recorded and current head and base shas with the moved one
   marked; the refusal and the no-import outcome are unchanged.
5. **Instruction files decide where a documented fact goes.** An auditor recommended
   recording a rationale in a file header, and act did so, in a repository whose
   instructions keep history in commit messages. `common.md` now requires the author of a
   recommended change that adds or moves a documented fact to read the instruction files
   that apply to the file, the repository's `AGENTS.md`, `CLAUDE.md`, and what they
   index, at the root and along the file's path with nested files applying to their
   subtree, as the exported tree holds them, plus the placement rules the audit brief
   records from the user's own instruction files; when they give the fact a home, the
   recommendation names it. Stage 1 reads the user's files in `$CLAUDE_CONFIG_DIR` (else
   `~/.claude`) and writes a "Placement rules" section in `audit-brief.md`, a snapshot at
   audit time like the exported trees: the brief is a stage 1 output, hashed as an input
   by the later stages, and resume does not re-read the user's files, so a later edit to
   them changes nothing in a resumed run; `/cca:resume <run-id> --from 1` reads them
   again. Recording the files as stage 1 inputs by hash was rejected because any edit to a
   personal instruction file would rerun the whole audit, and hashing only the extracted
   rules would make resume depend on a judgment that is not byte-stable. Act re-reads the
   live files, the user's included, before its first edit, and stops to show the home
   they name when an approved change places a fact where they exclude it. Auditors read
   only the brief and the exported trees and run nothing there.
6. **The house-rules scanner closes a comment at `--!>` too, and no alert is
   dismissed.** CodeQL alert 2 (`js/bad-tag-filter`) on `rules.mjs`: the HTML spec ends
   a comment at `--!>` as well as `-->`; CommonMark ends it at `-->` only. The files the
   scanner reads are instruction files that models read as text, and the masking is a
   heuristic for which marks count as rules or import paths, so the scanner now accepts
   both closers and agrees with the spec CodeQL checks. The consequence is accepted and
   recorded: in a file holding `--!>` inside a comment, the rules and imports after it
   are now visible to the scan, which can change an adoption result; the plugin's own
   markers are unchanged. The close branch tests the mark's text explicitly, because the
   backtick marks the same scan sorts carry no text property and a length or suffix test
   on them throws, which Codex reproduced in memory on the first draft. Alert 1
   (`js/identity-replacement`, the `/^$/` replace on non-item units) is a refactor with
   the same result; alert 3 (`js/incomplete-sanitization`, the changelog heading regex
   in `tools/lint.mjs`) gets an escape helper, also applied to the manifest-name regex
   two rules above, which was the same defect unflagged; alert 4
   (`js/bad-code-sanitization`, the fake Codex fixture) reads the path from the inherited
   environment inside the child script, with a positive control added since the existing
   test proved only the file's absence after a kill. Nothing is dismissed through the
   API; the alerts close when CodeQL scans the merge. CodeQL's closure is not verified
   from here.
7. **Deferred, as the issues say.** From #47: an optional-check exception to the denial
   rule (carve-out 3 is unconditional on purpose) and a route to apply a small correction
   found at the Step 5 cap (a bounded post-cap review is a design decision first). From
   #46: cross-run memory of what the user acted on (`C<n>` ids renumber between runs; an
   identity design comes first), a forge length cap on drafted descriptions (adapter
   knowledge the plugin lacks), and a mandatory per-run concision item (it conflicts with
   evidence-led reporting when no defect exists). Each is open for its own issue.
8. **Review.** Three Codex gpt-6-astra rounds on the plan: round 1 raised twelve findings
   (the tick-mark TypeError, the description scan, the `fix/` rule and step number, the
   denial definition, `--live` eligibility, act's ref promises, settled decisions, user
   instructions at recommendation time, CI's lint-before-tests order, the release-test
   destinations, acceptance coverage with a positive control, and authorization) and two
   corrections; round 2 five more on the same themes; round 3 converged with the snapshot
   resolution of item 5 accepted. The final review of the diff against `main` found no
   actionable regression; a conformance pass on the same thread found four text
   mismatches, each fixed: the plan-only branch preview named a branch, the closing's
   `--live` line depended on the registry entry while the report's did not, act's step
   1.3 warning had lost its local-ref condition, and act's reconcile promise was
   unconditional.

## Part 23: ccx-loop 0.7.0 and cca 0.11.0, the token survey, cheaper roles, the split skill, and three tiers, 2026-10-09

Issue #54, planned with three Codex gpt-6-astra critique rounds and built in one pull
request. The survey of item 1 was run and recorded here before any other change was
committed, so each change can show its saving against it. Every rewrite passed the
semantic gate of Part 20 item 5.

1. **The survey, before the changes.** Run on 2026-10-09 on Windows 11, Claude Code
   2.1.296, codex-cli 0.162.1, from a scratch profile whose plugins were installed from a
   frozen clone of `main` at 64ceec0, headless (`claude -p --output-format stream-json
   --verbose --permission-mode auto --model opus`), one run per shape, Codex from the
   author's own login. The account's seven-day window stood at 100 percent with overage
   in use, so every run below was billed as overage; that is why each shape ran once.
   Measurement: each `assistant` event of the stream carries `usage`, and the
   subagents' events carry `parent_tool_use_id`, so the orchestrator's context per turn
   is `input + cache_read + cache_creation` of its own events, exact; a subagent's
   context is the same sum over its events, exact; output is exact per model from the
   result event's `modelUsage` and is not separable per agent when several agents share
   a model (the per-event `output_tokens` is a streaming snapshot and undercounts); the
   Agent tool's task notification gives a per-agent total whose scope is undocumented,
   recorded as "task total". Codex figures come from the rollout files under
   `~/.codex/sessions/`, whose `usage` lines are per API call and whose
   `total_token_usage` lines are cumulative; a `ccx:review` call writes its usage in a
   child rollout whose `session_id` is the thread, not in the thread's own file.

   | Shape | Turns | Orchestrator context: first, at skill load, median, last, sum | Output, exact per model | Subagents and Codex calls | Cost |
   |---|---|---|---|---|---|
   | S1 loop run, `--effort low --no-publish`, Codex on, three-file fixture, ends `prepared` | 21 | 29,276; 67,596 (turn 3); 82,810; 98,244; 1,660,629 | opus 13,252 | Codex: plan review `gpt-6-astra` 34,848 in, 161 out, 2 calls; implement `gpt-6.1-sol` 74,158 in, 639 out, 4 calls; diff review `gpt-6-astra` 44,964 in, 315 out, 4 calls; 155,085 total | $1.04 Claude |
   | S2 loop plan-only, `--no-codex --effort low`, ends `plan-only` | 16 | 29,307; 67,591 (turn 3); 75,117; 94,238; 1,175,278 | opus 12,068; fable 1,482 | plan reviewer, fable fallback: 3 turns, 74,906 context, task total not recorded | $1.44 |
   | S3 cca audit of the `full` fixture, `--effort low`, Codex on, ends `reported`, 19 items | 89 | 27,787; 45,124 (turn 4, `SKILL.md`), 86,034 (turn 5, stage 1); 172,460; 289,759; 15,147,952 | opus 193,089 (orchestrator and seven agents); sonnet 7,343 | digester opus x3: 1,486,942 / 151,344; 1,058,601 / 144,364; 1,135,191 / 147,249 (context sum / task total); mapper opus 306,332 / 49,335; auditor opus 755,031 / 80,663 and top-up 504,578 / 97,939; adversary opus 804,057 / 104,894; merger sonnet 106,291 / 53,462; Codex second opinion `gpt-6.1-sol` 334,656 in, 3,955 out, 8 calls | $13.20 (opus $12.99) |

   Opus input in S3 was 21,198,324 tokens (20,188,859 cache reads, 1,009,465 cache
   writes, 360 uncached), of which the orchestrator's own turns were 15,147,952 and the
   seven Opus agents 6,050,372. The loop fixtures and change were acceptance items 7
   and 8's; S1 ended with `npm test` passing on the uncommitted change and S2 with the
   plan written. S3's report held the `full` fixture's expected outcomes (the `MUST`
   rule as C8 citing the pinned sha, the drift as C1 from the export, the skipped test
   as C2, the export break as C6) and left no repository changed; its two expected
   `contested` outcomes came out `agreed`, which is a review outcome, not a token one.
2. **What the survey says.** The orchestrators are the top consumers, and their
   instruction text is the part that every turn pays for again. In the loop, the skill
   load adds about 36,000 tokens of context at turn 3 (turn 2 to turn 3 in both S1 and
   S2), and that context is re-read on each of the 13 to 18 turns that follow, so the
   instructions are roughly 0.5 to 0.65 million of the 1.2 to 1.7 million tokens a run
   reads; the rest is the run's own artifacts and tool output. In cca, the
   orchestrator's 89 turns are 71 percent of all Opus input: `SKILL.md` adds about
   17,000 tokens at turn 4 and stage 1's file about 41,000 at turn 5, and every stage
   file read later stays in the context, so the context reaches 290,000 tokens by stage
   8 and the orchestrator alone reads 15.1 million tokens. The three digesters are the
   second consumer, 3.7 million tokens or 17 percent of Opus input, for work that is
   reading and extraction; the auditors and adversary together are 2.1 million, 10
   percent, and are judgment; the mapper is 1.4 percent and the Sonnet merger is
   under 1 percent of cost. Codex is billed apart from the Claude subscription, and its
   figures (155,085 tokens for the loop run, 338,611 for the audit's second opinion)
   are small next to the Claude side in any case. So the order of the changes below
   follows the survey: cut the orchestrators' instruction text first (items 3 and 7),
   move the digesters off Opus (item 6), and leave the judging roles where they are.
3. **The loop's skill is a core and four step files, read when the step starts.**
   `SKILL.md` held 16,699 words that every turn re-read. It is now a core of 5,173
   words at the split and 5,329 at release, after items 5 and 10 (invocation block,
   tools, approval scope, budgets, terminal states, supporting files, the shared
   mechanics, and Final report handling) and `steps/0-preflight.md` (Codex
   availability and Step 0, read at Step 0), `steps/1-plan.md` (the Reviewer contract,
   Steps 1 to 3, and 3.6, read at Step 1), `steps/4-build.md` (the Codex implementer
   call snapshots of carve-out 6, the Claude review contract, the Implementer prompt,
   and Steps 3.5 and 3.7 to 6, read when Step 3 ends with a final plan in a run that is
   not plan-only), and `steps/7-publish.md` (Step 7, read at Step 7). The grain is the
   phase, as `tiers.md`, `worktree.md`, and `multi-repo.md` already are: Step 3.5.1 runs
   Step 3.7.1, Step 3.7.3 applies Step 6's discovery, Step 4.5 resolves Step 5's role,
   and Step 5 cites Step 6, so a finer cut would split procedures that cite each other
   in one round. The move commit added no text: a script cut the file by line ranges
   that partition the original and rebuilt the original from the new files byte for
   byte. The string commit added the titles, read-at lines, the pointer in carve-out 6,
   and one rule: a step that cites a section whose file is not yet read reads that
   file then, which authorizes nothing early. The one known early read is Step 3.5.3's
   pull request check as Step 7.2 does, in a `confirm-plan` run that continues a branch
   on GitHub. Lint check 16c holds the core under a word cap and checks that every
   file Supporting files names exists and every step file is named.
   Measured alone, on the plan-only shape of S2 at the split commit, with everything else
   as in the survey: 17 turns; the context was 42,205 at the skill load (turn 4, against
   67,591), 55,284 at the median (against 75,117), 80,508 at the last turn (against
   94,238), and 964,627 in sum (against 1,175,278, 18 percent less); Opus output was
   10,726 and the Opus cost $0.76 against $1.02, 25 percent less; the fallback reviewer
   took 2 turns and 45,931 context against 3 and 74,906. The files the run read were
   `steps/0-preflight.md`, `steps/1-plan.md`, `tiers.md`, and `report.md`, and no step
   file after the plan. The rest of the gap to the issue's target is the run's own
   artifacts and tool output, which the split does not touch.
4. **The loop has three tiers.** `low` is gone: `--effort low` is rejected with a
   pointer to `medium`, as `max` was in Part 12 item 1, so a script that passes it
   learns of the change; the estimate rule's low bucket (one file or one function, a
   clear fix, no trigger) is now the first line of medium; the budgets are 120, 240,
   and 360 minutes. Lint 16b now wants exactly `medium`, `high`, `xhigh` in both
   commands and inspects the three invocation blocks' `effort:` line, which it did not
   before. The reason is the issue's: neither `low` nor `max` was ever used, and three
   tiers are enough for the top layer. Part 12 item 1 called the two-command check
   16c; it was 16b on `main` before this change, and 16c is now item 3's core cap.
5. **The tier is a ceiling; the slice picks the model.** The ladder is medium, high,
   and xhigh; the tier sets the budget and the strongest model a step may use, and
   under it the work picks the model: a step that judges (the plan review, the final
   review, verifying findings) runs on the tier's reviewer; a step that builds runs on
   the tier's implementer, or on Codex `gpt-6-luna` when the small-slice rule holds;
   a step that only reads and reports would run on `haiku`, and today there is none,
   because the orchestrator reads its own diffs. The small-slice rule sends a slice
   to `gpt-6-luna` when its change is one function or one behavior in at most two
   files, none of the Sonnet criteria holds (a risk floor trigger, more than eight
   files, a new module, type, interface, or rule section another file cites), and it
   adds no dependency. Precedence: the risk floor sets the tier; at high and xhigh the
   Sonnet criteria pick `sonnet` for a slice, as before, and medium never uses Sonnet
   by criteria; else the small-slice rule, unless the override turns it off; else the
   tier's implementer. A tier rise at Step 3.5.4 chooses each slice's implementer
   again, as Step 3.5 already said; a rise at Step 4.5 re-resolves the reviewer models
   only, and a slice keeps its effective model through review fixes and CI repair; a
   swap stays a swap; a plan review already made is not repeated, and the report says
   which model reviewed the plan. Medium's cells are plan review `gpt-6.1-sol`,
   implementer `gpt-6.1-sol` or `gpt-6-luna`, Codex final review `gpt-6.1-sol`, and
   Claude `code-review medium` for a higher-risk run; high and xhigh keep
   `gpt-6-astra` for both reviews and add `gpt-6-luna` for a small slice. The
   sentence "`gpt-6.1-sol` is an implementer model only and is never a reviewer"
   became "`gpt-6.1-sol` reviews at medium only; `gpt-6-luna` never reviews", which
   reverses Part 12 item 2 for medium. The issue names the lower tiers' second opinion
   as a candidate to confirm against the survey; the survey measures the Codex side
   small next to the Claude side (S1's three Codex threads were 155,085 tokens against
   1.66 million Claude tokens), so the change is recorded as the issue's proposed
   default with that evidence, and the Codex critique's preference for `gpt-6-astra`
   at medium is answered by the override: `.ccx.json` `models`, keys `plan-review`,
   `implementer`, `final-review` (a full Codex id), `small-slice` (a full Codex id or
   `off`), and `fallback-reviewer` (an Agent tool model name, replacing `fable` as the
   first fallback while `opus` stays the second), applied at every tier in place of
   the cell, a bad value reported and ignored as an unknown field is, and never
   changing the tier, the risk floor, the Sonnet criteria, or the Claude `code-review`
   role; the report names each override in force. A consequence, recorded: a run that
   rises from medium after its plan review keeps the `gpt-6.1-sol` review it had. Not
   routed, by design: the orchestrator's slice review at Step 4.3 runs on the
   session's model, and a cheaper subagent would add a reader whose findings the
   orchestrator must still verify against the diff, so it saves no context.
   `gpt-6-luna` resolves on this account: a probe on 2026-10-09 ran on it, and its
   rollout records the model; the Claude fallback reviewer and the `sonnet`
   implementer fallback are unchanged.
6. **cca's digester reads on `haiku`, its mapper on `sonnet`, and its second opinion
   at low tier is `gpt-6-luna`.** The digester copies cited rules out of a corpus and
   the mapper answers a question list against a code base; neither judges. The survey
   put the three Opus digesters at 3.7 million tokens, 17 percent of the audit's Opus
   input, so they move to `haiku`; the mapper, 1.4 percent, moves to `sonnet` since it
   reads a whole code base and its map steers the auditors; the merger stays `sonnet`
   (under 1 percent of cost, and its merge must keep ids and dispositions exact, which
   `haiku` has not been shown to do); the auditor and adversary stay `opus`, as the
   issue says for the roles where judgment decides. The second opinion defaults by
   tier, `gpt-6-luna` at low and `gpt-6.1-sol` at medium and high. The command cannot
   know the tier, so it writes `codex-model: default` when `--codex-model` is absent,
   and stage 6 step 2 resolves `default` by the run's tier to the full id and records
   that id in `stages.json` as `codex_model`, so a resumed run sees the id; an explicit
   `--codex-model` passes through unchanged. No stage before 6 reads the value as a
   model id. The failure ladder (relaunch on the same model, then `fable`, then the
   scope fails), `--models`, and the manifest `models` key are unchanged, so every
   default stays overridable per run.
7. **The audit-only evidence rules leave `common.md`.** Every agent read `common.md`
   in full, but 2,919 of its 6,762 words (Outward trace, Reverted test runs, Rerun of
   a renamed run-once script) serve only the auditor and the adversary, so the
   digester, mapper, and merger paid for them on every launch. Those sections moved
   verbatim to `audit-evidence.md`, which stage 1 copies into the run directory next
   to `common.md`; the launch rule gives its path to the auditor and the adversary in
   every mode and not to the others; stages 4 to 7 hash it as an input where they hash
   `common.md`; the Codex request lists it as an input, copied with the sentinel and
   acknowledged like `common.md`, because ask 4 requires the Outward trace procedure;
   the second-opinion fallback and the late adversary get its path; resume reads it
   and supersedes it with `common.md`. `common.md` keeps each heading with a pointer.
   Stages 2 and 3 do not hash it, since their agents never read it; a run from an
   earlier version reruns stage 1 on resume by the version gate and gets the file. The
   agent files then lost only words that restate a `common.md` rule they already cite:
   the tree-search and output-file boundaries, the closing lines, the label and
   missing-rationale bullets, the outward-trace and renamed-script restatements, two
   traps, the top-up id restatement; every role-specific restriction stayed (the
   Grep-and-Glob-only-in-an-export rule, the digester's `failed at byte` line, the
   merger's `opened:` heading). `common.md` went from 6,762 to 4,126 words, the agent
   files from 7,311 to 6,502. The side-by-side table that drove this is a scratch
   artifact, not kept.
8. **Deferred.** Five places where two copies of a rule differ were found while
   deduplicating and left as they are, each copy keeping its wording, because choosing
   one changes audit behavior and the issue excludes that: reproduction by quote
   (`common.md`'s Claims list limits a quote to "a fact of the code at the pinned
   sha"; the auditor's step 7 and the adversary's step 9 say "by a run or a quote"
   with no limit); the "not in export" keys (stage 4's hygiene row says a finding, the
   auditor's hygiene checklist says a gap, `report.md` lists them under Forge
   coverage); the digester's pipes (`git show | tail -c | head -c | awk`, which
   `common.md` hard rule 2 allows only for `cat` of an exported file, and the `git -C`
   forms the auditor, adversary, and mapper are given that `common.md` never grants);
   the fetch exception (`common.md` hard rule 2 names an approved fetch, the Read-only
   check in `SKILL.md` also a `background-fetch` entry); and the output-file removal
   (`common.md` hard rule 1 omits "only after the copy exits 0", which `SKILL.md` hard
   rule 2 and stage 6 step 9 state). Also deferred: a `haiku` merger, pending evidence
   that it keeps ids and dispositions exact; and a cheaper reader for the loop's slice
   review, which needs a design that removes the orchestrator's own read first. Each is
   open for its own issue.
9. **After.** Run on 2026-10-09 and 2026-10-10 as item 1 was, from a profile whose
   plugins were installed from a clone of the branch (at 9414f03 for the audit, 42497ae
   for the loop runs, after the review fixes), the loop shapes at `--effort medium` since
   `low` is gone, the audit at `low`; one run per shape, the same fixtures and change.

   | Shape | Turns | Orchestrator context: first, at skill load, median, last, sum | Output, exact per model | Subagents and Codex calls | Cost |
   |---|---|---|---|---|---|
   | S1 loop run, `--effort medium --no-publish`, Codex on, ends `prepared` | 43 | 29,299; 43,458 (turn 3); 75,904; 106,929; 2,587,313 | opus 17,396 | Codex: plan review `gpt-6.1-sol` 35,273 in, 170 out, 2 calls; implement `gpt-6-luna` 108,358 in, 1,188 out, 6 calls; final review `gpt-6.1-sol` 33,672 in, 289 out, 3 calls; 178,950 total | $1.35 Claude |
   | S2 loop plan-only, `--no-codex --effort medium`, ends `plan-only` | 27 | 29,331; 43,487 (turn 4); 58,154; 86,661; 1,348,560 | opus 13,239; fable 1,761 | plan reviewer, fable fallback: 3 turns, 75,733 context | $1.36 (opus $0.92) |
   | S3 cca audit of the `full` fixture, `--effort low`, Codex on, stopped in stage 5 by the account's monthly spend limit | 136 orchestrator events to the stop | 27,786; 45,238 (turn 4), 80,919 (turn 5); 141,503; 195,195 at the last event before the stop; 17,183,567 | opus 146,648; haiku 47,713; sonnet 3,519 | digester haiku x3: 863,393; 890,647; 1,338,308; mapper sonnet 110,391; auditor opus 1,073,658 and top-up 442,399; adversary opus 935,742; map-correction top-up opus 528,912; Codex: none, stage 6 not reached | $8.33 (opus $7.90, haiku $0.31, sonnet $0.11) |

   What it says. The loop's per-turn load fell as item 3 predicted: the skill load adds
   about 12,000 tokens of context at turn 3 instead of 36,000, and S2's median turn is
   58,000 against 75,000. The sums did not fall, because each run took more turns than
   its before run (43 against 21, 27 against 16): the orchestrator split its shell work
   into more and smaller commands, which the text does not control and one run per shape
   cannot separate from the change, so the per-turn figure is the measure of this
   change, and it is lower in every column but S1's last turn, which carried a longer
   run's artifacts. Codex use rose with `gpt-6-luna` as the implementer (6 calls and
   108,358 tokens in, against 4 and 74,158 on `gpt-6.1-sol`), still small beside the
   Claude side. In the audit, the three digesters on `haiku` cost $0.31 together,
   against about $2.20 at the before run's Opus rate for the same 3.7 million tokens;
   the orchestrator, which this issue does not change, reached the stage 5 launch at
   14.6 million tokens of context against 12.4 million before, over 122 events against
   101 (this run also launched a map-correction top-up the before run did not need), so
   the audit's cost at the stop, $8.33 for stages 1 to 4 and part of 5, shows the role
   saving and no orchestrator saving. The run was not resumed; resuming it is open in
   item 10. The Windows record of acceptance item 27 holds the rejection, the override
   run, and the recorded models.
10. **Review.** Three Codex `gpt-6-astra` critique rounds converged the plan, and one
   final pass of the branch at 5d84784 found no blocking finding and four non-blocking
   ones, each confirmed by reading the code and fixed: the early-read rule, read
   literally, made the Reviewer contract's pointers to the Implementer prompt and Step
   4.2 a reason to read `steps/4-build.md` in a plan-only run (a file is now read only to
   carry out a procedure in it); the README's Sonnet criteria omitted the type and the
   cited rule section of `tiers.md`; resume read `audit-evidence.md` in its step 2,
   before step 5's version gate could rerun stage 1 for a 0.10.x run (read when it
   exists); and item 3's word count was the split's, not the release's. A repo-docs
   maintain-mode pass on the branch found no error and five findings: the hub's
   requirements pointer named only two groups and a blank line was missing before the
   Token use heading (both fixed), the same word count, Part 12 item 1's "16c" (noted in
   item 4), and the import's ccl source line references in `docs/architecture.md`, left
   as history. The first full test run after the release commit failed only in the lint,
   release, and rules tests that hold the versions as literals; they moved as the 0.6.2
   release moved them, with 0.7.1 as the tests' next suite version because lint's bridge
   version gate rejects 0.8.0 in the loop manifest. Open: resume the stopped audit run
   (`/cca:resume 2026-10-09-1900-app-feature` from the fixture's `app` directory in the
   after profile) to complete item 9's audit figure through stage 8 and to see
   `codex_model` `gpt-6-luna` recorded at stage 6; and the macOS run of item 27.

## Part 24: ccx 0.7.1, ccx-loop 0.7.1, and cca 0.12.0, the step hand-offs, open pull request collisions, and the generality decisions, 2026-10-10

Issues #27, #51, and #56, planned with three Codex `gpt-6-astra` critique rounds (four
blocking objections in the first, two in the second, none in the third) and built in
one pull request. Each issue 51 item is decided here before its change.

1. **Issue 56: the miss was a measurement error; the hand-offs are added anyway.** On
   Windows the two item 27 build runs and three more override runs on 0.7.0's skill all
   read `steps/4-build.md` after the plan was final and `report.md` before the report,
   one of them through `cat` in Bash calls (acceptance record "ccx-loop 0.7.1, the step
   hand-offs"). The macOS override run's log, rechecked on macOS, shows it read both
   too, each through a `cat` at the end of a long Bash call that the first reader cut
   short (acceptance record "item 27's override run log rechecked for issue 56"). So
   it is 0 misses in 7 build runs. Found while reading, and true on its own: the
   only text that sent a run from Step 3.6 to `steps/4-build.md` was the core's
   Supporting files line, far back in context, and nothing at the end of Step 6 named
   `report.md`. Each step file now ends with its hand-off, and lint 16d keeps them; the
   lint guards the text, it is not a behavioral check. Three override runs on the
   branch read the same files at the same points. The recheck closes the issue.
2. **`--no-publish` withholds publication, not Step 7.** `steps/7-publish.md` is where a
   `--no-publish` run "ends in `prepared` here" and where a `continue` run with one open
   PR writes the continued-PR body that the `prepared` report's `gh pr comment` command
   names; yet the core said `--no-publish` "withholds Step 7", and both item 27 records
   judged "not read under `--no-publish`" a pass. On the `github` host a run that passes
   Step 6 now reads `steps/7-publish.md` under `--no-publish` too; Terminal states says
   publication was withheld; Step 7's opening says publication, items 1 onward, runs
   only on `github` without `--no-publish`. On `other` the run still ends `prepared`
   after Step 6, since Step 0.2 reads no pull request there and there is no body to
   write. Not run: the `github` and continued-PR paths, which need a GitHub remote.
3. **Issue 27 part A: open pull request collisions.** For a `github:` PR bundle whose
   run-once list adds a name, stage 1 step 3 reads the first 100 open PRs on its base
   (`gh pr list ... --json number,url,headRefName,changedFiles,files`) and runs the new
   `collisions.sh`. A candidate is another PR's file, not `DELETED`, in the same
   directory as a new path, with the same file name or the same leading version token
   (one leading `V` or `v` before a digit dropped, then digits with `.` or `_` digit
   groups, so `V3__a.sql`, `v3_b.sql`, and `3-c.sql` share 3; leading zeros kept). Other
   directories are not compared, a stated limit. gh returns at most 100 files per PR,
   checked on 2026-10-10 with gh 2.91.0 (nodejs/node #66546: `changedFiles` 3109,
   `files` 100), so a `cut` row names a PR whose `changedFiles` is larger, and
   `cut-list` a list of 100. The derived `collisions.tsv`, sorted and deduplicated, is
   hashed into `forge_hashes`, not the raw list, so an open PR that collides with
   nothing does not invalidate stage 1 on resume; resume recomputes it from the saved
   manifest's patterns, the run-once `git diff` at the recorded shas, the `gh` read, and
   the script, checking each exit code. A failed read is a `forge_gaps` entry keyed by
   `collisions.tsv` with the PR's URL, retried by resume; a refused script is a stop,
   never a gap. A candidate is a lead: the auditor compares the runner's journal keys
   for both names, whatever the row's kind, and clears a candidate with quoted runner
   lines or files a finding labeled `unverified assumption` with a live check on merge
   order. Part B, rerun safety, shipped in cca 0.8.0. The script has its own suite;
   acceptance item 28 needs a GitHub repository with open PRs and was not run.
4. **Issue 51, item by item.**
   1. Check discovery: changed. A principle with examples: the standard entries of each
      build tool manifest, with Cargo, Go, and Gradle beside npm, make, and Python;
      `.ccx.json` precedence, the merge, dedupe, baseline, and CI-only rules unchanged.
   2. The CI watch's 403 match: kept. It is narrow on purpose (Part 4 item 4); a wider
      match would read a permission 403 as CI being unavailable and hide a failure.
   3. The branch naming rule: kept. `--branch` overrides it; reading a convention from
      existing branch names would guess, and asking would add a question to every run.
   4. The `bin/` and `obj/` grouping: changed to any build output directory the repo's
      own ignore rules exclude as a whole, such as `bin/`, `obj/`, `target/`, `build/`,
      or `dist/`, still only for a repo with a logged run since the last check, still
      one record listing every path, and still after the pending-agent reconciliation.
      Part 19 item 5's rejection (accept any such change whenever a build tool run is
      logged) holds.
   5. The "0.4.0 or earlier" clauses: kept. They cost a few lines, and dropping them
      would turn an old run's resume into a confusing failure for no gain.
   6. The tests-account check: kept as an obligation. It is already conditional on a
      quoted grant or a pointer and assumes no accounts-file shape.
   7. The handoff's ticket fields: kept, with the mapping stated. `type` is the forge's
      work item type, issue type, or label, else `issue`; `iteration` its iteration
      path, sprint, or milestone; `owner` its assignee; each `none` where the forge or
      ticket has no such field, which is what the loop's handoff already writes. No
      parser change; the GitHub id form was already among the examples.
   8. The Codex model id: remaining duplication, not drift. Part 23 item 6 already moved
      the commands to `codex-model: default`, so the copies left are the README's two,
      the Roles row, and stage 6 step 2 with its example, and all agree with R75. Stage
      6 step 2 is the place of truth, and lint 21 fails when another copy or the
      example differs.
   9. The model-name ladder: kept. The allow-list is the Agent tool's own model enum, so
      a new name arrives with a Claude Code release, and the plugin's release follows.
   10. The 540-second cap: kept, not a setting. It derives from the Bash tool's
       10-minute cap and applies only to a session that is headless or cannot tell
       whether a user can answer; an interactive session keeps its configured timeout,
       and `--codex-timeout` already lowers it.
   11. The Azure DevOps and Salesforce link forms: kept as examples. Part 20 item 5
       records the output style and chat block as the author's stated preferences,
       shipped opt-in, and the forms are the author's own; they give the exact form
       where invented links are common, and the rule before them covers every other
       platform. The author can reopen this.
   12. "PowerShell 7": changed to "PowerShell" in the installed Codex rule, since Codex
       runs the PowerShell it finds; `/ccx:rules` offers the changed block as it does
       any update.
   13. The sandbox probe's 120 seconds: kept with its reason, a bounded default at four
       times one measured Windows run.
   14. The upstream review skills' numbers and integration-test obligation: kept,
       unchanged from upstream, under R26.
   15. The one-user premise: kept. Its consequence, stated: a second user has no
       migration path from the old plugins, since Parts 14 and 16 removed them; a
       second user reopens it.
   16. Part 19 item 5's wording follows item 4; Part 19 stays as written, as history.
5. **Versions.** The ccx family moves together to 0.7.1 (`package.json`, `ccx`,
   `ccx-loop`, the Codex `ccx`, and the catalog), and cca to 0.12.0 for its new forge
   read and script, with its three `plugin_version` literals; a run resumed from 0.11.0
   reruns stage 1 by the version gate. The lint, release, and rules tests that hold the
   versions as literals moved with them, as Part 23 item 10 describes.
6. **Issue 31.** Its body was rewritten for a Codex session to pick up: a dated state
   section with what changed since it was written (three tiers and routing under the
   tier, medium's `gpt-6.1-sol` reviewer, `gpt-6-luna` small slices, the `.ccx.json`
   `models` override, the step files and their hand-offs, cca's cheaper roles and
   `audit-evidence.md`), the inverted role tables marked as proposals, the files to
   read first, and the open questions; the original text is kept below it.
