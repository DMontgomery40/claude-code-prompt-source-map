# Claude Code Prompt Source Map

Source for [ccprompts.dtmont.com](https://ccprompts.dtmont.com): what Claude Code 2.1.280 sends the model, and every setting, flag, hook, and environment variable that changes it. Everything is read from the shipped binary (`claude.exe` for macOS on Apple silicon, SHA-256 `387a5c5dcdbb815085edf0baf79591f9d8894efe922bceaf3d75b1b08055229d`), and every record carries its byte offset and hash.

If you build on Claude Code, or debug it, these are the texts and switches that decide what the model sees, when reminders get injected, which tools exist, and how prompt caching behaves.

## What is here

- `outputs/` holds one Markdown page and one JSON record file per area: the main system prompt and its conditions, system reminders, tools, built-in agents, background and utility prompts, bundled skills, other model-facing text, environment variables, settings, hooks, CLI commands, and slash commands. `inventory.json` gives every prose literal in the binary a verdict, so omissions are detectable.
- `extract/` holds the scripts that produced them from an installed copy of Claude Code.
- `site/` builds the static site.

The extracted binary contents are not in this repository. Only the prompt and reference texts, their provenance, and the scripts are.

## Links

Every page has its own path, and every heading has an anchor:

```
https://ccprompts.dtmont.com/env-vars/
https://ccprompts.dtmont.com/system-prompt/
```

Each page's records are also published as JSON under `/data/`.

## Reproduce it

```
npm ci
python3 extract/bun-extract.py /path/to/claude.exe   # writes work/ (gitignored)
node extract/<area>.mjs
node extract/classify.mjs                             # audience verdicts for the inventory (Jev; key from the env or ~/.env)
node extract/inventory.mjs
cd site && npm ci && npm test && npm run build
```

The site is deployed to Cloudflare with `npx wrangler deploy` from `site/`.

## Jev

The refresh (`extract/refresh.mjs`) asks TypeSafe's Jev about each new build through `codex/extract/codex/lib/jev-provider.mjs`: who each prose string is written for, topic tags, which functions settle a setting, which new string replaced an edited prompt, and whether an edited prompt changes model behaviour. That last step (`extract/behavior-flags.mjs`, `tools/behavior-flags/core.mjs`) asks if the edit grants autonomy, loosens a restriction, adds a capability, changes data handling or adds persistence, and writes a "Behaviour changes for review" section into the update report; the watcher notifies when an edit is likely. Its thresholds are uncalibrated review signals for a person to check, not findings. Verdicts are cached under `work/` by the model version that produced them, so a build only pays for what changed. When Jev is unavailable a step exits 75 and the watcher retries the release instead of marking it failed.
