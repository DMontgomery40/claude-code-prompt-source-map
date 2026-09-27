import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildPages } from "../chatgpt-prompts.mjs";
import { chatgptPages } from "../chatgpt-prompts-spec.mjs";
import {
  AnchorError,
  extractArrayJoin,
  extractConcatenation,
  extractFormatjsMessage,
  extractFunctionText,
  extractTemplateLiteral
} from "../lib/app-prompts.mjs";
import { openAsar } from "../lib/asar.mjs";
import { innermostLiteral, literalsOf } from "../lib/js-scan.mjs";
import { literalText } from "../lib/prompt-candidates.mjs";

const script = path.join(import.meta.dirname, "..", "chatgpt-prompts.mjs");
const tmp = prefix => fs.mkdtempSync(path.join(os.tmpdir(), prefix));

// A minimal asar: pickled JSON header, then the file bytes.
function asarBytes(files) {
  const tree = {};
  const blobs = [];
  let offset = 0;
  for (const [file, content] of Object.entries(files)) {
    const bytes = Buffer.from(content, "utf8");
    let node = tree;
    for (const dir of file.split("/").slice(0, -1)) node = (node[dir] ??= { files: {} }).files;
    node[path.basename(file)] = { size: bytes.length, offset: String(offset) };
    offset += bytes.length;
    blobs.push(bytes);
  }
  const json = Buffer.from(JSON.stringify({ files: tree }), "utf8");
  const aligned = Math.ceil(json.length / 4) * 4;
  const head = Buffer.alloc(16 + aligned);
  head.writeUInt32LE(4, 0);
  head.writeUInt32LE(8 + aligned, 4);
  head.writeUInt32LE(4 + aligned, 8);
  head.writeUInt32LE(json.length, 12);
  json.copy(head, 16);
  return Buffer.concat([head, ...blobs]);
}

function fakeAsar(files) {
  const file = path.join(tmp("chatgpt-asar-"), "app.asar");
  fs.writeFileSync(file, asarBytes(files));
  return openAsar(file);
}

const one = source => fakeAsar({ "webview/assets/chunk-0123456789ab.js": source });
const sha = text => crypto.createHash("sha256").update(text).digest("hex");

test("static and template literals: exact without substitutions, assembled with <…> like literalText", () => {
  const source = "var a=`Plain anchor sentence for the model.`,b=`Before ${x.y} the template anchor ${`nested`} after.`;";
  const asar = one(source);
  const plain = extractTemplateLiteral(asar, { id: "plain", anchor: "Plain anchor sentence" });
  assert.equal(plain.text, "Plain anchor sentence for the model.");
  assert.equal(plain.label, "exact");
  assert.equal(plain.sha256, sha(plain.text));
  const templ = extractTemplateLiteral(asar, { id: "templ", anchor: "the template anchor" });
  assert.equal(templ.text, "Before <…> the template anchor <…> after.");
  assert.equal(templ.label, "assembled");
  const literal = innermostLiteral(literalsOf(source), source.indexOf("the template anchor"));
  assert.equal(templ.text, literalText(source, literal));
});

test("formatjs: defaultMessage with id and translator note; ids asserted", () => {
  const asar = one([
    "a=f({id:`chat.kickoff`,defaultMessage:`Write the kickoff message now.`,description:`Hidden user message sent to ChatGPT.`});",
    "b={description:`Note first.`,defaultMessage:`Track a loan manually please.`};",
    "c={label:`Track a vehicle`};"
  ].join(""));
  const kickoff = extractFormatjsMessage(asar, { id: "k", anchor: "Write the kickoff", messageId: "chat.kickoff" });
  assert.equal(kickoff.text, "Write the kickoff message now.");
  assert.equal(kickoff.messageId, "chat.kickoff");
  assert.equal(kickoff.note, "Hidden user message sent to ChatGPT.");
  assert.equal(extractFormatjsMessage(asar, { id: "k2", anchor: "Write the kickoff", messageId: ["other", "chat.kickoff"] }).messageId, "chat.kickoff");
  assert.throws(() => extractFormatjsMessage(asar, { id: "k3", anchor: "Write the kickoff", messageId: "chat.renamed" }), /message id .* is chat\.kickoff, expected chat\.renamed/);
  const loan = extractFormatjsMessage(asar, { id: "loan", anchor: "Track a loan manually" });
  assert.equal(loan.messageId, null);
  assert.equal(loan.note, "Note first.");
  assert.throws(() => extractFormatjsMessage(asar, { id: "v", anchor: "Track a vehicle" }), /is not a defaultMessage/);
});

test("concat: head + value + tail with placeholders; the anchor must be the head", () => {
  const asar = one("function cr(e,t,n){return n?`Ask about the selected record: `+JSON.stringify(n)+`. Use it.`+t?.name+`!`:`none`}var z=`pre `+`Late anchor head`;");
  const item = extractConcatenation(asar, { id: "h", anchor: "Ask about the selected record" });
  assert.equal(item.text, "Ask about the selected record: <…>. Use it.<…>!");
  assert.equal(item.label, "assembled");
  assert.throws(() => extractConcatenation(asar, { id: "late", anchor: "Late anchor head" }), /not the head of the concatenation/);
  assert.throws(() => extractConcatenation(one("var q=`Lonely anchor text`;"), { id: "q", anchor: "Lonely anchor" }), /no longer concatenated/);
});

test("array-join: the separator comes from the join call; runtime elements are <…>", () => {
  const asar = one("var u=`{{ url }}`,r={ok:[`Chose to hand off:`,`- line two`,`- link [here](${u})`,v].join(`\n`)},s=[`Unjoined anchor`,`x`];");
  const item = extractArrayJoin(asar, { id: "ok", anchor: "Chose to hand off:" });
  assert.equal(item.text, "Chose to hand off:\n- line two\n- link [here](<…>)\n<…>");
  assert.throws(() => extractArrayJoin(asar, { id: "s", anchor: "Unjoined anchor" }), /is not joined/);
});

test("function mode: evaluated with placeholder arguments and labelled assembled", () => {
  const asar = one("function _n(e){return`Current set of fields:\\n\\n${JSON.stringify({name:e.name},null,2)}\\n\\n${e.pic?`Has a picture.`:`No picture.`}`}");
  const spec = { id: "f", anchor: "Current set of fields", field: name => `${name}(gpt)`, args: [{ name: "<NAME>", pic: null }] };
  const item = extractFunctionText(asar, spec);
  assert.equal(item.text, "Current set of fields:\n\n{\n  \"name\": \"<NAME>\"\n}\n\nNo picture.");
  assert.equal(item.label, "assembled");
  assert.equal(item.field, "_n(gpt)");
});

test("duplicates: identical literals are accepted, different texts are not", () => {
  const same = fakeAsar({ "webview/assets/a-0123456789ab.js": "x=`Same shipped twice.`", "webview/assets/b-0123456789ab.js": "y=`Same shipped twice.`" });
  assert.equal(extractTemplateLiteral(same, { id: "d", anchor: "Same shipped" }).occurrences, 2);
  const differ = one("x=`Anchor phrase here.`;y=`Anchor phrase here, longer.`");
  assert.throws(() => extractTemplateLiteral(differ, { id: "d2", anchor: "Anchor phrase here" }), AnchorError);
});

test("buildPages: a missing anchor, identical branches and a privacy hit never throw", () => {
  const asar = one([
    "a={id:`m.one`,defaultMessage:`Found message text.`,description:`Sent to ChatGPT.`};",
    "b=`Branch text one.`;c=`Branch text one.`;",
    "d=`Leaky text for someone@example.com here.`;",
    "e={id:`m.renamed`,defaultMessage:`Renamed message text.`};",
    "f={role:`system`,parts:[`Hidden builder text.`]};g=`Unbacked claim text.`;"
  ].join(""));
  const pages = [{
    page: "test-page.md",
    title: "Test page",
    summary: "Summary.",
    entries: [
      { group: "Found", id: "found", mode: "formatjs", title: "Found", anchor: "Found message", messageId: "m.one" },
      { group: "Found", id: "gone", mode: "static", title: "Gone", anchor: "Removed in this build" },
      { group: "Branches", id: "b1", mode: "static", title: "B1", anchor: "Branch text" },
      { group: "Branches", id: "b2", mode: "static", title: "B2", anchor: "Branch text" },
      { group: "Leak", id: "leak", mode: "static", title: "Leak", anchor: "Leaky text" },
      { group: "Found", id: "renamed", mode: "formatjs", title: "Renamed", anchor: "Renamed message", messageId: "m.old" },
      { group: "Claims", id: "backed", mode: "static", title: "Backed", anchor: "Hidden builder", use: "Sent as a system message.", context: ["role:`system`"] },
      { group: "Claims", id: "unbacked", mode: "static", title: "Unbacked", anchor: "Unbacked claim", fallback: "Remote default.", use: "Sent hidden.", context: ["is_visually_hidden_from_conversation"] }
    ]
  }];
  const context = { version: "1.0", build: "1", asarSha256: "0".repeat(64), youAreChatgpt: 0 };
  const { docs, coverage, summary } = buildPages(asar, context, pages, [["b1", "b2"]]);
  const doc = docs.get("test-page.md");
  assert.match(doc, /^# Test page\n\nSource: /);
  assert.match(doc, /occurs in none of the app's scripts/);
  assert.match(doc, /### Found\n\nSource: `webview\/assets\/chunk-0123456789ab\.js`, offset \d+, SHA-256 `[0-9a-f]{64}`\.\n\nExact text from the bundle\. Message id `m\.one`\.\n\nTranslator note: Sent to ChatGPT\.\n\n```text\nFound message text\.\n```/);
  assert.match(doc, /## Not found in this build\n\n.*\n\n- `gone` \(Gone\), anchor `Removed in this build`: anchor not found/);
  assert.match(doc, /- `b1` \(B1\).*identical text/);
  assert.doesNotMatch(doc, /example\.com/);
  const renamed = doc.split("\n").find(line => line.startsWith("- `renamed`"));
  assert.match(renamed, /message id in a bundle file is m\.renamed, expected m\.old$/);
  assert.match(doc, /### Backed\n\nSource: [^\n]+\n\nExact text from the bundle\. Sent as a system message\.\n/);
  assert.match(doc, /### Unbacked\n\nSource: [^\n]+\n\nExact text from the bundle\.\n/);
  assert.doesNotMatch(doc, /Remote default|Sent hidden/);
  assert.deepEqual(summary.context_unconfirmed, ["unbacked"]);
  assert.deepEqual(summary.not_found.sort(), ["b1", "b2", "gone", "renamed"]);
  assert.deepEqual(summary.withheld.map(w => w.id), ["leak"]);
  const cover = JSON.parse(coverage.get("test-page.json"));
  assert.deepEqual(cover.items.map(i => [i.id, i.sha256]), [["found", sha("Found message text.")], ["backed", sha("Hidden builder text.")], ["unbacked", sha("Unbacked claim text.")]]);
  assert.match(cover.not_found.find(n => n.id === "renamed").reason, /webview\/assets\/chunk-0123456789ab\.js/);
  assert.equal(cover.items[0].source_file, "webview/assets/chunk-0123456789ab.js");
});

const plist = entries => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>${Object.entries(entries).map(([k, v]) => `<key>${k}</key><string>${v}</string>`).join("")}</dict></plist>
`;

test("CLI: a changed app exits 0 with every entry not found; a missing app exits 2", () => {
  const app = path.join(tmp("chatgpt-app-"), "ChatGPT.app");
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(app, rel)), { recursive: true });
    fs.writeFileSync(path.join(app, rel), content);
  };
  write("Contents/Info.plist", plist({ CFBundleExecutable: "ChatGPT", CFBundleShortVersionString: "9.9", CFBundleVersion: "99" }));
  write("Contents/Resources/app.asar", asarBytes({ "webview/assets/empty-0123456789ab.js": "var a=`Nothing here.`;" }));
  write("Contents/Resources/codex-cli/codex-package.json", JSON.stringify({ layoutVersion: 1, entrypoint: "bin/codex" }));
  write("Contents/Resources/codex-cli/bin/codex", "#!/bin/sh\nexec \"$bin_dir/../CodexCLI.app/Contents/MacOS/codex\" \"$@\"\n");
  write("Contents/Resources/codex-cli/CodexCLI.app/Contents/Info.plist", plist({ CFBundleExecutable: "codex" }));
  write("Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex", "");
  const root = tmp("chatgpt-root-");
  const run = spawnSync(process.execPath, [script], { encoding: "utf8", env: { ...process.env, CODEX_APP_PATH: app, CHATGPT_PROMPTS_ROOT: root } });
  assert.equal(run.status, 0, run.stderr);
  const summary = JSON.parse(run.stdout.trim().split("\n").at(-1));
  assert.equal(summary.published, 0);
  assert.equal(summary.not_found.length, chatgptPages.flatMap(page => page.entries).length);
  for (const page of chatgptPages) {
    const doc = fs.readFileSync(path.join(root, "outputs", page.page), "utf8");
    assert.match(doc, /Codex\/ChatGPT desktop app 9\.9 \(build 99\)/);
    assert.match(doc, /## Not found in this build/);
    assert.ok(fs.existsSync(path.join(root, "outputs", page.page.replace(/\.md$/, ".json"))));
  }
  const missing = spawnSync(process.execPath, [script], { encoding: "utf8", env: { ...process.env, CODEX_APP_PATH: path.join(tmp("none-"), "ChatGPT.app"), CHATGPT_PROMPTS_ROOT: root } });
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /cannot read the app/);
});

const installed = "/Applications/ChatGPT.app/Contents/Resources/app.asar";
test("installed app: every page renders with a Source line under each entry", { skip: !fs.existsSync(installed) && "ChatGPT.app not installed" }, () => {
  const asar = openAsar(installed);
  const { docs } = buildPages(asar, { version: "v", build: "b", asarSha256: asar.sha256, youAreChatgpt: asar.findPhrase("You are ChatGPT").length });
  assert.equal(docs.size, chatgptPages.length);
  for (const [name, doc] of docs) {
    const entries = doc.split("\n### ").slice(1);
    assert.ok(entries.length > 0, name);
    for (const entry of entries) assert.match(entry, /^[^\n]+\n\nSource: `[^`]+`, (?:function `[^`]+`, )?offset \d+, SHA-256 `[0-9a-f]{64}`\.\n/, `${name}: ${entry.slice(0, 60)}`);
  }
});
