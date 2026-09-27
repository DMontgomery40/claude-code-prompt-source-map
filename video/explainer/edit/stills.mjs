// Review stills: bundle once, render chosen frames of a composition. node stills.mjs Wide 180,420,...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, list] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id, inputProps: { tall: id === "Tall" } });
for (const f of list.split(",").map(Number)) {
  const out = path.resolve(`out/review/${id}_${String(f).padStart(5, "0")}.jpg`);
  await renderStill({ composition: comp, serveUrl, output: out, frame: f, imageFormat: "jpeg", jpegQuality: 85, inputProps: { tall: id === "Tall" } });
  console.log(out);
}
