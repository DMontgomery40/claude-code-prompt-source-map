"""One filmed shot: a frame-stepped take on virtual time plus a JSON sidecar the edit reads.

  footage/<name>.mp4   (<name>_p at any other DPR: a preview) the take (60 fps, 3840x2160 at DPR 2), for reference; the edit reads the JPG frames
  footage/<name>.json  {"keys": [[frame, label]], "rects": {tag: {"f": frame, "r": [x0,y0,x1,y1]}},
                        "marks": {name: frame}, "dpr": 2, "n": frames}
                       keys: key presses for the key-cap overlay; rects: UI rows the edit boxes, in
                       source pixels; marks: named moments (typed, results, opened, ...) the edit and
                       the voiceover script line up with.

Run a shot file with `DPR=2 python3 <shots_file>.py <shot> [...]` (a preview is `DPR=1`).
"""
import json, os
from rec import Rec, FOOTAGE

DPR = float(os.environ.get("DPR", "2"))
W, H = 1920, 1080
FPS = 60
at = lambda t: int(round(t * FPS))  # seconds -> frame
LEAK_EVERY = 4   # frames between samples of where forbidden values sit on screen

# Text rect of `needle` inside the last element matching `sel` whose text contains it (CSS px).
RECT_JS = r"""([sel, needle, within]) => {
  const roots = [...document.querySelectorAll(sel)].filter(e => e.innerText && e.innerText.includes(needle));
  const root = within ? roots.find(e => e.innerText.includes(within)) || roots[0] : roots[roots.length - 1];
  if (!root) return null;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n; while ((n = tw.nextNode())) {
    const k = n.data.indexOf(needle); if (k < 0) continue;
    const rg = document.createRange(); rg.setStart(n, k); rg.setEnd(n, k + needle.length);
    const rs = [...rg.getClientRects()]; if (!rs.length) continue;
    const x0 = Math.min(...rs.map(r => r.left)), y0 = Math.min(...rs.map(r => r.top)), x1 = Math.max(...rs.map(r => r.right)), y1 = Math.max(...rs.map(r => r.bottom));
    return [x0, y0, x1, y1];
  }
  const b = root.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom];
}"""
# Box of the first element matching `sel` (whose text contains `needle`, if given).
ELEM_JS = r"""([sel, needle]) => { const e = [...document.querySelectorAll(sel)].find(e => !needle || (e.innerText || '').includes(needle)); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }"""


class Shot:
    def __init__(self, r, name):
        self.r, self.name, self.meta = r, name, {"keys": [], "rects": {}, "marks": {}, "dpr": DPR}
        self.tag = name if DPR == 2 else f"{name}_p"  # only a DPR 2 take is final; previews never replace it

    async def key(self, i, k, label=None):
        """Press a real key at frame i and log it for the key-cap overlay."""
        await self.r.page.keyboard.press(k)
        self.meta["keys"].append([i, label or k])

    async def type(self, i, text, show=False):
        """Type `text` (one key per call; the page shows it). show=True also logs the keys as caps."""
        for ch in text:
            await self.r.page.keyboard.press(ch)
            if show: self.meta["keys"].append([i, ch])

    def mark(self, name, i): self.meta["marks"][name] = i

    async def rect(self, tag, sel, needle, within=None, i=None):
        v = await self.r.js(RECT_JS, [sel, needle, within])
        if v: self.meta["rects"][tag] = {"f": i, "r": [round(c * DPR, 1) for c in v]}
        else: print("  rect miss:", tag, needle)

    async def elem(self, tag, sel, needle=None, i=None):
        v = await self.r.js(ELEM_JS, [sel, needle])
        if v: self.meta["rects"][tag] = {"f": i, "r": [round(c * DPR, 1) for c in v]}
        else: print("  elem miss:", tag, sel)

    async def redact_sample(self, i):
        """Log where forbidden values are on screen at frame i (source px); the edit blurs them.
        meta["leaks"] = [[frame, [[x0,y0,x1,y1], ...]], ...], a sample every LEAK_EVERY frames."""
        try:
            rs = await self.r.leak_rects()
        except Exception:   # a navigation replaced the document: reinstall the values
            self.r._leak_ready = False
            rs = await self.r.leak_rects()
        self.meta.setdefault("leaks", []).append([i, [[round(c * DPR, 1) for c in b] for b in rs]])

    async def run(self, frames, events=None, step_ms=None, per_extra=None):
        """Capture `frames` frames; events maps frame -> async fn(i) run just before that frame."""
        events = events or {}
        async def per(i):
            ev = events.get(i)
            if ev: await ev(i)
            if per_extra: await per_extra(i)
            if i % LEAK_EVERY == 0: await self.redact_sample(i)
        await self.r.shoot(self.tag, frames, per, step_ms=step_ms)
        self.meta["n"] = frames
        self.save()

    def save(self):
        json.dump(self.meta, open(os.path.join(FOOTAGE, self.tag + ".json"), "w"))


def rec(): return Rec(W, H, DPR)


async def setcam(r, p, t):
    await r.js("([p,t])=>window.__cam.set(p,t)", [p, t])


async def session(r, files, clean=False):
    """Load a session into Trace (virtual time on), save the fit camera, park the pointer."""
    from rec import CAM_JS
    await r.load(files)
    await r.js(CAM_JS)
    await r.js("window.__cam.save()")
    await r.js("()=>{ window.__insets0 = window.__insets0 || null; }")
    if clean: await r.clean()
    await r.page.mouse.move(W - 2, H - 2)


async def main_of(shots):
    """CLI: `python3 shots_x.py all` or a list of shot names."""
    import asyncio, sys
    names = list(shots) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for n in names:
        print("==", n, "dpr", DPR)
        await shots[n]()
