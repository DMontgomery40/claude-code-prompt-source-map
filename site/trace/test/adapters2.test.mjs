// Adapter fixes found in QA: batched teammate messages, every guardian review per call, readable
// subagent asks, and structured Claude Code attachments rebuilt from the site's templates.
// Synthetic fixtures only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { readRef, prepareIndex } from "../model.js";
import { rows, msg, usage, uuid7 } from "./fixtures/make.mjs";

const J = (list) => list.map((l) => JSON.stringify(l)).join("\n") + "\n";

// A Claude Code session: root file plus named subagents.
function ccSession({ sid, t0, rootRows, subs = [] }) {
  const dir = mkdtempSync(join(tmpdir(), "trace-cc2-"));
  writeFileSync(join(dir, `${sid}.jsonl`), J(rootRows));
  if (subs.length) mkdirSync(join(dir, sid, "subagents"), { recursive: true });
  for (const s of subs) {
    writeFileSync(join(dir, sid, "subagents", `agent-${s.id}.jsonl`), J(s.rows));
    writeFileSync(join(dir, sid, "subagents", `agent-${s.id}.meta.json`), JSON.stringify({ agentType: "general-purpose", name: s.name, description: s.name, model: "test" }));
  }
  return dir;
}

test("claude-code: a batched teammate message is one agents block per sender, each counted in its own returns", async () => {
  const sid = "44444444-4444-4444-8444-444444444444";
  const t0 = Date.parse("2026-01-05T00:00:00Z");
  let n = 0;
  const base = (sec, extra = {}) => ({ sessionId: sid, uuid: `b${++n}`, parentUuid: null, timestamp: new Date(t0 + sec * 1000).toISOString(), version: "2.1.300", isSidechain: false, ...extra });
  const asst = (sec, rid, content, u) => ({ ...base(sec), type: "assistant", requestId: rid, message: { id: "m" + rid, model: "claude-test", role: "assistant", content, usage: u } });
  const u = (ctx) => ({ input_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: ctx, output_tokens: 5 });
  const alpha = `<teammate-message teammate_id="alpha" color="red" summary="Alpha done">\nAlpha report — café ☃. It quotes <system-reminder>not a real reminder</system-reminder> verbatim.\n${"a".repeat(3000)}\n</teammate-message>`;
  const beta = `<teammate-message teammate_id="beta" color="blue">\n${"b".repeat(800)}\n</teammate-message>`;
  const alpha2 = `<teammate-message teammate_id="alpha" color="red">\n{"type":"idle_notification"}\n</teammate-message>`;
  const reminder = "<system-reminder>\nharness note\n</system-reminder>";
  const note = "This came from another Claude session, not typed by your user.";
  const batched = `Another Claude session sent a message:\n${alpha}\n\n${beta}\n\n${alpha2}\n\n${note}\n${reminder}`;
  const spawn = (sec, rid, id, name) => asst(sec, rid, [{ type: "tool_use", id, name: "Agent", input: { name, description: name, prompt: `do ${name}`, subagent_type: "general-purpose" } }], u(2000));
  const rootRows = [
    { ...base(1), type: "user", message: { role: "user", content: "Start the team" } },
    spawn(2, "r1", "tuA", "alpha"),
    { ...base(3), type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "tuA", content: "Spawned alpha" }] } },
    spawn(4, "r2", "tuB", "beta"),
    { ...base(5), type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "tuB", content: "Spawned beta" }] } },
    asst(6, "r3", [{ type: "text", text: "waiting" }], u(2100)),
    { ...base(60), type: "user", message: { role: "user", content: batched } },
    asst(61, "r4", [{ type: "text", text: "thanks" }], u(4000)),
  ];
  const sub = (id, name, sec) => ({ id, name, rows: [
    { ...base(sec, { isSidechain: true, agentId: id }), type: "user", message: { role: "user", content: `<teammate-message teammate_id="team-lead">\nPlease do ${name}.\nDetails follow.\n</teammate-message>` } },
    { ...base(sec + 1, { isSidechain: true, agentId: id }), type: "assistant", requestId: `s${id}`, message: { id: `ms${id}`, model: "claude-test", role: "assistant", content: [{ type: "text", text: "on it" }], usage: u(1500) } },
  ] });
  const dir = ccSession({ sid, t0, rootRows, subs: [sub("aalpha1", "alpha", 3), sub("abeta01", "beta", 5)] });
  const { trace, sources } = await loadTrace(await entriesFor([dir]));
  const root = trace.agents[0];
  const tms = root.blocks.filter((b) => b.label.startsWith("teammate-message"));
  assert.deepEqual(tms.map((b) => b.label), ["teammate-message from alpha", "teammate-message from beta", "teammate-message from alpha"]);
  // Each element reads back as exactly itself; the harness prefix goes with the first.
  const texts = await Promise.all(tms.map((b) => readRef(sources[b.ref.file], b.ref)));
  assert.deepEqual(texts, [`Another Claude session sent a message:\n${alpha}`, beta, alpha2]);
  assert.deepEqual(tms.map((b) => b.chars), texts.map((x) => x.length));
  // The quoted reminder stays inside alpha's message; the real one after the batch is injected.
  const rem = root.blocks.filter((b) => b.label === "system-reminder");
  assert.equal(rem.length, 1);
  assert.equal(await readRef(sources[rem[0].ref.file], rem[0].ref), reminder);
  // The harness's note after the batch is injected wording, not the human's.
  const nb = root.blocks.find((b) => b.label === "cross-session note");
  assert.deepEqual([nb.kind, await readRef(sources[nb.ref.file], nb.ref)], ["injected", note]);
  // The prefix is not a human ask, and the title is still the human's.
  assert.equal(root.asks.length, 1);
  assert.equal(trace.title, "Start the team");
  const a = trace.agents.find((x) => x.name === "alpha");
  const b = trace.agents.find((x) => x.name === "beta");
  const via = (ag) => ag.returns.map((r) => [r.via, root.blocks[r.block].chars]);
  assert.deepEqual(via(a), [["tool_result", "Spawned alpha".length], ["teammate-message", texts[0].length], ["teammate-message", alpha2.length]]);
  assert.deepEqual(via(b), [["tool_result", "Spawned beta".length], ["teammate-message", beta.length]]);
  // In a subagent, a teammate message is an ask credited to its sender.
  assert.deepEqual(a.asks.map((x) => [x.from, x.by]), [["agent", "team-lead"]]);
});

test("claude-code: a human message that quotes the teammate tag mid-text stays the human's", async () => {
  const sid = "55555555-5555-4555-8555-555555555555";
  const t0 = Date.parse("2026-01-06T00:00:00Z");
  const said = `${"Here is what I saw in the log, please look at it carefully. ".repeat(8)}<teammate-message teammate_id="x">hi</teammate-message>`;
  const dir = ccSession({ sid, t0, rootRows: [
    { sessionId: sid, uuid: "h1", parentUuid: null, timestamp: new Date(t0).toISOString(), version: "2.1.300", type: "user", message: { role: "user", content: said } },
    { sessionId: sid, uuid: "h2", parentUuid: null, timestamp: new Date(t0 + 1000).toISOString(), version: "2.1.300", type: "assistant", requestId: "r1", message: { id: "m1", model: "claude-test", role: "assistant", content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 900, output_tokens: 5 } } },
  ] });
  const { trace } = await loadTrace(await entriesFor([dir]));
  const root = trace.agents[0];
  assert.deepEqual(root.blocks.filter((b) => b.kind !== "model").map((b) => [b.kind, b.label, b.chars]), [["you", "user", said.length]]);
  assert.equal(root.asks.length, 1);
});

// Codex: one escalated exec call reviewed three times (allow, allow, deny) by two guardian threads,
// plus a patch in the same response reviewed once, and a subagent whose task is encrypted.
function codexGuardians() {
  const T0 = Date.parse("2026-02-01T00:00:00Z");
  const ids = { root: uuid7(T0, 11), g1: uuid7(T0 + 10000, 12), g2: uuid7(T0 + 20000, 13), kid: uuid7(T0 + 30000, 14) };
  const JUST = "Push the release branch";
  const root = rows([
    { type: "session_meta", payload: { id: ids.root, cli_version: "0.1.0", source: "vscode", thread_source: "user", base_instructions: { text: "base" } } },
    { type: "turn_context", payload: { model: "gpt-test", approval_policy: "on-request", approvals_reviewer: "auto_review", sandbox_policy: { type: "workspace-write", network_access: false } } },
    msg("user", ["ship it"], ["user.text"]),
    { type: "response_item", payload: { type: "custom_tool_call", call_id: "p1", name: "exec", input: 'await tools.apply_patch("*** Begin Patch\\n*** Add File: /tmp/notes.txt\\n+x\\n*** End Patch");' } },
    { type: "response_item", payload: { type: "custom_tool_call", call_id: "c1", name: "exec", input: `text(await tools.exec_command({cmd:"git push origin release",sandbox_permissions:"require_escalated",justification:${JSON.stringify(JUST)}}));` } },
    usage("resp1", 5000, 0),
    { type: "response_item", payload: { type: "custom_tool_call_output", call_id: "p1", output: "patched" } },
    { type: "response_item", payload: { type: "custom_tool_call_output", call_id: "c1", output: "pushed" } },
    { type: "response_item", payload: { type: "function_call", call_id: "s1", name: "spawn_agent", namespace: "collaboration", arguments: JSON.stringify({ task_name: "helper", message: "gAAAA" + "x".repeat(60) }) } },
    usage("resp2", 6000, 5000),
    { type: "response_item", payload: { type: "function_call_output", call_id: "s1", output: "{}" } },
    { type: "event_msg", payload: { type: "item_completed", item: { type: "SubAgentActivity", id: "s1", kind: "started", agent_thread_id: ids.kid, agent_path: "/root/helper" } } },
  ], T0);
  const review = (planned, verdict, id) => [
    msg("user", [">>> TRANSCRIPT START\n", "[1] user: ship it\n", ">>> TRANSCRIPT END\n", ">>> APPROVAL REQUEST START\n", "Planned action JSON:\n", JSON.stringify(planned), ">>> APPROVAL REQUEST END\n"], []),
    msg("assistant", [JSON.stringify(verdict)], ["unknown"]),
    usage(id, 2000, 0),
  ];
  const push = { command: ["/bin/zsh", "-lc", "git push origin release"], justification: JUST };
  const g = (id, list, t) => rows([{ type: "session_meta", payload: { id, parent_thread_id: ids.root, thread_source: "guardian_review", cli_version: "0.1.0", source: { subagent: { other: "guardian" } }, base_instructions: { text: "review" } } }, ...list], t);
  const g1 = g(ids.g1, [
    ...review(push, { outcome: "allow", risk_level: "low", user_authorization: "high", rationale: "The user asked to ship." }, "ga"),
    ...review({ files: ["/tmp/notes.txt"] }, { outcome: "allow", risk_level: "low", user_authorization: "medium", rationale: "A scratch file." }, "gb"),
    ...review(push, { outcome: "allow", risk_level: "medium", user_authorization: "high", rationale: "Retry of the same push." }, "gc"),
  ], T0 + 10000);
  const g2 = g(ids.g2, review(push, { outcome: "deny", risk_level: "high", user_authorization: "low", rationale: "Force flags appeared." }, "gd"), T0 + 20000);
  const kid = rows([
    { type: "session_meta", payload: { id: ids.kid, parent_thread_id: ids.root, cli_version: "0.1.0", thread_source: "subagent", agent_path: "/root/helper", agent_nickname: "Helper", source: { subagent: { thread_spawn: { parent_thread_id: ids.root, depth: 1, agent_path: "/root/helper", agent_nickname: "Helper" } } }, base_instructions: { text: "kid base" } } },
    { type: "response_item", payload: { type: "agent_message", author: "/root", recipient: "/root/helper", content: [{ type: "input_text", text: "Message Type: NEW_TASK\nTask name: /root/helper\nSender: /root\nPayload:\n" }, { type: "encrypted_content", encrypted_content: "gAAAA" + "y".repeat(400) }] } },
    { type: "response_item", payload: { type: "custom_tool_call", call_id: "k1", name: "exec", input: 'text(await tools.exec_command({cmd:"rm -f /tmp/x"}));' } },
    usage("kr1", 3000, 0),
    { type: "response_item", payload: { type: "custom_tool_call_output", call_id: "k1", output: "" } },
  ], T0 + 30000);
  const dir = mkdtempSync(join(tmpdir(), "trace-codex2-"));
  mkdirSync(join(dir, "2026/02/01"), { recursive: true });
  const f = (t, id) => join(dir, "2026/02/01", `rollout-2026-02-01T00-00-${t}-${id}.jsonl`);
  writeFileSync(f("00", ids.root), root);
  writeFileSync(f("10", ids.g1), g1);
  writeFileSync(f("20", ids.g2), g2);
  writeFileSync(f("30", ids.kid), kid);
  return { dir, ids };
}

test("codex: every guardian review of a call is kept, in time order, with rationale; guardians are named for their agent", async () => {
  const { dir, ids } = codexGuardians();
  const { trace } = await loadTrace(await entriesFor([dir]));
  const root = trace.agents.find((a) => a.id === ids.root);
  const act = root.requests[0].action;
  assert.equal(act.callId, "c1", "the push is the headline call");
  const rv = act.custody.permittedBy.reviews;
  assert.deepEqual(rv.map((r) => [r.outcome, r.risk, r.userAuthorization, r.agentId === ids.g2, r.forCall || null]), [
    ["allow", "low", "high", false, null],
    ["allow", "low", "medium", false, "p1"],
    ["allow", "medium", "high", false, null],
    ["deny", "high", "low", true, null],
  ]);
  assert.equal(rv[3].rationale, "Force flags appeared.");
  // The patch call itself keeps its own review.
  assert.deepEqual(act.all.find((x) => x.callId === "p1").reviews.map((r) => r.outcome), ["allow"]);
  // The verdict block of each review is linked.
  const g1 = trace.agents.find((a) => a.id === ids.g1);
  assert.ok(rv.every((r) => Number.isInteger(r.result)));
  assert.equal(g1.blocks[rv[0].result].kind, "model");
  assert.deepEqual(trace.agents.filter((a) => a.kind === "guardian").map((a) => a.name), ["guardian for /root", "guardian for /root"]);
  // Custody facts never carry the review list as a plain value.
  assert.ok(Array.isArray(rv) && !("guardian" in act.custody.permittedBy));
});

test("codex: a subagent's ask is its task header, without the encrypted payload", async () => {
  const { dir, ids } = codexGuardians();
  const { trace, sources } = await loadTrace(await entriesFor([dir]));
  const kid = trace.agents.find((a) => a.id === ids.kid);
  assert.equal(kid.name, "Helper /root/helper");
  assert.deepEqual(kid.asks.map((a) => [a.from, a.by, a.message]), [["agent", "/root", "NEW_TASK"]]);
  const b = kid.blocks[kid.asks[0].block];
  const text = await readRef(sources[b.ref.file], b.ref);
  assert.equal(text, "Message Type: NEW_TASK\nTask name: /root/helper\nSender: /root\nPayload:\n");
  assert.ok(b.est > text.length / 4 + 50, "the encrypted payload is still counted");
  assert.deepEqual(kid.requests[0].action.custody.askedBy.by, "/root");
});

// A reference index with synthetic templates in the shape the site build writes.
const tpl = (text, title, anchor) => ({ text, slug: "system-reminders", anchor, title });
const TEMPLATES = {
  "system-reminder-wrapper": tpl("<system-reminder>\n{{content}}\n</system-reminder>", "Wrapper", "wrapper"),
  "trailing-environment": { ...tpl("# Env\n - cwd: {{CWD}}\n - git: {{IS_GIT_REPO}}\n - os: {{PLATFORM}} {{SHELL}} {{OS_VERSION}}", "Environment block", "environment-block"), slug: "system-prompt" },
  "trailing-scratchpad": { ...tpl("Scratch: {{SCRATCHPAD_DIR}} — temp files go here.", "Scratchpad", "scratchpad"), slug: "system-prompt" },
  "trailing-date": { ...tpl("Today is {{DATE}}.", "Date line", "date-line"), slug: "system-prompt" },
  "date-attachment-changed": tpl("The date is now {{date}}.", "Current date (changed)", "current-date-changed"),
  "bash-output-audience-note": tpl("Only you see that output.", "Bash output audience note", "bash-output-audience-note"),
};
const INDEX = { site: "test", origin: "https://example.test", pages: [], lines: {}, harness: {}, reminders: { environment: { slug: "system-reminders", anchor: "env", title: "Environment block" } }, templates: TEMPLATES };

test("claude-code: structured attachments are rebuilt from the site's template; the reader gets the same text", async () => {
  const sid = "66666666-6666-4666-8666-666666666666";
  const t0 = Date.parse("2026-01-07T00:00:00Z");
  let n = 0;
  const base = (sec) => ({ sessionId: sid, uuid: `s${++n}`, parentUuid: null, timestamp: new Date(t0 + sec * 1000).toISOString(), version: "2.1.100", isSidechain: false });
  const att = (sec, a) => ({ ...base(sec), type: "attachment", attachment: a });
  const env = { type: "environment", snapshot: { workingDirectory: "/work/café", isWorktree: false, isGitRepo: true, additionalWorkingDirectories: ["/work/other"], platform: "darwin", shell: "zsh", osVersion: "Darwin 1.0", scratchpadDirectory: "/tmp/pad" } };
  const rows = [
    att(1, env),
    att(1, { type: "date", date: "2026-01-07" }),
    att(1, { type: "date", date: "2026-01-08", changed: true }),
    att(1, { type: "bash_output_audience_note", toolUseID: "toolu_1" }),
    att(1, { type: "environment", snapshot: env.snapshot, changes: ["scratchpad"] }),
    att(1, { type: "session_context", uuid: "u-9", context: { userEmail: "someone@example.test", extra: { deep: "x\ny" } } }),
    { ...base(2), type: "user", message: { role: "user", content: "hi" } },
    { ...base(3), type: "assistant", requestId: "r1", message: { id: "m1", model: "claude-test", role: "assistant", content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 3000, output_tokens: 5 } } },
  ];
  const dir = ccSession({ sid, t0, rootRows: rows });
  const { trace, sources } = await loadTrace(await entriesFor([dir]), { index: INDEX });
  const root = trace.agents[0];
  const blocks = root.blocks.filter((b) => b.kind === "injected");
  const texts = await Promise.all(blocks.map((b) => readRef(sources[b.ref.file], b.ref, INDEX)));
  // The reader's text is exactly the text the block was measured from.
  assert.deepEqual(blocks.map((b) => b.chars), texts.map((x) => x.length));
  assert.deepEqual(blocks.map((b) => [b.label, b.render, b.template || null]), [
    ["environment", "rebuilt from the ccprompts template", "trailing-environment"],
    ["date", "rebuilt from the ccprompts template", "trailing-date"],
    ["date", "rebuilt from the ccprompts template", "date-attachment-changed"],
    ["bash_output_audience_note", "rebuilt from the ccprompts template", "bash-output-audience-note"],
    ["environment", "structured", null],
    ["session_context", "structured", null],
  ]);
  assert.equal(texts[0], "<system-reminder>\n# Env\n - cwd: /work/café\n - git: true\n - Additional working directories:\n  - /work/other\n - os: darwin zsh Darwin 1.0\n - Scratch: /tmp/pad — temp files go here.\n</system-reminder>");
  assert.equal(texts[2], "<system-reminder>\nThe date is now 2026-01-08.\n</system-reminder>");
  assert.equal(texts[3], "<system-reminder>\nOnly you see that output.\n</system-reminder>");
  // Rebuilt blocks link the template they follow; the estimate is from the rebuilt text.
  assert.deepEqual(blocks[0].site, { slug: "system-prompt", anchor: "environment-block", title: "Environment block" });
  assert.equal(blocks[3].est, Math.ceil(texts[3].length / 4));
  // No template for the change or for session_context here: readable key: value lines, no bookkeeping keys.
  assert.equal(texts[5], "context.userEmail: someone@example.test\ncontext.extra.deep: x\n  y");
  assert.ok(!/\b(type|toolUseID|uuid)\b/.test(texts[4] + texts[5]));
  assert.match(texts[4], /^snapshot\.workingDirectory: \/work\/café\n/);
  assert.match(texts[4], /\nchanges: scratchpad$/);
  assert.deepEqual(trace.attachments.date, { rows: 2, literal: 0, structured: 2, skipped: 0 });
  // Without the index (as on the other site) the same rows read as their fields, still in step.
  const bare = await loadTrace(await entriesFor([dir]));
  const b2 = bare.trace.agents[0].blocks.filter((b) => b.kind === "injected");
  const t2 = await Promise.all(b2.map((b) => readRef(bare.sources[b.ref.file], b.ref, prepareIndex(null))));
  assert.deepEqual(b2.map((b) => b.chars), t2.map((x) => x.length));
  assert.deepEqual(b2.map((b) => b.render), Array(6).fill("structured"));
  assert.equal(t2[1], "date: 2026-01-07");
});
