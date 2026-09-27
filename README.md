# Harness Source Map

**Live site: [harness.dtmont.com](https://harness.dtmont.com)** · [Claude Code](https://harness.dtmont.com/claude-code/) ·
[Codex/ChatGPT](https://harness.dtmont.com/codex/) · [Trace](https://harness.dtmont.com/trace/)

[![Harness Source Map: what the agent harness puts in front of the model](site/assets/shared/social-card.png)](https://harness.dtmont.com)

What Claude Code and Codex/ChatGPT put in front of the model: every prompt, reminder, tool description,
setting, flag and environment variable, read from the shipped binaries and apps, each record with its
provenance. Plus **Trace**, which opens your own session log in the browser and shows how those pieces
actually arrive. One repo, one site: <https://harness.dtmont.com>.

- `/` asks which harness you want.
- `/claude-code/` is the Claude Code reference, including What wins.
- `/codex/` is the Codex/ChatGPT reference.
- `/trace/` is Trace, which reads sessions from both products.

The two older sites, `ccprompts.dtmont.com` and `gpt6aeon.dtmont.com`, redirect here path for path.

## Layout

| Path | What it is |
|---|---|
| `claude-code/` | Claude Code extraction (`extract/`), its published records (`outputs/`) and the gitignored `work/` (the extracted binary). |
| `codex/` | Codex/ChatGPT extraction (`extract/codex`, `extract/codex-config`), records (`outputs/`) and the gitignored `work/`. |
| `site/` | The one site. `src/shared/` holds the site config (`site.mjs`: domain, repo, sections), the landing page and the Trace build. `src/claude-code/` and `src/codex/` are each section's generator. `trace/` is the viewer. `redirects/` holds the retired-host Worker. `test/` holds the tests. |
| `tools/` | `trace-local.mjs` (open local sessions by id), `check-links.mjs` and `leak-check.mjs`. |
| `watch/` | The release watcher. It is disabled; see its README before re-enabling. |
| `video/` | The teaser and explainer video pipelines, as code only. |
| `docs/` | Specs, plans and design notes. |
| `private/` | Gitignored and never published: frozen sessions, video media, research. |

## Commands

```
npm ci && (cd site && npm ci)
npm run build        # site/dist: landing + /claude-code/ + /codex/ + /trace/
npm test             # extraction tests (both products) + site, Trace and redirect tests + tools
npm run check        # build + tests + link check + leak check: the gate before any deploy or push
```

Re-extract a product from a new release:
- **Claude Code:** see `claude-code/README.md`. Runs `python3 claude-code/extract/bun-extract.py <claude.exe>`, then `node claude-code/extract/<area>.mjs`.
- **Codex/ChatGPT:** see `codex/README.md`. Runs `node codex/extract/codex/refresh.mjs` and `bash codex/extract/codex-config/run_all.sh`.

## Deploy (by hand)

```
cd site && npx wrangler deploy                                    # the one site, harness.dtmont.com
cd site/redirects && npx wrangler deploy -c wrangler.ccprompts.jsonc   # ccprompts -> /claude-code/
cd site/redirects && npx wrangler deploy -c wrangler.gpt6aeon.jsonc    # gpt6aeon  -> /codex/
```

The redirect Workers reuse the retired sites' Worker names, which already own those custom domains.
Run `npm run check` first.
