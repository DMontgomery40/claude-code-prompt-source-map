// Tests decision ladders against the real binary. For every case the expected value comes
// from site/src/ladder-eval.mjs, the same code the page runs. A rung is "tested" when a
// passing case exercises it; a failing case marks the decision for review.
//   node extract/probe.mjs [--only <id>] [path/to/claude]
// A draft can be tested the same way without publishing it (parallel tracing agents share no
// writable state): it writes nothing, neither outputs/decisions.json nor work/probe-results.json.
//   node extract/probe.mjs --draft work/decisions/<id>.json [path/to/claude]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { compile } from "./decision-author.mjs";
import { evaluateLadder, exercisedRungs } from "../site/src/ladder-eval.mjs";
import { knobIndex, readDecisions, validateDecision, writeDecisions } from "./decisions-lib.mjs";
import { VERSION } from "./lib.mjs";
import { applyProbeOutcome, casesFor, observers, runClaude, startRecorder } from "./probe-lib.mjs";

const root = new URL("../", import.meta.url).pathname;
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const draftPath = process.argv.includes("--draft") ? process.argv[process.argv.indexOf("--draft") + 1] : null;
const binary = process.argv.slice(2).find(a => !a.startsWith("--") && a !== only && a !== draftPath) ?? path.join(root, "work/releases", VERSION, "package/claude");
if (!existsSync(binary)) { console.error(`no binary at ${binary}`); process.exit(2); }

async function runCases(d, recorder) {
  const tested = new Set(), failures = [], results = [];
  for (const c of casesFor(d)) {
    recorder.take();
    await runClaude(binary, { ...c, port: recorder.port });
    let main = recorder.take().find(r => r.body.tools?.length) ?? null;
    if (!main) { recorder.take(); await runClaude(binary, { ...c, port: recorder.port }); main = recorder.take().find(r => r.body.tools?.length) ?? null; }
    const expected = evaluateLadder(d, c.scenario).value;
    const got = main ? observers[d.observe](main.body, main.beta) : "no request";
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    results.push({ decision: d.id, case: c.name, expected, got, pass });
    if (pass) for (const id of exercisedRungs(d, c.scenario)) tested.add(id);
    else failures.push(`${c.name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}`);
  }
  return { tested, failures, results };
}

if (draftPath) {
  const draft = JSON.parse(readFileSync(draftPath, "utf8"));
  const knobs = knobIndex(root);
  const record = compile(draft, knobs);
  const errors = validateDecision(record, new Set(knobs.keys()));
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  const recorder = await startRecorder();
  const { tested, failures, results } = await runCases(record, recorder);
  recorder.close();
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.case}  expected ${JSON.stringify(r.expected)} got ${JSON.stringify(r.got)}`);
  console.log(`${record.id}: ${failures.length ? `FAIL ${failures.length}` : "ok"}, tested ${[...tested].join(", ") || "none"}`);
  process.exit(failures.length ? 3 : 0);
}

const decisions = readDecisions(root);
const recorder = await startRecorder();
const results = [];
let failed = 0;
for (const d of decisions) {
  if (only && d.id !== only) continue;
  if (!d.observe || d.observe === "none") continue;
  const { tested, failures, results: caseResults } = await runCases(d, recorder);
  results.push(...caseResults);
  applyProbeOutcome(d, { tested, failures });
  if (failures.length) failed += 1;
  console.log(`${d.id}: ${failures.length ? `FAIL ${failures.length}` : "ok"}, tested ${[...tested].join(", ") || "none"}`);
}
recorder.close();
writeDecisions(root, decisions, VERSION);
writeFileSync(path.join(root, "work/probe-results.json"), JSON.stringify(results, null, 1));
process.exit(failed ? 3 : 0);
