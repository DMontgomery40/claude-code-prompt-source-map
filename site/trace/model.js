// Shared helpers for the Trace adapters: byte-exact line streaming, block text
// extraction, token maths, strata estimation, action classification, custody,
// and the instruction-like heuristic. Plain ES module; runs in a Worker and in Node.
//
// A "source" is { name, size, slice(a, b) -> Promise<Uint8Array> } so the same
// code reads a browser File and a Node file handle.

export const KINDS = ["harness", "injected", "you", "outside", "agents", "model", "summary"];

// ---------------------------------------------------------------- lines & refs

const decoder = new TextDecoder("utf-8");

// Yields { offset, length, text, partial } for each line. Offsets and lengths are
// byte positions in the raw file (split on 0x0A); a trailing 0x0D is excluded.
// A last line with no newline is yielded with partial: true (a live file may be
// mid-write; callers skip it if it does not parse).
export async function* readLines(source, { chunkSize = 8 << 20, onProgress } = {}) {
  let pos = 0;
  let carry = null;
  let carryStart = 0;
  while (pos < source.size) {
    const end = Math.min(source.size, pos + chunkSize);
    let chunk = await source.slice(pos, end);
    let base = pos;
    if (carry) {
      const merged = new Uint8Array(carry.length + chunk.length);
      merged.set(carry);
      merged.set(chunk, carry.length);
      chunk = merged;
      base = carryStart;
      carry = null;
    }
    let start = 0;
    for (let k = chunk.indexOf(10, start); k !== -1; k = chunk.indexOf(10, start)) {
      let stop = k;
      if (stop > start && chunk[stop - 1] === 13) stop--;
      if (stop > start) yield { offset: base + start, length: stop - start, text: decoder.decode(chunk.subarray(start, stop)), partial: false };
      start = k + 1;
    }
    if (start < chunk.length) {
      carry = chunk.slice(start);
      carryStart = base + start;
    }
    pos = end;
    if (onProgress) onProgress(pos, source.size);
  }
  if (carry && carry.length) {
    let stop = carry.length;
    if (carry[stop - 1] === 13) stop--;
    yield { offset: carryStart, length: stop, text: decoder.decode(carry.subarray(0, stop)), partial: true };
  }
}

// Reads the first line of a source without reading the whole file.
export async function readFirstLine(source, step = 1 << 16) {
  let buf = new Uint8Array(0);
  for (let pos = 0; pos < source.size; pos += step) {
    const chunk = await source.slice(pos, Math.min(source.size, pos + step));
    const merged = new Uint8Array(buf.length + chunk.length);
    merged.set(buf);
    merged.set(chunk, buf.length);
    buf = merged;
    const k = chunk.indexOf(10);
    if (k !== -1) return decoder.decode(buf.subarray(0, buf.length - chunk.length + k));
  }
  return decoder.decode(buf);
}

// The text a value contributes to the model's context, as the viewer shows it.
export function partText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) return value.join("\n\n");
    if (value.every((v) => v && typeof v === "object" && (typeof v.content === "string" || typeof v.text === "string")))
      return value.map((v) => (typeof v.content === "string" ? v.content : v.text)).join("\n");
  }
  if (typeof value === "object" && value.type === "base64" && typeof value.data === "string")
    return `data:${value.media_type || "image/png"};base64,${value.data}`;
  return JSON.stringify(value, null, 2);
}

export function getPath(obj, path) {
  let v = obj;
  for (const k of path || []) {
    if (v == null) return undefined;
    v = v[k];
  }
  return v;
}

// Text of one block, given its source line: follow ref.path into the parsed JSON,
// convert with partText, then take ref.range if present. No path = the raw line.
export function extractText(lineText, ref) {
  if (!ref.path) return ref.range ? lineText.slice(ref.range[0], ref.range[1]) : lineText;
  const s = partText(getPath(JSON.parse(lineText), ref.path));
  return ref.range ? s.slice(ref.range[0], ref.range[1]) : s;
}

export async function readRefLine(source, ref) {
  return decoder.decode(await source.slice(ref.offset, ref.offset + ref.length));
}

export async function readRef(source, ref) {
  return extractText(await readRefLine(source, ref), ref);
}

// ---------------------------------------------------------------- estimates

export const estText = (chars) => Math.ceil(chars / 4);
// Encrypted payloads (reasoning, compaction summaries, agent messages) are base64
// of ciphertext; ~3/4 of the characters are bytes, and ~4 bytes per token.
export const estEncrypted = (chars) => Math.ceil((chars * 0.75) / 4);
export const IMAGE_FLAT = 1600;
export const estImage = (dims) => (dims && dims.w && dims.h ? Math.ceil((dims.w * dims.h) / 750) : IMAGE_FLAT);

function b64bytes(b64, n) {
  const s = b64.slice(0, Math.ceil((n * 4) / 3) + 4).replace(/[^A-Za-z0-9+/]/g, "");
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const out = [];
  for (let i = 0; i + 3 < s.length + 1 && out.length < n; i += 4) {
    const a = A.indexOf(s[i]), b = A.indexOf(s[i + 1]), c = A.indexOf(s[i + 2]), d = A.indexOf(s[i + 3]);
    if (a < 0 || b < 0) break;
    out.push((a << 2) | (b >> 4));
    if (c >= 0) out.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0) out.push(((c & 3) << 6) | d);
  }
  return out;
}

// Width and height from the header of a base64 PNG, GIF, WebP or JPEG. Decodes
// only the first bytes (JPEG: up to 64 KB, scanning for the SOF marker).
export function imageDims(b64) {
  if (typeof b64 !== "string") return null;
  const comma = b64.startsWith("data:") ? b64.indexOf(",") + 1 : 0;
  const s = comma ? b64.slice(comma) : b64;
  const h = b64bytes(s, 32);
  if (h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47)
    return { w: (h[16] << 24 | h[17] << 16 | h[18] << 8 | h[19]) >>> 0, h: (h[20] << 24 | h[21] << 16 | h[22] << 8 | h[23]) >>> 0 };
  if (h[0] === 0x47 && h[1] === 0x49 && h[2] === 0x46) return { w: h[6] | (h[7] << 8), h: h[8] | (h[9] << 8) };
  if (h[0] === 0x52 && h[8] === 0x57 && h[12] === 0x56 && h[13] === 0x50 && h[14] === 0x38) {
    if (h[15] === 0x58) return { w: 1 + (h[24] | h[25] << 8 | h[26] << 16), h: 1 + (h[27] | h[28] << 8 | h[29] << 16) };
    const x = b64bytes(s, 30);
    if (h[15] === 0x20) return { w: (x[26] | x[27] << 8) & 0x3fff, h: (x[28] | x[29] << 8) & 0x3fff };
  }
  if (h[0] === 0xff && h[1] === 0xd8) {
    const j = b64bytes(s, 65536);
    for (let i = 2; i + 9 < j.length;) {
      if (j[i] !== 0xff) { i++; continue; }
      const m = j[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: j[i + 7] << 8 | j[i + 8], h: j[i + 5] << 8 | j[i + 6] };
      i += 2 + (j[i + 2] << 8 | j[i + 3]);
    }
  }
  return null;
}

// ---------------------------------------------------------------- reference index
//
// Each site publishes /trace/reference-index.json: { site, origin, pages: [{ slug, title }],
// lines: { <lineHash>: pageIndex }, harness: { <cc version>: { systemChars, toolsChars } },
// reminders: { <attachment type>: { slug, anchor, title } } }. The site build imports
// lineHash/textLineHashes from here so both sides hash identically.

const utf8 = new TextEncoder();

// FNV-1a 64-bit over bytes, in two 32-bit halves (no BigInt): 16 lowercase hex chars.
export function fnv1a64(bytes) {
  let hi = 0xcbf29ce4, lo = 0x84222325;
  for (let i = 0; i < bytes.length; i++) {
    lo = (lo ^ bytes[i]) >>> 0;
    // (hi·2^32 + lo) · (2^40 + 0x1b3) mod 2^64
    const a = lo * 0x1b3;
    hi = (Math.imul(hi, 0x1b3) + Math.floor(a / 4294967296) + ((lo << 8) >>> 0)) >>> 0;
    lo = a >>> 0;
  }
  return hi.toString(16).padStart(8, "0") + lo.toString(16).padStart(8, "0");
}

export const MIN_INDEXED_LINE = 25;
export const normalizeLine = (line) => String(line).replace(/\s+/g, " ").trim();
export const lineHash = (line) => fnv1a64(utf8.encode(normalizeLine(line)));

// Hashes of the lines of a text (split on \n) that are indexed: normalized length >= 25.
export function textLineHashes(text) {
  const out = [];
  for (const raw of String(text).split("\n")) {
    const l = normalizeLine(raw);
    if (l.length >= MIN_INDEXED_LINE) out.push(fnv1a64(utf8.encode(l)));
  }
  return out;
}

export function prepareIndex(index) {
  if (!index || typeof index !== "object") return null;
  return { site: index.site || null, origin: index.origin || null, pages: index.pages || [], lines: index.lines || {}, harness: index.harness || {}, reminders: index.reminders || {} };
}

// The page holding most of the text's indexed lines: at least 2 matching lines, or
// all of them when the text has fewer than 2 indexed lines. Otherwise null.
export function siteForText(ix, text) {
  if (!ix || !text) return null;
  const hashes = textLineHashes(text);
  if (!hashes.length) return null;
  const counts = new Map();
  for (const h of hashes) {
    const p = Object.prototype.hasOwnProperty.call(ix.lines, h) ? ix.lines[h] : null;
    if (p != null) counts.set(p, (counts.get(p) || 0) + 1);
  }
  let best = null, n = 0;
  for (const [p, c] of counts) if (c > n) { best = p; n = c; }
  if (best == null || n < Math.min(2, hashes.length) || !ix.pages[best]) return null;
  const page = ix.pages[best];
  return { slug: page.slug, title: page.title, matched: n, lines: hashes.length };
}

// ---------------------------------------------------------------- tokens

const n0 = (x) => (Number.isFinite(x) ? x : 0);

// Codex: input_tokens already includes cached tokens.
export function tokensCodex(u) {
  const input = n0(u.input_tokens), cached = n0(u.cached_input_tokens), write = n0(u.cache_write_input_tokens), output = n0(u.output_tokens);
  const t = { context: input, cacheRead: cached, cacheWrite: write, uncached: Math.max(0, input - cached), output, reasoning: n0(u.reasoning_output_tokens) };
  t.fresh = t.uncached + t.cacheWrite + t.output;
  return t;
}

// Claude Code: context = input + cache read + cache creation (one API iteration).
export function tokensClaude(u) {
  const input = n0(u.input_tokens), read = n0(u.cache_read_input_tokens), write = n0(u.cache_creation_input_tokens), output = n0(u.output_tokens);
  const t = { context: input + read + write, cacheRead: read, cacheWrite: write, uncached: input, output, reasoning: n0(u.output_tokens_details && u.output_tokens_details.thinking_tokens) };
  t.fresh = t.uncached + t.cacheWrite + t.output;
  return t;
}

// ---------------------------------------------------------------- agents

export function newAgent(fields, ix = null) {
  const agent = {
    id: null, parentId: null, kind: "root", name: null, model: null, depth: 0, spawn: null, bursts: [],
    requests: [], asks: [], compactions: [], shrinks: [], returns: [], blocks: [], harnessSource: "logged",
    file: null, ...fields,
  };
  Object.defineProperty(agent, "_ix", { value: ix, enumerable: false, writable: true });
  return agent;
}

// Appends a block. `text` is used only to measure and flag it and is not kept.
// Harness and injected blocks are looked up in the site's reference index, if one
// was given (agent._ix); `site` passes a known link through (carried copies).
export function addBlock(agent, { t, kind, label, ref, text = "", est, image, render, carried, flagText, site }) {
  const chars = image ? 0 : text.length;
  const b = { i: agent.blocks.length, t, kind, label, chars, est: est != null ? est : image ? estImage(image) : estText(chars), ref, site: null };
  if (site !== undefined) b.site = site;
  else if (agent._ix && !image && text && (kind === "harness" || kind === "injected")) b.site = siteForText(agent._ix, text);
  if (image) b.image = image;
  if (render) b.render = render;
  if (carried) b.carried = true;
  if ((kind === "outside" || kind === "agents") && !image) {
    const hits = instructionLike(flagText != null ? flagText : text);
    if (hits.length) { b.flags = ["instruction-like"]; b.flagHits = hits; }
  }
  agent.blocks.push(b);
  return b;
}

// Splits a string into <system-reminder> segments and the text between them.
// Returns [{ start, end, reminder }] with non-empty, non-whitespace spans.
export function splitReminders(s) {
  const out = [];
  const re = /<system-reminder>[\s\S]*?<\/system-reminder>/g;
  let last = 0, m;
  const push = (a, b, reminder) => {
    if (!reminder) { while (a < b && /\s/.test(s[a])) a++; while (b > a && /\s/.test(s[b - 1])) b--; }
    if (b > a) out.push({ start: a, end: b, reminder });
  };
  while ((m = re.exec(s))) {
    push(last, m.index, false);
    push(m.index, m.index + m[0].length, true);
    last = m.index + m[0].length;
  }
  push(last, s.length, false);
  return out;
}

export function computeBursts(requests, gapMs = 10 * 60 * 1000) {
  const out = [];
  for (const r of requests) {
    const last = out[out.length - 1];
    if (last && r.t - last.b <= gapMs) last.b = r.t;
    else out.push({ a: r.t, b: r.t });
  }
  return out;
}

// Fills request.strata: estimate each kind over the blocks in the request's window
// (≈ chars/4, images by dimension), then scale so the kinds sum to the exact
// context. When the harness is not in the log, harness takes the remainder.
export function computeStrata(agent) {
  const n = agent.blocks.length;
  const P = {};
  for (const k of KINDS) P[k] = new Float64Array(n + 1);
  const PV = new Int32Array(n + 1), PF = new Int32Array(n + 1);
  for (let j = 0; j < n; j++) {
    const b = agent.blocks[j];
    for (const k of KINDS) P[k][j + 1] = P[k][j] + (b.kind === k ? b.est : 0);
    const inView = b.kind === "outside" || b.kind === "agents";
    PV[j + 1] = PV[j] + (inView ? 1 : 0);
    PF[j + 1] = PF[j] + (inView && b.flags ? 1 : 0);
  }
  agent._prefix = { PV, PF };
  for (const r of agent.requests) {
    if (!r.window) continue;
    const [a, b] = r.window;
    const est = {};
    for (const k of KINDS) est[k] = b >= a ? P[k][b + 1] - P[k][a] : 0;
    for (const j of r.extra || []) est[agent.blocks[j].kind] += agent.blocks[j].est;
    // harnessSource: "logged" (blocks in the log), "inferred" (reference index size
    // for the logged version), "residual" (default: harness = context − other strata).
    if (agent.harnessSource === "inferred" && agent.harnessEst) est.harness += agent.harnessEst;
    r.strata = scaleStrata(est, r.tokens.context, agent.harnessSource === "residual");
  }
}

export function scaleStrata(est, ctx, harnessResidual) {
  const out = {};
  for (const k of KINDS) out[k] = 0;
  if (!ctx) return out;
  let keys = KINDS;
  if (harnessResidual) {
    keys = KINDS.filter((k) => k !== "harness");
    const others = keys.reduce((s, k) => s + est[k], 0);
    if (others < ctx) {
      for (const k of keys) out[k] = Math.round(est[k]);
      out.harness = ctx - keys.reduce((s, k) => s + out[k], 0);
      return out;
    }
  }
  const total = keys.reduce((s, k) => s + est[k], 0);
  if (!total) { out.harness = ctx; return out; }
  const f = ctx / total;
  const raw = keys.map((k) => est[k] * f);
  let sum = 0;
  keys.forEach((k, j) => { out[k] = Math.floor(raw[j]); sum += out[k]; });
  const order = keys.map((k, j) => [raw[j] - out[k], k]).sort((x, y) => y[0] - x[0]);
  for (let j = 0; sum < ctx; j = (j + 1) % order.length) { out[order[j][1]]++; sum++; }
  return out;
}

// Context that drops between consecutive requests with no logged compaction.
export function detectShrinks(agent, { minDrop = 5000, minFrac = 0.2 } = {}) {
  const logged = agent.compactions.map((c) => c.t);
  const reqs = agent.requests.filter((r) => r.window);
  for (let j = 1; j < reqs.length; j++) {
    const p = reqs[j - 1].tokens.context, q = reqs[j].tokens.context;
    if (p - q >= minDrop && (p - q) / p >= minFrac && !logged.some((t) => t > reqs[j - 1].t - 1 && t <= reqs[j].t + 1) && !reqs[j].compactionRequest && !reqs[j - 1].compactionRequest)
      agent.shrinks.push({ t: reqs[j].t, request: reqs[j].i, pre: p, post: q, note: "context shrank; not logged as a compaction" });
  }
}

// First request that saw each block, and for asks: the request that answered.
export function linkBlocksToRequests(agent) {
  const reqs = agent.requests.filter((r) => r.window);
  let j = 0;
  for (const b of agent.blocks) {
    while (j < reqs.length && reqs[j].window[1] < b.i) j++;
    b.seenBy = j < reqs.length ? reqs[j].i : null;
  }
  for (const a of agent.asks) a.request = agent.blocks[a.block] ? agent.blocks[a.block].seenBy : null;
}

// Custody ladder for every request with a tool action.
export function buildCustody(agent, permissionAt) {
  const { PV, PF } = agent._prefix;
  let askIdx = -1;
  for (const r of agent.requests) {
    while (askIdx + 1 < agent.asks.length && agent.asks[askIdx + 1].t <= r.t) askIdx++;
    if (!r.action || r.action.kind !== "tool") continue;
    const ask = askIdx >= 0 ? agent.asks[askIdx] : null;
    const [a, b] = r.window || [0, -1];
    const flagged = [];
    for (let j = b; j >= a && flagged.length < 5; j--) if (agent.blocks[j].flags) flagged.push(j);
    r.action.custody = {
      askedBy: ask ? { t: ask.t, block: ask.block, from: ask.from } : null,
      permittedBy: permissionAt(r),
      guidedBy: { tool: r.action.tool },
      inView: b >= a ? { count: PV[b + 1] - PV[a], tokens: (r.strata ? r.strata.outside + r.strata.agents : 0), flagged: PF[b + 1] - PF[a], flaggedBlocks: flagged } : null,
      did: { class: r.action.class, target: r.action.target },
    };
  }
}

export function finalizeAgent(agent, permissionAt) {
  computeStrata(agent);
  detectShrinks(agent);
  linkBlocksToRequests(agent);
  buildCustody(agent, permissionAt || (() => null));
  agent.bursts = computeBursts(agent.requests);
  agent.fresh = agent.requests.reduce((s, r) => s + r.tokens.fresh, 0);
  delete agent._prefix;
  return agent;
}

// ---------------------------------------------------------------- instruction-like heuristic
//
// HEURISTIC, labelled as such in the UI. Flags outside/agents text that looks
// aimed at an AI model rather than at a human or a program:
//   ignore-previous : "ignore/disregard/forget (all) (previous|prior|above) instructions"
//   role-tag        : chat role markup inside the content: <system>, <|im_start|>, [INST],
//                     <assistant>, <developer>, <instructions>, a line starting "SYSTEM:"
//   ai-address      : "you are (now) an AI/assistant/language model/agent/Claude/ChatGPT/Codex",
//                     "as an AI", "AI agents? (must|should)", "(dear|attention) (AI|LLM|assistant)"
//   override        : "new instructions:", "override (your|the) (system|previous) (prompt|instructions)",
//                     "system prompt:"
//   must-directive  : "you must" / "you are required to" / "do not tell the user" together with
//                     an AI address or a role tag within the same text (alone it is too common)
const IL = [
  ["ignore-previous", /\b(ignore|disregard|forget)\s+(all\s+|any\s+|the\s+)?(previous|prior|above|earlier|preceding)\s+(instructions|prompts?|messages|directions|context)\b/i],
  ["role-tag", /<\|im_start\|>|\[INST\]|<\/?(system|assistant|developer|instructions)>|^\s*(SYSTEM|DEVELOPER)\s*:/im],
  ["ai-address", /\byou are (now )?(an? )?(ai|assistant|language model|llm|ai agent|claude|chatgpt|codex|gpt)\b|\bas an ai\b|\bai (agents?|assistants?|models?) (must|should|are required)\b|\b(dear|attention|note to) (ai|llm|assistant|agent)s?\b/i],
  ["override", /\bnew instructions\s*:|\boverride (your|the|all) (system|previous|prior) (prompt|instructions)\b|\bsystem prompt\s*:/i],
];
const MUST = /\b(you must|you are required to|do not (tell|inform) the user|don't tell the user)\b/i;

export function instructionLike(text) {
  if (!text) return [];
  const s = text.length > 200000 ? text.slice(0, 150000) + text.slice(-50000) : text;
  const hits = [];
  for (const [name, re] of IL) if (re.test(s)) hits.push(name);
  if (hits.length && MUST.test(s)) hits.push("must-directive");
  return hits;
}

// ---------------------------------------------------------------- action classification
//
// Classes: outward (leaves the machine), write (changes local files or local
// state), read (runs or inspects without a pattern showing a change), internal
// (harness-internal: planning, agent coordination, tool loading). Patterns are
// listed in the report; anything unmatched that runs a command is "read".

export const RANK = { outward: 3, write: 2, read: 1, internal: 0 };
export const worse = (a, b) => (RANK[a] >= RANK[b] ? a : b);

const OUT_CMDS = new Set(["curl", "wget", "http", "https", "xh", "httpie", "ssh", "scp", "sftp", "ftp", "nc", "ncat", "telnet", "gh", "aws", "gcloud", "az", "netlify", "vercel", "flyctl", "fly", "firebase", "heroku", "open", "osascript"]);
const WRITE_CMDS = new Set(["rm", "rmdir", "mv", "cp", "mkdir", "touch", "tee", "ln", "chmod", "chown", "truncate", "dd", "install", "patch", "kill", "pkill", "killall", "launchctl", "crontab", "unzip", "tar", "trash", "apply_patch", "rsync"]);
const WRAPPERS = new Set(["sudo", "env", "time", "nohup", "exec", "command", "xargs", "nice", "timeout", "caffeinate", "then", "do", "else", "!", "{", "(", "if", "while", "until"]);
const RUNNERS = new Set(["npx", "bunx", "pnpx"]);
// Package scripts and make targets named like a release step (`npm run deploy`, `make publish`).
const DEPLOY_NAME = /^(deploy|publish|release|upload)([:_-].*)?$/;

// Rough shell tokenizer: splits into simple commands on unquoted ; && || | & and
// newlines, removing heredoc bodies first. Returns { argvs, heredocs }.
export function shellCommands(cmd) {
  const heredocs = [];
  const src = String(cmd).replace(/<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1([^\n]*)\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g, (m, q, tag, rest, body, at, whole) => {
    const lineStart = whole.lastIndexOf("\n", at) + 1;
    heredocs.push({ body, lead: whole.slice(lineStart, at) });
    return rest;
  });
  const argvs = [];
  let cur = [], tok = "", q = null, has = false;
  const endTok = () => { if (has) cur.push(tok); tok = ""; has = false; };
  const endCmd = () => { endTok(); if (cur.length) argvs.push(cur); cur = []; };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === q) q = null;
      else if (c === "\\" && q === '"' && i + 1 < src.length) tok += src[++i];
      else tok += c;
      continue;
    }
    if (c === "'" || c === '"') { q = c; has = true; continue; }
    if (c === "\\" && i + 1 < src.length) { if (src[i + 1] !== "\n") { tok += src[i + 1]; has = true; } i++; continue; }
    if (c === "\n" || c === ";" || c === "|" || c === "&" || c === "(" || c === ")" || c === "`") { endCmd(); if (c === "&" && src[i + 1] === ">") { /* &> redirect */ } continue; }
    if (c === "$" && src[i + 1] === "(") { endCmd(); i++; continue; }
    if (c === " " || c === "\t") { endTok(); continue; }
    tok += c; has = true;
  }
  endCmd();
  return { argvs, heredocs, flat: src };
}

const base = (p) => String(p || "").split("/").pop();
const INLINE_NET = /\b(fetch\s*\(|requests\.(get|post|put|patch|delete|request)\b|urllib\.request|urlopen\s*\(|http\.client|httpx\.|axios[.(]|XMLHttpRequest|WebSocket\s*\(|page\.goto\s*\(|\.createBrowserTab\s*\(|smtplib)/;
const REDIRECT = /(^|[^0-9&>=<])>>?\s*(?!&|\/dev\/null\b|\s*$)(["']?)[^\s|;&)"']+/m;

function classifyArgv(argv) {
  let a = argv.slice();
  while (a.length && (WRAPPERS.has(a[0]) || /^[A-Za-z_][A-Za-z0-9_]*=/.test(a[0]))) a.shift();
  if (a[0] === "timeout" && a.length > 1) a = a.slice(2);
  while (a.length && RUNNERS.has(base(a[0]))) { a.shift(); while (a.length && a[0].startsWith("-")) a.shift(); }
  if (a.length && (a[0] === "uv" || a[0] === "poetry" || a[0] === "pipenv") && a[1] === "run") { a = a.slice(2); while (a.length && a[0].startsWith("-")) a.shift(); }
  if (!a.length) return null;
  const c = base(a[0]);
  const sub = a.slice(1).filter((x) => !x.startsWith("-"));
  const s0 = sub[0], s1 = sub[1];
  if (c === "git") {
    const gs = a.slice(1);
    // skip global options like -C <dir>, -c k=v
    let k = 0;
    while (k < gs.length && gs[k].startsWith("-")) k += gs[k] === "-C" || gs[k] === "-c" ? 2 : 1;
    const g = gs[k];
    if (["push", "send-email", "pull", "fetch", "clone", "ls-remote"].includes(g) || (g === "remote" && gs[k + 1] === "update")) return "outward";
    if (["add", "commit", "merge", "rebase", "reset", "checkout", "switch", "stash", "tag", "cherry-pick", "revert", "restore", "clean", "apply", "mv", "rm", "am", "init", "worktree", "branch", "config", "gc", "prune", "update-ref", "notes"].includes(g)) {
      if (g === "branch" && !gs.slice(k + 1).some((x) => /^-[dDmMcC]$|^--(delete|move|copy)$/.test(x)) && gs.slice(k + 1).every((x) => x.startsWith("-"))) return "read";
      if (g === "worktree" && gs[k + 1] === "list") return "read";
      if (g === "stash" && gs[k + 1] === "list") return "read";
      if (g === "tag" && gs.length === k + 1) return "read";
      if (g === "config" && (gs.includes("--get") || gs.includes("--list") || gs.includes("-l"))) return "read";
      return "write";
    }
    return "read";
  }
  if (OUT_CMDS.has(c)) {
    if (c === "open" && !a.slice(1).some((x) => /^https?:\/\//.test(x))) return "read";
    if (c === "osascript") return "write";
    return "outward";
  }
  if (c === "make" && sub.some((x) => DEPLOY_NAME.test(x))) return "outward";
  if (["npm", "pnpm", "yarn", "bun"].includes(c)) {
    if (["publish", "deprecate", "unpublish", "dist-tag", "login", "adduser"].includes(s0)) return "outward";
    if ((s0 === "run" && DEPLOY_NAME.test(s1 || "")) || (c !== "npm" && DEPLOY_NAME.test(s0 || ""))) return "outward";
    if (["install", "i", "add", "remove", "rm", "uninstall", "ci", "update", "upgrade", "link", "init", "version"].includes(s0)) return "write";
    return "read";
  }
  if (c === "wrangler") return ["deploy", "publish", "secret", "kv", "r2", "d1", "pages", "versions", "rollback", "delete"].includes(s0) ? "outward" : "read";
  if (["docker", "podman"].includes(c)) return s0 === "push" || s0 === "login" ? "outward" : ["run", "build", "rm", "rmi", "compose", "exec", "stop", "kill", "pull"].includes(s0) ? "write" : "read";
  if (["twine", "cargo", "uv", "pip", "pip3", "poetry", "brew", "gem", "go"].includes(c)) {
    if (["upload", "publish"].includes(s0)) return "outward";
    if (["install", "add", "remove", "uninstall", "sync", "upgrade", "update", "lock", "venv", "init", "build", "get", "tap"].includes(s0) || (s0 === "pip" && s1 === "install")) return "write";
    return "read";
  }
  if (["kubectl", "helm", "terraform", "pulumi"].includes(c)) return ["apply", "delete", "create", "patch", "install", "upgrade", "up", "destroy", "import", "rollout", "scale"].includes(s0) ? "outward" : "read";
  if ((c === "sed" || c === "perl") && a.slice(1).some((x) => /^-[a-zA-Z]*i/.test(x))) return "write";
  if (WRITE_CMDS.has(c)) {
    if (c === "rsync" && a.slice(1).some((x) => /^[^/\s]+@?[\w.-]+:/.test(x) && !/^[A-Za-z]:\\/.test(x))) return "outward";
    if (c === "tar" && !a.slice(1).some((x) => /^-?[a-zA-Z]*x/.test(x))) return "read";
    return "write";
  }
  return "read";
}

// Class of a shell command string: the most consequential of its simple commands,
// inline/heredoc scripts that do network I/O, and output redirection to a file.
export function classifyCommand(cmd) {
  if (!cmd) return "read";
  const { argvs, heredocs, flat } = shellCommands(cmd);
  let cls = "read";
  for (const argv of argvs) {
    const c = classifyArgv(argv);
    if (c) cls = worse(cls, c);
  }
  // Only heredocs fed to an interpreter run; a heredoc written with cat/tee is a file write.
  const INTERP = /(^|[\s/;&|(])(python[\d.]*|node|deno|bun|bash|sh|zsh|ruby|perl|php|osascript|psql|sqlite3|uv run [^|;&]*|npx [^|;&]*)(\s|$)/;
  const run = heredocs.filter((h) => INTERP.test(h.lead) && !/\b(cat|tee)\b/.test(h.lead)).map((h) => h.body);
  const scripts = run.join("\n") + "\n" + argvs.filter((a) => a.some((x) => x === "-c" || x === "-e")).map((a) => a.join(" ")).join("\n");
  if (INLINE_NET.test(scripts)) cls = worse(cls, "outward");
  if (REDIRECT.test(flat.replace(/'[^']*'|"[^"]*"/g, "''"))) cls = worse(cls, "write");
  if (heredocs.length && /\b(cat|tee)\b[^\n]*>/.test(flat)) cls = worse(cls, "write");
  if (/\b(write_text|write_bytes|writeFileSync|writeFile\s*\(|open\([^)]*,\s*['"][wa]b?['"])/.test(scripts)) cls = worse(cls, "write");
  return cls;
}

const trunc = (s, n = 400) => (s == null ? null : (s = String(s), s.length > n ? s.slice(0, n) + "…" : s));

// Claude Code tool_use -> { class, target }.
export function classifyClaudeTool(name, input = {}) {
  input = input || {};
  const n = name || "";
  if (n === "Bash" || n === "BashOutput") return { class: classifyCommand(input.command), target: trunc(input.command) };
  if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(n)) return { class: "write", target: trunc(input.file_path || input.notebook_path) };
  if (["Read", "Glob", "Grep", "LS", "NotebookRead"].includes(n)) return { class: "read", target: trunc(input.file_path || input.path ? [input.pattern, input.file_path || input.path].filter(Boolean).join(" in ") : input.pattern) };
  if (n === "WebFetch") return { class: "outward", target: trunc(input.url) };
  if (n === "WebSearch") return { class: "outward", target: trunc(input.query) };
  if (n === "Artifact") {
    const act = input.action || "publish";
    const out = ["publish", "delete", "pin", "unpin"].includes(act);
    return { class: out ? "outward" : "read", target: trunc([act, input.url || input.file_path].filter(Boolean).join(" ")) };
  }
  if (n === "ArtifactData" || n === "ArtifactComments") return { class: /^(set|update|delete|batch|create|reply|resolve)$/.test(input.action || "") ? "outward" : "read", target: trunc([input.action, input.url].filter(Boolean).join(" ")) };
  if (["Agent", "Task", "SendMessage", "TaskStop", "TodoWrite", "ToolSearch", "Skill", "EnterWorktree", "ExitWorktree", "ExitPlanMode", "EnterPlanMode", "Monitor", "CronCreate", "CronDelete", "CronList", "SendUserFile", "EndConversation", "TaskCreate", "TaskUpdate", "TaskList", "TaskGet", "KillShell", "KillBash", "advisor", "AskUserQuestion", "ListAgents", "ReadNotifications"].includes(n))
    return { class: "internal", target: trunc(input.name || input.to || input.description || input.subagent_type || input.query || input.skill || input.shell_id || null) };
  if (n.startsWith("mcp__claude-in-chrome__")) {
    const t = n.slice(23);
    if (/^(navigate|tabs_create_mcp)$/.test(t)) return { class: "outward", target: trunc(input.url || input.tabId) };
    if (t === "computer" && /^(screenshot|zoom|wait|scroll|scroll_to|hover|mouse_move|cursor_position)$/.test(input.action || "")) return { class: "read", target: trunc(input.action) };
    if (/^(computer|form_input|javascript_tool|file_upload|upload_image|browser_batch|shortcuts_execute)$/.test(t)) return { class: "outward", target: trunc([input.action, input.text || input.value || input.code || input.url].filter(Boolean).join(" ") || JSON.stringify(input)) };
    return { class: "read", target: trunc(input.url || input.query || input.tabId || null) };
  }
  if (n.startsWith("mcp__computer-use__")) {
    const t = n.slice(19);
    if (/^(screenshot|zoom|cursor_position|list_granted_applications|read_clipboard|request_access|switch_display|wait)$/.test(t)) return { class: "read", target: trunc(input.app || null) };
    return { class: "write", target: trunc(input.text || input.app || input.key || JSON.stringify(input)) };
  }
  if (n.startsWith("mcp__claude_ai_")) return { class: "outward", target: trunc(n.slice(15) + " " + JSON.stringify(input)) };
  if (n.startsWith("mcp__")) return { class: /(create|update|delete|write|send|post|publish|deploy|upload|push|rename|set|place|cancel|exercise)/i.test(n.split("__").pop()) ? "write" : "read", target: trunc(JSON.stringify(input)) };
  return { class: "read", target: trunc(JSON.stringify(input)) };
}

// ---------------------------------------------------------------- Codex exec/js sources

// Reads a JS string literal starting at src[i] (a quote or backtick). Template
// substitutions are kept as their raw source text.
export function readJsString(src, i) {
  const q = src[i];
  let out = "";
  i++;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const e = src[i + 1];
      const map = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0" };
      if (e in map) { out += map[e]; i += 2; }
      else if (e === "u" && src[i + 2] === "{") { const j = src.indexOf("}", i); out += String.fromCodePoint(parseInt(src.slice(i + 3, j), 16) || 0xfffd); i = j + 1; }
      else if (e === "u") { out += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16) || 0xfffd); i += 6; }
      else if (e === "x") { out += String.fromCharCode(parseInt(src.slice(i + 2, i + 4), 16) || 0xfffd); i += 4; }
      else if (e === "\n") i += 2;
      else { out += e ?? ""; i += 2; }
      continue;
    }
    if (c === q) return { value: out, end: i + 1 };
    if (q === "`" && c === "$" && src[i + 1] === "{") {
      let depth = 0, j = i + 1;
      for (; j < src.length; j++) { if (src[j] === "{") depth++; else if (src[j] === "}" && --depth === 0) break; }
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    out += c;
    i++;
  }
  return { value: out, end: i };
}

// Values of `key: "literal"` properties in JS source (object-literal style).
export function jsProps(src, key) {
  const out = [];
  const re = new RegExp(`(?:^|[{,\\s])["']?${key}["']?\\s*:\\s*(?=["'\`])`, "g");
  let m;
  while ((m = re.exec(src))) {
    const r = readJsString(src, m.index + m[0].length);
    out.push(r.value);
    re.lastIndex = r.end;
  }
  return out;
}

// All string literals in JS source (for URLs passed positionally).
export function jsStrings(src) {
  const out = [];
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === "/" && src[i + 1] === "/") { const j = src.indexOf("\n", i); if (j < 0) break; i = j; continue; }
    if (c === '"' || c === "'" || c === "`") { const r = readJsString(src, i); out.push(r.value); i = r.end - 1; }
  }
  return out;
}

// Parses a Codex `exec` / `js` tool input. Returns { cmds, urls, justification,
// escalated, patch, webSearch, browser }.
// JS source with every string literal emptied, so code patterns are not matched
// inside strings (e.g. a heredoc script written to a file).
export function jsCode(src) {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { const r = readJsString(src, i); out += c + c; i = r.end - 1; }
    else out += c;
  }
  return out;
}

export function parseCodexSource(src) {
  src = String(src || "");
  const code = jsCode(src);
  const cmds = jsProps(src, "cmd").concat(jsProps(src, "command"));
  const urls = jsStrings(src).filter((s) => /^https?:\/\/\S+$/.test(s));
  return {
    cmds,
    urls,
    justification: jsProps(src, "justification")[0] || null,
    escalated: /sandbox_permissions\s*:\s*["']require_escalated["']/.test(src),
    patch: /\bapply_patch\b|\*\*\* Begin Patch/.test(src),
    webSearch: /\b(web_search|web\.search|search_query|image_query)\b/.test(code),
    browser: /\b(createBrowserTab|\.goto\s*\(|navigate\s*\(|cua\.)/.test(code),
  };
}

export function classifyCodexCall(name, input, completed = []) {
  const n = name || "";
  if (n === "exec" || n === "js") {
    const p = parseCodexSource(input);
    let cls = n === "js" ? "read" : "internal";
    let target = null;
    const cmds = p.cmds.slice();
    for (const it of completed) if (it.type === "CommandExecution" && Array.isArray(it.command)) cmds.push(it.command[it.command.length - 1]);
    for (const c of cmds) {
      const k = classifyCommand(c);
      if (!target || RANK[k] > RANK[cls]) target = c;
      cls = worse(cls, k);
    }
    if (p.patch || completed.some((it) => it.type === "FileChange")) {
      cls = worse(cls, "write");
      const fc = completed.find((it) => it.type === "FileChange");
      if (fc && RANK[cls] <= RANK.write) target = Object.keys(fc.changes || {}).join(", ") || target;
    }
    if (p.urls.length && (p.browser || n === "js")) { cls = "outward"; target = p.urls[0]; }
    if (p.webSearch || completed.some((it) => it.type === "Extension" && /web/.test(it.kind || ""))) {
      if (RANK[cls] < RANK.outward) target = (completed.find((it) => it.type === "Extension") || {}).query || "web search";
      cls = "outward";
    }
    if (p.browser && !p.urls.length && RANK[cls] < RANK.outward) { cls = "outward"; target = target || "browser"; }
    if (cls === "internal" && cmds.length === 0) cls = "read";
    return { class: cls, target: trunc(target || (p.cmds[0] ?? null)), justification: p.justification, escalated: p.escalated, cmds: cmds.map((c) => trunc(c, 300)) };
  }
  let args = null;
  try { args = typeof input === "string" ? JSON.parse(input) : input; } catch { args = null; }
  args = args || {};
  if (["wait", "spawn_agent", "send_message", "followup_task", "wait_agent", "list_agents", "interrupt_agent", "close_agent", "update_plan", "request_user_input", "view_image"].includes(n))
    return { class: n === "view_image" ? "read" : "internal", target: trunc(args.task_name || args.recipient || args.path || args.target || null) };
  if (n === "shell" || n === "exec_command" || n === "local_shell" || n === "container.exec") {
    const cmd = Array.isArray(args.command) ? args.command[args.command.length - 1] : args.cmd || args.command;
    return { class: classifyCommand(cmd), target: trunc(cmd), justification: args.justification || null, escalated: args.sandbox_permissions === "require_escalated" };
  }
  if (n === "apply_patch") return { class: "write", target: trunc((String(input).match(/\*\*\* (?:Update|Add|Delete) File: (.+)/) || [])[1] || null) };
  if (/web_search|search/.test(n)) return { class: "outward", target: trunc(args.query || JSON.stringify(args)) };
  return { class: /(create|update|delete|write|send|post|publish|deploy|upload|push)/i.test(n) ? "write" : "read", target: trunc(JSON.stringify(args)) };
}
