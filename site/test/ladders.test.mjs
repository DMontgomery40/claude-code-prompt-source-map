import assert from "node:assert/strict";
import test from "node:test";
import { MECHANISMS } from "../../extract/decisions-lib.mjs";
import { enhanceLadders, ladderScript, ladderStyles, readScenario, writeScenario } from "../src/ladders.mjs";

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
  assert.match(out, /<option value="">not set<\/option><option value="0">5<\/option><option value="1">1h \(1 hour\)<\/option><option value="2">2h \(invalid\)<\/option>/);
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

test("reader notes follow the rungs; maintainer details stay out of the page", () => {
  const d = { ...decision, notes: ["Files live in <home>/memory."], details: "evidence: offset 123" };
  const out = enhanceLadders('<h4 id="x--prompt-cache-ttl">Prompt cache TTL</h4><p>q</p><ol><li>r</li></ol><ul><li>Files live</li></ul>', [d]);
  assert.match(out, /<\/ol><ul class="notes"><li>Files live in &lt;home&gt;\/memory\.<\/li><\/ul>/);
  assert.doesNotMatch(out, /evidence: offset 123/);
  assert.match(out, /<ul class="ladder-static"><li>Files live<\/li>/, "the static notes list is hidden with the rest");
});

test("a scenario value containing commas survives the query round trip", () => {
  const entries = [["enable1h"], ["allowRules", "Bash(git:*),Read"], ["ctx.kind", "a,b:c"], ["limit.cap"]];
  const search = writeScenario("?q=x%2Cy&other=1", "permission-rules", entries);
  assert.deepEqual(readScenario(search, "permission-rules"), entries.map(([k, v]) => [k, v]));
  assert.equal(new URLSearchParams(search).get("q"), "x,y");
  assert.doesNotMatch(search, /permission-rules=[^&]*,/, "separators and value commas stay encoded");
  assert.equal(readScenario(writeScenario(search, "permission-rules", []), "permission-rules").length, 0);
});

test("the page script carries the scenario helpers and qualifies a remote winner", () => {
  assert.match(ladderScript, /function readScenario\(/);
  assert.match(ladderScript, /function writeScenario\(/);
  assert.match(ladderScript, /r\.mechanism === "remote"\) why\.push\(" \(Anthropic can change this without a release\)"\)/);
});

test("every rung mechanism has a label and its own color, legible on every card surface", () => {
  const luminance = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const colors = new Map();
  for (const m of ladderStyles.matchAll(/((?:\.ladder \.mech\.[a-z]+,?)+)\{color:(#[0-9a-f]{6})\}/g)) for (const [, name] of m[1].matchAll(/\.mech\.([a-z]+)/g)) colors.set(name, m[2]);
  const html = '<h4 id="prompt-cache-ttl">Prompt cache TTL</h4>';
  for (const mechanism of MECHANISMS) {
    const out = enhanceLadders(html, [{ ...decision, rungs: [{ ...decision.rungs[0], mechanism }] }]);
    assert.match(out, new RegExp(`<span class="mech ${mechanism}">[a-z]+</span>`), `${mechanism} has no label`);
    assert.ok(colors.has(mechanism), `${mechanism} has no color`);
    for (const surface of ["#171816", "#1e2718", "#141513"]) assert.ok(contrast(colors.get(mechanism), surface) >= 4.5, `${mechanism} ${colors.get(mechanism)} on ${surface}`);
  }
  assert.ok([...colors].every(([k, c]) => k === "session" || c !== colors.get("session")), "session shares a color with another mechanism");
  assert.match(enhanceLadders(html, [{ ...decision, rungs: [{ ...decision.rungs[0], mechanism: "session" }] }]), /<span class="mech session">session<\/span>/);
});
