# repo-docs

A framework for repository instruction files, and a skill that applies it.

The root `AGENTS.md` is the hub: it always loads and holds what the repo is, the
commands, the hard constraints, and an index of spokes. A spoke is any file the hub
points to, read only when its condition is met. An adapter is a `CLAUDE.md` whose only
content is `@AGENTS.md`, used only where Claude Code cannot read `AGENTS.md` directly or
someone needs a `CLAUDE.local.md`.

The principle behind it: put information at the narrowest scope where it stays
authoritative, and load it only when the task needs it.

## Status

The first release ships the skill and one hook; an optional check follows in a later
release. The skill loads when a task matches it, or when you call it with `/repo-docs`.
The hook runs when the agent runs `git commit` in a session and reminds it to audit. It
never blocks the commit, and it does not run on a commit made outside a session.

## Install

repo-docs is part of the reimagine-code suite, whose repository is a plugin marketplace
for Claude Code and Codex.

Claude Code, inside a session:

```
/plugin marketplace add vibecodedapps-official/reimagine-code
/plugin install repo-docs@reimagine-code
```

Codex:

```
codex plugin marketplace add vibecodedapps-official/reimagine-code
codex plugin add repo-docs@reimagine-code
```

Codex runs a plugin hook only after you trust it. Run `/hooks` in a session to trust it.
On Windows the hook needs Git for Windows, whose Git Bash runs it in Claude Code. Codex
runs it with the `sh` it finds on `PATH`, so add Git's `bin` folder, such as
`C:\Program Files\Git\bin`, to `PATH`; without it the hook does nothing.

## License

Apache 2.0. See `LICENSE`.
