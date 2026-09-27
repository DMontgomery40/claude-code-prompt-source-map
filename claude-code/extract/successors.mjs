// For each record whose text changed between builds, find the new text that replaced it.
// Cheap word-shingle overlap shortlists candidates among literals that are new in this
// build; Jev (TypeSafe) then chooses which candidate, if any, is the revised version.
// Output feeds the update report so the reviewing agent starts from exact old -> new pairs.
//   node extract/successors.mjs <previous-work-dir> <new-work-dir>
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { indexExtraction } from "./literals.mjs";

const [prevDir, newDir] = process.argv.slice(2);
const report = JSON.parse(readFileSync(path.join(newDir, "relocation-report.json"), "utf8"));
const changed = Object.values(report.areas).flatMap(a => a.changed).filter(c => c.old_text && c.old_text.length >= 40);
if (!changed.length || !process.env.TYPESAFE_API_KEY) {
  writeFileSync(path.join(newDir, "successors.json"), "[]\n");
  console.log(JSON.stringify({ pairs: 0, reason: changed.length ? "no TYPESAFE_API_KEY" : "nothing changed" }));
  process.exit(0);
}

const prevIndex = indexExtraction(prevDir);
const newIndex = indexExtraction(newDir);
const fresh = [...newIndex.byNorm.entries()].filter(([norm]) => norm.length >= 40 && !prevIndex.byNorm.has(norm)).map(([norm, list]) => ({ norm, at: list[0] }));
const shingles = text => { const w = text.toLowerCase().match(/[a-z0-9_]+/g) ?? []; const s = new Set(); for (let i = 0; i + 2 < w.length; i += 1) s.add(`${w[i]} ${w[i + 1]} ${w[i + 2]}`); return s; };
const freshShingles = fresh.map(f => shingles(f.norm.slice(0, 20000)));

async function choose(oldText, candidates) {
  const criteria = Object.fromEntries(candidates.map((c, i) => [`candidate_${i + 1}`, c.norm.slice(0, 1500)]));
  criteria.none = "None of the candidates is a revised version of the old text.";
  const response = await fetch("https://api.typesafe.ai/v1/systemone", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "jev-latest",
      state: { old_text: oldText.slice(0, 3000) },
      questions: { successor: { type: "choice", instructions: "A prompt string in a software release was edited in the next release. Which candidate is the edited version of `old_text` (same purpose and mostly the same wording, with some changes)?", criteria } }
    })
  });
  if (!response.ok) throw new Error(`TypeSafe ${response.status}`);
  return (await response.json()).answers.successor;
}

const pairs = [];
for (const c of changed) {
  const mine = shingles(c.old_text);
  if (!mine.size) continue;
  const scored = fresh.map((f, i) => [f, [...mine].filter(x => freshShingles[i].has(x)).length / mine.size]).filter(([, s]) => s >= 0.2).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!scored.length) { pairs.push({ ...c, successor: null, confidence: null }); continue; }
  const answer = await choose(c.old_text, scored.map(([f]) => f));
  const pick = answer.choice === "none" ? null : scored[Number(answer.choice.split("_")[1]) - 1][0];
  pairs.push({ area: c.area, id: c.id, title: c.title, old_text: c.old_text, successor: pick ? pick.norm : null, successor_file: pick?.at.file ?? null, confidence: answer.confidence });
}
writeFileSync(path.join(newDir, "successors.json"), `${JSON.stringify(pairs, null, 1)}\n`);
console.log(JSON.stringify({ pairs: pairs.filter(p => p.successor).length, unmatched: pairs.filter(p => !p.successor).length }));
