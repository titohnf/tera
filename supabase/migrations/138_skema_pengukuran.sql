-- ============================================================
-- FR5: aturan skoring untuk pengukuran, di samping aturan yang sudah ada
--
-- PRD Tahap 0 FR5 menuntut tiga hal yang tidak berlaku hari ini: correction
-- for guessing pada soal Benar-Salah, partial credit pada multi-select, dan
-- format Benar-Salah dua tingkat. Ketiganya berasal dari dokumen fondasi
-- Bagian 3.4, dan alasannya pengukuran: tanpa itu, 50% pada soal B-S terbaca
-- sebagai "setengah paham" padahal itu angka yang didapat dari menebak, dan
-- multi-select yang dinilai semua-atau-tidak membuang informasi tentang siswa
-- yang paham sebagian.
--
-- KENAPA TIDAK BERLAKU MENYELURUH. `nilai_jawaban()` sekarang dipakai SEMUA
-- permukaan — termasuk asesmen dan try out yang dibuat tutor di Sora untuk
-- kelasnya sendiri. Menerapkan aturan di atas apa adanya berarti setiap soal
-- Benar-Salah di kuis tutor mendadak bernilai lebih rendah dan setiap MCMA
-- berubah dari semua-atau-tidak jadi nilai sebagian — perubahan nilai yang
-- tidak pernah diminta siapa pun, pada pekerjaan yang sudah berjalan. Aturan
-- pengukuran ini milik paket Bloom pilot, bukan milik setiap kuis.
--
-- Maka satu parameter, bukan satu fungsi kedua: `p_skema`.
--
--   'sederhana'  (default) — persis perilaku hari ini. Semua pemanggil yang
--                 ada sekarang mendarat di sini tanpa berubah satu angka pun.
--   'pengukuran' — aturan FR5. Dipakai paket latihan & ujian Bloom.
--
-- Satu definisi aturan, dua kebijakan penilaian yang eksplisit — bukan dua
-- salinan yang bisa menyimpang, dan bukan pula satu kebijakan yang dipaksakan
-- ke konteks yang tidak memintanya.
--
-- BELUM ADA YANG MEMANGGIL 'pengukuran'. Paket Bloom (`paket_soal`) baru lahir
-- di tahap berikutnya; aturannya ditulis dan diuji sekarang karena FR5 memang
-- langkahnya, bukan karena ada yang sudah menunggunya.
-- ============================================================

-- 1. Aturan skoring, kini dengan skema -----------------------------------------
--
-- Dibuang lalu dibuat ulang, bukan ditambah sebagai kelebihan beban: dua
-- fungsi bernama sama dengan jumlah argumen berbeda membuat pemanggilan
-- lewat PostgREST bergantung pada argumen mana yang kebetulan disebut, dan
-- "kebetulan" bukan cara memilih aturan penilaian. Argumen keenam berdefault,
-- jadi seluruh pemanggil lama tetap sah.
drop function if exists nilai_jawaban(text, jsonb, jsonb, jsonb, numeric);

create or replace function nilai_jawaban(
  p_tipe text,
  p_opsi jsonb,
  p_kunci jsonb,
  p_jawaban jsonb,
  p_bobot numeric,
  p_skema text default 'sederhana'
)
returns numeric
language plpgsql
immutable
parallel safe
as $$
declare
  v_bobot numeric := coalesce(p_bobot, 1);
  v_skema text := coalesce(p_skema, 'sederhana');
  v_kunci_list jsonb;
  v_benar integer;
  v_salah integer;
  v_jml integer;
  v_mode text;
  v_tier1 boolean;
  v_tier2 boolean;
begin
  -- Skema yang salah eja lebih baik meledak daripada diam-diam dinilai dengan
  -- aturan yang lain: yang dipertaruhkan angka pada rapor anak.
  if v_skema not in ('sederhana', 'pengukuran') then
    raise exception 'skema penilaian tidak dikenal: %', v_skema;
  end if;

  case p_tipe

    when 'mcq_single' then
      return case when nj_normal(p_kunci) = nj_normal(p_jawaban) then v_bobot else 0 end;

    -- Benar-Salah, satu-satunya tipe yang skemanya benar-benar membedakan.
    --
    -- 'pengukuran' memakai formula scoring klasik dengan k=2: benar +1, salah
    -- −1 (yaitu −W/(k−1)). Rata-rata seluruh paket lalu menjadi 2p−1, yang
    -- artinya menebak seluruh paket bernilai NOL, bukan 50% — itulah yang
    -- diminta dokumen fondasi Bagian 3.4.
    --
    -- NILAI SATU BUTIR BISA NEGATIF, dan itu disengaja. Lantainya (`max(0,…)`)
    -- diterapkan saat menjumlahkan satu paket, BUKAN di sini — memotongnya per
    -- butir akan membuat jawaban salah bernilai nol dan menghapus persis
    -- koreksi yang baru saja dipasang. Pemanggil yang menjumlahkan wajib
    -- memasang lantai itu.
    when 'true_false' then
      if nj_normal(p_kunci) = nj_normal(p_jawaban) then
        return v_bobot;
      end if;
      return case when v_skema = 'pengukuran' then -v_bobot else 0 end;

    -- Benar-Salah dua tingkat: tingkat 1 menilai pernyataannya, tingkat 2
    -- alasannya. Nilai penuh hanya kalau KEDUANYA benar; tingkat 1 benar
    -- dengan alasan salah dapat sebagian, karena jawaban akhir yang kebetulan
    -- benar dengan alasan keliru adalah miskonsepsi, bukan penguasaan.
    --
    -- Besaran "sebagian" ikut di kuncinya (`skor_sebagian`, default 0,5),
    -- bukan dipatok di sini: PRD FR5 menyerahkannya ke tim konten.
    --
    -- Correction for guessing SENGAJA tidak berlaku di sini, di skema mana pun.
    -- Menebak dua tingkat sekaligus sudah berpeluang jauh di bawah 50%, jadi
    -- koreksinya akan menghukum dua kali untuk risiko yang sudah ditekan oleh
    -- bentuk soalnya sendiri.
    when 'true_false_two_tier' then
      -- Kunci yang tidak memuat kedua tingkatnya tidak bisa dinilai, dan
      -- jawabannya nol — BUKAN nilai penuh. Tanpa penjagaan ini, kunci yang
      -- salah bentuk membuat `nj_normal(NULL)` di kedua sisi sama-sama string
      -- kosong, lalu cocok, lalu bernilai sempurna untuk jawaban apa pun. Itu
      -- kelas cacat yang sama dengan himpunan kosong di `mcq_multi` — di sana
      -- ia diwarisi karena mengubahnya menggeser nilai yang sudah tercatat, di
      -- sini tidak ada yang perlu diwarisi: tipe ini baru lahir di migrasi ini.
      if jsonb_typeof(p_kunci) <> 'object'
         or coalesce(jsonb_typeof(p_kunci -> 'tier1'), 'null') = 'null'
         or coalesce(jsonb_typeof(p_kunci -> 'tier2'), 'null') = 'null' then
        return 0;
      end if;
      v_tier1 := nj_normal(p_kunci -> 'tier1') = nj_normal(p_jawaban -> 'tier1');
      v_tier2 := nj_normal(p_kunci -> 'tier2') = nj_normal(p_jawaban -> 'tier2');
      if not v_tier1 then
        return 0;
      end if;
      if v_tier2 then
        return v_bobot;
      end if;
      return v_bobot * coalesce((p_kunci ->> 'skor_sebagian')::numeric, 0.5);

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

    -- Multi-select.
    --
    -- 'sederhana' tetap semua-atau-tidak, termasuk sudut anehnya: dua himpunan
    -- kosong terhitung sama, jadi soal yang kuncinya salah bentuk bernilai
    -- penuh. Dibiarkan karena mengubahnya berarti mengubah nilai kuis tutor
    -- yang sudah berjalan — dan di 'pengukuran' cacat itu memang tidak ada,
    -- karena penyebutnya nol tidak bisa dinilai (lihat di bawah).
    --
    -- 'pengukuran' memakai formula dokumen fondasi Bagian 3.4:
    --     max(0, (opsi benar dipilih − opsi salah dipilih) / total opsi benar)
    -- Lantainya ADA di sini, tidak seperti Benar-Salah: formulanya sendiri yang
    -- menyebutkannya, dan tanpa itu satu soal bisa menyeret nilai soal lain
    -- lebih jauh daripada nilainya sendiri.
    when 'mcq_multi' then
      if v_skema = 'sederhana' then
        return case
          when nj_himpunan(p_kunci) <@ nj_himpunan(p_jawaban)
           and nj_himpunan(p_jawaban) <@ nj_himpunan(p_kunci)
          then v_bobot
          else 0
        end;
      end if;

      v_jml := cardinality(nj_himpunan(p_kunci));
      -- Tanpa satu pun opsi benar, tidak ada yang bisa diukur — dan membaginya
      -- akan membagi dengan nol.
      if v_jml = 0 then
        return 0;
      end if;
      select count(*) filter (where d = any (nj_himpunan(p_kunci))),
             count(*) filter (where not (d = any (nj_himpunan(p_kunci))))
        into v_benar, v_salah
      from unnest(nj_himpunan(p_jawaban)) as d;
      return greatest(0, (v_benar - v_salah)::numeric / v_jml) * v_bobot;

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

    -- Grid pernyataan tidak berubah di skema mana pun — lihat catatan di ujung
    -- berkas ini, ini pertanyaan terbuka untuk tim konten, bukan kelalaian.
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

    when 'essay', 'upload_file' then
      return null;

    else
      return null;

  end case;
end;
$$;

comment on function nilai_jawaban(text, jsonb, jsonb, jsonb, numeric, text) is
  'Nilai satu jawaban — definisi TUNGGAL aturan skoring. p_skema: sederhana (default, perilaku kuis biasa) atau pengukuran (FR5: correction for guessing & partial credit). NULL = tidak dinilai otomatis.';

-- 2. Versi banyak sekaligus, ikut membawa skemanya -----------------------------
--
-- Satu skema untuk seluruh panggilan, bukan per butir: yang menentukan skema
-- adalah paket tempat soal itu dikerjakan, dan satu paket tidak menilai
-- separuh soalnya dengan aturan yang berbeda.
drop function if exists nilai_jawaban_banyak(jsonb);

create or replace function nilai_jawaban_banyak(
  p_daftar jsonb,
  p_skema text default 'sederhana'
)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(
        nilai_jawaban(
          s.item ->> 'tipe',
          s.item -> 'opsi',
          s.item -> 'kunci',
          s.item -> 'jawaban',
          (s.item ->> 'bobot')::numeric,
          p_skema
        )
      )
      order by s.ord
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(
         case when jsonb_typeof(p_daftar) = 'array' then p_daftar else '[]'::jsonb end
       ) with ordinality as s(item, ord);
$$;

comment on function nilai_jawaban_banyak(jsonb, text) is
  'Menilai sederet jawaban sekaligus dengan satu skema; keluaran sejajar indeks dengan masukan.';

-- ------------------------------------------------------------
-- DUA HAL YANG SENGAJA BELUM DIPUTUSKAN DI SINI
--
-- 1. `statement_grid` ("PG Kompleks - Kategori") secara bentuk adalah deret
--    Benar-Salah, dan Protokol Uji Coba Bagian 3 menghitungnya di kuota
--    "Benar-Salah 35%". Kalau correction for guessing berlaku untuk B-S karena
--    peluang tebaknya 50%, alasan yang sama berlaku untuk TIAP BARIS grid —
--    tapi FR5 tidak menyebutnya, dan menyimpulkannya sendiri berarti memutuskan
--    kebijakan pengukuran atas nama tim konten. Dibiarkan apa adanya sampai
--    ditanyakan.
--
-- 2. `practice_record_answer()` masih memanggil skema default. Ia baru perlu
--    tahu skema begitu ada paket Bloom yang membawanya — dan tabel `paket_soal`
--    belum ada. Menambah parameter sekarang berarti menambah parameter yang
--    selalu bernilai sama.
-- ------------------------------------------------------------

notify pgrst, 'reload schema';
