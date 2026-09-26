// The UI's pure pieces and the 2D view's SVG renderers, under a minimal DOM (no browser).
// The 2D view is the reduced-motion and no-WebGL fallback: it must render for every agent of
// every fixture session, and at every request.
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// ---------- a minimal DOM: enough for el(), the SVG helpers and replaceChildren ----------
class Node {
  constructor() { this.childNodes = []; this.parentNode = null; }
  get lastChild() { return this.childNodes.at(-1) || null; }
  get children() { return this.childNodes.filter(c => c instanceof Element); }
  get childElementCount() { return this.children.length; }
  append(...kids) {
    for (const k of kids) {
      const n = k instanceof Node ? k : new Text(String(k));
      n.parentNode = this;
      this.childNodes.push(n);
    }
  }
  replaceChildren(...kids) { this.childNodes = []; this.append(...kids); }
  get textContent() { return this.childNodes.map(c => c.textContent).join(""); }
  set textContent(v) { this.childNodes = []; if (v !== "" && v != null) this.append(new Text(String(v))); }
}
class Text extends Node {
  constructor(v) { super(); this.data = v; }
  get textContent() { return this.data; }
}
class Element extends Node {
  constructor(tag) { super(); this.tagName = tag.toUpperCase(); this.attributes = new Map(); this.listeners = {}; this.dataset = {}; this.style = { setProperty() {} }; }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  set className(v) { this.setAttribute("class", v); }
  get className() { return this.getAttribute("class") || ""; }
  addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
  dispatch(t, ev) { for (const fn of this.listeners[t] || []) fn(ev); }
  all(pred, out = []) { for (const c of this.children) { if (pred(c)) out.push(c); c.all(pred, out); } return out; }
}
globalThis.Node = Node;
globalThis.document = {
  createElement: tag => new Element(tag),
  createElementNS: (_ns, tag) => new Element(tag),
  createTextNode: v => new Text(v)
};

const { renderAgentColumns, renderOverview, buildLayout } = await import("../minimap.js");
const { ownLines, askWhere, largestLayer, modelsUsed, breakable, sessionStats, STRATA } = await import("../panels.js");
const { loadTrace } = await import("../loader.js");
const { entriesFor } = await import("../dump.mjs");
const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));

async function fixtureTraces() {
  const out = [];
  for (const sub of ["codex", "claude"]) out.push([sub, (await loadTrace(await entriesFor([FIX + sub]))).trace]);
  return out;
}

// ---------- the 2D view ----------
test("2D columns render for every agent and every request of the fixture sessions, with the selection marked", async () => {
  for (const [name, trace] of await fixtureTraces()) {
    for (const a of trace.agents) {
      for (const reqIdx of [null, 0, a.requests.length - 1]) {
        const host = new Element("div");
        let picked = null;
        const svg = renderAgentColumns(host, a, { width: 900, height: 400, reqIdx, onPick: i => { picked = i; } });
        assert.equal(host.children[0], svg, `${name} ${a.id}: the SVG is in the host`);
        const hits = svg.all(n => n.getAttribute("class") === "hit");
        assert.equal(hits.length, a.requests.length, `${name} ${a.id}: one column per request`);
        if (reqIdx != null && a.requests.length) {
          assert.ok(svg.all(n => n.getAttribute("stroke") === "#fff").length === 1, `${name} ${a.id}: the selected request is outlined`);
          svg.dispatch("click", { target: hits[reqIdx] });
          assert.equal(picked, reqIdx, `${name} ${a.id}: clicking a column picks that request`);
        }
      }
    }
  }
});

test("2D overview renders the whole session and picks a request from a click on the chart", async () => {
  for (const [name, trace] of await fixtureTraces()) {
    const L = buildLayout(trace);
    const host = new Element("div");
    let picked = null;
    const svg = renderOverview(host, trace, L, { width: 1000, height: 480, full: true, lens: "context", onPick: p => { picked = p; } });
    svg.getBoundingClientRect = () => ({ left: 0, top: 0 });
    svg.dispatch("click", { clientX: 900, clientY: 200, target: svg });
    assert.equal(picked?.agentId, L.root.id, `${name}: a chart click picks the root`);
    assert.ok(Number.isInteger(picked.reqIdx), `${name}: at a request`);
    for (const lens of ["egress", "inflow", "agents"]) renderOverview(new Element("div"), trace, L, { width: 320, height: 132, full: false, lens });
  }
});

// ---------- the reader's highlighting ----------
test("ownLines: exact user spans split lines into the user's runs and the product's wording", () => {
  const text = "Intro from the product\n- mine: my skill\n\nmy notes\nmore notes\nOutro";
  const a = text.indexOf("mine"), b = text.indexOf("\n", a);
  const c = text.indexOf("my notes"), d = text.indexOf("Outro") - 1;
  const rows = ownLines(text, { spans: [[c, d], [a, b]] });
  assert.equal(rows.length, 6);
  assert.deepEqual(rows.map(r => r.mine), [false, true, false, true, true, false]);
  assert.deepEqual(rows[1].runs, [{ mine: false, text: "- " }, { mine: true, text: "mine: my skill" }]);
  assert.equal(rows.map(r => r.runs.map(x => x.text).join("")).join("\n"), text, "every character is shown once");
  // A blank line inside a span keeps the band continuous.
  const t2 = "head\nmine one\n\nmine two\ntail";
  const r2 = ownLines(t2, { spans: [[5, t2.indexOf("\ntail")]] });
  assert.deepEqual(r2.map(r => r.mine), [false, true, true, true, false]);
  // Spans past the end (a clipped text) are clamped; none at all means nothing is theirs.
  assert.deepEqual(ownLines("abc", { spans: [[1, 99]] })[0].runs, [{ mine: false, text: "a" }, { mine: true, text: "bc" }]);
  assert.ok(ownLines("abc\ndef", { spans: [] }).every(r => !r.mine));
});

test("ownLines: without spans, lines the site publishes are the product's and the rest are the user's", () => {
  const rows = ownLines("Product line\nmy line\n\nProduct again", { lines: [true, false, false, true] });
  assert.deepEqual(rows.map(r => r.mine), [false, true, true, false]);
  assert.deepEqual(rows[1].runs, [{ mine: true, text: "my line" }]);
});

// ---------- L1 asks, tooltip, header ----------
test("askWhere: an ask no request saw reads 'after the last request · no reply' and opens the last request", () => {
  const agent = { requests: [{}, {}, {}] };
  assert.deepEqual(askWhere(agent, { request: 1 }), { text: "request 2", req: 1 });
  assert.deepEqual(askWhere(agent, { request: null }), { text: "after the last request · no reply", req: 2 });
  assert.deepEqual(askWhere(agent, { request: undefined }), { text: "after the last request · no reply", req: 2 });
  assert.deepEqual(askWhere({ requests: [] }, { request: null }).req, 0);
});

test("largestLayer: the biggest stratum, or null when a request has no blocks", () => {
  const zero = Object.fromEntries(STRATA.map(s => [s.key, 0]));
  assert.equal(largestLayer({ strata: zero }), null);
  assert.equal(largestLayer({ strata: null }), null);
  assert.equal(largestLayer({}), null);
  const top = largestLayer({ strata: { ...zero, outside: 50, model: 20 } });
  assert.equal(top.key, "outside");
  assert.equal(top.tokens, 50);
});

test("sessionStats: side calls and reviews have their own fresh-token figure", () => {
  const req = f => ({ tokens: { uncached: f, cacheWrite: 0, output: 0, context: f, cacheRead: 0 } });
  const trace = { agents: [
    { kind: "root", requests: [req(100)] },
    { kind: "subagent", requests: [req(10), req(5)] },
    { kind: "side", requests: [req(7)] },
    { kind: "guardian", requests: [req(3)] }
  ] };
  const st = sessionStats(trace);
  assert.equal(st.rootFresh, 100);
  assert.equal(st.subFresh, 15);
  assert.equal(st.sideFresh, 10);
});

test("modelsUsed names every model in order; labels break after . _ : and /", () => {
  assert.equal(modelsUsed({ model: "gpt-6-astra", requests: [{ model: "gpt-6-astra" }, { model: "gpt-6-sol" }, { model: "gpt-6-astra" }] }), "gpt-6-astra → gpt-6-sol");
  assert.equal(modelsUsed({ model: "m", requests: [] }), "m");
  const parts = breakable("developer: model_switch.instructions");
  assert.deepEqual(parts.filter(p => typeof p === "string"), ["developer:", " model_", "switch.", "instructions"]);
  assert.equal(parts.filter(p => p instanceof Element).length, 3);
});
