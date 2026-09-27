import crypto from "node:crypto";
import { byteOffset } from "./asar.mjs";
import {
  callExtracted,
  declaratorName,
  decodeLiteral,
  enclosingFunction,
  innermostLiteral,
  insideLiteral,
  literalsOf,
  scanCode
} from "./js-scan.mjs";
import {
  distinctBranches,
  fullContextOnlyHeadings,
  functionHelperPrompts,
  staticHelperPrompts,
  voicePrompts
} from "../prompts.mjs";

export class AnchorError extends Error {}

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function occurrences(asar, spec) {
  const hits = asar.findPhrase(spec.anchor);
  if (!hits.length) throw new AnchorError(`[${spec.id}] anchor not found in any app script: "${spec.anchor}"`);
  const found = [];
  // Provenance order: the renderer bundle first, then main-process bundles.
  const rank = entry => `${entry.path.startsWith("webview/") ? 0 : 1}${entry.path}`;
  for (const { entry } of hits.sort((a, b) => rank(a.entry).localeCompare(rank(b.entry)))) {
    const text = asar.textOf(entry);
    for (let at = text.indexOf(spec.anchor); at >= 0; at = text.indexOf(spec.anchor, at + 1)) {
      found.push({ entry, source: text, index: at });
    }
  }
  return found;
}

// Several matches are acceptable only when they all yield the same text.
function agree(spec, results) {
  const distinct = new Set(results.map(result => result.text));
  if (distinct.size !== 1) {
    const places = results.map(result => `${result.file}@${result.offset}`).join(", ");
    throw new AnchorError(`[${spec.id}] anchor matched ${results.length} places with ${distinct.size} different texts: ${places}`);
  }
  return results[0];
}

function extractLiteral(asar, spec) {
  const results = occurrences(asar, spec).map(({ entry, source, index }) => {
    const literal = innermostLiteral(literalsOf(source), index);
    if (!literal) throw new AnchorError(`[${spec.id}] anchor in ${entry.path} is not inside a string literal`);
    if (literal.substitutions) throw new AnchorError(`[${spec.id}] literal in ${entry.path} has substitutions; it is no longer a static prompt`);
    const text = decodeLiteral(source, literal);
    return {
      text,
      file: entry.path,
      fileSha256: asar.fileSha256(entry),
      identifier: declaratorName(source, literal),
      offset: byteOffset(source, literal.start + 1),
      endOffset: byteOffset(source, literal.end - 1)
    };
  });
  const result = agree(spec, results);
  if (!result.text.includes(spec.anchor)) throw new AnchorError(`[${spec.id}] decoded text lost its anchor`);
  return { ...spec, ...result };
}

// The function that references the anchor literal's variable and takes every
// option in `spec.params`; null when this file only holds the literal.
function builderFor(spec, entry, source, index) {
  const literal = innermostLiteral(literalsOf(source), index);
  const name = literal && declaratorName(source, literal);
  if (!name) throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is not assigned to a variable`);
  const builders = new Map();
  const escaped = name.replace(/\$/g, "\\$");
  for (const match of source.matchAll(new RegExp(`(?<![\\w$.#])${escaped}(?![\\w$=])`, "g"))) {
    if (insideLiteral(source, match.index)) continue;
    let fn;
    try {
      fn = enclosingFunction(source, match.index);
    } catch {
      continue;
    }
    if (spec.params.every(param => new RegExp(`[({,]${param}\\b`).test(fn.params))) builders.set(fn.start, fn);
  }
  if (builders.size > 1) throw new AnchorError(`[${spec.id}] ${builders.size} functions in ${entry.path} build from ${name}`);
  return builders.values().next().value ?? null;
}

function extractFunctionPrompt(asar, spec) {
  const found = occurrences(asar, spec).map(({ entry, source, index }) => {
    let fn;
    try {
      fn = spec.via === "builder" ? builderFor(spec, entry, source, index) : enclosingFunction(source, index);
    } catch (error) {
      if (error instanceof AnchorError) throw error;
      throw new AnchorError(`[${spec.id}] ${error.message} in ${entry.path}`);
    }
    return fn && { entry, source, fn };
  }).filter(Boolean);
  if (!found.length) throw new AnchorError(`[${spec.id}] no function builds a prompt from the anchor "${spec.anchor}"`);
  const results = found.map(({ entry, source, fn }) => {
    for (const param of spec.params ?? []) {
      if (!new RegExp(`[({,]${param}\\b`).test(fn.params)) {
        throw new AnchorError(`[${spec.id}] ${fn.name} in ${entry.path} no longer takes option ${param}`);
      }
    }
    let called;
    try {
      called = callExtracted(source, fn.source, spec.args, { label: `[${spec.id}] ${fn.name}` });
    } catch (error) {
      throw new AnchorError(`${error.message} (${entry.path})`);
    }
    const text = spec.wrap ? spec.wrap(called.text) : called.text;
    return {
      text,
      name: fn.name,
      file: entry.path,
      fileSha256: asar.fileSha256(entry),
      offset: byteOffset(source, fn.start)
    };
  });
  const result = agree(spec, results);
  if (!result.text.includes(spec.anchor)) throw new AnchorError(`[${spec.id}] extracted text does not contain "${spec.anchor}"`);
  return { ...spec, ...result, field: spec.field(result.name) };
}

export function extractAppPrompts(asar) {
  const staticHelpers = staticHelperPrompts.map(spec => extractLiteral(asar, spec));
  const functionHelpers = functionHelperPrompts.map(spec => extractFunctionPrompt(asar, spec));
  const voice = voicePrompts.map(spec => extractLiteral(asar, spec));

  const byId = new Map(functionHelpers.map(item => [item.id, item]));
  for (const group of distinctBranches) {
    const texts = group.map(id => byId.get(id).text);
    if (new Set(texts).size !== texts.length) {
      throw new AnchorError(`branches ${group.join(", ")} produced identical text; a branch option no longer has an effect`);
    }
  }
  const defaultContext = byId.get("desktop-context-default").text;
  const fullContext = byId.get("desktop-context-full").text;
  for (const heading of fullContextOnlyHeadings) {
    if (!fullContext.includes(heading)) throw new AnchorError(`full desktop context lacks "${heading}"; a builder option was renamed or removed`);
    if (defaultContext.includes(heading)) throw new AnchorError(`default desktop context unexpectedly contains "${heading}"`);
  }

  for (const item of [...staticHelpers, ...functionHelpers, ...voice]) item.sha256 = sha256(item.text);
  return { staticHelpers, functionHelpers, voice };
}

// Extraction modes for the ChatGPT prompt pages (chatgpt-prompts.mjs). Each returns the text
// with provenance and a label: "exact" when the text is one literal with no run-time values,
// "assembled" when it is joined from literal pieces around run-time values, which are shown as
// <…> the way literalText shows template substitutions.

const PLACEHOLDER = "<…>";
const ESCAPES = { n: "\n", t: "\t", "`": "`", $: "$", "\\": "\\" };

// A literal's text in pieces: the raw source of each run of literal text and its decoded form,
// with every ${…} substitution rendered as <…> (same decoding as literalText).
function literalPieces(source, literal) {
  if (!literal.substitutions) {
    const text = decodeLiteral(source, literal);
    if (typeof text !== "string") throw new AnchorError(`literal at ${literal.start} is not text`);
    return { text, pieces: [{ raw: source.slice(literal.start + 1, literal.end - 1), text }] };
  }
  const raw = source.slice(literal.start + 1, literal.end - 1);
  const pieces = [];
  let text = "";
  let chunk = { from: 0, text: "" };
  const close = at => { if (at > chunk.from) pieces.push({ raw: raw.slice(chunk.from, at), text: chunk.text }); };
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "\\" && i + 1 < raw.length) { const c = ESCAPES[raw[i + 1]] ?? raw[i + 1]; chunk.text += c; text += c; i++; continue; }
    if (raw[i] === "$" && raw[i + 1] === "{") {
      close(i);
      let depth = 1;
      i += 2;
      while (i < raw.length && depth) { if (raw[i] === "{") depth++; else if (raw[i] === "}") depth--; i++; }
      i--;
      text += PLACEHOLDER;
      chunk = { from: i + 1, text: "" };
      continue;
    }
    chunk.text += raw[i];
    text += raw[i];
  }
  close(raw.length);
  return { text, pieces };
}

// Every piece's source text must be in the bundle file byte for byte, and its decoded text must
// appear, in order, in the assembled text.
function checkPieces(asar, spec, entry, text, pieces) {
  const bytes = asar.bytesOf(entry);
  let from = 0;
  for (const piece of pieces) {
    if (!bytes.includes(Buffer.from(piece.raw, "utf8"))) throw new AnchorError(`[${spec.id}] piece not found byte for byte in ${entry.path}: "${piece.raw.slice(0, 60)}"`);
    const at = text.indexOf(piece.text, from);
    if (at < 0) throw new AnchorError(`[${spec.id}] assembled text lost the piece "${piece.text.slice(0, 60)}"`);
    from = at + piece.text.length;
  }
}

function anchoredLiteral(spec, entry, source, index) {
  const literal = innermostLiteral(literalsOf(source), index);
  if (!literal) throw new AnchorError(`[${spec.id}] anchor in ${entry.path} is not inside a string literal`);
  return literal;
}

function provenance(asar, entry, source, literal) {
  return { file: entry.path, fileSha256: asar.fileSha256(entry), offset: byteOffset(source, literal.start + 1) };
}

function settle(spec, results) {
  const result = agree(spec, results);
  if (!result.text.includes(spec.anchor)) throw new AnchorError(`[${spec.id}] extracted text does not contain "${spec.anchor}"`);
  return { ...spec, ...result, occurrences: results.length, sha256: sha256(result.text) };
}

// One string or template literal. With substitutions it is labelled assembled.
export function extractTemplateLiteral(asar, spec) {
  return settle(spec, occurrences(asar, spec).map(({ entry, source, index }) => {
    const literal = anchoredLiteral(spec, entry, source, index);
    const { text, pieces } = literalPieces(source, literal);
    if (literal.substitutions) checkPieces(asar, spec, entry, text, pieces);
    return { text, label: literal.substitutions ? "assembled" : "exact", ...provenance(asar, entry, source, literal) };
  }));
}

const keyBefore = (source, literal) => /(?:^|[,{\s])([A-Za-z_$][\w$]*)\s*:\s*$/.exec(source.slice(Math.max(0, literal.start - 40), literal.start))?.[1] ?? null;
const separatedBy = (source, a, b, key) => new RegExp(`^\\s*,\\s*${key}\\s*:\\s*$`).test(source.slice(a.end, b.start));
const textOf = (source, literal) => (literal.substitutions ? null : decodeLiteral(source, literal));

// A formatjs message: the anchor literal is a `defaultMessage` value. The message id and the
// translator note (`description`) are read from the same object when present; `spec.messageId`
// (a string or a list) asserts the id.
export function extractFormatjsMessage(asar, spec) {
  return settle(spec, occurrences(asar, spec).map(({ entry, source, index }) => {
    const literal = anchoredLiteral(spec, entry, source, index);
    if (keyBefore(source, literal) !== "defaultMessage") throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is not a defaultMessage`);
    if (literal.substitutions) throw new AnchorError(`[${spec.id}] defaultMessage in ${entry.path} has substitutions`);
    const all = literalsOf(source);
    const at = all.indexOf(literal);
    const [before2, before, after] = [all[at - 2], all[at - 1], all[at + 1]];
    let messageId = null;
    let note = null;
    if (before && keyBefore(source, before) === "id" && separatedBy(source, before, literal, "defaultMessage")) messageId = textOf(source, before);
    if (before && keyBefore(source, before) === "description" && separatedBy(source, before, literal, "defaultMessage")) {
      note = textOf(source, before);
      if (before2 && keyBefore(source, before2) === "id" && separatedBy(source, before2, before, "description")) messageId = textOf(source, before2);
    }
    if (after && separatedBy(source, literal, after, "description")) note = textOf(source, after);
    if (spec.messageId && ![spec.messageId].flat().includes(messageId)) {
      throw new AnchorError(`[${spec.id}] message id in ${entry.path} is ${messageId ?? "absent"}, expected ${[spec.messageId].flat().join(" or ")}`);
    }
    return { text: decodeLiteral(source, literal), label: "exact", messageId, note, ...provenance(asar, entry, source, literal) };
  }));
}

// An operand of a + chain: a literal, or any other expression, which becomes <…>.
function operandPieces(source, start, end) {
  const literal = literalsOf(source).find(candidate => candidate.start === start);
  if (literal && literal.end === end) return literalPieces(source, literal);
  return { text: PLACEHOLDER, pieces: [] };
}

// The end of a + operand: the next top-level + or an operator of lower precedence. Optional
// chaining (?.) does not end it.
function operandEnd(source, start) {
  let at = start;
  for (;;) {
    at = scanCode(source, at, null, null, "+,;:?|&=");
    if (source[at] === "?" && source[at + 1] === ".") { at += 2; continue; }
    let end = at;
    while (end > start && /\s/.test(source[end - 1])) end--;
    return end;
  }
}

// `head + value + tail …`: the anchor is in the first literal of the chain.
export function extractConcatenation(asar, spec) {
  return settle(spec, occurrences(asar, spec).map(({ entry, source, index }) => {
    const head = anchoredLiteral(spec, entry, source, index);
    if (/\+\s*$/.test(source.slice(Math.max(0, head.start - 20), head.start))) throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is not the head of the concatenation`);
    const parts = [literalPieces(source, head)];
    let at = head.end;
    for (;;) {
      const plus = /^\s*\+(?![+=])\s*/.exec(source.slice(at, at + 40));
      if (!plus) break;
      const start = at + plus[0].length;
      const end = operandEnd(source, start);
      parts.push(operandPieces(source, start, end));
      at = end;
    }
    if (parts.length < 2) throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is no longer concatenated`);
    const text = parts.map(part => part.text).join("");
    const pieces = parts.flatMap(part => part.pieces);
    checkPieces(asar, spec, entry, text, pieces);
    return { text, label: "assembled", ...provenance(asar, entry, source, head) };
  }));
}

// `[a, b, …].join(separator)`: the anchor is in one element; the separator must be a literal.
export function extractArrayJoin(asar, spec) {
  return settle(spec, occurrences(asar, spec).map(({ entry, source, index }) => {
    const literal = anchoredLiteral(spec, entry, source, index);
    let open = -1;
    let close = -1;
    for (let j = literal.start - 1; j >= Math.max(0, literal.start - 20_000); j--) {
      if (source[j] !== "[" || insideLiteral(source, j)) continue;
      try {
        close = scanCode(source, j + 1, "]", null);
      } catch {
        continue;
      }
      if (close >= literal.end) { open = j; break; }
    }
    if (open < 0) throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is not in an array`);
    const join = /^\s*\.join\(\s*/.exec(source.slice(close + 1, close + 20));
    if (!join) throw new AnchorError(`[${spec.id}] array around the anchor in ${entry.path} is not joined`);
    const separatorStart = close + 1 + join[0].length;
    const separator = literalsOf(source).find(candidate => candidate.start === separatorStart);
    if (!separator || separator.substitutions || !/^\s*\)/.test(source.slice(separator.end, separator.end + 10))) throw new AnchorError(`[${spec.id}] join separator in ${entry.path} is not a literal`);
    const elements = [];
    for (let at = open + 1; at < close;) {
      const end = scanCode(source, at, null, null, ",");
      const start = at + /^\s*/.exec(source.slice(at, end))[0].length;
      let trimmed = end;
      while (trimmed > start && /\s/.test(source[trimmed - 1])) trimmed--;
      if (trimmed > start) elements.push({ start, end: trimmed, ...operandPieces(source, start, trimmed) });
      at = end + 1;
    }
    if (!elements.some(element => element.start === literal.start && element.end === literal.end)) throw new AnchorError(`[${spec.id}] anchor literal in ${entry.path} is not an element of the joined array`);
    const text = elements.map(element => element.text).join(decodeLiteral(source, separator));
    checkPieces(asar, spec, entry, text, elements.flatMap(element => element.pieces));
    return { text, label: "assembled", ...provenance(asar, entry, source, literal) };
  }));
}

// A prompt built by a function (see functionHelperPrompts), labelled assembled. The anchor
// literal's pieces must appear in the output.
export function extractFunctionText(asar, spec) {
  const result = extractFunctionPrompt(asar, spec);
  for (const { entry, source, index } of occurrences(asar, spec)) {
    checkPieces(asar, spec, entry, result.text, literalPieces(source, anchoredLiteral(spec, entry, source, index)).pieces);
  }
  return { ...result, label: "assembled", occurrences: 1, sha256: sha256(result.text) };
}
