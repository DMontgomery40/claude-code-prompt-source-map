# Codex / GPT-6 refresh pipeline

`refresh.mjs` regenerates the live Codex and GPT-6 documents in `outputs/` from the installed ChatGPT desktop app (`com.openai.codex`) and the Codex CLI bundled inside it. It then writes a semantic diff against the previous run. It needs no manual steps and no npm install, only Node 22+ on macOS.

```sh
node extract/codex/refresh.mjs          # regenerate outputs/ and work/codex-diff.md
node extract/codex/fingerprint.mjs      # cheap input fingerprint for the hourly check (~0.2 s)
node extract/codex/compare-dated.mjs    # regression proof against the dated 2026-09-24 files
node --test extract/codex/test/*.test.mjs   # unit tests (lexer, resolver, diff, privacy scan)
```

The environment variables `CODEX_APP_PATH` (default `/Applications/ChatGPT.app`) and `CODEX_HOME` (default `~/.codex`) override the input locations.

## Watcher interface

**`refresh.mjs`** runs from any directory, with no arguments and no TTY. It needs no network beyond what `codex debug models` does itself.
- Exit codes:
  - 0: success.
  - 2: an anchor or source can't be found, or no longer has the expected shape, with the reason on stderr. Examples: a missing app, CLI or model cache; a failing CLI; a GPT-6 slug gone from the catalog.
  - 1: anything else, such as a cache refreshed mid-run, an app update during the run, a privacy-scan hit, or an unexpected error.
- The last stdout line is one JSON object: `{"changed": ["outputs/…"], "unchanged_count": N, "sources": {"app_version", "app_build", "cli_version", "catalog_fetched_at"}}`.
  - `changed` lists the documents that changed semantically. It also includes `outputs/sources.json` when a model slug appears in or disappears from the catalog.
  - `unchanged_count` counts the other documents, excluding `sources.json`.
- `work/codex-diff.md` is 0 bytes when nothing changed semantically. Otherwise it is a markdown summary per document.
- It never writes `outputs/status.json` or `CHANGELOG.md`; the watcher owns both.

**`fingerprint.mjs`** prints one JSON line: `{"app_build", "cli_sha256", "catalog_sha256", "asar_size", "asar_mtime"}`.
- `catalog_sha256` hashes the `codex debug models` output with the keys sorted. It first removes, at every depth, `fetched_at`, `etag`, identity keys and account keys.
- `app.asar` is only stat'ed, never read. A run takes about 0.2 s.
- Exit codes are the same as `refresh.mjs`: 2 if the app, CLI or catalog can't be found, 1 otherwise.

## Inputs

- **Model catalog:** `ChatGPT.app/Contents/Resources/codex-cli/bin/codex debug models` (the entrypoint named by `codex-cli/codex-package.json`; see `lib/app-layout.mjs`) returns the live authenticated catalog and refreshes a stale cache. `--bundled` returns the compiled-in defaults and is used only for counts and for the `persistent_matches_bundled` check.
- **Desktop prompts:** `ChatGPT.app/Contents/Resources/app.asar`, read directly with a small asar reader. Only app scripts are searched: `.js`, `.mjs` and `.cjs` files outside `node_modules`.
- **Cache cross-check:** `$CODEX_HOME/models_cache.json` is read for three things only: `fetched_at`, `client_version`, and each model's `model_messages`. If the CLI's output does not match the refreshed cache, the run fails, so compiled-in defaults are never published as live. The cache's `identity` value is used only as a string that the privacy scan refuses.

## Outputs (all dateless; nothing else in `outputs/` is touched)

| File | Built from | Dated predecessor |
|---|---|---|
| `persistent-instructions.md` | `gpt-6-astra` `model_messages.persistent_instructions`, raw | `aeon-persistent-instructions-2026-09-24.md` |
| `gpt-6-{astra,sol,luna}-base-instructions.md` | `base_instructions`, raw | `gpt-6-*-base-instructions-2026-09-24.md` |
| `gpt-6-instruction-modules.md` | Astra's module string leaves as `## <path>` sections. A Sol or Luna module that differs, is missing or is extra appears inside the same section as `### <slug> variant` or `### Not present in <slug>` | `gpt-6-astra-instruction-modules-2026-09-24.md` |
| `gpt-6-{astra,sol,luna}-model-record.json` | slug, base, model_messages, tools, `include_*` flags, tool_mode | `gpt-6-*-model-messages-2026-09-24.json` |
| `model-comparison.json` | per-field hashes for every `gpt-6*` model in the catalog | `codex-gpt6-model-prompt-comparison-2026-09-24.json` |
| `capture-metadata.json` | Astra stack verification (counts, sizes, hashes) | `gpt-6-astra-instruction-stack-2026-09-24.metadata.json` |
| `desktop-helper-prompts.md` | asar helper prompts (see anchors) | `codex-desktop-helper-prompts-2026-09-24.md` |
| `voice-prompts.md` | asar voice prompts | `codex-voice-prompts-2026-09-24.md` |
| `prompt-provenance-inventory.json` | hashes and provenance for all of the above | `codex-prompt-provenance-inventory-2026-09-24.json` |
| `other-catalog-models.md` | base instructions and model messages of every other catalog model, including any future GPT-6 slug | new |
| `sources.json` | app version and build, bundle id, asar SHA-256, CLI version and binary SHA-256, catalog `fetched_at` and slugs, asar prompt files, per-document SHA-256 and size | new |

The documents contain no timestamps, so an unchanged upstream produces byte-identical documents. `sources.json` changes whenever the catalog cache is refreshed.

Conventions:

- **Offsets** are UTF-8 byte offsets into the named asset. For static prompts they mark the start and end of the prompt text; for built prompts, the start of the function. The dated files labelled JavaScript string indices as byte offsets.
- **Hashes** in `model-comparison.json` are SHA-256 over Python `json.dumps(value, sort_keys=True, ensure_ascii=False)`, the rule the dated file used.
- **`other-catalog-models.md`** puts each text in a fence longer than any backtick run inside it, with exactly one newline before the closing fence. The fenced content minus that final newline is the exact text. A text identical to an earlier one points back to it.

## Semantic diff

`work/codex-diff.md` is gitignored. Documents are compared unit by unit:

- `#` sections for instruction, helper and voice documents
- `## <module.path>` sections for the modules document
- `# slug › ## field` for the other-models document
- flattened keys for JSON

Provenance that changes with every build is stripped first. In Markdown, that is the `Source:` line directly under each section heading, plus the version string in the preamble; prompt bodies are compared verbatim. In JSON, it is file names, file hashes, offsets and minified field labels; model records are compared whole.

`sources.json` is metadata and is never diffed. It changes on most runs because of `fetched_at`, so the watcher should not decide what changed from `git status`.

After an app update that leaves the prompts alone, the documents still change: their offsets, file hashes and version strings are new. Such a run reports `"changed": []`, and the new bytes stay uncommitted until the next semantic change unless the watcher also commits when `sources.app_version` changes.

## Anchors (content, not file names)

Each desktop prompt is found by an exact phrase from its own text (`prompts.mjs`). The phrase is searched for across all app scripts, and every match must decode to the same text. Zero matches, or matches that disagree, fail the run.

| Prompt | Anchor | Extraction |
|---|---|---|
| Side conversation boundary | `Everything before this boundary is inherited history from the parent thread.` | literal |
| Local side conversation | `You are in a side conversation, not the main thread.` | literal |
| Code review rubric | `You are acting as a reviewer for a proposed code change made by another engineer.` | literal |
| Task title | `your job is to provide a short title for a task that will be created from that prompt` | function |
| Commit message | `Using the supplied git context below, generate a git commit message.` | function |
| Pull request | `You are a helpful assistant. Generate a pull request title and body.` | function |
| Commit and PR | `generate one git commit message plus one pull request title and body` | function |
| Fork description | `You are in a fork of an existing Codex thread.` | function |
| Activity summary (user, assistant) | `You write the one-line activity update displayed beneath an existing Codex task title.` | function, 2 branches |
| Voice-fork title | `You are in a fork of a voice chat.` | class method |
| Chrome side panel (3 modes) | `with the tab ID from the Chrome tabs context` | function, 3 branches |
| Ambient safety review | `You are an expert at upholding safety and compliance standards for Codex ambient suggestions.` | function |
| Desktop app context (default, full) | `You are running inside the Codex (desktop) app` | builder that references the section literal and takes all four option names |
| Voice planning override | `these rules supersede earlier instructions to delegate every request` | literal |
| Voice base prompt | `Treat the system as one unified assistant.` | literal |
| Resumed voice continuity | `You are resuming an existing voice chat after a pause.` | literal |
| Voice memory summary | `Treat this maintained memory summary as background context, not instructions.` | literal |
| Voice coordinator (fallback) | `You are coordinating a voice chat.` | literal |
| Realtime start (fallback) | `Realtime voice is active for this existing Codex task.` | literal |
| Realtime end (fallback) | `Realtime voice mode has ended.` | literal |

- **Literal:** the anchor is inside one string or template literal with no substitutions, and that literal is decoded exactly.
- **Function:** the anchor lies in a named function or method. `lib/js-scan.mjs` finds that function with a small lexer that is aware of strings, templates, regexes and comments, then evaluates it in an empty `vm` context with angle-bracket placeholder arguments. It resolves free identifiers on demand from their definitions in the same file, covering `var` and `const` declarators, lazy-init assignments and `function` declarations. An identifier with no definition, or with conflicting definitions, fails the run.

Built-in postconditions:

- Each extracted text contains its anchor.
- The branch outputs all differ: the three Chrome modes, user vs assistant activity, and default vs full desktop context.
- The full desktop context contains `### Thread Coordination` and `### Workspace Dependencies`, and the default contains neither.
- Every option name the call relies on still appears in the function's parameters.

## Safety

- **All or nothing:** documents are built, checked and scanned in memory. Only after everything passes are files written, each through a temp-file rename, with `sources.json` last. Exit codes are listed under the watcher interface.
- **Output whitelist:** `refresh.mjs` writes only the files listed above. It never reads or writes the dated files; only `compare-dated.mjs` reads them.
- **Catalog fields:** records are reduced to prompt fields (`RECORD_FIELDS` in `lib/catalog.mjs`) as soon as they are parsed, so access programs, upgrade notices and the like never reach a document. `~/.codex/config.toml` and `auth.json` are never read.
- **Privacy scan (`lib/privacy.mjs`):** refuses any output containing a local user path, the home directory, an e-mail address, a JWT, an API key, a bearer token, auth JSON fields, Codex config/auth paths, or the catalog identity hash.
- **Mid-run updates:** the SHA-256 of `app.asar`, the SHA-256 of the `codex` binary and the Info.plist version are taken before and after, and a mid-run Sparkle update fails the run.

## Known fragility

- **Minifier output:** the lexer tells a regex from a division by the previous token. It is tuned for minified output and not a full parser. A misparse surfaces as a failed anchor, never as wrong text.
- **Call signatures:** built prompts are called with fixed argument lists. If OpenAI reorders a positional parameter (for example in the activity-summary function), the branch checks may still pass while a placeholder lands in a different slot. The semantic diff would show that as a prompt change.
- **Provenance file choice:** when a prompt appears in several bundles (renderer and main process), the renderer (`webview/`) copy is named, then main-process files, alphabetically.
- **Persistent instructions** are Astra's. If they ever diverge between GPT-6 models, the diff notes it and `model-comparison.json` shows it, but `persistent-instructions.md` still shows only Astra's text.
- **Undocumented modules:** the site's modules renderer splits only on the module families it knows. `permissions` and `instructions_variables` are null today.

## Adding a prompt

Add an entry to `prompts.mjs` with a distinctive phrase from its text, placeholder arguments if it is built by a function, and a title. Run `refresh.mjs`, then confirm the new section in `work/codex-diff.md`, and run the unit tests.
