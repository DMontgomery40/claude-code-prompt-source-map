// The playback director (director.js): rules 1-9 of the Task 10 brief on tiny synthetic event lists, and
// the event list built from a real layout and the landscape's own placement.
import { test } from "node:test";
import assert from "node:assert/strict";

const { DIRECTOR, buildEvents, nextShot, agentPAt, followLatch, choosesZoom, createFollowZoom } = await import("../director.js");
const { buildLayout } = await import("../minimap.js");
const { createGeometry } = await import("../landscape-geometry.js");

// A 100-unit-wide world of 101 root requests: at 4x the cut covers 4 units a second, so 0.6 s is 2.4 units.
const W = 100, N = 101;
const unitsPerSec = speed => speed / (N - 1) * W;
const spawn = (x, childId, lane = 0, yTop = 5) => ({ kind: "spawn", x, t: x, childId, parentId: "root", lane, z: 17 + 5.2 * lane, y: yTop * 1000, yTop, rootReq: Math.floor(x) });
const ret = (x, childId, lane = 0) => ({ kind: "return", x, childX: x - 1, t: x, childId, parentId: "root", lane, z: 17 + 5.2 * lane, yTop: 4, parentX: x, parentZ: 0, parentTop: 20 });
const comp = (req, x) => ({ kind: "compaction", agentId: "root", req, x, prevX: x - 1, t: x, z: 0, y: 900000, yTop: 30, rootReq: req });
// kids: [[id, x of its first request in the wait]]
const wait = (x, x1, kids) => ({ kind: "wait", x, x1, t: x, rootReq: Math.floor(x), z: 0, yTop: 20, children: kids.map(([id, x0], k) => ({ id, x0, x1, z: 17 + 5.2 * k, yTop: 6 })) });
const sorted = list => list.sort((a, b) => a.x - b.x);

// One tick's state at cut x (the root's own playhead P = x, one request per world unit).
function state(events, x, over = {}) {
  return { P: x, playing: true, speed: 4, n: N, W, cutX: x, prevCutX: x, level: 2, override: false, forced: false,
    lead: { agentId: "root", P: x, x, z: 0, yTop: 20 }, events, ...over };
}
// Plays from x0 for `ms` in 1/60 s ticks; returns every non-null shot with the tick time and x.
function play(events, x0, ms, over = {}, prev0 = null) {
  const speed = over.speed ?? 4, dt = 1000 / 60, out = [];
  let x = x0, prev = prev0;
  for (let now = 0; now <= ms; now += dt) {
    const nx = now ? x + unitsPerSec(speed) * dt / 1000 : x;
    const s = state(events, nx, { ...over, prevCutX: x, lead: { agentId: "root", P: nx, x: nx, z: 0, yTop: 20 } });
    x = nx;
    const shot = nextShot(s, prev, now);
    if (shot) { out.push({ now, x, shot }); prev = shot; }
  }
  return { shots: out, last: prev };
}
// The kinds of the shots that moved the camera (an update of the current shot is not a new one).
const kinds = r => r.shots.filter((o, k) => !k || o.shot.id !== r.shots[k - 1].shot.id).map(o => o.shot.kind);

test("rule 1: nothing while paused; the overview stays still unless Follow was asked; the user's camera is manual", () => {
  const ev = sorted([spawn(20, "a")]);
  assert.equal(nextShot(state(ev, 10, { playing: false }), null, 0), null);
  const none = nextShot(state(ev, 10, { level: 0 }), null, 0);
  assert.equal(none.kind, "none");
  assert.equal(nextShot(state(ev, 10.1, { level: 0 }), none, 16), null, "said once");
  assert.equal(nextShot(state(ev, 10, { level: 0, forced: true }), null, 0).kind, "follow", "Follow asked for at the overview");
  const manual = nextShot(state(ev, 10, { override: true }), none, 0);
  assert.deepEqual([manual.kind, manual.box], ["manual", null]);
  assert.equal(nextShot(state(ev, 20.5, { override: true, prevCutX: 19.5 }), manual, 16), null, "a spawn does not move a camera the user holds");
  assert.equal(nextShot(state(ev, 10), manual, 32).kind, "follow", "re-enabled: follow again");
});

test("rule 2: follow puts the leading column's top at 42% and moves only past the 8% dead band, eased 600 ms", () => {
  const f = nextShot(state([], 10), null, 0);
  assert.deepEqual([f.kind, f.anchor, f.zoom, f.ease, f.target], ["follow", [0.42, 0.35], "follow", 600, [10, 20, 0]]);
  assert.equal(nextShot(state([], 11, { leadFx: 0.42 + 0.079 }), f, 700), null, "inside the dead band");
  assert.equal(nextShot(state([], 11, { leadFx: 0.42 - 0.079 }), f, 700), null);
  const moved = nextShot(state([], 11, { leadFx: 0.42 + 0.081 }), f, 700);
  assert.deepEqual([moved.kind, moved.target[0]], ["follow", 11]);
  // Without the column's screen position: drift in world units over the width seen at the column.
  assert.equal(nextShot(state([], 10 + 0.079 * 30, { span: 30 }), f, 700), null);
  assert.equal(nextShot(state([], 10 + 0.081 * 30, { span: 30 }), f, 700).kind, "follow");
});

test("rule 2: no new follow aim while the last follow move is easing, however far the column reads from the anchor", () => {
  const f = nextShot(state([], 10), null, 0);
  const shots = [];
  for (let now = 16; now < f.ease; now += 16) { const s = nextShot(state([], 10 + now / 1000, { leadFx: 0.9 }), f, now); if (s) shots.push(s); }
  assert.equal(shots.length, 0, "the camera is still on its way: one shot for the whole ease");
  assert.equal(nextShot(state([], 10.6, { leadFx: 0.9 }), f, f.ease).kind, "follow", "once it has arrived and the column is out of the band: one new aim");
  assert.equal(nextShot(state([], 10.6, { leadFx: 0.45 }), f, f.ease), null, "arrived and inside the band: nothing");
});

test("rule 3: spawns crossed within 0.6 s of playback are one group, framed with the parent's column and held 2.5 s from the last", () => {
  const ahead = unitsPerSec(4) * 0.6; // 2.4 units
  // d comes 4.5 s of playback after the hold ends (at 4 units a second), past the 4 s cut gap
  const ev = sorted([spawn(20, "a", 0), spawn(20 + ahead - 0.1, "b", 3), spawn(20 + ahead + 0.5, "c", 1), spawn(52, "d", 2)]);
  const r = play(ev, 19, 9500);
  const first = r.shots.find(o => o.shot.kind === "spawns");
  assert.ok(first && first.x >= 20 && first.x - 20 < 0.1, "cut to the group as the cut crosses the first spawn");
  assert.deepEqual(first.shot.members, ["a", "b"], "b is within 0.6 s of a; c is not");
  const b = first.shot.box;
  assert.ok(b.x0 < 19.5 && b.x1 > 20 + ahead - 0.1, "the box spans the parent's column and both children");
  assert.ok(b.z0 < 0 && b.z1 > 17 + 5.2 * 3, "from the main ridge's face to the farthest child's lane, padded");
  assert.ok(b.yTop >= 20 * 1.12 - 1e-9, "the parent's column top with 12% headroom");
  // c arrives during the hold: the same shot grows to take it in and holds 2.5 s from c.
  const grown = r.shots.find(o => o.shot.id === first.shot.id && o.shot.members.includes("c"));
  assert.ok(grown && grown.shot.at === first.shot.at && grown.shot.box.x1 > b.x1, "extended, same id, same start");
  assert.equal(grown.shot.hold, grown.now - first.now + 2500);
  // Nothing else moves the camera during the hold; one follow move 2.5 s after c; d gets its own group.
  const afterFirst = r.shots.filter(o => o.now > first.now && o.shot.id !== first.shot.id);
  assert.equal(afterFirst[0].shot.kind, "follow");
  assert.ok(afterFirst[0].now - grown.now >= 2500 && afterFirst[0].now - grown.now < 2500 + 20, `follow resumed ${afterFirst[0].now - grown.now} ms after c`);
  assert.deepEqual(r.shots.filter(o => o.shot.kind === "spawns" && o.shot.id !== first.shot.id).map(o => o.shot.members), [["d"]]);
});

test("rule 3: a group caps at 12 children and then frames the band of lanes it spans", () => {
  const ev = sorted(Array.from({ length: 15 }, (_, k) => spawn(20 + k * 0.1, `k${k}`, k)));
  const shot = play(ev, 19.9, 200).shots.find(o => o.shot.kind === "spawns").shot;
  assert.equal(shot.members.length, 12);
  assert.equal(shot.band, true);
  assert.ok(shot.box.z1 >= 17 + 5.2 * 14, "the box reaches the 15th child's lane");
});

test("rule 4: a report returning frames the child's end and the parent for 1.5 s, unless a spawns shot holds", () => {
  const r = play(sorted([ret(20, "a")]), 19, 3000);
  const shot = r.shots.find(o => o.shot.kind === "return");
  assert.ok(shot, "a return shot");
  assert.ok(shot.shot.box.x0 < 19 && shot.shot.box.z1 > 17, "the child's end and the parent's column");
  const next = r.shots.find(o => o.now > shot.now);
  assert.ok(next.shot.kind === "follow" && next.now - shot.now >= 1500 && next.now - shot.now < 1520);
  // Inside a spawns hold the return is skipped.
  const both = play(sorted([spawn(20, "s"), ret(21, "a")]), 19.9, 2000);
  assert.deepEqual(kinds(both).filter(k => k !== "follow"), ["spawns"]);
});

test("rule 5: while the main thread waits on its children the spawns shot holds; without one the working children are framed", () => {
  const ev = sorted([spawn(20.5, "a"), wait(20, 40, [["a", 20.5], ["b", 22]])]);
  const r = play(ev, 20.4, 7000); // 7 s at 4 units/s: the cut reaches 48, past the wait's end at 40
  const s = r.shots.find(o => o.shot.kind === "spawns");
  const next = r.shots.find(o => o.now > s.now && o.shot.id !== s.shot.id);
  assert.ok(next.x >= 40 && next.now - s.now > 2500, `held until the wait ended (x ${next.x.toFixed(2)}, ${next.now} ms)`);
  // Entering the wait before any child has started: follow until the spawn.
  assert.deepEqual(kinds(play(ev, 19.5, 400)), ["follow", "spawns"]);
  // Starting inside the wait with no spawns shot: frame the waiting parent and the children at work so far.
  assert.deepEqual(play(ev, 21, 100).shots[0].shot.members, ["a"]);
  const w = play(ev, 25, 500).shots[0].shot;
  assert.equal(w.kind, "wait");
  assert.ok(w.box.x0 <= 20.5 && w.box.x1 >= 40 && w.box.z1 >= 17 + 5.2, "both children's stretches and lanes");
  assert.deepEqual(w.members, ["a", "b"]);
  // A child spawned during that wait joins the wait's shot: the same shot, no new cut.
  const ev2 = sorted([spawn(20.5, "a"), spawn(26, "c", 2), wait(20, 40, [["a", 20.5], ["b", 22], ["c", 26]])]);
  const t = play(ev2, 25, 2000);
  assert.deepEqual(kinds(t), ["wait"]);
  assert.ok(t.shots.at(-1).shot.members.includes("c"));
});

test("rule 5: a wait shot holds 2.5 s and to the wait's end, carries on into a wait that follows closely, and skips a wait about to end", () => {
  const ev = sorted([wait(20, 24, [["a", 20]]), wait(25, 32, [["a", 20], ["b", 26]]), wait(50, 60, [["c", 50]])]);
  const r = play(ev, 21, 4000); // to 37
  const waits = r.shots.filter(o => o.shot.kind === "wait");
  assert.deepEqual([...new Set(waits.map(o => o.shot.id))], ["wait:20"], "one shot across both waits (1 unit apart, under the 2.4-unit window)");
  assert.equal(waits.at(-1).shot.x1, 32);
  assert.ok(waits.some(o => o.shot.members.includes("b")), "it follows the work into the second wait");
  const next = r.shots.find(o => o.shot.kind !== "wait");
  assert.ok(next.shot.kind === "follow" && next.x >= 32 + unitsPerSec(4) * 0.6, `follow once the break outlasts the window (x ${next.x.toFixed(2)})`);
  assert.equal(play(ev, 58.5, 300).shots[0].shot.kind, "follow", "1.5 units (0.4 s) left: not worth a cut");
});

test("rule 5 (events): a wait is a main gap over 3x the median with a subagent inside it; compactions follow the context window", () => {
  const t0 = Date.UTC(2026, 8, 25, 7), req = (t, context, w) => ({ t, tokens: { context }, ...(w ? { window: w } : {}) });
  const agent = (id, kind, extra) => ({ id, kind, name: id, requests: [], blocks: [], asks: [], compactions: [], ...extra });
  // kid's adapter recorded no returns (as Claude Code's does today); idle's layout infers its own
  const root = agent("root", "root"), kid = agent("kid", "subagent", { parentId: "root", returns: [] }), idle = agent("idle", "subagent", { parentId: "root" });
  let t = t0;
  for (let i = 0; i < 30; i++) { t += i === 10 ? 6 * 60e3 : i === 20 ? 5 * 60e3 : 60e3; root.requests.push(req(t, 1000 + i, i < 25 ? [0, i] : [20, i])); }
  // kid works inside the first long gap (after request 9); nothing works inside the second (after request 19)
  for (let k = 0; k < 4; k++) kid.requests.push(req(root.requests[9].t + 60e3 + k * 60e3, 500 + k));
  idle.requests.push(req(root.requests[29].t - 30e3, 300));
  const trace = { agents: [root, kid, idle], started: t0, ended: t };
  const L = buildLayout(trace), geom = createGeometry({ trace, layout: L });
  const ev = buildEvents(L, geom);
  for (let k = 1; k < ev.length; k++) assert.ok(ev[k].x >= ev[k - 1].x, "x-sorted");
  const waits = ev.filter(e => e.kind === "wait");
  assert.deepEqual(waits.map(w => [w.rootReq, w.children.map(c => c.id)]), [[9, ["kid"]]]);
  assert.deepEqual([waits[0].x, waits[0].x1], [geom.x(root, 9), geom.x(root, 10)]);
  const sp = ev.find(e => e.kind === "spawn" && e.childId === "kid");
  assert.deepEqual([sp.x, sp.z, sp.yTop], [geom.x(kid, 0), geom.z(kid, 0), geom.crest(kid, 0)], "at the child's first request, on its lane");
  const back = ev.filter(e => e.kind === "return").map(e => [e.childId, e.derived, e.rootReq]);
  assert.deepEqual(back, [["kid", true, 10], ["idle", false, 29]], "kid returns to request 10, the first after its last; idle's comes from the layout");
  const kr = ev.find(e => e.kind === "return" && e.childId === "kid");
  assert.deepEqual([kr.childX, kr.x], [geom.x(kid, 3), Math.max(geom.x(kid, 3), geom.x(root, 10))]);
  const c = ev.filter(e => e.kind === "compaction");
  assert.deepEqual(c.map(e => [e.agentId, e.req]), [["root", 25]], "the request whose window starts later");
  assert.equal(c[0].yTop, geom.crest(root, 24));
  // The leading column's own playhead, as the scene reads it.
  assert.equal(agentPAt(geom, kid, geom.x(kid, 1)), 1);
  assert.equal(agentPAt(geom, kid, geom.x(kid, 0) - 1), -1);
});

test("rule 6: one request before a compaction the camera pulls back over the column, until 0.5 s after the collapse", () => {
  const ev = sorted([comp(50, 50)]);
  const r = play(ev, 48.5, 1500);
  const c = r.shots.find(o => o.shot.kind === "compaction");
  assert.ok(c && c.x >= 49 && c.x < 49.1, `from P ${c?.x} (one request before)`);
  assert.ok(c.shot.box.yTop >= 30 && c.shot.box.x0 <= 49 && c.shot.box.x1 >= 50, "the whole column and the puck");
  const release = r.shots.find(o => o.shot.id === c.shot.id && o.shot.releaseAt != null);
  assert.ok(release.x >= 50 && release.shot.releaseAt === release.now + 500, "the collapse is complete: release in 0.5 s");
  const back = r.shots.find(o => o.now > release.now);
  assert.ok(back.shot.kind === "follow" && back.now >= release.now + 500 && back.now < release.now + 520);
});

test("rule 7: manual > compaction > spawns > return > follow; a hold yields only to manual or a compaction", () => {
  // a compaction cuts into a spawns hold
  const r = play(sorted([spawn(47, "a"), comp(50, 50)]), 46.9, 1000);
  assert.deepEqual(kinds(r).filter(k => k !== "follow"), ["spawns", "compaction"]);
  // manual cuts into a compaction
  const c = r.shots.find(o => o.shot.kind === "compaction").shot;
  assert.equal(nextShot(state([comp(50, 50)], 49.5, { override: true }), c, 0).kind, "manual");
  // spawns beat a return crossed on the same tick
  assert.equal(nextShot(state(sorted([spawn(20, "a"), ret(20, "b")]), 20, { prevCutX: 19.9 }), null, 0).kind, "spawns");
  // a return's hold is not cut by a spawn
  const rs = play(sorted([ret(20, "b"), spawn(21, "a")]), 19.9, 1000);
  assert.deepEqual(kinds(rs), ["follow", "return"]);
});

test("rule 8: at 16x and faster only follow and compaction", () => {
  const ev = sorted([spawn(20, "a"), ret(24, "b"), wait(30, 40, [["a", 31]]), comp(60, 60)]);
  const r = play(ev, 19, 3000, { speed: 16 }); // 16 units a second: the cut reaches 67
  assert.deepEqual([...new Set(kinds(r))], ["follow", "compaction"]);
});

test("every shot carries the zoom the director engaged at; a new engage carries the new one", () => {
  const ev = sorted([spawn(20, "a"), comp(40, 40)]);
  const r = play(ev, 19, 6000, { zoom: 5.8 }); // follow, spawns, follow, compaction
  assert.ok(new Set(kinds(r)).size >= 3);
  assert.deepEqual([...new Set(r.shots.map(o => o.shot.followZoom))], [5.8]);
  const f = nextShot(state(ev, 21, { zoom: 3.7 }), null, 0);
  assert.deepEqual([f.kind, f.followZoom], ["follow", 3.7], "re-engaged after the user zoomed: the new zoom");
  // The follow box is the bare column top (not padded); the anchor places `target`.
  assert.deepEqual([f.box.x0, f.box.x1, f.box.yTop, f.target], [21, 21, 20, [21, 20, 0]]);
});

// The app's lifecycle around followLatch: a run reads the camera's zoom only if something other than the
// director moved it since the last read.
test("the zoom a run follows at is the user's: a spawns pull-back and a pause do not change it; the user's wheel does", () => {
  let camera = 3.2, moved = true, reads = 0;
  const read = () => { reads++; return camera; };
  let latch = followLatch(null, moved, read); moved = false;
  assert.deepEqual([latch.zoom, latch.level, reads], [3.2, 2, 1], "the first run reads the user's zoom (Requests)");
  const ev = sorted([spawn(20, "a", 5)]);
  const run1 = play(ev, 19.5, 800, { zoom: latch.zoom, level: latch.level });
  assert.deepEqual(kinds(run1), ["follow", "spawns"]);
  camera = 1.5; // the spawns box pulls the camera out; the director moved it, so nothing marks it moved
  // pause, scrub a little, play again: the latch stands, and the director follows at Requests, not "none"
  latch = followLatch(latch, moved, read);
  assert.deepEqual([latch.zoom, latch.level, reads], [3.2, 2, 1]);
  const run2 = play(ev, 23, 300, { zoom: latch.zoom, level: latch.level });
  assert.deepEqual([run2.shots[0].shot.kind, run2.shots[0].shot.followZoom], ["follow", 3.2]);
  assert.equal(nextShot(state(ev, 23, { zoom: 1.5, level: 0 }), null, 0).kind, "none", "what latching the pulled-back camera would have done");
  // the user wheels in: the next run reads again
  camera = 5.8; moved = true;
  latch = followLatch(latch, moved, read); moved = false;
  assert.deepEqual([latch.zoom, latch.level, reads], [5.8, 3, 2]);
  assert.equal(play(ev, 23, 100, { zoom: latch.zoom, level: latch.level }).shots[0].shot.followZoom, 5.8);
});

// app.js tells the session's follow zoom of each camera move it makes or hears of, by source, and reads it
// as a run starts: the director's own framing and the scene's view changes are never sent; a request step
// (a pan that keeps the zoom it finds) sends "pan", a history restore "restore".
test("the follow zoom through the app's camera moves: a pull-back, a pause, a request step and Back keep it; hands, a reveal or a refit re-read", () => {
  let camera = 3.2, reads = 0;
  const fz = createFollowZoom(() => { reads++; return camera; });
  const at = l => [l.zoom, l.level];
  assert.deepEqual(at(fz.engage()), [3.2, 2], "run 1 reads the user's Requests zoom");
  camera = 1.5; // the director pulls back for a spawns group; nothing is sent for its moves
  fz.camera("pan"); // paused, a request step on the slider pans to the next request at the zoom it finds
  fz.camera("drag"); // and the user drags the map a little
  fz.camera("restore"); // and Back restores a view the director may have framed
  assert.deepEqual([...at(fz.engage()), reads], [3.2, 2, 1], "run 2 still follows at Requests, not the pulled-back 1.5 (level 0: none)");
  const run = play(sorted([spawn(30, "a")]), 25, 200, { zoom: fz.latch.zoom, level: fz.latch.level });
  assert.deepEqual([run.shots[0].shot.kind, run.shots[0].shot.followZoom], ["follow", 3.2]);
  for (const [source, zoom, level] of [["zoom", 5.8, 3], ["reveal", 3.3, 2], ["refit", 1, 0]]) {
    camera = zoom;
    fz.camera(source);
    assert.deepEqual(at(fz.engage()), [zoom, level], `${source} chooses the zoom`);
  }
  assert.equal(reads, 4);
  for (const s of ["zoom", "refit", "reveal"]) assert.equal(choosesZoom(s), true, s);
  for (const s of ["drag", "hands", "pan", "restore", "director", "view", "resize", undefined]) assert.equal(choosesZoom(s), false, String(s));
});

test("a drag during a wide shot keeps the follow zoom: Follow resumes at the zoom from before the shot", () => {
  let camera = 5.8;
  const fz = createFollowZoom(() => camera);
  assert.equal(fz.engage().zoom, 5.8, "Layers");
  camera = 1.94; // a spawns box pulled the camera out to Agents
  fz.camera("drag"); fz.camera("hands"); // the user drags the map (the app's stage listener and the scene's onUserCamera)
  assert.deepEqual([fz.engage().zoom, fz.latch.level], [5.8, 3], "f: follow at Layers again, not at the box's 1.94");
  const f = nextShot(state([], 30, { zoom: fz.latch.zoom, level: fz.latch.level }), null, 0);
  assert.deepEqual([f.kind, f.followZoom], ["follow", 5.8]);
  fz.camera("zoom"); // the user wheels: that zoom is theirs
  assert.equal(fz.engage().zoom, 1.94);
});

test("a tick with no finite cut moves nothing and leaves the next ticks sound", () => {
  const ev = sorted([spawn(20, "a")]);
  const f = nextShot(state(ev, 19.9), null, 0);
  assert.equal(nextShot(state(ev, NaN, { prevCutX: 19.9, lead: { agentId: "root", P: NaN, x: NaN, z: 0, yTop: 20 } }), f, 16), null);
  assert.equal(nextShot(state(ev, 20.05, { prevCutX: 19.9 }), f, 32).kind, "spawns", "the spawn after it is still found");
});

test("cut cadence: after a box the camera follows for at least 4 s before another cut; compactions are exempt", () => {
  // a's hold ends at 30 (x = 20 + 2.5 s at 4 units a second); the camera is back to follow there
  const ev = sorted([spawn(20, "a"), spawn(40, "b", 1), ret(44, "b"), wait(38, 45, [["b", 40]]), spawn(47, "c", 2), comp(60, 60)]);
  const r = play(ev, 19.9, 12000);
  const cuts = r.shots.filter((o, k) => !k || o.shot.id !== r.shots[k - 1].shot.id);
  const boxes = cuts.filter(o => o.shot.kind !== "follow");
  assert.deepEqual(boxes.map(o => o.shot.kind), ["spawns", "spawns", "compaction"]);
  // the follow move that ended each box (a follow re-aim within the dead band rules may come later)
  const backAfter = box => cuts.find(o => o.now > box.now && o.shot.kind === "follow");
  const back = backAfter(boxes[0]), next = boxes[1];
  assert.ok(next.now - back.now >= 4000, `the next cut came ${next.now - back.now} ms after follow resumed`);
  assert.deepEqual(next.shot.members, ["c"], "b's spawn, its wait and its return came inside the 4 s and made no cut");
  // the compaction cuts in soon after follow resumed from c's hold, gap or not
  assert.ok(boxes[2].now - backAfter(boxes[1]).now < 4000);
  // a box whose hold ends goes back to follow even when another event is due on that tick: no box-to-box cut
  const held = nextShot(state([spawn(20, "a")], 20, { prevCutX: 19.9 }), null, 0);
  assert.equal(held.kind, "spawns");
  const end = nextShot(state([spawn(20, "a"), ret(30.05, "b")], 30.1, { prevCutX: 30 }), held, 2600);
  assert.equal(end.kind, "follow");
  // one move back to follow after each hold: no follow re-aims while it eases
  assert.ok(r.shots.every((o, k) => k === 0 || o.shot.kind !== "follow" || r.shots[k - 1].shot.kind !== "follow" || o.now - r.shots[k - 1].now >= 600));
});

test("rule 9: the same inputs give the same shots", () => {
  // spaced for the 4 s cut gap at 4 units a second (16 units of follow after each box)
  const ev = sorted([spawn(20, "a", 0), spawn(20.5, "b", 1), ret(47, "a"), wait(70, 76, [["b", 70.5]]), comp(90, 90), spawn(110, "c", 2)]);
  const a = play(ev, 18, 24000), b = play(ev, 18, 24000);
  assert.deepEqual(a.shots, b.shots);
  assert.ok(new Set(kinds(a)).size >= 5, `a varied run: ${[...new Set(kinds(a))]}`);
  assert.deepEqual(DIRECTOR.anchor, [0.42, 0.35]);
});
