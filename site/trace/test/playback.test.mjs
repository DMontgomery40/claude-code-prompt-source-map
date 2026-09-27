import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayback } from '../playback.js';
import { buildLayout } from '../minimap.js';

const T0 = 1.75e12; // realistic epoch milliseconds
const sec = s => T0 + s * 1000;

// Deterministic PRNG so failures reproduce.
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
}

// Real compressed time axis from the shared layout.
function layoutFor(times) {
  const L = buildLayout({ agents: [{ id: 'root', kind: 'root', requests: times.map(t => ({ t, tokens: { context: 0 } })) }] });
  return L.X;
}

// Irregular strictly increasing request times with a few idle gaps longer than 20 minutes.
function irregularTimes(n, r) {
  const out = [];
  let t = T0;
  for (let i = 0; i < n; i++) {
    out.push(t);
    t += 2000 + Math.floor(r() * 90_000) + (i % 17 === 16 ? 3 * 3600e3 : 0);
  }
  return out;
}

const tickFor = (pb, ms, frames = 1) => {
  const crossed = [];
  let res;
  for (let k = 0; k < frames; k++) { res = pb.tick(ms / frames); crossed.push(...res.crossed); }
  return { P: res.P, crossed };
};

test('xAt and PAtX round trip within 1e-9 for 100 random P', () => {
  const r = rng(11);
  const times = irregularTimes(60, r);
  const pb = createPlayback({ times, X: layoutFor(times) });
  for (let k = 0; k < 100; k++) {
    const P = r() * (pb.n - 1);
    assert.ok(Math.abs(pb.PAtX(pb.xAt(P)) - P) < 1e-9, `P=${P}`);
  }
});

test('timeAt and PAtTime round trip within 1e-9 for 100 random P', () => {
  // Session-relative milliseconds: the absolute epoch loses precision in the last bits.
  const r = rng(12);
  const times = irregularTimes(60, r).map(t => t - T0);
  const pb = createPlayback({ times, X: t => t / times.at(-1) });
  for (let k = 0; k < 100; k++) {
    const P = r() * (pb.n - 1);
    assert.ok(Math.abs(pb.PAtTime(pb.timeAt(P)) - P) < 1e-9, `P=${P}`);
  }
});

test('timeAt and PAtTime round trip to well under a millisecond with epoch timestamps', () => {
  const r = rng(13);
  const times = irregularTimes(60, r);
  const pb = createPlayback({ times, X: layoutFor(times) });
  for (let k = 0; k < 100; k++) {
    const P = r() * (pb.n - 1);
    const t = pb.timeAt(P);
    assert.ok(Math.abs(pb.timeAt(pb.PAtTime(t)) - t) < 0.01, `P=${P}`);
    assert.ok(Math.abs(pb.PAtTime(t) - P) < 1e-6, `P=${P}`);
  }
});

test('integer P maps exactly to X(times[i]) and times[i]', () => {
  const times = [sec(0), sec(5), sec(9), sec(30)];
  const X = layoutFor(times);
  const pb = createPlayback({ times, X });
  times.forEach((t, i) => {
    assert.equal(pb.xAt(i), X(t));
    assert.equal(pb.timeAt(i), t);
    assert.equal(pb.PAtX(X(t)), i);
    assert.equal(pb.PAtTime(t), i);
  });
  assert.equal(pb.xAt(1.5), (X(times[1]) + X(times[2])) / 2);
  assert.equal(pb.PAtX(-1), 0);
  assert.equal(pb.PAtX(2), 3);
  assert.equal(pb.PAtTime(0), 0);
  assert.equal(pb.PAtTime(sec(9999)), 3);
});

test('1 s at speed 4 advances x by exactly 4/(n-1) on both sides of a squeezed 3-hour gap', () => {
  const pre = Array.from({ length: 20 }, (_, i) => sec(i * 3));
  const post = Array.from({ length: 20 }, (_, i) => sec(3 * 3600 + 60 + i * 3));
  const times = [...pre, ...post];
  const X = layoutFor(times);
  // The gap really is squeezed: its x span is far smaller than its share of wall time.
  const gapX = X(post[0]) - X(pre.at(-1));
  assert.ok(gapX < 0.05, `gap x ${gapX}`);
  const pb = createPlayback({ times, X, speed: 4 });
  const want = 4 / (pb.n - 1);
  for (const startP of [2, 17.5, 19, 25]) { // before, straddling, at, and after the gap
    pb.setP(startP);
    const x0 = pb.xAt(pb.P);
    pb.play();
    tickFor(pb, 1000, 60);
    assert.ok(Math.abs(pb.xAt(pb.P) - x0 - want) < 1e-12, `start ${startP}: dx ${pb.xAt(pb.P) - x0} want ${want}`);
    pb.pause();
  }
});

test('speed is in mean-pitch requests per second', () => {
  const times = Array.from({ length: 11 }, (_, i) => sec(i * 10)); // uniform pitch
  const pb = createPlayback({ times, X: layoutFor(times), speed: 2 });
  pb.play();
  pb.tick(1000);
  assert.ok(Math.abs(pb.P - 2) < 1e-9, `P ${pb.P}`);
});

test('crossing from 3.2 to 5.7 reports [4, 5]; backwards reports [5, 4]', () => {
  const times = Array.from({ length: 10 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times), speed: 2.5 });
  pb.setP(3.2);
  pb.play();
  let res = pb.tick(1000);
  assert.ok(Math.abs(res.P - 5.7) < 1e-9, `P ${res.P}`);
  assert.deepEqual(res.crossed, [4, 5]);

  assert.equal(pb.direction, 1);
  pb.direction = -1;
  pb.setP(5.7);
  pb.play();
  res = pb.tick(1000);
  assert.ok(Math.abs(res.P - 3.2) < 1e-9, `P ${res.P}`);
  assert.deepEqual(res.crossed, [5, 4]);
});

test('landing exactly on an integer reports it; leaving an integer does not', () => {
  const times = Array.from({ length: 10 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: t => (t - times[0]) / (times.at(-1) - times[0]), speed: 2 });
  pb.setP(3);
  pb.play();
  let res = pb.tick(1000);
  assert.equal(res.P, 5);
  assert.deepEqual(res.crossed, [4, 5]);
  pb.direction = -1;
  res = pb.tick(1000);
  assert.equal(res.P, 3);
  assert.deepEqual(res.crossed, [4, 3]);
});

test('reaching the end reports the last request, clamps, pauses and sets atEnd', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times), speed: 16 });
  pb.setP(3.5);
  pb.play();
  const res = pb.tick(1000);
  assert.equal(res.P, 5);
  assert.deepEqual(res.crossed, [4, 5]);
  assert.equal(pb.playing, false);
  assert.equal(pb.atEnd, true);
  assert.deepEqual(pb.tick(1000), { P: 5, crossed: [] });
  // Playing again from the end restarts from the first request.
  pb.play();
  assert.equal(pb.P, 0);
  assert.equal(pb.playing, true);
  assert.equal(pb.atEnd, false);
});

test('running backwards to the start clamps at 0 and pauses', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times), speed: 16 });
  pb.direction = -1;
  pb.setP(1.5);
  pb.play();
  const res = pb.tick(1000);
  assert.equal(res.P, 0);
  assert.deepEqual(res.crossed, [1, 0]);
  assert.equal(pb.playing, false);
});

test('tick while paused does not move; bad dt is ignored', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times) });
  pb.setP(2.5);
  assert.deepEqual(pb.tick(1000), { P: 2.5, crossed: [] });
  pb.play();
  assert.deepEqual(pb.tick(NaN), { P: 2.5, crossed: [] });
  assert.deepEqual(pb.tick(-50), { P: 2.5, crossed: [] });
});

test('step moves to the next or previous integer and pauses', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times) });
  pb.setP(2.4);
  pb.play();
  pb.step(1);
  assert.equal(pb.P, 3);
  assert.equal(pb.playing, false);
  pb.step(1);
  assert.equal(pb.P, 4);
  pb.setP(2.4);
  pb.step(-1);
  assert.equal(pb.P, 2);
  pb.step(-1);
  assert.equal(pb.P, 1);
  pb.setP(0);
  pb.step(-1);
  assert.equal(pb.P, 0);
  pb.setP(5);
  pb.step(1);
  assert.equal(pb.P, 5);
});

test('setP clamps to [0, n-1], ignores non-finite values and never plays', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times) });
  pb.setP(-3);
  assert.equal(pb.P, 0);
  pb.setP(99);
  assert.equal(pb.P, 5);
  assert.equal(pb.atEnd, true);
  pb.setP(NaN);
  assert.equal(pb.P, 5);
  assert.equal(pb.playing, false);
  pb.toggle();
  assert.equal(pb.playing, true);
  pb.toggle();
  assert.equal(pb.playing, false);
});

test('speeds: default 4, faster/slower walk the list and clamp at its ends', () => {
  const times = Array.from({ length: 6 }, (_, i) => sec(i * 10));
  const pb = createPlayback({ times, X: layoutFor(times) });
  assert.equal(pb.speed, 4);
  pb.faster(); assert.equal(pb.speed, 8);
  pb.faster(); assert.equal(pb.speed, 16);
  pb.faster(); assert.equal(pb.speed, 16);
  pb.slower(); pb.slower(); pb.slower(); assert.equal(pb.speed, 2);
  pb.slower(); pb.slower(); assert.equal(pb.speed, 1);
  pb.setSpeed(3);
  assert.equal(pb.speed, 3);
  pb.faster(); assert.equal(pb.speed, 4);
  pb.setSpeed(3);
  pb.slower(); assert.equal(pb.speed, 2);
  pb.setSpeed(0); assert.equal(pb.speed, 2);
  pb.setSpeed(-4); assert.equal(pb.speed, 2);
});

test('a run of three equal timestamps: x is monotone, PAtX picks the first, playback crosses all three in order', () => {
  const times = [sec(0), sec(10), sec(20), sec(20), sec(20), sec(30), sec(40)];
  const X = layoutFor(times);
  const pb = createPlayback({ times, X, speed: 1 });
  let prev = -Infinity;
  for (let P = 0; P <= pb.n - 1; P += 0.05) {
    const x = pb.xAt(P);
    assert.ok(x >= prev, `xAt not monotone at P=${P}`);
    prev = x;
  }
  assert.equal(pb.xAt(2), pb.xAt(3));
  assert.equal(pb.xAt(3), pb.xAt(4));
  assert.equal(pb.PAtX(X(sec(20))), 2);
  assert.equal(pb.PAtTime(sec(20)), 2);
  assert.equal(pb.timeAt(3.5), sec(20));

  pb.setP(1.5);
  pb.play();
  const fwd = tickFor(pb, 1000, 10);
  assert.deepEqual(fwd.crossed, [2, 3, 4]);
  assert.ok(pb.P > 4 && pb.P < 5, `P ${pb.P}`);

  pb.direction = -1;
  const back = tickFor(pb, 1000, 10);
  assert.deepEqual(back.crossed, [4, 3, 2]);
  assert.ok(Math.abs(pb.P - 1.5) < 1e-9, `P ${pb.P}`);

  // Starting mid-run and moving forward crosses the rest of the run, not the ones already passed.
  pb.direction = 1;
  pb.setP(3);
  pb.play();
  assert.deepEqual(pb.tick(10).crossed, [4]);
});

test('a session whose requests all share one timestamp still plays to the end', () => {
  const times = [sec(5), sec(5), sec(5)];
  const pb = createPlayback({ times, X: () => 0.5 });
  pb.play();
  const res = pb.tick(16);
  assert.equal(res.P, 2);
  assert.deepEqual(res.crossed, [1, 2]);
  assert.equal(pb.atEnd, true);
  assert.equal(pb.playing, false);
});

test('empty and single-request sessions are inert', () => {
  for (const times of [[], [sec(1)]]) {
    const pb = createPlayback({ times, X: () => 0 });
    assert.equal(pb.n, times.length);
    assert.equal(pb.P, 0);
    pb.play();
    assert.deepEqual(pb.tick(1000), { P: 0, crossed: [] });
    assert.equal(pb.playing, false);
    pb.step(1);
    assert.equal(pb.P, 0);
    assert.ok(Number.isFinite(pb.PAtX(0.3)));
    assert.ok(Number.isFinite(pb.PAtTime(sec(3))));
  }
});
