#!/usr/bin/env node
// Regenerates the live Codex/GPT-6 documents in outputs/ from the installed
// ChatGPT desktop app (app.asar) and its bundled Codex CLI (model catalog),
// then writes a semantic diff to work/codex-diff.md (empty when nothing
// changed semantically).
//
// All-or-nothing: every document is built, checked and privacy-scanned in
// memory first. Any failure exits non-zero with outputs/ untouched.
//
// Usage: node extract/codex/refresh.mjs
// Env:   CODEX_APP_PATH (default /Applications/ChatGPT.app), CODEX_HOME.
// Exit:  0 success; 2 an anchor or source can't be found (reason on stderr);
//        1 any other failure.
// Stdout: the last line is one JSON object:
//        {"changed": ["outputs/…"], "unchanged_count": N, "sources": {…}}

import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { codexApp } from "./lib/app-layout.mjs";
import { AnchorError, extractAppPrompts } from "./lib/app-prompts.mjs";
import { openAsar } from "./lib/asar.mjs";
import { CatalogError, loadCatalog, SourceError } from "./lib/catalog.mjs";
import { metadataDiff } from "./lib/catalog-metadata.mjs";
import { buildDocuments, OUTPUT_NAMES, OUTPUT_WHITELIST } from "./lib/documents.mjs";
import { PrivacyError, privacyScan } from "./lib/privacy.mjs";
import { renderDiffMarkdown, semanticDiff } from "./lib/semantic-diff.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const outputsDir = path.join(root, "outputs");
const workDir = path.join(root, "work");
let layout; // codexApp(), resolved in main() so a changed layout is reported as a source error

const fileSha256 = file => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

function plistValue(key) {
  return execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print ${key}`, layout.plist], { encoding: "utf8" }).trim();
}

function snapshotInstall() {
  return {
    version: plistValue("CFBundleShortVersionString"),
    build: plistValue("CFBundleVersion"),
    bundleId: plistValue("CFBundleIdentifier"),
    asarSha256: fileSha256(layout.asar),
    binarySha256: fileSha256(layout.binary)
  };
}

// Third-party dependency prompt files shipped beside the app (not Codex's own).
function dependencyPrompts() {
  const resources = layout.resources;
  const found = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.isSymbolicLink()) walk(full);
      else if (entry.name.endsWith(".prompt.md")) found.push(path.relative(resources, full).split(path.sep).join("/"));
    }
  };
  const cua = path.join(resources, "cua_node");
  if (fs.existsSync(cua)) walk(cua);
  return found.sort();
}

function readPrevious() {
  const previous = new Map();
  for (const name of OUTPUT_WHITELIST) {
    const file = path.join(outputsDir, name);
    if (fs.existsSync(file)) previous.set(name, fs.readFileSync(file, "utf8"));
  }
  return previous;
}

function writeAtomically(file, content) {
  const temp = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}`);
  fs.writeFileSync(temp, content);
  fs.renameSync(temp, file);
}

function main() {
  layout = codexApp();
  const before = snapshotInstall();
  const cliVersion = execFileSync(layout.entrypoint, ["--version"], { encoding: "utf8" }).trim();

  const catalog = loadCatalog(layout.entrypoint);
  const asar = openAsar(layout.asar);
  if (asar.sha256 !== before.asarSha256) throw new CatalogError("app.asar changed while it was being read (app update in progress?); retry later");
  const prompts = extractAppPrompts(asar);

  const app = { ...before, dependencyPrompts: dependencyPrompts() };
  const docs = buildDocuments({ app, cli: { version: cliVersion, sha256: before.binarySha256, entrypoint: layout.shown.entrypoint, binary: layout.shown.binary }, catalog, prompts });
  privacyScan(docs, catalog);

  const after = snapshotInstall();
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) throw new CatalogError(`the app changed during the refresh (${key}); retry later`);
  }

  // Catalog settings: compared with the snapshot of the last published (or quietly absorbed)
  // run. The watcher promotes catalog-snapshot.next.json to the baseline, never a dry run.
  const snapshot = catalog.liveSettings;
  const snapshotFile = path.join(workDir, "catalog-snapshot.json");
  const baseline = fs.existsSync(snapshotFile) ? JSON.parse(fs.readFileSync(snapshotFile, "utf8")) : null;
  const settings = baseline ? metadataDiff(baseline, snapshot) : { public: [], private: [] };

  const previous = readPrevious();
  const previousSources = previous.has(OUTPUT_NAMES.sources) ? JSON.parse(previous.get(OUTPUT_NAMES.sources)) : null;
  const sources = JSON.parse(docs.get(OUTPUT_NAMES.sources));
  const documents = semanticDiff(previous, docs);

  const notes = [];
  const gpt6 = catalog.live.filter(model => model.slug.startsWith("gpt-6"));
  const persistentVariants = new Set(gpt6.map(model => model.model_messages?.persistent_instructions));
  if (persistentVariants.size > 1) notes.push(`persistent_instructions differ between GPT-6 models; ${OUTPUT_NAMES.persistent} shows gpt-6-astra's (see ${OUTPUT_NAMES.comparison})`);
  const undocumented = gpt6.filter(model => !["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"].includes(model.slug));
  if (undocumented.length) notes.push(`GPT-6 models without dedicated documents (included in ${OUTPUT_NAMES.otherModels}): ${undocumented.map(model => `\`${model.slug}\``).join(", ")}`);

  const slugsChanged = previousSources != null &&
    JSON.stringify(previousSources.catalog?.models ?? []) !== JSON.stringify(sources.catalog.models);
  const changed = documents.filter(doc => doc.status !== "unchanged").map(doc => `outputs/${doc.name}`);
  if (slugsChanged) changed.push(`outputs/${OUTPUT_NAMES.sources}`);

  writing = true;
  fs.mkdirSync(outputsDir, { recursive: true });
  for (const [name, content] of docs) {
    if (name === OUTPUT_NAMES.sources) continue;
    if (previous.get(name) !== content) writeAtomically(path.join(outputsDir, name), content);
  }
  writeAtomically(path.join(outputsDir, OUTPUT_NAMES.sources), docs.get(OUTPUT_NAMES.sources));

  fs.mkdirSync(workDir, { recursive: true });
  writeAtomically(path.join(workDir, "codex-diff.md"), renderDiffMarkdown({ previousSources, sources, documents, notes, settings: settings.public }));
  writeAtomically(path.join(workDir, "catalog-snapshot.next.json"), `${JSON.stringify(snapshot, null, 1)}\n`);

  for (const doc of documents) {
    const provenance = doc.status === "unchanged" && doc.bytesChanged ? " (provenance only)" : "";
    console.log(`${doc.status.padEnd(9)} ${doc.name}${provenance}`);
  }
  console.log(JSON.stringify({
    changed,
    unchanged_count: documents.filter(doc => doc.status === "unchanged").length,
    catalog_settings: { baseline: baseline != null, public: settings.public.length, private: settings.private.map(c => `${c.slug}.${c.field}`) },
    sources: {
      app_version: sources.app.version,
      app_build: sources.app.build,
      cli_version: sources.cli.version,
      catalog_fetched_at: sources.catalog.fetched_at
    }
  }));
}

let writing = false;
try {
  main();
} catch (error) {
  const kind = error instanceof AnchorError ? "anchor"
    : error instanceof SourceError ? "source"
    : error instanceof CatalogError ? "inconsistent inputs"
    : error instanceof PrivacyError ? "privacy"
    : "unexpected";
  console.error(`refresh failed (${kind}): ${error.message}`);
  if (kind === "unexpected") console.error(error.stack);
  console.error(writing ? "The failure happened while writing; outputs/ may be partially updated. Rerun once the cause is fixed." : "outputs/ was not modified.");
  process.exit(kind === "anchor" || kind === "source" ? 2 : 1);
}
