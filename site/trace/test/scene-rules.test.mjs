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
