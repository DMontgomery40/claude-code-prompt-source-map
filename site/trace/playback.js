// Session playback transport: a pure clock over root request space.
// P is a float request index in [0, n - 1]; integer P is request i, fractions interpolate to the next.
// Playback advances in compressed-time x (the layout's X), so the playhead crosses the ruler at a
// constant screen speed and idle gaps never stall it. Requests that share a timestamp share an x;
// they are still crossed one by one, in request order. No DOM, no events: tick() reports what happened.

const SNAP = 1e-12; // x distance treated as landing exactly on a request

export function createPlayback({ times, X, speeds = [1, 2, 4, 8, 16], speed = 4, direction = 1 }) {
  const n = times.length;
  const ts = new Float64Array(n), xs = new Float64Array(n);
  // Running maxima keep both axes monotone, so every inverse below is a plain search.
  for (let i = 0; i < n; i++) {
    ts[i] = i ? Math.max(ts[i - 1], times[i]) : times[i];
    xs[i] = i ? Math.max(xs[i - 1], X(times[i])) : X(times[i]);
  }
  const last = Math.max(0, n - 1);
  const list = [...speeds].sort((a, b) => a - b);
  let P = 0, playing = false, dir = direction < 0 ? -1 : 1;
  let rate = speed > 0 && Number.isFinite(speed) ? speed : 4;
  let x = n ? xs[0] : 0; // the clock's own position; P is derived from it while playing

  const clampP = v => Math.min(last, Math.max(0, v));
  const lerp = (arr, v) => {
    if (!n) return 0;
    const p = clampP(v), i = Math.min(Math.floor(p), last), f = p - i;
    return f && i < last ? arr[i] + (arr[i + 1] - arr[i]) * f : arr[i];
  };
  // Inverse of lerp: the first request at v, else the fractional P inside the segment holding v.
  const invert = (arr, v) => {
    if (n < 2 || !(v > arr[0])) return 0;
    if (v >= arr[last]) { let j = last; while (j > 0 && arr[j - 1] === arr[last]) j--; return j; }
    let lo = 0, hi = last; // smallest j with arr[j] >= v lies in (lo, hi]
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] >= v) hi = m; else lo = m; }
    if (arr[hi] === v) return hi;
    return lo + (v - arr[lo]) / (arr[hi] - arr[lo]);
  };
  const xAt = v => lerp(xs, v);
  const setP = v => { if (Number.isFinite(v)) { P = clampP(v); x = xAt(P); } };

  // Integers passed moving from a to b, in traversal order: strictly between, plus b when b is one.
  function crossings(a, b) {
    const out = [];
    if (b > a) for (let k = Math.floor(a) + 1; k <= b; k++) out.push(k);
    else if (b < a) for (let k = Math.ceil(a) - 1; k >= b; k--) out.push(k);
    return out;
  }

  function tick(dtMs) {
    if (!playing || n < 2 || !(dtMs > 0)) return { P, crossed: [] };
    const from = P;
    x += dir * rate / (n - 1) * dtMs / 1000;
    if (dir > 0 && x >= xs[last] - SNAP) { x = xs[last]; P = last; playing = false; }
    else if (dir < 0 && x <= xs[0] + SNAP) { x = xs[0]; P = 0; playing = false; }
    else {
      P = invert(xs, x);
      const k = Math.round(P);
      if (Math.abs(xs[k] - x) <= SNAP && Math.abs(P - k) < 1e-6) P = k; // float noise near a request
      // Leaving a run of equal-x requests forward must not jump back to the run's first member.
      if (dir > 0 && P < from) P = from;
    }
    return { P, crossed: crossings(from, P) };
  }

  const atBoundary = () => (dir > 0 ? P >= last : P <= 0);
  const pb = {
    get n() { return n; },
    get P() { return P; },
    get atEnd() { return n > 0 && P >= last; },
    get playing() { return playing; },
    get speed() { return rate; },
    get speeds() { return list.slice(); },
    get direction() { return dir; },
    set direction(d) { dir = d < 0 ? -1 : 1; },
    setP,
    // Play from the far end when already parked at the boundary in the direction of travel.
    play() { if (n < 2) return; if (atBoundary()) setP(dir > 0 ? 0 : last); playing = true; },
    pause() { playing = false; },
    toggle() { if (playing) pb.pause(); else pb.play(); },
    setSpeed(v) { if (v > 0 && Number.isFinite(v)) rate = v; },
    faster() { const s = list.find(s => s > rate); if (s != null) rate = s; },
    slower() { const s = list.findLast(s => s < rate); if (s != null) rate = s; },
    step(d) { playing = false; if (n) setP(d < 0 ? Math.ceil(P) - 1 : Math.floor(P) + 1); return P; },
    tick,
    xAt,
    timeAt: v => lerp(ts, v),
    PAtX: v => invert(xs, v),
    PAtTime: t => invert(ts, t)
  };
  return pb;
}
