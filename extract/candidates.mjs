// Lists every string or template literal of 200+ characters and 30+ words in the embedded
// JavaScript, with template expressions kept as ${…}. Writes work/candidates.json.
import { readdirSync, writeFileSync } from "node:fs";
import * as walk from "acorn-walk";
import { parse, source } from "./lib.mjs";

const root = new URL("../work/", import.meta.url).pathname;
const out = [];
for (const file of readdirSync(`${root}extracted`).filter(f => /\.(js|mjs)$/.test(f) || f === "cli")) {
  const src = source(file);
  let ast;
  try { ast = parse(src); } catch { continue; }
  const take = (node, text) => {
    const words = text.split(/\s+/).filter(Boolean).length;
    if (text.length >= 200 && words >= 30 && /[a-z]{3,} [a-z]{3,} [a-z]{3,}/.test(text)) {
      out.push({ file, start: node.start, end: node.end, byte_start: Buffer.byteLength(src.slice(0, node.start)), words, text });
    }
  };
  walk.full(ast, node => {
    if (node.type === "Literal" && typeof node.value === "string") take(node, node.value);
    if (node.type === "TemplateLiteral") {
      take(node, node.quasis.map((q, i) => q.value.cooked + (i < node.expressions.length ? `\${${src.slice(node.expressions[i].start, node.expressions[i].end).slice(0, 60)}}` : "")).join(""));
    }
  });
}
writeFileSync(`${root}candidates.json`, JSON.stringify(out));
console.log(out.length, "candidates");
