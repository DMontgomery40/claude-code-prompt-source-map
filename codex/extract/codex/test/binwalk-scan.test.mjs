import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import {
  BinwalkError, NOISE, catalogSummary, clean, diffScans, identify, parseBinwalkJson, renderDiff, scanFile, signatureScan, svgImages
} from "../binwalk-scan.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "binwalk-scan-"));

// A stand-in for binwalk 3: `--version`, and `-x svg -l <json> <file>` writes the file_map kept
// in <file>.map.json, in binwalk's own JSON shape.
function fakeBinwalk(dir) {
  const bin = path.join(dir, "fake-binwalk.cjs");
  fs.writeFileSync(bin, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "--version") { console.log("binwalk 3.1.0"); process.exit(0); }
const json = args[args.indexOf("-l") + 1], file = args.at(-1);
let map = [];
try { map = JSON.parse(fs.readFileSync(file + ".map.json", "utf8")); } catch {}
fs.writeFileSync(json, JSON.stringify([{ Analysis: { file_path: file, file_map: map.map((m, i) => ({ id: String(i), confidence: 250, ...m })) } }]));
`);
  fs.chmodSync(bin, 0o755);
  return bin;
}

// A synthetic binary: filler, a gzip frame, filler, a PNG, filler, an SVG.
function fixture(dir, { gzipText = "hello protocol ".repeat(400), pngWidth = 2 } = {}) {
  const gz = zlib.gzipSync(Buffer.from(gzipText));
  const png = Buffer.concat([Buffer.from("\x89PNG\r\n\x1a\n", "latin1"), Buffer.from([0, 0, 0, 13]), Buffer.from("IHDR"), Buffer.alloc(4), Buffer.alloc(4), Buffer.alloc(9)]);
  png.writeUInt32BE(pngWidth, 16); png.writeUInt32BE(1, 20);
  const svg = Buffer.from('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>');
  const filler = n => Buffer.alloc(n, 0x41);
  const parts = [filler(100), gz, filler(50), png, filler(30), svg, filler(20)];
  const buf = Buffer.concat(parts);
  const file = path.join(dir, "app-binary");
  fs.writeFileSync(file, buf);
  const gzAt = 100, pngAt = 100 + gz.length + 50;
  fs.writeFileSync(`${file}.map.json`, JSON.stringify([
    { offset: gzAt, size: gz.length, name: "gzip", description: "gzip compressed data, from maintainer <someone@example.com>" },
    { offset: pngAt, size: png.length, name: "png", description: `PNG image, total size: ${png.length} bytes` }
  ]));
  return file;
}

test("binwalk's JSON: one array per file, and the malformed concatenation -M writes", () => {
  const a = { Analysis: { file_path: "a", file_map: [{ offset: 1, name: "zstd", description: 'brace } and "quote" in a string' }] } };
  const b = { Analysis: { file_path: "a.extracted/x", file_map: [] } };
  assert.deepEqual(parseBinwalkJson(`[\n${JSON.stringify(a)}\n],\n${JSON.stringify(b)}\n],`).map(x => x.file_path), ["a", "a.extracted/x"]);
});

test("payloads are identified by their own structure", () => {
  const zip = Buffer.concat([Buffer.from("PK\x03\x04", "latin1"), Buffer.alloc(26)]);
  assert.equal(identify(zip).kind, "zip archive");
  assert.equal(identify(Buffer.from([0x28, 0xb5, 0x2f, 0xfd, 0, 0])).kind, "zstd frame");
  assert.equal(identify(zlib.gzipSync(Buffer.from("x"))).kind, "gzip");
  assert.equal(identify(Buffer.from("\0asm\x01\0\0\0", "latin1")).kind, "wasm module");
  assert.equal(identify(Buffer.from("SQLite format 3\0" + "x".repeat(80), "latin1")).kind, "SQLite database");
  assert.equal(identify(Buffer.from("-----BEGIN PUBLIC KEY-----\nAAAA\n-----END PUBLIC KEY-----\n")).kind, "PEM public key");
  assert.equal(identify(Buffer.from([0xcf, 0xfa, 0xed, 0xfe, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0])).detail.filetype, "dylib");
  assert.equal(identify(Buffer.from('{"typescript":{},"json_schema":{}}')).kind, "JSON object");
  assert.equal(identify(Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05])).kind, "unidentified binary");
  assert.equal(clean("Copyright (c) Jane <jane@example.org> /Users/someone/x"), "Copyright (c) Jane <<e-mail>> <path>");
});

test("a protocol catalog matches generate-ts file for file", () => {
  const json = { typescript: { "ClientRequest.ts": 'type R = { "method": "thread/start" } | { "method": "turn/start" };', "v2/A.ts": "a" }, json_schema: { "A.json": {} } };
  const s = catalogSummary(json, { standard: new Map([["ClientRequest.ts", json.typescript["ClientRequest.ts"]], ["v2/A.ts", "a"]]), experimental: new Map([["v2/A.ts", "a"], ["v2/B.ts", "b"]]) });
  assert.equal(s.binding_set, "standard");
  assert.deepEqual(s.generate_ts.experimental, { matched: 1, container: 2, generated: 2 });
  assert.deepEqual(s.client_methods, ["thread/start", "turn/start"]);
});

test("scanFile carves, hashes, decodes and identifies each payload; SVGs by the bounded search", () => {
  const dir = tmp();
  process.env.BINWALK_BIN = fakeBinwalk(dir);
  try {
    const file = fixture(dir);
    const result = scanFile(file, { workDir: path.join(dir, "work") });
    assert.deepEqual(result.signature_counts, { gzip: 1, png: 1, svg: 1 });
    const gz = result.payloads.find(p => p.signature === "gzip");
    assert.equal(gz.offset_hex, "0x64");
    assert.equal(gz.identified, "gzip");
    assert.equal(gz.decoded.kind, "text");
    assert.equal(gz.decoded.size, "hello protocol ".length * 400);
    assert.match(gz.description, /<e-mail>/);
    assert.ok(NOISE.has("png") && !result.payloads.find(p => p.signature === "png").decoded);
    assert.equal(svgImages(fs.readFileSync(file)).length, 1);
  } finally {
    delete process.env.BINWALK_BIN;
  }
});

test("diff: unchanged is quiet; new, removed and changed payloads and protocol methods are listed", () => {
  const dir = tmp();
  process.env.BINWALK_BIN = fakeBinwalk(dir);
  try {
    const scanOf = (file, methods) => ({ targets: [{ path: "bin", present: true, ...scanFile(file, { workDir: path.join(dir, "work") }) }], methods });
    const a = scanOf(fixture(path.join(dir), {}), { experimental_only: ["thread/start"] });
    const same = scanOf(fixture(path.join(dir), {}), { experimental_only: ["thread/start"] });
    assert.deepEqual(diffScans(a, same), { targets: [], methods: {} });
    assert.equal(renderDiff("x", diffScans(a, same)), "");
    const b = scanOf(fixture(path.join(dir), { gzipText: "changed payload ".repeat(300), pngWidth: 3 }), { experimental_only: ["thread/start", "thread/secret"] });
    const diff = diffScans(a, b);
    assert.equal(diff.targets[0].changed.length, 2);
    assert.deepEqual(diff.methods.experimental_only, { added: ["thread/secret"], removed: [] });
    assert.match(renderDiff("Binwalk", diff), /Changed payloads \(2\)[\s\S]*Added: `thread\/secret`/);
    const gone = { targets: [{ path: "bin", present: false }], methods: {} };
    assert.equal(diffScans(a, gone).targets[0].note, "no longer in the build");
  } finally {
    delete process.env.BINWALK_BIN;
  }
});

test("binwalk missing or failing is a BinwalkError (the CLI exits 3)", () => {
  const dir = tmp();
  process.env.BINWALK_BIN = path.join(dir, "no-binwalk-here");
  try {
    assert.throws(() => signatureScan(fixture(dir), path.join(dir, "x.json")), BinwalkError);
  } finally {
    delete process.env.BINWALK_BIN;
  }
});
