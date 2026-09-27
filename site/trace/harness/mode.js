// The harness mode's glue: one more Trace view beside 3D and 2D. app.js owns the mode (setMode) and calls
// show / hide / sync / playhead; this module owns the view (view.js) and the model the worker builds
// (pieces.js, computed lazily the first time the mode opens, cached per loaded trace).
//   Trace -> layer: the shared selection (S.level / S.agentId / S.reqIdx / S.block) and the playhead time.
//   Layer -> Trace: a picked piece opens that delivery through A.openBlockAt, the call the panels use, so
//                   the existing reader, crumbs, request nav and playhead all follow.
export function createHarnessMode({ S, A, transport, request }) {
  const host = document.querySelector("#harness");
  const status = document.createElement("div");
  status.className = "harness-status";
  status.setAttribute("role", "status");
  host.append(status);
  let view = null, viewFailed = null;
  let modelFor = null, loading = null;

  const say = text => { status.textContent = text || ""; status.hidden = !text; };

  async function ensureView() {
    if (view || viewFailed) return view;
    try {
      const { createHarnessView } = await import("./view.js");
      view = createHarnessView({ container: host, onPick: (agentId, block) => A.openBlockAt(agentId, block) });
    } catch (e) {
      viewFailed = e;
      console.warn("Harness layer unavailable", e);
    }
    return view;
  }

  function ensureModel() {
    const trace = S.trace;
    if (modelFor === trace) return Promise.resolve(true);
    loading ||= request(p => say(p.total ? `Reading the harness text: ${Math.round(100 * p.done / p.total)}%` : "Reading the harness text…"))
      .then(model => {
        loading = null;
        if (S.trace !== trace) return false;          // another session was loaded meanwhile
        view.setModel(model, trace);
        modelFor = trace;
        say("");
        return true;
      }, err => {
        loading = null;
        say(`The harness layer couldn't read this session: ${err.message || err}`);
        return false;
      });
    return loading;
  }

  // The layer's own view bar sits just under Trace's crumbs, wherever they land (the header's height varies).
  function place() {
    const crumbs = document.querySelector("#crumbs"), hv = host.querySelector(".hv");
    if (!crumbs || !hv) return;
    const top = Math.round(crumbs.getBoundingClientRect().bottom + 10);
    hv.style.setProperty("--hv-top", `${Math.max(120, top)}px`);
  }
  addEventListener("resize", () => { if (S.mode === "harness") place(); });

  async function show() {
    host.hidden = false;
    say("Opening the harness layer…");
    if (!(await ensureView())) {
      say("The harness layer needs WebGL, which this browser doesn't offer. The landscape's 2D view and the sidebar still work.");
      return;
    }
    if (S.mode !== "harness") return;                  // left again while loading
    view.show();
    place();
    if (await ensureModel()) sync(true);
  }

  function hide() {
    host.hidden = true;
    view?.hide();
  }

  let last = "";
  function sync(force) {
    if (S.mode !== "harness" || !view || modelFor !== S.trace) return;
    const key = `${S.level}|${S.agentId}|${S.reqIdx}|${S.block}`;
    if (!force && key === last) return;
    last = key;
    place();
    view.sync({ level: S.level, agentId: S.agentId, reqIdx: S.reqIdx, block: S.block });
  }

  function playhead(p) {
    if (S.mode !== "harness" || !view || modelFor !== S.trace || !transport?.playback) return;
    let t = transport.playback.timeAt(p.P);
    if (t > 1e11) t -= S.trace.started;                 // absolute ms -> ms since the session started
    view.playhead(t / 60000);
  }

  // A new session: the model is rebuilt the next time the mode opens.
  function reset() {
    modelFor = null;
    loading = null;
    last = "";
  }

  return { show, hide, sync, playhead, reset };
}
