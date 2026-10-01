# Watcher

Keeps both sections of harness.dtmont.com current: `/codex/` (ChatGPT desktop app, its bundled
Codex CLI, the GPT-6 catalog) and `/claude-code/` (the Claude Code npm build). It runs hourly from a
LaunchAgent and publishes only when an upstream source changed and the repo's gate passes.

**State: not installed.** It was switched off on 2026-09-26 at David's request, then moved into this
repo. The publish step has been reworked for the one site (below). Install it only when David says
to turn it on:

```sh
watch/install-launchd.sh --print    # show the plist it would write (changes nothing)
watch/install-launchd.sh            # write ~/Library/LaunchAgents/com.dtmont.prompt-watch.plist, load it
watch/install-launchd.sh --remove   # stop it and remove the plist
```

The installer renders `com.dtmont.prompt-watch.plist.template` for this checkout (the node on PATH,
this repo, $HOME) and replaces the older plist, which ran the pre-merge `~/prompt-watch` repo; the
old file is kept as `.bak-<time>`.

## A cycle

1. **Pause check.** If anything under the site's inputs (`site/`, `codex/`, `claude-code/`, `tools/`,
   `package*.json`) is uncommitted, the watcher does nothing this hour and notifies once: that work
   would otherwise be deployed without being committed. Other dirty paths (`video/`, docs) don't
   matter.
2. **Fingerprint** each due target cheaply (Codex/ChatGPT: app build, CLI hash, catalog hash;
   Claude Code: npm dist-tags). Unchanged means nothing more for that target.
3. **Refresh** a changed target with the product's own scripts (`codex/extract/codex/refresh.mjs`
   and the generators after it; `claude-code/extract/refresh.mjs`). A broken extractor starts a
   headless `claude -p` repair agent with a spending cap; it can't run git, deploy or fetch.
   A target whose refresh changed nothing (or only byte-level provenance such as fetch times) has
   its files put back.
4. **Gate, once:** `npm run check` at the repo root (build, all tests, link check, leak check), plus
   the local-identity scan and the Jev narrative lint for each product being published.
5. **Publish, once:** one `wrangler deploy` from `site/`, then a check that
   `https://harness.dtmont.com/<section>/` serves the page that was built. Each target's commit holds
   only the files that cycle produced inside its product folder (clean before, changed after); other
   agents' dirty or staged files are never committed. Push to `main` within the shared GitHub budget
   (3 pushes per 3 hours); commits over the budget go out in a later cycle.

A failed refresh or gate restores the files the cycle produced and marks that upstream version as
failed, so the watcher waits for a newer one instead of retrying every hour. A Jev outage is not a
failure of that version. That covers a refresh step that exits 75 and a narrative lint that gets no
answer. The cycle's files are restored, nothing is published, and the same version is retried next
cycle, even for a daily target, since an outage that hits before any agent ran costs no agent work
to retry. The exception is a refresh that already ran a repair or review agent. Retrying it would redo that agent work, so it
waits for the target's next scheduled check instead. A notification goes out when the outage starts
and again once a day while it lasts, not every hour. A missing or revoked TypeSafe key also reads as
an outage, so that daily reminder is how it shows up. Each target records its outage as `jevOutage`
in its entry in `watch/state.json`. That target's next successful refresh or publish clears it, and
so does any failure that is not a Jev outage.

Cadence: Codex/ChatGPT hourly through 2026-10-06 (Dev Day plus a week), then daily; Claude Code
daily, against the newer of the npm `latest` and `next` dist-tags, never going back to an older build
than the records describe.

## Running it by hand

```sh
node watch/watch.mjs                          # one normal cycle
node watch/watch.mjs --dry-run --force codex  # refresh + gate for Codex/ChatGPT; no deploy, commit or push
node watch/watch.mjs --dry-run --force cc     # the same for Claude Code
```

A dry run restores every file it produced, so the checkout is left as it was. With `--force` the
gate runs even when nothing changed.

Local, gitignored: `watch/logs/watch.log` (every run), `watch/logs/agent-*.log` (repair agents),
`watch/state.json` (fingerprints, failed versions, an open Jev outage), `watch/.lock`.
`narrative-lint-cache.json` holds Jev's cached lint verdicts.
