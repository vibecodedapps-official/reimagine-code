---
description: Check Codex version, login, sandbox mode, write sandbox, and the allow rule
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/ccx.mjs" setup *)
---

Run exactly this Bash command with no changes and no timeout:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/ccx.mjs" setup "${CLAUDE_PLUGIN_DATA}"
```

Return the output verbatim inside one fenced code block, with no commentary before or
after it. Outside a code block, Markdown drops the backslashes the allow rule needs.
Run no other command and change no settings.
