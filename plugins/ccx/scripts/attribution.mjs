#!/usr/bin/env node
// PreToolUse hook for the Bash and PowerShell tools. Denies a git commit, or a gh pr create or edit, whose text carries
// a Claude attribution line while the user's settings turn that attribution off. Imports only node: built-ins and fails
// open: any error allows the call and prints nothing. Not handled: messages built from variables, pipes or files written
// earlier in the same command, and a cd before the commit.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const WS = "[ \\t\\r\\n]+";
const ARG = `(?:"[^"]*"|'[^']*'|[^\\s"';&|()]+)`;
// The tool's name, bare or as a path (quoted when it holds spaces), then its options, then the subcommand words.
const call = (tool, options, words) => new RegExp(
  `(?:^|[\\s;&|(\`])(?:["'][^"'\\n]*[\\\\/]|[^\\s"';&|()]*[\\\\/])?${tool}(?:\\.exe)?["']?(?:${WS}${options})*${WS}${words}(?![\\w-])`);
const COMMIT = call("git", `(?:-[Cc]${WS}${ARG}|--(?:git-dir|work-tree|namespace|exec-path)${WS}${ARG}|--?[\\w-]+(?:=${ARG})?)`, "commit");
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

// Settings files, first to last: the first that sets a key wins.
function sources(project) {
  const managed = process.platform === "win32" ? "C:\\Program Files\\ClaudeCode\\managed-settings.json"
    : process.platform === "darwin" ? "/Library/Application Support/ClaudeCode/managed-settings.json" : "/etc/claude-code/managed-settings.json";
  const user = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "settings.json");
  return [managed, join(project, ".claude", "settings.local.json"), join(project, ".claude", "settings.json"), user]
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
  const key = COMMIT.test(command) ? "commit" : PR.test(command) ? "pr" : null;
  if (!key) return null;
  const cwd = typeof payload.cwd === "string" ? payload.cwd : process.cwd();
  const all = sources(process.env.CLAUDE_PROJECT_DIR || cwd);
  const off = optOut(all, key);
  if (!off) return null;
  let text = command;
  for (const m of command.matchAll(FILE)) {
    const name = m[1].replace(/^(["'])(.*)\1$/, "$2");
    if (name === "-" || /[$%]/.test(name)) continue;
    try { text += `\n${readFileSync(resolve(cwd, name), "utf8")}`; } catch { /* a missing file is skipped */ }
  }
  const line = claudeLine(text);
  return line && `ccx: remove ${line}; ${off}`;
}

try {
  const reason = check(JSON.parse(readFileSync(0, "utf8")));
  if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } }));
} catch { /* fail open */ }
