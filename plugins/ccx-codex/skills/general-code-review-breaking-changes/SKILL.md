---
name: general-code-review-breaking-changes
description: Breaking changes to external integration surfaces
---

<!-- Modified. Adapted from openai/codex .codex/skills/code-review-breaking-changes/SKILL.md at commit f53f5a6fed662bd6f352d08066925c871a061182 (Apache-2.0). -->

Search for breaking changes in the surfaces other code, users, or deployments depend on:
- public APIs: function signatures, types, HTTP or RPC endpoints, response shapes
- CLI parameters, subcommands, exit codes, and output that scripts may parse
- configuration loading: keys, defaults, environment variables, file locations
- persisted state and on-disk formats: databases, caches, session or checkpoint files that existing installs must still read
- wire and message formats exchanged with other services or versions

Treat a change as breaking if an existing caller, config file, or stored artifact would fail or behave differently without being updated.

Do not stop after finding one issue; analyze all possible ways breaking changes can happen.
