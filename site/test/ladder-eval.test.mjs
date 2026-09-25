import assert from "node:assert/strict";
import test from "node:test";
import { evaluateLadder, exercisedRungs } from "../src/ladder-eval.mjs";

const ttl = {
  shape: "first-wins",
  bypasses: [{ id: "disable", effect: { value: "none" } }],
  rungs: [
    { id: "force5m", input: "toggle", effect: { value: "5m" } },
    { id: "envTtl", input: "choice", accepts: ["5m", "1h"], effect: { from: "input" } },
    { id: "settingTtl", input: "choice", accepts: ["5m", "1h"], effect: { from: "input" } },
    { id: "frontmatter", input: "choice", accepts: ["5m", "1h"], skip_when: [{ value: ["1h"], auth: ["subscription"], overage: [true] }], effect: { from: "input" } },
    { id: "enable1h", input: "toggle", effect: { value: "1h" } },
    { id: "enable1hBedrock", input: "toggle", applies_when: [{ provider: ["bedrock"] }], effect: { value: "1h" } },
    { id: "notSubscriber", input: null, applies_when: [{ auth: ["key"] }, { overage: [true] }], effect: { value: "5m" } },
    { id: "allowlist", input: null, applies_when: [{ auth: ["subscription"] }], effect: { by_context: [{ when: { kind: ["main"] }, value: "1h" }, { when: {}, value: "5m" }] } }
  ]
};
const base = { kind: "main", auth: "key", provider: "anthropic", overage: false };
const run = (set = {}, context = {}, bypass = {}) => evaluateLadder(ttl, { context: { ...base, ...context }, set, bypass });

test("first-wins ladder matches the spike's captured outcomes", () => {
  assert.equal(run().value, "5m");
  assert.equal(run({ enable1h: true }).value, "1h");
  assert.equal(run({ settingTtl: "1h" }).value, "1h");
  assert.equal(run({ envTtl: "5m", enable1h: true }).rung, "envTtl");
  assert.equal(run({ force5m: true, envTtl: "1h" }).value, "5m");
  assert.equal(run({ envTtl: "1h", settingTtl: "5m" }).value, "1h");
  assert.equal(run({ settingTtl: "5m", enable1h: true }).value, "5m");
  const invalid = run({ envTtl: "2h", enable1h: true });
  assert.deepEqual([invalid.value, invalid.rung, invalid.skipped], ["1h", "enable1h", ["envTtl"]]);
  assert.deepEqual(run({ enable1h: true }, {}, { disable: true }), { value: "none", rung: null, contributors: [], skipped: [], bypassedBy: "disable" });
});

test("context decides automatic rungs, rung scope, and conditional skips", () => {
  assert.equal(run({}, { auth: "subscription" }).value, "1h");
  assert.equal(run({}, { auth: "subscription", kind: "subagent" }).value, "5m");
  assert.equal(run({}, { auth: "subscription", overage: true }).rung, "notSubscriber");
  const skipped = run({ frontmatter: "1h" }, { auth: "subscription", overage: true });
  assert.deepEqual([skipped.rung, skipped.skipped], ["notSubscriber", ["frontmatter"]]);
  assert.equal(run({ enable1hBedrock: true }).value, "5m");
  assert.equal(run({ enable1hBedrock: true }, { provider: "bedrock" }).value, "1h");
});

test("merge ladders combine every set rung and constraints narrow or replace", () => {
  const rules = {
    shape: "merge",
    rungs: [
      { id: "managed", input: "choice", effect: { from: "input" } },
      { id: "project", input: "choice", effect: { from: "input" } },
      { id: "user", input: "choice", effect: { from: "input" } }
    ],
    constraints: [{ id: "managedOnly", keep_rungs: ["managed"] }, { id: "lock", effect: { value: ["Read"] } }]
  };
  const r = evaluateLadder(rules, { set: { managed: ["Bash(git *)"], user: ["Edit", "Bash(git *)"] } });
  assert.deepEqual([r.value, r.contributors], [["Bash(git *)", "Edit"], ["managed", "user"]]);
  assert.deepEqual(evaluateLadder(rules, { set: { managed: ["A"], user: ["B"] }, constraints: { managedOnly: true } }).value, ["A"]);
  assert.deepEqual(evaluateLadder(rules, { set: { user: ["B"] }, constraints: { lock: true } }).value, ["Read"]);
});

test("layered ladders merge by value type", () => {
  const layers = { shape: "layered", merge_when: [{ type: ["array"] }], rungs: [
    { id: "policy", input: "choice", effect: { from: "input" } },
    { id: "user", input: "choice", effect: { from: "input" } }
  ] };
  assert.equal(evaluateLadder(layers, { context: { type: "scalar" }, set: { policy: "a", user: "b" } }).value, "a");
  assert.deepEqual(evaluateLadder(layers, { context: { type: "array" }, set: { policy: ["a"], user: ["b"] } }).value, ["a", "b"]);
});

test("exercisedRungs names exactly the rungs a case distinguishes", () => {
  // The winner is exercised; the overridden rung is not (its own effect is tested alone).
  const scenario = { context: base, set: { envTtl: "5m", enable1h: true } };
  assert.deepEqual(exercisedRungs(ttl, scenario), ["envTtl"]);
  assert.deepEqual(exercisedRungs(ttl, { context: base, set: { envTtl: "2h", enable1h: true } }), ["enable1h"]);
});

test("by_context answers can depend on the rung's own value", () => {
  const d = { shape: "first-wins", rungs: [{ id: "skip", input: "toggle", effect: { by_context: [{ when: { value: [true], session: ["background"], consented: [false] }, value: "default" }, { when: {}, value: "bypassPermissions" }] } }] };
  assert.equal(evaluateLadder(d, { context: { session: "background", consented: false }, set: { skip: true } }).value, "default");
  assert.equal(evaluateLadder(d, { context: { session: "interactive", consented: false }, set: { skip: true } }).value, "bypassPermissions");
});

test("conditions can read another rung's value", () => {
  const d = { shape: "first-wins", rungs: [
    { id: "frontmatter", input: "choice", accepts: ["plan", "bypassPermissions"], skip_when: [{ value: ["bypassPermissions"], "rung.inherit": ["plan"] }], effect: { from: "input" } },
    { id: "inherit", input: "choice", accepts: ["plan", "default"], effect: { from: "input" } }
  ] };
  const widen = evaluateLadder(d, { set: { frontmatter: "bypassPermissions", inherit: "plan" } });
  assert.deepEqual([widen.value, widen.skipped], ["plan", ["frontmatter"]]);
  assert.equal(evaluateLadder(d, { set: { frontmatter: "bypassPermissions" } }).value, "bypassPermissions");
});

test("value vetoes skip a vetoed answer and let the next rung answer", () => {
  const d = { shape: "first-wins", constraints: [{ id: "noBypass", skip_values: ["bypassPermissions"] }], rungs: [
    { id: "cli", input: "choice", accepts: ["bypassPermissions", "plan"], effect: { from: "input" } },
    { id: "settings", input: "choice", accepts: ["acceptEdits"], effect: { from: "input" } }
  ], fallback: { value: "default" } };
  const vetoed = evaluateLadder(d, { set: { cli: "bypassPermissions", settings: "acceptEdits" }, constraints: { noBypass: true } });
  assert.deepEqual([vetoed.value, vetoed.rung, vetoed.skipped], ["acceptEdits", "settings", ["cli"]]);
  assert.equal(evaluateLadder(d, { set: { cli: "bypassPermissions" } }).value, "bypassPermissions");
  assert.equal(evaluateLadder(d, { set: { cli: "bypassPermissions" }, constraints: { noBypass: true } }).value, "default");
});

test("numeric caps lower a result only when it is above the cap", () => {
  const d = { shape: "first-wins", constraints: [{ id: "limit", cap: { by_context: [{ when: { model: ["opus"] }, value: 128000 }, { when: {}, value: 64000 }] } }],
    rungs: [{ id: "env", input: "choice", accepts: [8000, 200000], effect: { from: "input" } }] };
  const high = evaluateLadder(d, { context: { model: "sonnet" }, set: { env: 200000 }, constraints: { limit: true } });
  assert.deepEqual([high.value, high.constrainedBy], [64000, "limit"]);
  const low = evaluateLadder(d, { context: { model: "sonnet" }, set: { env: 8000 }, constraints: { limit: true } });
  assert.deepEqual([low.value, low.constrainedBy], [8000, undefined]);
});

test("numeric caps compare string-typed values as numbers and leave non-numbers alone", () => {
  const d = { shape: "first-wins", constraints: [{ id: "limit", cap: { value: "128000" } }],
    rungs: [{ id: "env", input: "choice", effect: { from: "input" } }] };
  const capped = v => evaluateLadder(d, { set: { env: v }, constraints: { limit: true } });
  assert.deepEqual([capped("8000").value, capped("8000").constrainedBy], ["8000", undefined]);
  assert.deepEqual([capped("200000").value, capped("200000").constrainedBy], ["128000", "limit"]);
  assert.equal(capped("remote").value, "remote");
});
