import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Box, C, KeyCap, Key, MONO, SANS, Shot, Source, Vignette, clamp, easeOut, fitKey, srcFrame } from "./lib";
import RAW from "./timeline.json";

// The tour is a story in four parts (SCRIPT.md). Footage sections are one take each: a time map (which source
// frame shows when), a camera (focus rectangles in source pixels, fitted per format), highlight boxes, and blur
// boxes over any forbidden value the capture found on screen. The hook section is drawn here, not filmed.
type Cam = { f: number; r: number[]; tall?: number[]; pad?: number; maxZ?: number };
type BoxSpec = { r: number[]; t0: number; t1: number; color?: string; spot?: number; pad?: number };
type Sec = {
  id: string; kind: "footage" | "hook"; shot?: string; from: number; to: number; n?: number; map?: number[][];
  cam?: Cam[]; boxes?: BoxSpec[]; leaks?: [number, number[][]][]; cues?: Record<string, number>;
  overlay?: "legend"; card?: boolean; cont?: boolean; grade?: string;
};
type TLT = {
  fps: number; duration: number; sections: Sec[]; chips: [number, string][];
  captions: { t0: number; t1: number; text: string; words: [string, number, number][] }[];
  keys: { t: number; k: string }[]; frames: Record<string, string>; cardAt: number;
};
const TL = RAW as unknown as TLT;
const FPS = TL.fps;
const XF = 8; // cross-dissolve frames between sections

const COLORS: Record<string, string> = { lime: C.lime, pink: C.pink, red: C.red, blue: C.blue, amber: C.amber, grey: C.grey };
const ease = (f: number, a: number, d = 14) => interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: easeOut });

// ---------------------------------------------------------------- footage

// Blur over every forbidden value (home path, private session ids, capture identities) the take logged, in
// source space so it follows the camera. A sample holds until the next one.
const Redact: React.FC<{ s: Sec; source: Source }> = ({ s, source }) => {
  const f = useCurrentFrame();
  const L = s.leaks;
  if (!L || !L.length) return null;
  const g = srcFrame(source, f);
  let k = -1;
  for (let i = 0; i < L.length; i++) { if (L[i][0] <= g) k = i; else break; }
  // samples are LEAK_EVERY (4) frames apart: a value can appear up to 3 frames before its first sample, so the
  // next change's boxes are drawn early too
  const next = k + 1 < L.length && L[k + 1][0] - g <= 4 ? L[k + 1][1] : [];
  const rects = [...(k >= 0 ? L[k][1] : []), ...next];
  return (
    <>
      {rects.map((r, i) => (
        <div key={i} style={{
          position: "absolute", left: r[0] - 8, top: r[1] - 6, width: r[2] - r[0] + 16, height: r[3] - r[1] + 12, borderRadius: 10,
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", background: "rgba(16,22,30,0.55)",
        }} />
      ))}
    </>
  );
};

const FootageView: React.FC<{ s: Sec; tall: boolean }> = ({ s, tall }) => {
  const { width: W, height: H } = useVideoConfig();
  const keys: Key[] = (s.cam ?? []).map((k) => ({ f: k.f, ...fitKey(tall && k.tall ? k.tall : k.r, W, H, k.pad ?? 1.05, k.maxZ ?? 3.6) }));
  const source: Source = { dir: TL.frames[s.shot!], n: s.n!, map: s.map! };
  return (
    <Shot source={source} keys={keys} grade={s.grade}>
      <Redact s={s} source={source} />
      {(s.boxes ?? []).map((b, i) => (
        <Box key={i} rect={b.r} at={b.t0} out={b.t1} color={COLORS[b.color ?? ""] ?? b.color ?? C.focus} spotlight={b.spot ?? 0} padding={b.pad ?? 8} />
      ))}
    </Shot>
  );
};

// ---------------------------------------------------------------- 1. the hook: what the model receives

// harness: text the harness writes (the documented/undocumented question is about these); yours: your own text it re-sends
const SLABS: { label: string; note: string; color: string; h: number; cue: string; harness?: boolean }[] = [
  { label: "system prompt", note: "the harness's own instructions", color: C.grey, h: 1.25, cue: "s0", harness: true },
  { label: "tool definitions", note: "every tool, with rules for using it", color: C.grey, h: 1.15, cue: "s1", harness: true },
  { label: "reminders between your turns", note: "plan mode, file changes, and more", color: C.pink, h: 1.0, cue: "s2", harness: true },
  { label: "skills and plugins", note: "what's installed, described to the model", color: C.pink, h: 0.9, cue: "s3" },
  { label: "MCP server instructions", note: "how to use each connected server", color: C.pink, h: 0.9, cue: "s4" },
  { label: "hook output", note: "whatever your hooks print", color: C.pink, h: 0.8, cue: "s5" },
  { label: "your CLAUDE.md, again", note: "re-sent to every agent", color: C.lime, h: 0.8, cue: "s6" },
];
const TYPED = "fix the failing test";

const Hook: React.FC<{ s: Sec; tall: boolean }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const cue = (k: string) => s.cues?.[k] ?? 0;
  const W = tall ? 1080 : 1920, H = tall ? 1350 : 1080;
  const stackW = tall ? 940 : 1180, unit = tall ? 92 : 78, gap = tall ? 10 : 8;
  const chatY = tall ? 1000 : 730, chatH = tall ? 88 : 78;
  const nChars = Math.max(0, Math.min(TYPED.length, Math.floor((f - cue("type")) / 3)));
  const caret = f < cue("type") + TYPED.length * 3 + 30 && Math.floor(f / 16) % 2 === 0;
  const tagsAt = cue("tags");
  const head = ease(f, cue("s0") - 4, 16);
  let y = chatY - 34;
  const placed = SLABS.map((sl) => { const h = sl.h * unit; y -= h + gap; return { ...sl, y, hh: h }; });
  const fadeOut = interpolate(f, [s.to - s.from - 10, s.to - s.from + XF], [1, 0.0], clamp);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #111a24 0%, ${C.bg} 70%)`, opacity: fadeOut }}>
      {/* what the model receives */}
      <div style={{ position: "absolute", left: (W - stackW) / 2, top: placed[placed.length - 1].y - (tall ? 70 : 60), opacity: head, fontFamily: MONO, fontWeight: 800, fontSize: tall ? 30 : 28, letterSpacing: 3, color: C.muted }}>
        WHAT THE MODEL RECEIVES
      </div>
      {placed.map((sl, i) => {
        const p = ease(f, cue(sl.cue), 12);
        const tag = sl.harness ? ease(f, tagsAt + i * 4, 10) : 0;
        return (
          <div key={sl.label} style={{
            position: "absolute", left: (W - stackW) / 2, top: sl.y + (1 - p) * -40, width: stackW, height: sl.hh, opacity: p,
            display: "flex", alignItems: "center", gap: 22, padding: "0 26px", boxSizing: "border-box", borderRadius: 14,
            background: `linear-gradient(90deg, ${sl.color}33, ${sl.color}14)`, border: `1px solid ${sl.color}55`, borderLeft: `8px solid ${sl.color}`,
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: tall ? 36 : 34, color: C.white, whiteSpace: "nowrap" }}>{sl.label}</div>
            <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: tall ? 24 : 24, color: C.muted, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tall ? "" : sl.note}</div>
            <div style={{ opacity: tag, transform: `scale(${0.8 + 0.2 * tag})`, fontFamily: MONO, fontWeight: 800, fontSize: tall ? 22 : 20, color: "#1a1406", background: C.amber, borderRadius: 999, padding: "5px 14px", whiteSpace: "nowrap" }}>undocumented</div>
          </div>
        );
      })}
      {/* what you typed */}
      <div style={{ position: "absolute", left: (W - stackW) / 2, top: chatY + chatH + 16, fontFamily: MONO, fontWeight: 800, fontSize: tall ? 26 : 24, letterSpacing: 3, color: C.lime }}>WHAT YOU TYPED</div>
      <div style={{
        position: "absolute", left: (W - stackW) / 2, top: chatY, width: stackW, height: chatH, boxSizing: "border-box", borderRadius: 16,
        border: `2px solid ${C.lime}`, background: "rgba(200,247,132,0.08)", display: "flex", alignItems: "center", padding: "0 28px",
        fontFamily: SANS, fontWeight: 700, fontSize: tall ? 40 : 38, color: C.white, boxShadow: `0 0 40px rgba(200,247,132,0.15)`,
      }}>
        <span style={{ color: C.lime, marginRight: 18, fontFamily: MONO }}>›</span>{TYPED.slice(0, nChars)}
        <span style={{ opacity: caret ? 1 : 0, marginLeft: 2, color: C.lime }}>▍</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 7. what the landscape shows

const LEGEND: { cue: string; label: string; note: string; c: string }[] = [
  { cue: "gray", label: "Harness", note: "its system prompt and tools", c: C.grey },
  { cue: "pink", label: "Injected", note: "reminders, skills, MCP, hooks", c: C.pink },
  { cue: "green", label: "You", note: "your messages, CLAUDE.md, memory", c: C.lime },
  { cue: "rest", label: "Outside", note: "files, commands, web pages", c: C.orange },
  { cue: "rest", label: "Agents", note: "subagent reports", c: C.blue },
  { cue: "rest", label: "Model", note: "its own earlier replies", c: C.purple },
];

const LegendOverlay: React.FC<{ s: Sec; tall: boolean }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const cue = (k: string) => s.cues?.[k] ?? 0;
  const W = tall ? 1080 : 1920;
  const a1 = ease(f, cue("time"), 36), a2 = ease(f, cue("height"), 30), lg = ease(f, cue("gray") - 6, 14);
  const fadeAll = interpolate(f, [s.to - s.from - 16, s.to - s.from + 4], [1, 0], clamp);
  const topY = tall ? 120 : 112, leftX = tall ? 70 : 110, axisTop = tall ? 250 : 250, axisBottom = tall ? 740 : 840;
  const lab: React.CSSProperties = { position: "absolute", fontFamily: MONO, fontWeight: 800, fontSize: tall ? 30 : 32, color: C.white, letterSpacing: 2, textShadow: "0 2px 14px #000, 0 0 4px #000" };
  return (
    <AbsoluteFill style={{ opacity: fadeAll }}>
      <div style={{ position: "absolute", left: leftX, top: topY + 44, width: (W - 2 * leftX) * a1, height: 4, background: C.white, opacity: 0.9, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: leftX + (W - 2 * leftX) * a1 - 18, top: topY + 31, width: 0, height: 0, borderTop: "15px solid transparent", borderBottom: "15px solid transparent", borderLeft: `26px solid ${C.white}`, opacity: a1 > 0.02 ? 0.9 : 0 }} />
      <div style={{ ...lab, left: leftX, top: topY - 6, opacity: a1 }}>TIME →</div>
      <div style={{ position: "absolute", left: leftX - 40, top: axisBottom - (axisBottom - axisTop) * a2, width: 4, height: (axisBottom - axisTop) * a2, background: C.white, opacity: 0.9, borderRadius: 2 }} />
      <div style={{ position: "absolute", left: leftX - 53, top: axisBottom - (axisBottom - axisTop) * a2 - 20, width: 0, height: 0, borderLeft: "15px solid transparent", borderRight: "15px solid transparent", borderBottom: `26px solid ${C.white}`, opacity: a2 > 0.02 ? 0.9 : 0 }} />
      <div style={{ ...lab, left: leftX - 12, top: axisTop - 50, opacity: a2 }}>TEXT IN FRONT OF THE MODEL</div>
      <div style={{ position: "absolute", ...(tall ? { left: 44, right: 44, bottom: 210 } : { right: 56, top: 250 }), display: "flex", flexDirection: "column", gap: tall ? 10 : 12,
        padding: "20px 28px 22px", background: "rgba(6,8,12,0.9)", borderRadius: 22, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", opacity: lg }}>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: tall ? 24 : 24, letterSpacing: 3, color: C.muted }}>COLOUR = WHERE THE TEXT CAME FROM</div>
        {LEGEND.map((c) => {
          const p = ease(f, cue(c.cue) - 3, 12);
          const key = c.cue !== "rest";
          return (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 16, opacity: p * (key ? 1 : 0.8), transform: `translateX(${(1 - p) * 24}px)` }}>
              <div style={{ width: key ? 38 : 28, height: key ? 38 : 28, borderRadius: 9, background: c.c, boxShadow: key ? `0 0 22px ${c.c}88` : "none", flex: "none" }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: key ? (tall ? 36 : 38) : (tall ? 28 : 28), color: C.white, lineHeight: 1 }}>{c.label}</div>
                <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: key ? (tall ? 24 : 25) : (tall ? 21 : 21), color: C.muted }}>{c.note}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- end card

const EndCard: React.FC<{ s: Sec; tall: boolean }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const t0 = Math.round(TL.cardAt * FPS) - s.from;
  const card = ease(f, t0, 24);
  const row = (label: string, url: string, d: number) => {
    const p = ease(f, t0 + d, 16);
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, flexDirection: tall ? "column" : "row", ...(tall ? { gap: 2, alignItems: "center" } : {}) }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: tall ? 30 : 30, color: C.muted, minWidth: tall ? 0 : 300, textAlign: tall ? "center" : "right" }}>{label}</span>
        <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: tall ? 38 : 40, color: C.white }}>{url}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Vignette strength={0.6} />
      <AbsoluteFill style={{ background: `rgba(4,6,10,${0.76 * card})` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: tall ? 28 : 24, opacity: card, paddingBottom: tall ? 100 : 70 }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: tall ? 100 : 118, color: C.white, letterSpacing: -2, display: "flex", alignItems: "center", gap: 24, textAlign: "center" }}>
          <span style={{ color: C.lime }}>≋</span> Harness Source Map
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: tall ? 44 : 48, color: C.ink, textAlign: "center", maxWidth: tall ? 900 : 1500 }}>See what your agent was really told.</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: tall ? 28 : 30, color: C.lime, textAlign: "center", marginBottom: 12, maxWidth: tall ? 900 : 1500 }}>For people who use and audit AI coding agents · Trace runs in your browser, nothing is uploaded</div>
        {row("Claude Code", "harness.dtmont.com/claude-code", 18)}
        {row("Codex/ChatGPT", "harness.dtmont.com/codex", 28)}
        {row("Trace", "harness.dtmont.com/trace", 38)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- overlays

// Where we are: a small chip, top-left, that changes with the part of the story.
const Chip: React.FC<{ tall: boolean }> = ({ tall }) => {
  const f = useCurrentFrame();
  let cur: [number, string] | null = null;
  for (const c of TL.chips) if (c[0] <= f) cur = c;
  if (!cur || !cur[1] || f >= Math.round(TL.cardAt * FPS)) return null;
  // shown as each part begins, then out of the way: it would otherwise sit on page content
  const a = ease(f, cur[0], 12) * interpolate(f, [cur[0] + 170, cur[0] + 190], [1, 0], clamp);
  if (a <= 0) return null;
  const [part, rest] = cur[1].split(" · ");
  return (
    <div style={{
      position: "absolute", left: tall ? 36 : 44, top: tall ? 36 : 40, opacity: a, transform: `translateY(${(1 - a) * -8}px)`,
      display: "flex", alignItems: "center", gap: 12, padding: tall ? "10px 20px" : "10px 20px", borderRadius: 999,
      background: "rgba(6,8,12,0.86)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
      fontFamily: SANS, fontWeight: 800, fontSize: tall ? 28 : 26, color: C.white,
    }}>
      <span style={{ color: C.lime }}>≋</span>{part}{rest ? <span style={{ color: C.muted, fontWeight: 700 }}>· {rest}</span> : null}
    </div>
  );
};

const Captions: React.FC<{ tall: boolean }> = ({ tall }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = TL.captions.find((x) => t >= x.t0 && t < x.t1);
  if (!c || t >= TL.cardAt) return null;
  const a = interpolate(t, [c.t0, c.t0 + 0.1], [0, 1], clamp);
  const words = c.text.split(" ");
  const spoken = c.words.length ? (t - Number(c.words[0][1])) / Math.max(0.01, Number(c.words[c.words.length - 1][2]) - Number(c.words[0][1])) : 1;
  const cur = Math.min(words.length - 1, Math.floor(Math.max(0, spoken) * words.length));
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: tall ? 64 : 46, transform: `translateX(-50%) translateY(${(1 - a) * 8}px)`, opacity: a,
      maxWidth: tall ? 980 : 1560, width: "max-content", textAlign: "center",
      background: "rgba(6,8,12,0.84)", borderRadius: 18, padding: tall ? "14px 26px" : "12px 28px",
      fontFamily: SANS, fontWeight: 800, fontSize: tall ? 48 : 44, lineHeight: 1.18, color: C.white,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {words.map((w, i) => (
        <span key={i} style={{ color: i === cur && spoken <= 1.02 ? C.lime : C.white }}>{w}{i < words.length - 1 ? " " : ""}</span>
      ))}
    </div>
  );
};

const KeyCaps: React.FC<{ tall: boolean }> = ({ tall }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const LIFE = 1.1;
  const live = TL.keys.filter((k) => t >= k.t && t < k.t + LIFE);
  if (!live.length) return null;
  const groups: { k: string; t: number; n: number }[] = [];
  for (const k of live) {
    const g = groups[groups.length - 1];
    if (g && g.k === k.k && k.t - g.t < 0.5) { g.n++; g.t = k.t; } else groups.push({ k: k.k, t: k.t, n: 1 });
  }
  return (
    <div style={{ position: "absolute", left: tall ? 44 : 60, bottom: tall ? 230 : 150, display: "flex", gap: 14, alignItems: "center" }}>
      {groups.slice(-4).map((g, i) => {
        const age = t - g.t;
        const pop = interpolate(age, [0, 0.08, 0.2], [0.6, 1.12, 1], clamp);
        const o = interpolate(age, [0, 0.05, LIFE - 0.25, LIFE], [0, 1, 1, 0], clamp);
        const glow = interpolate(age, [0, 0.35], [1, 0], clamp);
        return (
          <div key={i + g.k + g.t} style={{ transform: `scale(${pop})`, opacity: o, display: "flex", alignItems: "center", gap: 10 }}>
            <KeyCap label={g.k} size={tall ? 1.05 : 1} glow={glow} />
            {g.n > 1 && <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: 30, color: C.muted }}>×{g.n}</span>}
          </div>
        );
      })}
    </div>
  );
};

const Fade: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const f = useCurrentFrame();
  const o = frames ? interpolate(f, [0, frames], [0, 1], clamp) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const FadeOut: React.FC = () => {
  const f = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = interpolate(f, [durationInFrames - 40, durationInFrames - 2], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{ background: "#000", opacity: o }} /> : null;
};

export const Tour: React.FC<{ tall: boolean }> = ({ tall }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {TL.sections.map((s, i) => {
        const last = i === TL.sections.length - 1;
        const dur = Math.min(durationInFrames - s.from, s.to - s.from + (last ? 0 : XF));
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={dur}>
            <Fade frames={i === 0 || s.cont ? 0 : XF}>
              {s.kind === "hook" ? <Hook s={s} tall={tall} /> : <FootageView s={s} tall={tall} />}
              {s.overlay === "legend" && <LegendOverlay s={s} tall={tall} />}
              {s.card && <EndCard s={s} tall={tall} />}
            </Fade>
          </Sequence>
        );
      })}
      <Chip tall={tall} />
      <KeyCaps tall={tall} />
      <Captions tall={tall} />
      <FadeOut />
    </AbsoluteFill>
  );
};
