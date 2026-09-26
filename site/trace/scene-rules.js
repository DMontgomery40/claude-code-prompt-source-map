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
