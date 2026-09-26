import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories } from "./src/catalog.mjs";
import { site } from "./src/config.mjs";
import { buildSite } from "./src/build-site.mjs";
import { buildTrace } from "./src/trace-build.mjs";

const siteRoot = path.dirname(fileURLToPath(import.meta.url));

await buildSite({
  sourceRoot: path.resolve(siteRoot, ".."),
  outFile: path.join(siteRoot, "dist/index.html"),
  categories
});

await copyFile(path.join(siteRoot, "assets", site.socialCard.file), path.join(siteRoot, "dist", site.socialCard.file));

// /trace/: the in-browser session explorer and this site's reference index.
await buildTrace({ siteRoot, sourceRoot: path.resolve(siteRoot, ".."), categories, siteId: "ccprompts", origin: site.origin });
