// Brings every published record up to a new Claude Code release, mechanically where it can.
//   node extract/refresh.mjs <version> <npm-integrity>            refresh
//   node extract/refresh.mjs <version> <npm-integrity> --verify   check after a review
// Exit 0: done (work/cc-diff.md is empty when nothing a reader would notice changed).
// Exit 3: done, but records need a review; work/cc-diff.md says which and why.
// Exit 2: a source or extractor broke; outputs are restored to the previous release.
// Exit 1: any other failure; outputs are restored.
// The last stdout line is JSON: {changed, needs_review, sources}.
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const [version, integrity, flag] = process.argv.slice(2);
// Scheduled runs don't inherit a shell profile; the TypeSafe key lives in ~/.env.
if (!process.env.TYPESAFE_API_KEY) {
  try {
    for (const line of readFileSync(path.join(process.env.HOME, ".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?(TYPESAFE_API_KEY)\s*=\s*["']?([^"'\s]+)/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}
const root = new URL("../", import.meta.url).pathname;
const work = path.join(root, "work");
const release = path.join(work, "releases", version);
const node = process.execPath;
const npm = path.join(path.dirname(process.execPath), "npm");
const log = message => console.error(`[refresh ${version}] ${message}`);
const run = (cmd, args, options = {}) => {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8", maxBuffer: 512 * 1024 * 1024, timeout: 30 * 60 * 1000, ...options });
  if (r.status !== 0) throw Object.assign(new Error(`${path.basename(cmd)} ${args.slice(0, 2).join(" ")} failed: ${(r.stderr || r.stdout || r.error?.message || "").slice(-1500)}`), { code: options.breakCode ?? 1 });
  return r.stdout;
};
const readJson = file => JSON.parse(readFileSync(file, "utf8"));
const status = existsSync(path.join(root, "outputs/status.json")) ? readJson(path.join(root, "outputs/status.json")) : null;
const previousVersion = readJson(path.join(root, "outputs/tools.json")).version ?? status?.sources?.version;

function* provenanceObjects(v) {
  if (Array.isArray(v)) for (const x of v) yield* provenanceObjects(x);
  else if (v && typeof v === "object") {
    if (typeof v.binary_offset === "number" && typeof v.file === "string") yield v;
    for (const x of Object.values(v)) yield* provenanceObjects(x);
  }
}
const areaFiles = () => readdirSync(path.join(root, "outputs")).filter(f => f.endsWith(".json") && !["status.json"].includes(f));

// --verify: after a review, every record must be current and match the release bytes.
if (flag === "--verify") {
  const manifest = new Map(readJson(path.join(work, "embedded-manifest.json")).files.map(f => [f.name.replace("/$bunfs/root/", ""), f]));
  const problems = [];
  for (const name of areaFiles()) {
    const data = readJson(path.join(root, "outputs", name));
    for (const item of data.items ?? []) {
      if (item.needs_review) problems.push(`${name}:${item.id} still needs review`);
      for (const p of provenanceObjects(item)) {
        const f = manifest.get(p.file);
        if (!f) { problems.push(`${name}:${item.id} cites unknown file ${p.file}`); continue; }
        const buf = readFileSync(path.join(work, "extracted", p.file)).subarray(p.binary_offset - f.file_offset, p.binary_offset - f.file_offset + p.length);
        if (p.sha256 && createHash("sha256").update(buf).digest("hex") !== p.sha256) problems.push(`${name}:${item.id} hash mismatch at ${p.binary_offset}`);
      }
    }
  }
  if (problems.length) { console.error(problems.slice(0, 40).join("\n")); process.exit(1); }
  console.log(JSON.stringify({ changed: [], needs_review: 0, sources: { version, integrity } }));
  process.exit(0);
}

if (previousVersion === version) {
  log("outputs already describe this release");
  console.log(JSON.stringify({ changed: [], needs_review: 0, sources: status?.sources ?? { version, integrity } }));
  process.exit(0);
}

const backup = path.join(work, `outputs-before-${version}`);
rmSync(backup, { recursive: true, force: true });
cpSync(path.join(root, "outputs"), backup, { recursive: true });
const sections = [];
try {
  // 1. The exact release package, integrity-checked.
  mkdirSync(release, { recursive: true });
  const binary = path.join(release, "package/claude");
  if (!existsSync(binary)) {
    const tgzName = JSON.parse(run(npm, ["pack", `@anthropic-ai/claude-code-darwin-arm64@${version}`, "--json"], { cwd: release }))[0].filename;
    const digest = `sha512-${createHash("sha512").update(readFileSync(path.join(release, tgzName))).digest("base64")}`;
    if (digest !== integrity) throw Object.assign(new Error(`integrity mismatch: registry ${integrity}, download ${digest}`), { code: 1 });
    run("tar", ["-xzf", tgzName], { cwd: release });
  }
  const binarySha = createHash("sha256").update(readFileSync(binary)).digest("hex");

  // 2. Extract, then carry every record over by content.
  run("python3", [path.join(root, "extract/bun-extract.py"), binary, release], { breakCode: 2 });
  run(node, ["--max-old-space-size=12000", "extract/relocate.mjs", work, release, version], { breakCode: 2 });
  run(node, ["--max-old-space-size=8192", "extract/successors.mjs", work, release]);
  const relocation = readJson(path.join(release, "relocation-report.json"));
  const successors = readJson(path.join(release, "successors.json"));

  // 3. What the default requests look like now, and what --help says.
  run(node, ["extract/capture.mjs", binary, path.join(release, "capture")], { breakCode: 2 });
  const helpNow = spawnSync(binary, ["--help"], { encoding: "utf8" }).stdout;
  writeFileSync(path.join(release, "help.txt"), helpNow);
  const previousRelease = previousVersion ? path.join(work, "releases", previousVersion) : null;
  const captureDiff = previousRelease && existsSync(path.join(previousRelease, "capture")) ? compareCaptures(path.join(previousRelease, "capture"), path.join(release, "capture")) : [];
  const helpBefore = previousRelease && existsSync(path.join(previousRelease, "help.txt")) ? readFileSync(path.join(previousRelease, "help.txt"), "utf8") : null;
  const helpDiff = helpBefore ? lineDiff(helpBefore, helpNow) : [];

  // 4. The new build becomes current; regenerate the fully mechanical areas.
  const envBefore = new Set(readJson(path.join(root, "outputs/environment-variables.json")).items.map(i => i.title));
  rmSync(path.join(work, "previous"), { recursive: true, force: true });
  mkdirSync(path.join(work, "previous"));
  renameSync(path.join(work, "extracted"), path.join(work, "previous", "extracted"));
  renameSync(path.join(work, "embedded-manifest.json"), path.join(work, "previous", "embedded-manifest.json"));
  renameSync(path.join(release, "extracted"), path.join(work, "extracted"));
  cpSync(path.join(release, "embedded-manifest.json"), path.join(work, "embedded-manifest.json"));
  writeFileSync(path.join(work, "current.json"), JSON.stringify({ version, binary_sha256: binarySha }));
  run(node, ["--max-old-space-size=8192", "extract/env-vars.mjs"], { breakCode: 2 });
  const envAfter = new Set(readJson(path.join(root, "outputs/environment-variables.json")).items.map(i => i.title));
  const envAdded = [...envAfter].filter(x => !envBefore.has(x)), envRemoved = [...envBefore].filter(x => !envAfter.has(x));
  const otherBefore = new Set(existsSync(path.join(root, "outputs/other-model-text.json")) ? readJson(path.join(root, "outputs/other-model-text.json")).items.map(i => i.text) : []);
  run(node, ["extract/candidates.mjs"]);
  run(node, ["extract/classify.mjs"]);
  run(node, ["extract/inventory.mjs"]);
  const newOther = readJson(path.join(root, "outputs/other-model-text.json")).items.filter(i => !otherBefore.has(i.text));

  // 5. One report a person or a reviewing agent can act on.
  const review = Object.values(relocation.areas).flatMap(a => a.changed);
  const reviewIds = new Set(review.map(c => `${c.area}:${c.id}`));
  if (captureDiff.length) sections.push(`### Default requests\n\n${captureDiff.join("\n")}`);
  if (helpDiff.length) sections.push(`### claude --help\n\n~~~~~~diff\n${helpDiff.join("\n")}\n~~~~~~`);
  if (envAdded.length || envRemoved.length) sections.push(`### Environment variables\n\n${envAdded.length ? `Added: ${envAdded.map(x => `\`${x}\``).join(", ")}\n` : ""}${envRemoved.length ? `Removed: ${envRemoved.map(x => `\`${x}\``).join(", ")}` : ""}`);
  if (reviewIds.size) {
    const pairs = new Map(successors.filter(s => s.successor).map(s => [`${s.area}:${s.id}`, s]));
    const lines = [...reviewIds].map(key => {
      const c = review.find(r => `${r.area}:${r.id}` === key);
      const s = pairs.get(key);
      return `- **${c.area}** \`${c.id}\` (${c.title ?? ""}): ${c.reason}${s ? `\n  - old: ${JSON.stringify(s.old_text.slice(0, 240))}\n  - new (Jev confidence ${s.confidence}): ${JSON.stringify(s.successor.slice(0, 240))} in \`${s.successor_file}\`` : ""}`;
    });
    sections.push(`### Records whose source changed (${reviewIds.size})\n\n${lines.join("\n")}`);
  }
  if (newOther.length) sections.push(`### New model-facing text (${newOther.length}, published on "Other model-facing text")\n\n${newOther.slice(0, 40).map(i => `- ${JSON.stringify(i.text.slice(0, 160))}`).join("\n")}`);
  writeFileSync(path.join(work, "cc-diff.md"), sections.length ? `## Claude Code ${version} (from ${previousVersion})\n\n${sections.join("\n\n")}\n` : "");

  // Keep only the two most recent release folders.
  const releases = readdirSync(path.join(work, "releases")).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const old of releases.slice(0, -2)) rmSync(path.join(work, "releases", old), { recursive: true, force: true });

  const changedAreas = [...new Set(review.map(c => c.area))].concat(envAdded.length || envRemoved.length ? ["environment-variables"] : []).concat(newOther.length ? ["other-model-text"] : []);
  console.log(JSON.stringify({ changed: changedAreas, needs_review: reviewIds.size, sources: { version, integrity, binary_sha256: binarySha } }));
  process.exit(reviewIds.size ? 3 : 0);
} catch (error) {
  log(error.message);
  // Restore the previous release's outputs and extraction so the next run starts clean.
  rmSync(path.join(root, "outputs"), { recursive: true, force: true });
  cpSync(backup, path.join(root, "outputs"), { recursive: true });
  if (existsSync(path.join(work, "previous", "extracted")) && !existsSync(path.join(work, "extracted"))) {
    renameSync(path.join(work, "previous", "extracted"), path.join(work, "extracted"));
    renameSync(path.join(work, "previous", "embedded-manifest.json"), path.join(work, "embedded-manifest.json"));
  }
  process.exit(error.code ?? 1);
}

function mainRequest(dir) {
  for (const f of readdirSync(dir).sort()) {
    const body = readJson(path.join(dir, f)).body;
    if (body?.tools?.length) return body;
  }
  return null;
}

function lineDiff(before, after) {
  const a = before.split("\n"), b = after.split("\n");
  const inA = new Set(a), inB = new Set(b);
  return [...a.filter(l => !inB.has(l)).map(l => `- ${l}`), ...b.filter(l => !inA.has(l)).map(l => `+ ${l}`)];
}

function compareCaptures(beforeDir, afterDir) {
  const out = [];
  for (const mode of ["cli", "sdk"]) {
    const a = mainRequest(path.join(beforeDir, mode)), b = mainRequest(path.join(afterDir, mode));
    if (!a || !b) continue;
    const prompt = body => body.system.map(s => s.text).join("\n").replace(/`[^`]*\/memory\/`/g, "`{{MEMORY_DIR}}`");
    const d = lineDiff(prompt(a), prompt(b));
    if (d.length) out.push(`${mode} system prompt:\n\n~~~~~~diff\n${d.join("\n")}\n~~~~~~`);
    const ta = new Map(a.tools.map(t => [t.name, t])), tb = new Map(b.tools.map(t => [t.name, t]));
    const added = [...tb.keys()].filter(k => !ta.has(k)), removed = [...ta.keys()].filter(k => !tb.has(k));
    const described = [...tb.keys()].filter(k => ta.has(k) && ta.get(k).description !== tb.get(k).description);
    const schema = [...tb.keys()].filter(k => ta.has(k) && JSON.stringify(ta.get(k).input_schema) !== JSON.stringify(tb.get(k).input_schema));
    if (added.length || removed.length || described.length || schema.length) out.push(`${mode} tools: ${[added.length && `added ${added.join(", ")}`, removed.length && `removed ${removed.join(", ")}`, described.length && `description changed: ${described.join(", ")}`, schema.length && `input schema changed: ${schema.join(", ")}`].filter(Boolean).join("; ")}`);
  }
  return out;
}
