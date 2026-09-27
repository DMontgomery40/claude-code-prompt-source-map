import assert from "node:assert/strict";
import test from "node:test";
import { decisionRangeChanged } from "../decision-change.mjs";

// A first-wins decision as the minifier emits it, and the same logic in a later build.
const before = `function Ab(q,z){if(process.env.FORCE_PROMPT_CACHING_5M)return"5m";let K=q.settingsTtl;if(K&&z)return K;return Hq(q)?"1h":"5m"}`;
const changed = (oldText, newText, status = "same") => decisionRangeChanged({ status, oldText, newText });

test("the same function with renamed identifiers only is unchanged", () => {
  assert.equal(changed(before, `function Xy(w,Q){if(process.env.FORCE_PROMPT_CACHING_5M)return"5m";let a=w.settingsTtl;if(a&&Q)return a;return Zk(w)?"1h":"5m"}`), false);
  assert.equal(changed(before, before), false);
});

test("the same literals in a different statement order are a changed decision", () => {
  assert.equal(changed(before, `function Ab(q,z){let K=q.settingsTtl;if(K&&z)return K;if(process.env.FORCE_PROMPT_CACHING_5M)return"5m";return Hq(q)?"1h":"5m"}`), true);
});

test("a function-span range relocation could not find is a changed decision", () => {
  for (const status of ["changed", "missing", "ambiguous", "pending"]) assert.equal(decisionRangeChanged({ status, oldText: before, newText: null }), true, status);
});

test("literal, property, operand-order and operator changes are changes; spelling of a literal is not", () => {
  assert.equal(changed(before, before.replace('return"5m";let', 'return"15m";let')), true);
  assert.equal(changed(before, before.replace("q.settingsTtl", "q.sessionTtl")), true);
  assert.equal(changed(before, before.replace("K&&z", "z&&K")), true);
  assert.equal(changed(before, before.replace("K&&z", "K||z")), true);
  assert.equal(changed(before, before.replace('?"1h":"5m"', "?'1h':'5m'"), "reshaped"), false);
  assert.equal(changed("function(a){return a>1e3}", "function(b){return b>1000}"), false);
});

test("code that no longer tokenizes counts as changed", () => {
  assert.equal(changed(before, `${before.slice(0, -1)}\``, "reshaped"), true);
});
