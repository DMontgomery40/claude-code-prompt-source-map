#!/usr/bin/env node
// The last guard on a capture: scans a HAR's text for anything that still looks like a credential
// (a bearer token, a JWT, an Anthropic or OpenAI API key, an OAuth token field) and deletes the file on
// a hit, so a capture that slipped past trace_capture.py is never left on disk.
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SECRET_PATTERNS = [
  ["bearer token", /Bearer\s+(?!<redacted)[A-Za-z0-9._~+/=-]{20,}/],
  ["JWT", /\beyJ(?:hbGci|0eXAi|raWQi)[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\./],
  ["Anthropic API key", /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/],
  ["OAuth token field", /\\?"(?:access_token|refresh_token|id_token|accessToken|refreshToken)\\?"\s*:\s*\\?"(?!<redacted)[^"\\]{16,}/]
];

// The kinds of credential found in `text` (empty when clean).
export function findSecrets(text) {
  return SECRET_PATTERNS.filter(([, re]) => re.test(text)).map(([kind]) => kind);
}

// Returns { ok, kinds, deleted }; deletes `file` when anything is found.
export function checkHar(file) {
  const kinds = findSecrets(readFileSync(file, "utf8"));
  if (!kinds.length) return { ok: true, kinds, deleted: false };
  unlinkSync(file);
  return { ok: false, kinds, deleted: true };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file || !existsSync(file)) {
    console.error(`capture: no HAR was written${file ? ` at ${file}` : ""} (did the command make any HTTPS requests?)`);
    process.exit(1);
  }
  const { ok, kinds } = checkHar(file);
  if (!ok) {
    console.error(`capture: deleted ${file}: it still held ${kinds.join(", ")}. Nothing was kept.`);
    process.exit(1);
  }
  console.error(`capture: credentials check passed for ${file}`);
}
