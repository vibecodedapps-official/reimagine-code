#!/usr/bin/env node
// PreToolUse hook for the Bash and PowerShell tools. Denies a git commit, or a gh pr create or edit, whose text carries
// a Claude attribution line while the user's settings turn that attribution off. Imports only node: built-ins and fails
// open: any error allows the call and prints nothing. Not handled: messages built from variables, pipes or files written
// earlier in the same command, and a cd before the commit.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const WS = "[ \\t\\r\\n]+";
const ARG = `(?:"[^"]*"|'[^']*'|[^\\s"';&|()]+)`;
// The tool's name, bare or as a path, either one quoted, then its options (captured), then the subcommand words.
const call = (tool, options, words) => new RegExp(
  `(?:^|[\\s;&|(\`])(?:["'](?:[^"'\\n]*[\\\\/])?|[^\\s"';&|()]*[\\\\/])?${tool}(?:\\.exe)?["']?((?:${WS}${options})*)${WS}${words}(?![\\w-])`,
  "g");
const COMMIT = call("git",
  `(?:-[Cc]${WS}${ARG}|--(?:git-dir|work-tree|namespace|exec-path|config-env|attr-source)${WS}${ARG}|--?[\\w-]+(?:=${ARG})?)`,
  "commit");
const PR = call("gh", `(?:(?:-R|--repo)${WS}${ARG}|--?[\\w-]+(?:=${ARG})?)`, `pr${WS}(?:create|edit)`);
const FILE = new RegExp(`(?:^|\\s)(?:--body-file|--file|-F)(?:[ \\t]*=[ \\t]*|[ \\t]+|(?<=-F))(${ARG})`, "g");
// After the name comes an email, the end of the line, or the end of the quoted message.
const MODEL = /^\s*claude(?:\s+(?:code|opus|sonnet|haiku|fable))?(?:\s+v?\d+(?:[.-]\d+)*)?\s*(?:<|\\|["'](?=[\s;&|)]|$)|$)/i;

function claudeLine(text) {
  for (const m of text.matchAll(/co-authored-by:([^\n]*)/gi)) {
    const value = m[1].split("\\n")[0];
    if (/@anthropic\.com/i.test(value) || MODEL.test(value)) return "the Co-Authored-By line naming Claude";
  }
  return /generated with \[?claude code\]?/i.test(text) ? "the Generated with Claude Code line" : null;
}

// A path argument as the shell passes it: in Bash, an unquoted ~ is the home directory, and on Windows Git Bash reads
// /tmp as the temp directory and /c/ as drive C.
function native(arg, bash) {
  if (bash && /^~(?=\/|$)/.test(arg)) return homedir() + arg.slice(1);
  const path = arg.replace(/^(["'])(.*)\1$/, "$2");
  if (!bash || process.platform !== "win32") return path;
  return path.replace(/^\/tmp(?=\/|$)/, tmpdir().replace(/\\/g, "/")).replace(/^\/([a-z])(?=\/|$)/i, "$1:");
}

const json = (path) => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; } };

// The root that holds the local settings file: the main checkout's root, also from a subdirectory or linked worktree. Null
// on Windows, outside git, at the home directory, or when the root, .git, or .claude has another owner.
function localRoot(project) {
  if (process.platform === "win32") return null;
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"],
      { cwd: project, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).trim();
    const root = dirname(common);
    if (basename(common) !== ".git" || resolve(root) === resolve(homedir())) return null;
    const owned = (p) => { try { return statSync(p).uid === process.getuid(); } catch { return p.endsWith(".claude"); } };
    return [root, common, join(root, ".claude")].every(owned) ? root : null;
  } catch { return null; }
}

// Settings files, first to last: the first that sets a key wins. Managed drop-ins merge after managed-settings.json in
// name order, so the last name comes first; a local file left in the project directory yields to the root's.
function sources(project) {
  const dir = process.platform === "win32" ? "C:\\Program Files\\ClaudeCode"
    : process.platform === "darwin" ? "/Library/Application Support/ClaudeCode" : "/etc/claude-code";
  const drops = (() => { try { return readdirSync(join(dir, "managed-settings.d")); } catch { return []; } })()
    .filter((n) => n.endsWith(".json") && !n.startsWith(".")).sort().reverse().map((n) => join(dir, "managed-settings.d", n));
  const root = localRoot(project);
  return [...drops, join(dir, "managed-settings.json"),
    ...(root && resolve(root) !== resolve(project) ? [join(root, ".claude", "settings.local.json")] : []),
    join(project, ".claude", "settings.local.json"), join(project, ".claude", "settings.json"),
    join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "settings.json")]
    .map((path) => ({ path, data: json(path) })).filter((s) => s.data && typeof s.data === "object");
}

// What turns off the commit or PR attribution, as "<setting> is <value> in <path>", or null.
function optOut(all, key) {
  const set = all.find((s) => typeof s.data.attribution?.[key] === "string");
  if (set) return set.data.attribution[key] === "" ? `attribution.${key} is "" in ${set.path}` : null;
  const legacy = key === "commit" && all.find((s) => typeof s.data.includeCoAuthoredBy === "boolean");
  return legacy && legacy.data.includeCoAuthoredBy === false ? `includeCoAuthoredBy is false in ${legacy.path}` : null;
}

function check(payload) {
  const command = payload?.tool_input?.command;
  if (typeof command !== "string") return null;
  const bash = payload.tool_name === "Bash";
  const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
  // Each git commit with the directory its -C options move to, and each gh call, which reads files from cwd.
  const commits = [...command.matchAll(COMMIT)].map((m) => {
    const words = m[1].match(new RegExp(ARG, "g")) || [];
    const dirs = words.flatMap((w, i) => (w === "-C" && words[i + 1] ? [native(words[i + 1], bash)] : []));
    return { index: m.index, dir: resolve(cwd, ...dirs) };
  });
  const prs = [...command.matchAll(PR)].map((m) => ({ index: m.index, dir: cwd }));
  if (!commits.length && !prs.length) return null;
  const all = sources(process.env.CLAUDE_PROJECT_DIR || cwd);
  const off = [commits.length && "commit", prs.length && "pr"].filter(Boolean).map((k) => optOut(all, k)).find(Boolean);
  if (!off) return null;
  const calls = [...commits, ...prs].sort((a, b) => a.index - b.index);
  let text = command;
  for (const m of command.matchAll(FILE)) {
    const name = native(m[1], bash);
    if (name === "-" || /[$%]/.test(name)) continue;
    const owner = calls.findLast((c) => c.index < m.index);
    try { text += `\n${readFileSync(resolve(owner ? owner.dir : cwd, name), "utf8")}`; } catch { /* a missing file is skipped */ }
  }
  const line = claudeLine(text);
  return line && `ccx: remove ${line}; ${off}`;
}

try {
  const reason = check(JSON.parse(readFileSync(0, "utf8")));
  if (reason) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }));
  }
} catch { /* fail open */ }
