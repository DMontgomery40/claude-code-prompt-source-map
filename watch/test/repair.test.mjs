import assert from "node:assert/strict";
import test from "node:test";
import { failureDue } from "../lib/failure.mjs";
import { GateFailure, Retry, repairExcerpt } from "../lib/publish.mjs";
import { gateRepairTask, gateWithRepairs } from "../lib/repair.mjs";

// A fake checkout: each repair adds files to the dirty set.
function harness(results, edits = []) {
  const dirty = new Set(["claude-code/outputs/a.json"]);
  const calls = { gate: 0, repair: 0 };
  return {
    calls, dirty: () => new Set(dirty),
    runGate: async () => { const r = results[calls.gate++]; if (r) throw r; },
    repair: async () => { for (const f of edits[calls.repair++] ?? []) dirty.add(f); },
  };
}
const failing = () => new GateFailure("npm run check", "not ok 79 - every evidence literal is still in the code it cites\n  error: ENOENT\n# fail 1");

test("a passing gate needs no repair", async () => {
  const h = harness([null]);
  assert.deepEqual(await gateWithRepairs({ ...h, produced: ["claude-code/outputs/a.json"] }), []);
  assert.deepEqual(h.calls, { gate: 1, repair: 0 });
});

test("a failed gate is repaired and rerun; the repair's files outside the cycle's own are returned", async () => {
  const h = harness([failing(), null], [["tools/test/sources.test.mjs", "claude-code/outputs/a.json", "claude-code/extract/local-sources.cjs"]]);
  const repaired = await gateWithRepairs({ ...h, produced: ["claude-code/outputs/a.json"] });
  assert.deepEqual(repaired, ["claude-code/extract/local-sources.cjs", "tools/test/sources.test.mjs"]);
  assert.deepEqual(h.calls, { gate: 2, repair: 1 });
});

test("a failure that outlasts the repairs is thrown with what the repairs changed", async () => {
  const h = harness([failing(), failing(), failing()], [["tools/a.mjs"], ["tools/b.mjs"]]);
  const error = await gateWithRepairs({ ...h, repairs: 2 }).catch(e => e);
  assert.ok(error instanceof GateFailure);
  assert.deepEqual(error.repairedPaths, ["tools/a.mjs", "tools/b.mjs"]);
  assert.deepEqual(h.calls, { gate: 3, repair: 2 });
});

test("a Jev outage or a moved main is not repaired, and a dry run repairs nothing", async () => {
  for (const error of [new Retry("waits for Jev", { jev: true }), new Retry("GitHub's main moved")]) {
    const h = harness([error]);
    assert.equal(await gateWithRepairs(h).catch(e => e), error);
    assert.equal(h.calls.repair, 0);
  }
  const h = harness([failing()]);
  assert.ok(await gateWithRepairs({ ...h, repairs: 0 }).catch(e => e) instanceof GateFailure);
  assert.equal(h.calls.repair, 0);
});

test("the repair task leads with the failing tests and forbids weakening checks", () => {
  const output = `${"ok 1 - fine\n".repeat(3000)}not ok 79 - every evidence literal is still in the code it cites\n  error: ENOENT chunk-w4t9a3px.js\n${"# tail\n".repeat(10)}`;
  const excerpt = repairExcerpt(output);
  assert.ok(excerpt.startsWith("not ok 79 - every evidence literal"));
  assert.ok(excerpt.length <= 20000 + 10);
  assert.match(new GateFailure("npm run check", output).message, /npm run check failed: not ok 79/);
  const task = gateRepairTask(new GateFailure("npm run check", output), ["cc"]);
  assert.match(task, /Never make a check pass by deleting, skipping or loosening a test/);
  assert.match(task, /Don't edit watch\//);
});

test("a pending failure is due after its gap, or at once on new code", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const failure = { key: "v1", head: "abc", lastAt: now - 2 * 3600e3 };
  assert.equal(failureDue(undefined, { head: "abc", now }), false);
  assert.equal(failureDue(failure, { head: "abc", now }), true);
  assert.equal(failureDue(failure, { head: "abc", now, gapMs: 4 * 3600e3 }), false);
  assert.equal(failureDue(failure, { head: "def", now, gapMs: 4 * 3600e3 }), true);
});
