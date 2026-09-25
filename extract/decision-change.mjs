// When has a decision's logic changed between two builds? A decision cites the function that
// makes it (a provenance entry with span "function"); relocation compares that function's old
// and new code here. The minifier renames identifiers on every release, and names do not
// change behavior, so they are compared up to a consistent renaming; literals, property
// names, keywords, and punctuation (and so statement order) must match exactly.
import { tokenizer } from "acorn";

// Same shape relocate.mjs treats as a minified name.
const minified = /^[A-Za-z_$][\w$]{0,2}$/;
const contextual = new Set(["of", "get", "set", "let", "env", "as", "from", "async", "await", "yield"]);

export function codeShape(src) {
  const out = [], names = new Map();
  let prev = null;
  for (const t of tokenizer(src, { ecmaVersion: "latest", allowHashBang: true })) {
    const label = t.type.label;
    if (label === "name" && minified.test(t.value) && !contextual.has(t.value) && prev !== "." && prev !== "?.") {
      if (!names.has(t.value)) names.set(t.value, names.size);
      out.push(`#${names.get(t.value)}`);
    } else if (label === "regexp") out.push(`regexp:/${t.value.pattern}/${t.value.flags}`);
    else if (label === "string" || label === "template") out.push(`${label}:${JSON.stringify(t.value)}`);
    else if (label === "num") out.push(`num:${String(t.value)}`);
    else out.push(typeof t.value === "string" ? `${label}:${t.value}` : label);
    prev = label;
  }
  return out;
}

// A decision's function range after relocation. `status` is relocate's: only "same" and
// "reshaped" found a range at all. No shared-evidence or published-text exemptions apply.
export function decisionRangeChanged({ status, oldText, newText }) {
  if (status !== "same" && status !== "reshaped") return true;
  if (oldText === newText) return false;
  try {
    const a = codeShape(oldText), b = codeShape(newText);
    return a.length !== b.length || a.some((x, i) => x !== b[i]);
  } catch {
    return true;
  }
}
