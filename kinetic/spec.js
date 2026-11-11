// spec.js: AI LAB "Která z nich je skutečná?" as a kinetic film, native 9:16, 60 fps, 84.70 BPM, 1134 frames (18.900 s).
// The picture is one 3D film (src/Film.tsx: the riddle 0-563 = the 2x2 grid of the four photos, the line-up 01-04, the blackout, THE DROP
// "Žádná není reálná"; the finale 564-1133 = the AI LAB mosaic of photos, the speech bubble with JAK, the logo; rendered as
// public/hook/hook_###.jpg by the workflow's "hook" job) played full frame by Seq3D; every big word (KTERÁ · JE · SKUTEČNÁ?,
// ŽÁDNÁ · NENÍ · REÁLNÁ, NAPIŠ · JAK · DO KOMENTÁŘE, POŠLU TI ODKAZ), the numbers 01-04, the photos, the bubble and the logo are inside
// the 3D. On top: the one-word captions in a white box (ad-captions: ../capwords.json in beats at 84.70 BPM; none under a word that is
// big on screen). The engine adds bloom and grain (post.py, BLOOM_LOCAL=1). Cuts mirror src/worlds/timing.ts and mix.py; the mix
// itself is kinetic/audio/master.wav (mix.py), the cues here only feed info.json and the checks.
import { Seq3D } from './blocks.js';

const FPS = 60, FRAMES = 1134, BPM = 84.7;
const capWords = await fetch('../capwords.json').then(r => r.json());
// the hard changes (timing.ts T, frames): the hook's two cuts, the 01-04 landings and whips, the crane, the lights out, THE DROP, the
// mosaic's first and second wave and its last cell, the burst, the bubble, JAK, the second JAK, the logo
const cuts = [13, 56, 126, 197, 266, 353, 394, 436, 459, 564, 606, 634, 736, 788, 825, 933, 1034].map(f => f / FPS);

export default {
  title: 'AI LAB – Která z nich je skutečná?',
  bpm: BPM, beats: FRAMES * BPM / 3600, fps: FPS,
  palette: { bg: '#0B0D10', paper: '#ECEEF0', accent: '#C6FF00', hot: '#FF2A2A', ink: '#0B0D10' },
  hud: false,
  cues: [],
  scenes: [
    [Seq3D, 0, FRAMES * BPM / 3600, { seq: '../public/hook/hook_', n: FRAMES, cuts }],
  ],
  captions: [],
  // one word at a time in a white box: [[word, beat0, beat1]] (ad-captions, ../capwords.json)
  capWords,
};
