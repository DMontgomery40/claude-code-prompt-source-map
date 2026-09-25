// Hourly entry point (LaunchAgent). Decides which targets are due, fingerprints them
// cheaply, and only refreshes, gates, and publishes when a source actually changed.
//   node watch.mjs                 normal run
//   node watch.mjs --dry-run       everything up to and including the gate, no publish
//   node watch.mjs --force <name>  ignore cadence and fingerprint for one target
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { pushWithinBudget } from "./lib/publish.mjs";
import { log, notify } from "./lib/run.mjs";
import { cc } from "./targets/cc.mjs";
import { codex } from "./targets/codex.mjs";

const here = new URL(".", import.meta.url).pathname;
const stateFile = `${here}state.json`;
const lockFile = `${here}.lock`;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forced = args.includes("--force") ? args[args.indexOf("--force") + 1] : null;
const targets = [codex, cc];

// The lock names its process. A run killed outright (it happened once, most likely an
// iCloud-evicted file under ~/Documents) leaves the file behind; the next run takes over
// instead of waiting out the three-hour window.
const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
if (existsSync(lockFile)) {
  const [pid, started] = readFileSync(lockFile, "utf8").trim().split(" ").map(Number);
  if (started && Date.now() - started < 3 * 3600e3 && pid && alive(pid)) {
    log("another run holds the lock; exiting");
    process.exit(0);
  }
  log(`taking over a stale lock${pid ? ` from pid ${pid}` : ""}`);
}
writeFileSync(lockFile, `${process.pid} ${Date.now()}`);
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : {};
const save = () => writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);

try {
  const now = Date.now();
  for (const target of targets) {
    const s = (state[target.name] ??= {});
    // Commits that waited for the GitHub budget go out as soon as a slot is free (never in a dry run).
    if (!dryRun) try { if (target.repo) pushWithinBudget(target.repo); } catch (error) { log(`${target.name}: pending push failed: ${error.message}`); }
    const due = forced === target.name || !s.lastCheck || now - s.lastCheck >= target.intervalMs(now) - 5 * 60e3;
    if (!due) continue;
    let fingerprint;
    try {
      fingerprint = target.fingerprint();
    } catch (error) {
      log(`${target.name}: fingerprint error: ${error.message}`);
      if (s.lastError !== error.message) notify(`${target.name} watcher`, `Fingerprint failed: ${error.message}`);
      s.lastError = error.message;
      continue;
    }
    s.lastCheck = now;
    const key = JSON.stringify(fingerprint);
    if (forced !== target.name && key === s.fingerprint) { log(`${target.name}: unchanged`); save(); continue; }
    if (forced !== target.name && key === s.failedFingerprint) { log(`${target.name}: changed, but this version already failed; waiting for a newer one`); save(); continue; }
    log(`${target.name}: changed ${s.fingerprint ?? "(first run)"} -> ${key}`);
    try {
      const result = await target.refresh({ now, dryRun, fingerprint, previous: s.fingerprint ? JSON.parse(s.fingerprint) : null });
      if (!dryRun) { s.fingerprint = key; delete s.failedFingerprint; delete s.lastError; }
      log(`${target.name}: ${result.published ? "published" : result.wouldPublish ? "would publish (dry run)" : "no content change"} ${JSON.stringify(result.summary?.changed ?? [])}`);
      if (result.published) notify(`${target.origin.replace("https://", "")} updated`, `${result.summary?.changed?.length ?? 0} documents changed`);
    } catch (error) {
      log(`${target.name}: refresh failed: ${error.message}`);
      if (!dryRun) s.failedFingerprint = key;
      notify(`${target.name} watcher`, `Refresh failed, nothing published: ${error.message}`);
    }
    save();
  }
} finally {
  save();
  rmSync(lockFile, { force: true });
}
