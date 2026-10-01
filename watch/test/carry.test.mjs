import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { bringBack, carried, setAside } from "../lib/carry.mjs";
import { appendChangelog } from "../lib/publish.mjs";

function repo() {
  const root = mkdtempSync(path.join(os.tmpdir(), "carry-"));
  const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" });
  git("init", "-q");
  mkdirSync(path.join(root, "claude-code/outputs"), { recursive: true });
  writeFileSync(path.join(root, "claude-code/outputs/tools.json"), '{"version":"2.1.284"}\n');
  writeFileSync(path.join(root, "claude-code/outputs/old.md"), "old\n");
  git("add", "-A");
  git("-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "base");
  // Like the watcher's restore: tracked files back to their committed content, new files removed.
  const restore = paths => {
    const tracked = new Set(git("ls-files", "--", ...paths).split("\n").filter(Boolean));
    for (const file of tracked) writeFileSync(path.join(root, file), git("show", `HEAD:${file}`));
    for (const file of paths.filter(p => !tracked.has(p))) rmSync(path.join(root, file), { force: true });
  };
  return { root, git, restore };
}

test("carried files leave the tree clean and come back, deletions included, for the target's next refresh", () => {
  const { root, git, restore } = repo();
  writeFileSync(path.join(root, "claude-code/outputs/tools.json"), '{"version":"2.1.287"}\n');
  writeFileSync(path.join(root, "claude-code/outputs/new.md"), "new\n");
  rmSync(path.join(root, "claude-code/outputs/old.md"));
  const left = ["claude-code/outputs/new.md", "claude-code/outputs/old.md", "claude-code/outputs/tools.json"];
  assert.deepEqual(setAside(root, "cc", left, restore), left);
  assert.equal(git("status", "--porcelain", "--", "claude-code"), "");
  assert.equal(carried(root, "cc"), true);
  assert.deepEqual(bringBack(root, "cc"), left);
  assert.equal(readFileSync(path.join(root, "claude-code/outputs/tools.json"), "utf8"), '{"version":"2.1.287"}\n');
  assert.equal(readFileSync(path.join(root, "claude-code/outputs/new.md"), "utf8"), "new\n");
  assert.equal(existsSync(path.join(root, "claude-code/outputs/old.md")), false);
  assert.equal(carried(root, "cc"), false);
  assert.deepEqual(bringBack(root, "cc"), []);
});

test("a second unpublished attempt adds to what is carried; the newest copy wins", () => {
  const { root, restore } = repo();
  writeFileSync(path.join(root, "claude-code/outputs/tools.json"), '{"version":"2.1.287","n":1}\n');
  setAside(root, "cc", ["claude-code/outputs/tools.json"], restore);
  writeFileSync(path.join(root, "claude-code/outputs/tools.json"), '{"version":"2.1.287","n":2}\n');
  writeFileSync(path.join(root, "claude-code/outputs/x.md"), "x\n");
  setAside(root, "cc", ["claude-code/outputs/tools.json", "claude-code/outputs/x.md"], restore);
  assert.deepEqual(bringBack(root, "cc"), ["claude-code/outputs/tools.json", "claude-code/outputs/x.md"]);
  assert.match(readFileSync(path.join(root, "claude-code/outputs/tools.json"), "utf8"), /"n":2/);
});

test("a retried release replaces its own changelog entry instead of adding another", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "changelog-"));
  writeFileSync(path.join(dir, "CHANGELOG.md"), "# Changelog\n\n## 2026-09-30 · Claude Code 2.1.284\n\nolder\n");
  appendChangelog(dir, "Claude Code 2.1.287", "first attempt");
  appendChangelog(dir, "Claude Code 2.1.287", "second attempt");
  const text = readFileSync(path.join(dir, "CHANGELOG.md"), "utf8");
  assert.equal(text.match(/Claude Code 2\.1\.287/g).length, 1);
  assert.match(text, /second attempt/);
  assert.doesNotMatch(text, /first attempt/);
  assert.match(text, /## 2026-09-30 · Claude Code 2\.1\.284\n\nolder/);
  appendChangelog(dir, "Claude Code 2.1.288", "next");
  assert.match(readFileSync(path.join(dir, "CHANGELOG.md"), "utf8"), /2\.1\.288[\s\S]*2\.1\.287[\s\S]*2\.1\.284/);
});
