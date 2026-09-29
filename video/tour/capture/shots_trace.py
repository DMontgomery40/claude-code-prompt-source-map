"""Trace shots of the tour (rows 1, 5-8 and 13 of SCRIPT.md). Run: DPR=2 python3 shots_trace.py <shot> [...]  (or `all`).
DPR=1 makes a fast preview (<shot>_p outputs; a final is never replaced). Needs the viewer (viewer.py) on :8860.

Never press `h` or `c` and never click "Harness": the harness layer is not part of this video.
"""
import asyncio, math
from shot import Shot, rec, session, setcam, at, W, H, FPS, main_of, DPR
from rec import cc_files, VIEWER, NO_TRANSITIONS
from cam import path, orbit, ease_io, ease_out

# move the view up by px screen pixels (content moves down); camera and target together
LIFT_JS = r"""px => {
  const { camera, controls, THREE, dirty } = window.__rec;
  const D = camera.position.distanceTo(controls.target);
  const w = 2 * D * Math.tan(camera.fov / 2 * Math.PI / 180) / (camera.zoom * innerHeight) * px;
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion).multiplyScalar(w);
  camera.position.add(up); controls.target.add(up); controls.update(); dirty();
}"""
PAN_JS = "([id,i])=>window.__trace.scene.panToRequest(id,i)"


async def glide(r, x0, y0, x1, y1, i, n):
    """One frame of an eased pointer move from (x0,y0) to (x1,y1) over n frames (i = frame within the move)."""
    u = ease_io(min(1, max(0, i / max(1, n))))
    await r.page.mouse.move(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)


# ------------------------------------------------------------------------------------------------ shots

async def t_open():
    """The legend beat: the whole session as a 3D landscape, HUD hidden, a low flight along the main ridge that pulls out to the full view. 12 s."""
    keys = [([-20, 70, 110], [60, 20, -20]),
            ([18, 104, 140], [92, 16, -10]),
            ([52, 133, 168], [108, 10, 0])]
    async with rec() as r:
        await session(r, cc_files(), clean=True)
        s = Shot(r, "t_open")
        N = at(12)
        async def mv(i):
            await setcam(r, *path(keys, ease_io(i / (N - 1))))
        await s.run(N, {i: mv for i in range(N)})


async def t_loader():
    """The Trace loader (Choose files), the pointer goes to it, a click, the session opens as a landscape. 6.5 s."""
    async with rec() as r:
        pg = r.page
        await pg.goto(VIEWER + "/trace/?rec=1")
        await pg.add_style_tag(content=NO_TRANSITIONS)
        await pg.wait_for_timeout(800)
        await pg.mouse.move(1500, 900)
        await pg.evaluate("window.__vt.enable()")
        await r.step(20)
        s = Shot(r, "t_loader")
        box = await r.js("()=>{const b=[...document.querySelectorAll('button,label,a')].find(e=>/Choose files/.test(e.innerText)); const r=b.getBoundingClientRect(); return [r.left+r.width/2, r.top+r.height/2, r.left, r.top, r.right, r.bottom]}")
        await s.rect("choose", "button,label,a", "Choose files", None, 0)
        await s.rect("privacy", "*", "Session files stay on your device.", None, 0)
        files = cc_files()
        state = {"loaded": False, "click": None}
        async def click(i):
            state["click"] = i
            await pg.mouse.down(); await pg.mouse.up()
            s.meta["keys"].append([i, "click"])
        async def load(i):
            # the picker itself is a native dialog: hand the same files to the page's input, as the user's pick would
            await pg.set_input_files("#pick-files", files)
        ev = {}
        n_move = at(0.8)
        for k in range(n_move + 1):
            ev[at(0.5) + k] = (lambda k: (lambda i: glide(r, 1500, 900, box[0], box[1], k, n_move)))(k)
        ev[at(1.5)] = click
        ev[at(1.62)] = load
        # frames while the session parses (real time) and the landscape opens
        async def watch(i):
            if i > at(1.62) and not state["loaded"]:
                vis = await pg.evaluate("()=>{const a=document.querySelector('#app'); return !!a && !a.hidden}")
                if vis:
                    state["loaded"] = True; s.mark("opened", i)
                    await pg.mouse.move(W - 2, H - 2)
                    for tag, needle in [("dur", "1 d 4 h"), ("reqs", "1,656"), ("subs", "subagents, 3,994 requests")]:
                        await s.rect(tag, ".stats, #stats, .hud", needle, None, i)
        await s.run(at(7), ev, per_extra=watch)
        mode = await r.js("()=>window.__trace.S.mode")
        if mode != "3d": raise SystemExit(f"t_loader opened in {mode}, not 3d: retry (a viewer request was probably reset)")


REQ = 943
FLY_T = dict(land=0.35, pan=0.8, plus=[1.2, 1.9, 2.6, 3.3], lift0=5.4, lift1=7.2)
LIFT0 = -110
LAYER_JS = """()=>{const x=document.querySelector('.side').innerText.split('AT THE CENTER OF YOUR MAP')[1]||''; const m=x.match(/(Harness|Summary|You|Injected|Outside|Agents|Model): ≈ [\\d.k]+/); const q=x.match(/request (\\d+)/); return m?m[1]+' '+(q?q[1]:''):''}"""


def fly_pre(r, rid, s):
    """The flight in: Landmarks on, pan to the request, four zoom steps (each followed by a re-centre)."""
    kb = r.page.keyboard
    ev = {}
    async def landmarks(i): await s.key(i, "l", "l")
    async def pan(i): await r.js(PAN_JS, [rid, REQ])
    async def plus(i): await kb.press("+")
    ev[at(FLY_T["land"])] = landmarks
    ev[at(FLY_T["pan"])] = pan
    for t in FLY_T["plus"]:
        ev[at(t)] = plus
        ev[at(t) + 14] = pan
    return ev


async def calibrate_lift(rid):
    """The layer under the screen centre is read by the panel a moment after the camera moves, so the lift's
    stopping point is found once, ahead of the take: lift in small steps, hold each for 14 frames, and
    return the lift (px) that puts the middle of the Injected band at the centre. Deterministic on virtual time."""
    async with rec() as r:
        await session(r, cc_files())
        s = Shot(r, "cal")
        ev = fly_pre(r, rid, s)
        for i in range(at(FLY_T["lift0"])):
            if i in ev: await ev[i](i)
            await r.step(1)
        await r.js(LIFT_JS, LIFT0)
        y, first, last = LIFT0, None, None
        for k in range(80):
            await r.js(LIFT_JS, 4); y += 4
            await r.step(14)   # the panel reads the layer once the map has held for 180 ms
            lay = await r.js(LAYER_JS)
            if lay.startswith("Injected"):
                first = y if first is None else first; last = y
            elif first is not None: break
        if first is None: raise SystemExit("t_fly: the lift never reached the Injected layer")
        return (first + last) / 2


async def t_fly():
    """Overview, Landmarks on, flight to a request's Layers, lift up through the layers to Injected, open a block. 15 s (12 used)."""
    async with rec() as r0:
        await session(r0, cc_files())
        rid0 = await r0.js("()=>window.__trace.S.layout.root.id")
    LIFT1 = await calibrate_lift(rid0)
    print("  lift to", LIFT1)
    async with rec() as r:
        await session(r, cc_files())
        rid = await r.js("()=>window.__trace.S.layout.root.id")
        kb = r.page.keyboard
        s = Shot(r, "t_fly")
        ev = fly_pre(r, rid, s)
        L_A, L_B = at(FLY_T["lift0"]), at(FLY_T["lift1"])
        state = {"y": 0.0}
        async def lift(i):
            if i == L_A:
                await r.js(LIFT_JS, LIFT0); state["y"] = LIFT0
            u = ease_io(min(1, max(0, (i - L_A) / (L_B - L_A))))
            y = LIFT0 + (LIFT1 - LIFT0) * u
            await r.js(LIFT_JS, y - state["y"]); state["y"] = y
        for i in range(L_A, L_B + 1): ev[i] = lift
        async def note(i):
            lay = await r.js(LAYER_JS)
            print("   layer at note:", lay)
            if not lay.startswith("Injected"): raise SystemExit("t_fly: the lift did not stop on Injected: retry")
            await s.rect("layer_title", "#panel, .side", "Injected", None, i)
            await s.rect("from_setup", "#panel, .side", "From your setup", None, i)
            await s.elem("side", ".side", None, i)
            s.mark("injected", i)
        ev[L_B + 20] = note   # the panel reads the layer once the camera has held for 180 ms
        async def blockrect(i):
            v = await r.js("""()=>{const li=[...document.querySelectorAll('.side li, .side .block, .side [role=button], .side button')].find(x=>/MCP server instructions/.test(x.innerText)); if(!li) return null; const b=li.getBoundingClientRect(); return [b.left+b.width/2, b.top+30]}""")
            state["target"] = v
            if not v: raise SystemExit("t_fly: the MCP block is not in the panel: retry")
            await s.rect("block", ".side li, .side .block", "MCP server instructions", None, i)
        ev[L_B + 30] = blockrect
        M0 = L_B + 40; MN = at(0.7)
        async def move(i):
            if state.get("target"):
                await glide(r, W - 40, H - 40, state["target"][0], state["target"][1], i - M0, MN)
        for i in range(M0, M0 + MN + 1): ev[i] = move
        async def open_block(i):
            if state.get("target"):
                await r.page.mouse.down(); await r.page.mouse.up(); s.meta["keys"].append([i, "click"]); s.mark("opened", i)
        ev[M0 + MN + 4] = open_block
        async def opened(i):
            await s.elem("reader", ".side", None, i)
        ev[M0 + MN + 50] = opened
        async def column(i):   # the request column's own labels, once the stage has settled
            for tag, needle in [("col_title", "request 947 ·"), ("col_you", "You ≈"), ("col_harness", "Harness ≈"), ("col_injected", "Injected ≈")]:
                await s.rect(tag, "body", needle, None, i)
            s.mark("column", i)
        ev[M0 + MN + 110] = column
        await s.run(at(15), ev)


async def t_search():
    """/ Tab Tab Tab CLAUDE.md, Enter, n, n, then w. 11.5 s (10 used)."""
    async with rec() as r:
        await session(r, cc_files())
        await r.step(20)
        s = Shot(r, "t_search")
        ev = {}
        ev[at(0.30)] = lambda i: s.key(i, "/")
        for t in [0.75, 0.93, 1.11]:
            ev[at(t)] = lambda i: s.key(i, "Tab")
        for k, ch in enumerate("CLAUDE.md"):
            ev[at(1.30 + 0.09 * k)] = (lambda c: (lambda i: s.key(i, c, c)))(ch)
        async def results(i):
            await s.rect("row_meta", ".pal-row", "94×", None, i)
            await s.rect("row_count", ".pal-row", "94× · 91 agents", None, i)
            await s.elem("row_el", ".pal-row", "instructions file", i)
            await s.rect("row_title", ".pal-row", "instructions file", None, i)
            s.mark("results", i)
        ev[at(2.4)] = results
        async def enter(i): await s.key(i, "Enter"); s.mark("enter", i)
        ev[at(4.4)] = enter
        async def n1(i): await s.key(i, "n")
        async def n2(i): await s.key(i, "n")
        ev[at(5.4)] = n1
        ev[at(6.4)] = n2
        async def trail(i): await s.rect("trail", "#search-bar", "of 94", None, i)
        ev[at(7.0)] = trail
        async def widen(i): await s.key(i, "w"); s.mark("widen", i)
        ev[at(7.6)] = widen
        await s.run(at(11.5), ev)


async def t_lenses():
    """2 what left the machine (a deploy, its custody ladder), 3 where outside text came in, 4 subagents and a flight into one. 17 s (16 used)."""
    async with rec() as r:
        await session(r, cc_files())
        await r.step(20)
        s = Shot(r, "t_lenses")
        ev = {}
        async def two(i): await s.key(i, "2"); s.mark("two", i)
        async def meta(i):
            await s.rect("left", "#panel, .side", "Left the machine (96)", None, i)
            await s.rect("counts", "#panel, .side", "3 deploy · 1 send · 92 network", None, i)
        async def j(i): await s.key(i, "j")
        async def enter(i): await s.key(i, "Enter"); s.mark("deploy", i)
        async def scroll(i):
            await r.js("()=>{const h=[...document.querySelectorAll('.side *, #panel *')].find(x=>x.children.length===0 && /Custody ladder/.test(x.textContent)); if(h) h.scrollIntoView({block:'start'})}")
        async def ladder(i):
            await s.rect("asked", "#panel, .side", "Asked by", None, i)
            await s.rect("permitted", "#panel, .side", "permission mode: bypassPermissions", None, i)
            s.mark("ladder", i)
        async def three(i): await s.key(i, "3"); s.mark("three", i)
        async def four(i): await s.key(i, "4"); s.mark("four", i)
        async def look(i):
            await s.elem("panel", ".side", None, i)
        async def agent_next(i): await s.key(i, "]", "]")
        async def agent_go(i): await s.key(i, "Enter"); s.mark("agent", i)
        ev[at(0.4)] = two; ev[at(1.2)] = meta; ev[at(2.8)] = j; ev[at(3.2)] = enter
        ev[at(4.2)] = scroll; ev[at(4.35)] = ladder
        ev[at(7.6)] = three; ev[at(8.0)] = look
        ev[at(10.0)] = four; ev[at(10.4)] = look
        ev[at(12.2)] = agent_next; ev[at(12.8)] = agent_go
        await s.run(at(17), ev)


async def t_close():
    """Cinematic drift over the whole landscape for the end card. 9 s."""
    keys = [([160, 80, 170], [110, 15, -20]),
            ([104, 112, 168], [108, 12, -8]),
            ([52, 133, 168], [108, 10, 0])]
    async with rec() as r:
        await session(r, cc_files(), clean=True)
        s = Shot(r, "t_close")
        N = at(9)
        async def mv(i):
            await setcam(r, *path(keys, ease_io(i / (N - 1))))
        await s.run(N, {i: mv for i in range(N)})


SHOTS = {f.__name__: f for f in [t_open, t_loader, t_fly, t_search, t_lenses, t_close]}

if __name__ == "__main__":
    asyncio.run(main_of(SHOTS))
