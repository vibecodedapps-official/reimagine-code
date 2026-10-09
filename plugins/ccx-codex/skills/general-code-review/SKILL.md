---
name: general-code-review
description: Run a final code review on a pull request or diff, for any repository
---

<!-- Modified. Adapted from openai/codex .codex/skills/code-review/SKILL.md at commit f53f5a6fed662bd6f352d08066925c871a061182 (Apache-2.0). -->

Use subagents to review the change, one subagent per skill, using exactly these skills:
- general-code-review-breaking-changes
- general-code-review-context
- general-code-review-testing

Pass the full skill path to each subagent. Use the highest reasoning effort available.

You must return every single issue from every subagent. You can return an unlimited number of findings.
Use raw Markdown to report findings.
Number findings for ease of reference.
Each finding must include a specific file path and line number.

Do not post comments to the hosting platform or change labels unless explicitly asked.
