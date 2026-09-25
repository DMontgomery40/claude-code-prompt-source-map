// Static interpreter for the minified zod schemas embedded in Claude Code.
// It never executes bundle code: it walks acorn ASTs, follows identifiers across
// chunks, and turns zod builder chains into plain JSON descriptors.
import * as walk from "acorn-walk";
import { source, parse, files } from "./lib.mjs";

// Zod chunks are found by content: a chunk that declares the Zod classes ($constructor("ZodString", …)).
// Each export is mapped to the builder it is by the Zod class it constructs, so the minified export
// names and the chunk name can change freely between releases.
const CLASS = {
  ZodString: "string", ZodNumber: "number", ZodBoolean: "boolean", ZodUndefined: "undefined", ZodNull: "null", ZodUnknown: "unknown", ZodNever: "never",
  ZodArray: "array", ZodObject: "object", ZodUnion: "union", ZodDiscriminatedUnion: "discriminatedUnion", ZodRecord: "record", ZodEnum: "enum",
  ZodLiteral: "literal", ZodLazy: "lazy", ZodOptional: "optional", ZodCustom: "custom", ZodPreprocess: "preprocess",
};
function zodExports(m) {
  const classOf = new Map(); // local name -> "ZodXxx"
  for (const [name, d] of m.decls) {
    const init = d.init;
    if (init?.type === "CallExpression" && init.arguments[0]?.type === "Literal" && /^Zod\w+$/.test(init.arguments[0].value ?? "")) classOf.set(name, init.arguments[0].value);
  }
  if (![...classOf.values()].includes("ZodString")) return null;
  const classesIn = node => { const refs = []; walk.full(node, n => { if (n.type === "Identifier" && classOf.has(n.name)) refs.push(classOf.get(n.name)); }); return refs; };
  const out = {};
  for (const [exp, local] of m.exportsMap) {
    const d = m.decls.get(local);
    const fn = d?.type === "FunctionDeclaration" ? d : /Function/.test(d?.init?.type ?? "") ? d.init : null;
    if (!fn) continue;
    const src = m.src.slice(fn.start, fn.end);
    // coerce helpers take the class as a parameter: new e({type:"string",coerce:!0,…})
    const coerced = src.match(/\{type:"(string|number|boolean)",coerce:!0/);
    if (coerced) { out[exp] = `coerced${coerced[1][0].toUpperCase()}${coerced[1].slice(1)}`; continue; }
    let type = CLASS[classesIn(fn.body)[0]];
    if (!type) continue;
    if (type === "object" && /catchall:/.test(src)) {
      const cd = m.decls.get(src.match(/catchall:([\w$]+)\(\)/)?.[1]);
      const catchall = cd ? CLASS[classesIn(cd)[0]] : undefined;
      type = catchall === "never" ? "strictObject" : catchall === "unknown" ? "looseObject" : type;
    }
    if (type === "record" && /\._zod\.values=void 0/.test(src)) type = "partialRecord";
    out[exp] = type;
  }
  return Object.keys(out).length ? out : null;
}
const zodMaps = new Map();
function zodMap(file) {
  if (!zodMaps.has(file)) zodMaps.set(file, source(file).includes('"ZodString"') ? zodExports(mod(file)) : null);
  return zodMaps.get(file);
}

// Lexical bindings (function params, block-local consts) pushed while descending into factories.
function lookup(ctx, name) {
  for (let i = (ctx?.scopes?.length ?? 0) - 1; i >= 0; i--) if (ctx.scopes[i].has(name)) return ctx.scopes[i].get(name);
  return null;
}
function withScopes(ctx, scopes, fn) { const saved = ctx.scopes; ctx.scopes = scopes; try { return fn(); } finally { ctx.scopes = saved; } }
function bindFunction(ctx, m, fn, args, callerM) {
  const scope = new Map();
  const at = ctx.scopes ? ctx.scopes.slice() : [];
  fn.params.forEach((p, i) => {
    let id = p, dflt = null;
    if (p.type === "AssignmentPattern") { id = p.left; dflt = p.right; }
    if (id.type !== "Identifier") return;
    if (args && args[i]) scope.set(id.name, args[i].value !== undefined && !args[i].node ? args[i] : { m: callerM, node: args[i].node ?? args[i], scopes: at });
    else if (dflt) scope.set(id.name, { m, node: dflt, scopes: at });
  });
  if (fn.body.type === "BlockStatement") for (const st of fn.body.body) if (st.type === "VariableDeclaration") for (const d of st.declarations) {
    if (d.id.type === "Identifier" && d.init) scope.set(d.id.name, { m, node: d.init, scopes: null });
    // let {A: x, B: y} = factory(): bind x/y to the factory's returned object properties
    if (d.id.type === "ObjectPattern" && d.init?.type === "CallExpression" && d.init.callee.type === "Identifier") {
      const r = resolve(m, d.init.callee.name);
      let f = r?.node?.type === "FunctionDeclaration" ? r.node : r?.node?.init;
      if (f?.type === "CallExpression" && f.arguments[0]?.type === "ArrowFunctionExpression") f = f.arguments[0];
      if (!f?.body) continue;
      const ret = f.body.type === "BlockStatement" ? returnExpr(f.body) : f.body;
      if (ret?.type !== "ObjectExpression") continue;
      const inner = f.body.type === "BlockStatement" ? [bindFunction(ctx, r.m, f, [], r.m)] : [];
      for (const pp of d.id.properties) {
        const keyName = pp.key.name ?? pp.key.value;
        const prop = ret.properties.find(q => q.type === "Property" && (q.key.name ?? q.key.value) === keyName);
        if (prop && pp.value.type === "Identifier") scope.set(pp.value.name, { m: r.m, node: prop.value, scopes: inner, exportName: keyName });
      }
    }
  }
  return scope;
}

const modules = new Map();
export function mod(name) {
  if (modules.has(name)) return modules.get(name);
  const src = source(name);
  const ast = parse(src);
  const decls = new Map(); // top-level local name -> node (FunctionDeclaration | VariableDeclarator)
  const imports = new Map(); // local -> {file, name}
  const exportsMap = new Map(); // exported -> local
  for (const st of ast.body) {
    if (st.type === "ImportDeclaration") {
      const file = st.source.value.replace("/$bunfs/root/", "");
      for (const sp of st.specifiers) if (sp.type === "ImportSpecifier") imports.set(sp.local.name, { file, name: sp.imported.name });
    } else if (st.type === "FunctionDeclaration") decls.set(st.id.name, st);
    else if (st.type === "VariableDeclaration") for (const d of st.declarations) { if (d.id.type === "Identifier") decls.set(d.id.name, d); }
    else if (st.type === "ExportNamedDeclaration") {
      for (const sp of st.specifiers || []) exportsMap.set(sp.exported.name, sp.local.name);
      if (st.declaration?.type === "VariableDeclaration") for (const d of st.declaration.declarations) decls.set(d.id.name, d);
      if (st.declaration?.type === "FunctionDeclaration") decls.set(st.declaration.id.name, st.declaration);
    }
  }
  const m = { name, src, ast, decls, imports, exportsMap };
  modules.set(name, m);
  return m;
}

// Resolve an identifier to its declaration, following imports across chunks.
export function resolve(m, id, depth = 0) {
  if (depth > 12) return null;
  if (m.decls.has(id)) return { m, node: m.decls.get(id), name: id };
  const imp = m.imports.get(id);
  if (!imp || !files.has(imp.file)) return null;
  const zm = zodMap(imp.file);
  if (zm) return { zod: zm[imp.name] || `zod:${imp.name}` };
  const target = mod(imp.file);
  const local = target.exportsMap.get(imp.name) ?? imp.name;
  return resolve(target, local, depth + 1);
}

export function strValue(m, node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral") {
    let out = "";
    node.quasis.forEach((q, i) => {
      out += q.value.cooked;
      if (i < node.expressions.length) {
        const e = node.expressions[i];
        const v = constValue(m, e);
        const mj = typeof v === "string" || typeof v === "number" ? null : mapJoin(m, e);
        out += typeof v === "string" || typeof v === "number" ? String(v) : mj !== null ? mj : `{{expr:${m.src.slice(e.start, e.end)}}}`;
      }
    });
    return out;
  }
  if (node.type === "Identifier") { const v = constValue(m, node); return typeof v === "string" ? v : null; }
  if (node.type === "MemberExpression") { const v = constValue(m, node); return typeof v === "string" ? v : null; }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const l = strValue(m, node.left), r = strValue(m, node.right);
    if (l !== null && r !== null) return l + r;
    const side = n => strValue(m, n) ?? `{{expr:${m.src.slice(n.start, n.end)}}}`;
    return side(node.left) + side(node.right);
  }
  return null;
}

const NOTLIT = Symbol("notlit");
let currentCtx = null;
// Evaluate literal-only expressions (numbers, strings, booleans, arrays/objects of those).
export function constValue(m, node, depth = 0, ctx = currentCtx) {
  if (!node || depth > 8) return NOTLIT;
  if (node.type === "Identifier") {
    const b = lookup(ctx, node.name);
    if (b && "value" in b && !b.node) return b.value;
    if (b?.node) return constValue(b.m, b.node, depth + 1, ctx);
  }
  switch (node.type) {
    case "Literal": return node.regex ? NOTLIT : node.value;
    case "UnaryExpression":
      if (node.operator === "!" && node.argument.type === "Literal") return !node.argument.value;
      if (node.operator === "-" && node.argument.type === "Literal") return -node.argument.value;
      if (node.operator === "void") return undefined;
      return NOTLIT;
    case "TemplateLiteral": return node.expressions.length ? NOTLIT : node.quasis[0].value.cooked;
    case "ArrayExpression": {
      const out = [];
      for (const el of node.elements) {
        if (el?.type === "SpreadElement") { const v = constValue(m, el.argument, depth + 1); if (!Array.isArray(v)) return NOTLIT; out.push(...v); }
        else { const v = constValue(m, el, depth + 1); if (v === NOTLIT) return NOTLIT; out.push(v); }
      }
      return out;
    }
    case "ObjectExpression": {
      const out = {};
      for (const p of node.properties) {
        if (p.type !== "Property" || p.computed) return NOTLIT;
        const v = constValue(m, p.value, depth + 1); if (v === NOTLIT) return NOTLIT;
        out[p.key.name ?? p.key.value] = v;
      }
      return out;
    }
    case "MemberExpression": {
      if (node.computed && node.property.type !== "Literal") return NOTLIT;
      const obj = constObject(m, node.object, depth + 1);
      if (!obj) return NOTLIT;
      const key = node.computed ? node.property.value : node.property.name;
      const prop = obj.node.properties.find(p => p.type === "Property" && !p.computed && (p.key.name ?? p.key.value) === key);
      return prop ? constValue(obj.m, prop.value, depth + 1) : NOTLIT;
    }
    case "Identifier": {
      const r = resolve(m, node.name);
      if (!r || r.zod || r.node.type !== "VariableDeclarator" || !r.node.init) return NOTLIT;
      return constValue(r.m, r.node.init, depth + 1);
    }
    default: return NOTLIT;
  }
}
export const isLit = v => v !== NOTLIT;
// The string-literal node a description expression ultimately reads (for provenance).
export function literalSite(m, node, depth = 0) {
  if (!node || depth > 8) return null;
  if (node.type === "Literal" || node.type === "TemplateLiteral" || node.type === "BinaryExpression") return { m, node };
  if (node.type === "Identifier") {
    const r = resolve(m, node.name);
    return r?.node?.type === "VariableDeclarator" && r.node.init ? literalSite(r.m, r.node.init, depth + 1) : null;
  }
  if (node.type === "MemberExpression" && !node.computed) {
    const o = constObject(m, node.object, depth + 1);
    const prop = o?.node.properties.find(p => p.type === "Property" && !p.computed && (p.key.name ?? p.key.value) === node.property.name);
    return prop ? literalSite(o.m, prop.value, depth + 1) : null;
  }
  return null;
}

// Small evaluator for description templates over constant arrays:
// LIST.join(s), LIST.at(n), LIST.slice(a,b), LIST.map((x)=>`…${x}…`), [...LIST, "x"].
function evalArrayExpr(m, e, depth = 0) {
  if (!e || depth > 8) return NOTLIT;
  const v = constValue(m, e);
  if (isLit(v)) return v;
  if (e.type === "Identifier") {
    const r = resolve(m, e.name);
    return r?.node?.type === "VariableDeclarator" && r.node.init ? evalArrayExpr(r.m, r.node.init, depth + 1) : NOTLIT;
  }
  if (e.type === "ArrayExpression") {
    const out = [];
    for (const el of e.elements) {
      const x = el?.type === "SpreadElement" ? evalArrayExpr(m, el.argument, depth + 1) : evalArrayExpr(m, el, depth + 1);
      if (!isLit(x)) return NOTLIT;
      if (el.type === "SpreadElement") { if (!Array.isArray(x)) return NOTLIT; out.push(...x); } else out.push(x);
    }
    return out;
  }
  // Object.keys(<object literal>)
  if (e.type === "CallExpression" && e.callee.type === "MemberExpression" && e.callee.object.type === "Identifier" && e.callee.object.name === "Object" && e.callee.property.name === "keys" && !resolve(m, "Object")) {
    const o = constObject(m, e.arguments[0], depth + 1);
    if (!o || o.node.properties.some(p => p.type !== "Property" || p.computed)) return NOTLIT;
    return o.node.properties.map(p => p.key.name ?? p.key.value);
  }
  if (e.type !== "CallExpression" || e.callee.type !== "MemberExpression" || e.callee.computed) return NOTLIT;
  const meth = e.callee.property.name;
  const base = evalArrayExpr(m, e.callee.object, depth + 1);
  if (!Array.isArray(base)) return NOTLIT;
  const args = e.arguments.map(a => constValue(m, a));
  if (meth === "join" && (args.length === 0 || typeof args[0] === "string")) return base.join(args[0] ?? ",");
  if (meth === "at" && typeof args[0] === "number") return base.at(args[0]);
  if (meth === "slice" && args.every(a => typeof a === "number")) return base.slice(...args);
  if (meth === "map") {
    const fn = e.arguments[0];
    if (fn?.type !== "ArrowFunctionExpression" || fn.params.length !== 1 || fn.body.type !== "TemplateLiteral") return NOTLIT;
    const pn = fn.params[0].name;
    if (!fn.body.expressions.every(x => x.type === "Identifier" && x.name === pn)) return NOTLIT;
    return base.map(val => fn.body.quasis.map((q, i) => q.value.cooked + (i < fn.body.expressions.length ? String(val) : "")).join(""));
  }
  return NOTLIT;
}
function mapJoin(m, e) {
  const v = evalArrayExpr(m, e);
  return typeof v === "string" || typeof v === "number" ? String(v) : null;
}

// Module-level constants interpolated into a string expression and resolved statically:
// {minifiedName: value} for each identifier inside a resolved `${…}` / `+` operand.
export function constantsIn(m, node) {
  const out = {};
  if (!node) return out;
  const record = e => {
    const ok = isLit(constValue(m, e)) || mapJoin(m, e) !== null;
    if (!ok) return;
    const params = new Set(), skip = new Set();
    walk.full(e, n => { if (/Function/.test(n.type)) for (const p of n.params) if (p.type === "Identifier") params.add(p.name); });
    walk.simple(e, { MemberExpression(me) { if (!me.computed) skip.add(me.property); }, Property(pp) { if (!pp.computed) skip.add(pp.key); } });
    walk.full(e, n => {
      if (n.type !== "Identifier" || skip.has(n) || params.has(n.name) || n.name === "Object") return;
      const r = resolve(m, n.name);
      if (!r || r.zod || r.node.type !== "VariableDeclarator") return;
      const v = evalArrayExpr(m, n);
      if (isLit(v)) out[n.name] = v;
    });
  };
  const visit = n => {
    if (n.type === "TemplateLiteral") n.expressions.forEach(record);
    else if (n.type === "BinaryExpression" && n.operator === "+") for (const side of [n.left, n.right]) { if (side.type === "Literal" || side.type === "TemplateLiteral" || side.type === "BinaryExpression") visit(side); else record(side); }
  };
  visit(node);
  return out;
}

// Object literal behind an identifier / member chain (fields may be non-constant).
function constObject(m, node, depth) {
  if (depth > 8) return null;
  if (node.type === "ObjectExpression") return { m, node };
  if (node.type === "Identifier") {
    const r = resolve(m, node.name);
    if (!r || r.zod || r.node.type !== "VariableDeclarator" || !r.node.init) return null;
    return constObject(r.m, r.node.init, depth + 1);
  }
  if (node.type === "MemberExpression" && !node.computed) {
    const o = constObject(m, node.object, depth + 1);
    const prop = o?.node.properties.find(p => p.type === "Property" && !p.computed && (p.key.name ?? p.key.value) === node.property.name);
    return prop ? constObject(o.m, prop.value, depth + 1) : null;
  }
  return null;
}

// Context carries "special" callee handlers (e.g. the feature-module spreads) and a cycle stack.
export function describeSchema(m, node, ctx, depth = 0) {
  currentCtx = ctx;
  if (depth > 40) return { type: "ref", note: "depth limit" };
  if (!node) return { type: "unknown" };
  if (node.type === "ParenthesizedExpression") return describeSchema(m, node.expression, ctx, depth);
  if (node.type === "ArrowFunctionExpression" && node.params.length === 0) {
    if (node.body.type !== "BlockStatement") return describeSchema(m, node.body, ctx, depth + 1);
    const saved = ctx.scopes || [];
    ctx.scopes = [...saved, bindFunction(ctx, m, node, [], m)];
    try { return describeSchema(m, returnExpr(node.body), ctx, depth + 1); } finally { ctx.scopes = saved; }
  }
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && !node.callee.computed) {
    const method = node.callee.property.name;
    const base = describeSchema(m, node.callee.object, ctx, depth + 1);
    return applyMethod(m, base, method, node, ctx, depth);
  }
  if (node.type === "CallExpression" && node.callee.type === "Identifier") {
    const name = node.callee.name;
    const b = lookup(ctx, name);
    if (b?.node && /Function/.test(b.node.type)) return callFunction(b.m, b.node, node.arguments.map(a => ({ node: a })), m, ctx, depth, name);
    if (ctx.special?.[name]) return ctx.special[name](m, node, ctx, depth);
    const r = resolve(m, name);
    // memoizing lazy wrapper: p(() => schema)
    if (!r?.zod && node.arguments.length === 1 && node.arguments[0].type === "ArrowFunctionExpression" && node.arguments[0].params.length === 0) return describeSchema(m, node.arguments[0], ctx, depth + 1);
    if (r?.zod) return builder(m, r.zod, node, ctx, depth);
    if (r?.node) {
      const fnNode = r.node.type === "FunctionDeclaration" ? r.node : r.node.init?.type === "ArrowFunctionExpression" || r.node.init?.type === "FunctionExpression" ? r.node.init : null;
      if (fnNode && fnNode.params.length) return callFunction(r.m, fnNode, node.arguments.map(a => ({ node: a })), m, ctx, depth, r.name);
      return describeDecl(r.m, r.node, node, ctx, depth, r.name);
    }
    return { type: "unknown", note: `unresolved call ${name}` };
  }
  if (node.type === "Identifier") {
    const b = lookup(ctx, node.name);
    if (b?.node) return b.scopes ? withScopes(ctx, b.scopes, () => describeSchema(b.m, b.node, ctx, depth + 1)) : describeSchema(b.m, b.node, ctx, depth + 1);
    const r = resolve(m, node.name);
    if (r?.node?.type === "VariableDeclarator" && r.node.init) return describeSchema(r.m, r.node.init, ctx, depth + 1);
    return { type: "unknown", note: `unresolved identifier` };
  }
  if (node.type === "ConditionalExpression") {
    const a = describeSchema(m, node.consequent, ctx, depth + 1), b = describeSchema(m, node.alternate, ctx, depth + 1);
    return { type: "conditional", options: [a, b] };
  }
  return { type: "unknown", note: `node ${node.type}` };
}

function callFunction(m, fn, args, callerM, ctx, depth, name) {
  const key = `${m.name}:${fn.start}`;
  if (ctx.stack.filter(k => k === key).length > 1) return { type: "ref", ref: name, note: "recursive" };
  ctx.stack.push(key);
  const scope = bindFunction(ctx, m, fn, args, callerM);
  const saved = ctx.scopes || [];
  ctx.scopes = [...saved, scope];
  try {
    const body = fn.body.type === "BlockStatement" ? returnExpr(fn.body) : fn.body;
    return body ? describeSchema(m, body, ctx, depth + 1) : { type: "unknown", note: `no body for ${name}` };
  } finally { ctx.scopes = saved; ctx.stack.pop(); }
}

function returnExpr(block) {
  const ret = block.body.find(s => s.type === "ReturnStatement");
  return ret?.argument ?? null;
}

// A call to a locally declared schema factory (p(()=>X) memo, arrow, or function).
function describeDecl(m, decl, callNode, ctx, depth, name) {
  const key = `${m.name}:${decl.start}`;
  if (ctx.stack.includes(key)) return { type: "ref", ref: name, note: "recursive" };
  ctx.stack.push(key);
  try {
    let body = null;
    if (decl.type === "FunctionDeclaration") body = returnExpr(decl.body);
    else if (decl.init?.type === "ArrowFunctionExpression") body = decl.init.body.type === "BlockStatement" ? returnExpr(decl.init.body) : decl.init.body;
    else if (decl.init?.type === "CallExpression" && decl.init.arguments.length === 1 && decl.init.arguments[0].type === "ArrowFunctionExpression") {
      const a = decl.init.arguments[0];
      if (a.body.type === "BlockStatement") {
        const saved = ctx.scopes || [];
        ctx.scopes = [...saved, bindFunction(ctx, m, a, [], m)];
        try { return describeSchema(m, returnExpr(a.body), ctx, depth + 1); } finally { ctx.scopes = saved; }
      }
      body = a.body;
    } else if (decl.init) body = decl.init;
    if (!body) return { type: "unknown", note: `no body for ${name}` };
    return describeSchema(m, body, ctx, depth + 1);
  } finally { ctx.stack.pop(); }
}

export function objectShape(m, objNode, ctx, depth) {
  const props = {};
  for (const p of objNode.properties) {
    if (p.type === "SpreadElement") {
      const arg = p.argument;
      if (arg.type === "Literal" || arg.type === "UnaryExpression" || (arg.type === "ObjectExpression" && !arg.properties.length)) continue; // ...!1, ...{}
      if (arg.type === "ObjectExpression") { Object.assign(props, objectShape(m, arg, ctx, depth + 1)); continue; }
      if (arg.type === "CallExpression" && arg.callee.type === "Identifier" && ctx.spread?.[arg.callee.name]) { Object.assign(props, ctx.spread[arg.callee.name](m, arg, ctx, depth)); continue; }
      if (arg.type === "LogicalExpression" && arg.operator === "&&" && arg.right.type === "ObjectExpression") {
        const t = arg.left;
        const flag = t.type === "MemberExpression" && !t.computed && /^[A-Z0-9_]+$/.test(t.property.name) ? t.property.name : null;
        for (const [k, v] of Object.entries(objectShape(m, arg.right, ctx, depth + 1))) props[k] = { ...v, conditional: true, _condRange: [m.name, p.start, p.end], ...(flag ? { conditionFlag: flag } : {}) };
        continue;
      }
      if (arg.type === "ConditionalExpression") {
        for (const branch of [arg.consequent, arg.alternate]) if (branch.type === "ObjectExpression")
          for (const [k, v] of Object.entries(objectShape(m, branch, ctx, depth + 1))) props[k] = { ...v, conditional: true };
        continue;
      }
      props[`...${m.src.slice(arg.start, Math.min(arg.end, arg.start + 20))}`] = { type: "unknown", note: "unresolved spread", _range: [m.name, p.start, p.end] };
      continue;
    }
    const key = p.key.type === "Identifier" ? p.key.name : p.key.value;
    const d = describeSchema(m, p.value, ctx, depth + 1);
    d._range = [m.name, p.start, p.end];
    props[key] = d;
  }
  return props;
}

function builder(m, kind, node, ctx, depth) {
  const a = node.arguments;
  switch (kind) {
    case "string": case "number": case "boolean": case "undefined": case "null": case "unknown": case "never": return { type: kind };
    case "custom": return { type: "custom" };
    case "coercedString": return { type: "string", coerced: true };
    case "coercedNumber": return { type: "number", coerced: true };
    case "coercedBoolean": return { type: "boolean", coerced: true };
    case "array": return { type: "array", items: describeSchema(m, a[0], ctx, depth + 1) };
    case "object": case "strictObject": case "looseObject": {
      if (a[0]?.type !== "ObjectExpression") {
        const fe = fromEntries(m, a[0], ctx, depth);
        if (fe) return { type: "object", properties: fe, ...(kind === "strictObject" ? { strict: true } : {}) };
        return { type: "object", note: "shape not literal" };
      }
      const d = { type: "object", properties: objectShape(m, a[0], ctx, depth) };
      if (kind === "strictObject") d.strict = true;
      if (kind === "looseObject") d.passthrough = true;
      return d;
    }
    case "union": {
      return { type: "union", options: unionOptions(m, a[0], ctx, depth) };
    }
    case "discriminatedUnion": {
      return { type: "union", discriminator: strValue(m, a[0]), options: unionOptions(m, a[1], ctx, depth) };
    }
    case "record": case "partialRecord": {
      if (a.length >= 2 && a[1] && !(a[1].type === "ObjectExpression")) return { type: "record", keys: describeSchema(m, a[0], ctx, depth + 1), values: describeSchema(m, a[1], ctx, depth + 1) };
      return { type: "record", keys: { type: "string" }, values: describeSchema(m, a[0], ctx, depth + 1) };
    }
    case "enum": {
      let vals = null;
      if (a[0]?.type === "ArrayExpression") vals = enumValues(m, a[0], ctx);
      else { const v = constValue(m, a[0]); if (Array.isArray(v)) vals = v; else if (v && typeof v === "object") vals = Object.values(v); }
      return { type: "enum", values: vals ?? "unresolved" };
    }
    case "literal": { const v = constValue(m, a[0]); return { type: "literal", value: isLit(v) ? v : "unresolved" }; }
    case "lazy": return describeSchema(m, a[0], ctx, depth + 1);
    case "preprocess": return { ...describeSchema(m, a[1], ctx, depth + 1), preprocessed: true };
    case "optional": return { ...describeSchema(m, a[0], ctx, depth + 1), optional: true };
    default: return { type: "unknown", note: `zod builder ${kind}` };
  }
}

// u(Object.fromEntries(LIST.map((e)=>[e, SCHEMA]))): one property per constant list entry.
function fromEntries(m, node, ctx, depth) {
  if (node?.type !== "CallExpression" || node.callee.type !== "MemberExpression" || node.callee.property.name !== "fromEntries") return null;
  const mapCall = node.arguments[0];
  if (mapCall?.type !== "CallExpression" || mapCall.callee.type !== "MemberExpression" || mapCall.callee.property.name !== "map") return null;
  const list = constValue(m, mapCall.callee.object, 0, ctx);
  const fn = mapCall.arguments[0];
  if (!Array.isArray(list) || !fn || fn.body.type !== "ArrayExpression") return null;
  const props = {};
  for (const key of list) {
    const scope = new Map([[fn.params[0].name, { value: key }]]);
    const saved = ctx.scopes || [];
    ctx.scopes = [...saved, scope];
    try { props[key] = describeSchema(m, fn.body.elements[1], ctx, depth + 1); } finally { ctx.scopes = saved; }
  }
  return props;
}

// Union option lists may spread other arrays of schemas (...X or ...X()).
function unionOptions(m, arr, ctx, depth) {
  if (arr?.type === "Identifier") { const r = resolve(m, arr.name); if (r?.node?.init?.type === "ArrayExpression") return unionOptions(r.m, r.node.init, ctx, depth); }
  if (arr?.type !== "ArrayExpression") return [{ type: "unknown", note: "options not literal" }];
  const out = [];
  for (const e of arr.elements) {
    if (e.type !== "SpreadElement") { out.push(describeSchema(m, e, ctx, depth + 1)); continue; }
    let target = e.argument, tm = m;
    if (target.type === "CallExpression" && target.callee.type === "Identifier") {
      const r = resolve(m, target.callee.name);
      const fn = r?.node?.type === "FunctionDeclaration" ? r.node : r?.node?.init;
      const body = fn && (fn.body?.type === "BlockStatement" ? returnExpr(fn.body) : fn.body);
      if (body) { target = body; tm = r.m; }
    }
    out.push(...unionOptions(tm, target, ctx, depth));
  }
  return out;
}

function enumValues(m, arr, ctx) {
  const out = [];
  for (const el of arr.elements) {
    if (el.type === "SpreadElement") {
      const arg = el.argument;
      if (arg.type === "CallExpression" && arg.callee.type === "Identifier" && ctx.enumSpread?.[arg.callee.name]) { out.push(...ctx.enumSpread[arg.callee.name]()); continue; }
      const v = constValue(m, arg);
      if (Array.isArray(v)) out.push(...v); else out.push("{{unresolved}}");
    } else { const v = constValue(m, el); out.push(isLit(v) ? v : "{{unresolved}}"); }
  }
  return out;
}

function applyMethod(m, base, method, node, ctx, depth) {
  const a = node.arguments;
  const d = { ...base };
  const c = (d.constraints = { ...(base.constraints || {}) });
  switch (method) {
    case "describe": {
      const s = strValue(m, a[0]);
      d.description = s;
      d._descRange = [m.name, a[0].start, a[0].end];
      const k = constantsIn(m, a[0]);
      if (Object.keys(k).length) d._constants = k;
      break;
    }
    case "optional": d.optional = true; break;
    case "nullable": d.nullable = true; break;
    case "nullish": d.optional = true; d.nullable = true; break;
    case "default": case "prefault": {
      const v = constValue(m, a[0]);
      d.default = isLit(v) ? v : "computed default (not a literal)";
      break;
    }
    case "catch": d.invalidDropped = true; break;
    case "int": c.int = true; break;
    case "positive": c.positive = true; break;
    case "nonnegative": c.nonnegative = true; break;
    case "min": case "max": case "gte": case "lte": case "gt": case "lt": case "length": {
      const v = constValue(m, a[0]);
      c[method] = isLit(v) ? v : "non-literal";
      break;
    }
    case "url": case "email": case "regex": case "startsWith": case "endsWith": case "uuid": c[method] = true; break;
    case "passthrough": case "loose": d.passthrough = true; break;
    case "strict": d.strict = true; break;
    case "array": return { type: "array", items: base };
    case "or": return { type: "union", options: [base, describeSchema(m, a[0], ctx, depth + 1)] };
    case "extend": case "merge": {
      if (a[0]?.type === "ObjectExpression") d.properties = { ...(base.properties || {}), ...objectShape(m, a[0], ctx, depth) };
      else { const o2 = describeSchema(m, a[0], ctx, depth + 1); d.properties = { ...(base.properties || {}), ...(o2.properties || {}) }; }
      break;
    }
    case "and": {
      const o2 = describeSchema(m, a[0], ctx, depth + 1);
      return { type: "object", properties: { ...(base.properties || {}), ...(o2.properties || {}) }, intersection: true };
    }
    case "partial": d.partial = true; break;
    case "omit": case "pick": {
      const keys = constValue(m, a[0]);
      if (keys && typeof keys === "object" && d.properties) {
        const names = Array.isArray(keys) ? keys : Object.keys(keys);
        d.properties = Object.fromEntries(Object.entries(d.properties).filter(([k]) => method === "omit" ? !names.includes(k) : names.includes(k)));
      } else (d.methods ||= []).push(method);
      break;
    }
    case "refine": case "superRefine": case "check": case "transform": case "pipe": case "brand": case "readonly": case "strip": case "trim": case "toLowerCase": case "meta":
      d.validated = true; break;
    default: (d.methods ||= []).push(method);
  }
  if (!Object.keys(c).length) delete d.constraints;
  return d;
}
