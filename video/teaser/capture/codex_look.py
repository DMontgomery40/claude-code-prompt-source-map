import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir, cc_session, codex_thread, CODEX_SESSIONS  # noqa: E402
import asyncio, glob, subprocess, sys
from rec import Rec
def family(pid):
    parent = glob.glob(f"{CODEX_SESSIONS}/**/*{pid or codex_thread()}.jsonl", recursive=True)
    kids = subprocess.run(["grep","-rl","--include=*.jsonl",f'"parent_thread_id":"{pid}"',str(CODEX_SESSIONS)],capture_output=True,text=True).stdout.split()
    return parent + [k for k in kids if k not in parent]
async def main():
    for pid in sys.argv[1:]:
        files = family(pid); print(pid, len(files))
        async with Rec(dpr=1) as r:
            await r.load(files)
            await r.step(20)
            await r.page.screenshot(path=f"{private_dir('video', 'teaser', 'review')}/shots/codex_{pid[:8]}.png")
asyncio.run(main())
