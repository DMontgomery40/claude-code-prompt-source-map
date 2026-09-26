// Claude Code attachments that some versions log without their rendered text and without a text
// field: the text is rebuilt from the templates ccprompts publishes, filled from the row's fields.
// The site build copies the templates named here into reference-index.json ("templates", from
// outputs/system-reminders.json and outputs/system-prompt.json). No imports: model.js uses this to
// read a rebuilt block, the adapter to measure one, the site build for the ids.

export const TEMPLATE_IDS = [
  "system-reminder-wrapper",
  "trailing-environment", "trailing-worktree-note", "trailing-worktree-stash", "trailing-scratchpad",
  "trailing-session-context", "trailing-date", "date-attachment-changed",
  "auto-mode", "auto-mode-consent", "auto-mode-bash-first-strict", "auto-mode-bash-first-relaxed", "auto-mode-bypass", "auto-mode-steer-only",
  "attribution-reminder", "attribution-reminder-none", "attribution-precedence-default", "attribution-precedence-managed",
  "attribution-commit-line", "attribution-pr-line", "attribution-send-file-hint",
  "bash-output-audience-note",
];

// Keys that are the log's bookkeeping, not text the model was sent.
const INTERNAL = new Set(["type", "toolUseID", "uuid"]);
const CONTEXT_ORDER = ["userEmail", "attachedProject", "gitStatus", "perforceMode"];

// Fills {{slot}}s; null when a slot is left over (the fields don't say what goes there).
function fill(text, values) {
  let missing = false;
  const out = text.replace(/\{\{([^}]+)\}\}/g, (m, k) => (Object.prototype.hasOwnProperty.call(values, k) && values[k] != null ? String(values[k]) : ((missing = true), m)));
  return missing ? null : out;
}

// The rebuilt body for one attachment type, and the template it mainly follows; null when a template
// is missing or the fields leave a choice the templates don't settle.
const BUILDERS = {
  environment(a, T) {
    const s = a.snapshot;
    // A row with `changes` was sent as an "Environment update", which the site doesn't publish.
    if (!s || !s.workingDirectory || (Array.isArray(a.changes) && a.changes.length)) return null;
    // Extra bullets go after the lines holding the working directory and git slots.
    const tl = T("trailing-environment").split("\n");
    const at = (slot) => tl.findIndex((l) => l.includes(slot));
    const cwd = at("{{CWD}}"), git = at("{{IS_GIT_REPO}}");
    if (cwd < 0 || git < 0) return null;
    const out = tl.map((l) => fill(l, { CWD: s.workingDirectory, IS_GIT_REPO: String(!!s.isGitRepo), PLATFORM: s.platform, SHELL: s.shell || "unknown", OS_VERSION: s.osVersion }));
    if (out.includes(null)) return null;
    const more = s.additionalWorkingDirectories || [];
    if (more.length) out.splice(git + 1, 0, " - Additional working directories:", ...more.map((d) => `  - ${d}`));
    if (s.isWorktree) out.splice(cwd + 1, 0, ` - ${T("trailing-worktree-note")}`, ` - ${T("trailing-worktree-stash")}`);
    if (s.scratchpadDirectory) out.push(` - ${fill(T("trailing-scratchpad"), { SCRATCHPAD_DIR: s.scratchpadDirectory })}`);
    return { text: out.join("\n"), id: "trailing-environment" };
  },
  session_context(a, T) {
    const c = a.context || {};
    const keys = [...CONTEXT_ORDER.filter((k) => c[k] != null), ...Object.keys(c).filter((k) => !CONTEXT_ORDER.includes(k) && c[k] != null)];
    if (!keys.length || a.reason) return null;
    let text = fill(T("trailing-session-context"), { CONTEXT_ENTRIES: keys.map((k) => `# ${k}\n${typeof c[k] === "string" ? c[k] : JSON.stringify(c[k])}`).join("\n") });
    if (text != null && a.changed) text = text.replace(/^.*\n/, "The session context has changed; these values replace the earlier ones:\n");
    return text == null ? null : { text, id: "trailing-session-context" };
  },
  date(a, T) {
    if (!a.date) return null;
    return a.changed ? { text: fill(T("date-attachment-changed"), { date: a.date }), id: "date-attachment-changed" } : { text: fill(T("trailing-date"), { DATE: a.date }), id: "trailing-date" };
  },
  auto_mode(a, T) {
    const steer = a.bashFirst ? T(a.bashFirstSteer === "relaxed" ? "auto-mode-bash-first-relaxed" : "auto-mode-bash-first-strict") : null;
    if (a.bypass || a.steerOnly) {
      const id = a.bypass ? "auto-mode-bypass" : "auto-mode-steer-only";
      return steer == null ? null : { text: fill(T(id), { "expr:w": steer }), id };
    }
    return { text: T("auto-mode") + (a.autoModeConsentFlow ? T("auto-mode-consent") : "") + (steer ? `\n\n${steer}` : ""), id: "auto-mode" };
  },
  remote_session_change(a, T) {
    const lines = [];
    if (a.commit) lines.push(fill(T("attribution-commit-line"), { commit: a.commit }));
    if (a.pr) lines.push(fill(T("attribution-pr-line"), { pr: a.pr }));
    const hint = a.sendUserFileHint ? T("attribution-send-file-hint") : "";
    if (!lines.length) return { text: T("attribution-reminder-none") + hint, id: "attribution-reminder-none" };
    const set = [a.commit && a.managedCommit, a.pr && a.managedPr].filter(Boolean).length;
    // Mixed managed and user lines name each line in the clause; the fields don't give those names.
    if (set && set !== lines.length) return null;
    const text = fill(T("attribution-reminder"), { "expr:r": T(set ? "attribution-precedence-managed" : "attribution-precedence-default"), "expr:n.join(`\\n`)": lines.join("\n") });
    return text == null ? null : { text: text + hint, id: "attribution-reminder" };
  },
  bash_output_audience_note(a, T) {
    return { text: T("bash-output-audience-note"), id: "bash-output-audience-note" };
  },
};

// "key: value" lines for the row's fields, nested keys dotted, bookkeeping keys left out.
export function fieldLines(v, prefix = "") {
  const out = [];
  for (const [k, x] of Object.entries(v || {})) {
    if (INTERNAL.has(k) || x == null || x === "" || (Array.isArray(x) && !x.length)) continue;
    const key = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(x) && x.every((y) => y == null || typeof y !== "object")) out.push(`${key}: ${x.join(", ")}`);
    else if (Array.isArray(x)) x.forEach((y, i) => (y && typeof y === "object" ? out.push(...fieldLines(y, `${key}[${i}]`)) : out.push(`${key}[${i}]: ${y}`)));
    else if (typeof x === "object") out.push(...fieldLines(x, key));
    else out.push(`${key}: ${String(x).replace(/\n/g, "\n  ")}`);
  }
  return out;
}

// The text of a structured attachment: { text, template } rebuilt from `templates` (the reference
// index's map, id -> { text, ... }) when they cover this type and these fields, else the fields as
// "key: value" lines with template null.
export function attachmentText(type, a, templates) {
  const b = templates && Object.prototype.hasOwnProperty.call(BUILDERS, type) ? BUILDERS[type] : null;
  if (b) {
    let gap = false;
    const T = (id) => { const x = templates[id]; if (!x || typeof x.text !== "string") { gap = true; return ""; } return x.text; };
    const r = b(a || {}, T);
    const wrapped = r && r.text != null && !gap ? fill(T("system-reminder-wrapper"), { content: r.text }) : null;
    if (wrapped != null && !gap) return { text: wrapped, template: r.id };
  }
  return { text: fieldLines(a).join("\n"), template: null };
}
