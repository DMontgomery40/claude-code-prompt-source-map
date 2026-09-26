// Rendering stability for the landscape: depth precision that survives optical zoom, and map symbols
// that are grouped in world space so panning never reshuffles them.
import * as THREE from "./vendor/three.module.min.js";

const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _d = new THREE.Vector3(), _o = new THREE.Vector3();

// Depth precision is set almost entirely by the near plane. The map zooms optically, so the camera stays
// hundreds of units back; with a fixed near of 0.03 the depth buffer there resolves only ~0.25 units, and a
// ridge's face and the slope behind it trade places in shards. Put near at the closest thing the camera can
// see: the nearest corner of the content box in view depth (depth is linear, so a corner is the minimum),
// and the ground where the viewport's corner rays meet it. far stays put: it barely affects precision.
export function fitNearPlane(camera, box, { floor = 0.05, margin = 0.92 } = {}) {
  camera.updateMatrixWorld();
  _m.copy(camera.matrixWorldInverse);
  let near = Infinity, behind = false;
  for (let k = 0; k < 8; k++) {
    _v.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).applyMatrix4(_m);
    if (-_v.z <= 0) behind = true; else near = Math.min(near, -_v.z);
  }
  // Any content straddling the camera plane: fall back to a floor scaled by the orbit distance.
  if (behind || box.containsPoint(camera.position)) near = floor;
  _o.setFromMatrixPosition(camera.matrixWorld);
  const proj = camera.projectionMatrixInverse;
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    _d.set(x, y, 0.5).applyMatrix4(proj).applyMatrix4(camera.matrixWorld).sub(_o).normalize();
    if (_d.y >= -1e-6 || _o.y <= 0) continue;
    const t = -_o.y / _d.y;
    _v.copy(_o).addScaledVector(_d, t).applyMatrix4(_m);
    if (-_v.z > 0) near = Math.min(near, -_v.z);
  }
  near = Math.max(floor, Number.isFinite(near) ? near * margin : floor);
  if (Math.abs(near - camera.near) > camera.near * 0.02) { camera.near = near; camera.updateProjectionMatrix(); }
  return camera.near;
}

// World units per screen pixel at the orbit target, for a perspective camera with optical zoom.
export function unitsPerPixel(camera, distance, heightPx) {
  return 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.max(1e-6, camera.zoom) / Math.max(1, heightPx);
}

// The world-space bin for a screen cell: a power of two, held with hysteresis so a wheel that
// hovers around a boundary does not split and merge the same symbols back and forth.
export function binExponent(cellWorld, previous) {
  const e = Math.log2(Math.max(1e-6, cellWorld));
  if (Number.isFinite(previous) && Math.abs(e - previous) < 0.75) return previous;
  return Math.round(e);
}

// Group map symbols by row and a world-x bin whose size depends only on zoom. Membership never
// depends on the camera's position, so panning moves symbols without regrouping them. Each group
// stands on its most important record: the class order given, then the member nearest the bin centre.
export function clusterStable(points, bin, { rowOf = p => p.z, rank = () => 0 } = {}) {
  const cells = new Map();
  for (const p of points) {
    const b = Math.floor(p.x / bin);
    const key = `${p.kind || ""}:${Math.round(rowOf(p) * 4)}:${b}`;
    let cell = cells.get(key);
    if (!cell) cells.set(key, cell = { point: p, count: 0, centre: (b + 0.5) * bin });
    cell.count++;
    const q = cell.point, rp = rank(p), rq = rank(q);
    if (rp < rq || (rp === rq && Math.abs(p.x - cell.centre) < Math.abs(q.x - cell.centre)) || (rp === rq && Math.abs(p.x - cell.centre) === Math.abs(q.x - cell.centre) && (p.i ?? 0) < (q.i ?? 0))) cell.point = p;
  }
  return [...cells.values()].map(({ point, count }) => ({ point, count }));
}
