# reimagine-code

A suite of plugins for Claude Code and Codex, published from one repository as a Claude
Code marketplace and a Codex marketplace, both named `reimagine-code`.

- `recode`: on Claude Code, hand a question, a review, or an edit to the Codex CLI, plus
  setup and optional house rules. On Codex, general code review skills.
- `recode-loop`: on Claude Code, a plan, review, implement, review, publish loop for one
  unit of work.
- `repo-docs`: keeps a repository's agent instruction files correct, on both hosts.

Status: in development toward v0.1.0. Nothing is released yet, and the install commands
below work only once it is. Until then, use the source plugins: codex-lite-cc,
claude-codex-loop, codex-code-review, and repo-docs.

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

Licensed under Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
