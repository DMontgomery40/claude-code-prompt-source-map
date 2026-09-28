# Docs search (⌘K), 2026-09-28

The reference pages of both sections, and the landing page, have one search palette. It is separate
from Trace's palette (`site/trace/palette.js`) but looks the same.

## Index: built from the rendered pages

- `site/src/shared/search-index.mjs` `buildSearchIndex` is called from both sections' `renderSite`
  (`searchIndex(rendered, routes)` in `site/src/<product>/render.mjs`). It writes
  `dist/<section>/search-index.json` beside the pages.
- Its input is each document's standalone page: the content after `routes.localize`, and the
  `anchorOutline` headings with `routes.localId` ids. Every id in the index is an id the standalone page
  has. A heading that opens a `<section id>` (Codex/ChatGPT focus and module blocks) takes the
  section's id, as the contents sidebar does.
- It indexes three kinds of item:
  - pages: title, catalog summary or first paragraph, category, record count;
  - headings h2–h5, with a breadcrumb and an excerpt of up to 130 characters. h2 is included because
    the Codex/ChatGPT instruction pages are built on it;
  - records from `outputs/*.json`.
- A record's source file is set in the catalog by `recordSpec`: `records` if set, else
  `filters.records`, else a JSON `data` file. `records: false` turns it off.
- A record is tied to its entry heading by the key the tag filters use (`filters.mjs` `entryKey`:
  group heading plus entry heading), in document order. A repeated title therefore links to its own
  `-2`/`-3` id. Trace's `headingIds` would send it to the first heading with that text.
  - A title is also matched as its markdown renders.
  - If that fails, a record is matched by its title alone.
  - The build logs every record that found no heading. At present that is 51 in Claude Code's
    other-model-text.
- A record item carries:
  - kind;
  - documented or undocumented;
  - the `when` line, up to 150 characters;
  - a text excerpt, up to 130 characters;
  - provenance: file, offset or line, and version. File names are stored once in a table, and the
    most common version is stored once as `ver`;
  - tags.
- The Codex/ChatGPT display-path rewrite is applied to the records the index reads.
- Sizes on 2026-09-28:
  - Claude Code: 1.40 MB, 306 KB gzipped;
  - Codex/ChatGPT: 645 KB, 113 KB gzipped.

## Client

- `site/build.mjs` copies these files to `dist/search/`:
  - `palette.js`, the UI;
  - `query.js`, the query language, ranker and `itemHref`. It is pure and tested in Node;
  - `palette.css`;
  - `site.mjs`, copied as `site.js`, so product paths and labels have one source.
- Pages load `palette.js` by a relative path. The palette resolves the indexes and every link against
  `import.meta.url`.
- The index is fetched on first open. It is prefetched when the user hovers over or focuses the pill,
  or when the browser is idle on a section page.
- `tools/check-links.mjs` resolves every index entry through `itemHref`. It fails if the page file or
  the id is missing.

## Query language

- Words are AND'ed.
- `"exact phrase"`.
- `-exclude`.
- `kind:env`, or a shorthand such as `env:`, `setting:`, `cli:`, `hook:`, `tool:`, `slash:`,
  `prompt:`, `reminder:`, `agent:`, `skill:`, `wins:`, `page:` or `section:`.
- `in:codex` and `in:claude-code`.
- `is:documented` and `is:undocumented`.

## Ranking

- Order of match strength: exact title, then title prefix, then a word start, then inside a word.
- A word start includes SNAKE_CASE, camelCase, kebab-case and dotted keys.
- Initials, squashed matches and fuzzy letters apply only to identifier titles, never to prose.
- A match in the title outranks a match in the context: breadcrumb, excerpt, when, tags, file.
- Pages, records and What wins get a small boost.
- Ties go to the shorter title.

## Landing on a result

When the user opens a result on another page, the palette stores `{ path, hash, terms }` in
sessionStorage. The destination page's palette then reveals the target:

- clears a `?tags=` filter that hides it;
- opens closed `<details>`;
- removes the home intro;
- jumps below the fixed corner bar;
- outlines the section;
- highlights the query's words with the CSS Custom Highlight API.

A result on the same page gets the same reveal without reloading. Ordinary hash links behave as they
did before.
