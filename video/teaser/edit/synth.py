"""Original soundtrack for the Trace demo: a 120 BPM dark pulse plus hit/whoosh sound design.

Everything is synthesized here (no samples, no licensed music). Event times come from
src/timeline.json so the sound always matches the edit. Output: public/soundtrack.wav
"""
import json, os
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "src", "timeline.json")))
DUR = TL["duration"]
BEAT = 60.0 / TL["bpm"]
N = int(DUR * SR)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, curve=4.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    tt = np.arange(n) / SR
    e *= np.exp(-curve * np.maximum(0, tt - a) / max(r, 1e-3))
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)


def add(buf, x, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += gain * x


# ---------- instruments ----------
def kick(d=0.5):
    t = t_(d)
    f = 42 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(len(t), 0.002, 0.32, 5)
    click = hp(rng.standard_normal(len(t)), 2500) * env(len(t), 0.0005, 0.012, 6) * 0.25
    return np.tanh(1.6 * (body + click))


def hat(d=0.06, bright=1.0):
    t = t_(d)
    return lp(hp(rng.standard_normal(len(t)), 7000), 13000) * env(len(t), 0.0008, d * 0.6, 5) * 0.22 * bright


def saw(f, t):
    return 2 * ((f * t) % 1.0) - 1


def bass_note(f, d):
    t = t_(d)
    x = saw(f, t) + 0.5 * saw(f * 1.005, t)
    dark, bright = lp(x, 180), lp(x, 1100)
    x = dark + (bright - dark) * np.exp(-t * 18)  # filter envelope
    return np.tanh(1.4 * x) * env(len(t), 0.004, d * 0.9, 3) * 0.55


def boom(d=2.8):
    t = t_(d)
    f = 30 + 70 * np.exp(-t * 7)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, d, 3.2)
    crack = lp(rng.standard_normal(len(t)), 2400) * env(len(t), 0.001, 0.22, 5) * 0.6
    tail = lp(rng.standard_normal(len(t)), 600) * env(len(t), 0.01, d, 4) * 0.25
    return np.tanh(1.3 * (sub + crack + tail))


def impact(d=1.1):
    t = t_(d)
    f = 45 + 160 * np.exp(-t * 16)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.002, d * 0.7, 4)
    snap = bp(rng.standard_normal(len(t)), 900, 6000) * env(len(t), 0.0005, 0.06, 6) * 0.7
    return np.tanh(1.5 * (sub + snap))


def tick():
    t = t_(0.09)
    x = np.sin(2 * np.pi * 1850 * t) * env(len(t), 0.0005, 0.03, 6) * 0.5
    x += hp(rng.standard_normal(len(t)), 5000) * env(len(t), 0.0003, 0.015, 6) * 0.35
    return x + 0.6 * kick(0.09) * 0.4


def whoosh(d=0.55, up=True):
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    steps = 24
    seg = len(t) // steps
    for k in range(steps):
        u = k / (steps - 1)
        c = 300 * (18 ** (u if up else 1 - u))
        lo, hi = max(60, c * 0.6), min(SR / 2 - 100, c * 1.6)
        blk = bp(n, lo, hi)[k * seg:(k + 1) * seg]
        out[k * seg:k * seg + len(blk)] = blk
    shape = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return lp(out, 9000) * shape * 0.9


def glitch(d=0.32):
    t = t_(d)
    out = np.zeros(len(t))
    k = 0
    while k < len(t):
        L = int(rng.integers(600, 2600))
        f = rng.choice([220, 440, 660, 880, 1320, 110])
        seg = np.sign(np.sin(2 * np.pi * f * t[: min(L, len(t) - k)]))
        out[k:k + len(seg)] = seg * rng.uniform(0.2, 0.6) * (rng.random() > 0.2)
        k += L
    return lp(out, 5000) * env(len(t), 0.001, d, 1.5) * 0.35


def alarm(d=0.9):
    t = t_(d)
    f = np.where((t * 8).astype(int) % 2 == 0, 880, 660)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.25 + np.sin(2 * np.pi * np.cumsum(f / 2) / SR) * 0.3
    return lp(x, 3200) * env(len(t), 0.005, d, 2.5) * 0.45


def riser(d):
    t = t_(d)
    f = 120 * (16 ** (t / d))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    nz = bp(rng.standard_normal(len(t)), 700, 7000) * 0.22
    shape = (t / d) ** 2.2
    return (tone + nz) * shape


def pad_chord(freqs, d, cutoff0=300, cutoff1=1400):
    t = t_(d)
    x = sum(saw(f, t) + saw(f * 1.004, t) + saw(f * 0.996, t) for f in freqs) / (3 * len(freqs))
    # filter sweeps slowly open over the phrase
    out = np.zeros_like(x)
    blocks = 40
    L = len(x) // blocks + 1
    for k in range(blocks):
        c = cutoff0 + (cutoff1 - cutoff0) * (k / (blocks - 1))
        out[k * L:(k + 1) * L] = lp(x, c)[k * L:(k + 1) * L]
    return out * np.minimum(1, t / 0.8) * 0.35


# ---------- arrangement ----------
music = np.zeros(N)
fx = np.zeros(N)
bed = TL["bed"]
F1 = 43.65  # F
roots = [F1 * 2, F1 * 2, F1 * 2 * 2 ** (8 / 12), F1 * 2 * 2 ** (3 / 12)]  # F F Db Ab (F minor feel)

# pad: whole piece minus the end drop, chords per 2 bars
chords = [[174.6, 207.7, 261.6], [174.6, 207.7, 261.6], [138.6, 174.6, 207.7], [155.6, 207.7, 261.6]]
bar = 4 * BEAT
t = 0.0
ci = 0
while t < bed["music_end"]:
    d = min(2 * bar, bed["music_end"] - t)
    add(music, pad_chord(chords[ci % 4], d + 0.3), t, 0.55)
    t += 2 * bar
    ci += 1

# drums and bass
b = 0
while b * BEAT < bed["music_end"] - 0.01:
    tb = b * BEAT
    in_full = bed["kick_start"] <= tb < bed["kick_end"]
    if in_full or (tb < bed["kick_start"] and b % 2 == 0):
        add(music, kick(), tb, 0.9 if in_full else 0.6)
    for s in range(4 if in_full else 2):
        th = tb + s * BEAT / (4 if in_full else 2)
        add(music, hat(bright=1.3 if s == 2 else 0.8), th, 1.0)
    if tb >= bed["bass_start"] and tb < bed["kick_end"]:
        root = roots[(b // 8) % 4]
        for s in range(2):
            add(music, bass_note(root, BEAT / 2 * 0.95), tb + s * BEAT / 2, 0.8 if s else 0.55)
    b += 1

# sidechain-ish duck on each beat inside the full section
duck = np.ones(N)
b = 0
while b * BEAT < DUR:
    tb = b * BEAT
    if bed["kick_start"] <= tb < bed["kick_end"]:
        i = int(tb * SR)
        L = int(0.22 * SR)
        duck[i:i + L] = np.minimum(duck[i:i + L], 0.45 + 0.55 * np.linspace(0, 1, len(duck[i:i + L])) ** 0.7)
    b += 1
music *= duck

# sound design events
for ev in TL["sfx"]:
    k, at = ev["type"], ev["t"]
    g = ev.get("gain", 1.0)
    if k == "boom": add(fx, boom(), at, 0.9 * g)
    elif k == "impact": add(fx, impact(), at, 0.8 * g)
    elif k == "tick": add(fx, tick(), at, 0.7 * g)
    elif k == "whoosh": add(fx, whoosh(ev.get("d", 0.55)), at - ev.get("d", 0.55) * 0.6, 0.8 * g)
    elif k == "whoosh_down": add(fx, whoosh(ev.get("d", 0.7), up=False), at, 0.7 * g)
    elif k == "glitch": add(fx, glitch(), at, 0.9 * g)
    elif k == "alarm": add(fx, alarm(), at, 0.8 * g)
    elif k == "riser": add(fx, riser(ev["d"]), at - ev["d"], 0.8 * g)

# end card: the F minor chord rings out under the URLs
end_t = bed["music_end"]
add(music, pad_chord([87.3, 174.6, 207.7, 261.6], DUR - end_t, cutoff0=900, cutoff1=500) * np.linspace(1, 0, int((DUR - end_t) * SR)) ** 0.8, end_t, 0.7)

# master: gentle fade in, music out at the end drop, fx tail kept
fade_in = np.minimum(1, np.arange(N) / (0.04 * SR))
mix = (music * 0.55 + fx * 0.8) * fade_in
end_fade = np.ones(N)
i0 = int((DUR - 0.8) * SR)
end_fade[i0:] = np.linspace(1, 0, N - i0) ** 1.5
mix *= end_fade
# soft limiter to about -1 dBFS
peak = np.max(np.abs(mix)) or 1
mix = np.tanh(1.2 * mix / peak) / np.tanh(1.2) * 0.89
stereo = np.stack([mix, mix], axis=1)
# a little width: delay the right channel of the pad-heavy music by 9 ms
d = int(0.009 * SR)
stereo[d:, 1] = 0.7 * stereo[d:, 1] + 0.3 * mix[:-d]
os.makedirs(os.path.join(HERE, "public"), exist_ok=True)
out = os.path.join(HERE, "public", "soundtrack.wav")
import wave
with wave.open(out, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes())
import subprocess, shutil
tmp = out + ".norm.wav"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-af", "loudnorm=I=-14:TP=-1.2:LRA=11", "-ar", str(SR), tmp], check=True)
shutil.move(tmp, out)
print("wrote", out, f"{DUR}s, normalized to -14 LUFS")
