"""Prototype voice for timing the edit before the real voiceover exists: macOS `say`, one file per phrase, joined with
short gaps; word times spread by character weight inside each phrase. Same output shape as tts.py, so the edit reads
either. NOT for release: the release voice is ElevenLabs (tts.py).
  python3 tts_proto.py [beat ...]
"""
import json, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from common import private_dir  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = private_dir("video", "tour", "audio", "vo")
cfg = json.load(open(os.path.join(HERE, "vo.json")))
VOICE, RATE, GAP = "Daniel", 200, 0.14
only = set(a for a in sys.argv[1:] if not a.startswith("-"))
for b in cfg["beats"]:
    if only and b["id"] not in only: continue
    tmp = tempfile.mkdtemp()
    parts, spans, words, t = [], [], [], 0.0
    for k, p in enumerate(b["phrases"]):
        f = os.path.join(tmp, f"{k}.wav")
        subprocess.run(["say", "-v", VOICE, "-r", str(RATE), "-o", f, "--data-format=LEI16@44100", p[0]], check=True)
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
        ws = p[0].split(); tot = sum(len(w) + 1 for w in ws); c = 0
        for w in ws:
            words.append([w, round(t + d * c / tot, 3), round(t + d * (c + len(w)) / tot, 3)]); c += len(w) + 1
        spans.append({"say": p[0], "show": p[1] if len(p) > 1 else p[0], "t0": round(t, 3), "t1": round(t + d, 3)})
        parts.append(f); t += d + GAP
    lst = os.path.join(tmp, "l.txt")
    sil = os.path.join(tmp, "gap.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono", "-t", str(GAP), "-c:a", "pcm_s16le", sil], check=True)
    with open(lst, "w") as fh:
        for k, f in enumerate(parts):
            fh.write(f"file '{f}'\n")
            if k < len(parts) - 1: fh.write(f"file '{sil}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c:a", "libmp3lame", "-b:a", "192k", os.path.join(OUT, b["id"] + ".mp3")], check=True)
    json.dump({"text": " ".join(p[0] for p in b["phrases"]), "model": "proto-say", "phrases": spans, "words": words},
              open(os.path.join(OUT, b["id"] + ".json"), "w"), indent=1)
    print(b["id"], f"{spans[-1]['t1']:.2f}s")
