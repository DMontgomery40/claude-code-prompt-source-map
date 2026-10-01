import assert from "node:assert/strict";
import test from "node:test";
import { MAX_ATTEMPTS_PER_DAY, markNotified, migrateState, pendingFailure, recordFailure, retryDecision, shouldNotify } from "../lib/failure.mjs";

const day1 = Date.parse("2026-10-01T10:00:00Z"), later = Date.parse("2026-10-01T22:00:00Z"), day2 = Date.parse("2026-10-02T01:00:00Z");

test("a failed version is retried every cycle until the daily cap, then the next day", () => {
  let failure = null;
  for (let i = 0; i < MAX_ATTEMPTS_PER_DAY; i += 1) {
    assert.equal(retryDecision(failure, { key: "v1", head: "abc", now: day1 }).retry, true);
    failure = recordFailure(failure, { key: "v1", head: "abc", now: day1 });
  }
  assert.equal(failure.attempts, MAX_ATTEMPTS_PER_DAY);
  const capped = retryDecision(failure, { key: "v1", head: "abc", now: later });
  assert.equal(capped.retry, false);
  assert.match(capped.reason, /tomorrow or after a code change/);
  assert.equal(retryDecision(failure, { key: "v1", head: "abc", now: day2 }).retry, true);
  assert.equal(recordFailure(failure, { key: "v1", head: "abc", now: day2 }).attempts, 1);
});

test("new code retries a capped failure at once and restarts the count", () => {
  let failure = null;
  for (let i = 0; i < MAX_ATTEMPTS_PER_DAY; i += 1) failure = recordFailure(failure, { key: "v1", head: "abc", now: day1 });
  assert.deepEqual(retryDecision(failure, { key: "v1", head: "def", now: later }), { retry: true, reason: "the code changed since it failed" });
  assert.equal(recordFailure(failure, { key: "v1", head: "def", now: later }).attempts, 1);
});

test("a newer upstream version is never held back by an older failure", () => {
  const failure = { key: "v1", head: "abc", day: "2026-10-01", attempts: 99 };
  assert.equal(retryDecision(failure, { key: "v2", head: "abc", now: day1 }).retry, true);
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
  assert.equal(pendingFailure(s), true);
  assert.equal(retryDecision(s.failure, { key: "v1", head: "abc", now: day1 }).retry, true);
  assert.equal(pendingFailure(migrateState({ fingerprint: "v0" })), false);
});
