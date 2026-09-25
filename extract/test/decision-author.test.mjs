import assert from "node:assert/strict";
import test from "node:test";
import { anchorRange } from "../decision-author.mjs";

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
