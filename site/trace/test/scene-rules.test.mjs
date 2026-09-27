import { test } from "node:test";
import assert from "node:assert/strict";
import { landscapeRule, tread, treadAt, crestEvents, placeLabel, modelSwitches, BASE_W, BASE_H } from "../scene-rules.js";

test("landscape rule: only a session without subagent ridges gets the compact, stepped massif", () => {
  for (const lanes of [0, undefined, null]) {
    const r = landscapeRule({ lanes });
    assert.equal(r.compact, true);
    assert.equal(r.stepped, true);
    assert.ok(r.width / BASE_H <= 3 + 1e-9, "length at most three times the height");
  }
  for (const lanes of [1, 3, 12]) {
    const r = landscapeRule({ lanes });
    assert.deepEqual([r.compact, r.stepped, r.width], [false, false, BASE_W]);
  }
});

test("treads tile the segment without gaps or overlaps, and each holds its own request", () => {
  const cases = [[0, 1, 2, 3], [0, 0.1, 0.9, 1], [0, 0.5, 0.5, 0.6], [2], [0, 10, 11, 40, 41, 42]];
  for (const pts of cases) for (const taper of [0.18, 0.3]) {
    const xAt = i => pts[i];
    const i0 = 0, i1 = pts.length - 1;
    let prevEnd = null;
    for (let i = i0; i <= i1; i++) {
      const [a, b] = tread(xAt, i0, i1, i, taper);
      assert.ok(a <= pts[i] && pts[i] <= b, `request ${i} inside its tread`);
      if (prevEnd != null) assert.equal(a, prevEnd, "treads meet exactly");
      prevEnd = b;
      // every point of the tread maps back to a request at that x, the tread's own unless x ties
      for (const f of [0.01, 0.5, 0.99]) {
        const x = a + (b - a) * f;
        const j = treadAt(xAt, i0, i1, x, taper);
        assert.ok(j >= 0, "inside the segment");
        if (pts[j] !== pts[i]) assert.equal(j, i, `x=${x} in tread ${i}`);
      }
    }
    assert.equal(treadAt(xAt, i0, i1, pts[i0] - taper - 0.01, taper), -1);
    assert.equal(treadAt(xAt, i0, i1, pts[i1] + taper + 0.01, taper), -1);
  }
});

test("treads work on a sub-range of the requests (one segment between idle gaps)", () => {
  const pts = [0, 1, 2, 10, 11, 12];
  const xAt = i => pts[i];
  assert.deepEqual(tread(xAt, 3, 5, 3, 0.2), [9.8, 10.5]);
  assert.equal(treadAt(xAt, 3, 5, 10.6, 0.2), 4);
  assert.equal(treadAt(xAt, 3, 5, 5, 0.2), -1);
});

test("crest events name the largest block with its own size and count the rest", () => {
  const blocks = [
    { kind: "injected", seenBy: 0, est: 5000 },                        // part of the first request: not an event
    { kind: "injected", seenBy: 4, est: 3600, label: "invoked skills re-sent" },
    { kind: "injected", seenBy: 4, est: 2000 },
    { kind: "injected", seenBy: 4, est: 1200 },
    { kind: "outside", seenBy: 4, est: 90000 },                         // outside text is never a crest event
    { kind: "you", own: true, seenBy: 7, est: 300, resendOf: 1 },       // the user's setup sent again
    { kind: "injected", seenBy: 9, est: 400 },                          // too small
    { kind: "injected", seenBy: 9, est: 1000, carried: true }           // carried over, not new
  ];
  const ev = crestEvents(blocks, b => b.est * 2);
  assert.deepEqual(ev.map(e => e.i), [4, 7]);
  const [a, b] = ev;
  assert.equal(a.top, 1);
  assert.equal(a.topSize, 7200, "the label's number is the largest block's own scaled size");
  assert.equal(a.n, 3);
  assert.equal(a.total, (3600 + 2000 + 1200) * 2);
  assert.equal(b.top, 5);
  assert.equal(crestEvents(blocks, b => b.est, 1).length, 1);
});

test("a label near the right edge flips inward before it hides; low-priority labels never flip", () => {
  const box = { x0: 2, x1: 1000, y0: 0, y1: 800 };
  const cliff = { px: 950, py: 200, w: 160, h: 24, cx: 0, cy: 1, flip: true };
  const p = placeLabel(cliff, box, []);
  assert.ok(p, "placed");
  assert.equal(p.cx, 1, "anchored at its right edge");
  assert.ok(p.x + p.w <= box.x1);
  assert.equal(placeLabel({ ...cliff, flip: false }, box, []), null);
  // its own anchor wins when it fits
  assert.equal(placeLabel({ ...cliff, px: 400 }, box, []).cx, 0);
  // a centred label tries right, then left
  const blocker = { x: 300, y: 176, w: 200, h: 24 };
  const ev = { px: 400, py: 200, w: 120, h: 24, cx: 0.5, cy: 1, flip: true };
  const q = placeLabel(ev, box, [{ x: 330, y: 176, w: 60, h: 24 }]);
  assert.ok(q && q.cx !== 0.5);
  assert.equal(placeLabel(ev, box, [blocker]), null, "hidden when every anchor collides");
});

test("model switches are listed where the model changes", () => {
  const reqs = [{ model: "astra" }, { model: "astra" }, { model: null }, { model: "sol" }, { model: "sol" }, { model: "astra" }];
  assert.deepEqual(modelSwitches(reqs), [{ i: 3, from: "astra", to: "sol" }, { i: 5, from: "sol", to: "astra" }]);
  assert.deepEqual(modelSwitches([]), []);
});

test('semantic zoom reveals and removes detail with stable transition bands', async () => {
  const { mapDetail } = await import('../scene-rules.js');
  for (const [zoom, expected] of [[0.2, 0], [1, 0], [1.8, 1], [3.2, 2], [6, 3], [80, 3]]) {
    assert.equal(mapDetail(zoom).level, expected);
  }
  for (const [level, zoom] of [[1, 1.5], [2, 2.7], [3, 4.8]]) assert.equal(mapDetail(zoom, level).level, level);
  assert.equal(mapDetail(1, 3).level, 0, 'zooming out removes all fine detail');
  assert.equal(mapDetail(NaN).level, 0);
  assert.ok(mapDetail(6).cell < mapDetail(1).cell);
});

test('map symbols group in world bins: panning never regroups them, zooming only splits or merges whole groups', async () => {
  const { clusterStable, binExponent } = await import('../render-quality.js');
  // a few hundred beacons on four rows, with duplicate positions and every class
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const kinds = ['outward', 'write', 'read'];
  const points = Array.from({ length: 400 }, (_, i) => ({ i, x: Math.floor(rnd() * 900) / 4, z: [-0.8, 16.6, 21.8, 27][i % 4], kind: kinds[i % 3] }));
  const rank = p => kinds.indexOf(p.kind);
  const key = c => `${c.point.kind}:${c.point.z}:${c.point.i}:${c.count}`;
  for (const bin of [0.25, 0.5, 1, 2, 4, 8, 16, 64]) {
    const groups = clusterStable(points, bin, { rank });
    assert.equal(groups.reduce((n, g) => n + g.count, 0), points.length, 'every record is in exactly one group');
    assert.ok(groups.every(g => points.includes(g.point)), 'a group stands on an actual record');
    // input order (and so any camera-driven ordering) does not change groups or their anchors
    const shuffled = [...points].sort(() => rnd() - 0.5);
    assert.deepEqual(clusterStable(shuffled, bin, { rank }).map(key).sort(), groups.map(key).sort());
    // a finer zoom level splits each group; it never moves a record into a different coarse group
    const fine = clusterStable(points, bin / 2, { rank });
    const coarseOf = p => `${p.kind}:${p.z}:${Math.floor(p.x / bin)}`;
    const members = new Map();
    for (const p of points) { const k = coarseOf(p); members.set(k, (members.get(k) || 0) + 1); }
    for (const g of groups) assert.equal(g.count, members.get(coarseOf(g.point)));
    for (const g of fine) assert.ok(members.has(coarseOf(g.point)));
  }
  // zoom tier with hysteresis: a wheel hovering at a boundary does not flip the tier back and forth
  let e = binExponent(2 ** 3.49, NaN);
  const seen = new Set([e]);
  for (const w of [3.51, 3.49, 3.6, 3.4, 3.55]) seen.add(e = binExponent(2 ** w, e));
  assert.equal(seen.size, 1);
  assert.equal(binExponent(2 ** 4.4, 3), 4, 'a real zoom change still moves the tier');
});

test('map marker height stays bounded across scale and zoom', async () => {
  const { cappedMarkerHeight } = await import('../scene-rules.js');
  for (const world of [1.5, 3.6, 11, 16]) for (const pixels of [2, 20, 48, 100, 500, 2000]) {
    const height = cappedMarkerHeight(world, pixels, 48);
    assert.ok(height <= world);
    assert.ok(pixels * height / world <= 48 + 1e-9);
  }
  assert.equal(cappedMarkerHeight(2, 0), 0);
});

test('subagent terrain sits in front of the main massif, with disjoint rows at every depth', async () => {
  const { terrainPlacement } = await import('../scene-rules.js');
  assert.equal(typeof terrainPlacement, 'function');
  for (const lanes of [0, 1, 6, 17, 80]) {
    const p = terrainPlacement({ lanes });
    for (let i = 0; i < lanes; i++) {
      assert.ok(p.laneZ(i) - p.subDepth > p.sideZ + 2, 'the main ridge cannot conceal the field');
      if (i) assert.ok(p.laneZ(i) - p.subDepth > p.laneZ(i - 1), 'rows do not intersect');
    }
  }
});

test("grain columns: none at overview or while a column is under 2 px, then 4 / 8 / 16 by zoom level", async () => {
  const { grainColumns, GRAIN_COLUMN_MIN_PX } = await import("../scene-rules.js");
  // measured on the real Claude Code session at each level's entry zoom: column px 0.78, 1.86, 2.89, 4.48
  // (root); its largest subagent's column is 2.02 px at Requests and 3.12 px at Layers
  assert.equal(grainColumns(1, 0.78), 0, "overview");
  assert.equal(grainColumns(1, 40), 0, "overview stays solid even where columns are wide");
  assert.equal(grainColumns(2.4, 1.86), 0, "agents entry: a request is still under 2 px");
  assert.equal(grainColumns(2.4, 3), 4, "agents with room");
  assert.equal(grainColumns(3.72, 2.89), 8, "requests");
  assert.equal(grainColumns(3.72, 2.02), 8, "requests on the largest subagent");
  assert.equal(grainColumns(5.77, 4.48), 16, "layers");
  assert.equal(grainColumns(200, 900), 16, "deep layers");
  assert.equal(GRAIN_COLUMN_MIN_PX, 2);
  // hysteresis: once on, a column may shrink 10% below the threshold before the grains go
  assert.equal(grainColumns(3.72, 1.85, 8), 8);
  assert.equal(grainColumns(3.72, 1.75, 8), 0);
  assert.equal(grainColumns(3.72, 1.95, 0), 0);
  // the level gate uses mapDetail's hysteresis from the previous result's level
  assert.equal(grainColumns(4.8, 10, 16), 16, "just under the Layers threshold, still Layers");
  assert.equal(grainColumns(4.8, 10, 8), 8);
  for (const bad of [NaN, undefined, -1, 0]) assert.equal(grainColumns(6, bad), 0);
});

test("density governor: dropped frames lower density in steps, calm frames restore it, vsync jitter and idle gaps do not count", async () => {
  const { createDensityGovernor } = await import("../scene-rules.js");
  const g = createDensityGovernor();
  for (let i = 0; i < 29; i++) g.push(40);
  assert.equal(g.density, 1, "no verdict before a full window");
  g.push(40);
  assert.equal(g.density, 0.75, "a scene slow from its first frame is slow (display interval capped at 60 Hz)");
  for (let i = 0; i < 30; i++) g.push(40);
  assert.equal(g.density, 0.75 * 0.75, "one step per window, not per frame");
  for (let i = 0; i < 3000; i++) g.push(40);
  assert.equal(g.density, 0.05, "floor");
  for (let i = 0; i < 29; i++) g.push(16.7);
  assert.equal(g.density, 0.05);
  g.push(16.7);
  assert.ok(Math.abs(g.density - 0.055) < 1e-12, "30 calm frames at 60 Hz raise it by 10%");
  // 60 Hz with the jitter measured on the M4 (p05 14.7 .. max 18.7 ms): never a verdict of slow
  const jitter = createDensityGovernor();
  const q = [14.7, 15.8, 16.2, 16.7, 16.7, 17.3, 17.4, 18.0, 18.4, 18.7];
  for (let i = 0; i < 3000; i++) jitter.push(q[(i * 7) % q.length]);
  assert.equal(jitter.density, 1);
  // 60 Hz with every third frame dropped (33 ms): slow
  const drops = createDensityGovernor();
  for (let i = 0; i < 300; i++) drops.push(i % 3 ? 16.7 : 33.4);
  assert.ok(drops.density < 0.5);
  // a 120 Hz display is judged by the flat thresholds: 8.3 ms is fine, 20 ms (under 60 fps) is slow
  const fast = createDensityGovernor();
  for (let i = 0; i < 300; i++) fast.push(8.3);
  assert.equal(fast.density, 1);
  assert.ok(Math.abs(fast.cadence - 8.3) < 1e-9);
  for (let i = 0; i < 30; i++) fast.push(20);
  assert.equal(fast.density, 0.75);
  const h = createDensityGovernor();
  for (let i = 0; i < 500; i++) h.push(i % 2 ? 16.7 : 1000);
  assert.equal(h.density, 1, "intervals over 250 ms are idle time");
  for (let i = 0; i < 1000; i++) h.push(8);
  assert.equal(h.density, 1, "never above 1");
  h.push(NaN); h.push(-3);
  h.reset();
  assert.equal(h.density, 1);
});

test("density governor: on-demand rendering while exploring is not slowness, and the display interval follows the display", async () => {
  const { createDensityGovernor } = await import("../scene-rules.js");
  // Exploring without playing: bursts of 3 to 8 rendered 60 Hz frames, each after an idle pause of 34 to
  // 240 ms (hover, a wheel tick, a label reflow). The pause before a burst is not a contiguous frame.
  const bursts = (g, contiguousGaps) => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let b = 0; b < 600; b++) {
      g.push(34 + rnd() * 206, contiguousGaps);
      for (let f = 0, n = 3 + Math.floor(rnd() * 6); f < n; f++) g.push(16.7);
    }
    return g.density;
  };
  assert.equal(bursts(createDensityGovernor(), false), 1, "idle gaps skipped: density stays 1");
  assert.ok(bursts(createDensityGovernor(), true) < 0.1, "the same gaps read as frames would sink it (the bug)");
  // recovery needs only 30 fast contiguous frames, which bursts of 3-8 reach across idle gaps
  const g = createDensityGovernor();
  for (let i = 0; i < 60; i++) g.push(40);
  assert.equal(g.density, 0.75 * 0.75);
  for (let b = 0; b < 10; b++) { g.push(200, false); for (let f = 0; f < 3; f++) g.push(16.7); }
  assert.ok(Math.abs(g.density - 0.75 * 0.75 * 1.1) < 1e-12, "30 calm frames spread over bursts count");
  // the display interval is a rolling minimum: after a 120 Hz stretch, 60 Hz frames are calm again
  // within a few windows, and reset() forgets it
  const d = createDensityGovernor();
  for (let i = 0; i < 300; i++) d.push(8.3);
  assert.ok(Math.abs(d.cadence - 8.3) < 1e-9);
  for (let i = 0; i < 30 * 8; i++) d.push(16.7);
  assert.ok(Math.abs(d.cadence - 1000 / 60) < 1e-9, "eight 60 Hz windows later the display interval is 60 Hz again");
  for (let i = 0; i < 3000; i++) d.push(i % 10 === 0 ? 18.4 : 16.7);
  assert.equal(d.density, 1, "60 Hz jitter on the slower display is not slow");
  const r = createDensityGovernor();
  for (let i = 0; i < 300; i++) r.push(8.3);
  r.reset();
  assert.ok(Math.abs(r.cadence - 1000 / 60) < 1e-9, "reset forgets the display interval");
});

test("sweep labels: the six largest injected or re-sent blocks of 900 tokens or more, shown a second", async () => {
  const { sweepLabelBands, sweepLabelOpacity } = await import("../scene-rules.js");
  const band = (b, flags, y0, size, blockIndex = b) => ({ b, blockIndex, stratum: 3, flags, y0, y1: y0 + size });
  const bands = [
    band(0, 1, 0, 5000), band(1, 2, 5000, 900), band(2, 1, 6000, 899), band(3, 0, 7000, 50000), band(4, 4, 0, 9000),
    band(5, 3, 60000, 1200), band(6, 1, 61200, 2000), band(7, 1, 63200, 3000), band(8, 1, 66200, 4000), band(9, 1, 70200, 6000),
    band(10, 64, 0, 16000, -1), band(11, 65, 0, 16000, -1)
  ];
  const got = sweepLabelBands(bands);
  assert.deepEqual(got.map(b => b.b), [9, 0, 8, 7, 6, 5], "largest first, six at most");
  assert.ok(!got.some(b => b.b === 1 || b.b === 2), "900 tokens make the cut only when the six are not full");
  assert.deepEqual(sweepLabelBands(bands, { limit: 20 }).map(b => b.b), [9, 0, 8, 7, 6, 5, 1], "exactly 900 counts; 899 does not");
  assert.ok(!sweepLabelBands(bands, { limit: 20 }).some(b => [3, 4, 10, 11].includes(b.b)), "plain, own-only and unlogged rows never");
  assert.deepEqual(sweepLabelBands([]), []);
  assert.equal(sweepLabelOpacity(0), 1);
  assert.equal(sweepLabelOpacity(0.35), 1);
  assert.ok(sweepLabelOpacity(0.6) > 0 && sweepLabelOpacity(0.6) < 1);
  assert.ok(sweepLabelOpacity(0.99) < 0.01);
  assert.equal(sweepLabelOpacity(1), null);
  assert.equal(sweepLabelOpacity(NaN), null);
  for (let a = 0; a < 1; a += 0.01) assert.ok(sweepLabelOpacity(a + 0.01) <= sweepLabelOpacity(a) || sweepLabelOpacity(a + 0.01) == null);
});
