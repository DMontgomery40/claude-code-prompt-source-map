// The grain hash in grains.js is GLSL; the kernel's JS twin in grain-rules.js must agree bit for bit,
// or grains pour and spiral differently from what the node tests pin. This test reads the GLSL source
// exported by grains.js, interprets its uint statements with 32-bit wraparound, and compares.
import { test } from "node:test";
import assert from "node:assert/strict";
import { GRAIN_HASH_GLSL, GRAIN_VERT, GRAIN_FRAG } from "../grains.js";
import { hashU32, hashGrainU32, hashGrain, hashDerived, u32ToUnit, HASH_NAME, HASH_SALT } from "../grain-rules.js";

const lit = (s) => {
  const m = /^0x([0-9a-fA-F]+)u$|^(\d+)u?$/.exec(s.trim());
  if (!m) throw new Error(`not a uint literal: ${s}`);
  return m[1] ? parseInt(m[1], 16) >>> 0 : Number(m[2]) >>> 0;
};

// Parse `uint NAME(uint x) { ...; return x; }` into a JS function over uint32. Supported statements:
// x ^= x >> N;  x *= LITERAL;  x ^= x << N;  x += LITERAL;  return x;
function compileUintFn(src, name) {
  const m = new RegExp(`uint\\s+${name}\\s*\\(\\s*uint\\s+(\\w+)\\s*\\)\\s*\\{([^}]*)\\}`).exec(src);
  assert.ok(m, `${name} is defined in the GLSL`);
  const v = m[1];
  const ops = m[2].split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
    let q;
    if ((q = new RegExp(`^${v}\\s*\\^=\\s*${v}\\s*>>\\s*(\\w+)$`).exec(s))) { const n = lit(q[1]); return (x) => (x ^ (x >>> n)) >>> 0; }
    if ((q = new RegExp(`^${v}\\s*\\^=\\s*${v}\\s*<<\\s*(\\w+)$`).exec(s))) { const n = lit(q[1]); return (x) => (x ^ (x << n)) >>> 0; }
    if ((q = new RegExp(`^${v}\\s*\\*=\\s*(\\w+)$`).exec(s))) { const c = lit(q[1]); return (x) => Math.imul(x, c) >>> 0; }
    if ((q = new RegExp(`^${v}\\s*\\+=\\s*(\\w+)$`).exec(s))) { const c = lit(q[1]); return (x) => (x + c) >>> 0; }
    if (new RegExp(`^return\\s+${v}$`).test(s)) return null;
    throw new Error(`unsupported GLSL statement in ${name}: ${s}`);
  }).filter(Boolean);
  return (x) => ops.reduce((a, op) => op(a), x >>> 0);
}

test("the GLSL grain hash is lowbias32 and matches hashGrainU32 for b = 0..39 x s = 0..24", () => {
  assert.equal(HASH_NAME, "lowbias32");
  assert.ok(GRAIN_HASH_GLSL.includes(`uint ${HASH_NAME}(uint x)`));
  const glslHash = compileUintFn(GRAIN_HASH_GLSL, HASH_NAME);
  // grainHash(b, s) = lowbias32(b * MUL ^ s): take MUL from the source, not from the JS
  const g = /uint\s+grainHash\s*\(\s*uint\s+b\s*,\s*uint\s+s\s*\)\s*\{\s*return\s+(\w+)\s*\(\s*b\s*\*\s*(\w+)\s*\^\s*s\s*\)\s*;\s*\}/.exec(GRAIN_HASH_GLSL);
  assert.ok(g, "grainHash(b, s) has the form lowbias32(b * MUL ^ s)");
  assert.equal(g[1], HASH_NAME);
  const mul = lit(g[2]);
  const glslGrain = (b, s) => glslHash((Math.imul(b, mul) ^ s) >>> 0); // GLSL precedence: * before ^
  let n = 0;
  for (let b = 0; b < 40; b++) for (let s = 0; s < 25; s++, n++) {
    assert.equal(glslGrain(b, s), hashGrainU32(b, s), `b=${b} s=${s}`);
    assert.equal(glslHash(b * 25 + s), hashU32(b * 25 + s));
  }
  assert.equal(n, 1000);
  // the largest ids a table can hold, and the pinned reference values from Task 2
  for (const [b, s, want] of [[0, 1, 0x688990c0], [1, 0, 0x6d523710], [7, 3, 0x30f08a43], [4194303, 4095, 0xf3abf51a]]) {
    assert.equal(glslGrain(b, s), want);
    assert.equal(hashGrainU32(b, s), want);
  }
});

test("the GLSL unit float and salts match u32ToUnit and HASH_SALT", () => {
  // float(u >> 8u) * (1.0 / 16777216.0): the top 24 bits, exact in float32, never 1.0
  assert.match(GRAIN_HASH_GLSL, /float\s+u2f\s*\(\s*uint\s+u\s*\)\s*\{\s*return\s+float\s*\(\s*u\s*>>\s*8u\s*\)\s*\*\s*\(\s*1\.0\s*\/\s*16777216\.0\s*\)\s*;\s*\}/);
  const salt = (name) => lit(new RegExp(`const\\s+uint\\s+${name}\\s*=\\s*(\\w+)\\s*;`).exec(GRAIN_HASH_GLSL)[1]);
  assert.equal(salt("SALT_X"), HASH_SALT.x >>> 0);
  assert.equal(salt("SALT_Z"), HASH_SALT.z >>> 0);
  const glslHash = compileUintFn(GRAIN_HASH_GLSL, HASH_NAME);
  const u2f = (u) => Math.fround((u >>> 8) * Math.fround(1 / 16777216));
  for (let b = 0; b < 40; b++) for (let s = 0; s < 25; s++) {
    const u = hashGrainU32(b, s);
    assert.equal(u2f(u), hashGrain(b, s));
    assert.equal(u2f(glslHash((u ^ salt("SALT_X")) >>> 0)), hashDerived(u, HASH_SALT.x));
    assert.equal(u2f(glslHash((u ^ salt("SALT_Z")) >>> 0)), hashDerived(u, HASH_SALT.z));
    assert.ok(u32ToUnit(u) < 1);
  }
  // the vertex shader draws h, hx and hz exactly this way
  assert.match(GRAIN_VERT, /float h = u2f\(u\), hx = u2f\(lowbias32\(u \^ SALT_X\)\), hz = u2f\(lowbias32\(u \^ SALT_Z\)\);/);
  assert.match(GRAIN_VERT, /uint u = grainHash\(uint\(b\), uint\(s\)\);/);
  assert.match(GRAIN_VERT, /int b = int\(id >> 12u\);/);
  assert.match(GRAIN_VERT, /int s = int\(id & 4095u\);/);
});

test("the grain shaders are GLSL ES 3.0 with no discard and a degenerate hide", () => {
  const code = (src) => src.replace(/\/\/[^\n]*/g, "");
  for (const src of [GRAIN_VERT, GRAIN_FRAG]) assert.ok(!/\bdiscard\b/.test(code(src)), "hidden grains never discard");
  assert.match(GRAIN_VERT, /gl_Position = vec4\(2\.0, 2\.0, 2\.0, 1\.0\);/);
  assert.match(GRAIN_VERT, /gl_VertexID/);
  assert.match(GRAIN_VERT, /usampler2D uIds/);
  assert.ok(!/\battribute\b|\bvarying\b|texture2D/.test(code(GRAIN_VERT + GRAIN_FRAG)), "GLSL3 keywords only");
});

// The CPU side of grains.js on a stub renderer: tables upload once per agent, a frame only sets draw
// ranges (ceil(count * density) grains of each visible chunk, times K columns), and the smallest grain
// it reports is the vertex shader's size: the 2 px floor grown by sqrt(1 / density), in CSS px.
test("createGrains: one upload per agent, per-frame draw ranges only, minGrainPx follows the shader's size rule", async () => {
  const THREE = await import("../vendor/three.module.min.js");
  const { createGrains } = await import("../grains.js");
  const { loadTrace } = await import("../loader.js");
  const { entriesFor } = await import("../dump.mjs");
  const { buildTables } = await import("../grain-rules.js");
  const fix = new URL("./fixtures/codex", import.meta.url).pathname;
  const agent = (await loadTrace(await entriesFor([fix]))).trace.agents.find((a) => a.kind === "root");
  const geom = { x: (a, i) => i * 0.13, tread: (a, i) => [i * 0.13 - 0.065, i * 0.13 + 0.065], z: () => 0, lane: () => -1 };
  let inits = 0;
  const renderer = { getContext: () => ({ colorMask() {} }), initTexture() { inits++; } };
  const shared = { uCol: { value: [] }, uEm: { value: [] }, uFog: { value: new THREE.Color() }, uLight: { value: new THREE.Vector3() }, uFocusDist: { value: 100 } };
  const make = (yScale) => {
    const g = createGrains({ THREE, renderer, shared, geom, yScale });
    g.setAgent(agent, buildTables(agent, geom));
    return g;
  };
  const g = make(1e-4);
  assert.equal(inits, 4, "request, block, epoch and id textures");
  assert.equal(g.stats().grainUploads, 4);
  const n = agent.requests.length, iLead = n - 1, K = Math.min(8, n);
  const cam = new THREE.PerspectiveCamera(34, 1920 / 1200, 0.1, 4000);
  const look = (dist) => { cam.position.set(iLead * 0.13, 1, dist); cam.lookAt(iLead * 0.13, 1, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
  look(30);
  const frame = (o) => ({ camera: cam, uP: iLead, columns: K, density: 1, square: false, res: new THREE.Vector2(1920, 1200), dpr: 1, ...o });
  const drawn = () => g.group.children.filter((m) => m.visible).reduce((s, m) => s + m.geometry.drawRange.count / 6, 0);
  g.update(frame());
  const full = g.stats();
  assert.ok(full.grainChunks > 0 && full.grains > 0);
  assert.equal(full.grains, drawn());
  assert.equal(full.minGrainPx, 2, "a 10-token grain is far under 2 px at this distance: the floor");
  g.update(frame({ density: 0.25 }));
  assert.equal(g.stats().minGrainPx, 4, "a quarter of the grains, each twice as wide");
  assert.equal(g.stats().grains, drawn());
  assert.ok(g.stats().grains < full.grains && g.stats().grains >= full.grains / 4);
  g.update(frame({ res: new THREE.Vector2(3840, 2400), dpr: 2 }));
  assert.equal(g.stats().minGrainPx, 2, "CSS px at devicePixelRatio 2");
  g.update(frame({ columns: 0 }));
  assert.equal(g.stats().grains, 0);
  assert.equal(g.stats().minGrainPx, null, "nothing drawn, nothing reported");
  cam.lookAt(iLead * 0.13, 1, 60); cam.updateMatrixWorld();
  g.update(frame());
  assert.equal(g.stats().grainChunks, 0, "columns behind the camera are culled");
  // grains big enough to be drawn at their true size: the size at the drawn columns' farthest corner
  const big = make(0.2);
  look(30);
  big.update(frame());
  const box = big.columnsBox(iLead, K), inv = cam.matrixWorldInverse;
  let far = 0;
  for (let k = 0; k < 8; k++) far = Math.max(far, -new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).applyMatrix4(inv).z);
  const truePx = big.uniforms.uGrainWorld.value * cam.projectionMatrix.elements[5] * 0.5 * 1200 / far;
  assert.ok(truePx > 2);
  assert.ok(Math.abs(big.stats().minGrainPx - truePx) < 1e-9);
  assert.equal(inits, 8, "updates never upload");
  g.dispose(); big.dispose();
});
