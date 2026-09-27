# Trace Grains + Playback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Trace's static landscape into a living material: grains near the playhead, a session scrub with pour, compaction collapse and subagent growth, a per-request re-read sweep, and readable block text at max zoom, all at 60 fps on a dpr 1 1920x1200 screen with zero GPU uploads after load.

**Architecture:** Two small float textures (request table, block table) plus one static grain id texture make every grain's position a pure function of a request-space time uniform `uT`. One cut plane uniform `uCutX` in compressed-x space scrubs the whole landscape. Grains draw by vertex pulling (no attributes; draw count = density × columns), so LOD and the K-column trail cost no uploads. Sweep and flash are emissive terms in shaders we own; no post-processing.

**Tech Stack:** vanilla ES modules, three.js r185 (vendored, WebGLRenderer, GLSL ES 3.0), node:test, Python Playwright (scratchpad harness, real GPU).

**Spec:** `docs/superpowers/specs/2026-09-26-trace-grains-playback-design.md`. Background reports (read both before coding): scratchpad `recon.md` (data model, scene internals with file:line), `research.md` (rendering techniques and constraints).

## Global Constraints

- All work in `site/trace/`. `site/trace` must end byte-identical in `~/gpt6-prompt-source-map` and `~/claude-code-prompt-source-map` (the integration owner mirrors; implementers work in `~/gpt6-prompt-source-map` only).
- CSP: no inline scripts, no eval/`new Function`, no blob scripts, no WASM, no CDN fetches, no new vendor files unless bundled once and committed with relative imports.
- Renderer stays `WebGLRenderer` r185; new shaders use `glslVersion: THREE.GLSL3`; no EffectComposer, no bloom, no `alphaHash`.
- Legibility floor at devicePixelRatio 1: grains never below 2 px on screen; no noise textures; text 13 px body / 11.5 px caption / 7:1 contrast on opaque panels; emissive never lowers text contrast.
- Zero `bufferData`/`bufferSubData`/`texSubImage2D`/`texImage2D` calls per frame after load, except when the focused agent changes.
- Playback state lives outside `S` and never calls `set()` per tick (that pushes view history).
- Strata order is `STRATA` from `panels.js` (harness, summary, you, injected, outside, agents, model). Never `KINDS` from `model.js`.
- Tests: `cd site && node --test` must stay green (146 tests, 1 skipped today). Real-log checks use the frozen copies in the scratchpad `logs/` folder only; never commit logs.
- Dev-only files must be added to the `SKIP` list in `site/src/trace-build.mjs:10`.
- Commit after each task on `main` in `~/gpt6-prompt-source-map` (local only, no push). Commit message style: `Trace: <what changed>`.

---

## Interfaces shared by all tasks

```js
// landscape-geometry.js (Task 1)
export function createGeometry({ trace, layout, W, yScale, rule, massif }) // layout = L from minimap.js
// returns { W, yScale, x(agent, i), tread(agent, i) -> [x0, x1], z(agent, i), tops(agent, i) -> {aB0:[4], aB1:[4]},
//           depth(agent, h), heightAt(agent, x), lane(agent, i) }
// Semantics are exactly the closures at scene.js:359-378 and 522-555; a node test pins identity.

// grain-rules.js (Task 2)
export const STRATA_KEYS;                       // panels.js STRATA order
export const KERNEL = { pourWindow: 0.35, fallDur: 0.25, dropHeightTokens: 0.12, collapseDur: 0.3, puckRadius: 0.8, spiralTurns: 5 }; // retimed 2026-09-27 so a request completes by i + 0.6 and collapses in [i + 0.7, i + 1]; focus lands at i + 0.65
export function chooseGrainSize(totalEst, cap = 400_000) // -> N0 from [10, 20, 50, 100, 200, 500, 1000]
export function buildRequestTable(agent, geom)   // -> { data: Float32Array, texels: 4, width: 2048, height, count, epochs: [{ start, end, puck: [x, y, z] }] }
//   texel 0: [x, contextTokens, epochId, xTreadHalfWidth]
//   texel 1: [base0..base3] cumulative token base of strata 0..3 (base0 = 0)
//   texel 2: [base4, base5, base6, sumStrata]
//   texel 3: [scale0..scale3]  texel 4 would overflow: pack scale4..6 into a 5th texel? NO: texels = 5. (see Task 2 step 1: texels is a constant exported as REQ_TEXELS = 5)
export function buildBlockTable(agent, opts)     // -> { data: Float32Array, texels: 2, width: 2048, height, count, meta }
//   texel 0: [stratumIndex, prefixEst, est, seenBy]
//   texel 1: [lastReq, flags, epochId, 0]   flags bits: 1 injected, 2 resend, 4 own, 8 carried, 16 hasRef
//   meta: { est: Float32Array, seenBy: Int32Array, lastReq: Int32Array, stratum: Uint8Array, prefixEst: Float32Array, flags: Uint8Array, epoch: Int32Array, blockIndex: Int32Array }
export function buildGrains(blockMeta, N0, { chunkSize = 32768 } = {}) // -> { ids: Uint32Array, chunks: [{ start, count, blockLo, blockHi }], count, N0 }
//   id = blockRow << 12 | slot ; slot < 4096 (a block with more slots is split across consecutive rows: see Task 2)
export function shuffleBatches(ids, start, count, batch = 128, seed = 1) // in place, deterministic
export function hashGrain(b, s)                   // -> float [0,1); integer hash identical to the GLSL version
export function grainPosition(tables, b, s, uT, params) // JS port of the kernel -> { x, y, z, hidden, kIn, kC }  (y in tokens; caller multiplies by yScale)
export function bandsForRequest(tables, i)        // -> [{ b, blockIndex, stratum, y0, y1 (tokens), flags }] blocks in context at request i

// playback.js (Task 3)
export function createPlayback({ times: Float64Array|number[], X: (t) => number, speeds = [1, 2, 4, 8, 16], speed = 4 })
// -> { get P(), setP(v), playing, play(), pause(), toggle(), speed, setSpeed(v), faster(), slower(), step(dir),
//      tick(dtMs) -> { P, crossed: number[] }, timeAt(P), xAt(P), PAtX(x), PAtTime(t), get n(), get atEnd() }

// scene.js additions (Tasks 4, 5, 6)
scene.setPlayhead({ P, playing, sweep })  // P root request space float; sweep 0..1 progress within the request or null
scene.getPlayhead()                        // -> { P }
scene.setGrainOptions({ enabled, density, square, columns })
scene.stats()                              // + { grains, grainChunks, uploads }
createScene(host, { ..., getText })        // getText(agentId, ref) -> Promise<string>

// grains.js (Task 4)
export function createGrains({ THREE, shared, geom, yScale, onUpload }) // -> { group, setAgent(agent, tables, grains), update(frame), stats(), dispose() }
//   frame = { camera, uT, cutX, columns, sweepY, sweepOn, focus: Vector3, pxPerUnit, density, square, reducedMotion }

// block-text.js (Task 6)
export function createBlockText({ getText, group, maxPanes = 24 }) // -> { update({ camera, agentId, bands, geom, i, pxPerUnit, viewport }), clear(), dispose() }
```

---

### Task 1: Extract landscape placement into `landscape-geometry.js` (no visual change)

**Files:**
- Create: `site/trace/landscape-geometry.js`
- Modify: `site/trace/scene.js:359-378, 522-555` (replace closures with calls into the factory)
- Test: `site/trace/test/landscape-geometry.test.mjs`

**Interfaces:** Produces `createGeometry` as above. Consumes `landscapeRule`, `tread`, `terrainPlacement` from `scene-rules.js`, `STRATA` from `panels.js`, and the layout `L` built in `minimap.js` (see `buildLayout` or equivalent; find the function that yields `X`, `yMax`, `lanes`, `segs`, `links`).

- [ ] **Step 1: Write the failing test.** Load a fixture trace the way `strata-invariant.test.mjs` does, build `L` the way `scene.js:319-322` does (import the same layout builder), and assert for every agent and request: `geom.tops(agent, i)` equals a reference implementation copied verbatim from the current `topsOf` closure into the test file (so the test pins the old numbers, not the new code); `geom.x`, `geom.z`, `geom.tread` likewise against copies of `xOf`, `zOf` and the tread logic. Also assert `heightAt` at 50 evenly spaced x values per agent equals the copied `heightAt`.
- [ ] **Step 2: Run** `cd site && node --test trace/test/landscape-geometry.test.mjs`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `createGeometry` by moving the closures out of `createScene` unchanged in logic. Keep `massif` and `compact` behaviour. Export one factory, no three.js import.
- [ ] **Step 4: Rewire `scene.js`** to call `geom.*` everywhere the closures were used (search for `topsOf(`, `xOf(`, `zOf(`, `heightAt(`, `crest`). Keep the names as local aliases if that minimises the diff (`const topsOf = (a, i) => geom.tops(a, i)`).
- [ ] **Step 5: Run** the whole suite: `cd site && node --test`. Expected: all pass. Then load `/trace/?synthetic&view=3d` in the scratchpad harness and take a screenshot at overview; compare by eye with a screenshot from before the change (same camera): identical.
- [ ] **Step 6: Commit** `Trace: extract landscape placement into landscape-geometry.js`.

---

### Task 2: `grain-rules.js`: tables, grains, kernel port, bands (pure)

**Files:**
- Create: `site/trace/grain-rules.js`
- Test: `site/trace/test/grain-rules.test.mjs`

**Interfaces:** Produces everything listed for `grain-rules.js` above. Consumes `stratumRows`, `blockPart` from `model.js`, `STRATA` from `panels.js`, and `createGeometry` from Task 1 (only `x`, `tread`, `z`, `lane`). Export `REQ_TEXELS = 5` and `BLOCK_TEXELS = 2`; the request table is 5 texels per request: `[x, context, epochId, treadHalfWidth]`, `[base0..3]`, `[base4, base5, base6, sumStrata]`, `[scale0..3]`, `[scale4, scale5, scale6, zFront]`.

Definitions the implementer must honour:
- A block `b` is "in context at request r" when `b.i` is inside `r.window` or listed in `r.extra`. `seenBy(b)` and `lastReq(b)` are the first and last request indices where that holds. Test that membership is a contiguous interval; if `extra` breaks contiguity for some block, give that block a second row in the block table (same est, different interval) and add the case to the test.
- `prefixEst(b)` for stratum k = sum of `blockPart(b', k)` over rows that `stratumRows(agent, r, k)` lists before `b` at any request `r` where `b` is in context (it is constant across `b`'s interval because blocks are append-only; assert that in the test).
- Epochs: epoch 0 starts at request 0; a new epoch starts at each request whose `window[0]` is greater than the previous request's `window[0]` (a compaction). Each epoch's puck is at `[geom.x(agent, epochStart), 0.5 * post * yScaleTokensPlaceholder, geom.z(agent, epochStart)]` expressed in tokens for y (the scene multiplies by `yScale`); use the compaction's `post` tokens, or the first request's context if no compaction record matches.
- Synthetic fallback: `est ?? Math.ceil(chars / 4)`; `scale[k] = strata[k] / sum(est of rows in k)` when `r.scale` is missing.
- `chooseGrainSize(totalEst, cap)`: smallest `N0` in `[10, 20, 50, 100, 200, 500, 1000]` with `ceil(totalEst / N0) <= cap`.
- `buildGrains`: rows in block order; a block with more than 4096 slots is split across consecutive rows that share every field except a `slotBase` (add `slotBase` to texel 1 `.w`). Chunks are consecutive ranges of about `chunkSize` grains that never split a block row. After building, call `shuffleBatches` per chunk.
- `hashGrain(b, s)`: a 32-bit integer hash (for example lowbias32 of `b * 0x9E3779B1 ^ s`) divided by 2^32; the GLSL version in Task 4 must produce identical values for the first 1,000 (b, s) pairs; write the expected values into the test as a table of 8 and the rest via the function.
- `grainPosition`: implements the kernel in the spec section 3.4 exactly, in tokens for y and world units for x and z, with `params = { yScale, ...KERNEL }`. Between integer requests interpolate x and bases linearly using `fract(uT)`.
- `bandsForRequest(tables, i)`: for each block in context at i, `[y0, y1]` in tokens using base and scale of request i.

- [ ] **Step 1: Write failing tests** (all on the fixtures used by `strata-invariant.test.mjs`, plus the real logs when `TRACE_REAL_SESSIONS` is set, reading the scratchpad `logs/cc` and `logs/codex` paths):
  1. For every request r and stratum k: `sum over blocks in context of est * scale[k]` equals `r.strata[k]` within `N0`; and for every such block, `prefixEst(b) * scale[k]` equals the cumulative `tok` of the rows before it in `stratumRows(agent, r, k)` within 1e-6 relative.
  2. Membership intervals are contiguous (or the split-row case is covered).
  3. `chooseGrainSize(1_000_000, 400_000)` is 10; `chooseGrainSize(50_000_000, 400_000)` is 200.
  4. `buildGrains` count equals `sum(ceil(est / N0))`; no chunk splits a row; `shuffleBatches` is deterministic and a permutation; the first 25% of a chunk has each stratum's share within 3% of the chunk's share (uniform subsample).
  5. Kernel: for a block with `seenBy = 10`, `lastReq = 20`, `hidden` is true at `uT = 9.99`, false at `uT = 11`, `kIn` is 1 at `uT = seenBy + pourWindow + fallDur + 0.01`, y is monotone non-decreasing in `uT` during the fall, position at `uT = 15` equals position at `uT = 15` after evaluating `uT = 18` first (pure function), `kC` is 1 at `uT = 21`, and the position at `kC = 1` equals the puck plus the spiral offset.
  6. `bandsForRequest` bands tile each stratum with no gaps or overlaps beyond 1e-6.
- [ ] **Step 2: Run** `cd site && node --test trace/test/grain-rules.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** `grain-rules.js`.
- [ ] **Step 4: Run** the test file and then the whole suite. Expected: PASS. Then run once with `TRACE_REAL_SESSIONS=1` pointing at the scratchpad logs and record in the commit message the grain counts and `N0` chosen for the CC session root and its largest subagent.
- [ ] **Step 5: Commit** `Trace: grain tables, kernel and bands (pure rules)`.

---

### Task 3: `playback.js`: transport state and clock (pure)

**Files:**
- Create: `site/trace/playback.js`
- Test: `site/trace/test/playback.test.mjs`

**Interfaces:** Produces `createPlayback` as above. Consumes nothing from the scene.

Behaviour:
- `P` is clamped to `[0, n - 1]`. `setP` never emits events; `tick` does.
- `xAt(P)` interpolates `X(times[i])` linearly between integer requests; `PAtX` is its inverse (monotone piecewise-linear search); `timeAt(P)` interpolates times; `PAtTime` inverts.
- `tick(dtMs)` while playing moves x forward by `speed / (n - 1)` per second (so the playhead crosses the compressed ruler at a constant screen speed regardless of idle gaps) and returns the integer request indices crossed, in order; when `P` reaches `n - 1` it pauses and `atEnd` is true. Speed changes cycle through `speeds`.
- `step(+1|-1)` moves to the next or previous integer and pauses.

- [ ] **Step 1: Write failing tests:** round trips `PAtX(xAt(P))` and `PAtTime(timeAt(P))` within 1e-9 for 100 random `P`; with times containing a 3-hour idle gap and an `X` that squeezes it, 1 s of ticking at speed 4 advances x by exactly `4 / (n - 1)` on both sides of the gap; crossing from `P = 3.2` to `5.7` returns `[4, 5]`, crossing backwards (implement `tick` with negative speed for the test via `setSpeed(-4)`? no: add a `direction` field defaulting to 1) returns `[5, 4]`; reaching the end pauses; `step` pauses.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** `playback.js` (about 120 lines).
- [ ] **Step 4: Run** the test file and the full suite. Expected: PASS.
- [ ] **Step 5: Commit** `Trace: playback transport state and clock`.

---

### Task 4: `grains.js` and the scene's playhead: cut plane, ghost, grain columns, pour and collapse

**Files:**
- Create: `site/trace/grains.js`
- Modify: `site/trace/scene.js` (strata shader uniforms `uCutX`, `uGrainX0`, `uGhost`; pins/links/marker shaders compare x to `uCutX`; `setPlayhead`, `getPlayhead`, `setGrainOptions`; `frame()` grain update; `fitDepth` box extended; `stats()`), `site/trace/render-quality.js` (export `grainPixelSize(unitsPerPixel, grainWorld)` helper if useful)
- Test: `site/trace/test/scene-rules.test.mjs` (add: the K-columns-by-zoom rule as a pure function `grainColumns(mapZoom, pxPerGrain)` placed in `scene-rules.js`, tested for 0 at overview and 16 at Layers), plus the Playwright checks in Task 7.

**Interfaces:** Consumes Task 1 `createGeometry`, Task 2 tables and `buildGrains`, `hashGrain` (GLSL twin), `unitsPerPixel` from `render-quality.js`. Produces `createGrains`, `scene.setPlayhead`, `scene.getPlayhead`, `scene.setGrainOptions`, extended `scene.stats()`.

Implementation requirements:
- **Vertex pulling.** Each chunk is a `THREE.Mesh` with an attribute-less `BufferGeometry` (`setDrawRange(0, 6 * instancesToDraw)`, `boundingSphere` set by hand to cover rest, drop and puck positions of the chunk's blocks) sharing one `ShaderMaterial` (`glslVersion: THREE.GLSL3`). `onBeforeRender` sets `uChunkStart` and `uChunkCount`. In the vertex shader: `int vid = gl_VertexID; int corner = vid % 6; int inst = vid / 6; int col = inst % uColumns; int g = inst / uColumns;` (so the first `k * uColumns` instances are the first k grains of every column), `uint id = texelFetch(uGrainIds, ivec2((uChunkStart + g) % 2048, (uChunkStart + g) / 2048), 0).r;` from an `R32UI` `DataTexture` (`THREE.UnsignedIntType`, `THREE.RedIntegerFormat`, `usampler2D`). Column time `uT_col = (col == uColumns - 1) ? uP : floor(uP) - float(uColumns - 1 - col)`.
- **Tables** are `RGBA32F` `DataTexture`s with `NearestFilter`, uploaded in `setAgent` only. Verify in the vertex shader with `texelFetch`.
- **Kernel** is the spec section 3.4; the GLSL hash must equal `hashGrain` (Task 2 test table). Billboard quads in view space; size `max(2.0 * uPxToWorld, grainWorld) * sqrt(1 / uDensity)`; hidden grains output `gl_Position = vec4(2.0, 2.0, 2.0, 1.0)`.
- **Fragment:** stratum colour from the shared `uCol`, the same haze/fog as the ridge, round analytic coverage with `alphaToCoverage: true` (and a `uSquare` switch that skips coverage for the A/B). Keep a `uEmissive` slot for Task 5's sweep.
- **Culling and density** per frame in `update`: frustum test each chunk's sphere with `THREE.Frustum`; `instancesToDraw = ceil(chunk.count * density) * columns`. Density from a governor: keep p90 of the last 30 frame intervals; above 18 ms multiply by 0.75 (floor 0.05), below 12 ms for 120 frames multiply by 1.1 (cap 1).
- **Columns K** = `grainColumns(mapZoom, pxPerGrain)`: 0 while a grain at `N0` tokens would be under 2.5 px tall (`grainWorld = N0 * yScale` tokens to world, compare with `unitsPerPixel`), else ramp 4 at Agents, 8 at Requests, 16 at Layers.
- **Cut plane and ghost:** strata fragment shader: if `vW.x > uCutX` or (`vW.x > uGrainX0` and K > 0) mix colour toward `uFog` by 0.72 and drop emissive (ghost, still opaque, still depth-writing). Pins, links, compaction markers: hide instances whose x is beyond `uCutX` in their vertex shaders (degenerate position). The reflection pass uses the same rule. Add a **cap quad** at `x = uGrainX0` for the focused agent drawn with the strata material from the request table's tops at that request (reuse `tops`), so the solid part never looks hollow.
- **`setPlayhead({P, playing, sweep})`:** stores P, computes `cutX = geom.x(root, floor(P))` interpolated by `fract(P)` to the next request, `grainX0 = tread(agent, floor(P) - K + 1)[0]`; marks `dirty = 1` every frame while `playing`; when `floor(P)` changes, nothing is uploaded.
- **Focus change:** when the focused agent changes (`show(S)`), rebuild tables and grains for that agent (`setAgent`), off the main thread through `worker.js` if building takes over 50 ms on the real CC session (measure; if so add a `grains` message type that returns transferable buffers). Count uploads in `stats().uploads`.
- **`fitDepth`** box: extend `max.y` by the drop height and include the cap and puck positions.
- **Reduced motion:** `kIn` and `kC` snap (pass `uSnap = 1.0`, shader uses `step` instead of ease).

- [ ] **Step 1: Write the failing pure test** for `grainColumns` in `scene-rules.test.mjs` and a GLSL-hash twin test: add to `grain-rules.test.mjs` an assertion that the file `grains.js` contains the string `lowbias32` (or the chosen hash name) and that `hashGrain` matches 8 hand-computed values (already there from Task 2).
- [ ] **Step 2: Implement** `grains.js` and the scene changes.
- [ ] **Step 3: Verify in the harness** (scratchpad `bench/`): load the frozen CC session at dpr 1; call `window.__trace.scene.setPlayhead({P: 900, playing: false, sweep: null})` then zoom to Requests on the main thread (use `A.focusRequest` through `window.__trace` or click a ridge, then `#zoom-in`) and screenshot: grains visible as a pile at request 900, solid to the left, ghost to the right; `stats().uploads` unchanged after `setPlayhead` calls at P = 400, 700, 1200. Then `setPlayhead` sweeping P from 0 to n over 10 s in 60 steps with `playing: true`: no `bufferData`/`texSubImage2D` calls (wrap in the harness), fps and draw calls recorded, screenshot at a compaction (`P = compaction request - 0.5`) showing the collapse.
- [ ] **Step 4: Run** `cd site && node --test`. Expected: PASS.
- [ ] **Step 5: Commit** `Trace: grains near the playhead, cut plane and ghost, pour and collapse`.

---

### Task 5: Transport UI, keys, sweep and flash, sweep labels

**Files:**
- Modify: `site/trace/index.html` (add `#playback` after `#map-zoom`), `site/trace/trace.css` (style like `.map-zoom`, bottom centre, phone-width stacking), `site/trace/app.js` (create playback from `trace.agents[root].requests` and `L.X`; rAF-driven `tick` only while playing; `scene.setPlayhead` on every change; `focusRequest` sets `P`; add `#playback` to `controlsTop` at app.js:738; keep state out of `S`), `site/trace/keys.js` and `site/trace/palette.js` (Space toggle, `,` and `.` step, `<` and `>` speed), `site/trace/grains.js` and `site/trace/scene.js` (sweep uniforms `uSweepY`, `uSweepX`, `uSweepOn`, flash by block flags, afterglow; sweep also lights the cap quad and the L2 lifted core), `site/trace/panels.js` only if a formatter is needed.
- Test: `site/trace/test/ui.test.mjs` (extend: the transport renders play/pause label, readout formats "req 1,234 · Sep 25 · 3:02 am" using `fmtClock`, speed cycles), `site/trace/test/search.test.mjs` or `keys` test (extend: new key rows exist and are unique).

**Interfaces:** Consumes `createPlayback` (Task 3), `scene.setPlayhead` (Task 4). Produces the DOM `#playback` with `button.play`, `input[type=range].scrub` (0..1 in x space, step 0.0005), `button.speed`, `output.readout`, and `data-playing` attribute.

Requirements:
- Transport hidden in the 2D view and when the scene is absent.
- Scrub input `input` event: `pb.setP(pb.PAtX(value))`, `scene.setPlayhead`. Playing: one rAF loop in app.js that calls `pb.tick(dt)`, updates the range value and readout, and calls `scene.setPlayhead({P, playing: true, sweep: fract(P)})`. Idle: no rAF.
- Sweep: `sweepY` in tokens = `fract(P) * context(floor(P))` mapped to world by `yScale`; grain fragment adds `uAccent * exp(-abs(y - uSweepY) / w)` with `w` = 2.5 px in world units, plus for flags injected or resend an afterglow `0.6 * exp(-(uSweepY - y) / (0.25 * context))` when `y < uSweepY`. Clamp total added luminance to 0.35. Draw the sweep plane itself as one additive quad the width of the leading tread, height 3 px, analytic soft edges, only while `playing`.
- Sweep labels: on each crossed request (from `tick().crossed`), take `bandsForRequest(tables, i)` filtered to injected or resend flags with `est >= 900`, top 6 by est; schedule a CSS2D label (reuse the l1 label pool style, `textContent` only: `"<label> · ≈<fmtTok(est)>"`) to appear when `fract(P)` passes the band's `y0 / context`, fading over 1 s. Skip when `speed >= 16`.
- Keys and palette rows: `Space` "Play or pause", `,` "Previous request", `.` "Next request", `<` "Slower", `>` "Faster". Do not steal Space when focus is in an input or button.

- [ ] **Step 1: Write the failing UI test** with the fake DOM pattern from `ui.test.mjs`: creating the transport with a stub playback renders the four controls, toggling updates `data-playing`, the readout for `P = 1233.5` on a fixture reads `req 1,234 · <fmtClock of that time>`.
- [ ] **Step 2: Implement** the transport, keys, sweep and labels.
- [ ] **Step 3: Verify in the harness:** press Space through Playwright's real keyboard at Requests zoom on the CC session; screenshots at 0.5 s intervals for 6 s show the sweep moving up the leading column and at least one injected label popping; `stats().uploads` unchanged during playback; fps recorded.
- [ ] **Step 4: Run** the suite. Expected: PASS.
- [ ] **Step 5: Commit** `Trace: playback transport, keys, re-read sweep and injected flashes`.

---

### Task 6: Words at max zoom (`block-text.js`)

**Files:**
- Create: `site/trace/block-text.js`
- Modify: `site/trace/scene.js` (new CSS2D group `words`, call `blockText.update` from the throttled detail pass when `mapDetail.level === 3` and K > 0; accept `getText` option), `site/trace/app.js` (pass a wrapper around `A.getText` into `createScene`), `site/trace/trace.css` (`.word-pane`: opaque panel `#0d1720` at 92% minimum paint, 13 px body, 11.5 px caption, max 46ch, 5 lines clamp)
- Test: `site/trace/test/ui.test.mjs` (extend: pane pool caps at 24, hides when band px height under 40, cache returns the same promise for the same ref, truncation to 400 chars with an ellipsis, `textContent` only: a label containing `<b>` renders literally)

**Interfaces:** Consumes `bandsForRequest` (Task 2), the scene's camera and `geom`, `getText(agentId, ref)`. Produces `createBlockText`.

Requirements: at most 4 concurrent text fetches; results cached by `ref.file + ':' + ref.offset`; a `data:image` result shows the caption "image"; blocks without `ref` show "not in the log"; panes anchor at the band's centre on the face (`x = tread centre, y = (y0+y1)/2 * yScale, z = zF + 0.3`); hidden when the camera looks at the face from behind (dot of face normal and view direction) or the anchor projects outside the viewport insets; declutter by y order, largest bands first.

- [ ] **Step 1: Write failing tests** as listed.
- [ ] **Step 2: Implement** `block-text.js` and the hooks.
- [ ] **Step 3: Verify in the harness:** at Layers zoom on request 939 of the CC session, screenshot shows panes with real text from CLAUDE.md or a skill; text measured at 13 px; contrast ratio of pane text over pane background at least 7:1 (compute from the CSS colours in the test).
- [ ] **Step 4: Run** the suite. Expected: PASS.
- [ ] **Step 5: Commit** `Trace: read the words behind a column at max zoom`.

---

### Task 7: Existing-loop efficiency and the GPU harness

**Files:**
- Modify: `site/trace/scene.js:1433, 1460-1473` (`updateMapDetail` runs only when the camera moved more than 0.5 px or zoom changed more than 1%, or the playhead crossed a request; at most 10 Hz while playing), `site/trace/map-overview.js:72` and the navigator call in `frame()` (redraw at most 10 Hz while playing and only when the viewport rectangle changed otherwise)
- Create: scratchpad `bench/gpu_smoke.py` (asserts real GPU renderer string, zero uploads over a 10 s scrub, draw calls under 120 at each level, records fps, long frames, grains drawn; writes `bench/perf_<label>.json`), extend `bench/perf.py` to zoom onto the main thread (click "Explore main thread" then zoom) instead of the screen centre.
- Test: `site/trace/test/scene-rules.test.mjs` (extend with the pure throttle rule `shouldRefreshDetail(prev, next)` if extracted to `scene-rules.js`)

- [ ] **Step 1: Write the failing pure test** for `shouldRefreshDetail`.
- [ ] **Step 2: Implement** the throttles and the harness.
- [ ] **Step 3: Measure** before and after on the CC session at all four levels with and without playback; put the table in the commit message.
- [ ] **Step 4: Run** the suite. Expected: PASS.
- [ ] **Step 5: Commit** `Trace: change-driven detail and minimap refresh; GPU smoke harness`.

---

### Task 8: Integration, real-log verification, mirror, build, ship

Owner: the integration lead (this session).

- [ ] Run `cd site && node --test` and `npm run build` in `~/gpt6-prompt-source-map`.
- [ ] Run the GPU smoke and `perf.py` on the CC session and the Codex rollout; compare to `perf_baseline.json`; fix regressions.
- [ ] Review screenshots at dpr 1 by eye at overview, agents, requests, layers, mid-playback, at a compaction, and at a subagent spawn: no shimmer, no pixel noise, no dim text; grains at least 2 px.
- [ ] Copy `site/trace` and the docs to `~/claude-code-prompt-source-map`; `diff -rq` empty; run its suite and build.
- [ ] Commit in both repos; deploy both with `npx wrangler deploy` from `site/` and push both (David: "when it looks good, just ship it").
- [ ] Write the session memory file and update `MEMORY.md`.
