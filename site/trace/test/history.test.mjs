import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as navigation from '../navigation.js';

// Minimal browser history port; real push/pop integration is also checked in the browser.
function browserHistory() {
  const entries = [null]; let index = 0, listener;
  const win = { addEventListener: (_, fn) => { listener = fn; }, removeEventListener: () => { listener = null; } };
  win.history = {
    get state() { return entries[index]; },
    replaceState(s) { entries[index] = structuredClone(s); },
    pushState(s) { entries.splice(++index); entries[index] = structuredClone(s); },
    back() { if (index) listener?.({ state: entries[--index] }); },
    forward() { if (index + 1 < entries.length) listener?.({ state: entries[++index] }); }
  };
  return { win, entries };
}

test('Back and Forward restore selection, camera, lens and scroll without adding pan history', () => {
  assert.equal(typeof navigation.createViewHistory, 'function');
  const { win, entries } = browserHistory();
  let state = { level: 0, camera: { zoom: 1, position: [0, 1, 2] }, lens: 'context', scroll: 0 };
  const nav = navigation.createViewHistory(win, () => state, s => { state = s; });
  state.camera.zoom = 5.8; state.camera.position = [8, 3, 2];
  nav.checkpoint();
  nav.navigate(() => { state = { ...state, level: 2, reqIdx: 829, inspector: 'action' }; });
  state.scroll = 200; nav.checkpoint();
  nav.navigate(() => { state = { ...state, level: 3, stratum: 'model', scroll: 0 }; });
  win.history.back(); assert.equal(state.level, 2); assert.equal(state.scroll, 200); assert.equal(state.reqIdx, 829);
  nav.back(); assert.deepEqual(state, { level: 0, camera: { zoom: 5.8, position: [8, 3, 2] }, lens: 'context', scroll: 0 });
  assert.equal(nav.back(), false, 'root does not trap browser Back');
  win.history.forward(); assert.equal(state.inspector, 'action');
  nav.navigate(() => { state = { ...state, lens: 'egress' }; });
  win.history.forward(); assert.equal(state.lens, 'egress', 'new branch discards old Forward path');
  assert.equal(entries.length, 3, 'pan/scroll changes replace rather than push entries');
  nav.dispose();
});

test('history ignores entries from another loaded session', () => {
  assert.equal(typeof navigation.createViewHistory, 'function');
  const { win } = browserHistory(); let state = { level: 0 };
  let nav = navigation.createViewHistory(win, () => state, s => { state = s; });
  nav.navigate(() => { state = { level: 2 }; });
  nav.dispose();
  state = { level: 0, session: 'new' };
  nav = navigation.createViewHistory(win, () => state, s => { state = s; });
  win.history.back(); assert.deepEqual(state, { level: 0, session: 'new' });
  nav.dispose();
});

test('one continuous request scrub is one Back step and async view switches capture the finished state', async () => {
  const { win, entries } = browserHistory(); let state = { reqIdx: 10, mode: '3d' };
  const nav = navigation.createViewHistory(win, () => state, s => { state = s; });
  nav.navigate(() => { state.reqIdx = 11; });
  for (let i = 12; i < 30; i++) nav.navigate(() => { state.reqIdx = i; }, { replace: true });
  assert.equal(entries.length, 2);
  win.history.back(); assert.equal(state.reqIdx, 10);
  win.history.forward(); assert.equal(state.reqIdx, 29);
  await nav.navigate(async () => { await Promise.resolve(); state.mode = '2d'; });
  win.history.back(); assert.equal(state.mode, '3d');
  win.history.forward(); assert.equal(state.mode, '2d');
  nav.dispose();
});
