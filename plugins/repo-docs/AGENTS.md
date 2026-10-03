# AGENTS.md

repo-docs is a portable agent skill that keeps a repository's instruction files
correct and progressively disclosed. The framework and its names (hub, spoke, adapter)
are the product, and a check is a later, optional add-on. These rules cover work under
`plugins/repo-docs/`, and the paths below are relative to that directory.

## Commands

There is no automated check of the skill yet; the optional check ships in a later
release. The suite's `npm run lint` fails when `.codex-plugin/plugin.json` or the
`repo-docs` entry of the suite's Claude catalog carries a version other than the one in
`.claude-plugin/plugin.json`. A release raises the version in all three, adds a
`repo-docs` entry to the suite's `CHANGELOG.md`, and is tagged `repo-docs--vX.Y.Z`.
After changing `hooks/pre-commit.sh`, pipe it a sample event, such as
`printf '{"tool_input":{"command":"git commit"}}' | sh hooks/pre-commit.sh`; from this
repository a commit prints one line of JSON, any other command prints nothing, and the
same commit run from a `mktemp -d` directory prints nothing.

## Hard constraints

- No markdown parser, anywhere. A path is verified with a `sed` or `awk` line scan and
  `test -e`, or not at all.
- Any script is POSIX `sh`, standard tools only, and never reads git history. The check,
  when it ships, never writes a file, and its test writes only under its own `mktemp -d`
  directory.
- One `AGENTS.md` is canonical at every scope. A `CLAUDE.md` is exactly the one line
  `@AGENTS.md`, and this directory has none.
- One hook, `hooks/pre-commit.sh`, runs before each `Bash` tool call on Claude Code and
  Codex. When the command runs `git commit` and the git index of the working directory
  holds an `AGENTS.md` or `CLAUDE.md`, it adds a reminder to run the audit; it never
  blocks the command, reads only stdin and that index, and never writes a file. No other
  hook.
- One authoritative version, in `.claude-plugin/plugin.json`. `.codex-plugin/plugin.json`
  and the suite catalog's `repo-docs` entry hold copies.
- `skills/repo-docs/SKILL.md` stays at or under 120 lines, and each file under
  `skills/repo-docs/references/` at or under 90. A platform's version numbers, byte and
  hop limits, line-count guidance, and URLs live only in
  `skills/repo-docs/references/platforms.md`; every other file states the behavior in
  words and points there.
- `README.md` stays shorter, in lines, than `placement.md` and `spokes.md` together.
