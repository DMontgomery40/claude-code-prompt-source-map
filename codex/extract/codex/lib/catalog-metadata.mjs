// Model settings in the live catalog beyond the prompt text (context windows, reasoning
// levels, tool types, ...). The documents already cover prompt fields; this compares the rest
// between refreshes so a settings-only change is visible.
//
// Default deny: only PUBLIC_FIELDS are model properties whose values may appear in the public
// changelog. Any other changed field (access programs, availability and upgrade notices,
// service tiers, fields added later) is reported by name to the local operator only, because
// it may describe the account rather than the model.

import { canonicalCatalog } from "./catalog.mjs";

export const PUBLIC_FIELDS = new Set([
  "display_name", "description", "default_reasoning_level", "supported_reasoning_levels",
  "default_reasoning_summary", "shell_type", "supported_in_api", "support_verbosity", "default_verbosity",
  "apply_patch_tool_type", "web_search_tool_type", "truncation_policy", "supports_image_detail_original",
  "context_window", "max_context_window", "effective_context_window_percent", "experimental_supported_tools",
  "input_modalities", "supports_search_tool", "supports_experimental_context", "use_responses_lite",
  "supports_reasoning_effort_updates", "node_repl_auto_review_required", "node_repl_disabled", "tool_mode",
  "multi_agent_version", "multi_agent_reasoning_effort", "include_skills_usage_instructions",
  "include_plugin_usage_instructions", "include_apps_usage_instructions"
]);
const PROMPT_FIELDS = new Set(["slug", "model_messages", "base_instructions"]);

// { slug: { field: canonical JSON text } } with account and fetch keys removed at every depth.
export function catalogSnapshot(models) {
  return Object.fromEntries(models.map(model => [model.slug, Object.fromEntries(
    Object.keys(model).filter(field => !PROMPT_FIELDS.has(field)).sort().map(field => [field, canonicalCatalog(model[field])])
  )]));
}

// Changes between two snapshots, for models present in both (added and removed models are
// reported from the model list). Returns { public: [{slug, field, before, after}], private: [{slug, field}] }.
export function metadataDiff(before, after) {
  const changes = { public: [], private: [] };
  for (const slug of Object.keys(after).filter(slug => slug in before)) {
    for (const field of [...new Set([...Object.keys(before[slug]), ...Object.keys(after[slug])])].sort()) {
      const was = before[slug][field];
      const now = after[slug][field];
      if (was === now) continue;
      if (PUBLIC_FIELDS.has(field)) changes.public.push({ slug, field, before: was ?? "(absent)", after: now ?? "(absent)" });
      else changes.private.push({ slug, field });
    }
  }
  return changes;
}
