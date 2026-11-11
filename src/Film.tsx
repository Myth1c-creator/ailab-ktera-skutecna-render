// The film's whole picture (1134 frames, 60 fps): two three.js worlds rendered by AccumShot (sub-frame motion blur, DOF, grade; the
// accumulator clears to black), one after another (src/worlds/timing.ts F):
//   the riddle 0-563 (the 2x2 grid of the four photos, 01-04, the line-up, the blackout, THE DROP "Žádná není reálná")
//   the finale 564-1133 (the AI LAB mosaic of photos, the speech bubble with JAK, the logo)
// Fonts (the 3D typeface and the web fonts the canvas textures draw with) and the photos are loaded before a world mounts: a
// delayRender inside the r3f tree would leak.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { AccumShot, type Grade } from "./three/shot3d";
import { F } from "./worlds/timing";
import { PHOTOS, sources, type Media } from "./worlds/media";
import { buildRiddle, riddleSamples } from "./worlds/riddle";
import { buildFinale, finaleSamples } from "./worlds/finale";

const FONTS: [string, string, FontFaceDescriptors][] = [
  ["Instrument Sans", "fonts/InstrumentSans.ttf", { weight: "400 700", stretch: "75% 100%" }],
  ["Geist Mono", "fonts/geist-mono-latin-wght-normal.woff2", { weight: "100 900" }],
  ["Geist Mono", "fonts/geist-mono-latin-ext-wght-normal.woff2", { weight: "100 900" }],
  ["Unbounded", "fonts/Unbounded-wght.ttf", { weight: "200 900" }],
];
const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((ok, bad) => {
    const i = new Image();
    i.onload = () => i.decode().then(() => ok(i), () => ok(i));
    i.onerror = () => bad(new Error("image " + src));
    i.src = staticFile(src);
  });
let cache: Media | null = null;
let loading: Promise<Media> | null = null;
const loadAssets = () =>
  (loading ??= Promise.all(FONTS.map(([fam, file, d]) => new FontFace(fam, `url(${staticFile(file)})`, d).load().then((l) => document.fonts.add(l)))).then(async () => {
    // canvas text only uses a web font that is already decoded at the size/weight it asks for
    await Promise.all(["700 150px 'Instrument Sans'", "800 88px 'Instrument Sans'", "700 60px 'Geist Mono'", "800 200px Unbounded"].map((f) => document.fonts.load(f, "AÁČŠĚŘÍÉŮŽŇÚ?.:0123456789")));
    const font = new FontLoader().parse(await fetch(staticFile("fonts/unbounded_800_clean.typeface.json")).then((r) => r.json()));
    const img: Record<string, HTMLImageElement> = {};
    for (const k of PHOTOS) img[k] = await loadImg(`img/${k}.jpg`);
    cache = { font, img };
    return cache;
  }));
const useAssets = () => {
  const [handle] = useState(() => delayRender("assets"));
  const [a, setA] = useState<Media | null>(cache);
  useEffect(() => {
    loadAssets().then((x) => {
      setA(x);
      continueRender(handle);
    });
  }, [handle]);
  return a;
};

// dark, contrasty, neutral: the photos keep their own colours; the flash is added after sRGB (never a pink wash)
const GRADE: Grade = { tint: [1, 1, 1], amount: 0, contrast: 1.08, vignette: 0.32, flashColor: [0.95, 0.97, 0.9] };

export const Film3D: React.FC = () => {
  const A = useAssets();
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (!A) return <AbsoluteFill style={{ background: "#0B0D10" }} />;
  const w = frame < F.fin ? 1 : 2;
  return (
    <AbsoluteFill style={{ background: "#0B0D10" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: false, toneMapping: THREE.NoToneMapping, outputColorSpace: THREE.SRGBColorSpace }}>
        {w === 1 ? <AccumShot key="w1" frame={frame} build={() => buildRiddle(A, sources(A))} samples={riddleSamples} grade={GRADE} /> : null}
        {w === 2 ? <AccumShot key="w2" frame={frame} build={() => buildFinale(A, sources(A))} samples={finaleSamples} grade={GRADE} /> : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
