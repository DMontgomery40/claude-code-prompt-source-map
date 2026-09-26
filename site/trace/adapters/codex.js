// Codex / ChatGPT desktop rollout adapter: one rollout JSONL per thread (root,
// spawned subagents, guardian reviews) -> the normalized Trace model.
import {
  readLines, newAgent, addBlock, tokensCodex, imageDims, estEncrypted, estText,
  classifyCodexCall, RANK, finalizeAgent, partText,
} from "../model.js";

const ts = (s) => Date.parse(s);
const COLLAB = new Set(["spawn_agent", "send_message", "followup_task", "wait_agent", "list_agents", "interrupt_agent", "close_agent"]);

export function isCodexFirstLine(row) {
  return !!(row && row.type === "session_meta" && row.payload && row.payload.id);
}

// Leading <tag ...>...</tag> sections inside a user.text item are app-injected
// context (e.g. <in-app-browser-context>); the rest is the human's text.
function splitLeadingTags(s) {
  const out = [];
  let i = 0;
  const re = /^\s*<([A-Za-z][\w-]*)\b[^>]*>/;
  while (i < s.length) {
    const m = re.exec(s.slice(i));
    if (!m) break;
    const close = s.indexOf(`</${m[1]}>`, i + m[0].length);
    if (close < 0) break;
    const end = close + m[1].length + 3;
    out.push({ start: i, end, tag: m[1] });
    i = end;
  }
  // The Codex app wraps a message that carries attachments or ambient UI state: a file list,
  // an instruction, maybe a context tag, then "## My request:" and what the user typed.
  const req = /(^|\n)## My request:[ \t]*\n/.exec(s.slice(i));
  if (req) {
    const pre = s.slice(i, i + req.index).trim();
    if (!pre || pre.startsWith("# Files mentioned by the user:")) {
      const end = i + req.index + req[0].length;
      out.push({ start: i, end, tag: pre ? "files-mentioned" : "my-request-header" });
      i = end;
    }
  }
  let a = i, b = s.length;
  while (a < b && /\s/.test(s[a])) a++;
  while (b > a && /\s/.test(s[b - 1])) b--;
  if (b > a) out.push({ start: a, end: b, tag: null });
  return out;
}

const firstLine = (s) => (s.match(/^\s*(?:<([\w-]+)|#+\s*(.+)|(.{0,60}))/) || []).slice(1).find(Boolean) || "";

// Parses one rollout file. Returns a thread record: { meta, agent, ... } with the
// raw links needed to join threads afterwards.
export async function parseCodexThread(source, fileIndex, { onProgress, index = null } = {}) {
  const agent = newAgent({ file: fileIndex }, index);
  const th = {
    meta: null, agent, callIndex: new Map(), spawns: [], agentMessages: [], reviews: [], escalations: [],
    perms: [], contextWindow: null, title: null, badLines: 0, bytesRead: 0, firstT: null, lastT: null,
  };
  let windowStart = 0;
  let requestsInWindow = 0;
  let outStart = null;
  let pendingCalls = [];
  const calls = new Map(); // callId -> call record
  let openCall = null;
  let model = null;
  let harnessBase = null;
  let inheritedUntil = -1;
  const byResponse = new Map();

  const markOut = () => { if (outStart == null) outStart = agent.blocks.length; };

  function messageItems(msg, pathBase, t, { carried = false } = {}) {
    const kinds = (msg.internal_chat_message_metadata_passthrough || {}).content_item_kinds || [];
    const content = Array.isArray(msg.content) ? msg.content : [];
    const role = msg.role;
    const made = [];
    const gs = { inT: false, planned: false, asked: false };
    content.forEach((c, k) => {
      const path = pathBase.concat(["content", k]);
      const kind0 = kinds[k] || "";
      if (c.type === "input_image" || c.type === "image") {
        const url = c.image_url || c.url || "";
        made.push(addBlock(agent, { t, kind: role === "assistant" ? "model" : role === "developer" ? "injected" : "you", label: "image", ref: { ...lineRef, path: path.concat(["image_url"]) }, image: imageDims(url) || {}, carried }));
        return;
      }
      const text = typeof c.text === "string" ? c.text : partText(c);
      const tpath = typeof c.text === "string" ? path.concat(["text"]) : path;
      if (role === "assistant") {
        made.push(addBlock(agent, { t, kind: "model", label: msg.phase ? `assistant (${msg.phase})` : "assistant", ref: { ...lineRef, path: tpath }, text, carried }));
        return;
      }
      if (role === "developer") {
        const kind = requestsInWindow === 0 ? "harness" : "injected";
        made.push(addBlock(agent, { t, kind, label: `developer: ${kind0 || firstLine(text)}`, ref: { ...lineRef, path: tpath }, text, carried }));
        return;
      }
      // user role
      if (th.guardian && (kind0 === "user.text" || !kind0)) {
        const h = text.trim();
        if (/^>>> TRANSCRIPT( DELTA)? START/.test(h)) gs.inT = true;
        const planned = gs.planned;
        const kind = gs.inT || planned ? "outside" : "injected";
        const label = gs.inT ? "reviewed transcript" : planned ? "planned action" : "guardian prompt";
        if (/^>>> TRANSCRIPT( DELTA)? END/.test(h)) gs.inT = false;
        if (/^Planned action JSON:/.test(h)) gs.planned = true;
        const b = addBlock(agent, { t, kind, label, ref: { ...lineRef, path: tpath }, text, carried });
        made.push(b);
        if (planned && !gs.asked && !carried) { gs.asked = true; agent.asks.push({ t, request: null, block: b.i, from: "harness" }); }
        if (h.startsWith(">>> APPROVAL REQUEST END")) gs.planned = false;
        return;
      }
      if (kind0 === "agents_md.instructions") { made.push(addBlock(agent, { t, kind: "you", label: "AGENTS.md", ref: { ...lineRef, path: tpath }, text, carried })); return; }
      // The app brackets a pasted image with <image name=… path=…> and </image> text items; they are
      // its markers, not something the user typed.
      if (/^\s*(?:<image\b[^>]*>|<\/image>)\s*$/.test(text)) { made.push(addBlock(agent, { t, kind: "injected", label: "image marker", ref: { ...lineRef, path: tpath }, text, carried })); return; }
      if (kind0 === "user.text" || (!kind0 && !text.trimStart().startsWith("<"))) {
        for (const seg of splitLeadingTags(text)) {
          const st = text.slice(seg.start, seg.end);
          const whole = seg.start === 0 && seg.end === text.length;
          const ref = { ...lineRef, path: tpath, ...(whole ? {} : { range: [seg.start, seg.end] }) };
          if (seg.tag) made.push(addBlock(agent, { t, kind: "injected", label: seg.tag, ref, text: st, carried }));
          else {
            const b = addBlock(agent, { t, kind: "you", label: "user", ref, text: st, carried });
            made.push(b);
            if (!carried) {
              agent.asks.push({ t, request: null, block: b.i, from: "human" });
              if (!th.title) th.title = st.trim().slice(0, 120);
            }
          }
        }
        return;
      }
      const label = kind0 === "environments.environment_context" ? "environment_context" : kind0 || firstLine(text);
      made.push(addBlock(agent, { t, kind: "injected", label, ref: { ...lineRef, path: tpath }, text, carried }));
    });
    return made;
  }

  function outputBlocks(payload, pathBase, t, call) {
    const name = call ? call.name : "tool";
    const kind = call && (COLLAB.has(name) || call.namespace === "collaboration") ? "agents" : "outside";
    const out = payload.output;
    const label = `${name} result`;
    if (Array.isArray(out) && out.some((o) => o && (o.type === "input_image" || o.type === "image"))) {
      const made = [];
      out.forEach((o, k) => {
        if (o.type === "input_image" || o.type === "image") made.push(addBlock(agent, { t, kind, label: `${name} image`, ref: { ...lineRef, path: pathBase.concat(["output", k, "image_url"]) }, image: imageDims(o.image_url || "") || {} }));
        else made.push(addBlock(agent, { t, kind, label, ref: { ...lineRef, path: pathBase.concat(["output", k]) }, text: partText(o.text ?? o) }));
      });
      return made;
    }
    const text = typeof out === "string" ? out : partText(out);
    return [addBlock(agent, { t, kind, label, ref: { ...lineRef, path: pathBase.concat(["output"]) }, text })];
  }

  function finishCall(call) {
    if (call.classified) return;
    const c = classifyCodexCall(call.name, call.input, call.completed);
    call.classified = true;
    Object.assign(call.action, { class: c.class, target: c.target });
    const patchFiles = typeof call.input === "string" ? [...call.input.matchAll(/\*\*\* (?:Add|Update|Delete) File: ([^\n\\"'`]+)/g)].map((m) => m[1].trim()) : [];
    if (c.justification || patchFiles.length) th.escalations.push({ justification: c.justification || null, cmds: c.cmds || [], patchFiles, request: call.request, callId: call.callId, t: call.t });
    const req = agent.requests[call.request];
    if (req && req.action && req.action.all) {
      const best = req.action.all.reduce((a, b) => (RANK[b.class] > RANK[a.class] ? b : a));
      if (best !== req.action && RANK[best.class] > RANK[req.action.class]) {
        const all = req.action.all;
        delete req.action.all;
        req.action = { ...best, all };
      }
    }
  }

  let lineRef = null;
  let rowNo = -1;
  for await (const line of readLines(source, { onProgress })) {
    rowNo++;
    let r;
    try { r = JSON.parse(line.text); } catch { if (!line.partial) th.badLines++; continue; }
    th.bytesRead = line.offset + line.length + (line.partial ? 0 : 1);
    lineRef = { file: fileIndex, offset: line.offset, length: line.length };
    const t = ts(r.timestamp);
    if (Number.isFinite(t)) { if (th.firstT == null) th.firstT = t; th.lastT = t; }
    const p = r.payload || {};
    const ord = Number.isFinite(r.ordinal) ? r.ordinal : rowNo;
    const inherited = ord < inheritedUntil;

    if (r.type === "session_meta") {
      if (!th.meta) {
        th.meta = p;
        th.guardian = p.thread_source === "guardian_review" || !!(p.source && p.source.subagent && p.source.subagent.other === "guardian");
        if (p.forked_from_id && Number.isFinite(p.subagent_history_start_ordinal)) inheritedUntil = p.subagent_history_start_ordinal;
        const bi = p.base_instructions;
        if (bi) {
          const path = typeof bi === "string" ? ["payload", "base_instructions"] : ["payload", "base_instructions", "text"];
          harnessBase = addBlock(agent, { t, kind: "harness", label: "base instructions", ref: { ...lineRef, path }, text: typeof bi === "string" ? bi : bi.text || "" });
        }
      }
      continue;
    }
    if (r.type === "turn_context") {
      model = p.model || model;
      th.perms.push({ t, approvalPolicy: p.approval_policy || null, reviewer: p.approvals_reviewer || null, sandbox: p.sandbox_policy ? p.sandbox_policy.type : null, network: p.sandbox_policy ? !!p.sandbox_policy.network_access : null, profile: p.active_permission_profile ? p.active_permission_profile.id : null });
      continue;
    }
    if (r.type === "compacted") {
      const pre = agent.requests.length ? agent.requests[agent.requests.length - 1].tokens.context : null;
      const req = byResponse.get(p.compaction_response_id);
      if (req) req.compactionRequest = true;
      windowStart = agent.blocks.length;
      requestsInWindow = 0;
      outStart = null;
      if (harnessBase) addBlock(agent, { t, kind: "harness", label: harnessBase.label, ref: harnessBase.ref, est: harnessBase.est, text: "", carried: true, site: harnessBase.site }).chars = harnessBase.chars;
      let summary = null;
      (p.replacement_history || []).forEach((it, j) => {
        const pb = ["payload", "replacement_history", j];
        if (it.type === "message") messageItems(it, pb, t, { carried: true });
        else if (it.type === "compaction" || it.type === "compaction_summary") {
          const enc = it.encrypted_content || "";
          summary = addBlock(agent, { t, kind: "summary", label: enc ? "compaction summary (encrypted)" : "compaction summary", ref: { ...lineRef, path: pb }, text: enc ? "" : partText(it.summary ?? it), est: enc ? estEncrypted(enc.length) : undefined });
        } else addBlock(agent, { t, kind: "model", label: it.type, ref: { ...lineRef, path: pb }, text: partText(it), carried: true });
      });
      if (p.message) summary = addBlock(agent, { t, kind: "summary", label: "compaction message", ref: { ...lineRef, path: ["payload", "message"] }, text: p.message });
      agent.compactions.push({ t, pre, post: null, block: summary ? summary.i : windowStart, window: p.window_number ?? null });
      continue;
    }
    if (r.type === "token_usage_record") {
      const u = p.usage || {};
      if (!u.input_tokens) continue;
      const end = (outStart == null ? agent.blocks.length : outStart) - 1;
      const req = { i: agent.requests.length, t, model, tokens: tokensCodex(u), window: [windowStart, end], strata: null, action: null, reasoning: null, responseId: p.response_id || null };
      const outs = outStart == null ? [] : agent.blocks.slice(outStart);
      const rs = outs.find((b) => b.label.startsWith("reasoning"));
      if (rs) req.reasoning = { summary: rs.chars ? rs.ref : null, encrypted: true };
      if (pendingCalls.length) {
        const all = pendingCalls.map((c) => { c.request = req.i; th.callIndex.set(c.callId, req.i); return c.action; });
        req.action = all.length > 1 ? { ...all[0], all } : all[0];
      } else {
        const txt = outs.filter((b) => b.label.startsWith("assistant"));
        if (txt.length) req.action = { kind: "text", tool: null, target: null, class: "internal", args: txt[txt.length - 1].ref, result: null };
      }
      agent.requests.push(req);
      if (req.responseId) byResponse.set(req.responseId, req);
      const lc = agent.compactions[agent.compactions.length - 1];
      if (lc && lc.post == null && lc.t <= t) lc.post = req.tokens.context;
      requestsInWindow++;
      outStart = null;
      pendingCalls = [];
      continue;
    }
    if (r.type === "event_msg") {
      if (p.type === "task_started" && p.model_context_window) th.contextWindow = p.model_context_window;
      if (p.type === "token_count" && p.info && p.info.model_context_window) th.contextWindow = p.info.model_context_window;
      if (p.type === "item_completed" && p.item) {
        const it = p.item;
        if (it.type === "SubAgentActivity" && it.kind === "started") th.spawns.push({ callId: it.id, threadId: it.agent_thread_id, path: it.agent_path, t });
        if (["CommandExecution", "FileChange", "Extension", "McpToolCall", "ImageView"].includes(it.type) && openCall) {
          openCall.completed.push(it.type === "FileChange" ? { type: it.type, changes: Object.fromEntries(Object.keys(it.changes || {}).map((k) => [k, 1])) } : { type: it.type, command: it.command, kind: it.kind, query: it.query, tool: it.tool, server: it.server });
        }
      }
      continue;
    }
    if (r.type !== "response_item") continue;

    const pb = ["payload"];
    if (p.type === "message") {
      if (p.role === "assistant") { markOut(); messageItems(p, pb, t); }
      else messageItems(p, pb, t, { carried: inherited });
      // Guardian review prompts carry the planned action as JSON.
      if (p.role === "user" && Array.isArray(p.content)) {
        const k = p.content.findIndex((c) => typeof c.text === "string" && /^Planned action JSON:/.test(c.text.trim()));
        if (k >= 0) {
          let planned = null;
          for (let j = k; j < p.content.length && !planned; j++) {
            const s = (p.content[j].text || "").replace(/^[\s\S]*?Planned action JSON:\s*/, "").trim();
            if (s.startsWith("{")) try { planned = JSON.parse(s); } catch { /* not JSON */ }
          }
          th.reviews.push({ t, planned, block: agent.blocks.length - 1, outcome: null, risk: null, result: null });
        }
      }
      if (p.role === "assistant" && th.reviews.length) {
        const rv = th.reviews[th.reviews.length - 1];
        const txt = (p.content || []).map((c) => c.text || "").join("");
        try { const j = JSON.parse(txt); rv.outcome = j.outcome || null; rv.risk = j.risk_level || null; rv.userAuthorization = j.user_authorization || null; } catch { /* free text */ }
        rv.result = agent.blocks.length - 1;
      }
      continue;
    }
    if (p.type === "reasoning") {
      markOut();
      const summ = Array.isArray(p.summary) ? p.summary.map((s) => s.text || "").join("\n") : "";
      const enc = p.encrypted_content || "";
      addBlock(agent, { t, kind: "model", label: enc ? "reasoning (encrypted)" : "reasoning", ref: { ...lineRef, path: summ ? ["payload", "summary"] : ["payload"] }, text: summ, est: estText(summ.length) + estEncrypted(enc.length), carried: inherited });
      continue;
    }
    if (p.type === "custom_tool_call" || p.type === "function_call") {
      markOut();
      const input = p.type === "custom_tool_call" ? p.input : p.arguments;
      const b = addBlock(agent, { t, kind: "model", label: `${p.namespace ? p.namespace + "." : ""}${p.name} call`, ref: { ...lineRef, path: ["payload", p.type === "custom_tool_call" ? "input" : "arguments"] }, text: typeof input === "string" ? input : partText(input), carried: inherited });
      const action = { kind: "tool", tool: p.namespace ? `${p.namespace}.${p.name}` : p.name, target: null, class: "read", args: b.ref, result: null, callId: p.call_id };
      const call = { callId: p.call_id, name: p.name, namespace: p.namespace || null, input, completed: [], action, request: null, t, classified: false };
      if (!inherited) { calls.set(p.call_id, call); pendingCalls.push(call); openCall = call; }
      continue;
    }
    if (p.type === "custom_tool_call_output" || p.type === "function_call_output") {
      const call = calls.get(p.call_id);
      const made = outputBlocks(p, pb, t, call);
      if (inherited) made.forEach((b) => (b.carried = true));
      if (call) {
        call.action.result = made[0] ? made[0].ref : null;
        finishCall(call);
        if (openCall === call) openCall = null;
      }
      continue;
    }
    if (p.type === "agent_message") {
      const content = Array.isArray(p.content) ? p.content : [];
      const header = content.filter((c) => typeof c.text === "string").map((c) => c.text).join("\n");
      const enc = content.filter((c) => c.encrypted_content).reduce((s, c) => s + c.encrypted_content.length, 0);
      const b = addBlock(agent, { t, kind: "agents", label: `message from ${p.author || "agent"}`, ref: { ...lineRef, path: ["payload", "content"] }, text: header, est: estText(header.length) + estEncrypted(enc), carried: inherited });
      th.agentMessages.push({ author: p.author, recipient: p.recipient, block: b.i, t });
      const me = th.meta && (th.meta.agent_path || (th.meta.source && th.meta.source.subagent && th.meta.source.subagent.thread_spawn && th.meta.source.subagent.thread_spawn.agent_path));
      if (!inherited && me && p.recipient === me) agent.asks.push({ t, request: null, block: b.i, from: "agent" });
      continue;
    }
  }
  for (const call of calls.values()) finishCall(call);
  return th;
}

function permissionAtFor(th) {
  return (req) => {
    let perm = null;
    for (const x of th.perms) if (x.t <= req.t) perm = x;
    let block = null;
    const [a, b] = req.window || [0, -1];
    for (let j = b; j >= a; j--) if (/permissions/.test(th.agent.blocks[j].label)) { block = j; break; }
    return { approvalPolicy: perm && perm.approvalPolicy, reviewer: perm && perm.reviewer, sandbox: perm && perm.sandbox, network: perm && perm.network, profile: perm && perm.profile, permissionsBlock: block, guardian: null };
  };
}

// Joins parsed threads into one Trace.
export function buildCodexTrace(threads, files) {
  const byId = new Map(threads.map((th) => [th.meta.id, th]));
  const root = threads.find((th) => !th.meta.parent_thread_id || !byId.has(th.meta.parent_thread_id)) || threads[0];
  const notes = [];
  for (const th of threads) {
    const m = th.meta, a = th.agent;
    const spawn = m.source && m.source.subagent && m.source.subagent.thread_spawn;
    a.id = m.id;
    a.parentId = th === root ? null : m.parent_thread_id || null;
    a.kind = th === root ? "root" : m.thread_source === "guardian_review" || (m.source && m.source.subagent && m.source.subagent.other === "guardian") ? "guardian" : "subagent";
    a.name = th === root ? th.title || "root" : a.kind === "guardian" ? "guardian" : [m.agent_nickname || (spawn && spawn.agent_nickname), m.agent_path || (spawn && spawn.agent_path)].filter(Boolean).join(" ") || m.id;
    a.path = m.agent_path || (spawn && spawn.agent_path) || (th === root ? "/root" : null);
    a.model = (a.requests.find((r) => r.model) || {}).model || null;
    a.harnessSource = "logged";
    finalizeAgent(a, permissionAtFor(th));
  }
  const depthOf = (th, seen = new Set()) => {
    if (th === root || seen.has(th)) return 0;
    seen.add(th);
    const p = byId.get(th.meta.parent_thread_id);
    return p ? depthOf(p, seen) + 1 : 1;
  };
  for (const th of threads) {
    const a = th.agent;
    a.depth = depthOf(th);
    const parent = byId.get(th.meta.parent_thread_id);
    if (!parent || th === root) continue;
    if (a.kind === "subagent") {
      const sp = parent.spawns.find((s) => s.threadId === a.id);
      if (sp) a.spawn = { t: sp.t, parentRequest: parent.callIndex.get(sp.callId) ?? null, callId: sp.callId };
      for (const msg of parent.agentMessages) if (a.path && msg.author === a.path) a.returns.push({ t: msg.t, block: msg.block, parentRequest: parent.agent.blocks[msg.block].seenBy });
    }
    if (a.kind === "guardian") {
      a.reviews = [];
      for (const rv of th.reviews) {
        const pl = rv.planned || {};
        const cmd = Array.isArray(pl.command) ? pl.command[pl.command.length - 1] : pl.command;
        let cands = pl.justification ? parent.escalations.filter((e) => e.justification === pl.justification) : [];
        let how = "justification";
        if (!cands.length && Array.isArray(pl.files) && pl.files.length) { cands = parent.escalations.filter((e) => e.patchFiles.some((f) => pl.files.includes(f))); how = "patch file"; }
        if (!cands.length && cmd) { cands = parent.escalations.filter((e) => e.cmds.some((c) => c === cmd || (c && c.endsWith("…") && cmd.startsWith(c.slice(0, -1))))); how = "command"; }
        const before = cands.filter((e) => e.t <= rv.t + 1000);
        const e = before.slice(-1)[0] || null;
        const joined = { t: rv.t, block: rv.block, result: rv.result, outcome: rv.outcome, risk: rv.risk, userAuthorization: rv.userAuthorization || null, command: cmd || (pl.files ? `apply_patch ${pl.files.join(", ")}` : null), parentRequest: e ? e.request : null, callId: e ? e.callId : null, joinedBy: e ? how : null };
        a.reviews.push(joined);
        if (e) {
          const req = parent.agent.requests[e.request];
          const act = req && req.action && (req.action.callId === e.callId ? req.action : (req.action.all || []).find((x) => x.callId === e.callId));
          const target = act || (req && req.action);
          if (target && target.custody) target.custody.permittedBy.guardian = { agentId: a.id, outcome: rv.outcome, risk: rv.risk, t: rv.t, block: rv.block };
          else if (target) target.guardian = { agentId: a.id, outcome: rv.outcome, risk: rv.risk, t: rv.t, block: rv.block };
          if (req && req.action && req.action !== target && req.action.custody && req.action.custody.permittedBy) req.action.custody.permittedBy.guardian = req.action.custody.permittedBy.guardian || { agentId: a.id, outcome: rv.outcome, risk: rv.risk, t: rv.t, block: rv.block, forCall: e.callId };
        }
      }
      const first = a.reviews.find((x) => x.parentRequest != null);
      if (first) a.spawn = { t: first.t, parentRequest: first.parentRequest, callId: first.callId };
      const unjoined = a.reviews.filter((x) => x.parentRequest == null).length;
      if (unjoined) notes.push(`guardian ${a.id}: ${unjoined} of ${a.reviews.length} reviews not joined to a parent call`);
    }
  }
  const agents = [root, ...threads.filter((t) => t !== root).sort((x, y) => (x.firstT ?? 0) - (y.firstT ?? 0))].map((t) => t.agent);
  const all = threads.flatMap((t) => [t.firstT, t.lastT]).filter(Number.isFinite);
  for (const th of threads) if (th.badLines) notes.push(`${files[th.agent.file].name}: ${th.badLines} unparsable lines skipped`);
  return {
    product: "codex",
    title: root.title || root.meta.id,
    version: root.meta.cli_version || null,
    contextWindow: root.contextWindow || null,
    started: Math.min(...all),
    ended: Math.max(...all),
    agents,
    files,
    notes,
  };
}
