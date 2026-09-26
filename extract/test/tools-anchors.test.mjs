import assert from "node:assert/strict";
import test from "node:test";
import * as acorn from "acorn";
import { AnchorError, PIPELINE_ANCHORS, find, functionIndex } from "../tools-anchors.mjs";

// A module shaped like zodlite's mod(): top-level declarations by name, no imports.
function moduleOf(name, src) {
  const ast = acorn.parse(src, { ecmaVersion: "latest", sourceType: "module" });
  const decls = new Map();
  for (const st of ast.body) if (st.type === "FunctionDeclaration") decls.set(st.id.name, st);
  return { name, src, ast, decls, imports: new Map(), exportsMap: new Map() };
}
const found = (src, a) => find(functionIndex([moduleOf("chunk-test.js", src)]), a).map(h => h.name);

// Verbatim from the builds (the helpers they call are stubbed).
const stubs = "function Yb(){}function m(){}function unn(){}function Rwo(){}function Lin(){}function Qxo(){}function FS(){}function u(){}function i(){}function O(){}";
const deferral = {
  "2.1.282 (one function)": `function mve(e){if(e.alwaysLoad===!0)return!1;if(h(e))return!1;if(unn())return!1;if(e.isMcp===!0)return!0;if(Rwo()&&Yb(e,m))return!0;return e.shouldDefer===!0}function h(e){return i(e)||T(e)}function T(e){return!1}${stubs}`,
  "2.1.283 (tail in a helper)": `function bAe(e){if(e.alwaysLoad===!0)return!1;if(T(e))return!1;if(Lin())return!1;return h(e)}function h(e){if(e.isMcp===!0)return!0;if(Qxo()&&FS(e,u))return!0;return e.shouldDefer===!0}function T(e){return i(e)||O(e)}${stubs}`,
};

for (const [build, src] of Object.entries(deferral)) {
  test(`deferral decision anchor finds exactly the alwaysLoad-first function: ${build}`, () => {
    assert.deepEqual(found(src, PIPELINE_ANCHORS["pipeline-deferral"]), [src.match(/^function ([\w$]+)/)[1]]);
  });
}

test("deferral decision anchor rejects a head whose callees lack the MCP or shouldDefer checks", () => {
  const noShouldDefer = `function bAe(e){if(e.alwaysLoad===!0)return!1;if(Lin())return!1;return h(e)}function h(e){if(e.isMcp===!0)return!0;return!1}${stubs}`;
  const noMcp = `function bAe(e){if(e.alwaysLoad===!0)return!1;if(Lin())return!1;return h(e)}function h(e){return e.shouldDefer===!0}${stubs}`;
  for (const src of [noShouldDefer, noMcp]) assert.throws(() => found(src, PIPELINE_ANCHORS["pipeline-deferral"]), AnchorError);
});

test("deferral decision anchor rejects a head that ends by returning something other than a call on the tool", () => {
  const src = `function bAe(e){if(e.alwaysLoad===!0)return!1;if(h(e))return!1;return Lin()}function h(e){if(e.isMcp===!0)return!0;return e.shouldDefer===!0}${stubs}`;
  assert.throws(() => found(src, PIPELINE_ANCHORS["pipeline-deferral"]), /anchor not found: the deferral decision/);
});

test("an anchor matching two functions is ambiguous, not a pick", () => {
  const one = deferral["2.1.283 (tail in a helper)"];
  const two = one + one.slice(0, one.indexOf("function h(")).replace("bAe", "bAg");
  assert.throws(() => found(two, PIPELINE_ANCHORS["pipeline-deferral"]), /anchor ambiguous: the deferral decision matched 2/);
});
