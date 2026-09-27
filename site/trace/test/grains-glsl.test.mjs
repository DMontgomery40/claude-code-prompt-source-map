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
