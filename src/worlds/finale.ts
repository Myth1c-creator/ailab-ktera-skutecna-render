// World 2, the finale (film 564-1133): the mosaic, the speech bubble with JAK, the logo.
//   9.400 (beat) the first cells fly in out of the depth (motion blur) and stack into 3D letters AI / LAB: 46 mini photos (the faces of
//         the 14 cards, ai3 and ref2 only as small cells), pixel-font letters of 5 x 3 cells; "Všechny" 9.526; the second wave on the
//         beat 10.108; "AI LAB" 10.490; 10.560 (kick) the last cell lands: the mosaic spells AI LAB, shatter ring, light sweep over it
//   11.505 (kick) pull-back punch · 12.275 (kick) the mosaic bursts into its cells (flying at the camera, spinning)
//   13.130 (kick) the speech bubble (graphite, lime rim, no social app's UI) pops in with typing dots; the four riddle photos orbit
//         behind it in the dark · 13.752 "jak?" JAK slams (lime, 440 px) · 14.367 NAPIŠ · 14.751 DO KOMENTÁŘE · 15.095 punch ·
//         15.552 JAK slams again (ring, pulse) · 15.993 the two lines whip away · 16.144 POŠLU · 16.480 TI · 16.631 ODKAZ
//   17.235 (kick) the bubble bursts, the AI LAB logo slams (mark + wordmark, flash 2 f), a small lime JAK tag under it · 17.901 (beat)
//         a light sweep (the last new thing) · from 18.170 the clean end card (a slow push), the music's tail
// Words are screen-anchored (common.ts place); their px sizes are below and in check_text3d.py.
import * as THREE from "three";
import type { World } from "../three/shot3d";
import {
  BG, LIME, PAPER, V, aim, bursts, canvas, clamp, env, glowTex, imgTex, inCubic, letters3D, lerp, outBack, outCubic, pillTex, place, placeCam, pulse,
  rnd, screenPoint, sg, streak, tw, type Burst, type Imp,
} from "./common";
import { BEAT, F, FRAMES, S, T } from "./timing";
import { FACE, LINEUP, Src, type Key, type Media } from "./media";
import { bokeh, lightShards, plateTex, rayFan, ringTex } from "./shapes";
import { D, word3 } from "./kit";
import { markMesh } from "./logo";
import { TW, mkTile } from "./riddle";
import { camAt, showW, smooth, stage, type CamKey, type St } from "./util";

// the words and the logo (frame px at rest)
export const CTA = {
  jak: { y: 860, w: 440 },
  napis: { y: 690, w: 340 },
  koment: { y: 1030, w: 540 }, // DO KOMENTÁŘE
  poslu: { y: 690, w: 430 }, // POŠLU TI
  odkaz: { y: 1030, w: 420 },
  logoY: 860,
  mark: { x: 352, w: 170 },
  word: { x: 632, w: 330 },
  tagY: 1000,
};
export const BUBBLE = { x: 540, y: 860, w: 760, h: 560 };
const P = 68; // the mosaic's pitch (cell 62 px + 6 px gap)
const MOSAIC_S: [number, number] = [540, 790];

const GLYPH: Record<string, string[]> = {
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  L: ["#..", "#..", "#..", "#..", "###"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
};
// the cells of "AI" (rows 0-4) and "LAB" (rows 6-10) in a 11 x 11 grid: [col, row]
function mosaicCells() {
  const out: { c: number; r: number; line: number }[] = [];
  const put = (s: string, c0: number, r0: number, line: number) =>
    [...s].forEach((ch, k) => GLYPH[ch].forEach((row, r) => [...row].forEach((v, c) => v === "#" && out.push({ c: c0 + k * 4 + c, r: r0 + r, line }))));
  put("AI", 2, 0, 0);
  put("LAB", 0, 6, 1);
  return out;
}
const DEP = 14; // frames a cell flies

const st = (p: [number, number], s: [number, number], z: number, roll = 0, ry = 0, rx = 0): St => ({ p, s, z, roll, ry, rx });
const KEYS: CamKey[] = [
  { t: S.fin, st: st([0, 0], MOSAIC_S, 1.28, 0.08, -0.26, 0.1), dz: -0.3, dr: -0.03 },
  { t: S.waveB, st: st([0, 0], MOSAIC_S, 1.08, -0.06, 0.24, 0.06), dz: -0.08 }, // a cut on the second wave
  { t: S.done, st: st([0, 0], MOSAIC_S, 1.14, 0.0, 0.08, 0.04), dz: -0.1, dr: 0.01 }, // the last cell lands: punch in, then pull back
  { t: S.k14, st: st([0, 0], MOSAIC_S, 1.06, 0.02, -0.1, 0.05), dz: -0.07 },
  { t: S.brk, st: st([0, 0], MOSAIC_S, 1.0, 0.0, 0.0, 0.0), dz: -0.5, dr: 0.12 },
];

const IMPS: Imp[] = [
  { t: S.fin, power: 0.6 }, { t: S.waveB, power: 0.4 }, { t: S.done, power: 1.0 }, { t: S.k14, power: 0.5 }, { t: S.brk, power: 0.9 }, { t: S.bub, power: 0.8 },
  { t: S.jak, power: 0.9 }, { t: S.napis, power: 0.3 }, { t: S.do, power: 0.3 }, { t: S.k19, power: 0.35 }, { t: S.jak2, power: 0.7 }, { t: S.poslu, power: 0.3 },
  { t: S.ti, power: 0.25 }, { t: S.odkaz, power: 0.4 }, { t: S.lockup, power: 1.0 }, { t: S.sweep, power: 0.25 },
];
export const finaleSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (near(T.fin, 0, 10) || (f >= T.fin && f <= T.done + 3) || near(T.brk, 0, 24) || near(T.bub, 0, 10) || near(T.jak, 0, 8) || near(T.jak2, 0, 8) || near(T.lockup, 0, 10) || near(T.swap, 6, 2)) return 24;
  return 14;
};

function bubbleShape(w: number, h: number, r: number) {
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + 110, y0);
  s.lineTo(x0 + 56, y0 - 135); // the tail
  s.lineTo(x0 + 250, y0);
  s.lineTo(x1 - r, y0);
  s.quadraticCurveTo(x1, y0, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.quadraticCurveTo(x1, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.quadraticCurveTo(x0, y1, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

function lineTex(s: string, css: string, color: string, w: number, h: number) {
  const c = canvas(w, h);
  const x = c.getContext("2d")!;
  x.font = css;
  x.fillStyle = color;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(s, w / 2, h / 2 + 2);
  return { tex: imgTex(c), frac: x.measureText(s).width / w };
}

export function buildFinale(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK } = stage(new THREE.Color(BG));
  const dust = bokeh(40, [3.4, 6, 2], V(0, 0, 0.5), V(-0.4, 0.7, 0), 0.12, "fd", 0.5);
  dust.mat.opacity = 0.4;
  scene.add(dust.points);

  // ── the mosaic: 46 mini photos in the pixel letters AI / LAB, in a rig (1 rig unit = 1 px) ──
  const pivot = new THREE.Group();
  const inner = new THREE.Group();
  pivot.add(inner);
  pivot.name = "mosaic";
  scene.add(pivot);
  const ORDER: Key[] = ["n1", "m5", "ai1", "n3", "ref1", "m6", "a1", "ref3", "n2", "m7", "ref2", "m8", "z4", "ai3"];
  const cells = mosaicCells().map((c, i) => {
    const key = ORDER[i % ORDER.length];
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(P - 6, P - 6, 10), new THREE.MeshStandardMaterial({ color: "#14171c", metalness: 0.7, roughness: 0.28 }));
    body.position.z = -6;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(P - 6, P - 6), new THREE.MeshBasicMaterial({ map: SR[key].view(1, 1.05 + 0.9 * rnd(`mz${i}`), FACE[key]) }));
    face.position.z = 0.5;
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(P * 1.1, P * 1.1), new THREE.MeshBasicMaterial({ map: glowTex("rgba(198,255,0,0)", "rgba(198,255,0,0.22)", "rgba(198,255,0,0)"), color: LIME, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    edge.position.z = 1.5;
    g.add(body, face, edge);
    g.visible = false;
    inner.add(g);
    return { g, edge, c: c.c, r: c.r, line: c.line, key, i };
  });
  // arrival frames: AI's cells over 572-598, LAB's over 606-634 (the last one lands on the kick 634), in a shuffled order
  const arr = new Map<number, number>();
  for (const line of [0, 1]) {
    const L = cells.filter((q) => q.line === line).sort((a, b) => rnd(`mo${a.i}`) - rnd(`mo${b.i}`));
    const [a0, a1] = line === 0 ? [T.fin + 8, T.fin + 34] : [T.waveB, T.done];
    L.forEach((q, k) => arr.set(q.i, Math.round(lerp(a0, a1, k / (L.length - 1)))));
  }
  const home = (q: { c: number; r: number }): [number, number] => [(q.c - 5) * P, (5 - q.r) * P];
  const sweepM = streak(1100, 190);
  inner.add(sweepM.mesh);
  sweepM.mesh.visible = false;

  // ── the speech bubble: graphite slab with a lime rim, the tail bottom left; typing dots until JAK ──
  const bub = new THREE.Group();
  bub.name = "bubble";
  const sh = bubbleShape(BUBBLE.w, BUBBLE.h, 80);
  const bodyG = new THREE.ExtrudeGeometry(sh, { depth: 36, bevelEnabled: true, bevelThickness: 8, bevelSize: 8, bevelSegments: 3, curveSegments: 12 });
  const bubBody = new THREE.Mesh(bodyG, new THREE.MeshStandardMaterial({ color: "#171B21", metalness: 0.55, roughness: 0.3, emissive: LIME, emissiveIntensity: 0.05 }));
  bubBody.position.z = -18;
  const rimG = new THREE.ExtrudeGeometry(sh, { depth: 10, bevelEnabled: false, curveSegments: 12 });
  const rimMat = new THREE.MeshBasicMaterial({ color: LIME });
  const bubRim = new THREE.Mesh(rimG, rimMat);
  bubRim.scale.set(1.05, 1.07, 1);
  bubRim.position.z = -34;
  const gloss = new THREE.Mesh(new THREE.PlaneGeometry(BUBBLE.w * 0.9, BUBBLE.h * 0.9), new THREE.MeshBasicMaterial({ map: glowTex("rgba(255,255,255,0.10)", "rgba(255,255,255,0.03)", "rgba(255,255,255,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  gloss.position.set(-60, 60, 24);
  const dots = [-64, 0, 64].map((x) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(20, 24), new THREE.MeshBasicMaterial({ color: LIME }));
    m.position.set(x, 0, 24);
    return m;
  });
  bub.add(bubRim, bubBody, gloss, ...dots);
  bub.visible = false;
  scene.add(bub);
  // the four riddle photos orbiting behind it (dim, out of focus)
  const orbit = LINEUP.map((k, i) => {
    const o = mkTile(SR[k], i);
    o.label.visible = false;
    o.stamp.visible = true;
    o.stamp.scale.setScalar(270);
    o.stampMat.opacity = 1;
    o.g.visible = false;
    scene.add(o.g);
    return o;
  });

  // ── the words in the bubble ──
  const wJ = word3(M, scene, "JAK", LIME, "#4f6600", 0.85, 0.35);
  const wN = word3(M, scene, "NAPIŠ");
  const wK = word3(M, scene, "DO KOMENTÁŘE");
  const wO = word3(M, scene, "ODKAZ");
  const poslu = letters3D(M.font, "POŠLU TI", { size: 1, depth: 0.22, face: PAPER, side: LIME, faceEmissive: 0.3, sideEmissive: 0.45 });
  poslu.group.visible = false;
  poslu.group.name = "word:POŠLU TI";
  scene.add(poslu.group);
  const ringJ = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(ringJ);
  const ringM = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(ringM);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: plateTex(), transparent: true, opacity: 0, depthWrite: false }));
  plate.renderOrder = -1;
  scene.add(plate);

  // ── the logo (copied from the AI LAB lockup of the earlier ads): the extruded mark, the wordmark, rays, ring, the JAK tag ──
  const mark = markMesh(0.24);
  const markG = new THREE.Group();
  markG.add(mark.mesh);
  markG.name = "logo:mark";
  scene.add(markG);
  const wm = lineTex("AI LAB", "700 150px 'Instrument Sans'", PAPER, 768, 200);
  const wordMat = new THREE.MeshStandardMaterial({ map: wm.tex, transparent: true, emissive: "#ffffff", emissiveMap: wm.tex, emissiveIntensity: 0.9, roughness: 0.4, alphaTest: 0.3 });
  const wordM = new THREE.Mesh(new THREE.PlaneGeometry(1, 200 / 768), wordMat);
  wordM.name = "logo:wordmark";
  scene.add(wordM);
  const logoRays = rayFan(16, 6, 0.6, "#efffcf", "lg");
  scene.add(logoRays.group);
  const logoRing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(logoRing);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(2, 1), new THREE.MeshBasicMaterial({ map: pillTex("JAK"), transparent: true }));
  tag.name = "label:JAK";
  scene.add(tag);
  const sweepL = streak(1, 0.3);
  scene.add(sweepL.mesh);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex("rgba(198,255,0,0.16)", "rgba(198,255,0,0.05)", "rgba(198,255,0,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(halo);

  const LS = lightShards(60, "fn", 1);
  scene.add(LS.group);
  const LS2 = lightShards(60, "fk", 1);
  scene.add(LS2.group);
  const BL: Burst[] = [{ t: S.brk, at: V(0, 0, 1.4), power: 2.4, lime: 0.5, up: 1.2 }, { t: S.lockup, at: V(0, 0.1, 1.4), power: 2.4, lime: 0.6, up: 1.2 }];
  const BU = bursts(BL, 100, 0.022, "fb");
  scene.add(BU.points);
  const gridF = grid;

  const update = (t: number) => {
    const sway = Math.sin(t * 0.7);
    const roll0 = 0.012 * sway;
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll0);
    placeCam(camera, V(0.06 * sway, 0.04 * Math.sin(t * 0.9), 6), V(0, 0, 0), 36, roll0, t, IMPS, t > S.calm ? 0.004 : 0.008);
    const te = Math.max(0, t - S.lockup);
    place(gridF.mesh, base, 540, 960, gridF.W, 1, D + 4, [0, 0, -0.05 + 0.04 * Math.sin(t * 0.4)]);
    gridF.set(t, -200, 160, "graphite", 1.3);
    BK.update(t);
    BK.mat.opacity = 0.4;
    dust.update(t);

    // ── the mosaic ──
    const cs = camAt(t, KEYS);
    pivot.visible = t < S.brk + 0.9;
    if (pivot.visible) {
      place(pivot, base, cs.s[0], cs.s[1], 1000 * cs.z, 1000, D, [cs.rx, cs.ry, cs.roll]);
      inner.position.set(-cs.p[0], -cs.p[1], 0);
      for (const q of cells) {
        const ta = arr.get(q.i)! / 60;
        const u = clamp((t - (ta - DEP / 60)) / (DEP / 60));
        const [hx, hy] = home(q);
        q.g.visible = u > 0;
        if (!q.g.visible) continue;
        const e = outBack(u, 0.9);
        const fx = sg(`mx${q.i}`) * 900, fy = sg(`my${q.i}`) * 1300 - 300;
        let x = lerp(hx + fx, hx, e), y = lerp(hy + fy, hy, e), z = lerp(-1700, 0, outCubic(u));
        let rz = lerp(sg(`mr${q.i}`) * 2.4, 0, outCubic(u)), ry = lerp(1.2 * sg(`mq${q.i}`), 0, outCubic(u));
        let sc = lerp(0.35, 1, outCubic(u));
        if (t >= S.brk) {
          // the burst: out from the middle, at the camera, spinning, and gone within 0.85 s (the bubble pops in at 0.855 s)
          const a = t - S.brk;
          const k = (1 - Math.exp(-3.2 * a)) / 3.2;
          const dx = hx || 1, dy = hy || 1;
          x = hx + (dx * 1.1 + sg(`bx${q.i}`) * 260) * k * 2.2;
          y = hy + (dy * 1.1 + sg(`by${q.i}`) * 260) * k * 2.2;
          z = 900 * k * (0.5 + rnd(`bz${q.i}`));
          rz = sg(`br${q.i}`) * 6 * a;
          ry = sg(`bq${q.i}`) * 5 * a;
          sc = 1 - smooth(a / 0.85);
          q.g.visible = sc > 0.01;
        }
        q.g.position.set(x, y, z);
        q.g.rotation.set(0, ry, rz);
        q.g.scale.setScalar(Math.max(0.001, sc));
        (q.edge.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.6 * pulse(t, S.done, 6) * (t >= S.done ? 1 : 0);
      }
      // the light sweep over the finished mosaic
      const sa = (t - S.done) / 0.38;
      sweepM.mesh.visible = sa >= 0 && sa < 1;
      if (sweepM.mesh.visible) {
        sweepM.mesh.position.set(lerp(-560, 560, sa), lerp(380, -380, sa), 30);
        sweepM.mesh.rotation.z = -0.9;
        sweepM.mat.opacity = 0.85 * Math.sin(Math.PI * sa);
      }
    }
    {
      const ra = t - S.done;
      const rb = t - S.brk;
      const r = ra >= 0 && ra < 0.45 ? ra : rb >= 0 && rb < 0.45 ? rb : -1;
      ringM.visible = r >= 0;
      if (r >= 0) {
        place(ringM, base, 540, MOSAIC_S[1], 300 + 2600 * outCubic(r / 0.45), 1, D + 0.3);
        (ringM.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - r / 0.45);
      }
      LS.update(t, S.done, screenPoint(base, 540, MOSAIC_S[1], D - 0.4), 1.8, 0.7);
      LS2.update(t, S.brk, screenPoint(base, 540, MOSAIC_S[1], D - 0.4), 2.2, 0.7);
      BU.update(t);
    }

    // ── the bubble (pops in at the kick 13.130 with typing dots, bursts at the lockup) ──
    {
      const a = t - S.bub;
      bub.visible = a >= 0 && t < S.lockup;
      if (bub.visible) {
        const e = outBack(clamp(a / (11 / 60)), 1.6);
        const burst = t > S.lockup - 4 / 60 ? 1 - clamp((t - (S.lockup - 4 / 60)) / (4 / 60)) : 1;
        const bs = e * burst * (1 + 0.01 * Math.sin(t * 3) + 0.05 * pulse(t, S.jak, 9) * (t >= S.jak ? 1 : 0) + 0.03 * pulse(t, S.jak2, 8) * (t >= S.jak2 ? 1 : 0));
        place(bub, base, BUBBLE.x, BUBBLE.y, 1000 * Math.max(0.001, bs), 1000, D + 0.35, [0.1 + 0.03 * Math.sin(t * 1.3), -0.12 * Math.sin(t * 0.9), -0.015 + 0.01 * Math.sin(t * 1.1)]);
        dots.forEach((d, i) => {
          d.visible = t < S.jak;
          d.scale.setScalar(0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 14 - i * 1.3)));
        });
        rimMat.color.set(LIME).multiplyScalar(0.75 + 0.5 * pulse(t, S.jak2, 6) * (t >= S.jak2 ? 1 : 0) + 0.4 * pulse(t, S.jak, 6) * (t >= S.jak ? 1 : 0));
      }
      // the riddle photos orbit behind it
      orbit.forEach((o, i) => {
        const oa = t - (S.bub + i * 3 / 60);
        o.g.visible = oa >= 0;
        if (!o.g.visible) return;
        const ph = t * 0.45 + (i * Math.PI) / 2;
        const grow = outCubic(clamp(oa / (14 / 60)));
        const x = BUBBLE.x + 430 * Math.cos(ph) * grow, y = BUBBLE.y + 400 * Math.sin(ph) * grow;
        place(o.g, base, x, y, 300 * grow + 1, TW, D + 1.6 + 0.9 * Math.sin(ph), [0.1 * Math.sin(ph), 0.35 * Math.cos(ph), 0.06 * Math.sin(ph * 2)]);
        o.faceMat.color.setScalar((t < S.lockup ? 0.5 : 0.34) * grow + 0.0001);
        o.frameMat.opacity = 0.35;
        o.scan.mesh.visible = false;
      });
    }

    // ── the words ──
    const wP = (w: { w: number }, target: number) => target / w.w;
    void wP;
    const inB = t >= S.jak && t < S.lockup;
    const jakK = 1 + 0.25 * pulse(t, S.jak2, 9) * (t >= S.jak2 ? 1 : 0);
    showW(wJ, base, t, S.jak, S.lockup, 540, CTA.jak.y, CTA.jak.w, { from: 1.3, punch: [S.k19], seed: 0.5, d: D - 0.3, k: jakK });
    // the two lines whip at the camera before they leave (5 f), POŠLU TI / ODKAZ take their places
    const outK = (t0: number) => 1 + 0.7 * inCubic(clamp((t - (S.swap - 5 / 60)) / (5 / 60))) * (t < S.swap ? 1 : 0) + 0 * t0;
    showW(wN, base, t, S.napis, S.swap, 540, CTA.napis.y, CTA.napis.w, { from: 1.3, punch: [S.k19], seed: 1.2, d: D - 0.3, k: outK(0) });
    showW(wK, base, t, S.do, S.swap, 540, CTA.koment.y, CTA.koment.w, { from: 1.2, punch: [S.k19], seed: 2.1, d: D - 0.3, k: outK(1) });
    showW(wO, base, t, S.odkaz, S.lockup, 540, CTA.odkaz.y, CTA.odkaz.w, { from: 1.3, punch: [], seed: 3.3, d: D - 0.3 });
    {
      const a = t - S.poslu;
      poslu.group.visible = a >= 0 && t < S.lockup;
      if (poslu.group.visible) {
        place(poslu.group, base, 540, CTA.poslu.y, CTA.poslu.w * (1 + 0.012 * a), poslu.w, D - 0.3, [0.12, -0.1 * Math.sin(t * 0.9), 0]);
        poslu.items.forEach((it, k) => {
          const t0 = k < 5 ? S.poslu : S.ti; // POŠLU (5 letters), then TI
          const u = clamp((t - t0 - (k < 5 ? k * 1.6 : (k - 5) * 1.6) / 60) / (6 / 60));
          it.mesh.visible = u > 0;
          it.mesh.scale.setScalar(lerp(1.5, 1, outBack(u, 1.3)));
          it.mesh.position.copy(it.home).add(V(0, 0.3 * (1 - outCubic(u)), 0));
        });
      }
      const rj = t - S.jak2;
      ringJ.visible = rj >= 0 && rj < 0.4 && inB;
      if (ringJ.visible) {
        place(ringJ, base, 540, CTA.jak.y, 300 + 1500 * outCubic(rj / 0.4), 1, D - 0.1);
        (ringJ.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - rj / 0.4);
      }
      // a soft plate under the bubble words / the logo (the orbiting photos are behind)
      plate.visible = t >= S.bub;
      (plate.material as THREE.MeshBasicMaterial).opacity = 0.55 * clamp((t - S.bub) / 0.2);
      place(plate, base, 540, 860, 1500, 1, D + 0.8);
    }

    // ── the logo (17.235): the mark from 160 %, the wordmark slides in, flash, ring, rays; the JAK tag; the slow push of the end card ──
    {
      const a = t - S.lockup;
      const vis = a >= 0;
      markG.visible = vis;
      wordM.visible = vis;
      tag.visible = vis;
      logoRays.group.visible = vis;
      halo.visible = vis;
      const Z = 1 + 0.012 * Math.max(0, t - S.calm);
      const at = (x: number, y: number, w: number): [number, number, number] => [540 + (x - 540) * Z, 860 + (y - 860) * Z, w * Z];
      if (vis) {
        const pop = lerp(1.6, 1, outBack(clamp(a / (7 / 60)), 1.4));
        const [x, y, w] = at(CTA.mark.x, CTA.logoY, CTA.mark.w * pop * (1 + 0.02 * Math.sin(t * 2.1)));
        place(markG, base, x, y, w, 2, D, [0.1 * Math.sin(t * 1.3), 0.25 * Math.sin(t * 0.9) + 0.6 * (1 - outCubic(clamp(a / 0.3))), 0]);
        mark.face.emissiveIntensity = 0.75 + 1.4 * pulse(t, S.lockup, 5) + 0.5 * pulse(t, S.sweep, 5) * (t >= S.sweep ? 1 : 0);
        const inn = outCubic(clamp(a / (6 / 60)));
        const slam = lerp(1.3, 1, outBack(clamp(a / (8 / 60)), 1.3));
        const [wx, wy, ww] = at(lerp(900, CTA.word.x, inn), CTA.logoY, CTA.word.w * slam);
        place(wordM, base, wx, wy, ww / wm.frac, 1, D, [0.08 * Math.sin(t * 1.3), 0.12 * Math.sin(t * 0.9), 0]);
        wordMat.opacity = inn;
        wordMat.emissiveIntensity = 0.9 + 0.9 * pulse(t, S.lockup + 0.1, 6);
        const [tx, ty, tw0] = at(540, CTA.tagY, 210 * lerp(1.5, 1, outBack(clamp((a - 4 / 60) / (8 / 60)), 1.3)));
        place(tag, base, tx, ty, tw0, 2, D, [0.06 * Math.sin(t * 1.2), 0.1 * Math.sin(t * 0.8), 0]);
        logoRays.group.position.copy(screenPoint(base, ...(at(540, CTA.logoY, 0).slice(0, 2) as [number, number]), D + 1.2));
        logoRays.group.quaternion.copy(base.quaternion);
        logoRays.group.rotateZ(0.25 * a);
        logoRays.mats.forEach((m, i) => (m.opacity = (0.05 + 0.3 * Math.exp(-a * 4)) * (0.7 + 0.3 * Math.sin(i + t))));
        place(halo, base, 540, 860, 1500, 1, D + 3);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.8 + 0.4 * pulse(t, S.lockup, 3) + 0.1 * Math.sin(t * 2.2);
      }
      logoRing.visible = a >= 0 && a < 0.4;
      if (logoRing.visible) {
        place(logoRing, base, 540, 860, 300 + 1700 * outCubic(a / 0.4), 1, D + 0.2);
        (logoRing.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - a / 0.4);
      }
      const sa = (t - S.sweep) / 0.32;
      sweepL.mesh.visible = sa >= 0 && sa < 1;
      if (sweepL.mesh.visible) {
        place(sweepL.mesh, base, lerp(180, 900, sa), 860, 620, 1, D - 0.4, [0, 0, 0.5]);
        sweepL.mat.opacity = 0.8 * Math.sin(Math.PI * sa);
      }
    }
    void te;

    const f60 = t * 60;
    const fl = (t0: number, a: number, b: number, c = 0) => {
      const k = Math.floor(f60 - t0 * 60 + 1e-6);
      return k === 0 ? a : k === 1 ? b : k === 2 ? c : 0;
    };
    return {
      focus: D,
      ap: 7,
      flash: Math.max(fl(S.fin, 0.7, 0.4, 0.15), fl(S.done, 0.35, 0.15), fl(S.brk, 0.45, 0.2), fl(S.bub, 0.3, 0.1), fl(S.jak, 0.3, 0.1), fl(S.jak2, 0.2, 0.08), fl(S.lockup, 0.9, 0.45, 0.15), env(t, IMPS, 30) * 0.05),
      ca: 0.3 + env(t, IMPS, 14) * 1.2 + (t >= S.fin && t < S.fin + 3 / 60 ? 2.4 : 0) + (t >= S.lockup && t < S.lockup + 3 / 60 ? 2.6 : 0) + (t >= S.jak && t < S.jak + 2 / 60 ? 2.0 : 0),
      glitch: 0,
      vig: 0.1 * tw(t, fr0(T.fade0), fr0(FRAMES)),
    };
  };
  return { scene, camera, update };
}
const fr0 = (f: number) => f / 60;
void BEAT;
void F;
