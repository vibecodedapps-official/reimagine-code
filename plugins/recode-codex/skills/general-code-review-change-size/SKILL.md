---
name: general-code-review-change-size
description: Change size guidance (800 lines)
---

<!-- Modified. Adapted from openai/codex .codex/skills/code-review-change-size/SKILL.md at commit f53f5a6fed662bd6f352d08066925c871a061182 (Apache-2.0). -->

Unless the change is mechanical the total number of changed lines should not exceed 800 lines.
For complex logic changes the size should be under 500 lines.

If the change is larger, explain whether it can be split into reviewable stages and identify the smallest coherent stage to land first.
Base the staging suggestion on the actual diff, dependencies, and affected call sites.
