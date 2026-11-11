// Every time of the film "Která z nich je skutečná?" (PROMPT.md + script.md v1, the drop changed 2026-11-11). The film = the
// song cut from audio/cut.json (Calin - Pražský holky, 84.70 BPM, doba 0.7084 s, DROP 7.65 = "Žádná", 18.895 s) with Jana's ONE
// continuous take (audio/vo.wav, never moved or cut; word times audio/vo-words.json, indexed: the 37 words of the take).
// Two kinds of anchors, whole frames at 60 fps:
//   - big words, numbers and labels come with Jana's words (WS(i): the frame nearest the start of word i),
//   - hard changes (cuts, whips, flashes, punches, shakes) sit on the song: kicks K(i) / beats Bt(i) (±1 f).
// mix.py, kinetic/spec.js, check_text3d.py and sim_layout.mjs mirror these frames.
import words from "../../audio/vo-words.json";
import cut from "../../audio/cut.json";

export const FPS = 60;
export const FRAMES = 1134; // 18.900 s (the cut is 18.895 s)
export const BPM = cut.bpm; // 84.70
export const BEAT = 60 / BPM;
export const fr = (f: number) => f / FPS;

type Word = { word: string; start: number; end: number };
const WD = words as Word[];
if (WD.length !== 37) throw new Error("vo-words.json: expected the 37 words of the take");
export const WS = (i: number) => Math.round(WD[i].start * FPS); // frame of word i's start
export const WE = (i: number) => Math.round(WD[i].end * FPS);
export const K = (i: number) => Math.round(cut.kicks[i] * FPS); // frame of kick i
export const Bt = (i: number) => Math.round(cut.beats[i] * FPS); // frame of beat i
export const DROP = Math.round(cut.drop * FPS); // 459 (7.650)

// world boundaries (first frame of each): the riddle (hook, line-up, build, blackout, DROP) | the finale (mosaic, bubble, logo)
export const F = { fin: Bt(13) }; // 564 (9.400, the beat after "reálná")

// frames (the comment gives the second and its anchor)
export const T = {
  // ── hook (0-125): the 2x2 grid of the four photos, 01-04, already moving on frame 0 ──
  cutA: K(0), //         13  0.215  kick: hard cut to a tighter angle (glitch 3 f)
  kter: WS(0), //        15  0.250  "Která": KTERÁ slams
  je: WS(3), //          55  0.911  "je": JE
  cutB: K(1), //         56  0.935  kick: hard cut, glitch
  skut: K(1) + 2, //     58  SKUTEČNÁ? slams lime (the word 0.993 = 60)
  qGrow: WE(4) - 4, //  106  1.840 "skutečná?" ends 1.84: the lime dot of the ? floods the frame
  // ── line-up: 01 - 04 ──
  a1: K(3), //          126  2.105  kick: 01 lands (the flood clears)
  mac1: WS(5), //       141  2.351  "Zrzka": macro push-in onto the face
  p1: K(4), //          169  2.820  kick: punch
  a2: K(5), //          197  3.290  kick: whip to 02 ("Ta" 3.175)
  mac2: WS(8), //       206  3.431  "drdolem": macro on the face
  a3: Bt(6), //         266  4.441  beat: whip to 03 ("Ta se" 4.302)
  hand: K(7), //        283  4.720  kick: macro on the hand with the heart ("srdíčkem" 4.615)
  face3: Bt(7), //      309  5.149  beat: back up to the face
  a4: K(9), //          353  5.885  kick: whip to 04 ("Nebo" 5.776)
  glint: WS(15), //     379  6.322  "zrcadla": the glint across the card
  crane: Bt(9), //      394  6.566  beat: crane up, the four cards snap back into the grid
  strobe1: 415, //           6.917  scan lines strobe on the eighths
  grid: Bt(10), //      436  7.275  beat: the grid is whole; the lights go out (music -12 dB from 7.20)
  heart1: 447, //            7.450  the cards' frames pulse (a heartbeat)
  heart2: 453, //            7.550  and again
  // ── THE DROP: "Žádná není reálná" ──
  zhad: WS(16), //      457  7.610  ŽÁDNÁ slams (flash on the hit)
  drop: DROP, //        459  7.650  the hit: flash 2 f, the AI LAB stamps hit all four cards
  nenit: WS(17), //     484  8.075  NENÍ
  real: WS(18), //      501  8.353  REÁLNÁ
  k11: K(11), //        510  8.495  kick: punch, ring
  k12: K(12), //        538  8.965  kick: punch
  rush: 548, //              9.133  the camera rushes through the grid (speed ramp) into the white
  // ── the finale (world 2) ──
  fin: F.fin, //        564  9.400  beat: the mosaic's first cells fly in out of the depth
  vsech: WS(19), //     572  9.526  "Všechny"
  waveB: Bt(14), //     606 10.108  beat: the second wave (LAB)
  ailab: WS(22), //     629 10.490  "AI LAB"
  done: K(13), //       634 10.560  kick: the last cell lands, the mosaic spells AI LAB (shatter ring, light sweep)
  zjed: WS(23), //      689 11.477  "Z jednoho promptu" (the captions)
  k14: K(14), //        690 11.505  kick: pull-back punch
  brk: K(15), //        736 12.275  kick: the mosaic bursts
  bub: K(16), //        788 13.130  kick: the speech bubble pops in ("Chceš" 13.044)
  jak: WS(28), //       825 13.752  "jak?": JAK slams in the bubble (kick 13.685 = 821)
  napis: WS(29), //     862 14.367  "Napiš": NAPIŠ
  do: WS(30), //        885 14.751  "do": DO KOMENTÁŘE
  k19: K(19), //        906 15.095  kick: small punch
  jak2: WS(32), //      933 15.552  "JAK": JAK slams again (ring, pulse)
  swap: WS(33), //      960 15.993  "a": the two lines leave
  poslu: WS(34), //     969 16.144  "pošlu": POŠLU
  ti: WS(35), //        989 16.480  "ti": TI
  odkaz: WS(36), //     998 16.631  "odkaz": ODKAZ
  lockup: K(21), //    1034 17.235  kick: the bubble bursts, the AI LAB logo slams (the last word ends 17.258)
  sweep: Bt(25), //    1074 17.901  beat: a light sweep over the logo (the last new thing)
  calm: 1090, //            18.170  nothing new from here: the clean end card
  fade0: 1110, //           18.500  the music's tail fades
  end: FRAMES,
};

// the same moments in seconds (what the worlds' update(t) works in)
export const S = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v / FPS])) as Record<keyof typeof T, number>;
