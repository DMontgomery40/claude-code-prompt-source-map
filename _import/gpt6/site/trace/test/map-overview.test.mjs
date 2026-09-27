import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';

const api = await import('../map-overview.js').catch(() => ({}));

test('the overview fits the complete terrain, including tall and distant agent rows', () => {
  assert.equal(typeof api.fitMapOverview, 'function');
  for (const depth of [8, 90, 500]) for (const aspect of [1, 2.5, 4]) {
    const box = new THREE.Box3(new THREE.Vector3(-6, 0, -62), new THREE.Vector3(223, 42, depth));
    const camera = api.fitMapOverview(box, aspect, new THREE.Vector3(-0.3, 0.7, 1).normalize());
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const p = new THREE.Vector3(x, y, z).project(camera);
      assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 && Math.abs(p.z) <= 1, 'every terrain corner fits');
    }
  }
});

test('minimap terrain hits preserve the agent and nearest request across separate bursts', () => {
  assert.equal(typeof api.requestAtMapPoint, 'function');
  const info = new Map([['root', { xs: [0, .2, .5, 1] }], ['child', { xs: [.1, .11, .8, .81] }], ['empty', {xs: []}]]);
  for (const [id, data] of info) for (let i = 0; i < data.xs.length; i++) {
    assert.deepEqual(api.requestAtMapPoint({info}, id, data.xs[i] * 220, 220), { agentId: id, reqIdx: i });
  }
  assert.equal(api.requestAtMapPoint({info}, 'empty', 100, 220), null);
  assert.equal(api.requestAtMapPoint({info}, 'missing', 100, 220), null);
});

test('the minimap viewport follows zoom and pan and handles a map outside the view', () => {
  assert.equal(typeof api.visibleMapGround, 'function');
  const box = new THREE.Box3(new THREE.Vector3(0,0,0), new THREE.Vector3(100,20,100));
  const cam = new THREE.OrthographicCamera(-60, 60, 60, -60, .1, 1000);
  cam.position.set(50,200,50);cam.up.set(0,0,-1);cam.lookAt(50,0,50);cam.updateMatrixWorld();
  const area = pts => Math.abs(pts.reduce((s,p,i) => s+p.x*pts[(i+1)%pts.length].z-pts[(i+1)%pts.length].x*p.z,0)/2);
  assert.equal(area(api.visibleMapGround(cam, box)), 10000);
  cam.zoom=4;cam.updateProjectionMatrix();
  assert.ok(Math.abs(area(api.visibleMapGround(cam, box))-900)<1e-6);
  const safe = {x0:-1,x1:0,y0:-1,y1:1};
  assert.ok(Math.abs(area(api.visibleMapGround(cam, box, safe))-450)<1e-6, 'the sidebar-covered area is excluded');
  cam.position.x=500;cam.lookAt(500,0,50);cam.updateMatrixWorld();
  assert.equal(api.visibleMapGround(cam,box).length,0);
});

test('overview point fitting keeps sparse terrain large without excluding any ridge', () => {
  const points=[new THREE.Vector3(0,32,0),new THREE.Vector3(220,32,0),new THREE.Vector3(0,0,-60),new THREE.Vector3(220,0,-60),new THREE.Vector3(100,3,110)];
  const box=new THREE.Box3().setFromPoints(points);
  const camera=api.fitMapOverview(box,2.5,new THREE.Vector3(-.3,.7,1).normalize(),points);
  const projected=points.map(p=>p.clone().project(camera));
  assert.ok(projected.every(p=>Math.abs(p.x)<1 && Math.abs(p.y)<1));
  assert.ok(Math.max(...projected.map(p=>p.y))-Math.min(...projected.map(p=>p.y))>1.8, 'uses the available height instead of fitting imaginary tall corners');
});

test('viewport clipping stays finite for perspective views facing toward and across the horizon', () => {
  const box=new THREE.Box3(new THREE.Vector3(0,0,-60),new THREE.Vector3(220,32,110));
  for (const elevation of [.01,.2,.8]) for (const zoom of [.4,1,6,80]) {
    const cam=new THREE.PerspectiveCamera(34,1.6,.03,4000);
    cam.position.set(-40,300*elevation,300);cam.lookAt(110,0,20);cam.zoom=zoom;cam.updateProjectionMatrix();cam.updateMatrixWorld();
    const points=api.visibleMapGround(cam,box,{x0:-.95,x1:.5,y0:-.7,y1:.7});
    for (const p of points) {
      assert.ok(p.toArray().every(Number.isFinite));
      assert.ok(p.x>=box.min.x-1e-6 && p.x<=box.max.x+1e-6 && p.z>=box.min.z-1e-6 && p.z<=box.max.z+1e-6);
      const q=p.clone().project(cam);
      assert.ok(q.x>=-.95-1e-6 && q.x<=.5+1e-6 && q.y>=-.7-1e-6 && q.y<=.7+1e-6);
    }
  }
});

test('minimap colors follow the active lens while inspector hiding stays out of the overview', () => {
  assert.equal(typeof api.overviewAgentData, 'function');
  const agents=[{kind:'root'},{kind:'subagent'},{kind:'side'}];
  const source=new Float32Array(24);
  source.set([.2,.3,.4,1,.6,.7,.8,1,.1,.2,.3,0]);
  source.fill(.1,12);source[17]=1;source[19]=1;
  for (const lens of ['context','agents','inflow','egress']) {
    const out=api.overviewAgentData(source,agents,lens);
    assert.deepEqual([...out.slice(0,12)],[...source.slice(0,12)], 'the actual lens colors are retained');
    agents.forEach((a,i)=>{
      assert.ok(Math.abs(out[12+i*4]-(a.kind==='root'&&lens==='agents'?.35:1))<1e-6);
      assert.deepEqual([...out.slice(13+i*4,16+i*4)],[0,0,0], 'no hidden or faded ridges in the navigator');
    });
  }
});
