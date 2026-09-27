// The harness layer's view: what the harness put in front of the model, drawn as a wiring board.
// Each piece of harness text is a wire. It runs from where its text is anchored (the origin rail), through
// a clamp for what put it there (its trigger), fans out to the agents that got it (one pin per agent, in
// birth order) and ends in marks on the timeline (the when-plane). A request's assembly is a rack of plates
// in log order, each wired back to its piece's terminal. Everything product-specific comes from the model
// (pieces.js), so the same view serves Claude Code and Codex/ChatGPT.
//
//   createHarnessView({ container, onPick }) -> { setModel, show, hide, sync, playhead, dispose, setPreset }
//
// Trace's selection drives the layer through sync(); a click on a wire, label or plate calls
// onPick(agentId, blockIndex), which the app hands to A.openBlockAt. The layer renders on demand into its
// own canvas and does no work while hidden. The pure layout functions are exported for the tests.
import * as THREE from "../vendor/three.module.min.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";

// ---------- rungs and words ----------
export const RUNG_CLASS = { linked: "linked", "linked-type-text-differs": "typed", "in-library-unlinked": "unlinked",
  "binary-only": "unnamed", composite: "composite", outside: "outside", "found-nowhere": "loose" };
export const RUNG_ORDER = { "found-nowhere": 0, "binary-only": 1, "in-library-unlinked": 2, "linked-type-text-differs": 3, composite: 4, outside: 5, linked: 6 };
// Binary-only comes from the shipped literal index (hashes plus chunk or file and offset): the piece's text is in
// the binary at that place and in no library record. Anything without a literal match reads "not in the library";
// the view never claims a piece is found nowhere.
export const hasLiterals = model => model.literals === true || model.pieces.some(p => p.rung === "binary-only");
const num = n => Number(n).toLocaleString("en-US");
// What kind of place holds a binary-only piece's text: a CLI or app binary, a desktop app bundle (app.asar), or a
// source tree (file:line). `where.kind` says so; an older model without it is read from the shelf name, else "binary".
export const whereKind = w => w?.kind || (/app\.asar|bundle/i.test(w?.shelf || "") ? "bundle" : /\bsource\b/i.test(w?.shelf || "") ? "source" : "binary");
const PLACE = { binary: "in the binary", bundle: "in the app bundle", source: "in the source" };
// Where a piece's text lives, in words: "in the binary: chunk-x.js @ 190,114,848", "in the app bundle: main.js @ 1,057,472",
// "in the source: codex-rs/x.rs:41".
export function whereText(p) {
  const w = p.where; if (!w) return null;
  if (p.rung === "binary-only") {
    const kind = whereKind(w), at = kind === "source" ? (Number.isFinite(w.pos) ? `:${w.pos}` : "") : Number.isFinite(w.pos) ? ` @ ${num(w.pos)}` : "";
    return `${PLACE[kind] || PLACE.binary}: ${w.key ?? w.shelf}${at}`;
  }
  return w.label ?? `${w.key ?? ""}${Number.isFinite(w.pos) ? ` @ ${num(w.pos)}` : ""}`;
}
export function rungWords(model) {
  const lib = model.libName || "library";
  return {
    "found-nowhere": `not in the ${lib} library`,
    "binary-only": "in the binary",
    "in-library-unlinked": `in the ${lib} library; Trace's own link misses it`,
    "linked-type-text-differs": "linked by type; the text differs",
    composite: "composite: a harness wrapper around other text",
    outside: "outside any binary",
    linked: `linked to a ${lib} record`,
  };
}
const ORIGIN = { file: "your files", mcp: "MCP servers", hook: "hook", agent: "agent output", service: "model service", partial: "composite" };
const originWord = o => ORIGIN[o] || String(o || "outside");
const TRIG = { "agent birth": "at agent birth", "every request": "every request", "every turn": "every turn", compaction: "after compaction",
  "a file changed on disk": "file changed on disk", "model worked silently": "silence timer", "you typed mid-turn": "user typed mid-turn" };
const trigWord = t => TRIG[t] || t || "mid-session";
const vehicleStripes = via => (via || []).some(([v]) => /tool/i.test(v)) ? 1 : (via || []).some(([v]) => /user|your turn/i.test(v)) ? 2 : 0;
const fmtMin = m => m < 60 ? `+${Math.round(m)} m` : `+${(m / 60).toFixed(m < 600 ? 1 : 0)} h`;
const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------- the hero: the least explained piece that reads like an instruction ----------
// Formatting headers ("Wall time: 0.9 seconds Output:", "## My request:", an image marker) are real finds but
// make a banal first screen; a sentence that tells the model what to do is the headline.
const CUES = /\b(you|your|do not|don't|must|should|never|always|use|treat|prefer|follow|continue|avoid|make sure|only|instead|remember|note that|keep)\b/gi;
export function instructionScore(text) {
  const t = String(text || "").replace(/<[^>]{0,80}>/g, " ").replace(/\s+/g, " ").trim();
  // Natural language has runs of lowercase words; headers, markers and paths don't.
  if (!/\b[a-z]{2,}'?[a-z]* [a-z]{2,}'?[a-z]* [a-z]{2,}\b/.test(t) || (t.match(/[A-Za-z][a-z']{1,}/g) || []).length < 6) return 0.05;
  const cues = Math.min(3, (t.match(CUES) || []).length);
  const sentence = /[a-z]{3,}[^.!?]{8,}[.!?]/.test(t) ? 0.15 : 0;
  return Math.min(1, 0.55 + 0.1 * cues + sentence);
}
const RUNG_WEIGHT = { "found-nowhere": 1, "binary-only": 1, "in-library-unlinked": 0.35, "linked-type-text-differs": 0.25 };
export function pickHero(model) {
  let best = null, bestScore = -1;
  for (const p of model.pieces) {
    const s = (RUNG_WEIGHT[p.rung] ?? 0.08) * p.reach * Math.log(p.n + 1) * instructionScore(p.sample);
    if (s > bestScore) { best = p; bestScore = s; }
  }
  return best;
}

// ---------- layout (pure: numbers only) ----------
export const X = { rail: -8.6, lane: -7.1, clamp: -4.1, fan: -0.55, pins: 3.25, t0: 3.9, t1: 8.75 };
export const BOARD = { x0: -10.45, x1: 9.3, z0: -6.25, z1: 7.05 };
const ZMIN = -5.8, ZMAX = 6.3;
const rad = p => 0.042 + 0.02 * Math.log10(p.n + 1);
export function layoutBoard(model) {
  const agents = model.agents, NA = agents.length;
  const P = model.pieces.map((p, i) => ({ ...p, i, cls: RUNG_CLASS[p.rung] || "linked", rec: new Set(p.ev.map(e => e[0])) }));
  const order = agents.map((a, i) => i).sort((a, b) => agents[a].kind === "root" ? -1 : agents[b].kind === "root" ? 1 : agents[a].born - agents[b].born);
  const rank = new Map(order.map((ai, r) => [ai, r]));
  const pinZ = ai => NA === 1 ? 0.2 : 5.55 - rank.get(ai) * (11.0 / (NA - 1));
  const minutes = Math.max(1, model.session.minutes || 1);
  const tX = m => X.t0 + (Math.max(0, Math.min(minutes, m)) / minutes) * (X.t1 - X.t0);

  // Origin zones, back to front: no anchor, the origin rail (shelves), outside any binary, unmatched.
  const shelves = (model.shelves || []).map(s => s.name);
  const loose = P.filter(p => p.cls === "loose");
  const outside = P.filter(p => p.cls === "outside");
  const railed = P.filter(p => p.cls !== "loose" && p.cls !== "outside" && p.where && p.where.shelf)
    .sort((a, b) => shelves.indexOf(a.where.shelf) - shelves.indexOf(b.where.shelf) || String(a.where.key).localeCompare(String(b.where.key)) || (a.where.pos || 0) - (b.where.pos || 0));
  const page = P.filter(p => p.cls !== "loose" && p.cls !== "outside" && !(p.where && p.where.shelf));
  const outOrigins = [...new Set(outside.map(p => p.origin))].sort();
  const pageH = page.length ? Math.min(2.2, page.length * 0.26) + 0.4 : 0;
  const outH = outOrigins.length ? outOrigins.length * 0.42 + 0.45 : 0;
  const looseH = loose.length ? Math.min(2.6, Math.ceil(loose.length / 2) * 0.3) + 0.5 : 0;
  const railH = Math.max(1.2, ZMAX - ZMIN - pageH - outH - looseH - (railed.length ? 0.5 : 0));
  const zones = {};
  let z = ZMIN;
  if (page.length) { zones.page = [z, z + pageH - 0.4]; page.forEach((p, k) => { p.kind = "page"; p.zs = z + (pageH - 0.4) * (page.length > 1 ? k / (page.length - 1) : 0.5); }); z += pageH; }
  const shelfSpan = {};
  if (railed.length) {
    zones.rail = [z, z + railH];
    const gaps = new Set(railed.map(p => p.where.shelf)).size - 1;
    const step = railH / Math.max(1, railed.length - 1 + gaps * 1.6);
    let zz = z, prev = null;
    for (const p of railed) { if (prev && p.where.shelf !== prev) zz += step * 1.6; p.kind = "rail"; p.zs = zz; (shelfSpan[p.where.shelf] ||= [zz, zz])[1] = zz; prev = p.where.shelf; zz += step; }
    z += railH + 0.5;
  }
  const outZ = {};
  if (outOrigins.length) {
    zones.outside = [z, z + outOrigins.length * 0.42];
    outOrigins.forEach((o, k) => { outZ[o] = z + 0.19 + k * 0.42; });
    const perOrigin = {};
    for (const p of outside) { p.kind = "outside"; const k = perOrigin[p.origin] = (perOrigin[p.origin] || 0) + 1; p.zs = outZ[p.origin] + ((k - 1) % 6) * 0.05 - 0.12; }
    z += outH;
  }
  if (loose.length) {
    zones.loose = [z, Math.min(ZMAX, z + looseH - 0.4)];
    const rows = Math.ceil(loose.length / 2), step = rows > 1 ? (zones.loose[1] - zones.loose[0]) / (rows - 1) : 0;
    loose.forEach((p, k) => { p.kind = "loose"; p.zs = zones.loose[0] + Math.floor(k / 2) * step; p.lx = X.rail - 0.25 + (k % 2) * 0.5; });
  }
  // Lanes: every wire gets its own lane, in origin order, before the clamps.
  const byZ = [...P].sort((a, b) => a.zs - b.zs || a.i - b.i);
  byZ.forEach((p, k) => { p.zl = byZ.length > 1 ? -5.6 + k * (11.6 / (byZ.length - 1)) : 0; p.lane = k; });
  // Clamps: one per trigger, in the data's own words, ordered by the lanes that feed them.
  const trig = new Map();
  for (const p of P) { const t = p.trigger || "mid-session"; p.tg = t; if (!trig.has(t)) trig.set(t, []); trig.get(t).push(p); }
  const T = [...trig.entries()].map(([name, ws]) => ({ name, ws, mz: ws.reduce((s, w) => s + w.zl, 0) / ws.length })).sort((a, b) => a.mz - b.mz);
  const tw = T.map(t => 0.34 + Math.sqrt(t.ws.length) * 0.3), twSum = tw.reduce((a, b) => a + b, 0);
  { let zz = -5.45; const gap = T.length > 1 ? (11.1 - twSum) / (T.length - 1) : 0; T.forEach((t, k) => { t.z = T.length > 1 ? zz + tw[k] / 2 : 0; zz += tw[k] + gap; }); }
  for (const t of T) {
    t.ws.sort((a, b) => a.zl - b.zl);
    const R = Math.max(...t.ws.map(rad)) * 2.25;
    const slots = [[0, 0]];
    for (let ring = 1; slots.length < t.ws.length; ring++) for (let k = 0; k < 6 * ring; k++) { const a = k / (6 * ring) * Math.PI * 2; slots.push([Math.cos(a) * ring * R, Math.sin(a) * ring * R]); }
    const s = slots.slice(0, t.ws.length).sort((a, b) => a[0] - b[0]);
    t.ws.forEach((w, k) => { w.off = s[k]; w.trig = t; });
    t.r = (t.ws.length > 1 ? Math.max(...s.map(v => Math.hypot(v[0], v[1]))) : 0) + Math.max(...t.ws.map(rad)) + 0.03;
  }
  // Fans: one per trigger x rung x recipient set, so a shared fan means the same agents got it the same way.
  const G = new Map();
  for (const p of P) { const key = `${p.tg}|${p.cls}|${[...p.rec].sort((a, b) => a - b).join(",")}`; if (!G.has(key)) G.set(key, { ws: [], rec: p.rec, cls: p.cls, t: p.trig }); G.get(key).ws.push(p); }
  for (const t of T) { const gs = [...G.values()].filter(g => g.t === t); gs.forEach((g, k) => { g.z = t.z + (k - (gs.length - 1) / 2) * 0.2; }); }
  for (const g of G.values()) for (const w of g.ws) w.g = g;
  return { P, T, G: [...G.values()], NA, agents, order, rank, pinZ, tX, minutes, shelves, shelfSpan, zones, outOrigins, railed, byId: new Map(P.map(p => [p.id, p])) };
}

// ---------- requests: births, later, racks ----------
const windowOf = (trace, ai, ri) => { const w = trace?.agents?.[ai]?.requests?.[ri]?.window; return w && w[0] >= 0 ? w : null; };
// The pieces an agent received at birth: its first two requests.
export function birthSet(model, trace, ai) {
  const ws = [windowOf(trace, ai, 0), windowOf(trace, ai, 1)].filter(Boolean), out = new Set();
  for (const p of model.pieces) if ((p.blocks || []).some(([a, b]) => a === ai && ws.some(w => b >= w[0] && b <= w[1]))) out.add(p.id);
  return out;
}
// The main thread's request right after its first compaction, else its middle request.
export function laterRequest(model, trace) {
  const ai = Math.max(0, model.agents.findIndex(a => a.kind === "root"));
  const a = trace?.agents?.[ai]; const reqs = a?.requests || [];
  const c = (a?.compactions || [])[0];
  if (c) {
    let r = reqs.findIndex(q => q.window && q.window[0] <= c.block && q.window[1] >= c.block);
    if (r < 0) r = reqs.findIndex(q => q.t >= c.t);
    if (r >= 0) return { agent: ai, req: r };
  }
  return { agent: ai, req: Math.max(0, Math.floor(reqs.length / 2)) };
}
// The subagent to compare against: the one Trace has selected, else the first subagent with requests.
export function compareAgent(model, trace, focusAgent) {
  const ok = ai => ai != null && model.agents[ai] && model.agents[ai].kind !== "root" && (trace?.agents?.[ai]?.requests || []).length;
  if (ok(focusAgent)) return focusAgent;
  const i = model.agents.findIndex((a, ai) => a.kind === "subagent" && ok(ai));
  return i >= 0 ? i : null;
}
// A plate as the view reads it, whatever the builder called the fields.
export function normPlate(pl) {
  const piece = pl.piece ?? pl.pieceId ?? pl.shape ?? null;
  const core = !!(pl.core || pl.kind === "conversation" || piece == null);
  return { piece: core ? null : piece, core, n: pl.n ?? pl.count ?? 1, excerpt: pl.excerpt ?? pl.text ?? "", block: pl.block ?? (pl.blocks ? pl.blocks[0] : null), label: pl.label, more: !!pl.more };
}
const CAP = 44;
function capPlates(plates) {
  if (plates.length <= CAP) return plates;
  return [...plates.slice(0, CAP - 1), { core: true, more: true, n: plates.slice(CAP - 1).filter(q => !q.core).length }];
}

// ---------- camera presets ----------
export const PRESETS = {
  session: { p: [-1.75, 25.9, 19.9], t: [-1.75, 0, -0.75], fov: 30 },
  hero: { p: [-5.2, 9.6, 17.8], t: [-0.6, 0.1, 0.4], fov: 33, dof: 0.0012 },
  close: { p: [-5.2, 2.5, 3.9], t: [-8.5, 0.3, 0.1], fov: 34, dof: 0.003 },
  rack: { p: [-3.6, 7.6, 9.6], t: [-3.0, 5.25, -7.4], fov: 32 },
  later: { p: [-3.6, 7.6, 9.6], t: [-3.0, 5.25, -7.4], fov: 32 },
  compare: { p: [0.0, 7.2, 9.9], t: [0.0, 4.35, -7.4], fov: 32 },
};
export const PRESET_NAMES = ["hero", "session", "rack", "later", "compare", "close"];
// Rack views frame what was built: the preset gives the direction, the racks' height and width the distance.
export function fitRacks(name, racks, fraction = 1) {
  const c = PRESETS[name]; if (!racks.length) return c;
  const H = Math.max(...racks.map(r => r.userData.H)), xs = racks.map(r => r.userData.x0);
  const t = [(Math.min(...xs) + Math.max(...xs)) / 2, 0.9 + H / 2, -7.6];
  const dir = new THREE.Vector3(...c.p).sub(new THREE.Vector3(...c.t)).normalize();
  const half = Math.max(H / 2 + 0.7, (Math.max(...xs) - Math.min(...xs) + 6.8) / 2 / 1.6);
  const d = half / Math.tan(THREE.MathUtils.degToRad(c.fov / 2)) / Math.max(0.3, fraction) * 1.05;
  return { ...c, t, p: [t[0] + dir.x * d, t[1] + dir.y * d, t[2] + dir.z * d] };
}
const PRESET_LABEL = { hero: "Hero", session: "Session", rack: "One request", later: "Later", compare: "Compare", close: "Close-up" };

// ---------- colours and materials ----------
const NEUTRALS = [0x8e8a82, 0x74828f, 0x9a948a, 0x7c8a7c, 0x8a8078, 0x6f7f92, 0xa3a09a];
const HUE = { unnamed: 0xd92c16, loose: 0xd92c16, unlinked: 0xf09c16, typed: 0xcdb074, composite: 0xb4b8bd };
const OUTHUE = { file: 0xe4d9c0, mcp: 0x2ea394, hook: 0xc4773f, agent: 0x8fa7c9, service: 0x9aa0b8, partial: 0xb4b8bd };
const FANCOL = { linked: 0x6e6b66, typed: 0x8a7d60, composite: 0x6e6b66, outside: 0x6f6a5f, unlinked: 0xf09c16, unnamed: 0xd92c16, loose: 0xd92c16 };
const PLATE = { linked: [0x9c8a66, 1, 0.42], typed: [0x9c7a4c, 1, 0.55], unlinked: [0x5d4a2c, 1, 0.45], unnamed: [0x2c3b52, 1, 0.3], loose: [0x2a1512, 0.2, 0.3], outside: [0xe2d8c2, 0, 0.85], composite: [0xa9adb2, 1, 0.3], core: [0x3a3632, 0.2, 0.7], shared: [0x3c3934, 0.4, 0.6] };
const TAB = { unnamed: 0xff3a1c, loose: 0xff3a1c, unlinked: 0xffa21a, typed: 0xd8bc82, outside: 0xf1e8d4, linked: 0x7d7a74, composite: 0x7d7a74 };
const CSS_COL = { unnamed: "#ff5236", loose: "#ff5236", unlinked: "#f2a93a", typed: "#d8bc82", outside: "#e6dcc6", linked: "#cfc9bc", composite: "#cfc9bc" };
const phys = o => new THREE.MeshPhysicalMaterial(o);
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);

function merge(geos, extra) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni), ex = {};
  for (const k in extra || {}) ex[k] = new Float32Array(nv * extra[k].size);
  let v = 0, i = 0;
  geos.forEach((g, gi) => {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, v * 3); nor.set(g.attributes.normal.array, v * 3); uv.set(g.attributes.uv.array, v * 2);
    const ix = g.index.array; for (let k = 0; k < ix.length; k++) idx[i + k] = ix[k] + v;
    for (const k in extra || {}) { const { size, values } = extra[k]; const val = values[gi]; for (let q = 0; q < n; q++) for (let c = 0; c < size; c++) ex[k][(v + q) * size + c] = Array.isArray(val) ? val[c] : val; }
    v += n; i += ix.length; g.dispose();
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3)); out.setAttribute("normal", new THREE.BufferAttribute(nor, 3)); out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  for (const k in ex) out.setAttribute(k, new THREE.BufferAttribute(ex[k], extra[k].size));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
// Wires carry their piece index (aId), colour (aCol) and vehicle stripes (aStripe); selection dims the rest in the shader.
function selectable(m, SEL) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uSel = SEL; sh.uniforms.uDim = { value: new THREE.Color(0x30353b) };
    sh.vertexShader = "attribute float aId; attribute vec3 aCol; attribute vec2 aStripe; varying float vId; varying vec3 vCol; varying vec2 vUv2; varying vec2 vStripe;\n" +
      sh.vertexShader.replace("#include <uv_vertex>", "#include <uv_vertex>\n vId = aId; vCol = aCol; vUv2 = uv; vStripe = aStripe;");
    sh.fragmentShader = "uniform float uSel; uniform vec3 uDim; varying float vId; varying vec3 vCol; varying vec2 vUv2; varying vec2 vStripe;\n" +
      sh.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb = vCol;
        if (vStripe.x > 0.5) { float s = fract(vUv2.x * vStripe.y + vUv2.y); float band = smoothstep(0.0, 0.02, s) * (1.0 - smoothstep(0.1, 0.12, s));
          if (vStripe.x > 1.5) { float s2 = fract(s + 0.5); band = max(band, smoothstep(0.0, 0.02, s2) * (1.0 - smoothstep(0.1, 0.12, s2))); }
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05), band); }
        if (uSel > -0.5 && abs(vId - uSel) > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uDim, 0.9);`)
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n if (uSel > -0.5 && abs(vId - uSel) < 0.5) totalEmissiveRadiance += vCol * 0.22;");
  };
  return m;
}
function inst(group, name, geo, m, list) {
  const im = new THREE.InstancedMesh(geo, m, Math.max(1, list.length));
  list.forEach((o, k) => { _m.compose(o.p, o.q || _q, o.s || _s); im.setMatrixAt(k, _m); if (o.c != null) im.setColorAt(k, new THREE.Color(o.c)); });
  im.count = list.length; im.castShadow = im.receiveShadow = true; im.name = name; group.add(im); return im;
}
function bar(group, x, z0, z1, m, h = 0.3, w = 0.5) {
  const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, Math.max(0.05, z1 - z0), 3, 0.06), m);
  b.position.set(x, h / 2, (z0 + z1) / 2); b.castShadow = b.receiveShadow = true; group.add(b); return b;
}
function fanGeos(L, z0, rec, r, y0 = 0.34) {
  return [...rec].map(ai => {
    const zp = L.pinZ(ai) + (Math.abs(L.pinZ(ai) - z0) < 1e-3 ? 1e-3 : 0);
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(X.fan, y0, z0), new THREE.Vector3(X.fan + 1.6, y0 - 0.02, z0 + (zp - z0) * 0.25), new THREE.Vector3(X.pins - 1.3, 0.3, zp), new THREE.Vector3(X.pins - 0.2, 0.28, zp)], false, "centripetal"), 36, r, 5, false);
  });
}
function wirePath(p) {
  const r = rad(p), t = p.trig, pts = [], y = 0.34 + (p.lane % 4) * 0.045;   // staggered so neighbours leaving one shelf don't interpenetrate
  if (p.kind === "loose") {
    p.end = new THREE.Vector3(p.lx, r, p.zs);
    pts.push(p.end.clone(), new THREE.Vector3(X.rail + 0.6, r + 0.02, p.zs + 0.05), new THREE.Vector3(X.lane - 0.4, y * 0.7, p.zl));
  } else {
    const lift = p.cls === "unlinked" ? 0.62 : 0.36;   // amber: hovers over a record Trace never linked
    p.end = new THREE.Vector3(X.rail, lift, p.zs);
    pts.push(p.end.clone(), new THREE.Vector3(X.rail + 0.25, lift + 0.08, p.zs), new THREE.Vector3(X.rail + 1.1, y + 0.05, p.zs + (p.zl - p.zs) * 0.2));
  }
  pts.push(new THREE.Vector3(X.lane, y, p.zl), new THREE.Vector3(X.clamp - 2.3, y, t.z + p.off[0] * 1.6), new THREE.Vector3(X.clamp - 0.35, y + p.off[1], t.z + p.off[0]),
    new THREE.Vector3(X.clamp + 0.35, y + p.off[1], t.z + p.off[0]), new THREE.Vector3(X.clamp + 2.0, y, t.z + p.off[0] * 1.4),
    new THREE.Vector3(X.fan - 0.25, y, p.g.z + p.off[0] * 0.3), new THREE.Vector3(X.fan, y, p.g.z));
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
}

// The board: rail, zones, wires, clamps, fans, pins and the when-plane. Pure three.js, no DOM (the
// silkscreen texture is attached by the live view).
export function buildBoard(L, SEL) {
  const g = new THREE.Group(); g.name = "hv:board";
  const brass = phys({ color: 0xc09a5b, metalness: 1, roughness: 0.3, clearcoat: 0.3 });
  const steel = phys({ color: 0x9aa0a6, metalness: 1, roughness: 0.34 });
  const anod = phys({ color: 0x2e3a48, metalness: 0.8, roughness: 0.42 });
  const paper = phys({ color: 0xd9ceb4, roughness: 0.85, sheen: 0.4 });
  const black = phys({ color: 0x121110, metalness: 0.3, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const { zones } = L;
  const slab = new THREE.Mesh(new RoundedBoxGeometry(BOARD.x1 - BOARD.x0, 0.5, BOARD.z1 - BOARD.z0, 4, 0.12), phys({ color: 0x1f1c19, roughness: 0.65, metalness: 0.15 }));
  slab.position.set((BOARD.x0 + BOARD.x1) / 2, -0.252, (BOARD.z0 + BOARD.z1) / 2); slab.receiveShadow = slab.castShadow = true; slab.name = "hv:slab"; g.add(slab);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(BOARD.x1 - BOARD.x0 - 0.1, BOARD.z1 - BOARD.z0 - 0.1), phys({ color: 0x2a2724, roughness: 0.74, clearcoat: 0.25, clearcoatRoughness: 0.55 }));
  top.rotation.x = -Math.PI / 2; top.position.set((BOARD.x0 + BOARD.x1) / 2, 0.001, (BOARD.z0 + BOARD.z1) / 2); top.receiveShadow = true; top.name = "hv:silkscreen"; g.add(top);
  if (zones.rail) bar(g, X.rail, zones.rail[0] - 0.2, zones.rail[1] + 0.15, brass);
  if (zones.page) bar(g, X.rail, zones.page[0] - 0.15, zones.page[1] + 0.15, brass);
  L.outOrigins.forEach(o => { const z = L.P.find(p => p.origin === o && p.kind === "outside")?.zs ?? 0; bar(g, X.rail, z - 0.07, z + 0.31, o === "file" ? paper : o === "hook" ? phys({ color: 0xb06a3a, metalness: 1, roughness: 0.35 }) : anod); });
  inst(g, "hv:screws", new THREE.CylinderGeometry(0.085, 0.085, 0.06, 20), steel, L.P.filter(p => p.kind !== "loose").map(p => ({ p: new THREE.Vector3(X.rail, 0.33, p.zs) })));
  inst(g, "hv:collars", new THREE.TorusGeometry(0.13, 0.035, 12, 28), phys({ color: 0xd92c16, roughness: 0.35, clearcoat: 1, emissive: 0x5a0a02 }),
    L.P.filter(p => p.cls === "unnamed" && p.kind === "rail").map(p => ({ p: new THREE.Vector3(X.rail, 0.33, p.zs), q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2) })));

  // wires: one merged mesh
  let nk = 0; const geos = [], attr = { aId: { size: 1, values: [] }, aCol: { size: 3, values: [] }, aStripe: { size: 2, values: [] } };
  const ferrules = [], coppers = [], tips = [];
  for (const p of L.P) {
    const curve = wirePath(p); p.curve = curve;
    const col = p.cls === "linked" ? NEUTRALS[nk++ % NEUTRALS.length] : p.cls === "outside" ? (OUTHUE[p.origin] ?? 0x9aa4ad) : HUE[p.cls];
    p.color = new THREE.Color(col);
    geos.push(new THREE.TubeGeometry(curve, 220, rad(p), 12, false));
    attr.aId.values.push(p.i); attr.aCol.values.push([p.color.r, p.color.g, p.color.b]); attr.aStripe.values.push([vehicleStripes(p.via), curve.getLength() * 2.2]);
    const a = curve.getPointAt(0.004), b = curve.getPointAt(0.012);
    ferrules.push({ p: a.clone(), q: new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()), s: new THREE.Vector3(rad(p) / 0.05, 1, rad(p) / 0.05), loose: p.kind === "loose" });
    if (p.kind === "loose") {   // frayed copper: the strands a crimp would have held
      const dir = curve.getPointAt(0).clone().sub(curve.getPointAt(0.01)).normalize();
      for (let k = 0; k < 9; k++) {
        const an = k / 9 * Math.PI * 2, sp = 0.28 + (k % 3) * 0.07, len = 0.16 + (k % 4) * 0.035;
        const d = dir.clone().add(new THREE.Vector3(Math.cos(an) * sp, Math.sin(an) * sp * 0.6 + 0.05, Math.sin(an) * sp)).normalize();
        const o = p.end.clone().add(new THREE.Vector3(Math.cos(an), Math.sin(an), 0).multiplyScalar(rad(p) * 0.45));
        coppers.push({ p: o.clone().add(d.clone().multiplyScalar(len / 2)), q: new THREE.Quaternion().setFromUnitVectors(UP, d), s: new THREE.Vector3(1, len / 0.2, 1) });
        tips.push({ p: o.clone().add(d.clone().multiplyScalar(len)) });
      }
    }
  }
  const wires = new THREE.Mesh(merge(geos, attr), selectable(phys({ color: 0xffffff, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.2, emissive: 0x000000 }), SEL));
  wires.castShadow = true; wires.receiveShadow = false; wires.name = "hv:wires"; wires.userData.count = L.P.length; g.add(wires);
  inst(g, "hv:ferrules", new THREE.CylinderGeometry(0.056, 0.056, 0.16, 18), brass, ferrules.filter(f => !f.loose));
  inst(g, "hv:ferrules-loose", new THREE.CylinderGeometry(0.056, 0.056, 0.16, 18), steel, ferrules.filter(f => f.loose));
  inst(g, "hv:strands", new THREE.CylinderGeometry(0.011, 0.013, 0.2, 6), phys({ color: 0xd58a4e, metalness: 1, roughness: 0.25 }), coppers);
  inst(g, "hv:tips", new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a1a08, emissive: 0xff8a3a, emissiveIntensity: 1.4 }), tips);
  inst(g, "hv:clamps", new THREE.TorusGeometry(1, 0.05, 14, 48), steel, L.T.flatMap(t => [0, 0.22].map(dx => ({ p: new THREE.Vector3(X.clamp + dx, 0.34, t.z), q: new THREE.Quaternion().setFromAxisAngle(UP, Math.PI / 2), s: new THREE.Vector3(t.r + 0.035, t.r + 0.035, 1) }))));
  for (const t of L.T) t.anchor = new THREE.Vector3(X.clamp + 0.11, 0.34 + t.r + 0.12, t.z);
  // fans, merged per rung family
  const fam = {};
  for (const gr of L.G) { (fam[gr.cls] ||= { geos: [], ids: [] }); for (const geo of fanGeos(L, gr.z, gr.rec, gr.rec.size > 20 ? 0.0085 : 0.014)) { fam[gr.cls].geos.push(geo); fam[gr.cls].ids.push(gr.ws.length === 1 ? gr.ws[0].i : -2); } }
  for (const f in fam) {
    const c = new THREE.Color(FANCOL[f]);
    const mesh = new THREE.Mesh(merge(fam[f].geos, { aId: { size: 1, values: fam[f].ids }, aCol: { size: 3, values: fam[f].ids.map(() => [c.r, c.g, c.b]) }, aStripe: { size: 2, values: fam[f].ids.map(() => [0, 0]) } }),
      selectable(phys({ color: 0xffffff, roughness: 0.45, clearcoat: 0.6, emissive: 0 }), SEL));
    mesh.castShadow = true; mesh.name = `hv:fan-${f}`; g.add(mesh);
  }
  for (const gr of L.G) gr.anchor = new THREE.Vector3(X.fan + 0.2, 0.5, gr.z);
  inst(g, "hv:sleeves", new THREE.CylinderGeometry(0.075, 0.075, 0.3, 18), black, L.G.map(gr => ({ p: new THREE.Vector3(X.fan, 0.34, gr.z), q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2) })));
  bar(g, X.pins, -5.7, 5.75, black, 0.36, 0.42);
  inst(g, "hv:pins", new THREE.CylinderGeometry(0.036, 0.036, 0.1, 10), brass, L.agents.map((a, ai) => ({ p: new THREE.Vector3(X.pins - 0.1, 0.4, L.pinZ(ai)), s: a.kind === "root" ? new THREE.Vector3(2.2, 1, 2.2) : _s })));
  // when-plane: every delivery as a mark in its agent's row, plus each agent's lifetime as a hairline
  const EV = []; for (const p of L.P) for (const e of p.ev) EV.push([p.i, e[0], e[1]]);
  const marks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.022, 0.02, 0.075), new THREE.MeshStandardMaterial({ roughness: 0.6 }), Math.max(1, EV.length));
  marks.count = EV.length; marks.name = "hv:marks"; marks.userData.EV = EV; g.add(marks);
  const life = L.agents.map((a, ai) => { const gg = new THREE.BoxGeometry(Math.max(0.01, L.tX(a.end) - L.tX(a.born)), 0.004, 0.012); gg.translate((L.tX(a.born) + L.tX(a.end)) / 2, 0.003, L.pinZ(ai)); return gg; });
  const lifeMesh = new THREE.Mesh(merge(life), new THREE.MeshStandardMaterial({ color: 0x5f5a52, roughness: 0.8 })); lifeMesh.name = "hv:lifetimes"; g.add(lifeMesh);
  const now = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 11.4), new THREE.MeshStandardMaterial({ color: 0x3a3226, emissive: 0xf3e6c8, emissiveIntensity: 0.9 }));
  now.position.set(X.t0, 0.03, 0); now.visible = false; now.name = "hv:now"; g.add(now);
  return g;
}

// One request's rack: plates in log order, material by rung, each wired back to its piece's terminal.
// `other` (a Set of piece ids) turns it into half of a compare: shared plates recede to graphite.
export function buildRack(L, rack, x0, SEL, { other = null, newSince = null } = {}) {
  const g = new THREE.Group(); g.name = "hv:rack";
  const plates = capPlates(rack.plates.map(normPlate));
  const RZ = -7.6, pitch = Math.min(0.245, 7.0 / Math.max(1, plates.length)), PH = pitch * 0.82, PG = pitch * 0.18;
  const H = plates.length * (PH + PG) + 0.4, top = 0.9 + H;
  const back = new THREE.Mesh(new RoundedBoxGeometry(6.2, H + 0.3, 0.14, 3, 0.05), phys({ color: 0x1d1b18, roughness: 0.55, metalness: 0.3, clearcoat: 0.4 }));
  back.position.set(x0, 0.9 + H / 2, RZ - 0.12); back.receiveShadow = true; g.add(back);
  const steel = phys({ color: 0x9aa0a6, metalness: 1, roughness: 0.34 });
  for (const dx of [-3.0, 3.0]) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H + 0.6, 16), steel); sp.position.set(x0 + dx, 0.9 + H / 2, RZ + 0.02); g.add(sp); }
  const items = [], byMat = {};
  plates.forEach((pl, k) => {
    const y = top - 0.3 - k * (PH + PG), piece = pl.piece != null ? (L.byId.get(pl.piece) ?? null) : null;
    const cls = pl.core ? "core" : piece ? piece.cls : "composite";
    const shared = !!(other && piece && other.has(piece.id));
    const fresh = !!(newSince && piece && !newSince.has(piece.id));
    const z = RZ + (shared ? 0 : other ? 0.16 : 0.06), w = pl.core ? 5.4 : 5.6, h = pl.core ? 0.03 : PH;
    (byMat[shared ? "shared" : cls] ||= []).push({ p: new THREE.Vector3(x0, y, z), s: new THREE.Vector3(w, h, 1) });
    items.push({ pl, piece, y, z, cls, shared, fresh, x0, h: PH });
  });
  const tabs = items.filter(it => !it.pl.core);
  inst(g, "hv:tabs", new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.5 }), tabs.map(it => ({ p: new THREE.Vector3(it.x0 - 2.93, it.y, it.z + 0.02), s: new THREE.Vector3(0.16, PH * 0.9, 0.13), c: it.shared ? 0x3c3934 : TAB[it.cls] ?? 0x7d7a74 })));
  for (const k in byMat) {
    const [c, metal, rough] = PLATE[k];
    inst(g, `hv:plates-${k}`, new RoundedBoxGeometry(1, 1, 0.1, 2, 0.02), phys({ color: c, metalness: metal, roughness: rough, clearcoat: k === "outside" ? 0 : 0.7, clearcoatRoughness: 0.25, sheen: k === "outside" ? 0.5 : 0, iridescence: k === "unnamed" ? 0.6 : 0 }), byMat[k]);
  }
  const geos = [], ids = [], cols = [];
  for (const it of items) {
    const p = it.piece; if (!p || it.shared || !p.end) continue;
    const a = new THREE.Vector3(it.x0 - 2.85, it.y, it.z + 0.05), end = p.end.clone();
    const c = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x - 0.8, a.y, a.z + 0.4), new THREE.Vector3((a.x + end.x) / 2 - 1, Math.max(0.9, a.y * 0.45), (a.z + end.z) / 2), new THREE.Vector3(end.x + 0.3, 0.9, end.z), end], false, "centripetal");
    geos.push(new THREE.TubeGeometry(c, 90, 0.018, 6, false)); ids.push(p.i); cols.push([p.color.r, p.color.g, p.color.b]);
  }
  if (geos.length) {
    const m = new THREE.Mesh(merge(geos, { aId: { size: 1, values: ids }, aCol: { size: 3, values: cols }, aStripe: { size: 2, values: ids.map(() => [0, 0]) } }), selectable(phys({ color: 0xffffff, roughness: 0.4, clearcoat: 1, emissive: 0 }), SEL));
    m.castShadow = true; m.name = "hv:rack-wires"; g.add(m);
  }
  g.userData = { items, rack, x0, H };
  return g;
}

// The room the board sits in: a cyclorama sweep, a plinth, warm key, cool rim, wall wash.
function buildRoom() {
  const g = new THREE.Group(); g.name = "hv:room";
  const pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI / 2; pts.push(new THREE.Vector2(-16 - Math.sin(a) * 9, -0.5 + (1 - Math.cos(a)) * 9)); }
  const prof = [new THREE.Vector2(30, -0.5), ...pts, new THREE.Vector2(-25, 26)];
  const geo = new THREE.BufferGeometry(), W = 90, pos = [], idx = [];
  prof.forEach((v, k) => { pos.push(-W / 2, v.y, v.x, W / 2, v.y, v.x); if (k) idx.push(2 * k - 2, 2 * k - 1, 2 * k, 2 * k - 1, 2 * k + 1, 2 * k); });
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const room = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x57524b, roughness: 0.92, side: THREE.DoubleSide })); room.receiveShadow = true; g.add(room);
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(22.5, 0.9, 15.2, 4, 0.2), phys({ color: 0x24211d, roughness: 0.6, metalness: 0.2, clearcoat: 0.3 }));
  plinth.position.set(-0.6, -0.96, 0.4); plinth.receiveShadow = plinth.castShadow = true; g.add(plinth);
  const key = new THREE.SpotLight(0xffe2bd, 900, 80, 0.52, 0.75, 1.6);
  key.position.set(-9, 26, 14); key.target.position.set(-1, 0, -0.5); g.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096); key.shadow.radius = 6; key.shadow.blurSamples = 16; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.camera.near = 8; key.shadow.camera.far = 60;
  const rim = new THREE.DirectionalLight(0x9fbcff, 0.9); rim.position.set(12, 9, -16); g.add(rim);
  const wall = new THREE.SpotLight(0xffc98f, 420, 70, 0.7, 1, 1.4); wall.position.set(4, 10, 6); wall.target.position.set(2, 6, -22); g.add(wall, wall.target);
  g.add(new THREE.HemisphereLight(0xe8e0d4, 0x1a1510, 0.28));
  return g;
}

// ---------- the view ----------
// Options beyond the interface: `rackFor` (defaults to pieces.js), `headless` (no DOM or WebGL; the tests).
export function createHarnessView({ container, onPick = () => {}, rackFor = null, headless = false } = {}) {
  const SEL = { value: -1 };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f0d0b);
  scene.fog = new THREE.FogExp2(0x15120f, 0.012);
  scene.add(buildRoom());
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 300);
  let model = null, trace = null, L = null, board = null, racks = [], hero = null, words = null;
  let preset = "session", sel = null, focusAgent = null, picked = null, rackKey = null, shown = false, pending = false, tween = null, disposed = false;
  let deferred = null, frames = 0;   // deferred: Trace's latest selection while hidden, applied on show()
  let renderer = null, controls = null, composer = null, bokeh = null, ro = null, root = null, canvas = null, overlay = null, svg = null, caption = null, nav = null, card = null, legend = null;
  let labs = [], clampTags = [], fanTags = [], plateEls = [], callouts = [];
  const getRackFor = async () => rackFor || (rackFor = (await import("./pieces.js")).rackFor);

  if (!headless) {
    root = document.createElement("div"); root.className = "hv"; root.hidden = true;
    canvas = document.createElement("canvas"); canvas.className = "hv-canvas";
    overlay = document.createElement("div"); overlay.className = "hv-labels";
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("class", "hv-leaders"); overlay.append(svg);
    caption = document.createElement("div"); caption.className = "hv-caption";
    nav = document.createElement("nav"); nav.className = "hv-nav"; nav.setAttribute("aria-label", "Harness layer views");
    card = document.createElement("div"); card.className = "hv-card"; card.hidden = true;
    legend = document.createElement("div"); legend.className = "hv-legend";
    root.append(canvas, overlay, caption, nav, legend, card);
    container.append(root);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
    controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.minPolarAngle = 0.2; controls.maxPolarAngle = 1.45;
    controls.addEventListener("change", requestRender);
    ro = new ResizeObserver(() => { if (shown) resize(); });
    ro.observe(root);
    canvas.addEventListener("click", onCanvasClick);
    import("../vendor/RoomEnvironment.js").then(({ RoomEnvironment }) => {
      if (disposed) return;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.42; pmrem.dispose(); requestRender();
    });
  }

  // ----- geometry of the screen the layer shares with Trace's chrome -----
  const cssNum = (name, dflt) => { if (!root) return dflt; const v = parseFloat(getComputedStyle(root).getPropertyValue(name)); return Number.isFinite(v) ? v : dflt; };
  const size = () => root ? [root.clientWidth, root.clientHeight] : [1600, 900];
  const insets = () => ({ right: cssNum("--side-w", 392) + 32, top: cssNum("--hv-top", 176), bottom: cssNum("--hv-bottom", 200) });
  function applyCamera(c) {
    const [w, h] = size(); if (!(w > 0 && h > 0)) return;
    camera.aspect = w / h; camera.fov = c.fov ?? camera.fov;
    const ins = insets(), capBottom = caption ? caption.offsetTop + caption.offsetHeight : ins.top;
    camera.setViewOffset(w, h, ins.right * 0.5, -Math.max(0, (capBottom - camBottom(ins)) * 0.5), w, h); camera.updateProjectionMatrix();
  }
  function resize() {
    const [w, h] = size(); if (!(w > 0 && h > 0) || !renderer) return;   // a hidden container reports 0x0: keep the last good size
    renderer.setSize(w, h, false); composer?.setSize(w, h); applyCamera({}); requestRender();
  }
  function goCam(name, instant) {
    const [, fh] = size(), ins = insets(), capBottom = caption ? caption.offsetTop + caption.offsetHeight : ins.top;
    const c = RACKED.has(name) ? fitRacks(name, racks, fh > 0 ? (fh - capBottom - camBottom(ins)) / fh : 1) : PRESETS[name] || PRESETS.session;
    const to = { p: new THREE.Vector3(...c.p), t: new THREE.Vector3(...c.t), fov: c.fov };
    if (instant || !controls) { camera.position.copy(to.p); (controls?.target || new THREE.Vector3()).copy(to.t); camera.lookAt(to.t); camera.fov = to.fov; applyCamera(c); controls?.update(); return; }
    tween = { from: { p: camera.position.clone(), t: controls.target.clone(), fov: camera.fov }, to, t0: performance.now(), dur: 1200 };
    requestRender();
  }
  // Racks stand centre-left, clear of the minimap's corner: they may use the height down to the playback bar.
  const RACKED = new Set(["rack", "later", "compare"]), camBottom = ins => RACKED.has(preset) ? Math.min(ins.bottom, 96) : ins.bottom;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // ----- rendering on demand -----
  function requestRender() { if (!renderer || !shown || pending || disposed) return; pending = true; requestAnimationFrame(frame); }
  function frame() {
    pending = false; if (!shown || disposed) return;
    frames++;
    if (tween) {
      const k = Math.min(1, (performance.now() - tween.t0) / tween.dur), e = ease(k);
      camera.position.lerpVectors(tween.from.p, tween.to.p, e); controls.target.lerpVectors(tween.from.t, tween.to.t, e);
      camera.fov = tween.from.fov + (tween.to.fov - tween.from.fov) * e; applyCamera({});
      if (k >= 1) tween = null; else requestRender();
    }
    if (controls.update()) requestRender();
    if (composer && PRESETS[preset]?.dof) composer.render(); else renderer.render(scene, camera);
    placeLabels();
  }
  async function ensurePost() {
    if (composer || !renderer) return;
    const [{ EffectComposer }, { RenderPass }, { BokehPass }, { OutputPass }] = await Promise.all([
      import("../vendor/EffectComposer.js"), import("../vendor/RenderPass.js"), import("../vendor/BokehPass.js"), import("../vendor/OutputPass.js")]);
    const [w, h] = size();
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 }));
    composer.addPass(new RenderPass(scene, camera));
    bokeh = new BokehPass(scene, camera, { focus: 12, aperture: 0.002, maxblur: 0.0065 }); composer.addPass(bokeh);
    composer.addPass(new OutputPass());
  }

  // ----- the silkscreen (axes and zone names printed on the board) -----
  function silkscreen() {
    if (!root || !L) return;
    const W = 4096, H = Math.round(W * (BOARD.z1 - BOARD.z0) / (BOARD.x1 - BOARD.x0));
    const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    const px = x => (x - BOARD.x0) / (BOARD.x1 - BOARD.x0) * W, pz = z => (z - BOARD.z0) / (BOARD.z1 - BOARD.z0) * H, s = W / (BOARD.x1 - BOARD.x0);
    const mono = getComputedStyle(root).getPropertyValue("--mono").trim() || "ui-monospace, Menlo, monospace";
    const ink = a => `rgba(234,228,216,${a})`;
    g.fillStyle = "#2a2724"; g.fillRect(0, 0, W, H); g.textBaseline = "middle";
    g.font = `500 ${0.3 * s}px ${mono}`; g.fillStyle = ink(0.6);
    for (const [x, t] of [[X.rail - 0.9, "WHERE IT CAME FROM"], [X.clamp - 1.2, "WHAT PUT IT THERE"], [X.pins - 1.5, "WHO GOT IT"], [X.t0 + 0.2, "WHEN"]]) g.fillText(t, px(x), pz(6.68));
    for (const p of L.railed) { g.fillStyle = ink(0.45); g.fillRect(px(X.rail + 0.36), pz(p.zs) - 2, 0.16 * s, 4); }
    for (const [name, [za, zb]] of Object.entries(L.shelfSpan)) {
      g.strokeStyle = ink(0.45); g.lineWidth = 3; g.beginPath(); g.moveTo(px(X.rail + 0.62), pz(za - 0.08)); g.lineTo(px(X.rail + 0.72), pz(za - 0.08)); g.lineTo(px(X.rail + 0.72), pz(zb + 0.08)); g.lineTo(px(X.rail + 0.62), pz(zb + 0.08)); g.stroke();
      g.save(); g.translate(px(X.rail + 0.9), pz((za + zb) / 2)); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.fillStyle = ink(0.5);
      g.font = `500 ${Math.min(0.14, 0.9 * (zb - za + 0.3) / Math.max(12, name.length)) * s}px ${mono}`; g.fillText(name.toUpperCase(), 0, 0); g.restore();
    }
    const z0 = L.zones.page?.[0] ?? L.zones.rail?.[0] ?? -5, z1 = L.zones.rail?.[1] ?? L.zones.page?.[1] ?? 2;
    g.save(); g.translate(px(X.rail - 0.56), pz((z0 + z1) / 2)); g.rotate(-Math.PI / 2); g.textAlign = "center"; g.font = `500 ${0.17 * s}px ${mono}`; g.fillStyle = ink(0.5);
    g.fillText(`${String(model.product).toUpperCase()} · ORIGIN RAIL · LIBRARY ${model.session.libVersion ?? ""} · SESSION RAN ${model.session.version ?? ""}`, 0, 0); g.restore();
    const box = (x0, za, x1, zb, label, col) => {
      g.setLineDash([0.12 * s, 0.09 * s]); g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(px(x0), pz(za), (x1 - x0) * s, (zb - za) * s); g.setLineDash([]);
      g.font = `500 ${0.15 * s}px ${mono}`; g.fillStyle = col; g.fillText(label, px(x0) + 0.1 * s, pz(za) - 0.13 * s);
    };
    if (L.zones.page) box(X.rail - 0.42, L.zones.page[0] - 0.25, X.rail + 1.25, L.zones.page[1] + 0.25, "NO ANCHOR", ink(0.38));
    if (L.zones.outside) box(X.rail - 0.42, L.zones.outside[0] - 0.12, X.rail + 1.25, L.zones.outside[1] + 0.1, `OUTSIDE ANY BINARY · ${L.outOrigins.map(o => originWord(o).toUpperCase()).join(" · ")}`, ink(0.42));
    const nl = L.P.filter(p => p.kind === "loose").length;
    if (L.zones.loose) box(X.rail - 0.95, L.zones.loose[0] - 0.3, X.rail + 1.6, L.zones.loose[1] + 0.3, `${words["found-nowhere"].toUpperCase()} · ${nl}`, "rgba(255,110,80,.8)");
    g.font = `400 ${0.15 * s}px ${mono}`;
    const step = [10, 30, 60, 120, 360, 720, 1440].find(m => L.minutes / m <= 6) || 1440;
    for (let m = 0; m <= L.minutes; m += step) { const x = L.tX(m); g.fillStyle = ink(0.1); g.fillRect(px(x) - 1, pz(-5.6), 2, pz(5.7) - pz(-5.6)); g.fillStyle = ink(0.45); g.fillText(m >= 60 ? `${Math.round(m / 60)}h` : `${m}m`, px(x) - 0.08 * s, pz(5.92)); }
    g.fillStyle = ink(0.42); g.fillText("ONE PIN PER AGENT · BIRTH ORDER ↑", px(X.pins - 2.4), pz(-5.95));
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const top = board.getObjectByName("hv:silkscreen"); top.material.map?.dispose(); top.material.map = t; top.material.color.set(0xffffff); top.material.needsUpdate = true;
  }

  // ----- DOM labels (live only) -----
  const offTxt = p => `${p.kind === "outside" ? originWord(p.origin) : { linked: "library", typed: "library≠", unlinked: "lib, unlinked", unnamed: PLACE[whereKind(p.where)] || PLACE.binary, composite: "composite", loose: "no record" }[p.cls] || ""} · ${p.reach}/${L.NA}`;
  function buildLabels() {
    if (!overlay) return;
    for (const el of overlay.querySelectorAll(".hv-lab, .hv-tag")) el.remove();
    labs = L.P.map(p => { const el = document.createElement("div"); el.className = "hv-lab"; el.innerHTML = `<b>${esc(p.name)}</b><span class="o">${esc(offTxt(p))}</span>`; el.onclick = () => pick(sel === p ? null : p); overlay.append(el); return { p, el }; });
    clampTags = L.T.map(t => { const el = document.createElement("div"); el.className = "hv-tag"; el.textContent = `${trigWord(t.name)} · ${t.ws.length}`; overlay.append(el); return { t, el }; });
    fanTags = L.G.filter(gr => gr.cls === "unnamed" || gr.cls === "loose" || gr.cls === "unlinked").map(gr => {
      const el = document.createElement("div"); el.className = "hv-tag hv-who"; el.textContent = gr.rec.size === 1 && gr.rec.has(Math.max(0, L.agents.findIndex(a => a.kind === "root"))) ? "main thread" : `${gr.rec.size} agent${gr.rec.size > 1 ? "s" : ""}`; overlay.append(el); return { gr, el };
    });
    legend.innerHTML = [["linked", "linked record"], ["typed", "linked by type, text differs"], ["unlinked", "in library, not linked"], ["loose", `not in the ${model.libName} library (a red collar: found in the binary)`], ["outside", "outside any binary"]]
      .map(([c, t]) => `<span><i style="background:${CSS_COL[c]}"></i>${esc(t)}</span>`).join("");
    nav.innerHTML = "";
    for (const name of PRESET_NAMES) {
      if (name === "compare" && compareAgent(model, trace, focusAgent) == null) continue;
      const b = document.createElement("button"); b.type = "button"; b.dataset.preset = name; b.textContent = PRESET_LABEL[name]; b.onclick = () => setPreset(name); nav.append(b);
    }
  }
  function callout(html, anchor, col) { const el = document.createElement("div"); el.className = "hv-call"; el.innerHTML = html; if (col) el.style.borderLeftColor = col; overlay.append(el); callouts.push({ el, anchor }); }
  const proj = v => { const [w, h] = size(); const q = v.clone().project(camera); return [(q.x + 1) / 2 * w, (1 - q.y) / 2 * h, q.z]; };
  function placeLabels() {
    if (!overlay) return;
    const [W, H] = size(); if (!(W > 0 && H > 0)) return;
    const ins = insets(), onScreen = (x, y, z) => z < 1 && x > 20 && x < W - ins.right && y > ins.top && y < H - 20;
    const boardView = preset === "session";
    if (boardView) {   // combed column: even rows in anchor order, between Trace's header and the bottom-left chrome
      const rows = labs.map(l => { const [x, y] = proj(l.p.end); return { l, x, y }; }).sort((a, b) => a.y - b.y);
      if (!rows.length) return;
      const avail = H - (caption.offsetTop + caption.offsetHeight + 14) - ins.bottom, gap = Math.min(15, avail / Math.max(1, rows.length));
      const capBottom = caption.offsetTop + caption.offsetHeight + 14;
      const mid = (rows[0].y + rows[rows.length - 1].y) / 2, y0 = Math.max(capBottom, Math.min(H - ins.bottom - gap * rows.length, mid - gap * rows.length / 2));
      let lines = "";
      rows.forEach((r, k) => {
        const e = r.l.el, ty = y0 + k * gap; e.hidden = false; e.style.left = "22px"; e.style.top = `${ty}px`;
        const xr = 22 + Math.min(280, e.offsetWidth) + 4, xm = Math.max(xr + 8, r.x - 60);
        lines += `<path d="M${xr},${ty} L${xm},${ty} C${xm + 30},${ty} ${r.x - 24},${r.y} ${r.x - 4},${r.y}" fill="none" stroke="${CSS_COL[r.l.p.cls]}" stroke-opacity="${sel && sel !== r.l.p ? 0.15 : 0.6}" stroke-width="1"/>`;
      });
      svg.innerHTML = lines;
    } else { for (const l of labs) l.el.hidden = true; svg.innerHTML = ""; }
    for (const { t, el } of clampTags) { const [x, y, z] = proj(t.anchor); el.hidden = !(boardView && onScreen(x, y, z)); el.style.left = `${x}px`; el.style.top = `${y - 4}px`; el.classList.toggle("dim", !!sel && sel.trig !== t); }
    const gt = fanTags.map(f => { const [x, y, z] = proj(f.gr.anchor); return { f, x, y, z, ty: y }; }).sort((a, b) => a.y - b.y);
    for (let it = 0; it < 40; it++) for (let k = 1; k < gt.length; k++) { const d = gt[k].ty - gt[k - 1].ty; if (d < 15) { gt[k].ty += (15 - d) / 2; gt[k - 1].ty -= (15 - d) / 2; } }
    for (const r of gt) { const e = r.f.el; e.hidden = !(boardView && onScreen(r.x, r.y, r.z)); e.style.left = `${r.x + 30}px`; e.style.top = `${r.ty + 6}px`; }
    const cs = callouts.map(c => { const [x, y, z] = proj(c.anchor); return { c, x, y, z, ty: Math.max(ins.top + 30, y - 10) }; })
      .filter(r => { const ok = r.z < 1 && r.x > -200 && r.x < W - ins.right + 100 && r.y < H - 40; r.c.el.hidden = !ok; return ok; }).sort((a, b) => a.ty - b.ty);
    for (let it = 0; it < 40; it++) for (let k = 1; k < cs.length; k++) { const a = cs[k - 1], b = cs[k]; const d = b.ty - a.ty, need = (a.c.el.offsetHeight + b.c.el.offsetHeight) / 2 + 6; if (d < need && Math.abs(a.x - b.x) < (a.c.el.offsetWidth + b.c.el.offsetWidth) / 2) { b.ty += (need - d) / 2; a.ty -= (need - d) / 2; } }
    let lead = "";
    for (const r of cs) { const w = r.c.el.offsetWidth, x = Math.max(14 + w / 2, Math.min(W - ins.right - 14 - w / 2, r.x)); r.c.el.style.left = `${x}px`; r.c.el.style.top = `${r.ty}px`; if (preset === "close") lead += `<path d="M${x},${r.ty} L${r.x},${r.y - 4}" stroke="#e8e2d6" stroke-opacity=".7" fill="none"/>`; }
    if (preset === "close") svg.innerHTML = lead;
    for (const pe of plateEls) {
      const [x, y, z] = proj(pe.a), [x2] = proj(pe.b); pe.el.hidden = !onScreen(x, y, z); pe.el.style.left = `${x}px`; pe.el.style.top = `${y}px`; pe.el.style.maxWidth = `${Math.max(40, x2 - x)}px`;
      const hpx = Math.abs(proj(pe.a.clone().add(new THREE.Vector3(0, pe.h, 0)))[1] - y); pe.el.style.fontSize = `${Math.max(7, Math.min(13, hpx * 0.62))}px`;
    }
  }
  function plateLabels(rg) {
    if (!overlay) return;
    for (const it of rg.userData.items) {
      const { pl, piece } = it, el = document.createElement("div");
      el.className = `hv-plate r-${it.cls}${it.shared ? " shared" : ""}${["unnamed", "unlinked", "loose", "core"].includes(it.cls) || it.shared ? " light" : ""}`;
      if (pl.core) el.innerHTML = pl.more ? `<span class="dim">… and ${pl.n} more harness pieces later in this request</span>` : `<span class="dim">conversation · ${pl.n} block${pl.n > 1 ? "s" : ""}</span>`;
      else el.innerHTML = `${it.fresh ? `<span class="new">NEW · ${esc(trigWord(piece?.trigger))}</span>` : ""}<span class="k">${esc(piece ? piece.name : pl.label)}${pl.n > 1 ? ` ×${pl.n}` : ""}</span>${esc(String(pl.excerpt || piece?.sample || "").slice(0, 110))}`;
      if (piece) el.onclick = () => pick(piece, { agent: rg.userData.rack.agent, block: pl.block });
      overlay.append(el); plateEls.push({ el, h: it.h, a: new THREE.Vector3(it.x0 - 2.7, it.y, it.z + 0.06), b: new THREE.Vector3(it.x0 + 2.75, it.y, it.z + 0.06) });
    }
  }
  function whoStrip(p, W, H) {
    const c = document.createElement("canvas"); c.width = W * 2; c.height = H * 2; const g = c.getContext("2d"); const cw = c.width / L.NA;
    for (let r = 0; r < L.NA; r++) { const ai = L.order[r]; g.fillStyle = p.rec.has(ai) ? CSS_COL[p.cls] : "rgba(255,255,255,.07)"; g.fillRect(r * cw + 0.3, 0, Math.max(1, cw - 0.6), c.height); }
    return c.toDataURL();
  }
  function showCard(p) {
    if (!card) return;
    if (!p) { card.hidden = true; return; }
    const ts = p.ev.map(e => e[1]);
    const origin = p.rung === "binary-only" && p.where ? `${esc(whereText(p))}<div class="m">not in the ${esc(model.libName)} library</div>`
      : p.where ? `${esc(p.where.shelf)}<div class="m">${esc(whereText(p))}</div>` : esc(p.kind === "outside" ? originWord(p.origin) : words[p.rung]);
    card.innerHTML = `<div class="k">Harness piece · ${p.order + 1} of ${L.P.length}, least explained first</div><h4>${esc(p.name)}</h4>
      <span class="badge b-${p.cls}">${esc(p.rung === "binary-only" ? PLACE[whereKind(p.where)] || words[p.rung] : words[p.rung]).toUpperCase()}</span>
      <dl><dt>Origin</dt><dd>${origin}</dd><dt>Put there</dt><dd>${esc(trigWord(p.trigger))} <span class="m">(observed)</span></dd>
      <dt>Who</dt><dd>${p.reach} of ${L.NA} agents<img class="who" alt="" src="${whoStrip(p, 170, 7)}"></dd>
      <dt>When</dt><dd>${fmtMin(Math.min(...ts))} → ${fmtMin(Math.max(...ts))} · ${p.n.toLocaleString()} deliveries</dd></dl>
      <div class="hand">Its text opens in Trace's reader, in the sidebar.</div>`;
    card.hidden = false;
  }
  function setCaption() {
    if (!caption) return;
    const counts = c => L.P.filter(p => p.cls === c).length;
    const stats = `<span class="st"><b>${L.P.length}</b> kinds of harness text</span><span class="st"><b>${counts("linked")}</b> linked</span><span class="st amber"><b>${counts("unlinked") + counts("typed")}</b> library has it, link missing or off</span><span class="st red"><b>${counts("unnamed") + counts("loose")}</b> ${esc(words["found-nowhere"])}</span>`;
    const r = racks[0]?.userData.rack, an = ai => esc(model.agents[ai]?.kind === "root" ? "main thread" : model.agents[ai]?.name ?? "");
    const text = {
      hero: heroCaption(),
      session: `<h3>What the harness put in front of the model</h3><p>${esc(model.product)} ${esc(model.session.version ?? "")} · ${L.NA} agent${L.NA > 1 ? "s" : ""}. Each wire runs from where its text is anchored, through what put it there, to the agents that got it and when.</p>`,
      rack: r ? `<h3>${an(r.agent)} · request ${r.req + 1}, assembled</h3><p>The harness pieces in this request, in log order, each wired back to where its text is anchored.</p>` : "",
      later: r ? `<h3>${an(r.agent)} · request ${r.req + 1}, later in the session</h3><p>Pieces that events added since the first request carry a NEW tag.</p>` : "",
      compare: racks.length === 2 ? `<h3>${an(racks[0].userData.rack.agent)} vs ${an(racks[1].userData.rack.agent)}: births compared</h3><p>First two requests of each. Shared pieces recede to graphite; what differs stands forward.</p>` : "",
      close: `<h3>Where it came from</h3><p>Terminals where each text is anchored. Amber wires hover over records Trace's own link misses.</p>`,
    }[preset] || "";
    caption.innerHTML = text + (preset === "hero" || preset === "session" ? `<div class="stats">${stats}</div>` : "");
    for (const b of nav.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.preset === preset));
  }
  function heroCaption() {
    const p = hero; if (!p) return "";
    // The words, without the tags they're wrapped in (the piece's name already says which) or heading marks.
    const head = (String(p.sample).replace(/^(?:\s*<[A-Za-z][^<>]{0,160}>)+/, "").replace(/^[#\s]+/, "").split(/(?<=[.:!?])\s/)[0] || p.name).slice(0, 70).trim();
    const root = Math.max(0, L.agents.findIndex(a => a.kind === "root"));
    const who = p.reach === 1 ? `${p.rec.has(root) ? "the main thread" : "one agent"} ${p.n.toLocaleString()} time${p.n > 1 ? "s" : ""}` : `${p.reach} of ${L.NA} agents`;
    const tail = p.rung === "binary-only" && p.where ? `It is ${esc(whereText(p))}, and in no ${esc(model.libName)} record.` : `It is ${esc(words[p.rung])}.`;
    return `<h3>${esc(model.product)} put <em>“${esc(head)}${head.length >= 70 ? "…" : ""}”</em> in front of ${who}. ${tail}</h3>`;
  }

  // ----- selection and hand-off -----
  function paint() {
    if (!L) return;
    SEL.value = sel ? sel.i : -1;
    board.getObjectByName("hv:hifan")?.removeFromParent();
    if (sel) {
      const c = sel.cls === "linked" ? new THREE.Color(0xf4ecd8) : sel.color;
      const hi = new THREE.Mesh(merge(fanGeos(L, sel.g.z, sel.rec, 0.02, 0.36)), phys({ color: c, roughness: 0.35, clearcoat: 1, emissive: c.clone().multiplyScalar(0.25) }));
      hi.name = "hv:hifan"; hi.castShadow = true; board.add(hi);
    }
    const marks = board.getObjectByName("hv:marks"), EV = marks.userData.EV, hot = new THREE.Vector3(2.4, 2.6, 1.25), c = new THREE.Color(), v = new THREE.Vector3();
    EV.forEach(([pi, ai, t], k) => {
      const p = L.P[pi], on = sel && pi === sel.i;
      if (sel) c.set(on ? (p.cls === "linked" ? 0xfff6e0 : p.color) : 0x3a3631); else c.set(p.cls === "linked" || p.cls === "composite" ? 0x9a958b : p.color);
      marks.setColorAt(k, c); _m.compose(v.set(L.tX(t), on ? 0.03 : 0.011, L.pinZ(ai)), _q, on ? hot : _s); marks.setMatrixAt(k, _m);
    });
    if (marks.instanceColor) marks.instanceColor.needsUpdate = true; marks.instanceMatrix.needsUpdate = true;
    for (const l of labs) { l.el.classList.toggle("sel", sel === l.p); l.el.classList.toggle("dim", !!sel && sel !== l.p); l.el.dataset.cls = l.p.cls; }
    showCard(preset === "hero" ? null : sel);   // the hero's callouts already say where, what, who and when
    requestRender();
  }
  // Which copy to open: the one in the rack clicked, else the one the selected agent got, else the first.
  function delivery(p, at) {
    const bl = p.blocks || [];
    if (at && at.block != null) return [at.agent, at.block];
    return (focusAgent != null && bl.find(b => b[0] === focusAgent)) || bl[0] || null;
  }
  function pick(p, at) {
    sel = p || null; paint();
    if (!p) return;
    const d = delivery(p, at); if (!d) return;
    picked = d;
    onPick(model.agents[d[0]].id, d[1]);
  }
  function onCanvasClick(e) {
    const r = canvas.getBoundingClientRect(), ndc = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
    const wires = board.getObjectByName("hv:wires"), hit = ray.intersectObject(wires)[0];
    if (!hit) return;
    pick(L.P[wires.geometry.attributes.aId.getX(wires.geometry.index.getX(hit.faceIndex * 3))]);
  }

  // ----- views -----
  function clearRacks() {
    for (const r of racks) { r.removeFromParent(); r.traverse(o => { o.geometry?.dispose(); }); }
    racks = []; for (const pe of plateEls) pe.el.remove(); plateEls = []; for (const c of callouts) c.el.remove(); callouts = [];
  }
  async function showRack(ai, ri, opts = {}) {
    const rf = await getRackFor(), rack = rf(model, trace, ai, ri);
    if (!rack) return null;
    const rg = buildRack(L, rack, opts.x0 ?? -3.0, SEL, opts); scene.add(rg); racks.push(rg); plateLabels(rg); return rg;
  }
  async function setPreset(name, { agent = null, req = null, instant = false } = {}) {
    if (!model) return;
    preset = PRESET_NAMES.includes(name) ? name : "session";
    clearRacks(); sel = null;
    const rootAi = Math.max(0, model.agents.findIndex(a => a.kind === "root"));
    if (preset === "rack") { rackKey = [agent ?? focusAgent ?? rootAi, req ?? 0]; await showRack(rackKey[0], rackKey[1]); }
    else rackKey = null;
    if (preset === "later") {
      const l = laterRequest(model, trace), rf = await getRackFor(), first = rf(model, trace, l.agent, 0);
      await showRack(l.agent, l.req, { newSince: new Set((first?.plates || []).map(normPlate).map(p => p.piece).filter(x => x != null)) });
    }
    if (preset === "compare") {
      const sub = compareAgent(model, trace, focusAgent);
      if (sub != null) { await showRack(rootAi, 0, { x0: -3.3, other: birthSet(model, trace, sub) }); await showRack(sub, 0, { x0: 3.3, other: birthSet(model, trace, rootAi) }); }
    }
    if (preset === "hero" && hero) sel = hero;
    if (preset === "hero" && hero && overlay) {
      const p = hero;
      callout(`${esc(p.name.length > 44 ? p.name.slice(0, 42) + "…" : p.name)}<span class="m">${esc(p.rung === "binary-only" && p.where ? `${whereText(p)} · not in ${model.libName}` : p.where ? `${p.where.shelf} · ${whereText(p)}` : words[p.rung])}</span>`, p.curve.getPointAt(p.kind === "loose" ? 0.32 : 0.13).clone().add(new THREE.Vector3(0, 0.25, 0)));   // unmatched ends sit by the bottom-left chrome
      const via = (p.via || []).find(([k]) => k !== "own block");
      callout(`${esc(trigWord(p.trigger))}<span class="m">${via ? `rides inside a ${esc(via[0])}` : "observed trigger"}</span>`, p.trig.anchor.clone().add(new THREE.Vector3(0, 0.25, 0)));
      const zs = [...p.rec].map(L.pinZ), zm = zs.reduce((a, b) => a + b, 0) / zs.length;
      callout(`${p.reach} of ${L.NA} agent${L.NA > 1 ? "s" : ""}<span class="m">${L.NA - p.reach} did not</span>`, new THREE.Vector3(X.pins - 0.1, 0.6, zm));
      const ts = p.ev.map(e => e[1]).sort((a, b) => a - b), mid = p.ev[Math.floor(p.ev.length / 2)];
      callout(`${fmtMin(ts[0])} → ${fmtMin(ts[ts.length - 1])}<span class="m">${p.n} deliver${p.n > 1 ? "ies" : "y"}</span>`, new THREE.Vector3(L.tX(mid[1]), 0.25, L.pinZ(mid[0])));
    }
    if (preset === "close" && overlay) {
      const eye = new THREE.Vector3(...PRESETS.close.p);
      for (const p of L.P.filter(p => p.kind === "rail" && ["unnamed", "unlinked", "typed"].includes(p.cls)).sort((a, b) => a.end.distanceTo(eye) - b.end.distanceTo(eye)).slice(0, 5))
        callout(`${esc(p.name.length > 34 ? p.name.slice(0, 32) + "…" : p.name)}<span class="m">${esc(p.rung === "binary-only" ? whereText(p) : `${words[p.rung]} · ${whereText(p)}`)}</span>`, p.end.clone().add(new THREE.Vector3(0, 0.3, 0)), CSS_COL[p.cls]);
    }
    if (PRESETS[preset].dof && renderer) { await ensurePost(); const c = PRESETS[preset]; bokeh.uniforms.focus.value = new THREE.Vector3(...c.p).distanceTo(new THREE.Vector3(...c.t)) * (preset === "hero" ? 0.95 : 1); bokeh.uniforms.aperture.value = c.dof; }
    setCaption();
    goCam(preset, instant);
    paint();
  }

  // ----- the interface -----
  function setModel(m, t) {
    model = m; trace = t; words = rungWords(m); clearRacks(); sel = null; picked = null;
    if (board) { board.removeFromParent(); board.traverse(o => { o.geometry?.dispose(); }); }
    L = layoutBoard(m); board = buildBoard(L, SEL); scene.add(board);
    const h = pickHero(m); hero = h ? L.byId.get(h.id) : null;
    silkscreen(); buildLabels();
    return setPreset(hero ? "hero" : "session", { instant: true });
  }
  function show() {
    if (disposed) return; shown = true; if (root) root.hidden = false; resize(); requestRender();
    if (deferred) { const d = deferred; deferred = null; return sync(d); }
  }
  function hide() { shown = false; if (root) root.hidden = true; }
  // Trace's selection: a request (level 2+) shows its rack; the session or an agent shows the board; the open
  // block's piece is lit. The echo of our own pick keeps the current view.
  async function sync({ level = 0, agentId = null, reqIdx = 0, block = null } = {}) {
    if (!model) return;
    if (!shown) { deferred = { level, agentId, reqIdx, block }; return; }   // no work while hidden
    const ai = agentId == null ? -1 : model.agents.findIndex(a => a.id === agentId);
    focusAgent = ai >= 0 ? ai : null;
    if (picked && picked[0] === ai && picked[1] === block) { picked = null; return; }
    if (level >= 2 && ai >= 0) { if (preset !== "rack" || !rackKey || rackKey[0] !== ai || rackKey[1] !== reqIdx) await setPreset("rack", { agent: ai, req: reqIdx }); }
    else if (preset === "rack" || preset === "later" || preset === "compare") await setPreset("session");
    const hit = block != null && ai >= 0 ? L.P.find(p => (p.blocks || []).some(b => b[0] === ai && b[1] === block)) : null;
    if (hit || block == null) { sel = hit || null; paint(); }
  }
  function playhead(minutes) {
    if (!board) return;
    const now = board.getObjectByName("hv:now"); now.visible = Number.isFinite(minutes); if (now.visible) now.position.x = L.tX(minutes);
    requestRender();
  }
  function dispose() {
    disposed = true; shown = false; ro?.disconnect(); controls?.dispose(); composer?.dispose?.();
    scene.traverse(o => { o.geometry?.dispose(); }); renderer?.dispose(); root?.remove();
  }
  // Select a piece as a click would (wire, label or plate): the tests use it, and so can keyboard stepping.
  function pickPiece(id, at) { const p = L?.byId.get(id); if (p) pick(p, at); }
  return { setModel, show, hide, sync, playhead, dispose, setPreset, pickPiece,
    // read-only state for the tests and the app's own checks
    get state() { return { preset, selected: sel?.id ?? null, rack: rackKey, hero: hero?.id ?? null, focusAgent, shown, frames }; },
    scene, camera };
}
