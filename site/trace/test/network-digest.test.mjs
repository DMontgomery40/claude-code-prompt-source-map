// The wire lens's digest (network/digest.js) on the network fixtures, both products: the calls-by-model table adds
// up to the capture's calls and usage, there are always six findings, and every entry, host and run is counted once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { analyzeCapture } from "../network/capture.js";
import { modelBreakdown, findings, runs, pathTemplate, entryGroups, hostTable, callTokens, callDelta, wireTokenRows } from "../network/digest.js";

const NET = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "network");
async function capture(dir, file) {
  const entries = await entriesFor([join(NET, dir)]);
  let trace;
  try { trace = (await loadTrace(entries)).trace; } finally { await Promise.all(entries.map((e) => e.source.close())); }
  const { capture: cap } = await analyzeCapture([{ name: file, text: readFileSync(join(NET, file), "utf8") }], trace);
  return { cap, trace };
}
const CASES = [["claude", "claude.har"], ["codex", "codex.har"], ["claude", "claude-described.har"]];

for (const [dir, file] of CASES) {
  test(`${file}: calls by model add up to every call and its reported usage`, async () => {
    const { cap } = await capture(dir, file);
    const rows = modelBreakdown(cap);
    assert.equal(rows.length, new Set(cap.calls.map((c) => c.model || c.response?.model || "model not named")).size, "one row per model");
    assert.equal(rows.reduce((s, r) => s + r.calls, 0), cap.calls.length);
    assert.equal(rows.reduce((s, r) => s + r.inLog + r.notIn, 0), cap.calls.length);
    assert.equal(rows.filter((r) => r.main).length, 1, "exactly one main model");
    assert.ok(rows[0].main && rows.every((r) => r.inLog <= rows[0].inLog), "the main model has the most calls in the log and comes first");
    for (const k of ["input", "output", "cacheRead", "cacheWrite"]) assert.equal(rows.reduce((s, r) => s + r[k], 0), cap.calls.reduce((s, c) => s + callTokens(c)[k], 0), k);
  });

  test(`${file}: six findings, each opening a section, for any capture`, async () => {
    const { cap, trace } = await capture(dir, file);
    const f = findings(cap, trace);
    assert.deepEqual(f.map((x) => x.id), ["notlog", "creds", "identity", "home", "on", "log"]);
    for (const x of f) {
      assert.ok(x.text && typeof x.text === "string", x.id);
      assert.ok(x.open.length && x.open.every((k) => /^(sec|calls|transit):/.test(k)), `${x.id} opens a section`);
    }
  });

  test(`${file}: every entry lands in exactly one path group, and every host is one row`, async () => {
    const { cap } = await capture(dir, file);
    const byI = new Map(cap.entries.map((x) => [x.i, x]));
    for (const r of cap.roles) for (const e of r.endpoints) {
      const groups = entryGroups(e, byI);
      assert.equal(groups.reduce((s, g) => s + g.items.length, 0), e.entries.length, e.label);
      assert.equal(new Set(groups.flatMap((g) => g.items.map((x) => x.i))).size, e.entries.length, `${e.label}: no entry twice`);
    }
    const hosts = hostTable(cap);
    assert.equal(hosts.length, new Set(cap.entries.map((x) => x.host).concat((cap.transit?.rows || []).map((r) => r.host))).size);
    assert.equal(hosts.reduce((s, h) => s + h.requests, 0), cap.entries.length);
    const order = { third: 0, local: 1, first: 2 };
    assert.ok(hosts.every((h, i) => !i || order[hosts[i - 1].party] <= order[h.party]), "third parties first, then this machine, then first party");
  });
}

test("the log's tokens beside the wire's: a matched call agrees on the context total", async () => {
  const { cap, trace } = await capture("claude", "claude.har");
  const c = cap.calls.find((x) => x.matched.length);
  const m = c.matched[0], req = trace.agents.find((a) => a.id === m.agentId).requests[m.reqIdx];
  const t = wireTokenRows(c, req);
  assert.equal(t.rows[0][0], "Context");
  assert.equal(t.wireContext, callTokens(c).context);
  assert.equal(t.equal, req.tokens.context === callTokens(c).context);
});

test("runs merge consecutive equal keys only, and keep each item", () => {
  const rs = runs([{ n: "a", t: 1 }, { n: "a", t: 2 }, { n: "b", t: 3 }, { n: "a", t: 4 }], (x) => x.n);
  assert.deepEqual(rs.map((r) => [r.key, r.count, r.t0, r.t1]), [["a", 2, 1, 2], ["b", 1, 3, 3], ["a", 1, 4, 4]]);
  assert.equal(rs.reduce((s, r) => s + r.items.length, 0), 4);
});

test("a path's ids read as :id, so the same call groups together", () => {
  assert.equal(pathTemplate("/v1/code/sessions/0b1c2d3e-1111-2222-3333-444455556666/worker"), "/v1/code/sessions/:id/worker");
  assert.equal(pathTemplate("/v1/mcp/12345?x=1"), "/v1/mcp/:id");
  assert.equal(pathTemplate("/repos/a/b/pulls"), "/repos/a/b/pulls");
  assert.equal(pathTemplate("/blob/9f86d081884c7d659a2feaa0c55ad015"), "/blob/:id");
});

test("callDelta names what changed between two calls of one kind", () => {
  const a = { product: "claude-code", tools: [{ name: "Bash" }, { name: "Read" }], system: [{ chars: 100 }], betas: ["x"] };
  const b = { product: "claude-code", tools: [{ name: "Read" }, { name: "WebFetch" }], system: [{ chars: 160 }], betas: ["x"] };
  assert.equal(callDelta(a, b), "tools +WebFetch −Bash · system block 1 +60 chars");
  assert.equal(callDelta(a, a), "same tools, system and betas");
  assert.equal(callDelta(null, a), null);
});
