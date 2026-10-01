import assert from "node:assert/strict";
import test from "node:test";
import { GateFailure, Retry, applyFailure, failureDecision, repairExcerpt } from "../lib/publish.mjs";
import { gateRepairTask, gateWithRepairs, sortRepairPaths } from "../lib/repair.mjs";

// A fake checkout: each repair adds files to the dirty set; restore takes them out.
function harness(results, edits = []) {
  const dirty = new Set(["claude-code/outputs/a.json"]);
  const calls = { gate: 0, repair: 0, restored: [] };
  return {
    calls, dirty: () => new Set(dirty),
    restore: paths => { calls.restored.push(...paths); paths.forEach(p => dirty.delete(p)); },
    runGate: async () => { const r = results[calls.gate++]; if (r) throw r; },
    repair: async () => { for (const f of edits[calls.repair++] ?? []) dirty.add(f); },
  };
}
const failing = () => new GateFailure("npm run check", "not ok 79 - every evidence literal is still in the code it cites\n  error: ENOENT\n# fail 1");

test("a passing gate needs no repair", async () => {
  const h = harness([null]);
  assert.deepEqual(await gateWithRepairs({ ...h, produced: ["claude-code/outputs/a.json"] }), { repaired: [], blocked: [] });
  assert.equal(h.calls.repair, 0);
});

test("a failed gate is repaired and rerun; the repair's own files are kept, the cycle's are not counted", async () => {
  const h = harness([failing(), null], [["claude-code/extract/local-sources.cjs", "claude-code/outputs/a.json", "tools/sources/index.mjs"]]);
  assert.deepEqual(await gateWithRepairs({ ...h, produced: ["claude-code/outputs/a.json"] }), { repaired: ["claude-code/extract/local-sources.cjs", "tools/sources/index.mjs"], blocked: [] });
  assert.equal(h.calls.gate, 2);
});

test("edits to tests, lint exemptions or files outside the repair area are put back, never kept", async () => {
  const edits = [["tools/test/sources.test.mjs", "codex/narrative-lint.json", "watch/watch.mjs", "README.md", "scratch.txt", "codex/extract/codex/key-findings.mjs", "site/test/x.test.mjs"]];
  const h = harness([failing(), null], edits);
  const outcome = await gateWithRepairs(h);
  assert.deepEqual(outcome.repaired, ["codex/extract/codex/key-findings.mjs"]);
  assert.deepEqual(outcome.blocked, ["README.md", "codex/narrative-lint.json", "scratch.txt", "site/test/x.test.mjs", "tools/test/sources.test.mjs", "watch/watch.mjs"]);
  assert.deepEqual(h.calls.restored.sort(), outcome.blocked);
  assert.deepEqual(sortRepairPaths(["claude-code/extract/test/a.test.mjs"]).blocked, ["claude-code/extract/test/a.test.mjs"]);
});

test("a failure that outlasts the repairs carries what they changed and counts as spent agent work", async () => {
  const h = harness([failing(), failing(), failing()], [["tools/a.mjs"], ["tools/b.mjs"]]);
  const error = await gateWithRepairs({ ...h, repairs: 2 }).catch(e => e);
  assert.ok(error instanceof GateFailure && error.afterAgent);
  assert.deepEqual(error.repairedPaths, ["tools/a.mjs", "tools/b.mjs"]);
  assert.equal(h.calls.repair, 2);
});

test("a Retry after a paid repair still counts toward the daily cap and waits for its gap", async () => {
  const outage = new Retry("narrative lint waits for Jev", { jev: true });
  const h = harness([failing(), outage], [["tools/x.mjs"]]);
  const error = await gateWithRepairs(h).catch(e => e);
  assert.equal(error, outage);
  assert.ok(error.afterAgent);
  const now = Date.parse("2026-10-01T12:00:00Z");
  const s = { lastCheck: now };
  const d = failureDecision(error, undefined, now, { afterAgent: true });
  assert.equal(d.retryNextCycle, false);
  applyFailure(s, "v1", d, { head: "abc", now, spent: true });
  assert.equal(s.failure.attempts, 1);
  assert.equal(s.lastCheck, now);
});

test("a Jev outage or a moved main before any repair is not repaired, and a dry run repairs nothing", async () => {
  for (const error of [new Retry("waits for Jev", { jev: true }), new Retry("GitHub's main moved")]) {
    const h = harness([error]);
    const thrown = await gateWithRepairs(h).catch(e => e);
    assert.equal(thrown, error);
    assert.equal(thrown.afterAgent, undefined);
    assert.equal(h.calls.repair, 0);
  }
  const h = harness([failing()]);
  assert.ok(await gateWithRepairs({ ...h, repairs: 0 }).catch(e => e) instanceof GateFailure);
  assert.equal(h.calls.repair, 0);
});

test("the repair task leads with the failing tests and keeps tests and exemptions out of reach", () => {
  const output = `${"ok 1 - fine\n".repeat(3000)}not ok 79 - every evidence literal is still in the code it cites\n  error: ENOENT chunk-w4t9a3px.js\n${"# tail\n".repeat(10)}`;
  const excerpt = repairExcerpt(output);
  assert.ok(excerpt.startsWith("not ok 79 - every evidence literal"));
  assert.ok(excerpt.length <= 20010);
  assert.match(new GateFailure("npm run check", output).message, /npm run check failed: not ok 79/);
  const task = gateRepairTask(new GateFailure("npm run check", output), ["cc"]);
  assert.match(task, /Tests, test fixtures and the narrative-lint\.json exemption lists are not yours to change/);
  assert.match(task, /Edit only files under claude-code\/, codex\/, tools\/ or site\//);
});
