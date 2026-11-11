"""Real-ESRGAN realesr-general-x4v3 (SRVGGNetCompact, BSD-3) on CPU, tiled: x4 of the four photos of the riddle (n1, n2, n3, z4).
The net is the one of ads/ailab-najdi-chybu/tools/esrgan_up.py (the modelka5-8 x4 files came from it), weights in models/.
python tools/esrgan_photos.py --inp in --out up    (in/<key>.jpg 736 px wide -> up/<key>.jpg, x4, JPEG q95)
"""
import argparse
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_feat=64, num_conv=32, upscale=4):
        super().__init__()
        self.upscale = upscale
        body = [nn.Conv2d(3, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        for _ in range(num_conv):
            body += [nn.Conv2d(num_feat, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        body.append(nn.Conv2d(num_feat, 3 * upscale * upscale, 3, 1, 1))
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(upscale)

    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=self.upscale, mode="nearest")


def load(denoise=0.5):
    a = torch.load(ROOT / "models" / "realesr-general-x4v3.pth", map_location="cpu", weights_only=True)["params"]
    b = torch.load(ROOT / "models" / "realesr-general-wdn-x4v3.pth", map_location="cpu", weights_only=True)["params"]
    net = SRVGGNetCompact()
    net.load_state_dict({k: denoise * a[k] + (1 - denoise) * b[k] for k in a})
    return net.eval()


@torch.inference_mode()
def up4(net, rgb, tile=256, pad=12):
    H, W = rgb.shape[:2]
    out = np.zeros((H * 4, W * 4, 3), np.uint8)
    for y in range(0, H, tile):
        for x in range(0, W, tile):
            y0, x0 = max(y - pad, 0), max(x - pad, 0)
            y1, x1 = min(y + tile + pad, H), min(x + tile + pad, W)
            t = torch.from_numpy(rgb[y0:y1, x0:x1].astype(np.float32) / 255).permute(2, 0, 1)[None]
            o = net(t)[0].clamp(0, 1).permute(1, 2, 0).numpy()
            o = (o * 255 + 0.5).astype(np.uint8)
            oy, ox = (y - y0) * 4, (x - x0) * 4
            h, w = min(tile, H - y) * 4, min(tile, W - x) * 4
            out[y * 4: y * 4 + h, x * 4: x * 4 + w] = o[oy: oy + h, ox: ox + w]
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--inp", default="in")
    ap.add_argument("--out", default="up")
    a = ap.parse_args()
    torch.set_num_threads(4)
    net = load()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    for p in sorted(Path(a.inp).glob("*.jpg")):
        im = Image.fromarray(up4(net, np.asarray(Image.open(p).convert("RGB"))))
        im.save(out / p.name, quality=95)
        print("up", p.name, im.size, flush=True)
