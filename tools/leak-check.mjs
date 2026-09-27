#!/usr/bin/env node
// The public repo and the built site must never carry this machine's identity, secrets, or David's
// private session data. Scans every file git would publish (tracked or not ignored) and site/dist.
// The forbidden values are read from this machine (home path, user, git email, ~/.env values,
// Codex auth and wrangler tokens) plus the ids of private sessions kept under private/.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => { try { return readFileSync(file, "utf8"); } catch { return ""; } };

function forbiddenValues() {
  const home = os.homedir();
  const values = new Map([[home, "home path"], [os.userInfo().username, "user name"]]);
  try { const email = execFileSync("git", ["config", "--global", "user.email"], { encoding: "utf8" }).trim(); if (email) values.set(email, "git email"); } catch {}
  for (const line of read(path.join(home, ".env")).split("\n")) {
    const value = line.replace(/^\s*(?:export\s+)?[A-Z0-9_]+\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
    if (value.length >= 12 && value !== line.trim()) values.set(value, "~/.env value");
  }
  const strings = text => [...text.matchAll(/"([^"\\]{20,})"/g)].map(m => m[1]);
  for (const file of [path.join(home, ".codex/auth.json"), path.join(home, "Library/Preferences/.wrangler/config/default.toml")]) for (const v of strings(read(file))) values.set(v, "credential");
  // Private sessions: every session id under private/sessions (file and folder names) is forbidden.
  const sessions = path.join(repo, "private", "sessions");
  if (existsSync(sessions)) for (const name of walk(sessions)) for (const id of path.basename(name).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) ?? []) values.set(id, "private session id");
  return [...values].filter(([v]) => v && v.length >= 6);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full); else yield full;
  }
}

const published = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd: repo, encoding: "utf8" }).split("\n").filter(Boolean).map(f => path.join(repo, f));
const dist = path.join(repo, "site", "dist");
const files = [...published, ...(existsSync(dist) ? walk(dist) : [])];
const forbidden = forbiddenValues();
const found = [];
for (const file of files) {
  // Only files: an untracked symlink to a folder (a worktree's linked work folder) is not text to scan.
  if (!existsSync(file) || !statSync(file).isFile() || statSync(file).size > 50_000_000) continue;
  const buf = readFileSync(file);
  if (buf.includes(0)) continue; // binary
  const text = buf.toString("utf8");
  for (const [value, kind] of forbidden) if (text.includes(value)) found.push(`${path.relative(repo, file)}: contains a ${kind} (${value.length} chars, starts "${value.slice(0, 4)}")`);
}
if (found.length) { console.error(`leak check failed (${found.length}):\n${found.slice(0, 40).join("\n")}`); process.exit(1); }
console.log(`leak check clean: ${files.length} files, ${forbidden.length} forbidden values`);
