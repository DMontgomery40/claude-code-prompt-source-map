// A session's context for reading its local sources: product, ids, where its log is, working directory,
// time window and the harness version that wrote it. Built from the family the resolver found
// (site/trace/loader.js narrowByHint), reading only the head and tail of the root log.
import { openSync, readSync, closeSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { homedir } from "node:os";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function readRange(file, a, b) {
  const fd = openSync(file, "r");
  try { const buf = Buffer.alloc(Math.max(0, b - a)); readSync(fd, buf, 0, buf.length, a); return buf.toString("utf8"); } finally { closeSync(fd); }
}
const rows = (text) => text.split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const ms = (t) => (typeof t === "number" ? (t < 1e12 ? t * 1000 : t) : Date.parse(t));

// session: { product, id, entries: [{ path }] }. Returns { product, id, ids, log, project, cwd, start, end, version,
// originator, home, claude (Claude Code's config folder for this session), desktop (a desktop session's folder) }.
export function sessionContext(session, { home = homedir() } = {}) {
  const logs = session.entries.filter((e) => /\.jsonl$/.test(e.path)).map((e) => e.path);
  const root = logs.find((p) => basename(p).toLowerCase().includes(String(session.id).toLowerCase())) || logs[0];
  const size = statSync(root).size;
  const head = rows(readRange(root, 0, Math.min(size, 1 << 20)));
  const tail = rows(readRange(root, Math.max(0, size - (1 << 18)), size));
  const times = [...head, ...tail].map((r) => ms(r.timestamp)).filter(Number.isFinite);
  const ctx = { product: session.product, id: String(session.id).toLowerCase(), log: root, home, start: times.length ? Math.min(...times) : null, end: times.length ? Math.max(...times) : null };
  if (session.product === "claude-code") {
    ctx.ids = [ctx.id];
    ctx.project = dirname(root);
    // A Claude desktop agent-mode session keeps its own config folder: local-agent-mode-sessions/<account>/
    // <org>/local_<id>/.claude, beside its record local_<id>.json and audit.jsonl.
    const desk = /^(.*\/local-agent-mode-sessions\/[^/]+\/[^/]+\/local_[^/]+)\/\.claude\/projects\//.exec(root);
    ctx.desktop = desk ? desk[1] : null;
    ctx.claude = desk ? `${desk[1]}/.claude` : join(home, ".claude");
    const r = head.find((x) => x.cwd) || {};
    ctx.cwd = r.cwd || null;
    ctx.version = (head.find((x) => x.version) || {}).version || null;
  } else {
    ctx.ids = [...new Set(logs.map((p) => (basename(p).match(UUID) || [])[0]).filter(Boolean).map((x) => x.toLowerCase()))];
    if (!ctx.ids.includes(ctx.id)) ctx.ids.unshift(ctx.id);
    const meta = (head.find((x) => x.type === "session_meta") || {}).payload || {};
    ctx.cwd = meta.cwd || null;
    ctx.version = meta.cli_version || null;
    ctx.originator = meta.originator || null;
  }
  return ctx;
}
