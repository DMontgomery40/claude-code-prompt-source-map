// Grains: the strata made countable. One instanced quad per step of tokens, whose position is a pure
// function of three static tables and a time uniform uT (request space: 1234.37 is 37% through
// request 1234). This module builds the tables, the grain id buffer and the shuffled chunks, and
// ports the vertex kernel to JS so node tests pin what the GLSL must do. No three.js, no DOM.
//
// Units: x and z are world units from the injected geometry; y is in tokens (the scene multiplies
// by yScale). Strata order is STRATA from panels.js, never KINDS from model.js.
import { STRATA } from "./panels.js";
import { windowBlocks } from "./model.js";

export const STRATA_KEYS = STRATA.map((s) => s.key);
const NK = STRATA_KEYS.length; // 7
const K_HARNESS = STRATA_KEYS.indexOf("harness");
const K_INJECTED = STRATA_KEYS.indexOf("injected");

export const REQ_TEXELS = 5;
export const BLOCK_TEXELS = 2;
export const TABLE_WIDTH = 2048;
export const SLOT_BITS = 12;
export const MAX_SLOTS = 1 << SLOT_BITS; // 4096
export const GRAIN_SIZES = [10, 20, 50, 100, 200, 500, 1000];
export const GRAIN_CAP = 400_000;

// dropHeightTokens is a fraction of the column's context (tokens), so every column drops the same
// share of its height. puckRadius (world units) and spiralTurns shape the compaction puck.
export const KERNEL = { pourWindow: 0.6, fallDur: 0.5, dropHeightTokens: 0.12, collapseDur: 0.8, jitterX: 0.35, jitterZ: 0.6, puckRadius: 0.8, spiralTurns: 5 };
// A grain rests anywhere across its request's tread (the table's `centre` +- half width) and up to
// GRAIN_DEPTH world units behind the face (or the ridge's own depth, if less: the table's `depth`), so
// neighbouring columns meet as one slab. jitterX and jitterZ above are no longer read.
export const GRAIN_DEPTH = 1.5;

// Block row flags (texel 1 .y). continued: the row continues the previous row of the same part at
// the next request (its prefix changed), so it arrives settled and the previous row vanishes in
// place. unlogged: the harness the log doesn't carry (no block, no text).
export const FLAGS = { injected: 1, resend: 2, own: 4, carried: 8, hasRef: 16, continued: 32, unlogged: 64 };

// ---------- hash (identical in GLSL ES 3.0 with uint arithmetic) ----------
export const HASH_NAME = "lowbias32";
// Salts for the independent draws a grain needs besides h (pour offset and spiral).
export const HASH_SALT = { x: 0x68bc21eb, z: 0x02e5be93 };

export function hashU32(x) {
  x >>>= 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}
export function hashGrainU32(b, s) {
  return hashU32((Math.imul(b, 0x9E3779B1) ^ s) >>> 0);
}
// Top 24 bits over 2^24: exact in float32, so GLSL's float(u >> 8u) / 16777216.0 is bit-identical,
// and never 1.0 (float(u) / 4294967296.0 rounds up to 1.0 for u >= 2^32 - 128).
export const u32ToUnit = (u) => (u >>> 8) / 16777216;
export function hashGrain(b, s) {
  return u32ToUnit(hashGrainU32(b, s));
}
// Derived draws: re-hash the grain's uint with a salt.
export function hashDerived(u, salt) {
  return u32ToUnit(hashU32((u ^ salt) >>> 0));
}

// ---------- grain size ----------
export function chooseGrainSize(totalEst, cap = GRAIN_CAP) {
  for (const n of GRAIN_SIZES) if (Math.ceil(totalEst / n) <= cap) return n;
  return GRAIN_SIZES[GRAIN_SIZES.length - 1];
}

// ---------- shared helpers ----------
const estOf = (b) => b.est ?? Math.ceil((b.chars || 0) / 4);
// A block's estimate within stratum k: model.blockPart with the synthetic est fallback.
function partOf(b, k) {
  const h = b.harnessEst || 0;
  const key = STRATA_KEYS[k];
  if (key === b.kind) return estOf(b) - h;
  return k === K_HARNESS ? h : 0;
}
const hasScale = (agent) => agent.requests.some((r) => r.window && r.scale);

// The harness the log doesn't carry: a virtual part listed first in Harness at every windowed
// request. The synthetic session (no scale anywhere) has an inferred harness with no harnessEst:
// size it by its first windowed request.
function unloggedEst(agent) {
  if (agent.harnessSource === "logged") return 0;
  if (agent.harnessEst) return agent.harnessEst;
  if (hasScale(agent)) return 0;
  const first = agent.requests.find((r) => r.window && r.strata && r.strata.harness > 0);
  return first ? first.strata.harness : 0;
}

// Epochs: epoch 0 starts at request 0; a new epoch starts at each request whose window starts after
// the previous windowed request's (a compaction, logged or not). Requests without a window keep the
// current epoch.
function epochsOf(agent) {
  const n = agent.requests.length;
  const epochOf = new Int32Array(n);
  const starts = n ? [0] : [];
  let prev = null;
  for (let j = 0; j < n; j++) {
    const r = agent.requests[j];
    if (r.window) {
      if (prev && r.window[0] > prev.window[0]) starts.push(j);
      prev = r;
    }
    epochOf[j] = starts.length - 1;
  }
  return { epochOf, starts };
}

function textureSize(texels) {
  const height = Math.max(1, Math.ceil(texels / TABLE_WIDTH));
  return { width: TABLE_WIDTH, height };
}

// ---------- request table ----------
// Per request (REQ_TEXELS = 5 RGBA32F texels, texel index i * 5 + t, at (idx % 2048, idx / 2048)):
//   t0 [x, contextTokens, epochId, treadHalfWidth]
//   t1 [base0, base1, base2, base3]
//   t2 [base4, base5, base6, sumStrata]
//   t3 [scale0, scale1, scale2, scale3]
//   t4 [scale4, scale5, scale6, zFront]
// base[k] is the stratum's bottom in tokens and scale[k] turns a part's est into tokens, both already
// normalised by context / sumStrata (1 on real logs), so y = base[k] + est_offset * scale[k] matches
// the ridge face exactly. sumStrata = 0 means the split is unknown (grey ridge): no grains.
export function buildRequestTable(agent, geom) {
  const reqs = agent.requests;
  const n = reqs.length;
  const { width, height } = textureSize(n * REQ_TEXELS);
  const data = new Float32Array(width * height * 4);
  const base = new Float64Array(n * NK), scale = new Float64Array(n * NK);
  const context = new Float64Array(n), sums = new Float64Array(n);
  const centre = new Float64Array(n), depth = new Float64Array(n);
  const { epochOf, starts } = epochsOf(agent);
  const fallback = !hasScale(agent);
  const U = unloggedEst(agent);
  for (let j = 0; j < n; j++) {
    const r = reqs[j];
    const st = STRATA_KEYS.map((k) => (r.strata && r.strata[k]) || 0);
    const sum = st.reduce((s, v) => s + v, 0);
    const ctx = (r.tokens && r.tokens.context) || 0;
    const f = sum > 0 ? ctx / sum : 0;
    let sc;
    if (!fallback) sc = STRATA_KEYS.map((k) => (r.scale && r.scale[k]) || 0);
    else {
      // Synthetic: scale = strata / sum of est of the parts in context.
      const est = new Float64Array(NK);
      if (r.window) {
        est[K_HARNESS] += U;
        for (const b of windowBlocks(agent, r)) for (let k = 0; k < NK; k++) { const p = partOf(b, k); if (p > 0) est[k] += p; }
      }
      sc = st.map((v, k) => (est[k] > 0 ? v / est[k] : 0));
    }
    let acc = 0;
    for (let k = 0; k < NK; k++) {
      base[j * NK + k] = acc * f;
      scale[j * NK + k] = sc[k] * f;
      acc += st[k];
    }
    context[j] = ctx;
    sums[j] = sum;
    const [x0, x1] = geom.tread(agent, j);
    centre[j] = (x0 + x1) / 2;
    const ridge = geom.depth ? geom.depth(agent, ctx * (geom.yScale ?? 1)) : GRAIN_DEPTH;
    depth[j] = Math.min(GRAIN_DEPTH, ridge > 0 ? ridge : GRAIN_DEPTH);
    const o = j * REQ_TEXELS * 4;
    data[o] = geom.x(agent, j); data[o + 1] = ctx; data[o + 2] = epochOf[j]; data[o + 3] = (x1 - x0) / 2;
    for (let k = 0; k < 4; k++) data[o + 4 + k] = base[j * NK + k];
    for (let k = 4; k < 7; k++) data[o + 8 + k - 4] = base[j * NK + k];
    data[o + 11] = sum;
    for (let k = 0; k < 4; k++) data[o + 12 + k] = scale[j * NK + k];
    for (let k = 4; k < 7; k++) data[o + 16 + k - 4] = scale[j * NK + k];
    data[o + 19] = geom.z(agent, j);
  }
  // Pucks: each epoch's puck sits at its first request, half the post-compaction context high. The
  // compaction is matched by time (between the previous request and the epoch's first); without one
  // (epoch 0, an unlogged window drop) the first request's context stands in for `post`.
  const epochs = starts.map((start, e) => {
    const end = e + 1 < starts.length ? starts[e + 1] - 1 : n - 1;
    const r = reqs[start];
    const prevT = start > 0 ? reqs[start - 1].t : -Infinity;
    const c = e > 0 ? (agent.compactions || []).find((c) => c.t > prevT - 1 && c.t <= r.t + 1 && c.post > 0) : null;
    const post = c ? c.post : context[start];
    return { start, end, compaction: c ? agent.compactions.indexOf(c) : null, puck: [geom.x(agent, start), 0.5 * post, geom.z(agent, start)] };
  });
  // Puck table for the GPU (4 floats per epoch): [puckX, puckY (tokens), puckZ, startRequest].
  const epochData = new Float32Array(Math.max(1, epochs.length) * 4);
  epochs.forEach((e, q) => epochData.set([e.puck[0], e.puck[1], e.puck[2], e.start], q * 4));
  return { data, texels: REQ_TEXELS, width, height, count: n, epochs, epochData, epochOf, base, scale, context, sum: sums, centre, depth };
}

// ---------- block table ----------
// A row is one part of one block (a block's harness wrapper and its own text are separate parts) over
// one contiguous run of requests where it is in context with a constant prefix. Rows are in block
// order (the unlogged harness first), then stratum, then interval. A part with more than 4096 slots
// takes consecutive rows that differ only in slotBase.
// Per row (BLOCK_TEXELS = 2 RGBA32F texels, texel index row * 2 + t):
//   t0 [stratumIndex, prefixEst, step, seenBy]
//   t1 [lastReq, flags, epoch, slotBase]
// prefixEst: est of the parts listed before this one in its stratum (constant over the row).
// step = est / nSlots with nSlots = ceil(est / N0): tokens per grain for this part, so a part's grains
// fill its band exactly. Stored, not recomputed in GLSL (float division there isn't exact).
// epoch: the epoch whose puck the row collapses into (lastReq + 1 starts it), or -1: no collapse (in
// context at the end, or it leaves without a compaction, or it continues in the next row).
export function buildBlockTable(agent, opts = {}) {
  const reqs = agent.requests;
  const { epochOf } = epochsOf(agent);
  const U = unloggedEst(agent);
  const parts = []; // { bi, k, est, start, end, prefix, flags }
  const splits = { prefix: 0, gap: 0 };
  const acc = new Float64Array(NK);
  // Each block has at most two parts: its own kind and a harness wrapper. Precompute them once.
  const nb = agent.blocks.length;
  const kOwn = new Int8Array(nb + 1).fill(-1), eOwn = new Float64Array(nb + 1), eWrap = new Float64Array(nb + 1), fl = new Uint8Array(nb + 1);
  for (let q = 0; q < nb; q++) {
    const b = agent.blocks[q];
    const k = STRATA_KEYS.indexOf(b.kind);
    const h = b.harnessEst || 0;
    kOwn[q + 1] = k; eOwn[q + 1] = estOf(b) - h; eWrap[q + 1] = k === K_HARNESS ? 0 : h; // model.blockPart
    fl[q + 1] = (b.resendOf != null ? FLAGS.resend : 0) | (b.carried ? FLAGS.carried : 0) | (b.ref ? FLAGS.hasRef : 0) | (b.own ? FLAGS.own : 0);
  }
  kOwn[0] = K_HARNESS; eOwn[0] = U; fl[0] = FLAGS.unlogged; // the unlogged harness, slot 0
  // Open part per (block + 1, stratum): index into parts, -1 none.
  const open = new Int32Array((nb + 1) * NK).fill(-1);
  const touch = (q, k, est, prefix, j, flags) => {
    const key = q * NK + k;
    const ci = open[key];
    const cur = ci >= 0 ? parts[ci] : null;
    if (cur && cur.end === j - 1 && Math.abs(cur.prefix - prefix) <= 1e-9 * Math.max(1, prefix)) { cur.end = j; return; }
    let f = flags;
    if (cur) {
      if (cur.end === j - 1) { splits.prefix++; f |= FLAGS.continued; cur.continues = true; }
      else splits.gap++;
    }
    open[key] = parts.length;
    parts.push({ bi: q - 1, k, est, start: j, end: j, prefix, flags: f });
  };
  const visit = (q, j) => {
    const k = kOwn[q];
    if (k < 0) return;
    const w = eWrap[q];
    if (w > 0) { touch(q, K_HARNESS, w, acc[K_HARNESS], j, fl[q] & ~FLAGS.own); acc[K_HARNESS] += w; }
    const e = eOwn[q];
    if (e > 0) { touch(q, k, e, acc[k], j, fl[q] | (k === K_INJECTED ? FLAGS.injected : 0)); acc[k] += e; }
  };
  for (let j = 0; j < reqs.length; j++) {
    const r = reqs[j];
    if (!r.window) continue;
    acc.fill(0);
    if (U > 0) visit(0, j);
    // Block order within the request (model.windowBlocks): the window, plus extras merged in.
    if (r.extra && r.extra.length) for (const b of windowBlocks(agent, r)) visit(b.i + 1, j);
    else for (let q = Math.max(0, r.window[0]), e = Math.min(nb - 1, r.window[1]); q <= e; q++) visit(q + 1, j);
  }
  parts.sort((a, b) => a.bi - b.bi || a.k - b.k || a.start - b.start);
  let totalEst = 0;
  for (const p of parts) totalEst += p.est;
  const N0 = opts.N0 ?? chooseGrainSize(totalEst, opts.cap ?? GRAIN_CAP);
  // Expand parts into table rows (slot splits).
  let count = 0;
  for (const p of parts) { p.nSlots = Math.ceil(p.est / N0); count += Math.ceil(p.nSlots / MAX_SLOTS); }
  const meta = {
    est: new Float64Array(count), step: new Float64Array(count), prefixEst: new Float64Array(count),
    seenBy: new Int32Array(count), lastReq: new Int32Array(count), stratum: new Uint8Array(count),
    flags: new Uint8Array(count), epoch: new Int32Array(count), blockIndex: new Int32Array(count),
    slotBase: new Int32Array(count), nSlots: new Int32Array(count), N0,
  };
  const { width, height } = textureSize(count * BLOCK_TEXELS);
  const data = new Float32Array(width * height * 4);
  const n = reqs.length;
  let row = 0;
  for (const p of parts) {
    const step = p.est / p.nSlots;
    const next = p.end + 1;
    const epoch = !p.continues && next < n && epochOf[next] !== epochOf[p.end] ? epochOf[next] : -1;
    for (let sb = 0; sb < p.nSlots; sb += MAX_SLOTS, row++) {
      meta.est[row] = p.est; meta.step[row] = step; meta.prefixEst[row] = p.prefix;
      meta.seenBy[row] = p.start; meta.lastReq[row] = p.end; meta.stratum[row] = p.k;
      meta.flags[row] = p.flags; meta.epoch[row] = epoch; meta.blockIndex[row] = p.bi;
      meta.slotBase[row] = sb; meta.nSlots[row] = Math.min(MAX_SLOTS, p.nSlots - sb);
      const o = row * BLOCK_TEXELS * 4;
      data[o] = p.k; data[o + 1] = p.prefix; data[o + 2] = step; data[o + 3] = p.start;
      data[o + 4] = p.end; data[o + 5] = p.flags; data[o + 6] = epoch; data[o + 7] = sb;
    }
  }
  return { data, texels: BLOCK_TEXELS, width, height, count, meta, N0, totalEst, splits };
}

// ---------- grains ----------
// id = row << 12 | slot (slot < 4096), unsigned. Chunks: consecutive rows totalling about chunkSize
// grains, never splitting a row; each chunk is shuffled so any prefix is a uniform subsample.
export function buildGrains(blockMeta, N0, { chunkSize = 32768 } = {}) {
  if (blockMeta.N0 !== N0) throw new Error(`buildGrains: N0 ${N0} differs from the block table's N0 ${blockMeta.N0}`);
  const rows = blockMeta.nSlots.length;
  let count = 0;
  for (let r = 0; r < rows; r++) count += blockMeta.nSlots[r];
  const ids = new Uint32Array(count);
  const chunks = [];
  let at = 0, cStart = 0, cRow = 0;
  for (let r = 0; r < rows; r++) {
    const ns = blockMeta.nSlots[r];
    if (at > cStart && at - cStart + ns > chunkSize) { chunks.push({ start: cStart, count: at - cStart, blockLo: cRow, blockHi: r }); cStart = at; cRow = r; }
    for (let s = 0; s < ns; s++) ids[at++] = (r * MAX_SLOTS + s) >>> 0;
  }
  if (at > cStart) chunks.push({ start: cStart, count: at - cStart, blockLo: cRow, blockHi: rows });
  for (const c of chunks) shuffleBatches(ids, c.start, c.count);
  return { ids, chunks, count, N0 };
}

const bitrev7 = (t) => {
  let r = 0;
  for (let q = 0; q < 7; q++) r |= ((t >> q) & 1) << (6 - q);
  return r;
};

// Stratified shuffle: the range is cut into consecutive batches of `batch` grains (block order), and
// the output takes one grain from every batch per round, batches in a seeded order, positions inside
// a batch in bit-reversed order XOR a seeded mask. Any prefix of m rounds is an evenly spaced sample
// of every batch, so a density prefix keeps each stratum's share. Deterministic, in place.
export function shuffleBatches(ids, start, count, batch = 128, seed = 1) {
  if (count <= 1) return ids;
  const nb = Math.ceil(count / batch);
  let state = hashU32((Math.imul(seed, 0x9E3779B1) ^ start) >>> 0) || 1;
  const rnd = () => (state = hashU32((state + 0x9E3779B9) >>> 0));
  const order = Int32Array.from({ length: nb }, (_, q) => q);
  for (let q = nb - 1; q > 0; q--) { const w = rnd() % (q + 1); const t = order[q]; order[q] = order[w]; order[w] = t; }
  const pow = batch <= 128 && 128 % batch === 0 ? 128 : 1 << Math.ceil(Math.log2(batch));
  const bits = Math.log2(pow);
  const rev = (t) => (bits === 7 ? bitrev7(t) : [...Array(bits).keys()].reduce((r, q) => r | (((t >> q) & 1) << (bits - 1 - q)), 0));
  const masks = Int32Array.from({ length: nb }, () => rnd() & (pow - 1));
  const src = ids.slice(start, start + count);
  let w = start;
  for (let t = 0; t < pow; t++) {
    const rt = rev(t);
    for (let q = 0; q < nb; q++) {
      const bq = order[q];
      const pos = rt ^ masks[bq];
      const len = Math.min(batch, count - bq * batch);
      if (pos < len) ids[w++] = src[bq * batch + pos];
    }
  }
  return ids;
}

// ---------- kernel (JS port of the vertex shader, spec 3.4) ----------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, k) => a * (1 - k) + b * k;
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const smoothstep = (e0, e1, v) => { const t = clamp01((v - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// Where a grain lands in the puck: a rising conical spiral (x, z world units; y tokens around puckY).
export function spiralOffset(h, puckY, params = KERNEL) {
  const a = 2 * Math.PI * params.spiralTurns * h;
  const r = params.puckRadius * (0.25 + 0.75 * h);
  return [r * Math.cos(a), (h - 0.5) * puckY, r * Math.sin(a)];
}

function reqTexel(req, i, t) {
  const o = (i * REQ_TEXELS + t) * 4;
  return req.data.subarray(o, o + 4);
}

// tables = { requests, blocks } from buildTables (or the two builders). b = block table row,
// s = slot within the row (id & 4095). Reads the Float32 tables exactly as the shader does.
export function grainPosition(tables, b, s, uT, params = KERNEL) {
  const P = { ...KERNEL, ...params };
  const req = tables.requests, bt = tables.blocks.data;
  const n = req.count;
  const o = b * BLOCK_TEXELS * 4;
  const k = bt[o], prefix = bt[o + 1], step = bt[o + 2], seenBy = bt[o + 3];
  const lastReq = bt[o + 4], flags = bt[o + 5], epoch = bt[o + 6], slotBase = bt[o + 7];
  const i = Math.floor(uT), f = uT - i;
  const i0 = Math.min(Math.max(i, 0), n - 1), i1 = Math.min(i0 + 1, n - 1);
  const A0 = reqTexel(req, i0, 0), A1 = reqTexel(req, i1, 0);
  const lerp = (t, c) => mix(reqTexel(req, i0, t)[c], reqTexel(req, i1, t)[c], f);
  const baseK = k < 4 ? lerp(1, k) : lerp(2, k - 4);
  const scaleK = k < 4 ? lerp(3, k) : lerp(4, k - 4);
  const ctx = mix(A0[1], A1[1], f), halfW = A0[3]; // x and depth: request i0's own tread, not interpolated
  const zF = reqTexel(req, i0, 4)[3];
  const sum = reqTexel(req, i0, 2)[3];

  const visible = seenBy <= i && i <= lastReq;
  const u = hashGrainU32(b, s);
  const h = u32ToUnit(u), hx = hashDerived(u, HASH_SALT.x), hz = hashDerived(u, HASH_SALT.z);
  const rest = [
    req.centre[i0] + (2 * hx - 1) * halfW,
    baseK + (prefix + (slotBase + s + 0.5) * step) * scaleK,
    zF - hz * req.depth[i0],
  ];
  const continued = (flags & FLAGS.continued) !== 0;
  const tIn = continued ? seenBy : seenBy + h * P.pourWindow;
  const kIn = continued ? 1 : easeOutCubic(clamp01((uT - tIn) / P.fallDur));
  const drop = P.dropHeightTokens * ctx;
  let p = [rest[0], mix(rest[1] + drop, rest[1], kIn), rest[2]];
  let kC = 0;
  if (epoch >= 0) {
    kC = smoothstep(lastReq + 1 - P.collapseDur, lastReq + 1, uT);
    const e = tables.requests.epochData;
    const puck = [e[epoch * 4], e[epoch * 4 + 1], e[epoch * 4 + 2]];
    const off = spiralOffset(h, puck[1], P);
    p = [mix(p[0], puck[0] + off[0], kC), mix(p[1], puck[1] + off[1], kC), mix(p[2], puck[2] + off[2], kC)];
  }
  const hidden = uT < tIn || kC >= 1 || !visible || !(sum > 0);
  return { x: p[0], y: p[1], z: p[2], hidden, kIn, kC, rest };
}

// Every block part in context at request i with its band [y0, y1] in tokens on request i's base and
// scale (no interpolation). Rows split for slots appear once.
export function bandsForRequest(tables, i) {
  const m = tables.blocks.meta, R = tables.requests;
  if (i < 0 || i >= R.count || !(R.sum[i] > 0)) return [];
  const out = [];
  for (let row = 0; row < tables.blocks.count; row++) {
    if (m.slotBase[row] !== 0 || m.seenBy[row] > i || m.lastReq[row] < i) continue;
    const k = m.stratum[row];
    const base = R.base[i * NK + k], sc = R.scale[i * NK + k];
    const y0 = base + m.prefixEst[row] * sc;
    out.push({ b: row, blockIndex: m.blockIndex[row], stratum: k, y0, y1: y0 + m.est[row] * sc, flags: m.flags[row] });
  }
  return out;
}

// Everything for one agent: request table, block table (N0 chosen from its parts), grains.
export function buildTables(agent, geom, opts = {}) {
  const requests = buildRequestTable(agent, geom);
  const blocks = buildBlockTable(agent, opts);
  const grains = buildGrains(blocks.meta, blocks.N0, opts);
  return { requests, blocks, grains, N0: blocks.N0 };
}
