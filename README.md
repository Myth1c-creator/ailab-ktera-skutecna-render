# ailab-ktera-skutecna (render only)

AI LAB "Která z nich je skutečná?": 1080x1920, 60 fps, 18.895 s (1134 frames). Rendered only in GitHub Actions. Code in plain text; the photos,
the mix, the voice's word times, the song's grid and the captions are only in `assets.tar.gpg` (AES-256, key = the `ASSETS_KEY` secret).

    gh workflow run upscale.yml                # Real-ESRGAN x4 of the four riddle photos (foto_src.tar.gpg -> release asset foto_x4.tar.gpg)
    gh workflow run kinetic.yml -f res=540     # preview (half size, same checks)
    gh workflow run kinetic.yml -f res=1080    # final Full HD
