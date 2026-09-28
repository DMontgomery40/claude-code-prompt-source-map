import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compareVersions, describedVersion, newestTracked } from "../versions.mjs";

const root = new URL("../../", import.meta.url).pathname;

test("compareVersions orders numerically, not as text", () => {
  assert.equal(compareVersions("2.1.284", "2.1.283"), 1);
  assert.equal(compareVersions("2.1.283", "2.1.284"), -1);
  assert.equal(compareVersions("2.1.284", "2.1.284"), 0);
  assert.equal(compareVersions("2.1.1000", "2.1.999"), 1);
  assert.equal(compareVersions("2.2.0", "2.1.999"), 1);
  assert.equal(compareVersions("10.0.0", "9.9.9"), 1);
});

test("compareVersions puts a prerelease before its release", () => {
  assert.equal(compareVersions("2.1.285-beta.1", "2.1.285"), -1);
  assert.equal(compareVersions("2.1.285-beta.1", "2.1.284"), 1);
  assert.equal(compareVersions("2.1.285-beta.2", "2.1.285-beta.10"), -1);
  assert.equal(compareVersions("2.1.285-beta", "2.1.285-beta.1"), -1);
});

test("newestTracked follows next when it is ahead of latest", () => {
  // The 2.1.284 case: next carried the Sonnet 5.5 build while latest was still 2.1.283.
  assert.equal(newestTracked({ stable: "2.1.274", latest: "2.1.283", next: "2.1.284" }), "2.1.284");
  assert.equal(newestTracked({ stable: "2.1.277", latest: "2.1.284", next: "2.1.284" }), "2.1.284");
  // A next tag left behind an older build does not pull the watcher back.
  assert.equal(newestTracked({ latest: "2.1.290", next: "2.1.284" }), "2.1.290");
  // stable is never followed, even if it were somehow newest.
  assert.equal(newestTracked({ stable: "9.0.0", latest: "2.1.284" }), "2.1.284");
  assert.equal(newestTracked({ latest: "2.1.284" }), "2.1.284");
  assert.throws(() => newestTracked({ stable: "2.1.277" }), /none of the dist-tags/);
});

test("describedVersion reads tools.json, then status.json", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "versions-"));
  assert.equal(describedVersion(dir), null);
  mkdirSync(path.join(dir, "outputs"));
  writeFileSync(path.join(dir, "outputs/status.json"), JSON.stringify({ sources: { version: "2.1.283" } }));
  assert.equal(describedVersion(dir), "2.1.283");
  writeFileSync(path.join(dir, "outputs/tools.json"), JSON.stringify({ version: "2.1.284", items: [] }));
  assert.equal(describedVersion(dir), "2.1.284");
});

test("refresh.mjs refuses to move the records back to an older build", () => {
  const before = describedVersion(root);
  const r = spawnSync(process.execPath, [path.join(root, "extract/refresh.mjs"), "0.0.1", "sha512-unused"], { cwd: root, encoding: "utf8", env: { ...process.env, TYPESAFE_API_KEY: "unused" } });
  assert.equal(r.status, 4, r.stderr);
  assert.match(r.stderr, /newer than 0\.0\.1; nothing done/);
  assert.equal(JSON.parse(r.stdout.trim().split("\n").at(-1)).skipped, "older");
  assert.equal(describedVersion(root), before);
});
