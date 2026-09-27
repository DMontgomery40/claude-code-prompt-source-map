// The harness layer's view (harness/view.js), headless: layout, scene-graph counts, presets, the hero
// picker, sync -> rack selection and the pick hand-off. Real rendering is checked with stills.
// All text below is synthetic.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createHarnessView, layoutBoard, rungWords, whereText, instructionScore, pickHero, birthSet, laterRequest, compareAgent,
  normPlate, plateWords, foldPlates, buildRack, heroFacts, PRESETS, PRESET_NAMES, RUNG_CLASS,
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

test("rung words: binary-only says where the text lives (binary, app bundle or source); anything unmatched is only 'not in the library'", () => {
  assert.equal(rungWords(fixture().model)["found-nowhere"], "not in the examplelib library");
  assert.equal(rungWords(fixture({ literals: true }).model)["found-nowhere"], "not in the examplelib library", "never 'found nowhere'");
  assert.equal(whereText({ rung: "binary-only", where: { kind: "binary", shelf: "example binary 1.1", key: "chunk-abc.js", pos: 190114848 } }), "in the binary: chunk-abc.js @ 190,114,848");
  assert.equal(whereText({ rung: "binary-only", where: { kind: "bundle", shelf: "example desktop app", key: "main-x1.js", pos: 1057472 } }), "in the app bundle: main-x1.js @ 1,057,472");
  assert.equal(whereText({ rung: "binary-only", where: { kind: "source", shelf: "example source tree", key: "src/reply.rs", pos: 41 } }), "in the source: src/reply.rs:41");
  assert.equal(whereText({ rung: "binary-only", where: { shelf: "example binary 1.1", key: "chunk-abc.js", pos: 7 } }), "in the binary: chunk-abc.js @ 7", "no kind: binary");
  assert.equal(whereText({ rung: "linked", where: { shelf: "lib shelf", key: "a.js", pos: 5, label: "a.js @5" } }), "a.js @5");
  assert.equal(whereText({ rung: "found-nowhere", where: null }), null);
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
    if (!["rack", "later", "compare", "hero"].includes(name)) assert.equal(p, PRESETS[name].p.join(","), name);
    seen.set(name, p);
  }
  const fixed = ["hero", "session", "close"].map(n => seen.get(n));
  assert.equal(new Set(fixed).size, 3, "the board presets each have their own camera (the hero is framed to its instrument)");
  assert.ok(!fixed.includes(seen.get("rack")) && !fixed.includes(seen.get("compare")), "racks are framed from what was built");
  await v.setPreset("compare", { instant: true });
  assert.equal(v.scene.children.filter(o => o.name === "hv:rack").length, 2, "compare builds two racks");
});

test("sync: a request shows its rack, the session shows the board, an open block lights its piece", async () => {
  const { model, trace } = fixture(), { v, calls } = view();
  await v.setModel(model, trace);
  const before = calls.length;
  await v.sync({ level: 2, agentId: "sub-a", reqIdx: 1, block: null });
  assert.equal(calls.length, before, "hidden: the selection waits, no rack is built");
  await v.show();
  assert.equal(v.state.preset, "rack");
  assert.deepEqual(v.state.rack, [1, 1]);
  assert.deepEqual(calls.at(-1), [1, 1]);
  await v.sync({ level: 3, agentId: "root-1", reqIdx: 2, block: 22 });
  assert.equal(v.state.preset, "piece", "an open block that carries a piece shows that piece's instrument");
  assert.equal(v.state.selected, "summary");
  assert.equal(v.scene.getObjectByName("hv:hero").userData.piece.id, "summary");
  assert.ok(v.scene.getObjectByName("hv:hero-copy"), "the open copy is marked on the rows");
  await v.setPreset("rack", { instant: true });
  assert.deepEqual(v.state.rack, [0, 2], "One request returns to the request that block belongs to");
  await v.sync({ level: 0, agentId: null, reqIdx: 0, block: null });
  assert.equal(v.state.preset, "session");
  assert.equal(v.state.selected, null);
});

test("pick: hands Trace the selected agent's copy, else the first; its echo keeps the view", async () => {
  const { model, trace } = fixture(), { v, picks } = view();
  await v.setModel(model, trace);
  v.show();
  await v.setPreset("session", { instant: true });
  v.pickPiece("notice");
  assert.deepEqual(picks.at(-1), ["root-1", 1], "no agent selected: the first delivery");
  await v.sync({ level: 1, agentId: "sub-b", reqIdx: 0, block: null });
  v.pickPiece("notice");
  assert.deepEqual(picks.at(-1), ["sub-b", 2], "the selected agent's own copy");
  await v.sync({ level: 3, agentId: "sub-b", reqIdx: 0, block: 2 });   // Trace echoes the pick
  assert.equal(v.state.preset, "piece", "a pick shows the piece's instrument; the echo of our own pick does not fly to a rack");
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

test("racks: every copy of a piece folds into one plate (×n), conversation folds into one count, long racks use columns", () => {
  const plates = [{ piece: "a", n: 1, block: 3 }, { core: true, n: 2 }, { piece: "b", n: 1, block: 6 }, { core: true, n: 1 }, { piece: "a", n: 1, block: 9 }, { piece: "a", n: 2, block: 10 }];
  const f = foldPlates(plates);
  assert.deepEqual(f.plates.map(p => [p.piece, p.n, p.block]), [["a", 4, 3], ["b", 1, 6]], "first copy's block kept");
  assert.equal(f.conv, 3);
  const { model } = fixture(), L = layoutBoard(model), SEL = { value: -1 };
  const many = Array.from({ length: 26 }, (_, k) => ({ piece: model.pieces[k % 7].id + (k >= 7 ? `-${k}` : ""), n: 1 }));
  const rg = buildRack(L, { agent: 0, req: 0, plates: many }, -3, SEL);
  assert.equal(rg.userData.cols, 2, "26 distinct plates stand in two columns");
  assert.equal(buildRack(L, { agent: 0, req: 0, plates: many }, -3, SEL, { columns: 1 }).userData.cols, 1, "compare keeps one column");
  const short = buildRack(L, { agent: 0, req: 0, plates: plates }, -3, SEL);
  assert.equal(short.userData.plates, 2); assert.equal(short.userData.conv, 3); assert.equal(short.userData.cols, 1);
});

test("plate words: the payload first, without the wrapper tags", () => {
  assert.equal(plateWords("<heartbeat> <automation_id>sync-1</automation_id> Continue the task."), "sync-1 Continue the task.");
  assert.equal(plateWords("## My request:"), "My request:");
  assert.equal(plateWords("<only-tag>"), "<only-tag>", "a bare tag stays as it is");
});

test("hero facts: the sockets tell the rung truthfully, and the readout says who got it or how often", () => {
  const { model } = fixture({ literals: true });
  const one = (over) => ({ ...model.pieces[0], ...over });
  let f = heroFacts(model, one({ rung: "binary-only", where: { kind: "source", shelf: "example source", key: "src/a.rs", pos: 86 } }));
  assert.equal(f.library.state, "dark"); assert.equal(f.library.text, "not in the library");
  assert.equal(f.code.state, "lit"); assert.equal(f.code.title, "SHIPPED CODE · IN THE SOURCE"); assert.equal(f.code.text, "src/a.rs:86");
  f = heroFacts(model, one({ rung: "binary-only", where: { kind: "bundle", key: "main-x.js", pos: 1057778 } }));
  assert.equal(f.code.title, "SHIPPED CODE · IN THE APP BUNDLE"); assert.equal(f.code.text, "main-x.js @ 1,057,778");
  f = heroFacts(model, one({ rung: "found-nowhere", where: null }));
  assert.deepEqual([f.library.state, f.code.state, f.code.text], ["dark", "dark", "not found in the shipped code either"], "not in either");
  f = heroFacts({ ...model, literals: false, pieces: model.pieces.map(q => ({ ...q, rung: q.rung === "binary-only" ? "found-nowhere" : q.rung })) }, one({ rung: "found-nowhere", where: null }));
  assert.equal(f.code.text, "not checked (no literal index)");
  f = heroFacts(model, one({ rung: "in-library-unlinked", record: { page: "p", title: "Example record" }, where: null }));
  assert.equal(f.library.state, "amber"); assert.equal(f.library.text, "in the library: Example record"); assert.equal(f.code.state, "dark");
  f = heroFacts(model, one({ rung: "linked", record: { page: "p", title: "Rec" }, where: { shelf: "example binary", key: "chunk-a.js", pos: 5 } }));
  assert.deepEqual([f.library.state, f.code.state, f.code.text], ["lit", "lit", "chunk-a.js @ 5"]);
  // A composite's lines match several records: the library has it in parts, never "not in the library".
  f = heroFacts(model, one({ rung: "composite", record: null, where: null, composite: { parts: [{ page: "p", title: "Minor", n: 2 }, { page: "p", title: "Git attribution reminder", n: 9 }, { page: "q", title: "Third", n: 1 }], matched: 12, lines: 20 } }));
  assert.deepEqual([f.library.state, f.library.text, f.code.text], ["lit", "in the library in 3 parts: Git attribution reminder, …", "no single offset (3 parts)"]);
  f = heroFacts(model, one({ rung: "composite", record: null, where: null, composite: null }));
  assert.equal(f.library.text, "not in the library");
  f = heroFacts(model, one({ rung: "outside", origin: "file", where: null }));
  assert.deepEqual([f.library.text, f.code.state, f.code.text], ["not harness text", "paper", "from your files"]);
  f = heroFacts(model, model.pieces[0]);   // two of three agents
  assert.equal(f.readout.big, "2 OF 3 AGENTS GOT IT");
  assert.match(f.didNot, /^did not get it: main \(root, born \+0 m\)$/);
  const single = { ...model, agents: [model.agents[0]] };
  assert.equal(heroFacts(single, { ...model.pieces[1], n: 3, ev: [[0, 5], [0, 35], [0, 155]] }).readout.big, "3 TIMES OVER 2.5 H");
  assert.equal(heroFacts(single, { ...model.pieces[1], n: 1, ev: [[0, 40]] }).readout.big, "ONCE, AT 40 M");
});

test("hero preset: the instrument replaces the board on screen; its sockets and ticks match the facts", async () => {
  const { model, trace } = fixture({ literals: true }), { v } = view();
  await v.setModel(model, trace);
  const hero = v.scene.getObjectByName("hv:hero"), board = v.scene.getObjectByName("hv:board");
  assert.equal(v.state.preset, "hero"); assert.ok(hero.visible); assert.ok(!board.visible);
  assert.equal(hero.getObjectByName("hv:socket-library").userData.lit, false);
  assert.equal(hero.getObjectByName("hv:socket-code").userData.lit, true, "binary-only: the shipped-code socket is lit");
  assert.equal(hero.getObjectByName("hv:hero-ticks").count, model.pieces[0].ev.length);
  await v.setPreset("session", { instant: true });
  assert.ok(!hero.visible); assert.ok(board.visible);
});

test("picks: any piece gets the instrument; Hero returns to the least-explained piece; nothing else is lost", async () => {
  const { model, trace } = fixture({ literals: true }), { v, picks } = view();
  await v.setModel(model, trace); v.show();
  await v.setPreset("session", { instant: true });
  v.pickPiece("memo");
  await new Promise(r => setTimeout(r, 0));
  assert.equal(v.state.preset, "piece");
  const inst = () => v.scene.getObjectByName("hv:hero");
  assert.equal(inst().userData.piece.id, "memo");
  assert.equal(inst().userData.facts.code.state, "paper", "outside: the second socket names the outside source");
  assert.deepEqual(picks.at(-1), ["root-1", 2], "the pick still opens the text in Trace's reader");
  await v.setPreset("hero", { instant: true });
  assert.equal(inst().userData.piece.id, "roster"); assert.equal(v.state.selected, "roster");
  await v.setPreset("piece", { instant: true });
  assert.equal(inst().userData.piece.id, "memo", "the picked piece stays one click away");
  for (const name of ["session", "rack", "later", "compare", "close"]) { await v.setPreset(name, { instant: true }); assert.equal(v.state.preset, name); }
  assert.ok(!inst().visible && v.scene.getObjectByName("hv:board").visible);
});
