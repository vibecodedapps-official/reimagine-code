# Acceptance

Hand-run checks for the suite. Each milestone adds its items. An item is
`N. **Title.** Setup: ... Command: ... Expected: ... Rerun when ...`, and an item not yet
run says "Not yet run." Runs before cutover use scratch profiles: `CLAUDE_CONFIG_DIR` and
`CODEX_HOME` pointing at directories outside the repo, so the author's own setup does not
change.

The source repos' acceptance files are kept under `docs/history/`. Items from them that
name a plugin are rerun under the new names and recorded here.

## Items

1. **Bridge in a scratch profile.** Setup: scratch `CLAUDE_CONFIG_DIR` and `CODEX_HOME`,
   `recode` installed from this repository's catalog, and a scratch git repository.
   Command: `/recode:setup`, then `/recode:ask` with a short question, then
   `/recode:implement` from a test skill that asks for a one-line edit. Expected: setup
   reports the Codex version and login, and allow rules that name the
   `recode-reimagine-code` data directory and the installed `recode` path; ask prints
   Codex's answer; implement edits the scratch repository and its footer shows the
   change. Covers R9 and R15. Rerun when a bridge command, the setup report, or the data
   directory changes. Not yet run.
2. **codex-lite items under the new names.** Setup: as each item says, in scratch
   profiles. Command: items 1, 5, 8, 11, 12, 16, 17, 18, and 19 of
   `docs/history/codex-lite-cc/acceptance.md`, the items that name the plugin or its
   variables, with `/codex-lite:` read as `/recode:` and `CODEX_LITE_` as `RECODE_`.
   Item 15, the Windows install, runs on the Windows work machine with R53. List drawn
   2026-10-03 at the start of M2. Expected: each item's own result. Rerun when that
   file's own conditions say. Not yet run.

## Record of runs

Each entry gives the date, the machine, the Claude Code, Codex, and Node versions, the
items run, and the result.
