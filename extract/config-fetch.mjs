// Fetch the inputs config.mjs reads besides the embedded bundle:
//  - official docs pages (markdown) listed in https://code.claude.com/docs/llms.txt -> work/config/docs/
//  - `claude <command path> --help` for every command the CLI analyzer finds -> work/config/help/
// Usage: node extract/config-fetch.mjs [--skip-docs] [--skip-help]
import { mkdirSync, writeFileSync, openSync, closeSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { cliAnalyzer, CLI_CHUNKS } from "./config.mjs";
import { VERSION } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const DOCS = `${ROOT}work/config/docs/`, HELP = `${ROOT}work/config/help/`;
const args = new Set(process.argv.slice(2));
mkdirSync(DOCS, { recursive: true });
mkdirSync(HELP, { recursive: true });

if (!args.has("--skip-docs")) {
  const index = await (await fetch("https://code.claude.com/docs/llms.txt")).text();
  writeFileSync(`${DOCS}llms.txt`, index);
  const skip = /whats-new|agent-sdk\/|champion-kit|communications-kit|legal|prompt-library|self-hosted|claude-apps-gateway/;
  const urls = [...new Set(index.match(/https:\/\/code\.claude\.com\/docs\/en\/[a-z0-9/_-]+\.md/g))].filter(u => !skip.test(u));
  for (let i = 0; i < urls.length; i += 16) {
    await Promise.all(urls.slice(i, i + 16).map(async u => {
      const name = u.replace("https://code.claude.com/docs/en/", "").replace(/\//g, "__");
      const res = await fetch(u);
      if (res.ok) writeFileSync(`${DOCS}${name}`, await res.text());
    }));
  }
  console.log(`docs: ${urls.length} pages`);
}

if (!args.has("--skip-help")) {
  const version = spawnSync("claude", ["--version"], { encoding: "utf8" }).stdout.trim();
  if (!version.startsWith(VERSION)) throw new Error(`installed claude is ${version}, expected ${VERSION}`);
  const main = cliAnalyzer(CLI_CHUNKS[0]);
  const side = cliAnalyzer(CLI_CHUNKS[1], new Map(main.outgoing));
  const paths = new Set([""]);
  for (const c of [...main.commands, ...side.commands]) paths.add(c.path.join(" "));
  for (const stub of ["attach", "logs", "stop", "respawn", "rm"]) paths.add(stub); // root help-display entries
  for (const p of paths) {
    const argv = p ? [...p.split(" "), "--help"] : ["--help"];
    // write straight to a file: piped stdout can be cut short when the CLI exits after printing help
    const fd = openSync(`${HELP}${p ? p.replace(/ /g, "_") : "root"}.txt`, "w");
    spawnSync("claude", argv, { timeout: 25000, stdio: ["ignore", fd, fd] });
    closeSync(fd);
  }
  console.log(`help: ${paths.size} command paths`);
}
