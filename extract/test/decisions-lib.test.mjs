import assert from "node:assert/strict";
import test from "node:test";
import { isDerived, validateDecision } from "../decisions-lib.mjs";

const prov = { file: "chunk-a.js", binary_offset: 10, length: 5, sha256: "a".repeat(64), version: "9.9.9", platform: "darwin-arm64" };
const good = {
  id: "prompt-cache-ttl", title: "Prompt cache TTL", group: "Prompt caching", kind: "decision", question: "How long a cached prefix lives",
  shape: "first-wins", context: [{ key: "kind", label: "Request", values: [{ value: "main", label: "Main conversation" }] }],
  rungs: [{ id: "force5m", mechanism: "env", knob: "env-force-prompt-caching-5m", label: "FORCE_PROMPT_CACHING_5M", input: "toggle", effect: { value: "5m" }, verified: "read", provenance: [prov], realize: { env: { FORCE_PROMPT_CACHING_5M: "1" } } }],
  observe: "cache_ttl", provenance: [{ ...prov, span: "function" }], text: null, documented: null, details: {}
};

test("derived files are recognized by name", () => {
  for (const f of ["environment-variables-tags.json", "decisions-index.json", "capture-summary.json"]) assert.equal(isDerived(f), true);
  for (const f of ["decisions.json", "settings.json"]) assert.equal(isDerived(f), false);
});

test("a complete decision validates", () => {
  assert.deepEqual(validateDecision(good, new Set(["env-force-prompt-caching-5m"])), []);
});

test("a decision without a function-span anchor of its own does not validate", () => {
  const textOnly = structuredClone(good);
  textOnly.provenance = [{ ...prov, span: "text" }];
  textOnly.rungs[0].provenance = [{ ...prov, span: "function" }];
  assert.ok(validateDecision(textOnly, new Set(["env-force-prompt-caching-5m"])).some(e => e.includes('span "function"')));
});

test("validation names every broken field", () => {
  const bad = structuredClone(good);
  bad.shape = "vote";
  bad.rungs.push({ ...bad.rungs[0] });
  bad.rungs[0].knob = "env-nope";
  bad.rungs[0].mechanism = "magic";
  delete bad.rungs[0].provenance;
  const errors = validateDecision(bad, new Set(["env-force-prompt-caching-5m"]));
  for (const needle of ["shape", "duplicate rung id force5m", "unknown knob env-nope", "mechanism magic", "force5m has no provenance"]) {
    assert.ok(errors.some(e => e.includes(needle)), `missing error: ${needle}\n${errors.join("\n")}`);
  }
});
