"""The viewer the tour films: a copy of site/dist (run `npm run build` first) with one added line in
trace/scene.js that exposes the camera as window.__rec when the URL has ?rec. Nothing else differs from
the live build. Copies into private/video/tour/viewer and serves it on :8860 (TRACE_VIEWER's default).

  python3 viewer.py          build the copy, then serve it until interrupted
  python3 viewer.py --build  build the copy only
"""
import os, shutil, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
from common import REPO, private_dir  # noqa: E402

HOOK = 'if (new URLSearchParams(location.search).has("rec")) window.__rec = { camera, controls, THREE, scene, dirty: () => { dirty = 3; } };\n'
ANCHOR = "  raf = requestAnimationFrame(frame);\n\n  return {"

dest = private_dir("video", "tour", "viewer")
subprocess.run(["rsync", "-a", "--delete", str(REPO / "site" / "dist") + "/", dest + "/"], check=True)
scene = os.path.join(dest, "trace", "scene.js")
src = open(scene).read()
if src.count(ANCHOR) != 1:
    raise SystemExit("trace/scene.js changed: fix the anchor in viewer.py")
open(scene, "w").write(src.replace(ANCHOR, "  " + HOOK + ANCHOR))
print("viewer copy:", dest)
if "--build" not in sys.argv:
    os.chdir(dest)
    subprocess.run([sys.executable, "-m", "http.server", "8860", "--bind", "127.0.0.1"])
