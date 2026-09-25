import assert from "node:assert/strict";
import test from "node:test";
import { enhanceLadders, ladderScript } from "../src/ladders.mjs";

const decision = { id: "ttl", title: "Prompt cache TTL", question: "q", shape: "first-wins",
  context: [{ key: "kind", label: "Request", values: [{ value: "main", label: "Main" }] }],
  rungs: [{ id: "a", mechanism: "env", knob: "env-a", label: "A_VAR", input: "toggle", note: "n", effect: { value: "5m" }, verified: "tested" },
          { id: "d", mechanism: "remote", knob: null, label: "Allowlist", input: null, note: "n", effect: { value: "1h" }, verified: "read" }] };

test("each decision heading gets an interactive card and the data once", () => {
  const html = '<h4 id="prompt-cache-ttl">Prompt cache TTL</h4><ol class="static"><li>x</li></ol>';
  const out = enhanceLadders(html, [decision]);
  assert.match(out, /<div class="ladder" data-decision="ttl">/);
  assert.match(out, /<span class="mech env">env<\/span>/);
  assert.match(out, /<span class="mech remote">remote<\/span>/);
  assert.match(out, /class="knob-name plain">Allowlist</);
  assert.equal((out.match(/id="ladder-data"/g) ?? []).length, 1);
  const withProof = enhanceLadders(html, [{ ...decision, provenance: [{ file: "x.js" }], rungs: decision.rungs.map(r => ({ ...r, provenance: [{ file: "x.js" }], realize: { env: {} } })) }]);
  assert.doesNotMatch(withProof.slice(withProof.indexOf('id="ladder-data"')), /provenance|realize/, "the page data carries the ladder only");
});

test("the page script carries the evaluator", () => {
  assert.match(ladderScript, /function evaluateLadder/);
  assert.match(ladderScript, /function appliesTo/);
  assert.doesNotThrow(() => new Function(ladderScript));
});

test("the card sits between the question and the static lists, which it marks for hiding", () => {
  const html = '<h3 id="g">Prompt caching</h3><h4 id="what-wins-md--prompt-cache-ttl">Prompt cache TTL</h4><p>q</p><ul><li>Before</li></ul><ol class="static"><li>x</li></ol><p>Source</p>'
    + '<h4 id="what-wins-md--other">Other</h4><p>q2</p><ol><li>y</li></ol>';
  const out = enhanceLadders(html, [decision]);
  const at = s => out.indexOf(s);
  assert.ok(at("<p>q</p>") < at('<div class="ladder"') && at('<div class="ladder"') < at('<ul class="ladder-static">'));
  assert.match(out, /<ol class="static ladder-static">/);
  assert.match(out, /<h4 id="what-wins-md--other">Other<\/h4><p>q2<\/p><ol><li>y/, "a heading with no decision is left alone");
  assert.equal((out.match(/class="ladder"/g) ?? []).length, 1);
});

test("controls carry indexes and typed values map back through them", () => {
  const d = { ...decision, value_labels: { "1h": "1 hour" },
    context: [{ key: "kind", label: "Request", values: [{ value: "main", label: "Main" }, { value: false, label: "It's off" }] }],
    rungs: [{ id: "c", mechanism: "settings", knob: "s-c", label: "ttl", input: "choice", accepts: [5, "1h"], invalid_example: "2h", effect: { from: "input" } },
            { id: "t", mechanism: "env", knob: "e-t", label: "T", input: "choice", effect: { from: "input" } }] };
  const out = enhanceLadders('<h4 id="x--prompt-cache-ttl">Prompt cache TTL</h4>', [d]);
  assert.match(out, /<option value="">not set<\/option><option value="0">5<\/option><option value="1">1 hour<\/option><option value="2">2h \(invalid\)<\/option>/);
  assert.match(out, /<input type="text" class="value"/, "a choice with no accepted list takes free text");
  assert.match(out, /<button type="button" data-i="1" aria-pressed="false">It&#39;s off<\/button>/);
});

test("constraints get a toggle only when the reader can turn one on", () => {
  const d = { ...decision,
    bypasses: [{ id: "off", knob: "env-off", knob_title: "OFF_VAR", effect: { value: "none" }, note: "Before <all>." }],
    constraints: [
      { id: "limit", label: "Model's limit", applies_when: [{}], cap: { value: "1h" } },
      { id: "cloud", label: "Cloud only", applies_when: [{ kind: ["cloud"] }], cap: { value: "1h" } },
      { id: "veto", knob: "setting-veto", knob_title: "vetoSetting", note: "Passes over 5m.", skip_values: ["5m"] },
      { id: "info", label: "Checked elsewhere", note: "Not part of the ladder." }] };
  const out = enhanceLadders('<h4 id="x--prompt-cache-ttl">Prompt cache TTL</h4>', [d]);
  assert.match(out, /data-constraint="veto"/);
  assert.doesNotMatch(out, /data-constraint="(limit|cloud|info)"/);
  assert.match(out, /Always applies/);
  assert.match(out, /<code>OFF_VAR<\/code>/);
  assert.match(out, /Before &lt;all&gt;\./);
  assert.match(out, /<code>vetoSetting<\/code>/);
});
