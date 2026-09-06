-- ============================================================
-- Kolam ujian C4–C6, dan kuota bentuk soal yang diminta Protokol
--
-- TEMUAN YANG MELAHIRKAN MIGRASI INI. Seluruh 19 paket ujian pilot hanya
-- menguji C1–C3. Kolamnya berisi 216 butir — C1: 72, C2: 71, C3: 73, dan
-- C4–C6: NOL. Migrasi 171 menulis butir latihan sampai C6 tapi berhenti di C3
-- untuk kolam ujiannya, dan tidak ada yang menagihnya karena `semai_paket_topik`
-- memang hanya menyusun apa yang ada.
--
-- Akibatnya bukan soal kelengkapan, melainkan soal arti: sebuah topik bisa
-- dinyatakan `tuntas` sesudah enam paket latihan sampai C6, sementara paket
-- ujian — satu-satunya pengukuran yang mencampur level dan tidak diberi tahu
-- levelnya kepada murid (dokumen fondasi Bagian 3.7) — tidak pernah menyentuh
-- satu pun level tinggi. Yang diklaim "sudah diuji" hanya separuh Taksonomi.
--
-- KUOTA BENTUK SOAL. Protokol Uji Coba Bagian 3 menuntut Benar-Salah 35%, dan
-- Bagian 3 itu pula yang menghitung `statement_grid` ("PG Kompleks - Kategori")
-- di dalam kuota tersebut — lihat catatan terbuka di migrasi 138. Kolam ujian
-- hari ini berisi 2 butir Benar-Salah dari 216 (1%). Bauran 228 butir baru di
-- bawah dipilih supaya kolamnya mendarat di angka yang diminta:
--
--   per topik: 5 statement_grid + 3 true_false  = 8 butir keluarga Benar-Salah
--              1 mcq_multi + 3 short_answer     = 4 butir lainnya
--
--   sesudahnya: (8 × 19) + 2 = 154 dari 444 butir = 34,7%
--
-- Angka itu tidak bisa dicapai dengan menambah C4–C6 saja tanpa membuat level
-- tinggi hampir seluruhnya Benar-Salah — bentuk yang paling lemah justru untuk
-- menganalisis dan mencipta. Maka yang dikejar di sini kuota KOLAMNYA, dengan
-- `statement_grid` sebagai tulang punggungnya: ia deret Benar-Salah, tapi ia
-- menuntut penalaran per pernyataan, bukan satu tebakan biner.
--
-- SEMUANYA BUTIR DUMMY, sama seperti 169 dan 171. Ditulis untuk menguji
-- MESINNYA, bukan untuk mengajar anak. Dicabut dengan satu perintah:
--
--   delete from question_bank_items
--    where peruntukan = 'ujian' and bloom_level >= 4;
--
-- AKIBAT YANG HARUS DIKETAHUI SEBELUM DIJALANKAN: PAKET UJIAN MEMBESAR.
-- `semai_paket_topik` memasukkan SELURUH butir ujian sebuah topik ke dalam satu
-- paket ujian — bukan mengambil sampel darinya. Dengan 12 butir baru per topik,
-- paket ujian tumbuh dari sekitar 10 butir menjadi sekitar 22, sedangkan
-- Protokol Uji Coba Bagian 3 menyebut 12 butir untuk 25–30 menit (dipakai
-- migrasi 154 sebagai dasar `batas_waktu_ujian`).
--
-- Itu TIDAK diperbaiki di sini, dan ini keputusan sadar. Memperbaikinya berarti
-- mengubah `semai_paket_topik` dari "menurunkan susunan dari bank" menjadi
-- "mengambil sampel", dan sebuah penyusun paket yang memilih sendiri butir mana
-- yang masuk ujian adalah kebijakan pengukuran — berapa butir per level, apakah
-- sampelnya sama untuk setiap murid, apakah ia diacak ulang tiap tahun. Satu
-- migrasi yang menambah butir bukan tempat untuk memutuskan itu diam-diam.
-- Yang berlaku sesudah berkas ini: ujian menguji SELURUH rentang Bloom, dengan
-- harga paket yang lebih panjang daripada yang disebut Protokol.
--
-- EMPAT PAKET UJIAN TIDAK IKUT BERUBAH: D-02, D-03, D-04, dan D-08 sudah
-- pernah dikerjakan, dan `semai_paket_topik` melewati paket yang sudah punya
-- sesi — aturannya sendiri, bukan pengecualian yang dibuat di sini. Menambah
-- butir ke paket ujian yang sudah dikerjakan akan membuat ujian yang sudah
-- selesai tampak tertinggal 12 butir selamanya, padahal ujian tidak bisa
-- dibuka dua kali. Keempatnya baru ikut lengkap kalau hasil uji cobanya
-- dikosongkan.
--
-- Jalankan SESUDAH 175.
-- ============================================================

create or replace function sisip_butir_ujian(p_butir jsonb, p_penulis uuid)
returns void
language plpgsql
as $fn$
begin
  -- Idempoten per butir, sama seperti 171: dijalankan dua kali tidak
  -- melahirkan salinan.
  if exists (
    select 1 from question_bank_items
    where topik_id = p_butir ->> 'topik' and prompt = p_butir ->> 'prompt'
  ) then
    return;
  end if;

  insert into question_bank_items (
    created_by, type, prompt, options, correct_answer, weight,
    bloom_level, status_verifikasi, elemen_proses, sumber_pembuatan,
    peruntukan, topik_id
  ) values (
    p_penulis,
    p_butir ->> 'type',
    p_butir ->> 'prompt',
    case when jsonb_typeof(p_butir -> 'opsi') = 'object' then p_butir -> 'opsi' else null end,
    p_butir -> 'kunci',
    1,
    (p_butir ->> 'bloom')::smallint,
    'aktif',
    array['penalaran']::text[],
    'ai_generated_verified',
    'ujian',
    p_butir ->> 'topik'
  );
end;
$fn$;

do $$
declare
  v_penulis uuid;
  v_butir jsonb;
  v_topik text;
begin
  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in select * from jsonb_array_elements($b1$
[
  {"topik":"D-01","bloom":4,"type":"statement_grid","prompt":"Seorang siswa menghitung -12 − (-5) × 2. Nilai setiap pernyataan berikut.","opsi":{"statements":["Perkalian dikerjakan lebih dulu daripada pengurangan","Hasil akhirnya -2","Hasil akhirnya -14","Mengerjakan dari kiri ke kanan memberi hasil yang sama"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-01","bloom":4,"type":"statement_grid","prompt":"Seorang siswa menghitung -20 + 6 × (-3). Nilai setiap pernyataan berikut.","opsi":{"statements":["Perkalian dikerjakan lebih dulu daripada penjumlahan","Hasil akhirnya -38","Hasil akhirnya 42","Tanda kurung pada (-3) mengubah urutan operasinya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-01","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar untuk p = -9 dan q = 4.","opsi":{"choices":["p + q bernilai negatif","p × q bernilai negatif","p − q bernilai positif","nilai mutlak p lebih besar daripada nilai mutlak q"]},"kunci":["p + q bernilai negatif","p × q bernilai negatif","nilai mutlak p lebih besar daripada nilai mutlak q"]},
  {"topik":"D-01","bloom":4,"type":"true_false","prompt":"Hasil kali dua bilangan bulat negatif selalu bernilai positif.","opsi":null,"kunci":"true"},
  {"topik":"D-01","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan -3 − 7 = -4 karena \"minus bertemu minus menjadi plus\". Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Hasil yang benar adalah -10","Alasan itu baru berlaku untuk -3 − (-7)","Pengurangan bilangan bulat bersifat komutatif"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-01","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menulis -8 + 3 = -11. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Ia menjumlahkan nilai mutlaknya lalu memberi tanda minus","Hasil yang benar adalah -5","Cara yang ia pakai benar jika kedua bilangannya negatif"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-01","bloom":5,"type":"true_false","prompt":"Untuk setiap bilangan bulat a dan b berlaku a − b = -(b − a).","opsi":null,"kunci":"true"},
  {"topik":"D-01","bloom":5,"type":"short_answer","prompt":"Sebuah bilangan bulat dikurangi -6 menghasilkan 1. Tuliskan bilangan itu.","opsi":null,"kunci":["-5"]},
  {"topik":"D-01","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun soal yang jawabannya -15. Nilai setiap usulannya.","opsi":{"statements":["-20 + 5","-5 × 3","-10 − (-5)","20 − 5"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan soal"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-01","bloom":6,"type":"true_false","prompt":"Ada bilangan bulat yang jika dikalikan dengan dirinya sendiri menghasilkan bilangan negatif.","opsi":null,"kunci":"false"},
  {"topik":"D-01","bloom":6,"type":"short_answer","prompt":"Tuliskan bilangan bulat yang jika dikalikan -3 menghasilkan 21.","opsi":null,"kunci":["-7"]},
  {"topik":"D-01","bloom":6,"type":"short_answer","prompt":"Tuliskan bilangan bulat terbesar yang masih lebih kecil daripada -7.","opsi":null,"kunci":["-8"]},

  {"topik":"D-02","bloom":4,"type":"statement_grid","prompt":"Seorang siswa membandingkan 3/5 dengan 0,6. Nilai setiap pernyataan berikut.","opsi":{"statements":["3/5 sama dengan 0,6","3/5 lebih besar daripada 0,6","Keduanya sama dengan 60%","Bentuk desimal selalu lebih besar daripada bentuk pecahan"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-02","bloom":4,"type":"statement_grid","prompt":"Seorang siswa mengurutkan 0,45; 1/2; dan 40% dari yang terkecil. Nilai setiap pernyataan berikut.","opsi":{"statements":["40% paling kecil","1/2 paling besar","0,45 berada di tengah","Urutan yang benar adalah 1/2; 0,45; 40%"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-02","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar mengenai pecahan 7/8.","opsi":{"choices":["sama dengan 0,875","sama dengan 87,5%","lebih kecil daripada 3/4","terletak antara 1/2 dan 1"]},"kunci":["sama dengan 0,875","sama dengan 87,5%","terletak antara 1/2 dan 1"]},
  {"topik":"D-02","bloom":4,"type":"true_false","prompt":"Setiap pecahan yang penyebutnya lebih besar daripada pembilangnya bernilai kurang dari 1.","opsi":null,"kunci":"true"},
  {"topik":"D-02","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan 1/3 lebih besar daripada 1/2 karena 3 lebih besar daripada 2. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Pada pembilang yang sama, semakin besar penyebutnya semakin kecil nilainya","1/3 kira-kira 0,33","Alasannya berlaku kalau penyebut keduanya sama"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-02","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menghitung 25% dari 80 dan mendapat 32. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Angka 32 adalah 40% dari 80","Hasil yang benar adalah 20","25% sama dengan 1/4"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-02","bloom":5,"type":"true_false","prompt":"Bentuk persen sebuah desimal diperoleh dengan mengalikannya 100.","opsi":null,"kunci":"true"},
  {"topik":"D-02","bloom":5,"type":"short_answer","prompt":"Berapa persen 18 dari 72? Tulis angkanya saja.","opsi":null,"kunci":["25","25%"]},
  {"topik":"D-02","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menuliskan pecahan yang nilainya di antara 1/4 dan 1/2. Nilai setiap usulannya.","opsi":{"statements":["3/8","1/3","5/8","2/8"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-02","bloom":6,"type":"true_false","prompt":"Di antara dua pecahan yang berbeda selalu masih ada pecahan lain.","opsi":null,"kunci":"true"},
  {"topik":"D-02","bloom":6,"type":"short_answer","prompt":"Tuliskan SATU pecahan yang nilainya sama dengan 0,2.","opsi":null,"kunci":["1/5","2/10"]},
  {"topik":"D-02","bloom":6,"type":"short_answer","prompt":"Tuliskan bentuk persen dari 3/8.","opsi":null,"kunci":["37,5%","37,5"]},

  {"topik":"D-03","bloom":4,"type":"statement_grid","prompt":"Sebuah resep memerlukan 2 cangkir tepung untuk 3 orang. Seorang siswa menghitung kebutuhan 9 orang dan mendapat 6 cangkir. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Jumlah orangnya menjadi tiga kali lipat","Ini perbandingan senilai","Kebutuhannya seharusnya 4,5 cangkir"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-03","bloom":4,"type":"statement_grid","prompt":"Pada kecepatan tetap, 120 km ditempuh dalam 2 jam. Seorang siswa menyimpulkan 300 km ditempuh 5 jam. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Kecepatannya 60 km/jam","Ini perbandingan berbalik nilai","Pada kecepatan tetap, jarak dan waktu berbanding lurus"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-03","bloom":4,"type":"mcq_multi","prompt":"Pilih semua perbandingan yang senilai dengan 3 : 5.","opsi":{"choices":["6 : 10","9 : 15","5 : 3","12 : 20"]},"kunci":["6 : 10","9 : 15","12 : 20"]},
  {"topik":"D-03","bloom":4,"type":"true_false","prompt":"Pada perbandingan berbalik nilai, jika satu besaran menjadi dua kali lipat maka besaran lainnya menjadi setengahnya.","opsi":null,"kunci":"true"},
  {"topik":"D-03","bloom":5,"type":"statement_grid","prompt":"Sebuah pekerjaan selesai dalam 6 hari oleh 4 pekerja. Seorang siswa menyimpulkan 8 pekerja memerlukan 12 hari. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Ia memperlakukannya sebagai perbandingan senilai","Jawaban yang benar adalah 3 hari","Ini perbandingan berbalik nilai"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-03","bloom":5,"type":"statement_grid","prompt":"Sebuah peta berskala 1 : 500.000. Jarak dua kota pada peta 4 cm, dan seorang siswa menjawab 20 km. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Jarak sebenarnya 2.000.000 cm","Skala itu berarti 1 cm mewakili 5 km","Jarak sebenarnya 200 km"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-03","bloom":5,"type":"true_false","prompt":"Dua besaran yang berbanding lurus memiliki hasil bagi yang tetap.","opsi":null,"kunci":"true"},
  {"topik":"D-03","bloom":5,"type":"short_answer","prompt":"Jika 5 buku berharga Rp60.000, berapa rupiah harga 8 buku? Tulis angkanya saja tanpa titik.","opsi":null,"kunci":["96000"]},
  {"topik":"D-03","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh dua besaran yang berbanding BERBALIK nilai. Nilai setiap usulannya.","opsi":{"statements":["Banyak pekerja dan lama pekerjaan","Jarak tempuh dan waktu pada kecepatan tetap","Kecepatan dan waktu pada jarak tetap","Banyak barang dan harga totalnya"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-03","bloom":6,"type":"true_false","prompt":"Perbandingan 4 : 6 dan 6 : 9 adalah perbandingan yang senilai.","opsi":null,"kunci":"true"},
  {"topik":"D-03","bloom":6,"type":"short_answer","prompt":"Tuliskan bentuk paling sederhana dari perbandingan 18 : 24.","opsi":null,"kunci":["3 : 4","3:4"]},
  {"topik":"D-03","bloom":6,"type":"short_answer","prompt":"Jika a : b = 2 : 7 dan b = 21, berapa nilai a?","opsi":null,"kunci":["6"]},

  {"topik":"D-04","bloom":4,"type":"statement_grid","prompt":"Diagram batang penjualan: Senin 12, Selasa 15, Rabu 9, Kamis 15. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penjualan tertinggi terjadi pada dua hari","Nilai tertingginya 15","Rabu penjualannya paling rendah","Totalnya 41"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-04","bloom":4,"type":"statement_grid","prompt":"Perhatikan data 4, 7, 7, 9, 13. Nilai setiap pernyataan berikut.","opsi":{"statements":["Datanya punya satu modus","Jangkauannya 9","Nilai tengahnya 7","Rata-ratanya 7"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-04","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar untuk data 3, 5, 5, 8, 9.","opsi":{"choices":["modusnya 5","jangkauannya 6","mediannya 5","rata-ratanya 5"]},"kunci":["modusnya 5","jangkauannya 6","mediannya 5"]},
  {"topik":"D-04","bloom":4,"type":"true_false","prompt":"Diagram lingkaran cocok dipakai untuk menunjukkan bagian terhadap keseluruhan.","opsi":null,"kunci":"true"},
  {"topik":"D-04","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan bahwa naiknya rata-rata nilai kelas berarti nilai setiap anak naik. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Rata-rata bisa naik meskipun ada nilai yang turun","Rata-rata dipengaruhi seluruh nilai","Rata-rata selalu sama dengan median"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-04","bloom":5,"type":"statement_grid","prompt":"Untuk mengetahui kebiasaan berolahraga, seorang siswa bertanya \"Berapa tinggi badanmu?\". Nilai setiap pernyataan berikut.","opsi":{"statements":["Pertanyaannya sesuai dengan tujuannya","Jawabannya berupa data angka","Pertanyaan yang lebih sesuai: berapa jam berolahraga dalam seminggu","Tinggi badan tidak menjawab tujuan itu"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-04","bloom":5,"type":"true_false","prompt":"Sumbu tegak diagram batang yang tidak dimulai dari nol dapat membuat selisih antar-batang tampak lebih besar daripada sebenarnya.","opsi":null,"kunci":"true"},
  {"topik":"D-04","bloom":5,"type":"short_answer","prompt":"Berapa median data 6, 8, 8, 10, 13, 15?","opsi":null,"kunci":["9"]},
  {"topik":"D-04","bloom":6,"type":"statement_grid","prompt":"Seorang siswa merancang pertanyaan survei tentang kebiasaan membaca. Nilai setiap usulannya.","opsi":{"statements":["\"Berapa buku yang kamu baca bulan lalu?\"","\"Apakah kamu suka membaca?\" menghasilkan data kategori","\"Siapa nama gurumu?\"","Pertanyaannya harus bisa dijawab semua responden"],"answer_labels":["Sesuai","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-04","bloom":6,"type":"true_false","prompt":"Pertanyaan survei yang mengarahkan jawaban membuat data yang terkumpul menjadi bias.","opsi":null,"kunci":"true"},
  {"topik":"D-04","bloom":6,"type":"short_answer","prompt":"Berapa rata-rata data 5, 5, 6, 10?","opsi":null,"kunci":["6,5","6.5"]},
  {"topik":"D-04","bloom":6,"type":"short_answer","prompt":"Agar median sebuah data terurut adalah rata-rata dua nilai tengahnya, banyak datanya harus ganjil atau genap?","opsi":null,"kunci":["genap"]},

  {"topik":"D-05","bloom":4,"type":"statement_grid","prompt":"Perhatikan data 12, 15, 15, 18, 20. Nilai setiap pernyataan berikut.","opsi":{"statements":["Modusnya 15","Mediannya 15","Rata-ratanya 15","Jangkauannya 8"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-05","bloom":4,"type":"statement_grid","prompt":"Perhatikan data 4, 4, 9, 11. Nilai setiap pernyataan berikut.","opsi":{"statements":["Rata-ratanya 7","Mediannya 6,5","Modusnya 9","Jangkauannya 7"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-05","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar untuk data 2, 4, 4, 6, 14.","opsi":{"choices":["rata-ratanya 6","mediannya 4","modusnya 4","jangkauannya 10"]},"kunci":["rata-ratanya 6","mediannya 4","modusnya 4"]},
  {"topik":"D-05","bloom":4,"type":"true_false","prompt":"Modus adalah nilai yang paling sering muncul dalam sekumpulan data.","opsi":null,"kunci":"true"},
  {"topik":"D-05","bloom":5,"type":"statement_grid","prompt":"Pada data 5, 6, 7 ditambahkan satu nilai 100. Seorang siswa menyimpulkan mediannya berubah jauh. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Rata-ratanya yang berubah jauh","Median lebih tahan terhadap nilai ekstrem","Jangkauannya bertambah"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-05","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menghitung rata-rata 4, 6, 8 dan mendapat 9. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Ia membagi jumlahnya dengan 2, bukan 3","Hasil yang benar adalah 6","Rata-rata selalu sama dengan salah satu nilai datanya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-05","bloom":5,"type":"true_false","prompt":"Menambahkan satu nilai yang besarnya sama dengan rata-rata tidak mengubah rata-rata data itu.","opsi":null,"kunci":"true"},
  {"topik":"D-05","bloom":5,"type":"short_answer","prompt":"Rata-rata empat bilangan adalah 10. Berapa jumlah keempat bilangan itu?","opsi":null,"kunci":["40"]},
  {"topik":"D-05","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun lima bilangan yang rata-ratanya 6 dan modusnya 5. Nilai setiap usulannya.","opsi":{"statements":["5, 5, 5, 7, 8","5, 5, 6, 6, 8","4, 5, 5, 8, 10","5, 5, 6, 7, 7"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,false,false],"grading_mode":"proportional"}},
  {"topik":"D-05","bloom":6,"type":"true_false","prompt":"Sekumpulan data bisa saja tidak memiliki modus.","opsi":null,"kunci":"true"},
  {"topik":"D-05","bloom":6,"type":"short_answer","prompt":"Tuliskan satu bilangan yang jika ditambahkan pada data 2, 4, 6 membuat rata-ratanya menjadi 5.","opsi":null,"kunci":["8"]},
  {"topik":"D-05","bloom":6,"type":"short_answer","prompt":"Berapa jangkauan data 3, 3, 3, 3?","opsi":null,"kunci":["0"]}
]
$b1$) loop
    perform sisip_butir_ujian(v_butir, v_penulis);
  end loop;
end;
$$;

do $$
declare
  v_penulis uuid;
  v_butir jsonb;
begin
  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in select * from jsonb_array_elements($b2$
[
  {"topik":"D-06","bloom":4,"type":"statement_grid","prompt":"Dua sudut saling berpelurus dan salah satunya 115°. Nilai setiap pernyataan berikut.","opsi":{"statements":["Pasangannya 65°","Jumlah keduanya 180°","Keduanya sudut lancip","Pasangannya 75°"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-06","bloom":4,"type":"statement_grid","prompt":"Dua garis sejajar dipotong sebuah garis, dan salah satu sudut sehadapnya 70°. Nilai setiap pernyataan berikut.","opsi":{"statements":["Sudut sehadap lainnya juga 70°","Sudut dalam sepihak dengannya 110°","Sudut dalam berseberangan dengannya 110°","Jumlah dua sudut dalam sepihak 180°"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-06","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar tentang dua sudut yang saling berpenyiku.","opsi":{"choices":["jumlahnya 90°","keduanya sudut lancip","jumlahnya 180°","salah satunya boleh tumpul"]},"kunci":["jumlahnya 90°","keduanya sudut lancip"]},
  {"topik":"D-06","bloom":4,"type":"true_false","prompt":"Dua sudut yang bertolak belakang selalu sama besar.","opsi":null,"kunci":"true"},
  {"topik":"D-06","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan dua sudut yang berpelurus pasti sama besar. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Keduanya sama besar hanya jika masing-masing 90°","Jumlahnya selalu 180°","Salah satunya boleh 120°"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-06","bloom":5,"type":"statement_grid","prompt":"Seorang siswa mencari pelurus sudut 40° dan menjawab 50°. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Ia menghitung penyikunya","Jawaban yang benar 140°","Penyiku dan pelurus adalah hal yang sama"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-06","bloom":5,"type":"true_false","prompt":"Jika dua garis sejajar dipotong sebuah garis, sudut dalam berseberangan sama besar.","opsi":null,"kunci":"true"},
  {"topik":"D-06","bloom":5,"type":"short_answer","prompt":"Berapa derajat pelurus sudut 63°? Tulis angkanya saja.","opsi":null,"kunci":["117"]},
  {"topik":"D-06","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh pasangan sudut yang jumlahnya 90°. Nilai setiap usulannya.","opsi":{"statements":["30° dan 60°","45° dan 45°","50° dan 130°","20° dan 60°"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-06","bloom":6,"type":"true_false","prompt":"Ada pasangan sudut berpelurus yang kedua sudutnya tumpul.","opsi":null,"kunci":"false"},
  {"topik":"D-06","bloom":6,"type":"short_answer","prompt":"Sebuah sudut besarnya sama dengan penyikunya. Berapa derajat sudut itu?","opsi":null,"kunci":["45"]},
  {"topik":"D-06","bloom":6,"type":"short_answer","prompt":"Sebuah sudut besarnya tiga kali besar pelurusnya. Berapa derajat sudut itu?","opsi":null,"kunci":["135"]},

  {"topik":"D-07","bloom":4,"type":"statement_grid","prompt":"Seorang siswa menyederhanakan 3x + 2x − x. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya 4x","Ketiga sukunya sejenis","Hasilnya 5x","Yang dijumlahkan adalah koefisiennya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-07","bloom":4,"type":"statement_grid","prompt":"Perhatikan bentuk 2(x + 3). Nilai setiap pernyataan berikut.","opsi":{"statements":["Sama dengan 2x + 6","Sama dengan 2x + 3","Sifat yang dipakai adalah distributif","Untuk x = 4 nilainya 14"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,true,true],"grading_mode":"proportional"}},
  {"topik":"D-07","bloom":4,"type":"mcq_multi","prompt":"Pilih semua bentuk yang setara dengan 4x + 8.","opsi":{"choices":["4(x + 2)","2(2x + 4)","4x + 8x","8 + 4x"]},"kunci":["4(x + 2)","2(2x + 4)","8 + 4x"]},
  {"topik":"D-07","bloom":4,"type":"true_false","prompt":"Suku 3x dan suku 3y adalah suku sejenis.","opsi":null,"kunci":"false"},
  {"topik":"D-07","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menulis 3(x + 2) = 3x + 2. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Ia lupa mengalikan 3 dengan 2","Hasil yang benar 3x + 6","Untuk x = 1 bentuk miliknya bernilai 5, yang benar 9"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-07","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan 2x + 3x = 5x². Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Menjumlahkan suku sejenis tidak mengubah pangkatnya","Hasil yang benar 5x","Untuk x = 2 bentuk miliknya bernilai 20"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-07","bloom":5,"type":"true_false","prompt":"Nilai bentuk 2x − 5 untuk x = 3 adalah 1.","opsi":null,"kunci":"true"},
  {"topik":"D-07","bloom":5,"type":"short_answer","prompt":"Berapa nilai 5a − 2b untuk a = 4 dan b = 3?","opsi":null,"kunci":["14"]},
  {"topik":"D-07","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menulis bentuk aljabar yang bernilai 12 saat x = 3. Nilai setiap usulannya.","opsi":{"statements":["4x","x + 9","2x + 5","3x + 2"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-07","bloom":6,"type":"true_false","prompt":"Dua bentuk aljabar yang tulisannya berbeda bisa bernilai sama untuk setiap nilai x.","opsi":null,"kunci":"true"},
  {"topik":"D-07","bloom":6,"type":"short_answer","prompt":"Tuliskan bentuk paling sederhana dari 7y − 3y + y.","opsi":null,"kunci":["5y"]},
  {"topik":"D-07","bloom":6,"type":"short_answer","prompt":"Untuk x = -2, berapa nilai x² + 3x?","opsi":null,"kunci":["-2"]},

  {"topik":"D-08","bloom":4,"type":"statement_grid","prompt":"Seorang siswa menghitung 2³ × 2². Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya 2⁵","Hasilnya 32","Hasilnya 2⁶","Pangkatnya dijumlahkan karena basisnya sama"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-08","bloom":4,"type":"statement_grid","prompt":"Bilangan 4.500 ditulis dalam notasi ilmiah. Nilai setiap pernyataan berikut.","opsi":{"statements":["Bentuknya 4,5 × 10³","Bentuk 45 × 10² sudah baku","Pangkat sepuluhnya 3","Bentuk 0,45 × 10⁴ sudah baku"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-08","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar tentang √36.","opsi":{"choices":["nilainya 6","nilainya 18","36 adalah kuadrat sempurna","hasilnya bilangan bulat"]},"kunci":["nilainya 6","36 adalah kuadrat sempurna","hasilnya bilangan bulat"]},
  {"topik":"D-08","bloom":4,"type":"true_false","prompt":"Setiap bilangan bukan nol yang dipangkatkan nol bernilai 1.","opsi":null,"kunci":"true"},
  {"topik":"D-08","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menulis 3² × 3³ = 9⁵. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Ia ikut mengalikan basisnya","Hasil yang benar 3⁵","3⁵ sama dengan 243"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-08","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menulis √16 + √9 = √25. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya benar","Nilai ruas kirinya 7","Akar tidak dapat dijumlahkan dengan cara itu","Nilai ruas kanannya 5"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-08","bloom":5,"type":"true_false","prompt":"Notasi ilmiah menuliskan bilangan sebagai a × 10ⁿ dengan a bernilai paling kecil 1 dan kurang dari 10.","opsi":null,"kunci":"true"},
  {"topik":"D-08","bloom":5,"type":"short_answer","prompt":"Berapa nilai 5³?","opsi":null,"kunci":["125"]},
  {"topik":"D-08","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menulis 0,00072 dalam notasi ilmiah. Nilai setiap usulannya.","opsi":{"statements":["7,2 × 10⁻⁴","72 × 10⁻⁵","0,72 × 10⁻³","Pangkat sepuluhnya negatif"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,false,true],"grading_mode":"proportional"}},
  {"topik":"D-08","bloom":6,"type":"true_false","prompt":"Ada bilangan bulat negatif yang akar kuadratnya berupa bilangan bulat.","opsi":null,"kunci":"false"},
  {"topik":"D-08","bloom":6,"type":"short_answer","prompt":"Berapa hasil dari 2⁴ ÷ 2²?","opsi":null,"kunci":["4"]},
  {"topik":"D-08","bloom":6,"type":"short_answer","prompt":"Berapa nilai √81?","opsi":null,"kunci":["9"]},

  {"topik":"D-09","bloom":4,"type":"statement_grid","prompt":"Seorang siswa menyelesaikan 2x + 5 = 17. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penyelesaiannya x = 6","Kedua ruas dikurangi 5 lebih dulu","Penyelesaiannya x = 11","Hasilnya bisa diperiksa dengan mensubstitusikannya kembali"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-09","bloom":4,"type":"statement_grid","prompt":"Perhatikan pertidaksamaan 3x < 12. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penyelesaiannya x < 4","x = 4 termasuk penyelesaian","x = 3 termasuk penyelesaian","Tanda pertidaksamaannya tidak berubah saat kedua ruas dibagi 3"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,true,true],"grading_mode":"proportional"}},
  {"topik":"D-09","bloom":4,"type":"mcq_multi","prompt":"Pilih semua nilai x yang memenuhi x + 4 ≥ 9.","opsi":{"choices":["5","6","4","10"]},"kunci":["5","6","10"]},
  {"topik":"D-09","bloom":4,"type":"true_false","prompt":"Persamaan linear satu variabel memiliki tepat satu penyelesaian.","opsi":null,"kunci":"true"},
  {"topik":"D-09","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyelesaikan -2x > 6 dan menjawab x > -3. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Tanda harus dibalik saat kedua ruas dibagi bilangan negatif","Jawaban yang benar x < -3","x = -4 memenuhi pertidaksamaan itu"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-09","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyelesaikan 4x = 20 dengan mengurangi 4 dari kedua ruas. Nilai setiap pernyataan berikut.","opsi":{"statements":["Caranya tepat","Yang tepat adalah membagi kedua ruas dengan 4","Penyelesaiannya x = 5","Langkahnya menghasilkan 4x − 4 = 16"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-09","bloom":5,"type":"true_false","prompt":"Menambahkan bilangan yang sama pada kedua ruas persamaan tidak mengubah penyelesaiannya.","opsi":null,"kunci":"true"},
  {"topik":"D-09","bloom":5,"type":"short_answer","prompt":"Berapa nilai x yang memenuhi 5x − 3 = 22?","opsi":null,"kunci":["5"]},
  {"topik":"D-09","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun persamaan yang penyelesaiannya x = 4. Nilai setiap usulannya.","opsi":{"statements":["2x = 8","x + 6 = 10","3x − 1 = 12","x − 4 = 0"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-09","bloom":6,"type":"true_false","prompt":"Penyelesaian sebuah pertidaksamaan linear satu variabel umumnya berupa rentang nilai, bukan satu nilai tunggal.","opsi":null,"kunci":"true"},
  {"topik":"D-09","bloom":6,"type":"short_answer","prompt":"Tuliskan bilangan bulat terkecil yang memenuhi x > 7.","opsi":null,"kunci":["8"]},
  {"topik":"D-09","bloom":6,"type":"short_answer","prompt":"Berapa nilai x yang memenuhi x/3 + 2 = 6?","opsi":null,"kunci":["12"]},

  {"topik":"D-10","bloom":4,"type":"statement_grid","prompt":"Dua segitiga sebangun dengan faktor skala 2. Nilai setiap pernyataan berikut.","opsi":{"statements":["Sisi-sisi bersesuaiannya berbanding 1 : 2","Sudut-sudutnya sama besar","Luasnya berbanding 1 : 2","Kelilingnya berbanding 1 : 2"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-10","bloom":4,"type":"statement_grid","prompt":"Dua bangun dinyatakan kongruen. Nilai setiap pernyataan berikut.","opsi":{"statements":["Bentuk dan ukurannya sama","Keduanya pasti sebangun","Faktor skalanya 1","Ukurannya boleh berbeda"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-10","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar tentang dua segitiga yang sebangun.","opsi":{"choices":["sudut bersesuaiannya sama besar","sisi bersesuaiannya sebanding","luasnya selalu sama","keduanya belum tentu kongruen"]},"kunci":["sudut bersesuaiannya sama besar","sisi bersesuaiannya sebanding","keduanya belum tentu kongruen"]},
  {"topik":"D-10","bloom":4,"type":"true_false","prompt":"Setiap dua persegi selalu sebangun satu sama lain.","opsi":null,"kunci":"true"},
  {"topik":"D-10","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan dua persegi panjang pasti sebangun. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Sudut-sudutnya memang sama besar","Perbandingan sisinya belum tentu sama","Persegi panjang 2×3 dan 4×6 sebangun"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-10","bloom":5,"type":"statement_grid","prompt":"Dua segitiga sebangun berskala 3 : 1, dan seorang siswa menyimpulkan luasnya 3 kali lipat. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Luasnya 9 kali lipat","Perbandingan luas sama dengan kuadrat perbandingan sisinya","Kelilingnya 3 kali lipat"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-10","bloom":5,"type":"true_false","prompt":"Dua bangun yang kongruen pasti memiliki luas yang sama.","opsi":null,"kunci":"true"},
  {"topik":"D-10","bloom":5,"type":"short_answer","prompt":"Dua segitiga sebangun dengan perbandingan sisi 2 : 5. Jika sisi terkecil segitiga pertama 6 cm, berapa cm sisi yang bersesuaian pada segitiga kedua?","opsi":null,"kunci":["15"]},
  {"topik":"D-10","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh dua bangun yang sebangun tetapi tidak kongruen. Nilai setiap usulannya.","opsi":{"statements":["Dua persegi bersisi 2 cm dan 5 cm","Dua lingkaran berjari-jari berbeda","Dua segitiga sama sisi bersisi sama","Persegi panjang 2×3 dan 4×5"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-10","bloom":6,"type":"true_false","prompt":"Setiap dua bangun yang kongruen juga sebangun.","opsi":null,"kunci":"true"},
  {"topik":"D-10","bloom":6,"type":"short_answer","prompt":"Dua bangun sebangun dengan perbandingan sisi 1 : 4. Tuliskan perbandingan luasnya dalam bentuk a : b.","opsi":null,"kunci":["1 : 16","1:16"]},
  {"topik":"D-10","bloom":6,"type":"short_answer","prompt":"Sebuah foto berukuran 4 cm × 6 cm diperbesar sebangun hingga lebarnya 12 cm. Berapa cm panjangnya?","opsi":null,"kunci":["18"]},

  {"topik":"D-11","bloom":4,"type":"statement_grid","prompt":"Perhatikan jaring-jaring kubus. Nilai setiap pernyataan berikut.","opsi":{"statements":["Terdiri atas 6 persegi","Ada 11 jaring-jaring kubus yang berbeda","Setiap susunan 6 persegi pasti jaring-jaring kubus","Kubus memiliki 12 rusuk"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-11","bloom":4,"type":"statement_grid","prompt":"Perhatikan jaring-jaring balok. Nilai setiap pernyataan berikut.","opsi":{"statements":["Terdiri atas 6 persegi panjang","Sisi yang berhadapan sama besar","Balok memiliki 8 titik sudut","Semua sisinya berbentuk persegi"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-11","bloom":4,"type":"mcq_multi","prompt":"Sebuah jaring-jaring terdiri atas dua segitiga dan tiga persegi panjang. Pilih semua pernyataan yang benar tentangnya.","opsi":{"choices":["jaring-jaring itu milik prisma segitiga","bangun ruangnya memiliki 9 rusuk","bangun ruangnya memiliki 5 sisi","jaring-jaring itu milik limas segitiga"]},"kunci":["jaring-jaring itu milik prisma segitiga","bangun ruangnya memiliki 9 rusuk","bangun ruangnya memiliki 5 sisi"]},
  {"topik":"D-11","bloom":4,"type":"true_false","prompt":"Jaring-jaring limas segiempat memuat empat segitiga dan satu segiempat.","opsi":null,"kunci":"true"},
  {"topik":"D-11","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan setiap susunan enam persegi dapat dilipat menjadi kubus. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Hanya 11 susunan yang bisa dilipat menjadi kubus","Susunan yang sisinya saling bertumpuk tidak bisa","Banyak perseginya memang harus enam"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-11","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menghitung luas permukaan kubus berusuk 5 cm dan menjawab 125 cm². Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Ia menghitung volumenya","Jawaban yang benar 150 cm²","Luas permukaan kubus adalah enam kali luas satu sisinya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-11","bloom":5,"type":"true_false","prompt":"Luas permukaan sebuah bangun ruang sama dengan luas jaring-jaringnya.","opsi":null,"kunci":"true"},
  {"topik":"D-11","bloom":5,"type":"short_answer","prompt":"Berapa cm² luas permukaan kubus yang panjang rusuknya 4 cm?","opsi":null,"kunci":["96"]},
  {"topik":"D-11","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyebut bangun ruang yang jaring-jaringnya memuat lingkaran. Nilai setiap usulannya.","opsi":{"statements":["Tabung","Kerucut","Balok","Limas segitiga"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,false],"grading_mode":"proportional"}},
  {"topik":"D-11","bloom":6,"type":"true_false","prompt":"Sebuah bangun ruang dapat memiliki lebih dari satu bentuk jaring-jaring.","opsi":null,"kunci":"true"},
  {"topik":"D-11","bloom":6,"type":"short_answer","prompt":"Berapa banyak rusuk pada sebuah balok?","opsi":null,"kunci":["12"]},
  {"topik":"D-11","bloom":6,"type":"short_answer","prompt":"Selain satu lingkaran, jaring-jaring kerucut terdiri atas satu bangun apa?","opsi":null,"kunci":["juring","juring lingkaran"]}
]
$b2$) loop
    perform sisip_butir_ujian(v_butir, v_penulis);
  end loop;
end;
$$;

do $$
declare
  v_penulis uuid;
  v_butir jsonb;
begin
  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in select * from jsonb_array_elements($b3$
[
  {"topik":"D-12","bloom":4,"type":"statement_grid","prompt":"Sebuah segitiga siku-siku memiliki sisi siku-siku 6 cm dan 8 cm. Nilai setiap pernyataan berikut.","opsi":{"statements":["Sisi miringnya 10 cm","6² + 8² sama dengan 100","Sisi miringnya 14 cm","Sisi miring adalah sisi terpanjangnya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-12","bloom":4,"type":"statement_grid","prompt":"Perhatikan segitiga dengan panjang sisi 5, 12, dan 13. Nilai setiap pernyataan berikut.","opsi":{"statements":["Segitiga itu siku-siku","Sisi 13 adalah sisi miringnya","5² + 12² sama dengan 169","Luasnya 60 satuan luas"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-12","bloom":4,"type":"mcq_multi","prompt":"Pilih semua kelompok panjang sisi yang membentuk segitiga siku-siku.","opsi":{"choices":["3, 4, 5","6, 8, 10","5, 6, 7","9, 12, 15"]},"kunci":["3, 4, 5","6, 8, 10","9, 12, 15"]},
  {"topik":"D-12","bloom":4,"type":"true_false","prompt":"Pada segitiga siku-siku, sisi miring selalu merupakan sisi terpanjang.","opsi":null,"kunci":"true"},
  {"topik":"D-12","bloom":5,"type":"statement_grid","prompt":"Seorang siswa mencari sisi miring dari sisi siku-siku 9 dan 12, lalu menjawab 21. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Ia menjumlahkan kedua sisinya","Jawaban yang benar 15","9² + 12² sama dengan 225"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-12","bloom":5,"type":"statement_grid","prompt":"Seorang siswa memakai teorema Pythagoras pada segitiga yang ketiga sudutnya 60°. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penggunaannya tepat","Teorema itu hanya berlaku untuk segitiga siku-siku","Segitiga itu segitiga sama sisi","Segitiga itu memiliki sudut 90°"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-12","bloom":5,"type":"true_false","prompt":"Jika a² + b² = c², maka segitiga dengan panjang sisi a, b, dan c adalah segitiga siku-siku.","opsi":null,"kunci":"true"},
  {"topik":"D-12","bloom":5,"type":"short_answer","prompt":"Berapa cm panjang sisi miring segitiga siku-siku dengan sisi siku-siku 8 cm dan 15 cm?","opsi":null,"kunci":["17"]},
  {"topik":"D-12","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun tripel Pythagoras baru dari 3, 4, 5. Nilai setiap usulannya.","opsi":{"statements":["6, 8, 10","9, 12, 15","4, 5, 6","30, 40, 50"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-12","bloom":6,"type":"true_false","prompt":"Setiap kelipatan sebuah tripel Pythagoras juga merupakan tripel Pythagoras.","opsi":null,"kunci":"true"},
  {"topik":"D-12","bloom":6,"type":"short_answer","prompt":"Sebuah tangga sepanjang 13 m bersandar pada dinding dengan kaki 5 m dari dinding. Berapa meter tinggi dinding yang dicapainya?","opsi":null,"kunci":["12"]},
  {"topik":"D-12","bloom":6,"type":"short_answer","prompt":"Dua sisi siku-siku sebuah segitiga adalah 7 dan 24. Berapa panjang sisi miringnya?","opsi":null,"kunci":["25"]},

  {"topik":"D-13","bloom":4,"type":"statement_grid","prompt":"Perhatikan titik A(3, -2). Nilai setiap pernyataan berikut.","opsi":{"statements":["Absisnya 3","Ordinatnya -2","Titik itu di kuadran IV","Titik itu di kuadran II"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-13","bloom":4,"type":"statement_grid","prompt":"Perhatikan relasi {(1,2), (2,4), (3,6)}. Nilai setiap pernyataan berikut.","opsi":{"statements":["Relasi itu sebuah fungsi","Setiap anggota daerah asalnya punya tepat satu pasangan","Aturannya dapat ditulis y = 2x","Daerah asalnya {2, 4, 6}"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-13","bloom":4,"type":"mcq_multi","prompt":"Pilih semua titik yang terletak pada sumbu X.","opsi":{"choices":["(4, 0)","(0, 5)","(-3, 0)","(0, 0)"]},"kunci":["(4, 0)","(-3, 0)","(0, 0)"]},
  {"topik":"D-13","bloom":4,"type":"true_false","prompt":"Sebuah relasi disebut fungsi jika setiap anggota daerah asalnya dipasangkan tepat satu kali.","opsi":null,"kunci":"true"},
  {"topik":"D-13","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyebut {(1,2), (1,3)} sebagai fungsi. Nilai setiap pernyataan berikut.","opsi":{"statements":["Pernyataannya benar","Angka 1 dipasangkan dua kali","Himpunan itu tetap sebuah relasi","Fungsi boleh memasangkan satu anggota domain ke dua nilai"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-13","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menempatkan titik (-2, 5) di kuadran IV. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penempatannya benar","Absis negatif dengan ordinat positif berarti kuadran II","Kuadran IV memuat absis positif dengan ordinat negatif","Titik itu sebenarnya di kuadran II"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-13","bloom":5,"type":"true_false","prompt":"Titik (0, 0) pada bidang koordinat disebut titik asal.","opsi":null,"kunci":"true"},
  {"topik":"D-13","bloom":5,"type":"short_answer","prompt":"Untuk f(x) = 3x − 1, berapa nilai f(4)?","opsi":null,"kunci":["11"]},
  {"topik":"D-13","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh relasi yang BUKAN fungsi. Nilai setiap usulannya.","opsi":{"statements":["{(1,2), (1,5)}","{(2,3), (3,3)}","{(4,1), (4,2), (5,7)}","{(0,0), (1,1)}"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-13","bloom":6,"type":"true_false","prompt":"Dua anggota daerah asal yang berbeda boleh memiliki bayangan yang sama pada sebuah fungsi.","opsi":null,"kunci":"true"},
  {"topik":"D-13","bloom":6,"type":"short_answer","prompt":"Untuk f(x) = 2x + 5, berapa nilai x jika f(x) = 17?","opsi":null,"kunci":["6"]},
  {"topik":"D-13","bloom":6,"type":"short_answer","prompt":"Titik (-4, -1) terletak di kuadran ke berapa? Tulis dengan angka Romawi.","opsi":null,"kunci":["III"]},

  {"topik":"D-14","bloom":4,"type":"statement_grid","prompt":"Perhatikan sistem x + y = 9 dan x − y = 3. Nilai setiap pernyataan berikut.","opsi":{"statements":["Penyelesaiannya x = 6 dan y = 3","Sistem itu dapat diselesaikan dengan eliminasi","Sistem itu memuat dua variabel","Penyelesaiannya tak berhingga banyak"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-14","bloom":4,"type":"statement_grid","prompt":"Perhatikan sistem 2x + y = 7 dan y = 3. Nilai setiap pernyataan berikut.","opsi":{"statements":["Nilai x-nya 2","Substitusi adalah cara yang paling mudah di sini","Nilai x-nya 5","Titik penyelesaiannya (2, 3)"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-14","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pasangan (x, y) yang memenuhi x + 2y = 8.","opsi":{"choices":["(2, 3)","(4, 2)","(0, 4)","(8, 1)"]},"kunci":["(2, 3)","(4, 2)","(0, 4)"]},
  {"topik":"D-14","bloom":4,"type":"true_false","prompt":"SPLDV terdiri atas dua persamaan linear dengan dua variabel.","opsi":null,"kunci":"true"},
  {"topik":"D-14","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyelesaikan x + y = 5 dan 2x + 2y = 10, lalu menjawab bahwa penyelesaiannya tepat satu. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Kedua persamaannya setara","Penyelesaiannya tak berhingga banyak","Grafik kedua persamaannya berimpit"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-14","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menjumlahkan x + y = 8 dengan x − y = 2 dan menulis 2x = 10. Nilai setiap pernyataan berikut.","opsi":{"statements":["Langkahnya benar","Variabel y hilang karena tandanya berlawanan","Nilai x-nya 5","Cara itu disebut substitusi"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-14","bloom":5,"type":"true_false","prompt":"Sebuah SPLDV yang grafiknya berupa dua garis sejajar tidak memiliki penyelesaian.","opsi":null,"kunci":"true"},
  {"topik":"D-14","bloom":5,"type":"short_answer","prompt":"Untuk x + y = 12 dan x − y = 4, berapa nilai x?","opsi":null,"kunci":["8"]},
  {"topik":"D-14","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun SPLDV yang penyelesaiannya (3, 1). Nilai setiap usulannya.","opsi":{"statements":["x + y = 4 dan x − y = 2","2x + y = 7 dan x + y = 4","x + y = 5 dan x − y = 2","3x + y = 10 dan x = 3"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-14","bloom":6,"type":"true_false","prompt":"Sebuah SPLDV dapat memiliki tepat dua penyelesaian.","opsi":null,"kunci":"false"},
  {"topik":"D-14","bloom":6,"type":"short_answer","prompt":"Harga 2 pensil dan 1 buku Rp8.000, sedangkan harga 1 pensil Rp1.500. Berapa rupiah harga 1 buku? Tulis angkanya saja tanpa titik.","opsi":null,"kunci":["5000"]},
  {"topik":"D-14","bloom":6,"type":"short_answer","prompt":"Untuk 2x + y = 9 dan y = x, berapa nilai x?","opsi":null,"kunci":["3"]},

  {"topik":"D-15","bloom":4,"type":"statement_grid","prompt":"Perhatikan barisan 3, 7, 11, 15. Nilai setiap pernyataan berikut.","opsi":{"statements":["Bedanya 4","Barisan itu aritmetika","Suku kelimanya 19","Suku pertamanya 4"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-15","bloom":4,"type":"statement_grid","prompt":"Perhatikan barisan 2, 6, 18, 54. Nilai setiap pernyataan berikut.","opsi":{"statements":["Rasionya 3","Barisan itu geometri","Suku kelimanya 162","Selisih dua suku berurutannya tetap"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-15","bloom":4,"type":"mcq_multi","prompt":"Pilih semua barisan yang merupakan barisan aritmetika.","opsi":{"choices":["5, 8, 11, 14","2, 4, 8, 16","10, 7, 4, 1","1, 1, 1, 1"]},"kunci":["5, 8, 11, 14","10, 7, 4, 1","1, 1, 1, 1"]},
  {"topik":"D-15","bloom":4,"type":"true_false","prompt":"Barisan aritmetika memiliki selisih dua suku berurutan yang tetap.","opsi":null,"kunci":"true"},
  {"topik":"D-15","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyebut 1, 4, 9, 16 sebagai barisan aritmetika. Nilai setiap pernyataan berikut.","opsi":{"statements":["Pernyataannya benar","Selisihnya 3, 5, 7 sehingga tidak tetap","Suku-sukunya adalah kuadrat bilangan asli","Barisan itu geometri"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-15","bloom":5,"type":"statement_grid","prompt":"Seorang siswa mencari suku ke-10 barisan 2, 5, 8, ... dan menjawab 32. Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Rumus suku ke-n barisan aritmetika adalah a + (n − 1)b","Jawaban yang benar 29","Bedanya 3"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-15","bloom":5,"type":"true_false","prompt":"Pada barisan geometri, hasil bagi dua suku berurutan selalu tetap.","opsi":null,"kunci":"true"},
  {"topik":"D-15","bloom":5,"type":"short_answer","prompt":"Berapa suku ke-8 barisan aritmetika 4, 9, 14, ...?","opsi":null,"kunci":["39"]},
  {"topik":"D-15","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyusun barisan aritmetika dengan suku pertama 6 dan beda -2. Nilai setiap usulannya.","opsi":{"statements":["6, 4, 2, 0","6, 8, 10, 12","6, 4, 1, -2","6, 4, 2, -2"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,false,false],"grading_mode":"proportional"}},
  {"topik":"D-15","bloom":6,"type":"true_false","prompt":"Barisan yang setiap sukunya bernilai sama dan bukan nol sekaligus merupakan barisan aritmetika dan barisan geometri.","opsi":null,"kunci":"true"},
  {"topik":"D-15","bloom":6,"type":"short_answer","prompt":"Berapa jumlah sepuluh suku pertama barisan 1, 2, 3, ...?","opsi":null,"kunci":["55"]},
  {"topik":"D-15","bloom":6,"type":"short_answer","prompt":"Berapa suku ke-5 barisan geometri 3, 6, 12, ...?","opsi":null,"kunci":["48"]},

  {"topik":"D-16","bloom":4,"type":"statement_grid","prompt":"Titik A(2, 3) ditranslasikan sejauh (4, -1). Nilai setiap pernyataan berikut.","opsi":{"statements":["Bayangannya (6, 2)","Bentuk bangunnya tidak berubah","Bayangannya (6, 4)","Ukurannya tetap"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-16","bloom":4,"type":"statement_grid","prompt":"Titik B(3, 5) dicerminkan terhadap sumbu X. Nilai setiap pernyataan berikut.","opsi":{"statements":["Bayangannya (3, -5)","Absisnya tetap","Bayangannya (-3, 5)","Jaraknya ke sumbu X tidak berubah"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-16","bloom":4,"type":"mcq_multi","prompt":"Pilih semua transformasi yang tidak mengubah ukuran bangun.","opsi":{"choices":["translasi","refleksi","rotasi","dilatasi dengan faktor 2"]},"kunci":["translasi","refleksi","rotasi"]},
  {"topik":"D-16","bloom":4,"type":"true_false","prompt":"Rotasi 90° searah jarum jam memetakan titik (1, 0) ke titik (0, -1).","opsi":null,"kunci":"true"},
  {"topik":"D-16","bloom":5,"type":"statement_grid","prompt":"Seorang siswa mencerminkan (4, -2) terhadap sumbu Y dan menjawab (4, 2). Nilai setiap pernyataan berikut.","opsi":{"statements":["Jawabannya benar","Ia sebenarnya mencerminkan terhadap sumbu X","Jawaban yang benar (-4, -2)","Pencerminan terhadap sumbu Y mengubah tanda absisnya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-16","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyebut dilatasi dengan faktor 3 tidak mengubah luas bangun. Nilai setiap pernyataan berikut.","opsi":{"statements":["Pernyataannya benar","Luasnya menjadi sembilan kali","Panjang sisinya menjadi tiga kali","Bayangannya tetap sebangun dengan bangun aslinya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-16","bloom":5,"type":"true_false","prompt":"Translasi memindahkan setiap titik pada bangun dengan arah dan jarak yang sama.","opsi":null,"kunci":"true"},
  {"topik":"D-16","bloom":5,"type":"short_answer","prompt":"Titik (5, -3) ditranslasikan sejauh (-2, 4). Tuliskan bayangannya dalam bentuk (a, b).","opsi":null,"kunci":["(3, 1)","(3,1)"]},
  {"topik":"D-16","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta menyebut transformasi yang bayangannya kongruen dengan bangun aslinya. Nilai setiap usulannya.","opsi":{"statements":["Translasi","Refleksi","Rotasi","Dilatasi dengan faktor 0,5"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-16","bloom":6,"type":"true_false","prompt":"Dilatasi dengan faktor skala 1 menghasilkan bayangan yang berimpit dengan bangun aslinya.","opsi":null,"kunci":"true"},
  {"topik":"D-16","bloom":6,"type":"short_answer","prompt":"Titik (2, 7) dicerminkan terhadap titik asal. Tuliskan bayangannya dalam bentuk (a, b).","opsi":null,"kunci":["(-2, -7)","(-2,-7)"]},
  {"topik":"D-16","bloom":6,"type":"short_answer","prompt":"Sebuah persegi berluas 16 satuan didilatasi dengan faktor 2. Berapa luas bayangannya?","opsi":null,"kunci":["64"]}
]
$b3$) loop
    perform sisip_butir_ujian(v_butir, v_penulis);
  end loop;
end;
$$;

do $$
declare
  v_penulis uuid;
  v_butir jsonb;
  v_topik text;
begin
  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in select * from jsonb_array_elements($b4$
[
  {"topik":"D-17","bloom":4,"type":"statement_grid","prompt":"Sebuah juring pada lingkaran berjari-jari 7 cm memiliki sudut pusat 90°. Gunakan π = 22/7. Nilai setiap pernyataan berikut.","opsi":{"statements":["Luasnya seperempat luas lingkaran","Luas lingkarannya 154 cm²","Luas juringnya 38,5 cm²","Panjang busurnya sama dengan keliling lingkaran"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-17","bloom":4,"type":"statement_grid","prompt":"Sebuah bangun gabungan terdiri atas balok 2 × 3 × 4 dan kubus berusuk 2 yang menempel di sisinya. Nilai setiap pernyataan berikut.","opsi":{"statements":["Volume baloknya 24","Volume kubusnya 8","Volume gabungannya 32","Volume gabungannya 192"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-17","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar tentang lingkaran berjari-jari 10 cm.","opsi":{"choices":["diameternya 20 cm","kelilingnya 2 × π × 10","luasnya π × 100","luasnya 2 × π × 10"]},"kunci":["diameternya 20 cm","kelilingnya 2 × π × 10","luasnya π × 100"]},
  {"topik":"D-17","bloom":4,"type":"true_false","prompt":"Luas sebuah juring sebanding dengan besar sudut pusatnya.","opsi":null,"kunci":"true"},
  {"topik":"D-17","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menghitung luas juring bersudut pusat 60° dengan mengalikan luas lingkaran dengan 60/180. Nilai setiap pernyataan berikut.","opsi":{"statements":["Caranya benar","Pecahan yang tepat adalah 60/360","Pada lingkaran berjari-jari 6, luas lingkarannya 36π","Pada lingkaran berjari-jari 6, luas juringnya 6π"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-17","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menjumlahkan volume dua bangun ruang yang sebagian saling berimpit. Nilai setiap pernyataan berikut.","opsi":{"statements":["Hasilnya pasti benar","Bagian yang berimpit ikut terhitung dua kali","Bagian yang berimpit harus dikurangkan","Volume gabungan selalu sama dengan jumlah kedua volumenya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-17","bloom":5,"type":"true_false","prompt":"Keliling sebuah bangun gabungan tidak selalu sama dengan jumlah keliling bangun-bangun penyusunnya.","opsi":null,"kunci":"true"},
  {"topik":"D-17","bloom":5,"type":"short_answer","prompt":"Berapa cm² luas juring bersudut pusat 90° pada lingkaran berjari-jari 8 cm? Gunakan π = 3,14.","opsi":null,"kunci":["50,24","50.24"]},
  {"topik":"D-17","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh bangun ruang gabungan. Nilai setiap usulannya.","opsi":{"statements":["Tabung yang berdiri di atas balok","Kerucut di atas tabung","Sebuah kubus tunggal","Limas di atas balok"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,true,false,true],"grading_mode":"proportional"}},
  {"topik":"D-17","bloom":6,"type":"true_false","prompt":"Volume gabungan dua bangun yang tidak saling berimpit sama dengan jumlah volume keduanya.","opsi":null,"kunci":"true"},
  {"topik":"D-17","bloom":6,"type":"short_answer","prompt":"Berapa cm² luas lingkaran berjari-jari 7 cm? Gunakan π = 22/7.","opsi":null,"kunci":["154"]},
  {"topik":"D-17","bloom":6,"type":"short_answer","prompt":"Sebuah taman berbentuk persegi bersisi 10 m memuat kolam berbentuk persegi bersisi 4 m. Berapa m² luas taman di luar kolam?","opsi":null,"kunci":["84"]},

  {"topik":"D-18","bloom":4,"type":"statement_grid","prompt":"Kelompok A memiliki rata-rata 70 dengan jangkauan 10; kelompok B rata-rata 70 dengan jangkauan 30. Nilai setiap pernyataan berikut.","opsi":{"statements":["Rata-rata keduanya sama","Nilai kelompok B lebih menyebar","Kelompok A lebih seragam","Kelompok B pasti memuat nilai tertinggi di antara keduanya"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-18","bloom":4,"type":"statement_grid","prompt":"Kelompok X memiliki median 60 dan kelompok Y median 75. Nilai setiap pernyataan berikut.","opsi":{"statements":["Nilai tengah kelompok Y lebih tinggi","Setiap anggota Y bernilai lebih tinggi daripada anggota X","Median tidak mudah terpengaruh nilai ekstrem","Membandingkan median masuk akal untuk membandingkan kedua kelompok"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,false,true,true],"grading_mode":"proportional"}},
  {"topik":"D-18","bloom":4,"type":"mcq_multi","prompt":"Pilih semua ukuran yang menggambarkan penyebaran data.","opsi":{"choices":["jangkauan","median","simpangan","selisih kuartil"]},"kunci":["jangkauan","simpangan","selisih kuartil"]},
  {"topik":"D-18","bloom":4,"type":"true_false","prompt":"Dua kelompok data dengan rata-rata yang sama bisa memiliki sebaran yang sangat berbeda.","opsi":null,"kunci":"true"},
  {"topik":"D-18","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyimpulkan kelompok yang rata-ratanya lebih tinggi pasti lebih baik. Nilai setiap pernyataan berikut.","opsi":{"statements":["Kesimpulannya benar","Sebaran datanya juga perlu dilihat","Rata-rata bisa terangkat oleh satu nilai ekstrem","Median dapat memberi gambaran yang berbeda"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-18","bloom":5,"type":"statement_grid","prompt":"Kelompok P berisi 5, 5, 5, 5, 20 dan kelompok Q berisi 8, 8, 8, 8, 8. Nilai setiap pernyataan berikut.","opsi":{"statements":["Rata-rata P adalah 8","Rata-rata Q adalah 8","Rata-rata keduanya sama","Kelompok P lebih seragam daripada Q"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-18","bloom":5,"type":"true_false","prompt":"Jangkauan hanya memakai nilai terbesar dan terkecil sehingga mengabaikan sebaran di antara keduanya.","opsi":null,"kunci":"true"},
  {"topik":"D-18","bloom":5,"type":"short_answer","prompt":"Berapa jangkauan data 4, 6, 8, 10?","opsi":null,"kunci":["6"]},
  {"topik":"D-18","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memilih ukuran yang tepat untuk membandingkan dua kelompok, salah satunya memuat nilai ekstrem. Nilai setiap usulannya.","opsi":{"statements":["Median","Rata-rata","Selisih kuartil","Nilai tertinggi saja"],"answer_labels":["Tepat","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-18","bloom":6,"type":"true_false","prompt":"Menambahkan satu nilai yang sangat besar pada sebuah kelompok akan memperbesar jangkauannya.","opsi":null,"kunci":"true"},
  {"topik":"D-18","bloom":6,"type":"short_answer","prompt":"Kelompok A memiliki rata-rata 70 dan kelompok B rata-rata 82. Berapa selisih rata-ratanya?","opsi":null,"kunci":["12"]},
  {"topik":"D-18","bloom":6,"type":"short_answer","prompt":"Pada data 12, 15, 15, 18, 30, ukuran pemusatan mana yang paling terpengaruh oleh nilai 30: rata-rata atau median?","opsi":null,"kunci":["rata-rata"]},

  {"topik":"D-19","bloom":4,"type":"statement_grid","prompt":"Sebuah dadu bersisi 6 dilempar satu kali. Nilai setiap pernyataan berikut.","opsi":{"statements":["Peluang muncul mata 3 adalah 1/6","Peluang muncul mata genap adalah 1/2","Peluang muncul mata lebih dari 6 adalah 0","Peluang muncul mata kurang dari 7 adalah 0"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-19","bloom":4,"type":"statement_grid","prompt":"Sebuah kantong berisi 3 bola merah dan 7 bola putih. Nilai setiap pernyataan berikut.","opsi":{"statements":["Peluang terambil bola merah 3/10","Peluang terambil bola putih 7/10","Jumlah kedua peluangnya 1","Peluang terambil bola merah 3/7"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-19","bloom":4,"type":"mcq_multi","prompt":"Pilih semua pernyataan yang benar tentang peluang sebuah kejadian.","opsi":{"choices":["nilainya antara 0 dan 1","peluang 0 berarti mustahil","peluang 1 berarti pasti terjadi","nilainya bisa lebih dari 1"]},"kunci":["nilainya antara 0 dan 1","peluang 0 berarti mustahil","peluang 1 berarti pasti terjadi"]},
  {"topik":"D-19","bloom":4,"type":"true_false","prompt":"Frekuensi relatif dihitung dari hasil percobaan yang benar-benar dilakukan, bukan dari perhitungan teoretis.","opsi":null,"kunci":"true"},
  {"topik":"D-19","bloom":5,"type":"statement_grid","prompt":"Seorang siswa melempar koin 10 kali, muncul 7 angka, lalu menyimpulkan peluang munculnya angka adalah 7/10. Nilai setiap pernyataan berikut.","opsi":{"statements":["Angka 7/10 itu frekuensi relatifnya","Peluang teoretisnya 1/2","Frekuensi relatif mendekati peluang teoretis jika percobaannya diperbanyak","Peluang teoretis koin berubah menjadi 7/10"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[true,true,true,false],"grading_mode":"proportional"}},
  {"topik":"D-19","bloom":5,"type":"statement_grid","prompt":"Seorang siswa menyebut peluang muncul mata 7 pada dadu bersisi 6 adalah 1/7. Nilai setiap pernyataan berikut.","opsi":{"statements":["Pernyataannya benar","Kejadian itu mustahil","Peluangnya 0","Ruang sampelnya berisi enam hasil"],"answer_labels":["Benar","Salah"],"statement_label":"Pernyataan"},"kunci":{"answers":[false,true,true,true],"grading_mode":"proportional"}},
  {"topik":"D-19","bloom":5,"type":"true_false","prompt":"Jumlah peluang seluruh kejadian dalam satu ruang sampel adalah 1.","opsi":null,"kunci":"true"},
  {"topik":"D-19","bloom":5,"type":"short_answer","prompt":"Sebuah kantong berisi 4 bola merah dan 6 bola biru. Berapa peluang terambil bola biru? Tulis dalam pecahan paling sederhana.","opsi":null,"kunci":["3/5"]},
  {"topik":"D-19","bloom":6,"type":"statement_grid","prompt":"Seorang siswa diminta memberi contoh kejadian yang peluangnya 1. Nilai setiap usulannya.","opsi":{"statements":["Muncul mata kurang dari 7 pada dadu bersisi 6","Muncul mata 7 pada dadu bersisi 6","Terambil bola merah dari kantong yang seluruhnya bola merah","Muncul gambar pada pelemparan sebuah koin"],"answer_labels":["Memenuhi","Tidak"],"statement_label":"Usulan"},"kunci":{"answers":[true,false,true,false],"grading_mode":"proportional"}},
  {"topik":"D-19","bloom":6,"type":"true_false","prompt":"Semakin banyak percobaan dilakukan, frekuensi relatif cenderung mendekati peluang teoretisnya.","opsi":null,"kunci":"true"},
  {"topik":"D-19","bloom":6,"type":"short_answer","prompt":"Sebuah dadu bersisi 6 dilempar. Berapa peluang muncul mata ganjil? Tulis dalam pecahan paling sederhana.","opsi":null,"kunci":["1/2"]},
  {"topik":"D-19","bloom":6,"type":"short_answer","prompt":"Dari 200 pelemparan koin, gambar muncul 90 kali. Berapa frekuensi relatif munculnya gambar? Tulis dalam bentuk desimal.","opsi":null,"kunci":["0,45","0.45"]}
]
$b4$) loop
    perform sisip_butir_ujian(v_butir, v_penulis);
  end loop;

  -- Paket disusun ulang. `semai_paket_topik` melewati paket yang sudah punya
  -- sesi, jadi D-02, D-03, D-04, dan D-08 tidak berubah — lihat catatan di
  -- kepala berkas.
  foreach v_topik in array array['D-01','D-02','D-03','D-04','D-05','D-06','D-07','D-08','D-09','D-10','D-11','D-12','D-13','D-14','D-15','D-16','D-17','D-18','D-19'] loop
    perform semai_paket_topik(v_topik);
  end loop;
end;
$$;

-- Perancahnya dibongkar lagi, sama seperti di 171: sebuah fungsi penyisip
-- butir yang tertinggal hidup di produksi adalah undangan untuk memakainya
-- lagi di luar migrasi.
drop function if exists sisip_butir_ujian(jsonb, uuid);

notify pgrst, 'reload schema';
