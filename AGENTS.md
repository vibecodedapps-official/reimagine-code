# AGENTS.md

reimagine-code is one repository that publishes Claude Code and Codex plugins: the
`recode` bridge, the `recode-loop` loop, the Codex `recode` review skills, and repo-docs.
It is mid-migration from four source repos toward v0.1.0.

## Commands

- `npm test`: every `tests/**/*.test.mjs`.
- `npm run lint`: the repository checks in `tools/lint.mjs`.
- `claude plugin validate --strict .`, then the same on each `plugins/<name>`: the
  manifest checks CI runs.

## Hard constraints

- Files under `imports/` are unchanged imports of the source repos. Do not edit them;
  each moves out in its own milestone, in a commit that only moves files.
- Moves and string renames never share a commit.
- A plugin directory under `plugins/` holds only what a user installs. Tests, lint,
  release tools, and design docs stay outside `plugins/`.
- Shipped files are ASCII.
- Commits are `type(scope): subject`, lowercase, with a body that says why.
- Put a bare `@token` in commit subjects and PR text in backticks, so GitHub does not
  link it to an account.

## Spokes

- docs/requirements.md: the numbered v0.1.0 requirements and how each is checked. Read before changing behavior or adding a check.
- docs/architecture.md: the layout, components, house rules, versions, and migration. Read before changing structure, a manifest, or a catalog.
- docs/implementation-plan-v0.1.0.md: the milestones and their checks. Read before starting or finishing a milestone.
- docs/decisions.md: decisions with their evidence. Read before reversing a design choice.
- docs/rename-map.md: every file move and string rename from the source repos. Read before a move or rename commit.
