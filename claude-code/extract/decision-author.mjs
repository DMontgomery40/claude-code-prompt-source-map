// Turns a drafted decision (anchors: where in the extracted code each rung is made true)
// into a published record: provenance with binary offsets and hashes, validated, upserted
// into outputs/decisions.json. Tracing agents write drafts; this is the only writer.
//   node extract/decision-author.mjs work/decisions/<id>.json [--dry-run]
import { readFileSync } from "node:fs";
import * as walk from "acorn-walk";
import { parse, provenance, source, VERSION } from "./lib.mjs";
import { knobIndex, readDecisions, validateDecision, writeDecisions } from "./decisions-lib.mjs";

const root = new URL("../", import.meta.url).pathname;

export function anchorRange(src, { find, span = "text", occurrence }) {
  const hits = [];
  for (let i = src.indexOf(find); i >= 0; i = src.indexOf(find, i + 1)) hits.push(i);
  if (!hits.length) throw new Error(`anchor not found: ${JSON.stringify(find.slice(0, 60))}`);
  if (hits.length > 1 && occurrence === undefined) throw new Error(`anchor ${JSON.stringify(find.slice(0, 60))} occurs ${hits.length} times; give "occurrence" (1-based)`);
  const at = hits[(occurrence ?? 1) - 1];
  if (at === undefined) throw new Error(`anchor occurrence ${occurrence} does not exist`);
  if (span === "text") return [at, at + find.length];
  let best = null;
  walk.full(parse(src), node => {
    if (!/Function/.test(node.type) || node.start > at || node.end < at + find.length) return;
    if (!best || node.end - node.start < best.end - best.start) best = node;
  });
  if (!best) throw new Error(`no function encloses ${JSON.stringify(find.slice(0, 60))}`);
  return [best.start, best.end];
}

export function resolveAnchor(anchor) {
  const src = source(anchor.file);
  const [start, end] = anchorRange(src, anchor);
  return provenance(anchor.file, src, start, end);
}

export function compile(draft, knobs) {
  // Each range keeps its anchor's span: relocation treats a "function" range as the decision
  // itself (see decision-change.mjs).
  const toProv = anchors => (anchors ?? []).map(a => ({ ...resolveAnchor(a), span: a.span ?? "text" }));
  const { anchors, ...rest } = draft;
  return {
    ...rest,
    kind: "decision",
    text: null,
    documented: draft.documented ?? null,
    details: draft.details ?? {},
    provenance: toProv(anchors),
    rungs: draft.rungs.map(({ anchors: a, ...r }) => ({ verified: "read", ...r, label: r.label ?? knobs.get(r.knob)?.title, provenance: toProv(a) })),
    bypasses: (draft.bypasses ?? []).map(({ anchors: a, ...b }) => ({ ...b, provenance: toProv(a) })),
    constraints: (draft.constraints ?? []).map(({ anchors: a, ...c }) => ({ ...c, provenance: toProv(a) }))
  };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const draft = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const knobs = knobIndex(root);
  const record = compile(draft, knobs);
  const errors = validateDecision(record, new Set(knobs.keys()));
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  if (process.argv.includes("--dry-run")) { console.log(JSON.stringify(record, null, 1)); process.exit(0); }
  const items = readDecisions(root).filter(d => d.id !== record.id);
  writeDecisions(root, [...items, record], VERSION);
  console.log(`${record.id}: ${record.rungs.length} rungs written`);
}
