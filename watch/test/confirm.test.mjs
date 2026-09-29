import assert from "node:assert/strict";
import test from "node:test";
import { confirmChange } from "../lib/confirm.mjs";
import { codex } from "../targets/codex.mjs";

// Replays a sequence of fingerprints through the watcher's decision, as hourly checks would.
function replay(keys, needsConfirm = () => true) {
  let published = "A", pending = null;
  const out = [];
  for (const key of keys) {
    const c = confirmChange({ key, published, pending, needsConfirm: needsConfirm(key) });
    pending = c.pending;
    if (c.run) { published = key; out.push(`publish ${key}`); } else out.push(c.flippedBack ? "flipped back" : key === published ? "unchanged" : "wait");
  }
  return out;
}

test("an alternating catalog is published once, when one version holds for two checks", () => {
  // 2026-09-28: the Sol instructions went new, old, new, old, new, then held.
  assert.deepEqual(replay(["B", "A", "B", "A", "B", "B", "B"]), ["wait", "flipped back", "wait", "flipped back", "wait", "publish B", "unchanged"]);
});

test("a real catalog change publishes one check later; app changes publish at once", () => {
  assert.deepEqual(replay(["B", "B"]), ["wait", "publish B"]);
  assert.deepEqual(replay(["C"], () => false), ["publish C"]);
});

test("Codex/ChatGPT: only a change of the catalog alone needs confirming", () => {
  const prev = { app_build: "11645", cli_sha256: "c1", catalog_sha256: "k1", asar_size: 1, asar_mtime: "t" };
  assert.equal(codex.needsConfirmation({ ...prev, catalog_sha256: "k2" }, prev), true);
  assert.equal(codex.needsConfirmation({ ...prev, catalog_sha256: "k2", app_build: "11700" }, prev), false);
  assert.equal(codex.needsConfirmation({ ...prev, cli_sha256: "c2" }, prev), false);
  assert.equal(codex.needsConfirmation(prev, null), false);
});
