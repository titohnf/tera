-- ============================================================
-- Aturan penilaian pindah ke database
--
-- Sampai sekarang "berapa nilai sebuah jawaban" ditulis DUA KALI: di
-- `form/src/lib/grading.ts` (Sora) dan `tera/lib/belajar/penilaian.ts` (di
-- sini). Komentar di keduanya saling menunjuk dan menyebut kesamaannya sebagai
-- inti — tapi tidak ada satu pun mekanisme yang menjaganya. Keduanya sudah
-- berbeda nama fungsi, nama variabel, dan bentuk kembaliannya; yang kebetulan
-- masih sama hanya kesepuluh cabang aturannya. Perbedaan di situ tidak akan
-- pernah muncul sebagai galat, melainkan sebagai NILAI YANG BERBEDA untuk
-- pekerjaan yang sama, di dua layar yang sama-sama mengklaim benar.
--
-- KENAPA DI DATABASE, BUKAN PAKET BERSAMA. Sora dan Tera adalah dua repo dan
-- dua situs Netlify yang terpisah; tidak ada paket npm di antaranya. Yang
-- SUDAH mereka bagi cuma satu: proyek Supabase ini, beserta seri migrasi ini
-- sebagai sumber tunggal skemanya. Paket npm privat memang bisa dibuat, tapi
-- ia menukar duplikasi yang terlihat dengan version skew yang tidak terlihat —
-- Tera terpaku di 1.0 sementara Sora sudah 1.1, dengan gejala yang persis sama
-- dan jauh lebih sulit dilacak. Fungsi di sini tidak punya versi untuk
-- menyimpang: satu definisi, satu tempat, dipanggil keduanya.
--
-- MIGRASI INI TIDAK MENGUBAH SATU NILAI PUN. Ia port harfiah dari kedua berkas
-- TypeScript itu, termasuk sudut-sudut anehnya (lihat catatan per cabang) —
-- supaya perpindahannya bisa dibuktikan setara dulu, sebelum aturan baru FR5
-- (correction for guessing, partial credit, soal dua tingkat) ditambahkan di
-- atasnya. Yang membuktikan: `form/scripts/uji-nilai-jawaban.ts`, yang
-- menjalankan puluhan kasus lewat ketiga implementasi dan menuntut hasilnya
-- sama persis.
--
-- Belum ada pemanggil di migrasi ini. `practice_record_answer` masih menerima
-- skor dari pemanggilnya sampai migrasi 137.
-- ============================================================

-- Menormalkan satu nilai jsonb seperti `normalize()`/`normal()` di TypeScript:
-- jadikan teks, buang spasi tepi, huruf kecilkan. `null` jsonb dan SQL NULL
-- sama-sama jadi string kosong, mengikuti `String(value ?? "")`.
--
-- `#>> '{}'` dipakai, bukan `::text`, supaya string jsonb kehilangan tanda
-- kutipnya: `'"abc"'::jsonb #>> '{}'` = `abc`, sedangkan `::text` = `"abc"`.
-- Angka dan boolean lewat jalur yang sama dan keluar sebagai `5`/`true`,
-- persis seperti `String()` di JavaScript.
create or replace function nj_normal(p_nilai jsonb)
returns text
language sql
immutable
parallel safe
as $$
  select coalesce(lower(btrim(p_nilai #>> '{}')), '');
$$;

comment on function nj_normal(jsonb) is
  'Normalisasi nilai jawaban untuk perbandingan — kembaran normalize() di grading.ts.';

-- Elemen sebuah array jsonb sebagai himpunan teks ternormalkan. Nilai yang
-- bukan array menghasilkan himpunan KOSONG, bukan galat — mengikuti
-- `normalizedSet()` yang mengembalikan Set kosong untuk apa pun yang bukan
-- array.
--
-- Penjagaannya ada di dalam `jsonb_array_elements()`, bukan di `where`:
-- fungsi pengembali-himpunan dievaluasi di `from` SEBELUM `where` menyaring,
-- jadi menyaring belakangan tetap melempar "cannot extract elements from a
-- scalar" untuk masukan yang bukan array.
create or replace function nj_himpunan(p_nilai jsonb)
returns text[]
language sql
immutable
parallel safe
as $$
  select coalesce(
    (
      select array_agg(distinct nj_normal(e))
      from jsonb_array_elements(
             case when jsonb_typeof(p_nilai) = 'array' then p_nilai else '[]'::jsonb end
           ) as e
    ),
    '{}'::text[]
  );
$$;

comment on function nj_himpunan(jsonb) is
  'Himpunan teks ternormalkan dari array jsonb; kosong untuk yang bukan array.';

-- Nilai satu jawaban terhadap kuncinya.
--
-- NULL berarti "tidak dinilai otomatis" (esai, unggah berkas) — bukan nol.
-- Membedakan keduanya penting: nol adalah pernyataan bahwa jawabannya salah,
-- sementara NULL adalah pernyataan bahwa mesin tidak berhak menilainya.
create or replace function nilai_jawaban(
  p_tipe text,
  p_opsi jsonb,
  p_kunci jsonb,
  p_jawaban jsonb,
  p_bobot numeric
)
returns numeric
language plpgsql
immutable
parallel safe
as $$
declare
  v_bobot numeric := coalesce(p_bobot, 1);
  v_kunci_list jsonb;
  v_benar integer;
  v_jml integer;
  v_mode text;
begin
  case p_tipe

    -- Satu jawaban, satu kunci. Perbandingan ternormalkan, jadi "B" dan " b "
    -- adalah jawaban yang sama.
    when 'mcq_single', 'true_false' then
      return case when nj_normal(p_kunci) = nj_normal(p_jawaban) then v_bobot else 0 end;

    -- Kuncinya boleh berupa daftar ejaan yang sama-sama diterima. Kunci yang
    -- bukan array diperlakukan sebagai daftar berisi satu, mengikuti
    -- `Array.isArray(...) ? ... : [correct_answer]`.
    when 'short_answer' then
      v_kunci_list := case
        when jsonb_typeof(p_kunci) = 'array' then p_kunci
        else jsonb_build_array(p_kunci)
      end;
      return case
        when exists (
          select 1 from jsonb_array_elements(v_kunci_list) as k
          where nj_normal(k) = nj_normal(p_jawaban)
        ) then v_bobot
        else 0
      end;

    -- Semua-atau-tidak sama sekali, DAN ITU MEMANG PERILAKU HARI INI: partial
    -- credit multi-select baru masuk lewat FR5, sesudah migrasi ini terbukti
    -- setara. Dua himpunan kosong terhitung sama (jadi bernilai penuh) —
    -- sudut aneh yang diwarisi apa adanya dari `setsEqual` di TypeScript,
    -- bukan diperbaiki diam-diam di sini.
    when 'mcq_multi' then
      return case
        when nj_himpunan(p_kunci) <@ nj_himpunan(p_jawaban)
         and nj_himpunan(p_jawaban) <@ nj_himpunan(p_kunci)
        then v_bobot
        else 0
      end;

    -- Setiap pasangan harus cocok. Jawaban yang bukan objek membuat setiap
    -- pencarian kunci pulang kosong, jadi nilainya nol — sama seperti
    -- `(response ?? {})[pair.left]` yang menghasilkan undefined.
    when 'matching' then
      if jsonb_typeof(p_opsi -> 'pairs') <> 'array'
         or jsonb_array_length(p_opsi -> 'pairs') = 0 then
        return 0;
      end if;
      return case
        when not exists (
          select 1
          from jsonb_array_elements(p_opsi -> 'pairs') as pasangan
          where nj_normal(
                  case when jsonb_typeof(p_jawaban) = 'object'
                       then p_jawaban -> (pasangan ->> 'left')
                  end
                ) is distinct from nj_normal(pasangan -> 'right')
        ) then v_bobot
        else 0
      end;

    -- Urutan harus sama persis, termasuk panjangnya.
    when 'ordering' then
      if jsonb_typeof(p_opsi -> 'items') <> 'array'
         or jsonb_array_length(p_opsi -> 'items') = 0
         or jsonb_typeof(p_jawaban) <> 'array'
         or jsonb_array_length(p_jawaban) <> jsonb_array_length(p_opsi -> 'items') then
        return 0;
      end if;
      return case
        when not exists (
          select 1
          from jsonb_array_elements(p_opsi -> 'items') with ordinality as item(nilai, ord)
          where nj_normal(item.nilai) is distinct from nj_normal(p_jawaban -> (item.ord::int - 1))
        ) then v_bobot
        else 0
      end;

    -- Satu-satunya tipe yang SUDAH memberi nilai sebagian hari ini: tiap
    -- rumpang dihitung sendiri. Penyebutnya banyaknya kunci, bukan banyaknya
    -- yang diisi — rumpang yang dilewati adalah rumpang yang salah.
    when 'fill_blank' then
      if jsonb_typeof(p_kunci) <> 'array' or jsonb_array_length(p_kunci) = 0 then
        return 0;
      end if;
      select count(*)
        into v_benar
      from jsonb_array_elements(p_kunci) with ordinality as k(nilai, ord)
      where nj_normal(k.nilai) = nj_normal(
              case when jsonb_typeof(p_jawaban) = 'array'
                   then p_jawaban -> (k.ord::int - 1)
              end
            );
      return (v_bobot * v_benar) / jsonb_array_length(p_kunci);

    -- Grid pernyataan: tiap baris dinilai sendiri, lalu dijumlah — kecuali
    -- kuncinya meminta semua-atau-tidak.
    --
    -- `jsonb_typeof(...) = 'boolean'` menjaga baris yang BELUM ditandai tutor:
    -- tanpa itu, pernyataan yang tidak dijawab (null) akan cocok dengan kunci
    -- yang belum ditandai (null) dan terhitung benar.
    when 'statement_grid' then
      if jsonb_typeof(p_opsi -> 'statements') <> 'array'
         or jsonb_array_length(p_opsi -> 'statements') = 0 then
        return 0;
      end if;
      v_jml := jsonb_array_length(p_opsi -> 'statements');
      v_mode := p_kunci ->> 'grading_mode';

      select count(*)
        into v_benar
      from generate_series(0, v_jml - 1) as i
      where jsonb_typeof(
              case when jsonb_typeof(p_kunci -> 'answers') = 'array'
                   then p_kunci -> 'answers' -> i
              end
            ) = 'boolean'
        and (
              case when jsonb_typeof(p_jawaban) = 'array' then p_jawaban -> i end
            ) = (p_kunci -> 'answers' -> i);

      if v_mode = 'all_or_nothing' then
        return case when v_benar = v_jml then v_bobot else 0 end;
      end if;
      return (v_bobot * v_benar) / v_jml;

    -- Dinilai manusia, bukan mesin. NULL, bukan nol.
    when 'essay', 'upload_file' then
      return null;

    else
      return null;

  end case;
end;
$$;

comment on function nilai_jawaban(text, jsonb, jsonb, jsonb, numeric) is
  'Nilai satu jawaban terhadap kuncinya — definisi TUNGGAL aturan skoring untuk Sora dan Tera. NULL = tidak dinilai otomatis.';

notify pgrst, 'reload schema';
