// tools/capture: the last-guard credential scan deletes a capture that still holds a secret and keeps a
// clean one; the addon's patterns agree with it on what counts as a secret.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkHar, findSecrets } from "../capture/check-har.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const addon = path.join(here, "..", "capture", "trace_capture.py");
const cli = path.join(here, "..", "capture", "check-har.mjs");

// Synthetic credentials, built from pieces so this file itself never matches a scanner.
const FAKE = {
  bearer: `Bearer ${"a1B2c3D4".repeat(4)}`,
  jwt: `${"eyJhbGci"}OiJIUzI1NiJ9.${"eyJzdWIiOiIxIn0"}.${"sig".repeat(6)}`,
  anthropic: `${"sk-ant-"}api03-${"x".repeat(40)}`,
  openai: `${"sk-proj-"}${"Z".repeat(40)}`,
  oauth: `{"access_token":"${"t".repeat(30)}"}`
};
const har = (headers, body = "") => JSON.stringify({ log: { entries: [{ request: { url: "https://api.example.test/v1/messages", headers, postData: { text: body } }, response: { headers: [], content: { text: "" } } }] } });

test("findSecrets names every kind of credential it finds", () => {
  assert.deepEqual(findSecrets(FAKE.bearer), ["bearer token"]);
  assert.deepEqual(findSecrets(FAKE.jwt), ["JWT"]);
  assert.deepEqual(findSecrets(FAKE.anthropic), ["Anthropic API key"]);
  assert.deepEqual(findSecrets(FAKE.openai), ["OpenAI API key"]);
  assert.deepEqual(findSecrets(FAKE.oauth), ["OAuth token field"]);
  // The same field inside a JSON string (a HAR body is text inside JSON), escaped once.
  assert.deepEqual(findSecrets(JSON.stringify(FAKE.oauth)), ["OAuth token field"]);
});

test("placeholders, page tokens and ordinary text are not secrets", () => {
  for (const text of [
    "Bearer <redacted by trace-capture>",
    '{"access_token":"<redacted by trace-capture>"}',
    // Base64 JSON page tokens start with eyJ too, but are not JWTs.
    "pageToken=eyJzY29wZSI6IkdMT0JBTCJ9",
    "the sk-ant- prefix in prose",
    "request-id: req_011CfWFt566KfKfVvTzQmdpN"
  ]) assert.deepEqual(findSecrets(text), [], text);
});

test("checkHar deletes a capture with a credential and keeps a clean one", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "capture-test-"));
  const dirty = path.join(dir, "dirty.har"), clean = path.join(dir, "clean.har");
  writeFileSync(dirty, har([{ name: "authorization", value: FAKE.bearer }]));
  writeFileSync(clean, har([{ name: "authorization", value: "<redacted by trace-capture>" }], '{"model":"m"}'));
  assert.deepEqual(checkHar(dirty), { ok: false, kinds: ["bearer token"], deleted: true });
  assert.equal(existsSync(dirty), false);
  assert.deepEqual(checkHar(clean), { ok: true, kinds: [], deleted: false });
  assert.equal(existsSync(clean), true);
});

test("the CLI exits non-zero, and says why, when the HAR is missing or dirty", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "capture-test-"));
  const missing = spawnSync(process.execPath, [cli, path.join(dir, "none.har")], { encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /no HAR was written/);
  const dirty = path.join(dir, "dirty.har");
  writeFileSync(dirty, har([], FAKE.anthropic));
  const run = spawnSync(process.execPath, [cli, dirty], { encoding: "utf8" });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /deleted .*Anthropic API key/);
  assert.equal(existsSync(dirty), false);
});

// The addon's scrub_text must leave nothing check-har would flag, and must be idempotent.
const python = spawnSync("python3", ["-c", "import re"]).status === 0;
test("trace_capture.py scrubs every credential kind, idempotently", { skip: !python && "python3 not available" }, () => {
  const input = Object.values(FAKE).join("\n");
  const script = `import importlib.util, sys, types
m = types.ModuleType("mitmproxy"); m.http = types.SimpleNamespace(HTTPFlow=object); sys.modules["mitmproxy"] = m
spec = importlib.util.spec_from_file_location("tc", sys.argv[1]); tc = importlib.util.module_from_spec(spec); spec.loader.exec_module(tc)
text = sys.stdin.read(); once = tc.scrub_text(text); twice = tc.scrub_text(once)
sys.stdout.write(once + "\\n----\\n" + str(once == twice))`;
  const out = execFileSync("python3", ["-B", "-c", script, addon], { input, encoding: "utf8" });
  const [scrubbed, same] = out.split("\n----\n");
  assert.deepEqual(findSecrets(scrubbed), []);
  assert.equal(same, "True");
  assert.equal(readFileSync(addon, "utf8").includes("PLACEHOLDER"), true);
});
