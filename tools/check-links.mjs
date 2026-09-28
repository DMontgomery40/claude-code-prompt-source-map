#!/usr/bin/env node
// Every internal link, script and image in the built site (site/dist) must resolve to a file it serves,
// and every search index entry (dist/<section>/search-index.json) must lead to a page that exists and
// to an id that page has. Index hrefs are computed by the palette's own itemHref (search/query.js).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemHref } from "../site/src/shared/search/query.js";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../site/dist");
if (!existsSync(dist)) { console.error("build the site first (npm run build)"); process.exit(1); }
function* walk(dir) { for (const e of readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) yield* walk(f); else yield f; } }

const broken = [];
let checked = 0;
for (const file of walk(dist)) {
  if (!file.endsWith(".html")) continue;
  const html = readFileSync(file, "utf8").replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, s => (/\bsrc=/.test(s.slice(0, s.indexOf(">"))) ? s.slice(0, s.indexOf(">") + 1) : ""));
  for (const m of html.matchAll(/\s(?:href|src)="([^"#]*)(?:#[^"]*)?"/g)) {
    const ref = m[1].replace(/&amp;/g, "&");
    if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue; // external, mailto:, data:
    const clean = decodeURIComponent(ref.split("?")[0]);
    let target = clean.startsWith("/") ? path.join(dist, clean) : path.resolve(path.dirname(file), clean);
    if (clean.endsWith("/") || !path.extname(target)) target = path.join(target, "index.html");
    checked++;
    if (!existsSync(target)) broken.push(`${path.relative(dist, file)} -> ${ref}`);
  }
}

// Search indexes: each page and entry resolves to <section>/<slug>/index.html and, for an entry, the id.
const idsOf = new Map();
const pageIds = file => {
  if (!idsOf.has(file)) idsOf.set(file, existsSync(file) ? new Set([...readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map(m => m[1])) : null);
  return idsOf.get(file);
};
let entries = 0;
const indexes = readdirSync(dist, { withFileTypes: true }).filter(e => e.isDirectory() && existsSync(path.join(dist, e.name, "search-index.json"))).map(e => e.name);
for (const section of indexes) {
  const index = JSON.parse(readFileSync(path.join(dist, section, "search-index.json"), "utf8"));
  const all = [...index.pages.map((_, p) => ({ p })), ...index.items];
  for (const it of all) {
    entries++;
    const href = itemHref(index, it);
    if (!href) { broken.push(`${section}/search-index.json -> item on missing page ${it.p} (${it.t})`); continue; }
    const [page, id] = href.split("#");
    const ids = pageIds(path.join(dist, section, page, "index.html"));
    if (!ids) broken.push(`${section}/search-index.json -> ${href} (no such page)`);
    else if (id && !ids.has(decodeURIComponent(id))) broken.push(`${section}/search-index.json -> ${href} (no such id)`);
  }
}
if (!indexes.length) broken.push("no search-index.json in any section");

if (broken.length) { console.error(`broken links (${broken.length}):\n${[...new Set(broken)].slice(0, 40).join("\n")}`); process.exit(1); }
console.log(`links clean: ${checked} internal references; ${entries} search index entries in ${indexes.join(", ")}`);
