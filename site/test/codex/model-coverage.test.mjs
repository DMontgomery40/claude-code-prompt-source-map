import assert from "node:assert/strict";
import test from "node:test";
import { categories } from "../../src/codex/catalog.mjs";

test("GPT-6.1 Sol pages share existing sections and comparison keeps its stable URL", () => {
  const pages = categories.flatMap(category => category.files);
  const base = pages.find(page => page.path === "outputs/gpt-6.1-sol-base-instructions.md");
  const record = pages.find(page => page.path === "outputs/gpt-6.1-sol-model-record.json");
  assert.equal(base?.title, "GPT-6.1 Sol base instructions");
  assert.equal(base?.instructionProfile, "base");
  assert.equal(record?.format, "source");
  assert.equal(categories.find(category => category.files.includes(base)).label, "Model instructions");
  assert.equal(categories.find(category => category.files.includes(record)).label, "Evidence and archive");
  const comparison = pages.find(page => page.path === "outputs/model-comparison.json");
  assert.equal(comparison.slug, "three-model-prompt-comparison");
  assert.equal(comparison.title, "Model prompt comparison");
});
