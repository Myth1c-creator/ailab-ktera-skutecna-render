// Small pieces shared by the two worlds (from ads/ailab-prompt-post src/worlds/boards.ts: the stage, the word slam, the punch).
import * as THREE from "three";
import { V, clamp, lerp, outBack, place, pulse } from "./common";
import { bokeh, hudGrid } from "./shapes";
import { D, wordTilt, type W3 } from "./kit";

export const smooth = (u: number) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};
// a punch (a 5 % scale kick) that decays: k * e^(-8 a), from frame t0 on
export const punchK = (t: number, t0: number, k: number) => k * pulse(t, t0, 8) * clamp((t - t0) * 60);

// the stage: graphite ground, the camera and its clean twin (the type is anchored to `base`, the shaking `camera` shakes it with
// the world), key + rim light, the HUD grid and lime bokeh
export function stage(ground: THREE.Color) {
  const scene = new THREE.Scene();
  scene.background = ground.clone();
  const camera = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  const base = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  const hemi = new THREE.HemisphereLight("#eef2f6", "#08090b", 0.75);
  const key = new THREE.DirectionalLight("#fff4ea", 1.1);
  key.position.set(-3, 4, 6);
  const rimL = new THREE.DirectionalLight("#e2ffa0", 0.9);
  rimL.position.set(4, -1, 2);
  scene.add(hemi, key, rimL);
  const grid = hudGrid(240);
  scene.add(grid.mesh);
  const BK = bokeh(40, [3.4, 6, 2], V(0, 0, -3), V(0.5, 0.8, 0), 0.3, "bs", 0.45);
  scene.add(BK.points);
  // the lights, scaled together (the blackout)
  const lights = (k: number) => {
    hemi.intensity = 0.75 * k;
    key.intensity = 1.1 * k;
    rimL.intensity = 0.9 * k;
  };
  return { scene, camera, base, grid, BK, lights };
}

// a word: slams in at t0 (from `from` x its size, overshoot), punches, sways; hidden before t0 and from t1 on. `d` = the distance
// of its layer from the base camera (its px size does not depend on it)
export function showW(w: W3, base: THREE.PerspectiveCamera, t: number, t0: number, t1: number, x: number, y: number, wpx: number, o: { from?: number; punch?: number[]; seed?: number; d?: number; k?: number } = {}) {
  const a = t - t0;
  w.g.visible = a >= 0 && t < t1;
  if (!w.g.visible) return false;
  const slam = lerp(o.from ?? 1.3, 1, outBack(clamp(a / (7 / 60)), 1.25));
  const p = (o.punch ?? []).reduce((m, tp) => m + punchK(t, tp, 0.05), 0);
  place(w.g, base, x, y, wpx * slam * (1 + p) * (1 + 0.015 * a) * (o.k ?? 1), w.w, o.d ?? D, wordTilt(t, o.seed ?? y * 0.01));
  return true;
}

// a keyframed camera over a rig: each key is a state; `dur` > 0 means the camera TRAVELS to it during the `dur` seconds before
// key.t (a whip, a push), no `dur` means a hard cut at key.t. dz / dr: slow drift of the zoom / roll from key.t on
export type St = { p: [number, number]; s: [number, number]; z: number; roll: number; ry: number; rx: number };
export type CamKey = { t: number; st: St; dur?: number; dz?: number; dr?: number };
const mixSt = (a: St, b: St, u: number): St => ({
  p: [lerp(a.p[0], b.p[0], u), lerp(a.p[1], b.p[1], u)],
  s: [lerp(a.s[0], b.s[0], u), lerp(a.s[1], b.s[1], u)],
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)),
  roll: lerp(a.roll, b.roll, u), ry: lerp(a.ry, b.ry, u), rx: lerp(a.rx, b.rx, u),
});
export function camAt(t: number, keys: CamKey[], ease: (u: number) => number = smooth): St {
  let i = 0;
  while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
  const k = keys[i];
  const at = (kk: CamKey, x: number): St => ({ ...kk.st, z: kk.st.z + (kk.dz ?? 0) * Math.max(0, x - kk.t), roll: kk.st.roll + (kk.dr ?? 0) * Math.max(0, x - kk.t) });
  const cur = at(k, t);
  const n = keys[i + 1];
  if (n && n.dur && t > n.t - n.dur) return mixSt(cur, at(n, n.t), ease((t - (n.t - n.dur)) / n.dur));
  return cur;
}
