import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadTrace, findSessions } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { readRef, readRefLine, KINDS } from "../model.js";
import { ASK, CC_ASK, CODEX, CC } from "./fixtures/make.mjs";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));
const load = async (sub, opts) => loadTrace(await entriesFor([FIX + sub]), opts);

// Every line of a file, keyed by byte offset, computed independently of readLines.
function linesByOffset(path) {
  const buf = readFileSync(path);
  const out = new Map();
  let start = 0;
  for (let k = buf.indexOf(10); k !== -1; k = buf.indexOf(10, start)) { out.set(start, buf.subarray(start, k)); start = k + 1; }
  if (start < buf.length) out.set(start, buf.subarray(start));
  return out;
}

async function assertRoundTrip(trace, sources) {
  const byFile = trace.files.map((f) => (f.role ? null : linesByOffset(f.name)));
  let n = 0;
  for (const a of trace.agents) for (const b of a.blocks) {
    const expect = byFile[b.ref.file].get(b.ref.offset);
    assert.ok(expect, `${a.id} block ${b.i} (${b.label}) starts at a line boundary`);
    const got = await sources[b.ref.file].slice(b.ref.offset, b.ref.offset + b.ref.length);
    assert.deepEqual(Buffer.from(got), Buffer.from(expect), `${a.id} block ${b.i} (${b.label}) re-reads to exactly its line`);
    assert.equal(await readRefLine(sources[b.ref.file], b.ref), expect.toString("utf8"));
    await readRef(sources[b.ref.file], b.ref);
    n++;
  }
  assert.ok(n > 10);
}

function assertStrata(trace) {
  for (const a of trace.agents) for (const r of a.requests) if (r.strata) assert.equal(KINDS.reduce((s, k) => s + r.strata[k], 0), r.tokens.context, `${a.id} request ${r.i}`);
}

test("codex: requests, tokens, blocks, compaction, shrink", async () => {
  const { trace, sources } = await load("codex");
  assert.equal(trace.product, "codex");
  const root = trace.agents[0];
  assert.equal(root.id, CODEX.root);
  assert.deepEqual(root.requests.map((r) => r.tokens.context), [5000, 9000, 12000, 12500, 9000, 2000]);
  assert.deepEqual(root.requests[0].tokens, { context: 5000, cacheRead: 1000, cacheWrite: 0, uncached: 4000, output: 100, reasoning: 10, fresh: 4100 });
  assert.equal(trace.contextWindow, 100000);
  const label = (l) => root.blocks.find((b) => b.label === l);
  assert.equal(label("base instructions").kind, "harness");
  assert.equal(label("developer: permissions.instructions").kind, "harness");
  assert.equal(label("AGENTS.md").kind, "you");
  assert.equal(label("environment_context").kind, "injected");
  assert.equal(label("in-app-browser-context").kind, "injected");
  // Asks: the human's words only; the copy carried in replacement_history is not a new ask.
  assert.deepEqual(await Promise.all(root.asks.map((a) => readRef(sources[0], root.blocks[a.block].ref))), [ASK, "next ask"]);
  assert.equal(root.asks[0].request, 0);
  // Compaction: summary block, carried context, the compaction call flagged.
  assert.equal(root.compactions.length, 1);
  const c = root.compactions[0];
  assert.deepEqual([c.pre, c.post], [12500, 9000]);
  assert.equal(root.blocks[c.block].kind, "summary");
  assert.equal(root.requests[3].compactionRequest, true);
  const w = root.requests[4].window;
  assert.ok(root.blocks.slice(w[0], w[1] + 1).some((b) => b.carried && b.label === "base instructions"));
  assert.ok(root.blocks.slice(w[0], w[1] + 1).some((b) => b.carried && b.kind === "you"));
  assert.ok(w[0] > root.requests[3].window[1]);
  assert.deepEqual(root.shrinks.map((s) => [s.pre, s.post, s.note]), [[9000, 2000, "context shrank; not logged as a compaction"]]);
  assertStrata(trace);
  await assertRoundTrip(trace, sources);
});

test("codex: actions from exec/js sources, images, custody", async () => {
  const { trace } = await load("codex");
  const root = trace.agents[0];
  const [r0, r1, r2] = root.requests;
  assert.deepEqual([r0.action.tool, r0.action.class, r0.action.target], ["exec", "outward", "git push origin main"]);
  assert.ok(r0.action.result);
  assert.deepEqual([r1.action.tool, r1.action.class, r1.action.target, r1.action.all.length], ["js", "outward", "https://example.com/page", 2]);
  assert.deepEqual([r2.action.class, r2.action.target], ["write", null]);
  assert.equal(r0.reasoning.encrypted, true);
  const img = root.blocks.find((b) => b.image);
  assert.deepEqual([img.kind, img.image, img.est], ["outside", { w: 1500, h: 750 }, 1500]);
  const cu = r0.action.custody;
  assert.equal(root.blocks[cu.askedBy.block].label, "user");
  assert.deepEqual([cu.permittedBy.approvalPolicy, cu.permittedBy.sandbox, cu.permittedBy.network], ["on-request", "workspace-write", false]);
  assert.equal(root.blocks[cu.permittedBy.permissionsBlock].label, "developer: permissions.instructions");
  assert.deepEqual(cu.did, { class: "outward", target: "git push origin main" });
});

test("codex: guardian reviews join by justification and by patch file, not by ordinal", async () => {
  const { trace } = await load("codex");
  const root = trace.agents[0];
  const g = trace.agents.find((a) => a.kind === "guardian");
  assert.equal(g.parentId, CODEX.root);
  assert.deepEqual(g.reviews.map((r) => [r.parentRequest, r.joinedBy, r.outcome, r.risk]), [[0, "justification", "allow", "medium"], [2, "patch file", "allow", "medium"]]);
  assert.equal(root.requests[0].action.custody.permittedBy.guardian.outcome, "allow");
  assert.equal(root.requests[2].action.custody.permittedBy.guardian.agentId, CODEX.guardian);
  assert.deepEqual(g.asks.map((a) => a.from), ["harness", "harness"]);
  assert.ok(g.blocks.some((b) => b.label === "reviewed transcript" && b.kind === "outside"));
  assert.ok(g.blocks.some((b) => b.label === "planned action" && b.kind === "outside"));
});

test("codex: subagent spawn, inherited history, asks and returns", async () => {
  const { trace } = await load("codex");
  const child = trace.agents.find((a) => a.id === CODEX.child);
  assert.deepEqual([child.kind, child.depth, child.path], ["subagent", 1, "/root/helper"]);
  assert.deepEqual(child.spawn, { t: child.spawn.t, parentRequest: 1, callId: "c3" });
  assert.equal(child.returns.length, 1);
  assert.equal(child.returns[0].parentRequest, 2);
  assert.ok(child.blocks.find((b) => b.kind === "you").carried);
  assert.deepEqual(child.asks.map((a) => a.from), ["agent"]);
  assert.equal(child.requests[0].action.class, "read");
});

test("claude-code: iterations split, advisor side agent, harness snapshot pair", async () => {
  const { trace, sources } = await load("claude");
  assert.equal(trace.product, "claude-code");
  assert.equal(trace.title, "Fixture session");
  const root = trace.agents[0];
  assert.equal(root.id, CC.session);
  assert.deepEqual(root.requests.map((r) => r.tokens.context), [5010, 6002, 6202, 6403, 9053, 4003, 4103]);
  assert.deepEqual([root.requests[1].iteration, root.requests[2].iteration, root.requests[2].iterations], [0, 1, 2]);
  assert.equal(root.requests[0].tokens.reasoning, 20);
  const side = trace.agents.find((a) => a.kind === "side");
  assert.deepEqual([side.name, side.parentId, side.requests.length, side.requests[0].tokens.context], ["advisor (advisor-test)", CC.session, 1, 7000]);
  assert.equal(root.harnessSource, "logged");
  const before = root.blocks.filter((b) => b.kind === "harness" && b.i < root.compactions[0].block);
  assert.deepEqual(before.map((b) => b.label), ["system prompt", "cli prefix", "tool definitions (1)"]);
  // The tools block was logged after request 0 but was in its context.
  assert.equal(root.requests[0].extra.length, 2);
  assert.ok(root.requests[0].strata.harness > 0);
  assertStrata(trace);
  await assertRoundTrip(trace, sources);
});

test("claude-code: attachments are literal when rendered, structured otherwise; hooks without rendered text are skipped", async () => {
  const { trace } = await load("claude");
  const t = trace.attachments;
  assert.deepEqual(t.date, { rows: 1, literal: 1, structured: 0, skipped: 0 });
  assert.deepEqual(t.hook_success, { rows: 1, literal: 0, structured: 0, skipped: 1 });
  assert.deepEqual(t.mystery_type, { rows: 1, literal: 0, structured: 1, skipped: 0 });
  assert.deepEqual(t.prompt_snapshot, { rows: 2, literal: 2, structured: 0, skipped: 0 });
  const root = trace.agents[0];
  const d = root.blocks.find((b) => b.label === "date");
  assert.deepEqual([d.kind, d.render], ["injected", "literal"]);
  assert.equal(root.blocks.find((b) => b.label === "mystery_type").render, "structured");
});

test("claude-code: system-reminders split out of user text and tool results", async () => {
  const { trace, sources } = await load("claude");
  const root = trace.agents[0];
  const ask = root.blocks[root.asks[0].block];
  assert.equal(await readRef(sources[0], ask.ref), CC_ASK);
  const rem = root.blocks.filter((b) => b.label === "system-reminder");
  assert.equal(rem.length >= 2, true);
  for (const b of rem) {
    assert.equal(b.kind, "injected");
    assert.match(await readRef(sources[0], b.ref), /^<system-reminder>[\s\S]*<\/system-reminder>$/);
  }
  const res = root.blocks.find((b) => b.label === "Bash result");
  assert.equal(await readRef(sources[0], res.ref), "fetched");
});

test("claude-code: actions, images, persisted results, agents blocks, compaction", async () => {
  const { trace, sources } = await load("claude");
  const root = trace.agents[0];
  const r = root.requests;
  assert.deepEqual([r[0].action.tool, r[0].action.class, r[0].action.target], ["Bash", "outward", "curl https://example.com"]);
  assert.equal(r[0].reasoning.encrypted, true);
  assert.equal(r[1].action.tool, "advisor");
  assert.deepEqual([r[2].action.tool, r[2].action.class], ["Agent", "internal"]);
  assert.deepEqual([r[3].action.tool, r[3].action.class, r[3].action.target], ["Write", "write", "/tmp/a.txt"]);
  assert.equal(r[0].action.custody.permittedBy.permissionMode, "default");
  const img = root.blocks.find((b) => b.image);
  assert.deepEqual([img.image, img.est], [{ w: 750, h: 750 }, 750]);
  assert.match(await readRef(sources[0], img.ref), /^data:image\/png;base64,/);
  const persisted = root.blocks.find((b) => b.persisted === "abc.txt");
  assert.equal(await readRef(sources[persisted.full.file], persisted.full), "the full persisted output ✓\n");
  const tm = root.blocks.find((b) => b.label === "teammate-message from helper");
  assert.deepEqual([tm.kind, tm.flags], ["agents", ["instruction-like"]]);
  assert.equal(r[4].action.custody, undefined);
  assert.deepEqual(root.asks.map((a) => a.from), ["human", "human"]);
  const c = root.compactions[0];
  assert.deepEqual([c.pre, c.loggedPost, c.post, c.trigger], [9053, 1000, 4003, "auto"]);
  assert.equal(root.blocks[c.block].kind, "summary");
  const w = r[5].window;
  const inWin = root.blocks.slice(w[0], w[1] + 1);
  assert.ok(inWin.some((b) => b.carried && b.kind === "you"), "preserved ask carried into the new window");
  assert.ok(inWin.some((b) => b.carried && b.kind === "injected" && b.label === "system-reminder"));
  assert.ok(inWin.some((b) => b.carried && b.kind === "harness"), "harness carried when no new snapshot is logged");
});

test("claude-code: subagent linked by name and time, bursts, returns", async () => {
  const { trace } = await load("claude");
  const sub = trace.agents.find((a) => a.kind === "subagent");
  assert.deepEqual([sub.id, sub.name, sub.parentId, sub.depth], [CC.agent, "helper", CC.session, 1]);
  assert.deepEqual([sub.spawn.callId, sub.spawn.parentRequest, sub.spawn.linkedBy], ["tu2", 2, "name"]);
  assert.equal(sub.bursts.length, 2);
  assert.deepEqual(sub.returns.map((x) => x.via), ["tool_result", "teammate-message"]);
  assert.deepEqual(sub.asks.map((a) => a.from), ["agent"]);
  assert.equal(sub.blocks[sub.asks[0].block].kind, "agents");
});

test("loader: sessions found by first line; a hint picks one", async () => {
  const entries = await entriesFor([FIX]);
  const sessions = await findSessions(entries);
  assert.deepEqual(sessions.map((s) => [s.product, s.id, s.entries.length]).sort(), [["claude-code", CC.session, 2], ["codex", CODEX.root, 3]]);
  const { trace } = await loadTrace(entries, { root: CODEX.root });
  assert.equal(trace.product, "codex");
  assert.equal(trace.candidates.length, 2);
});

test("loader: Claude Code files picked loose (no folders) still group their subagents and metadata", async () => {
  const loose = Object.entries({
    [`${CC.session}.jsonl`]: `claude/-tmp-proj/${CC.session}.jsonl`,
    [`agent-${CC.agent}.jsonl`]: `claude/-tmp-proj/${CC.session}/subagents/agent-${CC.agent}.jsonl`,
    [`agent-${CC.agent}.meta.json`]: `claude/-tmp-proj/${CC.session}/subagents/agent-${CC.agent}.meta.json`,
  }).map(([path, rel]) => ({ path, source: { name: path, size: readFileSync(FIX + rel).length, slice: async (a, b) => readFileSync(FIX + rel).subarray(a, b) } }));
  const sessions = await findSessions(loose);
  assert.deepEqual(sessions.map((s) => [s.product, s.entries.length, s.metas.length]), [["claude-code", 2, 1]]);
  const { trace: flat } = await loadTrace(loose);
  const { trace: foldered } = await load("claude");
  assert.equal(flat.agents.length, foldered.agents.length);
  assert.deepEqual(flat.agents.map((a) => [a.kind, a.name]), foldered.agents.map((a) => [a.kind, a.name]));
});

test("worker API: load streams progress then a trace; text returns a block's literal text", async () => {
  const posted = [];
  globalThis.self = { postMessage: (m) => posted.push(m) };
  await import("../worker.js");
  const files = Object.entries({
    [`p/${CC.session}.jsonl`]: `claude/-tmp-proj/${CC.session}.jsonl`,
    [`p/${CC.session}/subagents/agent-${CC.agent}.jsonl`]: `claude/-tmp-proj/${CC.session}/subagents/agent-${CC.agent}.jsonl`,
    [`p/${CC.session}/subagents/agent-${CC.agent}.meta.json`]: `claude/-tmp-proj/${CC.session}/subagents/agent-${CC.agent}.meta.json`,
  }).map(([path, rel]) => ({ path, file: new File([readFileSync(FIX + rel)], rel.split("/").pop()) }));
  await self.onmessage({ data: { type: "load", files } });
  assert.ok(posted.some((m) => m.type === "progress" && m.phase === "parse"));
  const tr = posted.find((m) => m.type === "trace");
  assert.ok(tr, JSON.stringify(posted.find((m) => m.type === "error")));
  assert.equal(tr.trace.agents.length, 3);
  const root = tr.trace.agents[0];
  const ref = root.blocks[root.asks[0].block].ref;
  await self.onmessage({ data: { type: "text", ref, id: 7 } });
  const txt = posted.find((m) => m.type === "text");
  assert.deepEqual([txt.id, txt.text], [7, CC_ASK]);
  delete globalThis.self;
});
