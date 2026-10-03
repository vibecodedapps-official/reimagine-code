---
name: general-code-review-context
description: Model visible context, for projects that build prompts or context for a language model
---

<!-- Modified. Adapted from openai/codex .codex/skills/code-review-context/SKILL.md at commit f53f5a6fed662bd6f352d08066925c871a061182 (Apache-2.0). -->

This skill applies only when the diff touches code that assembles the context (history of messages, injected fragments, tool results) sent to a language model. If the diff does not touch such code, report no findings.

1. No history rewrite - the context must be built up incrementally.
2. Avoid frequent changes to context that cause cache misses.
3. No unbounded items - everything injected in the model context must have a bounded size and a hard cap.
4. No items larger than 10K tokens.
5. Highlight new individual items that can cross >1k tokens as P0. These need an additional manual review.
6. All injected fragments must go through the project's single context-building module or abstraction, not be spliced in ad hoc.
