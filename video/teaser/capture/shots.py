"""Every shot in the demo. Run: python3 shots.py <shot> [<shot> ...]  (or `all`)."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, glob, subprocess, sys
from rec import Rec, cc_files, CAM_JS
from cam import path, orbit, ease_io, ease_out, ease_in_out_cubic

PEAK = 938  # main-thread request with the peak context (966,018 tokens)


def codex_files(pid=None):
    parent = glob.glob(f"{CODEX_SESSIONS}/**/*{pid or codex_thread()}.jsonl", recursive=True)
    kids = subprocess.run(["grep", "-rl", "--include=*.jsonl", f'"parent_thread_id":"{pid}"',
                           str(CODEX_SESSIONS)], capture_output=True, text=True).stdout.split()
    return parent + [k for k in kids if k not in parent]


async def setcam(r, p, t):
    await r.js("([p,t])=>window.__cam.set(p,t)", [p, t])


async def open_session(r, files, clean=False):
    await r.load(files)
    await r.js(CAM_JS)
    await r.js("window.__cam.save()")
    if clean:
        await r.clean()


# ---------- cinematic (chrome hidden) ----------

async def s_reveal():
    keys = [([-14, 9, 36], [28, 17, 0]),
            ([34, 24, 60], [90, 22, -6]),
            ([70, 85, 160], [110, 4, -35]),
            ([-45, 150, 205], [106, -6, -52])]
    async with Rec() as r:
        await open_session(r, cc_files(), clean=True)
        N = 330
        async def f(i):
            t = i / (N - 1)
            u = 0.18 * t + 0.82 * ease_io(t)  # already moving on frame 0
            await setcam(r, *path(keys, u))
        await r.shoot("s_reveal", N, f)


async def s_cliff():
    keys = [([70, 95, 170], [150, 8, -25]),
            ([150, 48, 105], [186, 14, -10]),
            ([163, 38, 76], [190, 15, -9]),
            ([168, 34, 66], [191, 16, -8])]
    async with Rec() as r:
        await open_session(r, cc_files(), clean=True)
        N = 210
        async def f(i):
            await setcam(r, *path(keys, ease_out(i / (N - 1))))
        await r.shoot("s_cliff", N, f)


async def s_endorbit():
    p0, t0 = [-45, 150, 205], [106, -6, -52]
    async with Rec() as r:
        await open_session(r, cc_files(), clean=True)
        N = 420
        async def f(i):
            await setcam(r, *orbit(p0, t0, -0.42 + 0.5 * i / (N - 1), zoom=1.05 - 0.08 * i / (N - 1)))
        await r.shoot("s_endorbit", N, f)


async def s_codex():
    async with Rec() as r:
        await open_session(r, codex_files(), clean=True)
        p0, t0 = [-50, 128, 196], [112, 0, -36]  # landscape spans x 0..222, z -86..13
        N = 240
        async def f(i):
            await setcam(r, *orbit(p0, t0, -0.34 + 0.36 * i / (N - 1), zoom=1.0 - 0.12 * ease_io(i / (N - 1))))
        await r.shoot("s_codex", N, f)


# ---------- product UI (as a user sees it) ----------

async def s_dive():
    async with Rec() as r:
        await open_session(r, cc_files())
        N = 340
        async def f(i):
            if i == 18:
                await r.js("p=>{const {S,set}=window.__trace; set({level:1, agentId:S.layout.root.id, reqIdx:p, stratum:null, block:null})}", PEAK)
            if i == 128:
                await r.js("()=>window.__trace.set({level:2})")
            if i == 232:
                await r.js("()=>window.__trace.set({level:3, stratum:'injected'})")
        await r.shoot("s_dive", N, f)


async def s_egress():
    async with Rec() as r:
        await open_session(r, cc_files())
        N = 250
        async def f(i):
            if i == 24:
                await r.page.keyboard.press("2")
            if i == 120:
                await r.page.click("#panel .items button >> nth=0")
                await r.page.mouse.move(r.w - 2, r.h - 2)
        await r.shoot("s_egress", N, f)
        # custody ladder, scrolled into view
        await r.js("()=>{const h=[...document.querySelectorAll('#panel h3, #panel h2')].find(x=>/Custody ladder/.test(x.textContent)); if(h) h.scrollIntoView({block:'start'})}")
        await r.step(4)
        await r.still("st_custody")


async def s_agents():
    async with Rec() as r:
        await open_session(r, cc_files())
        N = 130
        async def f(i):
            if i == 20:
                await r.page.keyboard.press("4")
        await r.shoot("s_agents", N, f)


async def stills():
    async with Rec() as r:
        await open_session(r, cc_files())
        # L0 "From your setup" list, scrolled to the CLAUDE.md row
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.scrollIntoView({block:'center'})}")
        await r.step(4)
        await r.still("st_setup_claudemd")
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('skills list (85)')); li.scrollIntoView({block:'center'})}")
        await r.step(4)
        await r.still("st_setup_skills")
        # open the CLAUDE.md block in the reader
        await r.js("()=>{const li=[...document.querySelectorAll('#panel li')].find(x=>x.innerText.includes('instructions file · ~/.claude/CLAUDE.md')); li.querySelector('button').click()}")
        await r.step(90)
        await r.still("st_reader_claudemd")
        # L1 asks
        await r.js("p=>{const {S,set}=window.__trace; set({level:1, agentId:S.layout.root.id, reqIdx:p, stratum:null, block:null})}", PEAK)
        await r.step(120)
        await r.still("st_asks")
        # agents lens
        await r.js("()=>window.__trace.set({level:0, agentId:null, reqIdx:null, stratum:null, block:null})")
        await r.page.keyboard.press("4")
        await r.step(90)
        await r.still("st_agents")
    async with Rec() as r:
        await open_session(r, codex_files())
        await r.step(30)
        await r.still("st_codex_ui")


SHOTS = {f.__name__: f for f in [s_reveal, s_cliff, s_endorbit, s_codex, s_dive, s_egress, s_agents, stills]}

if __name__ == "__main__":
    names = list(SHOTS) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for n in names:
        asyncio.run(SHOTS[n]())
