import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import { bunSection, embeddedLocator } from "../binwalk-scan.mjs";

const script = path.join(import.meta.dirname, "..", "binwalk-scan.mjs");
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "cc-binwalk-"));

// A stand-in for binwalk 3 that reports the file_map kept in <file>.map.json.
function fakeBinwalk(dir) {
  const bin = path.join(dir, "fake-binwalk.cjs");
  fs.writeFileSync(bin, `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args[0] === "--version") { console.log("binwalk 3.1.0"); process.exit(0); }
const json = args[args.indexOf("-l") + 1], file = args.at(-1);
let map = [];
try { map = JSON.parse(fs.readFileSync(file + ".map.json", "utf8")); } catch {}
fs.writeFileSync(json, JSON.stringify([{ Analysis: { file_path: file, file_map: map } }]));
`);
  fs.chmodSync(bin, 0o755);
  return bin;
}

// A Mach-O 64 header with one LC_SEGMENT_64 "__BUN" holding section "__bun" at bunOffset.
function machO(total, bunOffset, bunSize) {
  const buf = Buffer.alloc(total, 0x41);
  buf.fill(0, 0, 32 + 72 + 80);
  buf.writeUInt32LE(0xfeedfacf, 0);
  buf.writeUInt32LE(1, 16);
  const seg = 32;
  buf.writeUInt32LE(0x19, seg);
  buf.writeUInt32LE(72 + 80, seg + 4);
  buf.write("__BUN", seg + 8, "latin1");
  buf.writeUInt32LE(1, seg + 64);
  const sect = seg + 72;
  buf.write("__bun", sect, "latin1");
  buf.write("__BUN", sect + 16, "latin1");
  buf.writeBigUInt64LE(BigInt(bunSize), sect + 40);
  buf.writeUInt32LE(bunOffset, sect + 48);
  return buf;
}

// A release layout: work/current.json, work/releases/<v>/package/claude with a gzip frame inside
// __BUN (in an embedded file) and one outside it, and bun-extract's manifest.
function release(root) {
  const version = "9.9.9";
  const dir = path.join(root, "work", "releases", version);
  fs.mkdirSync(path.join(dir, "package"), { recursive: true });
  fs.writeFileSync(path.join(root, "work", "current.json"), JSON.stringify({ version }));
  const inside = zlib.gzipSync(Buffer.from("embedded skill text ".repeat(300)));
  const outside = zlib.gzipSync(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7].map(x => x * 31)).toString("latin1").repeat(200));
  const bin = machO(8192, 4096, 3000);
  inside.copy(bin, 5000);
  outside.copy(bin, 1000);
  const file = path.join(dir, "package", "claude");
  fs.writeFileSync(file, bin);
  fs.writeFileSync(`${file}.map.json`, JSON.stringify([
    { offset: 1000, size: outside.length, name: "gzip", description: "gzip compressed data" },
    { offset: 5000, size: inside.length, name: "gzip", description: "gzip compressed data" }
  ]));
  fs.writeFileSync(path.join(dir, "embedded-manifest.json"), JSON.stringify({ files: [{ name: "/$bunfs/root/SKILL-x.md.zst", file_offset: 4900, length: 600 }] }));
  return { file, version };
}

test("__BUN section and embedded-file lookup", () => {
  assert.deepEqual(bunSection(machO(1024, 512, 100)), { offset: 512, size: 100 });
  assert.equal(bunSection(Buffer.from("not a mach-o at all, just bytes")), null);
  const locate = embeddedLocator({ files: [{ name: "b", file_offset: 200, length: 50 }, { name: "a", file_offset: 100, length: 50 }] });
  assert.equal(locate(120), "a");
  assert.equal(locate(249), "b");
  assert.equal(locate(160), null);
});

test("CLI: payloads placed inside or outside __BUN, page and JSON written; exit 2 without a binary; exit 3 without binwalk", () => {
  const root = tmp();
  const none = spawnSync(process.execPath, [script], { env: { ...process.env, BINWALK_SCAN_ROOT: root }, encoding: "utf8" });
  assert.equal(none.status, 2, none.stderr);

  const { version } = release(root);
  const missing = spawnSync(process.execPath, [script], { env: { ...process.env, BINWALK_SCAN_ROOT: root, BINWALK_BIN: path.join(root, "nope") }, encoding: "utf8" });
  assert.equal(missing.status, 3, missing.stderr);
  assert.match(missing.stderr, /binwalk is not available/);

  const ok = spawnSync(process.execPath, [script], { env: { ...process.env, BINWALK_SCAN_ROOT: root, BINWALK_BIN: fakeBinwalk(root) }, encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stderr);
  const summary = JSON.parse(ok.stdout.trim().split("\n").at(-1));
  assert.equal(summary.findings, 2);
  assert.equal(summary.version, version);
  const scan = JSON.parse(fs.readFileSync(path.join(root, "outputs", "binwalk-scan.json"), "utf8"));
  const [out, inn] = scan.targets[0].payloads;
  assert.equal(out.in_bun_section, false);
  assert.equal(inn.in_bun_section, true);
  assert.equal(inn.inside, "/$bunfs/root/SKILL-x.md.zst");
  assert.equal(inn.decoded.kind, "text");
  const md = fs.readFileSync(path.join(root, "outputs", "binwalk-scan.md"), "utf8");
  assert.match(md, /__BUN: `\/\$bunfs\/root\/SKILL-x\.md\.zst`/);
  assert.match(md, /outside __BUN/);
  assert.doesNotMatch(md, new RegExp(os.tmpdir().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  // Unchanged input: served from the cache.
  const again = spawnSync(process.execPath, [script], { env: { ...process.env, BINWALK_SCAN_ROOT: root, BINWALK_BIN: fakeBinwalk(root) }, encoding: "utf8" });
  assert.equal(JSON.parse(again.stdout.trim().split("\n").at(-1)).cached, true);
});
