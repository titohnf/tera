# Format impor butir

`contoh-butir.json` di folder ini adalah **satu contoh yang sudah lolos periksa**: 11 tipe soal,
3 kolam, dua mode penilaian grid. Salin, ganti isinya, impor.

## Dua jalan impor, satu format

**Lewat Sora — ini jalan utamanya.** Bank Soal → Pengukuran → impor, pilih berkasnya. Berkas dengan
format di halaman ini dibaca apa adanya sejak `soal-json.ts` di repo `form` mengenali bungkus
`{ topik_id, butir }` dan nama kolom database. Di sana ada pratinjau per butir sebelum disimpan,
dan butir probe langsung terdaftar ke kolamnya.

**Lewat terminal**, untuk naskah besar atau saat tidak ada sesi Sora terbuka:

```bash
node scripts/impor-butir.mjs berkas-anda.json           # periksa saja
node scripts/impor-butir.mjs berkas-anda.json --tulis   # periksa lalu tulis
```

Tanpa `--tulis` tidak ada satu baris pun yang masuk. Pemeriksanya mengirim tiap butir ke
`nilai_jawaban()` **di database** bersama jawaban yang mestinya benar — kalau nilainya bukan bobot
penuh, butirnya ditolak di sini, bukan ditemukan berbulan kemudian sebagai anak yang "salah".

Sora menerima **dua dialek** untuk isi yang sama: nama kolom database seperti di halaman ini
(`type`, `prompt`, `correct_answer`), dan nama naskah Skema Data Sistem (`format`, `konten_soal`,
`kunci_jawaban`) yang bisa diunduh dari tombol "Unduh contoh JSON" di dialog impornya. Keduanya
melewati pemeriksaan yang sama persis. Yang di halaman ini dipakai kalau naskahnya disusun dari
kolom database; yang naskah dipakai kalau ditulis mengikuti dokumen.

Apa pun jalannya, butir mendarat sebagai `draf` — impor tidak pernah menyatakan sebuah butir sudah
diverifikasi.

## Bentuk berkasnya

```json
{
  "format": "tera/butir-impor@1",
  "topik_id": "D-01",
  "butir": [ { "type": "...", "prompt": "...", "...": "..." } ]
}
```

`topik_id` di luar berlaku untuk semua butir; sebuah butir boleh menimpanya (termasuk dengan
`null`). Nama kolomnya **sama persis dengan kolom `question_bank_items`** — tidak ada lapisan
penerjemah yang bisa salah.

## Kolam (`peruntukan`)

| Kolam | Isinya apa | Ukuran yang dituju | Catatan |
|---|---|---|---|
| `latihan` | 8 butir per level Bloom | 8 × level dalam cakupan topik | Menentukan ketuntasan lewat Skor Putaran 1 |
| `ujian` | kolam campur level, disajikan 12 butir berjenjang per murid | ±4 butir per level | Satu paket per topik; tidak menentukan ketuntasan |
| `probe` | 10 butir, **C2–C3 saja** | 10 per topik | Untuk pengecekan ulang berkala; ikut terdaftar di `item_probe` oleh skripnya |

Ketiganya **kolam terpisah** — satu butir tidak boleh dipakai dua kolam. Butir probe yang beberapa
menit sebelumnya muncul di paket latihan mengukur ingatan minggu lalu, bukan penguasaan yang
bertahan; database menolaknya lewat trigger.

Butir berkolam **wajib** punya `topik_id` dan `bloom_level`. `bloom_level` di luar cakupan topik
tetap diterima — ia jadi paket **pengayaan** yang diukur tapi tidak menentukan ketuntasan
(migrasi 182), dan pemeriksanya menyebutkannya sebagai catatan, bukan galat.

### Tipe yang tidak boleh masuk kolam

`essay` dan `upload_file` dinilai manusia. Paket menyajikan seluruh butir yang aktif tanpa memandang
tipe, jadi satu butir esai di kolam `latihan` akan muncul di paket sebagai soal yang tidak bisa
dinilai — dan Skor Putaran 1 paket itu jadi angka yang tidak sebanding dengan ambangnya. Skripnya
menolaknya. Tulis keduanya tanpa `topik_id` dan tanpa `peruntukan` (lihat dua butir terakhir di
contoh).

## Bentuk `options` dan `correct_answer` per tipe

Tiga hal yang paling sering keliru, disebut lebih dulu:

1. **Kunci pilihan ganda adalah TEKS opsinya**, bukan `"A"` dan bukan `0`.
2. **`options.items` pada `ordering` harus sudah dalam urutan benar.** Layar mengacaknya sendiri
   untuk murid.
3. **`matching` dan `ordering` dinilai dari `options`,** bukan dari `correct_answer`.
   `correct_answer` boleh diisi sebagai salinan yang terbaca manusia; kalau isinya berbeda dari
   `options`, pemeriksanya menolak — yang salah adalah salinannya. Salinan itu **tidak ikut
   disimpan**: kolom `correct_answer` dua bentuk ini diisi `null`, karena salinan kedua adalah
   salinan yang suatu hari akan berbeda pendapat dengan aslinya. Dua jalan impor melakukannya sama.

| `type` | `options` | `correct_answer` |
|---|---|---|
| `mcq_single` | `{"choices":["...","..."]}` | teks salah satu choice |
| `mcq_multi` | `{"choices":[...]}` | array teks choice |
| `true_false` | `null` | `"true"` / `"false"` (teks) |
| `short_answer` | `null` | array ejaan yang diterima, mis. `["-5","-5.0"]` |
| `fill_blank` | `null` | array kunci, satu per `___` di prompt |
| `matching` | `{"pairs":[{"left":"...","right":"..."}]}` | salinan `{left: right}` |
| `ordering` | `{"items":[...]}` urut benar | salinan `items` |
| `statement_grid` | `{"statements":[...],"answer_labels":["Benar","Salah"],"statement_label":"..."}` | `{"answers":[true,false,null],"grading_mode":"proportional"\|"all_or_nothing"}` |
| `true_false_two_tier` | `{"tier2_prompt":"Alasannya:","tier2_choices":[...]}` | `{"tier1":"true","tier2":"<teks pilihan>","skor_sebagian":0.5}` |
| `essay`, `upload_file` | `null` | `null` |

Catatan bentuk:

- Perbandingan jawaban **tidak peka huruf besar-kecil dan spasi tepi**: `"B"`, `" b "` sama.
- `answers` pada grid boleh `null` untuk baris yang sengaja tidak berkunci — baris itu tidak bisa
  diperoleh siapa pun dan tidak ikut membagi nilainya.
- `skor_sebagian` pada dua tingkat: 0,5 kalau tidak disebut. Besarannya diserahkan ke tim konten
  per butir (FR5), jadi ia memang tinggal di kunci tiap butir.
- `___` pada `fill_blank` harus tiga garis bawah, dan jumlahnya harus sama dengan jumlah kunci.

## Dua skema penilaian, dan kenapa itu urusan tim konten

Butir yang sama dinilai dua cara, tergantung ia disajikan di mana (migrasi 175):

| Disajikan sebagai | Skema | Akibatnya |
|---|---|---|
| paket latihan & paket ujian | `pengukuran` | ada **koreksi tebakan** |
| probe (pengecekan ulang), latihan bebas, kuis Sora | `sederhana` | tidak ada koreksi tebakan |

Yang berubah di `pengukuran`, dan yang perlu dipertimbangkan saat menulis:

- **`true_false` yang salah bernilai −bobot**, bukan 0. Peluang menebaknya 50%, jadi tanpa koreksi
  satu paket Benar-Salah yang ditebak seluruhnya bernilai sekitar setengah. Lantainya dipasang saat
  skor paket dijumlahkan, jadi nilai paket tidak pernah negatif — tapi satu Benar-Salah yang
  ditebak meleset memakan nilai butir lain. Jangan menulis pernyataan yang bisa dijawab benar
  tanpa memahami apa pun.
- **`mcq_multi` mendapat nilai sebagian**: (benar − salah) ÷ banyak kunci. Menandai semua opsi
  tidak lagi menguntungkan. Tulis distraktor yang benar-benar salah, bukan yang "kurang tepat".
- **`statement_grid` `proportional`** dihitung (benar − salah) ÷ baris yang berkunci. Baris yang
  **dikosongkan** murid tidak dihukum — mengaku tidak tahu berbeda dari menebak. `all_or_nothing`
  tidak berubah di skema mana pun.
- `fill_blank` dan `true_false_two_tier` sama di kedua skema.

Pemeriksanya menguji tiap butir di **kedua** skema: jawaban yang benar harus bernilai penuh di
dua-duanya.

## Kolom lain

| Kolom | Isi | Bawaan |
|---|---|---|
| `weight` | bobot butir, > 0 | `1` |
| `explanation` | pembahasan umum, ditampilkan sesudah dijawab | `null` |
| `penjelasan_per_opsi` | `{"0":"...","1":"..."}` — **kunci = indeks opsi sebagai teks**. Inilah yang membuat analisis distraktor mungkin: "opsi B paling sering dipilih" hanya berguna kalau ada yang menulis miskonsepsi apa yang diwakili opsi B | `null` |
| `status_verifikasi` | `draf` → `terverifikasi_matematis` → `direview_pedagogis` → `aktif` → `ditarik` | `draf` |
| `sumber_pembuatan` | `manual` atau `ai_generated_verified` | `manual` |
| `elemen_proses` | array dari `penalaran`, `pemecahan_masalah`, `komunikasi`, `representasi`, `koneksi` | `null` |
| `pola_solo` | `unistruktural`, `multistruktural`, `relasional` — dirancang untuk multi-select | `null` |
| `tag_konteks_pisa` | `personal`, `occupational`, `societal`, `scientific` — relevan C4 ke atas | `null` |
| `label_kategori` | label dua kategori Benar-Salah, mis. `{"positif":"Benar","negatif":"Salah"}`. Metadata rubrik; layar murid tetap menulis "Benar/Salah" | `null` |
| `stimulus_images` | array URL gambar stimulus | `[]` |

**Hanya butir `aktif` yang disajikan ke murid.** Impor boleh masuk sebagai `draf` dan diaktifkan
sesudah review — keanggotaan paketnya sudah disusun, penyajiannya yang menunggu status.

## Sesudah impor

Butir yang masuk bank belum jadi paket. `semai_paket_topik` yang menyusunnya: satu paket latihan per
level Bloom yang ada butirnya, satu paket ujian. Aman diulang — paket yang sudah pernah dikerjakan
murid dilewati, jadi menambah butir tidak mengacak-acak paket yang sedang berjalan.

- **Lewat terminal**, skripnya memanggilnya sendiri untuk tiap topik yang butir latihan/ujiannya
  bertambah.
- **Lewat Sora**, tekan **Susun paket** di halaman topiknya. Sengaja terpisah dari impor: menyusun
  paket adalah keputusan tersendiri, dan naskah sering masuk bertahap.

Lalu aktifkan butirnya. Keanggotaan paket disusun tanpa memandang status, tapi yang **disajikan**
ke murid hanya butir `aktif` — jadi paket yang isinya masih `draf` akan tampak ada dan terbuka
kosong.
