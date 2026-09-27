import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [comp, ...frames] = process.argv.slice(2);
const out = new URL("../../../private/video/teaser/review/", import.meta.url).pathname;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: {} });
for (const f of frames) {
  await renderStill({ composition, serveUrl, output: `${out}/${comp}_${String(f).padStart(4, "0")}.png`, frame: Number(f), scale: comp === "Wide" ? 0.5 : 0.5 });
  console.log("frame", f);
}
