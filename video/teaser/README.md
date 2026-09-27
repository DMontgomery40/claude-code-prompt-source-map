# Trace 30-second demo

> **Where things live now (harness-source-map, 2026-09-27).** This folder holds the pipeline's code only.
> Footage, frames, audio renders and the final MP4s live under the repo's gitignored `private/video/teaser/`, and the
> frozen sessions under `private/sessions/`. Scripts find them through `video/common.py`: set
> `TRACE_CC_SESSION` (and, for the teaser's Codex/ChatGPT beat, `TRACE_CODEX_THREAD`). Trace is served from this
> repo's `site/dist` (`npm run build`). Paths and ports below are as they were when the video was made.
>
> **Superseded framing.** This video's central beat ("the model re-reads the whole pile"), the grains and the token
> volume framing are the angle David rejected on 2026-09-27. Trace is about harness transparency: what the harness
> put in front of the model, where it came from and why. Don't reuse that framing.


Deliverables (X-ready: H.264 High, yuv420p/bt709, 60 fps, AAC, -14 LUFS):
- `trace-demo-16x9.mp4` (1920x1080)
- `trace-demo-4x5.mp4` (1080x1350, mobile feed)

## Pipeline

1. **Footage** (`capture/`): Playwright drives a local copy of Trace (served from session scratch at
   `http://127.0.0.1:8765/trace/?rec=1`) on virtual time (`rec.py` replaces `performance.now` and
   `requestAnimationFrame`), so every captured frame advances exactly 1/60 s. Capture is 3840x2160 (dpr 2)
   for crisp punch-ins. `shots.py` defines every shot; `rects.py`/`rects2.py` dump source-pixel rectangles of
   the UI rows the edit highlights into `edit/src/rects.json`.
   - The recorded copy adds one line to `scene.js`: `window.__rec` (camera handle) when `?rec` is present.
     Nothing else differs from the live `/trace/` build (checked byte-for-byte on 2026-09-26).
   - Data: a frozen copy of Claude Code session `9969db93…` in `data/cc/` (the live session kept growing),
     plus a Codex/ChatGPT rollout family. `data/` is private: never publish it.
2. **Edit** (`edit/`): Remotion. `src/Video.tsx` holds the nine sections, `src/lib.tsx` the camera
   (punch-ins over the 4K frames), highlight boxes, kinetic type and flashes. `src/timeline.json` is the
   single source of section and sound-effect timing.
3. **Sound** (`edit/synth.py`): an original synthesized 120 BPM bed plus hits, whooshes and a riser (no
   samples, no licensed music), driven by `timeline.json`, normalized to -14 LUFS.

## Rebuild

```sh
cd capture && python3 shots.py all            # needs the scratch server; re-extract seq/ afterwards
cd ../edit && python3 synth.py && npx tsc -p .
npx remotion render src/index.ts Wide out/trace-demo-16x9.mp4 --codec h264 --crf 14
npx remotion render src/index.ts Tall out/trace-demo-4x5.mp4 --codec h264 --crf 14
# then transcode to yuv420p/bt709 (Remotion writes full-range yuvj420p); see the ffmpeg line in the session notes
```

Every on-screen number is read from the tool's own UI in the same shot: 1 d 4 h, 1,656 requests, 90
subagents, compacted 969k → 89k, Injected ≈ 97k, CLAUDE.md sent 6× / sent again identical, Left the machine
(96), custody ladder (Asked by / Permitted by bypassPermissions / In view), advisor 7.3M fresh,
Codex skills list (131) sent again 24×.
