import assert from "node:assert/strict";
import test from "node:test";
import { AnchorError, extractAppPrompts } from "../lib/app-prompts.mjs";
import { canonicalCatalog, pythonJson } from "../lib/catalog.mjs";
import { modulesMarkdown } from "../lib/documents.mjs";
import { callExtracted, declaratorName, enclosingFunction, innermostLiteral, literalsOf } from "../lib/js-scan.mjs";
import { privacyScan } from "../lib/privacy.mjs";
import { lineDiff, renderDiffMarkdown, semanticDiff } from "../lib/semantic-diff.mjs";
import { catalogSnapshot, metadataDiff } from "../lib/catalog-metadata.mjs";

test("lexer separates regex literals, division and nested templates", () => {
  const src = "var a=/[`'\"]/g,b=`x${`y`}z`,c=4/2/1,d='q';";
  const literals = literalsOf(src).map(literal => src.slice(literal.start, literal.end));
  assert.deepEqual(literals, ["`x${`y`}z`", "`y`", "'q'"]);
});

test("enclosing function skips control blocks and resolves free identifiers", () => {
  const src = [
    "var B8=4e3,G8=`Make 0 tool calls.`;",
    "function $3(...e){return e.join(`|`)}",
    "var Pxt;function init(){Pxt=`lazy`}",
    "function Eie(e){if(e){}return $3(`Keep under ${B8} chars.`,G8,Pxt,e)}"
  ].join("");
  const fn = enclosingFunction(src, src.indexOf("Keep under"));
  assert.equal(fn.name, "Eie");
  const { text, resolved } = callExtracted(src, fn.source, ["<X>"], { label: "Eie" });
  assert.equal(text, "Keep under 4000 chars.|Make 0 tool calls.|lazy|<X>");
  assert.deepEqual(resolved.sort(), ["$3", "B8", "G8", "Pxt"]);
});

test("conflicting definitions of a free identifier fail instead of guessing", () => {
  const src = "var K=1;function f(){var K=2}function g(){return `v${K}`}";
  const fn = enclosingFunction(src, src.indexOf("return `v"));
  assert.throws(() => callExtracted(src, fn.source, [], { label: "g" }), /K has 2 conflicting definitions/);
});

test("declarator names are recovered through wrapper calls", () => {
  const src = "var a=1,oNn=$().refine(e=>e.trim().length>0).catch(`You are coordinating.`),KMn=`plan`;";
  const at = index => innermostLiteral(literalsOf(src), index);
  assert.equal(declaratorName(src, at(src.indexOf("You are"))), "oNn");
  assert.equal(declaratorName(src, at(src.indexOf("plan"))), "KMn");
});

test("a missing anchor is an AnchorError naming the prompt", () => {
  const emptyAsar = { findPhrase: () => [], textOf: () => "", fileSha256: () => "" };
  assert.throws(() => extractAppPrompts(emptyAsar), error => error instanceof AnchorError && /\[side-conversation-boundary\] anchor not found/.test(error.message));
});

test("comparison hashes use Python json.dumps(sort_keys, ensure_ascii=False)", () => {
  assert.equal(pythonJson({ b: 1, a: "é\n", c: [null, true] }), '{"a": "é\\n", "b": 1, "c": [null, true]}');
});

test("modules document shows GPT-6 variants inside the shared section", () => {
  const doc = modulesMarkdown([
    { slug: "gpt-6-astra", model_messages: { approvals: { x: "one" } } },
    { slug: "gpt-6-sol", model_messages: { approvals: { x: "two" }, auto_review: { y: "only" } } },
    { slug: "gpt-6-luna", model_messages: { approvals: { x: "one" } } }
  ]);
  assert.equal(doc, [
    "## approvals.x\n\none\n\n### gpt-6-sol variant\n\ntwo\n",
    "## auto_review.y\n\nNot present in gpt-6-astra.\n\n### gpt-6-sol variant\n\nonly\n\n### Not present in gpt-6-luna\n"
  ].join("\n---\n\n"));
});

test("semantic diff ignores provenance churn and reports prompt edits", () => {
  const doc = (version, offset, line) =>
    `# Codex voice prompt inventory\n\nSource: ChatGPT desktop ${version}, \`app.asar\`.\n\n# Voice memory summary\n\nSource identifier: \`YMn\` · asset offsets ${offset}\n\nKeep silent.\n${line}\n\n---\n`;
  const before = new Map([["voice-prompts.md", doc("26.917.1", "1–2", "Do not greet.")]]);
  const churn = new Map([["voice-prompts.md", doc("26.999.9", "7–9", "Do not greet.")]]);
  const edit = new Map([["voice-prompts.md", doc("26.917.1", "1–2", "Greet warmly.")]]);
  assert.deepEqual(semanticDiff(before, churn).map(d => [d.status, d.bytesChanged]), [["unchanged", true]]);
  const [changed] = semanticDiff(before, edit);
  assert.equal(changed.status, "changed");
  assert.equal(changed.changes[0].key, "Voice memory summary");
  assert.deepEqual(lineDiff(changed.changes[0].before, changed.changes[0].after), ["  Keep silent.", "- Do not greet.", "+ Greet warmly."]);
});

test("CLI prompt pages diff per area and prompt, ignoring provenance and headings inside prompts", () => {
  const page = (tag, sha, rule) => [
    "# Codex CLI prompts", "", `Source: openai/codex \`${tag}\`.`, "", "Prompt templates compiled into the CLI.", "",
    "## Auto-review (guardian)", "",
    "### Policy template", "", `Source: \`codex-rs/prompts/templates/guardian/policy_template.md\`, SHA-256 \`${sha}\`.`, "",
    "```text", "# Security Policy", rule, "```", "",
    "### Policy", "", "Source: `codex-rs/prompts/templates/guardian/policy.md`.", "", "```text", "Be careful.", "```", ""
  ].join("\n");
  for (const name of ["codex-cli-prompts.md", "codex-cli-bundled-skills.md", "desktop-model-facing-text.md"]) {
    const before = new Map([[name, page("rust-v0.155.0", "aaa", "Deny by default.")]]);
    assert.deepEqual(semanticDiff(before, new Map([[name, page("rust-v0.158.0", "bbb", "Deny by default.")]])).map(d => d.status), ["unchanged"]);
    const [changed] = semanticDiff(before, new Map([[name, page("rust-v0.155.0", "aaa", "{{ extra_policy }}")]]));
    assert.equal(changed.status, "changed");
    assert.deepEqual(changed.changes.map(c => c.key), ["Auto-review (guardian) › Policy template"]);
  }
});

test("privacy scan refuses paths, e-mail, tokens and the account identity", () => {
  const scan = (text, identity) => () => privacyScan(new Map([["x.md", text]]), { identity });
  assert.doesNotThrow(scan("Treat {{ user_first_name }} as the user's name."));
  assert.throws(scan("see /Users/someone/.codex"), /local user path/);
  assert.throws(scan("see /home/alice/notes"), /local user path/);
  assert.doesNotThrow(scan("Files shared with the cloud browser live in /home/oai/share."));
  assert.throws(scan("read ~/.codex/config.toml"), /Codex config path/);
  assert.throws(scan("copy .codex/auth.json"), /Codex config path/);
  assert.doesNotThrow(scan("Edit the project's .codex/config.toml file."));
  assert.throws(scan("mail me at person@example.com"), /e-mail address/);
  assert.throws(scan('{"access_token": "x"}'), /auth field/);
  assert.throws(scan("hash 10b5ffb0abcdef", "10b5ffb0abcdef"), /account identity/);
});

test("catalog fingerprint ignores fetch and account keys and key order", () => {
  const a = { models: [{ slug: "m", b: 1, a: { etag: "x", text: "t" } }], fetched_at: "1", identity: "abc", account_id: "u" };
  const b = { fetched_at: "2", models: [{ a: { text: "t", etag: "y" }, b: 1, slug: "m" }], identity: "def" };
  assert.equal(canonicalCatalog(a), canonicalCatalog(b));
  assert.equal(canonicalCatalog(a), '{"models":[{"a":{"text":"t"},"b":1,"slug":"m"}]}');
  assert.notEqual(canonicalCatalog(a), canonicalCatalog({ models: [{ slug: "m", b: 2, a: { text: "t" } }] }));
});

test("the diff summary is empty when nothing changed semantically", () => {
  const sources = { app: { version: "2", build: "2" }, cli: { version: "c" }, catalog: { fetched_at: "t2", models: ["m"] } };
  const previousSources = { app: { version: "1", build: "1" }, cli: { version: "c" }, catalog: { fetched_at: "t1", models: ["m"] } };
  const unchanged = [{ name: "voice-prompts.md", status: "unchanged", bytesChanged: true, changes: [] }];
  assert.equal(renderDiffMarkdown({ previousSources, sources, documents: unchanged, notes: [] }), "");
  const added = renderDiffMarkdown({ previousSources, sources: { ...sources, catalog: { ...sources.catalog, models: ["m", "n"] } }, documents: unchanged, notes: [] });
  assert.match(added, /Models added to the live catalog: `n`/);
});

test("catalog settings: public values, private names only, unknown fields private, prompts and account keys ignored", () => {
  const model = over => ({ slug: "gpt-6-astra", base_instructions: "A", model_messages: { x: "B" }, context_window: 400000,
    upgrade: { account_id: "acct-1", message: "Try Pro" }, visibility: "list", ...over });
  const before = catalogSnapshot([model({})]);
  assert.deepEqual(Object.keys(before["gpt-6-astra"]), ["context_window", "upgrade", "visibility"]);
  assert.ok(!JSON.stringify(before).includes("acct-1"));
  const after = catalogSnapshot([model({ base_instructions: "changed", context_window: 1000000,
    upgrade: { account_id: "acct-2", message: "Try Max" }, brand_new_field: 1 })]);
  const diff = metadataDiff(before, after);
  assert.deepEqual(diff.public, [{ slug: "gpt-6-astra", field: "context_window", before: "400000", after: "1000000" }]);
  assert.deepEqual(diff.private, [{ slug: "gpt-6-astra", field: "brand_new_field" }, { slug: "gpt-6-astra", field: "upgrade" }]);
  assert.deepEqual(metadataDiff(before, catalogSnapshot([model({ upgrade: { account_id: "acct-9", message: "Try Pro" } })])), { public: [], private: [] });

  const sources = { app: {}, cli: {}, catalog: { models: ["gpt-6-astra"], fetched_at: "t" } };
  const text = renderDiffMarkdown({ previousSources: sources, sources, documents: [], notes: [], settings: diff.public });
  assert.match(text, /## Model settings\n\n- `gpt-6-astra` `context_window`: `400000` → `1000000`/);
  assert.equal(renderDiffMarkdown({ previousSources: sources, sources, documents: [], notes: [], settings: [] }), "");
});

test("prompt sweep: locale tables, translator notes and code are not candidates; tool descriptions are named", async () => {
  const { isLocaleBundle, literalRole, looksLikeProse } = await import("../lib/prompt-candidates.mjs");
  for (const file of ["webview/assets/fr-CA-cf4e006eaee6.js", "webview/assets/tl-8a7531633cea.js", "webview/assets/zh-Hant-TW-0123456789ab.js"]) assert.ok(isLocaleBundle(file), file);
  for (const file of ["webview/assets/app-shared-588591d226f4.js", "webview/assets/shell-94a875ac3035.js", ".vite/build/main-BefHSPFJ.js"]) assert.ok(!isLocaleBundle(file), file);

  const prose = "You are a careful assistant. Read the whole request before acting and do not guess missing details. Ask one short question when something is unclear, then continue with the task. Keep the answer brief and name every file you changed.";
  assert.ok(looksLikeProse(prose));
  assert.ok(!looksLikeProse("const a = { b: 1 }; function c() { return a.b; } ".repeat(8)));
  assert.ok(!looksLikeProse("Too short to matter."));

  const note = `m={id:\`x.label\`,defaultMessage:\`Add sticker\`,description:\`${prose}\`}`;
  const tool = `t={name:\`create_worktree\`,description:\`${prose}\`}`;
  const { literalsOf } = await import("../lib/js-scan.mjs");
  const roleOfLast = src => { const { outer } = literalsOf(src); return literalRole(src, outer, outer.length - 1); };
  assert.deepEqual(roleOfLast(note), { kind: "translator-note" });
  assert.deepEqual(roleOfLast(tool), { kind: "tool-description", tool: "create_worktree" });
  assert.deepEqual(roleOfLast(`p={developerInstructions:\`${prose}\`}`), { kind: "developerInstructions" });
});
