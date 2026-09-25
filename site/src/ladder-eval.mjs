// Decides which rung of a decision ladder takes effect for a scenario. The page serializes
// these functions into its script, and extract/probe.mjs uses them for expected results, so
// the ladder a reader plays with is the ladder the probes test. Keep this file free of
// imports and closures over module state: evaluateLadder.toString() must run on its own.
//
//   scenario = { context: { kind, auth, ... }, set: { rungId: value | true },
//                bypass: { id: true }, constraints: { id: true } }
export function evaluateLadder(decision, scenario) {
  const ctx = scenario.context ?? {}, set = scenario.set ?? {};
  const holds = (when, value) => Object.entries(when).every(([key, allowed]) => allowed.includes(
    key === "value" ? value : key.startsWith("rung.") ? set[key.slice(5)] : ctx[key]
  ));
  const any = (list, value) => (list ?? []).some(when => holds(when, value));
  const applies = rung => !rung.applies_when?.length || any(rung.applies_when);
  const active = c => scenario.constraints?.[c.id] === true || Boolean(c.applies_when?.length && any(c.applies_when));
  const effect = (rung, input) => {
    if ("value" in rung.effect) return rung.effect.value;
    if (rung.effect.from === "input") return input;
    return rung.effect.by_context.find(entry => holds(entry.when ?? {}, input))?.value;
  };
  for (const bypass of decision.bypasses ?? []) {
    if (scenario.bypass?.[bypass.id] && (!bypass.applies_when?.length || any(bypass.applies_when))) {
      return { value: bypass.effect.value, rung: null, contributors: [], skipped: [], bypassedBy: bypass.id };
    }
  }
  const skipped = [], answers = [];
  for (const rung of decision.rungs) {
    if (!applies(rung)) continue;
    let input;
    if (rung.input) {
      input = set[rung.id];
      if (input === undefined || input === false || input === "") continue;
      if (rung.accepts && !rung.accepts.includes(input)) { skipped.push(rung.id); continue; }
      if (any(rung.skip_when, input)) { skipped.push(rung.id); continue; }
    }
    const value = effect(rung, input);
    const vetoingConstraint = (decision.constraints ?? []).find(c => active(c) && c.skip_values?.includes(value));
    if (vetoingConstraint) { skipped.push(rung.id); continue; }
    answers.push({ rung: rung.id, value });
  }
  const merging = decision.shape === "merge" || (decision.shape === "layered" && any(decision.merge_when));
  let result;
  if (merging) {
    let kept = answers;
    for (const c of decision.constraints ?? []) if (active(c) && c.keep_rungs) kept = kept.filter(a => c.keep_rungs.includes(a.rung));
    const value = [];
    for (const a of kept) for (const item of [].concat(a.value)) if (!value.some(v => JSON.stringify(v) === JSON.stringify(item))) value.push(item);
    result = { value, rung: null, contributors: kept.map(a => a.rung), skipped, bypassedBy: null };
  } else {
    const first = answers[0];
    result = { value: first ? first.value : decision.fallback?.value ?? null, rung: first?.rung ?? null, contributors: first ? [first.rung] : [], skipped, bypassedBy: null };
  }
  for (const c of decision.constraints ?? []) {
    if (!active(c)) continue;
    if (c.effect) result = { ...result, value: c.effect.value, constrainedBy: c.id };
    if (c.cap) {
      const capValue = "value" in c.cap ? c.cap.value : c.cap.by_context.find(entry => holds(entry.when ?? {}, result.value))?.value;
      if (capValue !== undefined && Number(result.value) > Number(capValue)) result = { ...result, value: capValue, constrainedBy: c.id };
    }
    if (c.replace_values && result.value in c.replace_values) result = { ...result, value: c.replace_values[result.value], constrainedBy: c.id };
  }
  return result;
}

// Rungs a scenario actually tests: removing the rung's input changes the outcome.
export function exercisedRungs(decision, scenario) {
  const outcome = JSON.stringify(evaluateLadder(decision, scenario).value);
  return Object.keys(scenario.set ?? {}).filter(id => {
    const set = { ...scenario.set };
    delete set[id];
    return JSON.stringify(evaluateLadder(decision, { ...scenario, set }).value) !== outcome;
  });
}
