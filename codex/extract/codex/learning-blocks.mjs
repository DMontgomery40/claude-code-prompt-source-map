#!/usr/bin/env node
// Publishes the ChatGPT learning blocks the Codex/ChatGPT desktop app ships in app.asar: the
// interactive math, physics and science visualizations ChatGPT attaches to an answer. Each block
// has a manifest module (webview/assets/type-<hash>.js: type, version, thumbnail key, parameters,
// optional canonical formula) and a registration in the learning-block registry chunk that
// lazy-loads its visualization module. Writes:
//   outputs/chatgpt-learning-blocks.md    how a block reaches the conversation, then every block
//   outputs/chatgpt-learning-blocks.json  every block's manifest, renderer and source files
// plus work/learning-blocks-diff.md (semantic changes against the committed page; absent when
// none), and prints one JSON summary line.
//
// Manifest modules are evaluated in a node:vm context with only the bundle's own lazy-init
// runtime available; a manifest that needs anything else is listed from its literals and marked.
// Exit 2 when the app, the asar or the registry cannot be found.
//
// Usage: node extract/codex/learning-blocks.mjs

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { codexApp } from "./lib/app-layout.mjs";
import { openAsar } from "./lib/asar.mjs";
import { sandboxContext } from "./lib/js-scan.mjs";
import { privacyScan } from "./lib/privacy.mjs";
import { renderChangedDocuments, semanticDiff } from "./lib/semantic-diff.mjs";

const ASSETS = "webview/assets/";
const PAGE = "chatgpt-learning-blocks";
const ENUM_PREFIX = "CHATGPT_MATH_BLOCK_TYPE_";
const NOT_FOUND = "Not found in this build";

// Renderers, recognised by the bundle files a block's visualization preloads (the registry's
// __vite__mapDeps list for its dynamic import). First match wins.
export const RENDERERS = [
  { key: "three", label: "three.js 3D scenes", test: dep => /^three[.-]/.test(dep) },
  { key: "jsxgraph", label: "JSXGraph 2D graphs", test: dep => /^jsxgraph-/.test(dep) },
  { key: "lottie", label: "Lottie animations", test: dep => /lottie/.test(dep) },
  { key: "svg", label: "Other views (no three.js or Lottie dependency)", test: () => false }
];
const UNREGISTERED = { key: "none", label: "Manifest only (no renderer registered in this build)" };

// How a block reaches the conversation. Each fact is published only when every anchor string
// occurs in the app's scripts; otherwise it is listed as not found in this build.
export const TRIGGER_FACTS = [
  {
    anchors: ["category:`learning_block`", "matched_type", "server_learning_block_version", "encoded_initial_values"],
    text: "A block arrives as a **content reference** on an assistant message, category `learning_block`. Its data names the block (`matched_type`), the widget (`widget_type`), the server's block version (`server_learning_block_version`) and the starting parameter values (`encoded_initial_values`). The model's answer text is not changed; the app renders the matched block beside it, inline or as a card (`display_mode`)."
  },
  {
    anchors: ["CHATGPT_MATH_BLOCK_RENDER_SOURCE_GENUI_LEARNING_BLOCK"],
    text: "The render source the app reports for these blocks is `CHATGPT_MATH_BLOCK_RENDER_SOURCE_GENUI_LEARNING_BLOCK`: the server's generative-UI layer matched the answer to a block type. The app does not choose blocks itself."
  },
  {
    anchors: ["canonicalFormula", "`canonical_formula`", "content_is_placeholder"],
    text: "Formula blocks carry a `canonicalFormula` (and some `canonicalFormulaAliases`) in their manifest. The app uses the formula only as display text: it shows it when the reference's `content_type` is `canonical_formula` or `placeholder`, and otherwise shows the content the server sent. No app code reads the aliases, so no matching of the model's equations happens in the app."
  },
  {
    anchors: ["/conversation/message/learning-blocks/feedback", "rendered_learning_block_version", "user_edited_learning_block"],
    text: "Feedback on a block is posted to `POST /conversation/message/learning-blocks/feedback` with the matched type, the rendered and server block versions, the initial values, whether the user edited the block, and the chosen reasons."
  },
  {
    anchors: ["learning_block_suggested_followup", "followups_v2_followup_source"],
    text: "A block can offer follow-up questions. Choosing one sends a new user message whose metadata marks it `followups_v2_followup_source: \"learning_block_suggested_followup\"`, so the request records that the question came from a block."
  },
  {
    anchors: ["/conversation/{conversation_id}/message/{message_id}/genui/refresh_widget", "genui_refresh"],
    text: "Generative-UI widgets on a message that are still being completed are polled through `POST /conversation/{conversation_id}/message/{message_id}/genui/refresh_widget` (message metadata `genui_refresh`)."
  },
  {
    anchors: ["CODEX_LEARNING_BLOCK_ACTION_IMPRESSION", "CODEX_LEARNING_BLOCK_ACTION_FALLBACK"],
    text: "Analytics actions: `CODEX_LEARNING_BLOCK_ACTION_IMPRESSION`, `_FALLBACK`, `_FOLLOW_UP_SHOWN`, `_FOLLOW_UP_SELECTED`, `_FEEDBACK_OPENED`, `_FEEDBACK_SUBMITTED` and `_FEEDBACK_FAILED`."
  }
];

// ---------- module evaluation ----------

// Rewrites an ES module from the bundle into a script expression that evaluates to its exports.
// The module body runs in its own function scope; imported names resolve through a `with`
// scope of getters, and exports are getters, so both stay live bindings as in ES modules
// (a manifest is filled in only when its lazy initializer runs). Throws Unavailable when an
// import cannot be provided (the caller falls back to literals).
function scriptOf(text, resolveImport) {
  const bindings = [];
  let exportList = "";
  const body = text
    .replace(/\/\/# sourceMappingURL=\S*\s*$/, "")
    .replace(/import\{([^}]*)\}from"\.\/([^"]+)";?/g, (_, specs, file) => {
      const exports = resolveImport(file);
      if (!exports) throw new Unavailable(file);
      for (const spec of specs.split(",")) {
        const [imported, local] = spec.trim().split(/\s+as\s+/);
        if (!(imported in exports)) throw new Unavailable(`${file}#${imported}`);
        bindings.push(`get ${JSON.stringify(local ?? imported)}(){return __modules[${JSON.stringify(file)}][${JSON.stringify(imported)}]}`);
      }
      return "";
    })
    .replace(/import"\.\/[^"]+";?/g, "")
    .replace(/export\{([^}]*)\};?/, (_, list) => {
      exportList = list.split(",").map(spec => {
        const [local, name] = spec.trim().split(/\s+as\s+/);
        return `get ${JSON.stringify(name ?? local)}(){return ${local}}`;
      }).join(",");
      return "";
    });
  if (/\bimport\s*[{("`]|\bimport\(|\bimport\.meta\b/.test(body)) throw new Unavailable("dynamic import");
  return `(function(){with({${bindings.join(",")}}){return (function(){${body}\nreturn {${exportList}};})();}})()`;
}

class Unavailable extends Error {}

// Evaluates small bundle modules, each in its own scope inside one vm context. Only modules
// under maxBytes are run, so no large app chunk is ever executed.
export function moduleEvaluator(readModule, { maxBytes = 64 * 1024 } = {}) {
  const context = sandboxContext({ __modules: {}, __exports: null, __result: null });
  const cache = new Map();
  function evaluate(file) {
    if (cache.has(file)) return cache.get(file);
    cache.set(file, null);
    const text = readModule(file);
    if (text == null || Buffer.byteLength(text) > maxBytes) return null;
    try {
      const script = scriptOf(text, dep => {
        const exports = evaluate(dep);
        if (exports) context.__modules[dep] = exports;
        return exports;
      });
      const exports = vm.runInContext(script, context, { timeout: 500 });
      cache.set(file, exports);
      return exports;
    } catch (error) {
      if (error instanceof Unavailable || error?.name === "SyntaxError" || error?.name === "ReferenceError" || error?.name === "TypeError") return null;
      throw error;
    }
  }
  // A manifest module exports a lazy initializer and the manifest it fills in.
  function manifest(file) {
    const exports = evaluate(file);
    if (!exports) return null;
    context.__exports = exports;
    vm.runInContext(`
      for (const value of Object.values(__exports)) if (typeof value === "function" && value.length === 0) { try { value(); } catch {} }
      __result = JSON.stringify(Object.values(__exports).find(v => v && typeof v === "object" && typeof v.type === "string" && "version" in v) ?? null);
    `, context, { timeout: 500 });
    return JSON.parse(context.__result);
  }
  return { evaluate, manifest };
}

// The literals of a manifest module that could not be evaluated.
export function manifestLiterals(text) {
  const vars = new Map([...text.matchAll(/\b([A-Za-z_$][\w$]*)=`([^`]*)`/g)].map(m => [m[1], m[2]]));
  const value = token => token?.startsWith("`") ? token.slice(1, -1) : vars.get(token);
  const type = value(text.match(/\btype:([A-Za-z_$][\w$]*|`[^`]*`)/)?.[1]);
  const version = Number(text.match(/\bversion:(\d+)/)?.[1]);
  const thumbnailAssetKey = value(text.match(/\bthumbnailAssetKey:([A-Za-z_$][\w$]*|`[^`]*`)/)?.[1]);
  return type ? { type, version: Number.isFinite(version) ? version : null, thumbnailAssetKey: thumbnailAssetKey ?? null } : null;
}

// ---------- registry ----------

// Registrations in the registry chunk, one per visualization module: the lazy import in the
// registration's `visualization:` slot, its export, its preload list, and the registration's
// analyticsMathBlockType (`UNSPECIFIED` for blocks registered without an analytics type).
export function parseRegistry(text) {
  const deps = JSON.parse(text.match(/m\.f\|\|\(m\.f=(\[[^\]]*\])/)?.[1] ?? "[]").map(dep => dep.replace(/^\.\//, ""));
  const slot = /visualization:\(0,[\w$]+\.lazy\)\(\(\)=>[\w$]+\(\(\)=>import\(`\.\/([^`]+\.js)`\)\.then\(\w+=>\(\{default:\w+\.([\w$]+)\}\)\),__vite__mapDeps\(\[([\d,]*)\]\)/g;
  const typeMark = new RegExp(`analyticsMathBlockType:[\\w$]+\\.${ENUM_PREFIX}([A-Z0-9_]+)`, "g");
  const marks = [...text.matchAll(typeMark)];
  const out = new Map();
  let previousSlot = 0;
  for (const m of text.matchAll(slot)) {
    // The analytics type of this registration: the last one after the previous slot.
    const mark = marks.findLast(k => k.index < m.index && k.index >= previousSlot);
    previousSlot = m.index + m[0].length;
    if (out.has(m[1])) continue;
    out.set(m[1], {
      analyticsType: mark?.[1] ?? null,
      module: m[1],
      exportName: m[2],
      preload: m[3].split(",").filter(Boolean).map(i => deps[Number(i)]).filter(Boolean)
    });
  }
  return out;
}

export const rendererOf = files => RENDERERS.find(r => files.some(dep => r.test(dep))) ?? RENDERERS.at(-1);
const staticImports = text => [...text.matchAll(/from"\.\/([^"]+)"/g)].map(m => m[1]);
// A view module's own description of its block: the first aria label it formats.
export const describedAs = text => text.match(/ariaLabel:[\w$.()]*?formatMessage\(\{id:`[^`]*`,defaultMessage:`([^`$]*)`/)?.[1]?.trim() || null;

// ---------- document ----------

const titleFromType = type => {
  const words = type.toLowerCase().split("_").filter(Boolean);
  const s = words.join(" ").replace(/\bv(\d+)$/, "(v$1)");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const code = value => {
  const text = String(value);
  const ticks = text.includes("`") ? "``" : "`";
  return `${ticks}${ticks.length > 1 && text.startsWith("`") ? " " : ""}${text}${ticks.length > 1 && text.endsWith("`") ? " " : ""}${ticks}`;
};
const shown = value => (typeof value === "string" ? value : JSON.stringify(value));

export function describeParameter(name, spec = {}) {
  const facts = [spec.kind ?? "value"];
  if ("defaultValue" in spec) facts.push(`default ${code(shown(spec.defaultValue))}`);
  if (Array.isArray(spec.allowedValues)) facts.push(`one of ${spec.allowedValues.map(v => code(shown(v))).join(", ")}`);
  const min = spec.min ?? spec.minimum;
  const max = spec.max ?? spec.maximum;
  if (min != null || max != null) facts.push(`range ${min ?? "…"} to ${max ?? "…"}`);
  if (spec.step != null) facts.push(`step ${spec.step}`);
  if (spec.unit) facts.push(`unit ${code(spec.unit)}`);
  return `${code(name)} (${facts.join(", ")})`;
}

export function buildDocument(asar, app) {
  const entries = asar.entries.filter(e => e.path.startsWith(ASSETS));
  const byName = new Map(entries.map(e => [e.path.slice(ASSETS.length), e]));
  const text = name => (byName.has(name) ? asar.textOf(byName.get(name)) : null);
  const scripts = entries.filter(e => /\.m?js$/.test(e.path));

  // The enum of block types, the registry chunk and the lottie thumbnails.
  const enumFile = [...byName.keys()].find(n => /^chatgpt_math_blocks-[0-9a-f]+\.js$/.test(n));
  if (!enumFile) throw new RegistryError("no chatgpt_math_blocks-*.js in webview/assets");
  const enumTypes = [...new Set([...text(enumFile).matchAll(new RegExp(`${ENUM_PREFIX}([A-Z0-9_]+)`, "g"))].map(m => m[1]))]
    .filter(t => t !== "UNSPECIFIED");
  let registryFile = null, registryCount = 0;
  for (const entry of scripts) {
    const body = asar.textOf(entry);
    if (!body.includes("analyticsMathBlockType:")) continue;
    const count = body.split("analyticsMathBlockType:").length - 1;
    if (count > registryCount) { registryCount = count; registryFile = entry.path.slice(ASSETS.length); }
  }
  if (!registryFile) throw new RegistryError("no learning-block registry (analyticsMathBlockType) in webview/assets");
  const registry = parseRegistry(text(registryFile));

  const lottie = new Map();
  for (const name of byName.keys()) {
    const m = name.match(/^(.+-v\d+)-[0-9a-f]{12}\.json$/);
    if (m) lottie.set(m[1], name);
  }

  // Blocks: every registered view, with the manifest module it imports; then manifest modules no
  // registered view imports.
  const evaluator = moduleEvaluator(name => text(name));
  const manifestCache = new Map();
  let literalOnly = 0;
  const manifestFrom = name => {
    if (!manifestCache.has(name)) {
      let manifest = evaluator.manifest(name);
      let evaluated = true;
      if (!manifest) { manifest = manifestLiterals(text(name) ?? ""); evaluated = false; literalOnly += 1; }
      manifestCache.set(name, manifest ? { manifest, evaluated } : null);
    }
    return manifestCache.get(name);
  };
  const blocks = [];
  const reachedManifests = new Set();
  const add = ({ manifestFile, reg }) => {
    const found = manifestFile ? manifestFrom(manifestFile) : null;
    const manifest = found?.manifest ?? null;
    const type = manifest?.type ?? (reg?.analyticsType && reg.analyticsType !== "UNSPECIFIED" ? reg.analyticsType : null);
    if (!type) return;
    const viewText = reg ? text(reg.module) ?? "" : "";
    const thumbFile = manifest?.thumbnailAssetKey ? lottie.get(manifest.thumbnailAssetKey) ?? null : null;
    let animationTitle = null;
    if (thumbFile) {
      try { animationTitle = JSON.parse(text(thumbFile)).nm ?? null; } catch { animationTitle = null; }
    }
    blocks.push({
      type,
      title: animationTitle || titleFromType(type),
      title_source: animationTitle ? "thumbnail animation name" : "type name",
      description: reg ? describedAs(viewText) : null,
      version: manifest?.version ?? null,
      renderer: reg ? rendererOf([...reg.preload, ...staticImports(viewText)]).key : UNREGISTERED.key,
      analytics_type: reg?.analyticsType ?? null,
      in_type_enum: enumTypes.includes(type),
      canonical_formula: manifest?.canonicalFormula ?? null,
      canonical_formula_aliases: manifest?.canonicalFormulaAliases ?? [],
      parameters: manifest?.parameters ?? null,
      manifest_evaluated: found ? found.evaluated : null,
      thumbnail: manifest?.thumbnailAssetKey ?? null,
      thumbnail_animation: thumbFile ? `${ASSETS}${thumbFile}` : null,
      source: {
        manifest: manifestFile ? `${ASSETS}${manifestFile}` : `${ASSETS}${registryFile} (inline)`,
        visualization: reg ? `${ASSETS}${reg.module}` : null,
        visualization_export: reg?.exportName ?? null
      }
    });
  };
  // A view's manifest: the first module it imports (or one of those imports) that ships a
  // manifest literal and evaluates to {type, version}; type-*.js first.
  const probed = new Map();
  const probe = dep => {
    if (!probed.has(dep)) probed.set(dep, Boolean(evaluator.manifest(dep)?.type));
    return probed.get(dep);
  };
  const holdsManifest = dep => byName.has(dep) && (text(dep) ?? "").includes("thumbnailAssetKey");
  const manifestOf = view => {
    const direct = staticImports(text(view) ?? "").filter(dep => !/^(rolldown-runtime|app-shared)-/.test(dep));
    const ordered = [...direct.filter(d => /^type-/.test(d)), ...direct.filter(d => !/^type-/.test(d))];
    const candidates = [...ordered.filter(holdsManifest), ...ordered.flatMap(d => staticImports(text(d) ?? "").filter(holdsManifest))];
    return [...new Set(candidates)].find(dep => probe(dep)) ?? candidates.find(d => /^type-/.test(d)) ?? null;
  };
  for (const reg of registry.values()) {
    const manifestFile = manifestOf(reg.module);
    if (manifestFile) reachedManifests.add(manifestFile);
    add({ manifestFile, reg });
  }
  for (const name of [...byName.keys()].filter(n => /^type-[0-9a-f]+\.js$/.test(n)).sort()) {
    if (!reachedManifests.has(name) && text(name).includes("thumbnailAssetKey")) add({ manifestFile: name, reg: null });
  }
  // One entry per type: the highest manifest version wins, earlier versions are noted.
  const byType = new Map();
  for (const block of blocks) {
    const seen = byType.get(block.type);
    if (!seen) byType.set(block.type, { ...block, other_versions: [] });
    else if ((block.version ?? 0) > (seen.version ?? 0)) byType.set(block.type, { ...block, other_versions: [...seen.other_versions, seen.version] });
    else seen.other_versions.push(block.version);
  }
  const unique = [...byType.values()].sort((a, b) => a.title.localeCompare(b.title, "en") || a.type.localeCompare(b.type));
  const blockTypes = new Set(unique.map(b => b.type));
  const enumWithoutManifest = enumTypes.filter(t => !blockTypes.has(t)).sort();

  const all = asar.appScripts.map(e => asar.textOf(e));
  const present = anchor => all.some(body => body.includes(anchor));
  const facts = TRIGGER_FACTS.map(fact => ({ ...fact, found: fact.anchors.every(present) }));

  const counts = {
    manifest_modules: [...byName.keys()].filter(n => /^type-[0-9a-f]+\.js$/.test(n)).length,
    registered_views: registry.size,
    block_types: unique.length,
    type_enum_values: enumTypes.length,
    registered_renderers: unique.filter(b => b.renderer !== UNREGISTERED.key).length,
    inline_manifests: unique.filter(b => b.manifest_evaluated === null).length,
    inline_manifests_in_registry: unique.filter(b => b.manifest_evaluated === null && text(registryFile).includes(`\`${b.type}\``)).length,
    thumbnail_animations: unique.filter(b => b.thumbnail_animation).length,
    with_formula: unique.filter(b => b.canonical_formula).length,
    with_parameters: unique.filter(b => b.parameters && Object.keys(b.parameters).length).length,
    manifests_from_literals: literalOnly,
    by_renderer: Object.fromEntries([...RENDERERS, UNREGISTERED].map(r => [r.key, unique.filter(b => b.renderer === r.key).length]))
  };

  const md = renderMarkdown({ app, unique, counts, facts, enumWithoutManifest, registryFile, enumFile });
  const json = `${JSON.stringify({
    source: { app_version: app.version, app_build: app.build, registry: `${ASSETS}${registryFile}`, type_enum: `${ASSETS}${enumFile}` },
    counts,
    how_blocks_arrive: facts.map(f => ({ anchors: f.anchors, found: f.found })),
    type_enum_without_manifest: enumWithoutManifest,
    blocks: unique
  }, null, 2)}\n`;
  return { md, json, counts };
}

function renderMarkdown({ app, unique, counts, facts, enumWithoutManifest, registryFile, enumFile }) {
  const lines = [
    "# ChatGPT learning blocks",
    "",
    `Learning blocks are the interactive math, physics, chemistry, biology and data visualizations ChatGPT shows next to an answer: a graph, a 3D scene or an animation, often with sliders and switches the user can change. This build ships **${counts.block_types} block types**, ${counts.registered_renderers} with a view registered: ${counts.by_renderer.three} three.js 3D scenes, ${counts.by_renderer.jsxgraph ? `${counts.by_renderer.jsxgraph} JSXGraph 2D graphs, ` : ""}${counts.by_renderer.lottie} Lottie animations and ${counts.by_renderer.svg} other views (neither three.js nor Lottie). ${counts.thumbnail_animations} have an animated Lottie thumbnail, ${counts.with_formula} stand for a named formula, and ${counts.with_parameters} take parameters the server can set.`,
    "",
    `Source: ChatGPT desktop ${app.version} (build ${app.build}), \`app.asar\` → \`${ASSETS}\`: the block registry \`${registryFile}\` (${counts.registered_views} registered views), ${counts.manifest_modules} manifest modules (\`type-*.js\`) and the type enum \`${enumFile}\`.`,
    "",
    "## How a block reaches the conversation",
    "",
    ...facts.flatMap(f => [`- ${f.found ? f.text : `${NOT_FOUND}: ${f.anchors.map(a => code(a)).join(", ")}.`}`]),
    "",
    `Counting: a block type is one manifest \`type\` (or, for a view whose manifest is inline in the registry, its analytics type); where a type ships more than one view or manifest version, the highest version is listed. The type enum (\`${ENUM_PREFIX}*\`) has ${counts.type_enum_values} values; ${enumWithoutManifest.length ? `${enumWithoutManifest.length} of them have no registered view or manifest in this build (${enumWithoutManifest.slice(0, 12).map(t => code(t)).join(", ")}${enumWithoutManifest.length > 12 ? ", …; all are in the JSON" : ""})` : "every one has a block"}. Blocks registered without an analytics type (\`UNSPECIFIED\`) are identified by their manifest. ${counts.inline_manifests} blocks have no separate manifest module (${counts.inline_manifests_in_registry} of them are defined inside the registry chunk); their parameters are not listed here.${counts.manifests_from_literals ? ` ${counts.manifests_from_literals} manifest modules could not be evaluated and are listed from their literals only.` : ""} A title is the block's thumbnail animation name where it has one, otherwise its type name in words; the sentence under it is the view's own accessibility label.`,
    "",
    "## Blocks",
    ""
  ];
  for (const renderer of [...RENDERERS, UNREGISTERED]) {
    const group = unique.filter(b => b.renderer === renderer.key);
    if (!group.length) continue;
    lines.push(`### ${renderer.label} (${group.length})`, "");
    for (const block of group) {
      lines.push(`#### ${block.title}${block.canonical_formula && block.title_source === "type name" ? `: ${code(block.canonical_formula)}` : ""}`, "");
      if (block.description) lines.push(block.description.replace(/\s+/g, " "), "");
      const facts = [`Type ${code(block.type)}`];
      if (block.version != null) facts.push(`manifest v${block.version}${block.other_versions.filter(v => v != null).length ? ` (also v${block.other_versions.filter(v => v != null).join(", v")})` : ""}`);
      if (block.canonical_formula) facts.push(`formula ${code(block.canonical_formula)}${block.canonical_formula_aliases.length ? `, also ${block.canonical_formula_aliases.map(a => code(a)).join(", ")}` : ""}`);
      if (block.thumbnail_animation) facts.push("animated thumbnail");
      if (!block.in_type_enum) facts.push("not in the type enum");
      lines.push(`${facts.join(" · ")}.`, "");
      const params = Object.entries(block.parameters ?? {});
      if (params.length) lines.push(`Parameters: ${params.map(([name, spec]) => describeParameter(name, spec)).join("; ")}.`, "");
      else if (block.manifest_evaluated === false) lines.push("Parameters: not read (the manifest module could not be evaluated).", "");
      const file = value => value.replace(ASSETS, "");
      const src = [`manifest \`${file(block.source.manifest)}\``];
      if (block.source.visualization) src.push(`view \`${file(block.source.visualization)}\`${block.source.visualization_export ? ` → \`${block.source.visualization_export}\`` : ""}`);
      lines.push(`Source: ${src.join("; ")}.`, "");
    }
  }
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

export class RegistryError extends Error {}

function main() {
  // LEARNING_BLOCKS_ROOT redirects outputs/ and work/ (tests only).
  const repo = process.env.LEARNING_BLOCKS_ROOT || path.resolve(import.meta.dirname, "..", "..");
  let asar;
  let app;
  try {
    const layout = codexApp();
    const plist = key => execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print ${key}`, layout.plist], { encoding: "utf8" }).trim();
    asar = openAsar(layout.asar);
    app = { version: plist("CFBundleShortVersionString"), build: plist("CFBundleVersion") };
  } catch (error) {
    console.error(`learning blocks: cannot read the app: ${error.message}`);
    process.exit(2);
  }
  let built;
  try {
    built = buildDocument(asar, app);
  } catch (error) {
    if (error instanceof RegistryError) {
      console.error(`learning blocks: ${error.message}`);
      process.exit(2);
    }
    throw error;
  }
  const docs = new Map([[`${PAGE}.md`, built.md], [`${PAGE}.json`, built.json]]);
  privacyScan(docs);

  const committed = new Map();
  for (const name of docs.keys()) {
    try {
      committed.set(name, execFileSync("git", ["show", `HEAD:./outputs/${name}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 }));
    } catch {
      // A page not yet committed is new.
    }
  }
  const changes = renderChangedDocuments(semanticDiff(new Map([...committed].filter(([n]) => n.endsWith(".md"))), new Map([[`${PAGE}.md`, built.md]])));
  const diffFile = path.join(repo, "work", "learning-blocks-diff.md");
  if (changes) {
    fs.mkdirSync(path.dirname(diffFile), { recursive: true });
    fs.writeFileSync(diffFile, `# Learning blocks\n\n${changes}`);
  } else {
    fs.rmSync(diffFile, { force: true });
  }
  fs.mkdirSync(path.join(repo, "outputs"), { recursive: true });
  for (const [name, content] of docs) fs.writeFileSync(path.join(repo, "outputs", name), content);
  console.log(JSON.stringify({ page: PAGE, ...built.counts, changed: Boolean(changes) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
