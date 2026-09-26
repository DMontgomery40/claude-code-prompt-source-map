// Trace viewer: loading, state, levels, keyboard, and wiring between the scene, minimap and panels.
// Everything runs locally. The only network requests are this page's own static files.
import { STRATA, STRATUM_INDEX, STATUS, LENSES, el, fmtTok, fmtInt, fmtDur, fmtClock, fmtWhen, sessionStats, renderPanel, blockTokens, agentStats, clip, modelFamily } from "./panels.js";
import { buildLayout, renderOverview, renderAgentColumns, legend } from "./minimap.js";

const params = new URLSearchParams(location.search);
const $ = s => document.querySelector(s);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const S = {
  trace: null, layout: null, level: 0, agentId: null, agent: null, reqIdx: null, stratum: null, block: null,
  lens: "context", mode: "3d", custodyFn: null
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
  $("#back-to-load").addEventListener("click", () => location.reload());
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

async function loadFiles(files) {
  if (!files || !files.length) return;
  const logs = files.filter(f => /\.(jsonl|json)$/i.test(f.path));
  if (!logs.length) return showError("No .jsonl session logs in what was dropped.");
  setProgress(0, `Reading ${fmtInt(files.length)} files…`);
  lastFiles = files;
  try {
    const trace = await parseInWorker(files, pasteRoot);
    text = workerText;
    start(trace);
  } catch (e) {
    showError(e.message || String(e));
  }
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

// Codex thread ids are UUIDv7: the first 48 bits are Unix milliseconds, which name the folder and file.
function describePaste(v) {
  const out = $("#paste-out");
  out.replaceChildren();
  v = v.trim();
  if (!v) return;
  const pathRow = (p, note) => {
    const b = el("button", { class: "btn small", type: "button", text: "Copy" });
    b.addEventListener("click", () => navigator.clipboard?.writeText(p).then(() => { b.textContent = "Copied"; }, () => { b.textContent = "Select and copy"; }));
    return note ? [el("div", { class: "path" }, el("code", { text: p }), b), el("p", { text: note })] : [el("div", { class: "path" }, el("code", { text: p }), b)];
  };
  const uuid = (v.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
  pasteRoot = uuid ? uuid.toLowerCase() : null;
  if (uuid) out.append(el("p", { class: "note", text: "When you drop a folder holding several sessions, this one opens." }));
  if (/^codex:\/\//i.test(v) || (uuid && uuid[14] === "7" && !/\.claude\//.test(v))) {
    if (!uuid) return out.append(el("p", { text: "That deeplink has no thread id." }));
    const ms = parseInt(uuid.replace(/-/g, "").slice(0, 12), 16);
    const d = new Date(ms);
    const p2 = n => String(n).padStart(2, "0");
    const day = `${d.getFullYear()}/${p2(d.getMonth() + 1)}/${p2(d.getDate())}`;
    const stamp = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
    out.append(el("p", { text: `Codex thread started ${fmtWhen(ms)}. Its log:` }),
      ...pathRow(`~/.codex/sessions/${day}/rollout-${stamp}-${uuid.toLowerCase()}.jsonl`),
      el("p", { text: "Subagents and guardian reviews live in their own files. To bring them too, drop the whole folder:" }),
      ...pathRow("~/.codex/sessions", "or just the date folders from this day to the session's last day."),
      el("p", { class: "note", text: "The file name uses local time; if the seconds are off by one, look in the same folder." }));
    return;
  }
  if (/\.claude\/projects\//.test(v) || uuid) {
    let file = v;
    if (!/\.jsonl$/.test(file)) file = uuid ? `~/.claude/projects/<project>/${uuid}.jsonl` : v;
    const folder = file.replace(/\.jsonl$/, "/");
    out.append(el("p", { text: "Claude Code session log:" }), ...pathRow(file),
      el("p", { text: "Drop it together with its same-named folder, which holds the subagents:" }), ...pathRow(folder),
      ...(file.includes("<project>") ? [el("p", { class: "note", text: "<project> is the working directory with each / replaced by -, for example -Users-you-code-app." })] : []));
    return;
  }
  out.append(el("p", { text: "Paste a codex://threads/… link, a thread id, or a Claude Code session id or path." }));
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
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", () => { layoutInsets(); if (S.mode === "2d") renderFlat(); renderMinimap(); scene?.refit(); });
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
  layoutInsets();
  render(true);
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
  $("#stats").replaceChildren(
    stat(fmtDur(st.wall), "wall clock"),
    stat(fmtInt(st.rootRequests), "main-thread requests"),
    stat(fmtInt(st.subagents), `subagents, ${fmtInt(st.subRequests)} requests`),
    stat(`${fmtTok(st.rootFresh)} vs ${fmtTok(st.subFresh)}`, "fresh tokens, main vs subagents"),
    stat(`${Math.round(st.cacheShare * 100)}%`, "of context read from cache"));
  const lg = $("#legend");
  legend(lg);
  lg.append(el("span", { class: "k sym" }, el("i", { style: `background:${STRATA[STRATUM_INDEX.you].color}` }), "flag: your ask"),
    el("span", { class: "k sym" }, el("i", { style: `background:${STATUS.outward.color}` }), "beacon: left the machine"));
  $("#lenses").replaceChildren(...LENSES.map((l, i) => el("button", {
    type: "button", "aria-pressed": String(S.lens === l.key), "data-lens": l.key,
    onclick: () => { S.lens = l.key; render(); }
  }, el("b", { text: String(i + 1), "aria-hidden": "true" }), l.q)));
}

function clipName(s) { s = String(s); return s.length > 48 ? `${s.slice(0, 47)}…` : s; }

function layoutInsets() {
  if (!scene) return;
  const vw = innerWidth, vh = innerHeight;
  const mobile = vw <= 760;
  const hud = $(".hud").getBoundingClientRect();
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
  render(prev.level !== S.level || prev.agentId !== S.agentId);
}
function pick(p) {
  if (p.level === 3) return set({ level: 3, agentId: p.agentId, reqIdx: p.reqIdx, stratum: p.stratum, block: null });
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
  up
};
function up() {
  if (S.level === 3 && S.block != null) return set({ block: null });
  if (S.level === 3) return set({ level: 2, stratum: null });
  if (S.level === 2) return set({ level: 1 });
  if (S.level === 1) return set({ level: 0, agentId: null, reqIdx: null });
}

function onKey(e) {
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
  const n = Number(e.key);
  if (n >= 1 && n <= 4) { S.lens = LENSES[n - 1].key; render(); }
}

// ---------- render ----------
function render(levelChanged) {
  $("#app").dataset.level = String(S.level);
  if (levelChanged) $("#tip").hidden = true;
  document.querySelectorAll("#lenses button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lens === S.lens)));
  renderCrumbs();
  renderPanel($("#panel"), S, A);
  if (levelChanged) $("#panel").scrollTop = 0;
  renderMinimap();
  layoutInsets();
  if (S.mode === "3d" && scene) scene.show({ level: S.level, agentId: S.agentId, reqIdx: S.reqIdx, stratum: S.stratum, lens: S.lens });
  if (S.mode === "2d") renderFlat();
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
  kids.push(el("span", { class: "keys", text: S.level === 0 ? (S.mode === "3d" ? "click a ridge · drag to orbit · 1–4 lenses" : "click the chart · 1–4 lenses") : "Esc up · ← → requests" }));
  c.replaceChildren(...kids);
}

function renderMinimap() {
  const host = $("#minimap");
  if (S.mode !== "3d" || innerWidth <= 760) { host.hidden = true; return; }
  host.hidden = false;
  const w = Math.min(520, Math.max(320, innerWidth - 392 - 16 * 4 - 120));
  renderOverview(host, S.trace, S.layout, { width: w, height: 132, full: false, lens: S.lens, focus: { agentId: S.agentId, reqIdx: S.level >= 1 ? S.reqIdx : null },
    onPick: p => (p.reqIdx != null ? A.focusRequest(p.agentId, p.reqIdx) : A.focusAgent(p.agentId)) });
}

function renderFlat() {
  const host = $("#flat");
  const w = Math.max(300, host.clientWidth - (innerWidth > 760 ? 444 : 24));
  const h = Math.max(260, Math.min(640, innerHeight - (innerWidth > 760 ? 200 : 420)));
  const box = el("div");
  if (S.level === 0) {
    box.append(el("h2", { text: "Main-thread context over time, with outward actions and subagent lanes" }));
    const svgHost = el("div");
    renderOverview(svgHost, S.trace, S.layout, { width: w, height: h, full: true, lens: S.lens,
      onPick: p => (p.reqIdx != null ? A.focusAgent(p.agentId, p.reqIdx) : A.focusAgent(p.agentId)) });
    box.append(svgHost);
  } else if (S.agent) {
    box.append(el("h2", { text: `${S.agent.kind === "root" ? "Main thread" : S.agent.name}: one column per request, height = exact context` }));
    const svgHost = el("div");
    renderAgentColumns(svgHost, S.agent, { width: w, height: h, reqIdx: S.reqIdx, onPick: i => A.focusRequest(S.agent.id, i) });
    box.append(svgHost);
  }
  host.replaceChildren(box);
}

function showTip(hit) {
  const tip = $("#tip");
  if (!hit) { tip.hidden = true; return; }
  const a = agentById(hit.agentId);
  const r = a?.requests[hit.reqIdx];
  if (!r) { tip.hidden = true; return; }
  const who = a.kind === "root" ? "Main thread" : `${a.name}${a.kind === "side" ? " (side call)" : a.kind === "guardian" ? " (guardian review)" : ""}`;
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
    let top = null;
    for (const s of STRATA) if (!top || (r.strata?.[s.key] || 0) > (r.strata?.[top.key] || 0)) top = s;
    if (top) kids.push(el("div", { class: "m", text: `largest layer: ${top.name} ≈ ${fmtTok(r.strata?.[top.key] || 0)}` }));
    if (r.action && r.action.kind === "tool") kids.push(el("div", { text: `${r.action.tool}${r.action.target ? `: ${r.action.target.slice(0, 80)}` : ""}` }));
  }
  tip.replaceChildren(...kids.filter(Boolean));
  tip.hidden = false;
  const x = Math.min(innerWidth - 330, hit.x + 14), y = Math.min(innerHeight - 110, hit.y + 14);
  tip.style.left = `${x}px`; tip.style.top = `${y}px`;
}
