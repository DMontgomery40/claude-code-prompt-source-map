import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { GPT6_DOCUMENTED, GPT6_REQUIRED, loadCatalog, SourceError } from "../lib/catalog.mjs";
import { buildDocuments, OUTPUT_NAMES, OUTPUT_WHITELIST } from "../lib/documents.mjs";

const model = (slug, extra = {}) => ({
  slug,
  base_instructions: `${slug} base`,
  model_messages: {
    instructions_template: `${slug} base`,
    persistent_instructions: "shared persistent",
    approvals: { prompt: "shared approvals" },
    ...extra
  }
});
const fixture = models => ({
  app: { version: "test", build: "test", dependencyPrompts: [] },
  cli: { version: "test", entrypoint: "cli" },
  catalog: { live: models, bundled: models },
  prompts: { staticHelpers: [], functionHelpers: [], voice: [] }
});

test("historical GPT-6 catalogs build without the optional GPT-6.1 Sol record", () => {
  const docs = buildDocuments(fixture(GPT6_REQUIRED.map(slug => model(slug))));
  assert.equal(docs.has(OUTPUT_NAMES.base("gpt-6.1-sol")), false);
  assert.equal(docs.has(OUTPUT_NAMES.record("gpt-6.1-sol")), false);
  for (const slug of GPT6_REQUIRED) assert.ok(docs.has(OUTPUT_NAMES.record(slug)));
});

test("GPT-6.1 Sol receives dedicated records, module variants, comparison and provenance", () => {
  const models = GPT6_REQUIRED.map(slug => model(slug));
  models.push(model("gpt-6.1-sol", { approvals: { prompt: "new approvals" }, new_mode: "new mode" }));
  const docs = buildDocuments(fixture(models));
  assert.ok(GPT6_DOCUMENTED.includes("gpt-6.1-sol"));
  assert.ok(OUTPUT_WHITELIST.includes(OUTPUT_NAMES.record("gpt-6.1-sol")));
  assert.equal(docs.get(OUTPUT_NAMES.base("gpt-6.1-sol")), "gpt-6.1-sol base");
  assert.equal(JSON.parse(docs.get(OUTPUT_NAMES.record("gpt-6.1-sol"))).model_slug, "gpt-6.1-sol");
  assert.match(docs.get(OUTPUT_NAMES.modules), /### gpt-6\.1-sol variant\n\nnew approvals/);
  assert.match(docs.get(OUTPUT_NAMES.modules), /## new_mode/);
  const comparison = JSON.parse(docs.get(OUTPUT_NAMES.comparison));
  assert.ok(comparison.models["gpt-6.1-sol"]);
  assert.ok(comparison.distinct_fields.includes("approvals"));
  assert.ok(comparison.distinct_fields.includes("new_mode"));
  assert.ok(comparison.common_fields_identical.includes("persistent_instructions"));
  const leaves = JSON.parse(docs.get(OUTPUT_NAMES.inventory)).codex_model_message_leaves.filter(leaf => leaf.model === "gpt-6.1-sol");
  assert.ok(leaves.length > 0);
  assert.ok(leaves.every(leaf => leaf.source_file === OUTPUT_NAMES.record("gpt-6.1-sol")));
  assert.doesNotMatch(docs.get(OUTPUT_NAMES.otherModels), /# gpt-6\.1-sol/);
});

function withCatalog(models, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "model-coverage-"));
  try {
    fs.writeFileSync(path.join(dir, "models_cache.json"), JSON.stringify({ models }));
    const binary = path.join(dir, "catalog-cli");
    fs.writeFileSync(binary, `#!${process.execPath}\nprocess.stdout.write(${JSON.stringify(JSON.stringify({ models }))});\n`, { mode: 0o755 });
    run(binary, dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("catalog validates GPT-6.1 Sol when present while allowing historical catalogs", () => {
  const oldModels = GPT6_REQUIRED.map(slug => model(slug));
  withCatalog(oldModels, (binary, codexHome) => assert.equal(loadCatalog(binary, { codexHome }).live.length, 3));
  withCatalog([...oldModels, model("gpt-6.1-sol")], (binary, codexHome) => assert.equal(loadCatalog(binary, { codexHome }).live.length, 4));
  const invalid = model("gpt-6.1-sol");
  invalid.base_instructions = "";
  withCatalog([...oldModels, invalid], (binary, codexHome) => {
    assert.throws(() => loadCatalog(binary, { codexHome }), error => error instanceof SourceError && /gpt-6\.1-sol: base_instructions/.test(error.message));
  });
});
