// The one site that publishes both products. Every absolute URL is derived from here, so a
// rename of the domain or the repo is a one-line change.
export const SITE = {
  domain: "harness.dtmont.com",
  name: "Harness Source Map",
  repo: "https://github.com/DMontgomery40/harness-source-map",
  follow: { handle: "_DMontgomery40", url: "https://x.com/_DMontgomery40" },
  products: {
    "claude-code": { path: "claude-code", label: "Claude Code", legacyHost: "ccprompts.dtmont.com" },
    codex: { path: "codex", label: "Codex/ChatGPT", legacyHost: "gpt6aeon.dtmont.com" }
  }
};

export const siteOrigin = () => `https://${SITE.domain}`;
export const productOrigin = id => `${siteOrigin()}/${SITE.products[id].path}`;
