// Decision records ("what wins") share the record contract of every other area and add a
// ladder: rungs in priority order, each tied to a knob record and to the code that makes it
// true. site/src/ladder-eval.mjs evaluates them; extract/probe.mjs tests them.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export const MECHANISMS = ["env", "settings", "cli", "frontmatter", "managed", "remote", "default", "layer"];
export const SHAPES = ["first-wins", "merge", "layered"];
export const OBSERVERS = ["cache_ttl", "model", "effort", "max_tokens", "thinking", "betas", "none"];

// Files in outputs/ that are derived views, not records with provenance.
export const isDerived = name => /-(tags|index)\.json$/.test(name) || name === "capture-summary.json";

const readJson = file => JSON.parse(readFileSync(file, "utf8"));

export function knobIndex(root) {
  const index = new Map();
  for (const area of ["environment-variables", "settings", "cli"]) {
    for (const r of readJson(path.join(root, "outputs", `${area}.json`)).items) index.set(r.id, { area, kind: r.kind, title: r.title });
  }
  return index;
}

export function readDecisions(root) {
  try { return readJson(path.join(root, "outputs/decisions.json")).items; } catch { return []; }
}

export function writeDecisions(root, items, version) {
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(path.join(root, "outputs/decisions.json"), `${JSON.stringify({ area: "decisions", version, items: sorted }, null, 1)}\n`);
}

const provOk = p => p && typeof p.file === "string" && Number.isInteger(p.binary_offset) && Number.isInteger(p.length) && /^[0-9a-f]{64}$/.test(p.sha256 ?? "");

export function validateDecision(d, knobIds) {
  const e = [];
  const need = (cond, msg) => { if (!cond) e.push(`${d.id ?? "?"}: ${msg}`); };
  need(/^[a-z0-9-]+$/.test(d.id ?? ""), "id must be kebab-case");
  need(d.kind === "decision", "kind must be decision");
  for (const f of ["title", "group", "question"]) need(typeof d[f] === "string" && d[f].trim(), `${f} is required`);
  need(SHAPES.includes(d.shape), `shape ${d.shape} is not one of ${SHAPES.join(", ")}`);
  need(OBSERVERS.includes(d.observe ?? "none"), `observe ${d.observe} is not a known observer`);
  need(Array.isArray(d.provenance) && d.provenance.length && d.provenance.every(provOk), "decision provenance is missing or malformed");
  need(Array.isArray(d.provenance) && d.provenance.some(p => p.span === "function"), "decision provenance needs an anchor with span \"function\" on the function that makes the decision (relocation compares it across releases)");
  need(Array.isArray(d.rungs) && d.rungs.length, "rungs are required");
  const ids = new Set();
  for (const r of d.rungs ?? []) {
    need(!ids.has(r.id), `duplicate rung id ${r.id}`);
    ids.add(r.id);
    need(MECHANISMS.includes(r.mechanism), `rung ${r.id} mechanism ${r.mechanism} is not one of ${MECHANISMS.join(", ")}`);
    need(r.knob == null || knobIds.has(r.knob), `rung ${r.id} cites unknown knob ${r.knob}`);
    need(r.knob != null || typeof r.label === "string", `rung ${r.id} needs a knob or a plain-language label`);
    need([null, "toggle", "choice"].includes(r.input ?? null), `rung ${r.id} input must be toggle, choice or null`);
    need(r.effect && ("value" in r.effect || r.effect.from === "input" || Array.isArray(r.effect.by_context)), `rung ${r.id} effect is malformed`);
    need(["tested", "read"].includes(r.verified), `rung ${r.id} verified must be tested or read`);
    need(Array.isArray(r.provenance) && r.provenance.length && r.provenance.every(provOk), `rung ${r.id} has no provenance`);
    if (r.mechanism === "remote") need(r.verified === "read", `rung ${r.id} is remote, so it can only be read from code`);
  }
  for (const b of d.bypasses ?? []) need(knobIds.has(b.knob) && b.provenance?.every(provOk), `bypass ${b.id} needs a known knob and provenance`);
  for (const p of d.probes ?? []) for (const id of Object.keys(p.set ?? {})) need(ids.has(id), `probe ${p.name} sets unknown rung ${id}`);
  return e;
}
