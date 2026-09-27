"""Source-pixel rectangles (dpr 2) of the UI elements the edit highlights. Writes edit/src/rects.json."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, json, os
from rec import Rec, cc_files, CAM_JS
from shots import PEAK, codex_files

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "edit", "src", "rects.json")

RECT = """([sel, text]) => {
  const els = [...document.querySelectorAll(sel)].filter(e => !text || e.innerText.includes(text));
  const e = els[0]; if (!e) return null;
  const r = e.getBoundingClientRect(); return [r.x * 2, r.y * 2, r.width * 2, r.height * 2];
}"""


async def grab(r, spec):
    out = {}
    for key, (sel, text) in spec.items():
        out[key] = await r.js(RECT, [sel, text])
        if out[key] is None:
            print("MISSING", key, sel, text)
    return out


async def main():
    R = {}
    async with Rec() as r:
        await r.load(cc_files())
        await r.js(CAM_JS)
        R["L0"] = await grab(r, {
            "stat_wall": (".stats > *", "wall clock"),
            "stat_requests": (".stats > *", "main-thread requests"),
            "stat_subagents": (".stats > *", "subagents,"),
            "stat_cache": (".stats > *", "read from cache"),
            "stats": (".stats", None),
            "panel": ("#panel", None),
            "strata_injected": ("#panel li", "Injected"),
            "setup_head": ("#panel h3", "From your setup"),
        })
        R["L0"]["_texts"] = await r.js("[...document.querySelectorAll('.stats > *')].map(e=>e.innerText.replace(/\\n/g,' | '))")
        # setup list scrolled like the stills
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.scrollIntoView({block:'center'})}")
        await r.step(4)
        R["setup_claudemd"] = await grab(r, {
            "claudemd": ("#panel li", "instructions file · ~/.claude/CLAUDE.md"),
            "agentchecks": ("#panel li", "instructions file · ~/.agents/agent-checks.md"),
            "memory": ("#panel li", "memory index"),
        })
        R["setup_claudemd"]["_text"] = await r.js("[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')).innerText")
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('skills list (85)')); li.scrollIntoView({block:'center'})}")
        await r.step(4)
        R["setup_skills"] = await grab(r, {"skills": ("#panel li", "skills list (85)"),
                                           "invoked": ("#panel li", "invoked skills re-sent: superpowers")})
        # egress lens at L0
        await r.js("()=>{document.querySelector('#panel').scrollTop=0}")
        await r.page.keyboard.press("2")
        await r.step(10)
        R["egress_L0"] = await grab(r, {
            "left_head": ("#panel h3", "Left the machine"),
            "left_sub": ("#panel p, #panel .meta, #panel span", "deploy ·"),
            "first_item": ("#panel .items button", None),
            "panel": ("#panel", None),
        })
        R["egress_L0"]["_text"] = await r.js("document.querySelector('#panel').innerText.slice(0,400)")
        await r.page.click("#panel .items button >> nth=0")
        await r.step(90)
        R["egress_L2"] = await grab(r, {
            "action": ("#panel h3", "Action"),
            "custody": ("#panel h3", "Custody ladder"),
            "panel": ("#panel", None),
        })
        R["egress_L2"]["_text"] = await r.js("document.querySelector('#panel').innerText.slice(0,1500)")
        await r.js("()=>{const h=[...document.querySelectorAll('#panel h3, #panel h2')].find(x=>/Custody ladder/.test(x.textContent)); if(h) h.scrollIntoView({block:'start'})}")
        await r.step(4)
        R["custody"] = await grab(r, {"custody": ("#panel h3", "Custody ladder"), "panel": ("#panel", None)})
        R["custody"]["_text"] = await r.js("(()=>{const h=[...document.querySelectorAll('#panel h3')].find(x=>/Custody ladder/.test(x.textContent)); return h ? h.parentElement.innerText.slice(0,800) : null})()")
        # agents lens
        await r.js("()=>window.__trace.set({level:0, agentId:null, reqIdx:null, stratum:null, block:null})")
        await r.page.keyboard.press("4")
        await r.step(30)
        R["agents"] = await grab(r, {"advisor": ("#panel tr, #panel li, #panel .row", "advisor"),
                                     "table": ("#panel table", None)})
        R["agents"]["_text"] = await r.js("document.querySelector('#panel').innerText.slice(0,600)")
        # L1 / L2 / L3 at the peak
        await r.page.keyboard.press("1")
        await r.js("p=>{const {S,set}=window.__trace; set({level:1, agentId:S.layout.root.id, reqIdx:p, stratum:null, block:null})}", PEAK)
        await r.step(120)
        R["L1"] = await grab(r, {"ask_ugh": ("#panel li", "ugh gpt"), "asks_head": ("#panel h3", "Asks"),
                                 "cursor": (".labels div", "966k ·")})
        await r.js("()=>window.__trace.set({level:2})")
        await r.step(120)
        R["L2"] = await grab(r, {"lab_injected": (".labels div", "Injected ≈"), "lab_model": (".labels div", "Model ≈"),
                                 "lab_harness": (".labels div", "Harness ≈"), "head": ("#panel h2", "tokens in context"),
                                 "bar": ("#panel li", "Injected")})
        await r.js("()=>window.__trace.set({level:3, stratum:'injected'})")
        await r.step(120)
        R["L3"] = await grab(r, {"head": ("#panel h2", "Injected"), "setup": ("#panel h3", "From your setup"),
                                 "product": ("#panel h3", "from the product")})
        R["L3"]["_text"] = await r.js("document.querySelector('#panel').innerText.slice(0,300)")
    async with Rec() as r:
        await r.load(codex_files())
        R["codex"] = await grab(r, {"stats": (".stats", None), "skills": ("#panel li", "skills list")})
        R["codex"]["_texts"] = await r.js("[...document.querySelectorAll('.stats > *')].map(e=>e.innerText.replace(/\\n/g,' | '))")
        R["codex"]["_skills"] = await r.js("(()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('skills list')); return li ? li.innerText : null})()")
    json.dump(R, open(OUT, "w"), indent=1)
    print(json.dumps(R, indent=1)[:6000])

asyncio.run(main())
