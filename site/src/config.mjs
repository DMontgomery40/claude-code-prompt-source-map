// Everything that identifies this site. The generator itself is shared with the GPT-6
// prompt source map.
export const site = {
  origin: "https://ccprompts.dtmont.com",
  name: "Claude Code Prompt Source Map",
  homeTitle: "Claude Code Prompt Source Map · Prompts, Tools, Config",
  shareTitle: "Claude Code Prompt Source Map: prompts, tools, env vars, config",
  description: "The system prompt, tool descriptions, reminders, agents, skills, environment variables, settings, and hooks inside Claude Code, read from the shipped binary and kept current.",
  dek: "What Claude Code sends the model, and every setting, flag, and environment variable that changes it.",
  socialCard: { file: "social-card.png", alt: "Claude Code prompt source map card listing prompts, tools, env vars, and config." },
  follow: { handle: "_DMontgomery40", url: "https://x.com/_DMontgomery40" },
  repo: { url: "https://github.com/DMontgomery40/claude-code-prompt-source-map" },
  // Featured at the top of the sidebar on every page and under the home page intro.
  feature: {
    path: "outputs/what-wins.md",
    kicker: "Interactive",
    title: "What wins",
    line: "When an env var, a setting and a flag disagree, see which one Claude Code uses.",
    homeLine: "Pick the values you have set, and each card shows which one Claude Code uses and every source it checked on the way, in order, traced to the shipped code.",
    cta: "Open What wins"
  },
  introLabel: "PROMPTS / TOOLS / ENV / FIELD REPORT",
  themeColor: "#101710",
  // "index": the home page lists the documents instead of embedding all of them.
  homeMode: "index"
};
