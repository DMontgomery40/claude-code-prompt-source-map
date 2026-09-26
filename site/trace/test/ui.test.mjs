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
  for (const sub of ["codex", "claude"]) {
    const entries = await entriesFor([FIX + sub]);
    try { out.push([sub, (await loadTrace(entries)).trace]); }
    finally { await Promise.all(entries.map(e => e.source.close())); }
  }
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

// Navigation must work across long real sessions, one-request agents and empty logs.
const { requestPosition, stepRequest, peakRequestIndex } = await import("../navigation.js");
const { agentTable, askPreviewText, renderPanel } = await import("../panels.js");
test("request navigation clamps every entry point and never crosses an agent boundary", () => {
  for (const count of [0, 1, 2, 17, 172, 1701]) {
    for (const index of [null, -10, 0, 1, count - 1, count, 9000, NaN]) {
      const p = requestPosition(count, index);
      assert.ok(p.index >= 0 && p.index <= Math.max(0, count - 1));
      assert.equal(p.canPrevious, count > 0 && p.index > 0);
      assert.equal(p.canNext, p.index < count - 1);
      assert.ok(p.progress >= 0 && p.progress <= 1);
      for (const delta of [-100, -10, -1, 0, 1, 10, 100]) {
        const to = stepRequest(count, index, delta);
        assert.ok(to >= 0 && to < Math.max(1, count));
        assert.equal(stepRequest(count, to, 0), to);
      }
    }
  }
});
test("peak navigation handles empty, one-request, tied and sparse token records", () => {
  for (const [values, expected] of [[[], -1], [[0], 0], [[4, 9, 9, 3], 1], [[3, 2, 8], 2], [[null, 4], 1]]) {
    assert.equal(peakRequestIndex({ requests: values.map(v => ({ tokens: v == null ? null : { context: v } })) }), expected);
  }
  assert.equal(peakRequestIndex(null), -1);
});
test("real agent-message wrappers stay out of previews while their task text remains", () => {
  for (const opening of ['<teammate-message>', '<teammate-message teammate_id="lead" summary="Task">', '<teammate-message color="blue"\n summary="Follow-up">']) {
    assert.equal(askPreviewText(opening + '\nBuild the three.js viewer.\n</teammate-message>'), 'Build the three.js viewer.');
  }
  assert.equal(askPreviewText('Check x < y and y > z'), 'Check x < y and y > z');
  assert.equal(askPreviewText(''), '(empty)');
  assert.ok(askPreviewText('a'.repeat(300)).length <= 90);
});
test("agent search filters names, models and kinds without losing the open action", async () => {
  const [, trace] = (await fixtureTraces())[0];
  const base = trace.agents[0];
  const agents = Array.from({ length: 12 }, (_, i) => ({ ...base, id: `search-${i}`, name: i === 3 ? 'Trace Viewer' : `Worker ${i}`, kind: i === 0 ? 'side' : 'subagent', model: i % 2 ? 'opus' : 'sonnet', parentId: base.id }));
  let opened;
  const widget = agentTable(trace, agents, {}, { focusAgent: id => { opened = id; } });
  const search = widget.all(n => n.tagName === 'INPUT')[0];
  const status = widget.all(n => n.getAttribute('role') === 'status')[0];
  const rows = widget.all(n => n.tagName === 'TR').slice(1);
  for (const [value, count] of [[' trace VIEWER ', 1], ['OPUS', 6], ['side', 1], ['no-such-agent', 0], ['', 12]]) {
    search.value = value; search.dispatch('input');
    assert.equal(rows.filter(r => !r.hidden).length, count);
    assert.ok(status.textContent.startsWith(String(count)));
  }
  const target = widget.all(n => n.tagName === 'BUTTON' && n.textContent === 'Trace Viewer')[0];
  target.dispatch('click'); assert.equal(opened, 'search-3');
});
test("overview entry points open the correct peak request and layer for both products", async () => {
  for (const [, trace] of await fixtureTraces()) {
    const root = trace.agents.find(a => a.kind === 'root') || trace.agents[0];
    const peak = root.requests[peakRequestIndex(root)];
    const host = new Element('aside');
    let selected;
    renderPanel(host, { trace, level: 0, lens: 'context', mode: '3d' }, {
      focusRequest: (id, i) => { selected = ['request', id, i]; },
      focusStratum: (id, i, key) => { selected = ['layer', id, i, key]; }
    });
    host.all(n => n.tagName === 'BUTTON' && n.textContent === 'Jump to peak')[0].dispatch('click');
    assert.deepEqual(selected, ['request', root.id, peak.i]);
    const injection = host.all(n => n.tagName === 'BUTTON' && n.textContent.startsWith('What was injected'))[0];
    if (peak.strata?.injected > 0) {
      assert.ok(injection); injection.dispatch('click');
      assert.deepEqual(selected, ['layer', root.id, peak.i, 'injected']);
    } else assert.equal(injection, undefined);
  }
});

test('map-following sidebar moves through overview, agent, request and source without changing selection', async () => {
  const { mapPanelState } = await import('../navigation.js');
  for (const [, trace] of await fixtureTraces()) {
    const state = { trace, level: 0, mode: '3d', lens: 'context', agentId: null, reqIdx: null };
    for (const agent of trace.agents.filter(a => a.requests.length)) {
      for (const reqIdx of [0, agent.requests.length - 1]) {
        const req = agent.requests[reqIdx], stratum = Object.keys(req.strata || {}).find(k => req.strata[k] > 0);
        for (const detail of [1, 2, 3, 2, 1, 0]) {
          const view = mapPanelState(state, { detail, agentId: agent.id, reqIdx, stratum });
          assert.equal(state.level, 0); assert.equal(state.agentId, null);
          if (!detail) { assert.equal(view, state); continue; }
          assert.equal(view.agent, agent); assert.equal(view.reqIdx, reqIdx);
          assert.equal(view.level, detail === 3 && !stratum ? 2 : detail);
        }
      }
    }
    const focus = { detail: 3, agentId: trace.agents[0].id, reqIdx: 999999, stratum: 'missing' };
    const view = mapPanelState(state, focus);
    assert.equal(view.reqIdx, view.agent.requests.length - 1);
    assert.equal(view.level, 2); assert.equal(view.stratum, null);
    for (const level of [1, 2, 3]) {
      const pinned = { ...state, level, block: 0 };
      assert.equal(mapPanelState(pinned, focus), pinned, 'explicit reader is not replaced while reading');
    }
    const flat = { ...state, mode: '2d' };
    assert.equal(mapPanelState(flat, focus), flat);
    assert.equal(mapPanelState(state, { ...focus, agentId: 'missing' }), state);
  }
});

test('tool inspector opens the actual selected call immediately, including every call in multi-call responses', async () => {
  for (const tool of ['Bash', 'Read', 'mcp__web__search']) {
    const ref = { file: 0, offset: 50, length: 20 }, result = { file: 0, offset: 80, length: 20 };
    const action = { kind: 'tool', tool, callId: 'selected', args: ref, result: null, class: 'read' };
    action.all = [{ kind: 'tool', tool: 'Other', callId: 'other', args: { offset: 1 } }, { ...action, result }];
    const req = { i: 0, t: 1000, tokens: { context: 810750 }, action };
    const agent = { id: 'root', kind: 'root', requests: [req], blocks: [], asks: [], compactions: [] };
    const host = new Element('aside');
    let selected;
    renderPanel(host, { trace: { agents: [agent] }, level: 2, agent, reqIdx: 0, inspector: 'action', callIndex: null }, {
      getText: async (_id, r) => ({ text: r === ref ? '{"command":"printf hello"}' : r === result ? 'hello' : 'other input' }),
      focusCall: i => { selected = i; }, focusRequest() {}, up() {}
    });
    await new Promise(resolve => setImmediate(resolve));
    const pre = host.all(n => n.tagName === 'PRE')[0];
    assert.ok(pre, `${tool}: literal input is open without another click`);
    assert.ok(pre.textContent.includes('printf hello'));
    const resultTab = host.all(n => n.tagName === 'BUTTON' && n.textContent === 'Result')[0];
    assert.ok(resultTab, 'matched multi-call result is available');
    resultTab.dispatch('click');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(pre.textContent, 'hello');
    const other = host.all(n => n.tagName === 'BUTTON' && n.textContent.includes('Other'))[0];
    assert.ok(other); other.dispatch('click'); assert.equal(selected, 0);
    assert.ok(host.textContent.includes('810,750'), 'the exact context total remains labeled separately');
  }
});

test('tool inspector handles missing text, reader errors and competing async reads without showing the wrong result', async () => {
  const req = { i: 0, t: 1000, tokens: { context: 900 }, action: { kind: 'tool', tool: 'Bash', target: 'echo fallback', args: null, result: null } };
  const agent = { id: 'root', kind: 'root', requests: [req], blocks: [], asks: [], compactions: [] };
  const state = { trace: { agents: [agent] }, level: 2, agent, reqIdx: 0, inspector: 'action' };
  let host = new Element('aside');
  renderPanel(host, state, { focusRequest() {} });
  assert.equal(host.all(n => n.tagName === 'PRE')[0].textContent, 'echo fallback');
  assert.equal(host.all(n => n.tagName === 'BUTTON' && n.textContent === 'Result')[0].disabled, true);
  assert.ok(!host.textContent.includes('null'), 'absent controls do not leak placeholders into the interface');
  req.action.args = { offset: 1 }; req.action.result = { offset: 2 };
  let resolveInput;
  host = new Element('aside');
  renderPanel(host, state, { focusRequest() {}, getText: async (_id, ref) => ref.offset === 1 ? new Promise(r => { resolveInput = r; }) : { text: '<script>literal output</script>' } });
  host.all(n => n.tagName === 'BUTTON' && n.textContent === 'Result')[0].dispatch('click');
  await new Promise(resolve => setImmediate(resolve));
  resolveInput({ text: 'old input' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(host.all(n => n.tagName === 'PRE')[0].textContent, '<script>literal output</script>');
  assert.equal(host.all(n => n.tagName === 'SCRIPT').length, 0);
  host = new Element('aside');
  renderPanel(host, state, { focusRequest() {}, getText: async () => { throw new Error('source missing'); } });
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(host.all(n => n.tagName === 'PRE')[0].textContent.includes('source missing'));
});
