# reimagine-code

A suite of plugins for Claude Code and Codex, published from one repository as a Claude
Code marketplace and a Codex marketplace, both named `reimagine-code`.

- `ccx`: on Claude Code, hand a question, a review, or an edit to the Codex CLI, plus
  setup and optional house rules. On Codex, general code review skills.
- `ccx-loop`: on Claude Code, a plan, review, implement, review, publish loop for one
  unit of work.
- `cca`: on Claude Code, a read-only, adversarial audit of a finished bundle of pull
  requests before merge, with Codex as the optional second opinion.
- `repo-docs`: keeps a repository's agent instruction files correct, on both hosts.

Each plugin's README has the details: [ccx](plugins/ccx/README.md),
[ccx-loop](plugins/ccx-loop/README.md), [cca](plugins/cca/README.md), [ccx for
Codex](plugins/ccx-codex/README.md), and [repo-docs](plugins/repo-docs/README.md).
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
/plugin install ccx@reimagine-code
/plugin install ccx-loop@reimagine-code
/plugin install cca@reimagine-code
/plugin install repo-docs@reimagine-code
```

Installing `ccx-loop` also installs `ccx`, which it calls.

In Codex:

```
codex plugin marketplace add vibecodedapps-official/reimagine-code
codex plugin add ccx@reimagine-code
codex plugin add repo-docs@reimagine-code
```

On Codex, `ccx` is the code review skills, a different plugin from the Claude Code
bridge of the same name. Codex runs the repo-docs hook only after you trust it in
`/hooks`.

## Update

For Claude Code, run:

```
claude plugin marketplace update reimagine-code
claude plugin update ccx@reimagine-code
claude plugin update ccx-loop@reimagine-code
claude plugin update cca@reimagine-code
claude plugin update repo-docs@reimagine-code
```

Update the plugins you installed, then restart Claude Code. Updating `ccx-loop` does not
update `ccx`. After updating `ccx`, run `/ccx:setup` again and use the allow rule it
prints, because the old rule names the previous version's path.

For Codex, run:

```
codex plugin marketplace upgrade reimagine-code
```

## Modes

- **Cross-vendor**, the default: the Codex CLI is installed and logged in. The bridge
  hands work to Codex, and the loop has Codex implement and review.
- **Claude-only**: when `codex` is missing or broken, the bridge commands say so, and the
  loop gives the Codex roles to Claude subagents. For one loop run, pass `--no-codex`.
  For every run, set the loop's `codex` option to false with `/plugin configure
  ccx-loop@reimagine-code`.
- **Bridge only**: install `ccx` alone. Installing the loop always installs the bridge.

On Codex, the suite offers the review skills and repo-docs. The house rules command runs
only in Claude Code.

## Moving from the old plugins

This suite replaces codex-lite, ccl, codex-code-review, and repo-docs from its own
marketplace. In Claude Code, `/ccx:setup` lists each old plugin it finds on either
host, with the command that removes it. It runs none of them. Every renamed command and
path is listed under Breaking in the [changelog](CHANGELOG.md).

### From recode 0.1.x

Release 0.2.0 renamed `recode` to `ccx` and `recode-loop` to `ccx-loop`, on Claude Code
and on Codex. The marketplace and the repository keep the name `reimagine-code`.

On Claude Code, the catalog tells Claude Code to move your install, so you do not
uninstall anything. The move happens the first time you run a plugin command or start a
session after the marketplace updates, which you can start with
`/plugin marketplace update reimagine-code`. It renames the plugins in your enabled list and
keeps the loop's `codex` option, but it drops the install records. `claude plugin list`
then shows neither plugin until you install them under the new names:

```
/plugin install ccx@reimagine-code
/plugin install ccx-loop@reimagine-code
```

Run the second line only if you used the loop. Installing the loop alone also installs
`ccx`. After that:

- If you chose the output style, select it again as `ccx:Concise Plain`. The setting
  keeps pointing at the old style name, which no longer exists.
- If you pasted setup's allow rule into your settings, paste the new one from
  `/ccx:setup`. It names the renamed script.
- If you added the house rules, run `/ccx:rules` once. It reads the block the old command
  wrote and rewrites it under the new marker, after the usual diff. `/ccx:rules
  --remove` also takes out the old block.
- The plugin data directory is not carried over, so the rules state starts empty. If
  `/recode:rules` created your `CLAUDE.md`, `/ccx:rules --remove` leaves it empty
  instead of deleting it, and a rules text you declined can raise the session notice
  again. You can delete the old directory, `~/.claude/plugins/data/recode-reimagine-code/`.
- In a repository with `.recode.json`, rename it to `.ccx.json`; the loop stops with
  `blocked` until you do. A `.recode/` line in `.git/info/exclude` can be deleted.

On Codex there is no rename. Update the marketplace, add the new plugin, then remove the
old one:

```
codex plugin marketplace upgrade reimagine-code
codex plugin add ccx@reimagine-code
codex plugin remove recode@reimagine-code
```

Once the catalog dropped `recode`, `codex plugin list` no longer shows it, but your
`config.toml` keeps its table, and `codex plugin remove` still deletes it.

## Uninstall

If you added the house rules, run `/ccx:rules --remove` first. It takes the block out
of your `CLAUDE.md` and `AGENTS.md`, and nothing can do that once `ccx` is gone.

Then, in Claude Code:

```
/plugin uninstall ccx-loop@reimagine-code
/plugin uninstall ccx@reimagine-code
/plugin uninstall repo-docs@reimagine-code
```

In Codex:

```
codex plugin remove ccx@reimagine-code
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

To release, `node tools/release.mjs ccx <version>`, or `repo-docs <version>`, sets
the version everywhere it is copied and runs lint. Lint then needs a changelog heading
for a new suite version. Tag each changed Claude plugin with `claude plugin tag --push
plugins/<name>`, `ccx` before `ccx-loop`. Once a plugin has a tag, lint fails on a
change under its directory that keeps the tagged version.

Licensed under Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
