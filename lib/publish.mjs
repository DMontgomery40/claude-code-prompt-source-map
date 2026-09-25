// The gate: nothing reaches the live site or GitHub unless tests, build, and checks pass.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { log, must, run } from "./run.mjs";

const sha = value => createHash("sha256").update(value).digest("hex");

// Public outputs must never carry this machine's identity or secrets. Prompt texts contain
// placeholder examples (ghp_your_token, /Users/me), so the check looks for the actual local
// values rather than generic shapes.
function forbiddenValues() {
  const home = os.homedir();
  const values = new Set([home, os.userInfo().username]);
  const email = run("git", ["config", "--global", "user.email"]).stdout.trim();
  if (email) values.add(email);
  const read = file => { try { return readFileSync(file, "utf8"); } catch { return ""; } };
  for (const line of read(path.join(home, ".env")).split("\n")) {
    const value = line.replace(/^\s*(?:export\s+)?[A-Z0-9_]+\s*=\s*/, "").replace(/^["']|["']$/g, "").trim();
    if (value.length >= 12 && value !== line.trim()) values.add(value);
  }
  const strings = text => [...text.matchAll(/"([^"\\]{20,})"/g)].map(m => m[1]);
  for (const file of [path.join(home, ".codex/auth.json"), path.join(home, "Library/Preferences/.wrangler/config/default.toml")]) for (const v of strings(read(file))) values.add(v);
  return [...values].filter(v => v && v.length >= 6);
}

export function leakCheck(repo) {
  const files = run("git", ["ls-files", "-co", "--exclude-standard", "outputs"], { cwd: repo }).stdout.split("\n").filter(Boolean);
  const forbidden = forbiddenValues();
  const found = [];
  for (const file of files) {
    const text = readFileSync(path.join(repo, file), "utf8");
    for (const value of forbidden) if (text.includes(value)) found.push(`${file}: contains a local identity or secret value (${value.length} chars, starts "${value.slice(0, 4)}")`);
  }
  if (found.length) throw new Error(`leak check failed (${found.length}):\n${found.slice(0, 20).join("\n")}`);
}

export function gate(repo) {
  must("npm", ["test"], { cwd: path.join(repo, "site"), timeoutMs: 5 * 60 * 1000 });
  must("npm", ["run", "build"], { cwd: path.join(repo, "site"), timeoutMs: 5 * 60 * 1000 });
  leakCheck(repo);
}

// last_changed moves only when content changed; source versions always reflect the build shown.
export function writeStatus(repo, { checked, sources, changed = true }) {
  const file = path.join(repo, "outputs/status.json");
  const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
  const last_changed = changed || !previous?.last_changed ? new Date().toISOString() : previous.last_changed;
  writeFileSync(file, `${JSON.stringify({ last_changed, checked, sources }, null, 2)}\n`);
}

export function appendChangelog(repo, title, body) {
  const file = path.join(repo, "CHANGELOG.md");
  const previous = existsSync(file) ? readFileSync(file, "utf8").replace(/^# Changelog\n+/, "") : "";
  writeFileSync(file, `# Changelog\n\n## ${new Date().toISOString().slice(0, 10)} · ${title}\n\n${body.trim()}\n\n${previous}`);
}

// Deploys, verifies the live root matches the build, commits, and pushes.
export async function publish(repo, { origin, message }) {
  const site = path.join(repo, "site");
  must("wrangler", ["deploy"], { cwd: site, env: { CI: "1" }, timeoutMs: 5 * 60 * 1000 });
  const want = sha(readFileSync(path.join(site, "dist/index.html")));
  let live = "";
  for (let i = 0; i < 24 && live !== want; i += 1) {
    const r = run("curl", ["-s", "--max-time", "20", `${origin}/?watch=${Date.now()}`]);
    live = sha(r.stdout);
    if (live !== want) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (live !== want) throw new Error(`deployed, but ${origin} does not serve the new build yet`);
  must("git", ["add", "-A", "outputs", "extract", "site", "CHANGELOG.md"], { cwd: repo });
  if (run("git", ["diff", "--cached", "--quiet"], { cwd: repo }).status !== 0) {
    must("git", ["commit", "-q", "-m", message], { cwd: repo });
  }
  pushWithinBudget(repo);
  log(`published ${origin}`);
}

// Every GitHub push emails the operator. Share the budget his Claude hook enforces
// (~/.claude/hooks/github_action_budget.py): at most 3 per repo per 3 hours. The live site
// is deployed regardless; commits beyond the budget wait locally and go out together.
const budgetLog = path.join(os.homedir(), ".claude/state/github-actions.log");
export function pushWithinBudget(repo) {
  const ahead = run("git", ["rev-list", "--count", "@{u}..HEAD"], { cwd: repo }).stdout.trim();
  if (!Number(ahead)) return false;
  const url = run("git", ["remote", "get-url", "origin"], { cwd: repo }).stdout.trim();
  const slug = url.split("github.com/").at(-1).replace(/^.*:/, "").replace(/\.git$/, "");
  const now = Date.now() / 1000;
  const recent = (existsSync(budgetLog) ? readFileSync(budgetLog, "utf8") : "").split("\n")
    .map(line => line.split(" ")).filter(([stamp, key]) => key === slug && now - Number(stamp) < 3 * 3600);
  if (recent.length >= 3) { log(`push deferred for ${slug}: ${ahead} commit(s) wait for the GitHub budget`); return false; }
  must("git", ["push", "-q", "origin", "main"], { cwd: repo, timeoutMs: 2 * 60 * 1000 });
  appendFileSync(budgetLog, `${Math.round(now)} ${slug}\n`);
  log(`pushed ${ahead} commit(s) to ${slug}`);
  return true;
}
