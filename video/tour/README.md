# Harness Source Map tour (154 s)

The follow-up to `video/explainer`. It tells a story (SCRIPT.md): why your agent does what it does, where that text
comes from (the source maps), proof in your own session (Trace in 3D), and what even the session log hides (a
network capture). It has a voiceover, a music bed and burned-in captions.

Deliverables (H.264 High, yuv420p/bt709, 60 fps, AAC 48 kHz, about -14 LUFS), under `private/video/tour/`:
- `trace-tour-16x9.mp4` (1920x1080)
- `trace-tour-4x5.mp4` (1080x1350, mobile feed)

> Footage, frames, audio renders and the MP4s live under the repo's gitignored `private/video/tour/`. This folder
> holds code and the script only. Nothing here may name a private session, path or id: `common.py` reads them
> from the environment (see below).

Left out on purpose: the harness layer view (`h`, the toolbar's Harness button, the hero cards and the weaving
wire), grains, the re-read framing (AGENTS.md), lenses 3 and 4.

## Pipeline
1. **Viewer** (`capture/viewer.py`): a copy of `site/dist` (`npm run build` first) with one added line in
   `trace/scene.js` that exposes the camera as `window.__rec` under `?rec`, served on :8860.
2. **Capture** (`capture/`): Playwright drives the viewer and the docs pages on virtual time (`rec.py`), 3840x2160
   (DPR 2), every key a real key press, a drawn cursor for clicks. `shot.py` is the shared `Shot` (frames, key
   log, rects, marks). `shots_trace.py` (Trace), `shots_docs.py` (landing and docs pages), `shots_net.py` (network
   layer). `DPR=1` makes a preview (`<shot>_p` outputs, never replacing a final).
   **Privacy.** Every 4 frames each take logs where any forbidden value sits on screen (`common.leak_values()`:
   the set tools/leak-check.mjs forbids: home path, user name, private session ids, capture identities); the edit
   blurs those boxes. The docs and network shots also fail outright (`Rec.leaks()`) if one is in the page text.
3. **Voice** (`audio/`): `vo.json` is the script (spoken form and caption form per phrase); `tts.py` calls
   ElevenLabs `/with-timestamps` per beat (model `eleven_v4_turbo`; the v4 models ignore `speed`, so `tempo`
   speeds the audio up afterwards and the word times follow). `tts_proto.py` is a local stand-in for timing only.
   `music.py` makes the bed with ElevenLabs Music. The key is read from the environment or the repo's gitignored `.env`.
4. **Edit** (`edit/`): `build_timeline.py` is the single plan. Each section names a take, a voiceover beat and
   anchors (a moment in the take pinned to a word), so a click lands on the word that names it; holds and jump
   cuts skip dead time. It writes `src/timeline.json` and `audio/mix.wav`. Remotion (`src/Video.tsx`) draws the
   opening graphic, the legend overlay, the part chip and the end card, fits focus rectangles to 16:9 or 4:5,
   blurs the logged forbidden values, and reads the frames over http :8861.

## Inputs
```sh
TRACE_CC_SESSION=<frozen Claude Code session folder under private/sessions/claude-code>   # optional if it is the only one
TRACE_NET_CC_SESSION=<session .jsonl of a captured run>   # the network beat (its subagents/ folder is picked up)
TRACE_NET_CC_HAR=<the HAR captured during that run>       # see tools/capture/README.md
```

## Rebuild
```sh
npm run build                                       # site/dist
cd video/tour/capture && python3 viewer.py --build   # then serve private/video/tour/viewer on :8860
DPR=2 python3 shots_trace.py all; DPR=2 python3 shots_docs.py all; DPR=2 python3 shots_net.py all
# (network shots also need TRACE_NET_CC_SESSION and TRACE_NET_CC_HAR)
(cd ../../../private/video/tour/frames && python3 -m http.server 8861 --bind 127.0.0.1) &
cd ../audio && python3 tts.py && python3 music.py 155   # music: about the video's length
cd ../edit && python3 build_timeline.py --audio && npx tsc -p .
npx remotion render src/index.ts Wide out/wide.mp4 --codec h264 --crf 16
npx remotion render src/index.ts Tall out/tall.mp4 --codec h264 --crf 16
./mux.sh
```

Every number on screen or in the voiceover is read from the tool in the same shot: 1 d 4 h and 90 subagents, request
947's column (You ≈ 8.1k 9%, Harness ≈ 44k 47%), 94 copies of CLAUDE.md sent to 91 agents, Left the machine (96),
"Attached: 43 requests, 4 model calls (4 in your log)", the 156-char billing header, Tools as sent (18), the
45,107-char mid-conversation system message, the token on 2 Anthropic hosts, 728 flags.
