# Environment variables read by Claude Code

Claude Code reads 1177 environment variables by name, plus 5 name patterns built at run time. 385 of the named variables are documented at code.claude.com and 792 are not. It also sets 467 variables for its own process, tools, hooks and other child processes; these are listed in their own section.

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

Source: `chunk-mphp7acd.js` · offset 187708673 · sha256 `ac07578b…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for main-conversation requests: the interactive main thread, SDK, auto-mode and memory-relevance requests. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the promptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for the main conversation: your interactive, `-p`, and SDK turns, plus the helpers that run inline with them.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_CACHE_EVICT`

Source: `chunk-mphp7acd.js` · offset 187814495 · sha256 `3f7f893f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, and two internal capability checks pass, a request that asks to evict its cache on completion gets the prompt-caching evict beta. Its cache_control marker then carries evict_on_complete: true. When unset, a remote feature flag decides.

**Undocumented**

### `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`

Source: `chunk-mphp7acd.js` · offset 187708704 · sha256 `48e6265c…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for every request that is not a main-conversation request, such as subagents and background work. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the subagentPromptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for requests outside the main conversation, such as subagents, workflows, and background work.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`

Source: `chunk-jxy1fa30.js` · offset 198444236 · sha256 `ccab5fa7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From code: Read as an integer. The stagger wait is 0 when DISABLE_PROMPT_CACHING is truthy.

From docs: Upper bound in milliseconds on how long a workflow agent waits for a same-prefix sibling's first response to begin before sending its own first request.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING`

Source: `chunk-jxy1fa30.js` · offset 198444206 · sha256 `f7c692cd…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false for every model. It is checked before the per-model variables, so it overrides them. That check applies whenever a caller does not pass its own caching flag. No caller in this build passes a literal true; several internal side requests pass a literal false, and a few forward a value that this reference does not trace. It also sets the workflow same-prefix stagger wait to 0. When it or the HAIKU, OPUS, SONNET or FABLE variable is truthy, a warning notice reads "Prompt caching off ({{DISABLED_CACHE_VARS}}), requests will be slower and cost more · unset it to re-enable". {{DISABLED_CACHE_VARS}} is the set variables from that list of five, joined with ", ".

From docs: Set to `1` to disable prompt caching for all models (takes precedence over per-model settings)

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_FABLE`

Source: `chunk-mphp7acd.js` · offset 187804888 · sha256 `68dddb81…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-fable-" or equals ANTHROPIC_DEFAULT_FABLE_MODEL after normalization.

From docs: Set to `1` to disable prompt caching for Fable models

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_HAIKU`

Source: `chunk-mphp7acd.js` · offset 187804590 · sha256 `6d1a40ff…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only for a request whose model equals the resolved small/fast model. That model must also differ from the main-loop model. The check runs only when a small/fast model applies: ANTHROPIC_SMALL_FAST_MODEL or ANTHROPIC_DEFAULT_HAIKU_MODEL is set, or an internal provider/login condition holds.

From docs: Set to `1` to disable prompt caching for Haiku models

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_MYTHOS`

Source: `chunk-mphp7acd.js` · offset 187804949 · sha256 `def68dd6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-mythos-". The "Prompt caching off" warning notice does not list it.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

**Undocumented**

### `DISABLE_PROMPT_CACHING_OPUS`

Source: `chunk-mphp7acd.js` · offset 187804825 · sha256 `d6bb0579…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Opus model: ANTHROPIC_DEFAULT_OPUS_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Opus models", but this check does not match other Opus model IDs.

From docs: Set to `1` to disable prompt caching for Opus models

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_SONNET`

Source: `chunk-mphp7acd.js` · offset 187804760 · sha256 `4dfe1b5a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Sonnet model: ANTHROPIC_DEFAULT_SONNET_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Sonnet models", but this check does not match other Sonnet model IDs.

From docs: Set to `1` to disable prompt caching for Sonnet models

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H`

Source: `chunk-mphp7acd.js` · offset 187708961 · sha256 `2c1b2543…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. When truthy, requests with no FORCE_PROMPT_CACHING_5M, no TTL variable, no TTL setting and no agent-frontmatter TTL get the 1-hour TTL. The resolver does not restrict it by provider or model. It is evaluated before the subscriber and overage fallback, so it also applies to non-subscribers and during overage.

From docs: Set to `1` to request a 1-hour prompt cache TTL instead of the default 5 minutes.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H_BEDROCK`

Source: `chunk-mphp7acd.js` · offset 187709007 · sha256 `805c531a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. Has the same effect as ENABLE_PROMPT_CACHING_1H, but only when the provider is Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK).

From docs: Deprecated.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_PROMPT_CACHING_5M`

Source: `chunk-mphp7acd.js` · offset 187708591 · sha256 `7e522f80…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 1 of TTL resolution. When truthy, every request resolved through the TTL resolver gets the 5-minute TTL, ahead of all TTL variables, settings and agent frontmatter.

From docs: Set to `1` to force the 5-minute prompt cache TTL even when 1-hour TTL would otherwise apply.

Evidence (offsets): caching off notice `chunk-1ypw9bby.js` @ 206230874 · cache control builder `chunk-mphp7acd.js` @ 187805010 · ttl resolver `chunk-mphp7acd.js` @ 187708565

Documented: https://code.claude.com/docs/en/env-vars

## Claude Code and Anthropic

### `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184769473 · sha256 `141c63d2…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184769473.

**Undocumented**

### `AI_AGENT`

Source: `chunk-q6t47sex.js` · offset 177849204 · sha256 `53cd51cc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-q6t47sex.js` offset 177849204.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-a6ty6v4s.js` · offset 202363161 · sha256 `15d71a5f…` · 31 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 10 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key sent as `X-Api-Key` header.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-cwq90agc.js` · offset 184023269 · sha256 `3298dcb6…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780948 · sha256 `7e406881…` · 49 read sites

Read as: string (trimmed; empty is treated as unset). Values: `https://api-staging.anthropic.com`. Default (from code): `https://api.anthropic.com`.

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the API endpoint to route requests through a proxy or gateway.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BETAS`

Source: `chunk-dgp2yyqt.js` · offset 194978325 · sha256 `7f59f23c…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Comma-separated list of additional `anthropic-beta` header values to include in API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-8ptzhr8g.js` · offset 180384497 · sha256 `1bbaadf8…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180384497.

**Undocumented**

### `ANTHROPIC_CUSTOM_HEADERS`

Source: `chunk-09m4fzsj.js` · offset 184772011 · sha256 `251d5fb7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION`

Source: `chunk-09m4fzsj.js` · offset 184735872 · sha256 `365f3ebd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID to add as a custom entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`

Source: `chunk-09m4fzsj.js` · offset 184736018 · sha256 `9a56865d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`

Source: `chunk-09m4fzsj.js` · offset 184735958 · sha256 `e9d17412…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL`

Source: `chunk-09m4fzsj.js` · offset 184723883 · sha256 `bab142cc…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Model ID that the `fable` alias resolves to, and the ID Claude Code recognizes as a Fable model for automatic model fallback on third-party providers.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_DESCRIPTION`

Source: `chunk-09m4fzsj.js` · offset 184724000 · sha256 `a2a27d85…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Fable model`.

From docs: Display description for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME`

Source: `chunk-09m4fzsj.js` · offset 184723963 · sha256 `c1c1562e…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-09m4fzsj.js` · offset 184727366 · sha256 `bcacaca2…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`

Source: `chunk-09m4fzsj.js` · offset 184727483 · sha256 `a6617ffb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Haiku model`.

From docs: Display description for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`

Source: `chunk-09m4fzsj.js` · offset 184727446 · sha256 `ede3ae9d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_MODEL`

Source: `chunk-dgp2yyqt.js` · offset 194982108 · sha256 `5f40fa89…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model that new sessions start on by default.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-09m4fzsj.js` · offset 184725077 · sha256 `bc028f5f…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-09m4fzsj.js` · offset 184725203 · sha256 `3929d889…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-09m4fzsj.js` · offset 184725167 · sha256 `d8c31deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-09m4fzsj.js` · offset 184722527 · sha256 `f81df586…` · 16 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`

Source: `chunk-09m4fzsj.js` · offset 184722661 · sha256 `061abab4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`

Source: `chunk-09m4fzsj.js` · offset 184722623 · sha256 `3fb9026d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ENVIRONMENT_ID`

Source: `chunk-09m4fzsj.js` · offset 184253166 · sha256 `d14a495f…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184253166.

**Undocumented**

### `ANTHROPIC_ENVIRONMENT_KEY`

Source: `chunk-09m4fzsj.js` · offset 184253283 · sha256 `6263a48c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184253283.

**Undocumented**

### `ANTHROPIC_FEDERATION_RULE_ID`

Source: `chunk-8ptzhr8g.js` · offset 180381803 · sha256 `3c95f8b4…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Federation rule ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_IDENTITY_TOKEN`

Source: `chunk-ax8nkkm1.js` · offset 183833606 · sha256 `3749035b…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ax8nkkm1.js` offset 183833606.

**Undocumented**

### `ANTHROPIC_IDENTITY_TOKEN_FILE`

Source: `chunk-ax8nkkm1.js` · offset 183825062 · sha256 `6fe07aff…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ax8nkkm1.js` offset 183825062.

**Undocumented**

### `ANTHROPIC_LOG`

Source: `chunk-09m4fzsj.js` · offset 184206228 · sha256 `4b0a58c8…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184206228.

**Undocumented**

### `ANTHROPIC_MODEL`

Source: `chunk-4gbrna1q.js` · offset 195079281 · sha256 `9effd817…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Name of the model setting to use (see Model Configuration)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ORGANIZATION_ID`

Source: `chunk-8ptzhr8g.js` · offset 180381745 · sha256 `cf9ebbc1…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Organization ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_PROFILE`

Source: `chunk-8ptzhr8g.js` · offset 180380879 · sha256 `f029bb2b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

From docs: Name of the Anthropic profile to authenticate with, such as one created by `ant auth login` or by signing in to a Console account without an API key.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SCOPE`

Source: `chunk-ax8nkkm1.js` · offset 183825431 · sha256 `ad620519…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ax8nkkm1.js` offset 183825431.

**Undocumented**

### `ANTHROPIC_SERVICE_ACCOUNT_ID`

Source: `chunk-ax8nkkm1.js` · offset 183825343 · sha256 `65014688…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ax8nkkm1.js` offset 183825343.

**Undocumented**

### `ANTHROPIC_SESSION_ID`

Source: `chunk-09m4fzsj.js` · offset 184253213 · sha256 `ec717269…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184253213.

**Undocumented**

### `ANTHROPIC_SMALL_FAST_MODEL`

Source: `chunk-mphp7acd.js` · offset 187715719 · sha256 `263f23ef…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: \[DEPRECATED] Name of Haiku-class model for background tasks

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_UNIX_SOCKET`

Source: `chunk-2z1m9v0n.js` · offset 183490228 · sha256 `cd7cb418…` · 38 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 25 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2z1m9v0n.js` offset 183490228.

**Undocumented**

### `ANTHROPIC_WEBHOOK_SIGNING_KEY`

Source: `chunk-09m4fzsj.js` · offset 184340587 · sha256 `1137f7a8…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184340587.

**Undocumented**

### `ANTHROPIC_WORK_ID`

Source: `chunk-09m4fzsj.js` · offset 184253122 · sha256 `e945d947…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184253122.

**Undocumented**

### `ANTHROPIC_WORK_SECRET`

Source: `chunk-09m4fzsj.js` · offset 184253341 · sha256 `186c97eb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184253341.

**Undocumented**

### `ANTHROPIC_WORKSPACE_ID`

Source: `chunk-8ptzhr8g.js` · offset 180381673 · sha256 `21f00b3c…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Workspace ID for workload identity federation.

Documented: https://code.claude.com/docs/en/env-vars

### `API_FORCE_IDLE_TIMEOUT`

Source: `chunk-wj72kvg2.js` · offset 179714597 · sha256 `a01398ac…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the 5-minute body idle timeout that aborts a streaming model response when no bytes arrive.

Documented: https://code.claude.com/docs/en/env-vars

### `API_TIMEOUT_MS`

Source: `chunk-09m4fzsj.js` · offset 184772723 · sha256 `a888de25…` · 6 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647).

Documented: https://code.claude.com/docs/en/env-vars

### `AUTOMODE_DECISION_LOG`

Source: `chunk-mphp7acd.js` · offset 188298334 · sha256 `1e7c0dc0…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-mphp7acd.js` offset 188298334.

**Undocumented**

### `BASH_DEFAULT_TIMEOUT_MS`

Source: `chunk-t2h010j6.js` · offset 184000433 · sha256 `553fd156…`

Read as: string (raw value; further parsing not traced).

From docs: Default timeout for long-running bash commands (default: 120000, or 2 minutes)

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-r5fg485w.js` · offset 185389192 · sha256 `0e7a1c0d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_TIMEOUT_MS`

Source: `chunk-t2h010j6.js` · offset 184000548 · sha256 `b63207f0…`

Read as: string (raw value; further parsing not traced).

From docs: Maximum timeout the model can set for long-running bash commands (default: 600000, or 10 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `BUGHUNTER_DEV_BUNDLE_B64`

Source: `chunk-1mj5vjep.js` · offset 198908479 · sha256 `9dd8b661…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-1mj5vjep.js` offset 198908479.

**Undocumented**

### `BUGHUNTER_FLEET_SIZE`

Source: `chunk-3ywzq0xf.js` · offset 194050529 · sha256 `73c58ba3…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-3ywzq0xf.js` offset 194050529.

**Undocumented**

### `CCR_ENABLE_BUNDLE`

Source: `chunk-f2cpzzp9.js` · offset 207759282 · sha256 `19d54f8c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f2cpzzp9.js` offset 207759282.

**Undocumented**

### `CCR_FORCE_BUNDLE`

Source: `chunk-mphp7acd.js` · offset 188621368 · sha256 `3071d65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force `claude --cloud` to bundle and upload your local repository instead of cloning from its remote

Documented: https://code.claude.com/docs/en/env-vars

### `CCR_ON_BRANCH_DEFAULT_GUARD`

Source: `chunk-mphp7acd.js` · offset 188964457 · sha256 `2763e2c9…` · 2 read sites

Read as: enum (compared against fixed values). Values: `enforce`, `observe`, `off`.

Undocumented; read at `chunk-mphp7acd.js` offset 188964457.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-gmr92866.js` · offset 209879211 · sha256 `4ea4f741…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gmr92866.js` offset 209879211.

**Undocumented**

### `CCR_SHR_SSE_HINTS`

Source: `chunk-8xhw5h9f.js` · offset 190628385 · sha256 `927ca514…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190628385.

**Undocumented**

### `CCR_SPAWN_TIMESTAMP_MS`

Source: `chunk-5m30we7w.js` · offset 179116747 · sha256 `628d65dc…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-5m30we7w.js` offset 179116747.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-f5w4pbxy.js` · offset 201267098 · sha256 `d6342530…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f5w4pbxy.js` offset 201267098.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-f2cpzzp9.js` · offset 207798546 · sha256 `2959d146…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-f2cpzzp9.js` · offset 207798500 · sha256 `3d44032d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-mphp7acd.js` · offset 185804954 · sha256 `0da64453…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 185804954.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-09m4fzsj.js` · offset 184771346 · sha256 `eab56788…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184771346.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-mphp7acd.js` · offset 187152629 · sha256 `763e9be8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-j0381q8k.js` · offset 201659973 · sha256 `1d81ae5d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j0381q8k.js` offset 201659973.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-amg94xhm.js` · offset 213060887 · sha256 `af756a02…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-j0381q8k.js` · offset 201654220 · sha256 `8c91e3c2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unknown`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j0381q8k.js` offset 201654220.

**Undocumented**

### `CLAUDE_AGENTS_AUTO_RELAUNCHED_AT`

Source: `chunk-9975a2ae.js` · offset 196153756 · sha256 `b90a97b9…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-9975a2ae.js` offset 196153756.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-9975a2ae.js` · offset 196166462 · sha256 `05b80a80…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9975a2ae.js` offset 196166462.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-09916wnc.js` · offset 209487362 · sha256 `bd85f0b2…` · 6 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-09916wnc.js` offset 209487362.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-5ne43w2c.js` · offset 193254958 · sha256 `159c9a8a…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true.

From docs: Stall timeout in milliseconds for subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-xmc0bp9s.js` · offset 193318675 · sha256 `ddd26c0c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-mphp7acd.js` · offset 186785945 · sha256 `0e787485…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_PREPARK_MS`

Source: `chunk-3bsqc8dr.js` · offset 180489729 · sha256 `7763481a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `0`.

From docs: In screen reader mode, how many milliseconds Claude Code waits, with the cursor at the start of the line, before it writes a new or changed line.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_SCREEN_READER`

Source: `chunk-3bsqc8dr.js` · offset 180488387 · sha256 `e9ec58b6…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to render screen-reader friendly output: flat text without decorative borders or animations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_STARTUP_QUIET_MS`

Source: `chunk-3bsqc8dr.js` · offset 180489607 · sha256 `c9ed3776…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

From docs: In screen reader mode, how many milliseconds Claude Code holds the first interface render after the startup confirmation line, so your screen reader can speak the line in full before new output interrupts it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-brnn4zwp.js` · offset 178048155 · sha256 `5509dbb8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-mnp9k227.js` · offset 180498313 · sha256 `b23ee675…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mnp9k227.js` offset 180498313.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-1sb33067.js` · offset 210927632 · sha256 `761beb70…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Values: `daemon`.

Undocumented; read at `chunk-1sb33067.js` offset 210927632.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-tqj1w3b2.js` · offset 192272326 · sha256 `b9127893…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-tqj1w3b2.js` offset 192272326.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-8ptzhr8g.js` · offset 180386853 · sha256 `479c8291…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180386853.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-8ptzhr8g.js` · offset 180386790 · sha256 `75c57711…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180386790.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-mphp7acd.js` · offset 186463158 · sha256 `4c46686e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `worktree`.

Undocumented; read at `chunk-mphp7acd.js` offset 186463158.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-dgp2yyqt.js` · offset 194965650 · sha256 `09901b5e…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-dgp2yyqt.js` offset 194965650.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-dgp2yyqt.js` · offset 195021720 · sha256 `e616699a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195021720.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-aa430wh3.js` · offset 196241204 · sha256 `dbda7267…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aa430wh3.js` offset 196241204.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-jx00zmk1.js` · offset 205756315 · sha256 `5cac6c16…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-jx00zmk1.js` offset 205756315.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-jx00zmk1.js` · offset 205756532 · sha256 `47f681f8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-jx00zmk1.js` offset 205756532.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-dgp2yyqt.js` · offset 194965046 · sha256 `76fa2fb1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dgp2yyqt.js` offset 194965046.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-aa430wh3.js` · offset 196241279 · sha256 `1fcb7e87…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aa430wh3.js` offset 196241279.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-f2cpzzp9.js` · offset 208052885 · sha256 `2c2da5b5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `spare`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 208052885.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-jx00zmk1.js` · offset 205755278 · sha256 `4fcf9acc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `45000`.

Undocumented; read at `chunk-jx00zmk1.js` offset 205755278.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-aa430wh3.js` · offset 196240372 · sha256 `d9c55f29…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-aa430wh3.js` offset 196240372.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-f5w4pbxy.js` · offset 201270807 · sha256 `57d0e7e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f5w4pbxy.js` offset 201270807.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-3sdpavrm.js` · offset 200689446 · sha256 `733dae68…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-3sdpavrm.js` offset 200689446.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-rw977e91.js` · offset 214339833 · sha256 `76f29ce6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rw977e91.js` offset 214339833.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-rw977e91.js` · offset 214339957 · sha256 `3d9adfbe…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-rw977e91.js` offset 214339957.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-q1842b1c.js` · offset 195321737 · sha256 `2876ad7c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q1842b1c.js` offset 195321737.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-rw977e91.js` · offset 214339880 · sha256 `03171b60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rw977e91.js` offset 214339880.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-rw977e91.js` · offset 214339919 · sha256 `4103eaa4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rw977e91.js` offset 214339919.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-rw977e91.js` · offset 214339791 · sha256 `78c12cd2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-rw977e91.js` offset 214339791.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-rw977e91.js` · offset 214339736 · sha256 `0ed49f22…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-rw977e91.js` offset 214339736.

**Undocumented**

### `CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-09m4fzsj.js` · offset 184781954 · sha256 `08bc2317…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for the byte-level streaming idle watchdog; when set, it takes precedence over `CLAUDE_STREAM_IDLE_TIMEOUT_MS` for that watchdog and leaves the event-level watchdog unchanged.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CHROME_CLASSIFIER_FLOOR`

Source: `chunk-4zgx6txq.js` · offset 193135027 · sha256 `115bb892…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-4zgx6txq.js` offset 193135027.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-7eyrbz6k.js` · offset 196823108 · sha256 `9ab1f9d7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196823108.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-7eyrbz6k.js` · offset 196822915 · sha256 `d8cf5ff5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196822915.

**Undocumented**

### `CLAUDE_CHROME_TAB_GROUP_KEY`

Source: `chunk-0a47xg8f.js` · offset 178236149 · sha256 `47225c3e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0a47xg8f.js` offset 178236149.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-7rmn6fde.js` · offset 206471429 · sha256 `ceff9aca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_HAIKU_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944689 · sha256 `0e705394…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180944689.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944613 · sha256 `8ebd36d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180944613.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944525 · sha256 `303f0d24…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180944525.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_OPUS_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944399 · sha256 `076d67b6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180944399.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_SONNET_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944244 · sha256 `df9df263…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180944244.

**Undocumented**

### `CLAUDE_CODE_ACCESSIBILITY`

Source: `chunk-p50qybax.js` · offset 191790078 · sha256 `78c0f256…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `0`.

From docs: Set to `1` to keep the native terminal cursor visible and disable the inverted-text cursor indicator.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ACCOUNT_TAGGED_ID`

Source: `chunk-qyc5w2q1.js` · offset 183528531 · sha256 `755576cb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qyc5w2q1.js` offset 183528531.

**Undocumented**

### `CLAUDE_CODE_ACCOUNT_UUID`

Source: `chunk-7eyrbz6k.js` · offset 196826492 · sha256 `6e8b00aa…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196826492.

**Undocumented**

### `CLAUDE_CODE_ACT_DONT_REDERIVE`

Source: `chunk-mphp7acd.js` · offset 187203187 · sha256 `61dc2948…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187203187.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-nankzm0s.js` · offset 181083716 · sha256 `bccfb10f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181083716.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-mphp7acd.js` · offset 186430461 · sha256 `ecdc6b1d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-09m4fzsj.js` · offset 184772118 · sha256 `91464e4f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184772118.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-xapeakym.js` · offset 204623947 · sha256 `c893ec8f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204623947.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-nankzm0s.js` · offset 181061988 · sha256 `dcf206a0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181061988.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-b60bqfbx.js` · offset 185681888 · sha256 `68046f81…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-b60bqfbx.js` offset 185681888.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-2t7nhzwg.js` · offset 195904886 · sha256 `2650615c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ALTGR_AS_TEXT`

Source: `chunk-p50qybax.js` · offset 191740303 · sha256 `43919966…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-p50qybax.js` offset 191740303.

**Undocumented**

### `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT`

Source: `chunk-5rsp1jx3.js` · offset 181698342 · sha256 `47ef8a02…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the effort parameter with every request, even when Claude Code does not recognize the model ID as effort-capable.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AMBER_ASTROLABE`

Source: `chunk-1b21she7.js` · offset 181768753 · sha256 `8e2e5701…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181768753.

**Undocumented**

### `CLAUDE_CODE_API_BASE_URL`

Source: `chunk-mphp7acd.js` · offset 188756862 · sha256 `ffa9d202…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 188756862.

**Undocumented**

### `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR`

Source: `chunk-cwq90agc.js` · offset 184023387 · sha256 `571c81f2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-cwq90agc.js` offset 184023387.

**Undocumented**

### `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`

Source: `chunk-nankzm0s.js` · offset 181239684 · sha256 `99a8a679…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval in milliseconds at which credentials should be refreshed (when using `apiKeyHelper`)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_APPEND_PROMPT_HEAD`

Source: `chunk-dgp2yyqt.js` · offset 194983576 · sha256 `bf7783f1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dgp2yyqt.js` offset 194983576.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-p3jvcdtp.js` · offset 185534138 · sha256 `e42ef07b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p3jvcdtp.js` offset 185534138.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSETS`

Source: `chunk-p3jvcdtp.js` · offset 185534486 · sha256 `f6d17a02…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-p3jvcdtp.js` offset 185534486.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-y1ga25rr.js` · offset 208949767 · sha256 `775a16f7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK`

Source: `chunk-8f02nerv.js` · offset 192900383 · sha256 `745c4305…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8f02nerv.js` offset 192900383.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK_FIXED`

Source: `chunk-8f02nerv.js` · offset 192900924 · sha256 `9a7789ac…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8f02nerv.js` offset 192900924.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_RESPONDER`

Source: `chunk-8f02nerv.js` · offset 192888956 · sha256 `782008f7…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8f02nerv.js` offset 192888956.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENTS`

Source: `chunk-2m3xx2mv.js` · offset 192724423 · sha256 `83d5f67c…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude reading and replying to comments on an artifact.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENTS_AUTOREACT`

Source: `chunk-8f02nerv.js` · offset 192900282 · sha256 `84cec711…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude replying on its own to comments sent to it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_DB`

Source: `chunk-4w3wrktj.js` · offset 194233923 · sha256 `46958bfd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-4w3wrktj.js` offset 194233923.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DB_STR_REPLACE`

Source: `chunk-4w3wrktj.js` · offset 194233983 · sha256 `246859d1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-4w3wrktj.js` offset 194233983.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DELETE`

Source: `chunk-3k1vzdfm.js` · offset 194434104 · sha256 `c864f413…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-3k1vzdfm.js` offset 194434104.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_FRESH_READ`

Source: `chunk-09916wnc.js` · offset 209752254 · sha256 `18d08d8c…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-09916wnc.js` offset 209752254.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_HOT`

Source: `chunk-mrm8jr3y.js` · offset 192522383 · sha256 `6f57a8ce…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mrm8jr3y.js` offset 192522383.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_MULTI_FILE`

Source: `chunk-mrm8jr3y.js` · offset 192521964 · sha256 `2cf3d5b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mrm8jr3y.js` offset 192521964.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPEN_ACTION`

Source: `chunk-3k1vzdfm.js` · offset 194449178 · sha256 `e90603dd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-3k1vzdfm.js` offset 194449178.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH`

Source: `chunk-mphp7acd.js` · offset 189122550 · sha256 `568a00a5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189122550.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PATH_PIN`

Source: `chunk-k2dqvf8r.js` · offset 194419632 · sha256 `9e1bd820…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-k2dqvf8r.js` offset 194419632.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PIN`

Source: `chunk-3k1vzdfm.js` · offset 194446098 · sha256 `2693918e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-3k1vzdfm.js` offset 194446098.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PRESENCE`

Source: `chunk-45c66d1k.js` · offset 193014942 · sha256 `0303b2b0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-45c66d1k.js` offset 193014942.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PREVIEW`

Source: `chunk-s1mfg8e9.js` · offset 194270783 · sha256 `713c0eb8…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-s1mfg8e9.js` offset 194270783.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_QUICKSTART`

Source: `chunk-dk58p4z6.js` · offset 194300530 · sha256 `2b007556…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dk58p4z6.js` offset 194300530.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SHARE`

Source: `chunk-3k1vzdfm.js` · offset 194445981 · sha256 `297f86f7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-3k1vzdfm.js` offset 194445981.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_START_KIT`

Source: `chunk-z7fe4zqd.js` · offset 198162169 · sha256 `e7c123b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-z7fe4zqd.js` offset 198162169.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TEXT_VARIANT`

Source: `chunk-ep4nwhrj.js` · offset 200609962 · sha256 `85a661ad…`

Read as: enum (compared against fixed values). Values: `v0`, `v1`, `v2`.

Undocumented; read at `chunk-ep4nwhrj.js` offset 200609962.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TOOLSET`

Source: `chunk-mrm8jr3y.js` · offset 192519732 · sha256 `9f5b8208…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mrm8jr3y.js` offset 192519732.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CATALOG`

Source: `chunk-dk58p4z6.js` · offset 194300463 · sha256 `9ec5c026…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dk58p4z6.js` offset 194300463.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE`

Source: `chunk-dk58p4z6.js` · offset 194290766 · sha256 `2ddf902e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dk58p4z6.js` offset 194290766.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPES`

Source: `chunk-dk58p4z6.js` · offset 194290707 · sha256 `d3757745…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dk58p4z6.js` offset 194290707.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VERIFY`

Source: `chunk-dk58p4z6.js` · offset 194275009 · sha256 `835f81cd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dk58p4z6.js` offset 194275009.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-7nd16342.js` · offset 192455584 · sha256 `c569a74f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7nd16342.js` offset 192455584.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_ANNOUNCEMENT`

Source: `chunk-mphp7acd.js` · offset 186721572 · sha256 `4d5b229d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186721572.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_HEADER`

Source: `chunk-b5kmgz2n.js` · offset 181644068 · sha256 `0ccadf30…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to omit the attribution block, which carries the client version and a prompt fingerprint, from the start of the system prompt.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTH_FAIL_EXIT_MS`

Source: `chunk-nankzm0s.js` · offset 181268905 · sha256 `46d1eca9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-nankzm0s.js` offset 181268905.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-mphp7acd.js` · offset 186783449 · sha256 `042de733…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_CONNECT_IDE`

Source: `chunk-mphp7acd.js` · offset 189054083 · sha256 `5bc23d1b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Override automatic IDE connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-mphp7acd.js` · offset 187092029 · sha256 `a472a5b1…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_TIER`

Source: `chunk-fkttf1dq.js` · offset 210473326 · sha256 `a979d3e4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-fkttf1dq.js` offset 210473326.

**Undocumented**

### `CLAUDE_CODE_BASALT_COVE`

Source: `chunk-1b21she7.js` · offset 181767692 · sha256 `38275e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181767692.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-w7hy7pqe.js` · offset 183749517 · sha256 `b0ab3da3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w7hy7pqe.js` offset 183749517.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-w7hy7pqe.js` · offset 183730457 · sha256 `eb4dddf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w7hy7pqe.js` offset 183730457.

**Undocumented**

### `CLAUDE_CODE_BASH_EDIT_DIFF`

Source: `chunk-mphp7acd.js` · offset 189707575 · sha256 `9d0ca4a0…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off the diff of the files that changed while a Bash command ran, or `1` to record it in every permission mode.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASH_OUTPUT_AUDIENCE_NOTE`

Source: `chunk-mphp7acd.js` · offset 187161409 · sha256 `83e24132…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187161409.

**Undocumented**

### `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR`

Source: `chunk-mphp7acd.js` · offset 189756043 · sha256 `5fd05623…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 189756043.

**Undocumented**

### `CLAUDE_CODE_BENCH_LIVE_COUNTS`

Source: `chunk-p50qybax.js` · offset 191858561 · sha256 `bb39fa45…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p50qybax.js` offset 191858561.

**Undocumented**

### `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING`

Source: `chunk-xapeakym.js` · offset 204466955 · sha256 `daf2d2c7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to make a non-interactive session report an idle status to its host at every turn end, even while background work is still running.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BISON_CAIRN`

Source: `chunk-1b21she7.js` · offset 181768840 · sha256 `a636f61b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1b21she7.js` offset 181768840.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-mphp7acd.js` · offset 186785991 · sha256 `deb6881a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186785991.

**Undocumented**

### `CLAUDE_CODE_BREEZY_HORIZON`

Source: `chunk-1b21she7.js` · offset 181770364 · sha256 `20ed664c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1b21she7.js` offset 181770364.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-8ptzhr8g.js` · offset 180396289 · sha256 `8e5b73c3…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396289.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-8ptzhr8g.js` · offset 180396248 · sha256 `30df26bd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396248.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-09m4fzsj.js` · offset 184567515 · sha256 `07c79987…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184567515.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-758hjhx1.js` · offset 180368948 · sha256 `4dc7d695…`

Read as: enum (compared against fixed values). Values: `1`, `spent`.

Undocumented; read at `chunk-758hjhx1.js` offset 180368948.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-xapeakym.js` · offset 204973648 · sha256 `6bc37768…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204973648.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-xapeakym.js` · offset 204973804 · sha256 `c1baf9db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204973804.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-mphp7acd.js` · offset 186260354 · sha256 `a0321c61…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186260354.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-5s6b4r7q.js` · offset 205997498 · sha256 `dfd2bbc1…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5s6b4r7q.js` offset 205997498.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-mxax1w86.js` · offset 193472444 · sha256 `fbf235f3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mxax1w86.js` offset 193472444.

**Undocumented**

### `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE`

Source: `chunk-p50qybax.js` · offset 191739960 · sha256 `91a7fceb…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `0` to make Claude Code read the `0x08` byte, also written `^H`, as plain Backspace, or `1` to read it as Ctrl+Backspace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BUBBLEWRAP`

Source: `chunk-1sb33067.js` · offset 210932811 · sha256 `cebdad4c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1sb33067.js` offset 210932811.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_HYDRATE_PREFETCH`

Source: `chunk-dgp2yyqt.js` · offset 195039547 · sha256 `74fe0821…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195039547.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_PLUGINS_SYNC`

Source: `chunk-mphp7acd.js` · offset 186051541 · sha256 `ea69ab05…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 186051541.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_REMOTE_CONNECT`

Source: `chunk-dgp2yyqt.js` · offset 195039596 · sha256 `4e6f2f91…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195039596.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_SKILLS_SYNC`

Source: `chunk-105zfxe3.js` · offset 194873717 · sha256 `7f0e515e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-105zfxe3.js` offset 194873717.

**Undocumented**

### `CLAUDE_CODE_CCR_FOLD_FIRST_TURN_RESCAN`

Source: `chunk-xapeakym.js` · offset 204524521 · sha256 `5a1b7fc3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204524521.

**Undocumented**

### `CLAUDE_CODE_CCR_SKIP_FRESH_MIGRATIONS`

Source: `chunk-q1842b1c.js` · offset 195277062 · sha256 `1c78f196…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q1842b1c.js` offset 195277062.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-ay2zhh0a.js` · offset 200451549 · sha256 `54105beb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `tag`.

Undocumented; read at `chunk-ay2zhh0a.js` offset 200451549.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-09m4fzsj.js` · offset 184517260 · sha256 `0bb57284…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-7eyrbz6k.js` · offset 196828170 · sha256 `a2951440…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196828170.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-3ywzq0xf.js` · offset 194051410 · sha256 `20834deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-3ywzq0xf.js` offset 194051410.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-cvfe0dkq.js` · offset 193675768 · sha256 `a2db3c38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cvfe0dkq.js` offset 193675768.

**Undocumented**

### `CLAUDE_CODE_COLD_COMPACT`

Source: `chunk-mphp7acd.js` · offset 187660007 · sha256 `f38286b5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187660007.

**Undocumented**

### `CLAUDE_CODE_CONFIG_PROBE`

Source: `chunk-8ptzhr8g.js` · offset 180396373 · sha256 `55826c3c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396373.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-09m4fzsj.js` · offset 184771263 · sha256 `31dd4973…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184771263.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_EXTRA_TOOLS`

Source: `chunk-kny5qk1k.js` · offset 204082467 · sha256 `689a77c0…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kny5qk1k.js` offset 204082467.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_FORCE_WORKER_INHERIT_MODEL`

Source: `chunk-ebcyvbxn.js` · offset 185549228 · sha256 `072440a5…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ebcyvbxn.js` offset 185549228.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-ke6n6sdy.js` · offset 185541746 · sha256 `0483ada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ke6n6sdy.js` offset 185541746.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-ebcyvbxn.js` · offset 185544119 · sha256 `bfb980c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ebcyvbxn.js` offset 185544119.

**Undocumented**

### `CLAUDE_CODE_COWORK_FRAME_ARTIFACTS`

Source: `chunk-0a47xg8f.js` · offset 178236000 · sha256 `61849089…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0a47xg8f.js` offset 178236000.

**Undocumented**

### `CLAUDE_CODE_COZY_TEAPOT`

Source: `chunk-1b21she7.js` · offset 181768330 · sha256 `227ab582…`

Read as: enum (compared against fixed values). Values: `strict`, `relaxed`.

Undocumented; read at `chunk-1b21she7.js` offset 181768330.

**Undocumented**

### `CLAUDE_CODE_CUSTOM_OAUTH_URL`

Source: `chunk-a5b8yq96.js` · offset 178157786 · sha256 `fd19aaca…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-a5b8yq96.js` offset 178157786.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-b60bqfbx.js` · offset 185681320 · sha256 `920d06cc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-b60bqfbx.js` offset 185681320.

**Undocumented**

### `CLAUDE_CODE_DD_ERROR_TRACKING_FLUSH_INTERVAL_MS`

Source: `chunk-gqxajafc.js` · offset 185178803 · sha256 `edc9c0e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-gqxajafc.js` offset 185178803.

**Undocumented**

### `CLAUDE_CODE_DEBUG_LOG_LEVEL`

Source: `chunk-q80zaav8.js` · offset 178103013 · sha256 `38902a64…`

Read as: string (trimmed; empty is treated as unset).

From docs: Minimum log level written to the debug log file.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_LOGS_DIR`

Source: `chunk-q80zaav8.js` · offset 178104145 · sha256 `55275582…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the debug log file path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_REPAINTS`

Source: `chunk-p50qybax.js` · offset 191860252 · sha256 `8e87d2bc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p50qybax.js` offset 191860252.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-p50qybax.js` · offset 191906413 · sha256 `a88756b2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p50qybax.js` offset 191906413.

**Undocumented**

### `CLAUDE_CODE_DESIGN_OAUTH_CLIENT_ID`

Source: `chunk-grs0b3f2.js` · offset 199169169 · sha256 `27ea3afb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-grs0b3f2.js` offset 199169169.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-0a47xg8f.js` · offset 178231200 · sha256 `d9749d38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0a47xg8f.js` offset 178231200.

**Undocumented**

### `CLAUDE_CODE_DIAGNOSTICS_FILE`

Source: `chunk-bvq78v2j.js` · offset 200902640 · sha256 `b7d882f2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-bvq78v2j.js` offset 200902640.

**Undocumented**

### `CLAUDE_CODE_DISABLE_1M_CONTEXT`

Source: `chunk-nankzm0s.js` · offset 180988708 · sha256 `22034a03…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable 1M context window support.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`

Source: `chunk-nankzm0s.js` · offset 180996265 · sha256 `d1bbe95e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable adaptive reasoning on Opus 4.6 and Sonnet 4.6 and fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADMIN_ENV_UNION`

Source: `chunk-hrhfcbdv.js` · offset 178849096 · sha256 `7409366c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from merging managed settings `env` blocks per key across admin sources, so only the highest-priority source's whole `env` block applies, as before v2.1.223.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADVISOR_TOOL`

Source: `chunk-09m4fzsj.js` · offset 184704581 · sha256 `31f9f385…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the advisor tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AGENT_VIEW`

Source: `chunk-b60bqfbx.js` · offset 185680602 · sha256 `94319e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off background agents and agent view: `claude agents`, `--bg`, `/background`, and the on-demand supervisor.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`

Source: `chunk-qravq5t1.js` · offset 185191344 · sha256 `52146969…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fullscreen rendering and use the classic main-screen renderer.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ATTACHMENTS`

Source: `chunk-09m4fzsj.js` · offset 185003831 · sha256 `2730825f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable attachment processing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AUTH_REFRESH_LOCK`

Source: `chunk-nankzm0s.js` · offset 181204733 · sha256 `77d224ae…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 181204733.

**Undocumented**

### `CLAUDE_CODE_DISABLE_AUTO_MEMORY`

Source: `chunk-nankzm0s.js` · offset 181126874 · sha256 `e9ae94aa…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable auto memory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AWAITING_USER_IDLE`

Source: `chunk-35ny7gy3.js` · offset 184037276 · sha256 `17da4fb8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-35ny7gy3.js` offset 184037276.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`

Source: `chunk-mgkghrc5.js` · offset 184038707 · sha256 `8e9ee151…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_EXIT_HANDOFF`

Source: `chunk-1rsf5e19.js` · offset 194129021 · sha256 `e35978cf…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop a background session's running background shell commands, dynamic workflows, and, as of v2.1.198, background subagents when the supervisor stops, restarts, or updates that session's process, instead of handing them to the session's next process.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-mphp7acd.js` · offset 189687237 · sha256 `c60d8030…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`

Source: `chunk-j5dkfwxp.js` · offset 179419801 · sha256 `53652e84…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the skills and workflows included with Claude Code: bundled skills and workflows are removed entirely, while built-in commands like `/init` stay typable but are hidden from the model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CFC_PROMPT`

Source: `chunk-09m4fzsj.js` · offset 184581197 · sha256 `6abbe374…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to keep the Claude in Chrome browser tools available while omitting the Chrome section of the system prompt and the `/claude-in-chrome` bundled skill.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_API_SKILL`

Source: `chunk-2fn6341y.js` · offset 194793565 · sha256 `e1894d50…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2fn6341y.js` offset 194793565.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_CODE_SKILL`

Source: `chunk-2fn6341y.js` · offset 194793708 · sha256 `caa69eea…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2fn6341y.js` offset 194793708.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-frqev2ay.js` · offset 183556948 · sha256 `a80ab294…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CRON`

Source: `chunk-tbjyszen.js` · offset 185441237 · sha256 `d2e34e85…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable scheduled tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DANGEROUS_RM_TIMEOUT`

Source: `chunk-mphp7acd.js` · offset 187327383 · sha256 `b0a7f033…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187327383.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-mphp7acd.js` · offset 187091836 · sha256 `47a42445…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPLORE_INHERIT_CAP`

Source: `chunk-mphp7acd.js` · offset 185968336 · sha256 `f82982b0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 185968336.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`

Source: `chunk-mphp7acd.js` · offset 185911535 · sha256 `25884f10…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the built-in Explore and Plan subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FAST_MODE`

Source: `chunk-nankzm0s.js` · offset 180872049 · sha256 `8b097ca8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fast mode

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`

Source: `chunk-f2cpzzp9.js` · offset 207594665 · sha256 `eceb5df5…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the "How is Claude doing?" session quality surveys.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`

Source: `chunk-4app56pf.js` · offset 215241787 · sha256 `1bb2cf49…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable file checkpointing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`

Source: `chunk-mphp7acd.js` · offset 186443405 · sha256 `af2da406…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to remove built-in commit and PR workflow instructions and the git status snapshot from Claude's context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-r7jk65a3.js` · offset 204039735 · sha256 `854713d6…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r7jk65a3.js` offset 204039735.

**Undocumented**

### `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`

Source: `chunk-nankzm0s.js` · offset 180984145 · sha256 `1434b3f7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent automatic remapping of Opus 4.0 and 4.1 to the current Opus version on the Anthropic API.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND`

Source: `chunk-x0bfz90y.js` · offset 185738192 · sha256 `997d0063…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-x0bfz90y.js` offset 185738192.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_BULK_INFLATE`

Source: `chunk-09m4fzsj.js` · offset 184411782 · sha256 `57a2e9bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184411782.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_MASS_DELETE_HOLD`

Source: `chunk-09m4fzsj.js` · offset 184374896 · sha256 `c98731a8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184374896.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_PERIODIC_RESYNC`

Source: `chunk-09m4fzsj.js` · offset 184434544 · sha256 `a88b554a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184434544.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_RO_UNSAVED_NOTICE`

Source: `chunk-09m4fzsj.js` · offset 184425686 · sha256 `b8e2136b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184425686.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_STREAM_LIST`

Source: `chunk-09m4fzsj.js` · offset 184402068 · sha256 `e80a215c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184402068.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MODEL_ACCESS_FALLBACK`

Source: `chunk-nankzm0s.js` · offset 180945119 · sha256 `4080303c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 180945119.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MOUSE`

Source: `chunk-qravq5t1.js` · offset 185194048 · sha256 `8824ecb6…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable mouse tracking in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MOUSE_CLICKS`

Source: `chunk-qravq5t1.js` · offset 185194136 · sha256 `5298f3d5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable click, drag, and hover handling in fullscreen rendering while keeping mouse-wheel scrolling.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NESTED_CHAIN_IDLE`

Source: `chunk-dndmrt2q.js` · offset 185686457 · sha256 `49b1d93e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dndmrt2q.js` offset 185686457.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NESTED_USER_REPAIR`

Source: `chunk-64z3xwk8.js` · offset 203985154 · sha256 `0a5b4502…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-64z3xwk8.js` offset 203985154.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

Source: `chunk-8xhw5h9f.js` · offset 190500050 · sha256 `b476ef4e…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to disable nonessential network traffic: auto-updates, telemetry, error reporting, the `/feedback` command, Claude-drafted feedback, release notes, the PR and MR status badge checks, and availability checks such as the fast mode check.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK`

Source: `chunk-mphp7acd.js` · offset 187917124 · sha256 `c72546fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the non-streaming fallback when a streaming request fails mid-stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK`

Source: `chunk-7qn997q6.js` · offset 210170373 · sha256 `4e0eb81d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the `PushNotification` tool's desktop notification even while you are typing in or focused on the terminal.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`

Source: `chunk-f2cpzzp9.js` · offset 208206572 · sha256 `effc4341…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic registration of the official plugin marketplace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ORG_MEMORY`

Source: `chunk-6xrs6gmd.js` · offset 182188531 · sha256 `a35b3841…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182188531.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS`

Source: `chunk-64z3xwk8.js` · offset 203957060 · sha256 `6e09c748…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from running your `Notification` hooks for unanswered permission requests in sessions where Claude Code sends them to the Agent SDK's `canUseTool` callback, which is how Claude Desktop and the VS Code extension host Claude Code.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-82ndkh08.js` · offset 205525461 · sha256 `bc51a94c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-82ndkh08.js` offset 205525461.

**Undocumented**

### `CLAUDE_CODE_DISABLE_POLICY_SKILLS`

Source: `chunk-mphp7acd.js` · offset 188508379 · sha256 `557b868b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip loading skills from the system-wide managed skills directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_POWERSHELL_CMD_RM_DENY`

Source: `chunk-98tn1pps.js` · offset 200323948 · sha256 `eb5d87df…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-98tn1pps.js` offset 200323948.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`

Source: `chunk-mphp7acd.js` · offset 190105221 · sha256 `f4d7781e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 190105221.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK`

Source: `chunk-09m4fzsj.js` · offset 184748470 · sha256 `b7e1638f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184748470.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_RETRY`

Source: `chunk-w8a1w7ad.js` · offset 193863903 · sha256 `22579745…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w8a1w7ad.js` offset 193863903.

**Undocumented**

### `CLAUDE_CODE_DISABLE_STARTUP_WORK_GATE`

Source: `chunk-dgp2yyqt.js` · offset 194933102 · sha256 `6db62d41…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 194933102.

**Undocumented**

### `CLAUDE_CODE_DISABLE_SUBSTITUTION_RM_PROMPT`

Source: `chunk-mphp7acd.js` · offset 188262348 · sha256 `f3c2c677…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 188262348.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`

Source: `chunk-9975a2ae.js` · offset 196157681 · sha256 `c9848df5…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic terminal title updates based on conversation context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_THINKING`

Source: `chunk-mphp7acd.js` · offset 187851975 · sha256 `25755513…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to omit the `thinking` parameter from API requests entirely.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-r7jk65a3.js` · offset 204049380 · sha256 `bab299da…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r7jk65a3.js` offset 204049380.

**Undocumented**

### `CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT`

Source: `chunk-mphp7acd.js` · offset 186784420 · sha256 `e2af1b0f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip proactive auto-compaction when Claude Code doesn't recognize the model ID, such as an LLM gateway alias.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`

Source: `chunk-1ypw9bby.js` · offset 206297058 · sha256 `778468f5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable virtual scrolling in fullscreen rendering and render every message in the transcript.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-mxgb9rkv.js` · offset 190362027 · sha256 `b123889b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mxgb9rkv.js` offset 190362027.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WEB_FETCH`

Source: `chunk-djhbc0y7.js` · offset 193524195 · sha256 `38c13913…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-djhbc0y7.js` offset 193524195.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WINDOWS_SHELL_LAUNCHER`

Source: `chunk-mphp7acd.js` · offset 186623581 · sha256 `d36766ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start PowerShell tool commands on Windows directly instead of through the `cmd.exe` launcher.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKFLOWS`

Source: `chunk-980njedm.js` · offset 181691542 · sha256 `6a39bb51…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable workflows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-xapeakym.js` · offset 204767252 · sha256 `e937cc38…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204767252.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-mphp7acd.js` · offset 186611420 · sha256 `6394fbc6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-mphp7acd.js` offset 186611420.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-qr1pdq5r.js` · offset 190229956 · sha256 `1f00549c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qr1pdq5r.js` offset 190229956.

**Undocumented**

### `CLAUDE_CODE_EAGER_FLUSH`

Source: `chunk-xapeakym.js` · offset 204665716 · sha256 `099e9537…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204665716.

**Undocumented**

### `CLAUDE_CODE_EDITOR_CODELIVERY`

Source: `chunk-xapeakym.js` · offset 204560495 · sha256 `7931744b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204560495.

**Undocumented**

### `CLAUDE_CODE_EFFORT_LEVEL`

Source: `chunk-5rsp1jx3.js` · offset 181702775 · sha256 `a1418c04…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set the effort level for supported models.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ELEGANT_MEADOW`

Source: `chunk-mphp7acd.js` · offset 185796271 · sha256 `4e9da92b…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 185796271.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-dndmrt2q.js` · offset 185687838 · sha256 `87d54f3a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dndmrt2q.js` offset 185687838.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-mphp7acd.js` · offset 187688606 · sha256 `0c59bb0a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187688606.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-w8a1w7ad.js` · offset 193883739 · sha256 `845bada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w8a1w7ad.js` offset 193883739.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-5ne43w2c.js` · offset 193274580 · sha256 `f57deca3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5ne43w2c.js` offset 193274580.

**Undocumented**

### `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`

Source: `chunk-hne3gr68.js` · offset 194053926 · sha256 `5fd6ac1f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Override session recap availability.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH`

Source: `chunk-xapeakym.js` · offset 204525492 · sha256 `73d4e338…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to refresh plugin state at turn boundaries in non-interactive mode after a background install completes.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_CFC`

Source: `chunk-09m4fzsj.js` · offset 184579705 · sha256 `e1810825…` · 9 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184579705.

**Undocumented**

### `CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL`

Source: `chunk-09m4fzsj.js` · offset 184704700 · sha256 `ef13d50a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184704700.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING`

Source: `chunk-mphp7acd.js` · offset 186744767 · sha256 `9635eb53…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether tool call inputs stream from the API as Claude generates them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_MENU_KIND_LANES`

Source: `chunk-f2cpzzp9.js` · offset 207176518 · sha256 `a005df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f2cpzzp9.js` offset 207176518.

**Undocumented**

### `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`

Source: `chunk-w8a1w7ad.js` · offset 193844866 · sha256 `abb8b4cc…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to turn off prompt suggestions, the grayed-out predictions that appear in your prompt input.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS`

Source: `chunk-djhbc0y7.js` · offset 193628084 · sha256 `47eef022…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-djhbc0y7.js` offset 193628084.

**Undocumented**

### `CLAUDE_CODE_ENABLE_REMOTE_RECAP`

Source: `chunk-hne3gr68.js` · offset 194054093 · sha256 `93e0e7e0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-hne3gr68.js` offset 194054093.

**Undocumented**

### `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`

Source: `chunk-mphp7acd.js` · offset 190141808 · sha256 `162e231d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 190141808.

**Undocumented**

### `CLAUDE_CODE_ENABLE_TASKS`

Source: `chunk-rgd7eyd0.js` · offset 185341748 · sha256 `789e280c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Selects which task-tracking tools Claude Code provides in sessions that have them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TODO_TOOLS`

Source: `chunk-mphp7acd.js` · offset 189050481 · sha256 `9e897733…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to get the task-tracking tools on every model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT`

Source: `chunk-mphp7acd.js` · offset 189162018 · sha256 `211e4580…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 189162018.

**Undocumented**

### `CLAUDE_CODE_ENABLE_XAA`

Source: `chunk-hrhfcbdv.js` · offset 178637405 · sha256 `a32876ef…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hrhfcbdv.js` offset 178637405.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-1b21she7.js` · offset 181829359 · sha256 `7c476da1…` · 79 read sites

Read as: string (trimmed; empty is treated as unset). Values: `remote_cowork`, `claude-in-teams`, `local_agent`, `cli`, `claude-desktop`, `local-agent`, `ssh-remote`, `sdk-ts`, `sdk-py`, `sdk-cli`, `bench`, `claude-desktop-3p`, `claude-vscode`, `remote`, `remote_baku`, `remote_desktop`, `remote_mobile`, `remote_projects`, `mcp`, `claude-code-github-action`, `claude_in_slack`, `claude-in-slack`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1b21she7.js` offset 181829359.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-2z1m9v0n.js` · offset 183490558 · sha256 `86b4d664…` · 30 read sites

Read as: string (trimmed; empty is treated as unset). Values: `byoc`, `bridge`.

Undocumented; read at `chunk-2z1m9v0n.js` offset 183490558.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-r7jk65a3.js` · offset 204050704 · sha256 `e1654a9a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r7jk65a3.js` offset 204050704.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-09916wnc.js` · offset 209562497 · sha256 `fa5f0a3f…` · 27 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09916wnc.js` offset 209562497.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-e2javxcw.js` · offset 215020096 · sha256 `ee624a73…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-e2javxcw.js` offset 215020096.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-1sb33067.js` · offset 210932416 · sha256 `3f1dcc43…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1sb33067.js` offset 210932416.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-xapeakym.js` · offset 204683191 · sha256 `72bb31e0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

Source: `chunk-zrq7rc23.js` · offset 185252516 · sha256 `25d9e31b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable agent teams.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_OBSERVER_AGENTS`

Source: `chunk-by5kes8x.js` · offset 193098345 · sha256 `6b66f048…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-by5kes8x.js` offset 193098345.

**Undocumented**

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-mphp7acd.js` · offset 187803301 · sha256 `c34fb80c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: JSON object to merge into the top level of every API request body.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_METADATA`

Source: `chunk-09m4fzsj.js` · offset 184901236 · sha256 `1e7f6a5b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184901236.

**Undocumented**

### `CLAUDE_CODE_FEDERATION_CACHE_DIR`

Source: `chunk-8ptzhr8g.js` · offset 180386063 · sha256 `c06c4761…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180386063.

**Undocumented**

### `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`

Source: `chunk-09grka97.js` · offset 181323375 · sha256 `1dca00c6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the default token limit for file reads.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-3xjx5251.js` · offset 185742315 · sha256 `19b816d5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

Undocumented; read at `chunk-3xjx5251.js` offset 185742315.

**Undocumented**

### `CLAUDE_CODE_FLEETVIEW_SIMPLE`

Source: `chunk-9975a2ae.js` · offset 196147613 · sha256 `fec9df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9975a2ae.js` offset 196147613.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-904yhcr0.js` · offset 193633516 · sha256 `85294805…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-904yhcr0.js` offset 193633516.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-f2cpzzp9.js` · offset 206838362 · sha256 `1a35ec20…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f2cpzzp9.js` offset 206838362.

**Undocumented**

### `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM`

Source: `chunk-mphp7acd.js` · offset 187743046 · sha256 `4374665e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187743046.

**Undocumented**

### `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE`

Source: `chunk-yzr5hfaq.js` · offset 180403496 · sha256 `fd59f454…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force transcript persistence, prompt history, and `claude agents` registration even when this `claude` was launched from inside another Claude Code session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_STRIKETHROUGH`

Source: `chunk-ms2jsjnm.js` · offset 191423143 · sha256 `a62ccdc5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force strikethrough rendering for `~~text~~` in Claude's responses when your terminal supports it but is not auto-detected, such as over SSH without `TERM_PROGRAM` forwarded.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_SYNC_OUTPUT`

Source: `chunk-ckcph1xh.js` · offset 191510376 · sha256 `c543d0ff…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable DEC private mode 2026 synchronized output when your terminal supports it but is not auto-detected.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_TERMINAL_IMAGES`

Source: `chunk-ckcph1xh.js` · offset 191508999 · sha256 `0a85c469…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ckcph1xh.js` offset 191508999.

**Undocumented**

### `CLAUDE_CODE_FORCE_WINDOWS_CREDMAN`

Source: `chunk-wgt53hn2.js` · offset 180473181 · sha256 `3f0763ed…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-wgt53hn2.js` offset 180473181.

**Undocumented**

### `CLAUDE_CODE_FORK_SUBAGENT`

Source: `chunk-mphp7acd.js` · offset 187172095 · sha256 `1a7edc8d…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls fork mode, which lets Claude spawn forked subagents itself and is on by default in interactive sessions only.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT`

Source: `chunk-dgp2yyqt.js` · offset 195023584 · sha256 `a50b2622…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to emit subagent text and thinking blocks in `claude -p --output-format stream-json` output, the same behavior as the `--forward-subagent-text` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_USER_INTENT`

Source: `chunk-nankzm0s.js` · offset 180747622 · sha256 `72bec8cd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 180747622.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_LOG`

Source: `chunk-f5w4pbxy.js` · offset 201281285 · sha256 `2e0a430f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f5w4pbxy.js` offset 201281285.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_SAMPLE_EVERY`

Source: `chunk-f5w4pbxy.js` · offset 201281338 · sha256 `8acc24f1…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `1`.

Undocumented; read at `chunk-f5w4pbxy.js` offset 201281338.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-2ejbgdvw.js` · offset 178894009 · sha256 `f6c95e4d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_HIDDEN`

Source: `chunk-mphp7acd.js` · offset 186684281 · sha256 `7fef3404…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to exclude dotfiles from results when Claude invokes the Glob tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_NO_IGNORE`

Source: `chunk-mphp7acd.js` · offset 186684228 · sha256 `f396df60…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to make the Glob tool respect `.gitignore` patterns.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-5vadtxaa.js` · offset 183307156 · sha256 `3c89eebb…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in seconds for Glob tool file discovery.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-w8a1w7ad.js` · offset 193834666 · sha256 `421e5a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 10080, digitsOnly true. Default (from code): `30`.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GORSE_PLOVER`

Source: `chunk-1b21she7.js` · offset 181768648 · sha256 `5946ea79…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181768648.

**Undocumented**

### `CLAUDE_CODE_GROWTHBOOK_KICK_FROM_INIT`

Source: `chunk-dgp2yyqt.js` · offset 195044736 · sha256 `e4e27859…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195044736.

**Undocumented**

### `CLAUDE_CODE_GZIP_CCR_REQUEST_BODIES`

Source: `chunk-s74nkhgm.js` · offset 183811245 · sha256 `8dc68f1f…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-s74nkhgm.js` offset 183811245.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODIES`

Source: `chunk-s74nkhgm.js` · offset 183811283 · sha256 `bc05e45c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-s74nkhgm.js` offset 183811283.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODY_BLOCKS`

Source: `chunk-09m4fzsj.js` · offset 184761878 · sha256 `6b269752…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 2, digitsOnly true.

Undocumented; read at `chunk-09m4fzsj.js` offset 184761878.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODY_LEVEL`

Source: `chunk-s74nkhgm.js` · offset 183811113 · sha256 `55a893ae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 9, digitsOnly true.

Undocumented; read at `chunk-s74nkhgm.js` offset 183811113.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE`

Source: `chunk-6jc3yf5g.js` · offset 185124813 · sha256 `df6ae3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6jc3yf5g.js` offset 185124813.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_CLOUD`

Source: `chunk-w0hep6xp.js` · offset 200765296 · sha256 `40c7c424…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w0hep6xp.js` offset 200765296.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_PACING_OFF`

Source: `chunk-b5mvcpdr.js` · offset 185142770 · sha256 `a6b5fd40…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-b5mvcpdr.js` offset 185142770.

**Undocumented**

### `CLAUDE_CODE_HIDE_CWD`

Source: `chunk-v6xcaj6r.js` · offset 195840661 · sha256 `ab916658…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the working directory in the startup logo.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-0a47xg8f.js` · offset 178233474 · sha256 `1e801477…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0a47xg8f.js` offset 178233474.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-r7jk65a3.js` · offset 204050236 · sha256 `65424d2e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r7jk65a3.js` offset 204050236.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-93nd79wx.js` · offset 214197682 · sha256 `7cba2278…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `300000`.

Undocumented; read at `chunk-93nd79wx.js` offset 214197682.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-93nd79wx.js` · offset 214197756 · sha256 `356fd56e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `60000`.

Undocumented; read at `chunk-93nd79wx.js` offset 214197756.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-mphp7acd.js` · offset 187474650 · sha256 `7c5f9747…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187474650.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_ENV_VAR`

Source: `chunk-2z1m9v0n.js` · offset 183490625 · sha256 `9866d220…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ANTHROPIC_AUTH_TOKEN`.

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2z1m9v0n.js` offset 183490625.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_REFRESH_TIMEOUT_MS`

Source: `chunk-xapeakym.js` · offset 204769479 · sha256 `e2898b0c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-xapeakym.js` offset 204769479.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-09m4fzsj.js` · offset 184505517 · sha256 `c51d4504…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184505517.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-mbfze585.js` · offset 178176256 · sha256 `1727d409…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `darwin`.

Undocumented; read at `chunk-mbfze585.js` offset 178176256.

**Undocumented**

### `CLAUDE_CODE_HOST_PROMPT_SUPERSEDES_RECORD`

Source: `chunk-8ptzhr8g.js` · offset 180396563 · sha256 `593bfac5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396563.

**Undocumented**

### `CLAUDE_CODE_HOST_SCHEDULED_RUN`

Source: `chunk-0a47xg8f.js` · offset 178236060 · sha256 `b89666ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0a47xg8f.js` offset 178236060.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-nankzm0s.js` · offset 181064374 · sha256 `5970cab5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181064374.

**Undocumented**

### `CLAUDE_CODE_HOVER_REST`

Source: `chunk-727wt0xp.js` · offset 190740803 · sha256 `f2f700a5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-727wt0xp.js` offset 190740803.

**Undocumented**

### `CLAUDE_CODE_HUMBLE_HAMMOCK`

Source: `chunk-mphp7acd.js` · offset 186761011 · sha256 `7bac3d99…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186761011.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-mphp7acd.js` · offset 189065469 · sha256 `13c70d6f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the host address used to connect to the IDE extension.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`

Source: `chunk-mphp7acd.js` · offset 189064969 · sha256 `67709670…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip auto-installation of IDE extensions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`

Source: `chunk-mphp7acd.js` · offset 189058041 · sha256 `f07ea290…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip validation of IDE lockfile entries during connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-f2cpzzp9.js` · offset 206781208 · sha256 `c369462a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `75`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 206781208.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-f2cpzzp9.js` · offset 206781101 · sha256 `4cb11ebe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 206781101.

**Undocumented**

### `CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES`

Source: `chunk-dgp2yyqt.js` · offset 195023538 · sha256 `2ec5d90f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195023538.

**Undocumented**

### `CLAUDE_CODE_INLINE_TOOLS`

Source: `chunk-nankzm0s.js` · offset 180862738 · sha256 `6c18992e…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180862738.

**Undocumented**

### `CLAUDE_CODE_INTRO_FRAME`

Source: `chunk-mphp7acd.js` · offset 187187128 · sha256 `698839a2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187187128.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-1b21she7.js` · offset 181830406 · sha256 `0de12944…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181830406.

**Undocumented**

### `CLAUDE_CODE_JUNIPER_SUNDIAL`

Source: `chunk-mphp7acd.js` · offset 189107524 · sha256 `7f21b654…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

Undocumented; read at `chunk-mphp7acd.js` offset 189107524.

**Undocumented**

### `CLAUDE_CODE_KB_COHESION_FIXES`

Source: `chunk-7a44pk20.js` · offset 201095274 · sha256 `8ed256d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7a44pk20.js` offset 201095274.

**Undocumented**

### `CLAUDE_CODE_LANTERN_PRISM`

Source: `chunk-mzhck5rt.js` · offset 185724941 · sha256 `318044d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzhck5rt.js` offset 185724941.

**Undocumented**

### `CLAUDE_CODE_LARCH_CISTERN`

Source: `chunk-1b21she7.js` · offset 181768917 · sha256 `5502383a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181768917.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-mphp7acd.js` · offset 188875013 · sha256 `c3a383e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 188875013.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-wbwgaybe.js` · offset 193416768 · sha256 `0cb997e5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wbwgaybe.js` offset 193416768.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-gx44aetg.js` · offset 210527547 · sha256 `e2921932…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gx44aetg.js` offset 210527547.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-mphp7acd.js` · offset 187061556 · sha256 `482fa868…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `20`.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_CONTEXT_TOKENS`

Source: `chunk-dgp2yyqt.js` · offset 194978725 · sha256 `3237e39a…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the context window size Claude Code assumes for the active model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_EFFORT_REMINDER`

Source: `chunk-5rsp1jx3.js` · offset 181697942 · sha256 `cf1ec291…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-5rsp1jx3.js` offset 181697942.

**Undocumented**

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-mphp7acd.js` · offset 187312963 · sha256 `bc6c35a8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_OUTPUT_TOKENS`

Source: `chunk-nankzm0s.js` · offset 180991805 · sha256 `bf917afe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Set the maximum number of output tokens for most requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_RETRIES`

Source: `chunk-mphp7acd.js` · offset 187796017 · sha256 `7979c44b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the number of times to retry failed API requests (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-m2a25zx1.js` · offset 185473900 · sha256 `6fc57800…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`

Source: `chunk-5ne43w2c.js` · offset 193173061 · sha256 `984edcae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `10`.

From docs: Maximum number of read-only tools and subagents that can execute in parallel (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TURNS`

Source: `chunk-brnn4zwp.js` · offset 178046796 · sha256 `a023beee…`

Read as: string (trimmed; empty is treated as unset).

From docs: Cap the number of agentic turns when no explicit limit is passed.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-710jgjjk.js` · offset 185463693 · sha256 `c068574d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `200`.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-8ptzhr8g.js` · offset 180398502 · sha256 `f9e0beea…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-8ptzhr8g.js` · offset 180396449 · sha256 `ac766569…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396449.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-amg94xhm.js` · offset 213070085 · sha256 `92c1abd0…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-xapeakym.js` · offset 204505014 · sha256 `47172fe3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-xapeakym.js` offset 204505014.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-1nayt2j6.js` · offset 178970590 · sha256 `e5f05822…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1nayt2j6.js` offset 178970590.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS`

Source: `chunk-xapeakym.js` · offset 204505476 · sha256 `8e971ba2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204505476.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS_MS`

Source: `chunk-xapeakym.js` · offset 204505510 · sha256 `6b981cd9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-xapeakym.js` offset 204505510.

**Undocumented**

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-8ptzhr8g.js` · offset 180396403 · sha256 `63fb2b7c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-amg94xhm.js` · offset 212988754 · sha256 `cc6c8538…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Idle timeout in milliseconds for MCP tool calls.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_PUSH_DELETE_MODE`

Source: `chunk-09m4fzsj.js` · offset 184374582 · sha256 `d1dd7dc7…`

Read as: enum (compared against fixed values). Values: `corroborate`, `immediate`, `never`.

Undocumented; read at `chunk-09m4fzsj.js` offset 184374582.

**Undocumented**

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-5ne43w2c.js` · offset 193274755 · sha256 `024704bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5ne43w2c.js` offset 193274755.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-7ryepg60.js` · offset 214443498 · sha256 `c04052cf…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MODEL_CAPABILITIES`

Source: `chunk-wz6xag6e.js` · offset 179147708 · sha256 `a04a0c59…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wz6xag6e.js` offset 179147708.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG`

Source: `chunk-11kg23zt.js` · offset 194230223 · sha256 `dce6abf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-11kg23zt.js` offset 194230223.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG_URL`

Source: `chunk-cvjq66rn.js` · offset 193661035 · sha256 `0a1f4188…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cvjq66rn.js` offset 193661035.

**Undocumented**

### `CLAUDE_CODE_NANKEEN_KESTREL`

Source: `chunk-5vadtxaa.js` · offset 183293963 · sha256 `62f600b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5vadtxaa.js` offset 183293963.

**Undocumented**

### `CLAUDE_CODE_NATIVE_CURSOR`

Source: `chunk-p50qybax.js` · offset 191906872 · sha256 `9973481d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to show the terminal's own cursor at the input caret instead of a drawn block.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NEW_INIT`

Source: `chunk-mphp7acd.js` · offset 188544764 · sha256 `3988e65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to make `/init` run an interactive setup flow.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_FLICKER`

Source: `chunk-qravq5t1.js` · offset 185191313 · sha256 `ffde9f68…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to enable fullscreen rendering, a research preview that reduces flicker and keeps memory flat in long conversations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_MODEL_FALLBACK`

Source: `chunk-nankzm0s.js` · offset 180945081 · sha256 `9a948e34…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 180945081.

**Undocumented**

### `CLAUDE_CODE_NONBLOCKING_STDOUT`

Source: `chunk-p50qybax.js` · offset 191858970 · sha256 `7e045e30…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to write terminal output through a second non-blocking file descriptor, so a terminal that stops reading, such as a paused tmux control-mode pane or a stalled SSH connection, can't freeze Claude Code mid-session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NONSTREAMING_TIMEOUT_RETRIES`

Source: `chunk-mphp7acd.js` · offset 187782770 · sha256 `1698c2a3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-mphp7acd.js` offset 187782770.

**Undocumented**

### `CLAUDE_CODE_OAUTH_401_WAIT_MS`

Source: `chunk-nankzm0s.js` · offset 181268581 · sha256 `adf8c842…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-nankzm0s.js` offset 181268581.

**Undocumented**

### `CLAUDE_CODE_OAUTH_CLIENT_ID`

Source: `chunk-a5b8yq96.js` · offset 178161616 · sha256 `bd32389e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-a5b8yq96.js` offset 178161616.

**Undocumented**

### `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`

Source: `chunk-a6ty6v4s.js` · offset 202360376 · sha256 `546b7627…`

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth refresh token for Claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_SCOPES`

Source: `chunk-a6ty6v4s.js` · offset 202360432 · sha256 `f3d74416…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-8j1q755t.js` · offset 202120543 · sha256 `12619147…` · 41 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 24 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OAuth access token for claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-mphp7acd.js` · offset 188952334 · sha256 `e23b3439…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 188952334.

**Undocumented**

### `CLAUDE_CODE_ORGANIZATION_UUID`

Source: `chunk-mnp9k227.js` · offset 180503020 · sha256 `2ece2065…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mnp9k227.js` offset 180503020.

**Undocumented**

### `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`

Source: `chunk-2t7nhzwg.js` · offset 195936658 · sha256 `66dea6e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to let Claude Code run your package manager's upgrade command in the background when a new version is available.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-xapeakym.js` · offset 204623803 · sha256 `580b35b6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `2000`.

Undocumented; read at `chunk-xapeakym.js` offset 204623803.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-xapeakym.js` · offset 204624065 · sha256 `6cf05dad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204624065.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-xapeakym.js` · offset 204624015 · sha256 `2c52ce2b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204624015.

**Undocumented**

### `CLAUDE_CODE_PARSED_WILLOW`

Source: `chunk-mphp7acd.js` · offset 189811605 · sha256 `3f4b28da…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189811605.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-0pprbvtw.js` · offset 178905260 · sha256 `2c8ec14a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to enable Perforce-aware write protection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PEWTER_OWL`

Source: `chunk-9cag78h2.js` · offset 185566438 · sha256 `5eab3bfa…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9cag78h2.js` offset 185566438.

**Undocumented**

### `CLAUDE_CODE_PEWTER_OWL_TOOL`

Source: `chunk-9cag78h2.js` · offset 185566633 · sha256 `c8b4a783…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9cag78h2.js` offset 185566633.

**Undocumented**

### `CLAUDE_CODE_PLAN_MODE_REQUIRED`

Source: `chunk-yzr5hfaq.js` · offset 180404808 · sha256 `446af310…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yzr5hfaq.js` offset 180404808.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-mphp7acd.js` · offset 189778405 · sha256 `145ff368…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189778405.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-mphp7acd.js` · offset 189778615 · sha256 `c08f81b3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189778615.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-5e581hrd.js` · offset 181941433 · sha256 `77a1c90e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5e581hrd.js` offset 181941433.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_BINARY_ASSETS`

Source: `chunk-mphp7acd.js` · offset 189330452 · sha256 `c60f17b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 189330452.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-5fjw5n4x.js` · offset 181953426 · sha256 `59ec7dd9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the plugins root directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIR_WATCH`

Source: `chunk-09m4fzsj.js` · offset 184644259 · sha256 `08a1ca6e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184644259.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-2qkrgkcd.js` · offset 192182912 · sha256 `be0843c0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-mphp7acd.js` · offset 189219521 · sha256 `443f2a02…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`

Source: `chunk-mphp7acd.js` · offset 189224352 · sha256 `9144e4f9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the re-clone attempt and keep using the existing marketplace checkout when a marketplace refresh can't reach or authenticate to the remote.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`

Source: `chunk-fmv8bhm3.js` · offset 178986502 · sha256 `6ede7fcb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to clone GitHub `owner/repo` shorthand sources over HTTPS instead of SSH.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-5fjw5n4x.js` · offset 181953595 · sha256 `dd28fbd5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE`

Source: `chunk-mphp7acd.js` · offset 186031609 · sha256 `a6a39434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 186031609.

**Undocumented**

### `CLAUDE_CODE_POLISHED_DEWDROP`

Source: `chunk-mphp7acd.js` · offset 187739575 · sha256 `b3bc3546…`

Read as: enum (compared against fixed values). Values: `drop`, `block`, `off`.

Undocumented; read at `chunk-mphp7acd.js` offset 187739575.

**Undocumented**

### `CLAUDE_CODE_POLL_EVENTS`

Source: `chunk-t2h010j6.js` · offset 183995798 · sha256 `481b54c4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t2h010j6.js` offset 183995798.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-nankzm0s.js` · offset 181123609 · sha256 `9cf5c70a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 181123609.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-nankzm0s.js` · offset 181123749 · sha256 `d68b016f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181123749.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-nankzm0s.js` · offset 181123824 · sha256 `fc4fcde6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 181123824.

**Undocumented**

### `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`

Source: `chunk-mphp7acd.js` · offset 186345656 · sha256 `605a0977…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-f5w4pbxy.js` · offset 201272031 · sha256 `55266f2b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `banner`, `step`.

Undocumented; read at `chunk-f5w4pbxy.js` offset 201272031.

**Undocumented**

### `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`

Source: `chunk-xapeakym.js` · offset 204468534 · sha256 `d5315498…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Ceiling in milliseconds on idle waiting for background subagents and workflows after the final turn in non-interactive mode with the `-p` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROACTIVE`

Source: `chunk-f2cpzzp9.js` · offset 208298568 · sha256 `b4a14159…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f2cpzzp9.js` offset 208298568.

**Undocumented**

### `CLAUDE_CODE_PROCESS_WRAPPER`

Source: `chunk-jt6dkanj.js` · offset 183481547 · sha256 `761cc09b…`

Read as: string (raw value; further parsing not traced).

From docs: Launch the processes Claude Code starts from its own binary, such as the background service that hosts agent view sessions, through a corporate launcher given as an argv prefix like `/opt/corp/launcher`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROFILE_STARTUP`

Source: `chunk-5m30we7w.js` · offset 179117250 · sha256 `48090143…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5m30we7w.js` offset 179117250.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-brnn4zwp.js` · offset 178046181 · sha256 `46ee95ac…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROJECTS_SESSION`

Source: `chunk-6xrs6gmd.js` · offset 182372753 · sha256 `109b7ab5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182372753.

**Undocumented**

### `CLAUDE_CODE_PROPAGATE_TRACEPARENT`

Source: `chunk-mphp7acd.js` · offset 187810024 · sha256 `9c27f60b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`

Source: `chunk-2z1m9v0n.js` · offset 183490499 · sha256 `55abb6ea…` · 25 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set by host platforms that embed Claude Code and manage model provider routing on its behalf.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-mphp7acd.js` · offset 186323077 · sha256 `941d165a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186323077.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-8ptzhr8g.js` · offset 180396079 · sha256 `431f146e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396079.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-8ptzhr8g.js` · offset 180396112 · sha256 `b41183a0…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396112.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-q1842b1c.js` · offset 195267300 · sha256 `b0ac376e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-q1842b1c.js` offset 195267300.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-8ptzhr8g.js` · offset 180395705 · sha256 `ecac5ea0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180395705.

**Undocumented**

### `CLAUDE_CODE_REFUSAL_FALLBACK_CATCH_ALL`

Source: `chunk-09m4fzsj.js` · offset 184747110 · sha256 `864b4300…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184747110.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_HOME_TRUST`

Source: `chunk-zvxr1qd8.js` · offset 192043138 · sha256 `e23e7482…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zvxr1qd8.js` offset 192043138.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-j3y05f4x.js` · offset 192044203 · sha256 `d2231367…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j3y05f4x.js` offset 192044203.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-3svn1vf6.js` · offset 194194243 · sha256 `9bf28f96…` · 181 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-nankzm0s.js` · offset 181083234 · sha256 `36b0bea4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `self_hosted`.

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181083234.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-vhpv944z.js` · offset 183486103 · sha256 `3d74f7c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-vhpv944z.js` offset 183486103.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-6xrs6gmd.js` · offset 182322759 · sha256 `e165e4bd…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182322759.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-35ny7gy3.js` · offset 184034999 · sha256 `26e703b9…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-35ny7gy3.js` offset 184034999.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-09m4fzsj.js` · offset 184771302 · sha256 `66c81362…` · 54 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 16 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set automatically in cloud sessions to the current session's ID.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-mnp9k227.js` · offset 180493880 · sha256 `bb0ef760…`

Read as: string (trimmed; empty is treated as unset). Values: `review`.

Undocumented; read at `chunk-mnp9k227.js` offset 180493880.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_FORWARD`

Source: `chunk-29dtdp8q.js` · offset 181730032 · sha256 `403d6cb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-29dtdp8q.js` offset 181730032.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_PIN_STORED_LOGIN`

Source: `chunk-f1vb7bx7.js` · offset 179167528 · sha256 `4a5b8e49…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f1vb7bx7.js` offset 179167528.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-2xynv749.js` · offset 214006752 · sha256 `ed0db984…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2xynv749.js` offset 214006752.

**Undocumented**

### `CLAUDE_CODE_REPORT_FINDINGS`

Source: `chunk-2fn6341y.js` · offset 194642959 · sha256 `83bab3f4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2fn6341y.js` offset 194642959.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-brnn4zwp.js` · offset 178047322 · sha256 `34ebe303…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESULT_NONCE`

Source: `chunk-5ka0mc07.js` · offset 205665803 · sha256 `ce70514c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5ka0mc07.js` offset 205665803.

**Undocumented**

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-xapeakym.js` · offset 204967256 · sha256 `8de15ab6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204967256.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-8tppeqgy.js` · offset 193719191 · sha256 `51a22bee…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-mphp7acd.js` · offset 188679858 · sha256 `368abfd7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-mphp7acd.js` · offset 188679477 · sha256 `6d26b33b…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `Continue from where you left off.`.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-mphp7acd.js` · offset 188679579 · sha256 `86742cd5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 188679579.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-9hy804jg.js` · offset 208613728 · sha256 `18c89164…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9hy804jg.js` offset 208613728.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-f2cpzzp9.js` · offset 206980923 · sha256 `560978fe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `70`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 206980923.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-f2cpzzp9.js` · offset 206980968 · sha256 `4856fb83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 206980968.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-mphp7acd.js` · offset 188682073 · sha256 `07bb30dc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 188682073.

**Undocumented**

### `CLAUDE_CODE_RETRY_WATCHDOG`

Source: `chunk-mphp7acd.js` · offset 187777273 · sha256 `cfbe7798…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` for unattended sessions such as eval harnesses, CI jobs, or remote workers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RUSTLING_PIXEL`

Source: `chunk-mphp7acd.js` · offset 187742361 · sha256 `bd7707c3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187742361.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-brnn4zwp.js` · offset 178047245 · sha256 `470f14bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-6xrs6gmd.js` · offset 182246702 · sha256 `1891ad2e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182246702.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-8ptzhr8g.js` · offset 180392556 · sha256 `271d8941…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-bysrnexw.js` · offset 216014365 · sha256 `7ff1728b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH`

Source: `chunk-xapeakym.js` · offset 204769422 · sha256 `44e72a15…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204769422.

**Undocumented**

### `CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH`

Source: `chunk-8ptzhr8g.js` · offset 180396160 · sha256 `3d742d83…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396160.

**Undocumented**

### `CLAUDE_CODE_SDK_READS_SESSION_STATE`

Source: `chunk-8ptzhr8g.js` · offset 180396199 · sha256 `4fad3b24…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396199.

**Undocumented**

### `CLAUDE_CODE_SEND_FEEDBACK`

Source: `chunk-099w45zp.js` · offset 193467261 · sha256 `95ea5704…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off Claude-drafted feedback for a session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-8xhw5h9f.js` · offset 190528567 · sha256 `ba44bc9b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-0a47xg8f.js` · offset 178235805 · sha256 `5f1f30e9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-0a47xg8f.js` offset 178235805.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-758hjhx1.js` · offset 180369258 · sha256 `3b2d1fe0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-ky674g9x.js` · offset 177839437 · sha256 `ca22b404…` · 43 read sites

Read as: string (trimmed; empty is treated as unset). Values: `bg`.

Undocumented; read at `chunk-ky674g9x.js` offset 177839437.

**Undocumented**

### `CLAUDE_CODE_SESSION_LOG`

Source: `chunk-nankzm0s.js` · offset 181061956 · sha256 `0a5415fc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181061956.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-nankzm0s.js` · offset 181060683 · sha256 `25e3352a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181060683.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-0a47xg8f.js` · offset 178232599 · sha256 `89e071e5…` · 3 read sites

Read as: enum (compared against fixed values). Values: `claude_ai_chat`.

Undocumented; read at `chunk-0a47xg8f.js` offset 178232599.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-xapeakym.js` · offset 204655675 · sha256 `bea79228…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xapeakym.js` offset 204655675.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-mphp7acd.js` · offset 187995503 · sha256 `adf97071…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `1500`.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-mphp7acd.js` · offset 189763438 · sha256 `31413206…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the shell Claude Code uses to run Bash tool commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-amg94xhm.js` · offset 213019293 · sha256 `2d9e653f…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SILENT_TURN_REMINDER`

Source: `chunk-mphp7acd.js` · offset 189099147 · sha256 `4d7a230e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189099147.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT`

Source: `chunk-mphp7acd.js` · offset 189098933 · sha256 `bfa469d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189098933.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TURNS`

Source: `chunk-mphp7acd.js` · offset 189099297 · sha256 `3bfef62d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mphp7acd.js` offset 189099297.

**Undocumented**

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-brnn4zwp.js` · offset 178047176 · sha256 `e7139545…` · 17 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-1b21she7.js` · offset 181769939 · sha256 `cf484739…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-8ptzhr8g.js` · offset 180396035 · sha256 `ae0e1afb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180396035.

**Undocumented**

### `CLAUDE_CODE_SKILL_PROPOSALS`

Source: `chunk-mphp7acd.js` · offset 186455560 · sha256 `0b60af6f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 186455560.

**Undocumented**

### `CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS`

Source: `chunk-nankzm0s.js` · offset 180873809 · sha256 `9bd83e99…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to treat a failed fast mode availability check as available, for networks that block the check's direct request to `api.anthropic.com`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK`

Source: `chunk-nankzm0s.js` · offset 180872136 · sha256 `51819982…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the client-side fast mode availability check, for proxies that intercept the check's request rather than refuse it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MODEL_ACCESS_MEMORY`

Source: `chunk-azf8jmbk.js` · offset 195428171 · sha256 `63bfb7b9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-azf8jmbk.js` offset 195428171.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS`

Source: `chunk-mphp7acd.js` · offset 186205596 · sha256 `322d3de0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 186205596.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS_EXCEPT`

Source: `chunk-mphp7acd.js` · offset 186205306 · sha256 `ac1ed8d9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186205306.

**Undocumented**

### `CLAUDE_CODE_SKIP_PROMPT_HISTORY`

Source: `chunk-09m4fzsj.js` · offset 184697366 · sha256 `dfa39084…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip writing prompt history and session transcripts to disk.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS`

Source: `chunk-q80zaav8.js` · offset 178112845 · sha256 `2d40a3a5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-q80zaav8.js` offset 178112845.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-5m30we7w.js` · offset 179116782 · sha256 `484bfa9f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-5m30we7w.js` offset 179116782.

**Undocumented**

### `CLAUDE_CODE_SQUISHY_NEWT`

Source: `chunk-mphp7acd.js` · offset 189811685 · sha256 `593678e1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189811685.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-mphp7acd.js` · offset 189054190 · sha256 `3c3064ab…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189054190.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-qr1pdq5r.js` · offset 190229880 · sha256 `d1de753e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qr1pdq5r.js` offset 190229880.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-y0dbfrgj.js` · offset 185123385 · sha256 `829fede0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STELLAR_DRIFT`

Source: `chunk-mphp7acd.js` · offset 186753527 · sha256 `fd80c4e2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186753527.

**Undocumented**

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-w8a1w7ad.js` · offset 193957046 · sha256 `679999c7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `8`.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL`

Source: `chunk-5ne43w2c.js` · offset 193217392 · sha256 `a4e439aa…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: The default model for subagents, agent team teammates, and workflow agents that aren't assigned a model another way.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`

Source: `chunk-5ne43w2c.js` · offset 193219164 · sha256 `1f181030…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force one model onto subagents, teammates, and workflow agents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-8ptzhr8g.js` · offset 180391200 · sha256 `32d88409…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-8ptzhr8g.js` · offset 180395653 · sha256 `3bac6f02…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180395653.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-brnn4zwp.js` · offset 178047567 · sha256 `ca2a97fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-brnn4zwp.js` offset 178047567.

**Undocumented**

### `CLAUDE_CODE_SUPPRESS_SESSION_ATTRIBUTION`

Source: `chunk-mphp7acd.js` · offset 186711144 · sha256 `5d00e83b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 186711144.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`

Source: `chunk-1sb33067.js` · offset 210924000 · sha256 `65428678…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode (the `-p` flag) to wait for plugin installation to complete before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-xapeakym.js` · offset 204825750 · sha256 `289123bc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in milliseconds for synchronous plugin installation.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS`

Source: `chunk-fwf64yxz.js` · offset 183765628 · sha256 `0d015816…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-fwf64yxz.js` offset 183765628.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-fwf64yxz.js` · offset 183802041 · sha256 `9f9c61c9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-fwf64yxz.js` offset 183802041.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-fwf64yxz.js` · offset 183800178 · sha256 `7bb68b87…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `60000`.

Undocumented; read at `chunk-fwf64yxz.js` offset 183800178.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-mphp7acd.js` · offset 186051211 · sha256 `52621edc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-mphp7acd.js` offset 186051211.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-mphp7acd.js` · offset 186051286 · sha256 `ee1187e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `10000`.

Undocumented; read at `chunk-mphp7acd.js` offset 186051286.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-mphp7acd.js` · offset 186048490 · sha256 `10976ffa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 86400000.

Undocumented; read at `chunk-mphp7acd.js` offset 186048490.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-fwf64yxz.js` · offset 183765656 · sha256 `ffd902d2…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-fwf64yxz.js` offset 183765656.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS`

Source: `chunk-105zfxe3.js` · offset 194884824 · sha256 `86fc5960…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode with the `-p` flag to make Claude Code download the skills enabled for your claude.ai account in that run and wait for the list of them, up to `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`, before it runs the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-105zfxe3.js` · offset 194873398 · sha256 `6b53f454…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-105zfxe3.js` · offset 194873314 · sha256 `de00dd5e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-782963cg.js` · offset 213519982 · sha256 `ef3cce71…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `false` to disable syntax highlighting in diff output.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-xapeakym.js` · offset 204815614 · sha256 `5ca80899…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204815614.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-nankzm0s.js` · offset 181083582 · sha256 `aa86fbdc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181083582.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-f2cpzzp9.js` · offset 206789417 · sha256 `8ea2a4a3…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Share a task list across sessions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-xapeakym.js` · offset 204759881 · sha256 `701641f9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1000, max 60000. Default (from code): `10000`.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEE_SDK_STDOUT`

Source: `chunk-r7jk65a3.js` · offset 204031360 · sha256 `3b7d3d72…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r7jk65a3.js` offset 204031360.

**Undocumented**

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-9hy804jg.js` · offset 208597926 · sha256 `eb007c40…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9hy804jg.js` offset 208597926.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-wrxh9xyj.js` · offset 180514959 · sha256 `32d7e817…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wrxh9xyj.js` offset 180514959.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-mphp7acd.js` · offset 186502532 · sha256 `e061786e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186502532.

**Undocumented**

### `CLAUDE_CODE_THINKING_DISPLAY_UPDATES`

Source: `chunk-mphp7acd.js` · offset 187684603 · sha256 `6c6cabb4…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187684603.

**Undocumented**

### `CLAUDE_CODE_THISTLE_GREBE`

Source: `chunk-nankzm0s.js` · offset 180730378 · sha256 `da23ea8a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180730378.

**Undocumented**

### `CLAUDE_CODE_THRIFTY_SONIC`

Source: `chunk-1b21she7.js` · offset 181768065 · sha256 `ea9dc2ed…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1b21she7.js` offset 181768065.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-7qgnq1jf.js` · offset 182448001 · sha256 `299a7e96…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the temp directory used for internal temp files.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-1ypw9bby.js` · offset 206228517 · sha256 `f3917ec9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1ypw9bby.js` offset 206228517.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-1ypw9bby.js` · offset 206228478 · sha256 `d3dc1e92…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1ypw9bby.js` offset 206228478.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-1sb33067.js` · offset 210932273 · sha256 `c0a56997…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1sb33067.js` offset 210932273.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-2q133q3v.js` · offset 180435149 · sha256 `1caa1ae1…`

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TODO_REMINDER_MODE`

Source: `chunk-mphp7acd.js` · offset 189107167 · sha256 `5abe0e33…`

Read as: enum (compared against fixed values). Values: `baseline`, `off`.

Undocumented; read at `chunk-mphp7acd.js` offset 189107167.

**Undocumented**

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-1nayt2j6.js` · offset 178970298 · sha256 `5b70bef7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-1nayt2j6.js` · offset 178968549 · sha256 `1f539dfd…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`

Source: `chunk-mphp7acd.js` · offset 187167325 · sha256 `ffe6d7ce…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187167325.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_AFTER_USER_TURN`

Source: `chunk-mphp7acd.js` · offset 187168152 · sha256 `ddd4b616…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187168152.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`

Source: `chunk-mphp7acd.js` · offset 187167717 · sha256 `606df25d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187167717.

**Undocumented**

### `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`

Source: `chunk-dgp2yyqt.js` · offset 194966988 · sha256 `3ecaf12b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dgp2yyqt.js` offset 194966988.

**Undocumented**

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-1sb33067.js` · offset 210932194 · sha256 `e89ecb6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1sb33067.js` offset 210932194.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-1ypw9bby.js` · offset 206191102 · sha256 `4aa0a028…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`, `default`.

Undocumented; read at `chunk-1ypw9bby.js` offset 206191102.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-qravq5t1.js` · offset 185190507 · sha256 `f52b2d89…`

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`.

Undocumented; read at `chunk-qravq5t1.js` offset 185190507.

**Undocumented**

### `CLAUDE_CODE_TURN_UPDATES`

Source: `chunk-mphp7acd.js` · offset 187175435 · sha256 `924dab76…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187175435.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-1mj5vjep.js` · offset 198884545 · sha256 `d80da839…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1mj5vjep.js` offset 198884545.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-arcwjf3z.js` · offset 194527610 · sha256 `4abb04e7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-arcwjf3z.js` offset 194527610.

**Undocumented**

### `CLAUDE_CODE_USE_COWORK_PLUGINS`

Source: `chunk-5fjw5n4x.js` · offset 181953341 · sha256 `225ab54c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5fjw5n4x.js` offset 181953341.

**Undocumented**

### `CLAUDE_CODE_USE_POWERSHELL_TOOL`

Source: `chunk-2a2022xc.js` · offset 211000855 · sha256 `0bf9df8a…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls the PowerShell tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-09m4fzsj.js` · offset 184743259 · sha256 `46d08d18…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_EMAIL`

Source: `chunk-nankzm0s.js` · offset 181312635 · sha256 `2347c88b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181312635.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-vnsj0eyq.js` · offset 211819212 · sha256 `b4c3c91f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-vnsj0eyq.js` offset 211819212.

**Undocumented**

### `CLAUDE_CODE_WEB_FETCH_AGENT`

Source: `chunk-mphp7acd.js` · offset 187152892 · sha256 `cbf3526c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187152892.

**Undocumented**

### `CLAUDE_CODE_WEB_SEARCH_FAST_ARG`

Source: `chunk-a6fqs976.js` · offset 182161369 · sha256 `3c325b89…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-a6fqs976.js` offset 182161369.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS`

Source: `chunk-1b21she7.js` · offset 181866931 · sha256 `8d500e83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `900000`.

From docs: Set to the number of milliseconds WebFetch keeps each fetched URL's response cached.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBFETCH_DEADLINE_MS`

Source: `chunk-mphp7acd.js` · offset 187121454 · sha256 `79263864…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

From docs: Upper bound in milliseconds on how long WebFetch waits for a page to download, including any redirects it follows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR`

Source: `chunk-85cakz9j.js` · offset 192203508 · sha256 `3df5ab6a…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-85cakz9j.js` offset 192203508.

**Undocumented**

### `CLAUDE_CODE_WHIMSICAL_ELEPHANT`

Source: `chunk-nankzm0s.js` · offset 180745397 · sha256 `ae4e690c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180745397.

**Undocumented**

### `CLAUDE_CODE_WILLOW_TERN`

Source: `chunk-1b21she7.js` · offset 181769220 · sha256 `4be21696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1b21she7.js` offset 181769220.

**Undocumented**

### `CLAUDE_CODE_WISE_COMET`

Source: `chunk-mphp7acd.js` · offset 186780549 · sha256 `05978c0d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-mphp7acd.js` offset 186780549.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-mphp7acd.js` · offset 189644665 · sha256 `9723da95…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 189644665.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-xapeakym.js` · offset 204865945 · sha256 `325e02bb…` · 13 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-xapeakym.js` offset 204865945.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`

Source: `chunk-jxy1fa30.js` · offset 198452562 · sha256 `74e013c4…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 256, digitsOnly true.

From docs: How many agents a single workflow run executes at once, from `1` to `256`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS`

Source: `chunk-f2cpzzp9.js` · offset 207078556 · sha256 `27d03ba3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-f2cpzzp9.js` offset 207078556.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_TOKENS`

Source: `chunk-f2cpzzp9.js` · offset 207078636 · sha256 `cb3ff7f8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-f2cpzzp9.js` offset 207078636.

**Undocumented**

### `CLAUDE_CODE_WORKFLOWS`

Source: `chunk-980njedm.js` · offset 181692529 · sha256 `9f543338…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-980njedm.js` offset 181692529.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-qyc5w2q1.js` · offset 183531547 · sha256 `30722e3d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qyc5w2q1.js` offset 183531547.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-8ptzhr8g.js` · offset 180392249 · sha256 `8c4b69f4…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the configuration directory (default: `~/.claude`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-6xrs6gmd.js` · offset 182325798 · sha256 `4ad6dc1e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182325798.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-6xrs6gmd.js` · offset 182249847 · sha256 `3ca2d6e8…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182249847.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-mphp7acd.js` · offset 186423614 · sha256 `d01657be…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: ``.

Undocumented; read at `chunk-mphp7acd.js` offset 186423614.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-nankzm0s.js` · offset 181127122 · sha256 `7bd86655…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181127122.

**Undocumented**

### `CLAUDE_DEBUG`

Source: `chunk-q1842b1c.js` · offset 195265870 · sha256 `96be69e5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q1842b1c.js` offset 195265870.

**Undocumented**

### `CLAUDE_DISABLE_ADOPT`

Source: `chunk-f10wcx31.js` · offset 194080978 · sha256 `d04f1eb4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop in-flight background work instead of carrying it over when you background a session by pressing `←` or with `/background`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG`

Source: `chunk-09m4fzsj.js` · offset 184786870 · sha256 `1824e7c2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to force-enable the byte-level streaming idle watchdog, or set to `0` to force-disable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_STREAM_WATCHDOG`

Source: `chunk-5ne43w2c.js` · offset 193255046 · sha256 `806c8256…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to force-disable the event-level streaming idle watchdog, or set to `1` to force-enable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-mphp7acd.js` · offset 186315257 · sha256 `2b00ca24…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-f2cpzzp9.js` · offset 207594777 · sha256 `7b164eac…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f2cpzzp9.js` offset 207594777.

**Undocumented**

### `CLAUDE_IMPORT_CONVERSATIONS`

Source: `chunk-0j3tbvt6.js` · offset 202327868 · sha256 `1f18d8e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0j3tbvt6.js` offset 202327868.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-h595p29c.js` · offset 210946921 · sha256 `9739119e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-h595p29c.js` offset 210946921.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-nankzm0s.js` · offset 181111427 · sha256 `12927d55…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181111427.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-6xrs6gmd.js` · offset 182393391 · sha256 `153cf60a…` · 33 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_LOCAL_OAUTH_API_BASE`

Source: `chunk-a5b8yq96.js` · offset 178159658 · sha256 `25070d02…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-a5b8yq96.js` offset 178159658.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_APPS_BASE`

Source: `chunk-a5b8yq96.js` · offset 178159744 · sha256 `92a2b48d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-a5b8yq96.js` offset 178159744.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_CONSOLE_BASE`

Source: `chunk-a5b8yq96.js` · offset 178159831 · sha256 `dd40e55a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-a5b8yq96.js` offset 178159831.

**Undocumented**

### `CLAUDE_MEMORY_STORES`

Source: `chunk-6xrs6gmd.js` · offset 182188631 · sha256 `69001abe…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-6xrs6gmd.js` offset 182188631.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-y1t8adhj.js` · offset 200730493 · sha256 `fac36c80…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-y1t8adhj.js` offset 200730493.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-aa430wh3.js` · offset 196244586 · sha256 `104db100…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-aa430wh3.js` offset 196244586.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-aa430wh3.js` · offset 196241119 · sha256 `da907461…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-aa430wh3.js` offset 196241119.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-aa430wh3.js` · offset 196244817 · sha256 `58aef346…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-aa430wh3.js` offset 196244817.

**Undocumented**

### `CLAUDE_PTY_RECORD`

Source: `chunk-aa430wh3.js` · offset 196241686 · sha256 `7b0a5f6f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aa430wh3.js` offset 196241686.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-dgp2yyqt.js` · offset 194965401 · sha256 `77664f78…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dgp2yyqt.js` offset 194965401.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-9ezdz1gg.js` · offset 185593536 · sha256 `2067b8e5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-bv1f34vz.js` · offset 198524591 · sha256 `679ff90d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-bv1f34vz.js` offset 198524591.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-bv1f34vz.js` · offset 198524299 · sha256 `f5aa6e96…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-bv1f34vz.js` offset 198524299.

**Undocumented**

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-r7jk65a3.js` · offset 204031406 · sha256 `4d11426e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 3.

Undocumented; read at `chunk-r7jk65a3.js` offset 204031406.

**Undocumented**

### `CLAUDE_RUNNER_API_BASE_URL`

Source: `chunk-b8x67cyv.js` · offset 181580016 · sha256 `bed6faf5…`

Read as: string (raw value; further parsing not traced).

From docs: Anthropic API base URL for session-scoped calls

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_DISABLE_AWAITING_ACTION_OVERRIDE`

Source: `chunk-8xhw5h9f.js` · offset 190508828 · sha256 `ea910ff4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190508828.

**Undocumented**

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-sk0av50v.js` · offset 190331470 · sha256 `9d2ceeca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Git fetch depth for fresh clones.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-b8x67cyv.js` · offset 181579859 · sha256 `b7ce016c…`

Read as: string (raw value; further parsing not traced).

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SKIP_GIT_VERIFY`

Source: `chunk-bv2dmc76.js` · offset 190282520 · sha256 `21df957f…`

Read as: enum (compared against fixed values). Values: `1`.

From docs: When `1`, skip the `.git` presence check after a `checkout` hook runs.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-fge68w3a.js` · offset 180460217 · sha256 `d7b49142…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-fge68w3a.js` offset 180460217.

**Undocumented**

### `CLAUDE_SESSION_INGRESS_TOKEN_FILE`

Source: `chunk-mnp9k227.js` · offset 180502309 · sha256 `5fa5ddd7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Absolute path to a per-session file holding the current session JWT, kept fresh across token refreshes.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SLOW_FIRST_BYTE_MS`

Source: `chunk-mphp7acd.js` · offset 187887816 · sha256 `cc4e40d3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mphp7acd.js` offset 187887816.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-09m4fzsj.js` · offset 184356157 · sha256 `37979d75…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184356157.

**Undocumented**

### `CLAUDE_STREAM_FIRST_BYTE_TIMEOUT_MS`

Source: `chunk-09m4fzsj.js` · offset 184782296 · sha256 `74df571c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Deadline in milliseconds for the first response byte of a streaming request, on the connections where the first-byte deadline runs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-09m4fzsj.js` · offset 184781808 · sha256 `590260fd…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds before the event- and byte-level streaming idle watchdogs close a stalled connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_TMPDIR`

Source: `chunk-7qgnq1jf.js` · offset 182448033 · sha256 `3b749fcd…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7qgnq1jf.js` offset 182448033.

**Undocumented**

### `CLAUDE_TRUSTED_DEVICE_TOKEN`

Source: `chunk-s5hxszmb.js` · offset 184082500 · sha256 `e362b7c4…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-s5hxszmb.js` offset 184082500.

**Undocumented**

### `CLAUDE_WORKFLOW_NAME_ONLY`

Source: `chunk-57ewcm63.js` · offset 198403936 · sha256 `b910c419…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-57ewcm63.js` offset 198403936.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-09m4fzsj.js` · offset 184517289 · sha256 `a9cd3cb6…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Documented: https://code.claude.com/docs/en/env-vars

### `CLIPBOARD_NAPI_NODE_PATH`

Source: `chunk-1y575bx8.js` · offset 185202737 · sha256 `08bacc2c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-1y575bx8.js` offset 185202737.

**Undocumented**

### `COMPUTERNAME`

Source: `chunk-2mfrvb6c.js` · offset 196410178 · sha256 `79054786…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2mfrvb6c.js` offset 196410178.

**Undocumented**

### `CONTAINER_SANDBOX_MOUNT_POINT`

Source: `chunk-nankzm0s.js` · offset 181058300 · sha256 `9f0f77c0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181058300.

**Undocumented**

### `DEBUG_CLAUDE_AGENT_SDK`

Source: `chunk-j0381q8k.js` · offset 201593495 · sha256 `54b512f4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j0381q8k.js` offset 201593495.

**Undocumented**

### `DEBUG_SDK`

Source: `chunk-q80zaav8.js` · offset 178103476 · sha256 `4c7983f1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q80zaav8.js` offset 178103476.

**Undocumented**

### `DEMO_VERSION`

Source: `chunk-1ypw9bby.js` · offset 206198444 · sha256 `aa2ade84…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1ypw9bby.js` offset 206198444.

**Undocumented**

### `DISABLE_AUTO_COMPACT`

Source: `chunk-mphp7acd.js` · offset 186779883 · sha256 `958ef69a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic compaction when approaching the context limit.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-nankzm0s.js` · offset 181185670 · sha256 `5ab2aa30…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic background updates.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_BRIEF_MODE_STOP_HOOK`

Source: `chunk-w8a1w7ad.js` · offset 193845412 · sha256 `f348af56…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-w8a1w7ad.js` offset 193845412.

**Undocumented**

### `DISABLE_BUG_COMMAND`

Source: `chunk-09m4fzsj.js` · offset 184719377 · sha256 `f52f9937…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COMPACT`

Source: `chunk-2zfzkhkv.js` · offset 216979233 · sha256 `6c34486b…` · 12 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all compaction: both automatic compaction and the manual `/compact` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COST_WARNINGS`

Source: `chunk-09m4fzsj.js` · offset 184719697 · sha256 `8ac37cb3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable cost warning messages

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_DOCTOR_COMMAND`

Source: `chunk-2fn6341y.js` · offset 194721565 · sha256 `ee7207c3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/doctor` setup checkup skill and its `/checkup` alias.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_ERROR_REPORTING`

Source: `chunk-8xhw5h9f.js` · offset 190500127 · sha256 `1aa9728e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of error reporting. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn error reporting back on

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_EXTRA_USAGE_COMMAND`

Source: `chunk-nankzm0s.js` · offset 181283161 · sha256 `b9b14308…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/usage-credits` command that lets users purchase additional usage beyond rate limits

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_FEEDBACK_COMMAND`

Source: `chunk-09m4fzsj.js` · offset 184719262 · sha256 `5e33f8be…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the `/feedback` command and Claude-drafted feedback.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_GROWTHBOOK`

Source: `chunk-8xhw5h9f.js` · offset 190500182 · sha256 `a0cfeb1e…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` or `true` to disable GrowthBook feature-flag fetching and use code defaults for every flag.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALL_GITHUB_APP_COMMAND`

Source: `chunk-mphp7acd.js` · offset 188570374 · sha256 `3316960d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/install-github-app` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALLATION_CHECKS`

Source: `chunk-2t7nhzwg.js` · offset 195920050 · sha256 `4c27a2dd…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable installation warnings.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INTERLEAVED_THINKING`

Source: `chunk-nankzm0s.js` · offset 181000548 · sha256 `e341ccff…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent sending the interleaved-thinking beta header.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGIN_COMMAND`

Source: `chunk-mphp7acd.js` · offset 188569908 · sha256 `9de9e197…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/login` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGOUT_COMMAND`

Source: `chunk-mphp7acd.js` · offset 188570076 · sha256 `ddc0075c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/logout` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPDATES`

Source: `chunk-nankzm0s.js` · offset 181185602 · sha256 `3a3c9989…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to block all updates including manual `claude update` and `claude install`.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPGRADE_COMMAND`

Source: `chunk-09m4fzsj.js` · offset 184700073 · sha256 `4885b0e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/upgrade` command

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_CLAUDEAI_MCP_SERVERS`

Source: `chunk-mphp7acd.js` · offset 186217967 · sha256 `a8b4022d…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to stop Claude Code from fetching claude.ai MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_MCP_LARGE_OUTPUT_FILES`

Source: `chunk-amg94xhm.js` · offset 213092060 · sha256 `9b7436ef…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-amg94xhm.js` offset 213092060.

**Undocumented**

### `ENABLE_TOOL_SEARCH`

Source: `chunk-7qtw821h.js` · offset 182172183 · sha256 `7f68bf8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Controls MCP tool search.

Documented: https://code.claude.com/docs/en/env-vars

### `FALLBACK_FOR_ALL_PRIMARY_MODELS`

Source: `chunk-mphp7acd.js` · offset 187786144 · sha256 `78f6ad2c…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to any non-empty value, such as `1`, to make Claude Code stop retrying on repeated overload errors for every model when no fallback model is configured. **Setting it to `0` or `false` still enables this**, unlike most on/off variables; unset the variable to restore the default retry behavior.

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_AUTOUPDATE_PLUGINS`

Source: `chunk-nankzm0s.js` · offset 181185411 · sha256 `531c9c29…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`

Documented: https://code.claude.com/docs/en/env-vars

### `HOMESHARE`

Source: `chunk-09m4fzsj.js` · offset 184497925 · sha256 `fcfa8c3d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184497925.

**Undocumented**

### `IS_DEMO`

Source: `chunk-1ypw9bby.js` · offset 206208936 · sha256 `98b8eb2b…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to enable demo mode: hides your email and organization name from the header and `/status` output, and skips onboarding. **Setting it to `0` or `false` still enables demo mode**, unlike most on/off variables; unset the variable to turn it off.

Documented: https://code.claude.com/docs/en/env-vars

### `IS_SANDBOX`

Source: `chunk-1sb33067.js` · offset 210932780 · sha256 `56348ca3…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `1`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-1sb33067.js` offset 210932780.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-7eyrbz6k.js` · offset 196822457 · sha256 `357e1b70…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196822457.

**Undocumented**

### `MAX_MCP_OUTPUT_TOKENS`

Source: `chunk-s409a3pp.js` · offset 205827302 · sha256 `8c5ef5cd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of tokens allowed in MCP tool responses.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_STRUCTURED_OUTPUT_RETRIES`

Source: `chunk-jxy1fa30.js` · offset 198472245 · sha256 `d2c05d1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Number of attempts Claude Code allows when the model's response fails validation against the `--json-schema` in non-interactive mode with the `-p` flag; after that many failed attempts with no valid output, the run fails.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_THINKING_TOKENS`

Source: `chunk-dgp2yyqt.js` · offset 195054821 · sha256 `25a11b54…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Fixed token budget for extended thinking.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CLIENT_SECRET`

Source: `chunk-frz39n89.js` · offset 212918045 · sha256 `38093413…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth client secret for MCP servers that require pre-configured credentials.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-sbndfme5.js` · offset 185670531 · sha256 `49ffbd08…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-r3f1sg3c.js` · offset 195212421 · sha256 `55b6fd6e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-mphp7acd.js` · offset 187217783 · sha256 `f3c1c20e…` · 4 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Turns the MCP discovery cache on or off.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-z6w3579x.js` · offset 195182606 · sha256 `6075690d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-z6w3579x.js` · offset 195181969 · sha256 `d71a3eb9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-z6w3579x.js` · offset 195182517 · sha256 `ebb2b99a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-9xxnd3gn.js` · offset 212507028 · sha256 `63af4c00…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-frz39n89.js` · offset 212874114 · sha256 `801a0e59…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-frz39n89.js` offset 212874114.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-amg94xhm.js` · offset 213007740 · sha256 `536099b7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-amg94xhm.js` · offset 213004164 · sha256 `153f3a1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `20`.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-1et752h9.js` · offset 185272503 · sha256 `231a32e2…`

Read as: string (trimmed; empty is treated as unset).

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-amg94xhm.js` · offset 213004105 · sha256 `7d6d913c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `3`.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-sbndfme5.js` · offset 185670453 · sha256 `b9a49083…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-amg94xhm.js` · offset 212988564 · sha256 `4002a2b8…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-mphp7acd.js` · offset 187109492 · sha256 `f467df82…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 187109492.

**Undocumented**

### `MCP_XAA_IDP_CLIENT_SECRET`

Source: `chunk-cyh6zh14.js` · offset 205738353 · sha256 `f2acd65a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cyh6zh14.js` offset 205738353.

**Undocumented**

### `PLAYWRIGHT_BROWSERS_PATH`

Source: `chunk-s1mfg8e9.js` · offset 194271379 · sha256 `2f5fd224…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s1mfg8e9.js` offset 194271379.

**Undocumented**

### `RUNNER_ENVIRONMENT`

Source: `chunk-nankzm0s.js` · offset 181084910 · sha256 `1c7f10fd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181084910.

**Undocumented**

### `RUNNER_OS`

Source: `chunk-nankzm0s.js` · offset 181084963 · sha256 `4febb421…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181084963.

**Undocumented**

### `RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-8xhw5h9f.js` · offset 190609485 · sha256 `7cd461dd…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609485.

**Undocumented**

### `SAFEUSER`

Source: `chunk-mphp7acd.js` · offset 188535309 · sha256 `7cf0f156…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 188535309.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-j0381q8k.js` · offset 201612222 · sha256 `74660f53…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `claude`.

Undocumented; read at `chunk-j0381q8k.js` offset 201612222.

**Undocumented**

### `SELF_HOSTED_RUNNER_BASE_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190576151 · sha256 `b4772425…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576151.

**Undocumented**

### `SELF_HOSTED_RUNNER_BG_RESULT_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190504512 · sha256 `27b1b8d2…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner considers a session busy after a background task finishes while the follow-up turn that reads the result hasn't started.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_CLIENT_LABEL`

Source: `chunk-8xhw5h9f.js` · offset 190576602 · sha256 `177e08fb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576602.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFIGURE_GIT`

Source: `chunk-8xhw5h9f.js` · offset 190576784 · sha256 `452ab2bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576784.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFINE_REPO_SETTINGS`

Source: `chunk-8xhw5h9f.js` · offset 190577159 · sha256 `77b9796c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190577159.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_DIR`

Source: `chunk-nmm61j3j.js` · offset 190709808 · sha256 `b1e11b3a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nmm61j3j.js` offset 190709808.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_TOKEN_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190576480 · sha256 `15e6ba3b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576480.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-8xhw5h9f.js` · offset 190610587 · sha256 `fd93c224…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190610587.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190530889 · sha256 `e01cdfc2…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190530889.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-8xhw5h9f.js` · offset 190574246 · sha256 `4808daa9…` · 2 read sites

Read as: string (raw value; further parsing not traced). Default (from code): `unset`.

Undocumented; read at `chunk-8xhw5h9f.js` offset 190574246.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_BG_TASKS_MS`

Source: `chunk-8xhw5h9f.js` · offset 190573983 · sha256 `fbebf33a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190573983.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190573873 · sha256 `9a8c3728…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190573873.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-8xhw5h9f.js` · offset 190586019 · sha256 `13476adc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190586019.

**Undocumented**

### `SELF_HOSTED_RUNNER_EXEC_PATH`

Source: `chunk-8xhw5h9f.js` · offset 190576292 · sha256 `c75ae78f…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576292.

**Undocumented**

### `SELF_HOSTED_RUNNER_HEALTH_PORT`

Source: `chunk-8xhw5h9f.js` · offset 190576419 · sha256 `114335bb…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576419.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190452696 · sha256 `b0459dbf…` · 7 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-8xhw5h9f.js` offset 190452696.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190391503 · sha256 `6bdd2e04…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_HOST_CONFIG_SNAPSHOT`

Source: `chunk-8xhw5h9f.js` · offset 190577235 · sha256 `41e1b2bc…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190577235.

**Undocumented**

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-8xhw5h9f.js` · offset 190612628 · sha256 `72e91d87…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190612628.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOCK_TO_ACCOUNT`

Source: `chunk-8xhw5h9f.js` · offset 190576543 · sha256 `f387d2ff…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576543.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOG_FILE`

Source: `chunk-8xhw5h9f.js` · offset 190576357 · sha256 `bed345b6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576357.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190503682 · sha256 `21be6599…`

Read as: number (parsed as a number). Default (from code): `900000`.

From docs: How long the runner waits after a session reaches its `--kill-session-after-min` limit, for a running turn to finish or the release to complete, before it terminates the session

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-8xhw5h9f.js` · offset 190503622 · sha256 `1f6f8814…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190503622.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-8xhw5h9f.js` · offset 190586096 · sha256 `fc39e472…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190586096.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190609983 · sha256 `906272d2…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `60000`.

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609983.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_TURN_SETTLE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190504563 · sha256 `939f4db3…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `7000`.

From docs: Cap on how long the runner counts a session as busy for the `--drain-wait-sec` drain after a turn finishes, while the session's process reports the turn's end to Anthropic.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_PUSH_OUTCOME_ON_RELEASE`

Source: `chunk-8xhw5h9f.js` · offset 190576854 · sha256 `ab9e00d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576854.

**Undocumented**

### `SELF_HOSTED_RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-8xhw5h9f.js` · offset 190609519 · sha256 `854a99a1…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609519.

**Undocumented**

### `SELF_HOSTED_RUNNER_REMOVE_SESSION_STATE`

Source: `chunk-8xhw5h9f.js` · offset 190577080 · sha256 `804b6083…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190577080.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-8xhw5h9f.js` · offset 190574051 · sha256 `b92e6ac9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190574051.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MIN`

Source: `chunk-8xhw5h9f.js` · offset 190609565 · sha256 `d0b6f6af…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609565.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190610636 · sha256 `1c987ddd…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190610636.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_SEC`

Source: `chunk-8xhw5h9f.js` · offset 190609603 · sha256 `d5c3bc87…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609603.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190503905 · sha256 `b315d588…` · 3 read sites

Read as: number (parsed as a number). Default (from code): `5000`.

Undocumented; read at `chunk-8xhw5h9f.js` offset 190503905.

**Undocumented**

### `SELF_HOSTED_RUNNER_SIGKILL_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190503766 · sha256 `bd834a06…`

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner waits for the OS to deliver `SIGKILL` to a child stuck in uninterruptible I/O before exiting itself.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_SIGKILL_TIMEOUT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190609118 · sha256 `79e46d6b…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190609118.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190511381 · sha256 `8252795b…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190511381.

**Undocumented**

### `SELF_HOSTED_RUNNER_TRUST_WORKSPACE`

Source: `chunk-8xhw5h9f.js` · offset 190576965 · sha256 `6405b7e1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576965.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-758hjhx1.js` · offset 180368865 · sha256 `37709674…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-758hjhx1.js` offset 180368865.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-mphp7acd.js` · offset 187226523 · sha256 `d34c78d3…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Documented: https://code.claude.com/docs/en/env-vars

### `SRT_DEBUG`

Source: `chunk-7qgnq1jf.js` · offset 182443614 · sha256 `a3a90306…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-7qgnq1jf.js` offset 182443614.

**Undocumented**

### `SWE_BENCH_INSTANCE_ID`

Source: `chunk-nankzm0s.js` · offset 181086865 · sha256 `92750357…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nankzm0s.js` offset 181086865.

**Undocumented**

### `SWE_BENCH_RUN_ID`

Source: `chunk-nankzm0s.js` · offset 181086813 · sha256 `b371b98c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nankzm0s.js` offset 181086813.

**Undocumented**

### `SWE_BENCH_TASK_ID`

Source: `chunk-nankzm0s.js` · offset 181086918 · sha256 `1acfb392…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nankzm0s.js` offset 181086918.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-09m4fzsj.js` · offset 184797529 · sha256 `0fd4c0b3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184797529.

**Undocumented**

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-mphp7acd.js` · offset 189962599 · sha256 `80869434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 189962599.

**Undocumented**

### `USE_API_CONTEXT_MANAGEMENT`

Source: `chunk-nankzm0s.js` · offset 181000880 · sha256 `1cdd37f8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 181000880.

**Undocumented**

### `USE_BUILTIN_RIPGREP`

Source: `chunk-5vadtxaa.js` · offset 183295953 · sha256 `b64426c9…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code

Documented: https://code.claude.com/docs/en/env-vars

### `USE_LOCAL_OAUTH`

Source: `chunk-7eyrbz6k.js` · offset 196822438 · sha256 `859f5930…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196822438.

**Undocumented**

### `USE_STAGING_OAUTH`

Source: `chunk-7eyrbz6k.js` · offset 196822503 · sha256 `474ca94d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7eyrbz6k.js` offset 196822503.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-mxgb9rkv.js` · offset 190362384 · sha256 `173e4cd4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mxgb9rkv.js` offset 190362384.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-vnsj0eyq.js` · offset 211819836 · sha256 `20d7f7cb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-vnsj0eyq.js` offset 211819836.

**Undocumented**

## Providers: Amazon Bedrock and AWS

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-09m4fzsj.js` · offset 184776126 · sha256 `e97fa437…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780609 · sha256 `0a7a75f0…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Claude Platform on AWS endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_WORKSPACE_ID`

Source: `chunk-09m4fzsj.js` · offset 184775840 · sha256 `6cf298c7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Required for Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780381 · sha256 `befad766…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Amazon Bedrock endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780492 · sha256 `bfdce098…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the Amazon Bedrock Mantle endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_REGION_PREFIX`

Source: `chunk-nankzm0s.js` · offset 180628430 · sha256 `6e9f466d…`

Read as: enum (compared against fixed values). Values: `us`, `eu`, `apac`, `jp`, `au`, `global`.

From docs: Cross-region inference profile prefix (`us`, `eu`, `apac`, `jp`, `au`, or `global`) Claude Code tries first instead of the one derived from the AWS region.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_SERVICE_TIER`

Source: `chunk-09m4fzsj.js` · offset 184773607 · sha256 `b387382a…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock service tier (`default`, `flex`, or `priority`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`

Source: `chunk-09m4fzsj.js` · offset 184781025 · sha256 `5c5cdacf…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override AWS region for the Haiku-class model when using Amazon Bedrock or Amazon Bedrock Mantle.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_ACCESS_KEY_ID`

Source: `chunk-ekz7hy24.js` · offset 197436322 · sha256 `0734f87e…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197436322.

**Undocumented**

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-09m4fzsj.js` · offset 184773730 · sha256 `4790d6c3…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_CONFIG_FILE`

Source: `chunk-5nrgqzmg.js` · offset 196918323 · sha256 `1d954014…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5nrgqzmg.js` offset 196918323.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_FULL_URI`

Source: `chunk-ar7e1323.js` · offset 211925039 · sha256 `56d7cc2f…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ar7e1323.js` offset 211925039.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`

Source: `chunk-ar7e1323.js` · offset 211924981 · sha256 `757201c8…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ar7e1323.js` offset 211924981.

**Undocumented**

### `AWS_DEFAULT_REGION`

Source: `chunk-ekz7hy24.js` · offset 197436274 · sha256 `20ee042a…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197436274.

**Undocumented**

### `AWS_ENDPOINT_URL`

Source: `chunk-wj72kvg2.js` · offset 179715872 · sha256 `1a0caa05…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wj72kvg2.js` offset 179715872.

**Undocumented**

### `AWS_ENDPOINT_URL_STS`

Source: `chunk-wj72kvg2.js` · offset 179715848 · sha256 `31d2a84c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wj72kvg2.js` offset 179715848.

**Undocumented**

### `AWS_EXECUTION_ENV`

Source: `chunk-jxvcdtxk.js` · offset 197199581 · sha256 `1d96876d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `AWS_ECS_FARGATE`, `AWS_ECS_EC2`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-jxvcdtxk.js` offset 197199581.

**Undocumented**

### `AWS_LAMBDA_FUNCTION_NAME`

Source: `chunk-jxvcdtxk.js` · offset 197065077 · sha256 `6ca7392d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-jxvcdtxk.js` offset 197065077.

**Undocumented**

### `AWS_PROFILE`

Source: `chunk-5nrgqzmg.js` · offset 196917968 · sha256 `53e60fe7…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5nrgqzmg.js` offset 196917968.

**Undocumented**

### `AWS_REGION`

Source: `chunk-ekz7hy24.js` · offset 197436250 · sha256 `ccf42d2f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `us-east-1`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197436250.

**Undocumented**

### `AWS_ROLE_ARN`

Source: `chunk-ghgder2z.js` · offset 211921105 · sha256 `91a608bc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ghgder2z.js` offset 211921105.

**Undocumented**

### `AWS_SECRET_ACCESS_KEY`

Source: `chunk-ekz7hy24.js` · offset 197436353 · sha256 `71df3a7a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197436353.

**Undocumented**

### `AWS_SESSION_TOKEN`

Source: `chunk-ekz7hy24.js` · offset 197436492 · sha256 `5cdde123…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197436492.

**Undocumented**

### `AWS_SHARED_CREDENTIALS_FILE`

Source: `chunk-5nrgqzmg.js` · offset 196918419 · sha256 `aab2cfbd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5nrgqzmg.js` offset 196918419.

**Undocumented**

### `AWS_USE_FIPS_ENDPOINT`

Source: `chunk-64smfct9.js` · offset 203741769 · sha256 `76b4ea55…`

Read as: string (trimmed; empty is treated as unset). Values: `true`.

Undocumented; read at `chunk-64smfct9.js` offset 203741769.

**Undocumented**

### `AWS_WEB_IDENTITY_TOKEN_FILE`

Source: `chunk-ghgder2z.js` · offset 211921076 · sha256 `651dbdfb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ghgder2z.js` offset 211921076.

**Undocumented**

### `CLAUDE_CODE_AWS_CHAIN_RESOLVE_TIMEOUT_MS`

Source: `chunk-nankzm0s.js` · offset 181249895 · sha256 `17165e62…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647. Default (from code): `60000`.

From docs: Time in milliseconds Claude Code waits for the AWS default credential provider chain to produce credentials before the request fails with `AWS default-chain credential resolve timed out` (default: `60000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_DEFAULT`

Source: `chunk-09m4fzsj.js` · offset 184788981 · sha256 `d0d6c187…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from treating an Amazon Bedrock streaming response with a missing or empty `Content-Type` header as Amazon Bedrock's binary event stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_GUARD`

Source: `chunk-09m4fzsj.js` · offset 184789230 · sha256 `21e859a3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the check that an Amazon Bedrock streaming response carries the `application/vnd.amazon.eventstream` content-type.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184775617 · sha256 `9bdd4f8f…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip client-side authentication for Claude Platform on AWS, for gateways that sign requests themselves

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_AWS_CRED_CACHE`

Source: `chunk-64smfct9.js` · offset 203742146 · sha256 `bb5f5050…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off the in-process cache of credentials resolved from the AWS default credential provider chain, so Claude Code resolves the chain on every API request.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_BEDROCK_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184773406 · sha256 `92a4d50a…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MANTLE_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184777355 · sha256 `f79d4f5c…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock Mantle (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_AWS`

Source: `chunk-amhtwhch.js` · offset 178151295 · sha256 `c6be261e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Claude Platform on AWS

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_BEDROCK`

Source: `chunk-amhtwhch.js` · offset 178151173 · sha256 `fd5e84a3…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Amazon Bedrock

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_MANTLE`

Source: `chunk-amhtwhch.js` · offset 178151398 · sha256 `7718029e…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use the Amazon Bedrock Mantle endpoint

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`

Source: `chunk-09m4fzsj.js` · offset 184787205 · sha256 `679d9258…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable the byte-level streaming idle watchdog on Amazon Bedrock `vnd.amazon.eventstream` responses, which also enables the first-byte deadline on Bedrock streaming requests.

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Google Vertex AI and Google Cloud

### `ANTHROPIC_GOOGLE_CLOUD_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780729 · sha256 `99675c8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `https://claude.googleapis.com`.

Undocumented; read at `chunk-09m4fzsj.js` offset 184780729.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_LOCATION`

Source: `chunk-09m4fzsj.js` · offset 184776583 · sha256 `50d42c5b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `global`.

Undocumented; read at `chunk-09m4fzsj.js` offset 184776583.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_PROJECT`

Source: `chunk-09m4fzsj.js` · offset 184776512 · sha256 `b0231252…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184776512.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID`

Source: `chunk-09m4fzsj.js` · offset 184776659 · sha256 `719be76f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184776659.

**Undocumented**

### `ANTHROPIC_VERTEX_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184780816 · sha256 `b34e6459…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override Google Cloud's Agent Platform endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_VERTEX_PROJECT_ID`

Source: `chunk-hdqx8ske.js` · offset 197601298 · sha256 `7d0f0ea1…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: GCP project ID that Google Cloud's Agent Platform requests are addressed to.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_GOOGLE_CLOUD_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184776881 · sha256 `9beecc05…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-09m4fzsj.js` offset 184776881.

**Undocumented**

### `CLAUDE_CODE_SKIP_VERTEX_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184778255 · sha256 `3897a5fc…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Google authentication for Google Cloud's Agent Platform (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`

Source: `chunk-amhtwhch.js` · offset 178151342 · sha256 `95ef3a64…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-amhtwhch.js` offset 178151342.

**Undocumented**

### `CLAUDE_CODE_USE_VERTEX`

Source: `chunk-amhtwhch.js` · offset 178151214 · sha256 `9d4aaeb0…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `CLOUD_ML_REGION`

Source: `chunk-brnn4zwp.js` · offset 178047875 · sha256 `d14e27f0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-brnn4zwp.js` offset 178047875.

**Undocumented**

### `CLOUDSDK_ACTIVE_CONFIG_NAME`

Source: `chunk-azf8jmbk.js` · offset 195426101 · sha256 `00daa6d2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-azf8jmbk.js` offset 195426101.

**Undocumented**

### `CLOUDSDK_AUTH_ACCESS_TOKEN`

Source: `chunk-azf8jmbk.js` · offset 195427322 · sha256 `aa35dfcd…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-azf8jmbk.js` offset 195427322.

**Undocumented**

### `CLOUDSDK_CONFIG`

Source: `chunk-ekz7hy24.js` · offset 197372524 · sha256 `a53236c8…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197372524.

**Undocumented**

### `gcloud_project`

Source: `chunk-ekz7hy24.js` · offset 197458347 · sha256 `232389f7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197458347.

**Undocumented**

### `GCLOUD_PROJECT`

Source: `chunk-ekz7hy24.js` · offset 197458285 · sha256 `3d9c3b37…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197458285.

**Undocumented**

### `google_application_credentials`

Source: `chunk-ekz7hy24.js` · offset 197454453 · sha256 `b73615be…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197454453.

**Undocumented**

### `GOOGLE_APPLICATION_CREDENTIALS`

Source: `chunk-ekz7hy24.js` · offset 197454409 · sha256 `c2e78809…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197454409.

**Undocumented**

### `google_cloud_project`

Source: `chunk-ekz7hy24.js` · offset 197458375 · sha256 `b763364f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197458375.

**Undocumented**

### `GOOGLE_CLOUD_PROJECT`

Source: `chunk-ekz7hy24.js` · offset 197458313 · sha256 `17e9b022…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197458313.

**Undocumented**

### `GOOGLE_CLOUD_WORKSTATIONS`

Source: `chunk-mbfze585.js` · offset 178173914 · sha256 `05ba04cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173914.

**Undocumented**

### `VERTEX_REGION_CLAUDE_3_5_HAIKU`

Source: `chunk-brnn4zwp.js` · offset 178045099 · sha256 `f4a42187…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Haiku when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_5_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178044820 · sha256 `b0163304…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_7_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178044876 · sha256 `9058fadb…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.7 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045726 · sha256 `1f4dbfd4…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178045572 · sha256 `17ff2060…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_1_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045260 · sha256 `26ffeba1…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.1 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045312 · sha256 `ba882f91…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178044932 · sha256 `7fe0e77c…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045364 · sha256 `73a23bda…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178044988 · sha256 `120c2066…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_7_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045416 · sha256 `364310a0…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.7 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_8_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045468 · sha256 `3b69250d…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.8 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045520 · sha256 `58a45cb7…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5.5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178045044 · sha256 `07076092…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-brnn4zwp.js` offset 178045044.

**Undocumented**

### `VERTEX_REGION_CLAUDE_5_OPUS`

Source: `chunk-brnn4zwp.js` · offset 178045776 · sha256 `8e8c2421…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_SONNET`

Source: `chunk-brnn4zwp.js` · offset 178045626 · sha256 `1a6f9b02…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5`

Source: `chunk-brnn4zwp.js` · offset 178045677 · sha256 `ef732c7f…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5_1`

Source: `chunk-brnn4zwp.js` · offset 178045153 · sha256 `0e9c5375…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5.1 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_HAIKU_4_5`

Source: `chunk-brnn4zwp.js` · offset 178045207 · sha256 `bdaa3937…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Haiku 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Microsoft Foundry and Azure

### `ANTHROPIC_FOUNDRY_API_KEY`

Source: `chunk-09m4fzsj.js` · offset 184774526 · sha256 `6edea27f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key for Microsoft Foundry authentication (see Microsoft Foundry)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_AUTH_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 184774439 · sha256 `072afdc4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Bearer token for Microsoft Foundry authentication, such as a Microsoft Entra access token.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_BASE_URL`

Source: `chunk-09m4fzsj.js` · offset 184766526 · sha256 `42cda74f…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Full base URL for the Microsoft Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_RESOURCE`

Source: `chunk-09m4fzsj.js` · offset 184766489 · sha256 `3630aefc…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Microsoft Foundry resource name (for example, `my-resource`).

Documented: https://code.claude.com/docs/en/env-vars

### `AZURE_CLIENT_ID`

Source: `chunk-mh05fezn.js` · offset 197948087 · sha256 `be8e8739…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `AZURE_FUNCTIONS_ENVIRONMENT`

Source: `chunk-mbfze585.js` · offset 178175015 · sha256 `0fa1ac42…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175015.

**Undocumented**

### `AZURE_TENANT_ID`

Source: `chunk-mh05fezn.js` · offset 197948045 · sha256 `b705b6d3…` · 6 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`

Source: `chunk-09m4fzsj.js` · offset 184774567 · sha256 `42d8ec8b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Azure authentication for Microsoft Foundry, for a proxy or gateway that injects its own `Authorization` header.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_FOUNDRY`

Source: `chunk-amhtwhch.js` · offset 178151254 · sha256 `d289ae80…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Microsoft Foundry

Documented: https://code.claude.com/docs/en/env-vars

## Providers: gateways

### `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`

Source: `chunk-k9q4wymh.js` · offset 193683624 · sha256 `e51b98ea…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to populate the `/model` picker from your gateway's `/v1/models` endpoint when `ANTHROPIC_BASE_URL` points at an Anthropic-compatible gateway such as LiteLLM, Kong, or an internal proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_HINT_HEADERS`

Source: `chunk-09m4fzsj.js` · offset 184768614 · sha256 `e72abd56…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to send the gateway hint headers, such as `x-claude-code-request-class` and `x-claude-code-compaction`, on a custom proxy or a third-party provider such as Amazon Bedrock or Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_MODEL_DISCOVERY_TIMEOUT_MS`

Source: `chunk-nankzm0s.js` · offset 180915129 · sha256 `07d66406…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true. Default (from code): `3000`.

From docs: Timeout in milliseconds for the gateway model discovery request that `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` turns on (default: `3000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-mnp9k227.js` · offset 180501383 · sha256 `c4cff902…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mnp9k227.js` offset 180501383.

**Undocumented**

### `CLAUDE_CODE_HOST_GATEWAY_LINEAGE`

Source: `chunk-0a47xg8f.js` · offset 178232051 · sha256 `8d70ffb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0a47xg8f.js` offset 178232051.

**Undocumented**

### `CLAUDE_CODE_USE_GATEWAY`

Source: `chunk-0a47xg8f.js` · offset 178231933 · sha256 `3c6159ee…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0a47xg8f.js` offset 178231933.

**Undocumented**

### `CLAUDE_GATEWAY_ALLOW_LOOPBACK`

Source: `chunk-64smfct9.js` · offset 203718639 · sha256 `e63dfe37…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-64smfct9.js` offset 203718639.

**Undocumented**

### `CLAUDE_GATEWAY_DRAIN_TIMEOUT_MS`

Source: `chunk-rkgc6r4t.js` · offset 203936960 · sha256 `4cc46a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147000000, digitsOnly true. Default (from code): `25000`.

Undocumented; read at `chunk-rkgc6r4t.js` offset 203936960.

**Undocumented**

### `CLAUDE_GATEWAY_LOG_LEVEL`

Source: `chunk-3xs6dk88.js` · offset 202610290 · sha256 `de2a0fcd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-3xs6dk88.js` offset 202610290.

**Undocumented**

### `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY`

Source: `chunk-64smfct9.js` · offset 203718330 · sha256 `8ab0e5da…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-64smfct9.js` offset 203718330.

**Undocumented**

## Telemetry and observability

### `BETA_TRACING_ENDPOINT`

Source: `chunk-91c8r0ee.js` · offset 183536125 · sha256 `0b8e0086…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OTLP endpoint for detailed beta tracing: with `ENABLE_BETA_TRACING_DETAILED=1`, logs and traces go there instead of to the configured exporters.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BYOC_ENABLE_DATADOG`

Source: `chunk-8xhw5h9f.js` · offset 190499879 · sha256 `9657eb08…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190499879.

**Undocumented**

### `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS`

Source: `chunk-hznndn51.js` · offset 185177590 · sha256 `f59cfbdd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `15000`.

Undocumented; read at `chunk-hznndn51.js` offset 185177590.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`

Source: `chunk-3pvpzycx.js` · offset 179273111 · sha256 `12bbf696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to route the "How is Claude doing?" session quality survey to your own OpenTelemetry collector when Anthropic-bound nonessential traffic is blocked.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TELEMETRY`

Source: `chunk-3svn1vf6.js` · offset 194197442 · sha256 `3b331164…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable OpenTelemetry data collection for metrics and logging.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-91c8r0ee.js` · offset 183542541 · sha256 `76f8b26a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Enable span tracing (required).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF`

Source: `chunk-nankzm0s.js` · offset 181112539 · sha256 `a3ff8f93…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nankzm0s.js` offset 181112539.

**Undocumented**

### `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`

Source: `chunk-91c8r0ee.js` · offset 183535324 · sha256 `58cae1fa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `61440`.

From docs: Maximum length of content-bearing OpenTelemetry attributes (model responses, tool content, system prompts, raw API bodies), truncation marker included, in UTF-16 code units (default: 61440, i.e. 60 KB).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_DIAG_STDERR`

Source: `chunk-523ax4jh.js` · offset 190370785 · sha256 `bc37fcc6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to write OpenTelemetry exporter diagnostic errors to stderr.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`

Source: `chunk-pc840nxb.js` · offset 210886336 · sha256 `5a408a7f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Timeout in milliseconds for flushing pending OpenTelemetry spans (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`

Source: `chunk-nankzm0s.js` · offset 181286295 · sha256 `240e3e9d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`

Source: `chunk-pc840nxb.js` · offset 210866231 · sha256 `c8cd5ac8…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `2000`.

From docs: Timeout in milliseconds for the OpenTelemetry exporter to finish on shutdown (default: 2000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PERFETTO_TRACE`

Source: `chunk-91c8r0ee.js` · offset 183541295 · sha256 `17ecb006…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-91c8r0ee.js` offset 183541295.

**Undocumented**

### `DISABLE_TELEMETRY`

Source: `chunk-8xhw5h9f.js` · offset 190499941 · sha256 `33ea0227…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of telemetry. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn telemetry back on.

Documented: https://code.claude.com/docs/en/env-vars

### `DO_NOT_TRACK`

Source: `chunk-8xhw5h9f.js` · offset 190499984 · sha256 `91dfe981…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to opt out of telemetry, with the same effect as `DISABLE_TELEMETRY`, including making Remote Control and the other features that need feature-flag fetching unavailable.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_BETA_TRACING_DETAILED`

Source: `chunk-91c8r0ee.js` · offset 183536085 · sha256 `f081d785…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1`, together with `BETA_TRACING_ENDPOINT`, to turn on detailed beta tracing, which adds content-bearing span attributes and the `claude_code.hook` span.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-91c8r0ee.js` · offset 183542590 · sha256 `7a82f69c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-91c8r0ee.js` offset 183542590.

**Undocumented**

### `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-91c8r0ee.js` · offset 183535366 · sha256 `d5f795ab…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Standard OpenTelemetry SDK limit on attribute value length.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_EXPORTER_OTLP_*_ENDPOINT`

Source: `chunk-nphjt8ea.js` · offset 218414645 · sha256 `a26b6f13…` · 4 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_HEADERS`

Source: `chunk-nphjt8ea.js` · offset 218414228 · sha256 `9d834cf7…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, `OTEL_EXPORTER_OTLP_METRICS_HEADERS`, `OTEL_EXPORTER_OTLP_TRACES_HEADERS`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_INSECURE`

Source: `chunk-nphjt8ea.js` · offset 218414787 · sha256 `9c1196e8…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_ENDPOINT`

Source: `chunk-nphjt8ea.js` · offset 218414703 · sha256 `807d3ae4…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP collector endpoint for all signals

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_HEADERS`

Source: `chunk-nphjt8ea.js` · offset 218414285 · sha256 `bba3c17d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Authentication headers for OTLP

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`

Source: `chunk-pc840nxb.js` · offset 210879804 · sha256 `a97eb978…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for logs, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`

Source: `chunk-pc840nxb.js` · offset 210878750 · sha256 `87f5ee3b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for metrics, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-pc840nxb.js` · offset 210874941 · sha256 `d703ee47…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Metrics temporality preference (default: `delta`).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_PROTOCOL`

Source: `chunk-pc840nxb.js` · offset 210878376 · sha256 `c0b54b69…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for OTLP exporter, applies to all signals.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Source: `chunk-91c8r0ee.js` · offset 183540467 · sha256 `e359194f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP traces endpoint, overrides `OTEL_EXPORTER_OTLP_ENDPOINT`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`

Source: `chunk-pc840nxb.js` · offset 210880854 · sha256 `2ec5a16b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for traces, overrides `OTEL_EXPORTER_OTLP_PROTOCOL`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOG_ASSISTANT_RESPONSES`

Source: `chunk-qyc5w2q1.js` · offset 183531043 · sha256 `0c8aef2c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to include the model's response text on `assistant_response` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_MANAGED_SETTINGS`

Source: `chunk-dgp2yyqt.js` · offset 195010626 · sha256 `05fbc9d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to add the redacted managed settings, and a SHA-256 digest of the settings before redaction, to `managed_settings_resolved` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_RAW_API_BODIES`

Source: `chunk-mphp7acd.js` · offset 187700730 · sha256 `c83da780…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Emit Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_CONTENT`

Source: `chunk-nankzm0s.js` · offset 181074763 · sha256 `0697bef6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool content in the `tool.output` OpenTelemetry span event.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_DETAILS`

Source: `chunk-nankzm0s.js` · offset 181073661 · sha256 `499d0933…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool input arguments, MCP server names, user-authored workflow names, raw error strings on tool failures, the refusal `category` on `api_refusal` events, and other tool details in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_USER_PROMPTS`

Source: `chunk-91c8r0ee.js` · offset 183535844 · sha256 `55cbaa16…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include user prompt text in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-91c8r0ee.js` · offset 183535407 · sha256 `ead31d61…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGS_EXPORT_INTERVAL`

Source: `chunk-nankzm0s.js` · offset 181108349 · sha256 `cc3fa137…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Logs export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOGS_EXPORTER`

Source: `chunk-3svn1vf6.js` · offset 194197487 · sha256 `0ab3e676…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Logs/events exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRIC_EXPORT_INTERVAL`

Source: `chunk-pc840nxb.js` · offset 210878267 · sha256 `3b7d7cea…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `60000`.

From docs: Export interval in milliseconds (default: 60000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_EXPORTER`

Source: `chunk-8xhw5h9f.js` · offset 190498843 · sha256 `55fadc06…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `prometheus`.

From docs: Metrics exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`

Source: `chunk-qyc5w2q1.js` · offset 183528460 · sha256 `8e5a0ffe…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude account UUID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_ENTRYPOINT`

Source: `chunk-qyc5w2q1.js` · offset 183528111 · sha256 `e147cc8c…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include the session entrypoint in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_REPOSITORY`

Source: `chunk-qyc5w2q1.js` · offset 183528190 · sha256 `a48d8fff…` · 2 read sites

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to tag OpenTelemetry metrics and events with `vcs.*` attributes identifying the session's repository (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES`

Source: `chunk-qyc5w2q1.js` · offset 183527262 · sha256 `3ec269dd…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: As of v2.1.161, Claude Code attaches `OTEL_RESOURCE_ATTRIBUTES` keys to metric datapoint labels.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_SESSION_ID`

Source: `chunk-qyc5w2q1.js` · offset 183527433 · sha256 `c90d0a44…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude session ID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_VERSION`

Source: `chunk-qyc5w2q1.js` · offset 183527579 · sha256 `ef5c92ef…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include Claude Code version in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_RESOURCE_ATTRIBUTES`

Source: `chunk-8xhw5h9f.js` · offset 190498791 · sha256 `3949d66e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-91c8r0ee.js` · offset 183535458 · sha256 `b73a7c57…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_TRACES_EXPORT_INTERVAL`

Source: `chunk-pc840nxb.js` · offset 210884776 · sha256 `3104fb4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Span batch export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_TRACES_EXPORTER`

Source: `chunk-pc840nxb.js` · offset 210880721 · sha256 `947cd0a5…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Traces exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `TRACEPARENT`

Source: `chunk-91c8r0ee.js` · offset 183545778 · sha256 `13183cc6…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TRACESTATE`

Source: `chunk-91c8r0ee.js` · offset 183545854 · sha256 `d8947714…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-91c8r0ee.js` offset 183545854.

**Undocumented**

## Network, proxy and TLS

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-9yd2evp3.js` · offset 210729464 · sha256 `df0eedcf…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729464.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-9yd2evp3.js` · offset 210729434 · sha256 `798ebf6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729434.

**Undocumented**

### `all_proxy`

Source: `chunk-8xhw5h9f.js` · offset 190558119 · sha256 `9fcdc466…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190558119.

**Undocumented**

### `ALL_PROXY`

Source: `chunk-8xhw5h9f.js` · offset 190558096 · sha256 `728ff8d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190558096.

**Undocumented**

### `CCR_AGENT_PROXY_CA_CERT_B64`

Source: `chunk-9yd2evp3.js` · offset 210729754 · sha256 `952592db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729754.

**Undocumented**

### `CCR_AGENT_PROXY_ENABLED`

Source: `chunk-9yd2evp3.js` · offset 210730057 · sha256 `04bb26ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210730057.

**Undocumented**

### `CCR_AGENT_PROXY_FRAME_HOSTS`

Source: `chunk-7nd16342.js` · offset 192448086 · sha256 `6f52e4fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7nd16342.js` offset 192448086.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-9yd2evp3.js` · offset 210729597 · sha256 `80a96f80…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729597.

**Undocumented**

### `CCR_AGENT_PROXY_NO_PROXY_LOCAL_ONLY`

Source: `chunk-9yd2evp3.js` · offset 210729714 · sha256 `ff80511a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729714.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-9yd2evp3.js` · offset 210729631 · sha256 `8d75b539…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729631.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-9yd2evp3.js` · offset 210729566 · sha256 `f05f27c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729566.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-9yd2evp3.js` · offset 210729673 · sha256 `32e23461…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210729673.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`

Source: `chunk-9yd2evp3.js` · offset 210734883 · sha256 `6ddbb857…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210734883.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`

Source: `chunk-9yd2evp3.js` · offset 210734673 · sha256 `15597b8e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yd2evp3.js` offset 210734673.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_HOSTS`

Source: `chunk-9yd2evp3.js` · offset 210739744 · sha256 `86f791d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210739744.

**Undocumented**

### `CLAUDE_CODE_CERT_STORE`

Source: `chunk-2z1m9v0n.js` · offset 183510281 · sha256 `5cf53913…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Comma-separated list of CA certificate sources for TLS connections.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_CERT`

Source: `chunk-2z1m9v0n.js` · offset 183510325 · sha256 `cc37bcd5…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Path to client certificate file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY`

Source: `chunk-2z1m9v0n.js` · offset 183510353 · sha256 `d552242d…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Path to client private key file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`

Source: `chunk-wj72kvg2.js` · offset 179703215 · sha256 `0357f9e0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MTLS_RELOAD_ON_STALE_CONNECTION`

Source: `chunk-mphp7acd.js` · offset 187778451 · sha256 `3a589ab6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from re-reading the mTLS client certificate and key when an API request fails with a connection-level error, such as a connection reset or a TLS handshake error.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`

Source: `chunk-bv2dmc76.js` · offset 190322934 · sha256 `bba7fbe6…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-bv2dmc76.js` offset 190322934.

**Undocumented**

### `CLAUDE_CODE_HTTP_PROXY`

Source: `chunk-8ptzhr8g.js` · offset 180387597 · sha256 `5dbec935…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180387597.

**Undocumented**

### `CLAUDE_CODE_HTTPS_PROXY`

Source: `chunk-8ptzhr8g.js` · offset 180387654 · sha256 `48b35a6e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180387654.

**Undocumented**

### `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`

Source: `chunk-wj72kvg2.js` · offset 179713237 · sha256 `eab3e77a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wj72kvg2.js` offset 179713237.

**Undocumented**

### `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`

Source: `chunk-wj72kvg2.js` · offset 179712422 · sha256 `15350379…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to allow the proxy to perform DNS resolution instead of the caller.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMULATE_PROXY_USAGE`

Source: `chunk-mphp7acd.js` · offset 187763553 · sha256 `8836efb4…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187763553.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_USE_CCR_PROXY`

Source: `chunk-mphp7acd.js` · offset 187114784 · sha256 `808a7134…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mphp7acd.js` offset 187114784.

**Undocumented**

### `CLAUDE_CODE_WEBSEARCH_USE_CCR_PROXY`

Source: `chunk-djhbc0y7.js` · offset 193524097 · sha256 `9aacb5ad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-djhbc0y7.js` offset 193524097.

**Undocumented**

### `CLAUDE_RUNNER_USE_GIT_PROXY`

Source: `chunk-8xhw5h9f.js` · offset 190576727 · sha256 `6dfb3f71…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190576727.

**Undocumented**

### `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH`

Source: `chunk-nphjt8ea.js` · offset 218035512 · sha256 `af68cb3b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nphjt8ea.js` offset 218035512.

**Undocumented**

### `HOSTALIASES`

Source: `chunk-mphp7acd.js` · offset 187959930 · sha256 `ebc96d96…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mphp7acd.js` offset 187959930.

**Undocumented**

### `http_proxy`

Source: `chunk-7qgnq1jf.js` · offset 182458380 · sha256 `846b41df…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7qgnq1jf.js` offset 182458380.

**Undocumented**

### `HTTP_PROXY`

Source: `chunk-7qgnq1jf.js` · offset 182458356 · sha256 `aa98c1d0…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

From docs: Specify HTTP proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `https_proxy`

Source: `chunk-7qgnq1jf.js` · offset 182458448 · sha256 `33d51f7d…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7qgnq1jf.js` offset 182458448.

**Undocumented**

### `HTTPS_PROXY`

Source: `chunk-7qgnq1jf.js` · offset 182458423 · sha256 `3ac3671f…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Specify HTTPS proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `LOCALDOMAIN`

Source: `chunk-mphp7acd.js` · offset 187959916 · sha256 `4df19f9d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mphp7acd.js` offset 187959916.

**Undocumented**

### `no_proxy`

Source: `chunk-64smfct9.js` · offset 203718269 · sha256 `da21c898…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`.

Undocumented; read at `chunk-64smfct9.js` offset 203718269.

**Undocumented**

### `NO_PROXY`

Source: `chunk-64smfct9.js` · offset 203718247 · sha256 `516bafd4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`. Default (from code): `not set`.

From docs: List of domains and IPs to which requests will be directly issued, bypassing proxy

Documented: https://code.claude.com/docs/en/env-vars

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-5vadtxaa.js` · offset 183149254 · sha256 `c69b8df7…` · 14 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5vadtxaa.js` offset 183149254.

**Undocumented**

### `NODE_TLS_REJECT_UNAUTHORIZED`

Source: `chunk-mphp7acd.js` · offset 187959885 · sha256 `1ec3d3d6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mphp7acd.js` offset 187959885.

**Undocumented**

### `RES_OPTIONS`

Source: `chunk-mphp7acd.js` · offset 187959944 · sha256 `3e93abd5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mphp7acd.js` offset 187959944.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-bv2dmc76.js` · offset 190321284 · sha256 `24222dec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-bv2dmc76.js` offset 190321284.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-bv2dmc76.js` · offset 190321311 · sha256 `0d707ffb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-bv2dmc76.js` offset 190321311.

**Undocumented**

### `SSL_CERT_FILE`

Source: `chunk-9yd2evp3.js` · offset 210738140 · sha256 `36128327…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210738140.

**Undocumented**

## Shell, terminal, OS and CI environment

### `__CFBundleIdentifier`

Source: `chunk-mbfze585.js` · offset 178169749 · sha256 `a8824fe9…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Values: `com.googlecode.iterm2`, `com.conductor.app`, `com.anthropic.claude-code-url-handler`.

Undocumented; read at `chunk-mbfze585.js` offset 178169749.

**Undocumented**

### `ALACRITTY_LOG`

Source: `chunk-mbfze585.js` · offset 178171434 · sha256 `bfe1befc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171434.

**Undocumented**

### `ALLUSERSPROFILE`

Source: `chunk-09m4fzsj.js` · offset 184490429 · sha256 `7a933001…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184490429.

**Undocumented**

### `ANDROID_HOME`

Source: `chunk-cn81459s.js` · offset 201344543 · sha256 `309f9171…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cn81459s.js` offset 201344543.

**Undocumented**

### `ANDROID_SDK_ROOT`

Source: `chunk-cn81459s.js` · offset 201344559 · sha256 `58d982c5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cn81459s.js` offset 201344559.

**Undocumented**

### `APP_URL`

Source: `chunk-mbfze585.js` · offset 178175082 · sha256 `883dc61c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175082.

**Undocumented**

### `APPDATA`

Source: `chunk-e2javxcw.js` · offset 214915068 · sha256 `da8ef702…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2javxcw.js` offset 214915068.

**Undocumented**

### `BROWSER`

Source: `chunk-dfef8g3c.js` · offset 192162836 · sha256 `ad8a905e…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `true`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-dfef8g3c.js` offset 192162836.

**Undocumented**

### `BUILDKITE`

Source: `chunk-mbfze585.js` · offset 178175380 · sha256 `9466bfb7…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175380.

**Undocumented**

### `BUN_CHROME_PATH`

Source: `chunk-s1mfg8e9.js` · offset 194271107 · sha256 `497892ba…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-s1mfg8e9.js` offset 194271107.

**Undocumented**

### `BUN_INSTALL`

Source: `chunk-7njsxy23.js` · offset 190184565 · sha256 `c3315b28…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7njsxy23.js` offset 190184565.

**Undocumented**

### `C9_PID`

Source: `chunk-mbfze585.js` · offset 178173987 · sha256 `e4c27b8d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178173987.

**Undocumented**

### `C9_USER`

Source: `chunk-mbfze585.js` · offset 178174007 · sha256 `97e055e6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178174007.

**Undocumented**

### `CF_PAGES`

Source: `chunk-mbfze585.js` · offset 178174479 · sha256 `d2788c90…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174479.

**Undocumented**

### `CI`

Source: `chunk-88zs4xb0.js` · offset 191417552 · sha256 `2883b550…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-88zs4xb0.js` offset 191417552.

**Undocumented**

### `CIRCLECI`

Source: `chunk-mbfze585.js` · offset 178175339 · sha256 `032d464c…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175339.

**Undocumented**

### `CODER`

Source: `chunk-mbfze585.js` · offset 178173721 · sha256 `dbd0f0f9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173721.

**Undocumented**

### `CODER_WORKSPACE_NAME`

Source: `chunk-mbfze585.js` · offset 178173741 · sha256 `d922a1cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173741.

**Undocumented**

### `CODESPACES`

Source: `chunk-mbfze585.js` · offset 178173622 · sha256 `d78687e1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173622.

**Undocumented**

### `COLORFGBG`

Source: `chunk-2q2qd3a1.js` · offset 191909882 · sha256 `4bab16fa…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2q2qd3a1.js` offset 191909882.

**Undocumented**

### `COLORTERM`

Source: `chunk-2a2022xc.js` · offset 211000630 · sha256 `f280844a…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2a2022xc.js` offset 211000630.

**Undocumented**

### `ComSpec`

Source: `chunk-8wcg99nb.js` · offset 202535369 · sha256 `d367c10d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8wcg99nb.js` offset 202535369.

**Undocumented**

### `COMSPEC`

Source: `chunk-mbfze585.js` · offset 178176682 · sha256 `99cafcff…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `cmd.exe`.

Undocumented; read at `chunk-mbfze585.js` offset 178176682.

**Undocumented**

### `ConEmuANSI`

Source: `chunk-mbfze585.js` · offset 178171705 · sha256 `c8777282…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171705.

**Undocumented**

### `ConEmuPID`

Source: `chunk-mbfze585.js` · offset 178171729 · sha256 `c4505517…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171729.

**Undocumented**

### `ConEmuTask`

Source: `chunk-mbfze585.js` · offset 178171752 · sha256 `6160aec6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171752.

**Undocumented**

### `CURSOR_TRACE_ID`

Source: `chunk-bysrnexw.js` · offset 216019683 · sha256 `a240f1a4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-bysrnexw.js` offset 216019683.

**Undocumented**

### `DAYTONA_WS_ID`

Source: `chunk-mbfze585.js` · offset 178173866 · sha256 `d76f1c62…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173866.

**Undocumented**

### `DEBUG`

Source: `chunk-e6m248dn.js` · offset 179601906 · sha256 `3f2fec78…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Documented: https://code.claude.com/docs/en/env-vars

### `DENO_DEPLOYMENT_ID`

Source: `chunk-mbfze585.js` · offset 178174529 · sha256 `a0569b4e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174529.

**Undocumented**

### `DEVPOD`

Source: `chunk-mbfze585.js` · offset 178173794 · sha256 `a0e21599…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mbfze585.js` offset 178173794.

**Undocumented**

### `DEVPOD_WORKSPACE_UID`

Source: `chunk-mbfze585.js` · offset 178173815 · sha256 `7941e754…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178173815.

**Undocumented**

### `DISPLAY`

Source: `chunk-1y575bx8.js` · offset 185205567 · sha256 `4dcc9e06…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1y575bx8.js` offset 185205567.

**Undocumented**

### `DYNO`

Source: `chunk-mbfze585.js` · offset 178174370 · sha256 `5bfcb51f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174370.

**Undocumented**

### `EDITOR`

Source: `chunk-m42kzzy0.js` · offset 216395863 · sha256 `e2aba24c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m42kzzy0.js` offset 216395863.

**Undocumented**

### `FLY_APP_NAME`

Source: `chunk-mbfze585.js` · offset 178174405 · sha256 `e98aa307…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178174405.

**Undocumented**

### `FLY_MACHINE_ID`

Source: `chunk-mbfze585.js` · offset 178174431 · sha256 `eb90c0ce…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178174431.

**Undocumented**

### `FORCE_CODE_TERMINAL`

Source: `chunk-mphp7acd.js` · offset 189053947 · sha256 `6d127f08…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-mphp7acd.js` offset 189053947.

**Undocumented**

### `FORCE_COLOR`

Source: `chunk-mphp7acd.js` · offset 186347654 · sha256 `15ab5bb8…` · 3 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-mphp7acd.js` offset 186347654.

**Undocumented**

### `FORCE_HYPERLINK`

Source: `chunk-88zs4xb0.js` · offset 191417557 · sha256 `dbf93b31…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `1` to enable clickable OSC 8 hyperlinks when your terminal supports them but isn't auto-detected, or `0` to disable them.

Documented: https://code.claude.com/docs/en/env-vars

### `GCM_INTERACTIVE`

Source: `chunk-9yd2evp3.js` · offset 210739033 · sha256 `6bbeb3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210739033.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023581 · sha256 `9c5226ea…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 185023581.

**Undocumented**

### `GH_HOST`

Source: `chunk-09m4fzsj.js` · offset 185023558 · sha256 `95d3efd7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 185023558.

**Undocumented**

### `GH_REPO`

Source: `chunk-1dn0zqp9.js` · offset 196859875 · sha256 `f70912ef…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1dn0zqp9.js` offset 196859875.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023508 · sha256 `4d29d2e5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 185023508.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-8xhw5h9f.js` · offset 190455550 · sha256 `77c0011a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190455550.

**Undocumented**

### `GIT_CONFIG_COUNT`

Source: `chunk-7qgnq1jf.js` · offset 182450275 · sha256 `ada3e46b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `0`.

Undocumented; read at `chunk-7qgnq1jf.js` offset 182450275.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-8xhw5h9f.js` · offset 190440470 · sha256 `c6d7625a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190440470.

**Undocumented**

### `GIT_CONFIG_KEY_*`

Source: `chunk-ywmxa060.js` · offset 183848627 · sha256 `b912f85a…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-09m4fzsj.js` · offset 184910897 · sha256 `440ce77b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184910897.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-ywmxa060.js` · offset 183848737 · sha256 `56a8e5d7…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ywmxa060.js` offset 183848737.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-09m4fzsj.js` · offset 184910840 · sha256 `639af322…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184910840.

**Undocumented**

### `GIT_CONFIG_VALUE_*`

Source: `chunk-ywmxa060.js` · offset 183848654 · sha256 `8dc48ba5…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_NO_LAZY_FETCH`

Source: `chunk-w7hy7pqe.js` · offset 183724850 · sha256 `dc10a06c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-w7hy7pqe.js` offset 183724850.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-8xhw5h9f.js` · offset 190558750 · sha256 `58764ff1…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ssh`.

Undocumented; read at `chunk-8xhw5h9f.js` offset 190558750.

**Undocumented**

### `GIT_SSH_VARIANT`

Source: `chunk-mphp7acd.js` · offset 186147370 · sha256 `9944df81…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-mphp7acd.js` offset 186147370.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-9yd2evp3.js` · offset 210738899 · sha256 `e65f8626…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210738899.

**Undocumented**

### `GITHUB_ACTION_INPUTS`

Source: `chunk-dgp2yyqt.js` · offset 195056511 · sha256 `872d29c8…`

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-dgp2yyqt.js` offset 195056511.

**Undocumented**

### `GITHUB_ACTION_PATH`

Source: `chunk-8ptzhr8g.js` · offset 180392393 · sha256 `63872dc2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180392393.

**Undocumented**

### `GITHUB_ACTIONS`

Source: `chunk-f1vb7bx7.js` · offset 179187677 · sha256 `5cc8b904…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-f1vb7bx7.js` offset 179187677.

**Undocumented**

### `GITHUB_ACTOR`

Source: `chunk-mphp7acd.js` · offset 188318149 · sha256 `bdbdbc09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mphp7acd.js` offset 188318149.

**Undocumented**

### `GITHUB_ACTOR_ID`

Source: `chunk-nankzm0s.js` · offset 180761472 · sha256 `efc90f87…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180761472.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023614 · sha256 `80d49428…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 185023614.

**Undocumented**

### `GITHUB_ENV`

Source: `chunk-8ptzhr8g.js` · offset 180391923 · sha256 `85a6c474…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180391923.

**Undocumented**

### `GITHUB_EVENT_NAME`

Source: `chunk-nankzm0s.js` · offset 181084849 · sha256 `002d2186…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181084849.

**Undocumented**

### `GITHUB_EVENT_PATH`

Source: `chunk-8ptzhr8g.js` · offset 180392442 · sha256 `4d6b1a09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180392442.

**Undocumented**

### `GITHUB_REPOSITORY`

Source: `chunk-nankzm0s.js` · offset 180761501 · sha256 `98dca9d0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180761501.

**Undocumented**

### `GITHUB_REPOSITORY_ID`

Source: `chunk-nankzm0s.js` · offset 180761534 · sha256 `0a9247c9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180761534.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER`

Source: `chunk-nankzm0s.js` · offset 180761573 · sha256 `4bf7a1f3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180761573.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER_ID`

Source: `chunk-nankzm0s.js` · offset 180761617 · sha256 `11aaad60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 180761617.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023530 · sha256 `d84c66c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 185023530.

**Undocumented**

### `GITHUB_WORKSPACE`

Source: `chunk-8ptzhr8g.js` · offset 180391981 · sha256 `c45e337f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180391981.

**Undocumented**

### `GITLAB_CI`

Source: `chunk-mbfze585.js` · offset 178175295 · sha256 `3ee25c25…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175295.

**Undocumented**

### `GITPOD_WORKSPACE_ID`

Source: `chunk-mbfze585.js` · offset 178173668 · sha256 `0bd1a41d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178173668.

**Undocumented**

### `GNOME_TERMINAL_SERVICE`

Source: `chunk-mbfze585.js` · offset 178171190 · sha256 `8fcf299d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171190.

**Undocumented**

### `HISTFILE`

Source: `chunk-cnrmsnz4.js` · offset 199483441 · sha256 `e5c41ee2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cnrmsnz4.js` offset 199483441.

**Undocumented**

### `HOME`

Source: `chunk-8ptzhr8g.js` · offset 180384650 · sha256 `8b7d8232…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180384650.

**Undocumented**

### `HOMEDRIVE`

Source: `chunk-09m4fzsj.js` · offset 184497951 · sha256 `b6e63404…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184497951.

**Undocumented**

### `HOMEPATH`

Source: `chunk-09m4fzsj.js` · offset 184497976 · sha256 `4c16c490…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184497976.

**Undocumented**

### `HOSTNAME`

Source: `chunk-09m4fzsj.js` · offset 184239502 · sha256 `5c1b2b57…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-09m4fzsj.js` offset 184239502.

**Undocumented**

### `INK_SCREEN_READER`

Source: `chunk-p50qybax.js` · offset 191858667 · sha256 `064450f6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p50qybax.js` offset 191858667.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS`

Source: `chunk-nzck9a32.js` · offset 191522626 · sha256 `1054b8d6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nzck9a32.js` offset 191522626.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS_REWORKED`

Source: `chunk-nzck9a32.js` · offset 191522562 · sha256 `d49c5da5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nzck9a32.js` offset 191522562.

**Undocumented**

### `ITERM_SESSION_ID`

Source: `chunk-h2b0wn8m.js` · offset 212031989 · sha256 `038ed3ab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-h2b0wn8m.js` offset 212031989.

**Undocumented**

### `JAVA_HOME`

Source: `chunk-9yd2evp3.js` · offset 210720921 · sha256 `e32930cc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210720921.

**Undocumented**

### `JAVA_TOOL_OPTIONS`

Source: `chunk-5vadtxaa.js` · offset 183229168 · sha256 `eb2a2297…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5vadtxaa.js` offset 183229168.

**Undocumented**

### `K_SERVICE`

Source: `chunk-ekz7hy24.js` · offset 197354589 · sha256 `a48f12e6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ekz7hy24.js` offset 197354589.

**Undocumented**

### `KITTY_WINDOW_ID`

Source: `chunk-mbfze585.js` · offset 178171389 · sha256 `19815f12…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171389.

**Undocumented**

### `KONSOLE_VERSION`

Source: `chunk-mbfze585.js` · offset 178171143 · sha256 `3f5c80d0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171143.

**Undocumented**

### `KUBERNETES_SERVICE_HOST`

Source: `chunk-mbfze585.js` · offset 178175444 · sha256 `d81719da…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175444.

**Undocumented**

### `LANG`

Source: `chunk-pmr9x25s.js` · offset 199258572 · sha256 `7a38024b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pmr9x25s.js` offset 199258572.

**Undocumented**

### `LC_ALL`

Source: `chunk-pmr9x25s.js` · offset 199258551 · sha256 `bc2e1a24…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pmr9x25s.js` offset 199258551.

**Undocumented**

### `LC_TERMINAL`

Source: `chunk-069hbd8x.js` · offset 195778114 · sha256 `0ed931d5…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `iTerm2`. Default (from code): `unset`.

Undocumented; read at `chunk-069hbd8x.js` offset 195778114.

**Undocumented**

### `LC_TIME`

Source: `chunk-pmr9x25s.js` · offset 199258561 · sha256 `65eda90a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pmr9x25s.js` offset 199258561.

**Undocumented**

### `LOCALAPPDATA`

Source: `chunk-2t7nhzwg.js` · offset 195932893 · sha256 `b38fddba…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2t7nhzwg.js` offset 195932893.

**Undocumented**

### `MSYSTEM`

Source: `chunk-mbfze585.js` · offset 178171641 · sha256 `11f36523…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171641.

**Undocumented**

### `NETLIFY`

Source: `chunk-mbfze585.js` · offset 178174330 · sha256 `c4d87109…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174330.

**Undocumented**

### `NO_COLOR`

Source: `chunk-2q133q3v.js` · offset 180434703 · sha256 `48ee5637…` · 2 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-2q133q3v.js` offset 180434703.

**Undocumented**

### `NODE_DEBUG`

Source: `chunk-py9z7ygk.js` · offset 180443236 · sha256 `7d3efaa5…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-py9z7ygk.js` offset 180443236.

**Undocumented**

### `NODE_OPTIONS`

Source: `chunk-brnn4zwp.js` · offset 178046597 · sha256 `914747b7…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-brnn4zwp.js` offset 178046597.

**Undocumented**

### `P4PORT`

Source: `chunk-amhtwhch.js` · offset 178155237 · sha256 `0e8d8e90…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-amhtwhch.js` offset 178155237.

**Undocumented**

### `PATH`

Source: `chunk-14tr5h02.js` · offset 198025279 · sha256 `69e3a9e0…` · 19 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `/usr/local/bin:/usr/bin:/bin`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `PATHEXT`

Source: `chunk-1nayt2j6.js` · offset 178937371 · sha256 `a603895c…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1nayt2j6.js` offset 178937371.

**Undocumented**

### `PREFIX`

Source: `chunk-9xzh0a1e.js` · offset 206559399 · sha256 `b830d9ab…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9xzh0a1e.js` offset 206559399.

**Undocumented**

### `ProgramData`

Source: `chunk-5vadtxaa.js` · offset 183259047 · sha256 `f0de69b2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5vadtxaa.js` offset 183259047.

**Undocumented**

### `PROGRAMDATA`

Source: `chunk-09m4fzsj.js` · offset 184490410 · sha256 `3cba69cf…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184490410.

**Undocumented**

### `ProgramFiles`

Source: `chunk-mh05fezn.js` · offset 197918684 · sha256 `ae3c9ab2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mh05fezn.js` offset 197918684.

**Undocumented**

### `PROJECT_DOMAIN`

Source: `chunk-mbfze585.js` · offset 178174110 · sha256 `87e9f9c2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174110.

**Undocumented**

### `PWD`

Source: `chunk-4zgx6txq.js` · offset 193133076 · sha256 `55d0de17…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4zgx6txq.js` offset 193133076.

**Undocumented**

### `RAILWAY_ENVIRONMENT_NAME`

Source: `chunk-mbfze585.js` · offset 178174196 · sha256 `46ffdcd9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178174196.

**Undocumented**

### `RAILWAY_SERVICE_NAME`

Source: `chunk-mbfze585.js` · offset 178174234 · sha256 `ff14b856…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mbfze585.js` offset 178174234.

**Undocumented**

### `RENDER`

Source: `chunk-mbfze585.js` · offset 178174289 · sha256 `85af1892…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174289.

**Undocumented**

### `REPL_ID`

Source: `chunk-mbfze585.js` · offset 178174049 · sha256 `da03a20e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174049.

**Undocumented**

### `REPL_SLUG`

Source: `chunk-mbfze585.js` · offset 178174070 · sha256 `7ae40c11…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174070.

**Undocumented**

### `SESSIONNAME`

Source: `chunk-mbfze585.js` · offset 178171570 · sha256 `52edc75e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171570.

**Undocumented**

### `SHELL`

Source: `chunk-mbfze585.js` · offset 178176663 · sha256 `d9d57ee3…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178176663.

**Undocumented**

### `SPACE_CREATOR_USER_ID`

Source: `chunk-mbfze585.js` · offset 178175171 · sha256 `57bb1750…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175171.

**Undocumented**

### `SSH_AUTH_SOCK`

Source: `chunk-9yd2evp3.js` · offset 210744250 · sha256 `45e4e696…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yd2evp3.js` offset 210744250.

**Undocumented**

### `SSH_CLIENT`

Source: `chunk-mbfze585.js` · offset 178175746 · sha256 `23b2cf08…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175746.

**Undocumented**

### `SSH_CONNECTION`

Source: `chunk-mbfze585.js` · offset 178175718 · sha256 `c840a5cf…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175718.

**Undocumented**

### `SSH_TTY`

Source: `chunk-mbfze585.js` · offset 178175770 · sha256 `2607570d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178175770.

**Undocumented**

### `STY`

Source: `chunk-mbfze585.js` · offset 178171109 · sha256 `335a859b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171109.

**Undocumented**

### `SUDO_GID`

Source: `chunk-e2javxcw.js` · offset 214793993 · sha256 `403e35b1…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-e2javxcw.js` offset 214793993.

**Undocumented**

### `SUDO_UID`

Source: `chunk-e2javxcw.js` · offset 214793980 · sha256 `8b3a2dac…` · 5 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-e2javxcw.js` offset 214793980.

**Undocumented**

### `SUDO_USER`

Source: `chunk-e2javxcw.js` · offset 214794006 · sha256 `68f43961…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2javxcw.js` offset 214794006.

**Undocumented**

### `SystemRoot`

Source: `chunk-5vadtxaa.js` · offset 183252221 · sha256 `793aedf5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-5vadtxaa.js` offset 183252221.

**Undocumented**

### `SYSTEMROOT`

Source: `chunk-09m4fzsj.js` · offset 184473386 · sha256 `b421cf1e…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-09m4fzsj.js` offset 184473386.

**Undocumented**

### `TEAMCITY_VERSION`

Source: `chunk-88zs4xb0.js` · offset 191417585 · sha256 `61989b74…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-88zs4xb0.js` offset 191417585.

**Undocumented**

### `TERM`

Source: `chunk-mbfze585.js` · offset 178170832 · sha256 `cd581ed8…` · 17 read sites

Read as: string (trimmed; empty is treated as unset). Values: `xterm-ghostty`, `cygwin`. Default (from code): `unset`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM`

Source: `chunk-mbfze585.js` · offset 178170939 · sha256 `75da1de5…` · 27 read sites

Read as: string (trimmed; empty is treated as unset). Values: `vscode`, `iTerm.app`, `Apple_Terminal`, `ghostty`, `WezTerm`, `tmux`, `mintty`. Default (from code): `unset`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM_VERSION`

Source: `chunk-f2cpzzp9.js` · offset 206881837 · sha256 `0dc37e73…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

Undocumented; read at `chunk-f2cpzzp9.js` offset 206881837.

**Undocumented**

### `TERMINAL`

Source: `chunk-8wcg99nb.js` · offset 202534867 · sha256 `541785d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8wcg99nb.js` offset 202534867.

**Undocumented**

### `TERMINAL_EMULATOR`

Source: `chunk-mbfze585.js` · offset 178170760 · sha256 `cf45b3e1…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `JetBrains-JediTerm`.

Undocumented; read at `chunk-mbfze585.js` offset 178170760.

**Undocumented**

### `TERMINATOR_UUID`

Source: `chunk-mbfze585.js` · offset 178171339 · sha256 `c7a22da2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171339.

**Undocumented**

### `TERMUX_VERSION`

Source: `chunk-9xzh0a1e.js` · offset 206559382 · sha256 `b7fed4d0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9xzh0a1e.js` offset 206559382.

**Undocumented**

### `TILIX_ID`

Source: `chunk-mbfze585.js` · offset 178171481 · sha256 `5765a66f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171481.

**Undocumented**

### `TMPDIR`

Source: `chunk-09m4fzsj.js` · offset 184505551 · sha256 `3d1885bc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184505551.

**Undocumented**

### `TMUX`

Source: `chunk-mbfze585.js` · offset 178171076 · sha256 `173755d8…` · 30 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 24 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171076.

**Undocumented**

### `TMUX_PANE`

Source: `chunk-nankzm0s.js` · offset 181070072 · sha256 `72526b2f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nankzm0s.js` offset 181070072.

**Undocumented**

### `USER`

Source: `chunk-fge68w3a.js` · offset 180460653 · sha256 `877808d9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-fge68w3a.js` offset 180460653.

**Undocumented**

### `USERNAME`

Source: `chunk-df0597gf.js` · offset 183569946 · sha256 `5a380695…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `ContainerAdministrator`, `ContainerUser`.

Undocumented; read at `chunk-df0597gf.js` offset 183569946.

**Undocumented**

### `USERPROFILE`

Source: `chunk-09m4fzsj.js` · offset 184473006 · sha256 `09f71f7e…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-09m4fzsj.js` offset 184473006.

**Undocumented**

### `UV_THREADPOOL_SIZE`

Source: `chunk-amg94xhm.js` · offset 213015564 · sha256 `6e9baec2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

Undocumented; read at `chunk-amg94xhm.js` offset 213015564.

**Undocumented**

### `VERCEL`

Source: `chunk-mbfze585.js` · offset 178174158 · sha256 `6ae3215a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174158.

**Undocumented**

### `VISUAL`

Source: `chunk-m42kzzy0.js` · offset 216395823 · sha256 `797f4100…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m42kzzy0.js` offset 216395823.

**Undocumented**

### `VisualStudioVersion`

Source: `chunk-mbfze585.js` · offset 178170704 · sha256 `c05a1490…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-mbfze585.js` offset 178170704.

**Undocumented**

### `VSCODE_GIT_ASKPASS_MAIN`

Source: `chunk-mbfze585.js` · offset 178170255 · sha256 `c0a2e4f9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178170255.

**Undocumented**

### `VTE_VERSION`

Source: `chunk-mbfze585.js` · offset 178171294 · sha256 `28245ba2…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171294.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-1y575bx8.js` · offset 185205602 · sha256 `71497285…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1y575bx8.js` offset 185205602.

**Undocumented**

### `WEBSITE_SITE_NAME`

Source: `chunk-mbfze585.js` · offset 178174931 · sha256 `861142fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174931.

**Undocumented**

### `WEBSITE_SKU`

Source: `chunk-mbfze585.js` · offset 178174962 · sha256 `4e4acf04…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178174962.

**Undocumented**

### `WINDIR`

Source: `chunk-c8t4wb5r.js` · offset 196528124 · sha256 `9be0888a…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-c8t4wb5r.js` offset 196528124.

**Undocumented**

### `WSL_DISTRO_NAME`

Source: `chunk-mbfze585.js` · offset 178171793 · sha256 `d98afa7f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171793.

**Undocumented**

### `WSL_INTEROP`

Source: `chunk-amhtwhch.js` · offset 178152885 · sha256 `69779847…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-amhtwhch.js` offset 178152885.

**Undocumented**

### `WT_SESSION`

Source: `chunk-jkt292h5.js` · offset 195664116 · sha256 `dff34227…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-jkt292h5.js` offset 195664116.

**Undocumented**

### `XDG_CACHE_HOME`

Source: `chunk-e2javxcw.js` · offset 214855748 · sha256 `fc06c22e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2javxcw.js` offset 214855748.

**Undocumented**

### `XDG_CONFIG_HOME`

Source: `chunk-8ptzhr8g.js` · offset 180384571 · sha256 `25bf23b7…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8ptzhr8g.js` offset 180384571.

**Undocumented**

### `XDG_DATA_HOME`

Source: `chunk-cnrmsnz4.js` · offset 199483416 · sha256 `b4814b29…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cnrmsnz4.js` offset 199483416.

**Undocumented**

### `XDG_RUNTIME_DIR`

Source: `chunk-5rsq52t8.js` · offset 200598020 · sha256 `d94ed14d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5rsq52t8.js` offset 200598020.

**Undocumented**

### `XDG_STATE_HOME`

Source: `chunk-e2javxcw.js` · offset 214855769 · sha256 `6042ebf5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2javxcw.js` offset 214855769.

**Undocumented**

### `XTERM_VERSION`

Source: `chunk-mbfze585.js` · offset 178171251 · sha256 `1f33c166…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mbfze585.js` offset 178171251.

**Undocumented**

### `ZED_TERM`

Source: `chunk-ckcph1xh.js` · offset 191511116 · sha256 `059fcfab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ckcph1xh.js` offset 191511116.

**Undocumented**

### `ZELLIJ`

Source: `chunk-f2cpzzp9.js` · offset 206881560 · sha256 `87944217…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f2cpzzp9.js` offset 206881560.

**Undocumented**

## Set by Claude Code for tools, hooks, and child processes

These are variables Claude Code sets. It either writes them into its own process environment, which children that inherit it receive, or adds them to the environment it builds for a specific child. Receivers are listed only where the code identifies the child; values are shown only when the code sets a literal. The same name can also appear in a read group above.

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-9yd2evp3.js` · offset 210729526 · sha256 `941c0b00…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-9yd2evp3.js` · offset 210729499 · sha256 `d62c59d0…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AI_AGENT`

Source: `chunk-09m4fzsj.js` · offset 184516997 · sha256 `2812c5b5…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `ALLOW_ANT_COMPUTER_USE_MCP`

Source: `chunk-mbfze585.js` · offset 178205019 · sha256 `99f0ac98…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-y191025q.js` · offset 192207737 · sha256 `c4906342…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: API key sent as `X-Api-Key` header.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-y191025q.js` · offset 192207697 · sha256 `62c1d0de…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-64smfct9.js` · offset 203756691 · sha256 `c0bd2dc3…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-mbfze585.js` · offset 178205053 · sha256 `7dfba6f1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-2gyndh7q.js` · offset 194201880 · sha256 `50834b45…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-2gyndh7q.js` · offset 194200645 · sha256 `05bfc132…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-2gyndh7q.js` · offset 194202018 · sha256 `fe95d446…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display description for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-2gyndh7q.js` · offset 194201957 · sha256 `a74fbf1a…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display name for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-2gyndh7q.js` · offset 194200562 · sha256 `4e81029a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-64smfct9.js` · offset 203755738 · sha256 `e2478441…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-mbfze585.js` · offset 178205081 · sha256 `dc67c87b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BROWSER`

Source: `chunk-jx00zmk1.js` · offset 205752809 · sha256 `a304f7a4…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `BUN_INSTALL_CACHE_DIR`

Source: `chunk-mphp7acd.js` · offset 189370896 · sha256 `7cb82960…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `BUN_OPTIONS`

Source: `chunk-mphp7acd.js` · offset 186599853 · sha256 `1af89f3d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CCR_AGENT_PROXY_CA_CERT_B64`

Source: `chunk-9yd2evp3.js` · offset 210729963 · sha256 `af759b13…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-9yd2evp3.js` · offset 210729825 · sha256 `46dce939…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-9yd2evp3.js` · offset 210729866 · sha256 `43aec7c7…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-9yd2evp3.js` · offset 210729787 · sha256 `e570d58a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-9yd2evp3.js` · offset 210729915 · sha256 `66a00414…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-mbfze585.js` · offset 178205111 · sha256 `7fa6ed02…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-mbfze585.js` · offset 178205138 · sha256 `d6e11091…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-mbfze585.js` · offset 178205172 · sha256 `791e5f41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178205203 · sha256 `b5825b3f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-mbfze585.js` · offset 178205232 · sha256 `431a14c2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-mbfze585.js` · offset 178205293 · sha256 `a6298536…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-mbfze585.js` · offset 178205328 · sha256 `fa80dede…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-mbfze585.js` · offset 178205375 · sha256 `7149cbaa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-mbfze585.js` · offset 178205421 · sha256 `c1f7d373…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-j0381q8k.js` · offset 201654183 · sha256 `f060c8d9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-9975a2ae.js` · offset 196166680 · sha256 `fac71fa9…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-mbfze585.js` · offset 178205491 · sha256 `1769a223…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178205525 · sha256 `57bc84ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Stall timeout in milliseconds for subagents.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-mbfze585.js` · offset 178205607 · sha256 `857902f0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-mbfze585.js` · offset 178205568 · sha256 `0c9a7c66…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-mbfze585.js` · offset 178205643 · sha256 `7d721a6e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-e2javxcw.js` · offset 214912717 · sha256 `87bff846…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_AUTO_MEMORY_OFF`

Source: `chunk-mbfze585.js` · offset 178205727 · sha256 `af4067c5…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-mbfze585.js` · offset 178205760 · sha256 `3b2d23eb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-mbfze585.js` · offset 178205785 · sha256 `a9152038…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-mbfze585.js` · offset 178205813 · sha256 `913c82c8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-mbfze585.js` · offset 178205857 · sha256 `2367b935…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-mbfze585.js` · offset 178205903 · sha256 `25c3bc9b…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-mbfze585.js` · offset 178205930 · sha256 `497d8e4c…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-mbfze585.js` · offset 178205966 · sha256 `0b6b1025…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-aa430wh3.js` · offset 196241235 · sha256 `7d7017df…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-jx00zmk1.js` · offset 205756481 · sha256 `503dc6b9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-jx00zmk1.js` · offset 205756552 · sha256 `a04d6c36…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-mbfze585.js` · offset 178206086 · sha256 `e424e5fc…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-aa430wh3.js` · offset 196241444 · sha256 `083017bf…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-mbfze585.js` · offset 178206164 · sha256 `0b874b51…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-mbfze585.js` · offset 178206188 · sha256 `42db3f37…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-aa430wh3.js` · offset 196240400 · sha256 `22bfd5ab…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-mbfze585.js` · offset 178206254 · sha256 `ee841635…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178206289 · sha256 `f2cead74…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_OAUTH_TOKEN`

Source: `chunk-mbfze585.js` · offset 178206319 · sha256 `a0197c79…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-mbfze585.js` · offset 178206352 · sha256 `44f53b82…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-mbfze585.js` · offset 178206391 · sha256 `9781c6ca…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-mbfze585.js` · offset 178206433 · sha256 `b371e19d…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-mbfze585.js` · offset 178206477 · sha256 `7f6724be…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-mbfze585.js` · offset 178206518 · sha256 `9d5ed0da…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-mbfze585.js` · offset 178206558 · sha256 `d676ae84…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-mbfze585.js` · offset 178206592 · sha256 `3ce766de…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_SESSION_INGRESS_URL`

Source: `chunk-mbfze585.js` · offset 178206630 · sha256 `3120ce1e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-mbfze585.js` · offset 178206671 · sha256 `0e49e0e2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-mbfze585.js` · offset 178206709 · sha256 `f9d1acdb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_TAB_GROUP_KEY`

Source: `chunk-0a47xg8f.js` · offset 178236187 · sha256 `e8684ede…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-mbfze585.js` · offset 178206781 · sha256 `f240b3b8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_HAIKU_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180943849 · sha256 `2d39b985…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180943754 · sha256 `4cf5a5d3…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180943658 · sha256 `b02f4a80…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_OPUS_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180944050 · sha256 `5189181f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_SEEDED_SONNET_DEFAULT`

Source: `chunk-nankzm0s.js` · offset 180943959 · sha256 `7fae7197…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-mbfze585.js` · offset 178206816 · sha256 `03e09a19…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-mbfze585.js` · offset 178206842 · sha256 `e3ec3072…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-mbfze585.js` · offset 178206894 · sha256 `945d75a6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-mbfze585.js` · offset 178206935 · sha256 `58b1c002…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-dgp2yyqt.js` · offset 195022145 · sha256 `7b925f03…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-b60bqfbx.js` · offset 185681913 · sha256 `5aa4148a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-van5my03.js` · offset 195650768 · sha256 `7afedd7f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_APPEND_PROMPT_HEAD`

Source: `chunk-dgp2yyqt.js` · offset 194983796 · sha256 `9f46488c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-mbfze585.js` · offset 178207053 · sha256 `7e158589…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSET_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178207162 · sha256 `353fd152…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-mbfze585.js` · offset 178207205 · sha256 `b92ee5e6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_LIVE_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178207243 · sha256 `d6d7d50b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SYNC_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178207285 · sha256 `d165c4c0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VIEWER_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178207327 · sha256 `6977fb71…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178207081 · sha256 `a8697850…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-mbfze585.js` · offset 178207123 · sha256 `4b48fde8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_STATUS_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178207371 · sha256 `83a24424…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-mbfze585.js` · offset 178207420 · sha256 `c5af87df…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_EXTERNAL_PERMISSIONS`

Source: `chunk-mbfze585.js` · offset 178207459 · sha256 `be2ef116…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-z75es3hd.js` · offset 192114587 · sha256 `d3bfcb14…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_TIER`

Source: `chunk-mbfze585.js` · offset 178207509 · sha256 `e78a7e84…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-mbfze585.js` · offset 178207543 · sha256 `e42ea399…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-mbfze585.js` · offset 178207571 · sha256 `98e7bd15…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-mbfze585.js` · offset 178207600 · sha256 `2e6f428c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-mbfze585.js` · offset 178207643 · sha256 `291e6832…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-mbfze585.js` · offset 178207684 · sha256 `8527c8c9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-mbfze585.js` · offset 178207729 · sha256 `e4196573…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-758hjhx1.js` · offset 180369120 · sha256 `53dd4137…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-mbfze585.js` · offset 178207816 · sha256 `bd63fea2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-mbfze585.js` · offset 178207861 · sha256 `10170efa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-mbfze585.js` · offset 178207902 · sha256 `33c792a8…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_SESSION_ID`

Source: `chunk-6jn8dvb3.js` · offset 185275333 · sha256 `8549f3ec…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set automatically in Bash tool and hook command subprocesses while the session has an active Remote Control connection, and removed when the connection ends.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BRIDGE_SOURCE_DIR`

Source: `chunk-mbfze585.js` · offset 178207979 · sha256 `e167aeb1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-mbfze585.js` · offset 178208016 · sha256 `9a93b458…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-mbfze585.js` · offset 178208041 · sha256 `3f54dc5b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-mbfze585.js` · offset 178208073 · sha256 `c9f10067…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-09m4fzsj.js` · offset 184516871 · sha256 `5ca39f62…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`.

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-amg94xhm.js` · offset 213019784 · sha256 `f90629e3…` · 2 read sites

Set for: stdio MCP servers.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-mbfze585.js` · offset 178208104 · sha256 `ab333f18…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-dgp2yyqt.js` · offset 195048368 · sha256 `5553bf4b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONFIG_PROBE`

Source: `chunk-mbfze585.js` · offset 178208142 · sha256 `964c3294…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-mbfze585.js` · offset 178208174 · sha256 `dd0f18f8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-ebcyvbxn.js` · offset 185545240 · sha256 `deebb752…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-mbfze585.js` · offset 178208206 · sha256 `8797ed73…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-mbfze585.js` · offset 178208252 · sha256 `56a11cf0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-mbfze585.js` · offset 178208289 · sha256 `6ba6941b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-mbfze585.js` · offset 178208316 · sha256 `3f654218…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DEV_RAW_CHANGELOG_URL`

Source: `chunk-mbfze585.js` · offset 178208355 · sha256 `d569aa59…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DISABLE_ATTRIBUTION_BASELINE_REUSE`

Source: `chunk-mbfze585.js` · offset 178208396 · sha256 `cc649bb1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-mbfze585.js` · offset 178208450 · sha256 `4a94753a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-dgp2yyqt.js` · offset 195020550 · sha256 `1d80e502…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-z75es3hd.js` · offset 192114694 · sha256 `547fd99f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-mbfze585.js` · offset 178208500 · sha256 `e486ae2c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-mbfze585.js` · offset 178208543 · sha256 `07a9570a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-mbfze585.js` · offset 178208588 · sha256 `a835d626…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-mbfze585.js` · offset 178208628 · sha256 `a7b9915e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-mbfze585.js` · offset 178208670 · sha256 `b04e28d3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-mbfze585.js` · offset 178208710 · sha256 `d33e53d1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-mbfze585.js` · offset 178208746 · sha256 `6993ffe4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-mbfze585.js` · offset 178208798 · sha256 `79af481a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-mbfze585.js` · offset 178208843 · sha256 `5d4a3c57…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-mbfze585.js` · offset 178208882 · sha256 `147671cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-dgp2yyqt.js` · offset 194968320 · sha256 `b9040413…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-0a47xg8f.js` · offset 178236313 · sha256 `446a0dfc…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `local-agent`; `sdk-cli`; `mcp`; `claude-code-github-action`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-mbfze585.js` · offset 178208955 · sha256 `2831eb16…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-mbfze585.js` · offset 178208991 · sha256 `2aba8c98…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-mbfze585.js` · offset 178209037 · sha256 `d6a1ba5e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-e2javxcw.js` · offset 215028937 · sha256 `02ae815b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXECPATH`

Source: `chunk-mphp7acd.js` · offset 186599781 · sha256 `a4da5322…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-mbfze585.js` · offset 178209070 · sha256 `89e84f24…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-mbfze585.js` · offset 178209113 · sha256 `351ba814…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-z75es3hd.js` · offset 192114487 · sha256 `f495f99b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: JSON object to merge into the top level of every API request body.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-mbfze585.js` · offset 178209154 · sha256 `00757978…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-mbfze585.js` · offset 178209192 · sha256 `10e8df3c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_BRIDGE`

Source: `chunk-mbfze585.js` · offset 178209228 · sha256 `e4eea4aa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_EVALUATE_MEMORY`

Source: `chunk-mbfze585.js` · offset 178209260 · sha256 `24933701…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-mbfze585.js` · offset 178209301 · sha256 `fa504a3e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_MEMORY_SURVEY`

Source: `chunk-mbfze585.js` · offset 178209344 · sha256 `8814e64c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_TIP_ID`

Source: `chunk-mbfze585.js` · offset 178209383 · sha256 `962226bb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-mnp9k227.js` · offset 180501580 · sha256 `3b31760f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-mbfze585.js` · offset 178209415 · sha256 `0e78d6f2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-mbfze585.js` · offset 178209448 · sha256 `9e69aeac…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in seconds for Glob tool file discovery.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-mbfze585.js` · offset 178209488 · sha256 `e2599632…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-mbfze585.js` · offset 178209528 · sha256 `d81b1b4e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-mbfze585.js` · offset 178209566 · sha256 `2df73bdc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178209610 · sha256 `a4dd3534…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178209655 · sha256 `49b7e8be…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-01653fey.js` · offset 196320299 · sha256 `38d892b2…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-z75es3hd.js` · offset 192114398 · sha256 `00e86f7e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-mbfze585.js` · offset 178209703 · sha256 `5196b51b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PROMPT_SUPERSEDES_RECORD`

Source: `chunk-mbfze585.js` · offset 178209736 · sha256 `78462a09…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-mbfze585.js` · offset 178209785 · sha256 `94e410ce…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-mbfze585.js` · offset 178209820 · sha256 `5db44d47…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the host address used to connect to the IDE extension.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-mbfze585.js` · offset 178209857 · sha256 `0d14f5d3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-mbfze585.js` · offset 178209899 · sha256 `1d523eae…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_INVOKED_SKILLS`

Source: `chunk-mphp7acd.js` · offset 186599920 · sha256 `de042d2a…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-mbfze585.js` · offset 178209939 · sha256 `4741bf17…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-mbfze585.js` · offset 178209968 · sha256 `93acfd26…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-mbfze585.js` · offset 178210001 · sha256 `cb450c61…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-mbfze585.js` · offset 178210035 · sha256 `d9159a70…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MANAGED_SETTINGS_PATH`

Source: `chunk-mbfze585.js` · offset 178210070 · sha256 `cd6c8772…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_NAME`

Source: `chunk-fwf64yxz.js` · offset 183792101 · sha256 `8df357a4…`

Set for: marketplace headersHelper command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_URL`

Source: `chunk-fwf64yxz.js` · offset 183792055 · sha256 `b176eb5e…`

Set for: marketplace headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-mbfze585.js` · offset 178210111 · sha256 `a5de23ff…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-mbfze585.js` · offset 178210155 · sha256 `6d2427e9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-mbfze585.js` · offset 178210201 · sha256 `58b75540…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-mbfze585.js` · offset 178210245 · sha256 `d54272ab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-mbfze585.js` · offset 178210293 · sha256 `7e273fc6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-mbfze585.js` · offset 178210330 · sha256 `14af877b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-mbfze585.js` · offset 178210363 · sha256 `826145cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-mbfze585.js` · offset 178210405 · sha256 `9b3ff028…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-mbfze585.js` · offset 178210449 · sha256 `821cfdb4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS`

Source: `chunk-mbfze585.js` · offset 178210486 · sha256 `8a609d3f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_PREWAIT_SERVERS_MS`

Source: `chunk-mbfze585.js` · offset 178210525 · sha256 `411cd225…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_SERVER_NAME`

Source: `chunk-8f36gf8z.js` · offset 212639793 · sha256 `0a578ed5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_SERVER_URL`

Source: `chunk-8f36gf8z.js` · offset 212639823 · sha256 `024bb5f5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-mbfze585.js` · offset 178210567 · sha256 `4bd4bce8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-mbfze585.js` · offset 178210606 · sha256 `c8b8dfa0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Idle timeout in milliseconds for MCP tool calls.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-mbfze585.js` · offset 178210647 · sha256 `b0c76e59…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-1sb33067.js` · offset 210926574 · sha256 `0303406e…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MESSAGING_TOKEN`

Source: `chunk-1sb33067.js` · offset 210926615 · sha256 `038194ec…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports this per-session token to hooks and Bash commands alongside `CLAUDE_CODE_MESSAGING_SOCKET`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MOCK_REMOTE_SETTINGS`

Source: `chunk-mbfze585.js` · offset 178210689 · sha256 `05b67802…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MOCK_TRIAL`

Source: `chunk-mbfze585.js` · offset 178210729 · sha256 `417aa0b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-8j1q755t.js` · offset 202120592 · sha256 `6c5df5de…` · 7 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: OAuth access token for claude.ai authentication.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OVERRIDE_DATE`

Source: `chunk-mbfze585.js` · offset 178210759 · sha256 `2fd5d270…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-mbfze585.js` · offset 178210792 · sha256 `5ced52e0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-mbfze585.js` · offset 178210837 · sha256 `fe501dc7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-mbfze585.js` · offset 178210880 · sha256 `5d6b5cdc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-mbfze585.js` · offset 178210919 · sha256 `acd5da96…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to enable Perforce-aware write protection.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-mbfze585.js` · offset 178210952 · sha256 `679a4dea…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-mbfze585.js` · offset 178210991 · sha256 `2d04518c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ARCHIVE_URL`

Source: `chunk-fwf64yxz.js` · offset 183792729 · sha256 `c4405f96…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-mbfze585.js` · offset 178211038 · sha256 `855e9a57…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-mbfze585.js` · offset 178211076 · sha256 `927159b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the plugins root directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-2qkrgkcd.js` · offset 192183248 · sha256 `e866bde0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value (set only under a condition).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178211112 · sha256 `e6fe86b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_NAME`

Source: `chunk-fwf64yxz.js` · offset 183792692 · sha256 `60d6a445…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-mbfze585.js` · offset 178211153 · sha256 `8279f285…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-mbfze585.js` · offset 178211188 · sha256 `a09a8e7c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-mbfze585.js` · offset 178211224 · sha256 `eb010882…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-mbfze585.js` · offset 178211267 · sha256 `6bf4575c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-mbfze585.js` · offset 178211308 · sha256 `944e2be8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-mbfze585.js` · offset 178211346 · sha256 `347319bc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROXY_AUTHENTICATE`

Source: `chunk-bv2dmc76.js` · offset 190308346 · sha256 `3233d74f…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_HOST`

Source: `chunk-bv2dmc76.js` · offset 190308313 · sha256 `e651775d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_URL`

Source: `chunk-bv2dmc76.js` · offset 190308265 · sha256 `a68a4b7d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178211382 · sha256 `f086d312…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-mbfze585.js` · offset 178211423 · sha256 `9b8cd076…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-mbfze585.js` · offset 178211460 · sha256 `cf695f0e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-mbfze585.js` · offset 178211510 · sha256 `95c080a8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-mnp9k227.js` · offset 180499280 · sha256 `cce5dc89…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_HOME_TRUST`

Source: `chunk-mbfze585.js` · offset 178211553 · sha256 `ee1e5b00…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-j3y05f4x.js` · offset 192044243 · sha256 `855e6b83…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-mbfze585.js` · offset 178211634 · sha256 `357413c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-mbfze585.js` · offset 178211660 · sha256 `f36511fb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-mbfze585.js` · offset 178211703 · sha256 `9f387483…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-mbfze585.js` · offset 178211743 · sha256 `9e7f35f9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_RAW_EVENTS_FILE`

Source: `chunk-mbfze585.js` · offset 178211780 · sha256 `d016c59a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-mbfze585.js` · offset 178211822 · sha256 `6d25194e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-mbfze585.js` · offset 178211864 · sha256 `078276cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically in cloud sessions to the current session's ID.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-mbfze585.js` · offset 178211901 · sha256 `79738897…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_PATH`

Source: `chunk-mbfze585.js` · offset 178211942 · sha256 `ea7adee4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_POLL_MS`

Source: `chunk-mbfze585.js` · offset 178211982 · sha256 `44f34959…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPL`

Source: `chunk-mbfze585.js` · offset 178212025 · sha256 `de2e994e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-mbfze585.js` · offset 178212049 · sha256 `ca6ee439…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-f2cpzzp9.js` · offset 206796518 · sha256 `b52ac6d1…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value (set only under a condition).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESULT_NONCE`

Source: `chunk-5ka0mc07.js` · offset 205665838 · sha256 `b1fbd25a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-mbfze585.js` · offset 178212145 · sha256 `ef812a01…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-mbfze585.js` · offset 178212184 · sha256 `5810206c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-mbfze585.js` · offset 178212227 · sha256 `8eb0cafc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-mbfze585.js` · offset 178212281 · sha256 `81aeb7e8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-mbfze585.js` · offset 178212314 · sha256 `48276cd4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-mbfze585.js` · offset 178212347 · sha256 `3bd94d96…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-mbfze585.js` · offset 178212386 · sha256 `215a267b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-mbfze585.js` · offset 178212430 · sha256 `ff57c53b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-mbfze585.js` · offset 178212472 · sha256 `8eed9531…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-dgp2yyqt.js` · offset 195020512 · sha256 `e2d01209…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-mbfze585.js` · offset 178212553 · sha256 `77ef6b0d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-mbfze585.js` · offset 178212582 · sha256 `153cb348…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-bysrnexw.js` · offset 216014545 · sha256 `6af06b37…` · 5 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_READS_SESSION_STATE`

Source: `chunk-mbfze585.js` · offset 178212645 · sha256 `37b7b5aa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-8xhw5h9f.js` · offset 190453359 · sha256 `fa932452…` · 8 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value (set only under a condition).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-09m4fzsj.js` · offset 184516901 · sha256 `9bad861a…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1` or `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-09m4fzsj.js` · offset 184516836 · sha256 `475db269…` · 5 read sites

Set for: stdio MCP servers; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-mbfze585.js` · offset 178212765 · sha256 `0d638613…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-mbfze585.js` · offset 178212797 · sha256 `30578ba8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-mbfze585.js` · offset 178212829 · sha256 `d1fb4580…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-mbfze585.js` · offset 178212863 · sha256 `7ee7a1d1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178212688 · sha256 `2f554dd5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-mbfze585.js` · offset 178212924 · sha256 `21007174…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the shell Claude Code uses to run Bash tool commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-mbfze585.js` · offset 178212949 · sha256 `2ff1e5a2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-dgp2yyqt.js` · offset 195020469 · sha256 `1cc8c889…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-mbfze585.js` · offset 178213007 · sha256 `cb76c312…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-mbfze585.js` · offset 178213047 · sha256 `5330f743…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-mbfze585.js` · offset 178213084 · sha256 `a4f49836…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-mbfze585.js` · offset 178213122 · sha256 `647bf0a7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-mbfze585.js` · offset 178213150 · sha256 `f801584b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-mbfze585.js` · offset 178213198 · sha256 `9b37c916…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-mbfze585.js` · offset 178213241 · sha256 `14bbf21b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-4zgx6txq.js` · offset 193131378 · sha256 `b0db2d18…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-mnp9k227.js` · offset 180499200 · sha256 `2815a03c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-mbfze585.js` · offset 178213320 · sha256 `559f3f00…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213548 · sha256 `cc616c4e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for synchronous plugin installation.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-mbfze585.js` · offset 178213350 · sha256 `21972090…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-mbfze585.js` · offset 178213400 · sha256 `ba051584…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213450 · sha256 `599002be…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213501 · sha256 `272ba8ce…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-mbfze585.js` · offset 178213598 · sha256 `0e32bed7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-mbfze585.js` · offset 178213638 · sha256 `a22a49a6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213675 · sha256 `10b645f4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213725 · sha256 `000d90dd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-mbfze585.js` · offset 178213772 · sha256 `f46f2cde…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `false` to disable syntax highlighting in diff output.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-mbfze585.js` · offset 178213808 · sha256 `c878d7c5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-mbfze585.js` · offset 178213852 · sha256 `8ee37c4c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-mbfze585.js` · offset 178213876 · sha256 `f792174a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Share a task list across sessions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178213908 · sha256 `2761ff9e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-mbfze585.js` · offset 178213957 · sha256 `d788d244…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-mbfze585.js` · offset 178213995 · sha256 `0fb5d7d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-mbfze585.js` · offset 178214038 · sha256 `c3bd3c51…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FORCE_DENY`

Source: `chunk-mbfze585.js` · offset 178214076 · sha256 `76ebf428…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_GIT_BASH`

Source: `chunk-mbfze585.js` · offset 178214111 · sha256 `e51972e1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_PWSH`

Source: `chunk-mbfze585.js` · offset 178214147 · sha256 `45297c20…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-mbfze585.js` · offset 178214179 · sha256 `cb58cd47…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Override the temp directory used for internal temp files.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-mbfze585.js` · offset 178214205 · sha256 `675447cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-mbfze585.js` · offset 178214236 · sha256 `6946af65…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-mbfze585.js` · offset 178214277 · sha256 `02aa1fc4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-mbfze585.js` · offset 178214309 · sha256 `6ae692e8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-mbfze585.js` · offset 178214343 · sha256 `6818544c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-mbfze585.js` · offset 178214389 · sha256 `050cb0d1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-mbfze585.js` · offset 178214426 · sha256 `5409b5fe…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-f2cpzzp9.js` · offset 206767044 · sha256 `48b906bb…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-mbfze585.js` · offset 178214493 · sha256 `a7ea246a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-mbfze585.js` · offset 178214522 · sha256 `f0726bdf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-mbfze585.js` · offset 178214571 · sha256 `39c8b0f8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178214616 · sha256 `3034df94…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_VERSION`

Source: `chunk-f1vb7bx7.js` · offset 179240488 · sha256 `8b03a206…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-mbfze585.js` · offset 178214658 · sha256 `1269b347…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-mbfze585.js` · offset 178214706 · sha256 `c04d4ce8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-mbfze585.js` · offset 178214749 · sha256 `59dae6bf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-mbfze585.js` · offset 178214781 · sha256 `82ee462e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-mbfze585.js` · offset 178214821 · sha256 `49336f4c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the configuration directory (default: `~/.claude`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-mbfze585.js` · offset 178214846 · sha256 `3998e12f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-mbfze585.js` · offset 178214891 · sha256 `0b3d9b1b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-mbfze585.js` · offset 178214930 · sha256 `850f384d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-mbfze585.js` · offset 178214972 · sha256 `10d3136f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_EFFORT`

Source: `chunk-09m4fzsj.js` · offset 184517047 · sha256 `79c852b9…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

From docs: Set automatically in Bash tool subprocesses and hook commands to the effort level in effect when the subprocess starts: `low`, `medium`, `high`, `xhigh`, or `max`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-mbfze585.js` · offset 178215014 · sha256 `95b36f7f…` · 2 read sites

Set for: hook commands.

Value: a runtime value (set only under a condition). Condition values in code: `SessionStart`, `Setup`, `CwdChanged`, `FileChanged`.

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-mbfze585.js` · offset 178215037 · sha256 `ef6cf9cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-h595p29c.js` · offset 210946975 · sha256 `23a7a3fc…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-mbfze585.js` · offset 178215115 · sha256 `83ed306d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-mbfze585.js` · offset 178215151 · sha256 `be91ff29…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_MEMORY_STORES`

Source: `chunk-mbfze585.js` · offset 178215173 · sha256 `68b83d9a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PID`

Source: `chunk-09m4fzsj.js` · offset 184516943 · sha256 `51f03cbe…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: Claude Code's process ID.

From docs: Claude Code sets this to its own process ID in the subprocesses it spawns: Bash and PowerShell tool commands and hook commands.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_PLUGIN_DATA`

Source: `chunk-mphp7acd.js` · offset 186027903 · sha256 `ebf148bc…` · 3 read sites

Set for: plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_OPTION_*`

Source: `chunk-mphp7acd.js` · offset 188012349 · sha256 `584850f7…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_ROOT`

Source: `chunk-8f36gf8z.js` · offset 212639863 · sha256 `8c52d608…` · 5 read sites

Set for: MCP server headersHelper command; plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_PROJECT_DIR`

Source: `chunk-amg94xhm.js` · offset 213019662 · sha256 `890d6e62…` · 6 read sites

Set for: stdio MCP servers; hook commands.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-mbfze585.js` · offset 178215201 · sha256 `a036e87e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-mbfze585.js` · offset 178215228 · sha256 `f51a9466…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-aa430wh3.js` · offset 196241158 · sha256 `b735c221…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-mbfze585.js` · offset 178215287 · sha256 `0cd0f658…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-dgp2yyqt.js` · offset 194965457 · sha256 `71c63b4c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-dgp2yyqt.js` · offset 195026085 · sha256 `14bd408c…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-mbfze585.js` · offset 178215410 · sha256 `afaa63fc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-mbfze585.js` · offset 178215445 · sha256 `77dd994e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ACCOUNT_EMAIL`

Source: `chunk-nmm61j3j.js` · offset 190698773 · sha256 `7d21deed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Email of the account that enqueued the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACCOUNT_ID`

Source: `chunk-nmm61j3j.js` · offset 190698824 · sha256 `8c6c4c78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Tagged ID of the account that enqueued the session, for per-account routing, quota, or chargeback.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-mbfze585.js` · offset 178215482 · sha256 `778a62ae…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ATTEMPT`

Source: `chunk-nmm61j3j.js` · offset 190698687 · sha256 `918c8041…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many spawn requests this session has had.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CLIENT_PLATFORM`

Source: `chunk-nmm61j3j.js` · offset 190699185 · sha256 `25dd9f8d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The client surface that created the session, such as `web_claude_ai`, `desktop_app`, `ios`, `claude_code_cli`, or `scheduled_trigger`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CORRELATION_ID`

Source: `chunk-nmm61j3j.js` · offset 190699132 · sha256 `428b1c25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The correlation ID supplied at session create, echoed back so the hook can map this work order to the request that created the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-mbfze585.js` · offset 178215515 · sha256 `a774db47…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Git fetch depth for fresh clones.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_ORDER_ID`

Source: `chunk-nmm61j3j.js` · offset 190698523 · sha256 `f9fe867a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Opaque idempotency key, unique per spawn request and safe for Kubernetes resource names.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ORDER_SERVER_TIME`

Source: `chunk-nmm61j3j.js` · offset 190698869 · sha256 `d03989a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Server time from the poll response's HTTP `Date` header.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_POOL_ID`

Source: `chunk-nmm61j3j.js` · offset 190698734 · sha256 `da2ebaa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The ID of the environment the new runner should join, in `ccpool_...` form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_REVISION`

Source: `chunk-nmm61j3j.js` · offset 190698979 · sha256 `292d83d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Revision of the session's first git source: branch, SHA, or tag.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_URL`

Source: `chunk-nmm61j3j.js` · offset 190698922 · sha256 `3be603cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: URL of the session's first git source, for routing to a runner with that repository pre-warmed.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_REPO_SOURCES`

Source: `chunk-nmm61j3j.js` · offset 190699046 · sha256 `165f653f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON array of `{url, revision}` for all the session's git sources, for hooks that route on a secondary repository.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-nmm61j3j.js` · offset 190698559 · sha256 `c997f82b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_UUID`

Source: `chunk-nmm61j3j.js` · offset 190698640 · sha256 `2c8246b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The same session ID in canonical UUID form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_WORK_ORDER_FILE`

Source: `chunk-nmm61j3j.js` · offset 190698491 · sha256 `48f0b1f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a temp file containing the signed work-order JWT the new runner registers with.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-mbfze585.js` · offset 178215548 · sha256 `c799f235…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_SERVE_DRAIN_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178215587 · sha256 `40ac4459…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SNIP`

Source: `chunk-mbfze585.js` · offset 178215624 · sha256 `a6cf9cf2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_LOCAL_BINARY`

Source: `chunk-mbfze585.js` · offset 178215643 · sha256 `a3756972…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_VERSION`

Source: `chunk-mbfze585.js` · offset 178215674 · sha256 `f73782ea…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-mbfze585.js` · offset 178215700 · sha256 `4f8894fd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_TEST_PROJECT_DIR`

Source: `chunk-pc2yga7y.js` · offset 211044865 · sha256 `38ee8375…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `${CLAUDE_PROJECT_DIR}`.

No read site found by this scan.

**Undocumented**

### `CLAUDE_TMPDIR`

Source: `chunk-mbfze585.js` · offset 178215730 · sha256 `18483433…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-09m4fzsj.js` · offset 184516821 · sha256 `8eeb7c77…` · 6 read sites

Set for: stdio MCP servers; the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`; a runtime value.

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `COLUMNS`

Source: `chunk-mphp7acd.js` · offset 188012107 · sha256 `c75b3fe7…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `DEBUG`

Source: `chunk-e6m248dn.js` · offset 179605461 · sha256 `0c351e1e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-q1842b1c.js` · offset 195270377 · sha256 `f6740586…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to disable automatic background updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISPLAY`

Source: `chunk-mphp7acd.js` · offset 189059998 · sha256 `7e8467cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GCM_INTERACTIVE`

Source: `chunk-sk0av50v.js` · offset 190352022 · sha256 `1fbc6f02…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023883 · sha256 `0eb60ad6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023855 · sha256 `db7e4b41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ALLOW_PROTOCOL`

Source: `chunk-1mj5vjep.js` · offset 198904830 · sha256 `978ef170…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `https:http:ssh`; a runtime value; `none` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-w7hy7pqe.js` · offset 183726667 · sha256 `75863e95…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_AUTHOR_DATE`

Source: `chunk-mphp7acd.js` · offset 189720393 · sha256 `0913b870…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_EMAIL`

Source: `chunk-mphp7acd.js` · offset 189720349 · sha256 `a0a27899…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff@localhost`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_NAME`

Source: `chunk-mphp7acd.js` · offset 189720316 · sha256 `6536e127…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff`.

No read site found by this scan.

**Undocumented**

### `GIT_CEILING_DIRECTORIES`

Source: `chunk-09m4fzsj.js` · offset 184932698 · sha256 `824a5ab2…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_DATE`

Source: `chunk-mphp7acd.js` · offset 189720511 · sha256 `3b626dd6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_EMAIL`

Source: `chunk-mphp7acd.js` · offset 189720464 · sha256 `1588ebba…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff@localhost`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_NAME`

Source: `chunk-mphp7acd.js` · offset 189720428 · sha256 `bebb3b59…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff`.

No read site found by this scan.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-8xhw5h9f.js` · offset 190442568 · sha256 `ef00c0bc…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-e2javxcw.js` · offset 215000292 · sha256 `c41b4f9a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-mphp7acd.js` · offset 186599880 · sha256 `5bc3d02d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-8xhw5h9f.js` · offset 190442598 · sha256 `c6cdecc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_EDITOR`

Source: `chunk-mphp7acd.js` · offset 186611477 · sha256 `d8fae42f…` · 3 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `true`.

No read site found by this scan.

**Undocumented**

### `GIT_INDEX_FILE`

Source: `chunk-09m4fzsj.js` · offset 184953778 · sha256 `c27d7089…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_NO_LAZY_FETCH`

Source: `chunk-mphp7acd.js` · offset 188836629 · sha256 `51d9fbb1…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_OBJECT_DIRECTORY`

Source: `chunk-2xynv749.js` · offset 214002908 · sha256 `f4c79723…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_OPTIONAL_LOCKS`

Source: `chunk-mphp7acd.js` · offset 189716742 · sha256 `671e967a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_PROGRESS_DELAY`

Source: `chunk-sk0av50v.js` · offset 190352068 · sha256 `f07c9246…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-fmv8bhm3.js` · offset 178987684 · sha256 `bc2d54c4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-1mj5vjep.js` · offset 198904738 · sha256 `77cda1e9…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `false` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SSH_VARIANT`

Source: `chunk-w7hy7pqe.js` · offset 183726632 · sha256 `b8f50626…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-8xhw5h9f.js` · offset 190557090 · sha256 `ebaa1d2e…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023906 · sha256 `4dd424ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185023867 · sha256 `588127ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITLAB_ACCESS_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185036149 · sha256 `ed5747c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `GITLAB_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185036129 · sha256 `fa287e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `HOME`

Source: `chunk-e2javxcw.js` · offset 215000206 · sha256 `6926099c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `HOMEBREW_NO_AUTO_UPDATE`

Source: `chunk-2t7nhzwg.js` · offset 195936997 · sha256 `7a329310…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LANGUAGE`

Source: `chunk-wm8f7gyy.js` · offset 211127051 · sha256 `c56805bc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LC_ALL`

Source: `chunk-4ftr5ny9.js` · offset 180547296 · sha256 `d93853ac…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `C`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `LINES`

Source: `chunk-mphp7acd.js` · offset 188012135 · sha256 `8ef4975f…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-mbfze585.js` · offset 178215751 · sha256 `db965028…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-mbfze585.js` · offset 178215805 · sha256 `fe11ff9d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-mbfze585.js` · offset 178215771 · sha256 `42c7f337…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-mbfze585.js` · offset 178215835 · sha256 `33518161…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Turns the MCP discovery cache on or off.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-mbfze585.js` · offset 178215862 · sha256 `30cc9b79…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-mbfze585.js` · offset 178215901 · sha256 `f814ea03…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-mbfze585.js` · offset 178215936 · sha256 `342d2be3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-mbfze585.js` · offset 178215969 · sha256 `60e8bfa4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-mbfze585.js` · offset 178216000 · sha256 `b2095bc8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-mbfze585.js` · offset 178216037 · sha256 `d2a3fbc0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-mbfze585.js` · offset 178216069 · sha256 `47204cf1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-mbfze585.js` · offset 178216116 · sha256 `80de992f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-mbfze585.js` · offset 178216142 · sha256 `85451193…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-mbfze585.js` · offset 178216182 · sha256 `53c1a6aa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-mbfze585.js` · offset 178216201 · sha256 `48e641e9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-mbfze585.js` · offset 178216225 · sha256 `cd0de528…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NODE_ENV`

Source: `chunk-4ftr5ny9.js` · offset 180547274 · sha256 `6541f2a8…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `production`.

No read site found by this scan.

**Undocumented**

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-5nvfqwef.js` · offset 194186746 · sha256 `92a4b4bf…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NoDefaultCurrentDirectoryInExePath`

Source: `chunk-j0381q8k.js` · offset 201650654 · sha256 `91bf70a2…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

No read site found by this scan.

**Undocumented**

### `OAUTH_TOKEN`

Source: `chunk-09m4fzsj.js` · offset 185036176 · sha256 `4c09c85b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-pc840nxb.js` · offset 210874993 · sha256 `c023412c…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `delta`.

From docs: Metrics temporality preference (default: `delta`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `PATH`

Source: `chunk-e2javxcw.js` · offset 214796353 · sha256 `5ed8d9f7…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/usr/bin:/bin`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `PS1`

Source: `chunk-14tr5h02.js` · offset 198013686 · sha256 `c1e1ae25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `PS2`

Source: `chunk-14tr5h02.js` · offset 198013693 · sha256 `462b4728…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-mbfze585.js` · offset 178216263 · sha256 `1a24b3e1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-8xhw5h9f.js` · offset 190583306 · sha256 `a4a3bf3e…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190582345 · sha256 `b4d8a2cd…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-8xhw5h9f.js` · offset 190582091 · sha256 `137420cd…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190581801 · sha256 `32f3aac1…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-bv2dmc76.js` · offset 190276121 · sha256 `a4acc82d…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190577354 · sha256 `b823b44a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-8xhw5h9f.js` · offset 190558825 · sha256 `334958a4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-8xhw5h9f.js` · offset 190580468 · sha256 `cd2ffa47…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-8xhw5h9f.js` · offset 190580140 · sha256 `ed5602f5…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-bv2dmc76.js` · offset 190276083 · sha256 `68243b99…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190581306 · sha256 `263c3395…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-bv2dmc76.js` · offset 190276166 · sha256 `2bd21780…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-bv2dmc76.js` · offset 190276220 · sha256 `ef192279…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-8xhw5h9f.js` · offset 190583732 · sha256 `956d5462…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190582624 · sha256 `539370ee…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-8xhw5h9f.js` · offset 190580780 · sha256 `e15bb9a7…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-8xhw5h9f.js` · offset 190582954 · sha256 `96c946da…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-mbfze585.js` · offset 178216285 · sha256 `a8e1c1a2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SHELL`

Source: `chunk-2ejbgdvw.js` · offset 178893770 · sha256 `d0ad950e…` · 4 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-mbfze585.js` · offset 178216312 · sha256 `d9958753…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `SSH_ASKPASS`

Source: `chunk-w7hy7pqe.js` · offset 183726718 · sha256 `b5b0f80f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-mbfze585.js` · offset 178216350 · sha256 `d7cca943…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TEMP`

Source: `chunk-e2javxcw.js` · offset 215000266 · sha256 `abe2607f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TERM`

Source: `chunk-14tr5h02.js` · offset 198013700 · sha256 `841346ef…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `dumb`; `xterm-256color`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-mbfze585.js` · offset 178216388 · sha256 `08d8ea9a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMP`

Source: `chunk-e2javxcw.js` · offset 215000253 · sha256 `7e51b28f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TMPDIR`

Source: `chunk-e2javxcw.js` · offset 215000237 · sha256 `904359e8…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMPPREFIX`

Source: `chunk-mphp7acd.js` · offset 186599841 · sha256 `47a8d8f7…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `TMUX`

Source: `chunk-mphp7acd.js` · offset 186599804 · sha256 `db982b13…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TRACEPARENT`

Source: `chunk-09m4fzsj.js` · offset 184517113 · sha256 `aab96fde…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ULTRAPLAN_PROMPT_FILE`

Source: `chunk-mbfze585.js` · offset 178216427 · sha256 `4d60f011…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `USER_TYPE`

Source: `chunk-4ftr5ny9.js` · offset 180547253 · sha256 `63ec52da…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `external`.

No read site found by this scan.

**Undocumented**

### `USERPROFILE`

Source: `chunk-e2javxcw.js` · offset 215000218 · sha256 `3a88058a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VCR_RECORD`

Source: `chunk-mbfze585.js` · offset 178216456 · sha256 `b2477c38…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-mbfze585.js` · offset 178216474 · sha256 `f1b319d8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-mbfze585.js` · offset 178216500 · sha256 `7d3a94d2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-mphp7acd.js` · offset 189060009 · sha256 `bbd32953…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

## Read only by bundled third-party libraries

These names are read only by code with no Claude Code evidence: no typed-schema entry, no first-party boolean helper, no Claude Code name prefix, and no docs entry. That is most likely bundled third-party library code. They are listed for completeness.

### `_X_AMZN_TRACE_ID`

Source: `chunk-jxvcdtxk.js` · offset 197065095 · sha256 `17f869aa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-jxvcdtxk.js` offset 197065095.

**Undocumented**

### `AWS_ACCOUNT_ID`

Source: `chunk-pe7q82cy.js` · offset 196927452 · sha256 `757201c8…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pe7q82cy.js` offset 196927452.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN`

Source: `chunk-ar7e1323.js` · offset 211924815 · sha256 `4144f535…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ar7e1323.js` offset 211924815.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`

Source: `chunk-jw8e5w4q.js` · offset 211933595 · sha256 `858c3edf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-jw8e5w4q.js` offset 211933595.

**Undocumented**

### `AWS_CREDENTIAL_EXPIRATION`

Source: `chunk-pe7q82cy.js` · offset 196927418 · sha256 `ec172743…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pe7q82cy.js` offset 196927418.

**Undocumented**

### `AWS_CREDENTIAL_SCOPE`

Source: `chunk-pe7q82cy.js` · offset 196927435 · sha256 `471e850e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pe7q82cy.js` offset 196927435.

**Undocumented**

### `AWS_EC2_METADATA_DISABLED`

Source: `chunk-jxvcdtxk.js` · offset 197199677 · sha256 `1c8da441…` · 3 read sites

Read as: enum (compared against fixed values). Values: `false`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-jxvcdtxk.js` offset 197199677.

**Undocumented**

### `AWS_LAMBDA_BENCHMARK_MODE`

Source: `chunk-jxvcdtxk.js` · offset 197064420 · sha256 `11d880c2…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-jxvcdtxk.js` offset 197064420.

**Undocumented**

### `AWS_LAMBDA_MAX_CONCURRENCY`

Source: `chunk-jxvcdtxk.js` · offset 197064133 · sha256 `441ec1d5…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-jxvcdtxk.js` offset 197064133.

**Undocumented**

### `AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA`

Source: `chunk-jxvcdtxk.js` · offset 197062798 · sha256 `55d05854…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-jxvcdtxk.js` offset 197062798.

**Undocumented**

### `AWS_LOGIN_CACHE_DIRECTORY`

Source: `chunk-wa8nq2w5.js` · offset 196939352 · sha256 `304b902c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wa8nq2w5.js` offset 196939352.

**Undocumented**

### `AWS_ROLE_SESSION_NAME`

Source: `chunk-ghgder2z.js` · offset 211921142 · sha256 `df2e4a0a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ghgder2z.js` offset 211921142.

**Undocumented**

### `AZURE_ADDITIONALLY_ALLOWED_TENANTS`

Source: `chunk-mh05fezn.js` · offset 197971559 · sha256 `ed848eaa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197971559.

**Undocumented**

### `AZURE_AUTHORITY_HOST`

Source: `chunk-mh05fezn.js` · offset 197728302 · sha256 `104f8a52…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197728302.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PASSWORD`

Source: `chunk-mh05fezn.js` · offset 197972532 · sha256 `72a5ed2a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197972532.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PATH`

Source: `chunk-mh05fezn.js` · offset 197972488 · sha256 `62b280d9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197972488.

**Undocumented**

### `AZURE_CLIENT_SECRET`

Source: `chunk-mh05fezn.js` · offset 197972168 · sha256 `e3d785a5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197972168.

**Undocumented**

### `AZURE_CLIENT_SEND_CERTIFICATE_CHAIN`

Source: `chunk-mh05fezn.js` · offset 197971713 · sha256 `cedfa2bc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197971713.

**Undocumented**

### `AZURE_FEDERATED_TOKEN_FILE`

Source: `chunk-mh05fezn.js` · offset 197948163 · sha256 `5affa54c…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197948163.

**Undocumented**

### `AZURE_IDENTITY_DISABLE_MULTITENANTAUTH`

Source: `chunk-mh05fezn.js` · offset 197674034 · sha256 `4815de9a…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-mh05fezn.js` offset 197674034.

**Undocumented**

### `AZURE_PASSWORD`

Source: `chunk-mh05fezn.js` · offset 197972816 · sha256 `7c19281e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197972816.

**Undocumented**

### `AZURE_POD_IDENTITY_AUTHORITY_HOST`

Source: `chunk-mh05fezn.js` · offset 197933965 · sha256 `a8c1f5b5…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-mh05fezn.js` offset 197933965.

**Undocumented**

### `AZURE_REGIONAL_AUTHORITY_NAME`

Source: `chunk-mh05fezn.js` · offset 197936950 · sha256 `5f710949…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197936950.

**Undocumented**

### `AZURE_TOKEN_CREDENTIALS`

Source: `chunk-mh05fezn.js` · offset 197975837 · sha256 `91cb3c34…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-mh05fezn.js` offset 197975837.

**Undocumented**

### `AZURE_USERNAME`

Source: `chunk-mh05fezn.js` · offset 197972787 · sha256 `9de4ee24…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197972787.

**Undocumented**

### `BUF_BIGINT_DISABLE`

Source: `chunk-5vadtxaa.js` · offset 182835424 · sha256 `31674c1d…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-5vadtxaa.js` offset 182835424.

**Undocumented**

### `CHOKIDAR_INTERVAL`

Source: `chunk-3pxceyrc.js` · offset 181914930 · sha256 `4c2baee7…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-3pxceyrc.js` offset 181914930.

**Undocumented**

### `CHOKIDAR_USEPOLLING`

Source: `chunk-3pxceyrc.js` · offset 181914749 · sha256 `809a7001…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-3pxceyrc.js` offset 181914749.

**Undocumented**

### `CLOUD_RUN_JOB`

Source: `chunk-ekz7hy24.js` · offset 197354535 · sha256 `c94bcd46…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197354535.

**Undocumented**

### `DEBUG_AUTH`

Source: `chunk-ekz7hy24.js` · offset 197365452 · sha256 `a9d539c6…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197365452.

**Undocumented**

### `DETECT_GCP_RETRIES`

Source: `chunk-ekz7hy24.js` · offset 197364771 · sha256 `bef4b628…` · 2 read sites

Read as: number (parsed as a number).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197364771.

**Undocumented**

### `FUNCTION_NAME`

Source: `chunk-ekz7hy24.js` · offset 197354562 · sha256 `16cc5003…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197354562.

**Undocumented**

### `FUNCTION_TARGET`

Source: `chunk-ekz7hy24.js` · offset 197396208 · sha256 `be8aa066…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197396208.

**Undocumented**

### `GAE_MODULE_NAME`

Source: `chunk-ekz7hy24.js` · offset 197396129 · sha256 `3aec2dd6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197396129.

**Undocumented**

### `GAE_SERVICE`

Source: `chunk-ekz7hy24.js` · offset 197396104 · sha256 `3c32fa81…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197396104.

**Undocumented**

### `GCE_METADATA_HOST`

Source: `chunk-ekz7hy24.js` · offset 197363069 · sha256 `489ed04c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197363069.

**Undocumented**

### `GCE_METADATA_IP`

Source: `chunk-ekz7hy24.js` · offset 197363040 · sha256 `63485255…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197363040.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-fmv8bhm3.js` · offset 178987702 · sha256 `917eba16…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-fmv8bhm3.js` offset 178987702.

**Undocumented**

### `GIT_SSL_CERT`

Source: `chunk-8xhw5h9f.js` · offset 190458827 · sha256 `6c42388d…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190458827.

**Undocumented**

### `GIT_SSL_KEY`

Source: `chunk-8xhw5h9f.js` · offset 190458842 · sha256 `01ad4f7e…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-8xhw5h9f.js` offset 190458842.

**Undocumented**

### `GOOGLE_CLOUD_QUOTA_PROJECT`

Source: `chunk-ekz7hy24.js` · offset 197454041 · sha256 `006ef59e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ekz7hy24.js` offset 197454041.

**Undocumented**

### `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`

Source: `chunk-ekz7hy24.js` · offset 197444663 · sha256 `d60e4754…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197444663.

**Undocumented**

### `GRACEFUL_FS_PLATFORM`

Source: `chunk-py9z7ygk.js` · offset 180437006 · sha256 `1c96518e…`

Read as: string (raw value; further parsing not traced). Default (from code): `darwin`.

Undocumented; read at `chunk-py9z7ygk.js` offset 180437006.

**Undocumented**

### `GRPC_EXPERIMENTAL_ENABLE_OUTLIER_DETECTION`

Source: `chunk-nphjt8ea.js` · offset 218385340 · sha256 `2a9c164a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218385340.

**Undocumented**

### `GRPC_NODE_TRACE`

Source: `chunk-nphjt8ea.js` · offset 218030537 · sha256 `bd88e67e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218030537.

**Undocumented**

### `GRPC_NODE_USE_ALTERNATIVE_RESOLVER`

Source: `chunk-nphjt8ea.js` · offset 218230219 · sha256 `213d12c1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218230219.

**Undocumented**

### `GRPC_NODE_VERBOSITY`

Source: `chunk-nphjt8ea.js` · offset 218029876 · sha256 `90d938ec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218029876.

**Undocumented**

### `grpc_proxy`

Source: `chunk-nphjt8ea.js` · offset 218236807 · sha256 `984ce2dd…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-nphjt8ea.js` offset 218236807.

**Undocumented**

### `GRPC_SSL_CIPHER_SUITES`

Source: `chunk-nphjt8ea.js` · offset 218035470 · sha256 `6737f6e2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218035470.

**Undocumented**

### `GRPC_TRACE`

Source: `chunk-nphjt8ea.js` · offset 218030589 · sha256 `c891fd36…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218030589.

**Undocumented**

### `GRPC_VERBOSITY`

Source: `chunk-nphjt8ea.js` · offset 218029932 · sha256 `03141409…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218029932.

**Undocumented**

### `K_CONFIGURATION`

Source: `chunk-ekz7hy24.js` · offset 197396259 · sha256 `8915965f…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197396259.

**Undocumented**

### `LRU_CACHE_IGNORE_AC_WARNING`

Source: `chunk-nc9hhjpp.js` · offset 178241949 · sha256 `08e28927…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-nc9hhjpp.js` offset 178241949.

**Undocumented**

### `METADATA_SERVER_DETECTION`

Source: `chunk-ekz7hy24.js` · offset 197364873 · sha256 `567b2c13…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ekz7hy24.js` offset 197364873.

**Undocumented**

### `MSAL_FORCE_REGION`

Source: `chunk-mh05fezn.js` · offset 197910643 · sha256 `a5881060…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197910643.

**Undocumented**

### `no_grpc_proxy`

Source: `chunk-nphjt8ea.js` · offset 218237606 · sha256 `3e43f776…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218237606.

**Undocumented**

### `OSTYPE`

Source: `chunk-1nayt2j6.js` · offset 178938822 · sha256 `e7feb6ad…` · 2 read sites

Read as: enum (compared against fixed values). Values: `cygwin`, `msys`.

Undocumented; read at `chunk-1nayt2j6.js` offset 178938822.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CERTIFICATE`

Source: `chunk-nphjt8ea.js` · offset 218415464 · sha256 `3f3cfacf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218415464.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`

Source: `chunk-nphjt8ea.js` · offset 218415158 · sha256 `32e387c2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218415158.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_KEY`

Source: `chunk-nphjt8ea.js` · offset 218415316 · sha256 `fc5f98a1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218415316.

**Undocumented**

### `OTEL_EXPORTER_OTLP_INSECURE`

Source: `chunk-nphjt8ea.js` · offset 218414859 · sha256 `8ce73eb5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-nphjt8ea.js` offset 218414859.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_HOST`

Source: `chunk-kvfs97jp.js` · offset 218438358 · sha256 `61eafb33…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kvfs97jp.js` offset 218438358.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_PORT`

Source: `chunk-kvfs97jp.js` · offset 218438450 · sha256 `ccf61175…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-kvfs97jp.js` offset 218438450.

**Undocumented**

### `REGION_NAME`

Source: `chunk-mh05fezn.js` · offset 197910790 · sha256 `28204796…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mh05fezn.js` offset 197910790.

**Undocumented**

### `TEST_GRACEFUL_FS_GLOBAL_PATCH`

Source: `chunk-py9z7ygk.js` · offset 180443900 · sha256 `d12bfc7e…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-py9z7ygk.js` offset 180443900.

**Undocumented**
