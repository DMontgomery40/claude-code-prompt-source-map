import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Box, C, KeyCap, Key, MONO, SANS, Scrim, Shot, Source, Vignette, clamp, easeOut } from "./lib";
import TL from "./timeline.json";

type Sec = (typeof TL.sections)[number];
type Tall = { tall: boolean };
const FPS = TL.fps;
const XF = 10; // cross-dissolve frames between sections
const secOf = (id: string) => TL.sections.find((s) => s.id === id)!;
const rectOf = (s: Sec, tag: string): number[] | null => ((s.rects as Record<string, { r: number[] }>)[tag]?.r) ?? null;
const mid = (r: number[]) => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
const union = (...rs: (number[] | null)[]) => {
  const v = rs.filter(Boolean) as number[][];
  return [Math.min(...v.map((r) => r[0])), Math.min(...v.map((r) => r[1])), Math.max(...v.map((r) => r[2])), Math.max(...v.map((r) => r[3]))];
};
const src = (s: Sec): Source => ({ dir: (TL.frames as Record<string, string>)[s.shot], n: s.n, src0: s.src0 });
const at = (t: number, s: Sec) => Math.round(t * FPS) - s.from; // absolute seconds -> section-local frame

// word timings from the captions, for overlays that land on a spoken word
const wordAt = (word: string, after = 0) => {
  for (const c of TL.captions) for (const w of c.words) if (Number(w[1]) >= after && String(w[0]).toLowerCase().replace(/[^a-z0-9]/g, "") === word) return Number(w[1]);
  return after;
};

// the pour point (source px), sampled every 6 frames by the capture, eased
function pourAt(s: Sec, f: number) {
  const p = s.pour as number[][];
  if (!p.length) return [1920, 1080];
  const g = s.src0 + f;
  let i = p.findIndex((x) => x[0] > g);
  if (i < 0) i = p.length - 1;
  const a = p[Math.max(0, i - 1)], b = p[i];
  const t = b[0] > a[0] ? Math.min(1, Math.max(0, (g - a[0]) / (b[0] - a[0]))) : 0;
  const x = a[2] + (b[2] - a[2]) * t, top = a[3] + (b[3] - a[3]) * t, base = a[5] + (b[5] - a[5]) * t;
  return [x, (top + base) / 2, base - top, top];
}

// ---------------------------------------------------------------- sections

const Open: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const req = rectOf(s, "requests"), sub = rectOf(s, "subagents"), lc = rectOf(s, "lens_context"), le = rectOf(s, "lens_egress");
  const stats = union(req, sub);
  const [sx, sy] = mid(stats);
  const t1 = at(wordAt("over", s.from / FPS - 0.3) - 0.3, s), t2 = at(wordAt("trace", s.from / FPS - 0.3) - 0.2, s);
  const keys: Key[] = tall
    ? [{ f: 0, cx: 1700, cy: 1080, z: 1 }, { f: t1, cx: 1700, cy: 1080, z: 1 }, { f: t1 + 40, cx: 600, cy: sy + 420, z: 1.5 }, { f: t2, cx: 600, cy: sy + 420, z: 1.53 },
      { f: t2 + 50, cx: 3300, cy: 800, z: 1.2 }, { f: s.to - s.from, cx: 3280, cy: 820, z: 1.24 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1 }, { f: t1, cx: 1920, cy: 1080, z: 1.02 }, { f: t1 + 40, cx: 1000, cy: sy + 260, z: 2.0 }, { f: t2, cx: 1010, cy: sy + 270, z: 2.04 },
      { f: t2 + 50, cx: 2500, cy: 950, z: 1.3 }, { f: s.to - s.from, cx: 2480, cy: 960, z: 1.34 }];
  const tWhat = at(wordAt("what", s.from / FPS - 0.3) , s), tDid = at(wordAt("did", s.from / FPS - 0.3), s);
  return (
    <Shot source={src(s)} keys={keys}>
      {req && <Box rect={req} at={at(wordAt("sixteen", s.from / FPS - 0.3) - 0.1, s)} out={t2 - 10} spotlight={0} />}
      {sub && <Box rect={sub} at={at(wordAt("ninety", s.from / FPS - 0.3) - 0.1, s)} out={t2 - 10} spotlight={0} />}
      {lc && <Box rect={lc} at={tWhat} out={tDid - 12} spotlight={0.35} />}
      {le && <Box rect={le} at={tDid} out={s.to - s.from} spotlight={0.35} color={C.red} />}
    </Shot>
  );
};

const Axes: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const keys: Key[] = tall
    ? [{ f: 0, cx: 1500, cy: 1000, z: 1.0 }, { f: s.to - s.from, cx: 2400, cy: 1000, z: 1.04 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: s.to - s.from, cx: 1920, cy: 1080, z: 1.04 }];
  const tTime = at(wordAt("time", s.from / FPS - 0.3), s), tHeight = at(wordAt("height", s.from / FPS - 0.3), s), tColor = at(wordAt("color", s.from / FPS - 0.3), s);
  const chips = [
    { w: "you", label: "You", note: "your words, CLAUDE.md, memories", c: C.lime },
    { w: "files", label: "Outside", note: "files, commands, web", c: C.orange },
    { w: "subagents", label: "Agents", note: "subagent reports", c: C.blue },
    { w: "model", label: "Model", note: "its own earlier replies", c: C.purple },
    { w: "injected", label: "Injected", note: "reminders, skills, hooks", c: C.pink },
  ].map((c) => ({ ...c, f: at(wordAt(c.w, s.from / FPS - 0.3) - 0.05, s) }));
  const a1 = interpolate(f, [tTime, tTime + 40], [0, 1], { ...clamp, easing: easeOut });
  const a2 = interpolate(f, [tHeight, tHeight + 30], [0, 1], { ...clamp, easing: easeOut });
  const fadeAll = interpolate(f, [s.to - s.from - 20, s.to - s.from], [1, 0], clamp);
  const legendIn = interpolate(f, [tColor, tColor + 20], [0, 1], clamp);
  const W = tall ? 1080 : 1920;
  const topY = tall ? 70 : 76, leftX = tall ? 60 : 110;
  const axisTop = tall ? 170 : 250, axisBottom = tall ? 700 : 860;
  const lab: React.CSSProperties = { position: "absolute", fontFamily: MONO, fontWeight: 800, fontSize: tall ? 30 : 34, color: C.white, letterSpacing: 2, textShadow: "0 2px 14px #000, 0 0 4px #000" };
  return (
    <AbsoluteFill>
      <Shot source={src(s)} keys={keys} />
      <Vignette />
      {tall ? <Scrim side="bottom" size={720} strength={0.9} opacity={legendIn * fadeAll} /> :
        <div style={{ position: "absolute", right: 0, bottom: 0, width: 900, height: 760, opacity: legendIn * fadeAll, background: "radial-gradient(ellipse at 100% 100%, rgba(4,6,10,0.85), rgba(4,6,10,0) 70%)" }} />}
      <AbsoluteFill style={{ opacity: fadeAll }}>
        {/* time runs left to right, across the sky */}
        <div style={{ position: "absolute", left: leftX, top: topY + 44, width: (W - 2 * leftX) * a1, height: 4, background: C.white, opacity: 0.9, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: leftX + (W - 2 * leftX) * a1 - 18, top: topY + 31, width: 0, height: 0, borderTop: "15px solid transparent", borderBottom: "15px solid transparent", borderLeft: `26px solid ${C.white}`, opacity: a1 > 0.02 ? 0.9 : 0 }} />
        <div style={{ ...lab, left: leftX, top: topY - 6, opacity: a1 }}>TIME →</div>
        {/* height is context, up the left edge */}
        <div style={{ position: "absolute", left: leftX - 40, top: axisBottom - (axisBottom - axisTop) * a2, width: 4, height: (axisBottom - axisTop) * a2, background: C.white, opacity: 0.9, borderRadius: 2 }} />
        <div style={{ position: "absolute", left: leftX - 53, top: axisBottom - (axisBottom - axisTop) * a2 - 20, width: 0, height: 0, borderLeft: "15px solid transparent", borderRight: "15px solid transparent", borderBottom: `26px solid ${C.white}`, opacity: a2 > 0.02 ? 0.9 : 0 }} />
        <div style={{ ...lab, left: leftX - 12, top: axisTop - 12, opacity: a2 }}>CONTEXT SIZE</div>
        {/* sources */}
        <div style={{ position: "absolute", ...(tall ? { left: 50, top: 740 } : { right: 60, top: 430 }), display: "flex", flexDirection: "column", gap: tall ? 12 : 14,
          padding: "22px 30px 24px", background: "rgba(6,8,12,0.88)", borderRadius: 22, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", opacity: legendIn }}>
          <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: tall ? 26 : 28, letterSpacing: 3, color: C.muted, opacity: legendIn }}>EACH COLOR IS A SOURCE</div>
          {chips.map((c) => {
            const p = interpolate(f, [c.f, c.f + 14], [0, 1], { ...clamp, easing: easeOut });
            return (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 18, opacity: p, transform: `translateX(${(1 - p) * 30}px)` }}>
                <div style={{ width: tall ? 38 : 44, height: tall ? 38 : 44, borderRadius: 10, background: c.c, boxShadow: `0 0 24px ${c.c}88`, flex: "none" }} />
                <div>
                  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: tall ? 38 : 42, color: C.white, lineHeight: 1 }}>{c.label}</div>
                  <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: tall ? 24 : 25, color: C.muted, marginTop: 3 }}>{c.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Pour: React.FC<Tall & { s: Sec; z: number; z0?: number; open?: number; outZ?: number }> = ({ s, tall, z, z0 = 1, open = 30, outZ }) => {
  const n = s.to - s.from + XF;
  const keys: Key[] = [];
  for (let f = 0; f <= n; f += 12) {
    const [x, y] = pourAt(s, f);
    const zz = f < open ? z0 : f < open + 70 ? z0 + (z - z0) * ((f - open) / 70) : outZ && f > n - 150 ? z + (outZ - z) * ((f - (n - 150)) / 150) : z;
    keys.push({ f, cx: tall ? x : x + 260, cy: y + (tall ? 60 : 30), z: tall ? zz * 0.95 : zz });
  }
  return <Shot source={src(s)} keys={keys} grade="contrast(1.06) saturate(1.12)" />;
};


const PourHero: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const n = s.to - s.from + XF;
  const k = tall ? 0.8 : 1; // the same source scale in both frames
  const tGrain = at(wordAt("grain", s.from / FPS - 0.3), s), tPile = at(wordAt("rereads", s.from / FPS - 0.3), s);
  const P = (f: number) => pourAt(s, f);
  const [x0, m0] = P(0), [x1, , , top1] = P(tGrain), [x2, m2] = P(tPile + 60), [x3, m3] = P(n);
  const keys: Key[] = [
    { f: 0, cx: tall ? x0 + 60 : 1920, cy: tall ? m0 : 1080, z: tall ? 1.0 : 1.0 },
    { f: 22, cx: tall ? x0 + 60 : 1920, cy: tall ? m0 : 1080, z: 1.0 },
    { f: tGrain - 20, cx: x1 + 60, cy: top1 + 300, z: 2.5 * k },
    { f: tPile - 10, cx: x1 + 70, cy: top1 + 310, z: 2.6 * k },
    { f: tPile + 60, cx: x2 + 120, cy: m2 - 40, z: 1.5 * k },
    { f: n, cx: x3 + 130, cy: m3 - 40, z: 1.6 * k },
  ];
  return <Shot source={src(s)} keys={keys} grade="contrast(1.06) saturate(1.12)" />;
};

const Crush: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const slow = s.slow as (number | boolean)[][];
  const on = slow.length >= 2 ? [Number(slow[0][0]) - s.src0, Number(slow[1][0]) - s.src0] : [-1, -1];
  const o = interpolate(f, [on[0], on[0] + 6, on[1], on[1] + 12], [0, 1, 1, 0], clamp);
  const k = tall ? 0.8 : 1, dx = tall ? 0 : 160;
  const n = s.to - s.from + XF;
  const [xa, ma] = pourAt(s, 0), [xb, mb] = pourAt(s, n);
  // follow the column as it drains into its base, then pull back so the app's own "compacted 969k → 89k"
  // pill (it appears as the playhead crosses the compaction) and the new short column share the frame
  const pr = rectOf(s, "pill");
  const pill = pr ? [pr[0] - 140, pr[1] - 8, pr[2] + 14, pr[3] + 10] : null;
  const [, , hb] = pourAt(s, n);
  const baseY = mb + hb / 2;
  const endCy = pill ? (pill[1] + baseY) / 2 : mb - 110;
  const endZ = pill ? Math.min(2.2, 2160 / (baseY - pill[1] + 260)) : 2.2;
  const keys: Key[] = [
    { f: 0, cx: xa + dx, cy: ma, z: 1.55 * k },
    { f: on[0], cx: xa + dx, cy: ma + 40, z: 1.7 * k },
    { f: on[0] + Math.round((on[1] - on[0]) * 0.6), cx: xa + dx * 0.8, cy: ma + 150, z: 1.85 * k },
    { f: on[1] + 30, cx: xb + dx * 0.5, cy: endCy, z: endZ * k },
    { f: n, cx: xb + dx * 0.5, cy: endCy, z: endZ * 1.04 * k },
  ];
  return (
    <AbsoluteFill>
      <Shot source={src(s)} keys={keys} grade="contrast(1.06) saturate(1.12)">
        {pill && <Box rect={pill} at={on[1] + 4} spotlight={0} padding={4} />}
      </Shot>
      {o > 0 && (
        <div style={{ position: "absolute", left: tall ? 40 : 60, top: tall ? 40 : 50, fontFamily: MONO, fontWeight: 800, fontSize: 26, letterSpacing: 2, color: C.white, opacity: o, background: "rgba(6,8,12,0.8)", padding: "10px 16px", borderRadius: 10 }}>
          SLOW MOTION · 0.5×
        </div>
      )}
    </AbsoluteFill>
  );
};

const Search: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const meta = rectOf(s, "row_meta"), title = rectOf(s, "row_title"), trail = rectOf(s, "trail"), rowEl = rectOf(s, "row_el"), count = rectOf(s, "row_count");
  const kEnter = (TL.keys.find((k) => k.k === "Enter" && k.t > s.from / FPS)?.t ?? 45) * FPS - s.from;
  const kn = (TL.keys.find((k) => k.k === "n" && k.t > s.from / FPS)?.t ?? 46) * FPS - s.from;
  const row = union(title, meta);
  const keys: Key[] = tall
    ? [{ f: 0, cx: 2400, cy: 1000, z: 1 }, { f: 30, cx: 1930, cy: 620, z: 1.12 }, { f: kEnter - 4, cx: 1930, cy: 620, z: 1.16 },
      { f: kEnter + 30, cx: 3150, cy: 900, z: 1.18 }, { f: s.to - s.from + XF, cx: 3150, cy: 900, z: 1.2 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1 }, { f: 30, cx: 1920, cy: 640, z: 1.45 }, { f: kEnter - 4, cx: 1920, cy: 600, z: 1.55 },
      { f: kEnter + 30, cx: 2560, cy: 900, z: 1.3 }, { f: s.to - s.from + XF, cx: 2560, cy: 900, z: 1.32 }];
  return (
    <Shot source={src(s)} keys={keys}>
      {rowEl && <Box rect={rowEl} at={at(wordAt("your", s.from / FPS - 0.3), s)} out={kEnter - 2} spotlight={0.35} color={C.lime} padding={2} />}
      {count && <Box rect={count} at={at(wordAt("ninetyone", s.from / FPS - 0.3) - 0.15, s)} out={kEnter - 2} spotlight={0} padding={6} />}
      {trail && <Box rect={trail} at={kn + 4} out={s.to - s.from} spotlight={0} />}
    </Shot>
  );
};

const Widen: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const keys: Key[] = tall
    ? [{ f: 0, cx: 3150, cy: 900, z: 1.2 }, { f: 40, cx: 3150, cy: 900, z: 1.2 }, { f: 90, cx: 2350, cy: 1250, z: 1.12 }, { f: s.to - s.from + XF, cx: 2300, cy: 1250, z: 1.16 }]
    : [{ f: 0, cx: 2560, cy: 900, z: 1.32 }, { f: 40, cx: 2560, cy: 900, z: 1.3 }, { f: 90, cx: 2620, cy: 1150, z: 1.25 }, { f: s.to - s.from + XF, cx: 2620, cy: 1180, z: 1.3 }];
  return <Shot source={src(s)} keys={keys} />;
};

const Setup: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const dupe = rectOf(s, "dupe"), row = rectOf(s, "row"), sent6 = rectOf(s, "sent6");
  const line = union(sent6, dupe);
  const r = union(row, dupe);
  const [x, y] = mid(r);
  const n = s.to - s.from + XF;
  const keys: Key[] = tall
    ? [{ f: 0, cx: 2500, cy: 1150, z: 1.1 }, { f: 60, cx: (r[0] + r[2]) / 2 + 20, cy: y - 120, z: 1.22 }, { f: n, cx: (r[0] + r[2]) / 2 + 20, cy: y - 110, z: 1.26 }]
    : [{ f: 0, cx: 2620, cy: 1180, z: 1.3 }, { f: 60, cx: x + 60, cy: y - 90, z: 2.05 }, { f: n, cx: x + 80, cy: y - 90, z: 2.15 }];
  return (
    <Shot source={src(s)} keys={keys}>
      {row && <Box rect={row} at={at(wordAt("twice", s.from / FPS - 0.3) - 0.2, s)} spotlight={0} color={C.lime} padding={6} />}
      {line && <Box rect={line} at={at(wordAt("sent", s.from / FPS - 0.3) - 0.05, s)} spotlight={0.45} />}
    </Shot>
  );
};

const Egress: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const left = rectOf(s, "left"), counts = rectOf(s, "counts"), asked = rectOf(s, "asked"), permitted = rectOf(s, "permitted");
  const kEnter = (TL.keys.find((k) => k.k === "Enter" && k.t > s.from / FPS)?.t ?? 64) * FPS - s.from;
  const lad = union(asked, permitted);
  const [lx, ly] = mid(lad);
  const n = s.to - s.from + XF;
  const keys: Key[] = tall
    ? [{ f: 0, cx: 2700, cy: 1000, z: 1.0 }, { f: 40, cx: 3150, cy: 950, z: 1.15 }, { f: kEnter + 40, cx: 3150, cy: 950, z: 1.15 }, { f: kEnter + 80, cx: lx, cy: ly, z: 1.5 }, { f: n, cx: lx, cy: ly, z: 1.55 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: 40, cx: 2700, cy: 900, z: 1.35 }, { f: kEnter + 40, cx: 2700, cy: 900, z: 1.35 }, { f: kEnter + 80, cx: lx - 250, cy: ly, z: 1.9 }, { f: n, cx: lx - 240, cy: ly, z: 1.95 }];
  return (
    <Shot source={src(s)} keys={keys}>
      {left && counts && <Box rect={union(left, counts)} at={at(wordAt("everything", s.from / FPS - 0.3) , s)} out={kEnter - 4} spotlight={0.3} color={C.red} />}
      {asked && <Box rect={asked} at={kEnter + 70} spotlight={0} color={C.lime} padding={6} />}
      {permitted && <Box rect={permitted} at={kEnter + 90} spotlight={0.35} />}
    </Shot>
  );
};

const Agents: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const adv = rectOf(s, "advisor"), fresh = rectOf(s, "fresh");
  const n = s.to - s.from + XF;
  const keys: Key[] = tall
    ? [{ f: 0, cx: 2700, cy: 1000, z: 1.0 }, { f: 45, cx: 3150, cy: 1150, z: 1.2 }, { f: n, cx: 3150, cy: 1150, z: 1.24 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: 45, cx: 2500, cy: 1080, z: 1.25 }, { f: n, cx: 2520, cy: 1080, z: 1.3 }];
  return (
    <Shot source={src(s)} keys={keys}>
      {adv && fresh && <Box rect={union(adv, fresh)} at={at(wordAt("cost", s.from / FPS - 0.3), s)} spotlight={0.3} color={C.blue} />}
    </Shot>
  );
};

const Keys: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const kq = (TL.keys.find((k) => k.k === "?" && k.t > s.from / FPS)?.t ?? 75) * FPS - s.from;
  const n = s.to - s.from + XF;
  const keys: Key[] = tall
    ? [{ f: 0, cx: 2600, cy: 1000, z: 1.0 }, { f: kq - 2, cx: 2600, cy: 1000, z: 1.02 }, { f: kq + 24, cx: 1920, cy: 960, z: 1.24 }, { f: n, cx: 1920, cy: 960, z: 1.27 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: kq - 2, cx: 1920, cy: 1080, z: 1.02 }, { f: kq + 24, cx: 1920, cy: 960, z: 1.3 }, { f: n, cx: 1920, cy: 960, z: 1.34 }];
  return <Shot source={src(s)} keys={keys} />;
};

const Close: React.FC<Tall & { s: Sec }> = ({ s, tall }) => {
  const f = useCurrentFrame();
  const t0 = at(wordAt("open", s.from / FPS - 0.3) - 0.2, s);
  const card = interpolate(f, [t0, t0 + 30], [0, 1], { ...clamp, easing: easeOut });
  const keys: Key[] = [{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: s.to - s.from, cx: 1920, cy: 1080, z: 1.06 }];
  const big = tall ? 110 : 132;
  const row = (label: string, url: string, d: number) => {
    const p = interpolate(f, [t0 + d, t0 + d + 20], [0, 1], { ...clamp, easing: easeOut });
    return (
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, opacity: p, transform: `translateY(${(1 - p) * 16}px)`, flexDirection: tall ? "column" : "row", ...(tall ? { gap: 4, alignItems: "center" } : {}) }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: tall ? 30 : 32, color: C.muted, minWidth: tall ? 0 : 250, textAlign: tall ? "center" : "right" }}>{label}</span>
        <span style={{ fontFamily: MONO, fontWeight: 800, fontSize: tall ? 40 : 44, color: C.white }}>{url}</span>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Shot source={src(s)} keys={keys} />
      <Vignette strength={0.6} />
      <AbsoluteFill style={{ background: `rgba(4,6,10,${0.72 * card})` }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: tall ? 34 : 30, opacity: card, paddingBottom: tall ? 120 : 90 }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: big, color: C.white, letterSpacing: -2, display: "flex", alignItems: "center", gap: 26 }}>
          <span style={{ color: C.lime }}>≋</span> Trace
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: tall ? 46 : 50, color: C.ink, textAlign: "center", maxWidth: tall ? 900 : 1400 }}>See what your agent actually saw.</div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: tall ? 30 : 32, color: C.lime, textAlign: "center", marginBottom: 16 }}>Runs entirely in your browser · nothing leaves your machine</div>
        {row("Claude Code", "ccprompts.dtmont.com/trace", 24)}
        {row("Codex/ChatGPT", "gpt6aeon.dtmont.com/trace", 36)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- overlays

const CARD_AT = wordAt("open", secOf("close").from / FPS - 0.3) - 0.2;
const Captions: React.FC<Tall> = ({ tall }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const c = TL.captions.find((x) => t >= x.t0 && t < x.t1);
  if (!c || t >= CARD_AT) return null; // the end card carries the last lines
  const a = interpolate(t, [c.t0, c.t0 + 0.12], [0, 1], clamp);
  // the displayed text; the spoken words carry the timing, the display words may differ ("969k"), so
  // the highlight follows the fraction of the phrase spoken
  const words = c.text.split(" ");
  const spoken = c.words.length ? (t - Number(c.words[0][1])) / Math.max(0.01, Number(c.words[c.words.length - 1][2]) - Number(c.words[0][1])) : 1;
  const cur = Math.min(words.length - 1, Math.floor(Math.max(0, spoken) * words.length));
  return (
    <div style={{
      position: "absolute", left: "50%", bottom: tall ? 64 : 46, transform: `translateX(-50%) translateY(${(1 - a) * 8}px)`, opacity: a,
      maxWidth: tall ? 960 : 1500, width: "max-content", textAlign: "center",
      background: "rgba(6,8,12,0.82)", borderRadius: 18, padding: tall ? "14px 26px" : "12px 28px",
      fontFamily: SANS, fontWeight: 800, fontSize: tall ? 50 : 46, lineHeight: 1.18, color: C.white,
      boxShadow: "0 10px 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)",
    }}>
      {words.map((w, i) => (
        <span key={i} style={{ color: i === cur && spoken <= 1.02 ? C.lime : C.white }}>{w}{i < words.length - 1 ? " " : ""}</span>
      ))}
    </div>
  );
};

const KeyCaps: React.FC<Tall> = ({ tall }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const LIFE = 1.2;
  const live = TL.keys.filter((k) => t >= k.t && t < k.t + LIFE);
  if (!live.length) return null;
  // collapse repeats (Tab Tab Tab) into one cap with a count
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

const COMPONENTS: Record<string, React.FC<Tall & { s: Sec }>> = {
  open: Open, axes: Axes, pour: PourHero, crush: Crush,
  search: Search, widen: Widen, setup: Setup, egress: Egress, agents: Agents, keys: Keys, close: Close,
};

export const Explainer: React.FC<Tall> = ({ tall }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {TL.sections.map((s, i) => {
        const Comp = COMPONENTS[s.id];
        const last = i === TL.sections.length - 1;
        const dur = Math.min(durationInFrames - s.from, s.to - s.from + (last ? 0 : XF));
        const continuous = s.id === "widen"; // same take as search: a hard cut is invisible
        return (
          <Sequence key={s.id} from={s.from} durationInFrames={dur}>
            <Fade frames={i === 0 || continuous ? 0 : XF}><Comp s={s} tall={tall} /></Fade>
          </Sequence>
        );
      })}
      <KeyCaps tall={tall} />
      <Captions tall={tall} />
      <FadeOut />
    </AbsoluteFill>
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
  const o = interpolate(f, [durationInFrames - 45, durationInFrames - 2], [0, 1], clamp);
  return o > 0 ? <AbsoluteFill style={{ background: "#000", opacity: o }} /> : null;
};
