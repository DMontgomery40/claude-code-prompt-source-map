# What a request contains

Everything on this site is read from the current Claude Code release for macOS on Apple silicon. Prompt texts come from the files embedded in its binary, and each one carries its byte offset and hash; [Method and inventory](#provenance-md) names the exact build. This page describes the request itself, as captured from two real runs.

## How the requests were captured

Claude Code ran with a throwaway home directory, no settings, MCP servers, plugins, or memory, an empty non-git working directory, and a placeholder API key. Its API base URL pointed at a local recorder that saved each request body and answered with an error, so nothing reached Anthropic. One run used the interactive CLI and the other used `claude -p` (the SDK entrypoint). Signed-in subscription accounts, other models, other platforms, and configured settings, MCP servers, or plugins change parts of what follows.

## The main request, in order

A request is a `POST /v1/messages?beta=true` with these parts:

1. **System block 1**, not cached: `x-anthropic-billing-header: cc_version=<version>.<suffix>; cc_entrypoint=<entrypoint>;`. The entrypoint was `cli` for the interactive run and `sdk-cli` for `claude -p`. The suffix differed between the title request and the main request.
2. **System block 2**, cached (`cache_control: ephemeral`): the identity line. The interactive CLI sends "You are Claude Code, Anthropic's official CLI for Claude." and `claude -p` sends "You are a Claude agent, built on Anthropic's Claude Agent SDK."
3. **System block 3**, cached: the main system prompt. See [Main system prompt](#system-prompt-md) for every section and the conditions that include it.
4. **Tools**, sorted by name, with no `cache_control` of their own: 31 in the interactive run and 23 with `claude -p`. See [Tools](#tools-md).
5. **First user message**: a `<system-reminder>` with commit and pull-request attribution rules, then the user's text as a separate content block.
6. **Final message, role `system`**, cached: the environment (working directory, git status, platform, shell, OS), the model name and ID, the knowledge cutoff, the available agent types, the available skills, and today's date. It was 9,069 characters in the interactive run and 7,600 with `claude -p`.

The Messages API builds its cache prefix in the order tools, system, messages, so a change to any tool description or to the system blocks invalidates everything cached after it.

## Request parameters

~~~~~~text
model               claude-opus-5-5 (the default for this install; the prompt names it "claude-opus-5-5[1m]")
max_tokens          128000
thinking            {"type": "adaptive"}  (claude -p adds "display": "omitted")
output_config       {"effort": "medium"}
context_management  {"edits": [{"type": "clear_thinking_20251015", "keep": "all"}]}
metadata.user_id    JSON string with device_id, account_uuid, session_id
stream              true
~~~~~~

The `anthropic-beta` header listed `claude-code-20250219`, `context-1m-2025-08-07`, `interleaved-thinking-2025-05-14`, `thinking-token-count-2026-05-13`, `context-management-2025-06-27`, `prompt-caching-scope-2026-01-05`, `mid-conversation-system-2026-04-07`, `per-turn-control-2026-07-01`, `mid-conversation-tool-changes-2026-07-01`, `advisor-tool-2026-03-01`, `effort-2025-11-24`, and `fallback-credit-2026-06-01`. The interactive run also sent `redact-thinking-2026-02-12`.

## Side requests

Before the first model call, Claude Code sent `HEAD /api/hello`. In the interactive run it also sent a separate session-title request to the same model. That request carries the same billing and identity blocks, uses the title-naming prompt as its third system block, sends no tools, wraps the user's first message in `<session>` tags, and asks for structured output matching `{"title": string}` (beta `structured-outputs-2025-12-15`). The prompt text is in [Background and utility prompts](#utility-prompts-md).

## Settings that change this shape

- `--exclude-dynamic-system-prompt-sections` moves per-machine sections (working directory, environment, memory paths, git status) out of the system prompt and into the first user message. Its help text says this improves cross-user prompt-cache reuse and applies only with the default system prompt.
- `--system-prompt`, `--system-prompt-file`, `--append-system-prompt`, and `--append-system-prompt-file` replace or extend the main system prompt.
- `--bare` sets `CLAUDE_CODE_SIMPLE=1`, which reduces the main system prompt to the working directory and date.
- Prompt caching can be disabled, lengthened, or shortened with environment variables. See [Environment variables](#environment-variables-md).
