#!/usr/bin/env node
// Model-facing text the ChatGPT desktop app ships outside app.asar, in two pages:
//   outputs/chatgpt-bundled-plugins.md (+ .json)  plugin and cua_node text files, read by path
//   outputs/computer-use-prompts.md (+ .json)     prompts and tool descriptions compiled into the
//                                                 Computer Use binaries, as exact NUL-bounded spans
//   work/bundle-resources-diff.md                 semantic changes against the committed pages
//
// Files are discovered by walking directories, so new plugins appear on their own. Binary text is
// found by curated anchors (a string's first bytes) plus a vocabulary sweep that lists new,
// unreviewed strings under their tool area. A missing anchor or path is listed under
// "Not found in this build" and the run still exits 0; a missing app exits 2.
//
// Usage: node extract/codex/bundle-resources.mjs [--out <dir>] [--work <dir>]

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { codexApp } from "./lib/app-layout.mjs";
import { PrivacyError, privacyScan } from "./lib/privacy.mjs";
import { renderChangedDocuments, semanticDiff } from "./lib/semantic-diff.mjs";

export const NAMES = {
  plugins: "chatgpt-bundled-plugins.md", pluginsJson: "chatgpt-bundled-plugins.json",
  cu: "computer-use-prompts.md", cuJson: "computer-use-prompts.json"
};
const PLUGINS = "plugins/openai-bundled/plugins";
const OAI = "cua_node/lib/node_modules/@oai";
const NODE_MODULES = "cua_node/lib/node_modules";
const SKY_APP = `${OAI}/sky/Codex Computer Use.app/Contents`;
export const BINARIES = [
  { name: "SkyComputerUseService", rel: `${SKY_APP}/MacOS/SkyComputerUseService` },
  { name: "SkyComputerUseClient", rel: `${SKY_APP}/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient` }
];
const CURATED_SKILLS = "skills/skills/.curated";
const CLI_SKILLS_PAGE = "codex-cli-bundled-skills.md";
const ENV_DOCS = `${OAI}/browser-desktop/environment-docs`;
const UNSELECTED_ENVS = ["cloud", "orbit", "training"];
const ENV_SELECTOR = "CUA_REPL_BROWSER_ENV";

export const sha256 = data => crypto.createHash("sha256").update(data).digest("hex");
const byteOrder = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b));
const fence = text => "`".repeat(Math.max(3, 1 + Math.max(0, ...[...text.matchAll(/`+/g)].map(m => m[0].length))));
const hex = n => `0x${n.toString(16)}`;

// ---------------------------------------------------------------------------------------------
// Page 1: text files.

// Human docs and config that the model never reads are left out: READMEs, notices, dependency
// lists, doc-inclusion rules (documents.json), extension ids, package manifests, scripts, assets.
const HUMAN_DOC = /^(?:README|DEPENDENCIES|THIRD_PARTY_NOTICES|LICENSE|CHANGELOG)[^/]*\.md$/i;
function includeFile(rel) {
  const base = path.posix.basename(rel);
  if (base === "plugin.json") return /(?:^|\/)\.codex-plugin\/plugin\.json$/.test(rel) ? "description" : null;
  if (base === ".mcp.json" || base === ".mcp.template.json") return "file";
  if (base === "openai.yaml") return /(?:^|\/)agents\/openai\.yaml$/.test(rel) ? "file" : null;
  if (base === "api.json") return "file";
  if (base.endsWith(".md") && !HUMAN_DOC.test(base) && !base.endsWith(".prompt.md")) return "file";
  return null;
}

function walk(root, dir = root, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => byteOrder(a.name, b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== "node_modules") walk(root, full, found); }
    else if (entry.isFile()) found.push(path.relative(root, full).split(path.sep).join("/"));
  }
  return found;
}
const listDirs = dir => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(byteOrder) : []);

// Groups in page order. Each claims the files under its root that no earlier group claimed.
function fileGroups(resources) {
  const groups = listDirs(path.join(resources, PLUGINS)).map(name => ({ key: `plugin:${name}`, heading: `Plugin: ${name}`, root: `${PLUGINS}/${name}` }));
  groups.push(
    { key: "curated-skills", heading: "Curated skills", root: CURATED_SKILLS },
    { key: "sky-app", heading: "Computer Use app: Skysight and per-app instructions", root: `${SKY_APP}/Resources/Package_ComputerUse.bundle/Contents/Resources` },
    { key: "sky", heading: "Sky docs (@oai/sky)", root: `${OAI}/sky` },
    { key: "cua-repl", heading: "cua_repl tool text (@oai/cua-repl)", root: `${OAI}/cua-repl` },
    { key: "env:codex-app", heading: "Browser environment docs: codex-app", root: `${ENV_DOCS}/codex-app` }
  );
  for (const env of UNSELECTED_ENVS) groups.push({ key: `env:${env}`, heading: `Browser environment docs: ${env}`, root: `${ENV_DOCS}/${env}`, unselected: true });
  // After the environments, so a copy of an environment's doc is listed under that environment.
  groups.push({ key: "cua", heading: "Browser runtime docs (@oai/cua)", root: `${OAI}/cua` });
  // Any other environment a later build adds.
  for (const env of listDirs(path.join(resources, ENV_DOCS))) {
    if (!groups.some(g => g.root === `${ENV_DOCS}/${env}`)) groups.push({ key: `env:${env}`, heading: `Browser environment docs: ${env}`, root: `${ENV_DOCS}/${env}` });
  }
  // Any other OpenAI package a later build adds.
  for (const pkg of listDirs(path.join(resources, OAI))) {
    if (!["sky", "cua-repl", "cua", "browser-desktop"].includes(pkg)) groups.push({ key: `oai:${pkg}`, heading: `@oai/${pkg}`, root: `${OAI}/${pkg}` });
  }
  return groups;
}

// Whether anything in the app sets the browser environment. Returns the files that mention it.
function envSelectorHits(scanFiles) {
  const needle = Buffer.from(ENV_SELECTOR);
  return scanFiles.filter(file => fs.existsSync(file) && fs.readFileSync(file).includes(needle)).map(file => path.basename(file));
}

// ---------------------------------------------------------------------------------------------
// Page 2: exact spans in the Computer Use binaries.

// [id, group, kind, title, anchor, options]. The anchor is the string's first bytes; `exact`
// means the whole string. `fragment` marks text the program joins with other text at run time.
const M = "Messages", CH = "Computer History", ES = "Recording and event stream", RR = "Record & Replay", CU = "Computer Use";
const TD = "tool description", PD = "parameter description", OD = "output field description", TR = "tool result text";
const SKY_EVENTS = "Read the Sky event stream JSONL file at:\n\n`{{EVENT_STREAM_PATH}}`\n\n";
export const ANCHORS = [
  ["messages-find-chats", M, TD, "Find chats", "Find recent Messages chats by participant"],
  ["messages-read-messages", M, TD, "Read messages", "Read messages from one exact chat, newest first."],
  ["messages-search-messages", M, TD, "Search messages", "Search message-body text, newest first."],
  ["messages-send-message", M, TD, "Send a message", "Send text, local file attachments, or both."],
  ["messages-count-activity", M, TD, "Count message activity", "Count Messages activity over time"],
  ["messages-read-image", M, TD, "Read an image attachment", "Read an image attachment returned by read_messages"],
  ["messages-param-participants", M, PD, "Parameter: participants (find chats)", "Names, phone numbers, or email addresses that must all participate in the chat."],
  ["messages-param-exact-participants", M, PD, "Parameter: exact participants", "When true, requires participants and matches only chats"],
  ["messages-param-chat-name", M, PD, "Parameter: chat name", "Exact or partial chat name"],
  ["messages-param-unread-chats", M, PD, "Parameter: unread chats only", "When true, return only chats with unread messages.", { exact: true }],
  ["messages-param-chat-guid", M, PD, "Parameter: chat_guid", "The stable chat_guid of an existing direct or group chat.", { exact: true }],
  ["messages-param-unread-messages", M, PD, "Parameter: unread messages only", "When true, return only unread messages.", { exact: true }],
  ["messages-param-messages-from", M, PD, "Parameter: messages from", "Include messages at or after this ISO-8601 date-time."],
  ["messages-param-read-cursor", M, PD, "Parameter: read_messages cursor", "The next_cursor returned by the preceding read_messages"],
  ["messages-param-search-text", M, PD, "Parameter: search text", "Case-insensitive text to find in message bodies."],
  ["messages-param-search-chat-guids", M, PD, "Parameter: chat_guids (search)", "Optional stable chat_guid values for existing chats. When provided, searches"],
  ["messages-param-search-participants", M, PD, "Parameter: participants (search)", "Optional names, phone numbers, or email addresses that must all participate in matched chats."],
  ["messages-param-search-cursor", M, PD, "Parameter: search_messages cursor", "The next_cursor returned by the preceding search_messages"],
  ["messages-param-recipients", M, PD, "Parameter: recipients", "One or more names, phone numbers, or email addresses."],
  ["messages-param-text", M, PD, "Parameter: message text", "Optional plain-text message to send.", { exact: true }],
  ["messages-param-attachments", M, PD, "Parameter: attachments", "Optional absolute paths to local files to attach."],
  ["messages-param-activity-from", M, PD, "Parameter: activity from", "Include activity at or after this ISO-8601"],
  ["messages-param-activity-to", M, PD, "Parameter: activity to", "Include activity before this ISO-8601"],
  ["messages-param-interval", M, PD, "Parameter: interval", "Calendar interval for buckets."],
  ["messages-param-time-zone", M, PD, "Parameter: time zone", "Time zone used for calendar bucket boundaries.", { exact: true }],
  ["messages-param-chat-type", M, PD, "Parameter: chat type", "Optional chat type filter."],
  ["messages-param-count-chat-guids", M, PD, "Parameter: chat_guids (count)", "Optional stable chat_guid values for existing chats. When provided, counts"],
  ["messages-param-breakdown", M, PD, "Parameter: breakdown", "Return combined overall activity or ranked"],
  ["messages-param-rank-by", M, PD, "Parameter: rank by", "For chat breakdowns, rank chats by"],
  ["messages-param-page-size", M, PD, "Parameter: chats per page", "For chat breakdowns, sets the maximum number of chats per page"],
  ["messages-param-count-cursor", M, PD, "Parameter: count_message_activity cursor", "The next_cursor returned by the preceding count_message_activity"],
  ["messages-param-attachment-id", M, PD, "Parameter: attachment id", "The id from an attachment object returned by"],
  ["messages-out-more-chats", M, OD, "Output: more chats available", "Whether additional matching chats exist beyond those returned.", { exact: true }],
  ["messages-out-sent", M, OD, "Output: sent messages", "Messages sent by the current user.", { exact: true }],
  ["messages-out-received", M, OD, "Output: received messages", "Messages received by the current user.", { exact: true }],
  ["messages-out-chat-guid", M, OD, "Output: chat_guid", "The stable chat_guid of the chat.", { exact: true }],
  ["messages-out-chat-count", M, OD, "Output: chat count", "Exact number of chats with counted activity"],
  ["messages-out-next-page", M, OD, "Output: next ranked page", "Opaque continuation for the next ranked chat page."],
  ["messages-out-permission-filtered", M, OD, "Output: permission_filtered", "Present and true only when read permissions caused"],
  ["messages-out-permission-note", M, OD, "Output: permission note", "Present only when permission_filtered is true."],
  ["messages-out-ranked-page", M, OD, "Output: ranked page", "The current ranked page of matching chats.", { exact: true }],
  ["messages-out-participants", M, OD, "Output: participants", "Participants referenced by chats in this page only.", { exact: true }],
  ["messages-out-total-counts", M, OD, "Output: total counts", "Total message counts aligned"],
  ["messages-out-sent-counts", M, OD, "Output: sent counts", "Sent message counts aligned"],
  ["messages-out-received-counts", M, OD, "Output: received counts", "Received message counts aligned"],
  ["messages-out-range", M, OD, "Output: resolved range", "The resolved complete half-open range."],
  ["messages-out-interval", M, OD, "Output: interval", "Calendar interval used for the shared buckets array.", { exact: true }],
  ["messages-out-buckets", M, OD, "Output: buckets", "Shared ordered half-open intervals"],
  ["messages-out-aggregate", M, OD, "Output: aggregate", "Complete aggregate across every matching chat"],
  ["messages-result-send-canceled", M, TR, "Result: send approval canceled", "Message was not sent because the send approval was canceled."],
  ["messages-result-send-denied", M, TR, "Result: send not approved", "Message was not sent because the send was not approved."],
  ["messages-result-read-canceled", M, TR, "Result: read approval canceled", "Content was not returned because the read approval was canceled."],
  ["messages-result-read-denied", M, TR, "Result: read not approved", "Read access was not approved. No content was returned."],
  ["messages-result-chat-blocked", M, TR, "Result: chat blocked by Never allow", "Read access to this chat is blocked by"],
  ["messages-result-mixed", M, TR, "Result: some not approved, some blocked", "read access was not approved for some chats", { fragment: true }],
  ["messages-result-denied-tail", M, TR, "Result: read not approved (lowercase)", "read access was not approved. Do not ask", { fragment: true }],
  ["messages-result-blocked-tail", M, TR, "Result: blocked by Never allow (lowercase)", "read access was blocked by", { fragment: true }],
  ["messages-result-one-destination", M, TR, "Result: one destination", "provide exactly one of chat_guid or recipients", { fragment: true }],
  ["messages-result-cursor-mismatch", M, TR, "Result: cursor from another tool", "cursor was created by a different Messages tool", { fragment: true }],
  ["messages-result-unverified", M, TR, "Result: send not verified", "Messages could not verify whether the send completed. Sending"],
  ["messages-result-consumed", M, TR, "Result: send plan consumed", "Messages send plan was already consumed."],
  ["messages-result-rate-limited", M, TR, "Result: rate limited", "Messages sending is temporarily rate limited. Try again in ", { fragment: true, exact: true }],
  ["history-pause", CH, TD, "Pause", "Temporarily pause Computer History without disabling it."],
  ["history-resume", CH, TD, "Resume", "Resume a paused Computer History recorder."],
  ["history-status", CH, TD, "Status", "Get Computer History status and paths"],
  ["history-get-settings", CH, TD, "Get settings", "Get all Computer History settings."],
  ["history-update-settings", CH, TD, "Update settings", "Replace all Computer History settings."],
  ["history-param-url-rule", CH, PD, "Parameter: URL rule domain", "Required only for URL rules."],
  ["history-param-app-rule", CH, PD, "Parameter: app rule", "Required only for app rules.", { exact: true }],
  ["history-result-stopped", CH, TR, "Result: Computer History stopped", "Computer History is stopped. Enable Computer History"],
  ["events-start", ES, TD, "Start recording", "Start recording the user's actions for up to 30 minutes."],
  ["events-status", ES, TD, "Recording status", "Get the current or most recent Record & Replay recording status"],
  ["events-stop", ES, TD, "Stop recording", "Stop the active event stream recording"],
  ["events-prototype-system", ES, "system prompt", "Event stream prototype system prompt", "You are evaluating a local Sky event stream prototype."],
  ["events-summary-template", ES, "prompt template", "Activity summary template", `${SKY_EVENTS}Describe concisely`],
  ["events-next-actions-template", ES, "prompt template", "Next actions template", `${SKY_EVENTS}Suggest up to 3 next actions`],
  ["events-memory-template", ES, "prompt template", "Memory file template", `${SKY_EVENTS}Create a Computer History-style Markdown memory file`],
  ["events-skysight-segments", ES, "prompt text", "Skysight segment directory note", "`\n\nSkysight saves local event stream segments", { fragment: true }],
  ["events-skysight-tree", ES, "prompt text", "Skysight segment tree and input header", "/segments/\n", { fragment: true }],
  ["events-window-segments", ES, "prompt text", "Segments in this window", "Event stream segments from this 10-minute window:", { fragment: true }],
  ["events-larger-arc", ES, "prompt text", "Larger arc note", "\n\nFocus on the larger arc of work across the full window.", { fragment: true, exact: true }],
  ["replay-plan-template", RR, "prompt template", "Replay plan template", `${SKY_EVENTS}Draft a concise replay plan`],
  ["replay-skill-template", RR, "prompt template", "Skill draft template", `${SKY_EVENTS}Create a Markdown Codex skill draft`],
  ["cu-list-apps", CU, TD, "List apps", "List the apps on this computer."],
  ["cu-get-app-state", CU, TD, "Get app state", "Start an app use session if needed"],
  ["cu-click", CU, TD, "Click", "Click an element by index or pixel coordinates from screenshot", { exact: true }],
  ["cu-secondary-action", CU, TD, "Secondary action", "Invoke a secondary accessibility action exposed by an element", { exact: true }],
  ["cu-set-value", CU, TD, "Set value", "Set the value of a settable accessibility element", { exact: true }],
  ["cu-select-text", CU, TD, "Select text", "Select text inside a text element"],
  ["cu-scroll", CU, TD, "Scroll", "Scroll an element in a direction by a number of pages", { exact: true }],
  ["cu-drag", CU, TD, "Drag", "Drag from one point to another using pixel coordinates", { exact: true }],
  ["cu-press-key", CU, TD, "Press key", "Press a key or key-combination on the keyboard"],
  ["cu-type-text", CU, TD, "Type text", "Type literal text using keyboard input", { exact: true }],
  ["cu-param-app", CU, PD, "Parameter: app", "App name, full app path, or unambiguous bundle identifier", { exact: true }],
  ["cu-param-app-short", CU, PD, "Parameter: app (short form)", "App name or bundle identifier", { exact: true }],
  ["cu-param-element-index", CU, PD, "Parameter: element index", "Element index to click", { exact: true }],
  ["cu-param-x", CU, PD, "Parameter: x", "X coordinate in screenshot pixel coordinates", { exact: true }],
  ["cu-param-y", CU, PD, "Parameter: y", "Y coordinate in screenshot pixel coordinates", { exact: true }],
  ["cu-param-click-count", CU, PD, "Parameter: click count", "Number of clicks. Defaults to 1", { exact: true }],
  ["cu-param-mouse-button", CU, PD, "Parameter: mouse button", "Mouse button to click. Defaults to left.", { exact: true }],
  ["cu-param-element", CU, PD, "Parameter: element", "Element identifier", { exact: true }],
  ["cu-param-action", CU, PD, "Parameter: action", "Secondary accessibility action name", { exact: true }],
  ["cu-param-text-element", CU, PD, "Parameter: text element", "Text element identifier", { exact: true }],
  ["cu-param-target-text", CU, PD, "Parameter: target text", "Target text as shown in the accessibility tree", { exact: true }],
  ["cu-param-text-before", CU, PD, "Parameter: text before", "Optional text immediately before the target"],
  ["cu-param-text-after", CU, PD, "Parameter: text after", "Optional text immediately after the target"],
  ["cu-param-selection", CU, PD, "Parameter: selection mode", "Whether to select the text or place the cursor"],
  ["cu-param-direction", CU, PD, "Parameter: scroll direction", "Scroll direction: up, down, left, or right", { exact: true }],
  ["cu-param-pages", CU, PD, "Parameter: pages", "Number of pages to scroll."],
  ["cu-param-key", CU, PD, "Parameter: key", "Key or key combination to press", { exact: true }],
  ["cu-result-action-completed", CU, TR, "Result: action completed", ")\nAction completed. Call `get_app_state`", { fragment: true }],
  ["cu-result-requery", CU, TR, "Result: re-query state (second part)", "'. Re-query the latest state with `get_app_state`", { fragment: true }],
  ["cu-result-turn-ended", CU, TR, "Result: turn ended", "Computer Use is unavailable because the current turn ended."],
  ["cu-result-version-mismatch", CU, TR, "Result: version mismatch", "The Computer Use server and client have a version mismatch."],
  ["cu-result-url-blocked", CU, TR, "Result: URL not allowed", "This session has been stopped because Computer Use is not allowed"],
  ["cu-result-stopped-by-user", CU, TR, "Result: stopped by the user", "This application session has been explicitly stopped by the user"],
  ["cu-result-permissions-pending", CU, TR, "Result: permissions pending", "Computer Use permissions are still pending. The user"],
  ["cu-result-runtime-missing", CU, TR, "Result: runtime app missing", "Computer Use could not start because its runtime app is missing."],
  ["cu-result-not-active-start", CU, TR, "Result: not active (first part)", "Computer Use is not active for '", { fragment: true, exact: true }],
  ["cu-result-not-active-end", CU, TR, "Result: not active (second part)", "'. You first must call `get_app_state`", { fragment: true }],
  ["cu-result-locked-text", CU, TR, "Result: Mac locked (accessibility text)", "The Mac is locked. Unlock it before reading accessibility text."],
  ["cu-result-unlock-failed", CU, TR, "Result: automatic unlock failed", "The Mac is locked and automatic unlock could not unlock it."],
  ["cu-result-unlock-paused", CU, TR, "Result: automatic unlock paused", "The Mac is locked and automatic unlock is paused"],
  ["cu-result-unlock-no-thread", CU, TR, "Result: request not tied to a ChatGPT thread", "The Mac is locked and this Computer Use request cannot be associated"],
  ["cu-result-paste-conflict", CU, TR, "Result: paste conflict", "The user may have conflicted with your paste operation."],
  ["cu-result-element-invalid", CU, TR, "Result: element ID no longer valid", "The element ID is no longer valid."],
  ["cu-result-refetch-finished", CU, TR, "Result: refetch could not finish", "The element was invalidated, and an attempt was made to refetch it, but the refetch couldn't be finished"],
  ["cu-result-refetch-started", CU, TR, "Result: refetch could not start", "The element was invalidated, and an attempt was made to refetch it, but the refetch couldn't be started"],
  ["cu-state-header", CU, "prompt text", "App state header", "Computer Use state (CUA App Version: ", { fragment: true, exact: true }],
  ["cu-app-instructions-open", CU, "prompt text", "App instructions opening tag", "\n<app_specific_instructions>\n", { fragment: true, exact: true }],
  ["cu-app-instructions-close", CU, "prompt text", "App instructions closing tag", "\n</app_specific_instructions>", { fragment: true, exact: true }],
  ["cu-tree-diff", CU, "prompt text", "Accessibility tree diff header", "The following is a diff from the previous accessibility tree", { fragment: true }],
  ["cu-tree-cumulative-diff", CU, "prompt text", "Accessibility tree cumulative diff header", "The following is a cumulative diff from the initial accessibility tree", { fragment: true }],
  ["cu-tree-no-change", CU, "prompt text", "No accessibility tree change", "There has been no change in the accessibility tree for ", { fragment: true }],
  ["cu-browser-guidance", CU, "prompt text", "Browser Computer Use guidance", "## Browser Computer Use\n\n"],
  ["cu-selected-content-note", CU, "prompt text", "Selected-content note", "Note: Pay special attention to the content selected by the user."],
  ["cu-selected-content-note-appended", CU, "prompt text", "Selected-content note (appended form)", "\n\nNote: Pay special attention to the content selected by the user.", { fragment: true }],
  ["cu-spotify-links-note", CU, "prompt text", "Spotify links note", "\n\nNote: In order to be usable, Spotify app links", { fragment: true }]
].map(([id, group, kind, title, anchor, options = {}]) => ({ id, group, kind, title, anchor, ...options }));

// The Calendar section: spans (whole strings) and symbol names (bytes found anywhere).
export const CALENDAR_SPANS = [
  { id: "calendar-placeholder", title: "Placeholder tool description", anchor: "Placeholder for the planned Calendar plugin.", kind: TD },
  { id: "calendar-subcommand-help", title: "Subcommand help", anchor: "Runs the Calendar client as an MCP server", exact: true, kind: "command-line help" },
  { id: "calendar-statsig-error", title: "Statsig configuration error", anchor: "Failed to configure Calendar MCP Statsig", exact: true, kind: "error text" }
];
export const CALENDAR_SYMBOLS = [
  "CalendarMCPServer", "CalendarMCPCommand", "CalendarCommand",
  "ComputerUseIPCCalendarPlaceholderRequest", "ComputerUseIPCCalendarPlaceholderResponse",
  "CalendarPermission", "CalendarAppleEventsPermission", "CalendarOperationCoordinator",
  "CodexCalendarMcpServerLaunched", "CODEX_CONVERSATIONAL_ONBOARDING_ACCESS_TYPE_CALENDAR_APP", "not_implemented"
];

// Strings the vocabulary sweep matches that were reviewed and are not model-facing: permission and
// approval dialog copy shown to the user, command-line help, internal errors, and the Sky app's
// developer feature flags (including its unrelated Apple/Google Calendar integration flags).
export const IGNORED = [
  "ChatGPT needs these permissions", "ChatGPT needs permission to privately capture", "ChatGPT Computer Use needs these permissions",
  "By default, ChatGPT uses messages only", "Are you sure you want to discard this recording?", "Allowing ChatGPT to use this app",
  "ChatGPT will start recording your mouse clicks", "Allow ChatGPT to record your actions", "Allow reading messages in the following chats?",
  "Always allow sending to this chat", "Record & Replay approval", "Runs the ", "Failed to configure ", "Handles a Codex turn-ended notification",
  "Computer Use bootstrap response", "Could not send the Computer Use bootstrap", "Could not receive the Computer Use bootstrap",
  "Timed out establishing the Computer Use connection", "Computer use actions are not allowed for system security process",
  "Computer Use stopped due to encountering a disallowed URL", "Keeping the display awake while Computer Use",
  "The protected Computer Use app-group container", "Computer History URL observation rules", "Computer History app observation rules",
  "Invalid Computer History", "Computer Use is disabled by your configuration", "Enable the virtual cursor in Computer Use",
  "Detach the computer use cursor", "Enables Chrome extension installation during Computer Use", "Show backgrounded apps that Computer Use",
  "Trigger PIP when the minimize button is pressed on a Computer Use", "When enabled, \"Custom\" personal instructions for Computer Use",
  "Enables Apple Calendar integration", "Enables Google Calendar integration", "Enable notes in Calendar Events",
  "Computer Use is blocked from using the app '", "Computer Use could not persist the approval", "Computer Use permission request canceled",
  "Computer Use approval denied via MCP elicitation", "Computer Use is not allowed to use the app '", "Computer Use server error",
  "Computer Use permissions are not granted", "Computer Use permissions are still pending\0",
  "Messages could not verify whether the send completed\0", "The Messages database query exceeded its time limit",
  "Required Messages permissions were not granted", "Messages permission setup is still open", "Messages send plan is unavailable",
  "Ambiguous Messages destination", "Invalid Messages request", "Allow reading messages in your chat with",
  "an attachment could not be opened by the Messages client", " can only be used when breakdown is chat", "Messages could not persist the approval",
  "cursor is only supported for chat breakdowns", "one or more message chats were not found",
  "Move Record & Replay", "Record & Replay Recording Controls", "Record & Replay is recording your actions", "Open Record & Replay",
  " will be excluded from the recording.", "Computer Use display sleep prevention", "Computer Use IPC server is unavailable",
  "Computer Use XPC session is unavailable", "When Anthropic or OpenAI is set as the default chat service", "Enable user defined integrations"
];
// SQL for the Messages database and printf-style log formats are code, not text for the model.
const NOT_PROSE = /\b(?:SELECT|FROM|GROUP BY|ORDER BY|ROWID)\b|%@/;
const SWEEP_AREAS = [
  [/[Cc]alendar/, "Calendar"],
  [/Computer History|computer_history/, CH],
  [/Record & Replay/, RR],
  [/event stream|event_stream|Skysight|recording/i, ES],
  [/\bMessages\b|chat_guid|\bchats?\b/, M],
  [/Computer Use|get_app_state|accessibility/i, CU]
];
const GROUP_ORDER = [M, CH, ES, RR, CU, "Calendar", "Other"];

// Key-like tokens are never published: prefixed keys, and long mixed-case alphanumeric runs with
// no lowercase word in them (identifiers such as ComputerUseIPCCalendarPlaceholderResponse have one).
export function keyLike(text) {
  if (/\bclient-[A-Za-z0-9]{12,}|\bsk-[A-Za-z0-9_-]{16,}|\b[0-9a-f]{32,}\b/.test(text)) return true;
  for (const [token] of text.matchAll(/[A-Za-z0-9]{20,}/g)) {
    const lowerRun = Math.max(0, ...[...token.matchAll(/[a-z]+/g)].map(m => m[0].length));
    if (/[0-9]/.test(token) && /[A-Z]/.test(token) && /[a-z]/.test(token) && lowerRun <= 4) return true;
  }
  return false;
}

const decoder = new TextDecoder("utf-8", { fatal: true });
const spanAt = (bytes, at) => {
  let start = at;
  while (start > 0 && bytes[start - 1] !== 0) start--;
  let end = at;
  while (end < bytes.length && bytes[end] !== 0) end++;
  return { start, end };
};
function offsetsOf(bytes, needle) {
  const found = [];
  for (let at = bytes.indexOf(needle); at !== -1; at = bytes.indexOf(needle, at + 1)) found.push(at);
  return found;
}

// Finds the one string that starts with `anchor` (or equals it) in each binary.
export function findSpan(binaries, { anchor, exact = false }) {
  const needle = Buffer.from(anchor, "utf8");
  const hits = [];
  const texts = new Set();
  for (const binary of binaries) {
    for (const at of offsetsOf(binary.bytes, needle)) {
      if (at > 0 && binary.bytes[at - 1] !== 0) continue;
      const { end } = spanAt(binary.bytes, at);
      if (exact && end !== at + needle.length) continue;
      let text;
      try { text = decoder.decode(binary.bytes.subarray(at, end)); } catch { continue; }
      texts.add(text);
      hits.push({ binary: binary.name, offset: at });
    }
  }
  if (!hits.length) return { status: "missing" };
  if (texts.size > 1) return { status: "ambiguous", count: texts.size };
  return { status: "found", text: [...texts][0], hits };
}

export function findSymbol(binaries, name) {
  const needle = Buffer.from(name, "utf8");
  const hits = [];
  for (const binary of binaries) {
    for (const at of offsetsOf(binary.bytes, needle)) {
      const { start, end } = spanAt(binary.bytes, at);
      hits.push({ binary: binary.name, offset: at, standalone: start === at && end === at + needle.length });
    }
  }
  return hits;
}

// Every NUL-bounded prose string that uses a tool area's vocabulary.
export function sweep(binaries) {
  const found = new Map();
  for (const binary of binaries) {
    const bytes = binary.bytes;
    let start = 0;
    for (let i = 0; i <= bytes.length; i++) {
      if (i < bytes.length && bytes[i] !== 0) continue;
      const len = i - start;
      if (len >= 30 && len <= 20000 && bytes[start] >= 0x0a) {
        let text = null;
        try { text = decoder.decode(bytes.subarray(start, i)); } catch { /* not UTF-8 */ }
        if (text && !/[\x00-\x09\x0b-\x1f]/.test(text) && (text.match(/ /g) ?? []).length >= 4 && /^[\s`#'"<(A-Za-z]/.test(text)) {
          const area = NOT_PROSE.test(text) ? null : SWEEP_AREAS.find(([pattern]) => pattern.test(text))?.[1];
          if (area) {
            const entry = found.get(text) ?? { text, area, hits: [] };
            entry.hits.push({ binary: binary.name, offset: start });
            found.set(text, entry);
          }
        }
      }
      start = i + 1;
    }
  }
  return [...found.values()];
}

const firstWords = text => {
  const line = text.trim().split("\n")[0].replace(/[`*#]/g, "").trim();
  return line.length > 70 ? `${line.slice(0, 67).trimEnd()}…` : line;
};

// ---------------------------------------------------------------------------------------------
// Assembly.

// cliSkills maps the SHA-256 of each text on the Codex CLI bundled skills page to its source path.
export function buildPages({ resources, app = {}, scanFiles = [], cliSkills = new Map() }) {
  const inRes = rel => path.join(resources, rel);
  const summary = { withheld: [], not_found: [], ambiguous: [], sweep_unreviewed: 0, labels: {} };
  const bySha = new Map();
  const count = label => { summary.labels[label] = (summary.labels[label] ?? 0) + 1; };

  // Privacy and key checks. Failures are withheld and named (never quoted) in the summary.
  const publishable = (id, text) => {
    if (keyLike(text)) { summary.withheld.push({ id, reason: "key-like token" }); return false; }
    try { privacyScan([[id, text]]); } catch (error) {
      if (!(error instanceof PrivacyError)) throw error;
      summary.withheld.push({ id, reason: error.message.replace(/^.*? contains a /, "contains a ").replace(/; refusing.*$/, "") });
      return false;
    }
    return true;
  };

  // Page 1.
  const selectorHits = envSelectorHits(scanFiles);
  const groups = fileGroups(resources);
  const fileMissing = [];
  const missFile = (id, anchor, reason) => { fileMissing.push({ id, anchor, reason }); summary.not_found.push({ id, anchor }); };
  if (!fs.existsSync(inRes(PLUGINS))) missFile("plugins", PLUGINS, "the plugin folder is missing");
  const claimed = new Set();
  const fileItems = [];
  const pointers = [];
  for (const group of groups) {
    group.items = [];
    if (!fs.existsSync(inRes(group.root))) { missFile(group.key, group.root, "the folder is missing"); continue; }
    for (const relInGroup of walk(inRes(group.root))) {
      const rel = `${group.root}/${relInGroup}`;
      const mode = includeFile(rel);
      if (!mode || claimed.has(rel)) continue;
      claimed.add(rel);
      const raw = fs.readFileSync(inRes(rel));
      const fileSha = sha256(raw);
      let text;
      try { text = decoder.decode(raw); } catch { summary.withheld.push({ id: rel, reason: "not UTF-8" }); continue; }
      let label = "exact file";
      if (mode === "description") {
        let description;
        try { description = JSON.parse(text).description; } catch { description = undefined; }
        if (typeof description !== "string") { missFile(rel, `${rel}: description`, "no top-level description string"); continue; }
        text = description;
        label = "exact field value";
      }
      const textSha = sha256(text);
      const same = bySha.get(textSha);
      if (same) { same.also.push(rel); continue; }
      if (cliSkills.has(textSha)) {
        // Already published on the CLI skills page: a pointer, not a second copy.
        const item = { id: `file:${rel}`, group: group.heading, title: relInGroup, label: "pointer to the CLI skills page", primary: rel, also: [], sha256: textSha, cliSource: cliSkills.get(textSha) };
        bySha.set(textSha, item);
        group.items.push(item);
        pointers.push(item);
        count(item.label);
        continue;
      }
      if (!publishable(rel, text)) continue;
      const item = { id: `file:${rel}`, page: NAMES.plugins, group: group.heading, title: mode === "description" ? `${relInGroup} description` : relInGroup, label, primary: rel, also: [], file_sha256: fileSha, sha256: textSha, bytes: Buffer.byteLength(text), text, unselected: group.unselected };
      bySha.set(textSha, item);
      group.items.push(item);
      fileItems.push(item);
      count(label);
    }
  }
  // Third-party prompt templates: paths only.
  const thirdParty = [];
  if (fs.existsSync(inRes(NODE_MODULES))) {
    for (const pkg of listDirs(inRes(NODE_MODULES)).filter(name => name !== "@oai")) {
      for (const rel of walk(inRes(`${NODE_MODULES}/${pkg}`))) if (rel.endsWith(".prompt.md")) thirdParty.push(`${NODE_MODULES}/${pkg}/${rel}`);
    }
  }
  summary.labels["path only"] = thirdParty.length;

  // Page 2.
  const binaries = [];
  const missing = [];
  for (const binary of BINARIES) {
    if (!fs.existsSync(inRes(binary.rel))) { missing.push({ id: binary.name, anchor: binary.rel, reason: "the program is missing" }); summary.not_found.push({ id: binary.name, anchor: binary.rel }); continue; }
    const bytes = fs.readFileSync(inRes(binary.rel));
    binaries.push({ ...binary, bytes, sha256: sha256(bytes) });
  }
  const spanItems = [];
  const curatedTexts = new Set();
  const addSpan = (spec, group, label) => {
    const result = findSpan(binaries, spec);
    if (result.status !== "found") {
      missing.push({ id: spec.id, anchor: spec.anchor, reason: result.status === "ambiguous" ? `${result.count} different strings start with this anchor` : "not in either binary" });
      (result.status === "ambiguous" ? summary.ambiguous : summary.not_found).push({ id: spec.id, anchor: spec.anchor });
      return null;
    }
    curatedTexts.add(result.text);
    if (!publishable(spec.id, result.text)) return null;
    const sha = sha256(result.text);
    const item = { id: spec.id, page: NAMES.cu, group, title: spec.title, kind: spec.kind, label, hits: result.hits, sha256: sha, bytes: Buffer.byteLength(result.text), text: result.text };
    if (bySha.has(sha)) item.same_as = bySha.get(sha).id;
    bySha.set(sha, item);
    count(label);
    return item;
  };
  for (const spec of ANCHORS) {
    const item = addSpan(spec, spec.group, spec.fragment ? "exact span (fragment)" : "exact span");
    if (item) spanItems.push(item);
  }
  const calendar = { spans: [], symbols: [] };
  for (const spec of CALENDAR_SPANS) {
    const item = addSpan(spec, "calendar", "exact span");
    if (item) calendar.spans.push(item);
  }
  for (const name of CALENDAR_SYMBOLS) {
    const hits = binaries.length ? findSymbol(binaries, name) : [];
    if (!hits.length) { missing.push({ id: `calendar-symbol-${name}`, anchor: name, reason: "not in either binary" }); summary.not_found.push({ id: `calendar-symbol-${name}`, anchor: name }); continue; }
    calendar.symbols.push({ id: `calendar-symbol-${name}`, page: NAMES.cu, group: "calendar", title: name, kind: "symbol name", label: "exact symbol bytes", hits, sha256: sha256(name), bytes: Buffer.byteLength(name), text: name });
    count("exact symbol bytes");
  }
  // Sweep: new strings in a tool area's vocabulary that nobody has reviewed yet.
  for (const entry of sweep(binaries)) {
    if (curatedTexts.has(entry.text) || IGNORED.some(prefix => (prefix.endsWith("\0") ? entry.text === prefix.slice(0, -1) : entry.text.startsWith(prefix)))) continue;
    const id = `sweep-${sha256(entry.text).slice(0, 12)}`;
    if (!publishable(id, entry.text)) continue;
    spanItems.push({ id, page: NAMES.cu, group: entry.area, title: firstWords(entry.text), kind: "unreviewed", label: "exact span (sweep, not reviewed)", hits: entry.hits, sha256: sha256(entry.text), bytes: Buffer.byteLength(entry.text), text: entry.text });
    summary.sweep_unreviewed++;
    count("exact span (sweep, not reviewed)");
  }

  const calendarFolders = listDirs(inRes(PLUGINS)).filter(name => /calendar/i.test(name));
  const placeholder = calendar.spans.find(item => item.id === "calendar-placeholder");
  summary.calendar = { placeholder_found: Boolean(placeholder), plugin_folders: calendarFolders, not_shipped_heading: Boolean(placeholder) && !calendarFolders.length };
  summary.env_selector_found_in = selectorHits;

  const context = { app, binaries, groups, fileMissing, thirdParty, selectorHits, spanItems, calendar, calendarFolders, placeholder, missing };
  return {
    pages: { [NAMES.plugins]: renderPluginsPage(context), [NAMES.cu]: renderComputerUsePage(context) },
    coverage: {
      [NAMES.pluginsJson]: coverageJson(app, fileItems, {
        on_cli_skills_page: pointers.map(item => ({ id: item.id, source: [item.primary, ...item.also], sha256: item.sha256, cli_source: item.cliSource })),
        third_party_paths_only: thirdParty
      }),
      [NAMES.cuJson]: coverageJson(app, [...spanItems, ...calendar.spans, ...calendar.symbols], { binaries: binaries.map(b => ({ name: b.name, path: b.rel, sha256: b.sha256 })), not_found: missing })
    },
    summary: { ...summary, plugin_page_items: fileItems.length, computer_use_items: spanItems.length + calendar.spans.length + calendar.symbols.length }
  };
}

function coverageJson(app, items, extra) {
  return `${JSON.stringify({
    app_version: app.version ?? null, app_build: app.build ?? null,
    items: items.map(item => ({
      id: item.id, group: item.group, title: item.title, label: item.label, ...(item.kind ? { kind: item.kind } : {}),
      source: item.primary ? [item.primary, ...item.also] : item.hits.map(hit => `${hit.binary}@${hex(hit.offset)}`),
      ...(item.file_sha256 ? { source_file_sha256: item.file_sha256 } : {}),
      sha256: item.sha256, bytes: item.bytes, text: item.text
    })),
    ...extra
  }, null, 2)}\n`;
}

const appLine = app => `Source: \`ChatGPT.app\` ${app.version ?? "(unknown version)"} (build ${app.build ?? "unknown"}). Paths are relative to \`ChatGPT.app/Contents/Resources\`.`;
function textBlock(text) {
  const shown = text.replace(/\n$/, "");
  const f = fence(shown);
  return [`${f}text`, shown, f];
}
const edgeNote = text => (/^\s/.test(text) || /\s$/.test(text.replace(/\n$/, "")) ? " The string begins or ends with whitespace, which the block cannot show exactly; the JSON file has the exact text." : "");

function renderPluginsPage({ app, groups, fileMissing, thirdParty, selectorHits }) {
  const lines = [
    "# ChatGPT bundled plugins and skills", "", appLine(app), "",
    "Plugin guidance, skills, reference files, MCP launch settings and Computer Use docs that the ChatGPT desktop app ships as text files outside `app.asar`. Each file is shown with its exact bytes. For `plugin.json` only the top-level `description` value is shown, since the rest is interface copy, author details and hooks. A file that is byte-identical at several paths appears once, with the other paths on its source line.", ""
  ];
  for (const group of groups) {
    if (!group.items.length) continue;
    lines.push(`## ${group.heading}`, "");
    if (group.unselected) {
      lines.push(selectorHits.length
        ? `Shipped with the app. The app references the \`${ENV_SELECTOR}\` setting that selects browser environments, so this environment may be in use.`
        : `Shipped, but nothing in this app selects them: the \`${ENV_SELECTOR}\` setting that chooses a browser environment does not occur in \`app.asar\`, the Codex CLI or \`node_repl\`. Only documents that differ from the copies above are listed here.`, "");
    }
    for (const item of group.items) {
      const where = [item.primary, ...item.also].map(p => `\`${p}\``);
      if (item.cliSource) {
        lines.push(`### ${item.title}`, "", `Source: ${where.join(", ")}, SHA-256 \`${item.sha256}\`.`, "",
          `Same bytes as \`codex-rs/${item.cliSource}\` on the Codex CLI bundled skills page, so the text is not repeated here.`, "");
        continue;
      }
      const source = item.label === "exact field value"
        ? `Source: ${where.join(", ")} (file SHA-256 \`${item.file_sha256}\`), \`description\` value SHA-256 \`${item.sha256}\`.`
        : `Source: ${where[0]}${where.length > 1 ? ` (also at ${where.slice(1).join(", ")})` : ""}, SHA-256 \`${item.sha256}\`.`;
      const label = item.label === "exact field value" ? "Exact: the decoded JSON `description` value." : `Exact file contents.${item.unselected && !selectorHits.length ? " Shipped, but nothing in this app selects this environment." : ""}`;
      lines.push(`### ${item.title}`, "", source, "", label, "", ...textBlock(item.text), "");
    }
  }
  if (thirdParty.length) {
    lines.push("## Third-party: Microsoft Playwright prompt templates", "",
      "Prompt templates from the Playwright package, which ships with the app's Node runtime. They are Microsoft's, and no OpenAI code in the app refers to them, so only their paths are listed.", "",
      ...thirdParty.map(p => `- \`${p}\``), "");
  }
  lines.push(...notFound(fileMissing));
  return `${lines.join("\n").trimEnd()}\n`;
}

function notFound(missing) {
  if (!missing.length) return [];
  const lines = ["## Not found in this build", ""];
  for (const m of missing) lines.push(`### ${m.id}`, "", `Source: not found in this build (${m.reason}).`, "", ...textBlock(m.anchor), "");
  return lines;
}

const binaryPath = name => BINARIES.find(b => b.name === name).rel;
const spanSource = item => {
  const byBinary = new Map();
  for (const hit of item.hits) (byBinary.get(hit.binary) ?? byBinary.set(hit.binary, []).get(hit.binary)).push(hex(hit.offset));
  return `Source: ${[...byBinary].map(([name, offsets]) => `\`${binaryPath(name)}\` at ${offsets.join(", ")}`).join("; ")}; SHA-256 \`${item.sha256}\`.`;
};
const LABEL_TEXT = {
  "exact span": "Exact: the whole NUL-terminated string at that offset, decoded as UTF-8.",
  "exact span (fragment)": "Exact: the whole NUL-terminated string at that offset, decoded as UTF-8. It is a fragment that the program joins with other text at run time.",
  "exact span (sweep, not reviewed)": "Exact: the whole NUL-terminated string at that offset, found by the vocabulary sweep and not yet reviewed."
};

function renderComputerUsePage({ app, binaries, spanItems, calendar, calendarFolders, placeholder, missing }) {
  const lines = [
    "# Computer Use prompts and tool descriptions", "", appLine(app),
    ...binaries.flatMap(b => ["", `Source: \`${b.rel}\`, SHA-256 \`${b.sha256}\`.`]), "",
    "Prompts, tool descriptions, parameter descriptions and tool-result text compiled into the Computer Use programs that ship with the ChatGPT desktop app. The Messages, Computer History and Record & Replay plugins run the client program as their MCP servers. Each entry is the exact NUL-terminated string found at the listed offset, decoded as UTF-8. Text that appears in both programs lists both.", ""
  ];
  const entry = item => [`### ${item.title}`, "", spanSource(item), "", `${LABEL_TEXT[item.label]}${item.kind && item.kind !== "unreviewed" ? ` Kind: ${item.kind}.` : ""}${edgeNote(item.text)}`, "", ...textBlock(item.text), ""];
  const groups = new Map();
  for (const item of spanItems) (groups.get(item.group) ?? groups.set(item.group, []).get(item.group)).push(item);
  for (const group of GROUP_ORDER) {
    if (!groups.get(group)?.length) continue;
    lines.push(`## ${group}`, "");
    const seen = new Map();
    for (const item of groups.get(group)) {
      const n = (seen.get(item.title) ?? 0) + 1;
      seen.set(item.title, n);
      lines.push(...entry(n > 1 ? { ...item, title: `${item.title} (${n})` } : item));
    }
  }

  if (placeholder || calendar.symbols.length || calendar.spans.length) {
    const has = name => calendar.symbols.some(s => s.text === name);
    const statsig = calendar.spans.some(s => s.id === "calendar-statsig-error");
    lines.push(calendarFolders.length ? "## Calendar: a plugin folder ships in this build" : "## In the code, not shipped: Calendar", "");
    lines.push(placeholder
      ? "- The Computer Use programs contain a Calendar tool placeholder. Its description, quoted below, says it returns `not_implemented` without accessing or changing calendar data."
      : "- The Calendar placeholder tool description is not in this build.");
    lines.push(calendarFolders.length
      ? `- A folder under \`${PLUGINS}\` has "calendar" in its name: ${calendarFolders.map(n => `\`${n}\``).join(", ")}. Its files are on the bundled plugins page.`
      : `- No folder under \`${PLUGINS}\` has "calendar" in its name.`);
    if (has("CalendarPermission") || has("CalendarAppleEventsPermission")) lines.push("- Inference: it would use macOS Calendar access, going by the permission type names below.");
    if (statsig) lines.push("- Inference: it looks gated by a remote feature flag, going by the Statsig configuration error below.");
    lines.push("");
    for (const item of calendar.spans) lines.push(...entry(item));
    for (const item of calendar.symbols) {
      const byBinary = new Map();
      for (const hit of item.hits) (byBinary.get(hit.binary) ?? byBinary.set(hit.binary, []).get(hit.binary)).push(`${hex(hit.offset)}${hit.standalone ? " (a string on its own)" : ""}`);
      lines.push(`### ${item.title}`, "",
        `Source: ${[...byBinary].map(([name, offsets]) => `\`${binaryPath(name)}\` at ${offsets.join(", ")}`).join("; ")}; SHA-256 \`${item.sha256}\`.`, "",
        "Exact: these bytes occur at the listed offsets. Only the name is shown, not the metadata bytes around it.", "",
        ...textBlock(item.text), "");
    }
  }

  lines.push(...notFound(missing));
  return `${lines.join("\n").trimEnd()}\n`;
}

// ---------------------------------------------------------------------------------------------
// Command line.

function main() {
  const repo = path.resolve(import.meta.dirname, "..", "..");
  const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? path.resolve(process.argv[i + 1]) : null; };
  const outDir = arg("--out") ?? path.join(repo, "outputs");
  const workDir = arg("--work") ?? path.join(repo, "work");
  let layout;
  try {
    layout = codexApp();
    fs.accessSync(layout.resources, fs.constants.R_OK);
  } catch (error) {
    console.error(`bundle-resources: ${error.message}`);
    process.exit(2);
  }
  const plist = key => { try { return execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print ${key}`, layout.plist], { encoding: "utf8" }).trim(); } catch { return null; } };
  const app = { version: plist("CFBundleShortVersionString"), build: plist("CFBundleVersion") };
  const scanFiles = [layout.asar, layout.binary, path.join(layout.resources, "cua_node/bin/node_repl")];
  let cliSkills = new Map();
  try {
    const cli = JSON.parse(fs.readFileSync(path.join(outDir, "codex-cli-prompts.json"), "utf8"));
    cliSkills = new Map(cli.items.filter(item => item.document === CLI_SKILLS_PAGE).map(item => [item.sha256, item.source]));
  } catch { /* no CLI skills page yet: nothing to point to */ }
  let result;
  try { result = buildPages({ resources: layout.resources, app, scanFiles, cliSkills }); } catch (error) {
    if (error.code === "EACCES" || error.code === "EIO") { console.error(`bundle-resources: unreadable input: ${error.message}`); process.exit(2); }
    throw error;
  }

  const outputs = { ...result.pages, ...result.coverage };
  for (const [name, text] of Object.entries(outputs)) {
    if (/client-[A-Za-z0-9]{16,}/.test(text)) throw new Error(`${name} would publish a client key; refusing to write`);
  }
  const committed = name => { try { return execFileSync("git", ["show", `HEAD:outputs/${name}`], { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return null; } };
  const before = new Map([NAMES.plugins, NAMES.cu].map(name => [name, committed(name)]).filter(([, text]) => text != null));
  const changes = renderChangedDocuments(semanticDiff(before, new Map(Object.entries(result.pages))));
  const diffFile = path.join(workDir, "bundle-resources-diff.md");
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(workDir, { recursive: true });
  if (changes) fs.writeFileSync(diffFile, `# Bundled plugin and Computer Use prompt changes (${app.version} build ${app.build})\n\n${changes}`);
  else fs.rmSync(diffFile, { force: true });
  for (const [name, text] of Object.entries(outputs)) fs.writeFileSync(path.join(outDir, name), text);
  console.log(JSON.stringify({ generator: "bundle-resources", app_version: app.version, app_build: app.build, ...result.summary, diff: changes ? path.relative(repo, diffFile) : null }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
