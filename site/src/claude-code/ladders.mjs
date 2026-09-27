// Interactive "what wins" cards. The static lists in the markdown are the no-JS fallback; a
// card is added to each decision and driven by the same evaluator the probes use, serialized
// into the page. Controls carry indexes, so typed values (numbers, booleans) survive the DOM.
import { appliesTo, evaluateLadder } from "./ladder-eval.mjs";
import { escapeHtml } from "./render.mjs";
import { headingSlug } from "./toc.mjs";

const MECH = { env: "env", settings: "settings", cli: "flag", frontmatter: "agent", managed: "managed", remote: "remote", default: "default", layer: "file", session: "session" };
// A constraint that has none of these only describes a check; it gets no toggle.
const KINDS = ["skip_values", "cap", "replace_values", "keep_rungs", "effect"];
const text = v => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
const valueName = (d, v) => text(d.value_labels?.[text(v)] ?? v);
const choices = r => [...(r.accepts ?? []), ...(r.invalid_example !== undefined ? [r.invalid_example] : [])];
const always = list => list.every(when => !Object.keys(when).length);

function control(d, r) {
  const aria = `aria-label="${escapeHtml(r.label ?? r.knob ?? r.id)}"`;
  if (r.input === "toggle") return `<label class="check"><input type="checkbox" ${aria}> set</label>`;
  if (r.input !== "choice") return "";
  const list = choices(r);
  if (!list.length) return `<input type="text" class="value" placeholder="any value" spellcheck="false" autocomplete="off" ${aria}>`;
  const accepted = r.accepts?.length ?? 0;
  // The literal comes first: it is what the reader types. A differing label follows it.
  const option = (v, i) => {
    const literal = text(v), label = valueName(d, v);
    return `<option value="${i}">${escapeHtml(literal)}${label !== literal ? ` (${escapeHtml(label)})` : ""}${i < accepted ? "" : " (invalid)"}</option>`;
  };
  return `<select ${aria}><option value="">not set</option>${list.map(option).join("")}</select>`;
}

function rung(d, r, i) {
  const name = r.knob ? `<code>${escapeHtml(r.label ?? r.knob)}</code>` : escapeHtml(r.label ?? r.id);
  const proof = r.verified === "tested" ? '<span class="vf tested">Tested</span>' : '<span class="vf read">Read from code</span>';
  return `<li class="rung" data-rung="${escapeHtml(r.id)}"><span class="n">${i + 1}</span><span class="mech ${escapeHtml(r.mechanism)}">${MECH[r.mechanism] ?? escapeHtml(r.mechanism)}</span>`
    + `<div class="knob"><div class="knob-name${r.knob ? "" : " plain"}">${name}</div><div class="knob-note">${r.note ? `${escapeHtml(r.note)} ` : ""}${proof}</div></div>`
    + `<div class="control">${control(d, r)}</div><span class="state"></span></li>`;
}

function limit(c) {
  const id = escapeHtml(c.id);
  const name = c.knob ? `<code>${escapeHtml(c.knob_title ?? c.knob)}</code>` : escapeHtml(c.label ?? c.id);
  const note = [c.knob ? c.label : null, c.note].filter(Boolean).map(escapeHtml).join(" ");
  const acts = KINDS.some(k => c[k] !== undefined);
  const conditional = acts && c.applies_when?.length;
  const head = acts && !conditional ? `<label class="check"><input type="checkbox" data-constraint="${id}"> <span>${name}</span></label>` : `<span class="limit-name">${name}</span>`;
  const status = conditional ? `<span class="limit-state${always(c.applies_when) ? " on" : ""}">${always(c.applies_when) ? "Always applies" : ""}</span>` : "";
  return `<div class="limit" data-limit="${id}"><div class="limit-head">${head}${status}</div>${note ? `<div class="limit-note">${note}</div>` : ""}</div>`;
}

function card(d) {
  const contexts = d.context ?? [];
  const defaults = Object.fromEntries(contexts.map(c => [c.key, c.values[0]?.value]));
  const ctx = c => `<div class="ctx" data-ctx="${escapeHtml(c.key)}"${appliesTo({ applies_when: c.show_when }, { context: defaults }) ? "" : " hidden"}><span class="ctx-name">${escapeHtml(c.label)}</span>`
    + `<span class="seg">${c.values.map((v, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}">${escapeHtml(v.label ?? text(v.value))}</button>`).join("")}</span></div>`;
  const bypass = b => `<div class="bypass" data-bypass-row="${escapeHtml(b.id)}"><label class="check"><input type="checkbox" data-bypass="${escapeHtml(b.id)}"> <code>${escapeHtml(b.label ?? b.knob_title ?? b.knob ?? b.id)}</code></label>${b.note ? `<span class="note">${escapeHtml(b.note)}</span>` : ""}</div>`;
  const total = d.rungs.length, tested = d.rungs.filter(r => r.verified === "tested").length;
  const proof = tested === total ? `<span><b class="tested">Tested</b> against the requests Claude Code actually sent: all ${total} rungs.</span>`
    : tested ? `<span><b class="tested">Tested</b> against the requests Claude Code actually sent: ${tested} of ${total} rungs.</span><span><b class="read">Read from code</b>: the rest.</span>`
    : `<span><b class="read">Read from code</b>: all ${total} rungs.</span>`;
  return `<div class="ladder" data-decision="${escapeHtml(d.id)}">`
    + `<div class="result" aria-live="polite"><span class="result-label">Takes effect</span><span class="result-value"></span><span class="result-why"></span></div>`
    + (contexts.length ? `<div class="context">${contexts.map(ctx).join("")}</div>` : "")
    + (d.bypasses?.length ? `<div class="bypasses"><div class="part-label">Before the ladder</div>${d.bypasses.map(bypass).join("")}</div>` : "")
    + `<ol class="rungs">${d.rungs.map((r, i) => rung(d, r, i)).join("")}</ol>`
    + (d.notes?.length ? `<ul class="notes">${d.notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}</ul>` : "")
    + (d.constraints?.length ? `<div class="limits"><div class="part-label">After the ladder</div>${d.constraints.map(limit).join("")}</div>` : "")
    + `<div class="proof">${proof}</div></div>`;
}

const staticClass = tag => tag.replace(/^<(ol|ul)((?:\s[^>]*)?)>$/, (_, name, attrs) =>
  /\sclass="/.test(attrs) ? `<${name}${attrs.replace(/\sclass="([^"]*)"/, ' class="$1 ladder-static"')}>` : `<${name}${attrs} class="ladder-static">`);

// A decision's block runs from its heading to the next heading. Its lists are the static
// ladder (bypasses, rungs, constraints); the card goes where they start and replaces them.
export function enhanceLadders(html, decisions) {
  const byTitle = new Map(decisions.map(d => [headingSlug(escapeHtml(d.title)), d]));
  const out = html.split(/(?=<h[1-6][\s>])/).map(block => {
    const heading = block.match(/^<h4[^>]*>([\s\S]*?)<\/h4>(?:<div class="item-tags">[\s\S]*?<\/div>)?/);
    const d = heading && byTitle.get(headingSlug(heading[1]));
    if (!d) return block;
    const rest = block.slice(heading[0].length).replace(/<(?:ol|ul)(?:\s[^>]*)?>/g, staticClass);
    const at = rest.search(/<(?:ol|ul)[\s>]/);
    return at < 0 ? `${heading[0]}${card(d)}${rest}` : `${heading[0]}${rest.slice(0, at)}${card(d)}${rest.slice(at)}`;
  }).join("");
  // The card needs the ladder, not its provenance or probe recipes; /data/ has the full records.
  const slim = decisions.map(({ provenance, realize_context, details, ...d }) => ({ ...d,
    rungs: d.rungs.map(({ provenance, realize, ...r }) => r),
    bypasses: d.bypasses?.map(({ provenance, realize, ...b }) => b),
    constraints: d.constraints?.map(({ provenance, realize, ...c }) => c) }));
  return `${out}<script type="application/json" id="ladder-data">${JSON.stringify(slim).replace(/</g, "\\u003c")}</script>`;
}

// A card's scenario lives in the query: ?<decision>=<rung>,<rung>:<value>,ctx.<key>:<value>,
// bypass.<id>,limit.<id>. Each value is encoded before the parts are joined, and the query
// keeps %2C encoded, so a comma inside a value never becomes a separator. Both run in the page.
export function readScenario(search, id) {
  const decode = s => { try { return decodeURIComponent(s); } catch { return s; } };
  return (new URLSearchParams(search).get(id) ?? "").split(",").filter(Boolean).map(part => {
    const at = part.indexOf(":");
    return at < 0 ? [part, undefined] : [part.slice(0, at), decode(part.slice(at + 1))];
  });
}

export function writeScenario(search, id, entries) {
  const params = new URLSearchParams(search);
  const parts = entries.map(([key, value]) => (value === undefined ? key : key + ":" + encodeURIComponent(value)));
  if (parts.length) params.set(id, parts.join(",")); else params.delete(id);
  return params.toString().replace(/%3A/gi, ":");
}

// Runs in the page, after appliesTo, evaluateLadder and the scenario helpers are declared beside it.
function ladderClient() {
  const data = JSON.parse(document.getElementById("ladder-data")?.textContent ?? "[]");
  const text = v => (v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v));
  for (const el of document.querySelectorAll(".ladder[data-decision]")) {
    const d = data.find(x => x.id === el.dataset.decision);
    if (!d) continue;
    try { wire(el, d); } catch (error) { console.error(error); }
  }

  function wire(el, d) {
    const contexts = d.context ?? [];
    const name = v => text(d.value_labels?.[text(v)] ?? v);
    const choices = r => [...(r.accepts ?? []), ...(r.invalid_example !== undefined ? [r.invalid_example] : [])];
    const rungOf = id => d.rungs.find(r => r.id === id);
    const defaults = Object.fromEntries(contexts.map(c => [c.key, c.values[0]?.value]));
    const state = { context: { ...defaults }, set: {}, bypass: {}, constraints: {} };

    for (const [key, raw] of readScenario(location.search, d.id)) {
      if (key.startsWith("ctx.")) {
        const c = contexts.find(x => x.key === key.slice(4));
        const v = c?.values.find(x => text(x.value) === raw);
        if (v) state.context[c.key] = v.value;
      } else if (key.startsWith("bypass.")) state.bypass[key.slice(7)] = true;
      else if (key.startsWith("limit.")) state.constraints[key.slice(6)] = true;
      else {
        const r = rungOf(key);
        if (r?.input === "toggle") state.set[r.id] = true;
        else if (r?.input === "choice" && raw) {
          const list = choices(r), v = list.find(x => text(x) === raw);
          if (v !== undefined) state.set[r.id] = v;
          else if (!list.length) state.set[r.id] = raw;
        }
      }
    }

    for (const li of el.querySelectorAll(".rung")) {
      const r = rungOf(li.dataset.rung), input = li.querySelector(".control input, .control select");
      if (!r || !input) continue;
      const list = choices(r);
      if (input.type === "checkbox") input.checked = state.set[r.id] === true;
      else if (input.tagName === "SELECT") input.value = state.set[r.id] === undefined ? "" : String(list.indexOf(state.set[r.id]));
      else input.value = state.set[r.id] ?? "";
      input.addEventListener(input.type === "text" ? "input" : "change", () => {
        const v = input.type === "checkbox" ? (input.checked || undefined)
          : input.tagName === "SELECT" ? (input.value === "" ? undefined : list[Number(input.value)])
          : (input.value.trim() || undefined);
        if (v === undefined) delete state.set[r.id]; else state.set[r.id] = v;
        draw();
      });
    }
    for (const row of el.querySelectorAll(".ctx")) {
      const c = contexts.find(x => x.key === row.dataset.ctx), buttons = [...row.querySelectorAll("button[data-i]")];
      const press = () => { for (const b of buttons) b.setAttribute("aria-pressed", String(c.values[Number(b.dataset.i)].value === state.context[c.key])); };
      press();
      row.addEventListener("click", event => {
        const b = event.target.closest("button[data-i]");
        if (!b) return;
        state.context[c.key] = c.values[Number(b.dataset.i)].value;
        press();
        draw();
      });
    }
    for (const [selector, target, key] of [["[data-bypass]", state.bypass, "bypass"], ["[data-constraint]", state.constraints, "constraint"]]) {
      for (const box of el.querySelectorAll(selector)) {
        box.checked = target[box.dataset[key]] === true;
        box.addEventListener("change", () => { if (box.checked) target[box.dataset[key]] = true; else delete target[box.dataset[key]]; draw(); });
      }
    }

    // A context switch that is not shown counts as its first value.
    const effective = () => {
      const context = { ...state.context };
      for (const c of contexts) if (!appliesTo({ applies_when: c.show_when }, { context, set: state.set })) context[c.key] = defaults[c.key];
      return context;
    };
    const put = (node, parts) => node.replaceChildren(...parts.map(p => {
      if (typeof p === "string") return p;
      const e = document.createElement(p.code ? "code" : "span");
      e.textContent = p.code ?? p.plain;
      return e;
    }));

    function draw() {
      const scenario = { context: effective(), set: state.set, bypass: state.bypass, constraints: state.constraints };
      const out = evaluateLadder(d, scenario);
      const merging = d.shape === "merge" || (d.shape === "layered" && Boolean(d.merge_when?.length) && appliesTo({ applies_when: d.merge_when }, scenario));
      for (const row of el.querySelectorAll(".ctx")) row.hidden = !appliesTo({ applies_when: contexts.find(x => x.key === row.dataset.ctx).show_when }, scenario);
      for (const row of el.querySelectorAll("[data-bypass-row]")) row.hidden = !appliesTo(d.bypasses.find(x => x.id === row.dataset.bypassRow), scenario);
      for (const row of el.querySelectorAll("[data-limit]")) {
        const c = d.constraints.find(x => x.id === row.dataset.limit), status = row.querySelector(".limit-state");
        if (status && !c.applies_when.every(when => !Object.keys(when).length)) {
          const on = appliesTo(c, scenario);
          status.textContent = on ? "Applies" : "Does not apply";
          status.classList.toggle("on", on);
        }
        row.classList.toggle("acting", out.constrainedBy === c.id);
      }

      let n = 0, winNumber = 0, passed = false;
      for (const r of d.rungs) {
        const li = el.querySelector('[data-rung="' + CSS.escape(r.id) + '"]');
        li.hidden = !appliesTo(r, scenario);
        if (li.hidden) continue;
        li.querySelector(".n").textContent = String(++n);
        const isSet = Boolean(r.input) && state.set[r.id] !== undefined && state.set[r.id] !== false && state.set[r.id] !== "";
        let cls = "", word = "";
        if (out.bypassedBy) { cls = "below"; word = "not reached"; }
        else if (out.contributors.includes(r.id)) { cls = "win"; word = merging ? "adds" : "wins"; winNumber = n; }
        else if (out.skipped.includes(r.id)) { cls = "skip"; word = "skipped"; }
        else if (merging) { cls = isSet || !r.input ? "over" : ""; word = isSet || !r.input ? "not kept" : "not set"; }
        else if (passed) { cls = isSet ? "over" : "below"; word = isSet ? "overridden" : "not reached"; }
        else word = r.input && !isSet ? "not set" : "";
        if (cls === "win" && !merging) passed = true;
        li.className = "rung" + (cls ? " " + cls : "");
        li.querySelector(".state").textContent = word;
      }

      const value = el.querySelector(".result-value"), many = Array.isArray(out.value);
      value.textContent = many ? (out.value.length ? out.value.map(name).join(", ") : "Nothing") : out.value === null || out.value === undefined ? "Not set" : name(out.value);
      value.classList.toggle("many", many);
      value.classList.toggle("none", Boolean(out.bypassedBy) || (many ? !out.value.length : out.value === null || out.value === undefined));
      const why = [];
      if (out.bypassedBy) {
        const b = d.bypasses.find(x => x.id === out.bypassedBy);
        why.push("set before the ladder by ", { code: b.label ?? b.knob_title ?? b.knob ?? b.id });
      } else if (merging) why.push(out.contributors.length ? "combined from " + out.contributors.length + (out.contributors.length === 1 ? " source" : " sources") : "no source is set");
      else if (out.rung) {
        const r = rungOf(out.rung);
        why.push("from rung " + winNumber + ": ", r.knob ? { code: r.label ?? r.knob } : { plain: r.label ?? r.id });
        if (r.mechanism === "remote") why.push(" (Anthropic can change this without a release)");
      } else why.push(d.fallback ? "no rung answers, so the default applies" : "no rung answers");
      if (out.constrainedBy) {
        const c = d.constraints.find(x => x.id === out.constrainedBy);
        why.push(c.cap ? ". Lowered by " : ". Changed after the ladder by ", c.knob ? { code: c.knob_title ?? c.knob } : { plain: c.label ?? c.id });
      }
      put(el.querySelector(".result-why"), why);

      const parts = [];
      for (const r of d.rungs) {
        const v = state.set[r.id];
        if (v !== undefined) parts.push(r.input === "toggle" ? [r.id] : [r.id, text(v)]);
      }
      for (const c of contexts) if (state.context[c.key] !== defaults[c.key]) parts.push(["ctx." + c.key, text(state.context[c.key])]);
      for (const id of Object.keys(state.bypass)) parts.push(["bypass." + id]);
      for (const id of Object.keys(state.constraints)) parts.push(["limit." + id]);
      const url = new URL(location.href);
      url.search = writeScenario(url.search, d.id, parts);
      if (url.href !== location.href) try { history.replaceState(history.state, "", url); } catch {}
    }
    draw();
  }
}

export const ladderScript = `
    (() => {
      ${appliesTo}
      ${evaluateLadder}
      ${readScenario}
      ${writeScenario}
      (${ladderClient})();
    })();`;

export const ladderStyles = `
    html:not(.js) .ladder{display:none}
    .js .markdown-body .ladder-static{display:none}
    .ladder{margin:6px 0 28px;border:1px solid var(--line);border-radius:10px;background:#171816;overflow:hidden;font-size:15px;line-height:1.5;overflow-wrap:anywhere}
    .ladder [hidden]{display:none!important}
    .ladder code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:.92em;overflow-wrap:anywhere}
    .ladder .result{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 14px;padding:18px 22px;border-bottom:1px solid var(--line);background:#141513}
    .ladder .result-label,.ladder .ctx-name,.ladder .part-label{color:#b3b7af;font-size:12px;font-weight:650;letter-spacing:.07em;text-transform:uppercase}
    .ladder .result-value{color:#c8f784;font-size:28px;font-weight:650;line-height:1.2;letter-spacing:-.01em;overflow-wrap:anywhere}
    .ladder .result-value.many{font-size:18px;font-weight:600;line-height:1.4;letter-spacing:0}
    .ladder .result-value.none{color:#b3b7af}
    .ladder .result-why{color:#c9ccc4;font-size:14.5px;overflow-wrap:anywhere}
    .ladder .result-why span{color:var(--text);font-weight:600}
    .ladder .context{display:flex;flex-wrap:wrap;gap:12px 26px;padding:14px 22px;border-bottom:1px solid var(--line)}
    .ladder .ctx{display:flex;align-items:center;flex-wrap:wrap;gap:6px 10px;min-width:0}
    .ladder .seg{display:inline-flex;flex-wrap:wrap;gap:4px;min-width:0;max-width:100%}
    .ladder .seg button{padding:4px 10px;border:1px solid #454944;border-radius:6px;background:#1c1d1b;color:#d3d6ce;font:inherit;font-size:13.5px;font-weight:500;line-height:1.35;text-align:left;max-width:100%;cursor:pointer}
    .ladder .seg button:hover{border-color:#7a7f77;color:var(--text)}
    .ladder .seg button[aria-pressed="true"]{border-color:#83bfd8;background:#233640;color:#fff}
    .ladder button:focus-visible,.ladder input:focus-visible,.ladder select:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
    .ladder .check{display:inline-flex;align-items:center;gap:7px;color:#d3d6ce;font-size:14px;cursor:pointer}
    .ladder input[type=checkbox]{flex:none;width:16px;height:16px;margin:0;accent-color:#c8f784}
    .ladder .bypasses{padding:12px 22px 14px;border-bottom:1px solid var(--line);background:#1d1715}
    .ladder .bypass{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin-top:8px}
    .ladder .bypass .note{color:#c9ccc4;font-size:14px}
    .ladder ol.rungs{list-style:none;margin:0;padding:4px 0}
    .ladder .rung{display:grid;grid-template-columns:22px 84px minmax(0,1fr) auto 100px;gap:6px 14px;align-items:center;margin:0;padding:11px 22px 11px 19px;border-left:3px solid transparent}
    .ladder .rung+.rung{border-top:1px solid #262825}
    .ladder .n{color:#b3b7af;font:600 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace;text-align:right}
    .ladder .mech{justify-self:start;padding:2px 7px;border:1px solid currentColor;border-radius:5px;font-size:11.5px;font-weight:650;line-height:1.4;letter-spacing:.06em;text-transform:uppercase}
    .ladder .mech.env{color:#83bfd8}.ladder .mech.settings,.ladder .mech.layer,.ladder .mech.managed{color:#e0b86b}.ladder .mech.cli{color:#9fd3a8}
    .ladder .mech.frontmatter{color:#c9a2f2}.ladder .mech.remote{color:#f5a193}.ladder .mech.default{color:#b3b7af}.ladder .mech.session{color:#f08fd2}
    .ladder .knob{min-width:0}
    .ladder .knob-name{color:var(--text);font-size:15px;font-weight:600;overflow-wrap:anywhere}
    .ladder .knob-name.plain{font-family:inherit}
    .ladder .knob-note{margin-top:2px;color:#c9ccc4;font-size:14px}
    .ladder .vf{font-size:12px;font-weight:650;white-space:nowrap}
    .ladder .control{display:flex;align-items:center;justify-self:end;min-width:0;max-width:100%}
    .ladder select,.ladder input.value{max-width:100%;padding:5px 8px;border:1px solid #4a4e48;border-radius:6px;background:#1f211e;color:var(--text);font:inherit;font-size:14px}
    .ladder input.value{width:150px}
    .ladder .state{color:#b3b7af;font-size:12px;font-weight:650;letter-spacing:.05em;text-align:right;text-transform:uppercase;white-space:nowrap}
    .ladder .rung.win{background:#1e2718;border-left-color:#c8f784}.ladder .rung.win .state{color:#c8f784}
    .ladder .rung.skip{border-left-color:#f0c27a}.ladder .rung.skip .state{color:#f0c27a}
    .ladder .rung.over .state{color:#dcdfd7}
    .ladder .rung.over .knob-name,.ladder .rung.below .knob-name{color:#c9ccc4}
    .ladder ul.notes{margin:0;padding:10px 22px 12px 40px;border-top:1px solid var(--line);color:#c9ccc4;font-size:14px}
    .ladder ul.notes li{margin:.2em 0}
    .ladder .limits{padding:12px 22px 14px;border-top:1px solid var(--line);background:#141513}
    .ladder .limit{margin-top:10px}
    .ladder .limit-head{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;color:var(--text);font-size:14.5px;font-weight:600}
    .ladder .limit-head .check{align-items:baseline;color:var(--text);font-size:14.5px;font-weight:600}
    .ladder .limit-head .check input{align-self:center}
    .ladder .limit-state{color:#b3b7af;font-size:12px;font-weight:650;letter-spacing:.05em;text-transform:uppercase}
    .ladder .limit-state.on,.ladder .limit.acting .limit-name,.ladder .limit.acting .check{color:#f0c27a}
    .ladder .limit-note{margin-top:2px;color:#c9ccc4;font-size:14px}
    .ladder .proof{display:flex;flex-wrap:wrap;gap:4px 18px;padding:12px 22px;border-top:1px solid var(--line);color:#c9ccc4;font-size:14px}
    .ladder .proof b{font-weight:650}.ladder .tested{color:#c8f784}.ladder .read{color:#e0b86b}
    @media(max-width:640px){
      .ladder .result,.ladder .context,.ladder .bypasses,.ladder .limits,.ladder .proof{padding-right:14px;padding-left:14px}
      .ladder ul.notes{padding-right:14px;padding-left:32px}
      .ladder .result-value{font-size:24px}
      .ladder .rung{grid-template-columns:20px minmax(0,1fr) auto;grid-template-areas:"n mech state" ". knob knob" ". control control";padding:12px 14px 12px 11px}
      .ladder .n{grid-area:n}.ladder .mech{grid-area:mech}.ladder .state{grid-area:state}.ladder .knob{grid-area:knob}
      .ladder .control{grid-area:control;justify-self:start}.ladder .control:empty{display:none}
    }`;
