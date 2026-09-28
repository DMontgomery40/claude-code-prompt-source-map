// GPT-6 / Codex desktop → gpt6aeon.dtmont.com
import { existsSync, readFileSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import { runAgent } from "../lib/agent.mjs";
import { appendChangelog, gate, publish, writeStatus } from "../lib/publish.mjs";
import { log, notify, run } from "../lib/run.mjs";

const repo = path.resolve(import.meta.dirname, "../../codex");
const GENERATED = [
  { script: "extract/codex/chatgpt-prompts.mjs", diff: "work/chatgpt-prompts-diff.md",
    outputs: ["conversation", "gpt-builder", "work", "finance-health", "sites-artifacts"].flatMap(p => [`outputs/chatgpt-${p}-prompts.md`, `outputs/chatgpt-${p}-prompts.json`]) },
  { script: "extract/codex/bundle-resources.mjs", diff: "work/bundle-resources-diff.md",
    outputs: ["outputs/chatgpt-bundled-plugins.md", "outputs/chatgpt-bundled-plugins.json", "outputs/computer-use-prompts.md", "outputs/computer-use-prompts.json"] },
  { script: "extract/codex/tool-manifest.mjs", diff: "work/tool-manifest-diff.md",
    outputs: ["outputs/desktop-tool-manifest.md", "outputs/desktop-tool-manifest.json"] },
  { script: "extract/codex/learning-blocks.mjs", diff: "work/learning-blocks-diff.md",
    outputs: ["outputs/chatgpt-learning-blocks.md", "outputs/chatgpt-learning-blocks.json"] }
];
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
    let cliPromptDiff = "";
    const cliPromptDiffFile = path.join(repo, "work/codex-cli-prompts-diff.md");
    if (!previous || previous.cli_sha256 !== fingerprint.cli_sha256 || previous.app_build !== fingerprint.app_build) {
      rmSync(cliPromptDiffFile, { force: true });
      const c = run("bash", ["extract/codex-config/run_all.sh"], { cwd: repo, timeoutMs: 30 * 60 * 1000 });
      if (c.status !== 0) {
        configNote = `config/env reference not regenerated: ${(c.stderr || c.stdout).slice(-300)}`;
        notify("gpt6aeon config reference", configNote);
        run("git", ["checkout", "--", "outputs/codex-config.json", "outputs/codex-config.md", "outputs/codex-env-vars.json", "outputs/codex-env-vars.md",
          "outputs/codex-cli-prompts.md", "outputs/codex-cli-bundled-skills.md", "outputs/codex-cli-prompts.json"], { cwd: repo });
      } else if (existsSync(cliPromptDiffFile)) {
        // Written by this cycle's 07_cli_prompts.mjs against the committed pages; consumed once.
        cliPromptDiff = readFileSync(cliPromptDiffFile, "utf8").trim();
        rmSync(cliPromptDiffFile, { force: true });
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
    // Generated pages beyond the refresh documents: ChatGPT prompts, bundled plugins and
    // Computer Use prompts, and the live tool manifest. Each is non-fatal: a failure is logged
    // and its pages are restored; a script not yet on main is skipped. They run before the
    // sweep, which excludes the texts they publish.
    const generatedDiffs = [];
    for (const g of GENERATED) {
      if (!existsSync(path.join(repo, g.script))) continue;
      const diffFile = path.join(repo, g.diff);
      rmSync(diffFile, { force: true });
      const out = run(node, [g.script], { cwd: repo, timeoutMs: 10 * 60 * 1000 });
      if (out.status !== 0) {
        log(`codex ${g.script} failed (${out.status}): ${(out.stderr || out.stdout).slice(-300)}`);
        if (!dryRun) notify("gpt6aeon generated pages", `${g.script} failed; its pages were left unchanged`);
        run("git", ["checkout", "--", ...g.outputs.filter(file => existsSync(path.join(repo, file)))], { cwd: repo });
        continue;
      }
      if (existsSync(diffFile)) { generatedDiffs.push(readFileSync(diffFile, "utf8").trim()); rmSync(diffFile, { force: true }); }
    }

    // Model-facing text the inventory doesn't cover; never fails the refresh.
    let sweepDiff = "";
    const sweepDiffFile = path.join(repo, "work/desktop-model-facing-diff.md");
    rmSync(sweepDiffFile, { force: true });
    const sweep = run(node, ["extract/codex/prompt-sweep.mjs"], { cwd: repo, timeoutMs: 15 * 60 * 1000 });
    if (sweep.status !== 0) {
      log(`codex prompt sweep failed: ${(sweep.stderr || sweep.stdout).slice(-300)}`);
      run("git", ["checkout", "--", "outputs/desktop-model-facing-text.md"], { cwd: repo });
    } else {
      const swept = JSON.parse(sweep.stdout.trim().split("\n").at(-1));
      if (swept.jev_unavailable && !dryRun) notify("gpt6aeon prompt sweep", `${swept.unclassified} candidates unclassified: ${swept.jev_unavailable}`);
      if (existsSync(sweepDiffFile)) { sweepDiff = readFileSync(sweepDiffFile, "utf8").trim(); rmSync(sweepDiffFile, { force: true }); }
    }
    // Catalog settings baseline: advanced after a publish, or when nothing needs publishing;
    // never in a dry run, so a failed gate or a dry run can't swallow a change.
    const promoteSnapshot = () => {
      const next = path.join(repo, "work/catalog-snapshot.next.json");
      if (!dryRun && existsSync(next)) renameSync(next, path.join(repo, "work/catalog-snapshot.json"));
    };
    const privateSettings = summary.catalog_settings?.private ?? [];
    if (privateSettings.length && !dryRun) notify("gpt6aeon catalog", `Catalog settings changed (not published, may be account-specific): ${privateSettings.join(", ").slice(0, 300)}`);
    const diffFile = path.join(repo, "work/codex-diff.md");
    const diff = [existsSync(diffFile) ? readFileSync(diffFile, "utf8").trim() : "", cliPromptDiff, ...generatedDiffs, sweepDiff].filter(Boolean).join("\n\n");
    const statusFile = path.join(repo, "outputs/status.json");
    const previousLabel = existsSync(statusFile) ? JSON.parse(readFileSync(statusFile, "utf8")).checked : null;
    const labelChanged = previousLabel !== this.checkedLabel(now);
    // Documents can change byte-wise without a semantic change (an app update moves offsets
    // and file names). Publish those too so provenance stays current, without moving the
    // "Updated" date. sources.json alone changes every run (fetch time) and doesn't count.
    const dirty = run("git", ["status", "--porcelain", "--", "outputs", ":(exclude)outputs/sources.json", ":(exclude)outputs/status.json"], { cwd: repo }).stdout.trim();
    if (!diff && !labelChanged && !dirty) { promoteSnapshot(); return { published: false, summary }; }
    if (!dryRun) writeStatus(repo, { checked: this.checkedLabel(now), sources: summary.sources, changed: Boolean(diff) || !previousLabel });
    if (diff && !dryRun) appendChangelog(repo, `ChatGPT desktop ${summary.sources.app_version} (${summary.sources.app_build}), Codex CLI ${summary.sources.cli_version}`, diff);
    await gate(repo);
    if (dryRun) return { published: false, summary, wouldPublish: true };
    await publish(repo, { origin: this.origin, message: diff ? `Refresh: ${summary.changed.length ? `${summary.changed.length} documents changed upstream` : "Codex model settings or CLI prompts changed"}\n\n${diff.slice(0, 3000)}` : dirty ? `Provenance: ChatGPT desktop ${summary.sources.app_version} (${summary.sources.app_build})` : `Status: now checked ${this.checkedLabel(now)}` });
    promoteSnapshot();
    return { published: true, summary };
  }
};
