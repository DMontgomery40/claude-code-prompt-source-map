// Dev only: a procedurally generated Trace that follows the SPEC contract, for building the
// viewer without a real log. Every name, time, size and text here is invented; nothing is
// taken from a real session. Load it with /trace/?synthetic.

const KINDS = ["harness", "summary", "you", "injected", "outside", "agents", "model"];

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const INJECTED = [
  ["total_tokens_reminder", 420], ["silent_turn_reminder", 380], ["edited_text_file", 2400],
  ["queued_command", 900], ["deferred_tools_delta", 3800], ["command_permissions", 700],
  ["nested_memory", 5200], ["date", 120], ["system-reminder", 1600], ["hook_success", 800]
];
const TOOLS = [
  // tool, class, target maker, weight
  ["Bash", "read", r => pick(r, ["npm test", "git status --short", "ls -la src", "rg -n TODO src", "node --test"]), 26],
  ["Read", "read", r => pick(r, ["src/app.js", "README.md", "docs/plan.md", "package.json", "src/index.html"]), 22],
  ["Grep", "read", r => pick(r, ["pattern: handleLoad", "pattern: export function", "pattern: fetch\\("]), 10],
  ["Edit", "write", r => pick(r, ["src/app.js", "src/panels.js", "docs/notes.md", "test/load.test.js"]), 16],
  ["Write", "write", r => pick(r, ["docs/report.md", "src/new-module.js", "notes/todo.md"]), 5],
  ["Bash", "write", r => pick(r, ["git commit -m 'wip'", "sed -i '' 's/a/b/' src/x.js", "npm install"]), 5],
  ["Bash", "outward", r => pick(r, ["git push origin work", "curl -s https://api.example.test/v1/status", "gh pr create --fill", "npx wrangler deploy"]), 0.8],
  ["WebFetch", "outward", r => pick(r, ["https://docs.example.test/guide", "https://example.test/changelog"]), 0.4],
  ["Agent", "internal", () => "spawn subagent", 0],
  ["SendMessage", "internal", r => pick(r, ["to: reviewer", "to: builder"]), 1]
];
const WORDS_A = ["amber", "basalt", "cobalt", "delta", "ember", "fjord", "garnet", "harbor", "indigo", "juniper", "kestrel", "lumen", "moraine", "nimbus", "onyx", "prism", "quartz", "rill", "slate", "tundra"];
const WORDS_B = ["survey", "audit", "sweep", "probe", "review", "mapper", "check", "scout", "tally", "lint"];

function pick(rnd, arr) { return arr[Math.floor(rnd() * arr.length)]; }
function weighted(rnd, list) {
  const total = list.reduce((s, x) => s + x[3], 0);
  let v = rnd() * total;
  for (const x of list) { v -= x[3]; if (v <= 0) return x; }
  return list[0];
}
function logn(rnd, median, spread) {
  const u = Math.max(1e-9, rnd()), v = rnd();
  return median * Math.exp(spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
}

export function syntheticTrace(seed = 11) {
  const rnd = mulberry32(seed);
  const texts = new Map();
  let offset = 0;
  const makeRef = (chars, text) => {
    const ref = { file: 0, offset, length: Math.max(16, Math.round(chars * 1.05)) };
    offset += ref.length + 1;
    if (text) texts.set(ref.offset, text);
    return ref;
  };

  const start = Date.UTC(2026, 8, 20, 5, 12, 0);
  // Active stretches (hours) separated by idle gaps (hours); the gaps are over 20 minutes.
  const plan = [[2.7, 0.55], [3.3, 6.4], [2.9, 0.4], [1.6, 2.2], [3.1, 0.9], [2.4, 0]];
  const periods = [];
  let clock = start;
  for (const [on, off] of plan) {
    periods.push([clock, clock + on * 3600e3]);
    clock += (on + off) * 3600e3;
  }
  const activeMs = periods.reduce((s, [a, b]) => s + b - a, 0);
  const activeAt = frac => { // fraction of active time -> timestamp
    let left = frac * activeMs;
    for (const [a, b] of periods) { if (left <= b - a) return a + left; left -= b - a; }
    return periods.at(-1)[1];
  };

  const HARNESS = 24600; // inferred harness size, as the Claude Code adapter would label it
  const agents = [];
  const rootBlocks = [];
  const root = {
    id: "root", parentId: null, kind: "root", name: "main thread", model: "claude-opus-5-5", depth: 0,
    spawn: null, bursts: [], requests: [], asks: [], compactions: [], blocks: rootBlocks, harnessSource: "inferred"
  };
  agents.push(root);

  const addBlock = (agent, t, kind, label, chars, extra = {}) => {
    const text = extra.text;
    delete extra.text;
    const last = agent.blocks.at(-1);
    if (last && last.t > t) t = last.t; // keep each agent's blocks in time order
    const b = { i: agent.blocks.length, t, kind, label, chars: Math.round(chars), ref: makeRef(chars, text), site: extra.site || null };
    if (extra.flags) b.flags = extra.flags;
    agent.blocks.push(b);
    return b;
  };

  // Root requests, with jittered spacing inside active time.
  const N = 1300;
  const times = [];
  for (let k = 0; k < N; k++) times.push(activeAt(Math.min(1, (k + rnd() * 0.8) / N)));
  times.sort((a, b) => a - b);

  addBlock(root, times[0] - 4000, "you", "CLAUDE.md", 9200, { site: null });
  addBlock(root, times[0] - 3000, "injected", "deferred_tools_delta", 6100, { site: { slug: "deferred-tools", title: "Deferred tools reminder" } });

  const compactAt = new Set([452, 905]);
  const shrinkAt = 1080; // context shrinks with no compaction marker
  const spikeAt = new Set([180, 611, 1190, 1231]);
  const askEvery = 25;
  let windowStart = 0;
  // Spawn schedule: fan-outs of several agents at once, plus scattered single spawns.
  const spawnsAt = new Map([[140, 9], [260, 6], [470, 12], [520, 8], [560, 13], [690, 7], [760, 10], [1150, 5], [1210, 6]]);
  while ([...spawnsAt.values()].reduce((s, v) => s + v, 0) < 80) {
    const k = 60 + Math.floor(rnd() * (N - 160));
    if (!spawnsAt.has(k)) spawnsAt.set(k, 1);
  }
  const spawnQueue = [];

  for (let k = 0; k < N; k++) {
    const t = times[k];
    if (compactAt.has(k)) {
      const pre = root.requests.at(-1).tokens.context;
      const summaryChars = 70000 + rnd() * 30000;
      const b = addBlock(root, t - 2000, "summary", "compaction summary", summaryChars);
      windowStart = b.i;
      root.compactions.push({ t: t - 2500, pre, post: Math.round(HARNESS + summaryChars / 4), block: b.i });
    }
    if (k === shrinkAt) {
      // Drop the oldest third of the window without a marker.
      windowStart = windowStart + Math.floor((rootBlocks.length - windowStart) * 0.38);
    }
    if (k === 0 || k % askEvery === 3 || rnd() < 0.012) {
      const b = addBlock(root, t - 1500, "you", "user message", logn(rnd, 700, 0.8), {
        text: `Synthetic ask ${root.asks.length + 1}: please look at the loader and make the drop zone accept folders.`
      });
      root.asks.push({ t: b.t, request: k, block: b.i });
    }
    if (rnd() < 0.26) {
      const [label, size] = pick(rnd, INJECTED);
      addBlock(root, t - 800, "injected", label, logn(rnd, size, 0.35), {
        site: rnd() < 0.8 ? { slug: label.replace(/[^a-z0-9]+/g, "-"), title: label.replace(/_/g, " ") } : null
      });
    }
    // Reports that returned from finished subagent bursts.
    while (spawnQueue.length && spawnQueue[0].returnAt <= t) {
      const s = spawnQueue.shift();
      addBlock(root, s.returnAt, "agents", `report: ${s.name}`, s.reportChars);
    }
    // The previous response's own output and its tool result.
    if (k > 0) {
      const prev = root.requests.at(-1);
      addBlock(root, t - 600, "model", prev.action ? `${prev.action.tool} call` : "assistant text", logn(rnd, 1100, 0.7));
      if (prev.action && prev.action.kind === "tool") {
        const big = rnd() < 0.04;
        const flags = rnd() < 0.02 ? ["instruction-like"] : undefined;
        const image = rnd() < 0.02;
        addBlock(root, t - 300, "outside", image ? "image" : `${prev.action.tool} result`, image ? 6400 : logn(rnd, big ? 36000 : 3300, 0.9), { flags });
      }
    }
    const endBlock = rootBlocks.length - 1;
    const est = windowEstimate(rootBlocks, windowStart, endBlock);
    const estTotal = HARNESS + KINDS.slice(1).reduce((s, x) => s + est[x], 0);
    let context = Math.round(estTotal * (0.97 + rnd() * 0.06));
    if (spikeAt.has(k)) context = Math.round(context * 1.35 + 180000);
    const cacheRead = Math.round(context * (0.9 + rnd() * 0.09));
    const cacheWrite = Math.round((context - cacheRead) * 0.8);
    const tool = spawnsAt.has(k) ? TOOLS[8] : weighted(rnd, TOOLS);
    const action = rnd() < 0.08 ? { kind: "text", tool: null, target: null, class: "internal", args: null, result: null }
      : { kind: "tool", tool: tool[0], target: tool[2](rnd), class: tool[1], args: null, result: null };
    root.requests.push(mkRequest(k, t, root.model, context, cacheRead, cacheWrite, rnd, [windowStart, endBlock], est, HARNESS, action));

    if (spawnsAt.has(k)) {
      const n = spawnsAt.get(k);
      for (let j = 0; j < n; j++) spawnQueue.push(...spawnAgent(agents, root, k, t + j * 9000, rnd, makeRef, addBlock, periods));
      spawnQueue.sort((a, b) => a.returnAt - b.returnAt);
    }
  }
  // Wire the action args/results to the blocks that follow each request.
  linkActions(root);
  // A few advisor side calls and one guardian review, as separate request streams.
  for (let s = 0; s < 6; s++) {
    const k = 100 + Math.floor(rnd() * (N - 200));
    const parent = root.requests[k];
    const side = {
      id: `side-${s}`, parentId: "root", kind: s === 5 ? "guardian" : "side", name: s === 5 ? "guardian review" : "advisor",
      model: "claude-opus-5-5", depth: 1, spawn: { t: parent.t + 1000, parentRequest: k, callId: `call-side-${s}` },
      bursts: [{ a: parent.t + 1000, b: parent.t + 20000 }], requests: [], asks: [], compactions: [], blocks: []
    };
    const ctx = s === 5 ? 18000 : Math.round(parent.tokens.context * 0.9);
    addBlock(side, parent.t + 900, "model", "transcript forwarded", ctx * 3);
    side.requests.push(mkRequest(0, parent.t + 1000, side.model, ctx, Math.round(ctx * 0.7), Math.round(ctx * 0.2), rnd, [0, 0],
      windowEstimate(side.blocks, 0, 0), 0, { kind: "text", tool: null, target: null, class: "internal", args: null, result: null }));
    agents.push(side);
  }

  for (const a of agents) {
    if (!a.bursts.length && a.requests.length) a.bursts = [{ a: a.requests[0].t, b: a.requests.at(-1).t }];
  }
  const all = agents.flatMap(a => a.requests.map(r => r.t));
  const trace = {
    product: "claude-code", title: "Synthetic session (generated, not a real log)", version: "2.9.0-synthetic",
    contextWindow: 1000000, started: Math.min(...all), ended: Math.max(...all),
    agents, files: [{ name: "synthetic.jsonl", size: offset }]
  };
  return { trace, text: ref => syntheticText(trace, texts, ref) };
}

function windowEstimate(blocks, s, e) {
  const est = { harness: 0, summary: 0, you: 0, injected: 0, outside: 0, agents: 0, model: 0 };
  for (let i = s; i <= e && i < blocks.length; i++) {
    const b = blocks[i];
    est[b.kind] += b.label === "image" ? 1600 : b.chars / 4;
  }
  return est;
}

function mkRequest(i, t, model, context, cacheRead, cacheWrite, rnd, window, est, harness, action) {
  const strata = { ...est, harness };
  const sum = KINDS.reduce((s, k) => s + strata[k], 0) || 1;
  for (const k of KINDS) strata[k] = Math.round(strata[k] / sum * context);
  const output = Math.round(logn(rnd, 900, 0.8));
  return {
    i, t, model,
    tokens: { context, cacheRead, cacheWrite, uncached: Math.max(0, context - cacheRead - cacheWrite), output, reasoning: Math.round(output * rnd() * 0.6) },
    window, strata, action,
    reasoning: rnd() < 0.5 ? { summary: null, encrypted: false } : null
  };
}

function linkActions(agent) {
  // args = the model block written after the request; result = the next outside block.
  for (const r of agent.requests) {
    if (!r.action || r.action.kind !== "tool") continue;
    const after = agent.blocks.findIndex(b => b.i > r.window[1] && b.kind === "model");
    if (after >= 0) r.action.args = agent.blocks[after].ref;
    const res = agent.blocks.findIndex(b => b.i > r.window[1] && b.kind === "outside");
    if (res >= 0) r.action.result = agent.blocks[res].ref;
  }
}

let agentSerial = 0;
function spawnAgent(agents, parent, k, t, rnd, makeRef, addBlock, periods) {
  agentSerial += 1;
  const name = `${pick(rnd, WORDS_A)}-${pick(rnd, WORDS_B)}-${agentSerial}`;
  const model = pick(rnd, ["claude-sonnet-5", "claude-sonnet-5", "claude-opus-5-5", "claude-haiku-4-5-20251001"]);
  const agent = {
    id: `agent-${agentSerial}`, parentId: parent.id, kind: "subagent", name, model, depth: parent.depth + 1,
    spawn: { t, parentRequest: k, callId: `toolu_${agentSerial}` }, bursts: [], requests: [], asks: [], compactions: [], blocks: [], harnessSource: "inferred"
  };
  agents.push(agent);
  const inPeriod = x => periods.find(([a, b]) => x >= a && x <= b);
  const returns = [];
  let cursor = t;
  const burstCount = rnd() < 0.18 ? 2 + Math.floor(rnd() * 2) : 1;
  const ask = addBlock(agent, t, "you", "task prompt", logn(rnd, 2400, 0.5), { text: `Synthetic task for ${name}: survey the loader module and report findings.` });
  agent.asks.push({ t, request: 0, block: ask.i });
  addBlock(agent, t + 10, "injected", "agent_listing_delta", 3000, { site: { slug: "agent-listing", title: "Agent listing" } });
  for (let bIdx = 0; bIdx < burstCount; bIdx++) {
    const n = Math.max(3, Math.round(logn(rnd, 34, 0.55)));
    const a = cursor;
    let tj = cursor;
    for (let j = 0; j < n; j++) {
      if (j > 0) tj += 8000 + rnd() * 16000;
      if (j > 0) {
        addBlock(agent, tj - 400, "model", "tool call", logn(rnd, 900, 0.6));
        addBlock(agent, tj - 200, "outside", pick(rnd, ["Read result", "Bash result", "Grep result"]), logn(rnd, 4200, 1.0),
          { flags: rnd() < 0.01 ? ["instruction-like"] : undefined });
        if (rnd() < 0.12) addBlock(agent, tj - 100, "injected", pick(rnd, INJECTED)[0], logn(rnd, 700, 0.4));
      }
      const e = agent.blocks.length - 1;
      const est = windowEstimate(agent.blocks, 0, e);
      const HARNESS = 14800;
      const ctx = Math.round((HARNESS + Object.values(est).reduce((s, v) => s + v, 0)) * (0.97 + rnd() * 0.05));
      const tool = weighted(rnd, TOOLS.filter(x => x[0] !== "Agent"));
      agent.requests.push(mkRequest(agent.requests.length, tj, model, ctx, Math.round(ctx * 0.86), Math.round(ctx * 0.1), rnd, [0, e], est, HARNESS,
        { kind: "tool", tool: tool[0], target: tool[2](rnd), class: tool[1], args: null, result: null }));
    }
    const b = agent.requests.at(-1).t;
    agent.bursts.push({ a, b });
    returns.push({ name, returnAt: b + 2000, reportChars: logn(rnd, 9000, 0.6) });
    // Resume later via a message, if the later time is still inside an active stretch.
    const resume = b + (15 + rnd() * 60) * 60e3;
    if (!inPeriod(resume)) break;
    cursor = resume;
    const m = addBlock(agent, resume - 500, "agents", "message from main thread", 1400);
    agent.asks.push({ t: m.t, request: agent.requests.length, block: m.i });
  }
  linkActions(agent);
  // A few subagents spawn their own subagent (depth 2), so recursion has something to show.
  if (agent.depth === 1 && rnd() < 0.06 && agent.requests.length > 6) {
    const kk = Math.floor(agent.requests.length / 3);
    // The child's report is not added to this agent's blocks, so its window indices stay valid.
    spawnAgent(agents, agent, kk, agent.requests[kk].t + 2000, rnd, makeRef, addBlock, periods);
  }
  return returns;
}

function syntheticText(trace, texts, ref) {
  const known = texts.get(ref.offset);
  if (known) return { text: known, mode: "literal" };
  let block = null;
  for (const a of trace.agents) {
    block = a.blocks.find(b => b.ref.offset === ref.offset);
    if (block) break;
  }
  if (!block) return { text: "(synthetic) no block at this offset", mode: "structured" };
  const head = `[synthetic ${block.kind} block: ${block.label}, ${block.chars.toLocaleString()} chars]\n`;
  const line = {
    injected: "<system-reminder>\nThis is generated placeholder text standing in for a harness reminder.\n</system-reminder>\n",
    outside: "$ generated command output\nline of tool output that a real log would hold here\n",
    model: "Generated stand-in for the model's own earlier output.\n",
    agents: "<task-notification>generated stand-in for a subagent report</task-notification>\n",
    summary: "Generated stand-in for a compaction summary.\n",
    you: "Generated stand-in for your own message.\n"
  }[block.kind] || "Generated text.\n";
  let body = head;
  while (body.length < Math.min(block.chars, 6000)) body += line;
  if (block.flags?.includes("instruction-like")) body += "\n(A real block here would contain text the adapter's heuristic flagged as instruction-like.)\n";
  return { text: body, mode: block.kind === "injected" ? "structured" : "literal" };
}
