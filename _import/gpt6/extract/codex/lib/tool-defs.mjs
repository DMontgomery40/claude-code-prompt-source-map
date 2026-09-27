// Tool definitions in the desktop app's JavaScript: object literals with a name, a
// description and a parameter schema. Values are evaluated in isolated vm contexts, with
// every free identifier resolved from its definition in the same chunk; identifiers a chunk
// imports from another chunk are resolved in that chunk's own context, so zod schemas built
// in one chunk from another chunk's zod run through the app's own zod and toJSONSchema.
// Anything that cannot be resolved becomes a recording proxy (a "stub") and is reported.

import crypto from "node:crypto";
import vm from "node:vm";
import { byteOffset } from "./asar.mjs";
import { insideLiteral, literalsOf, scanCode } from "./js-scan.mjs";

export const sha256 = text => crypto.createHash("sha256").update(text).digest("hex");

// ---- locating definitions ----------------------------------------------------------------

const ANCHORS = ["inputSchema:", "parameters:", "input_schema:", "schema:", "inputSchema,", "inputSchema}"];
const SCHEMA_KEYS = ["inputSchema", "parameters", "input_schema", "schema"];

function topProps(src, open) {
  const props = [];
  let i = open + 1;
  for (;;) {
    const p = scanCode(src, i, "}", null, ",");
    const text = src.slice(i, p);
    if (text.trim()) props.push({ start: i, end: p, text });
    if (src[p] !== ",") return { props, close: p };
    i = p + 1;
  }
}

function enclosingObject(src, index, key) {
  for (let j = index - 1, n = 0; j >= Math.max(0, index - 30000) && n < 400; j--) {
    if (src[j] !== "{") continue;
    n++;
    if (insideLiteral(src, j)) continue;
    let r;
    try { r = topProps(src, j); } catch { continue; }
    if (r.close < index) continue;
    if (r.props.some(p => p.start <= index && index < p.end && p.text.trimStart().startsWith(key))) return { open: j, ...r };
  }
  return null;
}

function propMap(props) {
  const m = {};
  for (const p of props) {
    const k = /^\s*([\w$]+|"[^"]*"|`[^`]*`)\s*:/.exec(p.text);
    if (k) m[k[1].replace(/["`]/g, "")] = p.text.slice(k[0].length);
    else if (/^\s*[\w$]+\s*$/.test(p.text)) m[p.text.trim()] = p.text.trim(); // shorthand {inputSchema}
  }
  return m;
}

// Definitions listed in an array literal that is mapped straight away, as in
// [{name,description,schema}, …].map(({schema:e,...t})=>({...t,inputSchema:convert(e)})):
// the mapper's source, so the app's own conversion can be applied to each entry.
function arrayMapper(src, close) {
  let i = close + 1;
  for (let n = 0; n < 200 && src[i] === ","; n++) {
    if (src[i + 1] !== "{") return null;
    i = scanCode(src, i + 2, "}", null) + 1;
  }
  if (src[i] !== "]" || !src.startsWith(".map(", i + 1)) return null;
  const end = scanCode(src, i + 6, ")", null);
  const mapper = src.slice(i + 6, end);
  return /inputSchema\s*:/.test(mapper) ? mapper : null;
}

// Every object literal in `src` that has name, description and a schema-like key.
export function findDefinitions(src) {
  const found = new Map();
  for (const key of ANCHORS) {
    for (let at = src.indexOf(key); at >= 0; at = src.indexOf(key, at + 1)) {
      if (/[\w$.]/.test(src[at - 1]) || insideLiteral(src, at)) continue;
      const obj = enclosingObject(src, at, key.replace(/[:,}]$/, ""));
      if (!obj || found.has(obj.open)) continue;
      const props = propMap(obj.props);
      const schemaKey = SCHEMA_KEYS.find(k => k in props);
      if ("name" in props && "description" in props && schemaKey) found.set(obj.open, { open: obj.open, offset: byteOffset(src, obj.open), props, schemaKey, mapper: arrayMapper(src, obj.close) });
    }
  }
  return [...found.values()].sort((a, b) => a.open - b.open);
}

// ---- definitions of free identifiers -----------------------------------------------------

function definitionsOf(src, name, cache) {
  if (cache.has(name)) return cache.get(name);
  const esc = name.replace(/\$/g, "\\$");
  const found = [];
  for (const m of src.matchAll(new RegExp(`function\\s+${esc}\\s*\\(`, "g"))) {
    if (insideLiteral(src, m.index)) continue;
    const open = m.index + m[0].length - 1;
    const close = scanCode(src, open + 1, ")", null);
    const bodyEnd = scanCode(src, close + 2, "}", null);
    found.push({ kind: "function", source: `(${src.slice(m.index, bodyEnd + 1)})` });
  }
  for (const m of src.matchAll(new RegExp(`(?<![\\w$.#])${esc}=(?![=>])`, "g"))) {
    if (insideLiteral(src, m.index)) continue;
    const start = m.index + m[0].length;
    const end = scanCode(src, start, null, null, ",;");
    found.push({ kind: "value", source: `(${src.slice(start, end)})` });
  }
  cache.set(name, found);
  return found;
}

// True when a definition is plain data: literals, object and array literals, and
// substitutions of bare identifiers; no calls, functions or constructors.
export function isData(source) {
  const literals = literalsOf(source).outer;
  let rest = "";
  let last = 0;
  for (const literal of literals) {
    const text = source.slice(literal.start, literal.end);
    if (text.startsWith("`") && [...text.matchAll(/\$\{([^}]*)\}/g)].some(m => !/^[\w$]+$/.test(m[1]))) return false;
    rest += source.slice(last, literal.start);
    last = literal.end;
  }
  rest += source.slice(last);
  return !/[\w$)\]]\s*\(|=>|\bfunction\b|\bnew\b|\?\?|\?[^.]|\.\.\./.test(rest.replace(/^\(/, ""));
}

function importMap(src) {
  const map = new Map();
  for (const m of src.slice(0, 400000).matchAll(/import\{([^}]*)\}from"\.\/([^"]+)"/g)) {
    for (const part of m[1].split(",")) {
      const [exported, local] = part.includes(" as ") ? part.split(" as ") : [part, part];
      map.set(local.trim(), { exported: exported.trim(), module: m[2] });
    }
  }
  return map;
}

function exportedLocal(src, exported) {
  const tail = src.slice(-600000);
  const esc = exported.replace(/\$/g, "\\$");
  return new RegExp(`(?:^|[{,])([\\w$]+) as ${esc}(?=[,}])`).exec(tail)?.[1] ?? (new RegExp(`[{,]${esc}(?=[,}])`).test(tail) ? exported : null);
}

// ---- recording proxies ---------------------------------------------------------------------

export const NODE = Symbol("node");
let touched = null;
function stub(desc) {
  const touch = () => touched?.add(desc.callee);
  return new Proxy(function () {}, {
    get(_, prop) {
      if (prop === NODE) return desc;
      if (prop === Symbol.toPrimitive) return () => { touch(); return `[stub ${desc.callee}]`; };
      if (typeof prop === "symbol") return undefined;
      touch();
      if (prop === "shape") return stub({ ...desc, chain: [...desc.chain, { m: ".shape" }] });
      return new Proxy(function () {}, {
        apply: (_t, _s, args) => stub({ ...desc, chain: [...desc.chain, { m: prop, args }] }),
        get: (_t, p2) => (p2 === NODE ? { ...desc, chain: [...desc.chain, { m: `.${prop}` }] } : undefined)
      });
    },
    apply(_, __, args) { touch(); return stub({ callee: desc.callee, file: desc.file, builder: desc.builder, args, chain: [] }); }
  });
}
export const isStub = v => (typeof v === "function" || typeof v === "object") && v !== null && v[NODE] != null;

export function plain(v, seen = new Set()) {
  if (isStub(v)) {
    const d = v[NODE];
    return { __stub: d.callee, args: (d.args ?? []).map(a => plain(a, seen)), chain: d.chain.map(c => ({ m: c.m, args: (c.args ?? []).map(a => plain(a, seen)) })) };
  }
  if (typeof v === "function") return "[function]";
  if (Array.isArray(v)) return Array.from(v, x => plain(x, seen)); // a main-realm copy of a vm-realm array
  if (v && typeof v === "object") {
    if (seen.has(v)) return "[cycle]";
    seen.add(v);
    const out = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x, seen)]));
    seen.delete(v);
    return out;
  }
  return v;
}
const hasStub = v => /"__stub"|\[stub /.test(JSON.stringify(plain(v)) ?? "");

// ---- chunks and evaluation -------------------------------------------------------------------

// A set of JavaScript chunks that import from each other by relative file name.
//
// Each evaluation gets a fresh scope for its own chunk, so the identifiers it resolves are
// logged per tool. In "shared" mode, code definitions (functions, calls) and imported
// bindings come from one persistent scope per chunk, so a library such as zod is built once
// and reused; a ReferenceError is resolved in the scope whose realm threw it.
export class Chunks {
  constructor(files) {
    this.files = files; // Map path -> source text
    this.defs = new Map();
    this.imports = new Map();
    this.persistent = new Map();
    this.realms = new Map(); // realm's ReferenceError -> scope
  }
  source(file) { return this.files.get(file); }
  definitions(file, name) {
    if (!this.defs.has(file)) this.defs.set(file, new Map());
    return definitionsOf(this.source(file), name, this.defs.get(file));
  }
  importOf(file, name) {
    if (!this.imports.has(file)) this.imports.set(file, importMap(this.source(file)));
    const imp = this.imports.get(file).get(name);
    if (!imp) return null;
    const target = [...this.files.keys()].find(f => f === imp.module || f.endsWith(`/${imp.module}`));
    const local = target ? exportedLocal(this.source(target), imp.exported) : null;
    return local ? { file: target, name: local } : null;
  }
  persistentScope(file) {
    if (!this.persistent.has(file)) this.persistent.set(file, this.scope(file, { shared: true, persistent: true }));
    return this.persistent.get(file);
  }
  scope(file, { shared, persistent = false }) {
    const chunks = this;
    const context = vm.createContext(Object.create(null));
    const self = { file, context, log: [], stubs: [] };
    chunks.realms.set(vm.runInContext("ReferenceError", context), self);
    const put = (name, value, entry) => { context[name] = value; self.log.push({ name, ...entry }); };
    const makeStub = (name, callee) => { self.stubs.push(name); put(name, stub({ callee, file, chain: [] }), { kind: "stub" }); };
    self.resolve = (name, chain) => {
      if (chain.includes(name)) return makeStub(name, `circular:${name}`);
      const defs = chunks.definitions(file, name);
      if (!defs.length) {
        const imp = shared ? chunks.importOf(file, name) : null;
        if (imp) {
          const target = chunks.persistentScope(imp.file);
          if (!(imp.name in target.context)) target.run(imp.name, []);
          return put(name, target.context[imp.name], { kind: "import", from: imp });
        }
        return makeStub(name, name);
      }
      // Bundled libraries keep singletons on globalThis behind an initializer such as
      // (x=globalThis).__zod_globalRegistry??(x.__zod_globalRegistry=init()); run it first.
      for (const d of defs) {
        const prop = /^\(globalThis\.([\w$]+)\)$/.exec(d.source)?.[1];
        if (!prop || vm.runInContext(`globalThis.${prop}`, context) !== undefined) continue;
        const src = chunks.source(file);
        const init = new RegExp(`\\.${prop.replace(/\$/g, "\\$")}\\?\\?\\(([\\w$]+)\\.${prop.replace(/\$/g, "\\$")}=`).exec(src);
        if (init) self.run(`globalThis.${prop}??=(${src.slice(init.index + init[0].length, scanCode(src, init.index + init[0].length, ")", null))})`, [...chain, name]);
      }
      const data = defs.every(d => d.kind === "value" && isData(d.source));
      if (shared && !persistent && !data) {
        const home = chunks.persistentScope(file);
        if (!(name in home.context)) home.run(name, []);
        const value = home.context[name];
        return put(name, value, { kind: isStub(value) ? "stub" : "code" });
      }
      const values = [];
      for (const d of defs.slice(0, 6)) {
        try { values.push(self.run(d.source, [...chain, name])); } catch { values.push(undefined); }
      }
      const good = values.filter(v => v !== undefined);
      const same = good.length && good.every(v => safeJSON(v) === safeJSON(good[0]));
      if ((defs.length === 1 && good.length === 1) || (same && defs.length <= 3)) return put(name, good[0], { kind: data ? "data" : "code" });
      makeStub(name, `opaque:${name}`);
    };
    self.run = (code, chain) => {
      for (let attempt = 0; attempt < 2000; attempt++) {
        try { return vm.runInContext(code, context, { timeout: 2000 }); }
        catch (error) {
          const miss = error?.name === "ReferenceError" && /^(.+) is not defined$/.exec(error.message);
          if (!miss) throw error;
          const owner = chunks.realms.get(error.constructor) ?? self;
          if (owner !== self && miss[1] in owner.context) throw error;
          owner.resolve(miss[1], owner === self ? chain : []);
        }
      }
      throw new Error("too many unresolved identifiers");
    };
    return self;
  }
  // Evaluates `expr` (source text from `file`) in a fresh scope for that chunk. With
  // shared: false, imported bindings become recording proxies and nothing is reused.
  evaluate(file, expr, { shared = true } = {}) {
    const scope = this.scope(file, { shared });
    const before = new Map([...this.persistent].map(([f, s]) => [f, s.stubs.length]));
    touched = new Set();
    try {
      const value = scope.run(`(${expr})`, []);
      const newStubs = [...this.persistent].flatMap(([f, s]) => s.stubs.slice(before.get(f) ?? 0));
      return { value, log: scope.log, touched: [...touched], stubs: [...new Set([...scope.stubs, ...newStubs])] };
    } finally { touched = null; }
  }
}
const safeJSON = v => { try { return JSON.stringify(plain(v)); } catch { return "?"; } };

// ---- zod builders as recording proxies: an approximate parameter list -----------------------

const KIND = {
  ZodString: "string", ZodNumber: "number", ZodInt: "integer", ZodNumberFormat: "integer", ZodBoolean: "boolean", ZodObject: "object",
  ZodArray: "array", ZodEnum: "enum", ZodLiteral: "literal", ZodUnion: "union", ZodDiscriminatedUnion: "union",
  ZodRecord: "record", ZodUnknown: "unknown", ZodAny: "unknown", ZodNull: "null", ZodOptional: "optional", ZodNullable: "nullable"
};

// The Zod class a builder constructs, found by following import aliases to its definition.
function zodClassOf(chunks, file, name, depth = 0, cache = (chunks.zodCache ??= new Map())) {
  const key = `${file}|${name}`;
  if (cache.has(key)) return cache.get(key);
  let result = null;
  const src = chunks.source(file);
  const look = text => /[`"](Zod[A-Z]\w+)[`"]/.exec(text)?.[1];
  const defs = chunks.definitions(file, name).filter(d => d.kind === "function" || /^\((?:function|\()/.test(d.source));
  for (const d of defs) {
    result = look(d.source.slice(0, 4000));
    for (const ref of result ? [] : new Set([...d.source.slice(0, 600).matchAll(/[(,]([A-Za-z_$][\w$]*)[,)]/g)].map(x => x[1]))) {
      for (const d2 of chunks.definitions(file, ref).slice(0, 2)) { result = look(d2.source.slice(0, 3000)); if (result) break; }
      if (result) break;
    }
    if (result) break;
  }
  if (!result && !defs.length && depth < 3 && src) {
    const imp = chunks.importOf(file, name);
    if (imp) result = zodClassOf(chunks, imp.file, imp.name, depth + 1, cache);
  }
  cache.set(key, result);
  return result;
}

function kindOf(chunks, n) {
  const id = /^(?:opaque|circular):/.test(n.callee) ? null : zodClassOf(chunks, n.file, n.callee);
  if (id && KIND[id]) return KIND[id];
  const a0 = n.args?.[0];
  const methods = n.chain.map(c => c.m);
  if (methods.some(m => ["trim", "email", "url", "regex", "uuid", "datetime", "startsWith"].includes(m))) return "string";
  if (methods.includes("int")) return "integer";
  if (a0 && !isStub(a0) && typeof a0 === "object" && !Array.isArray(a0)) return "object";
  if (Array.isArray(a0) && a0.every(x => typeof x === "string")) return "enum";
  if (Array.isArray(a0) && a0.every(isStub)) return "union";
  if (typeof a0 === "string" && Array.isArray(n.args[1])) return "union";
  if (["string", "number", "boolean"].includes(typeof a0)) return "literal";
  if (isStub(a0) && n.args.length === 2 && isStub(n.args[1])) return "record";
  if (isStub(a0)) return "array";
  return null;
}

// Converts a recorded zod chain to a JSON-Schema-like object. Approximate by design.
function symbolic(chunks, v) {
  if (!isStub(v)) {
    if (Array.isArray(v)) return { schema: v.map(x => symbolic(chunks, x).schema), optional: false };
    if (v && typeof v === "object") return { schema: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, symbolic(chunks, x).schema])), optional: false };
    return { schema: v, optional: false };
  }
  const n = v[NODE];
  const kind = kindOf(chunks, n);
  let s; let optional = false; let required = null;
  if (kind === "object") {
    s = { type: "object", properties: {} }; required = [];
    for (const [k, x] of Object.entries(n.args?.[0] ?? {})) { const r = symbolic(chunks, x); s.properties[k] = r.schema; if (!r.optional) required.push(k); }
  } else if (["string", "number", "integer", "boolean", "null"].includes(kind)) s = { type: kind };
  else if (kind === "enum") s = { type: "string", enum: n.args[0] };
  else if (kind === "literal") s = { type: typeof n.args[0], const: n.args[0] };
  else if (kind === "array") s = { type: "array", items: symbolic(chunks, n.args[0]).schema };
  else if (kind === "union") s = { anyOf: (Array.isArray(n.args[0]) ? n.args[0] : n.args[1]).map(x => symbolic(chunks, x).schema) };
  else if (kind === "record") s = { type: "object", additionalProperties: symbolic(chunks, n.args[1]).schema };
  else if (kind === "optional") { const r = symbolic(chunks, n.args[0]); s = r.schema; optional = true; }
  else if (kind === "nullable") s = { anyOf: [symbolic(chunks, n.args[0]).schema, { type: "null" }] };
  else s = {};
  for (const c of n.chain) {
    const a = c.args ?? [];
    if (c.m === "describe") s.description = a[0];
    else if (c.m === "optional" || c.m === "default") optional = true;
    else if (c.m === "nullish") { optional = true; s = { anyOf: [s, { type: "null" }] }; }
    else if (c.m === "nullable") s = { anyOf: [s, { type: "null" }] };
    else if (c.m === "int") s.type = "integer";
    else if (c.m === "extend" && s.properties) for (const [k, x] of Object.entries(a[0] ?? {})) { const r = symbolic(chunks, x); s.properties[k] = r.schema; required = required.filter(y => y !== k); if (!r.optional) required.push(k); }
    else if (c.m === "omit" && s.properties) for (const k of Object.keys(a[0] ?? {})) { delete s.properties[k]; required = required.filter(y => y !== k); }
    else if (c.m === "pick" && s.properties) for (const k of Object.keys(s.properties)) { if (!(k in (a[0] ?? {}))) { delete s.properties[k]; required = required.filter(y => y !== k); } }
    else if (c.m === "required" && s.properties) for (const k of Object.keys(a[0] ?? s.properties)) { if (!required.includes(k)) required.push(k); }
    else if (c.m === "partial") required = [];
  }
  if (s.properties) { s.required = required; if (!required.length) delete s.required; }
  return { schema: s, optional };
}

// Peels converter calls such as xp().parse(rd(SCHEMA, opts)) down to the zod schema.
function peel(chunks, value) {
  let v = value;
  for (let i = 0; i < 4 && isStub(v); i++) {
    const d = v[NODE];
    const parse = d.chain.find(c => c.m === "parse");
    if (parse && d.chain.length === 1) { v = parse.args[0]; continue; }
    if (!d.chain.length && isStub(d.args?.[0]) && zodClassOf(chunks, d.file, d.callee) == null) { v = d.args[0]; continue; }
    break;
  }
  return v;
}

// Top-level parameters of a JSON-Schema-like object as table rows.
export function parameterRows(schema) {
  const typeOf = s => {
    if (!s || typeof s !== "object") return "";
    if (Array.isArray(s.enum)) return s.enum.map(x => JSON.stringify(x)).join(" | ");
    if ("const" in s) return JSON.stringify(s.const);
    if (Array.isArray(s.anyOf)) return s.anyOf.map(typeOf).filter(Boolean).join(" or ");
    if (s.type === "array") return `array of ${typeOf(s.items) || "any"}`;
    return Array.isArray(s.type) ? s.type.join(" or ") : s.type ?? "any";
  };
  const variants = Array.isArray(schema?.anyOf) ? schema.anyOf : [schema];
  const rows = [];
  for (const variant of variants) {
    for (const [name, s] of Object.entries(variant?.properties ?? {})) {
      rows.push({ name, required: (variant.required ?? []).includes(name), type: typeOf(s), description: s?.description ?? "" });
    }
  }
  return rows;
}

// ---- one definition ----------------------------------------------------------------------------

function evalString(chunks, file, expr) {
  try {
    const r = chunks.evaluate(file, expr, { shared: false });
    const stubs = r.stubs;
    if (typeof r.value !== "string") return { ok: false, why: `evaluates to ${typeof r.value}` };
    if (stubs.length || r.touched.length || /\[stub /.test(r.value)) return { ok: false, why: `depends on run-time values (${[...new Set([...stubs, ...r.touched])].join(", ")})` };
    return { ok: true, text: r.value };
  } catch (error) { return { ok: false, why: error.message.slice(0, 160) }; }
}

// A description assembled at run time: the template literals (and `+` concatenations) with
// every part that is not static data replaced by <…>.
export function templateOf(chunks, file, expr) {
  let source = expr.trim();
  for (let i = 0; i < 3 && /^[\w$]+$/.test(source); i++) {
    const defs = chunks.definitions(file, source);
    if (defs.length !== 1) break;
    source = defs[0].source.slice(1, -1).trim();
  }
  const parts = [];
  for (let i = 0; i < source.length;) {
    const end = scanCode(source, i, null, null, "+");
    parts.push(source.slice(i, end).trim());
    if (source[end] !== "+") break;
    i = end + 1;
  }
  let out = "";
  for (const part of parts) {
    const s = evalString(chunks, file, part);
    if (s.ok) { out += s.text; continue; }
    if (!part.startsWith("`") || scanCode(part, 0, null, null) !== part.length) { out += "<…>"; continue; }
    for (let i = 1; i < part.length - 1;) {
      if (part[i] === "\\") { out += vm.runInNewContext(`\`${part.slice(i, i + 2)}\``); i += 2; continue; }
      if (part[i] === "$" && part[i + 1] === "{") {
        const end = scanCode(part, i + 2, "}", null);
        const inner = evalString(chunks, file, part.slice(i + 2, end));
        out += inner.ok ? inner.text : "<…>";
        i = end + 1;
        continue;
      }
      out += part[i++];
    }
  }
  return out.replace(/(?:<…>\s*){2,}/g, "<…> ");
}

function safeTemplate(chunks, file, expr) {
  try { return templateOf(chunks, file, expr); } catch { return null; }
}

// Evaluates one located definition. Labels:
//   exact        JSON-literal schema evaluated with nothing but data definitions
//   evaluated    produced by running the app's own schema code (zod + toJSONSchema)
//   approximate  zod builders recorded by proxies and converted here; a parameter list only
export function evaluateDefinition(chunks, file, def) {
  const name = evalString(chunks, file, def.props.name);
  if (!name.ok || !/^[A-Za-z][A-Za-z0-9_]*$/.test(name.text)) return null;
  const description = evalString(chunks, file, def.props.description);
  const out = {
    name: name.text,
    description: description.ok ? { label: "exact", text: description.text } : { label: "template", text: safeTemplate(chunks, file, def.props.description), why: description.why },
    parameters: null
  };
  const expr = def.mapper
    ? `(${def.mapper})({name:${def.props.name},description:"",${def.schemaKey}:(${def.props[def.schemaKey]})}).inputSchema`
    : def.props[def.schemaKey];
  let real = null;
  try { real = chunks.evaluate(file, expr, { shared: true }); } catch (error) { real = { error }; }
  let approx = null;
  const approximate = () => {
    if (approx) return approx;
    try {
      const r = chunks.evaluate(file, expr, { shared: false });
      approx = symbolic(chunks, peel(chunks, r.value)).schema;
    } catch { approx = null; }
    return approx;
  };
  const stubs = real.error ? [] : [...new Set([...real.stubs, ...real.touched].map(x => x.replace(/^(?:opaque|circular):/, "")))].sort();
  if (!real.error && real.value && typeof real.value === "object" && !hasStub(real.value)) {
    const schema = plain(real.value);
    if (!stubs.length && real.log.every(x => x.kind === "data") && isData(`(${expr})`)) out.parameters = { label: "exact", schema };
    else {
      // Cross-check parameter names and required flags against the proxy reading.
      const check = approximate();
      const names = s => JSON.stringify(parameterRows(s).map(r => [r.name, r.required]).sort());
      if (!check || !parameterRows(check).length || names(check) === names(schema)) out.parameters = { label: "evaluated", schema, stubs };
      else out.mismatch = true;
    }
  }
  if (!out.parameters) {
    const schema = approximate();
    const why = real.error ? real.error.message.slice(0, 160) : out.mismatch ? "evaluated parameters disagree with the proxy reading" : `depends on run-time values (${stubs.join(", ")})`;
    out.parameters = schema ? { label: "approximate", rows: parameterRows(schema), why } : { label: "not recovered", why };
  }
  return out;
}

// ---- publishing hygiene --------------------------------------------------------------------------

// Replaces key-like tokens: client-…/sk-… tokens and long base62 or hex runs that are not
// SHA-256 values this extractor computed.
export function dropKeyLikeTokens(text, { ownHashes = new Set() } = {}) {
  let dropped = 0;
  const out = text.replace(/\b(?:client|sk)-(?=[A-Za-z_-]*[0-9])[A-Za-z0-9_-]{8,}|(?<![A-Za-z0-9])(?=[A-Za-z0-9]*[0-9])(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{32,}(?![A-Za-z0-9])/g, token => {
    if (ownHashes.has(token)) return token;
    dropped++;
    return "<redacted>";
  });
  return { text: out, dropped };
}
