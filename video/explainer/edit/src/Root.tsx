import React from "react";
import { Composition } from "remotion";
import { Explainer } from "./Video";
import TL from "./timeline.json";

export const Root: React.FC = () => (
  <>
    <Composition id="Wide" component={Explainer} width={1920} height={1080} fps={TL.fps} durationInFrames={Math.round(TL.fps * TL.duration)} defaultProps={{ tall: false }} />
    <Composition id="Tall" component={Explainer} width={1080} height={1350} fps={TL.fps} durationInFrames={Math.round(TL.fps * TL.duration)} defaultProps={{ tall: true }} />
  </>
);
