---
description: Add, update, adopt, or remove the ccx house rules in your Claude CLAUDE.md and Codex AGENTS.md, showing each change before it is made
argument-hint: "[--remove | --adopt | --options core,windows,writing]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" *)
---

This command changes the user's own instruction files, so each change is shown first and made only when the user agrees to it. Never edit CLAUDE.md, AGENTS.md, or a settings file yourself.

The arguments are shown between the markers below:

<arguments>
$ARGUMENTS
</arguments>

They must be empty, exactly `--remove`, `--options` followed by a comma-separated list of `core`, `windows`, and `writing`, `--adopt`, or `--adopt` with `--options <list>` in either order. If they are anything else, tell the user those forms and stop. Run each command below as written, adding only the options list where a step says so; never put any other text from the user into a command.

1. Run:

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" status "${CLAUDE_PLUGIN_DATA}"
   ```

2. Run one of these:
   - With `--remove`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" remove "${CLAUDE_PLUGIN_DATA}"`
   - With `--adopt`: as the `--options` form or the no-argument forms below, with `--adopt` added to the `plan` command (`plan "${CLAUDE_PLUGIN_DATA}" --adopt [--options <list>]`).
   - With `--options <list>`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" plan "${CLAUDE_PLUGIN_DATA}" --options <list>`. Write the comma-separated list with no spaces. The list replaces the options in use; to keep the core rules and add Codex's Writing section, use `--options core,writing` (include `windows` too if you want to keep it).
   - With no arguments, when step 1 printed `options recorded: yes`: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" plan "${CLAUDE_PLUGIN_DATA}"`
   - With no arguments, when step 1 printed `options recorded: no`: ask the user which options to use, offering only those on the `options offered:` line. `core` is the rules themselves, on by default. `windows` is the Windows shell rules, on by default where it is offered. `writing` is off by default; it adds Codex's Writing section to the Codex file, and in Claude Code the same rules come from the output style. Then run the `--options` form with the chosen list.

3. Show that command's output verbatim inside a fenced code block. For each target whose section says `change: ready`, ask the user separately whether to make that change, recommending what its `recommend:` line says and nothing else. When it says `adopt`, the choices are adopt (recommended), apply anyway, or decline. Then run, with `<target>` being `claude` or `codex` as the section's `target:` line names it:
   - if the user agreed, or chose apply anyway: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" apply "${CLAUDE_PLUGIN_DATA}" <target>`
   - if the user declined: `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" decline "${CLAUDE_PLUGIN_DATA}" <target>`
   - after those, for each target where the user chose adopt, one target at a time: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/rules.mjs" plan "${CLAUDE_PLUGIN_DATA}" --adopt --options <that target's `options:` line>`, show only that target's section, and only if it still says `change: ready` ask apply or decline and run it as above; then the next target.

4. Show each apply or decline output verbatim. If `writing` is among the options, say that in Claude Code the Writing rules come from the output style, selected with `/output-style` as `ccx:Concise Plain`. Say that the same writing rules for claude.ai and ChatGPT are in `${CLAUDE_PLUGIN_ROOT}/chat/instructions.md`, which nothing installs: the user pastes its block into each app's settings.
