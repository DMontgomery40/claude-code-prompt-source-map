import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Archivo";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: SANS } = loadFont("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });
export const { fontFamily: MONO } = loadMono("normal", { weights: ["500", "700", "800"], subsets: ["latin"] });

export const C = {
  bg: "#06080c",
  white: "#ffffff",
  lime: "#c8f784",
  pink: "#ff5ccd",
  red: "#ff4a4a",
  blue: "#7fb8ff",
  purple: "#b9a0ff",
  amber: "#ffd479",
  muted: "#c9d3e0",
};

export const SRC_W = 3840;
export const SRC_H = 2160;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeIO = Easing.inOut(Easing.cubic);
export const easeOut = Easing.out(Easing.cubic);

// ---------- footage ----------
const pad = (n: number) => String(n).padStart(4, "0");
export type Source = { kind: "seq"; name: string; n: number; map?: [number, number][] } | { kind: "still"; file: string };

// piecewise-linear time map: [[localFrame, sourceFrame], ...]
function mapFrame(map: [number, number][] | undefined, f: number, n: number) {
  if (!map) return Math.min(n - 1, Math.max(0, f));
  const xs = map.map((m) => m[0]);
  const ys = map.map((m) => m[1]);
  const v = interpolate(f, xs, ys, clamp);
  return Math.min(n - 1, Math.max(0, Math.round(v)));
}

export function srcUrl(s: Source, f: number) {
  if (s.kind === "still") return staticFile(`stills/${s.file}`);
  return staticFile(`seq/${s.name}/${pad(mapFrame(s.map, f, s.n) + 1)}.jpg`);
}

// ---------- camera ----------
// cx, cy: source-pixel point at the frame centre; z: zoom over "cover" fit.
export type Key = { f: number; cx: number; cy: number; z: number };
export function camAt(keys: Key[], f: number): Key {
  if (f <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (f <= b.f) {
      const t = easeIO((f - a.f) / Math.max(1, b.f - a.f));
      // zoom interpolates in log space so punch-ins feel even
      const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
      return { f, cx: a.cx + (b.cx - a.cx) * t, cy: a.cy + (b.cy - a.cy) * t, z };
    }
  }
  return keys[keys.length - 1];
}

const ScaleCtx = createContext(1);
export const useSrcScale = () => useContext(ScaleCtx);

export const Shot: React.FC<{
  source: Source;
  keys: Key[];
  enter?: "zoom" | "cut";
  grade?: string;
  children?: React.ReactNode;
}> = ({ source, keys, enter = "zoom", grade, children }) => {
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const k = camAt(keys, f);
  const cover = Math.max(W / SRC_W, H / SRC_H);
  const s = cover * k.z;
  const hw = W / (2 * s), hh = H / (2 * s);
  const cx = Math.min(SRC_W - hw, Math.max(hw, k.cx));
  const cy = Math.min(SRC_H - hh, Math.max(hh, k.cy));
  const tx = W / 2 - cx * s, ty = H / 2 - cy * s;
  const e = enter === "zoom" ? interpolate(f, [0, 10], [1, 0], clamp) : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: C.bg }}>
      <AbsoluteFill style={{ transform: `scale(${1 + 0.3 * e * e})`, filter: `blur(${12 * e * e}px) ${grade ?? "contrast(1.06) saturate(1.12)"}` }}>
        <div style={{ position: "absolute", left: 0, top: 0, width: SRC_W, height: SRC_H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
          <Img src={srcUrl(source, f)} style={{ width: SRC_W, height: SRC_H, display: "block" }} />
          <ScaleCtx.Provider value={s}>{children}</ScaleCtx.Provider>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- source-space highlight ----------
export const Box: React.FC<{ rect: number[]; at: number; out?: number; color?: string; padding?: number; spotlight?: boolean; radius?: number }> = ({
  rect, at, out = 1e9, color = C.red, padding = 14, spotlight = true, radius = 14,
}) => {
  const f = useCurrentFrame();
  const s = useSrcScale();
  const [x, y, w, h] = rect;
  const p = interpolate(f, [at, at + 8], [0, 1], { ...clamp, easing: easeOut });
  const o = interpolate(f, [out - 6, out], [1, 0], clamp) * interpolate(f, [at, at + 3], [0, 1], clamp);
  const grow = 1.25 - 0.25 * p;
  const bw = 5 / s; // constant on-screen thickness
  return (
    <>
      {spotlight && (
        <div style={{
          position: "absolute", left: x - padding, top: y - padding, width: w + 2 * padding, height: h + 2 * padding,
          borderRadius: radius / s, boxShadow: `0 0 0 ${20000}px rgba(3,5,9,${0.62 * o})`, pointerEvents: "none",
        }} />
      )}
      <div style={{
        position: "absolute", left: x - padding, top: y - padding, width: w + 2 * padding, height: h + 2 * padding,
        border: `${bw}px solid ${color}`, borderRadius: radius / s, opacity: o,
        transform: `scale(${grow})`, boxShadow: `0 0 ${30 / s}px ${color}, inset 0 0 ${24 / s}px ${color}55`,
      }} />
    </>
  );
};

// ---------- screen-space type ----------
export type Seg = { t: string; c?: string; bg?: string };
export type Line = { segs: Seg[]; size: number; font?: "sans" | "mono"; weight?: number; delay?: number; track?: number };

export const Slam: React.FC<{
  lines: Line[]; at: number; out: number; x: number; y: number;
  align?: "left" | "center" | "right"; anchorY?: "top" | "center" | "bottom"; shake?: boolean; maxWidth?: number;
}> = ({ lines, at, out, x, y, align = "left", anchorY = "top", shake = false, maxWidth }) => {
  const f = useCurrentFrame();
  if (f < at - 1 || f > out + 8) return null;
  const tx = align === "left" ? "0%" : align === "center" ? "-50%" : "-100%";
  const ty = anchorY === "top" ? "0%" : anchorY === "center" ? "-50%" : "-100%";
  const exit = interpolate(f, [out, out + 7], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const sh = shake ? Math.max(0, 1 - (f - at - 4) / 10) : 0;
  const sx = sh * 9 * Math.sin(f * 2.7), sy = sh * 7 * Math.cos(f * 3.3);
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `translate(${tx}, ${ty}) translate(${sx}px, ${sy - exit * 40}px)`,
      opacity: 1 - exit, filter: `blur(${exit * 10}px)`, textAlign: align, maxWidth,
    }}>
      {lines.map((ln, i) => {
        const a = at + (ln.delay ?? 0);
        const p = interpolate(f, [a, a + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(1.6)) });
        const op = interpolate(f, [a, a + 3], [0, 1], clamp);
        return (
          <div key={i} style={{
            fontFamily: ln.font === "mono" ? MONO : SANS, fontWeight: ln.weight ?? 900, fontSize: ln.size,
            lineHeight: 1.02, letterSpacing: ln.track ?? (ln.font === "mono" ? 0 : -0.02 * ln.size),
            color: C.white, opacity: op, transform: `scale(${1.45 - 0.45 * p})`, transformOrigin: align === "center" ? "50% 50%" : align === "left" ? "0% 50%" : "100% 50%",
            filter: `blur(${(1 - p) * 8}px)`, whiteSpace: "pre", textShadow: "0 6px 40px rgba(0,0,0,0.85), 0 2px 6px rgba(0,0,0,0.9)",
            marginTop: i === 0 ? 0 : ln.size * 0.12,
          }}>
            {ln.segs.map((sg, j) => (
              <span key={j} style={{
                color: sg.c ?? C.white, background: sg.bg, padding: sg.bg ? "0 0.14em" : undefined,
                borderRadius: sg.bg ? "0.08em" : undefined, textShadow: sg.bg ? "none" : undefined,
              }}>{sg.t}</span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// count-up for numbers like "1,656" or "7.3M"
export function countUp(target: string, p: number) {
  const m = target.match(/^([\d,.]+)(.*)$/);
  if (!m) return target;
  const raw = m[1].replace(/,/g, "");
  const dec = raw.includes(".") ? raw.split(".")[1].length : 0;
  const v = parseFloat(raw) * p;
  const s = dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
  return s + m[2];
}

export const Flash: React.FC<{ at: number; color?: string; strength?: number; len?: number }> = ({ at, color = "#fff", strength = 0.75, len = 9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, strength, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />;
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);

// a dark scrim so type stays legible over bright terrain
export const Scrim: React.FC<{ side: "left" | "bottom" | "top"; size: number; strength?: number }> = ({ side, size, strength = 0.75 }) => {
  const dir = side === "left" ? "to right" : side === "bottom" ? "to top" : "to bottom";
  const pos: React.CSSProperties = side === "left" ? { left: 0, top: 0, bottom: 0, width: size } : side === "bottom" ? { left: 0, right: 0, bottom: 0, height: size } : { left: 0, right: 0, top: 0, height: size };
  return <div style={{ position: "absolute", ...pos, background: `linear-gradient(${dir}, rgba(4,6,10,${strength}), rgba(4,6,10,0))` }} />;
};
