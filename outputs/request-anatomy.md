# What a request contains

Everything on this site is read from the current Claude Code release for macOS on Apple silicon. Prompt texts come from the files embedded in its binary, and each one carries its byte offset and hash; [Method and inventory](#provenance-md) names the exact build. This page describes the request itself, as captured from two real runs.

## How the requests were captured

Claude Code ran with a throwaway home directory, no settings, MCP servers, plugins, or memory, an empty non-git working directory, and a placeholder API key. Its API base URL pointed at a local recorder that saved each request body and answered with an error, so nothing reached Anthropic. One run used the interactive CLI and the other used `claude -p` (the SDK entrypoint). Signed-in subscription accounts, other models, other platforms, and configured settings, MCP servers, or plugins change parts of what follows.

## The main request, in order

A request is a `POST /v1/messages?beta=true` with these parts:

1. **System block 1**, not cached: `x-anthropic-billing-header: cc_version=<version>.<suffix>; cc_entrypoint=<entrypoint>;`. The entrypoint was `{{value:capture-summary cli.entrypoint}}` for the interactive run and `{{value:capture-summary sdk.entrypoint}}` for `claude -p`. The suffix differed between the title request and the main request.
2. **System block 2**, cached (`cache_control: ephemeral`): the identity line. The interactive CLI sends "{{value:capture-summary cli.identity}}" and `claude -p` sends "{{value:capture-summary sdk.identity}}"
3. **System block 3**, cached: the main system prompt. See [Main system prompt](#system-prompt-md) for every section and the conditions that include it.
4. **Tools**, sorted by name, with no `cache_control` of their own: {{value:capture-summary cli.tools}} in the interactive run and {{value:capture-summary sdk.tools}} with `claude -p`. See [Tools](#tools-md).
5. **First user message**: a `<system-reminder>` with commit and pull-request attribution rules, then the user's text as a separate content block.
6. **Final message, role `system`**, cached: the environment (working directory, git status, platform, shell, OS), the model name and ID, the knowledge cutoff, the available agent types, the available skills, and today's date. It was {{value:capture-summary cli.trailing_chars}} characters in the interactive run and {{value:capture-summary sdk.trailing_chars}} with `claude -p`.

The Messages API builds its cache prefix in the order tools, system, messages, so a change to any tool description or to the system blocks invalidates everything cached after it.

## Request parameters

~~~~~~text
model               {{value:capture-summary cli.model}} (the default for this install)
max_tokens          {{value:capture-summary cli.max_tokens as=raw}}
thinking            {{value:capture-summary cli.thinking}}  (claude -p: {{value:capture-summary sdk.thinking}})
output_config       {"effort":"{{value:capture-summary cli.effort}}"}
context_management  {{value:capture-summary cli.context_management}}
metadata.user_id    JSON string with device_id, account_uuid, session_id
stream              true
~~~~~~

The `anthropic-beta` header in both runs listed {{value:capture-summary betas_shared as=code}}. Sent only by the interactive run: {{value:capture-summary betas_cli_only as=code}}. Sent only by `claude -p`: {{value:capture-summary betas_sdk_only as=code}}.

## Side requests

Before the first model call, Claude Code sent `HEAD /api/hello`. In the interactive run it also sent a separate session-title request to the same model. That request carries the same billing and identity blocks, uses the title-naming prompt as its third system block, sends no tools, wraps the user's first message in `<session>` tags, and asks for structured output matching `{"title": string}` (extra beta {{value:capture-summary cli.title_request.betas_extra as=code}}). The prompt text is in [Background and utility prompts](#utility-prompts-md).

## Settings that change this shape

- `--exclude-dynamic-system-prompt-sections` moves per-machine sections (working directory, environment, memory paths, git status) out of the system prompt and into the first user message. Its help text says this improves cross-user prompt-cache reuse and applies only with the default system prompt.
- `--system-prompt`, `--system-prompt-file`, `--append-system-prompt`, and `--append-system-prompt-file` replace or extend the main system prompt.
- `--bare` sets `CLAUDE_CODE_SIMPLE=1`, which reduces the main system prompt to the working directory and date.
- Prompt caching can be disabled, lengthened, or shortened with environment variables. See [Environment variables](#environment-variables-md).
