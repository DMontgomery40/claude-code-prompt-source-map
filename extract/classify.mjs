// Classifies every prose literal found in the binary by its audience, using TypeSafe's
// Jev model. Results feed the inventory, so omissions from the published documents are
// detectable. Requires TYPESAFE_API_KEY. Verdicts are cached in work/jev-verdicts.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { sha256 } from "./lib.mjs";

const root = new URL("../work/", import.meta.url).pathname;
const candidates = JSON.parse(readFileSync(`${root}candidates.json`, "utf8"));
// Bump the file name when the question changes; verdicts are cached by text hash.
const cacheFile = `${root}jev-verdicts-v2.json`;
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
const criteria = {
  model: "Sent to the AI model while Claude Code runs: a prompt or instructions, a tool or tool-parameter description, an agent or skill definition, an injected reminder, or a tool result or error message returned to the model.",
  developer_docs: "Documentation for developers: SDK or API type descriptions, JSON schema or settings field descriptions shown in an editor, or code comments.",
  human_user: "Shown to the person using the CLI: UI copy, help text, onboarding, warnings, or error messages.",
  library: "Text from a bundled third-party library, license, or generic documentation unrelated to Claude Code.",
  other: "Anything else, such as test fixtures, sample data, or code."
};

async function classify(text) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: "jev-latest",
        state: { text: text.slice(0, 6000) },
        questions: { audience: { type: "choice", instructions: "This string was found inside the Claude Code CLI program. Who is `text` written for?", criteria } }
      })
    });
    if (response.status === 429 || response.status >= 500) { await new Promise(r => setTimeout(r, 1000 * 2 ** attempt)); continue; }
    if (!response.ok) throw new Error(`TypeSafe ${response.status}: ${await response.text()}`);
    const body = await response.json();
    const answer = body.answers.audience;
    return { audience: answer.choice, confidence: answer.confidence, probabilities: answer.probabilities, model: body.model };
  }
  throw new Error("TypeSafe retries exhausted");
}

const unique = [...new Map(candidates.map(c => [sha256(c.text), c.text])).entries()].filter(([hash]) => !cache[hash]);
let done = 0;
async function worker() {
  while (unique.length) {
    const [hash, text] = unique.pop();
    cache[hash] = await classify(text);
    if (++done % 200 === 0) { writeFileSync(cacheFile, JSON.stringify(cache)); console.log(done, "classified"); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
writeFileSync(cacheFile, JSON.stringify(cache));
const counts = {};
for (const c of candidates) { const a = cache[sha256(c.text)].audience; counts[a] = (counts[a] ?? 0) + 1; }
console.log("candidates", candidates.length, "unique", Object.keys(cache).length, counts);
