// Words at max zoom. At the Layers zoom the blocks of the playhead's leading grain column get HTML
// panes with their own text: the ridge is made of words. One pooled CSS2D pane per band tall enough
// to hold a line (40 px on screen), anchored at the band's centre on the ridge face; the tallest bands
// win the room. Text comes from the worker on demand (cached, at most 4 reads at a time) and reaches
// the DOM through textContent only: log text is untrusted.
import { Vector3 } from "./vendor/three.module.min.js";
import { CSS2DObject } from "./vendor/CSS2DRenderer.js";
import { STRATA, STRATUM_INDEX, fmtTok, clip } from "./panels.js";
import { placeLabel } from "./scene-rules.js";
import { FLAGS } from "./grain-rules.js";

// Pixel sizes mirror block-text.css: caption line 16 + padding 5 + 5, body lines 18 after a 2 px gap.
export const PANE = {
  minBandPx: 40, maxLines: 5, maxChars: 400, fetches: 4, timeoutMs: 15000, cacheSize: 600,
  chromePx: 26, bodyGapPx: 2, linePx: 18, widthPx: 360, charsPerLine: 46, faceZ: 0.3
};
const NOTE = { none: "not in the log", image: "image", empty: "(empty)", failed: "text unavailable" };

// Cache key of a block's text. Several blocks share one log line (file and offset) and differ only in
// path, range or rebuild (claude-code.js: system prompt, cli prefix and tool definitions of one row),
// so the key carries every field that selects the text.
export function refKey(ref) {
  const key = `${ref.file}:${ref.offset}`;
  const more = [ref.length, ref.path, ref.range, ref.rebuild];
  return more.every(v => v == null) ? key : `${key}:${JSON.stringify(more)}`;
}

// What a pane shows for one text read: the words (whitespace collapsed, 400 characters at most, ending
// in an ellipsis when cut), or a short note for images and empty blocks.
export function paneText(result) {
  const text = typeof result === "string" ? result : result?.text ?? "";
  if (/^data:image\//.test(text)) return { text: NOTE.image, note: true };
  const words = clip(text, PANE.maxChars);
  return words ? { text: words, note: false } : { text: NOTE.empty, note: true };
}

// Body lines a band of `px` screen pixels holds under the caption: 1 to 5.
export function paneLines(px) {
  return Math.max(1, Math.min(PANE.maxLines, Math.floor((px - PANE.chromePx - PANE.bodyGapPx) / PANE.linePx)));
}

export function createBlockText({ getText, group, maxPanes = 24, onChange = () => {} }) {
  const cache = new Map();   // key -> { promise, resolve, done, value }; oldest first
  const queue = [];          // reads waiting for one of the 4 slots
  const timers = new Set();
  const pool = [];           // { o, el, label, body, band, textKey, lines, rect }
  let inFlight = 0, wanted = new Set(), disposed = false;

  function settle(key, entry, value, keep) {
    entry.done = true; entry.value = value;
    if (!keep && cache.get(key) === entry) cache.delete(key); // a timeout may be retried later
    entry.resolve(value);
    if (disposed) return;
    let changed = false;
    for (const p of pool) if (p.textKey === key && p.o.visible) { setBody(p, value); changed = true; }
    if (changed) onChange();
  }
  function pump() {
    while (!disposed && inFlight < PANE.fetches && queue.length) {
      // panes on screen now go first; reads for bands that have gone wait their turn
      const at = Math.max(0, queue.findIndex(j => wanted.has(j.key)));
      const job = queue.splice(at, 1)[0];
      inFlight++;
      let open = true, timer = 0;
      const done = (value, keep) => {
        if (!open) return;
        open = false; clearTimeout(timer); timers.delete(timer); inFlight--;
        settle(job.key, job.entry, value, keep);
        pump();
      };
      // a read that never answers must not hold a slot
      timer = setTimeout(() => done({ text: NOTE.failed, note: true }, false), PANE.timeoutMs);
      timers.add(timer);
      new Promise(resolve => resolve(getText(job.agentId, job.ref)))
        .then(r => done(paneText(r), true), () => done({ text: NOTE.failed, note: true }, true));
    }
  }
  // The cached read of one block's text: the same promise for the same ref, resolving to { text, note }.
  function text(agentId, ref) {
    const key = refKey(ref);
    let entry = cache.get(key);
    if (entry) { cache.delete(key); cache.set(key, entry); return entry.promise; }
    entry = { done: false, value: null };
    entry.promise = new Promise(resolve => { entry.resolve = resolve; });
    cache.set(key, entry);
    for (const [k, e] of cache) {
      if (cache.size <= PANE.cacheSize) break;
      if (e.done) cache.delete(k);
    }
    queue.push({ key, entry, agentId, ref });
    pump();
    return entry.promise;
  }
  const cached = ref => { const e = cache.get(refKey(ref)); return e?.done ? e.value : null; };

  function makePane() {
    const el = document.createElement("div");
    el.className = "word-pane";
    const cap = document.createElement("div");
    cap.className = "word-cap";
    const swatch = document.createElement("span");
    swatch.className = "word-swatch";
    const label = document.createElement("span");
    label.className = "word-label";
    cap.append(swatch, label);
    const body = document.createElement("div");
    body.className = "word-body";
    el.append(cap, body);
    const o = new CSS2DObject(el);
    o.center.set(0, 0.5);
    o.visible = false;
    group.add(o);
    const p = { o, el, label, body, band: "", textKey: null, lines: 0, rect: null };
    pool.push(p);
    return p;
  }
  function setBody(p, value) {
    const v = value || { text: "", note: false }; // loading: the caption alone
    if (p.body.textContent !== v.text) p.body.textContent = v.text;
    const cls = v.note ? "word-body note" : "word-body";
    if (p.body.className !== cls) p.body.className = cls;
    p.el._w = undefined; // re-measured: the size changed
  }
  function release(p) { p.o.visible = false; p.band = ""; p.textKey = null; p.rect = null; }

  // Caption, and where the words come from: a read of the block's ref, or a note.
  function describe(agent, band, tok) {
    const size = ` · ≈ ${fmtTok(tok)}`;
    const s = STRATA[band.stratum] || STRATA[0];
    const b = band.blockIndex >= 0 ? agent.blocks?.[band.blockIndex] : null;
    if (!b || band.flags & FLAGS.unlogged) return { caption: `${s.name}${size}`, value: { text: NOTE.none, note: true } };
    // a Harness part of a block of another kind is the product's wording around the user's text
    const wrapper = STRATUM_INDEX[b.kind] !== band.stratum;
    const caption = (wrapper ? `${clip(b.label || b.kind, 26)} · product wording` : clip(b.label || b.kind, 40)) + size;
    if (!(band.flags & FLAGS.hasRef) || !b.ref) return { caption, value: { text: NOTE.none, note: true } };
    if (b.image) return { caption, value: { text: NOTE.image, note: true } };
    return { caption, ref: b.ref };
  }

  const _a = new Vector3(), _cam = new Vector3();
  function project(camera, viewport, x, y, z) {
    _a.set(x, y, z).project(camera);
    return { px: (_a.x + 1) / 2 * viewport.width, py: (1 - _a.y) / 2 * viewport.height, z: _a.z };
  }

  // Show panes for the bands of request i of `agent` (bandsForRequest output, y in tokens).
  // viewport = { width, height, insets: { top, right, bottom, left } } in CSS px; pxPerUnit (optional)
  // is screen px per world unit up the column, used only to skip bands that cannot reach 40 px.
  function update({ camera, agent, agentId = agent?.id, bands, geom, i, pxPerUnit, viewport }) {
    if (disposed) return { shown: 0, candidates: 0 };
    const ins = viewport.insets || {};
    const box = { x0: ins.left || 0, x1: viewport.width - (ins.right || 0), y0: ins.top || 0, y1: viewport.height - (ins.bottom || 0) };
    const items = [];
    let x = 0, z = 0;
    const ys = geom?.yScale ?? 1;
    if (agent && bands?.length) {
      const [t0, t1] = geom.tread(agent, i), zF = geom.z(agent, i);
      x = (t0 + t1) / 2; z = zF + PANE.faceZ;
      // the face looks toward +z: seen from behind (normal · view direction >= 0) it shows no words
      camera.updateMatrixWorld();
      const front = camera.isOrthographicCamera ? camera.getWorldDirection(_cam).z < 0 : _cam.setFromMatrixPosition(camera.matrixWorld).z > zF;
      for (const b of front ? bands : []) {
        const tok = b.y1 - b.y0;
        if (pxPerUnit > 0 && tok * ys * pxPerUnit < PANE.minBandPx * 0.5) continue;
        const lo = project(camera, viewport, x, b.y0 * ys, z), hi = project(camera, viewport, x, b.y1 * ys, z);
        const px = Math.round(Math.hypot(hi.px - lo.px, hi.py - lo.py) * 100) / 100; // no float noise at 40 px
        if (!(px >= PANE.minBandPx)) continue;
        const at = project(camera, viewport, x, (b.y0 + b.y1) / 2 * ys, z);
        if (at.z < -1 || at.z > 1 || at.px < box.x0 || at.px > box.x1 || at.py < box.y0 || at.py > box.y1) continue;
        items.push({ b, tok, px, at });
      }
    }
    // declutter along the column: the tallest bands first (ties bottom to top), each pane to the right
    // of its anchor or, where that runs out of room, to the left
    items.sort((p, q) => q.px - p.px || p.b.y0 - q.b.y0);
    const placed = [], chosen = [];
    for (const it of items) {
      if (chosen.length >= maxPanes) break;
      const info = describe(agent, it.b, it.tok);
      const known = info.value || cached(info.ref);
      const lines = Math.min(paneLines(it.px), known ? Math.max(1, Math.ceil(known.text.length / PANE.charsPerLine)) : PANE.maxLines);
      const key = `${agentId}:${it.b.b}`;
      const w = pool.find(p => p.band === key)?.el._w || PANE.widthPx;
      const h = PANE.chromePx + PANE.bodyGapPx + lines * PANE.linePx;
      const spot = placeLabel({ px: it.at.px, py: it.at.py, w, h, cx: 0, cy: 0.5, flip: true }, box, placed);
      if (!spot) continue;
      placed.push(spot);
      chosen.push({ b: it.b, info, lines, key, spot });
    }
    // a band keeps the pane it had, so its words do not flash
    const keep = new Set(chosen.map(c => c.key));
    for (const p of pool) if (p.band && !keep.has(p.band)) release(p);
    wanted = new Set();
    for (const c of chosen) {
      const p = pool.find(q => q.band === c.key) || pool.find(q => !q.band) || makePane();
      const fresh = p.band !== c.key;
      p.band = c.key;
      p.o.position.set(x, (c.b.y0 + c.b.y1) / 2 * ys, z);
      p.o.center.x = c.spot.cx;
      p.o.visible = true;
      p.rect = c.spot;
      if (fresh) {
        p.el.style.setProperty("--c", (STRATA[c.b.stratum] || STRATA[0]).color);
        p.label.textContent = c.info.caption;
        p.el._w = undefined;
      }
      if (p.lines !== c.lines) { p.el.style.setProperty("--lines", String(c.lines)); p.lines = c.lines; p.el._w = undefined; }
      if (c.info.ref) {
        const k = refKey(c.info.ref);
        wanted.add(k);
        if (fresh || p.textKey !== k) {
          p.textKey = k;
          setBody(p, cached(c.info.ref));
          if (!cached(c.info.ref)) text(agentId, c.info.ref);
        }
      } else if (fresh) { p.textKey = null; setBody(p, c.info.value); }
    }
    // whole-pixel placement (the vendor CSS2DRenderer patch) needs each pane's size
    for (const p of pool) {
      if (p.o.visible && p.el._w === undefined && p.el.isConnected && p.el.offsetWidth) { p.el._w = p.el.offsetWidth; p.el._h = p.el.offsetHeight; }
    }
    pump();
    return { shown: chosen.length, candidates: items.length };
  }

  // Screen rectangles of the panes on screen, for the scene's own label declutter.
  function rects(camera, width, height) {
    const out = [];
    for (const p of pool) {
      if (!p.o.visible) continue;
      _a.setFromMatrixPosition(p.o.matrixWorld).project(camera);
      const w = p.el._w || p.rect?.w || PANE.widthPx, h = p.el._h || p.rect?.h || PANE.chromePx;
      const px = (_a.x + 1) / 2 * width, py = (1 - _a.y) / 2 * height;
      out.push({ x: px - p.o.center.x * w, y: py - p.o.center.y * h, w, h });
    }
    return out;
  }

  return {
    update,
    text,
    rects,
    clear() { for (const p of pool) release(p); wanted = new Set(); },
    stats: () => ({ panes: pool.length, visible: pool.filter(p => p.o.visible).length, inFlight, queued: queue.length, cached: cache.size }),
    dispose() {
      disposed = true;
      for (const t of timers) clearTimeout(t);
      timers.clear();
      for (const p of pool) { group.remove(p.o); p.el.remove?.(); }
      pool.length = 0; queue.length = 0; cache.clear();
    }
  };
}
