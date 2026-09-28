// A network capture attached to a loaded session: which entries belong to it, what each endpoint is,
// what the model calls and side traffic reveal, and how they join to the session log. Runs in the worker;
// what it returns (the capture summary) is redacted and holds no body text. Bodies are read later, one at
// a time and redacted the same way (store.body).
import { parseHar, entryInfo, bodyText, jsonOr, header, parseSSE, wsFrames } from "./har.js";
import { createRedactor, REDACTED, BY_CAPTURE } from "./redact.js";
import { classify, productOf, ROLES, DECISIONS } from "./catalog.js";
import {
  claudeModelCall, growthbookFlags, growthbookAttributes, claudeBootstrap, claudeEventLog, claudeDatadog,
  codexSocket, codexModels, codexMetrics, codexAnalytics,
} from "./findings.js";

const PRODUCT_NAME = { "claude-code": "Claude Code", codex: "Codex/ChatGPT" };
const EAGER_ROLES = new Set(["model", "side", "flags", "bootstrap", "catalog", "telemetry"]);
const SMALL = 65536;            // other bodies up to this size are read eagerly too (MCP requests, small lists)
const BODY_MAX = 2_000_000;     // a lazily read body is cut here
const VALUE_MAX = 300;          // a flag value's JSON shown in the table

const lowerHeaders = (list) => { const o = {}; for (const h of list || []) { const k = String(h.name).toLowerCase(); if (!(k in o)) o[k] = h.value; } return o; };
const short = (id) => String(id || "").slice(0, 8);

// The session ids of a loaded Trace: Claude Code's root session id (subagent rows share it), every
// Codex/ChatGPT thread id of the family.
export function sessionIdsOf(trace) {
  if (!trace) return [];
  if (trace.product === "claude-code") {
    const root = trace.agents.find((a) => a.kind === "root") || trace.agents[0];
    return root && root.id ? [String(root.id).toLowerCase()] : [];
  }
  return trace.agents.filter((a) => a.kind !== "side").map((a) => String(a.id).toLowerCase());
}

// The session ids an entry names, raw (lowercased): headers, then bodies that say which session they are.
function sessionsOf(product, entry, info, reqJson) {
  const h = lowerHeaders(entry.request.headers);
  const out = new Set();
  const add = (v) => { if (typeof v === "string" && v) out.add(v.toLowerCase()); };
  if (product === "claude-code") {
    add(h["x-claude-code-session-id"]);
    const b = reqJson();
    if (b && typeof b === "object") {
      const uid = jsonOr(b.metadata && b.metadata.user_id, null);
      if (uid && typeof uid === "object") add(uid.session_id);
      if (b.attributes) add(b.attributes.sessionId);
      if (Array.isArray(b.events)) for (const e of b.events) add(e && e.event_data && e.event_data.session_id);
      if (Array.isArray(b)) for (const r of b) add(r && r.session_id);
    }
  } else {
    add(h["session-id"]); add(h["thread-id"]);
    const b = reqJson();
    if (b && Array.isArray(b.events)) for (const e of b.events) { add(e?.event_params?.thread_id); add(e?.event_params?.session_id); }
  }
  return out;
}

// files: [{ name, text }]. trace: the loaded session (normalized). Returns { capture, store }.
export async function analyzeCapture(files, trace, { now = () => Date.now() } = {}) {
  const t0 = now();
  if (!trace) throw new Error("Load a session first: a network capture is attached to a session log.");
  const raw = [];
  const names = [];
  for (const f of files) {
    const har = parseHar(f.text);
    names.push(f.name);
    for (const e of har.log.entries) raw.push(e);
  }
  if (!raw.length) throw new Error("That capture has no requests in it.");
  const infos = raw.map((e, i) => entryInfo(e, i));
  const hdr = infos.map((x) => lowerHeaders(raw[x.i].request.headers));
  const product = productOf(infos, (i) => hdr[i]);
  if (product === "browser") throw new Error("This looks like a browser capture of chatgpt.com or claude.ai (a web chat). Those have no session log, so Trace can't attach them; this layer reads captures of Claude Code and Codex/ChatGPT CLI or app sessions.");
  if (!product) throw new Error("No Claude Code or Codex/ChatGPT traffic in this capture.");
  if (product !== trace.product) throw new Error(`This capture is ${PRODUCT_NAME[product]} traffic, but the loaded session is ${PRODUCT_NAME[trace.product]}. Load the ${PRODUCT_NAME[product]} session it belongs to.`);

  // ---- which entries belong to the loaded session
  const mine = new Set(sessionIdsOf(trace));
  const parsedReq = new Map();
  const reqJson = (i) => { if (!parsedReq.has(i)) { const t = bodyText(raw[i], "request"); parsedReq.set(i, t && t.length < 5_000_000 ? jsonOr(t, null) : null); } return parsedReq.get(i); };
  const owner = infos.map((x) => {
    const ids = sessionsOf(product, raw[x.i], x, () => reqJson(x.i));
    if (!ids.size) return null;
    if ([...ids].some((id) => mine.has(id))) return "mine";
    return [...ids][0];
  });
  const others = new Set(owner.filter((o) => o && o !== "mine"));
  const markedMine = owner.filter((o) => o === "mine").length;
  if (!markedMine && others.size) {
    throw new Error(`This capture doesn't hold the loaded session. It holds ${others.size} other session${others.size === 1 ? "" : "s"} (${[...others].slice(0, 3).map((s) => `${short(s)}…`).join(", ")}). Load that session, or capture this one.`);
  }
  // Entries that name no session go with the nearest entry in time that does.
  const marked = infos.filter((x) => owner[x.i]);
  const keep = infos.map((x) => {
    if (owner[x.i]) return owner[x.i] === "mine";
    if (!others.size || x.t == null) return true;
    let best = null, gap = Infinity;
    for (const y of marked) { if (y.t == null) continue; const d = Math.abs(y.t - x.t); if (d < gap) { gap = d; best = y; } }
    return !best || owner[best.i] === "mine";
  });
  const kept = infos.filter((x) => keep[x.i]);
  const elsewhere = infos.length - kept.length;

  // ---- classify, then read the revealing bodies and collect identity values before redacting anything
  const R = createRedactor();
  R.protect([...mine, ...others]);
  for (const x of kept) Object.assign(x, classify(product, x));
  const eager = kept.filter((x) => EAGER_ROLES.has(x.role) || (x.reqBytes + x.resBytes) <= SMALL);
  const resJson = new Map();
  for (const x of kept) R.harvestHeaders(raw[x.i].request.headers), R.harvestHeaders(raw[x.i].response.headers);
  for (const x of eager) {
    const q = reqJson(x.i);
    if (q) R.harvest(q);
    const text = bodyText(raw[x.i], "response");
    const j = text && !/event-stream/.test(x.mime) ? jsonOr(text, null) : null;
    resJson.set(x.i, j);
    if (j) R.harvest(j);
    for (const f of x.ws ? wsFrames(raw[x.i]) : []) if (f.json) R.harvest(f.json);
  }

  // ---- findings
  const calls = [], flags = [], telemetry = [], rateSeries = [], catalog = [], metricNames = {}, notes = [];
  let bootstrap = null, attributes = null, handshake = null, shadow = [];
  const facts = [], identityFields = new Set();
  let droppedEvents = 0;
  const factObj = (label, obj, pick) => {
    if (!obj || typeof obj !== "object") return;
    for (const k of pick) if (obj[k] != null && typeof obj[k] !== "object") facts.push({ source: label, key: k, value: String(obj[k]) });
    for (const k of redactedKeys(obj)) identityFields.add(`${label}: ${k}`);
  };
  const keepEvents = (list) => list.filter((e) => { const ok = !e.session || mine.has(String(e.session).toLowerCase()); if (!ok) droppedEvents++; return ok; });
  for (const x of kept) {
    const e = raw[x.i];
    try {
      if (product === "claude-code") {
        if (x.role === "model" || (x.role === "side" && x.method === "POST" && /\/v1\/messages/.test(x.path))) {
          const c = claudeModelCall(e, x, R);
          if (c.kind === "side") x.role = "side";
          calls.push(c);
          const rl = c.rateLimit;
          if (rl) for (const [k, w] of Object.entries(rl.windows)) if (w.utilization != null) rateSeries.push({ t: x.t, key: k, value: w.utilization, status: w.status || null, reset: w.reset ?? null });
        } else if (x.role === "flags") {
          flags.push(...growthbookFlags(resJson.get(x.i), R));
          attributes = growthbookAttributes(reqJson(x.i), R) || attributes;
          factObj("flag attributes", attributes, ["subscriptionType", "rateLimitTier", "organizationRole", "userType", "entrypoint", "appVersion", "platform", "hasRemoteEnvironment"]);
        } else if (x.role === "bootstrap") {
          const j = resJson.get(x.i);
          if (/bootstrap/.test(x.path)) {
            bootstrap = claudeBootstrap(j, R);
            factObj("bootstrap account", bootstrap && bootstrap.account, ["organization_type", "organization_rate_limit_tier", "user_rate_limit_tier", "seat_tier"]);
          } else if (j && typeof j === "object" && !Array.isArray(j)) {
            const red = R.json(j);
            factObj(x.label === "Account switches" ? x.path.split("/").pop() : x.label, red, Object.keys(red).filter((k) => typeof red[k] !== "object").slice(0, 12));
          }
        } else if (x.role === "telemetry") {
          const q = reqJson(x.i);
          if (/event_logging/.test(x.path)) telemetry.push(...keepEvents(claudeEventLog(q, R)));
          else if (/datadoghq/.test(x.host)) telemetry.push(...keepEvents(claudeDatadog(q, R)));
        }
      } else {
        if (x.role === "model" && x.ws) {
          const s = codexSocket(e, x, R);
          handshake = handshake || s.handshake;
          for (const c of s.calls) {
            if (c.kind === "prewarm") c.kind = "side";
            calls.push(c);
            const rl = c.rateLimits && c.rateLimits.rate_limits;
            const put = (key, w) => { if (w && w.used_percent != null) rateSeries.push({ t: c.t, key, value: Number(w.used_percent) / 100, status: null, reset: w.reset_at ?? null, window: w.window_minutes ?? null }); };
            if (rl) { put(windowName("primary", rl.primary), rl.primary); put(windowName("secondary", rl.secondary), rl.secondary); }
            for (const [name, v] of Object.entries((c.rateLimits && c.rateLimits.additional_rate_limits) || {})) put(windowName(name, v && v.primary), v && v.primary);
          }
        } else if (x.role === "catalog") catalog.push(...codexModels(resJson.get(x.i), R));
        else if (x.role === "bootstrap") {
          const j = resJson.get(x.i);
          const red = j && typeof j === "object" ? R.json(j) : null;
          if (/accounts\/check/.test(x.path)) {
            const acc = red && Array.isArray(red.accounts) ? red.accounts[0] : null;
            factObj("account check", acc, ["plan_type", "structure", "account_user_role", "is_zdr", "is_openai_internal", "account_residency_region", "workspace_backend_origin", "is_fedramp_compliant_workspace"]);
            if (red) for (const k of redactedKeys(red)) identityFields.add(`account check: ${k}`);
          } else if (/wham\/usage/.test(x.path)) {
            factObj("usage", red, ["plan_type", "rate_limit_reached_type"]);
            const put = (key, w) => { if (w && w.used_percent != null) rateSeries.push({ t: x.t, key, value: Number(w.used_percent) / 100, status: null, reset: w.reset_at ?? null, window: w.limit_window_seconds ? w.limit_window_seconds / 60 : null }); };
            if (red && red.rate_limit) { put(windowName("primary", red.rate_limit.primary_window, 60), red.rate_limit.primary_window); put(windowName("secondary", red.rate_limit.secondary_window, 60), red.rate_limit.secondary_window); }
          } else factObj(x.label, red, Object.keys(red || {}).filter((k) => typeof red[k] !== "object").slice(0, 12));
        } else if (x.role === "telemetry") {
          const q = reqJson(x.i);
          if (/analytics-events/.test(x.path)) telemetry.push(...keepEvents(codexAnalytics(q, R)));
          else if (/otlp/.test(x.path)) {
            const m = codexMetrics(q, R);
            for (const [k, v] of Object.entries(m.names)) metricNames[k] = (metricNames[k] || 0) + v;
            flags.push(...m.features);
            shadow = [...new Set([...shadow, ...m.shadowSelectionMethods])];
          }
        }
      }
    } catch (err) {
      notes.push(`${x.method} ${R.path(x.path)}: couldn't be read (${err && err.message ? err.message : err})`);
    }
  }

  // ---- join to the session log
  const join = product === "claude-code" ? joinClaude(calls, trace) : joinCodex(calls, trace);
  const byRequest = {};
  calls.forEach((c, k) => { c.index = k; for (const m of c.matched) byRequest[`${m.agentId}\u0000${m.reqIdx}`] = k; });

  // ---- telemetry: decisions keep their decoded metadata; api success rows point at their call
  const decisions = new Set(DECISIONS[product] || []);
  const byReqId = new Map(calls.map((c) => [c.requestId, c.index]));
  telemetry.sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
  const events = telemetry.map((e) => {
    const decision = decisions.has(e.name);
    const rid = e.meta && (e.meta.requestId || e.meta.request_id);
    const out = { t: e.t, name: e.name, sink: e.sink, decision };
    if (decision || e.sink === "analytics") out.meta = clampJson(e.meta);
    if (rid && byReqId.has(rid)) out.call = byReqId.get(rid);
    return out;
  });

  // ---- betas, flags, endpoints, header names
  const betas = new Map();
  for (const c of calls) for (const b of c.betas || []) betas.set(b, (betas.get(b) || 0) + 1);
  const betaList = [...betas].map(([name, n]) => ({ name: R.str(name), calls: n, source: "anthropic-beta" }));
  if (handshake) {
    for (const b of handshake.betaFeatures) betaList.push({ name: R.str(b), calls: null, source: "x-codex-beta-features" });
    if (handshake.openaiBeta) for (const b of String(handshake.openaiBeta).split(",")) betaList.push({ name: R.str(b.trim()), calls: null, source: "openai-beta" });
  }
  const flagList = flags.map((f) => {
    const v = JSON.stringify(f.value ?? null);
    return { ...f, value: undefined, valueText: v.length > VALUE_MAX ? `${v.slice(0, VALUE_MAX - 1)}…` : v, valueType: f.value === null ? "null" : Array.isArray(f.value) ? "array" : typeof f.value };
  }).sort((a, b) => a.name.localeCompare(b.name));
  const headerNames = new Map();
  for (const x of kept) {
    const e = raw[x.i];
    for (const [side, list] of [["request", e.request.headers], ["response", e.response.headers]]) for (const h of R.headers(list)) {
      const k = `${side}\u0000${h.name.toLowerCase()}`;
      const cur = headerNames.get(k) || { name: h.name.toLowerCase(), side, count: 0, redacted: null };
      cur.count++; if (h.redacted) cur.redacted = h.redacted;
      headerNames.set(k, cur);
    }
  }
  const entries = kept.map((x) => ({
    i: x.i, t: x.t, method: x.method, host: x.host, path: R.path(x.path), query: x.query, status: x.status, role: x.role, label: x.label,
    reqBytes: x.reqBytes, resBytes: x.resBytes, ws: x.ws, timings: x.timings, mime: x.mime, eager: eager.includes(x),
  }));
  const roles = ROLES.map((r) => {
    const list = entries.filter((x) => x.role === r.key);
    const labels = new Map();
    for (const x of list) {
      const g = labels.get(x.label) || { label: x.label, reveals: kept.find((y) => y.i === x.i).reveals, count: 0, bytes: 0, entries: [] };
      g.count++; g.bytes += x.reqBytes + x.resBytes; g.entries.push(x.i);
      labels.set(x.label, g);
    }
    return { key: r.key, name: r.name, what: r.what, count: list.length, bytes: list.reduce((s, x) => s + x.reqBytes + x.resBytes, 0), endpoints: [...labels.values()].sort((a, b) => b.count - a.count) };
  }).filter((r) => r.count);
  const telemetryCounts = {};
  for (const e of telemetry) telemetryCounts[e.name] = (telemetryCounts[e.name] || 0) + 1;

  if (elsewhere) notes.push(`${elsewhere} of ${infos.length} entries belonged to ${others.size ? `${others.size} other session${others.size === 1 ? "" : "s"}` : "other sessions"} and were left out.`);
  if (droppedEvents) notes.push(`${droppedEvents} telemetry events named another session and were left out.`);
  const partial = calls.filter((c) => c.response && c.product === "claude-code" && !c.response.complete).length;
  if (partial) notes.push(`${partial} model call${partial === 1 ? "" : "s"} ended before the stream finished; what arrived is shown.`);

  const capture = {
    product, files: names, total: infos.length, kept: kept.length, elsewhere, otherSessions: [...others].map((s) => `${short(s)}…`), notes,
    entries, roles, calls, byRequest, join, betas: betaList, flags: flagList, attributes, bootstrap, handshake, catalog,
    metrics: { names: metricNames, shadowSelectionMethods: shadow }, events, telemetryCounts, rateLimits: rateSeries.sort((a, b) => (a.t ?? 0) - (b.t ?? 0)),
    account: { facts, identityFields: [...identityFields] }, headerNames: [...headerNames.values()].sort((a, b) => a.name.localeCompare(b.name)),
    ms: now() - t0,
  };
  const store = {
    // The literal body of entry i, redacted: part "request" | "response" | "frames". { text, mode, cut }.
    body(i, part) {
      const e = raw[i];
      if (!e || !keep[i]) throw new Error("no such entry in the attached capture");
      if (part === "frames") {
        const lines = wsFrames(e).map((f) => `${f.dir === "send" ? "→ sent" : "← received"} ${f.t != null ? new Date(f.t).toISOString().slice(11, 23) : ""}\n${f.json ? JSON.stringify(R.json(harvested(R, f.json)), null, 2) : R.str(String(f.bytes)) + " bytes (not JSON)"}`);
        return cut(lines.join("\n\n"), "websocket frames, redacted");
      }
      const text = bodyText(e, part);
      if (text == null || text === "") return { text: "", mode: "no body", cut: false };
      const mime = part === "response" ? infos[i].mime : String(header(e.request.headers, "content-type") || "");
      if (/event-stream/.test(mime) || /^\s*(event|data):/m.test(text.slice(0, 200))) {
        const ev = parseSSE(text).map((s) => `event: ${s.event}\ndata: ${s.json ? JSON.stringify(R.json(harvested(R, s.json)), null, 2) : R.str(s.data)}`);
        return cut(ev.join("\n\n"), "server-sent events, redacted");
      }
      const j = jsonOr(text, undefined);
      if (j !== undefined) return cut(JSON.stringify(R.json(harvested(R, j)), null, 2), "JSON, redacted");
      return cut(R.str(text), "text, redacted");
    },
    headers(i) {
      const e = raw[i];
      if (!e || !keep[i]) throw new Error("no such entry in the attached capture");
      return { request: R.headers(e.request.headers), response: R.headers(e.response.headers) };
    },
  };
  return { capture, store };
}

function harvested(R, j) { R.harvest(j); return j; }
function cut(text, mode) {
  if (text.length <= BODY_MAX) return { text, mode, cut: false };
  return { text: `${text.slice(0, BODY_MAX)}\n\n[… cut at ${BODY_MAX.toLocaleString("en-US")} characters]`, mode, cut: true };
}
function windowName(name, w, unit = 1) {
  const min = w && (w.window_minutes ?? (w.limit_window_seconds != null ? w.limit_window_seconds / 60 : null));
  if (!min) return name;
  const d = min / 1440;
  return `${name} (${d >= 1 && Number.isInteger(d) ? `${d} d` : min >= 60 ? `${Math.round(min / 60)} h` : `${min} min`})`;
}
// The key paths in a redacted value whose values were removed.
export function redactedKeys(v, path = "", out = []) {
  if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      const p = Array.isArray(v) ? path : path ? `${path}.${k}` : k;
      if (x === REDACTED || x === BY_CAPTURE || (Array.isArray(x) && x.length && x.every((y) => y === REDACTED))) { if (!out.includes(p)) out.push(p); }
      else redactedKeys(x, p, out);
    }
  }
  return out;
}
function clampJson(v, max = 4000) {
  if (v == null) return v;
  const s = JSON.stringify(v);
  return s.length <= max ? v : { truncated: `${s.slice(0, max)}…` };
}

// Claude Code: transcript requestId == response header request-id; message.id == message_start id.
function joinClaude(calls, trace) {
  const byReq = new Map(), byMsg = new Map();
  for (const a of trace.agents) a.requests.forEach((r, i) => {
    const hit = { agentId: a.id, reqIdx: i, side: a.kind === "side" };
    if (r.requestId) (byReq.get(r.requestId) || byReq.set(r.requestId, []).get(r.requestId)).push(hit);
    if (r.messageId) (byMsg.get(r.messageId) || byMsg.set(r.messageId, []).get(r.messageId)).push(hit);
  });
  let matched = 0;
  for (const c of calls) {
    const hits = (c.requestId && byReq.get(c.requestId)) || (c.response && c.response.id && byMsg.get(c.response.id)) || [];
    c.matched = hits.slice().sort((x, y) => Number(x.side) - Number(y.side));
    c.joinedBy = c.requestId && byReq.has(c.requestId) ? "request-id" : c.matched.length ? "message id" : null;
    if (c.matched.length) matched++;
  }
  return { matched, unmatched: calls.length - matched, keys: "request-id ↔ requestId, message_start id ↔ message.id" };
}

// Codex/ChatGPT: rollout token_usage_record.response_id == response.created id; attribution item ids ==
// rollout item ids (response_item blocks carry itemId and part).
function joinCodex(calls, trace) {
  const byResp = new Map(), byItem = new Map();
  for (const a of trace.agents) {
    a.requests.forEach((r, i) => { if (r.responseId) (byResp.get(r.responseId) || byResp.set(r.responseId, []).get(r.responseId)).push({ agentId: a.id, reqIdx: i, side: false }); });
    a.blocks.forEach((b, bi) => { if (b.itemId) (byItem.get(b.itemId) || byItem.set(b.itemId, []).get(b.itemId)).push({ agentId: a.id, block: bi, part: b.part ?? null }); });
  }
  let matched = 0, items = 0, itemsMatched = 0;
  for (const c of calls) {
    c.matched = (c.requestId && byResp.get(c.requestId)) || [];
    c.joinedBy = c.matched.length ? "response id" : null;
    if (c.matched.length) matched++;
    const agentId = c.matched[0] ? c.matched[0].agentId : null;
    for (const a of c.attribution || []) {
      items++;
      const all = byItem.get(a.id) || [];
      a.blocks = agentId ? all.filter((b) => b.agentId === agentId) : all;
      if (!a.blocks.length) a.blocks = all;
      if (a.blocks.length) itemsMatched++;
      // Exact per block only when the block is one whole content part; a part split into several
      // blocks gets its count once, at part level.
      const perPart = new Map();
      for (const b of a.blocks) perPart.set(b.part, (perPart.get(b.part) || 0) + 1);
      for (const b of a.blocks) {
        const p = a.parts && b.part != null ? a.parts[b.part] : null;
        b.exact = p ? (perPart.get(b.part) === 1 ? "block" : "part") : a.blocks.length === 1 ? "block" : "item";
        if (p) Object.assign(b, { input: p.input, cached: p.cached, write: p.write });
      }
    }
  }
  return { matched, unmatched: calls.length - matched, items, itemsMatched, keys: "response.created id ↔ token_usage_record.response_id; attribution item ids ↔ rollout item ids" };
}
