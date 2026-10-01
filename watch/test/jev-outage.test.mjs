import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { JevRequestError, JevUnavailableError, decisionConfig } from "../../codex/extract/codex/lib/jev-provider.mjs";
import { lintKey, narrativeLint } from "../lib/narrative-lint.mjs";
import { failureDecision, lintOrRetry, Retry } from "../lib/publish.mjs";
import { jevCheck } from "../targets/cc.mjs";

// A test key and no home environment file: nothing here reaches a real provider.
const config = decisionConfig({ TYPESAFE_API_KEY: "test-key" }, () => "");
const fast = { attempts: 2, sleep: async () => {} };
const down = async () => ({ ok: false, status: 503, headers: new Headers() });
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "jev-outage-"));

test("a Jev outage keeps the version unfailed, retries next cycle, and notifies once per outage", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const first = failureDecision(new JevUnavailableError("TypeSafe 503 after 4 attempts"), undefined, now);
  assert.deepEqual({ ...first, outage: undefined }, { markFailed: false, retryNextCycle: true, notify: true, outage: undefined });
  assert.equal(first.outage.since, "2026-10-01T12:00:00.000Z");
  // The next hour, same outage: still retried, not notified again.
  const again = failureDecision(new JevUnavailableError("extract/refresh.mjs exited 75"), first.outage, now + 3600e3);
  assert.deepEqual(again, { markFailed: false, retryNextCycle: true, notify: false, outage: first.outage });
  // The gate's Jev retry belongs to the same outage.
  assert.equal(failureDecision(new Retry("narrative lint waits for Jev", { jev: true }), first.outage, now).notify, false);
});

test("other failures behave as before: a plain Retry notifies without failing; anything else fails the version", () => {
  const outage = { since: "2026-10-01T12:00:00.000Z", reason: "x" };
  assert.deepEqual(failureDecision(new Retry("GitHub's main moved"), outage), { markFailed: false, retryNextCycle: false, notify: true, outage });
  assert.deepEqual(failureDecision(new Error("refresh failed (1)"), undefined), { markFailed: true, retryNextCycle: false, notify: true, outage: undefined });
  assert.equal(failureDecision(new JevRequestError("TypeSafe 400: bad"), undefined).markFailed, true);
});

test("the narrative lint gate turns a Jev outage into a Jev Retry; findings and other errors pass through", async () => {
  const retry = await lintOrRetry("/repo/claude-code", async () => { throw new JevUnavailableError("TypeSafe 503 after 4 attempts"); }).catch(error => error);
  assert.ok(retry instanceof Retry && retry.jev);
  assert.match(retry.message, /narrative lint \(claude-code\) waits for Jev/);
  const findings = [{ file: "outputs/x.md", probability: 0.9, sentence: "It lists 31 tools." }];
  assert.deepEqual(await lintOrRetry("/repo", async () => findings), findings);
  await assert.rejects(lintOrRetry("/repo", async () => { throw new JevRequestError("TypeSafe 400"); }), JevRequestError);
});

function lintRepo(text) {
  const repo = tmp();
  fs.mkdirSync(path.join(repo, "outputs"));
  fs.writeFileSync(path.join(repo, "outputs/page.md"), text);
  return repo;
}

test("narrative lint: a verdict cached before pinning (untagged sentence hash) is still a hit, and still blocks", async () => {
  const sentence = "This reference lists 303 settings keys, 41 of them undocumented.";
  const repo = lintRepo(`# Settings\n\n${sentence}\n`);
  const cacheFile = path.join(tmp(), "narrative-lint-cache.json");
  fs.writeFileSync(cacheFile, JSON.stringify({ [lintKey(sentence)]: 0.97 }));
  const fetchImpl = async () => { throw new Error("a cached verdict must not be asked again"); };
  const findings = await narrativeLint(repo, { cacheFile, config, fetchImpl });
  assert.deepEqual(findings, [{ file: "outputs/page.md", probability: 0.97, sentence }]);
  assert.deepEqual(JSON.parse(fs.readFileSync(cacheFile, "utf8")), { [`jev-1.13:${lintKey(sentence)}`]: 0.97 });
});

test("narrative lint asks the pinned model, caches zero verdicts, and keeps them when Jev goes down", async () => {
  const kept = "The default timeout is 30 seconds for each request.";
  const lost = "Version 2 added 12 new flags to the command line.";
  const repo = lintRepo(`${kept}\n\n${lost}\n`);
  const cacheFile = path.join(tmp(), "narrative-lint-cache.json");
  const bodies = [];
  const fetchImpl = async (url, options) => {
    bodies.push(JSON.parse(options.body));
    if (bodies.length > 1) return down();
    return { ok: true, status: 200, json: async () => ({ model: "jev-1.13.0", answers: { stale_statistic: { noul: 0 } } }) };
  };
  await assert.rejects(narrativeLint(repo, { cacheFile, config, fetchImpl, ...fast }), JevUnavailableError);
  assert.equal(bodies[0].model, "jev-1.13.0");
  assert.equal(config.endpoint, "https://api.typesafe.ai/v1/systemone");
  // The verdict judged before the outage was saved, a zero included, and is not asked again.
  assert.deepEqual(JSON.parse(fs.readFileSync(cacheFile, "utf8")), { [`jev-1.13:${lintKey(kept)}`]: 0 });
  const asked = [];
  const ok = async (url, options) => { asked.push(JSON.parse(options.body).state.sentence); return { ok: true, status: 200, json: async () => ({ answers: { stale_statistic: { noul: 0.1 } } }) }; };
  assert.deepEqual(await narrativeLint(repo, { cacheFile, config, fetchImpl: ok }), []);
  assert.deepEqual(asked, [lost]);
});

test("Claude Code target: exit 75 from refresh.mjs or a post-review step is a Jev outage; other codes are not", () => {
  assert.throws(() => jevCheck("extract/refresh.mjs", { status: 75, stderr: "x\nJev unavailable: TypeSafe 503 after 4 attempts\n", stdout: "" }),
    error => error instanceof JevUnavailableError && /extract\/refresh\.mjs exited 75: Jev unavailable: TypeSafe 503/.test(error.message));
  for (const status of [0, 1, 2, 3, "timeout"]) assert.doesNotThrow(() => jevCheck("extract/refresh.mjs", { status, stderr: "", stdout: "" }));
});
