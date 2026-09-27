// Builds the one site: the landing chooser at /, the Claude Code section at /claude-code/, the
// Codex/ChatGPT section at /codex/, and one Trace at /trace/ with both products' reference index.
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE, productOrigin } from "./src/shared/site.mjs";
import { buildTrace } from "./src/shared/trace-build.mjs";
import { renderLanding } from "./src/shared/landing.mjs";
import { buildSite as buildClaudeCode } from "./src/claude-code/build-site.mjs";
import { categories as claudeCodeCategories } from "./src/claude-code/catalog.mjs";
import { site as claudeCodeSite } from "./src/claude-code/config.mjs";
import { buildSite as buildCodex } from "./src/codex/build-site.mjs";
import { categories as codexCategories } from "./src/codex/catalog.mjs";

const siteRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(siteRoot, "..");
const dist = path.join(siteRoot, "dist");

// siteId stays as each section's historical id; Trace shows it only as the index's name.
const PRODUCTS = [
  { id: "claude-code", siteId: "ccprompts", build: buildClaudeCode, categories: claudeCodeCategories, assets: [claudeCodeSite.socialCard.file] },
  { id: "codex", siteId: "gpt6aeon", build: buildCodex, categories: codexCategories, assets: ["prompt-map-social-card.png", "binwalk-evidence.tar.gz"] }
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const product of PRODUCTS) {
  const section = SITE.products[product.id].path;
  await product.build({ sourceRoot: path.join(repoRoot, product.id), outFile: path.join(dist, section, "index.html"), categories: product.categories });
  for (const file of product.assets) await copyFile(path.join(siteRoot, "assets", product.id, file), path.join(dist, section, file));
}

// One viewer, one index file holding both products; the viewer picks by the session's product.
const byProduct = {};
for (const [i, product] of PRODUCTS.entries()) {
  const section = SITE.products[product.id].path;
  const built = await buildTrace({ siteRoot, sourceRoot: path.join(repoRoot, product.id), categories: product.categories, siteId: product.siteId, origin: productOrigin(product.id), section, copy: i === 0, write: false });
  byProduct[product.id] = built.index;
}
await writeFile(path.join(dist, "trace", "reference-index.json"), JSON.stringify({ byProduct }));

await writeFile(path.join(dist, "index.html"), renderLanding({ cardFile: "social-card.png" }));
await copyFile(path.join(siteRoot, "assets", "shared", "social-card.png"), path.join(dist, "social-card.png"));
