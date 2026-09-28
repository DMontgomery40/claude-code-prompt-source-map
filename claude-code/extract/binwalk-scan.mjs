#!/usr/bin/env node
// Binwalk scan of the Claude Code native binary, every release: every embedded payload binwalk 3
// reports is carved at its offset and size, hashed, decoded when compressed, identified by its
// structure, placed relative to the __BUN section (the embedded JavaScript and assets that
// bun-extract.py unpacks) and, inside it, to the embedded file it belongs to, then diffed
// against the committed scan. Writes:
//   outputs/binwalk-scan.md     the live page for this release
//   outputs/binwalk-scan.json   every payload with offsets, sizes, hashes and identification
//   work/binwalk-diff.md        new, removed and changed payloads (absent when none)
// and prints one JSON summary line. The scanning core (and the reason binwalk runs with -x svg)
// is in codex/extract/codex/binwalk-scan.mjs.
//
// The binary is the release the refresh downloaded: work/releases/<version>/package/claude,
// version from work/current.json. A path argument overrides it.
// Exit codes: 0 done; 2 no downloaded release binary; 3 binwalk is missing or failed; 1 anything else.
//
// Usage: node extract/binwalk-scan.mjs [path/to/claude]

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BinwalkError, EXCLUDED, NOISE, SCAN_VERSION, binwalkVersion, cachedScan, committedJson, diffScans, hex, renderDiff, scanFile, signatureTable
} from "../../codex/extract/codex/binwalk-scan.mjs";

// The __BUN,__bun section of a Mach-O 64 binary: { offset, size } or null.
export function bunSection(buf) {
  if (buf.length < 32 || buf.readUInt32LE(0) !== 0xfeedfacf) return null;
  const ncmds = buf.readUInt32LE(16);
  let at = 32;
  for (let i = 0; i < ncmds && at + 8 <= buf.length; i += 1) {
    const cmd = buf.readUInt32LE(at), size = buf.readUInt32LE(at + 4);
    if (cmd === 0x19) {
      const segname = buf.subarray(at + 8, at + 24).toString("latin1").replace(/\0+$/, "");
      const nsects = buf.readUInt32LE(at + 64);
      for (let s = 0; s < nsects; s += 1) {
        const sect = at + 72 + s * 80;
        const sectname = buf.subarray(sect, sect + 16).toString("latin1").replace(/\0+$/, "");
        if (segname === "__BUN" && sectname === "__bun") return { offset: buf.readUInt32LE(sect + 48), size: Number(buf.readBigUInt64LE(sect + 40)) };
      }
    }
    at += size;
  }
  return null;
}

// Embedded-file locator from bun-extract.py's manifest (absolute file offsets).
export function embeddedLocator(manifest) {
  const files = (manifest?.files ?? []).filter(f => Number.isFinite(f.file_offset)).sort((a, b) => a.file_offset - b.file_offset);
  return offset => {
    let lo = 0, hi = files.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1, f = files[mid];
      if (f.file_offset + f.length <= offset) lo = mid + 1;
      else if (f.file_offset > offset) hi = mid - 1;
      else return f.name;
    }
    return null;
  };
}

export function renderClaudeCodePage(scan) {
  const t = scan.targets[0];
  const found = t.payloads.filter(p => !NOISE.has(p.signature));
  const bun = scan.bun_section;
  const lines = [
    "# Binwalk scan of the Claude Code binary (this release)",
    "",
    `Every embedded payload binwalk ${scan.binwalk} reports in the Claude Code ${scan.version} native binary for macOS arm64, regenerated for each release. Each payload is carved at binwalk's offset and size, hashed, decompressed when it is compressed, identified by its structure, and placed relative to the \`__BUN\` section, which holds the embedded JavaScript and assets the rest of this site is extracted from. A new, removed or changed payload between releases is reported by the watcher.`,
    "",
    "## Scanned file",
    "",
    "| File | Size | SHA-256 | __BUN section | Signatures | Findings |",
    "| --- | ---: | --- | --- | --- | ---: |",
    `| \`${t.path}\` | ${t.size.toLocaleString("en-US")} | \`${t.sha256.slice(0, 12)}\` | ${bun ? `\`${bun.offset_hex}\`, ${bun.size.toLocaleString("en-US")} bytes` : "not found"} | ${signatureTable(t.signature_counts)} | ${found.length} |`,
    "",
    `Signatures counted only (${[...NOISE].join(", ")}) are icons, license text and hash-constant tables; each is still hashed and diffed release to release. SVG images are counted by this scanner's bounded search because binwalk runs with \`-x svg\` (its SVG check takes minutes on this binary's JavaScript).`,
    "",
    "## Findings",
    ""
  ];
  if (!found.length) lines.push("No payloads beyond the counted signatures.", "");
  else {
    lines.push("| Offset | Signature | Size | Decoded | SHA-256 | Where | Identified as |", "| --- | --- | ---: | ---: | --- | --- | --- |");
    for (const p of found) {
      const where = p.in_bun_section ? `__BUN${p.inside ? `: \`${p.inside}\`` : ""}` : "outside __BUN";
      const what = [p.decoded?.kind ?? p.identified ?? "", p.decoded?.nested_signatures && Object.keys(p.decoded.nested_signatures).length ? `contains ${signatureTable(p.decoded.nested_signatures)}` : "", p.decoded?.error ? `decode failed: ${p.decoded.error}` : ""].filter(Boolean).join("; ");
      lines.push(`| \`${p.offset_hex}\` (${p.offset}) | ${p.signature} | ${p.size.toLocaleString("en-US")} | ${p.decoded?.size != null ? p.decoded.size.toLocaleString("en-US") : ""} | \`${(p.decoded?.sha256 ?? p.sha256 ?? "").slice(0, 16)}\` | ${where} | ${what} |`);
    }
    lines.push("");
  }
  lines.push("## Reproduce", "", "In the unpacked `@anthropic-ai/claude-code-darwin-arm64` package:", "", "```sh",
    "binwalk -x svg -l claude.json package/claude",
    "binwalk -x svg -e -C extract-claude package/claude",
    "```", "", "Regenerated by `claude-code/extract/binwalk-scan.mjs`.");
  return `${lines.join("\n")}\n`;
}

function main() {
  // BINWALK_SCAN_ROOT redirects outputs/ and work/ (tests only).
  const root = process.env.BINWALK_SCAN_ROOT || path.resolve(import.meta.dirname, "..");
  const work = path.join(root, "work");
  const current = (() => { try { return JSON.parse(fs.readFileSync(path.join(work, "current.json"), "utf8")); } catch { return null; } })();
  const version = current?.version ?? null;
  const binary = process.argv[2] ?? (version ? path.join(work, "releases", version, "package", "claude") : null);
  if (!binary || !fs.existsSync(binary)) {
    console.error(`binwalk scan: no downloaded Claude Code release binary (${binary ? path.relative(root, binary) : "work/current.json has no version"}); run extract/refresh.mjs first`);
    process.exit(2);
  }
  const workDir = path.join(work, "binwalk");
  const started = Date.now();
  let result, binwalk, bun;
  try {
    binwalk = binwalkVersion();
    const head = fs.readFileSync(binary);
    bun = bunSection(head);
    const manifestFile = path.join(path.dirname(path.dirname(binary)), "embedded-manifest.json");
    const manifest = (() => { try { return JSON.parse(fs.readFileSync(manifestFile, "utf8")); } catch { return null; } })();
    const locate = embeddedLocator(manifest);
    result = cachedScan(binary, {
      workDir,
      key: "claude",
      scan: () => scanFile(binary, {
        workDir,
        annotate: p => {
          p.in_bun_section = Boolean(bun && p.offset >= bun.offset && p.offset < bun.offset + bun.size);
          if (p.in_bun_section && !NOISE.has(p.signature)) { const inside = locate(p.offset); if (inside) p.inside = inside; }
        }
      })
    });
  } catch (error) {
    if (error instanceof BinwalkError) { console.error(`binwalk scan: ${error.message}`); process.exit(3); }
    throw error;
  }
  const { cached, ...target } = result;
  const shown = `@anthropic-ai/claude-code-darwin-arm64@${version ?? "?"}/package/claude`;
  const scan = {
    product: "Claude Code", version, binwalk,
    scanner: { version: SCAN_VERSION, excluded_signatures: EXCLUDED },
    bun_section: bun ? { offset: bun.offset, offset_hex: hex(bun.offset), size: bun.size } : null,
    // Diffs match targets by role, not by the versioned path.
    targets: [{ path: "Claude Code native binary (macOS arm64)", package_path: shown, role: "Claude Code native binary", present: true, ...target }],
    methods: {}
  };
  const md = renderClaudeCodePage({ ...scan, targets: [{ ...scan.targets[0], path: shown }] });
  const json = `${JSON.stringify(scan, null, 1)}\n`;
  for (const [name, text] of [["binwalk-scan.md", md], ["binwalk-scan.json", json]]) {
    if (/\/Users\/|\/home\/[a-z]|\/private\/var\//.test(text)) throw new Error(`${name} contains a local path; refusing to write outputs`);
  }
  const previous = committedJson(root, "outputs/binwalk-scan.json");
  const diffText = previous ? renderDiff(`Binwalk: Claude Code ${version}`, diffScans(previous, scan)) : "";
  const diffFile = path.join(work, "binwalk-diff.md");
  fs.mkdirSync(work, { recursive: true });
  if (diffText) fs.writeFileSync(diffFile, diffText); else fs.rmSync(diffFile, { force: true });
  fs.mkdirSync(path.join(root, "outputs"), { recursive: true });
  fs.writeFileSync(path.join(root, "outputs", "binwalk-scan.md"), md);
  fs.writeFileSync(path.join(root, "outputs", "binwalk-scan.json"), json);
  console.log(JSON.stringify({
    generator: "binwalk-scan", product: "claude-code", version, binwalk,
    cached, findings: target.payloads.filter(p => !NOISE.has(p.signature)).length,
    baseline: previous ? "HEAD" : "none", diff: diffText ? "work/binwalk-diff.md" : null, seconds: Number(((Date.now() - started) / 1000).toFixed(1))
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); } catch (error) { console.error(`binwalk scan: ${error.stack ?? error.message}`); process.exit(1); }
}
