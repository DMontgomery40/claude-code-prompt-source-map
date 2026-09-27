import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, os, sys, json
from rec import Rec, cc_files, CAM_JS
OUT = private_dir("video", "explainer", "explore", "cams"); os.makedirs(OUT, exist_ok=True)
SET = r"""([P, D, az, el, fy, dx]) => {
  const tr = window.__trace.transport; tr.seek(P);
  const sc = window.__trace.scene, g = sc.getGeometry(), S = window.__trace.S, a = S.trace.agents.find(x => x.kind === 'root');
  const i = Math.max(0, Math.floor(P)); const cx = g.x(a, i) + (g.x(a, i + 1) - g.x(a, i)) * (P - i); const h = Math.max(g.crest(a, i), 0.5);
  const tx = cx + dx, ty = h * fy, tz = -1.0;
  const p = [tx + D * Math.cos(el) * Math.sin(az), ty + D * Math.sin(el), tz + D * Math.cos(el) * Math.cos(az)];
  window.__cam.set(p, [tx, ty, tz]); return [cx, h];
}"""
VARIANTS = json.loads(sys.argv[1])
async def main():
    async with Rec(dpr=1) as r:
        await r.load(cc_files()); await r.js(CAM_JS); await r.step(30)
        await r.page.keyboard.press("f"); await r.step(5)
        for k, v in enumerate(VARIANTS):
            for _ in range(4):
                res = await r.js(SET, v); await r.step(1)
            await r.step(20); await r.js(SET, v); await r.step(3)
            await r.page.screenshot(path=f"{OUT}/v{k:02d}.jpg", type="jpeg", quality=85)
            print(k, v, [round(x, 2) for x in res], await r.js("()=>document.querySelector('#zoom-status').innerText"))
asyncio.run(main())
