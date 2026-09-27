#!/usr/bin/env node
// Environment variables Claude Code 2.1.280 reads: every read site, how the value is parsed,
// and provenance. Writes outputs/environment-variables.{json,md}; review evidence goes to work/.
//
// A name counts as read when code reads it from the environment through one of:
//   - a member read on process.env (dotted, bracketed with a literal, destructured, via a scoped alias, or an "in" test)
//   - the typed env accessor, whose getters parse process.env values according to a typed schema registry
//   - a helper whose parameter is used as a process.env key, called with a literal name
//   - a literal list of names iterated into process.env lookups, or a literal lookup table
//   - a function parameter that some caller fills with process.env (directly or as an "env" field)
// Names that only appear as strings, or are only written (assigned, deleted, or set through the accessor), are dropped.
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import * as walk from "acorn-walk";
import * as acorn from "acorn";
import { createHash } from "node:crypto";
import { source, parse, provenance, files as manifest, VERSION } from "./lib.mjs";

const ROOT = new URL("../", import.meta.url).pathname;
const WORK = `${ROOT}work/`;
const ENVNAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const LITNAME = /^[A-Z_][A-Z0-9_]{2,}$|^(http|https|no|all|ftp)_proxy$/;
const DOCS = "https://code.claude.com/docs/en/";
// Name domains used for grouping (and FIRST_PARTY_PREFIX as evidence during the scan).
const SHELL_OS = /^(SHELL|TERM|TERM_PROGRAM|TERM_PROGRAM_VERSION|TERMINAL_EMULATOR|TERMINFO|COLORTERM|COLORFGBG|COLUMNS|LINES|TMUX|TMUX_PANE|STY|ZELLIJ.*|EDITOR|VISUAL|PAGER|MANPAGER|LESS|BROWSER|HOME|USERPROFILE|HOMEDRIVE|HOMEPATH|PATH|Path|PATHEXT|USER|USERNAME|LOGNAME|LANG|LANGUAGE|LC_[A-Z]+|TZ|NO_COLOR|FORCE_COLOR|FORCE_HYPERLINK|CI|CONTINUOUS_INTEGRATION|BUILD_NUMBER|RUN_ID|DISPLAY|WAYLAND_DISPLAY|XDG_[A-Z_]+|PWD|OLDPWD|INIT_CWD|TMPDIR|TMP|TEMP|TMPPREFIX|SSH_[A-Z_]+|WSL_[A-Z_]+|WSLENV|ComSpec|COMSPEC|SystemRoot|SYSTEMROOT|SystemDrive|SYSTEMDRIVE|ProgramData|PROGRAMDATA|ProgramFiles|PROGRAMFILES|ProgramW6432|APPDATA|LOCALAPPDATA|ALLUSERSPROFILE|WINDIR|windir|ZDOTDIR|BASH_ENV|BASH_VERSION|ZSH_VERSION|ENV|HOSTNAME|NODE_[A-Z_]+|NODE_ENV|BUN_[A-Z_]+|npm_[a-z_]+|NVM_[A-Z_]+|GIT_[A-Z_]+|GH_[A-Z_]+|GITHUB_[A-Z_]+|GITLAB_[A-Z_]+|CI_[A-Z_]+|BUILDKITE.*|CIRCLECI|CIRCLE_[A-Z_]+|JENKINS_[A-Z_]+|TRAVIS.*|TEAMCITY_VERSION|TF_BUILD|BITBUCKET_[A-Z_]+|CODEBUILD_[A-Z_]+|VSCODE_[A-Z_]+|CURSOR_[A-Z_]+|ZED_[A-Z_]+|KITTY_[A-Z_]+|ITERM_[A-Z_]+|LC_TERMINAL.*|WT_SESSION|WT_PROFILE_ID|ConEmu[A-Za-z]*|ALACRITTY_[A-Z_]+|WEZTERM_[A-Z_]+|GHOSTTY_[A-Z_]+|KONSOLE_[A-Z_]+|VTE_VERSION|TERMINUS_[A-Z_]+|__CFBundleIdentifier|MSYSTEM|CYGWIN|SUDO_[A-Z_]+|DBUS_[A-Z_]+|DESKTOP_SESSION|XAUTHORITY|INSIDE_EMACS|EMACS|VIM|NVIM|MYVIMRC|VIMRUNTIME|JETBRAINS_[A-Z_]+|IDEA_[A-Z_]+|CODESPACES|CODESPACE_NAME|GITPOD_[A-Z_]+|REPL_ID|REPLIT_[A-Z_]+|VERCEL.*|NETLIFY|RENDER|HEROKU.*|FLY_[A-Z_]+|RAILWAY_[A-Z_]+|KUBERNETES_[A-Z_]+|DOCKER_[A-Z_]+|container|PROCESSOR_ARCHITECTURE|PROCESSOR_ARCHITEW6432|NUMBER_OF_PROCESSORS|OS|SHLVL|PS1|PROMPT_COMMAND|HISTFILE|HISTSIZE|BAT_THEME|RIPGREP_CONFIG_PATH|CDPATH|IFS|MAIL|DEBUG|VisualStudioVersion|NoDefaultCurrentDirectoryInExePath|PSModulePath|POWERSHELL_[A-Z_]+|PWSH_[A-Z_]+|STARSHIP_[A-Z_]+|PYTHON[A-Z_]*|VIRTUAL_ENV|CONDA_[A-Z_]+|JAVA_HOME|GOPATH|CARGO_HOME|RUSTUP_HOME|ANDROID_HOME|ANDROID_SDK_ROOT|CF_PAGES|CODER|CODER_WORKSPACE_NAME|DAYTONA_WS_ID|DENO_DEPLOYMENT_ID|DEVPOD|DEVPOD_WORKSPACE_UID|DYNO|GNOME_TERMINAL_SERVICE|INTELLIJ_TERMINAL_[A-Z_]+|JAVA_TOOL_OPTIONS|K_SERVICE|P4PORT|PREFIX|PROJECT_DOMAIN|REPL_SLUG|SESSIONNAME|SPACE_CREATOR_USER_ID|TERMINAL|TERMINATOR_UUID|TERMUX_VERSION|TILIX_ID|UV_THREADPOOL_SIZE|WEBSITE_SITE_NAME|WEBSITE_SKU|XTERM_VERSION|GCM_INTERACTIVE|INK_SCREEN_READER|FORCE_CODE_TERMINAL|APP_URL|C9_PID|C9_USER)$/;
const NETWORK = /PROXY|CA_BUNDLE|CA_CERT|CACERT|CERT_FILE|CERT_DIR|CERT_STORE|_CERTS?$|TLS|SSL|MTLS|CLIENT_CERT|CLIENT_KEY|CAINFO|CAPATH|^HOSTALIASES$|^LOCALDOMAIN$|^RES_OPTIONS$/i;
const FIRST_PARTY_PREFIX = /^(AUTOMODE_|BUGHUNTER_|SWE_BENCH_|CLIPBOARD_NAPI|SRT_|CLAUDE|ANTHROPIC|ANT_|CCR_|DISABLE_|ENABLE_|FORCE_(AUTOUPDATE|PROMPT)|MCP_|BASH_|MAX_(MCP|THINKING|STRUCTURED)|USE_(BUILTIN|LOCAL|STAGING)|SLASH_COMMAND|IS_DEMO|IS_SANDBOX|API_TIMEOUT|API_FORCE|TASK_MAX|SELF_HOSTED_RUNNER|RUNNER_|ULTRAPLAN|VCR_|FORCE_VCR|EMBEDDED_SEARCH|SESSION_INGRESS|ENVIRONMENT_SERVICE)/;

const jsFiles = readdirSync(`${WORK}extracted`).filter(f => f.endsWith(".js") && manifest.has(f)).sort();
const srcOf = new Map();
const text = f => { if (!srcOf.has(f)) srcOf.set(f, source(f)); return srcOf.get(f); };

// ---------- pass 0: module graph (Bun emits import{a,b as c}from"/$bunfs/root/x.js" and export{…}) ----------
const imports = new Map(); // file -> Map(local -> [srcFile, imported])
const exportsOf = new Map(); // file -> Map(exported -> local)
for (const f of jsFiles) {
  const s = text(f); const im = new Map(); const ex = new Map();
  for (const m of s.matchAll(/import\{([^}]*)\}from"\/\$bunfs\/root\/([^"]+)"/g))
    for (const spec of m[1].split(",")) { const [imp, loc] = spec.trim().split(/\s+as\s+/); if (imp) im.set(loc ?? imp, [m[2], imp]); }
  for (const m of s.matchAll(/export\{([^}]*)\}/g))
    for (const spec of m[1].split(",")) { const [loc, exp] = spec.trim().split(/\s+as\s+/); if (loc) ex.set(exp ?? loc, loc); }
  imports.set(f, im); exportsOf.set(f, ex);
}
function origin(file, local, depth = 0) {
  const im = imports.get(file)?.get(local);
  if (!im || depth > 20) return `${file}#${local}`;
  const [src, imp] = im; const loc = exportsOf.get(src)?.get(imp) ?? imp;
  return origin(src, loc, depth + 1);
}
const exportedOrigin = (file, exported) => origin(file, exportsOf.get(file)?.get(exported) ?? exported);

// ---------- first-party helpers and the typed registry, located structurally (AST), not by code text ----------
const astCache = new Map();
const astOf = f => { if (!astCache.has(f)) astCache.set(f, parse(text(f))); return astCache.get(f); };
const literalsOf = n => n?.type === "ArrayExpression" ? n.elements.map(e => e?.type === "Literal" ? e.value : null) : null;
const sameList = (a, b) => a && a.length === b.length && a.every((x, i) => x === b[i]);
// The truthy/falsy helpers: one-parameter functions that test membership in these value lists.
function findListFn(values) {
  const needle = values.map(v => JSON.stringify(v)).join(",");
  for (const f of jsFiles) {
    if (!text(f).includes(needle)) continue;
    let hit = null;
    walk.simple(astOf(f), { FunctionDeclaration(fn) { if (hit || fn.params.length !== 1) return; walk.simple(fn.body, { ArrayExpression(a) { if (sameList(literalsOf(a), values)) hit = fn.id.name; } }); } });
    if (hit) return `${f}#${hit}`;
  }
  return null;
}
const TRUTHY = findListFn(["1", "true", "yes", "on"]);
const FALSY = findListFn(["0", "false", "no", "off"]);
const NUMBER_FNS = new Set(["parseInt", "parseFloat", "Number"]);
const NUMBER_ORIGINS = new Set(); // small one-parameter wrappers around parseInt(x, 10), found during pass 1
const calls = (node, obj, prop) => { let hit = false; walk.simple(node, { CallExpression(c) { if (c.callee.type === "MemberExpression" && c.callee.object.name === obj && c.callee.property.name === prop) hit = true; } }); return hit; };

// Schema builder: an object literal with str/rawStr/bool/triBool/int/enum members, exported by one module.
const BUILDER_KEYS = ["str", "rawStr", "bool", "triBool", "int", "enum"];
let builderOrigin = null;
for (const f of jsFiles) {
  if (builderOrigin || !text(f).includes("triBool")) continue;
  walk.simple(astOf(f), { VariableDeclarator(d) { if (!builderOrigin && d.id.type === "Identifier" && d.init?.type === "ObjectExpression" && BUILDER_KEYS.every(k => d.init.properties.some(p => p.key?.name === k))) builderOrigin = `${f}#${d.id.name}`; } });
}
// Registry entries: namespace objects of the form { NAME: () => id } where id is initialised by a builder call.
const registry = new Map(); // name -> {type, opts, file, start, end}
const accessorOrigins = new Set();
for (const f of jsFiles) {
  const dLocal = [...(imports.get(f) ?? [])].map(([loc]) => loc).find(loc => origin(f, loc) === builderOrigin);
  if (!dLocal) continue;
  const s = text(f); const ast = astOf(f); const inits = new Map();
  walk.simple(ast, { VariableDeclarator(n) { if (n.id.type === "Identifier" && n.init) inits.set(n.id.name, n.init); } });
  walk.simple(ast, {
    CallExpression(n) {
      const [o, props] = n.arguments;
      if (n.arguments.length !== 2 || o?.type !== "Identifier" || props?.type !== "ObjectExpression") return;
      for (const p of props.properties) {
        const key = p.key?.name ?? p.key?.value;
        if (!key || !ENVNAME.test(key) || p.value?.type !== "ArrowFunctionExpression" || p.value.body.type !== "Identifier") continue;
        const init = inits.get(p.value.body.name);
        if (init?.type !== "CallExpression" || init.callee.type !== "MemberExpression" || init.callee.object.name !== dLocal) continue;
        const type = init.callee.property.name; let opts = null;
        const a0 = init.arguments[0];
        const arr = a0?.type === "Identifier" ? inits.get(a0.name) : a0;
        if (arr?.type === "ArrayExpression") opts = { values: arr.elements.map(e => e.value) };
        else if (a0?.type === "ObjectExpression") opts = Object.fromEntries(a0.properties.map(q => [q.key.name, q.value.type === "Literal" ? q.value.value : q.value.type === "UnaryExpression" && q.value.operator === "!" && q.value.argument.type === "Literal" ? !q.value.argument.value : null]));
        registry.set(key, { type, opts, file: f, start: p.start, end: p.end });
      }
    },
  });
  // Accessor factory: a two-parameter function that builds getters with Object.create / Object.entries / Object.defineProperty.
  const factories = new Set();
  walk.simple(ast, { FunctionDeclaration(fn) { if (fn.params.length === 2 && calls(fn.body, "Object", "create") && calls(fn.body, "Object", "entries") && calls(fn.body, "Object", "defineProperty")) factories.add(fn.id.name); } });
  walk.simple(ast, { VariableDeclarator(d) { if (d.id.type === "Identifier" && d.init?.type === "CallExpression" && d.init.callee.type === "Identifier" && factories.has(d.init.callee.name)) accessorOrigins.add(`${f}#${d.id.name}`); } });
}
astCache.clear();
// Fail loudly if the structural anchors are gone in a new release, instead of emitting a thin reference.
for (const [what, ok] of [["truthy helper", TRUTHY], ["falsy helper", FALSY], ["schema builder", builderOrigin], ["typed accessor", accessorOrigins.size > 0], ["typed registry (>= 500 names)", registry.size >= 500]])
  if (!ok) throw new Error(`env-vars: could not locate the ${what}; the bundle layout changed and the extractor needs updating`);

// ---------- pass 1: read sites ----------
const sites = new Map(); // name -> [{file,start,end,how,obs}]
const writes = new Map(); // name -> count
const helpers = new Map(); // origin -> {param, obs, file}
const pendingCalls = []; // {file, calleeOrigin, argIndex, name, start, end, obs}
const evidence = {}; // caching evidence ranges (offsets only in outputs)
const setSites = new Map(); // name -> [{file,start,end,value,conditional,conds,keys,receivers}]
const SETNAME = /^[A-Z][A-Z0-9_]{2,}$/;
// Who receives a child environment, recognised by the keys it sets together plus a string in the same function.
const RECEIVERS = [
  { label: "stdio MCP servers", keys: ["CLAUDECODE", "CLAUDE_PROJECT_DIR", "CLAUDE_CODE_SESSION_ID"], context: /Unsupported server type/ },
  { label: "plugin-provided stdio MCP servers", keys: ["CLAUDE_PLUGIN_ROOT", "CLAUDE_PLUGIN_DATA"], context: /case"stdio"/ },
  { label: "the shell that builds the Bash tool's shell snapshot, and the shell environment probe", keys: ["SHELL", "GIT_EDITOR", "CLAUDECODE"], context: /Creating snapshot at|Spawn-env probe/ },
  { label: "hook commands", keys: [], context: /Hook command references/ },
  { label: "hook commands", keys: ["CLAUDE_PROJECT_DIR"], context: /hook_event_name/ },
  { label: "MCP server headersHelper command", keys: ["CLAUDE_CODE_MCP_SERVER_NAME", "CLAUDE_CODE_MCP_SERVER_URL"], context: null },
  { label: "plugin headersHelper command", keys: ["CLAUDE_CODE_PLUGIN_NAME", "CLAUDE_CODE_PLUGIN_ARCHIVE_URL"], context: /headersHelper/ },
  { label: "marketplace headersHelper command", keys: ["CLAUDE_CODE_MARKETPLACE_URL"], context: /marketplace headers/ },
  { label: "proxy authorization command", keys: ["CLAUDE_CODE_PROXY_URL"], context: /proxy authorization/ },
];
const spawnKeyList = new Map(); // name -> element site, from the array the Bash tool's spawnEnvKeys() method adds
const wrappers = new Map(); // origin of a zero-parameter function that returns an env value -> {name, how}
const truthyCalls = []; // zero-argument calls whose result is tested for truthiness
const families = new Map(); // "OTEL_EXPORTER_OTLP_*_ENDPOINT" -> sites
const paramReads = []; // P.NAME reads where P is a parameter
const envArgCalls = new Set(); // "origin|argIndex" of calls that pass process.env
const siteKeys = new Set();
const addSite = (name, rec) => { const k = `${name}|${rec.file}|${rec.start}|${rec.end}`; if (siteKeys.has(k)) return; siteKeys.add(k); if (!sites.has(name)) sites.set(name, []); sites.get(name).push(rec); };
const selfWrites = []; // {name, file, start, end, valueNode, fileSrc}
const addWrite = (name, site) => { writes.set(name, (writes.get(name) ?? 0) + 1); if (site) selfWrites.push({ name, ...site }); };

const isProcessEnv = n => n?.type === "MemberExpression" && !n.computed && n.property.name === "env" &&
  ((n.object.type === "Identifier" && n.object.name === "process") ||
   (n.object.type === "MemberExpression" && !n.object.computed && n.object.property.name === "process" && ["globalThis", "global"].includes(n.object.object.name)));
const lit = n => n?.type === "Literal" ? n.value : n?.type === "TemplateLiteral" && n.expressions.length === 0 ? n.quasis[0].value.cooked : undefined;

// What the surrounding code does with the value node anc[i].
function classify(anc, i, fileCtx) {
  const obs = { as: new Set(), values: new Set(), defaults: new Set() };
  let node = anc[i], j = i - 1;
  for (;;) {
    const p = anc[j];
    if (!p) break;
    if (p.type === "ChainExpression" || p.type === "ParenthesizedExpression") { node = p; j--; continue; }
    if (p.type === "MemberExpression" && p.object === node && !p.computed && ["trim", "toLowerCase", "toUpperCase", "trimStart", "trimEnd"].includes(p.property.name) && anc[j - 1]?.type === "CallExpression" && anc[j - 1].callee === p) { node = anc[j - 1]; j -= 2; continue; }
    if (p.type === "CallExpression" && p.callee.type === "Identifier" && p.callee.name === "String" && p.arguments[0] === node) { node = p; j--; continue; }
    break;
  }
  const p = anc[j];
  if (!p) { obs.as.add("string"); return obs; }
  const calleeOrigin = c => c.type === "Identifier" ? fileCtx.origin(c.name) : null;
  if (p.type === "CallExpression" && p.callee.type === "Identifier" && p.callee.name === "Boolean" && p.arguments[0] === node) obs.as.add("presence");
  else if (p.type === "CallExpression" && p.arguments.includes(node)) {
    const o = calleeOrigin(p.callee);
    if (o === TRUTHY) obs.as.add("bool");
    else if (o === FALSY) obs.as.add("bool-false-check");
    else if (p.callee.type === "Identifier" && NUMBER_FNS.has(p.callee.name) && !fileCtx.shadowed(p.callee.name)) obs.as.add("number");
    else { obs.as.add("string"); if (o) obs.callee = o; }
  } else if (p.type === "BinaryExpression" && ["===", "!==", "==", "!="].includes(p.operator)) {
    const other = p.left === node ? p.right : p.left; const v = lit(other);
    if (typeof v === "string") { obs.as.add("enum"); obs.values.add(v); }
    else if (other.type === "Identifier" && other.name === "undefined" || (other.type === "UnaryExpression" && other.operator === "void")) obs.as.add("defined");
    else obs.as.add("string");
  } else if (p.type === "LogicalExpression" && p.left === node && (p.operator === "??" || p.operator === "||")) {
    const v = lit(p.right) ?? (p.right.type === "Identifier" ? fileCtx.constAt?.("lit", p.right.name, anc) : undefined);
    if (v !== undefined && v !== "") obs.defaults.add(JSON.stringify(v));
    obs.as.add(typeof v === "number" ? "number" : "string");
  } else if (p.type === "UnaryExpression" && p.operator === "!") obs.as.add("presence");
  else if (p.type === "UnaryExpression" && p.operator === "+") obs.as.add("number");
  else if ((p.type === "IfStatement" || p.type === "ConditionalExpression") && p.test === node) obs.as.add("presence");
  else if (p.type === "LogicalExpression" && p.operator === "&&" && p.left === node) obs.as.add("presence");
  else if (p.type === "SwitchStatement" && p.discriminant === node) { obs.as.add("enum"); for (const c of p.cases) { const v = lit(c.test); if (typeof v === "string") obs.values.add(v); } }
  else if (p.type === "MemberExpression" && p.object === node && !p.computed && p.property.name === "split") obs.as.add("list");
  else if (p.type === "ReturnStatement" || (p.type === "ArrowFunctionExpression" && p.body === node)) { obs.as.add("string"); obs.returned = true; }
  else obs.as.add("string");
  return obs;
}

const debug = [];
for (const f of jsFiles) {
  const s = text(f);
  const im = imports.get(f);
  const accessorLocals = new Set([...accessorOrigins].filter(o => o.startsWith(`${f}#`)).map(o => o.split("#")[1]));
  for (const [loc] of im) if (accessorOrigins.has(origin(f, loc))) accessorLocals.add(loc);
  if (!s.includes("process.env") && accessorLocals.size === 0 && !/import\.meta\.require/.test(s) && !/\benv\b|CLAUDECODE/.test(s)) continue;
  let ast; try { ast = parse(s); } catch (e) { console.error("parse failed", f, e.message); continue; }
  // Local declarations that shadow imported names are rare in Bun output; origin() only follows imports.
  const fileCtx = { origin: loc => origin(f, loc), shadowed: () => false };
  // Scope-aware aliases of process.env: minified names are reused, so an alias only counts inside
  // the function that declared it, unless an inner function redeclares the name.
  const aliasScopes = new Map(); const processAliases = new Map(); const declared = new Map(); const consts = new Map(); // name -> [{F, kind, value}]
  const addConst = (nm, F, kind, value) => { if (!consts.has(nm)) consts.set(nm, []); consts.get(nm).push({ F, kind, value }); };
  const nearestFn = anc => { for (let k = anc.length - 2; k >= 0; k--) if (/Function|Program/.test(anc[k].type)) return anc[k]; return ast; };
  const declare = (F, nm) => { if (!declared.has(F)) declared.set(F, new Set()); declared.get(F).add(nm); };
  walk.fullAncestor(ast, (n, _st, anc) => {
    if (/Function/.test(n.type)) for (const q of n.params) {
      const id = q.type === "AssignmentPattern" ? q.left : q;
      if (id.type === "Identifier") { declare(n, id.name); if (q.type === "AssignmentPattern" && isProcessEnv(q.right)) { if (!aliasScopes.has(id.name)) aliasScopes.set(id.name, new Set()); aliasScopes.get(id.name).add(n); } }
    }
    if (n.type === "VariableDeclarator" && n.id.type === "Identifier") {
      const F = nearestFn(anc); declare(F, n.id.name);
      if (!n.init) return;
      if (isProcessEnv(n.init)) { if (!aliasScopes.has(n.id.name)) aliasScopes.set(n.id.name, new Set()); aliasScopes.get(n.id.name).add(F); }
      const pick = n.init.type === "ConditionalExpression" ? n.init.consequent : n.init.type === "LogicalExpression" ? n.init.right : null;
      if (pick?.type === "Identifier" && pick.name === "process") { if (!processAliases.has(n.id.name)) processAliases.set(n.id.name, new Set()); processAliases.get(n.id.name).add(F); }
      const v = lit(n.init); if (v !== undefined) addConst(n.id.name, F, "lit", v);
      // Literal string arrays, flattening spreads of literal arrays.
      const flatEls = n.init.type === "ArrayExpression" ? n.init.elements.flatMap(e => e?.type === "SpreadElement" && e.argument.type === "ArrayExpression" ? e.argument.elements : [e]) : null;
      if (flatEls?.length && flatEls.every(e => typeof lit(e) === "string")) addConst(n.id.name, F, "arr", flatEls);
      if (n.init.type === "ArrayExpression" && n.init.elements.length && n.init.elements.every(e => e?.type === "ArrayExpression")) addConst(n.id.name, F, "table", n.init.elements.map(e => e.elements));
    }
    if (n.type === "AssignmentExpression" && n.left.type === "Identifier" && isProcessEnv(n.right)) { const F = nearestFn(anc); if (!aliasScopes.has(n.left.name)) aliasScopes.set(n.left.name, new Set()); aliasScopes.get(n.left.name).add(F); }
  });
  let curAnc = [];
  const isAliasAt = (nm, anc) => {
    const scopes = aliasScopes.get(nm); if (!scopes) return false;
    for (let k = anc.length - 1; k >= 0; k--) {
      const F = anc[k]; if (!/Function|Program/.test(F.type)) continue;
      if (scopes.has(F)) return true;
      if (declared.get(F)?.has(nm)) return false;
    }
    return false;
  };
  // Resolve a const binding visible at anc (innermost declaring function wins).
  const constAt = (kind, nm, anc) => {
    const list = consts.get(nm); if (!list) return undefined;
    for (let k = anc.length - 1; k >= 0; k--) {
      const F = anc[k]; if (!/Function|Program/.test(F.type)) continue;
      const hit = list.find(c => c.F === F); if (hit) return hit.kind === kind ? hit.value : undefined;
      if (declared.get(F)?.has(nm)) return undefined;
    }
    return undefined;
  };
  fileCtx.constAt = constAt;
  const isAliasIn = (map, nm, anc) => {
    const scopes = map.get(nm); if (!scopes) return false;
    for (let k = anc.length - 1; k >= 0; k--) { const F = anc[k]; if (!/Function|Program/.test(F.type)) continue; if (scopes.has(F)) return true; if (declared.get(F)?.has(nm)) return false; }
    return false;
  };
  const isEnvObj = o => isProcessEnv(o) || (o?.type === "Identifier" && isAliasAt(o.name, curAnc)) ||
    (o?.type === "MemberExpression" && !o.computed && o.property.name === "env" && o.object.type === "Identifier" && isAliasIn(processAliases, o.object.name, curAnc));
  const isAcc = o => o?.type === "Identifier" && accessorLocals.has(o.name);
  const keyName = (m) => {
    if (!m.computed) return m.property.name;
    const v = lit(m.property); if (typeof v === "string") return v;
    if (m.property.type === "Identifier") { const c = constAt("lit", m.property.name, curAnc); if (typeof c === "string") return c; }
    return null;
  };
  const enclosingFn = anc => { for (let k = anc.length - 2; k >= 0; k--) if (/Function/.test(anc[k].type)) return [anc[k], k]; return [null, -1]; };
  // Set-site helpers (per file).
  const envObjSeen = new Set(); const envObjects = []; // {name, F, keys, site}
  const fnOfAnc = anc => [...anc].reverse().find(x => /Function/.test(x.type)) ?? ast;
  const fnTextCache = new Map();
  const fnText = anc => { const F = fnOfAnc(anc); if (!fnTextCache.has(F)) fnTextCache.set(F, s.slice(F.start, F.end)); return fnTextCache.get(F); };
  const envIdentCache = new Map();
  const envIdents = anc => { const F = fnOfAnc(anc); if (!envIdentCache.has(F)) { const set = new Set(); walk.simple(F, { Property(q) { if (!q.computed && q.key.name === "env" && q.value.type === "Identifier") set.add(q.value.name); }, AssignmentExpression(q) { if (q.left.type === "MemberExpression" && !q.left.computed && q.left.property.name === "env" && q.right.type === "Identifier") set.add(q.right.name); } }); envIdentCache.set(F, set); } return envIdentCache.get(F); };
  const envObjByName = (nm, anc) => { const F = fnOfAnc(anc); return envObjects.find(o => o.name === nm && o.F === F); };
  const valueOf = v => {
    if (!v) return { kind: "runtime" };
    const L = lit(v); if (typeof L === "string") return { kind: "literal", value: L };
    if (v.type === "Identifier" && v.name === "undefined" || (v.type === "UnaryExpression" && v.operator === "void")) return { kind: "removed" };
    if (v.type === "ConditionalExpression" && typeof lit(v.consequent) === "string" && typeof lit(v.alternate) === "string") return { kind: "one-of", values: [lit(v.consequent), lit(v.alternate)] };
    if (v.type === "CallExpression" && v.callee.name === "String" && v.arguments[0]?.type === "MemberExpression" && v.arguments[0].object.name === "process" && v.arguments[0].property.name === "pid") return { kind: "runtime", hint: "Claude Code's process ID" };
    return { kind: "runtime" };
  };
  const addSet = (key, node, valueNode, anc, siblingKeys, conditional, site) => {
    const F = fnOfAnc(anc); const t = fnText(anc);
    // Conditions: string literals compared in enclosing if-tests (for example hook event names).
    const conds = [];
    for (let k = anc.length - 2; k >= 0 && anc[k] !== F; k--) if (anc[k].type === "IfStatement") walk.simple(anc[k].test, { Literal(l) { if (typeof l.value === "string" && /^[A-Z][A-Za-z]+$/.test(l.value)) conds.push(l.value); } });
    const rec = { file: f, start: node.start, end: node.end, value: valueOf(valueNode), conditional: conditional || conds.length > 0, conds, keys: siblingKeys, context: t.length < 400000 ? t : "" };
    const receivers = RECEIVERS.filter(r => r.keys.every(k => siblingKeys.includes(k)) && (!r.context || r.context.test(rec.context))).map(r => r.label);
    rec.receivers = [...new Set(receivers)]; delete rec.context;
    if (!setSites.has(key)) setSites.set(key, []);
    if (!setSites.get(key).some(x => x.file === f && x.start === node.start)) setSites.get(key).push(rec);
  };
  const collectEnvObject = (obj, anc, declName) => {
    const props = []; const visit = (o, cond) => { envObjSeen.add(o); for (const q of o.properties) {
      if (q.type === "Property" && !q.computed) { const k = q.key.name ?? q.key.value; if (typeof k === "string" && SETNAME.test(k)) props.push([k, q, q.value, cond]); }
      else if (q.type === "SpreadElement") { const a = q.argument; const inner = a.type === "LogicalExpression" ? a.right : a.type === "ConditionalExpression" ? [a.consequent, a.alternate] : null; for (const x of [inner].flat()) if (x?.type === "ObjectExpression") visit(x, true); }
    } };
    visit(obj, false);
    if (!props.length) return;
    const keys = props.map(p => p[0]);
    envObjects.push({ name: declName, F: fnOfAnc(anc), keys, site: obj });
    for (const [k, q, v, cond] of props) addSet(k, q, v, anc, keys, cond, obj);
  };
  const fnName = (anc, k) => {
    const fn = anc[k]; if (fn.id) return fn.id.name;
    const p = anc[k - 1]; if (p?.type === "VariableDeclarator" && p.id.type === "Identifier") return p.id.name;
    return null;
  };
  const record = (name, node, how, obs, anc, listFirstParty = false) => {
    const fd = [...anc].reverse().find(x => x.type === "FunctionDeclaration");
    if (obs.returned) { const k = anc.findLastIndex(x => /Function/.test(x.type)); if (k >= 0 && anc[k].params.length === 0) { const nm = fnName(anc, k); if (nm) wrappers.set(`${origin(f, nm)}`, { name, how }); } }
    addSite(name, { file: f, start: node.start, end: node.end, how, obs, listFirstParty, fn: fd ? [fd.start, fd.end] : null });
    if (debug.length < 200000) debug.push({ name, file: f, how, as: [...obs.as], values: [...obs.values], defaults: [...obs.defaults], ctx: s.slice(Math.max(0, node.start - 140), Math.min(s.length, node.end + 140)) });
  };
  walk.fullAncestor(ast, (n, _st, anc) => {
    curAnc = anc;
    const i = anc.length - 1; const parent = anc[i - 1];
    if (n.type === "FunctionDeclaration" && n.params.length === 1 && n.end - n.start < 220) {
      let pi = false; walk.simple(n.body, { CallExpression(c) { if (c.callee.type === "Identifier" && c.callee.name === "parseInt" && lit(c.arguments[1]) === 10) pi = true; } });
      if (pi) NUMBER_ORIGINS.add(`${f}#${n.id.name}`);
    }
    if (n.type === "FunctionDeclaration" && n.params.length === 1 && (n.params[0].type === "AssignmentPattern" ? n.params[0].left : n.params[0]).type === "ObjectPattern" && ["scope", "ttl"].every(k => (n.params[0].type === "AssignmentPattern" ? n.params[0].left : n.params[0]).properties.some(p => p.key?.name === k)) && s.slice(n.start, n.end).includes('"ephemeral"')) evidence.cache_control_builder = { file: f, start: n.start, end: n.end };
    if (n.type === "Literal" && n.value === "prompt-caching-disabled" && parent?.type === "Property" && anc[i - 2]?.type === "ObjectExpression") evidence.caching_off_notice = { file: f, start: anc[i - 2].start, end: anc[i - 2].end };
    if (n.type === "MemberExpression" && (isEnvObj(n.object) || isAcc(n.object))) {
      const acc = isAcc(n.object);
      if (acc && !n.computed && (n.property.name === "set" || n.property.name === "unset")) {
        if (parent?.type === "CallExpression" && parent.callee === n) { const v = lit(parent.arguments[0]); if (typeof v === "string") addWrite(v, { file: f, start: parent.start, end: parent.end, value: n.property.name === "unset" ? { kind: "removed" } : typeof lit(parent.arguments[1]) === "string" ? { kind: "literal", value: lit(parent.arguments[1]) } : parent.arguments[1]?.type === "UnaryExpression" && parent.arguments[1].operator === "!" && typeof lit(parent.arguments[1].argument) === "number" ? { kind: "literal", value: lit(parent.arguments[1].argument) ? "0" : "1" } : { kind: "runtime" } }); }
        return;
      }
      const name = keyName(n);
      if (parent?.type === "AssignmentExpression" && parent.left === n) { if (name) addWrite(name, { file: f, start: parent.start, end: parent.end, value: typeof lit(parent.right) === "string" ? { kind: "literal", value: lit(parent.right) } : { kind: "runtime" } }); return; }
      if (parent?.type === "UnaryExpression" && parent.operator === "delete") { if (name) addWrite(name, { file: f, start: parent.start, end: parent.end, value: { kind: "removed" } }); return; }
      if (name && ["hasOwnProperty", "toString", "constructor"].includes(name) && !n.computed) {
        if (parent?.type === "CallExpression" && parent.callee === n) { const v = lit(parent.arguments[0]); if (typeof v === "string") record(v, parent, "presence-check", { as: new Set(["presence"]), values: new Set(), defaults: new Set() }, anc); }
        return;
      }
      if (name) {
        if (acc && !registry.has(name)) return; // no getter: not an env read
        record(name, n, acc ? "typed-accessor" : "process.env", classify(anc, i, fileCtx), anc);
        return;
      }
      if (n.computed && (n.property.type === "TemplateLiteral" || (n.property.type === "BinaryExpression" && n.property.operator === "+"))) {
        const parts = []; const flat = x => { if (x.type === "BinaryExpression" && x.operator === "+") { flat(x.left); flat(x.right); } else if (x.type === "TemplateLiteral") x.quasis.forEach((q, qi) => { parts.push(q.value.cooked); if (qi < x.expressions.length) parts.push("*"); }); else { const v = lit(x); parts.push(typeof v === "string" ? v : "*"); } };
        flat(n.property); const pattern = parts.join("").replace(/\*+/g, "*");
        if (/^[A-Za-z_*][A-Za-z0-9_*]*$/.test(pattern) && pattern !== "*") { if (!families.has(pattern)) families.set(pattern, []); families.get(pattern).push({ file: f, start: n.start, end: n.end, obs: classify(anc, i, fileCtx) }); }
        return;
      }
      // process.env[row[k]] where row = TABLE.find(…) and TABLE is a literal array of arrays
      if (n.computed && n.property.type === "MemberExpression" && n.property.object.type === "Identifier" && typeof lit(n.property.property) === "number") {
        const rowVar = n.property.object.name; const col = lit(n.property.property);
        for (let k = anc.length - 2; k >= 0; k--) {
          if (!/Function/.test(anc[k].type)) continue;
          let names = null;
          walk.simple(anc[k].body, { VariableDeclarator(d) { if (!names && d.id.type === "Identifier" && d.id.name === rowVar && d.init?.type === "CallExpression" && d.init.callee.type === "MemberExpression" && d.init.callee.object.type === "Identifier") { const t = constAt("table", d.init.callee.object.name, anc); if (t) names = t.map(r => r[col]); } } });
          if (names) { const obs = classify(anc, i, fileCtx); for (const el of names) if (typeof lit(el) === "string") record(lit(el), el, "table-lookup", obs, anc); }
          break;
        }
        return;
      }
      // Computed key from a function parameter: a helper reading env by name, or a callback over a list.
      if (n.computed && n.property.type === "Identifier") {
        let fn = null, k = -1, pi = -1;
        for (let q = anc.length - 2; q >= 0; q--) {
          if (!/Function/.test(anc[q].type)) continue;
          const idx = anc[q].params.findIndex(p => (p.type === "AssignmentPattern" ? p.left : p).name === n.property.name);
          if (idx >= 0) { fn = anc[q]; k = q; pi = idx; break; }
          if (declared.get(anc[q])?.has(n.property.name)) break;
        }
        if (!fn) return;
        const obs = classify(anc, i, fileCtx);
        const cb = anc[k - 1];
        if (cb?.type === "CallExpression" && cb.arguments.includes(fn) && cb.callee.type === "MemberExpression") {
          const recv = cb.callee.object;
          const els = recv.type === "ArrayExpression" ? recv.elements : recv.type === "Identifier" ? constAt("arr", recv.name, anc) : null;
          if (els?.every(x => typeof lit(x) === "string")) { const fpl = els.some(x => FIRST_PARTY_PREFIX.test(lit(x))); for (const el of els) record(lit(el), el, "list-iteration", obs, anc, fpl); }
          return;
        }
        const nm = fnName(anc, k);
        if (nm) helpers.set(`${f}#${nm}`, { param: pi, obs, file: f, acc });
      }
      return;
    }
    // P.NAME / P.env.NAME / {env}.NAME where P is a parameter: an env object only if some caller passes
    // process.env there (directly, or as the env field of an object literal). Resolved after pass 1.
    if (n.type === "MemberExpression" && !n.computed && LITNAME.test(n.property.name) && !(parent?.type === "AssignmentExpression" && parent.left === n)) {
      const pr = (key) => paramReads.push({ key, name: n.property.name, file: f, start: n.start, end: n.end, obs: classify(anc, i, fileCtx), ctx: s.slice(Math.max(0, n.start - 140), Math.min(s.length, n.end + 140)) });
      const o = n.object;
      const base = o.type === "Identifier" ? o : (o.type === "MemberExpression" && !o.computed && o.property.name === "env" && o.object.type === "Identifier") ? o.object : null;
      const viaEnvField = base !== o;
      if (base) for (let q = anc.length - 2; q >= 0; q--) {
        if (!/Function/.test(anc[q].type)) continue;
        let idx = anc[q].params.findIndex(p => (p.type === "AssignmentPattern" ? p.left : p).name === base.name);
        let envField = viaEnvField;
        if (idx < 0 && !viaEnvField) { idx = anc[q].params.findIndex(p => p.type === "ObjectPattern" && p.properties.some(pp => (pp.key?.name === "env") && pp.value?.type === "Identifier" && pp.value.name === base.name)); envField = idx >= 0; }
        if (idx >= 0) {
          const ctor = anc[q - 1]?.type === "MethodDefinition" && anc[q - 1].kind === "constructor" ? [...anc.slice(0, q)].reverse().find(x => x.type === "ClassDeclaration" || x.type === "ClassExpression") : null;
          const cname = ctor ? (ctor.id?.name ?? (anc[anc.indexOf(ctor) - 1]?.type === "VariableDeclarator" ? anc[anc.indexOf(ctor) - 1].id.name : null)) : null;
          if (cname) pr(envField ? `${origin(f, cname)}|class|env` : `${origin(f, cname)}|${idx}`);
          else { const nm = fnName(anc, q); if (nm) pr(`${origin(f, nm)}|${idx}${envField ? "|env" : ""}`); }
          break;
        }
        if (declared.get(anc[q])?.has(base.name)) break;
      }
      // this.<deps>.env.NAME inside a class constructed with {env: process.env}
      if (o.type === "MemberExpression" && !o.computed && o.property.name === "env" && o.object.type === "MemberExpression" && o.object.object.type === "ThisExpression") {
        const cls = [...anc].reverse().find(x => x.type === "ClassDeclaration" || x.type === "ClassExpression");
        const cname = cls?.id?.name ?? (anc[anc.indexOf(cls) - 1]?.type === "VariableDeclarator" ? anc[anc.indexOf(cls) - 1].id.name : null);
        if (cname) pr(`${origin(f, cname)}|class|env`);
      }
    }
    if ((n.type === "CallExpression" || n.type === "NewExpression") && n.callee.type === "Identifier") n.arguments.forEach((arg, ai) => {
      const co = origin(f, n.callee.name);
      const envLike = x => !!x && (isEnvObj(x) || (x.type === "ObjectExpression" && x.properties.some(pp => pp.type === "SpreadElement" && isEnvObj(pp.argument))) ||
        (x.type === "ConditionalExpression" && (envLike(x.consequent) || envLike(x.alternate))) || (x.type === "LogicalExpression" && (envLike(x.left) || envLike(x.right))));
      if (envLike(arg)) envArgCalls.add(`${co}|${ai}`);
      if (arg.type === "ObjectExpression" && arg.properties.some(pp => pp.key?.name === "env" && (isEnvObj(pp.value) || (pp.value?.type === "ObjectExpression" && pp.value.properties.some(q => q.type === "SpreadElement" && isEnvObj(q.argument)))))) { envArgCalls.add(`${co}|${ai}|env`); if (n.type === "NewExpression") envArgCalls.add(`${co}|class|env`); }
    });
    // for (const k of ["A","B"]) … process.env[k]
    if (n.type === "ForOfStatement" && n.left.type === "VariableDeclaration" && n.left.declarations[0].id.type === "Identifier") {
      const v = n.left.declarations[0].id.name; const r = n.right;
      const els = r.type === "ArrayExpression" ? r.elements : r.type === "Identifier" ? constAt("arr", r.name, anc) : null;
      if (!els?.every(x => typeof lit(x) === "string")) return;
      let hit = null;
      walk.fullAncestor(n.body, (m, _s2, a2) => { if (!hit && m.type === "MemberExpression" && m.computed && isEnvObj(m.object) && m.property.type === "Identifier" && m.property.name === v) hit = classify([...anc, ...a2.slice(1)], anc.length + a2.length - 2, fileCtx); });
      if (hit) { const fpl = els.some(x => FIRST_PARTY_PREFIX.test(lit(x))); for (const el of els) record(lit(el), el, "list-iteration", hit, anc, fpl); }
      return;
    }
    // "X" in process.env
    if (n.type === "BinaryExpression" && n.operator === "in" && isEnvObj(n.right)) { const v = lit(n.left); if (typeof v === "string") record(v, n, "presence-check", { as: new Set(["presence"]), values: new Set(), defaults: new Set() }, anc); return; }
    // Object.hasOwn(process.env,"X") / hasOwnProperty.call(process.env,"X") are presence checks; any other
    // get(envObj, "X") call hands the env object and a literal name to a getter.
    if (n.type === "CallExpression" && n.arguments.length === 2 && isEnvObj(n.arguments[0]) && typeof lit(n.arguments[1]) === "string") {
      const c = n.callee; const own = c.type === "MemberExpression" && !c.computed && (c.property.name === "hasOwn" || c.property.name === "call");
      record(lit(n.arguments[1]), n, own ? "presence-check" : "env-getter-call", own ? { as: new Set(["presence"]), values: new Set(), defaults: new Set() } : classify(anc, i, fileCtx), anc); return;
    }
    // const {A, B} = process.env
    if (n.type === "VariableDeclarator" && n.id.type === "ObjectPattern" && (isEnvObj(n.init) || isAcc(n.init))) {
      for (const p of n.id.properties) { const k = p.key?.name ?? p.key?.value; if (k && (!isAcc(n.init) || registry.has(k))) record(k, p, "destructured", { as: new Set(["string"]), values: new Set(), defaults: new Set() }, anc); }
      return;
    }
    // Child environments: object literals passed as an env option, spreading process.env, or marked with
    // CLAUDECODE; plus member assignments into such objects. Each key is a variable Claude Code sets.
    if (n.type === "ObjectExpression" && !envObjSeen.has(n)) {
      const par = anc[i - 1];
      const asEnv = par?.type === "Property" && !par.computed && par.key.name === "env" && par.value === n;
      const spreadEnv = n.properties.some(q => q.type === "SpreadElement" && isEnvObj(q.argument));
      const marked = n.properties.some(q => q.type === "Property" && !q.computed && (q.key.name ?? q.key.value) === "CLAUDECODE");
      const declName = par?.type === "VariableDeclarator" && par.init === n && par.id.type === "Identifier" ? par.id.name : null;
      const usedAsEnv = declName && envIdents(anc).has(declName);
      if (asEnv || spreadEnv || marked || usedAsEnv) collectEnvObject(n, anc, declName);
    }
    if (n.type === "AssignmentExpression" && n.left.type === "MemberExpression" && n.left.object.type === "Identifier" && !isEnvObj(n.left.object)) {
      const m = n.left; const key = !m.computed ? m.property.name : typeof lit(m.property) === "string" ? lit(m.property) : m.property.type === "TemplateLiteral" ? m.property.quasis.map(q => q.value.cooked).join("*") : null;
      const obj = envObjByName(m.object.name, anc);
      if (key && SETNAME.test(key.replace(/\*/g, "X")) && (obj || /Hook command references/.test(fnText(anc)))) addSet(key, n, n.right, anc, obj?.keys ?? [], true, obj?.site ?? null);
    }
    if (n.type === "MethodDefinition" && !n.computed && n.key.name === "spawnEnvKeys") walk.simple(n.value.body, { ForOfStatement(fo) { if (fo.right.type === "Identifier") { const els = constAt("arr", fo.right.name, anc); if (els) els.forEach(e => spawnKeyList.set(lit(e), { file: f, start: e.start, end: e.end })); } } });
    // Zero-argument calls tested for truthiness: resolved against value-returning wrappers after pass 1.
    if (n.type === "CallExpression" && n.arguments.length === 0 && n.callee.type === "Identifier" && classify(anc, i, fileCtx).as.has("presence")) truthyCalls.push({ origin: origin(f, n.callee.name), file: f, start: n.start, end: n.end });
    // Candidate helper call: callee(…"NAME"…); resolved after all helpers are known.
    if (n.type === "CallExpression" && n.callee.type === "Identifier") {
      n.arguments.forEach((arg, ai) => {
        const v = lit(arg); if (typeof v !== "string" || !LITNAME.test(v)) return;
        pendingCalls.push({ file: f, calleeOrigin: origin(f, n.callee.name), argIndex: ai, name: v, start: n.start, end: n.end, obs: classify(anc, i, fileCtx), ctx: s.slice(Math.max(0, n.start - 140), Math.min(s.length, n.end + 140)) });
      });
    }
  });
}

// Caching evidence: the functions that hold the TTL resolver and the per-model cache check.
const fnOf = (name, how) => { const r = sites.get(name)?.find(x => x.how === how && x.fn); return r ? { file: r.file, start: r.fn[0], end: r.fn[1] } : undefined; };
Object.assign(evidence, { ttl_resolver: fnOf("FORCE_PROMPT_CACHING_5M", "typed-accessor"), cache_enable_check: fnOf("DISABLE_PROMPT_CACHING_SONNET", "process.env"), ...evidence });
for (const k of Object.keys(evidence)) if (!evidence[k]) delete evidence[k];
// Caching semantics in CACHE_NOTES were traced by hand. Fingerprint the traced functions with identifiers
// normalised away; if the shape differs from the traced release, flag the notes for re-verification.
const TRACED_SHAPES = { ttl_resolver: "e45b4330b4123217", cache_enable_check: "4af75fcd5c4f556a", cache_control_builder: "9b978583953a363b" }; // traced against 2.1.280
const shapeOf = r => { const src = text(r.file).slice(r.start, r.end); const toks = []; for (const t of acorn.tokenizer(src, { ecmaVersion: "latest" })) toks.push(t.type.label === "name" ? (/^[A-Z][A-Z0-9_]{2,}$/.test(t.value) ? t.value : "i") : t.type.label === "string" ? JSON.stringify(t.value) : t.value ?? t.type.label); return createHash("sha256").update(toks.join(" ")).digest("hex").slice(0, 16); };
const cachingShapes = Object.fromEntries(Object.keys(TRACED_SHAPES).map(k => [k, evidence[k] ? shapeOf(evidence[k]) : null]));
const cachingVerified = Object.entries(TRACED_SHAPES).every(([k, v]) => cachingShapes[k] === v);
if (!cachingVerified) console.warn(`env-vars: caching code shape differs from the traced release; caching notes flagged for re-verification ${JSON.stringify(cachingShapes)}`);
// Values passed straight into a small parseInt wrapper are numbers.
for (const list of sites.values()) for (const r of list) if (r.obs.callee && NUMBER_ORIGINS.has(r.obs.callee)) { r.obs.as.delete("string"); r.obs.as.add("number"); }
for (const r of paramReads) if (envArgCalls.has(r.key)) {
  if (r.obs.callee && NUMBER_ORIGINS.has(r.obs.callee)) { r.obs.as.delete("string"); r.obs.as.add("number"); }
  addSite(r.name, { file: r.file, start: r.start, end: r.end, how: r.key.endsWith("|env") ? "injected-env" : "env-object-param", obs: r.obs });
  debug.push({ name: r.name, file: r.file, how: r.key.endsWith("|env") ? "injected-env" : "env-object-param", as: [...r.obs.as], values: [...r.obs.values], defaults: [...r.obs.defaults], ctx: r.ctx });
}
const helperCallCount = new Map();
for (const c of pendingCalls) {
  const h = helpers.get(c.calleeOrigin);
  if (!h || h.param !== c.argIndex) continue;
  if (c.obs.callee && NUMBER_ORIGINS.has(c.obs.callee)) { c.obs.as.delete("string"); c.obs.as.add("number"); }
  const obs = { as: new Set([...h.obs.as].filter(x => x !== "string").concat(c.obs.as.has("string") ? [] : [...c.obs.as])), values: new Set([...h.obs.values, ...c.obs.values]), defaults: new Set(c.obs.defaults) };
  if (obs.as.size === 0) obs.as.add("string");
  addSite(c.name, { file: c.file, start: c.start, end: c.end, how: "helper", helper: c.calleeOrigin, obs });
  helperCallCount.set(c.calleeOrigin, (helperCallCount.get(c.calleeOrigin) ?? 0) + 1);
  debug.push({ name: c.name, file: c.file, how: "helper", helper: c.calleeOrigin, as: [...obs.as], values: [...obs.values], defaults: [...obs.defaults], ctx: c.ctx });
}

// ---------- docs: env-vars.md (any mention) and table rows on any page count as documented ----------
const docDir = `${WORK}docs/pages/`;
const pageUrl = p => DOCS + p.replace(/\.md$/, "").replace(/__/g, "/");
const docRow = new Map(); // name -> {url, cell}
const mentions = new Map(); // name -> [urls]
if (existsSync(docDir)) {
  const pages = readdirSync(docDir).sort((a, b) => (a === "env-vars.md" ? -1 : b === "env-vars.md" ? 1 : a.localeCompare(b)));
  for (const p of pages) {
    const md = readFileSync(docDir + p, "utf8"); const url = pageUrl(p);
    // Tables: pick the description and default columns by header, never by position alone.
    const lines = md.split("\n"); const cellsOf = l => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map(c => c.trim());
    for (let li = 0; li + 1 < lines.length; li++) {
      if (!/^\s*\|/.test(lines[li]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[li + 1])) continue;
      const head = cellsOf(lines[li]);
      let dcol = head.findIndex((h, k) => k > 0 && /description|purpose|meaning|what it does|effect|details|notes?|use/i.test(h));
      if (dcol < 0 && head.length === 2 && !/default|value|example|type|required/i.test(head[1])) dcol = 1;
      const defcol = head.findIndex((h, k) => k > 0 && /default/i.test(h));
      for (let r = li + 2; r < lines.length && /^\s*\|/.test(lines[r]); r++) {
        const cells = cellsOf(lines[r]); const m = cells[0]?.match(/^`([A-Za-z_][A-Za-z0-9_]*)`$/);
        if (!m || docRow.has(m[1])) continue;
        docRow.set(m[1], { url, cell: dcol >= 0 ? cells[dcol] ?? null : null, def: defcol >= 0 ? cells[defcol] ?? null : null, header: head.join(" | ") });
      }
    }
    for (const m of md.matchAll(/`([A-Za-z_][A-Za-z0-9_]{2,})(?:=[^`]*)?`/g)) {
      if (!mentions.has(m[1])) mentions.set(m[1], []);
      if (!mentions.get(m[1]).includes(url)) mentions.get(m[1]).push(url);
    }
  }
}
const ENV_PAGE = pageUrl("env-vars.md");
const documentedUrl = name => docRow.get(name)?.url ?? (mentions.get(name)?.includes(ENV_PAGE) ? ENV_PAGE : null);
const cleanDoc = d => d.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const firstSentence = d => { const c = cleanDoc(d); const m = c.match(/^(.+?[.!?])(\s+(?=[A-Z`])|$)/); return (m ? m[1] : c).trim(); };

// ---------- caching: descriptions traced in code (chunk-dt8bvbsd.js request path, chunk-m200zvyg.js model helpers) ----------
const CACHING_EXTRA = new Set(["CLAUDE_CODE_SUBAGENT_CACHE_EVICT", "CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS"]);
const MODEL_CHECK = "the check that decides whether a request gets prompt-cache markers";
const CACHE_NOTES = {
  DISABLE_PROMPT_CACHING: `When truthy, ${MODEL_CHECK} returns false for every model. It is checked before the per-model variables, so it overrides them. That check applies whenever a caller does not pass its own caching flag. No caller in this build passes a literal true; several internal side requests pass a literal false, and a few forward a value that this reference does not trace. It also sets the workflow same-prefix stagger wait to 0. When it or the HAIKU, OPUS, SONNET or FABLE variable is truthy, a warning notice reads "Prompt caching off ({{DISABLED_CACHE_VARS}}), requests will be slower and cost more · unset it to re-enable". {{DISABLED_CACHE_VARS}} is the set variables from that list of five, joined with ", ".`,
  DISABLE_PROMPT_CACHING_HAIKU: `When truthy, ${MODEL_CHECK} returns false only for a request whose model equals the resolved small/fast model. That model must also differ from the main-loop model. The check runs only when a small/fast model applies: ANTHROPIC_SMALL_FAST_MODEL or ANTHROPIC_DEFAULT_HAIKU_MODEL is set, or an internal provider/login condition holds.`,
  DISABLE_PROMPT_CACHING_SONNET: `When truthy, ${MODEL_CHECK} returns false only when the request's model ID equals the resolved default Sonnet model: ANTHROPIC_DEFAULT_SONNET_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Sonnet models", but this check does not match other Sonnet model IDs.`,
  DISABLE_PROMPT_CACHING_OPUS: `When truthy, ${MODEL_CHECK} returns false only when the request's model ID equals the resolved default Opus model: ANTHROPIC_DEFAULT_OPUS_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Opus models", but this check does not match other Opus model IDs.`,
  DISABLE_PROMPT_CACHING_FABLE: `When truthy, ${MODEL_CHECK} returns false when the model ID contains "claude-fable-" or equals ANTHROPIC_DEFAULT_FABLE_MODEL after normalization.`,
  DISABLE_PROMPT_CACHING_MYTHOS: `Typed boolean. When truthy, ${MODEL_CHECK} returns false when the model ID contains "claude-mythos-". The "Prompt caching off" warning notice does not list it.`,
  FORCE_PROMPT_CACHING_5M: "Step 1 of TTL resolution. When truthy, every request resolved through the TTL resolver gets the 5-minute TTL, ahead of all TTL variables, settings and agent frontmatter.",
  CLAUDE_CODE_PROMPT_CACHE_TTL: `Step 2 of TTL resolution, for main-conversation requests: the interactive main thread, SDK, auto-mode and memory-relevance requests. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the promptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.`,
  CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL: `Step 2 of TTL resolution, for every request that is not a main-conversation request, such as subagents and background work. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the subagentPromptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.`,
  ENABLE_PROMPT_CACHING_1H: "Step 5 of TTL resolution. When truthy, requests with no FORCE_PROMPT_CACHING_5M, no TTL variable, no TTL setting and no agent-frontmatter TTL get the 1-hour TTL. The resolver does not restrict it by provider or model. It is evaluated before the subscriber and overage fallback, so it also applies to non-subscribers and during overage.",
  ENABLE_PROMPT_CACHING_1H_BEDROCK: "Step 5 of TTL resolution. Has the same effect as ENABLE_PROMPT_CACHING_1H, but only when the provider is Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK).",
  CLAUDE_CODE_SUBAGENT_CACHE_EVICT: "Typed boolean. When truthy, and two internal capability checks pass, a request that asks to evict its cache on completion gets the prompt-caching evict beta. Its cache_control marker then carries evict_on_complete: true. When unset, a remote feature flag decides.",
  CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS: "Read as an integer. The stagger wait is 0 when DISABLE_PROMPT_CACHING is truthy.",
};
const CACHE_SUMMARY = [
  "The request path makes two decisions from code. The first is whether a request gets `cache_control` markers, which the DISABLE_PROMPT_CACHING* variables control. The second is the TTL those markers carry.",
  "When caching is on, system-prompt blocks that have a cache scope carry `cache_control: {type: \"ephemeral\"}`, plus `ttl: \"1h\"` when the resolved TTL is 1 hour; a 5-minute TTL sends no `ttl` field, and globally scoped blocks also carry `scope: \"global\"`. Message cache markers use the same enable check and the same resolved TTL.",
  "TTL resolution, first match wins:",
  "1. FORCE_PROMPT_CACHING_5M sets 5m.",
  "2. CLAUDE_CODE_PROMPT_CACHE_TTL for main-conversation requests, or CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL for all other requests (`5m` or `1h` only).",
  "3. The settings `promptCacheTtl` / `subagentPromptCacheTtl`.",
  "4. The agent's frontmatter TTL. A `1h` value is skipped while a subscriber is using overage.",
  "5. ENABLE_PROMPT_CACHING_1H, or ENABLE_PROMPT_CACHING_1H_BEDROCK when the provider is Bedrock, sets 1h.",
  "6. Otherwise, non-subscribers and subscribers using overage get 5m. Subscribers get 1h when the request's source is on a remotely configured allowlist, which defaults to the main-conversation sources, and 5m otherwise.",
  "Only step 5's BEDROCK variant depends on the provider. The per-model disables compare against resolved model IDs, as noted per variable.",
];

// ---------- grouping: caching, then name domains, then first-party vs third-party-only by evidence ----------
const GROUPS = [
  "Prompt caching",
  "Claude Code and Anthropic",
  "Providers: Amazon Bedrock and AWS",
  "Providers: Google Vertex AI and Google Cloud",
  "Providers: Microsoft Foundry and Azure",
  "Providers: gateways",
  "Telemetry and observability",
  "Network, proxy and TLS",
  "Shell, terminal, OS and CI environment",
  "Set by Claude Code for tools, hooks, and child processes",
  "Read only by bundled third-party libraries",
];
function groupOf(name, ev) {
  if (/PROMPT_CACH|PROMPT_CACHE/.test(name) || CACHING_EXTRA.has(name)) return GROUPS[0];
  if (SHELL_OS.test(name) && !FIRST_PARTY_PREFIX.test(name) && !NETWORK.test(name)) return GROUPS[8];
  const thirdPartyOnly = !ev.registry && !ev.accessor && !ev.boolHelper && !ev.firstPartyList && !FIRST_PARTY_PREFIX.test(name) && !ev.documented;
  if (thirdPartyOnly) return GROUPS[10];
  if (/OTEL|TELEMETRY|DATADOG|TRACING|METRICS|PERFETTO|^TRACE(PARENT|STATE)$|^DO_NOT_TRACK$/.test(name)) return GROUPS[6];
  if (/BEDROCK|MANTLE|^AWS_|_AWS_|_AWS$|^AMZ/.test(name)) return GROUPS[2];
  if (/VERTEX|GOOGLE|GCLOUD|CLOUDSDK|^GCP_|_GCP_|^GCE_|^CLOUD_ML_REGION/i.test(name)) return GROUPS[3];
  if (/FOUNDRY|AZURE|^MSI_|^IDENTITY_(ENDPOINT|HEADER)/.test(name)) return GROUPS[4];
  if (/GATEWAY/.test(name)) return GROUPS[5];
  if (NETWORK.test(name)) return GROUPS[7];
  return GROUPS[1];
}

// ---------- assemble items ----------
const READ_AS = {
  bool: ["boolean", "true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false"],
  triBool: ["tri-state boolean", "1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset"],
  "bool-false-check": ["boolean off-switch", "the code checks for 0/false/no/off"],
  int: ["integer", "parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset"],
  number: ["number", "parsed as a number"],
  enum: ["enum", "compared against fixed values"],
  str: ["string", "trimmed; empty is treated as unset"],
  rawStr: ["string", "used as-is (not trimmed)"],
  string: ["string", "raw value; further parsing not traced"],
  list: ["list", "string split into a list"],
  presence: ["presence", "only whether it is set (or truthy) matters"],
};
const litOpt = v => (typeof v === "number" || typeof v === "boolean") ? v : undefined;
const kebab = n => n.replace(/\*/g, "x").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const upperNames = new Set([...sites.keys()].filter(n => n === n.toUpperCase()));
const items = []; const ids = new Set();
function makeItem(name, list, family = false) {
  const reg = family ? null : registry.get(name);
  const as = new Set(), values = new Set(), defaults = new Set(), hows = new Set();
  for (const r of list) { r.obs.as.forEach(x => as.add(x)); r.obs.values.forEach(x => values.add(x)); r.obs.defaults.forEach(x => defaults.add(x)); hows.add(r.how ?? "template-key"); }
  if (reg?.type === "enum") { values.clear(); (reg.opts?.values ?? []).forEach(x => values.add(x)); }
  let readAs;
  if (reg) readAs = reg.type in READ_AS ? reg.type : "str";
  else if (as.has("bool")) readAs = "bool";
  else if (as.has("bool-false-check")) readAs = "bool-false-check";
  else if (as.has("number")) readAs = "number";
  else if (as.has("enum") && values.size) readAs = "enum";
  else if (as.has("list")) readAs = "list";
  else if (as.size && [...as].every(x => x === "presence" || x === "defined")) readAs = "presence";
  else readAs = "string";
  if (!["enum"].includes(readAs) && !reg) { /* comparisons against literals still worth listing */ }
  const opts = {};
  for (const [k, v] of Object.entries(reg?.opts ?? {})) { if (k === "values") continue; const lv = litOpt(v); if (lv !== undefined) opts[k] = lv; }
  const defs = [...defaults].map(x => JSON.parse(x)).filter(v => (typeof v === "number" || typeof v === "boolean" || (typeof v === "string" && v.length <= 80 && !/[;{}]|=>|function/.test(v))));
  const def = defs.length === 1 ? defs[0] : null;
  const docUrl = family ? null : documentedUrl(name);
  const famRe = family ? new RegExp("^" + name.replace(/\*/g, "[A-Z0-9_]+") + "$") : null;
  const famMatches = family ? [...new Set([...docRow.keys(), ...(mentions.keys())])].filter(k => famRe.test(k) && documentedUrl(k)).sort() : [];
  const docCell = docRow.get(name)?.cell;
  const ev = { registry: !!reg, accessor: hows.has("typed-accessor"), boolHelper: list.some(r => r.obs.as.has("bool") || r.obs.as.has("bool-false-check")), documented: !!docUrl, firstPartyList: list.some(r => r.listFirstParty) };
  const group = family ? (/^OTEL/.test(name) ? GROUPS[6] : GROUPS[8]) : groupOf(name, ev);
  // Sites that test a raw string for truthiness: any non-empty value passes, including "0" and "false".
  const RAW_HOWS = ["process.env", "destructured", "env-object-param", "injected-env", "env-getter-call"];
  const rawString = how => how === "typed-accessor" ? ["str", "rawStr"].includes(reg?.type) : RAW_HOWS.includes(how);
  const isRawTruthy = r => r.obs.as.has("presence") && !r.obs.as.has("bool") && !r.obs.as.has("bool-false-check") && rawString(r.how);
  const rawSites = list.filter(isRawTruthy);
  const viaWrapper = family ? [] : truthyCalls.filter(c => { const w = wrappers.get(c.origin); return w && w.name === name && rawString(w.how); });
  const rawCount = rawSites.length + viaWrapper.length;
  const parsedBoolElsewhere = list.some(r => r.obs.as.has("bool") || r.obs.as.has("bool-false-check")) || ["bool", "triBool"].includes(reg?.type);
  const HOW_RANK = ["process.env", "typed-accessor", "helper", "env-getter-call", "env-object-param", "injected-env", "destructured", "presence-check", "table-lookup", "list-iteration"];
  const rank = r => { const k = HOW_RANK.indexOf(r.how); return k < 0 ? 99 : k; };
  const sorted = [...list].sort((a, b) => rank(a) - rank(b) || a.file.localeCompare(b.file) || a.start - b.start);
  const prov = sorted.slice(0, 10).map(r => provenance(r.file, text(r.file), r.start, r.end));
  const first = prov[0];
  let description, descSource;
  if (CACHE_NOTES[name]) { description = CACHE_NOTES[name]; descSource = "code"; }
  else if (docCell) { description = firstSentence(docCell); descSource = "docs"; }
  else if (docUrl) { description = `Documented at ${docUrl}; no description column to quote.`; descSource = null; }
  else if (family) { description = "The variable name is built at run time; `*` stands for a value filled in by the code."; descSource = "code"; }
  else { description = `Undocumented; read at \`${first.file}\` offset ${first.binary_offset}.`; descSource = null; }
  const docsLine = CACHE_NOTES[name] && docCell ? firstSentence(docCell) : null;
  let id = `env-${kebab(name)}`;
  if (!family && name !== name.toUpperCase() && upperNames.has(name.toUpperCase())) id += "-lowercase";
  if (family) id = `env-family-${kebab(name)}`;
  if (ids.has(id)) throw new Error(`duplicate id ${id}`);
  ids.add(id);
  const [readTok, readNote] = READ_AS[readAs];
  const mentioned = (mentions.get(name) ?? []).filter(u => u !== docUrl).slice(0, 5);
  items.push({
    id, title: name, group, kind: "env-var", text: null,
    when: descSource === "docs" ? `From docs: ${description}` : descSource === "code" ? `From code: ${description}` : description,
    documented: docUrl,
    details: {
      read_as: readTok, read_as_note: readNote, values: [...values], default: def, documented_url: docUrl, group, locations_count: list.length,
      ...(Object.keys(opts).length ? { bounds: opts } : {}),
      read_paths: [...hows].sort(), schema_type: reg?.type ?? null,
      ...(reg ? { schema_provenance: provenance(reg.file, text(reg.file), reg.start, reg.end) } : {}),
      description, description_source: descSource, ...(docsLine ? { docs_summary: docsLine } : {}),
      ...(mentioned.length ? { mentioned_in: mentioned } : {}),
      ...(writes.has(name) ? { also_written: true } : {}),
      ...(rawCount ? { raw_truthiness_sites: rawCount, raw_truthiness_provenance: [...rawSites, ...viaWrapper].slice(0, 5).map(r => provenance(r.file, text(r.file), r.start, r.end)), ...(parsedBoolElsewhere ? { also_parsed_as_boolean: true } : {}) } : {}),
      ...(family ? { name_pattern: true, matches_documented: famMatches } : {}),
      ...(CACHE_NOTES[name] ? { caching_notes_verified: cachingVerified } : {}),
      ...(CACHE_NOTES[name] && !CACHING_EXTRA.has(name) ? { evidence: Object.fromEntries(Object.entries(evidence).map(([k, r]) => [k, provenance(r.file, text(r.file), r.start, r.end)])) } : {}),
    },
    provenance: prov,
  });
}
for (const [name, list] of sites) makeItem(name, list);
for (const [pattern, list] of families) makeItem(pattern, list, true);
for (const it of items) it.details.direction = "read";
// Set items: one per name Claude Code writes into its own environment or into a child environment.
for (const [name, site] of spawnKeyList) if (!setSites.has(name)) setSites.set(name, [{ ...site, value: { kind: "runtime", hint: "not traced" }, conditional: false, conds: [], keys: [], receivers: [] }]);
for (const w of selfWrites) { if (!setSites.has(w.name)) setSites.set(w.name, []); setSites.get(w.name).push({ file: w.file, start: w.start, end: w.end, value: w.value, conditional: false, conds: [], keys: [], receivers: ["Claude Code's own process environment (inherited by children that receive it)"] }); }
const describeValue = v => v.kind === "literal" ? `\`${v.value}\`` : v.kind === "removed" ? "removed (set to undefined or deleted)" : v.kind === "one-of" ? v.values.map(x => `\`${x}\``).join(" or ") : v.hint ?? "a runtime value";
for (const [name, list] of [...setSites].sort((a, b) => a[0].localeCompare(b[0]))) {
  const family = name.includes("*");
  const id = `env-set-${kebab(name)}`; if (ids.has(id)) throw new Error(`duplicate id ${id}`); ids.add(id);
  const sorted = [...list].sort((a, b) => a.file.localeCompare(b.file) || a.start - b.start);
  const receivers = [...new Set(list.flatMap(r => r.receivers))];
  if (spawnKeyList.has(name)) receivers.push("Bash tool commands (the name is in the Bash tool's spawn-environment key list)");
  const values = [...new Set(list.map(r => describeValue(r.value)))];
  const literalValues = [...new Set(list.flatMap(r => r.value.kind === "literal" ? [r.value.value] : r.value.kind === "one-of" ? r.value.values : []))];
  const conds = [...new Set(list.flatMap(r => r.conds))];
  const docUrl = family ? null : documentedUrl(name);
  const docCell = docRow.get(name)?.cell;
  items.push({
    id, title: name, group: GROUPS[9], kind: "env-var", text: null,
    when: `From code: set by Claude Code${receivers.length ? ` for ${receivers.join("; ")}` : ""}. Value: ${values.join("; ")}.`,
    documented: docUrl,
    details: {
      direction: "set", read_as: null, values: literalValues, default: null, documented_url: docUrl, group: GROUPS[9], locations_count: list.length,
      set_values: values, receivers: receivers.length ? receivers : ["not traced"], conditional: list.some(r => r.conditional), ...(conds.length ? { condition_values: conds } : {}),
      also_read: sites.has(name), ...(family ? { name_pattern: true } : {}),
      description: docCell ? firstSentence(docCell) : null, description_source: docCell ? "docs" : null,
    },
    provenance: sorted.slice(0, 10).map(r => provenance(r.file, text(r.file), r.start, r.end)),
  });
}
items.sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.title.localeCompare(b.title));

// ---------- write ----------
const out = { area: "environment-variables", version: VERSION, items };
writeFileSync(`${ROOT}outputs/environment-variables.json`, JSON.stringify(out, null, 1) + "\n");

const tick = v => "`" + String(v).replace(/`/g, "'") + "`";
const md = [];
const setItems = items.filter(i => i.details.direction === "set");
const named = items.filter(i => !i.details.name_pattern && i.details.direction === "read");
const documentedCount = named.filter(i => i.documented).length;
md.push("# Environment variables read by Claude Code", "");
md.push(`Claude Code reads ${named.length} environment variables by name, plus ${families.size} name patterns built at run time. ${documentedCount} of the named variables are documented at code.claude.com and ${named.length - documentedCount} are not. It also sets ${setItems.length} variables for its own process, tools, hooks and other child processes; these are listed in their own section.`, "");
md.push("A name counts as read when code reads it from `process.env`, through the typed env accessor, through a helper that takes the name, or by iterating a list of names into `process.env`. Names that only appear as strings, or are only written for child processes, are excluded. Documented means the name appears on the env-vars docs page or in a table row on another docs page.", "");
md.push("Prompt caching: DISABLE_PROMPT_CACHING* decide whether requests get cache markers, and the TTL resolves in this order: FORCE_PROMPT_CACHING_5M, then the *_PROMPT_CACHE_TTL variables, then settings, then agent frontmatter, then ENABLE_PROMPT_CACHING_1H. See the first section for details.", "");
for (const g of GROUPS) {
  const gi = items.filter(i => i.group === g);
  if (!gi.length) continue;
  md.push(`## ${g}`, "");
  if (g === GROUPS[0] && !cachingVerified) md.push("**Note:** the caching code differs in shape from the release these notes were traced against, so the notes below are pending re-verification.", "");
  if (g === GROUPS[0]) md.push(CACHE_SUMMARY[0], "", CACHE_SUMMARY[1], "", CACHE_SUMMARY[2], "", ...CACHE_SUMMARY.slice(3, -1), "", CACHE_SUMMARY.at(-1), "");
  if (g === GROUPS[9]) md.push("These are variables Claude Code sets. It either writes them into its own process environment, which children that inherit it receive, or adds them to the environment it builds for a specific child. Receivers are listed only where the code identifies the child; values are shown only when the code sets a literal. The same name can also appear in a read group above.", "");
  if (g === GROUPS[10]) md.push("These names are read only by code with no Claude Code evidence: no typed-schema entry, no first-party boolean helper, no Claude Code name prefix, and no docs entry. That is most likely bundled third-party library code. They are listed for completeness.", "");
  for (const it of gi) {
    const d = it.details; const p = it.provenance[0];
    md.push(`### ${tick(it.title)}`, "");
    md.push(`Source: ${tick(p.file)} · offset ${p.binary_offset} · sha256 ${tick(p.sha256.slice(0, 8) + "…")}${d.locations_count > 1 ? ` · ${d.locations_count} read sites` : ""}`, "");
    if (d.direction === "set") {
      md.push(d.receivers[0] === "not traced" ? "Set for: an environment object Claude Code builds; the receiving process is not traced." : `Set for: ${d.receivers.join("; ")}.`, "", `Value: ${d.set_values.join("; ")}${d.conditional ? " (set only under a condition)" : ""}.${d.condition_values ? ` Condition values in code: ${d.condition_values.map(tick).join(", ")}.` : ""}`, "");
      if (d.description) md.push(`From docs: ${d.description}`, "");
      md.push(d.also_read ? "Also read by Claude Code; see its read entry." : "No read site found by this scan.", "", it.documented ? `Documented: ${it.documented}` : "**Undocumented**", "");
      continue;
    }
    let ra = `Read as: ${d.read_as} (${d.read_as_note})`;
    if (d.values.length) ra += `. Values: ${d.values.map(tick).join(", ")}`;
    if (d.bounds) ra += `. Bounds: ${Object.entries(d.bounds).map(([k, v]) => `${k} ${v}`).join(", ")}`;
    if (d.default !== null) ra += `. Default (from code): ${tick(d.default)}`;
    md.push(ra + ".", "");
    if (d.raw_truthiness_sites) md.push(`**Truthiness gotcha:** ${d.raw_truthiness_sites} read site${d.raw_truthiness_sites > 1 ? "s test" : " tests"} the raw string for truthiness, so any non-empty value enables that path, including \`0\` and \`false\`${d.schema_type === "str" ? " (the value is trimmed first, so whitespace-only counts as unset)" : ""}.${d.also_parsed_as_boolean ? " Other sites parse it as a boolean, so the same value can mean on in one place and off in another." : ""}`, "");
    if (d.description_source === "docs") md.push(`From docs: ${d.description}`, "");
    else if (d.description_source === "code") md.push(`From code: ${d.description}`, ...(d.docs_summary ? ["", `From docs: ${d.docs_summary}`] : []), "");
    else md.push(d.description, "");
    if (d.evidence) md.push(`Evidence (offsets): ${Object.entries(d.evidence).map(([k, e]) => `${k.replace(/_/g, " ")} ${tick(e.file)} @ ${e.binary_offset}`).join(" · ")}`, "");
    if (d.matches_documented?.length) md.push(`Documented names matching this pattern: ${d.matches_documented.map(tick).join(", ")}`, "");
    md.push(it.name_pattern || d.name_pattern ? "Name pattern (not counted as documented or undocumented)" : it.documented ? `Documented: ${it.documented}` : "**Undocumented**", "");
  }
}
writeFileSync(`${ROOT}outputs/environment-variables.md`, md.join("\n"));

const counts = {}; for (const it of items) counts[it.group] = (counts[it.group] ?? 0) + 1;
const undocByGroup = {}; for (const it of items) if (!it.documented) undocByGroup[it.group] = (undocByGroup[it.group] ?? 0) + 1;
const defaultMismatch = items.filter(i => i.details.default !== null && docRow.get(i.title)).map(i => { const r = docRow.get(i.title); const src = (r.def ?? "") + " " + (r.cell ?? ""); const m = src.match(/default(?:s)?(?: is|:)?\s*`?(-?[0-9][0-9_,]*)`?/i) ?? (r.def ? r.def.match(/`?(-?[0-9][0-9_,]*)`?/) : null); return m ? { name: i.title, code: i.details.default, docs: m[1] } : null; }).filter(x => x && String(x.code) !== x.docs.replace(/[_,]/g, ""));
writeFileSync(`${WORK}env-debug-summary.json`, JSON.stringify({ TRUTHY, FALSY, builderOrigin, numberOrigins: [...NUMBER_ORIGINS].length, evidence, cachingShapes, cachingVerified, defaultMismatch, docHeaders: [...new Set([...docRow.values()].map(r => r.header))], accessorOrigins: [...accessorOrigins], registrySize: registry.size,
  registryUnread: [...registry.keys()].filter(k => !sites.has(k)), writeOnly: [...writes.keys()].filter(k => !sites.has(k)),
  docTableNotRead: [...docRow.keys()].filter(k => docRow.get(k).url === ENV_PAGE && !sites.has(k)),
  helpers: Object.fromEntries([...helpers].map(([k, v]) => [k, { param: v.param, as: [...v.obs.as], calls: helperCallCount.get(k) ?? 0 }])),
  families: Object.fromEntries([...families].map(([k, v]) => [k, v.length])), counts, undocByGroup }, null, 1));
writeFileSync(`${WORK}env-debug-sites.json`, JSON.stringify(debug));
console.log(`items ${items.length} (families ${families.size}); documented ${documentedCount}; undocumented ${named.length - documentedCount}`);
console.log(counts);
