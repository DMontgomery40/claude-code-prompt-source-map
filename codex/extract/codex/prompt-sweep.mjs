#!/usr/bin/env node
// Finds model-facing text in the desktop app that the hand-anchored prompt inventory
// (prompts.mjs) does not cover, and publishes it, so a prompt added in an app update is
// visible instead of silently missed.
//
// Candidates come from lib/prompt-candidates.mjs (English prose literals in the app's own
// scripts, translator notes and locale tables excluded); Jev (TypeSafe) judges whether each is
// model-facing, cached by text hash. Writes:
//   outputs/desktop-model-facing-text.md   items Jev rates >= PUBLISH, exact text + provenance
//   work/desktop-model-facing-diff.md      semantic changes against the committed page (absent when none)
//   work/prompt-sweep.md                   every likely item, for review (local)
// and prints one JSON summary line. If Jev is unavailable, new candidates stay unpublished and
// are counted as unclassified; the sweep never fails a refresh for that.
//
// Usage: node extract/codex/prompt-sweep.mjs

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { codexApp } from "./lib/app-layout.mjs";
import { extractAppPrompts } from "./lib/app-prompts.mjs";
import { openAsar } from "./lib/asar.mjs";
import { privacyScan } from "./lib/privacy.mjs";
import { promptCandidates } from "./lib/prompt-candidates.mjs";
import { renderChangedDocuments, semanticDiff } from "./lib/semantic-diff.mjs";
import { execFileSync } from "node:child_process";
import { functionHelperPrompts, staticHelperPrompts, voicePrompts } from "./prompts.mjs";

const repo = path.resolve(import.meta.dirname, "..", "..");
const work = path.join(repo, "work");
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const LIKELY = 0.5;
const PUBLISH = 0.8;
const PAGE = "desktop-model-facing-text.md";
const QUESTION_VERSION = "v1";

const app = codexApp();
const asar = openAsar(app.asar);
const extracted = extractAppPrompts(asar);
// Texts other generated pages already publish (their coverage files) are not repeated here.
const coverageTexts = fs.readdirSync(path.join(repo, "outputs"))
  .filter(name => /^(?:chatgpt-.*-prompts|desktop-tool-manifest)\.json$/.test(name))
  .flatMap(name => {
    const data = readJson(path.join(repo, "outputs", name), []);
    const items = Array.isArray(data) ? data : data.items ?? data.tools ?? [];
    return items.flatMap(item => [item.text, item.description].filter(text => typeof text === "string" && text.length));
  });
const known = [...extracted.staticHelpers, ...extracted.functionHelpers, ...extracted.voice].map(item => item.text).concat(coverageTexts);
const anchors = [...staticHelperPrompts, ...functionHelperPrompts, ...voicePrompts].map(spec => spec.anchor);
const candidates = promptCandidates(asar, { known, anchors });

const key = process.env.TYPESAFE_API_KEY ?? (() => {
  try { return fs.readFileSync(path.join(os.homedir(), ".env"), "utf8").match(/^\s*(?:export\s+)?TYPESAFE_API_KEY\s*=\s*["']?([^"'\s]+)/m)?.[1]; } catch { return undefined; }
})();
const cacheFile = path.join(work, "prompt-candidate-verdicts.json");
const cache = readJson(cacheFile, {});
const question = {
  model_facing: {
    type: "noul",
    instructions: "Is `state.text` written to be sent to an AI language model as instructions or context (a system or developer prompt, a tool description, or a template the app fills in and sends to a model), rather than text shown to people (UI labels, onboarding or marketing copy, help and documentation, notifications, error messages, legal text) or code, SQL, markup or data? `state.file` is the bundle file it was found in.",
    criteria: {
      true: "Model-facing: it addresses the model (e.g. 'You are…', 'Do not…', 'Respond with…'), describes a tool or its parameters for the model, or frames context and rules for a model.",
      false: "Human-facing or not natural-language prose: UI or help text, docs, notifications, errors, code, SQL, markup, or data."
    }
  }
};
let unavailable = null;
async function verdict(candidate) {
  const cacheKey = `${QUESTION_VERSION}:${candidate.hash}`;
  if (cacheKey in cache) return cache[cacheKey];
  if (!key || unavailable) return null;
  const state = { file: candidate.file, text: candidate.text.slice(0, 6000) };
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch("https://api.typesafe.ai/v1/systemone", {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ model: "jev-latest", state, questions: question })
      });
      if (response.status === 429 || response.status >= 500) { await new Promise(r => setTimeout(r, 1000 * 2 ** attempt)); continue; }
      if (!response.ok) { unavailable = `TypeSafe ${response.status}`; return null; }
      const p = (await response.json()).answers.model_facing.noul;
      cache[cacheKey] = p;
      return p;
    } catch (error) {
      unavailable = error.message;
      return null;
    }
  }
  unavailable = "TypeSafe retries exhausted";
  return null;
}
const queue = [...candidates];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) { const candidate = queue.shift(); candidate.p = await verdict(candidate); }
}));
fs.writeFileSync(cacheFile, JSON.stringify(cache));

const snippet = text => text.replace(/\s+/g, " ").trim().slice(0, 160);
fs.writeFileSync(path.join(work, "prompt-candidates.json"), `${JSON.stringify({ asar_sha256: asar.sha256, candidates: candidates.map(c => ({ hash: c.hash, file: c.file, role: c.role, p: c.p, snippet: snippet(c.text) })) }, null, 1)}\n`);

// The published page: grouped by how the text is used, ordered by file and offset. File names
// carry build hashes, so they sit in the Source line, which the semantic diff treats as provenance.
const GROUPS = [
  ["Tool and parameter descriptions", c => /^(?:tool-description|description|toolDescription|server_instructions)$/.test(c.role.kind)],
  ["Starter and prefilled messages", c => /^(?:defaultMessage|prompt|[a-z]+Prompt)$/.test(c.role.kind)],
  ["Prompts, rules and context", () => true]
];
const withheld = [];
const published = candidates.filter(c => c.p != null && c.p >= PUBLISH).filter(c => {
  try { privacyScan(new Map([["item", c.text]])); return true; } catch (error) { withheld.push({ hash: c.hash, reason: error.message }); return false; }
}).sort((a, b) => a.file.localeCompare(b.file) || a.offset - b.offset);
const fence = text => "`".repeat(Math.max(3, 1 + Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))));
const titleOf = c => c.role.tool ? `\`${c.role.tool}\`` : `${c.text.replace(/<…>/g, "").replace(/[#*`_>\[\]]/g, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ")}…`;
const lines = ["# Other model-facing text in the desktop app", "",
  "Text in the ChatGPT desktop app's own scripts that is written for a model (tool and parameter descriptions, prompts, context wrappers, and messages the app sends on the user's behalf) and is not in the hand-verified prompt pages. It is found by scanning every string in the app for prose and keeping what a classifier judges model-facing, so treat each entry as exact text from the app whose role was judged, not traced. `<…>` marks a value filled in at run time.", ""];
const taken = new Set();
for (const [group, test] of GROUPS) {
  const members = published.filter(c => !taken.has(c.hash) && test(c));
  if (!members.length) continue;
  members.forEach(c => taken.add(c.hash));
  lines.push(`## ${group}`, "");
  const seen = new Map();
  for (const c of members) {
    const title = titleOf(c);
    const n = (seen.get(title) ?? 0) + 1;
    seen.set(title, n);
    const f = fence(c.text);
    lines.push(`### ${n > 1 ? `${title} (${n})` : title}`, "",
      `Source: \`${c.file}\`, offset ${c.offset}, SHA-256 \`${crypto.createHash("sha256").update(c.text).digest("hex")}\`.`, "",
      `${f}text`, c.text.trim(), f, "");
  }
}
const page = `${lines.join("\n").trimEnd()}\n`;
const committed = (() => { try { return execFileSync("git", ["show", `HEAD:outputs/${PAGE}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } })();
const changes = renderChangedDocuments(semanticDiff(new Map(committed == null ? [] : [[PAGE, committed]]), new Map([[PAGE, page]])));
const diffFile = path.join(work, "desktop-model-facing-diff.md");
if (changes) fs.writeFileSync(diffFile, `# Desktop app: other model-facing text\n\n${changes}`);
else fs.rmSync(diffFile, { force: true });
fs.writeFileSync(path.join(repo, "outputs", PAGE), page);

const likely = candidates.filter(c => c.p != null && c.p >= LIKELY).sort((a, b) => b.p - a.p);
const unclassified = candidates.filter(c => c.p == null);
const report = ["# Prompt sweep (local review)", "",
  `Candidates: ${candidates.length}; likely model-facing (Jev >= ${LIKELY}): ${likely.length}; published (>= ${PUBLISH}): ${published.length}; withheld by the privacy scan: ${withheld.length}; unclassified: ${unclassified.length}${unavailable ? ` (${unavailable})` : ""}.`, ""];
for (const c of [...likely, ...unclassified]) {
  report.push(`## ${c.p == null ? "unclassified" : c.p.toFixed(2)} · ${c.role.kind} · ${c.file} @ ${c.offset} · ${c.hash}`, "", "```text", c.text.slice(0, 4000), "```", "");
}
fs.writeFileSync(path.join(work, "prompt-sweep.md"), `${report.join("\n")}\n`);
console.log(JSON.stringify({ candidates: candidates.length, likely: likely.length, published: published.length, withheld: withheld.length, unclassified: unclassified.length, jev_unavailable: unavailable, changed: Boolean(changes) }));
