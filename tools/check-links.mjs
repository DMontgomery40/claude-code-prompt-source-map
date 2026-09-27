#!/usr/bin/env node
// Every internal link, script and image in the built site (site/dist) must resolve to a file it serves.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
if (broken.length) { console.error(`broken links (${broken.length}):\n${[...new Set(broken)].slice(0, 40).join("\n")}`); process.exit(1); }
console.log(`links clean: ${checked} internal references`);
