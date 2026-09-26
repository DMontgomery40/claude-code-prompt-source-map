# Environment variables read by Claude Code

Claude Code reads 1152 environment variables by name, plus 5 name patterns built at run time. 385 of the named variables are documented at code.claude.com and 767 are not. It also sets 467 variables for its own process, tools, hooks and other child processes; these are listed in their own section.

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

Source: `chunk-wyjbafrm.js` · offset 184833967 · sha256 `ac07578b…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for main-conversation requests: the interactive main thread, SDK, auto-mode and memory-relevance requests. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the promptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for the main conversation: your interactive, `-p`, and SDK turns, plus the helpers that run inline with them.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_CACHE_EVICT`

Source: `chunk-wyjbafrm.js` · offset 184922975 · sha256 `3f7f893f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, and two internal capability checks pass, a request that asks to evict its cache on completion gets the prompt-caching evict beta. Its cache_control marker then carries evict_on_complete: true. When unset, a remote feature flag decides.

**Undocumented**

### `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`

Source: `chunk-wyjbafrm.js` · offset 184833998 · sha256 `48e6265c…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for every request that is not a main-conversation request, such as subagents and background work. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the subagentPromptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for requests outside the main conversation, such as subagents, workflows, and background work.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`

Source: `chunk-ak3102st.js` · offset 194610181 · sha256 `ccab5fa7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From code: Read as an integer. The stagger wait is 0 when DISABLE_PROMPT_CACHING is truthy.

From docs: Upper bound in milliseconds on how long a workflow agent waits for a same-prefix sibling's first response to begin before sending its own first request.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING`

Source: `chunk-ak3102st.js` · offset 194610151 · sha256 `f7c692cd…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false for every model. It is checked before the per-model variables, so it overrides them. That check applies whenever a caller does not pass its own caching flag. No caller in this build passes a literal true; several internal side requests pass a literal false, and a few forward a value that this reference does not trace. It also sets the workflow same-prefix stagger wait to 0. When it or the HAIKU, OPUS, SONNET or FABLE variable is truthy, a warning notice reads "Prompt caching off ({{DISABLED_CACHE_VARS}}), requests will be slower and cost more · unset it to re-enable". {{DISABLED_CACHE_VARS}} is the set variables from that list of five, joined with ", ".

From docs: Set to `1` to disable prompt caching for all models (takes precedence over per-model settings)

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_FABLE`

Source: `chunk-wyjbafrm.js` · offset 184913961 · sha256 `68dddb81…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-fable-" or equals ANTHROPIC_DEFAULT_FABLE_MODEL after normalization.

From docs: Set to `1` to disable prompt caching for Fable models

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_HAIKU`

Source: `chunk-wyjbafrm.js` · offset 184913663 · sha256 `6d1a40ff…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only for a request whose model equals the resolved small/fast model. That model must also differ from the main-loop model. The check runs only when a small/fast model applies: ANTHROPIC_SMALL_FAST_MODEL or ANTHROPIC_DEFAULT_HAIKU_MODEL is set, or an internal provider/login condition holds.

From docs: Set to `1` to disable prompt caching for Haiku models

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_MYTHOS`

Source: `chunk-wyjbafrm.js` · offset 184914022 · sha256 `def68dd6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-mythos-". The "Prompt caching off" warning notice does not list it.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

**Undocumented**

### `DISABLE_PROMPT_CACHING_OPUS`

Source: `chunk-wyjbafrm.js` · offset 184913898 · sha256 `d6bb0579…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Opus model: ANTHROPIC_DEFAULT_OPUS_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Opus models", but this check does not match other Opus model IDs.

From docs: Set to `1` to disable prompt caching for Opus models

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_SONNET`

Source: `chunk-wyjbafrm.js` · offset 184913833 · sha256 `4dfe1b5a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Sonnet model: ANTHROPIC_DEFAULT_SONNET_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Sonnet models", but this check does not match other Sonnet model IDs.

From docs: Set to `1` to disable prompt caching for Sonnet models

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H`

Source: `chunk-wyjbafrm.js` · offset 184834255 · sha256 `2c1b2543…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. When truthy, requests with no FORCE_PROMPT_CACHING_5M, no TTL variable, no TTL setting and no agent-frontmatter TTL get the 1-hour TTL. The resolver does not restrict it by provider or model. It is evaluated before the subscriber and overage fallback, so it also applies to non-subscribers and during overage.

From docs: Set to `1` to request a 1-hour prompt cache TTL instead of the default 5 minutes.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H_BEDROCK`

Source: `chunk-wyjbafrm.js` · offset 184834301 · sha256 `805c531a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. Has the same effect as ENABLE_PROMPT_CACHING_1H, but only when the provider is Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK).

From docs: Deprecated.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_PROMPT_CACHING_5M`

Source: `chunk-wyjbafrm.js` · offset 184833885 · sha256 `7e522f80…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 1 of TTL resolution. When truthy, every request resolved through the TTL resolver gets the 5-minute TTL, ahead of all TTL variables, settings and agent frontmatter.

From docs: Set to `1` to force the 5-minute prompt cache TTL even when 1-hour TTL would otherwise apply.

Evidence (offsets): cache control builder `chunk-wyjbafrm.js` @ 184914083 · caching off notice `chunk-y5f6f73g.js` @ 203198785 · ttl resolver `chunk-wyjbafrm.js` @ 184833859

Documented: https://code.claude.com/docs/en/env-vars

## Claude Code and Anthropic

### `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`

Source: `chunk-1vt3h958.js` · offset 178359576 · sha256 `141c63d2…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178359576.

**Undocumented**

### `AI_AGENT`

Source: `chunk-fmvn29kc.js` · offset 175401648 · sha256 `53cd51cc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-fmvn29kc.js` offset 175401648.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-38djgp32.js` · offset 181141237 · sha256 `15d71a5f…` · 26 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key sent as `X-Api-Key` header.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-38djgp32.js` · offset 181141298 · sha256 `3298dcb6…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BASE_URL`

Source: `chunk-1vt3h958.js` · offset 178526992 · sha256 `7e406881…` · 48 read sites

Read as: string (trimmed; empty is treated as unset). Values: `https://api-staging.anthropic.com`. Default (from code): `https://api.anthropic.com`.

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the API endpoint to route requests through a proxy or gateway.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BETAS`

Source: `chunk-1vt3h958.js` · offset 178438486 · sha256 `7f59f23c…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Comma-separated list of additional `anthropic-beta` header values to include in API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-5b5dkraf.js` · offset 212195745 · sha256 `da1f3b83…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212195745.

**Undocumented**

### `ANTHROPIC_CUSTOM_HEADERS`

Source: `chunk-hzevqd7x.js` · offset 181687781 · sha256 `251d5fb7…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION`

Source: `chunk-1vt3h958.js` · offset 178390738 · sha256 `365f3ebd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID to add as a custom entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`

Source: `chunk-hzevqd7x.js` · offset 181658303 · sha256 `9a56865d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`

Source: `chunk-hzevqd7x.js` · offset 181658243 · sha256 `e9d17412…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL`

Source: `chunk-1vt3h958.js` · offset 178388413 · sha256 `bab142cc…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Model ID that the `fable` alias resolves to, and the ID Claude Code recognizes as a Fable model for automatic model fallback on third-party providers.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_DESCRIPTION`

Source: `chunk-hzevqd7x.js` · offset 181645539 · sha256 `a2a27d85…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Fable model`.

From docs: Display description for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME`

Source: `chunk-hzevqd7x.js` · offset 181645502 · sha256 `c1c1562e…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-1vt3h958.js` · offset 178388509 · sha256 `bcacaca2…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`

Source: `chunk-hzevqd7x.js` · offset 181649730 · sha256 `a6617ffb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Haiku model`.

From docs: Display description for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`

Source: `chunk-hzevqd7x.js` · offset 181649693 · sha256 `ede3ae9d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_MODEL`

Source: `chunk-1vt3h958.js` · offset 178402995 · sha256 `5f40fa89…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model that new sessions start on by default.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-1vt3h958.js` · offset 178388445 · sha256 `bc028f5f…` · 17 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-hzevqd7x.js` · offset 181646736 · sha256 `3929d889…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-hzevqd7x.js` · offset 181646700 · sha256 `d8c31deb…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-1vt3h958.js` · offset 178388476 · sha256 `f81df586…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`

Source: `chunk-hzevqd7x.js` · offset 181644381 · sha256 `061abab4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`

Source: `chunk-hzevqd7x.js` · offset 181644343 · sha256 `3fb9026d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ENVIRONMENT_ID`

Source: `chunk-2mgnea7j.js` · offset 177957087 · sha256 `6fdeb8df…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177957087.

**Undocumented**

### `ANTHROPIC_ENVIRONMENT_KEY`

Source: `chunk-2mgnea7j.js` · offset 177957201 · sha256 `39f3da25…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177957201.

**Undocumented**

### `ANTHROPIC_FEDERATION_RULE_ID`

Source: `chunk-hkrvpm2b.js` · offset 177800872 · sha256 `3c95f8b4…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Federation rule ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_IDENTITY_TOKEN`

Source: `chunk-2mgnea7j.js` · offset 177914682 · sha256 `d44833d1…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177914682.

**Undocumented**

### `ANTHROPIC_IDENTITY_TOKEN_FILE`

Source: `chunk-2mgnea7j.js` · offset 177906331 · sha256 `ead1d530…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177906331.

**Undocumented**

### `ANTHROPIC_LOG`

Source: `chunk-2mgnea7j.js` · offset 177898021 · sha256 `05ba5e38…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177898021.

**Undocumented**

### `ANTHROPIC_MODEL`

Source: `chunk-1vt3h958.js` · offset 178390322 · sha256 `9effd817…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Name of the model setting to use (see Model Configuration)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ORGANIZATION_ID`

Source: `chunk-hkrvpm2b.js` · offset 177800814 · sha256 `cf9ebbc1…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Organization ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_PROFILE`

Source: `chunk-5b5dkraf.js` · offset 212195932 · sha256 `f029bb2b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

From docs: Name of the Anthropic profile to authenticate with, such as one created by `ant auth login` or by signing in to a Console account without an API key.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SCOPE`

Source: `chunk-2mgnea7j.js` · offset 177906695 · sha256 `bba1ec9b…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177906695.

**Undocumented**

### `ANTHROPIC_SERVICE_ACCOUNT_ID`

Source: `chunk-2mgnea7j.js` · offset 177906608 · sha256 `8000a0ca…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177906608.

**Undocumented**

### `ANTHROPIC_SESSION_ID`

Source: `chunk-2mgnea7j.js` · offset 177957133 · sha256 `3a101e9e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177957133.

**Undocumented**

### `ANTHROPIC_SMALL_FAST_MODEL`

Source: `chunk-wyjbafrm.js` · offset 184837764 · sha256 `263f23ef…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: \[DEPRECATED] Name of Haiku-class model for background tasks

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_UNIX_SOCKET`

Source: `chunk-38djgp32.js` · offset 181141566 · sha256 `cd7cb418…` · 32 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 21 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-38djgp32.js` offset 181141566.

**Undocumented**

### `ANTHROPIC_WEBHOOK_SIGNING_KEY`

Source: `chunk-2mgnea7j.js` · offset 178018209 · sha256 `ba57de6d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 178018209.

**Undocumented**

### `ANTHROPIC_WORK_ID`

Source: `chunk-2mgnea7j.js` · offset 177957044 · sha256 `fecce3d5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177957044.

**Undocumented**

### `ANTHROPIC_WORKSPACE_ID`

Source: `chunk-hkrvpm2b.js` · offset 177800742 · sha256 `21f00b3c…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Workspace ID for workload identity federation.

Documented: https://code.claude.com/docs/en/env-vars

### `API_FORCE_IDLE_TIMEOUT`

Source: `chunk-zgqyfwz9.js` · offset 177220424 · sha256 `a01398ac…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the 5-minute body idle timeout that aborts a streaming model response when no bytes arrive.

Documented: https://code.claude.com/docs/en/env-vars

### `API_TIMEOUT_MS`

Source: `chunk-gqr0patp.js` · offset 202886132 · sha256 `a888de25…` · 6 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647).

Documented: https://code.claude.com/docs/en/env-vars

### `AUTOMODE_DECISION_LOG`

Source: `chunk-wyjbafrm.js` · offset 185437330 · sha256 `1e7c0dc0…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-wyjbafrm.js` offset 185437330.

**Undocumented**

### `BASH_DEFAULT_TIMEOUT_MS`

Source: `chunk-n7e3q3fg.js` · offset 181216637 · sha256 `553fd156…`

Read as: string (raw value; further parsing not traced).

From docs: Default timeout for long-running bash commands (default: 120000, or 2 minutes)

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-s7stjdxd.js` · offset 182631203 · sha256 `0e7a1c0d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_TIMEOUT_MS`

Source: `chunk-n7e3q3fg.js` · offset 181216751 · sha256 `b63207f0…`

Read as: string (raw value; further parsing not traced).

From docs: Maximum timeout the model can set for long-running bash commands (default: 600000, or 10 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `BUGHUNTER_DEV_BUNDLE_B64`

Source: `chunk-rwx9yk1k.js` · offset 194874529 · sha256 `9dd8b661…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-rwx9yk1k.js` offset 194874529.

**Undocumented**

### `BUGHUNTER_FLEET_SIZE`

Source: `chunk-gjhs4jet.js` · offset 190878329 · sha256 `73c58ba3…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-gjhs4jet.js` offset 190878329.

**Undocumented**

### `CCR_ENABLE_BUNDLE`

Source: `chunk-mzg9kbjz.js` · offset 204653390 · sha256 `19d54f8c…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzg9kbjz.js` offset 204653390.

**Undocumented**

### `CCR_FORCE_BUNDLE`

Source: `chunk-wyjbafrm.js` · offset 185733820 · sha256 `3071d65d…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force `claude --cloud` to bundle and upload your local repository instead of cloning from its remote

Documented: https://code.claude.com/docs/en/env-vars

### `CCR_ON_BRANCH_DEFAULT_GUARD`

Source: `chunk-wyjbafrm.js` · offset 185925560 · sha256 `2763e2c9…` · 2 read sites

Read as: enum (compared against fixed values). Values: `enforce`, `observe`, `off`.

Undocumented; read at `chunk-wyjbafrm.js` offset 185925560.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-1vt3h958.js` · offset 178309201 · sha256 `4ea4f741…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178309201.

**Undocumented**

### `CCR_SHR_SSE_HINTS`

Source: `chunk-y8am1j53.js` · offset 187489812 · sha256 `927ca514…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187489812.

**Undocumented**

### `CCR_SPAWN_TIMESTAMP_MS`

Source: `chunk-a3ghcnsr.js` · offset 176639698 · sha256 `628d65dc…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-a3ghcnsr.js` offset 176639698.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-1vt3h958.js` · offset 178519078 · sha256 `d6342530…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178519078.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-mzg9kbjz.js` · offset 204692728 · sha256 `2959d146…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-mzg9kbjz.js` · offset 204692682 · sha256 `3d44032d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-wyjbafrm.js` · offset 182967118 · sha256 `0da64453…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 182967118.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-hzevqd7x.js` · offset 181687192 · sha256 `eab56788…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181687192.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-wyjbafrm.js` · offset 184264759 · sha256 `763e9be8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-xwgs2xvp.js` · offset 199914803 · sha256 `abf02cd1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xwgs2xvp.js` offset 199914803.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-gg4jhzsm.js` · offset 209391429 · sha256 `af756a02…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-1vt3h958.js` · offset 178178046 · sha256 `8c91e3c2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unknown`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178178046.

**Undocumented**

### `CLAUDE_AGENTS_AUTO_RELAUNCHED_AT`

Source: `chunk-8ddbmt6f.js` · offset 192838692 · sha256 `b63509a4…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-8ddbmt6f.js` offset 192838692.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-8ddbmt6f.js` · offset 192851040 · sha256 `05b80a80…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8ddbmt6f.js` offset 192851040.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-020tq8de.js` · offset 206357428 · sha256 `bd85f0b2…` · 6 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-020tq8de.js` offset 206357428.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-7dz9rvcm.js` · offset 190104577 · sha256 `159c9a8a…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true.

From docs: Stall timeout in milliseconds for subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-3qcnxvnw.js` · offset 190165917 · sha256 `ddd26c0c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-wyjbafrm.js` · offset 183912966 · sha256 `0e787485…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_PREPARK_MS`

Source: `chunk-pspf2b4w.js` · offset 177776579 · sha256 `7763481a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `50`.

From docs: In screen reader mode, how many milliseconds Claude Code waits, with the cursor at the start of the line, before it writes a new or changed line.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_SCREEN_READER`

Source: `chunk-pspf2b4w.js` · offset 177775236 · sha256 `e9ec58b6…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to render screen-reader friendly output: flat text without decorative borders or animations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_STARTUP_QUIET_MS`

Source: `chunk-pspf2b4w.js` · offset 177776456 · sha256 `c9ed3776…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

From docs: In screen reader mode, how many milliseconds Claude Code holds the first interface render after the startup confirmation line, so your screen reader can speak the line in full before new output interrupts it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-2tefsj0f.js` · offset 175591972 · sha256 `5509dbb8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-v43p42ed.js` · offset 177827235 · sha256 `b23ee675…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-v43p42ed.js` offset 177827235.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-g1gybmy1.js` · offset 199242318 · sha256 `761beb70…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `daemon`.

Undocumented; read at `chunk-g1gybmy1.js` offset 199242318.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-6n6qvpgn.js` · offset 189109393 · sha256 `b9127893…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6n6qvpgn.js` offset 189109393.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-hkrvpm2b.js` · offset 177805575 · sha256 `479c8291…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177805575.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-hkrvpm2b.js` · offset 177805512 · sha256 `75c57711…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177805512.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-wyjbafrm.js` · offset 183557259 · sha256 `4c46686e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `worktree`.

Undocumented; read at `chunk-wyjbafrm.js` offset 183557259.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-cpf7rt77.js` · offset 191775994 · sha256 `09901b5e…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-cpf7rt77.js` offset 191775994.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-cpf7rt77.js` · offset 191829218 · sha256 `e616699a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191829218.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-w4m48xb9.js` · offset 192924047 · sha256 `dbda7267…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w4m48xb9.js` offset 192924047.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-ysnn4cgk.js` · offset 202733184 · sha256 `5cac6c16…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ysnn4cgk.js` offset 202733184.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-ysnn4cgk.js` · offset 202733401 · sha256 `47f681f8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ysnn4cgk.js` offset 202733401.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-cpf7rt77.js` · offset 191775390 · sha256 `76fa2fb1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cpf7rt77.js` offset 191775390.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-w4m48xb9.js` · offset 192924122 · sha256 `1fcb7e87…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w4m48xb9.js` offset 192924122.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-mzg9kbjz.js` · offset 204947734 · sha256 `2c2da5b5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `spare`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 204947734.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-ysnn4cgk.js` · offset 202732147 · sha256 `4fcf9acc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `45000`.

Undocumented; read at `chunk-ysnn4cgk.js` offset 202732147.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-w4m48xb9.js` · offset 192923215 · sha256 `d9c55f29…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-w4m48xb9.js` offset 192923215.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-rg6teng4.js` · offset 198232410 · sha256 `57d0e7e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-rg6teng4.js` offset 198232410.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-c5fk236t.js` · offset 197312588 · sha256 `733dae68…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c5fk236t.js` offset 197312588.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-nv6nh3kd.js` · offset 210664936 · sha256 `76f29ce6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210664936.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-nv6nh3kd.js` · offset 210665060 · sha256 `3d9adfbe…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210665060.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-2crv8d5h.js` · offset 192120768 · sha256 `2876ad7c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2crv8d5h.js` offset 192120768.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-nv6nh3kd.js` · offset 210664983 · sha256 `03171b60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210664983.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-nv6nh3kd.js` · offset 210665022 · sha256 `4103eaa4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210665022.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-nv6nh3kd.js` · offset 210664894 · sha256 `78c12cd2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210664894.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-nv6nh3kd.js` · offset 210664839 · sha256 `0ed49f22…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nv6nh3kd.js` offset 210664839.

**Undocumented**

### `CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-hzevqd7x.js` · offset 181697397 · sha256 `08bc2317…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for the byte-level streaming idle watchdog; when set, it takes precedence over `CLAUDE_STREAM_IDLE_TIMEOUT_MS` for that watchdog and leaves the event-level watchdog unchanged.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CHROME_CLASSIFIER_FLOOR`

Source: `chunk-5mcqa25r.js` · offset 189986550 · sha256 `115bb892…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-5mcqa25r.js` offset 189986550.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-geg6jndb.js` · offset 193299639 · sha256 `9ab1f9d7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-geg6jndb.js` offset 193299639.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-geg6jndb.js` · offset 193299446 · sha256 `d8cf5ff5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-geg6jndb.js` offset 193299446.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-77wr7xkf.js` · offset 203426802 · sha256 `ceff9aca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-1vt3h958.js` · offset 178388810 · sha256 `8ebd36d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178388810.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-1vt3h958.js` · offset 178388687 · sha256 `303f0d24…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178388687.

**Undocumented**

### `CLAUDE_CODE_ACCESSIBILITY`

Source: `chunk-6sap1w9m.js` · offset 188657155 · sha256 `78c0f256…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `0`.

From docs: Set to `1` to keep the native terminal cursor visible and disable the inverted-text cursor indicator.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ACCOUNT_TAGGED_ID`

Source: `chunk-s92h89q7.js` · offset 180788886 · sha256 `755576cb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s92h89q7.js` offset 180788886.

**Undocumented**

### `CLAUDE_CODE_ACCOUNT_UUID`

Source: `chunk-geg6jndb.js` · offset 193302547 · sha256 `6e8b00aa…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-geg6jndb.js` offset 193302547.

**Undocumented**

### `CLAUDE_CODE_ACT_DONT_REDERIVE`

Source: `chunk-wyjbafrm.js` · offset 184313840 · sha256 `61dc2948…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184313840.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-1vt3h958.js` · offset 178519724 · sha256 `bccfb10f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178519724.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-r4xrzyvn.js` · offset 199118495 · sha256 `ecdc6b1d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-hzevqd7x.js` · offset 181687888 · sha256 `91464e4f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181687888.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-r4xrzyvn.js` · offset 198916688 · sha256 `c893ec8f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198916688.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-1vt3h958.js` · offset 178498153 · sha256 `dcf206a0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178498153.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-p4h4mthd.js` · offset 182829979 · sha256 `a60838c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p4h4mthd.js` offset 182829979.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-14mz7m5y.js` · offset 192387516 · sha256 `2650615c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ALTGR_AS_TEXT`

Source: `chunk-6sap1w9m.js` · offset 188597208 · sha256 `43919966…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-6sap1w9m.js` offset 188597208.

**Undocumented**

### `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT`

Source: `chunk-fr7r2xfj.js` · offset 179153399 · sha256 `47ef8a02…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the effort parameter with every request, even when Claude Code does not recognize the model ID as effort-capable.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AMBER_ASTROLABE`

Source: `chunk-erjm8tsb.js` · offset 179179734 · sha256 `8e2e5701…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179179734.

**Undocumented**

### `CLAUDE_CODE_API_BASE_URL`

Source: `chunk-hzevqd7x.js` · offset 181984774 · sha256 `ffa9d202…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181984774.

**Undocumented**

### `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR`

Source: `chunk-38djgp32.js` · offset 181141416 · sha256 `571c81f2…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-38djgp32.js` offset 181141416.

**Undocumented**

### `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`

Source: `chunk-1vt3h958.js` · offset 178663877 · sha256 `99a8a679…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval in milliseconds at which credentials should be refreshed (when using `apiKeyHelper`)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-5gmd19gq.js` · offset 182356138 · sha256 `e42ef07b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5gmd19gq.js` offset 182356138.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSETS`

Source: `chunk-5gmd19gq.js` · offset 182356485 · sha256 `f6d17a02…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-5gmd19gq.js` offset 182356485.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-pf0tr2zq.js` · offset 205851278 · sha256 `775a16f7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK`

Source: `chunk-062x9mrp.js` · offset 189754788 · sha256 `745c4305…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-062x9mrp.js` offset 189754788.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK_FIXED`

Source: `chunk-062x9mrp.js` · offset 189755329 · sha256 `9a7789ac…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-062x9mrp.js` offset 189755329.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_RESPONDER`

Source: `chunk-062x9mrp.js` · offset 189743354 · sha256 `782008f7…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-062x9mrp.js` offset 189743354.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENTS`

Source: `chunk-yhp2dptn.js` · offset 189585423 · sha256 `83d5f67c…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude reading and replying to comments on an artifact.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENTS_AUTOREACT`

Source: `chunk-062x9mrp.js` · offset 189754687 · sha256 `84cec711…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude replying on its own to comments sent to it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_DB`

Source: `chunk-gqawqygf.js` · offset 191148686 · sha256 `46958bfd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gqawqygf.js` offset 191148686.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DB_STR_REPLACE`

Source: `chunk-gqawqygf.js` · offset 191148746 · sha256 `246859d1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gqawqygf.js` offset 191148746.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DELETE`

Source: `chunk-ydwanqg4.js` · offset 191344184 · sha256 `c864f413…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ydwanqg4.js` offset 191344184.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_FRESH_READ`

Source: `chunk-020tq8de.js` · offset 206619722 · sha256 `18d08d8c…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-020tq8de.js` offset 206619722.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_HOT`

Source: `chunk-qh667gan.js` · offset 189389084 · sha256 `6f57a8ce…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-qh667gan.js` offset 189389084.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_MULTI_FILE`

Source: `chunk-qh667gan.js` · offset 189388667 · sha256 `2cf3d5b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-qh667gan.js` offset 189388667.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPEN_ACTION`

Source: `chunk-ydwanqg4.js` · offset 191347431 · sha256 `e90603dd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ydwanqg4.js` offset 191347431.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH`

Source: `chunk-wyjbafrm.js` · offset 186079748 · sha256 `568a00a5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186079748.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PATH_PIN`

Source: `chunk-g1xbpbw2.js` · offset 191330020 · sha256 `9e1bd820…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-g1xbpbw2.js` offset 191330020.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PIN`

Source: `chunk-ydwanqg4.js` · offset 191344319 · sha256 `2693918e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-ydwanqg4.js` offset 191344319.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PRESENCE`

Source: `chunk-vmkc8ypt.js` · offset 189867900 · sha256 `0303b2b0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-vmkc8ypt.js` offset 189867900.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PREVIEW`

Source: `chunk-pmke923e.js` · offset 191184837 · sha256 `713c0eb8…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-pmke923e.js` offset 191184837.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_QUICKSTART`

Source: `chunk-n7kz1m2h.js` · offset 191214301 · sha256 `2b007556…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-n7kz1m2h.js` offset 191214301.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_START_KIT`

Source: `chunk-9k35tqn0.js` · offset 194199235 · sha256 `e7c123b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9k35tqn0.js` offset 194199235.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TEXT_VARIANT`

Source: `chunk-gvc2pt1r.js` · offset 197233619 · sha256 `85a661ad…`

Read as: enum (compared against fixed values). Values: `v0`, `v1`, `v2`.

Undocumented; read at `chunk-gvc2pt1r.js` offset 197233619.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TOOLSET`

Source: `chunk-qh667gan.js` · offset 189386436 · sha256 `9f5b8208…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-qh667gan.js` offset 189386436.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CATALOG`

Source: `chunk-n7kz1m2h.js` · offset 191214234 · sha256 `9ec5c026…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-n7kz1m2h.js` offset 191214234.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE`

Source: `chunk-n7kz1m2h.js` · offset 191204668 · sha256 `2ddf902e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-n7kz1m2h.js` offset 191204668.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPES`

Source: `chunk-n7kz1m2h.js` · offset 191204609 · sha256 `d3757745…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-n7kz1m2h.js` offset 191204609.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VERIFY`

Source: `chunk-n7kz1m2h.js` · offset 191188911 · sha256 `835f81cd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-n7kz1m2h.js` offset 191188911.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-1vt3h958.js` · offset 178476686 · sha256 `c569a74f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178476686.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_ANNOUNCEMENT`

Source: `chunk-wyjbafrm.js` · offset 183818428 · sha256 `4d5b229d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183818428.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_HEADER`

Source: `chunk-9m6e1078.js` · offset 179049662 · sha256 `0ccadf30…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to omit the attribution block, which carries the client version and a prompt fingerprint, from the start of the system prompt.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTH_FAIL_EXIT_MS`

Source: `chunk-1vt3h958.js` · offset 178688816 · sha256 `46d1eca9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-1vt3h958.js` offset 178688816.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-wyjbafrm.js` · offset 183910546 · sha256 `042de733…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_CONNECT_IDE`

Source: `chunk-wyjbafrm.js` · offset 186023225 · sha256 `5bc23d1b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Override automatic IDE connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-j3j8astv.js` · offset 188965278 · sha256 `a472a5b1…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASALT_COVE`

Source: `chunk-erjm8tsb.js` · offset 179178663 · sha256 `38275e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179178663.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-93fap8m8.js` · offset 181194116 · sha256 `b0ab3da3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-93fap8m8.js` offset 181194116.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-93fap8m8.js` · offset 181178175 · sha256 `eb4dddf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-93fap8m8.js` offset 181178175.

**Undocumented**

### `CLAUDE_CODE_BASH_EDIT_DIFF`

Source: `chunk-wyjbafrm.js` · offset 186581531 · sha256 `9d0ca4a0…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off the diff of the files that changed while a Bash command ran, or `1` to record it in every permission mode.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASH_OUTPUT_AUDIENCE_NOTE`

Source: `chunk-wyjbafrm.js` · offset 184272274 · sha256 `83e24132…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184272274.

**Undocumented**

### `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR`

Source: `chunk-wyjbafrm.js` · offset 186629836 · sha256 `5fd05623…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 186629836.

**Undocumented**

### `CLAUDE_CODE_BENCH_LIVE_COUNTS`

Source: `chunk-6sap1w9m.js` · offset 188723708 · sha256 `bb39fa45…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6sap1w9m.js` offset 188723708.

**Undocumented**

### `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING`

Source: `chunk-r4xrzyvn.js` · offset 198786616 · sha256 `daf2d2c7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to make a non-interactive session report an idle status to its host at every turn end, even while background work is still running.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BISON_CAIRN`

Source: `chunk-erjm8tsb.js` · offset 179179821 · sha256 `a636f61b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-erjm8tsb.js` offset 179179821.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-wyjbafrm.js` · offset 183913012 · sha256 `deb6881a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183913012.

**Undocumented**

### `CLAUDE_CODE_BREEZY_HORIZON`

Source: `chunk-erjm8tsb.js` · offset 179181591 · sha256 `20ed664c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-erjm8tsb.js` offset 179181591.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-5gmd19gq.js` · offset 182356223 · sha256 `8e5b73c3…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5gmd19gq.js` offset 182356223.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-hkrvpm2b.js` · offset 177814634 · sha256 `30df26bd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814634.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-hkrvpm2b.js` · offset 177814712 · sha256 `07c79987…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814712.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-jrare64x.js` · offset 177788322 · sha256 `4dc7d695…`

Read as: enum (compared against fixed values). Values: `1`, `spent`.

Undocumented; read at `chunk-jrare64x.js` offset 177788322.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-r4xrzyvn.js` · offset 199222083 · sha256 `6bc37768…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199222083.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-r4xrzyvn.js` · offset 199222239 · sha256 `c1baf9db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199222239.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-wyjbafrm.js` · offset 183374364 · sha256 `a0321c61…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183374364.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-cpf7rt77.js` · offset 191823405 · sha256 `dfd2bbc1…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191823405.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-zc6p4t5p.js` · offset 190316801 · sha256 `fbf235f3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zc6p4t5p.js` offset 190316801.

**Undocumented**

### `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE`

Source: `chunk-6sap1w9m.js` · offset 188596865 · sha256 `91a7fceb…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `0` to make Claude Code read the `0x08` byte, also written `^H`, as plain Backspace, or `1` to read it as Ctrl+Backspace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BUBBLEWRAP`

Source: `chunk-1vt3h958.js` · offset 178306640 · sha256 `cebdad4c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178306640.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_HYDRATE_PREFETCH`

Source: `chunk-cpf7rt77.js` · offset 191845793 · sha256 `74fe0821…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191845793.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_REMOTE_CONNECT`

Source: `chunk-cpf7rt77.js` · offset 191845842 · sha256 `4e6f2f91…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191845842.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-dff4wtj6.js` · offset 197077803 · sha256 `54105beb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `tag`.

Undocumented; read at `chunk-dff4wtj6.js` offset 197077803.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-5b5dkraf.js` · offset 212363297 · sha256 `0bb57284…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-geg6jndb.js` · offset 193304225 · sha256 `a2951440…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-geg6jndb.js` offset 193304225.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-gjhs4jet.js` · offset 190879210 · sha256 `20834deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gjhs4jet.js` offset 190879210.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-9kx8dy2e.js` · offset 190504288 · sha256 `a2db3c38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9kx8dy2e.js` offset 190504288.

**Undocumented**

### `CLAUDE_CODE_COLD_COMPACT`

Source: `chunk-wyjbafrm.js` · offset 184791570 · sha256 `f38286b5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184791570.

**Undocumented**

### `CLAUDE_CODE_COMMIT_BETWEEN_KEYS`

Source: `chunk-6sap1w9m.js` · offset 188733625 · sha256 `0833265d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-6sap1w9m.js` offset 188733625.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-1vt3h958.js` · offset 178519372 · sha256 `31dd4973…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178519372.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_EXTRA_TOOLS`

Source: `chunk-pk55222v.js` · offset 198418633 · sha256 `689a77c0…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pk55222v.js` offset 198418633.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_FORCE_WORKER_INHERIT_MODEL`

Source: `chunk-3qcnxvnw.js` · offset 190166580 · sha256 `072440a5…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-3qcnxvnw.js` offset 190166580.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-77tq6657.js` · offset 182363755 · sha256 `0483ada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-77tq6657.js` offset 182363755.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-x7qmw6rt.js` · offset 182370082 · sha256 `bfb980c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-x7qmw6rt.js` offset 182370082.

**Undocumented**

### `CLAUDE_CODE_COWORK_FRAME_ARTIFACTS`

Source: `chunk-94ks0f2h.js` · offset 175820873 · sha256 `61849089…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-94ks0f2h.js` offset 175820873.

**Undocumented**

### `CLAUDE_CODE_COZY_TEAPOT`

Source: `chunk-erjm8tsb.js` · offset 179179293 · sha256 `227ab582…`

Read as: enum (compared against fixed values). Values: `strict`, `relaxed`.

Undocumented; read at `chunk-erjm8tsb.js` offset 179179293.

**Undocumented**

### `CLAUDE_CODE_CUSTOM_OAUTH_URL`

Source: `chunk-htj0346e.js` · offset 175684511 · sha256 `fd19aaca…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-htj0346e.js` offset 175684511.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-p4h4mthd.js` · offset 182829411 · sha256 `920d06cc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p4h4mthd.js` offset 182829411.

**Undocumented**

### `CLAUDE_CODE_DD_ERROR_TRACKING_FLUSH_INTERVAL_MS`

Source: `chunk-ccqthxc6.js` · offset 182188766 · sha256 `edc9c0e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-ccqthxc6.js` offset 182188766.

**Undocumented**

### `CLAUDE_CODE_DEBUG_LOG_LEVEL`

Source: `chunk-3rswxk6s.js` · offset 175631317 · sha256 `38902a64…`

Read as: string (trimmed; empty is treated as unset).

From docs: Minimum log level written to the debug log file.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_LOGS_DIR`

Source: `chunk-3rswxk6s.js` · offset 175632449 · sha256 `55275582…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the debug log file path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_REPAINTS`

Source: `chunk-6sap1w9m.js` · offset 188725400 · sha256 `8e87d2bc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6sap1w9m.js` offset 188725400.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-6sap1w9m.js` · offset 188768724 · sha256 `a88756b2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6sap1w9m.js` offset 188768724.

**Undocumented**

### `CLAUDE_CODE_DESIGN_OAUTH_CLIENT_ID`

Source: `chunk-715124r2.js` · offset 195244355 · sha256 `27ea3afb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-715124r2.js` offset 195244355.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-94ks0f2h.js` · offset 175816408 · sha256 `d9749d38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-94ks0f2h.js` offset 175816408.

**Undocumented**

### `CLAUDE_CODE_DIAGNOSTICS_FILE`

Source: `chunk-a3fz2g5s.js` · offset 175875905 · sha256 `b7d882f2…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-a3fz2g5s.js` offset 175875905.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_DISABLE_ANCHORING`

Source: `chunk-5d2q1z16.js` · offset 195505455 · sha256 `7387b96c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5d2q1z16.js` offset 195505455.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_ENGINE`

Source: `chunk-hzevqd7x.js` · offset 181905687 · sha256 `989cc745…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181905687.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_FFWD`

Source: `chunk-hzevqd7x.js` · offset 181906341 · sha256 `13bc5703…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181906341.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_GIT`

Source: `chunk-r4xrzyvn.js` · offset 199031676 · sha256 `d2f8f14c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199031676.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_STREAM`

Source: `chunk-hzevqd7x.js` · offset 181906395 · sha256 `1e3d7295…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181906395.

**Undocumented**

### `CLAUDE_CODE_DISABLE_1M_CONTEXT`

Source: `chunk-1vt3h958.js` · offset 178425292 · sha256 `22034a03…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable 1M context window support.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`

Source: `chunk-1vt3h958.js` · offset 178433033 · sha256 `d1bbe95e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable adaptive reasoning on Opus 4.6 and Sonnet 4.6 and fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADMIN_ENV_UNION`

Source: `chunk-18sktzq8.js` · offset 176392966 · sha256 `7409366c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from merging managed settings `env` blocks per key across admin sources, so only the highest-priority source's whole `env` block applies, as before v2.1.223.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADVISOR_TOOL`

Source: `chunk-hzevqd7x.js` · offset 181626271 · sha256 `31f9f385…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the advisor tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AGENT_VIEW`

Source: `chunk-p4h4mthd.js` · offset 182828693 · sha256 `94319e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off background agents and agent view: `claude agents`, `--bg`, `/background`, and the on-demand supervisor.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`

Source: `chunk-n3jtyenp.js` · offset 182201309 · sha256 `52146969…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fullscreen rendering and use the classic main-screen renderer.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ATTACHMENTS`

Source: `chunk-hzevqd7x.js` · offset 181829122 · sha256 `2730825f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable attachment processing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AUTO_MEMORY`

Source: `chunk-1vt3h958.js` · offset 178559678 · sha256 `e9ae94aa…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable auto memory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AWAITING_USER_IDLE`

Source: `chunk-my1bp942.js` · offset 182644824 · sha256 `17da4fb8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-my1bp942.js` offset 182644824.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`

Source: `chunk-r2pna72p.js` · offset 180850998 · sha256 `8e9ee151…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_EXIT_HANDOFF`

Source: `chunk-7gkfw6kg.js` · offset 190956503 · sha256 `e35978cf…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop a background session's running background shell commands, dynamic workflows, and, as of v2.1.198, background subagents when the supervisor stops, restarts, or updates that session's process, instead of handing them to the session's next process.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-wyjbafrm.js` · offset 186561324 · sha256 `c60d8030…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`

Source: `chunk-s67fq31t.js` · offset 182345937 · sha256 `53652e84…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the skills and workflows included with Claude Code: bundled skills and workflows are removed entirely, while built-in commands like `/init` stay typable but are hidden from the model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CFC_PROMPT`

Source: `chunk-cajb2b5v.js` · offset 191677824 · sha256 `6abbe374…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to keep the Claude in Chrome browser tools available while omitting the Chrome section of the system prompt and the `/claude-in-chrome` bundled skill.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_API_SKILL`

Source: `chunk-cajb2b5v.js` · offset 191677517 · sha256 `e1894d50…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cajb2b5v.js` offset 191677517.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_CODE_SKILL`

Source: `chunk-cajb2b5v.js` · offset 191677660 · sha256 `caa69eea…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cajb2b5v.js` offset 191677660.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-9gvh1sdb.js` · offset 210305505 · sha256 `a80ab294…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CRON`

Source: `chunk-hc9qzrsk.js` · offset 182260348 · sha256 `d2e34e85…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable scheduled tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DANGEROUS_RM_TIMEOUT`

Source: `chunk-wyjbafrm.js` · offset 184434050 · sha256 `b0a7f033…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184434050.

**Undocumented**

### `CLAUDE_CODE_DISABLE_DIR_SYNC`

Source: `chunk-r4xrzyvn.js` · offset 199031635 · sha256 `a91765c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199031635.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-9r9kpwh0.js` · offset 177391622 · sha256 `47a42445…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPLORE_INHERIT_CAP`

Source: `chunk-wyjbafrm.js` · offset 183069665 · sha256 `f82982b0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 183069665.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`

Source: `chunk-wyjbafrm.js` · offset 183032072 · sha256 `25884f10…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the built-in Explore and Plan subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FAST_MODE`

Source: `chunk-1vt3h958.js` · offset 178317883 · sha256 `8b097ca8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fast mode

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`

Source: `chunk-mzg9kbjz.js` · offset 204539072 · sha256 `eceb5df5…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the "How is Claude doing?" session quality surveys.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`

Source: `chunk-azjf17r6.js` · offset 195417639 · sha256 `1bb2cf49…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable file checkpointing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`

Source: `chunk-wyjbafrm.js` · offset 183539688 · sha256 `af2da406…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to remove built-in commit and PR workflow instructions and the git status snapshot from Claude's context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-ad86ta6a.js` · offset 202277758 · sha256 `854713d6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad86ta6a.js` offset 202277758.

**Undocumented**

### `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`

Source: `chunk-1vt3h958.js` · offset 178420750 · sha256 `1434b3f7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent automatic remapping of Opus 4.0 and 4.1 to the current Opus version on the Anthropic API.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MEMORY_BULK_INFLATE`

Source: `chunk-hzevqd7x.js` · offset 181294725 · sha256 `57a2e9bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181294725.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_MASS_DELETE_HOLD`

Source: `chunk-hzevqd7x.js` · offset 181257825 · sha256 `c98731a8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181257825.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_PERIODIC_RESYNC`

Source: `chunk-hzevqd7x.js` · offset 181317492 · sha256 `a88b554a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181317492.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_RO_UNSAVED_NOTICE`

Source: `chunk-hzevqd7x.js` · offset 181308628 · sha256 `b8e2136b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181308628.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_STREAM_LIST`

Source: `chunk-hzevqd7x.js` · offset 181284992 · sha256 `e80a215c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181284992.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MOUSE`

Source: `chunk-n3jtyenp.js` · offset 182204013 · sha256 `8824ecb6…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable mouse tracking in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MOUSE_CLICKS`

Source: `chunk-n3jtyenp.js` · offset 182204101 · sha256 `5298f3d5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable click, drag, and hover handling in fullscreen rendering while keeping mouse-wheel scrolling.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NESTED_CHAIN_IDLE`

Source: `chunk-yv87yxs2.js` · offset 182834547 · sha256 `49b1d93e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yv87yxs2.js` offset 182834547.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NESTED_USER_REPAIR`

Source: `chunk-q9jwcw4a.js` · offset 198335368 · sha256 `0a5b4502…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-q9jwcw4a.js` offset 198335368.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

Source: `chunk-j6zsezqx.js` · offset 175676021 · sha256 `b476ef4e…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to disable nonessential network traffic: auto-updates, telemetry, error reporting, the `/feedback` command, Claude-drafted feedback, release notes, the PR and MR status badge checks, and availability checks such as the fast mode check.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK`

Source: `chunk-wyjbafrm.js` · offset 185016216 · sha256 `c72546fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the non-streaming fallback when a streaming request fails mid-stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK`

Source: `chunk-c8gdp9zd.js` · offset 207098543 · sha256 `4e0eb81d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the `PushNotification` tool's desktop notification even while you are typing in or focused on the terminal.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`

Source: `chunk-mzg9kbjz.js` · offset 205110102 · sha256 `effc4341…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic registration of the official plugin marketplace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ORG_MEMORY`

Source: `chunk-4f79m39g.js` · offset 179432937 · sha256 `a35b3841…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4f79m39g.js` offset 179432937.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS`

Source: `chunk-q9jwcw4a.js` · offset 198309955 · sha256 `6e09c748…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from running your `Notification` hooks for unanswered permission requests in sessions where Claude Code sends them to the Agent SDK's `canUseTool` callback, which is how Claude Desktop and the VS Code extension host Claude Code.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-9sswv6ct.js` · offset 202406777 · sha256 `bc51a94c…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9sswv6ct.js` offset 202406777.

**Undocumented**

### `CLAUDE_CODE_DISABLE_POLICY_SKILLS`

Source: `chunk-wyjbafrm.js` · offset 185637833 · sha256 `557b868b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip loading skills from the system-wide managed skills directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_POWERSHELL_CMD_RM_DENY`

Source: `chunk-p28a6fwy.js` · offset 196958410 · sha256 `eb5d87df…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-p28a6fwy.js` offset 196958410.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`

Source: `chunk-wyjbafrm.js` · offset 186968054 · sha256 `f4d7781e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 186968054.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK`

Source: `chunk-hzevqd7x.js` · offset 181670356 · sha256 `b7e1638f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181670356.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_RETRY`

Source: `chunk-td7fxg34.js` · offset 190697197 · sha256 `22579745…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-td7fxg34.js` offset 190697197.

**Undocumented**

### `CLAUDE_CODE_DISABLE_STARTUP_WORK_GATE`

Source: `chunk-cpf7rt77.js` · offset 191755996 · sha256 `6db62d41…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191755996.

**Undocumented**

### `CLAUDE_CODE_DISABLE_SUBSTITUTION_RM_PROMPT`

Source: `chunk-wyjbafrm.js` · offset 185401344 · sha256 `f3c2c677…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 185401344.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`

Source: `chunk-14mz7m5y.js` · offset 192368321 · sha256 `c9848df5…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic terminal title updates based on conversation context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_THINKING`

Source: `chunk-wyjbafrm.js` · offset 184956685 · sha256 `25755513…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to omit the `thinking` parameter from API requests entirely.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-8v60mkqf.js` · offset 198396885 · sha256 `bab299da…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8v60mkqf.js` offset 198396885.

**Undocumented**

### `CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT`

Source: `chunk-wyjbafrm.js` · offset 183911455 · sha256 `e2af1b0f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip proactive auto-compaction when Claude Code doesn't recognize the model ID, such as an LLM gateway alias.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`

Source: `chunk-mzg9kbjz.js` · offset 205180017 · sha256 `778468f5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable virtual scrolling in fullscreen rendering and render every message in the transcript.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-e8phgb2s.js` · offset 187224715 · sha256 `b123889b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-e8phgb2s.js` offset 187224715.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WINDOWS_SHELL_LAUNCHER`

Source: `chunk-wyjbafrm.js` · offset 183718213 · sha256 `d36766ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start PowerShell tool commands on Windows directly instead of through the `cmd.exe` launcher.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKFLOWS`

Source: `chunk-7jh19beg.js` · offset 179148976 · sha256 `6a39bb51…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable workflows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-r4xrzyvn.js` · offset 199031120 · sha256 `e937cc38…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199031120.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-wyjbafrm.js` · offset 183706260 · sha256 `6394fbc6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-wyjbafrm.js` offset 183706260.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-avx2hrwa.js` · offset 187092385 · sha256 `1f00549c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-avx2hrwa.js` offset 187092385.

**Undocumented**

### `CLAUDE_CODE_EAGER_FLUSH`

Source: `chunk-r4xrzyvn.js` · offset 198955245 · sha256 `099e9537…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198955245.

**Undocumented**

### `CLAUDE_CODE_EDITOR_CODELIVERY`

Source: `chunk-r4xrzyvn.js` · offset 198858447 · sha256 `7931744b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198858447.

**Undocumented**

### `CLAUDE_CODE_EFFORT_LEVEL`

Source: `chunk-fr7r2xfj.js` · offset 179157589 · sha256 `a1418c04…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set the effort level for supported models.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ELEGANT_MEADOW`

Source: `chunk-wyjbafrm.js` · offset 182958496 · sha256 `4e9da92b…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 182958496.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-yv87yxs2.js` · offset 182835929 · sha256 `87d54f3a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yv87yxs2.js` offset 182835929.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-sxskc1ta.js` · offset 179675711 · sha256 `0c59bb0a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-sxskc1ta.js` offset 179675711.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-td7fxg34.js` · offset 190716155 · sha256 `845bada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-td7fxg34.js` offset 190716155.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-7dz9rvcm.js` · offset 190123558 · sha256 `f57deca3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7dz9rvcm.js` offset 190123558.

**Undocumented**

### `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`

Source: `chunk-6y8bh1hn.js` · offset 190881726 · sha256 `5fd6ac1f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Override session recap availability.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH`

Source: `chunk-r4xrzyvn.js` · offset 198834906 · sha256 `73d4e338…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to refresh plugin state at turn boundaries in non-interactive mode after a background install completes.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_CFC`

Source: `chunk-cpf7rt77.js` · offset 191839603 · sha256 `e1810825…` · 7 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-cpf7rt77.js` offset 191839603.

**Undocumented**

### `CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL`

Source: `chunk-hzevqd7x.js` · offset 181626390 · sha256 `ef13d50a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 181626390.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING`

Source: `chunk-wyjbafrm.js` · offset 183839577 · sha256 `9635eb53…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether tool call inputs stream from the API as Claude generates them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`

Source: `chunk-2dpyg5q1.js` · offset 181208235 · sha256 `2f2cf7a8…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-2dpyg5q1.js` offset 181208235.

**Undocumented**

### `CLAUDE_CODE_ENABLE_MENU_KIND_LANES`

Source: `chunk-mzg9kbjz.js` · offset 204125792 · sha256 `a005df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzg9kbjz.js` offset 204125792.

**Undocumented**

### `CLAUDE_CODE_ENABLE_NARRATION`

Source: `chunk-td7fxg34.js` · offset 190635033 · sha256 `b785624e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-td7fxg34.js` offset 190635033.

**Undocumented**

### `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`

Source: `chunk-td7fxg34.js` · offset 190676712 · sha256 `abb8b4cc…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to turn off prompt suggestions, the grayed-out predictions that appear in your prompt input.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS`

Source: `chunk-t4yyetdp.js` · offset 190464382 · sha256 `47eef022…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t4yyetdp.js` offset 190464382.

**Undocumented**

### `CLAUDE_CODE_ENABLE_REMOTE_RECAP`

Source: `chunk-6y8bh1hn.js` · offset 190881893 · sha256 `93e0e7e0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-6y8bh1hn.js` offset 190881893.

**Undocumented**

### `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`

Source: `chunk-wyjbafrm.js` · offset 187004693 · sha256 `162e231d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 187004693.

**Undocumented**

### `CLAUDE_CODE_ENABLE_TASKS`

Source: `chunk-q8bx5xe3.js` · offset 182556395 · sha256 `789e280c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Selects which task-tracking tools Claude Code provides in sessions that have them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TODO_TOOLS`

Source: `chunk-wyjbafrm.js` · offset 186019623 · sha256 `9e897733…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to get the task-tracking tools on every model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT`

Source: `chunk-wyjbafrm.js` · offset 186117528 · sha256 `211e4580…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 186117528.

**Undocumented**

### `CLAUDE_CODE_ENABLE_XAA`

Source: `chunk-18sktzq8.js` · offset 176191503 · sha256 `a32876ef…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-18sktzq8.js` offset 176191503.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-1vt3h958.js` · offset 178510928 · sha256 `7c476da1…` · 77 read sites

Read as: string (trimmed; empty is treated as unset). Values: `local-agent`, `claude-desktop-3p`, `sdk-ts`, `sdk-py`, `sdk-cli`, `claude-vscode`, `claude-desktop`, `remote`, `remote_desktop`, `remote_cowork`, `claude-in-teams`, `local_agent`, `cli`, `remote_baku`, `remote_mobile`, `remote_projects`, `mcp`, `claude-code-github-action`, `claude_in_slack`, `claude-in-slack`, `ssh-remote`, `bench`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178510928.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-8v60mkqf.js` · offset 198397545 · sha256 `86b4d664…` · 25 read sites

Read as: string (trimmed; empty is treated as unset). Values: `byoc`, `bridge`.

Undocumented; read at `chunk-8v60mkqf.js` offset 198397545.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-8v60mkqf.js` · offset 198398202 · sha256 `e1654a9a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8v60mkqf.js` offset 198398202.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-020tq8de.js` · offset 206430912 · sha256 `fa5f0a3f…` · 26 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-020tq8de.js` offset 206430912.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-5b5dkraf.js` · offset 212358183 · sha256 `ee624a73…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-5b5dkraf.js` offset 212358183.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-4d9jedja.js` · offset 191014656 · sha256 `3f1dcc43…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4d9jedja.js` offset 191014656.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-r4xrzyvn.js` · offset 198971172 · sha256 `72bb31e0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

Source: `chunk-4n5mnmt6.js` · offset 182417161 · sha256 `25d9e31b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable agent teams.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_OBSERVER_AGENTS`

Source: `chunk-qd41mkrt.js` · offset 189950997 · sha256 `6b66f048…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qd41mkrt.js` offset 189950997.

**Undocumented**

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-wyjbafrm.js` · offset 184912374 · sha256 `c34fb80c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: JSON object to merge into the top level of every API request body.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_METADATA`

Source: `chunk-wyjbafrm.js` · offset 183024765 · sha256 `1e7f6a5b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183024765.

**Undocumented**

### `CLAUDE_CODE_FEDERATION_CACHE_DIR`

Source: `chunk-hkrvpm2b.js` · offset 177804943 · sha256 `c06c4761…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177804943.

**Undocumented**

### `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`

Source: `chunk-fybbw3x4.js` · offset 178738340 · sha256 `1dca00c6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the default token limit for file reads.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-pch978aj.js` · offset 182914486 · sha256 `19b816d5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

Undocumented; read at `chunk-pch978aj.js` offset 182914486.

**Undocumented**

### `CLAUDE_CODE_FLEETVIEW_SIMPLE`

Source: `chunk-8ddbmt6f.js` · offset 192832549 · sha256 `fec9df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8ddbmt6f.js` offset 192832549.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-mzg9kbjz.js` · offset 204359302 · sha256 `85294805…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mzg9kbjz.js` offset 204359302.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-mzg9kbjz.js` · offset 203785201 · sha256 `1a35ec20…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzg9kbjz.js` offset 203785201.

**Undocumented**

### `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM`

Source: `chunk-1vt3h958.js` · offset 178435200 · sha256 `4374665e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178435200.

**Undocumented**

### `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE`

Source: `chunk-g0v8qdjw.js` · offset 178053686 · sha256 `fd59f454…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force transcript persistence, prompt history, and `claude agents` registration even when this `claude` was launched from inside another Claude Code session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_STRIKETHROUGH`

Source: `chunk-h7czh3dz.js` · offset 188279791 · sha256 `a62ccdc5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force strikethrough rendering for `~~text~~` in Claude's responses when your terminal supports it but is not auto-detected, such as over SSH without `TERM_PROGRAM` forwarded.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_SYNC_OUTPUT`

Source: `chunk-nwdqs4bj.js` · offset 188366133 · sha256 `c543d0ff…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable DEC private mode 2026 synchronized output when your terminal supports it but is not auto-detected.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_TERMINAL_IMAGES`

Source: `chunk-nwdqs4bj.js` · offset 188364756 · sha256 `0a85c469…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nwdqs4bj.js` offset 188364756.

**Undocumented**

### `CLAUDE_CODE_FORCE_WINDOWS_CREDMAN`

Source: `chunk-2mgnea7j.js` · offset 177891658 · sha256 `3f0763ed…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-2mgnea7j.js` offset 177891658.

**Undocumented**

### `CLAUDE_CODE_FORK_SUBAGENT`

Source: `chunk-wyjbafrm.js` · offset 184281765 · sha256 `1a7edc8d…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls fork mode, which lets Claude spawn forked subagents itself and is on by default in interactive sessions only.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT`

Source: `chunk-cpf7rt77.js` · offset 191831082 · sha256 `a50b2622…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to emit subagent text and thinking blocks in `claude -p --output-format stream-json` output, the same behavior as the `--forward-subagent-text` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_USER_INTENT`

Source: `chunk-1vt3h958.js` · offset 178198017 · sha256 `72bec8cd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178198017.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_LOG`

Source: `chunk-rg6teng4.js` · offset 198242818 · sha256 `2e0a430f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rg6teng4.js` offset 198242818.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_SAMPLE_EVERY`

Source: `chunk-rg6teng4.js` · offset 198242871 · sha256 `8acc24f1…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `1`.

Undocumented; read at `chunk-rg6teng4.js` offset 198242871.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-0r1makwg.js` · offset 176434094 · sha256 `f6c95e4d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_HIDDEN`

Source: `chunk-wyjbafrm.js` · offset 183779468 · sha256 `7fef3404…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to exclude dotfiles from results when Claude invokes the Glob tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_NO_IGNORE`

Source: `chunk-wyjbafrm.js` · offset 183779415 · sha256 `f396df60…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to make the Glob tool respect `.gitignore` patterns.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-9yjanq6m.js` · offset 180620568 · sha256 `3c89eebb…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in seconds for Glob tool file discovery.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-td7fxg34.js` · offset 190666513 · sha256 `421e5a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 10080, digitsOnly true. Default (from code): `30`.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GORSE_PLOVER`

Source: `chunk-erjm8tsb.js` · offset 179179629 · sha256 `5946ea79…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179179629.

**Undocumented**

### `CLAUDE_CODE_GZIP_CCR_REQUEST_BODIES`

Source: `chunk-xhzhkvk3.js` · offset 179712784 · sha256 `8dc68f1f…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-xhzhkvk3.js` offset 179712784.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODIES`

Source: `chunk-xhzhkvk3.js` · offset 179712822 · sha256 `bc05e45c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-xhzhkvk3.js` offset 179712822.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODY_LEVEL`

Source: `chunk-xhzhkvk3.js` · offset 179712652 · sha256 `55a893ae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 9, digitsOnly true.

Undocumented; read at `chunk-xhzhkvk3.js` offset 179712652.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE`

Source: `chunk-55gzvmdf.js` · offset 179721085 · sha256 `df6ae3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-55gzvmdf.js` offset 179721085.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_CLOUD`

Source: `chunk-ze0kcaph.js` · offset 197894187 · sha256 `40c7c424…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ze0kcaph.js` offset 197894187.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_PACING_OFF`

Source: `chunk-dj4whss0.js` · offset 179739042 · sha256 `a6b5fd40…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dj4whss0.js` offset 179739042.

**Undocumented**

### `CLAUDE_CODE_HIDE_CWD`

Source: `chunk-0xfbbyhg.js` · offset 192537779 · sha256 `ab916658…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the working directory in the startup logo.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-94ks0f2h.js` · offset 175818561 · sha256 `1e801477…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-94ks0f2h.js` offset 175818561.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-8v60mkqf.js` · offset 198397734 · sha256 `65424d2e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8v60mkqf.js` offset 198397734.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-a964qqng.js` · offset 210270705 · sha256 `7cba2278…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `300000`.

Undocumented; read at `chunk-a964qqng.js` offset 210270705.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-a964qqng.js` · offset 210270779 · sha256 `356fd56e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `60000`.

Undocumented; read at `chunk-a964qqng.js` offset 210270779.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-wyjbafrm.js` · offset 184579238 · sha256 `7c5f9747…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184579238.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_ENV_VAR`

Source: `chunk-aqj8t7yt.js` · offset 179689530 · sha256 `9866d220…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ANTHROPIC_AUTH_TOKEN`.

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-aqj8t7yt.js` offset 179689530.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_REFRESH_TIMEOUT_MS`

Source: `chunk-r4xrzyvn.js` · offset 199033462 · sha256 `e2898b0c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-r4xrzyvn.js` offset 199033462.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-4f79m39g.js` · offset 179634597 · sha256 `c51d4504…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4f79m39g.js` offset 179634597.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-1vt3h958.js` · offset 178518849 · sha256 `1727d409…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `darwin`.

Undocumented; read at `chunk-1vt3h958.js` offset 178518849.

**Undocumented**

### `CLAUDE_CODE_HOST_SCHEDULED_RUN`

Source: `chunk-94ks0f2h.js` · offset 175820933 · sha256 `b89666ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-94ks0f2h.js` offset 175820933.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-1vt3h958.js` · offset 178500539 · sha256 `5970cab5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178500539.

**Undocumented**

### `CLAUDE_CODE_HOVER_REST`

Source: `chunk-p521683j.js` · offset 187599794 · sha256 `f2f700a5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-p521683j.js` offset 187599794.

**Undocumented**

### `CLAUDE_CODE_HUMBLE_HAMMOCK`

Source: `chunk-wyjbafrm.js` · offset 183856798 · sha256 `7bac3d99…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183856798.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-wyjbafrm.js` · offset 186034593 · sha256 `13c70d6f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the host address used to connect to the IDE extension.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`

Source: `chunk-wyjbafrm.js` · offset 186034093 · sha256 `67709670…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip auto-installation of IDE extensions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`

Source: `chunk-wyjbafrm.js` · offset 186027166 · sha256 `f07ea290…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip validation of IDE lockfile entries during connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-mzg9kbjz.js` · offset 203723251 · sha256 `c369462a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `75`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203723251.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-mzg9kbjz.js` · offset 203723143 · sha256 `4cb11ebe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203723143.

**Undocumented**

### `CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES`

Source: `chunk-cpf7rt77.js` · offset 191831036 · sha256 `2ec5d90f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cpf7rt77.js` offset 191831036.

**Undocumented**

### `CLAUDE_CODE_INLINE_TOOLS`

Source: `chunk-1vt3h958.js` · offset 178309239 · sha256 `6c18992e…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178309239.

**Undocumented**

### `CLAUDE_CODE_INTRO_FRAME`

Source: `chunk-wyjbafrm.js` · offset 184297747 · sha256 `698839a2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184297747.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-gg4jhzsm.js` · offset 209399002 · sha256 `0de12944…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gg4jhzsm.js` offset 209399002.

**Undocumented**

### `CLAUDE_CODE_JUNIPER_SUNDIAL`

Source: `chunk-wyjbafrm.js` · offset 186065671 · sha256 `7f21b654…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

Undocumented; read at `chunk-wyjbafrm.js` offset 186065671.

**Undocumented**

### `CLAUDE_CODE_KB_COHESION_FIXES`

Source: `chunk-d8zzyzhw.js` · offset 198198402 · sha256 `8ed256d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-d8zzyzhw.js` offset 198198402.

**Undocumented**

### `CLAUDE_CODE_LANTERN_PRISM`

Source: `chunk-ryzzp1n6.js` · offset 182859294 · sha256 `318044d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ryzzp1n6.js` offset 182859294.

**Undocumented**

### `CLAUDE_CODE_LARCH_CISTERN`

Source: `chunk-erjm8tsb.js` · offset 179179898 · sha256 `5502383a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179179898.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-hzevqd7x.js` · offset 182034649 · sha256 `c3a383e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hzevqd7x.js` offset 182034649.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-c7f0c5sp.js` · offset 190266936 · sha256 `0cb997e5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-c7f0c5sp.js` offset 190266936.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-24v8hqws.js` · offset 207336062 · sha256 `e2921932…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-24v8hqws.js` offset 207336062.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-wyjbafrm.js` · offset 184182889 · sha256 `482fa868…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `20`.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_CONTEXT_TOKENS`

Source: `chunk-1vt3h958.js` · offset 178427035 · sha256 `3237e39a…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the context window size Claude Code assumes for the active model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_EFFORT_REMINDER`

Source: `chunk-fr7r2xfj.js` · offset 179152999 · sha256 `cf1ec291…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-fr7r2xfj.js` offset 179152999.

**Undocumented**

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-wyjbafrm.js` · offset 184417295 · sha256 `bc6c35a8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_OUTPUT_TOKENS`

Source: `chunk-wyjbafrm.js` · offset 185042359 · sha256 `bf917afe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Set the maximum number of output tokens for most requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_RETRIES`

Source: `chunk-wyjbafrm.js` · offset 184910071 · sha256 `7979c44b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the number of times to retry failed API requests (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-h2dsckwd.js` · offset 182221789 · sha256 `6fc57800…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`

Source: `chunk-7dz9rvcm.js` · offset 190024893 · sha256 `984edcae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `10`.

From docs: Maximum number of read-only tools and subagents that can execute in parallel (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TURNS`

Source: `chunk-2tefsj0f.js` · offset 175590675 · sha256 `a023beee…`

Read as: string (trimmed; empty is treated as unset).

From docs: Cap the number of agentic turns when no explicit limit is passed.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-fgcgaa0x.js` · offset 182281563 · sha256 `c068574d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `200`.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-hkrvpm2b.js` · offset 177816528 · sha256 `f9e0beea…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-hkrvpm2b.js` · offset 177814805 · sha256 `ac766569…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814805.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-vzjrrtab.js` · offset 215104642 · sha256 `92c1abd0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-r4xrzyvn.js` · offset 198817955 · sha256 `47172fe3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-r4xrzyvn.js` offset 198817955.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-pez7h27x.js` · offset 176520491 · sha256 `e5f05822…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pez7h27x.js` offset 176520491.

**Undocumented**

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-hkrvpm2b.js` · offset 177814759 · sha256 `63fb2b7c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-gg4jhzsm.js` · offset 209339054 · sha256 `cc6c8538…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Idle timeout in milliseconds for MCP tool calls.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_PUSH_DELETE_MODE`

Source: `chunk-hzevqd7x.js` · offset 181257511 · sha256 `d1dd7dc7…`

Read as: enum (compared against fixed values). Values: `corroborate`, `immediate`, `never`.

Undocumented; read at `chunk-hzevqd7x.js` offset 181257511.

**Undocumented**

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-7dz9rvcm.js` · offset 190123733 · sha256 `024704bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7dz9rvcm.js` offset 190123733.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-1vt3h958.js` · offset 178497992 · sha256 `1679516e…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MODEL_CAPABILITIES`

Source: `chunk-y5k20gt2.js` · offset 176668908 · sha256 `a04a0c59…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-y5k20gt2.js` offset 176668908.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG`

Source: `chunk-y3dsk95a.js` · offset 191145034 · sha256 `dce6abf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-y3dsk95a.js` offset 191145034.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG_URL`

Source: `chunk-fnerys0a.js` · offset 190489555 · sha256 `0a1f4188…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-fnerys0a.js` offset 190489555.

**Undocumented**

### `CLAUDE_CODE_NANKEEN_KESTREL`

Source: `chunk-9yjanq6m.js` · offset 180607389 · sha256 `62f600b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yjanq6m.js` offset 180607389.

**Undocumented**

### `CLAUDE_CODE_NATIVE_CURSOR`

Source: `chunk-6sap1w9m.js` · offset 188769183 · sha256 `9973481d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to show the terminal's own cursor at the input caret instead of a drawn block.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NEW_INIT`

Source: `chunk-wyjbafrm.js` · offset 185673271 · sha256 `3988e65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to make `/init` run an interactive setup flow.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_FLICKER`

Source: `chunk-n3jtyenp.js` · offset 182201278 · sha256 `ffde9f68…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to enable fullscreen rendering, a research preview that reduces flicker and keeps memory flat in long conversations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_MODEL_FALLBACK`

Source: `chunk-1vt3h958.js` · offset 178412093 · sha256 `9a948e34…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178412093.

**Undocumented**

### `CLAUDE_CODE_NONBLOCKING_STDOUT`

Source: `chunk-6sap1w9m.js` · offset 188724117 · sha256 `7e045e30…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to write terminal output through a second non-blocking file descriptor, so a terminal that stops reading, such as a paused tmux control-mode pane or a stalled SSH connection, can't freeze Claude Code mid-session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_401_WAIT_MS`

Source: `chunk-1vt3h958.js` · offset 178688492 · sha256 `adf8c842…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-1vt3h958.js` offset 178688492.

**Undocumented**

### `CLAUDE_CODE_OAUTH_CLIENT_ID`

Source: `chunk-htj0346e.js` · offset 175688341 · sha256 `bd32389e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-htj0346e.js` offset 175688341.

**Undocumented**

### `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`

Source: `chunk-mddynm36.js` · offset 200566967 · sha256 `546b7627…`

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth refresh token for Claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_SCOPES`

Source: `chunk-mddynm36.js` · offset 200567023 · sha256 `f3d74416…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-1vt3h958.js` · offset 178690478 · sha256 `12619147…` · 41 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 24 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OAuth access token for claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-1vt3h958.js` · offset 178662433 · sha256 `e23b3439…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178662433.

**Undocumented**

### `CLAUDE_CODE_ORGANIZATION_UUID`

Source: `chunk-v43p42ed.js` · offset 177831941 · sha256 `2ece2065…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-v43p42ed.js` offset 177831941.

**Undocumented**

### `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`

Source: `chunk-7j5dabgj.js` · offset 192628294 · sha256 `66dea6e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to let Claude Code run your package manager's upgrade command in the background when a new version is available.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PARCHMENT_FERN`

Source: `chunk-erjm8tsb.js` · offset 179180650 · sha256 `6a5be7ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179180650.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-r4xrzyvn.js` · offset 198916544 · sha256 `580b35b6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `2000`.

Undocumented; read at `chunk-r4xrzyvn.js` offset 198916544.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-r4xrzyvn.js` · offset 198916806 · sha256 `6cf05dad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198916806.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-r4xrzyvn.js` · offset 198916756 · sha256 `2c52ce2b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198916756.

**Undocumented**

### `CLAUDE_CODE_PARSED_WILLOW`

Source: `chunk-wyjbafrm.js` · offset 186681871 · sha256 `3f4b28da…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186681871.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-fsbhbn29.js` · offset 176445355 · sha256 `2c8ec14a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to enable Perforce-aware write protection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PEWTER_OWL`

Source: `chunk-t4gyb870.js` · offset 182684351 · sha256 `5eab3bfa…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-t4gyb870.js` offset 182684351.

**Undocumented**

### `CLAUDE_CODE_PEWTER_OWL_TOOL`

Source: `chunk-t4gyb870.js` · offset 182684546 · sha256 `c8b4a783…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-t4gyb870.js` offset 182684546.

**Undocumented**

### `CLAUDE_CODE_PLAN_MODE_REQUIRED`

Source: `chunk-g0v8qdjw.js` · offset 178054998 · sha256 `446af310…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g0v8qdjw.js` offset 178054998.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-wyjbafrm.js` · offset 186651639 · sha256 `145ff368…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186651639.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-wyjbafrm.js` · offset 186651849 · sha256 `c08f81b3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186651849.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-5g1f8yqt.js` · offset 179210236 · sha256 `77a1c90e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5g1f8yqt.js` offset 179210236.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_BINARY_ASSETS`

Source: `chunk-wyjbafrm.js` · offset 186250674 · sha256 `c60f17b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 186250674.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-55wes79j.js` · offset 179244898 · sha256 `59ec7dd9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the plugins root directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIR_WATCH`

Source: `chunk-wyjbafrm.js` · offset 183399624 · sha256 `08a1ca6e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183399624.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-3z7wa894.js` · offset 189034903 · sha256 `be0843c0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-wyjbafrm.js` · offset 186165871 · sha256 `443f2a02…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`

Source: `chunk-wyjbafrm.js` · offset 186170678 · sha256 `9144e4f9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the re-clone attempt and keep using the existing marketplace checkout when a marketplace refresh can't reach or authenticate to the remote.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`

Source: `chunk-pez7h27x.js` · offset 176512695 · sha256 `6ede7fcb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to clone GitHub `owner/repo` shorthand sources over HTTPS instead of SSH.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-55wes79j.js` · offset 179245037 · sha256 `dd28fbd5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE`

Source: `chunk-wyjbafrm.js` · offset 183127320 · sha256 `a6a39434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 183127320.

**Undocumented**

### `CLAUDE_CODE_POLISHED_DEWDROP`

Source: `chunk-wyjbafrm.js` · offset 184858291 · sha256 `b3bc3546…`

Read as: enum (compared against fixed values). Values: `drop`, `block`, `off`.

Undocumented; read at `chunk-wyjbafrm.js` offset 184858291.

**Undocumented**

### `CLAUDE_CODE_POLL_EVENTS`

Source: `chunk-zknexg8w.js` · offset 181116874 · sha256 `481b54c4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zknexg8w.js` offset 181116874.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-1vt3h958.js` · offset 178556715 · sha256 `9cf5c70a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178556715.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-1vt3h958.js` · offset 178556855 · sha256 `d68b016f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178556855.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-1vt3h958.js` · offset 178556930 · sha256 `fc4fcde6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178556930.

**Undocumented**

### `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`

Source: `chunk-wyjbafrm.js` · offset 183452619 · sha256 `605a0977…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-n2ess9fd.js` · offset 203112269 · sha256 `55266f2b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `banner`, `step`.

Undocumented; read at `chunk-n2ess9fd.js` offset 203112269.

**Undocumented**

### `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`

Source: `chunk-r4xrzyvn.js` · offset 198788205 · sha256 `d5315498…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `600000`.

From docs: Ceiling in milliseconds on idle waiting for background subagents and workflows after the final turn in non-interactive mode with the `-p` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROACTIVE`

Source: `chunk-mzg9kbjz.js` · offset 205204703 · sha256 `b4a14159…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzg9kbjz.js` offset 205204703.

**Undocumented**

### `CLAUDE_CODE_PROCESS_WRAPPER`

Source: `chunk-jqrqt3kr.js` · offset 179680467 · sha256 `41415465…`

Read as: string (raw value; further parsing not traced).

From docs: Launch the processes Claude Code starts from its own binary, such as the background service that hosts agent view sessions, through a corporate launcher given as an argv prefix like `/opt/corp/launcher`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROFILE_STARTUP`

Source: `chunk-a3ghcnsr.js` · offset 176640201 · sha256 `48090143…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-a3ghcnsr.js` offset 176640201.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-2tefsj0f.js` · offset 175590059 · sha256 `46ee95ac…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROJECTS_SESSION`

Source: `chunk-wyjbafrm.js` · offset 184254196 · sha256 `109b7ab5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184254196.

**Undocumented**

### `CLAUDE_CODE_PROPAGATE_TRACEPARENT`

Source: `chunk-wyjbafrm.js` · offset 184918979 · sha256 `9c27f60b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`

Source: `chunk-aqj8t7yt.js` · offset 179689404 · sha256 `55abb6ea…` · 25 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set by host platforms that embed Claude Code and manage model provider routing on its behalf.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-wyjbafrm.js` · offset 183430384 · sha256 `941d165a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183430384.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-2crv8d5h.js` · offset 192069089 · sha256 `431f146e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2crv8d5h.js` offset 192069089.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-2crv8d5h.js` · offset 192069135 · sha256 `b41183a0…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2crv8d5h.js` offset 192069135.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-2crv8d5h.js` · offset 192068823 · sha256 `b0ac376e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2crv8d5h.js` offset 192068823.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-hkrvpm2b.js` · offset 177814132 · sha256 `ecac5ea0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814132.

**Undocumented**

### `CLAUDE_CODE_REFUSAL_FALLBACK_CATCH_ALL`

Source: `chunk-hzevqd7x.js` · offset 181668996 · sha256 `864b4300…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181668996.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-be92d2t5.js` · offset 188897208 · sha256 `d2231367…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-be92d2t5.js` offset 188897208.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-1vt3h958.js` · offset 178519111 · sha256 `9bf28f96…` · 172 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-1vt3h958.js` · offset 178519242 · sha256 `36b0bea4…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178519242.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-qfyt9xxm.js` · offset 179685023 · sha256 `3d74f7c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qfyt9xxm.js` offset 179685023.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-1vt3h958.js` · offset 178559882 · sha256 `e165e4bd…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178559882.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-my1bp942.js` · offset 182642550 · sha256 `26e703b9…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-my1bp942.js` offset 182642550.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-1vt3h958.js` · offset 178519474 · sha256 `66c81362…` · 46 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 15 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set automatically in cloud sessions to the current session's ID.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-v43p42ed.js` · offset 177822802 · sha256 `bb0ef760…`

Read as: string (trimmed; empty is treated as unset). Values: `review`.

Undocumented; read at `chunk-v43p42ed.js` offset 177822802.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_FORWARD`

Source: `chunk-3r295g4p.js` · offset 179134794 · sha256 `403d6cb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-3r295g4p.js` offset 179134794.

**Undocumented**

### `CLAUDE_CODE_REMOTE_TOOLS_PIN_STORED_LOGIN`

Source: `chunk-8mkwx7mn.js` · offset 176685936 · sha256 `4a5b8e49…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8mkwx7mn.js` offset 176685936.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-93fap8m8.js` · offset 181177938 · sha256 `ed0db984…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-93fap8m8.js` offset 181177938.

**Undocumented**

### `CLAUDE_CODE_REPORT_FINDINGS`

Source: `chunk-cajb2b5v.js` · offset 191531318 · sha256 `83bab3f4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cajb2b5v.js` offset 191531318.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-2tefsj0f.js` · offset 175591138 · sha256 `34ebe303…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-r4xrzyvn.js` · offset 199215833 · sha256 `8de15ab6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199215833.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-8v60mkqf.js` · offset 198397774 · sha256 `51a22bee…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-wyjbafrm.js` · offset 185789365 · sha256 `368abfd7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-wyjbafrm.js` · offset 185788984 · sha256 `6d26b33b…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `Continue from where you left off.`.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-wyjbafrm.js` · offset 185789086 · sha256 `86742cd5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 185789086.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-7sqj04a7.js` · offset 198494155 · sha256 `18c89164…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7sqj04a7.js` offset 198494155.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-mzg9kbjz.js` · offset 203937002 · sha256 `560978fe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `70`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203937002.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-mzg9kbjz.js` · offset 203937047 · sha256 `4856fb83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203937047.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-r4xrzyvn.js` · offset 198916868 · sha256 `07bb30dc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198916868.

**Undocumented**

### `CLAUDE_CODE_RETRY_WATCHDOG`

Source: `chunk-wyjbafrm.js` · offset 184894354 · sha256 `cfbe7798…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` for unattended sessions such as eval harnesses, CI jobs, or remote workers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RUSTLING_PIXEL`

Source: `chunk-wyjbafrm.js` · offset 184861079 · sha256 `bd7707c3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184861079.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-2tefsj0f.js` · offset 175591061 · sha256 `470f14bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-1vt3h958.js` · offset 178578797 · sha256 `1891ad2e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178578797.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-hkrvpm2b.js` · offset 177811193 · sha256 `271d8941…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-m24vnr98.js` · offset 213405609 · sha256 `7ff1728b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH`

Source: `chunk-r4xrzyvn.js` · offset 199033405 · sha256 `44e72a15…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199033405.

**Undocumented**

### `CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH`

Source: `chunk-1vt3h958.js` · offset 178657043 · sha256 `3d742d83…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178657043.

**Undocumented**

### `CLAUDE_CODE_SEND_FEEDBACK`

Source: `chunk-2x9nh7nz.js` · offset 190314843 · sha256 `95ea5704…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off Claude-drafted feedback for a session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-v43p42ed.js` · offset 177831406 · sha256 `ba44bc9b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-94ks0f2h.js` · offset 175820678 · sha256 `5f1f30e9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-94ks0f2h.js` offset 175820678.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-edtry2rt.js` · offset 180947627 · sha256 `b85d590a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-bhbzzqzs.js` · offset 175393613 · sha256 `ca22b404…` · 42 read sites

Read as: string (trimmed; empty is treated as unset). Values: `bg`.

Undocumented; read at `chunk-bhbzzqzs.js` offset 175393613.

**Undocumented**

### `CLAUDE_CODE_SESSION_LOG`

Source: `chunk-1vt3h958.js` · offset 178498121 · sha256 `0a5415fc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178498121.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-1vt3h958.js` · offset 178496848 · sha256 `25e3352a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178496848.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-1vt3h958.js` · offset 178548665 · sha256 `89e071e5…` · 2 read sites

Read as: enum (compared against fixed values). Values: `claude_ai_chat`.

Undocumented; read at `chunk-1vt3h958.js` offset 178548665.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-r4xrzyvn.js` · offset 198946265 · sha256 `bea79228…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-r4xrzyvn.js` offset 198946265.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-wyjbafrm.js` · offset 185096854 · sha256 `adf97071…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `1500`.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-wyjbafrm.js` · offset 186636993 · sha256 `31413206…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the shell Claude Code uses to run Bash tool commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-gg4jhzsm.js` · offset 209363099 · sha256 `2d9e653f…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SILENT_TURN_REMINDER`

Source: `chunk-wyjbafrm.js` · offset 186058603 · sha256 `4d7a230e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186058603.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT`

Source: `chunk-wyjbafrm.js` · offset 186058389 · sha256 `bfa469d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186058389.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TURNS`

Source: `chunk-wyjbafrm.js` · offset 186058753 · sha256 `3bfef62d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-wyjbafrm.js` offset 186058753.

**Undocumented**

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-2tefsj0f.js` · offset 175590992 · sha256 `e7139545…` · 16 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-erjm8tsb.js` · offset 179181169 · sha256 `cf484739…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-hkrvpm2b.js` · offset 177814462 · sha256 `ae0e1afb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814462.

**Undocumented**

### `CLAUDE_CODE_SKILL_PROPOSALS`

Source: `chunk-wyjbafrm.js` · offset 183549658 · sha256 `0b60af6f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 183549658.

**Undocumented**

### `CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS`

Source: `chunk-1vt3h958.js` · offset 178319649 · sha256 `9bd83e99…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to treat a failed fast mode availability check as available, for networks that block the check's direct request to `api.anthropic.com`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK`

Source: `chunk-1vt3h958.js` · offset 178317970 · sha256 `51819982…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the client-side fast mode availability check, for proxies that intercept the check's request rather than refuse it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS`

Source: `chunk-wyjbafrm.js` · offset 183321289 · sha256 `322d3de0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 183321289.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS_EXCEPT`

Source: `chunk-wyjbafrm.js` · offset 183321014 · sha256 `ac1ed8d9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183321014.

**Undocumented**

### `CLAUDE_CODE_SKIP_PROMPT_HISTORY`

Source: `chunk-hzevqd7x.js` · offset 181618354 · sha256 `dfa39084…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip writing prompt history and session transcripts to disk.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS`

Source: `chunk-3rswxk6s.js` · offset 175641132 · sha256 `2d40a3a5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-3rswxk6s.js` offset 175641132.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-a3ghcnsr.js` · offset 176639733 · sha256 `484bfa9f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-a3ghcnsr.js` offset 176639733.

**Undocumented**

### `CLAUDE_CODE_SQUISHY_NEWT`

Source: `chunk-wyjbafrm.js` · offset 186681951 · sha256 `593678e1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186681951.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-wyjbafrm.js` · offset 186023315 · sha256 `3c3064ab…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186023315.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-avx2hrwa.js` · offset 187092309 · sha256 `d1de753e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-avx2hrwa.js` offset 187092309.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-ccqhq6xj.js` · offset 179001073 · sha256 `829fede0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STELLAR_DRIFT`

Source: `chunk-wyjbafrm.js` · offset 183848366 · sha256 `fd80c4e2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183848366.

**Undocumented**

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-td7fxg34.js` · offset 190786036 · sha256 `679999c7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `8`.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL`

Source: `chunk-7dz9rvcm.js` · offset 190068116 · sha256 `a4e439aa…`

Read as: string (trimmed; empty is treated as unset).

From docs: The default model for subagents, agent team teammates, and workflow agents that aren't assigned a model another way.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`

Source: `chunk-3qcnxvnw.js` · offset 190168760 · sha256 `1f181030…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force one model onto subagents, teammates, and workflow agents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-8mkwx7mn.js` · offset 176705973 · sha256 `32d88409…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-hkrvpm2b.js` · offset 177814080 · sha256 `3bac6f02…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177814080.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-2tefsj0f.js` · offset 175591383 · sha256 `ca2a97fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2tefsj0f.js` offset 175591383.

**Undocumented**

### `CLAUDE_CODE_SUPPRESS_SESSION_ATTRIBUTION`

Source: `chunk-wyjbafrm.js` · offset 183806518 · sha256 `5d00e83b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 183806518.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`

Source: `chunk-2crv8d5h.js` · offset 192094602 · sha256 `65428678…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode (the `-p` flag) to wait for plugin installation to complete before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-r4xrzyvn.js` · offset 199086286 · sha256 `289123bc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in milliseconds for synchronous plugin installation.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS`

Source: `chunk-edtry2rt.js` · offset 180917136 · sha256 `0d015816…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-edtry2rt.js` offset 180917136.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-edtry2rt.js` · offset 180952893 · sha256 `9f9c61c9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-edtry2rt.js` offset 180952893.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-edtry2rt.js` · offset 180951219 · sha256 `7bb68b87…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `60000`.

Undocumented; read at `chunk-edtry2rt.js` offset 180951219.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-wyjbafrm.js` · offset 183147453 · sha256 `52621edc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-wyjbafrm.js` offset 183147453.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-wyjbafrm.js` · offset 183147528 · sha256 `ee1187e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `10000`.

Undocumented; read at `chunk-wyjbafrm.js` offset 183147528.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-wyjbafrm.js` · offset 183144735 · sha256 `10976ffa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 86400000.

Undocumented; read at `chunk-wyjbafrm.js` offset 183144735.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-edtry2rt.js` · offset 180917164 · sha256 `ffd902d2…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-edtry2rt.js` offset 180917164.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS`

Source: `chunk-eavr3pjy.js` · offset 191710368 · sha256 `86fc5960…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode with the `-p` flag to make Claude Code download the skills enabled for your claude.ai account in that run and wait for the list of them, up to `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`, before it runs the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-eavr3pjy.js` · offset 191699297 · sha256 `6b53f454…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-eavr3pjy.js` · offset 191699213 · sha256 `de00dd5e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-ee16pmkr.js` · offset 199938829 · sha256 `ef3cce71…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `false` to disable syntax highlighting in diff output.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-r4xrzyvn.js` · offset 199077940 · sha256 `5ca80899…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199077940.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-1vt3h958.js` · offset 178519590 · sha256 `aa86fbdc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178519590.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-mzg9kbjz.js` · offset 203736681 · sha256 `8ea2a4a3…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Share a task list across sessions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-r4xrzyvn.js` · offset 199023981 · sha256 `701641f9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1000, max 60000. Default (from code): `10000`.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEE_SDK_STDOUT`

Source: `chunk-8v60mkqf.js` · offset 198380578 · sha256 `3b7d3d72…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8v60mkqf.js` offset 198380578.

**Undocumented**

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-mh1k3k33.js` · offset 205476315 · sha256 `eb007c40…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mh1k3k33.js` offset 205476315.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-9r9kpwh0.js` · offset 177382808 · sha256 `32d7e817…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9r9kpwh0.js` offset 177382808.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-wyjbafrm.js` · offset 183600163 · sha256 `e061786e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183600163.

**Undocumented**

### `CLAUDE_CODE_THINKING_DISPLAY_UPDATES`

Source: `chunk-wyjbafrm.js` · offset 184815617 · sha256 `6c6cabb4…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184815617.

**Undocumented**

### `CLAUDE_CODE_THISTLE_GREBE`

Source: `chunk-1vt3h958.js` · offset 178182550 · sha256 `da23ea8a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178182550.

**Undocumented**

### `CLAUDE_CODE_THRIFTY_SONIC`

Source: `chunk-erjm8tsb.js` · offset 179179031 · sha256 `ea9dc2ed…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-erjm8tsb.js` offset 179179031.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-9yjanq6m.js` · offset 180471700 · sha256 `299a7e96…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the temp directory used for internal temp files.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-y5f6f73g.js` · offset 203196428 · sha256 `f3917ec9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-y5f6f73g.js` offset 203196428.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-y5f6f73g.js` · offset 203196389 · sha256 `d3dc1e92…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y5f6f73g.js` offset 203196389.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-g1gybmy1.js` · offset 199246954 · sha256 `c0a56997…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-g1gybmy1.js` offset 199246954.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-3mdsq6vb.js` · offset 177177953 · sha256 `1caa1ae1…`

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TODO_REMINDER_MODE`

Source: `chunk-wyjbafrm.js` · offset 186065314 · sha256 `5abe0e33…`

Read as: enum (compared against fixed values). Values: `baseline`, `off`.

Undocumented; read at `chunk-wyjbafrm.js` offset 186065314.

**Undocumented**

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-pez7h27x.js` · offset 176520199 · sha256 `5b70bef7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-pez7h27x.js` · offset 176518449 · sha256 `1f539dfd…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`

Source: `chunk-wyjbafrm.js` · offset 184278119 · sha256 `ffe6d7ce…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184278119.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_AFTER_USER_TURN`

Source: `chunk-wyjbafrm.js` · offset 184278946 · sha256 `ddd4b616…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184278946.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`

Source: `chunk-wyjbafrm.js` · offset 184278511 · sha256 `606df25d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184278511.

**Undocumented**

### `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`

Source: `chunk-8v60mkqf.js` · offset 198358781 · sha256 `3ecaf12b…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8v60mkqf.js` offset 198358781.

**Undocumented**

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-g1gybmy1.js` · offset 199246875 · sha256 `e89ecb6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-g1gybmy1.js` offset 199246875.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-mzg9kbjz.js` · offset 203712643 · sha256 `4aa0a028…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`, `default`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203712643.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-n3jtyenp.js` · offset 182200472 · sha256 `f52b2d89…`

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`.

Undocumented; read at `chunk-n3jtyenp.js` offset 182200472.

**Undocumented**

### `CLAUDE_CODE_TURN_UPDATES`

Source: `chunk-wyjbafrm.js` · offset 184286052 · sha256 `924dab76…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184286052.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-rwx9yk1k.js` · offset 194850595 · sha256 `d80da839…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rwx9yk1k.js` offset 194850595.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-sgghn731.js` · offset 190972999 · sha256 `4abb04e7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sgghn731.js` offset 190972999.

**Undocumented**

### `CLAUDE_CODE_USE_COWORK_PLUGINS`

Source: `chunk-18sktzq8.js` · offset 176371511 · sha256 `225ab54c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-18sktzq8.js` offset 176371511.

**Undocumented**

### `CLAUDE_CODE_USE_POWERSHELL_TOOL`

Source: `chunk-4d9jedja.js` · offset 191036715 · sha256 `0bf9df8a…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls the PowerShell tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-hzevqd7x.js` · offset 181665546 · sha256 `46d08d18…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_EMAIL`

Source: `chunk-1vt3h958.js` · offset 178728100 · sha256 `2347c88b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178728100.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-nkm61j3j.js` · offset 208215732 · sha256 `b4c3c91f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nkm61j3j.js` offset 208215732.

**Undocumented**

### `CLAUDE_CODE_WEB_FETCH_AGENT`

Source: `chunk-wyjbafrm.js` · offset 184265022 · sha256 `cbf3526c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184265022.

**Undocumented**

### `CLAUDE_CODE_WEB_SEARCH_FAST_ARG`

Source: `chunk-fgcgaa0x.js` · offset 182276143 · sha256 `3c325b89…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-fgcgaa0x.js` offset 182276143.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS`

Source: `chunk-9y6jrbmp.js` · offset 182423002 · sha256 `8d500e83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `900000`.

From docs: Set to the number of milliseconds WebFetch keeps each fetched URL's response cached.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBFETCH_DEADLINE_MS`

Source: `chunk-wyjbafrm.js` · offset 184236153 · sha256 `79263864…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

From docs: Upper bound in milliseconds on how long WebFetch waits for a page to download, including any redirects it follows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR`

Source: `chunk-2crv8d5h.js` · offset 192068083 · sha256 `3df5ab6a…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2crv8d5h.js` offset 192068083.

**Undocumented**

### `CLAUDE_CODE_WILLOW_TERN`

Source: `chunk-erjm8tsb.js` · offset 179180198 · sha256 `4be21696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-erjm8tsb.js` offset 179180198.

**Undocumented**

### `CLAUDE_CODE_WISE_COMET`

Source: `chunk-wyjbafrm.js` · offset 183906947 · sha256 `05978c0d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183906947.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-wyjbafrm.js` · offset 186520925 · sha256 `9723da95…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 186520925.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-r4xrzyvn.js` · offset 199127868 · sha256 `325e02bb…` · 14 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-r4xrzyvn.js` offset 199127868.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`

Source: `chunk-ak3102st.js` · offset 194618502 · sha256 `74e013c4…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 256, digitsOnly true.

From docs: How many agents a single workflow run executes at once, from `1` to `256`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS`

Source: `chunk-mzg9kbjz.js` · offset 204028510 · sha256 `27d03ba3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mzg9kbjz.js` offset 204028510.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_TOKENS`

Source: `chunk-mzg9kbjz.js` · offset 204028591 · sha256 `cb3ff7f8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-mzg9kbjz.js` offset 204028591.

**Undocumented**

### `CLAUDE_CODE_WORKFLOWS`

Source: `chunk-7jh19beg.js` · offset 179150001 · sha256 `9f543338…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-7jh19beg.js` offset 179150001.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-s92h89q7.js` · offset 180791413 · sha256 `30722e3d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s92h89q7.js` offset 180791413.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-2mgnea7j.js` · offset 177891580 · sha256 `8c4b69f4…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the configuration directory (default: `~/.claude`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-4f79m39g.js` · offset 179573414 · sha256 `4ad6dc1e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4f79m39g.js` offset 179573414.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-4f79m39g.js` · offset 179492452 · sha256 `3ca2d6e8…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4f79m39g.js` offset 179492452.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-wyjbafrm.js` · offset 183518073 · sha256 `d01657be…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 183518073.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-1vt3h958.js` · offset 178559926 · sha256 `7bd86655…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178559926.

**Undocumented**

### `CLAUDE_DEBUG`

Source: `chunk-2crv8d5h.js` · offset 192067393 · sha256 `96be69e5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2crv8d5h.js` offset 192067393.

**Undocumented**

### `CLAUDE_DISABLE_ADOPT`

Source: `chunk-dcct10f1.js` · offset 190904759 · sha256 `d04f1eb4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop in-flight background work instead of carrying it over when you background a session by pressing `←` or with `/background`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG`

Source: `chunk-hzevqd7x.js` · offset 181702295 · sha256 `1824e7c2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to force-enable the byte-level streaming idle watchdog, or set to `0` to force-disable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_STREAM_WATCHDOG`

Source: `chunk-7dz9rvcm.js` · offset 190104665 · sha256 `806c8256…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to force-disable the event-level streaming idle watchdog, or set to `1` to force-enable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-wyjbafrm.js` · offset 183422564 · sha256 `2b00ca24…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-mzg9kbjz.js` · offset 204539184 · sha256 `7b164eac…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mzg9kbjz.js` offset 204539184.

**Undocumented**

### `CLAUDE_IMPORT_CONVERSATIONS`

Source: `chunk-631bp7ap.js` · offset 200535318 · sha256 `1f18d8e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-631bp7ap.js` offset 200535318.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-3med333c.js` · offset 207519529 · sha256 `9739119e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-3med333c.js` offset 207519529.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-1vt3h958.js` · offset 178547387 · sha256 `12927d55…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178547387.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-4f79m39g.js` · offset 179636995 · sha256 `153cf60a…` · 33 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_LOCAL_OAUTH_API_BASE`

Source: `chunk-htj0346e.js` · offset 175686383 · sha256 `25070d02…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-htj0346e.js` offset 175686383.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_APPS_BASE`

Source: `chunk-htj0346e.js` · offset 175686469 · sha256 `92a2b48d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-htj0346e.js` offset 175686469.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_CONSOLE_BASE`

Source: `chunk-htj0346e.js` · offset 175686556 · sha256 `dd40e55a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-htj0346e.js` offset 175686556.

**Undocumented**

### `CLAUDE_MEMORY_STORES`

Source: `chunk-1vt3h958.js` · offset 178560098 · sha256 `69001abe…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178560098.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-2t4rrbsd.js` · offset 206895220 · sha256 `fac36c80…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2t4rrbsd.js` offset 206895220.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-w4m48xb9.js` · offset 192927429 · sha256 `104db100…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-w4m48xb9.js` offset 192927429.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-w4m48xb9.js` · offset 192923962 · sha256 `da907461…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-w4m48xb9.js` offset 192923962.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-w4m48xb9.js` · offset 192927660 · sha256 `58aef346…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-w4m48xb9.js` offset 192927660.

**Undocumented**

### `CLAUDE_PTY_RECORD`

Source: `chunk-w4m48xb9.js` · offset 192924529 · sha256 `7b0a5f6f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-w4m48xb9.js` offset 192924529.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-cpf7rt77.js` · offset 191775745 · sha256 `77664f78…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cpf7rt77.js` offset 191775745.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-c08084zd.js` · offset 182732678 · sha256 `2067b8e5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-aa1wynsd.js` · offset 194686620 · sha256 `679ff90d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aa1wynsd.js` offset 194686620.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-aa1wynsd.js` · offset 194686328 · sha256 `f5aa6e96…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aa1wynsd.js` offset 194686328.

**Undocumented**

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-8v60mkqf.js` · offset 198380624 · sha256 `4d11426e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 3.

Undocumented; read at `chunk-8v60mkqf.js` offset 198380624.

**Undocumented**

### `CLAUDE_RUNNER_API_BASE_URL`

Source: `chunk-5bd42gny.js` · offset 178977413 · sha256 `bed6faf5…`

Read as: string (raw value; further parsing not traced).

From docs: Anthropic API base URL for session-scoped calls

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_DISABLE_AWAITING_ACTION_OVERRIDE`

Source: `chunk-y8am1j53.js` · offset 187370424 · sha256 `ea910ff4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187370424.

**Undocumented**

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-7k6n1zya.js` · offset 187193622 · sha256 `9d2ceeca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Git fetch depth for fresh clones.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-5bd42gny.js` · offset 178977256 · sha256 `b7ce016c…`

Read as: string (raw value; further parsing not traced).

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SKIP_GIT_VERIFY`

Source: `chunk-tm5nr0r0.js` · offset 187144924 · sha256 `21df957f…`

Read as: enum (compared against fixed values). Values: `1`.

From docs: When `1`, skip the `.git` presence check after a `checkout` hook runs.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-at0dnfcj.js` · offset 207286353 · sha256 `d7b49142…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-at0dnfcj.js` offset 207286353.

**Undocumented**

### `CLAUDE_SESSION_INGRESS_TOKEN_FILE`

Source: `chunk-v43p42ed.js` · offset 177831230 · sha256 `5fa5ddd7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Absolute path to a per-session file holding the current session JWT, kept fresh across token refreshes.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SLOW_FIRST_BYTE_MS`

Source: `chunk-wyjbafrm.js` · offset 184988435 · sha256 `cc4e40d3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-wyjbafrm.js` offset 184988435.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-hzevqd7x.js` · offset 181238191 · sha256 `37979d75…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181238191.

**Undocumented**

### `CLAUDE_STREAM_FIRST_BYTE_TIMEOUT_MS`

Source: `chunk-hzevqd7x.js` · offset 181697739 · sha256 `74df571c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Deadline in milliseconds for the first response byte of a streaming request, on the connections where the first-byte deadline runs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-hzevqd7x.js` · offset 181697251 · sha256 `590260fd…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds before the event- and byte-level streaming idle watchdogs close a stalled connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_TMPDIR`

Source: `chunk-9yjanq6m.js` · offset 180471732 · sha256 `3b749fcd…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180471732.

**Undocumented**

### `CLAUDE_TRUSTED_DEVICE_TOKEN`

Source: `chunk-zhhyqv12.js` · offset 180890489 · sha256 `e362b7c4…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-zhhyqv12.js` offset 180890489.

**Undocumented**

### `CLAUDE_WORKFLOW_NAME_ONLY`

Source: `chunk-c3d4jstz.js` · offset 194570185 · sha256 `b910c419…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-c3d4jstz.js` offset 194570185.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-94ks0f2h.js` · offset 175820832 · sha256 `a9cd3cb6…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Documented: https://code.claude.com/docs/en/env-vars

### `CLIPBOARD_NAPI_NODE_PATH`

Source: `chunk-ddjnk2nr.js` · offset 182206905 · sha256 `08bacc2c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ddjnk2nr.js` offset 182206905.

**Undocumented**

### `CONTAINER_SANDBOX_MOUNT_POINT`

Source: `chunk-1vt3h958.js` · offset 178494465 · sha256 `9f0f77c0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178494465.

**Undocumented**

### `DEBUG_CLAUDE_AGENT_SDK`

Source: `chunk-xwgs2xvp.js` · offset 199851037 · sha256 `3a24d5e0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xwgs2xvp.js` offset 199851037.

**Undocumented**

### `DEBUG_SDK`

Source: `chunk-3rswxk6s.js` · offset 175631780 · sha256 `4c7983f1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-3rswxk6s.js` offset 175631780.

**Undocumented**

### `DEMO_VERSION`

Source: `chunk-0xfbbyhg.js` · offset 192537180 · sha256 `aa2ade84…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0xfbbyhg.js` offset 192537180.

**Undocumented**

### `DISABLE_AUTO_COMPACT`

Source: `chunk-wyjbafrm.js` · offset 183906270 · sha256 `958ef69a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic compaction when approaching the context limit.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-1vt3h958.js` · offset 178618375 · sha256 `5ab2aa30…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic background updates.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_BRIEF_MODE_STOP_HOOK`

Source: `chunk-td7fxg34.js` · offset 190677258 · sha256 `f348af56…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-td7fxg34.js` offset 190677258.

**Undocumented**

### `DISABLE_BUG_COMMAND`

Source: `chunk-hzevqd7x.js` · offset 181668114 · sha256 `f52f9937…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COMPACT`

Source: `chunk-1vt3h958.js` · offset 178425649 · sha256 `6c34486b…` · 12 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all compaction: both automatic compaction and the manual `/compact` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COST_WARNINGS`

Source: `chunk-hzevqd7x.js` · offset 181641424 · sha256 `8ac37cb3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable cost warning messages

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_DOCTOR_COMMAND`

Source: `chunk-cajb2b5v.js` · offset 191610502 · sha256 `ee7207c3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/doctor` setup checkup skill and its `/checkup` alias.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_ERROR_REPORTING`

Source: `chunk-j6zsezqx.js` · offset 175678196 · sha256 `1aa9728e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of error reporting. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn error reporting back on

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_EXTRA_USAGE_COMMAND`

Source: `chunk-1vt3h958.js` · offset 178703056 · sha256 `b9b14308…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/usage-credits` command that lets users purchase additional usage beyond rate limits

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_FEEDBACK_COMMAND`

Source: `chunk-hzevqd7x.js` · offset 181667999 · sha256 `5e33f8be…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the `/feedback` command and Claude-drafted feedback.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_GROWTHBOOK`

Source: `chunk-38djgp32.js` · offset 181141885 · sha256 `a0cfeb1e…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` or `true` to disable GrowthBook feature-flag fetching and use code defaults for every flag.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALL_GITHUB_APP_COMMAND`

Source: `chunk-wyjbafrm.js` · offset 185698881 · sha256 `3316960d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/install-github-app` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALLATION_CHECKS`

Source: `chunk-65xggd6t.js` · offset 187074836 · sha256 `4c27a2dd…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable installation warnings.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INTERLEAVED_THINKING`

Source: `chunk-1vt3h958.js` · offset 178437301 · sha256 `e341ccff…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent sending the interleaved-thinking beta header.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGIN_COMMAND`

Source: `chunk-wyjbafrm.js` · offset 185698415 · sha256 `9de9e197…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/login` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGOUT_COMMAND`

Source: `chunk-wyjbafrm.js` · offset 185698583 · sha256 `ddc0075c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/logout` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPDATES`

Source: `chunk-1vt3h958.js` · offset 178618307 · sha256 `3a3c9989…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to block all updates including manual `claude update` and `claude install`.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPGRADE_COMMAND`

Source: `chunk-hzevqd7x.js` · offset 181621763 · sha256 `4885b0e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/upgrade` command

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_CLAUDEAI_MCP_SERVERS`

Source: `chunk-wyjbafrm.js` · offset 183332838 · sha256 `a8b4022d…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to stop Claude Code from fetching claude.ai MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_MCP_LARGE_OUTPUT_FILES`

Source: `chunk-gg4jhzsm.js` · offset 209420308 · sha256 `9b7436ef…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-gg4jhzsm.js` offset 209420308.

**Undocumented**

### `ENABLE_TOOL_SEARCH`

Source: `chunk-sx0h63sh.js` · offset 179416978 · sha256 `7f68bf8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Controls MCP tool search.

Documented: https://code.claude.com/docs/en/env-vars

### `FALLBACK_FOR_ALL_PRIMARY_MODELS`

Source: `chunk-wyjbafrm.js` · offset 184901132 · sha256 `78f6ad2c…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to any non-empty value, such as `1`, to make Claude Code stop retrying on repeated overload errors for every model when no fallback model is configured. **Setting it to `0` or `false` still enables this**, unlike most on/off variables; unset the variable to restore the default retry behavior.

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_AUTOUPDATE_PLUGINS`

Source: `chunk-1vt3h958.js` · offset 178618116 · sha256 `531c9c29…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`

Documented: https://code.claude.com/docs/en/env-vars

### `HOMESHARE`

Source: `chunk-hzevqd7x.js` · offset 181380608 · sha256 `116437b6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181380608.

**Undocumented**

### `IS_DEMO`

Source: `chunk-awvb9gqk.js` · offset 200546080 · sha256 `98b8eb2b…` · 14 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to enable demo mode: hides your email and organization name from the header and `/status` output, and skips onboarding. **Setting it to `0` or `false` still enables demo mode**, unlike most on/off variables; unset the variable to turn it off.

Documented: https://code.claude.com/docs/en/env-vars

### `IS_SANDBOX`

Source: `chunk-1vt3h958.js` · offset 178306685 · sha256 `56348ca3…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `1`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-1vt3h958.js` offset 178306685.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-geg6jndb.js` · offset 193298988 · sha256 `357e1b70…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-geg6jndb.js` offset 193298988.

**Undocumented**

### `MAX_MCP_OUTPUT_TOKENS`

Source: `chunk-y09rhn85.js` · offset 202809312 · sha256 `8c5ef5cd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of tokens allowed in MCP tool responses.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_STRUCTURED_OUTPUT_RETRIES`

Source: `chunk-ak3102st.js` · offset 194637537 · sha256 `d2c05d1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Number of attempts Claude Code allows when the model's response fails validation against the `--json-schema` in non-interactive mode with the `-p` flag; after that many failed attempts with no valid output, the run fails.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_THINKING_TOKENS`

Source: `chunk-1vt3h958.js` · offset 178433553 · sha256 `25a11b54…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Fixed token budget for extended thinking.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CLIENT_SECRET`

Source: `chunk-8162zx47.js` · offset 209055132 · sha256 `38093413…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth client secret for MCP servers that require pre-configured credentials.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-4v3gzrwd.js` · offset 182806570 · sha256 `49ffbd08…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-qs3gr6xw.js` · offset 192023422 · sha256 `55b6fd6e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-wyjbafrm.js` · offset 184327061 · sha256 `f3c1c20e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Turns the MCP discovery cache on or off.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-z0hhvxdm.js` · offset 191995293 · sha256 `6075690d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-z0hhvxdm.js` · offset 191994656 · sha256 `d71a3eb9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-z0hhvxdm.js` · offset 191995204 · sha256 `ebb2b99a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-g4pwm02z.js` · offset 208579306 · sha256 `63af4c00…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-8162zx47.js` · offset 209012568 · sha256 `801a0e59…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8162zx47.js` offset 209012568.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-w61ke47p.js` · offset 209125241 · sha256 `536099b7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-gg4jhzsm.js` · offset 209353826 · sha256 `153f3a1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `20`.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-nm1jfrzb.js` · offset 182497778 · sha256 `231a32e2…`

Read as: string (trimmed; empty is treated as unset).

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-gg4jhzsm.js` · offset 209353767 · sha256 `7d6d913c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `3`.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-4v3gzrwd.js` · offset 182806492 · sha256 `b9a49083…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-gg4jhzsm.js` · offset 209338864 · sha256 `4002a2b8…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-wyjbafrm.js` · offset 184225017 · sha256 `f467df82…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 184225017.

**Undocumented**

### `MCP_XAA_IDP_CLIENT_SECRET`

Source: `chunk-fpm1n408.js` · offset 202715222 · sha256 `f2acd65a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-fpm1n408.js` offset 202715222.

**Undocumented**

### `PLAYWRIGHT_BROWSERS_PATH`

Source: `chunk-pmke923e.js` · offset 191185433 · sha256 `2f5fd224…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pmke923e.js` offset 191185433.

**Undocumented**

### `RUNNER_ENVIRONMENT`

Source: `chunk-1vt3h958.js` · offset 178520918 · sha256 `1c7f10fd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178520918.

**Undocumented**

### `RUNNER_OS`

Source: `chunk-1vt3h958.js` · offset 178520971 · sha256 `4febb421…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178520971.

**Undocumented**

### `RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-y8am1j53.js` · offset 187471012 · sha256 `7cd461dd…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187471012.

**Undocumented**

### `SAFEUSER`

Source: `chunk-wyjbafrm.js` · offset 185663971 · sha256 `7cf0f156…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wyjbafrm.js` offset 185663971.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-xwgs2xvp.js` · offset 199869625 · sha256 `74660f53…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `claude`.

Undocumented; read at `chunk-xwgs2xvp.js` offset 199869625.

**Undocumented**

### `SELF_HOSTED_RUNNER_BASE_DIR`

Source: `chunk-y8am1j53.js` · offset 187437695 · sha256 `b4772425…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187437695.

**Undocumented**

### `SELF_HOSTED_RUNNER_BG_RESULT_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187366104 · sha256 `f7307e4a…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner considers a session busy after a background task finishes while the follow-up turn that reads the result hasn't started.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_CLIENT_LABEL`

Source: `chunk-y8am1j53.js` · offset 187438146 · sha256 `177e08fb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438146.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFIGURE_GIT`

Source: `chunk-y8am1j53.js` · offset 187438328 · sha256 `452ab2bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187438328.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFINE_REPO_SETTINGS`

Source: `chunk-y8am1j53.js` · offset 187438703 · sha256 `77b9796c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438703.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_DIR`

Source: `chunk-9myq0fvp.js` · offset 187570442 · sha256 `b1e11b3a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-9myq0fvp.js` offset 187570442.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_TOKEN_DIR`

Source: `chunk-y8am1j53.js` · offset 187438024 · sha256 `15e6ba3b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438024.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-y8am1j53.js` · offset 187472114 · sha256 `9adff507…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187472114.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187392436 · sha256 `48d3be82…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187392436.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-y8am1j53.js` · offset 187435790 · sha256 `4808daa9…` · 2 read sites

Read as: string (raw value; further parsing not traced). Default (from code): `unset`.

Undocumented; read at `chunk-y8am1j53.js` offset 187435790.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_BG_TASKS_MS`

Source: `chunk-y8am1j53.js` · offset 187435527 · sha256 `0bb1d5d6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187435527.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-y8am1j53.js` · offset 187435417 · sha256 `9a8c3728…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187435417.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-9myq0fvp.js` · offset 187595371 · sha256 `13476adc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-9myq0fvp.js` offset 187595371.

**Undocumented**

### `SELF_HOSTED_RUNNER_EXEC_PATH`

Source: `chunk-y8am1j53.js` · offset 187437836 · sha256 `c75ae78f…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187437836.

**Undocumented**

### `SELF_HOSTED_RUNNER_HEALTH_PORT`

Source: `chunk-9myq0fvp.js` · offset 187570283 · sha256 `114335bb…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-9myq0fvp.js` offset 187570283.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-9myq0fvp.js` · offset 187570176 · sha256 `b0459dbf…` · 7 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-9myq0fvp.js` offset 187570176.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-y8am1j53.js` · offset 187253817 · sha256 `6bdd2e04…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_HOST_CONFIG_SNAPSHOT`

Source: `chunk-y8am1j53.js` · offset 187438779 · sha256 `41e1b2bc…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438779.

**Undocumented**

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-y8am1j53.js` · offset 187474155 · sha256 `9caf7671…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187474155.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOCK_TO_ACCOUNT`

Source: `chunk-y8am1j53.js` · offset 187438087 · sha256 `f387d2ff…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438087.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOG_FILE`

Source: `chunk-y8am1j53.js` · offset 187437901 · sha256 `bed345b6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187437901.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187365272 · sha256 `f1254b90…`

Read as: number (parsed as a number). Default (from code): `900000`.

From docs: How long the runner waits after a session reaches its `--kill-session-after-min` limit, for a running turn to finish or the release to complete, before it terminates the session

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-y8am1j53.js` · offset 187365212 · sha256 `dde68c73…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187365212.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-9myq0fvp.js` · offset 187595448 · sha256 `fc39e472…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-9myq0fvp.js` offset 187595448.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-y8am1j53.js` · offset 187471510 · sha256 `13ec255c…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `60000`.

Undocumented; read at `chunk-y8am1j53.js` offset 187471510.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_TURN_SETTLE_MS`

Source: `chunk-y8am1j53.js` · offset 187366155 · sha256 `23d86492…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `7000`.

From docs: Cap on how long the runner counts a session as busy for the `--drain-wait-sec` drain after a turn finishes, while the session's process reports the turn's end to Anthropic.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_PUSH_OUTCOME_ON_RELEASE`

Source: `chunk-y8am1j53.js` · offset 187438398 · sha256 `ab9e00d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187438398.

**Undocumented**

### `SELF_HOSTED_RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-y8am1j53.js` · offset 187471046 · sha256 `854a99a1…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187471046.

**Undocumented**

### `SELF_HOSTED_RUNNER_REMOVE_SESSION_STATE`

Source: `chunk-y8am1j53.js` · offset 187438624 · sha256 `804b6083…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438624.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-y8am1j53.js` · offset 187435595 · sha256 `b92e6ac9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187435595.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MIN`

Source: `chunk-y8am1j53.js` · offset 187471092 · sha256 `d0b6f6af…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187471092.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-y8am1j53.js` · offset 187472163 · sha256 `eb4b87c2…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187472163.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_SEC`

Source: `chunk-y8am1j53.js` · offset 187471130 · sha256 `d5c3bc87…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187471130.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187365495 · sha256 `f92f6ca5…` · 3 read sites

Read as: number (parsed as a number). Default (from code): `5000`.

Undocumented; read at `chunk-y8am1j53.js` offset 187365495.

**Undocumented**

### `SELF_HOSTED_RUNNER_SIGKILL_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187365356 · sha256 `19a86fd5…`

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner waits for the OS to deliver `SIGKILL` to a child stuck in uninterruptible I/O before exiting itself.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_SIGKILL_TIMEOUT_MS`

Source: `chunk-y8am1j53.js` · offset 187470645 · sha256 `79e46d6b…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187470645.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-y8am1j53.js` · offset 187373000 · sha256 `8252795b…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187373000.

**Undocumented**

### `SELF_HOSTED_RUNNER_TRUST_WORKSPACE`

Source: `chunk-y8am1j53.js` · offset 187438509 · sha256 `6405b7e1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-y8am1j53.js` offset 187438509.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-jrare64x.js` · offset 177788239 · sha256 `37709674…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-jrare64x.js` offset 177788239.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-wyjbafrm.js` · offset 184335800 · sha256 `d34c78d3…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Documented: https://code.claude.com/docs/en/env-vars

### `SRT_DEBUG`

Source: `chunk-zt6t8196.js` · offset 179779783 · sha256 `a3a90306…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-zt6t8196.js` offset 179779783.

**Undocumented**

### `SWE_BENCH_INSTANCE_ID`

Source: `chunk-1vt3h958.js` · offset 178522873 · sha256 `92750357…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1vt3h958.js` offset 178522873.

**Undocumented**

### `SWE_BENCH_RUN_ID`

Source: `chunk-1vt3h958.js` · offset 178522821 · sha256 `b371b98c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1vt3h958.js` offset 178522821.

**Undocumented**

### `SWE_BENCH_TASK_ID`

Source: `chunk-1vt3h958.js` · offset 178522926 · sha256 `1acfb392…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1vt3h958.js` offset 178522926.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-wyjbafrm.js` · offset 182948668 · sha256 `0fd4c0b3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 182948668.

**Undocumented**

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-wyjbafrm.js` · offset 186828146 · sha256 `80869434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 186828146.

**Undocumented**

### `USE_API_CONTEXT_MANAGEMENT`

Source: `chunk-1vt3h958.js` · offset 178437633 · sha256 `1cdd37f8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178437633.

**Undocumented**

### `USE_BUILTIN_RIPGREP`

Source: `chunk-9yjanq6m.js` · offset 180609377 · sha256 `b64426c9…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code

Documented: https://code.claude.com/docs/en/env-vars

### `USE_LOCAL_OAUTH`

Source: `chunk-geg6jndb.js` · offset 193298969 · sha256 `859f5930…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-geg6jndb.js` offset 193298969.

**Undocumented**

### `USE_STAGING_OAUTH`

Source: `chunk-geg6jndb.js` · offset 193299034 · sha256 `474ca94d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-geg6jndb.js` offset 193299034.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-e8phgb2s.js` · offset 187225072 · sha256 `173e4cd4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e8phgb2s.js` offset 187225072.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-nkm61j3j.js` · offset 208216356 · sha256 `20d7f7cb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nkm61j3j.js` offset 208216356.

**Undocumented**

## Providers: Amazon Bedrock and AWS

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-hzevqd7x.js` · offset 181691356 · sha256 `e97fa437…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_BASE_URL`

Source: `chunk-hzevqd7x.js` · offset 181695850 · sha256 `0a7a75f0…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Claude Platform on AWS endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_WORKSPACE_ID`

Source: `chunk-awvb9gqk.js` · offset 200548902 · sha256 `6cf298c7…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Required for Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_BASE_URL`

Source: `chunk-hzevqd7x.js` · offset 181695622 · sha256 `befad766…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Amazon Bedrock endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`

Source: `chunk-hzevqd7x.js` · offset 181695733 · sha256 `bfdce098…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the Amazon Bedrock Mantle endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_REGION_PREFIX`

Source: `chunk-1vt3h958.js` · offset 178118916 · sha256 `6e9f466d…`

Read as: enum (compared against fixed values). Values: `us`, `eu`, `apac`, `jp`, `au`, `global`.

From docs: Cross-region inference profile prefix (`us`, `eu`, `apac`, `jp`, `au`, or `global`) Claude Code tries first instead of the one derived from the AWS region.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_SERVICE_TIER`

Source: `chunk-hzevqd7x.js` · offset 181689364 · sha256 `b387382a…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock service tier (`default`, `flex`, or `priority`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`

Source: `chunk-hzevqd7x.js` · offset 181696267 · sha256 `5c5cdacf…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override AWS region for the Haiku-class model when using Amazon Bedrock or Amazon Bedrock Mantle.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_ACCESS_KEY_ID`

Source: `chunk-qtteq8j0.js` · offset 194067131 · sha256 `9a1ce563…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067131.

**Undocumented**

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-hzevqd7x.js` · offset 181689487 · sha256 `4790d6c3…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_CONFIG_FILE`

Source: `chunk-vd8c0jpy.js` · offset 193653614 · sha256 `1d954014…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-vd8c0jpy.js` offset 193653614.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_FULL_URI`

Source: `chunk-79k89st6.js` · offset 208279390 · sha256 `56d7cc2f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-79k89st6.js` offset 208279390.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`

Source: `chunk-79k89st6.js` · offset 208279332 · sha256 `757201c8…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-79k89st6.js` offset 208279332.

**Undocumented**

### `AWS_DEFAULT_REGION`

Source: `chunk-5qj86qz3.js` · offset 193827074 · sha256 `879963f4…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5qj86qz3.js` offset 193827074.

**Undocumented**

### `AWS_ENDPOINT_URL`

Source: `chunk-zgqyfwz9.js` · offset 177221705 · sha256 `1a0caa05…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zgqyfwz9.js` offset 177221705.

**Undocumented**

### `AWS_ENDPOINT_URL_STS`

Source: `chunk-zgqyfwz9.js` · offset 177221681 · sha256 `31d2a84c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zgqyfwz9.js` offset 177221681.

**Undocumented**

### `AWS_EXECUTION_ENV`

Source: `chunk-5qj86qz3.js` · offset 193827039 · sha256 `1d96876d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `AWS_ECS_FARGATE`, `AWS_ECS_EC2`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5qj86qz3.js` offset 193827039.

**Undocumented**

### `AWS_LAMBDA_FUNCTION_NAME`

Source: `chunk-5qj86qz3.js` · offset 193692535 · sha256 `6ca7392d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5qj86qz3.js` offset 193692535.

**Undocumented**

### `AWS_PROFILE`

Source: `chunk-3cpbqds9.js` · offset 194119815 · sha256 `7afed77f…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-3cpbqds9.js` offset 194119815.

**Undocumented**

### `AWS_REGION`

Source: `chunk-5qj86qz3.js` · offset 193827057 · sha256 `c366599d…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `us-east-1`.

Undocumented; read at `chunk-5qj86qz3.js` offset 193827057.

**Undocumented**

### `AWS_ROLE_ARN`

Source: `chunk-mhyvshyz.js` · offset 208289339 · sha256 `91a608bc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mhyvshyz.js` offset 208289339.

**Undocumented**

### `AWS_SECRET_ACCESS_KEY`

Source: `chunk-qtteq8j0.js` · offset 194067150 · sha256 `2e905f6b…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067150.

**Undocumented**

### `AWS_SESSION_TOKEN`

Source: `chunk-qtteq8j0.js` · offset 194067169 · sha256 `077b91d9…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067169.

**Undocumented**

### `AWS_SHARED_CREDENTIALS_FILE`

Source: `chunk-vd8c0jpy.js` · offset 193653710 · sha256 `aab2cfbd…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-vd8c0jpy.js` offset 193653710.

**Undocumented**

### `AWS_USE_FIPS_ENDPOINT`

Source: `chunk-tce7203z.js` · offset 201816663 · sha256 `76b4ea55…`

Read as: string (trimmed; empty is treated as unset). Values: `true`.

Undocumented; read at `chunk-tce7203z.js` offset 201816663.

**Undocumented**

### `AWS_WEB_IDENTITY_TOKEN_FILE`

Source: `chunk-mhyvshyz.js` · offset 208289310 · sha256 `651dbdfb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-mhyvshyz.js` offset 208289310.

**Undocumented**

### `CLAUDE_CODE_AWS_CHAIN_RESOLVE_TIMEOUT_MS`

Source: `chunk-1vt3h958.js` · offset 178672229 · sha256 `17165e62…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647. Default (from code): `60000`.

From docs: Time in milliseconds Claude Code waits for the AWS default credential provider chain to produce credentials before the request fails with `AWS default-chain credential resolve timed out` (default: `60000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_DEFAULT`

Source: `chunk-hzevqd7x.js` · offset 181704215 · sha256 `d0d6c187…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from treating an Amazon Bedrock streaming response with a missing or empty `Content-Type` header as Amazon Bedrock's binary event stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_GUARD`

Source: `chunk-hzevqd7x.js` · offset 181704459 · sha256 `21e859a3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the check that an Amazon Bedrock streaming response carries the `application/vnd.amazon.eventstream` content-type.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`

Source: `chunk-awvb9gqk.js` · offset 200549019 · sha256 `9bdd4f8f…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip client-side authentication for Claude Platform on AWS, for gateways that sign requests themselves

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_AWS_CRED_CACHE`

Source: `chunk-1vt3h958.js` · offset 178116350 · sha256 `bb5f5050…` · 12 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off the in-process cache of credentials resolved from the AWS default credential provider chain, so Claude Code resolves the chain on every API request.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_BEDROCK_AUTH`

Source: `chunk-1vt3h958.js` · offset 178115666 · sha256 `92a4d50a…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MANTLE_AUTH`

Source: `chunk-awvb9gqk.js` · offset 200550009 · sha256 `f79d4f5c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock Mantle (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_AWS`

Source: `chunk-j6zsezqx.js` · offset 175678056 · sha256 `c6be261e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Claude Platform on AWS

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_BEDROCK`

Source: `chunk-j6zsezqx.js` · offset 175677934 · sha256 `fd5e84a3…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Amazon Bedrock

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_MANTLE`

Source: `chunk-j6zsezqx.js` · offset 175678159 · sha256 `7718029e…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use the Amazon Bedrock Mantle endpoint

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`

Source: `chunk-hzevqd7x.js` · offset 181702606 · sha256 `679d9258…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable the byte-level streaming idle watchdog on Amazon Bedrock `vnd.amazon.eventstream` responses, which also enables the first-byte deadline on Bedrock streaming requests.

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Google Vertex AI and Google Cloud

### `ANTHROPIC_GOOGLE_CLOUD_BASE_URL`

Source: `chunk-awvb9gqk.js` · offset 200549153 · sha256 `99675c8d…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `https://claude.googleapis.com`.

Undocumented; read at `chunk-awvb9gqk.js` offset 200549153.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_LOCATION`

Source: `chunk-awvb9gqk.js` · offset 200549494 · sha256 `50d42c5b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `global`.

Undocumented; read at `chunk-awvb9gqk.js` offset 200549494.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_PROJECT`

Source: `chunk-1vt3h958.js` · offset 178674274 · sha256 `b0231252…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178674274.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID`

Source: `chunk-awvb9gqk.js` · offset 200549268 · sha256 `719be76f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-awvb9gqk.js` offset 200549268.

**Undocumented**

### `ANTHROPIC_VERTEX_BASE_URL`

Source: `chunk-hzevqd7x.js` · offset 181696057 · sha256 `b34e6459…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override Google Cloud's Agent Platform endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_VERTEX_PROJECT_ID`

Source: `chunk-1vt3h958.js` · offset 178674101 · sha256 `7d0f0ea1…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: GCP project ID that Google Cloud's Agent Platform requests are addressed to.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_GOOGLE_CLOUD_AUTH`

Source: `chunk-awvb9gqk.js` · offset 200549540 · sha256 `9beecc05…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-awvb9gqk.js` offset 200549540.

**Undocumented**

### `CLAUDE_CODE_SKIP_VERTEX_AUTH`

Source: `chunk-34007zg2.js` · offset 207499875 · sha256 `3897a5fc…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Google authentication for Google Cloud's Agent Platform (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`

Source: `chunk-j6zsezqx.js` · offset 175678103 · sha256 `95ef3a64…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-j6zsezqx.js` offset 175678103.

**Undocumented**

### `CLAUDE_CODE_USE_VERTEX`

Source: `chunk-j6zsezqx.js` · offset 175677975 · sha256 `9d4aaeb0…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `CLOUD_ML_REGION`

Source: `chunk-2tefsj0f.js` · offset 175591692 · sha256 `d14e27f0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2tefsj0f.js` offset 175591692.

**Undocumented**

### `CLOUDSDK_CONFIG`

Source: `chunk-sajhfs1y.js` · offset 193947577 · sha256 `a53236c8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 193947577.

**Undocumented**

### `gcloud_project`

Source: `chunk-sajhfs1y.js` · offset 194033400 · sha256 `232389f7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194033400.

**Undocumented**

### `GCLOUD_PROJECT`

Source: `chunk-sajhfs1y.js` · offset 194033338 · sha256 `3d9c3b37…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194033338.

**Undocumented**

### `google_application_credentials`

Source: `chunk-sajhfs1y.js` · offset 194029506 · sha256 `b73615be…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194029506.

**Undocumented**

### `GOOGLE_APPLICATION_CREDENTIALS`

Source: `chunk-sajhfs1y.js` · offset 194029462 · sha256 `c2e78809…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194029462.

**Undocumented**

### `google_cloud_project`

Source: `chunk-sajhfs1y.js` · offset 194033428 · sha256 `b763364f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194033428.

**Undocumented**

### `GOOGLE_CLOUD_PROJECT`

Source: `chunk-sajhfs1y.js` · offset 194033366 · sha256 `17e9b022…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 194033366.

**Undocumented**

### `GOOGLE_CLOUD_WORKSTATIONS`

Source: `chunk-ze990dc9.js` · offset 175760682 · sha256 `05ba04cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760682.

**Undocumented**

### `VERTEX_REGION_CLAUDE_3_5_HAIKU`

Source: `chunk-2tefsj0f.js` · offset 175588977 · sha256 `f4a42187…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Haiku when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_5_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175588754 · sha256 `b0163304…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_7_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175588810 · sha256 `9058fadb…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.7 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589604 · sha256 `1f4dbfd4…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175589450 · sha256 `17ff2060…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_1_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589138 · sha256 `26ffeba1…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.1 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589190 · sha256 `ba882f91…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175588866 · sha256 `7fe0e77c…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589242 · sha256 `73a23bda…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175588922 · sha256 `120c2066…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_7_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589294 · sha256 `364310a0…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.7 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_8_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589346 · sha256 `3b69250d…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.8 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589398 · sha256 `58a45cb7…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5.5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_OPUS`

Source: `chunk-2tefsj0f.js` · offset 175589654 · sha256 `8e8c2421…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_SONNET`

Source: `chunk-2tefsj0f.js` · offset 175589504 · sha256 `1a6f9b02…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5`

Source: `chunk-2tefsj0f.js` · offset 175589555 · sha256 `ef732c7f…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5_1`

Source: `chunk-2tefsj0f.js` · offset 175589031 · sha256 `0e9c5375…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5.1 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_HAIKU_4_5`

Source: `chunk-2tefsj0f.js` · offset 175589085 · sha256 `bdaa3937…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Haiku 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Microsoft Foundry and Azure

### `ANTHROPIC_FOUNDRY_API_KEY`

Source: `chunk-hzevqd7x.js` · offset 181690293 · sha256 `6edea27f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key for Microsoft Foundry authentication (see Microsoft Foundry)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_AUTH_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181690206 · sha256 `072afdc4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Bearer token for Microsoft Foundry authentication, such as a Microsoft Entra access token.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_BASE_URL`

Source: `chunk-awvb9gqk.js` · offset 200548504 · sha256 `42cda74f…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Full base URL for the Microsoft Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_RESOURCE`

Source: `chunk-awvb9gqk.js` · offset 200548600 · sha256 `3630aefc…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Microsoft Foundry resource name (for example, `my-resource`).

Documented: https://code.claude.com/docs/en/env-vars

### `AZURE_CLIENT_ID`

Source: `chunk-cm8fpatp.js` · offset 197776474 · sha256 `be8e8739…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `AZURE_FUNCTIONS_ENVIRONMENT`

Source: `chunk-ze990dc9.js` · offset 175761783 · sha256 `0fa1ac42…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761783.

**Undocumented**

### `AZURE_TENANT_ID`

Source: `chunk-cm8fpatp.js` · offset 197776432 · sha256 `b705b6d3…` · 6 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`

Source: `chunk-awvb9gqk.js` · offset 200548690 · sha256 `42d8ec8b…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Azure authentication for Microsoft Foundry, for a proxy or gateway that injects its own `Authorization` header.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_FOUNDRY`

Source: `chunk-j6zsezqx.js` · offset 175678015 · sha256 `d289ae80…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Microsoft Foundry

Documented: https://code.claude.com/docs/en/env-vars

## Providers: gateways

### `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`

Source: `chunk-1vt3h958.js` · offset 178358030 · sha256 `e51b98ea…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to populate the `/model` picker from your gateway's `/v1/models` endpoint when `ANTHROPIC_BASE_URL` points at an Anthropic-compatible gateway such as LiteLLM, Kong, or an internal proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_HINT_HEADERS`

Source: `chunk-hzevqd7x.js` · offset 181685135 · sha256 `e72abd56…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to send the gateway hint headers, such as `x-claude-code-request-class` and `x-claude-code-compaction`, on a custom proxy or a third-party provider such as Amazon Bedrock or Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_MODEL_DISCOVERY_TIMEOUT_MS`

Source: `chunk-1vt3h958.js` · offset 178359779 · sha256 `07d66406…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true. Default (from code): `3000`.

From docs: Timeout in milliseconds for the gateway model discovery request that `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` turns on (default: `3000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-2crv8d5h.js` · offset 192067984 · sha256 `c4cff902…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2crv8d5h.js` offset 192067984.

**Undocumented**

### `CLAUDE_CODE_HOST_GATEWAY_LINEAGE`

Source: `chunk-94ks0f2h.js` · offset 175817224 · sha256 `8d70ffb2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-94ks0f2h.js` offset 175817224.

**Undocumented**

### `CLAUDE_CODE_USE_GATEWAY`

Source: `chunk-1vt3h958.js` · offset 178642671 · sha256 `3c6159ee…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178642671.

**Undocumented**

### `CLAUDE_GATEWAY_ALLOW_LOOPBACK`

Source: `chunk-tce7203z.js` · offset 201794803 · sha256 `e63dfe37…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-tce7203z.js` offset 201794803.

**Undocumented**

### `CLAUDE_GATEWAY_DRAIN_TIMEOUT_MS`

Source: `chunk-cqqke06s.js` · offset 201992773 · sha256 `4cc46a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147000000, digitsOnly true. Default (from code): `25000`.

Undocumented; read at `chunk-cqqke06s.js` offset 201992773.

**Undocumented**

### `CLAUDE_GATEWAY_LOG_LEVEL`

Source: `chunk-qna2s9fg.js` · offset 200811262 · sha256 `de2a0fcd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qna2s9fg.js` offset 200811262.

**Undocumented**

### `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY`

Source: `chunk-tce7203z.js` · offset 201794494 · sha256 `8ab0e5da…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-tce7203z.js` offset 201794494.

**Undocumented**

## Telemetry and observability

### `BETA_TRACING_ENDPOINT`

Source: `chunk-gyn9g1gd.js` · offset 180800067 · sha256 `0b8e0086…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OTLP endpoint for detailed beta tracing: with `ENABLE_BETA_TRACING_DETAILED=1`, logs and traces go there instead of to the configured exporters.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BYOC_ENABLE_DATADOG`

Source: `chunk-y8am1j53.js` · offset 187361481 · sha256 `9657eb08…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187361481.

**Undocumented**

### `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS`

Source: `chunk-4zdsz5nn.js` · offset 182187553 · sha256 `f59cfbdd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `15000`.

Undocumented; read at `chunk-4zdsz5nn.js` offset 182187553.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`

Source: `chunk-sjm7s9p5.js` · offset 178089111 · sha256 `12bbf696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to route the "How is Claude doing?" session quality survey to your own OpenTelemetry collector when Anthropic-bound nonessential traffic is blocked.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TELEMETRY`

Source: `chunk-2crv8d5h.js` · offset 192085152 · sha256 `3b331164…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable OpenTelemetry data collection for metrics and logging.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-gyn9g1gd.js` · offset 180806493 · sha256 `76f8b26a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Enable span tracing (required).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF`

Source: `chunk-1vt3h958.js` · offset 178548347 · sha256 `a3ff8f93…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1vt3h958.js` offset 178548347.

**Undocumented**

### `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`

Source: `chunk-gyn9g1gd.js` · offset 180799262 · sha256 `58cae1fa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `61440`.

From docs: Maximum length of content-bearing OpenTelemetry attributes (model responses, tool content, system prompts, raw API bodies), truncation marker included, in UTF-16 code units (default: 61440, i.e. 60 KB).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_DIAG_STDERR`

Source: `chunk-4cvafbve.js` · offset 187233473 · sha256 `bc37fcc6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to write OpenTelemetry exporter diagnostic errors to stderr.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`

Source: `chunk-hyw5ktfw.js` · offset 199525253 · sha256 `5a408a7f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Timeout in milliseconds for flushing pending OpenTelemetry spans (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`

Source: `chunk-1vt3h958.js` · offset 178706040 · sha256 `240e3e9d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`

Source: `chunk-hyw5ktfw.js` · offset 199505214 · sha256 `c8cd5ac8…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `2000`.

From docs: Timeout in milliseconds for the OpenTelemetry exporter to finish on shutdown (default: 2000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PERFETTO_TRACE`

Source: `chunk-gyn9g1gd.js` · offset 180805246 · sha256 `17ecb006…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gyn9g1gd.js` offset 180805246.

**Undocumented**

### `DISABLE_TELEMETRY`

Source: `chunk-j6zsezqx.js` · offset 175676103 · sha256 `33ea0227…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of telemetry. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn telemetry back on.

Documented: https://code.claude.com/docs/en/env-vars

### `DO_NOT_TRACK`

Source: `chunk-j6zsezqx.js` · offset 175676160 · sha256 `91dfe981…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to opt out of telemetry, with the same effect as `DISABLE_TELEMETRY`, including making Remote Control and the other features that need feature-flag fetching unavailable.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_BETA_TRACING_DETAILED`

Source: `chunk-gyn9g1gd.js` · offset 180800027 · sha256 `f081d785…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1`, together with `BETA_TRACING_ENDPOINT`, to turn on detailed beta tracing, which adds content-bearing span attributes and the `claude_code.hook` span.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-gyn9g1gd.js` · offset 180806542 · sha256 `7a82f69c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gyn9g1gd.js` offset 180806542.

**Undocumented**

### `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-gyn9g1gd.js` · offset 180799304 · sha256 `d5f795ab…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Standard OpenTelemetry SDK limit on attribute value length.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_EXPORTER_OTLP_*_ENDPOINT`

Source: `chunk-as377hwh.js` · offset 211586023 · sha256 `a26b6f13…` · 4 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_HEADERS`

Source: `chunk-as377hwh.js` · offset 211585606 · sha256 `9d834cf7…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, `OTEL_EXPORTER_OTLP_METRICS_HEADERS`, `OTEL_EXPORTER_OTLP_TRACES_HEADERS`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_INSECURE`

Source: `chunk-as377hwh.js` · offset 211586165 · sha256 `9c1196e8…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_ENDPOINT`

Source: `chunk-as377hwh.js` · offset 211586081 · sha256 `807d3ae4…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP collector endpoint for all signals

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_HEADERS`

Source: `chunk-as377hwh.js` · offset 211585663 · sha256 `bba3c17d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Authentication headers for OTLP

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`

Source: `chunk-hyw5ktfw.js` · offset 199518787 · sha256 `a97eb978…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for logs, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`

Source: `chunk-hyw5ktfw.js` · offset 199517733 · sha256 `87f5ee3b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for metrics, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-hyw5ktfw.js` · offset 199513924 · sha256 `d703ee47…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Metrics temporality preference (default: `delta`).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_PROTOCOL`

Source: `chunk-hyw5ktfw.js` · offset 199517359 · sha256 `c0b54b69…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for OTLP exporter, applies to all signals.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Source: `chunk-gyn9g1gd.js` · offset 180804418 · sha256 `e359194f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP traces endpoint, overrides `OTEL_EXPORTER_OTLP_ENDPOINT`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`

Source: `chunk-hyw5ktfw.js` · offset 199519837 · sha256 `2ec5a16b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for traces, overrides `OTEL_EXPORTER_OTLP_PROTOCOL`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOG_ASSISTANT_RESPONSES`

Source: `chunk-s92h89q7.js` · offset 180790908 · sha256 `0c8aef2c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to include the model's response text on `assistant_response` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_MANAGED_SETTINGS`

Source: `chunk-cpf7rt77.js` · offset 191818465 · sha256 `05fbc9d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to add the redacted managed settings, and a SHA-256 digest of the settings before redaction, to `managed_settings_resolved` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_RAW_API_BODIES`

Source: `chunk-wyjbafrm.js` · offset 184826309 · sha256 `c83da780…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Emit Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_CONTENT`

Source: `chunk-1vt3h958.js` · offset 178510873 · sha256 `0697bef6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool content in the `tool.output` OpenTelemetry span event.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_DETAILS`

Source: `chunk-1vt3h958.js` · offset 178509721 · sha256 `499d0933…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool input arguments, MCP server names, user-authored workflow names, raw error strings on tool failures, the refusal `category` on `api_refusal` events, and other tool details in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_USER_PROMPTS`

Source: `chunk-gyn9g1gd.js` · offset 180799782 · sha256 `55cbaa16…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include user prompt text in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-gyn9g1gd.js` · offset 180799345 · sha256 `ead31d61…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGS_EXPORT_INTERVAL`

Source: `chunk-1vt3h958.js` · offset 178544358 · sha256 `cc3fa137…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Logs export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOGS_EXPORTER`

Source: `chunk-a34kxzvh.js` · offset 191101231 · sha256 `0ab3e676…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Logs/events exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRIC_EXPORT_INTERVAL`

Source: `chunk-hyw5ktfw.js` · offset 199517250 · sha256 `3b7d7cea…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `60000`.

From docs: Export interval in milliseconds (default: 60000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_EXPORTER`

Source: `chunk-hyw5ktfw.js` · offset 199521373 · sha256 `55fadc06…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `prometheus`.

From docs: Metrics exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`

Source: `chunk-s92h89q7.js` · offset 180788815 · sha256 `a52e5dfb…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude account UUID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_ENTRYPOINT`

Source: `chunk-s92h89q7.js` · offset 180788467 · sha256 `24f0b0ca…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include the session entrypoint in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_REPOSITORY`

Source: `chunk-s92h89q7.js` · offset 180788546 · sha256 `d3ae3777…` · 2 read sites

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to tag OpenTelemetry metrics and events with `vcs.*` attributes identifying the session's repository (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES`

Source: `chunk-s92h89q7.js` · offset 180787618 · sha256 `64147388…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: As of v2.1.161, Claude Code attaches `OTEL_RESOURCE_ATTRIBUTES` keys to metric datapoint labels.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_SESSION_ID`

Source: `chunk-s92h89q7.js` · offset 180787789 · sha256 `c8eb859c…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude session ID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_VERSION`

Source: `chunk-s92h89q7.js` · offset 180787935 · sha256 `5375ab0f…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include Claude Code version in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_RESOURCE_ATTRIBUTES`

Source: `chunk-s92h89q7.js` · offset 180787587 · sha256 `3949d66e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-gyn9g1gd.js` · offset 180799396 · sha256 `b73a7c57…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_TRACES_EXPORT_INTERVAL`

Source: `chunk-hyw5ktfw.js` · offset 199523726 · sha256 `3104fb4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Span batch export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_TRACES_EXPORTER`

Source: `chunk-hyw5ktfw.js` · offset 199519704 · sha256 `947cd0a5…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Traces exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `TRACEPARENT`

Source: `chunk-gyn9g1gd.js` · offset 180809765 · sha256 `13183cc6…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TRACESTATE`

Source: `chunk-gyn9g1gd.js` · offset 180809841 · sha256 `d8947714…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gyn9g1gd.js` offset 180809841.

**Undocumented**

## Network, proxy and TLS

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-kdrnbgc9.js` · offset 199314816 · sha256 `df0eedcf…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199314816.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-kdrnbgc9.js` · offset 199314786 · sha256 `798ebf6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199314786.

**Undocumented**

### `all_proxy`

Source: `chunk-7k6n1zya.js` · offset 187213190 · sha256 `9fcdc466…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7k6n1zya.js` offset 187213190.

**Undocumented**

### `ALL_PROXY`

Source: `chunk-7k6n1zya.js` · offset 187213167 · sha256 `728ff8d8…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7k6n1zya.js` offset 187213167.

**Undocumented**

### `CCR_AGENT_PROXY_ENABLED`

Source: `chunk-kdrnbgc9.js` · offset 199315338 · sha256 `04bb26ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199315338.

**Undocumented**

### `CCR_AGENT_PROXY_FRAME_HOSTS`

Source: `chunk-ks8awkpq.js` · offset 182309420 · sha256 `6f52e4fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ks8awkpq.js` offset 182309420.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-kdrnbgc9.js` · offset 199314949 · sha256 `80a96f80…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199314949.

**Undocumented**

### `CCR_AGENT_PROXY_NO_PROXY_LOCAL_ONLY`

Source: `chunk-kdrnbgc9.js` · offset 199315066 · sha256 `ff80511a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199315066.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-kdrnbgc9.js` · offset 199314983 · sha256 `8d75b539…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199314983.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-kdrnbgc9.js` · offset 199314918 · sha256 `f05f27c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199314918.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-kdrnbgc9.js` · offset 199315025 · sha256 `32e23461…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199315025.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`

Source: `chunk-kdrnbgc9.js` · offset 199319829 · sha256 `6ddbb857…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199319829.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`

Source: `chunk-kdrnbgc9.js` · offset 199319619 · sha256 `15597b8e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199319619.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_HOSTS`

Source: `chunk-kdrnbgc9.js` · offset 199323916 · sha256 `86f791d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199323916.

**Undocumented**

### `CLAUDE_CODE_CERT_STORE`

Source: `chunk-2crv8d5h.js` · offset 192123903 · sha256 `5cf53913…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Comma-separated list of CA certificate sources for TLS connections.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_CERT`

Source: `chunk-2crv8d5h.js` · offset 192123753 · sha256 `cc37bcd5…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Path to client certificate file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY`

Source: `chunk-a34kxzvh.js` · offset 191094902 · sha256 `d552242d…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Path to client private key file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`

Source: `chunk-zgqyfwz9.js` · offset 177208390 · sha256 `0357f9e0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MTLS_RELOAD_ON_STALE_CONNECTION`

Source: `chunk-wyjbafrm.js` · offset 184895410 · sha256 `3a589ab6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from re-reading the mTLS client certificate and key when an API request fails with a connection-level error, such as a connection reset or a TLS handshake error.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`

Source: `chunk-tm5nr0r0.js` · offset 187185135 · sha256 `bba7fbe6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-tm5nr0r0.js` offset 187185135.

**Undocumented**

### `CLAUDE_CODE_HTTP_PROXY`

Source: `chunk-hkrvpm2b.js` · offset 177806319 · sha256 `5dbec935…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177806319.

**Undocumented**

### `CLAUDE_CODE_HTTPS_PROXY`

Source: `chunk-hkrvpm2b.js` · offset 177806376 · sha256 `48b35a6e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177806376.

**Undocumented**

### `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`

Source: `chunk-zgqyfwz9.js` · offset 177219064 · sha256 `eab3e77a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-zgqyfwz9.js` offset 177219064.

**Undocumented**

### `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`

Source: `chunk-zgqyfwz9.js` · offset 177218249 · sha256 `15350379…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to allow the proxy to perform DNS resolution instead of the caller.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMULATE_PROXY_USAGE`

Source: `chunk-wyjbafrm.js` · offset 184880648 · sha256 `8836efb4…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184880648.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_USE_CCR_PROXY`

Source: `chunk-wyjbafrm.js` · offset 184229880 · sha256 `808a7134…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjbafrm.js` offset 184229880.

**Undocumented**

### `CLAUDE_CODE_WEBSEARCH_USE_CCR_PROXY`

Source: `chunk-t4yyetdp.js` · offset 190360511 · sha256 `9aacb5ad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-t4yyetdp.js` offset 190360511.

**Undocumented**

### `CLAUDE_RUNNER_USE_GIT_PROXY`

Source: `chunk-y8am1j53.js` · offset 187438271 · sha256 `6dfb3f71…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y8am1j53.js` offset 187438271.

**Undocumented**

### `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH`

Source: `chunk-as377hwh.js` · offset 211206890 · sha256 `af68cb3b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-as377hwh.js` offset 211206890.

**Undocumented**

### `HOSTALIASES`

Source: `chunk-wyjbafrm.js` · offset 185061930 · sha256 `ebc96d96…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wyjbafrm.js` offset 185061930.

**Undocumented**

### `http_proxy`

Source: `chunk-as377hwh.js` · offset 211408330 · sha256 `846b41df…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-as377hwh.js` offset 211408330.

**Undocumented**

### `HTTP_PROXY`

Source: `chunk-sajhfs1y.js` · offset 193901340 · sha256 `724f796e…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

From docs: Specify HTTP proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `https_proxy`

Source: `chunk-7k6n1zya.js` · offset 187213142 · sha256 `33d51f7d…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7k6n1zya.js` offset 187213142.

**Undocumented**

### `HTTPS_PROXY`

Source: `chunk-7k6n1zya.js` · offset 187213117 · sha256 `3ac3671f…` · 12 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Specify HTTPS proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `LOCALDOMAIN`

Source: `chunk-wyjbafrm.js` · offset 185061916 · sha256 `4df19f9d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wyjbafrm.js` offset 185061916.

**Undocumented**

### `no_proxy`

Source: `chunk-as377hwh.js` · offset 211409036 · sha256 `da21c898…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`.

Undocumented; read at `chunk-as377hwh.js` offset 211409036.

**Undocumented**

### `NO_PROXY`

Source: `chunk-gzxd8cyw.js` · offset 177137976 · sha256 `516bafd4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`. Default (from code): `not set`.

From docs: List of domains and IPs to which requests will be directly issued, bypassing proxy

Documented: https://code.claude.com/docs/en/env-vars

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-9yjanq6m.js` · offset 180476999 · sha256 `c69b8df7…` · 14 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180476999.

**Undocumented**

### `NODE_TLS_REJECT_UNAUTHORIZED`

Source: `chunk-wyjbafrm.js` · offset 185061885 · sha256 `1ec3d3d6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wyjbafrm.js` offset 185061885.

**Undocumented**

### `RES_OPTIONS`

Source: `chunk-wyjbafrm.js` · offset 185061944 · sha256 `3e93abd5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wyjbafrm.js` offset 185061944.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-tm5nr0r0.js` · offset 187183484 · sha256 `b57226ce…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-tm5nr0r0.js` offset 187183484.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-tm5nr0r0.js` · offset 187183511 · sha256 `f35cff5c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-tm5nr0r0.js` offset 187183511.

**Undocumented**

### `SSL_CERT_FILE`

Source: `chunk-kdrnbgc9.js` · offset 199322444 · sha256 `36128327…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199322444.

**Undocumented**

## Shell, terminal, OS and CI environment

### `__CFBundleIdentifier`

Source: `chunk-2crv8d5h.js` · offset 192125424 · sha256 `a8824fe9…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Values: `com.anthropic.claude-code-url-handler`, `com.googlecode.iterm2`, `com.conductor.app`.

Undocumented; read at `chunk-2crv8d5h.js` offset 192125424.

**Undocumented**

### `ALACRITTY_LOG`

Source: `chunk-ze990dc9.js` · offset 175758202 · sha256 `bfe1befc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758202.

**Undocumented**

### `ALLUSERSPROFILE`

Source: `chunk-hzevqd7x.js` · offset 181373112 · sha256 `b2c39e1d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181373112.

**Undocumented**

### `ANDROID_HOME`

Source: `chunk-e2e80y4s.js` · offset 199623349 · sha256 `309f9171…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2e80y4s.js` offset 199623349.

**Undocumented**

### `ANDROID_SDK_ROOT`

Source: `chunk-e2e80y4s.js` · offset 199623365 · sha256 `58d982c5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e2e80y4s.js` offset 199623365.

**Undocumented**

### `APP_URL`

Source: `chunk-ze990dc9.js` · offset 175761850 · sha256 `883dc61c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761850.

**Undocumented**

### `APPDATA`

Source: `chunk-5b5dkraf.js` · offset 212253227 · sha256 `da8ef702…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212253227.

**Undocumented**

### `BROWSER`

Source: `chunk-5n3hjv8f.js` · offset 189012822 · sha256 `ad8a905e…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `true`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5n3hjv8f.js` offset 189012822.

**Undocumented**

### `BUILDKITE`

Source: `chunk-ze990dc9.js` · offset 175762148 · sha256 `9466bfb7…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762148.

**Undocumented**

### `BUN_CHROME_PATH`

Source: `chunk-pmke923e.js` · offset 191185161 · sha256 `497892ba…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-pmke923e.js` offset 191185161.

**Undocumented**

### `BUN_INSTALL`

Source: `chunk-j0a5v99x.js` · offset 187047078 · sha256 `c3315b28…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j0a5v99x.js` offset 187047078.

**Undocumented**

### `C9_PID`

Source: `chunk-ze990dc9.js` · offset 175760755 · sha256 `e4c27b8d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175760755.

**Undocumented**

### `C9_USER`

Source: `chunk-ze990dc9.js` · offset 175760775 · sha256 `97e055e6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175760775.

**Undocumented**

### `CF_PAGES`

Source: `chunk-ze990dc9.js` · offset 175761247 · sha256 `d2788c90…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761247.

**Undocumented**

### `CI`

Source: `chunk-ff27ds5n.js` · offset 188274200 · sha256 `2883b550…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ff27ds5n.js` offset 188274200.

**Undocumented**

### `CIRCLECI`

Source: `chunk-ze990dc9.js` · offset 175762107 · sha256 `032d464c…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762107.

**Undocumented**

### `CODER`

Source: `chunk-ze990dc9.js` · offset 175760489 · sha256 `dbd0f0f9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760489.

**Undocumented**

### `CODER_WORKSPACE_NAME`

Source: `chunk-ze990dc9.js` · offset 175760509 · sha256 `d922a1cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760509.

**Undocumented**

### `CODESPACES`

Source: `chunk-ze990dc9.js` · offset 175760390 · sha256 `d78687e1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760390.

**Undocumented**

### `COLORFGBG`

Source: `chunk-kb4rbk81.js` · offset 188772211 · sha256 `4bab16fa…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kb4rbk81.js` offset 188772211.

**Undocumented**

### `COLORTERM`

Source: `chunk-4d9jedja.js` · offset 191036490 · sha256 `f280844a…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-4d9jedja.js` offset 191036490.

**Undocumented**

### `ComSpec`

Source: `chunk-qn3q4268.js` · offset 200736887 · sha256 `d367c10d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qn3q4268.js` offset 200736887.

**Undocumented**

### `COMSPEC`

Source: `chunk-ze990dc9.js` · offset 175763450 · sha256 `99cafcff…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `cmd.exe`.

Undocumented; read at `chunk-ze990dc9.js` offset 175763450.

**Undocumented**

### `ConEmuANSI`

Source: `chunk-ze990dc9.js` · offset 175758473 · sha256 `c8777282…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758473.

**Undocumented**

### `ConEmuPID`

Source: `chunk-ze990dc9.js` · offset 175758497 · sha256 `c4505517…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758497.

**Undocumented**

### `ConEmuTask`

Source: `chunk-ze990dc9.js` · offset 175758520 · sha256 `6160aec6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758520.

**Undocumented**

### `CURSOR_TRACE_ID`

Source: `chunk-m24vnr98.js` · offset 213410927 · sha256 `a240f1a4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-m24vnr98.js` offset 213410927.

**Undocumented**

### `DAYTONA_WS_ID`

Source: `chunk-ze990dc9.js` · offset 175760634 · sha256 `d76f1c62…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760634.

**Undocumented**

### `DEBUG`

Source: `chunk-cm8fpatp.js` · offset 197497546 · sha256 `3f2fec78…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Documented: https://code.claude.com/docs/en/env-vars

### `DENO_DEPLOYMENT_ID`

Source: `chunk-ze990dc9.js` · offset 175761297 · sha256 `a0569b4e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761297.

**Undocumented**

### `DEVPOD`

Source: `chunk-ze990dc9.js` · offset 175760562 · sha256 `a0e21599…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ze990dc9.js` offset 175760562.

**Undocumented**

### `DEVPOD_WORKSPACE_UID`

Source: `chunk-ze990dc9.js` · offset 175760583 · sha256 `7941e754…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175760583.

**Undocumented**

### `DISPLAY`

Source: `chunk-ddjnk2nr.js` · offset 182209726 · sha256 `4dcc9e06…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ddjnk2nr.js` offset 182209726.

**Undocumented**

### `DYNO`

Source: `chunk-ze990dc9.js` · offset 175761138 · sha256 `5bfcb51f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761138.

**Undocumented**

### `EDITOR`

Source: `chunk-37wqz87g.js` · offset 192648222 · sha256 `e2aba24c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-37wqz87g.js` offset 192648222.

**Undocumented**

### `FLY_APP_NAME`

Source: `chunk-ze990dc9.js` · offset 175761173 · sha256 `e98aa307…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175761173.

**Undocumented**

### `FLY_MACHINE_ID`

Source: `chunk-ze990dc9.js` · offset 175761199 · sha256 `eb90c0ce…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175761199.

**Undocumented**

### `FORCE_CODE_TERMINAL`

Source: `chunk-wyjbafrm.js` · offset 186023089 · sha256 `6d127f08…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-wyjbafrm.js` offset 186023089.

**Undocumented**

### `FORCE_COLOR`

Source: `chunk-wyjbafrm.js` · offset 183454617 · sha256 `15ab5bb8…` · 3 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-wyjbafrm.js` offset 183454617.

**Undocumented**

### `FORCE_HYPERLINK`

Source: `chunk-ff27ds5n.js` · offset 188274205 · sha256 `dbf93b31…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `1` to enable clickable OSC 8 hyperlinks when your terminal supports them but isn't auto-detected, or `0` to disable them.

Documented: https://code.claude.com/docs/en/env-vars

### `GCM_INTERACTIVE`

Source: `chunk-kdrnbgc9.js` · offset 199323286 · sha256 `6bbeb3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199323286.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181848948 · sha256 `9c5226ea…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181848948.

**Undocumented**

### `GH_HOST`

Source: `chunk-hzevqd7x.js` · offset 181848925 · sha256 `95d3efd7…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181848925.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181848875 · sha256 `4d29d2e5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181848875.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-kdrnbgc9.js` · offset 199323231 · sha256 `77c0011a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199323231.

**Undocumented**

### `GIT_CONFIG_COUNT`

Source: `chunk-9yjanq6m.js` · offset 180473972 · sha256 `ada3e46b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `0`.

Undocumented; read at `chunk-9yjanq6m.js` offset 180473972.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-kdrnbgc9.js` · offset 199324357 · sha256 `c6d7625a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199324357.

**Undocumented**

### `GIT_CONFIG_KEY_*`

Source: `chunk-pth895g3.js` · offset 182612511 · sha256 `cfc8a4f2…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-hzevqd7x.js` · offset 181494437 · sha256 `cc3bfe26…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181494437.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-pth895g3.js` · offset 182612621 · sha256 `a7cd89dd…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pth895g3.js` offset 182612621.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-hzevqd7x.js` · offset 181494380 · sha256 `87fa52d1…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-hzevqd7x.js` offset 181494380.

**Undocumented**

### `GIT_CONFIG_VALUE_*`

Source: `chunk-pth895g3.js` · offset 182612538 · sha256 `7bddd27f…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_NO_LAZY_FETCH`

Source: `chunk-93fap8m8.js` · offset 181172561 · sha256 `4cb9bb71…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-93fap8m8.js` offset 181172561.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-7k6n1zya.js` · offset 187214357 · sha256 `58764ff1…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ssh`.

Undocumented; read at `chunk-7k6n1zya.js` offset 187214357.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-kdrnbgc9.js` · offset 199323152 · sha256 `e65f8626…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199323152.

**Undocumented**

### `GITHUB_ACTION_INPUTS`

Source: `chunk-cpf7rt77.js` · offset 191861811 · sha256 `872d29c8…`

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-cpf7rt77.js` offset 191861811.

**Undocumented**

### `GITHUB_ACTION_PATH`

Source: `chunk-1vt3h958.js` · offset 178521009 · sha256 `63872dc2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178521009.

**Undocumented**

### `GITHUB_ACTIONS`

Source: `chunk-1vt3h958.js` · offset 178519674 · sha256 `5cc8b904…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178519674.

**Undocumented**

### `GITHUB_ACTOR`

Source: `chunk-1vt3h958.js` · offset 178211573 · sha256 `bdbdbc09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211573.

**Undocumented**

### `GITHUB_ACTOR_ID`

Source: `chunk-1vt3h958.js` · offset 178211596 · sha256 `efc90f87…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211596.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181848981 · sha256 `80d49428…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181848981.

**Undocumented**

### `GITHUB_ENV`

Source: `chunk-hkrvpm2b.js` · offset 177810560 · sha256 `85a6c474…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177810560.

**Undocumented**

### `GITHUB_EVENT_NAME`

Source: `chunk-1vt3h958.js` · offset 178520857 · sha256 `002d2186…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178520857.

**Undocumented**

### `GITHUB_EVENT_PATH`

Source: `chunk-hkrvpm2b.js` · offset 177811079 · sha256 `4d6b1a09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177811079.

**Undocumented**

### `GITHUB_REPOSITORY`

Source: `chunk-1vt3h958.js` · offset 178211625 · sha256 `98dca9d0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211625.

**Undocumented**

### `GITHUB_REPOSITORY_ID`

Source: `chunk-1vt3h958.js` · offset 178211658 · sha256 `0a9247c9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211658.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER`

Source: `chunk-1vt3h958.js` · offset 178211697 · sha256 `4bf7a1f3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211697.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER_ID`

Source: `chunk-1vt3h958.js` · offset 178211741 · sha256 `11aaad60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178211741.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181848897 · sha256 `d84c66c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181848897.

**Undocumented**

### `GITHUB_WORKSPACE`

Source: `chunk-hkrvpm2b.js` · offset 177810618 · sha256 `c45e337f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177810618.

**Undocumented**

### `GITLAB_CI`

Source: `chunk-ze990dc9.js` · offset 175762063 · sha256 `3ee25c25…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762063.

**Undocumented**

### `GITPOD_WORKSPACE_ID`

Source: `chunk-ze990dc9.js` · offset 175760436 · sha256 `0bd1a41d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760436.

**Undocumented**

### `GNOME_TERMINAL_SERVICE`

Source: `chunk-ze990dc9.js` · offset 175757958 · sha256 `8fcf299d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175757958.

**Undocumented**

### `HISTFILE`

Source: `chunk-6r3vp865.js` · offset 196178018 · sha256 `e5c41ee2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-6r3vp865.js` offset 196178018.

**Undocumented**

### `HOME`

Source: `chunk-hkrvpm2b.js` · offset 177803550 · sha256 `8b7d8232…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hkrvpm2b.js` offset 177803550.

**Undocumented**

### `HOMEDRIVE`

Source: `chunk-hzevqd7x.js` · offset 181380634 · sha256 `9c9274b9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181380634.

**Undocumented**

### `HOMEPATH`

Source: `chunk-hzevqd7x.js` · offset 181380659 · sha256 `7663da38…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181380659.

**Undocumented**

### `HOSTNAME`

Source: `chunk-2mgnea7j.js` · offset 177945418 · sha256 `5c1b2b57…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-2mgnea7j.js` offset 177945418.

**Undocumented**

### `INK_SCREEN_READER`

Source: `chunk-6sap1w9m.js` · offset 188723814 · sha256 `064450f6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6sap1w9m.js` offset 188723814.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS`

Source: `chunk-t2rrzp0p.js` · offset 188378385 · sha256 `1054b8d6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-t2rrzp0p.js` offset 188378385.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS_REWORKED`

Source: `chunk-t2rrzp0p.js` · offset 188378321 · sha256 `d49c5da5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-t2rrzp0p.js` offset 188378321.

**Undocumented**

### `ITERM_SESSION_ID`

Source: `chunk-xr01qpgy.js` · offset 182622390 · sha256 `038ed3ab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xr01qpgy.js` offset 182622390.

**Undocumented**

### `JAVA_HOME`

Source: `chunk-kdrnbgc9.js` · offset 199306170 · sha256 `e32930cc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199306170.

**Undocumented**

### `JAVA_TOOL_OPTIONS`

Source: `chunk-9yjanq6m.js` · offset 180546714 · sha256 `eb2a2297…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180546714.

**Undocumented**

### `K_SERVICE`

Source: `chunk-sajhfs1y.js` · offset 193929642 · sha256 `a48f12e6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-sajhfs1y.js` offset 193929642.

**Undocumented**

### `KITTY_WINDOW_ID`

Source: `chunk-ze990dc9.js` · offset 175758157 · sha256 `19815f12…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758157.

**Undocumented**

### `KONSOLE_VERSION`

Source: `chunk-ze990dc9.js` · offset 175757911 · sha256 `3f5c80d0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175757911.

**Undocumented**

### `KUBERNETES_SERVICE_HOST`

Source: `chunk-ze990dc9.js` · offset 175762212 · sha256 `d81719da…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762212.

**Undocumented**

### `LANG`

Source: `chunk-zdk4evwa.js` · offset 195375574 · sha256 `7a38024b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zdk4evwa.js` offset 195375574.

**Undocumented**

### `LC_ALL`

Source: `chunk-zdk4evwa.js` · offset 195375553 · sha256 `bc2e1a24…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zdk4evwa.js` offset 195375553.

**Undocumented**

### `LC_TERMINAL`

Source: `chunk-ddjnk2nr.js` · offset 182207899 · sha256 `0ed931d5…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `iTerm2`. Default (from code): `unset`.

Undocumented; read at `chunk-ddjnk2nr.js` offset 182207899.

**Undocumented**

### `LC_TIME`

Source: `chunk-zdk4evwa.js` · offset 195375563 · sha256 `65eda90a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zdk4evwa.js` offset 195375563.

**Undocumented**

### `LOCALAPPDATA`

Source: `chunk-7j5dabgj.js` · offset 192624525 · sha256 `b38fddba…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7j5dabgj.js` offset 192624525.

**Undocumented**

### `MSYSTEM`

Source: `chunk-ze990dc9.js` · offset 175758409 · sha256 `11f36523…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758409.

**Undocumented**

### `NETLIFY`

Source: `chunk-ze990dc9.js` · offset 175761098 · sha256 `c4d87109…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761098.

**Undocumented**

### `NO_COLOR`

Source: `chunk-3mdsq6vb.js` · offset 177177507 · sha256 `48ee5637…` · 2 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-3mdsq6vb.js` offset 177177507.

**Undocumented**

### `NODE_DEBUG`

Source: `chunk-9r9kpwh0.js` · offset 177356222 · sha256 `7d3efaa5…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-9r9kpwh0.js` offset 177356222.

**Undocumented**

### `NODE_OPTIONS`

Source: `chunk-2tefsj0f.js` · offset 175590476 · sha256 `914747b7…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2tefsj0f.js` offset 175590476.

**Undocumented**

### `P4PORT`

Source: `chunk-j6zsezqx.js` · offset 175682010 · sha256 `0e8d8e90…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j6zsezqx.js` offset 175682010.

**Undocumented**

### `PATH`

Source: `chunk-9yjanq6m.js` · offset 180580654 · sha256 `69e3a9e0…` · 18 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `/usr/local/bin:/usr/bin:/bin`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `PATHEXT`

Source: `chunk-9yjanq6m.js` · offset 180580679 · sha256 `a603895c…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180580679.

**Undocumented**

### `PREFIX`

Source: `chunk-gtxg4hna.js` · offset 180775634 · sha256 `b830d9ab…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gtxg4hna.js` offset 180775634.

**Undocumented**

### `ProgramData`

Source: `chunk-9yjanq6m.js` · offset 180573775 · sha256 `f0de69b2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180573775.

**Undocumented**

### `PROGRAMDATA`

Source: `chunk-hzevqd7x.js` · offset 181373093 · sha256 `63deee56…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hzevqd7x.js` offset 181373093.

**Undocumented**

### `ProgramFiles`

Source: `chunk-cm8fpatp.js` · offset 197747071 · sha256 `ae3c9ab2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-cm8fpatp.js` offset 197747071.

**Undocumented**

### `PROJECT_DOMAIN`

Source: `chunk-ze990dc9.js` · offset 175760878 · sha256 `87e9f9c2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760878.

**Undocumented**

### `PWD`

Source: `chunk-5mcqa25r.js` · offset 189984818 · sha256 `55d0de17…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5mcqa25r.js` offset 189984818.

**Undocumented**

### `RAILWAY_ENVIRONMENT_NAME`

Source: `chunk-ze990dc9.js` · offset 175760964 · sha256 `46ffdcd9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175760964.

**Undocumented**

### `RAILWAY_SERVICE_NAME`

Source: `chunk-ze990dc9.js` · offset 175761002 · sha256 `ff14b856…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ze990dc9.js` offset 175761002.

**Undocumented**

### `RENDER`

Source: `chunk-ze990dc9.js` · offset 175761057 · sha256 `85af1892…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761057.

**Undocumented**

### `REPL_ID`

Source: `chunk-ze990dc9.js` · offset 175760817 · sha256 `da03a20e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760817.

**Undocumented**

### `REPL_SLUG`

Source: `chunk-ze990dc9.js` · offset 175760838 · sha256 `7ae40c11…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760838.

**Undocumented**

### `SESSIONNAME`

Source: `chunk-ze990dc9.js` · offset 175758338 · sha256 `52edc75e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758338.

**Undocumented**

### `SHELL`

Source: `chunk-ze990dc9.js` · offset 175763431 · sha256 `d9d57ee3…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175763431.

**Undocumented**

### `SPACE_CREATOR_USER_ID`

Source: `chunk-ze990dc9.js` · offset 175761939 · sha256 `57bb1750…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761939.

**Undocumented**

### `SSH_AUTH_SOCK`

Source: `chunk-kdrnbgc9.js` · offset 199327805 · sha256 `45e4e696…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdrnbgc9.js` offset 199327805.

**Undocumented**

### `SSH_CLIENT`

Source: `chunk-ze990dc9.js` · offset 175762514 · sha256 `23b2cf08…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762514.

**Undocumented**

### `SSH_CONNECTION`

Source: `chunk-ze990dc9.js` · offset 175762486 · sha256 `c840a5cf…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762486.

**Undocumented**

### `SSH_TTY`

Source: `chunk-ze990dc9.js` · offset 175762538 · sha256 `2607570d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175762538.

**Undocumented**

### `STY`

Source: `chunk-ze990dc9.js` · offset 175757877 · sha256 `335a859b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175757877.

**Undocumented**

### `SUDO_GID`

Source: `chunk-5b5dkraf.js` · offset 212132153 · sha256 `403e35b1…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-5b5dkraf.js` offset 212132153.

**Undocumented**

### `SUDO_UID`

Source: `chunk-5b5dkraf.js` · offset 212132140 · sha256 `8b3a2dac…` · 5 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-5b5dkraf.js` offset 212132140.

**Undocumented**

### `SUDO_USER`

Source: `chunk-5b5dkraf.js` · offset 212132166 · sha256 `68f43961…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212132166.

**Undocumented**

### `SystemRoot`

Source: `chunk-9yjanq6m.js` · offset 180566949 · sha256 `793aedf5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-9yjanq6m.js` offset 180566949.

**Undocumented**

### `SYSTEMROOT`

Source: `chunk-1vt3h958.js` · offset 178630912 · sha256 `b421cf1e…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-1vt3h958.js` offset 178630912.

**Undocumented**

### `TEAMCITY_VERSION`

Source: `chunk-ff27ds5n.js` · offset 188274233 · sha256 `61989b74…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-ff27ds5n.js` offset 188274233.

**Undocumented**

### `TERM`

Source: `chunk-ze990dc9.js` · offset 175757600 · sha256 `cd581ed8…` · 17 read sites

Read as: string (trimmed; empty is treated as unset). Values: `xterm-ghostty`, `cygwin`. Default (from code): `unset`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM`

Source: `chunk-ze990dc9.js` · offset 175757707 · sha256 `75da1de5…` · 27 read sites

Read as: string (trimmed; empty is treated as unset). Values: `vscode`, `iTerm.app`, `Apple_Terminal`, `ghostty`, `WezTerm`, `tmux`, `mintty`. Default (from code): `unset`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM_VERSION`

Source: `chunk-mzg9kbjz.js` · offset 203837602 · sha256 `0dc37e73…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

Undocumented; read at `chunk-mzg9kbjz.js` offset 203837602.

**Undocumented**

### `TERMINAL`

Source: `chunk-qn3q4268.js` · offset 200736385 · sha256 `541785d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qn3q4268.js` offset 200736385.

**Undocumented**

### `TERMINAL_EMULATOR`

Source: `chunk-ze990dc9.js` · offset 175757528 · sha256 `cf45b3e1…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `JetBrains-JediTerm`.

Undocumented; read at `chunk-ze990dc9.js` offset 175757528.

**Undocumented**

### `TERMINATOR_UUID`

Source: `chunk-ze990dc9.js` · offset 175758107 · sha256 `c7a22da2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758107.

**Undocumented**

### `TERMUX_VERSION`

Source: `chunk-gtxg4hna.js` · offset 180775616 · sha256 `b7fed4d0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-gtxg4hna.js` offset 180775616.

**Undocumented**

### `TILIX_ID`

Source: `chunk-ze990dc9.js` · offset 175758249 · sha256 `5765a66f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758249.

**Undocumented**

### `TMPDIR`

Source: `chunk-e8phgb2s.js` · offset 187228453 · sha256 `3d1885bc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e8phgb2s.js` offset 187228453.

**Undocumented**

### `TMUX`

Source: `chunk-ze990dc9.js` · offset 175757844 · sha256 `173755d8…` · 29 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 23 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175757844.

**Undocumented**

### `TMUX_PANE`

Source: `chunk-1vt3h958.js` · offset 178506236 · sha256 `72526b2f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1vt3h958.js` offset 178506236.

**Undocumented**

### `USER`

Source: `chunk-n8y6ywk9.js` · offset 177866902 · sha256 `877808d9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n8y6ywk9.js` offset 177866902.

**Undocumented**

### `USERNAME`

Source: `chunk-1vt3h958.js` · offset 178494507 · sha256 `5a380695…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `ContainerAdministrator`, `ContainerUser`.

Undocumented; read at `chunk-1vt3h958.js` offset 178494507.

**Undocumented**

### `USERPROFILE`

Source: `chunk-9yjanq6m.js` · offset 180605918 · sha256 `09f71f7e…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-9yjanq6m.js` offset 180605918.

**Undocumented**

### `UV_THREADPOOL_SIZE`

Source: `chunk-gg4jhzsm.js` · offset 209359577 · sha256 `6e9baec2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

Undocumented; read at `chunk-gg4jhzsm.js` offset 209359577.

**Undocumented**

### `VERCEL`

Source: `chunk-ze990dc9.js` · offset 175760926 · sha256 `6ae3215a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175760926.

**Undocumented**

### `VISUAL`

Source: `chunk-37wqz87g.js` · offset 192648184 · sha256 `797f4100…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-37wqz87g.js` offset 192648184.

**Undocumented**

### `VisualStudioVersion`

Source: `chunk-ze990dc9.js` · offset 175757472 · sha256 `c05a1490…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ze990dc9.js` offset 175757472.

**Undocumented**

### `VSCODE_GIT_ASKPASS_MAIN`

Source: `chunk-ze990dc9.js` · offset 175757023 · sha256 `c0a2e4f9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175757023.

**Undocumented**

### `VTE_VERSION`

Source: `chunk-ze990dc9.js` · offset 175758062 · sha256 `28245ba2…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758062.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-ddjnk2nr.js` · offset 182209761 · sha256 `71497285…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ddjnk2nr.js` offset 182209761.

**Undocumented**

### `WEBSITE_SITE_NAME`

Source: `chunk-ze990dc9.js` · offset 175761699 · sha256 `861142fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761699.

**Undocumented**

### `WEBSITE_SKU`

Source: `chunk-ze990dc9.js` · offset 175761730 · sha256 `4e4acf04…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175761730.

**Undocumented**

### `WINDIR`

Source: `chunk-yzv9vjk3.js` · offset 193370430 · sha256 `9be0888a…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-yzv9vjk3.js` offset 193370430.

**Undocumented**

### `WSL_DISTRO_NAME`

Source: `chunk-ze990dc9.js` · offset 175758561 · sha256 `d98afa7f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758561.

**Undocumented**

### `WSL_INTEROP`

Source: `chunk-j6zsezqx.js` · offset 175679658 · sha256 `69779847…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j6zsezqx.js` offset 175679658.

**Undocumented**

### `WT_SESSION`

Source: `chunk-14mz7m5y.js` · offset 192370937 · sha256 `dff34227…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-14mz7m5y.js` offset 192370937.

**Undocumented**

### `XDG_CACHE_HOME`

Source: `chunk-5b5dkraf.js` · offset 212193907 · sha256 `fc06c22e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212193907.

**Undocumented**

### `XDG_CONFIG_HOME`

Source: `chunk-5b5dkraf.js` · offset 212234584 · sha256 `7d8f5e18…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212234584.

**Undocumented**

### `XDG_DATA_HOME`

Source: `chunk-5b5dkraf.js` · offset 212193887 · sha256 `b4814b29…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212193887.

**Undocumented**

### `XDG_RUNTIME_DIR`

Source: `chunk-5b5dkraf.js` · offset 212193678 · sha256 `d94ed14d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212193678.

**Undocumented**

### `XDG_STATE_HOME`

Source: `chunk-5b5dkraf.js` · offset 212193928 · sha256 `6042ebf5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5b5dkraf.js` offset 212193928.

**Undocumented**

### `XTERM_VERSION`

Source: `chunk-ze990dc9.js` · offset 175758019 · sha256 `1f33c166…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-ze990dc9.js` offset 175758019.

**Undocumented**

### `ZED_TERM`

Source: `chunk-h7czh3dz.js` · offset 188280182 · sha256 `059fcfab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-h7czh3dz.js` offset 188280182.

**Undocumented**

### `ZELLIJ`

Source: `chunk-6sap1w9m.js` · offset 188648761 · sha256 `87944217…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-6sap1w9m.js` offset 188648761.

**Undocumented**

## Set by Claude Code for tools, hooks, and child processes

These are variables Claude Code sets. It either writes them into its own process environment, which children that inherit it receive, or adds them to the environment it builds for a specific child. Receivers are listed only where the code identifies the child; values are shown only when the code sets a literal. The same name can also appear in a read group above.

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-kdrnbgc9.js` · offset 199314878 · sha256 `941c0b00…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-kdrnbgc9.js` · offset 199314851 · sha256 `d62c59d0…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AI_AGENT`

Source: `chunk-fmvn29kc.js` · offset 175401767 · sha256 `b85eb838…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `ALLOW_ANT_COMPUTER_USE_MCP`

Source: `chunk-ze990dc9.js` · offset 175791350 · sha256 `231f4667…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-5d9gyc55.js` · offset 189046436 · sha256 `c4906342…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: API key sent as `X-Api-Key` header.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-5d9gyc55.js` · offset 189046396 · sha256 `62c1d0de…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-tce7203z.js` · offset 201831625 · sha256 `c0bd2dc3…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-ze990dc9.js` · offset 175791384 · sha256 `e6850463…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-pk626pte.js` · offset 191105906 · sha256 `50834b45…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-pk626pte.js` · offset 191104742 · sha256 `05bfc132…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-pk626pte.js` · offset 191106044 · sha256 `fe95d446…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display description for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-pk626pte.js` · offset 191105983 · sha256 `a74fbf1a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display name for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-pk626pte.js` · offset 191104659 · sha256 `4e81029a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-tce7203z.js` · offset 201830627 · sha256 `e2478441…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-ze990dc9.js` · offset 175791412 · sha256 `5c62c3de…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BROWSER`

Source: `chunk-ysnn4cgk.js` · offset 202729679 · sha256 `a304f7a4…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `BUN_OPTIONS`

Source: `chunk-wyjbafrm.js` · offset 183697221 · sha256 `1af89f3d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-kdrnbgc9.js` · offset 199315145 · sha256 `46dce939…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-kdrnbgc9.js` · offset 199315186 · sha256 `43aec7c7…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-kdrnbgc9.js` · offset 199315107 · sha256 `e570d58a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-kdrnbgc9.js` · offset 199315235 · sha256 `66a00414…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-ze990dc9.js` · offset 175791442 · sha256 `579b5f3b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-ze990dc9.js` · offset 175791469 · sha256 `76038e86…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-ze990dc9.js` · offset 175791503 · sha256 `3a09679a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175791534 · sha256 `621551ba…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-ze990dc9.js` · offset 175791563 · sha256 `0914962d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-ze990dc9.js` · offset 175791624 · sha256 `b875007f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-ze990dc9.js` · offset 175791659 · sha256 `68280e5d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`

Source: `chunk-ze990dc9.js` · offset 175791706 · sha256 `1817d4ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-ze990dc9.js` · offset 175791752 · sha256 `e1ad87f4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-xwgs2xvp.js` · offset 199909215 · sha256 `f060c8d9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-2crv8d5h.js` · offset 192152931 · sha256 `3d65cba8…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-ze990dc9.js` · offset 175791822 · sha256 `c8b38849…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175791856 · sha256 `31190373…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Stall timeout in milliseconds for subagents.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-ze990dc9.js` · offset 175791938 · sha256 `86d065c9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-ze990dc9.js` · offset 175791899 · sha256 `ca0335ae…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-ze990dc9.js` · offset 175791974 · sha256 `5e91f4d1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-5b5dkraf.js` · offset 212250876 · sha256 `87bff846…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-ze990dc9.js` · offset 175792058 · sha256 `993d09b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-6n6qvpgn.js` · offset 189109416 · sha256 `16c0cd82…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-ze990dc9.js` · offset 175792111 · sha256 `6d50814c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-ze990dc9.js` · offset 175792155 · sha256 `03ddf39c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-j3j8astv.js` · offset 188965651 · sha256 `d1ba9b97…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-j3j8astv.js` · offset 188965746 · sha256 `ccd6d771…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-ze990dc9.js` · offset 175792264 · sha256 `cfab3f8c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-w4m48xb9.js` · offset 192924078 · sha256 `7d7017df…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-ysnn4cgk.js` · offset 202733350 · sha256 `503dc6b9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-ysnn4cgk.js` · offset 202733421 · sha256 `a04d6c36…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-j3j8astv.js` · offset 188965683 · sha256 `d8ee7f8c…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-6n6qvpgn.js` · offset 189109496 · sha256 `083017bf…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-ze990dc9.js` · offset 175792462 · sha256 `c1d47c4b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-ze990dc9.js` · offset 175792486 · sha256 `01ba07eb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-w4m48xb9.js` · offset 192923243 · sha256 `22bfd5ab…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_WORKSPACE_TRUSTED`

Source: `chunk-ze990dc9.js` · offset 175792552 · sha256 `689e0f9b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175792587 · sha256 `1a798b78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_OAUTH_TOKEN`

Source: `chunk-ze990dc9.js` · offset 175792617 · sha256 `2e4e6e4b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-nv6nh3kd.js` · offset 210665255 · sha256 `a9bd88e5…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-nv6nh3kd.js` · offset 210665411 · sha256 `82ef3b77…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-nv6nh3kd.js` · offset 210665199 · sha256 `7e737ccb…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-nv6nh3kd.js` · offset 210665306 · sha256 `0fc6ce2a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-nv6nh3kd.js` · offset 210665359 · sha256 `71e8aac8…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-nv6nh3kd.js` · offset 210665153 · sha256 `f1248945…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-nv6nh3kd.js` · offset 210665103 · sha256 `96f8d3f0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_SESSION_INGRESS_URL`

Source: `chunk-ze990dc9.js` · offset 175792928 · sha256 `5aa725cc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-ze990dc9.js` · offset 175792969 · sha256 `9f40c5a5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-ze990dc9.js` · offset 175793007 · sha256 `84cbe84d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-ze990dc9.js` · offset 175793044 · sha256 `25b76371…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-pk626pte.js` · offset 191103636 · sha256 `ccb72edc…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-pk626pte.js` · offset 191103540 · sha256 `ce9c78a1…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-ze990dc9.js` · offset 175793079 · sha256 `4d4d3146…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-ze990dc9.js` · offset 175793105 · sha256 `c4415156…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-ze990dc9.js` · offset 175793157 · sha256 `4a8cabbe…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-ze990dc9.js` · offset 175793198 · sha256 `1fe3dc85…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-cpf7rt77.js` · offset 191829643 · sha256 `8790f002…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-p4h4mthd.js` · offset 182830004 · sha256 `058fa083…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-56600wpa.js` · offset 192351706 · sha256 `7afedd7f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-ze990dc9.js` · offset 175793278 · sha256 `8a46f2d1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSET_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175793387 · sha256 `5a2ee2d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-ze990dc9.js` · offset 175793430 · sha256 `c8671f25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_LIVE_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175793468 · sha256 `9669d3b1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SYNC_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175793510 · sha256 `fc6c3960…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VIEWER_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175793552 · sha256 `74c5a4fc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175793306 · sha256 `9689bfb1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-ze990dc9.js` · offset 175793348 · sha256 `884d7783…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_STATUS_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175793596 · sha256 `71ad10b6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-ze990dc9.js` · offset 175793645 · sha256 `c5e8add7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_EXTERNAL_PERMISSIONS`

Source: `chunk-ze990dc9.js` · offset 175793684 · sha256 `8262c78c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-j3j8astv.js` · offset 188965320 · sha256 `d3bfcb14…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-ze990dc9.js` · offset 175793734 · sha256 `d970c125…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-ze990dc9.js` · offset 175793762 · sha256 `daf1d683…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-ze990dc9.js` · offset 175793791 · sha256 `08dc12ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-dfcypb85.js` · offset 210116774 · sha256 `bc8da8e6…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-ze990dc9.js` · offset 175793875 · sha256 `51ad6566…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-ze990dc9.js` · offset 175793920 · sha256 `0e764c8e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-jrare64x.js` · offset 177788494 · sha256 `53dd4137…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-ze990dc9.js` · offset 175794007 · sha256 `1ee13511…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-ze990dc9.js` · offset 175794052 · sha256 `12d8877a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-wyjbafrm.js` · offset 183374501 · sha256 `df1f185a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_SESSION_ID`

Source: `chunk-1884xyd4.js` · offset 182525831 · sha256 `8549f3ec…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set automatically in Bash tool and hook command subprocesses while the session has an active Remote Control connection, and removed when the connection ends.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BRIEF`

Source: `chunk-ze990dc9.js` · offset 175794170 · sha256 `ecfcbf80…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-ze990dc9.js` · offset 175794195 · sha256 `91323ebb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-ze990dc9.js` · offset 175794227 · sha256 `6ea5a975…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-hzevqd7x.js` · offset 181399035 · sha256 `5ca39f62…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`.

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-gg4jhzsm.js` · offset 209363597 · sha256 `f90629e3…` · 2 read sites

Set for: stdio MCP servers.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-ze990dc9.js` · offset 175794258 · sha256 `23ce4c94…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLIENT_DATA_URL`

Source: `chunk-cpf7rt77.js` · offset 191853714 · sha256 `5553bf4b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-ze990dc9.js` · offset 175794296 · sha256 `700c22cc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-x7qmw6rt.js` · offset 182371203 · sha256 `deebb752…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`

Source: `chunk-ze990dc9.js` · offset 175794328 · sha256 `87d6ec95…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-ze990dc9.js` · offset 175794374 · sha256 `5d6d3aa6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-ze990dc9.js` · offset 175794411 · sha256 `1f4aab09…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-ze990dc9.js` · offset 175794438 · sha256 `befff7a6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DEV_RAW_CHANGELOG_URL`

Source: `chunk-ze990dc9.js` · offset 175794477 · sha256 `67fd1d0a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_DISABLE_ANCHORING`

Source: `chunk-ze990dc9.js` · offset 175794518 · sha256 `2dd6e112…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_ENGINE`

Source: `chunk-ze990dc9.js` · offset 175794564 · sha256 `ae1b963b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_FFWD`

Source: `chunk-ze990dc9.js` · offset 175794599 · sha256 `7b6cc67c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_GIT`

Source: `chunk-ze990dc9.js` · offset 175794632 · sha256 `9cc6347a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_STREAM`

Source: `chunk-ze990dc9.js` · offset 175794664 · sha256 `6420f269…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_ATTRIBUTION_BASELINE_REUSE`

Source: `chunk-ze990dc9.js` · offset 175794699 · sha256 `38b7fd00…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-ze990dc9.js` · offset 175794753 · sha256 `ec4198e4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-cpf7rt77.js` · offset 191828048 · sha256 `1d80e502…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DIR_SYNC`

Source: `chunk-ze990dc9.js` · offset 175794803 · sha256 `8a7d062b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-j3j8astv.js` · offset 188965427 · sha256 `547fd99f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-ze990dc9.js` · offset 175794839 · sha256 `fdbcd712…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-ze990dc9.js` · offset 175794882 · sha256 `f8e18bec…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-ze990dc9.js` · offset 175794927 · sha256 `09fd24f3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-ze990dc9.js` · offset 175794967 · sha256 `d2c33960…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-ze990dc9.js` · offset 175795009 · sha256 `c71137d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-ze990dc9.js` · offset 175795049 · sha256 `e0124197…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-ze990dc9.js` · offset 175795085 · sha256 `ca630433…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-ze990dc9.js` · offset 175795137 · sha256 `0f15a4b0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-ze990dc9.js` · offset 175795182 · sha256 `7ce3e677…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-ze990dc9.js` · offset 175795221 · sha256 `eaf8297c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-cpf7rt77.js` · offset 191778432 · sha256 `b9040413…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-94ks0f2h.js` · offset 175821054 · sha256 `446a0dfc…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `local-agent`; `sdk-cli`; `mcp`; `claude-code-github-action`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-ze990dc9.js` · offset 175795294 · sha256 `e4d1717c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-ze990dc9.js` · offset 175795330 · sha256 `2bbcc85d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-ze990dc9.js` · offset 175795376 · sha256 `8c29286b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-5b5dkraf.js` · offset 212367024 · sha256 `02ae815b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXECPATH`

Source: `chunk-wyjbafrm.js` · offset 183697149 · sha256 `a4da5322…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-ze990dc9.js` · offset 175795409 · sha256 `d75ca932…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-ze990dc9.js` · offset 175795452 · sha256 `17d46fed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-j3j8astv.js` · offset 188965220 · sha256 `f495f99b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: JSON object to merge into the top level of every API request body.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-ze990dc9.js` · offset 175795493 · sha256 `f14a4ece…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-ze990dc9.js` · offset 175795531 · sha256 `48745a8f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_BRIDGE`

Source: `chunk-ze990dc9.js` · offset 175795567 · sha256 `b6f2bb78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_EVALUATE_MEMORY`

Source: `chunk-ze990dc9.js` · offset 175795599 · sha256 `b93aef91…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-ze990dc9.js` · offset 175795640 · sha256 `63c1521f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_MEMORY_SURVEY`

Source: `chunk-ze990dc9.js` · offset 175795683 · sha256 `9ef87c21…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_TIP_ID`

Source: `chunk-ze990dc9.js` · offset 175795722 · sha256 `a58e3c75…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-v43p42ed.js` · offset 177830501 · sha256 `3b31760f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-ze990dc9.js` · offset 175795754 · sha256 `c8604057…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-ze990dc9.js` · offset 175795787 · sha256 `da8851a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in seconds for Glob tool file discovery.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-ze990dc9.js` · offset 175795827 · sha256 `4e282362…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-ze990dc9.js` · offset 175795867 · sha256 `df9da7d7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-ze990dc9.js` · offset 175795905 · sha256 `c947e5fc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175795949 · sha256 `ea77cebc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175795994 · sha256 `54054749…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-ag9k4h25.js` · offset 192986533 · sha256 `243563c1…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-j3j8astv.js` · offset 188965131 · sha256 `00e86f7e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-ze990dc9.js` · offset 175796042 · sha256 `a76158a2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-ze990dc9.js` · offset 175796075 · sha256 `83a801de…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-ze990dc9.js` · offset 175796110 · sha256 `ab4de0a2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the host address used to connect to the IDE extension.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-ze990dc9.js` · offset 175796147 · sha256 `d8a80558…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-ze990dc9.js` · offset 175796189 · sha256 `9b441f5a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_INVOKED_SKILLS`

Source: `chunk-wyjbafrm.js` · offset 183697288 · sha256 `de042d2a…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-ze990dc9.js` · offset 175796229 · sha256 `4fe8c9e3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-ze990dc9.js` · offset 175796258 · sha256 `673564f5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-ze990dc9.js` · offset 175796291 · sha256 `2f76776d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-ze990dc9.js` · offset 175796325 · sha256 `bab91e49…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MANAGED_SETTINGS_PATH`

Source: `chunk-ze990dc9.js` · offset 175796360 · sha256 `1c981f24…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_NAME`

Source: `chunk-edtry2rt.js` · offset 180943509 · sha256 `8df357a4…`

Set for: marketplace headersHelper command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_URL`

Source: `chunk-edtry2rt.js` · offset 180943463 · sha256 `b176eb5e…`

Set for: marketplace headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-ze990dc9.js` · offset 175796401 · sha256 `6c2a3455…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-ze990dc9.js` · offset 175796445 · sha256 `ff100cc3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-ze990dc9.js` · offset 175796491 · sha256 `ab54d7a7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-ze990dc9.js` · offset 175796535 · sha256 `ef37538d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-ze990dc9.js` · offset 175796583 · sha256 `16574dcb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_APPS_HOST`

Source: `chunk-ze990dc9.js` · offset 175796620 · sha256 `2536c83b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-ze990dc9.js` · offset 175796653 · sha256 `1b8af182…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-ze990dc9.js` · offset 175796695 · sha256 `e5884623…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-ze990dc9.js` · offset 175796739 · sha256 `9efe97f2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_SERVER_NAME`

Source: `chunk-vk9j502m.js` · offset 209065501 · sha256 `0a578ed5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_SERVER_URL`

Source: `chunk-vk9j502m.js` · offset 209065531 · sha256 `024bb5f5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-ze990dc9.js` · offset 175796776 · sha256 `bde4c37e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-ze990dc9.js` · offset 175796815 · sha256 `a66204c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Idle timeout in milliseconds for MCP tool calls.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_SUBAGENT_APPEND`

Source: `chunk-ze990dc9.js` · offset 175796856 · sha256 `71512364…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-g1gybmy1.js` · offset 199241260 · sha256 `61eb0294…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MESSAGING_TOKEN`

Source: `chunk-g1gybmy1.js` · offset 199241301 · sha256 `f7ffb355…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports this per-session token to hooks and Bash commands alongside `CLAUDE_CODE_MESSAGING_SOCKET`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MOCK_REMOTE_SETTINGS`

Source: `chunk-ze990dc9.js` · offset 175796898 · sha256 `62b7cf4c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MOCK_TRIAL`

Source: `chunk-ze990dc9.js` · offset 175796938 · sha256 `1fa1edbc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-1vt3h958.js` · offset 178689232 · sha256 `3dbe1cd6…` · 7 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: OAuth access token for claude.ai authentication.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OVERRIDE_DATE`

Source: `chunk-ze990dc9.js` · offset 175796968 · sha256 `60e61254…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-ze990dc9.js` · offset 175797001 · sha256 `6872c622…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`

Source: `chunk-ze990dc9.js` · offset 175797046 · sha256 `7008d462…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-ze990dc9.js` · offset 175797089 · sha256 `0f5b4c81…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-ze990dc9.js` · offset 175797128 · sha256 `820be191…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to enable Perforce-aware write protection.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-ze990dc9.js` · offset 175797161 · sha256 `6b6a4c88…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-ze990dc9.js` · offset 175797200 · sha256 `1a45c173…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ARCHIVE_URL`

Source: `chunk-edtry2rt.js` · offset 180944137 · sha256 `c4405f96…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-ze990dc9.js` · offset 175797247 · sha256 `0b87fc94…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-ze990dc9.js` · offset 175797285 · sha256 `4e4bfeb3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the plugins root directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-3z7wa894.js` · offset 189035239 · sha256 `e866bde0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value (set only under a condition).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175797321 · sha256 `de403435…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_NAME`

Source: `chunk-edtry2rt.js` · offset 180944100 · sha256 `60d6a445…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-ze990dc9.js` · offset 175797362 · sha256 `43a42349…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-ze990dc9.js` · offset 175797397 · sha256 `ddf2e0d8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-ze990dc9.js` · offset 175797433 · sha256 `36af8afe…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-ze990dc9.js` · offset 175797476 · sha256 `190da2d2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-ze990dc9.js` · offset 175797517 · sha256 `47543f68…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-ze990dc9.js` · offset 175797555 · sha256 `82c7ac25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROXY_AUTHENTICATE`

Source: `chunk-tm5nr0r0.js` · offset 187170546 · sha256 `318a36b9…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_HOST`

Source: `chunk-tm5nr0r0.js` · offset 187170513 · sha256 `e651775d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_URL`

Source: `chunk-tm5nr0r0.js` · offset 187170465 · sha256 `a68a4b7d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175797591 · sha256 `22f5f9fd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-ze990dc9.js` · offset 175797632 · sha256 `542e2b68…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-ze990dc9.js` · offset 175797669 · sha256 `63f99ada…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-ze990dc9.js` · offset 175797719 · sha256 `7d6b895d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-v43p42ed.js` · offset 177828201 · sha256 `cce5dc89…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-be92d2t5.js` · offset 188897248 · sha256 `17940c68…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-ze990dc9.js` · offset 175797804 · sha256 `74e286f8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-ze990dc9.js` · offset 175797830 · sha256 `9b711978…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-ze990dc9.js` · offset 175797873 · sha256 `64d43d9b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-ze990dc9.js` · offset 175797913 · sha256 `8866177d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_RAW_EVENTS_FILE`

Source: `chunk-ze990dc9.js` · offset 175797950 · sha256 `9ccc1343…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-ze990dc9.js` · offset 175797992 · sha256 `682ece80…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-ze990dc9.js` · offset 175798034 · sha256 `7e0eb8f4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically in cloud sessions to the current session's ID.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-ze990dc9.js` · offset 175798071 · sha256 `73824593…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_PATH`

Source: `chunk-ze990dc9.js` · offset 175798112 · sha256 `b2d90e5b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_POLL_MS`

Source: `chunk-ze990dc9.js` · offset 175798152 · sha256 `96565f4d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPL`

Source: `chunk-ze990dc9.js` · offset 175798195 · sha256 `64131f4f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-ze990dc9.js` · offset 175798219 · sha256 `71f915e3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-mzg9kbjz.js` · offset 203743749 · sha256 `b52ac6d1…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; a runtime value (set only under a condition).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-ze990dc9.js` · offset 175798283 · sha256 `fd97b4d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-ze990dc9.js` · offset 175798322 · sha256 `77130915…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-ze990dc9.js` · offset 175798365 · sha256 `bd877b4a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-ze990dc9.js` · offset 175798419 · sha256 `13ffd9d7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-ze990dc9.js` · offset 175798452 · sha256 `b3082271…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-j3j8astv.js` · offset 188965788 · sha256 `5721e6f4…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-ze990dc9.js` · offset 175798524 · sha256 `cd8c9275…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-ze990dc9.js` · offset 175798568 · sha256 `649b505e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-ze990dc9.js` · offset 175798610 · sha256 `3f36be49…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-cpf7rt77.js` · offset 191828010 · sha256 `e2d01209…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-ze990dc9.js` · offset 175798691 · sha256 `6f3111fb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-ze990dc9.js` · offset 175798720 · sha256 `c1c8812c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-m24vnr98.js` · offset 213405789 · sha256 `6af06b37…` · 5 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-7k6n1zya.js` · offset 187214064 · sha256 `f1c9d9f3…` · 8 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value (set only under a condition).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-hzevqd7x.js` · offset 181399065 · sha256 `6d45127b…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1` or `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-gg4jhzsm.js` · offset 209363503 · sha256 `bc8434d5…` · 5 read sites

Set for: stdio MCP servers; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-ze990dc9.js` · offset 175798860 · sha256 `91e21be2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-ze990dc9.js` · offset 175798892 · sha256 `5c204d32…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-ze990dc9.js` · offset 175798924 · sha256 `fd430fc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-ze990dc9.js` · offset 175798958 · sha256 `bed60660…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175798783 · sha256 `fb8f3319…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-ze990dc9.js` · offset 175799019 · sha256 `1752aff8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the shell Claude Code uses to run Bash tool commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-ze990dc9.js` · offset 175799044 · sha256 `e8cb8460…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-cpf7rt77.js` · offset 191827967 · sha256 `1cc8c889…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-ze990dc9.js` · offset 175799102 · sha256 `710e4177…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-ze990dc9.js` · offset 175799142 · sha256 `9bc0f164…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-ze990dc9.js` · offset 175799179 · sha256 `c44cbde0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-ze990dc9.js` · offset 175799217 · sha256 `6b9f332a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-ze990dc9.js` · offset 175799245 · sha256 `bfbc24c9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-ze990dc9.js` · offset 175799293 · sha256 `2ac64ebc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-ze990dc9.js` · offset 175799336 · sha256 `a25808e4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-5mcqa25r.js` · offset 189982088 · sha256 `b0db2d18…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-v43p42ed.js` · offset 177828121 · sha256 `2815a03c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-ze990dc9.js` · offset 175799415 · sha256 `8ea7d03e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175799643 · sha256 `a1244d7e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for synchronous plugin installation.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-ze990dc9.js` · offset 175799445 · sha256 `ca171dec…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-ze990dc9.js` · offset 175799495 · sha256 `aa3ae97f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175799545 · sha256 `b895ee23…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175799596 · sha256 `3e166851…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-ze990dc9.js` · offset 175799693 · sha256 `2ce68ba5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-ze990dc9.js` · offset 175799733 · sha256 `327f1c30…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175799770 · sha256 `d1ea4c1f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175799820 · sha256 `07a0fbd1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-ze990dc9.js` · offset 175799867 · sha256 `52ba4668…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `false` to disable syntax highlighting in diff output.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-ze990dc9.js` · offset 175799903 · sha256 `155eb6bf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-ze990dc9.js` · offset 175799947 · sha256 `f4fe68d8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-ze990dc9.js` · offset 175799971 · sha256 `0c9c42ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Share a task list across sessions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175800003 · sha256 `7e7d4eb9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-ze990dc9.js` · offset 175800052 · sha256 `bb7df29c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-ze990dc9.js` · offset 175800090 · sha256 `c0e14b10…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-ze990dc9.js` · offset 175800133 · sha256 `14765391…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FORCE_DENY`

Source: `chunk-ze990dc9.js` · offset 175800171 · sha256 `1aaf2075…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_GIT_BASH`

Source: `chunk-ze990dc9.js` · offset 175800206 · sha256 `5e63b393…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_PWSH`

Source: `chunk-ze990dc9.js` · offset 175800242 · sha256 `9f8aefa0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-ze990dc9.js` · offset 175800274 · sha256 `e6608bdf…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Override the temp directory used for internal temp files.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-ze990dc9.js` · offset 175800300 · sha256 `eb6f0f16…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-ze990dc9.js` · offset 175800331 · sha256 `4b62b4b9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-ze990dc9.js` · offset 175800372 · sha256 `060c28dc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-ze990dc9.js` · offset 175800404 · sha256 `07496dbf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-ze990dc9.js` · offset 175800438 · sha256 `0e18199b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-ze990dc9.js` · offset 175800484 · sha256 `9ed510f9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-ze990dc9.js` · offset 175800521 · sha256 `8b1b4f0c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-mzg9kbjz.js` · offset 203709130 · sha256 `48b906bb…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-n3jtyenp.js` · offset 182200531 · sha256 `e8dca967…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-ze990dc9.js` · offset 175800617 · sha256 `2572d56d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-ze990dc9.js` · offset 175800666 · sha256 `d18c5c46…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175800711 · sha256 `0ac24522…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_VERSION`

Source: `chunk-8mkwx7mn.js` · offset 176758835 · sha256 `fda1623c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-ze990dc9.js` · offset 175800753 · sha256 `c08a994f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_CHECKIN_SCHEDULE`

Source: `chunk-ze990dc9.js` · offset 175800801 · sha256 `49a796e7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-ze990dc9.js` · offset 175800844 · sha256 `e9273b60…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-ze990dc9.js` · offset 175800876 · sha256 `b4082f80…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-ze990dc9.js` · offset 175800916 · sha256 `bd2fe27e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the configuration directory (default: `~/.claude`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-ze990dc9.js` · offset 175800941 · sha256 `cefab983…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-ze990dc9.js` · offset 175800986 · sha256 `eb7d9717…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-ze990dc9.js` · offset 175801025 · sha256 `2dc9d885…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-ze990dc9.js` · offset 175801067 · sha256 `ccb9a721…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_EFFORT`

Source: `chunk-hzevqd7x.js` · offset 181399212 · sha256 `79c852b9…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

From docs: Set automatically in Bash tool subprocesses and hook commands to the effort level in effect when the subprocess starts: `low`, `medium`, `high`, `xhigh`, or `max`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-wyjbafrm.js` · offset 185112055 · sha256 `3a3e10ac…` · 2 read sites

Set for: hook commands.

Value: a runtime value (set only under a condition). Condition values in code: `SessionStart`, `Setup`, `CwdChanged`, `FileChanged`.

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-ze990dc9.js` · offset 175801132 · sha256 `35cf39ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-3med333c.js` · offset 207519583 · sha256 `23a7a3fc…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-ze990dc9.js` · offset 175801210 · sha256 `6f3ee484…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-ze990dc9.js` · offset 175801246 · sha256 `372a5b93…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_MEMORY_STORES`

Source: `chunk-ze990dc9.js` · offset 175801268 · sha256 `fbc65655…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PID`

Source: `chunk-hzevqd7x.js` · offset 181399108 · sha256 `51f03cbe…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: Claude Code's process ID.

From docs: Claude Code sets this to its own process ID in the subprocesses it spawns: Bash and PowerShell tool commands and hook commands.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_PLUGIN_DATA`

Source: `chunk-wyjbafrm.js` · offset 183123035 · sha256 `c7d5961f…` · 3 read sites

Set for: plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_OPTION_*`

Source: `chunk-wyjbafrm.js` · offset 185111885 · sha256 `79956c17…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_ROOT`

Source: `chunk-vk9j502m.js` · offset 209065571 · sha256 `c3288d7f…` · 5 read sites

Set for: MCP server headersHelper command; plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_PROJECT_DIR`

Source: `chunk-7ytxmfcd.js` · offset 215238086 · sha256 `68eac332…` · 6 read sites

Set for: hook commands; stdio MCP servers.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-ze990dc9.js` · offset 175801296 · sha256 `44f7e2d9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-ze990dc9.js` · offset 175801323 · sha256 `0ef74ae9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-w4m48xb9.js` · offset 192924001 · sha256 `b735c221…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-ze990dc9.js` · offset 175801382 · sha256 `b7d5ce48…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`

Source: `chunk-cpf7rt77.js` · offset 191775801 · sha256 `71c63b4c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-cpf7rt77.js` · offset 191833301 · sha256 `bebc39e1…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-ze990dc9.js` · offset 175801505 · sha256 `fd393a1c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-ze990dc9.js` · offset 175801540 · sha256 `9e8051d4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ACCOUNT_EMAIL`

Source: `chunk-9myq0fvp.js` · offset 187559404 · sha256 `7d21deed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Email of the account that enqueued the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACCOUNT_ID`

Source: `chunk-9myq0fvp.js` · offset 187559455 · sha256 `8c6c4c78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Tagged ID of the account that enqueued the session, for per-account routing, quota, or chargeback.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-ze990dc9.js` · offset 175801577 · sha256 `4b849f6d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ATTEMPT`

Source: `chunk-9myq0fvp.js` · offset 187559318 · sha256 `918c8041…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many spawn requests this session has had.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CLIENT_PLATFORM`

Source: `chunk-9myq0fvp.js` · offset 187559816 · sha256 `25dd9f8d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The client surface that created the session, such as `web_claude_ai`, `desktop_app`, `ios`, `claude_code_cli`, or `scheduled_trigger`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CORRELATION_ID`

Source: `chunk-9myq0fvp.js` · offset 187559763 · sha256 `428b1c25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The correlation ID supplied at session create, echoed back so the hook can map this work order to the request that created the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-ze990dc9.js` · offset 175801610 · sha256 `cda8943f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Git fetch depth for fresh clones.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_ORDER_ID`

Source: `chunk-9myq0fvp.js` · offset 187559154 · sha256 `f9fe867a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Opaque idempotency key, unique per spawn request and safe for Kubernetes resource names.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ORDER_SERVER_TIME`

Source: `chunk-9myq0fvp.js` · offset 187559500 · sha256 `d03989a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Server time from the poll response's HTTP `Date` header.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_POOL_ID`

Source: `chunk-9myq0fvp.js` · offset 187559365 · sha256 `da2ebaa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The ID of the environment the new runner should join, in `ccpool_...` form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_REVISION`

Source: `chunk-9myq0fvp.js` · offset 187559610 · sha256 `292d83d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Revision of the session's first git source: branch, SHA, or tag.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_URL`

Source: `chunk-9myq0fvp.js` · offset 187559553 · sha256 `3be603cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: URL of the session's first git source, for routing to a runner with that repository pre-warmed.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_REPO_SOURCES`

Source: `chunk-9myq0fvp.js` · offset 187559677 · sha256 `e2622d49…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON array of `{url, revision}` for all the session's git sources, for hooks that route on a secondary repository.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-9myq0fvp.js` · offset 187559190 · sha256 `3128e1bf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_UUID`

Source: `chunk-9myq0fvp.js` · offset 187559271 · sha256 `2c8246b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The same session ID in canonical UUID form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_WORK_ORDER_FILE`

Source: `chunk-9myq0fvp.js` · offset 187559122 · sha256 `48f0b1f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a temp file containing the signed work-order JWT the new runner registers with.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-ze990dc9.js` · offset 175801643 · sha256 `ef7184f8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_SERVE_DRAIN_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175801682 · sha256 `03407705…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SNIP`

Source: `chunk-ze990dc9.js` · offset 175801719 · sha256 `eaa01b47…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_LOCAL_BINARY`

Source: `chunk-ze990dc9.js` · offset 175801738 · sha256 `b864c4b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_VERSION`

Source: `chunk-ze990dc9.js` · offset 175801769 · sha256 `913a4293…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-ze990dc9.js` · offset 175801795 · sha256 `867cb4e8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_TEST_PROJECT_DIR`

Source: `chunk-52x2atdx.js` · offset 207686406 · sha256 `38ee8375…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `${CLAUDE_PROJECT_DIR}`.

No read site found by this scan.

**Undocumented**

### `CLAUDE_TMPDIR`

Source: `chunk-wyjbafrm.js` · offset 183728069 · sha256 `367cd797…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-gg4jhzsm.js` · offset 209363530 · sha256 `8eeb7c77…` · 6 read sites

Set for: stdio MCP servers; the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`; a runtime value.

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `COLUMNS`

Source: `chunk-wyjbafrm.js` · offset 185111643 · sha256 `27da6e8d…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `DEBUG`

Source: `chunk-gzxd8cyw.js` · offset 177102622 · sha256 `0c351e1e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-2crv8d5h.js` · offset 192071896 · sha256 `f6740586…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to disable automatic background updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISPLAY`

Source: `chunk-wyjbafrm.js` · offset 186029122 · sha256 `7e8467cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GCM_INTERACTIVE`

Source: `chunk-7k6n1zya.js` · offset 187214172 · sha256 `47d6f88e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181849250 · sha256 `0eb60ad6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181849222 · sha256 `db7e4b41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ALLOW_PROTOCOL`

Source: `chunk-7k6n1zya.js` · offset 187214285 · sha256 `1d09032b…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `none`; `https:http:ssh` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `GIT_ALTERNATE_OBJECT_DIRECTORIES`

Source: `chunk-ygtz1chg.js` · offset 195477884 · sha256 `6c890011…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-93fap8m8.js` · offset 181174328 · sha256 `291f5fa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ATTR_NOSYSTEM`

Source: `chunk-7s1660c2.js` · offset 210358584 · sha256 `497d453b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_DATE`

Source: `chunk-7s1660c2.js` · offset 210380121 · sha256 `6b0f7355…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_EMAIL`

Source: `chunk-7s1660c2.js` · offset 210358958 · sha256 `0caa65bc…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `bash-edit-diff@localhost`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_NAME`

Source: `chunk-7s1660c2.js` · offset 210358933 · sha256 `05455839…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `bash-edit-diff`.

No read site found by this scan.

**Undocumented**

### `GIT_CEILING_DIRECTORIES`

Source: `chunk-hzevqd7x.js` · offset 181517977 · sha256 `b35c8a98…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_DATE`

Source: `chunk-wyjbafrm.js` · offset 186594467 · sha256 `3b626dd6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_EMAIL`

Source: `chunk-7s1660c2.js` · offset 210359013 · sha256 `7ee002b6…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `bash-edit-diff@localhost`; `noreply@anthropic.com`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_NAME`

Source: `chunk-7s1660c2.js` · offset 210358985 · sha256 `b6c53d87…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `bash-edit-diff`; `Claude Code file sync`.

No read site found by this scan.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-7k6n1zya.js` · offset 187214110 · sha256 `ef00c0bc…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-5b5dkraf.js` · offset 212338449 · sha256 `c41b4f9a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-wyjbafrm.js` · offset 183697248 · sha256 `5bc3d02d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-y8am1j53.js` · offset 187304804 · sha256 `c6cdecc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_DEFAULT_REF_FORMAT`

Source: `chunk-8mkz89kh.js` · offset 195798950 · sha256 `f78cf763…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `files` (set only under a condition). Condition values in code: `HEAD`.

No read site found by this scan.

**Undocumented**

### `GIT_DIR`

Source: `chunk-hzevqd7x.js` · offset 182108233 · sha256 `6106814b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_EDITOR`

Source: `chunk-wyjbafrm.js` · offset 183706317 · sha256 `d8fae42f…` · 3 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `true`.

No read site found by this scan.

**Undocumented**

### `GIT_GLOB_PATHSPECS`

Source: `chunk-8mkz89kh.js` · offset 195821380 · sha256 `c5fa880e…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_GRAFT_FILE`

Source: `chunk-hzevqd7x.js` · offset 181569155 · sha256 `94887155…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `\\.\NUL\no-grafts` or `/dev/null/no-grafts`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_ICASE_PATHSPECS`

Source: `chunk-8mkz89kh.js` · offset 195821356 · sha256 `0e9087c2…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_INDEX_FILE`

Source: `chunk-3fz6ek53.js` · offset 207382810 · sha256 `84543626…` · 14 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_LITERAL_PATHSPECS`

Source: `chunk-8mkz89kh.js` · offset 195821330 · sha256 `0fd7bb58…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`; `1`.

No read site found by this scan.

**Undocumented**

### `GIT_NO_LAZY_FETCH`

Source: `chunk-93fap8m8.js` · offset 181174221 · sha256 `ec30a6d7…` · 5 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_NO_REPLACE_OBJECTS`

Source: `chunk-hzevqd7x.js` · offset 181569128 · sha256 `3df908f0…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_NOGLOB_PATHSPECS`

Source: `chunk-8mkz89kh.js` · offset 195821403 · sha256 `0f84b61e…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_OBJECT_DIRECTORY`

Source: `chunk-dsxy6a2x.js` · offset 210183259 · sha256 `f4c79723…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_OPTIONAL_LOCKS`

Source: `chunk-wyjbafrm.js` · offset 186590698 · sha256 `671e967a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_PROGRESS_DELAY`

Source: `chunk-7k6n1zya.js` · offset 187214218 · sha256 `f07c9246…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-pez7h27x.js` · offset 176513806 · sha256 `87b5514a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SHALLOW_FILE`

Source: `chunk-8mkz89kh.js` · offset 196004759 · sha256 `06059806…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-7k6n1zya.js` · offset 187214338 · sha256 `642ec4ba…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `false`; `ssh -o BatchMode=yes` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-7k6n1zya.js` · offset 187214148 · sha256 `ebaa1d2e…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_WORK_TREE`

Source: `chunk-hzevqd7x.js` · offset 182108248 · sha256 `6f8973f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181849273 · sha256 `4dd424ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181849234 · sha256 `588127ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITLAB_ACCESS_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181859672 · sha256 `ed5747c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `GITLAB_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181859652 · sha256 `fa287e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `HOME`

Source: `chunk-5b5dkraf.js` · offset 212338363 · sha256 `6926099c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `HOMEBREW_NO_AUTO_UPDATE`

Source: `chunk-7j5dabgj.js` · offset 192628634 · sha256 `7a329310…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LANGUAGE`

Source: `chunk-mwwcdvwq.js` · offset 207618974 · sha256 `c56805bc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LC_ALL`

Source: `chunk-5b5dkraf.js` · offset 212134534 · sha256 `d93853ac…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `C`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `LINES`

Source: `chunk-wyjbafrm.js` · offset 185111671 · sha256 `27898386…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-ze990dc9.js` · offset 175801846 · sha256 `8f16cde2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-ze990dc9.js` · offset 175801900 · sha256 `a9b65237…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-ze990dc9.js` · offset 175801866 · sha256 `9c3da2ca…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-ze990dc9.js` · offset 175801930 · sha256 `15a4b026…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Turns the MCP discovery cache on or off.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-ze990dc9.js` · offset 175801957 · sha256 `23886137…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-ze990dc9.js` · offset 175801996 · sha256 `368e2991…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-ze990dc9.js` · offset 175802031 · sha256 `566c7f6a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-ze990dc9.js` · offset 175802064 · sha256 `c370422f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-ze990dc9.js` · offset 175802095 · sha256 `f11970c6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-ze990dc9.js` · offset 175802132 · sha256 `8856b222…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-ze990dc9.js` · offset 175802164 · sha256 `4754e907…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-ze990dc9.js` · offset 175802211 · sha256 `f2753356…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-ze990dc9.js` · offset 175802237 · sha256 `ed42906a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-ze990dc9.js` · offset 175802277 · sha256 `df9bfd7a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-ze990dc9.js` · offset 175802296 · sha256 `ca5c282c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-ze990dc9.js` · offset 175802320 · sha256 `c5f7d596…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NODE_ENV`

Source: `chunk-5b5dkraf.js` · offset 212134566 · sha256 `6541f2a8…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `production`.

No read site found by this scan.

**Undocumented**

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-18eh819q.js` · offset 189129902 · sha256 `92a4b4bf…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NoDefaultCurrentDirectoryInExePath`

Source: `chunk-2crv8d5h.js` · offset 192121630 · sha256 `91bf70a2…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

No read site found by this scan.

**Undocumented**

### `OAUTH_TOKEN`

Source: `chunk-hzevqd7x.js` · offset 181859699 · sha256 `4c09c85b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-hyw5ktfw.js` · offset 199513976 · sha256 `c023412c…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `delta`.

From docs: Metrics temporality preference (default: `delta`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `PATH`

Source: `chunk-5b5dkraf.js` · offset 212134513 · sha256 `5ed8d9f7…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/usr/bin:/bin`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `PS1`

Source: `chunk-s6nd8vdm.js` · offset 194184881 · sha256 `c1e1ae25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `PS2`

Source: `chunk-s6nd8vdm.js` · offset 194184888 · sha256 `462b4728…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-ze990dc9.js` · offset 175802358 · sha256 `575eda6b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-y8am1j53.js` · offset 187444850 · sha256 `29105809…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187443889 · sha256 `b4d8a2cd…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-y8am1j53.js` · offset 187443635 · sha256 `f266da14…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-y8am1j53.js` · offset 187443345 · sha256 `02b7a9c6…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-9myq0fvp.js` · offset 187559077 · sha256 `a4acc82d…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-y8am1j53.js` · offset 187438898 · sha256 `b4a4bf12…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-y8am1j53.js` · offset 187420372 · sha256 `334958a4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-y8am1j53.js` · offset 187442012 · sha256 `cd2ffa47…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-y8am1j53.js` · offset 187441684 · sha256 `ed5602f5…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-9myq0fvp.js` · offset 187559039 · sha256 `68243b99…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-y8am1j53.js` · offset 187442850 · sha256 `386aaa88…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-tm5nr0r0.js` · offset 187138503 · sha256 `2bd21780…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-tm5nr0r0.js` · offset 187138557 · sha256 `ef192279…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-y8am1j53.js` · offset 187445276 · sha256 `1c6b9740…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-y8am1j53.js` · offset 187444168 · sha256 `539370ee…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-y8am1j53.js` · offset 187442324 · sha256 `8b6fa150…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-y8am1j53.js` · offset 187444498 · sha256 `96c946da…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-ze990dc9.js` · offset 175802380 · sha256 `3ecb4b4e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SHELL`

Source: `chunk-0r1makwg.js` · offset 176433855 · sha256 `d0ad950e…` · 4 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-ze990dc9.js` · offset 175802407 · sha256 `52e5eaab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `SSH_ASKPASS`

Source: `chunk-93fap8m8.js` · offset 181174379 · sha256 `f6cf3060…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-ze990dc9.js` · offset 175802445 · sha256 `685b10dc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TEMP`

Source: `chunk-5b5dkraf.js` · offset 212338423 · sha256 `abe2607f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TERM`

Source: `chunk-5b5dkraf.js` · offset 212338437 · sha256 `841346ef…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `dumb`; `xterm-256color`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-ze990dc9.js` · offset 175802483 · sha256 `ae1aaf62…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMP`

Source: `chunk-5b5dkraf.js` · offset 212338410 · sha256 `7e51b28f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TMPDIR`

Source: `chunk-5b5dkraf.js` · offset 212338394 · sha256 `904359e8…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMPPREFIX`

Source: `chunk-wyjbafrm.js` · offset 183697209 · sha256 `47a8d8f7…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `TMUX`

Source: `chunk-wyjbafrm.js` · offset 183697172 · sha256 `db982b13…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TRACEPARENT`

Source: `chunk-hzevqd7x.js` · offset 181399278 · sha256 `aab96fde…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ULTRAPLAN_PROMPT_FILE`

Source: `chunk-ze990dc9.js` · offset 175802522 · sha256 `d87b604c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `USER_TYPE`

Source: `chunk-5b5dkraf.js` · offset 212134545 · sha256 `63ec52da…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `external`.

No read site found by this scan.

**Undocumented**

### `USERPROFILE`

Source: `chunk-5b5dkraf.js` · offset 212338375 · sha256 `3a88058a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VCR_RECORD`

Source: `chunk-ze990dc9.js` · offset 175802551 · sha256 `554758fb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-ze990dc9.js` · offset 175802569 · sha256 `1822f8ab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-ze990dc9.js` · offset 175802595 · sha256 `d00b95d5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-wyjbafrm.js` · offset 186029133 · sha256 `bbd32953…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

## Read only by bundled third-party libraries

These names are read only by code with no Claude Code evidence: no typed-schema entry, no first-party boolean helper, no Claude Code name prefix, and no docs entry. That is most likely bundled third-party library code. They are listed for completeness.

### `_X_AMZN_TRACE_ID`

Source: `chunk-5qj86qz3.js` · offset 193692553 · sha256 `17f869aa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-5qj86qz3.js` offset 193692553.

**Undocumented**

### `AWS_ACCOUNT_ID`

Source: `chunk-qtteq8j0.js` · offset 194067220 · sha256 `757201c8…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067220.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN`

Source: `chunk-79k89st6.js` · offset 208279166 · sha256 `4144f535…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-79k89st6.js` offset 208279166.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`

Source: `chunk-kw8fsxr5.js` · offset 208294096 · sha256 `858c3edf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kw8fsxr5.js` offset 208294096.

**Undocumented**

### `AWS_CREDENTIAL_EXPIRATION`

Source: `chunk-qtteq8j0.js` · offset 194067186 · sha256 `ec172743…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067186.

**Undocumented**

### `AWS_CREDENTIAL_SCOPE`

Source: `chunk-qtteq8j0.js` · offset 194067203 · sha256 `471e850e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qtteq8j0.js` offset 194067203.

**Undocumented**

### `AWS_EC2_METADATA_DISABLED`

Source: `chunk-5qj86qz3.js` · offset 193827135 · sha256 `1c8da441…` · 3 read sites

Read as: enum (compared against fixed values). Values: `false`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-5qj86qz3.js` offset 193827135.

**Undocumented**

### `AWS_LAMBDA_BENCHMARK_MODE`

Source: `chunk-5qj86qz3.js` · offset 193691878 · sha256 `11d880c2…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-5qj86qz3.js` offset 193691878.

**Undocumented**

### `AWS_LAMBDA_MAX_CONCURRENCY`

Source: `chunk-5qj86qz3.js` · offset 193691591 · sha256 `441ec1d5…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-5qj86qz3.js` offset 193691591.

**Undocumented**

### `AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA`

Source: `chunk-5qj86qz3.js` · offset 193690256 · sha256 `55d05854…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-5qj86qz3.js` offset 193690256.

**Undocumented**

### `AWS_LOGIN_CACHE_DIRECTORY`

Source: `chunk-wyf5d5q2.js` · offset 194111136 · sha256 `304b902c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-wyf5d5q2.js` offset 194111136.

**Undocumented**

### `AWS_ROLE_SESSION_NAME`

Source: `chunk-mhyvshyz.js` · offset 208289376 · sha256 `df2e4a0a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-mhyvshyz.js` offset 208289376.

**Undocumented**

### `AZURE_ADDITIONALLY_ALLOWED_TENANTS`

Source: `chunk-cm8fpatp.js` · offset 197799946 · sha256 `ed848eaa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197799946.

**Undocumented**

### `AZURE_AUTHORITY_HOST`

Source: `chunk-cm8fpatp.js` · offset 197556689 · sha256 `104f8a52…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197556689.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PASSWORD`

Source: `chunk-cm8fpatp.js` · offset 197800919 · sha256 `72a5ed2a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197800919.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PATH`

Source: `chunk-cm8fpatp.js` · offset 197800875 · sha256 `62b280d9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197800875.

**Undocumented**

### `AZURE_CLIENT_SECRET`

Source: `chunk-cm8fpatp.js` · offset 197800555 · sha256 `e3d785a5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197800555.

**Undocumented**

### `AZURE_CLIENT_SEND_CERTIFICATE_CHAIN`

Source: `chunk-cm8fpatp.js` · offset 197800100 · sha256 `cedfa2bc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197800100.

**Undocumented**

### `AZURE_FEDERATED_TOKEN_FILE`

Source: `chunk-cm8fpatp.js` · offset 197776550 · sha256 `5affa54c…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197776550.

**Undocumented**

### `AZURE_IDENTITY_DISABLE_MULTITENANTAUTH`

Source: `chunk-cm8fpatp.js` · offset 197502421 · sha256 `4815de9a…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-cm8fpatp.js` offset 197502421.

**Undocumented**

### `AZURE_PASSWORD`

Source: `chunk-cm8fpatp.js` · offset 197801203 · sha256 `7c19281e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197801203.

**Undocumented**

### `AZURE_POD_IDENTITY_AUTHORITY_HOST`

Source: `chunk-cm8fpatp.js` · offset 197762352 · sha256 `a8c1f5b5…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-cm8fpatp.js` offset 197762352.

**Undocumented**

### `AZURE_REGIONAL_AUTHORITY_NAME`

Source: `chunk-cm8fpatp.js` · offset 197765337 · sha256 `5f710949…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197765337.

**Undocumented**

### `AZURE_TOKEN_CREDENTIALS`

Source: `chunk-cm8fpatp.js` · offset 197804224 · sha256 `91cb3c34…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-cm8fpatp.js` offset 197804224.

**Undocumented**

### `AZURE_USERNAME`

Source: `chunk-cm8fpatp.js` · offset 197801174 · sha256 `9de4ee24…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197801174.

**Undocumented**

### `BUF_BIGINT_DISABLE`

Source: `chunk-9yjanq6m.js` · offset 180156683 · sha256 `31674c1d…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-9yjanq6m.js` offset 180156683.

**Undocumented**

### `CHOKIDAR_INTERVAL`

Source: `chunk-4n78696j.js` · offset 179109273 · sha256 `4c2baee7…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4n78696j.js` offset 179109273.

**Undocumented**

### `CHOKIDAR_USEPOLLING`

Source: `chunk-4n78696j.js` · offset 179109092 · sha256 `809a7001…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-4n78696j.js` offset 179109092.

**Undocumented**

### `CLOUD_RUN_JOB`

Source: `chunk-sajhfs1y.js` · offset 193929588 · sha256 `c94bcd46…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-sajhfs1y.js` offset 193929588.

**Undocumented**

### `DEBUG_AUTH`

Source: `chunk-sajhfs1y.js` · offset 193940505 · sha256 `a9d539c6…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-sajhfs1y.js` offset 193940505.

**Undocumented**

### `DETECT_GCP_RETRIES`

Source: `chunk-sajhfs1y.js` · offset 193939824 · sha256 `bef4b628…` · 2 read sites

Read as: number (parsed as a number).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-sajhfs1y.js` offset 193939824.

**Undocumented**

### `FUNCTION_NAME`

Source: `chunk-sajhfs1y.js` · offset 193929615 · sha256 `16cc5003…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193929615.

**Undocumented**

### `FUNCTION_TARGET`

Source: `chunk-sajhfs1y.js` · offset 193971261 · sha256 `be8aa066…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193971261.

**Undocumented**

### `GAE_MODULE_NAME`

Source: `chunk-sajhfs1y.js` · offset 193971182 · sha256 `3aec2dd6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193971182.

**Undocumented**

### `GAE_SERVICE`

Source: `chunk-sajhfs1y.js` · offset 193971157 · sha256 `3c32fa81…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193971157.

**Undocumented**

### `GCE_METADATA_HOST`

Source: `chunk-sajhfs1y.js` · offset 193938122 · sha256 `489ed04c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193938122.

**Undocumented**

### `GCE_METADATA_IP`

Source: `chunk-sajhfs1y.js` · offset 193938093 · sha256 `63485255…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 193938093.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-pez7h27x.js` · offset 176513824 · sha256 `d8c02a58…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pez7h27x.js` offset 176513824.

**Undocumented**

### `GIT_SSL_CERT`

Source: `chunk-y8am1j53.js` · offset 187320728 · sha256 `6c42388d…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187320728.

**Undocumented**

### `GIT_SSL_KEY`

Source: `chunk-y8am1j53.js` · offset 187320743 · sha256 `01ad4f7e…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-y8am1j53.js` offset 187320743.

**Undocumented**

### `GOOGLE_CLOUD_QUOTA_PROJECT`

Source: `chunk-sajhfs1y.js` · offset 194029094 · sha256 `006ef59e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-sajhfs1y.js` offset 194029094.

**Undocumented**

### `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`

Source: `chunk-sajhfs1y.js` · offset 194019716 · sha256 `d60e4754…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-sajhfs1y.js` offset 194019716.

**Undocumented**

### `GRACEFUL_FS_PLATFORM`

Source: `chunk-fa5ag86j.js` · offset 177843255 · sha256 `1c96518e…`

Read as: string (raw value; further parsing not traced). Default (from code): `darwin`.

Undocumented; read at `chunk-fa5ag86j.js` offset 177843255.

**Undocumented**

### `GRPC_EXPERIMENTAL_ENABLE_OUTLIER_DETECTION`

Source: `chunk-as377hwh.js` · offset 211556718 · sha256 `2a9c164a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211556718.

**Undocumented**

### `GRPC_NODE_TRACE`

Source: `chunk-as377hwh.js` · offset 211201915 · sha256 `bd88e67e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211201915.

**Undocumented**

### `GRPC_NODE_USE_ALTERNATIVE_RESOLVER`

Source: `chunk-as377hwh.js` · offset 211401597 · sha256 `213d12c1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211401597.

**Undocumented**

### `GRPC_NODE_VERBOSITY`

Source: `chunk-as377hwh.js` · offset 211201254 · sha256 `90d938ec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211201254.

**Undocumented**

### `grpc_proxy`

Source: `chunk-as377hwh.js` · offset 211408185 · sha256 `984ce2dd…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-as377hwh.js` offset 211408185.

**Undocumented**

### `GRPC_SSL_CIPHER_SUITES`

Source: `chunk-as377hwh.js` · offset 211206848 · sha256 `6737f6e2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211206848.

**Undocumented**

### `GRPC_TRACE`

Source: `chunk-as377hwh.js` · offset 211201967 · sha256 `c891fd36…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211201967.

**Undocumented**

### `GRPC_VERBOSITY`

Source: `chunk-as377hwh.js` · offset 211201310 · sha256 `03141409…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211201310.

**Undocumented**

### `K_CONFIGURATION`

Source: `chunk-sajhfs1y.js` · offset 193971312 · sha256 `8915965f…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-sajhfs1y.js` offset 193971312.

**Undocumented**

### `LRU_CACHE_IGNORE_AC_WARNING`

Source: `chunk-z6m0x57n.js` · offset 175828930 · sha256 `08e28927…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-z6m0x57n.js` offset 175828930.

**Undocumented**

### `METADATA_SERVER_DETECTION`

Source: `chunk-sajhfs1y.js` · offset 193939926 · sha256 `567b2c13…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-sajhfs1y.js` offset 193939926.

**Undocumented**

### `MSAL_FORCE_REGION`

Source: `chunk-cm8fpatp.js` · offset 197739030 · sha256 `95f9a19b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197739030.

**Undocumented**

### `no_grpc_proxy`

Source: `chunk-as377hwh.js` · offset 211408984 · sha256 `3e43f776…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211408984.

**Undocumented**

### `OSTYPE`

Source: `chunk-pez7h27x.js` · offset 176478876 · sha256 `e7feb6ad…` · 2 read sites

Read as: enum (compared against fixed values). Values: `cygwin`, `msys`.

Undocumented; read at `chunk-pez7h27x.js` offset 176478876.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CERTIFICATE`

Source: `chunk-as377hwh.js` · offset 211586842 · sha256 `3f3cfacf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211586842.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`

Source: `chunk-as377hwh.js` · offset 211586536 · sha256 `32e387c2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211586536.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_KEY`

Source: `chunk-as377hwh.js` · offset 211586694 · sha256 `fc5f98a1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211586694.

**Undocumented**

### `OTEL_EXPORTER_OTLP_INSECURE`

Source: `chunk-as377hwh.js` · offset 211586237 · sha256 `8ce73eb5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-as377hwh.js` offset 211586237.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_HOST`

Source: `chunk-8refsmbe.js` · offset 211597556 · sha256 `61eafb33…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-8refsmbe.js` offset 211597556.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_PORT`

Source: `chunk-8refsmbe.js` · offset 211597648 · sha256 `ccf61175…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-8refsmbe.js` offset 211597648.

**Undocumented**

### `REGION_NAME`

Source: `chunk-cm8fpatp.js` · offset 197739177 · sha256 `a5881060…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-cm8fpatp.js` offset 197739177.

**Undocumented**

### `TEST_GRACEFUL_FS_GLOBAL_PATCH`

Source: `chunk-fa5ag86j.js` · offset 177850149 · sha256 `d12bfc7e…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-fa5ag86j.js` offset 177850149.

**Undocumented**
