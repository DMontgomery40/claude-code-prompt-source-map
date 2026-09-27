// Grains: the focused agent's last few request columns before the playhead, drawn one quad per N0
// tokens instead of a painted face. Every grain's position is a pure function of three static tables
// (grain-rules.js), its id and the playhead uniform, so scrubbing uploads nothing: per frame the CPU
// sets uniforms, culls chunks and picks how many grains of each chunk to draw.
//
// Vertex pulling: a chunk is a Mesh with an attribute-less geometry drawn as 6 vertices per grain per
// column. gl_VertexID / 6 is the instance; instance % columns is the column, instance / columns the
// grain's slot in the shuffled id texture. Each chunk's drawRange starts at 6 * columns * chunk.start,
// so gl_VertexID (which counts from the draw's first vertex) already carries the chunk offset, and the
// first k grains of a chunk are a uniform subsample (the ids are shuffled in 128-grain batches).
//
// No three.js import: THREE and the renderer are injected, and the GLSL is exported as strings so
// node tests can check the hash against grain-rules.js without a browser.
import { REQ_TEXELS, BLOCK_TEXELS, TABLE_WIDTH, KERNEL, HASH_SALT, HASH_NAME, GRAIN_DEPTH, buildTables } from "./grain-rules.js";

const hex = (v) => `0x${(v >>> 0).toString(16).padStart(8, "0")}u`;

// lowbias32 (Chris Wellons) over uint, the grain id hash and the 24-bit unit float. Must equal
// hashU32 / hashGrainU32 / u32ToUnit in grain-rules.js bit for bit (test/grains-glsl.test.mjs).
export const GRAIN_HASH_GLSL = /* glsl */`
uint ${HASH_NAME}(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}
float u2f(uint u) { return float(u >> 8u) * (1.0 / 16777216.0); }
uint grainHash(uint b, uint s) { return ${HASH_NAME}(b * 0x9E3779B1u ^ s); }
const uint SALT_X = ${hex(HASH_SALT.x)};
const uint SALT_Z = ${hex(HASH_SALT.z)};
`;

// The same atmospheric haze as the ridge (scene.js HAZE), so a grain and the face beside it fog alike.
const GRAIN_HAZE_GLSL = /* glsl */`
uniform float uFocusDist;
float haze(vec3 w, float depth) {
  float a = 0.5 * smoothstep(16.0, 140.0, -w.z);
  float b = 0.5 * smoothstep(uFocusDist + 40.0, uFocusDist + 420.0, depth);
  return clamp(max(a, b), 0.0, 0.8);
}`;

// Grains fill the tread of their request edge to edge and GRAIN_DEPTH world units back from the face, so
// neighbouring columns meet as one granular slab. A grain is as wide as the face area it stands for
// (tread width x its tokens' height) times GRAIN_TILE, never under the floor (2 px, 3 at Layers) nor over
// the cap, so the slab stays covered from Requests to the deepest zoom. The 24 px cap keeps the widest
// tread of the Claude Code session (1.72 world units) covered at 256x (1.6% open; 7.1% at 150x), where
// 12 px left a third of it open.
export { GRAIN_DEPTH };
export const GRAIN_TILE = 2;
export const GRAIN_MAX_PX = 24;

// The size rule in device px, shared by the vertex shader (below) and stats().minGrainPx:
// clamp(GRAIN_TILE * sqrt((2 * halfW + depthSpread) * stepWorld) * pxPerWorld, minPx, maxPx) * sqrt(1 / density).
// depthSpread = grain depth x |view direction .x|: seen at an angle, a column's grains spread across its
// depth as well as its tread, so a narrow column needs wider grains to stay covered.
export function grainSizePx({ halfW, stepWorld, pxPerWorld, minPx, maxPx, density = 1, depthSpread = 0 }) {
  const tile = GRAIN_TILE * Math.sqrt(Math.max((2 * halfW + depthSpread) * stepWorld, 0)) * pxPerWorld;
  return Math.min(Math.max(tile, minPx), maxPx) * Math.sqrt(1 / Math.max(0.01, density));
}

// Spec 3.4. The leading column (the last) runs the full kernel at uT = uP: pour from above, collapse
// into the epoch's puck. It stands on its own request's tread while its heights ease toward the next
// request's. Trail columns show request j settled (kIn = 1, kC = 0): at an integer uT the kernel would
// still hide that request's own arrivals, which pour in during the request.
export const GRAIN_VERT = /* glsl */`
precision highp float;
precision highp int;
uniform highp sampler2D uReq;
uniform highp sampler2D uBlk;
uniform highp sampler2D uEpoch;
uniform highp usampler2D uIds;
uniform int uReqCount;
uniform int uColumns;
uniform float uP;
uniform float uYScale;
uniform float uTile;
uniform float uMinPx;
uniform float uMaxPx;
uniform float uDpr;
uniform float uSizeScale;
uniform vec2 uRes;
uniform float uSnap;
uniform float uSquare;
uniform vec4 uK0; // pourWindow, fallDur, dropHeight (fraction of context), collapseDur
uniform vec4 uK1; // jitterX, jitterZ (both unused: grains fill the tread and GRAIN_DEPTH), puckRadius, spiralTurns
uniform vec3 uCol[7];
uniform float uEm[7];
uniform float uAgentEm;
uniform vec3 uFog;
uniform vec3 uLight;
uniform float uSweepOn;
uniform float uSweepY;
uniform float uEmissive;
uniform vec3 uAccent;
uniform float uAccentMax;
out vec3 vColor;
out vec2 vQ;
out float vR;
${GRAIN_HAZE_GLSL}
${GRAIN_HASH_GLSL}
vec4 reqTexel(int i, int t) { int k = i * ${REQ_TEXELS} + t; return texelFetch(uReq, ivec2(k % ${TABLE_WIDTH}, k / ${TABLE_WIDTH}), 0); }
vec4 blkTexel(int r, int t) { int k = r * ${BLOCK_TEXELS} + t; return texelFetch(uBlk, ivec2(k % ${TABLE_WIDTH}, k / ${TABLE_WIDTH}), 0); }
void main() {
  int vid = gl_VertexID;
  int corner = vid % 6;
  int inst = vid / 6;
  int col = inst % uColumns;
  int g = inst / uColumns;
  // hidden grains are a degenerate point outside the clip volume: no fragments, no discard
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vColor = vec3(0.0); vQ = vec2(0.0); vR = 0.0;
  uint id = texelFetch(uIds, ivec2(g % ${TABLE_WIDTH}, g / ${TABLE_WIDTH}), 0).r;
  int b = int(id >> 12u);
  int s = int(id & 4095u);
  vec4 B0 = blkTexel(b, 0); // stratum, prefixEst, step, seenBy
  vec4 B1 = blkTexel(b, 1); // lastReq, flags, collapse epoch, slotBase
  bool lead = col == uColumns - 1;
  float uT = lead ? uP : floor(uP) - float(uColumns - 1 - col);
  float fi = floor(uT);
  if (fi < 0.0 || fi < B0.w || fi > B1.x) return;
  int i0 = clamp(int(fi), 0, uReqCount - 1);
  if (!(reqTexel(i0, 2).w > 0.0)) return; // split unknown: the ridge is grey, no grains
  // request i0 as it was (no easing toward i0 + 1): the leading column matches the trail column it
  // becomes, and a focused request (P = i + 0.65) shows exactly request i
  vec4 A0 = reqTexel(i0, 0); // grains.js's copy: x tread centre, y context, z grain depth, w tread half width
  int k = int(B0.x + 0.5);
  int bt = k < 4 ? 1 : 2, st = k < 4 ? 3 : 4, c = k < 4 ? k : k - 4;
  float baseK = reqTexel(i0, bt)[c];
  float scaleK = reqTexel(i0, st)[c];
  float ctx = A0.y, halfW = A0.w;
  float zF = reqTexel(i0, 4).w;
  uint u = grainHash(uint(b), uint(s));
  float h = u2f(u), hx = u2f(${HASH_NAME}(u ^ SALT_X)), hz = u2f(${HASH_NAME}(u ^ SALT_Z));
  vec3 rest = vec3(A0.x + (2.0 * hx - 1.0) * halfW,
                   baseK + (B0.y + (B1.w + float(s) + 0.5) * B0.z) * scaleK,
                   zF - hz * A0.z);
  vec3 p = rest;
  if (lead) {
    bool continued = (int(B1.y + 0.5) & 32) != 0;
    float tIn = (continued || uSnap > 0.5) ? B0.w : B0.w + h * uK0.x;
    float kIn = 1.0;
    if (!continued) {
      float t = clamp((uT - tIn) / uK0.y, 0.0, 1.0);
      kIn = uSnap > 0.5 ? step(tIn, uT) : 1.0 - (1.0 - t) * (1.0 - t) * (1.0 - t);
    }
    p.y = mix(rest.y + uK0.z * ctx, rest.y, kIn);
    float kC = 0.0;
    int e = int(floor(B1.z + 0.5));
    if (e >= 0) {
      float end = B1.x + 1.0;
      kC = uSnap > 0.5 ? step(end, uT) : smoothstep(end - uK0.w, end, uT);
      vec4 pk = texelFetch(uEpoch, ivec2(e, 0), 0); // puck x, y (tokens), z, start request
      float a = 6.283185307179586 * uK1.w * h, r = uK1.z * (0.25 + 0.75 * h);
      p = mix(p, vec3(pk.x + r * cos(a), pk.y + (h - 0.5) * pk.y, pk.z + r * sin(a)), kC);
    }
    if (uT < tIn || kC >= 1.0) return;
  }
  vec4 wp = modelMatrix * vec4(p.x, p.y * uYScale, p.z, 1.0);
  vec3 w = wp.xyz;
  // the face's own light (normal +z), so a settled grain matches the stratum beside it
  vec3 base = uCol[k];
  vec3 V = normalize(cameraPosition - w);
  float diff = max(uLight.z, 0.0);
  float rim = pow(1.0 - max(V.z, 0.0), 3.0);
  float spec = pow(max(normalize(uLight + V).z, 0.0), 48.0);
  float shade = (0.44 + 0.6 * diff) * mix(0.62, 1.0, smoothstep(0.0, 2.5, abs(w.y)));
  vec3 colr = base * shade + base * rim * 0.25 + vec3(1.0, 0.96, 0.9) * spec * 0.07;
  float lum = dot(colr, vec3(0.2126, 0.7152, 0.0722));
  colr = mix(mix(uFog * 1.5, vec3(lum), 0.24), colr, clamp(uEm[k] * uAgentEm, 0.0, 1.0));
  vec4 mv = viewMatrix * wp;
  vec4 clip = projectionMatrix * mv;
  float pxPerWorld = projectionMatrix[1][1] * 0.5 * uRes.y / clip.w; // device px per world unit here
  // The re-read sweep, on the leading column only: a band of the accent around uSweepY (world y), 2.5 px
  // deep, and below the band an afterglow on injected and re-sent grains that fades over a quarter of
  // the column. The light added never exceeds 0.35 in luminance (uAccentMax), so nothing washes out.
  if (lead && uSweepOn > 0.5) {
    float band = exp(-abs(w.y - uSweepY) * pxPerWorld / (2.5 * uDpr));
    int fl = int(B1.y + 0.5);
    float glow = (fl & 3) != 0 && w.y < uSweepY ? 0.6 * exp(-(uSweepY - w.y) / max(0.25 * ctx * uYScale, 1e-4)) : 0.0;
    colr += uAccent * min((band + glow) * uEmissive, uAccentMax);
  }
  vColor = mix(colr, uFog, haze(w, -mv.z));
  // grainSizePx: the face area this grain stands for, as a square, grown by uTile, clamped to
  // [uMinPx, uMaxPx] device px, then grown by sqrt(1 / density)
  float tilePx = uTile * sqrt(max((2.0 * halfW + A0.z * abs(V.x)) * B0.z * scaleK * uYScale, 0.0)) * pxPerWorld;
  float rad = 0.5 * clamp(tilePx, uMinPx, uMaxPx) * uSizeScale;
  // grains of 3 px and more each take a slightly different tone (+-5%), so the slab's front reads as
  // sand; smaller grains stay the flat layer colour (at 2 px a tone per grain would be pixel noise)
  float tone = u2f(${HASH_NAME}(u ^ 0x9e3779b9u)) - 0.5;
  vColor *= 1.0 + 0.1 * tone * smoothstep(2.6, 3.4, 2.0 * rad / uDpr);
  float halfQ = uSquare > 0.5 ? rad : rad + 1.0;
  vec2 cn = corner == 0 ? vec2(-1.0, -1.0) : corner == 1 ? vec2(1.0, -1.0) : corner == 2 ? vec2(1.0, 1.0)
          : corner == 3 ? vec2(-1.0, -1.0) : corner == 4 ? vec2(1.0, 1.0) : vec2(-1.0, 1.0);
  clip.xy += cn * halfQ * 2.0 / uRes * clip.w;
  vQ = cn * halfQ;
  vR = rad;
  gl_Position = clip;
}`;

// Round grains: analytic coverage in device px fed to alpha-to-coverage (MSAA), so edges are smooth
// without blending or sorting. Square grains skip it (A/B on tile GPUs).
export const GRAIN_FRAG = /* glsl */`
precision highp float;
uniform float uSquare;
in vec3 vColor;
in vec2 vQ;
in float vR;
layout(location = 0) out highp vec4 grainOut;
#define gl_FragColor grainOut
void main() {
  float a = uSquare > 0.5 ? 1.0 : clamp(0.5 - (length(vQ) - vR), 0.0, 1.0);
  gl_FragColor = vec4(vColor, a);
  #include <colorspace_fragment>
}`;

// The sweep plane: one additive quad across the leading tread at the sweep's height, 3 px tall with an
// analytic soft edge, in front of the face. The quad's ends come from uniforms, so moving it uploads
// nothing; position.x picks the end (-1, 1), position.y the side of the line (-1, 1).
export const SWEEP_VERT = /* glsl */`
uniform float uX0;
uniform float uX1;
uniform float uY;
uniform float uZ;
uniform vec2 uRes;
uniform float uDpr;
out float vD;
out float vHalf;
void main() {
  vec4 a = projectionMatrix * viewMatrix * vec4(uX0, uY, uZ, 1.0);
  vec4 b = projectionMatrix * viewMatrix * vec4(uX1, uY, uZ, 1.0);
  vec4 p = position.x < 0.0 ? a : b;
  vec2 d = (b.xy / b.w - a.xy / a.w) * uRes;
  d = length(d) > 1e-3 ? normalize(d) : vec2(1.0, 0.0);
  vHalf = 1.5 * uDpr;
  float ext = vHalf + uDpr;
  p.xy += vec2(-d.y, d.x) * position.y * ext * 2.0 / uRes * p.w;
  vD = position.y * ext;
  gl_Position = p;
}`;
export const SWEEP_FRAG = /* glsl */`
precision highp float;
uniform vec3 uAccent;
uniform float uStrength;
in float vD;
in float vHalf;
layout(location = 0) out highp vec4 sweepOut;
#define gl_FragColor sweepOut
void main() {
  float cover = clamp(vHalf + 0.5 - abs(vD), 0.0, 1.0);
  gl_FragColor = vec4(uAccent * uStrength, cover);
  #include <colorspace_fragment>
}`;

// The sweep's light on one grain of the leading column, as a multiple of the accent colour (the vertex
// shader's rule): a 2.5 px band around the sweep plus, for injected (1) and re-sent (2) grains below it,
// an afterglow over a quarter of the column; capped so the added luminance stays within 0.35.
export function sweepGain({ y, sweepY, pxPerWorld, dpr = 1, flags = 0, contextWorld, emissive = 1, max }) {
  const band = Math.exp(-Math.abs(y - sweepY) * pxPerWorld / (2.5 * dpr));
  const glow = (flags & 3) !== 0 && y < sweepY ? 0.6 * Math.exp(-(sweepY - y) / Math.max(0.25 * contextWorld, 1e-4)) : 0;
  return Math.min((band + glow) * emissive, max);
}

// The largest multiple of an accent colour whose luminance (linear) stays within `limit`.
export function accentGain(color, limit = 0.35) {
  const lum = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  return lum > 0 ? limit / lum : 0;
}

// createGrains: the three.js side. frame (update) = { camera, uP, columns, density, square, res, dpr,
// agentEm, focusDist, sweep: { on, x, y }, emissive }.
export function createGrains({ THREE, renderer, shared, geom, yScale, onUpload = () => {}, reducedMotion = false, accent = "#c8f784" }) {
  const group = new THREE.Group();
  group.name = "grains";
  group.visible = false;
  const gl = renderer.getContext();
  const dummyF = new THREE.DataTexture(new Float32Array(4), 1, 1, THREE.RGBAFormat, THREE.FloatType);
  const dummyU = new THREE.DataTexture(new Uint32Array(1), 1, 1, THREE.RedIntegerFormat, THREE.UnsignedIntType);
  for (const t of [dummyF, dummyU]) { t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; }
  const uniforms = {
    uReq: { value: dummyF }, uBlk: { value: dummyF }, uEpoch: { value: dummyF }, uIds: { value: dummyU },
    uReqCount: { value: 1 }, uColumns: { value: 1 }, uP: { value: 0 },
    uYScale: { value: yScale }, uTile: { value: GRAIN_TILE }, uMinPx: { value: 2 }, uMaxPx: { value: GRAIN_MAX_PX }, uDpr: { value: 1 }, uSizeScale: { value: 1 },
    uRes: { value: new THREE.Vector2(1, 1) }, uSnap: { value: reducedMotion ? 1 : 0 }, uSquare: { value: 0 },
    uK0: { value: new THREE.Vector4(KERNEL.pourWindow, KERNEL.fallDur, KERNEL.dropHeightTokens, KERNEL.collapseDur) },
    uK1: { value: new THREE.Vector4(KERNEL.jitterX, KERNEL.jitterZ, KERNEL.puckRadius, KERNEL.spiralTurns) },
    uCol: shared.uCol, uEm: shared.uEm, uFog: shared.uFog, uLight: shared.uLight, uFocusDist: shared.uFocusDist,
    uAgentEm: { value: 1 },
    uSweepOn: { value: 0 }, uSweepY: { value: 0 }, uEmissive: { value: 1 },
    uAccent: { value: new THREE.Color(accent) }, uAccentMax: { value: 0 }
  };
  uniforms.uAccentMax.value = accentGain(uniforms.uAccent.value);
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: GRAIN_VERT, fragmentShader: GRAIN_FRAG, uniforms,
    side: THREE.DoubleSide, alphaToCoverage: true
  });
  // A2C writes the coverage alpha into the colour buffer too, which would let the page show through
  // grain edges; keep the destination alpha (the ridge behind is opaque; over empty space the dark
  // page makes the additive composite equal to "over" within a level).
  const maskOn = () => gl.colorMask(true, true, true, false);
  const maskOff = () => gl.colorMask(true, true, true, true);
  const planeU = {
    uX0: { value: 0 }, uX1: { value: 0 }, uY: { value: 0 }, uZ: { value: 0 }, uRes: uniforms.uRes, uDpr: uniforms.uDpr,
    uAccent: uniforms.uAccent, uStrength: { value: 0.75 }
  };
  const planeGeo = new THREE.BufferGeometry();
  planeGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const sweepPlane = new THREE.Mesh(planeGeo, new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: SWEEP_VERT, fragmentShader: SWEEP_FRAG, uniforms: planeU,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  }));
  sweepPlane.frustumCulled = false;
  sweepPlane.visible = false;
  sweepPlane.renderOrder = 3;
  sweepPlane.onBeforeRender = maskOn;
  sweepPlane.onAfterRender = maskOff;
  group.add(sweepPlane);

  let cur = null; // { agent, tables, textures, chunks, meta, ... }
  const TABLE_CACHE = 4, tableCache = new Map(); // agent -> built tables, most recent last
  let uploads = 0, builds = 0, lastBuildMs = 0;
  const last = { grains: 0, chunks: 0, instances: 0, columns: 0, density: 1, minPx: null };

  function texture(data, width, height, uint) {
    const t = uint
      ? new THREE.DataTexture(data, width, height, THREE.RedIntegerFormat, THREE.UnsignedIntType)
      : new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    // upload now, not lazily on the first frame that draws grains (which may be mid-scrub)
    renderer.initTexture(t);
    uploads++;
    onUpload(t);
    return t;
  }

  function clear() {
    if (!cur) return;
    for (const c of cur.chunks) { group.remove(c.mesh); c.mesh.geometry.dispose(); }
    for (const t of Object.values(cur.textures)) t.dispose();
    cur = null;
  }

  // Build (or take prebuilt) tables for one agent and upload them. The only place grains upload.
  function setAgent(agent, built = null) {
    clear();
    if (!agent) return null;
    const t0 = performance.now();
    // tables are kept for the last few agents, so refocusing (root -> subagent -> root) does not rebuild
    const cached = built || tableCache.get(agent);
    const tables = cached || buildTables(agent, geom);
    lastBuildMs = cached ? 0 : performance.now() - t0;
    tableCache.delete(agent); tableCache.set(agent, tables);
    if (tableCache.size > TABLE_CACHE) tableCache.delete(tableCache.keys().next().value);
    builds++;
    const { requests: R, blocks: B, grains: G } = tables;
    if (!G.count || !R.count) { cur = { agent, tables, textures: {}, chunks: [], empty: true }; return cur; }
    const idsW = TABLE_WIDTH, idsH = Math.max(1, Math.ceil(G.count / TABLE_WIDTH));
    const ids = new Uint32Array(idsW * idsH);
    ids.set(G.ids);
    const nE = Math.max(1, R.epochs.length);
    // The grains' own copy of the request table: texel 0 .x becomes the tread centre (grains fill the
    // tread, which is not centred on the request's x) and .z the grain depth behind the face (the epoch
    // id there is not read on the GPU; collapse targets come from the block table).
    const req = new Float32Array(R.data);
    const reqDepth = R.depth;
    for (let i = 0; i < R.count; i++) { const o = i * REQ_TEXELS * 4; req[o] = R.centre[i]; req[o + 2] = R.depth[i]; }
    const textures = {
      req: texture(req, R.width, R.height, false),
      blk: texture(B.data, B.width, B.height, false),
      epoch: texture(R.epochData.length >= nE * 4 ? R.epochData : new Float32Array(nE * 4), nE, 1, false),
      ids: texture(ids, idsW, idsH, true)
    };
    uniforms.uReq.value = textures.req; uniforms.uBlk.value = textures.blk;
    uniforms.uEpoch.value = textures.epoch; uniforms.uIds.value = textures.ids;
    uniforms.uReqCount.value = R.count;
    const m = B.meta;
    // per request (CPU): tread centre, context, tread half width, z, the smallest stratum scale, for
    // culling boxes and minGrainPx
    const reqX = new Float64Array(R.count), reqCtx = new Float64Array(R.count), reqHalf = new Float64Array(R.count), reqZ = new Float64Array(R.count);
    const reqScaleMin = new Float64Array(R.count);
    for (let i = 0; i < R.count; i++) {
      const o = i * REQ_TEXELS * 4;
      reqX[i] = req[o]; reqCtx[i] = R.data[o + 1]; reqHalf[i] = R.data[o + 3]; reqZ[i] = R.data[o + 19];
      let sm = Infinity;
      for (const k of [12, 13, 14, 15, 16, 17, 18]) if (R.data[o + k] > 0) sm = Math.min(sm, R.data[o + k]);
      reqScaleMin[i] = Number.isFinite(sm) ? sm : 1;
    }
    let stepMin = Infinity;
    for (let r = 0; r < m.step.length; r++) if (m.step[r] > 0) stepMin = Math.min(stepMin, m.step[r]);
    let maxCtx = 0;
    for (let i = 0; i < R.count; i++) maxCtx = Math.max(maxCtx, reqCtx[i]);
    const chunks = G.chunks.map((c) => {
      let minSeen = Infinity, maxLast = -Infinity;
      const pucks = new Set();
      for (let r = c.blockLo; r < c.blockHi; r++) {
        minSeen = Math.min(minSeen, m.seenBy[r]); maxLast = Math.max(maxLast, m.lastReq[r]);
        if (m.epoch[r] >= 0) pucks.add(m.epoch[r]);
      }
      // bounding sphere over the chunk's whole life: every column it can stand in, its drop, its pucks
      const i0 = Math.max(0, minSeen), i1 = Math.min(R.count - 1, maxLast + 1);
      const box = new THREE.Box3();
      let top = 0;
      for (let i = i0; i <= i1; i++) top = Math.max(top, reqCtx[i]);
      box.expandByPoint(new THREE.Vector3(reqX[i0] - reqHalf[i0], 0, reqZ[i0] - GRAIN_DEPTH));
      box.expandByPoint(new THREE.Vector3(reqX[i1] + reqHalf[i1], top * (1 + KERNEL.dropHeightTokens) * yScale, reqZ[i1]));
      for (const e of pucks) {
        const p = R.epochs[e].puck;
        box.expandByPoint(new THREE.Vector3(p[0] - KERNEL.puckRadius, 0, p[2] - KERNEL.puckRadius));
        box.expandByPoint(new THREE.Vector3(p[0] + KERNEL.puckRadius, 2 * p[1] * yScale, p[2] + KERNEL.puckRadius));
      }
      const g = new THREE.BufferGeometry();
      g.boundingSphere = box.getBoundingSphere(new THREE.Sphere());
      g.boundingBox = box;
      g.setDrawRange(0, 0);
      const mesh = new THREE.Mesh(g, material);
      mesh.frustumCulled = false; // culled below, per frame, against the columns actually drawn
      mesh.visible = false;
      mesh.onBeforeRender = maskOn;
      mesh.onAfterRender = maskOff;
      group.add(mesh);
      return { start: c.start, count: c.count, minSeen, maxLast, mesh };
    });
    const epochAt = new Map(R.epochs.map((e) => [e.start, e])); // epoch by its first request
    cur = { agent, tables, textures, chunks, reqX, reqCtx, reqHalf, reqZ, reqDepth, reqScaleMin, epochAt, stepMin: Number.isFinite(stepMin) ? stepMin : 0, maxCtx, n: R.count, N0: tables.N0, total: G.count };
    return cur;
  }

  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), frameBox = new THREE.Box3(), sph = new THREE.Sphere();
  const _v = new THREE.Vector3(), _c = new THREE.Vector3();

  // The world box the drawn columns can occupy this frame (columns, drop, a collapse's puck), or null.
  function columnsBox(uP, K) {
    if (!cur || cur.empty) return null;
    const iLead = Math.floor(uP), iLo = Math.max(0, iLead - K + 1), iHi = Math.min(cur.n - 1, iLead + 1);
    if (iHi < 0 || iLo > cur.n - 1) return null;
    let top = 0, z0 = Infinity, z1 = -Infinity;
    for (let i = iLo; i <= iHi; i++) { top = Math.max(top, cur.reqCtx[i]); z0 = Math.min(z0, cur.reqZ[i]); z1 = Math.max(z1, cur.reqZ[i]); }
    frameBox.min.set(cur.reqX[iLo] - cur.reqHalf[iLo], 0, z0 - Math.max(GRAIN_DEPTH, KERNEL.puckRadius));
    frameBox.max.set(cur.reqX[iHi] + cur.reqHalf[iHi], top * (1 + KERNEL.dropHeightTokens) * yScale, z1 + KERNEL.puckRadius);
    const e = cur.epochAt.get(iLead + 1);
    if (e) {
      const p = e.puck;
      frameBox.expandByPoint(_v.set(p[0] - KERNEL.puckRadius, 0, p[2] - KERNEL.puckRadius));
      frameBox.expandByPoint(_v.set(p[0] + KERNEL.puckRadius, 2 * p[1] * yScale, p[2] + KERNEL.puckRadius));
    }
    return frameBox;
  }

  function update(f) {
    const K = f.columns | 0;
    last.grains = 0; last.chunks = 0; last.instances = 0; last.columns = K; last.density = f.density; last.minPx = null;
    if (!cur || cur.empty || K <= 0) { group.visible = false; return; }
    const iLead = Math.floor(f.uP), iLo = iLead - K + 1;
    const box = columnsBox(f.uP, K);
    f.camera.updateMatrixWorld();
    pv.multiplyMatrices(f.camera.projectionMatrix, f.camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(pv);
    const seen = box && frustum.intersectsBox(box);
    group.visible = !!seen;
    if (!seen) { for (const c of cur.chunks) c.mesh.visible = false; return; }
    uniforms.uP.value = f.uP;
    uniforms.uColumns.value = K;
    uniforms.uSizeScale.value = Math.sqrt(1 / Math.max(0.01, f.density));
    const dpr = f.dpr || 1;
    uniforms.uMinPx.value = (f.minPx || 2) * dpr;
    uniforms.uMaxPx.value = GRAIN_MAX_PX * dpr;
    uniforms.uDpr.value = dpr;
    uniforms.uRes.value.copy(f.res);
    uniforms.uSquare.value = f.square ? 1 : 0;
    uniforms.uAgentEm.value = f.agentEm ?? 1;
    // the sweep: sw = { y (world), x0, x1 (the leading tread), z (its face) } while playing, else null
    const sw = f.sweep;
    uniforms.uSweepOn.value = sw ? 1 : 0;
    uniforms.uEmissive.value = f.emissive ?? 1;
    sweepPlane.visible = !!sw && uniforms.uEmissive.value > 0;
    if (sw) {
      uniforms.uSweepY.value = sw.y;
      planeU.uX0.value = sw.x0; planeU.uX1.value = sw.x1; planeU.uY.value = sw.y; planeU.uZ.value = sw.z;
      planeU.uStrength.value = 0.75 * Math.min(1, uniforms.uEmissive.value);
    }
    for (const c of cur.chunks) {
      const on = c.minSeen <= iLead && c.maxLast >= iLo && frustum.intersectsSphere(sph.copy(c.mesh.geometry.boundingSphere));
      c.mesh.visible = on;
      if (!on) continue;
      const n = Math.max(1, Math.ceil(c.count * f.density));
      c.mesh.geometry.setDrawRange(6 * K * c.start, 6 * K * n);
      last.chunks++; last.instances += n * K;
    }
    last.grains = last.instances;
    if (last.chunks) {
      // The smallest grain drawn, in CSS px: grainSizePx (the vertex shader's rule) for the narrowest
      // drawn tread, the thinnest grain step and the smallest stratum scale, at the farthest corner of
      // the drawn columns. A lower bound, no readback; the floor makes it at least 2 (3 at Layers).
      let far = 0, halfW = Infinity, scale = Infinity, depth = Infinity, vx = Infinity;
      for (let k = 0; k < 8; k++) {
        _v.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z);
        _c.subVectors(f.camera.position, _v).normalize();
        vx = Math.min(vx, Math.abs(_c.x)); // the smallest |view direction .x| any drawn grain can have
        _v.applyMatrix4(f.camera.matrixWorldInverse);
        far = Math.max(far, -_v.z);
      }
      for (let i = Math.max(0, iLo); i <= Math.min(cur.n - 1, iLead); i++) { halfW = Math.min(halfW, cur.reqHalf[i]); scale = Math.min(scale, cur.reqScaleMin[i]); depth = Math.min(depth, cur.reqDepth[i]); }
      const px = grainSizePx({
        halfW: Number.isFinite(halfW) ? halfW : 0, stepWorld: cur.stepMin * (Number.isFinite(scale) ? scale : 1) * yScale,
        pxPerWorld: f.camera.projectionMatrix.elements[5] * 0.5 * f.res.y / Math.max(1e-6, far),
        minPx: uniforms.uMinPx.value, maxPx: uniforms.uMaxPx.value, density: f.density,
        depthSpread: (Number.isFinite(depth) ? depth : 0) * (Number.isFinite(vx) ? vx : 0)
      });
      last.minPx = px / dpr;
    }
  }

  // Draw one hidden grain into the real framebuffer once, so the GPU builds the grain pipeline (alpha to
  // coverage, masked alpha) at load instead of on the first zoom-in, where it cost one ~80 ms frame that
  // the density governor then read as slowness. Every vertex lands outside the clip volume: no pixels.
  function warmUp(camera) {
    if (!cur || cur.empty || !cur.chunks.length) return false;
    const c = cur.chunks[0];
    group.visible = true; c.mesh.visible = true;
    c.mesh.geometry.setDrawRange(6 * c.start, 6);
    uniforms.uColumns.value = 1; uniforms.uP.value = -1;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(group, camera);
    renderer.autoClear = autoClear;
    c.mesh.visible = false; group.visible = false;
    c.mesh.geometry.setDrawRange(0, 0);
    return true;
  }

  // Grains actually standing (in context at their column) at this playhead: CPU count from the block
  // table, for stats and tests only (not per frame).
  function liveCount(uP, K, density = 1) {
    if (!cur || cur.empty || K <= 0) return 0;
    const m = cur.tables.blocks.meta, rows = m.nSlots.length;
    const iLead = Math.floor(uP);
    let n = 0;
    for (let col = 0; col < K; col++) {
      const i = iLead - (K - 1 - col);
      if (i < 0 || !(cur.tables.requests.sum[Math.min(i, cur.n - 1)] > 0)) continue;
      for (let r = 0; r < rows; r++) if (m.seenBy[r] <= i && i <= m.lastReq[r]) n += m.nSlots[r];
    }
    return Math.round(n * density);
  }

  return {
    group, material, uniforms, sweepPlane,
    setAgent,
    update,
    warmUp,
    columnsBox,
    get agent() { return cur ? cur.agent : null; },
    get tables() { return cur ? cur.tables : null; },
    epochStartingAt: (i) => (cur && !cur.empty ? cur.epochAt.get(i) : undefined),
    stats() {
      return {
        grains: last.grains, grainChunks: last.chunks, grainColumns: last.columns, grainDensity: last.density, minGrainPx: last.minPx,
        grainsResident: cur && !cur.empty ? cur.total : 0, grainChunksTotal: cur ? cur.chunks.length : 0,
        grainN0: cur ? cur.N0 || 0 : 0, grainBuilds: builds, grainBuildMs: Math.round(lastBuildMs * 10) / 10, grainUploads: uploads
      };
    },
    liveCount,
    dispose() { clear(); material.dispose(); sweepPlane.geometry.dispose(); sweepPlane.material.dispose(); dummyF.dispose(); dummyU.dispose(); }
  };
}
