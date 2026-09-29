// Hourly entry point (LaunchAgent). Decides which targets are due, fingerprints them cheaply,
// refreshes the ones whose sources changed, then gates, deploys and commits once for the one site.
//   node watch/watch.mjs                 normal run
//   node watch/watch.mjs --dry-run       everything up to and including the gate; no deploy, commit
//                                        or push, and the files the run produced are restored
//   node watch/watch.mjs --force <name>  ignore cadence and fingerprint for one target (codex|cc);
//                                        with --dry-run the gate runs even when nothing changed
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { commitPaths, deploy, dirtyPaths, foreignChanges, gate, producedSince, pushWithinBudget, restore, ROOT } from "./lib/publish.mjs";
import { confirmChange } from "./lib/confirm.mjs";
import { log, notify, run } from "./lib/run.mjs";
import { cc } from "./targets/cc.mjs";
import { codex } from "./targets/codex.mjs";

// A skipped deploy that should run again next cycle for the same upstream version.
class Retry extends Error {}
const here = new URL(".", import.meta.url).pathname;
const stateFile = `${here}state.json`;
const lockFile = `${here}.lock`;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forced = args.includes("--force") ? args[args.indexOf("--force") + 1] : null;
const targets = [codex, cc];
if (forced && !targets.some(t => t.name === forced)) { console.error(`unknown target ${forced}; use ${targets.map(t => t.name).join(" or ")}`); process.exit(1); }

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
const productDir = target => path.relative(ROOT, target.repo);

try {
  const now = Date.now();
  // Uncommitted work by someone else under the site's inputs would be deployed without being
  // committed. Wait for it to be committed (or dropped) instead; a dry run only warns.
  const blocked = foreignChanges();
  if (blocked.length) {
    const summary = `${blocked.length} uncommitted path(s) under the site's inputs: ${blocked.slice(0, 5).join(", ")}${blocked.length > 5 ? ", …" : ""}`;
    if (!dryRun) {
      log(`paused: ${summary}`);
      if (state.blockedBy !== summary) notify("harness watcher paused", summary);
      state.blockedBy = summary;
      throw new Paused();
    }
    log(`dry run: would pause for ${summary}`);
  }
  delete state.blockedBy;

  // The watcher runs from its own clone (~/harness-watch). Start every cycle from GitHub's main:
  // fast-forward, or rebase commits that waited for the push budget; a conflict pauses the cycle.
  if (!dryRun) syncWithOrigin();
  // Commits that waited for the GitHub budget go out as soon as a slot is free (never in a dry run).
  if (!dryRun) try { pushWithinBudget(ROOT); } catch (error) { log(`pending push failed: ${error.message}`); }

  const before = dirtyPaths();
  const cycle = [];
  for (const target of targets) {
    const s = (state[target.name] ??= {});
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
    if (forced !== target.name) {
      const needsConfirm = Boolean(target.needsConfirmation?.(fingerprint, s.fingerprint ? JSON.parse(s.fingerprint) : null));
      const c = confirmChange({ key, published: s.fingerprint, pending: s.pending ?? null, needsConfirm });
      if (!dryRun) { if (c.pending) s.pending = c.pending; else delete s.pending; }
      if (c.flippedBack) {
        log(`${target.name}: upstream went back to the published version; two versions are being served`);
        if (!dryRun && (!s.flipNotified || now - s.flipNotified > 24 * 3600e3)) {
          notify(`${target.name} watcher`, "Upstream is alternating between two versions; only a version seen on two checks in a row is published");
          s.flipNotified = now;
        }
      }
      if (!c.run) {
        log(`${target.name}: ${key === s.fingerprint ? "unchanged" : "changed, seen once; publishing if the next check sees it again"}`);
        save();
        continue;
      }
    }
    if (forced !== target.name && key === s.failedFingerprint) { log(`${target.name}: changed, but this version already failed; waiting for a newer one`); continue; }
    log(`${target.name}: changed ${s.fingerprint ?? "(first run)"} -> ${key}`);
    const claimed = new Set([...before, ...cycle.flatMap(c => c.produced)]);
    try {
      const result = await target.refresh({ now, dryRun, fingerprint, previous: s.fingerprint ? JSON.parse(s.fingerprint) : null });
      const produced = producedSince(claimed, productDir(target));
      if (result.publish) {
        log(`${target.name}: ${dryRun ? "would publish" : "to publish"}: ${result.publish.message.split("\n")[0]} (${produced.length} file(s): ${produced.slice(0, 12).join(", ")}${produced.length > 12 ? ", …" : ""})`);
        cycle.push({ target, s, key, result, produced });
      } else {
        // Nothing to publish: files that changed only byte-wise (sources.json fetch times) go back.
        restore(produced);
        log(`${target.name}: no content change ${JSON.stringify(result.summary?.changed ?? [])}${result.note ? ` (${result.note})` : ""}`);
        if (!dryRun) { s.fingerprint = key; delete s.failedFingerprint; delete s.lastError; }
      }
    } catch (error) {
      restore(producedSince(claimed, productDir(target)));
      log(`${target.name}: refresh failed: ${error.message}`);
      if (!dryRun) s.failedFingerprint = key;
      notify(`${target.name} watcher`, `Refresh failed, nothing published: ${error.message}`);
    }
    save();
  }

  const publishing = cycle.filter(c => c.result.publish);
  const gated = publishing.length ? publishing.map(c => c.target) : dryRun && forced ? targets.filter(t => t.name === forced) : [];
  const allProduced = publishing.flatMap(c => c.produced);
  if (gated.length) {
    try {
      await gate(gated.map(t => t.repo));
      log(`gate passed (${gated.map(t => t.name).join(", ")})`);
      if (dryRun) {
        log(publishing.length ? `dry run: would deploy and commit ${publishing.map(c => c.target.name).join(", ")}` : "dry run: nothing to publish");
      } else {
        // Someone may have changed the site's inputs while the cycle ran; don't deploy their work.
        const late = foreignChanges(new Set(allProduced));
        if (late.length) throw new Retry(`uncommitted changes appeared during the run, not deploying: ${late.slice(0, 5).join(", ")}`);
        // Someone else may have pushed (and deployed) a newer site while the cycle ran; deploying
        // this checkout would roll it back. Skip and try again next hour from the new main.
        run("git", ["fetch", "-q", "origin"], { cwd: ROOT });
        if (run("git", ["merge-base", "--is-ancestor", "origin/main", "HEAD"], { cwd: ROOT }).status !== 0) throw new Retry("GitHub's main moved during the run; not deploying over it (next cycle starts from it)");
        const unverified = await deploy(publishing.map(c => c.target.section));
        if (unverified.length) notify("harness watcher", `Deployed, but not yet serving the new build: ${unverified.join(", ")}`);
        for (const c of publishing) {
          commitPaths(c.produced, `${c.result.publish.message}\n\nPublished by the watcher (watch/watch.mjs).`);
          c.result.publish.onPublished?.();
          c.s.fingerprint = c.key; delete c.s.failedFingerprint; delete c.s.lastError;
          notify(`${c.target.origin.replace("https://", "")} updated`, c.result.publish.message.split("\n")[0]);
        }
        // Deployed and committed; a failed push waits for the next cycle's sync.
        try { pushWithinBudget(ROOT); } catch (error) { log(`push failed, retried next cycle: ${error.message}`); }
      }
    } catch (error) {
      log(`publish failed: ${error.message}`);
      restore(allProduced);
      // A retry is not this version's failure: the same fingerprint publishes next cycle.
      if (!dryRun && !(error instanceof Retry)) for (const c of publishing) c.s.failedFingerprint = c.key;
      notify("harness watcher", `Nothing published: ${error.message.slice(0, 200)}`);
    }
  }
  // A dry run leaves the checkout as it found it.
  if (dryRun) restore(allProduced);
} catch (error) {
  if (!(error instanceof Paused)) throw error;
} finally {
  save();
  rmSync(lockFile, { force: true });
}

function Paused() {}

function syncWithOrigin() {
  const git = (...a) => run("git", a, { cwd: ROOT });
  if (git("fetch", "-q", "origin").status !== 0) { log("fetch failed; continuing from the local main"); return; }
  if (git("merge-base", "--is-ancestor", "HEAD", "origin/main").status === 0) {
    if (git("merge", "--ff-only", "-q", "origin/main").status !== 0) { notify("harness watcher paused", "could not fast-forward to origin/main"); throw new Paused(); }
    return;
  }
  if (git("merge-base", "--is-ancestor", "origin/main", "HEAD").status === 0) return; // local commits wait for the budget
  if (git("rebase", "-q", "origin/main").status !== 0) {
    git("rebase", "--abort");
    log("paused: local commits conflict with origin/main");
    notify("harness watcher paused", "Its unpushed commits conflict with GitHub's main; resolve in the watcher clone");
    throw new Paused();
  }
  log("rebased waiting commits onto origin/main");
}
