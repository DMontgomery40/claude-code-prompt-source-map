// Build step for /trace/: copies the one viewer into dist/trace/ and builds each product's
// reference index, which lets the in-browser viewer link text in a user's own session log to the
// page that publishes it. site/build.mjs writes both into dist/trace/reference-index.json as
// { byProduct: { "claude-code": …, codex: … } }. The index holds only hashes of published lines,
// page titles and slugs, never session data.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { readdirSync, readFileSync, statSync } from "node:fs";
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

// Literal pieces of shipped code: the text between quotes, backticks and template holes, unescaped. The scan
// needs no parser: a quote inside a regex or comment only shifts which side of a boundary a fragment lands on.
// Yields [text, byteOffset, templateEnd]. `src` is latin1, so string positions are byte offsets.
const codePoint = (n, e) => (n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : e);
const decode = (raw) => Buffer.from(raw, "latin1").toString("utf8").replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, e) =>
  e.length > 1 && e[0] === "u" ? codePoint(parseInt(e[1] === "{" ? e.slice(2, -1) : e.slice(1), 16), e) : e.length > 1 && e[0] === "x" ? String.fromCharCode(parseInt(e.slice(1), 16)) : e === "n" ? "\n" : e === "t" ? " " : e);

// Rust string literals only ("…" and raw r#"…"#), split at their {…} format holes. Yields [text, byteOffset, holeAfter].
export function* rustLiterals(src) {
  const re = /r(#*)"|"/g;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    let end;
    if (m[0][0] === "r") { end = src.indexOf('"' + m[1], start); if (end < 0) return; re.lastIndex = end + 1 + m[1].length; }
    else { let j = start; while (j < src.length && src[j] !== '"') j += src[j] === "\\" ? 2 : 1; end = j; re.lastIndex = j + 1; }
    const body = src.slice(start, end);
    const hole = /\{[^{}\s]*\}/g;
    let at = 0, h;
    const out = (a, b, after) => { if (b - a >= 24) return [decode(body.slice(a, b)), start + a, after]; return null; };
    while ((h = hole.exec(body))) { const p = out(at, h.index, true); if (p) yield p; at = h.index + h[0].length; }
    const p = out(at, body.length, false);
    if (p) yield p;
  }
}
export function* codeLiterals(src) {
  const re = /["'`]|\$\{|\}/g;
  let at = 0, m;
  const piece = (a, b, end) => {
    const raw = src.slice(a, b);
    if (raw.length < 24) return null;
    return [decode(raw), a, end];
  };
  while ((m = re.exec(src))) {
    // A value follows: a template hole, or a literal left open for concatenation ("… via "+x).
    const p = piece(at, m.index, m[0] === "${" || /[\s:(=]$/.test(src.slice(Math.max(at, m.index - 1), m.index)));
    if (p) yield p;
    at = m.index + m[0].length;
  }
  const p = piece(at, src.length, false);
  if (p) yield p;
}

// { shelves, kinds, files, keys: { hash: [shelf, file, offset or line] } } for one product, from its gitignored
// work folder; null when the folder is not there (a clean checkout builds without it). kinds[shelf] is "binary"
// (offsets into a shipped binary), "bundle" (offsets into an app bundle file) or "source" (file:line).
// Only model-facing literals are kept, to keep the index small: text the library's inventory judged
// model-facing or publishes, prompt files, and literals a value is filled into (templates, "…: "+x) or long
// prose, which is how short unnamed notices are built. Error and UI strings, docs and tests are left out.
export async function buildLiteralIndex({ productId, sourceRoot, version }) {
  const { literalEntryKeys } = await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "..", "trace", "harness", "pieces.js")).href);
  const shelves = [], kinds = [], files = [], keys = {};
  const shelfOf = (name, kind) => { kinds.push(kind); return shelves.push(name) - 1; };
  const prose = (t) => t.length >= 60 && (t.match(/[\p{L}]+/gu) || []).length >= 8;
  const fileIdx = new Map();
  const add = (shelf, file, pos, literal, end) => {
    for (const k of literalEntryKeys(literal, end)) {
      if (k in keys) continue;
      if (!fileIdx.has(file)) { fileIdx.set(file, files.length); files.push(file); }
      keys[k] = [shelf, fileIdx.get(file), pos];
    }
  };
  const work = path.join(sourceRoot, "work");
  if (productId === "claude-code") {
    const manifest = path.join(work, "embedded-manifest.json");
    if (!existsSync(manifest)) return null;
    const shelf = shelfOf(`claude.exe${version ? " " + version : ""} (extracted chunks)`, "binary");
    // Byte ranges of the literals the inventory judged model-facing, or that a page publishes.
    const ranges = [];
    try {
      for (const it of JSON.parse(readFileSync(path.join(sourceRoot, "outputs", "inventory.json"), "utf8")).items ?? []) {
        const d = it.details || {}, pv = (it.provenance || [])[0];
        if (pv && (d.audience === "model" || d.published_in)) ranges.push([pv.binary_offset, pv.binary_offset + pv.length]);
      }
    } catch { /* no inventory: templates only */ }
    ranges.sort((a, b) => a[0] - b[0]);
    const inRange = (o) => { let lo = 0, hi = ranges.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; if (ranges[m][1] < o) lo = m + 1; else if (ranges[m][0] > o + 1) hi = m - 1; else return true; } return false; };
    for (const f of JSON.parse(readFileSync(manifest, "utf8")).files) {
      const name = path.basename(f.name), full = path.join(work, "extracted", name);
      if (!name.endsWith(".js") || !existsSync(full)) continue;
      for (const [text, pos, end] of codeLiterals(readFileSync(full, "latin1"))) {
        if (end || inRange(f.file_offset + pos)) add(shelf, name, f.file_offset + pos, text, end);
      }
    }
  } else if (productId === "codex") {
    let tag = null;
    try { tag = JSON.parse(readFileSync(path.join(sourceRoot, "outputs", "codex-cli-prompts.json"), "utf8")).source?.tag; } catch { /* no tag */ }
    const srcDir = tag && path.join(work, `codex-src-${tag}`);
    if (srcDir && existsSync(srcDir)) {
      // The CLI source at the library's tag: shipped code and prompt files, by file and line; tests left out.
      const shelf = shelfOf(`Codex CLI source · openai/codex ${tag}`, "source");
      const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, e.name);
          // Dot folders (.github, .codex) are the repository's own tooling, not what ships.
          if (e.isDirectory()) { if (!/^(\..*|target|node_modules|tests?|fixtures|snapshots)$/.test(e.name)) walk(full); continue; }
          if (!/\.(rs|md|txt|jinja|j2)$/.test(e.name) || /_tests?\.rs$|tests\.rs$/.test(e.name) || statSync(full).size > 2e6) continue;
          const rel = path.relative(srcDir, full), text = readFileSync(full, "latin1");
          const lineAt = (i) => { let n = 1; for (let j = text.indexOf("\n"); j >= 0 && j < i; j = text.indexOf("\n", j + 1)) n++; return n; };
          if (/\.rs$/.test(e.name)) { for (const [lit, pos, end] of rustLiterals(text)) if (end || prose(lit)) add(shelf, rel, lineAt(pos), lit, end); }
          // Prompt files (templates the CLI embeds), not READMEs, changelogs or docs.
          else if (/(prompt|template|instruction|guardian|review|agent|policy|compact|collab|personality)/i.test(rel) && !/(^|\/)(README|CHANGELOG|docs?)\b/i.test(rel))
            Buffer.from(text, "latin1").toString("utf8").split("\n").forEach((l, i) => add(shelf, rel, i + 1, l, false));
        }
      };
      walk(srcDir);
    }
    const asar = path.join(work, "asar-build");
    if (existsSync(asar)) {
      const shelf = shelfOf("ChatGPT desktop app.asar", "bundle");
      for (const name of readdirSync(asar).filter((n) => n.endsWith(".js")).sort()) {
        for (const [text, pos, end] of codeLiterals(readFileSync(path.join(asar, name), "latin1"))) if (end || prose(text)) add(shelf, name, pos, text, end);
      }
    }
    if (!shelves.length) return null;
  } else return null;
  return { version: version || null, shelves, kinds, files, keys };
}

// The product version the published records were read from.
async function libraryVersion(sourceRoot) {
  for (const [file, pick] of [["outputs/capture-summary.json", (j) => j.version], ["outputs/codex-cli-prompts.json", (j) => j.source?.cli_version]]) {
    const full = path.join(sourceRoot, file);
    if (existsSync(full)) { try { const v = pick(JSON.parse(await readFile(full, "utf8"))); if (v) return String(v); } catch { /* not this product */ } }
  }
  return null;
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
  const { recordsFromMarkdown } = await import(pathToFileURL(path.join(src, "harness", "pieces.js")).href);

  const pages = [];
  const lines = {};
  const texts = [];
  for (const file of categories.flatMap(category => category.files)) {
    if (!file.path.endsWith(".md") || !file.slug) continue;
    const full = path.join(sourceRoot, file.path);
    if (!existsSync(full)) continue;
    const index = pages.push({ slug: file.slug, title: file.title }) - 1;
    const text = await readFile(full, "utf8");
    texts.push({ slug: file.slug, text, ids: await headingIds(siteRoot, file.slug, section) });
    for (const hash of textLineHashes(text)) if (!(hash in lines)) lines[hash] = index;
  }
  const index = { site: siteId, origin, pages, lines, harness: {}, reminders: {}, templates: {}, tools: {} };
  // The harness layer links a session's text to a record (a heading and the fenced text under it) by the
  // text itself: hashes of published lines, as above, keyed to records instead of pages.
  Object.assign(index, recordsFromMarkdown(texts));
  const version = await libraryVersion(sourceRoot);
  if (version) index.libVersion = version;
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
  const stats = { pages: pages.length, lines: Object.keys(lines).length, records: index.records.length, reminders: Object.keys(index.reminders).length, templates: Object.keys(index.templates).length, tools: Object.keys(index.tools).length };
  // The literal index: where unpublished text sits in what ships (hashes, file names and offsets; no text).
  // Merged into dist/trace/literal-index.json by product; HARNESS_LITERALS=0 leaves it out.
  if (process.env.HARNESS_LITERALS !== "0") {
    const lit = await buildLiteralIndex({ productId: path.basename(sourceRoot), sourceRoot, version });
    if (lit) {
      const file = path.join(out, "literal-index.json");
      const all = copy || !existsSync(file) ? { byProduct: {} } : JSON.parse(await readFile(file, "utf8"));
      all.byProduct[path.basename(sourceRoot)] = lit;
      await writeFile(file, JSON.stringify(all));
      stats.literals = Object.keys(lit.keys).length;
    }
  }
  if (write) {
    await writeFile(path.join(out, "reference-index.json"), JSON.stringify(index));
    stats.bytes = (await stat(path.join(out, "reference-index.json"))).size;
  }
  return { ...stats, index };
}
