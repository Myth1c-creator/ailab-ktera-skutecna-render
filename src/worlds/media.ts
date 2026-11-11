// The pictures as three.js textures. All are 3:4 cards prepared by prep_photos.py (public/img): the four photos of the riddle
// (n1 zrzka u dveří, n2 drdol, n3 srdíčko, z4 zrcadlo; face + shoulders, x4 upscaled in the render repo) and the mosaic
// cards (a1, ref1, m5, ai1, ref3, m6, ref2, m7, ai3, m8; ai3 and ref2 have their logos blurred, they only appear as small
// mosaic cells). One Src per picture; every surface gets its own cover-fit "view" (a clone sharing the image) cropped
// around the face: punch-ins only ever go to the face.
import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { clamp } from "../three/shot3d";

export type Key = "n1" | "n2" | "n3" | "z4" | "a1" | "ref1" | "m5" | "ai1" | "ref3" | "m6" | "ref2" | "m7" | "ai3" | "m8";
export const LINEUP: Key[] = ["n1", "n2", "n3", "z4"];
export const PHOTOS: Key[] = ["n1", "n2", "n3", "z4", "a1", "ref1", "m5", "ai1", "ref3", "m6", "ref2", "m7", "ai3", "m8"];
export type Media = { font: Font; img: Record<string, HTMLImageElement> };

// where each card's face is (0..1 from the top left): crops and punch-ins go there
export const FACE: Record<Key, [number, number]> = {
  n1: [0.48, 0.5], n2: [0.5, 0.45], n3: [0.42, 0.37], z4: [0.45, 0.4], a1: [0.5, 0.5],
  ref1: [0.43, 0.27], m5: [0.38, 0.23], ai1: [0.34, 0.28], ref3: [0.43, 0.2], m6: [0.5, 0.23], ref2: [0.43, 0.28], m7: [0.6, 0.3], ai3: [0.42, 0.41], m8: [0.4, 0.19],
};
// the macro targets of the line-up (card fractions): the freckles, the face, the hand with the heart, the phone's glint
export const DETAIL = { n1: [0.47, 0.52], n2: [0.5, 0.47], n3h: [0.85, 0.64], n3f: [0.42, 0.37], z4: [0.62, 0.3] } as const;
export const FOCUS = FACE;

// cover-fit: the part of a picture of aspect srcA (w/h) that fills a surface of aspect dstA, around focus, zoomed in
export function fitRect(srcA: number, dstA: number, focus: [number, number] = [0.5, 0.5], zoom = 1) {
  let rx = 1, ry = 1;
  if (srcA > dstA) rx = dstA / srcA;
  else ry = srcA / dstA;
  rx /= zoom;
  ry /= zoom;
  // texture v runs bottom-up (flipY): the focus y is measured from the top
  return { rx, ry, ox: clamp(focus[0] - rx / 2, 0, 1 - rx), oy: clamp(1 - focus[1] - ry / 2, 0, 1 - ry) };
}

export class Src {
  base: THREE.Texture;
  aspect: number;
  constructor(public key: Key, public frames: (HTMLImageElement | HTMLCanvasElement)[]) {
    this.base = new THREE.Texture(frames[0]);
    this.base.colorSpace = THREE.SRGBColorSpace;
    this.base.anisotropy = 8;
    this.base.needsUpdate = true;
    const f0 = frames[0];
    this.aspect = f0 instanceof HTMLImageElement ? f0.naturalWidth / f0.naturalHeight : f0.width / f0.height;
  }
  // the picture cover-fitted to a surface of aspect a (w/h)
  view(a: number, zoom = 1, focus: [number, number] = FACE[this.key]) {
    const r = fitRect(this.aspect, a, focus, zoom);
    const t = this.base.clone();
    t.repeat.set(r.rx, r.ry);
    t.offset.set(r.ox, r.oy);
    t.needsUpdate = true;
    return t;
  }
}

export function sources(M: Media) {
  const S = {} as Record<Key, Src>;
  for (const k of PHOTOS) S[k] = new Src(k, [M.img[k]]);
  return S;
}
