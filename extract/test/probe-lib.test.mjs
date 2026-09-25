import assert from "node:assert/strict";
import test from "node:test";
import { casesFor, observers } from "../probe-lib.mjs";

// The shape of a real request with ENABLE_PROMPT_CACHING_1H=1 (spike capture, trimmed).
const oneHour = { system: [{ type: "text", text: "billing" }, { type: "text", text: "identity", cache_control: { type: "ephemeral", ttl: "1h" } }], messages: [{ role: "user", content: [{ type: "text", text: "hi", cache_control: { type: "ephemeral", ttl: "1h" } }] }] };

test("cache_ttl observer reads 1h, 5m, or none from cache markers", () => {
  assert.equal(observers.cache_ttl(oneHour), "1h");
  assert.equal(observers.cache_ttl({ system: [{ type: "text", text: "x", cache_control: { type: "ephemeral" } }] }), "5m");
  assert.equal(observers.cache_ttl({ system: [{ type: "text", text: "x" }] }), "none");
});

test("cases cover each realizable rung alone, adjacent pairs, and invalid values", () => {
  const d = {
    realize_context: { kind: { main: {}, subagent: null }, auth: { key: {}, subscription: null } },
    context: [{ key: "kind", values: [{ value: "main" }, { value: "subagent" }] }, { key: "auth", values: [{ value: "key" }, { value: "subscription" }] }],
    rungs: [
      { id: "a", input: "toggle", realize: { env: { A: "1" } }, effect: { value: "5m" } },
      { id: "b", input: "choice", accepts: ["5m", "1h"], invalid_example: "2h", realize: { env: { B: "{value}" } }, effect: { from: "input" } },
      { id: "c", input: "choice", accepts: ["5m", "1h"], effect: { from: "input" } }
    ]
  };
  const names = casesFor(d).map(c => c.name);
  assert.ok(names.includes("a alone"));
  assert.ok(names.includes("b=1h alone"));
  assert.ok(names.includes("b=2h (invalid) alone"));
  assert.ok(names.includes("a over b=1h"));
  assert.ok(!names.some(n => n.includes("c")), "c has no realize, so it is never probed");
  const pair = casesFor(d).find(c => c.name === "a over b=1h");
  assert.deepEqual(pair.env, { A: "1", B: "1h" });
  assert.deepEqual(pair.scenario.context, { kind: "main", auth: "key" });
});
