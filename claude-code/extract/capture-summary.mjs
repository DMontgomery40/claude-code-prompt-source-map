// Summarizes captured requests into outputs/capture-summary.json, the source for every
// number and list on the "What a request contains" page ({{value:capture-summary …}}).
//   node extract/capture-summary.mjs <capture-dir>     (holds cli/ and sdk/ from capture.mjs)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2]);
const root = new URL("../", import.meta.url).pathname;
const requests = mode => readdirSync(path.join(dir, mode)).sort().map(f => JSON.parse(readFileSync(path.join(dir, mode, f), "utf8")));

function summarize(mode) {
  const all = requests(mode);
  const main = all.find(r => r.body?.tools?.length);
  const title = all.find(r => r.body?.output_config?.format && !r.body?.tools?.length);
  const trailing = main.body.messages.at(-1);
  const header = main.body.system[0].text;
  return {
    entrypoint: header.match(/cc_entrypoint=([^;]+)/)?.[1] ?? null,
    identity: main.body.system[1].text,
    tools: main.body.tools.length,
    tool_names: main.body.tools.map(t => t.name),
    system_blocks: main.body.system.length,
    main_prompt_chars: main.body.system.at(-1).text.length,
    trailing_role: trailing.role,
    trailing_chars: trailing.content.map(p => p.text ?? "").join("").length,
    betas: (main.beta ?? "").split(",").filter(Boolean),
    model: main.body.model,
    max_tokens: main.body.max_tokens,
    thinking: JSON.stringify(main.body.thinking),
    effort: main.body.output_config?.effort ?? null,
    context_management: JSON.stringify(main.body.context_management),
    side_requests: all.filter(r => r !== main && !(r.body?.tools?.length)).map(r => `${r.method} ${r.url.split("?")[0]}`),
    title_request: title ? { betas_extra: (title.beta ?? "").split(",").filter(b => !(main.beta ?? "").split(",").includes(b)) } : null
  };
}

const cli = summarize("cli"), sdk = summarize("sdk");
const summary = {
  version: JSON.parse(readFileSync(path.join(root, "work/current.json"), "utf8")).version,
  cli,
  sdk,
  betas_shared: cli.betas.filter(b => sdk.betas.includes(b)),
  betas_cli_only: cli.betas.filter(b => !sdk.betas.includes(b)),
  betas_sdk_only: sdk.betas.filter(b => !cli.betas.includes(b))
};
writeFileSync(path.join(root, "outputs/capture-summary.json"), `${JSON.stringify(summary, null, 1)}\n`);
console.log(JSON.stringify({ cli_tools: cli.tools, sdk_tools: sdk.tools, betas: summary.betas_shared.length }));
