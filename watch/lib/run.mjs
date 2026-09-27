import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const logFile = new URL("../logs/watch.log", import.meta.url).pathname;

export function log(message) {
  const line = `${new Date().toISOString()} ${message}`;
  appendFileSync(logFile, `${line}\n`);
  console.log(line);
}

// Runs a command with a hard timeout. Returns { status, stdout, stderr }; never throws.
export function run(command, args, { cwd, timeoutMs = 10 * 60 * 1000, env = {}, input } = {}) {
  const result = spawnSync(command, args, {
    cwd, input, encoding: "utf8", timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, ...env }
  });
  const status = result.error ? (result.error.code === "ETIMEDOUT" ? "timeout" : result.error.message) : result.status;
  return { status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

export function must(command, args, options) {
  const r = run(command, args, options);
  if (r.status !== 0) throw new Error(`${command} ${args.join(" ")} failed (${r.status}): ${(r.stderr || r.stdout).slice(-2000)}`);
  return r;
}

export function notify(title, message) {
  run("osascript", ["-e", `display notification ${JSON.stringify(message.slice(0, 220))} with title ${JSON.stringify(title)}`]);
  log(`notify: ${title}: ${message}`);
}
