#!/usr/bin/env bash
# Re-copy the tracked skill directories from upstream and rewrite upstream.lock.
# Review the resulting diff before committing.
# Requires: git, jq. Works with bash 3.2+.
set -euo pipefail
cd "$(dirname "$0")/.."

repo=$(jq -r .repo upstream.lock | tr -d '\r')
ref=$(jq -r .ref upstream.lock | tr -d '\r')
path=$(jq -r .path upstream.lock | tr -d '\r')
prefix=$(jq -r .prefix upstream.lock | tr -d '\r')
dest="plugins/codex-code-review/skills"
skills=()
while IFS= read -r s; do skills+=("$s"); done < <(jq -r '.skills | keys[]' upstream.lock | tr -d '\r')

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Fetch by ref so upstream.lock may pin a branch, a tag, or a commit sha.
git init -q "$tmp"
git -C "$tmp" config core.autocrlf false
git -C "$tmp" remote add origin "https://github.com/${repo}.git"
git -C "$tmp" fetch -q --depth 1 --filter=blob:none origin "$ref"
git -C "$tmp" sparse-checkout set --no-cone "$path" >/dev/null
git -C "$tmp" checkout -q FETCH_HEAD
commit=$(git -C "$tmp" rev-parse HEAD)

# Confirm every pinned skill still exists upstream before touching the tree.
missing=()
for s in "${skills[@]}"; do
  [ -d "${tmp}/${path}/${s}" ] || missing+=("$s")
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "Upstream ${repo}@${commit} no longer has: ${missing[*]}" >&2
  echo "Remove them from upstream.lock (and ${dest}) by hand, then rerun." >&2
  exit 1
fi

# Build the new tree in a staging directory, then swap it in.
stage="${dest}.new"
rm -rf "$stage"
mkdir -p "$stage"
lock_skills='{}'
for s in "${skills[@]}"; do
  cp -r "${tmp}/${path}/${s}" "${stage}/${s}"
  sha=$(git -C "$tmp" rev-parse "HEAD:${path}/${s}")
  lock_skills=$(jq --arg k "$s" --arg v "$sha" '. + {($k): $v}' <<<"$lock_skills")
done
rm -rf "$dest"
mv "$stage" "$dest"

jq -n --arg repo "$repo" --arg ref "$ref" --arg path "$path" --arg prefix "$prefix" --arg commit "$commit" \
  --arg synced "$(date -u +%Y-%m-%d)" --argjson skills "$lock_skills" \
  '{repo: $repo, ref: $ref, path: $path, prefix: $prefix, commit: $commit, synced: $synced, skills: $skills}' \
  | tr -d '\r' > upstream.lock
echo "Synced ${#skills[@]} skills from ${repo}@${commit}."
