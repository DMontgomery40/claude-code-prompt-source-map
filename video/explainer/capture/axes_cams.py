import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, os, json, sys
from rec import Rec, cc_files, CAM_JS
OUT = private_dir("video", "explainer", "explore", "axcam"); os.makedirs(OUT, exist_ok=True)
C = json.loads(sys.argv[1])
async def main():
    async with Rec(dpr=1) as r:
        await r.load(cc_files()); await r.js(CAM_JS); await r.clean(); await r.page.mouse.move(1918, 1078); await r.step(20)
        for k, (p, t) in enumerate(C):
            for _ in range(3): await r.js("([p,t])=>window.__cam.set(p,t)", [p, t]); await r.step(1)
            await r.step(10)
            await r.page.screenshot(path=f"{OUT}/c{k}.jpg", type="jpeg", quality=85)
asyncio.run(main())
