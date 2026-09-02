-- ============================================================
-- Kolam probe D-01, dan teks framing yang tidak lagi penampung
--
-- Migrasi 164 membangun seluruh mesin retest lalu berhenti di depan satu hal
-- yang bukan pekerjaan skema: butirnya. Tanpa `item_probe` yang berisi,
-- `retest_buka_sesi` dan `pemanasan_buka_sesi` selalu memulangkan null, dan
-- FR11 beserta FR12 berdiri lengkap tanpa pernah bisa dijalankan sekali pun.
--
-- SEPULUH BUTIR, bukan lima. Satu probe mengambil 3-5 butir dan mendahulukan
-- yang paling lama tidak dilihat; dengan kolam persis lima, retest kedua
-- seorang murid mengulang butir yang sama persis dan berhenti mengukur apa pun
-- selain ingatan. Sepuluh memberi dua putaran yang benar-benar berbeda sebelum
-- rotasinya berputar — cukup untuk pilot, dan pantas ditambah begitu retest
-- ketiga jadi kemungkinan nyata.
--
-- C2-C3 SAJA (Retest Terjadwal Bagian 3). C1 tidak diprobe karena mengingat
-- fakta bukan yang lapuk lebih dulu; yang lapuk adalah kemampuan menjelaskan
-- hubungannya dan menerapkannya. Bukan pula C4 ke atas — probe harus singkat,
-- dan soal yang menuntut penggabungan dua konsep membuat kegagalannya ambigu:
-- tidak jelas apakah yang goyah D-01 atau kemampuan menganalisisnya.
--
-- KOLAM KETIGA YANG BENAR-BENAR TERPISAH. Trigger di migrasi 164 sudah menolak
-- butir yang jadi anggota paket topik, dan kolom `peruntukan` di bawah membuat
-- pemisahan itu terbaca tanpa menelusuri keanggotaan. Alasannya sama dengan
-- pemisahan latihan-ujian di migrasi 142: butir yang baru dikerjakan sebagai
-- latihan minggu lalu tidak mengukur retensi, ia mengukur ingatan minggu lalu.
--
-- DISTRAKTORNYA MISKONSEPSI, BUKAN ANGKA ACAK (Rubrik Bagian 4.1). Tiap opsi
-- salah di bawah adalah hasil yang benar-benar didapat anak yang menempuh satu
-- jalur keliru tertentu — urutan operasi yang dibalik, tanda yang diabaikan,
-- "dua minus jadi plus" yang diterapkan di tempat yang salah. Itu yang membuat
-- pola jawabannya bisa dibaca, bukan cuma benar/salahnya.
--
-- Satu butir sengaja punya jebakan yang lebih halus: pada butir tentang
-- (-9) - (-4), salah satu opsi memberi KESIMPULAN yang benar lewat alasan yang
-- keliru ("9 - 4 = 5, tinggal diberi tanda minus"). Anak yang memilihnya
-- menjawab dengan aturan hafalan yang akan gagal begitu angkanya berganti, dan
-- itu justru yang perlu terlihat di sebuah probe.
--
-- TEKS FRAMING (FR7) diisi final di Bagian 3. Migrasi 162 menaruh penampung
-- dengan catatan bahwa yang final ditulis tim konten; ini versi yang ditulis
-- untuk dipakai, bukan untuk menunggu.
--
-- Jalankan SESUDAH 164.
-- ============================================================

-- 1. Peruntukan ketiga --------------------------------------------------------
--
-- Migrasi 142 hanya mengenal 'latihan' dan 'ujian' karena probe belum ada saat
-- itu. Menambahnya di sini, bukan membiarkan probe ber-`peruntukan` null:
-- null di kolom itu sudah punya arti sendiri — "di luar cakupan pilot" — dan
-- butir probe justru di dalamnya.
alter table question_bank_items
  drop constraint if exists question_bank_items_peruntukan_check;
alter table question_bank_items
  add constraint question_bank_items_peruntukan_check
  check (peruntukan is null or peruntukan in ('latihan', 'ujian', 'probe'));

comment on column question_bank_items.peruntukan is
  'Kolam tempat butir ini ditulis: latihan, ujian, atau probe (Protokol Uji Coba Bagian 4; probe dari Retest Terjadwal Bagian 3). NULL = di luar cakupan pilot.';

-- 2. Butirnya -----------------------------------------------------------------

do $$
declare
  v_penulis uuid;
  v_id uuid;
  v_butir jsonb;
begin
  -- Idempoten lewat keadaan, bukan lewat `on conflict`: butirnya tidak punya
  -- kunci alami, jadi yang diperiksa adalah apakah kolamnya sudah terisi.
  if exists (select 1 from item_probe where topik_id = 'D-01') then
    raise notice 'Kolam probe D-01 sudah terisi — dilewati.';
    return;
  end if;

  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in
    select * from jsonb_array_elements($butir$[
      {
        "type": "mcq_single", "bloom": 2,
        "prompt": "Pada garis bilangan, jarak dari -3 ke 5 sama dengan jarak dari 0 ke ...",
        "choices": ["8", "2", "-8", "15"],
        "correct": "8",
        "why": [
          "Benar. Jarak dua bilangan adalah selisihnya tanpa memandang tanda: 5 - (-3) = 8.",
          "Salah. 2 didapat dari 5 - 3, yaitu mengabaikan tanda minus pada -3.",
          "Salah. Jarak selalu bernilai positif, karena ia panjang bukan posisi.",
          "Salah. 15 adalah hasil perkalian, bukan jarak antara kedua bilangan."
        ]
      },
      {
        "type": "mcq_single", "bloom": 2,
        "prompt": "Manakah kalimat yang paling tepat menjelaskan mengapa (-9) - (-4) = -5?",
        "choices": [
          "Mengurangi -4 sama dengan menambahkan 4, jadi -9 + 4 = -5.",
          "Karena 9 - 4 = 5, hasilnya tinggal diberi tanda minus.",
          "Karena dua tanda minus yang berdampingan selalu membuat hasilnya positif.",
          "Karena -9 dan -4 sama-sama negatif, hasilnya dijumlahkan menjadi -13."
        ],
        "correct": "Mengurangi -4 sama dengan menambahkan 4, jadi -9 + 4 = -5.",
        "why": [
          "Benar. Mengurangi sebuah bilangan sama dengan menambahkan lawannya.",
          "Salah — meski hasilnya kebetulan cocok. Aturan ini gagal begitu angkanya berganti, misalnya (-4) - (-9) yang hasilnya 5, bukan -5.",
          "Salah. Yang berubah tanda hanya bilangan yang dikurangkan, bukan seluruh hasilnya.",
          "Salah. Mengurangi bilangan negatif menambah nilainya, bukan menguranginya."
        ]
      },
      {
        "type": "mcq_single", "bloom": 2,
        "prompt": "Bentuk yang setara dengan (-8) - 5 adalah ...",
        "choices": ["(-8) + (-5)", "(-8) + 5", "8 + 5", "5 - (-8)"],
        "correct": "(-8) + (-5)",
        "why": [
          "Benar. Mengurangi 5 sama dengan menambahkan -5.",
          "Salah. Ini mengubah tanda bilangan yang dikurangkan ke arah yang keliru.",
          "Salah. Tanda pada -8 ikut hilang, padahal yang berubah hanya operasinya.",
          "Salah. Urutan pengurangan tidak boleh ditukar; hasilnya jadi 13, bukan -13."
        ]
      },
      {
        "type": "mcq_single", "bloom": 2,
        "prompt": "Sebuah kapal selam berada 40 meter di bawah permukaan laut, lalu naik 15 meter. Kalimat matematika yang tepat mewakili keadaan itu adalah ...",
        "choices": ["(-40) + 15", "(-40) - 15", "40 - 15", "(-15) + 40"],
        "correct": "(-40) + 15",
        "why": [
          "Benar. Kedalaman ditulis negatif, dan naik berarti menambah.",
          "Salah. Tanda minus di sini membuat kapal justru turun 15 meter lagi.",
          "Salah. Kedalaman 40 meter di bawah permukaan bernilai -40, bukan 40.",
          "Salah. Yang berada di bawah permukaan adalah 40 meter, bukan 15 meter."
        ]
      },
      {
        "type": "true_false", "bloom": 2,
        "prompt": "Jika a lebih kecil daripada b, maka -a pasti lebih kecil daripada -b.",
        "correct": "false",
        "why": [
          "Salah. Mengambil lawan membalik urutannya: 2 < 5, tetapi -2 > -5.",
          "Benar. Mengambil lawan sebuah bilangan membalik urutan perbandingannya."
        ]
      },
      {
        "type": "mcq_single", "bloom": 3,
        "prompt": "Hitunglah nilai dari (-9) + 4 × (-3).",
        "choices": ["-21", "15", "-3", "39"],
        "correct": "-21",
        "why": [
          "Benar. Perkalian dikerjakan lebih dulu: 4 × (-3) = -12, lalu -9 + (-12) = -21.",
          "Salah. 15 didapat dari mengerjakan penjumlahan lebih dulu: (-9 + 4) × (-3).",
          "Salah. -3 muncul kalau perkaliannya diabaikan dan hanya -9 + 4 + (-3) yang dihitung sebagian.",
          "Salah. 39 muncul kalau tanda pada -9 diabaikan saat menjumlahkan."
        ]
      },
      {
        "type": "short_answer", "bloom": 3,
        "prompt": "Hitunglah: (-30) ÷ 5 - (-4) = ...",
        "correct": "-2",
        "why": []
      },
      {
        "type": "mcq_single", "bloom": 3,
        "prompt": "Seorang pendaki berada di ketinggian 250 meter. Ia turun 380 meter menuju lembah, lalu naik lagi 95 meter. Berapa ketinggiannya sekarang?",
        "choices": ["-35 meter", "-135 meter", "35 meter", "725 meter"],
        "correct": "-35 meter",
        "why": [
          "Benar. 250 - 380 + 95 = -35, yaitu 35 meter di bawah permukaan laut.",
          "Salah. -135 didapat kalau naik 95 meter ikut dihitung sebagai turun.",
          "Salah. Tandanya hilang; hasil -35 tidak sama dengan 35 karena yang satu di bawah permukaan.",
          "Salah. 725 didapat kalau ketiga angka dijumlahkan tanpa memperhatikan arah gerakannya."
        ]
      },
      {
        "type": "mcq_single", "bloom": 3,
        "prompt": "Hitunglah nilai dari 12 - (-8) ÷ 4.",
        "choices": ["14", "5", "10", "-14"],
        "correct": "14",
        "why": [
          "Benar. Pembagian dikerjakan lebih dulu: (-8) ÷ 4 = -2, lalu 12 - (-2) = 14.",
          "Salah. 5 didapat dari mengerjakan pengurangan lebih dulu: (12 - (-8)) ÷ 4.",
          "Salah. 10 didapat kalau tanda pada -8 diabaikan: 12 - 8 ÷ 4.",
          "Salah. Tanda hasilnya terbalik; mengurangi bilangan negatif menambah nilainya."
        ]
      },
      {
        "type": "mcq_single", "bloom": 3,
        "prompt": "Saldo sebuah tabungan Rp75.000. Selama tiga hari berturut-turut diambil Rp30.000 setiap hari. Berapa saldo tabungan itu sekarang?",
        "choices": ["-Rp15.000", "Rp15.000", "-Rp45.000", "Rp45.000"],
        "correct": "-Rp15.000",
        "why": [
          "Benar. 75.000 - (3 × 30.000) = 75.000 - 90.000 = -15.000, yaitu kekurangan Rp15.000.",
          "Salah. Tandanya hilang; saldo yang kurang dari nol tidak sama dengan saldo yang tersisa.",
          "Salah. -45.000 muncul kalau pengambilannya dihitung empat hari, bukan tiga.",
          "Salah. 45.000 muncul kalau pengambilannya hanya dihitung satu hari."
        ]
      }
    ]$butir$)
  loop
    insert into question_bank_items (
      created_by, type, prompt, options, correct_answer, weight,
      bloom_level, status_verifikasi, penjelasan_per_opsi,
      elemen_proses, sumber_pembuatan, peruntukan, topik_id
    ) values (
      v_penulis,
      v_butir ->> 'type',
      v_butir ->> 'prompt',
      case when v_butir ? 'choices'
        then jsonb_build_object('choices', v_butir -> 'choices')
        else null end,
      case when (v_butir ->> 'type') = 'short_answer'
        then jsonb_build_array(v_butir ->> 'correct')
        else to_jsonb(v_butir ->> 'correct') end,
      1,
      (v_butir ->> 'bloom')::smallint,
      'aktif',
      case when jsonb_array_length(v_butir -> 'why') > 0 then (
        select jsonb_object_agg((i - 1)::text, w)
        from jsonb_array_elements_text(v_butir -> 'why') with ordinality as t(w, i)
      ) else null end,
      array['penalaran']::text[],
      'ai_generated_verified',
      'probe',
      'D-01'
    )
    returning id into v_id;

    insert into item_probe (topik_id, question_bank_item_id) values ('D-01', v_id);
  end loop;
end;
$$;

-- 3. Teks framing yang final --------------------------------------------------
--
-- Menggantikan penampung migrasi 162. Yang berubah bukan panjangnya melainkan
-- arah kalimatnya: yang lama menerangkan keadaan ("bagian ini memang belum
-- klik"), yang ini menempatkan anaknya sebagai orang yang sedang mengerjakan
-- sesuatu yang wajar sulit. Tiga syarat yang dipenuhinya, semuanya dari FR7 dan
-- dokumen fondasi Bagian 3.3:
--
--   * tidak menyebut angka, tidak menyebut "Putaran 1", dan tidak menerangkan
--     apa yang memicunya — sebuah kalimat yang menjelaskan sebabnya sama saja
--     membocorkan angka yang melarang dirinya dibocorkan;
--   * tidak menuduh dan tidak menyuruh. Tidak ada "kamu perlu", tidak ada
--     "sebaiknya kamu";
--   * menyebut bantuan sebagai sesuatu yang SUDAH berjalan, bukan sebagai
--     konsekuensi yang menanti. "Tutormu sudah tahu" adalah kabar; "tutormu
--     akan diberi tahu" adalah ancaman, meski isinya sama.
update pengaturan
   set nilai = to_jsonb('Topik ini termasuk yang butuh waktu lebih, dan itu wajar — banyak yang begitu di bagian ini. Tutormu sudah tahu dan akan menemanimu di sesi berikutnya, jadi kamu tidak perlu memecahkannya sendirian. Sekarang lanjut saja seperti biasa.'::text),
       keterangan = 'Kalimat yang dibaca murid sesudah dua paket latihan berturut-turut di bawah ambang (FR7). Framing tidak menghukum, dan TIDAK BOLEH menyebut "Putaran 1", angka apa pun, maupun sebab kemunculannya — kebijakan visibilitas skor, dokumen fondasi Bagian 3.3.'
 where kunci = 'teks_framing_eskalasi';

notify pgrst, 'reload schema';
