// The playback director (director.js): rules 1-9 of the Task 10 brief on tiny synthetic event lists, and
// the event list built from a real layout and the landscape's own placement.
import { test } from "node:test";
import assert from "node:assert/strict";

const { DIRECTOR, buildEvents, nextShot, agentPAt } = await import("../director.js");
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
  assert.equal(nextShot(state([], 11, { leadFx: 0.42 + 0.079 }), f, 16), null, "inside the dead band");
  assert.equal(nextShot(state([], 11, { leadFx: 0.42 - 0.079 }), f, 16), null);
  const moved = nextShot(state([], 11, { leadFx: 0.42 + 0.081 }), f, 16);
  assert.deepEqual([moved.kind, moved.target[0]], ["follow", 11]);
  // Without the column's screen position: drift in world units over the width seen at the column.
  assert.equal(nextShot(state([], 10 + 0.079 * 30, { span: 30 }), f, 16), null);
  assert.equal(nextShot(state([], 10 + 0.081 * 30, { span: 30 }), f, 16).kind, "follow");
});

test("rule 3: spawns crossed within 0.6 s of playback are one group, framed with the parent's column and held 2.5 s", () => {
  const ahead = unitsPerSec(4) * 0.6; // 2.4 units
  const ev = sorted([spawn(20, "a", 0), spawn(20 + ahead - 0.1, "b", 3), spawn(20 + ahead + 0.5, "c", 1), spawn(40, "d", 2)]);
  const r = play(ev, 19, 7000);
  const first = r.shots.find(o => o.shot.kind === "spawns");
  assert.ok(first && first.x >= 20 && first.x - 20 < 0.1, "cut to the group as the cut crosses the first spawn");
  assert.deepEqual(first.shot.members, ["a", "b"], "b is within 0.6 s of a; c is not");
  const b = first.shot.box;
  assert.ok(b.x0 < 19.5 && b.x1 > 20 + ahead - 0.1, "the box spans the parent's column and both children");
  assert.ok(b.z0 < 0 && b.z1 > 17 + 5.2 * 3, "from the main ridge's face to the farthest child's lane, padded");
  assert.ok(b.yTop >= 20 * 1.12 - 1e-9, "the parent's column top with 12% headroom");
  // c arrives during the hold: the same shot grows to take it in.
  const grown = r.shots.find(o => o.shot.id === first.shot.id && o.shot.members.includes("c"));
  assert.ok(grown && grown.shot.at === first.shot.at && grown.shot.box.x1 > b.x1, "extended, same id, same start");
  // Nothing else moves the camera during the hold; follow resumes after 2.5 s; d gets its own group.
  const afterFirst = r.shots.filter(o => o.now > first.now && o.shot.id !== first.shot.id);
  assert.equal(afterFirst[0].shot.kind, "follow");
  assert.ok(afterFirst[0].now - first.now >= 2500 && afterFirst[0].now - first.now < 2500 + 20, `follow resumed at ${afterFirst[0].now - first.now} ms`);
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
  // A spawn during that wait takes over, and holds to the wait's end.
  const t = play(sorted([...ev, spawn(26, "c", 2)]), 25, 2000);
  assert.deepEqual(kinds(t), ["wait", "spawns"]);
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

test("rule 9: the same inputs give the same shots", () => {
  const ev = sorted([spawn(20, "a", 0), spawn(20.5, "b", 1), ret(31, "a"), wait(38, 44, [["b", 38.5]]), comp(47, 47), spawn(53, "c", 2)]);
  const a = play(ev, 18, 9000), b = play(ev, 18, 9000);
  assert.deepEqual(a.shots, b.shots);
  assert.ok(new Set(kinds(a)).size >= 5, `a varied run: ${[...new Set(kinds(a))]}`);
  assert.deepEqual(DIRECTOR.anchor, [0.42, 0.35]);
});
