"""Mewarnai ulang ikon 3D menu ke SATU palet biru + kuning (docs/desain-siswa.md).

Bentuk, bayangan, dan kilap tetap dari gambar asli. Tiap piksel berwarna dipetakan ke tangga warna yang
TETAP (satu biru, satu kuning) menurut kecerahannya, sehingga semua ikon memakai biru dan kuning yang
persis sama, jenuh, dan tidak pucat. Kilap (jenuh rendah) tetap memutih; abu-abu/putih dibersihkan
menjadi putih kebiruan. Jalankan dari akar proyek: python3 scripts/warnai-ikon.py
"""
import colorsys
from PIL import Image

def hex_ke_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

# (posisi 0..1 menurut kecerahan, warna). Biru tengah = biru logo Tera (#0060F0).
BIRU = [(0.0, "#07276F"), (0.45, "#0050D8"), (0.7, "#1F7AFF"), (1.0, "#7DB4FF")]
KUNING = [(0.0, "#A85A00"), (0.45, "#F2A100"), (0.7, "#FFC926"), (1.0, "#FFE680")]

def tangga(stops, t):
    t = max(0.0, min(1.0, t))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if t <= b:
            f = (t - a) / (b - a) if b > a else 0
            ra, rb = hex_ke_rgb(ca), hex_ke_rgb(cb)
            return tuple(ra[i] + (rb[i] - ra[i]) * f for i in range(3))
    return hex_ke_rgb(stops[-1][1])

def warnai(src, dst):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.12:
                # Putih/abu-abu: dijernihkan jadi putih kebiruan, bayangan tipis ikut dingin.
                if v > 0.8:
                    v2 = min(1.0, v * 1.04 + 0.03)
                    px[x, y] = (round(v2 * 255 * 0.97), round(v2 * 255 * 0.985), round(v2 * 255), a)
                else:
                    # Abu-abu gelap (garis teks, ujung pensil): dibiru-kan supaya ikut palet.
                    bi = tangga(BIRU, (v - 0.2) / 0.8)
                    px[x, y] = tuple(round(r * 0 + (v * 255) * 0.3 + bi[i] * 0.7) for i, r in enumerate((r, g, b))) + (a,)
                continue
            hangat = h < 75 / 360 or h > 295 / 360
            # Kecerahan asli (0.35..1.0) dibentangkan ke seluruh tangga.
            t = (v - 0.35) / 0.65
            warna = tangga(KUNING if hangat else BIRU, t)
            # Kilap (jenuh rendah) tetap memutih; badan (jenuh tinggi) memakai warna tangga penuh.
            sn = min(1.0, s / 0.5) ** 0.8
            putih = (255, 255, 255)
            mix = tuple(putih[i] + (warna[i] - putih[i]) * sn for i in range(3))
            px[x, y] = (round(mix[0]), round(mix[1]), round(mix[2]), a)
    im.save(dst, optimize=True)

for nama in ["memo", "bullseye", "books", "trophy"]:
    warnai(f"public/ikon/{nama}.png", f"public/ikon/{nama}-bk.png")
    print("ok", nama)
