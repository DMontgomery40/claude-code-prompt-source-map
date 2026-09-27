# What wins: decision ladders for every knob

Status: design, awaiting review. Scope: ccprompts.dtmont.com (Claude Code) first, then
gpt6aeon.dtmont.com (Codex). This file lives in the private watcher repo on purpose: the two
site repos are public and the watcher pushes their `main` automatically.

## 1. Goal

Readers arrive with "I set X and it did nothing" or "why did this request get Y". Today both
sites answer "what is X" (a record per env var, setting, config key and flag). This design adds
"what wins": for every value the software decides, the sources it consults, in the order it
consults them, how they combine, and which one takes effect for a given setup. Every ladder says
which parts were tested against the real binary and which were read from code.

The spike on 2026-09-25 proved the idea on one decision (Claude Code prompt-cache TTL): the traced
ladder matched 11 of 11 real request captures, including a silent fall-through on an invalid
value, a scoped variable that does not reach `claude -p`, and `FORCE_PROMPT_CACHING_5M=0` counting
as off. The spike's scripts are in `claude-code-prompt-source-map/work/ladders/` (gitignored,
throwaway).

## 2. The coverage promise ("every single thing")

Every knob record on either site feeds at least one ladder or carries an explicit reason it does
not. Knob records are env vars read by the product, settings.json keys, config.toml keys,
requirements.toml keys, and CLI flags. Remote flags are not records; they appear as rungs.

- Allowed reasons for no ladder: `third-party` (read only by a bundled library), `os-shell` (the
  platform's own variable, read for facts rather than to decide a value), `set-only` (the product
  sets it for children and never reads it), `action` (a CLI flag or command that does something
  rather than set a value, such as `--version`), `pending` (a discovered decision not yet traced).
- A site test enforces the rule, like the existing "every record carries provenance" test. A knob
  with neither a ladder nor a reason fails the build.
- `pending` is shown on the page as "not traced yet" and counted with a `{{count:…}}` token, so
  the gap is visible and shrinks release by release.

## 3. Ladder model

One JSON record per decision, in `outputs/decisions.json` (same record contract as every other
area: id, title, group, kind `decision`, provenance with offsets and hashes, `needs_review`).

```text
decision
  id, title, question            "Prompt cache TTL" / "How long a cached prefix lives"
  shape                          first-wins | merge | layered
  context[]                      dimensions the outcome depends on: request kind, sign-in,
                                 provider, model family; each with its values
  rungs[]                        highest priority first
    mechanism                    env | settings | cli | frontmatter | managed | remote | default
    knob                         record id on the env/settings/config/cli page (link target)
    applies_when                 condition over context values, from code
    accepts                      values that answer; everything else is `on_invalid`
    on_invalid                   skip (silent fall-through) | error | clamp
    effect                       the value it produces
    verified                     tested | read     (tested = a probe case exercises it)
    provenance[]                 byte ranges of the code that makes this rung true
  bypasses[]                     checked before the ladder (DISABLE_PROMPT_CACHING)
  constraints[]                  vetoes and clamps applied after it (managed availableModels,
                                 requirements.toml allowed values)
  inherits                       id of the layer ladder a settings/config rung expands to
  feeds_from[]                   other decisions whose output is an input here
  probes[]                       test cases: env, settings files, flags, expected observation
```

Shapes, each seen in code:

- **first-wins**: the first rung that answers wins (cache TTL; auth source order).
- **merge**: every layer contributes and the results combine. Claude Code settings arrays are
  concatenated and deduplicated across user, project, local, `--settings` and managed policy, so
  permission `allow`/`deny`/`ask` rules union rather than override (`fallbackModel` is the
  exception: replaced). Codex deep-merges tables key by key across layers.
- **layered**: a settings or config key resolved through the product's layer order (section 4).
  Most keys are nothing more than this, so their ladder is generated, not traced.

Vetoes and clamps are `constraints`, not rungs, because they act on the result: Claude Code's
managed policy overwrites `availableModels`, `enforceAvailableModels` and `modelPicker` after the
merge; Codex `requirements.toml` limits which values any layer may choose.

Nested sources link instead of inlining. Claude Code's settings `env` block, filtered by the
safe-env allowlist, feeds env-var rungs; an env rung therefore links to the "where an env var's
value comes from" ladder rather than repeating it.

Second worked example, to test the schema before it is frozen: Claude Code permission rules
(`merge` shape: union across five sources, then the managed-only switches such as
`allowManagedPermissionRulesOnly` as constraints). It is traced in phase 1 before any other
merge-shaped decision.

## 4. Layer ladders (generated for every key)

Read from code on 2026-09-25:

- **Claude Code settings** (`qi` in the settings loader): user, then project, then local, then
  `--settings` (flag), then managed policy; later sources win. Objects deep-merge. Arrays
  concatenate and deduplicate, except `fallbackModel` (replaced) and `modelPicker` (replaced);
  `extraKnownMarketplaces` and `managedMcpServers` use a keyed merge. Policy then overwrites
  `availableModels`, `enforceAvailableModels` and `modelPicker`.
- **Codex config** (`ConfigLayerSource::precedence`): packaged defaults (-10), MDM (0), system
  (10), enterprise cloud bundle (15), user (20; with a selected profile 21), project `.codex`
  (25), session flags such as `-c` (30), legacy managed file (40), legacy managed MDM (50). Tables
  merge key by key; other values come from the higher layer; special cases (legacy key aliases,
  network domains, shell-environment filters, credential env sources) are traced individually.
  Array handling is confirmed in phase 2 before it is published.

A generator expands each settings/config key into its layered ladder with the merge rule for
its type (scalar, array, table). Where a decision function reads the merged key, its ladder
links to that key's layered ladder via `inherits`.

Env vars and CLI flags get a generated two-rung ladder (the knob, else the default) when
discovery finds no competing source. Otherwise they appear as rungs in a traced decision.

## 5. Discovery and triage

- **Claude Code**: the spike's co-read finder (AST pass over the extracted JS: functions that read
  several env vars, distinctive settings keys, or remote flags) found 421 candidates in 4 s; about
  two thirds of the top 40 are real decisions. Remote-flag reads are told from telemetry events by
  call shape (a default argument versus a payload).
- **Codex**: resolution in Rust is explicit: `.or(...)` / `.unwrap_or` chains over config fields,
  `env::var` sites (93 outside tests), and the requirements checks. The finder is a source scan,
  not a binary scan, because the source is open; provenance still cites the release tag.
- **Triage**: Jev scores each candidate function on "does this choose one value, or combine
  values, from more than one configuration source?" The top of the list goes to tracing; the rest
  is recorded as `pending` with its knobs, so coverage stays honest.

## 6. Tracing

Each decision is traced by an agent into its JSON record: rung order, `applies_when`, `accepts`,
`on_invalid`, effect, bypasses, constraints, the default, and remote flags, with provenance for
every rung, plus proposed probe cases. Agents follow the existing contract (never publish code,
never invent semantics).

- Bounded `Agent` batches of at most 8, each owning its decision files, with a budget of about 25
  tool calls and a stop condition (record validates and its probes pass, or report what blocked).
- A multi-agent Workflow run would be faster for the long tail. It needs the owner's explicit
  opt-in and a cost estimate first; this design does not assume it.

## 7. Verification

The spike's probe runner becomes `extract/probe.mjs`: it reads `probes[]` from each decision and
runs the product against the local recorder with those env vars, settings files and flags.

- **Channel 1, request** (phase 1): request body and headers: cache markers, model, betas,
  effort, thinking, max tokens, context management, tools. About 1 s per case in parallel.
- **Channel 2, scripted responses** (phase 3): the recorder answers with scripted tool calls
  (for example a Bash tool call that prints the environment), which exercises tool-time,
  hook and child-environment decisions.
- A rung is `tested` only if some passing probe distinguishes it from its neighbours; otherwise
  `read`. Each card shows both counts.
- Remote-flag rungs are always `read`. The site states the default in code, never the live value,
  and says the vendor can change it without a release.
- A failing probe marks the decision `needs_review`; the publishing gate refuses to publish while
  any decision fails, exactly like records today.
- Cost control: probes run when the product fingerprint changes, never on no-change checks
  (Codex is checked hourly until 2026-10-06).

## 8. Staying current

Everything rides the existing refresh:

- Rung provenance relocates by content like any record; a changed decision function marks the
  decision `needs_review` and the per-area review agent updates it.
- Probes rerun on every release, so "tested" means tested against the current build.
- Discovery reruns every release; new candidates appear in the release report and as `pending`.
- The coverage test runs in the gate.

## 9. The page

A "What wins" page per site, one card per decision, from the spike's design:

- The result line on top ("This request gets 1 hour, from rung 2"), context switches (request
  kind, sign-in, provider), a bypass strip, then the rungs with set/value controls; the winner is
  highlighted, lower rungs read "overridden" or "not reached", invalid values read "skipped".
- Plain-language rungs (defaults, remote allowlists) are not set in code type.
- The scenario lives in the URL (`/what-wins/#prompt-cache-ttl?set=r2:2h,r5`), so a researcher can
  link the exact setup that surprised them.
- Cards carry the same topic tags as env vars and settings, and the page has the same filter bar.
  Order puts the surprising ones first: decisions with remote rungs, silent fall-through, or vetoes.
- Every env var, setting, config key and flag entry gets a "Feeds: Prompt cache TTL, rung 2 of 7"
  line linking to the card.
- Legibility floor applies (dpr 1 checks, 14 px body, no faint text, no grain).

## 10. Phases

1. **Claude Code**: layer ladders for every settings key; generated two-rung ladders for leaf env
   vars; permission rules traced first (schema check), then the top 25 or so decisions; probe
   runner on channel 1; the page; "Feeds" backlinks; the coverage test with `pending`. Settings-page
   tag filters ship alongside, using the env-var taxonomy where it fits.
2. **Codex**: layer ladder and merge rules confirmed; config and env decisions traced; probes run
   `codex exec` against a local recorder through a custom model provider base URL.
3. **Long tail** for both, and probe channel 2.

## 11. Not in scope

- Live values of remote flags.
- A local "which rung is active on my machine" checker. The decisions JSON makes it easy later.
- Publishing code. Rungs cite offsets and hashes; the page describes behavior in words.

## 12. Risks

- Precedence is easy to get subtly wrong. Mitigation: probes, and `read` shown plainly when a rung
  cannot be probed.
- Agent cost on the long tail. Mitigation: triage, generated ladders for most keys, batches.
- Discovery noise. Mitigation: Jev triage, then an agent confirms before anything is published.
- Probe flakiness (startup timeouts). Mitigation: one retry, then `needs_review` rather than a
  silent pass.
