// Jev ranks candidate functions: does this choose one value, or combine values, from more
// than one configuration source? Cached by code hash in work/decision-triage-cache.json.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = new URL("../", import.meta.url).pathname;
// Reads TYPESAFE_API_KEY from `env`, falling back to ~/.env via `readEnvFile` (injected so this
// is testable without touching the real ~/.env or the network).
export function typesafeKey(env, readEnvFile) {
  if (env.TYPESAFE_API_KEY) return env.TYPESAFE_API_KEY;
  try { return readEnvFile().match(/^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*["']?([^"'\s]+)/m)?.[1]; } catch { return undefined; }
}

async function judge(key, cache, c) {
  const code = readFileSync(`${root}work/extracted/${c.file}`, "utf8").slice(c.start, Math.min(c.end, c.start + 6000));
  const k = createHash("sha256").update(code).digest("hex");
  if (cache[k]) return cache[k];
  const state = { function_code: code, knobs_read: c.knobs.map(x => `${x.kind} ${x.name}`) };
  const body = { model: "jev-latest", state, questions: {
    resolves: { type: "noul", instructions: "Minified JavaScript from a CLI tool. Does `function_code` decide one configuration value (or one combined list) by consulting more than one of `knobs_read` in a priority order or by merging them, rather than just reading several unrelated settings in one place?", criteria: { true: "It returns or assigns one resolved value: e.g. env var if set, else setting, else remote flag, else default; or it merges lists from several sources.", false: "It logs, builds a large object from many unrelated knobs, starts up subsystems, or reads each knob for a different purpose." } },
    shape: { type: "choice", instructions: "How does `function_code` combine the sources it reads for its main value?", criteria: { "first-wins": "The first source that is set decides; later ones are fallbacks.", merge: "Values from several sources are combined, such as lists concatenated or objects merged.", neither: "It does not resolve one value from several sources." } }
  } };
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const r = await fetch("https://api.typesafe.ai/v1/systemone", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.status === 429 || r.status >= 500) { await new Promise(res => setTimeout(res, 1000 * 2 ** attempt)); continue; }
    if (!r.ok) throw new Error(`TypeSafe ${r.status}: ${await r.text()}`);
    const a = (await r.json()).answers;
    return (cache[k] = { resolves: a.resolves.noul, shape: a.shape.choice });
  }
  throw new Error("TypeSafe retries exhausted");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const key = typesafeKey(process.env, () => readFileSync(path.join(os.homedir(), ".env"), "utf8"));
  if (!key) throw new Error("decision-triage.mjs needs TYPESAFE_API_KEY");
  const cacheFile = `${root}work/decision-triage-cache.json`;
  const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
  const candidates = JSON.parse(readFileSync(`${root}work/decision-candidates.json`, "utf8"));

  const queue = [...candidates], out = [];
  await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) { const c = queue.shift(); out.push({ id: c.id, file: c.file, start: c.start, name: c.name, knobs: c.knobs, ...(await judge(key, cache, c)) }); } }));
  writeFileSync(cacheFile, JSON.stringify(cache));
  out.sort((a, b) => b.resolves - a.resolves);
  writeFileSync(`${root}work/decision-triage.json`, JSON.stringify(out, null, 1));
  console.log(`${out.filter(c => c.resolves >= 0.7).length} of ${out.length} candidates resolve a value (>= 0.7)`);
}
