// The network layer's panels: the "What went over the wire" lens and the per-request "On the wire" card.
// Everything shown comes from the redacted capture summary (capture.js); bodies are read from the worker on
// demand (A.networkBody) and shown in a reader like the block reader. All text goes in through textContent.
import { el, fmtTok, fmtInt, fmtClock, fmtWhen, clip } from "../panels.js";
import { RULES } from "./transit.js";

export const NETWORK_LENS = { key: "network", q: "What went over the wire", icon: "⇄" };
const PRODUCT = { "claude-code": "Claude Code", codex: "Codex/ChatGPT" };
const DOCS = { "claude-code": "../claude-code/", codex: "../codex/" };

// The reference docs' search for a flag, beta, header or env name: /claude-code/?q=<name> opens the
// section's ⌘K palette with it.
export function docsHref(product, name) {
  return `${DOCS[product] || DOCS["claude-code"]}?q=${encodeURIComponent(String(name))}`;
}
const docLink = (product, name, text = name) => el("a", { class: "net-doc", href: docsHref(product, name), title: `Search the ${PRODUCT[product]} reference for ${name}`, text });

const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${fmtInt(n)} B`);
const fmtMs = (n) => (n == null ? "–" : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`);
const pct = (v) => (v == null ? "–" : `${Math.round(v * 100)}%`);
function section(title, ...kids) { return el("section", { class: "psec net-sec" }, el("h3", { text: title }), ...kids); }
function fold(title, open, key, ...kids) {
  const d = el("details", { class: "net-fold", "data-net-section": key, open: open ? true : null }, el("summary", {}, el("span", { text: title })), ...kids);
  return d;
}
function kv(rows) {
  return el("dl", { class: "kv net-kv" }, rows.filter(Boolean).flatMap(([k, v, note]) => [el("dt", { text: k }), el("dd", {}, v && typeof v === "object" ? v : String(v ?? "–"), note ? el("span", { class: "note", text: note }) : null)]));
}
const chipText = (t, cls = "") => el("span", { class: `net-chip ${cls}`.trim(), text: t });
const json = (v) => { try { return JSON.stringify(v, null, 2); } catch { return String(v); } };
function shortJson(v, n = 140) { const s = JSON.stringify(v); return s == null ? "–" : s.length > n ? `${s.slice(0, n - 1)}…` : s; }

// ---------------------------------------------------------------- the reader for wire bodies
// Kept across renders (full-screen reading re-renders the panel): { entry, part, title }.
let openBody = null;
function bodyButtons(A, entry, parts, title) {
  return el("span", { class: "net-bodies" }, parts.map(([part, label]) => el("button", { class: "linkbtn", type: "button", text: label, onclick: () => { openBody = { entry, part, title: `${title} · ${label.toLowerCase()}` }; A.openNetworkBody ? A.openNetworkBody() : rerender(A); } })));
}
function rerender(A) { if (A.rerender) A.rerender(); }
function wireReader(A) {
  if (!openBody) return null;
  const { entry, part, title } = openBody;
  const pre = el("pre", { class: "text", text: "Reading…" });
  const mode = el("span", { class: "mode" });
  const full = A.reading ? el("button", { class: "linkbtn fullread", type: "button", text: A.reading() ? "Exit full screen" : "Read full screen", onclick: () => A.toggleReading() }) : null;
  const box = el("div", { class: "reader net-reader" },
    el("div", { class: "rhead" }, el("strong", { text: title }), mode, full, el("button", { class: "linkbtn close", type: "button", text: "Close", onclick: () => { openBody = null; rerender(A); } })),
    el("p", { class: "note", text: "As it went over the wire, with credentials and identity redacted in your browser." }), pre);
  (A.networkBody ? A.networkBody(entry, part) : Promise.reject(new Error("bodies are read in the worker"))).then((r) => {
    mode.textContent = r.mode || "";
    pre.textContent = r.text ? (r.text.length > 400000 ? `${r.text.slice(0, 400000)}\n\n[… ${fmtInt(r.text.length - 400000)} more characters]` : r.text) : "(no body)";
  }).catch((e) => { pre.textContent = `Body unavailable: ${e?.message || e}`; });
  return box;
}
export function closeWireReader() { openBody = null; }

// ---------------------------------------------------------------- shared rows
function callLabel(c) {
  if (c.product === "codex") return c.kind === "side" ? `prewarm${c.generate === false ? " (generate: false)" : ""}` : c.requestKind || "response";
  return c.kind === "side" ? `side call · ${c.requestClass || "other class"}` : c.requestClass || "main";
}
function whereIn(trace, m) {
  const a = trace.agents.find((x) => x.id === m.agentId);
  if (!a) return `request ${m.reqIdx + 1}`;
  return `${a.kind === "root" ? "Main thread" : a.name || a.id} · request ${m.reqIdx + 1}`;
}
function transitLine(r) {
  const what = r.cat === "credential" ? `${r.kind}${r.details.chars ? `, ${fmtInt(r.details.chars)} chars` : ""}` : r.kind;
  const where = `${r.channel}${r.path ? ` · ${r.path}` : ""}`;
  return { what, where };
}
function ruleChips(r) {
  return r.rules.map((id) => { const x = RULES.find((y) => y.id === id); return el("span", { class: "net-rule", title: x ? `${x.title}: ${x.why}` : "", text: `${id}` }); });
}
function transitRow(r, capture) {
  const { what, where } = transitLine(r);
  const d = r.details || {};
  const jwt = d.alg || (d.claims && d.claims.length) ? [d.alg ? `alg ${d.alg}` : null, d.lifetime ? `lifetime ${d.lifetime}` : null, d.issuer ? `issuer ${d.issuer}` : null, d.audience ? `audience ${d.audience}` : null, d.scopes ? `scopes ${d.scopes.join(", ")}` : null, d.claims && d.claims.length ? `claims ${d.claims.join(", ")}` : null].filter(Boolean).join(" · ") : null;
  return el("li", { class: `net-transit ${r.rules.length ? "flagged" : ""}`, "data-net-key": `transit:${r.id}` },
    el("div", { class: "net-transit-head" },
      el("span", { class: `net-cat ${r.cat}`, text: r.cat }), el("b", { text: what }), ...ruleChips(r)),
    el("div", { class: "meta" }, `${r.host} `, chipText(r.party === "third" ? "third party" : r.party === "local" ? "this machine" : "first party", r.party), ` · ${where} · ${fmtInt(r.count)}×${r.first ? ` · first ${fmtClock(r.first)}` : ""}${r.values > 1 ? ` · ${fmtInt(r.values)} different values` : ""}${r.fp && r.fp.length ? ` · fp ${r.fp[0]}${r.fpSource === "capture" ? " (capture tool)" : ""}` : ""}${d.described === "old" || d.described === "bare" ? " · redacted before Trace saw it" : ""}`),
    jwt ? el("div", { class: "meta" }, jwt) : null,
    d.fields ? el("div", { class: "meta", text: `with ${d.fields}` }) : null,
    d.secure != null ? el("div", { class: "meta", text: `cookie attributes: ${[d.secure ? "Secure" : "no Secure", d.httpOnly ? "HttpOnly" : "no HttpOnly", d.sameSite ? `SameSite=${d.sameSite}` : null].filter(Boolean).join(", ")}` }) : null,
    r.notes.length ? el("div", { class: "note", text: r.notes.join(" · ") }) : null);
}

// ---------------------------------------------------------------- the lens
export function networkLens(S, A) {
  const cap = S.network, trace = S.trace, product = cap.product;
  const focus = S.netFocus || null;
  const out = [];
  out.push(el("h2", { text: NETWORK_LENS.q }),
    el("p", { class: "lede", text: `A network capture of this ${PRODUCT[product]} session, joined to its log: what the harness sent that the log doesn't show. Credentials and identity were redacted in your browser as the capture was read; nothing is saved.` }));
  const reader = wireReader(A);
  if (reader) out.push(reader);
  out.push(el("p", { class: "meta net-source" }, `${cap.files.join(", ")} · ${fmtInt(cap.kept)} of ${fmtInt(cap.total)} requests belong to this session`,
    cap.elsewhere ? ` · ${fmtInt(cap.elsewhere)} belonged to ${cap.otherSessions.length ? `other sessions (${cap.otherSessions.join(", ")})` : "other sessions"} and are left out` : "",
    " · ", el("button", { class: "linkbtn", type: "button", text: "Replace the capture", onclick: () => A.addCapture && A.addCapture() })));
  if (cap.notes.length) out.push(el("ul", { class: "net-notes" }, cap.notes.map((n) => el("li", { class: "note", text: n }))));

  // Model calls: in the log, and not.
  const inLog = cap.calls.filter((c) => c.matched.length), notIn = cap.calls.filter((c) => !c.matched.length);
  const callItem = (c) => {
    const m = c.matched[0];
    const u = c.product === "codex" ? c.usage || {} : (c.response && c.response.usage) || {};
    return el("li", { "data-net-key": `call:${c.index}` },
      el("button", { class: "item", type: "button", onclick: () => (m ? A.focusRequest(m.agentId, m.reqIdx) : toggleDetail(c)) },
        el("span", { class: "tool", text: `${c.t ? fmtClock(c.t) : ""} ${callLabel(c)}` }),
        el("span", { class: "meta", text: [c.model, m ? whereIn(trace, m) : "not in your log", u.input_tokens != null ? `${fmtTok(u.input_tokens)} input` : null].filter(Boolean).join(" · ") })));
  };
  const detail = el("div", { class: "net-call-detail" });
  const toggleDetail = (c) => { detail.replaceChildren(...(detail.dataset.call === String(c.index) ? [] : [callCard(cap, c, trace, A, null)])); detail.dataset.call = detail.dataset.call === String(c.index) ? "" : String(c.index); };
  out.push(section(`Model calls: ${fmtInt(inLog.length)} in your log, ${fmtInt(notIn.length)} not`,
    el("p", { class: "note", text: `Joined by ${cap.join.keys}.${product === "codex" && cap.join.items ? ` ${fmtInt(cap.join.itemsMatched)} of ${fmtInt(cap.join.items)} attributed input items match blocks in the log.` : ""}` }),
    notIn.length ? el("div", {}, el("h4", { text: "Requests not in your log" }), el("p", { class: "note", text: product === "codex" ? "The harness sent these, and the rollout never records them: a prewarm (generate: false) primes the cache before the turn." : "Model calls the harness made besides the conversation (other request classes). The session log has no row for them." }), el("ul", { class: "items" }, notIn.map(callItem)), detail) : null,
    inLog.length ? el("ul", { class: "items" }, inLog.map(callItem)) : null));

  // Sensitive data in transit.
  const tr = cap.transit;
  if (tr && tr.rows.length) {
    const flagged = tr.rows.filter((r) => r.rules.length), rest = tr.rows.filter((r) => !r.rules.length);
    const multi = tr.credentials.filter((c) => c.hosts.length > 1);
    out.push(section("Sensitive data in transit",
      el("p", { class: "note", text: "Where credentials and identity travel: kinds, hosts, channels and counts. Values are never shown; a fingerprint (fp) is a keyed hash made for this load only, so equal values can be matched." }),
      el("p", { class: "meta", text: `${fmtInt(tr.counts.credential)} credential and ${fmtInt(tr.counts.identity)} identity places · ${fmtInt(tr.counts.flagged)} flagged` }),
      tr.rules.length ? el("ol", { class: "net-rules" }, tr.rules.map((x) => el("li", { "data-rule": x.id }, el("b", { text: `${x.id}. ${x.title}` }), el("span", { class: "note", text: ` ${x.why} (${fmtInt(x.rows)})` })))) : el("p", { class: "note", text: "None of the ten rules fired." }),
      multi.length ? el("p", { class: "warnline", text: multi.map((c) => `The same ${c.kind} goes to ${c.hosts.length} hosts: ${c.hosts.join(", ")}.`).join(" ") }) : null,
      el("ul", { class: "items net-transit-list" }, flagged.map((r) => transitRow(r, cap))),
      rest.length ? fold(`${fmtInt(rest.length)} more places, none flagged`, focus && focus.section === "transit" && rest.some((r) => `transit:${r.id}` === focus.key), "transit-rest", el("ul", { class: "items net-transit-list" }, rest.map((r) => transitRow(r, cap)))) : null));
  }

  // Endpoints by role.
  const roleList = el("div", { class: "net-roles" }, cap.roles.map((r) => fold(`${r.name}: ${fmtInt(r.count)} · ${fmtBytes(r.bytes)}`, r.key === "model" || (focus && focus.section === "endpoint" && r.endpoints.some((e) => `endpoint:${e.label}` === focus.key)), `role:${r.key}`,
    el("p", { class: "note", text: r.what }),
    el("ul", { class: "items" }, r.endpoints.map((e) => el("li", { "data-net-key": `endpoint:${e.label}` },
      el("div", {}, el("b", { text: e.label }), el("span", { class: "meta", text: ` · ${fmtInt(e.count)}× · ${fmtBytes(e.bytes)}` })),
      el("p", { class: "note", text: e.reveals }),
      el("ul", { class: "net-entries" }, e.entries.slice(0, 40).map((i) => {
        const x = cap.entries.find((y) => y.i === i);
        if (!x) return null;
        return el("li", {}, el("code", { text: `${x.method} ${x.host}${clip(x.path, 60)}` }), el("span", { class: "meta", text: ` ${x.status || "–"} · ${fmtBytes(x.reqBytes)} → ${fmtBytes(x.resBytes)}${x.ws ? ` · ${fmtInt(x.ws)} frames` : ""}${x.eager ? "" : " · read on demand"} ` }),
          bodyButtons(A, x.i, [["headers", "Headers"], ...(x.reqBytes ? [["request", "Request"]] : []), ...(x.ws ? [["frames", "Frames"]] : x.resBytes ? [["response", "Response"]] : [])], `${x.method} ${x.host}${clip(x.path, 40)}`));
      }), e.entries.length > 40 ? el("li", { class: "note", text: `and ${fmtInt(e.entries.length - 40)} more` }) : null)))))));
  out.push(section("Endpoints by role", roleList));

  // Betas.
  if (cap.betas.length) out.push(section(`Betas (${fmtInt(cap.betas.length)})`,
    el("p", { class: "note", text: product === "codex" ? "Beta switches the client sends when it opens the Responses websocket." : "The anthropic-beta header: API features the harness turns on for its calls." }),
    el("ul", { class: "net-betas" }, cap.betas.map((b) => el("li", { "data-net-key": `beta:${b.name}` }, docLink(product, b.name), el("span", { class: "meta", text: ` ${b.source}${b.calls != null ? ` · ${fmtInt(b.calls)} of ${fmtInt(cap.calls.length)} calls` : ""}` }))))));

  // Rate limits over time.
  if (cap.rateLimits.length) out.push(section("Rate limits over time", rateGauges(cap)));

  // Flags.
  if (cap.flags.length) out.push(section(`${product === "codex" ? "Feature states" : "Flags & experiments"} (${fmtInt(cap.flags.length)})`, flagTable(cap, focus)));

  // Telemetry: the prompt-assembly decisions.
  const decisions = cap.events.filter((e) => e.decision);
  if (cap.events.length) {
    const counts = Object.entries(cap.telemetryCounts).sort((a, b) => b[1] - a[1]);
    out.push(section(product === "codex" ? "Analytics events" : "Telemetry: how the harness assembled the prompt",
      el("p", { class: "note", text: product === "codex" ? "Events the client reports: thread, turn, command, tool call, hook runs." : "Events the harness logs about its own prompt assembly (additional_metadata, decoded). A call link opens the model call the event is about." }),
      el("ol", { class: "net-timeline" }, (decisions.length ? decisions : cap.events).slice(0, 300).map((e, k) => el("li", { "data-net-key": `event:${e.name}` },
        el("span", { class: "meta", text: e.t ? fmtClock(e.t) : "" }), " ", el("b", { text: e.name }),
        e.call != null ? el("button", { class: "linkbtn", type: "button", text: ` call ${e.call + 1}`, onclick: () => { const m = cap.calls[e.call]?.matched[0]; if (m) A.focusRequest(m.agentId, m.reqIdx); } }) : null,
        e.meta ? el("div", { class: "meta net-meta", text: metaLine(e.meta) }) : null))),
      fold(`All ${fmtInt(counts.length)} event names`, focus && focus.section === "event", "events", el("ul", { class: "net-counts" }, counts.map(([n, c]) => el("li", { "data-net-key": `event:${n}` }, docLink(product, n), el("span", { class: "meta", text: ` ${fmtInt(c)}×` })))))));
  }

  // client_data / the model catalog.
  if (cap.bootstrap) out.push(section("client_data", el("p", { class: "note", text: "Opaque keys the server hands the CLI at start-up; the extraction's conditions cite some of them (\"client-data key …\")." }),
    el("pre", { class: "text net-json", text: json(cap.bootstrap.clientData) }),
    cap.bootstrap.modelOptions.length ? el("p", { class: "meta", text: `Extra model options: ${cap.bootstrap.modelOptions.map((m) => `${m.name || m.model}${m.disabled ? ` (${m.disabled})` : ""}`).join(", ")}` }) : null));
  if (cap.catalog.length) out.push(section(`Model catalog (${fmtInt(cap.catalog.length)}, ${fmtInt(cap.catalog.filter((m) => m.hidden).length)} hidden)`,
    el("ul", { class: "items" }, cap.catalog.map((m) => el("li", { "data-net-key": `model:${m.slug}` }, el("b", { text: m.slug }), m.hidden ? chipText("hidden", "warn") : null,
      el("span", { class: "meta", text: ` ${m.visibility || ""}${m.baseInstructions ? ` · base instructions ${fmtInt(m.baseInstructions)} chars` : ""}` }),
      Object.keys(m.switches || {}).length ? el("div", { class: "meta", text: shortJson(m.switches, 220) }) : null)))));
  if (cap.handshake) {
    const h = cap.handshake;
    out.push(section("Websocket handshake", kv([["openai-beta", h.openaiBeta], ["x-codex-beta-features", h.betaFeatures.join(", ") || "–"], ["originator", h.originator], ["version", h.version], ["routing hint", h.routingHint],
      ["x-codex-turn-metadata", h.turnMetadata ? el("code", { text: shortJson(h.turnMetadata, 400) }) : "–", "decoded; identity redacted"]]),
    cap.metrics && Object.keys(cap.metrics.names).length ? fold(`${fmtInt(Object.keys(cap.metrics.names).length)} metrics reported`, false, "metrics", el("ul", { class: "net-counts" }, Object.entries(cap.metrics.names).map(([n, c]) => el("li", {}, el("code", { text: n }), el("span", { class: "meta", text: ` ${fmtInt(c)}` }))))) : null,
    cap.metrics && cap.metrics.shadowSelectionMethods.length ? el("p", { class: "meta", text: `Skill shadow selection methods: ${cap.metrics.shadowSelectionMethods.join(", ")}` }) : null));
  }

  // Account and plan, identity redacted.
  if (cap.account.facts.length || cap.account.identityFields.length) out.push(section("Account & plan",
    kv(cap.account.facts.map((f) => [`${f.key}`, f.value, f.source])),
    cap.account.identityFields.length ? el("p", { class: "note", text: `Present, values redacted: ${cap.account.identityFields.join(", ")}.` }) : null));

  // Header names.
  out.push(section("Headers", fold(`${fmtInt(cap.headerNames.length)} header names`, focus && focus.section === "header", "headers",
    el("ul", { class: "net-counts" }, cap.headerNames.map((h) => el("li", { "data-net-key": `header:${h.name}` }, el("code", { text: h.name }), el("span", { class: "meta", text: ` ${h.side} · ${fmtInt(h.count)}×${h.redacted ? ` · value redacted${h.redacted === "capture" ? " by the capture tool" : ""}` : ""}` })))))));

  if (focus) queueMicrotask(() => revealFocus(focus));
  return out;
}

function metaLine(m) {
  if (!m || typeof m !== "object") return String(m ?? "");
  const skip = /^(subscription_type|cc_prompt_id)$/;
  return Object.entries(m).filter(([k]) => !skip.test(k)).slice(0, 10).map(([k, v]) => `${k}=${typeof v === "object" ? shortJson(v, 60) : v}`).join(" · ");
}

function revealFocus(focus) {
  if (typeof document === "undefined") return;
  const panel = document.querySelector("#panel");
  const node = panel && [...panel.querySelectorAll("[data-net-key]")].find((n) => n.dataset.netKey === focus.key);
  if (!node) return;
  for (let p = node.parentElement; p && p !== panel; p = p.parentElement) if (p.tagName === "DETAILS") p.open = true;
  node.classList.add("net-focus");
  const pr = panel.getBoundingClientRect(), r = node.getBoundingClientRect();
  panel.scrollTop += r.top - pr.top - panel.clientHeight / 3;
}

function flagTable(cap, focus) {
  const product = cap.product;
  const input = el("input", { type: "search", class: "agent-search net-flag-search", placeholder: "Find a flag, value or experiment…", "aria-label": "Find a flag", autocomplete: "off" });
  const count = el("p", { class: "note", role: "status" });
  const rows = cap.flags.map((f) => el("tr", { "data-net-key": `flag:${f.name}` },
    el("td", {}, docLink(product, f.name)),
    el("td", {}, el("code", { text: f.valueText })),
    el("td", { text: f.source || "–" }),
    el("td", { text: f.experiment ? `${f.experiment}${f.variation != null ? ` · variation ${f.variation}` : ""}${f.inExperiment === false ? " (not in it)" : ""}` : "–" })));
  const table = el("table", { class: "atable net-flags" }, el("thead", {}, el("tr", {}, el("th", { text: "Flag" }), el("th", { text: "Value" }), el("th", { text: "Source" }), el("th", { text: "Experiment" }))), el("tbody", {}, rows));
  const filter = () => {
    const q = String(input.value || "").trim().toLowerCase();
    let n = 0;
    cap.flags.forEach((f, i) => { const hit = !q || `${f.name} ${f.valueText} ${f.source} ${f.experiment || ""}`.toLowerCase().includes(q); rows[i].hidden = !hit; if (hit) n++; });
    count.textContent = q ? `${fmtInt(n)} of ${fmtInt(cap.flags.length)} flags` : `${fmtInt(cap.flags.length)} flags · ${fmtInt(cap.flags.filter((f) => f.source === "experiment").length)} from experiments`;
  };
  input.addEventListener("input", filter);
  if (focus && focus.section === "flag") input.value = focus.key.replace(/^flag:/, "");
  filter();
  return el("div", { class: "agent-browser" }, input, count, el("div", { class: "net-scroll" }, table));
}

function rateGauges(cap) {
  const byKey = new Map();
  for (const r of cap.rateLimits) (byKey.get(r.key) || byKey.set(r.key, []).get(r.key)).push(r);
  return el("ul", { class: "net-gauges" }, [...byKey].map(([key, list]) => {
    const last = list[list.length - 1];
    const W = 120, H = 24;
    const ts = list.map((x) => x.t ?? 0), t0 = Math.min(...ts), t1 = Math.max(...ts);
    const pts = list.map((x) => `${(t1 > t0 ? (x.t - t0) / (t1 - t0) : 1) * W},${H - Math.max(0, Math.min(1, x.value)) * H}`).join(" ");
    const NS = "http://www.w3.org/2000/svg";
    let svg = null;
    if (typeof document !== "undefined" && document.createElementNS) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("class", "net-spark"); svg.setAttribute("aria-hidden", "true");
      const line = document.createElementNS(NS, "polyline");
      line.setAttribute("points", list.length > 1 ? pts : `0,${H - last.value * H} ${W},${H - last.value * H}`);
      svg.append(line);
    }
    return el("li", {},
      el("div", { class: "net-gauge" }, el("span", { class: "net-gauge-name", text: key }),
        el("span", { class: "net-bar" }, el("i", { style: `width:${Math.round(Math.max(0, Math.min(1, last.value)) * 100)}%` })),
        el("b", { text: pct(last.value) }), svg),
      el("div", { class: "meta", text: `${list.length} reading${list.length === 1 ? "" : "s"}${last.status ? ` · ${last.status}` : ""}${last.reset ? ` · resets ${fmtWhen(last.reset * 1000)}` : ""}` }));
  }));
}

// ---------------------------------------------------------------- the per-request card
// The "On the wire" section for request `req` of `agent`, or null when the capture has no call for it.
export function wireCard(cap, agent, req, A) {
  const k = cap.byRequest[`${agent.id}\u0000${req.i}`];
  if (k == null) return null;
  const c = cap.calls[k];
  const primary = c.matched[0];
  const same = primary && (primary.agentId !== agent.id || primary.reqIdx !== req.i) ? primary : null;
  return callCard(cap, c, null, A, { agent, req, same });
}

function callCard(cap, c, trace, A, at) {
  const product = cap.product;
  const kids = [];
  const card = el("section", { class: "psec net-card", "data-net-call": String(c.index) }, el("h3", { text: "On the wire" }));
  const reader = at ? wireReader(A) : null;
  if (reader && openBody && openBody.entry === c.entry) kids.push(reader);
  if (at && at.same) kids.push(el("p", { class: "note", text: `The same HTTP call as ${at.agent.kind === "side" ? "the main thread's" : ""} request ${at.same.reqIdx + 1}: this row is one iteration of it.` }));
  kids.push(kv([
    [product === "codex" ? "Response id" : "Request id", el("code", { text: c.requestId || "–" }), c.joinedBy ? `joined by ${c.joinedBy}` : "not in your log"],
    product === "codex" ? ["Request kind", c.requestKind || (c.generate === false ? "prewarm" : "turn"), c.generate === false ? "generate: false" : null] : ["Request class", c.requestClass || "–", c.kind === "side" ? "a side call" : null],
    ["Model", c.model || "–"],
    c.timings ? ["Timing", `${fmtMs(c.timings.wait)} to first byte · ${fmtMs(c.timings.total)} total`] : null,
    c.timing ? ["Server timing", metaLine(Object.fromEntries(Object.entries(c.timing).filter(([, v]) => v != null && typeof v !== "object").slice(0, 8)))] : null,
  ]));
  const body = [["headers", "Headers"], ["request", "Request as sent"], ["response", "Response"]];
  if (product === "claude-code") {
    kids.push(el("div", { class: "net-actions" }, bodyButtons(A, c.entry, body, `Call ${c.index + 1}`)));
    // Betas.
    if (c.betas.length) kids.push(el("div", { class: "net-sub" }, el("h4", { text: `Betas (${c.betas.length})` }), el("p", { class: "net-betas-inline" }, ...c.betas.flatMap((b, i) => [i ? " " : null, docLink(product, b)]))));
    // System blocks as sent.
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: `System blocks as sent (${c.system.length}): not in the log` }),
      el("ol", { class: "net-blocks" }, c.system.map((s) => el("li", { class: s.billing ? "billing" : "" },
        el("div", {}, el("b", { text: `${fmtInt(s.chars)} chars` }), s.billing ? chipText("billing header", "warn") : null,
          s.cache ? chipText(`cache ${[s.cache.type, s.cache.ttl, s.cache.scope ? `scope ${s.cache.scope}` : null].filter(Boolean).join(", ")}`) : null),
        s.billing ? el("div", { class: "meta", text: `x-anthropic-billing-header: ${Object.entries(s.billing).map(([kk, v]) => `${kk}=${v}`).join("; ")}` }) : el("div", { class: "meta", text: s.preview }))))));
    // Tools as sent.
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: `Tools as sent (${c.tools.length})` }),
      el("p", { class: "net-tools" }, ...c.tools.flatMap((t, i) => [i ? " " : null, el("span", { class: `net-tool${t.defer ? " deferred" : ""}`, title: `${fmtInt(t.chars)} chars${t.defer ? " · defer_loading" : ""}${t.type ? ` · ${t.type}` : ""}${t.model ? ` · model ${t.model}` : ""}`, text: `${t.name}${t.defer ? " (deferred)" : ""}${t.type ? ` · ${t.type}` : ""}${t.model ? ` → ${t.model}` : ""}` })]))));
    // On the wire, not in the log.
    const m = c.messages;
    const notLog = [
      m.midSystem.length ? `${m.midSystem.length} mid-conversation system message${m.midSystem.length === 1 ? "" : "s"} (role "system"; ${fmtInt(m.midSystem.reduce((s, x) => s + x.chars, 0))} chars)` : null,
      m.toolAdditions.length ? `tool_addition parts: ${m.toolAdditions.flatMap((x) => x.names).join(", ")}` : null,
      c.params.thinking ? `thinking ${shortJson(c.params.thinking, 80)}` : null,
      c.params.effort ? `effort ${c.params.effort}` : null,
      c.params.context_management ? `context_management ${shortJson(c.params.context_management, 100)}` : null,
      c.params.diagnostics ? `diagnostics ${shortJson(c.params.diagnostics, 80)}` : null,
      c.params.metadataKeys.length ? `metadata keys: ${c.params.metadataKeys.join(", ")} (values redacted)` : null,
      c.params.max_tokens ? `max_tokens ${fmtInt(c.params.max_tokens)}` : null,
    ].filter(Boolean);
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: "On the wire, not in the log" }), el("ul", { class: "net-list" }, notLog.map((t) => el("li", { text: t })))));
    // Tokens: exact from the wire.
    const r = c.response || {}, u = r.usage || {};
    const logged = at && at.req ? at.req.tokens : null;
    const wireContext = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: "Tokens (exact, from the response)" }), kv([
      ["Input", fmtInt(u.input_tokens)], ["Cache read", fmtInt(u.cache_read_input_tokens)],
      ["Cache write", fmtInt(u.cache_creation_input_tokens), r.cacheSplit ? `5 min ${fmtInt(r.cacheSplit.m5)} · 1 h ${fmtInt(r.cacheSplit.h1)}` : null],
      ["Output", fmtInt(u.output_tokens), r.thinking_tokens != null ? `thinking ${fmtInt(r.thinking_tokens)}` : null],
      logged ? ["Against the log", wireContext === logged.context ? "the same context total" : `${fmtInt(wireContext)} on the wire, ${fmtInt(logged.context)} in the log`, "the log's split by source is estimated; these totals are exact"] : null,
      ["Service", [r.service_tier, r.inference_geo].filter(Boolean).join(" · ") || "–"],
      r.iterations ? ["Iterations", r.iterations.map((x) => `${x.type}${x.model ? ` (${x.model})` : ""}`).join(", ")] : null,
      ["Stop", [r.stop_reason, r.stop_details ? shortJson(r.stop_details, 80) : null].filter(Boolean).join(" · ") || (r.complete === false ? "the stream ended early" : "–")],
      r.applied_edits && (!Array.isArray(r.applied_edits) || r.applied_edits.length) ? ["Context edits applied", shortJson(r.applied_edits, 120)] : null,
    ])));
    // Rate-limit snapshot.
    if (c.rateLimit) kids.push(el("div", { class: "net-sub" }, el("h4", { text: "Rate limits at this call" }), kv([
      ...Object.entries(c.rateLimit.windows).map(([w, x]) => [w, `${pct(x.utilization)} used · ${x.status || "–"}`, x.reset ? `resets ${fmtWhen(x.reset * 1000)}` : null]),
      ["Status", c.rateLimit.status || "–", c.rateLimit.representative ? `representative claim ${c.rateLimit.representative}` : null],
      c.rateLimit.overage && c.rateLimit.overage.status ? ["Overage", c.rateLimit.overage.status, c.rateLimit.overage.reason] : null,
    ])));
  } else {
    kids.push(el("div", { class: "net-actions" }, bodyButtons(A, c.entry, [["headers", "Handshake headers"], ["frames", "Frames"]], "Responses websocket")));
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: "response.create as sent" }), kv([
      ["Input items", c.items.map((x) => `${x.type}${x.role ? ` (${x.role})` : ""}`).join(", ") || "–"],
      c.additionalTools.length ? ["additional_tools", c.additionalTools.join(", "), "tools travel as an input item, not in the log"] : null,
      c.previousResponseId ? ["Previous response", el("code", { text: c.previousResponseId })] : null,
      ["Parameters", shortJson(c.params, 240)],
      c.turnMetadata ? ["x-codex-turn-metadata", shortJson(c.turnMetadata, 300), "decoded; identity redacted"] : null,
    ])));
    const r = c.response || {}, u = c.usage || {};
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: "The response" }), kv([
      ["access_programs", shortJson(r.access_programs)], ["prompt_cache_retention", r.prompt_cache_retention || "–"], ["Service tier", r.service_tier || "–"],
      ["Input", fmtInt(u.input_tokens), u.input_tokens_details ? `cached ${fmtInt(u.input_tokens_details.cached_tokens)} · cache write ${fmtInt(u.input_tokens_details.cache_write_tokens)}` : null],
      ["Output", fmtInt(u.output_tokens), u.output_tokens_details ? `reasoning ${fmtInt(u.output_tokens_details.reasoning_tokens)}` : null],
      c.promptCache ? ["Prompt cache", shortJson(c.promptCache, 160)] : null,
      c.metadata ? ["Response metadata", shortJson(c.metadata, 200)] : null,
    ])));
    if (c.attribution.length) kids.push(attributionTable(c, at, A));
    if (c.rateLimits) kids.push(el("div", { class: "net-sub" }, el("h4", { text: "Rate limits at this call" }), el("p", { class: "meta", text: shortJson(c.rateLimits, 300) })));
  }
  // Sensitive data sent with this call.
  const rows = (cap.transit?.rows || []).filter((r) => r.calls.includes(c.index) || (c.product === "claude-code" && r.entries.includes(c.entry)));
  if (rows.length) {
    const multi = new Map(cap.transit.credentials.filter((x) => x.hosts.length > 1).map((x) => [x.kind, x]));
    kids.push(el("div", { class: "net-sub" }, el("h4", { text: "Sensitive data sent with this call" }),
      el("ul", { class: "net-list" }, rows.map((r) => {
        const { what, where } = transitLine(r);
        const also = multi.get(r.kind);
        return el("li", { class: r.rules.length ? "flagged" : "" }, `${where}: ${what}`, also ? `, same as on ${also.hosts.filter((h) => h !== r.host).join(", ")}` : "", r.prompt ? " (in the prompt text sent to the model)" : "", ...ruleChips(r));
      }))));
  }
  card.append(...kids);
  return card;
}

function attributionTable(c, at, A) {
  const agent = at && at.agent;
  const rows = c.attribution.map((a) => {
    const blocks = a.blocks.filter((b) => !agent || b.agentId === agent.id);
    const label = blocks.length && agent ? blocks.map((b) => agent.blocks[b.block]?.label || "block").join(", ") : blocks.length ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}` : "not in the log";
    const est = agent ? blocks.reduce((s, b) => s + (agent.blocks[b.block]?.est || 0), 0) : null;
    return el("tr", { class: blocks.length ? "" : "net-miss" },
      el("td", {}, el("code", { text: a.id.length > 18 ? `${a.id.slice(0, 17)}…` : a.id })),
      el("td", {}, blocks.length && agent ? el("button", { class: "linkbtn", type: "button", text: clip(label, 48), onclick: () => A.openBlockAt(agent.id, blocks[0].block) }) : label),
      el("td", { text: fmtInt(a.input) }), el("td", { text: fmtInt(a.cached) }),
      el("td", { text: est != null && blocks.length ? `≈ ${fmtTok(est)}${blocks.some((b) => b.exact === "part") ? " (split)" : ""}` : "–" }));
  });
  const box = el("div", { class: "net-sub" }, el("h4", { text: "Tokens per input item (attribution, exact)" }),
    el("p", { class: "note", text: "The server counts input and cached tokens per input item; Trace's per-block figures are estimates. Items not in the log went over the wire only." }),
    el("div", { class: "net-scroll" }, el("table", { class: "atable net-attr" }, el("thead", {}, el("tr", {}, el("th", { text: "Item" }), el("th", { text: "In the log" }), el("th", { text: "Input" }), el("th", { text: "Cached" }), el("th", { text: "Trace est." }))), el("tbody", {}, rows))));
  return box;
}
