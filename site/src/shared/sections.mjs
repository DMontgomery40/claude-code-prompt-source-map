// The sidebar sections both products use, in order. Every page belongs to exactly one of them;
// a product may leave a section empty. Do not add a section for a single feature: find the one
// whose `holds` fits (site/test/shared/sections.test.mjs fails on any other group label).
export const SECTIONS = [
  { id: "overview", label: "Overview",
    holds: "Findings and how a request is put together. What to read first." },
  { id: "instructions", label: "Model instructions",
    holds: "Instructions that ship with a model record: base and persistent instructions, instruction modules, other catalog models." },
  { id: "prompts", label: "Prompts",
    holds: "Text the harness or app writes to the model: system prompts, reminders, helper, feature, voice and CLI prompts, other model-facing text." },
  { id: "tools", label: "Tools and features",
    holds: "What the model can call and the product features that put content in or beside the conversation: tool manifests, agents, skills, plugins, Computer Use, voice tools, learning blocks, telephony." },
  { id: "configuration", label: "Configuration",
    holds: "What a user or admin sets: settings, config.toml, environment variables, hooks, CLI flags and commands, what wins." },
  { id: "build", label: "Build intel",
    holds: "Generated from each release's package, updated by the watcher: embedded payloads (binwalk), the package's files, entitlements, helpers, endpoints and flags, and new feature surfaces." },
  { id: "evidence", label: "Evidence and archive",
    holds: "Provenance inventories, raw captures, dated checks and earlier versions." }
];

export const SECTION_LABELS = SECTIONS.map(s => s.label);
