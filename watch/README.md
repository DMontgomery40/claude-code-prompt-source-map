# prompt-watch

> **Moved into harness-source-map (2026-09-27).** The watcher now lives in `watch/` of the one repo, and its
> targets point at `claude-code/` and `codex/`. It is still **disabled**. Its publish stage (tests, build, leak check,
> deploy, push) predates the one-site layout: it still expects a `site/` inside each product folder and one
> deploy per product. Rework it for the single site (`npm run check`, one `wrangler deploy` from `site/`) before
> re-enabling. The launchd plist is now a template (`com.dtmont.prompt-watch.plist.template`, fill in NODE,
> REPO and HOME).


**Disabled 2026-09-26 16:11 MDT at David's request: he updates the sites manually now.**
The LaunchAgent is booted out and disabled; the plist is kept. Do not re-enable it without
his say-so. To re-enable: `launchctl enable gui/$(id -u)/com.dtmont.prompt-watch && launchctl
bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.dtmont.prompt-watch.plist`.

Keeps gpt6aeon.dtmont.com (Codex desktop / GPT-6 catalog) and ccprompts.dtmont.com
(Claude Code) current. `com.dtmont.prompt-watch` runs `watch.mjs` hourly at :07.

- Cadence: Codex hourly until the end of 2026-10-06 (America/Denver), then daily; Claude
  Code daily against the npm `latest` dist-tag.
- Stage 1: a cheap fingerprint per target; unchanged means exit.
- Stage 2: the repo's own refresh (extract/codex/refresh.mjs, extract/refresh.mjs).
- Stage 3: a headless `claude -p` agent only when an extractor breaks or records need review.
  It cannot run git, deploy, or fetch URLs, and has a spending cap.
- Stage 4: tests, build and leak check, then Cloudflare deploy, a check that the live site
  serves the build, a commit, and a push within the shared GitHub budget (3 per repo per 3 h).

Commands: `node watch.mjs`, `node watch.mjs --dry-run --force codex|cc`.
Logs: logs/watch.log. State: state.json.
