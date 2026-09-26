// Trace Web Worker: parses dropped session logs off the main thread and serves
// block text on demand. Load with: new Worker("worker.js", { type: "module" }).
//
// API
//   postMessage({ type: "index", index })   optional, before load: the site's parsed
//     /trace/reference-index.json (the page fetches it; the worker never fetches).
//     -> { type: "index", ok, pages }
//     With an index, harness/injected blocks get block.site = { slug, title, matched, lines }
//     (the page holding most of the block's indexed lines; >= 2 lines, or all if fewer),
//     Claude Code attachments mapped in index.reminders get block.site = { slug, anchor, title }
//     (+ block.rebuilt = true when the row is structured, not literal), and a Claude Code
//     agent with no logged harness uses index.harness[version] (harnessSource "inferred").
//   postMessage({ type: "load", files: [File | { file: File, path: string }], root?: string })
//     -> { type: "progress", phase: "scan"|"parse"|"build"|"done", done, total, file?, fileDone? }
//        (done/total in bytes; parse events at most every 80 ms, plus one at the end of each file)
//     -> { type: "trace", trace }        the normalized Trace (no block text; see SPEC "Normalized model")
//     -> { type: "error", message }
//     Pass { file, path } with the dropped relative path (e.g. from webkitGetAsEntry's
//     fullPath) so subagent folders are recognized; a bare File uses webkitRelativePath
//     or its name. `root` picks a session when several are present (a thread/session id);
//     trace.candidates lists them all.
//   postMessage({ type: "text", ref, id? })
//     -> { type: "text", ref, id, text }  the literal text of one block: its source line
//        read by byte offset, then ref.path (JSON path into the line) and ref.range
//        (substring) applied. Image blocks return a data: URL.
//     -> { type: "error", id, message }
//
// Only the files the user dropped are read. No network requests.
import { loadTrace } from "./loader.js";
import { readRef } from "./model.js";

let sources = [];
let index = null;

const fileSource = (file) => ({
  name: file.name,
  size: file.size,
  async slice(a, b) { return new Uint8Array(await file.slice(a, b).arrayBuffer()); },
});

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
        return { path, source: fileSource(file) };
      });
      let last = 0;
      const { trace, sources: s } = await loadTrace(entries, {
        root: m.root || null,
        index,
        onProgress: (p) => {
          const now = Date.now();
          if (p.phase !== "parse" || p.fileDone || now - last > 80) { last = now; self.postMessage({ type: "progress", ...p }); }
        },
      });
      sources = s;
      self.postMessage({ type: "trace", trace });
    } catch (err) {
      self.postMessage({ type: "error", message: String((err && err.message) || err) });
    }
  } else if (m.type === "text") {
    try {
      const src = sources[m.ref.file];
      if (!src) throw new Error("unknown file index " + m.ref.file);
      self.postMessage({ type: "text", ref: m.ref, id: m.id, text: await readRef(src, m.ref) });
    } catch (err) {
      self.postMessage({ type: "error", id: m.id, message: String((err && err.message) || err) });
    }
  }
};
