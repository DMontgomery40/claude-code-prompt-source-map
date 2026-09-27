import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { BINARIES, NAMES, buildPages, keyLike, sha256 } from "../bundle-resources.mjs";
import { markdownUnits } from "../lib/semantic-diff.mjs";

const script = path.resolve(import.meta.dirname, "..", "bundle-resources.mjs");
const KEY = "client-br04gwIKFntB05BUONtNnF3NhWQsvmSI8R97Pigr7A5";
const PLACEHOLDER = "Placeholder for the planned Calendar plugin. Returns not_implemented without accessing or changing calendar data.";
const CLI_SKILL_TEXT = "# Same as the CLI sample\n";
const cstrings = (...texts) => Buffer.concat([Buffer.from([0x02, 0x41, 0]), ...texts.map(text => Buffer.from(`${text}\0`, "utf8"))]);

// A Resources folder shaped like build 11431, with a few files and two tiny binaries.
function fakeResources({ calendarFolder = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-resources-"));
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  };
  const plugins = "plugins/openai-bundled/plugins";
  write(`${plugins}/alpha/.codex-plugin/plugin.json`, JSON.stringify({ name: "alpha", description: "Alpha helps the model.", author: { email: "support@openai.com" } }));
  write(`${plugins}/alpha/skills/alpha/SKILL.md`, "---\nname: alpha\n---\n# Alpha\n\nUse ```fences``` carefully.\n");
  write(`${plugins}/alpha/docs/shared.md`, "# Shared doc\n");
  write(`${plugins}/alpha/README.md`, "# For humans\n");
  write(`${plugins}/alpha/.mcp.json`, JSON.stringify({ mcpServers: { alpha: { command: "./bin/alpha" } } }));
  write(`${plugins}/beta/skills/beta/SKILL.md`, "Read /Users/someone/notes.txt first.\n");
  if (calendarFolder) write(`${plugins}/calendar/.codex-plugin/plugin.json`, JSON.stringify({ description: "Calendar." }));
  write("cua_node/lib/node_modules/@oai/browser-desktop/environment-docs/cloud/shared.md", "# Shared doc\n");
  write("cua_node/lib/node_modules/@oai/browser-desktop/environment-docs/cloud/cloud-only.md", "# Cloud only\n");
  write("cua_node/lib/node_modules/playwright/lib/agents/plan.prompt.md", "Third-party prompt.\n");
  write("skills/skills/.curated/pet/SKILL.md", "# Pet skill\n");
  write("skills/skills/.curated/pet/references/shared-with-cli.md", CLI_SKILL_TEXT);
  const [service, client] = BINARIES;
  write(service.rel, cstrings(
    "ComputerUseIPCCalendarPlaceholderResponse", PLACEHOLDER, KEY, "Failed to configure Calendar MCP Statsig",
    "Find recent Messages chats by participant, chat name, date range, or unread status.",
    "Read messages from one exact chat, newest first. First variant.",
    "Read messages from one exact chat, newest first. Second variant.",
    "\n\nNote: Pay special attention to the content selected by the user. Tail.",
    "List upcoming Calendar events in a date range for the user."
  ));
  write(client.rel, cstrings(PLACEHOLDER, KEY, "Find recent Messages chats by participant, chat name, date range, or unread status."));
  return root;
}

const build = options => buildPages({ resources: fakeResources(options), app: { version: "1.2.3", build: "42" } });
const allOutput = result => [...Object.values(result.pages), ...Object.values(result.coverage)].join("\n");

test("plugin page: walks the directories, publishes exact text, dedupes and withholds", () => {
  const result = build();
  const page = result.pages[NAMES.plugins];
  const coverage = JSON.parse(result.coverage[NAMES.pluginsJson]);
  // plugin.json: only the description value, so the author's address is never published.
  assert.match(page, /## Plugin: alpha\n\n### \.codex-plugin\/plugin\.json description\n\nSource: /);
  assert.match(page, /```text\nAlpha helps the model\.\n```/);
  assert.doesNotMatch(allOutput(result), /support@openai\.com/);
  // The fence is longer than any backtick run in the text.
  assert.match(page, /````text\n---\nname: alpha/);
  assert.doesNotMatch(page, /For humans/);
  assert.match(page, /### \.mcp\.json/);
  // Identical bytes at two paths: one entry, both paths.
  assert.equal(coverage.items.filter(item => item.text === "# Shared doc\n").length, 1);
  assert.match(page, /`plugins\/openai-bundled\/plugins\/alpha\/docs\/shared\.md` \(also at `cua_node\/lib\/node_modules\/@oai\/browser-desktop\/environment-docs\/cloud\/shared\.md`\)/);
  // The cloud environment lists only its own document, with the label.
  assert.match(page, /## Browser environment docs: cloud\n\nShipped, but nothing in this app selects them/);
  assert.match(page, /### cloud-only\.md/);
  // Privacy failures are withheld and named in the summary.
  assert.deepEqual(result.summary.withheld, [{ id: "plugins/openai-bundled/plugins/beta/skills/beta/SKILL.md", reason: "contains a local user path" }]);
  assert.doesNotMatch(page, /someone/);
  // Third-party prompts: path only, never in the coverage texts.
  assert.match(page, /- `cua_node\/lib\/node_modules\/playwright\/lib\/agents\/plan\.prompt\.md`/);
  assert(!coverage.items.some(item => item.text.includes("Third-party prompt")));
  for (const item of coverage.items) assert.match(item.sha256, /^[0-9a-f]{64}$/);
});

test("curated skills: published, except text already on the CLI skills page, which gets a pointer", () => {
  const cliSkills = new Map([[sha256(CLI_SKILL_TEXT), "skills/src/assets/samples/pet/shared.md"]]);
  const result = buildPages({ resources: fakeResources(), cliSkills });
  const page = result.pages[NAMES.plugins];
  const coverage = JSON.parse(result.coverage[NAMES.pluginsJson]);
  assert.match(page, /## Curated skills\n\n### pet\/SKILL\.md\n\nSource: `skills\/skills\/\.curated\/pet\/SKILL\.md`/);
  assert.match(page, /### pet\/references\/shared-with-cli\.md\n\nSource: `skills\/skills\/\.curated\/pet\/references\/shared-with-cli\.md`, SHA-256 `[0-9a-f]{64}`\.\n\nSame bytes as `codex-rs\/skills\/src\/assets\/samples\/pet\/shared\.md` on the Codex CLI bundled skills page, so the text is not repeated here\./);
  assert.doesNotMatch(page, /Same as the CLI sample/);
  assert(!coverage.items.some(item => item.text === CLI_SKILL_TEXT));
  assert.deepEqual(coverage.on_cli_skills_page.map(p => p.cli_source), ["skills/src/assets/samples/pet/shared.md"]);
});

test("computer use page: exact spans, both binaries, missing and ambiguous anchors, no key", () => {
  const result = build();
  const page = result.pages[NAMES.cu];
  const coverage = JSON.parse(result.coverage[NAMES.cuJson]);
  assert.doesNotMatch(allOutput(result), /client-br04/);
  const find = coverage.items.find(item => item.id === "messages-find-chats");
  assert.equal(find.text, "Find recent Messages chats by participant, chat name, date range, or unread status.");
  assert.deepEqual(find.source.map(s => s.split("@")[0]), ["SkyComputerUseService", "SkyComputerUseClient"]);
  // Leading whitespace is kept in the published bytes and flagged in the entry.
  const note = coverage.items.find(item => item.id === "cu-selected-content-note-appended");
  assert.equal(note.text, "\n\nNote: Pay special attention to the content selected by the user. Tail.");
  assert.match(page, /It is a fragment that the program joins with other text at run time\. Kind: prompt text\. The string begins or ends with whitespace/);
  // Two different strings start with one anchor: not published, listed as not found.
  assert(!coverage.items.some(item => item.id === "messages-read-messages"));
  assert.match(page, /### messages-read-messages\n\nSource: not found in this build \(2 different strings start with this anchor\)\./);
  assert.deepEqual(result.summary.ambiguous.map(a => a.id), ["messages-read-messages"]);
  // An anchor absent from both binaries goes to the final group; the build does not fail.
  assert.match(page, /## Not found in this build[\s\S]*### messages-send-message\n\nSource: not found in this build \(not in either binary\)\./);
  // New vocabulary strings are listed under their area, marked unreviewed.
  assert.match(page, /## Calendar\n\n### List upcoming Calendar events in a date range for the user\.\n\nSource: [^\n]+\n\nExact: the whole NUL-terminated string at that offset, found by the vocabulary sweep and not yet reviewed\./);
  // The strings behind an ambiguous anchor still appear, as unreviewed sweep finds.
  assert.equal(result.summary.sweep_unreviewed, 3);
  assert.match(page, /## Messages\n[\s\S]*### Read messages from one exact chat, newest first\. First variant\.\n[\s\S]*## Computer Use/);
});

test("calendar section: generated from anchors, facts and inferences only with evidence", () => {
  const result = build();
  const page = result.pages[NAMES.cu];
  const section = page.slice(page.indexOf("## In the code, not shipped: Calendar"), page.indexOf("## Not found in this build"));
  assert.match(section, /Its description, quoted below, says it returns `not_implemented`/);
  assert.match(section, /No folder under `plugins\/openai-bundled\/plugins` has "calendar" in its name\./);
  assert.match(section, /Inference: it looks gated by a remote feature flag/);
  assert.doesNotMatch(section, /macOS Calendar access/); // no permission type names in this fake build
  assert.match(section, new RegExp(`### Placeholder tool description\\n\\nSource: \`[^\\n]*SkyComputerUseService\` at 0x[0-9a-f]+; \`[^\\n]*SkyComputerUseClient\` at 0x[0-9a-f]+;[^\\n]*\\n\\n[^\\n]*\\n\\n\`\`\`text\\n${PLACEHOLDER.replace(/\./g, "\\.")}\\n\`\`\``));
  // A long identifier survives the key filter; the symbol entry shows the name only.
  assert.match(section, /### ComputerUseIPCCalendarPlaceholderResponse\n\nSource: [^\n]*at 0x3 \(a string on its own\)/);
  assert.match(page, /### calendar-symbol-CalendarPermission\n\nSource: not found in this build/);
  // Stable two-level units for the semantic diff.
  assert(markdownUnits(NAMES.cu, page).has("In the code, not shipped: Calendar › Placeholder tool description"));
  assert.deepEqual(result.summary.calendar, { placeholder_found: true, plugin_folders: [], not_shipped_heading: true });

  const shipped = build({ calendarFolder: true });
  assert.match(shipped.pages[NAMES.cu], /## Calendar: a plugin folder ships in this build\n\n[^\n]*\n- A folder under `plugins\/openai-bundled\/plugins` has "calendar" in its name: `calendar`\./);
  assert.match(shipped.pages[NAMES.plugins], /## Plugin: calendar/);
  assert.equal(shipped.summary.calendar.not_shipped_heading, false);
});

test("a changed layout is listed under Not found on both pages, and the build still succeeds", () => {
  const resources = fakeResources();
  fs.rmSync(path.join(resources, "plugins/openai-bundled/plugins"), { recursive: true });
  fs.rmSync(path.join(resources, BINARIES[1].rel));
  fs.mkdirSync(path.join(resources, "plugins/openai-bundled/plugins/gamma/.codex-plugin"), { recursive: true });
  fs.writeFileSync(path.join(resources, "plugins/openai-bundled/plugins/gamma/.codex-plugin/plugin.json"), JSON.stringify({ name: "gamma" }));
  const result = buildPages({ resources });
  const plugins = result.pages[NAMES.plugins];
  const notFound = plugins.slice(plugins.indexOf("## Not found in this build"));
  assert.match(notFound, /### sky-app\n\nSource: not found in this build \(the folder is missing\)\./);
  assert.match(notFound, /### plugins\/openai-bundled\/plugins\/gamma\/\.codex-plugin\/plugin\.json\n\nSource: not found in this build \(no top-level description string\)\./);
  assert.match(result.pages[NAMES.cu], /### SkyComputerUseClient\n\nSource: not found in this build \(the program is missing\)\./);
  // The Service binary alone still yields the placeholder.
  assert.match(result.pages[NAMES.cu], /### Placeholder tool description\n\nSource: `[^\n]*SkyComputerUseService` at 0x[0-9a-f]+; SHA-256/);

  fs.rmSync(path.join(resources, "plugins"), { recursive: true });
  const bare = buildPages({ resources });
  assert.match(bare.pages[NAMES.plugins], /## Not found in this build\n\n### plugins\n\nSource: not found in this build \(the plugin folder is missing\)\./);
});

test("key filter: prefixed and random keys are key-like, long identifiers are not", () => {
  assert(keyLike(`a ${KEY} b`));
  assert(keyLike("token br04gwIKFntB05BUONtNnF3NhWQsvmSI8R97Pigr7A5"));
  assert(keyLike("sk-abcdefghijklmnopqrstuv"));
  assert(!keyLike("ComputerUseIPCCalendarPlaceholderResponse"));
  assert(!keyLike("CODEX_CONVERSATIONAL_ONBOARDING_ACCESS_TYPE_CALENDAR_APP"));
  assert(!keyLike("Use ISO-8601 dates and chat_guid values from read_messages."));
});

test("a missing app exits 2 with a message and writes nothing", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "bundle-resources-out-"));
  const run = spawnSync(process.execPath, [script, "--out", out, "--work", out], { env: { ...process.env, CODEX_APP_PATH: path.join(out, "Missing.app") }, encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /bundle-resources: missing Missing\.app\/Contents\/Info\.plist/);
  assert.deepEqual(fs.readdirSync(out), []);
});
