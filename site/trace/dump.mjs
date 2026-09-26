#!/usr/bin/env node
// Runs the Trace adapters on disk files and writes the model JSON (no block text).
//   node site/trace/dump.mjs <file|dir>... [--root <id>] [--index reference-index.json] [--out model.json] [--roundtrip] [--narrow-only]
// Directories are walked recursively. --roundtrip re-reads every BlockRef and
// checks the bytes decode to one parseable line.
import { open, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadTrace, narrowByHint } from "./loader.js";
import { readRef, readRefLine } from "./model.js";

// A lazily opened file: stat is known up front, the handle opens on the first read
// (so a whole ~/.codex/sessions tree can be listed without thousands of open files).
export function nodeSource(path, size) {
  let fhp = null;
  const src = {
    name: path,
    size,
    opened: false,
    async slice(a, b) {
      if (!fhp) { fhp = open(path, "r"); src.opened = true; }
      const fh = await fhp;
      const len = Math.max(0, Math.min(b, size) - a);
      const buf = new Uint8Array(len);
      let got = 0;
      while (got < len) {
        const { bytesRead } = await fh.read(buf, got, len - got, a + got);
        if (!bytesRead) break;
        got += bytesRead;
      }
      return got === len ? buf : buf.subarray(0, got);
    },
    async close() { if (fhp) { const fh = await fhp; fhp = null; await fh.close(); } },
  };
  return src;
}

async function walk(p, out) {
  const s = await stat(p);
  if (s.isDirectory()) for (const n of (await readdir(p)).sort()) await walk(join(p, n), out);
  else if (/\.(jsonl|json|txt)$/.test(p)) out.push({ path: p, size: s.size });
  return out;
}

export async function entriesFor(paths) {
  const files = [];
  for (const p of paths) await walk(resolve(p), files);
  return files.map(({ path, size }) => ({ path, source: nodeSource(path, size) }));
}

async function main() {
  const args = process.argv.slice(2);
  const opt = { root: null, out: null, roundtrip: false, index: null };
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--root") opt.root = args[++i];
    else if (args[i] === "--out") opt.out = args[++i];
    else if (args[i] === "--roundtrip") opt.roundtrip = true;
    else if (args[i] === "--narrow-only") opt.narrowOnly = true;
    else if (args[i] === "--index") opt.index = JSON.parse(await readFile(args[++i], "utf8"));
    else paths.push(args[i]);
  }
  if (!paths.length) { console.error("usage: dump.mjs <file|dir>... [--root id] [--out file] [--roundtrip]"); process.exit(2); }
  const t0 = performance.now();
  const entries = await entriesFor(paths);
  const t1 = performance.now();
  if (opt.narrowOnly) {
    // Counts and timings only: no file names or content from other sessions.
    const hit = await narrowByHint(entries, opt.root);
    const t2 = performance.now();
    const opened = entries.filter((e) => e.source.opened).length;
    const f = hit && hit.found;
    console.error(`entries ${entries.length} (list ${(t1 - t0).toFixed(0)} ms); narrow ${(t2 - t1).toFixed(0)} ms; files opened ${opened}; ` +
      (f ? `found ${f.product}: ${f.files} files (${f.subagents} subagents${f.guardians != null ? `, ${f.guardians} guardians` : ""}${f.toolResults != null ? `, ${f.toolResults} tool-results` : ""}); sniffed ${f.sniffed}${f.fullReads != null ? `, full first-line reads ${f.fullReads}` : ""}` : "not found"));
    for (const e of entries) await e.source.close();
    return;
  }
  const { trace, sources } = await loadTrace(entries, { root: opt.root, index: opt.index });
  const t2 = performance.now();
  const reqs = trace.agents.reduce((n, a) => n + a.requests.length, 0);
  const blocks = trace.agents.reduce((n, a) => n + a.blocks.length, 0);
  const bytes = trace.files.reduce((n, f) => n + f.size, 0);
  console.error(`${trace.product}: ${trace.agents.length} agents, ${reqs} requests, ${blocks} blocks, ${(bytes / 1e6).toFixed(1)} MB in ${trace.files.length} files; open ${(t1 - t0).toFixed(0)} ms, parse ${(t2 - t1).toFixed(0)} ms`);
  if (opt.roundtrip) {
    let n = 0, bad = 0;
    for (const a of trace.agents) for (const b of a.blocks) {
      const line = await readRefLine(sources[b.ref.file], b.ref);
      try { JSON.parse(line); await readRef(sources[b.ref.file], b.ref); n++; } catch (e) { if (bad++ < 5) console.error("roundtrip fail", a.id, b.i, b.label, e.message); }
    }
    console.error(`roundtrip: ${n} ok, ${bad} failed (${(performance.now() - t2).toFixed(0)} ms)`);
  }
  if (opt.out) await writeFile(opt.out, JSON.stringify(trace));
  else process.stdout.write(JSON.stringify(trace));
  for (const s of sources) s.close && (await s.close());
  for (const e of entries) e.source.close && (await e.source.close().catch(() => {}));
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("dump.mjs")) main().catch((e) => { console.error(e); process.exit(1); });
