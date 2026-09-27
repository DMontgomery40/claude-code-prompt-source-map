import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { catalogSnapshot } from "./catalog-metadata.mjs";

export const GPT6_DOCUMENTED = ["gpt-6-astra", "gpt-6-sol", "gpt-6-luna"];

// Only these catalog fields are ever copied into outputs. Everything else in a
// catalog record (access programs, upgrade and availability notices, …) may be
// account-specific and is dropped here, before any document is built.
export const RECORD_FIELDS = [
  "base_instructions",
  "model_messages",
  "experimental_supported_tools",
  "include_apps_usage_instructions",
  "include_plugin_usage_instructions",
  "include_skills_usage_instructions",
  "tool_mode"
];

// An input is missing or no longer has the expected shape: the watcher hands
// these to a repair agent (exit 2).
export class SourceError extends Error {}
// Inputs are present but inconsistent (for example a cache refreshed mid-run):
// usually transient (exit 1).
export class CatalogError extends Error {}

function runCatalog(binary, args) {
  const result = spawnSync(binary, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120_000 });
  if (result.error) throw new SourceError(`${path.basename(binary)} ${args.join(" ")} could not run: ${result.error.message}`);
  if (result.status !== 0) throw new SourceError(`${path.basename(binary)} ${args.join(" ")} exited ${result.status}: ${result.stderr.trim().slice(0, 500)}`);
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch (error) {
    throw new SourceError(`${args.join(" ")} did not return JSON: ${error.message}`);
  }
  const models = payload.models ?? payload;
  if (!Array.isArray(models) || !models.length) throw new SourceError(`${args.join(" ")} returned no models`);
  const records = models.map(model => {
    if (typeof model.slug !== "string") throw new SourceError(`${args.join(" ")} returned a model without a slug`);
    return { slug: model.slug, display_name: model.display_name ?? null, ...Object.fromEntries(RECORD_FIELDS.map(field => [field, model[field]])) };
  });
  // The full records stay here; only their settings snapshot (prompt fields and account
  // keys removed, see catalog-metadata.mjs) leaves this module, for local comparison.
  return { records, settings: catalogSnapshot(models) };
}

const sameJson = (a, b) => {
  try {
    assert.deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
};

// The CLI answers from $CODEX_HOME/models_cache.json after refreshing it. The
// cache is read for three things only: fetched_at, client_version and the
// per-model messages used to prove the CLI served the live catalog rather than
// its compiled-in defaults. Its `identity` value is returned solely so the
// privacy scan can refuse any output containing it.
function readCache(codexHome) {
  const cachePath = path.join(codexHome, "models_cache.json");
  if (!fs.existsSync(cachePath)) throw new SourceError(`no model cache at $CODEX_HOME/models_cache.json; cannot confirm the catalog is live`);
  const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
  return {
    fetchedAt: cache.fetched_at ?? null,
    clientVersion: cache.client_version ?? null,
    identity: typeof cache.identity === "string" ? cache.identity : null,
    models: (cache.models ?? []).map(model => ({ slug: model.slug, model_messages: model.model_messages }))
  };
}

export function loadCatalog(binary, { codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex") } = {}) {
  const { records: live, settings: liveSettings } = runCatalog(binary, ["debug", "models"]);
  const { records: bundled } = runCatalog(binary, ["debug", "models", "--bundled"]);
  const cache = readCache(codexHome);

  const liveSlugs = live.map(model => model.slug);
  const cacheSlugs = cache.models.map(model => model.slug);
  if (!sameJson([...liveSlugs].sort(), [...cacheSlugs].sort())) {
    throw new CatalogError(`catalog from the CLI (${liveSlugs.join(", ")}) does not match the refreshed cache (${cacheSlugs.join(", ")}); refusing to publish possibly bundled defaults`);
  }
  for (const model of live) {
    const cached = cache.models.find(candidate => candidate.slug === model.slug);
    if (!sameJson(model.model_messages, cached.model_messages)) {
      throw new CatalogError(`${model.slug}: CLI model messages differ from the refreshed cache; refusing to publish`);
    }
  }

  for (const slug of GPT6_DOCUMENTED) {
    const model = live.find(candidate => candidate.slug === slug);
    if (!model) throw new SourceError(`${slug} is missing from the live catalog; its documents cannot be regenerated`);
    for (const [field, value] of Object.entries({
      base_instructions: model.base_instructions,
      "model_messages.persistent_instructions": model.model_messages?.persistent_instructions,
      "model_messages.instructions_template": model.model_messages?.instructions_template
    })) {
      if (typeof value !== "string" || !value.length) throw new SourceError(`${slug}: ${field} is missing or empty`);
    }
  }

  return { live, bundled, liveSettings, fetchedAt: cache.fetchedAt, cacheClientVersion: cache.clientVersion, identity: cache.identity };
}

// String leaves of a nested value, as dotted paths in source order.
export function stringLeaves(value, prefix) {
  if (typeof value === "string") return [{ path: prefix, value }];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => stringLeaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}

// Non-string, non-null scalar leaves (numbers and booleans).
export function scalarLeaves(value, prefix) {
  if (value === null || typeof value === "string") return [];
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => scalarLeaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [{ path: prefix, value }];
}

// Keys that describe the account or the fetch rather than the catalog.
const VOLATILE_CATALOG_KEY = /^(?:fetched_at|etag|identity|account(?:_.*)?|user(?:_id|_email)?|email|.*_email|chatgpt_account_id|plan_type|workspace_id|org(?:anization)?_id)$/i;

// Canonical catalog text for fingerprinting: volatile and account keys
// removed at every depth, object keys sorted.
export function canonicalCatalog(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalCatalog).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).filter(key => !VOLATILE_CATALOG_KEY.test(key)).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${canonicalCatalog(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

// Python's json.dumps(value, sort_keys=True, ensure_ascii=False): the
// serialisation behind the published comparison hashes.
export function pythonJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(pythonJson).join(", ")}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map(key => `${JSON.stringify(key)}: ${pythonJson(value[key])}`).join(", ")}}`;
}
