#!/usr/bin/env node
// Prompts compiled into the bundled Codex CLI, read from the openai/codex source at the tag
// that matches it (00_fetch_sources.sh checks that tag out into work/codex-src).
//
// Two kinds of source: prompt template files (Rust embeds them verbatim with include_str!)
// and long string constants in prompt-building Rust code. An item is published only when its
// exact UTF-8 bytes are found in one of the shipped executables; source files that are not in
// this build are listed by path. Writes:
//   outputs/codex-cli-prompts.md         templates and constants, grouped by area
//   outputs/codex-cli-bundled-skills.md  the sample skills the CLI ships
//   outputs/codex-cli-prompts.json       provenance for every item
//   work/codex-cli-prompts-diff.md       semantic changes against the committed pages (absent when none)
//
// Usage: node extract/codex-config/07_cli_prompts.mjs

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { codexApp } from "../codex/lib/app-layout.mjs";
import { renderChangedDocuments, semanticDiff } from "../codex/lib/semantic-diff.mjs";

const repo = path.resolve(import.meta.dirname, "..", "..");
const work = path.join(repo, "work");
const src = path.join(work, "codex-src", "codex-rs");
const outputs = path.join(repo, "outputs");
const NAMES = { prompts: "codex-cli-prompts.md", skills: "codex-cli-bundled-skills.md", json: "codex-cli-prompts.json" };

const tag = fs.readFileSync(path.join(work, "codex-config", "tag.txt"), "utf8").trim();
const commit = fs.readFileSync(path.join(work, "codex-config", "source-commit.txt"), "utf8").trim();
const app = codexApp();
const cliVersion = execFileSync(app.entrypoint, ["--version"], { encoding: "utf8" }).trim();
if (`rust-v${cliVersion.split(" ").at(-1)}` !== tag) throw new Error(`source tag ${tag} does not match the bundled ${cliVersion}; rerun 00_fetch_sources.sh`);

// Every executable in the CLI package: the main binary, plus helpers beside the entrypoint.
const binDir = path.dirname(app.entrypoint);
const executables = [app.binary, ...fs.readdirSync(binDir).map(name => path.join(binDir, name)).filter(file => file !== app.entrypoint)]
  .map(file => ({ name: path.basename(file), bytes: fs.readFileSync(file) }));
const shippedIn = text => executables.find(exe => exe.bytes.includes(Buffer.from(text, "utf8")))?.name ?? null;

const sha256 = text => crypto.createHash("sha256").update(text).digest("hex");
const rel = file => path.relative(src, file).split(path.sep).join("/");
function walk(dir, keep, skip = /^(?:target|node_modules|vendor|snapshots|tests?|docs|\.git)$/) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (!skip.test(entry.name)) found.push(...walk(full, keep, skip)); }
    else if (keep(full)) found.push(full);
  }
  return found.sort();
}

// Template files. Docs, UI assets and data lists are not prompts.
const NOT_PROMPTS = /(?:^|\/)(?:README|CHANGELOG|LICENSE|AGENTS|CONTRIBUTING|SECURITY|NEWS|CODE-OF-CONDUCT)[^/]*$|^(?:config\.md|core\/src\/config\/schema\.md|tui\/styles\.md|tui\/assets\/tooltips\.txt|core\/assets\/agent\/agent_names\.txt|ext\/extension-api\/notes\.md)$/;
const templateFiles = walk(src, file => /\.(?:md|xml|txt)$/.test(file) && !NOT_PROMPTS.test(rel(file)));

// String constants of prompt text in prompt-building code (grammars and schemas excluded).
const CONST_DIRS = ["prompts/src", "ext", "core/src/tools", "core/src/guardian"];
const constPattern = /(?:const|static)\s+([A-Z0-9_]+)\s*:\s*&(?:'static\s+)?str\s*=\s*(?:r(#*)"([\s\S]*?)"\2|"((?:[^"\\]|\\[\s\S])*)")\s*;/g;
const unescape = text => text.replace(/\\(u\{[0-9a-fA-F]+\}|x[0-9a-fA-F]{2}|[ntr0\\"']|\n\s*)/g, (match, code) =>
  code[0] === "u" ? String.fromCodePoint(parseInt(code.slice(2, -1), 16))
    : code[0] === "x" ? String.fromCharCode(parseInt(code.slice(1), 16))
      : { n: "\n", t: "\t", r: "\r", 0: "\0", "\\": "\\", '"': '"', "'": "'" }[code] ?? "");
const constants = [];
for (const dir of CONST_DIRS.map(d => path.join(src, d)).filter(fs.existsSync)) {
  for (const file of walk(dir, full => full.endsWith(".rs") && !/_tests?\.rs$/.test(full))) {
    const code = fs.readFileSync(file, "utf8");
    for (const match of code.matchAll(constPattern)) {
      const text = match[3] ?? unescape(match[4]);
      if (text.length >= 150 && !/(?:SCHEMA|GRAMMAR)$/.test(match[1])) constants.push({ file, name: match[1], text });
    }
  }
}

const AREAS = [
  [/guardian/, "Auto-review (guardian)"],
  [/permissions/, "Permissions and sandbox"],
  [/compact/, "Compaction"],
  [/review/, "Code review"],
  [/realtime/, "Realtime voice"],
  [/persistent_mode/, "Persistent mode"],
  [/memories/, "Memories"],
  [/^ext\/goal\//, "Goals"],
  [/^collaboration-mode-templates\//, "Collaboration modes"],
  [/multi_agent/, "Multi-agent"],
  [/^ext\/skills\//, "Skills"],
  [/^models-manager\/prompt\.md$|base_instructions/, "Fallback base instructions"],
  [/prompt_for_init_command/, "The /init command"],
  [/git-attribution/, "Git attribution"],
  [/history-notes/, "History and notes tools"],
  [/model_messages/, "Model messages"],
  [/description|tools\//, "Tool descriptions"]
];
const areaOf = source => AREAS.find(([pattern]) => pattern.test(source))?.[1] ?? "Other";
const words = name => name.replace(/\.[a-z]+$/, "").replace(/[_-]+/g, " ").trim().toLowerCase().replace(/^./, c => c.toUpperCase());

const items = [];
const notInBuild = [];
const byText = new Map();
function add({ source, kind, title, area, document, text }) {
  const shipped = shippedIn(text);
  if (!shipped) { notInBuild.push(source); return; }
  const same = byText.get(text);
  if (same) { same.also.push(source); return; }
  const item = { id: source.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), document, area, title, kind, source, also: [], executable: shipped, bytes: Buffer.byteLength(text), sha256: sha256(text), text };
  byText.set(text, item);
  items.push(item);
}
for (const file of templateFiles) {
  const source = rel(file);
  const skill = /^skills\/src\/assets\/samples\/([^/]+)\/(.+)$/.exec(source);
  const text = fs.readFileSync(file, "utf8");
  if (skill) add({ source, kind: "file", document: NAMES.skills, area: skill[1], title: skill[2], text });
  else add({ source, kind: "file", document: NAMES.prompts, area: areaOf(source), title: words(path.basename(source)), text });
}
for (const constant of constants) {
  const source = `${rel(constant.file)}::${constant.name}`;
  add({ source, kind: "constant", document: NAMES.prompts, area: areaOf(rel(constant.file)), title: words(constant.name), text: constant.text });
}

const fence = text => "`".repeat(Math.max(3, 1 + Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))));
const sourceLine = `Source: openai/codex \`${tag}\` (commit \`${commit.slice(0, 12)}\`), matching the bundled \`${cliVersion}\`.`;
function page(title, intro, document, order) {
  // The source line comes first under the heading, where the semantic diff treats it as provenance.
  const lines = [`# ${title}`, "", sourceLine, "", intro, ""];
  const groups = new Map();
  for (const item of items.filter(i => i.document === document)) (groups.get(item.area) ?? groups.set(item.area, []).get(item.area)).push(item);
  const areas = [...groups.keys()].sort((a, b) => order(a) - order(b) || a.localeCompare(b));
  for (const area of areas) {
    lines.push(`## ${area}`, "");
    const seen = new Map();
    for (const item of groups.get(area)) {
      const n = (seen.get(item.title) ?? 0) + 1;
      seen.set(item.title, n);
      const where = [item.source, ...item.also].map(s => `\`codex-rs/${s}\``).join(", ");
      const f = fence(item.text);
      lines.push(`### ${n > 1 ? `${item.title} (${n})` : item.title}`, "",
        `Source: ${where}${item.executable === path.basename(app.binary) ? "" : ` (in \`${item.executable}\`)`}, SHA-256 \`${item.sha256}\`.`, "",
        `${f}text`, item.text.replace(/\n+$/, ""), f, "");
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
const areaOrder = area => { const i = AREAS.findIndex(([, name]) => name === area); return i < 0 ? AREAS.length : i; };
const promptsPage = page("Codex CLI prompts",
  "Prompt templates and prompt text compiled into the Codex CLI that ships inside the ChatGPT desktop app. Each one is read from the open-source openai/codex repository at the release tag that matches the bundled CLI, and appears here only when its exact bytes are found in the shipped executable. Placeholders such as `{{ extra_policy }}` are filled in at run time.",
  NAMES.prompts, areaOrder) + (notInBuild.length ? `\n## In the source but not in this build\n\nThese prompt files are in the source at this tag, but their text is not in the shipped executable, so they are not shown above.\n\n${[...new Set(notInBuild)].sort().map(s => `- \`codex-rs/${s}\``).join("\n")}\n` : "");
const skillsPage = page("Codex CLI bundled skills",
  "The sample skills built into the Codex CLI, each with its SKILL.md and reference files. They are read from the openai/codex source at the tag that matches the bundled CLI and checked byte for byte against the shipped executable.",
  NAMES.skills, () => 0);
const provenance = {
  source: { repository: "openai/codex", tag, commit, cli_version: cliVersion },
  items: items.map(({ text, also, ...item }) => ({ ...item, also_at: also })),
  in_source_not_in_build: [...new Set(notInBuild)].sort()
};

// Semantic diff against the committed pages (run_all.sh has not committed anything yet).
const committed = name => { try { return execFileSync("git", ["show", `HEAD:outputs/${name}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
const before = new Map([NAMES.prompts, NAMES.skills].map(name => [name, committed(name)]).filter(([, text]) => text != null));
const after = new Map([[NAMES.prompts, promptsPage], [NAMES.skills, skillsPage]]);
const changes = renderChangedDocuments(semanticDiff(before, after));
const diffFile = path.join(work, "codex-cli-prompts-diff.md");
if (changes) fs.writeFileSync(diffFile, `# Codex CLI prompt changes (${tag})\n\n${changes}`);
else fs.rmSync(diffFile, { force: true });

fs.writeFileSync(path.join(outputs, NAMES.prompts), promptsPage);
fs.writeFileSync(path.join(outputs, NAMES.skills), skillsPage);
fs.writeFileSync(path.join(outputs, NAMES.json), `${JSON.stringify(provenance, null, 2)}\n`);
const count = document => items.filter(i => i.document === document).length;
console.log(`codex-cli-prompts: ${count(NAMES.prompts)} prompts, ${count(NAMES.skills)} skill files, ${provenance.in_source_not_in_build.length} source files not in this build${changes ? "; changes written to work/codex-cli-prompts-diff.md" : ""}`);
