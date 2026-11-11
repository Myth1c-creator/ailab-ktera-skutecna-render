"""Text rules for the words that live inside the 3D picture of "Která z nich je skutečná?" (cdp.mjs check only sees the DOM: the
captions). Every 3D word is screen-anchored (src/worlds/common.ts place): its centre and width in px are set in the code, so the
margins are exact; this mirrors those numbers (riddle.ts WORDS, finale.ts CTA) and checks, for each word,
  EDGE  >= 170 px from the side edges at rest (with the punches and the sway at their worst) and at the peak of its slam (the user's
        rule: never at the edge, never across the whole width);
  SIZE  no word wider than 640 px at rest, the numbers / tags <= 260 px;
  DUP   no caption (capwords.json) while the same word is big on screen.
The two lines NAPIŠ / DO KOMENTÁŘE whip at the camera for 5 f before they leave (15.910-15.993): motion, not rest
(sim_layout.mjs exempts the same window and measures the projected boxes of every frame).
python check_text3d.py  ->  CHECK PASS / FAIL (and logs/text3d_check.json)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
cut = json.loads((HERE / "audio/cut.json").read_text(encoding="utf-8"))
BPM, FPS, FRAMES = cut["bpm"], 60, 1134
END = FRAMES / FPS
FONT = json.loads((HERE / "public/fonts/unbounded_800_clean.typeface.json").read_text(encoding="utf-8"))
G = FONT["glyphs"]
adv = lambda s: sum(G[c]["ha"] for c in s) / FONT["resolution"]  # noqa: E731
f = lambda fr: fr / FPS  # noqa: E731
W = json.loads((HERE / "audio/vo-words.json").read_text(encoding="utf-8"))
ws = lambda i: W[i]["start"]  # noqa: E731
fr_ = lambda s: round(s * FPS)  # noqa: E731

A1, SWAP, LOCK = f(fr_(cut["kicks"][3])), f(fr_(ws(33))), f(fr_(cut["kicks"][21]))
RUSH = f(554)
# hook (riddle.ts WORDS.hook): one scale, SKUTEČNÁ? 540 px wide; slam from 1.3 x
HK = lambda w: 540 * adv(w) / adv("SKUTEČNÁ?")  # noqa: E731
# drop (WORDS.drop): one scale, REÁLNÁ 500 px; ŽÁDNÁ / NENÍ slam from 1.3 x, REÁLNÁ 1.35 x
DR = lambda w: 500 * adv(w) / adv("REÁLNÁ")  # noqa: E731
PUNCH = 1.05 * 1.05  # a punch (5 %) + the sway / tilt
LOGO_PUSH = 1 + 0.012 * (END - f(1090))

# (text, shown from, to (s), centre x, sway (px), width at rest at its worst (px), width at the slam peak (px), rest cap)
WORDS = [
    ("KTERÁ", f(fr_(ws(0))), A1, 540, 0, HK("KTERÁ") * PUNCH, HK("KTERÁ") * 1.3, 560),
    ("JE", f(fr_(ws(3))), A1, 540, 0, HK("JE") * PUNCH, HK("JE") * 1.3, 560),
    ("SKUTEČNÁ?", f(fr_(cut["kicks"][1]) + 2), A1, 540, 0, 540 * 1.03, 540 * 1.3, 640),
    ("ŽÁDNÁ", f(fr_(ws(16))), RUSH, 540, 0, DR("ŽÁDNÁ") * PUNCH, DR("ŽÁDNÁ") * 1.3, 640),
    ("NENÍ", f(fr_(ws(17))), RUSH, 540, 0, DR("NENÍ") * PUNCH, DR("NENÍ") * 1.3, 640),
    ("REÁLNÁ", f(fr_(ws(18))), RUSH, 540, 0, 500 * PUNCH, 500 * 1.35, 640),
    ("JAK", f(fr_(ws(28))), LOCK, 540, 0, 440 * 1.25 * 1.05, 440 * 1.3 * 1.05, 600),      # the second JAK slam is a 1.25 x pulse
    ("NAPIŠ", f(fr_(ws(29))), SWAP, 540, 0, 340 * PUNCH, 340 * 1.3, 560),
    ("DO KOMENTÁŘE", f(fr_(ws(30))), SWAP, 540, 0, 540 * PUNCH, 540 * 1.2, 640),
    ("POŠLU TI", f(fr_(ws(34))), LOCK, 540, 0, 430 * 1.04, 430 * 1.04, 560),
    ("ODKAZ", f(fr_(ws(36))), LOCK, 540, 0, 420 * 1.04, 420 * 1.3, 560),
    # the logo lockup: mark 170 px at x 352 (pop 160 %) + the wordmark 330 px at x 632 (slam 130 %), pushed in around x 540
    ("AI LAB (logo)", LOCK, END, 540, 0, (2 * (540 - (352 - 0.5 * 170)) + 20) * LOGO_PUSH, 2 * (540 - (352 - 0.5 * 170 * 1.6)), 640),
    ("JAK (tag)", LOCK, END, 540, 0, 210 * LOGO_PUSH, 210 * 1.5, 260),
]
norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()  # noqa: E731

caps = [(w, a * 60 / BPM, b * 60 / BPM) for w, a, b in json.loads((HERE / "capwords.json").read_text(encoding="utf-8"))]
edge, size, dup, margins = [], [], [], {}
for text, t0, t1, cx, sway, w_rest, w_slam, cap in WORDS:
    for kind, w in (("rest", w_rest), ("slam", w_slam)):
        m = min(cx - sway - w / 2, 1080 - (cx + sway + w / 2))
        margins[f"{text} {kind}"] = round(m)
        if m < 170 - 1e-6:
            edge.append({"text": text, "kind": kind, "margin": round(m), "width": round(w)})
    if w_rest > cap:
        size.append({"text": text, "width": round(w_rest), "cap": cap})
    toks = set(norm(text).replace(".", "").replace("?", "").replace("(", "").replace(")", "").split())
    for cw, a, b in caps:
        if a < t1 and b > t0 and (norm(cw) in toks or (len(cw) >= 4 and norm(cw) in norm(text))):
            dup.append({"caption": cw, "t": [round(a, 3), round(b, 3)], "word": text})
res = {"edge": edge, "size": size, "dup": dup, "margins": margins}
(HERE / "logs").mkdir(exist_ok=True)
(HERE / "logs" / "text3d_check.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
for e in edge:
    print(f"EDGE  {e['text']} ({e['kind']}): {e['margin']} px, {e['width']} px wide (min 170)")
for s in size:
    print(f"SIZE  {s['text']}: {s['width']} px (cap {s['cap']})")
for d in dup:
    print(f"DUP   caption '{d['caption']}' {d['t']} under '{d['word']}'")
print("min margin", min(margins.values()), "px;", "CHECK PASS" if not edge and not dup and not size else "CHECK FAIL")
