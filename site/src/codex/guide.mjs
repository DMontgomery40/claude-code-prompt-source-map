import { escapeHtml } from "./render.mjs";

// "Start here" panel for the single-page reference. Most readers arrive looking for
// persistent mode, which is spread across the whole harness rather than written in one
// prompt, so it links straight to every place it lives instead of leaving them to read
// every prompt.

const highlight = /<section class="[^"]*\breview-focus\b[^"]*" id="([^"]+)">\s*<div class="review-tag">([^<]*)<\/div>/g;

function themes(content) {
  const found = [...content.matchAll(highlight)].map(([, id, tag]) => ({
    id,
    theme: tag.split(" · ")[0].replace(/^Historical (\w)/, (_, letter) => letter.toUpperCase())
  }));
  return { first: found[0]?.id, count: found.length, names: [...new Set(found.map(item => item.theme))] };
}

function wordCount(source) {
  return source.replace(/^#+\s*/gm, "").split(/\s+/).filter(Boolean).length;
}

export function renderGuide(documents) {
  const rows = documents.flatMap(document => {
    const { first, count, names } = themes(document.content);
    if (!first) return [];
    const persistent = document.profile === "persistent";
    const meta = persistent
      ? `From the GPT-6 model records · about ${Math.round(wordCount(document.source) / 50) * 50} words`
      : names.length > 3 ? `${count} highlighted passages` : names.join(" · ");
    return [{ persistent, html: `<li${persistent ? ' class="is-primary"' : ""}><a href="#${first}"><span class="start-here-doc">${escapeHtml(document.title)}</span><span class="start-here-meta">${escapeHtml(meta)}</span></a></li>` }];
  });
  if (!rows.length) return "";
  rows.sort((a, b) => Number(b.persistent) - Number(a.persistent));
  // Config keys and env vars tagged persistent mode, linked as a filtered view.
  const tagged = documents.map(document => [document, document.filterVocabulary?.find(t => t.id === "persistent-mode")?.count]).filter(([, n]) => n);
  if (tagged.length) {
    const [first] = tagged[0];
    const meta = tagged.map(([document, n]) => `${n.toLocaleString("en-US")} ${/env/i.test(document.title) ? "env vars" : "config keys"}`).join(" · ");
    rows.splice(1, 0, { persistent: false, html: `<li><a href="${first.slug}/?tags=persistent-mode"><span class="start-here-doc">Persistent-mode config and env vars</span><span class="start-here-meta">${escapeHtml(meta)}</span></a></li>` });
  }
  // The CLI's bundled persistent-mode text, used when a model record carries none.
  const cli = documents.find(document => document.path === "outputs/codex-cli-prompts.md");
  const cliAnchor = cli?.outline?.find(item => item.text === "Persistent mode")?.id;
  if (cliAnchor) {
    rows.splice(tagged.length ? 2 : 1, 0, { persistent: false, html: `<li><a href="#${cliAnchor}"><span class="start-here-doc">CLI persistent-mode fallback</span><span class="start-here-meta">Used when a model record has no text of its own</span></a></li>` });
  }

  return `
        <section class="start-here" aria-labelledby="start-here-title">
          <h2 class="start-here-title" id="start-here-title">Start here</h2>
          <p>Persistent mode is not one prompt. It is a behavior of the whole Codex/ChatGPT product, so the text behind it is spread across the harness: the developer message the CLI adds while the mode is on, passages on autonomy, task continuity, delegation, and context carry-over in the base prompts and conditional modules, the voice prompts, and the config keys and environment variables that shape it. This navigator gathers those pieces in one place.</p>
          <p>Together they keep the model working after it answers: it sends replies mid-turn instead of ending the turn, sleeps and checks back on running work, and owns a finish, monitor, or track request until it is done. None of it widens what the model may do; new authority still needs approval.</p>
          <p>Every prompt is published in full, but you do not need to read it all. The passages that matter are in <span class="start-here-swatch" aria-hidden="true"></span>blue boxes, and these links go straight to them:</p>
          <ul class="start-here-list">${rows.map(row => row.html).join("")}</ul>
          <p class="start-here-rest">Everything else is the complete reference for anyone building on this harness: raw model records, tool manifests, helper prompts, and extraction evidence.</p>
        </section>`;
}

export const guideStyles = `
    .start-here{margin:56px 0 0;padding:26px 28px 8px;border:1px solid var(--line);border-radius:6px;background:var(--panel);text-align:left}
    .start-here-title{margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:600}
    .start-here p{margin:0 0 16px;color:#d3d5cf;font-size:16px;line-height:1.58}
    .start-here-swatch{display:inline-block;width:14px;height:14px;margin:0 6px -2px 0;border:1px solid #355266;border-left:3px solid #83bfd8;border-radius:2px;background:#17252b}
    .start-here-list{margin:4px 0 18px;padding:0;list-style:none;border-top:1px solid var(--line)}
    .start-here-list li{margin:0;border-bottom:1px solid var(--line)}
    .start-here-list a{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:4px 16px;padding:11px 2px;text-decoration:none}
    .start-here-list a:hover .start-here-doc,.start-here-list a:focus-visible .start-here-doc{color:var(--link)}
    .start-here-doc{color:var(--text);font-size:16px;font-weight:550}
    .start-here-meta{color:#a3a79f;font-size:14px}
    .start-here-list .is-primary a{margin-left:-2px;padding-left:12px;border-left:3px solid #83bfd8;background:linear-gradient(115deg,#17252b,#172022 65%,#171816)}
    .start-here-list .is-primary .start-here-meta{color:#a9d8e6}
    .start-here p.start-here-rest{color:#a3a79f;font-size:15px}
    @media(max-width:800px){.start-here{margin-top:40px;padding:22px 18px 4px}}`;
