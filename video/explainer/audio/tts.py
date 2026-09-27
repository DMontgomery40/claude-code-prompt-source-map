"""Voiceover: one ElevenLabs /with-timestamps call per beat (previous/next text for continuity).
Writes audio/vo/<id>.mp3 and audio/vo/<id>.json (character alignment + phrase spans)."""
import base64, json, os, sys, requests
HERE = os.path.dirname(os.path.abspath(__file__))
cfg = json.load(open(os.path.join(HERE, "vo.json")))
key = os.environ["ELEVENLABS_API_KEY"]
os.makedirs(os.path.join(HERE, "vo"), exist_ok=True)
texts = [" ".join(p[0] for p in b["phrases"]) for b in cfg["beats"]]
only = set(sys.argv[1:])
for i, b in enumerate(cfg["beats"]):
    if only and b["id"] not in only: continue
    body = {"text": texts[i], "model_id": cfg["model"], "voice_settings": cfg["settings"],
            "previous_text": texts[i - 1] if i else None, "next_text": texts[i + 1] if i + 1 < len(texts) else None}
    r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{cfg['voice']}/with-timestamps",
                      params={"output_format": "mp3_44100_192"}, headers={"xi-api-key": key}, json=body, timeout=180)
    r.raise_for_status(); d = r.json()
    open(os.path.join(HERE, "vo", b["id"] + ".mp3"), "wb").write(base64.b64decode(d["audio_base64"]))
    al = d["alignment"]
    # phrase spans: locate each phrase's characters in the text
    spans, pos = [], 0
    for p in b["phrases"]:
        s = texts[i].index(p[0], pos); e = s + len(p[0]); pos = e
        spans.append({"say": p[0], "show": p[1] if len(p) > 1 else p[0],
                      "t0": al["character_start_times_seconds"][s], "t1": al["character_end_times_seconds"][e - 1]})
    json.dump({"text": texts[i], "alignment": al, "phrases": spans}, open(os.path.join(HERE, "vo", b["id"] + ".json"), "w"), indent=1)
    print(b["id"], f"{spans[-1]['t1']:.2f}s")
