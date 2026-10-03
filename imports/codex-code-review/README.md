# codex-code-review

A Codex plugin marketplace with two plugins built from the code-review skills in the
[openai/codex](https://github.com/openai/codex/tree/main/.codex/skills) repository:

- `codex-code-review`: the upstream skills copied unmodified.
- `codex-code-review-general`: a hand-maintained adaptation of the same five skills
  for use on any repository. See "Generalized variant" below.

The verbatim plugin contains five skills. `code-review` is the orchestrator: it runs one
subagent per companion skill and returns every finding. The companions are
`code-review-breaking-changes`, `code-review-change-size`, `code-review-context`,
and `code-review-testing`.

## Install

1. Add this repository as a marketplace:

   ```sh
   codex plugin marketplace add vibecodedapps-official/codex-code-review
   ```

2. In Codex, run `/plugins`, find "Codex Code Review", and install one or both
   plugins. Or enable them in `~/.codex/config.toml`:

   ```toml
   [plugins."codex-code-review@codex-code-review"]
   enabled = true

   [plugins."codex-code-review-general@codex-code-review"]
   enabled = true
   ```

3. Ask Codex to "run the code-review skill on this pull request", or
   "run the general-code-review skill" for the generalized variant.

## Caveats

The skills are written for the Codex repository itself. `code-review-context` and
`code-review-testing` reference Rust paths such as `core/context` and `core/suite`,
and `code-review-breaking-changes` lists Codex's own integration surfaces. Expect
some findings that do not apply to other projects. The orchestrator also adds a
`code-reviewed` GitHub label when the reviewer owns the pull request.

Upstream's `code-review-breaking-changes` directory declares `name:
code-breaking-changes` in its frontmatter. It is kept as is.

## Generalized variant

The skills in `plugins/codex-code-review-general/` map one to one onto the upstream
skills, with the `general-` prefix so both plugins can be installed together. The
orchestrator names its four companions explicitly and does not add labels. The
breaking-changes skill lists generic surfaces (public APIs, CLI, configuration,
persisted formats, wire formats) instead of Codex's own. The context skill applies
only when the diff touches code that assembles a language model's context, and
reports nothing otherwise. The testing skill defers to the repository's own test
harness and file conventions. The change-size skill is unchanged.

Do not enable both plugins at once. The verbatim orchestrator tells the model to use
"all code-review-* skills", and the general skill names contain that substring, so
a dual install can run each companion twice. Install one plugin, or enable both and
invoke only `general-code-review`.

Each general SKILL.md carries a comment naming the upstream file and commit it was
adapted from, as the Apache license requires for modified files.

This variant is maintained by hand from the upstream commit pinned in
`upstream.lock`. The drift check does not cover it. A drift failure is the cue to
re-read the upstream diff and decide whether the general skills need the same change.

## Staying in sync with upstream

`upstream.lock` pins the upstream commit and the git tree sha of each skill
directory. The tree sha changes whenever any file under that directory changes.

- `scripts/check-local.sh` hashes the committed copy of each verbatim skill and
  compares it against the lock. Offline. The `upstream drift` workflow runs it on
  every push and pull request, so an edit to a verbatim skill fails CI.
- `scripts/check-upstream.sh` makes one GitHub API call and compares upstream's
  current tree shas against the lock. It exits non-zero on drift. The workflow runs
  it weekly and on demand only, so upstream changes do not fail unrelated pull
  requests.
- `scripts/sync-upstream.sh` re-copies the skills from upstream and rewrites the
  lock. It refuses to run if a pinned skill no longer exists upstream. Review the
  diff, then commit.
- The upstream check also fails when upstream adds a directory whose name starts
  with the `prefix` in the lock. To adopt it, add `"<name>": ""` under `skills` in
  `upstream.lock` and run the sync script. To ignore it, rename the prefix.
- `ref` in the lock may be a branch, a tag, or a commit sha.

The scripts need `git` and `jq`. The upstream check also needs an authenticated `gh`.

## License

Apache-2.0, the same license as upstream. See `LICENSE` and `NOTICE`.
