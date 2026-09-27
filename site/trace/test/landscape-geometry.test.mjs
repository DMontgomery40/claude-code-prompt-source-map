// Placement pinned to the landscape as scene.js drew it before the extraction: the ridge face, crest,
// rows and slopes. The reference below is copied verbatim from createScene's closures, so this test
// pins the old numbers, not the new module. Grains and playback must land exactly on the solid ridge.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { buildLayout } from "../minimap.js";
import { STRATA } from "../panels.js";
import { BASE_H, landscapeRule, tread, treadAt, terrainPlacement } from "../scene-rules.js";
import { syntheticTrace } from "../dev-synthetic.js";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));
const api = await import("../landscape-geometry.js").catch(() => ({}));

// ---------- reference: scene.js createScene closures as of 7f197fa ----------
function reference(trace, L, MASSIF) {
  const H = BASE_H, ROOT_DEPTH = 7;
  const { subDepth: SUB_DEPTH, sideZ: SIDE_Z, laneZ } = terrainPlacement();
  const rule = landscapeRule(L);
  const W = rule.width;
  const massif = rule.compact ? Math.min(MASSIF, 1.4) : MASSIF;
  const yScale = H / (L.yMax * 1.02);
  const rootInfo = L.info.get(L.root.id);
  const rowZ = new Map();
  const rootDepth = h => Math.max(ROOT_DEPTH, h * massif);
  const subDepth = () => SUB_DEPTH;
  const rootBack = rootDepth(Math.max(0, ...L.root.requests.map(r => (r.tokens.context || 0) * yScale)));
  const shoulder = rule.compact ? 3.5 : 2.3;
  const profile = u => 1 - Math.pow(Math.min(1, Math.max(0, u)), shoulder);

  function topsOf(r, scale) {
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
  // buildRidges: the rows each segment is drawn on, and the columns of its face
  const cols = new Map(); // agent id -> [{ seg, x, t }]
  const addSeg = (agent, inf, seg, taper) => {
    const list = cols.get(agent.id) || [];
    const stepped = rule.stepped && agent === L.root;
    if (stepped) {
      const xAt = i => inf.xs[i] * W;
      for (let i = seg.i0; i <= seg.i1; i++) {
        const t = topsOf(agent.requests[i], yScale), [a, b] = tread(xAt, seg.i0, seg.i1, i, taper);
        list.push({ i, x0: a, x1: b, t });
      }
    } else {
      for (let i = seg.i0; i <= seg.i1; i++) list.push({ i, x0: inf.xs[i] * W, x1: inf.xs[i] * W, t: topsOf(agent.requests[i], yScale) });
    }
    cols.set(agent.id, list);
  };
  const segsOf = new Map(); // agent id -> [{ inf, seg, taper }]
  for (const seg of rootInfo.segments) { addSeg(L.root, rootInfo, seg, 0.18); }
  segsOf.set(L.root.id, rootInfo.segments.map(seg => ({ inf: rootInfo, seg, taper: 0.18 })));
  rowZ.set(L.root.id, rootInfo.segments.map(s => ({ seg: s, zFront: 0 })));
  for (const [id, inf] of L.info) {
    if (inf.agent.kind !== "subagent") continue;
    const list = [];
    for (const seg of inf.segments) {
      const z = laneZ(seg.lane);
      addSeg(inf.agent, inf, seg, 0.3);
      list.push({ seg, zFront: z });
    }
    rowZ.set(id, list);
    segsOf.set(id, inf.segments.map(seg => ({ inf, seg, taper: 0.3 })));
  }

  const heightAt = (agent, inf, seg, x, taper) => {
    const xs = inf.xs;
    if (rule.stepped && agent === L.root) {
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
  const crest = (agent, i) => {
    const r = agent.requests[i];
    return (r?.tokens.context || 0) * yScale;
  };
  const zOf = (agent, i) => {
    const list = rowZ.get(agent.id);
    if (!list) return SIDE_Z;
    const hit = list.find(e => i >= e.seg.i0 && i <= e.seg.i1) || list[0];
    return hit.zFront;
  };
  const xOf = (agent, i) => (L.info.get(agent.id)?.xs[i] ?? 0) * W;
  return { W, yScale, massif, rootDepth, subDepth, rootBack, shoulder, profile, topsOf, cols, segsOf, rowZ, heightAt, crest, zOf, xOf, SIDE_Z };
}

// ---------- the sessions: lanes (fixtures, synthetic) and a lone stepped massif ----------
async function fixture(sub) {
  const entries = await entriesFor([FIX + sub]);
  try { return (await loadTrace(entries)).trace; }
  finally { await Promise.all(entries.map(e => e.source.close())); }
}
async function sessions() {
  const out = [];
  for (const sub of ["codex", "claude"]) {
    const trace = await fixture(sub);
    out.push([sub, trace]);
    const root = trace.agents.find(a => a.kind === "root");
    out.push([sub + " root only", { ...trace, agents: [root] }]);
  }
  out.push(["synthetic", syntheticTrace().trace]);
  return out;
}
const SESSIONS = await sessions();

test("landscape geometry: the sessions cover both a lane field and a stepped massif", () => {
  const kinds = SESSIONS.map(([, trace]) => landscapeRule(buildLayout(trace)).stepped);
  assert.ok(kinds.includes(true) && kinds.includes(false));
  assert.ok(SESSIONS.some(([, t]) => buildLayout(t).lanes > 4), "a many-lane field");
});

for (const massif of [2, 0.8]) {
  for (const [name, trace] of SESSIONS) {
    test(`landscape geometry: ${name}, massif ${massif}: placement matches the drawn ridge`, () => {
      assert.equal(typeof api.createGeometry, "function", "landscape-geometry.js exports createGeometry");
      const L = buildLayout(trace);
      const ref = reference(trace, L, massif);
      const g = api.createGeometry({ trace, layout: L, massif });
      assert.equal(g.W, ref.W);
      assert.equal(g.yScale, ref.yScale);
      assert.equal(g.massif, ref.massif);
      assert.equal(g.rootBack, ref.rootBack);
      assert.equal(g.shoulder, ref.shoulder);
      for (const u of [-0.2, 0, 0.1, 0.37, 0.5, 0.99, 1, 1.3]) assert.equal(g.profile(u), ref.profile(u));
      for (const h of [0, 1, 3.4, 5, 12.5, 32]) {
        assert.equal(g.depth(L.root, h), ref.rootDepth(h), `root depth at ${h}`);
        assert.equal(g.rootDepth(h), ref.rootDepth(h));
        assert.equal(g.subDepth(h), ref.subDepth(h));
      }
      assert.deepEqual([...g.rowZ.keys()], [...ref.rowZ.keys()]);
      for (const [id, list] of ref.rowZ) assert.deepEqual(g.rowZ.get(id).map(e => [e.seg, e.zFront]), list.map(e => [e.seg, e.zFront]), id);

      let checked = 0;
      for (const agent of trace.agents) {
        const n = agent.requests.length;
        if (agent.kind === "subagent") assert.equal(g.depth(agent, 9), ref.subDepth(9));
        // every request, and the indices around them that callers probe (a link's parent request, a missing row)
        for (let i = -1; i <= n; i++) {
          assert.equal(g.x(agent, i), ref.xOf(agent, i), `${agent.id} x ${i}`);
          assert.equal(g.z(agent, i), ref.zOf(agent, i), `${agent.id} z ${i}`);
          assert.equal(g.crest(agent, i), ref.crest(agent, i), `${agent.id} crest ${i}`);
        }
        for (let i = 0; i < n; i++) {
          const t = g.tops(agent, i), rt = ref.topsOf(agent.requests[i], ref.yScale);
          assert.ok(t instanceof Float32Array && t.length === 8);
          assert.deepEqual([...t], [...rt], `${agent.id} tops ${i}`);
          assert.deepEqual([...t.aB0], [...rt.slice(0, 4)]);
          assert.deepEqual([...t.aB1], [...rt.slice(4, 8)]);
          // lane: the subagent's lane for the segment holding i, -1 on the main ridge and off-row agents
          const list = ref.rowZ.get(agent.id);
          const hit = list && (list.find(e => i >= e.seg.i0 && i <= e.seg.i1) || list[0]);
          assert.equal(g.lane(agent, i), hit && agent.kind === "subagent" ? hit.seg.lane : -1, `${agent.id} lane ${i}`);
          if (hit && agent.kind === "subagent") assert.equal(g.z(agent, i), terrainPlacement().laneZ(g.lane(agent, i)));
          checked++;
        }
        // the face columns: a stepped massif's tread per request, otherwise the request's own x
        for (const c of ref.cols.get(agent.id) || []) {
          const [x0, x1] = g.tread(agent, c.i);
          if (c.x0 !== c.x1) assert.deepEqual([x0, x1], [c.x0, c.x1], `${agent.id} tread ${c.i}`);
          else assert.ok(x0 <= c.x0 && c.x0 <= x1, `${agent.id} tread ${c.i} holds its column`);
          assert.deepEqual([...g.tops(agent, c.i)], [...c.t]);
        }
        // heights: 50 evenly spaced samples per agent, running past each tapered end
        const segs = ref.segsOf.get(agent.id);
        if (!segs) { assert.equal(g.heightAt(agent, 0), -1); continue; }
        const lo = Math.min(...segs.map(s => s.inf.xs[s.seg.i0] * ref.W)) - 1, hi = Math.max(...segs.map(s => s.inf.xs[s.seg.i1] * ref.W)) + 1;
        for (let k = 0; k < 50; k++) {
          const x = lo + (hi - lo) * k / 49;
          let want = -1;
          for (const s of segs) { const h = ref.heightAt(agent, s.inf, s.seg, x, s.taper); if (h >= 0) { want = h; break; } }
          assert.equal(g.heightAt(agent, x), want, `${agent.id} heightAt ${x}`);
          for (const s of segs) assert.equal(g.heightAtSeg(agent, s.inf, s.seg, x, s.taper), ref.heightAt(agent, s.inf, s.seg, x, s.taper));
        }
        // and at every column and every midpoint between columns
        for (const s of segs) for (let i = s.seg.i0; i <= s.seg.i1; i++) {
          const x = s.inf.xs[i] * ref.W, xm = i < s.seg.i1 ? (x + s.inf.xs[i + 1] * ref.W) / 2 : x + s.taper / 2;
          for (const xx of [x, xm]) assert.equal(g.heightAtSeg(agent, s.inf, s.seg, xx, s.taper), ref.heightAt(agent, s.inf, s.seg, xx, s.taper));
        }
      }
      assert.ok(checked > 0);
    });
  }
}

test("landscape geometry: topsOf on a normalised scale matches the cores' use", () => {
  const trace = SESSIONS.at(-1)[1];
  const ref = reference(trace, buildLayout(trace), 2);
  for (const a of trace.agents.slice(0, 12)) for (const r of a.requests) {
    const s = 1 / Math.max(1, r.tokens.context || 1);
    assert.deepEqual([...api.topsOf(r, s)], [...ref.topsOf(r, s)]);
  }
  const grey = api.topsOf({ tokens: { context: 100 }, strata: {} }, 0.5);
  assert.deepEqual([...grey], [50, 50, 50, 50, 50, 50, 50, 1], "split unknown: all tops at the crest, flag set");
});
