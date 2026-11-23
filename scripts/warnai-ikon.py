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

# (posisi 0..1 menurut kecerahan, warna). Biru tengah = biru logo Tera (#0060F0). Tangga SEMPIT di sisi
# putih (tanpa pucat) dan LEBAR di sisi gelap, supaya kesannya jenuh, tebal, dan kontras seperti ikon "play".
BIRU = [(0.0, "#0A2A8C"), (0.3, "#0A4FD6"), (0.6, "#0A5CF0"), (0.85, "#3A8BFF"), (1.0, "#8EC0FF")]
KUNING = [(0.0, "#D26A00"), (0.3, "#F59A00"), (0.6, "#FFB400"), (0.85, "#FFD233"), (1.0, "#FFEB85")]

def tangga(stops, t):
    t = max(0.0, min(1.0, t))
    for (a, ca), (b, cb) in zip(stops, stops[1:]):
        if t <= b:
            f = (t - a) / (b - a) if b > a else 0
            ra, rb = hex_ke_rgb(ca), hex_ke_rgb(cb)
            return tuple(ra[i] + (rb[i] - ra[i]) * f for i in range(3))
    return hex_ke_rgb(stops[-1][1])

def rentang(im):
    """Persentil 8 dan 98 kecerahan piksel berwarna: ikon aslinya pastel (hampir semuanya terang),
    jadi tanpa dibentangkan semua piksel jatuh di ujung terang tangga dan hasilnya pucat."""
    px = im.load()
    semua = []
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a < 200:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s >= 0.12:
                semua.append(v)
    semua.sort()
    if not semua:
        return 0.3, 1.0
    return semua[int(len(semua) * 0.08)], semua[int(len(semua) * 0.98) - 1]


# Titik tertinggi pada tangga yang dipakai badan ikon (1.0 = ujung putih kebiruan/kekuningan).
PUNCAK = 0.8


def bentang(v, lo, hi):
    u = max(0.0, min(1.0, (v - lo) / max(hi - lo, 1e-6)))
    u = u * u * (3 - 2 * u) * 0.65 + u * 0.35  # lengkung S: gelap lebih gelap, terang lebih terang
    return u * PUNCAK


def warnai(src, dst, tukar=False):
    im = Image.open(src).convert("RGBA")
    px = im.load()
    lo, hi = rentang(im)
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
            if tukar:
                hangat = not hangat
            # Kecerahan asli (0.35..1.0) dibentangkan ke seluruh tangga.
            warna = tangga(KUNING if hangat else BIRU, bentang(v, lo, hi))
            # Kilap (jenuh rendah) tetap memutih; badan (jenuh tinggi) memakai warna tangga penuh.
            sn = min(1.0, s / 0.3) ** 0.7
            putih = (255, 255, 255)
            mix = tuple(putih[i] + (warna[i] - putih[i]) * sn for i in range(3))
            px[x, y] = (round(mix[0]), round(mix[1]), round(mix[2]), a)
    im.save(dst, optimize=True)

def merah_ke_biru(src, dst):
    """Hanya warna merah/merah muda yang diganti biru (tangga BIRU); warna lain tetap ASLI."""
    im = Image.open(src).convert("RGBA")
    px = im.load()
    lo, hi = rentang(im)
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            rosa = h < 25 / 360 or h > 296 / 360
            ungu_pucat = h > 240 / 360 and s < 0.24
            if not (rosa or ungu_pucat):
                continue
            if s < 0.24:
                # Semburat merah muda tipis di bodi putih -> biru muda tipis (bayangan bodi tetap terbaca).
                # Transisi halus (bukan ambang tajam) supaya tidak berbercak: dasar tipis + naik mengikuti kejenuhan.
                u = max(0.0, min(1.0, (s - 0.02) / 0.18))
                w = 0.05 + 0.3 * (u * u * (3 - 2 * u))  # biru TIPIS: kebanyakan terlihat norak
                muda = tangga(BIRU, 0.9)
                dasar = tuple(255 + (muda[i] - 255) * w for i in range(3))
                px[x, y] = tuple(round(c * min(1.0, v + 0.05)) for c in dasar) + (a,)
                continue
            warna = tangga(BIRU, bentang(v, lo, hi))
            sn = min(1.0, s / 0.35) ** 0.7
            mix = tuple(255 + (warna[i] - 255) * sn for i in range(3))
            px[x, y] = (round(mix[0]), round(mix[1]), round(mix[2]), a)
    im.save(dst, optimize=True)


if __name__ == "__main__":
    merah_ke_biru("public/ikon/rocket.png", "public/ikon/rocket-biru.png")
    print("ok rocket-biru")
    for nama in ["memo", "video-game", "trophy"]:
        warnai(f"public/ikon/{nama}.png", f"public/ikon/{nama}-bk.png")
        print("ok", nama)
