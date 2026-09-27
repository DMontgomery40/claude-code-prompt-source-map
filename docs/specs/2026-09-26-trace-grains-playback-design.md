# Trace: grains, playback, the re-read sweep, and words at max zoom

> **Superseded (2026-09-27).** Grains are removed from Trace: the pour, the re-read sweep and sweep labels,
> grain density and its frame-time governor, words at max zoom, and the compaction puck and collapse
> (`grains.js`, `grain-rules.js`, `block-text.js` are gone). They do not fit Trace's harness-layer
> framing. Playback stays: the transport, step, speed, scrub, the cut plane, playhead-driven landmarks and
> the follow director, including its compaction shot (`playback.js`, `transport.js`, `director.js`). Kept
> for history; do not build on it.

Date: 2026-09-26. Status: approved by David in conversation ("go with your exact recommendation", "when it looks good, ship it"). Scope lives in `site/trace/` and must land byte-identical in both site repos (`gpt6-prompt-source-map`, `claude-code-prompt-source-map`).

## 1. Why

Trace today is a fossil: a solid landscape of painted strata. Four things are physically true of every agent session, whatever it was doing, and none of them is visible yet:

1. Tokens pour in, block by block, request by request.
2. The model re-reads the entire context on every request.
3. Context hits a ceiling and compaction crushes it into a small summary.
4. Work forks into subagents and comes back.

This pass makes those four facts visible and makes the scene a living material, without changing the data mapping people already learned (x = compressed time, y = context tokens by stratum, z = agent lane, strata colours unchanged).

## 2. What the user sees

**Overview is unchanged.** At overview the request pitch is about one pixel; grains would be pixel noise (banned on low-DPI screens). The solid landscape stays exactly as it is today.

**The playhead.** A transport bar sits beside the zoom control: play/pause, a scrub bar across the session's compressed time, a speed control, and the current request's clock. The playhead defaults to the end of the session, so a freshly loaded session looks like today. Scrubbing moves a cut plane across the whole landscape: everything at x beyond the playhead becomes a faint ghost (fogged silhouette, still opaque, no sorting), everything before it is solid. Subagent ridges, spawn and return ribbons, pins, compaction markers and crest labels all obey the same cut, so the whole session grows in lockstep when playing.

**Grains.** The last K request columns before the playhead, on the focused agent (the main thread unless a subagent is focused), are drawn as grains instead of a painted face: instanced quads, one grain per N tokens, coloured by stratum, at least 2 px on screen. K rises with zoom, from 0 at overview (pure solid) to about 16 at the Requests and Layers levels; the solid face is cut away where grains stand so nothing is drawn twice. A 966k column becomes a visibly enormous pile.

**Pour.** While playing, blocks that enter the context at request i fall into the leading column from above, staggered inside the request, and settle into their stratum. Scrubbing backwards is exact: every grain's position is a pure function of its static data and the playhead.

**Compaction.** When the playhead crosses a compaction, the old column collapses along a spiral into a small puck at the boundary (the summary), and the survivors pour out of the puck into the new, short column. The 969k to 89k moment is felt, not read.

**Subagents.** When the cut crosses a spawn, the child's ridge starts growing in its lane and the spawn ribbon draws; when it crosses the return, the return ribbon draws back to the parent. (A grain burst from parent to child is a follow-up, not this pass.)

**The re-read sweep.** While playing, once per request, a bright reading plane sweeps the leading column from bottom to top. Grains it passes glow briefly; grains of the Injected stratum, and of any re-sent block, flash harder and leave a short afterglow. Injected blocks above a size threshold pop a small label as the sweep reaches them ("skill · superpowers:brainstorming ≈ 5.2k"), at most six per request, fading over a second. Over a session the user watches the same forgotten skills and memories light up thousands of times.

**Words at max zoom.** At the Layers zoom level, blocks in the leading column whose band is at least 40 px tall on screen get an HTML text pane anchored to the band: the block label, its size, and the first lines of its actual text. At most 24 panes; 13 px body, 11.5 px caption, 7:1 contrast on an opaque panel; hidden when the band faces away from the camera or leaves the viewport. The ridge is made of words, and at the bottom of the zoom you can read them.

**Focus and the playhead.** Focusing a request (the L1 core stage, the L2 lifted core) sets the playhead to that request, so the core the user lifts is made of grains and the sweep runs through it. Back returns the playhead with the view, because the playhead is part of the view the scene restores, but it is not part of `S` and never pushes history on its own.

## 3. Architecture

### 3.1 Renderer

Stay on `WebGLRenderer` r185, MSAA on, pixel ratio capped at 2, hand-written GLSL ES 3.0 (`glslVersion: THREE.GLSL3`). No WebGPU, no EffectComposer, no bloom. Sweep and flash are emissive terms computed in the shaders we own. Rationale and citations: scratchpad `research.md` (WebGPURenderer does not support ShaderMaterial; closed-form motion needs no compute; bloom costs twelve fullscreen passes and lowers local contrast).

### 3.2 Time

The playhead `P` is a float in the focused root's request space: `1234.37` means 37% through request 1234. Playback advances `P` so that compressed x moves at a constant rate (idle gaps are already squeezed by `L.X`), with speed presets in requests per second (1, 2, 4, 8, 16; default 4). The cut plane for the whole landscape is `uCutX = L.X(t(P)) * W`, where `t(P)` interpolates root request times, so one uniform cuts every agent consistently. Per-agent request cursors for the focused agent are derived on the CPU once per change of `floor(P)`, never per frame.

### 3.3 Static tables, uploaded once per focused agent

Built in `grain-rules.js` (pure, testable in node), uploaded by `grains.js`:

- **Request table** (RGBA32F, 4 texels per request): world x; per-stratum base y in tokens (7 cumulative sums in STRATA order from `panels.js`); per-stratum `scale`; context total; compaction flags (epoch id, puck position). About 7k texels for 1,700 requests.
- **Block table** (RGBA32F, 2 texels per block): stratum index; `prefixEst` (sum of `blockPart` of earlier same-stratum blocks in the same epoch, fixed because blocks are append-only and compaction survivors are re-added as new blocks); `est`; `seenBy`; `lastReq` (the last request of its epoch); flags (injected, resend, own); the epoch's puck index. About 20k texels.
- **Grain buffer**: one `Uint32Array` per grain, `blockIndex << 12 | slot`. Grains are generated at a base granularity `N0` tokens per grain chosen per agent so the agent's total stays under a resident cap (target 400k grains for the focused agent; `N0` is 10, 20, 50, 100 tokens). Within each chunk (about 32k grains, contiguous blocks) grains are stored shuffled in 128-grain batches, so `instanceCount = ceil(n * density)` is a uniform subsample and density LOD costs no upload. Grain size scales by `sqrt(1/density)` so coverage stays honest.

The synthetic dev session lacks `est`, `seenBy` and `scale`; the builder falls back to `est ?? chars/4` and `scale = strata[k] / sum(est)` over the window.

### 3.4 The grain kernel (vertex shader, pure function of `uT`)

For grain `(b, s)` drawn for column `j` (`uT = j` for trail columns, `uT = P` for the leading column):

```
i = floor(uT), f = fract(uT)
R0 = request[i], R1 = request[i+1]           // interpolate x and bases for smooth motion
visible = seenBy(b) <= i && i <= lastReq(b)
rest.y  = (base[k](R) + (prefixEst(b) + (s + 0.5) * N) * scale[k](R)) * yScale
rest.x  = mix(x(R0), x(R1), f) + jitterX(b, s)  // jitter inside the request's tread
rest.z  = zF + jitterZ(b, s)                    // face plus a shallow depth
h       = hash(b, s)                            // integer hash, deterministic
tIn     = seenBy(b) + h * pourWindow
kIn     = easeOutCubic(clamp((uT - tIn) / fallDur, 0, 1))
p       = mix(rest + vec3(0, dropHeight, 0), rest, kIn)
kC      = smoothstep(lastReq(b) + 1 - collapseDur, lastReq(b) + 1, uT)   // into the puck
p       = mix(p, puck(epoch(b)) + spiral(h), kC)
hidden  = uT < tIn || kC >= 1 || !visible
```

Hidden grains get a degenerate `gl_Position`, never `discard`. Size is `max(2 px, grainWorld * pxPerUnit)`. Fragment: stratum colour with the same haze and fog as the ridge, analytic round coverage through `alphaToCoverage` (A/B against plain squares on the M-series; keep the faster if it reads as well), sweep emissive `exp(-|y - uSweepY| / w)` and flash for injected/resend flags with afterglow behind the sweep.

### 3.5 Solid ridge changes

The strata shader gets three uniforms: `uCutX` (ghost beyond), `uGrainX0..uGrainX1` (cut away the face where grain columns stand, with a thin `fwidth` band), and the sweep pair. A cap quad at the leading cut, drawn with the same strata shader from the request table, closes the shell so the ridge is never hollow. Pins, links and compaction markers compare their own x to `uCutX` in their shaders, so the CPU does nothing per frame.

### 3.6 Per-frame CPU work

1. Map transport state to `P`; set `uT`, `uCutX`, sweep, focus uniforms.
2. For each grain chunk of each drawn column: frustum test on a precomputed bounding sphere that covers rest, drop and puck positions; set `visible` and `instanceCount`.
3. Frame-time governor every 30 frames: p90 above 18 ms multiplies density by 0.75; below 12 ms for two seconds multiplies by 1.1, capped at 1. Degrade ladder: density, then square grains, then fewer trail columns, then grains off (today's scene). Pixel ratio never drops below 1.
4. Zero buffer or texture uploads after load. A Playwright test wraps `bufferData`, `bufferSubData` and `texSubImage2D` and asserts zero calls during a scrub.

Existing costs fixed in the same pass: `updateMapDetail` walks every request of every agent every 90 ms at detail 1 and above, and the minimap's second renderer redraws on every dirty frame. Both become change-driven (camera or playhead moved past a threshold) and are throttled to 10 Hz during playback.

### 3.7 Modules

New, all in `site/trace/`:

- `landscape-geometry.js`: the placement closures extracted from `createScene` (`topsOf`, `xOf`, `zOf`, `heightAt`, tread and taper, depth profile) as a pure factory. No visual change; a node test pins face heights to the old values.
- `grain-rules.js`: table builders, chunking and shuffle, the kernel ported to JS for tests, `N0` selection.
- `grains.js`: three.js side: textures, chunks, material, per-frame culling and density, sweep uniforms.
- `playback.js`: pure transport state and clock: `P`, playing, speed, mapping between `P`, time and compressed x, per-agent cursors, the request-change event.
- `block-text.js`: cached, rate-limited `getText` wrapper and the CSS2D pane pool for words at max zoom.

Changed: `scene.js` (new `setPlayhead`, `getPlayhead`, grain hookup in `frame()`, `fitDepth` box extended to cover the drop height, sweep and pane hooks), `app.js` (transport wiring, `getText` passed into the scene, focusRequest sets the playhead), `index.html` and `trace.css` (`#playback`), `keys.js` and `palette.js` (Space play/pause, `,` and `.` step a request, `<` and `>` change speed), `worker.js` only if table building moves off the main thread (it should if it exceeds 50 ms on session B).

### 3.8 Error handling and degradation

- No WebGL2 or a software renderer string (`SwiftShader`, `llvmpipe`, `Basic Render`): grains off, playback still works through the cut plane alone.
- A block without `ref` (unlogged harness) has grains but no words; its pane shows the label and "not in the log".
- Text fetch failures leave the pane with its label; no retries in a loop.
- Reduced motion: the 2D view is unchanged; in 3D, pour, collapse and sweep animations are stepped (instant), the cut plane still scrubs.

## 4. Legibility floor (hard)

Verified at devicePixelRatio 1, 1920x1200. Grains never below 2 px. No noise textures, no alpha hashing, no bloom. Text 13 px body, 11.5 px captions, 7:1 body contrast on an opaque pane. Emissive from sweep and flash is clamped so it never lowers text contrast. Saturated colour only for the sweep, flashes and existing status colours.

## 5. Testing

- `node --test` from `site/`: new tests beside the existing suites.
  - `landscape-geometry.test.mjs`: heights and x/z identical to the pre-extraction closures on fixtures.
  - `grain-rules.test.mjs`: grains times N sum to each stratum within one grain (extends the strata invariant); kernel port: monotone arrival, exact reversibility under the hash, puck reached at epoch end plus `collapseDur`, survivors visible only from their `seenBy`; shuffled subsample is uniform across strata within 3%.
  - `playback.test.mjs`: `P` to time to x round trips; constant x speed across an idle gap; request-change events fire once per integer crossing in both directions; speed presets.
- Playwright (Python, scratchpad harness, real GPU via `--use-angle=metal`, dpr 1) on the frozen real logs (the frozen Claude Code session, the largest Codex rollout of 2026-09-26): renderer string is a real GPU; zero uploads during a 10 s scrub; draw calls under 120 at every level; fps and long-frame counts at overview, agents, requests, layers before and after; grain count drawn at each level; screenshots reviewed by eye at dpr 1 for shimmer, noise and contrast.
- Existing suites (110 Trace tests, 160 site tests) and `npm run build` pass in both repos; `diff -rq` of `site/trace` between repos is empty.

## 6. Out of scope

Grain bursts for subagent spawn, per-grain cached versus fresh colouring (the data is per request only), SDF text, WebGPU, sound.
