// The numbers a user sees must add up. For every request of every agent:
//   - the strata sum to the exact context;
//   - the rows listed under a stratum (block parts on the request's scale, plus any harness the log
//     doesn't carry) sum to that stratum's total;
//   - the user's own share of a stratum is the sum of its own rows, and never more than the stratum.
// Runs over the synthetic fixtures, plus any real sessions named in TRACE_REAL_SESSIONS
// (paths separated by ":"; a directory is walked), which stay on the machine that runs the test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { KINDS, stratumRows } from "../model.js";
import { CODEX_T0, uuid7, rows, msg, usage } from "./fixtures/make.mjs";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));

function checkTrace(trace, name) {
  let checked = 0;
  for (const a of trace.agents) for (const r of a.requests) {
    if (!r.strata || !r.window) continue;
    const where = `${name} ${a.id} request ${r.i + 1}`;
    assert.equal(KINDS.reduce((s, k) => s + r.strata[k], 0), r.tokens.context, `${where}: strata sum to the context`);
    for (const k of KINDS) {
      const { rows: list, unlogged } = stratumRows(a, r, k);
      const shown = list.reduce((s, x) => s + x.tok, 0) + unlogged;
      assert.ok(Math.abs(shown - r.strata[k]) < 0.5 + 1e-6 * r.strata[k], `${where} ${k}: rows ${shown} vs stratum ${r.strata[k]}`);
      const own = list.filter((x) => x.b.own && !x.wrapper).reduce((s, x) => s + x.tok, 0);
      const ownShown = r.own?.[k] || 0;
      assert.ok(Math.abs(own - ownShown) <= 1, `${where} ${k}: own rows ${own} vs own ${ownShown}`);
      assert.ok(ownShown <= r.strata[k], `${where} ${k}: own within stratum`);
    }
    checked++;
  }
  return checked;
}

test("strata invariant: fixtures", async () => {
  for (const sub of ["codex", "claude"]) {
    const { trace } = await loadTrace(await entriesFor([FIX + sub]));
    assert.ok(checkTrace(trace, sub) > 3, sub);
  }
});

// A block holding the user's setup is split where the log marks their text: the Codex memory summary
// stays under You, the memory prompt around it is Harness, and the Harness list shows that wrapper row.
test("strata invariant: own blocks split into the user's text and the product's wording", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trace-split-"));
  const id = uuid7(CODEX_T0, 6);
  mkdirSync(join(dir, "2026/01/01"), { recursive: true });
  const MEM = "## Memory\nYou have access to a memory folder with guidance from prior runs. Use it when it helps.\n========= MEMORY_SUMMARY BEGINS =========\n- prefers uv over pip — naïve ☃\n- dislikes emojis\n========= MEMORY_SUMMARY ENDS =========\nWhen memory is relevant, start with the quick pass.";
  writeFileSync(join(dir, `2026/01/01/rollout-2026-01-01T00-00-00-${id}.jsonl`), rows([
    { type: "session_meta", payload: { id, session_id: id, cwd: "/tmp/p", cli_version: "0.1.0", source: "vscode", thread_source: "user", base_instructions: { text: "You are a test agent." } } },
    { type: "event_msg", payload: { type: "task_started", model_context_window: 100000 } },
    msg("developer", [MEM], ["memories.instructions"]),
    msg("user", ["# AGENTS.md instructions for /tmp/p\n\n<INSTRUCTIONS>\nBe careful.\n</INSTRUCTIONS>"], ["agents_md.instructions"]),
    msg("user", ["hello"], ["user.text"]),
    usage("r1", 3000, 0),
  ], CODEX_T0));
  const { trace } = await loadTrace(await entriesFor([dir]));
  const a = trace.agents[0];
  const mem = a.blocks.find((b) => b.label === "memories");
  const summary = "- prefers uv over pip — naïve ☃\n- dislikes emojis";
  assert.equal(mem.kind, "you");
  assert.equal(mem.ownEst, Math.round(mem.est * summary.length / MEM.length));
  assert.equal(mem.harnessEst, mem.est - mem.ownEst);
  const agents = a.blocks.find((b) => b.label === "AGENTS.md");
  assert.equal(agents.ownEst, Math.round(agents.est * "Be careful.".length / agents.chars));
  const harnessRows = stratumRows(a, a.requests[0], "harness").rows;
  assert.ok(harnessRows.some((x) => x.b === mem && x.wrapper), "the memory prompt is listed under Harness");
  assert.ok(stratumRows(a, a.requests[0], "you").rows.some((x) => x.b === mem && !x.wrapper), "the summary is listed under You");
  checkTrace(trace, "split");
});

// Claude Code without a logged system prompt or an indexed version: the harness is the first
// request's remainder, held for the session, so later estimation misses don't pile into Harness.
test("strata invariant: an unlogged Claude Code harness is sized once and held", async () => {
  const dir = mkdtempSync(join(tmpdir(), "trace-residual-"));
  const sid = "44444444-4444-4444-8444-444444444444";
  const t0 = Date.parse("2026-01-05T00:00:00Z");
  let n = 0;
  const base = (sec) => ({ sessionId: sid, uuid: `x${++n}`, parentUuid: null, timestamp: new Date(t0 + sec * 1000).toISOString(), version: "0.0.1", isSidechain: false });
  const asst = (sec, rid, ctx) => ({ ...base(sec), type: "assistant", requestId: rid, message: { id: "m" + rid, model: "claude-test", role: "assistant", content: [{ type: "text", text: "ok" }], usage: { input_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: ctx - 10, output_tokens: 5 } } });
  const lines = [
    { ...base(1), type: "user", message: { role: "user", content: "hi" } },
    asst(2, "r1", 20000),
    { ...base(3), type: "user", message: { role: "user", content: [{ type: "tool_result", tool_use_id: "t1", content: "x".repeat(40000) }] } },
    asst(4, "r2", 60000),
  ];
  writeFileSync(join(dir, `${sid}.jsonl`), lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  const { trace } = await loadTrace(await entriesFor([dir]));
  const a = trace.agents[0];
  assert.equal(a.harnessSource, "residual");
  assert.ok(a.harnessEst > 19000 && a.harnessEst < 20000, `harnessEst ${a.harnessEst}`);
  const [r1, r2] = a.requests;
  // The second request's 40k characters of tool output are ~10k by estimate but the context grew 40k:
  // the miss is spread over every stratum, not dumped into Harness.
  assert.ok(r2.strata.harness < 2 * r1.strata.harness, `harness ${r1.strata.harness} → ${r2.strata.harness}`);
  assert.ok(Math.abs(r2.strata.harness / r2.scale.harness - a.harnessEst) < 1);
  checkTrace(trace, "residual");
});

test("strata invariant: real sessions (TRACE_REAL_SESSIONS)", { skip: !process.env.TRACE_REAL_SESSIONS }, async () => {
  for (const set of process.env.TRACE_REAL_SESSIONS.split(";")) {
    const { trace } = await loadTrace(await entriesFor(set.split(":").filter(Boolean)));
    const n = checkTrace(trace, set.split(":")[0].split("/").pop());
    assert.ok(n > 0);
  }
});
