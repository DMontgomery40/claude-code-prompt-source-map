import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { codexApp } from "../lib/app-layout.mjs";
import { SourceError } from "../lib/catalog.mjs";

const plist = executable => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>CFBundleExecutable</key><string>${executable}</string></dict></plist>
`;

// A ChatGPT.app shaped like build 11431: the CLI package under Resources/codex-cli.
function fakeApp({ manifest = { layoutVersion: 1, entrypoint: "bin/codex" }, shimTarget = "../CodexCLI.app/Contents/MacOS/codex" } = {}) {
  const app = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "app-layout-")), "ChatGPT.app");
  const write = (rel, content) => {
    fs.mkdirSync(path.dirname(path.join(app, rel)), { recursive: true });
    fs.writeFileSync(path.join(app, rel), content);
  };
  write("Contents/Info.plist", plist("ChatGPT"));
  write("Contents/Resources/app.asar", "");
  if (manifest) write("Contents/Resources/codex-cli/codex-package.json", JSON.stringify(manifest));
  write("Contents/Resources/codex-cli/bin/codex", `#!/bin/sh\nexec "$bin_dir/${shimTarget}" "$@"\n`);
  write("Contents/Resources/codex-cli/CodexCLI.app/Contents/Info.plist", plist("codex"));
  write("Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex", "");
  return app;
}

test("layout 1: runs the manifest's entrypoint and hashes the binary it execs", () => {
  const app = fakeApp();
  const layout = codexApp(app);
  assert.equal(layout.entrypoint, path.join(app, "Contents/Resources/codex-cli/bin/codex"));
  assert.equal(layout.binary, path.join(app, "Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"));
  assert.equal(layout.asar, path.join(app, "Contents/Resources/app.asar"));
  assert.deepEqual(layout.shown, {
    entrypoint: "ChatGPT.app/Contents/Resources/codex-cli/bin/codex",
    binary: "ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"
  });
});

test("layouts that can't be read safely are source errors", async t => {
  const cases = {
    "missing manifest": [{ manifest: null }, /codex-package\.json; the Codex CLI package layout changed/],
    "unknown layoutVersion": [{ manifest: { layoutVersion: 2, entrypoint: "bin/codex" } }, /layoutVersion 2; only 1 is understood/],
    "missing entrypoint": [{ manifest: { layoutVersion: 1, entrypoint: "bin/nope" } }, /missing ChatGPT\.app\/.*bin\/nope/],
    "shim runs another binary": [{ shimTarget: "../Other.app/Contents/MacOS/codex" }, /no longer execs/]
  };
  for (const [name, [options, message]] of Object.entries(cases)) {
    await t.test(name, () => assert.throws(() => codexApp(fakeApp(options)), error => error instanceof SourceError && message.test(error.message)));
  }
  await t.test("no app installed", () => assert.throws(() => codexApp(path.join(os.tmpdir(), "no-such", "ChatGPT.app")), SourceError));
});
