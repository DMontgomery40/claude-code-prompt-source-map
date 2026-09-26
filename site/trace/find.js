// Full-text search over a loaded session's source files, run in the worker (worker.js "find").
// A byte scan narrows the search to the log lines that contain the query as the log writes it
// (JSON-escaped once or twice, or as is), then each block on those lines is read with readRef and
// checked against the text the reader shows. Rebuilt attachments and images are not searched, and
// case folding is ASCII-only.
import { readRef } from "./model.js";

const lineMaps = new WeakMap();
// file index -> { offsets (sorted line starts), ends: Map(line start -> line end), blocks: Map(line start -> [{ agent, block }]) }
function lineMap(trace) {
  let m = lineMaps.get(trace);
  if (m) return m;
  m = new Map();
  for (const a of trace.agents) a.blocks.forEach((b, bi) => {
    if (!b.ref || b.image || b.ref.rebuild) return;
    let f = m.get(b.ref.file);
    if (!f) m.set(b.ref.file, f = { offsets: [], ends: new Map(), blocks: new Map() });
    let list = f.blocks.get(b.ref.offset);
    if (!list) { f.blocks.set(b.ref.offset, list = []); f.offsets.push(b.ref.offset); }
    list.push({ agent: a, block: bi });
    f.ends.set(b.ref.offset, Math.max(f.ends.get(b.ref.offset) || 0, b.ref.offset + b.ref.length));
  });
  for (const f of m.values()) f.offsets.sort((x, y) => x - y);
  lineMaps.set(trace, m);
  return m;
}

// windows-1252 keeps one character per byte, so string positions are byte offsets.
const bytesAsText = new TextDecoder("latin1");
const utf8 = new TextEncoder();
const CHUNK = 8 << 20, OVERLAP = 4096;

// Finds blocks whose text contains `query` (case-insensitive). Calls onHits with batches of
// { agentId, block, snippet } and onProgress(doneBytes, totalBytes). Stops when cancelled() is true
// or after `limit` hits. Resolves { hits, truncated, cancelled }.
export async function findText(trace, sources, query, { onHits = () => {}, onProgress = () => {}, cancelled = () => false, limit = 1000, index = null } = {}) {
  const q = String(query || "").toLowerCase();
  if (!q.trim()) return { hits: 0, truncated: false, cancelled: false };
  const esc1 = JSON.stringify(q).slice(1, -1), esc2 = JSON.stringify(esc1).slice(1, -1);
  // As written in a string value (escaped once, or twice inside Codex's JSON-in-JSON arguments),
  // and as is: object-valued parts (a tool's input) are shown re-serialized, structural quotes and all.
  // The reader pretty-prints those ("key": value); the log writes them compact ("key":value).
  const needles = [...new Set([esc1, esc2, q, q.replace(/":\s+/g, '":')])].map(n => bytesAsText.decode(utf8.encode(n)).toLowerCase());
  const map = lineMap(trace);
  const files = [...map.keys()].filter(f => sources[f]).sort((x, y) => x - y);
  const total = files.reduce((n, f) => n + sources[f].size, 0);
  let done = 0, hits = 0;
  for (const f of files) {
    const src = sources[f], { offsets, ends, blocks } = map.get(f);
    const lines = new Set();
    for (let a = 0; a < src.size; a += CHUNK) {
      if (cancelled()) return { hits, truncated: false, cancelled: true };
      const s = bytesAsText.decode(await src.slice(a, Math.min(src.size, a + CHUNK + OVERLAP))).toLowerCase();
      for (const nd of needles) {
        for (let i = s.indexOf(nd); i >= 0; i = s.indexOf(nd, i + 1)) {
          if (i >= CHUNK && a + CHUNK < src.size) break; // the next chunk scans the overlap
          const line = lineAt(offsets, a + i);
          if (line != null && a + i < ends.get(line)) lines.add(line);
        }
      }
      done += Math.min(CHUNK, src.size - a);
      onProgress(done, total);
    }
    const batch = [];
    for (const line of [...lines].sort((x, y) => x - y)) {
      for (const h of blocks.get(line)) {
        if (cancelled()) return { hits, truncated: false, cancelled: true };
        const b = h.agent.blocks[h.block];
        let text;
        try { text = await readRef(src, b.ref, index); } catch { continue; }
        if (typeof text !== "string") continue;
        const lt = text.toLowerCase();
        const at = lt.indexOf(q) >= 0 ? lt.indexOf(q) : lt.indexOf(esc1);
        if (at < 0) continue;
        batch.push({ agentId: h.agent.id, block: h.block, snippet: around(text, at, lt.indexOf(q) >= 0 ? q.length : esc1.length) });
        if (++hits >= limit) { onHits(batch); return { hits, truncated: true, cancelled: false }; }
      }
    }
    if (batch.length) onHits(batch);
  }
  return { hits, truncated: false, cancelled: false };
}

// The line start at or before byte `pos` that holds a block, or null.
function lineAt(offsets, pos) {
  let lo = 0, hi = offsets.length - 1, best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offsets[mid] <= pos) { best = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return best >= 0 ? offsets[best] : null;
}

// One line of text around the match: { before, match, after }, whitespace collapsed.
function around(text, at, len, width = 180) {
  const lead = Math.floor(width / 3);
  const a = Math.max(0, at - lead), b = Math.min(text.length, at + len + width - lead);
  // A preview: JSON escapes read as the spaces they stand for.
  const flat = s => s.replace(/\\[nrt]/g, " ").replace(/\s+/g, " ");
  return { before: `${a > 0 ? "…" : ""}${flat(text.slice(a, at)).trimStart()}`, match: flat(text.slice(at, at + len)), after: `${flat(text.slice(at + len, b)).trimEnd()}${b < text.length ? "…" : ""}` };
}
