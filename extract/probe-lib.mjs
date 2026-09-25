// Runs Claude Code against a local recorder (nothing reaches Anthropic) with rungs set in
// combination, and reads what the resulting request carried.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { evaluateLadder } from "../site/src/ladder-eval.mjs";

const KEY = "sk-ant-capture-placeholder-0123456789";

export const observers = {
  cache_ttl(body) {
    const marks = [];
    const walk = v => { if (v && typeof v === "object") { if (v.cache_control) marks.push(v.cache_control.ttl ?? "5m"); for (const k in v) walk(v[k]); } };
    walk(body);
    return !marks.length ? "none" : marks.includes("1h") ? "1h" : "5m";
  },
  model: body => body.model,
  effort: body => body.output_config?.effort ?? "none",
  max_tokens: body => String(body.max_tokens),
  thinking: body => body.thinking?.type ?? "none",
  betas: (body, beta) => (beta ?? "").split(",").filter(Boolean).sort()
};

const fill = (template, value) => JSON.parse(JSON.stringify(template).replaceAll("{value}", value === true ? "1" : String(value)));

// Context values that can run locally; the first realizable value of each key is the base.
function baseContext(d) {
  const ctx = {};
  for (const c of d.context ?? []) {
    const value = c.values.map(v => v.value).find(v => d.realize_context?.[c.key]?.[v] !== null && d.realize_context?.[c.key]?.[v] !== undefined);
    if (value === undefined) return null;
    ctx[c.key] = value;
  }
  return ctx;
}

export function casesFor(d) {
  const context = baseContext(d);
  if (!context) return [];
  const settable = d.rungs.filter(r => r.input && r.realize && !(r.applies_when?.length && !r.applies_when.some(w => Object.entries(w).every(([k, v]) => k === "value" || v.includes(context[k])))));
  const values = r => r.input === "toggle" ? [true] : [...(r.accepts ?? []), ...(r.invalid_example ? [r.invalid_example] : [])];
  const label = (r, v) => v === true ? r.id : `${r.id}=${v}${r.accepts && !r.accepts.includes(v) ? " (invalid)" : ""}`;
  const build = (name, pairs) => {
    const env = {}, settings = {}, args = [], set = {};
    for (const [r, v] of pairs) {
      set[r.id] = v;
      const x = fill(r.realize, v);
      Object.assign(env, x.env ?? {}); Object.assign(settings, x.settings ?? {}); args.push(...(x.args ?? []));
    }
    return { name, scenario: { context, set }, env, settings: Object.keys(settings).length ? settings : null, args };
  };
  const cases = [];
  for (const r of settable) for (const v of values(r)) cases.push(build(`${label(r, v)} alone`, [[r, v]]));
  // A pair only proves order when the lower rung alone would give a different outcome.
  const outcome = set => JSON.stringify(evaluateLadder(d, { context, set }).value);
  for (let i = 0; i + 1 < settable.length; i += 1) {
    const hi = settable[i], lo = settable[i + 1];
    const hv = values(hi).find(v => v === true || hi.accepts?.includes(v));
    const lv = values(lo).filter(v => v === true || lo.accepts?.includes(v)).find(v => outcome({ [hi.id]: hv, [lo.id]: v }) !== outcome({ [lo.id]: v }));
    if (lv !== undefined) cases.push(build(`${label(hi, hv)} over ${label(lo, lv)}`, [[hi, hv], [lo, lv]]));
  }
  for (const p of d.probes ?? []) {
    const pairs = Object.entries(p.set).map(([id, v]) => [d.rungs.find(r => r.id === id), v]);
    if (pairs.every(([r]) => r?.realize)) cases.push(build(p.name, pairs));
  }
  return cases;
}

export async function startRecorder() {
  let requests = [];
  const server = createServer((req, res) => {
    let body = ""; req.on("data", c => (body += c));
    req.on("end", () => {
      if (req.url.startsWith("/v1/messages")) requests.push({ body: JSON.parse(body), beta: req.headers["anthropic-beta"] ?? "" });
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "probe" } }));
    });
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  return { port: server.address().port, take: () => { const r = requests; requests = []; return r; }, close: () => server.close() };
}

export async function runClaude(binary, { env = {}, settings = null, args = [], port }) {
  const root = mkdtempSync(path.join(os.tmpdir(), "cc-probe-")), home = path.join(root, "home"), work = path.join(root, "work");
  mkdirSync(path.join(home, ".claude"), { recursive: true }); mkdirSync(work);
  const project = { hasTrustDialogAccepted: true, hasCompletedProjectOnboarding: true };
  const config = { hasCompletedOnboarding: true, numStartups: 5, customApiKeyResponses: { approved: [KEY.slice(-20)], rejected: [] }, projects: { [work]: project, [`/private${work}`]: project } };
  for (const f of [path.join(home, ".claude.json"), path.join(home, ".claude", ".claude.json")]) writeFileSync(f, JSON.stringify(config));
  if (settings) writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify(settings));
  const child = spawn(binary, ["-p", "Reply with OK.", ...args], { cwd: work, stdio: "ignore", env: { PATH: process.env.PATH, HOME: home, CLAUDE_CONFIG_DIR: path.join(home, ".claude"), ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}`, ...env } });
  const timer = setTimeout(() => child.kill("SIGKILL"), 90000);
  await new Promise(r => child.on("exit", r));
  clearTimeout(timer);
  rmSync(root, { recursive: true, force: true });
}
