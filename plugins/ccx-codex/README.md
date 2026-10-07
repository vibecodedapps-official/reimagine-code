# ccx for Codex

General code review skills for Codex, adapted from the code-review skills in the
[openai/codex](https://github.com/openai/codex/tree/main/.codex/skills) repository for
use on any repository. It is the Codex part of the reimagine-code suite. The Claude Code
plugin named `ccx` is a different plugin, the Codex bridge.

The plugin contains four skills. `general-code-review` is the orchestrator: it runs one
subagent per companion skill and returns every finding. The companions are
`general-code-review-breaking-changes`, `general-code-review-context`, and
`general-code-review-testing`.

## Install

In Codex:

```sh
codex plugin marketplace add vibecodedapps-official/reimagine-code
codex plugin add ccx@reimagine-code
```

Or run `/plugins` in Codex, find the reimagine-code marketplace, and install `ccx`.
Then ask Codex to "run the general-code-review skill" on a change.

## The skills

The skills map one to one onto the upstream skills, with the `general-` prefix. The
orchestrator names its three companions explicitly and does not add labels. The
breaking-changes skill lists generic surfaces (public APIs, CLI, configuration,
persisted formats, wire formats) instead of Codex's own. The context skill applies only
when the diff touches code that assembles a language model's context, and reports
nothing otherwise. The testing skill defers to the repository's own test harness and
file conventions.

Each SKILL.md carries a comment naming the upstream file and commit it was adapted
from, as the Apache license requires for modified files.

## License

Apache-2.0, the same license as upstream. See `LICENSE` and `NOTICE` in this directory.
