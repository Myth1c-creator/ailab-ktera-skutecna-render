// World 1, the riddle (film 0-563): the four photos of the line-up as 3D cards in one 2x2 grid with their numbers 01-04, all of it
// one rig that a keyframed camera flies (util.ts camAt: hard cuts and whips with motion blur from the sub-frame samples).
//   0.000 frame 0 is already moving: the grid slams in tilted and zoomed, the lime "?" behind it, flash, CA
//   0.215 (kick) CUT A: a tighter angle, glitch 3 f · 0.250 KTERÁ · 0.911 JE · 0.935 (kick) CUT B + SKUTEČNÁ? lime (glitch 3 f)
//   1.767 the lime dot of the ? floods the frame · 2.105 (kick) 01 zrzka lands, scan line; 2.351 macro on the freckles
//   3.290 (kick) whip to 02 drdol (macro 3.431) · 4.441 (beat) whip to 03 srdíčko, macro on the hand 4.720, back to the face
//   5.885 (kick) whip to 04 zrcadlo, the glint 6.322 · 6.566 (beat) crane up: the four cards snap back into the grid, the scan lines
//   strobe on the eighths · 7.275 (beat) the lights go out: only the lime numbers and the frames glow (a heartbeat 7.45, 7.55)
//   7.610 ŽÁDNÁ · 7.650 THE DROP: flash 2 f, the AI LAB stamp hits all four cards, shock wave; 8.075 NENÍ · 8.353 REÁLNÁ;
//   8.495 and 8.965 (kicks) punches; 9.133 the camera rushes through the grid into the white (the finale starts 9.400)
// Every word is screen-anchored (common.ts place); the cards are in a rig placed the same way (1 rig unit = 1 px of the frame).
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { World } from "../three/shot3d";
import { BG, INK, LIME, V, aim, bursts, canvas, clamp, dust, env, glowSprite, glowTex, imgTex, inCubic, lerp, outBack, outCubic, place, placeCam, pulse, streak, type Burst, type Imp } from "./common";
import { F, S, T } from "./timing";
import { DETAIL, LINEUP, Src, type Key, type Media } from "./media";
import { lightShards, plateTex, ringTex } from "./shapes";
import { D, labelMesh, word3 } from "./kit";
import { drawMark } from "./logo";
import { camAt, showW, smooth, stage, type CamKey, type St } from "./util";

// the cards in the rig (px): 3:4, 2x2 with a 24 px gap, centre (0, 0) = the middle of the grid
export const TW = 420, TH = 560;
export const SLOT: [number, number][] = [[-222, 292], [222, 292], [-222, -292], [222, -292]];
const slotP = (i: number, f: readonly [number, number] = [0.5, 0.5]): [number, number] => [SLOT[i][0] + (f[0] - 0.5) * TW, SLOT[i][1] - (f[1] - 0.5) * TH];

// the big words: centre y and width at rest (px); the slam starts at 1.3 x, so the widest peak is 1.3 x 520 = 676 (margin 202)
export const WORDS = {
  hook: { w: 540, y: [740, 855, 985] }, // KTERÁ / JE / SKUTEČNÁ? on one scale (SKUTEČNÁ? is the widest)
  drop: { w: 500, y: [770, 900, 1030] }, // ŽÁDNÁ / NENÍ / REÁLNÁ on one scale (REÁLNÁ is the widest)
};

const st = (p: [number, number], s: [number, number], z: number, roll = 0, ry = 0, rx = 0): St => ({ p, s, z, roll, ry, rx });
const solo = (i: number, f: readonly [number, number], z: number, sy = 840): St => st(slotP(i, f), [540, sy], z, i % 2 ? 0.025 : -0.025, i % 2 ? -0.1 : 0.1, 0.04);
const GRID = (z: number, roll = 0, ry = 0, rx = 0.1): St => st([0, 0], [540, 860], z, roll, ry, rx);

const KEYS: CamKey[] = [
  { t: 0, st: st([0, 0], [540, 880], 1.55, 0.07, -0.22, 0.08), dz: -1.1, dr: -0.12 }, // frame 0: the grid slams in, tilted
  { t: S.cutA, st: st([-70, 150], [540, 830], 1.95, -0.07, 0.2, 0.05), dz: 0.3, dr: 0.05 }, // CUT A: a tighter angle on 01 / 02
  { t: S.cutB, st: st([110, -150], [540, 900], 1.55, 0.06, -0.18, -0.06), dz: 0.35, dr: -0.05 }, // CUT B: the lower half, 03 / 04
  { t: S.a1, st: solo(0, [0.5, 0.5], 1.62) }, // 01 lands (a cut behind the lime flood)
  { t: S.mac1 + 6, st: solo(0, DETAIL.n1, 2.6), dur: 0.33, dz: 0.1 }, // macro: the freckles
  { t: S.a2, st: solo(1, [0.5, 0.5], 1.6), dur: 5 / 60 }, // whip to 02
  { t: S.mac2, st: solo(1, DETAIL.n2, 2.5), dur: 0.22, dz: 0.1 }, // macro: the face
  { t: S.a3, st: solo(2, [0.5, 0.5], 1.5), dur: 6 / 60 }, // whip to 03 (diagonally across the grid)
  { t: S.hand, st: solo(2, DETAIL.n3h, 2.7), dur: 0.16, dz: 0.08 }, // macro: the hand with the heart
  { t: S.face3, st: solo(2, DETAIL.n3f, 2.3), dur: 0.25, dz: 0.05 }, // back up to the face
  { t: S.a4, st: solo(3, [0.5, 0.5], 1.55), dur: 5 / 60 }, // whip to 04
  { t: S.glint, st: solo(3, DETAIL.z4, 2.4), dur: 0.22, dz: 0.06 }, // macro: the phone's glint
  { t: S.grid, st: GRID(1.0, 0.03, 0.06, 0.1), dur: 30 / 60, dz: 0.012, dr: -0.01 }, // crane up: the whole grid
  { t: S.drop, st: GRID(1.3, -0.05, 0.12, 0.1) }, // THE DROP: a hard cut, in too close ...
  { t: S.drop + 8 / 60, st: GRID(1.04, -0.02, 0.06, 0.08), dur: 8 / 60, dz: 0.045, dr: 0.006 }, // ... and it slams back, then pushes
  { t: F.fin - 1, st: st([0, 0], [540, 860], 6.5, 0.2, 0, 0), dur: (F.fin - 1 - T.rush) / 60 }, // the rush through the middle of the grid
];

// which card is in focus (the others dim): a window per card, 6 f ramps
const ARR = [T.a1, T.a2, T.a3, T.a4];
const win = (i: number, t: number) => {
  const a = ARR[i] / 60 - 5 / 60;
  const b = i < 3 ? ARR[i + 1] / 60 - 5 / 60 : S.crane;
  return smooth((t - a) / (6 / 60)) * (1 - smooth((t - b) / (i < 3 ? 6 / 60 : 0.3)));
};
const lone = (t: number) => smooth((t - (S.a1 - 8 / 60)) / (8 / 60)) * (1 - smooth((t - S.crane) / 0.3));

const IMPS: Imp[] = [
  { t: -0.03, power: 1.2 }, { t: S.cutA, power: 0.8 }, { t: S.kter, power: 0.4 }, { t: S.cutB, power: 0.8 }, { t: S.skut, power: 0.6 }, { t: S.a1, power: 0.7 },
  { t: S.p1, power: 0.35 }, { t: S.a2, power: 0.5 }, { t: S.mac2, power: 0.25 }, { t: S.a3, power: 0.5 }, { t: S.hand, power: 0.4 }, { t: S.a4, power: 0.5 },
  { t: S.glint, power: 0.25 }, { t: S.crane, power: 0.5 }, { t: S.grid, power: 0.35 }, { t: S.heart1, power: 0.3 }, { t: S.heart2, power: 0.25 },
  { t: S.drop, power: 1.4 }, { t: S.nenit, power: 0.35 }, { t: S.real, power: 0.5 }, { t: S.k11, power: 0.6 }, { t: S.k12, power: 0.5 },
];
export const riddleSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (f < 8 || near(T.cutA, 1, 5) || near(T.cutB, 1, 5) || near(T.qGrow, 0, 22) || near(T.a2, 6, 3) || near(T.a3, 7, 3) || near(T.a4, 6, 3) || near(T.crane, 0, 40)) return 24;
  if (near(T.drop, 1, 14) || near(T.zhad, 0, 4) || near(T.k11, 0, 5) || near(T.k12, 0, 5) || f >= T.rush) return 24;
  return 12;
};

// the lime frame of a card (blurred outline), the AI LAB stamp, the lime "scan" band
let _frame: THREE.Texture | null = null;
const frameTex = () => {
  if (_frame) return _frame;
  const W = 256, H = Math.round((256 * TH) / TW);
  const c = canvas(W, H);
  const x = c.getContext("2d")!;
  x.filter = "blur(7px)";
  x.strokeStyle = "rgba(235,255,150,1)";
  x.lineWidth = 12;
  x.strokeRect(20, 20, W - 40, H - 40);
  _frame = imgTex(c);
  return _frame;
};
function stampTex() {
  const c = canvas(512, 192);
  const x = c.getContext("2d")!;
  x.fillStyle = LIME;
  x.beginPath();
  x.roundRect(8, 8, 496, 176, 30);
  x.fill();
  x.strokeStyle = INK;
  x.lineWidth = 7;
  x.beginPath();
  x.roundRect(22, 22, 468, 148, 20);
  x.stroke();
  drawMark(x, 46, 48, 96, INK);
  x.fillStyle = INK;
  x.font = "800 88px 'Instrument Sans'";
  x.textAlign = "left";
  x.textBaseline = "middle";
  x.fillText("AI LAB", 168, 100);
  return imgTex(c);
}

export type Tile = { g: THREE.Group; faceMat: THREE.MeshBasicMaterial; frameMat: THREE.MeshBasicMaterial; label: THREE.Mesh; scan: ReturnType<typeof streak>; glint: ReturnType<typeof streak>; stamp: THREE.Mesh; stampMat: THREE.MeshBasicMaterial };
export function mkTile(src: Src, i: number): Tile {
  const g = new THREE.Group();
  g.name = `pic:${src.key}`;
  const body = new THREE.Mesh(new RoundedBoxGeometry(TW + 12, TH + 12, 16, 3, 5), new THREE.MeshStandardMaterial({ color: "#14171c", metalness: 0.7, roughness: 0.28, emissive: LIME, emissiveIntensity: 0.06 }));
  body.position.z = -9;
  const faceMat = new THREE.MeshBasicMaterial({ map: src.view(TW / TH, 1) });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), faceMat);
  face.position.z = 0.5;
  const frameMat = new THREE.MeshBasicMaterial({ map: frameTex(), color: LIME, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(TW * 1.12, TH * 1.09), frameMat);
  frame.position.z = 2;
  const lab = labelMesh(`0${i + 1}`, { css: "700 60px 'Geist Mono'", color: LIME, w: 176, h: 96, bg: "rgba(11,13,16,0.9)" });
  lab.mesh.name = `label:0${i + 1}`;
  lab.mesh.position.z = 4;
  const scan = streak(TW * 1.1, 90);
  scan.mesh.position.z = 3;
  scan.mesh.visible = false;
  const glint = streak(TW * 0.55, 330, "#ffffff");
  glint.mesh.position.z = 5;
  glint.mesh.rotation.z = -0.55;
  glint.mesh.visible = false;
  const stampMat = new THREE.MeshBasicMaterial({ map: stampTex(), transparent: true, depthWrite: false });
  const stamp = new THREE.Mesh(new THREE.PlaneGeometry(1, 192 / 512), stampMat);
  stamp.position.set(0, -30, 20);
  stamp.visible = false;
  g.add(body, face, frame, lab.mesh, scan.mesh, glint.mesh, stamp);
  return { g, faceMat, frameMat, label: lab.mesh, scan, glint, stamp, stampMat };
}

export function buildRiddle(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK, lights } = stage(new THREE.Color(BG));
  // the rig: `pivot` sits at the camera's focus point on screen (zoom, tilt, roll), `inner` holds the cards, offset by -focus
  const pivot = new THREE.Group();
  const inner = new THREE.Group();
  pivot.add(inner);
  scene.add(pivot);
  const tiles = LINEUP.map((k, i) => {
    const T0 = mkTile(SR[k], i);
    T0.g.position.set(SLOT[i][0], SLOT[i][1], 0);
    inner.add(T0.g);
    return T0;
  });
  // words
  const wK = word3(M, scene, "KTERÁ");
  const wJ = word3(M, scene, "JE");
  const wS = word3(M, scene, "SKUTEČNÁ?", LIME, "#4f6600", 0.85, 0.35);
  const sH = WORDS.hook.w / wS.w;
  const wZ = word3(M, scene, "ŽÁDNÁ");
  const wN = word3(M, scene, "NENÍ");
  const wR = word3(M, scene, "REÁLNÁ", LIME, "#4f6600", 0.85, 0.35);
  const sD = WORDS.drop.w / wR.w;
  const bigQ = word3(M, scene, "?", LIME, "#4f6600", 0.7, 0.3);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: plateTex(), transparent: true, opacity: 0, depthWrite: false }));
  plate.renderOrder = -1;
  scene.add(plate);
  // the lime flood out of the dot of the "?"
  const flood = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0 }));
  flood.visible = false;
  scene.add(flood);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(ring);
  const ringS = tiles.map(() => {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
    inner.add(r);
    return r;
  });
  // warm light leaks: the lamp of 02 seeps into the room, a leak crosses the heart of 03 (lime-white on the rest)
  const leakTex = glowTex("rgba(255,226,170,0.9)", "rgba(255,176,96,0.35)", "rgba(255,150,60,0)");
  const leaks = [{ t0: S.a2, x: 190, y: 760, w: 1100, dur: 0.55 }, { t0: S.hand, x: 760, y: 980, w: 1000, dur: 0.5 }, { t0: S.a4, x: 880, y: 640, w: 900, dur: 0.4 }].map((l) => ({ ...l, m: glowSprite(leakTex) }));
  leaks.forEach((l) => {
    l.m.visible = false;
    scene.add(l.m);
  });
  const LS = lightShards(70, "rd", 1);
  scene.add(LS.group);
  const BL: Burst[] = [{ t: S.drop, at: V(0, -0.1, 1.4), power: 2.2, lime: 0.6, up: 1.3 }, { t: S.k11, at: V(0, -0.5, 1.4), power: 1.2, lime: 0.7 }, { t: S.k12, at: V(0, 0.4, 1.4), power: 1.0, lime: 0.7 }];
  const BU = bursts(BL, 90, 0.022, "rb");
  scene.add(BU.points);
  const DU = dust(70, [2.2, 3.4, 1.4], V(0, 0, 1.0), "#ffffff", 0.02, "rd");
  scene.add(DU.points);

  const update = (t: number) => {
    const cs = camAt(t, KEYS);
    const dk = t >= S.grid && t < S.drop ? smooth((t - S.grid) / (4 / 60)) : 0; // the blackout
    const roll0 = 0.012 * Math.sin(t * 1.1);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll0);
    placeCam(camera, V(0.05 * Math.sin(t * 0.9), 0.04 * Math.sin(t * 0.7), 6), V(0, 0, 0), 36, roll0, t, IMPS, 0.008);
    lights(1 - 0.96 * dk);
    (scene.background as THREE.Color).copy(new THREE.Color(BG)).multiplyScalar(1 - 0.85 * dk);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.3 * cs.roll]);
    grid.set(t, 90, -150, "graphite", 1.3 * (1 - dk));
    BK.update(t);
    BK.mat.opacity = 0.45 * (1 - 0.8 * dk);
    DU.update(t);
    DU.mat.opacity = 0.7 * (0.6 + 0.4 * dk);

    // ── the rig ──
    place(pivot, base, cs.s[0], cs.s[1], 1000 * cs.z, 1000, D, [cs.rx, cs.ry, cs.roll]);
    inner.position.set(-cs.p[0], -cs.p[1], 0);
    const L = lone(t);
    tiles.forEach((tl, i) => {
      const w = win(i, t);
      const b = lerp(1, 0.26 + 0.74 * w, L);
      tl.faceMat.color.setScalar(b * (1 - 0.97 * dk) + (t >= S.drop && t < S.drop + 3 / 60 ? 0.35 : 0));
      tl.g.position.z = -150 * (1 - w) * L;
      // the frame: always lime; in the blackout it is the only light, and it beats twice
      const hb = Math.max(pulse(t, S.heart1, 22) * (t >= S.heart1 ? 1 : 0), pulse(t, S.heart2, 22) * (t >= S.heart2 ? 1 : 0));
      tl.frameMat.opacity = Math.min(1, 0.45 + 0.4 * dk + 0.5 * hb + 0.3 * w * L);
      // the number: 150 px on screen whatever the zoom
      const lw = 150 / cs.z;
      tl.label.scale.setScalar(lw);
      tl.label.position.set(-TW / 2 + lw / 2 + 12, TH / 2 - lw / 1.833 / 2 - 12, 4);
      // scan line: at the card's arrival (0.45 s) and strobing on the eighths of the crane (394, 415, 436: 0.25 s)
      const scanAt = [ARR[i] / 60, S.crane, S.strobe1, S.grid].map((s0, k) => [(t - s0) / (k === 0 ? 0.45 : 0.25), k] as [number, number]).find(([u]) => u >= 0 && u < 1);
      tl.scan.mesh.visible = !!scanAt && !(dk > 0);
      if (scanAt) {
        tl.scan.mesh.position.y = TH / 2 - scanAt[0] * TH;
        tl.scan.mat.opacity = 0.85 * Math.sin(Math.PI * scanAt[0]);
      }
      // 04: the mirror's glint sweeps across the card on "zrcadla" (0.35 s)
      const ga = (t - S.glint) / 0.35;
      tl.glint.mesh.visible = i === 3 && ga >= 0 && ga < 1;
      if (tl.glint.mesh.visible) {
        tl.glint.mesh.position.x = lerp(-TW * 0.8, TW * 0.8, ga);
        tl.glint.mat.opacity = 0.9 * Math.sin(Math.PI * ga);
      }
      // the AI LAB stamp (drop + 2 f per card)
      const ts = S.drop + (i * 2) / 60;
      const a = t - ts;
      tl.stamp.visible = a >= 0;
      if (a >= 0) {
        tl.stamp.scale.setScalar(340 * lerp(2.4, 1, outBack(clamp(a / (6 / 60)), 1.3)));
        tl.stamp.rotation.z = -0.1 + 0.02 * Math.sin(t * 2 + i);
        tl.stampMat.opacity = clamp(a / (2 / 60));
      }
      const ra = a;
      ringS[i].visible = ra >= 0 && ra < 0.4;
      if (ringS[i].visible) {
        ringS[i].position.set(SLOT[i][0], SLOT[i][1] - 30, 30);
        ringS[i].scale.setScalar(200 + 700 * outCubic(ra / 0.4));
        (ringS[i].material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - ra / 0.4);
      }
    });

    for (const l of leaks) {
      const u = (t - l.t0) / l.dur;
      l.m.visible = u >= 0 && u < 1;
      if (l.m.visible) {
        place(l.m, base, l.x + 120 * u, l.y - 60 * u, l.w, 1, D - 0.6);
        (l.m.material as THREE.MeshBasicMaterial).opacity = 0.75 * Math.sin(Math.PI * u);
      }
    }
    // ── the hook words (0.250 KTERÁ, 0.911 JE, 0.935 SKUTEČNÁ?) over the flying cards, a soft plate keeps them readable ──
    const hookEnd = S.a1;
    const wpx = (w: { w: number }) => w.w * sH;
    showW(wK, base, t, S.kter, hookEnd, 540, WORDS.hook.y[0], wpx(wK), { from: 1.3, punch: [S.cutB], seed: 0.4 });
    showW(wJ, base, t, S.je, hookEnd, 540, WORDS.hook.y[1], wpx(wJ), { from: 1.3, punch: [S.cutB], seed: 1.1 });
    showW(wS, base, t, S.skut, hookEnd, 540, WORDS.hook.y[2], WORDS.hook.w, { from: 1.3, punch: [], seed: 2.3 });
    {
      const on = t >= S.kter && t < hookEnd;
      plate.visible = on || (t >= S.zhad && t < S.fin);
      const o = t < S.a1 ? 0.65 * clamp((t - S.kter) / 0.1) : 0.8 * clamp((t - S.zhad) / (5 / 60));
      (plate.material as THREE.MeshBasicMaterial).opacity = o;
      place(plate, base, 540, t < S.a1 ? 860 : 900, t < S.a1 ? 1500 : 1400, 1, D + 0.5);
      // the giant lime "?" behind the grid (frame 0 to the flood)
      bigQ.g.visible = t < S.a1;
      if (bigQ.g.visible) place(bigQ.g, base, 540, 900, 560 * (1 + 0.05 * t), bigQ.w, D + 1.6, [0.1, -0.12 * Math.sin(t * 2), 0]);
      // the flood: grows out of the dot of SKUTEČNÁ?'s "?" (frame x ~ 540 + 0.43 w, y of the word), clears on the kick 2.105
      const g0 = S.qGrow, g1 = S.a1;
      flood.visible = t >= g0 && t < g1 + 5 / 60;
      if (flood.visible) {
        const u = clamp((t - g0) / (g1 - g0));
        place(flood, base, lerp(540 + 0.43 * WORDS.hook.w, 540, u), lerp(WORDS.hook.y[2] + 30, 960, u), 60 + 3400 * inCubic(u), 2, D - 1.2);
        (flood.material as THREE.MeshBasicMaterial).opacity = t < g1 ? 1 : 1 - clamp((t - g1) / (5 / 60));
      }
    }
    // ── THE DROP words ──
    showW(wZ, base, t, S.zhad, S.rush + 0.1, 540, WORDS.drop.y[0], wZ.w * sD, { from: 1.3, punch: [S.k11, S.k12], seed: 0.8 });
    showW(wN, base, t, S.nenit, S.rush + 0.1, 540, WORDS.drop.y[1], wN.w * sD, { from: 1.3, punch: [S.k11, S.k12], seed: 1.6 });
    showW(wR, base, t, S.real, S.rush + 0.1, 540, WORDS.drop.y[2], wR.w * sD, { from: 1.35, punch: [S.k11, S.k12], seed: 2.4 });
    {
      const rr = [S.drop, S.k11, S.k12].map((h) => t - h).find((d) => d >= 0 && d < 0.45);
      ring.visible = rr !== undefined;
      if (rr !== undefined) {
        place(ring, base, 540, 900, 300 + 2800 * outCubic(rr / 0.45), 1, D + 0.3);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - rr / 0.45);
      }
      LS.update(t, S.drop, V(0, -0.1, 1.2), 2.2, 0.8);
      BU.update(t);
    }

    // ── the grade: flash on frame 0, the glitch cuts, the drop's 4 f, the rush into the white ──
    const f60 = t * 60;
    const fl = f60 < 4 ? [0.55, 0.35, 0.2, 0.08][Math.floor(f60)] : 0;
    const dropFl = t >= S.drop && t < S.drop + 4 / 60 ? [1.0, 0.75, 0.45, 0.2][Math.floor((t - S.drop) * 60)] : 0;
    const gl = (t0: number) => (t >= t0 && t < t0 + 3 / 60 ? 1 : 0);
    const rushFl = smooth((t - (F.fin - 8) / 60) / (8 / 60));
    return {
      focus: D,
      ap: 4,
      flash: Math.max(fl, dropFl, t >= S.a1 && t < S.a1 + 1 / 60 ? 0.3 : 0, t >= S.cutB && t < S.cutB + 1 / 60 ? 0.3 : 0, rushFl, env(t, IMPS, 30) * 0.05),
      ca: 0.3 + env(t, IMPS, 14) * 1.2 + (f60 < 3 ? 3 : 0) + (gl(S.cutA) + gl(S.cutB)) * 2.6 + (t >= S.drop && t < S.drop + 3 / 60 ? 3.2 : 0),
      glitch: Math.max(gl(S.cutA), gl(S.cutB)) * 0.9,
      vig: 0.1 * dk,
    };
  };
  return { scene, camera, update };
}
