// Grains are the strata, made countable. For every request of every agent the grain tables must
// reproduce what the strata invariant (strata-invariant.test.mjs) already pins: the parts in context
// on the request's scale sum to each stratum, and each part sits exactly where stratumRows lists it.
// The kernel is a pure function of static tables and uT, so scrubbing in either direction is exact.
// Runs over the synthetic fixtures and the synthetic dev session, plus any real sessions named in
// TRACE_REAL_SESSIONS (sets separated by ";", paths by ":"), which stay on the machine that runs it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { stratumRows, windowBlocks } from "../model.js";
import { STRATA } from "../panels.js";
import { syntheticTrace } from "../dev-synthetic.js";
import {
  STRATA_KEYS, KERNEL, GRAIN_DEPTH, REQ_TEXELS, BLOCK_TEXELS, TABLE_WIDTH, MAX_SLOTS, FLAGS, HASH_NAME,
  chooseGrainSize, buildRequestTable, buildBlockTable, buildTables, buildGrains, shuffleBatches,
  hashGrain, hashGrainU32, hashU32, hashDerived, HASH_SALT, spiralOffset, grainPosition, bandsForRequest,
} from "../grain-rules.js";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));

// Task 1's geometry is injected; a stub keeps these rules independent of the scene.
const stubGeom = { x: (a, i) => i * 0.13, tread: (a, i) => [i * 0.13 - 0.06, i * 0.13 + 0.06], z: () => 0, lane: () => -1 };

// A tiny agent whose strata are exactly its parts in context (scale 1), for hand-made cases.
function mkAgent(blocks, requests, { harnessSource = "logged", harnessEst } = {}) {
  const agent = { id: "t", kind: "root", blocks: blocks.map((b, i) => ({ i, t: i, label: `b${i}`, ref: { file: 0, offset: i, length: 1 }, ...b })), requests: [], compactions: [], harnessSource, harnessEst };
  requests.forEach((q, j) => {
    const r = { i: j, t: 1000 * j, window: q.window, extra: q.extra, tokens: {}, strata: {}, scale: {} };
    for (const k of STRATA_KEYS) r.strata[k] = 0;
    for (const b of windowBlocks(agent, r)) {
      r.strata[b.kind] += b.est - (b.harnessEst || 0);
      r.strata.harness += b.harnessEst || 0;
    }
    if (harnessSource !== "logged") r.strata.harness += harnessEst || 0;
    for (const k of STRATA_KEYS) r.scale[k] = 1;
    r.tokens.context = STRATA_KEYS.reduce((s, k) => s + r.strata[k], 0);
    agent.requests.push(r);
  });
  return agent;
}

async function fixtureTraces() {
  const out = [];
  for (const sub of ["codex", "claude"]) out.push([sub, (await loadTrace(await entriesFor([FIX + sub]))).trace]);
  return out;
}

// Parts in context at request j, straight from the model (no grain-rules code).
function strataOf(r) {
  return STRATA_KEYS.map((k) => (r.strata && r.strata[k]) || 0);
}

// Invariants 1, 2 and 6 for one agent. Returns the number of (request, part) pairs checked.
function checkAgent(agent, tables, where) {
  const { requests: R, blocks: B } = tables;
  const m = B.meta;
  const logged = !!agent.requests.some((r) => r.scale);
  let checked = 0;
  // Unique parts: the table rows that start a part (slot-split rows repeat it).
  const byReq = new Map();
  for (let row = 0; row < B.count; row++) {
    if (m.slotBase[row] !== 0) continue;
    for (let j = m.seenBy[row]; j <= m.lastReq[row]; j++) (byReq.get(j) || byReq.set(j, []).get(j)).push(row);
  }
  // Membership: every part in context appears in exactly one row covering that request.
  for (const r of agent.requests) {
    const rows = byReq.get(r.i) || [];
    const seen = new Set();
    for (const row of rows) {
      const key = `${m.blockIndex[row]}:${m.stratum[row]}`;
      assert.ok(!seen.has(key), `${where} request ${r.i}: part ${key} listed twice`);
      seen.add(key);
    }
    if (!r.window) { assert.equal(rows.length, 0, `${where} request ${r.i}: no window, no parts`); continue; }
    const want = new Set();
    for (const b of windowBlocks(agent, r)) for (let k = 0; k < 7; k++) {
      const e = b.est ?? Math.ceil((b.chars || 0) / 4), h = b.harnessEst || 0;
      const p = STRATA_KEYS[k] === b.kind ? e - h : STRATA_KEYS[k] === "harness" ? h : 0;
      if (p > 0) want.add(`${b.i}:${k}`);
    }
    for (const key of want) assert.ok(seen.has(key), `${where} request ${r.i}: part ${key} in context but not in the block table`);
  }
  for (const r of agent.requests) {
    if (!r.window) continue;
    const st = strataOf(r);
    const sum = st.reduce((s, v) => s + v, 0);
    if (!sum) continue;
    const rows = byReq.get(r.i) || [];
    const bands = bandsForRequest(tables, r.i);
    for (let k = 0; k < 7; k++) {
      const key = STRATA_KEYS[k];
      const ks = rows.filter((row) => m.stratum[row] === k).sort((a, b) => m.prefixEst[a] - m.prefixEst[b]);
      const scale = R.scale[r.i * 7 + k];
      // 1a. Parts in context on the request's scale sum to the stratum; grains carry exactly the same
      //     tokens (nSlots × step = est), so the grain sum is within N0 by a wide margin.
      const tok = ks.reduce((s, row) => s + m.est[row] * scale, 0);
      const grainTok = ks.reduce((s, row) => s + Math.ceil(m.est[row] / tables.N0) * m.step[row] * scale, 0);
      if (ks.length) {
        assert.ok(Math.abs(tok - st[k]) <= Math.max(tables.N0 * scale, 0.5) + 1e-6 * st[k], `${where} request ${r.i} ${key}: parts ${tok} vs stratum ${st[k]}`);
        assert.ok(Math.abs(grainTok - tok) <= 1e-6 * Math.max(1, tok), `${where} request ${r.i} ${key}: grains ${grainTok} vs parts ${tok}`);
      }
      // 1b. prefixEst × scale is the cumulative tok of the rows stratumRows lists before the block
      //     (the unlogged harness, which has no block, is listed first).
      if (logged && ks.length) {
        const { rows: list, unlogged } = stratumRows(agent, r, key);
        let acc = key === "harness" ? unlogged : 0;
        const at = new Map();
        for (const x of list) { at.set(x.b.i, acc); acc += x.tok; }
        for (const row of ks) {
          const bi = m.blockIndex[row];
          const want = bi < 0 ? 0 : at.get(bi);
          assert.ok(want !== undefined, `${where} request ${r.i} ${key}: block ${bi} not listed by stratumRows`);
          const got = m.prefixEst[row] * scale;
          assert.ok(Math.abs(got - want) <= 1e-6 * Math.max(1, want), `${where} request ${r.i} ${key} block ${bi}: prefix ${got} vs rows before ${want}`);
          checked++;
        }
      }
      // 6. Bands tile the stratum: start at its base, no gaps or overlaps, end at the next base.
      const kb = bands.filter((x) => x.stratum === k).sort((a, b) => a.y0 - b.y0);
      const base = R.base[r.i * 7 + k], top = k < 6 ? R.base[r.i * 7 + k + 1] : R.base[r.i * 7 + 6] + st[6] * (R.context[r.i] / sum);
      if (!kb.length) { assert.ok(Math.abs(top - base) <= 0.5 + 1e-6 * top, `${where} request ${r.i} ${key}: empty stratum has height ${top - base}`); continue; }
      assert.ok(Math.abs(kb[0].y0 - base) <= 1e-6 * Math.max(1, base), `${where} request ${r.i} ${key}: first band at ${kb[0].y0}, base ${base}`);
      for (let q = 1; q < kb.length; q++)
        assert.ok(Math.abs(kb[q].y0 - kb[q - 1].y1) <= 1e-6 * Math.max(1, kb[q].y0), `${where} request ${r.i} ${key}: gap or overlap ${kb[q].y0 - kb[q - 1].y1}`);
      const end = kb[kb.length - 1].y1;
      assert.ok(Math.abs(end - top) <= Math.max(tables.N0 * scale, 0.5) + 1e-6 * top, `${where} request ${r.i} ${key}: bands end at ${end}, stratum top ${top}`);
    }
  }
  // 2. Each row is one contiguous interval with a constant prefix (asserted by construction above:
  //    a part listed at a request by two rows fails "listed twice"; here the interval bounds are sane).
  for (let row = 0; row < B.count; row++) assert.ok(m.seenBy[row] <= m.lastReq[row], `${where} row ${row}: interval`);
  return checked;
}

function grainsCheck(tables, where) {
  const g = buildGrains(tables.blocks.meta, tables.N0);
  const m = tables.blocks.meta;
  let want = 0;
  for (let row = 0; row < tables.blocks.count; row++) if (m.slotBase[row] === 0) want += Math.ceil(m.est[row] / tables.N0);
  assert.equal(g.count, want, `${where}: grain count is sum(ceil(est / N0))`);
  assert.equal(g.ids.length, want);
  // Chunks cover the ids in order and never split a block row.
  let at = 0;
  const done = new Set();
  for (const c of g.chunks) {
    assert.equal(c.start, at, `${where}: chunks are consecutive`);
    const have = new Map();
    for (let q = c.start; q < c.start + c.count; q++) { const row = g.ids[q] >>> 12; have.set(row, (have.get(row) || 0) + 1); }
    for (const [row, n] of have) {
      assert.ok(row >= c.blockLo && row < c.blockHi, `${where}: row ${row} outside chunk rows [${c.blockLo}, ${c.blockHi})`);
      assert.ok(!done.has(row), `${where}: row ${row} in two chunks`);
      assert.equal(n, m.nSlots[row], `${where}: row ${row} split across chunks`);
      done.add(row);
    }
    at += c.count;
  }
  assert.equal(at, g.count);
  return g;
}

test("grain rules: constants and grain size", () => {
  assert.deepEqual(STRATA_KEYS, STRATA.map((s) => s.key));
  assert.equal(REQ_TEXELS, 5);
  assert.equal(BLOCK_TEXELS, 2);
  assert.equal(TABLE_WIDTH, 2048);
  assert.equal(MAX_SLOTS, 4096);
  for (const [k, v] of Object.entries({ pourWindow: 0.35, fallDur: 0.25, dropHeightTokens: 0.12, collapseDur: 0.3, jitterX: 0.35, jitterZ: 0.6 })) assert.equal(KERNEL[k], v, k);
  assert.ok(Math.abs(KERNEL.pourWindow + KERNEL.fallDur - 0.6) < 1e-12, "a request's blocks are all settled by i + 0.6");
  assert.ok(1 - KERNEL.collapseDur > 0.65, "i + 0.65 (a focused request) is before any collapse starts");
  assert.equal(chooseGrainSize(1_000_000, 400_000), 10);
  assert.equal(chooseGrainSize(50_000_000, 400_000), 200);
  assert.equal(chooseGrainSize(0), 10);
  assert.equal(chooseGrainSize(4_000_001, 400_000), 20);
  assert.equal(chooseGrainSize(1e12, 400_000), 1000, "the coarsest size when nothing fits");
});

// The GLSL port (Task 4) must reproduce these bit for bit: lowbias32 on (b * 0x9E3779B1) ^ s, and the
// float is the top 24 bits over 2^24 (exact in float32, always < 1).
test("grain rules: hash is lowbias32 and matches the reference table", () => {
  assert.equal(HASH_NAME, "lowbias32");
  const table = [
    [0, 0, 0x00000000, 0],
    [0, 1, 0x688990c0, 0.40834903717041016],
    [1, 0, 0x6d523710, 0.42703574895858765],
    [7, 3, 0x30f08a43, 0.191170334815979],
    [1000, 4095, 0x6e607af3, 0.4311596155166626],
    [28447, 12, 0xec9dbbb2, 0.9242817759513855],
    [123456, 77, 0xadaef634, 0.6784509420394897],
    [4194303, 4095, 0xf3abf51a, 0.9518426060676575],
  ];
  for (const [b, s, u, f] of table) {
    assert.equal(hashGrainU32(b, s), u, `u32 (${b}, ${s})`);
    assert.equal(hashGrain(b, s), f, `float (${b}, ${s})`);
  }
  assert.equal(hashU32(0), 0);
  for (let b = 0; b < 40; b++) for (let s = 0; s < 25; s++) {
    const h = hashGrain(b, s);
    assert.ok(h >= 0 && h < 1 && Math.fround(h) === h, `(${b}, ${s}) in [0,1) and exact in float32`);
  }
});

test("grain rules: fixtures and synthetic reproduce the strata", async () => {
  const sets = await fixtureTraces();
  const syn = syntheticTrace().trace;
  sets.push(["synthetic", { agents: [syn.agents[0], ...syn.agents.filter((a) => a.kind === "subagent").slice(0, 3)] }]);
  for (const [name, trace] of sets) {
    let parts = 0;
    for (const a of trace.agents) {
      const tables = buildTables(a, stubGeom);
      parts += checkAgent(a, tables, `${name} ${a.id}`);
      grainsCheck(tables, `${name} ${a.id}`);
    }
    if (name !== "synthetic") assert.ok(parts > 20, `${name}: ${parts} parts checked`);
  }
});

test("grain rules: request table layout", async () => {
  const [[, trace]] = await fixtureTraces();
  const a = trace.agents.find((x) => x.kind === "root");
  const R = buildRequestTable(a, stubGeom);
  assert.equal(R.texels, 5);
  assert.equal(R.width, 2048);
  assert.equal(R.count, a.requests.length);
  assert.equal(R.data.length, R.width * R.height * 4);
  assert.ok(R.width * R.height >= R.count * 5);
  for (const r of a.requests) {
    const t = (q) => R.data.subarray((r.i * 5 + q) * 4, (r.i * 5 + q) * 4 + 4);
    const st = strataOf(r), sum = st.reduce((s, v) => s + v, 0), f = r.tokens.context / sum;
    assert.equal(t(0)[0], Math.fround(stubGeom.x(a, r.i)));
    assert.equal(t(0)[1], r.tokens.context);
    assert.equal(t(0)[2], R.epochOf[r.i]);
    assert.equal(t(0)[3], Math.fround(0.06));
    const base = [...t(1), ...t(2).subarray(0, 3)];
    let acc = 0;
    for (let k = 0; k < 7; k++) { assert.ok(Math.abs(base[k] - acc * f) <= 1e-3, `base ${k}`); acc += st[k]; }
    assert.equal(t(2)[3], sum);
    const scale = [...t(3), ...t(4).subarray(0, 3)];
    for (let k = 0; k < 7; k++) assert.equal(scale[k], Math.fround(r.scale[STRATA_KEYS[k]] * f));
    assert.equal(t(4)[3], 0);
  }
  // Epochs: one per compaction on this fixture, pucks at half the post-compaction context.
  assert.equal(R.epochs.length, a.compactions.length + 1);
  const e1 = R.epochs[1];
  assert.equal(e1.start, a.requests.findIndex((r, j) => j && r.window[0] > a.requests[j - 1].window[0]));
  assert.deepEqual(e1.puck, [stubGeom.x(a, e1.start), 0.5 * a.compactions[0].post, 0]);
  assert.deepEqual([...R.epochData.subarray(4, 8)], [e1.puck[0], e1.puck[1], e1.puck[2], e1.start].map(Math.fround));
  assert.equal(R.epochs[0].start, 0);
  assert.equal(R.epochs[0].end, e1.start - 1);
});

// Extra blocks can join the context before the window reaches them (a Claude Code tools snapshot),
// leave and come back, or see blocks slide in ahead of them. Each is a new row: a gap re-pours; a
// prefix change continues in place (FLAGS.continued) without collapsing or re-pouring.
test("grain rules: split rows for gaps and prefix changes", () => {
  const H = "harness", Y = "you";
  const a = mkAgent(
    [{ kind: H, est: 100 }, { kind: Y, est: 30 }, { kind: H, est: 40 }, { kind: H, est: 50 }, { kind: Y, est: 20 }, { kind: Y, est: 10 }],
    [
      { window: [0, 1], extra: [3] },   // 3 in context early (ahead of 2)
      { window: [0, 3] },               // 2 slides in ahead of 3: 3's prefix changes -> continued row
      { window: [0, 4] },
      { window: [0, 1], extra: [5] },   // 2, 3, 4 leave without a compaction
      { window: [0, 5] },               // 2, 3, 4 come back: a gap -> new rows that re-pour; 5's prefix grows
    ]);
  const T = buildTables(a, stubGeom);
  const m = T.blocks.meta;
  const rowsOf = (bi) => [...Array(T.blocks.count).keys()].filter((row) => m.blockIndex[row] === bi).map((row) => [m.seenBy[row], m.lastReq[row], m.prefixEst[row], m.flags[row] & FLAGS.continued ? "cont" : "new", m.epoch[row]]);
  assert.deepEqual(rowsOf(3), [[0, 0, 100, "new", -1], [1, 2, 140, "cont", -1], [4, 4, 140, "new", -1]]);
  assert.deepEqual(rowsOf(2), [[1, 2, 100, "new", -1], [4, 4, 100, "new", -1]]);
  assert.deepEqual(rowsOf(0), [[0, 4, 0, "new", -1]]);
  assert.deepEqual(rowsOf(5), [[3, 3, 30, "new", -1], [4, 4, 50, "cont", -1]]);
  assert.equal(T.blocks.splits.prefix, 2);
  assert.equal(T.blocks.splits.gap, 3);
  assert.equal(T.requests.epochs.length, 1, "no window start moved: one epoch");
  checkAgent(a, T, "split");
  // A continued row arrives settled and the row it continues vanishes without collapsing.
  const cont = [...Array(T.blocks.count).keys()].find((row) => m.blockIndex[row] === 3 && m.seenBy[row] === 1);
  const prev = [...Array(T.blocks.count).keys()].find((row) => m.blockIndex[row] === 3 && m.seenBy[row] === 0);
  const P = { yScale: 1, ...KERNEL };
  const c = grainPosition(T, cont, 0, 1.0, P);
  assert.equal(c.hidden, false);
  assert.equal(c.kIn, 1);
  const p = grainPosition(T, prev, 0, 0.99, P);
  assert.equal(p.kC, 0);
  assert.equal(p.hidden, false);
  assert.equal(grainPosition(T, prev, 0, 1.0, P).hidden, true);
  // The unlogged harness is a virtual row listed first in Harness.
  const u = mkAgent([{ kind: H, est: 10 }, { kind: Y, est: 5, harnessEst: 2 }], [{ window: [0, 1] }, { window: [0, 1] }], { harnessSource: "residual", harnessEst: 300 });
  const TU = buildTables(u, stubGeom);
  const um = TU.blocks.meta;
  const list = [...Array(TU.blocks.count).keys()].map((row) => [um.blockIndex[row], STRATA_KEYS[um.stratum[row]], um.prefixEst[row], um.est[row], um.flags[row] & FLAGS.unlogged ? "U" : ""]);
  assert.deepEqual(list, [[-1, H, 0, 300, "U"], [0, H, 300, 10, ""], [1, H, 310, 2, ""], [1, Y, 0, 3, ""]]);
  checkAgent(u, TU, "unlogged");
});

// Blocks larger than 4096 slots use consecutive rows that differ only in slotBase.
test("grain rules: large blocks split across slot rows", () => {
  const a = mkAgent([{ kind: "outside", est: 100_000 }, { kind: "model", est: 7 }], [{ window: [0, 1] }]);
  const T = buildTables(a, stubGeom, { N0: 10 });
  const m = T.blocks.meta;
  assert.equal(T.blocks.count, 4); // 10,000 slots -> 4096 + 4096 + 1808, then the model block
  assert.deepEqual([...m.slotBase], [0, 4096, 8192, 0]);
  assert.deepEqual([...m.nSlots], [4096, 4096, 1808, 1]);
  for (const row of [1, 2]) for (const f of ["stratum", "prefixEst", "step", "seenBy", "lastReq", "flags", "epoch", "blockIndex", "est"]) assert.equal(m[f][row], m[f][0], f);
  const B = T.blocks.data;
  assert.equal(B[(1 * 2 + 1) * 4 + 3], 4096, "slotBase in texel 1 .w");
  const g = buildGrains(m, 10);
  assert.equal(g.count, 10_001);
  const ids = new Set(g.ids);
  assert.ok(ids.has((2 * 4096 + 1807) >>> 0) && !ids.has((2 * 4096 + 1808) >>> 0));
  // The top grain of the block sits half a step under its top edge.
  const P = { yScale: 1, ...KERNEL, jitterX: 0, jitterZ: 0 };
  const top = grainPosition(T, 2, 1807, 0.99, P);
  assert.ok(Math.abs(top.rest[1] - (100_000 - 5)) < 1e-6, `top grain ${top.rest[1]}`);
  assert.throws(() => buildGrains(m, 20), /N0/);
});

test("grain rules: shuffle is a deterministic permutation and a uniform subsample", () => {
  const ids = Uint32Array.from({ length: 5000 }, (_, i) => i * 3);
  const a = ids.slice(), b = ids.slice();
  shuffleBatches(a, 100, 4000);
  shuffleBatches(b, 100, 4000);
  assert.deepEqual(a, b, "deterministic");
  assert.deepEqual(a.subarray(0, 100), ids.subarray(0, 100), "outside the range untouched");
  assert.deepEqual(a.subarray(4100), ids.subarray(4100));
  assert.deepEqual([...a.subarray(100, 4100)].sort((x, y) => x - y), [...ids.subarray(100, 4100)], "a permutation");
  assert.notDeepEqual(a, ids);
  const c = ids.slice();
  shuffleBatches(c, 100, 4000, 128, 2);
  assert.notDeepEqual(c, a, "the seed matters");
});

// The first quarter of every chunk carries each stratum's share of the chunk within 3 points,
// so instanceCount = ceil(n * density) thins the pile evenly.
test("grain rules: density prefixes keep the strata shares", async () => {
  const syn = syntheticTrace().trace;
  // Chunks under 400 grains (the Claude fixture's 126) are too small for a 3-point test: a quarter
  // of them is a few dozen grains.
  const sets = [...(await fixtureTraces()).flatMap(([n, t]) => t.agents.map((a) => [`${n} ${a.kind}`, a])), ["synthetic", syn.agents[0]]];
  let total = 0;
  for (const [name, a] of sets) {
    const T = buildTables(a, stubGeom);
    const g = grainsCheck(T, name);
    const m = T.blocks.meta;
    let tested = 0;
    for (const c of g.chunks) {
      if (c.count < 400) continue;
      const share = (lo, hi) => {
        const n = new Array(7).fill(0);
        for (let q = lo; q < hi; q++) n[m.stratum[g.ids[q] >>> 12]]++;
        return n.map((v) => v / (hi - lo));
      };
      const all = share(c.start, c.start + c.count), head = share(c.start, c.start + Math.ceil(c.count / 4));
      for (let k = 0; k < 7; k++) assert.ok(Math.abs(all[k] - head[k]) <= 0.03, `${name} chunk ${c.start} ${STRATA_KEYS[k]}: ${head[k]} vs ${all[k]}`);
      tested++;
    }
    if (name === "synthetic" || name === "codex root") assert.ok(tested > 0, `${name}: a chunk large enough to test`);
    total += tested;
  }
  assert.ok(total >= 4, `${total} chunks tested`);
});

// A block seen at request 10 and last in context at 20, with a compaction at 21.
test("grain rules: kernel pour, purity and collapse", () => {
  const blocks = [{ kind: "harness", est: 500 }];
  for (let i = 1; i <= 30; i++) blocks.push({ kind: i % 3 ? "outside" : "model", est: 40 + 7 * i });
  const reqs = [];
  for (let j = 0; j < 25; j++) {
    const end = Math.min(blocks.length - 1, 2 + j);
    reqs.push({ window: j < 21 ? [0, end] : [22, end] });
  }
  const a = mkAgent(blocks, reqs);
  a.compactions.push({ t: 20500, pre: 999, post: 1234, block: 22 });
  const T = buildTables(a, stubGeom);
  const m = T.blocks.meta;
  const row = [...Array(T.blocks.count).keys()].find((r) => m.blockIndex[r] === 12);
  assert.equal(m.seenBy[row], 10);
  assert.equal(m.lastReq[row], 20);
  assert.equal(T.requests.epochs.length, 2);
  assert.equal(m.epoch[row], 1, "collapses into the puck of the epoch starting at 21");
  const P = { yScale: 1, ...KERNEL };
  const s = 5;
  assert.equal(grainPosition(T, row, s, 9.99, P).hidden, true);
  assert.equal(grainPosition(T, row, s, 11, P).hidden, false);
  assert.equal(grainPosition(T, row, s, 10 + KERNEL.pourWindow + KERNEL.fallDur + 0.01, P).kIn, 1);
  // During the fall kIn rises and the drop above rest shrinks to nothing.
  const h = hashGrain(row, s), tIn = 10 + h * KERNEL.pourWindow;
  let lastK = -1, lastDrop = Infinity;
  for (let q = 0; q <= 50; q++) {
    const g = grainPosition(T, row, s, tIn + (q / 50) * KERNEL.fallDur, P);
    const drop = g.y - g.rest[1];
    assert.ok(g.kIn >= lastK, "kIn non-decreasing");
    assert.ok(drop <= lastDrop + 1e-9 && drop >= -1e-9, "drop non-increasing");
    lastK = g.kIn; lastDrop = drop;
  }
  assert.ok(Math.abs(lastDrop) < 1e-9);
  // Pure: evaluating another time first changes nothing.
  const at15 = grainPosition(T, row, s, 15, P);
  grainPosition(T, row, s, 18, P);
  assert.deepEqual(grainPosition(T, row, s, 15, P), at15);
  // Collapse: kC reaches 1 at lastReq + 1, landing on the puck plus the spiral offset.
  const c = grainPosition(T, row, s, 21, P);
  assert.equal(c.kC, 1);
  assert.equal(c.hidden, true);
  const puck = T.requests.epochs[1].puck;
  assert.deepEqual(puck, [21 * 0.13, 0.5 * 1234, 0]);
  const off = spiralOffset(h, puck[1], P);
  // The kernel reads the float32 puck table, as the shader does.
  const near = (u, v) => Math.abs(u - v) <= 1e-6 * Math.max(1, Math.abs(v));
  assert.ok(near(c.x, puck[0] + off[0]) && near(c.y, puck[1] + off[1]) && near(c.z, puck[2] + off[2]), JSON.stringify([c, puck, off]));
  assert.equal(grainPosition(T, row, s, 20.1, P).kC, 0);
  assert.equal(grainPosition(T, row, s, 20.65, P).kC, 0, "nothing collapses at lastReq + 0.65");
  assert.equal(grainPosition(T, row, s, 20.7, P).kC, 0, "the collapse starts at lastReq + 0.7");
  const mid = grainPosition(T, row, s, 20.85, P);
  assert.ok(mid.kC > 0 && mid.kC < 1 && !mid.hidden);
  // every grain of the request pours in within [i, i + 0.6]: at seenBy + 0.6 + epsilon all have landed
  for (let q = 0; q < Math.min(m.nSlots[row], 60); q++) {
    const g = grainPosition(T, row, q, 10.6 + 1e-9, P);
    assert.equal(g.kIn, 1, `slot ${q} settled by i + 0.6`);
    assert.equal(g.y, g.rest[1]);
    assert.equal(grainPosition(T, row, q, 10.65, P).kC, 0);
    // heights are request 10's through the request (no easing toward 11): the column that becomes the
    // settled trail column at P = 11 is the same one
    assert.equal(grainPosition(T, row, q, 10.95, P).rest[1], grainPosition(T, row, q, 10.61, P).rest[1]);
  }
  // A block still in context at the end never collapses.
  const endRow = [...Array(T.blocks.count).keys()].find((r) => m.blockIndex[r] === 26);
  assert.equal(m.epoch[endRow], -1);
  assert.equal(grainPosition(T, endRow, 0, 24, P).kC, 0);
  // Rest position sits in its stratum band and inside the request's tread.
  const band = bandsForRequest(T, 15).find((x) => x.b === row);
  const g15 = grainPosition(T, row, s, 15, P);
  assert.ok(g15.y > band.y0 && g15.y < band.y1, "y inside the block's band");
  assert.ok(Math.abs(g15.x - 15 * 0.13) <= 0.06 + 1e-9, "x inside the tread");
  assert.ok(g15.z <= 0 && g15.z >= -GRAIN_DEPTH, "z within the grain depth behind the face");
});

test("grain rules: side agents and empty agents build empty tables", async () => {
  const [, [, trace]] = await fixtureTraces();
  const side = trace.agents.find((a) => a.kind === "side");
  const T = buildTables(side, stubGeom);
  assert.equal(T.blocks.count, 0);
  assert.equal(T.grains.count, 0);
  assert.equal(T.requests.count, side.requests.length);
  assert.deepEqual(bandsForRequest(T, 0), []);
  const none = buildTables({ id: "x", kind: "root", blocks: [], requests: [], compactions: [] }, stubGeom);
  assert.equal(none.requests.count, 0);
  assert.equal(none.grains.count, 0);
});

test("grain rules: real sessions (TRACE_REAL_SESSIONS)", { skip: !process.env.TRACE_REAL_SESSIONS }, async () => {
  for (const set of process.env.TRACE_REAL_SESSIONS.split(";")) {
    const { trace } = await loadTrace(await entriesFor(set.split(":").filter(Boolean)));
    const name = set.split(":")[0].split("/").pop();
    const summary = [];
    for (const a of trace.agents) {
      const t0 = performance.now();
      const T = buildTables(a, stubGeom);
      const ms = performance.now() - t0;
      checkAgent(a, T, `${name} ${a.id}`);
      grainsCheck(T, `${name} ${a.id}`);
      summary.push({ id: a.id, kind: a.kind, requests: a.requests.length, rows: T.blocks.count, N0: T.N0, grains: T.grains.count, chunks: T.grains.chunks.length, epochs: T.requests.epochs.length, splits: T.blocks.splits, ms: Math.round(ms) });
    }
    const root = summary.find((s) => s.kind === "root");
    const big = summary.filter((s) => s.kind === "subagent").sort((x, y) => y.grains - x.grains)[0];
    console.log(`# ${name}\n# root ${JSON.stringify(root)}\n# largest subagent ${JSON.stringify(big || null)}`);
    assert.ok(root.grains > 0 && root.grains <= 400_000 + root.rows);
  }
});

// The JS kernel and the vertex shader place a grain the same way: across its request's whole tread and
// up to the grain depth behind the face (grains.js GRAIN_VERT), with the request's own tread for the
// leading column too. Over every grain of a fixture root, at trail and mid-request playheads.
test("grain rules: the JS kernel places grains across the tread and depth, as the shader does", async () => {
  const { GRAIN_VERT } = await import("../grains.js");
  // the shader's expressions, which the JS below mirrors
  assert.match(GRAIN_VERT, /vec3 rest = vec3\(A0\.x \+ \(2\.0 \* hx - 1\.0\) \* halfW,/);
  assert.match(GRAIN_VERT, /zF - hz \* A0\.z\);/);
  assert.match(GRAIN_VERT, /float ctx = A0\.y, halfW = A0\.w;/);
  assert.match(GRAIN_VERT, /float baseK = reqTexel\(i0, bt\)\[c\];/);
  const [[, trace]] = await fixtureTraces();
  const agent = trace.agents.find((a) => a.kind === "root");
  // off-centre treads (the request's x is not the tread's middle) and a ridge shallower than the grain depth
  const geom = { x: (a, i) => i * 0.13, tread: (a, i) => [i * 0.13 - 0.04, i * 0.13 + 0.09], z: (a, i) => 2 + i * 1e-3, lane: () => -1,
    depth: (a, h) => (h > 50 ? 7 : 0.9), yScale: 1e-3 };
  const T = buildTables(agent, geom);
  const R = T.requests, n = R.count, m = T.blocks.meta;
  for (let i = 0; i < n; i++) {
    assert.ok(Math.abs(R.centre[i] - (i * 0.13 + 0.025)) < 1e-12);
    assert.equal(R.depth[i], R.context[i] * 1e-3 > 50 ? GRAIN_DEPTH : 0.9);
  }
  let checked = 0;
  for (let row = 0; row < T.blocks.count; row++) {
    for (let s = 0; s < Math.min(m.nSlots[row], 40); s++) {
      for (const uT of [m.seenBy[row] + 0.95, m.lastReq[row], m.seenBy[row] + 0.4]) {
        const g = grainPosition(T, row, s, uT, { yScale: 1 });
        const i0 = Math.min(Math.max(Math.floor(uT), 0), n - 1), o = i0 * REQ_TEXELS * 4;
        const u = hashGrainU32(row, s);
        const hx = hashDerived(u, HASH_SALT.x), hz = hashDerived(u, HASH_SALT.z);
        const halfW = R.data[o + 3], zF = R.data[o + 19];
        assert.equal(g.rest[0], R.centre[i0] + (2 * hx - 1) * halfW, "x: the tread centre +- half its width");
        assert.equal(g.rest[2], zF - hz * R.depth[i0], "z: up to the depth behind the face");
        assert.ok(g.rest[0] >= R.centre[i0] - halfW - 1e-9 && g.rest[0] <= R.centre[i0] + halfW + 1e-9, "inside the tread");
        assert.ok(g.rest[2] <= zF + 1e-12 && g.rest[2] >= zF - R.depth[i0] - 1e-12, "within [zF - d, zF]");
        checked++;
      }
    }
  }
  assert.ok(checked > 300, `checked ${checked}`);
});
