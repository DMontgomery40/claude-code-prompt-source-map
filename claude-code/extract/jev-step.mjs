// How a refresh step that asks Jev ends. The verdict cache is saved whether the work finishes or
// not, so finished verdicts are never asked again. When Jev is unavailable the step exits
// JEV_TEMPFAIL_EXIT (75): refresh.mjs passes that on and the watcher retries the release later
// instead of marking it failed. Any other error is a bug and propagates as before.
import { JEV_TEMPFAIL_EXIT, JevUnavailableError } from "../../codex/extract/codex/lib/jev-provider.mjs";

export async function keepVerdicts(cache, work, { exit = code => process.exit(code), log = message => console.error(message) } = {}) {
  let result;
  try {
    result = await work();
  } catch (error) {
    cache.save();
    if (!(error instanceof JevUnavailableError)) throw error;
    log(`${error.message}; ${cache.size} cached verdicts kept; retry later (exit ${JEV_TEMPFAIL_EXIT})`);
    return exit(JEV_TEMPFAIL_EXIT);
  }
  cache.save();
  return result;
}
