# GPT-6 Prompt Source Map

Source for [gpt6aeon.dtmont.com](https://gpt6aeon.dtmont.com): the instructions, helper prompts, voice prompts, and tool surfaces that ship inside OpenAI's Codex desktop app and GPT-6 model records, captured on September 24, 2026 from ChatGPT desktop 26.917.71314.

If you build on or inside this harness, these texts decide what the model is told before your prompt arrives, which tools it believes it has, and when each piece is injected. Reading them is the fastest way to stop being surprised by it.

## What is here

- `outputs/` holds the published evidence, one file per document: the Astra, Sol, and Luna base instructions, the conditional instruction modules, persistent-mode instructions, bundled voice prompts, desktop helper prompts with offsets and hashes, the provenance inventory, host tool manifests, and the extraction reports.
- `site/` builds the static reference from those files.

ChatGPT Work's service-side system and developer instructions were not present in the authenticated model catalog, the browser assets, or the observed client requests, so they are not in this reference.

## Links

Every document has its own page, and every heading has an anchor:

```
https://gpt6aeon.dtmont.com/bundled-codex-voice-prompts/#voice-coordinator-developer-prompt
```

The root page is the complete reference on one page. Page paths come from document titles; add `slug` to an entry in `site/src/catalog.mjs` to keep a path fixed when a title changes.

## Build

```
cd site
npm ci
npm test
npm run build
```

The site is written to `site/dist/` with relative links, so any static host can serve it. The live site is deployed to Cloudflare with `npx wrangler deploy` from `site/`.
