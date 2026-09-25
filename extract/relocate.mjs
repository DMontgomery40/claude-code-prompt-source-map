// Moves every provenance record in outputs/*.json from one Claude Code build to the next by
// content, so records whose source text did not change stay exact without re-running the
// area extractors. Anything whose content changed is reported instead of guessed.
//   node extract/relocate.mjs <previous-work-dir> <new-work-dir> <new-version>
// Writes outputs/*.json and outputs/*.md in place and <new-work-dir>/relocation-report.json.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as walk from "acorn-walk";
import { byteMapper, indexExtraction, literalsWithin, parseSource } from "./literals.mjs";

const [prevDir, newDir, newVersion] = process.argv.slice(2);
const root = new URL("../", import.meta.url).pathname;
const skip = new Set(["inventory.json", "other-model-text.json", "status.json", "environment-variables.json", "capture-summary.json"]);
const sha = buf => createHash("sha256").update(buf).digest("hex");

const loadManifest = dir => new Map(JSON.parse(readFileSync(path.join(dir, "embedded-manifest.json"), "utf8")).files.map(f => [f.name.replace("/$bunfs/root/", ""), f]));
const prevManifest = loadManifest(prevDir);
const newManifest = loadManifest(newDir);
const newBySha = new Map([...newManifest].map(([name, f]) => [f.sha256, name]));
const prevIndex = indexExtraction(prevDir);
const newIndex = indexExtraction(newDir);
const bytes = new Map();
const fileBytes = (dir, name) => { const k = `${dir}\0${name}`; if (!bytes.has(k)) bytes.set(k, readFileSync(path.join(dir, "extracted", name))); return bytes.get(k); };

const minified = /^[A-Za-z_$][\w$]{0,2}$/;
const keywords = new Set(["if", "in", "do", "for", "let", "new", "try", "var", "case", "else", "enum", "null", "this", "true", "void", "with", "await", "break", "catch", "class", "const", "false", "super", "throw", "while", "yield", "delete", "export", "import", "return", "switch", "typeof", "default", "extends", "finally", "continue", "debugger", "function", "instanceof", "of", "async", "get", "set", "env"]);
const escape = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");

// A code slice becomes a pattern: short (minified) identifiers match any short identifier,
// string and template literals match any literal of the same kind (their contents are
// compared exactly afterwards through the literal index), everything else must match.
const anyLiteral = { '"': '"(?:[^"\\\\]|\\\\.)*"', "'": "'(?:[^'\\\\]|\\\\.)*'", "`": "`(?:[^`\\\\]|\\\\.)*`" };
function codePattern(slice) {
  const tokens = slice.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|\S/g) ?? [];
  if (tokens.length > 6000) return null;
  try {
    return new RegExp(tokens.map(t => anyLiteral[t[0]] ?? (minified.test(t) && !keywords.has(t) ? "[A-Za-z_$][\\w$]{0,2}" : escape(t))).join("\\s*"), "g");
  } catch {
    return null;
  }
}

function uniqueNew(lit) {
  const matches = newIndex.byNorm.get(lit.norm) ?? [];
  if (matches.length <= 1) return matches[0] ?? null;
  // Disambiguate identical literals by their neighbours.
  const prevLits = prevIndex.files.get(lit.file);
  const around = [prevLits[lit.i - 1]?.norm, prevLits[lit.i + 1]?.norm];
  const scored = matches.map(m => { const lits = newIndex.files.get(m.file); return [m, (lits[m.i - 1]?.norm === around[0]) + (lits[m.i + 1]?.norm === around[1])]; });
  scored.sort((a, b) => b[1] - a[1]);
  return scored[0][1] > 0 && scored[0][1] !== scored[1]?.[1] ? scored[0][0] : null;
}

// All embedded files of the new build in one buffer, for exact byte searches.
const newNames = [...newManifest.keys()].filter(n => !n.endsWith(".zst"));
const parts = [], bounds = [];
let total = 0;
for (const name of newNames) { const b = fileBytes(newDir, name); bounds.push({ name, start: total }); parts.push(b); total += b.length; }
const corpus = Buffer.concat(parts);
function locate(pos) {
  let lo = 0, hi = bounds.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (bounds[mid].start <= pos) lo = mid; else hi = mid - 1; }
  return { file: bounds[lo].name, rel: pos - bounds[lo].start };
}
function occurrences(needle, limit = 50) {
  const out = [];
  for (let i = corpus.indexOf(needle); i !== -1 && out.length < limit; i = corpus.indexOf(needle, i + 1)) out.push(locate(i));
  return out.filter(o => o.rel + needle.length <= fileBytes(newDir, o.file).length);
}

// Old file -> new file and position shift, learned from ranges that relocated uniquely.
const shifts = new Map();
function learn(oldFile, oldRel, newFile, newRel) {
  const list = shifts.get(oldFile) ?? []; shifts.set(oldFile, list);
  list.push({ oldRel, newFile, delta: newRel - oldRel });
}
function predict(oldFile, oldRel) {
  const list = shifts.get(oldFile);
  if (!list?.length) return null;
  let lo = 0, hi = list.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (list[mid].oldRel < oldRel) lo = mid + 1; else hi = mid; }
  const near = [list[lo], list[lo - 1]].filter(Boolean).sort((a, b) => Math.abs(a.oldRel - oldRel) - Math.abs(b.oldRel - oldRel))[0];
  return { file: near.newFile, rel: oldRel + near.delta };
}

// Dense position map: every literal that is unique in both builds is a sample.
{
  const oldCounts = new Map();
  for (const [norm, list] of prevIndex.byNorm) if (norm.length >= 16) oldCounts.set(norm, list.length);
  for (const [norm, count] of oldCounts) {
    if (count !== 1) continue;
    const after = newIndex.byNorm.get(norm);
    if (after?.length !== 1) continue;
    const before = prevIndex.byNorm.get(norm)[0];
    learn(before.file, before.bs, after[0].file, after[0].bs);
  }
  for (const list of shifts.values()) list.sort((a, b) => a.oldRel - b.oldRel);
}
const found = (file, rel, length) => {
  const buf = fileBytes(newDir, file).subarray(rel, rel + length);
  return { status: "same", file, offset: newManifest.get(file).file_offset + rel, length, sha256: sha(buf) };
};

// Pass 1 strategy: exact bytes that occur once in the new build.
function relocateExact(p) {
  const prev = prevManifest.get(p.file);
  if (!prev) return { status: "missing", reason: "file not in previous build" };
  const rel = p.binary_offset - prev.file_offset;
  if (rel === 0 && p.length === prev.length) {
    const name = newBySha.get(prev.sha256);
    if (name) { const f = newManifest.get(name); return { status: "same", file: name, offset: f.file_offset, length: f.length, sha256: f.sha256 }; }
    return { status: "changed", reason: "embedded file content changed" };
  }
  const oldBytes = fileBytes(prevDir, p.file).subarray(rel, rel + p.length);
  const hits = occurrences(oldBytes);
  if (hits.length === 1) { learn(p.file, rel, hits[0].file, hits[0].rel); return found(hits[0].file, hits[0].rel, p.length); }
  return { status: "pending", rel, oldBytes, hits };
}

// Code ranges that are whole syntax nodes (a call chain, an object, a function) can be
// followed to the corresponding node in the new build even when their contents changed:
// anchor on a literal inside that still exists, then take its smallest enclosing node of
// the same type that starts with the same code shape.
const asts = new Map();
function astOf(dir, file) {
  const k = `${dir}\0${file}`;
  if (!asts.has(k)) {
    const src = fileBytes(dir, file).toString("utf8");
    let ast = null;
    try { ast = parseSource(src); } catch {}
    asts.set(k, { ast, toByte: byteMapper(src), src });
    if (asts.size > 24) asts.delete(asts.keys().next().value);
  }
  return asts.get(k);
}
function nodesAt(entry, predicate) {
  const out = [];
  if (!entry.ast) return out;
  walk.full(entry.ast, n => { if (predicate(n)) out.push(n); });
  return out;
}
// The first or last few tokens of a whole node as a pattern anchored at that end. Tokenizing
// the whole node keeps literals intact; a call chain prefix (every link of `a.b().c().d()`
// starts at the same byte) is told apart by where it ends.
function edgePattern(slice, edge) {
  const tokens = slice.match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|\S/g) ?? [];
  const source = (edge === "head" ? tokens.slice(0, 10) : tokens.slice(-8)).map(t => anyLiteral[t[0]] ?? (minified.test(t) && !keywords.has(t) ? "[A-Za-z_$][\\w$]{0,2}" : escape(t))).join("\\s*");
  try {
    return new RegExp(edge === "head" ? `^(?:${source})` : `(?:${source})$`);
  } catch {
    return null;
  }
}
function followNode(p, rel, inside) {
  const old = astOf(prevDir, p.file);
  const oldNode = nodesAt(old, n => old.toByte(n.start) === rel && old.toByte(n.end) === rel + p.length)[0];
  if (!oldNode) return null;
  const head = edgePattern(old.src.slice(oldNode.start, oldNode.end), "head");
  const tail = edgePattern(old.src.slice(oldNode.start, oldNode.end), "tail");
  // Anchor on the literal nearest the end: the smallest enclosing node of a late literal is
  // the one that ends where the old range ended, not a shorter prefix of the same chain.
  for (const lit of inside.filter(l => l.norm.length >= 8).reverse()) {
    const t = uniqueNew(lit);
    if (!t) continue;
    const cur = astOf(newDir, t.file);
    const candidates = nodesAt(cur, n => n.type === oldNode.type && cur.toByte(n.start) <= t.bs && cur.toByte(n.end) >= t.be)
      .sort((a, b) => (a.end - a.start) - (b.end - b.start));
    const match = candidates.find(n => (!head || head.test(cur.src.slice(n.start, Math.min(n.end, n.start + 20000))))
      && (!tail || tail.test(cur.src.slice(Math.max(n.start, n.end - 2000), n.end))));
    if (match) return { file: t.file, rel: cur.toByte(match.start), length: cur.toByte(match.end) - cur.toByte(match.start) };
  }
  return null;
}

// Last resort for evidence ranges: the function or object in the new build, closest in size
// to the old range, that encloses a literal from the old range that still exists exactly once.
function enclosingOfSurvivor(p, rel, inside) {
  for (const lit of [...inside].sort((a, b) => b.norm.length - a.norm.length)) {
    if (lit.norm.length < 12) break;
    const t = uniqueNew(lit);
    if (!t) continue;
    const cur = astOf(newDir, t.file);
    const size = n => cur.toByte(n.end) - cur.toByte(n.start);
    const node = nodesAt(cur, n => /Function|ObjectExpression|ClassBody/.test(n.type) && cur.toByte(n.start) <= t.bs && cur.toByte(n.end) >= t.be)
      .sort((a, b) => Math.abs(size(a) - p.length) - Math.abs(size(b) - p.length))[0];
    if (node) return { file: t.file, rel: cur.toByte(node.start), length: size(node) };
  }
  return null;
}

// Pass 2: duplicates resolved by predicted position; changed code located by pattern.
function relocateByPosition(p, pending, itemSamples) {
  const { rel, oldBytes, hits } = pending;
  const nearItem = itemSamples?.reduce((best, s) => (!best || Math.abs(s.oldRel - rel) < Math.abs(best.oldRel - rel) ? s : best), null);
  const guess = nearItem ? { file: nearItem.newFile, rel: rel + nearItem.delta } : predict(p.file, rel);
  if (hits.length > 1) {
    if (!guess) return { status: "ambiguous", reason: `same bytes occur ${hits.length}+ times and no position estimate` };
    // Nearest exact occurrence to the predicted position in the predicted file.
    const buf = fileBytes(newDir, guess.file);
    const from = Math.max(0, Math.min(buf.length, guess.rel));
    const after = buf.indexOf(oldBytes, from), before = buf.lastIndexOf(oldBytes, from);
    const options = [after, before].filter(i => i !== -1 && Math.abs(i - guess.rel) < 200000);
    if (!options.length) return { status: "ambiguous", reason: "duplicates, none near the expected position" };
    const at = options.sort((a, b) => Math.abs(a - guess.rel) - Math.abs(b - guess.rel))[0];
    return found(guess.file, at, p.length);
  }
  // The bytes changed. Code ranges may only differ in minified names.
  const inside = literalsWithin(prevIndex, p.file, rel, rel + p.length);
  let target = guess;
  if (!target) {
    const anchor = inside.filter(l => l.norm.length >= 12).map(l => [l, uniqueNew(l)]).find(([, t]) => t);
    if (anchor) target = { file: anchor[1].file, rel: rel + (anchor[1].bs - anchor[0].bs) };
  }
  if (!target) return { status: "changed", reason: "text changed and no position estimate", old_text: oldBytes.toString("utf8").slice(0, 300) };
  const pattern = codePattern(oldBytes.toString("utf8"));
  if (!pattern) return { status: "changed", reason: "range too large to match by pattern" };
  const newFile = fileBytes(newDir, target.file);
  const lo = Math.max(0, target.rel - 60000), hi = Math.min(newFile.length, target.rel + p.length + 60000);
  const windowText = newFile.subarray(lo, hi).toString("utf8");
  let best = null;
  for (const m of windowText.matchAll(pattern)) {
    const start = lo + Buffer.byteLength(windowText.slice(0, m.index));
    if (!best || Math.abs(start - target.rel) < Math.abs(best.start - target.rel)) best = { start, length: Buffer.byteLength(m[0]) };
  }
  if (!best) {
    const node = followNode(p, rel, inside) ?? enclosingOfSurvivor(p, rel, inside);
    // A node half or twice the old size is a different node until someone has looked.
    if (node && (node.length * 2 < p.length || node.length > p.length * 2)) return { status: "changed", reason: `nearest code node is ${node.length} bytes, was ${p.length}`, old_text: oldBytes.toString("utf8").slice(0, 300), near_file: node.file };
    if (node) return { ...found(node.file, node.rel, node.length), status: "reshaped", reason: "same code node, contents changed" };
    return { status: "changed", reason: "text or code in this range changed", old_text: oldBytes.toString("utf8").slice(0, 300), near_file: target.file };
  }
  // A lone literal's pattern matches any literal; one half or twice the size is not this one.
  if (best.length * 2 < p.length || best.length > p.length * 2) return { status: "changed", reason: `nearest match is ${best.length} bytes, was ${p.length}`, old_text: oldBytes.toString("utf8").slice(0, 300), near_file: target.file };
  const oldNorms = inside.map(l => l.norm).join("\u0001");
  const newNorms = literalsWithin(newIndex, target.file, best.start, best.start + best.length).map(l => l.norm).join("\u0001");
  if (oldNorms !== newNorms) return { ...found(target.file, best.start, best.length), status: "reshaped", reason: "text inside this range changed" };
  return found(target.file, best.start, best.length);
}

function* provenanceObjects(v) {
  if (Array.isArray(v)) for (const x of v) yield* provenanceObjects(x);
  else if (v && typeof v === "object") {
    if (typeof v.binary_offset === "number" && typeof v.file === "string") yield v;
    for (const x of Object.values(v)) yield* provenanceObjects(x);
  }
}

const report = { version: newVersion, areas: {} };
const substitutions = new Map();
const areas = readdirSync(path.join(root, "outputs")).filter(f => f.endsWith(".json") && !skip.has(f) && !f.endsWith("-tags.json")).map(name => ({ name, data: JSON.parse(readFileSync(path.join(root, "outputs", name), "utf8")) }));
const results = new Map();
for (const { data } of areas) for (const item of data.items ?? []) for (const p of provenanceObjects(item)) results.set(p, relocateExact(p));
for (const list of shifts.values()) list.sort((a, b) => a.oldRel - b.oldRel);
// Pass 2 per item: an item's own uniquely relocated ranges are the best position estimate
// for its remaining ranges (a tool's code moves between chunks as a unit).
for (const { data } of areas) for (const item of data.items ?? []) {
  const entries = [...provenanceObjects(item)];
  const local = new Map();
  for (const p of entries) {
    const r = results.get(p);
    if (r.status !== "same") continue;
    const list = local.get(p.file) ?? []; local.set(p.file, list);
    list.push({ oldRel: p.binary_offset - prevManifest.get(p.file).file_offset, newFile: r.file, delta: (r.offset - newManifest.get(r.file).file_offset) - (p.binary_offset - prevManifest.get(p.file).file_offset) });
  }
  for (const p of entries) {
    const r = results.get(p);
    if (r.status === "pending") results.set(p, relocateByPosition(p, r, local.get(p.file)));
  }
}
// A reshaped range only matters for an item if text the item publishes changed: every
// literal piece from the old range that appears in the item must still be in the new range.
function itemStrings(item) {
  const out = [];
  const visit = v => { if (typeof v === "string") out.push(v); else if (Array.isArray(v)) v.forEach(visit); else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) if (k !== "provenance") visit(x); };
  visit(item);
  return out.join("\n");
}
const newPieces = new Set();
for (const lits of newIndex.files.values()) for (const l of lits) for (const x of l.norm.split("\u0000")) if (x.trim().length >= 3) newPieces.add(x);
function publishedTextKept(item, p) {
  const prev = prevManifest.get(p.file);
  const rel = p.binary_offset - prev.file_offset;
  const strings = itemStrings(item);
  const published = literalsWithin(prevIndex, p.file, rel, rel + p.length).flatMap(l => l.norm.split("\u0000")).filter(x => x.trim().length >= 3 && strings.includes(x));
  return published.every(x => newPieces.has(x));
}

// A range cited by several items is shared evidence (for example the whole root-command
// definition behind every CLI flag). When its contents change, update its offsets and
// report it once instead of flagging every item that cites it.
const refs = new Map();
for (const p of results.keys()) { const k = `${p.file}:${p.binary_offset}:${p.length}`; refs.set(k, (refs.get(k) ?? 0) + 1); }
const sharedChanged = new Map();
// Items with at least one exactly relocated range.
const anchored = new Set();
for (const { data } of areas) for (const item of data.items ?? []) if ([...provenanceObjects(item)].some(p => results.get(p).status === "same")) anchored.add(item);
for (const { name, data } of areas) {
  const area = { same: 0, reshaped_shared: 0, changed: [], items_changed: 0 };
  for (const item of data.items ?? []) {
    let itemChanged = false;
    for (const p of provenanceObjects(item)) {
      const r = results.get(p);
      const key = `${p.file}:${p.binary_offset}:${p.length}`;
      const shared = refs.get(key) >= 3;
      const usable = r.status === "same" || r.status === "reshaped";
      if (!usable || (r.status === "reshaped" && !shared && !(anchored.has(item) && publishedTextKept(item, p)))) {
        itemChanged = true;
        area.changed.push({ area: name.replace(/\.json$/, ""), id: item.id, title: item.title, file: p.file, binary_offset: p.binary_offset, status: r.status, reason: r.reason, old_text: r.old_text, near_file: r.near_file });
      }
      if (!usable) continue;
      if (r.status === "reshaped" && shared) { area.reshaped_shared += 1; sharedChanged.set(key, { file: r.file, binary_offset: r.offset, cited_by: refs.get(key) }); }
      else area.same += 1;
      substitutions.set(String(p.binary_offset), String(r.offset));
      substitutions.set(p.file, r.file);
      if (p.sha256) substitutions.set(p.sha256, r.sha256);
      Object.assign(p, { file: r.file, binary_offset: r.offset, length: r.length, sha256: r.sha256, version: newVersion });
    }
    if (itemChanged) { area.items_changed += 1; item.needs_review = true; } else delete item.needs_review;
  }
  data.version = newVersion;
  writeFileSync(path.join(root, "outputs", name), `${JSON.stringify(data, null, 1)}\n`);
  report.areas[name.replace(/\.json$/, "")] = area;
}
report.shared_ranges_changed = [...sharedChanged.values()];

// Markdown pages print provenance as text; rewrite the relocated offsets, file names, and
// hash prefixes in place. Offsets and content-hashed chunk names are unique tokens.
const hexPrefixes = [...substitutions].filter(([k]) => /^[0-9a-f]{64}$/.test(k));
for (const name of readdirSync(path.join(root, "outputs")).filter(f => f.endsWith(".md"))) {
  const file = path.join(root, "outputs", name);
  let md = readFileSync(file, "utf8");
  md = md.replace(/\b\d{6,10}\b/g, n => substitutions.get(n) ?? n);
  md = md.replace(/\bchunk-[a-z0-9]{8}\.js\b|\b[A-Za-z_]+-[a-z0-9]{8}\.(?:md|txt)(?:\.zst)?\b/g, n => substitutions.get(n) ?? n);
  md = md.replace(/\b[0-9a-f]{8,63}\b/g, h => { const hit = hexPrefixes.find(([k]) => k.startsWith(h)); return hit ? hit[1].slice(0, h.length) : h; });
  writeFileSync(file, md);
}

writeFileSync(path.join(newDir, "relocation-report.json"), `${JSON.stringify(report, null, 1)}\n`);
const summary = Object.fromEntries(Object.entries(report.areas).map(([k, a]) => [k, { same: a.same, shared_reshaped: a.reshaped_shared, changed_ranges: a.changed.length, items_changed: a.items_changed }]));
console.log(JSON.stringify(summary));
