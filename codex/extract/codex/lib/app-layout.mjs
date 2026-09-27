// Where the ChatGPT desktop app keeps the inputs the extraction reads.
//
// Since app build 11431 the Codex CLI ships as a package under Resources/codex-cli:
// codex-package.json names an entrypoint (a shell shim) that execs the real binary inside
// CodexCLI.app. Run the entrypoint, the way the app does; hash and scan the binary, because
// the shim's bytes say nothing about the CLI. An unknown layout is a SourceError, so the
// watcher reports it (or starts a repair) instead of reading the wrong file.
//
//   node extract/codex/lib/app-layout.mjs entrypoint|binary|asar   prints one absolute path

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SourceError } from "./catalog.mjs";

export function codexApp(appPath = process.env.CODEX_APP_PATH || "/Applications/ChatGPT.app") {
  const inApp = file => `${path.basename(appPath)}/${path.relative(appPath, file)}`;
  const need = (file, why) => {
    if (!fs.existsSync(file)) throw new SourceError(`missing ${inApp(file)}${why ? `; ${why}` : ""}`);
    return file;
  };
  const resources = path.join(appPath, "Contents/Resources");
  const plist = need(path.join(appPath, "Contents/Info.plist"), "is the ChatGPT desktop app installed?");
  const asar = need(path.join(resources, "app.asar"));

  const packageDir = path.join(resources, "codex-cli");
  const manifestFile = need(path.join(packageDir, "codex-package.json"), "the Codex CLI package layout changed");
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  if (manifest.layoutVersion !== 1) throw new SourceError(`${inApp(manifestFile)} has layoutVersion ${manifest.layoutVersion}; only 1 is understood`);
  const entrypoint = need(path.join(packageDir, manifest.entrypoint));

  const apps = fs.readdirSync(packageDir).filter(name => name.endsWith(".app"));
  if (apps.length !== 1) throw new SourceError(`expected one .app in ${inApp(packageDir)}, found ${apps.length}`);
  const cliPlist = need(path.join(packageDir, apps[0], "Contents/Info.plist"));
  const executable = execFileSync("/usr/libexec/PlistBuddy", ["-c", "Print CFBundleExecutable", cliPlist], { encoding: "utf8" }).trim();
  const binary = need(path.join(packageDir, apps[0], "Contents/MacOS", executable));
  // The hash must describe what the entrypoint actually runs.
  const target = path.relative(path.dirname(entrypoint), binary);
  if (!fs.readFileSync(entrypoint, "latin1").includes(target)) throw new SourceError(`${inApp(entrypoint)} no longer execs ${target}`);

  return { appPath, resources, plist, asar, entrypoint, binary, shown: { entrypoint: inApp(entrypoint), binary: inApp(binary) } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const key = process.argv[2];
  try {
    const layout = codexApp();
    if (!["entrypoint", "binary", "asar"].includes(key)) throw new Error(`usage: app-layout.mjs entrypoint|binary|asar (got ${key})`);
    console.log(layout[key]);
  } catch (error) {
    console.error(`app layout: ${error.message}`);
    process.exit(error instanceof SourceError ? 2 : 1);
  }
}
