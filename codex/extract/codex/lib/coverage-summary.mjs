export function coverageTotals(coverage) {
  if (!Array.isArray(coverage.candidates)) throw new Error('Coverage ledger lacks candidate records');
  const positive = coverage.candidates.filter(candidate => Number.isFinite(candidate.triage_score) && candidate.triage_score >= 0.5);
  return { candidates: coverage.candidates.length, positive: positive.length, positiveEndpoints: positive.filter(candidate => candidate.kind === 'endpoints').length };
}
