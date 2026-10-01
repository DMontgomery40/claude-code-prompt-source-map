import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ATTEMPTS_PER_DAY, failureDue, markNotified, migrateState, recordFailure, retryDecision, shouldNotify } from "../lib/failure.mjs";

const day1 = Date.parse("2026-10-01T10:00:00Z"), later = Date.parse("2026-10-01T22:00:00Z"), day2 = Date.parse("2026-10-02T01:00:00Z");

test("a failed version is retried until the daily cap, then the next day", () => {
  let failure = null;
  for (let i = 0; i < MAX_ATTEMPTS_PER_DAY; i += 1) {
    assert.equal(retryDecision(failure, { key: "v1", now: day1 }).retry, true);
    failure = recordFailure(failure, { key: "v1", head: "abc", now: day1 });
  }
  assert.equal(failure.attempts, MAX_ATTEMPTS_PER_DAY);
  const capped = retryDecision(failure, { key: "v1", now: later });
  assert.equal(capped.retry, false);
  assert.match(capped.reason, /retried tomorrow/);
  assert.equal(retryDecision(failure, { key: "v1", now: day2 }).retry, true);
  assert.equal(recordFailure(failure, { key: "v1", head: "abc", now: day2 }).attempts, 1);
});

test("new code neither resets the daily count nor skips the gap", () => {
  let failure = null;
  // The watcher's own publishes move main every cycle: each attempt fails on a different head.
  for (let i = 0; i < MAX_ATTEMPTS_PER_DAY; i += 1) failure = recordFailure(failure, { key: "v1", head: `head-${i}`, now: day1 + i * 3600e3 });
  assert.equal(failure.attempts, MAX_ATTEMPTS_PER_DAY);
  assert.equal(retryDecision(failure, { key: "v1", now: later }).retry, false);
  assert.equal(failureDue(failure, { now: failure.lastAt + 3600e3, gapMs: 4 * 3600e3 }), false);
});

test("a newer upstream version is never held back by an older failure", () => {
  const failure = { key: "v1", head: "abc", day: "2026-10-01", attempts: 99 };
  assert.equal(retryDecision(failure, { key: "v2", now: day1 }).retry, true);
});

test("a pending failure is due after its gap", () => {
  const now = Date.parse("2026-10-01T12:00:00Z");
  const failure = { key: "v1", lastAt: now - 2 * 3600e3 };
  assert.equal(failureDue(undefined, { now }), false);
  assert.equal(failureDue(failure, { now }), true);
  assert.equal(failureDue(failure, { now, gapMs: 4 * 3600e3 }), false);
  assert.equal(failureDue(failure, { now: now + 2 * 3600e3, gapMs: 4 * 3600e3 }), true);
});

test("notifications go out once per version per day", () => {
  let failure = recordFailure(null, { key: "v1", head: "abc", now: day1 });
  assert.equal(shouldNotify(failure, day1), true);
  failure = markNotified(failure, day1);
  assert.equal(shouldNotify(recordFailure(failure, { key: "v1", head: "abc", now: later }), later), false);
  assert.equal(shouldNotify(failure, day2), true);
  assert.equal(recordFailure(failure, { key: "v2", head: "abc", now: later }).notifiedDay, null);
});

test("old failedFingerprint state becomes a failure that the next cycle retries", () => {
  const s = migrateState({ fingerprint: "v0", failedFingerprint: "v1" });
  assert.equal(s.failedFingerprint, undefined);
  assert.equal(failureDue(s.failure, { now: day1, gapMs: 4 * 3600e3 }), true);
  assert.equal(retryDecision(s.failure, { key: "v1", now: day1 }).retry, true);
  assert.equal(migrateState({ fingerprint: "v0" }).failure, undefined);
});
