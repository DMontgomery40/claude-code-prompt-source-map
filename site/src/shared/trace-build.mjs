// Build step for /trace/: copies the one viewer into dist/trace/ and builds each product's
// reference index, which lets the in-browser viewer link text in a user's own session log to the
// page that publishes it. site/build.mjs writes both into dist/trace/reference-index.json as
// { byProduct: { "claude-code": …, codex: … } }. The index holds only hashes of published lines,
// page titles and slugs, never session data.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const SKIP = new Set(["test", "dump.mjs", "dev-synthetic.js", "fixtures"]);

// Heading text → id on a built page, read from the HTML the site just wrote, so anchors match exactly.
async function headingIds(siteRoot, slug, section) {
  const file = path.join(siteRoot, "dist", section || "", slug, "index.html");
  if (!existsSync(file)) return new Map();
  const html = await readFile(file, "utf8");
  const ids = new Map();
  for (const m of html.matchAll(/<h[2-6][^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-6]>/g)) {
    const text = m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    if (text && !ids.has(text)) ids.set(text, m[1]);
  }
  return ids;
}

// Copies the viewer once. `section` is the product's path on the one site (its built pages live
// under dist/<section>/); with `write` the index is also written alone (single-product builds).
export async function buildTrace({ siteRoot, sourceRoot, categories, siteId, origin, section = "", copy = true, write = true }) {
  const src = path.join(siteRoot, "trace");
  if (!existsSync(src)) return null;
  const out = path.join(siteRoot, "dist", "trace");
  if (copy) {
    await rm(out, { recursive: true, force: true });
    await cp(src, out, { recursive: true, filter: file => !SKIP.has(path.basename(file)) });
  }
  const { textLineHashes } = await import(pathToFileURL(path.join(src, "model.js")).href);

  const pages = [];
  const lines = {};
  for (const file of categories.flatMap(category => category.files)) {
    if (!file.path.endsWith(".md") || !file.slug) continue;
    const full = path.join(sourceRoot, file.path);
    if (!existsSync(full)) continue;
    const index = pages.push({ slug: file.slug, title: file.title }) - 1;
    for (const hash of textLineHashes(await readFile(full, "utf8"))) if (!(hash in lines)) lines[hash] = index;
  }
  const index = { site: siteId, origin, pages, lines, harness: {}, reminders: {}, templates: {}, tools: {} };
  // Tools: every identifier-like heading on the site's tool page (ccprompts "tools", gpt6aeon "tool-manifest").
  for (const slug of ["tools", "tool-manifest"]) {
    const page = pages.find(p => p.slug === slug);
    if (!page) continue;
    for (const [text, id] of await headingIds(siteRoot, slug, section)) {
      if (/^[A-Za-z_][\w.-]*$/.test(text) && !index.tools[text]) index.tools[text] = { slug, anchor: id, title: text };
    }
  }

  // ccprompts only: the inferred harness size for the captured version, and reminder entries by attachment type.
  const capture = path.join(sourceRoot, "outputs/capture-summary.json");
  const reminders = path.join(sourceRoot, "outputs/system-reminders.json");
  const tools = path.join(sourceRoot, "outputs/tools.json");
  if (existsSync(capture) && existsSync(tools)) {
    const summary = JSON.parse(await readFile(capture, "utf8"));
    const toolItems = JSON.parse(await readFile(tools, "utf8")).items ?? [];
    const captured = new Set(summary.cli?.tool_names ?? []);
    const toolsChars = toolItems.filter(item => captured.has(item.title?.replace(/`/g, "") ?? item.id))
      .reduce((sum, item) => sum + (item.text?.length ?? 0) + JSON.stringify(item.details?.input_schema ?? item.details?.schema ?? {}).length, 0);
    index.harness[summary.version] = {
      systemChars: (summary.cli?.main_prompt_chars ?? 0) + (summary.cli?.identity?.length ?? 0),
      toolsChars,
      tools: captured.size,
      source: `ccprompts capture of Claude Code ${summary.version}`
    };
  }
  if (existsSync(reminders)) {
    const page = pages.find(p => p.slug === "system-reminders") ?? { slug: "system-reminders", title: "System reminders and injections" };
    const ids = await headingIds(siteRoot, page.slug, section);
    for (const item of JSON.parse(await readFile(reminders, "utf8")).items ?? []) {
      const type = item.details?.attachment_type;
      if (type && !index.reminders[type]) index.reminders[type] = { slug: page.slug, anchor: ids.get(item.title) ?? null, title: item.title };
    }
  }
  // Templates the viewer fills from a structured attachment row's fields (Claude Code versions that
  // log some attachments without their text): published template text only, by id, from the
  // reminders page and the system prompt page (environment, session context and date live there).
  const { TEMPLATE_IDS } = await import(pathToFileURL(path.join(src, "adapters", "cc-templates.js")).href);
  for (const [slug, file] of [["system-reminders", reminders], ["system-prompt", path.join(sourceRoot, "outputs/system-prompt.json")]]) {
    if (!existsSync(file)) continue;
    const ids = await headingIds(siteRoot, slug, section);
    for (const item of JSON.parse(await readFile(file, "utf8")).items ?? []) {
      if (TEMPLATE_IDS.includes(item.id) && typeof item.text === "string" && !index.templates[item.id]) index.templates[item.id] = { text: item.text, slug, anchor: ids.get(item.title) ?? null, title: item.title };
    }
  }
  const stats = { pages: pages.length, lines: Object.keys(lines).length, reminders: Object.keys(index.reminders).length, templates: Object.keys(index.templates).length, tools: Object.keys(index.tools).length };
  if (write) {
    await writeFile(path.join(out, "reference-index.json"), JSON.stringify(index));
    stats.bytes = (await stat(path.join(out, "reference-index.json"))).size;
  }
  return { ...stats, index };
}
