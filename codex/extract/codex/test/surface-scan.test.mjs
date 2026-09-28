import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { openAsar } from "../lib/asar.mjs";
import { compare, familyOf, inventory, jevLabeller, renderDiff, scan } from "../surface-scan.mjs";

// A minimal asar: pickled JSON header, then the file bytes.
function writeAsar(files) {
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
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "surface-scan-")), "app.asar");
  fs.writeFileSync(file, Buffer.concat([head, ...blobs]));
  return openAsar(file);
}

const A = "webview/assets/";
const hex = i => i.toString(16).padStart(12, "0");
const many = (stem, n, body = "export{};", start = 0) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`${A}${stem}-${hex(start + i)}.js`, body]));
const enumRun = (prefix, names) => `t=function(e){return ${names.map(n => `e.${prefix}${n}=\`${prefix}${n}\``).join(",")},e.UNRECOGNIZED=\`UNRECOGNIZED\`,e}({});`;
// A locale table: ids and translations, never defaultMessage.
const localeTable = (ns, n) => `var t={${Array.from({ length: n }, (_, i) => `"${ns}.item${i}.label":\`Nachricht ${i}\``).join(",")}};export{t as default};`;
const messages = (ns, n) => Array.from({ length: n }, (_, i) => `x.formatMessage({id:\`${ns}.item${i}.label\`,defaultMessage:\`Message number ${i} for ${ns}\`})`).join(";");

// Build A: a family of 20 manifests, a chat namespace, one enum, one endpoint.
const BUILD_A = {
  ...many("type", 20),
  [`${A}app-${hex(900)}.js`]: [
    messages("chat", 6),
    enumRun("CHATGPT_SURFACE_", ["ONE", "TWO", "THREE", "FOUR", "FIVE"]),
    "api.safePost(`/conversation/{conversation_id}`,{});"
  ].join(";"),
  [`${A}de-DE-${hex(901)}.js`]: localeTable("localeOnly", 9)
};
// Build B: the manifest family grew, a new widget family, namespace, enum, endpoint and category.
const BUILD_B = {
  ...many("type", 45),
  ...many("widget", 6, "x.formatMessage({id:`widgetBlock.view.aria`,defaultMessage:`A widget that plots the answer`})", 100),
  [`${A}app-${hex(900)}.js`]: [
    messages("chat", 6),
    messages("widgetBlock", 7),
    enumRun("CHATGPT_SURFACE_", ["ONE", "TWO", "THREE", "FOUR", "FIVE"]),
    enumRun("CHATGPT_WIDGET_BLOCK_TYPE_", ["PLOT", "GRAPH", "TABLE", "MAP", "TIMELINE"]),
    "api.safePost(`/conversation/{conversation_id}`,{});",
    "api.safePost(`/conversation/message/widget-blocks/feedback`,{});",
    "jsx(St,{category:`widget_block`,contentReferenceIndex:r})"
  ].join(";"),
  [`${A}de-DE-${hex(901)}.js`]: localeTable("localeOnly", 9)
};

test("file names lose their content hash, chunk id and scale suffix; Lottie scenes are one pattern", () => {
  assert.deepEqual(familyOf(`${A}book-headphones-DmBkhmOn-87e1e86fded5.js`), { family: `${A}book-headphones.js` });
  assert.deepEqual(familyOf(`${A}lucide-phone-59b320493af2c689.js`), { family: `${A}lucide-phone.js` });
  assert.deepEqual(familyOf(`${A}call-and-get-aed@2x-fde3c1428e6c.webp`), { family: `${A}call-and-get-aed.webp` });
  assert.deepEqual(familyOf(`${A}app-connect-oauth-callback-page-cd2acf6f4106.js`), { family: `${A}app-connect-oauth-callback-page.js` });
  assert.deepEqual(familyOf(`${A}action-potential-nodes-v1-ac0b2018c0eb.json`), { pattern: "lottie-scene", member: "action-potential-nodes-v1", dir: "webview/assets" });
  assert.equal(familyOf("index.html"), null);
});

test("inventory: families, namespaces (not locale tables), enums without UNRECOGNIZED, endpoints", () => {
  // `app-<hash>.js` and `app-initial-<hash>.js` are app chunks, not locale tables.
  const { surfaces } = inventory(writeAsar(BUILD_A));
  assert.deepEqual(surfaces.asset_families, { [`${A}type.js`]: 20 });
  assert.deepEqual(surfaces.i18n_namespaces, { chat: 6 });
  assert.deepEqual(surfaces.i18n_subnamespaces, {});
  assert.deepEqual(surfaces.enums, { CHATGPT_SURFACE_: 5 });
  assert.deepEqual(surfaces.endpoints, ["/conversation/{conversation_id}"]);
  assert.deepEqual(surfaces.content_reference_categories, []);
});

test("baseline from build A, scan of build B: new and grown families, new endpoint and category are flagged", async () => {
  const before = inventory(writeAsar(BUILD_A)).surfaces;
  const { surfaces, evidence } = inventory(writeAsar(BUILD_B));
  const labels = new Map([["widget_block", 0.9], ["widgetBlock", 0.8]]);
  const labeller = { label: async item => labels.get(item.name) ?? 0.2 };
  const { flagged } = await scan({ current: surfaces, evidence, previous: before, labeller });
  const got = Object.fromEntries(flagged.map(f => [`${f.kind}:${f.name}`, f.change]));
  assert.deepEqual(got, {
    "content_reference_categories:widget_block": "new",
    [`asset_families:${A}type.js`]: "grew",
    [`asset_families:${A}widget.js`]: "new",
    "i18n_namespaces:widgetBlock": "new",
    "enums:CHATGPT_WIDGET_BLOCK_TYPE_": "new",
    "endpoints:/conversation/message/widget-blocks/feedback": "new"
  });
  // The category comes first; a new family carries evidence for Jev: members and interface text.
  assert.equal(flagged[0].name, "widget_block");
  const widget = flagged.find(f => f.name === `${A}widget.js`);
  assert.deepEqual(widget.evidence.texts, ["A widget that plots the answer"]);
  const md = renderDiff({ app: { version: "2", build: "2" }, previousSource: { app_version: "1", app_build: "1" }, flagged, notes: [] });
  assert.match(md, /## Documentable \(Jev\)\n\n- \*\*New content-reference category `widget_block`\*\*\. Jev documentable \(0\.90\)\./);
  assert.match(md, /- \*\*Grew asset family `webview\/assets\/type\.js`\*\*: 20 → 45\. Jev not documentable \(0\.20\)\./);
});

test("an unchanged build is quiet, and a first run with no baseline only records one", async () => {
  const { surfaces, evidence } = inventory(writeAsar(BUILD_A));
  assert.deepEqual((await scan({ current: surfaces, evidence, previous: inventory(writeAsar(BUILD_A)).surfaces, labeller: null })).flagged, []);
  assert.deepEqual(await scan({ current: surfaces, evidence, previous: null, labeller: null }), { flagged: [], notes: [], baseline: false });
});

test("Jev unavailable: the structural diff is still written, marked unlabelled", async () => {
  const before = inventory(writeAsar(BUILD_A)).surfaces;
  const { surfaces, evidence } = inventory(writeAsar(BUILD_B));
  const labeller = jevLabeller(undefined);
  const { flagged } = await scan({ current: surfaces, evidence, previous: before, labeller });
  assert.equal(flagged.length, 6);
  assert.ok(flagged.every(f => f.jev === null));
  assert.equal(labeller.state.unavailable, "no TYPESAFE_API_KEY");
  const md = renderDiff({ app: { version: "2", build: "2" }, previousSource: { app_version: "1", app_build: "1" }, flagged, notes: [], unavailable: labeller.state.unavailable });
  assert.match(md, /Jev was unavailable \(no TYPESAFE_API_KEY\)/);
  assert.match(md, /## Unlabelled\n\n- \*\*New content-reference category `widget_block`\*\*\. unlabelled\./);
  // A labeller that throws is the same as an unavailable one.
  const thrown = await scan({ current: surfaces, evidence, previous: before, labeller: { label: async () => { throw new Error("down"); } } });
  assert.ok(thrown.flagged.every(f => f.jev === null));
});

test("thresholds: small new families and small growth are not flagged; removals are noted", () => {
  const previous = { asset_families: { a: 10, b: 100, gone: 9 }, enums: {}, endpoints: ["/x/y"], content_reference_categories: [] };
  const current = { asset_families: { a: 25, b: 110, small: 4 }, enums: {}, endpoints: [], content_reference_categories: [] };
  const { flagged, notes } = compare(previous, current);
  assert.deepEqual(flagged, []); // a grew by 15 (< 20); b grew by 10%; small has 4 members
  assert.deepEqual(notes.map(n => `${n.kind}:${n.name}`), ["asset_families:gone", "endpoints:/x/y"]);
});
