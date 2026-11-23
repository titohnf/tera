"""Mewarnai ulang ikon 3D menu ke palet biru + kuning (docs/desain-siswa.md).

Bentuk, bayangan, dan kilap tetap dari gambar asli; hanya warnanya (hue) yang dipetakan:
warna hangat (merah, jingga, kuning, merah muda) -> kuning, warna dingin (hijau, biru, ungu) -> biru.
Abu-abu dan putih dibiarkan. Jalankan dari akar proyek: python3 scripts/warnai-ikon.py
"""
import colorsys
from PIL import Image

KUNING = 46 / 360
BIRU = 214 / 360
SUMBER = {"memo": "memo", "bullseye": "bullseye", "books": "books", "trophy": "trophy"}

def warnai(src, dst):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.14:  # abu-abu / putih: biarkan
                continue
            hangat = h < 70 / 360 or h > 300 / 360
            target = KUNING if hangat else BIRU
            # Sedikit variasi hue asli dipertahankan supaya kilapnya tidak mendatar.
            pusat = 30 / 360 if hangat else 180 / 360
            selisih = ((h - pusat + 0.5) % 1) - 0.5 if hangat else h - pusat
            h2 = (target + selisih * 0.12) % 1
            # Biru dibuat sedikit lebih jenuh agar sepadan dengan kuning.
            s2 = min(1, s * (1.0 if hangat else 1.15))
            r2, g2, b2 = colorsys.hsv_to_rgb(h2, s2, v)
            px[x, y] = (round(r2 * 255), round(g2 * 255), round(b2 * 255), a)
    im.save(dst, optimize=True)

for nama, berkas in SUMBER.items():
    warnai(f"public/ikon/{berkas}.png", f"public/ikon/{nama}-bk.png")
    print("ok", nama)
