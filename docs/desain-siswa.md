# Bahasa desain Tera Siswa

Berlaku untuk seluruh permukaan siswa: `/siswa`, `/mandiri`, `/umum`, `/belajar`.
Tujuannya satu: layar-layarnya tampak satu aplikasi, dan setiap pilihan visual
membawa arti — bukan hiasan.

## Pilihan arah: berlapis
- **Bermain** (tombol bertebing, perayaan kecil, bintang): Misi dan Materi.
- **Tenang tapi tegas** (datar, angka besar): Latihan Soal, Try Out, Profil.
- Keduanya memakai komponen dasar, warna, dan huruf yang sama.

## Warna — setiap warna berarti satu hal
| Peran | Nilai | Dipakai untuk |
|---|---|---|
| Biru Tera | `#0060F0` (tebing `#0048B8`) | aksi utama, tab aktif, tautan — warna logo |
| Tosca Tera | `#20C0B0` | kemajuan dan yang berhasil — warna logo |
| Emas | `#FBBF24` | HANYA "tuntas" dan bintang (aturan lama Misi) |
| Merah | `#EF4444` | HANYA gagal / perlu diulang |
| Warna mapel | tetap per mapel | HANYA benda milik mapel itu (kartu mapel, blok mapel Try Out) |
| Tinta / Kertas | `#0F172A` / `#F1F5F9` | teks / latar |

Warna fitur (Latihan, Misi, Materi, Try Out) hanya muncul di blok ikon pintu
beranda. Jangan memakainya untuk hal lain.

## Huruf
Plus Jakarta Sans (bobot 500–800), satu keluarga. Angka (persen, skor, jumlah
soal) memakai `tabular-nums` dan ukuran besar — angkalah yang jadi bintangnya.

## Bentuk dan rasa tekan
- Kartu: `rounded-2xl`, putih, garis `slate-200`, tanpa bayangan tebal, tanpa
  gradien, tanpa lingkaran hiasan. Ditekan: turun 1px dan sedikit abu.
- **Tebing bawah hanya untuk aksi utama** (`.tebing`): tombol seperti benda
  yang bisa ditekan. Kartu biasa tidak bertebing.
- Satu skala sudut: kartu `2xl`, blok ikon `xl`, pil `full`.

## Isi
Dekorasi diganti informasi: persen, skor, tanggal, nama topik. Satu elemen
berani per layar (hero beranda atau kartu mapel Misi), sisanya tenang.

## Komponen
`components/ui/desain.tsx`: `KARTU`, `TombolTebing`, `PitaKemajuan`.
