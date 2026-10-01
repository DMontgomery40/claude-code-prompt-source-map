// When the gate fails on content or code, the watcher repairs it instead of giving up on the
// version: a headless agent gets the failing output, fixes the cause, and the gate runs again,
// up to GATE_REPAIRS_PER_CYCLE times in one cycle. What the repairs changed outside the cycle's
// own product files is committed with the publish. A failure that survives the repairs is
// retried on later cycles (lib/failure.mjs).
import { GATE_REPAIRS_PER_CYCLE } from "./failure.mjs";
import { GateFailure, repairExcerpt } from "./publish.mjs";

// runGate() throws on failure; repair(error, attempt) fixes; dirty() returns the dirty paths.
// Returns the paths the repairs changed (not in `produced`). A failure that is not a GateFailure
// (a Jev outage, a moved main) is thrown at once; one that outlasts the repairs is thrown with
// `repairedPaths`, so the caller can put those files back.
export async function gateWithRepairs({ runGate, repair, dirty, produced = [], repairs = GATE_REPAIRS_PER_CYCLE, log = () => {} }) {
  const own = new Set(produced), changed = new Set();
  for (let attempt = 0; ; attempt += 1) {
    try {
      await runGate();
      return [...changed].sort();
    } catch (error) {
      if (!(error instanceof GateFailure) || attempt >= repairs) {
        error.repairedPaths = [...changed].sort();
        throw error;
      }
      log(`gate failed (${error.check}); repair ${attempt + 1} of ${repairs}: ${error.message.slice(0, 200)}`);
      const before = dirty();
      await repair(error, attempt);
      for (const file of dirty()) if (!before.has(file) && !own.has(file)) changed.add(file);
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
- You may edit any file under claude-code/, codex/, tools/ or site/ that the fix needs.
- Never make a check pass by deleting, skipping or loosening a test or check, unless the test itself is wrong for a reason you can state; then say why in your report.
- Regenerate generated outputs by running their generators; don't hand-edit them.
- Don't edit watch/ (the watcher running you) or anything under private/.
- Report the cause, what you changed, and the final \`npm run check\` result.`;
}
