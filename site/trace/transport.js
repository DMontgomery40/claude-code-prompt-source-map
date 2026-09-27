// The playback transport: play or pause, a scrub bar over the session's compressed time, the speed,
// and a readout of where the playhead is. It owns the one animation-frame loop that advances the
// clock (playback.js) while playing, and reports every change through onPlayhead so the app can
// hand it to the scene. Paused, nothing runs. The playhead never touches the app's view state.
import { el, fmtInt, fmtClock } from "./panels.js";

// "req 1,234 · Sep 25 · 3:02 am": the request the playhead is in and the session time it has reached.
export function playheadLabel(pb, P = pb.P) {
  const t = pb.timeAt(P);
  const day = new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `req ${fmtInt(Math.floor(P) + 1)} · ${day} · ${fmtClock(t)}`;
}

// Where focusing a request puts the playhead: request i itself on the root; for any other agent the
// root-space P whose cut lands exactly on that request's compressed-time x (a subagent's whole run
// can sit between two root requests, so this is fractional, never rounded). Null when unknown.
export function playheadForRequest(pb, layout, agentId, i) {
  const agent = layout.byId.get(agentId), r = agent?.requests[i];
  if (!pb || !r) return null;
  return agent === layout.root ? i : pb.PAtX(layout.X(r.t));
}

// The next speed of the button's cycle (the keys' faster and slower stop at the ends instead).
export function nextSpeed(pb) {
  const list = pb.speeds;
  return list.find(s => s > pb.speed) ?? list[0];
}

// host: the #playback element. onPlayhead({ P, playing, sweep }) runs on every change of the playhead
// or its playing state; sweep is the progress through the current request while playing, else null.
export function createTransport(host, { onPlayhead = () => {}, raf = f => requestAnimationFrame(f), caf = id => cancelAnimationFrame(id), now = () => performance.now(), maxDt = 100 } = {}) {
  let pb = null, frame = 0, last = 0, label = "";
  const play = el("button", { type: "button", class: "play", "aria-pressed": "false", "aria-label": "Play", title: "Play · Space" }, el("i", { "aria-hidden": "true" }));
  const scrub = el("input", { type: "range", class: "scrub", min: "0", max: "1", step: "0.0005", value: "1", "aria-label": "Session time" });
  const readout = el("output", { class: "readout", "aria-live": "off" });
  const speed = el("button", { type: "button", class: "speed", title: "Speed · < >" });
  host.replaceChildren(play, scrub, readout, speed);
  host.setAttribute("data-playing", "false");

  play.addEventListener("click", () => api.toggle());
  // Scrubbing pauses: the thumb follows the pointer, not the clock.
  scrub.addEventListener("pointerdown", () => { if (pb?.playing) api.pause(); });
  scrub.addEventListener("input", () => { if (pb) api.seek(pb.PAtX(Number(scrub.value))); });
  speed.addEventListener("click", () => { if (pb) api.setSpeed(nextSpeed(pb)); });

  function push() {
    if (pb) onPlayhead({ P: pb.P, playing: pb.playing, sweep: pb.playing ? pb.P - Math.floor(pb.P) : null });
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
  }

  const api = {
    // A new session's clock (or null). Nothing is pushed: the scene starts from the same place.
    load(next) { stop(); pb = next || null; label = ""; sync(); },
    get playback() { return pb; },
    get playing() { return !!pb?.playing; },
    toggle() { if (pb?.playing) api.pause(); else api.play(); },
    play() { if (!pb) return; pb.play(); if (pb.playing) run(); push(); sync(); },
    pause() { if (!pb) return; const was = pb.playing; pb.pause(); stop(); if (was) push(); sync(); },
    // Jump to P and stay paused (scrubbing, focusing a request, history).
    seek(P) { if (!pb) return; pb.pause(); stop(); pb.setP(P); push(); sync(); },
    step(d) { if (!pb) return; pb.step(d); stop(); push(); sync(); },
    setSpeed(v) { if (!pb) return; pb.setSpeed(v); sync(); },
    faster() { if (!pb) return; pb.faster(); sync(); },
    slower() { if (!pb) return; pb.slower(); sync(); },
    sync,
    controls: { play, scrub, readout, speed }
  };
  return api;
}
