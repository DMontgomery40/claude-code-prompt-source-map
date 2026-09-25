// The committed What wins page must cover every traced decision: a decision written to
// outputs/decisions.json after the page was generated would otherwise get no card, silently.
import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { renderWhatWins } from "../../extract/decisions-page.mjs";
import { buildSite } from "../src/build-site.mjs";
import { categories } from "../src/catalog.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const decisions = JSON.parse(await readFile(path.join(root, "outputs/decisions.json"), "utf8")).items;
const regenerate = "regenerate with node extract/decisions-page.mjs";

test("what-wins.md is exactly the page rendered from outputs/decisions.json", async () => {
  const committed = await readFile(path.join(root, "outputs/what-wins.md"), "utf8");
  assert.ok(committed === renderWhatWins(decisions), `outputs/what-wins.md differs from the current decisions: ${regenerate}`);
});

test("what-wins.md has exactly one heading per decision", async () => {
  const headings = (await readFile(path.join(root, "outputs/what-wins.md"), "utf8")).split("\n").filter(line => line.startsWith("### ")).map(line => line.slice(4).trim());
  for (const d of decisions) assert.equal(headings.filter(h => h === d.title).length, 1, `${d.id} ("${d.title}"): ${regenerate}`);
  assert.equal(headings.length, decisions.length, `headings for decisions that no longer exist: ${regenerate}`);
});

test("the built page renders exactly one card per decision", async () => {
  const entry = categories.flatMap(c => c.files).find(f => f.slug === "what-wins");
  const out = await mkdtemp(path.join(tmpdir(), "what-wins-"));
  try {
    await buildSite({ sourceRoot: root, outFile: path.join(out, "index.html"), categories: [{ label: "Configuration", files: [entry] }] });
    const pages = (await readdir(out, { recursive: true })).filter(f => f.endsWith(".html"));
    const html = (await Promise.all(pages.map(f => readFile(path.join(out, f), "utf8")))).find(h => h.includes('id="ladder-data"'));
    assert.ok(html, "no built page carries the ladder data");
    for (const d of decisions) assert.equal(html.split(`<div class="ladder" data-decision="${d.id}">`).length - 1, 1, `${d.id}: ${regenerate}`);
    assert.equal((html.match(/<div class="ladder" data-decision=/g) ?? []).length, decisions.length);
  } finally {
    await rm(out, { recursive: true, force: true });
  }
});
