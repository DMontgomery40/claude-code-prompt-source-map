import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { zoomCamera } from '../map-camera.js';

test('pointer-anchored optical zoom preserves depth and its map point across viewports and scales', () => {
  for (const [w, h] of [[390, 844], [1280, 800], [2216, 1328]]) {
    for (const [fx, fy] of [[0.1, 0.2], [0.5, 0.5], [0.75, 0.8]]) for (const depthFactor of [0.6, 1, 1.4]) {
      const camera = new THREE.PerspectiveCamera(34, w / h, 0.03, 4000);
      const target = new THREE.Vector3(110, 10, -30);
      camera.position.set(-70, 140, 230); camera.lookAt(target); camera.updateMatrixWorld();
      const forward = camera.getWorldDirection(new THREE.Vector3());
      const initialDepth = camera.position.dot(forward), distance = camera.position.distanceTo(target);
      const ndc = new THREE.Vector3(fx * 2 - 1, 1 - fy * 2, 0.5);
      const ray = new THREE.Ray(camera.position, ndc.clone().unproject(camera).sub(camera.position).normalize());
      const planePoint = camera.position.clone().lerp(target, depthFactor);
      const anchor = ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(forward, planePoint), new THREE.Vector3());
      for (const factor of [1.55, 1.55, 4, 20, 100, 0.001, 2, 0.5]) {
        zoomCamera(camera, target, factor, fx * w, fy * h, w, h, anchor);
        const p = anchor.clone().project(camera);
        assert.ok(Math.abs(p.x - ndc.x) < 1e-7 && Math.abs(p.y - ndc.y) < 1e-7, 'the pointer stays over the same map point');
        assert.ok(Math.abs(camera.position.dot(forward) - initialDepth) < 1e-7, 'zoom never moves into the terrain');
        assert.ok(Math.abs(camera.position.distanceTo(target) - distance) < 1e-7);
        assert.ok(camera.zoom >= 0.4 && camera.zoom <= 256);
      }
    }
  }
});

test('invalid zoom gestures leave the camera unchanged', () => {
  const camera = new THREE.PerspectiveCamera(), target = new THREE.Vector3();
  for (const factor of [0, -1, NaN, Infinity]) zoomCamera(camera, target, factor, 10, 10, 100, 100);
  assert.equal(camera.zoom, 1);
});

test('locating a request centers the actual map point without changing zoom or camera depth', async () => {
  const { panCameraTo } = await import('../map-camera.js');
  assert.equal(typeof panCameraTo, 'function');
  for (const [w, h] of [[390, 844], [1400, 950]]) for (const zoom of [1, 5.8, 30]) {
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.03, 4000);
    const target = new THREE.Vector3(110, 10, -30), point = new THREE.Vector3(150, 22, 0);
    camera.position.set(-70, 140, 230); camera.lookAt(target); camera.zoom = zoom;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const forward = camera.getWorldDirection(new THREE.Vector3()), depth = camera.position.dot(forward);
    panCameraTo(camera, target, point, w * 0.3, h * 0.6, w, h);
    const projected = point.clone().project(camera);
    assert.ok(Math.abs(projected.x + 0.4) < 1e-7 && Math.abs(projected.y + 0.2) < 1e-7);
    assert.ok(Math.abs(camera.position.dot(forward) - depth) < 1e-7);
    assert.equal(camera.zoom, zoom);
  }
});

test('the near plane follows the content: nothing visible is clipped, and depth stays precise at any optical zoom', async () => {
  const { fitNearPlane } = await import('../render-quality.js');
  // the real session's terrain box, give or take: a wide massif with a field of lanes in front
  const box = new THREE.Box3(new THREE.Vector3(-6, 0, -70), new THREE.Vector3(236, 50, 110));
  const resolution = (camera, d) => d * d / (camera.near * 2 ** 24); // world units per 24-bit depth step at distance d
  for (const [w, h] of [[390, 844], [1920, 1200], [2560, 1440]]) for (const [az, el] of [[-25, 40], [-60, 12], [10, 70]]) {
    for (const zoom of [0.6, 1, 4, 30, 256]) {
      const camera = new THREE.PerspectiveCamera(34, w / h, 0.03, 4000);
      const target = new THREE.Vector3(115, 8, 10), dist = 350;
      const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
      camera.position.set(target.x + dist * Math.sin(a) * Math.cos(e), target.y + dist * Math.sin(e), target.z + dist * Math.cos(a) * Math.cos(e));
      camera.lookAt(target); camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      assert.ok(resolution(camera, dist) > 0.05, 'the old fixed near plane really was too coarse here');
      fitNearPlane(camera, box, { floor: dist * 0.01 });
      const view = new THREE.Vector3();
      for (let k = 0; k < 400; k++) {
        const p = new THREE.Vector3(box.min.x + (box.max.x - box.min.x) * ((k * 0.618) % 1), box.max.y * ((k * 0.377) % 1), box.min.z + (box.max.z - box.min.z) * ((k * 0.141) % 1));
        view.copy(p).applyMatrix4(camera.matrixWorldInverse);
        assert.ok(-view.z >= camera.near, 'no content point is in front of the near plane');
      }
      assert.ok(resolution(camera, dist) < 0.002, `depth resolves ${resolution(camera, dist).toFixed(4)} units at the target`);
    }
  }
  // a camera inside the content keeps a small floor rather than clipping what surrounds it
  const inside = new THREE.PerspectiveCamera(34, 1.5, 0.03, 4000);
  inside.position.set(100, 20, 0); inside.lookAt(100, 0, -20); inside.updateMatrixWorld();
  assert.equal(fitNearPlane(inside, box, { floor: 0.2 }), 0.2);
});
