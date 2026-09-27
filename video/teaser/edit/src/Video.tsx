import React from "react";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { Box, C, Flash, Key, MONO, SANS, Scrim, Shot, Slam, Source, Vignette, countUp } from "./lib";
import TL from "./timeline.json";
import R from "./rects.json";

type P = { tall: boolean };
const S = TL.sections as unknown as Record<string, [number, number]>;
const len = (k: string) => S[k][1] - S[k][0];
const seq = (name: string, n: number, map?: [number, number][]): Source => ({ kind: "seq", name, n, map });
const still = (file: string): Source => ({ kind: "still", file });
const hold = (name: string, n: number, frame: number): Source => ({ kind: "seq", name, n, map: [[0, frame], [1, frame]] });
const U = (...rs: number[][]) => {
  const x0 = Math.min(...rs.map((r) => r[0])), y0 = Math.min(...rs.map((r) => r[1]));
  const x1 = Math.max(...rs.map((r) => r[0] + r[2])), y1 = Math.max(...rs.map((r) => r[1] + r[3]));
  return [x0, y0, x1 - x0, y1 - y0];
};
// Panel punch-ins: the side panel hugs the right edge in 16:9 (type sits on the left); it fills a 4:5 frame.
const PANEL_X = 3416;
const panelCam = (tall: boolean, f: number, cy: number, z: number): Key =>
  tall ? { f, cx: PANEL_X, cy: cy + 190, z: z * 0.82 } : { f, cx: 3840, cy, z }; // 4:5: type sits at the bottom, so the focus rides high

// shorthand for type
const T = (t: string, c?: string) => ({ t, c });
const line = (size: number, segs: { t: string; c?: string }[], extra: Partial<{ delay: number; font: "sans" | "mono"; weight: number }> = {}) => ({ size, segs, ...extra });

// ---------- sections ----------

const Hook: React.FC<P> = ({ tall }) => {
  const f = useCurrentFrame();
  const keys: Key[] = tall
    ? [{ f: 0, cx: 1500, cy: 1080, z: 1 }, { f: 240, cx: 1950, cy: 1080, z: 1 }]
    : [{ f: 0, cx: 1920, cy: 1080, z: 1.06 }, { f: 240, cx: 1920, cy: 1080, z: 1 }];
  const big = tall ? 118 : 158;
  const stats = [
    { v: "1", u: " DAY ", v2: "4", u2: " HOURS", at: 112 },
    { v: "1,656", u: " REQUESTS", at: 138 },
    { v: "90", u: " SUBAGENTS", at: 164 },
  ];
  return (
    <AbsoluteFill>
      <Shot source={seq("s_reveal", 330, [[0, 0], [240, 329]])} keys={keys} enter="cut" />
      {tall ? <Scrim side="top" size={620} strength={0.8} /> : <Scrim side="left" size={1100} strength={0.78} />}
      <Slam at={0} out={98} x={tall ? 540 : 110} y={tall ? 110 : 540} align={tall ? "center" : "left"} anchorY={tall ? "top" : "center"}
        lines={[line(big, [T("ONE", C.lime)]), line(big, [T("CLAUDE CODE")], { delay: 7 }), line(big, [T("SESSION.")], { delay: 14 })]} />
      {stats.map((s, i) => {
        const p = interpolate(f, [s.at, s.at + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <Slam key={i} at={s.at} out={230} x={tall ? 540 : 110} y={tall ? 110 + i * 150 : 330 + i * 170} align={tall ? "center" : "left"}
            lines={[line(tall ? 104 : 136, [T(countUp(s.v, p), C.white), T(s.u, C.lime), ...(s.v2 ? [T(s.v2, C.white), T(s.u2!, C.lime)] : [])])]} />
        );
      })}
    </AbsoluteFill>
  );
};

const Cliff: React.FC<P> = ({ tall }) => (
  <AbsoluteFill>
    <Shot source={seq("s_cliff", 210, [[0, 0], [150, 209]])}
      keys={[{ f: 0, cx: 1920, cy: 1080, z: 1.0 }, { f: 150, cx: 1880, cy: 1000, z: 1.14 }]} />
    <Scrim side="top" size={tall ? 560 : 460} strength={0.8} />
    <Slam at={10} out={146} x={tall ? 540 : 960} y={tall ? 120 : 70} align="center"
      lines={[line(tall ? 40 : 46, [T("CONTEXT COMPACTED", C.muted)], { font: "mono", weight: 700 }),
        line(tall ? 150 : 210, [T("969K"), T(" → ", C.red), T("89K", C.red)], { delay: 12 })]} shake />
    <Flash at={0} strength={0.55} />
    <Flash at={22} color={C.red} strength={0.35} len={12} />
  </AbsoluteFill>
);

const Dive: React.FC<P> = ({ tall }) => {
  const ask = R.L1.ask_ugh;
  const keys: Key[] = [
    { f: 0, cx: 1920, cy: 1080, z: 1 }, { f: 52, cx: 1920, cy: 1080, z: 1 },
    panelCam(tall, 70, ask[1] + ask[3] / 2, 2.3), panelCam(tall, 116, ask[1] + ask[3] / 2 + 10, 2.4),
    { f: 134, cx: 1920, cy: 1080, z: 1 }, { f: 190, cx: tall ? 1250 : 1700, cy: 1150, z: 1.12 }, { f: 270, cx: tall ? 1250 : 1700, cy: 1150, z: 1.16 },
  ];
  return (
    <AbsoluteFill>
      <Shot source={seq("s_dive", 340, [[0, 8], [55, 100], [120, 124], [185, 200], [270, 339]])} keys={keys}>
        <Box rect={ask} at={74} out={122} color={C.lime} />
      </Shot>
      <Scrim side={tall ? "top" : "bottom"} size={tall ? 520 : 440} strength={0.78} />
      {tall && <Scrim side="bottom" size={520} strength={0.8} />}
      <Slam at={6} out={54} x={tall ? 540 : 110} y={tall ? 120 : 1000} align={tall ? "center" : "left"} anchorY={tall ? "top" : "bottom"}
        lines={[line(tall ? 92 : 112, [T("ZOOM INTO")]), line(tall ? 92 : 112, [T("ANY REQUEST.", C.lime)], { delay: 6 })]} />
      <Slam at={76} out={118} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"}
        lines={[line(tall ? 88 : 104, [T("IT STARTED")]), line(tall ? 88 : 104, [T("WITH THIS.", C.lime)], { delay: 6 })]} />
      <Slam at={140} out={262} x={tall ? 540 : 110} y={tall ? 120 : 1000} align={tall ? "center" : "left"} anchorY={tall ? "top" : "bottom"}
        lines={[line(tall ? 82 : 104, [T("SEE EXACTLY WHAT")]), line(tall ? 82 : 104, [T("FILLED ITS CONTEXT.", C.lime)], { delay: 6 })]} />
    </AbsoluteFill>
  );
};

const Injected: React.FC<P> = ({ tall }) => {
  const head = U(R.L3.head, R.L3.setup);
  const keys: Key[] = [
    { f: 0, cx: tall ? 1150 : 1700, cy: 1150, z: 1.16 },
    panelCam(tall, 26, head[1] + head[3] / 2 + 60, 2.3), panelCam(tall, 180, head[1] + head[3] / 2 + 330, 2.45),
  ];
  return (
    <AbsoluteFill>
      <Shot source={hold("s_dive", 340, 339)} keys={keys}>
        <Box rect={head} at={28} color={C.pink} />
      </Shot>
      <Scrim side={tall ? "bottom" : "left"} size={tall ? 600 : 1000} strength={0.85} />
      <Slam at={6} out={172} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"} shake
        lines={[line(tall ? 150 : 190, [T("≈97K", C.pink)]), line(tall ? 64 : 72, [T("TOKENS INSERTED")], { delay: 8 }), line(tall ? 64 : 72, [T("BETWEEN TURNS.")], { delay: 12 })]} />
      <Flash at={0} color={C.pink} strength={0.4} />
    </AbsoluteFill>
  );
};

const ClaudeMd: React.FC<P> = ({ tall }) => {
  const row = R.setup_claudemd.claudemd;
  const rd = R.reader;
  const A = 78; // cut to the reader
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={A}>
        <Shot source={still("st_setup_claudemd.png")} keys={[panelCam(tall, 0, 1000, 1.8), panelCam(tall, 40, row[1] + row[3] / 2, 2.4)]}>
          <Box rect={row} at={24} color={C.red} />
        </Shot>
      </Sequence>
      <Sequence from={A}>
        <Shot source={still("st_reader_claudemd.png")} keys={[panelCam(tall, 0, rd.sentagain[1] + 60, 2.3), panelCam(tall, 100, rd.sentagain[1] + 180, 2.4)]}>
          <Box rect={U(rd.title, rd.sentagain)} at={10} color={C.red} padding={18} />
        </Shot>
      </Sequence>
      {tall ? <Scrim side="bottom" size={560} strength={0.85} /> : <Scrim side="left" size={1000} strength={0.85} />}
      <Slam at={8} out={A - 4} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"}
        lines={[line(tall ? 86 : 104, [T("YOUR")]), line(tall ? 86 : 104, [T("CLAUDE.md", C.lime)], { delay: 5 }), line(tall ? 86 : 104, [T("SENT "), T("6×", C.red)], { delay: 12 })]} />
      <Slam at={A + 6} out={176} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"} shake
        lines={[line(tall ? 96 : 100, [T("SENT AGAIN.", C.red)]), line(tall ? 96 : 100, [T("IDENTICAL.")], { delay: 6 }),
          line(tall ? 34 : 40, [T("while a copy was still in context", C.muted)], { delay: 16, font: "mono", weight: 700 })]} />
      <Flash at={A} color={C.red} strength={0.3} />
    </AbsoluteFill>
  );
};

const Egress: React.FC<P> = ({ tall }) => {
  const head = U(R.egress_L0.left_head, R.egress_L0.left_sub);
  const cu = R.custody;
  const asked = [3078, 454, 724, 470];
  const permitted = [3078, 926, 724, 110];
  const inview = [3078, 1256, 724, 400];
  const B = 90, D = 150; // cut to the Lens 2 list, then to the custody ladder
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={B}>
        <Shot source={seq("s_egress", 250, [[0, 6], [90, 72]])} keys={tall
          ? [{ f: 0, cx: 1500, cy: 1080, z: 1 }, { f: 90, cx: 1600, cy: 1080, z: 1.08 }]
          : [{ f: 0, cx: 1920, cy: 1080, z: 1 }, { f: 90, cx: 1800, cy: 1080, z: 1.08 }]} />
        <Flash at={20} color={C.red} strength={0.45} len={12} />
      </Sequence>
      <Sequence from={B} durationInFrames={D - B}>
        <Shot source={hold("s_egress", 250, 112)} keys={[panelCam(tall, 0, head[1] + head[3] / 2 + 60, 2.2), panelCam(tall, 60, head[1] + head[3] / 2 + 80, 2.4)]}>
          <Box rect={head} at={6} color={C.red} />
        </Shot>
      </Sequence>
      <Sequence from={D}>
        <Shot source={still("st_custody.png")} keys={[panelCam(tall, 0, 720, 2.3), panelCam(tall, 34, 820, 2.35), panelCam(tall, 70, 1180, 2.35), panelCam(tall, 120, 1260, 2.4)]}>
          <Box rect={asked} at={6} out={40} color={C.lime} />
          <Box rect={permitted} at={40} out={76} color={C.red} />
          <Box rect={inview} at={76} color={C.amber} />
        </Shot>
      </Sequence>
      {tall ? <Scrim side="bottom" size={620} strength={0.85} /> : <Scrim side="left" size={1000} strength={0.85} />}
      <Slam at={22} out={B - 4} x={tall ? 540 : 110} y={tall ? 1260 : 1000} align={tall ? "center" : "left"} anchorY="bottom" shake
        lines={[line(tall ? 80 : 110, [T("EVERYTHING THAT")]), line(tall ? 80 : 110, [T("LEFT YOUR MACHINE.", C.red)], { delay: 6 })]} />
      <Slam at={B + 4} out={D - 4} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"}
        lines={[line(tall ? 150 : 200, [T("96", C.red)]), line(tall ? 64 : 80, [T("TOOL CALLS LEFT")], { delay: 6 }), line(tall ? 64 : 80, [T("THE MACHINE.")], { delay: 9 })]} />
      <Slam at={D + 6} out={266} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"}
        lines={[line(tall ? 84 : 80, [T("WHO ASKED.", C.lime)]), line(tall ? 84 : 80, [T("WHO ALLOWED IT.", C.red)], { delay: 34 }),
          line(tall ? 84 : 80, [T("WHAT IT SAW.", C.amber)], { delay: 70 })]} />
      <Flash at={D + 40} color={C.red} strength={0.25} />
    </AbsoluteFill>
  );
};

const Agents: React.FC<P> = ({ tall }) => {
  const adv = R.agents.advisor;
  return (
    <AbsoluteFill>
      <Shot source={seq("s_agents", 130, [[0, 8], [60, 70], [150, 129]])} keys={[
        tall ? { f: 0, cx: 1500, cy: 1080, z: 1 } : { f: 0, cx: 1920, cy: 1080, z: 1 },
        tall ? { f: 62, cx: 1400, cy: 1000, z: 1.1 } : { f: 62, cx: 1800, cy: 1060, z: 1.06 },
        panelCam(tall, 84, adv[1] + adv[3] / 2 + 80, 2.3), panelCam(tall, 150, adv[1] + adv[3] / 2 + 100, 2.4)]}>
        <Box rect={adv} at={88} color={C.blue} />
      </Shot>
      {tall ? <Scrim side="bottom" size={560} strength={0.85} /> : <Scrim side="left" size={1000} strength={0.8} />}
      <Slam at={10} out={78} x={tall ? 540 : 110} y={tall ? 1260 : 1000} align={tall ? "center" : "left"} anchorY="bottom"
        lines={[line(tall ? 84 : 110, [T("FIND WHAT BURNED")]), line(tall ? 84 : 110, [T("YOUR TOKENS.", C.blue)], { delay: 6 })]} />
      <Slam at={90} out={146} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"} shake
        lines={[line(tall ? 150 : 200, [T("7.3M", C.blue)]), line(tall ? 60 : 66, [T("FRESH TOKENS.")], { delay: 6 }), line(tall ? 60 : 66, [T("THE ADVISOR ALONE.")], { delay: 9 })]} />
    </AbsoluteFill>
  );
};

const Codex: React.FC<P> = ({ tall }) => {
  const sk = R.codex.skills;
  const A = 78;
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={A}>
        <Shot source={seq("s_codex", 240, [[0, 40], [A, 239]])} keys={[{ f: 0, cx: tall ? 1700 : 1920, cy: 1120, z: 1.28 }, { f: A, cx: tall ? 1900 : 1960, cy: 1100, z: 1.36 }]} />
        <Scrim side="top" size={tall ? 520 : 420} strength={0.8} />
        <Slam at={4} out={A - 3} x={tall ? 540 : 960} y={tall ? 120 : 80} align="center"
          lines={[line(tall ? 104 : 150, [T("CODEX/CHATGPT")]), line(tall ? 104 : 150, [T("TOO.", C.lime)], { delay: 6 })]} />
      </Sequence>
      <Sequence from={A}>
        <Shot source={still("st_codex_ui.png")} keys={[panelCam(tall, 0, sk[1] + sk[3] / 2 - 40, 2.2), panelCam(tall, 72, sk[1] + sk[3] / 2, 2.4)]}>
          <Box rect={sk} at={6} color={C.red} />
        </Shot>
        {tall ? <Scrim side="bottom" size={560} strength={0.85} /> : <Scrim side="left" size={1000} strength={0.85} />}
        <Slam at={6} out={68} x={tall ? 540 : 110} y={tall ? 1260 : 540} align={tall ? "center" : "left"} anchorY={tall ? "bottom" : "center"} shake
          lines={[line(tall ? 84 : 96, [T("131 SKILLS.")]), line(tall ? 84 : 96, [T("SENT AGAIN")], { delay: 5 }), line(tall ? 170 : 210, [T("24×", C.red)], { delay: 10 }),
            line(tall ? 30 : 30, [T("changed, while a copy was still in context", C.muted)], { delay: 18, font: "mono", weight: 700 })]} />
      </Sequence>
    </AbsoluteFill>
  );
};

const End: React.FC<P> = ({ tall }) => {
  const f = useCurrentFrame();
  const cx = tall ? 540 : 960;
  const urlSize = tall ? 44 : 50;
  const Url: React.FC<{ product: string; url: string; at: number }> = ({ product, url, at }) => {
    const o = interpolate(f, [at, at + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <div style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)`, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: tall ? 26 : 30, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>{product}</div>
        <div style={{ fontFamily: MONO, fontWeight: 800, fontSize: urlSize, color: C.white, background: "rgba(6,8,12,0.88)", border: `3px solid ${C.lime}`, borderRadius: 14, padding: "10px 26px", boxShadow: `0 0 40px ${C.lime}55` }}>{url}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Shot source={seq("s_endorbit", 420, [[0, 0], [210, 419]])} keys={[{ f: 0, cx: 1920, cy: 1080, z: 1.1 }, { f: 210, cx: 1920, cy: 1080, z: 1.0 }]}
        grade="brightness(0.42) saturate(1.1) blur(1.5px)" />
      <Vignette strength={0.8} />
      <Slam at={0} out={999} x={cx} y={tall ? 330 : 190} align="center"
        lines={[line(tall ? 210 : 260, [T("TRACE")], { weight: 900 }),
          line(tall ? 50 : 64, [T("See everything your agent saw.", C.lime)], { delay: 12, weight: 800 })]} />
      <div style={{ position: "absolute", left: 0, right: 0, top: tall ? 760 : 640, display: "flex", flexDirection: tall ? "column" : "row", justifyContent: "center", alignItems: "center", gap: tall ? 36 : 48 }}>
        <Url product="Claude Code" url="ccprompts.dtmont.com/trace" at={16} />
        <Url product="Codex/ChatGPT" url="gpt6aeon.dtmont.com/trace" at={22} />
      </div>
      <Slam at={34} out={999} x={cx} y={tall ? 1200 : 930} align="center"
        lines={[line(tall ? 30 : 38, [T("Runs entirely in your browser. Nothing leaves.", C.muted)], { font: "mono", weight: 700 })]} />
      <Flash at={0} strength={0.7} len={14} />
    </AbsoluteFill>
  );
};

const PARTS: [string, React.FC<P>][] = [
  ["hook", Hook], ["cliff", Cliff], ["dive", Dive], ["injected", Injected], ["claudemd", ClaudeMd],
  ["egress", Egress], ["agents", Agents], ["codex", Codex], ["end", End],
];

export const TraceDemo: React.FC<P> = ({ tall }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    {PARTS.map(([k, Part]) => (
      <Sequence key={k} from={S[k][0]} durationInFrames={len(k)} name={k}>
        <Part tall={tall} />
      </Sequence>
    ))}
    <Vignette strength={0.35} />
    <Audio src={staticFile("soundtrack.wav")} />
  </AbsoluteFill>
);
