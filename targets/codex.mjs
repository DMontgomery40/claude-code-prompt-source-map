// GPT-6 / Codex desktop → gpt6aeon.dtmont.com
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runAgent } from "../lib/agent.mjs";
import { appendChangelog, gate, publish, writeStatus } from "../lib/publish.mjs";
import { log, notify, run } from "../lib/run.mjs";

const repo = `${process.env.HOME}/gpt6-prompt-source-map`;
const node = process.execPath;

export const codex = {
  name: "codex",
  repo,
  origin: "https://gpt6aeon.dtmont.com",
  // Hourly through Dev Day (2026-09-29) plus a week, then daily.
  intervalMs: now => (now < Date.parse("2026-10-07T00:00:00-06:00") ? 3600e3 : 86400e3),
  checkedLabel: now => (now < Date.parse("2026-10-07T00:00:00-06:00") ? "hourly" : "daily"),

  fingerprint() {
    const r = run(node, ["extract/codex/fingerprint.mjs"], { cwd: repo, timeoutMs: 60 * 1000 });
    if (r.status !== 0) throw new Error(`fingerprint failed: ${r.stderr.slice(-500)}`);
    return JSON.parse(r.stdout.trim().split("\n").at(-1));
  },

  async refresh({ now, dryRun, fingerprint, previous }) {
    // The config.toml and env-var reference follows the bundled CLI and app build. It needs
    // the matching openai/codex source tag; if that isn't published yet, say so and keep going.
    let configNote = "";
    if (!previous || previous.cli_sha256 !== fingerprint.cli_sha256 || previous.app_build !== fingerprint.app_build) {
      const c = run("bash", ["extract/codex-config/run_all.sh"], { cwd: repo, timeoutMs: 30 * 60 * 1000 });
      if (c.status !== 0) {
        configNote = `config/env reference not regenerated: ${(c.stderr || c.stdout).slice(-300)}`;
        notify("gpt6aeon config reference", configNote);
        run("git", ["checkout", "--", "outputs/codex-config.json", "outputs/codex-config.md", "outputs/codex-env-vars.json", "outputs/codex-env-vars.md"], { cwd: repo });
      }
    }
    let r = run(node, ["extract/codex/refresh.mjs"], { cwd: repo, timeoutMs: 15 * 60 * 1000 });
    if (r.status === 2) {
      log(`codex refresh needs repair: ${r.stderr.slice(-500)}`);
      if (dryRun) throw new Error("refresh needs repair (dry run: agent not started)");
      runAgent(repo, `The Codex desktop app or model catalog changed and \`node extract/codex/refresh.mjs\` could not find one of its sources:\n\n${r.stderr.slice(-3000)}\n\nRepair the extraction in extract/codex/ so it finds the same prompts by content in the current app and catalog, then run \`node extract/codex/refresh.mjs\` until it exits 0, and \`cd site && npm test\`.`);
      r = run(node, ["extract/codex/refresh.mjs"], { cwd: repo, timeoutMs: 15 * 60 * 1000 });
    }
    if (r.status !== 0) throw new Error(`refresh failed (${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
    const summary = JSON.parse(r.stdout.trim().split("\n").at(-1));
    const diffFile = path.join(repo, "work/codex-diff.md");
    const diff = existsSync(diffFile) ? readFileSync(diffFile, "utf8").trim() : "";
    const statusFile = path.join(repo, "outputs/status.json");
    const previousLabel = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, "utf8")).checked : null;
    const labelChanged = previousLabel !== this.checkedLabel(now);
    // Documents can change byte-wise without a semantic change (an app update moves offsets
    // and file names). Publish those too so provenance stays current, without moving the
    // "Updated" date. sources.json alone changes every run (fetch time) and doesn't count.
    const dirty = run("git", ["status", "--porcelain", "--", "outputs", ":(exclude)outputs/sources.json", ":(exclude)outputs/status.json"], { cwd: repo }).stdout.trim();
    if (!diff && !labelChanged && !dirty) return { published: false, summary };
    if (!dryRun) writeStatus(repo, { checked: this.checkedLabel(now), sources: summary.sources, changed: Boolean(diff) || !previousLabel });
    if (diff && !dryRun) appendChangelog(repo, `ChatGPT desktop ${summary.sources.app_version} (${summary.sources.app_build}), Codex CLI ${summary.sources.cli_version}`, diff);
    await gate(repo);
    if (dryRun) return { published: false, summary, wouldPublish: true };
    await publish(repo, { origin: this.origin, message: diff ? `Refresh: ${summary.changed.length} documents changed upstream\n\n${diff.slice(0, 3000)}` : dirty ? `Provenance: ChatGPT desktop ${summary.sources.app_version} (${summary.sources.app_build})` : `Status: now checked ${this.checkedLabel(now)}` });
    return { published: true, summary };
  }
};
