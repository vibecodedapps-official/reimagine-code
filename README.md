# reimagine-code

A suite of plugins for Claude Code and Codex, published from one repository as a Claude
Code marketplace and a Codex marketplace, both named `reimagine-code`.

- `recode`: on Claude Code, hand a question, a review, or an edit to the Codex CLI, plus
  setup and optional house rules. On Codex, general code review skills.
- `recode-loop`: on Claude Code, a plan, review, implement, review, publish loop for one
  unit of work.
- `repo-docs`: keeps a repository's agent instruction files correct, on both hosts.

Each plugin's README has the details: [recode](plugins/recode/README.md),
[recode-loop](plugins/recode-loop/README.md), [recode for
Codex](plugins/recode-codex/README.md), and [repo-docs](plugins/repo-docs/README.md).
The [changelog](CHANGELOG.md) lists each release.

## Requirements

- Claude Code 2.1.288 or later, and Codex CLI 0.159.2 or later, the versions this
  release was tested on. Claude Code before 2.1.269 lacks features the suite uses.
- Node 22 or later, which runs the bridge's scripts.
- On Windows, Git for Windows, whose Git Bash runs the repo-docs hook in Claude Code.
  Codex runs the hook with the `sh` it finds on `PATH`, so add Git's `bin` folder, such
  as `C:\Program Files\Git\bin`, to `PATH`.

## Install

In Claude Code:

```
/plugin marketplace add vibecodedapps-official/reimagine-code
/plugin install recode@reimagine-code
/plugin install recode-loop@reimagine-code
/plugin install repo-docs@reimagine-code
```

Installing `recode-loop` also installs `recode`, which it calls.

In Codex:

```
codex plugin marketplace add vibecodedapps-official/reimagine-code
codex plugin add recode@reimagine-code
codex plugin add repo-docs@reimagine-code
```

On Codex, `recode` is the code review skills, a different plugin from the Claude Code
bridge of the same name. Codex runs the repo-docs hook only after you trust it in
`/hooks`.

## Modes

- **Cross-vendor**, the default: the Codex CLI is installed and logged in. The bridge
  hands work to Codex, and the loop has Codex implement and review.
- **Claude-only**: when `codex` is missing or broken, the bridge commands say so, and the
  loop gives the Codex roles to Claude subagents. For one loop run, pass `--no-codex`.
  For every run, set the loop's `codex` option to false with `/plugin configure
  recode-loop@reimagine-code`.
- **Bridge only**: install `recode` alone. Installing the loop always installs the bridge.

On Codex, the suite offers the review skills and repo-docs. The house rules command runs
only in Claude Code.

## Moving from the old plugins

This suite replaces codex-lite, ccl, codex-code-review, and repo-docs from its own
marketplace. In Claude Code, `/recode:setup` lists each old plugin it finds on either
host, with the command that removes it. It runs none of them. Every renamed command and
path is listed under Breaking in the [changelog](CHANGELOG.md).

## Uninstall

If you added the house rules, run `/recode:rules --remove` first. It takes the block out
of your `CLAUDE.md` and `AGENTS.md`, and nothing can do that once `recode` is gone.

Then, in Claude Code:

```
/plugin uninstall recode-loop@reimagine-code
/plugin uninstall recode@reimagine-code
/plugin uninstall repo-docs@reimagine-code
```

In Codex:

```
codex plugin remove recode@reimagine-code
codex plugin remove repo-docs@reimagine-code
```

The design is in [docs/architecture.md](docs/architecture.md),
[docs/requirements.md](docs/requirements.md), and the
[implementation plan](docs/implementation-plan-v0.1.0.md).

## Development

Node 22 or later, no dependencies. From the repository root:

```
npm test
npm run lint
```

CI runs both on Ubuntu, macOS, and Windows, then `claude plugin validate --strict` on
the Claude catalog and on each Claude plugin directory.

To release, `node tools/release.mjs recode <version>`, or `repo-docs <version>`, sets
the version everywhere it is copied and runs lint. Lint then needs a changelog heading
for a new suite version. Tag each changed Claude plugin with `claude plugin tag --push
plugins/<name>`, `recode` before `recode-loop`. Once a plugin has a tag, lint fails on a
change under its directory that keeps the tagged version.

Licensed under Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
