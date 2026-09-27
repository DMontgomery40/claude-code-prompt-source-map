import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from common import private_dir  # noqa: E402
import asyncio, json, sys, subprocess
from rec import Rec, cc_files, CAM_JS
SH=private_dir("video", "teaser", "shots") + "/"
POSES = json.loads(sys.argv[2]); name = sys.argv[1]
async def main():
    async with Rec(dpr=1) as r:
        await r.load(cc_files()); await r.js(CAM_JS); await r.js("window.__cam.save()")
        if "clean" in name: await r.clean()
        outs=[]
        for k,(p,t) in enumerate(POSES):
            await r.js("([p,t])=>window.__cam.set(p,t)", [p,t]); await r.step(3)
            f=f"{SH}{name}_{k}.png"; await r.page.screenshot(path=f); outs.append(f)
    args=[]; 
    for f in outs: args += ["-i", f]
    n=len(outs); cols=2
    subprocess.run(["ffmpeg","-y","-loglevel","error",*args,"-filter_complex","".join(f"[{i}]scale=960:-1[v{i}];" for i in range(n))+"".join(f"[v{i}]" for i in range(n))+f"xstack=inputs={n}:layout="+"|".join(f"{(i%cols)*960}_{(i//cols)*540}" for i in range(n))+":fill=black", "-frames:v","1",f"{SH}{name}_sheet.png"],check=True)
asyncio.run(main())
