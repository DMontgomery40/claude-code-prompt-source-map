#!/usr/bin/env node
// Files a network capture beside the session log it belongs to, where Trace picks it up whenever that
// session opens (by pasted id, the folder picker, a dropped session folder, or the local resolver):
//
//   Claude Code:   ~/.claude/projects/<project>/<session id>/network/<capture>.har
//   Codex/ChatGPT: ~/.codex/sessions/YYYY/MM/DD/<rollout name>.<capture>.har, beside the thread's rollout
//
// The capture's own requests say which session they are (captureSessions in site/trace/network). A capture
// that holds several Claude Code sessions (a /clear, a resume) is filed with each of them; a Codex/ChatGPT
// capture goes beside its root thread, since subagent threads open with their root. Codex/ChatGPT only
// reads `rollout-*.jsonl` in its sessions folder, so a .har beside a rollout is left alone.
//
//   node tools/capture/file-capture.mjs [--move] [--claude-root DIR] [--codex-root DIR] capture.har…
//
// Without --move the capture is copied (the original stays where it is). The filed copy is readable by
// you only: it holds your prompts and account details, like the session log itself.
import { chmodSync, copyFileSync, constants, existsSync, linkSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, openSync, readSync, closeSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { captureSessions } from "../../site/trace/network/capture.js";
import { codexMeta, isCodexFirstLine } from "../../site/trace/adapters/codex.js";

const PRODUCT_NAME = { "claude-code": "Claude Code", codex: "Codex/ChatGPT" };
export const defaultRoots = () => ({
  "claude-code": path.join(os.homedir(), ".claude", "projects"),
  codex: path.join(os.homedir(), ".codex", "sessions"),
});

function dirs(dir) {
  try { return readdirSync(dir, { withFileTypes: true }); } catch (e) { if (e.code === "ENOENT") return []; throw e; }
}

// Claude Code: <root>/<project>/<id>.jsonl for each id.
function claudeLogs(root, ids) {
  const out = new Map();
  for (const p of dirs(root)) {
    if (!p.isDirectory()) continue;
    for (const id of ids) if (!out.has(id) && existsSync(path.join(root, p.name, `${id}.jsonl`))) out.set(id, path.join(root, p.name, `${id}.jsonl`));
  }
  return out;
}

// Codex/ChatGPT: rollout-<stamp>-<id>.jsonl anywhere under the sessions folder.
function codexLogs(root, ids) {
  const out = new Map();
  const walk = (dir) => {
    for (const e of dirs(dir)) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && /^rollout-.*\.jsonl$/.test(e.name)) {
        const id = ids.find((x) => e.name.toLowerCase().endsWith(`-${x}.jsonl`));
        if (id && !out.has(id)) out.set(id, p);
      }
    }
  };
  walk(root);
  return out;
}

// A rollout's parent thread, from its first line (a session_meta row), else null.
function parentThread(file) {
  const fd = openSync(file, "r");
  try {
    let text = "";
    const buf = Buffer.alloc(65536);
    for (let at = 0; ; ) {
      const n = readSync(fd, buf, 0, buf.length, at);
      if (!n) break;
      text += buf.toString("utf8", 0, n);
      at += n;
      if (text.includes("\n")) break;
    }
    const row = JSON.parse(text.split("\n")[0]);
    return isCodexFirstLine(row) ? codexMeta(row.payload).parent_thread_id : null;
  } catch { return null; } finally { closeSync(fd); }
}

// Where a capture goes: { product, sessions, places: [{ id, log, dest }], missing: [id] }. Reads, writes nothing.
export function planFiling(harFile, roots = defaultRoots()) {
  const { product, sessions } = captureSessions(readFileSync(harFile, "utf8"));
  if (product !== "claude-code" && product !== "codex") {
    throw new Error(product === "browser"
      ? "This is a browser capture of a web chat; it has no session log to be filed beside."
      : "No Claude Code or Codex/ChatGPT traffic in this capture.");
  }
  const ids = sessions.map((s) => s.id);
  if (!ids.length) throw new Error(`No ${PRODUCT_NAME[product]} session id in this capture's requests.`);
  const logs = product === "claude-code" ? claudeLogs(roots["claude-code"], ids) : codexLogs(roots.codex, ids);
  const base = path.basename(harFile).replace(/\.har$/i, "");
  let found = ids.filter((id) => logs.has(id));
  // Codex/ChatGPT: a subagent thread whose parent is in the capture opens with it; file the capture once.
  if (product === "codex") {
    const roots = found.filter((id) => !found.includes(String(parentThread(logs.get(id)) || "").toLowerCase()));
    found = roots.length ? roots : found.slice(0, 1);
  }
  const places = found.map((id) => {
    const log = logs.get(id);
    const dest = product === "claude-code"
      ? path.join(path.dirname(log), id, "network", `${base}.har`)
      : path.join(path.dirname(log), `${path.basename(log, ".jsonl")}.${base}.har`);
    return { id, log, dest };
  });
  return { product, sessions, places, missing: ids.filter((id) => !logs.has(id)) };
}

// A destination that is not taken yet: name.har, name-2.har, …
function free(dest) {
  if (!existsSync(dest)) return dest;
  for (let n = 2; ; n++) { const d = dest.replace(/\.har$/i, `-${n}.har`); if (!existsSync(d)) return d; }
}

// Files the capture. Returns the plan with each place's final `dest`. Throws when no session log is found.
export function fileCapture(harFile, { move = false, roots = defaultRoots() } = {}) {
  const plan = planFiling(harFile, roots);
  if (!plan.places.length) {
    const ids = plan.missing.slice(0, 3).map((id) => `${id.slice(0, 8)}…`).join(", ");
    throw new Error(`No log on this machine for the ${PRODUCT_NAME[plan.product]} session${plan.missing.length === 1 ? "" : "s"} in this capture (${ids}).`);
  }
  let first = null;
  for (const place of plan.places) {
    mkdirSync(path.dirname(place.dest), { recursive: true });
    place.dest = free(place.dest);
    if (!first) {
      if (move) {
        try { renameSync(harFile, place.dest); } catch (e) {
          if (e.code !== "EXDEV") throw e;
          copyFileSync(harFile, place.dest, constants.COPYFILE_EXCL); unlinkSync(harFile);
        }
      } else copyFileSync(harFile, place.dest, constants.COPYFILE_EXCL);
      chmodSync(place.dest, 0o600);
      first = place.dest;
    } else {
      try { linkSync(first, place.dest); } catch { copyFileSync(first, place.dest, constants.COPYFILE_EXCL); chmodSync(place.dest, 0o600); }
    }
  }
  return plan;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const roots = defaultRoots();
  let move = false;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--move") move = true;
    else if (args[i] === "--claude-root") roots["claude-code"] = args[++i];
    else if (args[i] === "--codex-root") roots.codex = args[++i];
    else if (args[i] === "-h" || args[i] === "--help") { console.log("usage: file-capture.mjs [--move] [--claude-root DIR] [--codex-root DIR] capture.har…"); process.exit(0); }
    else files.push(args[i]);
  }
  if (!files.length) { console.error("file-capture: name a .har to file"); process.exit(2); }
  let failed = 0;
  for (const f of files) {
    try {
      const plan = fileCapture(f, { move, roots });
      for (const p of plan.places) console.error(`capture: filed beside ${PRODUCT_NAME[plan.product]} session ${p.id}: ${p.dest}`);
      console.error("capture: Trace attaches it when you open that session.");
    } catch (e) {
      failed++;
      console.error(`capture: couldn't file ${f}: ${e.message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
