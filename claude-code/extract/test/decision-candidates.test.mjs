import assert from "node:assert/strict";
import test from "node:test";
import { flagProperty, isFlagRead } from "../decision-candidates.mjs";

test("CLI long flags map to commander's camelCase option names", () => {
  assert.equal(flagProperty("--append-system-prompt <prompt>"), "appendSystemPrompt");
  assert.equal(flagProperty("-p, --print"), "print");
});

test("remote flag reads are told from telemetry events by the call shape", () => {
  const lit = v => ({ type: "Literal", value: v });
  assert.equal(isFlagRead("tengu_x", [lit("tengu_x"), { type: "UnaryExpression" }]), true);
  assert.equal(isFlagRead("tengu_x_config", [lit("tengu_x_config"), { type: "ObjectExpression", properties: [{}] }]), true);
  assert.equal(isFlagRead("tengu_started", [lit("tengu_started"), { type: "ObjectExpression", properties: [{}] }]), false);
  assert.equal(isFlagRead("tengu_started", [lit("tengu_started")]), false);
});
