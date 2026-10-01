// A failed upstream version is never given up on: the watcher keeps repairing it until it ships.
// What a failure limits is only how often it is retried. Each target keeps one record,
//   { key, head, day, lastAt, attempts, notifiedDay }
// key: the upstream fingerprint that failed; head: the repo commit it last failed on (for the log
// only); attempts: cycles on that UTC day that failed or ran paid agents without shipping. The same
// version is retried after its gap until MAX_ATTEMPTS_PER_DAY such cycles that day, then the next
// day. New code does not reset the count or skip the gap: the watcher's own publishes move main,
// so a head-based reset would let a stuck version spend every hour.

export const MAX_ATTEMPTS_PER_DAY = 4;
// Repair agents per failed gate in one cycle (each is rerun against the gate).
export const GATE_REPAIRS_PER_CYCLE = 2;
export const DEFAULT_RETRY_GAP_MS = 3600e3;

const utcDay = now => new Date(now).toISOString().slice(0, 10);

// Should this cycle try `key` again? Returns { retry, reason }.
export function retryDecision(failure, { key, now }) {
  if (!failure || failure.key !== key) return { retry: true, reason: "not a known failure" };
  if (failure.day !== utcDay(now)) return { retry: true, reason: "a new day" };
  if ((failure.attempts ?? 0) < MAX_ATTEMPTS_PER_DAY) return { retry: true, reason: `attempt ${(failure.attempts ?? 0) + 1} of ${MAX_ATTEMPTS_PER_DAY} today` };
  return { retry: false, reason: `${failure.attempts} attempts today; retried tomorrow` };
}

// The record after another cycle on `key` that failed or spent agent work without shipping.
export function recordFailure(failure, { key, head = null, now }) {
  const day = utcDay(now);
  const same = failure?.key === key && failure.day === day;
  return { key, head, day, lastAt: now, attempts: same ? (failure.attempts ?? 0) + 1 : 1, notifiedDay: failure?.key === key ? failure.notifiedDay ?? null : null };
}

// Notify once per version per day, so a stubborn failure doesn't page every hour.
export function shouldNotify(failure, now) {
  return failure?.notifiedDay !== utcDay(now);
}
export const markNotified = (failure, now) => ({ ...failure, notifiedDay: utcDay(now) });

// A target with a pending failure is due again `gapMs` after it last failed, whatever its normal
// cadence: Claude Code is checked daily, but a failed release should not wait a day. A target can
// set retryGapMs (Claude Code's retry reruns paid review agents, so it waits longer).
export function failureDue(failure, { now, gapMs = DEFAULT_RETRY_GAP_MS }) {
  if (!failure) return false;
  return now - (failure.lastAt ?? 0) >= gapMs - 5 * 60e3;
}

// Older state kept failedFingerprint: a version skipped until a newer one shipped. Treat it as a
// failure with no attempts yet, so the next cycle retries it.
export function migrateState(s) {
  if (s && s.failedFingerprint && !s.failure) s.failure = { key: s.failedFingerprint, head: null, day: null, lastAt: null, attempts: 0, notifiedDay: null };
  if (s) delete s.failedFingerprint;
  return s;
}
