import asyncio
from rec import Rec, cc_files, CAM_JS
async def main():
    async with Rec(dpr=1) as r:
        await r.load(cc_files()); await r.js(CAM_JS); await r.step(30)
        print("STATS:", await r.js("()=>document.querySelector('#stats').innerText.replace(/\\n/g,' | ')"))
        await r.js("()=>{const d=[...document.querySelectorAll('#panel details')]; d.forEach(x=>x.open=true)}"); await r.step(5)
        t = await r.js("()=>document.querySelector('#panel').innerText")
        i = t.find('instructions file · ~/.claude/CLAUDE.md'); print("SETUP ROW:", t[i:i+230].replace('\n',' | '))
        i = t.find('Your setup also'); print("SETUP ALSO:", t[i:i+90])
        i = t.find('Context resets'); print("RESETS:", t[i:i+140].replace('\n',' | '))
        i = t.find('Injected'); print("INJECTED:", t[i:i+60].replace('\n',' | '))
        kb = r.page.keyboard
        await kb.press("/"); await r.step(5)
        for _ in range(3): await kb.press("Tab"); await r.step(3)
        for ch in "CLAUDE.md": await kb.press(ch); await r.step(2)
        await r.step(40)
        print("SEARCH ROW1:", await r.js("()=>document.querySelector('.pal-row').innerText.replace(/\\n/g,' | ')"))
        await kb.press("Escape"); await r.step(10)
        await kb.press("2"); await r.step(60)
        t = await r.js("()=>document.querySelector('#panel').innerText"); i = t.find('Left the machine'); print("EGRESS:", t[i:i+60].replace('\n',' | '))
        await kb.press("4"); await r.step(60)
        t = await r.js("()=>document.querySelector('#panel').innerText"); i = t.find('agents ·'); print("AGENTS:", t[i-5:i+200].replace('\n',' | '))
asyncio.run(main())
