#!/usr/bin/env node
// Finds model-facing text in the desktop app that the hand-anchored prompt inventory
// (prompts.mjs) does not cover, and publishes it, so a prompt added in an app update is
// visible instead of silently missed.
//
// Candidates come from lib/prompt-candidates.mjs (English prose literals in the app's own
// scripts, translator notes and locale tables excluded); Jev (TypeSafe) judges whether each is
// model-facing, cached by text hash. Explicit local source reviews in prompt-reviews.mjs
// use independent boolean decisions and never populate the Jev probability cache. Writes:
//   outputs/desktop-model-facing-text.md   local positives or Jev >= PUBLISH, text + provenance
//   work/desktop-model-facing-diff.md      semantic changes against the committed page (absent when none)
//   work/prompt-sweep.md                   every likely item, for review (local)
// and prints one JSON summary line. If Jev is unavailable, unreviewed new candidates stay unpublished and
// are counted as unclassified; the sweep never fails a refresh for that.
//
// Usage: node extract/codex/prompt-sweep.mjs

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { codexApp } from "./lib/app-layout.mjs";
import { extractAppPrompts } from "./lib/app-prompts.mjs";
import { openAsar } from "./lib/asar.mjs";
import { privacyScan } from "./lib/privacy.mjs";
import { promptCandidates } from "./lib/prompt-candidates.mjs";
import { renderChangedDocuments, semanticDiff } from "./lib/semantic-diff.mjs";
import { execFileSync } from "node:child_process";
import { functionHelperPrompts, staticHelperPrompts, voicePrompts } from "./prompts.mjs";
import { JevUnavailableError, decisionConfig, openCache } from "./lib/jev-provider.mjs";
import { modelFacing, verdictKey } from "./lib/prompt-verdict.mjs";
import { candidateDecision, localReviewFor, publishDecision } from "./prompt-reviews.mjs";

const repo = path.resolve(import.meta.dirname, "..", "..");
const work = path.join(repo, "work");
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; } };
const LIKELY = 0.5;
const PUBLISH = 0.8;
const PAGE = "desktop-model-facing-text.md";

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

const config = decisionConfig();
const cacheFile = path.join(work, "prompt-candidate-verdicts.json");
const cache = openCache(cacheFile);
let unavailable = process.env.JEV_OFFLINE === "1" ? "offline review; candidates without cached Jev or explicit local decisions remain unclassified" : null;
// A cached verdict, or a new one through ask() (which retries). Once Jev is unavailable the rest
// stay unclassified for this run; a malformed request (JevRequestError) fails the sweep.
async function verdict(candidate) {
  const cacheKey = verdictKey(candidate.hash);
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  if (unavailable) return null;
  const state = { file: candidate.file, text: candidate.text.slice(0, 6000) };
  try { privacyScan(new Map([["classification state", JSON.stringify(state)]])); }
  catch { return null; }
  try {
    return cache.set(cacheKey, await modelFacing(config, state));
  } catch (error) {
    if (!(error instanceof JevUnavailableError)) throw error;
    unavailable ??= error.reason;
    return null;
  }
}
const queue = [...candidates];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const candidate = queue.shift();
    const local = localReviewFor(candidate);
    // Local boolean judgments never enter the Jev probability cache or trigger a request.
    const p = local ? cache.get(verdictKey(candidate.hash)) ?? null : await verdict(candidate);
    Object.assign(candidate, candidateDecision(candidate, p));
  }
}));
cache.save();

const snippet = text => text.replace(/\s+/g, " ").trim().slice(0, 160);
fs.writeFileSync(path.join(work, "prompt-candidates.json"), `${JSON.stringify({ asar_sha256: asar.sha256, candidates: candidates.map(c => ({ hash: c.hash, file: c.file, role: c.role, p: c.p, origin: c.origin, model_facing: c.model_facing, local_review: c.review, snippet: snippet(c.text) })) }, null, 1)}\n`);

// The published page: grouped by how the text is used, ordered by file and offset. File names
// carry build hashes, so they sit in the Source line, which the semantic diff treats as provenance.
const GROUPS = [
  ["Tool and parameter descriptions", c => /^(?:tool-description|description|toolDescription|server_instructions)$/.test(c.role.kind)],
  ["Starter and prefilled messages", c => /^(?:defaultMessage|prompt|[a-z]+Prompt)$/.test(c.role.kind)],
  ["Prompts, rules and context", () => true]
];
const withheld = [];
const published = candidates.filter(c => publishDecision(c, PUBLISH)).filter(c => {
  try { privacyScan(new Map([["item", c.text]])); return true; } catch (error) { withheld.push({ hash: c.hash, reason: error.message }); return false; }
}).sort((a, b) => a.file.localeCompare(b.file) || a.offset - b.offset);
const fence = text => "`".repeat(Math.max(3, 1 + Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))));
const titleOf = c => c.role.tool ? `\`${c.role.tool}\`` : `${c.text.replace(/<…>/g, "").replace(/[#*`_>\[\]]/g, "").replace(/\s+/g, " ").trim().split(" ").slice(0, 7).join(" ")}…`;
const lines = ["# Other model-facing text in the desktop app", "",
  "Text in the ChatGPT desktop app's own scripts that is written for a model (tool and parameter descriptions, prompts, context wrappers, and messages the app sends on the user's behalf) and is not in the hand-verified prompt pages. It is found by scanning every string in the app for prose and keeping explicit local source reviews or Jev classifier results. Each entry identifies its decision origin. Treat the text as shipped app evidence whose model-facing role was reviewed or classified; UI activation, account availability and live model delivery are unverified. `<…>` marks a value filled in at run time.", ""];
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
      c.origin === "local-source-review" ? `Role: local source review (boolean decision, not a confidence score). ${c.review.reason}` : `Role: Jev classification (${c.p.toFixed(2)} confidence); execution path unverified.`, "",
      `${f}text`, c.text.trim(), f, "");
  }
}
const page = `${lines.join("\n").trimEnd()}\n`;
const committed = (() => { try { return execFileSync("git", ["show", `HEAD:./outputs/${PAGE}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }); } catch { return null; } })();
const changes = renderChangedDocuments(semanticDiff(new Map(committed == null ? [] : [[PAGE, committed]]), new Map([[PAGE, page]])));
const diffFile = path.join(work, "desktop-model-facing-diff.md");
if (changes) fs.writeFileSync(diffFile, `# Desktop app: other model-facing text\n\n${changes}`);
else fs.rmSync(diffFile, { force: true });
fs.writeFileSync(path.join(repo, "outputs", PAGE), page);

const likely = candidates.filter(c => c.origin === "local-source-review" ? c.model_facing === true : c.p != null && c.p >= LIKELY).sort((a, b) => b.p - a.p);
const unclassified = candidates.filter(c => c.origin === "unknown");
const localReviewed = candidates.filter(c => c.origin === "local-source-review");
const localPositive = localReviewed.filter(c => c.model_facing);
const localNegative = localReviewed.filter(c => !c.model_facing);
const report = ["# Prompt sweep (local review)", "",
  `Candidates: ${candidates.length}; likely model-facing (local positive or Jev >= ${LIKELY}): ${likely.length}; published (local positive or Jev >= ${PUBLISH}): ${published.length}; local reviewed: ${localReviewed.length} (${localPositive.length} positive, ${localNegative.length} negative); withheld by the privacy scan: ${withheld.length}; unclassified: ${unclassified.length}${unavailable ? ` (${unavailable})` : ""}.`, ""];
for (const c of [...likely, ...localNegative, ...unclassified]) {
  report.push(`## ${c.origin === "local-source-review" ? `local ${c.model_facing ? "positive" : "negative"}` : c.p == null ? "unclassified" : `Jev ${c.p.toFixed(2)}`} · ${c.role.kind} · ${c.file} @ ${c.offset} · ${c.hash}`, "", ...(c.review ? [c.review.reason, ""] : []), "```text", c.text.slice(0, 4000), "```", "");
}
fs.writeFileSync(path.join(work, "prompt-sweep.md"), `${report.join("\n")}\n`);
console.log(JSON.stringify({ candidates: candidates.length, likely: likely.length, published: published.length, withheld: withheld.length, unclassified: unclassified.length, local_reviewed: localReviewed.length, local_positive: localPositive.length, local_negative: localNegative.length, jev_unavailable: unavailable, changed: Boolean(changes) }));
