// Trace viewer: loading, state, levels, keyboard, and wiring between the scene, minimap and panels.
// Everything runs locally. The only network requests are this page's own static files.
import { STRATA, STRATUM_INDEX, STATUS, LENSES, TOUCH, el, fmtTok, fmtInt, fmtDur, fmtClock, fmtWhen, sessionStats, renderPanel, blockTokens, agentStats, clip, modelFamily, largestLayer } from "./panels.js";
import { buildLayout, renderOverview, renderAgentColumns, legend } from "./minimap.js";
import { lineHash, normalizeLine, MIN_INDEXED_LINE } from "./model.js";

const params = new URLSearchParams(location.search);
const $ = s => document.querySelector(s);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const S = {
  trace: null, layout: null, level: 0, agentId: null, agent: null, reqIdx: null, stratum: null, block: null,
  lens: "context", mode: "3d", custodyFn: null, reading: false
};
let scene = null;
let text = null;     // (agentId, ref) => Promise<{text, mode}>
let worker = null;
let lastFiles = null; // the dropped files, kept so another session among them can be opened
let pasteRoot = null; // the thread or session id from the paste box, sent as the worker's `root`

// ---------- loader ----------
setupLoader();
drawHero();
if (params.has("synthetic")) loadSynthetic();
if (params.has("model")) $("#dev").hidden = false;

function setupLoader() {
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(t => drop.addEventListener(t, () => drop.classList.remove("over")));
  // Dropping anywhere on the page works too.
  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => {
    e.preventDefault();
    if (!$("#loader").hidden) collectDrop(e.dataTransfer).then(loadFiles);
  });
  $("#pick-files").addEventListener("change", e => loadFiles([...e.target.files].map(f => ({ path: f.name, file: f }))));
  $("#pick-folder").addEventListener("change", e => loadFiles([...e.target.files].map(f => ({ path: f.webkitRelativePath || f.name, file: f }))));
  drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#pick-files").click(); } });
  $("#paste").addEventListener("input", e => describePaste(e.target.value));
  $("#paste").addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const open = $("#paste-out .btn.open");
    if (open && !open.disabled) open.click();
  });
  $("#pick-root").addEventListener("change", e => {
    const files = [...e.target.files].map(f => ({ path: f.webkitRelativePath || f.name, file: f }));
    if (!files.length) return;
    e.target.value = "";
    if (pasted?.id && !holdsPaste(files, pasted.id)) return missingPaste(files);
    pickedRoots.set(e.target.dataset.product, files);
    loadFiles(narrowPicked(files, pasted), pasted?.id || null);
  });
  if (params.has("dev")) window.__traceDev = { filesFromHandle, narrowPicked, parsePaste };
  $("#dev-model").addEventListener("change", async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const trace = JSON.parse(await f.text());
      const sources = [...$("#dev-sources").files];
      text = (agentId, ref) => rawLine(trace, sources, ref);
      start(trace);
    } catch (err) { showError(`That file isn't a Trace JSON: ${err.message}`); }
  });
  $("#back-to-load").addEventListener("click", backToLoader);
}

// Back to the loader without reloading, so folders picked on this page stay available.
function backToLoader() {
  scene?.dispose();
  scene = null;
  Object.assign(S, { trace: null, layout: null, level: 0, agentId: null, agent: null, reqIdx: null, stratum: null, block: null });
  $("#app").hidden = true;
  $("#tip").hidden = true;
  $("#loader").hidden = false;
  $("#progress").hidden = true;
  $("#load-error").hidden = true;
  $("#paste").value = "";
  $("#paste-out").replaceChildren();
  pasted = null;
  pasteRoot = null;
  $("#paste").focus();
}

async function collectDrop(dt) {
  // Entries must be taken synchronously, before the drop event returns.
  const entries = [...dt.items].filter(i => i.kind === "file").map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
  if (!entries.length) return [...dt.files].map(f => ({ path: f.name, file: f }));
  const out = [];
  const walk = async entry => {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      if (file.name !== ".DS_Store") out.push({ path: entry.fullPath.replace(/^\//, ""), file });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      for (;;) {
        const batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const e of batch) await walk(e);
      }
    }
  };
  setProgress(0, "Listing files…");
  for (const e of entries) await walk(e);
  return out;
}

function setProgress(frac, msg) {
  $("#progress").hidden = false;
  $("#load-error").hidden = true;
  if (frac != null) $("#progress-fill").style.width = `${Math.round(Math.max(0, Math.min(1, frac)) * 100)}%`;
  if (msg) $("#progress-text").textContent = msg;
}
function showError(msg) {
  $("#progress").hidden = true;
  const e = $("#load-error");
  e.textContent = msg;
  e.hidden = false;
}

// The parser runs in a Web Worker (worker.js), created only when real files are loaded.
const pendingText = new Map();
let pendingLoad = null;
function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  worker.addEventListener("message", ({ data }) => {
    if (!data) return;
    if (data.type === "progress") {
      const frac = data.total ? data.done / data.total : null;
      const mb = n => `${(n / 1048576).toFixed(n > 1e8 ? 0 : 1)} MB`;
      if (data.phase === "narrow") {
        // With a root hint the loader first narrows the picked tree to that session (counts are files).
        const f = data.found;
        if (data.final && f) {
          const kids = [f.subagents ? `${fmtInt(f.subagents)} subagent${f.subagents === 1 ? "" : "s"}` : null,
            f.guardians ? `${fmtInt(f.guardians)} guardian review${f.guardians === 1 ? "" : "s"}` : null].filter(Boolean);
          setProgress(0.08, `Found the ${f.product === "codex" ? "Codex" : "Claude Code"} session${kids.length ? ` + ${kids.join(" and ")}` : ""}. Reading…`);
        } else setProgress(data.total ? 0.08 * data.done / data.total : null, `Finding the session: ${fmtInt(data.done)} of ${fmtInt(data.total)} files checked`);
        return;
      }
      const what = { scan: "Finding sessions", parse: "Reading", build: "Building the landscape", done: "Done" }[data.phase] || "Reading";
      const file = data.file ? ` · ${String(data.file).split("/").pop()}` : "";
      setProgress(frac, data.total ? `${what}: ${mb(data.done)} of ${mb(data.total)}${file}` : `${what}…`);
    } else if (data.type === "trace") {
      pendingLoad?.resolve(data.trace); pendingLoad = null;
    } else if (data.type === "error") {
      const p = data.id != null && pendingText.get(data.id);
      if (p) { pendingText.delete(data.id); p.reject(new Error(data.message)); }
      else if (pendingLoad) { pendingLoad.reject(new Error(data.message)); pendingLoad = null; }
    } else if (data.type === "text") {
      const p = pendingText.get(data.id);
      if (p) { pendingText.delete(data.id); p.resolve({ text: data.text, mode: data.mode }); }
    }
  });
  worker.addEventListener("error", e => {
    const msg = `The parser couldn't start: ${e.message || "worker error"}`;
    if (pendingLoad) { pendingLoad.reject(new Error(msg)); pendingLoad = null; }
  });
  return worker;
}
let textSeq = 0;
function workerText(agentId, ref) {
  const id = ++textSeq;
  return new Promise((resolve, reject) => {
    pendingText.set(id, { resolve, reject });
    getWorker().postMessage({ type: "text", ref, id });
  });
}
// The site's reference index (same-origin static file) lets the worker link harness and injected
// blocks to the pages that publish them. It is optional: without it blocks simply have no link.
let indexLoad = null, indexSent = null;
function loadIndex() {
  indexLoad ||= fetch(new URL("./reference-index.json", import.meta.url))
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  return indexLoad;
}
function sendIndex() {
  indexSent ||= loadIndex().then(index => { if (index) getWorker().postMessage({ type: "index", index }); });
  return indexSent;
}
async function parseInWorker(files, root) {
  await sendIndex();
  return new Promise((resolve, reject) => {
    pendingLoad = { resolve, reject };
    getWorker().postMessage({ type: "load", files, root: root || null });
  });
}

// `root` is the pasted session id when the open button made this load. A plain drop or file pick
// sends the pasted id only if some dropped path names it, so a stale paste can't block a drop.
async function loadFiles(files, root) {
  if (!files || !files.length) return;
  const logs = files.filter(f => /\.(jsonl|json)$/i.test(f.path));
  if (!logs.length) return showError("No .jsonl session logs in what was dropped.");
  if (root === undefined) {
    if (pasteRoot && !holdsPaste(files, pasteRoot)) return missingPaste(files);
    root = pasteRoot;
  }
  setProgress(0, `Reading ${fmtInt(files.length)} files…`);
  lastFiles = files;
  try {
    const trace = await parseInWorker(files, root);
    text = workerText;
    start(trace);
  } catch (e) {
    showError(e.message || String(e));
  }
}

// A pasted id is in the files when some path names it (the session's .jsonl, a rollout file name).
function holdsPaste(files, id) {
  return files.some(f => f.path.toLowerCase().includes(id));
}

// The files don't hold the pasted session: say so, and let the user pick again or open what they picked.
function missingPaste(files) {
  const id = pasteRoot || pasted?.id || "";
  const product = pasted?.product;
  const e = $("#load-error");
  $("#progress").hidden = true;
  const again = el("button", { class: "btn small", type: "button", text: "Pick again" });
  again.addEventListener("click", () => {
    e.hidden = true;
    if (pasted) openPasted(pasted, $("#paste-out .btn.open") || again, $("#paste-out .open-hint") || el("p"), true);
    else $("#pick-folder").click();
  });
  const clear = el("button", { class: "btn small", type: "button", text: "Clear the pasted id" });
  clear.addEventListener("click", () => {
    e.hidden = true;
    $("#paste").value = "";
    describePaste("");
    loadFiles(files, null);
  });
  e.replaceChildren(el("span", { text: `Session ${id.slice(0, 8)}… isn't in these files${product ? `. Pick ${ROOT_DIR[product]}` : ""}.` }),
    el("span", { class: "error-actions" }, again, clear));
  e.hidden = false;
}

// Several sessions were dropped: reload the worker's parse with the chosen one as `root`.
async function switchSession(root) {
  const pick = $("#session-pick");
  pick.disabled = true;
  try {
    const trace = await parseInWorker(lastFiles, root);
    scene?.dispose();
    scene = null;
    Object.assign(S, { level: 0, agentId: null, agent: null, reqIdx: null, stratum: null, block: null });
    start(trace);
  } catch (e) {
    pick.disabled = false;
    alert(`Couldn't open that session: ${e.message || e}`);
  }
}

async function loadSynthetic() {
  setProgress(0.3, "Generating a synthetic session…");
  let syn;
  try {
    const { syntheticTrace } = await import("./dev-synthetic.js");
    syn = syntheticTrace();
  } catch {
    return showError("The synthetic session isn't available on this site.");
  }
  text = async (agentId, ref) => syn.text(ref);
  start(syn.trace);
}

async function rawLine(trace, sources, ref) {
  const want = trace.files?.[ref.file];
  const f = want && sources.find(s => s.name === want.name.split("/").pop() && (!want.size || s.size === want.size));
  if (!f) throw new Error("block text needs the source logs; add them with the developer loader");
  const line = await f.slice(ref.offset, ref.offset + ref.length).text();
  return { text: line, mode: "raw log line (developer load)" };
}

// ---------- paste → open ----------
// Codex thread ids are UUIDv7: the first 48 bits are Unix milliseconds, which name the folder and file.
const ROOT_DIR = { codex: "~/.codex/sessions", "claude-code": "~/.claude/projects" };
function parsePaste(v) {
  v = v.trim();
  if (!v) return null;
  const uuid = (v.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0]?.toLowerCase() || null;
  if (/^codex:\/\//i.test(v) || (uuid && uuid[14] === "7" && !/\.claude\//.test(v))) {
    if (!uuid) return { error: "That deeplink has no thread id." };
    const ms = parseInt(uuid.replace(/-/g, "").slice(0, 12), 16);
    return { product: "codex", id: uuid, ms };
  }
  if (uuid || /\.claude\/projects\//.test(v)) return { product: "claude-code", id: uuid, path: /\.jsonl$/.test(v) ? v : null };
  return { error: "Paste a codex://threads/… link, a thread id, or a Claude Code session id or path." };
}

let pasted = null;           // the parsed paste the open button acts on
const pickedRoots = new Map(); // product -> files picked this page load (no File System Access)

function describePaste(v) {
  const out = $("#paste-out");
  out.replaceChildren();
  const info = parsePaste(v);
  pasted = info && !info.error ? info : null;
  pasteRoot = pasted?.id || null;
  if (!info) return;
  if (info.error) return out.append(el("p", { text: info.error }));
  const p2 = n => String(n).padStart(2, "0");
  const pathRow = p => {
    const b = el("button", { class: "btn small", type: "button", text: "Copy" });
    b.addEventListener("click", () => navigator.clipboard?.writeText(p).then(() => { b.textContent = "Copied"; }, () => { b.textContent = "Select and copy"; }));
    return el("div", { class: "path" }, el("code", { text: p }), b);
  };
  const where = [];
  let what;
  if (info.product === "codex") {
    const d = new Date(info.ms);
    const day = `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())}`;
    const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
    what = `Codex thread started ${fmtWhen(info.ms)}.`;
    where.push(el("p", { text: "Its log (the file name uses local time):" }), pathRow(`~/.codex/sessions/${day}/rollout-${stamp}-${info.id}.jsonl`),
      el("p", { text: "Subagents and guardian reviews are separate files in the date folders from that day on." }));
  } else {
    const file = info.path || `~/.claude/projects/<project>/${info.id}.jsonl`;
    what = `Claude Code session ${info.id ? info.id.slice(0, 8) : ""}.`;
    where.push(el("p", { text: "Its log, and the same-named folder that holds its subagents:" }), pathRow(file), pathRow(file.replace(/\.jsonl$/, "/")));
  }
  const hint = el("p", { class: "open-hint", text: "" });
  const btn = el("button", { class: "btn primary open", type: "button", text: "Open this session and its subagents" });
  btn.addEventListener("click", () => openPasted(info, btn, hint));
  out.append(el("p", { text: what }), el("div", { class: "open-row" }, btn, hint),
    el("details", {}, el("summary", { text: "Where the files are" }), ...where));
  storedHandle(info.product).then(h => {
    hint.textContent = pickedRoots.has(info.product) || h ? "Opens from the folder you picked before."
      : `You'll pick ${ROOT_DIR[info.product]} once; the session and its subagents open from it.`;
  });
}

function copiedHint(hint, product) {
  if (TOUCH) return hint.replaceChildren(`Pick ${ROOT_DIR[product]} in the file picker.`);
  hint.replaceChildren(`Path copied: in the picker press `, el("kbd", { text: "⌘⇧G" }), `, paste, Enter, then Open. (${ROOT_DIR[product]})`);
}
function copyRoot(product) {
  try { navigator.clipboard?.writeText(ROOT_DIR[product]).catch(() => {}); } catch { /* clipboard unavailable */ }
}

async function openPasted(info, btn, hint, fresh = false) {
  pasteRoot = info.id;
  const mem = !fresh && pickedRoots.get(info.product);
  if (mem) return holdsPaste(mem, info.id) ? loadFiles(narrowPicked(mem, info), info.id) : missingPaste(mem);
  if (typeof window.showDirectoryPicker === "function") {
    let handle = fresh ? null : await storedHandle(info.product);
    if (handle && !(await readPermission(handle))) handle = null;
    if (!handle) {
      copyRoot(info.product);
      copiedHint(hint, info.product);
      try {
        handle = await window.showDirectoryPicker({ id: `trace-${info.product}`, mode: "read" });
      } catch (e) {
        if (e && e.name === "AbortError") return;
        return showError(`The folder picker failed: ${e?.message || e}`);
      }
      saveHandle(info.product, handle);
    }
    btn.disabled = true;
    setProgress(0, "Finding the session's files…");
    try {
      const files = await filesFromHandle(handle, info);
      if (!holdsPaste(files, info.id)) {
        btn.disabled = false;
        return missingPaste(files);
      }
      return loadFiles(files, info.id);
    } catch (e) {
      btn.disabled = false;
      return showError(`Couldn't read that folder: ${e?.message || e}`);
    }
  }
  // No File System Access (Brave by default, Firefox, Safari): a folder input, kept for this page.
  copyRoot(info.product);
  copiedHint(hint, info.product);
  const input = $("#pick-root");
  input.dataset.product = info.product;
  input.click();
}

// Keep only what can belong to the session: for Claude Code the files whose path holds its id
// (the .jsonl, subagents/, tool-results/); for Codex the date folders from the thread's day on.
// The worker's loader narrows further by id.
function narrowPicked(files, info) {
  if (!info?.id) return files;
  let keep;
  if (info.product === "claude-code") keep = files.filter(f => f.path.includes(info.id));
  else {
    const d = new Date(info.ms), day = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    keep = files.filter(f => {
      if (!/\.jsonl$/.test(f.path)) return false;
      const m = f.path.match(/(?:^|\/)(\d{4})\/(\d{2})\/(\d{2})\//);
      return !m || Number(m[1] + m[2] + m[3]) >= day;
    });
  }
  return keep.length ? keep : files;
}

// Walks a picked directory handle to the session's files without listing unrelated sessions.
async function filesFromHandle(root, info) {
  const out = [];
  const child = async (dir, name, kind) => { try { return kind === "dir" ? await dir.getDirectoryHandle(name) : await dir.getFileHandle(name); } catch { return null; } };
  const walk = async (dir, prefix) => {
    for await (const [name, h] of dir.entries()) {
      if (h.kind === "file") out.push({ path: `${prefix}${name}`, file: await h.getFile() });
      else await walk(h, `${prefix}${name}/`);
    }
  };
  if (info.product === "claude-code") {
    let base = root;
    const projects = await child(root, "projects", "dir");
    if (projects) base = projects;
    else { const inner = await child(root, ".claude", "dir"); const p = inner && await child(inner, "projects", "dir"); if (p) base = p; }
    const tryDir = async (dir, prefix) => {
      const f = await child(dir, `${info.id}.jsonl`, "file");
      if (!f) return false;
      out.push({ path: `${prefix}${info.id}.jsonl`, file: await f.getFile() });
      const folder = await child(dir, info.id, "dir");
      if (folder) await walk(folder, `${prefix}${info.id}/`);
      return true;
    };
    if (!(await tryDir(base, ""))) {
      for await (const [name, h] of base.entries()) if (h.kind === "directory" && await tryDir(h, `${name}/`)) break;
    }
    return out;
  }
  let base = root;
  const sessions = await child(root, "sessions", "dir");
  if (sessions) base = sessions;
  const d = new Date(info.ms), day = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const num = s => (/^\d+$/.test(s) ? Number(s) : null);
  for await (const [y, yh] of base.entries()) {
    if (yh.kind === "file" && /^rollout-.*\.jsonl$/.test(y)) { out.push({ path: y, file: await yh.getFile() }); continue; }
    if (yh.kind !== "directory" || num(y) == null || num(y) < d.getFullYear()) continue;
    for await (const [m, mh] of yh.entries()) {
      if (mh.kind !== "directory" || num(m) == null || num(y) * 100 + num(m) < Math.floor(day / 100)) continue;
      for await (const [dd, dh] of mh.entries()) {
        if (dh.kind !== "directory" || num(dd) == null || num(y) * 10000 + num(m) * 100 + num(dd) < day) continue;
        for await (const [name, fh] of dh.entries()) {
          if (fh.kind === "file" && /\.jsonl$/.test(name)) out.push({ path: `${y}/${m}/${dd}/${name}`, file: await fh.getFile() });
        }
      }
    }
  }
  return out;
}

// The picked folder's handle is remembered in IndexedDB, so a later paste opens without a picker.
function idb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("trace", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("handles");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function storedHandle(product) {
  try {
    const db = await idb();
    return await new Promise(resolve => {
      const q = db.transaction("handles").objectStore("handles").get(`trace-${product}`);
      q.onsuccess = () => resolve(q.result || null);
      q.onerror = () => resolve(null);
    });
  } catch { return null; }
}
async function saveHandle(product, handle) {
  try { const db = await idb(); db.transaction("handles", "readwrite").objectStore("handles").put(handle, `trace-${product}`); } catch { /* not remembered */ }
}
async function readPermission(handle) {
  try {
    if ((await handle.queryPermission({ mode: "read" })) === "granted") return true;
    return (await handle.requestPermission({ mode: "read" })) === "granted";
  } catch { return false; }
}

function drawHero() {
  // A decorative ridge in the strata colours (not data).
  const W = 560, H = 200, N = 80;
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const shares = [0.06, 0.03, 0.05, 0.02, 0.5, 0.16, 0.18];
  const hAt = i => {
    const x = i / (N - 1);
    const grow = x < 0.55 ? x / 0.55 : (x - 0.58) / 0.42;
    return 18 + 150 * Math.max(0.06, Math.min(1, grow)) * (0.92 + 0.08 * Math.sin(i * 1.7));
  };
  let base = new Array(N).fill(0);
  STRATA.forEach((s, j) => {
    const top = base.map((b, i) => b + hAt(i) * shares[j]);
    let d = "";
    for (let i = 0; i < N; i++) d += `${i ? "L" : "M"}${(i / (N - 1) * W).toFixed(1)},${(H - top[i]).toFixed(1)}`;
    for (let i = N - 1; i >= 0; i--) d += `L${(i / (N - 1) * W).toFixed(1)},${(H - base[i]).toFixed(1)}`;
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `${d}Z`);
    p.setAttribute("fill", s.color);
    svg.append(p);
    base = top;
  });
  const cliff = document.createElementNS(NS, "line");
  const cx = (0.565 * W).toFixed(1);
  Object.entries({ x1: cx, x2: cx, y1: 8, y2: H, stroke: "#eef1f5", "stroke-dasharray": "3 3" }).forEach(([k, v]) => cliff.setAttribute(k, v));
  svg.append(cliff);
  $("#hero").append(svg);
  legend($("#hero-legend"));
}

// ---------- start ----------
function normalize(trace) {
  const ms = v => (typeof v === "string" ? Date.parse(v) : v == null ? v : v < 1e11 ? v * 1000 : v);
  for (const a of trace.agents) {
    a.requests ||= []; a.blocks ||= []; a.asks ||= []; a.compactions ||= []; a.bursts ||= [];
    if (a.spawn) a.spawn.t = ms(a.spawn.t);
    for (const b of a.bursts) { b.a = ms(b.a); b.b = ms(b.b); }
    for (const r of a.requests) {
      r.t = ms(r.t);
      r.tokens ||= {};
      for (const k of ["context", "cacheRead", "cacheWrite", "uncached", "output", "reasoning"]) r.tokens[k] = Number(r.tokens[k]) || 0;
    }
    a.requests.sort((x, y) => x.t - y.t);
    for (const x of a.asks) x.t = ms(x.t);
    for (const x of a.compactions) x.t = ms(x.t);
    for (const b of a.blocks) b.t = ms(b.t);
  }
  trace.agents = trace.agents.filter(a => a.requests.length || a.kind === "root");
  const all = trace.agents.flatMap(a => a.requests.map(r => r.t));
  trace.started = ms(trace.started) || Math.min(...all);
  trace.ended = ms(trace.ended) || Math.max(...all);
  return trace;
}

async function start(trace) {
  S.tools = (await loadIndex())?.tools || null; // tool name -> site page, for the custody ladder's "Guided by"
  S.trace = normalize(trace);
  S.layout = buildLayout(S.trace);
  window.__trace = { S, set };
  $("#loader").hidden = true;
  $("#app").hidden = false;
  buildHud();
  const { webglAvailable } = await import("./scene.js").catch(() => ({ webglAvailable: () => false }));
  S.mode = !reducedMotion && webglAvailable() ? "3d" : "2d";
  if (params.get("view") === "2d") S.mode = "2d";
  if (params.get("view") === "3d" && webglAvailable()) S.mode = "3d";
  await setMode(S.mode);
  if (!started) {
    started = true;
    setupResizer();
    afterSideResize();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => { applySideWidth(sideW, false); layoutInsets(); if (S.mode === "2d") renderFlat(); renderMinimap(); scene?.refit(); });
  }
}
let started = false;

async function setMode(mode) {
  S.mode = mode;
  $("#mode").textContent = mode === "3d" ? "2D view" : "3D view";
  $("#mode").onclick = () => setMode(S.mode === "3d" ? "2d" : "3d");
  if (mode === "3d") {
    try {
      const { createScene } = await import("./scene.js");
      $("#flat").hidden = true;
      $("#stage").hidden = false;
      if (!scene) {
        scene = createScene($("#stage"), { trace: S.trace, layout: S.layout, reducedMotion, onHover: showTip, onPick: pick });
        window.__trace.scene = scene;
      }
    } catch (e) {
      console.warn("3D view unavailable, using the 2D view", e);
      $("#mode").hidden = true;
      return setMode("2d");
    }
  } else {
    $("#stage").hidden = true;
    $("#flat").hidden = false;
  }
  symbolLegend();
  layoutInsets();
  render(true);
}

// ---------- resizable side panel ----------
const SIDE_MIN = 320, SIDE_DEFAULT = 392, SIDE_KEY = "trace.sideWidth";
let sideW = SIDE_DEFAULT, sideBeforeWiden = SIDE_DEFAULT;
const sideMax = () => Math.max(SIDE_MIN, Math.round(innerWidth * 0.75));
function applySideWidth(w, save) {
  sideW = Math.round(Math.min(sideMax(), Math.max(SIDE_MIN, w)));
  $("#app").style.setProperty("--side-w", `${sideW}px`);
  const wide = sideW >= innerWidth * 0.55;
  $("#app").classList.toggle("wide", wide);
  $("#widen").setAttribute("aria-pressed", String(wide));
  $("#widen").textContent = wide ? "Narrow the panel" : "Widen for reading";
  $("#resizer").setAttribute("aria-valuenow", String(sideW));
  if (save) try { localStorage.setItem(SIDE_KEY, String(sideW)); } catch { /* storage may be unavailable */ }
}
function afterSideResize() {
  layoutInsets();
  renderMinimap();
  if (S.mode === "2d") renderFlat();
  scene?.refit();
  showReader();
}
function setupResizer() {
  let saved = null;
  try { saved = Number(localStorage.getItem(SIDE_KEY)) || null; } catch { /* no storage */ }
  applySideWidth(saved || SIDE_DEFAULT, false);
  const r = $("#resizer");
  r.setAttribute("aria-valuemin", String(SIDE_MIN));
  r.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    e.preventDefault();
    r.setPointerCapture(e.pointerId);
    r.classList.add("dragging");
    $("#app").classList.add("resizing");
    const move = ev => applySideWidth(innerWidth - ev.clientX - 16, false);
    const up = () => {
      r.removeEventListener("pointermove", move);
      r.classList.remove("dragging");
      $("#app").classList.remove("resizing");
      applySideWidth(sideW, true);
      afterSideResize();
    };
    r.addEventListener("pointermove", move);
    r.addEventListener("pointerup", up, { once: true });
    r.addEventListener("pointercancel", up, { once: true });
  });
  r.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    applySideWidth(sideW + (e.key === "ArrowLeft" ? 32 : -32), true);
    afterSideResize();
  });
  $("#widen").addEventListener("click", () => {
    if (sideW >= innerWidth * 0.55) applySideWidth(sideBeforeWiden < innerWidth * 0.55 ? sideBeforeWiden : SIDE_DEFAULT, true);
    else { sideBeforeWiden = sideW; applySideWidth(innerWidth * 0.6, true); }
    afterSideResize();
  });
}

function buildHud() {
  const t = S.trace;
  const st = sessionStats(t);
  $("#title").textContent = t.title || (t.product === "codex" ? "Codex session" : "Claude Code session");
  // More than one session among the dropped files: offer the others.
  const cands = (t.candidates || []).filter(c => c && c.id);
  const old = $("#session-pick");
  if (old) old.remove();
  if (cands.length > 1 && lastFiles) {
    const cur = cands.find(c => (t.agents[0]?.id || "") === c.id || (t.agents[0]?.id || "").includes(c.id) || c.id.includes(t.agents[0]?.id || "@")) || null;
    const sel = el("select", { id: "session-pick", class: "session-pick", "aria-label": `${cands.length} sessions in what you dropped` },
      cands.map(c => el("option", { value: c.id, selected: cur === c ? true : null, text: `${c.product === "codex" ? "Codex" : "Claude Code"} · ${clipName(c.name || c.id)} · ${fmtInt(c.files)} files, ${(c.bytes / 1048576).toFixed(1)} MB` })));
    sel.addEventListener("change", () => switchSession(sel.value));
    $(".hud-title").append(sel);
  }
  const stat = (b, s) => el("span", {}, el("b", { text: b }), s);
  // Only what the session has: no subagent slots for a single-agent session.
  $("#stats").replaceChildren(...[
    stat(fmtDur(st.wall), "wall clock"),
    stat(fmtInt(st.rootRequests), "main-thread requests"),
    st.subagents ? stat(fmtInt(st.subagents), `subagents, ${fmtInt(st.subRequests)} requests`) : null,
    st.subFresh ? stat(`${fmtTok(st.rootFresh)} vs ${fmtTok(st.subFresh)}`, "fresh tokens, main vs subagents") : stat(fmtTok(st.rootFresh), "fresh tokens"),
    stat(`${Math.round(st.cacheShare * 100)}%`, "of context read from cache"),
    st.sideFresh ? stat(fmtTok(st.sideFresh), "fresh tokens, side calls and reviews") : null].filter(Boolean));
  symbolLegend();
  $("#lenses").replaceChildren(...LENSES.map((l, i) => el("button", {
    type: "button", "aria-pressed": String(S.lens === l.key), "data-lens": l.key,
    onclick: () => { S.lens = l.key; render(); }
  }, el("b", { text: String(i + 1), "aria-hidden": "true" }), l.q)));
}

// The strata plus the marks the current view draws: the 3D view's flags and pins, the 2D chart's
// ask ticks and outward dots (writes show under lens 2).
// The legend: the layers and landmarks this session has, in the words of the current view.
function symbolLegend() {
  const lg = $("#legend");
  legend(lg);
  const t = S.trace, has = new Set(), acts = new Set();
  if (t) for (const a of t.agents) for (const r of a.requests) {
    for (const k in r.strata || {}) if (r.strata[k] > 0) has.add(k);
    if (r.action?.class) acts.add(r.action.class);
  }
  // legend() lists every stratum first, in STRATA order.
  if (t) [...lg.children].forEach((c, j) => { if (STRATA[j] && !has.has(STRATA[j].key)) c.remove(); });
  const sym = (color, text) => el("span", { class: "k sym" }, el("i", { style: `background:${color}` }), text);
  const asks = !t || t.agents.some(a => a.asks.length), got = k => !t || acts.has(k);
  if (S.mode === "2d") lg.append(...[asks ? sym(STRATA[STRATUM_INDEX.you].color, "tick: your ask") : null, got("outward") ? sym(STATUS.outward.color, "left the machine") : null, got("write") ? sym(STATUS.write.color, "wrote (lens 2)") : null].filter(Boolean));
  else lg.append(...[asks ? sym(STRATA[STRATUM_INDEX.you].color, "flag: your ask") : null, got("outward") ? sym(STATUS.outward.color, "left the machine") : null, got("write") ? sym(STATUS.write.color, "wrote") : null, got("read") ? sym(STATUS.read.color, "read") : null].filter(Boolean));
}

function clipName(s) { s = String(s); return s.length > 48 ? `${s.slice(0, 47)}…` : s; }

function layoutInsets() {
  if (!scene) { const h = $(".hud").getBoundingClientRect(); if (innerWidth > 760) $("#crumbs").style.top = `${Math.round(h.bottom + 8)}px`; return; }
  const vw = innerWidth, vh = innerHeight;
  const mobile = vw <= 760;
  const hud = $(".hud").getBoundingClientRect();
  // The HUD wraps when the panel is wide; the breadcrumbs follow its real bottom edge.
  $("#crumbs").style.top = mobile ? "" : `${Math.round(hud.bottom + 8)}px`;
  const crumbs = $("#crumbs").getBoundingClientRect();
  const panel = $("#panel").getBoundingClientRect();
  const mm = $("#minimap").getBoundingClientRect();
  const top = Math.max(hud.bottom, crumbs.bottom, mobile ? $("#lenses").getBoundingClientRect().bottom : 0) + 12;
  scene.setInsets(mobile
    ? { top, right: 8, left: 8, bottom: vh - panel.top + 8 }
    : { top, right: vw - panel.left + 12, left: 16, bottom: (mm.height ? mm.height + 24 : 16) });
}

// ---------- state ----------
function agentById(id) { return S.trace.agents.find(a => a.id === id); }
function set(patch) {
  const prev = { level: S.level, agentId: S.agentId };
  Object.assign(S, patch);
  S.agent = S.agentId ? agentById(S.agentId) : null;
  if (S.agent && !S.agent.requests.length && S.level > 0) S.level = 1;
  if (S.agent && S.reqIdx != null) S.reqIdx = Math.max(0, Math.min(S.agent.requests.length - 1, S.reqIdx));
  if (S.level < 3 || S.block == null) S.reading = false;
  render(prev.level !== S.level || prev.agentId !== S.agentId, patch.block != null);
}
function pick(p) {
  if (p.level === 3) return set({ level: 3, agentId: p.agentId, reqIdx: p.reqIdx, stratum: p.stratum, block: p.block ?? null });
  if (p.level === 2) return set({ level: 2, agentId: p.agentId, reqIdx: p.reqIdx, stratum: null, block: null });
  set({ level: 1, agentId: p.agentId, reqIdx: p.reqIdx ?? 0, stratum: null, block: null });
}
const A = {
  focusAgent: (id, i) => set({ level: 1, agentId: id, reqIdx: i ?? 0, stratum: null, block: null }),
  focusRequest: (id, i) => set({ level: 2, agentId: id, reqIdx: i, stratum: null, block: null }),
  focusStratum: (id, i, key) => set({ level: 3, agentId: id, reqIdx: i, stratum: key, block: null }),
  openBlock: i => set({ block: i }),
  openBlockAt(agentId, bi) {
    const a = agentById(agentId);
    const b = a?.blocks[bi];
    if (!b) return;
    let r = a.requests.findIndex(q => q.window && q.window[0] <= bi && q.window[1] >= bi);
    if (r < 0) r = Math.max(0, a.requests.findIndex(q => q.t >= b.t));
    set({ level: 3, agentId, reqIdx: r, stratum: b.kind, block: bi });
  },
  openRef(agentId, ref) {
    const a = agentById(agentId);
    const bi = a?.blocks.findIndex(b => b.ref && b.ref.file === ref.file && b.ref.offset === ref.offset);
    if (bi >= 0) A.openBlockAt(agentId, bi);
  },
  getText: (agentId, ref) => (text ? text(agentId, ref) : Promise.reject(new Error("no text source"))),
  // Narrow screens: the reader can take the whole screen.
  reading: () => S.reading,
  toggleReading() { S.reading = !S.reading; render(false, true); },
  // Per line of `text`: true when the site publishes that line (the product's wording). Null without an index.
  async templateLines(text) {
    const ix = await loadIndex();
    if (!ix || !ix.lines) return null;
    return String(text).split("\n").map(raw => normalizeLine(raw).length >= MIN_INDEXED_LINE && Object.prototype.hasOwnProperty.call(ix.lines, lineHash(raw)));
  },
  up
};
function up() {
  if (S.reading) { S.reading = false; return render(false, true); }
  if (S.level === 3 && S.block != null) return set({ block: null });
  if (S.level === 3) return set({ level: 2, stratum: null });
  if (S.level === 2) return set({ level: 1 });
  if (S.level === 1) return set({ level: 0, agentId: null, reqIdx: null });
}

function onKey(e) {
  if ($("#app").hidden || !S.trace) return;
  if (e.target.closest && e.target.closest("input, textarea, select")) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Escape") { e.preventDefault(); up(); return; }
  if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && S.level >= 1 && S.agent) {
    e.preventDefault();
    const step = (e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 1);
    set({ reqIdx: (S.reqIdx ?? 0) + step, block: null });
    return;
  }
  if (e.key === "Enter" && S.level === 1 && document.activeElement === document.body) { set({ level: 2 }); return; }
  // Enter at the session opens the main thread, so the keyboard can get into the landscape.
  if (e.key === "Enter" && S.level === 0 && document.activeElement === document.body) { A.focusAgent(S.layout.root.id, 0); return; }
  const n = Number(e.key);
  if (n >= 1 && n <= 4) { S.lens = LENSES[n - 1].key; render(); }
}

// ---------- render ----------
function render(levelChanged, readerOpened) {
  $("#app").dataset.level = String(S.level);
  $("#app").classList.toggle("reading", S.reading);
  if (levelChanged) $("#tip").hidden = true;
  document.querySelectorAll("#lenses button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lens === S.lens)));
  renderCrumbs();
  placeCrumbs();
  renderPanel($("#panel"), S, A);
  if (levelChanged) $("#panel").scrollTop = 0;
  if (readerOpened) showReader();
  renderMinimap();
  layoutInsets();
  if (S.mode === "3d" && scene) scene.show({ level: S.level, agentId: S.agentId, reqIdx: S.reqIdx, stratum: S.stratum, lens: S.lens });
  if (S.mode === "2d") renderFlat();
}

// The reader opens above the block list: bring its top into the panel's view. (Set scrollTop rather
// than scrollIntoView, which would also scroll the fixed app shell.)
function showReader() {
  const panel = $("#panel"), reader = panel.querySelector(".reader");
  if (!reader) return;
  panel.scrollTop += reader.getBoundingClientRect().top - panel.getBoundingClientRect().top - 8;
}

function renderCrumbs() {
  const c = $("#crumbs");
  const parts = [["Session", () => set({ level: 0, agentId: null, reqIdx: null, stratum: null, block: null })]];
  if (S.level >= 1 && S.agent) parts.push([S.agent.kind === "root" ? "Main thread" : S.agent.name || S.agent.id, () => set({ level: 1, stratum: null, block: null })]);
  if (S.level >= 2 && S.reqIdx != null) parts.push([`Request ${S.reqIdx + 1}`, () => set({ level: 2, stratum: null, block: null })]);
  if (S.level >= 3 && S.stratum) parts.push([STRATA[STRATUM_INDEX[S.stratum]].name, () => set({ block: null })]);
  if (S.level >= 3 && S.block != null && S.agent?.blocks[S.block]) parts.push([S.agent.blocks[S.block].label || "block", () => {}]);
  const kids = [];
  parts.forEach(([name, fn], i) => {
    if (i) kids.push(el("span", { class: "sep", "aria-hidden": "true", text: "›" }));
    kids.push(el("button", { type: "button", text: name, onclick: fn, "aria-current": String(i === parts.length - 1) }));
  });
  if (!TOUCH) kids.push(el("span", { class: "keys", text: S.level === 0 ? (S.mode === "3d" ? "click a ridge · drag to orbit · Enter main thread · 1–4 lenses" : "click the chart · Enter main thread · 1–4 lenses") : "Esc up · ← → requests" }));
  c.replaceChildren(...kids);
}

function renderMinimap() {
  const host = $("#minimap");
  if (S.mode !== "3d" || innerWidth <= 760) { host.hidden = true; return; }
  host.hidden = false;
  const w = Math.min(520, Math.max(280, innerWidth - sideW - 16 * 4 - 120));
  renderOverview(host, S.trace, S.layout, { width: w, height: 132, full: false, lens: S.lens, focus: { agentId: S.agentId, reqIdx: S.level >= 1 ? S.reqIdx : null },
    // From the session, a lane opens that agent with the cursor on the request; inside an open agent it opens the request.
    onPick: p => (p.reqIdx != null && S.level >= 2 && p.agentId === S.agentId ? A.focusRequest(p.agentId, p.reqIdx) : A.focusAgent(p.agentId, p.reqIdx)) });
}

// The free area the 2D view can use: below the HUD, crumbs and (on phones) the lens row; left of the
// side panel, or above the bottom panel and the view button on phones.
// Phones: the crumbs sit under the lens grid, whatever its height.
function placeCrumbs() {
  if (innerWidth <= 760) $("#app").style.setProperty("--crumbs-top", `${Math.round($("#lenses").getBoundingClientRect().bottom + 8)}px`);
}

function flatInsets() {
  const mobile = innerWidth <= 760;
  placeCrumbs();
  const bottomOf = s => $(s)?.getBoundingClientRect().bottom || 0;
  const top = Math.max(bottomOf(".hud"), bottomOf("#crumbs"), mobile ? bottomOf("#lenses") : 0) + 12;
  if (!mobile) {
    $(".viewtools").style.bottom = "";
    return { top, right: innerWidth - $("#panel").getBoundingClientRect().left + 12, bottom: 56, left: 24 };
  }
  const panelTop = $("#panel").getBoundingClientRect().top;
  $(".viewtools").style.bottom = `${Math.round(innerHeight - panelTop + 8)}px`;
  return { top, right: 12, bottom: innerHeight - panelTop + 52, left: 12 };
}

function renderFlat() {
  const host = $("#flat");
  const ins = flatInsets();
  host.style.padding = `${ins.top}px ${ins.right}px ${ins.bottom}px ${ins.left}px`;
  const w = Math.max(280, innerWidth - ins.left - ins.right);
  const box = el("div");
  const svgHost = el("div");
  const caption = el("h2", { text: S.level === 0 ? "Main-thread context over time, with outward actions and subagent lanes"
    : S.agent ? `${S.agent.kind === "root" ? "Main thread" : S.agent.name}: one column per request, height = exact context` : "" });
  box.append(caption, svgHost);
  host.replaceChildren(box);
  // The chart takes what the caption leaves of the free area.
  const h = Math.max(140, Math.min(640, innerHeight - ins.top - ins.bottom - caption.offsetHeight - 14));
  if (S.level === 0) {
    renderOverview(svgHost, S.trace, S.layout, { width: w, height: h, full: true, lens: S.lens,
      onPick: p => (p.reqIdx != null ? A.focusAgent(p.agentId, p.reqIdx) : A.focusAgent(p.agentId)) });
  } else if (S.agent) {
    renderAgentColumns(svgHost, S.agent, { width: w, height: h, reqIdx: S.reqIdx, onPick: i => A.focusRequest(S.agent.id, i) });
  }
}

function showTip(hit) {
  const tip = $("#tip");
  if (!hit) { tip.hidden = true; return; }
  const a = agentById(hit.agentId);
  const r = a?.requests[hit.reqIdx];
  if (!r) { tip.hidden = true; return; }
  const who = a.kind === "root" ? "Main thread" : `${a.name}${a.kind === "side" ? " (side call)" : a.kind === "guardian" && !/^guardian/i.test(a.name || "") ? " (guardian review)" : ""}`;
  const kids = [el("b", { text: `${who} · request ${hit.reqIdx + 1}` }), el("div", { class: "m", text: `${fmtWhen(r.t)} · ${fmtTok(r.tokens.context)} tokens in context` })];
  if (a.kind === "subagent" && S.level === 0) {
    // A subagent ridge: who it is and what it cost, rather than one request's detail.
    const st = agentStats(a);
    const task = a.description || a.path || null;
    kids.splice(0, 2, el("b", { text: a.name || a.id }),
      task ? el("div", { text: clip(task, 160) }) : null,
      el("div", { class: "m", text: `${modelFamily(a.model) === "other" ? a.model || "" : modelFamily(a.model)} · ${fmtTok(st.fresh)} fresh tokens · ${fmtInt(st.requests)} requests · peak ${fmtTok(st.peak)}` }),
      el("div", { class: "m", text: "Click to open its ridge" }));
  } else if (hit.kind === "stratum") {
    const s = STRATA[STRATUM_INDEX[hit.stratum]];
    kids.push(el("div", { text: `${s.name}: ≈ ${fmtTok(r.strata?.[hit.stratum] || 0)} · click to list its blocks` }));
  } else {
    const top = largestLayer(r);
    kids.push(el("div", { class: "m", text: top ? `largest layer: ${top.name} ≈ ${fmtTok(top.tokens)}` : "split unknown: the log has no blocks for this request" }));
    if (r.action && r.action.kind === "tool") kids.push(el("div", { text: `${r.action.tool}${r.action.target ? `: ${r.action.target.slice(0, 80)}` : ""}` }));
  }
  tip.replaceChildren(...kids.filter(Boolean));
  tip.hidden = false;
  const x = Math.min(innerWidth - 330, hit.x + 14), y = Math.min(innerHeight - 110, hit.y + 14);
  tip.style.left = `${x}px`; tip.style.top = `${y}px`;
}
