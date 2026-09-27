// Words at max zoom (block-text.js): pooled text panes on the bands of the leading grain column, under
// a minimal DOM and the vendor three.js cameras (no browser).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// ---------- a minimal DOM: enough for the panes and CSS2DObject ----------
class Node {
  constructor() { this.childNodes = []; this.parentNode = null; }
  get children() { return this.childNodes.filter(c => c instanceof Element); }
  append(...kids) {
    for (const k of kids) {
      const n = k instanceof Node ? k : new Text(String(k));
      n.parentNode = this;
      this.childNodes.push(n);
    }
  }
  remove() { if (this.parentNode) this.parentNode.childNodes = this.parentNode.childNodes.filter(c => c !== this); this.parentNode = null; }
  get textContent() { return this.childNodes.map(c => c.textContent).join(""); }
  set textContent(v) { this.childNodes = []; if (v !== "" && v != null) this.append(new Text(String(v))); }
}
class Text extends Node {
  constructor(v) { super(); this.data = v; }
  get textContent() { return this.data; }
}
class Element extends Node {
  constructor(tag) {
    super();
    this.tagName = tag.toUpperCase(); this.attributes = new Map();
    this.style = { setProperty(k, v) { this[k] = v; } };
    this.ownerDocument = globalThis.document;
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  set className(v) { this.setAttribute("class", v); }
  get className() { return this.getAttribute("class") || ""; }
  get isConnected() { return false; }
  get offsetWidth() { return 0; }
}
globalThis.document = { createElement: tag => new Element(tag), defaultView: { Element } };

const THREE = await import("../vendor/three.module.min.js");
const { createBlockText, refKey, paneText, paneLines, PANE } = await import("../block-text.js");
const { STRATA } = await import("../panels.js");
const flush = () => new Promise(r => setImmediate(r));

// One world unit is one CSS pixel: an orthographic camera over x 0..W, y 0..H, looking down -z at the
// face (normal +z). With yScale 1 a band of n tokens is n px tall.
function view(W = 1000, H = 1000, insets = {}) {
  const camera = new THREE.OrthographicCamera(0, W, H, 0, 0.1, 1000);
  camera.position.set(0, 0, 100);
  camera.updateMatrixWorld();
  return { camera, viewport: { width: W, height: H, insets: { top: 0, right: 0, bottom: 0, left: 0, ...insets } } };
}
const geom = { yScale: 1, tread: () => [498, 502], z: () => 0 };
const OUTSIDE = STRATA.findIndex(s => s.key === "outside");
// A band per [y0, y1], each on its own block with a fetchable ref.
function scene(spans, { flags = 16, label = i => `file ${i}`, kind = "outside" } = {}) {
  const blocks = spans.map((_, i) => ({ i, kind, label: label(i), ref: { file: 0, offset: i * 100, length: 90 } }));
  const bands = spans.map(([y0, y1], i) => ({ b: i, blockIndex: i, stratum: STRATA.findIndex(s => s.key === kind), y0, y1, flags }));
  return { agent: { id: "a", blocks }, bands };
}
function setup({ getText = () => Promise.resolve("the words of a block"), maxPanes } = {}) {
  const group = new THREE.Group();
  const bt = createBlockText({ getText, group, ...(maxPanes ? { maxPanes } : {}) });
  return { bt, group };
}
const shown = group => group.children.filter(o => o.visible);
const caption = o => o.element.children[0].textContent;
const body = o => o.element.children[1].textContent;

test("block text: the pool never grows past 24 panes, however many bands qualify", async () => {
  const { bt, group } = setup();
  const { camera, viewport } = view(1000, 10000);
  const { agent, bands } = scene(Array.from({ length: 60 }, (_, k) => [k * 60, k * 60 + 60]));
  const r = bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.equal(r.candidates, 60, "every 60 px band qualifies");
  assert.equal(r.shown, 24);
  assert.equal(group.children.length, 24, "24 CSS2D objects, no more");
  assert.equal(shown(group).length, 24);
  // the pool is reused, not refilled, on the next pass and after clear()
  bt.update({ camera, agent, bands: bands.slice(10), geom, i: 0, viewport });
  bt.clear();
  assert.equal(shown(group).length, 0);
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.equal(group.children.length, 24);
  assert.equal(bt.stats().panes, 24);
  await flush();
  bt.dispose();
  assert.equal(group.children.length, 0, "dispose removes every pane");
});

test("block text: a band under 40 px on screen is hidden, one at 40 px or more is shown", () => {
  const { bt, group } = setup();
  const { camera, viewport } = view();
  const { agent, bands } = scene([[100, 139], [400, 441], [700, 740]]);
  for (const pxPerUnit of [undefined, 1]) {
    const r = bt.update({ camera, agent, bands, geom, i: 0, pxPerUnit, viewport });
    assert.equal(r.shown, 2);
    const ys = shown(group).map(o => o.position.y).sort((a, b) => a - b);
    assert.deepEqual(ys, [420.5, 720], "the 41 and 40 px bands, anchored at their centres");
  }
  // the anchor sits on the face at the tread centre, 0.3 in front of it
  const o = shown(group)[0];
  assert.equal(o.position.x, 500);
  assert.equal(o.position.z, PANE.faceZ);
  bt.dispose();
});

test("block text: panes hide when the face is seen from behind or the anchor is under the HUD", () => {
  const { bt, group } = setup();
  const { agent, bands } = scene([[100, 300], [600, 800]]);
  const { camera, viewport } = view();
  assert.equal(bt.update({ camera, agent, bands, geom, i: 0, viewport }).shown, 2);
  // behind the face: looking along +z
  const back = new THREE.OrthographicCamera(-1000, 0, 1000, 0, 0.1, 1000);
  back.position.set(0, 0, -100); back.lookAt(0, 0, 0); back.updateMatrixWorld();
  assert.equal(bt.update({ camera: back, agent, bands, geom, i: 0, viewport }).shown, 0);
  assert.equal(shown(group).length, 0);
  // a perspective camera behind the face as well
  const persp = new THREE.PerspectiveCamera(34, 1, 0.1, 4000);
  persp.position.set(500, 500, -900); persp.lookAt(500, 500, 0); persp.updateMatrixWorld();
  assert.equal(bt.update({ camera: persp, agent, bands, geom, i: 0, viewport }).shown, 0);
  persp.position.set(500, 500, 900); persp.lookAt(500, 500, 0); persp.updateMatrixWorld();
  assert.ok(bt.update({ camera: persp, agent, bands, geom, i: 0, viewport }).shown > 0, "and from the front it shows");
  // the top band's centre (y 700 -> 300 px down) sits under a 350 px top inset: only the other remains
  const hud = view(1000, 1000, { top: 350 });
  assert.equal(bt.update({ camera: hud.camera, agent, bands, geom, i: 0, viewport: hud.viewport }).shown, 1);
  assert.equal(shown(group)[0].position.y, 200);
  // a side panel covering the anchor's x hides everything
  const side = view(1000, 1000, { right: 520 });
  assert.equal(bt.update({ camera: side.camera, agent, bands, geom, i: 0, viewport: side.viewport }).shown, 0);
  bt.dispose();
});

test("block text: declutter keeps the tallest band where panes would overlap, and flips at the right edge", () => {
  const { bt, group } = setup();
  const { camera, viewport } = view();
  // a 45 px band right under a 100 px band: the 100 px band's 4-line pane fills it and meets the small
  // band's pane, so the tall one wins
  const { agent, bands } = scene([[300, 345], [345, 445], [800, 900]]);
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.deepEqual(shown(group).map(o => o.position.y).sort((a, b) => a - b), [395, 850]);
  // apart, both show
  const apart = scene([[100, 145], [345, 445]]);
  bt.update({ camera, agent: apart.agent, bands: apart.bands, geom, i: 0, viewport });
  assert.equal(shown(group).length, 2);
  // at the right edge a pane hangs to the left of its anchor
  const edge = { ...geom, tread: () => [898, 902] };
  bt.update({ camera, agent, bands, geom: edge, i: 0, viewport });
  assert.ok(shown(group).length > 0 && shown(group).every(o => o.center.x === 1));
  bt.dispose();
});

test("block text: the cache returns the same promise for the same ref, and at most 4 reads run at once", async () => {
  const calls = [];
  const getText = (agentId, ref) => new Promise((resolve, reject) => calls.push({ agentId, ref, resolve, reject }));
  const { bt } = setup({ getText });
  const ref = { file: 2, offset: 10, length: 40 };
  const p1 = bt.text("a", ref), p2 = bt.text("a", { ...ref });
  assert.equal(p1, p2, "same ref, same promise");
  assert.equal(calls.length, 1, "one read");
  // same line, different path: a different block (claude-code.js puts several on one row)
  const p3 = bt.text("a", { ...ref, path: ["attachment", "cliPrefix"] });
  assert.notEqual(p3, p1);
  assert.equal(calls.length, 2);
  for (let k = 0; k < 8; k++) bt.text("a", { file: 3, offset: k * 100, length: 50 });
  assert.equal(calls.length, 4, "4 reads in flight, the rest queued");
  assert.equal(bt.stats().queued, 6);
  calls[0].resolve({ text: "system prompt", mode: "literal" });
  calls[1].resolve("cli prefix");
  await flush();
  assert.equal(calls.length, 6, "each settled read frees a slot");
  assert.deepEqual(await p1, { text: "system prompt", note: false });
  assert.deepEqual(await p3, { text: "cli prefix", note: false });
  // a failed read also frees its slot, and shows as unavailable
  calls[2].reject(new Error("unknown file index 3"));
  await flush();
  assert.equal(calls.length, 7);
  assert.equal(bt.stats().inFlight, 4);
  for (const c of calls.slice(3)) c.resolve("x");
  await flush();
  for (const c of calls.slice(7)) c.resolve("x");
  await flush();
  assert.equal(calls.length, 10);
  assert.equal(bt.stats().inFlight, 0);
  assert.equal(bt.text("a", ref), p1, "still cached");
  assert.equal(calls.length, 10);
  bt.dispose();
});

test("block text: panes fetch through the cache, show the caption alone while loading, then the words", async () => {
  let pending = [];
  const getText = (agentId, ref) => new Promise(resolve => pending.push({ ref, resolve }));
  const { bt, group } = setup({ getText });
  const { camera, viewport } = view();
  const { agent, bands } = scene([[100, 300], [600, 800]], { label: i => (i ? "memory index" : "file") });
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.equal(pending.length, 2);
  const panes = shown(group).sort((a, b) => a.position.y - b.position.y);
  assert.equal(caption(panes[0]), "file · ≈ 200");
  assert.equal(caption(panes[1]), "memory index · ≈ 200");
  assert.equal(body(panes[0]), "", "loading: no spinner text");
  pending.find(q => q.ref.offset === 0).resolve("  line one\n\nline   two  ");
  await flush();
  assert.equal(body(panes[0]), "line one line two");
  // a second pass reads nothing again
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.equal(pending.length, 2);
  for (const q of pending) q.resolve("words");
  await flush();
  bt.dispose();
});

test("block text: text is cut to 400 characters ending in an ellipsis", async () => {
  const long = "word ".repeat(300);
  const { bt, group } = setup({ getText: () => Promise.resolve(long) });
  const { camera, viewport } = view();
  const { agent, bands } = scene([[100, 300]]);
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  await flush();
  const t = body(shown(group)[0]);
  assert.equal(t.length, 400);
  assert.ok(t.endsWith("…"));
  assert.equal(paneText("short").text, "short");
  assert.equal(paneText("x".repeat(400)).text.length, 400);
  assert.ok(!paneText("x".repeat(400)).text.endsWith("…"), "exactly 400 is not cut");
  bt.dispose();
});

test("block text: labels and text reach the DOM literally, through textContent only", async () => {
  const { bt, group } = setup({ getText: () => Promise.resolve("<img src=x onerror=alert(1)> & <i>words</i>") });
  const { camera, viewport } = view();
  const { agent, bands } = scene([[100, 300]], { label: () => "<b>bold</b>" });
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  await flush();
  const o = shown(group)[0];
  assert.equal(caption(o), "<b>bold</b> · ≈ 200");
  assert.equal(body(o), "<img src=x onerror=alert(1)> & <i>words</i>");
  const label = o.element.children[0].children[1], text = o.element.children[1];
  assert.equal(label.children.length, 0, "no element parsed out of the label");
  assert.equal(text.children.length, 0, "no element parsed out of the text");
  const src = readFileSync(new URL("../block-text.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /innerHTML|outerHTML|insertAdjacentHTML|DOMParser|createContextualFragment/);
  bt.dispose();
});

test("block text: blocks without a ref say they are not in the log; images say image", async () => {
  const seen = [];
  const { bt, group } = setup({ getText: (a, ref) => { seen.push(ref); return Promise.resolve(ref.offset === 200 ? "data:image/png;base64,iVBORw0KGgo=" : "words"); } });
  const { camera, viewport } = view();
  const { agent, bands } = scene([[0, 150], [200, 350], [400, 550], [700, 900]]);
  bands[0].flags = 0;                                  // no ref: nothing to read
  bands[1].flags = 16 | 64; bands[1].blockIndex = -1;  // the unlogged harness row
  bands[1].stratum = 0;
  agent.blocks[3].image = { w: 10, h: 10 };            // a known image: not read at all
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  await flush();
  const at = y => shown(group).find(o => o.position.y === y);
  assert.equal(body(at(75)), "not in the log");
  assert.equal(caption(at(275)), "Harness · ≈ 150");
  assert.equal(body(at(275)), "not in the log");
  assert.equal(body(at(475)), "image", "a data:image result");
  assert.equal(body(at(800)), "image", "a block known to be an image");
  assert.deepEqual(seen.map(r => r.offset), [200], "only the one block with unknown text is read");
  assert.match(at(75).element.children[1].className, /\bnote\b/);
  bt.dispose();
});

test("block text: a Harness part of another kind's block is named as the product's wording", () => {
  const { bt, group } = setup();
  const { camera, viewport } = view();
  const { agent, bands } = scene([[100, 300]], { kind: "you", label: () => "instructions file · ~/.claude/CLAUDE.md" });
  bands[0].stratum = 0;
  bt.update({ camera, agent, bands, geom, i: 0, viewport });
  assert.equal(caption(shown(group)[0]), "instructions file · ~/.cl… · product wording · ≈ 200");
  assert.equal(shown(group)[0].element.style["--c"], STRATA[0].color, "the rule takes the band's stratum colour");
  bt.dispose();
});

test("block text: rules for keys, lines and sizes", () => {
  assert.equal(refKey({ file: 1, offset: 5 }), "1:5");
  assert.notEqual(refKey({ file: 1, offset: 5, path: ["a"] }), refKey({ file: 1, offset: 5, path: ["b"] }));
  assert.notEqual(refKey({ file: 1, offset: 5, range: [0, 4] }), refKey({ file: 1, offset: 5, range: [4, 8] }));
  assert.equal(paneLines(40), 1);
  assert.equal(paneLines(46), 1);
  assert.equal(paneLines(64), 2);
  assert.equal(paneLines(1000), 5);
  assert.equal(paneText({ text: "" }).text, "(empty)");
  assert.equal(OUTSIDE >= 0, true);
});

// ---------- the CSS: sizes and contrast read from block-text.css ----------
const css = readFileSync(new URL("../block-text.css", import.meta.url), "utf8");
const rule = sel => {
  const m = new RegExp(`(^|\\n)${sel.replace(".", "\\.")}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(m, `${sel} is in block-text.css`);
  return m[2];
};
const hex = h => { const s = h.replace("#", ""); return [0, 2, 4, 6].slice(0, s.length / 2).map(k => parseInt(s.slice(k, k + 2), 16)); };
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test("block text CSS: pane text is at least 7:1 over #0d1720, painted at 92% or more", () => {
  const pane = rule(".word-pane");
  const token = name => { const m = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(pane); assert.ok(m, name); return hex(m[1]); };
  const bg = token("--word-bg");
  assert.deepEqual(bg, [0x0d, 0x17, 0x20]);
  const paint = /background:\s*(#[0-9a-fA-F]{8})\s*;/.exec(pane);
  assert.ok(paint, "an 8-digit hex background");
  const [r, g, b, a] = hex(paint[1]);
  assert.deepEqual([r, g, b], bg, "the background is the panel colour");
  assert.ok(a / 255 >= 0.92, `painted at ${(a / 255).toFixed(3)}`);
  assert.match(pane, /color:\s*var\(--word-ink\)/);
  assert.match(rule(".word-cap"), /color:\s*var\(--word-muted\)/);
  assert.match(rule(".word-body.note"), /color:\s*var\(--word-muted\)/);
  // over the panel, and over the panel composited on white (the worst case under the 8% that shows through)
  const over = c => bg.map((v, k) => (a / 255) * v + (1 - a / 255) * c[k]);
  for (const ink of ["--word-ink", "--word-muted"]) {
    for (const under of [bg, over([255, 255, 255]), ...STRATA.map(s => over(hex(s.color)))]) {
      const c = contrast(token(ink), under);
      assert.ok(c >= 7, `${ink} at ${c.toFixed(2)}:1`);
    }
  }
  assert.doesNotMatch(css, /opacity/, "no opacity on text");
});

test("block text CSS: 13 px body, 11.5 px caption, whole even pixel heights mirrored in PANE", () => {
  const pane = rule(".word-pane"), cap = rule(".word-cap"), body = rule(".word-body");
  assert.match(pane, /font:\s*13px\/18px/);
  assert.match(cap, /font:\s*600 11\.5px\/16px/);
  assert.match(pane, /max-width:\s*46ch/);
  assert.match(body, /-webkit-line-clamp:\s*var\(--lines, 5\)/);
  const pad = /padding:\s*(\d+)px \d+px (\d+)px/.exec(pane);
  assert.equal(Number(pad[1]) + Number(pad[2]) + 16, PANE.chromePx, "caption line + padding");
  assert.equal(Number(/margin-top:\s*(\d+)px/.exec(body)[1]), PANE.bodyGapPx);
  assert.equal(PANE.linePx, 18);
  for (let n = 0; n <= 5; n++) assert.equal((PANE.chromePx + (n ? PANE.bodyGapPx + n * PANE.linePx : 0)) % 2, 0, "even: a centred pane lands on whole pixels");
  assert.doesNotMatch(css, /font-smoothing/, "no antialiasing override at dpr 1");
});
