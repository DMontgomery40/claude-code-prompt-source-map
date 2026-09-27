# docs

- `specs/` and `plans/` are dated records. Their paths predate the 2026-09-27 consolidation into this repo:

| Path in an older doc | Now |
|---|---|
| `~/claude-code-prompt-source-map/{extract,outputs,work}` | `claude-code/{extract,outputs,work}` |
| `~/gpt6-prompt-source-map/{extract,outputs,work}` | `codex/{extract,outputs,work}` |
| `…/site/src/*.mjs` (either repo) | `site/src/claude-code/`, `site/src/codex/`, `site/src/shared/` |
| `…/site/trace` (kept byte-identical in both repos) | `site/trace` (one copy) |
| `~/prompt-watch` | `watch/` |
| `~/trace-demo-video`, `~/trace-explainer-video` | `video/teaser`, `video/explainer`; media in `private/video/` |
| `ccprompts.dtmont.com`, `gpt6aeon.dtmont.com` | `harness.dtmont.com/claude-code/`, `harness.dtmont.com/codex/` (the old hosts 301 there) |

- `harness-layer.md` covers the new Trace view: its design and status.
- The grains design (`*-trace-grains-playback*`) describes a feature that is being removed (decision 2026-09-27).
