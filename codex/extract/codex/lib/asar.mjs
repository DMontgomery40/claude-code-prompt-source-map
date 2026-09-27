import crypto from "node:crypto";
import fs from "node:fs";

// Minimal read-only reader for Electron's asar format: an 8-byte pickle size
// prefix, a pickled JSON header, then file bytes addressed by offset.
export function openAsar(asarPath) {
  const bytes = fs.readFileSync(asarPath);
  const headerSize = bytes.readUInt32LE(4);
  const jsonSize = bytes.readUInt32LE(12);
  const header = JSON.parse(bytes.subarray(16, 16 + jsonSize).toString("utf8"));
  const dataBase = 8 + headerSize;

  const entries = [];
  (function walk(files, parent) {
    for (const [name, entry] of Object.entries(files ?? {})) {
      const entryPath = parent ? `${parent}/${name}` : name;
      if (entry.files) walk(entry.files, entryPath);
      else if (entry.size != null && entry.offset != null && !entry.unpacked) {
        const start = dataBase + Number(entry.offset);
        entries.push({ path: entryPath, start, end: start + Number(entry.size) });
      }
    }
  })(header.files, "");
  entries.sort((a, b) => a.start - b.start);

  const cache = new Map();
  return {
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    entries,
    // JavaScript files outside third-party dependencies: the only places a
    // Codex-authored prompt can live.
    appScripts: entries.filter(entry =>
      /\.(?:m?js|cjs)$/.test(entry.path) && !entry.path.split("/").includes("node_modules")
    ),
    bytesOf(entry) {
      return bytes.subarray(entry.start, entry.end);
    },
    textOf(entry) {
      if (!cache.has(entry.path)) cache.set(entry.path, bytes.subarray(entry.start, entry.end).toString("utf8"));
      return cache.get(entry.path);
    },
    fileSha256(entry) {
      return crypto.createHash("sha256").update(bytes.subarray(entry.start, entry.end)).digest("hex");
    },
    // Every app script containing the exact phrase, with the match count per file.
    findPhrase(phrase) {
      const needle = Buffer.from(phrase, "utf8");
      const hits = [];
      for (const entry of this.appScripts) {
        const view = bytes.subarray(entry.start, entry.end);
        let at = view.indexOf(needle);
        let count = 0;
        while (at >= 0) {
          count += 1;
          at = view.indexOf(needle, at + needle.length);
        }
        if (count) hits.push({ entry, count });
      }
      return hits;
    }
  };
}

export function byteOffset(text, charIndex) {
  return Buffer.byteLength(text.slice(0, charIndex), "utf8");
}
