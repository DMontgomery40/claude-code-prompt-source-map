import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildDocument, describeParameter, manifestLiterals, moduleEvaluator, parseRegistry } from "../learning-blocks.mjs";
import { openAsar } from "../lib/asar.mjs";

// A minimal asar: pickled JSON header, then the file bytes.
function writeAsar(files) {
  const tree = {};
  const blobs = [];
  let offset = 0;
  for (const [file, content] of Object.entries(files)) {
    const bytes = Buffer.from(content, "utf8");
    let node = tree;
    for (const dir of file.split("/").slice(0, -1)) node = (node[dir] ??= { files: {} }).files;
    node[path.basename(file)] = { size: bytes.length, offset: String(offset) };
    offset += bytes.length;
    blobs.push(bytes);
  }
  const json = Buffer.from(JSON.stringify({ files: tree }), "utf8");
  const aligned = Math.ceil(json.length / 4) * 4;
  const head = Buffer.alloc(16 + aligned);
  head.writeUInt32LE(4, 0);
  head.writeUInt32LE(8 + aligned, 4);
  head.writeUInt32LE(4 + aligned, 8);
  head.writeUInt32LE(json.length, 12);
  json.copy(head, 16);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "learning-blocks-")), "app.asar");
  fs.writeFileSync(file, Buffer.concat([head, ...blobs]));
  return file;
}

const A = "webview/assets/";
// The bundle's lazy-init helper, exported as `n` as in the shipped runtime.
const RUNTIME = "var o=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(e){throw n=[e],e}};export{o as n};";
// Manifest modules as the bundle ships them: same local names in every module, and the manifest
// is only filled in when the exported initializer runs (a live binding).
const manifestModule = body => `import{n as e}from"./rolldown-runtime-000000000000.js";var t,n,r,i;function a(){return(a=e((()=>{${body}})))()}export{i as n,a as t};\n//# sourceMappingURL=x.js.map`;
const slot = (type, file, name, deps) =>
  `P(x,{analyticsMathBlockType:T.CHATGPT_MATH_BLOCK_TYPE_${type},resolveDisplayContent:()=>\`\`,visualization:(0,k.lazy)(()=>n(()=>import(\`./${file}\`).then(e=>({default:e.${name}})),__vite__mapDeps([${deps}]),import.meta.url)),caption:(0,k.lazy)(()=>n(()=>import(\`./${file}\`).then(e=>({default:e.Caption})),__vite__mapDeps([${deps}]),import.meta.url))});`;

const FILES = {
  [`${A}rolldown-runtime-000000000000.js`]: RUNTIME,
  [`${A}chatgpt_math_blocks-111111111111.js`]: "e.CHATGPT_MATH_BLOCK_TYPE_UNSPECIFIED=1,e.CHATGPT_MATH_BLOCK_TYPE_PYTHAGOREAN_THEOREM=2,e.CHATGPT_MATH_BLOCK_TYPE_ORBITAL_MOTION=3,e.CHATGPT_MATH_BLOCK_TYPE_ENUM_ONLY=4;",
  [`${A}type-aaaaaaaaaaaa.js`]: manifestModule("t=`PYTHAGOREAN_THEOREM`,n=`pythagorean-v1`,r={a:{kind:`number`,defaultValue:3,min:0.01,max:100},b:{kind:`number`,defaultValue:4,min:0.01,max:100}},i={type:t,version:4,thumbnailAssetKey:n,canonicalFormula:`a^2 + b^2 = c^2`,canonicalFormulaAliases:[`c^2 = a^2 + b^2`],parameters:r}"),
  [`${A}type-bbbbbbbbbbbb.js`]: manifestModule("t=`CELL_MEMBRANE_TRANSPORT`,n=`cell-membrane-transport-v1`,i={type:t,version:2,thumbnailAssetKey:n}"),
  [`${A}type-cccccccccccc.js`]: manifestModule("t=`UNUSED_MANIFEST`,n=`unused-v1`,i={type:t,version:1,thumbnailAssetKey:n}"),
  [`${A}cell-membrane-transport-v1-222222222222.json`]: JSON.stringify({ v: "5.12.2", nm: "Cell membrane transport" }),
  [`${A}visualization-333333333333.js`]: 'import{n as e}from"./rolldown-runtime-000000000000.js";import{n as m,t as i}from"./type-aaaaaaaaaaaa.js";var z=({i:t})=>t.formatMessage({id:`learningBlock.pythagorean.x`,defaultMessage:`Legs`});var y={ariaLabel:l.formatMessage({id:`learningBlock.pythagorean.ariaLabel`,defaultMessage:`Right triangle whose legs a and b set the hypotenuse c.`})};export{y as PythagoreanVisualization};',
  [`${A}visualization-444444444444.js`]: 'import{n as e}from"./rolldown-runtime-000000000000.js";import{n as i,t as a}from"./responsive-lottie-visualization-555555555555.js";import{n as l,t as u}from"./type-bbbbbbbbbbbb.js";var p={};export{p as Visualization};',
  [`${A}visualization-666666666666.js`]: "var q={};export{q as OrbitalMotionVisualization};",
  // A view whose manifest lives in a shared model module it imports, not a type-*.js file.
  [`${A}visualization-abcabcabcabc.js`]: 'import{n as e}from"./rolldown-runtime-000000000000.js";import{t as m}from"./model-121212121212.js";var v={};export{v as ProjectileMotionVisualization};',
  [`${A}model-121212121212.js`]: manifestModule("t=`PROJECTILE_MOTION`,n=`projectile-motion-v1`,r={launchAngleDegrees:{kind:`number`,defaultValue:45,min:25,max:65}},i={type:t,version:4,thumbnailAssetKey:n,parameters:r}"),
  [`${A}responsive-lottie-visualization-555555555555.js`]: "export{};",
  [`${A}three.module-777777777777.js`]: "export{};",
  [`${A}analytics-888888888888.js`]:
    'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./visualization-333333333333.js","./three.module-777777777777.js","./visualization-444444444444.js","./responsive-lottie-visualization-555555555555.js","./visualization-666666666666.js","./visualization-abcabcabcabc.js"])))=>i.map(i=>d[i]);' +
    slot("PYTHAGOREAN_THEOREM", "visualization-333333333333.js", "PythagoreanVisualization", "0,1") +
    slot("UNSPECIFIED", "visualization-444444444444.js", "Visualization", "2,3") +
    slot("ORBITAL_MOTION", "visualization-666666666666.js", "OrbitalMotionVisualization", "4") +
    slot("PROJECTILE_MOTION", "visualization-abcabcabcabc.js", "ProjectileMotionVisualization", "5"),
  // Some trigger anchors present, one fact's anchors absent.
  [`${A}learning-block-999999999999.js`]: "category:`learning_block`;matched_type;server_learning_block_version;encoded_initial_values;CHATGPT_MATH_BLOCK_RENDER_SOURCE_GENUI_LEARNING_BLOCK;canonicalFormula;canonicalFormulaAliases;`canonical_formula`;content_is_placeholder"
};

const APP = { version: "1.0.0", build: "1" };

test("every registered view becomes a block, joined to the manifest module it imports", () => {
  const { md, json, counts } = buildDocument(openAsar(writeAsar(FILES)), APP);
  const data = JSON.parse(json);
  const byType = Object.fromEntries(data.blocks.map(b => [b.type, b]));
  assert.deepEqual(Object.keys(byType).sort(), ["CELL_MEMBRANE_TRANSPORT", "ORBITAL_MOTION", "PROJECTILE_MOTION", "PYTHAGOREAN_THEOREM", "UNUSED_MANIFEST"]);
  assert.equal(counts.registered_views, 4);
  const projectile = byType.PROJECTILE_MOTION;
  assert.equal(projectile.source.manifest, `${A}model-121212121212.js`);
  assert.deepEqual(Object.keys(projectile.parameters), ["launchAngleDegrees"]);

  // A manifest filled in by its lazy initializer is read in full (live binding), and modules that
  // reuse the same local names do not overwrite each other.
  const py = byType.PYTHAGOREAN_THEOREM;
  assert.equal(py.manifest_evaluated, true);
  assert.equal(py.version, 4);
  assert.deepEqual(Object.keys(py.parameters), ["a", "b"]);
  assert.equal(py.canonical_formula, "a^2 + b^2 = c^2");
  assert.equal(py.renderer, "three");
  assert.equal(py.description, "Right triangle whose legs a and b set the hypotenuse c.");
  assert.equal(byType.CELL_MEMBRANE_TRANSPORT.version, 2);

  // Registered without an analytics type: identified by its manifest, titled by its animation.
  const cell = byType.CELL_MEMBRANE_TRANSPORT;
  assert.equal(cell.analytics_type, "UNSPECIFIED");
  assert.equal(cell.title, "Cell membrane transport");
  assert.equal(cell.renderer, "lottie");
  assert.equal(cell.thumbnail_animation, `${A}cell-membrane-transport-v1-222222222222.json`);
  assert.equal(cell.in_type_enum, false);

  // A view with its manifest inline in the registry keeps its analytics type.
  const orbit = byType.ORBITAL_MOTION;
  assert.equal(orbit.renderer, "svg");
  assert.equal(orbit.manifest_evaluated, null);
  assert.match(orbit.source.manifest, /analytics-888888888888\.js \(inline\)$/);

  // A manifest no view imports is listed as manifest only.
  assert.equal(byType.UNUSED_MANIFEST.renderer, "none");
  assert.deepEqual(data.type_enum_without_manifest, ["ENUM_ONLY"]);

  // The page: one #### heading per block under its renderer group, formula in the heading.
  assert.match(md, /^### three\.js 3D scenes \(1\)$/m);
  assert.match(md, /^#### Pythagorean theorem: `a\^2 \+ b\^2 = c\^2`$/m);
  assert.match(md, /^Right triangle whose legs a and b set the hypotenuse c\.$/m);
  assert.match(md, /Parameters: `a` \(number, default `3`, range 0\.01 to 100\); `b`/);
  assert.match(md, /^#### Cell membrane transport$/m);
  assert.match(md, /^#### Orbital motion$/m);
  // Trigger facts: published when their anchors are in the app, otherwise marked not found.
  assert.match(md, /category `learning_block`/);
  assert.match(md, /uses the formula only as display text/);
  assert.match(md, /Not found in this build: `\/conversation\/message\/learning-blocks\/feedback`/);
  assert.doesNotMatch(md, /\/Users\/|webview\/assets\/type-aaaaaaaaaaaa\.js`; view/);
});

test("module evaluator refuses large modules and modules it cannot resolve", () => {
  const files = { "rt.js": RUNTIME, "big.js": `var x=1;${" ".repeat(70 * 1024)}export{x as n};`, "dep.js": 'import{n as e}from"./missing.js";var i={type:`X`,version:1};export{i as n};' };
  const ev = moduleEvaluator(name => files[name] ?? null);
  assert.equal(ev.evaluate("big.js"), null);
  assert.equal(ev.manifest("dep.js"), null);
  assert.deepEqual(manifestLiterals(files["dep.js"]), { type: "X", version: 1, thumbnailAssetKey: null });
});

test("registry parsing keys registrations by view module and keeps each one's analytics type", () => {
  const registry = parseRegistry(FILES[`${A}analytics-888888888888.js`]);
  assert.deepEqual([...registry.values()].map(r => [r.module, r.analyticsType, r.exportName]), [
    ["visualization-333333333333.js", "PYTHAGOREAN_THEOREM", "PythagoreanVisualization"],
    ["visualization-444444444444.js", "UNSPECIFIED", "Visualization"],
    ["visualization-666666666666.js", "ORBITAL_MOTION", "OrbitalMotionVisualization"],
    ["visualization-abcabcabcabc.js", "PROJECTILE_MOTION", "ProjectileMotionVisualization"]
  ]);
  assert.deepEqual(registry.get("visualization-333333333333.js").preload, ["visualization-333333333333.js", "three.module-777777777777.js"]);
});

test("parameter descriptions", () => {
  assert.equal(describeParameter("regime", { kind: "enum", defaultValue: "looping", allowedValues: ["looping", "coning"] }), "`regime` (enum, default `looping`, one of `looping`, `coning`)");
  assert.equal(describeParameter("n", { kind: "integer", min: 1 }), "`n` (integer, range 1 to …)");
});
