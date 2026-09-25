// Writes outputs/what-wins.md: every decision as a static ladder (the page without
// JavaScript, the contents sidebar, and search engines). Counts are tokens. The page's
// card replaces each decision's lists (bypasses, rungs, constraints) once it is live.
import { writeFileSync } from "node:fs";
import { knobIndex, readDecisions } from "./decisions-lib.mjs";

const root = new URL("../", import.meta.url).pathname;
const knobs = knobIndex(root);
const MECH = { env: "env", settings: "settings", cli: "flag", frontmatter: "agent", managed: "managed", remote: "remote", default: "default", layer: "file" };
const md = value => String(value ?? "").replace(/[\\*_[\]]/g, "\\$&").trim();
const sentence = value => (/[.!?:]$/.test(value) ? value : `${value}.`);
const knobName = x => `\`${x.label ?? knobs.get(x.knob)?.title ?? x.knob}\``;
// Surprising ladders first: a remote rung, a silent skip, or a veto.
const surprising = d => d.rungs.some(r => r.mechanism === "remote" || r.invalid_example || r.skip_when) || (d.constraints ?? []).length > 0;
const decisions = readDecisions(root).sort((a, b) => Number(surprising(b)) - Number(surprising(a)) || a.title.localeCompare(b.title));
const groups = [...new Set(decisions.map(d => d.group))];
const out = ["# What wins", "",
  "For each value Claude Code decides, every source it checks, in the order it checks them, and which one takes effect. Set rungs on a card to see the outcome. {{count:decisions id=*}} decisions; rungs marked Tested were checked against the requests Claude Code actually sent, and the rest were read from code. {{count:decisions-index status=pending}} knobs sit in decisions that are not traced yet.", ""];
for (const g of groups) {
  out.push(`## ${g}`, "");
  for (const d of decisions.filter(x => x.group === g)) {
    out.push(`### ${d.title}`, "", md(d.question), "");
    const before = (d.bypasses ?? []).map(b => `- Before the ladder: ${knobName({ knob: b.knob, label: b.label })}. ${md(b.note)}`.trim());
    if (before.length) out.push(...before, "");
    d.rungs.forEach((r, i) => {
      const name = r.knob ? knobName(r) : md(r.label ?? r.id);
      out.push(`${i + 1}. **${MECH[r.mechanism] ?? r.mechanism}** ${name}: ${r.note ? `${sentence(md(r.note))} ` : ""}${r.verified === "tested" ? "Tested." : "Read from code."}`);
    });
    out.push("");
    // Reader-facing notes; `details` is evidence for maintainers and stays out of the page.
    if (d.notes?.length) out.push(...d.notes.map(n => `- ${md(n)}`), "");
    const after = (d.constraints ?? []).map(c => {
      const head = c.knob ? `${knobName({ knob: c.knob })}.` : sentence(md(c.label ?? c.id));
      const rest = [c.knob ? md(c.label) : "", md(c.note)].filter(Boolean).join(" ");
      return `* After the ladder: ${head}${rest ? ` ${rest}` : ""}`;
    });
    if (after.length) out.push(...after, "");
    const p = d.provenance[0];
    out.push(`Source: \`${p.file}\` · offset ${p.binary_offset} · sha256 \`${p.sha256.slice(0, 8)}…\``, "");
  }
}
writeFileSync(`${root}outputs/what-wins.md`, out.join("\n"));
console.log(`what-wins.md: ${decisions.length} decisions`);
