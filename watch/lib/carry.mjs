// A target's refreshed files that a cycle could not publish (a failed or interrupted refresh, a
// failed gate, a killed run) are carried to that target's next refresh instead of being thrown
// away. Throwing them away put the outputs back on the old release while the gitignored work/
// stayed on the new one, so the next Claude Code refresh relocated from the wrong extraction and
// every paid review ran again. Carried files wait in watch/carried/<target>/ (gitignored) with the
// tree clean, so another target's publish never deploys them; they come back just before their
// target refreshes, and that refresh resumes from them.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const manifestOf = (root, name) => path.join(root, "watch", "carried", name, "manifest.json");

// Copies `paths` (repo-relative) aside for target `name`, then hands them to `restore` so the tree is
// clean. A path missing from the tree was deleted by the refresh and is carried as a deletion.
// Merges with anything already carried for the target.
export function setAside(root, name, paths, restore) {
  if (!paths.length) return [];
  const dir = path.join(root, "watch", "carried", name);
  const manifest = existsSync(manifestOf(root, name)) ? JSON.parse(readFileSync(manifestOf(root, name), "utf8")) : { files: [], deleted: [] };
  for (const file of paths) {
    const from = path.join(root, file);
    manifest.files = manifest.files.filter(f => f !== file);
    manifest.deleted = manifest.deleted.filter(f => f !== file);
    if (existsSync(from)) {
      mkdirSync(path.dirname(path.join(dir, "files", file)), { recursive: true });
      cpSync(from, path.join(dir, "files", file));
      manifest.files.push(file);
    } else manifest.deleted.push(file);
  }
  mkdirSync(dir, { recursive: true });
  writeFileSync(manifestOf(root, name), `${JSON.stringify(manifest, null, 1)}\n`);
  restore(paths);
  return [...manifest.files, ...manifest.deleted].sort();
}

// Puts target `name`'s carried files back into the tree and forgets them. Returns their paths.
export function bringBack(root, name) {
  if (!existsSync(manifestOf(root, name))) return [];
  const dir = path.join(root, "watch", "carried", name);
  const { files, deleted } = JSON.parse(readFileSync(manifestOf(root, name), "utf8"));
  for (const file of files) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    cpSync(path.join(dir, "files", file), path.join(root, file));
  }
  for (const file of deleted) rmSync(path.join(root, file), { force: true });
  rmSync(dir, { recursive: true, force: true });
  return [...files, ...deleted].sort();
}

export const carried = (root, name) => existsSync(manifestOf(root, name));
