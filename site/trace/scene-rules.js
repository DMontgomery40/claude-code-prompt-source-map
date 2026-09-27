// Pure rules behind the landscape (no three.js), shared by scene.js and its tests.
import { collapseStart } from "./grain-rules.js";

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

// Whether the grain trench widens for the puck of a compaction at request iLead + 1: exactly while the
// leading column collapses (the kernel's kC > 0, from lastReq + 0.7), never at iLead + FOCUS (0.65, where
// focusing a request puts the playhead: request iLead complete, nothing collapsing).
export function collapseWidens(uP, iLead) { return uP > collapseStart(iLead); }

// The grain columns the re-read sweep crosses: the K columns up to the leading request i, but never back
// past the start of i's ridge segment (segStart), so the sweep does not bridge an idle gap to the trail
// columns of the segment before. iFirst is the first request swept, col0 its column (0 = the oldest).
export function sweepColumns(i, K, segStart = 0) {
  const iFirst = Math.max(0, i - K + 1, Math.min(i, segStart));
  return { iFirst, col0: iFirst - (i - K + 1) };
}

// Frame-time governor for grain density. Only intervals between two consecutively rendered frames are
// frame cost: the scene renders on demand while the user explores, and the pause before a render that
// follows an idle stretch is not slowness, so such a push (contiguous false) neither slows nor calms.
// Every `window` samples, a p90 above the slow threshold multiplies density by `down` (never below
// `floor`); `calm` samples in a row under the calm threshold multiply it by `up` (never above 1). The
// thresholds are `high` / `low` ms, raised to 1.5x / 1.2x the display's frame interval: rAF intervals on
// a 60 Hz display jitter up to ~18.7 ms with no load (p90 18.0-18.4 ms measured), so a flat 18 ms reads
// vsync jitter as slowness, while a dropped frame is ~33 ms. The display interval is the lowest p25 of
// the last `cadenceWindows` windows, capped at 1000/60 (a scene slow from its first frame still counts
// as slow; moving to a slower display recovers within a few windows). Intervals over `gap` ms are idle.
export function createDensityGovernor({ window = 30, high = 18, low = 12, calm = 30, down = 0.75, up = 1.1, floor = 0.05, gap = 250, cadenceWindows = 8 } = {}) {
  let density = 1, sinceEval = 0, calmRun = 0;
  const samples = [], p25s = [];
  const pick = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  const cadence = () => Math.min(1000 / 60, ...p25s);
  return {
    get density() { return density; },
    get cadence() { return cadence(); },
    push(dt, contiguous = true) {
      if (!contiguous || !(dt > 0) || dt > gap) return density;
      samples.push(dt);
      if (samples.length > window) samples.shift();
      calmRun = dt < Math.max(low, 1.2 * cadence()) ? calmRun + 1 : 0;
      if (++sinceEval >= window && samples.length >= window) {
        sinceEval = 0;
        const sorted = [...samples].sort((a, b) => a - b);
        p25s.push(pick(sorted, 0.25));
        if (p25s.length > cadenceWindows) p25s.shift();
        if (pick(sorted, 0.9) > Math.max(high, 1.5 * cadence())) { density = Math.max(floor, density * down); calmRun = 0; }
      }
      if (calmRun >= calm) { density = Math.min(1, density * up); calmRun = 0; }
      return density;
    },
    reset() { density = 1; sinceEval = 0; calmRun = 0; samples.length = 0; p25s.length = 0; }
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

// Map detail refresh (scene.js updateMapDetail): the beacons, cluster badges, map labels and word panes are
// rebuilt only when the view changed or the leading request of the words did, never merely because a frame
// was drawn. `prev` is the last refresh ({ t, anchors, zoom, key }, or null before the first); `next` is this
// frame ({ t, anchors, zoom, key, playing, force }). anchors are the screen px [x0, y0, x1, y1, ...] of fixed
// world points (the orbit target and four points at its depth near the viewport corners, captured at the last
// refresh), so an orbit about the target moves the corners even though the target stays put. The result:
// `refresh` now; `moved`: the view changed (or the refresh is forced), so everything is rebuilt; otherwise only
// the key (the words' request) changed and only the words follow it; `pending`: something changed but the
// refresh waits for the interval, so the caller keeps drawing frames until it is due (a view that stops
// moving inside the interval still gets its refresh).
export const DETAIL_MOVE_PX = 0.5;   // an anchor moved more than this on screen since the last refresh
export const DETAIL_ZOOM = 0.01;     // or the map zoom changed by more than 1%
export const DETAIL_MIN_MS = 90;     // refreshes at least this far apart while the view moves
export const DETAIL_PLAY_MS = 100;   // and at most 10 Hz while playing
export function shouldRefreshDetail(prev, next) {
  if (!prev || next.force) return { refresh: true, moved: true, pending: false };
  let moved = !(Math.abs(next.zoom / prev.zoom - 1) <= DETAIL_ZOOM) || next.anchors.length !== prev.anchors.length;
  for (let k = 0; !moved && k < next.anchors.length; k += 2) {
    moved = !(Math.hypot(next.anchors[k] - prev.anchors[k], next.anchors[k + 1] - prev.anchors[k + 1]) <= DETAIL_MOVE_PX);
  }
  if (!moved && next.key === prev.key) return { refresh: false, moved: false, pending: false };
  const due = next.t - prev.t >= (next.playing ? DETAIL_PLAY_MS : DETAIL_MIN_MS);
  return { refresh: due, moved, pending: !due };
}

// The navigator (map-overview.js) redraws its terrain only when what it draws changed (`key`: the lens, the
// playhead's cut, the haze distance), and at most 10 Hz while playing; its viewport outline is SVG and follows
// the camera on its own. prev: the last redraw ({ t, key }) or null; next: { t, key, playing }.
export function shouldRedrawNavigator(prev, next) {
  if (prev && next.key === prev.key) return { redraw: false, pending: false };
  const due = !prev || !next.playing || next.t - prev.t >= DETAIL_PLAY_MS;
  return { redraw: due, pending: !due };
}
