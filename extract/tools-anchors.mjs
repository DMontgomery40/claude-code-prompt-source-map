// Content anchors for the tools extractor (extract/tools.mjs). Nothing here names a minified
// identifier or a chunk file: each anchor is found by what the code says (string literals,
// property names, the shape of a function), because every Claude Code release renames both.
// A missing or ambiguous anchor throws AnchorError, and tools.mjs then writes nothing.
import * as walk from "acorn-walk";
import { resolve } from "./zodlite.mjs";

export class AnchorError extends Error {}
const fail = message => { throw new AnchorError(message); };

const fnOfDecl = node => (node.type === "FunctionDeclaration" ? node : /Function/.test(node.init?.type ?? "") ? node.init : null);

// Every top-level function of the given modules. `src` is the declaration's own text;
// `deep()` adds the text of the top-level functions it calls directly.
export function functionIndex(mods) {
  const out = [];
  for (const m of mods) for (const [name, node] of m.decls) {
    const fn = fnOfDecl(node);
    if (!fn) continue;
    out.push({ m, name, node, fn, len: node.end - node.start, src: null });
  }
  return out;
}
const srcOf = e => (e.src ??= e.m.src.slice(e.node.start, e.node.end));
function deepOf(e) {
  if (e.deep) return e.deep;
  const parts = [srcOf(e)];
  walk.simple(e.fn.body, { CallExpression(n) {
    if (n.callee.type !== "Identifier") return;
    const r = resolve(e.m, n.callee.name);
    if (r?.node && r.node.end - r.node.start < 4000) parts.push(r.m.src.slice(r.node.start, r.node.end));
  } });
  return (e.deep = parts.join("\n"));
}
const key = (m, node) => `${m.name}:${node.start}`;

// Find the functions an anchor describes: `own` tests the function's text (length <= max),
// `deep` lists strings the function or its direct callees must contain.
function find(index, a) {
  const hits = index.filter(e => e.len <= (a.max ?? 400) && a.own.test(srcOf(e)) && (a.deep ?? []).every(s => deepOf(e).includes(s)));
  if (!hits.length) fail(`anchor not found: ${a.what} (pattern ${a.own}${a.deep ? `, calls into code containing ${a.deep.join(", ")}` : ""})`);
  if (hits.length > (a.most ?? 1)) fail(`anchor ambiguous: ${a.what} matched ${hits.length} functions (${hits.slice(0, 5).map(h => `${h.m.name}:${h.name}`).join(", ")})`);
  return hits;
}

// Gate functions that pick prompt branches: a readable label and the value in the default
// setup described in the page intro (def undefined = not read). Labels were read from the
// function bodies; the patterns pin those bodies by content.
const I = "[\\w$]+";
export const GATE_ANCHORS = [
  { what: "lean prompt", label: "lean prompt (options.leanPrompt, else the model's setting)", def: true, own: new RegExp(`^function ${I}\\((${I})\\)\\{return \\1\\.leanPrompt\\?\\?${I}\\(\\1\\.model\\)\\}$`) },
  { what: "embedded find/grep", label: "embedded find/grep replace Glob and Grep", def: true, own: /CLAUDE_CODE_ENTRYPOINT!=="local-agent"\}$/, deep: ["searchToolsOptIn"] },
  { what: "Task tools on", label: "Task tools on (CLAUDE_CODE_ENABLE_TASKS not false)", def: true, own: /^function [\w$]+\(\)\{if\([\w$.]+CLAUDE_CODE_ENABLE_TASKS===!1\)return!1;return!0\}$/ },
  { what: "PowerShell tool enabled", label: "PowerShell tool enabled", def: false, own: /CLAUDE_CODE_USE_POWERSHELL_TOOL[\s\S]*"tengu_cobalt_ridge"/ },
  { what: "tool search on", label: "tool search on", def: true, own: /^function [\w$]+\(\)\{[\s\S]*tool_search_optimistic_decision[\s\S]*ENABLE_TOOL_SEARCH/, max: 2000 },
  { what: "nonessential traffic disabled", label: "nonessential traffic disabled", def: false, own: /^function [\w$]+\(\)\{return [\w$]+\(\)==="essential-traffic"\}$/ },
  { what: "non-interactive session", label: "non-interactive session", def: false, own: /^function [\w$]+\(\)\{return![\w$]+\(\)\.host\.launchOptions\.isInteractive\(\)\}$/ },
  { what: "brief mode on", label: "brief mode on", def: false, own: /^function [\w$]+\(\)\{return [\w$]+\(\)&&[\w$]+\(\)\|\|[\w$]+\(\)\}$/, deep: ["userMsgOptIn", "CLAUDE_CODE_BRIEF", "pewter_owl_brief"] },
  { what: "host renders extended questions", label: "host renders extended questions", own: /^function [\w$]+\(\)\{return [\w$]+\(\)\.host\.launchOptions\.extendedQuestionsEnabled\(\)\}$/ },
  { what: "background tasks disabled", label: "background tasks disabled", def: false, own: /^function [\w$]+\(\)\{return [\w$]+\(\)\.backgroundTasksDisabled\|\|[\w$]+\.CLAUDE_CODE_DISABLE_BACKGROUND_TASKS\}$/ },
  { what: "agent push notifications on", label: "agent push notifications on (agentPushNotifEnabled)", def: false, own: /\("agentPushNotifEnabled",!1\)\.value\}$/, max: 120 },
  { what: "first-party API provider", label: "first-party API provider", def: true, own: /^function [\w$]+\(\)\{return [\w$]+\(\)==="firstParty"\}$/, deep: ["CLAUDE_CODE_USE_BEDROCK"] },
  { what: "Remote Control bridge active", label: "Remote Control bridge active", def: false, own: /^function [\w$]+\(\)\{return [\w$]+\(\)\.surfaceCapabilities\.replBridgeActive\(\)\}$/ },
  { what: "background session", label: "background session", def: false, own: /^function [\w$]+\(\)\{return [\w$]+\(\)==="bg"\}$/, deep: ["CLAUDE_CODE_SESSION_KIND"] },
  { what: "fork subagents enabled", label: "fork subagents enabled", own: /^function [\w$]+\(\)\{return [\w$]+\(\)!=="disabled"\}$/, deep: ["forkSubagentEnabledSource"] },
  { what: "coordinator mode", label: "coordinator mode (CLAUDE_CODE_COORDINATOR_MODE)", def: false, own: /^function [\w$]+\(\)\{if\(![\w$]+\([\w$.]*CLAUDE_CODE_COORDINATOR_MODE\)\)return!1;/, max: 250 },
];

// Functions whose facts the "How the tool list is built" section reports. The registry exports
// an object {getAllBaseTools, getTools, assembleToolPool}; the deferral decision is pinned by
// its checks (alwaysLoad first, MCP tools deferred, shouldDefer last).
const REGISTRY_KEYS = { "pipeline-get-all-base-tools": "getAllBaseTools", "pipeline-get-tools": "getTools", "pipeline-assemble-tool-pool": "assembleToolPool" };
export const PIPELINE_ANCHORS = {
  "pipeline-deferral": { what: "the deferral decision", own: /\.alwaysLoad===!0\)return!1;[\s\S]*\.isMcp===!0\)return!0;[\s\S]*\.shouldDefer===!0\}$/, max: 600 },
};

export function findGates(index) {
  const gates = new Map();
  for (const a of GATE_ANCHORS) for (const h of find(index, a)) gates.set(key(h.m, h.node), { label: a.label, def: a.def });
  return gates;
}
export function findPipeline(index, mods) {
  const out = {}, regs = [];
  for (const m of mods) for (const [, d] of m.decls) {
    const props = d.init?.type === "ObjectExpression" ? d.init.properties : null;
    if (!props || props.length !== 3) continue;
    const byKey = new Map(props.map(p => [p.key?.name, p.value]));
    if (Object.values(REGISTRY_KEYS).every(k => byKey.get(k)?.type === "Identifier")) regs.push({ m, byKey });
  }
  if (regs.length !== 1) fail(`anchor ${regs.length ? "ambiguous" : "not found"}: the tool registry object {getAllBaseTools, getTools, assembleToolPool}`);
  for (const [id, k] of Object.entries(REGISTRY_KEYS)) {
    const r = resolve(regs[0].m, regs[0].byKey.get(k).name);
    if (!r?.node) fail(`anchor not found: ${k} (registry entry does not resolve)`);
    out[id] = { m: r.m, node: r.node, name: r.name };
  }
  for (const [id, a] of Object.entries(PIPELINE_ANCHORS)) { const [h] = find(index, a); out[id] = { m: h.m, node: h.node, name: h.name }; }
  return out;
}

// Remote feature-flag readers: the function that calls getFeatureValueWithSource, then every
// short function that passes its first two parameters straight to a reader (value, pinned
// and wrapper forms), to a fixpoint.
export function findFlagReaders(index) {
  const base = index.filter(e => e.len < 200 && /\.getFeatureValueWithSource\(([\w$]+),([\w$]+)\)\}$/.test(srcOf(e)));
  if (base.length !== 1) fail(`anchor ${base.length ? "ambiguous" : "not found"}: feature-flag base reader (a short function returning X().getFeatureValueWithSource(a,b))`);
  const readers = new Set([key(base[0].m, base[0].node)]), out = new Set();
  const small = index.filter(e => e.len < 200 && e.fn.params.length >= 2 && e.fn.params.slice(0, 2).every(p => p.type === "Identifier"));
  for (let changed = true; changed;) {
    changed = false;
    for (const e of small) {
      const k = key(e.m, e.node);
      if (readers.has(k)) continue;
      const [p0, p1] = e.fn.params.map(p => p.name);
      let hit = false;
      walk.simple(e.fn.body, { CallExpression(n) {
        if (hit || n.callee.type !== "Identifier" || n.arguments[0]?.name !== p0 || n.arguments[1]?.name !== p1) return;
        const r = resolve(e.m, n.callee.name);
        if (r?.node && readers.has(key(r.m, r.node))) hit = true;
      } });
      if (hit) { readers.add(k); out.add(k); changed = true; }
    }
  }
  if (!out.size) fail("anchor not found: feature-flag readers (functions passing (name, default) to the base reader)");
  return out;
}

// The tool builder: the function most often called with a {name, inputSchema, …} literal.
export function findBuilder(mods) {
  const counts = new Map();
  for (const m of mods) walk.simple(m.ast, { CallExpression(n) {
    if (n.callee.type !== "Identifier" || n.arguments[0]?.type !== "ObjectExpression") return;
    const ks = new Set(n.arguments[0].properties.filter(p => p.type === "Property").map(p => p.key.name ?? p.key.value));
    if (!ks.has("name") || !ks.has("inputSchema")) return;
    const r = resolve(m, n.callee.name);
    if (!r?.node) return;
    const k = key(r.m, r.node), c = counts.get(k) ?? { m: r.m, node: r.node, name: r.name, n: 0 };
    c.n++; counts.set(k, c);
  } });
  const ranked = [...counts.values()].sort((a, b) => b.n - a.n);
  if (!ranked.length || ranked[0].n < 20 || ranked[0].n < 4 * (ranked[1]?.n ?? 0)) fail(`anchor not found: tool builder (top callee with tool literals: ${ranked.slice(0, 3).map(r => `${r.m.name}:${r.name} x${r.n}`).join(", ") || "none"})`);
  const b = ranked[0];
  const defaults = /\{isEnabled:\(\)=>!0,isConcurrencySafe:\([\w$]*\)=>!1,isReadOnly:\([\w$]*\)=>!1,isDestructive:\([\w$]*\)=>!1/.test(b.m.src);
  if (!defaults) fail("anchor not found: tool builder defaults ({isEnabled:()=>!0,isConcurrencySafe:…=>!1,isReadOnly:…=>!1,isDestructive:…=>!1}) beside the builder");
  return b;
}

// Generic tool-shaped objects published as wrappers, identified by their own text.
// `src` is the object literal's text, `outer` the text of the enclosing top-level declaration.
export const WRAPPER_ANCHORS = [
  { id: "wrapper-mcp", test: (src) => src.includes("isMcp:!0") && /\bname:"mcp"/.test(src) },
  { id: "wrapper-permission-stub", test: (src, outer) => outer.includes("stub exists only for permission UI rendering") && /\bisEnabled:\(\)=>!1/.test(src) },
  { id: "wrapper-artifact-toolset", test: (src) => /^\{get inputSchema\(\)\{return [\w$]+\(\)\?/.test(src) && src.includes("streamedInputRepairExemptKeys") },
  { id: "wrapper-condition-output", test: (src) => src.includes("Whether the condition was met") && src.includes("alwaysLoad:!0") },
  { id: "wrapper-powershell-remote", test: (src) => src.includes("PowerShell runs only on") && src.includes("Object.getOwnPropertyDescriptors") },
];

// The text of a node plus every top-level declaration it references, transitively to `depth`
// (imports followed). Hand-read availability notes are checked against it: each flag, env var
// and backticked name a note cites must still occur here.
export function closureText(m, node, depth = 4, budget = 600) {
  const seen = new Set([`${m.name}:${node.start}`]), parts = [m.src.slice(node.start, node.end)];
  let frontier = [{ m, node }];
  for (let d = 0; d < depth && frontier.length && seen.size < budget; d++) {
    const next = [];
    for (const f of frontier) walk.full(f.node, n => {
      if (n.type !== "Identifier" || seen.size >= budget) return;
      const r = resolve(f.m, n.name);
      if (!r?.node) return;
      const k = `${r.m.name}:${r.node.start}`;
      if (seen.has(k) || r.node.end - r.node.start > 30000) return;
      seen.add(k); parts.push(r.m.src.slice(r.node.start, r.node.end)); next.push({ m: r.m, node: r.node });
    });
    frontier = next;
  }
  return parts.join("\n");
}

// Names a hand-written note cites that must occur in code: backticked words, remote flags and
// environment variables.
export function citedNames(text) {
  const out = new Set();
  for (const mt of text.matchAll(/`([^`\s]+)`/g)) if (!/^(yes|no|true|false|none)$/.test(mt[1])) out.add(mt[1]);
  for (const mt of text.matchAll(/\b(tengu_[a-z0-9_]+|[A-Z][A-Z0-9]*_[A-Z0-9_]{2,})\b/g)) out.add(mt[1]);
  return [...out];
}
