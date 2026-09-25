// Claude Code → ccprompts.dtmont.com. Tracks the npm "latest" dist-tag of the
// darwin-arm64 build (the tag the default auto-updater follows).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runAgent } from "../lib/agent.mjs";
import { appendChangelog, gate, publish, writeStatus } from "../lib/publish.mjs";
import { run } from "../lib/run.mjs";

const repo = `${process.env.HOME}/Documents/claude-code-prompt-source-map`;
const node = process.execPath;
const npm = path.join(path.dirname(process.execPath), "npm");

export const cc = {
  name: "cc",
  repo,
  origin: "https://ccprompts.dtmont.com",
  intervalMs: () => 86400e3,
  checkedLabel: () => "daily",

  fingerprint() {
    const r = run(npm, ["view", "@anthropic-ai/claude-code-darwin-arm64@latest", "version", "dist.integrity", "--json"], { timeoutMs: 60 * 1000 });
    if (r.status !== 0) throw new Error(`npm view failed: ${r.stderr.slice(-300)}`);
    const v = JSON.parse(r.stdout);
    return { version: v.version, integrity: v["dist.integrity"] };
  },

  async refresh({ now, dryRun, fingerprint }) {
    const args = ["extract/refresh.mjs", fingerprint.version, fingerprint.integrity];
    const refresh = extra => run(node, [...args, ...extra], { cwd: repo, timeoutMs: 60 * 60 * 1000 });
    let r = refresh([]);
    if (r.status === 2) {
      // An extractor or source broke; outputs were restored. Repair, then refresh again.
      if (dryRun) throw new Error(`refresh needs repair (exit 2; dry run: agent not started): ${r.stderr.slice(-400)}`);
      runAgent(repo, `Claude Code ${fingerprint.version} was released and \`node ${args.join(" ")}\` failed:\n\n${r.stderr.slice(-4000)}\n\nFix the extraction scripts in extract/ so they work on the new build, then run \`node ${args.join(" ")}\` until it exits 0 or 3.`, { budgetUsd: 10, timeoutMs: 60 * 60 * 1000 });
      r = refresh([]);
    }
    if (r.status === 3) {
      // Records whose source changed need a careful update of their text and conditions.
      if (dryRun) return { published: false, summary: JSON.parse(r.stdout.trim().split("\n").at(-1)), wouldPublish: true, note: "review agent would run" };
      const report = readFileSync(path.join(repo, "work/cc-diff.md"), "utf8");
      runAgent(repo, `Claude Code ${fingerprint.version} was released. extract/refresh.mjs moved every unchanged record to the new build; the records listed below changed at their source and are marked "needs_review": true in outputs/*.json.\n\n${report.slice(0, 24000)}\n\nFor each flagged record, update its text, conditions, and provenance in outputs/<area>.json and the matching section of outputs/<area>.md so they match ${fingerprint.version} exactly, following work/CONTRACT.md (read the new code in work/extracted/; the "new" excerpts above are candidates chosen by a classifier, so confirm them). Remove records whose source no longer exists, add new ones where the report shows new behavior, then delete "needs_review". Finish by running \`node ${args.join(" ")} --verify\` until it exits 0, and \`cd site && npm test\`.`, { budgetUsd: 15, timeoutMs: 90 * 60 * 1000 });
      r = refresh(["--verify"]);
    }
    if (r.status !== 0) throw new Error(`refresh failed (${r.status}): ${(r.stderr || r.stdout).slice(-800)}`);
    const summary = JSON.parse(r.stdout.trim().split("\n").at(-1));
    const diffFile = path.join(repo, "work/cc-diff.md");
    const diff = existsSync(diffFile) ? readFileSync(diffFile, "utf8").trim() : "";
    if (!dryRun) writeStatus(repo, { checked: this.checkedLabel(now), sources: { ...summary.sources, version: fingerprint.version, integrity: fingerprint.integrity }, changed: Boolean(diff) });
    if (diff && !dryRun) appendChangelog(repo, `Claude Code ${fingerprint.version}`, diff);
    gate(repo);
    if (dryRun) return { published: false, summary, wouldPublish: true };
    await publish(repo, { origin: this.origin, message: `Refresh for Claude Code ${fingerprint.version}\n\n${diff.slice(0, 3000) || "No prompt or reference changes; provenance moved to the new build."}` });
    return { published: true, summary };
  }
};
