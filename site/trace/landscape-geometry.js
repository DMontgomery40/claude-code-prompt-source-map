// Where the landscape puts things (no three.js): the x, row, crest, strata tops, slope depth and
// profile of every request on every ridge. scene.js draws the solid ridges from these numbers, and
// anything that must sit exactly on a ridge (the playhead, the director) reads the same ones.
import { STRATA } from "./panels.js";
import { BASE_H, landscapeRule, tread, treadAt, terrainPlacement } from "./scene-rules.js";

const ROOT_DEPTH = 7;                       // the main ridge's shallowest slope
const ROOT_TAPER = 0.18, SUB_TAPER = 0.3;   // flat ends past a segment's first and last request

// Cumulative stratum tops of one request in STRATA order, at `scale` world units per token:
// out[0..5] the tops of harness..agents, out[6] the crest (the whole context), out[7] 1 when the
// split is unknown (every top then sits at the crest and the ridge is drawn grey), else 0.
export function topsOf(r, scale) {
  const st = r.strata || {};
  let sum = 0;
  for (const s of STRATA) sum += st[s.key] || 0;
  const total = (r.tokens.context || 0) * scale;
  const out = new Float32Array(8);
  if (!sum) { out.fill(total); out[7] = 1; return out; } // split unknown
  let acc = 0;
  STRATA.forEach((s, j) => { acc += (st[s.key] || 0) / sum * total; out[j] = acc; });
  out[6] = total;
  return out;
}

// layout: L from minimap.js buildLayout. massif: the main ridge's slope depth per unit of height, as
// asked for (?massif=, default 2); a compact single massif caps it at 1.4. W, yScale and rule default
// to the ones the scene derives from the layout.
export function createGeometry({ trace, layout: L, W, yScale, rule, massif: askedMassif = 2 }) {
  rule ||= landscapeRule(L);
  W ??= rule.width;
  yScale ??= BASE_H / (L.yMax * 1.02);
  const massif = rule.compact ? Math.min(askedMassif, 1.4) : askedMassif;
  const { subDepth: SUB_DEPTH, sideZ: SIDE_Z, laneZ } = terrainPlacement();
  const rootInfo = L.info.get(L.root.id);

  const rootDepth = h => Math.max(ROOT_DEPTH, h * massif);
  const subDepth = () => SUB_DEPTH;
  const rootBack = rootDepth(Math.max(0, ...L.root.requests.map(r => (r.tokens.context || 0) * yScale)));
  // a broad rounded shoulder behind the crest, falling away steeply at the back; a single massif keeps
  // a flatter plateau, so its request-by-request terraces run back from the face where they can be seen
  const shoulder = rule.compact ? 3.5 : 2.3;
  const profile = u => 1 - Math.pow(Math.min(1, Math.max(0, u)), shoulder);

  // The rows: agent id -> [{ seg, zFront }], the main ridge first, then each subagent's lane per burst.
  // An agent with no entry (side, guardian) is not a ridge.
  const rowZ = new Map();
  const ridgeSegs = new Map(); // agent id -> [{ inf, seg, taper }]
  rowZ.set(L.root.id, rootInfo.segments.map(s => ({ seg: s, zFront: 0 })));
  ridgeSegs.set(L.root.id, rootInfo.segments.map(seg => ({ inf: rootInfo, seg, taper: ROOT_TAPER })));
  for (const [id, inf] of L.info) {
    if (inf.agent.kind !== "subagent") continue;
    rowZ.set(id, inf.segments.map(seg => ({ seg, zFront: laneZ(seg.lane) })));
    ridgeSegs.set(id, inf.segments.map(seg => ({ inf, seg, taper: SUB_TAPER })));
  }
  const stepped = agent => rule.stepped && agent === L.root;
  const rowOf = (agent, i) => {
    const list = rowZ.get(agent.id);
    return list ? list.find(e => i >= e.seg.i0 && i <= e.seg.i1) || list[0] : null;
  };
  const segOf = (agent, i) => {
    const list = ridgeSegs.get(agent.id);
    return list ? list.find(e => i >= e.seg.i0 && i <= e.seg.i1) || list[0] : null;
  };

  const x = (agent, i) => (L.info.get(agent.id)?.xs[i] ?? 0) * W;
  const crest = (agent, i) => {
    const r = agent.requests[i];
    return (r?.tokens.context || 0) * yScale;
  };
  const z = (agent, i) => {
    const hit = rowOf(agent, i);
    return hit ? hit.zFront : SIDE_Z;
  };
  const lane = (agent, i) => agent.kind === "subagent" ? rowOf(agent, i)?.seg.lane ?? -1 : -1;
  const tops = (agent, i) => {
    const out = topsOf(agent.requests[i], yScale);
    out.aB0 = out.subarray(0, 4);
    out.aB1 = out.subarray(4, 8);
    return out;
  };
  // The stretch of the face that belongs to request i: from the midpoint with request i-1 to the
  // midpoint with request i+1, the segment's first and last reaching `taper` past their request.
  // On a stepped massif this is exactly the flat tread drawn; elsewhere the face is drawn through each
  // request's x and this is the stretch nearest it.
  const tread_ = (agent, i) => {
    const s = segOf(agent, i);
    if (!s) { const xi = x(agent, i); return [xi, xi]; }
    return tread(k => s.inf.xs[k] * W, s.seg.i0, s.seg.i1, i, s.taper);
  };
  const depth = (agent, h) => agent === L.root ? rootDepth(h) : agent.kind === "subagent" ? SUB_DEPTH : 0;

  // Face height at x on one segment (-1 beyond its tapered ends): a stepped massif is flat per tread,
  // any other ridge linear between requests.
  const heightAtSeg = (agent, inf, seg, x, taper) => {
    const xs = inf.xs;
    if (stepped(agent)) {
      const i = treadAt(k => xs[k] * W, seg.i0, seg.i1, x, taper);
      return i < 0 ? -1 : (agent.requests[i].tokens.context || 0) * yScale;
    }
    const x0 = xs[seg.i0] * W, x1 = xs[seg.i1] * W;
    const ctx = i => (agent.requests[i].tokens.context || 0) * yScale;
    if (x < x0) return x0 - x > taper ? -1 : ctx(seg.i0);
    if (x > x1) return x - x1 > taper ? -1 : ctx(seg.i1);
    let lo = seg.i0, hi = seg.i1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] * W <= x) lo = m; else hi = m; }
    const xa = xs[lo] * W, xb = xs[hi] * W;
    const f = xb > xa ? (x - xa) / (xb - xa) : 0;
    return ctx(lo) * (1 - f) + ctx(hi) * f;
  };
  // Face height at x on any of the agent's segments, or -1 off its ridge.
  const heightAt = (agent, x) => {
    for (const s of ridgeSegs.get(agent.id) || []) {
      const h = heightAtSeg(agent, s.inf, s.seg, x, s.taper);
      if (h >= 0) return h;
    }
    return -1;
  };

  return {
    W, yScale, rule, massif, rootBack, shoulder, sideZ: SIDE_Z, subDepthValue: SUB_DEPTH,
    rootTaper: ROOT_TAPER, subTaper: SUB_TAPER,
    rowZ, ridgeSegs, stepped, segOf,
    rootDepth, subDepth, depth, profile,
    x, z, crest, lane, tops, tread: tread_, heightAt, heightAtSeg
  };
}
