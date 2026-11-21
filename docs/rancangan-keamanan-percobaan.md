# Rancangan: mengamankan soal dan percobaan try out

Status: **tahap 1 sudah ditulis (21 Nov 2026, malam), belum dijalankan/dideploy.** Migrasi
`225_fungsi_aman_soal_dan_kirim_percobaan.sql` dan `226_tutup_baca_soal_publik.sql` ada di
`supabase/migrations`; kode Sora (repo `form`) sudah diganti memakai `soal_peserta`,
`bobot_paket`, dan `kirim_percobaan`. Tahap 2 belum. Dibuat setelah ditemukan bahwa kunci
jawaban try out bisa dibaca peserta lewat API.

Catatan penyimpangan dari rancangan: batas waktu pada `kirim_percobaan` TIDAK dibuat, karena
tabel `answers` tidak menyimpan waktu masuknya jawaban; batas waktu tetap dijaga `saveAnswer`.

## 1. Temuan

| # | Celah | Bukti | Dampak |
|---|---|---|---|
| A | **Kunci jawaban dan pembahasan terbaca siapa pun.** Kebijakan `Public reads questions of published quizzes` (migrasi 061) membuka SELURUH kolom `questions` untuk paket terbit, termasuk `correct_answer` dan `explanation`. Halaman siswa hanya tidak menampilkannya. | **Terbukti** dengan kunci publik (anon): soal 1 try out terbaca `$7^{-3}$`. | Siswa yang membuka konsol browser atau memanggil API bisa mengambil seluruh kunci. |
| B | **Skor bisa dipalsukan.** Kebijakan `Public updates attempts/answers on published quizzes` mengizinkan siapa pun mengubah BARIS MANA PUN pada paket terbit, kolom apa pun (`auto_score`, `total_score`). Murid berakun (jalur asesmen) juga bisa menulis skornya sendiri (`Students manage own answers`, migrasi 075). | Dari teks kebijakan; **belum dicoba** karena mengubah data. | Nilai peserta tidak bisa dipercaya. |
| C | **Jawaban dan skor semua peserta terbaca siapa pun.** `Public reads attempts` dan `Public reads answers` memakai `using (true)`, untuk SEMUA paket. | Dari teks kebijakan. Hari ini 0 baris karena tidak ada percobaan; terbuka begitu peserta pertama mengirim. | Peserta bisa menyalin jawaban teman secara langsung; nama dan nilai siswa semua paket bocor. |
| D | **Batas waktu hanya dijaga aplikasi.** `saveAnswer` menolak setelah waktu habis, tetapi penulisan langsung ke tabel tidak lewat penjaga itu. | Dari kode. | Waktu bisa diakali. |
| E | Daftar paket terbit beserta kode bagikannya terbaca publik. | Terbukti, 1 paket. | Rendah; kode paket kelas lain bisa ditebak dibuka. |

Yang aman: `question_bank_items` (0 baris terbaca anon), `attempt_events` (hanya tulis untuk
percobaan berjalan, hanya pengelola yang membaca), dan fungsi penilaian (`nilai_jawaban`
menerima kunci sebagai MASUKAN, jadi tidak membocorkan).

## 2. Prinsip

Peserta **tidak pernah membaca atau menulis tabel kuis secara langsung.** Semua lewat
fungsi `security definer` yang memeriksa: paketnya terbit, percobaannya milik pemanggil
(dikenali dari id percobaan yang hanya ia pegang), belum dikirim, dan belum lewat waktu.
Kunci hanya dibaca di dalam database.

Pengelola (admin, tutor pemilik paket atau kelasnya) tetap lewat kebijakan baris biasa.
Tera memakai kunci layanan (melewati RLS), jadi laporan Tera tidak terpengaruh.

## 3. Tahap 1 — sebelum try out: tutup kunci (celah A)

Sengaja kecil: hanya soal, tidak menyentuh percobaan dan jawaban.

**Fungsi baru (migrasi 225, aditif, aman dijalankan kapan saja):**

```sql
-- soal tanpa kunci, tanpa pembahasan, tanpa templat
soal_peserta(p_quiz_id uuid) returns setof jsonb      -- hanya bila paket terbit
-- jumlah bobot soal (untuk "skor / total" di halaman hasil)
bobot_paket(p_quiz_id uuid) returns numeric
-- menilai dan menutup percobaan seluruhnya di database
kirim_percobaan(p_attempt_id uuid) returns numeric    -- total skor, null bila ada yang menunggu tutor
```

`kirim_percobaan` melakukan persis yang kini dilakukan `finalizeAttempt` di TypeScript:
membaca soal dan jawaban percobaan itu, memanggil `nilai_jawaban_banyak()` (aturan penilaian
yang SUDAH satu-satunya), menulis `auto_score` per jawaban, menjumlahkan seperti
`totalScore()` (null selagi ada esai menunggu), mengisi `submitted_at`. Ditambah satu hal
yang sekarang tidak ada: menolak percobaan yang sudah dikirim, dan percobaan paket `cbt_mode`
yang lewat batas waktu + 60 detik hanya dinilai dari jawaban yang masuk sebelum batas.

**Perubahan kode Sora:**
1. `q/[code]/page.tsx`: ganti pembacaan `questions` dengan `rpc('soal_peserta')`.
2. `q/[code]/actions.ts` `finalizeAttempt`: ganti pembacaan soal, penilaian, dan penulisan
   skor dengan satu `rpc('kirim_percobaan')`; sisanya (redirect) tetap.
3. `q/[code]/result/[attemptId]/page.tsx`: total bobot dari `rpc('bobot_paket')`, bukan dari
   `answers(questions(weight))` (yang akan kosong setelah tahap berikutnya).

**Migrasi 226 (menutup, dijalankan SETELAH kode baru terdeploy):**

```sql
drop policy "Public reads questions of published quizzes" on questions;
create policy "Pengelola membaca soal paket terbit" on questions for select using (
  is_admin() or (is_tutor() and exists (
    select 1 from quizzes q where q.id = questions.quiz_id
      and (q.created_by = auth.uid()
           or (q.class_id is not null and is_class_tutor(q.class_id))
           or (q.session_id is not null and is_session_tutor(q.session_id)))))
);
```

Tutor yang selama ini membaca soal lewat kebijakan publik tetap bisa lewat kebijakan baru;
murid berakun tidak lagi.

### Urutan penerapan (tanpa waktu mati)

1. Jalankan migrasi **225** (aditif; kode produksi lama tidak peduli).
2. Deploy Sora yang baru (satu deploy, bersama perubahan lain).
3. Uji alur siswa penuh di produksi (mulai, jawab, kirim, skor sama).
4. Jalankan migrasi **226**. Uji lagi: anon membaca `questions` harus 0 baris.

Menjalankan 226 SEBELUM deploy akan membuat soal kosong di halaman siswa lama. Itu risiko
utama rancangan ini, dan urutan di atas yang mencegahnya.

**Pemulihan:** `create policy "Public reads questions of published quizzes" on questions for select using (exists (select 1 from quizzes q where q.id = questions.quiz_id and q.status = 'published'));` mengembalikan keadaan semula seketika.

## 4. Tahap 2 — sesudah try out: tutup tulis dan baca silang (celah B, C, D)

Lebih besar karena mengubah seluruh jalur peserta. Dikerjakan tanpa tekanan jadwal.

- Fungsi `mulai_percobaan`, `simpan_jawaban`, `catat_posisi`, `hasil_peserta` (dan
  `kirim_percobaan` dari tahap 1). `simpan_jawaban` menolak: percobaan sudah dikirim, soal
  bukan milik paket, dan (cbt) lewat batas waktu. Satu-satunya kolom yang bisa ditulis
  peserta: `response`.
- Hapus kebijakan `Public reads/updates attempts`, `Public reads/updates/writes answers`,
  `Public creates attempts`. Pengelola tetap punya kebijakan khusus tutor/admin.
- `Students manage own answers/attempts` (075) dipersempit: murid berakun juga menulis lewat
  fungsi, tidak langsung.
- Halaman hasil peserta dan peringkat (jalur non-TKA) membaca lewat `hasil_peserta`, yang
  hanya memuat percobaan itu sendiri (dan peringkat sebagai angka), bukan percobaan orang lain.
- Pantauan langsung (`LiveMonitor`) memakai sesi tutor, tidak terpengaruh.

## 5. Rencana uji

Tahap 1:
- Anon membaca `questions` → 0 baris; membaca `correct_answer` → ditolak/kosong.
- `soal_peserta` mengembalikan 30 soal TANPA `correct_answer`/`explanation`.
- Alur siswa penuh di lokal: jawab semua benar → skor **30**; campuran (kompleks dan tabel
  sebagian) → skor **sama persis** dengan penilai database yang kini dipakai; kirim dua kali
  → ditolak; kirim setelah batas waktu → hanya jawaban sebelum batas yang dinilai.
- Paket NON-TKA (kuis kelas) tetap berjalan (jalur lama lewat fungsi yang sama).

**Tidak bisa saya uji sendiri:** kebijakan baru untuk TUTOR dan ADMIN (butuh sesi login).
Pemilik perlu membuka halaman Hasil dan Live Monitoring dengan login tutor/admin sesudah 226.

## 6. Yang tidak diselesaikan rancangan ini

- Tangkapan layar dan foto layar tetap tidak bisa dicegah (lihat pembahasan anti-curang).
- Peserta tetap bisa meminta bantuan orang lain di luar layar.
- Soal try out ini contoh resmi yang terbuka untuk umum; mengunci kuncinya hanya membuat
  mencari jawabannya tidak semudah satu panggilan API, bukan mustahil.
