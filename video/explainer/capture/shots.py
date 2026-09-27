"""Every shot in the explainer. Run: DPR=2 python3 shots.py <shot> [...]  (or `all`).

Each shot writes footage/<name>.mp4 and footage/<name>.json: the key presses (frame, key) for the
key-cap overlay, rects of UI text the edit highlights (source pixels), and for the playback shots
the pour point on screen per frame (source pixels) so the punch-in can follow it.
"""
import asyncio, json, os, sys
from rec import Rec, cc_files, CAM_JS, FOOTAGE
from cam import path, orbit, ease_io

DPR = float(os.environ.get("DPR", "2"))
W, H = 1920, 1080

# Text rect of `needle` inside the first element matching `sel` whose text contains it (CSS px).
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
ELEM_JS = r"""([sel, needle]) => { const e = [...document.querySelectorAll(sel)].find(e => !needle || (e.innerText || '').includes(needle)); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }"""
# The pour point: where the playhead's cut meets the root ridge, projected to CSS px (top of column and base).
POUR_JS = r"""() => {
  const sc = window.__trace.scene, g = sc.getGeometry(), S = window.__trace.S, a = S.trace.agents.find(x => x.kind === 'root');
  const ph = sc.getPlayhead(); const i = Math.max(0, Math.min(a.requests.length - 1, Math.floor(ph.agentP >= 0 ? ph.agentP : ph.P)));
  const cx = ph.cutX < 1e29 ? ph.cutX : g.x(a, i); const T = window.__rec.THREE, cam = window.__rec.camera;
  const pr = (y) => { const v = new T.Vector3(cx, y, g.z(a, i)).project(cam); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
  return { P: ph.P, top: pr(g.crest(a, i)), base: pr(0) };
}"""


class Shot:
    def __init__(self, r, name):
        self.r, self.name, self.meta = r, name, {"keys": [], "rects": {}, "pour": [], "dpr": DPR}

    async def key(self, i, k, label=None):
        await self.r.page.keyboard.press(k)
        self.meta["keys"].append([i, label or k])

    async def rect(self, tag, sel, needle, within=None, i=None):
        v = await self.r.js(RECT_JS, [sel, needle, within])
        if v: self.meta["rects"][tag] = {"f": i, "r": [round(c * DPR, 1) for c in v]}
        else: print("  rect miss:", tag, needle)

    async def elem(self, tag, sel, needle=None, i=None):
        v = await self.r.js(ELEM_JS, [sel, needle])
        if v: self.meta["rects"][tag] = {"f": i, "r": [round(c * DPR, 1) for c in v]}
        else: print("  elem miss:", tag, sel)

    async def run(self, frames, events=None, pour=False, step_ms=None):
        events = events or {}
        async def per(i):
            ev = events.get(i)
            if ev: await ev(i)
            if pour:
                p = await self.r.js(POUR_JS)
                self.meta["pour"].append([i, round(p["P"], 3)] + [round(c * DPR, 1) for c in p["top"] + p["base"]])
        await self.r.shoot(self.name, frames, per, step_ms=step_ms)
        json.dump(self.meta, open(os.path.join(FOOTAGE, self.name + ".json"), "w"))


async def session(r, clean=False):
    await r.load(cc_files())
    await r.js(CAM_JS)
    await r.js("window.__cam.save()")
    await r.js("()=>{ window.__insets0 = window.__insets0 || null; }")
    if clean: await r.clean()
    await r.page.mouse.move(W - 2, H - 2)


async def setcam(r, p, t):
    await r.js("([p,t])=>window.__cam.set(p,t)", [p, t])


def rec():
    return Rec(W, H, DPR)


LIFT_JS = r"""px => {  // move the view up by px screen pixels (content moves down), camera and target together
  const { camera, controls, THREE, dirty } = window.__rec;
  const D = camera.position.distanceTo(controls.target);
  const w = 2 * D * Math.tan(camera.fov / 2 * Math.PI / 180) / (camera.zoom * innerHeight) * px;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(w);
  camera.position.add(up); controls.target.add(up); controls.update(); dirty();
}"""


async def playback_setup(r, at, P0, extra_zoom=0, lift=0):
    """App camera at Layers on request `at`, Follow off, 1x, playhead at P0. Mouse parked, focus on the page."""
    kb = r.page.keyboard
    rid = await r.js("()=>window.__trace.S.layout.root.id")
    await r.js("P=>window.__trace.transport.seek(P)", at); await r.step(5)
    await r.js("([id,i])=>window.__trace.scene.panToRequest(id,i)", [rid, at]); await r.step(10)
    for _ in range(10):
        if "Layers" in await r.js("()=>document.querySelector('#zoom-status').innerText"): break
        await kb.press("+"); await r.step(8)
    await r.js("([id,i])=>window.__trace.scene.panToRequest(id,i)", [rid, at])
    for _ in range(extra_zoom):
        await kb.press("+"); await r.step(20)
        await r.js("([id,i])=>window.__trace.scene.panToRequest(id,i)", [rid, at]); await r.step(10)
    await kb.press("f"); await kb.press("<"); await kb.press("<")
    if lift: await r.js(LIFT_JS, lift)
    await r.js("P=>window.__trace.transport.seek(P)", P0)
    await r.js("()=>document.activeElement && document.activeElement.blur()")
    await r.page.mouse.move(W - 2, H - 2)
    await r.step(90)
    return rid


# ---------------------------------------------------------------- shots

async def s_open():
    """Full UI at the session overview, a slow push in. 11.9 s."""
    async with rec() as r:
        await session(r)
        await r.step(30)
        p0, t0 = await r.js("()=>window.__cam.get()")
        s = Shot(r, "s_open")
        for tag, needle in [("requests", "1,656"), ("subagents", "90")]:
            await s.rect(tag, ".stats", needle)
        await s.elem("lens_context", "#lenses button", "What filled")
        await s.elem("lens_egress", "#lenses button", "left the machine")
        await s.elem("stats", "#stats")
        N = 714
        async def mv(i):
            u = ease_io(i / (N - 1))
            await setcam(r, *orbit(p0, t0, -0.10 + 0.16 * u, zoom=1.0 - 0.10 * u))
        await s.run(N, {i: mv for i in range(N)})


async def s_axes():
    """Cinematic: the whole main ridge from above and in front, trucking right. Time reads left to right, height is context. 10.9 s."""
    keys = [([46, 133, 168], [106, 10, 0]),
            ([58, 128, 160], [116, 11, -1]),
            ([70, 123, 152], [126, 12, -2])]
    async with rec() as r:
        await session(r, clean=True)
        s = Shot(r, "s_axes")
        N = 654
        async def mv(i):
            await setcam(r, *path(keys, ease_io(i / (N - 1))))
        await s.run(N, {i: mv for i in range(N)})


async def s_pour():
    """Real playback at 1x through a dense stretch before the third compaction: grains pour, the sweep climbs. 9.2 s."""
    async with rec() as r:
        await session(r)
        await playback_setup(r, 1344, 1328.55)
        s = Shot(r, "s_pour")
        async def play(i): await s.key(i, " ", "Space")
        await s.run(552, {12: play}, pour=True)


async def s_crush():
    """Already playing at 1x into the third compaction: the 969k column collapses, the survivors pour out. 7.8 s."""
    async with rec() as r:
        await session(r)
        await playback_setup(r, 1387, 1386.55, lift=130)
        await r.page.keyboard.press(" ")
        await r.step(20)
        s = Shot(r, "s_crush")
        # Native slow motion (1/2 speed) while the column collapses: P 1387.68..1388.02. The frames in slow
        # motion are logged so the edit can label them.
        slow = {"on": False}
        async def watch(i):
            P = await r.js("()=>window.__trace.scene.getPlayhead().P")
            on = 1387.68 <= P <= 1388.02
            if on != slow["on"]: s.meta.setdefault("slow", []).append([i, on]); slow["on"] = on
        s.meta["slow"] = []
        async def ev(i):
            await watch(i)
            if i == 260: await s.rect("pill", ".labels", "969k → 89k", None, i)
        await s.run(520, {i: ev for i in range(520)}, pour=True, step_ms=lambda i: 1000 / 60 / (2 if slow["on"] else 1))


async def s_search():
    """/ Tab Tab Tab CLAUDE.md, Enter, n, n, then w: wide reader. 14.5 s (search 10.4 s + widen 4.1 s)."""
    async with rec() as r:
        await session(r)
        await r.step(30)
        s = Shot(r, "s_search")
        ev = {}
        def at(t): return int(round(t * 60))
        ev[at(0.30)] = lambda i: s.key(i, "/")
        for k, t in enumerate([0.85, 1.05, 1.25]):
            ev[at(t)] = lambda i: s.key(i, "Tab")
        for k, ch in enumerate("CLAUDE.md"):
            ev[at(1.45 + 0.12 * k)] = (lambda c: (lambda i: s.key(i, c, c)))(ch)
        async def results(i):
            await s.rect("row_meta", ".pal-row", "94×", None, i)
            await s.rect("row_count", ".pal-row", "94× · 91 agents", None, i)
            await s.elem("row_el", ".pal-row", "instructions file", i)
            await s.rect("row_title", ".pal-row", "instructions file", None, i)
            await s.key(i, "Enter")
        ev[at(5.55)] = results
        async def n1(i):
            await s.key(i, "n")
        async def n2(i):
            await s.key(i, "n")
        ev[at(6.55)] = n1
        ev[at(8.05)] = n2
        async def trail(i):
            await s.rect("trail", "#search-bar", "of 94", None, i)
        ev[at(9.0)] = trail
        async def widen(i):
            await s.key(i, "w")
        ev[at(10.9)] = widen
        await s.run(at(14.5), ev)


async def s_setup():
    """The main thread's setup list, wide panel, scrolled to the CLAUDE.md row. 6.5 s."""
    async with rec() as r:
        await session(r)
        await r.page.keyboard.press("w"); await r.step(20)
        await r.js("()=>{const d=[...document.querySelectorAll('#panel details')].find(x=>x.innerText.includes('Your instructions')); if(d) d.open=true;}")
        await r.step(10)
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.scrollIntoView({block:'center'})}")
        await r.page.mouse.move(W - 2, H - 2)
        await r.step(20)
        s = Shot(r, "s_setup")
        await s.rect("dupe", "#panel li", "sent again 2×, identical while a copy was still in context", "~/.claude/CLAUDE.md")
        await s.rect("row", "#panel li", "instructions file · ~/.claude/CLAUDE.md", "~/.claude/CLAUDE.md")
        await s.rect("sent6", "#panel li", "sent 6×", "~/.claude/CLAUDE.md")
        await s.run(390)


async def s_egress():
    """2: what left the machine; j, Enter opens the first deploy; the panel scrolls to its custody ladder. 7 s."""
    async with rec() as r:
        await session(r)
        await r.step(30)
        s = Shot(r, "s_egress")
        ev = {}
        async def two(i):
            await s.key(i, "2")
        async def meta(i):
            await s.rect("left", "#panel", "Left the machine (96)", None, i)
            await s.rect("counts", "#panel", "3 deploy · 1 send · 92 network", None, i)
        async def j(i): await s.key(i, "j")
        async def enter(i): await s.key(i, "Enter")
        async def scroll(i):
            await r.js("()=>{const h=[...document.querySelectorAll('#panel *')].find(x=>x.children.length===0 && /Custody ladder/.test(x.textContent)); if(h) h.scrollIntoView({block:'start'})}")
        async def ladder(i):
            await s.rect("asked", "#panel", "Asked by", None, i)
            await s.rect("permitted", "#panel", "permission mode: bypassPermissions", None, i)
        ev[24] = two; ev[80] = meta; ev[114] = j; ev[144] = enter; ev[196] = scroll; ev[200] = ladder
        await s.run(420, ev)


async def s_agents():
    """4: subagents, spend and return. 8 s."""
    async with rec() as r:
        await session(r)
        await r.step(30)
        s = Shot(r, "s_agents")
        async def four(i): await s.key(i, "4")
        async def row(i):
            await s.rect("advisor", "#panel", "advisor (claude-opus-5-5)", None, i)
            await s.rect("fresh", "#panel", "7.3M", None, i)
        await s.run(480, {18: four, 60: row})


async def s_keys():
    """1 2 3 4 1: every view is one key away; then ?: the shortcut sheet. 5 s."""
    async with rec() as r:
        await session(r)
        await r.step(30)
        s = Shot(r, "s_keys")
        async def q(i): await s.key(i, "?")
        ev = {138: q}
        for f, k in [(18, "1"), (42, "2"), (66, "3"), (90, "4"), (114, "1")]:
            ev[f] = (lambda k: (lambda i: s.key(i, k)))(k)
        await s.run(300, ev)


async def s_close():
    """Cinematic orbit of the whole landscape for the end card. 10.5 s."""
    p0, t0 = [-45, 150, 205], [106, -6, -52]
    async with rec() as r:
        await session(r, clean=True)
        s = Shot(r, "s_close")
        N = 630
        async def mv(i):
            await setcam(r, *orbit(p0, t0, -0.30 + 0.42 * i / (N - 1), zoom=1.02 - 0.10 * ease_io(i / (N - 1))))
        await s.run(N, {i: mv for i in range(N)})


SHOTS = {f.__name__: f for f in [s_open, s_axes, s_pour, s_crush, s_search, s_setup, s_egress, s_agents, s_keys, s_close]}

if __name__ == "__main__":
    names = list(SHOTS) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for n in names:
        print("==", n, "dpr", DPR)
        asyncio.run(SHOTS[n]())
