// Pure rules behind the landscape (no three.js), shared by scene.js and its tests.

export const BASE_W = 220;   // world width of a session with a subagent field
export const BASE_H = 32;    // world height of the tallest context

// A session with no subagent ridges is one massif. It is drawn close to side-on, no longer than
// three times its height, with a stepped crest (one tread per request) so its story reads as a profile.
export function landscapeRule({ lanes }) {
  const compact = !lanes;
  return { compact, width: compact ? 3 * BASE_H : BASE_W, stepped: compact };
}

// Request i's tread on a stepped crest: from the midpoint with request i-1 to the midpoint with
// request i+1; the first and last treads reach `taper` past their request.
export function tread(xAt, i0, i1, i, taper) {
  const x = xAt(i);
  return [i > i0 ? (xAt(i - 1) + x) / 2 : x - taper, i < i1 ? (x + xAt(i + 1)) / 2 : x + taper];
}

// The request whose tread holds x (the nearest request), or -1 beyond the segment's tapered ends.
export function treadAt(xAt, i0, i1, x, taper) {
  if (x < xAt(i0) - taper || x > xAt(i1) + taper) return -1;
  let lo = i0, hi = i1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xAt(m) <= x) lo = m; else hi = m; }
  return hi > lo && x - xAt(lo) > xAt(hi) - x ? hi : lo;
}

// Mid-session injections worth a crest label, one per request: large blocks inserted after the first
// request, and any copy of the user's own setup sent again. The largest block names the label with
// its own size; the others are counted separately, never merged into its number.
export function crestEvents(blocks, sizeOf, limit = 12) {
  const byReq = new Map();
  blocks.forEach((b, bi) => {
    if (b.carried || b.seenBy == null || b.seenBy === 0) return;
    if (!(b.kind === "injected" || b.own)) return;
    if (!(b.est >= 900 || (b.resendOf != null && b.est >= 150))) return;
    let e = byReq.get(b.seenBy);
    if (!e) byReq.set(b.seenBy, e = { i: b.seenBy, total: 0, n: 0, top: -1, topSize: 0 });
    const s = sizeOf(b);
    e.total += s; e.n++;
    if (e.top < 0 || s > e.topSize) { e.top = bi; e.topSize = s; }
  });
  return [...byReq.values()].sort((x, y) => y.total - x.total || x.i - y.i).slice(0, limit);
}

// Where a label may sit: its own anchor first, then (when it may flip) the mirrored anchor, so a label
// near the right edge turns inward instead of hiding. Returns the first placement that stays inside
// `box` and clear of `placed`, or null.
export function placeLabel(it, box, placed, gap = [6, 3]) {
  const tries = !it.flip ? [it.cx] : it.cx === 0.5 ? [0.5, 1, 0] : [it.cx, 1 - it.cx];
  for (const cx of tries) {
    const x = it.px - cx * it.w, y = it.py - it.cy * it.h;
    if (x < box.x0 || x + it.w > box.x1 || y < box.y0 || y + it.h > box.y1) continue;
    if (placed.some(q => x < q.x + q.w + gap[0] && q.x < x + it.w + gap[0] && y < q.y + q.h + gap[1] && q.y < y + it.h + gap[1])) continue;
    return { cx, x, y, w: it.w, h: it.h };
  }
  return null;
}

// Model changes along one agent's requests: [{ i, from, to }].
export function modelSwitches(requests) {
  const out = [];
  let prev = null;
  requests.forEach((r, i) => {
    if (!r.model || r.model.startsWith("<")) return; // "<synthetic>" rows are not a model
    if (prev && r.model !== prev) out.push({ i, from: prev, to: r.model });
    prev = r.model;
  });
  return out;
}

// Semantic map zoom, with hysteresis so tiny wheel movements do not flicker labels.
export function mapDetail(zoom, previous = 0) {
  const thresholds = [1.55, 2.8, 5];
  const z = Number.isFinite(zoom) ? Math.max(0, zoom) : 1;
  let level = Math.max(0, Math.min(3, Math.trunc(previous) || 0));
  while (level < 3 && z >= thresholds[level] * 1.08) level++;
  while (level > 0 && z < thresholds[level - 1] * 0.88) level--;
  return { level, name: ['Overview', 'Agents', 'Requests', 'Layers'][level], cell: [46, 32, 20, 12][level], labelBudget: [0, 16, 30, 44][level] };
}

export function cappedMarkerHeight(worldHeight, projectedPixels, maxPixels = 48) {
  if (!(worldHeight > 0) || !(projectedPixels > 0)) return 0;
  return worldHeight * Math.min(1, maxPixels / projectedPixels);
}

// Keep the shallow agent field on the viewer's side of the main massif. Its rows
// are shared by terrain, links and picking; no separate minimap lane arrangement.
export function terrainPlacement() {
  const subDepth = 3.4, sideZ = 5.5, spacing = 5.2;
  return { subDepth, sideZ, laneZ: lane => 17 + lane * spacing };
}

// Grain columns near the playhead: how many request columns of the focused agent are drawn as grains.
// None while a request's tread is under 2 px on screen (at overview a request is about one pixel wide,
// so grains would be pixel noise), then 4, 8 and 16 at the Agents, Requests and Layers levels. Grains
// fill their tread edge to edge, so a 2 px tread holds a solid strip of 2 px grains. pxPerColumn is the
// on-screen width of the agent's mean request pitch. `previous` (the last result) gives both gates
// hysteresis, so a column that hovers near a threshold does not flicker.
export const GRAIN_COLUMN_MIN_PX = 2;
const GRAIN_K = [0, 4, 8, 16];
export function grainColumns(mapZoom, pxPerColumn, previous = 0) {
  const on = Number.isFinite(pxPerColumn) && pxPerColumn >= GRAIN_COLUMN_MIN_PX * (previous > 0 ? 0.9 : 1);
  if (!on) return 0;
  const prevLevel = Math.max(0, GRAIN_K.indexOf(previous));
  return GRAIN_K[mapDetail(mapZoom, prevLevel).level];
}

// Frame-time governor for grain density: keeps the last `window` frame intervals; every `window`
// samples, a p90 above the slow threshold multiplies density by `down` (never below `floor`); `calm`
// frames in a row under the calm threshold multiply it by `up` (never above 1). The thresholds are
// `high` / `low` ms, raised to 1.5x / 1.2x the display's frame interval: rAF intervals on a 60 Hz
// display jitter up to ~18.7 ms with no load at all (p90 18.0-18.4 ms measured, headless and headed),
// so a flat 18 ms reads vsync jitter as slowness, while a dropped frame is ~33 ms. The display interval
// is the lowest window p25 seen, capped at 1000/60 (so a scene slow from its first frame still counts
// as slow). Intervals over `gap` ms are idle time between renders, not frame cost, and are ignored.
export function createDensityGovernor({ window = 30, high = 18, low = 12, calm = 120, down = 0.75, up = 1.1, floor = 0.05, gap = 250 } = {}) {
  let density = 1, sinceEval = 0, calmRun = 0, cadence = 1000 / 60;
  const samples = [];
  const pick = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return {
    get density() { return density; },
    get cadence() { return cadence; },
    push(dt) {
      if (!(dt > 0) || dt > gap) return density;
      samples.push(dt);
      if (samples.length > window) samples.shift();
      calmRun = dt < Math.max(low, 1.2 * cadence) ? calmRun + 1 : 0;
      if (++sinceEval >= window && samples.length >= window) {
        sinceEval = 0;
        const sorted = [...samples].sort((a, b) => a - b);
        cadence = Math.min(cadence, pick(sorted, 0.25));
        if (pick(sorted, 0.9) > Math.max(high, 1.5 * cadence)) { density = Math.max(floor, density * down); calmRun = 0; }
      }
      if (calmRun >= calm) { density = Math.min(1, density * up); calmRun = 0; }
      return density;
    },
    reset() { density = 1; sinceEval = 0; calmRun = 0; samples.length = 0; }
  };
}

// Sweep labels (scene.js updateSweepLabels): of the bands in a request's leading column, the injected
// (flag 1) or re-sent (flag 2) blocks of at least `min` tokens, largest first, at most `limit`. A band is
// labelled once the sweep (0..1 up the column) reaches its bottom, y0 / context.
export function sweepLabelBands(bands, { min = 900, limit = 6 } = {}) {
  return bands
    .filter(b => (b.flags & 3) && b.blockIndex >= 0 && b.y1 - b.y0 >= min)
    .sort((a, b) => (b.y1 - b.y0) - (a.y1 - a.y0) || a.y0 - b.y0)
    .slice(0, limit);
}
// A sweep label's opacity `age` seconds after the sweep passed it: full for the first third, then a
// smooth fade to nothing at 1 s (null: remove it).
export function sweepLabelOpacity(age) {
  if (!(age >= 0) || age >= 1) return null;
  const t = Math.min(1, Math.max(0, (age - 0.35) / 0.65));
  return 1 - t * t * (3 - 2 * t);
}
