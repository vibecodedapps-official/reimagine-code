#!/bin/sh
# PreToolUse hook for Bash and PowerShell. When the command runs `git commit` in a repo
# that tracks an AGENTS.md or CLAUDE.md, add a reminder to run the repo-docs audit. Reads
# stdin and the git index at the work-tree root, never blocks the command, never
# writes a file.
# Keep only the command field; preserve quoted option arguments.
# JSON newlines delimit commands, and JSON tabs delimit words.
word="('[^']*'|\"[^\"]*\"|[^[:space:];&|()\"'])+"
options="(--[[:alnum:]-]+(=$word)?|-[[:alnum:]]+)"
sed -nE 's/.*"command"[[:space:]]*:[[:space:]]*"((\\.|[^"\\])*)".*/\1/p' |
  sed 's/\\\\/_/g; s/\\n/;/g; s/\\t/ /g; s/\\"/"/g' |
  grep -Eq "(^|[;&|(])[[:space:]]*((env|sudo|[[:alpha:]_][[:alnum:]_]*=$word)[[:space:]]+)*((bash|sh|zsh)[[:space:]]+-(c|lc)[[:space:]]+['\"])?git(\\.exe)?([[:space:]]+($options|(-C|-c|--git-dir|--work-tree|--namespace|--config-env)[[:space:]]+$word))*[[:space:]]+commit([[:space:];&|()\"']|$)" ||
  exit 0
# The index sees a nested file and a file staged for this commit. The hook cannot tell
# whether the user asked for a first instruction file; the skill triggers on that case.
[ -n "$(git -C "./$(git rev-parse --show-cdup 2>/dev/null)" ls-files -- AGENTS.md '*/AGENTS.md' CLAUDE.md '*/CLAUDE.md' 2>/dev/null)" ] || exit 0
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"repo-docs: this command commits, and the commit goes ahead. Unless you already ran the repo-docs audit on these changes, run it once the commit finishes and report what it finds; fix errors in a follow-up change."}}
JSON
