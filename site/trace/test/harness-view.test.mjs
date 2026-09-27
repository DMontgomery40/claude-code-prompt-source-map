// The harness layer's view (harness/view.js), headless: layout, scene-graph counts, presets, the hero
// picker, sync -> rack selection and the pick hand-off. Real rendering is checked with stills.
// All text below is synthetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHarnessView, layoutBoard, rungWords, instructionScore, pickHero, birthSet, laterRequest, compareAgent,
  normPlate, PRESETS, PRESET_NAMES, RUNG_CLASS,
} from "../harness/view.js";

// Three agents: the main thread (4 requests, compacted once) and two subagents (2 requests each).
function fixture({ literals = false } = {}) {
  const win = (a, b) => ({ t: 0, window: [a, b] });
  const trace = { agents: [
    { id: "root-1", kind: "root", requests: [win(0, 9), win(10, 19), win(20, 29), win(30, 39)], compactions: [{ block: 22, t: 50 }] },
    { id: "sub-a", kind: "subagent", requests: [win(0, 6), win(7, 12)], compactions: [] },
    { id: "sub-b", kind: "subagent", requests: [win(0, 6), win(7, 12)], compactions: [] },
  ] };
  const piece = (id, rung, trigger, blocks, extra = {}) => ({
    id, name: `piece ${id}`, rung, origin: extra.origin ?? null, record: null, where: extra.where ?? null, trigger, triggers: [[trigger, blocks.length]],
    via: extra.via ?? [["own block", blocks.length]], n: blocks.length, reach: new Set(blocks.map(b => b[0])).size,
    sample: extra.sample ?? "Synthetic harness text for the view test.", note: null,
    ev: blocks.map(([a], k) => [a, 5 + k * 10]), blocks, order: 0,
  });
  const pieces = [
    piece("roster", literals ? "binary-only" : "found-nowhere", "agent birth", [[1, 1], [2, 1]], { sample: "Other workers are active in this session; you can message them by name." }),
    piece("header", literals ? "binary-only" : "found-nowhere", "every tool call", [[0, 3], [0, 13], [0, 23], [0, 33], [1, 4]], { sample: "Wall time: 0.51 seconds Output:", via: [["tool result", 5]] }),
    piece("notice", "in-library-unlinked", "agent birth", [[0, 1], [1, 2], [2, 2]], { where: { shelf: "lib shelf", key: "a.js", pos: 10, label: "a.js @10" } }),
    piece("prompt", "linked", "every request", [[0, 0], [0, 10], [0, 20], [0, 30], [1, 0], [2, 0]], { where: { shelf: "lib shelf", key: "a.js", pos: 5, label: "a.js @5" } }),
    piece("memo", "outside", "agent birth", [[0, 2], [1, 3], [2, 3]], { origin: "file" }),
    piece("summary", "linked-type-text-differs", "compaction", [[0, 22]], { where: { shelf: "lib shelf", key: "b.js", pos: 1, label: "b.js @1" } }),
    piece("birthonly-b", "composite", "agent birth", [[2, 5]]),
  ];
  pieces.forEach((p, k) => { p.order = k; });
  const model = {
    product: "Example Product", libName: "examplelib", literals, shelves: [{ name: "lib shelf", n: 3 }],
    session: { version: "1.0", libVersion: "1.1", title: "t", started: 0, ended: 6000000, nagents: 3, nrequests: 8, minutes: 100 },
    agents: [
      { id: "root-1", name: "main", kind: "root", model: "m", born: 0, end: 100, reqs: 4 },
      { id: "sub-a", name: "a", kind: "subagent", model: "m", born: 10, end: 40, reqs: 2 },
      { id: "sub-b", name: "b", kind: "subagent", model: "m", born: 20, end: 60, reqs: 2 },
    ],
    pieces, births: [],
  };
  return { model, trace };
}
// A stand-in for pieces.js rackFor: each block in the window that a piece was delivered at is a plate.
function makeRackFor(calls = []) {
  return (model, trace, ai, ri) => {
    calls.push([ai, ri]);
    const w = trace.agents[ai].requests[ri].window, plates = [];
    for (let b = w[0]; b <= w[1]; b++) {
      const p = model.pieces.find(q => q.blocks.some(([a, x]) => a === ai && x === b));
      plates.push(p ? { piece: p.id, n: 1, block: b, excerpt: "synthetic" } : { core: true, n: 1 });
    }
    return { agent: ai, req: ri, t: 0, plates };
  };
}
const view = (opts = {}) => {
  const picks = [], calls = [];
  const v = createHarnessView({ headless: true, onPick: (a, b) => picks.push([a, b]), rackFor: makeRackFor(calls), ...opts });
  return { v, picks, calls };
};

test("layout: every piece gets an origin, a lane, a clamp and a fan; zones run back to front", () => {
  const { model } = fixture();
  const L = layoutBoard(model);
  assert.equal(L.P.length, 7);
  assert.equal(L.T.length, new Set(model.pieces.map(p => p.trigger)).size);
  for (const p of L.P) { assert.ok(Number.isFinite(p.zs) && Number.isFinite(p.zl), p.id); assert.ok(p.trig && p.g, p.id); }
  assert.deepEqual(L.P.filter(p => p.kind === "loose").map(p => p.id).sort(), ["header", "roster"]);
  assert.ok(L.zones.rail[1] < L.zones.outside[0] && L.zones.outside[1] < L.zones.loose[0], "rail, then outside, then unmatched");
  assert.equal(new Set(model.agents.map((a, i) => L.pinZ(i))).size, 3, "one pin per agent");
  assert.ok(L.pinZ(0) > L.pinZ(1) && L.pinZ(1) > L.pinZ(2), "main thread first, then birth order");
  assert.equal(RUNG_CLASS["found-nowhere"], "loose");
});

test("rung words: without the literal index an unmatched piece is only 'not in the library'", () => {
  assert.equal(rungWords(fixture().model)["found-nowhere"], "not in the examplelib library");
  assert.equal(rungWords(fixture({ literals: true }).model)["found-nowhere"], "found nowhere");
});

test("hero: instruction-like text beats a formatting header, even one delivered more often", () => {
  assert.ok(instructionScore("Wall time: 0.51 seconds Output:") < 0.1);
  assert.ok(instructionScore("## My request:") < 0.1);
  assert.ok(instructionScore('<image name=[Image #1] path="/tmp/a/b.png">') < 0.1);
  assert.ok(instructionScore("Other workers are active in this session; you can message them by name.") > 0.5);
  assert.equal(pickHero(fixture().model).id, "roster");
});

test("scene graph: wires, pins, clamps, fans and delivery marks match the model", async () => {
  const { model, trace } = fixture(), { v } = view();
  await v.setModel(model, trace);
  const board = v.scene.getObjectByName("hv:board");
  assert.equal(board.getObjectByName("hv:wires").userData.count, 7);
  assert.equal(board.getObjectByName("hv:pins").count, 3);
  assert.equal(board.getObjectByName("hv:clamps").count, 2 * new Set(model.pieces.map(p => p.trigger)).size);
  assert.equal(board.getObjectByName("hv:marks").count, model.pieces.reduce((s, p) => s + p.ev.length, 0));
  assert.equal(board.getObjectByName("hv:strands").count, 2 * 9, "frayed ends on the two unmatched pieces");
  assert.equal(v.state.hero, "roster");
  assert.equal(v.state.preset, "hero");
  assert.equal(v.state.selected, "roster");
});

test("presets: each has its own camera; racks frame what was built", async () => {
  const { model, trace } = fixture(), { v } = view();
  await v.setModel(model, trace);
  const seen = new Map();
  for (const name of PRESET_NAMES) {
    await v.setPreset(name, { instant: true });
    assert.equal(v.state.preset, name);
    const p = v.camera.position.toArray().map(x => +x.toFixed(3)).join(",");
    if (!["rack", "later", "compare"].includes(name)) assert.equal(p, PRESETS[name].p.join(","), name);
    seen.set(name, p);
  }
  const fixed = ["hero", "session", "close"].map(n => seen.get(n));
  assert.equal(new Set(fixed).size, 3, "the board presets each have their own camera");
  assert.ok(!fixed.includes(seen.get("rack")) && !fixed.includes(seen.get("compare")), "racks are framed from what was built");
  await v.setPreset("compare", { instant: true });
  assert.equal(v.scene.children.filter(o => o.name === "hv:rack").length, 2, "compare builds two racks");
});

test("sync: a request shows its rack, the session shows the board, an open block lights its piece", async () => {
  const { model, trace } = fixture(), { v, calls } = view();
  await v.setModel(model, trace);
  await v.sync({ level: 2, agentId: "sub-a", reqIdx: 1, block: null });
  assert.equal(v.state.preset, "rack");
  assert.deepEqual(v.state.rack, [1, 1]);
  assert.deepEqual(calls.at(-1), [1, 1]);
  await v.sync({ level: 3, agentId: "root-1", reqIdx: 2, block: 22 });
  assert.deepEqual(v.state.rack, [0, 2]);
  assert.equal(v.state.selected, "summary");
  await v.sync({ level: 0, agentId: null, reqIdx: 0, block: null });
  assert.equal(v.state.preset, "session");
  assert.equal(v.state.selected, null);
});

test("pick: hands Trace the selected agent's copy, else the first; its echo keeps the view", async () => {
  const { model, trace } = fixture(), { v, picks } = view();
  await v.setModel(model, trace);
  await v.setPreset("session", { instant: true });
  v.pickPiece("notice");
  assert.deepEqual(picks.at(-1), ["root-1", 1], "no agent selected: the first delivery");
  await v.sync({ level: 1, agentId: "sub-b", reqIdx: 0, block: null });
  v.pickPiece("notice");
  assert.deepEqual(picks.at(-1), ["sub-b", 2], "the selected agent's own copy");
  await v.sync({ level: 3, agentId: "sub-b", reqIdx: 0, block: 2 });   // Trace echoes the pick
  assert.equal(v.state.preset, "session", "the echo of our own pick does not fly to a rack");
  v.pickPiece("header", { agent: 0, block: 23 });
  assert.deepEqual(picks.at(-1), ["root-1", 23], "a plate hands off its own block");
});

test("requests: births, the later request and the compare partner come from the trace", () => {
  const { model, trace } = fixture();
  assert.deepEqual([...birthSet(model, trace, 2)].sort(), ["birthonly-b", "memo", "notice", "prompt", "roster"]);
  assert.deepEqual(laterRequest(model, trace), { agent: 0, req: 2 });
  assert.equal(compareAgent(model, trace, null), 1);
  assert.equal(compareAgent(model, trace, 2), 2);
  assert.equal(compareAgent(model, trace, 0), 1, "the main thread is never its own partner");
});

test("plates: the view reads either field spelling and folds conversation", () => {
  assert.deepEqual(normPlate({ shape: "x", n: 2, excerpt: "e" }), { piece: "x", core: false, n: 2, excerpt: "e", block: null, label: undefined, more: false });
  assert.equal(normPlate({ core: true, n: 3 }).core, true);
  assert.equal(normPlate({ kind: "conversation" }).piece, null);
  assert.equal(normPlate({ piece: 4, blocks: [9, 10] }).block, 9);
});

test("show and hide: hidden means no work queued", async () => {
  const { model, trace } = fixture(), { v } = view();
  await v.setModel(model, trace);
  assert.equal(v.state.shown, false);
  v.show(); assert.equal(v.state.shown, true);
  v.hide(); assert.equal(v.state.shown, false);
  v.playhead(50);
  assert.ok(v.scene.getObjectByName("hv:now").visible);
  v.dispose();
});
