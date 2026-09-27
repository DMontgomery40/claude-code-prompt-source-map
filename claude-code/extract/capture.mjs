// Captures the exact requests a Claude Code binary builds, without sending anything to
// Anthropic: a throwaway home, no settings or MCP, a placeholder key, and a local recorder
// that saves each request body and answers with an error.
//   node extract/capture.mjs <path/to/claude> <out-dir>
// Writes <out-dir>/sdk/req-*.json (claude -p) and <out-dir>/cli/req-*.json (interactive).
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

const [binaryArg, outArg] = process.argv.slice(2);
const binary = binaryArg && path.resolve(binaryArg), outDir = outArg && path.resolve(outArg);
if (!binaryArg || !outArg) { console.error("usage: capture.mjs <claude binary> <out-dir>"); process.exit(1); }

let sink = null;
const server = createServer((req, res) => {
  let body = "";
  req.on("data", chunk => (body += chunk));
  req.on("end", () => {
    if (sink) {
      const n = readdirSync(sink).length + 1;
      writeFileSync(path.join(sink, `req-${String(n).padStart(2, "0")}.json`), JSON.stringify({ method: req.method, url: req.url, beta: req.headers["anthropic-beta"] ?? null, body: body ? JSON.parse(body) : null }, null, 1));
    }
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "capture proxy: request recorded" } }));
  });
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const key = "sk-ant-capture-placeholder-0123456789";

function sandbox() {
  const root = mkdtempSync(path.join(os.tmpdir(), "cc-capture-"));
  const home = path.join(root, "home"), work = path.join(root, "work");
  mkdirSync(path.join(home, ".claude"), { recursive: true }); mkdirSync(work);
  const project = { hasTrustDialogAccepted: true, hasCompletedProjectOnboarding: true };
  const config = { hasCompletedOnboarding: true, theme: "dark", numStartups: 5, customApiKeyResponses: { approved: [key.slice(-20)], rejected: [] }, projects: { [work]: project, [`/private${work}`]: project } };
  writeFileSync(path.join(home, ".claude.json"), JSON.stringify(config));
  writeFileSync(path.join(home, ".claude", ".claude.json"), JSON.stringify(config));
  const env = { PATH: process.env.PATH, HOME: home, CLAUDE_CONFIG_DIR: path.join(home, ".claude"), ANTHROPIC_API_KEY: key, ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}`, TERM: "xterm-256color", COLUMNS: "120", LINES: "40" };
  return { root, work, env };
}

const prompt = "Reply with OK.";
async function capture(mode) {
  sink = path.join(outDir, mode); rmSync(sink, { recursive: true, force: true }); mkdirSync(sink, { recursive: true });
  const box = sandbox();
  if (mode === "sdk") {
    const child = spawn(binary, ["-p", prompt], { cwd: box.work, env: box.env, stdio: "ignore" });
    const timer = setTimeout(() => child.kill("SIGKILL"), 120000);
    await new Promise(resolve => child.on("exit", resolve));
    clearTimeout(timer);
  } else {
    // The interactive UI needs a terminal; `script` provides one.
    const child = spawn("script", ["-q", "/dev/null", binary, prompt], { cwd: box.work, env: box.env, stdio: ["ignore", "ignore", "ignore"] });
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline && !readdirSync(sink).some(f => { try { return JSON.parse(readFileSync(path.join(sink, f), "utf8")).body?.tools?.length > 0; } catch { return false; } })) await new Promise(r => setTimeout(r, 1000));
    await new Promise(r => setTimeout(r, 3000));
    child.kill("SIGKILL");
  }
  rmSync(box.root, { recursive: true, force: true });
  const files = readdirSync(sink);
  if (!files.length) throw new Error(`${mode}: no requests captured`);
  return files.length;
}

try {
  const sdk = await capture("sdk");
  const cli = await capture("cli");
  console.log(JSON.stringify({ sdk_requests: sdk, cli_requests: cli }));
} finally {
  server.close();
}
