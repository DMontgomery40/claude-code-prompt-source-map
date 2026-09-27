import * as THREE from './vendor/three.module.min.js';

// Optical zoom keeps camera depth fixed. Pan the view to preserve the map point
// under the pointer, rather than dollying through the terrain at close scales.
export function zoomCamera(camera, target, factor, x, y, width, height, anchor = target) {
  if (!(factor > 0) || !Number.isFinite(factor) || !(width > 0 && height > 0)) return;
  camera.updateMatrixWorld();
  const forward = camera.getWorldDirection(new THREE.Vector3());
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(forward, anchor);
  const rayAt = () => {
    const direction = new THREE.Vector3(x / width * 2 - 1, 1 - y / height * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    return new THREE.Ray(camera.position, direction).intersectPlane(plane, new THREE.Vector3());
  };
  const before = rayAt();
  camera.zoom = Math.max(0.4, Math.min(256, camera.zoom * factor));
  camera.updateProjectionMatrix();
  const after = rayAt();
  if (before && after) { const shift = before.sub(after); camera.position.add(shift); target.add(shift); }
  camera.updateMatrixWorld();
}

export function panCameraTo(camera, target, point, x, y, width, height) {
  if (!(width > 0 && height > 0)) return;
  camera.updateMatrixWorld();
  const forward = camera.getWorldDirection(new THREE.Vector3());
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(forward, point);
  const direction = new THREE.Vector3(x / width * 2 - 1, 1 - y / height * 2, 0.5).unproject(camera).sub(camera.position).normalize();
  const at = new THREE.Ray(camera.position, direction).intersectPlane(plane, new THREE.Vector3());
  if (!at) return;
  const shift = point.clone().sub(at);
  camera.position.add(shift); target.add(shift); camera.updateMatrixWorld();
}

// The playback director's goals (scene.setDirectorShot). Both keep the camera's view direction and its
// distance to the orbit target, as the map's own zoom and pan do, and return where the camera, the
// target and the optical zoom should end, without moving the camera.
const clampZoom = z => Math.max(0.4, Math.min(256, z));

// Follow: `point` at pixel (x, y) of the canvas at optical zoom `zoom`.
export function anchorView(camera, target, point, x, y, width, height, zoom) {
  if (!(width > 0 && height > 0) || !(zoom > 0)) return null;
  const cam = camera.clone();
  cam.zoom = clampZoom(zoom); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const tgt = target.clone();
  panCameraTo(cam, tgt, point, x, y, width, height);
  return { position: cam.position.clone(), target: tgt, zoom: cam.zoom };
}

// Fit: every point inside `safe` (an NDC rect { x0, x1, y0, y1 }), as large as it fits, centred in it.
// The optical zoom scales NDC about the view centre, so it is the safe rect's size over the points'
// extent at zoom 1; the pan that centres them is solved again after each move, since a pan shifts near
// and far points by different amounts.
export function fitView(camera, target, points, safe, passes = 3) {
  if (!points.length) return null;
  const cam = camera.clone();
  cam.zoom = 1; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  const tgt = target.clone(), v = new THREE.Vector3(), c = new THREE.Vector3();
  const forward = cam.getWorldDirection(new THREE.Vector3());
  const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
  const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  let zoom = 1;
  for (let pass = 0; pass < passes; pass++) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    c.set(0, 0, 0);
    for (const p of points) {
      v.copy(p).project(cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
      c.add(p);
    }
    c.divideScalar(points.length);
    zoom = clampZoom(Math.min((safe.x1 - safe.x0) / Math.max(1e-9, x1 - x0), (safe.y1 - safe.y0) / Math.max(1e-9, y1 - y0)));
    // at zoom z a point's NDC is z times its NDC at 1: move so the extent's centre lands on the safe centre
    const dx = (safe.x0 + safe.x1) / 2 / zoom - (x0 + x1) / 2, dy = (safe.y0 + safe.y1) / 2 / zoom - (y0 + y1) / 2;
    const depth = Math.max(1e-6, v.copy(c).sub(cam.position).dot(forward)), halfH = depth * tanH, halfW = halfH * cam.aspect;
    v.copy(right).multiplyScalar(-dx * halfW).addScaledVector(up, -dy * halfH);
    cam.position.add(v); tgt.add(v); cam.updateMatrixWorld();
  }
  return { position: cam.position.clone(), target: tgt, zoom };
}
