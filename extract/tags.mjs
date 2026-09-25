// Tags every environment variable for the site's filters.
//   node extract/tags.mjs
// Status tags come straight from the records (documented, read or set, child environments).
// Topic tags, prompt caching first, come from extract/tags/env-taxonomy.json: a variable gets
// a tag when extract/tags/env-seed.json lists it for that tag or when Jev scores it at or
// above the threshold, unless the seed excludes it. Jev verdicts are cached by record state and taxonomy version in
// work/tag-verdicts.json, so a refresh only classifies new or changed variables.
// Writes outputs/environment-variables-tags.json.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const sha = value => createHash("sha256").update(value).digest("hex");
const taxonomy = readJson(path.join(root, "extract/tags/env-taxonomy.json"));
const seed = readJson(path.join(root, "extract/tags/env-seed.json"));
const cacheFile = path.join(root, "work/tag-verdicts.json");
const cache = existsSync(cacheFile) ? readJson(cacheFile) : {};
const taxonomyVersion = sha(JSON.stringify(taxonomy)).slice(0, 12);
const THRESHOLD = 0.7;
const FEATURE = taxonomy.tags[0].id;

const key = process.env.TYPESAFE_API_KEY ?? (() => {
  try { return readFileSync(path.join(os.homedir(), ".env"), "utf8").match(/^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*["']?([^"'\s]+)/m)?.[1]; } catch { return undefined; }
})();
if (!key) throw new Error("tags.mjs needs TYPESAFE_API_KEY");

const STATUS = [
  { id: "documented", label: "Documented", kind: "status" },
  { id: "undocumented", label: "Undocumented", kind: "status" },
  { id: "read", label: "Read by Claude Code", kind: "status" },
  { id: "set", label: "Set by Claude Code", kind: "status" },
  { id: "any-value", label: "Any value turns it on, even 0", kind: "status" },
  { id: "removed-for-children", label: "Removed from child environments", kind: "status" },
  { id: "passed-to-children", label: "Passed to tools, hooks or MCP servers", kind: "status" },
  { id: "fixed-values", label: "Fixed values", kind: "status" },
  { id: "third-party", label: "Third-party library", kind: "status" },
  { id: "os-shell", label: "OS, shell or CI", kind: "status" }
];

function statusTags(item) {
  const d = item.details ?? {};
  const t = new Set([item.documented ? "documented" : "undocumented", d.direction === "set" ? "set" : "read"]);
  // One code path parses it as a boolean, another only checks that it is set, so "0" and
  // "false" still turn the behavior on there.
  if (d.also_parsed_as_boolean === true) t.add("any-value");
  if (d.direction === "set" && (d.set_values ?? []).some(v => String(v?.value ?? v).startsWith("removed"))) t.add("removed-for-children");
  if (Array.isArray(d.receivers) && d.receivers.length && !(d.receivers.length === 1 && d.receivers[0] === "not traced")) t.add("passed-to-children");
  if (d.read_as === "enum") t.add("fixed-values");
  if (item.group.startsWith("Read only by bundled third-party")) t.add("third-party");
  if (item.group.startsWith("Shell, terminal, OS")) t.add("os-shell");
  return t;
}

// The state shape the taxonomy was previewed with (work/tags/check.json); keep it in step.
function describe(item) {
  const d = item.details ?? {};
  const text = typeof d.description === "string" ? d.description : d.description?.text;
  return {
    name: item.title,
    kind: "environment variable",
    group: item.group,
    type: d.type ?? d.read_as ?? null,
    default: d.default ?? null,
    values: d.values ?? null,
    description: text ?? d.source_comment ?? null
  };
}

async function topicScores(item) {
  const state = describe(item);
  const cacheKey = `env:${taxonomyVersion}:${sha(JSON.stringify(state))}`;
  if (cache[cacheKey]) return cache[cacheKey];
  const questions = Object.fromEntries(taxonomy.tags.map(tag => [tag.id, {
    type: "noul",
    instructions: `Does the Claude Code environment variable described in \`state\` belong to this topic? Topic: ${tag.label}. ${tag.definition}`,
    criteria: {
      true: `It belongs, like: ${tag.true_examples.join(", ")}.`,
      false: `It does not, like these near misses: ${tag.false_examples.join(", ")}.`
    }
  }]));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: "jev-latest", state, questions })
    });
    if (response.status === 429 || response.status >= 500) { await new Promise(r => setTimeout(r, 1000 * 2 ** attempt)); continue; }
    if (!response.ok) throw new Error(`TypeSafe ${response.status}: ${await response.text()}`);
    const answers = (await response.json()).answers;
    cache[cacheKey] = Object.fromEntries(Object.entries(answers).map(([id, a]) => [id, a.noul]));
    return cache[cacheKey];
  }
  throw new Error("TypeSafe retries exhausted");
}

const records = readJson(path.join(root, "outputs/environment-variables.json")).items;
const ids = new Set(records.map(r => r.id));
const stale = seed.filter(s => !ids.has(s.id));
if (stale.length) console.error(`seed entries with no record (skipped): ${stale.map(s => s.id).join(", ")}`);
// Seed entries add a tag, or with "exclude": true veto one after a person reviewed Jev's call.
const seeded = new Map(), excluded = new Map();
for (const s of seed) { const map = s.exclude ? excluded : seeded; (map.get(s.id) ?? map.set(s.id, []).get(s.id)).push(s.tag); }

const items = {};
const queue = [...records];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const item = queue.shift();
    const tags = statusTags(item);
    const scores = await topicScores(item);
    const topics = taxonomy.tags.map(t => t.id).filter(id => (scores[id] >= THRESHOLD || seeded.get(item.id)?.includes(id)) && !excluded.get(item.id)?.includes(id));
    items[item.id] = [...topics, ...tags];
  }
}));
writeFileSync(cacheFile, JSON.stringify(cache));

const vocabulary = [
  ...taxonomy.tags.map(t => ({ id: t.id, label: t.label, kind: "topic", definition: t.definition, ...(t.id === FEATURE ? { feature: true } : {}) })),
  ...STATUS
].map(t => ({ ...t, count: Object.values(items).filter(list => list.includes(t.id)).length })).filter(t => t.count);
const ordered = Object.fromEntries(records.map(r => [r.id, items[r.id]]));
writeFileSync(path.join(root, "outputs/environment-variables-tags.json"), `${JSON.stringify({ taxonomy_version: taxonomyVersion, threshold: THRESHOLD, tags: vocabulary, items: ordered }, null, 1)}\n`);
console.log(`environment-variables: ${records.length} entries, tags: ${vocabulary.map(t => `${t.id} ${t.count}`).join(", ")}`);
