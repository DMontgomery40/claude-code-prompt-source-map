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
