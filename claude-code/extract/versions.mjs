// Which Claude Code release to follow, and whether a release is newer than the one the
// published records describe. Shared by extract/refresh.mjs and the watcher's cc target,
// so neither can move the records back to an older build.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// npm dist-tags worth following: `next` carries a build before `latest` does.
export const TRACKED_TAGS = ["latest", "next"];

// Semver order: numeric parts first; a prerelease sorts before its release.
export function compareVersions(a, b) {
  const [mainA, preA] = String(a).split(/-(.*)/s), [mainB, preB] = String(b).split(/-(.*)/s);
  const x = mainA.split(".").map(Number), y = mainB.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return Math.sign(d);
  }
  if (!preA || !preB) return preA ? -1 : preB ? 1 : 0;
  const p = preA.split("."), q = preB.split(".");
  for (let i = 0; i < Math.max(p.length, q.length); i++) {
    if (p[i] === undefined) return -1;
    if (q[i] === undefined) return 1;
    const numeric = /^\d+$/.test(p[i]) && /^\d+$/.test(q[i]);
    const d = numeric ? Number(p[i]) - Number(q[i]) : p[i].localeCompare(q[i]);
    if (d) return Math.sign(d);
  }
  return 0;
}

// The newest version among the tracked tags of an `npm view <pkg> dist-tags` object.
export function newestTracked(distTags, tags = TRACKED_TAGS) {
  const versions = tags.map(t => distTags?.[t]).filter(v => typeof v === "string" && v);
  if (!versions.length) throw new Error(`none of the dist-tags ${tags.join(", ")} is set`);
  return versions.reduce((best, v) => (compareVersions(v, best) > 0 ? v : best));
}

// The release the published records describe (tools.json first, as refresh.mjs has always read it).
export function describedVersion(root) {
  const read = file => (existsSync(path.join(root, file)) ? JSON.parse(readFileSync(path.join(root, file), "utf8")) : null);
  return read("outputs/tools.json")?.version ?? read("outputs/status.json")?.sources?.version ?? null;
}
