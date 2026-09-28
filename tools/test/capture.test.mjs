// tools/capture: the last-guard credential scan deletes a capture that still holds a secret and keeps a
// clean one; the addon's patterns agree with it on what counts as a secret.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
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

// The addon, run without mitmproxy: its functions only need plain strings and a small query stand-in.
const python = spawnSync("python3", ["-c", "import re"]).status === 0;
function runAddon(body) {
  const script = `import importlib.util, json, sys, types
m = types.ModuleType("mitmproxy"); m.http = types.SimpleNamespace(HTTPFlow=object); sys.modules["mitmproxy"] = m
spec = importlib.util.spec_from_file_location("tc", sys.argv[1]); tc = importlib.util.module_from_spec(spec); spec.loader.exec_module(tc)
class Query:
    def __init__(self, pairs): self.pairs = pairs
    def keys(self): return list(dict.fromkeys(k for k, _ in self.pairs))
    def get_all(self, k): return [v for n, v in self.pairs if n == k]
    def set_all(self, k, vs): self.pairs = [(n, v) for n, v in self.pairs if n != k] + [(k, v) for v in vs]
data = json.loads(sys.stdin.read())
${body}`;
  return JSON.parse(execFileSync("python3", ["-B", "-c", script, addon], { input: JSON.stringify(FAKE), encoding: "utf8" }));
}
const JWT_WITH_CLAIMS = [
  Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url"),
  Buffer.from(JSON.stringify({ iss: "https://auth.example.test", aud: ["https://api.example.test/v1"], sub: "user-SECRETSUBJECT", email: "someone@example.test", "https://api.example.test/auth": { account_id: "acct-SECRET", plan: "pro" }, scp: ["openid", "offline_access"], iat: 1790000000, exp: 1790864000 })).toString("base64url"),
  "c2lnbmF0dXJlc2lnbmF0dXJl"
].join(".");

test("trace_capture.py replaces every credential kind with a description, idempotently", { skip: !python && "python3 not available" }, () => {
  const r = runAddon(`text = "\\n".join(data.values()); once = tc.scrub_text(text)
print(json.dumps({"once": once, "same": once == tc.scrub_text(once)}))`);
  assert.deepEqual(findSecrets(r.once), []);
  assert.equal(r.same, true);
  assert.match(r.once, /Bearer <redacted by trace-capture: opaque token \| 32 chars \| fp [0-9a-f]{8}>/);
  assert.match(r.once, /<redacted by trace-capture: Anthropic API key \| \d+ chars \| fp [0-9a-f]{8}>/);
  assert.match(r.once, /"access_token":"<redacted by trace-capture: opaque token \| 30 chars \| fp [0-9a-f]{8}>"/);
});

test("a JWT is described by its shape (algorithm, claim names, issuer, audience, scopes, lifetime), never its identity claims", { skip: !python && "python3 not available" }, () => {
  const r = runAddon(`print(json.dumps(tc.describe(${JSON.stringify(JWT_WITH_CLAIMS)})))`);
  assert.match(r, /^<redacted by trace-capture: JWT \| \d+ chars \| fp [0-9a-f]{8} \| alg RS256 \| /);
  assert.match(r, /claims aud,email,exp,https:\/\/api\.example\.test\/auth\{account_id,plan\},iat,iss,scp,sub/);
  assert.match(r, /issuer https:\/\/auth\.example\.test \| audience https:\/\/api\.example\.test\/v1 \| scopes openid,offline_access \| lifetime 10d>$/);
  for (const secret of ["SECRETSUBJECT", "someone@", "acct-SECRET", "pro;"]) assert.equal(r.includes(secret), false, secret);
});

test("the same value gets the same fingerprint within a capture, a different value a different one", { skip: !python && "python3 not available" }, () => {
  const r = runAddon(`print(json.dumps([tc.fingerprint("a" * 40), tc.fingerprint("a" * 40), tc.fingerprint("b" * 40)]))`);
  assert.equal(r[0], r[1]);
  assert.notEqual(r[0], r[2]);
});

test("cookies keep their names and attributes; token-like query parameters are described", { skip: !python && "python3 not available" }, () => {
  const r = runAddon(`q = Query([("limit", "20"), ("access_token", "abcdefghijklmnopqrstuv"), ("k", "client-public-key"), ("x", data["anthropic"])])
req = types.SimpleNamespace(query=q); tc.scrub_query(req); once = list(q.pairs); tc.scrub_query(req)
print(json.dumps({
  "cookie": tc.scrub_header("Cookie", "session=abcdef123456; theme=dark"),
  "set": tc.scrub_header("Set-Cookie", "__Secure-session=abcdef123456; Path=/; Secure; HttpOnly; SameSite=Lax"),
  "auth": tc.scrub_header("Authorization", data["bearer"]),
  "account": tc.scrub_header("chatgpt-account-id", "0a1b2c3d-0000-4000-8000-000000000000"),
  "dd": [tc.SECRET_HEADER.match("DD-API-KEY") is not None, tc.scrub_header("DD-API-KEY", "pub" + "0" * 32)],
  "again": tc.scrub_header("Authorization", tc.scrub_header("Authorization", data["bearer"])),
  "query": dict(once), "stable": once == q.pairs}))`);
  assert.match(r.cookie, /^session=<redacted by trace-capture: cookie value \| 12 chars \| fp [0-9a-f]{8}>; theme=<redacted by trace-capture: cookie value \| 4 chars \| fp [0-9a-f]{8}>$/);
  assert.match(r.set, /^__Secure-session=<redacted by trace-capture: cookie value \| 12 chars \| fp [0-9a-f]{8}>; Path=\/; Secure; HttpOnly; SameSite=Lax$/);
  assert.match(r.auth, /^Bearer <redacted by trace-capture: opaque token \| 32 chars \| fp [0-9a-f]{8}>$/);
  assert.match(r.account, /^<redacted by trace-capture: ChatGPT account id \| 36 chars \| fp [0-9a-f]{8}>$/);
  assert.equal(r.dd[0], true);
  assert.match(r.dd[1], /^<redacted by trace-capture: Datadog client key \| 35 chars \| fp [0-9a-f]{8}>$/);
  assert.equal(r.again.match(/redacted/g).length, 1);
  assert.equal(r.query.limit, "20");
  assert.equal(r.query.k, "client-public-key");
  assert.match(r.query.access_token, /^<redacted by trace-capture: opaque token \| 22 chars/);
  assert.match(r.query.x, /^<redacted by trace-capture: Anthropic API key \|/);
  assert.equal(r.stable, true);
});
