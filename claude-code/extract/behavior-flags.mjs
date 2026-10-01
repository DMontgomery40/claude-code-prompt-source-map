// Flags prompt edits that may change model behaviour, for security researchers to read first.
// For every successor pair (old text -> the new text that replaced it), Jev answers whether the
// edit grants autonomy, loosens a restriction, adds a capability, changes data handling or adds
// persistence, or is wording only. Uncalibrated review signals; see tools/behavior-flags/core.mjs.
//   node extract/behavior-flags.mjs <previous-work-dir> <new-work-dir> [<previous-outputs-dir>]
// Reads <new-work-dir>/successors.json and writes <new-work-dir>/behavior-flags.json.
// Exit 75 (JEV_TEMPFAIL_EXIT): Jev unavailable; verdicts so far are cached for the next run.
import path from "node:path";
import { decisionConfig } from "../../codex/extract/codex/lib/jev-provider.mjs";
import { flagRelease } from "../../tools/behavior-flags/core.mjs";

const root = new URL("../", import.meta.url).pathname;
const [prevDir, newDir, outputsDir = path.join(root, "outputs")] = process.argv.slice(2);
const { code, doc } = await flagRelease({
  prevDir, newDir, outputsDir,
  cacheFile: process.env.BEHAVIOR_FLAGS_CACHE || path.join(root, "work/behavior-flag-verdicts.json"),
  config: decisionConfig(),
  log: message => console.error(`[behavior-flags] ${message}`)
});
if (doc) {
  const count = flag => doc.pairs.filter(p => p.flag === flag).length;
  console.log(JSON.stringify({ pairs: doc.pairs.length, likely: count("likely"), possible: count("possible"), wording_only: count("wording only") }));
}
process.exit(code);
