#!/usr/bin/env node
// Publishes the ChatGPT-side model-facing text shipped in the Codex/ChatGPT desktop app's
// app.asar: messages the app sends or prefills for ChatGPT features, found by the content
// anchors in chatgpt-prompts-spec.mjs. Writes, for each page in the spec:
//   outputs/<page>.md     the texts with provenance, grouped by feature
//   outputs/<page>.json   coverage: every published item's id, exact text and sha256
// plus work/chatgpt-prompts-diff.md (semantic changes against the committed pages; absent when
// none), and prints one JSON summary line.
//
// A text the app no longer ships is listed under "Not found in this build" and the script still
// exits 0; only a missing app or unreadable asar exits 2. Runs after the Codex/ChatGPT refresh.
//
// Usage: node extract/codex/chatgpt-prompts.mjs

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chatgptDistinctBranches, chatgptPages, unconfirmedGroups } from "./chatgpt-prompts-spec.mjs";
import { codexApp } from "./lib/app-layout.mjs";
import {
  extractArrayJoin,
  extractConcatenation,
  extractFormatjsMessage,
  extractFunctionText,
  extractTemplateLiteral
} from "./lib/app-prompts.mjs";
import { openAsar } from "./lib/asar.mjs";
import { privacyScan } from "./lib/privacy.mjs";
import { renderChangedDocuments, semanticDiff } from "./lib/semantic-diff.mjs";

const EXTRACTORS = {
  static: extractTemplateLiteral,
  template: extractTemplateLiteral,
  formatjs: extractFormatjsMessage,
  concat: extractConcatenation,
  "array-join": extractArrayJoin,
  function: extractFunctionText
};
const NOT_FOUND = "Not found in this build";

// Key-like tokens the privacy scan does not cover: client ids, secret keys, long base62/hex runs.
const KEY_LIKE = [/\bclient-[A-Za-z0-9_-]{6,}/, /\bsk-[A-Za-z0-9_-]{6,}/, /\b[A-Za-z0-9]{40,}\b/, /\b[0-9a-fA-F]{32,}\b/];
function withheldReason(item) {
  const fields = [["text", item.text], ["translator note", item.note ?? ""]];
  try {
    privacyScan(new Map(fields));
  } catch (error) {
    return error.message;
  }
  for (const [name, value] of fields) if (KEY_LIKE.some(pattern => pattern.test(value))) return `${name} contains a key-like token`;
  return null;
}

const fence = text => "`".repeat(Math.max(3, 1 + Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))));
const code = text => { const ticks = fence(text).length > 3 ? "``" : "`"; return `${ticks}${text}${ticks}`; };

function labelLine(item) {
  if (item.mode === "function") return "Assembled by running the app's builder function with placeholder arguments such as `<NAME>`.";
  if (item.label === "assembled") return "Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.";
  return "Exact text from the bundle.";
}

function renderEntry(item) {
  const lines = [`### ${item.title}`, "",
    `Source: \`${item.file}\`, ${item.mode === "function" ? `function \`${item.field}\`, ` : ""}offset ${item.offset}, SHA-256 \`${item.sha256}\`.`, ""];
  const facts = [labelLine(item)];
  if (item.messageId) facts.push(`Message id ${code(item.messageId)}.`);
  if (item.occurrences > 1) facts.push(`The same text ships at ${item.occurrences} places in the bundle; the first is shown.`);
  if (item.fallback) facts.push(item.fallback);
  if (item.use) facts.push(item.use);
  if (item.note && item.mode === "function") facts.push(item.note);
  lines.push(facts.join(" "), "");
  if (item.note && item.mode !== "function") lines.push(`Translator note: ${item.note.replace(/\s+/g, " ").trim()}`, "");
  const f = fence(item.text);
  lines.push(`${f}text`, item.text.replace(/\n+$/, ""), f, "");
  return lines;
}

// A not-found reason without build-specific file names and offsets, so a still-missing entry
// does not change the page on every build. The coverage JSON keeps the full reason.
const pageReason = reason => reason
  .replace(/^\[[^\]]+\] /, "")
  .replace(/(?:webview\/assets|\.vite\/build)\/[\w.-]+\.js(?:@\d+)?/g, "a bundle file")
  .replace(/ at \d+/g, "");

// The phrases an entry's `use` and `fallback` sentences rely on, near the anchor in its file.
function contextHolds(asar, item) {
  if (!item.context?.length) return true;
  const entry = asar.appScripts.find(candidate => candidate.path === item.file);
  const source = entry ? asar.textOf(entry) : "";
  const at = source.indexOf(item.anchor);
  const near = at < 0 ? "" : source.slice(Math.max(0, at - 1500), at + 1500);
  return item.context.every(phrase => near.includes(phrase));
}

function renderPage(page, items, missing, context) {
  const lines = [`# ${page.title}`, "",
    `Source: \`app.asar\` of the Codex/ChatGPT desktop app ${context.version} (build ${context.build}), SHA-256 \`${context.asarSha256}\`.`, "",
    page.summary, "",
    `ChatGPT's own system prompt is not in the app; the servers add it. The phrase "You are ChatGPT" occurs in ${context.youAreChatgpt === 0 ? "none" : context.youAreChatgpt} of the app's scripts.`, "",
    "Each entry says whether its text is exact (one literal in the bundle) or assembled (literal pieces joined as the app joins them). Entries with a message id or translator note are formatjs messages: the text shown is the English source (`defaultMessage`), and the app sends the model whatever the user's language translates it to.", ""];
  const groups = [...new Set(page.entries.map(entry => entry.group))];
  for (const group of groups) {
    const members = items.filter(item => item.group === group);
    if (!members.length) continue;
    lines.push(`## ${group}`, "");
    if (unconfirmedGroups[group]) lines.push(unconfirmedGroups[group], "");
    for (const item of members) lines.push(...renderEntry(item));
  }
  if (missing.length) {
    lines.push(`## ${NOT_FOUND}`, "", "These entries' anchors did not resolve in this build.", "");
    for (const entry of missing) lines.push(`- \`${entry.id}\` (${entry.title}), anchor ${code(entry.anchor)}: ${pageReason(entry.reason)}`);
    lines.push("");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

// Extracts every page. Never throws for a changed app: a failed entry is reported as not found.
export function buildPages(asar, context, pages = chatgptPages, distinct = chatgptDistinctBranches) {
  const extracted = new Map();
  const missing = new Map();
  for (const page of pages) {
    for (const spec of page.entries) {
      try {
        const extract = EXTRACTORS[spec.mode];
        if (!extract) throw new Error(`unknown mode ${spec.mode}`);
        extracted.set(spec.id, extract(asar, spec));
      } catch (error) {
        missing.set(spec.id, { ...spec, reason: error.message });
      }
    }
  }
  for (const group of distinct) {
    const texts = group.map(id => extracted.get(id)?.text);
    if (texts.some(text => text == null) || new Set(texts).size === texts.length) continue;
    for (const id of group) {
      missing.set(id, { ...extracted.get(id), reason: `branches ${group.join(", ")} produced identical text` });
      extracted.delete(id);
    }
  }
  const unconfirmed = [];
  for (const [id, item] of extracted) {
    if (contextHolds(asar, item)) continue;
    extracted.set(id, { ...item, use: null, fallback: null });
    unconfirmed.push(id);
  }
  const withheld = [];
  for (const [id, item] of extracted) {
    const reason = withheldReason(item);
    if (reason) { withheld.push({ id, reason }); extracted.delete(id); }
  }

  const docs = new Map();
  const coverage = new Map();
  for (const page of pages) {
    const items = page.entries.map(entry => extracted.get(entry.id)).filter(Boolean);
    const pageMissing = page.entries.map(entry => missing.get(entry.id)).filter(Boolean);
    docs.set(page.page, renderPage(page, items, pageMissing, context));
    coverage.set(page.page.replace(/\.md$/, ".json"), `${JSON.stringify({
      page: `outputs/${page.page}`,
      app_version: context.version,
      app_build: context.build,
      source: { asar_sha256: context.asarSha256 },
      items: items.map(item => ({ id: item.id, title: item.title, label: item.label, message_id: item.messageId ?? null, source_file: item.file, byte_offset: item.offset, sha256: item.sha256, text: item.text })),
      not_found: pageMissing.map(entry => ({ id: entry.id, anchor: entry.anchor, reason: entry.reason }))
    }, null, 1)}\n`);
  }
  const published = [...extracted.values()];
  return {
    docs,
    coverage,
    summary: {
      published: published.length,
      exact: published.filter(item => item.label === "exact").length,
      assembled: published.filter(item => item.label === "assembled").length,
      not_found: [...missing.keys()],
      context_unconfirmed: unconfirmed,
      withheld
    }
  };
}

function main() {
  // CHATGPT_PROMPTS_ROOT redirects outputs/ and work/ (tests only).
  const repo = process.env.CHATGPT_PROMPTS_ROOT || path.resolve(import.meta.dirname, "..", "..");
  let asar;
  let context;
  try {
    const app = codexApp();
    const plist = key => execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print ${key}`, app.plist], { encoding: "utf8" }).trim();
    asar = openAsar(app.asar);
    context = {
      version: plist("CFBundleShortVersionString"),
      build: plist("CFBundleVersion"),
      asarSha256: asar.sha256,
      youAreChatgpt: asar.findPhrase("You are ChatGPT").length
    };
  } catch (error) {
    console.error(`chatgpt prompts: cannot read the app: ${error.message}`);
    process.exit(2);
  }
  const { docs, coverage, summary } = buildPages(asar, context);

  const committed = new Map();
  for (const name of docs.keys()) {
    try {
      committed.set(name, execFileSync("git", ["show", `HEAD:outputs/${name}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
    } catch {
      // A page not yet committed is new.
    }
  }
  const changes = renderChangedDocuments(semanticDiff(committed, docs));
  const diffFile = path.join(repo, "work", "chatgpt-prompts-diff.md");
  if (changes) {
    fs.mkdirSync(path.dirname(diffFile), { recursive: true });
    fs.writeFileSync(diffFile, `# ChatGPT prompts\n\n${changes}`);
  } else {
    fs.rmSync(diffFile, { force: true });
  }
  fs.mkdirSync(path.join(repo, "outputs"), { recursive: true });
  for (const [name, text] of [...docs, ...coverage]) fs.writeFileSync(path.join(repo, "outputs", name), text);
  console.log(JSON.stringify({ pages: docs.size, ...summary, changed: Boolean(changes) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
