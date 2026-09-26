import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fnv1a64, lineHash, textLineHashes, siteForText, prepareIndex, KINDS } from "../model.js";
import { loadTrace } from "../loader.js";
import { entriesFor } from "../dump.mjs";
import { CC, CODEX } from "./fixtures/make.mjs";

const FIX = fileURLToPath(new URL("./fixtures/", import.meta.url));
const enc = new TextEncoder();

function fnvBig(bytes) {
  let h = 0xcbf29ce484222325n;
  for (const b of bytes) h = ((h ^ BigInt(b)) * 0x100000001b3n) & 0xffffffffffffffffn;
  return h.toString(16).padStart(16, "0");
}

// A reference index built the way the site build does: one page per text.
function makeIndex(pages, extra = {}) {
  const lines = {};
  pages.forEach((p, i) => { for (const h of textLineHashes(p.text)) lines[h] = i; });
  return { site: "test", origin: "https://example.test", pages: pages.map(({ slug, title }) => ({ slug, title })), lines, harness: {}, reminders: {}, ...extra };
}

test("fnv1a64 matches the published vectors and a BigInt reference", () => {
  assert.equal(fnv1a64(enc.encode("")), "cbf29ce484222325");
  assert.equal(fnv1a64(enc.encode("a")), "af63dc4c8601ec8c");
  assert.equal(fnv1a64(enc.encode("foobar")), "85944171f73967e8");
  const samples = ["You are Codex, an agent based on GPT-6.", "café — 日本語 🎉 ünïcödé", "\u0000ÿ￿", "x".repeat(1000)];
  let seed = 7;
  for (let n = 0; n < 200; n++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    samples.push(Array.from({ length: seed % 90 }, (_, i) => String.fromCodePoint(32 + ((seed >>> (i % 24)) * (i + 1)) % 0x2fff)).join(""));
  }
  for (const s of samples) assert.equal(fnv1a64(enc.encode(s)), fnvBig(enc.encode(s)), JSON.stringify(s.slice(0, 20)));
});

test("lineHash squashes whitespace; only lines of 25+ normalized characters are indexed", () => {
  assert.equal(lineHash("  alpha \t beta  gamma  "), lineHash("alpha beta gamma"));
  assert.equal(lineHash("a"), "af63dc4c8601ec8c");
  const hs = textLineHashes("short line\n  this line is long enough to count  \n\n  x   y  \nanother line that is long enough, ✓");
  assert.deepEqual(hs, [lineHash("this line is long enough to count"), lineHash("another line that is long enough, ✓")]);
});

test("siteForText picks the page with most matching lines, needing 2 (or all when fewer)", () => {
  const ix = prepareIndex(makeIndex([
    { slug: "a", title: "A", text: "first shared line of page A\nsecond shared line of page A\nthird line only on page A ok" },
    // A line on two pages hashes to one of them (the later page, in this builder).
    { slug: "b", title: "B", text: "second shared line of page A\nsingle long line on page B here" },
  ]));
  assert.deepEqual(siteForText(ix, "first shared line of page A\nthird line only on page A ok\nunrelated but long enough line"), { slug: "a", title: "A", matched: 2, lines: 3 });
  assert.equal(siteForText(ix, "third line only on page A ok\nunrelated but long enough line"), null);
  assert.deepEqual(siteForText(ix, "tiny\nsingle long line on page B here"), { slug: "b", title: "B", matched: 1, lines: 1 });
  assert.equal(siteForText(ix, "no indexed lines"), null);
  assert.equal(siteForText(null, "anything at all that is long"), null);
});

test("codex: harness and injected blocks link to the page holding their lines; carried copies keep the link", async () => {
  const index = makeIndex([
    { slug: "base", title: "Base instructions", text: "You are a test agent. Ünïcödé ✓" },
    { slug: "perm", title: "Permissions", text: "<permissions instructions>\nsandbox is workspace-write" },
  ]);
  const { trace } = await loadTrace(await entriesFor([FIX + "codex"]), { index });
  const root = trace.agents[0];
  assert.deepEqual(trace.reference, { site: "test", origin: "https://example.test", pages: 2 });
  const base = root.blocks.filter((b) => b.label === "base instructions");
  assert.equal(base.length, 2);
  for (const b of base) assert.deepEqual(b.site, { slug: "base", title: "Base instructions", matched: 1, lines: 1 });
  const perm = root.blocks.find((b) => b.label === "developer: permissions.instructions");
  assert.deepEqual(perm.site, { slug: "perm", title: "Permissions", matched: 2, lines: 3 });
  assert.equal(root.blocks.find((b) => b.kind === "you").site, null);
  assert.equal(root.blocks.find((b) => b.kind === "outside").site, null);
  const { trace: bare } = await loadTrace(await entriesFor([FIX + "codex"]));
  assert.equal(bare.reference, null);
  assert.ok(bare.agents[0].blocks.every((b) => b.site === null));
});

test("claude-code: reminder types map to their page; structured rows are marked rebuilt", async () => {
  const index = makeIndex([], { reminders: { date: { slug: "reminders", anchor: "date", title: "Date" }, mystery_type: { slug: "reminders", anchor: "mystery", title: "Mystery" } } });
  const { trace } = await loadTrace(await entriesFor([FIX + "claude"]), { index });
  const root = trace.agents[0];
  const date = root.blocks.find((b) => b.label === "date");
  assert.deepEqual([date.site, date.render, date.rebuilt], [{ slug: "reminders", anchor: "date", title: "Date" }, "literal", undefined]);
  const mys = root.blocks.find((b) => b.label === "mystery_type");
  assert.deepEqual([mys.site.anchor, mys.render, mys.rebuilt], ["mystery", "structured", true]);
});

test("claude-code: with no logged harness, index size for the version is used (inferred), else the residual default", async () => {
  const path = `${FIX}claude/-tmp-proj/${CC.session}.jsonl`;
  const text = readFileSync(path, "utf8").split("\n").filter((l) => !l.includes('"prompt_snapshot"')).join("\n");
  const bytes = enc.encode(text);
  const entries = () => [{ path: `p/${CC.session}.jsonl`, source: { name: "mem", size: bytes.length, async slice(a, b) { return bytes.slice(a, b); } } }];
  const withIx = (await loadTrace(entries(), { index: makeIndex([], { harness: { "9.9.9": { systemChars: 4000, toolsChars: 8000 } } }) })).trace.agents[0];
  assert.deepEqual([withIx.harnessSource, withIx.harnessEst], ["inferred", 3000]);
  const noIx = (await loadTrace(entries())).trace.agents[0];
  assert.equal(noIx.harnessSource, "residual");
  for (const a of [withIx, noIx]) for (const r of a.requests) {
    assert.equal(KINDS.reduce((s, k) => s + r.strata[k], 0), r.tokens.context);
    assert.ok(r.strata.harness > 0);
  }
  assert.notDeepEqual(withIx.requests[0].strata, noIx.requests[0].strata);
});

test("worker: index message before load links blocks", async () => {
  const posted = [];
  globalThis.self = { postMessage: (m) => posted.push(m) };
  await import("../worker.js?index-test");
  const index = makeIndex([{ slug: "base", title: "Base", text: "You are a test agent. Ünïcödé ✓" }]);
  await self.onmessage({ data: { type: "index", index } });
  assert.deepEqual(posted.pop(), { type: "index", ok: true, pages: 1 });
  const rel = `codex/2026/01/01/rollout-2026-01-01T00-00-00-${CODEX.root}.jsonl`;
  await self.onmessage({ data: { type: "load", files: [{ path: rel, file: new File([readFileSync(FIX + rel)], "r.jsonl") }] } });
  const tr = posted.find((m) => m.type === "trace");
  assert.equal(tr.trace.agents[0].blocks[0].site.slug, "base");
  delete globalThis.self;
});
