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

// The playback director's goals keep the view direction and the orbit distance (so the map zoom is the
// optical zoom times a constant), and move nothing until applied.
const applied = (camera, g) => {
  const c = camera.clone();
  c.position.copy(g.position); c.zoom = g.zoom; c.lookAt(g.target); c.updateProjectionMatrix(); c.updateMatrixWorld();
  return c;
};
const orbitCamera = (w, h, zoom) => {
  const camera = new THREE.PerspectiveCamera(34, w / h, 0.03, 4000), target = new THREE.Vector3(110, 10, -30);
  camera.position.set(-70, 140, 230); camera.lookAt(target); camera.zoom = zoom; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return { camera, target };
};

test('follow: the column top lands on the anchor pixel at the asked zoom; direction and orbit distance kept', async () => {
  const { anchorView } = await import('../map-camera.js');
  for (const [w, h] of [[390, 844], [1920, 1200]]) for (const zoom0 of [1, 5.8]) for (const want of [3.7, 5.8, 12.8, 400]) {
    const { camera, target } = orbitCamera(w, h, zoom0);
    const before = camera.position.clone(), dir = camera.getWorldDirection(new THREE.Vector3()), dist = camera.position.distanceTo(target);
    const point = new THREE.Vector3(150, 22, 4), x = 0.42 * w, y = 0.35 * h;
    const g = anchorView(camera, target, point, x, y, w, h, want);
    assert.ok(camera.position.equals(before) && camera.zoom === zoom0, 'the camera itself does not move');
    assert.equal(g.zoom, Math.min(256, want));
    const c = applied(camera, g), p = point.clone().project(c);
    assert.ok(Math.abs((p.x + 1) / 2 * w - x) < 0.5 && Math.abs((1 - p.y) / 2 * h - y) < 0.5, 'within half a pixel of the anchor');
    assert.ok(Math.abs(g.position.distanceTo(g.target) - dist) < 1e-7, 'orbit distance kept');
    assert.ok(c.getWorldDirection(new THREE.Vector3()).distanceTo(dir) < 1e-9, 'view direction kept');
  }
  assert.equal(anchorView(new THREE.PerspectiveCamera(), new THREE.Vector3(), new THREE.Vector3(), 0, 0, 0, 100, 2), null);
});

test('fit: every corner of the box inside the safe rect, tight on one axis, centred; direction and distance kept', async () => {
  const { fitView } = await import('../map-camera.js');
  const boxes = [[140, 160, 0, 30, -2, 6], [100, 101, 0, 40, -1, 1], [60, 200, 0, 12, -3, 20], [149.9, 150.1, 0, 0.3, 0, 0.2]];
  for (const [w, h] of [[390, 844], [1920, 1200]]) for (const zoom0 of [1, 5.8]) for (const [x0, x1, y0, y1, z0, z1] of boxes) {
    const { camera, target } = orbitCamera(w, h, zoom0);
    const dir = camera.getWorldDirection(new THREE.Vector3()), dist = camera.position.distanceTo(target);
    const pts = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(new THREE.Vector3(x, y, z));
    const safe = { x0: -1 + 2 * 0.05, x1: 1 - 2 * 0.2, y0: -1 + 2 * 0.12, y1: 1 - 2 * 0.04 }; // insets 5% left, 20% right, 4% top, 12% bottom
    const g = fitView(camera, target, pts, safe);
    assert.ok(g.zoom > 0.4 && g.zoom <= 256, `zoom ${g.zoom}`);
    assert.equal(camera.zoom, zoom0, 'the camera itself does not change');
    const c = applied(camera, g);
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    for (const p of pts) { const q = p.clone().project(c); bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); by0 = Math.min(by0, q.y); by1 = Math.max(by1, q.y); }
    const eps = 2 / w; // a pixel
    assert.ok(bx0 >= safe.x0 - eps && bx1 <= safe.x1 + eps && by0 >= safe.y0 - eps && by1 <= safe.y1 + eps, JSON.stringify({ bx0, bx1, by0, by1, safe }));
    if (g.zoom < 256) assert.ok(Math.abs((bx1 - bx0) - (safe.x1 - safe.x0)) < eps || Math.abs((by1 - by0) - (safe.y1 - safe.y0)) < eps, 'tight on one axis');
    assert.ok(Math.abs((bx0 + bx1) - (safe.x0 + safe.x1)) < 2 * eps || Math.abs((by0 + by1) - (safe.y0 + safe.y1)) < 2 * eps, 'centred');
    assert.ok(Math.abs(g.position.distanceTo(g.target) - dist) < 1e-7 && c.getWorldDirection(new THREE.Vector3()).distanceTo(dir) < 1e-9);
  }
});
