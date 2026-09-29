"""Frame-stepped recorder for Trace.

The page runs on virtual time: performance.now and requestAnimationFrame are replaced, so each
captured frame advances exactly 1/FPS s no matter how long the screenshot takes. Camera flights,
stage animations and damping come out perfectly smooth.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from common import private_dir, cc_session, net_inputs, leak_values  # noqa: E402
import asyncio, glob, os, shutil, subprocess, time
from playwright.async_api import async_playwright

VIEWER = os.environ.get("TRACE_VIEWER", "http://127.0.0.1:8860")
SERVER = VIEWER + "/trace/?rec=1"
FPS = 60
FOOTAGE = private_dir("video", "tour", "footage")
FRAMES = private_dir("video", "tour", "frames")  # scratch; cleared with the session

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


# Screenshots carry no pointer, so the page draws one: an arrow that follows real mouse events, and a ring
# that opens on a press (its age comes from performance.now, i.e. virtual time). Parked in the bottom-right
# corner (where the shots park it) it is hidden.
CURSOR = r"""
(() => {
  let x = -100, y = -100, down = false, t0 = -1e9, el = null, ring = null;
  const build = () => {
    if (el || !document.documentElement) return;
    el = document.createElement("div");
    el.id = "__cur";
    el.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;display:none";
    el.innerHTML = '<svg width="34" height="42" viewBox="0 0 34 42" style="position:absolute;left:-2px;top:-2px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))"><path d="M4 3 L4 31 L11 25 L16 37 L21 35 L16 23 L26 23 Z" fill="#fff" stroke="#0b0f15" stroke-width="2.4" stroke-linejoin="round"/></svg>' +
      '<div id="__ring" style="position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;border:4px solid #c8f784;opacity:0;box-sizing:border-box"></div>';
    document.documentElement.appendChild(el);
    ring = el.querySelector("#__ring");
  };
  const place = () => {
    build(); if (!el) return;
    const parked = x >= innerWidth - 6 && y >= innerHeight - 6;
    el.style.display = parked || x < 0 ? "none" : "block";
    el.style.transform = `translate(${x}px,${y}px) scale(${down ? 0.9 : 1})`;
  };
  addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; place(); }, true);
  addEventListener("mousedown", e => { x = e.clientX; y = e.clientY; down = true; t0 = performance.now(); place(); }, true);
  addEventListener("mouseup", () => { down = false; place(); }, true);
  const tick = () => {
    requestAnimationFrame(tick);
    if (!ring) return;
    const a = (performance.now() - t0) / 420;
    if (a >= 0 && a < 1) { ring.style.opacity = String(0.9 * (1 - a)); ring.style.transform = `scale(${0.5 + 0.9 * a})`; }
    else ring.style.opacity = "0";
  };
  requestAnimationFrame(tick);
})();
"""

# Finds forbidden values in visible text and returns tight boxes around each occurrence (one per line box).
# The values are installed once per document; a navigation reinstalls them (Rec.leak_rects notices).
LEAK_INIT_JS = r"""vals => {
  const esc = v => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(vals.sort((a, b) => b.length - a.length).map(esc).join("|"), "g");
  // the part of r that is really on screen: cut by every scrolling or clipping ancestor, and the viewport
  const clip = (el, r) => {
    let [x0, y0, x1, y1] = [r.left, r.top, r.right, r.bottom];
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const st = getComputedStyle(e);
      if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0") return null;
      if (st.overflowX !== "visible" || st.overflowY !== "visible") {
        const b = e.getBoundingClientRect();
        x0 = Math.max(x0, b.left); y0 = Math.max(y0, b.top); x1 = Math.min(x1, b.right); y1 = Math.min(y1, b.bottom);
      }
    }
    x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, innerWidth); y1 = Math.min(y1, innerHeight);
    return x1 - x0 > 1 && y1 - y0 > 1 ? [x0, y0, x1, y1] : null;
  };
  window.__leakRects = () => {
    const out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const t = n.data; if (!t || t.length < 6) continue;
      re.lastIndex = 0; let m;
      while ((m = re.exec(t))) {
        const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        for (const r of rg.getClientRects()) { const c = clip(n.parentElement, r); if (c) out.push(c); }
      }
    }
    for (const el of document.querySelectorAll("input, textarea")) {
      re.lastIndex = 0;
      if (el.value && re.test(el.value)) { const b = el.getBoundingClientRect(); if (b.width) out.push([b.left, b.top, b.right, b.bottom]); }
    }
    return out;
  };
}"""

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
        await self.page.add_init_script(CURSOR)
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

    async def open(self, url, wait=".search-pill, #search-pill, body"):
        """A docs page (no session): load it, freeze transitions, start virtual time. The intro splash is skipped."""
        await self.page.goto(url)
        await self.page.add_style_tag(content=NO_TRANSITIONS)
        await self.page.wait_for_timeout(1200)
        await self.page.mouse.move(self.w - 2, self.h - 2)
        await self.page.evaluate("window.__vt.enable()")
        await self.step(30)

    async def leak_rects(self):
        """CSS-px boxes of every piece of on-screen text that holds a forbidden value (common.leak_values)."""
        if not getattr(self, "_leak_ready", False):
            await self.page.evaluate(LEAK_INIT_JS, leak_values())
            self._leak_ready = True
        return await self.page.evaluate("() => window.__leakRects()")

    async def leaks(self, where=""):
        """Fail loudly if a forbidden value is anywhere in the page text (docs and network shots)."""
        text = await self.page.evaluate("document.body.innerText")
        hits = [v[:6] + "…" for v in leak_values() if v in text]
        if hits: raise SystemExit(f"LEAK on {where}: {hits[:5]}")

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


def cc_files():
    CC = cc_session()
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
