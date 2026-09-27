// Semantic comparison of the previous and new live documents. Provenance that
// churns with every app build (file names, file hashes, offsets, minified
// identifiers, version strings) is stripped first, so only prompt text and
// catalog content count as change. Model records are compared whole.

const VOLATILE_JSON_KEYS = new Set([
  "source", "source_file", "source_file_sha256", "byte_offset", "field",
  "binary_sha256", "binary_path", "app_version", "app_build", "cli_version"
]);

// Headings that open a unit, per document kind. Headings inside fenced code
// blocks never count.
// Two-level documents: a group heading, then one unit per item one level below it. The value
// is the group heading's level ("# group" + "## item", or "## group" + "### item").
const TWO_LEVEL = {
  "other-catalog-models.md": 1,
  "codex-cli-prompts.md": 2, "codex-cli-bundled-skills.md": 2, "desktop-model-facing-text.md": 2,
  "chatgpt-conversation-prompts.md": 2, "chatgpt-gpt-builder-prompts.md": 2, "chatgpt-work-prompts.md": 2,
  "chatgpt-finance-health-prompts.md": 2, "chatgpt-sites-artifacts-prompts.md": 2,
  "chatgpt-bundled-plugins.md": 2, "computer-use-prompts.md": 2, "desktop-tool-manifest.md": 2
};

function unitHeading(name, line) {
  if (name === "gpt-6-instruction-modules.md") return /^## [a-z_]+\.[a-z0-9_.]+$/.test(line);
  if (TWO_LEVEL[name]) return new RegExp(`^#{${TWO_LEVEL[name]},${TWO_LEVEL[name] + 1}} \\S`).test(line);
  return /^# \S/.test(line);
}

const isProvenanceLine = line => /^Source( identifier)?: /.test(line);

export function markdownUnits(name, text) {
  const units = new Map();
  let key = "(preamble)";
  let parent = "";
  let lines = [];
  let fence = null;
  const flush = () => {
    let unique = key;
    for (let n = 2; units.has(unique); n++) unique = `${key} #${n}`;
    const body = lines.join("\n").replace(/\n+(---\n*)?$/, "").trim();
    if (body || key !== "(preamble)") units.set(unique, body);
  };
  for (const line of text.split("\n")) {
    const fenceMatch = /^(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length && line.trim() === fenceMatch[1]) fence = null;
    } else if (fenceMatch) {
      fence = fenceMatch[1];
    } else if (unitHeading(name, line)) {
      flush();
      const heading = line.replace(/^#+ /, "");
      const level = /^#+/.exec(line)[0].length;
      if (TWO_LEVEL[name] && level === TWO_LEVEL[name]) parent = heading;
      key = TWO_LEVEL[name] && level === TWO_LEVEL[name] + 1 ? `${parent} › ${heading}` : heading;
      lines = [];
      continue;
    }
    // Provenance lives only in the document preamble and in the first line
    // under a section heading; prompt bodies are compared verbatim.
    if (key === "(preamble)" && !fence) {
      if (!isProvenanceLine(line)) lines.push(line.replace(/ChatGPT desktop \d[\d.]*/g, "ChatGPT desktop <version>"));
    } else if (!(lines.every(existing => existing === "") && isProvenanceLine(line))) {
      lines.push(line);
    }
  }
  flush();
  return units;
}

export function jsonUnits(text, { keepAll = false } = {}) {
  const units = new Map();
  const walk = (value, keyPath) => {
    if (value && typeof value === "object") {
      if (Array.isArray(value) && value.every(item => item && typeof item === "object" && typeof item.id === "string")) {
        for (const item of value) walk(item, `${keyPath}[${item.id}]`);
        return;
      }
      for (const [key, child] of Object.entries(value)) {
        if (!keepAll && VOLATILE_JSON_KEYS.has(key)) continue;
        walk(child, keyPath ? `${keyPath}.${key}` : key);
      }
      return;
    }
    units.set(keyPath, typeof value === "string" ? value : JSON.stringify(value));
  };
  walk(JSON.parse(text), "");
  return units;
}

// Line-level unified diff (LCS). Falls back to a size note for huge inputs.
export function lineDiff(before, after, context = 2) {
  const a = before.split("\n");
  const b = after.split("\n");
  if (a.length * b.length > 4_000_000) return [`(texts differ: ${a.length} → ${b.length} lines; too large for a line diff)`];
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) ops.push([" ", a[i++]]), j++;
    else if (i < a.length && (j === b.length || table[i + 1][j] >= table[i][j + 1])) ops.push(["-", a[i++]]);
    else ops.push(["+", b[j++]]);
  }
  const keep = ops.map((op, index) => op[0] !== " " || ops.slice(Math.max(0, index - context), index + context + 1).some(near => near[0] !== " "));
  const out = [];
  ops.forEach((op, index) => {
    if (keep[index]) out.push(`${op[0]} ${op[1]}`);
    else if (keep[index - 1]) out.push("  …");
  });
  return out;
}

function compareUnits(before, after) {
  const changes = [];
  for (const [key, value] of after) {
    if (!before.has(key)) changes.push({ kind: "added", key, after: value });
    else if (before.get(key) !== value) changes.push({ kind: "changed", key, before: before.get(key), after: value });
  }
  for (const [key, value] of before) if (!after.has(key)) changes.push({ kind: "removed", key, before: value });
  return changes;
}

export function semanticDiff(previousDocs, newDocs) {
  const documents = [];
  for (const name of new Set([...previousDocs.keys(), ...newDocs.keys()])) {
    if (name === "sources.json") continue;
    const before = previousDocs.get(name);
    const after = newDocs.get(name);
    const bytesChanged = before !== after;
    if (before == null) {
      documents.push({ name, status: "new", bytesChanged, changes: [] });
      continue;
    }
    if (after == null) {
      documents.push({ name, status: "removed", bytesChanged, changes: [] });
      continue;
    }
    let changes;
    try {
      changes = name.endsWith(".json")
        ? compareUnits(jsonUnits(before, { keepAll: name.endsWith("-model-record.json") }), jsonUnits(after, { keepAll: name.endsWith("-model-record.json") }))
        : compareUnits(markdownUnits(name, before), markdownUnits(name, after));
    } catch (error) {
      changes = [{ kind: "changed", key: "(unparseable previous version)", before: String(error.message), after: "" }];
    }
    documents.push({ name, status: changes.length ? "changed" : "unchanged", bytesChanged, changes });
  }
  return documents;
}

const clip = value => (value.length > 300 ? `${value.slice(0, 300)}…` : value);
const fenceFor = lines => "`".repeat(Math.max(3, 1 + Math.max(0, ...lines.flatMap(line => [...line.matchAll(/`+/g)].map(match => match[0].length)))));

// Markdown summary of semantic changes; the empty string when there are none.
export function renderDiffMarkdown({ previousSources, sources, documents, notes, settings = [] }) {
  const beforeModels = previousSources?.catalog?.models ?? [];
  const added = sources.catalog.models.filter(slug => previousSources && !beforeModels.includes(slug));
  const removed = beforeModels.filter(slug => !sources.catalog.models.includes(slug));
  const changed = documents.filter(doc => doc.status !== "unchanged");
  if (!changed.length && !added.length && !removed.length && !settings.length) return "";

  const lines = ["# Codex refresh diff", ""];
  const pairs = [
    ["App version", previousSources?.app?.version, sources.app.version],
    ["App build", previousSources?.app?.build, sources.app.build],
    ["CLI version", previousSources?.cli?.version, sources.cli.version],
    ["Catalog fetched_at", previousSources?.catalog?.fetched_at, sources.catalog.fetched_at]
  ];
  for (const [label, before, after] of pairs) {
    lines.push(`- ${label}: ${before == null || before === after ? `\`${after}\`` : `\`${before}\` → \`${after}\``}`);
  }
  if (added.length) lines.push(`- Models added to the live catalog: ${added.map(slug => `\`${slug}\``).join(", ")}`);
  if (removed.length) lines.push(`- Models removed from the live catalog: ${removed.map(slug => `\`${slug}\``).join(", ")}`);
  for (const note of notes) lines.push(`- ${note}`);
  if (settings.length) {
    lines.push("", "## Model settings", "");
    for (const c of settings) lines.push(`- \`${c.slug}\` \`${c.field}\`: \`${clip(c.before)}\` → \`${clip(c.after)}\``);
  }
  lines.push("", renderChangedDocuments(changed));
  return `${lines.join("\n").trimEnd()}\n`;
}

// The "Changed documents" section alone, for callers with their own header.
export function renderChangedDocuments(documents) {
  const changed = documents.filter(doc => doc.status !== "unchanged");
  if (!changed.length) return "";
  const lines = ["## Changed documents", ""];
  for (const doc of changed) {
    const units = doc.changes.length ? ` (${doc.changes.map(change => `${change.kind}: ${change.key}`).join("; ")})` : "";
    lines.push(`- \`outputs/${doc.name}\`: ${doc.status}${units}`);
  }
  for (const doc of changed) {
    if (!doc.changes.length) continue;
    lines.push("", `### ${doc.name}`, "");
    for (const change of doc.changes) {
      lines.push(`#### ${change.kind}: ${change.key}`, "");
      if (change.kind === "changed" && (change.before.includes("\n") || change.after.includes("\n") || change.before.length > 120)) {
        const diff = lineDiff(change.before, change.after);
        const fence = fenceFor(diff);
        lines.push(`${fence}diff`, ...diff, fence, "");
      } else if (change.kind === "changed") {
        lines.push(`\`${clip(change.before)}\` → \`${clip(change.after)}\``, "");
      } else {
        const text = clip(change.after ?? change.before);
        const fence = fenceFor([text]);
        lines.push(`${fence}text`, text, fence, "");
      }
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
