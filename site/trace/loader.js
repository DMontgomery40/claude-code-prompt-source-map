// File and folder intake: sniffs every dropped .jsonl by its first line, finds
// the session roots, picks one (a hint, else the largest), gathers the files that
// belong to it and runs the product adapter.
//
// entries: [{ path, source }] where path is the dropped relative path (or an
// absolute path in Node) and source is { name, size, slice(a, b) }.
import { readFirstLine, prepareIndex } from "./model.js";
import { isCodexFirstLine, parseCodexThread, buildCodexTrace } from "./adapters/codex.js";
import { isClaudeRow, parseClaudeFile, buildClaudeTrace } from "./adapters/claude-code.js";

const stem = (p) => p.split("/").pop().replace(/\.jsonl$/, "");
// A Claude Code subagent file, recognised by its folder or, for loose files, by its first row.
const SUB_PATH = /\/subagents\/agent-([^/]+)\.jsonl$/;
const isSub = (s) => SUB_PATH.test(s.path) || (s.row?.isSidechain === true && !!s.row?.agentId);
const agentIdOf = (s) => SUB_PATH.exec(s.path)?.[1] ?? s.row?.agentId ?? /agent-([^/]+)\.jsonl$/.exec(s.path)?.[1] ?? null;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function sniff(entry) {
  try {
    const first = JSON.parse(await readFirstLine(entry.source));
    if (isCodexFirstLine(first)) return { product: "codex", meta: first.payload };
    if (isClaudeRow(first) || /\/subagents\/agent-[^/]+\.jsonl$/.test(entry.path)) return { product: "claude-code", row: first };
  } catch { /* not a log we know */ }
  return null;
}

// Finds candidate sessions among the entries without parsing whole files.
export async function findSessions(entries) {
  const jsonl = entries.filter((e) => /\.jsonl$/.test(e.path));
  const sniffed = [];
  for (const e of jsonl) {
    const s = await sniff(e);
    if (s) sniffed.push({ ...e, ...s });
  }
  const sessions = [];
  // Codex: families by parent_thread_id.
  const codex = sniffed.filter((s) => s.product === "codex");
  const byId = new Map(codex.map((s) => [s.meta.id, s]));
  const kids = new Map();
  for (const s of codex) {
    const p = s.meta.parent_thread_id;
    if (p && byId.has(p)) (kids.get(p) || kids.set(p, []).get(p)).push(s);
  }
  for (const s of codex) {
    if (s.meta.parent_thread_id && byId.has(s.meta.parent_thread_id)) continue;
    const fam = [];
    const walk = (x) => { fam.push(x); for (const k of kids.get(x.meta.id) || []) walk(k); };
    walk(s);
    sessions.push({ product: "codex", id: s.meta.id, name: s.path, entries: fam, bytes: fam.reduce((n, f) => n + f.source.size, 0) });
  }
  // Claude Code: <id>.jsonl plus <id>/subagents/agent-*.jsonl (+ .meta.json). Files picked loose,
  // without their folders, are grouped by content: subagent rows carry the root's sessionId.
  const cc = sniffed.filter((s) => s.product === "claude-code");
  const roots = cc.filter((s) => !isSub(s));
  for (const r of roots) {
    const id = stem(r.path);
    const sessionId = r.row?.sessionId || id;
    const subs = cc.filter((s) => isSub(s) && (s.path.includes(`${id}/subagents/`) || s.row?.sessionId === sessionId));
    const metas = entries.filter((e) => /\.meta\.json$/.test(e.path) && subs.some((s) => e.path.endsWith(`agent-${agentIdOf(s)}.meta.json`)));
    const toolResults = entries.filter((e) => e.path.includes(`${id}/tool-results/`));
    const fam = [r, ...subs];
    sessions.push({ product: "claude-code", id, name: r.path, entries: fam, metas, toolResults, bytes: fam.reduce((n, f) => n + f.source.size, 0) });
  }
  // Subagent files dropped without their root: one session per folder.
  const orphans = cc.filter((s) => isSub(s) && !sessions.some((x) => x.entries.includes(s)));
  if (orphans.length) {
    const id = (orphans[0].path.match(UUID) || ["subagents"])[0];
    sessions.push({ product: "claude-code", id, name: id, entries: orphans, metas: entries.filter((e) => /\.meta\.json$/.test(e.path)), toolResults: [], bytes: orphans.reduce((n, f) => n + f.source.size, 0), orphan: true });
  }
  return sessions;
}

async function readJson(source) {
  const bytes = await source.slice(0, source.size);
  return JSON.parse(new TextDecoder().decode(bytes));
}

// Loads one session into a Trace. options: { root, onProgress({ phase, done, total, file }) }.
// Returns { trace, sources } where sources[i] backs trace.files[i] (for text reads).
export async function loadTrace(entries, { root = null, onProgress = () => {}, index = null } = {}) {
  const ix = prepareIndex(index);
  onProgress({ phase: "scan", done: 0, total: entries.length });
  const sessions = await findSessions(entries);
  if (!sessions.length) throw new Error("No Codex rollout or Claude Code transcript found in the dropped files.");
  const pick = (root && sessions.find((s) => s.id === root || s.name.includes(root) || s.entries.some((e) => e.path.includes(root)))) || sessions.slice().sort((a, b) => b.bytes - a.bytes)[0];
  const total = pick.entries.reduce((n, e) => n + e.source.size, 0);
  let done = 0;
  const files = [];
  const sources = [];
  const parsed = [];
  for (const e of pick.entries) {
    const fileIndex = files.length;
    files.push({ name: e.path, size: e.source.size });
    sources.push(e.source);
    const onFile = (pos, size) => onProgress({ phase: "parse", done: done + pos, total, file: e.path, fileDone: pos >= size });
    let p;
    if (pick.product === "codex") {
      p = await parseCodexThread(e.source, fileIndex, { onProgress: onFile, index: ix });
      if (!p.meta) continue;
    } else {
      const agentId = isSub(e) ? agentIdOf(e) : null;
      let meta = null;
      if (agentId) {
        const me = (pick.metas || []).find((m) => m.path.endsWith(`agent-${agentId}.meta.json`));
        if (me) try { meta = await readJson(me.source); } catch { meta = null; }
      }
      p = await parseClaudeFile(e.source, fileIndex, { meta: meta || (agentId ? {} : null), agentId, onProgress: onFile, index: ix });
    }
    files[fileIndex].size = p.bytesRead || e.source.size;
    parsed.push(p);
    done += e.source.size;
  }
  for (const tr of pick.toolResults || []) { files.push({ name: tr.path, size: tr.source.size, role: "tool-result" }); sources.push(tr.source); }
  onProgress({ phase: "build", done: total, total });
  const trace = pick.product === "codex" ? buildCodexTrace(parsed, files) : buildClaudeTrace(parsed, files);
  // Tool results persisted under <session>/tool-results/: the block counts the
  // preview the model saw; `full` points at the whole file when it was dropped.
  const persisted = new Map(files.map((f, i) => [f, i]).filter(([f]) => f.role === "tool-result").map(([f, i]) => [f.name.split("/").pop(), i]));
  if (persisted.size) for (const a of trace.agents) for (const b of a.blocks) if (b.persisted && persisted.has(b.persisted)) {
    const i = persisted.get(b.persisted);
    b.full = { file: i, offset: 0, length: files[i].size };
  }
  trace.reference = ix ? { site: ix.site, origin: ix.origin, pages: ix.pages.length } : null;
  trace.candidates = sessions.map((s) => ({ product: s.product, id: s.id, name: s.name, files: s.entries.length, bytes: s.bytes }));
  onProgress({ phase: "done", done: total, total });
  return { trace, sources };
}
