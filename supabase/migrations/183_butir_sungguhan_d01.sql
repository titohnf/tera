-- ============================================================
-- Butir SUNGGUHAN pertama: D-01, 24 butir C1–C3
--
-- Seluruh 1.513 butir pilot sampai hari ini adalah butir dummy — migrasi 169,
-- 171, 176, dan 178 semuanya menyatakannya di kepala berkasnya masing-masing.
-- Mesinnya sudah terbukti ujung ke ujung; isinya belum satu pun nyata. Berkas
-- ini butir pertama yang ditulis untuk dibaca anak, bukan untuk menguji kode.
--
-- KENAPA HANYA D-01. Learning Progression Bagian 2 menyatakannya sebagai
-- perintah, bukan saran: "Claude Code hanya boleh memproduksi soal untuk topik
-- berstatus AKTIF PILOT saat ini — topik lain di dokumen ini adalah peta jangka
-- panjang, bukan tugas produksi konten sekarang." Dari 67 topik, tepat satu
-- berstatus hijau: D-01.
--
-- CAKUPAN DAN JUMLAHNYA JUGA DARI DOKUMEN, bukan dikarang di sini: D-01
-- dicakup C1–C3 dengan 24 butir latihan, 8 per level. Sejak migrasi 182 angka
-- itu punya arti teknis — C1–C3 adalah rentang yang menentukan ketuntasan
-- topik ini, sedangkan paket C4–C6 yang ada tetap berdiri sebagai pengayaan.
--
-- DISTRAKTORNYA BUKAN ANGKA ACAK. Tabel Persiapan Pedagogis menyebut tiga
-- miskonsepsi khas untuk topik ini, dan setiap pilihan salah di bawah dibuat
-- dari salah satunya:
--
--   1. Magnitude ditukar dengan posisi — "-8 lebih besar daripada -3 karena
--      8 lebih besar daripada 3". Muncul di butir perbandingan dan pengurutan.
--   2. Aturan tanda disalahpahami — "minus bertemu minus jadi plus" ditempelkan
--      pada -4 - 6. Ada satu butir yang seluruhnya tentang kekeliruan ini.
--   3. Distributif tanpa memperhatikan kurung — 3 × (4 - 9) dikerjakan sebagai
--      3 × 4 - 9.
--
-- Setiap distraktor punya penjelasannya sendiri di `penjelasan_per_opsi`, dan
-- penjelasan itu menyebut kekeliruannya alih-alih cuma berkata "salah" —
-- karena butir yang tidak memberi tahu anak DI MANA ia tergelincir cuma
-- menghukum, tidak mengajar.
--
-- BENTUK SOALNYA JUGA DARI DOKUMEN: "PG tunggal, isian angka". Tidak ada kisi
-- pernyataan maupun multi-select di sini, meski keduanya sudah didukung mesin —
-- yang menentukan bentuk soal adalah topiknya, bukan kemampuan mesinnya.
--
-- ------------------------------------------------------------
-- TIDAK LANGSUNG AKTIF, DAN INI BAGIAN TERPENTING BERKAS INI
--
-- Butir ini masuk dengan `status_verifikasi = 'terverifikasi_matematis'`, bukan
-- 'aktif'. Tangga verifikasi migrasi 141 punya empat anak tangga —
-- draf, terverifikasi_matematis, direview_pedagogis, aktif — dan sampai hari
-- ini tidak satu pun butir pernah memakainya: 103 butir D-01 di bank semuanya
-- langsung 'aktif' karena semuanya dummy dan tidak ada yang perlu ditinjau.
--
-- Matematikanya memang sudah diperiksa, dan diperiksa dengan cara yang bisa
-- diulang siapa pun: setiap jawaban di berkas ini DIHITUNG, tidak diketik —
-- naskahnya menuliskan `-12 + 5 * (-3)` dan hasilnya yang masuk, sehingga tidak
-- ada salah ketik yang bisa lolos menjadi kunci jawaban.
--
-- Yang belum diperiksa manusia adalah sisi pedagogisnya: apakah bahasanya pas
-- untuk anak kelas 7, apakah distraktornya benar-benar menangkap miskonsepsi
-- yang dimaksud, apakah konteksnya masuk akal. Itu pekerjaan tim konten, dan
-- sistem ini tidak boleh mengaku sudah melakukannya. `topik_paket_items` hanya
-- menyajikan butir 'aktif', jadi butir ini TIDAK akan sampai ke anak mana pun
-- sampai seseorang menaikkannya sendiri.
--
-- Sesudah ditinjau, dua perintah menyelesaikannya — dan keduanya sengaja tidak
-- dijalankan di sini, karena menaikkan butir ke 'aktif' adalah tanda tangan
-- manusia, bukan langkah migrasi:
--
--   update question_bank_items set status_verifikasi = 'aktif'
--    where topik_id = 'D-01' and sumber_pembuatan = 'ai_generated_verified'
--      and status_verifikasi = 'direview_pedagogis';
--
--   -- lalu tarik butir dummy lamanya, dan susun ulang paketnya:
--   update question_bank_items set status_verifikasi = 'ditarik'
--    where topik_id = 'D-01' and peruntukan = 'latihan' and bloom_level <= 3
--      and id not in (select id from question_bank_items
--                     where topik_id = 'D-01' and status_verifikasi = 'aktif');
--   select semai_paket_topik('D-01');
--
-- Jalankan SESUDAH 182.
-- ============================================================

create or replace function sisip_butir_d01(p_butir jsonb, p_penulis uuid)
returns void
language plpgsql
as $fn$
begin
  if exists (
    select 1 from question_bank_items
    where topik_id = 'D-01' and prompt = p_butir ->> 'prompt'
  ) then
    return;
  end if;

  insert into question_bank_items (
    created_by, type, prompt, options, correct_answer, weight,
    bloom_level, status_verifikasi, penjelasan_per_opsi,
    elemen_proses, sumber_pembuatan, peruntukan, topik_id
  ) values (
    p_penulis,
    p_butir ->> 'type',
    p_butir ->> 'prompt',
    case when jsonb_typeof(p_butir -> 'opsi') = 'object' then p_butir -> 'opsi' else null end,
    p_butir -> 'kunci',
    1,
    (p_butir ->> 'bloom')::smallint,
    'terverifikasi_matematis',
    case when jsonb_typeof(p_butir -> 'why') = 'array' then (
      select jsonb_object_agg((i - 1)::text, w)
      from jsonb_array_elements_text(p_butir -> 'why') with ordinality as t(w, i)
    ) else null end,
    -- Elemen Proses yang ditekankan untuk D-01 menurut Tabel Persiapan
    -- Pedagogis: Penalaran dan Pemecahan Masalah.
    array['penalaran', 'pemecahan_masalah']::text[],
    'ai_generated_verified',
    'latihan',
    'D-01'
  );
end;
$fn$;

do $$
declare
  v_penulis uuid;
  v_butir jsonb;
begin
  select id into v_penulis from profiles where role = 'admin' order by created_at limit 1;

  for v_butir in select * from jsonb_array_elements($d01$
[
  {"bloom": 1, "type": "mcq_single", "prompt": "Manakah bilangan yang lebih besar, -8 atau -3?", "opsi": {"choices": ["-3", "-8", "Keduanya sama besar", "Tidak dapat dibandingkan"]}, "kunci": "-3", "why": ["Benar. Pada garis bilangan, -3 berada di kanan -8, dan yang lebih kanan selalu lebih besar.", "Salah. Ini membandingkan jaraknya dari nol, bukan letaknya. 8 memang lebih besar daripada 3, tetapi -8 justru lebih kecil daripada -3.", "Salah. Keduanya menempati letak yang berbeda pada garis bilangan.", "Salah. Setiap dua bilangan bulat selalu dapat dibandingkan."]},
  {"bloom": 1, "type": "short_answer", "prompt": "Berapa nilai mutlak dari -9?", "opsi": null, "kunci": ["9"], "why": null},
  {"bloom": 1, "type": "short_answer", "prompt": "Berapa lawan dari bilangan -12?", "opsi": null, "kunci": ["12"], "why": null},
  {"bloom": 1, "type": "mcq_single", "prompt": "Hasil kali dua bilangan bulat negatif adalah bilangan ...", "opsi": {"choices": ["positif", "negatif", "nol", "bisa positif bisa negatif"]}, "kunci": "positif", "why": ["Benar. Dua tanda negatif yang dikalikan saling meniadakan.", "Salah. Yang menghasilkan negatif adalah perkalian tanda yang berbeda.", "Salah. Hasilnya nol hanya jika salah satu faktornya nol.", "Salah. Untuk dua faktor negatif hasilnya selalu positif, tidak pernah berubah-ubah."]},
  {"bloom": 1, "type": "mcq_single", "prompt": "Hasil kali bilangan bulat negatif dengan bilangan bulat positif adalah bilangan ...", "opsi": {"choices": ["negatif", "positif", "nol", "bisa positif bisa negatif"]}, "kunci": "negatif", "why": ["Benar. Tanda yang berbeda menghasilkan hasil kali negatif.", "Salah. Hasil positif diperoleh dari dua faktor bertanda sama.", "Salah. Hasilnya nol hanya jika salah satu faktornya nol.", "Salah. Untuk tanda yang berbeda hasilnya selalu negatif."]},
  {"bloom": 1, "type": "short_answer", "prompt": "Berapa hasil dari -7 + 7?", "opsi": null, "kunci": ["0"], "why": null},
  {"bloom": 1, "type": "mcq_single", "prompt": "Urutan dari yang TERKECIL untuk bilangan -5, 2, -1, dan 0 adalah ...", "opsi": {"choices": ["-5, -1, 0, 2", "-1, -5, 0, 2", "0, -1, 2, -5", "2, 0, -1, -5"]}, "kunci": "-5, -1, 0, 2", "why": ["Benar. Urutannya mengikuti letak pada garis bilangan dari kiri ke kanan.", "Salah. Ini mengurutkan -1 sebelum -5 karena angka 1 lebih kecil daripada 5 — yang dibandingkan jaraknya dari nol, bukan letaknya.", "Salah. Nol bukan bilangan terkecil di antara keempatnya.", "Salah. Ini urutan dari yang terbesar."]},
  {"bloom": 1, "type": "short_answer", "prompt": "Berapa hasil dari -6 × 4?", "opsi": null, "kunci": ["-24"], "why": null},
  {"bloom": 2, "type": "mcq_single", "prompt": "Suhu mula-mula -3 °C, lalu turun 5 °C. Berapa suhu akhirnya?", "opsi": {"choices": ["-8 °C", "2 °C", "-2 °C", "8 °C"]}, "kunci": "-8 °C", "why": ["Benar. Turun berarti bergerak ke kiri pada garis bilangan: -3 - 5 = -8.", "Salah. Ini menjumlahkan keduanya seolah turun berarti menambah.", "Salah. Ini mengurangkan 3 dari 5, bukan menurunkan -3 sebanyak 5.", "Salah. Tandanya hilang; suhu yang turun dari angka negatif tidak menjadi positif."]},
  {"bloom": 2, "type": "mcq_single", "prompt": "Bentuk 5 - (-3) bernilai sama dengan ...", "opsi": {"choices": ["5 + 3", "5 - 3", "-5 + 3", "-5 - 3"]}, "kunci": "5 + 3", "why": ["Benar. Mengurangi bilangan negatif sama dengan menambahkan lawannya.", "Salah. Ini mengabaikan tanda negatif di dalam kurung.", "Salah. Tanda bilangan pertama tidak berubah.", "Salah. Dua tanda negatif berurutan justru menjadi penjumlahan."]},
  {"bloom": 2, "type": "mcq_single", "prompt": "Manakah yang bernilai sama dengan -(-7)?", "opsi": {"choices": ["7", "-7", "0", "14"]}, "kunci": "7", "why": ["Benar. Lawan dari -7 adalah 7.", "Salah. Tanda negatif di depan mengubah -7 menjadi lawannya.", "Salah. Nilainya tidak hilang, hanya berganti tanda.", "Salah. Tanda negatif tidak menggandakan bilangan."]},
  {"bloom": 2, "type": "short_answer", "prompt": "Sebuah kapal selam berada 40 m di bawah permukaan laut, lalu naik 15 m. Berapa meter kedalamannya sekarang? Tulis angkanya saja.", "opsi": null, "kunci": ["25"], "why": null},
  {"bloom": 2, "type": "mcq_single", "prompt": "Berapa hasil dari 3 × (4 - 9)?", "opsi": {"choices": ["-15", "3", "15", "-3"]}, "kunci": "-15", "why": ["Benar. Isi kurung dikerjakan lebih dulu: 4 - 9 = -5, lalu 3 × (-5) = -15.", "Salah. Ini mengalikan 3 dengan 4 lebih dulu lalu mengurangi 9 — kurungnya diabaikan.", "Salah. Hasilnya negatif karena salah satu faktornya negatif.", "Salah. Hasil kurungnya -5, bukan -1."]},
  {"bloom": 2, "type": "mcq_single", "prompt": "Manakah pernyataan yang BENAR?", "opsi": {"choices": ["-10 < -2", "-10 > -2", "-10 = -2", "|-10| < |-2|"]}, "kunci": "-10 < -2", "why": ["Benar. -10 terletak lebih ke kiri pada garis bilangan.", "Salah. Ini membandingkan jarak dari nol: 10 memang lebih besar daripada 2, tetapi -10 lebih kecil daripada -2.", "Salah. Keduanya bilangan yang berbeda.", "Salah. Nilai mutlak -10 adalah 10 dan nilai mutlak -2 adalah 2, jadi yang pertama justru lebih besar."]},
  {"bloom": 2, "type": "short_answer", "prompt": "Berapa hasil dari (-8) + (-5)?", "opsi": null, "kunci": ["-13"], "why": null},
  {"bloom": 2, "type": "mcq_single", "prompt": "Seorang siswa menulis -4 - 6 = 2 dengan alasan \"minus bertemu minus menjadi plus\". Di mana kekeliruannya?", "opsi": {"choices": ["Aturan itu berlaku untuk -4 - (-6), bukan untuk -4 - 6", "Aturannya benar, hasilnya memang 2", "Aturannya benar, tetapi hasilnya seharusnya -2", "Aturannya benar, tetapi hasilnya seharusnya 10"]}, "kunci": "Aturan itu berlaku untuk -4 - (-6), bukan untuk -4 - 6", "why": ["Benar. Dua tanda negatif berurutan baru muncul kalau bilangan yang dikurangkan sendiri negatif. Di sini -4 - 6 = -10.", "Salah. Hasil yang benar -10, bukan 2.", "Salah. Bukan hasilnya saja yang keliru, melainkan aturan yang dipakainya.", "Salah. Hasil 10 muncul kalau tandanya diabaikan seluruhnya."]},
  {"bloom": 3, "type": "short_answer", "prompt": "Berapa hasil dari -12 + 5 × (-3)?", "opsi": null, "kunci": ["-27"], "why": null},
  {"bloom": 3, "type": "short_answer", "prompt": "Berapa hasil dari (-6 + 2) × (-5)?", "opsi": null, "kunci": ["20"], "why": null},
  {"bloom": 3, "type": "short_answer", "prompt": "Suhu kota A -7 °C dan kota B 12 °C. Berapa derajat selisih suhu keduanya?", "opsi": null, "kunci": ["19"], "why": null},
  {"bloom": 3, "type": "mcq_single", "prompt": "Sebuah lift berada di lantai -2, naik 7 lantai, lalu turun 3 lantai. Di lantai berapa lift itu sekarang?", "opsi": {"choices": ["2", "-2", "12", "6"]}, "kunci": "2", "why": ["Benar. -2 + 7 - 3 = 2.", "Salah. Ini kembali ke lantai awal; naik 7 lalu turun 3 berarti naik bersih 4 lantai.", "Salah. Ini menjumlahkan seluruh angkanya tanpa memperhatikan arah.", "Salah. Ini menghitung 7 - 3 saja dan menambahkan 2, bukan -2."]},
  {"bloom": 3, "type": "short_answer", "prompt": "Berapa hasil dari -20 ÷ 4 + 3?", "opsi": null, "kunci": ["-2"], "why": null},
  {"bloom": 3, "type": "short_answer", "prompt": "Berapa hasil dari (-3)² + (-3)?", "opsi": null, "kunci": ["6"], "why": null},
  {"bloom": 3, "type": "mcq_single", "prompt": "Saldo rekening Andi -150.000 rupiah. Ia menyetor 200.000 rupiah. Berapa rupiah saldonya sekarang?", "opsi": {"choices": ["50.000", "-50.000", "350.000", "-350.000"]}, "kunci": "50.000", "why": ["Benar. -150.000 + 200.000 = 50.000.", "Salah. Setoran yang lebih besar daripada utangnya membuat saldo menjadi positif.", "Salah. Ini menjumlahkan kedua angka tanpa memperhatikan bahwa saldo awalnya negatif.", "Salah. Menyetor uang menambah saldo, bukan menguranginya."]},
  {"bloom": 3, "type": "short_answer", "prompt": "Berapa hasil dari 8 - (-4) × 2?", "opsi": null, "kunci": ["16"], "why": null}
]
$d01$) loop
    perform sisip_butir_d01(v_butir, v_penulis);
  end loop;
end;
$$;

drop function if exists sisip_butir_d01(jsonb, uuid);

notify pgrst, 'reload schema';
