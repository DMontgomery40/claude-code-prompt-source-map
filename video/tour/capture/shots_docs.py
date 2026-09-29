"""The docs shots of the tour: the landing page, the two source maps' ⌘K search, and What wins.

Run: DPR=2 python3 shots_docs.py d_cc_search d_cx_search d_wins   (or `all`; DPR=1 is a preview)
Needs the viewer on :8860 (`python3 viewer.py`).

Docs pages are plain pages, so the recorder's virtual clock alone does not freeze them. This file adds, per
document (an init script that runs after the recorder's own):
  * the home intro splash is removed before it paints (the page keeps it for first-time visitors);
  * transitions and animations are off (the recorder's NO_TRANSITIONS);
  * setTimeout runs on the virtual clock, so the landing's outline fade and highlight clear (2.6 s / 11.6 s
    after arriving, palette.js) happen at the same video time on every take.
A palette result on another page is a real navigation; the shot stays continuous across it (the page object
persists, the virtual clock is re-enabled once the destination has loaded and revealed its target).

Besides the Shot sidecar (keys, rects, marks) the docs shots log the pointer, because screenshots do not
draw it: meta["mouse"] = [[frame, x, y]] and meta["clicks"] = [frame] in source pixels, so the edit can
draw a cursor and a click ripple.
"""
import asyncio
from shot import Shot, rec, at, main_of, DPR, W, H
from rec import NO_TRANSITIONS, VIEWER

DOCS_INIT = r"""
(() => {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("intro")?.remove();
    const s = document.createElement("style"); s.textContent = %s; document.head.append(s);
  });
  let now = 0, id = 5e6, timers = [];
  const realClear = window.clearTimeout.bind(window);
  window.setTimeout = (cb, ms, ...a) => { if (typeof cb !== "function") return 0; const i = ++id; timers.push({ i, at: now + Math.max(0, Number(ms) || 0), cb, a }); return i; };
  window.clearTimeout = i => { if (i > 5e6) timers = timers.filter(t => t.i !== i); else realClear(i); };
  const run = () => {
    for (let guard = 0; guard < 10000; guard++) {
      let k = -1;
      for (let j = 0; j < timers.length; j++) if (timers[j].at <= now && (k < 0 || timers[j].at < timers[k].at)) k = j;
      if (k < 0) return;
      const [t] = timers.splice(k, 1);
      try { t.cb(...t.a); } catch (e) { console.error(e); }
    }
  };
  const step = window.__vt.step;
  window.__vt.step = ms => { step(ms); now += ms; run(); };
})();
""" % repr(NO_TRANSITIONS)


class Timeline:
    """Several things can happen on one frame; they run in the order they were added."""
    def __init__(self): self.ev = {}
    def at(self, f, fn): self.ev.setdefault(f, []).append(fn)
    def events(self):
        def mk(fs):
            async def go(i):
                for fn in fs: await fn(i)
            return go
        return {f: mk(fs) for f, fs in self.ev.items()}


class Pointer:
    """A visible pointer for the edit: eased glides and clicks, logged in source pixels."""
    def __init__(self, s, tl):
        self.s, self.tl, self.pos = s, tl, (W - 2.0, H - 2.0)
        s.meta["mouse"], s.meta["clicks"] = [], []

    def glide(self, f0, n, getxy):
        """From frame f0 over n frames, move to the point getxy() reports when the glide starts."""
        st = {}
        async def start(i): st["a"], st["b"] = self.pos, await getxy()
        self.tl.at(f0, start)
        for k in range(1, n + 1):
            u = k / n; e = u * u * (3 - 2 * u)
            async def mv(i, e=e):
                x = st["a"][0] + (st["b"][0] - st["a"][0]) * e
                y = st["a"][1] + (st["b"][1] - st["a"][1]) * e
                self.pos = (x, y)
                await self.s.r.page.mouse.move(x, y)
                self.s.meta["mouse"].append([i, round(x * DPR, 1), round(y * DPR, 1)])
            self.tl.at(f0 + k, mv)

    def click(self, f):
        async def c(i):
            await self.s.r.page.mouse.down(); await self.s.r.page.mouse.up()
            self.s.meta["clicks"].append(i)
        self.tl.at(f, c)


def mk(s, name):
    """An event that records a named moment."""
    async def go(i): s.mark(name, i)
    return go


def center(sel, needle=None):
    async def get(page):
        b = await page.evaluate("""([sel, needle]) => { const e = [...document.querySelectorAll(sel)].find(e => !needle || (e.innerText || '').includes(needle)); if (!e) return null; const b = e.getBoundingClientRect(); return [(b.left + b.right) / 2, (b.top + b.bottom) / 2]; }""", [sel, needle])
        if not b: raise SystemExit(f"no element for {sel}")
        return b
    return get


async def open_docs(r, path):
    """Load a docs page on virtual time (see the module doc), the search index warm, the pointer parked."""
    await r.page.add_init_script(DOCS_INIT)
    await r.page.goto(VIEWER + path)
    await r.page.wait_for_load_state("load")
    # warm the index the way a visitor's hover over the Search pill does, then park the pointer
    await r.page.hover("[data-search-open]")
    await r.page.wait_for_timeout(900)
    await r.page.mouse.move(W - 2, H - 2)
    await r.page.evaluate("window.__vt.enable()")
    await r.step(30)


async def wait_landing(r):
    """After a result opens another page: wait for the destination's reveal (the outlined target)."""
    await r.page.wait_for_load_state("load")
    try:  # a result with an anchor is revealed and outlined; a bare page result just opens at its top
        await r.page.wait_for_selector(".ds-target", timeout=3000)
    except Exception:
        await r.page.wait_for_timeout(600)
    await r.page.evaluate("window.__vt.enable()")


def palette_rects(s):
    """Boxes of the palette's parts, once its results are up."""
    async def go(i):
        await s.elem("input", ".ds-input", None, i)
        await s.elem("chips", ".ds-scopes", None, i)
        await s.elem("top_row", ".ds-list .ds-row[aria-selected=true]", None, i)
        await s.elem("pane", ".ds-preview", None, i)
        await s.elem("palette", ".ds-pal", None, i)
        t = s.meta.setdefault("text", {})
        for tag, sel in [("chips", ".ds-scopes"), ("top_row", ".ds-list .ds-row[aria-selected=true]"), ("pane", ".ds-preview")]:
            t[tag] = await s.r.js("(sel) => (document.querySelector(sel)?.innerText || '').replace(/\\s+/g, ' ').trim()", sel)
    return go


async def s_search(name, path, query, frames, t_open, t_type, t_enter, land_text=None):
    async with rec() as r:
        await open_docs(r, path)
        s = Shot(r, name)
        tl = Timeline()
        tl.at(at(t_open), lambda i: s.key(i, "Meta+k", "⌘K"))
        tl.at(at(t_open) + 1, mk(s, "palette"))
        for k, ch in enumerate(query):
            tl.at(at(t_type + 0.1 * k), lambda i, c=ch: s.type(i, c))
        t_done = at(t_type + 0.1 * len(query))
        tl.at(t_done, mk(s, "typed"))
        tl.at(t_done + 12, palette_rects(s))
        tl.at(t_done + 12, mk(s, "results"))
        async def enter(i):
            s.mark("enter", i)
            async with r.page.expect_navigation(wait_until="load"):
                await s.key(i, "Enter")
            await wait_landing(r)
            await r.step(2)
        tl.at(at(t_enter), enter)
        land = at(t_enter) + 20
        async def landed(i):
            s.mark("landed", i)
            await s.elem("target", ".ds-target", None, i)
            if land_text:  # a bare page opens at its top: its title and the sentence the voiceover can point at
                await s.elem("header", ".page-title, h1", None, i)
                await s.rect("says", "article", land_text, None, i)
        tl.at(land, landed)
        async def gate(i): await r.leaks(name)
        tl.at(frames - 1, gate)
        await s.run(frames, tl.events())


async def d_cc_search():
    """Claude Code source map: ⌘K, "plan mode", the top result (an undocumented reminder) with its text and
    provenance in the pane, Enter lands on it. 10.8 s: 0.7 s page, palette at 0.7, typing 1.2 to 2.1, results
    hold to 5.6, landing hold 5.2 s."""
    await s_search("d_cc_search", "/claude-code/", "plan mode", at(10.8), 0.7, 1.2, 5.6)


async def d_cx_search():
    """Codex/ChatGPT source map: ⌘K, "persistent", the persistent-mode instructions, Enter. 8 s: palette 0.5,
    typing 0.9 to 1.9, results hold to 4.3, landing hold 3.7 s."""
    await s_search("d_cx_search", "/codex/", "persistent", at(8.0), 0.5, 0.9, 4.3, land_text="You are now in persistent mode for this session until explicitly disabled by a later developer message.")


async def d_wins():
    """What wins (Claude Code): scroll to the advisor card, tick Anthropic's remote flag (verdict flips to
    "Advisor can be used"), then tick the env var checked before the ladder (flips back: the env var wins).
    10.5 s."""
    card = ".ladder[data-decision=advisor-tool-available]"
    async with rec() as r:
        await open_docs(r, "/claude-code/what-wins/")
        s = Shot(r, "d_wins")
        tl = Timeline(); ptr = Pointer(s, tl)
        state = {}
        async def measure(i):
            # scroll so the card's heading sits ~110 px from the top
            state["y1"] = await r.js("""(card) => { const h = document.querySelector(card).closest('.filter-item').querySelector('h2, h3, h4'); return Math.max(0, Math.round(h.getBoundingClientRect().top + scrollY - 110)); }""", card)
        tl.at(1, measure)
        f0, n = at(0.5), at(1.0)
        for k in range(1, n + 1):
            u = k / n; e = u * u * (3 - 2 * u)
            async def sc(i, e=e): await r.js("y => scrollTo({ top: y * %f, behavior: 'instant' })" % e, state["y1"])
            tl.at(f0 + k, sc)
        t_scrolled = f0 + n
        def rects(tag):
            async def go(i):
                await s.elem("verdict_" + tag, card + " .result", None, i)
                await s.rect("verdict_value_" + tag, card + " .result", (await r.js("(c)=>document.querySelector(c+' .result-value').innerText", card)), None, i)
                await s.elem("rung_flag", card + " [data-rung=remoteFlag]", None, i)
                await s.elem("bypass_disable", card + " [data-bypass-row=disableAdvisor]", None, i)
                await s.elem("card", card, None, i)
                s.meta.setdefault("text", {})["verdict_" + tag] = await r.js("(c) => document.querySelector(c + ' .result').innerText.replace(/\\s+/g, ' ').trim()", card)
            return go
        tl.at(t_scrolled + 6, rects("default"))
        tl.at(t_scrolled + 6, mk(s, "default"))
        # 1) the remote flag's checkbox
        g1 = t_scrolled + at(1.0)
        ptr.glide(g1, at(0.55), lambda: center(card + " [data-rung=remoteFlag] input[type=checkbox]")(r.page))
        c1 = g1 + at(0.55) + at(0.15)
        ptr.click(c1)
        tl.at(c1, mk(s, "flag"))
        tl.at(c1 + 8, rects("flag"))
        # 2) the env var checked before the ladder
        g2 = c1 + at(2.7)
        ptr.glide(g2, at(0.55), lambda: center(card + " [data-bypass=disableAdvisor]")(r.page))
        c2 = g2 + at(0.55) + at(0.15)
        ptr.click(c2)
        tl.at(c2, mk(s, "env"))
        tl.at(c2 + 8, rects("env"))
        total = c2 + at(3.6)
        async def gate(i): await r.leaks("d_wins")
        tl.at(total - 1, gate)
        await s.run(total, tl.events())


async def d_home():
    """The landing page: hold on the headline, then an eased scroll to the two harness cards. 10 s."""
    async with rec() as r:
        await open_docs(r, "/")
        s = Shot(r, "d_home")
        await s.rect("headline", "h1", "What the agent harness", None, 0)
        await s.elem("h1", "h1", None, 0)
        await s.elem("lede", "h1 + p, .lede, header p", None, 0)
        await s.elem("cards", ".product-grid, .products, .cards", None, 0)
        await s.rect("cc_card", "a, article, section, div", "The system prompt, system reminders, tools", None, 0)
        await s.rect("cx_card", "a, article, section, div", "GPT-6 base and persistent-mode instructions", None, 0)
        N, A, B, Y = at(10), at(3.0), at(6.0), 300
        async def scroll(i):
            u = min(1, max(0, (i - A) / (B - A))); e = u * u * (3 - 2 * u)
            await r.js("y => window.scrollTo(0, y)", round(Y * e))
            if i == B:
                await s.rect("cc_card_s", "a, article, section, div", "The system prompt, system reminders, tools", None, i)
                await s.rect("cx_card_s", "a, article, section, div", "GPT-6 base and persistent-mode instructions", None, i)
                await s.rect("headline_s", "h1", "What the agent harness", None, i)
                s.mark("scrolled", i)
        async def gate(i): await r.leaks("d_home")
        ev = {i: scroll for i in range(A, B + 1)}
        ev[N - 1] = gate
        await s.run(N, ev)


SHOTS = {f.__name__: f for f in [d_cc_search, d_cx_search, d_wins, d_home]}

if __name__ == "__main__":
    asyncio.run(main_of(SHOTS))
