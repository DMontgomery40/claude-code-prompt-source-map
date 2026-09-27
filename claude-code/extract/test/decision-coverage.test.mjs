import assert from "node:assert/strict";
import test from "node:test";
import { coverageStatus } from "../decision-coverage.mjs";

const rungsByKnob = new Map([["env-a", [{ decision: "d1", title: "D1", rung: "r1", rank: 2, of: 5 }]]]);
const candidateKnobs = new Set(["env-b"]);
const s = (knob) => coverageStatus(knob, { rungsByKnob, candidateKnobs });

test("each knob gets exactly one status, rung first", () => {
  assert.equal(s({ id: "env-a", area: "environment-variables", group: "Claude Code and Anthropic", details: { direction: "read" } }).status, "rung");
  assert.equal(s({ id: "setting-x", area: "settings", kind: "setting" }).status, "layered");
  assert.equal(s({ id: "env-t", area: "environment-variables", group: "Read only by bundled third-party libraries", details: { direction: "read" } }).status, "third-party");
  assert.equal(s({ id: "env-o", area: "environment-variables", group: "Shell, terminal, OS and CI environment", details: { direction: "read" } }).status, "os-shell");
  assert.equal(s({ id: "env-s", area: "environment-variables", group: "Set by Claude Code for tools, hooks, and child processes", details: { direction: "set" } }).status, "set-only");
  assert.equal(s({ id: "cli-cmd-x", area: "cli", kind: "cli-command" }).status, "action");
  assert.equal(s({ id: "env-b", area: "environment-variables", group: "Claude Code and Anthropic", details: { direction: "read" } }).status, "pending");
  assert.equal(s({ id: "env-c", area: "environment-variables", group: "Claude Code and Anthropic", details: { direction: "read" } }).status, "standalone");
});

test("a settings key that is also a rung keeps both links", () => {
  const r = coverageStatus({ id: "env-a", area: "settings", kind: "setting" }, { rungsByKnob, candidateKnobs });
  assert.deepEqual([r.status, r.feeds.map(f => f.decision)], ["rung", ["d1", "settings-layers"]]);
});
