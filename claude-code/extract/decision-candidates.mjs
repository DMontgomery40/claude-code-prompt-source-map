// Finds decision points: functions that read several knobs (env vars, settings keys, CLI
// option properties, remote flags) and so likely resolve one value from many sources.
//   node --max-old-space-size=8192 extract/decision-candidates.mjs
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import * as walk from "acorn-walk";
import { parse } from "./lib.mjs";

const root = new URL("../", import.meta.url).pathname;
const readJson = f => JSON.parse(readFileSync(`${root}${f}`, "utf8"));

export const flagProperty = flag => (flag.match(/--([a-z0-9-]+)/)?.[1] ?? "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
export function isFlagRead(name, args) {
  const def = args[1];
  return Boolean(def) && (def.type === "Literal" || def.type === "UnaryExpression" || def.type === "ArrayExpression" || (def.type === "ObjectExpression" && (!def.properties.length || /_config$/.test(name))));
}
const distinctive = k => /[a-z][A-Z].*[A-Z]/.test(k) || k.length >= 14;

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const env = new Map(readJson("outputs/environment-variables.json").items.filter(i => i.details.direction === "read" && !i.title.includes("*")).map(i => [i.title, i.id]));
  const settings = new Map(readJson("outputs/settings.json").items.filter(i => i.kind === "setting").map(i => [i.details.path.split(".").at(-1), i.id]).filter(([k]) => distinctive(k)));
  const flags = new Map(readJson("outputs/cli.json").items.filter(i => i.kind === "cli-flag").map(i => [flagProperty(i.title), i.id]).filter(([k]) => k && distinctive(k) && !settings.has(k)));
  const isFn = n => /Function/.test(n.type);
  const found = new Map();
  const dir = `${root}work/extracted/`;
  for (const file of readdirSync(dir).filter(f => f.endsWith(".js"))) {
    const src = readFileSync(dir + file, "utf8");
    if (!/process\.env|tengu_|[A-Z]{3,}_[A-Z]{3,}/.test(src)) continue;
    let ast; try { ast = parse(src); } catch { continue; }
    const hit = (anc, kind, name, record) => {
      const fn = [...anc].reverse().find(isFn);
      if (!fn || fn.end - fn.start > 12000) return;
      const id = `${file}:${fn.start}`;
      const c = found.get(id) ?? found.set(id, { id, file, start: fn.start, end: fn.end, name: fn.id?.name ?? null, knobs: new Map() }).get(id);
      c.knobs.set(`${kind}:${name}`, { kind, name, record });
    };
    walk.ancestor(ast, {
      MemberExpression(n, _, anc) {
        const name = n.computed ? (typeof n.property.value === "string" ? n.property.value : null) : n.property.name;
        if (!name) return;
        if (env.has(name)) hit(anc, "env", name, env.get(name));
        else if (settings.has(name)) hit(anc, "setting", name, settings.get(name));
        else if (flags.has(name)) hit(anc, "flag", name, flags.get(name));
      },
      Literal(n, _, anc) {
        if (typeof n.value !== "string") return;
        const parent = anc[anc.length - 2];
        if (parent?.type !== "CallExpression" || parent.arguments[0] !== n) return;
        if (/^tengu_[a-z0-9_]+$/.test(n.value) && isFlagRead(n.value, parent.arguments)) hit(anc, "remote", n.value, null);
        else if (env.has(n.value)) hit(anc, "env", n.value, env.get(n.value));
      }
    });
  }
  const out = [...found.values()].map(c => ({ ...c, knobs: [...c.knobs.values()], kinds: [...new Set([...c.knobs.values()].map(k => k.kind))] }))
    .filter(c => c.knobs.length >= 3 || c.kinds.length >= 2)
    .sort((a, b) => b.kinds.length - a.kinds.length || b.knobs.length - a.knobs.length);
  writeFileSync(`${root}work/decision-candidates.json`, JSON.stringify(out, null, 1));
  console.log(`${out.length} candidate decision functions`);
}
