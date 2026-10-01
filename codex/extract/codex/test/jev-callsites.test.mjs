// Codex/ChatGPT scripts that ask Jev: the config tags (06_tags.mjs) and the prompt sweep keep the
// cache keys every existing verdict was saved under, and ask the pinned model through ask().
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { JevUnavailableError, decisionConfig, openCache } from "../lib/jev-provider.mjs";
import { MODEL_FACING_QUESTION, modelFacing, verdictKey } from "../lib/prompt-verdict.mjs";
import { tagKey } from "../../codex-config/06_tags.mjs";

const config = decisionConfig({ TYPESAFE_API_KEY: "test-key" }, () => "");
const cacheIn = name => path.join(fs.mkdtempSync(path.join(os.tmpdir(), "jev-callsites-")), name);

test("config tags: an untagged tag-verdicts.json entry (<taxonomy version>:<sha>) is still a hit", () => {
  const state = { name: "model_reasoning_effort", kind: "config.toml key" };
  const key = tagKey("0123456789ab", state);
  assert.match(key, /^0123456789ab:[0-9a-f]{64}$/);
  const file = cacheIn("tag-verdicts.json");
  fs.writeFileSync(file, JSON.stringify({ [key]: { "persistent-mode": 0.12 } }));
  assert.deepEqual(openCache(file).get(key), { "persistent-mode": 0.12 });
});

test("prompt sweep: an untagged \"v1:<hash>\" verdict is still a hit, a zero included", () => {
  const file = cacheIn("prompt-candidate-verdicts.json");
  fs.writeFileSync(file, JSON.stringify({ "v1:93b9a98edc2cdcd4": 0, "v1:f16f67118473da86": 0.87 }));
  const cache = openCache(file);
  assert.equal(verdictKey("93b9a98edc2cdcd4"), "v1:93b9a98edc2cdcd4");
  assert.ok(cache.has(verdictKey("93b9a98edc2cdcd4")));
  assert.equal(cache.get(verdictKey("93b9a98edc2cdcd4")), 0);
  assert.equal(cache.get(verdictKey("f16f67118473da86")), 0.87);
});

test("prompt sweep asks the pinned model with retries, and an outage surfaces as JevUnavailableError", async () => {
  let calls = 0, body;
  const fetchImpl = async (url, options) => {
    calls += 1;
    body = JSON.parse(options.body);
    return calls === 1 ? { ok: false, status: 502, headers: new Headers() } : { ok: true, status: 200, json: async () => ({ answers: { model_facing: { noul: 0.91 } } }) };
  };
  assert.equal(await modelFacing(config, { file: "a.js", text: "You are a helpful assistant." }, { fetchImpl, sleep: async () => {} }), 0.91);
  assert.equal(calls, 2);
  assert.equal(body.model, "jev-1.13.0");
  assert.deepEqual(body.questions, MODEL_FACING_QUESTION);
  const down = async () => { throw new TypeError("fetch failed"); };
  await assert.rejects(modelFacing(config, { file: "a.js", text: "x" }, { fetchImpl: down, attempts: 2, sleep: async () => {} }), JevUnavailableError);
});
