// Classifies every prose literal found in the binary by its audience, using TypeSafe's
// Jev model. Results feed the inventory, so omissions from the published documents are
// detectable. Needs a Jev key (see codex/extract/codex/lib/jev-provider.mjs). Verdicts are cached
// in work/jev-verdicts-v2.json; when Jev is unavailable it keeps them and exits 75.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ask, decisionConfig, openCache } from "../../codex/extract/codex/lib/jev-provider.mjs";
import { keepVerdicts } from "./jev-step.mjs";

const root = new URL("../work/", import.meta.url).pathname;
// Bump the file name when the question changes; verdicts are cached by text hash.
export const cacheFile = `${root}jev-verdicts-v2.json`;
export const verdictKey = text => createHash("sha256").update(text).digest("hex");
const criteria = {
  model: "Sent to the AI model while Claude Code runs: a prompt or instructions, a tool or tool-parameter description, an agent or skill definition, an injected reminder, or a tool result or error message returned to the model.",
  developer_docs: "Documentation for developers: SDK or API type descriptions, JSON schema or settings field descriptions shown in an editor, or code comments.",
  human_user: "Shown to the person using the CLI: UI copy, help text, onboarding, warnings, or error messages.",
  library: "Text from a bundled third-party library, license, or generic documentation unrelated to Claude Code.",
  other: "Anything else, such as test fixtures, sample data, or code."
};

// One verdict, in the shape inventory.mjs reads: { audience, confidence, probabilities, model }.
export async function classify(config, text, options) {
  const body = await ask(config, {
    state: { text: text.slice(0, 6000) },
    questions: { audience: { type: "choice", instructions: "This string was found inside the Claude Code CLI program. Who is `text` written for?", criteria } }
  }, options);
  const answer = body.answers.audience;
  return { audience: answer.choice, confidence: answer.confidence, probabilities: answer.probabilities, model: body.model };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = decisionConfig();
  const candidates = JSON.parse(readFileSync(`${root}candidates.json`, "utf8"));
  const cache = openCache(cacheFile);
  const unique = [...new Map(candidates.map(c => [verdictKey(c.text), c.text])).entries()].filter(([hash]) => !cache.has(hash));
  let done = 0;
  await keepVerdicts(cache, () => Promise.all(Array.from({ length: 8 }, async () => {
    while (unique.length) {
      const [hash, text] = unique.pop();
      cache.set(hash, await classify(config, text));
      if (++done % 200 === 0) { cache.save(); console.log(done, "classified"); }
    }
  })));
  const counts = {};
  for (const c of candidates) { const a = cache.get(verdictKey(c.text)).audience; counts[a] = (counts[a] ?? 0) + 1; }
  console.log("candidates", candidates.length, "unique", cache.size, counts);
}
