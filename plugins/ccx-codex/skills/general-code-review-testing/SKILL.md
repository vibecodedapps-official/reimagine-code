---
name: general-code-review-testing
description: Test authoring guidance
---

<!-- Modified. Adapted from openai/codex .codex/skills/code-review-testing/SKILL.md at commit f53f5a6fed662bd6f352d08066925c871a061182 (Apache-2.0). -->

For changes to core behavior prefer integration tests over unit tests. Use the repository's existing integration test harness and conventions.

Changes that alter user-facing behavior or core logic MUST add an integration test:
- Provide a list of major logic changes and user-facing behaviors that need to be tested.

If unit tests are needed, follow the repository's test file convention and keep them in dedicated test files.
Avoid test-only functions in the main implementation.

Check whether there are existing helpers to make tests more streamlined and readable.
