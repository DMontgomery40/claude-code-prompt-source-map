#!/usr/bin/env node
// Regression proof: compares each live document written by refresh.mjs with
// its dated 2026-09-24 predecessor and prints every difference. Read-only.
// Prompt texts are compared byte for byte; only provenance lines may differ.
//
// Usage: node extract/codex/compare-dated.mjs [DATE]   (default 2026-09-24)

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { codexApp } from "./lib/app-layout.mjs";
import { stringLeaves } from "./lib/catalog.mjs";
import { functionHelperPrompts, staticHelperPrompts, voicePrompts } from "./prompts.mjs";

const root = path.resolve(import.meta.dirname, "..", "..");
const date = process.argv[2] ?? "2026-09-24";
const read = name => fs.readFileSync(path.join(root, "outputs", name), "utf8");
const readJson = name => JSON.parse(read(name));
const rows = [];
let failures = 0;

function record(live, dated, verdict, details = []) {
  rows.push({ live, dated, verdict, details });
  if (verdict.startsWith("FAIL")) failures += 1;
}

function deepDiff(a, b, prefix = "") {
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return JSON.stringify(a) === JSON.stringify(b) ? [] : [`${prefix || "(root)"}: ${JSON.stringify(a)?.slice(0, 90)} → ${JSON.stringify(b)?.slice(0, 90)}`];
  }
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys.flatMap(key => {
    const next = prefix ? `${prefix}.${key}` : key;
    if (!(key in a)) return [`${next}: added`];
    if (!(key in b)) return [`${next}: removed`];
    return deepDiff(a[key], b[key], next);
  });
}

// Sections of the helper/voice documents, split only at the known section
// titles (prompt texts contain their own `#` headings): [{title, meta, body}].
const SECTION_TITLES = new Set([...staticHelperPrompts, ...functionHelperPrompts, ...voicePrompts].map(spec => spec.title));
function sections(doc) {
  const lines = doc.split("\n");
  const starts = lines.flatMap((line, index) =>
    line.startsWith("# ") && SECTION_TITLES.has(line.slice(2)) && lines[index + 1] === "" && lines[index + 2]?.startsWith("Source") ? [index] : []
  );
  const header = lines.slice(0, starts[0]).join("\n");
  const parts = starts.map((start, n) => lines.slice(start, starts[n + 1]).join("\n"));
  return Object.assign(parts.map(part => {
    const match = /^# (.+)\n\n(Source[^\n]*)\n\n([\s\S]*)$/.exec(part);
    return { title: match[1], meta: match[2], body: match[3].replace(/\n*(\n---\n*)+$/, "") };
  }), { header });
}

function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  return `${JSON.stringify(a.slice(Math.max(0, i - 60), i + 90))} → ${JSON.stringify(b.slice(Math.max(0, i - 60), i + 90))}`;
}

function compareSections(liveName, datedName) {
  const live = sections(read(liveName));
  const dated = sections(read(datedName));
  const details = [];
  let textOk = true;
  const titles = [live.map(s => s.title).join("|"), dated.map(s => s.title).join("|")];
  if (titles[0] !== titles[1]) {
    textOk = false;
    details.push(`section list differs: ${titles[1]} → ${titles[0]}`);
  }
  for (const section of live) {
    const old = dated.find(candidate => candidate.title === section.title);
    if (!old) continue;
    if (old.body === section.body) continue;
    if (old.body === section.body.trimEnd()) {
      details.push(`"${section.title}": prompt text now keeps its trailing newline (the dated file trimmed it)`);
      continue;
    }
    textOk = false;
    details.push(`"${section.title}": prompt text differs`);
  }
  const metaChanges = live.filter(section => {
    const old = dated.find(candidate => candidate.title === section.title);
    return old && old.meta !== section.meta;
  });
  if (metaChanges.length) details.push(`${metaChanges.length}/${live.length} provenance lines differ, e.g. ${JSON.stringify(dated.find(s => s.title === metaChanges[0].title).meta)} → ${JSON.stringify(metaChanges[0].meta)}`);
  if (live.header !== dated.header) details.push(`header: ${firstDifference(dated.header, live.header)}`);
  record(liveName, datedName, textOk ? "prompt texts identical" : "FAIL: prompt text differs", details);
}

// 1. Raw prompt documents: byte-identical.
for (const [live, dated] of [
  ["persistent-instructions.md", `aeon-persistent-instructions-${date}.md`],
  ["gpt-6-astra-base-instructions.md", `gpt-6-astra-base-instructions-${date}.md`],
  ["gpt-6-sol-base-instructions.md", `gpt-6-sol-base-instructions-${date}.md`],
  ["gpt-6-luna-base-instructions.md", `gpt-6-luna-base-instructions-${date}.md`],
  ["gpt-6-instruction-modules.md", `gpt-6-astra-instruction-modules-${date}.md`],
  ["gpt-6-astra-model-record.json", `gpt-6-astra-model-messages-${date}.json`]
]) {
  record(live, dated, read(live) === read(dated) ? "byte-identical" : "FAIL: bytes differ");
}

// 2. Sol and Luna records: dated files are the bare model_messages object.
for (const slug of ["gpt-6-sol", "gpt-6-luna"]) {
  const live = readJson(`${slug}-model-record.json`);
  const dated = readJson(`${slug}-model-messages-${date}.json`);
  let same = true;
  try {
    assert.deepStrictEqual(live.model_messages, dated);
  } catch {
    same = false;
  }
  record(`${slug}-model-record.json`, `${slug}-model-messages-${date}.json`, same ? "model_messages identical" : "FAIL: model_messages differ", [
    "shape normalised to the Astra record: adds model_slug, base_instructions, experimental_supported_tools, include_*_usage_instructions, tool_mode",
    `base_instructions in record equals ${slug}-base-instructions.md: ${live.base_instructions === read(`${slug}-base-instructions.md`)}`
  ]);
}

// 3. Recomputed comparison.
{
  const live = readJson("model-comparison.json");
  const dated = readJson(`codex-gpt6-model-prompt-comparison-${date}.json`);
  const strip = ({ captured_at, source, hash_rule, ...rest }) => rest;
  const diffs = deepDiff(strip(dated), strip(live));
  record("model-comparison.json", `codex-gpt6-model-prompt-comparison-${date}.json`, diffs.length ? "FAIL: hashes differ" : "all hashes identical", [
    "removed captured_at; source path is now relative to the app bundle; added hash_rule",
    ...diffs
  ]);
}

// 4. Capture metadata.
{
  const live = readJson("capture-metadata.json");
  const dated = readJson(`gpt-6-astra-instruction-stack-${date}.metadata.json`);
  const diffs = deepDiff(dated, live);
  const expected = diff => /^(extracted_at: removed|source\.binary_path|outputs\.)/.test(diff);
  const unexpected = diffs.filter(diff => !expected(diff));
  record("capture-metadata.json", `gpt-6-astra-instruction-stack-${date}.metadata.json`, unexpected.length ? "FAIL: verification differs" : "verification identical", [
    "removed extracted_at; binary_path relative to the app bundle; outputs map points at the dateless files",
    ...unexpected
  ]);
}

// 5. Helper and voice prompt documents: section by section.
compareSections("desktop-helper-prompts.md", `codex-desktop-helper-prompts-${date}.md`);
compareSections("voice-prompts.md", `codex-voice-prompts-${date}.md`);

// 6. Provenance inventory: prompt hashes by id.
{
  const live = readJson("prompt-provenance-inventory.json");
  const dated = readJson(`codex-prompt-provenance-inventory-${date}.json`);
  const details = [];
  let ok = true;
  for (const [key, label] of [["helper_prompts", "helper"], ["codex_model_message_leaves", "model-message leaf"]]) {
    const liveById = new Map(live[key].map(item => [item.id, item]));
    for (const old of dated[key]) {
      const now = liveById.get(old.id);
      if (!now) {
        ok = false;
        details.push(`${label} ${old.id} missing`);
      } else if (now.prompt_sha256 !== old.prompt_sha256 || now.character_count !== old.character_count) {
        ok = false;
        details.push(`${label} ${old.id}: hash differs`);
      }
    }
    const added = live[key].filter(item => !dated[key].some(old => old.id === item.id)).map(item => item.id);
    if (added.length) details.push(`${label} entries added: ${added.join(", ")}`);
  }
  details.push(`voice_prompts added: ${live.voice_prompts.map(item => item.id).join(", ")}`);
  const offsets = live.helper_prompts.filter(item => dated.helper_prompts.some(old => old.id === item.id && old.byte_offset !== item.byte_offset));
  details.push(`${offsets.length} helper byte_offset values differ (true UTF-8 byte offsets now; the dated values were JavaScript string indices)`);
  const sources = live.helper_prompts.filter(item => dated.helper_prompts.some(old => old.id === item.id && old.source !== item.source));
  if (sources.length) details.push(`source file changed for: ${sources.map(item => `${item.id} → ${item.source.split(" -> ")[1]}`).join(", ")}`);
  details.push("removed generated_at and per-item captured_at; scope names the dateless documents");
  record("prompt-provenance-inventory.json", `codex-prompt-provenance-inventory-${date}.json`, ok ? "all prompt hashes identical" : "FAIL: prompt hashes differ", details);
}

// 7. New document: every fenced text must equal the live catalog value.
{
  const result = spawnSync(codexApp().entrypoint, ["debug", "models"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const models = JSON.parse(result.stdout).models;
  const doc = read("other-catalog-models.md");
  const others = models.filter(model => !["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"].includes(model.slug));
  const details = [];
  let checked = 0;
  let pointers = 0;
  let ok = true;
  // Fence-aware parse: `# slug`, `## field`, then a fenced text or a pointer.
  const docModels = [];
  const fencedTexts = new Map();
  const lines = doc.split("\n");
  let slug = null;
  let field = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^# \S+$/.test(line) && others.some(model => model.slug === line.slice(2))) {
      slug = line.slice(2);
      docModels.push(slug);
    } else if (slug && /^## \S+$/.test(line)) {
      field = line.slice(3);
    } else if (slug && field && /^Identical to `([^`]+)` · `([^`]+)`/.test(line)) {
      const [, refSlug, refField] = /^Identical to `([^`]+)` · `([^`]+)`/.exec(line);
      fencedTexts.set(`${slug}:${field}`, { ref: `${refSlug}:${refField}` });
      field = null;
    } else if (slug && field && /^(`{3,})text$/.test(line)) {
      const fence = /^(`{3,})/.exec(line)[1];
      const end = lines.findIndex((candidate, index) => index > i && candidate === fence);
      fencedTexts.set(`${slug}:${field}`, lines.slice(i + 1, end).join("\n"));
      i = end;
      field = null;
    }
  }
  if (docModels.join(",") !== others.map(model => model.slug).join(",")) {
    ok = false;
    details.push(`model list ${docModels.join(",")} ≠ catalog ${others.map(model => model.slug).join(",")}`);
  }
  for (const model of others) {
    const leaves = [...(model.base_instructions ? [{ path: "base_instructions", value: model.base_instructions }] : []), ...stringLeaves(model.model_messages, "model_messages")];
    for (const leaf of leaves) {
      let entry = fencedTexts.get(`${model.slug}:${leaf.path}`);
      if (entry && typeof entry === "object") {
        pointers += 1;
        entry = fencedTexts.get(entry.ref);
      }
      if (entry !== leaf.value) {
        ok = false;
        details.push(`${model.slug} ${leaf.path}: text missing or different`);
      } else checked += 1;
    }
  }
  details.unshift(`${checked} texts across ${others.length} models match the live catalog exactly (${pointers} via "identical to" pointers)`);
  record("other-catalog-models.md", "(new, no predecessor)", ok ? "all texts exact" : "FAIL: texts differ", details);
}

for (const row of rows) {
  console.log(`${row.verdict.startsWith("FAIL") ? "FAIL" : "ok  "}  ${row.live.padEnd(34)} vs ${row.dated}: ${row.verdict}`);
  for (const detail of row.details) console.log(`        - ${detail}`);
}
console.log(failures ? `\n${failures} document(s) differ in prompt text or hashes.` : "\nAll live documents match their dated predecessors except for the listed intended differences.");
process.exit(failures ? 1 : 0);
