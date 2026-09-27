# ChatGPT Work

ChatGPT Work is the product surface. GPT-6 Astra, GPT-6 Sol, and GPT-6 Luna are selectable models within it; individual test turns are named by the model selected for that turn.

## What the authenticated client exposes

| Surface | September 24, 2026 observation |
|---|---|
| Work model catalog, `GET /backend-api/tpp/models/` | Seven Work records: GPT-5.6 Sol, GPT-5.6 Terra, GPT-5.6 Luna, GPT-5.5, GPT-6 Astra, GPT-6 Sol, and GPT-6 Luna. The GPT-6 slugs are `gpt-6-astra-wm`, `gpt-6-sol-wm`, and `gpt-6-luna-wm`. None of the records has a prompt or instruction field. |
| Conversation initialization | The observed Work session defaulted to `gpt-6-luna-wm`. This is a selection default, not an instruction disclosure. |
| GPT-6 Luna test turn | The client request selected `gpt-6-luna-wm` and sent one user message. No system, developer, base-instruction, or persistent-instruction field appeared. The visible response matched the requested exact token. |
| GPT-6 Astra test turn | The client request selected `gpt-6-astra-wm` and sent one user message. The same instruction fields were absent. The visible response matched the requested exact token. |
| GPT-6 Sol test turn | The client request selected `gpt-6-sol-wm` and sent one user message. The same instruction fields were absent. The visible response matched the requested exact token. |
| Work voice prefetch | An automatic `/realtime/wm` prefetch selected `chat_mode: "work"`, `backend_model: "gpt-6-luna-wm"`, `voice_mode: "wingman"`, and `client_tools: []`. This was not a completed microphone call. |

The sanitized three-model request record is published beside this report. Request identifiers, conversation identifiers, account data, and other private browser state were excluded.

## What is not recoverable at this boundary

The browser client does not transmit the Work service's system/developer instruction stack in the observed requests. That instruction layer can be assembled or injected server-side after the client request. Therefore:

- the three observations prove the selected GPT-6 model slugs and the absence of client-visible instruction fields;
- they do not prove that the models have no persistent instructions;
- they do not establish that the three Work models share one server-side prompt;
- they do not turn Codex model-catalog instructions into ChatGPT Work instructions.

The loaded Work JavaScript assets contained no `You are ChatGPT` base prompt. Prompt-like `You are Codex` strings recovered from the desktop package belong to Codex desktop helpers, app context, or voice orchestration and are published separately.

## Separate installed-app and cache check

The native ChatGPT/Codex desktop package at `/Applications/ChatGPT.app` was inspected separately from the live Work browser session. A Safari web-app wrapper at `~/Applications/ChatGPT.app` and the native app's `system-hints` and `models` cache response files were also checked without reading conversations or drafts. The system-hints cache contained routing and UI hint data; no GPT-6 Work instruction text was recovered. The model cache produced no prompt-like or codename string hit. These are negative local-artifact findings, not proof about server-side configuration.

Historical names such as Aeon, Daybreak, Mewfour, Nathree, and Persian were used only as discovery terms. They are not asserted as current Work model identities.
