// Every document also gets its own page at /<slug>/ so a single prompt or config can be
// linked directly. Page links are relative, so the build works from any static host or
// subdirectory without rewrite rules. A catalog entry's optional `slug` pins its path
// so shared links survive a title change.

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const pageIds = new Set(["content", "toc", "intro"]);

export function createRoutes(documents) {
  const slugs = new Map();
  const used = new Set();
  for (const document of documents) {
    const base = document.slug ?? (slugify(document.title) || document.anchor);
    let slug = base;
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;
    used.add(slug);
    slugs.set(document.anchor, slug);
  }

  // On a document's own page its ids drop the redundant document prefix:
  // /bundled-codex-voice-prompts/#voice-coordinator-developer-prompt
  function localId(id, anchor) {
    const prefix = `${anchor}--`;
    if (!id.startsWith(prefix)) return id;
    const short = id.slice(prefix.length);
    return short && !pageIds.has(short) && short !== anchor && short !== `${anchor}-title` ? short : id;
  }

  function pageHref(href, anchor) {
    if (href.startsWith("#")) {
      const id = href.slice(1);
      const target = id.split("--")[0];
      if (!slugs.has(target)) return href;
      if (target === anchor) return `#${localId(id, anchor)}`;
      return id === target ? `../${slugs.get(target)}/` : `../${slugs.get(target)}/#${localId(id, target)}`;
    }
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|\?)/i.test(href)) return href;
    return `../${href.replace(/^\.\//, "")}`;
  }

  return {
    slug: anchor => slugs.get(anchor),
    localId,
    localize(html, anchor) {
      return html
        .replace(/\sid="([^"]+)"/g, (_, id) => ` id="${localId(id, anchor)}"`)
        .replace(/\shref="([^"]*)"/g, (_, href) => ` href="${pageHref(href, anchor)}"`);
    }
  };
}
