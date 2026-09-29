import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { candidateDecision, localReviewFor, promptReviews, publishDecision } from "../prompt-reviews.mjs";

const candidate = { hash: "test-hash", file: "feature.js", text: "Read the selected Page before editing." };
const review = model_facing => ({ hash: candidate.hash, model_facing, source_file: candidate.file,
  text_sha256: crypto.createHash("sha256").update(candidate.text).digest("hex"), reason: "Exact source reviewed." });

test("local positive publishes with a boolean origin and no fabricated probability", () => {
  const decision = candidateDecision(candidate, null, new Map([[candidate.hash, review(true)]]));
  assert.equal(decision.origin, "local-source-review");
  assert.equal(decision.p, null);
  assert.equal(decision.model_facing, true);
  assert.equal(publishDecision(decision), true);
});

test("local negative overrides a cached positive without changing its probability", () => {
  const decision = candidateDecision(candidate, 0.99, new Map([[candidate.hash, review(false)]]));
  assert.equal(decision.p, 0.99);
  assert.equal(decision.origin, "local-source-review");
  assert.equal(decision.model_facing, false);
  assert.equal(publishDecision(decision), false);
});

test("unknown stays unknown; cached Jev retains its distinct origin and threshold", () => {
  const empty = new Map();
  assert.equal(candidateDecision(candidate, null, empty).origin, "unknown");
  assert.equal(publishDecision(candidateDecision(candidate, null, empty)), false);
  assert.equal(candidateDecision(candidate, 0.81, empty).origin, "jev");
  assert.equal(candidateDecision(candidate, 0.81, empty).model_facing, null);
  assert.equal(publishDecision(candidateDecision(candidate, 0.81, empty)), true);
  assert.equal(publishDecision(candidateDecision(candidate, 0.79, empty)), false);
});

test("local reviews require exact full text and reviewed source even if short hash matches", () => {
  const reviews = new Map([[candidate.hash, review(true)]]);
  assert.ok(localReviewFor(candidate, reviews));
  assert.equal(localReviewFor({ ...candidate, text: candidate.text + "changed" }, reviews), null);
  assert.equal(localReviewFor({ ...candidate, file: "new-build.js" }, reviews), null);
  assert.equal(localReviewFor(candidate, new Map([[candidate.hash, { ...review(true), model_facing: 0.9 }]])), null);
});

test("build 12246 reviews are explicit boolean decisions bound to full text digests", () => {
  assert.equal(promptReviews.size, 87);
  assert.equal([...promptReviews.values()].filter(review => review.model_facing).length, 66);
  for (const [hash, item] of promptReviews) {
    assert.equal(hash, item.hash);
    assert.equal(typeof item.model_facing, "boolean");
    assert.match(item.text_sha256, /^[0-9a-f]{64}$/);
    assert.ok(item.reason && item.source_file);
  }
});
