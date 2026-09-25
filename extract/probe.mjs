// Tests decision ladders against the real binary. For every case the expected value comes
// from site/src/ladder-eval.mjs, the same code the page runs. A rung is "tested" when a
// passing case exercises it; a failing case marks the decision for review.
//   node extract/probe.mjs [--only <id>] [path/to/claude]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateLadder, exercisedRungs } from "../site/src/ladder-eval.mjs";
import { readDecisions, writeDecisions } from "./decisions-lib.mjs";
import { VERSION } from "./lib.mjs";
import { casesFor, observers, runClaude, startRecorder } from "./probe-lib.mjs";

const root = new URL("../", import.meta.url).pathname;
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const binary = process.argv.slice(2).find(a => !a.startsWith("--") && a !== only) ?? path.join(root, "work/releases", VERSION, "package/claude");
if (!existsSync(binary)) { console.error(`no binary at ${binary}`); process.exit(2); }

const decisions = readDecisions(root);
const recorder = await startRecorder();
const results = [];
let failed = 0;
for (const d of decisions) {
  if (only && d.id !== only) continue;
  if (!d.observe || d.observe === "none") continue;
  const tested = new Set(), failures = [];
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
  for (const r of d.rungs) if (r.mechanism !== "remote") r.verified = tested.has(r.id) ? "tested" : "read";
  if (failures.length) { d.needs_review = true; d.details = { ...d.details, probe_failures: failures }; failed += 1; }
  else if (d.details?.probe_failures) { delete d.details.probe_failures; delete d.needs_review; }
  console.log(`${d.id}: ${failures.length ? `FAIL ${failures.length}` : "ok"}, tested ${[...tested].join(", ") || "none"}`);
}
recorder.close();
writeDecisions(root, decisions, VERSION);
writeFileSync(path.join(root, "work/probe-results.json"), JSON.stringify(results, null, 1));
process.exit(failed ? 3 : 0);
