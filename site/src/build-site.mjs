import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { expandFacts } from "./facts.mjs";
import { renderSite } from "./render.mjs";

// Document pages are regenerated on every build so renamed documents leave no stale pages.
async function removeDocumentPages(outDir) {
  for (const entry of await readdir(outDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const page = path.join(outDir, entry.name, "index.html");
    if (await stat(page).then(() => true, () => false)) await rm(path.join(outDir, entry.name), { recursive: true });
  }
}

export async function buildSite({ sourceRoot, outFile, categories }) {
  const documents = [];

  for (const category of categories) {
    for (const file of category.files) {
      try {
        const raw = await readFile(path.join(sourceRoot, file.path), "utf8");
        const source = file.format === "markdown" ? expandFacts(raw, sourceRoot, file.path) : raw;
        const count = file.data ? JSON.parse(await readFile(path.join(sourceRoot, file.data), "utf8")).items?.length : undefined;
        let filter;
        if (file.filters) {
          const records = JSON.parse(await readFile(path.join(sourceRoot, file.filters.records), "utf8")).items;
          const tags = JSON.parse(await readFile(path.join(sourceRoot, file.filters.tags), "utf8"));
          filter = { vocabulary: tags.tags, records: records.map(r => ({ group: r.group, title: r.title, tags: tags.items[r.id] ?? [] })) };
        }
        documents.push({ ...file, category: category.label, source, count, filter });
      } catch (error) {
        throw new Error(`Unable to read ${file.path}: ${error.message}`, {
          cause: error
        });
      }
    }
  }

  const outDir = path.dirname(outFile);
  await mkdir(outDir, { recursive: true });
  await removeDocumentPages(outDir);
  await mkdir(path.join(outDir, "data"), { recursive: true });
  for (const file of documents.filter(document => document.data)) {
    await copyFile(path.join(sourceRoot, file.data), path.join(outDir, "data", path.basename(file.data)));
  }
  const status = await readFile(path.join(sourceRoot, "outputs/status.json"), "utf8").then(JSON.parse, () => null);
  for (const page of renderSite({ categories, documents, status })) {
    const file = page.path === "index.html" ? outFile : path.join(outDir, page.path);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page.html, "utf8");
  }
}
