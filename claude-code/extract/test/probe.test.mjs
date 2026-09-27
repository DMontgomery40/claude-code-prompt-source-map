import assert from "node:assert/strict";
import test from "node:test";
import { parseProbeArgs } from "../probe.mjs";

test("--draft with no value throws", () => {
  assert.throws(() => parseProbeArgs(["--draft"]), /--draft needs a value/);
});

test('--draft "" throws', () => {
  assert.throws(() => parseProbeArgs(["--draft", ""]), /--draft needs a value/);
});

test("--draft followed by another flag throws instead of swallowing it as the value", () => {
  assert.throws(() => parseProbeArgs(["--draft", "--only", "x"]), /--draft needs a value/);
});

test("--only with no value throws, same as --draft", () => {
  assert.throws(() => parseProbeArgs(["--only"]), /--only needs a value/);
});

test("--draft x.json --only y parses both and leaves binary unset", () => {
  const parsed = parseProbeArgs(["--draft", "x.json", "--only", "y"]);
  assert.deepEqual(parsed, { draft: "x.json", only: "y", binary: null });
});

test("the binary path is never mistaken for --draft's or --only's value", () => {
  const parsed = parseProbeArgs(["--draft", "d.json", "--only", "id", "/path/to/claude"]);
  assert.deepEqual(parsed, { draft: "d.json", only: "id", binary: "/path/to/claude" });
});

test("no flags at all just picks up a bare binary path", () => {
  assert.deepEqual(parseProbeArgs(["/path/to/claude"]), { draft: null, only: null, binary: "/path/to/claude" });
});
