# Trace explainer (86.5 s)

> **Where things live now (harness-source-map, 2026-09-27).** This folder holds the pipeline's code only.
> Footage, frames, audio renders and the final MP4s live under the repo's gitignored `private/video/explainer/`, and the
> frozen sessions under `private/sessions/`. Scripts find them through `video/common.py`: set
> `TRACE_CC_SESSION` (and, for the teaser's Codex/ChatGPT beat, `TRACE_CODEX_THREAD`). Trace is served from this
> repo's `site/dist` (`npm run build`). Paths and ports below are as they were when the video was made.
>
> **Superseded framing.** This video's central beat ("the model re-reads the whole pile"), the grains and the token
> volume framing are the angle David rejected on 2026-09-27. Trace is about harness transparency: what the harness
> put in front of the model, where it came from and why. Don't reuse that framing.


The calm follow-up to `video/teaser` (the 30 s teaser). Its job is to leave a viewer knowing what
Trace does and why they would want it: what filled the context, what got sent twice, and what the agent
did on their behalf. It has a voiceover, a light music bed and burned-in captions for muted feeds.

Deliverables (X-ready: H.264 High, yuv420p/bt709, 60 fps, AAC 48 kHz, -14 LUFS):
- `trace-explainer-16x9.mp4` (1920x1080)
- `trace-explainer-4x5.mp4` (1080x1350, mobile feed)

## What it shows, in order
1. The whole UI at the overview: 1,656 requests, 90 subagents (narrow panel).
2. Cinematic side view: time runs left to right, height is context, colours are sources.
3. **Space**: real 1x playback, the grain pour and the re-read sweep (requests 1329-1360, 870k-913k).
4. The third compaction, 969k -> 89k: the grain column collapses (2x native slow motion, labelled).
5. **/ Tab Tab Tab** `CLAUDE.md` **Enter**, **n**, **n**: the file traced copy by copy (94x, 91 agents).
6. **w**: the panel widens and the reader shows the exact text.
7. Wide panel, the main thread's setup list: CLAUDE.md sent 6x, sent again 2x while an identical copy was still in context.
8. **2**, **j**, **Enter**: what left the machine (96), a deploy and its custody ladder (asked by / bypassPermissions).
9. **4**: subagent spend; the advisor used 7.3M fresh tokens.
10. **1 2 3 4 1**, **?**: every view is one key away; the shortcut sheet.
11. End card: runs entirely in the browser; ccprompts.dtmont.com/trace and gpt6aeon.dtmont.com/trace.

Every number on screen or in the voiceover was read from the tool (the shipped build, ccprompts `1d1b5ad`) in
the same state it is shown.

## Pipeline
1. **Viewer copy**: `git archive` of ccprompts `site/trace` plus its built `reference-index.json`, served from
   session scratch on :8860. One added line in `scene.js` exposes `window.__rec` (camera handle) under `?rec`.
2. **Capture** (`capture/`): `shots.py` drives Trace in headless Chromium on virtual time (`rec.py`), 3840x2160
   (dpr 2), every key a real key press. Each shot writes `footage/<shot>.mp4` and `footage/<shot>.json`
   (key presses by frame, UI rects in source px, the pour point per frame, slow-motion frames).
   Data: the frozen Claude Code session `9969db93` in `private/sessions/claude-code/` (private; never publish).
3. **Voice** (`audio/`): `vo.json` is the script (spoken form + caption form per phrase); `tts.py` calls
   ElevenLabs `/with-timestamps` (voice Eric, eleven_multilingual_v2) per beat. Checked back with Whisper.
4. **Music**: ElevenLabs Music, `audio/music_bed.mp3` (88 s, instrumental), slowed 4.5% in the mix so its
   ending lands on the end card, ducked under the voice.
5. **Edit** (`edit/`): `build_timeline.py` is the single plan (section cuts, VO times) -> `src/timeline.json`
   (captions with word timing, key caps) and `audio/mix.wav`. Remotion reads the capture frames over
   http :8861 (the scratch `frames/` dir), so nothing is copied into `public/`.

## Rebuild
```sh
cd capture && DPR=2 python3 shots.py all            # needs the :8860 viewer copy
cd ../edit && python3 build_timeline.py --audio && npx tsc -p .
npx remotion render src/index.ts Wide out/wide.mp4 --codec h264 --crf 16
npx remotion render src/index.ts Tall out/tall.mp4 --codec h264 --crf 16
# mux + transcode: see mux.sh
```

Note: the edit reads the capture's JPG frames from session scratch (`frames/`, served on :8861), which is
cleared with the session. Re-editing later means re-running `capture/shots.py all` first (about 10 minutes at
4K; the footage MP4s in `footage/` are the same takes, kept for reference).
