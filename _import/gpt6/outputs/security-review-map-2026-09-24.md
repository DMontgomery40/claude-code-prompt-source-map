# Key findings

## ChatGPT Work

Authenticated test turns selected each of `gpt-6-astra-wm`, `gpt-6-sol-wm`, and `gpt-6-luna-wm`. Each browser request contained one user message and the model selection, with no client-visible system, developer, or prompt field. An automatic voice prefetch selected Luna and advertised an empty client tool list, but it was not a completed microphone call. The Work service's instructions and completed-call tool surface remain server-side or otherwise unobserved. [Work evidence](#chatgpt-work-source-check-2026-09-24-md) · [Sanitized three-model trace](#chatgpt-work-gpt6-client-trace-2026-09-24-json) · [Voice evidence](#voice-tool-surface-2026-09-24-md)

## Codex GPT-6

The Codex catalog exposes instruction records for Astra, Sol, and Luna. Ten of their eleven `model_messages` fields are identical, including `persistent_instructions`; each model has a different base `instructions_template`. The persistent text applies when that mode is enabled. [Model comparison](#codex-gpt6-model-prompt-comparison-2026-09-24-json) · [Astra](#gpt-6-astra-base-instructions-2026-09-24-md) · [Sol](#gpt-6-sol-base-instructions-2026-09-24-md) · [Luna](#gpt-6-luna-base-instructions-2026-09-24-md)

The provenance inventory hashes all 39 string leaves across the three records and 14 bundled desktop helper templates, and labels catalog defaults separately from conditional, bundled, and observed-active surfaces. [Prompt provenance inventory](#codex-prompt-provenance-inventory-2026-09-24-json) · [Helper prompts](#codex-desktop-helper-prompts-2026-09-24-md)

## Voice

The desktop package contains seven Codex voice prompt strings covering new and resumed conversations, coordination, memory, and realtime sessions. Their tool references describe Codex thread and screen actions; they do not establish a ChatGPT Work voice tool inventory. [Codex voice prompts](#codex-voice-prompts-2026-09-24-md) · [Tool surface](#voice-tool-surface-2026-09-24-md)

The earlier [Aeon core prompt](#aeon-core-instructions-md) remains in the historical archive. It is a separate source from the current Codex catalog.
