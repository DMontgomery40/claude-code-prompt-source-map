// The docs search index, one per section (dist/<section>/search-index.json), built from the rendered
// pages: both sections' renderSite call buildSearchIndex with each document's standalone-page HTML
// and heading outline (ids exactly as the standalone page has them), plus the document's structured
// records (outputs/*.json). The palette (search/palette.js) fetches the file on first use; the item
// shape and hrefs are read through search/query.js (indexItems, itemHref), which the link check
// (tools/check-links.mjs) also uses.
//
// Records are tied to their entry headings by the same key the tag filters use (filters.mjs
// entryKey: group heading + entry heading), in document order, so an entry whose title repeats
// (…-2, …-3 ids) links to its own heading, not the first one with that text.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { entryKey, plain } from "./filters.mjs";
import { SITE } from "./site.mjs";

// Excerpt caps (characters). Keep the files small: the palette shows two lines at most.
export const LIMITS = { excerpt: 130, text: 130, when: 150, summary: 170 };

export function clip(value, max) {
  const s = String(value ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:(–—-]+$/, "")}…`;
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
// Visible text of an HTML fragment.
export function textOf(html) {
  return String(html ?? "")
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : ENTITIES[e.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

// Chrome inside a page's content that is not the entry's own text: tag chips, feeds links,
// review labels, the data-file line.
const CHROME = [
  /<div class="item-tags">[\s\S]*?<\/div>/g,
  /<div class="review-tag">[\s\S]*?<\/div>/g,
  /<button\b[\s\S]*?<\/button>/g,
  /<p class="data-link">[\s\S]*?<\/p>/g
];
const stripChrome = html => CHROME.reduce((s, re) => s.replace(re, " "), html);

// The text right after each id's heading, up to the next heading. An id may sit on the heading
// itself or on a <section> the heading opens (anchorOutline gives such a heading no id of its own).
export function excerptsById(html, ids) {
  const at = new Map();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) if (!at.has(m[1])) at.set(m[1], m.index);
  const heads = [...html.matchAll(/<h[1-6][\s>]/g)].map(m => m.index);
  const closeRe = /<\/h[1-6]>/g;
  const out = new Map();
  for (const id of ids) {
    const pos = at.get(id);
    if (pos === undefined) continue;
    closeRe.lastIndex = pos;
    const close = closeRe.exec(html);
    if (!close) continue;
    const start = close.index + close[0].length;
    let lo = 0, hi = heads.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (heads[mid] < start) lo = mid + 1; else hi = mid; }
    const end = Math.min(heads[lo] ?? html.length, start + 6000);
    out.set(id, clip(textOf(stripChrome(html.slice(start, end))), LIMITS.excerpt));
  }
  return out;
}

// A page's summary when its catalog entry has none: its first paragraph.
function firstParagraph(html) {
  for (const m of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const text = textOf(m[1]);
    if (text.length > 24) return text;
  }
  return "";
}

// ---------- records ----------

// The record kinds of both products' outputs, as search kinds (search/query.js KINDS).
const RAW_KIND = {
  "env-var": "env", setting: "setting", "cli-command": "cli", "cli-flag": "cli", "hook-event": "hook", tool: "tool",
  "slash-command": "slash", prompt: "prompt", reminder: "reminder", agent: "agent", skill: "skill", decision: "decision",
  "tool description": "tool", "parameter description": "tool", "output field description": "tool",
  "tool result text": "prompt", "system prompt": "prompt", "prompt template": "prompt", file: "prompt", constant: "prompt"
};

// Which JSON holds a catalog document's records: `records` (a path, or { file, list, kind }; false
// for none), else its tag-filter records, else its published data file.
export function recordSpec(file) {
  if (file.records === false) return null;
  if (typeof file.records === "string") return { file: file.records };
  if (file.records) return file.records;
  if (file.filters?.records) return { file: file.filters.records, tags: file.filters.tags };
  if (typeof file.data === "string" && file.data.endsWith(".json")) return { file: file.data };
  return null;
}

const num = v => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);

// Where the record's text sits in what ships: { f: file, o: byte offset, l: line, r: version }.
export function provenanceOf(r) {
  const list = Array.isArray(r.provenance) ? r.provenance : r.provenance ? [r.provenance] : [];
  for (const p of [...list, r.details?.schema_provenance]) {
    if (p?.file) return { f: p.file, o: num(p.binary_offset ?? p.offset), r: p.version ?? undefined };
    // A source tree reference: "codex-rs@rust-v0.158.0:codex-rs/config/src/config_toml.rs:410".
    const m = typeof p?.source === "string" && p.source.match(/^[\w.-]+@([^:\s]+):(\S+?)(?::(\d+))?$/);
    if (m) return { f: m[2], l: m[3] ? Number(m[3]) : undefined, r: m[1] };
  }
  if (r.source_file) return { f: r.source_file, o: num(r.byte_offset) };
  const src = Array.isArray(r.source) ? r.source[0] : typeof r.source === "string" ? r.source : null;
  if (src) {
    const m = src.match(/^(.+?)@0x([0-9a-f]+)$/i);
    return m ? { f: m[1], o: parseInt(m[2], 16) } : { f: src };
  }
  return null;
}

// One record in the shape the index builder reads.
export function normalizeRecord(r, { kind, tags = [] } = {}) {
  const description = typeof r.details?.description === "object" ? r.details?.description?.text : r.details?.description;
  return {
    id: r.id ?? null,
    title: String(r.title ?? r.name ?? r.id ?? ""),
    group: r.group ?? r.area ?? r.namespace ?? null,
    kind: RAW_KIND[r.kind] ?? kind ?? null,
    text: [r.text, r.question, description].find(v => typeof v === "string" && v.trim()) ?? null,
    when: typeof r.when === "string" ? r.when : null,
    documented: "documented" in r ? Boolean(r.documented) : undefined,
    prov: provenanceOf(r),
    tags
  };
}

// A catalog document's records, normalized. `transform` rewrites the raw JSON text first (the
// Codex/ChatGPT section's display-path rewrite, so the index says what the pages say).
export async function loadSearchRecords({ sourceRoot, file, transform = s => s }) {
  const spec = recordSpec(file);
  if (!spec) return [];
  // Records only enrich the index; a page whose records file is absent or not JSON (a stubbed
  // catalog in a test) still builds, with its headings indexed as sections. The production test in
  // site/test/shared/search-index.test.mjs checks that every records file yields records.
  const text = await readFile(path.join(sourceRoot, spec.file), "utf8").catch(error => { if (error.code === "ENOENT") return null; throw error; });
  let raw = null;
  try { raw = text === null ? null : JSON.parse(transform(text)); } catch { raw = null; }
  if (!raw) return [];
  const list = spec.list ? raw[spec.list] : Array.isArray(raw) ? raw : raw.items;
  if (!Array.isArray(list)) return [];
  const tagFile = spec.tags ? JSON.parse(transform(await readFile(path.join(sourceRoot, spec.tags), "utf8"))) : null;
  const labels = new Map((tagFile?.tags ?? []).map(t => [t.id, t.label]));
  const doc = path.basename(file.path);
  const records = list
    .filter(r => r && typeof r === "object" && (!r.document || r.document === doc))
    .map(r => normalizeRecord(r, { kind: spec.kind, tags: (tagFile?.items?.[r.id] ?? []).map(t => labels.get(t) ?? t) }));
  // A record whose own kind says nothing (kind "other") takes the file's usual kind.
  const counts = new Map();
  for (const r of records) if (r.kind) counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  const usual = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? spec.kind ?? "prompt";
  for (const r of records) r.kind ??= usual;
  return records;
}

// ---------- the index ----------

// One line per build: what the search index holds, and any record that found no heading.
export function logSearchStats(section, stats) {
  const missed = Object.entries(stats.unmatched).map(([slug, n]) => `${slug} ${n}`).join(", ");
  if (process.env.SEARCH_INDEX_QUIET !== "1") console.log(`search index ${section}: ${stats.pages} pages, ${stats.sections} sections, ${stats.records} records${missed ? `; records without a heading: ${missed}` : ""}`);
}

const flat = s => String(s ?? "").replace(/\s+/g, " ").trim();

// documents: [{ slug, title, category, summary?, html (the standalone page's content), outline:
//   [{ level, text, id }] with the standalone page's ids, records?: normalizeRecord[], inline?: fn }]
// inline(markdown) → HTML renders a record's group/title the way its heading was rendered.
// Returns { index, stats }.
export function buildSearchIndex({ product, documents, featured = [] }) {
  const tagIds = new Map(), tags = [];
  const tagIndex = label => { if (!tagIds.has(label)) tagIds.set(label, tags.push(label) - 1); return tagIds.get(label); };
  // Provenance file names repeat across records: each is stored once, items keep its number.
  const fileIds = new Map(), files = [];
  const fileIndex = name => { if (!fileIds.has(name)) fileIds.set(name, files.push(name) - 1); return fileIds.get(name); };
  const pages = [], items = [];
  const stats = { pages: 0, sections: 0, records: 0, unmatched: {} };
  // Featured slugs name production pages; a build of a smaller catalog (tests) just has fewer.

  documents.forEach((doc, p) => {
    const outline = (doc.outline ?? []).filter(o => o.level >= 2 && o.level <= 5 && o.id && flat(o.text));
    const excerpts = excerptsById(doc.html, outline.map(o => o.id));
    const inline = doc.inline ?? (s => s);
    const heading = s => flat(plain(inline(String(s ?? ""))));

    // Each outline entry's ancestors (h2 › h3 › h4) and its group (the h3 over an entry).
    const trail = [];
    const rows = outline.map(o => {
      while (trail.length && trail.at(-1).level >= o.level) trail.pop();
      const crumbs = trail.map(t => flat(t.text));
      const group = o.level === 3 ? flat(o.text) : flat(trail.findLast(t => t.level === 3)?.text ?? "");
      trail.push(o);
      return { o, text: flat(o.text), crumbs, group, record: null };
    });

    // Records to headings: group + title first, in order; then title alone for what is left.
    const records = doc.records ?? [];
    const byKey = new Map(), byTitle = new Map();
    const queue = (map, key, r) => (map.get(key) ?? map.set(key, []).get(key)).push(r);
    // Each record under its title as written (the tag filters' key) and as its markdown renders
    // (**bold** and similar in a prompt's opening words); a record is taken once.
    for (const r of records) {
      const raw = flat(r.title), shown = heading(r.title);
      for (const t of new Set([raw, shown])) { queue(byKey, entryKey(flat(r.group), t), r); queue(byTitle, t.replace(/`/g, ""), r); }
      if (flat(r.group) !== heading(r.group)) queue(byKey, entryKey(heading(r.group), shown), r);
    }
    const taken = new Set();
    const take = list => { while (list?.length) { const r = list.shift(); if (!taken.has(r)) { taken.add(r); return r; } } return null; };
    for (const row of rows) row.record = take(byKey.get(entryKey(row.group, row.text)));
    for (const row of rows) if (!row.record) row.record = take(byTitle.get(row.text.replace(/`/g, "")));
    const missed = records.length - taken.size;
    if (missed) stats.unmatched[doc.slug] = missed;

    pages.push({ s: doc.slug, t: doc.title, c: doc.category, d: clip(doc.summary || firstParagraph(doc.html), LIMITS.summary) || undefined, n: taken.size || undefined, f: featured.includes(doc.slug) ? 1 : undefined });
    for (const row of rows) {
      const it = { k: "h", p, a: row.o.id, t: row.text };
      if (row.crumbs.length) it.b = row.crumbs;
      const r = row.record;
      if (r) {
        it.k = r.kind ?? "prompt";
        // A long prompt's title is its opening words ("…"): the excerpt then carries on from there.
        const stem = row.text.replace(/…$/, "").trim(), full = flat(r.text);
        const x = stem.length > 12 && full.startsWith(stem) ? (full.length > stem.length + 3 ? `…${clip(full.slice(stem.length), LIMITS.text - 20)}` : "") : clip(full, LIMITS.text) || excerpts.get(row.o.id);
        const w = r.when ? clip(r.when, LIMITS.when) : "";
        // The when line often quotes the description ("From docs: …"); keep one copy.
        if (x && !(w && w.includes(x.replace(/…$/, "")))) it.x = x;
        if (w) it.w = w;
        if (r.documented !== undefined) it.u = r.documented ? 1 : 0;
        if (r.prov?.f) it.f = fileIndex(r.prov.f);
        if (r.prov?.o !== undefined) it.o = r.prov.o;
        if (r.prov?.l !== undefined) it.l = r.prov.l;
        if (r.prov?.r) it.r = r.prov.r;
        if (r.tags?.length) it.tg = r.tags.map(tagIndex);
        stats.records++;
      } else {
        it.h = row.o.level;
        const x = excerpts.get(row.o.id);
        if (x) it.x = x;
        stats.sections++;
      }
      items.push(it);
    }
  });
  stats.pages = pages.length;
  // The version most records were read from is said once (ver); an item keeps r only when it differs.
  const versions = new Map();
  for (const it of items) if (it.r) versions.set(it.r, (versions.get(it.r) ?? 0) + 1);
  const ver = [...versions].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (ver) for (const it of items) if (it.r === ver) delete it.r;
  return { index: { v: 1, product, label: SITE.products[product]?.label ?? product, ver, tags, files, pages, items }, stats };
}
