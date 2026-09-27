import asyncio, json, os
from rec import Rec, cc_files, CAM_JS
from rects import RECT, OUT
async def textrect(r, text):
    return await r.js("""t => { const w = document.createTreeWalker(document.querySelector('#panel'), NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) { const i = n.textContent.indexOf(t); if (i >= 0) { const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + t.length);
        const b = rg.getBoundingClientRect(); return [b.x*2, b.y*2, b.width*2, b.height*2]; } } return null; }""", text)
async def main():
    R = json.load(open(OUT))
    async with Rec() as r:
        await r.load(cc_files()); await r.js(CAM_JS)
        await r.page.keyboard.press("2"); await r.step(10)
        await r.page.click("#panel .items button >> nth=0"); await r.step(90)
        await r.js("()=>{const h=[...document.querySelectorAll('#panel h3, #panel h2')].find(x=>/Custody ladder/.test(x.textContent)); if(h) h.scrollIntoView({block:'start'})}")
        await r.step(4)
        R["custody"]["asked"] = await textrect(r, "Asked by")
        R["custody"]["permitted"] = await textrect(r, "Permitted by")
        R["custody"]["bypass"] = await textrect(r, "permission mode: bypassPermissions")
        R["custody"]["inview"] = await textrect(r, "6 flagged instruction-like (heuristic).")
        R["custody"]["did"] = await textrect(r, "Did")
    async with Rec() as r:
        await r.load(cc_files()); await r.js(CAM_JS)
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.scrollIntoView({block:'center'})}")
        await r.step(4)
        R["setup_claudemd"]["sentagain"] = await textrect(r, "sent 6×")
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.querySelector('button').click()}")
        await r.step(90)
        R["reader"] = {k: await textrect(r, t) for k, t in {
            "title": "nested memory · ~/.claude/CLAUDE.md", "sentagain": "Sent again while an identical copy was still in context.",
            "body": "# David Montgomery", "green": "From your setup. Your text is marked with a green edge"}.items()}
        R["reader"]["panel"] = await r.js(RECT, ["#panel", None])
    json.dump(R, open(OUT, "w"), indent=1)
    print(json.dumps({k: R[k] for k in ["custody", "reader"]}, indent=0)[:3000]); print(R["setup_claudemd"]["sentagain"])
asyncio.run(main())
