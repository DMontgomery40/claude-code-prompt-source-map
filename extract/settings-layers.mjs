// The ladder every settings.json key goes through, read from the settings loader: sources in
// order, how values combine by type, and what managed policy overrides afterwards.
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
// The loader chunk is the one whose merge customizer special-cases fallbackModel; find it by content.
const dir = `${root}work/extracted/`;
const chunks = readdirSync(dir).filter(f => f.endsWith(".js") && readFileSync(dir + f, "utf8").includes('"settings_load_started"'));
if (chunks.length !== 1) { console.error(`settings loader: expected one chunk, found ${chunks.length}`); process.exit(2); }
const loader = find => [{ file: chunks[0], find, span: "function" }];
// Each layer is a toggle ("set in this file"); its value is the file's short name, so a
// single value shows which file wins and a list shows every file that contributed.
const layer = (id, label, short, note) => ({ id, mechanism: "layer", knob: null, label, input: "toggle", note, effect: { value: short }, anchors: loader('"settings_load_started"') });
const draft = {
  id: "settings-layers", title: "Where a setting's value comes from", group: "Settings files",
  question: "Claude Code reads settings from five sources, over settings that plugins supply as the lowest layer. A single value comes from the highest source that sets it; lists combine across all of them.",
  shape: "layered", observe: "none", merge_when: [{ type: ["array"] }],
  context: [{ key: "type", label: "Value type", values: [{ value: "scalar", label: "Single value" }, { value: "array", label: "List (such as companyAnnouncements)" }] }],
  anchors: loader('"settings_load_started"'),
  notes: [
    "Credential-helper keys (apiKeyHelper, awsAuthRefresh, awsCredentialExport, gcpAuthRefresh, otelHeadersHelper, proxyAuthHelper) can be removed from a source before the merge, so for them the highest source that sets one does not always win.",
    "Some keys are read from particular sources rather than from this combined value, and can ignore the project files. Permission rules are one: see their own ladder."
  ],
  rungs: [
    layer("policy", "Managed policy (managed-settings.json)", "managed policy", "Set by an administrator. Always loaded."),
    layer("flag", "--settings file or JSON", "--settings", "Loaded even when --setting-sources leaves the other files out."),
    layer("local", ".claude/settings.local.json", "local project file", "This project, this machine; not checked in."),
    layer("project", ".claude/settings.json", "shared project file", "This project, shared with the team."),
    layer("user", "~/.claude/settings.json", "user file", "All your projects.")
  ],
  constraints: [{ id: "policyModels", label: "Managed policy's availableModels, enforceAvailableModels and modelPicker replace every other source's values.", anchors: loader("if(g.enforceAvailableModels!==void 0)r.enforceAvailableModels=g.enforceAvailableModels") }],
  details: { list_exceptions: ["fallbackModel", "modelPicker"], keyed_merge: ["extraKnownMarketplaces", "managedMcpServers"] }
};
writeFileSync(`${root}work/decisions/settings-layers.json`, JSON.stringify(draft, null, 1));
const r = spawnSync(process.execPath, [`${root}extract/decision-author.mjs`, `${root}work/decisions/settings-layers.json`], { stdio: "inherit" });
process.exit(r.status ?? 1);
