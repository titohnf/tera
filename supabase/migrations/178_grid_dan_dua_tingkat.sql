-- ============================================================
-- Dua pertanyaan terbuka migrasi 138, dijawab
--
-- Migrasi 138 menutup dirinya dengan dua hal yang sengaja tidak diputuskan,
-- keduanya karena ia menganggapnya kebijakan pengukuran dan bukan keputusan
-- sebuah migrasi. Keduanya sudah menunggu empat puluh migrasi, dan taruhannya
-- naik sejak 176: kolam ujian sekarang memuat 95 butir `statement_grid`.
-- Menunda lebih lama berarti pilot berjalan dengan separuh aturan FR5.
--
-- ------------------------------------------------------------
-- PERTANYAAN 1: apakah `statement_grid` kena correction for guessing?
--
-- Kata 138: "Bentuknya deret Benar-Salah, dan Protokol Uji Coba Bagian 3
-- menghitungnya di kuota Benar-Salah 35%. Kalau correction for guessing berlaku
-- untuk B-S karena peluang tebaknya 50%, alasan yang sama berlaku untuk TIAP
-- BARIS grid — tapi FR5 tidak menyebutnya."
--
-- JAWABANNYA: YA, dan alasannya adalah alasan yang sudah dipakai sistem ini
-- untuk Benar-Salah. Satu baris grid persis sebuah soal Benar-Salah: dua pilihan,
-- peluang tebak 50%. Tanpa koreksi, seorang anak yang menebak seluruh baris
-- mendapat rata-rata SETENGAH nilai butir itu — dan sejak 176, dua belas butir
-- ujian bisa memuat beberapa grid sekaligus. Membiarkan satu bentuk soal
-- dikoreksi sementara bentuk kembarnya tidak akan mengajari muridnya hal yang
-- salah: menebak di kisi lebih murah daripada menebak di Benar-Salah.
--
--   nilai = bobot × (baris benar − baris salah) / baris yang punya kunci
--
-- TIGA BATASNYA, dan ketiganya keputusan:
--
--   a. BARIS KOSONG TIDAK DIHUKUM. Yang dikurangi hanya baris yang DIJAWAB dan
--      salah. Inilah inti correction for guessing dan sering salah dipasang:
--      yang ingin dihilangkan adalah keuntungan dari menebak, bukan hukuman
--      untuk mengaku tidak tahu. Anak yang mengosongkan satu baris mendapat 0
--      untuk baris itu — tidak untung, tidak rugi.
--
--      Ini juga satu-satunya tempat aturan itu perlu disebut. Soal Benar-Salah
--      tunggal tidak bisa dikosongkan sambil tetap dikirim — widgetnya hanya
--      memancarkan 'true' atau 'false', dan butir yang tidak dijawab sama
--      sekali tidak pernah punya baris di `practice_answers`. Grid bisa, karena
--      barisnya banyak dan yang dikirim satu butir.
--
--   b. PENYEBUTNYA BARIS YANG PUNYA KUNCI, bukan seluruh pernyataan. Skema
--      'sederhana' membagi dengan seluruh pernyataan — termasuk yang penyusunnya
--      tidak beri kunci, yang karenanya tidak pernah bisa diperoleh siapa pun.
--      Itu cacat lama yang TIDAK diperbaiki di 'sederhana' karena memperbaikinya
--      menggeser nilai kuis yang sudah berjalan; di skema baru tidak ada yang
--      perlu diwarisi.
--
--   c. `all_or_nothing` TIDAK DIKOREKSI, di skema mana pun. Grid yang dinilai
--      semua-atau-tidak dengan empat baris punya peluang tebak 1/16, bukan 1/2 —
--      koreksinya akan menghukum dua kali untuk risiko yang sudah ditekan oleh
--      cara penilaiannya sendiri. Alasan yang sama persis dipakai 138 untuk
--      menolak koreksi pada Benar-Salah dua tingkat.
--
-- NILAI SATU BUTIR BISA NEGATIF, seperti Benar-Salah, dan lantainya tetap di
-- penjumlahan paket (migrasi 175) — bukan di sini. Memotongnya per butir akan
-- membuat menebak menguntungkan lagi: rata-rata tebakan yang dilantai adalah
-- angka positif, dan seluruh koreksi ini jadi sia-sia.
--
-- ------------------------------------------------------------
-- PERTANYAAN 2: `true_false_two_tier` yang aturannya ada tapi bentuknya tidak.
--
-- Aturan skoringnya sudah ditulis lengkap di 138 — nilai penuh kalau pernyataan
-- DAN alasannya benar, sebagian kalau pernyataannya benar dengan alasan keliru,
-- nol kalau pernyataannya salah. Yang tidak pernah ada: tipe itu di `TipeSoal`,
-- cabangnya di `InputSoal`, izinnya di tabel `questions`, dan satu pun butir.
-- Tuntutan ketiga FR5 punya penilai tanpa punya soal.
--
-- Migrasi ini melengkapi sisi basis datanya; sisi aplikasinya menyusul di commit
-- yang sama.
--
-- DI KOLAM UJIAN, PADA C5. Dua tingkat mengukur persis apa yang diminta level
-- "mengevaluasi": bukan apakah jawabannya benar, melainkan apakah alasannya
-- benar. Satu butir per topik, sembilan belas seluruhnya.
--
-- AKIBATNYA PADA KUOTA, disebut supaya tidak ditemukan sebagai kejutan: kolam
-- ujian menjadi 463 butir, dan 154 butir keluarga Benar-Salah di dalamnya
-- menjadi 33,3% — turun dari 34,7%. Dua tingkat TIDAK dihitung di kuota itu:
-- ia bukan satu keputusan biner melainkan pernyataan beserta alasannya, dan
-- 138 sendiri sudah memperlakukannya berbeda dengan menolak koreksi tebakan
-- padanya. Kalau tim konten membacanya lain, yang berubah cuma angka
-- pembaginya, bukan aturannya.
--
-- AMAN DIJALANKAN ULANG. Bagian 1 dan 2 memakai `create or replace` dan
-- `drop constraint if exists`; bagian 4 memeriksa keberadaan tiap butir lebih
-- dulu. Percobaan pertama berkas ini gagal di bagian penyemaian — lihat bagian
-- 3 — jadi menjalankannya lagi memang yang diminta, bukan yang dihindari.
--
-- Jalankan SESUDAH 177.
-- ============================================================

-- 1. Aturan skoring, dengan grid yang ikut dikoreksi ---------------------------
--
-- Menggantikan versi migrasi 138. Yang berubah HANYA cabang `statement_grid`;
-- sembilan cabang lainnya disalin apa adanya supaya berkas ini tetap bisa
-- dibaca sebagai satu definisi utuh — dan supaya tidak ada yang perlu membuka
-- dua migrasi untuk tahu bagaimana sebuah jawaban dinilai.
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
  v_berkunci integer;
  v_mode text;
  v_tier1 boolean;
  v_tier2 boolean;
begin
  if v_skema not in ('sederhana', 'pengukuran') then
    raise exception 'skema penilaian tidak dikenal: %', v_skema;
  end if;

  case p_tipe

    when 'mcq_single' then
      return case when nj_normal(p_kunci) = nj_normal(p_jawaban) then v_bobot else 0 end;

    when 'true_false' then
      if nj_normal(p_kunci) = nj_normal(p_jawaban) then
        return v_bobot;
      end if;
      return case when v_skema = 'pengukuran' then -v_bobot else 0 end;

    when 'true_false_two_tier' then
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

    -- Grid pernyataan. Pertanyaan terbuka 138, dijawab di kepala berkas ini.
    when 'statement_grid' then
      if jsonb_typeof(p_opsi -> 'statements') <> 'array'
         or jsonb_array_length(p_opsi -> 'statements') = 0 then
        return 0;
      end if;
      v_jml := jsonb_array_length(p_opsi -> 'statements');
      v_mode := p_kunci ->> 'grading_mode';

      -- Baris yang BENAR: kuncinya boolean, dan jawabannya sama persis.
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

      -- Semua-atau-tidak tidak berubah di skema mana pun: peluang tebaknya
      -- sudah 1/2^n, dan mengoreksinya berarti menghukum dua kali.
      if v_mode = 'all_or_nothing' then
        return case when v_benar = v_jml then v_bobot else 0 end;
      end if;

      if v_skema <> 'pengukuran' then
        return (v_bobot * v_benar) / v_jml;
      end if;

      -- Baris yang punya kunci: penyebutnya. Pernyataan tanpa kunci tidak bisa
      -- diperoleh siapa pun, jadi ia tidak ikut membagi.
      select count(*)
        into v_berkunci
      from generate_series(0, v_jml - 1) as i
      where jsonb_typeof(
              case when jsonb_typeof(p_kunci -> 'answers') = 'array'
                   then p_kunci -> 'answers' -> i
              end
            ) = 'boolean';

      if coalesce(v_berkunci, 0) = 0 then
        return 0;
      end if;

      -- Baris yang SALAH: kuncinya boolean, jawabannya boolean, dan keduanya
      -- berbeda. Baris yang dikosongkan tidak masuk hitungan ini — mengaku
      -- tidak tahu tidak dihukum, menebak yang meleset dihukum.
      select count(*)
        into v_salah
      from generate_series(0, v_jml - 1) as i
      where jsonb_typeof(
              case when jsonb_typeof(p_kunci -> 'answers') = 'array'
                   then p_kunci -> 'answers' -> i
              end
            ) = 'boolean'
        and jsonb_typeof(
              case when jsonb_typeof(p_jawaban) = 'array' then p_jawaban -> i end
            ) = 'boolean'
        and (
              case when jsonb_typeof(p_jawaban) = 'array' then p_jawaban -> i end
            ) <> (p_kunci -> 'answers' -> i);

      -- Tanpa lantai, sama seperti Benar-Salah: lantainya di penjumlahan paket
      -- (175). Melantainya di sini membuat rata-rata tebakan bernilai positif
      -- lagi, dan seluruh koreksi ini kehilangan gunanya.
      return v_bobot * (v_benar - coalesce(v_salah, 0))::numeric / v_berkunci;

    when 'essay', 'upload_file' then
      return null;

    else
      return null;

  end case;
end;
$$;

comment on function nilai_jawaban(text, jsonb, jsonb, jsonb, numeric, text) is
  'Nilai satu jawaban — definisi TUNGGAL aturan skoring. p_skema: sederhana (perilaku kuis biasa) atau pengukuran (FR5: correction for guessing pada Benar-Salah dan kisi pernyataan, partial credit pada multi-select). NULL = tidak dinilai otomatis.';

-- 2. Izin tipe dua tingkat di penyusun soal ------------------------------------
--
-- `question_bank_items.type` memang tidak pernah punya check — bank itu sengaja
-- terbuka. Yang punya adalah `questions`, tabel kuis Sora, dan selama tipe ini
-- tidak ada di sana penyusun soal tidak akan pernah bisa menuliskannya.
alter table questions drop constraint if exists questions_type_check;
alter table questions
  add constraint questions_type_check check (type in (
    'mcq_single', 'true_false', 'short_answer', 'essay',
    'mcq_multi', 'matching', 'ordering', 'fill_blank', 'upload_file',
    'statement_grid', 'true_false_two_tier'
  ));

-- 3. Perbaikan `semai_paket_topik` yang saya rusak di 177 -----------------------
--
-- Migrasi 177 menyusun ulang fungsi ini untuk menambah satu hal: paket ujian
-- yang baru lahir membawa `jumlah_butir_sampel = 12`. Badannya disalin dari
-- migrasi 145 — dan 145 BUKAN versi terakhirnya. Migrasi 147 sudah memperbaiki
-- fungsi yang sama karena gagal dengan "column reference paket_id is
-- ambiguous": `paket_id` adalah nama kolom keluaran fungsi, dan plpgsql
-- memperlakukan nama keluaran sebagai variabel, jadi `on conflict (paket_id,
-- …)` bisa dibaca dua arah.
--
-- Menyalin dari 145 menghidupkan lagi bug yang sudah mati tiga puluh migrasi.
-- Ia tidak terlihat sampai berkas ini dijalankan karena 177 sendiri tidak
-- pernah memanggil `semai_paket_topik`; yang memanggilnya bagian penyemaian di
-- bawah, dan di sanalah ia meledak.
--
-- Diperbaiki dengan menyalin dari 147 kali ini, lengkap dengan kedua
-- penjagaannya — `#variable_conflict use_column` dan `on conflict on constraint
-- paket_topik_item_pkey`, yang menyebut nama batasannya sehingga tidak ada nama
-- kolom yang perlu ditafsirkan sama sekali — ditambah satu baris dari 177 yang
-- memang dimaksudkan: ukuran sampel paket ujian.
create or replace function semai_paket_topik(p_topik_id text)
returns table (paket_id uuid, jenis text, level_bloom smallint, jumlah_butir bigint)
language plpgsql
volatile
security definer
set search_path = public
as $semai$
#variable_conflict use_column
declare
  v_paket uuid;
  v_level smallint;
begin
  -- Paket latihan: satu per level Bloom yang benar-benar ada butirnya.
  for v_level in
    select distinct b.bloom_level
    from question_bank_items b
    where b.topik_id = p_topik_id
      and coalesce(b.peruntukan, 'latihan') = 'latihan'
      and b.bloom_level is not null
    order by 1
  loop
    select p.id into v_paket
    from paket_topik p
    where p.topik_id = p_topik_id and p.jenis = 'latihan' and p.nomor = v_level;

    if v_paket is null then
      insert into paket_topik (topik_id, jenis, level_bloom, nomor)
      values (p_topik_id, 'latihan', v_level, v_level)
      returning paket_topik.id into v_paket;
    elsif exists (select 1 from practice_sessions s where s.paket_topik_id = v_paket) then
      continue;
    end if;

    insert into paket_topik_item (paket_id, question_bank_item_id, ord)
    select v_paket, b.id,
           row_number() over (order by b.created_at, b.id)
    from question_bank_items b
    where b.topik_id = p_topik_id
      and coalesce(b.peruntukan, 'latihan') = 'latihan'
      and b.bloom_level = v_level
    on conflict on constraint paket_topik_item_pkey do nothing;
  end loop;

  -- Paket ujian: satu, mencampur level (dokumen fondasi Bagian 3.7), dan
  -- menyajikan dua belas di antaranya kepada tiap murid (Protokol Bagian 3).
  if exists (
    select 1 from question_bank_items b
    where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
  ) then
    select p.id into v_paket
    from paket_topik p
    where p.topik_id = p_topik_id and p.jenis = 'ujian' and p.nomor = 1;

    if v_paket is null then
      insert into paket_topik (topik_id, jenis, level_bloom, nomor, jumlah_butir_sampel)
      values (p_topik_id, 'ujian', null, 1, 12)
      returning paket_topik.id into v_paket;
    end if;

    if not exists (select 1 from practice_sessions s where s.paket_topik_id = v_paket) then
      insert into paket_topik_item (paket_id, question_bank_item_id, ord)
      select v_paket, b.id, row_number() over (order by b.created_at, b.id)
      from question_bank_items b
      where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
      on conflict on constraint paket_topik_item_pkey do nothing;
    end if;
  end if;

  return query
    select p.id, p.jenis, p.level_bloom, count(i.question_bank_item_id)
    from paket_topik p
    left join paket_topik_item i on i.paket_id = p.id
    where p.topik_id = p_topik_id
    group by p.id, p.jenis, p.level_bloom, p.nomor
    order by p.jenis desc, p.nomor;
end;
$semai$;

-- 4. Butir dua tingkat, satu per topik ----------------------------------------
--
-- Butir DUMMY, sama seperti 169, 171, dan 176: ditulis untuk menguji mesinnya,
-- bukan untuk mengajar anak. Dicabut dengan satu perintah:
--
--   delete from question_bank_items where type = 'true_false_two_tier';
--
-- Bentuk kuncinya mengikuti apa yang sudah dibaca `nilai_jawaban` sejak 138:
-- `tier1` pernyataannya, `tier2` alasannya, `skor_sebagian` besaran nilai untuk
-- "pernyataan benar, alasan keliru" — dibiarkan pada bawaannya 0,5, yang oleh
-- FR5 memang diserahkan kepada tim konten.
create or replace function sisip_butir_dua_tingkat(p_butir jsonb, p_penulis uuid)
returns void
language plpgsql
as $fn$
begin
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
    p_penulis, 'true_false_two_tier',
    p_butir ->> 'prompt',
    p_butir -> 'opsi',
    p_butir -> 'kunci',
    1, 5, 'aktif',
    array['penalaran']::text[], 'ai_generated_verified', 'ujian',
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

  for v_butir in select * from jsonb_array_elements($dt$
[
  {"topik":"D-01","prompt":"Hasil dari (-4) × (-6) lebih besar daripada (-4) + (-6).","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Hasil kalinya positif, sedangkan hasil jumlahnya negatif","Keduanya negatif, tetapi hasil kalinya lebih dekat ke nol","Perkalian selalu menghasilkan bilangan yang lebih besar","Kedua hasilnya sama besar"]},"kunci":{"tier1":"true","tier2":"Hasil kalinya positif, sedangkan hasil jumlahnya negatif","skor_sebagian":0.5}},
  {"topik":"D-02","prompt":"Pecahan 2/5 lebih kecil daripada 45%.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["2/5 sama dengan 40%, dan 40% kurang dari 45%","Penyebut 5 lebih kecil daripada 45","Bentuk pecahan selalu lebih kecil daripada bentuk persen","2/5 sama dengan 25%"]},"kunci":{"tier1":"true","tier2":"2/5 sama dengan 40%, dan 40% kurang dari 45%","skor_sebagian":0.5}},
  {"topik":"D-03","prompt":"Jika 4 pekerja menyelesaikan sebuah pekerjaan dalam 6 hari, maka 12 pekerja menyelesaikannya dalam 18 hari.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Banyak pekerja dan lama pekerjaan berbalik nilai, jadi waktunya menjadi 2 hari","Waktunya tetap 6 hari karena pekerjaannya sama","Perbandingannya senilai, jadi 18 hari sudah benar","Waktunya menjadi 12 hari"]},"kunci":{"tier1":"false","tier2":"Banyak pekerja dan lama pekerjaan berbalik nilai, jadi waktunya menjadi 2 hari","skor_sebagian":0.5}},
  {"topik":"D-04","prompt":"Dua kelas yang rata-rata nilainya sama pasti memiliki sebaran nilai yang sama.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Rata-rata yang sama masih bisa berasal dari sebaran yang sangat berbeda","Rata-rata dan sebaran dihitung dengan cara yang sama","Sebaran hanya bergantung pada banyak siswanya","Rata-rata yang sama berarti setiap nilainya sama"]},"kunci":{"tier1":"false","tier2":"Rata-rata yang sama masih bisa berasal dari sebaran yang sangat berbeda","skor_sebagian":0.5}},
  {"topik":"D-05","prompt":"Menambahkan satu nilai yang jauh lebih besar pada sekumpulan data mengubah rata-ratanya lebih banyak daripada mediannya.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Rata-rata memakai seluruh nilai, sedangkan median bergantung pada posisi tengahnya","Median selalu berubah lebih besar daripada rata-rata","Keduanya selalu berubah sama banyak","Median tidak pernah berubah sama sekali"]},"kunci":{"tier1":"true","tier2":"Rata-rata memakai seluruh nilai, sedangkan median bergantung pada posisi tengahnya","skor_sebagian":0.5}},
  {"topik":"D-06","prompt":"Dua sudut yang saling berpelurus tidak mungkin keduanya lancip.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Jumlahnya harus 180°, sedangkan dua sudut lancip jumlahnya kurang dari itu","Sudut lancip memang tidak boleh berpasangan","Jumlah dua sudut berpelurus adalah 90°","Dua sudut lancip jumlahnya selalu lebih dari 180°"]},"kunci":{"tier1":"true","tier2":"Jumlahnya harus 180°, sedangkan dua sudut lancip jumlahnya kurang dari itu","skor_sebagian":0.5}},
  {"topik":"D-07","prompt":"Bentuk 3(x + 4) bernilai sama dengan 3x + 12 untuk setiap nilai x.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Sifat distributif mengalikan 3 dengan x dan dengan 4","Keduanya kebetulan sama hanya saat x = 0","Tanda kurung boleh dihapus tanpa mengubah apa pun","Angka 3 hanya dikalikan dengan suku pertamanya"]},"kunci":{"tier1":"true","tier2":"Sifat distributif mengalikan 3 dengan x dan dengan 4","skor_sebagian":0.5}},
  {"topik":"D-08","prompt":"Nilai 3² × 3⁴ sama dengan 9⁶.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Basisnya tetap 3 dan pangkatnya dijumlahkan, jadi hasilnya 3⁶","Pangkatnya dikalikan, jadi hasilnya 3⁸","Basisnya ikut dikalikan, jadi 9⁶ sudah benar","Hasilnya 9⁸"]},"kunci":{"tier1":"false","tier2":"Basisnya tetap 3 dan pangkatnya dijumlahkan, jadi hasilnya 3⁶","skor_sebagian":0.5}},
  {"topik":"D-09","prompt":"Penyelesaian dari -3x > 9 adalah x > -3.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Tanda dibalik saat kedua ruas dibagi bilangan negatif, jadi x < -3","Tandanya tetap, tetapi hasilnya x > 3","Tandanya dibalik dan hasilnya x < 3","Pertidaksamaan itu tidak punya penyelesaian"]},"kunci":{"tier1":"false","tier2":"Tanda dibalik saat kedua ruas dibagi bilangan negatif, jadi x < -3","skor_sebagian":0.5}},
  {"topik":"D-10","prompt":"Dua persegi panjang yang sudut-sudutnya sama besar pasti sebangun.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Sebangun menuntut sisi bersesuaiannya sebanding, dan itu belum tentu terpenuhi","Sudut yang sama besar sudah cukup untuk sebangun","Dua persegi panjang tidak pernah sebangun","Keduanya bahkan pasti kongruen"]},"kunci":{"tier1":"false","tier2":"Sebangun menuntut sisi bersesuaiannya sebanding, dan itu belum tentu terpenuhi","skor_sebagian":0.5}},
  {"topik":"D-11","prompt":"Setiap susunan enam persegi yang bersambung sisi dapat dilipat menjadi kubus.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Hanya 11 susunan yang benar-benar dapat dilipat menjadi kubus","Banyak perseginya seharusnya delapan","Semua susunan enam persegi selalu bisa dilipat","Kubus tidak punya jaring-jaring"]},"kunci":{"tier1":"false","tier2":"Hanya 11 susunan yang benar-benar dapat dilipat menjadi kubus","skor_sebagian":0.5}},
  {"topik":"D-12","prompt":"Segitiga dengan panjang sisi 8, 15, dan 17 adalah segitiga siku-siku.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["8² + 15² = 289, dan 17² juga 289","Ketiga sisinya bilangan bulat","17 adalah sisi terpanjangnya, dan itu sudah cukup","8 + 15 lebih besar daripada 17"]},"kunci":{"tier1":"true","tier2":"8² + 15² = 289, dan 17² juga 289","skor_sebagian":0.5}},
  {"topik":"D-13","prompt":"Himpunan pasangan {(1,4), (2,4), (3,4)} adalah sebuah fungsi.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Setiap anggota daerah asalnya dipasangkan tepat satu kali","Bayangannya semua sama, jadi justru bukan fungsi","Fungsi tidak boleh punya bayangan yang berulang","Setiap anggota daerah asal harus punya bayangan yang berbeda"]},"kunci":{"tier1":"true","tier2":"Setiap anggota daerah asalnya dipasangkan tepat satu kali","skor_sebagian":0.5}},
  {"topik":"D-14","prompt":"Sistem 2x + 4y = 10 dan x + 2y = 5 memiliki tepat satu penyelesaian.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Persamaan pertama dua kali persamaan kedua, jadi penyelesaiannya tak berhingga","Kedua garisnya sejajar, jadi tidak ada penyelesaian","Setiap SPLDV selalu punya tepat satu penyelesaian","Penyelesaiannya tepat dua"]},"kunci":{"tier1":"false","tier2":"Persamaan pertama dua kali persamaan kedua, jadi penyelesaiannya tak berhingga","skor_sebagian":0.5}},
  {"topik":"D-15","prompt":"Barisan 2, 4, 8, 16 adalah barisan aritmetika.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Selisih dua suku berurutannya tidak tetap; yang tetap justru hasil baginya","Selisihnya tetap, yaitu 2","Barisan itu bukan barisan apa pun","Barisan itu aritmetika sekaligus geometri"]},"kunci":{"tier1":"false","tier2":"Selisih dua suku berurutannya tidak tetap; yang tetap justru hasil baginya","skor_sebagian":0.5}},
  {"topik":"D-16","prompt":"Pencerminan terhadap sumbu Y memetakan titik (3, -5) ke titik (-3, -5).","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Pencerminan terhadap sumbu Y hanya mengubah tanda absisnya","Pencerminan terhadap sumbu Y hanya mengubah tanda ordinatnya","Kedua tandanya ikut berubah","Titik itu tidak berpindah"]},"kunci":{"tier1":"true","tier2":"Pencerminan terhadap sumbu Y hanya mengubah tanda absisnya","skor_sebagian":0.5}},
  {"topik":"D-17","prompt":"Luas juring dengan sudut pusat 120° adalah sepertiga luas lingkarannya.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["120° adalah sepertiga dari 360°","120° adalah sepertiga dari 180°","Luas juring tidak bergantung pada sudut pusatnya","Sepertiga berlaku untuk sudut pusat 90°"]},"kunci":{"tier1":"true","tier2":"120° adalah sepertiga dari 360°","skor_sebagian":0.5}},
  {"topik":"D-18","prompt":"Kelompok yang jangkauannya lebih besar pasti memiliki rata-rata yang lebih besar.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Jangkauan menggambarkan sebaran, bukan pemusatan, jadi keduanya bisa tidak sejalan","Jangkauan dan rata-rata selalu bergerak bersama","Jangkauan yang besar berarti datanya lebih banyak","Rata-rata memang dihitung dari jangkauannya"]},"kunci":{"tier1":"false","tier2":"Jangkauan menggambarkan sebaran, bukan pemusatan, jadi keduanya bisa tidak sejalan","skor_sebagian":0.5}},
  {"topik":"D-19","prompt":"Sebuah koin dilempar 10 kali dan muncul 8 angka. Peluang munculnya angka pada lemparan berikutnya lebih besar daripada 1/2.","opsi":{"tier2_prompt":"Alasannya:","tier2_choices":["Setiap lemparan saling bebas, jadi peluangnya tetap 1/2","Hasil sebelumnya membuat angka lebih mungkin muncul lagi","Peluangnya menjadi 8/10","Peluangnya justru lebih kecil daripada 1/2 untuk menyeimbangkan"]},"kunci":{"tier1":"false","tier2":"Setiap lemparan saling bebas, jadi peluangnya tetap 1/2","skor_sebagian":0.5}}
]
$dt$) loop
    perform sisip_butir_dua_tingkat(v_butir, v_penulis);
  end loop;

  -- Paket disusun ulang supaya butir baru masuk kolam ujian tiap topik. Paket
  -- yang sudah dikerjakan tetap dilewati `semai_paket_topik` — D-02, D-03,
  -- D-04, D-08 tidak berubah, seperti sejak 176.
  foreach v_topik in array array['D-01','D-02','D-03','D-04','D-05','D-06','D-07','D-08','D-09','D-10','D-11','D-12','D-13','D-14','D-15','D-16','D-17','D-18','D-19'] loop
    perform semai_paket_topik(v_topik);
  end loop;
end;
$$;

drop function if exists sisip_butir_dua_tingkat(jsonb, uuid);

notify pgrst, 'reload schema';
