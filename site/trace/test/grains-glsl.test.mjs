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
// ranges (ceil(count * density) grains of each visible chunk, times K columns), grains fill their
// request's tread and GRAIN_DEPTH behind the face, and the smallest grain reported follows the vertex
// shader's size rule (grainSizePx) in CSS px.
test("grain size: the face area a grain stands for, floored, capped, grown by sqrt(1 / density)", async () => {
  const { grainSizePx, GRAIN_TILE, GRAIN_MAX_PX } = await import("../grains.js");
  const base = { halfW: 0.065, stepWorld: 3.2e-4, minPx: 2, maxPx: GRAIN_MAX_PX };
  // Requests on the real session: a tile is 0.13 world units wide x 10 tokens tall, ~0.3 px: the floor
  assert.equal(grainSizePx({ ...base, pxPerWorld: 20 }), 2);
  assert.equal(grainSizePx({ ...base, pxPerWorld: 32, minPx: 3 }), 3, "Layers floor");
  const tile = GRAIN_TILE * Math.sqrt(2 * 0.065 * 3.2e-4);
  assert.ok(Math.abs(grainSizePx({ ...base, pxPerWorld: 500 }) - tile * 500) < 1e-9, "deep zoom: the tile itself");
  assert.equal(grainSizePx({ ...base, pxPerWorld: 1e6 }), GRAIN_MAX_PX, "cap");
  assert.equal(grainSizePx({ ...base, pxPerWorld: 20, density: 0.25 }), 4, "a quarter of the grains, twice as wide");
  assert.equal(grainSizePx({ ...base, halfW: 0, pxPerWorld: 1e6 }), 2, "a zero-width tread falls to the floor");
  // seen at an angle a column's grains spread across its depth too: a narrow column's grains grow
  const narrow = { ...base, halfW: 0.02, pxPerWorld: 300 };
  const spread = 1.5 * 0.32; // GRAIN_DEPTH x |V.x| at the default view (azimuth 25 deg, elevation 40 deg)
  assert.ok(Math.abs(grainSizePx({ ...narrow, depthSpread: spread }) - GRAIN_TILE * Math.sqrt((0.04 + spread) * 3.2e-4) * 300) < 1e-9);
  assert.ok(grainSizePx({ ...narrow, depthSpread: spread }) > 3 * grainSizePx(narrow));
  assert.equal(grainSizePx({ ...base, pxPerWorld: 20, depthSpread: spread }), 2, "at Requests the floor still wins");
  // coverage: grains of this size cover their tile GRAIN_TILE^2 times over
  assert.ok(GRAIN_TILE * GRAIN_TILE * Math.PI / 4 >= 3);
});

test("the grain shader fills the tread and GRAIN_DEPTH, and sizes grains by grainSizePx", async () => {
  assert.match(GRAIN_VERT, /vec3 rest = vec3\(A0\.x \+ \(2\.0 \* hx - 1\.0\) \* halfW,/);
  assert.match(GRAIN_VERT, /zF - hz \* A0\.z\);/);
  assert.match(GRAIN_VERT, /float ctx = A0\.y, halfW = A0\.w;/);
  assert.match(GRAIN_VERT, /float baseK = reqTexel\(i0, bt\)\[c\];/);
  assert.match(GRAIN_VERT, /float pxPerWorld = projectionMatrix\[1\]\[1\] \* 0\.5 \* uRes\.y \/ clip\.w;/);
  assert.match(GRAIN_VERT, /float tilePx = uTile \* sqrt\(max\(\(2\.0 \* halfW \+ A0\.z \* abs\(V\.x\)\) \* B0\.z \* scaleK \* uYScale, 0\.0\)\) \* pxPerWorld;/);
  assert.match(GRAIN_VERT, /float rad = 0\.5 \* clamp\(tilePx, uMinPx, uMaxPx\) \* uSizeScale;/);
});

test("createGrains: one upload per agent, per-frame draw ranges only, tread and depth tables, minGrainPx by the size rule, a warm-up draw", async () => {
  const THREE = await import("../vendor/three.module.min.js");
  const { createGrains, grainSizePx, GRAIN_DEPTH, GRAIN_MAX_PX } = await import("../grains.js");
  const { loadTrace } = await import("../loader.js");
  const { entriesFor } = await import("../dump.mjs");
  const { buildTables, REQ_TEXELS } = await import("../grain-rules.js");
  const fix = new URL("./fixtures/codex", import.meta.url).pathname;
  const agent = (await loadTrace(await entriesFor([fix]))).trace.agents.find((a) => a.kind === "root");
  // treads that are not centred on the request's x, as on a real sloped ridge
  const geom = { x: (a, i) => i * 0.13, tread: (a, i) => [i * 0.13 - 0.04, i * 0.13 + 0.09], z: () => 0, lane: () => -1, depth: (a, h) => (a === agent ? 7 : 0) };
  let inits = 0, renders = [];
  const renderer = { autoClear: true, getContext: () => ({ colorMask() {} }), initTexture() { inits++; }, render(o) { renders.push([o, this.autoClear, o.children.filter((m) => m.visible).length]); } };
  const shared = { uCol: { value: [] }, uEm: { value: [] }, uFog: { value: new THREE.Color() }, uLight: { value: new THREE.Vector3() }, uFocusDist: { value: 100 } };
  const make = (yScale) => {
    const g = createGrains({ THREE, renderer, shared, geom, yScale });
    g.setAgent(agent, buildTables(agent, geom, { chunkSize: 64 })); // several chunks, so chunk offsets matter
    return g;
  };
  const g = make(1e-4);
  assert.equal(inits, 4, "request, block, epoch and id textures");
  // refocusing an agent reuses its built tables (no rebuild); textures upload again
  const again = createGrains({ THREE, renderer, shared, geom, yScale: 1e-4 });
  again.setAgent(agent);
  const firstTables = again.tables;
  again.setAgent(null); again.setAgent(agent);
  assert.equal(again.tables, firstTables, "the tables are cached");
  assert.equal(again.stats().grainBuildMs, 0);
  again.dispose();
  inits = 4;
  assert.equal(g.stats().grainUploads, 4);
  // the uploaded request table: texel 0 .x is the tread centre, .z the grain depth, the rest as built
  const up = g.uniforms.uReq.value.image.data, built = g.tables.requests.data;
  for (let i = 0; i < agent.requests.length; i++) {
    const o = i * REQ_TEXELS * 4;
    assert.equal(up[o], Math.fround(i * 0.13 + 0.025));
    assert.equal(up[o + 2], GRAIN_DEPTH);
    assert.equal(up[o + 1], built[o + 1]); assert.equal(up[o + 3], built[o + 3]);
    for (let k = 4; k < REQ_TEXELS * 4; k++) assert.equal(up[o + k], built[o + k]);
  }
  // warm-up: one draw of the group with every grain hidden (uP = -1), then everything off again
  assert.equal(g.warmUp(new THREE.PerspectiveCamera()), true);
  assert.equal(renders.length, 1);
  assert.equal(renders[0][0], g.group); assert.equal(renders[0][1], false, "no clear"); assert.equal(renders[0][2], 1);
  assert.equal(renderer.autoClear, true); assert.equal(g.group.visible, false);
  assert.ok(g.group.children.every((m) => !m.visible && (m.material !== g.material || m.geometry.drawRange.count === 0)));
  assert.equal(inits, 4, "the warm-up uploads nothing");

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
  // Each chunk's draw starts at 6 * K * chunk.start (gl_VertexID counts from drawArrays' first, which
  // carries the chunk offset) and draws ceil(count * density) grains of every column. Emulating the
  // shader's vid -> (corner, col, g) mapping over every drawn vertex lands g inside the chunk.
  const chunks = g.tables.grains.chunks, meshes = g.group.children.filter((m) => m.material === g.material);
  assert.equal(meshes.length, chunks.length);
  let drawnChunks = 0;
  meshes.forEach((m, c) => {
    if (!m.visible) return;
    drawnChunks++;
    const { start, count } = m.geometry.drawRange, ch = chunks[c], n = Math.ceil(ch.count * 1);
    assert.equal(start, 6 * K * ch.start, `chunk ${c} starts at 6·K·start`);
    assert.equal(count, 6 * K * n);
    const seenCols = new Set();
    for (const vid of [start, start + 5, start + 6, start + 6 * K - 1, start + count - 1]) {
      const inst = Math.floor(vid / 6), col = inst % K, gi = Math.floor(inst / K);
      assert.ok(gi >= ch.start && gi < ch.start + n, `vid ${vid} -> grain ${gi} in chunk ${c}`);
      seenCols.add(col);
    }
    assert.ok(seenCols.has(0) && seenCols.has(K - 1), "every column is drawn");
  });
  assert.equal(drawnChunks, full.grainChunks);
  assert.ok(chunks.length > 2 && meshes.some((m, c) => m.visible && chunks[c].start > 0), "the fixture spans several chunks");
  assert.equal(full.minGrainPx, 2, "grains far under their floor at this distance");
  g.update(frame({ minPx: 3 }));
  assert.equal(g.stats().minGrainPx, 3, "the Layers floor");
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
  // grains big enough to be sized by their tile: the size rule for the narrowest tread, thinnest step and
  // smallest scale at the drawn columns' farthest corner; and the cap
  const tableMin = (tables) => {
    const R = tables.requests.data;
    let halfW = Infinity, scale = Infinity;
    for (let i = iLead - K + 1; i <= iLead; i++) {
      const o = i * REQ_TEXELS * 4;
      halfW = Math.min(halfW, R[o + 3]);
      for (let k = 12; k <= 18; k++) if (R[o + k] > 0) scale = Math.min(scale, R[o + k]);
    }
    return { halfW, scale, step: Math.min(...tables.blocks.meta.step.filter((v) => v > 0)) };
  };
  for (const [yScale, expectCap] of [[0.05, false], [50, true]]) {
    const big = make(yScale);
    look(30);
    big.update(frame());
    const box = big.columnsBox(iLead, K), inv = cam.matrixWorldInverse;
    let far = 0;
    for (let k = 0; k < 8; k++) far = Math.max(far, -new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).applyMatrix4(inv).z);
    const t = tableMin(big.tables);
    let vx = Infinity;
    for (let k = 0; k < 8; k++) vx = Math.min(vx, Math.abs(cam.position.clone().sub(new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z)).normalize().x));
    const want = grainSizePx({ halfW: t.halfW, stepWorld: t.step * t.scale * yScale, pxPerWorld: cam.projectionMatrix.elements[5] * 0.5 * 1200 / far, minPx: 2, maxPx: GRAIN_MAX_PX, depthSpread: GRAIN_DEPTH * vx });
    assert.ok(Math.abs(big.stats().minGrainPx - want) < 1e-9);
    if (expectCap) assert.equal(big.stats().minGrainPx, GRAIN_MAX_PX);
    else assert.ok(want > 2 && want < GRAIN_MAX_PX, `tile-sized: ${want}`);
    assert.ok(box.min.z <= -GRAIN_DEPTH, "the culling box covers the grain depth");
    big.dispose();
  }
  assert.equal(inits, 12, "updates never upload");
  g.dispose();
});

// The re-read sweep: the shader's band and afterglow are sweepGain, the added light stays within 0.35
// luminance, only the leading column takes it, and the sweep plane follows the update's sweep with no
// upload.
test("the re-read sweep: band, afterglow on injected and re-sent grains, luminance cap, plane", async () => {
  const THREE = await import("../vendor/three.module.min.js");
  const { createGrains, sweepGain, accentGain, SWEEP_VERT, SWEEP_FRAG } = await import("../grains.js");
  const accent = new THREE.Color("#c8f784"), max = accentGain(accent);
  const lum = (c, k) => k * (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
  assert.ok(Math.abs(lum(accent, max) - 0.35) < 1e-12, "the cap is 0.35 luminance");
  const base = { sweepY: 10, pxPerWorld: 30, contextWorld: 30, max };
  assert.equal(sweepGain({ ...base, y: 10 }), Math.min(1, max), "on the band");
  assert.ok(Math.abs(sweepGain({ ...base, y: 10 + 2.5 / 30 }) - Math.exp(-1)) < 1e-12, "falls to 1/e 2.5 px away");
  assert.ok(sweepGain({ ...base, y: 5 }) < 1e-6, "plain grains far below: nothing");
  const inj = sweepGain({ ...base, y: 5, flags: 1 }), res = sweepGain({ ...base, y: 5, flags: 2 });
  assert.ok(Math.abs(inj - 0.6 * Math.exp(-5 / 7.5)) < 1e-6 && inj === res, "injected and re-sent grains glow below the band");
  assert.ok(sweepGain({ ...base, y: 15, flags: 1 }) < 1e-6, "no afterglow above the sweep");
  for (let y = 0; y < 20; y += 0.05) for (const flags of [0, 1, 2, 3]) assert.ok(lum(accent, sweepGain({ ...base, y, flags })) <= 0.35 + 1e-12);
  assert.equal(sweepGain({ ...base, y: 10, emissive: 0 }), 0);
  // the shader has the same expressions, on every grain column from uSweepCol0 (sweepColumns)
  assert.match(GRAIN_VERT, /if \(uSweepOn > 0\.5 && float\(col\) >= uSweepCol0\) \{/, "every grain column of the leading segment takes the band, not only the leading one");
  assert.match(GRAIN_VERT, /float band = exp\(-abs\(w\.y - uSweepY\) \* pxPerWorld \/ \(2\.5 \* uDpr\)\);/);
  assert.match(GRAIN_VERT, /float glow = \(fl & 3\) != 0 && w\.y < uSweepY \? 0\.6 \* exp\(-\(uSweepY - w\.y\) \/ max\(0\.25 \* ctx \* uYScale, 1e-4\)\) : 0\.0;/);
  assert.match(GRAIN_VERT, /colr \+= uAccent \* min\(\(band \+ glow\) \* uEmissive, uAccentMax\);/);
  assert.match(SWEEP_VERT, /float ext = vHalf \+ uDpr;/);
  assert.match(SWEEP_VERT, /vHalf = 1\.5 \* uDpr;/, "3 px tall");
  assert.ok(!/\bdiscard\b/.test(SWEEP_FRAG));
  // the plane follows the sweep; the grain uniforms carry it; nothing uploads
  const { loadTrace } = await import("../loader.js");
  const { entriesFor } = await import("../dump.mjs");
  const fix = new URL("./fixtures/codex", import.meta.url).pathname;
  const agent = (await loadTrace(await entriesFor([fix]))).trace.agents.find((a) => a.kind === "root");
  const geom = { x: (a, i) => i * 0.13, tread: (a, i) => [i * 0.13 - 0.065, i * 0.13 + 0.065], z: () => 0, lane: () => -1 };
  let inits = 0;
  const renderer = { autoClear: true, getContext: () => ({ colorMask() {} }), initTexture() { inits++; }, render() {} };
  const shared = { uCol: { value: [] }, uEm: { value: [] }, uFog: { value: new THREE.Color() }, uLight: { value: new THREE.Vector3() }, uFocusDist: { value: 100 } };
  const g = createGrains({ THREE, renderer, shared, geom, yScale: 1e-4, accent: "#c8f784" });
  g.setAgent(agent);
  const n = agent.requests.length, cam = new THREE.PerspectiveCamera(34, 1.6, 0.1, 4000);
  cam.position.set((n - 1) * 0.13, 1, 30); cam.lookAt((n - 1) * 0.13, 1, 0); cam.updateMatrixWorld();
  const frame = (o) => ({ camera: cam, uP: n - 1, columns: 4, density: 1, res: new THREE.Vector2(1920, 1200), dpr: 1, ...o });
  g.update(frame({ sweep: { y: 1.5, x0: 1, x1: 1.13, z: 0.02, col0: 2 } }));
  assert.equal(g.uniforms.uSweepOn.value, 1); assert.equal(g.uniforms.uSweepY.value, 1.5); assert.equal(g.uniforms.uSweepCol0.value, 2);
  assert.equal(g.sweepPlane.visible, true);
  const pu = g.sweepPlane.material.uniforms;
  assert.deepEqual([pu.uX0.value, pu.uX1.value, pu.uY.value, pu.uZ.value], [1, 1.13, 1.5, 0.02]);
  assert.ok(Math.abs(g.uniforms.uAccentMax.value - max) < 1e-12);
  g.update(frame({ sweep: { y: 1.5, x0: 1, x1: 1.13, z: 0.02 }, emissive: 0 }));
  assert.equal(g.sweepPlane.visible, false, "emissive 0 turns the sweep off");
  g.update(frame({ sweep: null }));
  assert.equal(g.uniforms.uSweepOn.value, 0); assert.equal(g.sweepPlane.visible, false, "paused: no plane");
  assert.equal(inits, 4, "the sweep uploads nothing");
  g.dispose();
});
