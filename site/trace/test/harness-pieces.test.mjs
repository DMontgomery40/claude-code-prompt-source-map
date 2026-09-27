import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildLiteralIndex, codeLiterals, rustLiterals } from "../../src/shared/trace-build.mjs";
import { textLineHashes, readRef } from "../model.js";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { buildHarnessModel, rackFor, recordsFromMarkdown, literalEntryKeys, lookupKeys, shapeOf, isLookAlike, RUNGS, literalHit, markEntryKeys, textLink } from "../harness/pieces.js";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));

// A published page, as the site build reads it: records under headings, model-facing text in fences.
const REMINDERS = `# System reminders

### Deferred tools available

Source: \`chunk-a.js\` · offset 1000 · sha256 \`aa\`

- When: From code: new deferred tools appeared; TEST_DEFERRED_FLAG turns it off.

~~~~~~text
The following deferred tools are now available via ToolSearch. Their schemas are NOT loaded.
~~~~~~

### MCP servers failed to connect

Source: \`chunk-a.js\` · offset 2000 · sha256 \`bb\`

~~~~~~text
The following MCP servers are configured but failed to connect — their tools are unavailable:
{{expr:list}}
~~~~~~

### Tools became available

~~~~~~text
The following tools just became available and are ready to use:
~~~~~~

### Silent-turn reminder

~~~~~~text
The user hasn't heard from you in a while. As you continue, keep them updated.
~~~~~~

### Remaining tokens

~~~~~~text
<total_tokens>{{expr:n}} tokens left</total_tokens>
~~~~~~

### Teammate envelope

~~~~~~text
<teammate-message teammate_id="{{id}}">
~~~~~~

### Metadata only

- When: never model-facing text.
`;
const PROMPT = `# System prompt

## Intro line

~~~~~~text
You are a test agent that helps with fixture-sized engineering tasks.
~~~~~~

## Tone section

~~~~~~text
Keep answers short and write in complete sentences for the reader.
~~~~~~

## Safety section

~~~~~~text
Refuse to run commands that would delete the user's home directory.
~~~~~~
`;
const ENV = `# Env\n\n### TEST_DEFERRED_FLAG\n\nA flag.\n`;
const anchor = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
function makeIndex() {
  const pages = [{ slug: "system-reminders", title: "System reminders", text: REMINDERS }, { slug: "system-prompt", title: "System prompt", text: PROMPT }, { slug: "env", title: "Env", text: ENV }];
  const lines = {};
  pages.forEach((p, i) => { for (const h of textLineHashes(p.text)) if (!(h in lines)) lines[h] = i; });
  const withIds = pages.map((p) => ({ ...p, ids: new Map([...p.text.matchAll(/^#{2,6} (.+)$/gm)].map((m) => [m[1].trim(), anchor(m[1].trim())])) }));
  return { site: "testsite", libVersion: "9.9.9", pages: pages.map(({ slug, title }) => ({ slug, title })), lines, harness: {}, reminders: {}, templates: {}, ...recordsFromMarkdown(withIds) };
}
const IX = makeIndex();
const site = (title) => ({ slug: "system-reminders", anchor: anchor(title), title });

// An in-memory trace: agents of blocks whose text readText returns. `line` puts blocks on one log line (a
// reminder split out of a tool result shares its host's line and JSON path; `range` orders them).
function memTrace(product, agents) {
  const T0 = Date.parse("2026-01-01T00:00:00Z");
  let line = 0;
  const out = agents.map((a, ai) => ({
    id: "agent" + ai, kind: ai === 0 ? "root" : "subagent", name: a.name || "a" + ai, model: "m", parentId: ai === 0 ? null : "agent0",
    requests: a.reqs.map((w, r) => ({ t: T0 + (a.born || 0) + r * 60000, window: w })),
    compactions: (a.comp || []).map((c) => ({ block: c, t: T0 + (a.born || 0) + (a.blocks[c].req || 0) * 60000 })),
    blocks: a.blocks.map((b, bi) => ({
      i: bi, t: T0 + (a.born || 0) + (b.req || 0) * 60000 + bi, kind: b.kind, label: b.label, chars: b.text.length, site: b.site || null, source: b.source,
      seenBy: b.req || 0, userSpans: b.userSpans,
      ref: { file: 0, offset: b.line != null ? b.line : 100000 + line++, length: 10, path: ["message", "content"], ...(b.range ? { range: b.range } : {}) },
      _text: b.text,
    })),
  }));
  const trace = { product, title: "t", version: "1.0", started: T0, ended: T0 + 3600000, agents: out, files: [{ name: "/somewhere/session.jsonl" }] };
  return { trace, readText: async (ai, bi) => out[ai].blocks[bi]._text };
}
const piece = (model, re) => model.pieces.find((p) => re.test(p.name) || re.test(p.sample));

test("records come from fenced text under headings, with offsets, gates and template prefixes", () => {
  const titles = IX.records.map((r) => r.title);
  assert.ok(titles.includes("Deferred tools available") && titles.includes("Remaining tokens"));
  assert.ok(!titles.includes("Metadata only"), "a heading without fenced text is not a record");
  const d = IX.records.find((r) => r.title === "Deferred tools available");
  assert.deepEqual([d.file, d.offset, d.gates], ["chunk-a.js", 1000, ["TEST_DEFERRED_FLAG"]]);
  assert.equal(IX.records.find((r) => r.title === "Remaining tokens").n, 0, "a template too short to hash still counts as a record");
  const env = IX.records.findIndex((r) => r.title === "Teammate envelope");
  assert.ok(Object.values(IX.recordPrefixes).includes(env) && IX.records[env].s.length, "the literal part of a template line is indexed by prefix");
  const mcp = IX.records.findIndex((r) => r.title === "MCP servers failed to connect");
  assert.ok(!Object.values(IX.recordPrefixes).includes(mcp), "a whole line is not indexed by prefix: different text sharing an opening must not match");
});

test("rungs: text links win over row types, including a type mislink, and every rung is reachable", async () => {
  const { trace, readText } = memTrace("claude-code", [{
    reqs: [[0, 3], [0, 7], [0, 9]],
    blocks: [
      { kind: "injected", label: "deferred_tools_delta", site: site("Deferred tools available"), text: "<system-reminder>\nThe following deferred tools are now available via ToolSearch. Their schemas are NOT loaded.\nBash\n</system-reminder>" },
      // Filed by row type under the deferred-tools record; the text is the MCP failure notice.
      { kind: "injected", label: "deferred_tools_delta", site: site("Deferred tools available"), text: "<system-reminder>\nThe following MCP servers are configured but failed to connect — their tools are unavailable:\nsrv-one\n</system-reminder>" },
      { kind: "injected", label: "silent_turn_reminder", site: site("Silent-turn reminder"), text: "<system-reminder>\nThe user hasn't heard from you lately — say in a few words what you are doing.\n</system-reminder>" },
      { kind: "injected", label: "total_tokens_reminder", site: site("Remaining tokens"), text: "<system-reminder>\n<total_tokens>900 tokens left</total_tokens>\n</system-reminder>" },
      { kind: "harness", label: "system prompt", req: 1, text: "You are a test agent that helps with fixture-sized engineering tasks.\n\nKeep answers short and write in complete sentences for the reader.\n\nRefuse to run commands that would delete the user's home directory." },
      { kind: "injected", label: "system-reminder", req: 1, text: "<system-reminder>\nAn unnamed notice that nothing publishes anywhere at all.\n</system-reminder>" },
      { kind: "you", label: "instructions file · CLAUDE.md", source: "file:/home/u/.claude/CLAUDE.md", req: 1, text: "Contents of CLAUDE.md:\n# my rules" },
      { kind: "injected", label: "hook output · SessionStart", source: "hook:SessionStart", req: 1, text: "SessionStart hook additional context: be nice" },
      { kind: "injected", label: "system-reminder", req: 2, text: "<system-reminder>\nAnother unnamed notice, one that only the binary carries.\n</system-reminder>" },
      { kind: "injected", label: "system-reminder", req: 2, text: "<system-reminder>\nThe following tools just became available and are ready to use:\nFoo\n</system-reminder>" },
    ],
  }]);
  const literals = { shelves: ["test.bin 9.9.9"], files: ["chunk-z.js"], keys: Object.fromEntries(literalEntryKeys("Another unnamed notice, one that only the binary carries.").map((h) => [h, [0, 0, 4242]])) };
  const model = await buildHarnessModel({ trace, readText, index: IX, literals });
  const rung = (re) => piece(model, re).rung;
  assert.equal(rung(/Deferred tools available/), "linked");
  const mcp = piece(model, /MCP servers failed to connect/);
  assert.equal(mcp.rung, "in-library-unlinked", "the MCP failure notice is linked by its text, not the row type");
  assert.match(mcp.note, /Deferred tools available/);
  assert.equal(mcp.where.pos, 2000);
  assert.equal(rung(/Silent-turn reminder/), "linked-type-text-differs");
  assert.equal(rung(/Remaining tokens/), "linked", "a short template record can only be linked by type");
  const sp = piece(model, /System prompt/);
  assert.equal(sp.rung, "composite");
  assert.deepEqual(sp.composite.parts.map((p) => p.title), ["Intro line", "Tone section", "Safety section"]);
  assert.equal(rung(/unnamed notice that nothing/), "found-nowhere");
  const bin = piece(model, /only the binary carries/);
  assert.equal(bin.rung, "binary-only");
  assert.deepEqual([bin.where.key, bin.where.pos], ["chunk-z.js", 4242]);
  assert.equal(rung(/CLAUDE\.md/), "outside");
  assert.equal(piece(model, /CLAUDE\.md/).origin, "file");
  assert.equal(piece(model, /SessionStart/).origin, "hook");
  assert.equal(rung(/Tools became available/), "in-library-unlinked", "Trace had no link; the text names the record");
  for (const p of model.pieces) assert.ok(RUNGS.includes(p.rung), p.rung);
  assert.equal(piece(model, /Deferred tools available/).gates[0], "TEST_DEFERRED_FLAG");
  // Without a literal index, what only the binary carries is simply not in the library.
  const bare = await buildHarnessModel({ trace, readText, index: IX, literals: null });
  const nb = piece(bare, /only the binary carries/);
  assert.equal(nb.rung, "found-nowhere");
  assert.equal(nb.note, "not in the library");
});

test("one wrapper holding several notices, or several reminders, is several pieces", async () => {
  const { trace, readText } = memTrace("claude-code", [{
    reqs: [[0, 1]],
    blocks: [
      { kind: "injected", label: "deferred_tools_delta", site: site("Deferred tools available"), text: "<system-reminder>\nThe following tools just became available and are ready to use:\nFoo\n\nThe following deferred tools are now available via ToolSearch. Their schemas are NOT loaded.\nBar\n</system-reminder>" },
      { kind: "injected", label: "system-reminder", text: "<system-reminder>\nFirst unnamed notice in a pair of them.\n</system-reminder>\n<system-reminder>\nSecond unnamed notice in a pair of them.\n</system-reminder>" },
    ],
  }]);
  const model = await buildHarnessModel({ trace, readText, index: IX });
  assert.ok(piece(model, /Tools became available/) && piece(model, /Deferred tools available/));
  assert.ok(piece(model, /First unnamed/) && piece(model, /Second unnamed/));
  assert.equal(model.pieces.length, 4);
});

test("look-alikes are dropped: reminder markup quoted mid-body or in code", async () => {
  assert.ok(isLookAlike("<system-reminder>\\nNote: file changed.\\n</system-reminder>"));
  assert.ok(isLookAlike('<system-reminder>")).text; const x = 1;</system-reminder>'));
  assert.ok(isLookAlike("<system-reminder>x</system-reminder>"));
  assert.ok(!isLookAlike("<system-reminder>\nThe user sent a new message while you were working:\nhi\n</system-reminder>"));
  const { trace, readText } = memTrace("claude-code", [{
    reqs: [[0, 4]],
    blocks: [
      { kind: "outside", label: "Read result", line: 5, range: [0, 40], text: "file contents that quote a reminder" },
      { kind: "injected", label: "system-reminder", line: 5, range: [41, 90], text: "<system-reminder>\nA quoted notice sitting in the middle.\n</system-reminder>" },
      { kind: "outside", label: "Read result", line: 5, range: [91, 120], text: "more file contents after it" },
      { kind: "outside", label: "Bash result", line: 6, range: [0, 10], text: "ok" },
      { kind: "injected", label: "system-reminder", line: 6, range: [11, 60], text: "<system-reminder>\nAn appended notice at the end of output.\n</system-reminder>" },
    ],
  }]);
  const model = await buildHarnessModel({ trace, readText, index: IX });
  assert.equal(piece(model, /sitting in the middle/), undefined);
  const kept = piece(model, /appended notice/);
  assert.deepEqual(kept.via, [["tool result", 1]], "a reminder split out of a tool result rode in the tool result");
  assert.equal(model.lookAlikes, 1);
});

test("triggers are observed regularities: session start, every turn, compaction, hook, typing, teammates", async () => {
  const tok = (req) => ({ kind: "injected", label: "total_tokens_reminder", req, text: `<system-reminder>\n<total_tokens>${1000 - req} tokens left</total_tokens>\n</system-reminder>` });
  const { trace, readText } = memTrace("claude-code", [{
    reqs: [[0, 1], [0, 3], [0, 5], [0, 7], [8, 11]], comp: [8],
    blocks: [
      { kind: "injected", label: "hook output · SessionStart", source: "hook:SessionStart", text: "SessionStart hook additional context: be nice" },
      tok(0), { kind: "you", label: "user", req: 1, text: "hi" }, tok(1),
      { kind: "injected", label: "system-reminder", req: 2, text: "<system-reminder>\nThe user sent a new message while you were working:\nstop\n</system-reminder>" }, tok(2),
      { kind: "agents", label: "teammate-message from helper", req: 3, text: '<teammate-message teammate_id="helper">done</teammate-message>' }, tok(3),
      { kind: "summary", label: "compaction summary", req: 4, text: "This session is being continued from a previous conversation." },
      { kind: "injected", label: "environment", req: 4, text: "<system-reminder>\n# Environment\nYou have been invoked in the following environment: here\n</system-reminder>" }, tok(4), tok(4),
    ],
  }]);
  const model = await buildHarnessModel({ trace, readText, index: IX });
  assert.equal(piece(model, /Remaining tokens|total_tokens/).trigger, "every turn");
  assert.match(piece(model, /SessionStart/).trigger, /^with hook output/);
  assert.equal(piece(model, /while you were working/).trigger, "when you typed mid-turn");
  assert.equal(piece(model, /teammate-message/).trigger, "with a teammate message");
  assert.equal(piece(model, /continued from a previous/).trigger, "after compaction");
  assert.equal(piece(model, /Environment/).trigger, "after compaction");
  assert.match(model.triggerNote, /observed/);
});

test("reach, births and rackFor", async () => {
  const env = (req = 0) => ({ kind: "injected", label: "environment", req, text: "<system-reminder>\n# Environment\nYou have been invoked in the following environment: here\n</system-reminder>" });
  const { trace, readText } = memTrace("claude-code", [
    { reqs: [[0, 2], [0, 5]], blocks: [{ kind: "harness", label: "system prompt", text: "You are a test agent that helps with fixture-sized engineering tasks." }, env(), { kind: "you", label: "user", text: "go" }, { kind: "model", label: "assistant", req: 1, text: "" }, { kind: "outside", label: "Bash result", req: 1, text: "out" }, { kind: "injected", label: "system-reminder", req: 1, text: "<system-reminder>\nA late unnamed notice for the root.\n</system-reminder>" }] },
    { born: 5000, reqs: [[0, 1]], blocks: [env(), { kind: "agents", label: "teammate-message from lead", text: '<teammate-message teammate_id="lead" summary="task">do it</teammate-message>' }] },
    { born: 9000, reqs: [[0, 1]], blocks: [env(), { kind: "agents", label: "teammate-message from lead", text: '<teammate-message teammate_id="lead" summary="other">other</teammate-message>' }] },
  ]);
  const model = await buildHarnessModel({ trace, readText, index: IX });
  const e = piece(model, /Environment/);
  assert.equal(e.reach, 3);
  assert.equal(e.n, 3);
  const envl = piece(model, /teammate-message/);
  assert.equal(envl.reach, 2, "attribute values are blanked, so every envelope is one shape");
  assert.deepEqual(model.births.map((b) => b.n), [2, 1], "the two subagents share one birth; the root has its own");
  const rack = rackFor(model, trace, 0, 1);
  assert.equal(rack.plates[0].zone, "system");
  const names = rack.plates.slice(1).map((p) => (p.core ? "conversation" : model.pieces.find((q) => q.id === p.piece).name));
  assert.deepEqual(names.map((n) => n.slice(0, 14)), ["“# Environment", "conversation", "“A late unname"]);
  assert.equal(rack.plates.find((p) => p.core).n, 3, "the conversation between pieces folds into one plate");
  assert.equal(rackFor(model, trace, 0, 9).plates.length, 0);
});

test("the Claude Code fixture: grouping wherever a piece rode in, following ref.path", async () => {
  const { trace, sources } = await loadTrace(await entriesFor([FIX + "claude"]));
  const readText = (ai, bi) => readRef(sources[trace.agents[ai].blocks[bi].ref.file], trace.agents[ai].blocks[bi].ref);
  const model = await buildHarnessModel({ trace, readText, index: IX });
  const changed = piece(model, /Note: file changed/);
  assert.deepEqual([changed.n, changed.via], [2, [["user turn", 2]]], "the reminder inside the ask, and its re-send after compaction, are one piece");
  assert.deepEqual(piece(model, /remember this/).via, [["tool result", 1]]);
  assert.deepEqual(piece(model, /teammate-message/).via, [["agent message", 1]]);
  assert.ok(piece(model, /System prompt/) && piece(model, /Tool definitions/));
  for (const p of model.pieces) {
    assert.ok(!/"sessionId"|"uuid"|"requestId"/.test(p.sample), "text is the block's own path, not the whole log line: " + p.sample.slice(0, 60));
  }
  assert.equal(model.product, "Claude Code");
  assert.equal(model.agents[0].name, "main thread");
  assert.equal(model.session.libVersion, "9.9.9");
  const r0 = rackFor(model, trace, 0, 0);
  assert.deepEqual(r0.plates.filter((p) => !p.core).map((p) => p.zone).slice(0, 3), ["system", "system", "tools"]);
});

test("the Codex/ChatGPT fixture: labelled pieces, files, envelopes and the service's encrypted summary", async () => {
  const { trace, sources } = await loadTrace(await entriesFor([FIX + "codex"]));
  const readText = (ai, bi) => readRef(sources[trace.agents[ai].blocks[bi].ref.file], trace.agents[ai].blocks[bi].ref);
  const model = await buildHarnessModel({ trace, readText, index: null });
  assert.equal(model.product, "Codex/ChatGPT");
  const perm = piece(model, /permissions\.instructions/);
  assert.deepEqual([perm.n, perm.trigger], [2, "at session start"]);
  assert.equal(perm.triggers.find(([t]) => t === "after compaction")?.[1], 1);
  assert.equal(piece(model, /AGENTS\.md/).rung, "outside");
  const env = piece(model, /inter-agent message envelope/);
  assert.equal(env.via[0][0], "agent message");
  assert.equal(env.reach, 2);
  const enc = piece(model, /encrypted/);
  assert.deepEqual([enc.rung, enc.origin], ["outside", "service"]);
  assert.ok(!piece(model, /^“Build the thing/), "the person's own words are not harness text");
  assert.equal(piece(model, /planned action/), undefined);
});

test("shapeOf blanks values so templated first lines group", () => {
  assert.equal(shapeOf("<system-reminder>\nNote: /a/b.txt changed on disk since you last read it.\n</system-reminder>"), shapeOf("Note: /c/dd/e.md changed on disk since you last read it."));
  assert.equal(shapeOf("Today's date is 2026-09-24."), shapeOf("Today's date is 2026-09-25."));
});

test("literal index: code literals key by fragment and template prefix, and hold no readable text", async () => {
  const js = 'var a="Other agents active in this session, addressable via "+x;let b=`Other teammates in this session are named ${n} and can be messaged`;const c=/["\']/;var d="short";var e="The notice says \\u2014 something the model reads when it runs";';
  const lits = [...codeLiterals(js)].map(([t]) => t);
  assert.ok(lits.includes("Other agents active in this session, addressable via "));
  assert.ok(lits.some((t) => t.includes("—")), "escapes are decoded");
  const root = mkdtempSync(join(tmpdir(), "lit-"));
  mkdirSync(join(root, "work", "extracted"), { recursive: true });
  writeFileSync(join(root, "work", "extracted", "chunk-t.js"), js);
  writeFileSync(join(root, "work", "embedded-manifest.json"), JSON.stringify({ files: [{ name: "/$bunfs/root/chunk-t.js", file_offset: 5000 }] }));
  const lit = await buildLiteralIndex({ productId: "claude-code", sourceRoot: root, version: "9.9.9" });
  assert.deepEqual(lit.shelves, ["claude.exe 9.9.9"]);
  // A runtime line whose value differs meets the literal by its prefix; the offset is absolute.
  const hit = lookupKeys("Other agents active in this session, addressable via SendMessage({to: name}): main, a, b.").map((k) => lit.keys[k]).find(Boolean);
  assert.ok(hit && hit[2] > 5000);
  const json = JSON.stringify(lit);
  for (const k of Object.keys(lit.keys)) assert.match(k, /^[0-9a-f]{16}$/);
  for (const v of Object.values(lit.keys)) assert.ok(v.length === 3 && v.every(Number.isInteger));
  assert.ok(!/Other agents|teammates|model reads/.test(json), "no literal text is stored");
  assert.equal(await buildLiteralIndex({ productId: "claude-code", sourceRoot: join(root, "missing") }), null);
});

// A literal index built from files written under a temporary product root.
async function literalsFrom(productId, files) {
  const root = mkdtempSync(join(tmpdir(), "marks-"));
  for (const [rel, text] of Object.entries(files)) { mkdirSync(join(root, rel, ".."), { recursive: true }); writeFileSync(join(root, rel), text); }
  return buildLiteralIndex({ productId, sourceRoot: root, version: "9.9.9" });
}

test("short markers: a wrapper's head line meets a literal only whole (bug repro and near misses)", async () => {
  const lit = await literalsFrom("codex", {
    "outputs/codex-cli-prompts.json": JSON.stringify({ source: { tag: "rust-v9" } }),
    "work/codex-src-rust-v9/codex-rs/core/src/wrap.rs": [
      'fn a() -> String { if ok { "Script completed".to_string() } else { "Script failed to finish".to_string() } }',
      'fn b(s: f64) -> String { format!("Wall time: {s:.4} seconds\\nOutput:") }',
      'fn c(k: &str) -> String { format!("Message Type: {}\\nTask name: {}\\nPayload:\\n{}", k, t, p) }',
      'fn d(text: &str) -> bool { text.starts_with("<environment_context>") }',
      'pub const ENVIRONMENT_CONTEXT_OPEN_TAG: &str = "<environment_context>";',
      'const IMG: &str = r#"<image name="#;',
      'const WS: &str = "Use prior reviews as context, not binding precedent. ";',
      "#[cfg(test)]", "mod tests {", '    const X: &str = "<only_in_tests>";', "}",
    ].join("\n"),
  });
  const at = (t) => { const h = literalHit(lit, t); return h && `${h.key}:${h.pos}`; };
  const f = "codex-rs/core/src/wrap.rs";
  assert.equal(at("Script completed\nWall time 0.1 seconds\nOutput:\nok"), `${f}:1`);
  assert.equal(at("Wall time: 0.9315 seconds\nOutput:\nok"), `${f}:2`, "a format hole reads as a value");
  assert.equal(at("Message Type: MESSAGE\nTask name: /root\nSender: /root/a\nPayload:"), `${f}:3`, "a template's words plus exactly one value");
  assert.equal(at("<environment_context>\n<cwd>/x</cwd>\n</environment_context>"), `${f}:5`, "a named constant is the definition, ahead of code that checks for the text");
  assert.equal(at('<image name=[Image #1] path="/tmp/a.png">'), `${f}:6`, "an opening tag with its first attribute");
  assert.equal(at("Use prior reviews as context, not binding precedent. Follow the policy."), `${f}:7`, "a string left open for concat! matches by prefix");
  // Near misses: the same words inside longer text, more words after the head, the head not first, a test module.
  for (const t of ["Script completed successfully", "Wall time: 3 seconds left in the quiz", "Message Type: MESSAGE from the user today", "The run said: Script completed", "Notes\nScript completed", "Script", "<only_in_tests>", "<environment_contexts>"]) assert.equal(literalHit(lit, t), null, t);
  assert.deepEqual(markEntryKeys('<div class="x">'), [], "plain HTML tags are not markers");
  assert.ok(!/Script|Wall time|Message Type|environment_context/.test(JSON.stringify(lit)), "markers are hashes too");
});

test("rust strings: raw strings, escapes and line continuations; a char quote opens nothing", () => {
  const src = `let q = '"'; let r = r#"<tagged "quoted">"#; let s = "x \\\n    continued here"; let t = "tab\\there";`;
  assert.deepEqual([...rustLiterals(src)].map(([t]) => t), ['<tagged "quoted">', "x continued here", "tab here"]);
});

test("in a JS bundle only tags and multi-line heads are markers (its short strings are UI and code)", async () => {
  const js = 'var a="Copy link to clipboard";var b="## Your request:\\n"+x;var c=`<peer-note from="${id}">`;var d="<div>";';
  const lit = await literalsFrom("claude-code", { "work/extracted/chunk-m.js": js, "work/embedded-manifest.json": JSON.stringify({ files: [{ name: "/$bunfs/root/chunk-m.js", file_offset: 0 }] }) });
  assert.ok(literalHit(lit, "## Your request:\nabc"));
  assert.ok(literalHit(lit, '<peer-note from="agent-7">'));
  assert.equal(literalHit(lit, "Copy link to clipboard"), null);
  assert.equal(literalHit(lit, "<div>\nhello"), null);
});

test("records match by their opening line when all their lines are short or templated, never by a later example", () => {
  const text = "## Envelope\n\n~~~text\n<peer-note from=\"{{id}}\">\n{{body}}\n~~~\n\n## Pulse format\n\n~~~text\nRespond in this format.\n~~~\n\n```xml\n<pulse>\n<decision>NOTIFY</decision>\n</pulse>\n```\n\n## Proactive mode\n\n~~~text\nProactive multi-agent delegation is active for this whole session now.\n~~~\n";
  const recs = recordsFromMarkdown([{ slug: "p", text, ids: new Map() }]);
  const ix = { ...recs, lines: {}, pages: [] };
  const title = (t) => { const l = textLink(ix, t); return l.rec == null ? null : recs.records[l.rec].title; };
  assert.equal(title('<peer-note from="agent-7">'), "Envelope");
  assert.equal(title("<pulse>\n<automation_id>x</automation_id>"), null, "an example block later in a record is not its opening");
  assert.equal(title("<peer-notes>"), null, "another tag");
  assert.equal(title("<multi_mode>Proactive multi-agent delegation is active for this whole session now.\n</multi_mode>"), "Proactive mode", "a tag wrapped round the words on the same line");
  assert.ok(lookupKeys("<multi_mode>Proactive multi-agent delegation is active for this whole session now.").some((k) => literalEntryKeys("Proactive multi-agent delegation is active for this whole session now.").includes(k)));
});
