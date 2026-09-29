"""The network-layer shots of the tour (rows 9 to 12 of SCRIPT.md), filmed on a small captured Claude Code run.

  DPR=2 python3 shots_net.py n_attach n_lens n_wire n_docs      (or `all`; DPR=1 makes `<shot>_p` previews)

Needs the viewer (`python3 viewer.py`, :8860) and the run's session log and HAR:
  TRACE_NET_CC_SESSION=<session .jsonl>  TRACE_NET_CC_HAR=<its .har>      (see video/common.py)

Every shot ends by asking Rec.leaks(): a private value anywhere in the page text stops the take. The lens and
the wire card only ever show kinds, hosts, counts and fingerprints, never values; the gate checks that.
The harness layer is never touched: no `h`, no `c`, no "Harness" button, no "What was injected at this point?".
"""
import asyncio, os
from shot import Shot, rec, session, setcam, at, main_of, W, H, FPS
from rec import Rec, NO_TRANSITIONS
from common import net_inputs
from cam import orbit, ease_io

ease = ease_io

# Where a panel scroll should land: the heading (or selector) `key`, `offset` px below the top of the scroller.
# Returns [scrollTop now, scrollTop wanted] or null.
SCROLL_TARGET_JS = r"""([kind, key, offset]) => {
  const p = document.querySelector('#panel');
  const e = kind === 'h' ? [...p.querySelectorAll('h2,h3,h4')].find(x => x.innerText.startsWith(key)) : p.querySelector(key);
  if (!e) return null;
  const want = p.scrollTop + e.getBoundingClientRect().top - p.getBoundingClientRect().top - offset;
  return [p.scrollTop, Math.max(0, Math.min(want, p.scrollHeight - p.clientHeight))];
}"""
SET_SCROLL_JS = "v => { document.querySelector('#panel').scrollTop = v; }"
HIDE_STATUS_JS = "()=>{const s=document.getElementById('net-status'); if(s) s.hidden=true}"
# The success note steps aside after 9 s of REAL time, which at 4K is a few frames of footage: keep it up.
KEEP_TOAST_JS = "()=>{const st=window.setTimeout; window.setTimeout=(f,d,...a)=> d===9000 ? 0 : st(f,d,...a);}"
# The docs pages open with a splash that leaves by a real timer; a filmed landing never shows it.
NO_INTRO_JS = "()=>{document.getElementById('intro')?.remove()}"
# The source map's reveal highlight fades on real timers (2.6 s, then 9 s), a few frames of footage at 4K: keep it lit.
# Installed on every document of the shot, since the reveal runs the moment a page loads.
KEEP_HIGHLIGHT_INIT = "(()=>{const st=window.setTimeout; window.setTimeout=(f,d,...a)=> (d===2600||d===9000) ? 0 : st(f,d,...a);})()"


class Plan:
    """Timed actions and eased panel scrolls for one shot, played frame by frame on virtual time."""

    def __init__(self, r, s):
        self.r, self.s, self.acts, self.tweens = r, s, {}, []

    def do(self, t, fn):
        """Run async fn(i) just before the frame at t seconds."""
        self.acts.setdefault(at(t), []).append(fn)

    def scroll(self, t, dur, key, offset=14, kind="h"):
        """Ease the panel so heading (or selector) `key` sits `offset` px under the scroller's top."""
        async def start(i):
            v = await self.r.js(SCROLL_TARGET_JS, [kind, key, offset])
            if v is None: print("  scroll miss:", key); return
            self.tweens.append((i, at(dur), v[0], v[1]))
        self.do(t, start)

    async def tick(self, i):
        for fn in self.acts.get(i, []):
            await fn(i)
        for f0, n, a, b in list(self.tweens):
            if f0 <= i <= f0 + n:
                await self.r.js(SET_SCROLL_JS, a + (b - a) * ease(min(1.0, (i - f0) / max(1, n))))
            elif i > f0 + n:
                self.tweens.remove((f0, n, a, b))

    def events(self, frames):
        return {i: self.tick for i in range(frames)}


async def leak(r, where):
    await r.leaks(where)


# ---------------------------------------------------------------- n_attach
CENTER_JS = r"""([sel, needle]) => { const e = [...document.querySelectorAll(sel)].find(e => !needle || (e.innerText || '').includes(needle)); if (!e) return null; const b = e.getBoundingClientRect(); return [(b.left + b.right) / 2, (b.top + b.bottom) / 2]; }"""


async def n_attach():
    """The small session, then "+ Network capture": the card that says what a capture is and how to record one,
    "Choose a .har file…", the capture attaches, "Open What went over the wire". 13 s."""
    files = net_inputs("cc")
    session_files, har = files[:-1], files[-1]
    async with rec() as r:
        await session(r, session_files)
        await r.js(HIDE_STATUS_JS)
        await r.js(KEEP_TOAST_JS)
        p0, t0 = await r.js("()=>window.__cam.get()")
        N = at(13.0)
        s = Shot(r, "n_attach")
        plan = Plan(r, s)
        pos = {"xy": (1450.0, 620.0)}

        async def look(i):  # a slow drift keeps the small landscape alive
            u = ease(i / (N - 1))
            await setcam(r, *orbit(p0, t0, -0.05 + 0.10 * u, zoom=1.0 - 0.05 * u))

        def glide(t0s, dur, sel, needle=None):
            st = {}
            async def start(i):
                st["a"] = pos["xy"]
                st["b"] = await r.js(CENTER_JS, [sel, needle])
                if not st["b"]: raise SystemExit(f"n_attach: nothing to point at: {sel} {needle}")
            plan.do(t0s, start)
            n = at(dur)
            for k in range(1, n + 1):
                async def mv(i, k=k):
                    e = ease(k / n)
                    x = st["a"][0] + (st["b"][0] - st["a"][0]) * e; y = st["a"][1] + (st["b"][1] - st["a"][1]) * e
                    pos["xy"] = (x, y); await r.page.mouse.move(x, y)
                plan.acts.setdefault(at(t0s) + k, []).append(mv)

        async def before(i):
            await s.elem("add", "#add-capture", None, i)
            await s.elem("lenses", "#lenses", None, i)
            s.mark("before", i)
        async def appear(i): await r.page.mouse.move(*pos["xy"])
        async def click_add(i):
            await r.page.mouse.down(); await r.page.mouse.up()
            s.meta["keys"].append([i, "click"]); s.mark("click", i)
        async def help_rects(i):
            await s.elem("help", "#net-help", None, i)
            await s.rect("help_what", "#net-help p", "A capture is the session's traffic", None, i)
            await s.elem("help_cmd", "#net-help .path", None, i)
            await s.elem("choose", "#net-help button", "Choose a .har", i)
            s.mark("help", i)
        async def choose(i):
            s.mark("choose", i)
            async with r.page.expect_file_chooser() as fc:
                await r.page.mouse.down(); await r.page.mouse.up()
            await (await fc.value).set_files(har)
            for _ in range(600):  # real time: the worker parses the capture (the page CSP rules out wait_for_function)
                if await r.js("()=>document.querySelector('#net-status')?.dataset.kind") == "ok": break
                await r.page.wait_for_timeout(100)
            else:
                raise SystemExit("the capture was not attached in 60 s")
            s.mark("attached", i)
        async def after(i):
            await s.elem("toast", "#net-status", None, i)
            await s.rect("toast_text", "#net-status", "Network capture attached", None, i)
            await s.elem("help_head", "#net-help .net-help-head", None, i)
            await s.elem("open5", "#net-help button", "What went over the wire", i)
            await s.elem("lens5", "#lenses button", "went over the wire", i)
            await leak(r, "n_attach")
        async def open5(i):
            await r.page.mouse.down(); await r.page.mouse.up()
            s.mark("lens5", i)
        async def done(i):
            await r.page.mouse.move(W - 2, H - 2)
            await leak(r, "n_attach end")

        plan.do(0.0, before)
        plan.do(0.6, appear)
        glide(0.6, 0.8, "#add-capture")
        plan.do(1.5, click_add)
        plan.do(1.75, help_rects)
        glide(4.6, 0.7, "#net-help button", "Choose a .har")
        plan.do(5.4, choose)
        plan.do(5.6, after)
        glide(8.0, 0.6, "#net-help button", "What went over the wire")
        plan.do(8.7, open5)
        plan.do(9.4, done)
        ev = plan.events(N)
        for i in range(N):  # the camera drifts on every frame, beside the plan's own actions
            async def both(i, f=ev[i]):
                await look(i)
                await f(i)
            ev[i] = both
        await s.run(N, ev)


# ---------------------------------------------------------------- n_lens

async def n_lens():
    """5, w, then the lens: model calls, sensitive data in transit, endpoints, flags, client_data. 23 s (each
    section holds 2.2 to 2.8 s; the marks say where they start)."""
    async with rec() as r:
        await session(r, net_inputs("cc"))
        await r.js(HIDE_STATUS_JS)
        N = at(23.0)
        s = Shot(r, "n_lens")
        plan = Plan(r, s)
        kb = r.page.keyboard

        async def five(i): await s.key(i, "5"); s.mark("lens", i)
        async def calls(i):
            await s.elem("calls_h", "#panel h3", "Model calls", i)
            await s.rect("calls_title", "#panel h3", "Model calls: 4 in your log", None, i)
            await s.elem("source_line", "#panel .net-source", None, i)
            await leak(r, "n_lens:calls")
        async def wide(i): await s.key(i, "w"); s.mark("wide", i)
        async def sens(i):
            s.mark("sens", i)
            await s.elem("sens_h", "#panel h3", "Sensitive data in transit", i)
            await s.elem("sens_rules", "#panel .net-rules", None, i)
            await s.rect("sens_count", "#panel p.meta", "credential and", None, i)
            await leak(r, "n_lens:sens")
        async def twohosts(i):
            s.mark("twohosts", i)
            await s.elem("warnline", "#panel .warnline", None, i)
            await s.elem("flagged_row", "#panel .net-transit.flagged", None, i)
            await leak(r, "n_lens:twohosts")
        async def endpoints(i):
            s.mark("endpoints", i)
            await s.elem("roles", "#panel .net-roles", None, i)
            await leak(r, "n_lens:endpoints")
        async def flags_scrolled(i):
            s.mark("flags", i)
            await s.elem("flags_h", "#panel h3", "Flags & experiments", i)
            await s.elem("flag_search", "#panel .net-flag-search", None, i)
            await leak(r, "n_lens:flags_all")  # all 728 rows are in the page before the filter narrows them
        async def click_search(i):
            await r.page.click(".net-flag-search")
        def typer(ch):
            async def f(i): await kb.press(ch)
            return f
        async def flags_filtered(i):
            s.mark("flags_filtered", i)
            await s.elem("flag_table", "#panel .net-flags", None, i)
            await s.rect("flag_count", "#panel p.note", "of 728 flags", None, i)
            await s.elem("flag_link", "#panel a.net-doc", "tengu_cedar_lantern", i)
            await leak(r, "n_lens:flags")
        async def client(i):
            s.mark("client_data", i)
            await s.elem("client_json", "#panel .net-json", None, i)
            await leak(r, "n_lens:client_data")
        async def leave_search(i):
            await r.js("()=>document.activeElement && document.activeElement.blur()")
            await r.page.mouse.move(W - 2, H - 2)

        plan.do(0.4, five)
        plan.do(1.2, calls)
        plan.do(2.9, wide)
        plan.scroll(3.6, 1.0, "Sensitive data in transit", offset=10)
        plan.do(4.9, sens)
        plan.scroll(7.2, 0.9, ".warnline", offset=120, kind="s")
        plan.do(8.4, twohosts)
        plan.scroll(10.9, 0.9, "Endpoints by role", offset=10)
        plan.do(12.0, endpoints)
        plan.scroll(14.0, 0.9, "Flags &", offset=10)
        plan.do(15.0, flags_scrolled)
        plan.do(15.1, click_search)
        for k, ch in enumerate("cedar"):
            plan.do(15.4 + 0.16 * k, typer(ch))
        plan.do(16.4, leave_search)
        plan.do(16.5, flags_filtered)
        plan.scroll(19.2, 0.8, "client_data", offset=10)
        plan.do(20.2, client)
        await s.run(N, plan.events(N))


# ---------------------------------------------------------------- n_wire

async def n_wire():
    """Lens 5 already open and wide. Click the main thread's first model call: the request opens, its "On the wire"
    card is scrolled through: system blocks (the billing header), tools as sent, what is on the wire and not in
    the log, the sensitive data sent with the call. 19.4 s."""
    async with rec() as r:
        await session(r, net_inputs("cc"))
        await r.js(HIDE_STATUS_JS)
        kb = r.page.keyboard
        await kb.press("5"); await r.step(20)
        await kb.press("w"); await r.step(30)
        await r.page.mouse.move(W - 2, H - 2)
        N = at(19.4)
        s = Shot(r, "n_wire")
        plan = Plan(r, s)

        async def before(i):
            await s.elem("first_call", "#panel .items .item", "main", i)
        async def click(i):
            s.mark("click", i)
            await r.page.click("#panel .items .item:has-text('12:16 pm main')")
            await r.page.mouse.move(W - 2, H - 2)
        async def opened(i):
            s.mark("opened", i)
            await s.elem("card", "#panel .net-card", None, i)
            await s.rect("reqid", "#panel .net-card", "joined by request-id", None, i)
            await leak(r, "n_wire:opened")
        async def blocks(i):
            s.mark("blocks", i)
            await s.elem("billing", "#panel .net-blocks li.billing", None, i)
            await s.elem("blocks", "#panel .net-blocks", None, i)
            await leak(r, "n_wire:blocks")
        async def tools(i):
            s.mark("tools", i)
            await s.elem("tools", "#panel .net-tools", None, i)
            await leak(r, "n_wire:tools")
        async def notlog(i):
            s.mark("notlog", i)
            await s.rect("midsys", "#panel .net-list li", "mid-conversation system message", None, i)
            await s.rect("tooladd", "#panel .net-list li", "tool_addition parts", None, i)
            await s.rect("harness_sent", "#panel dd", "chars of system blocks", None, i)
            await leak(r, "n_wire:notlog")
        async def sensitive(i):
            s.mark("sensitive", i)
            await s.elem("sens_list", "#panel .net-list", "authorization", i)
            await leak(r, "n_wire:sensitive")

        plan.do(0.0, before)
        plan.do(0.6, click)
        plan.scroll(2.4, 0.9, "On the wire", offset=6)
        plan.do(3.5, opened)
        plan.scroll(5.2, 0.8, "System blocks as sent", offset=14)
        plan.do(6.3, blocks)
        plan.scroll(8.9, 0.7, "Tools as sent", offset=14)
        plan.do(9.8, tools)
        plan.scroll(11.6, 0.8, "On the wire, not in the log", offset=14)
        plan.do(12.6, notlog)
        plan.scroll(15.6, 0.8, "Sensitive data sent with this call", offset=14)
        plan.do(16.6, sensitive)
        await s.run(N, plan.events(N))


# ---------------------------------------------------------------- n_docs

async def n_docs():
    """Flags filtered to "cedar" in the lens; click tengu_cedar_lantern: the source map opens with it searched,
    and the undocumented prompt whose condition it decides. Enter opens that entry. 11 s."""
    async with rec() as r:
        await r.page.add_init_script(KEEP_HIGHLIGHT_INIT)
        await session(r, net_inputs("cc"))
        await r.js(HIDE_STATUS_JS)
        kb = r.page.keyboard
        await kb.press("5"); await r.step(20)
        await kb.press("w"); await r.step(30)
        await r.js(SET_SCROLL_JS, (await r.js(SCROLL_TARGET_JS, ["h", "Flags &", 10]))[1]); await r.step(5)
        await r.page.click(".net-flag-search")
        for ch in "cedar": await kb.press(ch)
        await r.js("()=>document.activeElement && document.activeElement.blur()")
        await r.page.mouse.move(W - 2, H - 2)
        await r.step(10)
        N = at(12.5)
        s = Shot(r, "n_docs")
        plan = Plan(r, s)

        async def after_nav(where):
            await r.page.add_style_tag(content=NO_TRANSITIONS)
            await r.js(NO_INTRO_JS)
            await r.page.evaluate("window.__vt.enable()")
            await r.step(30)
            await r.page.mouse.move(W - 2, H - 2)
            await r.leaks(where)

        async def hover(i):
            s.mark("hover", i)
            await s.elem("flag_row", "#panel .net-flags tr:not([hidden])", "tengu_cedar_lantern", i)
            await s.elem("flag_link", "#panel a.net-doc", "tengu_cedar_lantern", i)
            await r.page.hover("#panel a.net-doc:text-is('tengu_cedar_lantern')")
        async def click(i):
            s.mark("click", i)
            async with r.page.expect_navigation(wait_until="load"):
                await r.page.click("#panel a.net-doc:text-is('tengu_cedar_lantern')")
            await after_nav("n_docs:landing")
            await r.page.wait_for_selector(".ds-pal .ds-row", timeout=30000)
            await r.step(20)
            s.mark("landing", i)
            await s.elem("palette", ".ds-pal", None, i)
        async def landing(i):
            await s.elem("result", ".ds-row", "act_dont_rederive", i)
            await s.rect("when", ".ds-preview", "tengu_cedar_lantern", None, i)
        async def enter(i):
            s.mark("enter", i)
            try:
                async with r.page.expect_navigation(wait_until="load", timeout=15000):
                    await s.key(i, "Enter")
                await after_nav("n_docs:entry")
                s.mark("entry", i)
                await s.elem("entry", ".ds-target", None, i)
                await s.rect("entry_when", ".ds-target", "tengu_cedar_lantern", None, i)
            except Exception as e:
                print("  Enter did not navigate:", str(e)[:120])

        plan.do(0.0, hover)
        plan.do(1.3, click)
        plan.do(2.6, landing)
        plan.do(5.4, enter)
        await s.run(N, plan.events(N))


SHOTS = {f.__name__: f for f in [n_attach, n_lens, n_wire, n_docs]}

if __name__ == "__main__":
    asyncio.run(main_of(SHOTS))
