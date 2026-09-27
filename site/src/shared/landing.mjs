// The site's front door: pick a harness (Claude Code or Codex/ChatGPT), or open Trace, which reads
// sessions from both. Everything product-specific lives under /claude-code/ and /codex/.
import { SITE, siteOrigin } from "./site.mjs";

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CHOICES = [
  {
    id: "claude-code",
    kicker: "Anthropic",
    title: "Claude Code",
    line: "The system prompt, system reminders, tools, agents, skills, settings, env vars and hooks, read from the shipped binary. Plus What wins: which setting, flag or env var Claude Code actually uses."
  },
  {
    id: "codex",
    kicker: "OpenAI",
    title: "Codex/ChatGPT",
    line: "GPT-6 base and persistent-mode instructions, conditional modules, Codex CLI prompts, ChatGPT desktop and Work prompts, config.toml and env vars, read from the shipped apps and catalogs."
  }
];

export function renderLanding({ cardFile = "social-card.png" } = {}) {
  const origin = siteOrigin();
  const title = `${SITE.name} · What Claude Code and Codex/ChatGPT send the model`;
  const description = "Every prompt, reminder, tool description and setting that Claude Code and Codex/ChatGPT put in front of the model, read from the shipped binaries with provenance. Trace your own session to see them arrive.";
  const cards = CHOICES.map(c => `
      <a class="choice" href="${esc(SITE.products[c.id].path)}/">
        <span class="kicker">${esc(c.kicker)}</span>
        <span class="choice-title">${esc(c.title)}</span>
        <span class="choice-line">${esc(c.line)}</span>
        <span class="go" aria-hidden="true">Open →</span>
      </a>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${origin}/">
  <meta name="theme-color" content="#0b100e">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${origin}/">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${origin}/${esc(cardFile)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${origin}/${esc(cardFile)}">
  <style>
    :root{color-scheme:dark;--bg:#0b100e;--panel:#111a14;--line:#2c3d2d;--ink:#eef4e6;--ink-2:#a9b8a3;--accent:#c8f784}
    *{box-sizing:border-box}
    html,body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
    main{max-width:1040px;margin:0 auto;padding:clamp(28px,6vw,72px) 16px 48px}
    .eyebrow{font:600 12px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
    h1{font-size:clamp(34px,6vw,60px);line-height:1.04;letter-spacing:-.02em;margin:14px 0 14px}
    .dek{max-width:680px;color:var(--ink-2);font-size:clamp(16px,2.2vw,19px);margin:0 0 clamp(28px,5vw,44px)}
    h2{font-size:15px;font-weight:600;color:var(--ink-2);margin:0 0 14px}
    .choices{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
    .choice{display:flex;flex-direction:column;gap:10px;padding:26px 24px 22px;border:1px solid var(--line);border-radius:14px;background:var(--panel);color:inherit;text-decoration:none;transition:border-color .15s,transform .15s}
    .choice:hover,.choice:focus-visible{border-color:var(--accent);transform:translateY(-2px);outline:none}
    .kicker{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
    .choice-title{font-size:clamp(26px,3.6vw,34px);font-weight:700;letter-spacing:-.01em}
    .choice-line{color:var(--ink-2)}
    .go{margin-top:auto;padding-top:6px;color:var(--accent);font-weight:600}
    .trace{display:grid;grid-template-columns:1fr auto;gap:14px 24px;align-items:center;margin-top:16px;padding:20px 24px;border:1px dashed var(--line);border-radius:14px}
    .trace b{font-size:18px}
    .trace p{margin:4px 0 0;color:var(--ink-2)}
    .trace a{justify-self:end;padding:10px 16px;border-radius:999px;background:var(--accent);color:#0b100e;font-weight:700;text-decoration:none;white-space:nowrap}
    footer{display:flex;flex-wrap:wrap;gap:18px;margin-top:40px;color:var(--ink-2);font-size:14px}
    footer a{color:var(--ink-2)}
    @media (max-width:560px){.trace{grid-template-columns:1fr}.trace a{justify-self:start}}
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">${esc(SITE.name)}</div>
    <h1>What the agent harness puts in front of the model.</h1>
    <p class="dek">Every prompt, reminder, tool description and setting that Claude Code and Codex/ChatGPT send, read from the shipped binaries, each with its source.</p>
    <h2 id="pick">Which harness?</h2>
    <nav class="choices" aria-labelledby="pick">${cards}
    </nav>
    <section class="trace" aria-label="Trace a session">
      <div><b>Trace a session</b><p>Open your own Claude Code or Codex/ChatGPT session log and see what reached the model, where it came from, and who got it. Runs in your browser; nothing is uploaded.</p></div>
      <a href="trace/">Open Trace</a>
    </section>
    <footer>
      <a href="${esc(SITE.follow.url)}">Follow @${esc(SITE.follow.handle)} on X</a>
      <a href="${esc(SITE.repo)}">Source on GitHub</a>
    </footer>
  </main>
</body>
</html>
`;
}
