// Claude Code transcript adapter: the session JSONL plus <session>/subagents/
// agent-*.jsonl (+ .meta.json) -> the normalized Trace model.
import {
  readLines, newAgent, addBlock, tokensClaude, imageDims, estEncrypted, estText,
  classifyClaudeTool, RANK, finalizeAgent, partText, splitReminders, inheritTraits, spansOf,
} from "../model.js";
import { attachmentText } from "./cc-templates.js";

const ts = (s) => Date.parse(s);

export function isClaudeRow(row) {
  return !!(row && typeof row.type === "string" && ("sessionId" in row || "parentUuid" in row || "leafUuid" in row));
}

// Attachment types whose rendered text is the human's own words or their
// instruction files ("you"); tool/file content ("outside"); everything else
// rendered is harness text inserted between turns ("injected").
const ATT_KIND = { queued_command: "you", nested_memory: "you", instructions: "you", file: "outside" };

// Home directories shortened for labels; the text itself is shown unchanged.
export const shortPath = (p) => String(p || "").replace(/^\/(?:Users|home)\/[^/]+\//, "~/");
const listOf = (xs, n = 3) => (xs || []).slice(0, n).join(", ") + ((xs || []).length > n ? ` +${xs.length - n}` : "");

// Attachments that carry the user's own setup: a label that says what it is, and a source key so a
// second copy in the same context window shows up as a re-send.
// parts: the strings in the row that are the user's own, located in the rendered text for userSpans.
function ownAttachment(type, a) {
  switch (type) {
    case "nested_memory": { const c = a.content && typeof a.content.content === "string" ? a.content.content : undefined; return { label: `nested memory · ${shortPath(a.path || a.displayPath)}`, source: `file:${a.path || a.displayPath}`, identity: c, parts: [c] }; }
    case "skill_listing": return { label: `skills list${a.skillCount ? ` (${a.skillCount})` : ""}`, source: "skills-list", parts: [a.content] };
    case "invoked_skills": return { label: `invoked skills re-sent: ${listOf((a.skills || []).map((x) => (x && x.name) || x))}`, source: null, parts: (a.skills || []).map((x) => x && x.content) };
    case "hook_additional_context": return { label: `hook output · ${a.hookEvent || a.hookName || "hook"}`, source: `hook:${a.hookEvent || a.hookName || ""}`, parts: Array.isArray(a.content) ? a.content : [a.content] };
    case "mcp_instructions_delta": return { label: `MCP server instructions: ${listOf(a.addedNames)}`, source: null, parts: a.addedBlocks };
    // instructions whose per-file headers weren't found: still the user's files, as one block
    case "instructions": return { label: "instructions (CLAUDE.md files and memory)", source: "instructions" };
    default: return null;
  }
}

// Older Claude Code versions log many attachments without `rendered`; the text the model got is
// then in the row's own fields. One entry per block: { path (under attachment), text, and the
// label/kind/own/source/identity that differ from the defaults }. Null: no literal text here.
function fieldBlocks(type, a) {
  const str = (v) => (typeof v === "string" && v.trim() ? v : null);
  const strs = (v) => (Array.isArray(v) && v.length && v.every((x) => typeof x === "string") ? v : null);
  const mine = (extra) => { const { parts: _p, ...o } = ownAttachment(type, a) || {}; return { own: true, userWhole: true, ...o, ...extra }; };
  switch (type) {
    case "instructions": {
      const out = (a.files || []).map((f, k) => f && str(f.content) && { path: ["files", k, "content"], text: f.content, kind: "you", own: true, userWhole: true,
        label: `${/mem/i.test(f.type || "") ? "memory index" : "instructions file"} · ${shortPath(f.path)}`, source: `file:${f.path}`, identity: f.content }).filter(Boolean);
      return out.length ? out : null;
    }
    case "nested_memory": { const c = a.content && a.content.content; return str(c) ? [mine({ path: ["content", "content"], text: c, kind: "you", identity: c })] : null; }
    case "skill_listing": return str(a.content) ? [mine({ path: ["content"], text: a.content })] : null;
    case "invoked_skills": {
      const out = (a.skills || []).map((x, k) => x && str(x.content) && { path: ["skills", k, "content"], text: x.content, own: true, userWhole: true, label: `invoked skill re-sent · ${x.name}`, source: `skill:${x.name}` }).filter(Boolean);
      return out.length ? out : null;
    }
    case "hook_additional_context": return strs(a.content) || str(a.content) ? [mine({ path: ["content"], text: partText(a.content) })] : null;
    case "hook_blocking_error": { const t = a.blockingError && a.blockingError.blockingError; return str(t) ? [{ path: ["blockingError", "blockingError"], text: t, own: true, userWhole: true, label: `hook blocked · ${a.hookEvent || a.hookName || "hook"}` }] : null; }
    case "mcp_instructions_delta": return strs(a.addedBlocks) ? [mine({ path: ["addedBlocks"], text: partText(a.addedBlocks) })] : null;
    case "agent_listing_delta": case "deferred_tools_delta": return strs(a.addedLines) ? [{ path: ["addedLines"], text: partText(a.addedLines) }] : null;
    case "edited_text_file": return str(a.snippet) ? [{ path: ["snippet"], text: a.snippet }] : null;
    case "file": { const c = a.content && a.content.file && a.content.file.content; return str(c) ? [{ path: ["content", "file", "content"], text: c }] : null; }
    case "read_truncation_notice": return str(a.banner) ? [{ path: ["banner"], text: a.banner }] : null;
    default: return str(a.text) ? [{ path: ["text"], text: a.text }] : null;
  }
}

// The instructions attachment holds every CLAUDE.md-style file and the memory index in one
// reminder, each under "Contents of <path> (…):". One block per file, by range, so each file is
// labelled by its path; the wrapper text around them is the product's.
function splitInstructions(content, files) {
  const heads = [];
  for (const f of files || []) {
    const at = f && f.path ? content.indexOf(`Contents of ${f.path}`) : -1;
    if (at >= 0) heads.push({ at, f });
  }
  heads.sort((x, y) => x.at - y.at);
  if (!heads.length) return null;
  const close = content.lastIndexOf("</system-reminder>");
  const out = [{ start: 0, end: heads[0].at, file: null }];
  heads.forEach((h, k) => out.push({ start: h.at, end: k + 1 < heads.length ? heads[k + 1].at : close > h.at ? close : content.length, file: h.f }));
  if (close > heads.at(-1).at) out.push({ start: close, end: content.length, file: null });
  return out.filter((x) => content.slice(x.start, x.end).trim());
}
// Attachment rows that never enter the model's context on their own.
const NOT_IN_CONTEXT = new Set(["hook_success", "thinking_drop", "command_permissions"]);
const AGENT_TOOLS = new Set(["Agent", "Task", "SendMessage", "TaskOutput"]);
// The ids a notification names: its <task-id> and <tool-use-id>, and agentId-style mentions.
const noteIds = (s) => [...s.matchAll(/<(?:task-id|tool-use-id)>\s*([^<\s]+)/g)].map((x) => x[1])
  .concat((s.match(/\b(?:agentId|agent_id|task_id)["=:>\s]+([A-Za-z0-9_-]{6,})/g) || []).map((x) => x.replace(/^.*[=:>\s"]/, "")));

// A user text that opens with <teammate-message> or <cross-session-message> elements (after at most a
// short harness prefix, "Another Claude session sent a message:") batches several messages: one segment
// per element, credited to its own sender, the prefix going with the first. Text between and after the
// elements is reminders or the harness's note on the batch ("This came from another Claude session…",
// "IMPORTANT: This is NOT from your user…"), never the human's; a reminder quoted inside an element stays
// the sender's. A teammate is an agent of this session; a cross-session sender is another Claude session
// (a peer), named by its from-name. Null when the text is not such a batch.
const AGENT_MESSAGE = /<(teammate-message|cross-session-message)\b[^>]*>/g;
function splitAgentMessages(s) {
  const open = new RegExp(AGENT_MESSAGE.source, "g");
  let m = open.exec(s);
  if (!m || m.index > 400 || /<system-reminder>/.test(s.slice(0, m.index))) return null;
  const out = [];
  const gap = (a, b) => { for (const g of splitReminders(s.slice(a, b))) out.push({ ...g, start: a + g.start, end: a + g.end, note: !g.reminder }); };
  let last = 0;
  for (let first = true; m; first = false) {
    const closeTag = `</${m[1]}>`;
    const close = s.indexOf(closeTag, m.index + m[0].length);
    const end = close < 0 ? s.length : close + closeTag.length;
    if (!first) gap(last, m.index);
    let start = first ? 0 : m.index;
    while (start < m.index && /\s/.test(s[start])) start++;
    const attr = (name) => (m[0].match(new RegExp(`${name}="([^"]*)"`)) || [])[1];
    out.push(m[1] === "teammate-message"
      ? { start, end, reminder: false, teammate: attr("teammate_id") || "teammate" }
      : { start, end, reminder: false, peer: { name: attr("from-name") || attr("from") || "another session", mode: attr("from-mode") || null } });
    last = end;
    open.lastIndex = end;
    m = open.exec(s);
  }
  gap(last, s.length);
  return out;
}

function textKind(s, isSub) {
  const h = s.trimStart();
  // Agent messages may carry a short harness prefix ("Another Claude session sent a message:").
  const head = h.slice(0, 400);
  const tm = head.match(/<teammate-message[^>]*teammate_id="([^"]+)"/);
  if (tm) return { kind: "agents", label: `teammate-message from ${tm[1]}`, teammate: tm[1], ask: isSub };
  if (/<task-notification>/.test(head)) return { kind: "agents", label: "task-notification" };
  const cs = head.match(/<cross-session-message\b[^>]*>/);
  if (cs) return { kind: "agents", label: `cross-session message from ${(cs[0].match(/from-name="([^"]*)"/) || [])[1] || "another session"}` };
  if (/^\[Cross-session delivery notice\]/.test(h)) return { kind: "injected", label: "cross-session delivery notice" };
  if (/^<(command-name|command-message|command-args|bash-input)>/.test(h)) return { kind: "you", label: "command", ask: !isSub, human: true };
  if (/^<(local-command-stdout|local-command-stderr|local-command-caveat)>/.test(h)) return { kind: "injected", label: "local-command output" };
  if (/^<(bash-stdout|bash-stderr)>/.test(h)) return { kind: "outside", label: "bash output" };
  if (isSub) return { kind: "agents", label: "prompt from parent", ask: true };
  return { kind: "you", label: "user", ask: true, human: true };
}

export async function parseClaudeFile(source, fileIndex, { meta = null, agentId = null, onProgress, index = null } = {}) {
  const isSub = !!meta || !!agentId;
  const agent = newAgent({ file: fileIndex, kind: isSub ? "subagent" : "root" }, index);
  const st = {
    agent, meta, agentId, sessionId: null, version: null, title: null, spawnCalls: [], workflowCalls: [], agentBlocks: [],
    side: [], badLines: 0, firstT: null, lastT: null, attachmentTypes: {}, bytesRead: 0,
  };
  let windowStart = 0;
  const byRid = new Map();
  const toolUses = new Map();
  const uuidBlocks = new Map();
  let harness = [];
  let needHarness = false;
  let sawSnapshot = false;
  let perm = { permissionMode: meta && meta.permissionMode ? meta.permissionMode : null, mode: null, allowedTools: null };
  let lastCompaction = null;
  let lineRef = null;
  let lastT = null;

  const track = (uuid, b) => { if (!uuid || !b) return; const l = uuidBlocks.get(uuid); l ? l.push(b.i) : uuidBlocks.set(uuid, [b.i]); };

  // prompt_snapshot rows come in pairs: the system prompt first, then the same
  // prompt with tools and cliPrefix, which can be logged after the first request
  // that used it. The tools block is then also counted for those earlier requests
  // (request.extra: blocks in context that sit after the request's window).
  function emitSnapshot(a, ref, t) {
    const sys = partText((a.systemPrompt || []).filter((s) => s !== "__SYSTEM_PROMPT_DYNAMIC_BOUNDARY__"));
    const prevSys = harness.find((h) => h.label === "system prompt");
    const reuse = prevSys && prevSys.i >= windowStart && prevSys.chars === sys.length && !harness.some((h) => h.label.startsWith("tool definitions"));
    if (!reuse) harness = [addBlock(agent, { t, kind: "harness", label: "system prompt", ref: { ...ref, path: ["attachment", "systemPrompt"] }, text: sys, render: "literal" })];
    const added = [];
    if (a.cliPrefix) added.push(addBlock(agent, { t, kind: "harness", label: "cli prefix", ref: { ...ref, path: ["attachment", "cliPrefix"] }, text: a.cliPrefix, render: "literal" }));
    if (a.tools) {
      const compact = JSON.stringify(a.tools);
      const b = addBlock(agent, { t, kind: "harness", label: `tool definitions (${a.tools.length})`, ref: { ...ref, path: ["attachment", "tools"] }, est: estText(compact.length), render: "literal" });
      b.chars = compact.length;
      added.push(b);
    }
    harness.push(...added);
    if (reuse && added.length) {
      for (const r of agent.requests) if (r.window && r.window[0] === windowStart && r.window[1] >= prevSys.i) r.extra = (r.extra || []).concat(added.map((b) => b.i));
    }
    sawSnapshot = true;
    needHarness = false;
  }

  function flushPending() {
    if (needHarness && harness.length) {
      harness = harness.map((h) => { const b = addBlock(agent, { t: lastT, kind: "harness", label: h.label, ref: h.ref, est: h.est, render: h.render, carried: true, site: h.site }); b.chars = h.chars; return b; });
      needHarness = false;
    }
  }

  function textBlocks(s, path, t, uuid, row, forceKind) {
    // A peer session's message is logged as a meta row (origin.kind "peer"); it is still split by sender.
    const peerRow = !!(row.origin && row.origin.kind === "peer");
    const segs = (!forceKind && (!row.isMeta || peerRow) && splitAgentMessages(s)) || splitReminders(s);
    for (const seg of segs) {
      const whole = seg.start === 0 && seg.end === s.length;
      const ref = { ...lineRef, path, ...(whole ? {} : { range: [seg.start, seg.end] }) };
      const text = s.slice(seg.start, seg.end);
      if (seg.reminder) { track(uuid, addBlock(agent, { t, kind: "injected", label: "system-reminder", ref, text, render: "literal" })); continue; }
      if (seg.note) { track(uuid, addBlock(agent, { t, kind: "injected", label: "cross-session note", ref, text, render: "literal" })); continue; }
      if (forceKind) {
        const b = addBlock(agent, { t, kind: forceKind.kind, label: forceKind.label, ref, text });
        const pm = text.match(/tool-results\/([\w.-]+)/);
        if (pm) b.persisted = pm[1];
        track(uuid, b);
        continue;
      }
      if (seg.peer) {
        const b = addBlock(agent, { t, kind: "agents", label: `cross-session message from ${seg.peer.name}`, ref, text });
        const o = peerRow ? row.origin : null;
        b.peer = { name: seg.peer.name, mode: seg.peer.mode || (o && o.fromMode) || null, verified: !!(o && o.verifiedPeerPid) };
        track(uuid, b);
        st.agentBlocks.push({ t, block: b.i, teammate: null, peer: b.peer.name, ids: [] });
        continue;
      }
      if (row.isMeta && /^\s*\[Cross-session delivery notice\]/.test(text)) {
        track(uuid, addBlock(agent, { t, kind: "injected", label: "cross-session delivery notice", ref, text, render: "literal" }));
        continue;
      }
      if (row.isMeta) {
        const tu = row.sourceToolUseID ? toolUses.get(row.sourceToolUseID) : null;
        const skill = tu && tu.name === "Skill" ? tu.skill : null;
        const b = addBlock(agent, { t, kind: "injected", label: row.sourceToolUseID ? (skill ? `skill · ${skill}` : "skill content") : "meta", ref, text, render: "literal", ...(row.sourceToolUseID ? { own: true, userWhole: true, source: skill ? `skill:${skill}` : null } : {}) });
        track(uuid, b);
        // A background subagent's final report can come back as <agent-message from="<agent id>">.
        const hand = /<agent-message from="([^"]+)"/.exec(text);
        if (hand) st.agentBlocks.push({ t, block: b.i, teammate: null, notification: true, handBack: true, ids: [hand[1]] });
        continue;
      }
      const k = seg.teammate ? { kind: "agents", label: `teammate-message from ${seg.teammate}`, teammate: seg.teammate, ask: isSub }
        : row.origin && row.origin.kind === "task-notification" ? { kind: "agents", label: "task-notification" } : textKind(text, isSub);
      const b = addBlock(agent, { t, kind: k.kind, label: k.label, ref, text });
      track(uuid, b);
      if (k.kind === "agents") st.agentBlocks.push({ t, block: b.i, teammate: k.teammate || null, notification: k.label === "task-notification", ids: noteIds(text),
        idle: !!k.teammate && /<teammate-message[^>]*>\s*\{\s*"type"\s*:\s*"idle_notification"/.test(text) });
      if (k.ask) {
        agent.asks.push({ t, request: null, block: b.i, from: k.human ? "human" : "agent", ...(k.teammate ? { by: k.teammate } : {}) });
        if (!st.title && k.human) st.title = text.trim().slice(0, 120);
      }
    }
  }

  function newRequests(r, t) {
    flushPending();
    const m = r.message || {};
    const u = m.usage || {};
    const its = Array.isArray(u.iterations) && u.iterations.length ? u.iterations : [{ ...u, type: "message" }];
    const msgIts = its.filter((x) => (x.type || "message") === "message");
    const list = [];
    const end = agent.blocks.length - 1;
    msgIts.forEach((it, k) => {
      const tokens = tokensClaude(it);
      if (k === msgIts.length - 1) tokens.reasoning = (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0;
      else tokens.reasoning = 0;
      if (!tokens.context && !tokens.output) return;
      // requestId (the API's request-id) and messageId (message.id) are the keys a network capture joins on.
      const req = { i: agent.requests.length, t, model: m.model || null, tokens, window: [windowStart, end], strata: null, action: null, reasoning: null, requestId: r.requestId || m.id || null, messageId: m.id || null };
      if (msgIts.length > 1) { req.iteration = k; req.iterations = msgIts.length; }
      req._perm = { ...perm };
      agent.requests.push(req);
      list.push(req);
      if (lastCompaction && lastCompaction.post == null) lastCompaction.post = tokens.context;
    });
    for (const it of its) if (it.type && it.type !== "message") st.side.push({ t, model: it.model || m.model || null, kind: it.type, tokens: tokensClaude(it), parentRequest: list.length ? list[0].i : null, requestId: r.requestId || null, messageId: m.id || null });
    return list;
  }

  for await (const line of readLines(source, { onProgress })) {
    let r;
    try { r = JSON.parse(line.text); } catch { if (!line.partial) st.badLines++; continue; }
    st.bytesRead = line.offset + line.length + (line.partial ? 0 : 1);
    lineRef = { file: fileIndex, offset: line.offset, length: line.length };
    const t = r.timestamp ? ts(r.timestamp) : lastT;
    if (Number.isFinite(t)) { lastT = t; if (st.firstT == null) st.firstT = t; st.lastT = t; }
    if (r.sessionId && !st.sessionId) st.sessionId = r.sessionId;
    if (r.version) st.version = r.version;
    if (r.agentId && !st.agentId) st.agentId = r.agentId;

    switch (r.type) {
      case "permission-mode": perm = { ...perm, permissionMode: r.permissionMode ?? r.mode ?? perm.permissionMode }; continue;
      case "mode": perm = { ...perm, mode: r.mode ?? perm.mode }; continue;
      case "ai-title": st.aiTitle = r.aiTitle || r.title || st.aiTitle; continue;
      case "system": {
        if (r.subtype === "compact_boundary") {
          const cm = r.compactMetadata || {};
          flushPending();
          windowStart = agent.blocks.length;
          const pres = (cm.preservedMessages && (cm.preservedMessages.allUuids || cm.preservedMessages.uuids)) || [];
          for (const u of pres) for (const bi of uuidBlocks.get(u) || []) {
            const src = agent.blocks[bi];
            const b = inheritTraits(addBlock(agent, { t, kind: src.kind, label: src.label, ref: src.ref, est: src.est, image: src.image, render: src.render, carried: true, site: src.site }), src);
            if (src.template) b.template = src.template;
            b.chars = src.chars;
            if (src.flags) { b.flags = src.flags; b.flagHits = src.flagHits; }
          }
          needHarness = true;
          lastCompaction = { t, pre: cm.preTokens ?? null, post: null, loggedPost: cm.postTokens ?? null, trigger: cm.trigger || null, block: null, boundaryRef: lineRef };
          agent.compactions.push(lastCompaction);
        }
        continue;
      }
      case "attachment": {
        const a = r.attachment || {};
        const type = a.type || "unknown";
        st.attachmentTypes[type] = st.attachmentTypes[type] || { rows: 0, literal: 0, structured: 0, skipped: 0 };
        const tally = st.attachmentTypes[type];
        tally.rows++;
        if (type === "prompt_snapshot") {
          emitSnapshot(a, lineRef, t);
          tally.literal++;
          continue;
        }
        if (type === "deferred_tools_record") {
          const compact = JSON.stringify(a.entries || []);
          const b = addBlock(agent, { t, kind: "harness", label: `deferred tool schemas (${(a.entries || []).length})`, ref: { ...lineRef, path: ["attachment", "entries"] }, est: estText(compact.length), render: "literal" });
          b.chars = compact.length;
          harness.push(b);
          tally.literal++;
          continue;
        }
        if (type === "command_permissions") perm = { ...perm, allowedTools: a.allowedTools || [] };
        if (Array.isArray(r.rendered) && r.rendered.length) {
          const text = partText(r.rendered);
          const kind = ATT_KIND[type] || "injected";
          const rm = agent._ix && agent._ix.reminders[type];
          const one = r.rendered.length === 1 && r.rendered[0] && typeof r.rendered[0].content === "string";
          const parts = type === "instructions" && one ? splitInstructions(r.rendered[0].content, a.files) : null;
          if (parts) {
            for (const x of parts) {
              const ref = { ...lineRef, path: ["rendered", 0, "content"], range: [x.start, x.end] };
              const piece = text.slice(x.start, x.end);
              // The product's wording around the user's files is part of the harness.
              if (!x.file) { track(r.uuid, addBlock(agent, { t, kind: "harness", label: "instructions wrapper", ref, text: piece, render: "literal", ...(rm ? { site: { ...rm } } : {}) })); continue; }
              const what = /mem/i.test(x.file.type || "") ? "memory index" : "instructions file";
              const content = typeof x.file.content === "string" ? x.file.content : undefined;
              track(r.uuid, addBlock(agent, { t, kind, label: `${what} · ${shortPath(x.file.path)}`, ref, text: piece, render: "literal", own: true, source: `file:${x.file.path}`, identity: content, userSpans: content ? spansOf(piece, [content]) : null }));
            }
            tally.literal++;
            continue;
          }
          const mine = ownAttachment(type, a);
          const b = addBlock(agent, { t, kind, label: mine ? mine.label : type, ref: { ...lineRef, path: ["rendered"] }, text, render: "literal", ...(rm ? { site: { ...rm } } : {}),
            ...(mine ? { own: true, source: mine.source, identity: mine.identity, userSpans: mine.parts ? spansOf(text, mine.parts) : null } : {}) });
          track(r.uuid, b);
          tally.literal++;
          if (type === "queued_command" && a.commandMode === "task-notification") st.agentBlocks.push({ t, block: b.i, teammate: null, notification: true, ids: noteIds(partText(a.prompt)) });
          if (type === "queued_command" && (a.humanTurn || (a.origin && a.origin.kind === "human")) && !isSub) agent.asks.push({ t, request: null, block: b.i, from: "human" });
          continue;
        }
        // A task-notification queued mid-turn without rendered text: no block, but still where a
        // background agent came back (buildClaudeTrace returns).
        if (type === "queued_command" && a.commandMode === "task-notification") st.agentBlocks.push({ t, block: null, teammate: null, notification: true, ids: noteIds(partText(a.prompt)) });
        if (NOT_IN_CONTEXT.has(type) || type === "queued_command") { tally.skipped++; continue; }
        const fields = fieldBlocks(type, a);
        if (fields) {
          const rm = agent._ix && agent._ix.reminders[type];
          for (const f of fields) {
            const { path, text, label, kind, ...rest } = f;
            track(r.uuid, addBlock(agent, { t, kind: kind || ATT_KIND[type] || "injected", label: label || type, ref: { ...lineRef, path: ["attachment", ...path] }, text, render: "from the row's fields", ...(rm ? { site: { ...rm } } : {}), ...rest }));
          }
          tally.literal++;
          continue;
        }
        // No rendered text and no text field: rebuilt from the site's template for this type, filled
        // from the row's fields; else the fields as "key: value" lines, labelled structured.
        const rm = agent._ix && agent._ix.reminders[type];
        const tpl = agent._ix && agent._ix.templates;
        const { text, template } = attachmentText(type, a, tpl);
        const at = template && tpl[template];
        const site = at && at.slug ? { slug: at.slug, anchor: at.anchor || null, title: at.title || template } : rm ? { ...rm } : null;
        const b = addBlock(agent, { t, kind: "injected", label: type, ref: { ...lineRef, path: ["attachment"], rebuild: type }, text, render: template ? "rebuilt from the ccprompts template" : "structured", site });
        if (template) b.template = template;
        track(r.uuid, b);
        tally.structured++;
        continue;
      }
      case "user": {
        const m = r.message || {};
        const c = m.content;
        if (r.isCompactSummary) {
          const b = addBlock(agent, { t, kind: "summary", label: "compaction summary", ref: { ...lineRef, path: ["message", "content"] }, text: partText(c) });
          track(r.uuid, b);
          if (lastCompaction && lastCompaction.block == null) lastCompaction.block = b.i;
          continue;
        }
        if (typeof c === "string") { textBlocks(c, ["message", "content"], t, r.uuid, r); continue; }
        if (!Array.isArray(c)) continue;
        c.forEach((x, k) => {
          const path = ["message", "content", k];
          if (x.type === "tool_result") {
            const tu = toolUses.get(x.tool_use_id);
            const name = tu ? tu.name : "tool";
            const kind = AGENT_TOOLS.has(name) ? "agents" : "outside";
            const label = `${name} result`;
            const made = [];
            const before = agent.blocks.length;
            if (typeof x.content === "string") textBlocks(x.content, path.concat(["content"]), t, r.uuid, r, { kind, label });
            else if (Array.isArray(x.content)) x.content.forEach((y, j) => {
              const p2 = path.concat(["content", j]);
              if (y.type === "image") track(r.uuid, addBlock(agent, { t, kind, label: `${name} image`, ref: { ...lineRef, path: p2.concat(["source"]) }, image: imageDims(y.source && y.source.data) || {} }));
              else if (y.type === "text") textBlocks(y.text || "", p2.concat(["text"]), t, r.uuid, r, { kind, label });
              else track(r.uuid, addBlock(agent, { t, kind, label: `${name} ${y.type || "item"}`, ref: { ...lineRef, path: p2 }, text: partText(y) }));
            });
            for (let j = before; j < agent.blocks.length; j++) made.push(agent.blocks[j]);
            const first = made.find((b) => b.kind !== "injected") || made[0];
            if (tu && first) {
              tu.action.result = first.ref;
              if (x.is_error) tu.action.error = true;
            }
            if (tu && tu.workflow) {
              tu.workflow.result = partText(x.content);
              tu.workflow.runId = (r.toolUseResult && r.toolUseResult.runId) || null;
            }
            if (kind === "agents" && first) st.agentBlocks.push({ t, block: first.i, callId: x.tool_use_id, teammate: null, ids: [], status: (r.toolUseResult && r.toolUseResult.status) || null });
          } else if (x.type === "text") textBlocks(x.text || "", path.concat(["text"]), t, r.uuid, r);
          else if (x.type === "image") track(r.uuid, addBlock(agent, { t, kind: isSub ? "agents" : "you", label: "image", ref: { ...lineRef, path: path.concat(["source"]) }, image: imageDims(x.source && x.source.data) || {} }));
          else track(r.uuid, addBlock(agent, { t, kind: "outside", label: x.type || "item", ref: { ...lineRef, path }, text: partText(x) }));
        });
        continue;
      }
      case "assistant": {
        const m = r.message || {};
        const rid = r.requestId || m.id || r.uuid;
        let reqs = byRid.get(rid);
        if (!reqs) { reqs = newRequests(r, t); byRid.set(rid, reqs); }
        const main = reqs[reqs.length - 1] || null;
        (m.content || []).forEach((x, k) => {
          const path = ["message", "content", k];
          if (x.type === "thinking" || x.type === "redacted_thinking") {
            const txt = x.thinking || "";
            const b = addBlock(agent, { t, kind: "model", label: txt ? "thinking" : "thinking (encrypted)", ref: { ...lineRef, path: txt ? path.concat(["thinking"]) : path }, text: txt, est: estText(txt.length) + (txt ? 0 : estEncrypted((x.signature || x.data || "").length)) });
            track(r.uuid, b);
            if (main) main.reasoning = { summary: txt ? b.ref : (main.reasoning && main.reasoning.summary) || null, encrypted: !txt };
          } else if (x.type === "text") {
            const b = addBlock(agent, { t, kind: "model", label: "assistant", ref: { ...lineRef, path: path.concat(["text"]) }, text: x.text || "" });
            track(r.uuid, b);
            if (main && !main.action) main.action = { kind: "text", tool: null, target: null, class: "internal", args: b.ref, result: null };
          } else if (x.type === "tool_use") {
            const input = x.input || {};
            const args = JSON.stringify(input);
            const b = addBlock(agent, { t, kind: "model", label: `${x.name} call`, ref: { ...lineRef, path: path.concat(["input"]) }, text: args });
            track(r.uuid, b);
            const c = classifyClaudeTool(x.name, input);
            const action = { kind: "tool", tool: x.name, target: c.target, class: c.class, args: b.ref, result: null, callId: x.id };
            // A Workflow call's input and result text, to find the run it launched (buildClaudeTrace).
            const workflow = x.name === "Workflow" ? { t, callId: x.id, request: main ? main.i : null, input: args, result: "", runId: null } : null;
            if (workflow) st.workflowCalls.push(workflow);
            toolUses.set(x.id, { name: x.name, action, skill: x.name === "Skill" ? input.skill || input.name || null : null, workflow });
            if (x.name === "Agent" || x.name === "Task") st.spawnCalls.push({ t, callId: x.id, name: input.name || null, description: input.description || null, subagentType: input.subagent_type || null, request: main ? main.i : null, block: b.i });
            if (main) {
              if (!main.action || main.action.kind === "text") main.action = action;
              else {
                const all = main.action.all || [main.action];
                all.push(action);
                const best = all.reduce((p, q) => (RANK[q.class] > RANK[p.class] ? q : p));
                const { all: _drop, ...bestFields } = best;
                main.action = { ...bestFields, all };
              }
            }
          } else if (x.type === "server_tool_use") {
            const b = addBlock(agent, { t, kind: "model", label: `${x.name} call (server)`, ref: { ...lineRef, path }, text: JSON.stringify(x.input || {}) });
            track(r.uuid, b);
            if (x.name === "advisor" && reqs.length > 1 && !reqs[0].action) reqs[0].action = { kind: "tool", tool: "advisor", target: null, class: "internal", args: b.ref, result: null, callId: x.id };
          } else if (x.type === "advisor_tool_result") {
            const enc = (x.content && x.content.encrypted_content) || "";
            const txt = enc ? "" : partText(x.content);
            const b = addBlock(agent, { t, kind: "agents", label: enc ? "advisor result (encrypted)" : "advisor result", ref: { ...lineRef, path }, text: txt, est: enc ? estEncrypted(enc.length) : undefined });
            track(r.uuid, b);
            if (reqs[0] && reqs[0].action && reqs[0].action.tool === "advisor") reqs[0].action.result = b.ref;
          } else {
            track(r.uuid, addBlock(agent, { t, kind: /result/.test(x.type || "") ? "outside" : "model", label: x.type || "item", ref: { ...lineRef, path }, text: partText(x) }));
          }
        });
        continue;
      }
      default:
        continue;
    }
  }
  flushPending();
  // Harness not in the log: the reference index's size for this version (chars/4,
  // "inferred"), else the default: harness = context − other strata ("residual").
  const hx = !sawSnapshot && agent._ix && st.version && agent._ix.harness[st.version];
  if (sawSnapshot) agent.harnessSource = "logged";
  else if (hx) { agent.harnessSource = "inferred"; agent.harnessEst = Math.ceil(((hx.systemChars || 0) + (hx.toolsChars || 0)) / 4); }
  else agent.harnessSource = "residual";
  return st;
}

function permissionAt(req) {
  const p = req._perm || null;
  delete req._perm;
  return p;
}

// Joins the root and subagent files into one Trace.
export function buildClaudeTrace(parsed, files) {
  const root = parsed.find((p) => !p.meta && !p.agentId) || parsed[0];
  const notes = [];
  for (const p of parsed) {
    const a = p.agent;
    a.id = p === root ? p.sessionId || "root" : p.agentId || (p.meta && p.meta.name) || files[a.file].name;
    a.kind = p === root ? "root" : "subagent";
    a.name = p === root ? p.aiTitle || p.title || "root" : (p.meta && (p.meta.name || p.meta.agentType)) || a.id;
    a.description = p.meta ? p.meta.description || null : null;
    a.model = (a.requests.find((r) => r.model && r.model !== "<synthetic>") || {}).model || (p.meta && p.meta.model) || null;
    finalizeAgent(a, permissionAt);
  }
  // Parent links. A fork's transcript replays its parent's rows up to its own spawn call (the meta's
  // toolUseId); those copies spawned nothing, so only calls after it count.
  const spawnIndex = [];
  for (const p of parsed) {
    const own = p.meta && p.meta.toolUseId ? p.spawnCalls.find((s) => s.callId === p.meta.toolUseId) : null;
    for (const s of p.spawnCalls) if (!own || s.t > own.t) spawnIndex.push({ p, s });
  }
  const claimed = new Set();
  const link = (p, parent, s, linkedBy) => {
    p.parent = parent;
    p.agent.parentId = parent.agent.id;
    if (s) { p.agent.spawn = { t: s.t, parentRequest: s.request, callId: s.callId, linkedBy }; claimed.add(s.callId); }
  };
  // A Workflow run's agents sit in <session>/subagents/workflows/<run id>/ ("" when picked loose).
  const runOf = (p) => {
    const m = /\/subagents\/workflows\/([^/]+)\/[^/]+$/.exec(files[p.agent.file].name);
    return m ? m[1] : p.meta && p.meta.agentType === "workflow-subagent" ? "" : null;
  };
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const names = (text, id) => !!(id && text) && new RegExp(`(?:^|\\W)${esc(id)}(?![\\w-])`).test(text);
  // The root's Workflow call that launched the run: its runId, else the earliest whose result (then
  // input) names the run, else the closest before the agent's first row.
  const launch = (run, first) => {
    const before = root.workflowCalls.filter((w) => w.t <= first + 5000);
    return (run && (root.workflowCalls.find((w) => w.runId === run) || before.find((w) => names(w.result, run)) || before.find((w) => names(w.input, run)))) || before.at(-1) || null;
  };
  // Exact links first: a Workflow run's launch; the Agent/Task call the meta's toolUseId names; else
  // the call whose input name (else description) matches the meta, closest before the first row.
  const unlinked = [];
  for (const p of parsed) {
    if (p === root) continue;
    const m = p.meta || {};
    const first = p.firstT ?? Infinity;
    const w = runOf(p) != null ? launch(runOf(p), first) : null;
    if (w) { link(p, root, w, "workflow"); continue; }
    const match = (f) => spawnIndex.filter(({ p: q, s }) => q !== p && f(s) && s.t <= first + 5000).sort((x, y) => y.s.t - x.s.t)[0];
    const byId = m.toolUseId ? spawnIndex.find(({ p: q, s }) => q !== p && s.callId === m.toolUseId) : null;
    const hit = byId || (m.name && match((s) => s.name === m.name)) || (m.description && match((s) => s.description === m.description)) || null;
    if (hit) link(p, hit.p, hit.s, byId ? "toolUseId" : m.name && hit.s.name === m.name ? "name" : "description");
    else unlinked.push(p);
  }
  // The rest: the meta's spawnDepth says how deep it sits (teammates count from 0 at the root, other
  // subagents from 1). A nested one takes a subagent's unclaimed Agent/Task call in the 5 s before its
  // first row, closest first, unless the call names another agent (it spawned that one); else it hangs
  // from the root at that depth.
  for (const p of unlinked.sort((x, y) => (x.firstT ?? Infinity) - (y.firstT ?? Infinity))) {
    const m = p.meta || {};
    const first = p.firstT ?? Infinity;
    const want = !Number.isInteger(m.spawnDepth) ? 1 : m.taskKind === "in_process_teammate" ? m.spawnDepth + 1 : Math.max(1, m.spawnDepth);
    const near = want > 1 && spawnIndex.filter(({ p: q, s }) => q !== p && q !== root && !claimed.has(s.callId) && !(s.name && s.name !== m.name) && (q.firstT ?? Infinity) < first && s.t >= first - 5000 && s.t <= first).sort((x, y) => y.s.t - x.s.t)[0];
    if (near) { link(p, near.p, near.s, "time"); continue; }
    link(p, root, null);
    if (want > 1) {
      p.fixedDepth = want;
      notes.push(`subagent ${p.agent.id} (${p.agent.name}): meta spawnDepth ${m.spawnDepth} puts it at depth ${want}, but no Agent tool_use near its start spawned it; attached to root`);
    } else notes.push(`subagent ${p.agent.id} (${p.agent.name}): no matching ${runOf(p) != null ? "Workflow" : "Agent"} tool_use; attached to root`);
  }
  for (const p of parsed) {
    if (p === root) continue;
    let d = 0, q = p;
    for (; q && q !== root && q.fixedDepth == null && d < 20; q = q.parent) d++;
    p.agent.depth = d + (q && q.fixedDepth != null ? q.fixedDepth : 0);
  }
  // Returns: where a subagent's work landed in its parent, one per burst: the first signal after the
  // burst's last request, else the last inside it, never before the agent's first request after the
  // spawn (a fork's earlier requests are its parent's, replayed). Signals: the spawn call's own result
  // when the call waited for the agent (not a launch acknowledgement); a task-notification naming the
  // agent or its spawn call (background agents, and a Workflow run's agents when the run reports), or
  // the agent's hand-back message; a teammate's message. A teammate's return is its report, the burst's
  // last message with content (it often lands just before the burst's last request, the idle notice
  // after it); the first idle notice after that request only when the burst sent no report.
  const LAUNCHED = new Set(["teammate_spawned", "async_launched"]);
  for (const p of parsed) {
    if (p === root) continue;
    const a = p.agent, parent = p.parent, name = p.meta && p.meta.name;
    const callId = a.spawn && a.spawn.callId;
    const via = a.spawn && a.spawn.linkedBy === "workflow" ? "workflow" : "task-notification";
    const t0 = (a.requests.find((r) => !a.spawn || r.t > a.spawn.t) || {}).t;
    const after = t0 == null ? [] : parent.agentBlocks.filter((ab) => ab.t >= t0);
    // A notification logged without a block lands in the parent's first request after it.
    const landed = (ab) => (ab.block != null ? parent.agent.blocks[ab.block].seenBy : (parent.agent.requests.find((r) => r.t >= ab.t) || {}).i) ?? null;
    const ret = (ab, v) => a.returns.push({ t: ab.t, block: ab.block, parentRequest: landed(ab), via: v });
    const signals = [];
    for (const ab of after) {
      if (callId && ab.callId === callId && !LAUNCHED.has(ab.status)) signals.push([ab, "tool_result"]);
      else if (ab.notification && (ab.ids.includes(a.id) || (callId && ab.ids.includes(callId)))) signals.push([ab, ab.handBack ? "agent-message" : via]);
      else if (name && ab.teammate === name) signals.push([ab, "teammate-message"]);
    }
    signals.sort((x, y) => x[0].t - y[0].t);
    a.bursts.forEach((b, k) => {
      const next = a.bursts[k + 1];
      const inBurst = signals.filter(([ab]) => ab.t >= b.a && (!next || ab.t < next.a));
      const talk = inBurst.filter(([, v]) => v === "teammate-message");
      const report = talk.filter(([ab]) => !ab.idle).at(-1);
      const hit = report || inBurst.find(([ab]) => ab.t >= b.b - 1000) || inBurst.at(-1);
      if (hit) ret(...hit);
    });
  }
  // Side calls (advisor iterations): one side agent per calling agent and model.
  const sides = [];
  for (const p of parsed) {
    const groups = new Map();
    for (const s of p.side) {
      const key = `${s.kind}:${s.model}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    }
    for (const [key, list] of groups) {
      const kindName = list[0].kind === "advisor_message" ? "advisor" : list[0].kind;
      const a = newAgent({ id: `${p.agent.id}:${key}`, parentId: p.agent.id, kind: "side", name: `${kindName} (${list[0].model || "?"})`, model: list[0].model, depth: p.agent.depth + 1, file: p.agent.file });
      a.requests = list.map((s, i) => ({ i, t: s.t, model: s.model, tokens: s.tokens, window: null, strata: null, action: null, reasoning: null, requestId: s.requestId, messageId: s.messageId || null, parentRequest: s.parentRequest }));
      a.spawn = { t: list[0].t, parentRequest: list[0].parentRequest, callId: null };
      a.bursts = [];
      finalizeAgent(a);
      sides.push(a);
    }
  }
  for (const p of parsed) if (p.badLines) notes.push(`${files[p.agent.file].name}: ${p.badLines} unparsable lines skipped`);
  const agents = [root.agent, ...parsed.filter((p) => p !== root).sort((x, y) => (x.firstT ?? 0) - (y.firstT ?? 0)).map((p) => p.agent), ...sides];
  const times = parsed.flatMap((p) => [p.firstT, p.lastT]).filter(Number.isFinite);
  const attachments = {};
  for (const p of parsed) for (const [k, v] of Object.entries(p.attachmentTypes)) {
    const x = (attachments[k] = attachments[k] || { rows: 0, literal: 0, structured: 0, skipped: 0 });
    for (const f of Object.keys(v)) x[f] += v[f];
  }
  return {
    product: "claude-code",
    title: root.aiTitle || root.title || root.sessionId,
    version: root.version,
    contextWindow: null,
    started: Math.min(...times),
    ended: Math.max(...times),
    agents,
    files,
    notes,
    attachments,
  };
}
