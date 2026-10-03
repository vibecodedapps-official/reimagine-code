#!/usr/bin/env bash
# Confirm the committed copy of each verbatim skill directory matches the tree
# sha pinned in upstream.lock. Offline; no network or gh needed.
# The working tree is hashed through a temporary index so .gitattributes
# normalization applies exactly as it would on commit.
# Requires: git, jq.
set -euo pipefail
cd "$(dirname "$0")/.."

dest="plugins/codex-code-review/skills"
index=$(mktemp -u)
trap 'rm -f "$index"' EXIT
GIT_INDEX_FILE="$index" git add -f "$dest"
tree=$(GIT_INDEX_FILE="$index" git write-tree)

status=0
while IFS=$'\t' read -r name pinned; do
  actual=$(git rev-parse -q --verify "${tree}:${dest}/${name}" 2>/dev/null || echo missing)
  if [ "$actual" != "$pinned" ]; then
    echo "${name}: local ${actual}, upstream.lock ${pinned}"
    status=1
  fi
done < <(jq -r '.skills | to_entries[] | "\(.key)\t\(.value)"' upstream.lock | tr -d '\r')

if [ "$status" -ne 0 ]; then
  echo "Local verbatim skills differ from upstream.lock. Run scripts/sync-upstream.sh, or revert local edits."
  exit 1
fi
echo "Local verbatim skills match upstream.lock."
