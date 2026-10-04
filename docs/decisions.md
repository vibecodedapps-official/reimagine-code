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
