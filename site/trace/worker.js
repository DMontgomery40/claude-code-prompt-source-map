import { localFileSource } from "./local-session.js";
// Trace Web Worker: parses dropped session logs off the main thread and serves
// block text on demand. Load with: new Worker("worker.js", { type: "module" }).
//
// API
//   postMessage({ type: "index", index })   optional, before load: the site's parsed
//     /trace/reference-index.json (the page fetches it).
//     -> { type: "index", ok, pages }
//     With an index, harness/injected blocks get block.site = { slug, title, matched, lines }
//     (the page holding most of the block's indexed lines; >= 2 lines, or all if fewer),
//     Claude Code attachments mapped in index.reminders get block.site = { slug, anchor, title }
//     (a structured row rebuilt from index.templates links its template instead), and a Claude Code
//     agent with no logged harness uses index.harness[version] (harnessSource "inferred").
//   postMessage({ type: "load", files: [File | { file: File, path: string }], root?: string })
//     -> { type: "progress", phase: "narrow"|"scan"|"parse"|"build"|"done", done, total, file?, fileDone? }
//        parse/build/done: done/total in bytes; parse events at most every 80 ms, plus one
//        at the end of each file. scan (no root): total = number of dropped files.
//        narrow (root given): unit "files", done/total = files sniffed of candidates; the
//        last one has final: true and found = { product, id, root (path), subagents,
//        guardians (Codex), toolResults (Claude Code), files, sniffed, fullReads?, window? }
//        -- enough for "found session + N subagents".
//     -> { type: "error", message }  also when `root` names no file in the pick:
//        "Session <id> isn't in the picked folder. Pick ~/.codex/sessions (or ~/.claude/projects)"
//     -> { type: "trace", trace }        the normalized Trace (no block text; see SPEC "Normalized model")
//     -> { type: "error", message }
//     Pass { file, path } with the dropped relative path (e.g. from webkitGetAsEntry's
//     fullPath) so subagent folders are recognized; a bare File uses webkitRelativePath
//     or its name. `root` (a thread/session id) loads that session: with a whole
//     ~/.codex/sessions or ~/.claude/projects pick, its files are chosen by path and
//     only the few candidate children are sniffed (see loader.js narrowByHint). Without
//     `root`, every .jsonl is sniffed and trace.candidates lists the sessions found.
//   postMessage({ type: "text", ref, id? })
//     -> { type: "text", ref, id, text }  the literal text of one block: its source line
//        read by byte offset, then ref.path (JSON path into the line) and ref.range
//        (substring) applied; a structured Claude Code attachment (ref.rebuild) is rebuilt
//        from the index's templates. Image blocks return a data: URL.
//     -> { type: "error", id, message }
//   postMessage({ type: "find", q, id })   full-text search of the loaded session (find.js); a new
//     find or { type: "find-cancel" } stops the previous one.
//     -> { type: "find-hits", id, hits: [{ agentId, block, snippet: { before, match, after } }] }
//     -> { type: "find-progress", id, done, total }   bytes scanned
//     -> { type: "find-done", id, hits, truncated, cancelled, error? }
//
// Only the files the user dropped are read. No network requests.
import { fileSource } from "./file-source.js";
import { loadTrace } from "./loader.js";
import { readRef } from "./model.js";
import { findText } from "./find.js";

let sources = [];
let index = null;
let loaded = null; // the Trace the sources belong to, for find
let findGen = 0;

self.onmessage = async (e) => {
  const m = e.data || {};
  if (m.type === "index") {
    index = m.index || null;
    self.postMessage({ type: "index", ok: !!index, pages: index && index.pages ? index.pages.length : 0 });
  } else if (m.type === "load") {
    try {
      const entries = (m.files || []).map((f) => {
        const file = f instanceof Blob ? f : f.file;
        const path = (f instanceof Blob ? file.webkitRelativePath || file.name : f.path || file.webkitRelativePath || file.name).replace(/^\/+/, "");
        return { path, source: f.local ? localFileSource(f.local) : fileSource(file, f.handle, f.frozen) };
      });
      let last = 0;
      const { trace, sources: s } = await loadTrace(entries, {
        root: m.root || null,
        index,
        onProgress: (p) => {
          const now = Date.now();
          const frequent = p.phase === "parse" || p.phase === "narrow";
          if (!frequent || p.fileDone || p.final || now - last > 80) { last = now; self.postMessage({ type: "progress", ...p }); }
        },
      });
      sources = s;
      loaded = trace;
      findGen++;
      self.postMessage({ type: "trace", trace });
    } catch (err) {
      self.postMessage({ type: "error", message: String((err && err.message) || err) });
    }
  } else if (m.type === "find") {
    const gen = ++findGen;
    let last = 0;
    try {
      if (!loaded) throw new Error("no session loaded");
      const res = await findText(loaded, sources, m.q, {
        index, cancelled: () => gen !== findGen,
        onHits: (hits) => self.postMessage({ type: "find-hits", id: m.id, hits }),
        onProgress: (done, total) => { const now = Date.now(); if (done === total || now - last > 80) { last = now; self.postMessage({ type: "find-progress", id: m.id, done, total }); } },
      });
      self.postMessage({ type: "find-done", id: m.id, ...res });
    } catch (err) {
      self.postMessage({ type: "find-done", id: m.id, hits: 0, truncated: false, cancelled: false, error: String((err && err.message) || err) });
    }
  } else if (m.type === "find-cancel") {
    findGen++;
  } else if (m.type === "text") {
    try {
      const src = sources[m.ref.file];
      if (!src) throw new Error("unknown file index " + m.ref.file);
      self.postMessage({ type: "text", ref: m.ref, id: m.id, text: await readRef(src, m.ref, index) });
    } catch (err) {
      self.postMessage({ type: "error", id: m.id, message: String((err && err.message) || err) });
    }
  }
};
