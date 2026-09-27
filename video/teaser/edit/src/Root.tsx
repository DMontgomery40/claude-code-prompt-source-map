import React from "react";
import { Composition } from "remotion";
import { TraceDemo } from "./Video";
import TL from "./timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="Wide" component={TraceDemo} width={1920} height={1080} fps={TL.fps} durationInFrames={TL.fps * TL.duration} defaultProps={{ tall: false }} />
    <Composition id="Tall" component={TraceDemo} width={1080} height={1350} fps={TL.fps} durationInFrames={TL.fps * TL.duration} defaultProps={{ tall: true }} />
  </>
);
