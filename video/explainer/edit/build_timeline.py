"""One plan -> edit/src/timeline.json (sections, captions, key caps, VO placement) and audio/mix.wav.

Sections are cut on the voiceover: every VO beat has a start time, every shot a section. Captions come
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
from the ElevenLabs character alignment (phrase text as displayed, word timing from the audio).
Key caps come from the key presses each capture logged, shifted into the section's time.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(HERE, "..", "audio", "vo")          # committed: the script and its timings
MEDIA = private_dir("video", "explainer")              # private: footage, audio renders
FPS = 60
DURATION = 86.5

# (section id, shot, start s, end s, source frame at section start)
SECTIONS = [
    ("open",   "s_open",   0.0, 11.3, 0),
    ("axes",   "s_axes",   11.3, 21.9, 0),
    ("pour",   "s_pour",   21.9, 31.0, 0),
    ("crush",  "s_crush",  31.0, 38.6, 0),
    ("search", "s_search", 38.6, 48.6, 0),
    ("widen",  "s_search", 48.6, 52.7, 600),
    ("setup",  "s_setup",  52.7, 58.6, 0),
    ("egress", "s_egress", 58.6, 64.6, 0),
    ("agents", "s_agents", 64.6, 72.3, 0),
    ("keys",   "s_keys",   72.3, 77.0, 0),
    ("close",  "s_close",  77.0, 86.5, 0),
]
VO = {"open": 0.5, "axes": 11.6, "play1": 22.1, "play2": 31.2, "search": 38.9, "dupe": 48.9,
      "egress": 58.9, "agents": 64.9, "keys": 72.5, "close": 77.1}
# keys shown as caps (typed characters are shown by the palette itself)
SHOW_KEYS = {"/", "Tab", "Enter", "n", "w", "2", "j", "4", "?", "Space", "1", "3", "Esc"}


def words_of(al, t0, t1):
    """Word spans from the character alignment between t0 and t1."""
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    out, cur, cs = [], "", None
    for c, a, b in zip(chars, st, en):
        if a < t0 - 1e-3 or a > t1 + 1e-3: continue
        if c.isspace():
            if cur: out.append([cur, cs, prev_end]); cur = ""
            continue
        if not cur: cs = a
        cur += c; prev_end = b
    if cur: out.append([cur, cs, prev_end])
    return out


def main():
    captions, vo = [], []
    for beat, t in VO.items():
        d = json.load(open(f"{VO}/{beat}.json"))
        vo.append({"id": beat, "t": t})
        for p in d["phrases"]:
            w = words_of(d["alignment"], p["t0"], p["t1"])
            captions.append({"t0": round(t + p["t0"], 3), "t1": round(t + p["t1"], 3), "text": p["show"],
                             "words": [[x[0], round(t + x[1], 3), round(t + x[2], 3)] for x in w]})
    # captions stay up until the next one starts, at most 0.6 s past their last word
    for a, b in zip(captions, captions[1:]):
        a["t1"] = round(min(b["t0"] - 0.02, a["t1"] + 0.6), 3)
    captions[-1]["t1"] = round(captions[-1]["t1"] + 0.8, 3)

    sections, keys = [], []
    for sid, shot, s0, s1, f0 in SECTIONS:
        try:
            meta = json.load(open(f"{MEDIA}/footage/{shot}.json"))
            n = len([x for x in os.listdir(frames_dir(shot)) if x.endswith(".jpg")])
        except (FileNotFoundError, SystemExit):
            print(f"MISSING {shot}"); meta, n = {}, 1
        sections.append({"id": sid, "shot": shot, "from": round(s0 * FPS), "to": round(s1 * FPS), "src0": f0, "n": n,
                         "rects": meta.get("rects", {}), "slow": meta.get("slow", []), "pour": meta.get("pour", [])[::6]})
        for f, k in meta.get("keys", []):
            if k not in SHOW_KEYS: continue
            t = s0 + (f - f0) / FPS
            if s0 <= t < s1: keys.append({"t": round(t, 3), "k": k})
        if (s1 - s0) * FPS + f0 > n + 1: print(f"WARNING {sid}: needs {(s1 - s0) * FPS + f0:.0f} frames, {shot} has {n}")
    tl = {"fps": FPS, "duration": DURATION, "sections": sections, "captions": captions, "keys": keys, "vo": vo,
          "frames": {s[1]: safe_dir(s[1]) for s in SECTIONS}}
    json.dump(tl, open(f"{HERE}/src/timeline.json", "w"), indent=1)
    print(f"timeline: {len(sections)} sections, {len(captions)} captions, {len(keys)} keys")
    if "--audio" in sys.argv: mix(vo)


def safe_dir(shot):
    try: return os.path.basename(frames_dir(shot))
    except SystemExit: return "missing"


def frames_dir(shot):
    import glob
    ds = sorted(glob.glob(f"{FRAMES_ROOT}/{shot}_*"), key=os.path.getmtime)
    if not ds: raise SystemExit(f"no frames for {shot}")
    return ds[-1]


FRAMES_ROOT = private_dir("video", "explainer", "frames")


def mix(vo):
    """VO beats at their times; the music bed ducked under speech; -14 LUFS integrated, -1 dBTP."""
    a = f"{MEDIA}/audio"
    inputs, filt = ["-i", f"{a}/music_bed.mp3"], []
    for k, v in enumerate(vo):
        inputs += ["-i", f"{a}/vo/{v['id']}.mp3"]
        ms = int(v["t"] * 1000)
        filt.append(f"[{k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{k}]")
    n = len(vo)
    filt.append("".join(f"[v{k}]" for k in range(n)) + f"amix=inputs={n}:normalize=0,apad=whole_dur={DURATION}[vo]")
    filt.append("[vo]asplit=2[vo1][vo2]")
    # the bed: slowed 4.5% so its own ending lands on the end card; a touch of high cut so hats stay soft; sits ~16 dB under the voice, ducks a further ~6 dB while speaking
    filt.append(f"[0:a]aresample=48000,aformat=channel_layouts=stereo,atempo=0.955,highshelf=f=7000:g=-4,volume=-17dB,"
                f"afade=t=out:st={DURATION - 1.2}:d=1.2[bed]")
    filt.append("[bed][vo1]sidechaincompress=threshold=0.02:ratio=4:attack=40:release=450[duck]")
    filt.append("[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                    "-ar", "48000", "-t", str(DURATION), f"{a}/mix.wav"], check=True)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", f"{a}/mix.wav", "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    print("mix:", " ".join(re.findall(r"(I:\s+[-\d.]+ LUFS|Peak:\s+[-\d.]+ dBFS)", r)[-2:]))


if __name__ == "__main__":
    main()
