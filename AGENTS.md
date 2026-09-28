# Agent guide: harness-source-map

Everything about the prompt source maps and Trace lives in this one repo. Before you add a folder, look here.

## What this project is for
It shows the internals of AI coding-agent harnesses (Claude Code and Codex/ChatGPT): what text the
harness puts in front of the model, where each piece comes from in the shipped binary or app, and what
setting, flag, hook or event causes it. That includes the unnamed pieces nobody has documented. It
started with digging GPT-6 persistent-mode instructions out of the binary so security researchers could
prepare.

It is **not** about token cost or the fact that context is re-read every turn. Don't frame work that way.

## Where things are
- **Claude Code:** `claude-code/extract` (scripts), `claude-code/outputs` (published records),
  `claude-code/work` (extracted binary; gitignored).
- **Codex/ChatGPT:** `codex/extract/codex`, `codex/extract/codex-config`, `codex/outputs`, `codex/work`
  (gitignored).
- **The one site:** `site/`.
  - Domain, repo and sections are set in `site/src/shared/site.mjs`; change a URL there, nowhere else.
  - Each section's generator is in `site/src/<product>/`.
  - Trace is `site/trace/`. It is shared by both products and picks the reference index by the session's
    product.
- **Redirects** for the retired hosts: `site/redirects/`.
- **Watcher** (disabled): `watch/`.
- **Video pipelines:** `video/teaser`, `video/explainer`. Their media is in `private/video/`.
- **Docs:** `docs/specs`, `docs/plans`, `docs/harness-layer.md`.
- **Private (gitignored, local only):** `private/sessions` (frozen Claude Code and Codex/ChatGPT
  sessions), `private/video`, `private/research`. Never copy anything from `private/` into a tracked
  file. `npm run check` runs `tools/leak-check.mjs`, which fails on this machine's paths, user name,
  secrets and private session ids.

## Rules
- Run the gate before calling work done: `npm run check` (build, all tests, link check, leak check).
- Trace always opens in the 3D landscape (2D only without WebGL or with reduced motion). The harness
  layer and any new layer are reached from it and never open first, whether by default, URL or saved
  view (David, 2026-09-27).
- Trace is one layer-rich tool. New views are **added** as modes. Never remove the existing landscape,
  2D view, sidebar panels, lenses, search, reader, custody ladder or playback. Grains may go (decided
  2026-09-27).
- Name the OpenAI product "Codex/ChatGPT", never "Codex" alone. Component names ("Codex CLI") and quoted
  prompt text stay as they are.
- Other agents may work here at the same time. Commit your own paths, keep checks focused, and leave
  others' files alone.
