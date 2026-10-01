// When the gate fails on content or code, the watcher repairs it instead of giving up on the
// version: a headless agent gets the failing output, fixes the cause, and the gate runs again,
// up to GATE_REPAIRS_PER_CYCLE times in one cycle. What the repairs changed outside the cycle's
// own product files is committed with the publish, but only inside REPAIRABLE and never a
// PROTECTED file: an edit to a test or a lint exemption list, or anything elsewhere, is put back
// and reported for a person. A failure that survives the repairs is retried on later cycles
// (lib/failure.mjs).
import { GATE_REPAIRS_PER_CYCLE } from "./failure.mjs";
import { GateFailure, repairExcerpt } from "./publish.mjs";

const REPAIRABLE = ["claude-code/", "codex/", "tools/", "site/"];
// Tests and the narrative lint's exemption lists decide what passes; a repair may not change them.
const PROTECTED = /(?:^|\/)narrative-lint\.json$|(?:^|\/)test\/|\.test\.[cm]?js$/;

export function sortRepairPaths(paths) {
  const keep = [], blocked = [];
  for (const file of paths) (REPAIRABLE.some(dir => file.startsWith(dir)) && !PROTECTED.test(file) ? keep : blocked).push(file);
  return { keep, blocked };
}

// runGate() throws on failure; repair(error, attempt) fixes; dirty() returns the dirty paths;
// restore(paths) puts files back. Returns { repaired, blocked }: the files the repairs changed
// that are kept (not in `produced`), and those that were put back. A failure that is not a
// GateFailure (a Jev outage, a moved main) is thrown at once. Any failure after a repair ran
// carries `afterAgent` (the cycle spent agent work), `repairedPaths` and `blockedPaths`.
export async function gateWithRepairs({ runGate, repair, dirty, restore, produced = [], repairs = GATE_REPAIRS_PER_CYCLE, log = () => {} }) {
  const own = new Set(produced), changed = new Set(), blocked = new Set();
  for (let attempt = 0; ; attempt += 1) {
    try {
      await runGate();
      return { repaired: [...changed].sort(), blocked: [...blocked].sort() };
    } catch (error) {
      if (!(error instanceof GateFailure) || attempt >= repairs) {
        if (attempt > 0) error.afterAgent = true;
        error.repairedPaths = [...changed].sort();
        error.blockedPaths = [...blocked].sort();
        throw error;
      }
      log(`gate failed (${error.check}); repair ${attempt + 1} of ${repairs}: ${error.message.slice(0, 200)}`);
      const before = dirty();
      await repair(error, attempt);
      const sorted = sortRepairPaths([...dirty()].filter(file => !before.has(file) && !own.has(file)));
      if (sorted.blocked.length) {
        restore(sorted.blocked);
        log(`repair changed files it may not; put back: ${sorted.blocked.join(", ")}`);
      }
      sorted.keep.forEach(file => changed.add(file));
      sorted.blocked.forEach(file => blocked.add(file));
    }
  }
}

export function gateRepairTask(error, targetNames) {
  return `The watcher refreshed ${targetNames.join(" and ")} and the publishing gate failed: ${error.check}. Nothing was published. Make the gate pass so this release ships.

Failing output (failing tests first, then the end of the output):

~~~~~~text
${repairExcerpt(error.output)}
~~~~~~

What to do:
- Find the cause and fix it, then run \`npm run check\` at the repo root until it exits 0. For a leak-check or narrative-lint failure, fix what it names; the lint wants {{count:…}} or {{value:…}} tokens instead of typed statistics about this reference.
- Edit only files under claude-code/, codex/, tools/ or site/. Changes anywhere else are discarded.
- Tests, test fixtures and the narrative-lint.json exemption lists are not yours to change: edits to them are discarded. If a test or an exemption is wrong, say so and why in your report.
- Regenerate generated outputs by running their generators; don't hand-edit them.
- Report the cause, what you changed, and the final \`npm run check\` result.`;
}
