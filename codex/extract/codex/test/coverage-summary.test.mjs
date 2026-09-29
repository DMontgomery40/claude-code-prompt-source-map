import test from 'node:test';
import assert from 'node:assert/strict';
import { coverageTotals } from '../lib/coverage-summary.mjs';

test('overview follows a changed candidate universe rather than historical totals', () => {
  const candidates = [{kind:'endpoints',triage_score:0.9},{kind:'endpoints',triage_score:0.49},{kind:'i18n_namespaces',triage_score:0.5}];
  assert.deepEqual(coverageTotals({candidates,scope:{candidates:355,classifier_positive:287}}),{candidates:3,positive:2,positiveEndpoints:1});
  candidates.push({kind:'endpoints',triage_score:0.8});
  assert.deepEqual(coverageTotals({candidates}),{candidates:4,positive:3,positiveEndpoints:2});
});

test('missing or unscored evidence cannot be presented as classifier-positive', () => {
  assert.throws(() => coverageTotals({}),/candidate records/);
  assert.deepEqual(coverageTotals({candidates:[{kind:'endpoints'},{kind:'endpoints',triage_score:null}]}),{candidates:2,positive:0,positiveEndpoints:0});
});
