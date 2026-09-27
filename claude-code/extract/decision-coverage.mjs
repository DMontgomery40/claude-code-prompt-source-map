// Every env var, settings key and CLI flag either feeds a decision ladder or says why not.
// Writes outputs/decisions-index.json, which the site uses for "Feeds:" links and a test
// uses to enforce the rule.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readDecisions } from "./decisions-lib.mjs";

const root = new URL("../", import.meta.url).pathname;
const ACTION_FLAGS = new Set(["-h, --help", "-v, --version"]);
const LAYERS = { decision: "settings-layers", title: "Where a setting's value comes from", rung: null, rank: null, of: null };

export function coverageStatus(knob, { rungsByKnob, candidateKnobs }) {
  const feeds = [...(rungsByKnob.get(knob.id) ?? [])];
  if (knob.area === "settings" && knob.kind === "setting") feeds.push(LAYERS);
  if (rungsByKnob.has(knob.id)) return { status: "rung", feeds };
  if (knob.area === "settings") return { status: knob.kind === "setting" ? "layered" : "action", feeds };
  if (knob.area === "cli" && (knob.kind === "cli-command" || ACTION_FLAGS.has(knob.title))) return { status: "action", feeds };
  if (knob.area === "environment-variables") {
    if (knob.details?.direction === "set") return { status: "set-only", feeds };
    if (knob.group?.startsWith("Read only by bundled third-party")) return { status: "third-party", feeds };
    if (knob.group?.startsWith("Shell, terminal, OS")) return { status: "os-shell", feeds };
  }
  return { status: candidateKnobs.has(knob.id) ? "pending" : "standalone", feeds };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const readJson = f => JSON.parse(readFileSync(`${root}${f}`, "utf8"));
  const rungsByKnob = new Map();
  for (const d of readDecisions(root)) {
    const visible = d.rungs;
    visible.forEach((r, i) => {
      if (!r.knob) return;
      (rungsByKnob.get(r.knob) ?? rungsByKnob.set(r.knob, []).get(r.knob)).push({ decision: d.id, title: d.title, rung: r.id, rank: i + 1, of: visible.length });
    });
    for (const b of d.bypasses ?? []) (rungsByKnob.get(b.knob) ?? rungsByKnob.set(b.knob, []).get(b.knob)).push({ decision: d.id, title: d.title, rung: b.id, rank: 0, of: visible.length });
  }
  const traced = new Set(readDecisions(root).flatMap(d => d.details?.candidate ? [d.details.candidate] : []));
  const candidates = existsSync(`${root}work/decision-candidates.json`) ? readJson("work/decision-candidates.json") : [];
  const candidateKnobs = new Set(candidates.filter(c => !traced.has(c.id)).flatMap(c => c.knobs.map(k => k.record).filter(Boolean)));
  const items = [];
  for (const area of ["environment-variables", "settings", "cli"]) {
    for (const r of readJson(`outputs/${area}.json`).items) items.push({ id: r.id, ...coverageStatus({ ...r, area }, { rungsByKnob, candidateKnobs }) });
  }
  writeFileSync(`${root}outputs/decisions-index.json`, `${JSON.stringify({ items }, null, 1)}\n`);
  const counts = items.reduce((m, i) => ({ ...m, [i.status]: (m[i.status] ?? 0) + 1 }), {});
  console.log(`decisions-index: ${items.length} knobs, ${JSON.stringify(counts)}`);
}
