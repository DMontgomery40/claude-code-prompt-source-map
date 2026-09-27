#!/usr/bin/env node
// Cheap hourly check: prints one JSON line identifying the installed inputs,
// {"app_build", "cli_sha256", "catalog_sha256", "asar_size", "asar_mtime"}.
// When it matches the previous run's line, refresh.mjs has nothing new to read.
//
// catalog_sha256 hashes `codex debug models` with fetch/account keys removed at
// every depth and object keys sorted (see canonicalCatalog in lib/catalog.mjs).
// app.asar is only stat'ed, never read, to stay well under two seconds.
//
// Exit: 0 success; 2 the app, CLI or catalog can't be found; 1 anything else.

import crypto from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { codexApp } from "./lib/app-layout.mjs";
import { canonicalCatalog, SourceError } from "./lib/catalog.mjs";

function fingerprint() {
  const app = codexApp();
  const appBuild = execFileSync("/usr/libexec/PlistBuddy", ["-c", "Print CFBundleVersion", app.plist], { encoding: "utf8" }).trim();
  const cliSha256 = crypto.createHash("sha256").update(fs.readFileSync(app.binary)).digest("hex");

  const result = spawnSync(app.entrypoint, ["debug", "models"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 60_000 });
  if (result.error || result.status !== 0) {
    throw new SourceError(`codex debug models failed: ${result.error?.message ?? result.stderr.trim().slice(0, 500)}`);
  }
  let catalog;
  try {
    catalog = JSON.parse(result.stdout);
  } catch (error) {
    throw new SourceError(`codex debug models did not return JSON: ${error.message}`);
  }

  const asar = fs.statSync(app.asar);
  return {
    app_build: appBuild,
    cli_sha256: cliSha256,
    catalog_sha256: crypto.createHash("sha256").update(canonicalCatalog(catalog)).digest("hex"),
    asar_size: asar.size,
    asar_mtime: asar.mtime.toISOString()
  };
}

try {
  console.log(JSON.stringify(fingerprint()));
} catch (error) {
  console.error(`fingerprint failed: ${error.message}`);
  process.exit(error instanceof SourceError ? 2 : 1);
}
