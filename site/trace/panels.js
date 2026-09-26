// Shared vocabulary (strata, statuses, formatting) and the HTML side panels for every level.
// All trace strings are untrusted: they reach the DOM through textContent only, never innerHTML.

export const STRATA = [
  { key: "harness", name: "Harness", long: "The harness: system prompt, tools, base instructions", color: "#8b97a8" },
  { key: "summary", name: "Summary", long: "Compaction summaries", color: "#e8d6a6" },
  { key: "you", name: "You", long: "Your words, plus your instruction files (AGENTS.md, CLAUDE.md) and memories", color: "#c8f784" },
  { key: "injected", name: "Injected", long: "Text inserted between turns: the product's reminders, and your skills, hooks and MCP servers", color: "#ff5ccd" },
  { key: "outside", name: "Outside", long: "Outside text: files, commands, web", color: "#ff9f5a" },
  { key: "agents", name: "Agents", long: "Subagent and peer reports", color: "#7fb8ff" },
  { key: "model", name: "Model", long: "The model's own earlier output", color: "#b9a0ff" }
];
export const STRATUM_INDEX = Object.fromEntries(STRATA.map((s, i) => [s.key, i]));
export const STATUS = {
  outward: { color: "#ff6b6b", label: "Left the machine" },
  write: { color: "#ffd479", label: "Wrote locally" },
  read: { color: "#8fd0ff", label: "Read" },
  flag: { color: "#ff8c42", label: "Instruction-like text" }
};
export const MODEL_COLORS = { opus: "#7fb8ff", sonnet: "#6fd6c0", haiku: "#d7c27f", gpt: "#7fb8ff", other: "#a9b4c2" };
export const LENSES = [
  { key: "context", q: "What filled its context" },
  { key: "egress", q: "What left the machine" },
  { key: "inflow", q: "Where outside text came in" },
  { key: "agents", q: "Subagents, spend and return" }
];

export function modelFamily(model = "") {
  const m = String(model).toLowerCase();
  if (m.includes("opus")) return "opus";
  if (m.includes("sonnet")) return "sonnet";
  if (m.includes("haiku")) return "haiku";
  if (m.includes("gpt") || m.includes("codex")) return "gpt";
  return "other";
}

// ---------- formatting ----------
export function fmtTok(n) {
  if (n == null || !Number.isFinite(n)) return "–";
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(a >= 1e5 ? 0 : a >= 1e4 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(Math.round(n));
}
export const fmtInt = n => (n == null ? "–" : Math.round(n).toLocaleString("en-US"));
export function fmtDur(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return r ? `${h} h ${r} min` : `${h} h`;
  const d = Math.floor(h / 24), hr = h % 24;
  return hr ? `${d} d ${hr} h` : `${d} d`;
}
// Axis ticks: the hour alone, or the date and hour when the session spans more than a day.
export function fmtTick(t, long) {
  const hour = fmtClock(t).replace(":00", "");
  return long ? `${new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${hour}` : hour;
}
export const spansDays = trace => (trace.ended || 0) - (trace.started || 0) > 24 * 3600e3;
export function fmtClock(t) {
  const d = new Date(t);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
}
export function fmtWhen(t) {
  const d = new Date(t);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${fmtClock(t)}`;
}

// ---------- DOM helper (text only) ----------
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k === "style") n.setAttribute("style", v);
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}

// ---------- token maths shared by the scene, minimap and panels ----------
export const freshTokens = r => (r.tokens.uncached || 0) + (r.tokens.cacheWrite || 0) + (r.tokens.output || 0);
export function blockTokens(b) {
  if (b.est != null) return b.est;
  if (b.tokens != null) return b.tokens;
  if (/image|screenshot/i.test(b.label || "")) return 1600;
  return (b.chars || 0) / 4;
}
// The blocks in context at a request: its window plus any `extra` blocks outside it (for example a
// Claude Code tools snapshot logged after the first request that used it). Carried copies are kept.
export function windowBlocks(agent, req) {
  const [s, e] = req.window || [0, -1];
  const out = agent.blocks.slice(Math.max(0, s), Math.min(agent.blocks.length, e + 1));
  if (req.extra && req.extra.length) {
    const have = new Set(out.map(b => b.i));
    for (const j of req.extra) if (agent.blocks[j] && !have.has(j)) out.push(agent.blocks[j]);
    out.sort((a, b) => a.i - b.i);
  }
  return out;
}
export function agentStats(agent) {
  let fresh = 0, peak = 0, cacheRead = 0, context = 0;
  for (const r of agent.requests) {
    fresh += freshTokens(r);
    peak = Math.max(peak, r.tokens.context || 0);
    cacheRead += r.tokens.cacheRead || 0;
    context += r.tokens.context || 0;
  }
  return { fresh, peak, cacheRead, context, requests: agent.requests.length };
}
export function sessionStats(trace) {
  const root = trace.agents.find(a => a.kind === "root") || trace.agents[0];
  const subs = trace.agents.filter(a => a.kind === "subagent");
  const r = agentStats(root);
  let subFresh = 0, subReq = 0, cacheRead = r.cacheRead, context = r.context;
  for (const a of trace.agents) {
    if (a === root) continue;
    const s = agentStats(a);
    if (a.kind === "subagent") { subFresh += s.fresh; subReq += s.requests; }
    cacheRead += s.cacheRead; context += s.context;
  }
  return {
    wall: (trace.ended || 0) - (trace.started || 0), rootRequests: r.requests, subagents: subs.length, subRequests: subReq,
    rootFresh: r.fresh, subFresh, cacheShare: context ? cacheRead / context : 0,
    sides: trace.agents.filter(a => a.kind === "side" || a.kind === "guardian").length
  };
}

// Context drops with no compaction marker ("context shrank; not logged as a compaction").
// The adapter's `agent.shrinks` is authoritative when present; otherwise detect them here.
export function unloggedShrinks(agent) {
  if (Array.isArray(agent.shrinks)) return agent.shrinks.map(x => ({ request: x.request, from: x.pre, to: x.post, t: x.t }));
  const out = [];
  const comp = agent.compactions.map(c => c.t);
  for (let i = 1; i < agent.requests.length; i++) {
    const a = agent.requests[i - 1].tokens.context, b = agent.requests[i].tokens.context;
    // A return from a one-request spike to the level before it is not a shrink.
    const before = i >= 2 ? agent.requests[i - 2].tokens.context : a;
    const thr = Math.max(20000, a * 0.25);
    if (a - b > thr && before - b > thr * 0.5) {
      const t0 = agent.requests[i - 1].t, t1 = agent.requests[i].t;
      if (comp.some(t => t >= t0 - 1000 && t <= t1 + 1000)) continue;
      out.push({ request: i, from: a, to: b, t: t1 });
    }
  }
  return out;
}

// The site page for a tool, from the reference index's `tools` map: the exact name, then the text after
// the last `__`, then that text after its last `.` (mcp__codex_app__create_worktree -> create_worktree).
export function toolSite(tools, name) {
  if (!tools || !name) return null;
  const after = (s, sep) => { const i = s.lastIndexOf(sep); return i < 0 ? s : s.slice(i + sep.length); };
  const n = String(name), a = after(n, "__"), b = after(a, ".");
  for (const k of [n, a, b]) if (k && Object.hasOwn(tools, k)) return tools[k];
  return null;
}

export function siteHref(site) {
  if (!site || typeof site.slug !== "string" || !/^[a-z0-9-]+$/.test(site.slug)) return null;
  const anchor = typeof site.anchor === "string" && /^[A-Za-z0-9_-]+$/.test(site.anchor) ? `#${site.anchor}` : "";
  return `../${site.slug}/${anchor}`;
}

// Custody ladder for an action at request `req` of `agent`. model.js may provide a better one.
export function deriveCustody(trace, agent, req) {
  let ask = null;
  for (const a of agent.asks) if (a.request <= req.i) ask = a;
  let askAgent = agent;
  if (!ask && agent.parentId) {
    const parent = trace.agents.find(a => a.id === agent.parentId);
    if (parent && agent.spawn) {
      for (const a of parent.asks) if (a.request <= agent.spawn.parentRequest) { ask = a; askAgent = parent; }
    }
  }
  const permitted = [];
  const seen = new Set();
  const permRe = /permission|approval|sandbox|mode\b|guardian|allowed/i;
  for (let i = Math.min(agent.blocks.length - 1, req.window?.[1] ?? -1); i >= 0 && permitted.length < 4; i--) {
    const b = agent.blocks[i];
    if (permRe.test(b.label || "") && !seen.has(b.label)) { seen.add(b.label); permitted.push(b); }
  }
  const guardians = trace.agents.filter(a => a.kind === "guardian" && a.parentId === agent.id && a.spawn && a.spawn.parentRequest === req.i);
  const inView = windowBlocks(agent, req).filter(b => b.kind === "outside" || b.kind === "agents");
  const flagged = inView.filter(b => b.flags && b.flags.includes("instruction-like"));
  return {
    askedBy: ask ? { agent: askAgent, ask, block: askAgent.blocks[ask.block] } : null,
    permittedBy: { blocks: permitted, guardians },
    guidedBy: req.action ? { tool: req.action.tool, site: req.action.site || null } : null,
    inView: { count: inView.length, tokens: inView.reduce((s, b) => s + blockTokens(b), 0), flagged },
    did: req.action ? { tool: req.action.tool, target: req.action.target, cls: req.action.class, kind: req.action.kind } : null
  };
}

// ---------- panels ----------
function chip(color) { return el("i", { class: "chip", style: `background:${color}` }); }
function section(title, ...kids) { return el("section", { class: "psec" }, el("h3", { text: title }), ...kids); }
function kv(rows) {
  return el("dl", { class: "kv" }, rows.flatMap(([k, v, note]) => [el("dt", { text: k }), el("dd", {}, v, note ? el("span", { class: "note", text: note }) : null)]));
}
function btn(text, onclick, cls = "linkbtn") { return el("button", { class: cls, type: "button", text, onclick }); }

export function strataBar(strata, total, onPick, selected) {
  const bar = el("div", { class: "sbar", role: "list" });
  for (const s of STRATA) {
    const v = strata?.[s.key] || 0;
    if (v <= 0) continue;
    const seg = el("button", {
      class: `sseg${selected === s.key ? " on" : ""}`, type: "button", role: "listitem",
      style: `flex-grow:${Math.max(v / (total || 1), 0.004)};background:${s.color}`,
      title: `${s.name}: ≈ ${fmtTok(v)}`, "aria-label": `${s.name}, about ${fmtTok(v)} tokens`,
      onclick: onPick ? () => onPick(s.key) : null
    });
    bar.append(seg);
  }
  return bar;
}

export function strataList(strata, total, onPick, selected, harnessNote, own) {
  const ul = el("ul", { class: "slist" });
  for (const s of STRATA) {
    const v = strata?.[s.key] || 0;
    const row = el("li", { class: `${v > 0 ? "" : "zero"}${selected === s.key ? " on" : ""}` },
      el("button", { type: "button", class: "srow", disabled: v > 0 ? null : true, onclick: onPick ? () => onPick(s.key) : null },
        chip(s.color), el("span", { class: "sname", text: s.name }),
        el("span", { class: "sval", text: v > 0 ? `≈ ${fmtTok(v)}` : "0" }),
        el("span", { class: "spct", text: v > 0 ? `${Math.round(v / (total || 1) * 100)}%` : "" })));
    if (own?.[s.key] > 0 && v > 0) row.append(el("div", { class: "sown", text: `from your setup ≈ ${fmtTok(own[s.key])}` }));
    if (s.key === "harness" && harnessNote && v > 0) row.append(el("div", { class: "note", text: harnessNote }));
    ul.append(row);
  }
  return ul;
}

export function renderPanel(root, S, A) {
  root.replaceChildren();
  const { trace, level } = S;
  const agent = S.agent;
  const req = agent && S.reqIdx != null ? agent.requests[S.reqIdx] : null;
  if (level === 0) root.append(...lensPanel(S, A));
  else if (level === 1) root.append(...agentPanel(trace, agent, S, A));
  else if (level === 2) root.append(...requestPanel(trace, agent, req, S, A));
  else root.append(...stratumPanel(trace, agent, req, S, A));
}

function lensPanel(S, A) {
  const { trace, lens } = S;
  const out = [];
  const root = trace.agents.find(a => a.kind === "root") || trace.agents[0];
  if (lens === "context") {
    let peak = root.requests[0];
    for (const r of root.requests) if (r.tokens.context > peak.tokens.context) peak = r;
    out.push(el("h2", { text: "What filled its context" }),
      el("p", { class: "lede", text: `Ridge height is the exact context of each request. The coloured layers split it by source, estimated from characters (≈).` }));
    if (peak) {
      out.push(section(`Main thread at its peak: ${fmtTok(peak.tokens.context)} tokens`,
        strataBar(peak.strata, peak.tokens.context, k => A.focusStratum(root.id, peak.i, k)),
        strataList(peak.strata, peak.tokens.context, k => A.focusStratum(root.id, peak.i, k), null, harnessNote(trace, root), peak.own),
        btn(`Open request ${peak.i + 1}`, () => A.focusRequest(root.id, peak.i))));
    }
    const setup = setupSection(trace, root, A);
    if (setup) out.push(setup);
    const shr = unloggedShrinks(root);
    const marks = [
      ...root.compactions.map(c => ({ t: c.t, text: `Compacted ${fmtTok(c.pre)} → ${fmtTok(c.post)}`, req: nearestRequest(root, c.t) })),
      ...shr.map(s => ({ t: s.t, text: `Context shrank ${fmtTok(s.from)} → ${fmtTok(s.to)}; not logged as a compaction`, req: s.request }))
    ].sort((a, b) => a.t - b.t);
    if (marks.length) out.push(section("Cliffs", el("ul", { class: "items" }, marks.map(m =>
      el("li", {}, btn(`${fmtClock(m.t)}  ${m.text}`, () => A.focusRequest(root.id, m.req), "item"))))));
    out.push(el("p", { class: "hint", text: "Click a ridge to open that agent. Flags are your asks. Pins are tool calls: red left the machine, amber wrote files, blue read. Labels on the crest mark large injections mid-session." }));
  } else if (lens === "egress") {
    out.push(el("h2", { text: "What left the machine" }),
      el("p", { class: "lede", text: "Actions ranked by consequence: outward first (push, deploy, network, messages), then local writes, then reads. Open one for its custody ladder." }));
    const acts = [];
    for (const a of trace.agents) for (const r of a.requests) if (r.action && ["outward", "write", "read"].includes(r.action.class)) acts.push({ a, r });
    const rank = { outward: 0, write: 1, read: 2 };
    acts.sort((x, y) => rank[x.r.action.class] - rank[y.r.action.class] || x.r.t - y.r.t);
    for (const cls of ["outward", "write", "read"]) {
      const list = acts.filter(x => x.r.action.class === cls);
      if (!list.length) continue;
      const shown = cls === "outward" ? list : list.slice(0, 40);
      out.push(section(`${STATUS[cls].label} (${fmtInt(list.length)})`,
        el("ul", { class: "items" }, shown.map(({ a, r }) => el("li", {},
          el("button", { class: "item act", type: "button", onclick: () => A.focusRequest(a.id, r.i) },
            chip(STATUS[cls].color), el("span", { class: "tool", text: r.action.tool || "text" }),
            el("code", { text: r.action.target || "" }),
            el("span", { class: "meta", text: `${a.kind === "root" ? "main" : a.name} · ${fmtClock(r.t)}` }))))),
        list.length > shown.length ? el("p", { class: "note", text: `Showing the first ${shown.length}.` }) : null));
    }
    if (!acts.length) out.push(el("p", { text: "No classified actions in this session." }));
  } else if (lens === "inflow") {
    out.push(el("h2", { text: "Where outside text came in" }),
      el("p", { class: "lede", text: "The largest single inflows of outside text, and outside blocks that contain instruction-like text. The flag is a heuristic, not a verdict." }));
    const flagged = [], big = [];
    for (const a of trace.agents) {
      for (const b of a.blocks) {
        if (b.kind !== "outside") continue;
        if (b.flags && b.flags.includes("instruction-like")) flagged.push({ a, b });
        big.push({ a, b, tok: blockTokens(b) });
      }
    }
    big.sort((x, y) => y.tok - x.tok);
    const next = (a, b) => {
      const from = b.seenBy != null ? b.seenBy : a.requests.findIndex(r => r.window && r.window[1] >= b.i);
      if (from == null || from < 0) return null;
      for (let i = from; i < a.requests.length; i++) if (a.requests[i].action) return a.requests[i];
      return null;
    };
    const item = ({ a, b }, extra) => {
      const n = next(a, b);
      return el("li", {},
        el("button", { class: "item", type: "button", onclick: () => A.openBlockAt(a.id, b.i) },
          chip(STRATA[STRATUM_INDEX.outside].color), el("span", { class: "tool", text: b.label }),
          el("span", { class: "meta", text: `${extra} · ${a.kind === "root" ? "main" : a.name} · ${fmtClock(b.t)}` })),
        n ? btn(`next: ${n.action.tool || "reply"}${n.action.target ? " " + n.action.target : ""}`, () => A.focusRequest(a.id, n.i), "linkbtn next") : null);
    };
    out.push(section(`Instruction-like (${flagged.length}, heuristic)`, flagged.length ? el("ul", { class: "items" }, flagged.slice(0, 60).map(x => item(x, "flagged"))) : el("p", { class: "note", text: "None flagged." })));
    out.push(section("Largest inflows", el("ul", { class: "items" }, big.slice(0, 25).map(x => item(x, `≈ ${fmtTok(x.tok)}`)))));
  } else if (lens === "agents") {
    out.push(el("h2", { text: "Subagents, spend and return" }),
      el("p", { class: "lede", text: "Fresh tokens each agent spent (uncached input + cache write + output), its requests, and the size of the report that came back. Open one to focus its ridge." }));
    out.push(agentTable(trace, trace.agents.filter(a => a.kind !== "root"), S, A));
  }
  return out;
}

export function reportTokens(trace, agent) {
  const parent = trace.agents.find(a => a.id === agent.parentId);
  if (!parent) return null;
  if (Array.isArray(agent.returns)) {
    if (!agent.returns.length) return null;
    return agent.returns.reduce((s, r) => s + (parent.blocks[r.block] ? blockTokens(parent.blocks[r.block]) : 0), 0);
  }
  const want = (agent.name || "").toLowerCase();
  let sum = 0, found = false;
  for (const b of parent.blocks) {
    if (b.kind !== "agents") continue;
    if (want && (b.label || "").toLowerCase().includes(want)) { sum += blockTokens(b); found = true; }
  }
  return found ? sum : null;
}

function agentTable(trace, agents, S, A) {
  const rows = agents.map(a => ({ a, s: agentStats(a), rep: reportTokens(trace, a) })).sort((x, y) => y.s.fresh - x.s.fresh);
  const max = rows[0]?.s.fresh || 1;
  return el("table", { class: "atable" },
    el("thead", {}, el("tr", {}, el("th", { text: "Agent" }), el("th", { text: "Fresh" }), el("th", { text: "Req." }), el("th", { text: "Report" }))),
    el("tbody", {}, rows.map(({ a, s, rep }) => el("tr", { class: S.agentId === a.id ? "on" : "" },
      el("td", {}, el("button", { class: "linkbtn", type: "button", text: a.name || a.id, onclick: () => A.focusAgent(a.id) }),
        el("span", { class: "meta", text: `${a.kind === "subagent" ? modelFamily(a.model) : a.kind}${a.depth > 1 ? ` · depth ${a.depth}` : ""}` }),
        el("span", { class: "spend", style: `width:${Math.max(2, s.fresh / max * 100)}%` })),
      el("td", { text: fmtTok(s.fresh) }), el("td", { text: fmtInt(s.requests) }), el("td", { text: rep == null ? "–" : `≈ ${fmtTok(rep)}` })))));
}

function harnessNote(trace, agent) {
  const src = agent?.harnessSource;
  if (src === "inferred") return "Inferred: Claude Code does not log its system prompt; the size comes from the ccprompts data for this version.";
  if (src === "residual") return "The remainder: exact context minus every layer the log shows.";
  if (src) return null;
  return trace.product === "claude-code" ? "Inferred: Claude Code does not log its system prompt; the size comes from the ccprompts data for this version." : null;
}

export function nearestRequest(agent, t) {
  let best = 0;
  for (let i = 0; i < agent.requests.length; i++) if (agent.requests[i].t <= t) best = i;
  return Math.min(agent.requests.length - 1, best + 1);
}

function agentPanel(trace, agent, S, A) {
  const s = agentStats(agent);
  const kids = trace.agents.filter(a => a.parentId === agent.id);
  const out = [
    el("p", { class: "kicker", text: agent.kind === "root" ? "Agent · main thread" : `Agent · ${agent.kind}${agent.depth ? ` · depth ${agent.depth}` : ""}` }),
    el("h2", { text: agent.name || agent.id }),
    kv([["Model", agent.model || "–"], ["Requests", fmtInt(s.requests)], ["Peak context", fmtTok(s.peak)], ["Fresh tokens", fmtTok(s.fresh)],
      ["Bursts", fmtInt(agent.bursts?.length || 1)], ...(agent.spawn ? [["Spawned at", `${fmtWhen(agent.spawn.t)}`]] : [])]),
    el("p", { class: "hint", text: "Each column is one request; its height is the exact context. ← → move between requests, Enter opens one, Esc goes back." })
  ];
  if (agent.spawn && agent.parentId) {
    const p = trace.agents.find(a => a.id === agent.parentId);
    if (p) out.push(btn(`Spawned by ${p.kind === "root" ? "the main thread" : p.name}, request ${agent.spawn.parentRequest + 1}`, () => A.focusRequest(p.id, agent.spawn.parentRequest)));
  }
  if (agent.asks.length) {
    out.push(section(`Asks (${agent.asks.length})`, el("ul", { class: "items" }, agent.asks.map(a => {
      const b = agent.blocks[a.block];
      return el("li", {}, el("button", { class: "item", type: "button", onclick: () => A.focusRequest(agent.id, Math.min(a.request, agent.requests.length - 1)) },
        chip(STRATA[STRATUM_INDEX.you].color), el("span", { class: "tool", text: `request ${a.request + 1}` }),
        el("span", { class: "meta", text: `${fmtClock(a.t)}${b ? ` · ${b.label}` : ""}` })));
    }))));
  }
  const shr = unloggedShrinks(agent);
  if (agent.compactions.length || shr.length) {
    out.push(section("Cliffs", el("ul", { class: "items" },
      agent.compactions.map(c => el("li", {}, btn(`${fmtClock(c.t)}  compacted ${fmtTok(c.pre)} → ${fmtTok(c.post)}`, () => A.focusRequest(agent.id, nearestRequest(agent, c.t)), "item"))),
      shr.map(x => el("li", {}, btn(`${fmtClock(x.t)}  context shrank ${fmtTok(x.from)} → ${fmtTok(x.to)}; not logged as a compaction`, () => A.focusRequest(agent.id, x.request), "item"))))));
  }
  if (kids.length) out.push(section(`Subagents and side calls (${kids.length})`, agentTable(trace, kids, S, A)));
  return out;
}

function requestPanel(trace, agent, req, S, A) {
  if (!req) return [el("p", { text: "No request selected." })];
  const t = req.tokens;
  const out = [
    el("p", { class: "kicker", text: `${agent.kind === "root" ? "Main thread" : agent.name} · request ${req.i + 1} of ${agent.requests.length}` }),
    el("h2", { text: `${fmtTok(t.context)} tokens in context` }),
    el("p", { class: "meta", text: `${fmtWhen(req.t)} · ${req.model || agent.model || ""}${req.iterations > 1 ? ` · iteration ${req.iteration} of ${req.iterations} in one response` : ""}` }),
    req.strata ? section("Where the context came from (≈, split estimated; total exact)",
      strataBar(req.strata, t.context, k => A.focusStratum(agent.id, req.i, k), S.stratum),
      strataList(req.strata, t.context, k => A.focusStratum(agent.id, req.i, k), S.stratum, harnessNote(trace, agent), req.own))
      : section("Where the context came from", el("p", { class: "note", text: "The log has no blocks for this request, so its split can't be estimated. The total is exact." })),
    section("Tokens (exact, from the log)", kv([
      ["Context", fmtInt(t.context), "input + cache read + cache write"],
      ["Cache read", fmtInt(t.cacheRead)], ["Cache write", fmtInt(t.cacheWrite)], ["Uncached input", fmtInt(t.uncached)],
      ["Output", fmtInt(t.output)], ["Reasoning output", t.reasoning ? fmtInt(t.reasoning) : "–"],
      ["Fresh", fmtInt(freshTokens(req)), "uncached + cache write + output"]]))
  ];
  const act = req.action;
  if (act) {
    out.push(section("Action", el("div", { class: `action ${act.class}` },
      chip(STATUS[act.class]?.color || "#a9b4c2"),
      el("span", { class: "tool", text: act.kind === "text" ? "Text reply" : act.tool || "tool" }),
      el("span", { class: "meta", text: act.class === "outward" ? "left the machine" : act.class }),
      act.target ? el("code", { class: "target", text: act.target }) : null),
    el("div", { class: "refbtns" },
      act.args ? refToggle(agent, act.args, "the call", A) : null,
      act.result ? refToggle(agent, act.result, "the result", A) : null),
    act.all && act.all.length > 1 ? el("details", { class: "calls" }, el("summary", { text: `${act.all.length} tool calls in this response (the ladder follows the most consequential)` }),
      el("ul", { class: "items" }, act.all.map(x => el("li", { class: "call" }, chip(STATUS[x.class]?.color || "#a9b4c2"), el("span", { class: "tool", text: x.tool || "tool" }), " ", el("code", { text: x.target || "" }))))) : null));
    if (act.kind === "tool" && act.class !== "internal") out.push(custodySection(trace, agent, req, S, A));
  }
  if (req.reasoning) out.push(el("p", { class: "note", text: req.reasoning.encrypted ? "Reasoning happened; the log keeps it encrypted." : "Reasoning happened for this request." }));
  return out;
}

// The adapter precomputes custody per action (req.action.custody); map it onto the ladder's shape.
function fromAdapter(trace, agent, req, c) {
  const ask = c.askedBy && c.askedBy.block != null ? { t: c.askedBy.t, block: c.askedBy.block } : null;
  const p = c.permittedBy || {};
  const facts = [];
  const nice = { permissionMode: "permission mode", mode: "mode", allowedTools: "allowed tools", approvalPolicy: "approval policy", reviewer: "reviewer", sandbox: "sandbox", network: "network", profile: "profile" };
  for (const [k, v] of Object.entries(p)) {
    if (k === "permissionsBlock" || k === "guardian" || v == null || (Array.isArray(v) && !v.length)) continue;
    facts.push(`${nice[k] || k}: ${Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "on" : "off") : v}`);
  }
  const blocks = p.permissionsBlock != null && agent.blocks[p.permissionsBlock] ? [agent.blocks[p.permissionsBlock]] : [];
  const guardians = [];
  if (p.guardian) {
    const g = trace.agents.find(a => a.id === (p.guardian.agentId || p.guardian.id || p.guardian));
    if (g) guardians.push({ agent: g, outcome: p.guardian.outcome, risk: p.guardian.risk, block: p.guardian.block });
  }
  const flaggedBlocks = (c.inView?.flaggedBlocks || []).map(i => agent.blocks[i]).filter(Boolean);
  return {
    askedBy: ask ? { agent, ask: { ...ask, from: c.askedBy.from }, block: agent.blocks[ask.block] } : null,
    permittedBy: { blocks, guardians, facts },
    guidedBy: { tool: c.guidedBy?.tool || req.action.tool, site: c.guidedBy?.site || null },
    inView: { count: c.inView?.count || 0, tokens: c.inView?.tokens || 0, flagged: flaggedBlocks, flaggedCount: c.inView?.flagged },
    did: { tool: req.action.tool, target: c.did?.target ?? req.action.target, cls: c.did?.class || req.action.class }
  };
}

function custodySection(trace, agent, req, S, A) {
  const c = (req.action.custody && fromAdapter(trace, agent, req, req.action.custody)) || (S.custodyFn && S.custodyFn(trace, agent, req)) || deriveCustody(trace, agent, req);
  const ol = el("ol", { class: "ladder" });
  const rung = (name, ...body) => ol.append(el("li", {}, el("h4", { text: name }), ...body));
  if (c.askedBy && c.askedBy.block) {
    const q = el("blockquote", { class: "quote", text: "…" });
    A.getText(c.askedBy.agent.id, c.askedBy.block.ref).then(r => { q.textContent = clip(r?.text || "", 320) || "(empty)"; }).catch(() => { q.textContent = "(text unavailable)"; });
    const from = c.askedBy.ask.from && c.askedBy.ask.from !== "human" ? ` · from ${c.askedBy.ask.from === "agent" ? "the parent agent" : "the harness"}` : "";
    rung("Asked by", el("p", { class: "meta", text: `${c.askedBy.agent === agent ? "" : `${c.askedBy.agent.kind === "root" ? "main thread" : c.askedBy.agent.name}, `}${fmtWhen(c.askedBy.ask.t)}${from}` }), q);
  } else rung("Asked by", el("p", { class: "note", text: "No human ask before this request." }));
  const perm = c.permittedBy || { blocks: [], guardians: [] };
  rung("Permitted by", perm.blocks.length || perm.guardians.length || perm.facts?.length
    ? el("ul", { class: "items" },
      (perm.facts || []).map(f => el("li", { class: "fact", text: f })),
      perm.blocks.map(b => el("li", {}, btn(`${b.label} · ${fmtClock(b.t)}`, () => A.openBlockAt(agent.id, b.i), "item"))),
      perm.guardians.map(g => {
        const ga = g.agent || g;
        const verdict = g.outcome ? `Guardian review: ${g.outcome}${g.risk ? `, risk ${g.risk}` : ""}` : `Guardian review: ${ga.name || ga.id}`;
        return el("li", {}, btn(verdict, () => (g.block != null ? A.openBlockAt(ga.id, g.block) : A.focusAgent(ga.id)), "item"));
      }))
    : el("p", { class: "note", text: "No permission rows or reviews logged before this request." }));
  const g = c.guidedBy;
  const href = g && (siteHref(g.site) || siteHref(toolSite(S.tools, g.tool)));
  const gsite = g && (g.site || toolSite(S.tools, g.tool));
  rung("Guided by", el("p", {}, `Tool: ${g?.tool || "–"}. `, href ? el("a", { href, text: gsite.title || "Tool description" }) : el("span", { class: "note", text: "The tool's description page isn't in this site's reference index." })));
  const iv = c.inView;
  rung("In view", el("p", {}, `${fmtInt(iv.count)} outside and agent blocks, ≈ ${fmtTok(iv.tokens)} tokens${iv.flaggedCount ? `; ${fmtInt(iv.flaggedCount)} flagged instruction-like (heuristic)` : ""}.`),
    iv.flagged.length ? el("ul", { class: "items" }, iv.flagged.slice(0, 6).map(b => el("li", {},
      btn(`Instruction-like (heuristic): ${b.label}`, () => A.openBlockAt(agent.id, b.i), "item warn")))) : el("p", { class: "note", text: "None flagged as instruction-like (heuristic)." }));
  rung("Did", el("p", {}, `${c.did?.tool || "–"} `, c.did?.target ? el("code", { text: c.did.target }) : null));
  return section("Custody ladder", ol);
}

// Expands a BlockRef's literal text in place (a tool call's input or its result).
function refToggle(agent, ref, what, A) {
  const box = el("div", { class: "refbox", hidden: true });
  const b = btn(`Show ${what}`, () => {
    if (!box.hidden) { box.hidden = true; b.textContent = `Show ${what}`; return; }
    box.hidden = false; b.textContent = `Hide ${what}`;
    if (box.childElementCount) return;
    const pre = el("pre", { class: "text", text: "Reading…" });
    box.append(pre);
    A.getText(agent.id, ref).then(r => {
      const t = r?.text ?? "";
      pre.textContent = t.length > 200000 ? `${t.slice(0, 200000)}\n\n[… ${fmtInt(t.length - 200000)} more characters]` : (t || "(empty)");
    }).catch(e => { pre.textContent = `Text unavailable: ${e?.message || e}`; });
  });
  return el("div", { class: "refitem" }, b, box);
}

export function clip(s, n) {
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function stratumPanel(trace, agent, req, S, A) {
  const s = STRATA[STRATUM_INDEX[S.stratum]];
  if (!req || !s) return [el("p", { text: "No stratum selected." })];
  const blocks = windowBlocks(agent, req).filter(b => b.kind === s.key);
  const out = [
    el("p", { class: "kicker", text: `${agent.kind === "root" ? "Main thread" : agent.name} · request ${req.i + 1}` }),
    el("h2", {}, chip(s.color), ` ${s.name}: ≈ ${fmtTok(req.strata?.[s.key] || 0)}`),
    el("p", { class: "lede", text: s.long })
  ];
  if (S.block != null) {
    const b = agent.blocks[S.block];
    if (b) out.push(blockReader(agent, b, A));
  }
  if (s.key === "harness" && !blocks.length) {
    out.push(el("p", { class: "note", text: harnessNote(trace, agent) || "No harness blocks in this request's window." }));
    const hs = trace.harnessSite && siteHref(trace.harnessSite);
    if (hs) out.push(el("a", { href: hs, text: `Read it on the site: ${trace.harnessSite.title || "system prompt"}` }));
    return out;
  }
  const mine = blocks.filter(b => b.own), rest = blocks.filter(b => !b.own);
  if (mine.length) out.push(section(`From your setup: ≈ ${fmtTok(req.own?.[s.key] || 0)} in ${fmtInt(mine.length)} block${mine.length === 1 ? "" : "s"}`, blockGroups(trace, agent, mine, S, A, true)));
  if (rest.length) {
    const title = !mine.length ? "blocks in context at this request" : s.key === "you" ? "typed or pasted by you" : "from the product";
    out.push(section(`${fmtInt(rest.length)} ${title}, grouped by label`, blockGroups(trace, agent, rest, S, A, false)));
  }
  return out;
}

// Session view of the user's own setup in one agent: each file, memory, skills list or hook
// output, how often it was sent, and how often a new copy arrived while an older one was still
// in context. Also: how many subagents received the setup too.
function setupSection(trace, agent, A) {
  const groups = new Map();
  for (const b of agent.blocks) {
    if (!b.own) continue;
    const key = b.source || b.label;
    let g = groups.get(key);
    if (!g) groups.set(key, g = { label: b.label, sent: 0, carried: 0, resent: 0, same: 0, est: 0, own: 0, last: b.i });
    if (b.carried) g.carried++; else g.sent++;
    if (b.resendOf != null) { g.resent++; if (b.resendSame) g.same++; }
    g.est = Math.max(g.est, b.est); g.own = Math.max(g.own, b.ownEst ?? b.est);
    g.label = b.label; g.last = b.i;
  }
  if (!groups.size) return null;
  const list = [...groups.values()].sort((x, y) => y.own - x.own);
  const subs = trace.agents.filter(a => a !== agent && a.kind === "subagent" && a.blocks.some(b => b.own));
  const subOwn = subs.reduce((sum, a) => { const r = a.requests.find(q => q.own); return sum + (r ? Object.values(r.own).reduce((x, y) => x + y, 0) : 0); }, 0);
  const ul = el("ul", { class: "items setup" }, list.map(g => el("li", {},
    el("button", { class: "item", type: "button", onclick: () => A.openBlockAt(agent.id, g.last) },
      el("span", { class: "tool", text: g.label }),
      el("span", { class: "meta", text: [
        `≈ ${fmtTok(g.own)}${g.own < g.est ? ` of ≈ ${fmtTok(g.est)}` : ""}`,
        `sent ${g.sent}×${g.carried ? `, carried ${g.carried}×` : ""}`,
        g.resent ? `${g.resent}× while ${g.same === g.resent ? "an identical" : "an earlier"} copy was still in context` : ""
      ].filter(Boolean).join(" · ") })))));
  return section(`From your setup (${agent.kind === "root" ? "main thread" : agent.name})`, ul,
    subs.length ? el("p", { class: "note", text: `Also sent to ${fmtInt(subs.length)} subagent${subs.length === 1 ? "" : "s"}: ≈ ${fmtTok(subOwn)} in their first requests.` }) : null);
}

// One row per label (count, total ≈ tokens, first–last time, site badge), largest first. A row expands
// to its instances, most recent first; a single-instance row opens its block directly.
const expandedGroups = new Set();
function blockGroups(trace, agent, blocks, S, A, mine) {
  const long = spansDays(trace);
  const when = t => (long ? fmtWhen(t) : fmtClock(t));
  const groups = new Map();
  for (const b of blocks) {
    const key = b.label || b.kind;
    let g = groups.get(key);
    if (!g) groups.set(key, g = { label: key, items: [], tok: 0, own: 0, resent: 0, t0: Infinity, t1: -Infinity, site: null, flagged: 0 });
    g.items.push(b);
    g.tok += blockTokens(b);
    if (b.own) g.own += b.ownEst ?? blockTokens(b);
    if (b.resendOf != null) g.resent++;
    g.t0 = Math.min(g.t0, b.t); g.t1 = Math.max(g.t1, b.t);
    if (!g.site && siteHref(b.site)) g.site = b.site;
    if (b.flags?.includes("instruction-like")) g.flagged++;
  }
  const list = [...groups.values()].sort((x, y) => y.tok - x.tok);
  const ul = el("ul", { class: "groups" });
  for (const g of list) {
    const key = `${agent.id}|${S.stratum}|${g.label}`;
    const open = expandedGroups.has(key) || (S.block != null && g.items.some(b => b.i === S.block));
    const inner = el("ul", { class: "items blocks", hidden: !open });
    const fill = () => {
      if (inner.childElementCount) return;
      const items = g.items.slice().sort((x, y) => y.t - x.t || y.i - x.i);
      inner.append(...items.slice(0, 300).map(b => el("li", { class: S.block === b.i ? "on" : "" },
        el("button", { class: "item", type: "button", onclick: () => { expandedGroups.add(key); A.openBlock(b.i); } },
          el("span", { class: "tool", text: when(b.t) }),
          el("span", { class: "meta", text: `≈ ${fmtTok(blockTokens(b))}${b.carried ? " · carried" : ""}${b.resendOf != null ? (b.resendSame ? " · sent again, identical" : " · sent again, changed") : ""}${b.flags?.includes("instruction-like") ? " · instruction-like (heuristic)" : ""}` })))));
      if (items.length > 300) inner.append(el("li", { class: "note", text: `Showing the latest 300 of ${fmtInt(items.length)}.` }));
    };
    if (open) fill();
    const range = g.items.length > 1 ? `${when(g.t0)} – ${when(g.t1)}` : when(g.t0);
    const head = el("button", {
      class: "ghead", type: "button", "aria-expanded": g.items.length > 1 ? String(open) : null,
      onclick: () => {
        if (g.items.length === 1) return A.openBlock(g.items[0].i);
        const now = inner.hidden;
        inner.hidden = !now;
        head.setAttribute("aria-expanded", String(now));
        if (now) { expandedGroups.add(key); fill(); } else expandedGroups.delete(key);
      }
    },
      el("span", { class: "gcount", text: `${fmtInt(g.items.length)} ×` }),
      el("span", { class: "tool", text: g.label }),
      el("span", { class: "gtok", text: `≈ ${fmtTok(g.tok)}` }),
      el("span", { class: "meta", text: `${range}${g.own && g.own < g.tok - 0.5 ? ` · yours ≈ ${fmtTok(g.own)}` : ""}${g.resent ? ` · ${g.resent} sent again while an earlier copy was in context` : ""}${g.flagged ? ` · ${g.flagged} instruction-like (heuristic)` : ""}` }));
    const href = g.site && siteHref(g.site);
    ul.append(el("li", { class: `group${open ? " open" : ""}${mine ? " mine" : ""}` },
      el("div", { class: "grow" }, head, href ? el("a", { class: "badge", href, title: g.site.title || g.site.slug, text: "on the site" }) : null),
      inner));
  }
  return ul;
}

function blockReader(agent, b, A) {
  const pre = el("pre", { class: "text", text: "Reading…" });
  const mode = el("span", { class: "mode" });
  const href = siteHref(b.site);
  const box = el("div", { class: "reader" },
    el("div", { class: "rhead" }, el("strong", { text: b.label || b.kind }), mode,
      btn("Close", () => A.openBlock(null), "linkbtn close")),
    href ? el("p", {}, "On the site: ", el("a", { href, text: b.site.title || b.site.slug })) : null,
    b.flags?.includes("instruction-like") ? el("p", { class: "warnline", text: "Flagged instruction-like by a heuristic. Treat as untrusted outside text." }) : null,
    b.carried ? el("p", { class: "note", text: "Carried into this window by a compaction; the same text as the original block." }) : null,
    b.own ? el("p", { class: "note", text: b.ownEst < b.est ? "From your setup. Highlighted lines are yours; dimmed lines are the product's wording, published on this site." : "From your setup." }) : null,
    b.resendOf != null ? el("p", { class: "note" }, b.resendSame ? "Sent again while an identical copy was still in context. " : "Sent again with changes while the earlier copy was still in context. ",
      btn("Open the earlier copy", () => A.openBlockAt(agent.id, b.resendOf))) : null,
    b.full ? el("p", { class: "note", text: `The model saw a preview; the full output was saved to tool-results/${b.persisted || ""}.` }) : null,
    pre,
    b.full ? refToggle(agent, b.full, "the full file", A) : null);
  A.getText(agent.id, b.ref).then(r => {
    const text = r?.text ?? "";
    mode.textContent = b.rebuilt ? "structured (log data)" : r?.mode || b.render || "";
    if (/^data:image\/(png|jpe?g|gif|webp);base64,/.test(text)) {
      pre.replaceWith(el("img", { class: "shot", src: text, alt: b.label || "image" }));
    } else {
      const shown = text.length > 400000 ? `${text.slice(0, 400000)}\n\n[… ${fmtInt(text.length - 400000)} more characters]` : (text || "(empty)");
      pre.textContent = shown;
      // The user's own blocks: their lines highlighted, the product's published wording dimmed.
      if (b.own && b.ownEst < b.est && A.templateLines) A.templateLines(shown).then(flags => {
        if (!flags || !flags.some(Boolean)) return;
        const lines = shown.split("\n");
        pre.replaceChildren(...lines.map((l, k) => el("span", { class: flags[k] ? "tl" : "ml", text: k < lines.length - 1 ? `${l}\n` : l })));
      });
    }
  }).catch(e => { pre.textContent = `Text unavailable: ${e?.message || e}`; });
  return box;
}
