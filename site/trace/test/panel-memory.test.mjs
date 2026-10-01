// The sidebar's per-view memory (panel-memory.js): folds stay as the user left them across rebuilds and
// history, and the row at the top edge is found again by path or by key, whatever changed above it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { viewKey, enterView, foldOpen, setFold, remember, anchorOf, snapshot, load, forgetAll, hasView,
  findAnchor, anchorFor, anchorDelta, setOpener, openerOf } from "../panel-memory.js";

// A laid-out tree: each node has a height; children stack inside their parent after a fixed header.
function node(h, data = {}, children = [], head = 0) {
  const n = { h, head, dataset: data, children, parentElement: null };
  for (const c of children) c.parentElement = n;
  return n;
}
function layout(root, scrollTop = 0) {
  const pos = new Map();
  const place = (n, y) => {
    pos.set(n, { top: y - scrollTop, bottom: y - scrollTop + n.h });
    let at = y + n.head;
    for (const c of n.children) { place(c, at); at += c.h; }
  };
  place(root, 0);
  return (el) => pos.get(el) || null;
}
const withQuery = (root) => {
  const all = [];
  const walk = (n) => { for (const c of n.children) { all.push(c); walk(c); } };
  walk(root);
  root.querySelectorAll = () => all.filter((n) => n.dataset.fold || n.dataset.netKey || n.dataset.anchor);
  return root;
};

test("a view key names what the panel describes, not how it got there", () => {
  assert.equal(viewKey({ lens: "network", level: 0 }), "panel|network|0");
  assert.equal(viewKey({ lens: "network", level: 0, agentId: "a", reqIdx: 3 }), "panel|network|0");
  assert.equal(viewKey({ lens: "context", level: 2, agentId: "a", reqIdx: 3, stratum: "outside" }), "panel|context|2|a|3");
  assert.equal(viewKey({ lens: "context", level: 3, agentId: "a", reqIdx: 3, stratum: "outside" }), "panel|context|3|a|3|outside");
  assert.equal(viewKey({ lens: "context", level: 2, agentId: "a", reqIdx: 3, inspector: "action", callIndex: 1 }), "panel|context|2|a|3|action|1");
  assert.equal(viewKey({ lens: "context", level: 2, agentId: "a", reqIdx: 3, followingMap: true }), "map|context|2|a|3");
});

test("folds remember the user's choice per view, and fall back to the renderer's default", () => {
  forgetAll();
  enterView("v1");
  assert.equal(foldOpen("role:model", true), true);
  assert.equal(foldOpen("role:other", false), false);
  setFold("role:other", true); setFold("role:model", false);
  enterView("v2");
  assert.equal(foldOpen("role:other", false), false, "another view has its own folds");
  enterView("v1");
  assert.equal(foldOpen("role:other", false), true);
  assert.equal(foldOpen("role:model", true), false, "a closed default stays closed once the user closed it");
});

test("a history snapshot carries folds and anchor and restores them", () => {
  forgetAll();
  enterView("v1"); setFold("events", true);
  const snap = structuredClone(snapshot("v1", { path: [2, 0], offset: -10, keyed: null }));
  forgetAll();
  assert.equal(hasView("v1"), false);
  load(snap);
  enterView("v1");
  assert.equal(foldOpen("events", false), true);
  assert.deepEqual(anchorOf("v1"), { path: [2, 0], offset: -10, keyed: null });
});

// Panel: header 100, a fold "role:other" 1,000 tall holding 10 rows of 100, then a section of 500.
function panel(open = true) {
  const rows = Array.from({ length: 10 }, (_, i) => node(100, { netKey: `endpoint-row:${i}` }));
  const fold = node(open ? 1000 : 40, { fold: "role:other" }, open ? rows : [], 0);
  return withQuery(node(1640, {}, [node(100), fold, node(500)]));
}

test("the row at the top edge is found again after a rebuild with the same structure", () => {
  const before = panel();
  const a = findAnchor(before, 0, layout(before, 650)); // row 5 of the fold spans 600..700
  assert.deepEqual(a.path, [1, 5]);
  assert.equal(a.offset, -50);
  assert.equal(a.keyed.key, "endpoint-row:5");
  const after = panel();
  assert.equal(anchorDelta(after, a, 0, layout(after, 0)), 650, "scroll to 650 again");
});

test("when content above changes height, the anchor holds the same row (a raw scrollTop would not)", () => {
  const before = panel();
  const a = findAnchor(before, 0, layout(before, 650));
  const after = panel();
  after.children[0].h = 300; // the header grew by 200
  assert.equal(anchorDelta(after, a, 0, layout(after, 0)), 850);
});

test("when the path no longer leads through the keyed row, the key finds it", () => {
  const before = panel();
  const a = findAnchor(before, 0, layout(before, 650));
  // A reader was inserted at the top: every index shifts by one.
  const after = panel();
  const reader = node(400, { anchor: "reader" });
  after.children.unshift(reader); reader.parentElement = after;
  const d = anchorDelta(withQuery(after), a, 0, layout(after, 0));
  assert.equal(d, 650 + 400, "same row, 400 px further down");
});

test("a clicked row's anchor returns there after the reader it opened closes", () => {
  forgetAll();
  const p = panel();
  const m = layout(p, 650);
  const row = p.children[1].children[7];
  const a = anchorFor(p, row, 0, m);
  assert.deepEqual(a.path, [1, 7]);
  assert.equal(a.offset, 150);
  setOpener("v1", a);
  const after = panel();
  assert.equal(anchorDelta(after, openerOf("v1"), 0, layout(after, 0)), 650);
});

test("nothing to anchor: an empty panel or a missing row gives null, not a jump", () => {
  assert.equal(findAnchor(node(0, {}, []), 0, () => ({ top: 0, bottom: 0 })), null);
  const p = panel();
  assert.equal(anchorDelta(p, { path: [9, 9], offset: 0, keyed: null }, 0, layout(p, 0)), null);
});

test("remember keeps the most recent views and drops the oldest past its limit", () => {
  forgetAll();
  for (let i = 0; i < 200; i++) remember(`v${i}`, { path: [0], offset: 0, keyed: null });
  assert.equal(hasView("v0"), false);
  assert.equal(hasView("v199"), true);
});
