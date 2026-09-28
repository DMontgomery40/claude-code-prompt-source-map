import assert from "node:assert/strict";
import test from "node:test";
import { embeddedDiff, embeddedFiles, scrubHomes, segmentRange, withoutRange } from "../package-scan.mjs";

test("the __BUN range is cut out of the bytes whose strings are read, with a separator", () => {
  const buf = Buffer.from("NATIVE-AAAA|JAVASCRIPT-SECTION|NATIVE-BBBB");
  const cut = withoutRange(buf, { fileoff: 12, filesize: 18 });
  assert.equal(cut.toString("latin1"), "NATIVE-AAAA|\0|NATIVE-BBBB");
  assert.equal(withoutRange(buf, null), buf);
  // A binary without the segment (a system tool) yields no range.
  assert.equal(segmentRange("/usr/bin/true"), null);
});

test("embedded files: JavaScript left to the other pipelines; addons and resources hashed and diffed", () => {
  const manifest = { files: [
    { name: "/$bunfs/root/cli", length: 1, sha256: "a" },
    { name: "/$bunfs/root/chunk-x.js", length: 2, sha256: "b" },
    { name: "/$bunfs/root/tool.mjs", length: 2, sha256: "b2" },
    { name: "/$bunfs/root/audio-capture.node", length: 3, sha256: "c" },
    { name: "/$bunfs/root/fonts/x.zst", length: 4, sha256: "d" }
  ] };
  const before = embeddedFiles(manifest);
  assert.deepEqual(Object.keys(before), ["/$bunfs/root/audio-capture.node", "/$bunfs/root/cli", "/$bunfs/root/fonts/x.zst"]);
  assert.equal(before["/$bunfs/root/audio-capture.node"].kind, "node-addon");
  assert.deepEqual(embeddedDiff({ embedded: before }, { embedded: before }), []);

  const after = embeddedFiles({ files: [
    ...manifest.files.filter(f => !f.name.endsWith(".zst")).map(f => (f.name.endsWith(".node") ? { ...f, sha256: "c2" } : f)),
    { name: "/$bunfs/root/computer-use-input.node", length: 5, sha256: "e" }
  ] });
  assert.deepEqual(embeddedDiff({ embedded: before }, { embedded: after }).map(d => d.text), [
    "Changed embedded node-addon: /$bunfs/root/audio-capture.node",
    "New embedded node-addon: /$bunfs/root/computer-use-input.node",
    "Removed embedded zst: /$bunfs/root/fonts/x.zst"
  ]);
});

test("build-machine home paths lose the user segment; other paths are untouched", () => {
  const out = scrubHomes({ linked: ["/Users/runner/work/apps/target/lib.dylib", "/usr/lib/libSystem.B.dylib", "/Users/<build user>/already"] });
  assert.deepEqual(out.linked, ["/Users/<build user>/work/apps/target/lib.dylib", "/usr/lib/libSystem.B.dylib", "/Users/<build user>/already"]);
  assert.doesNotMatch(JSON.stringify(out), /\/Users\/[A-Za-z]/);
});
