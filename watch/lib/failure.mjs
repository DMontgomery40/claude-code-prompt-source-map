// A failed upstream version is never given up on: the watcher keeps repairing it until it ships.
// What a failure blocks is only how often it is retried. Each target keeps one record,
//   { key, head, day, attempts, notifiedDay }
// key: the upstream fingerprint that failed; head: the repo commit it failed on; attempts: failed
// cycles on that UTC day. The same version is retried every cycle until MAX_ATTEMPTS_PER_DAY failed
// cycles that day; then it waits for the next day, or for new code (a different head), whichever
// comes first. Each failed cycle may start repair agents, so the cap is also the daily spending cap.

export const MAX_ATTEMPTS_PER_DAY = 4;
// Repair agents per failed gate in one cycle (each is rerun against the gate).
export const GATE_REPAIRS_PER_CYCLE = 2;

const utcDay = now => new Date(now).toISOString().slice(0, 10);

// Should this cycle try `key` again? Returns { retry, reason }.
export function retryDecision(failure, { key, head, now }) {
  if (!failure || failure.key !== key) return { retry: true, reason: "not a known failure" };
  if (failure.head !== head) return { retry: true, reason: "the code changed since it failed" };
  if (failure.day !== utcDay(now)) return { retry: true, reason: "a new day" };
  if ((failure.attempts ?? 0) < MAX_ATTEMPTS_PER_DAY) return { retry: true, reason: `attempt ${(failure.attempts ?? 0) + 1} of ${MAX_ATTEMPTS_PER_DAY} today` };
  return { retry: false, reason: `${failure.attempts} failed attempts today; retrying tomorrow or after a code change` };
}

// The record after another failed cycle on `key`.
export function recordFailure(failure, { key, head, now }) {
  const day = utcDay(now);
  const same = failure?.key === key && failure.day === day && failure.head === head;
  return { key, head, day, lastAt: now, attempts: same ? (failure.attempts ?? 0) + 1 : 1, notifiedDay: failure?.key === key ? failure.notifiedDay ?? null : null };
}

// Notify once per version per day, so an outage or a stubborn failure doesn't page every hour.
export function shouldNotify(failure, now) {
  return failure?.notifiedDay !== utcDay(now);
}
export const markNotified = (failure, now) => ({ ...failure, notifiedDay: utcDay(now) });

// A target with a pending failure is due again after `gapMs` (a target can set retryGapMs; a
// retry that reruns paid review agents should not run hourly), or at once when the code changed,
// whatever its normal cadence: Claude Code is checked daily, but a failed version should not wait
// a day for its next repair.
export const DEFAULT_RETRY_GAP_MS = 3600e3;
export const pendingFailure = s => Boolean(s?.failure);
export function failureDue(failure, { head, now, gapMs = DEFAULT_RETRY_GAP_MS }) {
  if (!failure) return false;
  return failure.head !== head || now - (failure.lastAt ?? 0) >= gapMs - 5 * 60e3;
}

// Older state kept failedFingerprint: a version skipped until a newer one shipped. Treat it as a
// failure on unknown code, so the next cycle retries it.
export function migrateState(s) {
  if (s && s.failedFingerprint && !s.failure) s.failure = { key: s.failedFingerprint, head: null, day: null, attempts: 0, notifiedDay: null };
  if (s) delete s.failedFingerprint;
  return s;
}
