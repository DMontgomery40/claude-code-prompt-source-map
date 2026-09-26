// The three.js landscape. L0: each agent is a ridge whose front face is its context over time,
// layered by stratum. L1: the focused agent's requests stand up as instanced core samples.
// L2: one core is lifted out with its strata labelled. L3 keeps L2 and lights one stratum.
// All text is HTML (CSS2D labels, only for what is in focus); picking is analytic, not raycast.
import * as THREE from "./vendor/three.module.min.js";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "./vendor/CSS2DRenderer.js";
import { STRATA, STRATUM_INDEX, STATUS, fmtTok, fmtClock, fmtDur, fmtTick, spansDays, freshTokens, unloggedShrinks, agentStats } from "./panels.js";

const W = 220;            // world width of the whole session
const H = 32;             // world height of the tallest context
const ROOT_DEPTH = 7, SUB_DEPTH = 3.4, VALLEY = 9, LANE = 4.2, SIDE_Z = 5.5, STAGE_Z = 15;
const VIEW = (() => { const q = new URLSearchParams(location.search); return { az: Number(q.get("az") ?? -42), el: Number(q.get("el") ?? 26), fov: Number(q.get("fov") ?? 34), paz: Number(q.get("paz") ?? -66), pel: Number(q.get("pel") ?? 38) }; })();
const SP = 0.62, CORE_R = 0.24, H1 = 12, LIFT_R = 1.25, LIFT_H = 13;
const RINGS = 9;
const FOG = new THREE.Color("#0d121a");
const LIGHT = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();

const VERT = /* glsl */`
attribute vec4 aB0;
attribute vec4 aB1;
attribute float aAgent;
uniform highp sampler2D uAgents;
varying vec4 vB0;
varying vec4 vB1;
varying float vY;
varying vec3 vN;
varying vec3 vW;
varying float vDepth;
varying vec4 vSolid;
varying vec3 vAg;
varying float vInst;
void main() {
  vB0 = aB0; vB1 = aB1;
  vec4 p = vec4(position, 1.0);
  vec3 n = normal;
  vInst = -1.0;
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
  n = mat3(instanceMatrix) * n;
  vInst = float(gl_InstanceID);
#endif
  vY = position.y;
#ifdef AGENTS
  vSolid = texelFetch(uAgents, ivec2(int(aAgent + 0.5), 0), 0);
  vAg = texelFetch(uAgents, ivec2(int(aAgent + 0.5), 1), 0).xyz;
#else
  vSolid = vec4(0.0);
  vAg = vec3(1.0, 0.0, 0.0);
#endif
  vec4 wp = modelMatrix * p;
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * n);
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

// Atmospheric haze grows with depth into the scene (world -z), plus a little with distance
// beyond the focus, so the root stays crisp and the subagent field recedes into mist.
const HAZE = /* glsl */`
uniform float uFocusDist;
float haze(vec3 w, float depth) {
  float a = 0.5 * smoothstep(16.0, 140.0, -w.z);
  float b = 0.5 * smoothstep(uFocusDist + 40.0, uFocusDist + 420.0, depth);
  return clamp(max(a, b), 0.0, 0.8);
}`;
const FRAG = /* glsl */`
${HAZE}
uniform vec3 uCol[7];
uniform float uEm[7];
uniform vec3 uFog;
uniform float uFogDensity;
uniform vec3 uLight;
uniform float uSel;
uniform float uCursor;
uniform float uHover;
uniform float uAgentEm;
varying vec4 vB0;
varying vec4 vB1;
varying float vY;
varying vec3 vN;
varying vec3 vW;
varying float vDepth;
varying vec4 vSolid;
varying vec3 vAg;
varying float vInst;
uniform float uXray;
void main() {
  if (vAg.y > 0.5) discard;
#ifdef XRAY
  // Second pass for subagent ridges, drawn only where something nearer hides them (depthFunc
  // GreaterDepth): a translucent silhouette through the main ridge, so every agent stays visible.
  if (vAg.z > 0.5) discard;
#endif
  float tops[7];
  tops[0] = vB0.x; tops[1] = vB0.y; tops[2] = vB0.z; tops[3] = vB0.w;
  tops[4] = vB1.x; tops[5] = vB1.y; tops[6] = vB1.z;
  int k = 6;
  for (int j = 0; j < 7; j++) { if (vY <= tops[j]) { k = j; break; } }
  vec3 base = vB1.w > 0.5 ? vec3(0.62, 0.68, 0.76) : uCol[k];
  float em = vB1.w > 0.5 ? 1.0 : uEm[k];
  if (uSel >= 0.0 && abs(float(k) - uSel) > 0.5) em *= 0.2;
  float fw = max(fwidth(vY), 1e-5);
  float line = 0.0;
  for (int j = 0; j < 6; j++) {
    if (tops[j] > 0.0 && tops[j] < tops[6]) line = max(line, 1.0 - smoothstep(0.35, 1.15, abs(vY - tops[j]) / fw));
  }
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float diff = max(dot(N, uLight), 0.0);
  float hemi = 0.5 + 0.5 * N.y;
  vec3 V = normalize(cameraPosition - vW);
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float shade = (0.34 + 0.2 * hemi + 0.6 * diff) * mix(0.62, 1.0, smoothstep(0.0, 2.5, vW.y));
  vec3 col = base * shade + base * rim * 0.25;
  col *= 1.0 - 0.3 * line;
  // a bright crest line along the top edge of each front face
  if (N.z > 0.9 && tops[6] > 0.0) col = mix(col, vec3(1.0, 0.97, 0.92), 0.55 * (1.0 - smoothstep(0.6, 1.6, (tops[6] - vY) / fw)));
  float e = em * vAg.x * uAgentEm;
  // Injected text is a bright mineral vein: never thinner than ~2px on screen, total height unchanged.
  float ib = tops[2], it = tops[3];
  if (it > ib && vB1.w < 0.5) {
    float mid = 0.5 * (ib + it);
    float hw = max(0.5 * (it - ib), min(1.0 * fw, 0.06 * tops[6]));
    float v = 1.0 - smoothstep(hw - 0.5 * fw, hw + 0.5 * fw, abs(vY - mid));
    float ve = uEm[3] * vAg.x * uAgentEm * ((uSel >= 0.0 && abs(uSel - 3.0) > 0.5) ? 0.2 : 1.0);
    col = mix(col, uCol[3] * (0.95 + 0.35 * diff), v);
    e = mix(e, ve, v);
  }
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 dim = mix(uFog * 1.5, vec3(lum), 0.24);
  col = mix(dim, col, clamp(e, 0.0, 1.0));
  col = mix(col, vSolid.rgb * (0.42 + 0.5 * diff + 0.22 * hemi), vSolid.a);
  if (vInst >= 0.0) {
    if (abs(vInst - uCursor) < 0.5) col = col * 1.35 + vec3(0.05);
    else if (abs(vInst - uHover) < 0.5) col = col * 1.18;
  }
  col = mix(col, uFog, haze(vW, vDepth));
#ifdef XRAY
  // Faint fill, crisp crest outline: a hidden ridge reads as an outline behind the one in front.
  float edge = tops[6] > 0.0 ? 1.0 - smoothstep(0.5, 1.5, abs(tops[6] - vY) / fw) : 0.0;
  gl_FragColor = vec4(mix(col, vec3(0.9, 0.94, 1.0), edge * 0.65), max(uXray, edge * 0.92));
#else
  gl_FragColor = vec4(col, 1.0);
#endif
  #include <colorspace_fragment>
}`;

const BEAM_VERT = /* glsl */`
varying float vH;
varying vec3 vC;
void main() {
  vH = position.y;
  vC = vec3(1.0);
#ifdef USE_INSTANCING_COLOR
  vC = instanceColor;
#endif
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const BEAM_FRAG = /* glsl */`
uniform float uGain;
varying float vH;
varying vec3 vC;
void main() {
  float a = pow(1.0 - clamp(vH, 0.0, 1.0), 1.2) * uGain;
  gl_FragColor = vec4(vC * a, a);
  #include <colorspace_fragment>
}`;

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function createScene(host, { trace, layout: L, reducedMotion, onHover, onPick }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);
  renderer.domElement.className = "gl";
  const labels = new CSS2DRenderer();
  labels.domElement.className = "labels";
  host.append(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(VIEW.fov, 1, 0.5, 4000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 4;
  controls.maxDistance = 900;
  controls.screenSpacePanning = true;

  const yScale = H / (L.yMax * 1.02);
  const agents = trace.agents;
  const agentIndex = new Map(agents.map((a, i) => [a.id, i]));
  const rootInfo = L.info.get(L.root.id);

  // ---- per-agent state texture: row 0 = solid colour (rgb) + mix (a); row 1 = emphasis, hidden ----
  const AW = Math.max(1, agents.length);
  const agentData = new Float32Array(AW * 2 * 4);
  const agentTex = new THREE.DataTexture(agentData, AW, 2, THREE.RGBAFormat, THREE.FloatType);
  agentTex.minFilter = agentTex.magFilter = THREE.NearestFilter;
  for (let i = 0; i < AW; i++) {
    agentData[(AW + i) * 4] = 1;
    agentData[(AW + i) * 4 + 2] = agents[i].kind === "root" ? 1 : 0; // the x-ray pass skips the root
  }
  agentTex.needsUpdate = true;

  const shared = {
    uCol: { value: STRATA.map(s => new THREE.Color(s.color)) },
    uEm: { value: STRATA.map(() => 1) },
    uFog: { value: FOG.clone() },
    uFogDensity: { value: 0.0042 },
    uFocusDist: { value: 100 },
    uLight: { value: LIGHT.clone() },
    uAgents: { value: agentTex }
  };
  const strataMaterial = (defines = {}, own = {}) => new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, defines,
    uniforms: { ...shared, uSel: { value: -1 }, uCursor: { value: -1 }, uHover: { value: -1 }, uAgentEm: { value: 1 }, uXray: { value: 0.24 }, ...own },
    side: THREE.DoubleSide
  });

  // ---- row geometry ----
  const rows = []; // for picking: { z, depth, segs: [{ agent, inf, i0, i1, x0, x1, taper }] }
  const rowZ = new Map(); // agent id -> [{ seg, zFront, depth }]
  const laneZ = k => -(ROOT_DEPTH + VALLEY) - k * LANE;
  const profile = u => 1 - Math.pow(u, 2.3);

  function topsOf(r, scale) {
    const st = r.strata || {};
    let sum = 0;
    for (const s of STRATA) sum += st[s.key] || 0;
    const total = (r.tokens.context || 0) * scale;
    const out = new Float32Array(8);
    if (!sum) { out.fill(total); out[7] = 1; return out; } // split unknown
    let acc = 0;
    STRATA.forEach((s, j) => { acc += (st[s.key] || 0) / sum * total; out[j] = acc; });
    out[6] = total;
    return out;
  }

  function buildRidges() {
    const front = { pos: [], nor: [], b0: [], b1: [], ag: [], idx: [] };
    const slope = { pos: [], nor: [], b0: [], b1: [], ag: [], idx: [] };
    const addSeg = (agent, inf, seg, zF, depth, taper) => {
      const ai = agentIndex.get(agent.id);
      const cols = [];
      const zero = new Float32Array(8);
      cols.push({ x: inf.xs[seg.i0] * W - taper, t: zero });
      for (let i = seg.i0; i <= seg.i1; i++) cols.push({ x: inf.xs[i] * W, t: topsOf(agent.requests[i], yScale) });
      cols.push({ x: inf.xs[seg.i1] * W + taper, t: zero });
      // front face
      let v0 = front.pos.length / 3;
      for (const c of cols) {
        for (const y of [0, c.t[6]]) {
          front.pos.push(c.x, y, zF); front.nor.push(0, 0, 1);
          front.b0.push(c.t[0], c.t[1], c.t[2], c.t[3]); front.b1.push(c.t[4], c.t[5], c.t[6], c.t[7] || 0); front.ag.push(ai);
        }
      }
      for (let c = 0; c < cols.length - 1; c++) {
        const a = v0 + c * 2, b = a + 2;
        front.idx.push(a, b, b + 1, a, b + 1, a + 1);
      }
      // slope rings behind the face
      v0 = slope.pos.length / 3;
      for (const c of cols) {
        for (let r = 0; r <= RINGS; r++) {
          const u = r / RINGS;
          slope.pos.push(c.x, c.t[6] * profile(u), zF - u * depth); slope.nor.push(0, 1, 0);
          slope.b0.push(c.t[0], c.t[1], c.t[2], c.t[3]); slope.b1.push(c.t[4], c.t[5], c.t[6], c.t[7] || 0); slope.ag.push(ai);
        }
      }
      const R = RINGS + 1;
      for (let c = 0; c < cols.length - 1; c++) {
        for (let r = 0; r < RINGS; r++) {
          const a = v0 + c * R + r, b = a + R;
          slope.idx.push(a, b, b + 1, a, b + 1, a + 1);
        }
      }
    };
    const rootSegs = [];
    for (const seg of rootInfo.segments) { addSeg(L.root, rootInfo, seg, 0, ROOT_DEPTH, 0.18); rootSegs.push({ ...seg, inf: rootInfo, taper: 0.18 }); }
    rows.push({ z: 0, depth: ROOT_DEPTH, segs: rootSegs });
    rowZ.set(L.root.id, rootInfo.segments.map(s => ({ seg: s, zFront: 0, depth: ROOT_DEPTH })));
    const laneRows = [];
    for (let k = 0; k < L.lanes; k++) laneRows.push({ z: laneZ(k), depth: SUB_DEPTH, segs: [] });
    for (const [id, inf] of L.info) {
      if (inf.agent.kind !== "subagent") continue;
      const list = [];
      for (const seg of inf.segments) {
        const z = laneZ(seg.lane);
        addSeg(inf.agent, inf, seg, z, SUB_DEPTH, 0.3);
        laneRows[seg.lane].segs.push({ ...seg, inf, taper: 0.3 });
        list.push({ seg, zFront: z, depth: SUB_DEPTH });
      }
      rowZ.set(id, list);
    }
    for (const r of laneRows) r.segs.sort((a, b) => a.x0 - b.x0);
    rows.push(...laneRows);
    const mk = (d, computeNormals) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(d.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(d.nor, 3));
      g.setAttribute("aB0", new THREE.Float32BufferAttribute(d.b0, 4));
      g.setAttribute("aB1", new THREE.Float32BufferAttribute(d.b1, 4));
      g.setAttribute("aAgent", new THREE.Float32BufferAttribute(d.ag, 1));
      g.setIndex(d.pos.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(d.idx, 1) : new THREE.Uint16BufferAttribute(d.idx, 1));
      if (computeNormals) g.computeVertexNormals();
      return g;
    };
    const mat = strataMaterial({ AGENTS: "" });
    const fm = new THREE.Mesh(mk(front, false), mat);
    const sm = new THREE.Mesh(mk(slope, true), mat);
    fm.frustumCulled = sm.frustumCulled = false;
    return [fm, sm, mat];
  }
  const [frontMesh, slopeMesh, ridgeMat] = buildRidges();
  const world = new THREE.Group();
  world.add(frontMesh, slopeMesh);
  // Subagent ridges sit behind a main ridge that can be many times taller, which hides them from most
  // angles. Their front faces are drawn again where occluded, as translucent silhouettes.
  const xrayMat = strataMaterial({ AGENTS: "", XRAY: "" });
  Object.assign(xrayMat, { transparent: true, depthWrite: false, depthFunc: THREE.GreaterDepth, side: THREE.FrontSide });
  const xray = new THREE.Mesh(frontMesh.geometry, xrayMat);
  xray.frustumCulled = false;
  xray.renderOrder = 2;
  world.add(xray);
  scene.add(world);

  const heightAt = (agent, inf, seg, x, taper) => {
    const xs = inf.xs;
    const x0 = xs[seg.i0] * W, x1 = xs[seg.i1] * W;
    const ctx = i => (agent.requests[i].tokens.context || 0) * yScale;
    if (x < x0) return x0 - x > taper ? -1 : ctx(seg.i0) * (1 - (x0 - x) / taper);
    if (x > x1) return x - x1 > taper ? -1 : ctx(seg.i1) * (1 - (x - x1) / taper);
    let lo = seg.i0, hi = seg.i1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] * W <= x) lo = m; else hi = m; }
    const xa = xs[lo] * W, xb = xs[hi] * W;
    const f = xb > xa ? (x - xa) / (xb - xa) : 0;
    return ctx(lo) * (1 - f) + ctx(hi) * f;
  };
  const nearestReq = (inf, seg, x) => {
    let best = seg.i0, bd = Infinity;
    let lo = seg.i0, hi = seg.i1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (inf.xs[m] * W <= x) lo = m; else hi = m; }
    for (const i of [lo, hi]) { const d = Math.abs(inf.xs[i] * W - x); if (d < bd) { bd = d; best = i; } }
    return best;
  };
  const crest = (agent, i) => {
    const r = agent.requests[i];
    return (r?.tokens.context || 0) * yScale;
  };
  const zOf = (agent, i) => {
    const list = rowZ.get(agent.id);
    if (!list) return SIDE_Z;
    const hit = list.find(e => i >= e.seg.i0 && i <= e.seg.i1) || list[0];
    return hit.zFront;
  };
  const xOf = (agent, i) => (L.info.get(agent.id)?.xs[i] ?? 0) * W;

  // ---- ground, gaps, ticks, ruler ----
  const backZ = laneZ(Math.max(0, L.lanes - 1)) - 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W * 6, 1600).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uFog: shared.uFog, uFocusDist: shared.uFocusDist, uC: { value: new THREE.Vector3(W / 2, 0, backZ / 2) } },
    vertexShader: `varying vec3 vW; varying float vD; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mv=viewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `${HAZE} uniform vec3 uFog; uniform vec3 uC; varying vec3 vW; varying float vD;
      void main(){ vec2 d = (vW.xz - uC.xz) / vec2(${(W * 0.62).toFixed(1)}, ${Math.max(60, -backZ * 0.8).toFixed(1)});
        float pool = exp(-dot(d,d)*1.6);
        vec3 c = mix(vec3(0.010,0.013,0.019), vec3(0.030,0.040,0.058), pool);
        gl_FragColor = vec4(mix(c, uFog, haze(vW, vD)), 1.0);
        #include <colorspace_fragment>
      }`
  }));
  ground.position.y = -0.02;
  scene.add(ground);

  const gapMat = new THREE.MeshBasicMaterial({ color: "#2a3444" });
  for (const g of L.gaps) {
    const w = Math.max(0.25, (g.x1 - g.x0) * W * 0.5);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, SIDE_Z + 2.5).rotateX(-Math.PI / 2), gapMat);
    plane.position.set((g.x0 + g.x1) / 2 * W, 0.01, (SIDE_Z + 2.5) / 2 + 0.3);
    world.add(plane);
  }

  // ---- landmarks: flags (asks), beacons (actions), instruction-like markers, cairns (side calls) ----
  const flagPole = new THREE.BoxGeometry(0.07, 1, 0.07).translate(0, 0.5, 0);
  const pennant = new THREE.BufferGeometry();
  pennant.setAttribute("position", new THREE.Float32BufferAttribute([0, 1, 0, 0, 0.62, 0, 0.95, 0.81, 0], 3));
  const youColor = new THREE.Color(STRATA[STRATUM_INDEX.you].color);
  const flagMats = [new THREE.MeshBasicMaterial({ color: youColor, fog: false }), new THREE.MeshBasicMaterial({ color: youColor, side: THREE.DoubleSide, fog: false })];
  function flagMeshes(items) { // items: [{x,y,z,s}]
    const n = Math.max(1, items.length);
    const pole = new THREE.InstancedMesh(flagPole, flagMats[0], n), pen = new THREE.InstancedMesh(pennant, flagMats[1], n);
    const m = new THREE.Matrix4();
    items.forEach((f, i) => {
      m.makeScale(f.s, f.h, f.s).setPosition(f.x, f.y, f.z); pole.setMatrixAt(i, m);
      m.makeScale(f.h * 0.5, f.h * 0.5, 1).setPosition(f.x, f.y + f.h * 0.5, f.z); pen.setMatrixAt(i, m);
    });
    pole.count = pen.count = items.length;
    pole.frustumCulled = pen.frustumCulled = false;
    const g = new THREE.Group(); g.add(pole, pen);
    return g;
  }
  const rootAsks = L.root.asks.map(a => {
    const i = Math.min(Math.max(0, a.request), L.root.requests.length - 1);
    return { x: xOf(L.root, i), y: crest(L.root, i), z: -0.6, h: 2.6, s: 1 };
  });
  const flags = flagMeshes(rootAsks);
  world.add(flags);

  const beamGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 12, 1, true).translate(0, 0.5, 0);
  const beamMat = new THREE.ShaderMaterial({ vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, uniforms: { uGain: { value: 1 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const capGeo = new THREE.OctahedronGeometry(0.5);
  const capMat = new THREE.MeshBasicMaterial({ fog: false });
  const allActs = [];
  for (const a of agents) {
    if (a.kind === "side" || a.kind === "guardian") continue;
    a.requests.forEach((r, i) => { if (r.action && STATUS[r.action.class]) allActs.push({ a, i, cls: r.action.class }); });
  }
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, Math.max(1, allActs.length));
  const caps = new THREE.InstancedMesh(capGeo, capMat, Math.max(1, allActs.length));
  beams.frustumCulled = caps.frustumCulled = false;
  const beamPick = []; // [{a, i, x, y0, y1, z}]
  function layoutBeams(lens) {
    const m = new THREE.Matrix4(), c = new THREE.Color();
    let n = 0;
    beamPick.length = 0;
    for (const act of allActs) {
      const show = act.cls === "outward" || (lens === "egress" && act.cls === "write");
      if (!show) continue;
      const tall = act.cls === "outward" ? (lens === "egress" ? 16 : 11) : 4;
      const x = xOf(act.a, act.i), y = crest(act.a, act.i), z = zOf(act.a, act.i) - (act.a.kind === "root" ? 0.8 : 0.4);
      m.makeScale(act.cls === "outward" ? 1.25 : 0.6, tall, act.cls === "outward" ? 1.25 : 0.6).setPosition(x, y, z);
      beams.setMatrixAt(n, m);
      c.set(STATUS[act.cls].color);
      beams.setColorAt(n, c);
      const s = act.cls === "outward" ? 1.05 : 0.6;
      m.makeScale(s, s, s).setPosition(x, y + 0.25, z);
      caps.setMatrixAt(n, m);
      caps.setColorAt(n, c);
      beamPick.push({ a: act.a, i: act.i, x, y0: y, y1: y + tall * 0.6, z });
      n++;
    }
    beams.count = caps.count = n;
    beams.instanceMatrix.needsUpdate = caps.instanceMatrix.needsUpdate = true;
    if (beams.instanceColor) beams.instanceColor.needsUpdate = true;
    if (caps.instanceColor) caps.instanceColor.needsUpdate = true;
  }
  world.add(beams, caps);

  // instruction-like inflow markers (lens 3)
  const flagged = [];
  for (const a of agents) {
    if (!rowZ.has(a.id)) continue;
    for (const b of a.blocks) {
      if (b.kind !== "outside" || !b.flags || !b.flags.includes("instruction-like")) continue;
      const i = a.requests.findIndex(r => r.window && r.window[1] >= b.i);
      if (i >= 0) flagged.push({ a, i, b });
    }
  }
  const warnMesh = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.55), new THREE.MeshBasicMaterial({ color: STATUS.flag.color, fog: false }), Math.max(1, flagged.length));
  {
    const m = new THREE.Matrix4();
    flagged.forEach((f, n) => { m.makeScale(1, 1.6, 1).setPosition(xOf(f.a, f.i), crest(f.a, f.i) + 1.6, zOf(f.a, f.i) - 0.4); warnMesh.setMatrixAt(n, m); });
    warnMesh.count = flagged.length;
    warnMesh.frustumCulled = false;
    warnMesh.visible = false;
    world.add(warnMesh);
  }

  // side calls and guardian reviews: small cores standing in front of the main ridge
  const sideAgents = agents.filter(a => a.kind === "side" || a.kind === "guardian");
  const sideReqs = [];
  for (const a of sideAgents) a.requests.forEach((r, i) => sideReqs.push({ a, i, x: L.X(r.t) * W }));
  const coreGeo = new THREE.CylinderGeometry(1, 1, 1, 18, 1).translate(0, 0.5, 0);
  // Side calls (advisor iterations, guardian reviews) are small outcrops beside the main ridge, not
  // spikes in it; their exact context is in the tooltip and panel, so they are not drawn to height scale.
  const outcropGeo = new THREE.CylinderGeometry(0.72, 1, 1, 6, 1).translate(0, 0.5, 0);
  const cairns = new THREE.InstancedMesh(outcropGeo, strataMaterial(), Math.max(1, sideReqs.length));
  {
    const b0 = new Float32Array(Math.max(1, sideReqs.length) * 4), b1 = new Float32Array(Math.max(1, sideReqs.length) * 4);
    const m = new THREE.Matrix4();
    sideReqs.forEach((s, n) => {
      const r = s.a.requests[s.i];
      const t = topsOf(r, 1 / Math.max(1, r.tokens.context || 1));
      b0.set([t[0], t[1], t[2], t[3]], n * 4); b1.set([t[4], t[5], 1, t[7]], n * 4);
      m.makeScale(0.55, 0.6 + 1.8 * Math.sqrt((r.tokens.context || 0) / L.yMax), 0.55).setPosition(s.x, 0, SIDE_Z);
      cairns.setMatrixAt(n, m);
    });
    cairns.geometry = outcropGeo.clone();
    cairns.geometry.setAttribute("aB0", new THREE.InstancedBufferAttribute(b0, 4));
    cairns.geometry.setAttribute("aB1", new THREE.InstancedBufferAttribute(b1, 4));
    cairns.count = sideReqs.length;
    cairns.frustumCulled = false;
    world.add(cairns);
  }

  // spawn and return links: flat luminous ribbons arcing over the valley
  function ribbons(list, widthOf, colorOf) {
    const pos = [], col = [], idx = [], ag = [];
    const c = new THREE.Color();
    const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), pc = new THREE.Vector3(), q = new THREE.Vector3(), q2 = new THREE.Vector3();
    for (const l of list) {
      if (l.child.kind !== "subagent") continue;
      const ci = l.type === "spawn" ? l.seg.i0 : l.seg.i1;
      p0.set(xOf(l.parent, l.parentReq), crest(l.parent, l.parentReq), zOf(l.parent, l.parentReq) - (l.parent.kind === "root" ? 1.2 : 0.4));
      p1.set(xOf(l.child, ci), crest(l.child, ci), laneZ(Math.max(0, l.seg.lane)) - 0.3);
      pc.set((p0.x + p1.x) / 2, Math.max(p0.y, p1.y) + 0.6, (p0.z + p1.z) / 2);
      const w = widthOf(l);
      c.set(colorOf(l));
      const N = 20, v0 = pos.length / 3;
      for (let k = 0; k <= N; k++) {
        const t = k / N, u = 1 - t;
        q.set(u * u * p0.x + 2 * u * t * pc.x + t * t * p1.x, u * u * p0.y + 2 * u * t * pc.y + t * t * p1.y, u * u * p0.z + 2 * u * t * pc.z + t * t * p1.z);
        q2.set(2 * u * (pc.x - p0.x) + 2 * t * (p1.x - pc.x), 0, 2 * u * (pc.z - p0.z) + 2 * t * (p1.z - pc.z));
        const len = Math.hypot(q2.x, q2.z) || 1;
        const ox = -q2.z / len * w / 2, oz = q2.x / len * w / 2;
        pos.push(q.x + ox, q.y, q.z + oz, q.x - ox, q.y, q.z - oz);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        const ai = agentIndex.get(l.child.id);
        ag.push(ai, ai);
        if (k < N) { const a = v0 + k * 2; idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute("aAgent", new THREE.Float32BufferAttribute(ag, 1));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.3 }, uHover: linkHover },
      vertexShader: `attribute vec3 color; attribute float aAgent; uniform float uHover; varying vec3 vC; varying float vOn;
        void main(){ vC = color; vOn = abs(aAgent - uHover) < 0.5 ? 1.0 : 0.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uOpacity; varying vec3 vC; varying float vOn;
        void main(){
          gl_FragColor = vec4(vC * (1.0 + 0.3 * vOn), mix(uOpacity, 1.0, vOn));
          #include <colorspace_fragment>
        }`,
      side: THREE.DoubleSide, transparent: true, depthWrite: false
    }));
    mesh.material.opacity = 0.3;
    mesh.frustumCulled = false;
    return mesh;
  }
  const linkHover = { value: -1 };
  const maxReport = Math.max(1, ...L.links.map(l => l.size || 0));
  const spawnLinks = ribbons(L.links.filter(l => l.type === "spawn"), () => 0.1, () => "#aab8cc");
  const returnLinks = ribbons(L.links.filter(l => l.type === "return"), l => 0.1 + 0.5 * Math.sqrt((l.size || 0) / maxReport), () => STRATA[STRATUM_INDEX.agents].color);
  world.add(spawnLinks, returnLinks);

  // compaction and shrink markers (root ridge front)
  const markLines = [];
  for (const c of L.root.compactions) markLines.push({ x: L.X(c.t) * W, y0: c.post * yScale, y1: c.pre * yScale, dashed: true, text: `compacted ${fmtTok(c.pre)} → ${fmtTok(c.post)}` });
  for (const s of unloggedShrinks(L.root)) markLines.push({ x: rootInfo.xs[s.request] * W, y0: s.to * yScale, y1: s.from * yScale, dashed: false, text: "context shrank; not logged as a compaction" });
  {
    const pts = [];
    for (const m of markLines) pts.push(m.x, m.y0, 0.08, m.x, m.y1 + 1.6, 0.08);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: "#eef1f5", dashSize: 0.5, gapSize: 0.35, fog: false }));
    lines.computeLineDistances();
    world.add(lines);
  }

  // ruler and hour ticks
  const ruler = new THREE.Group();
  {
    const pts = [-3, 0, 0, -3, H, 0];
    const ticks = rulerTicks(L.yMax);
    for (const v of ticks) pts.push(-3.6, v * yScale, 0, -3, v * yScale, 0);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    ruler.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: "#8d97a6", fog: false })));
    if (trace.contextWindow && trace.contextWindow <= L.yMax * 1.2) {
      const y = trace.contextWindow * yScale;
      const cg = new THREE.BufferGeometry();
      cg.setAttribute("position", new THREE.Float32BufferAttribute([-3, y, 0.05, W + 2, y, 0.05], 3));
      const cl = new THREE.Line(cg, new THREE.LineDashedMaterial({ color: "#6f7a8a", dashSize: 1.2, gapSize: 0.9, fog: false }));
      cl.computeLineDistances();
      ruler.add(cl);
    }
  }
  world.add(ruler);

  // ---- labels (pooled per level; only what is in focus) ----
  const labelGroups = { l0: new THREE.Group(), l1: new THREE.Group(), l2: new THREE.Group() };
  Object.values(labelGroups).forEach(g => scene.add(g));
  const PRIO = { corehead: 9, stratum: 8, cursor: 8, cliff: 7, row: 5, gap: 4, tick: 2 };
  function label(text, cls, pos, center = [0.5, 0.5], group = labelGroups.l0, onClick) {
    const div = document.createElement(onClick ? "button" : "div");
    div.className = `lbl ${cls || ""}`;
    div.textContent = text;
    if (onClick) { div.type = "button"; div.addEventListener("click", e => { e.stopPropagation(); onClick(); }); div.addEventListener("pointerdown", e => e.stopPropagation()); }
    const o = new CSS2DObject(div);
    o.center.set(center[0], center[1]);
    o.position.copy(pos);
    o.userData.prio = PRIO[(cls || "").split(" ")[0]] ?? 3;
    if ((cls || "").includes("time")) o.userData.prio = 1;
    group.add(o);
    return o;
  }
  // Hide lower-priority labels that would overlap others or sit under the HUD and panel.
  const _v = new THREE.Vector3();
  function declutter() {
    const w = host.clientWidth, h = host.clientHeight;
    const items = [];
    for (const g of Object.values(labelGroups)) {
      if (!g.visible) continue;
      for (const o of g.children) {
        const e = o.element;
        if (!e._w || e.style.display === "none") continue;
        _v.setFromMatrixPosition(o.matrixWorld).project(camera);
        const x = (_v.x + 1) / 2 * w - o.center.x * e._w, y = (1 - _v.y) / 2 * h - o.center.y * e._h;
        items.push({ e, x, y, w: e._w, h: e._h, p: o.userData.prio || 0 });
      }
    }
    items.sort((a, b) => b.p - a.p);
    // In a tall, narrow viewport the landscape keeps only its cliff and row labels.
    const sparse = level === 0 && w < h;
    const placed = [];
    for (const it of items) {
      const off = it.x < 2 || it.x + it.w > w - insets.right + 4 || it.y < insets.top - 8 || it.y + it.h > h - 2;
      const hit = placed.some(q => it.x < q.x + q.w + 6 && q.x < it.x + it.w + 6 && it.y < q.y + q.h + 3 && q.y < it.y + it.h + 3);
      const hide = off || hit || (sparse && it.p < 5);
      if ((it.e.style.visibility === "hidden") !== hide) it.e.style.visibility = hide ? "hidden" : "";
      if (!hide) placed.push(it);
    }
  }
  const measure = () => {
    for (const g of Object.values(labelGroups)) g.traverse(o => {
      if (o.isCSS2DObject && o.element._w === undefined && o.element.isConnected && o.element.offsetWidth) {
        o.element._w = o.element.offsetWidth; o.element._h = o.element.offsetHeight;
      }
    });
  };
  function buildL0Labels() {
    const g = labelGroups.l0;
    for (const m of markLines) label(m.text, m.dashed ? "cliff" : "cliff soft", new THREE.Vector3(m.x, m.y1 + 1.8, 0.1), [0, 1], g);
    for (const gap of L.gaps) {
      const xm = (gap.x0 + gap.x1) / 2;
      // Gaps at either end of the axis (an idle head or tail) align inward so they stay on screen.
      label(`≈ ${fmtDur(gap.b - gap.a)} idle`, "gap", new THREE.Vector3(xm * W, 0, SIDE_Z + 3.2), [xm > 0.9 ? 1 : xm < 0.1 ? 0 : 0.5, 0], g);
    }
    for (const v of rulerTicks(L.yMax)) label(fmtTok(v), "tick", new THREE.Vector3(-4, v * yScale, 0), [1, 0.5], g);
    label("context tokens", "tick cap", new THREE.Vector3(-3, H + 1.2, 0), [0.5, 1], g);
    if (trace.contextWindow && trace.contextWindow <= L.yMax * 1.2) label(`context window ${fmtTok(trace.contextWindow)}`, "tick", new THREE.Vector3(W + 2.5, trace.contextWindow * yScale, 0), [0, 0.5], g);
    const long = spansDays(trace);
    let last = -1e9;
    for (const t of L.hours) {
      const x = L.X(t) * W;
      if (x - last < W / (long ? 8 : 11) || L.gaps.some(g => Math.abs((g.x0 + g.x1) / 2 * W - x) < W / 28)) continue;
      last = x;
      label(fmtTick(t, long), "tick time", new THREE.Vector3(x, 0, SIDE_Z + 7.5), [0.5, 0], g);
    }
    const r0 = rootInfo.segments[0];
    if (r0) label(L.root.kind === "root" ? "main thread" : L.root.name, "row", new THREE.Vector3(rootInfo.xs[r0.i0] * W, crest(L.root, r0.i0) + 4, -1), [0.5, 1], g);
    const nSub = agents.filter(a => a.kind === "subagent").length;
    // One quiet label behind the subagent field. A shallow field sits right behind the main ridge,
    // so its label is raised above the ridge's crest to stay clear of the ridge face.
    if (L.lanes) {
      let rise = 0;
      if (L.lanes < 4) rootInfo.xs.forEach((x, i) => { if (x > 0.35 && x < 0.65) rise = Math.max(rise, crest(L.root, i) * 1.05 + 1.5); });
      label(`subagents (${nSub})`, "row quiet", new THREE.Vector3(W * 0.5, rise, laneZ(L.lanes - 1) - SUB_DEPTH - 2), [0.5, 1], g);
    }
  }
  buildL0Labels();

  // ---- L1: core samples of the focused agent ----
  const cap = Math.max(1, ...agents.map(a => a.requests.length));
  const coreMat = strataMaterial();
  const cores = new THREE.InstancedMesh(coreGeo.clone(), coreMat, cap);
  cores.geometry.setAttribute("aB0", new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
  cores.geometry.setAttribute("aB1", new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4));
  cores.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  cores.frustumCulled = false;
  cores.count = 0;
  scene.add(cores);
  const stage = { agent: null, n: 0, from: null, to: null, heights: null, t0: 0, dur: 0, lifted: -1, scale: 1, flags: null, beams: null };
  const stageX = i => W / 2 + (i - (stage.n - 1) / 2) * SP;

  function buildStage(agent, originIdx) {
    const n = agent.requests.length;
    stage.agent = agent; stage.n = n;
    const peak = Math.max(1, ...agent.requests.map(r => r.tokens.context || 0));
    stage.scale = H1 / peak;
    const b0 = cores.geometry.getAttribute("aB0"), b1 = cores.geometry.getAttribute("aB1");
    stage.from = new Float32Array(n * 4); stage.to = new Float32Array(n * 4);
    const inf = L.info.get(agent.id);
    const isRow = rowZ.has(agent.id);
    for (let i = 0; i < n; i++) {
      const r = agent.requests[i];
      const t = topsOf(r, 1 / Math.max(1, r.tokens.context || 1));
      b0.array.set([t[0], t[1], t[2], t[3]], i * 4);
      b1.array.set([t[4], t[5], 1, t[7]], i * 4);
      stage.from.set([inf ? inf.xs[i] * W : stageX(i), isRow ? zOf(agent, i) - 0.5 : SIDE_Z, Math.max(0.05, crest(agent, i)), 0.08], i * 4);
      stage.to.set([stageX(i), STAGE_Z, Math.max(0.05, (r.tokens.context || 0) * stage.scale), CORE_R], i * 4);
    }
    b0.needsUpdate = b1.needsUpdate = true;
    cores.count = n;
    stage.t0 = performance.now();
    stage.dur = reducedMotion ? 0 : 1100;
    stage.origin = originIdx ?? 0;
    stage.lifted = -1;
    // stage landmarks: asks as flags, actions as short beacons
    if (stage.flags) { cores.parent.remove(stage.flags); stage.flags = null; }
    stage.flags = flagMeshes(agent.asks.map(a => {
      const i = Math.min(Math.max(0, a.request), n - 1);
      return { x: stageX(i), y: (agent.requests[i]?.tokens.context || 0) * stage.scale + 0.3, z: STAGE_Z, h: 1.5, s: 0.7 };
    }));
    scene.add(stage.flags);
    placeCores(reducedMotion ? 1 : 0);
  }
  function placeCores(p) {
    const m = new THREE.Matrix4();
    const n = stage.n;
    for (let i = 0; i < n; i++) {
      // ripple outward from the clicked request
      const delay = Math.min(0.55, Math.abs(i - stage.origin) / 180);
      const k = ease(Math.min(1, Math.max(0, (p - delay) / (1 - delay))));
      const f = stage.from, t = stage.to, o = i * 4;
      const x = f[o] + (t[o] - f[o]) * k, z = f[o + 1] + (t[o + 1] - f[o + 1]) * k;
      const h = f[o + 2] + (t[o + 2] - f[o + 2]) * k, r = f[o + 3] + (t[o + 3] - f[o + 3]) * k;
      const hidden = i === stage.lifted;
      m.makeScale(hidden ? 0.0001 : r, hidden ? 0.0001 : h, hidden ? 0.0001 : r).setPosition(x, 0, z);
      cores.setMatrixAt(i, m);
    }
    cores.instanceMatrix.needsUpdate = true;
    if (stage.flags) stage.flags.visible = p >= 1 && level >= 1 && stage.agent != null;
  }

  // ---- L2: the lifted core ----
  const liftGeo = new THREE.CylinderGeometry(1, 1, 1, 56, 1).translate(0, 0.5, 0);
  const liftVerts = liftGeo.getAttribute("position").count;
  liftGeo.setAttribute("aB0", new THREE.Float32BufferAttribute(new Float32Array(liftVerts * 4), 4));
  liftGeo.setAttribute("aB1", new THREE.Float32BufferAttribute(new Float32Array(liftVerts * 4), 4));
  const liftMat = strataMaterial();
  const lifted = new THREE.Mesh(liftGeo, liftMat);
  lifted.visible = false;
  scene.add(lifted);
  const leaderGeo = new THREE.BufferGeometry();
  const leaders = new THREE.LineSegments(leaderGeo, new THREE.LineBasicMaterial({ color: "#c9d1dc", fog: false }));
  scene.add(leaders);
  const lift = { from: new THREE.Vector3(), to: new THREE.Vector3(), t0: 0, dur: 0, fromH: 1, fromR: 0.2, bounds: null };

  function setLifted(i) {
    const agent = stage.agent;
    if (!agent || i == null || i < 0) { lifted.visible = false; leaders.visible = false; stage.lifted = -1; placeCores(1); clearGroup(labelGroups.l2); return; }
    const r = agent.requests[i];
    const t = topsOf(r, 1 / Math.max(1, r.tokens.context || 1));
    lift.bounds = t;
    const b0 = liftGeo.getAttribute("aB0"), b1 = liftGeo.getAttribute("aB1");
    for (let v = 0; v < liftVerts; v++) { b0.array.set([t[0], t[1], t[2], t[3]], v * 4); b1.array.set([t[4], t[5], 1, t[7]], v * 4); }
    b0.needsUpdate = b1.needsUpdate = true;
    const x = stageX(i);
    lift.from.set(x, 0, STAGE_Z);
    lift.fromH = Math.max(0.05, (r.tokens.context || 0) * stage.scale); lift.fromR = CORE_R;
    lift.to.set(x, 1.4, STAGE_Z + 7);
    lift.t0 = performance.now(); lift.dur = reducedMotion ? 0 : 650;
    stage.lifted = i;
    placeCores(1);
    lifted.visible = true;
    stepLift(reducedMotion ? 1 : 0);
    // labels + leaders
    clearGroup(labelGroups.l2);
    const items = [];
    let prev = 0;
    STRATA.forEach((s, j) => {
      const v = r.strata?.[s.key] || 0;
      const lo = prev, hi = t[j];
      prev = hi;
      if (v <= 0) return;
      items.push({ j, s, v, mid: lift.to.y + (lo + hi) / 2 * LIFT_H });
    });
    // push labels apart so none overlap (1.25 world units ≈ one label height at L2 framing)
    const gapY = 1.3;
    for (let k = 1; k < items.length; k++) items[k].y = Math.max(items[k].mid, (items[k - 1].y ?? items[k - 1].mid) + gapY);
    if (items.length) items[0].y = items[0].y ?? items[0].mid;
    const over = items.length ? items.at(-1).y - (lift.to.y + LIFT_H) : 0;
    if (over > 0) items.forEach(it => { it.y -= over; });
    const pts = [];
    const lx = lift.to.x + LIFT_R + 2.2;
    for (const it of items) {
      pts.push(lift.to.x + LIFT_R + 0.05, it.mid, lift.to.z, lx - 0.15, it.y, lift.to.z);
      const o = label(`${it.s.name}  ≈ ${fmtTok(it.v)}  ${Math.round(it.v / (r.tokens.context || 1) * 100)}%`, `stratum s-${it.s.key}${selStratum === it.s.key ? " on" : ""}`,
        new THREE.Vector3(lx, it.y, lift.to.z), [0, 0.5], labelGroups.l2, () => onPick({ level: 3, agentId: agent.id, reqIdx: i, stratum: it.s.key }));
      o.element.style.setProperty("--c", it.s.color);
    }
    label(`request ${i + 1} · ${fmtTok(r.tokens.context)} tokens`, "corehead", new THREE.Vector3(lift.to.x - LIFT_R, lift.to.y + LIFT_H + 0.8, lift.to.z), [0, 1], labelGroups.l2);
    leaderGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    leaders.visible = true;
  }
  function stepLift(p) {
    const k = ease(Math.min(1, p));
    lifted.position.lerpVectors(lift.from, lift.to, k);
    const h = lift.fromH + (LIFT_H - lift.fromH) * k, r = lift.fromR + (LIFT_R - lift.fromR) * k;
    lifted.scale.set(r, h, r);
    labelGroups.l2.visible = k >= 1;
    leaders.visible = k >= 1;
  }
  function clearGroup(g) { for (const o of [...g.children]) { g.remove(o); o.element?.remove(); } }

  // ---- lenses ----
  let lens = "context";
  let selStratum = null;
  const spendRamp = [new THREE.Color("#23456f"), new THREE.Color("#5f9be6"), new THREE.Color("#d6ecff")];
  function setLens(next) {
    lens = next;
    const em = shared.uEm.value;
    for (let j = 0; j < 7; j++) em[j] = next === "context" ? 1 : next === "egress" ? 0.3 : next === "inflow" ? (STRATA[j].key === "outside" ? 1 : 0.25) : 1;
    // per-agent solid colour for the spend lens
    const fresh = agents.map(a => agentStats(a).fresh);
    const maxLog = Math.log10(Math.max(10, ...fresh.filter((_, i) => agents[i].kind === "subagent")));
    const c = new THREE.Color();
    agents.forEach((a, i) => {
      const o = i * 4;
      if (next === "agents" && a.kind === "subagent") {
        const f = Math.max(0, Math.log10(Math.max(1, fresh[i])) - 3) / Math.max(0.5, maxLog - 3);
        const t = Math.min(1, f);
        if (t < 0.5) c.copy(spendRamp[0]).lerp(spendRamp[1], t * 2); else c.copy(spendRamp[1]).lerp(spendRamp[2], (t - 0.5) * 2);
        agentData[o] = c.r; agentData[o + 1] = c.g; agentData[o + 2] = c.b; agentData[o + 3] = 1;
      } else agentData[o + 3] = 0;
      agentData[(AW + i) * 4] = next === "agents" && a.kind === "root" ? 0.35 : baseEm(a);
    });
    agentTex.needsUpdate = true;
    layoutBeams(next);
    beamMat.uniforms.uGain.value = next === "egress" ? 1.2 : 0.95;
    flags.visible = next === "context" || next === "egress";
    warnMesh.visible = next === "inflow";
    // Arcs stay faint until their agent is hovered, except in the subagents lens.
    spawnLinks.material.uniforms.uOpacity.value = next === "agents" ? 0.85 : 0.1;
    returnLinks.material.uniforms.uOpacity.value = next === "agents" ? 0.95 : 0.14;
    dirty = 3;
  }
  let focusAgentId = null;
  const baseEm = a => (focusAgentId && a.id !== focusAgentId ? 0.28 : 1);
  function applyFocusEmphasis(level) {
    agents.forEach((a, i) => {
      agentData[(AW + i) * 4] = level === 0 ? (lens === "agents" && a.kind === "root" ? 0.35 : 1) : 0.1;
      agentData[(AW + i) * 4 + 1] = level > 0 && a.id === focusAgentId ? 1 : 0;
    });
    agentTex.needsUpdate = true;
    cairns.visible = level === 0;
    spawnLinks.visible = returnLinks.visible = level === 0;
    beams.visible = caps.visible = level === 0;
    flags.visible = level === 0 && (lens === "context" || lens === "egress");
    warnMesh.visible = level === 0 && lens === "inflow";
    labelGroups.l0.visible = level === 0;
    ruler.visible = level === 0;
    xray.visible = level === 0;
  }

  // ---- camera ----
  let insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const fly = { on: false };
  function flyTo(pos, tgt, dur = 950) {
    if (reducedMotion || dur === 0) {
      camera.position.copy(pos); controls.target.copy(tgt); fly.on = false; controls.update(); dirty = 3; return;
    }
    Object.assign(fly, { on: true, t0: performance.now(), dur, p0: camera.position.clone(), p1: pos.clone(), q0: controls.target.clone(), q1: tgt.clone() });
  }
  const safeNdc = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    return { x0: -1 + 2 * insets.left / w, x1: 1 - 2 * insets.right / w, y0: -1 + 2 * insets.bottom / h, y1: 1 - 2 * insets.top / h };
  };
  // Fit a box into the safe part of the viewport from a given view direction.
  function fit(box, dir, center, extra = []) {
    const cam = camera.clone();
    const tgt = center.clone();
    const pts = [...extra];
    if (box) for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
    const safe = safeNdc();
    const place = d => { cam.position.copy(tgt).addScaledVector(dir, d); cam.lookAt(tgt); cam.updateMatrixWorld(); cam.updateProjectionMatrix(); };
    const bounds = () => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) { const v = p.clone().project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return { x0, x1, y0, y1 };
    };
    let d = 50;
    for (let pass = 0; pass < 3; pass++) {
      let lo = 1, hi = 3000;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2; place(mid);
        const b = bounds();
        const fits = b.x1 - b.x0 <= safe.x1 - safe.x0 && b.y1 - b.y0 <= safe.y1 - safe.y0;
        if (fits) hi = mid; else lo = mid;
      }
      d = hi; place(d);
      const b = bounds();
      // pan so the projected box is centred in the safe rect
      const ox = ((safe.x0 + safe.x1) - (b.x0 + b.x1)) / 2, oy = ((safe.y0 + safe.y1) - (b.y0 + b.y1)) / 2;
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * d, halfW = halfH * cam.aspect;
      tgt.addScaledVector(right, -ox * halfW).addScaledVector(up, -oy * halfH);
    }
    return { pos: tgt.clone().addScaledVector(dir, d), tgt };
  }
  const dirFrom = (azDeg, elDeg) => {
    const az = THREE.MathUtils.degToRad(azDeg), el = THREE.MathUtils.degToRad(elDeg);
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  };
  function frameL0(dur) {
    // The tall main ridge in front, the low subagent field behind it.
    const back = laneZ(Math.max(0, Math.min(L.lanes - 1, 5))) - SUB_DEPTH;
    const pts = [];
    const hi = H * 0.8, lo = Math.min(H * 0.35, 8);
    for (const x of [-6, W + 3]) {
      pts.push(new THREE.Vector3(x, 0, SIDE_Z + 8), new THREE.Vector3(x, hi, 0), new THREE.Vector3(x, 0, back), new THREE.Vector3(x, lo, back));
    }
    const portrait = host.clientWidth < host.clientHeight;
    const f = fit(null, dirFrom(portrait ? VIEW.paz : VIEW.az, portrait ? VIEW.pel : VIEW.el), new THREE.Vector3(W / 2, 4, back / 2), pts);
    flyTo(f.pos, f.tgt, dur);
  }
  function frameL1(i, dur) {
    const x = stageX(i);
    const h = (stage.agent.requests[i]?.tokens.context || 0) * stage.scale;
    const span = host.clientWidth < 700 ? 16 : 34;
    const box = new THREE.Box3(new THREE.Vector3(x - span / 2, 0, STAGE_Z - 1), new THREE.Vector3(x + span / 2, Math.max(H1, h) + 1, STAGE_Z + 1));
    const f = fit(box, dirFrom(-6, 16), new THREE.Vector3(x, H1 / 2, STAGE_Z));
    flyTo(f.pos, f.tgt, dur);
  }
  function frameL2(dur) {
    const c = lift.to;
    const box = new THREE.Box3(new THREE.Vector3(c.x - LIFT_R - 0.5, c.y - 0.5, c.z - 1), new THREE.Vector3(c.x + LIFT_R + 13, c.y + LIFT_H + 1.5, c.z + 1));
    const f = fit(box, dirFrom(-4, 7), box.getCenter(new THREE.Vector3()));
    flyTo(f.pos, f.tgt, dur);
  }

  // ---- state ----
  let level = 0, cursor = -1;
  function show(S) {
    const agent = S.agentId ? agents[agentIndex.get(S.agentId)] : null;
    const prevLevel = level;
    level = S.level;
    selStratum = S.level >= 3 ? S.stratum : null;
    if (S.lens !== lens) setLens(S.lens);
    if (level === 0) {
      focusAgentId = null;
      applyFocusEmphasis(0);
      setLifted(null);
      cores.count = 0;
      // The L1 stage and its ask flags leave the scene entirely at L0.
      if (stage.flags) { scene.remove(stage.flags); stage.flags = null; }
      stage.agent = null;
      clearGroup(labelGroups.l1);
      rulerL1.visible = false;
      if (prevLevel !== 0 || S.refit) frameL0();
      dirty = 3;
      return;
    }
    focusAgentId = agent.id;
    applyFocusEmphasis(level);
    const idx = Math.max(0, Math.min(agent.requests.length - 1, S.reqIdx ?? 0));
    const newAgent = stage.agent !== agent;
    if (newAgent) buildStage(agent, idx);
    cursor = idx;
    coreMat.uniforms.uCursor.value = idx;
    updateL1Labels();
    if (level === 1) {
      setLifted(null);
      frameL1(idx, newAgent ? 1300 : prevLevel >= 2 ? 800 : 320);
    } else {
      if (stage.lifted !== idx || newAgent) setLifted(idx);
      liftMat.uniforms.uSel.value = level >= 3 && S.stratum ? STRATUM_INDEX[S.stratum] : -1;
      for (const o of labelGroups.l2.children) o.element.classList.toggle("on", !!S.stratum && o.element.classList.contains(`s-${S.stratum}`));
      if (prevLevel < 2 || newAgent || S.refit || lift.dur) frameL2(newAgent ? 1300 : 800);
    }
    dirty = 3;
  }
  function updateL1Labels() {
    clearGroup(labelGroups.l1);
    const agent = stage.agent;
    if (!agent) return;
    const r = agent.requests[cursor];
    label(`${cursor + 1} · ${fmtTok(r.tokens.context)} · ${fmtClock(r.t)}`, "cursor", new THREE.Vector3(stageX(cursor), (r.tokens.context || 0) * stage.scale + 0.6, STAGE_Z), [0.5, 1], labelGroups.l1);
    // compactions and unlogged shrinks near the cursor
    const near = i => Math.abs(i - cursor) < 40;
    for (const c of agent.compactions) {
      const i = agent.requests.findIndex(q => q.t >= c.t);
      if (i >= 0 && near(i)) label(`compacted ${fmtTok(c.pre)} → ${fmtTok(c.post)}`, "cliff", new THREE.Vector3(stageX(i) - SP / 2, H1 + 1.2, STAGE_Z), [0.5, 1], labelGroups.l1);
    }
    for (const s of unloggedShrinks(agent)) if (near(s.request)) label("context shrank; not logged as a compaction", "cliff soft", new THREE.Vector3(stageX(s.request) - SP / 2, H1 + 2.4, STAGE_Z), [0.5, 1], labelGroups.l1);
    // a three-tick ruler at the left of the view
    const x = stageX(Math.max(0, cursor - (host.clientWidth < 700 ? 11 : 24)));
    const peak = H1 / stage.scale;
    for (const f of [0.5, 1]) label(fmtTok(peak * f), "tick", new THREE.Vector3(x - 0.1, H1 * f, STAGE_Z), [1, 0.5], labelGroups.l1);
    labelGroups.l1.visible = level === 1;
    // the ruler line beside the tick labels
    rulerL1.geometry.setAttribute("position", new THREE.Float32BufferAttribute([x + 0.4, 0, STAGE_Z, x + 0.4, H1, STAGE_Z, x + 0.1, H1 * 0.5, STAGE_Z, x + 0.4, H1 * 0.5, STAGE_Z, x + 0.1, H1, STAGE_Z, x + 0.4, H1, STAGE_Z], 3));
    rulerL1.visible = level === 1;
  }
  const rulerL1 = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: "#8d97a6" }));
  rulerL1.visible = false;
  scene.add(rulerL1);

  // ---- picking ----
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pickAt(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    if (level >= 2 && lifted.visible) {
      const hit = ray.intersectObject(lifted, false)[0];
      if (hit) {
        const f = (hit.point.y - lifted.position.y) / lifted.scale.y;
        const j = lift.bounds.findIndex(v => f <= v + 1e-6);
        return { kind: "stratum", agentId: stage.agent.id, reqIdx: stage.lifted, stratum: STRATA[Math.max(0, j)].key };
      }
    }
    if (level >= 1 && stage.agent) {
      for (const dz of [CORE_R, 0]) {
        const t = (STAGE_Z + dz - o.z) / d.z;
        if (t <= 0) continue;
        const x = o.x + d.x * t, y = o.y + d.y * t;
        const i = Math.round((x - stageX(0)) / SP);
        if (i < 0 || i >= stage.n || Math.abs(x - stageX(i)) > CORE_R * 1.6) continue;
        const h = (stage.agent.requests[i].tokens.context || 0) * stage.scale;
        if (y >= -0.2 && y <= h + 0.4) return { kind: "core", agentId: stage.agent.id, reqIdx: i };
      }
      return null;
    }
    // L0: beacons and flags in screen space first, then rows front to back
    const px = (clientX - rect.left), py = (clientY - rect.top);
    const toScreen = v => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * rect.width, (1 - p.y) / 2 * rect.height]; };
    if (beams.visible) {
      let best = null, bd = 9;
      for (const b of beamPick) {
        const [ax, ay] = toScreen(new THREE.Vector3(b.x, b.y0, b.z)), [bx, by] = toScreen(new THREE.Vector3(b.x, b.y1, b.z));
        if (py > ay - 2) continue; // only the beam above the crest; the ridge face below belongs to the ridge
        const dd = segDist(px, py, ax, ay, bx, by);
        if (dd < bd) { bd = dd; best = b; }
      }
      if (best) return { kind: "action", agentId: best.a.id, reqIdx: best.i };
    }
    let best = null;
    const test = (z, depthFrac, depth, seg, row) => {
      const zz = z - depth * depthFrac;
      const t = (zz - o.z) / d.z;
      if (!(t > 0)) return;
      const x = o.x + d.x * t, y = o.y + d.y * t;
      if (x < seg.x0 * W - seg.taper || x > seg.x1 * W + seg.taper) return;
      const h = heightAt(seg.agent, seg.inf, seg, x, seg.taper);
      if (h < 0 || y < -0.1 || y > h * profile(depthFrac) + 0.05) return;
      if (!best || t < best.t) best = { t, kind: "ridge", agentId: seg.agent.id, reqIdx: nearestReq(seg.inf, seg, x) };
    };
    for (const row of rows) {
      const t0 = (row.z - o.z) / d.z;
      const xr = o.x + d.x * t0;
      for (const seg of row.segs) {
        if (xr < seg.x0 * W - 30 || xr > seg.x1 * W + 30) continue;
        for (const f of [0, 0.25, 0.5, 0.75]) test(row.z, f, row.depth, seg, row);
      }
    }
    for (const s of sideReqs) {
      const t = (SIDE_Z + 0.55 - o.z) / d.z;
      if (!(t > 0)) continue;
      const x = o.x + d.x * t, y = o.y + d.y * t;
      const h = 0.6 + 1.8 * Math.sqrt((s.a.requests[s.i].tokens.context || 0) / L.yMax);
      if (Math.abs(x - s.x) < 0.8 && y >= 0 && y <= h + 0.2 && (!best || t < best.t)) best = { t, kind: "side", agentId: s.a.id, reqIdx: s.i };
    }
    return best;
  }
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  let down = null, hoverQueued = null;
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { down = null; return; }
    down = null;
    const hit = pickAt(e.clientX, e.clientY);
    if (!hit) return;
    if (hit.kind === "stratum") onPick({ level: 3, agentId: hit.agentId, reqIdx: hit.reqIdx, stratum: hit.stratum });
    else if (hit.kind === "core") onPick({ level: 2, agentId: hit.agentId, reqIdx: hit.reqIdx });
    else if (hit.kind === "action" || hit.kind === "side") onPick({ level: 2, agentId: hit.agentId, reqIdx: hit.reqIdx });
    else onPick({ level: 1, agentId: hit.agentId, reqIdx: hit.reqIdx });
  });
  cv.addEventListener("pointermove", e => { hoverQueued = { x: e.clientX, y: e.clientY }; });
  cv.addEventListener("pointerleave", () => { hoverQueued = null; onHover(null); coreMat.uniforms.uHover.value = -1; linkHover.value = -1; dirty = 2; });

  // ---- loop ----
  let dirty = 3, raf = 0, bench = null;
  controls.addEventListener("change", () => { dirty = Math.max(dirty, 2); });
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (fly.on) {
      const k = ease(Math.min(1, (now - fly.t0) / fly.dur));
      camera.position.lerpVectors(fly.p0, fly.p1, k);
      controls.target.lerpVectors(fly.q0, fly.q1, k);
      if (k >= 1) fly.on = false;
      dirty = 2;
    }
    if (stage.agent && stage.dur && now - stage.t0 <= stage.dur + 50) { placeCores((now - stage.t0) / stage.dur); dirty = 2; }
    if (lifted.visible && lift.dur && now - lift.t0 <= lift.dur + 50) { stepLift((now - lift.t0) / lift.dur); dirty = 2; }
    if (controls.update()) dirty = Math.max(dirty, 1);
    shared.uFocusDist.value = camera.position.distanceTo(controls.target);
    if (hoverQueued) {
      const h = hoverQueued; hoverQueued = null;
      const hit = pickAt(h.x, h.y);
      coreMat.uniforms.uHover.value = hit && hit.kind === "core" ? hit.reqIdx : -1;
      const hovAgent = hit && hit.kind === "ridge" ? agentIndex.get(hit.agentId) : -1;
      linkHover.value = hovAgent != null && agents[hovAgent]?.kind === "subagent" ? hovAgent : -1;
      onHover(hit ? { ...hit, x: h.x, y: h.y } : null);
      dirty = Math.max(dirty, 1);
    }
    if (bench) { bench.frames.push(now); dirty = 1; controls.target.x += 0; camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.0015); }
    if (dirty > 0) {
      renderer.render(scene, camera);
      labels.render(scene, camera);
      measure();
      declutter();
      dirty--;
    }
  }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = `${w}px`; renderer.domElement.style.height = `${h}px`;
    labels.setSize(w, h);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    dirty = 3;
  }
  const ro = new ResizeObserver(() => resize());
  ro.observe(host);
  resize();
  setLens("context");
  frameL0(0);
  raf = requestAnimationFrame(frame);

  return {
    show,
    setInsets(v) {
      const changed = JSON.stringify(v) !== JSON.stringify(insets);
      insets = v;
      if (changed && level === 0 && !fly.on) frameL0(0);
    },
    refit() {
      // Reframe for the current level after the free area changes (window or panel resized).
      if (level === 0) frameL0(0);
      else if (level === 1 && stage.agent) frameL1(cursor, 350);
      else if (level >= 2 && lifted.visible) frameL2(350);
      dirty = 3;
    },
    stats() {
      const gl = renderer.getContext();
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown", labels: labels.domElement.childElementCount };
    },
    bench(ms = 3000) {
      return new Promise(res => {
        bench = { frames: [] };
        setTimeout(() => {
          const f = bench.frames; bench = null;
          const dts = f.slice(1).map((t, i) => t - f[i]).sort((a, b) => a - b);
          res({ frames: f.length, fps: dts.length ? 1000 / (dts.reduce((s, v) => s + v, 0) / dts.length) : 0, p95ms: dts[Math.floor(dts.length * 0.95)] || 0, ...this.stats() });
        }, ms);
      });
    },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); host.replaceChildren(); }
  };
}

function rulerTicks(max) {
  const step = [2.5e4, 5e4, 1e5, 2.5e5, 5e5, 1e6].find(s => max / s <= 4.5) || 1e6;
  const out = [];
  for (let v = step; v <= max * 1.001; v += step) out.push(v);
  return out;
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch { return false; }
}
