// Gate check: narrative prose must not carry hand-typed statistics about the reference
// itself ("303 settings keys", "31 tools"), because those go stale when the data changes.
// Such numbers must come from {{count:…}} or {{value:…}} tokens the site build fills in.
// Jev (TypeSafe) judges each numeric prose sentence; verdicts are cached by sentence hash.
//
// Pages regenerated from data on every refresh, and dated snapshots, are exempt; the repo
// lists them in narrative-lint.json: { "exempt": ["outputs/x.md", ...] }.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const cacheFile = new URL("../narrative-lint-cache.json", import.meta.url).pathname;
const sha = text => createHash("sha256").update(text).digest("hex");

function typesafeKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  try {
    const m = readFileSync(path.join(os.homedir(), ".env"), "utf8").match(/^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*["']?([^"'\s]+)/m);
    return m?.[1];
  } catch { return undefined; }
}

// Prose sentences containing a number, outside code fences, inline code, tokens, headings,
// and provenance lines.
export function numericSentences(markdown) {
  const out = [];
  let fence = null;
  for (const line of markdown.split("\n")) {
    const f = line.match(/^\s*(`{3,}|~{3,})/);
    if (f) { if (!fence) fence = f[1]; else if (line.trim().startsWith(fence)) fence = null; continue; }
    if (fence || /^\s*#/.test(line) || /^Source:/.test(line)) continue;
    const prose = line.replace(/`[^`]*`/g, "").replace(/\{\{[^}]*\}\}/g, "");
    for (const sentence of prose.split(/(?<=[.!?])\s+/)) {
      if (/\d/.test(sentence) && sentence.replace(/[^A-Za-z]/g, "").length >= 12) out.push(sentence.trim());
    }
  }
  return out;
}

async function judge(sentence, key) {
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "jev-latest",
      state: { sentence },
      questions: {
        stale_statistic: {
          type: "noul",
          instructions: "This sentence is from a reference page that documents a piece of software (its prompts, settings, tools, or environment variables). Does `sentence` state a count or statistic about the reference's own contents, such as how many items, keys, variables, tools, commands, or entries it lists, or how many are documented or undocumented?",
          criteria: {
            true: "An aggregate count of listed things that would become wrong if the listed data changed, e.g. \"303 settings keys, 41 undocumented\" or \"31 tools in the interactive run\".",
            false: "A fixed fact about the software (a default value, a limit, a timeout, a date, a version in an example), a quoted value, or a number inside an explanation that does not count the reference's own entries."
          }
        }
      }
    })
  });
  if (!response.ok) throw new Error(`TypeSafe ${response.status}`);
  return (await response.json()).answers.stale_statistic.noul;
}

export async function narrativeLint(repo, { threshold = 0.8 } = {}) {
  const key = typesafeKey();
  if (!key) throw new Error("narrative lint needs TYPESAFE_API_KEY");
  const configFile = path.join(repo, "narrative-lint.json");
  const exempt = new Set(existsSync(configFile) ? JSON.parse(readFileSync(configFile, "utf8")).exempt : []);
  const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
  const findings = [];
  for (const name of readdirSync(path.join(repo, "outputs")).filter(f => f.endsWith(".md"))) {
    const rel = `outputs/${name}`;
    if (exempt.has(rel)) continue;
    for (const sentence of numericSentences(readFileSync(path.join(repo, rel), "utf8"))) {
      const k = sha(sentence);
      cache[k] ??= await judge(sentence, key);
      if (cache[k] >= threshold) findings.push({ file: rel, probability: cache[k], sentence });
    }
  }
  writeFileSync(cacheFile, JSON.stringify(cache));
  return findings;
}

// Direct use: node lib/narrative-lint.mjs <repo>
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const findings = await narrativeLint(process.argv[2]);
  for (const f of findings) console.log(`${f.file} (${f.probability.toFixed(2)}): ${f.sentence.slice(0, 200)}`);
  console.log(`${findings.length} sentence(s) state counts that should be {{count:…}} or {{value:…}} tokens`);
}
