// Numbers in narrative prose come from the data, never from typed text, so they can't go
// stale when a refresh changes the records. Pages write tokens; the build fills them in:
//
//   {{count:settings kind=setting documented=null}}   records in outputs/settings.json
//                                                      matching every filter
//   {{distinct:slash-commands details.name}}          distinct values of a path among the
//                                                      records (filters allowed after it)
//   {{value:capture-summary cli.tools}}               a value from outputs/<file>.json
//   {{value:capture-summary betas_shared as=code}}    a list as `a`, `b`, and `c`
//
// Filters are dotted paths into a record (kind, group, documented, details.hidden, ...)
// compared with a literal: `true`, `false`, `null`, `*` (present and non-empty), a number,
// a word, or a glob such as `*.*` (use quotes for spaces: group="Safe env keys").
// `path!=value` negates a filter. A value renders a number with separators, a list joined
// with commas (`as=code` or `as=list` for "a, b, and c"; an empty list is "none"), and
// `as=raw` prints a number without separators. An unknown file, path, or malformed token
// fails the build.
import { readFileSync } from "node:fs";
import path from "node:path";

const token = /\{\{(count|distinct|value):([a-z0-9-]+)((?:\s+[^\s}]+(?:="[^"]*")?)*)\s*\}\}/g;

function at(object, dotted) {
  return dotted.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
}

function matches(actual, expected) {
  if (expected === "*") return actual !== undefined && actual !== null && actual !== "" && !(Array.isArray(actual) && !actual.length);
  if (expected === "null") return actual === undefined || actual === null;
  if (expected === "true" || expected === "false") return actual === (expected === "true");
  if (/^-?\d+(\.\d+)?$/.test(expected)) return actual === Number(expected);
  if (expected.includes("*")) {
    const glob = new RegExp(`^${expected.split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "s");
    return typeof actual === "string" && glob.test(actual);
  }
  return String(actual) === expected;
}

function format(value, as) {
  if (typeof value === "number") return as === "raw" ? String(value) : value.toLocaleString("en-US");
  if (Array.isArray(value)) {
    const parts = value.map(v => (as === "code" ? `\`${format(v)}\`` : format(v)));
    if (!as) return parts.join(", ");
    if (!parts.length) return "none";
    return parts.length < 3 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
  }
  if (value === undefined || value === null || typeof value === "object") throw new Error("not a printable value");
  return as === "code" ? `\`${value}\`` : String(value);
}

export function expandFacts(markdown, sourceRoot, where) {
  const files = new Map();
  const load = name => {
    if (!files.has(name)) {
      try { files.set(name, JSON.parse(readFileSync(path.join(sourceRoot, "outputs", `${name}.json`), "utf8"))); }
      catch (error) { throw new Error(`${where}: {{…:${name}}} needs outputs/${name}.json (${error.message})`); }
    }
    return files.get(name);
  };
  return markdown.replace(token, (whole, kind, name, rest) => {
    const args = [...rest.matchAll(/([^\s=]+)(?:=(?:"([^"]*)"|(\S+)))?/g)].map(m => {
      const negate = m[1].endsWith("!");
      return { key: negate ? m[1].slice(0, -1) : m[1], value: m[2] ?? m[3], negate };
    });
    const data = load(name);
    if (kind === "value") {
      const [target, ...options] = args;
      const as = options.find(o => o.key === "as")?.value;
      if (!target || target.value !== undefined || options.length > 1 || options.some(o => o.key !== "as" || !["code", "list", "raw"].includes(o.value))) {
        throw new Error(`${where}: ${whole} needs exactly one path and at most one as=code, as=list or as=raw`);
      }
      const value = at(data, target.key);
      if (value === undefined) throw new Error(`${where}: ${whole}: ${target.key} is not in outputs/${name}.json`);
      try { return format(value, as); } catch (error) { throw new Error(`${where}: ${whole}: ${error.message}`); }
    }
    if (!Array.isArray(data.items)) throw new Error(`${where}: ${whole}: outputs/${name}.json has no items`);
    const field = kind === "distinct" ? args.shift() : null;
    if (kind === "distinct" && (!field || field.value !== undefined)) throw new Error(`${where}: ${whole} needs a path before its filters`);
    if (args.some(a => a.value === undefined)) throw new Error(`${where}: ${whole}: filters are path=value`);
    const selected = data.items.filter(item => args.every(a => matches(at(item, a.key), a.value) !== a.negate));
    if (!field) return format(selected.length);
    const values = selected.map(item => at(item, field.key)).filter(v => v !== undefined && v !== null);
    if (!values.length) throw new Error(`${where}: ${whole}: no record has ${field.key}`);
    return format(new Set(values.map(v => JSON.stringify(v))).size);
  });
}
