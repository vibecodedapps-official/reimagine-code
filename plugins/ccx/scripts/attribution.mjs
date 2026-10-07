#!/usr/bin/env node
// PreToolUse hook for the Bash and PowerShell tools. Denies a git commit, or a gh pr create or edit, whose text carries
// a Claude attribution line while the user's settings turn that attribution off. Imports only node: built-ins and fails
// open: any error allows the call and prints nothing. Not handled: messages built from variables, pipes or files written
// earlier in the same command, and a cd before the commit.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

const WS = "[ \\t\\r\\n]+";
const ARG = `(?:"[^"]*"|'[^']*'|[^\\s"';&|()]+)`;
// The tool's name, bare or as a path (quoted when it holds spaces), then its options (captured), then the subcommand words.
const call = (tool, options, words) => new RegExp(
  `(?:^|[\\s;&|(\`])(?:["'][^"'\\n]*[\\\\/]|[^\\s"';&|()]*[\\\\/])?${tool}(?:\\.exe)?["']?((?:${WS}${options})*)${WS}${words}(?![\\w-])`);
const COMMIT = call("git", `(?:-[Cc]${WS}${ARG}|--(?:git-dir|work-tree|namespace|exec-path|config-env|attr-source)${WS}${ARG}|--?[\\w-]+(?:=${ARG})?)`, "commit");
const DIR = new RegExp(`(?:^|${WS})-C${WS}(${ARG})`, "g");
const unquote = (arg) => arg.replace(/^(["'])(.*)\1$/, "$2");
const PR = call("gh", `(?:(?:-R|--repo)${WS}${ARG}|--?[\\w-]+(?:=${ARG})?)`, `pr${WS}(?:create|edit)`);
const FILE = new RegExp(`(?:^|\\s)(?:--body-file|--file|-F)(?:[ \\t]*=[ \\t]*|[ \\t]+|(?<=-F))(${ARG})`, "g");
const MODEL = /^\s*claude(?:\s+(?:code|opus|sonnet|haiku|fable))?(?:\s+v?\d+(?:[.-]\d+)*)?["'\s\\]*(?:<|$)/i;

function claudeLine(text) {
  for (const m of text.matchAll(/co-authored-by:([^\n]*)/gi)) {
    const value = m[1].split("\\n")[0];
    if (/@anthropic\.com/i.test(value) || MODEL.test(value)) return "the Co-Authored-By line naming Claude";
  }
  return /generated with \[?claude code\]?/i.test(text) ? "the Generated with Claude Code line" : null;
}

const json = (path) => { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; } };

// The root that holds the local settings file: the main checkout's root, also from a subdirectory or linked worktree. Null
// on Windows, outside git, at the home directory, or when the root, .git, or .claude has another owner.
function localRoot(project) {
  if (process.platform === "win32") return null;
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: project, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }).trim();
    const root = dirname(common);
    if (basename(common) !== ".git" || resolve(root) === resolve(homedir())) return null;
    return [root, common, join(root, ".claude")].every((p) => { try { return statSync(p).uid === process.getuid(); } catch { return p.endsWith(".claude"); } }) ? root : null;
  } catch { return null; }
}

// Settings files, first to last: the first that sets a key wins. Managed drop-ins merge after managed-settings.json in
// name order, so the last name comes first; a local file left in the project directory yields to the root's.
function sources(project) {
  const dir = process.platform === "win32" ? "C:\\Program Files\\ClaudeCode" : process.platform === "darwin" ? "/Library/Application Support/ClaudeCode" : "/etc/claude-code";
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
  const [commit, pr] = typeof command === "string" ? [COMMIT.exec(command), PR.exec(command)] : [];
  if (!commit && !pr) return null;
  const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
  const all = sources(process.env.CLAUDE_PROJECT_DIR || cwd);
  const off = [commit && "commit", pr && "pr"].filter(Boolean).map((k) => optOut(all, k)).find(Boolean);
  if (!off) return null;
  const gitCwd = commit ? resolve(cwd, ...[...commit[1].matchAll(DIR)].map((d) => unquote(d[1]))) : cwd;
  let text = command;
  for (const m of command.matchAll(FILE)) {
    const name = unquote(m[1]);
    if (name === "-" || /[$%]/.test(name)) continue;
    const ownedByCommit = commit && m.index > commit.index && !(pr && pr.index > commit.index && m.index > pr.index);
    try { text += `\n${readFileSync(resolve(ownedByCommit ? gitCwd : cwd, name), "utf8")}`; } catch { /* a missing file is skipped */ }
  }
  const line = claudeLine(text);
  return line && `ccx: remove ${line}; ${off}`;
}

try {
  const reason = check(JSON.parse(readFileSync(0, "utf8")));
  if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
} catch { /* fail open */ }
