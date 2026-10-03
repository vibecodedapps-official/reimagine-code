#!/usr/bin/env bash
# Compare the upstream skill directories against upstream.lock using one
# GitHub API call. Exits 1 when any tracked directory's tree sha has changed.
# Requires: gh (authenticated; GITHUB_TOKEN is enough for a public repo), jq.
set -euo pipefail
cd "$(dirname "$0")/.."

repo=$(jq -r .repo upstream.lock)
ref=$(jq -r .ref upstream.lock)
path=$(jq -r .path upstream.lock)

remote=$(gh api "repos/${repo}/contents/${path}?ref=${ref}" \
  --jq '[.[] | select(.type == "dir") | {key: .name, value: .sha}] | from_entries')

# Drift is: a pinned directory whose tree sha changed or disappeared, or a new
# upstream directory matching the tracked prefix that is not pinned yet.
drift=$(jq -n -r --argjson remote "$remote" --slurpfile lock upstream.lock '
  ($lock[0].skills) as $pinned
  | ($lock[0].prefix) as $prefix
  | ( $pinned | to_entries[]
      | select($remote[.key] != .value)
      | "\(.key): pinned \(.value), upstream \($remote[.key] // "removed")" ),
    ( $remote | keys[]
      | . as $k | select(($k | startswith($prefix)) and ($pinned | has($k) | not))
      | "\(.): new upstream directory, not in upstream.lock" )')

if [ -n "$drift" ]; then
  echo "Upstream ${repo}/${path}@${ref} has drifted since last sync:"
  echo "$drift"
  echo "Run scripts/sync-upstream.sh to pull the changes and update upstream.lock."
  exit 1
fi
echo "Up to date with ${repo}/${path}@${ref}."
