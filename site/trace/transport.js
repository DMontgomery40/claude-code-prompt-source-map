// The playback transport: play or pause, a scrub bar over the session's compressed time, the speed,
// and a readout of where the playhead is. It owns the one animation-frame loop that advances the
// clock (playback.js) while playing, and reports every change through onPlayhead so the app can
// hand it to the scene. Paused, nothing runs. The playhead never touches the app's view state.
import { el, fmtInt, fmtClock } from "./panels.js";
import { COMPLETE } from "./playback.js";

// "req 1,234 · Sep 25 · 3:02 am": the request the playhead is in and the session time it has reached.
export function playheadLabel(pb, P = pb.P) {
  const t = pb.timeAt(P);
  const day = new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `req ${fmtInt(Math.floor(P) + 1)} · ${day} · ${fmtClock(t)}`;
}

// Where a focused request puts the playhead within it: i + FOCUS shows request i complete (playback.js
// COMPLETE, which is also where the session ends).
export const FOCUS = COMPLETE;

// Where focusing request i puts the playhead: i + FOCUS on the root. For any other agent, the root-space
// P whose cut lands at that agent's own i + FOCUS in compressed-time x (a subagent's whole run can sit
// between two root requests, so this is fractional, never rounded; its last request is complete at its
// own x). The root's last request complete is the end. Null when unknown.
export function playheadForRequest(pb, layout, agentId, i) {
  const agent = layout.byId.get(agentId), r = agent?.requests[i];
  if (!pb || !r) return null;
  if (agent === layout.root) return i + FOCUS;
  const next = agent.requests[i + 1], x = layout.X(r.t);
  return pb.PAtX(next ? x + (layout.X(next.t) - x) * FOCUS : x);
}

// `,` and `.`: the previous or next request, complete (floor(P) -/+ 1, plus FOCUS), so the readout's
// request number moves by exactly one. Never below FOCUS (request 0 stays complete), never past the end
// (the last request complete).
export function focusStep(P, d, n) {
  return Math.min(n - 1 + FOCUS, Math.max(FOCUS, Math.floor(P) + (d < 0 ? -1 : 1) + FOCUS));
}

// The next speed of the button's cycle (the keys' faster and slower stop at the ends instead).
export function nextSpeed(pb) {
  const list = pb.speeds;
  return list.find(s => s > pb.speed) ?? list[0];
}

// host: the #playback element. onPlayhead({ P, playing }) runs on every change of the playhead or its
// playing state.
// onStart() runs as playback starts, before the clock moves and the first push. onFollow('auto'|'manual') runs when the
// Follow chip's state changes.
export function createTransport(host, { onPlayhead = () => {}, onStart = () => {}, onFollow = () => {}, raf = f => requestAnimationFrame(f), caf = id => cancelAnimationFrame(id), now = () => performance.now(), maxDt = 100 } = {}) {
  let pb = null, frame = 0, last = 0, label = "";
  // Follow: the director moves the camera while playing unless the user turned Follow off (off) or moved
  // the camera during this run (held). forced: the user asked for Follow, so it follows at the overview too.
  let off = false, held = false, forced = false;
  const play = el("button", { type: "button", class: "play", "aria-pressed": "false", "aria-label": "Play", title: "Play · Space" }, el("i", { "aria-hidden": "true" }));
  const scrub = el("input", { type: "range", class: "scrub", min: "0", max: "1", step: "0.0005", value: "1", "aria-label": "Session time" });
  const readout = el("output", { class: "readout", "aria-live": "off" });
  const speed = el("button", { type: "button", class: "speed", title: "Speed · < >" });
  const followState = el("span", { class: "state", text: "auto" });
  const follow = el("button", { type: "button", class: "follow", "aria-pressed": "true", title: "The camera follows the playhead · f" }, "Follow ", followState);
  host.replaceChildren(play, scrub, readout, speed, follow);
  host.setAttribute("data-playing", "false");

  play.addEventListener("click", () => api.toggle());
  // Scrubbing pauses: the thumb follows the pointer, not the clock.
  scrub.addEventListener("pointerdown", () => { if (pb?.playing) api.pause(); });
  scrub.addEventListener("input", () => { if (pb) api.seek(pb.PAtX(Number(scrub.value))); });
  speed.addEventListener("click", () => { if (pb) api.setSpeed(nextSpeed(pb)); });
  follow.addEventListener("click", () => api.toggleFollow());

  function push() {
    if (pb) onPlayhead({ P: pb.P, playing: pb.playing });
  }
  function stop() { if (frame) caf(frame); frame = 0; }
  function loop(t) {
    frame = 0;
    if (!pb?.playing) return;
    const dt = Math.min(maxDt, t - last);
    last = t;
    pb.tick(dt);
    push();
    sync();
    if (pb.playing) frame = raf(loop);
  }
  function run() { if (pb?.playing && !frame) { last = now(); frame = raf(loop); } }

  // Redraws the controls from the clock. The readout and its spoken value change only when the text does.
  function sync() {
    if (!pb) return;
    const on = pb.playing, x = pb.xAt(pb.P);
    host.setAttribute("data-playing", String(on));
    play.setAttribute("aria-pressed", String(on));
    play.setAttribute("aria-label", on ? "Pause" : "Play");
    play.title = `${on ? "Pause" : "Play"} · Space`;
    scrub.value = String(x);
    scrub.style.setProperty("--progress", `${(x * 100).toFixed(2)}%`);
    const text = playheadLabel(pb);
    if (text !== label) {
      label = text;
      readout.textContent = text;
      scrub.setAttribute("aria-valuetext", text);
    }
    const s = `${pb.speed}×`;
    if (speed.textContent !== s) {
      speed.textContent = s;
      speed.setAttribute("aria-label", `Speed ${s}: ${pb.speed} requests a second`);
    }
    syncFollow();
  }
  function syncFollow() {
    const auto = !off && !held;
    follow.setAttribute("aria-pressed", String(auto));
    if (followState.textContent !== (auto ? "auto" : "manual")) followState.textContent = auto ? "auto" : "manual";
  }

  const api = {
    // A new session's clock (or null), with Follow back to auto. Nothing is pushed: the scene starts from the same place.
    load(next) { stop(); pb = next || null; label = ""; off = held = forced = false; sync(); },
    get playback() { return pb; },
    get playing() { return !!pb?.playing; },
    toggle() { if (pb?.playing) api.pause(); else api.play(); },
    // Starting a run follows again, unless the user turned Follow off. onStart runs before the clock moves,
    // so a history entry it pushes keeps the playhead of the view being left, even when a play at the end
    // starts over from request 1 (a clock of one request never plays).
    play() {
      if (!pb) return;
      const was = pb.playing;
      if (!was && pb.n >= 2) { held = false; onStart(); }
      pb.play();
      if (pb.playing) run();
      push(); sync();
    },
    pause() { if (!pb) return; const was = pb.playing; pb.pause(); stop(); if (was) push(); sync(); },
    // Jump to P and stay paused (scrubbing, focusing a request, history).
    seek(P) { if (!pb) return; pb.pause(); stop(); pb.setP(P); push(); sync(); },
    step(d) { if (pb) api.seek(focusStep(pb.P, d, pb.n)); },
    setSpeed(v) { if (!pb) return; pb.setSpeed(v); sync(); },
    faster() { if (!pb) return; pb.faster(); sync(); },
    slower() { if (!pb) return; pb.slower(); sync(); },
    // The Follow chip and the f key: back to auto (asked for, so the overview follows too), or off.
    get follow() { return off || held ? "manual" : "auto"; },
    get forced() { return forced && !off && !held; },
    toggleFollow() {
      if (off || held) { off = held = false; forced = true; } else off = true;
      syncFollow();
      onFollow(api.follow);
    },
    // The user moved the camera: while playing, the director lets go until Follow is asked for again.
    // Either way an earlier "follow at the overview too" no longer holds.
    userCamera() {
      forced = false;
      if (!pb?.playing || off || held) return;
      held = true;
      syncFollow();
      onFollow("manual");
    },
    sync,
    controls: { play, scrub, readout, speed, follow }
  };
  return api;
}
