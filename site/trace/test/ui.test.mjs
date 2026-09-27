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
  get hidden() { return this.attributes.has("hidden"); }
  set hidden(v) { if (v) this.attributes.set("hidden", ""); else this.attributes.delete("hidden"); }
  matches(sel) { return splitSelectors(sel).some(s => matchesCompound(this, s)); }
  closest(sel) { for (let n = this; n instanceof Element; n = n.parentNode) if (n.matches(sel)) return n; return null; }
}
// Selectors for matches() and closest(): comma lists of compound selectors built from tag, #id, .class,
// [attr], [attr=value] and :not(<compound>), the forms keys.js hands to closest().
function splitSelectors(s) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && !depth) { out.push(cur); cur = ""; } else cur += ch;
  }
  return [...out, cur].map(x => x.trim()).filter(Boolean);
}
function matchesCompound(n, sel) {
  let rest = sel;
  const tag = rest.match(/^[a-z][a-z0-9-]*/i);
  if (tag) { if (n.tagName !== tag[0].toUpperCase()) return false; rest = rest.slice(tag[0].length); }
  while (rest) {
    let m;
    if ((m = rest.match(/^#([\w-]+)/))) { if (n.getAttribute("id") !== m[1]) return false; }
    else if ((m = rest.match(/^\.([\w-]+)/))) { if (!n.className.split(/\s+/).includes(m[1])) return false; }
    else if ((m = rest.match(/^\[([\w-]+)(?:=(?:"([^"]*)"|([^\]]*)))?\]/))) {
      const want = m[2] ?? m[3];
      if (!n.attributes.has(m[1]) || (want !== undefined && n.getAttribute(m[1]) !== want)) return false;
    }
    else if ((m = rest.match(/^:not\(([^()]*)\)/))) { if (matchesCompound(n, m[1].trim())) return false; }
    else throw new Error(`the fake DOM cannot read the selector "${sel}"`);
    rest = rest.slice(m[0].length);
  }
  return true;
}
globalThis.Node = Node;
globalThis.document = {
  createElement: tag => new Element(tag),
  createElementNS: (_ns, tag) => new Element(tag),
  createTextNode: v => new Text(v),
  body: new Element("body"),
  querySelector: () => null
};
globalThis.addEventListener ??= () => {};

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

// A browser logs "A negative value is not valid" for every <rect> with a negative width or height. The full
// overview's lane pitch bottoms out at 2.5 px while its bar leaves a 3 px gap, and the columns' margins take
// 44 px of the height.
test("2D charts never emit negative geometry: dense lanes keep a visible bar, margins taller than the chart clamp", async () => {
  // 60 subagents at work at once: 60 lanes, so the full view's pitch is H * 0.3 / 60, inside 2.5 to 3 px for H of 500 to 600
  const t0 = Date.UTC(2026, 8, 25, 7, 0), req = t => ({ t, tokens: { context: 1000 } });
  const agent = (id, kind, extra = {}) => ({ id, kind, name: id, requests: [], blocks: [], asks: [], compactions: [], ...extra });
  const root = agent("root", "root");
  for (let i = 0; i < 40; i++) root.requests.push(req(t0 + i * 20e3));
  const subs = Array.from({ length: 60 }, (_, k) => {
    const a = agent(`s${k}`, "subagent", { parentId: "root" });
    for (let j = 0; j < 5; j++) a.requests.push(req(t0 + 100e3 + k * 1e3 + j * 60e3));
    return a;
  });
  const dense = { agents: [root, ...subs], started: t0, ended: t0 + 800e3 };
  const sessions = [["dense", dense], ["long", longSession()], ...await fixtureTraces()];
  const bad = [], at = (what, n) => `${what} ${n.getAttribute("class") || ""} ${n.getAttribute("width")}x${n.getAttribute("height")}`;
  const check = (what, svg) => {
    for (const n of svg.all(n => n.tagName === "RECT")) {
      for (const k of ["width", "height"]) {
        const v = Number(n.getAttribute(k));
        if (!Number.isFinite(v) || v < 0) bad.push(at(what, n));
      }
    }
  };
  const heights = [10, 20, 30, 43.9, 50, 132, 140, 300, 500, 540, 598.4, 599.9, 640];
  let dense3 = 0;
  for (const [name, trace] of sessions) {
    const L = buildLayout(trace), subagents = trace.agents.filter(a => a.kind === "subagent" && a.requests.length).length;
    for (const H of heights) {
      for (const full of [true, false]) {
        const svg = renderOverview(new Element("div"), trace, L, { width: 1000, height: H, full, lens: "context", focus: { agentId: subs[0].id, reqIdx: 0 } });
        check(`${name} overview H ${H} ${full ? "full" : "compact"}`, svg);
        const lanes = svg.all(n => n.getAttribute("class") === "lane");
        assert.ok(lanes.length >= subagents, `${name} H ${H}: every subagent has a lane bar`);
        for (const r of lanes) assert.ok(Number(r.getAttribute("height")) >= 1, `${name} H ${H}: a lane bar is at least 1 px (${r.getAttribute("height")})`);
        if (name === "dense" && full && (H * 0.3) / L.lanes < 3 && (H * 0.3) / L.lanes >= 2.5) dense3++;
      }
    }
    for (const a of trace.agents.filter(a => a.requests.length)) {
      for (const H of heights) check(`${name} ${a.id} columns H ${H}`, renderAgentColumns(new Element("div"), a, { width: 600, height: H, reqIdx: 0 }));
    }
  }
  assert.ok(dense3 >= 3, `the sweep reaches the 2.5 to 3 px lane pitch (${dense3} renders)`);
  assert.deepEqual(bad, []);
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

test('a request offers its tool call once, whether or not the map card is showing it', () => {
  const req = { i: 0, t: 1000, tokens: { context: 811000 }, action: { kind: 'tool', tool: 'Bash', class: 'write' } };
  const agent = { id: 'root', kind: 'root', requests: [req], blocks: [], asks: [], compactions: [] };
  for (const extra of [{}, { followingMap: true }, { mapPinned: true, level: 3 }]) {
    const host = new Element('aside');
    renderPanel(host, { trace: { agents: [agent] }, level: 2, agent, reqIdx: 0, ...extra }, { focusAction() {}, focusRequest() {}, focusStratum() {} });
    const opens = host.all(n => n.tagName === 'BUTTON' && n.textContent === 'Open Bash call ↗');
    assert.equal(opens.length, 1, `one call button with ${JSON.stringify(extra)}`);
  }
});

test("the map card names where it is: the playhead while playing, the centre of the map, or the selection", () => {
  const req = { i: 4, t: 1000, tokens: { context: 900 } };
  const agent = { id: "root", kind: "root", requests: [{}, {}, {}, {}, req], blocks: [], asks: [], compactions: [] };
  const kicker = extra => {
    const host = new Element("aside");
    renderPanel(host, { trace: { agents: [agent] }, level: 2, agent, reqIdx: 4, ...extra }, { focusAction() {}, focusRequest() {}, focusStratum() {} });
    return host.all(n => n.getAttribute("class") === "kicker")[0]?.textContent;
  };
  assert.equal(kicker({ followingMap: true, atPlayhead: true }), "AT THE PLAYHEAD");
  assert.equal(kicker({ followingMap: true }), "AT THE CENTER OF YOUR MAP");
  assert.equal(kicker({ mapPinned: true, level: 3 }), "SELECTED REQUEST");
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

// ---------- the playback transport ----------
const { createPlayback } = await import("../playback.js");
const { createTransport, playheadLabel, playheadForRequest, nextSpeed, focusStep, FOCUS } = await import("../transport.js");
const { fmtClock } = await import("../panels.js");

// A long main thread: 1,701 requests 20 s apart, with 3-hour idle stretches before requests 501, 1,001
// and 1,501 (the layout squeezes them) and a 40-minute wait before request 1,302 that one subagent's
// whole run fills. A second subagent's single request sits inside an idle stretch, splitting it.
function longSession() {
  const t0 = Date.UTC(2026, 8, 25, 7, 0), req = t => ({ t, tokens: { context: 1000 } });
  const agent = (id, kind, extra = {}) => ({ id, kind, name: id, requests: [], blocks: [], asks: [], compactions: [], ...extra });
  const root = agent("root", "root");
  let t = t0;
  for (let i = 0; i < 1701; i++) {
    if (i) t += i % 500 === 0 ? 3 * 3600e3 : i === 1301 ? 40 * 60e3 : 20e3;
    root.requests.push(req(t));
  }
  const worker = agent("worker", "subagent", { parentId: "root" });
  for (let k = 0; k < 50; k++) worker.requests.push(req(root.requests[1300].t + 30e3 + k * 48e3));
  const late = agent("late", "subagent", { parentId: "root" });
  late.requests.push(req(root.requests[999].t + 2 * 3600e3));
  return { agents: [root, worker, late], started: t0, ended: t };
}
function transportFixture() {
  const L = buildLayout(longSession());
  const pb = createPlayback({ times: L.root.requests.map(r => r.t), X: L.X });
  pb.setP(pb.n - 1);
  const frames = new Map(), pushed = [];
  let id = 0;
  const host = new Element("div");
  const starts = [], follows = [];
  const tr = createTransport(host, { onPlayhead: p => pushed.push(p), onStart: () => starts.push(pb.P), onFollow: f => follows.push(f),
    raf: f => { frames.set(++id, f); return id; }, caf: i => frames.delete(i), now: () => 0 });
  tr.load(pb);
  // Runs the queued animation frame at time t.
  const frame = t => { const [[k, f]] = frames; frames.delete(k); f(t); };
  const [play, scrub, readout, speed] = host.children;
  return { L, pb, tr, host, frames, frame, pushed, starts, follows, play, scrub, readout, speed, follow: tr.controls.follow };
}

test("the transport renders play, scrub, readout and speed; the readout names the request and its time", () => {
  const { pb, tr, host, pushed, play, scrub, readout, speed } = transportFixture();
  assert.deepEqual(host.children.map(c => `${c.tagName}.${c.className}`), ["BUTTON.play", "INPUT.scrub", "OUTPUT.readout", "BUTTON.speed", "BUTTON.follow"]);
  assert.deepEqual(["type", "min", "max", "step", "aria-label"].map(k => scrub.getAttribute(k)), ["range", "0", "1", "0.0005", "Session time"]);
  assert.equal(readout.getAttribute("aria-live"), "off", "the readout is not announced every frame");
  assert.deepEqual([play.getAttribute("aria-label"), play.getAttribute("aria-pressed"), host.getAttribute("data-playing")], ["Play", "false", "false"]);
  assert.equal(speed.textContent, "4×");
  assert.equal(pushed.length, 0, "loading a session pushes nothing: the scene starts at the same end");
  const tEnd = pb.timeAt(pb.n - 1);
  assert.equal(readout.textContent, `req 1,701 · ${new Date(tEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fmtClock(tEnd)}`);
  tr.seek(1233.5);
  const t = pb.timeAt(1233.5);
  assert.ok(t > pb.timeAt(1233) && t < pb.timeAt(1234), "the time the playhead has reached, between the two requests");
  const day = new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  assert.equal(readout.textContent, `req 1,234 · ${day} · ${fmtClock(t)}`);
  assert.match(readout.textContent, /^req 1,234 · Sep 2[56] · \d{1,2}:\d\d [ap]m$/);
  assert.equal(scrub.getAttribute("aria-valuetext"), readout.textContent);
  assert.deepEqual(pushed.at(-1), { P: 1233.5, playing: false, sweep: null });
  // Halfway through the 40-minute wait the clock reads 20 minutes on, not the request's own time.
  tr.seek(1300.5);
  const mid = pb.timeAt(1300) + 20 * 60e3;
  assert.equal(pb.timeAt(1300.5), mid);
  assert.equal(readout.textContent, `req 1,301 · ${new Date(mid).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${fmtClock(mid)}`);
  assert.notEqual(fmtClock(mid), fmtClock(pb.timeAt(1300)));
  // The scrub is the playhead's compressed-time x, and dragging it moves the playhead to that x.
  for (const P of [0, 1, 499.5, 500, 1000.25, 1301, pb.n - 1]) { tr.seek(P); assert.equal(Number(scrub.value), pb.xAt(P), `scrub at P ${P}`); }
  for (const P of [12.75, 700.25, 1300.5]) {
    scrub.value = String(pb.xAt(P));
    scrub.dispatch("input");
    assert.ok(Math.abs(pb.P - P) < 1e-9, `scrubbing to x(${P}) lands on ${pb.P}`);
    assert.deepEqual(pushed.at(-1), { P: pb.P, playing: false, sweep: null });
  }
});

test("play runs one frame loop that pushes P and the sweep; pause, step and scrubbing stop it", () => {
  const { pb, tr, host, frames, frame, pushed, play, scrub } = transportFixture();
  tr.seek(100.2);
  assert.equal(frames.size, 0, "paused: no frame is scheduled");
  play.dispatch("click");
  assert.deepEqual([host.getAttribute("data-playing"), play.getAttribute("aria-pressed"), play.getAttribute("aria-label")], ["true", "true", "Pause"]);
  assert.equal(frames.size, 1);
  assert.deepEqual(pushed.at(-1), { P: 100.2, playing: true, sweep: 100.2 - 100 });
  for (const t of [16, 33, 50]) {
    const before = pb.P;
    frame(t);
    const p = pushed.at(-1);
    assert.ok(p.playing && p.P > before, `frame ${t} moves the playhead`);
    assert.equal(p.sweep, p.P - Math.floor(p.P));
    assert.equal(Number(scrub.value), pb.xAt(p.P));
    assert.equal(frames.size, 1, "one frame queued at a time");
  }
  const x0 = pb.xAt(pb.P);
  frame(5050);
  assert.ok(Math.abs(pb.xAt(pb.P) - x0 - 4 / (pb.n - 1) * 0.1) < 1e-9, "a 5 s gap between frames (a hidden tab) advances only 100 ms");
  play.dispatch("click");
  assert.deepEqual([host.getAttribute("data-playing"), play.getAttribute("aria-label"), frames.size], ["false", "Play", 0]);
  assert.deepEqual(pushed.at(-1), { P: pb.P, playing: false, sweep: null });
  tr.play();
  assert.equal(frames.size, 1);
  const from = pb.P;
  tr.step(1);
  assert.deepEqual([frames.size, pb.playing, pb.P], [0, false, Math.floor(from) + 1 + FOCUS], "stepping pauses on the next request, complete");
  tr.play();
  scrub.dispatch("pointerdown");
  assert.deepEqual([frames.size, pb.playing], [0, false], "grabbing the scrub pauses");
});

test("playing to the end stops the loop and resets the button; play again starts over", () => {
  const { pb, tr, host, frames, frame, pushed, play } = transportFixture();
  tr.seek(pb.n - 3.5);
  tr.setSpeed(16);
  play.dispatch("click");
  let t = 0, guard = 0;
  while (pb.playing && guard++ < 10000) frame(t += 100);
  assert.ok(guard < 10000);
  assert.equal(frames.size, 0, "the frame that reaches the end schedules no other");
  assert.deepEqual([pb.P, pb.playing, host.getAttribute("data-playing"), play.getAttribute("aria-label")], [pb.n - 1, false, "false", "Play"]);
  assert.deepEqual(pushed.at(-1), { P: pb.n - 1, playing: false, sweep: null });
  play.dispatch("click");
  assert.equal(pb.P, 0, "play at the end starts from the first request");
  assert.equal(frames.size, 1);
});

test("the speed button cycles 4× → 8× → 16× → 1×; the keys' faster and slower stop at the ends", () => {
  const { pb, tr, speed } = transportFixture();
  const seen = [speed.textContent];
  for (let i = 0; i < 5; i++) { speed.dispatch("click"); seen.push(speed.textContent); }
  assert.deepEqual(seen, ["4×", "8×", "16×", "1×", "2×", "4×"]);
  assert.equal(pb.speed, 4);
  assert.equal(nextSpeed({ speeds: [1, 2, 4, 8, 16], speed: 3 }), 4, "an off-list speed goes to the next listed one");
  for (let i = 0; i < 4; i++) tr.faster();
  assert.equal(speed.textContent, "16×");
  for (let i = 0; i < 6; i++) tr.slower();
  assert.equal(speed.textContent, "1×");
});

test("focusing request i puts the playhead at i + 0.65: request i complete, on the root or in a subagent's own requests", () => {
  const { L, pb, tr, readout, scrub } = transportFixture();
  assert.equal(FOCUS, 0.65, "past the pour (i + 0.6), before a collapse starts (i + 0.7)");
  assert.equal(playheadForRequest(pb, L, "root", 1234), 1234.65);
  assert.equal(playheadForRequest(pb, L, "root", 0), 0.65);
  assert.equal(playheadForRequest(pb, L, "root", pb.n - 1), pb.n - 1 + FOCUS, "past the end: the playback clamps it");
  assert.equal(playheadForRequest(pb, L, "root", 99999), null);
  assert.equal(playheadForRequest(pb, L, "nobody", 0), null);
  assert.equal(playheadForRequest(null, L, "root", 3), null);
  // What app.js's set() does with the option: seek, paused. The readout and scrub name the focused request.
  tr.play();
  tr.seek(playheadForRequest(pb, L, "root", 899));
  assert.deepEqual([pb.P, pb.playing], [899.65, false]);
  assert.match(readout.textContent, /^req 900 · /, "request index 899 is the 900th, as the request slider shows it");
  assert.equal(scrub.getAttribute("aria-valuetext"), readout.textContent);
  tr.seek(playheadForRequest(pb, L, "root", pb.n - 1));
  assert.equal(pb.P, pb.n - 1, "the last request complete is the end: the whole landscape");
  // A map pin (the Selected card) on root request 849, then on a subagent's request, while playing.
  tr.seek(100.2); tr.play();
  tr.seek(playheadForRequest(pb, L, "root", 849));
  assert.deepEqual([pb.P, pb.playing, readout.textContent.split(" · ")[0]], [849.65, false, "req 850"]);
  tr.step(-1);
  assert.deepEqual([pb.P, readout.textContent.split(" · ")[0]], [848.65, "req 849"], ", from 849.65 gives 848.65");
  tr.seek(playheadForRequest(pb, L, "worker", 10));
  assert.ok(pb.P > 1300 && pb.P < 1301 && !pb.playing, "a pin on a subagent's request moves the playhead into its run");
  // A subagent's request: the cut lands where that agent's own playhead reads i + 0.65 (its last at its own x).
  const worker = L.byId.get("worker"), xs = worker.requests.map(r => L.X(r.t));
  let prev = -1;
  worker.requests.forEach((r, i) => {
    const P = playheadForRequest(pb, L, "worker", i), cut = pb.xAt(P);
    assert.ok(P > 1300 && P < 1301 && P > prev, `worker request ${i}: P ${P} is fractional, inside the wait, in order`);
    const own = i < xs.length - 1 ? i + (cut - xs[i]) / (xs[i + 1] - xs[i]) : (Math.abs(cut - xs[i]) < 1e-12 ? i : NaN);
    assert.ok(Math.abs(own - (i < xs.length - 1 ? i + FOCUS : i)) < 1e-6, `worker request ${i}: its own playhead reads ${own}`);
    prev = P;
  });
  // Inside a squeezed idle stretch, time and compressed x disagree: the playhead follows x.
  const t = L.byId.get("late").requests[0].t, P = playheadForRequest(pb, L, "late", 0);
  assert.ok(P > 999 && P < 1000);
  assert.ok(Math.abs(pb.xAt(P) - L.X(t)) < 1e-12);
  assert.ok(Math.abs(pb.xAt(pb.PAtTime(t)) - L.X(t)) > 1e-3, "PAtTime alone would put the cut off the request here");
});

test(", and . move the readout's request number by exactly one, to that request complete", () => {
  const n = 1701;
  for (const [P, back, on] of [[849.65, 848.65, 850.65], [899.65, 898.65, 900.65], [900, 899.65, 901.65], [900.4, 899.65, 901.65], [900.95, 899.65, 901.65],
    [0, FOCUS, 1.65], [0.65, FOCUS, 1.65], [0.3, FOCUS, 1.65], [n - 1, n - 2 + FOCUS, n - 1], [n - 2 + FOCUS, n - 3 + FOCUS, n - 1]]) {
    assert.deepEqual([focusStep(P, -1, n), focusStep(P, 1, n)], [back, on], `from ${P}`);
  }
  const { pb, tr, readout } = transportFixture();
  tr.seek(899.65);
  const seen = [];
  for (const d of [1, 1, -1, -1, -1]) { tr.step(d); seen.push([pb.P, readout.textContent.split(" · ")[0]]); }
  assert.deepEqual(seen, [[900.65, "req 901"], [901.65, "req 902"], [900.65, "req 901"], [899.65, "req 900"], [898.65, "req 899"]]);
  tr.seek(0.65);
  tr.step(-1);
  assert.deepEqual([pb.P, readout.textContent.split(" · ")[0]], [0.65, "req 1"], ", from 0.65 stays at 0.65: request 0 is never un-poured");
});

test("the Follow chip: auto by default; moving the camera during a run makes it manual; the chip or f asks for it again", () => {
  const { pb, tr, follow, follows, starts, frame, frames } = transportFixture();
  const chip = () => [follow.getAttribute("aria-pressed"), follow.textContent, tr.follow, tr.forced];
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", false]);
  assert.equal(follow.getAttribute("title"), "The camera follows the playhead · f");
  tr.userCamera();
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", false], "panning while paused leaves Follow alone");
  tr.seek(100.65);
  tr.play();
  assert.deepEqual(starts, [100.65], "a run starts once");
  frame(16);
  tr.play();
  assert.deepEqual(starts, [100.65], "play while playing is not a new run");
  tr.userCamera();
  assert.deepEqual(chip(), ["false", "Follow manual", "manual", false]);
  assert.deepEqual(follows, ["manual"]);
  tr.pause(); tr.play();
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", false], "a new run follows again");
  tr.userCamera();
  follow.dispatch("click");
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", true], "asked for: it follows at the overview too");
  follow.dispatch("click");
  assert.deepEqual(chip(), ["false", "Follow manual", "manual", false], "turned off");
  tr.pause(); tr.play();
  assert.equal(tr.follow, "manual", "off stays off across runs");
  tr.toggleFollow();
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", true]);
  tr.pause();
  tr.userCamera();
  assert.deepEqual(chip(), ["true", "Follow auto", "auto", false], "the user took the camera: no longer asked to follow at the overview");
  tr.toggleFollow(); tr.toggleFollow();
  assert.equal(tr.forced, true);
  assert.deepEqual(follows, ["manual", "manual", "auto", "manual", "auto", "manual", "auto"]);
  assert.ok(frames.size <= 1);
});

// ---------- where Space plays ----------
const { createPalette } = await import("../palette.js");

// A fake page: the landscape, the transport, the panel with the call reader panels.js renders, the 2D
// view and a few fields and controls, under one body. The palette's key handler runs over it with a
// playback that declines (returns false) while the transport is hidden, as app.js's does.
function spacePage() {
  const body = document.body;
  body.replaceChildren();
  const E = (tag, attrs = {}, ...kids) => { const n = new Element(tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); n.append(...kids); return n; };
  const canvas = E("canvas", { class: "gl" }), label = E("button", { class: "lbl event" });
  const stage = E("div", { id: "stage", class: "stage" }, canvas, E("div", { class: "labels" }, label));
  const transportHost = E("div", { id: "playback", class: "playback", role: "group" });
  const L = buildLayout(longSession());
  const pb = createPlayback({ times: L.root.requests.map(r => r.t), X: L.X });
  const tr = createTransport(transportHost, { raf: () => 1, caf: () => {}, now: () => 0 });
  tr.load(pb);
  const req = { i: 0, t: 1000, tokens: { context: 900 }, action: { kind: "tool", tool: "Bash", target: "echo hi", args: null, result: null } };
  const agent = { id: "root", kind: "root", requests: [req], blocks: [], asks: [], compactions: [] };
  const panel = E("aside", { id: "panel", class: "panel" });
  renderPanel(panel, { trace: { agents: [agent] }, level: 2, agent, reqIdx: 0, inspector: "action" }, { focusRequest() {} });
  const reader = panel.all(n => n.tagName === "PRE")[0];
  const flat = E("div", { id: "flat", class: "flat" });
  const fields = [E("input", { id: "paste", type: "text" }), E("input", { id: "request-range", type: "range" }), E("input", { id: "request-number", type: "number" }),
    E("textarea"), E("select"), E("div", { contenteditable: "true" })];
  const controls = [E("button", { id: "zoom-in" }), E("summary"), E("a", { href: "#x" }), E("div", { role: "button", tabindex: "0" })];
  body.append(E("div", { id: "app", class: "app" }, stage, E("div", { class: "side" }, panel), flat, transportHost, ...fields, ...controls));
  let shown = true;
  const calls = [];
  const act = name => (...a) => shown && void calls.push([name, ...a].join(" "));
  const palette = createPalette({ state: () => ({}), A: {}, overview() {}, selectLens() {}, moveRequest() {}, getText: async () => ({ text: "" }), finder: () => null,
    playback: { toggle: act("toggle"), step: act("step"), slower: act("slower"), faster: act("faster"), follow: act("follow") } });
  palette.setTrace({ agents: [agent] });
  // One keydown through the palette's handler: [handled, prevented, what playback did].
  const press = (target, key = " ", mods = {}) => {
    const e = { key, target, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, ...mods, prevented: false, preventDefault() { this.prevented = true; } };
    calls.length = 0;
    const handled = palette.handleKey(e);
    return [handled, e.prevented, calls.join(", ")];
  };
  return { body, canvas, label, stage, tr, reader, panel, flat, fields, controls, press, hide: v => { shown = !v; } };
}

test("Space plays from the page, the landscape and the scrub; a reader, the panel, a field or a control keeps it", () => {
  const p = spacePage();
  const { play, scrub, speed } = p.tr.controls;
  assert.ok(p.reader.className.includes("call-text") && p.reader.getAttribute("tabindex") === "0", "the call reader is the focusable pre panels.js renders");
  for (const [where, target] of [["the page", p.body], ["the landscape", p.canvas], ["the transport's scrub", scrub]]) {
    assert.deepEqual(p.press(target), [true, true, "toggle"], `Space on ${where} plays`);
  }
  const keeps = [["the call reader", p.reader], ["the panel", p.panel], ["the 2D view", p.flat], ["the play button (it presses itself)", play], ["the speed button", speed],
    ["the Follow chip", p.tr.controls.follow], ["a landscape label button", p.label], ...p.fields.map(f => [`${f.tagName} ${f.getAttribute("type") || f.getAttribute("contenteditable") || ""}`, f]),
    ...p.controls.map(c => [`${c.tagName} ${c.getAttribute("role") || ""}`, c])];
  for (const [where, target] of keeps) assert.deepEqual(p.press(target), [false, false, ""], `Space on ${where} is left to it, not prevented`);
  // The scrub still answers the other playback keys; other fields and range inputs do not.
  assert.deepEqual(p.press(scrub, ","), [true, true, "step -1"]);
  assert.deepEqual(p.press(scrub, ">", { shiftKey: true }), [true, true, "faster"]);
  assert.deepEqual(p.press(scrub, "f"), [true, true, "follow"]);
  assert.deepEqual(p.press(p.body, "f"), [true, true, "follow"]);
  assert.deepEqual(p.press(p.fields[0], "f"), [false, false, ""], "typing an f is typing");
  assert.deepEqual(p.press(scrub, "Home"), [false, false, ""], "Home stays with the range");
  assert.deepEqual(p.press(p.fields[0], ","), [false, false, ""], "typing a comma is typing");
  assert.deepEqual(p.press(p.fields[1], "."), [false, false, ""], "the request slider keeps its keys");
  // A focused button still gets the step keys (they are not its own).
  assert.deepEqual(p.press(play, "."), [true, true, "step 1"]);
});

test("while the transport is hidden, playback keys decline and the page keeps them unprevented", () => {
  const p = spacePage();
  p.hide(true);
  for (const [key, mods] of [[" ", {}], [",", {}], [".", {}], ["<", { shiftKey: true }], [">", { shiftKey: true }], ["f", {}]]) {
    for (const target of [p.body, p.canvas]) assert.deepEqual(p.press(target, key, mods), [false, false, ""], `"${key}" with the transport hidden`);
  }
  p.hide(false);
  assert.deepEqual(p.press(p.body), [true, true, "toggle"], "shown again, Space plays");
});
