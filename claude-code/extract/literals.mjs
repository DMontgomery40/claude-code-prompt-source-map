// Indexes every string and template literal in an extraction, keyed by normalized text
// (template expressions become \u0000), with byte ranges relative to each embedded file.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import * as walk from "acorn-walk";
import * as acorn from "acorn";

export function parseSource(src) {
  return acorn.parse(src, { ecmaVersion: "latest", sourceType: "module", allowHashBang: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
}

// Character offset -> byte offset for one source string.
export function byteMapper(src) {
  if (Buffer.byteLength(src) === src.length) return i => i;
  const cum = new Uint32Array(src.length + 1);
  for (let i = 0; i < src.length; i += 1) {
    const c = src.charCodeAt(i);
    cum[i + 1] = cum[i] + (c < 0x80 ? 1 : c < 0x800 ? 2 : c >= 0xd800 && c <= 0xdbff ? 4 : c >= 0xdc00 && c <= 0xdfff ? 0 : 3);
  }
  return i => cum[i];
}

export function indexExtraction(dir) {
  const files = new Map();
  const byNorm = new Map();
  for (const name of readdirSync(path.join(dir, "extracted")).filter(f => /\.(js|mjs)$/.test(f) || f === "cli")) {
    const src = readFileSync(path.join(dir, "extracted", name), "utf8");
    let ast;
    try { ast = parseSource(src); } catch { continue; }
    const toByte = byteMapper(src);
    const lits = [];
    walk.full(ast, n => {
      let norm = null;
      if (n.type === "Literal" && typeof n.value === "string") norm = n.value;
      else if (n.type === "TemplateLiteral") norm = n.quasis.map(q => q.value.cooked ?? q.value.raw).join("\u0000");
      if (norm === null) return;
      lits.push({ bs: toByte(n.start), be: toByte(n.end), norm });
    });
    lits.sort((a, b) => a.bs - b.bs);
    lits.forEach((lit, i) => {
      lit.file = name; lit.i = i;
      if (lit.norm.length < 6) return;
      const list = byNorm.get(lit.norm) ?? []; list.push(lit); byNorm.set(lit.norm, list);
    });
    files.set(name, lits);
  }
  return { files, byNorm };
}

// Literals whose byte range lies within [bs, be) of a file.
export function literalsWithin(index, file, bs, be) {
  const lits = index.files.get(file) ?? [];
  let lo = 0, hi = lits.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (lits[mid].bs < bs) lo = mid + 1; else hi = mid; }
  const out = [];
  for (let i = lo; i < lits.length && lits[i].bs < be; i += 1) if (lits[i].be <= be) out.push(lits[i]);
  return out;
}
