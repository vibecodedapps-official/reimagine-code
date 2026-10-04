---
description: Check the Codex CLI version, login, Windows sandbox mode, and write sandbox, print the allow rule for this plugin, and list the old plugins this suite replaces
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/recode.mjs" setup *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/suite.mjs" old-plugins)
---

Run exactly these two Bash commands, one after the other, with no changes and no timeout:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/recode.mjs" setup "${CLAUDE_PLUGIN_DATA}"
```

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/suite.mjs" old-plugins
```

Return both outputs verbatim inside one fenced code block, the first output and then the second, with no commentary before or after it. Outside a code block, Markdown drops the backslashes the allow rule needs. Run no other command, run none of the commands the output lists, and change no settings.
