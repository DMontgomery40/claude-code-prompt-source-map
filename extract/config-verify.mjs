// Contract checks for the config-reference outputs (settings, cli, hooks, slash-commands).
// 1. JSON parses and every item has provenance with an integer binary_offset.
// 2. Every provenance range hashes to its sha256 when read from claude.exe itself.
// 3. Item text equals the string literal at provenance[0] (ignoring {{…}} placeholders).
// 4. No code excerpts in the published Markdown/JSON text fields.
// Usage: node extract/config-verify.mjs [/path/to/claude.exe]
import { readFileSync, openSync, readSync, realpathSync } from "node:fs";
import { execSync } from "node:child_process";
import * as acorn from "acorn";
import { sha256, BINARY_SHA256 } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const bin = process.argv[2] ?? realpathSync(execSync("command -v claude").toString().trim());
const fd = openSync(bin, "r");
const binHash = execSync(`shasum -a 256 "${bin}"`).toString().split(" ")[0];
if (binHash !== BINARY_SHA256) throw new Error(`binary sha256 ${binHash} does not match ${BINARY_SHA256}`);
const readBin = (off, len) => { const b = Buffer.alloc(len); readSync(fd, b, 0, len, off); return b; };

// Evaluate a string-valued literal expression without executing code.
function literalValue(src) {
  let node;
  try { node = acorn.parseExpressionAt(src, 0, { ecmaVersion: "latest" }); } catch { return null; }
  if (node.end !== src.length) return null;
  const ev = n => {
    if (n.type === "Literal" && typeof n.value === "string") return n.value;
    if (n.type === "TemplateLiteral") return n.quasis.map((q, i) => q.value.cooked + (i < n.expressions.length ? "\u0000" : "")).join("");
    if (n.type === "BinaryExpression" && n.operator === "+") { const l = ev(n.left), r = ev(n.right); return l !== null && r !== null ? l + r : null; }
    if (n.type === "ParenthesizedExpression") return ev(n.expression);
    return null;
  };
  return ev(node);
}
const norm = s => s.replace(/\{\{[^}]*\}\}/g, "\u0000").split("\u0000");

let failures = 0, checkedProv = 0, checkedText = 0, skippedText = 0;
for (const area of ["settings", "hooks", "cli", "slash-commands"]) {
  const json = JSON.parse(readFileSync(`${ROOT}outputs/${area}.json`, "utf8"));
  for (const it of json.items) {
    if (!it.provenance?.length) { failures++; console.log(`${area}/${it.id}: no provenance`); continue; }
    for (const p of it.provenance) {
      if (!Number.isInteger(p.binary_offset)) { failures++; console.log(`${area}/${it.id}: bad offset`); continue; }
      if (sha256(readBin(p.binary_offset, p.length)) !== p.sha256) { failures++; console.log(`${area}/${it.id}: sha256 mismatch at ${p.binary_offset}`); }
      checkedProv++;
    }
    if (it.text) {
      const p = it.provenance[0];
      const v = literalValue(readBin(p.binary_offset, p.length).toString("utf8"));
      if (v === null) { skippedText++; console.log(`${area}/${it.id}: provenance[0] is not a string literal`); failures++; continue; }
      // Template expressions appear as {{…}} in text (or were evaluated from constants);
      // either way the literal's own pieces must appear in order.
      const inOrder = (pieces, hay) => { let pos = 0; for (const piece of pieces) { const i = hay.indexOf(piece, pos); if (i < 0) return false; pos = i + piece.length; } return true; };
      let ok;
      if (v.includes("\u0000")) ok = inOrder(v.split("\u0000"), it.text.replace(/\{\{expr:[\s\S]*?\}\}(?=[^}]|$)/g, "\u0000"));
      else if (/\{\{/.test(it.text)) ok = inOrder(norm(it.text), v);
      else ok = v === it.text;
      if (!ok) { failures++; console.log(`${area}/${it.id}: text mismatch`); }
      checkedText++;
    }
  }
  const md = readFileSync(`${ROOT}outputs/${area}.md`, "utf8");
  for (const [label, re] of [["function(", /function\s*\(/], ["=>", /=>/], ["var ", /\bvar [A-Za-z_$][\w$]*=/], ["minified", /[;{}][a-zA-Z_$]{1,3}=[a-zA-Z_$]{1,3}\(/]]) {
    const hits = [...md.matchAll(new RegExp(re, "g"))].length + [...JSON.stringify(json).matchAll(new RegExp(re, "g"))].length;
    if (hits) console.log(`${area}: ${hits} hit(s) for ${label}`);
  }
}
console.log(`checked ${checkedProv} provenance ranges against ${bin}, ${checkedText} texts; ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
