# AGENTS.md

reimagine-code is one repository that publishes Claude Code and Codex plugins: the
`ccx` bridge, the `ccx-loop` loop, the `cca` audit, the Codex `ccx` review skills, and
repo-docs. Its five source repos are imported with their histories, and each plugin is
released by a `<plugin>--v<version>` tag.

## Commands

- `npm test`: every `tests/**/*.test.mjs`; `tests/cca/sh.test.mjs` runs the audit
  plugin's POSIX sh suites and fixtures, which need `sh`, `git`, `awk`, and `jq`.
- `npm run lint`: the repository checks in `tools/lint.mjs`.
- `claude plugin validate --strict .`, then the same on each `plugins/<name>` that has a
  `.claude-plugin/plugin.json`: the manifest checks CI runs.

## Hard constraints

- Moves and string renames never share a commit.
- A plugin directory under `plugins/` holds only what a user installs. Tests, lint,
  release tools, and design docs stay outside `plugins/`.
- Shipped files are ASCII.
- Commits are `type(scope): subject`, lowercase, with a body that says why.
- Put a bare `@token` in commit subjects, PR text, and release notes in backticks, so
  GitHub does not link it to an account.

## Spokes

- docs/requirements.md: the numbered requirements, v0.1.0's, the audit plugin's, the token-use ones, and the collision and generality ones, and how each is checked. Read before changing behavior or adding a check.
- docs/architecture.md: the layout, components, house rules, versions, and migration. Read before changing structure, a manifest, or a catalog.
- docs/implementation-plan-v0.1.0.md: the milestones and their checks. Read before starting or finishing a milestone.
- docs/decisions.md: decisions with their evidence. Read before reversing a design choice.
- docs/rename-map.md: every file move and string rename from the source repos (sections 1 to 4), from the recode to ccx rename (section 5), and from the audit plugin's import (section 6). Read before a move or rename commit.
- docs/acceptance.md: the hand-run acceptance items and the record of runs. Read before running, adding, or recording an acceptance check.
- plugins/repo-docs/AGENTS.md: the repo-docs plugin's commands, release steps, and hard constraints. Read before editing under plugins/repo-docs/.
- plugins/repo-docs/skills/repo-docs/SKILL.md: the skill itself, with the principle, the hub and spoke model, what each platform loads, the four hub sections, and the two modes. Read before changing any file under plugins/repo-docs/skills/.
- plugins/repo-docs/skills/repo-docs/references/spokes.md: the pointer grammar, adapter policy, judgment checks, maintain-mode safeguards, and modes and severity. Read before writing or reviewing skill content.
- plugins/repo-docs/skills/repo-docs/references/placement.md: the placement rule. Read before editing it or deciding where a piece of skill content belongs.
- plugins/repo-docs/skills/repo-docs/references/platforms.md: each platform fact the skill relies on, with its source and the date it was checked. Read before relying on or changing a platform behavior, or when a platform changes.
