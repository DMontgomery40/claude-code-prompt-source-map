// Configuration reference extraction for Claude Code (pinned build, see lib.mjs): settings.json keys,
// hook events, CLI commands/flags, and built-in slash commands.
// Usage: node extract/config-fetch.mjs   (once: docs + `--help` captures into work/config/)
//        node extract/config.mjs [settings|hooks|cli|slash ...]   (default: all)
//        node extract/config-verify.mjs   (contract checks against claude.exe)
// Inputs: work/extracted/ (embedded bundle), work/config/docs/*.md (official docs,
// fetched from https://code.claude.com/docs/llms.txt), work/config/help/*.txt
// (`claude … --help` output). Outputs: outputs/{settings,hooks,cli,slash-commands}.{json,md}.
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import * as walk from "acorn-walk";
import { provenance, VERSION, BINARY_SHA256 } from "./lib.mjs";
import { mod, resolve, describeSchema, objectShape, constValue, isLit, strValue, literalSite, constantsIn } from "./zodlite.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const DOCS = `${ROOT}work/config/docs/`;
const DOCS_URL = "https://code.claude.com/docs/en/";
const SETTINGS_CHUNK = "chunk-cd3sgqch.js";

// ---------- build guard ----------
// This script reads minified names from one specific build. Refuse to run on anything else.
{
  const manifest = JSON.parse(readFileSync(`${ROOT}work/embedded-manifest.json`, "utf8"));
  if (manifest.binary_sha256 !== BINARY_SHA256) throw new Error(`extracted bundle is from binary ${manifest.binary_sha256}, but this extractor is pinned to ${BINARY_SHA256} (Claude Code ${VERSION})`);
  const header = readFileSync(`${ROOT}work/extracted/${SETTINGS_CHUNK}`, "utf8").slice(0, 1200);
  if (!header.includes(`// Version: ${VERSION}\n`)) throw new Error(`${SETTINGS_CHUNK} does not carry the pinned version header ${VERSION}`);
}

// ---------- shared helpers ----------

const prov = (file, start, end) => provenance(file, mod(file).src, start, end);
const provRange = r => (r ? prov(r[0], r[1], r[2]) : null);
// Statically resolved module-level constants interpolated into a text: {constants: {name: value}} or {}.
function consts(file, node) {
  const site = node && literalSite(mod(file), node);
  const c = site ? constantsIn(site.m, site.node) : {};
  return Object.keys(c).length ? { constants: c } : {};
}
// Provenance for a description expression: the literal it reads first, then the use site if different.
function descProv(file, node) {
  const site = literalSite(mod(file), node);
  const out = [];
  if (site) out.push(prov(site.m.name, site.node.start, site.node.end));
  if (!site || site.node !== node) out.push(prov(file, node.start, node.end));
  return out;
}
const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const doc = name => (existsSync(`${DOCS}${name}.md`) ? readFileSync(`${DOCS}${name}.md`, "utf8") : "");
const readFnSource = (m, node) => m.src.slice(node.start, node.end);

function fence(text) {
  const runs = text.match(/`+|~+/g) || [];
  const longest = Math.max(5, ...runs.filter(r => r[0] === "~").map(r => r.length));
  const f = "~".repeat(longest + 1);
  return `${f}text\n${text}\n${f}`;
}

function sourceLine(p) {
  return p ? `Source: \`${p.file}\` · offset ${p.binary_offset} · sha256 \`${p.sha256.slice(0, 8)}…\`` : "Source: unavailable";
}

function renderMd(title, summary, items, renderBody) {
  const groups = [];
  const byGroup = new Map();
  for (const it of items) {
    if (!byGroup.has(it.group)) { byGroup.set(it.group, []); groups.push(it.group); }
    byGroup.get(it.group).push(it);
  }
  let out = `# ${title}\n\n${summary}\n`;
  for (const g of groups) {
    out += `\n## ${g}\n`;
    for (const it of byGroup.get(g)) {
      out += `\n### ${it.title}\n\n${sourceLine(it.provenance[0])}\n\n`;
      out += renderBody(it).trim() + "\n";
      if (it.details?.constants) out += `\nInterpolated constants (resolved from code): ${Object.entries(it.details.constants).map(([k, v]) => `\`${k}\` = \`${JSON.stringify(v)}\``).join("; ")}\n`;
      if (it.text) out += `\n${fence(it.text)}\n`;
    }
  }
  return out;
}

function writeArea(area, title, summary, items, renderBody) {
  const ids = new Set();
  for (const it of items) {
    if (ids.has(it.id)) throw new Error(`duplicate id ${it.id}`);
    ids.add(it.id);
    if (!it.provenance?.length || !it.provenance.every(p => p && Number.isInteger(p.binary_offset))) throw new Error(`missing provenance ${it.id}`);
  }
  writeFileSync(`${ROOT}outputs/${area}.json`, JSON.stringify({ area, version: VERSION, items }, null, 2) + "\n");
  writeFileSync(`${ROOT}outputs/${area}.md`, renderMd(title, summary, items, renderBody));
  console.log(`${area}: ${items.length} items`);
}

const statusLine = it => {
  if (it.details?.internal) return `Status: internal (description is tagged \`@internal\`; the JSON-schema generator omits it, from code)${it.documented ? `; documented at ${it.documented}` : "; undocumented"}`;
  if (it.details?.hidden) return `Status: hidden${it.documented ? `; documented at ${it.documented}` : "; undocumented"}`;
  return it.documented ? `Status: documented at ${it.documented}` : "Status: undocumented";
};

// ---------- settings ----------

function typeStr(d, depth = 0) {
  if (!d) return "unknown";
  let t;
  switch (d.type) {
    case "enum": t = Array.isArray(d.values) ? d.values.map(v => JSON.stringify(v)).join(" | ") : "enum"; break;
    case "literal": t = JSON.stringify(d.value); break;
    case "array": t = `array of ${typeStr(d.items, depth + 1)}`; break;
    case "record": t = `record<${d.keys?.type === "enum" ? typeStr(d.keys, depth + 1) : "string"}, ${typeStr(d.values, depth + 1)}>`; break;
    case "object": t = depth > 1 ? "object" : `object {${Object.keys(d.properties || {}).join(", ")}}`; break;
    case "union": t = (d.options || []).map(o => typeStr(o, depth + 1)).join(" | "); break;
    case "conditional": t = (d.options || []).map(o => typeStr(o, depth + 1)).join(" | "); break;
    case "unknown": t = "any JSON value"; break;
    default: t = d.type;
  }
  const c = d.constraints || {};
  const bits = [];
  if (c.int) bits.push("integer");
  if (c.positive) bits.push("> 0");
  if (c.nonnegative) bits.push(">= 0");
  for (const [k, sym] of [["min", ">="], ["gte", ">="], ["gt", ">"], ["max", "<="], ["lte", "<="], ["lt", "<"]]) if (c[k] !== undefined && c[k] !== "non-literal") bits.push(`${sym} ${c[k]}`);
  if (c.url) bits.push("URL");
  return bits.length && depth === 0 ? `${t} (${bits.join(", ")})` : t;
}

// Structured, code-free copy of a descriptor for JSON details.
function cleanDesc(d, depth = 0) {
  if (!d || typeof d !== "object") return d;
  const out = {};
  for (const [k, v] of Object.entries(d)) {
    if (k.startsWith("_") || k === "validated" || k === "preprocessed") continue;
    if (k === "properties") out.properties = Object.fromEntries(Object.entries(v).map(([pk, pv]) => [pk, cleanDesc(pv, depth + 1)]));
    else if (k === "items" || k === "values" && !Array.isArray(v) || k === "keys") out[k] = cleanDesc(v, depth + 1);
    else if (k === "options") out.options = v.map(o => cleanDesc(o, depth + 1));
    else out[k] = v;
  }
  return out;
}

// Feature-module permission modes: a constant list, or LIST.filter((e)=>!OTHER.includes(e)).
function evalModeList(m, node) {
  const v = constValue(m, node);
  if (Array.isArray(v)) return v;
  if (node.type === "CallExpression" && node.callee.property?.name === "filter") {
    const base = constValue(m, node.callee.object);
    const f = node.arguments[0];
    const t = f?.body;
    if (Array.isArray(base) && t?.type === "UnaryExpression" && t.operator === "!" && t.argument.callee?.property?.name === "includes") {
      const other = constValue(m, t.argument.callee.object);
      if (Array.isArray(other)) return base.filter(x => !other.includes(x));
    }
  }
  return ["{{unresolved}}"];
}

function settingsTree() {
  const m = mod(SETTINGS_CHUNK);
  const yot = m.decls.get("yot");
  if (!yot || !readFnSource(m, yot).includes("JSON Schema reference for Claude Code settings")) throw new Error("settings schema function moved");
  const inYot = n => n.start >= yot.start && n.end <= yot.end;
  // Feature modules contribute settings keys via zt[name].shape()/permissionsShape()/permissionModes().
  const zt = m.decls.get("zt").init;
  const Su = constValue(m, m.decls.get("Su").init);
  const unparen = n => { while (n.type === "ParenthesizedExpression") n = n.expression; return n; };
  const modules = {};
  for (const p of zt.properties) {
    const o = {};
    for (const q of p.value.properties) o[q.key.name] = q.value;
    const gate = o.buildGate ? constValue(m, unparen(o.buildGate.body)) : true;
    modules[p.key.name] = { gate: isLit(gate) ? gate : "unresolved", range: [p.start, p.end], ...o };
  }
  const tag = (props, name, gate) => { for (const v of Object.values(props)) { v.featureModule = name; v.buildGate = gate; v._moduleRange = [SETTINGS_CHUNK, ...modules[name].range]; } return props; };
  const ctx = {
    stack: [],
    special: {
      // yot's local r(schema, fn): validation wrapper around its first argument
      r: (mm, node, c, d) => (mm.name === SETTINGS_CHUNK && inYot(node) ? describeSchema(mm, node.arguments[0], c, d + 1) : { type: "unknown", note: "r outside yot" }),
    },
    spread: {
      Ar: (mm, node, c, d) => Object.assign({}, ...Su.map(n => tag(objectShape(m, unparen(modules[n].shape.body), c, d), n, modules[n].gate))),
      vr: (mm, node, c, d) => Object.assign({}, ...Su.filter(n => modules[n].permissionsShape).map(n => tag(objectShape(m, unparen(modules[n].permissionsShape.body), c, d), n, modules[n].gate))),
    },
    enumSpread: { wr: () => Su.flatMap(n => (modules[n].permissionModes ? evalModeList(m, unparen(modules[n].permissionModes.body)) : [])) },
  };
  const sDecl = yot.body.body.find(s => s.type === "FunctionDeclaration" && s.id.name === "s");
  ctx.special.s = (mm, node, c, d) => describeSchema(m, sDecl.body.body.at(-1).argument, c, d + 1);
  const tree = describeSchema(m, yot.body.body.at(-1).argument, ctx);

  // Self-check: every .describe( literal inside yot and the feature-module shapes must be captured.
  const captured = new Set();
  const collect = d => {
    if (!d || typeof d !== "object") return;
    if (d._descRange) captured.add(`${d._descRange[0]}:${d._descRange[1]}`);
    for (const v of Object.values(d.properties || {})) collect(v);
    collect(d.items); if (d.values && !Array.isArray(d.values)) collect(d.values); collect(d.keys);
    (d.options || []).forEach(collect);
  };
  collect(tree);
  const ranges = [[yot.start, yot.end], ...Object.values(modules).map(x => x.range)];
  let missing = 0;
  for (const [a, b] of ranges) {
    const re = /\.describe\(/g; re.lastIndex = a; let mm;
    while ((mm = re.exec(m.src)) && mm.index < b) {
      const argStart = mm.index + ".describe(".length;
      if (!captured.has(`${SETTINGS_CHUNK}:${argStart}`)) { missing++; console.warn(`settings: uncaptured describe at char ${argStart}`); }
    }
  }
  return { tree, modules, missing, m };
}

function settingsDocs() {
  const ref = doc("settings-reference");
  const anchors = new Map();
  for (const mm of ref.matchAll(/\[`([^`]+)`\]\(#([a-z0-9-]+)\)/g)) if (!anchors.has(mm[1])) anchors.set(mm[1], mm[2]);
  // section per heading key; doc category per `##`
  const sections = new Map();
  let category = null;
  const lines = ref.split("\n");
  let cur = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) { category = h2[1].trim(); cur = null; continue; }
    const h3 = line.match(/^### `([^`]+)`/);
    if (h3) { cur = { key: h3[1], category, body: "" }; sections.set(h3[1], cur); continue; }
    if (/^### /.test(line)) { cur = null; continue; }
    if (cur) cur.body += line + "\n";
  }
  const extraPages = ["settings", "permissions", "sandboxing", "statusline", "managed-settings", "server-managed-settings", "auto-mode-config", "model-config", "hooks", "mcp", "managed-mcp", "plugins__marketplace-reference", "plugins__org", "voice-dictation", "deep-links", "accessibility", "fullscreen", "terminal-config", "corporate-launcher", "network-config", "memory", "worktrees", "monitoring-usage", "output-styles", "fast-mode", "keybindings", "agent-view", "remote-control", "sub-agents", "skills", "data-usage", "costs"];
  const pages = extraPages.map(p => [p, doc(p)]).filter(([, t]) => t);
  return { anchors, sections, pages };
}

function documentedSetting(path, docsIdx) {
  const { anchors, sections, pages } = docsIdx;
  const url = a => `${DOCS_URL}settings-reference#${a}`;
  if (sections.has(path)) return { url: url(anchors.get(path) ?? path.toLowerCase().replace(/[^a-z0-9-]/g, "")), category: sections.get(path).category, how: "reference entry" };
  if (anchors.has(path)) return { url: url(anchors.get(path)), category: null, how: "reference index" };
  const parts = path.split(".");
  if (parts.length > 1) {
    // nested key: look inside the nearest documented ancestor's section for `leaf` or `a.b.leaf`
    for (let i = parts.length - 1; i >= 1; i--) {
      const parent = parts.slice(0, i).join(".");
      const sec = sections.get(parent);
      const leaf = parts.slice(i).join(".");
      if (sec && (sec.body.includes("`" + leaf + "`") || sec.body.includes("`" + path + "`") || sec.body.includes(`"${parts.at(-1)}":`))) return { url: url(anchors.get(parent) ?? parent.toLowerCase().replace(/[^a-z0-9-]/g, "")), category: sec.category, how: `field in \`${parent}\` entry` };
    }
    return null;
  }
  for (const [p, t] of pages) if (t.includes("`" + path + "`") || t.includes(`"${path}":`)) return { url: `${DOCS_URL}${p.replace("__", "/")}`, category: null, how: "page mention" };
  return null;
}

const SCOPE_RE = /(managed|policy|project settings|project and local|user settings|local settings|--settings|settings source|admin-controlled)/i;

function settings() {
  const { tree, modules, missing } = settingsTree();
  const docsIdx = settingsDocs();
  const items = [];
  const emit = (path, d, parentGroup, parentProv) => {
    const docInfo = documentedSetting(path, docsIdx);
    const desc = d.description ?? null;
    const internal = typeof desc === "string" && /^@internal(\b|$)/.test(desc);
    let group = parentGroup;
    if (!group) group = internal ? "Internal keys (@internal)" : docInfo?.category ?? "Keys not in the settings reference";
    const details = { path, type: typeStr(d) };
    if (d.type === "enum") details.values = d.values;
    if (d.type === "literal") details.value = d.value;
    if (d.default !== undefined) details.default = d.default;
    if (d.constraints) details.constraints = d.constraints;
    if (d.optional) details.optional = true;
    if (d.nullable) details.nullable = true;
    if (d.invalidDropped) details.invalidValueDropped = true;
    if (internal) details.internal = true;
    if (d._constants) details.constants = d._constants;
    if (d.featureModule) { details.featureModule = d.featureModule; details.buildGate = d.buildGate === true ? "enabled in this build (buildGate returns true)" : `buildGate: ${d.buildGate}`; }
    if (d.conditional) details.conditional = d.conditionFlag ? `present in the schema only when \`${d.conditionFlag}\` is truthy (from code)` : "conditionally present in the schema (from code)";
    if (docInfo) details.documentedVia = docInfo.how;
    if (desc && SCOPE_RE.test(desc)) details.sourcesNote = "The description names which settings sources honor this key (per description; not independently verified in code).";
    if (["object", "record", "array", "union"].includes(d.type) && !(d.type === "object" && d.properties && path.split(".").length < 4)) details.schema = cleanDesc(d);
    const provs = [];
    if (d._descRange) provs.push(provRange(d._descRange));
    if (d._range) provs.push(provRange(d._range));
    if (!provs.length && parentProv) provs.push(parentProv);
    if (d._condRange) provs.push(provRange(d._condRange));     // the conditional spread holding this key
    if (d._moduleRange) provs.push(provRange(d._moduleRange)); // the feature module (with its buildGate)
    items.push({
      id: `setting-${path.split(".").map(kebab).join("--")}`,
      title: path,
      group,
      kind: "setting",
      text: desc,
      when: desc ? "Description from the settings schema (`.describe()` text, from code)." : docInfo ? null : `Undocumented; read at \`${d._range?.[0]}\` offset ${provs[0]?.binary_offset}.`,
      documented: docInfo?.url ?? null,
      details,
      provenance: provs,
    });
    if (d.type === "object" && d.properties && path.split(".").length < 4)
      for (const [k, v] of Object.entries(d.properties)) emit(`${path}.${k}`, v, group, provs.at(-1));
  };
  for (const [k, v] of Object.entries(tree.properties)) emit(k, v, null);

  // Schema-level facts, read from code.
  const m = mod(SETTINGS_CHUNK);
  const yot = m.decls.get("yot");
  const strictDecl = m.decls.get("_f");
  const toJson = m.decls.get("_o");
  const overview = {
    id: "settings-schema-overview",
    title: "Settings schema",
    group: "About the schema",
    kind: "other",
    text: null,
    when: "From code: the settings object schema is built by one function; feature modules (" + Object.keys(modules).join(", ") + ") add keys through a shared registry.",
    documented: `${DOCS_URL}settings-reference`,
    details: {
      topLevelKeys: Object.keys(tree.properties).length,
      unknownKeys: "The base settings object schema is `.passthrough()` (from code).",
      strictValidation: "Settings validation parses with a `.strict()` variant built with strictPolicyHelperKeys, so unrecognized keys are reported as validation errors (from code).",
      jsonSchema: "The JSON-schema generator omits properties whose description starts with `@internal` (from code).",
      featureModules: Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, { buildGate: v.gate }])),
      uncapturedDescribeCalls: missing,
    },
    provenance: [prov(SETTINGS_CHUNK, yot.start, yot.end), prov(SETTINGS_CHUNK, strictDecl.start, strictDecl.end), prov(SETTINGS_CHUNK, toJson.start, toJson.end)],
  };
  items.unshift(overview);
  const safeEnv = safeEnvItems();
  // The reference documents the behavior (not the name lists) under "When Claude Code applies `env` values".
  if (doc("settings-reference").includes("#### When Claude Code applies `env` values")) safeEnv.find(i => i.id === "settings-safe-env-check").documented = `${DOCS_URL}settings-reference#when-claude-code-applies-env-values`;
  items.push(...safeEnv);

  // order: overview, then documented categories in docs order, undocumented, internal
  const order = ["About the schema", ...[...new Set([...docsIdx.sections.values()].map(s => s.category))], "Keys not in the settings reference", "Internal keys (@internal)", "Safe env keys (settings `env`)"];
  items.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  const settingItems = items.filter(i => i.kind === "setting");
  const docCount = settingItems.filter(i => i.documented).length;
  const summary = `{{count:settings kind=setting}} settings keys from the Claude Code settings schema ({{count:settings kind=setting details.path!=*.*}} top-level, {{count:settings kind=setting details.path=*.*}} nested): {{count:settings kind=setting documented=*}} documented, {{count:settings kind=setting documented=null}} undocumented, {{count:settings kind=setting details.internal=true}} tagged \`@internal\`. Groups follow the official settings reference; keys it does not cover are grouped separately. The last group lists the safe-env allowlist that decides which \`env\` entries apply from every settings file at startup.`;
  writeArea("settings", "Claude Code settings.json keys", summary, items, it => {
    const d = it.details;
    const lines = [statusLine(it)];
    if (it.kind === "setting") {
      lines.push(`Type: \`${d.type}\``);
      if (d.default !== undefined) lines.push(`Default (schema): \`${JSON.stringify(d.default)}\``);
      if (d.featureModule) lines.push(`Feature module: \`${d.featureModule}\` (${d.buildGate})`);
      if (d.conditional) lines.push(`Conditional: ${d.conditional}`);
      if (d.invalidValueDropped) lines.push("Invalid values are dropped rather than failing the whole file (`.catch`, from code).");
      if (d.sourcesNote) lines.push(d.sourcesNote);
      if (!it.text) lines.push(it.when ?? "No description in the schema.");
    } else if (it.id === "settings-schema-overview") {
      lines.push(it.when);
      for (const [k, v] of Object.entries(d)) if (typeof v === "string") lines.push(`- ${v}`);
      lines.push(`- Feature modules: ${Object.entries(d.featureModules).map(([k, v]) => `\`${k}\` (buildGate ${v.buildGate})`).join(", ")}`);
    } else {
      lines.push(it.when);
      if (d.names) lines.push(`Names (exact):\n\n${d.names.map(n => `- \`${n}\``).join("\n")}`);
      if (d.sensitiveHeaderNameParts) lines.push(`Sensitive header-name pattern parts: ${d.sensitiveHeaderNameParts.map(n => `\`${n}\``).join(", ")}`);
    }
    return lines.join("\n\n");
  });
  return items;
}


// ---------- settings env: safe-key check ----------
// The predicate that decides whether a settings `env` entry is "safe", the sets it checks, and
// where it is used (the safe env pass at startup; the project/local-settings warning list).
function findFn(m, pred) {
  for (const [name, d] of m.decls) if (d.type === "FunctionDeclaration" && pred(m.src.slice(d.start, d.end))) return { name, node: d };
  return null;
}
function setValues(m, name) {
  const d = m.decls.get(name);
  const arg = d?.init?.type === "NewExpression" ? d.init.arguments[0] : null;
  const v = arg ? constValue(m, arg) : null;
  return Array.isArray(v) ? { values: v, node: d } : null;
}
function predicateValues(m, name) {
  const r = resolve(m, name);
  if (!r?.node) return null;
  let arr = null;
  walk.simple(r.node, { ArrayExpression(a) { const v = constValue(r.m, a); if (!arr && Array.isArray(v) && v.every(x => typeof x === "string")) arr = v; } });
  return arr ? { values: arr, m: r.m, node: r.node } : null;
}

function safeEnvItems() {
  const m = mod(SETTINGS_CHUNK);
  const check = findFn(m, t => t.includes('==="ANTHROPIC_CUSTOM_HEADERS"&&') && t.includes(".toUpperCase()") && t.includes(".has("));
  if (!check) throw new Error("safe-env check not found");
  const ret = check.node.body.body.find(x => x.type === "ReturnStatement").argument;
  const operands = [];
  const flat = n => (n.type === "LogicalExpression" && n.operator === "||" ? (flat(n.left), flat(n.right)) : operands.push(n));
  flat(ret);
  const rules = [];
  for (const op of operands) {
    if (op.type === "CallExpression" && op.callee.property?.name === "has") rules.push({ set: op.callee.object.name, condition: "always" });
    else if (op.type === "LogicalExpression" && op.operator === "&&" && op.left.type === "CallExpression" && op.left.callee.property?.name === "has" && op.right.type === "CallExpression" && op.right.callee.type === "Identifier") {
      const pv = predicateValues(m, op.right.callee.name);
      rules.push({ set: op.left.callee.object.name, condition: pv, predicate: op.right.callee.name });
    } else if (op.type === "LogicalExpression" && op.left.type === "BinaryExpression" && op.left.right.type === "Literal") rules.push({ literal: op.left.right.value, validator: op.right.argument?.callee?.name ?? null });
  }
  const items = [];
  const setItems = [];
  for (const r of rules.filter(x => x.set)) {
    const sv = setValues(m, r.set);
    if (!sv) throw new Error(`safe-env set ${r.set} not resolved`);
    const cond = r.condition === "always" ? "always safe, whatever the value" : `safe only when the value is one of ${r.condition.values.map(v => `"${v}"`).join(", ")} (case-insensitive, trimmed)`;
    const provs = [prov(SETTINGS_CHUNK, sv.node.start, sv.node.end)];
    if (r.condition !== "always") provs.push(prov(r.condition.m.name, r.condition.node.start, r.condition.node.end));
    setItems.push({
      id: `settings-safe-env-set-${kebab(r.set)}`,
      // No member count in the title: it would go stale on refresh, and the names list is exhaustive.
      title: `Safe env names: ${r.condition === "always" ? "any value" : r.condition.values.includes("true") ? "truthy value only" : "falsy value only"}`,
      group: "Safe env keys (settings `env`)", kind: "other", text: null,
      when: `Names in this set are ${cond}; names are compared upper-cased (from code).`,
      documented: null,
      details: { set: r.set, rule: r.condition === "always" ? "always" : { valueMustBeOneOf: r.condition.values }, names: sv.values },
      provenance: provs,
    });
  }
  // ANTHROPIC_CUSTOM_HEADERS special case: safe only when its value passes a header validator.
  const hdr = rules.find(x => x.literal);
  let hdrItem = null;
  if (hdr) {
    const vfn = m.decls.get(hdr.validator);
    let pattern = null, patNode = null;
    if (vfn) walk.simple(vfn, { CallExpression(c) { if (c.callee.property?.name === "test" && c.callee.object.type === "Identifier") { const d = m.decls.get(c.callee.object.name); if (d?.init?.regex && /auth\|key/.test(d.init.regex.pattern)) { pattern = d.init.regex.pattern; patNode = d; } } } });
    hdrItem = {
      id: "settings-safe-env-custom-headers", title: `Safe env names: ${hdr.literal} (validated value)`,
      group: "Safe env keys (settings `env`)", kind: "other", text: null,
      when: `\`${hdr.literal}\` is safe only when its value passes a header check (from code): no bare carriage return; every header name is a valid HTTP token; a further per-value check passes; and no lower-cased header name matches the sensitive-name pattern below.`,
      documented: null,
      details: { name: hdr.literal, sensitiveHeaderNamePattern: pattern, sensitiveHeaderNameParts: pattern ? pattern.split("|") : null },
      provenance: [prov(SETTINGS_CHUNK, vfn.start, vfn.end), ...(patNode ? [prov(SETTINGS_CHUNK, patNode.start, patNode.end)] : [])],
    };
  }
  // Where the check applies.
  const tp = mod("chunk-tpcgcc17.js");
  let safeMethod = null, fullMethod = null;
  walk.simple(tp.ast, { MethodDefinition(md) {
    if (md.key.name === "applySafeConfigEnvironmentVariables") safeMethod = md;
    if (md.key.name === "applyConfigEnvironmentVariables") fullMethod = md;
  } });
  if (!safeMethod || !fullMethod) throw new Error("env application methods not found");
  const trustedSources = constValue(tp, tp.decls.get("ee").init);
  const warn = mod("chunk-4yq2mdpd.js");
  const warnFn = findFn(warn, t => t.includes('ge("projectSettings")') && t.includes(".claude/settings.local.json") && !t.includes("proxyAuthHelper") && /if\([A-Za-z_$]+\(e\)\)t\.push\("\.claude\/settings\.json"\)/.test(t));
  const envFn = findFn(warn, t => /Object\.entries\([a-z]\.env\)\.some\(/.test(t));
  items.push({
    id: "settings-safe-env-check", title: "Safe env check",
    group: "Safe env keys (settings `env`)", kind: "other", text: null,
    when: [
      "From code: a predicate decides whether one settings `env` entry (name, value) is safe. It upper-cases the name and returns true when the name is in the always-safe set, is in the truthy-only set with a truthy value, is in the falsy-only set with a falsy value, or is `ANTHROPIC_CUSTOM_HEADERS` with a value that passes the header check.",
      `Safe pass (\`applySafeConfigEnvironmentVariables\`): applies the global config env and the env of ${trustedSources.filter(x => x !== "policySettings").map(x => `\`${x}\``).join(" and ")} (each when that source is enabled), then \`policySettings\` env, all through the usual env filter; then, from every enabled settings source, applies only the entries the predicate marks safe.`,
      "Full pass (`applyConfigEnvironmentVariables`): applies the filtered env of every enabled settings source without the safe check. One call site runs in the same step sequence that calls `loadHooksModulesHeldForTrust`.",
      "Warning list: a helper returns `.claude/settings.json` and/or `.claude/settings.local.json` when project or local settings contain any `env` entry the predicate does not mark safe.",
    ].join("\n\n"),
    documented: null,
    details: { trustedSourcesInSafePass: trustedSources, predicateRules: rules.map(r => r.set ? { set: r.set, condition: r.condition === "always" ? "always" : { valueMustBeOneOf: r.condition.values } } : { name: r.literal, condition: "header check" }) },
    provenance: [prov(SETTINGS_CHUNK, check.node.start, check.node.end), prov("chunk-tpcgcc17.js", safeMethod.start, safeMethod.end), prov("chunk-tpcgcc17.js", fullMethod.start, fullMethod.end), prov("chunk-tpcgcc17.js", tp.decls.get("ee").start, tp.decls.get("ee").end), ...(envFn ? [prov("chunk-4yq2mdpd.js", envFn.node.start, envFn.node.end)] : []), ...(warnFn ? [prov("chunk-4yq2mdpd.js", warnFn.node.start, warnFn.node.end)] : [])],
  });
  items.push(...setItems);
  if (hdrItem) items.push(hdrItem);
  return items;
}

// ---------- hooks ----------

const HOOK_UI_CHUNK = "chunk-zznr2qbr.js";   // /hooks menu metadata: summary, description, matcher field
const HOOK_EXEC_CHUNK = "chunk-dt8bvbsd.js";  // code that builds hook input payloads
const HOOK_SDK_CHUNK = "chunk-6b5jn77e.js";   // typed hook input schemas (SDK)
const HOOK_OUT_CHUNK = "chunk-7kwd28ae.js";   // hook JSON output schema

const keyName = p => p.key.type === "Identifier" ? p.key.name : p.key.value;
const propOf = (obj, k) => obj?.properties?.find(p => p.type === "Property" && keyName(p) === k);

// Keys of an object literal, following spreads of helper calls / local objects.
function objectKeys(m, node, fnScope, seen = new Set()) {
  const out = { keys: [], conditional: [], unresolved: 0 };
  if (!node) return out;
  if (node.type === "ConditionalExpression") {
    for (const b of [node.consequent, node.alternate]) { const r = objectKeys(m, b, fnScope, seen); out.conditional.push(...r.keys, ...r.conditional); out.unresolved += r.unresolved; }
    return out;
  }
  if (node.type !== "ObjectExpression") { out.unresolved++; return out; }
  for (const p of node.properties) {
    if (p.type === "Property") { out.keys.push(keyName(p)); continue; }
    const a = p.argument;
    if (a.type === "Literal" || a.type === "UnaryExpression") continue;
    if (a.type === "ObjectExpression" || a.type === "ConditionalExpression") { const r = objectKeys(m, a, fnScope, seen); out.keys.push(...r.keys); out.conditional.push(...r.conditional); out.unresolved += r.unresolved; continue; }
    if (a.type === "Identifier") {
      const local = fnScope && findLocal(fnScope, a.name);
      if (local?.type === "CallExpression") { const r = objectKeys(m, { type: "ObjectExpression", properties: [{ type: "SpreadElement", argument: local }] }, fnScope, seen); out.keys.push(...r.keys); out.conditional.push(...r.conditional); out.unresolved += r.unresolved; }
      else if (local) { const r = objectKeys(m, local, fnScope, seen); out.keys.push(...r.keys); out.conditional.push(...r.conditional); out.unresolved += r.unresolved; }
      else out.unresolved++;
      continue;
    }
    if (a.type === "CallExpression" && a.callee.type === "Identifier") {
      const r = resolve(m, a.callee.name);
      const fn = r?.node?.type === "FunctionDeclaration" ? r.node : r?.node?.init;
      if (!fn?.body || seen.has(fn)) { out.unresolved++; continue; }
      seen.add(fn);
      const rets = [];
      walk.simple(fn.body, { ReturnStatement(n) { if (n.argument) rets.push(n.argument); } });
      const sets = rets.map(ret => objectKeys(r.m, ret, fn, seen));
      const all = new Set(sets.flatMap(x => x.keys));
      // keys returned on every path are unconditional; the rest are conditional
      for (const k of all) (sets.every(x => x.keys.includes(k)) ? out.keys : out.conditional).push(k);
      for (const x of sets) out.conditional.push(...x.conditional.filter(k => !all.has(k)));
      continue;
    }
    out.unresolved++;
  }
  return out;
}
function findLocal(fn, name) {
  let found = null;
  walk.simple(fn.body, { VariableDeclarator(d) { if (!found && d.id.type === "Identifier" && d.id.name === name && d.init) found = d.init; } });
  return found;
}

function hookPayloadBuilders() {
  const m = mod(HOOK_EXEC_CHUNK);
  const byEvent = {};
  walk.ancestor(m.ast, {
    ObjectExpression(node, _state, ancestors) {
      const p = propOf(node, "hook_event_name");
      if (!p || p.value.type !== "Literal") return;
      const fn = [...ancestors].reverse().find(a => /Function/.test(a.type));
      const r = objectKeys(m, node, fn);
      let matchQuery = false;
      if (fn) walk.simple(fn.body, { Property(q) { if (keyName(q) === "matchQuery") matchQuery = true; } });
      (byEvent[p.value.value] ||= []).push({ ...r, keys: r.keys.filter(k => k !== "hook_event_name"), range: [node.start, node.end], matchQuery });
    },
  });
  return byEvent;
}

function hookUiMetadata() {
  const m = mod(HOOK_UI_CHUNK);
  const fn = [...m.decls.values()].find(d => d.type === "FunctionDeclaration" && (() => { const r = d.body.body.at(-1); return r?.type === "ReturnStatement" && propOf(r.argument, "PreToolUse") && propOf(propOf(r.argument, "PreToolUse").value, "summary"); })());
  if (!fn) throw new Error("hook UI metadata not found");
  const obj = fn.body.body.at(-1).argument;
  const out = {};
  for (const p of obj.properties) {
    const v = p.value;
    const sum = propOf(v, "summary"), desc = propOf(v, "description"), mm = propOf(v, "matcherMetadata");
    const field = mm && propOf(mm.value, "fieldToMatch"), vals = mm && propOf(mm.value, "values");
    let values;
    if (vals) { const c = constValue(m, vals.value); values = isLit(c) ? c : "computed at runtime"; }
    out[keyName(p)] = {
      summary: sum ? strValue(m, sum.value) : null,
      description: desc ? strValue(m, desc.value) : null,
      descRange: desc ? [HOOK_UI_CHUNK, desc.value.start, desc.value.end] : null,
      ...(desc ? consts(HOOK_UI_CHUNK, desc.value) : {}),
      range: [HOOK_UI_CHUNK, p.start, p.end],
      matcher: field ? { fieldToMatch: strValue(m, field.value), values } : null,
    };
  }
  return out;
}

function hookSdkInputs() {
  const m = mod(HOOK_SDK_CHUNK);
  const out = {};
  let base = null;
  for (const [name, d] of m.decls) {
    if (d.type !== "VariableDeclarator" || !d.init) continue;
    const src = m.src.slice(d.init.start, Math.min(d.init.end, d.init.start + 200));
    const mm = src.match(/^p\(\(\)=>[A-Za-z_$][\w$]*\(\)\.and\(u\(\{hook_event_name:R\("([A-Za-z]+)"\)/);
    if (!mm) continue;
    const desc = describeSchema(m, d.init, { stack: [] });
    out[mm[1]] = { schema: desc, range: [HOOK_SDK_CHUNK, d.start, d.end] };
    if (!base) {
      const baseName = src.match(/^p\(\(\)=>([A-Za-z_$][\w$]*)\(\)/)[1];
      const bd = m.decls.get(baseName);
      base = { schema: describeSchema(m, bd.init, { stack: [] }), range: [HOOK_SDK_CHUNK, bd.start, bd.end] };
    }
  }
  return { byEvent: out, base };
}

function fieldTable(props) {
  return Object.fromEntries(Object.entries(props || {}).map(([k, v]) => [k, { type: typeStr(v), ...(v.optional ? { optional: true } : {}), ...(v.description ? { description: v.description } : {}) }]));
}

function hooks() {
  const sm = mod(SETTINGS_CHUNK);
  const eventsNode = sm.decls.get("Kf");
  const events = eventsNode.init.elements;
  const ui = hookUiMetadata();
  const builders = hookPayloadBuilders();
  const sdk = hookSdkInputs();
  const om = mod(HOOK_OUT_CHUNK);
  const outDecl = om.decls.get("gU");
  if (!om.src.slice(outDecl.start, outDecl.end).includes("hookSpecificOutput")) throw new Error("hook output schema moved");
  const output = describeSchema(om, outDecl.init, { stack: [] });
  const specific = {};
  for (const o of output.properties.hookSpecificOutput.options) specific[o.properties.hookEventName.value] = o;
  const hooksDoc = doc("hooks");
  const docHeadings = new Set([...hooksDoc.matchAll(/^### ([A-Za-z]+)\s*$/gm)].map(x => x[1]));
  const baseFields = fieldTable(sdk.base.schema.properties);
  const items = [];

  for (const el of events) {
    const ev = el.value;
    const u = ui[ev];
    const b = builders[ev] || [];
    const sdkIn = sdk.byEvent[ev];
    const keys = [...new Set(b.flatMap(x => x.keys))];
    const conditional = [...new Set(b.flatMap(x => x.conditional))].filter(k => !keys.includes(k));
    const unresolved = b.reduce((n, x) => n + x.unresolved, 0);
    const evFields = sdkIn ? fieldTable(Object.fromEntries(Object.entries(sdkIn.schema.properties).filter(([k]) => !(k in (sdk.base.schema.properties || {})) && k !== "hook_event_name"))) : null;
    const spec = specific[ev];
    const details = {
      summary: u?.summary ?? null,
      ...(u?.constants ? { constants: u.constants } : {}),
      matcher: u?.matcher ?? null,
      payloadFromBuilder: b.length ? { fields: keys, conditionalFields: conditional, ...(unresolved ? { unresolvedSpreads: unresolved } : {}), builderSites: b.length, matchQueryPassed: b.some(x => x.matchQuery) } : null,
      inputSchemaFields: evFields,
      hookSpecificOutput: spec ? fieldTable(Object.fromEntries(Object.entries(spec.properties).filter(([k]) => k !== "hookEventName"))) : null,
    };
    const provs = [];
    if (u?.descRange) provs.push(provRange(u.descRange));
    provs.push(prov(SETTINGS_CHUNK, el.start, el.end));
    for (const x of b) provs.push(prov(HOOK_EXEC_CHUNK, x.range[0], x.range[1]));
    if (sdkIn) provs.push(provRange(sdkIn.range));
    items.push({
      id: `hook-${kebab(ev)}`,
      title: ev,
      group: "Hook events",
      kind: "hook-event",
      text: u?.description ?? null,
      when: u ? `${u.summary} (summary from the hook event metadata table, from code).` : `Undocumented; read at \`${SETTINGS_CHUNK}\` offset ${provs[0].binary_offset}.`,
      documented: docHeadings.has(ev) ? `${DOCS_URL}hooks#${ev.toLowerCase()}` : null,
      details,
      provenance: provs,
    });
  }

  // Common input fields, output fields, hook types, matcher config.
  items.push({
    id: "hook-common-input-fields", title: "Common input fields", group: "Hook input and output", kind: "other", text: null,
    when: "Fields every hook input carries: the typed base schema that each event's input schema extends (from code).",
    documented: hooksDoc.includes("### Common input fields") ? `${DOCS_URL}hooks#common-input-fields` : null,
    details: { fields: baseFields }, provenance: [provRange(sdk.base.range)],
  });
  const common = Object.fromEntries(Object.entries(output.properties).filter(([k]) => k !== "hookSpecificOutput"));
  items.push({
    id: "hook-json-output", title: "JSON output fields", group: "Hook input and output", kind: "other", text: null,
    when: "Top-level fields a hook may print as JSON on stdout; per-event fields go in `hookSpecificOutput` with a matching `hookEventName` (from code).",
    documented: hooksDoc.includes("### JSON output") ? `${DOCS_URL}hooks#json-output` : null,
    details: { fields: fieldTable(common), hookSpecificOutputEvents: Object.keys(specific) },
    provenance: [prov(HOOK_OUT_CHUNK, outDecl.start, outDecl.end)],
  });

  // hook handler types from the settings schema
  const tEe = sm.decls.get("tEe");
  const hookSchema = describeSchema(sm, tEe.init, { stack: [] });
  const typeDocs = { command: "#command-hook-fields", http: "#http-hook-fields", mcp_tool: "#mcp-tool-hook-fields", prompt: "#prompt-and-agent-hook-fields", agent: "#prompt-and-agent-hook-fields" };
  for (const o of hookSchema.options) {
    const t = o.properties.type;
    const name = t.value;
    const provs = [];
    if (t._descRange) provs.push(provRange(t._descRange));
    provs.push(prov(SETTINGS_CHUNK, tEe.start, tEe.end));
    items.push({
      id: `hook-type-${kebab(String(name))}`, title: `type: "${name}"`, group: "Hook handler types", kind: "other",
      text: t.description ?? null,
      when: "Hook handler entry in a matcher's `hooks` array, selected by `type` (settings schema, from code).",
      documented: typeDocs[name] && hooksDoc.includes(typeDocs[name].slice(1).replace(/-/g, " ").replace(/^./, c => c.toUpperCase()).replace("Mcp", "MCP").replace("Http", "HTTP")) ? `${DOCS_URL}hooks${typeDocs[name]}` : null,
      details: { fields: fieldTable(Object.fromEntries(Object.entries(o.properties).filter(([k]) => k !== "type"))) },
      provenance: provs,
    });
  }
  const It = sm.decls.get("It");
  const matcher = describeSchema(sm, It.init, { stack: [] });
  items.push({
    id: "hook-matcher-config", title: "Matcher entry", group: "Hook handler types", kind: "other", text: null,
    when: "Each event in the `hooks` setting maps to an array of matcher entries (from code).",
    documented: `${DOCS_URL}hooks#matcher-patterns`,
    details: { fields: fieldTable(matcher.properties), hooksSettingKeys: events.map(e => e.value) },
    provenance: [prov(SETTINGS_CHUNK, It.start, It.end), prov(SETTINGS_CHUNK, eventsNode.start, eventsNode.end)],
  });

  const evItems = items.filter(i => i.kind === "hook-event");
  const docCount = evItems.filter(i => i.documented).length;
  const typeCount = items.filter(i => i.group === "Hook handler types").length - 1;
  const summary = `{{count:hooks kind=hook-event}} hook events ({{count:hooks kind=hook-event documented=*}} documented, {{count:hooks kind=hook-event documented=null}} undocumented) and {{count:hooks group="Hook handler types" id!=hook-matcher-config}} hook handler types, from the Claude Code settings schema, hook event metadata, payload builders, and hook input/output schemas.`;
  writeArea("hooks", "Claude Code hook events", summary, items, it => {
    const d = it.details;
    const lines = [statusLine(it), it.when];
    if (it.kind === "hook-event") {
      if (d.matcher) lines.push(`Matcher: matches on \`${d.matcher.fieldToMatch}\`${Array.isArray(d.matcher.values) ? `; values: ${d.matcher.values.map(v => `\`${v}\``).join(", ")}` : ""} (from code).`);
      else lines.push("Matcher: the hook event metadata defines no matcher field for this event (from code).");
      if (d.payloadFromBuilder) lines.push(d.payloadFromBuilder.matchQueryPassed ? "The function that builds this payload passes a `matchQuery` to the hook runner (from code)." : "No `matchQuery` property appears in the function that builds this payload (from code); matching may still be applied elsewhere.");
      if (d.payloadFromBuilder) {
        const pf = d.payloadFromBuilder;
        lines.push(`Input payload fields (from the code that builds it): ${pf.fields.length ? pf.fields.map(f => `\`${f}\``).join(", ") : "no extra fields"}${pf.conditionalFields.length ? `; sometimes ${pf.conditionalFields.map(f => `\`${f}\``).join(", ")}` : ""}${pf.unresolvedSpreads ? "; plus fields from spreads not resolved statically" : ""}.`);
      } else lines.push("Input payload: no payload builder with this event name found in the hook execution code.");
      if (d.inputSchemaFields) lines.push(`Typed input schema fields: ${Object.entries(d.inputSchemaFields).map(([k, v]) => `\`${k}\` (${v.type}${v.optional ? ", optional" : ""})`).join(", ")}.`);
      if (d.hookSpecificOutput) lines.push(`\`hookSpecificOutput\` fields: ${Object.entries(d.hookSpecificOutput).map(([k, v]) => `\`${k}\` (${v.type})`).join(", ")}.`);
      if (it.text) lines.push("Description from the hook event metadata table, including exit-code behavior (from code):");
    } else {
      const rows = Object.entries(d.fields || {}).map(([k, v]) => `- \`${k}\`: ${v.type}${v.optional ? ", optional" : ""}${v.description ? ` — ${v.description}` : ""}`);
      if (rows.length) lines.push(rows.join("\n"));
      if (d.hooksSettingKeys) lines.push(`Event keys accepted by the \`hooks\` setting: ${d.hooksSettingKeys.map(k => `\`${k}\``).join(", ")}.`);
    }
    return lines.join("\n\n");
  });
  return items;
}

// ---------- CLI ----------

const CLI_CHUNKS = ["chunk-zasza72r.js", "chunk-bjmhhyed.js"]; // commander program + hidden IDE edit commands
const HELP = `${ROOT}work/config/help/`;

function cliAnalyzer(file, externalParams) {
  const m = mod(file);
  const parent = new Map();
  walk.fullAncestor(m.ast, (n, _s, anc) => { if (anc.length > 1) parent.set(n, anc[anc.length - 2]); });
  const isFn = n => /Function/.test(n.type);
  const exportedAs = new Map([...m.exportsMap].map(([e, l]) => [l, e]));
  function binding(idNode) {
    const name = idNode.name;
    for (let a = parent.get(idNode); a; a = parent.get(a)) {
      if (isFn(a)) {
        const pi = a.params.findIndex(p => (p.type === "AssignmentPattern" ? p.left : p).name === name);
        if (pi >= 0) return { kind: "param", fn: a, index: pi };
      }
      if (isFn(a) || a.type === "Program" || a.type === "BlockStatement") {
        const body = a.type === "Program" ? a.body : isFn(a) ? (a.body.type === "BlockStatement" ? a.body.body : []) : a.body;
        let found = null;
        for (const st of body) {
          if (st.type === "VariableDeclaration") for (const d of st.declarations) {
            if (d.id.name === name) found = { kind: "var", node: d.init, decl: d };
            if (d.id.type === "ObjectPattern") for (const pp of d.id.properties) if (pp.value?.type === "Identifier" && pp.value.name === name) found = { kind: "destructure", key: pp.key.name ?? pp.key.value, init: d.init };
          }
          if (st.type === "FunctionDeclaration" && st.id.name === name) found = { kind: "fn", node: st };
        }
        if (found) return found;
      }
    }
    return null;
  }
  const calls = [];
  walk.simple(m.ast, { CallExpression(c) { calls.push(c); } });
  const assignsTo = name => calls.length && (() => { const out = []; walk.simple(m.ast, { AssignmentExpression(a) { if (a.left.type === "Identifier" && a.left.name === name) out.push(a.right); } }); return out; })();
  const fnName = fn => fn.id?.name ?? (parent.get(fn)?.type === "VariableDeclarator" ? parent.get(fn).id.name : null);
  const memo = new Map();
  function cmdPath(node, depth = 0) {
    if (!node || depth > 30) return null;
    if (memo.has(node)) return memo.get(node);
    memo.set(node, null);
    let r = null;
    if (node.type === "NewExpression") r = node.arguments.length ? null : [];
    else if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
      const base = cmdPath(node.callee.object, depth + 1);
      if (base) r = node.callee.property.name === "command" ? [...base, strValue(m, node.arguments[0])?.split(" ")[0]] : base;
    } else if (node.type === "Identifier") {
      const b = binding(node);
      if (b?.kind === "var") r = b.node ? cmdPath(b.node, depth + 1) : (assignsTo(node.name).map(x => cmdPath(x, depth + 1)).find(Boolean) ?? null);
      else if (b?.kind === "param") {
        const name = fnName(b.fn);
        r = calls.filter(c => c.callee.type === "Identifier" && c.callee.name === name).map(c => c.arguments[b.index] && cmdPath(c.arguments[b.index], depth + 1)).find(Boolean) ?? null;
        if (!r && name && externalParams) r = externalParams.get(`${file}:${exportedAs.get(name) ?? name}:${b.index}`) ?? null;
      } else if (b?.kind === "destructure" && b.init?.type === "CallExpression" && b.init.callee.type === "Identifier") {
        const fb = binding(b.init.callee);
        const fn = fb?.kind === "fn" ? fb.node : fb?.node && isFn(fb.node) ? fb.node : null;
        if (fn) walk.simple(fn.body, { ReturnStatement(ret) {
          let arg = ret.argument;
          if (arg?.type === "SequenceExpression") arg = arg.expressions.at(-1);
          if (r || arg?.type !== "ObjectExpression") return;
          const prop = arg.properties.find(q => q.type === "Property" && (q.key.name ?? q.key.value) === b.key);
          if (prop) r = cmdPath(prop.value, depth + 1);
        } });
      }
    } else if (node.type === "AssignmentExpression") r = cmdPath(node.right, depth + 1);
    memo.set(node, r);
    return r;
  }
  // Option objects built with new Option(flags, desc) chains or small local helpers returning one.
  function optionExpr(node, subst, depth = 0) {
    if (!node || depth > 6) return null;
    const val = n => (n?.type === "Identifier" && subst?.has(n.name) ? subst.get(n.name) : n);
    if (node.type === "NewExpression" && node.arguments.length) {
      const f = val(node.arguments[0]), d = val(node.arguments[1]);
      return { flags: strValue(m, f), description: d ? strValue(m, d) : null, descNode: d ?? null, mods: {} };
    }
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
      const base = optionExpr(node.callee.object, subst, depth + 1);
      if (!base) return null;
      const meth = node.callee.property.name, a = node.arguments;
      if (meth === "hideHelp") base.hidden = !(a[0] && constValue(m, a[0]) === false);
      else if (meth === "choices") { const v = constValue(m, val(a[0])); base.mods.choices = isLit(v) ? v : "computed"; }
      else if (meth === "default") { const v = constValue(m, val(a[0])); base.mods.default = isLit(v) ? v : "computed default (not a literal)"; }
      else if (meth === "env") base.mods.env = strValue(m, val(a[0]));
      else if (meth === "makeOptionMandatory") base.mods.required = true;
      else if (meth === "preset") { const v = constValue(m, val(a[0])); base.mods.preset = isLit(v) ? v : "computed"; }
      else if (meth === "conflicts") { const v = constValue(m, val(a[0])); base.mods.conflicts = isLit(v) ? v : "computed"; }
      else if (meth === "implies") base.mods.implies = true;
      return base;
    }
    if (node.type === "CallExpression" && node.callee.type === "Identifier") {
      const b = binding(node.callee);
      const fn = b?.kind === "fn" ? b.node : b?.node && isFn(b.node) ? b.node : null;
      if (!fn) return null;
      const body = fn.body.type === "BlockStatement" ? fn.body.body.find(x => x.type === "ReturnStatement")?.argument : fn.body;
      const sub = new Map(fn.params.map((p, i) => [(p.type === "AssignmentPattern" ? p.left : p).name, node.arguments[i] ?? (p.type === "AssignmentPattern" ? p.right : null)]));
      const r = optionExpr(body, sub, depth + 1);
      if (r) r.viaHelper = true;
      return r;
    }
    return null;
  }
  const commands = [], options = [], dynamic = [];
  for (const c of calls) {
    if (c.callee.type !== "MemberExpression" || c.callee.object.type === "ThisExpression") continue;
    const meth = c.callee.property.name;
    if (meth === "command" && c.arguments[0] && strValue(m, c.arguments[0])) {
      const p = cmdPath(c);
      if (!p) continue;
      const opts = c.arguments[1]?.type === "ObjectExpression" ? constValue(m, c.arguments[1]) : null;
      let flag = conditionFlag(m, c);
      if (!flag) {
        // registration helper called under a condition: check the helper's call sites
        let fn = null;
        for (let a = parent.get(c); a; a = parent.get(a)) if (isFn(a)) fn = a;
        const name = fn && fnName(fn);
        for (const site of calls) if (!flag && site.callee.type === "Identifier" && site.callee.name === name) flag = conditionFlag(m, site);
      }
      commands.push({ file, path: p, spec: strValue(m, c.arguments[0]), hidden: !!(opts && opts.hidden), node: c, flag: flag?.flag ?? null, condProv: flag ? [[file, flag.node.start, flag.node.end], ...(flag.accessor ? [flag.accessor] : [])] : [] });
    }
    if (["option", "requiredOption", "addOption", "helpOption"].includes(meth)) {
      const p = cmdPath(c.callee.object);
      if (!p) continue;
      let o;
      if (meth === "addOption") o = optionExpr(c.arguments[0]);
      else {
        const [f, d, a3, a4] = c.arguments;
        o = { flags: strValue(m, f), description: d ? strValue(m, d) : null, descNode: d ?? null, mods: {} };
        const dflt = a3 && !isFn(a3) ? a3 : a4;
        if (dflt) { const v = constValue(m, dflt); o.mods.default = isLit(v) ? v : "computed default (not a literal)"; }
        if (meth === "requiredOption") o.mods.required = true;
        if (meth === "helpOption") o.help = true;
      }
      if (!o?.flags) { dynamic.push({ path: p, range: [c.start, c.end] }); continue; }
      options.push({ file, path: p, ...o, node: c });
    }
  }
  // Per-command chain facts: description / alias / argument / summary calls applied to that command.
  const facts = new Map();
  for (const c of calls) {
    if (c.callee.type !== "MemberExpression" || c.callee.object.type === "ThisExpression") continue;
    const meth = c.callee.property.name;
    if (!["description", "alias", "aliases", "argument", "summary", "usage"].includes(meth)) continue;
    const p = cmdPath(c.callee.object);
    if (!p) continue;
    const key = p.join(" ");
    const f = facts.get(key) ?? { aliases: [], arguments: [] };
    if (meth === "description" && c.arguments[0]) { const t = strValue(m, c.arguments[0]); if (t && !f.description) { f.description = t; f.descNode = c.arguments[0]; f.file = file; } }
    if (meth === "alias") f.aliases.push(strValue(m, c.arguments[0]));
    if (meth === "argument") f.arguments.push({ spec: strValue(m, c.arguments[0]), description: c.arguments[1] ? strValue(m, c.arguments[1]) : null });
    facts.set(key, f);
  }
  // Calls into other chunks that pass a command object (for cross-chunk registration helpers).
  const outgoing = [];
  for (const c of calls) {
    if (c.callee.type !== "Identifier" || !m.imports.has(c.callee.name)) continue;
    c.arguments.forEach((a, i) => { const p = a.type === "Identifier" && cmdPath(a); if (p) { const imp = m.imports.get(c.callee.name); outgoing.push([`${imp.file}:${imp.name}:${i}`, p]); } });
  }
  return { m, commands, options, dynamic, facts, outgoing };
}

// Captured `claude <path> --help`; null when missing or when commander printed a parent's
// help instead (the command is not registered at runtime on this machine).
function helpText(path) {
  const f = `${HELP}${path.length ? path.join("_") : "root"}.txt`;
  if (!existsSync(f)) return null;
  const t = readFileSync(f, "utf8");
  if (path.length && !new RegExp(`claude ${path.map(x => `${x}(\\|[\\w-]+)*`).join(" ")}(\\s|$)`).test(t.split("\n").slice(0, 6).join("\n"))) return null;
  return t;
}
// Nearest enclosing condition that references an UPPER_CASE flag property (e.g. an env flag).
function conditionFlag(m, node) {
  let found = null;
  walk.fullAncestor(m.ast, (n, _s, anc) => {
    if (n !== node || found) return;
    for (let i = anc.length - 2; i >= 0; i--) {
      const a = anc[i];
      const test = a.type === "IfStatement" || a.type === "ConditionalExpression" ? a.test : a.type === "LogicalExpression" && a.operator === "&&" ? a.left : null;
      if (!test || anc[i + 1] === test) continue;
      let flag = null, accessorSite = null;
      walk.simple(test, {
        MemberExpression(me) { if (!flag && !me.computed && /^[A-Z][A-Z0-9_]{3,}$/.test(me.property.name)) flag = me.property.name; },
        CallExpression(ce) {
          // zero-arg accessor such as function f(){return env.SOME_FLAG}
          if (flag || ce.callee.type !== "Identifier" || ce.arguments.length) return;
          const r = resolve(m, ce.callee.name);
          const ret = r?.node?.type === "FunctionDeclaration" && r.node.body.body.length === 1 && r.node.body.body[0].type === "ReturnStatement" ? r.node.body.body[0].argument : null;
          if (ret?.type === "MemberExpression" && !ret.computed && /^[A-Z][A-Z0-9_]{3,}$/.test(ret.property.name)) { flag = ret.property.name; accessorSite = [r.m.name, r.node.start, r.node.end]; }
        },
      });
      if (flag) { found = { flag, node: a, accessor: accessorSite }; return; }
    }
  });
  return found;
}
const flagNames = flags => (flags.match(/--?[A-Za-z0-9][\w-]*/g) || []);
const inHelp = (help, token) => help != null && new RegExp(`(^|[\\s,|])${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s,|<\\[=]|$)`, "m").test(help);

function cli() {
  const main = cliAnalyzer(CLI_CHUNKS[0]);
  const ext = new Map(main.outgoing);
  const side = cliAnalyzer(CLI_CHUNKS[1], ext);
  const commands = [...main.commands, ...side.commands];
  const options = [...main.options, ...side.options];
  const facts = new Map([...side.facts, ...main.facts]);
  const cliDoc = doc("cli-reference");
  const docPages = ["cli-reference", "mcp", "plugins__cli-reference", "plugins__install", "plugin-evals", "authentication", "agent-view", "ultrareview", "auto-mode-config", "remote-control", "setup", "troubleshoot-install", "sandboxing", "headless", "corporate-launcher", "llm-gateway", "sessions", "worktrees", "claude-apps-gateway"].map(p => [p, doc(p)]).filter(([, t]) => t);
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const bounded = (t, needle) => new RegExp(`${esc(needle)}(?![\\w-])`).test(t);
  const docFor = (needles) => {
    for (const [p, t] of docPages) if (needles.some(n => bounded(t, n))) return `${DOCS_URL}${p.replace("__", "/")}`;
    return null;
  };
  const items = [];
  const group = path => (path.length ? `claude ${path[0]}` : "claude (root command)");
  // Help-display-only root entries (background session commands).
  const qs = main.m.decls.get("Qs");
  const stubs = [];
  if (qs) walk.simple(qs, { NewExpression(n) { const name = n.arguments[0] && strValue(main.m, n.arguments[0]); if (name) stubs.push({ name, node: n }); } });

  const rootHelp = helpText([]);
  const cmdItems = new Map();
  for (const c of commands) {
    const key = c.path.join(" ");
    const f = facts.get(key) ?? {};
    const parentHelp = helpText(c.path.slice(0, -1));
    const shown = parentHelp != null && inHelp(parentHelp.split(/\nCommands:/)[1] ?? "", c.path.at(-1));
    const provs = [];
    if (f.descNode) provs.push(...descProv(f.file, f.descNode));
    provs.push(prov(c.file, c.node.start, c.node.end));
    for (const r of c.condProv) provs.push(provRange(r)); // the condition guarding registration
    const title = `claude ${key}`;
    const it = {
      id: `cli-cmd-${c.path.map(kebab).join("-")}`,
      title: c.spec.includes(" ") ? `claude ${c.path.slice(0, -1).concat(c.spec).join(" ")}` : title,
      group: group(c.path), kind: "cli-command",
      text: f.description ?? null,
      when: f.description ? "Command description (commander `.description()`, from code)." : `Undocumented; read at \`${c.file}\` offset ${provs[0].binary_offset}.`,
      documented: docFor([`claude ${key}`]),
      details: { path: key, spec: c.spec, ...(f.descNode ? consts(f.file, f.descNode) : {}), ...(f.aliases?.length ? { aliases: f.aliases } : {}), ...(f.arguments?.length ? { arguments: f.arguments } : {}), hidden: c.hidden, shownInParentHelp: shown, ...(c.flag ? { registrationCondition: `registered inside a condition that references \`${c.flag}\` (from code)` } : {}) },
      provenance: provs,
    };
    const own = helpText(c.path);
    const usage = own?.match(new RegExp(`claude ${c.path.slice(0, -1).map(x => `${x}(?:\\|[\\w-]+)*`).join(" ")}${c.path.length > 1 ? " " : ""}${c.path.at(-1)}((?:\\|[\\w-]+)+)`));
    if (usage) it.details.aliasesInHelp = usage[1].split("|").filter(Boolean);
    if (cmdItems.has(key)) continue;
    cmdItems.set(key, it);
  }
  for (const s of stubs) {
    const key = s.name;
    if (cmdItems.has(key)) continue;
    const ch = main.m.src.slice(s.node.start, s.node.end);
    const f = { aliases: [], arguments: [] };
    // read description/alias/argument from the stub's own chain
    let n = parent_of_chain(main.m, s.node);
    cmdItems.set(key, {
      id: `cli-cmd-${kebab(key)}`, title: `claude ${key}`, group: group([key]), kind: "cli-command",
      text: n.description, when: "Listed in the root `--help` through a help-display list (from code).",
      documented: docFor([`claude ${key}`]),
      details: { path: key, ...(n.descNode ? consts(CLI_CHUNKS[0], n.descNode) : {}), ...(n.aliases.length ? { aliases: n.aliases } : {}), ...(n.arguments.length ? { arguments: n.arguments } : {}), hidden: false, shownInParentHelp: inHelp(rootHelp.split(/\nCommands:/)[1] ?? "", key), helpDisplayOnly: true },
      provenance: [...(n.descNode ? descProv(CLI_CHUNKS[0], n.descNode) : []), prov(CLI_CHUNKS[0], s.node.start, s.node.end)],
    });
  }
  // root command item
  const rootFacts = facts.get("") ?? {};
  items.push({
    id: "cli-root", title: "claude [prompt]", group: group([]), kind: "cli-command", text: rootFacts.description ?? null,
    when: "Root command description (from code).", documented: `${DOCS_URL}cli-reference`,
    details: { path: "", ...consts(CLI_CHUNKS[0], rootFacts.descNode), arguments: rootFacts.arguments ?? [] },
    provenance: descProv(CLI_CHUNKS[0], rootFacts.descNode),
  });
  const optItemsByPath = new Map();
  const seenOpt = new Set();
  for (const o of options) {
    const key = o.path.join(" ");
    const names = flagNames(o.flags);
    const long = names.find(x => x.startsWith("--")) ?? names[0];
    const uid = `${key}|${long}`;
    const dup = seenOpt.has(uid);
    seenOpt.add(uid);
    const help = helpText(o.path);
    const shown = help != null && inHelp(help, long);
    const provs = [];
    if (o.descNode) provs.push(...descProv(o.file, o.descNode));
    provs.push(prov(o.file, o.node.start, o.node.end));
    const id = `cli-flag-${[...o.path.map(kebab), kebab(long)].join("-")}${dup ? `-${provs.at(-1).binary_offset}` : ""}`;
    const docNeedle = o.path.length ? [`claude ${key}`].map(x => x) : [];
    let documented = null;
    if (!o.path.length) documented = bounded(cliDoc, "`" + long) ? `${DOCS_URL}cli-reference` : null;
    else { const page = docFor([`claude ${key}`]); if (page) { const t = doc(page.replace(DOCS_URL, "").replace("/", "__")); if (bounded(t, long)) documented = page; } }
    const it = {
      id, title: `${o.path.length ? `claude ${key} ` : ""}${o.flags}`, group: group(o.path), kind: "cli-flag",
      text: o.description ?? null,
      when: o.description ? "Option help text (from code)." : `Undocumented; read at \`${o.file}\` offset ${provs[0].binary_offset}.`,
      documented,
      details: { command: key || "(root)", flags: o.flags, ...(o.descNode ? consts(o.file, o.descNode) : {}), hidden: !!o.hidden, shownInHelp: shown, ...o.mods, ...(o.help ? { helpOption: true } : {}), ...(dup ? { registeredMoreThanOnce: true } : {}) },
      provenance: provs,
    };
    if (!optItemsByPath.has(key)) optItemsByPath.set(key, []);
    optItemsByPath.get(key).push(it);
  }
  // order: root flags, then each command followed by its flags
  items.push(...(optItemsByPath.get("") ?? []));
  const keys = [...cmdItems.keys()].sort((a, b) => a.localeCompare(b));
  for (const k of keys) { items.push(cmdItems.get(k)); items.push(...(optItemsByPath.get(k) ?? [])); }
  for (const [k, v] of optItemsByPath) if (k && !cmdItems.has(k)) items.push(...v);
  let rcItem = null;
  // remote-control prints its own help text (its options are not commander options)
  const rcFile = readdirSync(`${ROOT}work/extracted/`).find(f => f.endsWith(".js") && readFileSync(`${ROOT}work/extracted/${f}`, "utf8").includes("Prefix for auto-generated session names"));
  if (rcFile) {
    const rm = mod(rcFile);
    let lit = null;
    walk.simple(rm.ast, { TemplateLiteral(t) { if (!lit && t.quasis.some(q => q.value.cooked?.includes("claude remote-control [options]"))) lit = t; }, Literal(l) { if (!lit && typeof l.value === "string" && l.value.includes("claude remote-control [options]")) lit = l; } });
    if (lit) rcItem = {
      id: "cli-remote-control-help", title: "claude remote-control help text", group: "claude remote-control", kind: "other",
      text: strValue(rm, lit), when: "Help text printed by `claude remote-control --help`; its options are parsed outside commander, so they are listed here rather than as flag items (from code).",
      documented: docFor(["claude remote-control"]), details: { command: "remote-control", ...consts(rcFile, lit) }, provenance: [prov(rcFile, lit.start, lit.end)],
    };
  }
  if (rcItem) { const at = items.findIndex(i => i.id === "cli-cmd-remote-control"); items.splice(at >= 0 ? at + 1 : items.length, 0, rcItem); }
  const cond = new Map([...cmdItems.values()].filter(c => c.details.registrationCondition).map(c => [c.details.path, c.details.registrationCondition]));
  const condProvs = new Map([...cmdItems.values()].filter(c => c.details.registrationCondition).map(c => [c.details.path, c.provenance.slice(-2)]));
  for (const it of items) if (it.kind === "cli-flag" && cond.has(it.details.command)) { it.details.registrationCondition = `its command is ${cond.get(it.details.command)}`; it.provenance.push(...condProvs.get(it.details.command)); }
  for (const it of items) if (it.kind !== "cli-command" || it.id !== "cli-root") {
    const d = it.details;
    d.visibility = d.hidden ? "hidden (from code)" : d.helpDisplayOnly ? "shown in root --help" : (it.kind === "cli-flag" ? d.shownInHelp : d.shownInParentHelp) ? "shown in --help" : d.registrationCondition ? "not shown in --help on this machine (registration is conditional; see Condition)" : "not shown in --help on this machine (no hide marker found; reason not determined)";
  }
  const flags = items.filter(i => i.kind === "cli-flag");
  const cmds = items.filter(i => i.kind === "cli-command");
  const summary = `{{count:cli kind=cli-command}} commands and {{count:cli kind=cli-flag}} flags in Claude Code: {{count:cli kind=cli-command documented=*}} commands and {{count:cli kind=cli-flag documented=*}} flags documented; {{count:cli kind=cli-command details.hidden=true}} commands and {{count:cli kind=cli-flag details.hidden=true}} flags hidden in code; {{count:cli kind=cli-flag details.hidden!=true details.shownInHelp!=true}} more flags not shown in \`--help\` on this machine.${main.dynamic.length + side.dynamic.length ? " Option registrations whose flag names are computed at runtime are not listed." : ""}`;
  writeArea("cli", "Claude Code CLI commands and flags", summary, items, it => {
    const d = it.details;
    const lines = [statusLine(it)];
    if (d.visibility) lines.push(`Visibility: ${d.visibility}`);
    if (d.registrationCondition) lines.push(`Condition: ${d.registrationCondition}`);
    const aliases = [...new Set([...(d.aliases ?? []), ...(d.aliasesInHelp ?? [])])];
    if (aliases.length) lines.push(`Aliases: ${aliases.map(a => `\`${a}\``).join(", ")}`);
    if (d.arguments?.length) lines.push(`Arguments: ${d.arguments.map(a => `\`${a.spec}\`${a.description ? ` — ${a.description}` : ""}`).join("; ")}`);
    if (d.choices) lines.push(`Choices: ${Array.isArray(d.choices) ? d.choices.map(c => `\`${c}\``).join(", ") : d.choices}`);
    if (d.default !== undefined) lines.push(`Default: \`${JSON.stringify(d.default)}\``);
    if (d.env) lines.push(`Environment variable: \`${d.env}\` (commander \`.env()\`, from code)`);
    if (d.required) lines.push("Required option (from code).");
    if (!it.text) lines.push(it.when);
    return lines.join("\n\n");
  });
  return items;
}

// description/alias/argument facts for a `new Command("name")` chain.
function parent_of_chain(m, newNode) {
  const out = { aliases: [], arguments: [], description: null, descNode: null };
  let chainTop = null;
  walk.fullAncestor(m.ast, (n, _s, anc) => { if (n === newNode) chainTop = [...anc]; });
  for (let i = chainTop.length - 2; i >= 0; i--) {
    const a = chainTop[i];
    if (a.type === "MemberExpression") continue;
    if (a.type !== "CallExpression" || a.callee.type !== "MemberExpression") break;
    const meth = a.callee.property.name;
    if (meth === "description") { out.description = strValue(m, a.arguments[0]); out.descNode = a.arguments[0]; }
    if (meth === "alias") out.aliases.push(strValue(m, a.arguments[0]));
    if (meth === "argument") out.arguments.push({ spec: strValue(m, a.arguments[0]), description: a.arguments[1] ? strValue(m, a.arguments[1]) : null });
  }
  return out;
}

// ---------- slash commands ----------

function slashCandidates() {
  const dir = `${ROOT}work/extracted/`;
  return readdirSync(dir).filter(f => f.endsWith(".js") && /type:"(local|local-jsx|prompt)"/.test(readFileSync(dir + f, "utf8")));
}

// Describe a gate function (isEnabled/isHidden) only when it is a literal or a call with literal args.
function gateInfo(m, v) {
  if (!v) return null;
  const body = v.type === "ArrowFunctionExpression" || v.type === "FunctionExpression" ? (v.body.type === "BlockStatement" ? (v.body.body.length === 1 && v.body.body[0].type === "ReturnStatement" ? v.body.body[0].argument : null) : v.body) : v;
  if (!body) return { kind: "computed" };
  const c = constValue(m, body);
  if (isLit(c)) return { kind: "literal", value: c };
  const names = [];
  walk.simple(body, {
    CallExpression(ce) { for (const a of ce.arguments) if (a.type === "Literal" && typeof a.value === "string" && /^[a-z0-9_.:-]{3,}$/i.test(a.value)) names.push(a.value); },
    MemberExpression(me) { if (!me.computed && /^[A-Z][A-Z0-9_]{3,}$/.test(me.property.name)) names.push(me.property.name); },
  });
  return names.length ? { kind: "gated", literals: [...new Set(names)] } : { kind: "computed" };
}

function slash() {
  const files = slashCandidates();
  const found = [];
  for (const file of files) {
    const m = mod(file);
    walk.simple(m.ast, { ObjectExpression(o) {
      const t = propOf(o, "type"), n = propOf(o, "name");
      if (!t || !n || t.value.type !== "Literal" || !["local", "local-jsx", "prompt"].includes(t.value.value) || n.value.type !== "Literal" || typeof n.value.value !== "string") return;
      const d = o.properties.find(p => p.type === "Property" && keyName(p) === "description");
      if (!d && !propOf(o, "load") && !propOf(o, "call") && !propOf(o, "getPromptForCommand")) return;
      found.push({ file, m, o, type: t.value.value, name: n.value.value, d });
    } });
  }
  // Bundled skills registered as prompt commands through the bundled-skill registration helper.
  // Command factories: functions that build a command object ({type:"prompt"|"local"|"local-jsx",
  // name: <param>.name, …}) from a registration object. The bundled-skill registrar is one of them.
  const dir = `${ROOT}work/extracted/`;
  const jsFiles = readdirSync(dir).filter(f => f.endsWith(".js"));
  const texts = new Map(jsFiles.map(f => [f, readFileSync(dir + f, "utf8")]));
  const factories = [];
  for (const file of jsFiles.filter(f => /type:"(prompt|local|local-jsx)",name:[a-zA-Z_$][\w$]*[,.]/.test(texts.get(f)))) {
    const m = mod(file);
    for (const [name, d] of m.decls) {
      const fn = d.type === "FunctionDeclaration" ? d : /Function/.test(d.init?.type ?? "") ? d.init : null;
      const p0 = fn?.params[0];
      if (!p0 || (p0.type !== "Identifier" && p0.type !== "ObjectPattern")) continue;
      const pn = p0.type === "Identifier" ? p0.name : null;
      const alias = p0.type === "ObjectPattern" ? p0.properties.find(q => q.type === "Property" && keyName(q) === "name" && q.value.type === "Identifier")?.value.name : null;
      let type = null;
      walk.simple(fn.body, { ObjectExpression(o) {
        const t = propOf(o, "type"), n = propOf(o, "name");
        const fromParam = n && (pn ? n.value.type === "MemberExpression" && n.value.object.name === pn && n.value.property.name === "name" : alias && n.value.type === "Identifier" && n.value.name === alias);
        if (!type && t?.value.type === "Literal" && ["prompt", "local", "local-jsx"].includes(t.value.value) && fromParam) type = t.value.value;
      } });
      if (type) factories.push({ file, name, type, bundledSkill: m.src.slice(fn.start, fn.end).includes("hasUserSpecifiedDescription:!0") });
    }
  }
  const bundled = [];
  const seenReg = new Set();
  let dynamicNames = 0;
  for (const fac of factories) {
    const exported = [...mod(fac.file).exportsMap].filter(([, l]) => l === fac.name).map(([e]) => e);
    for (const file of jsFiles) {
      if (file !== fac.file && !texts.get(file).includes(fac.file)) continue;
      const m = mod(file);
      const locals = file === fac.file ? [fac.name] : [...m.imports].filter(([, v]) => v.file === fac.file && exported.includes(v.name)).map(([k]) => k);
      if (!locals.length) continue;
      walk.simple(m.ast, { CallExpression(c) {
        if (c.callee.type !== "Identifier" || !locals.includes(c.callee.name) || c.arguments[0]?.type !== "ObjectExpression") return;
        const o = c.arguments[0], n = propOf(o, "name");
        const nameV = n ? strValue(m, n.value) : null;
        if (nameV?.includes("{{expr:")) { dynamicNames++; return; } // name computed at runtime (e.g. in a loop)
        if (!nameV || seenReg.has(`${file}:${o.start}`)) return;
        seenReg.add(`${file}:${o.start}`);
        bundled.push({ file, m, o, name: nameV, factory: fac });
      } });
    }
  }
  const commandsDoc = doc("commands");
  const docNames = new Set([...commandsDoc.matchAll(/`\/([a-z0-9:-]+)/g)].map(x => x[1]));
  const items = [];
  const seen = new Map();
  for (const f of found) {
    const { m, o } = f;
    const desc = f.d && f.d.kind === "init" ? strValue(m, f.d.value) : null;
    const aliasesV = propOf(o, "aliases") ? constValue(m, propOf(o, "aliases").value) : null;
    const en = gateInfo(m, propOf(o, "isEnabled")?.value);
    const hid = gateInfo(m, propOf(o, "isHidden")?.value);
    const hint = propOf(o, "argumentHint") ? strValue(m, propOf(o, "argumentHint").value) : null;
    const details = { type: f.type, ...(f.d && f.d.kind === "init" ? consts(f.file, f.d.value) : {}) };
    if (isLit(aliasesV) && Array.isArray(aliasesV) && aliasesV.length) details.aliases = aliasesV;
    if (hint) {
      details.argumentHint = hint;
      const hc = consts(f.file, propOf(o, "argumentHint").value).constants;
      if (hc) details.constants = { ...(details.constants ?? {}), ...hc };
    }
    if (en) details.isEnabled = en.kind === "literal" ? en.value : en.kind === "gated" ? `gated (condition references ${en.literals.map(x => `\`${x}\``).join(", ")})` : "computed at runtime";
    if (hid) details.isHidden = hid.kind === "literal" ? hid.value : hid.kind === "gated" ? `gated (condition references ${hid.literals.map(x => `\`${x}\``).join(", ")})` : "computed at runtime";
    if (f.d && f.d.kind === "get") details.description = "computed (getter)";
    else if (f.d && desc === null) details.description = "computed at runtime";
    const provs = [];
    if (f.d && desc !== null) provs.push(...descProv(f.file, f.d.value));
    provs.push(prov(f.file, o.start, o.end));
    const idBase = `slash-${kebab(f.name)}`;
    const n = (seen.get(idBase) ?? 0) + 1;
    seen.set(idBase, n);
    const isHiddenLit = details.isHidden === true;
    items.push({
      id: n > 1 ? `${idBase}-${n}` : idBase,
      title: `/${f.name}`,
      group: f.type === "prompt" ? "Prompt commands" : isHiddenLit ? "Hidden commands" : "Local commands",
      kind: "slash-command",
      text: desc,
      when: desc ? "Command description shown in the / menu (from code)." : `Undocumented; read at \`${f.file}\` offset ${provs[0].binary_offset}.`,
      documented: docNames.has(f.name) ? `${DOCS_URL}commands` : null,
      details: { ...details, ...(isHiddenLit ? { hidden: true } : {}), ...(n > 1 ? { definitionIndex: n } : {}) },
      provenance: provs,
    });
  }
  const skillsDoc = doc("skills");
  for (const b of bundled) {
    const { m, o } = b;
    const d = propOf(o, "description"), md = propOf(o, "menuDescription");
    const desc = d ? strValue(m, d.value) : null, menu = md ? strValue(m, md.value) : null;
    const aliasesV = propOf(o, "aliases") ? constValue(m, propOf(o, "aliases").value) : null;
    const en = gateInfo(m, propOf(o, "isEnabled")?.value);
    const inv = propOf(o, "userInvocable") ? constValue(m, propOf(o, "userInvocable").value) : undefined;
    const details = { type: b.factory.bundledSkill ? "prompt (bundled skill)" : `${b.factory.type} (built by a command factory)`, ...(d ? consts(b.file, d.value) : md ? consts(b.file, md.value) : {}) };
    if (isLit(aliasesV) && Array.isArray(aliasesV) && aliasesV.length) details.aliases = aliasesV;
    if (en) details.isEnabled = en.kind === "literal" ? en.value : en.kind === "gated" ? `gated (condition references ${en.literals.map(x => `\`${x}\``).join(", ")})` : "computed at runtime";
    if (isLit(inv) && inv !== undefined) details.userInvocable = inv;
    if (menu && menu !== desc) details.menuDescription = menu;
    const provs = [];
    if (d && desc !== null) provs.push(...descProv(b.file, d.value));
    else if (md && menu !== null) provs.push(...descProv(b.file, md.value));
    provs.push(prov(b.file, o.start, o.end));
    const idBase = `slash-${kebab(b.name)}`;
    const n = (seen.get(idBase) ?? 0) + 1;
    seen.set(idBase, n);
    items.push({
      id: n > 1 ? `${idBase}-${n}` : idBase, title: `/${b.name}`, group: b.factory.bundledSkill ? "Bundled skill commands" : b.factory.type === "prompt" ? "Prompt commands" : "Local commands", kind: "slash-command",
      text: desc ?? menu,
      when: desc || menu ? (b.factory.bundledSkill ? "Bundled skill registered as a prompt command; description from its registration (from code). Its prompt text belongs to the prompts area." : "Description from the command's registration object (from code).") : `Undocumented; read at \`${b.file}\` offset ${provs[0].binary_offset}.`,
      documented: docNames.has(b.name) ? `${DOCS_URL}commands` : skillsDoc.includes("`/" + b.name) || skillsDoc.includes("`" + b.name + "`") ? `${DOCS_URL}skills` : null,
      details, provenance: provs,
    });
  }
  const byTitle = new Map();
  for (const it of items) byTitle.set(it.title, [...(byTitle.get(it.title) ?? []), it]);
  for (const [, list] of byTitle) if (list.length > 1) list.forEach((it, i) => { it.title = `${it.title} (definition ${i + 1} of ${list.length}, \`${it.provenance.at(-1).file}\`)`; it.details.definitions = list.length; });
  const G = ["Local commands", "Prompt commands", "Bundled skill commands", "Hidden commands"];
  items.sort((a, b) => G.indexOf(a.group) - G.indexOf(b.group) || a.title.localeCompare(b.title));
  const docCount = items.filter(i => i.documented).length;
  for (const it of items) it.details.name = it.title.split(" ")[0];
  const summary = `{{count:slash-commands kind=slash-command}} built-in slash command definitions ({{count:slash-commands group="Bundled skill commands"}} of them bundled skills) in Claude Code ({{distinct:slash-commands details.name}} distinct names): {{count:slash-commands documented=*}} documented, {{count:slash-commands documented=null}} undocumented, {{count:slash-commands details.hidden=true}} hidden by a literal \`isHidden\`. Gates are recorded only as literal values or the literal names their conditions reference.${dynamicNames ? " Registrations whose names are computed at runtime are not listed." : ""}`;
  writeArea("slash-commands", "Claude Code built-in slash commands", summary, items, it => {
    const d = it.details;
    const lines = [statusLine(it), `Type: \`${d.type}\``];
    if (d.aliases) lines.push(`Aliases: ${d.aliases.map(a => `\`/${a}\``).join(", ")}`);
    if (d.argumentHint) lines.push(`Argument hint: \`${d.argumentHint}\``);
    if (d.isEnabled !== undefined) lines.push(`isEnabled: ${typeof d.isEnabled === "boolean" ? `\`${d.isEnabled}\`` : d.isEnabled}`);
    if (d.isHidden !== undefined) lines.push(`isHidden: ${typeof d.isHidden === "boolean" ? `\`${d.isHidden}\`` : d.isHidden}`);
    if (d.description) lines.push(`Description: ${d.description}.`);
    if (d.userInvocable !== undefined) lines.push(`userInvocable: \`${d.userInvocable}\``);
    if (d.menuDescription) lines.push(`Menu description: ${d.menuDescription}`);
    if (!it.text) lines.push(it.when);
    return lines.join("\n\n");
  });
  return items;
}

// ---------- main ----------

export { cliAnalyzer, CLI_CHUNKS };
const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
const want = new Set(process.argv.slice(2));
const run = n => isMain && (want.size === 0 || want.has(n));
if (run("settings")) settings();
if (run("hooks")) hooks();
if (run("cli")) cli();
if (run("slash")) slash();
