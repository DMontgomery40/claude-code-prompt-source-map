import vm from "node:vm";

// A small lexer for minified JavaScript. It only needs to know where string,
// template and regex literals and comments are, so that brace matching and
// literal lookup are not fooled by prompt text such as `{threadId="..."}`.

const REGEX_AFTER_PUNCT = new Set([..."(,=:[!&|?{};+-*%<>~^}"]);
const REGEX_AFTER_WORD = new Set([
  "return", "typeof", "case", "do", "else", "in", "of", "new", "delete",
  "void", "throw", "instanceof", "yield", "await"
]);

const isIdentStart = c => /[A-Za-z_$#]/.test(c) || c.charCodeAt(0) > 127;
const isIdentPart = c => /[A-Za-z0-9_$]/.test(c) || c.charCodeAt(0) > 127;

function skipString(src, i) {
  const quote = src[i];
  for (let j = i + 1; j < src.length; j++) {
    if (src[j] === "\\") j++;
    else if (src[j] === quote) return j + 1;
  }
  throw new Error(`unterminated string at ${i}`);
}

function skipRegex(src, i) {
  let inClass = false;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === "\\") j++;
    else if (c === "\n") throw new Error(`unterminated regex at ${i}`);
    else if (inClass) inClass = c !== "]";
    else if (c === "[") inClass = true;
    else if (c === "/") {
      j++;
      while (j < src.length && /[a-z]/.test(src[j])) j++;
      return j;
    }
  }
  throw new Error(`unterminated regex at ${i}`);
}

function scanTemplate(src, i, out) {
  const start = i;
  let substitutions = 0;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (c === "\\") j++;
    else if (c === "`") {
      out?.push({ start, end: j + 1, kind: "template", substitutions });
      return j + 1;
    } else if (c === "$" && src[j + 1] === "{") {
      substitutions += 1;
      j = scanCode(src, j + 2, "}", out);
    }
  }
  throw new Error(`unterminated template at ${start}`);
}

// Scans code from `i` until an unmatched `closer` (or end of input when
// `closer` is null). Returns the closer's index. Literals are appended to `out`.
// With `stopAt`, also stops at any of those characters at depth zero and at
// any unmatched closing bracket.
export function scanCode(src, i, closer, out, stopAt = "") {
  const depth = [];
  let prev = "";
  let word = "";
  if (i === 0 && src.startsWith("#!")) i = src.indexOf("\n");
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      const end = skipString(src, i);
      out?.push({ start: i, end, kind: "string", substitutions: 0 });
      i = end; prev = "a"; word = "";
    } else if (c === "`") {
      i = scanTemplate(src, i, out); prev = "a"; word = "";
    } else if (c === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      i = end < 0 ? src.length : end;
    } else if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end < 0) throw new Error(`unterminated comment at ${i}`);
      i = end + 2;
    } else if (c === "/") {
      if (prev === "" || REGEX_AFTER_PUNCT.has(prev) || REGEX_AFTER_WORD.has(word)) {
        i = skipRegex(src, i); prev = "a";
      } else {
        prev = "/"; i++;
      }
      word = "";
    } else if (c === "(" || c === "[" || c === "{") {
      depth.push(c); prev = c; word = ""; i++;
    } else if (!depth.length && stopAt.includes(c)) {
      return i;
    } else if (c === ")" || c === "]" || c === "}") {
      if (!depth.length) {
        if (c === closer || stopAt) return i;
        throw new Error(`unbalanced ${c} at ${i}`);
      }
      depth.pop(); prev = c; word = ""; i++;
    } else if (c === " " || c === "\n" || c === "\t" || c === "\r") {
      i++;
    } else if (isIdentStart(c)) {
      let j = i + 1;
      while (j < src.length && isIdentPart(src[j])) j++;
      word = src.slice(i, j); prev = "a"; i = j;
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1]))) {
      let j = i + 1;
      while (j < src.length && (/[0-9A-Za-z_.]/.test(src[j]) || (/[+-]/.test(src[j]) && /[eE]/.test(src[j - 1]) && !/^0[xX]/.test(src.slice(i, j))))) j++;
      prev = "a"; word = ""; i = j;
    } else {
      prev = c; word = ""; i++;
    }
  }
  if (closer) throw new Error(`missing ${closer}`);
  return i;
}

const scanCache = new Map();
// All string/template literal spans in a source file, sorted by start, plus
// the outermost spans alone (non-overlapping) for fast containment checks.
export function literalsOf(src) {
  if (scanCache.has(src)) return scanCache.get(src);
  const all = [];
  scanCode(src, 0, null, all);
  all.sort((a, b) => a.start - b.start);
  const outer = [];
  for (const literal of all) if (!outer.length || literal.start >= outer.at(-1).end) outer.push(literal);
  const result = Object.assign(all, { outer });
  scanCache.set(src, result);
  return result;
}

// True when `index` falls inside any literal (including template substitutions).
export function insideLiteral(src, index) {
  const { outer } = literalsOf(src);
  let lo = 0;
  let hi = outer.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (outer[mid].end <= index) lo = mid + 1;
    else if (outer[mid].start > index) hi = mid - 1;
    else return outer[mid].start < index;
  }
  return false;
}

export function innermostLiteral(literals, index) {
  let best = null;
  for (const literal of literals) {
    if (literal.start > index) break;
    if (literal.end > index && (!best || literal.end - literal.start < best.end - best.start)) best = literal;
  }
  return best;
}

// Decodes a literal with no substitutions. Template literals without `${}`
// are pure data, so evaluating one in an empty context runs no code.
export function decodeLiteral(src, literal) {
  if (literal.substitutions) throw new Error(`literal at ${literal.start} has substitutions`);
  return vm.runInNewContext(src.slice(literal.start, literal.end), Object.create(null), { timeout: 1000 });
}

// The name a literal is assigned to, e.g. `KMn` in `KMn=\`...\`` or `oNn` in
// `oNn=$().refine(...).catch(\`...\`)`. Returns null when not recognisable.
export function declaratorName(src, literal) {
  const window = src.slice(Math.max(0, literal.start - 400), literal.start);
  const re = /(?:^|[,;{}\s(])([A-Za-z_$][\w$]*)=(?![=>])/g;
  let name = null;
  for (const match of window.matchAll(re)) {
    const between = window.slice(match.index + match[0].length);
    let parens = 0;
    let ok = true;
    for (const c of between) {
      if (c === "(") parens++;
      else if (c === ")") parens--;
      else if (c === "," && parens === 0) ok = false;
      if (parens < 0) ok = false;
    }
    if (ok) name = match[1];
  }
  return name;
}

const CONTROL_WORDS = new Set(["if", "for", "while", "switch", "catch", "with", "return", "typeof"]);

// Finds the innermost named function or method (`function f(`, `f(`, `#f(`)
// whose body contains `index`. Returns its source and name.
export function enclosingFunction(src, index) {
  const windowStart = Math.max(0, index - 200_000);
  const head = src.slice(windowStart, index);
  const re = /(function\s*([\w$]*)\s*\(|(?:^|[;,{}\s])(#?[A-Za-z_$][\w$]*)\()/g;
  const candidates = [...head.matchAll(re)].reverse();
  for (const match of candidates) {
    const headerStart = windowStart + match.index + (match[0].startsWith("function") ? 0 : match[0].length - (match[3].length + 1));
    const open = windowStart + match.index + match[0].length - 1;
    if (insideLiteral(src, open) || CONTROL_WORDS.has(match[3])) continue;
    let close;
    try {
      close = scanCode(src, open + 1, ")", null);
    } catch {
      continue;
    }
    if (src[close + 1] !== "{") continue;
    let bodyEnd;
    try {
      bodyEnd = scanCode(src, close + 2, "}", null);
    } catch {
      continue;
    }
    if (bodyEnd < index) continue;
    const name = match[2] ?? match[3];
    const params = src.slice(open, close + 1);
    const body = src.slice(close + 1, bodyEnd + 1);
    return { name, params, start: headerStart, end: bodyEnd + 1, source: `function${params}${body}` };
  }
  throw new Error(`no enclosing function found for index ${index}`);
}

// Candidate definitions of a free identifier: `function NAME(...){...}` and
// `NAME=<expr>` (declarators, and bare assignments inside lazy-init closures).
function definitionsOf(src, name) {
  const escaped = name.replace(/\$/g, "\\$");
  const found = [];
  const inLiteral = at => insideLiteral(src, at);
  for (const match of src.matchAll(new RegExp(`function\\s+${escaped}\\s*\\(`, "g"))) {
    if (inLiteral(match.index)) continue;
    const open = match.index + match[0].length - 1;
    const close = scanCode(src, open + 1, ")", null);
    const bodyEnd = scanCode(src, close + 2, "}", null);
    found.push({ kind: "function", source: `(${src.slice(match.index, bodyEnd + 1)})` });
  }
  for (const match of src.matchAll(new RegExp(`(?<![\\w$.#])${escaped}=(?![=>])`, "g"))) {
    if (inLiteral(match.index)) continue;
    const start = match.index + match[0].length;
    const end = expressionEnd(src, start);
    found.push({ kind: "value", source: `(${src.slice(start, end)})` });
  }
  return found;
}

// End of an assignment expression: the first top-level `,` or `;`, or an
// unmatched closing bracket.
function expressionEnd(src, start) {
  return scanCode(src, start, null, null, ",;");
}

const sameValue = (a, b) =>
  typeof a === "function" && typeof b === "function"
    ? a.toString() === b.toString()
    : JSON.stringify(a) === JSON.stringify(b) && typeof a === typeof b;

// Evaluates `fnSource` in an isolated context and calls it with `args`.
// Free identifiers are resolved on demand from their definitions in `src`;
// a name with no definition, or with conflicting definitions, is an error.
export function callExtracted(src, fnSource, args, { label } = {}) {
  const context = vm.createContext(Object.create(null));
  const resolved = [];
  const resolve = (name, chain) => {
    if (chain.includes(name)) throw new Error(`${label}: circular definition of ${name}`);
    const definitions = definitionsOf(src, name);
    if (!definitions.length) throw new Error(`${label}: free identifier ${name} has no definition in the source file`);
    const values = definitions.map(definition => withResolution(() => vm.runInContext(definition.source, context, { timeout: 1000 }), [...chain, name]));
    if (!values.every(value => sameValue(value, values[0]))) {
      throw new Error(`${label}: free identifier ${name} has ${definitions.length} conflicting definitions`);
    }
    context[name] = values[0];
    resolved.push(name);
  };
  const withResolution = (thunk, chain) => {
    for (let attempt = 0; attempt < 64; attempt++) {
      try {
        return thunk();
      } catch (error) {
        const missing = error?.name === "ReferenceError" && /^(.+) is not defined$/.exec(error.message);
        if (!missing) throw error;
        resolve(missing[1], chain);
      }
    }
    throw new Error(`${label}: too many unresolved identifiers`);
  };
  const fn = vm.runInContext(`(${fnSource})`, context, { timeout: 1000 });
  context.__args = args;
  const result = withResolution(() => vm.runInContext("__fn(...__args)", Object.assign(context, { __fn: fn }), { timeout: 1000 }), []);
  if (typeof result !== "string") throw new Error(`${label}: extracted function returned ${typeof result}, not text`);
  return { text: result, resolved };
}
