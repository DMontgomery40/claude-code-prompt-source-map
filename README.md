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
TYPESAFE_API_KEY=… node extract/classify.mjs          # audience verdicts for the inventory
node extract/inventory.mjs
cd site && npm ci && npm test && npm run build
```

The site is deployed to Cloudflare with `npx wrangler deploy` from `site/`.
