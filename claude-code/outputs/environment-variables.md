# Environment variables read by Claude Code

Claude Code reads 1187 environment variables by name, plus 5 name patterns built at run time. 385 of the named variables are documented at code.claude.com and 802 are not. It also sets 471 variables for its own process, tools, hooks and other child processes; these are listed in their own section.

A name counts as read when code reads it from `process.env`, through the typed env accessor, through a helper that takes the name, or by iterating a list of names into `process.env`. Names that only appear as strings, or are only written for child processes, are excluded. Documented means the name appears on the env-vars docs page or in a table row on another docs page.

Prompt caching: DISABLE_PROMPT_CACHING* decide whether requests get cache markers, and the TTL resolves in this order: FORCE_PROMPT_CACHING_5M, then the *_PROMPT_CACHE_TTL variables, then settings, then agent frontmatter, then ENABLE_PROMPT_CACHING_1H. See the first section for details.

## Prompt caching

**Note:** the caching code differs in shape from the release these notes were traced against, so the notes below are pending re-verification.

The request path makes two decisions from code. The first is whether a request gets `cache_control` markers, which the DISABLE_PROMPT_CACHING* variables control. The second is the TTL those markers carry.

When caching is on, system-prompt blocks that have a cache scope carry `cache_control: {type: "ephemeral"}`, plus `ttl: "1h"` when the resolved TTL is 1 hour; a 5-minute TTL sends no `ttl` field, and globally scoped blocks also carry `scope: "global"`. Message cache markers use the same enable check and the same resolved TTL.

TTL resolution, first match wins:

1. FORCE_PROMPT_CACHING_5M sets 5m.
2. CLAUDE_CODE_PROMPT_CACHE_TTL for main-conversation requests, or CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL for all other requests (`5m` or `1h` only).
3. The settings `promptCacheTtl` / `subagentPromptCacheTtl`.
4. The agent's frontmatter TTL. A `1h` value is skipped while a subscriber is using overage.
5. ENABLE_PROMPT_CACHING_1H, or ENABLE_PROMPT_CACHING_1H_BEDROCK when the provider is Bedrock, sets 1h.
6. Otherwise, non-subscribers and subscribers using overage get 5m. Subscribers get 1h when the request's source is on a remotely configured allowlist, which defaults to the main-conversation sources, and 5m otherwise.

Only step 5's BEDROCK variant depends on the provider. The per-model disables compare against resolved model IDs, as noted per variable.

### `CLAUDE_CODE_PROMPT_CACHE_TTL`

Source: `chunk-acxptg39.js` · offset 188864593 · sha256 `ac07578b…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for main-conversation requests: the interactive main thread, SDK, auto-mode and memory-relevance requests. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the promptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for the main conversation: your interactive, `-p`, and SDK turns, plus the helpers that run inline with them.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_CACHE_EVICT`

Source: `chunk-acxptg39.js` · offset 188971296 · sha256 `3f7f893f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, and two internal capability checks pass, a request that asks to evict its cache on completion gets the prompt-caching evict beta. Its cache_control marker then carries evict_on_complete: true. When unset, a remote feature flag decides.

**Undocumented**

### `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`

Source: `chunk-acxptg39.js` · offset 188864624 · sha256 `48e6265c…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for every request that is not a main-conversation request, such as subagents and background work. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the subagentPromptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for requests outside the main conversation, such as subagents, workflows, and background work.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`

Source: `chunk-t65a4tk3.js` · offset 199711176 · sha256 `ccab5fa7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From code: Read as an integer. The stagger wait is 0 when DISABLE_PROMPT_CACHING is truthy.

From docs: Upper bound in milliseconds on how long a workflow agent waits for a same-prefix sibling's first response to begin before sending its own first request.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING`

Source: `chunk-acxptg39.js` · offset 188961014 · sha256 `f7c692cd…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false for every model. It is checked before the per-model variables, so it overrides them. That check applies whenever a caller does not pass its own caching flag. No caller in this build passes a literal true; several internal side requests pass a literal false, and a few forward a value that this reference does not trace. It also sets the workflow same-prefix stagger wait to 0. When it or the HAIKU, OPUS, SONNET or FABLE variable is truthy, a warning notice reads "Prompt caching off ({{DISABLED_CACHE_VARS}}), requests will be slower and cost more · unset it to re-enable". {{DISABLED_CACHE_VARS}} is the set variables from that list of five, joined with ", ".

From docs: Set to `1` to disable prompt caching for all models (takes precedence over per-model settings)

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_FABLE`

Source: `chunk-acxptg39.js` · offset 188961349 · sha256 `68dddb81…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-fable-" or equals ANTHROPIC_DEFAULT_FABLE_MODEL after normalization.

From docs: Set to `1` to disable prompt caching for Fable models

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_HAIKU`

Source: `chunk-acxptg39.js` · offset 188961051 · sha256 `6d1a40ff…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only for a request whose model equals the resolved small/fast model. That model must also differ from the main-loop model. The check runs only when a small/fast model applies: ANTHROPIC_SMALL_FAST_MODEL or ANTHROPIC_DEFAULT_HAIKU_MODEL is set, or an internal provider/login condition holds.

From docs: Set to `1` to disable prompt caching for Haiku models

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_MYTHOS`

Source: `chunk-acxptg39.js` · offset 188961410 · sha256 `def68dd6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-mythos-". The "Prompt caching off" warning notice does not list it.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

**Undocumented**

### `DISABLE_PROMPT_CACHING_OPUS`

Source: `chunk-acxptg39.js` · offset 188961286 · sha256 `d6bb0579…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Opus model: ANTHROPIC_DEFAULT_OPUS_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Opus models", but this check does not match other Opus model IDs.

From docs: Set to `1` to disable prompt caching for Opus models

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_SONNET`

Source: `chunk-acxptg39.js` · offset 188961221 · sha256 `4dfe1b5a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Sonnet model: ANTHROPIC_DEFAULT_SONNET_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Sonnet models", but this check does not match other Sonnet model IDs.

From docs: Set to `1` to disable prompt caching for Sonnet models

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H`

Source: `chunk-acxptg39.js` · offset 188864881 · sha256 `2c1b2543…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. When truthy, requests with no FORCE_PROMPT_CACHING_5M, no TTL variable, no TTL setting and no agent-frontmatter TTL get the 1-hour TTL. The resolver does not restrict it by provider or model. It is evaluated before the subscriber and overage fallback, so it also applies to non-subscribers and during overage.

From docs: Set to `1` to request a 1-hour prompt cache TTL instead of the default 5 minutes.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H_BEDROCK`

Source: `chunk-acxptg39.js` · offset 188864927 · sha256 `805c531a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. Has the same effect as ENABLE_PROMPT_CACHING_1H, but only when the provider is Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK).

From docs: Deprecated.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_PROMPT_CACHING_5M`

Source: `chunk-acxptg39.js` · offset 188864511 · sha256 `7e522f80…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 1 of TTL resolution. When truthy, every request resolved through the TTL resolver gets the 5-minute TTL, ahead of all TTL variables, settings and agent frontmatter.

From docs: Set to `1` to force the 5-minute prompt cache TTL even when 1-hour TTL would otherwise apply.

Evidence (offsets): cache control builder `chunk-acxptg39.js` @ 188961471 · caching off notice `chunk-scd694cx.js` @ 207544187 · ttl resolver `chunk-acxptg39.js` @ 188864485

Documented: https://code.claude.com/docs/en/env-vars

## Claude Code and Anthropic

### `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`

Source: `chunk-721k6cws.js` · offset 181722976 · sha256 `141c63d2…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181722976.

**Undocumented**

### `AI_AGENT`

Source: `chunk-mp724wza.js` · offset 178869446 · sha256 `53cd51cc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-mp724wza.js` offset 178869446.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-9tpza09x.js` · offset 203699475 · sha256 `15d71a5f…` · 31 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 10 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key sent as `X-Api-Key` header.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-cnrzxz4r.js` · offset 185146468 · sha256 `3298dcb6…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BASE_URL`

Source: `chunk-5g8p9x0b.js` · offset 196224648 · sha256 `7e406881…` · 49 read sites

Read as: string (trimmed; empty is treated as unset). Values: `https://api-staging.anthropic.com`. Default (from code): `https://api.anthropic.com`.

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the API endpoint to route requests through a proxy or gateway.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BETAS`

Source: `chunk-5g8p9x0b.js` · offset 196176187 · sha256 `7f59f23c…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Comma-separated list of additional `anthropic-beta` header values to include in API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-9c8h1t30.js` · offset 216121070 · sha256 `da1f3b83…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216121070.

**Undocumented**

### `ANTHROPIC_CUSTOM_HEADERS`

Source: `chunk-j7rgjcpa.js` · offset 185924877 · sha256 `251d5fb7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION`

Source: `chunk-5g8p9x0b.js` · offset 196188190 · sha256 `365f3ebd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID to add as a custom entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`

Source: `chunk-j7rgjcpa.js` · offset 185888628 · sha256 `9a56865d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`

Source: `chunk-j7rgjcpa.js` · offset 185888568 · sha256 `e9d17412…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL`

Source: `chunk-721k6cws.js` · offset 181751490 · sha256 `bab142cc…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Model ID that the `fable` alias resolves to, and the ID Claude Code recognizes as a Fable model for automatic model fallback on third-party providers.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_DESCRIPTION`

Source: `chunk-j7rgjcpa.js` · offset 185876610 · sha256 `a2a27d85…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Fable model`.

From docs: Display description for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME`

Source: `chunk-j7rgjcpa.js` · offset 185876573 · sha256 `c1c1562e…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-721k6cws.js` · offset 181751586 · sha256 `bcacaca2…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`

Source: `chunk-j7rgjcpa.js` · offset 185880093 · sha256 `a6617ffb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Haiku model`.

From docs: Display description for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`

Source: `chunk-j7rgjcpa.js` · offset 185880056 · sha256 `ede3ae9d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_MODEL`

Source: `chunk-5g8p9x0b.js` · offset 196179970 · sha256 `5f40fa89…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model that new sessions start on by default.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-721k6cws.js` · offset 181751522 · sha256 `bc028f5f…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-721k6cws.js` · offset 181757716 · sha256 `3929d889…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-721k6cws.js` · offset 181757815 · sha256 `d8c31deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-721k6cws.js` · offset 181751553 · sha256 `f81df586…` · 16 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`

Source: `chunk-j7rgjcpa.js` · offset 185875271 · sha256 `061abab4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`

Source: `chunk-j7rgjcpa.js` · offset 185875233 · sha256 `3fb9026d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ENVIRONMENT_ID`

Source: `chunk-j7rgjcpa.js` · offset 185379551 · sha256 `18a88cec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185379551.

**Undocumented**

### `ANTHROPIC_ENVIRONMENT_KEY`

Source: `chunk-j7rgjcpa.js` · offset 185379668 · sha256 `ea679e4a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185379668.

**Undocumented**

### `ANTHROPIC_FEDERATION_RULE_ID`

Source: `chunk-z62ps7p2.js` · offset 181254475 · sha256 `3c95f8b4…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Federation rule ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_IDENTITY_TOKEN`

Source: `chunk-87xn6mvq.js` · offset 184960241 · sha256 `a7edd7ce…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-87xn6mvq.js` offset 184960241.

**Undocumented**

### `ANTHROPIC_IDENTITY_TOKEN_FILE`

Source: `chunk-87xn6mvq.js` · offset 184951690 · sha256 `81e5cb38…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-87xn6mvq.js` offset 184951690.

**Undocumented**

### `ANTHROPIC_LOG`

Source: `chunk-j7rgjcpa.js` · offset 185332565 · sha256 `17e182d9…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185332565.

**Undocumented**

### `ANTHROPIC_MODEL`

Source: `chunk-721k6cws.js` · offset 181761033 · sha256 `9effd817…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Name of the model setting to use (see Model Configuration)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ORGANIZATION_ID`

Source: `chunk-z62ps7p2.js` · offset 181254417 · sha256 `cf9ebbc1…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Organization ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_PROFILE`

Source: `chunk-9c8h1t30.js` · offset 216121257 · sha256 `f029bb2b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

From docs: Name of the Anthropic profile to authenticate with, such as one created by `ant auth login` or by signing in to a Console account without an API key.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SCOPE`

Source: `chunk-87xn6mvq.js` · offset 184952059 · sha256 `86d9ad9c…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-87xn6mvq.js` offset 184952059.

**Undocumented**

### `ANTHROPIC_SERVICE_ACCOUNT_ID`

Source: `chunk-87xn6mvq.js` · offset 184951971 · sha256 `ecd05269…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-87xn6mvq.js` offset 184951971.

**Undocumented**

### `ANTHROPIC_SESSION_ID`

Source: `chunk-j7rgjcpa.js` · offset 185379598 · sha256 `3678dff9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185379598.

**Undocumented**

### `ANTHROPIC_SMALL_FAST_MODEL`

Source: `chunk-acxptg39.js` · offset 188871352 · sha256 `263f23ef…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: \[DEPRECATED] Name of Haiku-class model for background tasks

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_UNIX_SOCKET`

Source: `chunk-cnrzxz4r.js` · offset 185146736 · sha256 `cd7cb418…` · 38 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 25 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-cnrzxz4r.js` offset 185146736.

**Undocumented**

### `ANTHROPIC_WEBHOOK_SIGNING_KEY`

Source: `chunk-j7rgjcpa.js` · offset 185468828 · sha256 `1b8e192d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185468828.

**Undocumented**

### `ANTHROPIC_WORK_ID`

Source: `chunk-j7rgjcpa.js` · offset 185379507 · sha256 `8af7c519…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185379507.

**Undocumented**

### `ANTHROPIC_WORK_SECRET`

Source: `chunk-j7rgjcpa.js` · offset 185379726 · sha256 `24c57207…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185379726.

**Undocumented**

### `ANTHROPIC_WORKSPACE_ID`

Source: `chunk-z62ps7p2.js` · offset 181254345 · sha256 `21f00b3c…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Workspace ID for workload identity federation.

Documented: https://code.claude.com/docs/en/env-vars

### `API_FORCE_IDLE_TIMEOUT`

Source: `chunk-g5brps3g.js` · offset 180163183 · sha256 `a01398ac…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the 5-minute body idle timeout that aborts a streaming model response when no bytes arrive.

Documented: https://code.claude.com/docs/en/env-vars

### `API_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 188966083 · sha256 `a888de25…` · 6 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647).

Documented: https://code.claude.com/docs/en/env-vars

### `AUTOMODE_DECISION_LOG`

Source: `chunk-acxptg39.js` · offset 189480313 · sha256 `1e7c0dc0…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-acxptg39.js` offset 189480313.

**Undocumented**

### `BASH_DEFAULT_TIMEOUT_MS`

Source: `chunk-qs6rwaph.js` · offset 185123569 · sha256 `553fd156…`

Read as: string (raw value; further parsing not traced).

From docs: Default timeout for long-running bash commands (default: 120000, or 2 minutes)

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-wka9yqdb.js` · offset 186503938 · sha256 `0e7a1c0d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_TIMEOUT_MS`

Source: `chunk-qs6rwaph.js` · offset 185123684 · sha256 `b63207f0…`

Read as: string (raw value; further parsing not traced).

From docs: Maximum timeout the model can set for long-running bash commands (default: 600000, or 10 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `BUGHUNTER_DEV_BUNDLE_B64`

Source: `chunk-5yndqfks.js` · offset 200176855 · sha256 `9dd8b661…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-5yndqfks.js` offset 200176855.

**Undocumented**

### `BUGHUNTER_FLEET_SIZE`

Source: `chunk-p0xmgba0.js` · offset 194961927 · sha256 `73c58ba3…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-p0xmgba0.js` offset 194961927.

**Undocumented**

### `CCR_ENABLE_BUNDLE`

Source: `chunk-acxptg39.js` · offset 189806444 · sha256 `19d54f8c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 189806444.

**Undocumented**

### `CCR_FORCE_BUNDLE`

Source: `chunk-acxptg39.js` · offset 189806424 · sha256 `3071d65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force `claude --cloud` to bundle and upload your local repository instead of cloning from its remote

Documented: https://code.claude.com/docs/en/env-vars

### `CCR_ON_BRANCH_DEFAULT_GUARD`

Source: `chunk-acxptg39.js` · offset 190158369 · sha256 `2763e2c9…` · 2 read sites

Read as: enum (compared against fixed values). Values: `enforce`, `observe`, `off`.

Undocumented; read at `chunk-acxptg39.js` offset 190158369.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-721k6cws.js` · offset 181670626 · sha256 `4ea4f741…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181670626.

**Undocumented**

### `CCR_SHR_SSE_HINTS`

Source: `chunk-k2pjtcda.js` · offset 191839399 · sha256 `927ca514…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191839399.

**Undocumented**

### `CCR_SPAWN_TIMESTAMP_MS`

Source: `chunk-1rz02a15.js` · offset 181033858 · sha256 `628d65dc…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1rz02a15.js` offset 181033858.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-5bxd66qx.js` · offset 202538691 · sha256 `d6342530…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5bxd66qx.js` offset 202538691.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-mcm8e5ww.js` · offset 209122406 · sha256 `2959d146…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-mcm8e5ww.js` · offset 209122360 · sha256 `3d44032d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-acxptg39.js` · offset 186924380 · sha256 `0da64453…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 186924380.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-j7rgjcpa.js` · offset 185924212 · sha256 `eab56788…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185924212.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-acxptg39.js` · offset 188296528 · sha256 `763e9be8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-kmsvjk2z.js` · offset 202936717 · sha256 `66e944f3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kmsvjk2z.js` offset 202936717.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-tgymbs42.js` · offset 214169460 · sha256 `af756a02…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-721k6cws.js` · offset 181532382 · sha256 `8c91e3c2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unknown`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181532382.

**Undocumented**

### `CLAUDE_AGENTS_AUTO_RELAUNCHED_AT`

Source: `chunk-zdwxqbe3.js` · offset 197389648 · sha256 `9c7f1ce1…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-zdwxqbe3.js` offset 197389648.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-4mmvdwwg.js` · offset 186801520 · sha256 `05b80a80…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4mmvdwwg.js` offset 186801520.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-xktn8sdm.js` · offset 193753807 · sha256 `bd85f0b2…` · 6 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-xktn8sdm.js` offset 193753807.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-a29gkqzd.js` · offset 194446619 · sha256 `159c9a8a…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true.

From docs: Stall timeout in milliseconds for subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-zxdv16fz.js` · offset 194511302 · sha256 `ddd26c0c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-acxptg39.js` · offset 187941983 · sha256 `0e787485…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_ANNOUNCEMENT_HOLD_MS`

Source: `chunk-74872e8h.js` · offset 181223911 · sha256 `ca3d0c6f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `1000`.

Undocumented; read at `chunk-74872e8h.js` offset 181223911.

**Undocumented**

### `CLAUDE_AX_PREPARK_MS`

Source: `chunk-74872e8h.js` · offset 181223486 · sha256 `7763481a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `0`.

From docs: In screen reader mode, how many milliseconds Claude Code waits, with the cursor at the start of the line, before it writes a new or changed line.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_REWRITE_HELD_ANNOUNCEMENT`

Source: `chunk-74872e8h.js` · offset 181223537 · sha256 `a95eaa80…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-74872e8h.js` offset 181223537.

**Undocumented**

### `CLAUDE_AX_SCREEN_READER`

Source: `chunk-74872e8h.js` · offset 181221965 · sha256 `e9ec58b6…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to render screen-reader friendly output: flat text without decorative borders or animations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_STARTUP_QUIET_MS`

Source: `chunk-74872e8h.js` · offset 181223364 · sha256 `c9ed3776…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

From docs: In screen reader mode, how many milliseconds Claude Code holds the first interface render after the startup confirmation line, so your screen reader can speak the line in full before new output interrupts it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-q3se8bhm.js` · offset 179088615 · sha256 `5509dbb8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-kx3hbyfc.js` · offset 181282062 · sha256 `b23ee675…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kx3hbyfc.js` offset 181282062.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-q308nzmf.js` · offset 212381294 · sha256 `761beb70…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Values: `daemon`.

Undocumented; read at `chunk-q308nzmf.js` offset 212381294.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-7jz8j2fc.js` · offset 193455218 · sha256 `b9127893…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7jz8j2fc.js` offset 193455218.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-z62ps7p2.js` · offset 181259525 · sha256 `479c8291…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181259525.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-z62ps7p2.js` · offset 181259462 · sha256 `75c57711…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181259462.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-acxptg39.js` · offset 187617675 · sha256 `4c46686e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `worktree`.

Undocumented; read at `chunk-acxptg39.js` offset 187617675.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-5g8p9x0b.js` · offset 196163477 · sha256 `09901b5e…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-5g8p9x0b.js` offset 196163477.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-5g8p9x0b.js` · offset 196219662 · sha256 `e616699a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196219662.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-4ahd91a1.js` · offset 197477559 · sha256 `dbda7267…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4ahd91a1.js` offset 197477559.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-88np9eym.js` · offset 207067171 · sha256 `5cac6c16…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-88np9eym.js` offset 207067171.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-88np9eym.js` · offset 207067388 · sha256 `47f681f8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-88np9eym.js` offset 207067388.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-5g8p9x0b.js` · offset 196162873 · sha256 `76fa2fb1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196162873.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-4ahd91a1.js` · offset 197477634 · sha256 `1fcb7e87…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4ahd91a1.js` offset 197477634.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-mcm8e5ww.js` · offset 209379796 · sha256 `2c2da5b5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `spare`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 209379796.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-88np9eym.js` · offset 207066134 · sha256 `4fcf9acc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `45000`.

Undocumented; read at `chunk-88np9eym.js` offset 207066134.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-4ahd91a1.js` · offset 197476727 · sha256 `d9c55f29…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4ahd91a1.js` offset 197476727.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-5bxd66qx.js` · offset 202542400 · sha256 `57d0e7e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5bxd66qx.js` offset 202542400.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-0sv7d752.js` · offset 201961358 · sha256 `733dae68…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0sv7d752.js` offset 201961358.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-31av54vc.js` · offset 215739959 · sha256 `76f29ce6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-31av54vc.js` offset 215739959.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-31av54vc.js` · offset 215740083 · sha256 `3d9adfbe…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-31av54vc.js` offset 215740083.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-g6yz7gnr.js` · offset 196556892 · sha256 `2876ad7c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196556892.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-31av54vc.js` · offset 215740006 · sha256 `03171b60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-31av54vc.js` offset 215740006.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-31av54vc.js` · offset 215740045 · sha256 `4103eaa4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-31av54vc.js` offset 215740045.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-31av54vc.js` · offset 215739917 · sha256 `78c12cd2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-31av54vc.js` offset 215739917.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-31av54vc.js` · offset 215739862 · sha256 `0ed49f22…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-31av54vc.js` offset 215739862.

**Undocumented**

### `CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-j7rgjcpa.js` · offset 185934820 · sha256 `08bc2317…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for the byte-level streaming idle watchdog; when set, it takes precedence over `CLAUDE_STREAM_IDLE_TIMEOUT_MS` for that watchdog and leaves the event-level watchdog unchanged.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CHROME_CLASSIFIER_FLOOR`

Source: `chunk-hyr3xk9c.js` · offset 194326144 · sha256 `115bb892…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-hyr3xk9c.js` offset 194326144.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-er9srhy5.js` · offset 198061117 · sha256 `9ab1f9d7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-er9srhy5.js` offset 198061117.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-er9srhy5.js` · offset 198060924 · sha256 `d8cf5ff5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-er9srhy5.js` offset 198060924.

**Undocumented**

### `CLAUDE_CHROME_TAB_GROUP_KEY`

Source: `chunk-p614p40d.js` · offset 179266793 · sha256 `47225c3e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p614p40d.js` offset 179266793.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-w86h1fbn.js` · offset 207789015 · sha256 `ceff9aca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_HAIKU_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752739 · sha256 `0e705394…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181752739.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752663 · sha256 `8ebd36d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181752663.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752575 · sha256 `303f0d24…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181752575.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_OPUS_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752449 · sha256 `076d67b6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181752449.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_SONNET_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752294 · sha256 `df9df263…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181752294.

**Undocumented**

### `CLAUDE_CODE_ACCESSIBILITY`

Source: `chunk-xr83kgh7.js` · offset 192967242 · sha256 `78c0f256…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `0`.

From docs: Set to `1` to keep the native terminal cursor visible and disable the inverted-text cursor indicator.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ACCOUNT_TAGGED_ID`

Source: `chunk-y3fvjpjn.js` · offset 184650306 · sha256 `755576cb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-y3fvjpjn.js` offset 184650306.

**Undocumented**

### `CLAUDE_CODE_ACCOUNT_UUID`

Source: `chunk-er9srhy5.js` · offset 198064501 · sha256 `6e8b00aa…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-er9srhy5.js` offset 198064501.

**Undocumented**

### `CLAUDE_CODE_ACT_DONT_REDERIVE`

Source: `chunk-acxptg39.js` · offset 188347207 · sha256 `61dc2948…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188347207.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-721k6cws.js` · offset 181892708 · sha256 `bccfb10f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181892708.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-acxptg39.js` · offset 187567471 · sha256 `ecdc6b1d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-j7rgjcpa.js` · offset 185924984 · sha256 `91464e4f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185924984.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-np3zq5rq.js` · offset 205944440 · sha256 `c893ec8f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205944440.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-721k6cws.js` · offset 181870757 · sha256 `dcf206a0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181870757.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-4mmvdwwg.js` · offset 186801567 · sha256 `42bb6ef1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4mmvdwwg.js` offset 186801567.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-7m87m84t.js` · offset 196911521 · sha256 `2650615c…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ALTGR_AS_TEXT`

Source: `chunk-xr83kgh7.js` · offset 192917466 · sha256 `43919966…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-xr83kgh7.js` offset 192917466.

**Undocumented**

### `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT`

Source: `chunk-whsnxm6e.js` · offset 182840036 · sha256 `47ef8a02…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the effort parameter with every request, even when Claude Code does not recognize the model ID as effort-capable.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AMBER_ASTROLABE`

Source: `chunk-24wkkcbf.js` · offset 182911701 · sha256 `8e2e5701…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24wkkcbf.js` offset 182911701.

**Undocumented**

### `CLAUDE_CODE_API_BASE_URL`

Source: `chunk-acxptg39.js` · offset 189949413 · sha256 `ffa9d202…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 189949413.

**Undocumented**

### `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR`

Source: `chunk-cnrzxz4r.js` · offset 185146586 · sha256 `571c81f2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-cnrzxz4r.js` offset 185146586.

**Undocumented**

### `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`

Source: `chunk-721k6cws.js` · offset 182053852 · sha256 `99a8a679…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval in milliseconds at which credentials should be refreshed (when using `apiKeyHelper`)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_APPEND_PROMPT_HEAD`

Source: `chunk-5g8p9x0b.js` · offset 196181438 · sha256 `bf7783f1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196181438.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-t150dbgk.js` · offset 186649628 · sha256 `e42ef07b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-t150dbgk.js` offset 186649628.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSETS`

Source: `chunk-sr3v2cgy.js` · offset 195506878 · sha256 `f6d17a02…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-sr3v2cgy.js` offset 195506878.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-wy79hz60.js` · offset 210298099 · sha256 `775a16f7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK`

Source: `chunk-gsqkexe2.js` · offset 194090806 · sha256 `745c4305…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gsqkexe2.js` offset 194090806.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK_FIXED`

Source: `chunk-gsqkexe2.js` · offset 194091347 · sha256 `9a7789ac…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gsqkexe2.js` offset 194091347.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_RESPONDER`

Source: `chunk-gsqkexe2.js` · offset 194079380 · sha256 `782008f7…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gsqkexe2.js` offset 194079380.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENTS`

Source: `chunk-chyafkej.js` · offset 193914026 · sha256 `83d5f67c…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude reading and replying to comments on an artifact.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENTS_AUTOREACT`

Source: `chunk-gsqkexe2.js` · offset 194090705 · sha256 `84cec711…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude replying on its own to comments sent to it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_DB`

Source: `chunk-1pk9zh8n.js` · offset 195411664 · sha256 `46958bfd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1pk9zh8n.js` offset 195411664.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DB_STR_REPLACE`

Source: `chunk-1pk9zh8n.js` · offset 195411724 · sha256 `246859d1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1pk9zh8n.js` offset 195411724.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DELETE`

Source: `chunk-cjd7cq45.js` · offset 195612643 · sha256 `c864f413…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-cjd7cq45.js` offset 195612643.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_FRESH_READ`

Source: `chunk-e65ec2n6.js` · offset 201003766 · sha256 `18d08d8c…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-e65ec2n6.js` offset 201003766.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_HOT`

Source: `chunk-xktn8sdm.js` · offset 193711986 · sha256 `6f57a8ce…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-xktn8sdm.js` offset 193711986.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_MULTI_FILE`

Source: `chunk-xktn8sdm.js` · offset 193711567 · sha256 `2cf3d5b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-xktn8sdm.js` offset 193711567.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPEN_ACTION`

Source: `chunk-cjd7cq45.js` · offset 195627717 · sha256 `e90603dd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-cjd7cq45.js` offset 195627717.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH`

Source: `chunk-acxptg39.js` · offset 190319119 · sha256 `568a00a5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 190319119.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PATH_PIN`

Source: `chunk-9hhadq2v.js` · offset 195598171 · sha256 `9e1bd820…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9hhadq2v.js` offset 195598171.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PIN`

Source: `chunk-cjd7cq45.js` · offset 195624637 · sha256 `2693918e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-cjd7cq45.js` offset 195624637.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PRESENCE`

Source: `chunk-pzt9501f.js` · offset 194206029 · sha256 `0303b2b0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-pzt9501f.js` offset 194206029.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PREVIEW`

Source: `chunk-nvyqjp3n.js` · offset 195449322 · sha256 `713c0eb8…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-nvyqjp3n.js` offset 195449322.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_QUICKSTART`

Source: `chunk-ersbsf6t.js` · offset 195479069 · sha256 `2b007556…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ersbsf6t.js` offset 195479069.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SHARE`

Source: `chunk-cjd7cq45.js` · offset 195624520 · sha256 `297f86f7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-cjd7cq45.js` offset 195624520.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_START_KIT`

Source: `chunk-9d9wfqjk.js` · offset 199428743 · sha256 `e7c123b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9d9wfqjk.js` offset 199428743.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TEXT_VARIANT`

Source: `chunk-302b381m.js` · offset 201881837 · sha256 `85a661ad…`

Read as: enum (compared against fixed values). Values: `v0`, `v1`, `v2`.

Undocumented; read at `chunk-302b381m.js` offset 201881837.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TOOLSET`

Source: `chunk-xktn8sdm.js` · offset 193709335 · sha256 `9f5b8208…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-xktn8sdm.js` offset 193709335.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CATALOG`

Source: `chunk-ersbsf6t.js` · offset 195479002 · sha256 `9ec5c026…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ersbsf6t.js` offset 195479002.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE`

Source: `chunk-ersbsf6t.js` · offset 195469305 · sha256 `2ddf902e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ersbsf6t.js` offset 195469305.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPES`

Source: `chunk-ersbsf6t.js` · offset 195469246 · sha256 `d3757745…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ersbsf6t.js` offset 195469246.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VERIFY`

Source: `chunk-ersbsf6t.js` · offset 195453548 · sha256 `835f81cd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ersbsf6t.js` offset 195453548.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-721k6cws.js` · offset 181850302 · sha256 `c569a74f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181850302.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_ANNOUNCEMENT`

Source: `chunk-acxptg39.js` · offset 187877293 · sha256 `4d5b229d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 187877293.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_HEADER`

Source: `chunk-3jxrt71q.js` · offset 182785661 · sha256 `0ccadf30…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to omit the attribution block, which carries the client version and a prompt fingerprint, from the start of the system prompt.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTH_FAIL_EXIT_MS`

Source: `chunk-721k6cws.js` · offset 182083115 · sha256 `46d1eca9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-721k6cws.js` offset 182083115.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-acxptg39.js` · offset 187939369 · sha256 `042de733…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_CONNECT_IDE`

Source: `chunk-acxptg39.js` · offset 190250444 · sha256 `5bc23d1b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Override automatic IDE connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-acxptg39.js` · offset 188235704 · sha256 `a472a5b1…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_TIER`

Source: `chunk-6jpfwsxt.js` · offset 211830507 · sha256 `a979d3e4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-6jpfwsxt.js` offset 211830507.

**Undocumented**

### `CLAUDE_CODE_BASALT_COVE`

Source: `chunk-24wkkcbf.js` · offset 182910640 · sha256 `38275e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24wkkcbf.js` offset 182910640.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-h4njzy9v.js` · offset 184873049 · sha256 `b0ab3da3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-h4njzy9v.js` offset 184873049.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-h4njzy9v.js` · offset 184853989 · sha256 `eb4dddf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-h4njzy9v.js` offset 184853989.

**Undocumented**

### `CLAUDE_CODE_BASH_EDIT_DIFF`

Source: `chunk-acxptg39.js` · offset 190910085 · sha256 `9d0ca4a0…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off the diff of the files that changed while a Bash command ran, or `1` to record it in every permission mode.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASH_OUTPUT_AUDIENCE_NOTE`

Source: `chunk-acxptg39.js` · offset 188305308 · sha256 `83e24132…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188305308.

**Undocumented**

### `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR`

Source: `chunk-acxptg39.js` · offset 190958554 · sha256 `5fd05623…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 190958554.

**Undocumented**

### `CLAUDE_CODE_BENCH_LIVE_COUNTS`

Source: `chunk-xr83kgh7.js` · offset 193036036 · sha256 `bb39fa45…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr83kgh7.js` offset 193036036.

**Undocumented**

### `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING`

Source: `chunk-np3zq5rq.js` · offset 205781250 · sha256 `daf2d2c7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to make a non-interactive session report an idle status to its host at every turn end, even while background work is still running.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BISON_CAIRN`

Source: `chunk-24wkkcbf.js` · offset 182911788 · sha256 `a636f61b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-24wkkcbf.js` offset 182911788.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-acxptg39.js` · offset 187942029 · sha256 `deb6881a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187942029.

**Undocumented**

### `CLAUDE_CODE_BREEZY_HORIZON`

Source: `chunk-24wkkcbf.js` · offset 182913312 · sha256 `20ed664c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-24wkkcbf.js` offset 182913312.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-t150dbgk.js` · offset 186649713 · sha256 `8e5b73c3…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t150dbgk.js` offset 186649713.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-z62ps7p2.js` · offset 181268920 · sha256 `30df26bd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62ps7p2.js` offset 181268920.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-j7rgjcpa.js` · offset 185697406 · sha256 `07c79987…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185697406.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-v25a6kgz.js` · offset 181241599 · sha256 `4dc7d695…`

Read as: enum (compared against fixed values). Values: `1`, `spent`.

Undocumented; read at `chunk-v25a6kgz.js` offset 181241599.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-np3zq5rq.js` · offset 206300139 · sha256 `6bc37768…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 206300139.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-np3zq5rq.js` · offset 206300295 · sha256 `c1baf9db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 206300295.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-acxptg39.js` · offset 187389667 · sha256 `a0321c61…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187389667.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-1vj68st5.js` · offset 205352468 · sha256 `dfd2bbc1…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vj68st5.js` offset 205352468.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-cv8g9q75.js` · offset 194665354 · sha256 `fbf235f3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cv8g9q75.js` offset 194665354.

**Undocumented**

### `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE`

Source: `chunk-xr83kgh7.js` · offset 192917123 · sha256 `91a7fceb…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `0` to make Claude Code read the `0x08` byte, also written `^H`, as plain Backspace, or `1` to read it as Ctrl+Backspace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BUBBLEWRAP`

Source: `chunk-721k6cws.js` · offset 181668253 · sha256 `cebdad4c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181668253.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_HYDRATE_PREFETCH`

Source: `chunk-5g8p9x0b.js` · offset 196237491 · sha256 `74fe0821…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196237491.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_PLUGINS_SYNC`

Source: `chunk-acxptg39.js` · offset 187178947 · sha256 `ea69ab05…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187178947.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_REMOTE_CONNECT`

Source: `chunk-5g8p9x0b.js` · offset 196237540 · sha256 `4e6f2f91…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196237540.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_SKILLS_SYNC`

Source: `chunk-9msj151q.js` · offset 196070198 · sha256 `7f0e515e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9msj151q.js` offset 196070198.

**Undocumented**

### `CLAUDE_CODE_CCR_FOLD_FIRST_TURN_RESCAN`

Source: `chunk-np3zq5rq.js` · offset 205841271 · sha256 `5a1b7fc3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205841271.

**Undocumented**

### `CLAUDE_CODE_CCR_SKIP_FRESH_MIGRATIONS`

Source: `chunk-g6yz7gnr.js` · offset 196512082 · sha256 `1c78f196…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196512082.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-aee57t4a.js` · offset 201723090 · sha256 `54105beb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `tag`.

Undocumented; read at `chunk-aee57t4a.js` offset 201723090.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-9c8h1t30.js` · offset 216288765 · sha256 `0bb57284…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-er9srhy5.js` · offset 198066179 · sha256 `a2951440…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-er9srhy5.js` offset 198066179.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-p0xmgba0.js` · offset 194962808 · sha256 `20834deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p0xmgba0.js` offset 194962808.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-377n8dy5.js` · offset 194863744 · sha256 `a2db3c38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-377n8dy5.js` offset 194863744.

**Undocumented**

### `CLAUDE_CODE_COLD_COMPACT`

Source: `chunk-acxptg39.js` · offset 188810560 · sha256 `f38286b5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188810560.

**Undocumented**

### `CLAUDE_CODE_CONFIG_PROBE`

Source: `chunk-721k6cws.js` · offset 182057632 · sha256 `55826c3c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 182057632.

**Undocumented**

### `CLAUDE_CODE_CONFIG_WATCH_EVENTS`

Source: `chunk-721k6cws.js` · offset 181968956 · sha256 `47ee2f6a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181968956.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-721k6cws.js` · offset 181892356 · sha256 `31dd4973…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181892356.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_EXTRA_TOOLS`

Source: `chunk-1vj68st5.js` · offset 205352229 · sha256 `689a77c0…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1vj68st5.js` offset 205352229.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_FORCE_WORKER_INHERIT_MODEL`

Source: `chunk-n1w9epc0.js` · offset 186664745 · sha256 `072440a5…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n1w9epc0.js` offset 186664745.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-3zjk4qre.js` · offset 186657236 · sha256 `0483ada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-3zjk4qre.js` offset 186657236.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-n1w9epc0.js` · offset 186659612 · sha256 `bfb980c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n1w9epc0.js` offset 186659612.

**Undocumented**

### `CLAUDE_CODE_COWORK_FRAME_ARTIFACTS`

Source: `chunk-p614p40d.js` · offset 179266644 · sha256 `61849089…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p614p40d.js` offset 179266644.

**Undocumented**

### `CLAUDE_CODE_COZY_TEAPOT`

Source: `chunk-24wkkcbf.js` · offset 182911278 · sha256 `227ab582…`

Read as: enum (compared against fixed values). Values: `strict`, `relaxed`.

Undocumented; read at `chunk-24wkkcbf.js` offset 182911278.

**Undocumented**

### `CLAUDE_CODE_CUSTOM_OAUTH_URL`

Source: `chunk-ttd93ar9.js` · offset 179187777 · sha256 `fd19aaca…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ttd93ar9.js` offset 179187777.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-4mmvdwwg.js` · offset 186800999 · sha256 `920d06cc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4mmvdwwg.js` offset 186800999.

**Undocumented**

### `CLAUDE_CODE_DD_ERROR_TRACKING_FLUSH_INTERVAL_MS`

Source: `chunk-364ytsyn.js` · offset 186294223 · sha256 `edc9c0e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-364ytsyn.js` offset 186294223.

**Undocumented**

### `CLAUDE_CODE_DEBUG_LOG_LEVEL`

Source: `chunk-dnvvymm5.js` · offset 179132663 · sha256 `38902a64…`

Read as: string (trimmed; empty is treated as unset).

From docs: Minimum log level written to the debug log file.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_LOGS_DIR`

Source: `chunk-dnvvymm5.js` · offset 179133795 · sha256 `55275582…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the debug log file path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_REPAINTS`

Source: `chunk-xr83kgh7.js` · offset 193037727 · sha256 `8e87d2bc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr83kgh7.js` offset 193037727.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-xr83kgh7.js` · offset 193085247 · sha256 `a88756b2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xr83kgh7.js` offset 193085247.

**Undocumented**

### `CLAUDE_CODE_DESIGN_OAUTH_CLIENT_ID`

Source: `chunk-80y5qrcq.js` · offset 200437866 · sha256 `27ea3afb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-80y5qrcq.js` offset 200437866.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-p614p40d.js` · offset 179261790 · sha256 `d9749d38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p614p40d.js` offset 179261790.

**Undocumented**

### `CLAUDE_CODE_DIAGNOSTICS_FILE`

Source: `chunk-4rp0h2vb.js` · offset 179316683 · sha256 `b7d882f2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4rp0h2vb.js` offset 179316683.

**Undocumented**

### `CLAUDE_CODE_DISABLE_1M_CONTEXT`

Source: `chunk-721k6cws.js` · offset 181797003 · sha256 `22034a03…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable 1M context window support.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`

Source: `chunk-721k6cws.js` · offset 181804560 · sha256 `d1bbe95e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable adaptive reasoning on Opus 4.6 and Sonnet 4.6 and fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADMIN_ENV_UNION`

Source: `chunk-6qv1jea6.js` · offset 179875418 · sha256 `7409366c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from merging managed settings `env` blocks per key across admin sources, so only the highest-priority source's whole `env` block applies, as before v2.1.223.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADVISOR_TOOL`

Source: `chunk-j7rgjcpa.js` · offset 185836346 · sha256 `31f9f385…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the advisor tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AGENT_VIEW`

Source: `chunk-4mmvdwwg.js` · offset 186800281 · sha256 `94319e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off background agents and agent view: `claude agents`, `--bg`, `/background`, and the on-demand supervisor.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`

Source: `chunk-y4wvcfrd.js` · offset 186306762 · sha256 `52146969…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fullscreen rendering and use the classic main-screen renderer.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ATTACHMENTS`

Source: `chunk-acxptg39.js` · offset 188354327 · sha256 `2730825f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable attachment processing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AUTH_REFRESH_LOCK`

Source: `chunk-721k6cws.js` · offset 182018587 · sha256 `77d224ae…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 182018587.

**Undocumented**

### `CLAUDE_CODE_DISABLE_AUTO_MEMORY`

Source: `chunk-721k6cws.js` · offset 181937864 · sha256 `e9ae94aa…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable auto memory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AWAITING_USER_IDLE`

Source: `chunk-z55ejpjt.js` · offset 185160866 · sha256 `17da4fb8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z55ejpjt.js` offset 185160866.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`

Source: `chunk-40xy1v3x.js` · offset 185162365 · sha256 `8e9ee151…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_EXIT_HANDOFF`

Source: `chunk-7c571t9j.js` · offset 195282949 · sha256 `e35978cf…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop a background session's running background shell commands, dynamic workflows, and, as of v2.1.198, background subagents when the supervisor stops, restarts, or updates that session's process, instead of handing them to the session's next process.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-acxptg39.js` · offset 190889747 · sha256 `c60d8030…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`

Source: `chunk-9zqew8tk.js` · offset 182291091 · sha256 `53652e84…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the skills and workflows included with Claude Code: bundled skills and workflows are removed entirely, while built-in commands like `/init` stay typable but are hidden from the model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CFC_PROMPT`

Source: `chunk-j7rgjcpa.js` · offset 185711087 · sha256 `6abbe374…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to keep the Claude in Chrome browser tools available while omitting the Chrome section of the system prompt and the `/claude-in-chrome` bundled skill.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_API_SKILL`

Source: `chunk-t25zfnms.js` · offset 195976372 · sha256 `e1894d50…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t25zfnms.js` offset 195976372.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_CODE_SKILL`

Source: `chunk-t25zfnms.js` · offset 195976515 · sha256 `caa69eea…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t25zfnms.js` offset 195976515.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-67zn6kf2.js` · offset 184679781 · sha256 `a80ab294…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CRON`

Source: `chunk-px0nbncc.js` · offset 186556001 · sha256 `d2e34e85…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable scheduled tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DANGEROUS_RM_TIMEOUT`

Source: `chunk-acxptg39.js` · offset 188473428 · sha256 `b0a7f033…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188473428.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-acxptg39.js` · offset 188235511 · sha256 `47a42445…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPLORE_INHERIT_CAP`

Source: `chunk-acxptg39.js` · offset 187094799 · sha256 `f82982b0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187094799.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`

Source: `chunk-acxptg39.js` · offset 187037975 · sha256 `25884f10…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the built-in Explore and Plan subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FAST_MODE`

Source: `chunk-721k6cws.js` · offset 181680078 · sha256 `8b097ca8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fast mode

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`

Source: `chunk-mcm8e5ww.js` · offset 208916963 · sha256 `eceb5df5…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the "How is Claude doing?" session quality surveys.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`

Source: `chunk-acxptg39.js` · offset 191349110 · sha256 `1bb2cf49…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable file checkpointing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`

Source: `chunk-acxptg39.js` · offset 187580537 · sha256 `af2da406…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to remove built-in commit and PR workflow instructions and the git status snapshot from Claude's context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-4vezmnxh.js` · offset 206599208 · sha256 `854713d6…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4vezmnxh.js` offset 206599208.

**Undocumented**

### `CLAUDE_CODE_DISABLE_INLINE_SHELL_RM_PROMPT`

Source: `chunk-acxptg39.js` · offset 189439356 · sha256 `d8d1d00c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 189439356.

**Undocumented**

### `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`

Source: `chunk-721k6cws.js` · offset 181792440 · sha256 `1434b3f7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent automatic remapping of Opus 4.0 and 4.1 to the current Opus version on the Anthropic API.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND`

Source: `chunk-1cm3113f.js` · offset 186858915 · sha256 `997d0063…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1cm3113f.js` offset 186858915.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_BULK_INFLATE`

Source: `chunk-j7rgjcpa.js` · offset 185540945 · sha256 `57a2e9bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185540945.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_MASS_DELETE_HOLD`

Source: `chunk-j7rgjcpa.js` · offset 185503136 · sha256 `c98731a8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185503136.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_PERIODIC_RESYNC`

Source: `chunk-j7rgjcpa.js` · offset 185563728 · sha256 `a88b554a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185563728.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_RO_UNSAVED_NOTICE`

Source: `chunk-j7rgjcpa.js` · offset 185554894 · sha256 `b8e2136b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185554894.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_STREAM_LIST`

Source: `chunk-j7rgjcpa.js` · offset 185530620 · sha256 `e80a215c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185530620.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MODEL_ACCESS_FALLBACK`

Source: `chunk-721k6cws.js` · offset 181753169 · sha256 `4080303c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181753169.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MOUSE`

Source: `chunk-y4wvcfrd.js` · offset 186309466 · sha256 `8824ecb6…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable mouse tracking in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MOUSE_CLICKS`

Source: `chunk-y4wvcfrd.js` · offset 186309554 · sha256 `5298f3d5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable click, drag, and hover handling in fullscreen rendering while keeping mouse-wheel scrolling.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NESTED_CHAIN_IDLE`

Source: `chunk-y7wm8tf1.js` · offset 186806197 · sha256 `49b1d93e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y7wm8tf1.js` offset 186806197.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NESTED_USER_REPAIR`

Source: `chunk-ept4s9w5.js` · offset 205243061 · sha256 `0a5b4502…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ept4s9w5.js` offset 205243061.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

Source: `chunk-k2pjtcda.js` · offset 191710924 · sha256 `b476ef4e…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to disable nonessential network traffic: auto-updates, telemetry, error reporting, the `/feedback` command, Claude-drafted feedback, release notes, the PR and MR status badge checks, and availability checks such as the fast mode check.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK`

Source: `chunk-acxptg39.js` · offset 189075905 · sha256 `c72546fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the non-streaming fallback when a streaming request fails mid-stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK`

Source: `chunk-ayvhxd0j.js` · offset 211526797 · sha256 `4e0eb81d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the `PushNotification` tool's desktop notification even while you are typing in or focused on the terminal.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`

Source: `chunk-mcm8e5ww.js` · offset 209534445 · sha256 `effc4341…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic registration of the official plugin marketplace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ORG_MEMORY`

Source: `chunk-0s5f053y.js` · offset 183333872 · sha256 `a35b3841…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0s5f053y.js` offset 183333872.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS`

Source: `chunk-ept4s9w5.js` · offset 205213264 · sha256 `6e09c748…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from running your `Notification` hooks for unanswered permission requests in sessions where Claude Code sends them to the Agent SDK's `canUseTool` callback, which is how Claude Desktop and the VS Code extension host Claude Code.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-2ba5q06j.js` · offset 206727187 · sha256 `bc51a94c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2ba5q06j.js` offset 206727187.

**Undocumented**

### `CLAUDE_CODE_DISABLE_POLICY_SKILLS`

Source: `chunk-acxptg39.js` · offset 189693341 · sha256 `557b868b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip loading skills from the system-wide managed skills directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_POWERSHELL_CMD_RM_DENY`

Source: `chunk-dd4zws47.js` · offset 201606655 · sha256 `eb5d87df…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dd4zws47.js` offset 201606655.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`

Source: `chunk-acxptg39.js` · offset 191312558 · sha256 `f4d7781e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 191312558.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK`

Source: `chunk-j7rgjcpa.js` · offset 185901079 · sha256 `b7e1638f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185901079.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_RETRY`

Source: `chunk-pphn9kby.js` · offset 195074798 · sha256 `22579745…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-pphn9kby.js` offset 195074798.

**Undocumented**

### `CLAUDE_CODE_DISABLE_STARTUP_WORK_GATE`

Source: `chunk-5g8p9x0b.js` · offset 196130905 · sha256 `6db62d41…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196130905.

**Undocumented**

### `CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS`

Source: `chunk-721k6cws.js` · offset 181806370 · sha256 `7298c207…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181806370.

**Undocumented**

### `CLAUDE_CODE_DISABLE_SUBSTITUTION_RM_PROMPT`

Source: `chunk-acxptg39.js` · offset 189427230 · sha256 `f3c2c677…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 189427230.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`

Source: `chunk-7m87m84t.js` · offset 196892067 · sha256 `c9848df5…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic terminal title updates based on conversation context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_THINKING`

Source: `chunk-acxptg39.js` · offset 189009273 · sha256 `25755513…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to omit the `thinking` parameter from API requests entirely.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-ft4qs0da.js` · offset 205318287 · sha256 `bab299da…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ft4qs0da.js` offset 205318287.

**Undocumented**

### `CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT`

Source: `chunk-acxptg39.js` · offset 187940458 · sha256 `e2af1b0f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip proactive auto-compaction when Claude Code doesn't recognize the model ID, such as an LLM gateway alias.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`

Source: `chunk-mcm8e5ww.js` · offset 209602357 · sha256 `778468f5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable virtual scrolling in fullscreen rendering and render every message in the transcript.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-qkt5evp3.js` · offset 191572752 · sha256 `b123889b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qkt5evp3.js` offset 191572752.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WEB_FETCH`

Source: `chunk-7n2w7emx.js` · offset 194717709 · sha256 `38c13913…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7n2w7emx.js` offset 194717709.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WINDOWS_SHELL_LAUNCHER`

Source: `chunk-acxptg39.js` · offset 187779177 · sha256 `d36766ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start PowerShell tool commands on Windows directly instead of through the `cmd.exe` launcher.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKFLOWS`

Source: `chunk-sm075fbc.js` · offset 182833135 · sha256 `6a39bb51…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable workflows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-np3zq5rq.js` · offset 206092800 · sha256 `e937cc38…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 206092800.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-acxptg39.js` · offset 187766839 · sha256 `6394fbc6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-acxptg39.js` offset 187766839.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-d9rg2fcs.js` · offset 191440650 · sha256 `1f00549c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-d9rg2fcs.js` offset 191440650.

**Undocumented**

### `CLAUDE_CODE_EAGER_FLUSH`

Source: `chunk-np3zq5rq.js` · offset 205987569 · sha256 `099e9537…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205987569.

**Undocumented**

### `CLAUDE_CODE_EDITOR_CODELIVERY`

Source: `chunk-np3zq5rq.js` · offset 205877945 · sha256 `7931744b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205877945.

**Undocumented**

### `CLAUDE_CODE_EFFORT_LEVEL`

Source: `chunk-tkc05gkf.js` · offset 199878694 · sha256 `a1418c04…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set the effort level for supported models.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ELEGANT_MEADOW`

Source: `chunk-acxptg39.js` · offset 186915697 · sha256 `4e9da92b…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 186915697.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-y7wm8tf1.js` · offset 186807578 · sha256 `87d54f3a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y7wm8tf1.js` offset 186807578.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-acxptg39.js` · offset 188842815 · sha256 `0c59bb0a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188842815.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-pphn9kby.js` · offset 195094597 · sha256 `845bada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-pphn9kby.js` offset 195094597.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-a29gkqzd.js` · offset 194466234 · sha256 `f57deca3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-a29gkqzd.js` offset 194466234.

**Undocumented**

### `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`

Source: `chunk-4xf394j9.js` · offset 194965533 · sha256 `5fd6ac1f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Override session recap availability.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH`

Source: `chunk-np3zq5rq.js` · offset 205842242 · sha256 `73d4e338…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to refresh plugin state at turn boundaries in non-interactive mode after a background install completes.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_CFC`

Source: `chunk-5g8p9x0b.js` · offset 196230639 · sha256 `e1810825…` · 9 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196230639.

**Undocumented**

### `CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL`

Source: `chunk-j7rgjcpa.js` · offset 185836465 · sha256 `ef13d50a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185836465.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING`

Source: `chunk-acxptg39.js` · offset 187900488 · sha256 `9635eb53…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether tool call inputs stream from the API as Claude generates them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_MENU_KIND_LANES`

Source: `chunk-mcm8e5ww.js` · offset 208498114 · sha256 `a005df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mcm8e5ww.js` offset 208498114.

**Undocumented**

### `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`

Source: `chunk-pphn9kby.js` · offset 195055761 · sha256 `abb8b4cc…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to turn off prompt suggestions, the grayed-out predictions that appear in your prompt input.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS`

Source: `chunk-7n2w7emx.js` · offset 194821598 · sha256 `47eef022…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7n2w7emx.js` offset 194821598.

**Undocumented**

### `CLAUDE_CODE_ENABLE_REMOTE_RECAP`

Source: `chunk-4xf394j9.js` · offset 194965700 · sha256 `93e0e7e0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-4xf394j9.js` offset 194965700.

**Undocumented**

### `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`

Source: `chunk-acxptg39.js` · offset 191349173 · sha256 `162e231d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 191349173.

**Undocumented**

### `CLAUDE_CODE_ENABLE_TASKS`

Source: `chunk-vmcwgvfa.js` · offset 186456494 · sha256 `789e280c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Selects which task-tracking tools Claude Code provides in sessions that have them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TODO_TOOLS`

Source: `chunk-acxptg39.js` · offset 190246842 · sha256 `9e897733…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to get the task-tracking tools on every model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT`

Source: `chunk-acxptg39.js` · offset 190359411 · sha256 `211e4580…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 190359411.

**Undocumented**

### `CLAUDE_CODE_ENABLE_XAA`

Source: `chunk-6qv1jea6.js` · offset 179662449 · sha256 `a32876ef…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6qv1jea6.js` offset 179662449.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-24wkkcbf.js` · offset 182972946 · sha256 `7c476da1…` · 79 read sites

Read as: string (trimmed; empty is treated as unset). Values: `claude-desktop`, `local-agent`, `claude-desktop-3p`, `ssh-remote`, `sdk-ts`, `sdk-py`, `sdk-cli`, `bench`, `claude-vscode`, `remote`, `remote_baku`, `remote_cowork`, `remote_desktop`, `remote_mobile`, `remote_projects`, `claude-in-teams`, `mcp`, `claude-code-github-action`, `claude_in_slack`, `claude-in-slack`, `cli`, `local_agent`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-24wkkcbf.js` offset 182972946.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-ft4qs0da.js` · offset 205318949 · sha256 `86b4d664…` · 30 read sites

Read as: string (trimmed; empty is treated as unset). Values: `byoc`, `bridge`.

Undocumented; read at `chunk-ft4qs0da.js` offset 205318949.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-ft4qs0da.js` · offset 205319606 · sha256 `e1654a9a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ft4qs0da.js` offset 205319606.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-0s5f053y.js` · offset 183389282 · sha256 `fa5f0a3f…` · 28 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0s5f053y.js` offset 183389282.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-9c8h1t30.js` · offset 216283651 · sha256 `ee624a73…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9c8h1t30.js` offset 216283651.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-5g8p9x0b.js` · offset 196215127 · sha256 `3f1dcc43…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196215127.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-np3zq5rq.js` · offset 206005224 · sha256 `72bb31e0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

Source: `chunk-dt545sgj.js` · offset 186367936 · sha256 `25d9e31b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable agent teams.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_OBSERVER_AGENTS`

Source: `chunk-way3bepz.js` · offset 194289432 · sha256 `6b66f048…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-way3bepz.js` offset 194289432.

**Undocumented**

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-acxptg39.js` · offset 188959762 · sha256 `c34fb80c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: JSON object to merge into the top level of every API request body.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_METADATA`

Source: `chunk-j7rgjcpa.js` · offset 186028734 · sha256 `1e7f6a5b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186028734.

**Undocumented**

### `CLAUDE_CODE_FEDERATION_CACHE_DIR`

Source: `chunk-z62ps7p2.js` · offset 181258735 · sha256 `c06c4761…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181258735.

**Undocumented**

### `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`

Source: `chunk-g3eea2rf.js` · offset 182368482 · sha256 `1dca00c6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the default token limit for file reads.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-145m7htd.js` · offset 186687187 · sha256 `19b816d5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

Undocumented; read at `chunk-145m7htd.js` offset 186687187.

**Undocumented**

### `CLAUDE_CODE_FLEETVIEW_SIMPLE`

Source: `chunk-zdwxqbe3.js` · offset 197383473 · sha256 `fec9df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zdwxqbe3.js` offset 197383473.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-mcm8e5ww.js` · offset 208737400 · sha256 `85294805…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mcm8e5ww.js` offset 208737400.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-mcm8e5ww.js` · offset 208156924 · sha256 `1a35ec20…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mcm8e5ww.js` offset 208156924.

**Undocumented**

### `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM`

Source: `chunk-721k6cws.js` · offset 181806795 · sha256 `4374665e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181806795.

**Undocumented**

### `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE`

Source: `chunk-aq8h78w9.js` · offset 181306383 · sha256 `fd59f454…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force transcript persistence, prompt history, and `claude agents` registration even when this `claude` was launched from inside another Claude Code session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_STRIKETHROUGH`

Source: `chunk-j4at3hdr.js` · offset 192600190 · sha256 `a62ccdc5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force strikethrough rendering for `~~text~~` in Claude's responses when your terminal supports it but is not auto-detected, such as over SSH without `TERM_PROGRAM` forwarded.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_SYNC_OUTPUT`

Source: `chunk-f4tdx2y5.js` · offset 192687508 · sha256 `c543d0ff…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable DEC private mode 2026 synchronized output when your terminal supports it but is not auto-detected.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_TERMINAL_IMAGES`

Source: `chunk-f4tdx2y5.js` · offset 192686131 · sha256 `0a85c469…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f4tdx2y5.js` offset 192686131.

**Undocumented**

### `CLAUDE_CODE_FORCE_WINDOWS_CREDMAN`

Source: `chunk-gr5bn7tt.js` · offset 181195371 · sha256 `3f0763ed…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-gr5bn7tt.js` offset 181195371.

**Undocumented**

### `CLAUDE_CODE_FORK_SUBAGENT`

Source: `chunk-acxptg39.js` · offset 188316115 · sha256 `1a7edc8d…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls fork mode, which lets Claude spawn forked subagents itself and is on by default in interactive sessions only.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT`

Source: `chunk-5g8p9x0b.js` · offset 196221503 · sha256 `a50b2622…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to emit subagent text and thinking blocks in `claude -p --output-format stream-json` output, the same behavior as the `--forward-subagent-text` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_USER_INTENT`

Source: `chunk-721k6cws.js` · offset 181554280 · sha256 `72bec8cd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181554280.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_LOG`

Source: `chunk-5bxd66qx.js` · offset 202552878 · sha256 `2e0a430f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5bxd66qx.js` offset 202552878.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_SAMPLE_EVERY`

Source: `chunk-5bxd66qx.js` · offset 202552931 · sha256 `8acc24f1…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `1`.

Undocumented; read at `chunk-5bxd66qx.js` offset 202552931.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-t525z4nt.js` · offset 180875899 · sha256 `f6c95e4d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_HIDDEN`

Source: `chunk-acxptg39.js` · offset 187839997 · sha256 `7fef3404…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to exclude dotfiles from results when Claude invokes the Glob tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_NO_IGNORE`

Source: `chunk-acxptg39.js` · offset 187839944 · sha256 `f396df60…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to make the Glob tool respect `.gitignore` patterns.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-hnd61wvn.js` · offset 184455358 · sha256 `3c89eebb…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in seconds for Glob tool file discovery.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-pphn9kby.js` · offset 195044600 · sha256 `421e5a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 10080, digitsOnly true. Default (from code): `30`.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GORSE_PLOVER`

Source: `chunk-24wkkcbf.js` · offset 182911596 · sha256 `5946ea79…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24wkkcbf.js` offset 182911596.

**Undocumented**

### `CLAUDE_CODE_GROWTHBOOK_KICK_FROM_INIT`

Source: `chunk-5g8p9x0b.js` · offset 196242753 · sha256 `e4e27859…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196242753.

**Undocumented**

### `CLAUDE_CODE_GROWTHBOOK_KICK_ON_WARM_CACHE`

Source: `chunk-5g8p9x0b.js` · offset 196217118 · sha256 `e97bdd53…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196217118.

**Undocumented**

### `CLAUDE_CODE_GZIP_CCR_REQUEST_BODIES`

Source: `chunk-kqz4ze2y.js` · offset 184937872 · sha256 `8dc68f1f…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-kqz4ze2y.js` offset 184937872.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODIES`

Source: `chunk-kqz4ze2y.js` · offset 184937910 · sha256 `bc05e45c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-kqz4ze2y.js` offset 184937910.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODY_BLOCKS`

Source: `chunk-j7rgjcpa.js` · offset 185914487 · sha256 `6b269752…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 2, digitsOnly true.

Undocumented; read at `chunk-j7rgjcpa.js` offset 185914487.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODY_LEVEL`

Source: `chunk-kqz4ze2y.js` · offset 184937740 · sha256 `55a893ae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 9, digitsOnly true.

Undocumented; read at `chunk-kqz4ze2y.js` offset 184937740.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE`

Source: `chunk-9xcwygxa.js` · offset 186253499 · sha256 `df6ae3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9xcwygxa.js` offset 186253499.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_CLOUD`

Source: `chunk-gr5j97kv.js` · offset 202019939 · sha256 `40c7c424…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gr5j97kv.js` offset 202019939.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_PACING_OFF`

Source: `chunk-946tbhpp.js` · offset 186271457 · sha256 `a6b5fd40…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-946tbhpp.js` offset 186271457.

**Undocumented**

### `CLAUDE_CODE_HIDE_CWD`

Source: `chunk-7reb38ay.js` · offset 197071685 · sha256 `ab916658…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the working directory in the startup logo.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-p614p40d.js` · offset 179264064 · sha256 `1e801477…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p614p40d.js` offset 179264064.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-ft4qs0da.js` · offset 205319138 · sha256 `65424d2e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ft4qs0da.js` offset 205319138.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-emhrcjff.js` · offset 215668724 · sha256 `7cba2278…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `300000`.

Undocumented; read at `chunk-emhrcjff.js` offset 215668724.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-emhrcjff.js` · offset 215668798 · sha256 `356fd56e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `60000`.

Undocumented; read at `chunk-emhrcjff.js` offset 215668798.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-acxptg39.js` · offset 188622645 · sha256 `7c5f9747…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188622645.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_ENV_VAR`

Source: `chunk-vkvz9hhq.js` · offset 182646824 · sha256 `9866d220…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ANTHROPIC_AUTH_TOKEN`.

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-vkvz9hhq.js` offset 182646824.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_REFRESH_TIMEOUT_MS`

Source: `chunk-np3zq5rq.js` · offset 206095027 · sha256 `e2898b0c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-np3zq5rq.js` offset 206095027.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-0s5f053y.js` · offset 183536415 · sha256 `c51d4504…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0s5f053y.js` offset 183536415.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-721k6cws.js` · offset 181891833 · sha256 `1727d409…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `darwin`.

Undocumented; read at `chunk-721k6cws.js` offset 181891833.

**Undocumented**

### `CLAUDE_CODE_HOST_PROMPT_SUPERSEDES_RECORD`

Source: `chunk-np3zq5rq.js` · offset 206125259 · sha256 `593bfac5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 206125259.

**Undocumented**

### `CLAUDE_CODE_HOST_SCHEDULED_RUN`

Source: `chunk-p614p40d.js` · offset 179266704 · sha256 `b89666ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p614p40d.js` offset 179266704.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-721k6cws.js` · offset 181873143 · sha256 `5970cab5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181873143.

**Undocumented**

### `CLAUDE_CODE_HOST_WORKTREE`

Source: `chunk-acxptg39.js` · offset 187599459 · sha256 `23de3ec4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187599459.

**Undocumented**

### `CLAUDE_CODE_HOST_WORKTREE_FENCE`

Source: `chunk-acxptg39.js` · offset 187599489 · sha256 `96d34f90…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187599489.

**Undocumented**

### `CLAUDE_CODE_HOVER_REST`

Source: `chunk-e5z7r72b.js` · offset 182628013 · sha256 `f2f700a5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-e5z7r72b.js` offset 182628013.

**Undocumented**

### `CLAUDE_CODE_HUMBLE_HAMMOCK`

Source: `chunk-acxptg39.js` · offset 187916764 · sha256 `7bac3d99…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 187916764.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-acxptg39.js` · offset 190261830 · sha256 `13c70d6f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the host address used to connect to the IDE extension.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`

Source: `chunk-acxptg39.js` · offset 190261330 · sha256 `67709670…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip auto-installation of IDE extensions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`

Source: `chunk-acxptg39.js` · offset 190254402 · sha256 `f07ea290…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip validation of IDE lockfile entries during connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-mcm8e5ww.js` · offset 208100546 · sha256 `c369462a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `75`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208100546.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-mcm8e5ww.js` · offset 208100439 · sha256 `4cb11ebe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208100439.

**Undocumented**

### `CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES`

Source: `chunk-5g8p9x0b.js` · offset 196221457 · sha256 `2ec5d90f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196221457.

**Undocumented**

### `CLAUDE_CODE_INLINE_TOOLS`

Source: `chunk-721k6cws.js` · offset 181670664 · sha256 `6c18992e…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-721k6cws.js` offset 181670664.

**Undocumented**

### `CLAUDE_CODE_INTRO_FRAME`

Source: `chunk-acxptg39.js` · offset 188331148 · sha256 `698839a2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188331148.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-0ah5ddr7.js` · offset 182901510 · sha256 `0de12944…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0ah5ddr7.js` offset 182901510.

**Undocumented**

### `CLAUDE_CODE_JUNIPER_SUNDIAL`

Source: `chunk-acxptg39.js` · offset 190303849 · sha256 `7f21b654…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

Undocumented; read at `chunk-acxptg39.js` offset 190303849.

**Undocumented**

### `CLAUDE_CODE_KB_COHESION_FIXES`

Source: `chunk-ytjpd8rh.js` · offset 202366820 · sha256 `8ed256d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ytjpd8rh.js` offset 202366820.

**Undocumented**

### `CLAUDE_CODE_LANTERN_PRISM`

Source: `chunk-q01s00ax.js` · offset 186845573 · sha256 `318044d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q01s00ax.js` offset 186845573.

**Undocumented**

### `CLAUDE_CODE_LARCH_CISTERN`

Source: `chunk-24wkkcbf.js` · offset 182911865 · sha256 `5502383a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24wkkcbf.js` offset 182911865.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-acxptg39.js` · offset 190067925 · sha256 `c3a383e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 190067925.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-6p461qz5.js` · offset 194609671 · sha256 `0cb997e5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-6p461qz5.js` offset 194609671.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-x127h07e.js` · offset 211884913 · sha256 `e2921932…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-x127h07e.js` offset 211884913.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-acxptg39.js` · offset 188204872 · sha256 `482fa868…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `20`.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_CONTEXT_TOKENS`

Source: `chunk-5g8p9x0b.js` · offset 196176587 · sha256 `3237e39a…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the context window size Claude Code assumes for the active model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_EFFORT_REMINDER`

Source: `chunk-whsnxm6e.js` · offset 182839636 · sha256 `cf1ec291…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-whsnxm6e.js` offset 182839636.

**Undocumented**

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-acxptg39.js` · offset 188457746 · sha256 `bc6c35a8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_OUTPUT_TOKENS`

Source: `chunk-721k6cws.js` · offset 181800100 · sha256 `bf917afe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Set the maximum number of output tokens for most requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_RETRIES`

Source: `chunk-acxptg39.js` · offset 188952184 · sha256 `7979c44b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the number of times to retry failed API requests (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-v3va86yg.js` · offset 186588659 · sha256 `6fc57800…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`

Source: `chunk-a29gkqzd.js` · offset 194364193 · sha256 `984edcae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `10`.

From docs: Maximum number of read-only tools and subagents that can execute in parallel (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TURNS`

Source: `chunk-q3se8bhm.js` · offset 179087256 · sha256 `a023beee…`

Read as: string (trimmed; empty is treated as unset).

From docs: Cap the number of agentic turns when no explicit limit is passed.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-sbk5rjqa.js` · offset 186578452 · sha256 `c068574d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `200`.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-z62ps7p2.js` · offset 181271174 · sha256 `f9e0beea…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-acxptg39.js` · offset 187344435 · sha256 `ac766569…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187344435.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-nvewdhpx.js` · offset 220003939 · sha256 `92c1abd0…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-np3zq5rq.js` · offset 205821083 · sha256 `47172fe3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-np3zq5rq.js` offset 205821083.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-f6y3mr7n.js` · offset 180120335 · sha256 `e5f05822…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f6y3mr7n.js` offset 180120335.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS`

Source: `chunk-np3zq5rq.js` · offset 205821545 · sha256 `8e971ba2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 205821545.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS_MS`

Source: `chunk-np3zq5rq.js` · offset 205821579 · sha256 `6b981cd9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-np3zq5rq.js` offset 205821579.

**Undocumented**

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-np3zq5rq.js` · offset 205821254 · sha256 `63fb2b7c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-tgymbs42.js` · offset 214116331 · sha256 `cc6c8538…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Idle timeout in milliseconds for MCP tool calls.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_PUSH_DELETE_MODE`

Source: `chunk-j7rgjcpa.js` · offset 185502822 · sha256 `d1dd7dc7…`

Read as: enum (compared against fixed values). Values: `corroborate`, `immediate`, `never`.

Undocumented; read at `chunk-j7rgjcpa.js` offset 185502822.

**Undocumented**

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-a29gkqzd.js` · offset 194466409 · sha256 `024704bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-a29gkqzd.js` offset 194466409.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-5g8p9x0b.js` · offset 196241763 · sha256 `2d9663d2…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MODEL_CAPABILITIES`

Source: `chunk-gtjt0jrt.js` · offset 180066516 · sha256 `a04a0c59…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gtjt0jrt.js` offset 180066516.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG`

Source: `chunk-58jvv1qy.js` · offset 195407913 · sha256 `dce6abf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-58jvv1qy.js` offset 195407913.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG_URL`

Source: `chunk-aj95r0n7.js` · offset 194848674 · sha256 `0a1f4188…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aj95r0n7.js` offset 194848674.

**Undocumented**

### `CLAUDE_CODE_NANKEEN_KESTREL`

Source: `chunk-hnd61wvn.js` · offset 184442167 · sha256 `62f600b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hnd61wvn.js` offset 184442167.

**Undocumented**

### `CLAUDE_CODE_NATIVE_CURSOR`

Source: `chunk-xr83kgh7.js` · offset 193085697 · sha256 `9973481d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to show the terminal's own cursor at the input caret instead of a drawn block.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NEW_INIT`

Source: `chunk-acxptg39.js` · offset 189729808 · sha256 `3988e65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to make `/init` run an interactive setup flow.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_FLICKER`

Source: `chunk-y4wvcfrd.js` · offset 186306731 · sha256 `ffde9f68…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to enable fullscreen rendering, a research preview that reduces flicker and keeps memory flat in long conversations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_MODEL_FALLBACK`

Source: `chunk-721k6cws.js` · offset 181753131 · sha256 `9a948e34…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181753131.

**Undocumented**

### `CLAUDE_CODE_NONBLOCKING_STDOUT`

Source: `chunk-xr83kgh7.js` · offset 193036445 · sha256 `7e045e30…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to write terminal output through a second non-blocking file descriptor, so a terminal that stops reading, such as a paused tmux control-mode pane or a stalled SSH connection, can't freeze Claude Code mid-session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NONSTREAMING_TIMEOUT_RETRIES`

Source: `chunk-acxptg39.js` · offset 188938865 · sha256 `1698c2a3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-acxptg39.js` offset 188938865.

**Undocumented**

### `CLAUDE_CODE_OAUTH_401_WAIT_MS`

Source: `chunk-721k6cws.js` · offset 182082791 · sha256 `adf8c842…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-721k6cws.js` offset 182082791.

**Undocumented**

### `CLAUDE_CODE_OAUTH_CLIENT_ID`

Source: `chunk-9tpza09x.js` · offset 203697068 · sha256 `bd32389e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9tpza09x.js` offset 203697068.

**Undocumented**

### `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`

Source: `chunk-9tpza09x.js` · offset 203696545 · sha256 `546b7627…`

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth refresh token for Claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_SCOPES`

Source: `chunk-9tpza09x.js` · offset 203696601 · sha256 `f3d74416…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-721k6cws.js` · offset 182084777 · sha256 `12619147…` · 41 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 24 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OAuth access token for claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-721k6cws.js` · offset 182052407 · sha256 `e23b3439…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 182052407.

**Undocumented**

### `CLAUDE_CODE_ORGANIZATION_UUID`

Source: `chunk-kx3hbyfc.js` · offset 181286770 · sha256 `2ece2065…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kx3hbyfc.js` offset 181286770.

**Undocumented**

### `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`

Source: `chunk-nfqe1amr.js` · offset 197169399 · sha256 `66dea6e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to let Claude Code run your package manager's upgrade command in the background when a new version is available.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-np3zq5rq.js` · offset 205944296 · sha256 `580b35b6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `2000`.

Undocumented; read at `chunk-np3zq5rq.js` offset 205944296.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-np3zq5rq.js` · offset 205944558 · sha256 `6cf05dad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205944558.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-np3zq5rq.js` · offset 205944508 · sha256 `2c52ce2b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205944508.

**Undocumented**

### `CLAUDE_CODE_PARSED_WILLOW`

Source: `chunk-acxptg39.js` · offset 191014205 · sha256 `3f4b28da…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 191014205.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-acxptg39.js` · offset 187581999 · sha256 `2c8ec14a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to enable Perforce-aware write protection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PEWTER_OWL`

Source: `chunk-abwzfj5h.js` · offset 186681955 · sha256 `5eab3bfa…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-abwzfj5h.js` offset 186681955.

**Undocumented**

### `CLAUDE_CODE_PEWTER_OWL_TOOL`

Source: `chunk-abwzfj5h.js` · offset 186682150 · sha256 `c8b4a783…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-abwzfj5h.js` offset 186682150.

**Undocumented**

### `CLAUDE_CODE_PLAN_MODE_REQUIRED`

Source: `chunk-aq8h78w9.js` · offset 181307695 · sha256 `446af310…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-aq8h78w9.js` offset 181307695.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-acxptg39.js` · offset 190980916 · sha256 `145ff368…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190980916.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-acxptg39.js` · offset 190981126 · sha256 `c08f81b3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190981126.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-qte47mjm.js` · offset 183085303 · sha256 `77a1c90e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qte47mjm.js` offset 183085303.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_BINARY_ASSETS`

Source: `chunk-acxptg39.js` · offset 190529738 · sha256 `c60f17b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 190529738.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-acxptg39.js` · offset 187159087 · sha256 `59ec7dd9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the plugins root directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIR_WATCH`

Source: `chunk-j7rgjcpa.js` · offset 185775286 · sha256 `08a1ca6e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185775286.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-cqbt8tx8.js` · offset 193364188 · sha256 `be0843c0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 190418959 · sha256 `443f2a02…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`

Source: `chunk-acxptg39.js` · offset 190423710 · sha256 `9144e4f9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the re-clone attempt and keep using the existing marketplace checkout when a marketplace refresh can't reach or authenticate to the remote.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`

Source: `chunk-grwmq3qs.js` · offset 180930474 · sha256 `6ede7fcb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to clone GitHub `owner/repo` shorthand sources over HTTPS instead of SSH.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-vfq24b5v.js` · offset 183097466 · sha256 `dd28fbd5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE`

Source: `chunk-acxptg39.js` · offset 187159015 · sha256 `a6a39434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187159015.

**Undocumented**

### `CLAUDE_CODE_POLISHED_DEWDROP`

Source: `chunk-acxptg39.js` · offset 188895663 · sha256 `b3bc3546…`

Read as: enum (compared against fixed values). Values: `drop`, `block`, `off`.

Undocumented; read at `chunk-acxptg39.js` offset 188895663.

**Undocumented**

### `CLAUDE_CODE_POLL_EVENTS`

Source: `chunk-qs6rwaph.js` · offset 185118840 · sha256 `481b54c4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qs6rwaph.js` offset 185118840.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-0zp02gec.js` · offset 194928420 · sha256 `9cf5c70a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0zp02gec.js` offset 194928420.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-721k6cws.js` · offset 181934665 · sha256 `d68b016f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181934665.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-721k6cws.js` · offset 181934740 · sha256 `fc4fcde6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181934740.

**Undocumented**

### `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`

Source: `chunk-acxptg39.js` · offset 187475796 · sha256 `605a0977…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-153bwgfn.js` · offset 207432347 · sha256 `55266f2b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `banner`, `step`.

Undocumented; read at `chunk-153bwgfn.js` offset 207432347.

**Undocumented**

### `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`

Source: `chunk-np3zq5rq.js` · offset 205782829 · sha256 `d5315498…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Ceiling in milliseconds on idle waiting for background subagents and workflows after the final turn in non-interactive mode with the `-p` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROACTIVE`

Source: `chunk-mcm8e5ww.js` · offset 209626573 · sha256 `b4a14159…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mcm8e5ww.js` offset 209626573.

**Undocumented**

### `CLAUDE_CODE_PROCESS_WRAPPER`

Source: `chunk-hg948yxv.js` · offset 182637748 · sha256 `eb63ba84…`

Read as: string (raw value; further parsing not traced).

From docs: Launch the processes Claude Code starts from its own binary, such as the background service that hosts agent view sessions, through a corporate launcher given as an argv prefix like `/opt/corp/launcher`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROFILE_STARTUP`

Source: `chunk-1rz02a15.js` · offset 181034362 · sha256 `48090143…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1rz02a15.js` offset 181034362.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-q3se8bhm.js` · offset 179086641 · sha256 `46ee95ac…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROJECTS_SESSION`

Source: `chunk-0s5f053y.js` · offset 183517795 · sha256 `109b7ab5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0s5f053y.js` offset 183517795.

**Undocumented**

### `CLAUDE_CODE_PROPAGATE_TRACEPARENT`

Source: `chunk-acxptg39.js` · offset 188966471 · sha256 `9c27f60b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`

Source: `chunk-vkvz9hhq.js` · offset 182646698 · sha256 `55abb6ea…` · 25 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set by host platforms that embed Claude Code and manage model provider routing on its behalf.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 187453217 · sha256 `941d165a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187453217.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-g6yz7gnr.js` · offset 196502586 · sha256 `431f146e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196502586.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-g6yz7gnr.js` · offset 196502632 · sha256 `b41183a0…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196502632.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-g6yz7gnr.js` · offset 196502320 · sha256 `b0ac376e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196502320.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-z62ps7p2.js` · offset 181268377 · sha256 `ecac5ea0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181268377.

**Undocumented**

### `CLAUDE_CODE_REFUSAL_FALLBACK_CATCH_ALL`

Source: `chunk-j7rgjcpa.js` · offset 185899719 · sha256 `864b4300…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185899719.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_HOME_TRUST`

Source: `chunk-bmegdagv.js` · offset 193223267 · sha256 `e23e7482…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-bmegdagv.js` offset 193223267.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-84wh0q6p.js` · offset 193225141 · sha256 `d2231367…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-84wh0q6p.js` offset 193225141.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-721k6cws.js` · offset 181892095 · sha256 `9bf28f96…` · 182 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-721k6cws.js` · offset 181892226 · sha256 `36b0bea4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `self_hosted`.

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181892226.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-3zygpz8p.js` · offset 182642303 · sha256 `3d74f7c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-3zygpz8p.js` offset 182642303.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-0s5f053y.js` · offset 183467801 · sha256 `e165e4bd…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0s5f053y.js` offset 183467801.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-acxptg39.js` · offset 189122375 · sha256 `26e703b9…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 189122375.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-5g8p9x0b.js` · offset 196224561 · sha256 `66c81362…` · 55 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 17 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set automatically in cloud sessions to the current session's ID.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-kx3hbyfc.js` · offset 181277629 · sha256 `bb0ef760…`

Read as: string (trimmed; empty is treated as unset). Values: `review`.

Undocumented; read at `chunk-kx3hbyfc.js` offset 181277629.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_FORWARD`

Source: `chunk-xz4d5t1k.js` · offset 182872967 · sha256 `403d6cb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xz4d5t1k.js` offset 182872967.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_PIN_STORED_LOGIN`

Source: `chunk-gqegtvbg.js` · offset 181053854 · sha256 `4a5b8e49…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gqegtvbg.js` offset 181053854.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-5857ntzn.js` · offset 215432606 · sha256 `ed0db984…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5857ntzn.js` offset 215432606.

**Undocumented**

### `CLAUDE_CODE_REPORT_FINDINGS`

Source: `chunk-t25zfnms.js` · offset 195823095 · sha256 `83bab3f4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t25zfnms.js` offset 195823095.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-q3se8bhm.js` · offset 179087782 · sha256 `34ebe303…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESULT_NONCE`

Source: `chunk-gwc1wn1e.js` · offset 206976334 · sha256 `ce70514c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gwc1wn1e.js` offset 206976334.

**Undocumented**

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-np3zq5rq.js` · offset 206293713 · sha256 `8de15ab6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 206293713.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-acxptg39.js` · offset 189867859 · sha256 `51a22bee…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-acxptg39.js` · offset 189864934 · sha256 `368abfd7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-acxptg39.js` · offset 189864553 · sha256 `6d26b33b…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `Continue from where you left off.`.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-acxptg39.js` · offset 189864655 · sha256 `86742cd5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 189864655.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-88np9eym.js` · offset 207065202 · sha256 `18c89164…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-88np9eym.js` offset 207065202.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-mcm8e5ww.js` · offset 208300384 · sha256 `560978fe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `70`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208300384.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-mcm8e5ww.js` · offset 208300429 · sha256 `4856fb83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208300429.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-acxptg39.js` · offset 189867149 · sha256 `07bb30dc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 189867149.

**Undocumented**

### `CLAUDE_CODE_RETRY_WATCHDOG`

Source: `chunk-acxptg39.js` · offset 188933366 · sha256 `cfbe7798…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` for unattended sessions such as eval harnesses, CI jobs, or remote workers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RUSTLING_PIXEL`

Source: `chunk-acxptg39.js` · offset 188898449 · sha256 `bd7707c3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 188898449.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-q3se8bhm.js` · offset 179087705 · sha256 `470f14bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-0s5f053y.js` · offset 183391744 · sha256 `1891ad2e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0s5f053y.js` offset 183391744.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-z62ps7p2.js` · offset 181265228 · sha256 `271d8941…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-5645472e.js` · offset 217469938 · sha256 `7ff1728b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH`

Source: `chunk-np3zq5rq.js` · offset 206094970 · sha256 `44e72a15…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 206094970.

**Undocumented**

### `CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH`

Source: `chunk-721k6cws.js` · offset 182046929 · sha256 `3d742d83…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 182046929.

**Undocumented**

### `CLAUDE_CODE_SDK_READS_SESSION_STATE`

Source: `chunk-y7wm8tf1.js` · offset 186807686 · sha256 `4fad3b24…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y7wm8tf1.js` offset 186807686.

**Undocumented**

### `CLAUDE_CODE_SEND_FEEDBACK`

Source: `chunk-znt9v3js.js` · offset 194660164 · sha256 `95ea5704…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off Claude-drafted feedback for a session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-k2pjtcda.js` · offset 191739441 · sha256 `ba44bc9b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-p614p40d.js` · offset 179266449 · sha256 `5f1f30e9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-p614p40d.js` offset 179266449.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-v25a6kgz.js` · offset 181241909 · sha256 `3b2d1fe0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-64d1d15q.js` · offset 178859469 · sha256 `ca22b404…` · 44 read sites

Read as: string (trimmed; empty is treated as unset). Values: `bg`.

Undocumented; read at `chunk-64d1d15q.js` offset 178859469.

**Undocumented**

### `CLAUDE_CODE_SESSION_LOG`

Source: `chunk-721k6cws.js` · offset 181870725 · sha256 `0a5415fc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181870725.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-721k6cws.js` · offset 181869452 · sha256 `25e3352a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181869452.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-302b381m.js` · offset 201881875 · sha256 `89e071e5…` · 4 read sites

Read as: enum (compared against fixed values). Values: `claude_ai_chat`.

Undocumented; read at `chunk-302b381m.js` offset 201881875.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-np3zq5rq.js` · offset 205977225 · sha256 `bea79228…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-np3zq5rq.js` offset 205977225.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 189155051 · sha256 `adf97071…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `1500`.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-acxptg39.js` · offset 190965949 · sha256 `31413206…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the shell Claude Code uses to run Bash tool commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-acxptg39.js` · offset 187772896 · sha256 `2d9e653f…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SILENT_TURN_REMINDER`

Source: `chunk-acxptg39.js` · offset 190295472 · sha256 `4d7a230e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 190295472.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT`

Source: `chunk-acxptg39.js` · offset 190295258 · sha256 `bfa469d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190295258.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TURNS`

Source: `chunk-acxptg39.js` · offset 190295622 · sha256 `3bfef62d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-acxptg39.js` offset 190295622.

**Undocumented**

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-q3se8bhm.js` · offset 179087636 · sha256 `e7139545…` · 17 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-24wkkcbf.js` · offset 182912887 · sha256 `cf484739…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-sq6jke15.js` · offset 184758496 · sha256 `ae0e1afb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sq6jke15.js` offset 184758496.

**Undocumented**

### `CLAUDE_CODE_SKILL_PROPOSALS`

Source: `chunk-acxptg39.js` · offset 187593281 · sha256 `0b60af6f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187593281.

**Undocumented**

### `CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS`

Source: `chunk-721k6cws.js` · offset 181681838 · sha256 `9bd83e99…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to treat a failed fast mode availability check as available, for networks that block the check's direct request to `api.anthropic.com`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK`

Source: `chunk-721k6cws.js` · offset 181680165 · sha256 `51819982…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the client-side fast mode availability check, for proxies that intercept the check's request rather than refuse it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MODEL_ACCESS_MEMORY`

Source: `chunk-an6xhrk3.js` · offset 196658249 · sha256 `63bfb7b9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-an6xhrk3.js` offset 196658249.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS`

Source: `chunk-acxptg39.js` · offset 187334907 · sha256 `322d3de0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187334907.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS_EXCEPT`

Source: `chunk-acxptg39.js` · offset 187334617 · sha256 `ac1ed8d9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187334617.

**Undocumented**

### `CLAUDE_CODE_SKIP_PROMPT_HISTORY`

Source: `chunk-j7rgjcpa.js` · offset 185829123 · sha256 `dfa39084…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip writing prompt history and session transcripts to disk.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS`

Source: `chunk-dnvvymm5.js` · offset 179142495 · sha256 `2d40a3a5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-dnvvymm5.js` offset 179142495.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-1rz02a15.js` · offset 181033893 · sha256 `484bfa9f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-1rz02a15.js` offset 181033893.

**Undocumented**

### `CLAUDE_CODE_SQUISHY_NEWT`

Source: `chunk-acxptg39.js` · offset 191014285 · sha256 `593678e1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 191014285.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-acxptg39.js` · offset 190250551 · sha256 `3c3064ab…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190250551.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-d9rg2fcs.js` · offset 191440574 · sha256 `d1de753e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-d9rg2fcs.js` offset 191440574.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-6rv85g0t.js` · offset 186252071 · sha256 `829fede0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STELLAR_DRIFT`

Source: `chunk-acxptg39.js` · offset 187909280 · sha256 `fd80c4e2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 187909280.

**Undocumented**

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-pphn9kby.js` · offset 195168572 · sha256 `679999c7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `8`.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL`

Source: `chunk-721k6cws.js` · offset 181783486 · sha256 `a4e439aa…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: The default model for subagents, agent team teammates, and workflow agents that aren't assigned a model another way.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`

Source: `chunk-52a14049.js` · offset 209894079 · sha256 `1f181030…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force one model onto subagents, teammates, and workflow agents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-gqegtvbg.js` · offset 181073943 · sha256 `32d88409…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-z62ps7p2.js` · offset 181268325 · sha256 `3bac6f02…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181268325.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-q3se8bhm.js` · offset 179088027 · sha256 `ca2a97fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q3se8bhm.js` offset 179088027.

**Undocumented**

### `CLAUDE_CODE_SUPPRESS_SESSION_ATTRIBUTION`

Source: `chunk-acxptg39.js` · offset 187866865 · sha256 `5d00e83b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187866865.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`

Source: `chunk-5g8p9x0b.js` · offset 196165755 · sha256 `65428678…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode (the `-p` flag) to wait for plugin installation to complete before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-np3zq5rq.js` · offset 206151967 · sha256 `289123bc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in milliseconds for synchronous plugin installation.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS`

Source: `chunk-acxptg39.js` · offset 187178524 · sha256 `0d015816…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187178524.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-hjjz8p0n.js` · offset 184925902 · sha256 `9f9c61c9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hjjz8p0n.js` offset 184925902.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-hjjz8p0n.js` · offset 184924039 · sha256 `7bb68b87…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `60000`.

Undocumented; read at `chunk-hjjz8p0n.js` offset 184924039.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 187178617 · sha256 `52621edc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-acxptg39.js` offset 187178617.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-acxptg39.js` · offset 187178692 · sha256 `ee1187e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `10000`.

Undocumented; read at `chunk-acxptg39.js` offset 187178692.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-acxptg39.js` · offset 187175896 · sha256 `10976ffa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 86400000.

Undocumented; read at `chunk-acxptg39.js` offset 187175896.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-acxptg39.js` · offset 187289584 · sha256 `ffd902d2…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 187289584.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS`

Source: `chunk-9msj151q.js` · offset 196081305 · sha256 `86fc5960…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode with the `-p` flag to make Claude Code download the skills enabled for your claude.ai account in that run and wait for the list of them, up to `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`, before it runs the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-9msj151q.js` · offset 196069879 · sha256 `6b53f454…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-9msj151q.js` · offset 196069795 · sha256 `de00dd5e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-7cm7q4s2.js` · offset 214835788 · sha256 `ef3cce71…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `false` to disable syntax highlighting in diff output.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-np3zq5rq.js` · offset 206141691 · sha256 `5ca80899…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 206141691.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-721k6cws.js` · offset 181892574 · sha256 `aa86fbdc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181892574.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-mcm8e5ww.js` · offset 208108755 · sha256 `8ea2a4a3…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Share a task list across sessions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-np3zq5rq.js` · offset 206085374 · sha256 `701641f9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1000, max 60000. Default (from code): `10000`.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEE_SDK_STDOUT`

Source: `chunk-ft4qs0da.js` · offset 205299085 · sha256 `3b7d3d72…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ft4qs0da.js` offset 205299085.

**Undocumented**

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-acxptg39.js` · offset 189853943 · sha256 `eb007c40…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 189853943.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-8mhzeynw.js` · offset 181298713 · sha256 `32d7e817…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8mhzeynw.js` offset 181298713.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-acxptg39.js` · offset 187657671 · sha256 `e061786e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 187657671.

**Undocumented**

### `CLAUDE_CODE_THINKING_DISPLAY_UPDATES`

Source: `chunk-acxptg39.js` · offset 188838809 · sha256 `6c6cabb4…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188838809.

**Undocumented**

### `CLAUDE_CODE_THISTLE_GREBE`

Source: `chunk-721k6cws.js` · offset 181537034 · sha256 `da23ea8a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181537034.

**Undocumented**

### `CLAUDE_CODE_THRIFTY_SONIC`

Source: `chunk-24wkkcbf.js` · offset 182911013 · sha256 `ea9dc2ed…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-24wkkcbf.js` offset 182911013.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-75pwjp0k.js` · offset 183593596 · sha256 `299a7e96…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the temp directory used for internal temp files.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-scd694cx.js` · offset 207541830 · sha256 `f3917ec9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-scd694cx.js` offset 207541830.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-scd694cx.js` · offset 207541791 · sha256 `d3dc1e92…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-scd694cx.js` offset 207541791.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-mcm8e5ww.js` · offset 209481236 · sha256 `c0a56997…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mcm8e5ww.js` offset 209481236.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-qxyxqdkg.js` · offset 180008367 · sha256 `1caa1ae1…`

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TODO_REMINDER_MODE`

Source: `chunk-acxptg39.js` · offset 190303492 · sha256 `5abe0e33…`

Read as: enum (compared against fixed values). Values: `baseline`, `off`.

Undocumented; read at `chunk-acxptg39.js` offset 190303492.

**Undocumented**

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-f6y3mr7n.js` · offset 180120043 · sha256 `5b70bef7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-f6y3mr7n.js` · offset 180118294 · sha256 `1f539dfd…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`

Source: `chunk-acxptg39.js` · offset 188311345 · sha256 `ffe6d7ce…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 188311345.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_AFTER_USER_TURN`

Source: `chunk-acxptg39.js` · offset 188312172 · sha256 `ddd4b616…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188312172.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`

Source: `chunk-acxptg39.js` · offset 188311737 · sha256 `606df25d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 188311737.

**Undocumented**

### `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`

Source: `chunk-5g8p9x0b.js` · offset 196164815 · sha256 `3ecaf12b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196164815.

**Undocumented**

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-q308nzmf.js` · offset 212385856 · sha256 `e89ecb6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-q308nzmf.js` offset 212385856.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-mcm8e5ww.js` · offset 208089703 · sha256 `4aa0a028…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`, `default`.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208089703.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-y4wvcfrd.js` · offset 186305925 · sha256 `f52b2d89…`

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`.

Undocumented; read at `chunk-y4wvcfrd.js` offset 186305925.

**Undocumented**

### `CLAUDE_CODE_TURN_UPDATES`

Source: `chunk-acxptg39.js` · offset 188319455 · sha256 `924dab76…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188319455.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-5yndqfks.js` · offset 200152760 · sha256 `d80da839…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5yndqfks.js` offset 200152760.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-t55hg3rb.js` · offset 195707147 · sha256 `4abb04e7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-t55hg3rb.js` offset 195707147.

**Undocumented**

### `CLAUDE_CODE_USE_COWORK_PLUGINS`

Source: `chunk-6qv1jea6.js` · offset 179852316 · sha256 `225ab54c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6qv1jea6.js` offset 179852316.

**Undocumented**

### `CLAUDE_CODE_USE_POWERSHELL_TOOL`

Source: `chunk-q933vkqs.js` · offset 212346085 · sha256 `0bf9df8a…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls the PowerShell tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-j7rgjcpa.js` · offset 185895868 · sha256 `46d08d18…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_EMAIL`

Source: `chunk-721k6cws.js` · offset 182126898 · sha256 `2347c88b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 182126898.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-xpwj991w.js` · offset 213202134 · sha256 `b4c3c91f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xpwj991w.js` offset 213202134.

**Undocumented**

### `CLAUDE_CODE_WEB_FETCH_AGENT`

Source: `chunk-acxptg39.js` · offset 188296791 · sha256 `cbf3526c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 188296791.

**Undocumented**

### `CLAUDE_CODE_WEB_SEARCH_FAST_ARG`

Source: `chunk-v7f5d3nf.js` · offset 183306569 · sha256 `3c325b89…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-v7f5d3nf.js` offset 183306569.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS`

Source: `chunk-24wkkcbf.js` · offset 183010551 · sha256 `8d500e83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `900000`.

From docs: Set to the number of milliseconds WebFetch keeps each fetched URL's response cached.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBFETCH_DEADLINE_MS`

Source: `chunk-acxptg39.js` · offset 188265392 · sha256 `79263864…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

From docs: Upper bound in milliseconds on how long WebFetch waits for a page to download, including any redirects it follows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR`

Source: `chunk-1sh8by1p.js` · offset 193386342 · sha256 `3df5ab6a…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1sh8by1p.js` offset 193386342.

**Undocumented**

### `CLAUDE_CODE_WHIMSICAL_ELEPHANT`

Source: `chunk-721k6cws.js` · offset 181552055 · sha256 `ae4e690c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-721k6cws.js` offset 181552055.

**Undocumented**

### `CLAUDE_CODE_WILLOW_TERN`

Source: `chunk-24wkkcbf.js` · offset 182912168 · sha256 `4be21696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24wkkcbf.js` offset 182912168.

**Undocumented**

### `CLAUDE_CODE_WISE_COMET`

Source: `chunk-acxptg39.js` · offset 187936469 · sha256 `05978c0d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-acxptg39.js` offset 187936469.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-acxptg39.js` · offset 190847042 · sha256 `9723da95…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190847042.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-np3zq5rq.js` · offset 206191189 · sha256 `325e02bb…` · 13 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-np3zq5rq.js` offset 206191189.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`

Source: `chunk-t65a4tk3.js` · offset 199719661 · sha256 `74e013c4…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 256, digitsOnly true.

From docs: How many agents a single workflow run executes at once, from `1` to `256`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS`

Source: `chunk-mcm8e5ww.js` · offset 208399680 · sha256 `27d03ba3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208399680.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_TOKENS`

Source: `chunk-mcm8e5ww.js` · offset 208399760 · sha256 `cb3ff7f8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mcm8e5ww.js` offset 208399760.

**Undocumented**

### `CLAUDE_CODE_WORKFLOWS`

Source: `chunk-sm075fbc.js` · offset 182834122 · sha256 `9f543338…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-sm075fbc.js` offset 182834122.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-y3fvjpjn.js` · offset 184653370 · sha256 `30722e3d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-y3fvjpjn.js` offset 184653370.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-7jz8j2fc.js` · offset 193405977 · sha256 `8c4b69f4…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the configuration directory (default: `~/.claude`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-0s5f053y.js` · offset 183470840 · sha256 `4ad6dc1e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0s5f053y.js` offset 183470840.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-0s5f053y.js` · offset 183394889 · sha256 `3ca2d6e8…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0s5f053y.js` offset 183394889.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-acxptg39.js` · offset 187560620 · sha256 `d01657be…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: ``.

Undocumented; read at `chunk-acxptg39.js` offset 187560620.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-721k6cws.js` · offset 181938112 · sha256 `7bd86655…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181938112.

**Undocumented**

### `CLAUDE_DEBUG`

Source: `chunk-g6yz7gnr.js` · offset 196500889 · sha256 `96be69e5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196500889.

**Undocumented**

### `CLAUDE_DISABLE_ADOPT`

Source: `chunk-7c571t9j.js` · offset 195280916 · sha256 `d04f1eb4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop in-flight background work instead of carrying it over when you background a session by pressing `←` or with `/background`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG`

Source: `chunk-j7rgjcpa.js` · offset 185939736 · sha256 `1824e7c2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to force-enable the byte-level streaming idle watchdog, or set to `0` to force-disable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_STREAM_WATCHDOG`

Source: `chunk-a29gkqzd.js` · offset 194446707 · sha256 `806c8256…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to force-disable the event-level streaming idle watchdog, or set to `1` to force-enable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-acxptg39.js` · offset 187445397 · sha256 `2b00ca24…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-mcm8e5ww.js` · offset 208917075 · sha256 `7b164eac…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mcm8e5ww.js` offset 208917075.

**Undocumented**

### `CLAUDE_IMPORT_CONVERSATIONS`

Source: `chunk-kbmhwfzc.js` · offset 203663963 · sha256 `1f18d8e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kbmhwfzc.js` offset 203663963.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-cyzbzgkb.js` · offset 212289867 · sha256 `9739119e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cyzbzgkb.js` offset 212289867.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-721k6cws.js` · offset 181921705 · sha256 `12927d55…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181921705.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-0s5f053y.js` · offset 183538949 · sha256 `153cf60a…` · 33 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_LOCAL_OAUTH_API_BASE`

Source: `chunk-ttd93ar9.js` · offset 179189695 · sha256 `25070d02…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ttd93ar9.js` offset 179189695.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_APPS_BASE`

Source: `chunk-ttd93ar9.js` · offset 179189781 · sha256 `92a2b48d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ttd93ar9.js` offset 179189781.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_CONSOLE_BASE`

Source: `chunk-ttd93ar9.js` · offset 179189868 · sha256 `dd40e55a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ttd93ar9.js` offset 179189868.

**Undocumented**

### `CLAUDE_MEMORY_STORES`

Source: `chunk-0s5f053y.js` · offset 183333972 · sha256 `69001abe…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0s5f053y.js` offset 183333972.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-46e4t4pb.js` · offset 211282172 · sha256 `fac36c80…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-46e4t4pb.js` offset 211282172.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-4ahd91a1.js` · offset 197480941 · sha256 `104db100…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-4ahd91a1.js` offset 197480941.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-4ahd91a1.js` · offset 197477474 · sha256 `da907461…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-4ahd91a1.js` offset 197477474.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-4ahd91a1.js` · offset 197481172 · sha256 `58aef346…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-4ahd91a1.js` offset 197481172.

**Undocumented**

### `CLAUDE_PTY_RECORD`

Source: `chunk-4ahd91a1.js` · offset 197478041 · sha256 `7b0a5f6f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4ahd91a1.js` offset 197478041.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-5g8p9x0b.js` · offset 196163228 · sha256 `77664f78…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196163228.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-32qa6het.js` · offset 186713215 · sha256 `2067b8e5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-4y82bpnn.js` · offset 199791777 · sha256 `679ff90d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4y82bpnn.js` offset 199791777.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-4y82bpnn.js` · offset 199791485 · sha256 `f5aa6e96…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4y82bpnn.js` offset 199791485.

**Undocumented**

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-ft4qs0da.js` · offset 205299132 · sha256 `4d11426e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 3.

Undocumented; read at `chunk-ft4qs0da.js` offset 205299132.

**Undocumented**

### `CLAUDE_RUNNER_API_BASE_URL`

Source: `chunk-5j718pvy.js` · offset 182726616 · sha256 `bed6faf5…`

Read as: string (raw value; further parsing not traced).

From docs: Anthropic API base URL for session-scoped calls

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_DISABLE_AWAITING_ACTION_OVERRIDE`

Source: `chunk-k2pjtcda.js` · offset 191719702 · sha256 `ea910ff4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191719702.

**Undocumented**

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-1k1qsm5t.js` · offset 191542195 · sha256 `9d2ceeca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Git fetch depth for fresh clones.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-5j718pvy.js` · offset 182726459 · sha256 `b7ce016c…`

Read as: string (raw value; further parsing not traced).

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SKIP_GIT_VERIFY`

Source: `chunk-qyn5bdge.js` · offset 191493214 · sha256 `21df957f…`

Read as: enum (compared against fixed values). Values: `1`.

From docs: When `1`, skip the `.git` presence check after a `checkout` hook runs.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-6jpfwsxt.js` · offset 211830390 · sha256 `d7b49142…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6jpfwsxt.js` offset 211830390.

**Undocumented**

### `CLAUDE_SESSION_INGRESS_TOKEN_FILE`

Source: `chunk-kx3hbyfc.js` · offset 181286059 · sha256 `5fa5ddd7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Absolute path to a per-session file holding the current session JWT, kept fresh across token refreshes.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SLOW_FIRST_BYTE_MS`

Source: `chunk-acxptg39.js` · offset 189046503 · sha256 `cc4e40d3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-acxptg39.js` offset 189046503.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-j7rgjcpa.js` · offset 185484398 · sha256 `37979d75…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185484398.

**Undocumented**

### `CLAUDE_STREAM_FIRST_BYTE_TIMEOUT_MS`

Source: `chunk-j7rgjcpa.js` · offset 185935162 · sha256 `74df571c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Deadline in milliseconds for the first response byte of a streaming request, on the connections where the first-byte deadline runs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-j7rgjcpa.js` · offset 185934674 · sha256 `590260fd…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds before the event- and byte-level streaming idle watchdogs close a stalled connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_TMPDIR`

Source: `chunk-75pwjp0k.js` · offset 183593628 · sha256 `3b749fcd…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-75pwjp0k.js` offset 183593628.

**Undocumented**

### `CLAUDE_TRUSTED_DEVICE_TOKEN`

Source: `chunk-ekz0crj3.js` · offset 185206891 · sha256 `e362b7c4…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz0crj3.js` offset 185206891.

**Undocumented**

### `CLAUDE_WORKFLOW_NAME_ONLY`

Source: `chunk-e2mgdryp.js` · offset 199670876 · sha256 `b910c419…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-e2mgdryp.js` offset 199670876.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-5g8p9x0b.js` · offset 196184695 · sha256 `a9cd3cb6…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Documented: https://code.claude.com/docs/en/env-vars

### `CLIPBOARD_NAPI_NODE_PATH`

Source: `chunk-v4er1c8e.js` · offset 186318156 · sha256 `08bacc2c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-v4er1c8e.js` offset 186318156.

**Undocumented**

### `COMPUTERNAME`

Source: `chunk-1exv0s4x.js` · offset 197647285 · sha256 `79054786…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1exv0s4x.js` offset 197647285.

**Undocumented**

### `CONTAINER_SANDBOX_MOUNT_POINT`

Source: `chunk-721k6cws.js` · offset 181867069 · sha256 `9f0f77c0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181867069.

**Undocumented**

### `DEBUG_CLAUDE_AGENT_SDK`

Source: `chunk-kmsvjk2z.js` · offset 202869913 · sha256 `f041f5dc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kmsvjk2z.js` offset 202869913.

**Undocumented**

### `DEBUG_SDK`

Source: `chunk-dnvvymm5.js` · offset 179133126 · sha256 `4c7983f1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dnvvymm5.js` offset 179133126.

**Undocumented**

### `DEMO_VERSION`

Source: `chunk-7reb38ay.js` · offset 197071072 · sha256 `aa2ade84…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7reb38ay.js` offset 197071072.

**Undocumented**

### `DISABLE_AUTO_COMPACT`

Source: `chunk-acxptg39.js` · offset 187935803 · sha256 `958ef69a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic compaction when approaching the context limit.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-721k6cws.js` · offset 181999378 · sha256 `5ab2aa30…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic background updates.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_BRIEF_MODE_STOP_HOOK`

Source: `chunk-pphn9kby.js` · offset 195056307 · sha256 `f348af56…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-pphn9kby.js` offset 195056307.

**Undocumented**

### `DISABLE_BUG_COMMAND`

Source: `chunk-j7rgjcpa.js` · offset 185871987 · sha256 `f52f9937…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COMPACT`

Source: `chunk-721k6cws.js` · offset 181797362 · sha256 `6c34486b…` · 12 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all compaction: both automatic compaction and the manual `/compact` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COST_WARNINGS`

Source: `chunk-j7rgjcpa.js` · offset 185872307 · sha256 `8ac37cb3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable cost warning messages

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_DOCTOR_COMMAND`

Source: `chunk-t25zfnms.js` · offset 195904268 · sha256 `ee7207c3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/doctor` setup checkup skill and its `/checkup` alias.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_ERROR_REPORTING`

Source: `chunk-k2pjtcda.js` · offset 191711001 · sha256 `1aa9728e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of error reporting. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn error reporting back on

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_EXTRA_USAGE_COMMAND`

Source: `chunk-721k6cws.js` · offset 182097425 · sha256 `b9b14308…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/usage-credits` command that lets users purchase additional usage beyond rate limits

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_FEEDBACK_COMMAND`

Source: `chunk-j7rgjcpa.js` · offset 185871872 · sha256 `5e33f8be…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the `/feedback` command and Claude-drafted feedback.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_GROWTHBOOK`

Source: `chunk-cnrzxz4r.js` · offset 185147054 · sha256 `a0cfeb1e…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` or `true` to disable GrowthBook feature-flag fetching and use code defaults for every flag.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALL_GITHUB_APP_COMMAND`

Source: `chunk-acxptg39.js` · offset 189755418 · sha256 `3316960d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/install-github-app` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALLATION_CHECKS`

Source: `chunk-d9rg2fcs.js` · offset 191471021 · sha256 `4c27a2dd…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable installation warnings.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INTERLEAVED_THINKING`

Source: `chunk-721k6cws.js` · offset 181808969 · sha256 `e341ccff…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent sending the interleaved-thinking beta header.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGIN_COMMAND`

Source: `chunk-acxptg39.js` · offset 189754952 · sha256 `9de9e197…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/login` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGOUT_COMMAND`

Source: `chunk-acxptg39.js` · offset 189755120 · sha256 `ddc0075c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/logout` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPDATES`

Source: `chunk-721k6cws.js` · offset 181999310 · sha256 `3a3c9989…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to block all updates including manual `claude update` and `claude install`.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPGRADE_COMMAND`

Source: `chunk-j7rgjcpa.js` · offset 185831838 · sha256 `4885b0e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/upgrade` command

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_CLAUDEAI_MCP_SERVERS`

Source: `chunk-acxptg39.js` · offset 187347278 · sha256 `a8b4022d…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to stop Claude Code from fetching claude.ai MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_MCP_LARGE_OUTPUT_FILES`

Source: `chunk-tgymbs42.js` · offset 214198751 · sha256 `9b7436ef…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-tgymbs42.js` offset 214198751.

**Undocumented**

### `ENABLE_TOOL_SEARCH`

Source: `chunk-acxptg39.js` · offset 188441656 · sha256 `7f68bf8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Controls MCP tool search.

Documented: https://code.claude.com/docs/en/env-vars

### `FALLBACK_FOR_ALL_PRIMARY_MODELS`

Source: `chunk-acxptg39.js` · offset 188942311 · sha256 `78f6ad2c…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to any non-empty value, such as `1`, to make Claude Code stop retrying on repeated overload errors for every model when no fallback model is configured. **Setting it to `0` or `false` still enables this**, unlike most on/off variables; unset the variable to restore the default retry behavior.

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_AUTOUPDATE_PLUGINS`

Source: `chunk-721k6cws.js` · offset 181999119 · sha256 `531c9c29…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`

Documented: https://code.claude.com/docs/en/env-vars

### `HOMESHARE`

Source: `chunk-j7rgjcpa.js` · offset 185627583 · sha256 `5c738ec6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185627583.

**Undocumented**

### `IS_DEMO`

Source: `chunk-5bxd66qx.js` · offset 202543067 · sha256 `98b8eb2b…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to enable demo mode: hides your email and organization name from the header and `/status` output, and skips onboarding. **Setting it to `0` or `false` still enables demo mode**, unlike most on/off variables; unset the variable to turn it off.

Documented: https://code.claude.com/docs/en/env-vars

### `IS_SANDBOX`

Source: `chunk-721k6cws.js` · offset 181668298 · sha256 `56348ca3…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `1`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-721k6cws.js` offset 181668298.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-er9srhy5.js` · offset 198060466 · sha256 `357e1b70…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-er9srhy5.js` offset 198060466.

**Undocumented**

### `MAX_MCP_OUTPUT_TOKENS`

Source: `chunk-5nbqwjzh.js` · offset 207138160 · sha256 `8c5ef5cd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of tokens allowed in MCP tool responses.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_STRUCTURED_OUTPUT_RETRIES`

Source: `chunk-np3zq5rq.js` · offset 205999845 · sha256 `d2c05d1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Number of attempts Claude Code allows when the model's response fails validation against the `--json-schema` in non-interactive mode with the `-p` flag; after that many failed attempts with no valid output, the run fails.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_THINKING_TOKENS`

Source: `chunk-5g8p9x0b.js` · offset 196252952 · sha256 `25a11b54…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Fixed token budget for extended thinking.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CLIENT_SECRET`

Source: `chunk-arrfm839.js` · offset 214064509 · sha256 `38093413…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth client secret for MCP servers that require pre-configured credentials.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-9cjpbspa.js` · offset 186790210 · sha256 `49ffbd08…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-rnb0cvy1.js` · offset 196446267 · sha256 `55b6fd6e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-0h76702z.js` · offset 196417503 · sha256 `f3c1c20e…` · 4 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Turns the MCP discovery cache on or off.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-0h76702z.js` · offset 196416452 · sha256 `6075690d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-0h76702z.js` · offset 196415815 · sha256 `d71a3eb9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-0h76702z.js` · offset 196416363 · sha256 `ebb2b99a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-2j98bz13.js` · offset 213558405 · sha256 `63af4c00…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-arrfm839.js` · offset 214024127 · sha256 `801a0e59…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-arrfm839.js` offset 214024127.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-zx23jytz.js` · offset 214411037 · sha256 `536099b7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-tgymbs42.js` · offset 214131333 · sha256 `153f3a1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `20`.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-jk8zgkka.js` · offset 186387923 · sha256 `231a32e2…`

Read as: string (trimmed; empty is treated as unset).

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-tgymbs42.js` · offset 214131274 · sha256 `7d6d913c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `3`.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-9cjpbspa.js` · offset 186790132 · sha256 `b9a49083…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-tgymbs42.js` · offset 214116141 · sha256 `4002a2b8…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-acxptg39.js` · offset 188256642 · sha256 `f467df82…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 188256642.

**Undocumented**

### `MCP_XAA_IDP_CLIENT_SECRET`

Source: `chunk-p7vnfmqa.js` · offset 207049163 · sha256 `f2acd65a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p7vnfmqa.js` offset 207049163.

**Undocumented**

### `PLAYWRIGHT_BROWSERS_PATH`

Source: `chunk-nvyqjp3n.js` · offset 195449918 · sha256 `2f5fd224…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nvyqjp3n.js` offset 195449918.

**Undocumented**

### `RUNNER_ENVIRONMENT`

Source: `chunk-721k6cws.js` · offset 181893902 · sha256 `1c7f10fd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181893902.

**Undocumented**

### `RUNNER_OS`

Source: `chunk-721k6cws.js` · offset 181893955 · sha256 `4febb421…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181893955.

**Undocumented**

### `RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-k2pjtcda.js` · offset 191820361 · sha256 `7cd461dd…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191820361.

**Undocumented**

### `SAFEUSER`

Source: `chunk-acxptg39.js` · offset 189720353 · sha256 `7cf0f156…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 189720353.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-kmsvjk2z.js` · offset 202888640 · sha256 `74660f53…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `claude`.

Undocumented; read at `chunk-kmsvjk2z.js` offset 202888640.

**Undocumented**

### `SELF_HOSTED_RUNNER_BASE_DIR`

Source: `chunk-k2pjtcda.js` · offset 191787027 · sha256 `b4772425…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787027.

**Undocumented**

### `SELF_HOSTED_RUNNER_BG_RESULT_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191715386 · sha256 `27b1b8d2…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner considers a session busy after a background task finishes while the follow-up turn that reads the result hasn't started.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_CLIENT_LABEL`

Source: `chunk-k2pjtcda.js` · offset 191787478 · sha256 `177e08fb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787478.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFIGURE_GIT`

Source: `chunk-k2pjtcda.js` · offset 191787660 · sha256 `452ab2bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787660.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFINE_REPO_SETTINGS`

Source: `chunk-k2pjtcda.js` · offset 191788035 · sha256 `77b9796c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191788035.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_DIR`

Source: `chunk-ajk93az7.js` · offset 191925424 · sha256 `b1e11b3a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ajk93az7.js` offset 191925424.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_TOKEN_DIR`

Source: `chunk-k2pjtcda.js` · offset 191787356 · sha256 `15e6ba3b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787356.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-k2pjtcda.js` · offset 191821463 · sha256 `fd93c224…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191821463.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191741763 · sha256 `e01cdfc2…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191741763.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-k2pjtcda.js` · offset 191785122 · sha256 `4808daa9…` · 2 read sites

Read as: string (raw value; further parsing not traced). Default (from code): `unset`.

Undocumented; read at `chunk-k2pjtcda.js` offset 191785122.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_BG_TASKS_MS`

Source: `chunk-k2pjtcda.js` · offset 191784859 · sha256 `fbebf33a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191784859.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-k2pjtcda.js` · offset 191784749 · sha256 `9a8c3728…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191784749.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-ajk93az7.js` · offset 191950355 · sha256 `13476adc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ajk93az7.js` offset 191950355.

**Undocumented**

### `SELF_HOSTED_RUNNER_EXEC_PATH`

Source: `chunk-k2pjtcda.js` · offset 191787168 · sha256 `c75ae78f…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787168.

**Undocumented**

### `SELF_HOSTED_RUNNER_HEALTH_PORT`

Source: `chunk-ajk93az7.js` · offset 191925265 · sha256 `114335bb…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ajk93az7.js` offset 191925265.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-ajk93az7.js` · offset 191925158 · sha256 `b0459dbf…` · 7 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ajk93az7.js` offset 191925158.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-k2pjtcda.js` · offset 191602272 · sha256 `6bdd2e04…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_HOST_CONFIG_SNAPSHOT`

Source: `chunk-k2pjtcda.js` · offset 191788111 · sha256 `41e1b2bc…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191788111.

**Undocumented**

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-k2pjtcda.js` · offset 191823504 · sha256 `72e91d87…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191823504.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOCK_TO_ACCOUNT`

Source: `chunk-k2pjtcda.js` · offset 191787419 · sha256 `f387d2ff…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787419.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOG_FILE`

Source: `chunk-k2pjtcda.js` · offset 191787233 · sha256 `bed345b6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787233.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191714556 · sha256 `21be6599…`

Read as: number (parsed as a number). Default (from code): `900000`.

From docs: How long the runner waits after a session reaches its `--kill-session-after-min` limit, for a running turn to finish or the release to complete, before it terminates the session

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-k2pjtcda.js` · offset 191714496 · sha256 `1f6f8814…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191714496.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-ajk93az7.js` · offset 191950432 · sha256 `fc39e472…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ajk93az7.js` offset 191950432.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-k2pjtcda.js` · offset 191820859 · sha256 `906272d2…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `60000`.

Undocumented; read at `chunk-k2pjtcda.js` offset 191820859.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_TURN_SETTLE_MS`

Source: `chunk-k2pjtcda.js` · offset 191715437 · sha256 `939f4db3…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `7000`.

From docs: Cap on how long the runner counts a session as busy for the `--drain-wait-sec` drain after a turn finishes, while the session's process reports the turn's end to Anthropic.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_PUSH_OUTCOME_ON_RELEASE`

Source: `chunk-k2pjtcda.js` · offset 191787730 · sha256 `ab9e00d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787730.

**Undocumented**

### `SELF_HOSTED_RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-k2pjtcda.js` · offset 191820395 · sha256 `854a99a1…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191820395.

**Undocumented**

### `SELF_HOSTED_RUNNER_REMOVE_SESSION_STATE`

Source: `chunk-k2pjtcda.js` · offset 191787956 · sha256 `804b6083…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787956.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-k2pjtcda.js` · offset 191784927 · sha256 `b92e6ac9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191784927.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MIN`

Source: `chunk-k2pjtcda.js` · offset 191820441 · sha256 `d0b6f6af…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191820441.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-k2pjtcda.js` · offset 191821512 · sha256 `1c987ddd…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191821512.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_SEC`

Source: `chunk-k2pjtcda.js` · offset 191820479 · sha256 `d5c3bc87…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191820479.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191714779 · sha256 `b315d588…` · 3 read sites

Read as: number (parsed as a number). Default (from code): `5000`.

Undocumented; read at `chunk-k2pjtcda.js` offset 191714779.

**Undocumented**

### `SELF_HOSTED_RUNNER_SIGKILL_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191714640 · sha256 `bd834a06…`

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner waits for the OS to deliver `SIGKILL` to a child stuck in uninterruptible I/O before exiting itself.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_SIGKILL_TIMEOUT_MS`

Source: `chunk-k2pjtcda.js` · offset 191819994 · sha256 `79e46d6b…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191819994.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-k2pjtcda.js` · offset 191722255 · sha256 `8252795b…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191722255.

**Undocumented**

### `SELF_HOSTED_RUNNER_TRUST_WORKSPACE`

Source: `chunk-k2pjtcda.js` · offset 191787841 · sha256 `6405b7e1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787841.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-acxptg39.js` · offset 189834420 · sha256 `37709674…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-acxptg39.js` offset 189834420.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-acxptg39.js` · offset 188370791 · sha256 `d34c78d3…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Documented: https://code.claude.com/docs/en/env-vars

### `SRT_DEBUG`

Source: `chunk-75pwjp0k.js` · offset 183589209 · sha256 `a3a90306…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-75pwjp0k.js` offset 183589209.

**Undocumented**

### `SWE_BENCH_INSTANCE_ID`

Source: `chunk-721k6cws.js` · offset 181895857 · sha256 `92750357…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-721k6cws.js` offset 181895857.

**Undocumented**

### `SWE_BENCH_RUN_ID`

Source: `chunk-721k6cws.js` · offset 181895805 · sha256 `b371b98c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-721k6cws.js` offset 181895805.

**Undocumented**

### `SWE_BENCH_TASK_ID`

Source: `chunk-721k6cws.js` · offset 181895910 · sha256 `1acfb392…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-721k6cws.js` offset 181895910.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-j7rgjcpa.js` · offset 185844474 · sha256 `0fd4c0b3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185844474.

**Undocumented**

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-acxptg39.js` · offset 191168600 · sha256 `80869434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 191168600.

**Undocumented**

### `USE_API_CONTEXT_MANAGEMENT`

Source: `chunk-721k6cws.js` · offset 181809290 · sha256 `1cdd37f8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181809290.

**Undocumented**

### `USE_BUILTIN_RIPGREP`

Source: `chunk-hnd61wvn.js` · offset 184444157 · sha256 `b64426c9…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code

Documented: https://code.claude.com/docs/en/env-vars

### `USE_LOCAL_OAUTH`

Source: `chunk-er9srhy5.js` · offset 198060447 · sha256 `859f5930…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-er9srhy5.js` offset 198060447.

**Undocumented**

### `USE_STAGING_OAUTH`

Source: `chunk-er9srhy5.js` · offset 198060512 · sha256 `474ca94d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-er9srhy5.js` offset 198060512.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-qkt5evp3.js` · offset 191573109 · sha256 `173e4cd4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qkt5evp3.js` offset 191573109.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-xpwj991w.js` · offset 213202758 · sha256 `20d7f7cb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xpwj991w.js` offset 213202758.

**Undocumented**

## Providers: Amazon Bedrock and AWS

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-j7rgjcpa.js` · offset 185928992 · sha256 `e97fa437…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_BASE_URL`

Source: `chunk-j7rgjcpa.js` · offset 185933475 · sha256 `0a7a75f0…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Claude Platform on AWS endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_WORKSPACE_ID`

Source: `chunk-d002c5rj.js` · offset 203677696 · sha256 `6cf298c7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Required for Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_BASE_URL`

Source: `chunk-j7rgjcpa.js` · offset 185933247 · sha256 `befad766…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Amazon Bedrock endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`

Source: `chunk-j7rgjcpa.js` · offset 185933358 · sha256 `bfdce098…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the Amazon Bedrock Mantle endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_REGION_PREFIX`

Source: `chunk-721k6cws.js` · offset 181435086 · sha256 `6e9f466d…`

Read as: enum (compared against fixed values). Values: `us`, `eu`, `apac`, `jp`, `au`, `global`.

From docs: Cross-region inference profile prefix (`us`, `eu`, `apac`, `jp`, `au`, or `global`) Claude Code tries first instead of the one derived from the AWS region.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_SERVICE_TIER`

Source: `chunk-j7rgjcpa.js` · offset 185926473 · sha256 `b387382a…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock service tier (`default`, `flex`, or `priority`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`

Source: `chunk-acxptg39.js` · offset 189097801 · sha256 `5c5cdacf…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override AWS region for the Haiku-class model when using Amazon Bedrock or Amazon Bedrock Mantle.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_ACCESS_KEY_ID`

Source: `chunk-f72fzxpc.js` · offset 198648678 · sha256 `0734f87e…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198648678.

**Undocumented**

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-j7rgjcpa.js` · offset 185926596 · sha256 `4790d6c3…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_CONFIG_FILE`

Source: `chunk-8rnmsc7r.js` · offset 198183768 · sha256 `1d954014…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8rnmsc7r.js` offset 198183768.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_FULL_URI`

Source: `chunk-bj4yez1w.js` · offset 213317891 · sha256 `8a04c787…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-bj4yez1w.js` offset 213317891.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`

Source: `chunk-bj4yez1w.js` · offset 213317840 · sha256 `cb4cf687…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-bj4yez1w.js` offset 213317840.

**Undocumented**

### `AWS_DEFAULT_REGION`

Source: `chunk-f72fzxpc.js` · offset 198648630 · sha256 `20ee042a…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198648630.

**Undocumented**

### `AWS_ENDPOINT_URL`

Source: `chunk-g5brps3g.js` · offset 180164458 · sha256 `1a0caa05…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-g5brps3g.js` offset 180164458.

**Undocumented**

### `AWS_ENDPOINT_URL_STS`

Source: `chunk-g5brps3g.js` · offset 180164434 · sha256 `31d2a84c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-g5brps3g.js` offset 180164434.

**Undocumented**

### `AWS_EXECUTION_ENV`

Source: `chunk-p8hvn3xb.js` · offset 198464342 · sha256 `1d96876d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `AWS_ECS_FARGATE`, `AWS_ECS_EC2`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-p8hvn3xb.js` offset 198464342.

**Undocumented**

### `AWS_LAMBDA_FUNCTION_NAME`

Source: `chunk-p8hvn3xb.js` · offset 198329838 · sha256 `6ca7392d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-p8hvn3xb.js` offset 198329838.

**Undocumented**

### `AWS_PROFILE`

Source: `chunk-8rnmsc7r.js` · offset 198183413 · sha256 `53e60fe7…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8rnmsc7r.js` offset 198183413.

**Undocumented**

### `AWS_REGION`

Source: `chunk-f72fzxpc.js` · offset 198648606 · sha256 `ccf42d2f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `us-east-1`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198648606.

**Undocumented**

### `AWS_ROLE_ARN`

Source: `chunk-dws5mazw.js` · offset 213305507 · sha256 `91a608bc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dws5mazw.js` offset 213305507.

**Undocumented**

### `AWS_SECRET_ACCESS_KEY`

Source: `chunk-f72fzxpc.js` · offset 198648709 · sha256 `71df3a7a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198648709.

**Undocumented**

### `AWS_SESSION_TOKEN`

Source: `chunk-f72fzxpc.js` · offset 198648848 · sha256 `5cdde123…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198648848.

**Undocumented**

### `AWS_SHARED_CREDENTIALS_FILE`

Source: `chunk-8rnmsc7r.js` · offset 198183864 · sha256 `aab2cfbd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8rnmsc7r.js` offset 198183864.

**Undocumented**

### `AWS_USE_FIPS_ENDPOINT`

Source: `chunk-v1s2t7sq.js` · offset 204917019 · sha256 `76b4ea55…`

Read as: string (trimmed; empty is treated as unset). Values: `true`.

Undocumented; read at `chunk-v1s2t7sq.js` offset 204917019.

**Undocumented**

### `AWS_WEB_IDENTITY_TOKEN_FILE`

Source: `chunk-dws5mazw.js` · offset 213305478 · sha256 `651dbdfb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dws5mazw.js` offset 213305478.

**Undocumented**

### `CLAUDE_CODE_AWS_CHAIN_RESOLVE_TIMEOUT_MS`

Source: `chunk-721k6cws.js` · offset 182064063 · sha256 `17165e62…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647. Default (from code): `60000`.

From docs: Time in milliseconds Claude Code waits for the AWS default credential provider chain to produce credentials before the request fails with `AWS default-chain credential resolve timed out` (default: `60000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_DEFAULT`

Source: `chunk-j7rgjcpa.js` · offset 185941847 · sha256 `d0d6c187…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from treating an Amazon Bedrock streaming response with a missing or empty `Content-Type` header as Amazon Bedrock's binary event stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_GUARD`

Source: `chunk-j7rgjcpa.js` · offset 185942096 · sha256 `21e859a3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the check that an Amazon Bedrock streaming response carries the `application/vnd.amazon.eventstream` content-type.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`

Source: `chunk-5g8p9x0b.js` · offset 196215373 · sha256 `9bdd4f8f…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip client-side authentication for Claude Platform on AWS, for gateways that sign requests themselves

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_AWS_CRED_CACHE`

Source: `chunk-721k6cws.js` · offset 181432517 · sha256 `bb5f5050…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off the in-process cache of credentials resolved from the AWS default credential provider chain, so Claude Code resolves the chain on every API request.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_BEDROCK_AUTH`

Source: `chunk-5g8p9x0b.js` · offset 196215298 · sha256 `92a4d50a…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MANTLE_AUTH`

Source: `chunk-5g8p9x0b.js` · offset 196215447 · sha256 `f79d4f5c…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock Mantle (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_AWS`

Source: `chunk-w3s0xmfk.js` · offset 179181285 · sha256 `c6be261e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Claude Platform on AWS

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_BEDROCK`

Source: `chunk-w3s0xmfk.js` · offset 179181163 · sha256 `fd5e84a3…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Amazon Bedrock

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_MANTLE`

Source: `chunk-w3s0xmfk.js` · offset 179181388 · sha256 `7718029e…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use the Amazon Bedrock Mantle endpoint

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`

Source: `chunk-j7rgjcpa.js` · offset 185940071 · sha256 `679d9258…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable the byte-level streaming idle watchdog on Amazon Bedrock `vnd.amazon.eventstream` responses, which also enables the first-byte deadline on Bedrock streaming requests.

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Google Vertex AI and Google Cloud

### `ANTHROPIC_GOOGLE_CLOUD_BASE_URL`

Source: `chunk-acxptg39.js` · offset 187952643 · sha256 `99675c8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `https://claude.googleapis.com`.

Undocumented; read at `chunk-acxptg39.js` offset 187952643.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_LOCATION`

Source: `chunk-d002c5rj.js` · offset 203678288 · sha256 `50d42c5b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `global`.

Undocumented; read at `chunk-d002c5rj.js` offset 203678288.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_PROJECT`

Source: `chunk-721k6cws.js` · offset 182066350 · sha256 `b0231252…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 182066350.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID`

Source: `chunk-d002c5rj.js` · offset 203678062 · sha256 `719be76f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-d002c5rj.js` offset 203678062.

**Undocumented**

### `ANTHROPIC_VERTEX_BASE_URL`

Source: `chunk-j7rgjcpa.js` · offset 185933682 · sha256 `b34e6459…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override Google Cloud's Agent Platform endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_VERTEX_PROJECT_ID`

Source: `chunk-721k6cws.js` · offset 182066177 · sha256 `7d0f0ea1…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: GCP project ID that Google Cloud's Agent Platform requests are addressed to.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_GOOGLE_CLOUD_AUTH`

Source: `chunk-5g8p9x0b.js` · offset 196215597 · sha256 `9beecc05…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196215597.

**Undocumented**

### `CLAUDE_CODE_SKIP_VERTEX_AUTH`

Source: `chunk-5g8p9x0b.js` · offset 196215514 · sha256 `3897a5fc…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Google authentication for Google Cloud's Agent Platform (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`

Source: `chunk-w3s0xmfk.js` · offset 179181332 · sha256 `95ef3a64…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w3s0xmfk.js` offset 179181332.

**Undocumented**

### `CLAUDE_CODE_USE_VERTEX`

Source: `chunk-w3s0xmfk.js` · offset 179181204 · sha256 `9d4aaeb0…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `CLOUD_ML_REGION`

Source: `chunk-q3se8bhm.js` · offset 179088335 · sha256 `d14e27f0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-q3se8bhm.js` offset 179088335.

**Undocumented**

### `CLOUDSDK_ACTIVE_CONFIG_NAME`

Source: `chunk-721k6cws.js` · offset 182013327 · sha256 `00daa6d2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 182013327.

**Undocumented**

### `CLOUDSDK_AUTH_ACCESS_TOKEN`

Source: `chunk-an6xhrk3.js` · offset 196657400 · sha256 `aa35dfcd…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-an6xhrk3.js` offset 196657400.

**Undocumented**

### `CLOUDSDK_CONFIG`

Source: `chunk-f72fzxpc.js` · offset 198584880 · sha256 `a53236c8…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198584880.

**Undocumented**

### `gcloud_project`

Source: `chunk-f72fzxpc.js` · offset 198670703 · sha256 `232389f7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198670703.

**Undocumented**

### `GCLOUD_PROJECT`

Source: `chunk-f72fzxpc.js` · offset 198670641 · sha256 `3d9c3b37…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198670641.

**Undocumented**

### `google_application_credentials`

Source: `chunk-f72fzxpc.js` · offset 198666809 · sha256 `b73615be…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198666809.

**Undocumented**

### `GOOGLE_APPLICATION_CREDENTIALS`

Source: `chunk-f72fzxpc.js` · offset 198666765 · sha256 `c2e78809…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198666765.

**Undocumented**

### `google_cloud_project`

Source: `chunk-f72fzxpc.js` · offset 198670731 · sha256 `b763364f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198670731.

**Undocumented**

### `GOOGLE_CLOUD_PROJECT`

Source: `chunk-f72fzxpc.js` · offset 198670669 · sha256 `17e9b022…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198670669.

**Undocumented**

### `GOOGLE_CLOUD_WORKSTATIONS`

Source: `chunk-w397p0p5.js` · offset 179203957 · sha256 `05ba04cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203957.

**Undocumented**

### `VERTEX_REGION_CLAUDE_3_5_HAIKU`

Source: `chunk-q3se8bhm.js` · offset 179085559 · sha256 `f4a42187…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Haiku when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_5_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179085280 · sha256 `b0163304…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_7_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179085336 · sha256 `9058fadb…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.7 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179086186 · sha256 `1f4dbfd4…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179086032 · sha256 `17ff2060…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_1_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085720 · sha256 `26ffeba1…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.1 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085772 · sha256 `ba882f91…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179085392 · sha256 `7fe0e77c…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085824 · sha256 `73a23bda…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179085448 · sha256 `120c2066…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_7_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085876 · sha256 `364310a0…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.7 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_8_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085928 · sha256 `3b69250d…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.8 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179085980 · sha256 `58a45cb7…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5.5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179085504 · sha256 `07076092…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-q3se8bhm.js` offset 179085504.

**Undocumented**

### `VERTEX_REGION_CLAUDE_5_OPUS`

Source: `chunk-q3se8bhm.js` · offset 179086236 · sha256 `8e8c2421…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_SONNET`

Source: `chunk-q3se8bhm.js` · offset 179086086 · sha256 `1a6f9b02…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5`

Source: `chunk-q3se8bhm.js` · offset 179086137 · sha256 `ef732c7f…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5_1`

Source: `chunk-q3se8bhm.js` · offset 179085613 · sha256 `0e9c5375…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5.1 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_HAIKU_4_5`

Source: `chunk-q3se8bhm.js` · offset 179085667 · sha256 `bdaa3937…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Haiku 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Microsoft Foundry and Azure

### `ANTHROPIC_FOUNDRY_API_KEY`

Source: `chunk-j7rgjcpa.js` · offset 185927392 · sha256 `6edea27f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key for Microsoft Foundry authentication (see Microsoft Foundry)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_AUTH_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 185927305 · sha256 `072afdc4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Bearer token for Microsoft Foundry authentication, such as a Microsoft Entra access token.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_BASE_URL`

Source: `chunk-acxptg39.js` · offset 187952746 · sha256 `42cda74f…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Full base URL for the Microsoft Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_RESOURCE`

Source: `chunk-d002c5rj.js` · offset 203677394 · sha256 `3630aefc…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Microsoft Foundry resource name (for example, `my-resource`).

Documented: https://code.claude.com/docs/en/env-vars

### `AZURE_CLIENT_ID`

Source: `chunk-4v4n4srf.js` · offset 199219711 · sha256 `be8e8739…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `AZURE_FUNCTIONS_ENVIRONMENT`

Source: `chunk-w397p0p5.js` · offset 179205058 · sha256 `0fa1ac42…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205058.

**Undocumented**

### `AZURE_TENANT_ID`

Source: `chunk-4v4n4srf.js` · offset 199219669 · sha256 `b705b6d3…` · 6 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`

Source: `chunk-d002c5rj.js` · offset 203677484 · sha256 `42d8ec8b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Azure authentication for Microsoft Foundry, for a proxy or gateway that injects its own `Authorization` header.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_FOUNDRY`

Source: `chunk-w3s0xmfk.js` · offset 179181244 · sha256 `d289ae80…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Microsoft Foundry

Documented: https://code.claude.com/docs/en/env-vars

## Providers: gateways

### `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`

Source: `chunk-721k6cws.js` · offset 181721430 · sha256 `e51b98ea…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to populate the `/model` picker from your gateway's `/v1/models` endpoint when `ANTHROPIC_BASE_URL` points at an Anthropic-compatible gateway such as LiteLLM, Kong, or an internal proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_HINT_HEADERS`

Source: `chunk-j7rgjcpa.js` · offset 185921113 · sha256 `e72abd56…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to send the gateway hint headers, such as `x-claude-code-request-class` and `x-claude-code-compaction`, on a custom proxy or a third-party provider such as Amazon Bedrock or Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_MODEL_DISCOVERY_TIMEOUT_MS`

Source: `chunk-721k6cws.js` · offset 181723179 · sha256 `07d66406…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true. Default (from code): `3000`.

From docs: Timeout in milliseconds for the gateway model discovery request that `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` turns on (default: `3000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-g6yz7gnr.js` · offset 196501480 · sha256 `c4cff902…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-g6yz7gnr.js` offset 196501480.

**Undocumented**

### `CLAUDE_CODE_HOST_GATEWAY_LINEAGE`

Source: `chunk-p614p40d.js` · offset 179262641 · sha256 `8d70ffb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p614p40d.js` offset 179262641.

**Undocumented**

### `CLAUDE_CODE_USE_GATEWAY`

Source: `chunk-721k6cws.js` · offset 182032547 · sha256 `3c6159ee…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 182032547.

**Undocumented**

### `CLAUDE_GATEWAY_ALLOW_LOOPBACK`

Source: `chunk-v1s2t7sq.js` · offset 204893889 · sha256 `e63dfe37…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-v1s2t7sq.js` offset 204893889.

**Undocumented**

### `CLAUDE_GATEWAY_DRAIN_TIMEOUT_MS`

Source: `chunk-rp526nmc.js` · offset 205112499 · sha256 `4cc46a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147000000, digitsOnly true. Default (from code): `25000`.

Undocumented; read at `chunk-rp526nmc.js` offset 205112499.

**Undocumented**

### `CLAUDE_GATEWAY_LOG_LEVEL`

Source: `chunk-ex7vkkqh.js` · offset 203785501 · sha256 `de2a0fcd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ex7vkkqh.js` offset 203785501.

**Undocumented**

### `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY`

Source: `chunk-v1s2t7sq.js` · offset 204893580 · sha256 `8ab0e5da…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-v1s2t7sq.js` offset 204893580.

**Undocumented**

## Telemetry and observability

### `BETA_TRACING_ENDPOINT`

Source: `chunk-5qkmjxyd.js` · offset 184658070 · sha256 `0b8e0086…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OTLP endpoint for detailed beta tracing: with `ENABLE_BETA_TRACING_DETAILED=1`, logs and traces go there instead of to the configured exporters.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BYOC_ENABLE_DATADOG`

Source: `chunk-k2pjtcda.js` · offset 191710753 · sha256 `9657eb08…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191710753.

**Undocumented**

### `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS`

Source: `chunk-js2dzzhq.js` · offset 182625357 · sha256 `f59cfbdd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `15000`.

Undocumented; read at `chunk-js2dzzhq.js` offset 182625357.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`

Source: `chunk-cfmwnndq.js` · offset 181334638 · sha256 `12bbf696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to route the "How is Claude doing?" session quality survey to your own OpenTelemetry collector when Anthropic-bound nonessential traffic is blocked.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TELEMETRY`

Source: `chunk-b42f9ayq.js` · offset 212260299 · sha256 `3b331164…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable OpenTelemetry data collection for metrics and logging.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-5qkmjxyd.js` · offset 184665232 · sha256 `76f8b26a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Enable span tracing (required).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF`

Source: `chunk-721k6cws.js` · offset 181922865 · sha256 `a3ff8f93…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-721k6cws.js` offset 181922865.

**Undocumented**

### `CLAUDE_CODE_GZIP_DATADOG_LOGS`

Source: `chunk-js2dzzhq.js` · offset 182622163 · sha256 `6414c572…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-js2dzzhq.js` offset 182622163.

**Undocumented**

### `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`

Source: `chunk-5qkmjxyd.js` · offset 184657269 · sha256 `58cae1fa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `61440`.

From docs: Maximum length of content-bearing OpenTelemetry attributes (model responses, tool content, system prompts, raw API bodies), truncation marker included, in UTF-16 code units (default: 61440, i.e. 60 KB).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_DIAG_STDERR`

Source: `chunk-vh9v6s05.js` · offset 191581510 · sha256 `bc37fcc6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to write OpenTelemetry exporter diagnostic errors to stderr.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`

Source: `chunk-b42f9ayq.js` · offset 212265042 · sha256 `5a408a7f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Timeout in milliseconds for flushing pending OpenTelemetry spans (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`

Source: `chunk-721k6cws.js` · offset 182100559 · sha256 `240e3e9d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`

Source: `chunk-b42f9ayq.js` · offset 212244937 · sha256 `c8cd5ac8…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `2000`.

From docs: Timeout in milliseconds for the OpenTelemetry exporter to finish on shutdown (default: 2000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PERFETTO_TRACE`

Source: `chunk-5qkmjxyd.js` · offset 184663986 · sha256 `17ecb006…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5qkmjxyd.js` offset 184663986.

**Undocumented**

### `DISABLE_TELEMETRY`

Source: `chunk-k2pjtcda.js` · offset 191710815 · sha256 `33ea0227…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of telemetry. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn telemetry back on.

Documented: https://code.claude.com/docs/en/env-vars

### `DO_NOT_TRACK`

Source: `chunk-k2pjtcda.js` · offset 191710858 · sha256 `91dfe981…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to opt out of telemetry, with the same effect as `DISABLE_TELEMETRY`, including making Remote Control and the other features that need feature-flag fetching unavailable.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_BETA_TRACING_DETAILED`

Source: `chunk-5qkmjxyd.js` · offset 184658030 · sha256 `f081d785…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1`, together with `BETA_TRACING_ENDPOINT`, to turn on detailed beta tracing, which adds content-bearing span attributes and the `claude_code.hook` span.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-5qkmjxyd.js` · offset 184665281 · sha256 `7a82f69c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5qkmjxyd.js` offset 184665281.

**Undocumented**

### `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-5qkmjxyd.js` · offset 184657311 · sha256 `d5f795ab…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Standard OpenTelemetry SDK limit on attribute value length.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_EXPORTER_OTLP_*_ENDPOINT`

Source: `chunk-b42f9ayq.js` · offset 212266502 · sha256 `b4d67e9b…` · 4 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_HEADERS`

Source: `chunk-b42f9ayq.js` · offset 212268752 · sha256 `ae4c183e…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, `OTEL_EXPORTER_OTLP_METRICS_HEADERS`, `OTEL_EXPORTER_OTLP_TRACES_HEADERS`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_INSECURE`

Source: `chunk-ym43qfss.js` · offset 219823155 · sha256 `9c1196e8…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_ENDPOINT`

Source: `chunk-ym43qfss.js` · offset 219823071 · sha256 `807d3ae4…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP collector endpoint for all signals

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_HEADERS`

Source: `chunk-ym43qfss.js` · offset 219822653 · sha256 `bba3c17d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Authentication headers for OTLP

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`

Source: `chunk-b42f9ayq.js` · offset 212258510 · sha256 `a97eb978…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for logs, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`

Source: `chunk-b42f9ayq.js` · offset 212257456 · sha256 `87f5ee3b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for metrics, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-b42f9ayq.js` · offset 212253647 · sha256 `d703ee47…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Metrics temporality preference (default: `delta`).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_PROTOCOL`

Source: `chunk-b42f9ayq.js` · offset 212257082 · sha256 `c0b54b69…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for OTLP exporter, applies to all signals.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Source: `chunk-5qkmjxyd.js` · offset 184663158 · sha256 `e359194f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP traces endpoint, overrides `OTEL_EXPORTER_OTLP_ENDPOINT`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`

Source: `chunk-b42f9ayq.js` · offset 212259560 · sha256 `2ec5a16b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for traces, overrides `OTEL_EXPORTER_OTLP_PROTOCOL`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOG_ASSISTANT_RESPONSES`

Source: `chunk-y3fvjpjn.js` · offset 184652864 · sha256 `0c8aef2c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to include the model's response text on `assistant_response` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_MANAGED_SETTINGS`

Source: `chunk-5g8p9x0b.js` · offset 196208488 · sha256 `05fbc9d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to add the redacted managed settings, and a SHA-256 digest of the settings before redaction, to `managed_settings_resolved` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_RAW_API_BODIES`

Source: `chunk-acxptg39.js` · offset 188856362 · sha256 `c83da780…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Emit Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_CONTENT`

Source: `chunk-721k6cws.js` · offset 181883755 · sha256 `0697bef6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool content in the `tool.output` OpenTelemetry span event.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_DETAILS`

Source: `chunk-721k6cws.js` · offset 181882455 · sha256 `499d0933…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool input arguments, MCP server names, user-authored workflow names, raw error strings on tool failures, the refusal `category` on `api_refusal` events, and other tool details in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_USER_PROMPTS`

Source: `chunk-5qkmjxyd.js` · offset 184657789 · sha256 `55cbaa16…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include user prompt text in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-5qkmjxyd.js` · offset 184657352 · sha256 `ead31d61…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGS_EXPORT_INTERVAL`

Source: `chunk-721k6cws.js` · offset 181917341 · sha256 `cc3fa137…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Logs export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOGS_EXPORTER`

Source: `chunk-b42f9ayq.js` · offset 212258486 · sha256 `0ab3e676…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Logs/events exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRIC_EXPORT_INTERVAL`

Source: `chunk-b42f9ayq.js` · offset 212256973 · sha256 `3b7d7cea…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `60000`.

From docs: Export interval in milliseconds (default: 60000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_EXPORTER`

Source: `chunk-b42f9ayq.js` · offset 212261096 · sha256 `55fadc06…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `prometheus`.

From docs: Metrics exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`

Source: `chunk-y3fvjpjn.js` · offset 184650235 · sha256 `3ca51dc4…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude account UUID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_ENTRYPOINT`

Source: `chunk-y3fvjpjn.js` · offset 184649885 · sha256 `69f3a49b…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include the session entrypoint in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_REPOSITORY`

Source: `chunk-y3fvjpjn.js` · offset 184649964 · sha256 `3cac1c82…` · 2 read sites

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to tag OpenTelemetry metrics and events with `vcs.*` attributes identifying the session's repository (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES`

Source: `chunk-y3fvjpjn.js` · offset 184649036 · sha256 `4f40998f…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: As of v2.1.161, Claude Code attaches `OTEL_RESOURCE_ATTRIBUTES` keys to metric datapoint labels.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_SESSION_ID`

Source: `chunk-y3fvjpjn.js` · offset 184649207 · sha256 `e23b1eb6…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude session ID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_VERSION`

Source: `chunk-y3fvjpjn.js` · offset 184649353 · sha256 `f2288c03…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include Claude Code version in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_RESOURCE_ATTRIBUTES`

Source: `chunk-k2pjtcda.js` · offset 191709665 · sha256 `3949d66e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-5qkmjxyd.js` · offset 184657403 · sha256 `b73a7c57…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_TRACES_EXPORT_INTERVAL`

Source: `chunk-b42f9ayq.js` · offset 212263482 · sha256 `3104fb4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Span batch export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_TRACES_EXPORTER`

Source: `chunk-b42f9ayq.js` · offset 212259427 · sha256 `947cd0a5…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Traces exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `TRACEPARENT`

Source: `chunk-5qkmjxyd.js` · offset 184668441 · sha256 `13183cc6…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TRACESTATE`

Source: `chunk-5qkmjxyd.js` · offset 184668517 · sha256 `d8947714…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5qkmjxyd.js` offset 184668517.

**Undocumented**

## Network, proxy and TLS

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-n9nj0gvt.js` · offset 212102516 · sha256 `df0eedcf…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102516.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-n9nj0gvt.js` · offset 212102486 · sha256 `798ebf6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102486.

**Undocumented**

### `all_proxy`

Source: `chunk-1k1qsm5t.js` · offset 191561765 · sha256 `9fcdc466…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1k1qsm5t.js` offset 191561765.

**Undocumented**

### `ALL_PROXY`

Source: `chunk-1k1qsm5t.js` · offset 191561742 · sha256 `728ff8d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1k1qsm5t.js` offset 191561742.

**Undocumented**

### `CCR_AGENT_PROXY_CA_CERT_B64`

Source: `chunk-n9nj0gvt.js` · offset 212102843 · sha256 `952592db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102843.

**Undocumented**

### `CCR_AGENT_PROXY_CA_WATCH_ENABLED`

Source: `chunk-n9nj0gvt.js` · offset 212102806 · sha256 `c1504a35…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102806.

**Undocumented**

### `CCR_AGENT_PROXY_ENABLED`

Source: `chunk-n9nj0gvt.js` · offset 212103146 · sha256 `04bb26ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212103146.

**Undocumented**

### `CCR_AGENT_PROXY_FRAME_HOSTS`

Source: `chunk-za8m7n4q.js` · offset 193637689 · sha256 `6f52e4fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-za8m7n4q.js` offset 193637689.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-n9nj0gvt.js` · offset 212102649 · sha256 `80a96f80…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102649.

**Undocumented**

### `CCR_AGENT_PROXY_NO_PROXY_LOCAL_ONLY`

Source: `chunk-n9nj0gvt.js` · offset 212102766 · sha256 `ff80511a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102766.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-n9nj0gvt.js` · offset 212102683 · sha256 `8d75b539…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102683.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-n9nj0gvt.js` · offset 212102618 · sha256 `f05f27c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102618.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-n9nj0gvt.js` · offset 212102725 · sha256 `32e23461…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212102725.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`

Source: `chunk-n9nj0gvt.js` · offset 212108006 · sha256 `6ddbb857…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212108006.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`

Source: `chunk-n9nj0gvt.js` · offset 212107796 · sha256 `15597b8e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212107796.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_HOSTS`

Source: `chunk-n9nj0gvt.js` · offset 212113961 · sha256 `86f791d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212113961.

**Undocumented**

### `CLAUDE_CODE_CERT_STORE`

Source: `chunk-g5brps3g.js` · offset 180148742 · sha256 `5cf53913…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Comma-separated list of CA certificate sources for TLS connections.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_CERT`

Source: `chunk-acxptg39.js` · offset 187951861 · sha256 `cc37bcd5…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Path to client certificate file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY`

Source: `chunk-d002c5rj.js` · offset 203679261 · sha256 `d552242d…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Path to client private key file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`

Source: `chunk-g5brps3g.js` · offset 180151831 · sha256 `0357f9e0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MTLS_RELOAD_ON_STALE_CONNECTION`

Source: `chunk-acxptg39.js` · offset 188934545 · sha256 `3a589ab6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from re-reading the mTLS client certificate and key when an API request fails with a connection-level error, such as a connection reset or a TLS handshake error.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`

Source: `chunk-qyn5bdge.js` · offset 191533659 · sha256 `bba7fbe6…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qyn5bdge.js` offset 191533659.

**Undocumented**

### `CLAUDE_CODE_HTTP_PROXY`

Source: `chunk-z62ps7p2.js` · offset 181260269 · sha256 `5dbec935…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62ps7p2.js` offset 181260269.

**Undocumented**

### `CLAUDE_CODE_HTTPS_PROXY`

Source: `chunk-z62ps7p2.js` · offset 181260326 · sha256 `48b35a6e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62ps7p2.js` offset 181260326.

**Undocumented**

### `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`

Source: `chunk-g5brps3g.js` · offset 180161823 · sha256 `eab3e77a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-g5brps3g.js` offset 180161823.

**Undocumented**

### `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`

Source: `chunk-g5brps3g.js` · offset 180161008 · sha256 `15350379…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to allow the proxy to perform DNS resolution instead of the caller.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMULATE_PROXY_USAGE`

Source: `chunk-acxptg39.js` · offset 188919641 · sha256 `8836efb4…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188919641.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_USE_CCR_PROXY`

Source: `chunk-acxptg39.js` · offset 188250631 · sha256 `808a7134…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-acxptg39.js` offset 188250631.

**Undocumented**

### `CLAUDE_CODE_WEBSEARCH_USE_CCR_PROXY`

Source: `chunk-7n2w7emx.js` · offset 194717611 · sha256 `9aacb5ad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7n2w7emx.js` offset 194717611.

**Undocumented**

### `CLAUDE_RUNNER_USE_GIT_PROXY`

Source: `chunk-k2pjtcda.js` · offset 191787603 · sha256 `6dfb3f71…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-k2pjtcda.js` offset 191787603.

**Undocumented**

### `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH`

Source: `chunk-ym43qfss.js` · offset 219443880 · sha256 `af68cb3b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ym43qfss.js` offset 219443880.

**Undocumented**

### `HOSTALIASES`

Source: `chunk-acxptg39.js` · offset 189119454 · sha256 `ebc96d96…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-acxptg39.js` offset 189119454.

**Undocumented**

### `http_proxy`

Source: `chunk-75pwjp0k.js` · offset 183603975 · sha256 `846b41df…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-75pwjp0k.js` offset 183603975.

**Undocumented**

### `HTTP_PROXY`

Source: `chunk-75pwjp0k.js` · offset 183603951 · sha256 `aa98c1d0…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

From docs: Specify HTTP proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `https_proxy`

Source: `chunk-1k1qsm5t.js` · offset 191561717 · sha256 `33d51f7d…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1k1qsm5t.js` offset 191561717.

**Undocumented**

### `HTTPS_PROXY`

Source: `chunk-1k1qsm5t.js` · offset 191561692 · sha256 `3ac3671f…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Specify HTTPS proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `LOCALDOMAIN`

Source: `chunk-acxptg39.js` · offset 189119440 · sha256 `4df19f9d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-acxptg39.js` offset 189119440.

**Undocumented**

### `no_proxy`

Source: `chunk-75pwjp0k.js` · offset 183604106 · sha256 `da21c898…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`.

Undocumented; read at `chunk-75pwjp0k.js` offset 183604106.

**Undocumented**

### `NO_PROXY`

Source: `chunk-75pwjp0k.js` · offset 183604084 · sha256 `516bafd4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`. Default (from code): `not set`.

From docs: List of domains and IPs to which requests will be directly issued, bypassing proxy

Documented: https://code.claude.com/docs/en/env-vars

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-hnd61wvn.js` · offset 184297458 · sha256 `c69b8df7…` · 14 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-hnd61wvn.js` offset 184297458.

**Undocumented**

### `NODE_TLS_REJECT_UNAUTHORIZED`

Source: `chunk-acxptg39.js` · offset 189119409 · sha256 `1ec3d3d6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-acxptg39.js` offset 189119409.

**Undocumented**

### `RES_OPTIONS`

Source: `chunk-acxptg39.js` · offset 189119468 · sha256 `3e93abd5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-acxptg39.js` offset 189119468.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-qyn5bdge.js` · offset 191532009 · sha256 `fda13608…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qyn5bdge.js` offset 191532009.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-qyn5bdge.js` · offset 191532036 · sha256 `81e66882…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qyn5bdge.js` offset 191532036.

**Undocumented**

### `SSL_CERT_FILE`

Source: `chunk-n9nj0gvt.js` · offset 212112289 · sha256 `36128327…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212112289.

**Undocumented**

## Shell, terminal, OS and CI environment

### `__CFBundleIdentifier`

Source: `chunk-g6yz7gnr.js` · offset 196561511 · sha256 `a8824fe9…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Values: `com.googlecode.iterm2`, `com.anthropic.claude-code-url-handler`, `com.conductor.app`.

Undocumented; read at `chunk-g6yz7gnr.js` offset 196561511.

**Undocumented**

### `ALACRITTY_LOG`

Source: `chunk-w397p0p5.js` · offset 179201477 · sha256 `bfe1befc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201477.

**Undocumented**

### `ALLUSERSPROFILE`

Source: `chunk-j7rgjcpa.js` · offset 185620087 · sha256 `e227995c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185620087.

**Undocumented**

### `ANDROID_HOME`

Source: `chunk-c8ab5n0g.js` · offset 202616448 · sha256 `309f9171…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c8ab5n0g.js` offset 202616448.

**Undocumented**

### `ANDROID_SDK_ROOT`

Source: `chunk-c8ab5n0g.js` · offset 202616464 · sha256 `58d982c5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c8ab5n0g.js` offset 202616464.

**Undocumented**

### `APP_URL`

Source: `chunk-w397p0p5.js` · offset 179205125 · sha256 `883dc61c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205125.

**Undocumented**

### `APPDATA`

Source: `chunk-9c8h1t30.js` · offset 216178623 · sha256 `da8ef702…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216178623.

**Undocumented**

### `BROWSER`

Source: `chunk-88np9eym.js` · offset 207067234 · sha256 `ad8a905e…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `true`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-88np9eym.js` offset 207067234.

**Undocumented**

### `BUILDKITE`

Source: `chunk-w397p0p5.js` · offset 179205423 · sha256 `9466bfb7…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205423.

**Undocumented**

### `BUN_CHROME_PATH`

Source: `chunk-nvyqjp3n.js` · offset 195449646 · sha256 `497892ba…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nvyqjp3n.js` offset 195449646.

**Undocumented**

### `BUN_INSTALL`

Source: `chunk-j6572xt4.js` · offset 191393036 · sha256 `c3315b28…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j6572xt4.js` offset 191393036.

**Undocumented**

### `C9_PID`

Source: `chunk-w397p0p5.js` · offset 179204030 · sha256 `e4c27b8d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204030.

**Undocumented**

### `C9_USER`

Source: `chunk-w397p0p5.js` · offset 179204050 · sha256 `97e055e6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204050.

**Undocumented**

### `CF_PAGES`

Source: `chunk-w397p0p5.js` · offset 179204522 · sha256 `d2788c90…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204522.

**Undocumented**

### `CI`

Source: `chunk-8vmasb0d.js` · offset 192594599 · sha256 `2883b550…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8vmasb0d.js` offset 192594599.

**Undocumented**

### `CIRCLECI`

Source: `chunk-w397p0p5.js` · offset 179205382 · sha256 `032d464c…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205382.

**Undocumented**

### `CODER`

Source: `chunk-w397p0p5.js` · offset 179203764 · sha256 `dbd0f0f9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203764.

**Undocumented**

### `CODER_WORKSPACE_NAME`

Source: `chunk-w397p0p5.js` · offset 179203784 · sha256 `d922a1cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203784.

**Undocumented**

### `CODESPACES`

Source: `chunk-w397p0p5.js` · offset 179203665 · sha256 `d78687e1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203665.

**Undocumented**

### `COLORFGBG`

Source: `chunk-0mj9k44e.js` · offset 193088707 · sha256 `4bab16fa…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0mj9k44e.js` offset 193088707.

**Undocumented**

### `COLORTERM`

Source: `chunk-q933vkqs.js` · offset 212345860 · sha256 `f280844a…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-q933vkqs.js` offset 212345860.

**Undocumented**

### `ComSpec`

Source: `chunk-32f7exm7.js` · offset 205169583 · sha256 `d367c10d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-32f7exm7.js` offset 205169583.

**Undocumented**

### `COMSPEC`

Source: `chunk-w397p0p5.js` · offset 179206725 · sha256 `99cafcff…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `cmd.exe`.

Undocumented; read at `chunk-w397p0p5.js` offset 179206725.

**Undocumented**

### `ConEmuANSI`

Source: `chunk-w397p0p5.js` · offset 179201748 · sha256 `c8777282…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201748.

**Undocumented**

### `ConEmuPID`

Source: `chunk-w397p0p5.js` · offset 179201772 · sha256 `c4505517…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201772.

**Undocumented**

### `ConEmuTask`

Source: `chunk-w397p0p5.js` · offset 179201795 · sha256 `6160aec6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201795.

**Undocumented**

### `CURSOR_TRACE_ID`

Source: `chunk-5645472e.js` · offset 217475256 · sha256 `a240f1a4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-5645472e.js` offset 217475256.

**Undocumented**

### `DAYTONA_WS_ID`

Source: `chunk-w397p0p5.js` · offset 179203909 · sha256 `d76f1c62…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203909.

**Undocumented**

### `DEBUG`

Source: `chunk-4v4n4srf.js` · offset 198940783 · sha256 `3f2fec78…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Documented: https://code.claude.com/docs/en/env-vars

### `DENO_DEPLOYMENT_ID`

Source: `chunk-w397p0p5.js` · offset 179204572 · sha256 `a0569b4e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204572.

**Undocumented**

### `DEVPOD`

Source: `chunk-w397p0p5.js` · offset 179203837 · sha256 `a0e21599…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w397p0p5.js` offset 179203837.

**Undocumented**

### `DEVPOD_WORKSPACE_UID`

Source: `chunk-w397p0p5.js` · offset 179203858 · sha256 `7941e754…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179203858.

**Undocumented**

### `DISPLAY`

Source: `chunk-v4er1c8e.js` · offset 186320987 · sha256 `4dcc9e06…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-v4er1c8e.js` offset 186320987.

**Undocumented**

### `DYNO`

Source: `chunk-w397p0p5.js` · offset 179204413 · sha256 `5bfcb51f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204413.

**Undocumented**

### `EDITOR`

Source: `chunk-2q0edvsh.js` · offset 217812657 · sha256 `e2aba24c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2q0edvsh.js` offset 217812657.

**Undocumented**

### `FLY_APP_NAME`

Source: `chunk-w397p0p5.js` · offset 179204448 · sha256 `e98aa307…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204448.

**Undocumented**

### `FLY_MACHINE_ID`

Source: `chunk-w397p0p5.js` · offset 179204474 · sha256 `eb90c0ce…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204474.

**Undocumented**

### `FORCE_CODE_TERMINAL`

Source: `chunk-acxptg39.js` · offset 190250308 · sha256 `6d127f08…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-acxptg39.js` offset 190250308.

**Undocumented**

### `FORCE_COLOR`

Source: `chunk-acxptg39.js` · offset 187477794 · sha256 `15ab5bb8…` · 3 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-acxptg39.js` offset 187477794.

**Undocumented**

### `FORCE_HYPERLINK`

Source: `chunk-8vmasb0d.js` · offset 192594604 · sha256 `dbf93b31…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `1` to enable clickable OSC 8 hyperlinks when your terminal supports them but isn't auto-detected, or `0` to disable them.

Documented: https://code.claude.com/docs/en/env-vars

### `GCM_INTERACTIVE`

Source: `chunk-n9nj0gvt.js` · offset 212113182 · sha256 `6bbeb3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212113182.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151515 · sha256 `9c5226ea…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186151515.

**Undocumented**

### `GH_HOST`

Source: `chunk-j7rgjcpa.js` · offset 186151492 · sha256 `95d3efd7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186151492.

**Undocumented**

### `GH_REPO`

Source: `chunk-mj17gyf8.js` · offset 198103028 · sha256 `f70912ef…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mj17gyf8.js` offset 198103028.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151441 · sha256 `4d29d2e5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186151441.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-k2pjtcda.js` · offset 191666424 · sha256 `77c0011a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-k2pjtcda.js` offset 191666424.

**Undocumented**

### `GIT_CONFIG_COUNT`

Source: `chunk-75pwjp0k.js` · offset 183595870 · sha256 `ada3e46b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `0`.

Undocumented; read at `chunk-75pwjp0k.js` offset 183595870.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-k2pjtcda.js` · offset 191651344 · sha256 `c6d7625a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-k2pjtcda.js` offset 191651344.

**Undocumented**

### `GIT_CONFIG_KEY_*`

Source: `chunk-r7d018vr.js` · offset 184971622 · sha256 `b912f85a…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-j7rgjcpa.js` · offset 186038395 · sha256 `0cef416f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186038395.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-r7d018vr.js` · offset 184971732 · sha256 `56a8e5d7…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-r7d018vr.js` offset 184971732.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-j7rgjcpa.js` · offset 186038338 · sha256 `2580da38…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186038338.

**Undocumented**

### `GIT_CONFIG_VALUE_*`

Source: `chunk-r7d018vr.js` · offset 184971649 · sha256 `8dc48ba5…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_NO_LAZY_FETCH`

Source: `chunk-h4njzy9v.js` · offset 184848382 · sha256 `414fb533…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-h4njzy9v.js` offset 184848382.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-1k1qsm5t.js` · offset 191562932 · sha256 `58764ff1…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ssh`.

Undocumented; read at `chunk-1k1qsm5t.js` offset 191562932.

**Undocumented**

### `GIT_SSH_VARIANT`

Source: `chunk-acxptg39.js` · offset 187274780 · sha256 `c09659c3…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-acxptg39.js` offset 187274780.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-n9nj0gvt.js` · offset 212113048 · sha256 `e65f8626…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212113048.

**Undocumented**

### `GITHUB_ACTION_INPUTS`

Source: `chunk-5g8p9x0b.js` · offset 196254642 · sha256 `872d29c8…`

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-5g8p9x0b.js` offset 196254642.

**Undocumented**

### `GITHUB_ACTION_PATH`

Source: `chunk-721k6cws.js` · offset 181893993 · sha256 `63872dc2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181893993.

**Undocumented**

### `GITHUB_ACTIONS`

Source: `chunk-721k6cws.js` · offset 181892658 · sha256 `5cc8b904…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181892658.

**Undocumented**

### `GITHUB_ACTOR`

Source: `chunk-721k6cws.js` · offset 181568107 · sha256 `bdbdbc09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568107.

**Undocumented**

### `GITHUB_ACTOR_ID`

Source: `chunk-721k6cws.js` · offset 181568130 · sha256 `efc90f87…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568130.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151548 · sha256 `80d49428…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186151548.

**Undocumented**

### `GITHUB_ENV`

Source: `chunk-z62ps7p2.js` · offset 181264595 · sha256 `85a6c474…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181264595.

**Undocumented**

### `GITHUB_EVENT_NAME`

Source: `chunk-721k6cws.js` · offset 181893841 · sha256 `002d2186…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181893841.

**Undocumented**

### `GITHUB_EVENT_PATH`

Source: `chunk-z62ps7p2.js` · offset 181265114 · sha256 `4d6b1a09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181265114.

**Undocumented**

### `GITHUB_REPOSITORY`

Source: `chunk-721k6cws.js` · offset 181568159 · sha256 `98dca9d0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568159.

**Undocumented**

### `GITHUB_REPOSITORY_ID`

Source: `chunk-721k6cws.js` · offset 181568192 · sha256 `0a9247c9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568192.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER`

Source: `chunk-721k6cws.js` · offset 181568231 · sha256 `4bf7a1f3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568231.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER_ID`

Source: `chunk-721k6cws.js` · offset 181568275 · sha256 `11aaad60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181568275.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151463 · sha256 `d84c66c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 186151463.

**Undocumented**

### `GITHUB_WORKSPACE`

Source: `chunk-z62ps7p2.js` · offset 181264653 · sha256 `c45e337f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z62ps7p2.js` offset 181264653.

**Undocumented**

### `GITLAB_CI`

Source: `chunk-w397p0p5.js` · offset 179205338 · sha256 `3ee25c25…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205338.

**Undocumented**

### `GITPOD_WORKSPACE_ID`

Source: `chunk-w397p0p5.js` · offset 179203711 · sha256 `0bd1a41d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179203711.

**Undocumented**

### `GNOME_TERMINAL_SERVICE`

Source: `chunk-w397p0p5.js` · offset 179201233 · sha256 `8fcf299d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201233.

**Undocumented**

### `HISTFILE`

Source: `chunk-8p0q5f5t.js` · offset 200753306 · sha256 `e5c41ee2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8p0q5f5t.js` offset 200753306.

**Undocumented**

### `HOME`

Source: `chunk-f72fzxpc.js` · offset 198584959 · sha256 `dc770fd4…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198584959.

**Undocumented**

### `HOMEDRIVE`

Source: `chunk-j7rgjcpa.js` · offset 185627609 · sha256 `ae601c26…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185627609.

**Undocumented**

### `HOMEPATH`

Source: `chunk-j7rgjcpa.js` · offset 185627634 · sha256 `65099cdc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185627634.

**Undocumented**

### `HOSTNAME`

Source: `chunk-j7rgjcpa.js` · offset 185365887 · sha256 `5c1b2b57…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185365887.

**Undocumented**

### `INK_SCREEN_READER`

Source: `chunk-xr83kgh7.js` · offset 193036142 · sha256 `064450f6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr83kgh7.js` offset 193036142.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS`

Source: `chunk-gk22bggm.js` · offset 192699762 · sha256 `1054b8d6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gk22bggm.js` offset 192699762.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS_REWORKED`

Source: `chunk-gk22bggm.js` · offset 192699698 · sha256 `d49c5da5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gk22bggm.js` offset 192699698.

**Undocumented**

### `ITERM_SESSION_ID`

Source: `chunk-7r0n3sca.js` · offset 213421505 · sha256 `038ed3ab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7r0n3sca.js` offset 213421505.

**Undocumented**

### `JAVA_HOME`

Source: `chunk-n9nj0gvt.js` · offset 212094387 · sha256 `e32930cc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212094387.

**Undocumented**

### `JAVA_TOOL_OPTIONS`

Source: `chunk-hnd61wvn.js` · offset 184377372 · sha256 `eb2a2297…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hnd61wvn.js` offset 184377372.

**Undocumented**

### `K_SERVICE`

Source: `chunk-f72fzxpc.js` · offset 198566945 · sha256 `a48f12e6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f72fzxpc.js` offset 198566945.

**Undocumented**

### `KITTY_WINDOW_ID`

Source: `chunk-w397p0p5.js` · offset 179201432 · sha256 `19815f12…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201432.

**Undocumented**

### `KONSOLE_VERSION`

Source: `chunk-w397p0p5.js` · offset 179201186 · sha256 `3f5c80d0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201186.

**Undocumented**

### `KUBERNETES_SERVICE_HOST`

Source: `chunk-w397p0p5.js` · offset 179205487 · sha256 `d81719da…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205487.

**Undocumented**

### `LANG`

Source: `chunk-27q0zmd7.js` · offset 200527795 · sha256 `7a38024b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-27q0zmd7.js` offset 200527795.

**Undocumented**

### `LC_ALL`

Source: `chunk-27q0zmd7.js` · offset 200527774 · sha256 `bc2e1a24…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-27q0zmd7.js` offset 200527774.

**Undocumented**

### `LC_TERMINAL`

Source: `chunk-4shbtpv2.js` · offset 197008885 · sha256 `0ed931d5…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `iTerm2`. Default (from code): `unset`.

Undocumented; read at `chunk-4shbtpv2.js` offset 197008885.

**Undocumented**

### `LC_TIME`

Source: `chunk-27q0zmd7.js` · offset 200527784 · sha256 `65eda90a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-27q0zmd7.js` offset 200527784.

**Undocumented**

### `LOCALAPPDATA`

Source: `chunk-ke432dc0.js` · offset 178950068 · sha256 `b38fddba…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ke432dc0.js` offset 178950068.

**Undocumented**

### `MSYSTEM`

Source: `chunk-w397p0p5.js` · offset 179201684 · sha256 `11f36523…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201684.

**Undocumented**

### `NETLIFY`

Source: `chunk-w397p0p5.js` · offset 179204373 · sha256 `c4d87109…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204373.

**Undocumented**

### `NO_COLOR`

Source: `chunk-qxyxqdkg.js` · offset 180007921 · sha256 `48ee5637…` · 2 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-qxyxqdkg.js` offset 180007921.

**Undocumented**

### `NODE_DEBUG`

Source: `chunk-7w2qptvr.js` · offset 181165426 · sha256 `7d3efaa5…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7w2qptvr.js` offset 181165426.

**Undocumented**

### `NODE_OPTIONS`

Source: `chunk-q3se8bhm.js` · offset 179087057 · sha256 `914747b7…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-q3se8bhm.js` offset 179087057.

**Undocumented**

### `P4PORT`

Source: `chunk-w3s0xmfk.js` · offset 179185227 · sha256 `0e8d8e90…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w3s0xmfk.js` offset 179185227.

**Undocumented**

### `PATH`

Source: `chunk-f6y3mr7n.js` · offset 180088829 · sha256 `69e3a9e0…` · 21 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `/usr/local/bin:/usr/bin:/bin`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `PATHEXT`

Source: `chunk-f6y3mr7n.js` · offset 180087116 · sha256 `a603895c…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f6y3mr7n.js` offset 180087116.

**Undocumented**

### `PREFIX`

Source: `chunk-r1zezp01.js` · offset 207877116 · sha256 `b830d9ab…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r1zezp01.js` offset 207877116.

**Undocumented**

### `ProgramData`

Source: `chunk-4v4n4srf.js` · offset 199190195 · sha256 `f0de69b2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4v4n4srf.js` offset 199190195.

**Undocumented**

### `PROGRAMDATA`

Source: `chunk-j7rgjcpa.js` · offset 185620068 · sha256 `4679eb4b…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185620068.

**Undocumented**

### `ProgramFiles`

Source: `chunk-4v4n4srf.js` · offset 199190308 · sha256 `ae3c9ab2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4v4n4srf.js` offset 199190308.

**Undocumented**

### `PROJECT_DOMAIN`

Source: `chunk-w397p0p5.js` · offset 179204153 · sha256 `87e9f9c2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204153.

**Undocumented**

### `PWD`

Source: `chunk-hyr3xk9c.js` · offset 194324193 · sha256 `55d0de17…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hyr3xk9c.js` offset 194324193.

**Undocumented**

### `RAILWAY_ENVIRONMENT_NAME`

Source: `chunk-w397p0p5.js` · offset 179204239 · sha256 `46ffdcd9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204239.

**Undocumented**

### `RAILWAY_SERVICE_NAME`

Source: `chunk-w397p0p5.js` · offset 179204277 · sha256 `ff14b856…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w397p0p5.js` offset 179204277.

**Undocumented**

### `RENDER`

Source: `chunk-w397p0p5.js` · offset 179204332 · sha256 `85af1892…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204332.

**Undocumented**

### `REPL_ID`

Source: `chunk-w397p0p5.js` · offset 179204092 · sha256 `da03a20e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204092.

**Undocumented**

### `REPL_SLUG`

Source: `chunk-w397p0p5.js` · offset 179204113 · sha256 `7ae40c11…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204113.

**Undocumented**

### `SESSIONNAME`

Source: `chunk-w397p0p5.js` · offset 179201613 · sha256 `52edc75e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201613.

**Undocumented**

### `SHELL`

Source: `chunk-w397p0p5.js` · offset 179206706 · sha256 `d9d57ee3…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179206706.

**Undocumented**

### `SPACE_CREATOR_USER_ID`

Source: `chunk-w397p0p5.js` · offset 179205214 · sha256 `57bb1750…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205214.

**Undocumented**

### `SSH_AUTH_SOCK`

Source: `chunk-n9nj0gvt.js` · offset 212120078 · sha256 `45e4e696…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n9nj0gvt.js` offset 212120078.

**Undocumented**

### `SSH_CLIENT`

Source: `chunk-w397p0p5.js` · offset 179205789 · sha256 `23b2cf08…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205789.

**Undocumented**

### `SSH_CONNECTION`

Source: `chunk-w397p0p5.js` · offset 179205761 · sha256 `c840a5cf…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205761.

**Undocumented**

### `SSH_TTY`

Source: `chunk-w397p0p5.js` · offset 179205813 · sha256 `2607570d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205813.

**Undocumented**

### `STY`

Source: `chunk-w397p0p5.js` · offset 179201152 · sha256 `335a859b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201152.

**Undocumented**

### `SUDO_GID`

Source: `chunk-9c8h1t30.js` · offset 216057476 · sha256 `403e35b1…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-9c8h1t30.js` offset 216057476.

**Undocumented**

### `SUDO_UID`

Source: `chunk-9c8h1t30.js` · offset 216057463 · sha256 `8b3a2dac…` · 5 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-9c8h1t30.js` offset 216057463.

**Undocumented**

### `SUDO_USER`

Source: `chunk-9c8h1t30.js` · offset 216057489 · sha256 `68f43961…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216057489.

**Undocumented**

### `SystemRoot`

Source: `chunk-hnd61wvn.js` · offset 184400425 · sha256 `793aedf5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-hnd61wvn.js` offset 184400425.

**Undocumented**

### `SYSTEMROOT`

Source: `chunk-721k6cws.js` · offset 182011794 · sha256 `b421cf1e…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-721k6cws.js` offset 182011794.

**Undocumented**

### `TEAMCITY_VERSION`

Source: `chunk-8vmasb0d.js` · offset 192594632 · sha256 `61989b74…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8vmasb0d.js` offset 192594632.

**Undocumented**

### `TERM`

Source: `chunk-w397p0p5.js` · offset 179200875 · sha256 `cd581ed8…` · 17 read sites

Read as: string (trimmed; empty is treated as unset). Values: `xterm-ghostty`, `cygwin`. Default (from code): `unset`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM`

Source: `chunk-w397p0p5.js` · offset 179200982 · sha256 `75da1de5…` · 27 read sites

Read as: string (trimmed; empty is treated as unset). Values: `vscode`, `iTerm.app`, `Apple_Terminal`, `ghostty`, `WezTerm`, `tmux`, `mintty`. Default (from code): `unset`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM_VERSION`

Source: `chunk-gk22bggm.js` · offset 192692786 · sha256 `0dc37e73…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

Undocumented; read at `chunk-gk22bggm.js` offset 192692786.

**Undocumented**

### `TERMINAL`

Source: `chunk-32f7exm7.js` · offset 205169081 · sha256 `541785d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-32f7exm7.js` offset 205169081.

**Undocumented**

### `TERMINAL_EMULATOR`

Source: `chunk-w397p0p5.js` · offset 179200803 · sha256 `cf45b3e1…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `JetBrains-JediTerm`.

Undocumented; read at `chunk-w397p0p5.js` offset 179200803.

**Undocumented**

### `TERMINATOR_UUID`

Source: `chunk-w397p0p5.js` · offset 179201382 · sha256 `c7a22da2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201382.

**Undocumented**

### `TERMUX_VERSION`

Source: `chunk-r1zezp01.js` · offset 207877099 · sha256 `b7fed4d0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-r1zezp01.js` offset 207877099.

**Undocumented**

### `TILIX_ID`

Source: `chunk-w397p0p5.js` · offset 179201524 · sha256 `5765a66f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201524.

**Undocumented**

### `TMPDIR`

Source: `chunk-j7rgjcpa.js` · offset 185635209 · sha256 `3d1885bc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7rgjcpa.js` offset 185635209.

**Undocumented**

### `TMUX`

Source: `chunk-w397p0p5.js` · offset 179201119 · sha256 `173755d8…` · 30 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 24 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201119.

**Undocumented**

### `TMUX_PANE`

Source: `chunk-721k6cws.js` · offset 181878841 · sha256 `72526b2f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-721k6cws.js` offset 181878841.

**Undocumented**

### `USER`

Source: `chunk-edamysx7.js` · offset 181182843 · sha256 `877808d9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-edamysx7.js` offset 181182843.

**Undocumented**

### `USERNAME`

Source: `chunk-721k6cws.js` · offset 181867111 · sha256 `5a380695…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `ContainerAdministrator`, `ContainerUser`.

Undocumented; read at `chunk-721k6cws.js` offset 181867111.

**Undocumented**

### `USERPROFILE`

Source: `chunk-acxptg39.js` · offset 190252153 · sha256 `09f71f7e…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-acxptg39.js` offset 190252153.

**Undocumented**

### `UV_THREADPOOL_SIZE`

Source: `chunk-tgymbs42.js` · offset 214137084 · sha256 `6e9baec2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

Undocumented; read at `chunk-tgymbs42.js` offset 214137084.

**Undocumented**

### `VERCEL`

Source: `chunk-w397p0p5.js` · offset 179204201 · sha256 `6ae3215a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204201.

**Undocumented**

### `VISUAL`

Source: `chunk-2q0edvsh.js` · offset 217812617 · sha256 `797f4100…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2q0edvsh.js` offset 217812617.

**Undocumented**

### `VisualStudioVersion`

Source: `chunk-w397p0p5.js` · offset 179200747 · sha256 `c05a1490…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-w397p0p5.js` offset 179200747.

**Undocumented**

### `VSCODE_GIT_ASKPASS_MAIN`

Source: `chunk-w397p0p5.js` · offset 179200297 · sha256 `c0a2e4f9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179200297.

**Undocumented**

### `VTE_VERSION`

Source: `chunk-w397p0p5.js` · offset 179201337 · sha256 `28245ba2…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201337.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-v4er1c8e.js` · offset 186321022 · sha256 `71497285…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-v4er1c8e.js` offset 186321022.

**Undocumented**

### `WEBSITE_SITE_NAME`

Source: `chunk-w397p0p5.js` · offset 179204974 · sha256 `861142fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179204974.

**Undocumented**

### `WEBSITE_SKU`

Source: `chunk-w397p0p5.js` · offset 179205005 · sha256 `4e4acf04…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179205005.

**Undocumented**

### `WINDIR`

Source: `chunk-y1yh8mjf.js` · offset 197765754 · sha256 `9be0888a…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-y1yh8mjf.js` offset 197765754.

**Undocumented**

### `WSL_DISTRO_NAME`

Source: `chunk-w397p0p5.js` · offset 179201836 · sha256 `d98afa7f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201836.

**Undocumented**

### `WSL_INTEROP`

Source: `chunk-w3s0xmfk.js` · offset 179182875 · sha256 `69779847…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w3s0xmfk.js` offset 179182875.

**Undocumented**

### `WT_SESSION`

Source: `chunk-7m87m84t.js` · offset 196894683 · sha256 `dff34227…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7m87m84t.js` offset 196894683.

**Undocumented**

### `XDG_CACHE_HOME`

Source: `chunk-9c8h1t30.js` · offset 216119232 · sha256 `fc06c22e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216119232.

**Undocumented**

### `XDG_CONFIG_HOME`

Source: `chunk-9c8h1t30.js` · offset 216159909 · sha256 `7d8f5e18…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216159909.

**Undocumented**

### `XDG_DATA_HOME`

Source: `chunk-8p0q5f5t.js` · offset 200753281 · sha256 `b4814b29…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8p0q5f5t.js` offset 200753281.

**Undocumented**

### `XDG_RUNTIME_DIR`

Source: `chunk-9c8h1t30.js` · offset 216119003 · sha256 `d94ed14d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216119003.

**Undocumented**

### `XDG_STATE_HOME`

Source: `chunk-9c8h1t30.js` · offset 216119253 · sha256 `6042ebf5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9c8h1t30.js` offset 216119253.

**Undocumented**

### `XTERM_VERSION`

Source: `chunk-w397p0p5.js` · offset 179201294 · sha256 `1f33c166…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w397p0p5.js` offset 179201294.

**Undocumented**

### `ZED_TERM`

Source: `chunk-f4tdx2y5.js` · offset 192688248 · sha256 `059fcfab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f4tdx2y5.js` offset 192688248.

**Undocumented**

### `ZELLIJ`

Source: `chunk-avk2gknj.js` · offset 193116376 · sha256 `87944217…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-avk2gknj.js` offset 193116376.

**Undocumented**

## Set by Claude Code for tools, hooks, and child processes

These are variables Claude Code sets. It either writes them into its own process environment, which children that inherit it receive, or adds them to the environment it builds for a specific child. Receivers are listed only where the code identifies the child; values are shown only when the code sets a literal. The same name can also appear in a read group above.

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-n9nj0gvt.js` · offset 212102578 · sha256 `941c0b00…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-n9nj0gvt.js` · offset 212102551 · sha256 `d62c59d0…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AI_AGENT`

Source: `chunk-j7rgjcpa.js` · offset 185646655 · sha256 `2ec8f9fa…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `ALLOW_ANT_COMPUTER_USE_MCP`

Source: `chunk-w397p0p5.js` · offset 179235358 · sha256 `183204c2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-m8qgxh76.js` · offset 193390575 · sha256 `c4906342…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: API key sent as `X-Api-Key` header.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-m8qgxh76.js` · offset 193390535 · sha256 `62c1d0de…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-v1s2t7sq.js` · offset 204931941 · sha256 `c0bd2dc3…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-w397p0p5.js` · offset 179235392 · sha256 `f2acf977…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-721k6cws.js` · offset 181758779 · sha256 `afb015bf…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-721k6cws.js` · offset 181758697 · sha256 `47f2f248…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-721k6cws.js` · offset 181757923 · sha256 `8ab48aa2…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display description for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-721k6cws.js` · offset 181757873 · sha256 `9fabc0e1…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display name for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-721k6cws.js` · offset 181758614 · sha256 `c46b40fb…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-v1s2t7sq.js` · offset 204930988 · sha256 `e2478441…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-w397p0p5.js` · offset 179235420 · sha256 `11c36b3b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BROWSER`

Source: `chunk-88np9eym.js` · offset 207063665 · sha256 `a304f7a4…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `BUN_INSTALL_CACHE_DIR`

Source: `chunk-acxptg39.js` · offset 190570380 · sha256 `cca8c754…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `BUN_OPTIONS`

Source: `chunk-acxptg39.js` · offset 187755257 · sha256 `1af89f3d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CCR_AGENT_PROXY_CA_CERT_B64`

Source: `chunk-n9nj0gvt.js` · offset 212103052 · sha256 `af759b13…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-n9nj0gvt.js` · offset 212102914 · sha256 `46dce939…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-n9nj0gvt.js` · offset 212102955 · sha256 `43aec7c7…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-n9nj0gvt.js` · offset 212102876 · sha256 `e570d58a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-n9nj0gvt.js` · offset 212103004 · sha256 `66a00414…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-w397p0p5.js` · offset 179235450 · sha256 `07cce1a7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-w397p0p5.js` · offset 179235477 · sha256 `a82614be…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-w397p0p5.js` · offset 179235511 · sha256 `5be78e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179235542 · sha256 `a1ecd017…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-w397p0p5.js` · offset 179235571 · sha256 `d167b7ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-w397p0p5.js` · offset 179235632 · sha256 `e34dec72…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-w397p0p5.js` · offset 179235667 · sha256 `c5b53e4f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-w397p0p5.js` · offset 179235714 · sha256 `c3336b61…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-w397p0p5.js` · offset 179235760 · sha256 `aa26fa32…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-kmsvjk2z.js` · offset 202930927 · sha256 `f060c8d9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-g6yz7gnr.js` · offset 196589428 · sha256 `00378fe9…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-w397p0p5.js` · offset 179235830 · sha256 `d88f2a67…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179235864 · sha256 `471dbf29…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Stall timeout in milliseconds for subagents.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-w397p0p5.js` · offset 179235946 · sha256 `dcf029e6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-w397p0p5.js` · offset 179235907 · sha256 `0cd83f12…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-w397p0p5.js` · offset 179235982 · sha256 `b7e94f8a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-9c8h1t30.js` · offset 216176272 · sha256 `87bff846…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_AUTO_MEMORY_OFF`

Source: `chunk-w397p0p5.js` · offset 179236066 · sha256 `cf02f509…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-w397p0p5.js` · offset 179236099 · sha256 `b5aef623…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-7jz8j2fc.js` · offset 193455241 · sha256 `16c0cd82…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-w397p0p5.js` · offset 179236152 · sha256 `d9b7aec7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-w397p0p5.js` · offset 179236196 · sha256 `da913f4b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-w397p0p5.js` · offset 179236242 · sha256 `19101185…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-w397p0p5.js` · offset 179236269 · sha256 `79d92601…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-w397p0p5.js` · offset 179236305 · sha256 `d60067c6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-4ahd91a1.js` · offset 197477590 · sha256 `7d7017df…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-88np9eym.js` · offset 207067337 · sha256 `503dc6b9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-88np9eym.js` · offset 207067408 · sha256 `a04d6c36…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-w397p0p5.js` · offset 179236425 · sha256 `6d8dbfb6…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-4ahd91a1.js` · offset 197477799 · sha256 `083017bf…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-w397p0p5.js` · offset 179236503 · sha256 `8eb3b637…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-w397p0p5.js` · offset 179236527 · sha256 `b4aca2cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-4ahd91a1.js` · offset 197476755 · sha256 `22bfd5ab…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-w397p0p5.js` · offset 179236593 · sha256 `a7a96a03…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179236628 · sha256 `b711dcf4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_OAUTH_TOKEN`

Source: `chunk-w397p0p5.js` · offset 179236658 · sha256 `9f08d911…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-31av54vc.js` · offset 215740278 · sha256 `a9bd88e5…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-31av54vc.js` · offset 215740434 · sha256 `82ef3b77…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-31av54vc.js` · offset 215740222 · sha256 `7e737ccb…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-31av54vc.js` · offset 215740329 · sha256 `0fc6ce2a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-31av54vc.js` · offset 215740382 · sha256 `71e8aac8…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-31av54vc.js` · offset 215740176 · sha256 `f1248945…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-31av54vc.js` · offset 215740126 · sha256 `96f8d3f0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_SESSION_INGRESS_URL`

Source: `chunk-w397p0p5.js` · offset 179236969 · sha256 `845bfc42…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-w397p0p5.js` · offset 179237010 · sha256 `bc9b4383…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-w397p0p5.js` · offset 179237048 · sha256 `b6327059…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_TAB_GROUP_KEY`

Source: `chunk-p614p40d.js` · offset 179266831 · sha256 `e8684ede…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-w397p0p5.js` · offset 179237120 · sha256 `62cd9576…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_HAIKU_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181751899 · sha256 `2d39b985…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181751804 · sha256 `4cf5a5d3…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181751708 · sha256 `b02f4a80…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_OPUS_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752100 · sha256 `5189181f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_SONNET_DEFAULT`

Source: `chunk-721k6cws.js` · offset 181752009 · sha256 `7fae7197…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-w397p0p5.js` · offset 179237155 · sha256 `f01d7a16…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-w397p0p5.js` · offset 179237181 · sha256 `5a976b24…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-w397p0p5.js` · offset 179237233 · sha256 `96484fc1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-w397p0p5.js` · offset 179237274 · sha256 `bafdfbdd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-5g8p9x0b.js` · offset 196220087 · sha256 `7b925f03…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-4mmvdwwg.js` · offset 186801592 · sha256 `babb87d9…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-w02x2qbg.js` · offset 196881294 · sha256 `7afedd7f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_APPEND_PROMPT_HEAD`

Source: `chunk-5g8p9x0b.js` · offset 196181658 · sha256 `9f46488c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-w397p0p5.js` · offset 179237392 · sha256 `4bfc7248…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSET_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179237501 · sha256 `e035193d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-w397p0p5.js` · offset 179237544 · sha256 `de61fd76…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_LIVE_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179237582 · sha256 `2bc603a9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SYNC_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179237624 · sha256 `d20a56ec…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VIEWER_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179237666 · sha256 `16a98341…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179237420 · sha256 `a0ac3456…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-w397p0p5.js` · offset 179237462 · sha256 `4c77fd91…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_STATUS_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179237710 · sha256 `eb36c6c9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-w397p0p5.js` · offset 179237759 · sha256 `3a4a59bb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_EXTERNAL_PERMISSIONS`

Source: `chunk-w397p0p5.js` · offset 179237798 · sha256 `7c0978d9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-zndbphx7.js` · offset 193295692 · sha256 `d3bfcb14…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_TIER`

Source: `chunk-w397p0p5.js` · offset 179237848 · sha256 `075c5bf6…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-w397p0p5.js` · offset 179237882 · sha256 `b36742bb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-w397p0p5.js` · offset 179237910 · sha256 `4d403bbb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-w397p0p5.js` · offset 179237939 · sha256 `0ef2efde…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-582bmdee.js` · offset 215387783 · sha256 `bc8da8e6…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-w397p0p5.js` · offset 179238023 · sha256 `98b23e56…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-w397p0p5.js` · offset 179238068 · sha256 `45724059…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-acxptg39.js` · offset 187389601 · sha256 `6a80d30e…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-w397p0p5.js` · offset 179238155 · sha256 `fed0c24c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-w397p0p5.js` · offset 179238200 · sha256 `5b8816d9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-acxptg39.js` · offset 187389804 · sha256 `df1f185a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_SESSION_ID`

Source: `chunk-vxzk07xv.js` · offset 186390753 · sha256 `8549f3ec…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set automatically in Bash tool and hook command subprocesses while the session has an active Remote Control connection, and removed when the connection ends.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BRIDGE_SOURCE_DIR`

Source: `chunk-w397p0p5.js` · offset 179238318 · sha256 `290f3aa5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-w397p0p5.js` · offset 179238355 · sha256 `18dfc4dc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-w397p0p5.js` · offset 179238380 · sha256 `ea48c412…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-w397p0p5.js` · offset 179238412 · sha256 `190ab3b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-j7rgjcpa.js` · offset 185646529 · sha256 `5ca39f62…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`.

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-tgymbs42.js` · offset 214141104 · sha256 `f90629e3…` · 2 read sites

Set for: stdio MCP servers.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-w397p0p5.js` · offset 179238443 · sha256 `b0f3d903…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-5g8p9x0b.js` · offset 196246474 · sha256 `5553bf4b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONFIG_PROBE`

Source: `chunk-w397p0p5.js` · offset 179238481 · sha256 `835fa9d9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONFIG_WATCH_EVENTS`

Source: `chunk-m8qgxh76.js` · offset 193390655 · sha256 `e1ce0d4e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-w397p0p5.js` · offset 179238552 · sha256 `db65c0d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-n1w9epc0.js` · offset 186660733 · sha256 `deebb752…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-w397p0p5.js` · offset 179238584 · sha256 `af7e919f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-w397p0p5.js` · offset 179238630 · sha256 `f47a446e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-w397p0p5.js` · offset 179238667 · sha256 `8b476d18…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-w397p0p5.js` · offset 179238694 · sha256 `2e49e9e3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DEV_RAW_CHANGELOG_URL`

Source: `chunk-w397p0p5.js` · offset 179238733 · sha256 `272b8fc8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DISABLE_ATTRIBUTION_BASELINE_REUSE`

Source: `chunk-w397p0p5.js` · offset 179238774 · sha256 `43ef2f4d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-w397p0p5.js` · offset 179238828 · sha256 `d8123ca1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-5g8p9x0b.js` · offset 196218492 · sha256 `1d80e502…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-zndbphx7.js` · offset 193295799 · sha256 `547fd99f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-w397p0p5.js` · offset 179238878 · sha256 `db21a928…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-w397p0p5.js` · offset 179238921 · sha256 `b7213013…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS`

Source: `chunk-zndbphx7.js` · offset 193295889 · sha256 `815be972…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-w397p0p5.js` · offset 179238966 · sha256 `84c61046…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-w397p0p5.js` · offset 179239006 · sha256 `d595f244…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-w397p0p5.js` · offset 179239048 · sha256 `2970e7c0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-w397p0p5.js` · offset 179239088 · sha256 `423247f2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-w397p0p5.js` · offset 179239124 · sha256 `b713be3d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-w397p0p5.js` · offset 179239176 · sha256 `dc8a1eb0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-w397p0p5.js` · offset 179239221 · sha256 `4b708589…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-w397p0p5.js` · offset 179239260 · sha256 `37f0e318…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-5g8p9x0b.js` · offset 196166147 · sha256 `b9040413…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-p614p40d.js` · offset 179266957 · sha256 `446a0dfc…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `local-agent`; `sdk-cli`; `mcp`; `claude-code-github-action`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-w397p0p5.js` · offset 179239333 · sha256 `f491edc4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-w397p0p5.js` · offset 179239369 · sha256 `0f661788…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-w397p0p5.js` · offset 179239415 · sha256 `9415de4d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-9c8h1t30.js` · offset 216292492 · sha256 `02ae815b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXECPATH`

Source: `chunk-acxptg39.js` · offset 187755185 · sha256 `a4da5322…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-w397p0p5.js` · offset 179239448 · sha256 `42599a08…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-w397p0p5.js` · offset 179239491 · sha256 `d5387d15…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-zndbphx7.js` · offset 193295592 · sha256 `f495f99b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: JSON object to merge into the top level of every API request body.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-w397p0p5.js` · offset 179239532 · sha256 `67f3b82e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-w397p0p5.js` · offset 179239570 · sha256 `670e0d3b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_BRIDGE`

Source: `chunk-w397p0p5.js` · offset 179239606 · sha256 `9441fab1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_EVALUATE_MEMORY`

Source: `chunk-w397p0p5.js` · offset 179239638 · sha256 `f12cf632…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-w397p0p5.js` · offset 179239679 · sha256 `b3760376…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_MEMORY_SURVEY`

Source: `chunk-w397p0p5.js` · offset 179239722 · sha256 `d80fbbfc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_TIP_ID`

Source: `chunk-w397p0p5.js` · offset 179239761 · sha256 `46aca4bf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-kx3hbyfc.js` · offset 181285329 · sha256 `3b31760f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-w397p0p5.js` · offset 179239793 · sha256 `5dce8e92…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-w397p0p5.js` · offset 179239826 · sha256 `a3961d40…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in seconds for Glob tool file discovery.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-w397p0p5.js` · offset 179239866 · sha256 `52f839eb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-w397p0p5.js` · offset 179239906 · sha256 `d624f14f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-w397p0p5.js` · offset 179239944 · sha256 `0e450bda…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179239988 · sha256 `91a2b78b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179240033 · sha256 `67d2ae3c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-k0apyej9.js` · offset 197557403 · sha256 `38d892b2…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-zndbphx7.js` · offset 193295503 · sha256 `00e86f7e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-w397p0p5.js` · offset 179240081 · sha256 `83f3d35c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PROMPT_SUPERSEDES_RECORD`

Source: `chunk-w397p0p5.js` · offset 179240114 · sha256 `2a0aa73f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-w397p0p5.js` · offset 179240163 · sha256 `2309448a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_WORKTREE`

Source: `chunk-w397p0p5.js` · offset 179240198 · sha256 `80534c96…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_WORKTREE_FENCE`

Source: `chunk-w397p0p5.js` · offset 179240231 · sha256 `f900563b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-w397p0p5.js` · offset 179240270 · sha256 `bae1cafb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the host address used to connect to the IDE extension.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-w397p0p5.js` · offset 179240307 · sha256 `1661ebd6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-w397p0p5.js` · offset 179240349 · sha256 `980172a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_INVOKED_SKILLS`

Source: `chunk-acxptg39.js` · offset 187755324 · sha256 `de042d2a…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-w397p0p5.js` · offset 179240389 · sha256 `c0bdcd2b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-w397p0p5.js` · offset 179240418 · sha256 `5f161bac…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-w397p0p5.js` · offset 179240451 · sha256 `6fca0da0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-w397p0p5.js` · offset 179240485 · sha256 `18f76a41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MANAGED_SETTINGS_PATH`

Source: `chunk-w397p0p5.js` · offset 179240520 · sha256 `c69479a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_NAME`

Source: `chunk-hjjz8p0n.js` · offset 184915962 · sha256 `8df357a4…`

Set for: marketplace headersHelper command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_URL`

Source: `chunk-hjjz8p0n.js` · offset 184915916 · sha256 `b176eb5e…`

Set for: marketplace headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-w397p0p5.js` · offset 179240561 · sha256 `ffa8c0ff…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-w397p0p5.js` · offset 179240605 · sha256 `f7abe66d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-w397p0p5.js` · offset 179240651 · sha256 `d6daa685…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-w397p0p5.js` · offset 179240695 · sha256 `040c7800…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-w397p0p5.js` · offset 179240743 · sha256 `e27e75f5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-w397p0p5.js` · offset 179240780 · sha256 `bc10f890…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-w397p0p5.js` · offset 179240813 · sha256 `d6a03aa6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-w397p0p5.js` · offset 179240855 · sha256 `b62d8265…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-w397p0p5.js` · offset 179240899 · sha256 `2b6a5599…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS`

Source: `chunk-w397p0p5.js` · offset 179240936 · sha256 `08f10de6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS_MS`

Source: `chunk-w397p0p5.js` · offset 179240975 · sha256 `68bb0eb9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_SERVER_NAME`

Source: `chunk-71hm04bz.js` · offset 214002697 · sha256 `0a578ed5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_SERVER_URL`

Source: `chunk-71hm04bz.js` · offset 214002727 · sha256 `024bb5f5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-w397p0p5.js` · offset 179241017 · sha256 `d215ab17…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-w397p0p5.js` · offset 179241056 · sha256 `7c45648f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Idle timeout in milliseconds for MCP tool calls.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-w397p0p5.js` · offset 179241097 · sha256 `c8e714c1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-q308nzmf.js` · offset 212380236 · sha256 `ec872ff9…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MESSAGING_TOKEN`

Source: `chunk-q308nzmf.js` · offset 212380277 · sha256 `6ac46f5c…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports this per-session token to hooks and Bash commands alongside `CLAUDE_CODE_MESSAGING_SOCKET`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MOCK_REMOTE_SETTINGS`

Source: `chunk-w397p0p5.js` · offset 179241139 · sha256 `42f7aff8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MOCK_TRIAL`

Source: `chunk-w397p0p5.js` · offset 179241179 · sha256 `7dc2d00a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-721k6cws.js` · offset 182083531 · sha256 `888dadab…` · 7 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: OAuth access token for claude.ai authentication.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OVERRIDE_DATE`

Source: `chunk-w397p0p5.js` · offset 179241209 · sha256 `45328ae7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-w397p0p5.js` · offset 179241242 · sha256 `e2d898d8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-w397p0p5.js` · offset 179241287 · sha256 `61bf42ec…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-w397p0p5.js` · offset 179241330 · sha256 `51bce392…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-w397p0p5.js` · offset 179241369 · sha256 `f699025a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to enable Perforce-aware write protection.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-w397p0p5.js` · offset 179241402 · sha256 `05e574c5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-w397p0p5.js` · offset 179241441 · sha256 `42e8d906…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ARCHIVE_URL`

Source: `chunk-hjjz8p0n.js` · offset 184916590 · sha256 `c4405f96…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-w397p0p5.js` · offset 179241488 · sha256 `8995af34…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-w397p0p5.js` · offset 179241526 · sha256 `77f72bda…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the plugins root directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-cqbt8tx8.js` · offset 193364524 · sha256 `e866bde0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value (set only under a condition).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179241562 · sha256 `4409da08…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_NAME`

Source: `chunk-hjjz8p0n.js` · offset 184916553 · sha256 `60d6a445…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-w397p0p5.js` · offset 179241603 · sha256 `88aa0e98…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-w397p0p5.js` · offset 179241638 · sha256 `b7279ec8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-w397p0p5.js` · offset 179241674 · sha256 `5d899bad…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-w397p0p5.js` · offset 179241717 · sha256 `8581f61a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-w397p0p5.js` · offset 179241758 · sha256 `bac42c23…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-w397p0p5.js` · offset 179241796 · sha256 `bd8c9c98…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROXY_AUTHENTICATE`

Source: `chunk-g5brps3g.js` · offset 180162574 · sha256 `1dac61b0…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_HOST`

Source: `chunk-g5brps3g.js` · offset 180162541 · sha256 `2607374e…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_URL`

Source: `chunk-g5brps3g.js` · offset 180162509 · sha256 `bf82ec43…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179241832 · sha256 `3c821fe5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-w397p0p5.js` · offset 179241873 · sha256 `de6f1690…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-w397p0p5.js` · offset 179241910 · sha256 `8401afc5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-w397p0p5.js` · offset 179241960 · sha256 `10d391a2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-kx3hbyfc.js` · offset 181283029 · sha256 `cce5dc89…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_HOME_TRUST`

Source: `chunk-w397p0p5.js` · offset 179242003 · sha256 `1ef588b8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-84wh0q6p.js` · offset 193225181 · sha256 `f73f513a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-w397p0p5.js` · offset 179242084 · sha256 `ac14008f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-w397p0p5.js` · offset 179242110 · sha256 `2ea79214…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-w397p0p5.js` · offset 179242153 · sha256 `f19302f1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-w397p0p5.js` · offset 179242193 · sha256 `1177631f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_RAW_EVENTS_FILE`

Source: `chunk-w397p0p5.js` · offset 179242230 · sha256 `046df032…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-w397p0p5.js` · offset 179242272 · sha256 `4a62b663…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-w397p0p5.js` · offset 179242314 · sha256 `3d79de64…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically in cloud sessions to the current session's ID.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-w397p0p5.js` · offset 179242351 · sha256 `bf966f80…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_PATH`

Source: `chunk-w397p0p5.js` · offset 179242392 · sha256 `0bd0b204…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_POLL_MS`

Source: `chunk-w397p0p5.js` · offset 179242432 · sha256 `1ef24bfa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPL`

Source: `chunk-w397p0p5.js` · offset 179242475 · sha256 `be72d457…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-w397p0p5.js` · offset 179242499 · sha256 `3f65bc41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-mcm8e5ww.js` · offset 208115856 · sha256 `b52ac6d1…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value (set only under a condition).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESULT_NONCE`

Source: `chunk-gwc1wn1e.js` · offset 206976369 · sha256 `b1fbd25a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-w397p0p5.js` · offset 179242595 · sha256 `cd5df840…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-w397p0p5.js` · offset 179242634 · sha256 `b919789d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-w397p0p5.js` · offset 179242677 · sha256 `ee118203…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-w397p0p5.js` · offset 179242731 · sha256 `63f3e2e0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-w397p0p5.js` · offset 179242764 · sha256 `e8f064ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-w397p0p5.js` · offset 179242797 · sha256 `e7fe71f5…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-w397p0p5.js` · offset 179242836 · sha256 `0f722e00…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-w397p0p5.js` · offset 179242880 · sha256 `0b0c224b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-w397p0p5.js` · offset 179242922 · sha256 `b09a66b0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-5g8p9x0b.js` · offset 196218454 · sha256 `e2d01209…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-w397p0p5.js` · offset 179243003 · sha256 `a476a37d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-w397p0p5.js` · offset 179243032 · sha256 `e913df18…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-5645472e.js` · offset 217470118 · sha256 `6af06b37…` · 5 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_READS_SESSION_STATE`

Source: `chunk-w397p0p5.js` · offset 179243095 · sha256 `d3620a56…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-1k1qsm5t.js` · offset 191562639 · sha256 `f1c9d9f3…` · 8 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value (set only under a condition).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-j7rgjcpa.js` · offset 185646559 · sha256 `6e023ea6…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1` or `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-15akp9yh.js` · offset 200665840 · sha256 `7ac7c553…` · 5 read sites

Set for: stdio MCP servers; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-w397p0p5.js` · offset 179243215 · sha256 `40e08781…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-w397p0p5.js` · offset 179243247 · sha256 `44ad7f8c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-w397p0p5.js` · offset 179243279 · sha256 `916772f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-w397p0p5.js` · offset 179243313 · sha256 `c9f2b1d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179243138 · sha256 `c8998f5e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-w397p0p5.js` · offset 179243374 · sha256 `10bbb4d3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the shell Claude Code uses to run Bash tool commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-w397p0p5.js` · offset 179243399 · sha256 `a302a6aa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-5g8p9x0b.js` · offset 196218411 · sha256 `1cc8c889…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-w397p0p5.js` · offset 179243457 · sha256 `a1e4d385…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-w397p0p5.js` · offset 179243497 · sha256 `d8372b06…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-w397p0p5.js` · offset 179243534 · sha256 `efbf9463…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-w397p0p5.js` · offset 179243572 · sha256 `5b7e2889…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-w397p0p5.js` · offset 179243600 · sha256 `ee8d9785…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-w397p0p5.js` · offset 179243648 · sha256 `80659920…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-w397p0p5.js` · offset 179243691 · sha256 `fd51c474…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-hyr3xk9c.js` · offset 194322495 · sha256 `b0db2d18…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-kx3hbyfc.js` · offset 181282949 · sha256 `2815a03c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-w397p0p5.js` · offset 179243770 · sha256 `c7721a92…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179243998 · sha256 `48774226…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for synchronous plugin installation.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-w397p0p5.js` · offset 179243800 · sha256 `32a6f874…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-w397p0p5.js` · offset 179243850 · sha256 `2ca0b3f3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179243900 · sha256 `244605a7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179243951 · sha256 `10164472…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-w397p0p5.js` · offset 179244048 · sha256 `182d97f1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-w397p0p5.js` · offset 179244088 · sha256 `ba3bbb96…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179244125 · sha256 `7bdca28f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179244175 · sha256 `efe73432…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-w397p0p5.js` · offset 179244222 · sha256 `fddeacc7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `false` to disable syntax highlighting in diff output.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-w397p0p5.js` · offset 179244258 · sha256 `5e30475f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-w397p0p5.js` · offset 179244302 · sha256 `fccab4cc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-w397p0p5.js` · offset 179244326 · sha256 `e8cc1e42…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Share a task list across sessions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179244358 · sha256 `96e4c043…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-w397p0p5.js` · offset 179244407 · sha256 `f83d8d1d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-w397p0p5.js` · offset 179244445 · sha256 `297d1de1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-w397p0p5.js` · offset 179244488 · sha256 `de6def10…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FORCE_DENY`

Source: `chunk-w397p0p5.js` · offset 179244526 · sha256 `92bc7dc3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_GIT_BASH`

Source: `chunk-w397p0p5.js` · offset 179244561 · sha256 `727a2a28…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_PWSH`

Source: `chunk-w397p0p5.js` · offset 179244597 · sha256 `4eb53d1b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-w397p0p5.js` · offset 179244629 · sha256 `c52586e8…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Override the temp directory used for internal temp files.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-w397p0p5.js` · offset 179244655 · sha256 `f077bf88…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-w397p0p5.js` · offset 179244686 · sha256 `ebb9797e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-w397p0p5.js` · offset 179244727 · sha256 `4ab4f1ce…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-w397p0p5.js` · offset 179244759 · sha256 `e641c2f2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-w397p0p5.js` · offset 179244793 · sha256 `a17e223c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-w397p0p5.js` · offset 179244839 · sha256 `4d26c508…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-w397p0p5.js` · offset 179244876 · sha256 `15b41de2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-mcm8e5ww.js` · offset 208086192 · sha256 `48b906bb…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-w397p0p5.js` · offset 179244943 · sha256 `f64c964a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-w397p0p5.js` · offset 179244972 · sha256 `97fe3060…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-w397p0p5.js` · offset 179245021 · sha256 `0ae362e5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179245066 · sha256 `04c56e0e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_VERSION`

Source: `chunk-gqegtvbg.js` · offset 181126813 · sha256 `195a905a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-w397p0p5.js` · offset 179245108 · sha256 `6f761192…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-w397p0p5.js` · offset 179245156 · sha256 `7c4f29b4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-w397p0p5.js` · offset 179245199 · sha256 `c43d37e2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-w397p0p5.js` · offset 179245231 · sha256 `5c9f0d3f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-w397p0p5.js` · offset 179245271 · sha256 `a8ac9caa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the configuration directory (default: `~/.claude`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-w397p0p5.js` · offset 179245296 · sha256 `ddeaf9d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-w397p0p5.js` · offset 179245341 · sha256 `8d8d2863…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-w397p0p5.js` · offset 179245380 · sha256 `a60b38d7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-w397p0p5.js` · offset 179245422 · sha256 `43dec00d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_EFFORT`

Source: `chunk-j7rgjcpa.js` · offset 185646705 · sha256 `79c852b9…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

From docs: Set automatically in Bash tool subprocesses and hook commands to the effort level in effect when the subprocess starts: `low`, `medium`, `high`, `xhigh`, or `max`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-acxptg39.js` · offset 189172257 · sha256 `c3e129af…` · 2 read sites

Set for: hook commands.

Value: a runtime value (set only under a condition). Condition values in code: `SessionStart`, `Setup`, `CwdChanged`, `FileChanged`.

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-w397p0p5.js` · offset 179245487 · sha256 `ab77a0a7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-cyzbzgkb.js` · offset 212289921 · sha256 `23a7a3fc…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-w397p0p5.js` · offset 179245565 · sha256 `485fba0e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-w397p0p5.js` · offset 179245601 · sha256 `63edea9d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_MEMORY_STORES`

Source: `chunk-w397p0p5.js` · offset 179245623 · sha256 `a83def39…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PID`

Source: `chunk-j7rgjcpa.js` · offset 185646601 · sha256 `51f03cbe…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: Claude Code's process ID.

From docs: Claude Code sets this to its own process ID in the subprocesses it spawns: Bash and PowerShell tool commands and hook commands.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_PLUGIN_DATA`

Source: `chunk-acxptg39.js` · offset 187154781 · sha256 `c46603e0…` · 3 read sites

Set for: plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_OPTION_*`

Source: `chunk-acxptg39.js` · offset 189172087 · sha256 `cb6825f2…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_ROOT`

Source: `chunk-71hm04bz.js` · offset 214002767 · sha256 `8c52d608…` · 5 read sites

Set for: MCP server headersHelper command; plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_PROJECT_DIR`

Source: `chunk-acxptg39.js` · offset 187154814 · sha256 `6d2b2862…` · 6 read sites

Set for: hook commands; stdio MCP servers.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-w397p0p5.js` · offset 179245651 · sha256 `50376201…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-w397p0p5.js` · offset 179245678 · sha256 `96710fb7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-4ahd91a1.js` · offset 197477513 · sha256 `b735c221…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-w397p0p5.js` · offset 179245737 · sha256 `27514052…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-5g8p9x0b.js` · offset 196163284 · sha256 `71c63b4c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-5g8p9x0b.js` · offset 196224015 · sha256 `14bd408c…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-w397p0p5.js` · offset 179245860 · sha256 `67d0baca…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-w397p0p5.js` · offset 179245895 · sha256 `8f230f31…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ACCOUNT_EMAIL`

Source: `chunk-ajk93az7.js` · offset 191914389 · sha256 `7d21deed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Email of the account that enqueued the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACCOUNT_ID`

Source: `chunk-ajk93az7.js` · offset 191914440 · sha256 `8c6c4c78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Tagged ID of the account that enqueued the session, for per-account routing, quota, or chargeback.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-w397p0p5.js` · offset 179245932 · sha256 `ae27a1b1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ATTEMPT`

Source: `chunk-ajk93az7.js` · offset 191914303 · sha256 `918c8041…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many spawn requests this session has had.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CLIENT_PLATFORM`

Source: `chunk-ajk93az7.js` · offset 191914801 · sha256 `25dd9f8d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The client surface that created the session, such as `web_claude_ai`, `desktop_app`, `ios`, `claude_code_cli`, or `scheduled_trigger`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CORRELATION_ID`

Source: `chunk-ajk93az7.js` · offset 191914748 · sha256 `428b1c25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The correlation ID supplied at session create, echoed back so the hook can map this work order to the request that created the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-w397p0p5.js` · offset 179245965 · sha256 `0b8f6441…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Git fetch depth for fresh clones.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_ORDER_ID`

Source: `chunk-ajk93az7.js` · offset 191914139 · sha256 `f9fe867a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Opaque idempotency key, unique per spawn request and safe for Kubernetes resource names.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ORDER_SERVER_TIME`

Source: `chunk-ajk93az7.js` · offset 191914485 · sha256 `d03989a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Server time from the poll response's HTTP `Date` header.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_POOL_ID`

Source: `chunk-ajk93az7.js` · offset 191914350 · sha256 `da2ebaa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The ID of the environment the new runner should join, in `ccpool_...` form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_REVISION`

Source: `chunk-ajk93az7.js` · offset 191914595 · sha256 `292d83d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Revision of the session's first git source: branch, SHA, or tag.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_URL`

Source: `chunk-ajk93az7.js` · offset 191914538 · sha256 `3be603cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: URL of the session's first git source, for routing to a runner with that repository pre-warmed.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_REPO_SOURCES`

Source: `chunk-ajk93az7.js` · offset 191914662 · sha256 `e2622d49…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON array of `{url, revision}` for all the session's git sources, for hooks that route on a secondary repository.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-ajk93az7.js` · offset 191914175 · sha256 `7c502b5b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_UUID`

Source: `chunk-ajk93az7.js` · offset 191914256 · sha256 `2c8246b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The same session ID in canonical UUID form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_WORK_ORDER_FILE`

Source: `chunk-ajk93az7.js` · offset 191914107 · sha256 `48f0b1f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a temp file containing the signed work-order JWT the new runner registers with.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-w397p0p5.js` · offset 179245998 · sha256 `02ba75d2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_SERVE_DRAIN_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179246037 · sha256 `f735ec28…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SNIP`

Source: `chunk-w397p0p5.js` · offset 179246074 · sha256 `a5c38447…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_LOCAL_BINARY`

Source: `chunk-w397p0p5.js` · offset 179246093 · sha256 `68b80592…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_VERSION`

Source: `chunk-w397p0p5.js` · offset 179246124 · sha256 `525d642e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-w397p0p5.js` · offset 179246150 · sha256 `eb50dcdd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_TEST_PROJECT_DIR`

Source: `chunk-090qn1cb.js` · offset 212416431 · sha256 `38ee8375…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `${CLAUDE_PROJECT_DIR}`.

No read site found by this scan.

**Undocumented**

### `CLAUDE_TMPDIR`

Source: `chunk-acxptg39.js` · offset 187789049 · sha256 `02783bc4…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-acxptg39.js` · offset 187766914 · sha256 `8eeb7c77…` · 6 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; stdio MCP servers; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`; a runtime value.

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `COLUMNS`

Source: `chunk-acxptg39.js` · offset 189171845 · sha256 `a61a3639…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `DEBUG`

Source: `chunk-dvyksg7w.js` · offset 179923185 · sha256 `0c351e1e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-g6yz7gnr.js` · offset 196505397 · sha256 `f6740586…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to disable automatic background updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISPLAY`

Source: `chunk-acxptg39.js` · offset 190256359 · sha256 `7e8467cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GCM_INTERACTIVE`

Source: `chunk-1k1qsm5t.js` · offset 191562747 · sha256 `e8bb08ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151817 · sha256 `0eb60ad6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151789 · sha256 `db7e4b41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ALLOW_PROTOCOL`

Source: `chunk-1k1qsm5t.js` · offset 191562860 · sha256 `3845844c…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `none`; `https:http:ssh` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-h4njzy9v.js` · offset 184850199 · sha256 `0d6255b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_AUTHOR_DATE`

Source: `chunk-acxptg39.js` · offset 190922903 · sha256 `0913b870…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_EMAIL`

Source: `chunk-acxptg39.js` · offset 190922859 · sha256 `a0a27899…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff@localhost`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_NAME`

Source: `chunk-acxptg39.js` · offset 190922826 · sha256 `6536e127…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff`.

No read site found by this scan.

**Undocumented**

### `GIT_CEILING_DIRECTORIES`

Source: `chunk-grwmq3qs.js` · offset 180936699 · sha256 `7c90bcd3…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_DATE`

Source: `chunk-acxptg39.js` · offset 190923021 · sha256 `3b626dd6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_EMAIL`

Source: `chunk-acxptg39.js` · offset 190922974 · sha256 `1588ebba…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff@localhost`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_NAME`

Source: `chunk-acxptg39.js` · offset 190922938 · sha256 `bebb3b59…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff`.

No read site found by this scan.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-1k1qsm5t.js` · offset 191562685 · sha256 `ef00c0bc…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-9c8h1t30.js` · offset 216263847 · sha256 `c41b4f9a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-acxptg39.js` · offset 187755284 · sha256 `5bc3d02d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-k2pjtcda.js` · offset 191653472 · sha256 `c6cdecc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_EDITOR`

Source: `chunk-acxptg39.js` · offset 187766896 · sha256 `d8fae42f…` · 3 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `true`.

No read site found by this scan.

**Undocumented**

### `GIT_INDEX_FILE`

Source: `chunk-5857ntzn.js` · offset 215428798 · sha256 `1e336980…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_NO_LAZY_FETCH`

Source: `chunk-acxptg39.js` · offset 190029541 · sha256 `51d9fbb1…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_OBJECT_DIRECTORY`

Source: `chunk-5857ntzn.js` · offset 215428762 · sha256 `f4c79723…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_OPTIONAL_LOCKS`

Source: `chunk-acxptg39.js` · offset 190919252 · sha256 `671e967a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_PROGRESS_DELAY`

Source: `chunk-1k1qsm5t.js` · offset 191562793 · sha256 `f07c9246…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-grwmq3qs.js` · offset 180931656 · sha256 `bc2d54c4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-1k1qsm5t.js` · offset 191562913 · sha256 `642ec4ba…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `false` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SSH_VARIANT`

Source: `chunk-h4njzy9v.js` · offset 184850164 · sha256 `0aa40a3b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-1k1qsm5t.js` · offset 191562723 · sha256 `ebaa1d2e…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151840 · sha256 `4dd424ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186151801 · sha256 `588127ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITLAB_ACCESS_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186164228 · sha256 `ed5747c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `GITLAB_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186164208 · sha256 `fa287e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `HOME`

Source: `chunk-9c8h1t30.js` · offset 216263761 · sha256 `6926099c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `HOMEBREW_NO_AUTO_UPDATE`

Source: `chunk-nfqe1amr.js` · offset 197169739 · sha256 `7a329310…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LANGUAGE`

Source: `chunk-kc4k2aby.js` · offset 212521069 · sha256 `c56805bc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LC_ALL`

Source: `chunk-1k1qsm5t.js` · offset 191562782 · sha256 `d93853ac…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `C`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `LINES`

Source: `chunk-acxptg39.js` · offset 189171873 · sha256 `a49d5596…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-w397p0p5.js` · offset 179246201 · sha256 `0849f931…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-w397p0p5.js` · offset 179246255 · sha256 `c4dc4677…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-w397p0p5.js` · offset 179246221 · sha256 `ad376bde…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-w397p0p5.js` · offset 179246285 · sha256 `7f45eaa2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Turns the MCP discovery cache on or off.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-w397p0p5.js` · offset 179246312 · sha256 `21770aa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-w397p0p5.js` · offset 179246351 · sha256 `0bb907ad…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-w397p0p5.js` · offset 179246386 · sha256 `11a3ce85…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-w397p0p5.js` · offset 179246419 · sha256 `1e45bb4c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-w397p0p5.js` · offset 179246450 · sha256 `7129bd85…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-w397p0p5.js` · offset 179246487 · sha256 `cef911f1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-w397p0p5.js` · offset 179246519 · sha256 `dd56b377…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-w397p0p5.js` · offset 179246566 · sha256 `426d198f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-w397p0p5.js` · offset 179246592 · sha256 `f0d4eeac…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-w397p0p5.js` · offset 179246632 · sha256 `b8c33a56…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-w397p0p5.js` · offset 179246651 · sha256 `b6c12141…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-w397p0p5.js` · offset 179246675 · sha256 `a527a5ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NODE_ENV`

Source: `chunk-9c8h1t30.js` · offset 216059889 · sha256 `6541f2a8…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `production`.

No read site found by this scan.

**Undocumented**

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-h693t8dj.js` · offset 193367468 · sha256 `92a4b4bf…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NoDefaultCurrentDirectoryInExePath`

Source: `chunk-g6yz7gnr.js` · offset 196557754 · sha256 `91bf70a2…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

No read site found by this scan.

**Undocumented**

### `OAUTH_TOKEN`

Source: `chunk-j7rgjcpa.js` · offset 186164255 · sha256 `4c09c85b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-b42f9ayq.js` · offset 212253699 · sha256 `c023412c…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `delta`.

From docs: Metrics temporality preference (default: `delta`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `PATH`

Source: `chunk-9c8h1t30.js` · offset 216059836 · sha256 `5ed8d9f7…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/usr/bin:/bin`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `PS1`

Source: `chunk-sj771y2q.js` · offset 199291830 · sha256 `c1e1ae25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `PS2`

Source: `chunk-sj771y2q.js` · offset 199291837 · sha256 `462b4728…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-w397p0p5.js` · offset 179246713 · sha256 `040c2e2d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-k2pjtcda.js` · offset 191794182 · sha256 `1f9b70ec…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191793221 · sha256 `4e65393b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-k2pjtcda.js` · offset 191792967 · sha256 `f0f77ff9…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-k2pjtcda.js` · offset 191792677 · sha256 `25b6ed37…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-ajk93az7.js` · offset 191914062 · sha256 `a4acc82d…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-k2pjtcda.js` · offset 191788230 · sha256 `0ca0b831…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-k2pjtcda.js` · offset 191769699 · sha256 `334958a4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-k2pjtcda.js` · offset 191791344 · sha256 `1ad3dbaf…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-k2pjtcda.js` · offset 191791016 · sha256 `435d0926…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-ajk93az7.js` · offset 191914024 · sha256 `68243b99…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-k2pjtcda.js` · offset 191792182 · sha256 `0aa1c514…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-qyn5bdge.js` · offset 191486860 · sha256 `2bd21780…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-qyn5bdge.js` · offset 191486914 · sha256 `ef192279…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-k2pjtcda.js` · offset 191794608 · sha256 `d857648e…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-k2pjtcda.js` · offset 191793500 · sha256 `7d40ac61…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-k2pjtcda.js` · offset 191791656 · sha256 `65c34884…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-k2pjtcda.js` · offset 191793830 · sha256 `ee45ce70…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-w397p0p5.js` · offset 179246735 · sha256 `281172de…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SHELL`

Source: `chunk-acxptg39.js` · offset 187766888 · sha256 `51127eb3…` · 4 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-w397p0p5.js` · offset 179246762 · sha256 `6a48f5fb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `SSH_ASKPASS`

Source: `chunk-h4njzy9v.js` · offset 184850250 · sha256 `33cfec4d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-w397p0p5.js` · offset 179246800 · sha256 `42e42619…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TEMP`

Source: `chunk-9c8h1t30.js` · offset 216263821 · sha256 `abe2607f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TERM`

Source: `chunk-4ahd91a1.js` · offset 197478399 · sha256 `ab8da757…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `xterm-256color`; `dumb`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-w397p0p5.js` · offset 179246838 · sha256 `8938dce8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMP`

Source: `chunk-9c8h1t30.js` · offset 216263808 · sha256 `7e51b28f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TMPDIR`

Source: `chunk-9c8h1t30.js` · offset 216263792 · sha256 `904359e8…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMPPREFIX`

Source: `chunk-acxptg39.js` · offset 187755245 · sha256 `47a8d8f7…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `TMUX`

Source: `chunk-acxptg39.js` · offset 187755208 · sha256 `db982b13…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TRACEPARENT`

Source: `chunk-j7rgjcpa.js` · offset 185646771 · sha256 `aab96fde…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ULTRAPLAN_PROMPT_FILE`

Source: `chunk-w397p0p5.js` · offset 179246877 · sha256 `96f8192a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `USER_TYPE`

Source: `chunk-9c8h1t30.js` · offset 216059868 · sha256 `63ec52da…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `external`.

No read site found by this scan.

**Undocumented**

### `USERPROFILE`

Source: `chunk-9c8h1t30.js` · offset 216263773 · sha256 `3a88058a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VCR_RECORD`

Source: `chunk-w397p0p5.js` · offset 179246906 · sha256 `0a42d6e6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-w397p0p5.js` · offset 179246924 · sha256 `af1b4b79…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-w397p0p5.js` · offset 179246950 · sha256 `594bdcd0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-acxptg39.js` · offset 190256370 · sha256 `bbd32953…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

## Read only by bundled third-party libraries

These names are read only by code with no Claude Code evidence: no typed-schema entry, no first-party boolean helper, no Claude Code name prefix, and no docs entry. That is most likely bundled third-party library code. They are listed for completeness.

### `_X_AMZN_TRACE_ID`

Source: `chunk-p8hvn3xb.js` · offset 198329856 · sha256 `17f869aa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-p8hvn3xb.js` offset 198329856.

**Undocumented**

### `AWS_ACCOUNT_ID`

Source: `chunk-rw98dxms.js` · offset 198192897 · sha256 `757201c8…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-rw98dxms.js` offset 198192897.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN`

Source: `chunk-bj4yez1w.js` · offset 213317942 · sha256 `4144f535…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-bj4yez1w.js` offset 213317942.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`

Source: `chunk-bj4yez1w.js` · offset 213317997 · sha256 `858c3edf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-bj4yez1w.js` offset 213317997.

**Undocumented**

### `AWS_CREDENTIAL_EXPIRATION`

Source: `chunk-rw98dxms.js` · offset 198192863 · sha256 `ec172743…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-rw98dxms.js` offset 198192863.

**Undocumented**

### `AWS_CREDENTIAL_SCOPE`

Source: `chunk-rw98dxms.js` · offset 198192880 · sha256 `471e850e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-rw98dxms.js` offset 198192880.

**Undocumented**

### `AWS_EC2_METADATA_DISABLED`

Source: `chunk-p8hvn3xb.js` · offset 198464438 · sha256 `1c8da441…` · 3 read sites

Read as: enum (compared against fixed values). Values: `false`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-p8hvn3xb.js` offset 198464438.

**Undocumented**

### `AWS_LAMBDA_BENCHMARK_MODE`

Source: `chunk-p8hvn3xb.js` · offset 198329181 · sha256 `11d880c2…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-p8hvn3xb.js` offset 198329181.

**Undocumented**

### `AWS_LAMBDA_MAX_CONCURRENCY`

Source: `chunk-p8hvn3xb.js` · offset 198328894 · sha256 `441ec1d5…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-p8hvn3xb.js` offset 198328894.

**Undocumented**

### `AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA`

Source: `chunk-p8hvn3xb.js` · offset 198327559 · sha256 `55d05854…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-p8hvn3xb.js` offset 198327559.

**Undocumented**

### `AWS_LOGIN_CACHE_DIRECTORY`

Source: `chunk-jtnzqfvn.js` · offset 198204797 · sha256 `304b902c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-jtnzqfvn.js` offset 198204797.

**Undocumented**

### `AWS_ROLE_SESSION_NAME`

Source: `chunk-dws5mazw.js` · offset 213305544 · sha256 `df2e4a0a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dws5mazw.js` offset 213305544.

**Undocumented**

### `AZURE_ADDITIONALLY_ALLOWED_TENANTS`

Source: `chunk-4v4n4srf.js` · offset 199243183 · sha256 `ed848eaa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199243183.

**Undocumented**

### `AZURE_AUTHORITY_HOST`

Source: `chunk-4v4n4srf.js` · offset 198999926 · sha256 `104f8a52…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 198999926.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PASSWORD`

Source: `chunk-4v4n4srf.js` · offset 199244156 · sha256 `72a5ed2a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199244156.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PATH`

Source: `chunk-4v4n4srf.js` · offset 199244112 · sha256 `62b280d9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199244112.

**Undocumented**

### `AZURE_CLIENT_SECRET`

Source: `chunk-4v4n4srf.js` · offset 199243792 · sha256 `e3d785a5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199243792.

**Undocumented**

### `AZURE_CLIENT_SEND_CERTIFICATE_CHAIN`

Source: `chunk-4v4n4srf.js` · offset 199243337 · sha256 `cedfa2bc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199243337.

**Undocumented**

### `AZURE_FEDERATED_TOKEN_FILE`

Source: `chunk-4v4n4srf.js` · offset 199219787 · sha256 `5affa54c…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199219787.

**Undocumented**

### `AZURE_IDENTITY_DISABLE_MULTITENANTAUTH`

Source: `chunk-4v4n4srf.js` · offset 198945658 · sha256 `4815de9a…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-4v4n4srf.js` offset 198945658.

**Undocumented**

### `AZURE_PASSWORD`

Source: `chunk-4v4n4srf.js` · offset 199244440 · sha256 `7c19281e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199244440.

**Undocumented**

### `AZURE_POD_IDENTITY_AUTHORITY_HOST`

Source: `chunk-4v4n4srf.js` · offset 199205589 · sha256 `a8c1f5b5…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-4v4n4srf.js` offset 199205589.

**Undocumented**

### `AZURE_REGIONAL_AUTHORITY_NAME`

Source: `chunk-4v4n4srf.js` · offset 199208574 · sha256 `5f710949…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199208574.

**Undocumented**

### `AZURE_TOKEN_CREDENTIALS`

Source: `chunk-4v4n4srf.js` · offset 199247461 · sha256 `91cb3c34…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-4v4n4srf.js` offset 199247461.

**Undocumented**

### `AZURE_USERNAME`

Source: `chunk-4v4n4srf.js` · offset 199244411 · sha256 `9de4ee24…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199244411.

**Undocumented**

### `BUF_BIGINT_DISABLE`

Source: `chunk-hnd61wvn.js` · offset 183983628 · sha256 `31674c1d…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-hnd61wvn.js` offset 183983628.

**Undocumented**

### `CHOKIDAR_INTERVAL`

Source: `chunk-m84kn6gp.js` · offset 183058800 · sha256 `4c2baee7…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-m84kn6gp.js` offset 183058800.

**Undocumented**

### `CHOKIDAR_USEPOLLING`

Source: `chunk-m84kn6gp.js` · offset 183058619 · sha256 `809a7001…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-m84kn6gp.js` offset 183058619.

**Undocumented**

### `CLOUD_RUN_JOB`

Source: `chunk-f72fzxpc.js` · offset 198566891 · sha256 `c94bcd46…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198566891.

**Undocumented**

### `DEBUG_AUTH`

Source: `chunk-f72fzxpc.js` · offset 198577808 · sha256 `a9d539c6…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198577808.

**Undocumented**

### `DETECT_GCP_RETRIES`

Source: `chunk-f72fzxpc.js` · offset 198577127 · sha256 `bef4b628…` · 2 read sites

Read as: number (parsed as a number).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198577127.

**Undocumented**

### `FUNCTION_NAME`

Source: `chunk-f72fzxpc.js` · offset 198566918 · sha256 `16cc5003…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198566918.

**Undocumented**

### `FUNCTION_TARGET`

Source: `chunk-f72fzxpc.js` · offset 198608564 · sha256 `be8aa066…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198608564.

**Undocumented**

### `GAE_MODULE_NAME`

Source: `chunk-f72fzxpc.js` · offset 198608485 · sha256 `3aec2dd6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198608485.

**Undocumented**

### `GAE_SERVICE`

Source: `chunk-f72fzxpc.js` · offset 198608460 · sha256 `3c32fa81…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198608460.

**Undocumented**

### `GCE_METADATA_HOST`

Source: `chunk-f72fzxpc.js` · offset 198575425 · sha256 `489ed04c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198575425.

**Undocumented**

### `GCE_METADATA_IP`

Source: `chunk-f72fzxpc.js` · offset 198575396 · sha256 `63485255…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198575396.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-grwmq3qs.js` · offset 180931674 · sha256 `917eba16…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-grwmq3qs.js` offset 180931674.

**Undocumented**

### `GIT_SSL_CERT`

Source: `chunk-k2pjtcda.js` · offset 191669701 · sha256 `6c42388d…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191669701.

**Undocumented**

### `GIT_SSL_KEY`

Source: `chunk-k2pjtcda.js` · offset 191669716 · sha256 `01ad4f7e…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-k2pjtcda.js` offset 191669716.

**Undocumented**

### `GOOGLE_CLOUD_QUOTA_PROJECT`

Source: `chunk-f72fzxpc.js` · offset 198666397 · sha256 `006ef59e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f72fzxpc.js` offset 198666397.

**Undocumented**

### `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`

Source: `chunk-f72fzxpc.js` · offset 198657019 · sha256 `d60e4754…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198657019.

**Undocumented**

### `GRACEFUL_FS_PLATFORM`

Source: `chunk-7w2qptvr.js` · offset 181159196 · sha256 `1c96518e…`

Read as: string (raw value; further parsing not traced). Default (from code): `darwin`.

Undocumented; read at `chunk-7w2qptvr.js` offset 181159196.

**Undocumented**

### `GRPC_EXPERIMENTAL_ENABLE_OUTLIER_DETECTION`

Source: `chunk-ym43qfss.js` · offset 219793708 · sha256 `2a9c164a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219793708.

**Undocumented**

### `GRPC_NODE_TRACE`

Source: `chunk-ym43qfss.js` · offset 219438905 · sha256 `bd88e67e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219438905.

**Undocumented**

### `GRPC_NODE_USE_ALTERNATIVE_RESOLVER`

Source: `chunk-ym43qfss.js` · offset 219638587 · sha256 `213d12c1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219638587.

**Undocumented**

### `GRPC_NODE_VERBOSITY`

Source: `chunk-ym43qfss.js` · offset 219438244 · sha256 `90d938ec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219438244.

**Undocumented**

### `grpc_proxy`

Source: `chunk-ym43qfss.js` · offset 219645175 · sha256 `984ce2dd…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ym43qfss.js` offset 219645175.

**Undocumented**

### `GRPC_SSL_CIPHER_SUITES`

Source: `chunk-ym43qfss.js` · offset 219443838 · sha256 `6737f6e2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219443838.

**Undocumented**

### `GRPC_TRACE`

Source: `chunk-ym43qfss.js` · offset 219438957 · sha256 `c891fd36…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219438957.

**Undocumented**

### `GRPC_VERBOSITY`

Source: `chunk-ym43qfss.js` · offset 219438300 · sha256 `03141409…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219438300.

**Undocumented**

### `K_CONFIGURATION`

Source: `chunk-f72fzxpc.js` · offset 198608615 · sha256 `8915965f…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198608615.

**Undocumented**

### `LRU_CACHE_IGNORE_AC_WARNING`

Source: `chunk-v9n98466.js` · offset 179272622 · sha256 `08e28927…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-v9n98466.js` offset 179272622.

**Undocumented**

### `METADATA_SERVER_DETECTION`

Source: `chunk-f72fzxpc.js` · offset 198577229 · sha256 `567b2c13…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-f72fzxpc.js` offset 198577229.

**Undocumented**

### `MSAL_FORCE_REGION`

Source: `chunk-4v4n4srf.js` · offset 199182267 · sha256 `95f9a19b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199182267.

**Undocumented**

### `no_grpc_proxy`

Source: `chunk-ym43qfss.js` · offset 219645974 · sha256 `3e43f776…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219645974.

**Undocumented**

### `OSTYPE`

Source: `chunk-f6y3mr7n.js` · offset 180088567 · sha256 `e7feb6ad…` · 2 read sites

Read as: enum (compared against fixed values). Values: `cygwin`, `msys`.

Undocumented; read at `chunk-f6y3mr7n.js` offset 180088567.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CERTIFICATE`

Source: `chunk-ym43qfss.js` · offset 219823832 · sha256 `3f3cfacf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219823832.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`

Source: `chunk-ym43qfss.js` · offset 219823526 · sha256 `32e387c2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219823526.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_KEY`

Source: `chunk-ym43qfss.js` · offset 219823684 · sha256 `fc5f98a1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219823684.

**Undocumented**

### `OTEL_EXPORTER_OTLP_INSECURE`

Source: `chunk-ym43qfss.js` · offset 219823227 · sha256 `8ce73eb5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ym43qfss.js` offset 219823227.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_HOST`

Source: `chunk-4yvj3zp6.js` · offset 219846726 · sha256 `61eafb33…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4yvj3zp6.js` offset 219846726.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_PORT`

Source: `chunk-4yvj3zp6.js` · offset 219846818 · sha256 `ccf61175…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-4yvj3zp6.js` offset 219846818.

**Undocumented**

### `REGION_NAME`

Source: `chunk-4v4n4srf.js` · offset 199182414 · sha256 `a5881060…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4v4n4srf.js` offset 199182414.

**Undocumented**

### `TEST_GRACEFUL_FS_GLOBAL_PATCH`

Source: `chunk-7w2qptvr.js` · offset 181166090 · sha256 `d12bfc7e…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-7w2qptvr.js` offset 181166090.

**Undocumented**
