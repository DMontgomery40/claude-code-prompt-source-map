import assert from "node:assert/strict";
import test from "node:test";
import { anchorRange, compile } from "../decision-author.mjs";

const src = 'var a=1;function IEt(e){if(x.FORCE)return 1;return 2}function other(){return IEt(0)}';

test("a function anchor spans the smallest enclosing function", () => {
  const [start, end] = anchorRange(src, { find: "x.FORCE", span: "function" });
  assert.equal(src.slice(start, end), "function IEt(e){if(x.FORCE)return 1;return 2}");
});

test("a text anchor spans exactly the found text", () => {
  const [start, end] = anchorRange(src, { find: "return 2", span: "text" });
  assert.equal(src.slice(start, end), "return 2");
});

test("ambiguous and missing anchors fail loudly", () => {
  assert.throws(() => anchorRange(src, { find: "return", span: "text" }), /occurs 3 times/);
  assert.equal(anchorRange(src, { find: "return", span: "text", occurrence: 2 }).length, 2);
  assert.throws(() => anchorRange(src, { find: "nope", span: "text" }), /not found/);
});

test("compile turns anchors into provenance and fills labels from the knob index", () => {
  // anchors resolve against work/extracted; use the prompt-cache-ttl draft's first rung anchor
  const knobs = new Map([["env-force-prompt-caching-5m", { area: "environment-variables", kind: "env-var", title: "FORCE_PROMPT_CACHING_5M" }]]);
  const draft = { id: "t", title: "T", group: "G", question: "Q", shape: "first-wins", observe: "none",
    anchors: [{ file: "chunk-x9fwahqm.js", find: "reason:\"force_5m_env\"", span: "function" }],
    rungs: [{ id: "r", mechanism: "env", knob: "env-force-prompt-caching-5m", input: "toggle", effect: { value: "5m" }, anchors: [{ file: "chunk-x9fwahqm.js", find: "reason:\"force_5m_env\"" }] }] };
  const r = compile(draft, knobs);
  assert.equal(r.kind, "decision");
  assert.equal(r.rungs[0].label, "FORCE_PROMPT_CACHING_5M");
  assert.equal(r.rungs[0].verified, "read");
  assert.equal(r.provenance[0].file, "chunk-x9fwahqm.js");
  assert.ok(Number.isInteger(r.rungs[0].provenance[0].binary_offset));
  assert.equal(r.rungs[0].anchors, undefined);
  // Spans survive compilation (a missing span is "text"); relocation reads them.
  assert.equal(r.provenance[0].span, "function");
  assert.ok(r.provenance[0].length > r.rungs[0].provenance[0].length);
  assert.equal(r.rungs[0].provenance[0].span, "text");
});
