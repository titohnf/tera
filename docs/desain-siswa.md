# Bahasa desain Tera Siswa

Berlaku untuk seluruh permukaan siswa: `/siswa`, `/mandiri`, `/umum`, `/belajar`.
Tujuannya satu: layar-layarnya tampak satu aplikasi, dan setiap pilihan visual
membawa arti — bukan hiasan.

## Arah: bermain di semua layar
Seluruh permukaan siswa terasa seperti permainan, bukan dasbor: benda yang bisa
diketuk terlihat bisa ditekan (bertebing), huruf tebal dan besar, warna jenuh
dan bermakna. Tidak ada layar "serius yang datar" — Try Out, Latihan Soal, dan
Profil memakai bahasa yang sama dengan Misi.

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
- **Efek "dipencet" HANYA milik tombol** (`TombolTebing`, tombol biru): tombol
  bertebing 4px yang turun 3px saat ditekan. **Kartu tidak bergerak** saat
  disentuh — kartu bergaris 2px dengan tepi bawah 4px (`border-b-4`) sebagai
  gaya diam, dan yang bisa diketuk hanya sedikit menggelap. Tombol di dalam
  kartu (mis. "Mulai Misi") yang memencet, bukan kartunya.
- Satu skala sudut: kartu `2xl`, blok ikon `xl`, pil `full`.
- Huruf judul bobot 800. Angka besar.
- Aturan ini diterapkan SEKALI di `.tampilan-siswa` (`app/globals.css`) untuk
  pola kartu lama (`shadow-kartu`, `ring-gray-900/5`) dan tombol biru
  (`bg-blue-600`), supaya seluruh layar mengikutinya tanpa menyentuh tiap
  komponen. Komponen baru memakai `KARTU` dan `TombolTebing`.

## Ikon
Ikon 3D dari Microsoft Fluent Emoji (MIT), disalin ke `public/ikon/` dan dipakai
lewat `components/ui/Ikon3D.tsx`. Satu keluarga gambar saja — jangan mencampur
sumber ikon 3D lain. Ikon 3D berdiri sendiri, TANPA wadah (lingkaran/kotak) di
belakangnya. Tanpa maskot untuk saat ini. Pengecualian: bilah bawah memakai ikon
dua nada Phosphor Icons (MIT; bukan 3D, bukan garis).

**Palet ikon menu: biru + emas** (+ putih). Menu beranda memakai Memo (Latihan
Soal), Rocket (Misi, warna asli; hanya bagian merahnya diganti biru), Controller game (Materi — interaktif, bukan buku), Trophy (Try Out) — jangan menambah ikon
menu berwarna lain. Ikon mapel boleh berwarna menurut mapelnya. Ikon garis (lucide) hanya untuk panah
dan kendali kecil.

## Isi
Dekorasi diganti informasi: persen, skor, tanggal, nama topik. Satu elemen
berani per layar (hero beranda atau kartu mapel Misi), sisanya tenang.

## Komponen
`components/ui/desain.tsx`: `KARTU`, `TombolTebing`, `PitaKemajuan`.
