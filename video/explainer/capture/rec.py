"""Frame-stepped recorder for Trace.

The page runs on virtual time: performance.now and requestAnimationFrame are replaced, so each
captured frame advances exactly 1/FPS s no matter how long the screenshot takes. Camera flights,
stage animations and damping come out perfectly smooth.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, glob, os, shutil, subprocess, time
from playwright.async_api import async_playwright

SERVER = "http://127.0.0.1:8860/trace/?rec=1"
FPS = 60
FOOTAGE = private_dir("video", "explainer", "footage")
FRAMES = private_dir("video", "explainer", "frames")  # scratch; cleared with the session

VIRTUAL_TIME = r"""
(() => {
  const realNow = performance.now.bind(performance);
  const realRaf = window.requestAnimationFrame.bind(window);
  const realCancel = window.cancelAnimationFrame.bind(window);
  let on = false, vt = 0, q = [], id = 1e6;
  performance.now = () => (on ? vt : realNow());
  window.requestAnimationFrame = cb => { if (!on) return realRaf(cb); const i = ++id; q.push([i, cb]); return i; };
  window.cancelAnimationFrame = i => { if (i > 1e6) q = q.filter(x => x[0] !== i); else realCancel(i); };
  window.__vt = {
    enable() { vt = realNow(); on = true; },
    step(ms) { vt += ms; const cur = q; q = []; for (const [, cb] of cur) { try { cb(vt); } catch (e) { console.error(e); } } },
    now: () => vt
  };
})();
"""

NO_TRANSITIONS = "*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}"


class Rec:
    def __init__(self, width=1920, height=1080, dpr=2):
        self.w, self.h, self.dpr = width, height, dpr

    async def __aenter__(self):
        self.pw = await async_playwright().start()
        self.browser = await self.pw.chromium.launch(args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
        self.page = await self.browser.new_page(viewport={"width": self.w, "height": self.h}, device_scale_factor=self.dpr)
        self.page.on("console", lambda m: print("console:", m.text[:300]) if m.type == "error" else None)
        self.page.on("pageerror", lambda e: print("pageerror:", str(e)[:300]))
        await self.page.add_init_script(VIRTUAL_TIME)
        return self

    async def __aexit__(self, *a):
        await self.browser.close()
        await self.pw.stop()

    async def load(self, files, url=SERVER):
        await self.page.goto(url)
        await self.page.add_style_tag(content=NO_TRANSITIONS)
        t = time.time()
        await self.page.set_input_files("#pick-files", files)
        await self.page.wait_for_selector("#app:not([hidden])", timeout=300000)
        await self.page.wait_for_timeout(1500)
        await self.page.mouse.move(self.w - 2, self.h - 2)  # park the pointer off the scene: no hover tips
        print(f"loaded {len(files)} files in {time.time() - t:.1f}s")
        await self.page.evaluate("window.__vt.enable()")
        await self.step(30)

    async def clean(self, on=True):
        """Cinematic mode: hide the HUD, side panel, minimap and crumbs; the scene's labels stay."""
        await self.page.evaluate("""on => {
          let st = document.getElementById('__clean');
          if (!st) { st = document.createElement('style'); st.id = '__clean'; document.head.append(st); }
          st.textContent = on ? '.hud,.side,#minimap,#crumbs,.viewtools,#tip,#playback,#map-zoom,#map-location{visibility:hidden!important}' : '';
          window.__trace.scene.setInsets(on ? {top:0,right:0,bottom:0,left:0} : window.__insets0);
        }""", on)

    async def js(self, code, arg=None):
        return await self.page.evaluate(code, arg)

    async def step(self, n=1):
        for _ in range(n):
            await self.page.evaluate(f"window.__vt.step({1000 / FPS})")

    async def shoot(self, name, frames, per_frame=None, keep_frames=False, step_ms=None):
        """Capture `frames` frames. per_frame(i) is awaited before each step (camera moves, clicks).
        step_ms(i): virtual ms to advance before frame i (default 1/FPS s); smaller is native slow motion."""
        d = os.path.join(FRAMES, name + "_" + time.strftime("%H%M%S"))
        os.makedirs(d)
        t = time.time()
        for i in range(frames):
            if per_frame:
                await per_frame(i)
            if step_ms: await self.page.evaluate(f"window.__vt.step({step_ms(i)})")
            else: await self.step(1)
            await self.page.screenshot(path=os.path.join(d, f"{i:05d}.jpg"), type="jpeg", quality=94)
        print(f"{name}: {frames} frames in {time.time() - t:.0f}s")
        out = os.path.join(FOOTAGE, name + ".mp4")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(d, "%05d.jpg"),
                        "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], check=True)
        return out

    async def still(self, name):
        path = os.path.join(FOOTAGE, name + ".png")
        await self.page.screenshot(path=path)
        return path


CC = cc_session()
def cc_files():
    return [CC + ".jsonl"] + sorted(glob.glob(CC + "/subagents/*.jsonl"))


# Camera helpers, run in the page. All positions are world units; the L0 fit is saved as __L0.
CAM_JS = r"""
window.__cam = {
  save() { const {camera, controls} = window.__rec; window.__L0 = { p: camera.position.clone(), t: controls.target.clone() }; return [camera.position.toArray(), controls.target.toArray()]; },
  set(p, t) { const {camera, controls, dirty} = window.__rec; camera.position.set(...p); controls.target.set(...t); controls.update(); dirty(); },
  get() { const {camera, controls} = window.__rec; return [camera.position.toArray(), controls.target.toArray()]; },
  label(text) {
    const {scene} = window.__rec; let hit = null;
    scene.traverse(o => { if (!hit && o.isCSS2DObject && o.element && o.element.textContent.includes(text)) hit = o; });
    if (!hit) return null; const v = new window.__rec.THREE.Vector3(); hit.getWorldPosition(v); return v.toArray();
  }
};
"""
