#!/usr/bin/env node
// Reconstructs the Claude Code 2.1.280 main system prompt from the embedded JS chunks.
// Each section's text is read from its AST literal nodes (never retyped), composed the way the
// assembler composes it, checked against the two captured requests, and written to
// outputs/system-prompt.{json,md}. Declaration offsets are pinned to 2.1.280.
//
// usage (from the project root): node extract/system-prompt.mjs [--debug]
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { parse, source, provenance, files, VERSION, PLATFORM } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const DEBUG = process.argv.includes("--debug");
const MAIN = "chunk-dt8bvbsd.js";

// ---------------------------------------------------------------- chunk index
const cache = new Map();
function C(file) {
  if (cache.has(file)) return cache.get(file);
  const src = source(file), ast = parse(src);
  const decls = new Map(), imports = new Map(), exports = new Map();
  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") for (const s of node.specifiers) if (s.type === "ImportSpecifier") imports.set(s.local.name, { from: node.source.value.replace(/^(\.\/|\/\$bunfs\/root\/)/, ""), name: s.imported.name ?? s.imported.value });
    if (node.type === "ExportNamedDeclaration" && !node.declaration) for (const s of node.specifiers) exports.set(s.exported.name ?? s.exported.value, s.local.name);
  }
  walk.full(ast, n => {
    if (n.type === "FunctionDeclaration" && n.id && !decls.has(n.id.name)) decls.set(n.id.name, n);
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier" && n.init && !decls.has(n.id.name)) decls.set(n.id.name, n);
  });
  const c = { file, src, ast, decls, imports, exports };
  cache.set(file, c);
  return c;
}
function where(file, name, depth = 0) {
  const c = C(file), imp = c.imports.get(name);
  if (!imp || depth > 12) return { file, name };
  const t = C(imp.from);
  return where(imp.from, t.exports.get(imp.name) ?? imp.name, depth + 1);
}
// Declaration node of `name` as seen from `file`; `pin` is the expected 2.1.280 char offset.
function decl(file, name, pin) {
  const w = where(file, name), n = C(w.file).decls.get(w.name);
  if (!n) throw new Error(`no declaration for ${name} (from ${file})`);
  if (pin !== undefined && n.start !== pin) throw new Error(`pin mismatch ${w.file}:${w.name} at ${n.start}, expected ${pin}`);
  return { file: w.file, name: w.name, node: n };
}
const isStr = n => (n.type === "Literal" && typeof n.value === "string") || n.type === "TemplateLiteral";
function literals(node) {
  const out = [];
  walk.full(node, n => { if (isStr(n)) out.push(n); });
  return out.sort((a, b) => a.start - b.start);
}
const shape = n => (n.type === "Literal" ? n.value : n.quasis.map(q => q.value.cooked).join("\u0000"));

// ---------------------------------------------------------------- pieces
// A piece is one literal node; text() renders it, substituting template expressions.
class Piece {
  constructor(file, node) { this.file = file; this.node = node; }
  text(subst = {}, provs) { return render(this.file, this.node, subst, provs); }
  prov(role = "source") { return prov(this.file, this.node, role); }
}
function prov(file, node, role = "source") { return { ...provenance(file, C(file).src, node.start, node.end), role }; }
const inlined = p => ({ ...p, role: "inlined" });
// Fills recorded while an item's text is rendered; add() moves them into the item's details.
// constants: module-level string constants inlined by name; slots: every other template slot fill, keyed by binary offset.
let PENDING = { constants: {}, slots: [] };
const constExprs = new WeakSet();
const binOff = (file, pos) => files.get(file).file_offset + Buffer.byteLength(C(file).src.slice(0, pos));
// The literal inside declaration `name` whose text starts with (or equals, or includes) `needle`.
function lit(file, name, needle, { pin, mode = "start", nth = 0 } = {}) {
  const d = decl(file, name, pin);
  const body = d.node.type === "VariableDeclarator" ? d.node.init : d.node;
  const hits = literals(body).filter(n => {
    const s = shape(n);
    return needle === undefined ? true : mode === "start" ? s.startsWith(needle) : mode === "eq" ? s === needle : s.includes(needle);
  });
  if (!hits[nth]) throw new Error(`literal not found in ${d.file}:${d.name}: ${JSON.stringify(needle)}`);
  return new Piece(d.file, hits[nth]);
}
// The whole initializer of a string/array constant.
function constNode(file, name, pin) {
  const d = decl(file, name, pin);
  return { file: d.file, node: d.node.type === "VariableDeclarator" ? d.node.init : d.node };
}
function render(file, node, subst = {}, provs) {
  if (node.type === "Literal") return String(node.value);
  if (node.type === "TemplateLiteral") {
    let s = "";
    node.quasis.forEach((q, i) => {
      s += q.value.cooked;
      if (i < node.expressions.length) {
        const e = node.expressions[i], v = evalExpr(file, e, subst, provs);
        if (!constExprs.has(e)) PENDING.slots.push({ at: binOff(file, e.start), value: v });
        s += v;
      }
    });
    return s;
  }
  return evalExpr(file, node, subst, provs);
}
function evalExpr(file, e, subst, provs) {
  const raw = C(file).src.slice(e.start, e.end);
  if (Object.hasOwn(subst, raw)) {
    const v = subst[raw];
    if (v === "@cons") return render(file, e.consequent, subst, provs);
    if (v === "@alt") return render(file, e.alternate, subst, provs);
    if (typeof v === "function") return v(e, file);
    return v;
  }
  if (e.type === "ConditionalExpression") {
    const test = C(file).src.slice(e.test.start, e.test.end);
    if (Object.hasOwn(subst, "?" + test)) return render(file, subst["?" + test] ? e.consequent : e.alternate, subst, provs);
  }
  if (e.type === "Literal") return String(e.value);
  if (e.type === "TemplateLiteral") return render(file, e, subst, provs);
  if (e.type === "Identifier") {
    const w = where(file, e.name), n = C(w.file).decls.get(w.name);
    if (n?.type === "VariableDeclarator" && n.init && (isStr(n.init) || (n.init.type === "Literal" && typeof n.init.value === "number"))) {
      if (isStr(n.init)) provs?.push(prov(w.file, n.init, "inlined"));
      const v = render(w.file, n.init, subst, provs);
      PENDING.constants[w.name] = v; constExprs.add(e);
      return v;
    }
  }
  if (e.type === "MemberExpression" && !e.computed && e.object.type === "ObjectExpression") {
    const p = e.object.properties.find(p => (p.key.name ?? p.key.value) === e.property.name);
    if (p && p.value.type === "Literal") return String(p.value.value);
  }
  return `{{expr:${raw}}}`;
}
// Render a constant string array (joined with "\n" by default) from its declaration.
function arrayText(file, name, { join = "\n", pin, subst = {} } = {}) {
  const { file: f, node } = constNode(file, name, pin);
  if (node.type !== "ArrayExpression") throw new Error(`${name} is not an array`);
  const provs = [prov(f, node)];
  const parts = node.elements.map(el => {
    if (isStr(el)) return render(f, el, subst, provs);
    if (el.type === "Identifier") return evalExpr(f, el, subst, provs);
    throw new Error(`unsupported array element in ${name}`);
  });
  return { text: parts.join(join), parts, provs };
}
// lp(): top-level entries become " - x", nested arrays become "  - x".
const bullets = arr => arr.flatMap(x => (Array.isArray(x) ? x.map(r => `  - ${r}`) : [` - ${x}`])).join("\n");

// ---------------------------------------------------------------- composition helpers
// T(piece, subst) returns [text, provs] with the piece's own provenance first.
function T(piece, subst = {}, role = "source") { const provs = [piece.prov(role)]; return [piece.text(subst, provs), provs]; }
function compose(parts) {
  // parts: array of [text, provs] | string (glue from code, e.g. "\n\n")
  let text = "", provs = [];
  for (const p of parts) {
    if (p === null || p === undefined) continue;
    if (typeof p === "string") { text += p; continue; }
    text += p[0]; provs.push(...p[1]);
  }
  const seen = new Set();
  return { text, provenance: provs.filter(p => { const k = `${p.file}:${p.binary_offset}`; if (seen.has(k)) return false; seen.add(k); return true; }) };
}
const L = (file, name, needle, opts, subst) => T(lit(file, name, needle, opts), subst);
const joinBullets = (heading, entries) => {
  // entries: [text, provs] (top-level) or {nested: [[text, provs]...]}
  const lines = [], provs = [];
  for (const e of entries) {
    if (e.nested) for (const [t, p] of e.nested) { lines.push(`  - ${t}`); provs.push(...p); }
    else { lines.push(` - ${e[0]}`); provs.push(...e[1]); }
  }
  return [[heading, ...lines].join("\n"), provs];
};

// ---------------------------------------------------------------- shared placeholders
// Runtime values get {{NAME}}; everything the code resolves to a constant is inlined.
const PH = {
  CWD: "{{CWD}}", DATE: "{{DATE}}", MEMORY_DIR: "{{MEMORY_DIR}}",
};
const INTRO_DEFAULT = lit(MAIN, "SVn", "You are an interactive agent that helps users with software engineering tasks.", { pin: 1461282, mode: "eq" });
const LATEST_MODELS_EXPR = "Object.values(e).map((r)=>`${fc(r)?.display_name??r}: '${r===\"claude-haiku-4-5\"?\"claude-haiku-4-5-20251001\":r}'`).join(\", \")";

// ---------------------------------------------------------------- flag / env / model facts (all read in code)
const MODELS = {
  lean_prompt: ["claude-opus-4-8", "claude-opus-5", "claude-opus-5-5", "claude-fable-5", "claude-fable-5-1", "claude-mythos-5-1"],
  mid_conv_system: ["claude-sonnet-5", "claude-opus-4-8", "claude-opus-5", "claude-opus-5-5", "claude-fable-5", "claude-fable-5-1", "claude-mythos-5-1"],
  fable_5_mitigations: ["claude-fable-5", "claude-fable-5-1", "claude-mythos-5-1"],
  fable_5_1_prompt_bundle: ["claude-fable-5-1", "claude-mythos-5-1"],
  opus_5_prompt_bundle: ["claude-opus-5"],
};
const CAP_NOTE = "Model checks are capability lookups in the built-in model catalog (after alias resolution and dropping a `[1m]` suffix). `CLAUDE_CODE_MODEL_CAPABILITIES` can add or remove a capability (`model=cap,-cap;…`, `*` suffix globs the model), and a server-served capability lookup can also grant one.";
const FOLD = "On models that take mid-conversation system messages (see the mid-conversation system-tags item) the attachment is folded into the trailing role-`system` message, as in the `claude-opus-5-5` captures; otherwise it is its own `<system-reminder>` text block at the start of the user message, as in the `claude-sonnet-4-6` capture.";
const OPUS5 = "`claude-opus-5` (capability `opus_5_prompt_bundle`) while flag `tengu_fennel_godwit` (default false) is off";
const FABLE51 = "`claude-fable-5-1` or `claude-mythos-5-1` (capability `fable_5_1_prompt_bundle`), except when the entrypoint is `remote_cowork`, `remote_cowork_trigger`, `local-agent` or `local_agent` in a non-child session";
const FABLEMIT = "`claude-fable-5`, `claude-fable-5-1`, `claude-mythos-5-1` (capability `fable_5_mitigations`) or `claude-mythos-5`";

// ---------------------------------------------------------------- items
const items = [];
function add(it) {
  const { text, provenance: pv } = it.body;
  delete it.body;
  const fills = PENDING; PENDING = { constants: {}, slots: [] };
  if (text !== null) {
    if (Object.keys(fills.constants).length) it.extra = { ...(it.extra ?? {}), constants: fills.constants };
    if (fills.slots.length) it.extra = { ...(it.extra ?? {}), slots: fills.slots.filter((f, i, a) => a.findIndex(g => g.at === f.at && g.value === f.value) === i) };
  }
  items.push({
    id: it.id, title: it.title, group: it.group, kind: it.kind ?? "prompt",
    text, when: it.when, documented: it.documented ?? null,
    details: {
      section_key: it.key ?? null, condition: it.when, layout: it.layout ?? "both",
      flags: it.flags ?? [], env_vars: it.env ?? [], models: it.models ?? [],
      ...(it.status ? { status: it.status } : {}), ...(it.extra ?? {}),
    },
    provenance: pv,
  });
}
const G = {
  asm: "Request assembly",
  lean: "Lean layout",
  classic: "Classic layout",
  named: "Named sections",
  trail: "Trailing system message and reminders",
};

// ===== Request assembly
add({
  id: "billing-header", title: "Billing header block", group: G.asm, kind: "other", key: null, layout: "both",
  when: "Always the first system block, sent without cache_control, unless `CLAUDE_CODE_ATTRIBUTION_HEADER` is set to a false value (0/false/no/off). `{{FINGERPRINT}}` is the first 3 hex digits of sha256(fixed salt + characters 4, 7 and 20 of the first non-meta user message + version). `cch=00000;` is appended for the first-party provider with a first-party base URL (`ANTHROPIC_BASE_URL` unset or api.anthropic.com, or `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`) and on Vertex. `cc_workload=…;` when a workload value is set, `cc_is_subagent=true;` for non-main-session agents, and `cc_prev_req=…;`, `cc_prompt_id=…;`, `cc_turn_origin=…;` only for the first-party provider with a first-party base URL (from code).",
  env: ["CLAUDE_CODE_ATTRIBUTION_HEADER", "CLAUDE_CODE_ENTRYPOINT", "ANTHROPIC_BASE_URL", "_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL"],
  body: compose([L("chunk-q2t02exe.js", "hHn", "x-anthropic-billing-header: cc_version=", {}, {
    y: `${VERSION}.{{FINGERPRINT}}`, m: "{{ENTRYPOINT}}", v: "{{CCH}}", P: "{{WORKLOAD}}", ye: "{{IS_SUBAGENT}}", ge: "{{PREV_REQ}}", _e: "{{PROMPT_ID}}", Pe: "{{TURN_ORIGIN}}",
  })]),
  extra: { rendered_capture: "x-anthropic-billing-header: cc_version=2.1.280.7c4; cc_entrypoint=sdk-cli;", entrypoint_values_seen: ["cli", "sdk-cli"], unset_entrypoint: "unknown" },
});
for (const [id, needle, when] of [
  ["identity-cli", "You are Claude Code, Anthropic's official CLI for Claude.", "Every session on the Vertex provider. Otherwise a prefix already recorded for the session is reused. Otherwise interactive sessions and side queries get this line."],
  ["identity-sdk-append", "You are Claude Code, Anthropic's official CLI for Claude, running within the Claude Agent SDK.", "Non-interactive sessions (for example `claude -p` or the Agent SDK) that pass an appended system prompt (`--append-system-prompt`), unless the provider is Vertex."],
  ["identity-sdk", "You are a Claude agent, built on Anthropic's Claude Agent SDK.", "Non-interactive sessions without an appended system prompt, unless the provider is Vertex."],
]) add({ id, title: `Identity line: ${id.replace("identity-", "")}`, group: G.asm, key: null, when: `Second system block. ${when}`, body: compose([T(findLitByValue("chunk-nrvavt8a.js", needle))]) });
function findLitByValue(file, value) {
  const hits = literals(C(file).ast).filter(n => shape(n) === value);
  if (hits.length !== 1) throw new Error(`expected one literal ${JSON.stringify(value)} in ${file}, found ${hits.length}`);
  return new Piece(file, hits[0]);
}
add({
  id: "simple-mode", title: "Simple mode prompt", group: G.asm, key: null, layout: "both",
  when: "`CLAUDE_CODE_SIMPLE` is set: the whole main prompt is replaced by these two lines (nothing when dynamic sections are excluded). The token-count footer is also suppressed.",
  env: ["CLAUDE_CODE_SIMPLE"],
  body: compose([L(MAIN, "KE", "CWD: ", { pin: 1465770 }, { "ne()": PH.CWD, "hno()": PH.DATE })]),
});
add({
  id: "reporting-outcomes", title: "Reporting outcomes block (not emitted)", group: G.asm, key: null, status: "not emitted in 2.1.280",
  when: "Not emitted in 2.1.280. The block splitter recognizes this exact text and would give it its own uncached block after the identity line, but no code path in the embedded JS inserts it into the prompt.",
  body: compose([T(new Piece("chunk-nrvavt8a.js", constNode("chunk-nrvavt8a.js", "FQe", 3864).node))]),
});

// ===== Lean layout
const sysTagsLean = lit(MAIN, "Imt", "`<system-reminder>` tags", { pin: 1447002 });
const sysTagsStd = lit(MAIN, "Imt", "Tool results and user messages may include <system-reminder>");
const midConv = new Piece(MAIN, constNode(MAIN, "dVn", 1446756).node);
const pasted = new Piece(MAIN, constNode(MAIN, "TTe", 1427622).node);
const harnessTpl = lit(MAIN, "SVn", "\n\u0000\n\n\u0000\n\n# Harness", { pin: 1461282 });
function harness({ intro = INTRO_DEFAULT, tags = midConv, withPasted = true } = {}) {
  const provs = [harnessTpl.prov()];
  const text = harnessTpl.text({
    r: intro.text({}, provs),
    'Imt(n,"lean")': tags.text({}, provs),
    s: withPasted ? `\n - ${pasted.text({}, provs)}` : "",
  }, provs);
  provs.push(...[intro.prov(), tags.prov(), ...(withPasted ? [pasted.prov()] : [])].map(inlined));
  return compose([[text, provs]]);
}
// ETe is referenced by identifier inside the template; render it through a synthetic lookup.
add({
  id: "lean-harness", title: "Lean layout: intro, security policy and # Harness", group: G.lean, key: null, layout: "lean",
  when: "Lean layout only (see Layout selection). Shown as rendered for `claude-opus-5-5` with no output style, `tengu_ochre_wren` off and `tengu_virtual_pancake` on (the capture conditions). Substitutions: the first line is one of the intro-line variants; the third Harness bullet begins with the mid-conversation-system sentence for models that take mid-conversation system messages, otherwise with the lean system-reminder sentence; the pasted-content bullet appears only when `tengu_virtual_pancake` (default false, read once per session) is on.",
  flags: [{ name: "tengu_ochre_wren", default: false }, { name: "tengu_virtual_pancake", default: false }],
  env: ["CLAUDE_CODE_INTRO_FRAME"],
  models: MODELS.lean_prompt,
  body: harness(),
});
add({
  id: "intro-line-default", title: "Intro line: default", group: G.lean, layout: "both",
  when: "First line of both layouts when no output style is active and the intro-frame arm is off. The classic layout appends \" Use the instructions below and the tools available to you to assist the user.\"",
  body: compose([T(INTRO_DEFAULT)]),
});
add({
  id: "intro-line-output-style", title: "Intro line: output style active", group: G.lean, layout: "both",
  when: "Replaces the intro line in both layouts when an output style is configured (the output-style loader returns a style).",
  body: compose([T(new Piece(MAIN, constNode(MAIN, "Pmt", 1446176).node))]),
});
add({
  id: "intro-line-frame", title: "Intro line: intro frame arm", group: G.lean, layout: "both",
  when: "Replaces the intro line when no output style is active and `CLAUDE_CODE_INTRO_FRAME` is set (it wins when set), otherwise when flag `tengu_ochre_wren` (default false) is on. Evaluated once per process.",
  flags: [{ name: "tengu_ochre_wren", default: false }], env: ["CLAUDE_CODE_INTRO_FRAME"],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "Amt", 1446072).node))]),
});
add({
  id: "security-policy", title: "Security policy line", group: G.lean, layout: "both",
  when: "Always present in both layouts, right after the intro line.",
  body: compose([T(new Piece(MAIN, constNode(MAIN, "ETe", 1432781).node))]),
});
add({
  id: "system-tags-mid-conversation", title: "System-tags sentence: mid-conversation system turns", group: G.lean, layout: "both",
  when: "Used in the lean Harness bullet and the classic # System bullet when the model takes mid-conversation system messages and is not `claude-sonnet-5` or `claude-opus-4-8`. Models with capability `mid_conv_system`: " + MODELS.mid_conv_system.join(", ") + "; also `claude-mythos-5`. `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM` forces it on; HIPAA mode forces it off. " + CAP_NOTE,
  env: ["CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM"], models: MODELS.mid_conv_system.filter(m => m !== "claude-sonnet-5" && m !== "claude-opus-4-8"),
  body: compose([T(midConv)]),
});
add({
  id: "system-tags-lean", title: "System-tags sentence: lean", group: G.lean, layout: "lean",
  when: "Lean Harness bullet when the mid-conversation sentence does not apply.",
  body: compose([T(sysTagsLean)]),
});
add({
  id: "pasted-content-bullet", title: "Pasted-content bullet", group: G.lean, layout: "both",
  when: "Added as a bullet in the lean Harness list and the classic # System list when flag `tengu_virtual_pancake` (default false) is on; the value is pinned for the session.",
  flags: [{ name: "tengu_virtual_pancake", default: false }],
  body: compose([T(pasted)]),
});

// ===== Classic layout
const classicIntroTpl = lit(MAIN, "cVn", "\n\u0000 Use the instructions below", { pin: 1446318 });
add({
  id: "classic-intro", title: "Classic layout: intro", group: G.classic, layout: "classic",
  when: "Classic layout only. Shown with the default intro line; see the intro-line variants.",
  body: (() => { const provs = [classicIntroTpl.prov()]; const text = classicIntroTpl.text({ 'e!==null?Pmt:Rmt()?Amt:"You are an interactive agent that helps users with software engineering tasks."': INTRO_DEFAULT.text() }, provs); provs.push(inlined(INTRO_DEFAULT.prov())); return compose([[text, provs]]); })(),
});
{
  const b = n => L(MAIN, "uVn", n, { pin: 1447379 });
  add({
    id: "classic-system", title: "Classic layout: # System", group: G.classic, layout: "classic",
    when: "Classic layout only. Shown for a model without mid-conversation system messages and with `tengu_virtual_pancake` off. With mid-conversation system messages the third bullet is the mid-conversation sentence instead; with `tengu_virtual_pancake` on, the pasted-content bullet is inserted after the prompt-injection bullet.",
    flags: [{ name: "tengu_virtual_pancake", default: false }],
    body: compose([joinBullets(lit(MAIN, "uVn", "# System", { mode: "eq" }).text(), [
      b("All text you output outside of tool use"), b("Tools are executed in a user-selected permission mode."), T(sysTagsStd),
      b("Tool results may include data from external sources."), L(MAIN, "nVn", "Users may configure 'hooks'", { pin: 1441396 }),
      b("The system will automatically compress prior messages"),
    ])]),
  });
}
{
  const f = n => L(MAIN, "fVn", n, { pin: 1448512 });
  const doing = [
    f("The user will primarily request you"), f("You are highly capable"), f("For exploratory questions"), f("Prefer editing existing files"), f("Be careful not to introduce security"),
    f("Don't add features, refactor"), f("Don't add error handling"), f("Default to writing no comments."), f("Don't explain WHAT the code does"), f("For UI or frontend changes"),
    f("Avoid backwards-compatibility hacks"), f("If the user asks for help or wants to give feedback"),
    { nested: [f("/help: Get help"), f("To give feedback, users should ")] },
  ];
  add({
    id: "classic-doing-tasks", title: "Classic layout: # Doing tasks", group: G.classic, layout: "classic",
    when: "Classic layout only, and only when no output style is active or the active style sets `keepCodingInstructions: true`. Shown with flag `tengu_verified_vs_assumed` (default false) off; when on, its bullet is inserted after the backwards-compatibility bullet.",
    flags: [{ name: "tengu_verified_vs_assumed", default: false }],
    body: compose([joinBullets(lit(MAIN, "fVn", "# Doing tasks", { mode: "eq" }).text(), doing)]),
  });
  add({
    id: "classic-doing-tasks-verified", title: "Doing tasks: verified-vs-assumed bullet", group: G.classic, layout: "classic",
    when: "Inserted into # Doing tasks when flag `tengu_verified_vs_assumed` (default false) is on.",
    flags: [{ name: "tengu_verified_vs_assumed", default: false }],
    body: compose([f("When reporting results, be accurate")]),
  });
}
add({
  id: "classic-actions-with-care", title: "Classic layout: # Executing actions with care", group: G.classic, layout: "classic",
  when: "Classic layout only; unconditional there.",
  body: compose([L(MAIN, "pVn", "# Executing actions with care", { pin: 1452579 })]),
});
{
  const t = lit(MAIN, "gVn", "Prefer dedicated tools over ", { pin: 1456231 });
  const subst = { g: resolveName(MAIN, "Ge"), h: ["ot", "Ft", "vn"].map(n => resolveName(MAIN, n)).join(", ") };
  add({
    id: "classic-using-tools", title: "Classic layout: # Using your tools", group: G.classic, layout: "classic",
    when: "Classic layout only. Shown as captured for `claude-sonnet-4-6` with `claude -p`: Bash and TaskCreate in the tool set, no Glob or Grep, no search-tools opt-in, entrypoint not `local-agent`. The shell name is `Bash` when the Bash tool is present, otherwise `PowerShell`. The parenthetical list is `Read, Edit, Write` when the Bash tool is present, the session has no search-tools opt-in and the entrypoint is not `local-agent`, and `Read, Edit, Write, Glob, Grep` otherwise. The second bullet names TaskCreate, or TodoWrite when only that is available, and is omitted when neither is. (A task-tools-only variant exists behind a predicate hard-coded false in 2.1.280.)",
    env: ["CLAUDE_CODE_ENTRYPOINT"],
    body: compose([joinBullets(lit(MAIN, "gVn", "# Using your tools", { mode: "eq", nth: 1 }).text(), [T(t, subst), T(lit(MAIN, "gVn", "Use "), { n: resolveName(MAIN, "sE") }), L(MAIN, "gVn", "You can call multiple tools in a single response.")])]),
  });
  add({
    id: "classic-using-tools-task", title: "Using your tools: task bullet", group: G.classic, layout: "classic",
    when: "Second bullet of # Using your tools when TaskCreate is available (shown), or TodoWrite when only that is.",
    body: compose([T(lit(MAIN, "gVn", "Use "), { n: resolveName(MAIN, "sE") })]),
  });
}
{
  const s = n => L(MAIN, "_Vn", n, { pin: 1460656 });
  add({
    id: "classic-tone-style", title: "Classic layout: # Tone and style", group: G.classic, layout: "classic",
    when: "Classic layout only; unconditional there.",
    body: compose([joinBullets(lit(MAIN, "_Vn", "# Tone and style", { mode: "eq" }).text(), [s("Only use emojis"), s("Your responses should be short"), s("When referencing specific functions"), s("Do not use a colon before tool calls.")])]),
  });
}

// ===== Named sections (in assembler order; each is computed once and cached under its key)
const commTpl = lit(MAIN, "K2n", "# Communicating with the user", { pin: 1434184 });
add({
  id: "communication-turn-updates", title: "communication: turn-updates variant", group: G.named, key: "communication", layout: "both",
  when: "Wins over every other communication variant. `CLAUDE_CODE_TURN_UPDATES` decides when set; otherwise capability `turn_updates`, or " + FABLE51 + ", or client-data key `turn_updates` true. " + CAP_NOTE,
  env: ["CLAUDE_CODE_TURN_UPDATES"], models: MODELS.fable_5_1_prompt_bundle,
  body: compose([T(new Piece(MAIN, constNode(MAIN, "q2n", 1433891).node))]),
});
for (const [id, finalMsg] of [["communication-full", false], ["communication-full-final-message", true]]) {
  add({
    id, title: `communication: # Communicating with the user${finalMsg ? " (final-message variant)" : ""}`, group: G.named, key: "communication", layout: "both",
    when: (finalMsg
      ? "Used instead of the plain full variant when the model is a fable-mitigations model (" + FABLEMIT + ") and brief mode is off. "
      : "Used when the model is a fable-mitigations model (" + FABLEMIT + ") with brief mode on, or when `CLAUDE_CODE_BASALT_COVE` is set or client-data key `basalt_cove` lists a substring of the model ID, and the turn-updates variant does not apply. ")
      + "The section key gains `:L` in the lean layout and `:send_user_msg` when brief mode is on.",
    env: ["CLAUDE_CODE_BASALT_COVE"], models: finalMsg ? [...MODELS.fable_5_mitigations, "claude-mythos-5"] : [],
    body: compose([T(commTpl, { "?r": finalMsg })]),
    extra: { note: "Rendered by taking one branch of each conditional slot in the source template; the other branch belongs to the sibling variant." },
  });
}
add({
  id: "communication-lean", title: "communication: lean", group: G.named, key: "communication:L", layout: "lean",
  when: "Lean layout when neither the turn-updates nor the full variant applies. (Captured for `claude-opus-5-5`.)",
  body: compose([L(MAIN, "K2n", "Write code that reads like the surrounding code: match its comment density, naming, and idiom.", { mode: "eq" })]),
});
add({
  id: "communication-classic", title: "communication: # Text output (classic)", group: G.named, key: "communication", layout: "classic",
  when: "Classic layout when neither the turn-updates nor the full variant applies.",
  body: compose([L(MAIN, "K2n", "# Text output (does not apply to tool calls)")]),
});
add({
  id: "pronouns", title: "pronouns", group: G.named, key: "pronouns", layout: "both", when: "Always.",
  body: compose([T(new Piece(MAIN, constNode(MAIN, "tVn", 1441022).node))]),
});
add({
  id: "action-caution", title: "action_caution", group: G.named, key: "action_caution:L", layout: "lean", when: "Lean layout only.",
  body: compose([L(MAIN, "V2n", "For actions that are hard to reverse", { pin: 1438403 })]),
});
add({
  id: "task-continuity", title: "task_continuity (not emitted)", group: G.named, key: "task_continuity", layout: "both", status: "not emitted in 2.1.280",
  when: "Not emitted in 2.1.280: its model predicate is hard-coded false.",
  body: compose([L(MAIN, "Y2n", "When a task has been agreed", { pin: 1438970 })]),
});
add({
  id: "fable-identity-5-1", title: "fable_identity: Claude Fable 5.1", group: G.named, key: "fable_identity", layout: "both",
  when: "Main-loop model resolves to `claude-fable-5-1` (checked on the requested model, not the prompt-model remap).", models: ["claude-fable-5-1"],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "Q2n", 1439505).node))]),
});
add({
  id: "fable-identity-5", title: "fable_identity: Claude Fable 5", group: G.named, key: "fable_identity", layout: "both",
  when: "Main-loop model starts with `claude-fable-` (other than `claude-fable-5-1`), or equals `ANTHROPIC_DEFAULT_FABLE_MODEL`.", env: ["ANTHROPIC_DEFAULT_FABLE_MODEL"], models: ["claude-fable-5"],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "J2n", 1440197).node))]),
});
add({
  id: "tool-param-json", title: "tool_param_json", group: G.named, key: "tool_param_json", layout: "both",
  when: "Emitted when the runtime config key `juniper_shoal.bracken_spool` is true (undocumented config source; read at chunk-m200zvyg.js offset 342470), or when flag `tengu_silent_harbor` (default false) is on and the model is a fable-mitigations model (" + FABLEMIT + ") or equals `ANTHROPIC_DEFAULT_FABLE_MODEL`.",
  flags: [{ name: "tengu_silent_harbor", default: false }], env: ["ANTHROPIC_DEFAULT_FABLE_MODEL"], models: [...MODELS.fable_5_mitigations, "claude-mythos-5"],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "eVn", 1440893).node))]),
});
// session_guidance bullets
const sg = n => lit(MAIN, "yVn", n, { pin: 1458826 });
const sgBang = sg("If you need the user to run a shell command"), sgCloud = sg("The user follows this cloud session"), sgSkill = sg("When the user types"), sgUltra = sg('If the user asks about "ultrareview"'), sgExplore = sg("For broad codebase exploration");
const hv = n => lit(MAIN, "hVn", n, { pin: 1457547 });
const skillBullet = () => T(sgSkill);
add({
  id: "session-guidance", title: "session_guidance: # Session-specific guidance", group: G.named, key: "session_guidance", layout: "both",
  when: "Emitted when at least one bullet applies; each bullet has its own condition (items below). Shown as captured in the interactive CLI (`claude-opus-5-5`, lean): the shell-command bullet and the skill bullet. The section key includes `:L` in the lean layout, `:sdk` when dynamic sections are excluded, and ends with `:true` or `:false` for whether bundled skills are disabled (`CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` or settings `disableBundledSkills`).",
  env: ["CLAUDE_CODE_DISABLE_BUNDLED_SKILLS"],
  body: compose([joinBullets(sg("# Session-specific guidance").text(), [T(sgBang), skillBullet()])]),
});
add({ id: "session-guidance-shell", title: "session_guidance bullet: user-run shell command", group: G.named, key: "session_guidance", when: "Interactive sessions only.", body: compose([T(sgBang)]) });
add({
  id: "session-guidance-cloud", title: "session_guidance bullet: cloud session files", group: G.named, key: "session_guidance",
  when: "`CLAUDE_CODE_REMOTE` is set and `CLAUDE_CODE_ENTRYPOINT` is `remote`, `remote_desktop`, `remote_mobile` or `remote_trigger`.", env: ["CLAUDE_CODE_REMOTE", "CLAUDE_CODE_ENTRYPOINT"], body: compose([T(sgCloud)]),
});
add({
  id: "session-guidance-fork", title: "session_guidance bullet: fork subagents", group: G.named, key: "session_guidance", layout: "classic",
  when: "Classic layout, Agent tool available, and fork subagents enabled: on by default in interactive sessions, forced on by `CLAUDE_CODE_FORK_SUBAGENT` true and off when it is false, off in non-interactive sessions, with one further disabling check (read at chunk-dt8bvbsd.js offset 1430038).",
  env: ["CLAUDE_CODE_FORK_SUBAGENT"], body: compose([T(hv("Calling "))]),
});
const steerFlag = resolveName("chunk-m200zvyg.js", "nf", { record: false });
add({
  id: "session-guidance-agent-default", title: "session_guidance bullet: Agent tool (default steer)", group: G.named, key: "session_guidance", layout: "classic",
  when: `Classic layout, Agent tool available, fork subagents off, and the subagent steer is \`default\`. The steer comes from \`CLAUDE_CODE_THISTLE_GREBE\`, else client-data key \`${steerFlag}\`, else flag \`${steerFlag}\`, else a per-model floor (\`no_nudges\` for ${OPUS5}); valid values are \`default\`, \`no_nudges\`, \`counter_steer\`.`,
  env: ["CLAUDE_CODE_THISTLE_GREBE"], flags: [{ name: steerFlag, default: null }],
  body: compose([T(lit(MAIN, "hVn", "Use ", { nth: 0 }))]),
});
add({
  id: "session-guidance-agent-steered", title: "session_guidance bullet: Agent tool (non-default steer)", group: G.named, key: "session_guidance", layout: "classic",
  when: "Same as the default-steer bullet when the steer is `no_nudges` or `counter_steer`.", env: ["CLAUDE_CODE_THISTLE_GREBE"],
  body: compose([T(lit(MAIN, "hVn", "Use ", { nth: 1 }))]),
});
add({
  id: "session-guidance-explore", title: "session_guidance bullet: Explore agent", group: G.named, key: "session_guidance", layout: "classic",
  when: "Classic layout, Agent tool available, the Explore agent enabled, steer `default`, and fork subagents off. The last clause reads \"`find` or `grep` via the Bash tool\" (shown) when the Bash tool is present, the session has no search-tools opt-in and the entrypoint is not `local-agent`; otherwise \"the Glob or Grep\".",
  body: compose([T(sgExplore, { "MS.agentType": decl(MAIN, "MS").node.init.properties.find(p => p.key.name === "agentType").value.value, M: lit(MAIN, "yVn", "`find` or `grep` via the ").text() })]),
});
add({
  id: "session-guidance-skill", title: "session_guidance bullet: slash skills", group: G.named, key: "session_guidance",
  when: "The Skill tool is available, there is at least one skill (counted from the session skill allowlist when one is set, otherwise from the list loaded for the working directory), and dynamic sections are not excluded.", body: compose([skillBullet()]),
});
add({
  id: "session-guidance-ultrareview", title: "session_guidance bullet: ultrareview", group: G.named, key: "session_guidance",
  when: "Dynamic sections not excluded, flag `tengu_review_bughunter_config` (default null) has `enabled: true`, first-party provider, not a remote session (`CLAUDE_CODE_REMOTE`), and flag `tengu_ccr_bridge` (default false) on together with further account checks (read at chunk-7kwd28ae.js offset 561605).",
  flags: [{ name: "tengu_review_bughunter_config", default: null }, { name: "tengu_ccr_bridge", default: false }], env: ["CLAUDE_CODE_REMOTE"], body: compose([T(sgUltra)]),
});
// env_info
{
  const x = n => lit(MAIN, "xVn", n, { pin: 1468252 });
  const latest = lit(MAIN, "j2n", "The most recent Claude models", { pin: 1433390 });
  const latestT = T(latest, { [LATEST_MODELS_EXPR]: "{{LATEST_MODEL_IDS}}" });
  const bde = T(new Piece(MAIN, constNode(MAIN, "bde", 57208).node));
  add({
    id: "env-info", title: "env_info: # Environment (system prompt part)", group: G.named, key: "env_info_simple", layout: "both",
    when: "Always. With dynamic sections excluded the key is `env_info_static` and the fast-mode bullet is dropped. `{{LATEST_MODEL_IDS}}` lists the catalog's latest model per family as `Display name: 'id'` (Haiku 4.5 is written as `claude-haiku-4-5-20251001`); in 2.1.280 it renders `Fable 5.1: 'claude-fable-5-1', Opus 5.5: 'claude-opus-5-5', Sonnet 5: 'claude-sonnet-5', Haiku 4.5: 'claude-haiku-4-5-20251001'`.",
    body: compose([[bde[0] + "\n" + bullets([latestT[0], x("Claude Code is available as a CLI").text(), x("Fast mode for Claude Code").text()]), [...bde[1], ...latestT[1], x("Claude Code is available as a CLI").prov(), x("Fast mode for Claude Code").prov()]]]),
  });
}
// bg-session
{
  const bgTpl = lit(MAIN, "CVn", "# Background Session", { pin: 1470385 });
  const iso = n => lit(MAIN, "CVn", n);
  const commit = iso("\n\nIf you made code changes in a worktree");
  for (const [id, needle, cond, withCommit] of [
    ["bg-session-shared", "Before making any code changes, use the EnterWorktree tool", "isolation is neither `none` nor `worktree` (the default)", true],
    ["bg-session-worktree", "This agent is configured with `isolation: worktree`.", "`CLAUDE_BG_ISOLATION` is `worktree`", true],
    ["bg-session-in-place", "Edit files directly in your working directory", "isolation resolves to `none` (`CLAUDE_BG_ISOLATION`, the session's config, or settings `worktree.bgIsolation`)", false],
  ]) {
    const provs = [bgTpl.prov(), ...[iso(needle).prov(), ...(withCommit ? [commit.prov()] : [])].map(inlined)];
    const commitText = withCommit ? commit.text({}, provs) : "";
    const text = bgTpl.text({ 'B2n(e,"tmp")': "{{JOB_DIR}}/tmp", r: iso(needle).text(), s: commitText }, provs);
    add({
      id, title: `bg-session: # Background Session (${id.replace("bg-session-", "")})`, group: G.named, key: "bg-session", layout: "both",
      when: `\`CLAUDE_CODE_SESSION_KIND\` is \`bg\` and \`CLAUDE_JOB_DIR\` is set; ${cond}. \`{{JOB_DIR}}\` is the \`CLAUDE_JOB_DIR\` path.`,
      env: ["CLAUDE_CODE_SESSION_KIND", "CLAUDE_JOB_DIR", "CLAUDE_BG_ISOLATION"], body: compose([[text, provs]]),
    });
  }
}
add({ id: "context-management", title: "context_management", group: G.named, key: "context_management", when: "Always.", body: compose([T(new Piece(MAIN, constNode(MAIN, "RVn", 1473005).node))]) });
add({
  id: "brief", title: "brief: ## Talking to the user", group: G.named, key: "brief",
  when: "Brief mode is enabled.",
  body: compose([T(new Piece("chunk-hf0chxdz.js", constNode("chunk-hf0chxdz.js", "QPo").node))]),
});
add({
  id: "focus-mode-lean", title: "focus_mode: lean", group: G.named, key: "focus_mode:L", layout: "lean",
  when: "Focus view is on: in interactive sessions the settings `viewMode` is `focus` (or, with no `viewMode` setting, the global config value `briefTranscript`); in non-interactive sessions the flag-settings `viewMode` is `focus`.",
  body: compose([T(new Piece(MAIN, constNode(MAIN, "MVn", 1473792).node))]),
});
add({
  id: "focus-mode-classic", title: "focus_mode: classic", group: G.named, key: "focus_mode", layout: "classic", when: "Same condition as the lean variant, classic layout.",
  body: compose([T(new Piece(MAIN, constNode(MAIN, "PVn", 1473363).node))]),
});
add({
  id: "act-dont-rederive", title: "act_dont_rederive", group: G.named, key: "act_dont_rederive",
  when: "`CLAUDE_CODE_ACT_DONT_REDERIVE`, when set, decides; otherwise flag `tengu_cedar_lantern` (default true). Evaluated once per process. (Both captures had `tengu_cedar_lantern` served false, so it is absent there.)",
  flags: [{ name: "tengu_cedar_lantern", default: true }], env: ["CLAUDE_CODE_ACT_DONT_REDERIVE"],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "bVn", 1462180).node))]),
});
add({
  id: "delivering-work", title: "delivering_work_max: # Delivering work", group: G.named, key: "delivering_work_max",
  when: "`CLAUDE_CODE_BISON_CAIRN`, when set, decides. Otherwise emitted for " + FABLE51 + "; or when capability `bison_cairn` is granted; or for " + OPUS5 + "; or when client-data key `bison_cairn` is true. " + CAP_NOTE,
  flags: [{ name: "tengu_fennel_godwit", default: false }], env: ["CLAUDE_CODE_BISON_CAIRN"], models: [...MODELS.fable_5_1_prompt_bundle, ...MODELS.opus_5_prompt_bundle],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "wVn", 1462464).node))]),
});
add({
  id: "overcorrection", title: "overcorrection: # Corrections", group: G.named, key: "overcorrection",
  when: "`CLAUDE_CODE_LARCH_CISTERN`, when set to a true value, turns it on. Otherwise capability `larch_cistern`, or " + OPUS5 + ", or client-data key `larch_cistern` true.",
  flags: [{ name: "tengu_fennel_godwit", default: false }], env: ["CLAUDE_CODE_LARCH_CISTERN"], models: MODELS.opus_5_prompt_bundle,
  body: compose([T(new Piece(MAIN, constNode(MAIN, "vVn", 1464513).node))]),
});
add({
  id: "subagent-steer-delegation", title: "subagent_steer_delegation: ## Delegating to subagents", group: G.named, key: "subagent_steer_delegation",
  when: `The Agent tool is available and the subagent steer is \`counter_steer\` (\`CLAUDE_CODE_THISTLE_GREBE\`, client-data key or flag \`${steerFlag}\`).`,
  env: ["CLAUDE_CODE_THISTLE_GREBE"], flags: [{ name: steerFlag, default: null }],
  body: compose([T(new Piece("chunk-m200zvyg.js", constNode("chunk-m200zvyg.js", "mdo").node))]),
});
add({
  id: "opus5-reduced-delegation", title: "opus5_reduced_delegation", group: G.named, key: "opus5_reduced_delegation",
  when: "Model is " + OPUS5 + ", flag `tengu_slate_bittern` (default true) is on, and the heron_brook text does not already contain this sentence or \"Do not call the AgentTool unless the user\".",
  flags: [{ name: "tengu_slate_bittern", default: true }, { name: "tengu_fennel_godwit", default: false }], models: MODELS.opus_5_prompt_bundle,
  body: compose([T(new Piece(MAIN, constNode(MAIN, "xmt", 1444091).node))]),
});
add({
  id: "heron-brook", title: "heron_brook (server-supplied text)", group: G.named, key: "heron_brook", kind: "prompt",
  when: "Emitted verbatim (trimmed) when client-data key `tengu_heron_brook` is a non-empty string, else when flag `tengu_heron_brook` (default \"\") is non-empty. The text is not in the binary.",
  flags: [{ name: "tengu_heron_brook", default: "" }], status: "text supplied at runtime",
  body: { text: null, provenance: [prov(MAIN, decl(MAIN, "Cmt", 1441781).node)] },
});
add({
  id: "brook-heron", title: "brook_heron (server-supplied text)", group: G.named, key: "brook_heron", kind: "prompt",
  when: "Emitted when client-data key `tengu_brook_heron` holds text for this model: either one string, or a map from model to text or to a per-effort map (effort level, or `*` as fallback). The text is not in the binary.",
  status: "text supplied at runtime", body: { text: null, provenance: [prov(MAIN, decl(MAIN, "Tmt", 1429583).node)] },
});
add({
  id: "willow-tern", title: "willow_tern: # Writing for the user", group: G.named, key: "willow_tern",
  when: "`CLAUDE_CODE_WILLOW_TERN` set turns it on. Otherwise a boolean client-data key `tengu_willow_tern` decides. Otherwise on for " + FABLE51 + ", or for `claude-opus-5` (capability `opus_5_prompt_bundle`) when flag `tengu_willow_tern` (default false) is on.",
  flags: [{ name: "tengu_willow_tern", default: false }], env: ["CLAUDE_CODE_WILLOW_TERN"], models: [...MODELS.fable_5_1_prompt_bundle, ...MODELS.opus_5_prompt_bundle],
  body: compose([T(new Piece(MAIN, constNode(MAIN, "oVn", 1442155).node))]),
});
add({
  id: "autonomy-append", title: "autonomy_append", group: G.named, key: "autonomy_append",
  when: "Flag `tengu_amber_sextant` (default true) is on and either the model is a fable-mitigations model (" + FABLEMIT + ") or amber_astrolabe applies (`CLAUDE_CODE_AMBER_ASTROLABE` true, capability `amber_astrolabe`, or client-data key `amber_astrolabe` true).",
  flags: [{ name: "tengu_amber_sextant", default: true }], env: ["CLAUDE_CODE_AMBER_ASTROLABE"], models: [...MODELS.fable_5_mitigations, "claude-mythos-5"],
  body: compose([L(MAIN, "lVn", "You are operating autonomously.", { pin: 1444423 })]),
});
add({
  id: "endconv-deferred-hint", title: "endconv_deferred_hint", group: G.named, key: "endconv_deferred_hint",
  when: "The EndConversation tool is in the tool set, the main-loop model is known, the end-conversation config flag `" + resolveName("chunk-d1gc5f2z.js", "Omr", { record: false }) + "` (default false) enables it for the current entrypoint, and further checks pass (read at chunk-d1gc5f2z.js offset 6853).",
  flags: [{ name: resolveName("chunk-d1gc5f2z.js", "Omr", { record: false }), default: false }],
  body: compose([T(lit("chunk-d1gc5f2z.js", "Wko", "", {}))]),
});
{
  const mj = lit(MAIN, "MJ", "<total_tokens>", { pin: 1427380 });
  add({
    id: "total-tokens", title: "Token budget line", group: G.named, key: null,
    when: "Appended after the named sections, unless `CLAUDE_CODE_DISABLE_ATTACHMENTS` or `CLAUDE_CODE_SIMPLE` is set or the mode is `off`. Mode: `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`, else settings `totalTokensReminder`, else client-data key `tengu_lapis_anchor` (false means off), else flag `tengu_lapis_anchor` (default `padded-countdown`). `{{TOKENS_LEFT}}` is `Infinite` in `infinite` mode, 5000000 in `fixed` mode, the budget in `padded-countdown` mode (`CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`, settings `totalTokensReminderBudget`, client-data key or flag `tengu_lapis_anchor_budget`, default 15000000), and a per-model value otherwise. (Both captures had the flag served as `off`.)",
    flags: [{ name: "tengu_lapis_anchor", default: "padded-countdown" }, { name: "tengu_lapis_anchor_budget", default: 15000000 }],
    env: ["CLAUDE_CODE_DISABLE_ATTACHMENTS", "CLAUDE_CODE_SIMPLE", "CLAUDE_CODE_TOTAL_TOKENS_REMINDER", "CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET"],
    body: compose([T(mj, { 'e==="infinite"?"Infinite":e==="fixed"?x2n:Math.max(0,n)': "{{TOKENS_LEFT}}" })]),
    extra: { note: "The count slot is a runtime value; its literal `Infinite` branch is described in the condition." },
  });
}

// ===== Memory variants
const G2 = "chunk-gfcfehhw.js", MV = "chunk-vnh9hg8q.js";
const K = name => T(new Piece(...(() => { const c = constNode(G2, name); return [c.file, c.node]; })()));
{
  // Lean base (Cn with no team directory, index on, no citing, no skill-upkeep, no extra guidelines).
  const cnHead = lit(MV, "Cn", "# Memory\n\nYou have a persistent file-based memory ", { pin: 26600, nth: 1 });
  const at = lit(MV, "Cn", "at `\u0000`. \u0000", { mode: "eq" });
  const idx = lit(MV, "Cn", "\n\nAfter writing the file, add a one-line pointer in `");
  const provs = [cnHead.prov(), inlined(at.prov()), inlined(idx.prov())];
  const T0 = at.text({ n: PH.MEMORY_DIR }, provs);
  const J = idx.text({ 'R.length>0?` It lives in the private directory and indexes both; use a ${R.map((te)=>`\\`${te}\\``).join(" or ")} path prefix for team memories.`:""': "" }, provs);
  const fgr = arrayText(G2, "fgr"); provs.push(...fgr.provs.map(inlined));
  const pieces = { T: T0, 'fgr.join(`\n`)': fgr.text, 'F?` ${w7t}`:""': "", D: "", J, j: "", "VWe()?`\n\n${h7t}`:\"\"": "" };
  const text = cnHead.text(pieces, provs);
  add({
    id: "memory-lean", title: "memory: lean (# Memory)", group: G.named, key: "memory:L", layout: "lean",
    when: "Lean layout with auto memory enabled, no team memory store, no connected memory stores, `CLAUDE_COWORK_MEMORY_GUIDELINES` unset and flag `tengu_stone_shell` off. Shown as captured. Additions: the index paragraph (\"After writing the file…\") is dropped and a file-size sentence is appended to the linking paragraph when the index is skipped (flag `tengu_moth_copse`, default false, or a further client check); a citing sentence is appended when flag `tengu_salt_marsh` (default false) is on; the project-skill-upkeep paragraph is appended when flag `tengu_gorse_fathom` (default false) is on; `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES` and any team memory index text are appended after a blank line. Team-memory directories change the location sentence (see memory-team).",
    flags: [{ name: "tengu_moth_copse", default: false }, { name: "tengu_salt_marsh", default: false }, { name: "tengu_gorse_fathom", default: false }, { name: "tengu_stone_shell", default: false }],
    env: ["CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES", "CLAUDE_COWORK_MEMORY_GUIDELINES", "CLAUDE_CODE_DISABLE_AUTO_MEMORY"],
    body: compose([[text, provs]]),
  });
}
// Classic memory text: the builder's line list (default flags, index on), joined with newlines.
function classicMemory(headNeedle, headSubst) {
  headSubst = { w: new Piece(G2, constNode(G2, "Dre").node).text(), ...headSubst };
  const rt = n => lit(MV, "Rt", n, { pin: 48037 });
  const provs = [];
  const P = (p, subst = {}) => { provs.push(p.prov()); return p.text(subst, provs); };
  const arr = name => { const a = arrayText(G2, name); provs.push(...a.provs); return a.parts; };
  const et = n => lit(G2, "ett", n, { pin: 78508 });
  const ettLits = literals(decl(G2, "ett").node);
  const dflt = v => { const n = ettLits.find(n => shape(n) === v); provs.push(prov(G2, n)); return render(G2, n, {}, provs); };
  const rrFn = decl(G2, "rr", 55337);
  const rrArray = rrFn.node.body.body.find(n => n.type === "ReturnStatement").argument;
  provs.push(prov(G2, rrArray));
  const frontmatter = [...rrArray.elements.filter(isStr).map(n => render(G2, n, { 'e.join(", ")': arrayText(G2, "g7t", { join: ", " }).text })), ...arr("fgr")];
  const saving = [
    dflt("## How to save memories"), "", P(et("Saving a memory is a two-step process:")), "",
    P(et("**Step 1** \u2014 write the "), { s: dflt("memory to its own file (e.g., `user_role.md`, `feedback_testing.md`)") }), "",
    ...frontmatter, "", P(et("**Step 2** \u2014 add a pointer to that file in "), { g: dflt("`\u0000`") }), "",
    P(et("- `\u0000` is always loaded")), ...arr("E7t"),
  ];
  const lines = [
    P(lit(MV, "Rt", "# \u0000", { mode: "eq" }), { e: resolveName(MV, "vt") }), "",
    P(rt(headNeedle), headSubst), "",
    P(rt("You should build up this memory system")), "", P(rt("If the user explicitly asks you to remember something")), "",
    ...arr("nTt"), ...arr("Qet"), "", ...saving, "", ...arr("y7t"), "", ...arr("sbe"), "",
    ...[rt("## Memory and other forms of persistence"), rt("Memory is one of several persistence"), rt("- When to use or update a plan"), rt("- When to use or update tasks")].map(p => P(p)), "", "",
  ];
  return compose([[lines.join("\n"), provs]]);
}
add({
  id: "memory-classic", title: "memory: classic (# auto memory)", group: G.named, key: "memory", layout: "classic",
  when: "Classic layout with auto memory enabled, no team memory store, no connected memory stores, `CLAUDE_COWORK_MEMORY_GUIDELINES` unset and flag `tengu_stone_shell` off. Shown with default flags; it ends with two empty lines, as the builder does. Changes: when the index is skipped (flag `tengu_moth_copse`, default false, or a further client check) the save steps collapse to one frontmatter step plus the file-size bullet; flag `tengu_ochre_finch` (default false) replaces the types block with a short list that defers to a skill; flag `tengu_gorse_fathom` (default false) adds the project-skill-upkeep block before \"## When to access memories\"; flag `tengu_salt_marsh` (default false) adds a \"## Citing memories\" block before the persistence section; `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES` and team memory index text are inserted before the final empty line. No memory section at all when auto memory is disabled (`CLAUDE_CODE_DISABLE_AUTO_MEMORY` or settings `autoMemoryEnabled: false`).",
  flags: [{ name: "tengu_moth_copse", default: false }, { name: "tengu_ochre_finch", default: false }, { name: "tengu_gorse_fathom", default: false }, { name: "tengu_salt_marsh", default: false }, { name: "tengu_stone_shell", default: false }],
  env: ["CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES", "CLAUDE_CODE_DISABLE_AUTO_MEMORY"],
  body: classicMemory("You have a persistent, file-based memory system at `", { n: PH.MEMORY_DIR }),
  extra: { literal_double_braces: true },
});
add({
  id: "memory-cowork-guidelines", title: "memory: CLAUDE_COWORK_MEMORY_GUIDELINES override", group: G.named, key: "memory",
  when: "Auto memory enabled and `CLAUDE_COWORK_MEMORY_GUIDELINES` set: the section is this heading followed by the variable's value, in both layouts.",
  env: ["CLAUDE_COWORK_MEMORY_GUIDELINES"],
  body: compose([L(MV, "zCt", "# auto memory\n", { pin: 51552 }, { g: "{{CLAUDE_COWORK_MEMORY_GUIDELINES}}" })]),
});
{
  const mo = new Piece(MV, constNode(MV, "Mo", 32267).node);
  const provs = [inlined(mo.prov())];
  const moText = mo.text({}, provs).replace("{memory_dir}", PH.MEMORY_DIR);
  const wnHead = lit(MV, "Wn", "# auto memory\n", { pin: 35987 });
  provs.unshift(wnHead.prov());
  add({
    id: "memory-stone-shell", title: "memory: stone_shell variant (# auto memory)", group: G.named, key: "memory",
    when: "Auto memory enabled, flag `tengu_stone_shell` (default false) on, `CLAUDE_COWORK_MEMORY_GUIDELINES` unset, no team memory store and no connected memory stores. Either layout. The citing block (flag `tengu_salt_marsh`) and `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES` lines follow, separated by blank lines.",
    flags: [{ name: "tengu_stone_shell", default: false }, { name: "tengu_salt_marsh", default: false }], env: ["CLAUDE_COWORK_MEMORY_GUIDELINES", "CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES"],
    body: compose([[wnHead.text({ r: moText }, provs), provs]]),
  });
}
add({
  id: "memory-static", title: "memory: static (dynamic sections excluded)", group: G.named, key: null, layout: "classic",
  when: "When dynamic sections are excluded (`--exclude-dynamic-system-prompt-sections`), the memory section is omitted and this static text is placed right after the classic layout, provided auto memory is enabled, there is no team memory store, no connected stores, the layout is classic and flag `tengu_stone_shell` is off. It is the classic memory text (default flags) with the path sentence replaced.",
  body: classicMemory("You have a persistent, file-based memory system. The directory path", {}),
  extra: { literal_double_braces: true },
});
for (const [id, fn, pin, what] of [
  ["memory-team", "Bn", 39948, "Classic layout with a team memory store (team directories alongside the private one); a sibling builder at offset 36177 handles the case without per-mount settings. The lean layout folds team directories into the lean text's location sentence."],
  ["memory-connected-stores", "kn", 18661, "Connected memory stores are served and at least one is mounted (memory-tools variant)."],
]) add({
  id, title: `memory: ${id.replace("memory-", "")} (text not rendered)`, group: G.named, key: "memory", status: "text not rendered",
  when: what + " Text not rendered in this reference.",
  body: { text: null, provenance: [prov(MV, decl(MV, fn, pin).node)] },
});

// ===== Trailing system message and reminders
{
  const env = new Piece(MAIN, constNode(MAIN, "F7t").node);
  const g7 = n => lit(MAIN, "G7t", n);
  const provs = [prov(MAIN, constNode(MAIN, "bde").node), env.prov()];
  const lines = [g7("Primary working directory: "), g7("Is a git repository: "), g7("Platform: "), g7("Shell: "), g7("OS Version: ")];
  const vals = [{ "n(e.workingDirectory)": PH.CWD }, { "e.isGitRepo": "{{IS_GIT_REPO}}" }, { "n(e.platform)": "{{PLATFORM}}" }, { "n(e.shell)": "{{SHELL}}" }, { "n(e.osVersion)": "{{OS_VERSION}}" }];
  const text = [new Piece(MAIN, constNode(MAIN, "bde").node).text(), env.text(), bullets(lines.map((l, i) => { provs.push(l.prov()); return l.text(vals[i]); }))].join("\n");
  add({
    id: "trailing-environment", title: "Environment block", group: G.trail, key: null,
    when: "Environment attachment. " + FOLD + " Extra bullets, in order: the two worktree lines after the working directory when it is a git worktree; \"Additional working directories:\" with a nested list; the scratchpad line after OS Version when a scratchpad exists (not for `bg` sessions); a proxy note when one is set. `{{SHELL}}` is `zsh`, `bash`, the raw `SHELL` value, or `unknown` when `SHELL` is unset.",
    env: ["SHELL", "CLAUDE_CODE_SESSION_KIND"], body: compose([[text, provs]]),
  });
  for (const [id, name] of [["trailing-worktree-note", "Rje"], ["trailing-worktree-stash", "Cje"]]) add({
    id, title: `Environment bullet: ${name === "Rje" ? "git worktree" : "shared stash warning"}`, group: G.trail, when: "Bullet after the working directory when it is a git worktree.",
    body: compose([T(new Piece(MAIN, constNode(MAIN, name).node))]),
  });
  add({
    id: "trailing-scratchpad", title: "Environment bullet: scratchpad", group: G.trail, when: "Bullet when a scratchpad directory is available (not in `bg` sessions).", env: ["CLAUDE_CODE_SESSION_KIND"],
    body: compose([L(MAIN, "Oje", "Scratchpad directory: ", {}, { e: "{{SCRATCHPAD_DIR}}" })]),
  });
  const rq = lit(MAIN, "rQt", "You are powered by the model named "), rq2 = lit(MAIN, "rQt", "You are powered by the model "), oq = lit(MAIN, "oQt", "Assistant knowledge cutoff is ");
  add({
    id: "trailing-model", title: "Model line", group: G.trail,
    when: "Model attachment. The marketing-name form is used when a marketing name is known for the model ID, otherwise the plain form (`You are powered by the model {{MODEL_ID}}.`). The cutoff sentence is added when the catalog has one. " + FOLD,
    body: compose([[rq.text({ "e.marketingName": "{{MODEL_NAME}}", "e.modelId": "{{MODEL_ID}}" }) + " " + oq.text({ "e.knowledgeCutoff": "{{KNOWLEDGE_CUTOFF}}" }), [rq.prov(), rq2.prov(), oq.prov()]]]),
  });
  add({
    id: "trailing-agents", title: "Agent listing", group: G.trail,
    when: "Agent-listing attachment when agent types are available. `{{AGENT_LINES}}` holds one `- type: description (Tools: …)` line per agent. The concurrency sentence follows on the initial listing when enabled. Later changes use \"New agent types are now available for the Agent tool:\" or \"The following agent types are no longer available:\". " + FOLD,
    body: (() => {
      const hdr = findLitByValue(MAIN, "Available agent types for the Agent tool:"), note = findLitByValue(MAIN, "When you launch multiple agents for independent work, send them in a single message with multiple tool uses so they run concurrently.");
      const tpl = literals(C(MAIN).ast).find(n => n.type === "TemplateLiteral" && n.start > hdr.node.end && n.start < hdr.node.end + 200 && shape(n) === "\u0000\n\u0000");
      const provs = [hdr.prov(), prov(MAIN, tpl), note.prov()];
      return compose([[[render(MAIN, tpl, { w: hdr.text(), "s.join(`\n`)": "{{AGENT_LINES}}" }), note.text()].join("\n\n"), provs]]);
    })(),
  });
  const skillTpl = literals(C(MAIN).ast).find(n => n.type === "TemplateLiteral" && shape(n).startsWith("The following skills are available for use with the Skill tool:"));
  add({
    id: "trailing-skills", title: "Skill listing", group: G.trail, when: "Skill-listing attachment when any skills are listed. `{{SKILL_LINES}}` holds one `- name: description` line per skill. " + FOLD,
    body: compose([T(new Piece(MAIN, skillTpl), { "e.content": "{{SKILL_LINES}}" })]),
  });
  add({
    id: "trailing-date", title: "Date line", group: G.trail, when: "Date attachment; the last part of the trailing message in both captures. When the date changes mid-session the text becomes \"The date has changed. Today's date is now {{DATE}}. No need to announce the new date — the user's own clock shows it.\" " + FOLD,
    body: compose([L(MAIN, "tWe", "Today's date is ", {}, { "e.date": PH.DATE })]),
  });
  const lq = lit(MAIN, "lQt", "# Language\n", {});
  add({
    id: "trailing-language", title: "Language block", group: G.trail,
    when: "Language attachment when a response language is configured; `{{LANGUAGE}}` is that language. When the preference is cleared the text is \"" + lit(MAIN, "Xje", "The language preference was cleared.").text() + "\" " + FOLD,
    body: compose([T(lq, { e: "{{LANGUAGE}}" })]),
  });
  add({
    id: "trailing-output-style", title: "Output style block", group: G.trail,
    when: "Output-style attachment when an output style is active: `{{STYLE_NAME}}` is its name and `{{STYLE_PROMPT}}` its prompt. When the style is reset the text is \"" + lit(MAIN, "Yje", "The output style was reset").text() + "\" " + FOLD,
    body: compose([T(lit(MAIN, "aQt", "# Output Style: "), { e: "{{STYLE_NAME}}", n: "{{STYLE_PROMPT}}" })]),
  });
  add({
    id: "trailing-session-context", title: "Session context block", group: G.trail,
    when: "Session-context attachment. `{{CONTEXT_ENTRIES}}` is one `# <key>` heading plus its value per present entry, in the order `userEmail`, `attachedProject`, `gitStatus`, `perforceMode`, joined with newlines. When the context changes later, the first line becomes \"The session context has changed; these values replace the earlier ones:\" (or names what triggered the re-read), and when every value is gone a single sentence says the earlier values no longer apply. " + FOLD,
    body: compose([T(lit(MAIN, "eWe", "\u0000\n\u0000\n\nIMPORTANT: this context"), { "?n": false, 's.join(`\n`)': "{{CONTEXT_ENTRIES}}" })]),
  });
  const lw = n => lit(MAIN, "lWe", n);
  const attr = lw("Attribution for git commits and pull requests you create from here on (");
  const provsA = [attr.prov(), lw("- End git commit messages with:").prov(), lw("- End pull request descriptions with:").prov()];
  const aWe = new Piece(MAIN, constNode(MAIN, "aWe").node), hQt = new Piece(MAIN, constNode(MAIN, "hQt").node), kQt = new Piece(MAIN, constNode(MAIN, "kQt").node);
  provsA.push(inlined(hQt.prov()));
  const body = [lw("- End git commit messages with:").text({ "DQe(e.commit)": "{{COMMIT_ATTRIBUTION}}" }), lw("- End pull request descriptions with:").text({ "DQe(e.pr)": "{{PR_ATTRIBUTION}}" })].join("\n");
  add({
    id: "attribution-reminder", title: "Attribution reminder", group: G.trail,
    when: "Sent as a `<system-reminder>` in the first user message in both captures (wrapper observed in the captures). The commit and PR lines are inserted as configured, with any `<system-reminder` / `</system-reminder` tag opener escaped to `&lt;` (from code). Shown for commit and PR lines that are not set by managed settings. When both lines come from managed settings the parenthetical's second clause is: \"" + kQt.text() + "\". A mixed form names the managed line. With neither line, the text is \"From here on, do not add attribution lines to git commit messages or pull request descriptions (…)\". When the user can follow from another device, a paragraph about sending files with SendUserFile is appended.",
    body: compose([[attr.text({ r: hQt.text(), 'n.join(`\n`)': body }, provsA), provsA]]),
  });
}

add({
  id: "layout-selection", title: "Layout selection (lean vs classic)", group: G.asm, kind: "other", key: null,
  when: "Lean when the prompt model is set and: `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT` is a true value (a false value forces classic); or the model is not an older model; or flag `tengu_velvet_tide` (default false) is on; or client-data key `simple_system_prompt` has a true entry whose key is a substring of the model ID. Otherwise classic. Older models: those without capability `lean_prompt` whose ID contains `claude-3-`, `haiku` or `sonnet`, or is `claude-opus-4-0`, `-4-1`, `-4-5`, `-4-6` or `-4-7`; also IDs outside the catalog when the provider is not `firstParty`, `anthropicAws`, `anthropicGoogleCloud` or `gateway`. `claude-mythos-5` and `-eap` IDs are never older models. The prompt model is the main-loop model, except that `CLAUDE_CODE_BREEZY_HORIZON` set to a model ID replaces it for every main-loop model (a false value turns remapping off), and otherwise client-data key `breezy_horizon` can map specific model IDs to another model ID. " + CAP_NOTE,
  flags: [{ name: "tengu_velvet_tide", default: false }], env: ["CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT", "CLAUDE_CODE_BREEZY_HORIZON", "CLAUDE_CODE_MODEL_CAPABILITIES"],
  models: [...MODELS.lean_prompt, "claude-mythos-5"],
  extra: { lean_models: [...MODELS.lean_prompt, "claude-mythos-5", "*-eap"], classic_models: ["claude-3-5-haiku", "claude-haiku-4-5", "claude-3-5-sonnet", "claude-3-7-sonnet", "claude-sonnet-4-0", "claude-sonnet-4-5", "claude-sonnet-4-6", "claude-sonnet-5", "claude-opus-4-0", "claude-opus-4-1", "claude-opus-4-5", "claude-opus-4-6", "claude-opus-4-7"] },
  body: { text: null, provenance: [prov("chunk-8p6r0vhj.js", decl("chunk-8p6r0vhj.js", "te", 5752).node), prov("chunk-8p6r0vhj.js", literals(C("chunk-8p6r0vhj.js").ast).find(n => shape(n) === "simple_system_prompt"))] },
});
add({
  id: "cache-blocks", title: "System blocks and cache breakpoints", group: G.asm, kind: "other", key: null,
  when: "The billing header, identity line and prompt pieces are grouped into system blocks. Default: header (no cache_control), identity (`{\"type\":\"ephemeral\"}`), then every other piece joined with a blank line into one block (`{\"type\":\"ephemeral\"}`). When global prompt caching applies (first-party or anthropicAws provider, first-party base URL, plus a client gate read at chunk-6b5jn77e.js offset 497837), a boundary marker is placed after the layout sections: the identity block is then sent without cache_control, the layout part gets `{\"type\":\"ephemeral\",\"scope\":\"global\"}` and the named sections get `{\"type\":\"ephemeral\"}`. `ttl: \"1h\"` is added when the query uses a one-hour cache TTL. cache_control is attached only when prompt caching is on for the query.",
  env: ["ANTHROPIC_BASE_URL", "_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL"],
  body: { text: null, provenance: [prov(MAIN, decl(MAIN, "TSe", 995061).node), prov(MAIN, decl(MAIN, "IU", 2002082).node), prov("chunk-cd3sgqch.js", constNode("chunk-cd3sgqch.js", "XM", 70447).node)] },
});
add({
  id: "tail-slots", title: "Tail slots (not emitted)", group: G.named, key: null, status: "not emitted in 2.1.280",
  when: "Two slots after the token line return nothing in 2.1.280.",
  body: { text: null, provenance: [prov(MAIN, decl(MAIN, "mVn", 1456204).node), prov(MAIN, decl(MAIN, "TVn", 1467700).node)] },
});

function resolveName(file, name, { record = true } = {}) {
  const w = where(file, name), n = C(w.file).decls.get(w.name);
  if (n?.init?.type === "Literal") { if (record) PENDING.constants[w.name] = String(n.init.value); return n.init.value; }
  throw new Error(`cannot resolve ${name}`);
}

// ---------------------------------------------------------------- checks
// 1) Every provenance range re-parses to literal(s) whose static text appears in the item text.
const problems = [];
// Static pieces of each provenance range, read back from the extracted file at its offset: a literal's own text
// between its slots (a "{memory_dir}" token, replaced at runtime, splits a piece); an array's string elements.
const sourceNode = p => {
  const f = files.get(p.file), bytes = readFileSync(`${ROOT}work/extracted/${p.file}`);
  const slice = bytes.subarray(p.binary_offset - f.file_offset, p.binary_offset - f.file_offset + p.length).toString("utf8");
  return acorn.parseExpressionAt(slice, 0, { ecmaVersion: "latest" });
};
const staticPieces = n => (n.type === "Literal" ? [String(n.value)] : n.quasis.map(q => q.value.cooked)).flatMap(t => t.split("{memory_dir}"));
// Rule: the pieces occur in order, and each gap between consecutive pieces reduces to nothing once {{…}}
// placeholders, recorded constant values and recorded slot fills are removed.
function inOrder(text, pieces, allowed) {
  const reduce = gap => { let g = gap; for (const v of allowed) g = g.split(v).join(""); return g.replace(/\{\{[^{}]*\}\}/g, ""); };
  const ps = pieces.filter(x => x !== "");
  const go = (k, from) => {
    if (k === ps.length) return true;
    for (let at = text.indexOf(ps[k], from); at !== -1; at = text.indexOf(ps[k], at + 1)) {
      if (k > 0 && reduce(text.slice(from, at)) !== "") continue;
      if (go(k + 1, at + ps[k].length)) return true;
      if (k === 0) continue;
    }
    return false;
  };
  return ps.length === 0 || go(0, 0);
}
let checkedRanges = 0;
for (const it of items) {
  if (!it.provenance.length || it.provenance.some(p => !Number.isInteger(p.binary_offset))) problems.push(`${it.id}: missing provenance`);
  if (it.text === null) continue;
  if (it.text.includes("{{expr:")) problems.push(`${it.id}: unresolved expression ${it.text.match(/\{\{expr:[^}]*\}\}/)[0]}`);
  const allowed = [...Object.values(it.details.constants ?? {}), ...(it.details.slots ?? []).map(f => f.value)].filter(v => v !== "").sort((a, b) => b.length - a.length);
  for (const p of it.provenance) {
    const node = sourceNode(p);
    const units = isStr(node) ? [node] : node.type === "ArrayExpression" ? node.elements.filter(e => e && isStr(e)) : [];
    if (!units.length) { problems.push(`${it.id}: provenance at ${p.binary_offset} is not a string literal or array`); continue; }
    for (const u of units) {
      checkedRanges++;
      if (!inOrder(it.text, staticPieces(u), allowed)) problems.push(`${it.id}: static pieces of the ${p.role} range at ${p.binary_offset} not matched in order`);
    }
  }
}

// 2) Reproduce the captures: main block from the reconstruction; trailing context and attribution
//    from the reconstruction's fixed text, with per-session values (paths, lists, model name) taken from the capture.
const byId = Object.fromEntries(items.map(i => [i.id, i.text]));
const latestIds = "Fable 5.1: 'claude-fable-5-1', Opus 5.5: 'claude-opus-5-5', Sonnet 5: 'claude-sonnet-5', Haiku 4.5: 'claude-haiku-4-5-20251001'";
const plug = (t, pairs) => pairs.reduce((acc, [k, v]) => acc.split(k).join(v), t);
const bl = t => ` - ${t}`;
function leanFor({ interactive }) {
  const sgText = [sg("# Session-specific guidance").text(), ...(interactive ? [bl(byId["session-guidance-shell"])] : []), bl(byId["session-guidance-skill"])].join("\n");
  return [byId["lean-harness"], byId["communication-lean"], byId["pronouns"], byId["action-caution"], sgText, byId["memory-lean"], byId["env-info"].replace("{{LATEST_MODEL_IDS}}", latestIds), byId["context-management"]].join("\n\n");
}
function classicFor() {
  // claude -p on claude-sonnet-4-6: no mid-conversation system messages, tengu_virtual_pancake on, Agent/Explore/Skill available, fork off.
  const injection = lit(MAIN, "uVn", "Tool results may include data from external sources.").text();
  const system = byId["classic-system"].replace(bl(injection), [bl(injection), bl(byId["pasted-content-bullet"])].join("\n"));
  const sgText = [sg("# Session-specific guidance").text(), bl(byId["session-guidance-agent-default"]), bl(byId["session-guidance-explore"]), bl(byId["session-guidance-skill"])].join("\n");
  return [byId["classic-intro"], system, byId["classic-doing-tasks"], byId["classic-actions-with-care"], byId["classic-using-tools"], byId["classic-tone-style"], byId["communication-classic"], byId["pronouns"], sgText, byId["memory-classic"], byId["env-info"].replace("{{LATEST_MODEL_IDS}}", latestIds), byId["context-management"]].join("\n\n");
}
const captures = [
  { path: "work/capture/req-02.json", ep: "sdk-cli", layout: "lean", interactive: false, label: "`claude -p` on `claude-opus-5-5` (entrypoint `sdk-cli`, lean layout)" },
  { path: "work/capture/interactive/req-03.json", ep: "cli", layout: "lean", interactive: true, label: "Interactive CLI on `claude-opus-5-5` (entrypoint `cli`, lean layout)" },
  { path: "work/capture/classic/req-02.json", ep: "sdk-cli", layout: "classic", interactive: false, label: "`claude -p` on `claude-sonnet-4-6` (entrypoint `sdk-cli`, classic layout)" },
];
const unwrap = t => t.replace(/^<system-reminder>\n/, "").replace(/\n<\/system-reminder>\n?$/, "");
const firstDiffOf = (a, b) => { if (a === b) return null; let i = 0; while (a[i] === b[i]) i++; return { at: i, reconstruction: JSON.stringify(a.slice(Math.max(0, i - 60), i + 120)), capture: JSON.stringify(b.slice(Math.max(0, i - 60), i + 120)) }; };
const diffs = [];
for (const cap of captures) {
  const body = JSON.parse(readFileSync(ROOT + cap.path, "utf8")).body;
  const mainCap = body.system[2].text, memDir = mainCap.match(/memory(?: system)? at `([^`]+)`/)[1];
  const main = mainCap.split(memDir).join(PH.MEMORY_DIR), mine = cap.layout === "lean" ? leanFor(cap) : classicFor();
  const idLine = cap.ep === "cli" ? byId["identity-cli"] : byId["identity-sdk"];
  const firstUser = body.messages[0].content.find(b => !b.text.startsWith("<system-reminder>")).text;
  const fp = createHash("sha256").update(`59cf53e54c78${[4, 7, 20].map(k => firstUser[k] || "0").join("")}${VERSION}`).digest("hex").slice(0, 3);
  const header = `x-anthropic-billing-header: cc_version=${VERSION}.${fp}; cc_entrypoint=${cap.ep};`;
  // Trailing context: one system message (lean captures) or separate reminder blocks in the first user message (classic capture).
  const texts = body.messages.flatMap(m => m.content.map(c => c.text));
  const all = texts.join("\n\n");
  const [, mName, mId, mCut] = all.match(/You are powered by the model named (.+?)\. The exact model ID is (\S+)\. Assistant knowledge cutoff is (.+?)\./);
  const parts = [
    plug(byId["trailing-environment"], [["{{CWD}}", all.match(/Primary working directory: (\S+)/)[1]], ["{{IS_GIT_REPO}}", "false"], ["{{PLATFORM}}", "darwin"], ["{{SHELL}}", all.match(/ - Shell: (\S+)/)[1]], ["{{OS_VERSION}}", "Darwin 27.0.0"]]),
    plug(byId["trailing-model"], [["{{MODEL_NAME}}", mName], ["{{MODEL_ID}}", mId], ["{{KNOWLEDGE_CUTOFF}}", mCut]]),
    plug(byId["trailing-agents"], [["{{AGENT_LINES}}", all.match(/Available agent types for the Agent tool:\n([\s\S]*?)\n\nWhen you launch/)[1]]]),
    plug(byId["trailing-skills"], [["{{SKILL_LINES}}", all.match(/Skill tool:\n\n([\s\S]*?)\n\nToday's date is|Skill tool:\n\n([\s\S]*?)\n<\/system-reminder>/).slice(1).find(Boolean)]]),
    plug(byId["trailing-date"], [["{{DATE}}", "2026-09-25"]]),
  ];
  const trailOK = cap.layout === "lean"
    ? parts.join("\n\n") === body.messages[1].content[0].text
    : parts.every((p, i) => unwrap(body.messages[0].content[i].text) === p);
  const attrIdx = cap.layout === "lean" ? 0 : 5;
  const attrMine = plug(byId["attribution-reminder"], [["{{COMMIT_ATTRIBUTION}}", all.match(/End git commit messages with:\n(.+)/)[1]], ["{{PR_ATTRIBUTION}}", "\u{1F916} Generated with [Claude Code](https://claude.com/claude-code)"]]);
  const attrText = body.messages[0].content[attrIdx].text;
  diffs.push({
    capture: cap.path, label: cap.label, model: body.model, layout: cap.layout,
    main_block_match: main === mine, identity_match: body.system[1].text === idLine, header_match: body.system[0].text === header,
    trailing_context_match: trailOK, attribution_match: attrText === `<system-reminder>\n${attrMine}\n</system-reminder>\n`,
    blocks: body.system.length, first_diff: firstDiffOf(mine, main),
  });
}

// ---------------------------------------------------------------- outputs
const GROUP_ORDER = Object.values(G);
const NAMED_ORDER = ["communication", "pronouns", "action-caution", "task-continuity", "fable-identity", "tool-param-json", "session-guidance", "memory", "env-info", "bg-session", "context-management", "brief", "focus-mode", "act-dont-rederive", "delivering-work", "overcorrection", "subagent-steer-delegation", "opus5-reduced-delegation", "heron-brook", "brook-heron", "willow-tern", "autonomy-append", "endconv-deferred-hint", "total-tokens", "tail-slots"];
const rank = it => (it.group === G.named ? NAMED_ORDER.findIndex(p => it.id.startsWith(p)) : 0);
items.sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || rank(a) - rank(b));
const CLIENT_DATA_KEYS = ["simple_system_prompt", "breezy_horizon", "turn_updates", "basalt_cove", "bison_cairn", "larch_cistern", "amber_astrolabe", "tengu_willow_tern", steerFlag, "tengu_heron_brook", "tengu_brook_heron", "tengu_lapis_anchor", "tengu_lapis_anchor_budget"];
const out = { area: "system-prompt", version: VERSION, items };
writeFileSync(ROOT + "outputs/system-prompt.json", JSON.stringify(out, null, 1) + "\n");
writeFileSync(ROOT + "outputs/system-prompt.md", renderMarkdown(out, { diffs }) + "\n");
console.log(`items: ${items.length}; string ranges checked: ${checkedRanges}`);
console.log(JSON.stringify(diffs, null, 1));
if (problems.length) { console.log("PROBLEMS:"); for (const p of problems) console.log(" - " + p); process.exitCode = 1; }
if (DEBUG) for (const it of items) console.log(`\n=== ${it.id}\n${it.text}`);


// ---------------------------------------------------------------- markdown
function fence(text) {
  const run = Math.max(0, ...[...text.matchAll(/~+/g)].map(m => m[0].length));
  const f = "~".repeat(Math.max(6, run + 1));
  return `${f}text\n${text}\n${f}`;
}
function srcNote(pv) {
  const p = pv[0];
  return `Source: \`${p.file}\` · offset ${p.binary_offset} · sha256 \`${p.sha256.slice(0, 8)}…\`${pv.length > 1 ? ` (+${pv.length - 1} more source range${pv.length > 2 ? "s" : ""})` : ""}`;
}
function cleanCapture(t, paths) {
  for (const [from, to] of paths) t = t.split(from).join(to);
  return t;
}
function captureExample(path, label) {
  const body = JSON.parse(readFileSync(ROOT + path, "utf8")).body;
  const all = [...body.system.map(b => b.text), ...body.messages.flatMap(m => m.content.map(c => c.text))].join("\n");
  const cwd = all.match(/Primary working directory: (\S+)/)[1], mem = all.match(/memory(?: system)? at `([^`]+)`/)[1];
  const paths = [[mem, "{{MEMORY_DIR}}"], [cwd, "{{CWD}}"]];
  const cc = b => (b.cache_control ? `cache_control ${JSON.stringify(b.cache_control)}` : "no cache_control");
  const out = [`### ${label}`, "", `Model \`${body.model}\`. Captured from \`${path.replace(/^work\//, "")}\`; temp paths replaced, device and session IDs dropped.`, ""];
  body.system.forEach((b, i) => out.push(`System block ${i + 1} (${cc(b)}):`, "", fence(cleanCapture(b.text, paths)), ""));
  body.messages.forEach((m, i) => m.content.forEach((c, j) => out.push(`Message ${i + 1} (role \`${m.role}\`), block ${j + 1} (${cc(c)}):`, "", fence(cleanCapture(c.text, paths)), "")));
  const leftover = out.join("\n").match(/\/tmp\/cc-ca[^\s`]*/);
  if (leftover) problems.push(`capture example still contains a temp path: ${leftover[0]}`);
  return out.join("\n");
}
function renderMarkdown(o, { diffs }) {
  const groups = [...new Set(o.items.map(i => i.group))];
  const L = [];
  L.push(`# Claude Code ${VERSION}: main system prompt`, "");
  L.push(`Reconstructed from the \`claude.exe\` ${VERSION} (${PLATFORM}) embedded JavaScript and checked against two captured API requests. Fenced text is exact. \`{{NAME}}\` marks a runtime value; the double-brace tokens inside the classic memory frontmatter template (\`{{short-kebab-case-slug}}\` and so on) are literal prompt text. Conditions are read from code. "Flag" means a remote feature flag, shown with its built-in default. "Client-data key" means a value in server-supplied client data. "Capability" means an entry in the built-in model catalog. Regenerate with \`node extract/system-prompt.mjs\`.`, "");
  L.push("## How the prompt is assembled", "");
  L.push("- **System blocks, in order** (see *System blocks and cache breakpoints*):");
  L.push("  1. The billing header, with no cache_control.");
  L.push("  2. The identity line, chosen by entrypoint (the three *Identity line* items).");
  L.push("  3. The main block: the layout sections, the named sections and the token line, joined with blank lines.");
  L.push("- **Global caching splits the main block.** When global prompt caching applies, the layout part and the named sections become two separately cached blocks.");
  L.push("- **Named sections are cached by key.** Each one is computed once, stored under its section key, and reused until the section cache is invalidated. Key suffixes (`:L` for lean, `:sdk`, `:send_user_msg`) keep the variants apart.");
  L.push("- **Per-session context arrives as attachments.** The environment, model line, agent listing, skill listing and date are attachments. For `claude-opus-5-5` (both lean captures) they arrive as one role-`system` message after the first user message. The parts are joined with blank lines and carry cache_control `{\"type\":\"ephemeral\"}`. For `claude-sonnet-4-6` (the classic capture) each part is its own `<system-reminder>` text block at the start of the first user message.");
  L.push("- **The attribution reminder goes in the first user message.** It is a `<system-reminder>` text block. In the lean captures it is the first block; in the classic capture it follows the context blocks and comes just before the user's text.");
  L.push("- **Simple mode** (`CLAUDE_CODE_SIMPLE`) replaces the entire main prompt with the *Simple mode prompt*.", "");
  L.push("## Layout selection", "");
  const ls = o.items.find(i => i.id === "layout-selection");
  L.push(ls.when, "");
  L.push(`- **Lean layout.** The *Lean layout* section is followed by the named sections. Models: ${ls.details.lean_models.map(m => `\`${m}\``).join(", ")}, plus IDs outside the catalog on the \`firstParty\`, \`anthropicAws\`, \`anthropicGoogleCloud\` and \`gateway\` providers.`);
  L.push(`- **Classic layout.** The sections are the intro, \`# System\`, \`# Doing tasks\` (omitted when an output style is active without \`keepCodingInstructions: true\`), \`# Executing actions with care\`, \`# Using your tools\` and \`# Tone and style\`, followed by the named sections. Models: ${ls.details.classic_models.map(m => `\`${m}\``).join(", ")}.`, "");
  L.push("## Section order", "");
  L.push("After the layout sections come the static memory text (only when dynamic sections are excluded), the global-cache boundary marker (never sent), and then the named sections, in this order:", "");
  L.push("`communication` · `pronouns` · `action_caution` · `task_continuity` · `fable_identity` · `tool_param_json` · `session_guidance` · `memory` (omitted when dynamic sections are excluded) · `env_info_simple` / `env_info_static` · `bg-session` · `context_management` · `brief` · `focus_mode` · `act_dont_rederive` · `delivering_work_max` · `overcorrection` · `subagent_steer_delegation` · `opus5_reduced_delegation` · `heron_brook` · `brook_heron` · `willow_tern` · `autonomy_append` · `endconv_deferred_hint`.", "");
  L.push("The token line and two tail slots follow. A section that returns nothing is dropped.", "");
  for (const g of groups) {
    L.push(`## ${g}`, "");
    for (const it of o.items.filter(i => i.group === g)) {
      L.push(`### ${it.title}`, "");
      L.push(srcNote(it.provenance), "");
      const meta = [it.details.section_key ? `Section key: \`${it.details.section_key}\`` : null, it.details.layout && it.details.layout !== "both" ? `Layout: ${it.details.layout}` : null, it.details.status ? `Status: ${it.details.status}` : null].filter(Boolean);
      if (meta.length) L.push(meta.join(" · "), "");
      L.push(`When: ${it.when}`, "");
      if (it.text !== null) L.push(fence(it.text), "");
      else L.push("Text: not in the binary or not rendered here (see When).", "");
    }
  }
  L.push("## Gating flags, env vars and client-data keys", "");
  const flags = new Map(), envs = new Set();
  for (const it of o.items) { for (const f of it.details.flags) flags.set(f.name, f.default); for (const e of it.details.env_vars) envs.add(e); }
  L.push("Flags (default):", "", ...[...flags].sort().map(([n, d]) => `- \`${n}\` (${JSON.stringify(d)})`), "");
  L.push("Env vars:", "", ...[...envs].sort().map(e => `- \`${e}\``), "");
  L.push("Client-data keys: " + CLIENT_DATA_KEYS.map(k => `\`${k}\``).join(", ") + ". Runtime config key: `juniper_shoal.bracken_spool`.", "");
  L.push("## Capture check", "");
  for (const d of diffs) L.push(`- ${d.label}: main block ${d.main_block_match ? "matches the reconstruction exactly" : "DIFFERS"}; identity line ${d.identity_match ? "matches" : "DIFFERS"}; billing header ${d.header_match ? "matches, including the recomputed fingerprint" : "DIFFERS"}; trailing context ${d.trailing_context_match ? "matches" : "DIFFERS"}; attribution reminder ${d.attribution_match ? "matches" : "DIFFERS"}; ${d.blocks} system blocks.`);
  L.push("", "For the trailing context and the attribution reminder, the fixed text comes from the reconstruction and the per-session values come from the capture: paths, the agent and skill lines, the model name and the attribution lines.", "");
  L.push("Capture conditions: a custom `ANTHROPIC_BASE_URL`, so there is no `cch=` field and no global-cache split. Served flags: `tengu_virtual_pancake` true, `tengu_cedar_lantern` false and `tengu_lapis_anchor` `off`; every other flag listed above was at its default or off. The two `claude-opus-5-5` main blocks differ only in the shell-command bullet, which appears in interactive sessions only.", "");
  L.push("## Rendered examples", "");
  for (const c of captures) L.push(captureExample(c.path, c.label), "");
  return L.join("\n");
}
