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
   `/Users/joe/.claude/plugins/data/c-spike-mkt`, the same value as its
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

1. **The rules come from forge-ops commit 948ce5f.** `rules/core.md` is lines 6 to the
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

1. **The core rules come from forge-ops commit 9faabda.** Since 948ce5f, forge-ops had
   added two bullets to both of its files: the cause check under Working, from its PR
   68, and the code comment rule under Code. M7 step 2 replaces each machine's import
   of those files with the block, so a block without them would drop both. `rules/core.md`
   is again lines 6 to the end of `claude/CLAUDE.md`, now at 9faabda. The other three
   rules files, the output style, and the chat block's pasted text already matched
   9faabda, apart from the style's `name` line and the chat file's own header, so they
   are unchanged. The Windows part, an empty line, and the core rebuild
   `claude/CLAUDE.md` byte for byte, and the Codex parts rebuild `codex/AGENTS.md`, whose
   Writing section now starts at line 83. Checked with `cmp` on 2026-10-04. This
   repository stays the source; a later forge-ops change reaches the block only through a
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
   no forge-ops checkout, and its `CLAUDE.md` and `AGENTS.md` are kept by hand on
   purpose. It may adopt the block from a brief without the forge-ops steps, with its own
   lines below the end marker, but runs no gate. R59's rules check, against a file with
   local overrides below the block, ran on the personal Windows machine instead: its
   Codex file keeps a Links section there, and `/recode:rules` read `current` and
   changed nothing. forge-ops' second change waits only for machines that import its
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
5. **An old forge-ops checkout must not run its installer after step 2.** Before
   forge-ops 0847634 (its PR 67), `claude/install.mjs` rewrites `~/.claude/CLAUDE.md` to
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
