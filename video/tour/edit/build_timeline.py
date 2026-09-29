"""One plan -> edit/src/timeline.json (sections, time maps, cameras, boxes, captions, key caps, VO placement) and audio/mix.wav.

The edit is cut on the voiceover. Each section names a take (footage), a voiceover beat, and *anchors*: pairs of
(a moment in the take, a moment in the narration), so a click lands on the word that names it. Between anchors the
take plays a little faster or slower (rates outside 0.55x to 2.3x are warned about); a flat pair holds a frame.
Cameras are focus rectangles in source pixels (3840x2160); the edit fits them to 16:9 or 4:5.

  python3 build_timeline.py            timeline only
  python3 build_timeline.py --audio    also the mix (voice beats, music bed when audio/music_bed.mp3 exists)
"""
import json, os, re, subprocess, sys, glob

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from common import private_dir  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MEDIA = private_dir("video", "tour")
FOOT, FRAMES, AUDIO = f"{MEDIA}/footage", f"{MEDIA}/frames", f"{MEDIA}/audio"
VOD = f"{AUDIO}/vo"
FPS = 60
FULL = [0, 0, 3840, 2160]
PAL_T = [870, 190, 2640, 1760]        # docs palette in 4:5: the results column, not the detail pane
PANEL = [2964, 36, 3804, 2124]          # Trace's side column
LEFT = [0, 0, 2920, 2160]               # Trace's landscape area
SHOW_KEYS = {"/", "Tab", "Enter", "n", "w", "2", "3", "4", "5", "]", "l", "⌘K", "Esc"}
def union(*rs):
    return [min(r[0] for r in rs), min(r[1] for r in rs), max(r[2] for r in rs), max(r[3] for r in rs)]


norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())


def latest_frames(shot):
    ds = [d for d in glob.glob(f"{FRAMES}/{shot}_*") if re.fullmatch(rf"{re.escape(shot)}_\d{{6}}", os.path.basename(d))]
    if not ds: raise SystemExit(f"no frames for {shot}")
    d = sorted(ds, key=os.path.getmtime)[-1]
    return os.path.basename(d), len(glob.glob(d + "/*.jpg"))


class Sec:
    """One section's plan. Times are seconds from the section's start."""

    def __init__(self, sid, shot, beat=None, lead=0.2, tail=0.5, min_dur=0.0, src0=0, cont=False, card=False, grade=None, overlay=None):
        self.id, self.shot, self.beat, self.lead, self.tail, self.min_dur = sid, shot, beat, lead, tail, min_dur
        self.src0, self.cont, self.card, self.grade, self.overlay = src0, cont, card, grade, overlay
        self.cues, self.chips = {}, []
        if shot:
            self.dir, self.n = latest_frames(shot)
            self.foot = json.load(open(f"{FOOT}/{shot}.json"))
        else:
            self.dir, self.n, self.foot = None, 0, {"marks": {}, "rects": {}, "keys": []}
        self.vo = json.load(open(f"{VOD}/{beat}.json")) if beat else None
        self.anchors, self.cams, self.boxes, self._map, self.cuts = [], [], [], None, set()
        vo_end = (lead + self.vo["phrases"][-1]["t1"]) if self.vo else 0
        self.dur = max(min_dur, vo_end + tail)

    # --- narration lookups
    def w(self, word, nth=0, edge=0):
        hits = [x for x in self.vo["words"] if norm(x[0]) == norm(word)]
        if len(hits) <= nth: raise SystemExit(f"{self.id}: word {word!r} #{nth} not in beat {self.beat}")
        return self.lead + hits[nth][1 + edge]

    def ph(self, i, edge=0):
        return self.lead + self.vo["phrases"][i]["t1" if edge else "t0"]

    # --- the take
    def mark(self, name):
        return self.foot["marks"][name]

    def rect(self, tag):
        return self.foot["rects"][tag]["r"]

    def key(self, label, nth=0):
        ks = [f for f, k in self.foot["keys"] if k == label]
        return ks[nth]

    def _src(self, src):
        return self.mark(src) if isinstance(src, str) else int(src)

    def anchor(self, src, t):
        self.anchors.append((float(t), self._src(src))); self._map = None

    def hold(self, src, t0, t1):
        self.anchor(src, t0); self.anchor(src, t1)

    def cut(self, src_from, src_to, t):
        """A jump cut inside the section: the take shows src_from up to t, then src_to."""
        self.cuts.add(round(float(t), 4)); self.anchor(src_from, t); self.anchor(src_to, t)

    def points(self):
        if self._map is None:
            pts = sorted(self.anchors, key=lambda a: a[0])
            if not pts or pts[0][0] > 1e-6: pts = [(0.0, self.src0)] + pts
            self._map = pts
        return self._map

    def tm(self, src):
        """Time (s) at which source frame `src` is on screen (the first time, for a hold)."""
        f = self._src(src)
        pts = self.points()
        for (t0, f0), (t1, f1) in zip(pts, pts[1:]):
            if f0 <= f <= f1 or f1 <= f <= f0:
                return t0 if f1 == f0 else t0 + (t1 - t0) * (f - f0) / (f1 - f0)
        t, fl = pts[-1]
        return t + (f - fl) / FPS

    def end_src(self):
        if not self.shot: return 0
        t, f = self.points()[-1]
        return f + (self.dur - t) * FPS

    def cue(self, name, t):
        self.cues[name] = t

    def chip(self, text, t=0.0):
        """The where-are-we chip (top-left) changes to `text` at section time t."""
        self.chips.append((t, text))

    # --- camera and boxes
    def cam(self, t, r, tall=None, pad=None, maxZ=None):
        self.cams.append({"t": t, "r": r, "tall": tall, "pad": pad, "maxZ": maxZ})

    def box(self, r, t0, t1=None, color=None, spot=0.0, pad=8):
        self.boxes.append({"r": r, "t0": t0, "t1": self.dur if t1 is None else t1, "color": color, "spot": spot, "pad": pad})

    def check(self):
        if not self.shot: return
        pts = self.points()
        for (t0, f0), (t1, f1) in zip(pts, pts[1:]):
            if t1 - t0 < 1e-6:
                if f1 != f0 and round(t0, 4) not in self.cuts: print(f"WARNING {self.id}: two source frames at t={t0:.2f}")
                continue
            rate = (f1 - f0) / ((t1 - t0) * FPS)
            if rate < 0 or (f1 != f0 and not 0.55 <= rate <= 2.3):
                print(f"WARNING {self.id}: rate {rate:.2f}x between t={t0:.2f} and {t1:.2f} (src {f0}->{f1})")
        last = self.end_src()
        if last > self.n + 1: print(f"WARNING {self.id}: needs source frame {last:.0f}, {self.shot} has {self.n}")

    def out(self, start_f, prev_end_src=None):
        secs = lambda t: round(t * FPS)
        if not self.shot:
            return {"id": self.id, "kind": "hook", "from": start_f, "to": start_f + secs(self.dur), "cues": {k: secs(v) for k, v in self.cues.items()}}
        pts = self.points()
        m = [[round(t * FPS), f] for t, f in pts]
        secs = lambda t: round(t * FPS)
        cams = sorted(self.cams, key=lambda c: c["t"])
        if not cams: cams = [{"t": 0, "r": FULL, "tall": None, "pad": None, "maxZ": None}]
        cam = []
        for c in cams:
            k = {"f": secs(c["t"]), "r": c["r"]}
            if c["tall"]: k["tall"] = c["tall"]
            if c["pad"]: k["pad"] = c["pad"]
            if c["maxZ"]: k["maxZ"] = c["maxZ"]
            cam.append(k)
        boxes = [{"r": b["r"], "t0": secs(b["t0"]), "t1": secs(b["t1"]), "color": b["color"], "spot": b["spot"], "pad": b["pad"]} for b in self.boxes]
        leaks, last = [], None
        for f, rs in self.foot.get("leaks", []):   # keep only the samples where the blur changes
            key = json.dumps(rs)
            if key != last: leaks.append([f, rs]); last = key
        d = {"id": self.id, "kind": "footage", "shot": self.shot, "from": start_f, "to": start_f + secs(self.dur), "n": self.n, "map": m, "cam": cam, "boxes": boxes,
             "leaks": leaks, "cues": {k: secs(v) for k, v in self.cues.items()}}
        if self.overlay: d["overlay"] = self.overlay
        if self.cont: d["cont"] = True
        if self.card: d["card"] = True
        if self.grade: d["grade"] = self.grade
        return d


# ---------------------------------------------------------------------------------------------- the plan

def plan():
    S = []
    CC, CX = "Harness Source Map · Claude Code", "Harness Source Map · Codex/ChatGPT"
    TR, NET = "Trace · your session", "Trace · network capture"

    # 1. The problem, drawn: what you typed, and the stack the model actually receives.
    s = Sec("hook", None, "hook", lead=0.5, tail=0.6)
    s.chip("", 0)
    s.cue("type", 0.3)
    s.cue("s0", s.w("system") - 0.05); s.cue("s1", s.w("tool") - 0.05); s.cue("s2", s.w("reminders") - 0.05)
    t = s.w("turns") + 0.1
    for k in range(3, 7): s.cue(f"s{k}", t + 0.2 * (k - 3))
    s.cue("tags", s.w("documented") - 0.35)
    s.dur = max(s.dur, s.w("documented") + 1.4)
    S.append(s)

    # 2. What this is: the landing page, headline first, then the two harnesses.
    s = Sec("what", "d_home", "what", lead=0.3, tail=0.5)
    s.chip("Harness Source Map", 0)
    s.anchor(0, 0.0); s.anchor(180, s.ph(1) - 0.7); s.anchor("scrolled", s.ph(1) + 1.6)
    s.dur = max(s.dur, s.tm("scrolled") + 1.2)
    PAGE, PAGE_T = [880, 110, 2960, 1180], [1056, 110, 2784, 1500]   # 4:5 shows at most 1,728 source px across: the centre
    s.cam(0, PAGE, pad=1.03, tall=PAGE_T); s.cam(s.dur, PAGE, pad=0.98, tall=PAGE_T)
    s.box(s.rect("h1"), 0.8, s.ph(1) - 0.8, color="lime", pad=10)
    S.append(s)

    # 3. Claude Code: how does plan mode stop the agent from editing?
    s = Sec("docs_cc", "d_cc_search", "docs_cc", lead=0.2, tail=0.4, src0=20)
    s.chip(CC, 0)
    s.anchor("palette", 0.3); s.anchor("typed", 1.7); s.anchor("results", 1.85)
    s.hold("results", 1.85, s.w("exact") - 0.1); s.cut("results", s.mark("enter") - 6, s.w("exact") - 0.1)
    s.anchor("enter", s.w("exact")); s.anchor("landed", s.w("exact") + 0.35)
    s.dur = max(s.dur, s.tm("landed") + 2.8)
    pal = s.rect("palette")
    s.cam(0, FULL); s.cam(0.45, pal, pad=1.06, tall=PAL_T); s.cam(s.tm("enter") + 0.05, pal, pad=1.06, tall=PAL_T)
    s.cam(s.tm("landed") + 0.15, [1440, 100, 3040, 830], pad=1.04)
    s.box(s.rect("top_row"), 2.0, s.tm("enter") - 0.1, color="lime", pad=6)
    s.box(s.rect("target"), s.tm("landed") + 0.3, color="amber", pad=6)
    S.append(s)

    # 4. Codex/ChatGPT: the persistent-mode instructions this project started with.
    s = Sec("docs_cx", "d_cx_search", "docs_cx", lead=0.15, tail=0.6, src0=14)
    s.chip(CX, 0)
    s.anchor("palette", 0.3); s.anchor("typed", 1.45); s.anchor("results", 1.6)
    s.hold("results", 1.6, s.w("gpt6s") - 0.1); s.cut("results", s.mark("enter") - 6, s.w("gpt6s") - 0.1)
    s.anchor("enter", s.w("gpt6s")); s.anchor("landed", s.w("gpt6s") + 0.35)
    s.dur = max(s.dur, s.tm("landed") + 3.0)
    pal = s.rect("palette")
    s.cam(0, FULL); s.cam(0.45, pal, pad=1.06, tall=PAL_T); s.cam(s.tm("enter") + 0.05, pal, pad=1.06, tall=PAL_T)
    s.cam(s.tm("landed") + 0.15, [1300, 200, 3100, 1300], pad=1.02)
    s.box(s.rect("top_row"), 1.75, s.tm("enter") - 0.1, color="lime", pad=6)
    s.box(s.rect("says"), s.tm("landed") + 0.3, color="amber", pad=6)
    S.append(s)

    # 5. What wins: a remote flag turns the advisor on; your env var still beats it.
    s = Sec("wins", "d_wins", "wins", lead=0.2, tail=0.6)
    s.chip(CC, 0)
    t_flag, t_env = s.w("flip") - 0.05, s.w("environment") + 0.1
    s.anchor(0, 0.0); s.hold("default", 1.6, t_flag - 1.15)
    s.anchor(150, t_flag - 0.7); s.anchor("flag", t_flag)
    s.hold(200, t_flag + 0.13, t_env - 1.05); s.cut(200, 340, t_env - 1.05); s.anchor("env", t_env)
    s.dur = max(s.dur, t_env + 2.0)
    s.cam(0, FULL); s.cam(1.0, [1440, 300, 3020, 1500], pad=1.02)
    s.cam(t_flag - 0.9, s.rect("verdict_default"), pad=1.5)
    s.cam(t_flag + 0.2, [1440, 500, 3020, 1180], pad=1.03)
    s.cam(t_env - 0.9, [1440, 480, 3020, 1180], pad=1.03)
    s.box(s.rect("verdict_value_default"), 1.8, t_flag - 0.5, color="red", pad=10)
    s.box(s.rect("verdict_value_flag"), t_flag + 0.35, t_env - 0.4, color="lime", pad=10)
    s.box(s.rect("verdict_value_env"), t_env + 0.35, color="red", pad=10)
    S.append(s)

    # 6. Trace: what the harness actually sent, in your own session.
    s = Sec("loader", "t_loader", "loader", lead=0.2, tail=0.5)
    s.chip(TR, 0)
    T = s.ph(1) - 0.6
    s.hold(0, 0.0, T); s.cut(0, 24, T); s.anchor(30, T + 0.1); s.anchor("opened", T + 0.1 + (s.mark("opened") - 30) / FPS)
    s.dur = max(s.dur, s.w("subagents") + 1.4)
    s.anchor(360, s.tm("opened") + (360 - s.mark("opened")) / FPS); s.hold(360, s.tm(360), s.dur)
    card_r = [700, 560, 3160, 1620]
    s.cam(0, card_r, pad=1.1); s.cam(s.tm("opened") - 0.1, card_r, pad=1.1)
    s.cam(s.tm("opened") + 0.5, FULL, tall=[0, 0, 1728, 2160])
    s.box(s.rect("privacy"), 0.3, s.tm(90) - 0.05, color="lime", pad=8)   # until the click: the reading line moves it
    s.box(s.rect("dur"), s.w("day") - 0.15, color="amber", pad=10)
    s.box(s.rect("subs"), s.w("ninety") - 0.15, color="amber", pad=10)
    S.append(s)

    # 7. What the landscape shows (clean flight, legend overlay).
    s = Sec("legend", "t_open", "legend", lead=0.3, tail=0.5, overlay="legend")
    s.chip(TR, 0)
    s.cue("time", s.w("time") - 0.1); s.cue("height", s.w("height") - 0.1)
    s.cue("gray", s.w("gray") - 0.1); s.cue("pink", s.w("pink") - 0.1); s.cue("green", s.w("green") - 0.1); s.cue("rest", s.w("green") + 0.8)
    s.cam(0, FULL); s.cam(s.dur, [96, 54, 3744, 2106], pad=1.0)
    S.append(s)

    # 8. Zoom into one request (the idle wait before the lift is cut).
    s = Sec("fly", "t_fly", "fly", lead=0.3, tail=0.1)
    s.anchor(0, 0.0); s.anchor(240, 3.4); s.cut(240, 318, 3.4); s.anchor("injected", 3.4 + (s.mark("injected") - 318) / FPS)
    s.dur = s.tm("injected")
    s.cam(0, FULL)
    S.append(s)
    # 9. Open the pink layer: the MCP servers' instructions; then the request's column.
    s = Sec("open", "t_fly", "open", lead=0.9, tail=0.9, cont=True, src0=S[-1].mark("injected"))
    # the column's labels are CSS2D text the capture's rect finder can't pin (≈ spacing); measured on the take's
    # frame 700 (source px), stable once the Inspect-layers stage has settled
    COL_YOU, COL_HARNESS, COL_TITLE = [1287, 1113, 1506, 1167], [1296, 1473, 1555, 1527], [900, 552, 1251, 603]
    COL = [760, 520, 1640, 1760]
    s.hold(s.src0, 0.0, s.w("open") - 0.45); s.cut(s.src0, 466, s.w("open") - 0.45); s.anchor(472, s.w("open") - 0.35); s.anchor("opened", s.w("open") - 0.35 + (s.mark("opened") - 472) / FPS)
    s.anchor("column", s.tm("opened") + (s.mark("column") - s.mark("opened")) / FPS)
    s.hold(s.mark("column") + 60, s.tm("column") + 1.0, max(s.dur, s.ph(2, 1) + 0.9))
    s.dur = max(s.dur, s.ph(2, 1) + 0.9)
    s.cam(0, FULL, tall=PANEL); s.cam(s.tm("opened") + 0.2, FULL, tall=PANEL)
    s.cam(s.ph(1) - 0.4, COL, pad=1.05)
    s.box(s.rect("block"), 0.2, s.tm("opened"), color="pink", pad=6)
    s.box(COL_YOU, s.w("tenth") - 0.25, color="lime", pad=8)
    s.box(COL_HARNESS, s.w("half") - 0.25, color="grey", pad=8)
    S.append(s)

    # 10. Search: your CLAUDE.md, 94 copies to 91 agents.
    s = Sec("search", "t_search", "search", lead=0.2, tail=0.8)
    s.anchor(0, 0.0); s.anchor("results", s.w("claude") + 0.3); s.hold("results", s.w("claude") + 0.3, s.w("agents") + 0.3)
    s.cut("results", s.mark("enter") - 6, s.w("agents") + 0.3); s.anchor("enter", s.w("agents") + 0.4)
    s.dur = max(s.dur, s.tm("enter") + 1.6)
    s.cam(0, FULL); s.cam(0.5, [1100, 40, 2860, 1300], pad=1.02)
    s.cam(s.tm("enter") - 0.05, [1100, 40, 2860, 1300], pad=1.02); s.cam(s.tm("enter") + 0.6, FULL, tall=LEFT)
    s.box(s.rect("row_count"), s.w("ninetyfour") - 0.2, s.tm("enter") - 0.1, color="lime", pad=6)
    S.append(s)

    # 11. What left the machine, and why a deploy ran.
    s = Sec("egress", "t_lenses", "egress", lead=0.2, tail=0.6)
    s.anchor(0, 0.0); s.anchor("two", s.w("two") - 0.05); s.hold(110, s.w("two") + 1.4, s.w("deploy") - 0.6)
    s.cut(110, 160, s.w("deploy") - 0.6); s.anchor(168, s.w("deploy") - 0.47); s.anchor("deploy", s.w("deploy") - 0.07)
    s.anchor("ladder", s.ph(2) - 0.15); s.hold(s.mark("ladder") + 60, s.ph(2) + 0.85, max(s.dur, s.ph(2, 1) + 0.8))
    s.dur = max(s.dur, s.ph(2, 1) + 0.8)
    dy = s.rect("left")[1] - 830.7                     # the panel's content moves with the lens grid above it
    LIST, LADDER, PT = [2964, 740 + dy, 3804, 1180 + dy], [2964, 760 + dy, 3804, 1420 + dy], [2964, 640 + dy, 3804, 1500 + dy]
    s.cam(0, FULL); s.cam(s.tm("two") + 0.3, LIST, pad=1.08, tall=PT)
    s.cam(s.tm("deploy") - 0.2, LIST, pad=1.08, tall=PT)
    s.cam(s.tm("ladder") - 0.1, LADDER, pad=1.06, tall=PT)
    s.box(s.rect("left"), s.tm("two") + 0.4, s.tm("deploy") - 0.3, color="red", pad=8)
    s.box(s.rect("counts"), s.tm("two") + 0.6, s.tm("deploy") - 0.3, color="red", pad=8)
    s.box(s.rect("asked"), s.w("asked") - 0.1, color="lime", pad=8)
    s.box(s.rect("permitted"), s.w("bypasspermissions") - 0.1, color="amber", pad=8)
    S.append(s)

    # 12. What the log leaves out: attach a network capture (a different, short session).
    s = Sec("attach", "n_attach", "attach", lead=0.2, tail=0.4)
    s.chip(NET, 0)
    # the take: the card opens on the click (1.5 s), "Choose a .har file…" at 5.4 s, attached, "Open What went over the wire" at 8.7 s
    s.anchor(0, 0.0); s.anchor("choose", max(s.w("attach") + 0.2, 4.6)); s.anchor("lens5", s.tm("choose") + (s.mark("lens5") - s.mark("choose")) / FPS)
    s.dur = max(s.dur, s.tm("lens5") + 0.9)
    CARD, CARD_T = [2700, 40, 3840, 900], [2940, 40, 3830, 900]
    s.cam(0, FULL); s.cam(s.tm("click") - 0.45, FULL); s.cam(s.tm("click") + 0.15, CARD, pad=1.04, tall=CARD_T)
    s.cam(s.tm("lens5") - 0.1, CARD, pad=1.04, tall=CARD_T); s.cam(s.tm("lens5") + 0.6, FULL)
    s.box(s.rect("add"), s.tm("click") - 0.5, s.tm("click") + 0.1, color="lime", pad=8)
    s.box(s.rect("help_cmd"), s.w("record") - 0.1, s.tm("choose") - 0.1, color="amber", pad=6)
    s.box(s.rect("help_head"), s.tm("choose") + 0.35, s.tm("lens5") - 0.4, color="lime", pad=6)
    s.box(s.rect("open5"), s.tm("lens5") - 0.7, s.tm("lens5"), color="lime", pad=6)
    S.append(s)

    # 13. On the wire: the system prompt as sent, the tools, the system message the log never saw.
    s = Sec("wireA", "n_wire", "wireA", lead=0.2, tail=0.3, src0=8)
    by, ty, my = s.rect("blocks")[1], s.rect("tools")[1], s.rect("midsys")[1]
    BILL, BILL_T = [1540, by - 36, 3200, by + 324], [1540, by - 36, 2760, by + 324]
    TOOLS, TOOLS_T = [1540, ty - 28, 3300, ty + 202], [1540, ty - 28, 2760, ty + 202]
    MID, MID_T = [1540, my - 38, 3200, my + 352], [1540, my - 38, 2760, my + 352]
    s.anchor("click", 0.3); s.anchor("opened", 1.8)
    s.cut(s.mark("opened") + 20, s.mark("blocks") - 24, s.tm("opened") + 0.45)
    s.anchor("blocks", max(s.w("billing") - 0.1, s.tm("opened") + 0.85))
    s.dur = max(s.dur, s.tm("blocks") + 2.6)
    s.cam(0, FULL); s.cam(s.tm("opened") + 0.1, FULL); s.cam(s.tm("blocks") - 0.3, BILL, pad=1.0, tall=BILL_T)
    s.box(s.rect("billing"), s.tm("blocks"), color="amber", pad=6)
    S.append(s)
    s = Sec("wireB", "n_wire", "wireB", lead=0.35, tail=0.3, cont=True, src0=S[-1].mark("tools") - 30)
    s.anchor("tools", s.w("eighteen") - 0.1)
    s.dur = max(s.dur, s.tm("tools") + 2.4)
    s.cam(0, BILL, pad=1.0, tall=BILL_T); s.cam(0.25, TOOLS, pad=1.0, tall=TOOLS_T)
    s.box(s.rect("tools"), s.tm("tools"), color="blue", pad=6)
    S.append(s)
    s = Sec("wireC", "n_wire", "wireC", lead=0.35, tail=0.6, cont=True, src0=S[-1].mark("notlog") - 30)
    s.anchor("notlog", s.ph(0) + 0.2)
    s.dur = max(s.dur, s.tm("notlog") + 2.6)
    s.hold(s.mark("notlog") + 30, s.tm("notlog") + 0.5, s.dur)   # the take scrolls on to the next card after this
    s.cam(0, TOOLS, pad=1.0, tall=TOOLS_T); s.cam(0.25, MID, pad=1.0, tall=MID_T)
    s.box(s.rect("midsys"), s.tm("notlog"), color="pink", pad=6)
    s.box(s.rect("tooladd"), s.tm("notlog") + 0.4, color="pink", pad=6)
    S.append(s)

    # 14. Where your data went.
    s = Sec("data", "n_lens", "data", lead=0.2, tail=0.7, src0=504)
    wy = s.rect("warnline")[1]
    HOST, HOST_T = [1520, wy - 134, 3120, wy + 336], [1520, wy - 134, 2740, wy + 336]
    s.hold("twohosts", 0.0, s.w("token") - 0.3)
    s.dur = max(s.dur, s.w("datadog") + 1.8)
    s.hold(560, s.w("token") + 0.97, s.dur)
    s.cam(0, HOST, pad=1.0, tall=HOST_T)
    s.box(s.rect("warnline"), s.w("token") - 0.2, s.w("device") - 0.3, color="red", pad=8)
    s.box(s.rect("flagged_row"), s.w("device") - 0.2, color="red", pad=8)
    S.append(s)

    # 15. Every flag served, and what one of them turns on.
    s = Sec("flags", "n_lens", "flags", lead=0.2, tail=0.4, src0=880)
    fy = s.rect("flags_h")[1]
    FLAG, FLAG_T = [1520, fy - 44, 3300, fy + 696], [1520, fy - 44, 2740, fy + 696]
    s.anchor("flags", 0.35)
    s.dur = max(s.dur, s.tm("flags_filtered") + 0.6)
    s.cam(0, FLAG, pad=1.0, tall=FLAG_T)
    s.box(s.rect("flags_h"), 0.5, color="lime", pad=8)
    S.append(s)
    s = Sec("turnson", "n_docs", "turnson", lead=0.2, tail=0.5)
    tc = s.w("click") + 0.25
    s.hold(0, 0.0, tc - 0.2); s.cut(0, 66, tc - 0.2); s.anchor("click", tc); s.anchor(156, tc + 0.9); s.cut(170, 300, tc + 1.1)
    s.anchor("enter", s.ph(1) - 0.35); s.anchor(345, s.ph(1) + 0.05)
    s.dur = max(s.dur, s.tm(345) + 2.6)
    s.chip(CC, tc + 0.05)
    ry = s.rect("flag_row")[1]
    s.cam(0, [1500, ry - 118, 3800, ry + 252], pad=1.1, tall=[1542, ry - 168, 3762, ry + 332])
    s.cam(tc + 0.05, s.rect("palette"), pad=1.06, tall=PAL_T)
    s.cam(s.tm("enter") + 0.05, s.rect("palette"), pad=1.06, tall=PAL_T)
    s.cam(s.tm(345) + 0.1, [1440, 100, 3040, 900], pad=1.04)
    s.box(s.rect("flag_link"), 0.2, tc + 0.05, color="lime", pad=8)
    s.box(s.rect("entry"), s.tm(345) + 0.2, color="amber", pad=6)
    S.append(s)

    # 16. End card over the landscape.
    s = Sec("close", "t_close", "close", lead=0.3, tail=1.4, card=True)
    s.chip("", 0)
    s.cam(0, FULL); s.cam(s.dur, [80, 45, 3760, 2115], pad=1.0)
    S.append(s)
    return S


def compile_(S):
    caps, keys, vo, secs, chips = [], [], [], [], []
    t_abs = 0.0
    prev_end_src = None
    for s in S:
        if s.cont and prev_end_src is not None and not s.anchors:
            s.src0 = int(prev_end_src)
        s.check()
        start_f = round(t_abs * FPS)
        secs.append(s.out(start_f))
        for t, text in s.chips: chips.append([start_f + round(t * FPS), text])
        if s.vo:
            vo.append({"id": s.beat, "t": round(t_abs + s.lead, 3)})
            for p in s.vo["phrases"]:
                ws = [w for w in s.vo["words"] if w[1] >= p["t0"] - 1e-3 and w[2] <= p["t1"] + 1e-3]
                caps.append({"t0": round(t_abs + s.lead + p["t0"], 3), "t1": round(t_abs + s.lead + p["t1"], 3), "text": p["show"],
                             "words": [[w[0], round(t_abs + s.lead + w[1], 3), round(t_abs + s.lead + w[2], 3)] for w in ws]})
        for f, k in s.foot.get("keys", []):
            if k not in SHOW_KEYS: continue
            t = s.tm(f)
            if 0 <= t < s.dur: keys.append({"t": round(t_abs + t, 3), "k": k})
        prev_end_src = s.end_src()
        t_abs += s.dur
    for a, b in zip(caps, caps[1:]):
        a["t1"] = round(min(b["t0"] - 0.02, a["t1"] + 0.5), 3)
    caps[-1]["t1"] = round(caps[-1]["t1"] + 0.8, 3)
    return secs, caps, keys, vo, t_abs, sorted(chips)


def main():
    S = plan()
    secs, caps, keys, vo, dur, chips = compile_(S)
    close = next((s for s in S if s.card), None)
    card_at = dur
    if close:
        st = next(x for x in secs if x["id"] == close.id)["from"] / FPS
        card_at = st + close.ph(len(close.vo["phrases"]) - 1) - 0.35
    tl = {"fps": FPS, "duration": round(dur, 3), "sections": secs, "captions": caps, "keys": keys, "vo": vo,
          "frames": {s.shot: s.dir for s in S if s.shot}, "cardAt": round(card_at, 3), "chips": chips}
    json.dump(tl, open(f"{HERE}/src/timeline.json", "w"), indent=1)
    for sec, x in zip(S, secs):
        for b in x.get("boxes", []):
            if (b["t1"] - b["t0"]) / FPS < 2.0: print(f"  short box in {sec.id}: {(b['t1'] - b['t0']) / FPS:.1f}s")
    print(f"timeline: {len(secs)} sections, {len(caps)} captions, {len(keys)} keys, {dur:.1f} s")
    if "--audio" in sys.argv: mix(vo, dur)


def mix(vo, dur):
    """VO beats at their times; the music bed (if any) ducked under speech; -14 LUFS integrated, -1.5 dBTP."""
    a = AUDIO
    inputs, filt, base = [], [], 0
    bed = os.path.exists(f"{a}/music_bed.mp3")
    if bed: inputs += ["-i", f"{a}/music_bed.mp3"]; base = 1
    for k, v in enumerate(vo):
        inputs += ["-i", f"{a}/vo/{v['id']}.mp3"]
        ms = int(v["t"] * 1000)
        filt.append(f"[{k + base}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
    n = len(vo)
    filt.append("".join(f"[v{k}]" for k in range(n)) + f"amix=inputs={n}:normalize=0,apad=whole_dur={dur}[vo]")
    if bed:
        filt.append("[vo]asplit=2[vo1][vo2]")
        filt.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,highshelf=f=7000:g=-4,volume=-17dB,afade=t=out:st={dur - 1.5}:d=1.5[bed]")
        filt.append("[bed][vo1]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=450[duck]")
        filt.append("[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    else:
        filt.append("[vo]loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                    "-ar", "48000", "-t", str(dur), f"{a}/mix.wav"], check=True)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{a}/mix.wav", "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    print("mix:", " ".join(re.findall(r"(I:\s+[-\d.]+ LUFS|Peak:\s+[-\d.]+ dBFS)", r)[-2:]))


if __name__ == "__main__":
    main()
