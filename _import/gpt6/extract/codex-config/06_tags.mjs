// Tags every config.toml key and environment variable for the site's filters.
//   node extract/codex-config/06_tags.mjs
// Status tags come straight from the records (documented, hidden, feature stage, ...).
// Topic tags, persistent mode first, come from taxonomy.json: an entry gets a tag when the
// evidence seed lists it (persistent mode) or when Jev scores it at or above the threshold.
// Jev verdicts are cached by entry text and taxonomy version, so a refresh only classifies
// new or changed entries. Writes outputs/codex-config-tags.json and codex-env-vars-tags.json.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, "../..");
const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const sha = value => createHash("sha256").update(value).digest("hex");
const taxonomyFile = path.join(here, "taxonomy.json");
const seedFile = path.join(here, "persistent-seed.json");
const taxonomy = existsSync(taxonomyFile) ? readJson(taxonomyFile) : { tags: [] };
const seed = existsSync(seedFile) ? readJson(seedFile) : [];
const cacheFile = path.join(repo, "work", "tag-verdicts.json");
const cache = existsSync(cacheFile) ? readJson(cacheFile) : {};
const taxonomyVersion = sha(JSON.stringify(taxonomy)).slice(0, 12);
const THRESHOLD = 0.7;

const key = process.env.TYPESAFE_API_KEY ?? (() => {
  try { return readFileSync(path.join(os.homedir(), ".env"), "utf8").match(/^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*["']?([^"'\s]+)/m)?.[1]; } catch { return undefined; }
})();

const STATUS = [
  { id: "documented", label: "Documented", kind: "status" },
  { id: "undocumented", label: "Undocumented", kind: "status" },
  { id: "hidden", label: "Hidden or internal", kind: "status" },
  { id: "legacy", label: "Alias, legacy or deprecated", kind: "status" },
  { id: "removed", label: "Removed (no effect)", kind: "status" },
  { id: "rejected", label: "Rejected by this build", kind: "status" },
  { id: "requirements", label: "requirements.toml", kind: "status" },
  { id: "stage-under-development", label: "Feature: under development", kind: "status" },
  { id: "stage-experimental", label: "Feature: experimental", kind: "status" },
  { id: "stage-stable", label: "Feature: stable", kind: "status" },
  { id: "desktop-app", label: "Read by the desktop app", kind: "status" },
  { id: "cli", label: "Read by the CLI", kind: "status" },
  { id: "child-env", label: "Set for child processes", kind: "status" },
  { id: "not-in-build", label: "Not in this build", kind: "status" }
];

function statusTags(item) {
  const t = new Set([item.documented ? "documented" : "undocumented"]);
  const status = String(item.details?.status ?? "");
  if (/hidden|internal/.test(status) || item.group.startsWith("Hidden")) t.add("hidden");
  if (/alias|legacy|deprecated/.test(status)) t.add("legacy");
  if (/^removed/.test(status)) t.add("removed");
  if (/rejected/.test(status) || item.group.startsWith("Documented but not")) t.add("rejected");
  if (item.group.startsWith("Managed requirements")) t.add("requirements");
  const stage = item.details?.stage;
  if (stage === "under development" || stage === "experimental" || stage === "stable") t.add(`stage-${stage.replace(/ /g, "-")}`);
  if (item.kind === "env-var") {
    const readBy = JSON.stringify(item.details?.read_by ?? "");
    if (/desktop/i.test(readBy) || item.group.startsWith("Desktop app")) t.add("desktop-app");
    if (/cli/i.test(readBy) || /CLI/.test(item.group)) t.add("cli");
    if (item.group.startsWith("Set or cleared")) t.add("child-env");
    if (item.group.startsWith("In source only")) t.add("not-in-build");
  }
  return t;
}

function describe(item) {
  const d = item.details ?? {};
  const text = typeof d.description === "string" ? d.description : d.description?.text;
  return {
    name: item.title,
    kind: item.kind === "env-var" ? "environment variable" : "config.toml key",
    group: item.group,
    type: d.type ?? d.read_as ?? null,
    default: d.default ?? null,
    values: d.values ?? null,
    description: text ?? d.source_comment ?? null,
    feature_stage: d.stage ?? null
  };
}

async function topicScores(item) {
  const state = describe(item);
  const cacheKey = `${taxonomyVersion}:${sha(JSON.stringify(state))}`;
  if (cache[cacheKey]) return cache[cacheKey];
  const questions = Object.fromEntries(taxonomy.tags.map(tag => [tag.id, {
    type: "noul",
    instructions: `Does the Codex setting described in \`state\` belong to this topic? Topic: ${tag.label}. ${tag.definition}`,
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

const topics = taxonomy.tags.map((tag, i) => ({ id: tag.id, label: tag.label, kind: "topic", definition: tag.definition, ...(i === 0 ? { feature: true } : {}) }));
const seeded = new Map(seed.map(s => [s.id, s]));
for (const name of ["codex-config", "codex-env-vars"]) {
  const records = readJson(path.join(repo, "outputs", `${name}.json`)).items;
  const items = {};
  const queue = [...records];
  const workers = Array.from({ length: taxonomy.tags.length && key ? 8 : 1 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      const tags = statusTags(item);
      if (taxonomy.tags.length && key) {
        const scores = await topicScores(item);
        for (const [id, p] of Object.entries(scores)) if (p >= THRESHOLD) tags.add(id);
      }
      if (seeded.has(item.id)) tags.add("persistent-mode");
      items[item.id] = [...tags];
    }
  });
  await Promise.all(workers);
  // Workers finish out of order; write entries in record order so reruns don't churn the file.
  const ordered = Object.fromEntries(records.map(record => [record.id, items[record.id]]));
  const used = new Set(Object.values(ordered).flat());
  const vocabulary = [...topics, ...STATUS].filter(t => used.has(t.id)).map(t => ({ ...t, count: Object.values(ordered).filter(list => list.includes(t.id)).length }));
  writeFileSync(path.join(repo, "outputs", `${name}-tags.json`), `${JSON.stringify({ taxonomy_version: taxonomyVersion, threshold: THRESHOLD, tags: vocabulary, items: ordered }, null, 1)}\n`);
  console.log(`${name}: ${records.length} entries, tags: ${vocabulary.map(t => `${t.id} ${t.count}`).join(", ")}`);
}
writeFileSync(cacheFile, JSON.stringify(cache));
