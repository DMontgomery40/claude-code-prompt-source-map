#!/usr/bin/env node
// Mid-conversation injections in Claude Code 2.1.280: <system-reminder> blocks, attachment
// messages, hook-output wrappers, plan-mode / todo / task reminders, and harness-written
// tool-result notes. Writes outputs/system-reminders.{json,md}.
//
// Each item names an anchor: a substring of one string literal in an embedded chunk. The script
// finds that literal, climbs to the enclosing template / concatenation, and renders it:
//   - module-level string constants are inlined (recorded in details.constants),
//   - fields of the attachment or other parameters become {{field}},
//   - escaping helpers around a field (bu, e_, J_e, qoe, DQe) are transparent: {{field}},
//   - anything else becomes {{expr:<raw expression>}}.
// A self-check re-parses the bytes at each provenance offset and confirms every static string
// piece appears, in order, in the published text.
import { readFileSync, writeFileSync } from "node:fs";
import * as walk from "acorn-walk";
import * as acorn from "acorn";
import { source, parse, provenance, files as manifest, VERSION, PLATFORM } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const MAIN = "chunk-dt8bvbsd.js";

// ---------- module graph and module-level constant resolution ----------
const infoCache = new Map();
function info(file) {
  if (infoCache.has(file)) return infoCache.get(file);
  const src = source(file); const ast = parse(src);
  const imports = new Map(), exports = new Map(), decls = new Map(), topVars = new Set();
  for (const node of ast.body) {
    if (node.type === "ImportDeclaration") for (const s of node.specifiers) if (s.type === "ImportSpecifier") imports.set(s.local.name, { from: node.source.value.replace(/^(\.\/|\/\$bunfs\/root\/)/, ""), name: s.imported.name ?? s.imported.value });
    if (node.type === "ExportNamedDeclaration" && !node.declaration) for (const s of node.specifiers) exports.set(s.exported.name ?? s.exported.value, s.local.name);
    if (node.type === "VariableDeclaration") for (const d of node.declarations) if (d.id.type === "Identifier") { topVars.add(d.id.name); if (d.init) decls.set(d.id.name, d.init); }
    if (node.type === "FunctionDeclaration" && node.id) { topVars.add(node.id.name); decls.set(node.id.name, node); }
  }
  // lazily-initialised module constants: `X = value` for a top-level `var X`
  walk.simple(ast, { AssignmentExpression(n) { if (n.operator === "=" && n.left.type === "Identifier" && topVars.has(n.left.name) && !decls.has(n.left.name)) decls.set(n.left.name, n.right); } });
  const t = { src, ast, imports, exports, decls, topVars }; infoCache.set(file, t); return t;
}
function resolveTop(file, name, depth = 0) {
  const t = info(file);
  if (t.decls.has(name)) return { file, node: t.decls.get(name) };
  const imp = t.imports.get(name);
  if (!imp || depth > 12) return null;
  return resolveTop(imp.from, info(imp.from).exports.get(imp.name) ?? imp.name, depth + 1);
}

// ---------- scopes: names declared by enclosing functions ----------
const scopeCache = new WeakMap();
function patternNames(p, out) {
  if (!p) return;
  if (p.type === "Identifier") out.add(p.name);
  else if (p.type === "ObjectPattern") for (const q of p.properties) patternNames(q.type === "RestElement" ? q.argument : q.value, out);
  else if (p.type === "ArrayPattern") for (const q of p.elements) patternNames(q, out);
  else if (p.type === "AssignmentPattern") patternNames(p.left, out);
  else if (p.type === "RestElement") patternNames(p.argument, out);
}
function declaredIn(fn) {
  if (scopeCache.has(fn)) return scopeCache.get(fn);
  const out = new Set(); for (const p of fn.params) patternNames(p, out);
  walk.simple(fn.body, { VariableDeclarator(n) { patternNames(n.id, out); }, CatchClause(n) { patternNames(n.param, out); }, Function(n) { for (const p of n.params) patternNames(p, out); if (n.id) out.add(n.id.name); } });
  scopeCache.set(fn, out); return out;
}

// ---------- locating the literal for an anchor ----------
const locCache = new Map();
function stringNodes(file) {
  if (locCache.has(file)) return locCache.get(file);
  const list = [];
  walk.fullAncestor(info(file).ast, (n, _s, anc) => {
    const v = n.type === "Literal" && typeof n.value === "string" ? n.value : n.type === "TemplateElement" ? n.value.cooked : null;
    if (v) list.push({ node: n, value: v, anc: [...anc] });
  });
  locCache.set(file, list); return list;
}
function locate(file, anchor, { nth = 0, climb = "concat" } = {}) {
  // anchors may span `${expr}` (raw minified form); search on the longest static piece, then
  // keep literals whose enclosing template source contains the whole anchor
  const pieces = anchor.split(/\$\{[^}]*\}/); const key = pieces.reduce((a, b) => (b.length > a.length ? b : a), "");
  const src = info(file).src;
  const hits = stringNodes(file).filter(h => h.value.includes(key) && (pieces.length === 1 || src.slice(h.anc.at(-2).start, h.anc.at(-2).end).replace(/\\n/g, "\n").includes(anchor)));
  if (hits.length <= nth) throw new Error(`anchor not found in ${file}: ${anchor}`);
  const h = hits[nth]; const anc = h.anc; let i = anc.length - 1; // anc ends with the node itself
  let node = h.node;
  if (node.type === "TemplateElement") { i--; node = anc[i]; }
  if (climb === "concat") while (anc[i - 1]?.type === "BinaryExpression" && anc[i - 1].operator === "+") { i--; node = anc[i]; }
  return { node, anc: anc.slice(0, i), hits: hits.length, literal: h.node };
}

// ---------- rendering ----------
const TRANSPARENT = new Set(["bu", "e_", "J_e", "DQe", "WK", "kM"]);
const rawOf = (file, n) => info(file).src.slice(n.start, n.end).replace(/\n/g, "\\n");
// A local declared once as `x = <field>` (possibly through String(), `?? ""` or an escaping helper) or as a
// `.map(…).join(…)` list renders as that field / list.
function localAlias(name, anc) {
  for (let k = anc.length - 1; k >= 0; k--) {
    const fn = anc[k]; if (!/Function/.test(fn.type) || !declaredIn(fn).has(name)) continue;
    if (fn.params.some(p => { const o = new Set(); patternNames(p, o); return o.has(name); })) return null;
    // the visible declaration: a `let/var` statement directly inside the innermost ancestor block that has one
    let decl = null;
    for (let b = anc.length - 1; b > k && !decl; b--) {
      const blk = anc[b]; const stmts = blk.type === "BlockStatement" ? blk.body : blk.type === "SwitchCase" ? blk.consequent : null;
      if (!stmts) continue;
      for (const st of stmts) if (st.type === "VariableDeclaration") for (const d of st.declarations) if (d.id.type === "Identifier" && d.id.name === name) decl = d;
    }
    if (!decl?.init) return null;
    let init = decl.init;
    for (;;) {
      if (init.type === "CallExpression" && init.callee.type === "Identifier" && (TRANSPARENT.has(init.callee.name) || init.callee.name === "String") && init.arguments.length === 1) init = init.arguments[0];
      else if (init.type === "LogicalExpression" && init.operator === "??" && init.right.type === "Literal" && init.right.value === "") init = init.left;
      else break;
    }
    const isList = init.type === "CallExpression" && init.callee.type === "MemberExpression" && init.callee.property.name === "join" && init.callee.object.type === "CallExpression" && init.callee.object.callee.property?.name === "map";
    if (init.type === "MemberExpression" || isList) return { init, anc: anc.slice(0, k + 1) };
    return null;
  }
  return null;
}
function isLocal(name, anc) { return anc.some(a => /Function/.test(a.type) && declaredIn(a).has(name)); }
function memberPath(n) {
  const parts = [];
  while (n.type === "MemberExpression" && !n.computed && n.property.type === "Identifier") { parts.unshift(n.property.name); n = n.object; }
  if (n.type === "ChainExpression") return memberPath(n.expression);
  return n.type === "Identifier" ? { root: n.name, parts } : null;
}
function render(file, node, anc, ctx) {
  const rec = (n) => render(file, n, anc, ctx);
  switch (node.type) {
    case "Literal": return typeof node.value === "string" ? node.value : `{{expr:${rawOf(file, node)}}}`;
    case "TemplateLiteral": {
      let s = "";
      node.quasis.forEach((q, k) => { s += q.value.cooked; if (k < node.expressions.length) s += rec(node.expressions[k]); });
      return s;
    }
    case "BinaryExpression": {
      const stringy = n => (n.type === "Literal" && typeof n.value === "string") || n.type === "TemplateLiteral" || (n.type === "BinaryExpression" && n.operator === "+" && (stringy(n.left) || stringy(n.right)));
      if (node.operator === "+" && stringy(node)) return rec(node.left) + rec(node.right);
      break;
    }
    case "ChainExpression": return rec(node.expression);
    case "Identifier": {
      if (!isLocal(node.name, anc)) {
        const r = resolveTop(file, node.name);
        if (r && (r.node.type === "Literal" && typeof r.node.value === "string" || r.node.type === "TemplateLiteral" || (r.node.type === "BinaryExpression" && r.node.operator === "+"))) {
          const v = render(r.file, r.node, [], ctx);
          if (!v.includes("{{")) ctx.constants[node.name] = v;
          return v;
        }
        if (r && r.node.type === "Literal" && typeof r.node.value === "number") { ctx.constants[node.name] = String(r.node.value); return String(r.node.value); }
      }
      if (ctx.itemParams?.has(node.name)) return "{{item}}";
      const al = isLocal(node.name, anc) ? localAlias(node.name, anc) : null;
      if (al) { const v = render(file, al.init, al.anc, ctx); if (!v.startsWith("{{expr:")) return v; }
      return `{{expr:${node.name}}}`;
    }
    case "MemberExpression": {
      const mp = memberPath(node);
      if (mp && isLocal(mp.root, anc)) return `{{${mp.parts.join(".")}}}`;
      if (mp && !isLocal(mp.root, anc)) { // module-level object with a literal property (e.g. an agent definition's agentType)
        const r = resolveTop(file, mp.root);
        if (r?.node.type === "ObjectExpression" && mp.parts.length === 1) {
          const p = r.node.properties.find(q => q.key && (q.key.name ?? q.key.value) === mp.parts[0]);
          if (p?.value.type === "Literal" && typeof p.value.value === "string") { ctx.constants[`${mp.root}.${mp.parts[0]}`] = p.value.value; return p.value.value; }
          if (p?.value.type === "Identifier") { const v = rec({ ...p.value }); return v; }
        }
      }
      break;
    }
    case "CallExpression": {
      if (node.callee.type === "Identifier" && TRANSPARENT.has(node.callee.name) && node.arguments.length === 1) {
        const inner = rec(node.arguments[0]); if (/^\{\{[^}]*\}\}$/.test(inner)) return inner;
      }
      // $m(cond, text): the foreign-artifact marker helper returns a marker block around text, or ""
      if (node.callee.type === "Identifier" && node.callee.name === "$m" && node.arguments.length === 2) {
        const r = resolveTop(file, "$m"); const ret = r?.node.body?.body?.[0]?.argument;
        if (ret?.type === "ConditionalExpression") {
          const inner = rec(node.arguments[1]);
          const A = render(r.file, ret.consequent, [r.node], { ...ctx, constants: {} }).replace("{{expr:r}}", inner);
          const test = rawOf(file, node.arguments[0]);
          (ctx.variants ??= []).push({ condition: test, A, B: render(r.file, ret.alternate, [r.node], { ...ctx, constants: {} }) });
          return `{{expr:${test} ? A : B}}`;
        }
      }
      if (node.callee.type === "Identifier" && node.callee.name === "qoe" && node.arguments.length === 2) {
        const inner = rec(node.arguments[1]); if (/^\{\{[^}]*\}\}$/.test(inner)) return inner;
      }
      break;
    }
  }
  // X.map(cb).join(sep): a list; the per-entry format goes to details.lists
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.property.name === "join" && node.callee.object.type === "CallExpression" && node.callee.object.callee.type === "MemberExpression" && node.callee.object.callee.property.name === "map") {
    const list = node.callee.object.callee.object, cb = node.callee.object.arguments[0];
    const sepNode = node.arguments[0]; const sep = sepNode ? render(file, sepNode, anc, ctx) : ",";
    const name = rec(list); const cbAnc = [...anc, cb];
    const first = cb?.params?.[0]?.type === "Identifier" ? cb.params[0].name : null;
    const saved = ctx.itemParams; ctx.itemParams = new Set([...(saved ?? []), ...(first ? [first] : [])]);
    const entry = cb && /Function/.test(cb.type) && cb.body.type !== "BlockStatement" ? render(file, cb.body, cbAnc, ctx) : cb?.type === "Identifier" && TRANSPARENT.has(cb.name) ? "{{item}}" : "{{expr:entry}}";
    ctx.itemParams = saved;
    const ph = /^\{\{[^}]*\}\}$/.test(name) ? name : `{{expr:${rawOf(file, list)}}}`;
    (ctx.lists ??= []).push({ placeholder: ph, entry_format: entry, separator: sep });
    return ph;
  }
  const raw = rawOf(file, node);
  if (node.type === "ConditionalExpression" && raw.length > 160) {
    const test = rawOf(file, node.test);
    (ctx.variants ??= []).push({ condition: test, A: rec(node.consequent), B: rec(node.alternate) });
    return `{{expr:${test} ? A : B}}`;
  }
  if (raw.length > 200) ctx.warnings.push(`long expr in ${ctx.id}: ${raw.slice(0, 80)}…`);
  return `{{expr:${raw}}}`;
}

// ---------- shared wording (all from code; locations in details.delivery_provenance) ----------
const WRAP_UI = "Wrapped in <system-reminder> tags (every text block of the attachment's rendered messages).";
const WRAP_UA = "Wrapped in <system-reminder> tags.";
const WRAP_NONE = "Not wrapped.";
const PLACE_FOLD = "Attachment rendered as a meta user message. On models with the mid-conversation system capability, the rendered text is instead folded (tags stripped, except for claude-sonnet-5) into a role-system message.";
const PLACE_USER = "Attachment rendered as a meta user message. Excluded from system-role folding, so it stays in the user turn on every model.";
const PLACE_TOOL = "Inside a tool_result block.";

// ---------- items ----------
// a: anchor, f: file (default MAIN), nth, climb: "concat" | "template"; type: attachment type; wrap; place; when; details
const I = [];
const add = (group, o) => I.push({ group, ...o });

const G_DELIV = "Other";
add(G_DELIV, { id: "system-reminder-wrapper", title: "<system-reminder> wrapper", a: "<system-reminder>", f: "chunk-nj6jrnt8.js", literalOnly: true, textOverride: "<system-reminder>\n{{content}}\n</system-reminder>",
  wrap: "This is the wrapper.", place: "Applied to attachment output, task notifications, hook messages and tool-result notes.",
  when: "From code: the wrapper function joins the opening tag, a newline, the content, a newline and the closing tag. The attachment renderer wraps each text block with it; some tool results and hook messages call it directly.",
  details: { opening_tag: "<system-reminder>", closing_tag: "</system-reminder>", strip_rule: "When attachments are folded into a system-role message, a single outer <system-reminder> pair (and one adjacent newline on each side) is removed." } });
add(G_DELIV, { id: "system-role-folding", title: "System-role folding of attachments", a: "reminderFromRecords", noText: true, f: MAIN, useCodeAnchor: "foldedAttachmentTypes",
  wrap: "Tags stripped, except for claude-sonnet-5, where each folded block is re-wrapped.", place: "Role-system message placed after the user turn (for example, the trailing system message in a captured first request that carries environment, agent listing, skill listing and date).",
  when: "From code: in message normalisation, when the main-loop model has the mid_conversation_system capability (from model capabilities; forced on by CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM; off in HIPAA mode and for claude-opus-4-8), rendered attachments are collected into one api_system (role: system) message instead of a meta user message. Excluded types stay as user messages: dir_sync_notice, unknown_command_fallback, session_context, instructions, coordinator_context, context_sections, remote_session_change, fork_briefing, poll_events, cowork_memory_context, artifact_opening_prefetch, some queued_command variants, and relevant_memories when flag tengu_mill_orange (default false) is on. batching_reminder and secondary_reminder are dropped entirely on models without this capability.",
  details: { unwrapped_meta_messages: "When the model lacks the capability and flag tengu_chair_sermon (default false) is on, attachment messages that are not already wrapped are wrapped in <system-reminder> tags.", capture_evidence: "work/capture/req-02.json and work/capture/interactive/req-03.json: message 1 is role system and starts with '# Environment', followed by the agent listing, skill listing and 'Today's date is …', without <system-reminder> tags; message 0 (user) begins with the attribution <system-reminder>." } });
add(G_DELIV, { id: "attachment-collection", title: "Attachment collection per turn", noText: true, useCodeAnchor: "at_mentioned_files",
  wrap: "n/a", place: "n/a",
  when: "From code: attachments are gathered before each model request. With CLAUDE_CODE_DISABLE_ATTACHMENTS, CLAUDE_CODE_SIMPLE or a bare fork, only four collectors run: queued commands, sandbox instructions, the agent listing delta and one further collector (not traced). Delegated-observation subagents get none. Collection is aborted after 1000 ms. The main thread (no agentId) also collects IDE selection/opened file, output style, diagnostics, LSP diagnostics, task status, async hook responses, memory updates and token usage; subagents skip that group. @-mention, MCP resource and agent-mention attachments are collected only when there is user input.",
  details: { main_thread_only: ["workflow_keyword_request", "ultra_effort_enter", "workflow_size_guideline_change", "selected_lines_in_ide", "opened_file_in_ide", "output_style", "diagnostics", "task_status", "async_hook_response", "memory_update", "token_usage", "output_token_usage"], env: ["CLAUDE_CODE_DISABLE_ATTACHMENTS", "CLAUDE_CODE_SIMPLE", "CLAUDE_CODE_EVAL_CONFINED"] } });
add(G_DELIV, { id: "attribution-reminder", title: "Git attribution reminder", type: "remote_session_change", a: "Attribution for git commits and pull requests you create from here on",
  wrap: WRAP_UI, place: PLACE_USER + " Captured as the first block of the first user message.",
  when: "From code: rendered from the remote_session_change attachment when commit and/or pull-request attribution lines are configured. {{expr:r}} is the precedence clause (see attribution-precedence-clause).",
  details: { capture_evidence: "work/capture/req-02.json and work/capture/interactive/req-03.json message 0 block 0: rebuilt byte-for-byte from this template, attribution-precedence-default and the commit/PR line templates, wrapped in <system-reminder>; the captured block carries one extra trailing newline after the closing tag (its source was not traced)." } });
add(G_DELIV, { id: "attribution-reminder-none", title: "Git attribution reminder (no attribution)", type: "remote_session_change", a: "From here on, do not add attribution lines to git commit messages",
  wrap: WRAP_UI, place: PLACE_USER, when: "From code: same attachment when neither a commit nor a pull-request attribution line is set." });
add(G_DELIV, { id: "attribution-precedence-clause", title: "Attribution precedence clause (mixed managed settings)", a: "line is set by the user's organization's managed settings",
  wrap: "Part of attribution-reminder.", place: "Inside the attribution reminder.", when: "From code: used when only one of the commit/PR lines comes from managed settings." });
add(G_DELIV, { id: "attribution-send-file-hint", title: "Attribution reminder: send-file hint", a: "The user can follow this conversation from another device",
  wrap: "Part of attribution-reminder.", place: "Appended to the attribution reminder.", when: "From code: appended when the attachment's sendUserFileHint is set." });
add(G_DELIV, { id: "ambient-context-suffix", title: "Ambient-context suffix", a: "This is ambient context",
  wrap: "Appended inside the wrapped block.", place: "Suffix on several attachments (agent/MCP/tool removals, memory updates, coordinator context, context sections, tool-host notices).",
  when: "From code: appended after removal notices and ambient context blocks." });

const G_PLAN = "Plan mode and modes";
add(G_PLAN, { id: "plan-mode-full", title: "Plan mode (full reminder)", type: "plan_mode", a: "You should build your plan incrementally by writing to or editing this file. NOTE that this is the only file you are allowed to edit - other than this you are only allowed to take READ-ONLY actions.${h}",
  slots: { "{{expr:n}}": "plan-mode-file-exists or plan-mode-file-missing", "{{expr:h}}": "plan-mode-workshop-offer or empty", "{{expr:r}}": "plan-mode-workshop-active or empty", "{{expr:y}}": "plan-mode-prototype-offer or empty", "{{expr:s}}": "plan-mode-phase1-agents or plan-mode-phase1-direct", "{{expr:g}}": "plan-mode-phase2-agents or plan-mode-phase2-direct", "{{expr:q8r(e.workshopOfferDocPath!==void 0||e.workshopActiveDocPath!==void 0)}}": "plan-mode-phase4", "{{expr:TYt(e.workshopActiveDocPath)}}": "plan-mode-phase5" },
  wrap: WRAP_UI, place: PLACE_FOLD,
  when: "From code: permission mode is plan. At most one plan_mode attachment per 5 real (non-meta) user turns since the last plan_mode/plan_mode_reentry attachment; attachments 1, 6, 11, … in the plan-mode stretch are full, the rest sparse. Main agent only (subagents get plan-mode-subagent).",
  details: { throttle: { TURNS_BETWEEN_ATTACHMENTS: 5, FULL_REMINDER_EVERY_N_ATTACHMENTS: 5 }, parts: ["plan-mode-header", "plan-mode-file-exists / plan-mode-file-missing", "plan-mode-workshop-offer", "plan-mode-workshop-active", "plan-mode-prototype-offer", "plan-mode-phase1-*", "plan-mode-phase2-*", "plan-mode-phase3", "plan-mode-phase4", "plan-mode-phase5"] } });
add(G_PLAN, { id: "plan-mode-full-custom", title: "Plan mode (full, custom workflow)", type: "plan_mode", a: "## Plan Workflow\n\n", nth: 0,
  slots: { "{{expr:n}}": "plan-mode-file-exists or plan-mode-file-missing", "{{expr:r}}": "plan-mode-workshop-active or empty", "{{customInstructions}}": "options.planModeInstructions", "{{expr:TYt(e.workshopActiveDocPath)}}": "plan-mode-phase5" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: full reminder when options.planModeInstructions is set (SDK/custom); the custom instructions replace the five phases." });
add(G_PLAN, { id: "plan-mode-header", title: "Plan mode header", a: "Plan mode is active. The user indicated that they do not want you to execute yet -- you MUST NOT make any edits (with the exception",
  wrap: "Part of plan-mode-full.", place: "First paragraph of the full reminder.", when: "From code: opens both full variants." });
add(G_PLAN, { id: "plan-mode-file-exists", title: "Plan file info (file exists)", a: "A plan file already exists at ${e.planFilePath}. You can read it and make incremental edits using the ${Ft} tool.", climb: "template",
  wrap: "Part of plan-mode-full.", place: "Plan File Info section.", when: "From code: a plan file already exists for this session." });
add(G_PLAN, { id: "plan-mode-file-missing", title: "Plan file info (no file yet)", a: "No plan file exists yet. You should create your plan at ${e.planFilePath} using the ${vn} tool.", climb: "template",
  wrap: "Part of plan-mode-full.", place: "Plan File Info section.", when: "From code: no plan file exists yet." });
add(G_PLAN, { id: "plan-mode-workshop-offer", title: "Plan mode: interactive workshop option", a: "## Interactive Workshop Option",
  wrap: "Part of plan-mode-full.", place: "After Plan File Info.", when: "From code: first full reminder of the main agent, when the workshop feature is available and not already active (plan_workshop_offer)." });
add(G_PLAN, { id: "plan-mode-workshop-active", title: "Plan mode: workshop in progress", a: "A decision workshop is in progress for this session",
  wrap: "Part of plan-mode-full.", place: "After Plan File Info.", when: "From code: a workshop document is active for this session." });
add(G_PLAN, { id: "plan-mode-prototype-offer", title: "Plan mode: prototype artifact option", a: "## Prototype Artifact Option",
  wrap: "Part of plan-mode-full.", place: "After Plan File Info.", when: "From code: first full reminder when the prototype offer is enabled and no workshop offer/activity applies." });
add(G_PLAN, { id: "plan-mode-phase1-agents", title: "Plan mode Phase 1 (with Explore agents)", a: "Critical: In this phase you should only use the ${MS.agentType} subagent type.", climb: "template",
  wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: when the plan-agents path is enabled and its mode is default; otherwise plan-mode-phase1-direct." });
add(G_PLAN, { id: "plan-mode-phase1-direct", title: "Plan mode Phase 1 (read directly)", a: "2. Read and explore the relevant files directly to efficiently understand the codebase.",
  wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: alternative to plan-mode-phase1-agents." });
add(G_PLAN, { id: "plan-mode-phase2-agents", title: "Plan mode Phase 2 (with Plan agents)", a: "agent(s) to design the implementation based on the user's intent",
  wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: same condition as plan-mode-phase1-agents. The multiple-agents block appears when more than one agent is allowed." });
add(G_PLAN, { id: "plan-mode-phase2-direct", title: "Plan mode Phase 2 (direct)", a: "Goal: Design an implementation approach based on the user's intent and your exploration results from Phase 1.\n\n- Provide",
  wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: alternative to plan-mode-phase2-agents." });
add(G_PLAN, { id: "plan-mode-phase3", title: "Plan mode Phase 3", a: "### Phase 3: Review", wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: always in the five-phase reminder." });
add(G_PLAN, { id: "plan-mode-phase4", title: "Plan mode Phase 4", a: "### Phase 4: Final Plan", wrap: "Part of plan-mode-full.", place: "Plan Workflow.", when: "From code: always in the five-phase reminder; the workshop clause appears when a workshop is offered or active." });
add(G_PLAN, { id: "plan-mode-phase5", title: "Plan mode Phase 5 / end-of-turn rule", a: "At the very end of your turn, once you have asked the user questions and are happy with your final plan file",
  wrap: "Part of plan-mode-full.", place: "Under '### Phase 5: Call ExitPlanMode' (or '### Call ExitPlanMode' in the custom variant).", when: "From code: always in the full reminder." });
add(G_PLAN, { id: "plan-mode-sparse", title: "Plan mode (sparse reminder)", type: "plan_mode", a: "Plan mode still active (see full instructions earlier in conversation)",
  slots: { "{{expr:r}}": "workshop document clause when a workshop is active, else empty", "{{expr:n}}": "'Follow 5-phase workflow.' or, with custom instructions, 'Follow the plan workflow described earlier.'", "{{expr:t6t({workshopActive:e.workshopActiveDocPath!==void 0,form:\"sparse\"})}}": "plan-mode-sparse-end" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: plan_mode attachments that are not the 1st, 6th, 11th, … of the stretch." });
add(G_PLAN, { id: "plan-mode-sparse-end", title: "Plan mode sparse end-of-turn rule", a: "(for clarifications) or ${bd} (for plan approval)", climb: "template",
  wrap: "Part of plan-mode-sparse.", place: "End of the sparse reminder.", when: "From code: always in the sparse reminder." });
add(G_PLAN, { id: "plan-mode-subagent", title: "Plan mode (subagent)", type: "plan_mode", a: "Answer the user's query comprehensively, using the ${zs} tool if you need to ask",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: plan mode active and the attachment is for a subagent (agentId set)." });
add(G_PLAN, { id: "plan-mode-reentry", title: "Re-entering plan mode", type: "plan_mode_reentry", a: "## Re-entering Plan Mode",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: entering plan mode after having exited it earlier in the session, when a plan file exists; emitted together with the plan_mode attachment." });
add(G_PLAN, { id: "plan-mode-exit", title: "Exited plan mode", type: "plan_mode_exit", a: "You have exited plan mode. You can now make edits, run tools, and take actions.",
  slots: { "{{expr:n}}": "' The plan file is located at {{planFilePath}} if you need to reference it.' when the plan file exists, else empty" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: mode is no longer plan and either the session flag needsPlanModeExitAttachment is set or a plan_mode attachment appears since the last exit. The suffix naming the plan file appears when the plan file exists." });
add(G_PLAN, { id: "plan-file-reference", title: "Plan file reference", type: "plan_file_reference", a: "A plan file exists from plan mode at:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });
add(G_PLAN, { id: "plan-rejected", title: "Plan rejected (stay in plan mode)", a: "The agent proposed a plan that was rejected by the user.",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "Undocumented; text constant read in code (used for the ExitPlanMode rejection result)." });
add(G_PLAN, { id: "output-style-active", title: "Output style active", type: "output_style", a: " output style is active. ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, the settings outputStyle is not 'default' and the style resolves. {{expr:…}} is the style's turn reminder (or its waiting-turn reminder while a background task started by a tool is running), defaulting to the literal sentence shown. Suppressed if the style name exceeds 256 characters." });
add(G_PLAN, { id: "ultrathink-effort", title: "ultrathink keyword", type: "ultrathink_effort", a: "The user included the keyword \"ultrathink\"",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the prompt matches /\\bultrathink\\b/i and flag tengu_turtle_carbon (default true) is on." });
add(G_PLAN, { id: "workflow-keyword-request", title: "ultracode keyword", type: "workflow_keyword_request", a: "The user included the keyword \"ultracode\"",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, human-typed prompt containing the workflow keyword, the setting workflowKeywordTriggerEnabled is not false, and a further gate (not traced) holds." });
add(G_PLAN, { id: "ultra-effort-enter-full", title: "Ultracode on (full)", type: "ultra_effort_enter", a: "Ultracode is on: optimize for the most exhaustive",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, on a regular user prompt, when the producer's ultra-effort check is true and the most recent ultra_effort_* attachment is not an enter." });
add(G_PLAN, { id: "ultra-effort-enter-sparse", title: "Ultracode still on (sparse)", type: "ultra_effort_enter", a: "Ultracode is still on",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the ultra-effort check is still true and a threshold of non-meta user turns has passed since the last enter reminder." });
add(G_PLAN, { id: "ultra-effort-exit", title: "Ultracode off", type: "ultra_effort_exit", a: "Ultracode is off",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the ultra-effort check is false and the most recent ultra_effort_* attachment was an enter." });

const G_TODO = "Todo and task tracking";
add(G_TODO, { id: "todo-reminder", title: "TodoWrite reminder", type: "todo_reminder", a: "The TodoWrite tool hasn't been used recently.",
  wrap: WRAP_UI, place: PLACE_FOLD,
  when: "From code: the todo tools are enabled (a gate that includes CLAUDE_CODE_ENABLE_TODO_TOOLS) but CLAUDE_CODE_ENABLE_TASKS is false (otherwise task_reminder is used instead), the TodoWrite tool is present, there is conversation history, the reminder mode is not 'off' (CLAUDE_CODE_TODO_REMINDER_MODE, else flag tengu_soft_slate_nudge default 'baseline'), and at least 10 assistant messages have passed since the last TodoWrite call and since the last todo_reminder.",
  details: { throttle: { TURNS_SINCE_WRITE: 10, TURNS_BETWEEN_REMINDERS: 10, counted: "assistant messages" }, env: ["CLAUDE_CODE_TODO_REMINDER_MODE", "CLAUDE_CODE_ENABLE_TASKS"], flag: { tengu_soft_slate_nudge: "baseline" } } });
add(G_TODO, { id: "todo-reminder-list", title: "TodoWrite reminder: existing list", type: "todo_reminder", a: "Here are the existing contents of your todo list:",
  wrap: "Part of todo-reminder.", place: "Appended to todo-reminder.", when: "From code: the current todo list is non-empty. Each line is '{{index}}. [{{status}}] {{content}}'." });
add(G_TODO, { id: "task-reminder", title: "Task tools reminder", type: "task_reminder", a: "The task tools haven't been used recently.",
  wrap: WRAP_UI, place: PLACE_FOLD,
  when: "From code: task tools are enabled (CLAUDE_CODE_ENABLE_TASKS not false and todo tools enabled), TaskUpdate is available, there is history, the reminder mode is not 'off', and the producer's counters since the last task-management call and since the last task_reminder both reach 10.",
  details: { throttle: { TURNS_SINCE_WRITE: 10, TURNS_BETWEEN_REMINDERS: 10 } } });
add(G_TODO, { id: "task-reminder-list", title: "Task tools reminder: existing tasks", type: "task_reminder", a: "Here are the existing tasks:",
  wrap: "Part of task-reminder.", place: "Appended to task-reminder.", when: "From code: the task list is non-empty. Each line is '#{{id}}. [{{status}}] {{subject}}'." });

const G_FILES = "Files and IDE";
add(G_FILES, { id: "edited-text-file", title: "File changed on disk", type: "edited_text_file", a: "changed on disk since you last read it.",
  wrap: WRAP_UI, place: PLACE_FOLD,
  when: "From code: a file previously read in full (no offset/limit) has a newer mtime than the read, re-reads without hitting the token cap, and its content differs. Snippets across all changed files this turn share a 16384-character budget; files past the budget get the no-diff variant.",
  details: { snippet_budget_chars: 16384 } });
add(G_FILES, { id: "edited-text-file-diff", title: "File changed on disk: diff follows", type: "edited_text_file", a: " Here are the relevant changes (shown with line numbers):", climb: "template",
  slots: { "{{expr:n}}": "edited-text-file" },
  wrap: "Part of edited-text-file.", place: "Appended to edited-text-file.", when: "From code: snippet within budget." });
add(G_FILES, { id: "edited-text-file-nodiff", title: "File changed on disk: diff omitted", type: "edited_text_file", a: " The diff is omitted here because other changed files this turn already filled the snippet budget", climb: "template",
  slots: { "{{expr:n}}": "edited-text-file" },
  wrap: "Part of edited-text-file.", place: "Appended to edited-text-file.", when: "From code: snippet budget already used." });
add(G_FILES, { id: "file-truncated-note", title: "@-mentioned file truncated", type: "file", a: "was too large and has been truncated to the first",
  wrap: WRAP_UI, place: PLACE_FOLD + " Follows a synthetic Read tool_use/tool_result pair for the file.", when: "From code: an attached (@-mentioned) text file was truncated." });
add(G_FILES, { id: "at-mention-reference", title: "@-mention without attached contents", type: "at_mention_reference", a: "File contents are not attached automatically in this session",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });
add(G_FILES, { id: "compact-file-reference", title: "File read before compaction", type: "compact_file_reference", a: "was read before the last conversation was summarized",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });
add(G_FILES, { id: "pdf-reference-unknown", title: "Large PDF (page count unknown)", type: "pdf_reference", a: "(page count unknown, ", concatStop: true,
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: @-mentioned PDF not attached; page count unknown. Followed by pdf-reference-suffix." });
add(G_FILES, { id: "pdf-reference", title: "Large PDF", type: "pdf_reference", a: "This PDF is too large to read all at once.", concatStop: true,
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: @-mentioned PDF too large to attach. Followed by pdf-reference-suffix." });
add(G_FILES, { id: "pdf-reference-suffix", title: "Large PDF: reading advice", type: "pdf_reference", a: "Start by reading the first few pages to understand the structure",
  wrap: "Part of pdf-reference.", place: "Suffix.", when: "From code: appended to both PDF variants.", literalOnly: true });
add(G_FILES, { id: "audio-transcript", title: "@-mentioned audio transcript", type: "audio_transcript", a: "Claude Code transcribed it with Anthropic's speech-to-text service",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: an @-mentioned audio file was transcribed. The transcript follows in an <audio-transcript> element." });
add(G_FILES, { id: "audio-transcript-error", title: "@-mentioned audio not transcribed", type: "audio_transcript", a: "but Claude Code could not transcribe it.",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: transcription failed." });
add(G_FILES, { id: "selected-lines-in-ide", title: "IDE selection", type: "selected_lines_in_ide", a: "The user selected the lines ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, an IDE is connected, the selection has text and a file path, and the path is not denied by permission rules. Content longer than the display limit ends with ' ... (truncated)'." });
add(G_FILES, { id: "selected-lines-in-diff", title: "Diff-view selection", type: "selected_lines_in_diff", a: "from the diff view",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, the selection source is a diff view and has text." });
add(G_FILES, { id: "opened-file-in-ide", title: "File opened in IDE", type: "opened_file_in_ide", a: "in the IDE. This may or may not be related to the current task.",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, a file is focused in the IDE with no selection text and the path is not denied; nested CLAUDE.md files for that path are attached first." });
add(G_FILES, { id: "diagnostics", title: "New diagnostics", type: "diagnostics", a: "The following new diagnostic issues were detected:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, new diagnostics from the IDE MCP server or pending LSP diagnostics exist and a file-editing tool is available. Each line: '  {{severity}} [Line L:C] {{message}} [code] (source)'." });
add(G_FILES, { id: "directory-listing", title: "@-mentioned directory", type: "directory", noText: true, useCodeAnchor: "Lists files in ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: rendered as a synthetic Bash tool_use (command 'ls <path>', description 'Lists files in <path>') plus its tool_result with the listing." });
add(G_FILES, { id: "bash-output-audience-note", title: "Bash output audience note", type: "bash_output_audience_note", a: "Only you see that command's output",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });
add(G_FILES, { id: "inlined-image-paths", title: "Attached image saved path", type: "inlined_image_paths", a: "The attached image is also saved at ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: pasted/attached images that were also saved to disk. {{expr:n}} is the quoted path list." });
add(G_FILES, { id: "inlined-image-paths-multi", title: "Attached images saved paths", type: "inlined_image_paths", a: "attached images, in display order, are also saved at",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: more than one saved image." });
add(G_FILES, { id: "read-empty-file", title: "Read: empty file warning", a: "Warning: the file exists but the contents are empty.",
  wrap: "Literal tags inside the text.", place: PLACE_TOOL + " (Read)", when: "From code: Read result for an existing empty file." });
add(G_FILES, { id: "read-offset-past-end", title: "Read: offset past end warning", a: "Warning: the file exists but is shorter than the provided offset",
  wrap: "Literal tags inside the text.", place: PLACE_TOOL + " (Read)", when: "From code: Read result when the offset is past the end of the file." });
add(G_FILES, { id: "date-change", title: "Date changed", type: "date_change", a: "The date has changed. Today's date is now", nth: 1,
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });

add(G_FILES, { id: "date-attachment", title: "Current date", type: "date", noText: true, useCodeAnchor: "date:(e)=>",
  wrap: WRAP_UI, place: PLACE_FOLD + " Captured at the end of the trailing system message of the first request.", when: "From code: the date attachment; when the date has not changed it renders the date line of the trailing system message (rendered text: see Main system prompt). Producer not traced." });
add(G_FILES, { id: "date-attachment-changed", title: "Current date (changed)", type: "date", a: "The date has changed. Today's date is now ${e.date}", nth: 0, climb: "template",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: the date attachment with changed set." });

const G_HOOKS = "Hooks";
add(G_HOOKS, { id: "hook-success", title: "Hook success output", type: "hook_success", a: " hook success: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: only for SessionStart, UserPromptSubmit and UserPromptExpansion hooks with non-empty output; other events render nothing." });
add(G_HOOKS, { id: "hook-additional-context", title: "Hook additional context", type: "hook_additional_context", a: " hook additional context: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: a hook returned additionalContext; entries are joined with newlines. The docs describe additionalContext as wrapped in a system reminder at the point where the hook fired.", documented: "https://code.claude.com/docs/en/hooks" });
add(G_HOOKS, { id: "hook-blocking-error", title: "Hook blocking error", type: "hook_blocking_error", a: " hook blocking error from command: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: a hook result carried a blocking error; the text quotes the hook command and its error." });
add(G_HOOKS, { id: "hook-stopped-continuation", title: "Hook stopped continuation", type: "hook_stopped_continuation", a: " hook stopped continuation: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "Renderer read in code; producer not traced. The docs describe stopReason as shown when continue is false and kept in the conversation.", documented: "https://code.claude.com/docs/en/hooks" });
add(G_HOOKS, { id: "pretooluse-hook-error", title: "PreToolUse hook denial reason", a: " hook error: ", nth: 0,
  wrap: WRAP_NONE, place: PLACE_TOOL + " (denied tool call)", when: "From code: a PreToolUse hook returned a blocking error; {{expr:e}} is 'PreToolUse:<tool name>' and the result becomes the denial message." });
add(G_HOOKS, { id: "async-hook-response", title: "Async hook response", type: "async_hook_response", noText: true, useCodeAnchor: "getAsyncHookResponseAttachments found",
  wrap: "Mixed: systemMessage and hookSpecificOutput.additionalContext are emitted as separate meta messages, each wrapped by the attachment renderer.", place: PLACE_FOLD,
  when: "From code: main thread; a background (async) hook finished since the last turn. The hook's systemMessage and additionalContext strings are injected verbatim." });
add(G_HOOKS, { id: "stop-hook-rewake", title: "Async Stop hook blocking error (task notification)", a: "Stop hook blocking error from command ",
  wrap: WRAP_UA + " (the body, inside a <task-notification> envelope)", place: "Queued as a task-notification user message.", when: "From code: an asyncRewake hook exits with code 2; the prefix can be replaced by the hook's rewakeMessage and the summary by rewakeSummary (default summary 'Stop hook feedback')." });

const G_MEM = "Memory and CLAUDE.md";
add(G_MEM, { id: "nested-memory", title: "Nested CLAUDE.md / memory file", type: "nested_memory", a: "Contents of ${e.content.path}:", climb: "template",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: paths queued as nested-memory triggers (queueing not traced) are resolved to memory files and each is attached with its path and content. Disabled by CLAUDE_CODE_DISABLE_CLAUDE_MDS." });
add(G_MEM, { id: "relevant-memories", title: "Relevant memories", type: "relevant_memories", a: "Retrieved for possible relevance",
  wrap: WRAP_UI, place: PLACE_FOLD + " Stays in the user turn when flag tengu_mill_orange is on.", when: "Renderer read in code: first memory block starts with this sentence, then '{{header}}\\n\\n{{content}}'. Producer not traced.",
  details: { citation_clause_flag: { tengu_salt_marsh: false } } });
add(G_MEM, { id: "relevant-memories-cite", title: "Relevant memories: citation clause", type: "relevant_memories", a: "When you use or cite content from one of these memories",
  wrap: "Part of relevant-memories.", place: "Inside relevant-memories.", when: "From code: flag tengu_salt_marsh (default false) is on." });
add(G_MEM, { id: "memory-update", title: "Memory directory updated", type: "memory_update", a: " updated your memory directory: ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread; pending memory updates exist (source 'dream' renders as 'Background memory consolidation')." });
add(G_MEM, { id: "memory-update-stale", title: "Memory update: stale loaded copy", type: "memory_update", a: " is now stale relative to disk",
  wrap: "Part of memory-update.", place: "Line in memory-update.", when: "From code: some changed paths are already in context." });
add(G_MEM, { id: "cowork-memory-withdrawn", title: "Memory snapshot withdrawn", type: "cowork_memory_context", a: "The previous memory snapshot was withdrawn; disregard it.",
  wrap: WRAP_UI, place: PLACE_USER, when: "Renderer read in code: cowork_memory_context with null content. Producer not traced." });

const G_CTX = "Context and compaction";
add(G_CTX, { id: "compact-summary", title: "Compaction continuation summary", a: "This session is being continued from a previous conversation that ran out of context.",
  slots: { "{{expr:n?.foreignArtifactContent===!0 ? A : B}}": "compact-summary-foreign-artifact behind a marker (details.variants), or empty", "{{expr:r}}": "the formatted compaction summary" },
  wrap: WRAP_NONE, place: "Placement not traced.", when: "From code: text built for the post-compaction summary; {{expr:r}} is the formatted summary." });
add(G_CTX, { id: "compact-summary-foreign-artifact", title: "Compaction: foreign Artifact content note", a: "The summarized conversation included Artifact content written by people other than you",
  wrap: "Part of compact-summary.", place: "Prefix.", when: "From code: the summarized conversation included Artifact content by others." });
add(G_CTX, { id: "compact-summary-transcript", title: "Compaction: transcript path", a: "If you need specific details from before compaction",
  wrap: "Part of compact-summary.", place: "Appended.", when: "From code: a transcript path is known." });
add(G_CTX, { id: "compact-summary-preserved", title: "Compaction: recent messages preserved", a: "Recent messages are preserved verbatim.",
  wrap: "Part of compact-summary.", place: "Appended.", when: "From code: recent messages were kept verbatim." });
add(G_CTX, { id: "compact-summary-head-truncated", title: "Compaction: head truncated", a: "Note: the earliest part of the conversation was too large to include",
  wrap: "Part of compact-summary.", place: "Appended.", when: "From code: the head of the conversation did not fit." });
add(G_CTX, { id: "compact-summary-continue", title: "Compaction: continue without questions", a: "Continue the conversation from where it left off without asking the user any further questions.",
  wrap: "Part of compact-summary.", place: "Appended.", when: "From code: suppressFollowUpQuestions is set." });
add(G_CTX, { id: "invoked-skills", title: "Skills invoked before compaction", type: "invoked_skills", a: "The following skills were invoked EARLIER in this session",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code: after compaction, skills invoked earlier are re-attached. Each is '### Skill: {{name}}\\nPath: {{path}}\\n\\n{{content}}', separated by '---'." });
add(G_CTX, { id: "total-tokens-reminder", title: "Remaining tokens", type: "total_tokens_reminder", a: "<total_tokens>",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: total-tokens reminder mode (session-latched) is not 'off'; emitted on non-user turns, and after a regular user prompt when the after-user-turn option is on. Mode 'infinite' prints 'Infinite', 'fixed' prints 5000000, 'countdown' prints the model context budget minus tokens used, 'padded-countdown' prints the task budget remaining." });
add(G_CTX, { id: "token-usage", title: "Token usage", type: "token_usage", a: "Token usage: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: main thread and CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT is set." });
add(G_CTX, { id: "output-token-usage", title: "Output token usage", type: "output_token_usage", a: "Output tokens — turn: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: the producer in this build returns no attachment, so this is never emitted." });
add(G_CTX, { id: "silent-turn-reminder", title: "Silent-turn reminder", type: "silent_turn_reminder", a: "The user hasn't heard from you in a while.",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: main thread, a turn not started by the user, brief/focus view off, model enabled for silent_turn_reminder (CLAUDE_CODE_SILENT_TURN_REMINDER or model config), and enough silent assistant turns since the last reminder; at most 3 per stretch. Text overridable by CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT or flag tengu_hushed_lark_text.",
  details: { max_per_stretch: 3 } });
add(G_CTX, { id: "tool-search-usage-reminder", title: "Unloaded tool schemas reminder", type: "tool_search_usage_reminder", a: "Some available tools' schemas are not loaded in this conversation yet",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: a toolSearchReminder config exists, tool search mode is 'tst', the model supports it (not Vertex), undiscovered deferred tools exist, at least everyNTurns turns since the last ToolSearch call and since the last reminder, and no task reminder fired in the same turn." });
add(G_CTX, { id: "context-sections", title: "Context sections", type: "context_sections", noText: true, useCodeAnchor: "Coordinator mode has ended; the earlier list of worker tools no longer applies.",
  wrap: WRAP_UI, place: PLACE_USER, when: "Renderer read in code: each section is '# {{name}}\\n{{text}}', followed by the ambient-context suffix. Producer not traced." });

const G_PERM = "Permissions and auto mode";
add(G_PERM, { id: "auto-mode", title: "Auto mode active", type: "auto_mode", a: "Bias toward working without stopping for clarifying questions",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: permission mode is auto, not already announced since the last exit, and the model is not in lean-prompt mode (lean-prompt models get only the bash-first steer). Heading is '## Auto Mode Active'." });
add(G_PERM, { id: "auto-mode-consent", title: "Auto mode: classifier block handling", type: "auto_mode", a: "When the auto-mode classifier blocks an action",
  wrap: "Part of auto-mode.", place: "Appended.", when: "From code: not bypass mode and the consent flow is enabled for this agent." });
add(G_PERM, { id: "auto-mode-bash-first-strict", title: "Bash-first steer (strict)", type: "auto_mode", a: "tool wherever it can accomplish the job: read files with cat",
  wrap: "Part of auto-mode.", place: "Appended, or alone after 'While auto mode is active:' / 'While bypass permissions mode is active:'.", when: "From code: Bash plus Edit/Write are available and the bash-first experiment is on (CLAUDE_CODE_THRIFTY_SONIC, else cohort flag); strict unless the steer is 'relaxed'." });
add(G_PERM, { id: "auto-mode-bash-first-relaxed", title: "Bash-first steer (relaxed)", type: "auto_mode", a: "tool when it is the simpler route: read files with cat",
  wrap: "Part of auto-mode.", place: "Same as strict.", when: "From code: bash-first steer 'relaxed'." });
add(G_PERM, { id: "auto-mode-bypass", title: "Bypass permissions mode steer", type: "auto_mode", a: "While bypass permissions mode is active:",
  slots: { "{{expr:w}}": "auto-mode-bash-first-strict or auto-mode-bash-first-relaxed" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: permission mode bypassPermissions and the bash-first steer applies; the text is this line followed by one of the bash-first steers." });
add(G_PERM, { id: "auto-mode-steer-only", title: "Auto mode steer only", type: "auto_mode", a: "While auto mode is active:",
  slots: { "{{expr:w}}": "auto-mode-bash-first-strict or auto-mode-bash-first-relaxed" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: auto mode on a lean-prompt model with the bash-first steer." });
add(G_PERM, { id: "auto-mode-exit", title: "Exited auto mode", type: "auto_mode_exit", a: "You have exited auto mode. The user may now want to interact more directly.",
  slots: { "{{expr:n}}": "auto-mode-exit-bash or empty" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main agent, session flag needsAutoModeExitAttachment set, mode no longer auto, and an auto_mode attachment was sent earlier." });
add(G_PERM, { id: "auto-mode-exit-steer-only", title: "Exited auto mode (steer only)", type: "auto_mode_exit", a: "You have exited auto mode.${n}", climb: "template",
  slots: { "{{expr:n}}": "auto-mode-exit-bash or empty" },
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: exit after a steer-only auto_mode." });
add(G_PERM, { id: "auto-mode-exit-bash", title: "Exited auto mode: resume dedicated tools", type: "auto_mode_exit", a: " Resume using the dedicated tools for file reads, searches, and edits.",
  wrap: "Part of auto-mode-exit.", place: "Suffix.", when: "From code: the earlier auto_mode used the bash-first steer." });
add(G_PERM, { id: "tool-rejected", title: "Tool use rejected by user", a: "STOP what you are doing and wait for the user to tell you how to proceed.",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "Undocumented; constant read in code (tool-use rejection result)." });
add(G_PERM, { id: "tool-rejected-with-feedback", title: "Tool use rejected with user feedback", a: "To tell you how to proceed, the user said:",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "Undocumented; constant read in code (followed by the user's text)." });
add(G_PERM, { id: "permission-denied", title: "Permission denied", a: "Try a different approach or report the limitation to complete your task.",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "Undocumented; constant read in code." });
add(G_PERM, { id: "permission-denied-with-feedback", title: "Permission denied with user feedback", a: "was NOT written to the file). The user said:",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "Undocumented; constant read in code (followed by the user's text)." });
add(G_PERM, { id: "permission-denied-rule", title: "Permission to use a tool denied", a: "has been denied. ${MYt}", climb: "template",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "From code: a permission rule denied the tool; the workaround guidance follows." });
add(G_PERM, { id: "permission-denied-dontask", title: "Permission denied (don't ask mode)", a: "has been denied because Claude Code is running in don't ask mode.", climb: "template",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "From code: dontAsk permission mode." });
add(G_PERM, { id: "permission-denied-noninteractive", title: "Permission denied (no prompt available)", a: "it requires interactive approval, and permission prompts are not available in this session.",
  wrap: WRAP_NONE, place: PLACE_TOOL, when: "From code: approval needed in a session without permission prompts." });
add(G_PERM, { id: "interrupted", title: "Request interrupted", a: "[Request interrupted by user]", f: "chunk-m01p8xh6.js", nth: 0, literalOnly: true,
  wrap: WRAP_NONE, place: "User message.", when: "Undocumented; text constant read at chunk-m01p8xh6.js (callers not traced)." });
add(G_PERM, { id: "interrupted-tool", title: "Request interrupted during tool use", a: "[Request interrupted by user for tool use]", f: "chunk-m01p8xh6.js", nth: 0, literalOnly: true,
  wrap: WRAP_NONE, place: "User message.", when: "Undocumented; text constant read at chunk-m01p8xh6.js (callers not traced)." });
add(G_PERM, { id: "local-command-caveat", title: "Local command caveat", a: "Caveat: The messages below were generated by the user while running local commands.",
  wrap: "Literal <local-command-caveat> tags.", place: "Meta user message.", when: "Undocumented; read at chunk-dt8bvbsd.js (built as a meta user message; callers not traced)." });
add(G_PERM, { id: "sandbox-disabled", title: "Sandbox disabled", type: "sandbox_instructions", a: "command sandbox has been disabled.",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: sandbox_instructions attachment with empty content (sandbox turned off). Non-empty content is injected verbatim." });

const G_AGENTS = "Background tasks, agents and teammates";
add(G_AGENTS, { id: "task-status-killed", title: "Task stopped by user", type: "task_status", a: ") was stopped by the user.",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: main thread; a tracked task changed to killed." });
add(G_AGENTS, { id: "task-status-shell-running", title: "Background shell still running", type: "task_status", a: "Do not start it again; to restart it, stop it with ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: status update for a running local_bash task; first sentence is '{{Background shell|Background monitor}} {{taskId}} (\"{{description}}\") is still running (command, shown on one line: `{{command}}`).' and 'You can read its output at {{outputFilePath}}.' when known." });
add(G_AGENTS, { id: "task-status-shell-running-head", title: "Background shell still running (first sentence)", type: "task_status", a: ") is still running${j}.", climb: "template",
  wrap: "Part of task-status-shell-running.", place: "First sentence.", when: "From code: see task-status-shell-running." });
add(G_AGENTS, { id: "task-status-agent-running", title: "Background agent still running", type: "task_status", a: "Do NOT spawn a duplicate. You will be notified when it completes. You can read partial output at",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: status update for a running background agent, preceded by 'Background agent \"{{description}}\" ({{taskId}}) is still running.' and optional 'Progress: …'." });
add(G_AGENTS, { id: "task-status-agent-running-nofile", title: "Background agent still running (no output file)", type: "task_status", a: "Send it a message with ${Zr} if you need a progress report before then.", climb: "template",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: running agent without an output file path." });
add(G_AGENTS, { id: "task-status-other", title: "Task status (completed/failed)", type: "task_status", a: "Read the output file to retrieve the result: ",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: other statuses: 'Task {{taskId}} (type: {{taskType}}) (status: {{status}}) (description: {{description}})', optional 'Delta: …', then this sentence or 'Send it a message with SendMessage to retrieve its result.'" });
add(G_AGENTS, { id: "team-context", title: "Team coordination", type: "team_context", a: "# Team Coordination",
  wrap: "Literal <system-reminder> tags inside the text (stripped when folded into a system-role message).", place: PLACE_FOLD, when: "From code: agent teams are enabled (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS or another gate, and flag tengu_amber_flint, default true); producer not traced. Rendered before the attachment table." });
add(G_AGENTS, { id: "team-context-tasklist", title: "Team coordination: task list", type: "team_context", a: " Check the task list periodically.",
  wrap: "Part of team-context.", place: "Inside team-context.", when: "From code: task-list tools are available." });
add(G_AGENTS, { id: "agent-mention", title: "@-mentioned agent", type: "agent_mention", a: "The user has expressed a desire to invoke the agent",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the user's prompt @-mentions an active agent type." });
add(G_AGENTS, { id: "peer-mention", title: "@-mentioned Claude session", type: "peer_mention", a: "If their message asks you to tell or ask that session something",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: human-typed prompt @-mentions another Claude session that resolves to one candidate." });
add(G_AGENTS, { id: "agent-listing", title: "Agent types listing", type: "agent_listing_delta", a: "Available agent types for the Agent tool:",
  wrap: WRAP_UI, place: PLACE_FOLD + " Captured in the trailing system message of the first request.", when: "From code: first announcement of agent types ('New agent types are now available for the Agent tool:' for later additions). The initial listing is part of the trailing system message (see Main system prompt)." });
add(G_AGENTS, { id: "agent-listing-concurrency", title: "Agent listing: concurrency note", type: "agent_listing_delta", a: "When you launch multiple agents for independent work",
  wrap: "Part of agent-listing.", place: "Appended.", when: "From code: initial listing with showConcurrencyNote." });
add(G_AGENTS, { id: "agent-listing-removed", title: "Agent types removed", type: "agent_listing_delta", a: "The following agent types are no longer available:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: agent types were removed; followed by the ambient-context suffix." });
add(G_AGENTS, { id: "task-notification-envelope", title: "Task notification envelope", noText: true, useCodeAnchor: "task-notification",
  wrap: "Body wrapped by the <system-reminder> wrapper and appended after a <task-notification> element.", place: "Queued user message (mode task-notification).",
  when: "From code: background task completions and async Stop-hook rewakes enqueue '<task-notification> <task-id>… <summary>…</summary>{{body}} </task-notification>' followed by the wrapped body." });
add(G_AGENTS, { id: "coordinator-ended", title: "Coordinator mode ended", type: "coordinator_context", a: "Coordinator mode has ended; the earlier list of worker tools no longer applies.",
  wrap: WRAP_UI, place: PLACE_USER, when: "Renderer read in code: coordinator context changed to empty." });
add(G_AGENTS, { id: "coordinator-changed", title: "Coordinator worker tools changed", type: "coordinator_context", a: "The worker tools have changed; this replaces the earlier list.",
  wrap: WRAP_UI, place: PLACE_USER, when: "Renderer read in code: coordinator context changed." });
add(G_AGENTS, { id: "thread-state", title: "Thread state", type: "thread_state", a: "Thread state: the user last wrote ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "Renderer read in code; producer not traced." });

const G_SKILLS = "Skills and commands";
add(G_SKILLS, { id: "skill-listing", title: "Skills listing", type: "skill_listing", a: "The following skills are available for use with the Skill tool:",
  wrap: WRAP_UI, place: PLACE_FOLD + " Captured in the trailing system message of the first request.", when: "From code: slash commands enabled, skills not exposed as tools, the Skill tool is present, and there are new (or initial) model-invocable skills to announce. The initial listing is part of the trailing system message (see Main system prompt)." });
add(G_SKILLS, { id: "dynamic-skill", title: "New skills discovered", type: "dynamic_skill", a: "New skills discovered in ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: skill directories under the working directory were discovered during the session; followed by '- {{name}}' lines." });
add(G_SKILLS, { id: "unknown-command-fallback", title: "Unknown slash command", type: "unknown_command_fallback", a: "The user's message starts with a slash command, but no command with that name is available in this session",
  wrap: WRAP_UI, place: PLACE_USER, when: "Renderer read in code; producer not traced." });

const G_TOOLS = "Other";
add(G_TOOLS, { id: "deferred-tools-available", title: "Deferred tools available", type: "deferred_tools_delta", a: "The following deferred tools are now available via ",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: new deferred tools appeared and ToolSearch is present; followed by one tool name per line." });
add(G_TOOLS, { id: "tools-now-available", title: "Tools now available", type: "deferred_tools_delta", a: "The following tools are now available:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: same, when ToolSearch is absent." });
add(G_TOOLS, { id: "tools-became-available", title: "Tools became available", type: "deferred_tools_delta", a: "The following tools just became available and are ready to use:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: tool definitions were surfaced on the wire this turn." });
add(G_TOOLS, { id: "tools-updated", title: "Tool definitions updated", type: "deferred_tools_delta", a: "The following tools have updated definitions",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: surfaced tools replaced earlier definitions." });
add(G_TOOLS, { id: "tools-removed-block", title: "Tools no longer available (blocked)", type: "deferred_tools_delta", a: "The following tools are no longer available. Do not call them:",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: tools removed by a block." });
add(G_TOOLS, { id: "tools-removed-session", title: "Tools no longer available", type: "deferred_tools_delta", a: "s are no longer available in this session. ${D}:", climb: "template",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: non-MCP tools removed." });
add(G_TOOLS, { id: "tools-removed-mcp", title: "MCP tools no longer available", type: "deferred_tools_delta", a: "s are no longer available (their MCP server disconnected). ${D}:", climb: "template",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: MCP tools removed after a disconnect (30 or fewer; larger sets get a one-line summary)." });
add(G_TOOLS, { id: "tools-restored", title: "Tools available again", type: "deferred_tools_delta", a: "The earlier instruction to disregard their definitions and not call them no longer applies",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: previously retracted tools are restored." });
add(G_TOOLS, { id: "tools-retracted", title: "Tool definitions retracted", type: "deferred_tools_delta", a: "Definitions of the following tools were loaded earlier in this conversation and their source has since been removed.",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: tools whose source was removed; grouped by cause." });
add(G_TOOLS, { id: "mcp-needs-auth", title: "MCP servers need authentication", type: "deferred_tools_delta", a: "This session is non-interactive, so Claude cannot run the OAuth flow here.",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: non-interactive session with MCP servers in needs-auth state." });
add(G_TOOLS, { id: "mcp-failed", title: "MCP servers failed to connect", type: "deferred_tools_delta", a: "Treat this as a connection failure, not a missing capability",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: MCP servers failed (not policy-blocked); up to 30 listed." });
add(G_TOOLS, { id: "mcp-policy-blocked", title: "MCP servers blocked by policy", type: "deferred_tools_delta", a: "This is an administrative block, not a connection failure", nth: 1,
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: MCP servers blocked by managed policy." });
add(G_TOOLS, { id: "mcp-pending-toolsearch", title: "MCP servers still connecting (ToolSearch)", type: "deferred_tools_delta", a: "will wait for connecting servers and search their tools once available",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: pending MCP servers and ToolSearch present." });
add(G_TOOLS, { id: "mcp-pending", title: "MCP servers still connecting", type: "deferred_tools_delta", a: "not yet available but will be announced here once they connect",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: pending MCP servers and ToolSearch absent." });
add(G_TOOLS, { id: "mcp-instructions", title: "MCP server instructions", type: "mcp_instructions_delta", a: "# MCP Server Instructions",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: connected MCP servers provided instructions not yet announced." });
add(G_TOOLS, { id: "mcp-instructions-removed", title: "MCP server instructions withdrawn", type: "mcp_instructions_delta", a: "Their instructions above no longer apply",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: servers with announced instructions disconnected." });
add(G_TOOLS, { id: "mcp-dropped-tools", title: "Unavailable MCP tools", type: "mcp_dropped_tools_delta", a: "# Unavailable MCP Tools",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: MCP tools excluded because their schemas would be rejected by the API." });
add(G_TOOLS, { id: "mcp-resource", title: "MCP resource contents", type: "mcp_resource", a: "Do NOT read this resource again unless you think it may have changed",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the prompt @-mentions an MCP resource; preceded by 'Full contents of resource:' and the contents." });

const G_BILL = "Billing and limits";
add(G_BILL, { id: "budget-usd", title: "USD budget", type: "budget_usd", a: "USD budget: $",
  wrap: WRAP_UA, place: PLACE_FOLD, when: "From code: options.maxBudgetUsd is set; emitted on every attachment pass." });

const G_OTHER = "Other";
add(G_OTHER, { id: "critical-system-reminder", title: "Critical system reminder (experimental)", type: "critical_system_reminder", noText: true, useCodeAnchor: "critical_system_reminder",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: every attachment pass while the context's criticalSystemReminder_EXPERIMENTAL string is set; injected verbatim." });
add(G_OTHER, { id: "batching-reminder", title: "Batching reminder", type: "batching_reminder", a: "First privately list what you need next", f: "chunk-9yybzjm7.js",
  wrap: WRAP_UA, place: "Only on models with mid-conversation system support; folded into the system-role message.", when: "From code: the text comes from CLAUDE_CODE_TOASTY_THIMBLE, client data key tengu_toasty_thimble, or, for models with the fable_5_1_prompt_bundle capability, this built-in text. Only on models with the mid-conversation system capability. Emission frequency not traced." });
add(G_OTHER, { id: "secondary-reminder", title: "Secondary reminder", type: "secondary_reminder", noText: true, f: "chunk-9yybzjm7.js", useCodeAnchor: "CLAUDE_CODE_GENTLE_PARASOL",
  wrap: WRAP_UA, place: "Only on models with the mid-conversation system capability; folded into the system-role message.", when: "From code: the text comes only from CLAUDE_CODE_GENTLE_PARASOL or client data key tengu_gentle_parasol; there is no built-in text. Emission frequency not traced." });

const G_AGENTS2 = G_AGENTS;
add(G_AGENTS2, { id: "task-notification-wrapper", title: "Background-task notification wrapper", a: "Do NOT interpret this as user acknowledgement", f: "chunk-4e7z6rdh.js", climb: "template",
  wrap: "The user message text is re-wrapped as '<system-reminder>\\n' + this prefix + the text (closing tags inside neutralised) + '\\n</system-reminder>'.", place: "User message whose origin is a task notification.",
  when: "From code: message normalisation rewrites every user message with origin kind task-notification (except scheduled triggers and projects relays) this way, unless it is already wrapped." });
add(G_AGENTS2, { id: "task-notification-same-turn", title: "Background-task notification (same turn as user message)", a: "It is delivered in the same turn as a genuine message from the user", f: "chunk-4e7z6rdh.js", climb: "template",
  wrap: "Prefix.", place: "User message.", when: "Undocumented; alternative prefix read at chunk-4e7z6rdh.js (applied when a notification shares a turn with a genuine user message)." });
add(G_AGENTS2, { id: "scheduled-task-prefix", title: "Scheduled task firing", a: "This turn was started automatically by a schedule, not typed live by the user.", f: "chunk-4e7z6rdh.js", climb: "template",
  wrap: WRAP_NONE, place: "Prefix on the user message.", when: "From code: task-notification messages whose origin subkind is scheduled-trigger get this prefix instead of the background-task wrapper." });
add(G_AGENTS2, { id: "container-restarted", title: "Container restarted", a: "The container was restarted. The following background tasks were running", f: "chunk-7gpc8xx0.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: "Undocumented; read at chunk-7gpc8xx0.js.", when: "Undocumented; read at chunk-7gpc8xx0.js (lists background tasks that were running before a container restart)." });
add(G_AGENTS2, { id: "team-shutdown-noninteractive", title: "Non-interactive team shutdown", a: "You are running in non-interactive mode and cannot return a response to t", f: "chunk-z825d7fd.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: "Undocumented; read at chunk-z825d7fd.js.", when: "Undocumented; read at chunk-z825d7fd.js (non-interactive session with an active agent team)." });
add(G_OTHER, { id: "model-changed-remote", title: "Model changed (remote session)", a: "The model for this session has been changed to ", f: "chunk-z825d7fd.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: "Meta user message.", when: "From code: model switch while CLAUDE_CODE_REMOTE is set." });
add(G_OTHER, { id: "side-question", title: "Side question (/btw)", a: "This is a side question from the user. You must answer this question direc", f: "chunk-d0azsp0e.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: "First text block of the side-question request's user message; the question follows as a second block.", when: "Undocumented; read at chunk-d0azsp0e.js (side-question request built from the current context)." });
add(G_OTHER, { id: "brief-mode-toggle", title: "Brief mode toggled on", a: "Brief mode is now enabled. Use the ", f: "chunk-wf8cdf1w.js", climb: "template",
  wrap: "Inside a literal '<system-reminder>\\n … \\n</system-reminder>' template.", place: "Undocumented; read at chunk-wf8cdf1w.js.", when: "From code: the brief-mode slash command turns brief-only mode on." });
add(G_OTHER, { id: "brief-mode-toggle-off", title: "Brief mode toggled off", a: "Brief mode is now disabled. The ", f: "chunk-wf8cdf1w.js", climb: "template",
  wrap: "Inside a literal '<system-reminder>\\n … \\n</system-reminder>' template.", place: "Undocumented; read at chunk-wf8cdf1w.js.", when: "From code: the brief-mode slash command turns brief-only mode off." });
add(G_FILES, { id: "read-file-unchanged", title: "Read: file already in context", a: "and has not changed on disk. Use that content instead of re-reading.", f: "chunk-5g1gpygm.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: PLACE_TOOL + " (Read)", when: "Undocumented; read at chunk-5g1gpygm.js (Read of a file whose contents are already in context and unchanged)." });
add(G_FILES, { id: "read-wasted-call", title: "Read: wasted call", a: "Wasted call \u2014 file unchanged since your last Read.", f: "chunk-5g1gpygm.js",
  wrap: WRAP_NONE, place: PLACE_TOOL + " (Read)", when: "Undocumented; read at chunk-5g1gpygm.js." });
add(G_BILL, { id: "gh-rate-limit", title: "GitHub API rate limit hint", a: "GitHub API rate limit exceeded (5,000/hr shared across all tools and agent", f: "chunk-7kwd28ae.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: PLACE_TOOL + " (Bash, as ghRateLimitHint)", when: "From code: a gh command's output matches the rate-limit patterns, outside the backoff window; sets a backoff." });
add(G_OTHER, { id: "multi-entry-tip", title: "Multi-entry tool tip", a: "accepts multiple entries in one call", f: "chunk-7y3ztskb.js",
  wrap: "Literal <system-reminder> tags inside the text.", place: PLACE_TOOL, when: "From code: a batch-capable tool was called with a single entry." });

add(G_AGENTS, { id: "teammate-message", title: "Teammate message envelope", type: "teammate_mailbox", a: " teammate_id=\"", f: "chunk-jf468axa.js", climb: "template",
  wrap: "Not wrapped by the attachment renderer (bare meta message); see system-role-folding for the flag-gated wrapping.", place: "Meta user message; folded into the system-role message on models with the mid-conversation system capability.",
  when: "From code: agent teams enabled and messages arrived in this agent's mailbox; one element per message, joined. {{expr:…}} attributes are the sender's color, summary and verified=\"false\" for forged provenance." });
add(G_OTHER, { id: "advisor-tool-instructions", title: "Advisor tool instructions", type: "advisor_tool", a: "tool backed by a stronger reviewer model. It takes NO parameters", f: "chunk-7kwd28ae.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: the advisor_tool attachment when the advisor is available and the announcement is not abbreviated." });
add(G_OTHER, { id: "advisor-tool-available", title: "Advisor available again", type: "advisor_tool", a: "The advisor tool is available; the advisor instructions announced earlier apply.", f: "chunk-7kwd28ae.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: advisor available with the abbreviated announcement." });
add(G_OTHER, { id: "advisor-tool-removed", title: "Advisor no longer available", type: "advisor_tool", a: "The advisor tool is no longer available; disregard the earlier advisor instructions.", f: "chunk-7kwd28ae.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: advisor_tool attachment with available false." });
add(G_PLAN, { id: "workflow-size-unrestricted", title: "Workflow size unrestricted", type: "workflow_size_guideline_change", a: "Workflow size is now unrestricted", f: "chunk-8tzgmzf9.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, regular user prompt, the workflowSizeGuideline setting changed to unrestricted." });
add(G_PLAN, { id: "workflow-size-changed", title: "Workflow size guideline changed", type: "workflow_size_guideline_change", a: "The workflow size guideline for this session changed: ", f: "chunk-8tzgmzf9.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: main thread, regular user prompt, the workflowSizeGuideline setting changed." });
add(G_DELIV, { id: "silent-attachment-types", title: "Attachment types that inject nothing", noText: true, useCodeAnchor: "normalizeAttachmentForAPI",
  wrap: "n/a", place: "n/a",
  when: "From code: these attachment types exist in transcripts but render no model-visible text in this build: already_read_file, async_hook_response_batch, attention_budget, autocheckpointing, background_task_status, batching_reminder_sent, command_permissions, companion_intro, compaction_reminder, context_efficiency, context_tip, current_session_memory, deferred_tools_record, echo_activities, edited_image_file, fold_nudge, goal_status, hook_cancelled, hook_deferred_tool, hook_error_during_execution, hook_non_blocking_error, hook_permission_decision, hook_system_message, max_turns_reached, pen_mode_enter, pen_mode_exit, prompt_render_point, prompt_snapshot, repl_mcp_needs_auth, secondary_reminder_sent, structured_output, task_progress, teammate_shutdown_batch, thinking_drop, thinking_reminder, thinking_stripped, todo, tool_host_result_lines, ultramemory, ultrawork_request, verify_plan_reminder. (batching_reminder_sent and secondary_reminder_sent are replayed through a separate path when cleared at the next user message.)" });

add(G_DELIV, { id: "attribution-precedence-default", title: "Attribution precedence clause (default)", a: "the user's own instructions about these lines, such as a CLAUDE.md or memory rule, take precedence over this reminder",
  wrap: "Part of attribution-reminder.", place: "Inside the attribution reminder's parentheses.", when: "From code: no attribution line comes from managed settings. This is the form in the captured first request." });
add(G_DELIV, { id: "attribution-precedence-managed", title: "Attribution precedence clause (all managed)", a: "these lines are set by the user's organization's managed settings and apply even if",
  wrap: "Part of attribution-reminder.", place: "Inside the attribution reminder's parentheses.", when: "From code: every attribution line present comes from managed settings." });
add(G_DELIV, { id: "attribution-commit-line", title: "Attribution reminder: commit line", a: "- End git commit messages with:\n", nth: 0, climb: "template",
  wrap: "Part of attribution-reminder.", place: "Line list of the attribution reminder.", when: "From code: a commit attribution line is configured; closing tags in the value are neutralised." });
add(G_DELIV, { id: "attribution-pr-line", title: "Attribution reminder: pull-request line", a: "- End pull request descriptions with:\n", nth: 0, climb: "template",
  wrap: "Part of attribution-reminder.", place: "Line list of the attribution reminder.", when: "From code: a pull-request attribution line is configured." });
add(G_AGENTS, { id: "queued-command", title: "Queued / mid-turn user input", type: "queued_command", noText: true, useCodeAnchor: "case\"queued_command\":{if(e.renderedByBatchHead)",
  wrap: "Depends on origin: task notifications get the background-task wrapper (or the scheduled-task prefix); human-typed prompts are not wrapped; other origins (coordinator, channel, peer, Slack) get origin-specific envelopes not traced here. Meta queued commands are marked meta.", place: "Folded into the system-role message on capable models unless the origin is excluded; otherwise a user message.",
  when: "From code: prompts queued while the agent was busy (typed mid-turn, relayed, or delivered to an agent) are attached on the next pass. Saved image paths add inlined-image-paths." });
add(G_AGENTS, { id: "queued-thread-messages", title: "Messages from the bound thread", type: "queued_command", a: "Messages arrived in the bound thread while you were working:",
  wrap: WRAP_NONE, place: "User message.", when: "From code: batched relay prompts for a bound thread are prefixed with this line (followed by the messages joined by blank lines)." });
add(G_AGENTS, { id: "spawn-context-user", title: "Spawn-time context label: user", type: "queued_command", a: "What the user said to the coordinator session that started this agent", f: "chunk-m200zvyg.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: a queued command carrying spawn-time context with source typed; followed by the escaped context text." });
add(G_AGENTS, { id: "spawn-context-channel", title: "Spawn-time context label: channel", type: "queued_command", a: "What a participant in the messaging channel bound to the coordinator session", f: "chunk-m200zvyg.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: spawn-time context with source relay." });
add(G_AGENTS, { id: "spawn-context-owner", title: "Spawn-time context label: project owner", type: "queued_command", a: "What the owner of the project wrote on its timeline", f: "chunk-m200zvyg.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: spawn-time context with source owner." });
add(G_AGENTS, { id: "spawn-context-unattributed", title: "Spawn-time context label: unattributed", type: "queued_command", a: "Background recorded in the coordinator session that started this agent, whose author is not established", f: "chunk-m200zvyg.js",
  wrap: WRAP_UI, place: PLACE_FOLD, when: "From code: spawn-time context with source unattributed." });
const RT = (id, title, type, anchor, when, extra = {}) => add(G_OTHER, { id, title, type, noText: true, useCodeAnchor: anchor, wrap: WRAP_UI, place: PLACE_FOLD, when, ...extra });
RT("poll-events", "Wake / poll events", "poll_events", "poll_events:(e)=>", "From code: rendered text is built from the event envelopes and the remaining wake count; not rendered when already delivered another way. Excluded from system-role folding. Envelope text not traced.", { place: PLACE_USER });
RT("read-truncation-notice", "Read truncation notice", "read_truncation_notice", "read_truncation_notice:(e)=>", "From code: the attachment's banner string, HTML-escaped, injected as is. Banner text not traced.");
RT("dir-sync-notice", "Directory sync notice", "dir_sync_notice", "dir_sync_notice:(e)=>", "From code: the attachment's content string, escaped, injected as is. Excluded from system-role folding.", { place: PLACE_USER });
RT("prefix-delta", "Prefix delta", "prefix_delta", "prefix_delta:(e)=>", "From code: the attachment's text injected verbatim. Producer not traced.");
RT("fork-briefing", "Fork briefing", "fork_briefing", "fork_briefing:(e)=>", "From code: the attachment's text (system-reminder tags neutralised) injected verbatim. Excluded from system-role folding.", { place: PLACE_USER });
RT("artifact-opening-prefetch", "Artifact opening prefetch", "artifact_opening_prefetch", "artifact_opening_prefetch:(e)=>", "From code: collected when the artifact prefetch gate holds and CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH is not false; the content (tags neutralised) is injected verbatim. Excluded from system-role folding.", { place: PLACE_USER });
RT("tool-hosts-notice", "Tool hosts notice", "tool_hosts_notice", "tool_hosts_notice:(e)=>", "From code: remote tool-host lines joined by newlines, followed by the ambient-context suffix; collected only when the remote tool-host feature supplies a notice.");
RT("tool-hosts-correction", "Tool hosts correction", "tool_hosts_correction", "tool_hosts_correction:(e)=>", "From code: remote tool-host correction lines joined by newlines.");
RT("cowork-memory-context", "Cowork memory snapshot", "cowork_memory_context", "cowork_memory_context:({content:e})=>", "From code: the memory snapshot content (tags neutralised) injected verbatim; see cowork-memory-withdrawn for the null case. Excluded from system-role folding.", { place: PLACE_USER });
const SP = "Rendered text: see Main system prompt.";
RT("environment-attachment", "Environment block", "environment", "environment:(e)=>", "From code: an environment snapshot (or its changes) is rendered; collected every pass. " + SP + " Captured as the '# Environment' block in the trailing system message.");
RT("model-attachment", "Model identity", "model", "model:(e)=>", "From code: the model identity is rendered when present. " + SP);
RT("session-context-attachment", "Session context", "session_context", "session_context:(e)=>", "From code: session context (or its change, with a reason) is rendered. Excluded from system-role folding. " + SP, { place: PLACE_USER });
RT("instructions-attachment", "Instructions", "instructions", "instructions:(e)=>", "From code: an instructions record is rendered. Excluded from system-role folding. " + SP, { place: PLACE_USER });
RT("language-attachment", "Language", "language", "language:(e)=>", "From code: a language preference is rendered. " + SP);
RT("output-style-instructions-attachment", "Output style instructions", "output_style_instructions", "output_style_instructions:(e)=>", "From code: the active output style's instructions are rendered. " + SP);

// ---------- build ----------
const out = []; const warnings = [];
function codeProv(file, needle) {
  const src = info(file).src; const i = src.indexOf(needle);
  if (i < 0) throw new Error(`code anchor not found: ${needle}`);
  return provenance(file, src, i, i + needle.length);
}
for (const it of I) {
  const file = it.f ?? MAIN; const ctx = { id: it.id, constants: {}, warnings };
  let text = null, prov;
  if (it.noText) prov = codeProv(file, it.useCodeAnchor);
  else {
    const loc = locate(file, it.a, { nth: it.nth ?? 0, climb: it.climb === "template" || it.literalOnly || it.concatStop ? "template" : "concat" });
    let node = loc.node;
    if (it.literalOnly) node = loc.literal;
    text = it.textOverride ?? render(file, node, loc.anc, ctx);
    prov = provenance(file, info(file).src, node.start, node.end);
    if (loc.hits > 1 && it.nth === undefined) warnings.push(`${it.id}: anchor matches ${loc.hits} literals; using the first`);
  }
  const details = { ...(it.type ? { attachment_type: it.type } : {}), wrapping: it.wrap, placement: it.place, ...(Object.keys(ctx.constants).length ? { constants: ctx.constants } : {}), ...(ctx.lists ? { lists: ctx.lists } : {}), ...(ctx.variants ? { variants: ctx.variants } : {}), ...(it.slots ? { slots: it.slots } : {}), ...(it.details ?? {}) };
  out.push({ id: it.id, title: it.title, group: it.group, kind: "reminder", text, when: it.when, documented: it.documented ?? null, details, provenance: [prov] });
}

// ---------- self-check: re-parse bytes at each offset and confirm static pieces appear in order ----------
const bin = new Map();
const problems = [];
for (const item of out) {
  if (item.text === null) continue;
  const p = item.provenance[0]; const f = manifest.get(p.file);
  if (!bin.has(p.file)) bin.set(p.file, readFileSync(`${ROOT}work/extracted/${p.file}`));
  const bytes = bin.get(p.file).subarray(p.binary_offset - f.file_offset, p.binary_offset - f.file_offset + p.length).toString("utf8");
  let node; try { node = acorn.parseExpressionAt(bytes, 0, { ecmaVersion: "latest" }); } catch (e) { problems.push(`${item.id}: bytes at offset do not parse`); continue; }
  if (item.id === "system-reminder-wrapper") { if (node.value !== "<system-reminder>") problems.push(`${item.id}: literal mismatch`); continue; }
  // flatten the top-level structure into static pieces and expression gaps
  const seq = []; (function collect(n) {
    if (n.type === "Literal" && typeof n.value === "string") seq.push({ s: n.value });
    else if (n.type === "TemplateLiteral") n.quasis.forEach((q, k) => { seq.push({ s: q.value.cooked }); if (k < n.expressions.length) { const x = n.expressions[k]; seq.push(x.type === "Literal" && typeof x.value === "string" ? { s: x.value } : { gap: true }); } });
    else if (n.type === "BinaryExpression" && n.operator === "+") { collect(n.left); collect(n.right); }
    else seq.push({ gap: true });
  })(node);
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const consts = Object.values(item.details.constants ?? {}).sort((a, b) => b.length - a.length).map(esc);
  const gap = `(?:\\{\\{[\\s\\S]*?\\}\\}${consts.length ? "|" + consts.join("|") : ""})*`;
  const re = new RegExp("^" + seq.map(x => (x.gap ? gap : esc(x.s))).join("") + "$");
  if (!re.test(item.text)) problems.push(`${item.id}: text does not match the literal at its offset`);
}

// ---------- coverage: every attachment type with a renderer has an item or is listed as silent ----------
{
  const types = new Set(["teammate_mailbox", "team_context"]);
  walk.simple(info(MAIN).ast, {
    ObjectExpression(n) { const keys = n.properties.map(p => p.key?.name ?? p.key?.value); if (keys.includes("poll_events") && keys.includes("teammate_shutdown_batch")) keys.forEach(k => types.add(k)); },
    SwitchStatement(n) { const labels = n.cases.map(c => c.test?.value); if (labels.includes("todo_reminder") && labels.includes("memory_update")) labels.filter(Boolean).forEach(l => types.add(l)); },
    ArrayExpression(n) { const v = n.elements.map(e => e?.value); if (v.includes("autocheckpointing") && v.includes("context_tip")) v.forEach(x => types.add(x)); },
  });
  const covered = new Set(out.map(o => o.details.attachment_type).filter(Boolean));
  const silent = out.find(o => o.id === "silent-attachment-types").when;
  const missing = [...types].filter(t => !covered.has(t) && !new RegExp(`\\b${t}\\b`).test(silent));
  if (missing.length) problems.push(`attachment types without an item: ${missing.join(", ")}`);
  else console.log(`coverage: all ${types.size} attachment types with renderers are covered`);
}
// ---------- slots keys must occur verbatim in the text ----------
for (const o of out) for (const k of Object.keys(o.details.slots ?? {})) if (!o.text?.includes(k)) problems.push(`${o.id}: slot key not in text: ${k}`);
// ---------- captured requests: attribution reminder and trailing system message ----------
{
  const byId = id => out.find(o => o.id === id);
  for (const cap of ["work/capture/req-02.json", "work/capture/interactive/req-03.json"]) {
    const body = JSON.parse(readFileSync(`${ROOT}${cap}`, "utf8")).body;
    const rawFirst = body.messages[0].content[0].text;
    if (!rawFirst.endsWith("</system-reminder>\n")) problems.push(`${cap}: expected one trailing newline after the attribution reminder`);
    const first = rawFirst.replace(/\n$/, "");
    const m = /- End git commit messages with:\n([\s\S]*?)\n- End pull request descriptions with:\n([\s\S]*?)\n<\/system-reminder>$/.exec(first);
    if (!m) { problems.push(`${cap}: attribution lines not found`); continue; }
    const lines = [byId("attribution-commit-line").text.replace("{{commit}}", m[1]), byId("attribution-pr-line").text.replace("{{pr}}", m[2])].join("\n");
    const built = "<system-reminder>\n" + byId("attribution-reminder").text.replace("{{expr:r}}", byId("attribution-precedence-default").text).replace("{{expr:n.join(`\\n`)}}", lines) + "\n</system-reminder>";
    if (built !== first) problems.push(`${cap}: rebuilt attribution reminder differs from the capture`);
    const sys = body.messages[1]; const t = typeof sys.content === "string" ? sys.content : sys.content.map(b => b.text).join("");
    if (sys.role !== "system" || t.includes("<system-reminder>") || !t.includes("\n\n" + byId("agent-listing").text + "\n") || !t.includes("\n\n" + byId("skill-listing").text.replace("{{content}}", "")) || !/\n\nToday's date is \d{4}-\d\d-\d\d\.$/.test(t))
      problems.push(`${cap}: trailing system message does not match the folding description`);
  }
  if (!problems.some(p => p.includes("capture"))) console.log("capture: attribution reminder rebuilt byte-for-byte; trailing system message is untagged and blank-line joined");
}

// ---------- write ----------
const json = { area: "system-reminders", version: VERSION, items: out };
writeFileSync(`${ROOT}outputs/system-reminders.json`, JSON.stringify(json, null, 2) + "\n");
const fence = s => { let n = 3; for (const m of (s.match(/`+|~+/g) ?? [])) n = Math.max(n, m.length + 1); return "~".repeat(Math.max(6, n)); };
const ORDER = ["Plan mode and modes", "Todo and task tracking", "Files and IDE", "Hooks", "Memory and CLAUDE.md", "Context and compaction", "Permissions and auto mode", "Background tasks, agents and teammates", "Skills and commands", "Billing and limits", "Other"];
const groups = ORDER.filter(g => out.some(o => o.group === g));
if (out.some(o => !ORDER.includes(o.group))) throw new Error("unknown group");
let md = `# System reminders and mid-conversation injections\n\n`;
md += `Text Claude Code injects into the conversation after the system prompt: attachment messages, <system-reminder> blocks, hook output, mode reminders and harness-written tool-result notes. Placeholders: {{field}} is a field of the attachment or other value named in code; {{expr:…}} is a raw expression whose meaning was not established. Module-level string constants (tool names and similar) are inlined and listed per item. Placement depends on the model: see "System-role folding of attachments" under Other. On models with mid-conversation system support, most attachment text reaches the model in a role-system message without <system-reminder> tags.\n`;
for (const g of groups) {
  md += `\n## ${g}\n`;
  for (const o of out.filter(x => x.group === g)) {
    const p = o.provenance[0];
    md += `\n### ${o.title}\n\nSource: \`${p.file}\` · offset ${p.binary_offset} · sha256 \`${p.sha256.slice(0, 8)}…\`${o.details.attachment_type ? ` · attachment \`${o.details.attachment_type}\`` : ""}\n\n`;
    md += `- When: ${o.when}\n- Wrapping: ${o.details.wrapping}\n- Placement: ${o.details.placement}\n`;
    if (o.details.slots) md += `- Slots: ${Object.entries(o.details.slots).map(([k, v]) => `\`${k}\` = ${v}`).join("; ")}\n`;
    if (o.details.lists) md += `- Lists: ${o.details.lists.map(l => `\`${l.placeholder}\` is a list, one entry per item formatted \`${l.entry_format.replace(/\n/g, "\\n")}\`, joined by \`${l.separator.replace(/\n/g, "\\n")}\``).join("; ")}\n`;
    if (o.details.variants) md += `- Variants: ${o.details.variants.map(v => `\`${v.condition}\` → A: \`${v.A.replace(/\n/g, "\\n")}\` · B: \`${v.B.replace(/\n/g, "\\n")}\``).join("; ")}\n`;
    if (o.details.constants) md += `- Inlined constants: ${Object.values(o.details.constants).map(v => `\`${v}\``).join(", ")}\n`;
    if (o.text !== null) { const f = fence(o.text); md += `\n${f}text\n${o.text}\n${f}\n`; }
  }
}
writeFileSync(`${ROOT}outputs/system-reminders.md`, md);
console.log(`items: ${out.length}`); for (const g of groups) console.log(`  ${g}: ${out.filter(o => o.group === g).length}`);
if (warnings.length) console.log("warnings:\n  " + warnings.join("\n  "));
if (problems.length) { console.log("CHECK FAILURES:\n  " + problems.join("\n  ")); process.exitCode = 1; } else console.log("check: static text verified at every offset");
