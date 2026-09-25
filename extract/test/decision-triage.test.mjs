import assert from "node:assert/strict";
import test from "node:test";
import { typesafeKey } from "../decision-triage.mjs";

test("TYPESAFE_API_KEY from process.env wins without reading ~/.env", () => {
  const readEnvFile = () => { throw new Error("should not be called"); };
  assert.equal(typesafeKey({ TYPESAFE_API_KEY: "from-env" }, readEnvFile), "from-env");
});

test("falls back to parsing the key out of ~/.env when env is unset", () => {
  const readEnvFile = () => 'export TYPESAFE_API_KEY="from-dotenv"\nOTHER=1\n';
  assert.equal(typesafeKey({}, readEnvFile), "from-dotenv");
});

test("a missing ~/.env (ENOENT) resolves to undefined, not a thrown error", () => {
  const readEnvFile = () => { throw Object.assign(new Error("ENOENT: no such file"), { code: "ENOENT" }); };
  assert.equal(typesafeKey({}, readEnvFile), undefined);
});

test("an ~/.env that exists but has no key resolves to undefined", () => {
  const readEnvFile = () => "SOME_OTHER_VAR=1\n";
  assert.equal(typesafeKey({}, readEnvFile), undefined);
});
