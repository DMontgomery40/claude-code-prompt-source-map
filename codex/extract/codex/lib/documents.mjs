import crypto from "node:crypto";
import path from "node:path";
import { GPT6_DOCUMENTED, pythonJson, scalarLeaves, stringLeaves } from "./catalog.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");
const stats = value => ({
  characters: value.length,
  bytes: Buffer.byteLength(value),
  lines: value.split("\n").length,
  sha256: sha256(value)
});
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const grouped = number => number.toLocaleString("en-US");

export const OUTPUT_NAMES = {
  persistent: "persistent-instructions.md",
  base: slug => `${slug}-base-instructions.md`,
  modules: "gpt-6-instruction-modules.md",
  record: slug => `${slug}-model-record.json`,
  comparison: "model-comparison.json",
  metadata: "capture-metadata.json",
  helper: "desktop-helper-prompts.md",
  voice: "voice-prompts.md",
  inventory: "prompt-provenance-inventory.json",
  otherModels: "other-catalog-models.md",
  sources: "sources.json"
};

// Every file refresh.mjs may write under outputs/. Nothing else is touched.
export const OUTPUT_WHITELIST = [
  OUTPUT_NAMES.persistent,
  ...GPT6_DOCUMENTED.map(OUTPUT_NAMES.base),
  OUTPUT_NAMES.modules,
  ...GPT6_DOCUMENTED.map(OUTPUT_NAMES.record),
  OUTPUT_NAMES.comparison,
  OUTPUT_NAMES.metadata,
  OUTPUT_NAMES.helper,
  OUTPUT_NAMES.voice,
  OUTPUT_NAMES.inventory,
  OUTPUT_NAMES.otherModels,
  OUTPUT_NAMES.sources
];

const MODULE_EXCLUDED = new Set(["instructions_template", "persistent_instructions"]);
const moduleLeaves = model =>
  stringLeaves(model.model_messages, "").filter(leaf => !MODULE_EXCLUDED.has(leaf.path));

function modelRecord(model) {
  return {
    model_slug: model.slug,
    base_instructions: model.base_instructions,
    model_messages: model.model_messages,
    experimental_supported_tools: model.experimental_supported_tools,
    include_apps_usage_instructions: model.include_apps_usage_instructions,
    include_plugin_usage_instructions: model.include_plugin_usage_instructions,
    include_skills_usage_instructions: model.include_skills_usage_instructions,
    tool_mode: model.tool_mode
  };
}

// Astra's conditional modules, with any GPT-6 model whose module differs (or
// is missing, or has an extra module) shown inside the same `## path` section.
export function modulesMarkdown(gpt6) {
  const [primary, ...others] = gpt6;
  const leavesBy = new Map(gpt6.map(model => [model.slug, new Map(moduleLeaves(model).map(leaf => [leaf.path, leaf.value]))]));
  const primaryLeaves = leavesBy.get(primary.slug);
  const paths = [...primaryLeaves.keys()];
  for (const model of others) for (const leafPath of leavesBy.get(model.slug).keys()) if (!paths.includes(leafPath)) paths.push(leafPath);

  return paths.map(leafPath => {
    const parts = [];
    const base = primaryLeaves.get(leafPath);
    if (base != null) parts.push(`${base.trim()}\n`);
    else parts.push(`Not present in ${primary.slug}.\n`);
    for (const model of others) {
      const value = leavesBy.get(model.slug).get(leafPath);
      if (value === base && value != null) continue;
      parts.push(value == null ? `### Not present in ${model.slug}\n` : `### ${model.slug} variant\n\n${value.trim()}\n`);
    }
    return `## ${leafPath}\n\n${parts.join("\n")}`;
  }).join("\n---\n\n");
}

function fenced(text) {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map(match => match[0].length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  // Always one newline before the closing fence, so the fenced content minus
  // its final newline is the exact text, trailing newlines included.
  return `${fence}text\n${text}\n${fence}`;
}

function otherModelsMarkdown(others) {
  const seen = new Map();
  const blocks = [
    "# Other models in the Codex/ChatGPT catalog\n\n" +
      "Base instructions and model messages for every model in the live authenticated Codex/ChatGPT catalog other than GPT-6 Astra, Sol and Luna, in catalog order. " +
      "Each text is exact and fenced, so its own headings stay inside it. A text identical to one shown earlier points back to it instead of repeating it."
  ];
  for (const model of others) {
    const lines = [`# ${model.slug}`, "", `Display name: ${model.display_name ?? "none"}.`];
    const texts = [
      ...(typeof model.base_instructions === "string" ? [{ path: "base_instructions", value: model.base_instructions }] : []),
      ...stringLeaves(model.model_messages, "model_messages")
    ];
    const nulls = Object.entries(model.model_messages ?? {}).filter(([, value]) => value === null).map(([key]) => `\`${key}\``);
    const scalars = scalarLeaves(model.model_messages, "model_messages");
    if (nulls.length) lines.push("", `Model-message fields with no value: ${nulls.join(", ")}.`);
    if (scalars.length) lines.push("", `Non-text model-message values: ${scalars.map(leaf => `\`${leaf.path}\` = \`${JSON.stringify(leaf.value)}\``).join(", ")}.`);
    if (model.model_messages == null) lines.push("", "This model has no model messages.");
    for (const { path: leafPath, value } of texts) {
      const hash = sha256(value);
      lines.push("", `## ${leafPath}`, "");
      if (seen.has(hash)) {
        const first = seen.get(hash);
        lines.push(`Identical to \`${first.slug}\` · \`${first.path}\` (SHA-256 \`${hash}\`).`);
      } else {
        seen.set(hash, { slug: model.slug, path: leafPath });
        lines.push(`SHA-256 \`${hash}\` · ${Buffer.byteLength(value)} UTF-8 bytes.`, "", fenced(value));
      }
    }
    blocks.push(lines.join("\n"));
  }
  return `${blocks.join("\n\n---\n\n")}\n`;
}

function comparison(gpt6, cli) {
  const models = Object.fromEntries(gpt6.map(model => [
    model.slug,
    Object.fromEntries(Object.entries(model.model_messages).map(([field, value]) => {
      const serialised = pythonJson(value);
      return [field, { utf8_bytes: Buffer.byteLength(serialised), sha256: sha256(serialised) }];
    }))
  ]));
  const fields = [...new Set(gpt6.flatMap(model => Object.keys(model.model_messages)))];
  const identical = fields.filter(field => new Set(gpt6.map(model => models[model.slug][field]?.sha256 ?? "absent")).size === 1);
  return {
    source: `${cli.entrypoint} debug models`,
    surface: "Authenticated Codex/ChatGPT model catalog; this is not the ChatGPT Work model catalog.",
    hash_rule: "SHA-256 over the UTF-8 bytes of Python json.dumps(value, sort_keys=True, ensure_ascii=False) for each model_messages field.",
    models,
    common_fields_identical: identical,
    distinct_fields: fields.filter(field => !identical.includes(field))
  };
}

const helperHeader = version =>
  `# Codex/ChatGPT desktop helper prompt inventory\n\nExact bundled helper prompts recovered from ChatGPT desktop ${version}. These are separate from ChatGPT Work model instructions and the Codex/ChatGPT voice orchestration prompts. Dynamic values are replaced with angle-bracket placeholders before hashing. "Bundled default" means the client contains the template; it does not prove a particular helper ran during a particular user turn.`;

function helperMarkdown(app, prompts) {
  const statics = prompts.staticHelpers.map(item =>
    `# ${item.title}\n\nSource: \`${item.file}\`, offset ${grouped(item.offset)}, SHA-256 \`${item.fileSha256}\`.\n\n${item.text}`
  );
  const functions = prompts.functionHelpers.map(item =>
    `# ${item.title}\n\nSource: \`ChatGPT desktop ${app.version} app.asar -> ${path.posix.basename(item.file)}\`; field \`${item.field}\`; byte offset ${item.offset}; source file SHA-256 \`${item.fileSha256}\`; prompt SHA-256 \`${item.sha256}\`; source type **bundled**; status **bundled default**.${item.note ? ` ${item.note}` : ""}\n\n${item.text}`
  );
  return `${helperHeader(app.version)}\n\n${[...statics, ...functions].join("\n\n---\n\n")}\n`;
}

function voiceMarkdown(app, prompts) {
  const files = [...new Map(prompts.voice.map(item => [item.file, item.fileSha256])).entries()];
  const fileList = files.map(([file, fileSha]) => `\`${file}\` (SHA-256 \`${fileSha}\`)`).join(", ");
  const header = `# Codex/ChatGPT voice prompt inventory\n\nSource: ChatGPT desktop ${app.version}, \`app.asar\` → ${fileList}. These are bundled prompt strings or fallbacks. Runtime configuration can override several of them; this capture does not prove which variant was active for a specific call. The placeholders are preserved exactly as shipped. These strings belong to **Codex/ChatGPT voice**, not the ChatGPT Work instruction stack.`;
  const sections = prompts.voice.map(item => {
    const identifier = `${item.identifier ?? "anonymous"}${item.fallback ? " fallback" : ""}`;
    const where = files.length > 1 ? ` · \`${item.file}\`` : "";
    return `# ${item.title}\n\nSource identifier: \`${identifier}\`${where} · asset offsets ${grouped(item.offset)}–${grouped(item.endOffset)} · ${Buffer.byteLength(item.text)} UTF-8 bytes.\n\n${item.text}\n\n---`;
  });
  return `${header}\n\n${sections.join("\n\n")}\n`;
}

function inventory(app, prompts, gpt6) {
  const source = file => `ChatGPT desktop ${app.version} app.asar -> ${path.posix.basename(file)}`;
  const helperItem = item => ({
    id: item.id,
    title: item.title,
    source: source(item.file),
    source_file_sha256: item.fileSha256,
    field: item.field ?? `${item.identifier ?? "anonymous"} string literal`,
    byte_offset: item.offset,
    source_type: "bundled",
    activation_status: "bundled default",
    prompt_sha256: item.sha256,
    note: item.note ?? null,
    character_count: item.text.length
  });
  const recordFile = slug => GPT6_DOCUMENTED.includes(slug) ? OUTPUT_NAMES.record(slug) : OUTPUT_NAMES.otherModels;
  return {
    scope: `Recoverable GPT-6 Codex/ChatGPT model-message leaves, bundled Codex/ChatGPT desktop helper templates (${OUTPUT_NAMES.helper}) and bundled Codex/ChatGPT voice prompts (${OUTPUT_NAMES.voice}).`,
    hash_rule: "SHA-256 over exact UTF-8 prompt text. Dynamic helper values use the documented angle-bracket placeholders.",
    helper_prompts: [...prompts.staticHelpers, ...prompts.functionHelpers].map(helperItem),
    voice_prompts: prompts.voice.map(item => ({
      id: item.id,
      title: item.title,
      source: source(item.file),
      source_file_sha256: item.fileSha256,
      field: `${item.identifier ?? "anonymous"} string literal`,
      byte_offset: item.offset,
      source_type: "bundled",
      activation_status: item.fallback ? "bundled fallback; remote configuration can override" : "bundled default",
      prompt_sha256: item.sha256,
      character_count: item.text.length
    })),
    codex_model_message_leaves: gpt6.flatMap(model =>
      stringLeaves(model.model_messages, "model_messages").map(({ path: field, value }) => ({
        id: `${model.slug}:${field}`,
        model: model.slug,
        source: "current Codex/ChatGPT model catalog response",
        source_file: recordFile(model.slug),
        field,
        source_type: "authenticated remote catalog record",
        activation_status: field === "model_messages.instructions_template" ? "catalog default for model" : "catalog conditional or persistent module; active only when its condition applies",
        prompt_sha256: sha256(value),
        character_count: value.length
      }))
    ),
    detectable_omissions: [
      "ChatGPT Work service-side system/developer instructions are not present in the authenticated model catalog or observed client generation requests.",
      "Remote configuration can override bundled voice and desktop defaults; bundled presence is not proof of runtime activation.",
      "Playwright test-agent prompt files in the bundled computer-use dependency are third-party dependency prompts, not Codex/ChatGPT model defaults; they are inventoried as excluded dependency material.",
      "User-authored drafts, conversation history, credentials, and private cache payloads were intentionally excluded."
    ],
    excluded_dependency_prompts: app.dependencyPrompts
  };
}

// Builds every live document in memory. Nothing is written here.
export function buildDocuments({ app, cli, catalog, prompts }) {
  const gpt6All = catalog.live.filter(model => model.slug.startsWith("gpt-6"));
  const gpt6 = GPT6_DOCUMENTED.map(slug => catalog.live.find(model => model.slug === slug));
  const others = catalog.live.filter(model => !GPT6_DOCUMENTED.includes(model.slug));
  const astra = gpt6[0];
  const bundledAstra = catalog.bundled.find(model => model.slug === astra.slug);

  const docs = new Map();
  docs.set(OUTPUT_NAMES.persistent, astra.model_messages.persistent_instructions);
  for (const model of gpt6) docs.set(OUTPUT_NAMES.base(model.slug), model.base_instructions);
  const modules = modulesMarkdown(gpt6);
  docs.set(OUTPUT_NAMES.modules, modules);
  for (const model of gpt6) docs.set(OUTPUT_NAMES.record(model.slug), json(modelRecord(model)));
  docs.set(OUTPUT_NAMES.comparison, json(comparison(gpt6All, cli)));

  const astraModules = moduleLeaves(astra);
  docs.set(OUTPUT_NAMES.metadata, json({
    source: {
      app_version: app.version,
      app_build: app.build,
      cli_version: cli.version,
      binary_path: cli.binary,
      binary_sha256: cli.sha256,
      model_slug: astra.slug
    },
    verification: {
      authenticated_model_count: catalog.live.length,
      bundled_model_count: catalog.bundled.length,
      authenticated_base_equals_template: astra.base_instructions === astra.model_messages.instructions_template,
      persistent_matches_bundled: astra.model_messages.persistent_instructions === bundledAstra?.model_messages?.persistent_instructions,
      authenticated_base: stats(astra.base_instructions),
      bundled_base: typeof bundledAstra?.base_instructions === "string" ? stats(bundledAstra.base_instructions) : null,
      persistent_instructions: stats(astra.model_messages.persistent_instructions),
      conditional_module_count: astraModules.length,
      conditional_module_characters: astraModules.reduce((total, leaf) => total + leaf.value.length, 0),
      model_messages_snapshot: stats(docs.get(OUTPUT_NAMES.record(astra.slug))),
      conditional_modules_markdown: stats(modules)
    },
    outputs: {
      persistent: OUTPUT_NAMES.persistent,
      base: OUTPUT_NAMES.base(astra.slug),
      modules: OUTPUT_NAMES.modules,
      modelMessages: OUTPUT_NAMES.record(astra.slug),
      metadata: OUTPUT_NAMES.metadata
    }
  }));

  docs.set(OUTPUT_NAMES.helper, helperMarkdown(app, prompts));
  docs.set(OUTPUT_NAMES.voice, voiceMarkdown(app, prompts));
  docs.set(OUTPUT_NAMES.inventory, json(inventory(app, prompts, gpt6All)));
  docs.set(OUTPUT_NAMES.otherModels, otherModelsMarkdown(others));

  const promptFiles = new Map();
  for (const item of [...prompts.staticHelpers, ...prompts.functionHelpers, ...prompts.voice]) promptFiles.set(item.file, item.fileSha256);
  docs.set(OUTPUT_NAMES.sources, json({
    app: { bundle_id: app.bundleId, version: app.version, build: app.build, asar_sha256: app.asarSha256 },
    cli: { version: cli.version, binary_sha256: cli.sha256 },
    catalog: {
      fetched_at: catalog.fetchedAt,
      client_version: catalog.cacheClientVersion,
      models: catalog.live.map(model => model.slug),
      bundled_models: catalog.bundled.map(model => model.slug)
    },
    asar_prompt_files: Object.fromEntries([...promptFiles.entries()].sort(([a], [b]) => a.localeCompare(b))),
    documents: Object.fromEntries([...docs.entries()].map(([name, content]) => [name, { sha256: sha256(content), bytes: Buffer.byteLength(content) }]))
  }));

  for (const name of docs.keys()) if (!OUTPUT_WHITELIST.includes(name)) throw new Error(`refusing to write non-whitelisted output ${name}`);
  return docs;
}
