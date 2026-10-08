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
