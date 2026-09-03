-- ============================================================
-- Skema 'pengukuran' akhirnya dipanggil — dan lantainya dipasang
--
-- Migrasi 138 menulis aturan skoring yang diminta PRD FR5 (correction for
-- guessing pada Benar-Salah, partial credit pada multi-select), memberinya
-- nama `p_skema = 'pengukuran'`, lalu menutup dirinya dengan catatan jujur:
-- "`practice_record_answer()` masih memanggil skema default. Ia baru perlu
-- tahu skema begitu ada paket Bloom yang membawanya — dan tabel `paket_soal`
-- belum ada."
--
-- Paket Bloom itu lahir tujuh migrasi kemudian, di 145, dengan nama
-- `paket_topik` — bukan `paket_soal`. Syarat yang ditunggu 138 sudah lewat;
-- nama yang ditunggu tidak pernah muncul, jadi tidak ada yang menagihnya.
-- Sejak itu setiap butir pilot dinilai dengan skema 'sederhana': soal
-- Benar-Salah tidak dikoreksi terhadap tebakan, multi-select tetap
-- semua-atau-tidak. Migrasi ini menagih utang itu.
--
-- YANG BERUBAH ARTINYA. Dua kekeliruan itu berlawanan arah dan selama ini
-- saling menutupi di angka yang sama: 'sederhana' MELEBIHKAN Benar-Salah
-- (menebak seluruh paket bernilai 50%, bukan nol) dan MENGURANGI multi-select
-- (paham sebagian tercatat nol). Karena keduanya bertemu di Skor Putaran 1,
-- tidak ada nilai yang pernah tampak janggal di layar tutor — itu sebabnya
-- cacat ini bertahan tiga puluh enam migrasi.
--
-- SIAPA YANG DAPAT SKEMA MANA, dan alasannya:
--
--   paket_topik_id ADA        -> 'pengukuran'
--       Enam paket latihan dan paket ujiannya. Inilah pengukuran yang
--       dimaksud dokumen fondasi Bagian 3.4, dan satu-satunya angka yang
--       menentukan `tuntas`.
--
--   probe_topik_id ADA        -> 'sederhana'
--       Retest dan kunjungan kembali. Keduanya pertanyaan lulus/tidak
--       terhadap satu ambang, bukan pengukuran penguasaan per level, dan
--       kolam probe hari ini hampir seluruhnya `mcq_single` — tipe yang
--       nilainya identik di kedua skema. Mengubahnya berarti menggeser arti
--       hasil retest tanpa satu pun angka yang berubah karenanya.
--
--   penempatan_topik_id ADA   -> 'sederhana'
--       DAN INI KEPUTUSAN, bukan kelalaian. Tes penempatan (173) menentukan
--       level yang dibebaskan dari `not a.is_correct` — semua benar, tanpa
--       ambang. `is_correct` dihitung `nilai >= bobot`, jadi di 'pengukuran'
--       jawaban multi-select yang benar sebagian akan tercatat `false` dan
--       bertindak persis seperti jawaban salah. Aturannya sama, tapi tidak
--       ada yang berubah untuk anaknya — sementara koreksi tebakan pada
--       delapan butir yang harus benar SEMUA adalah hukuman kedua untuk
--       risiko yang sudah ditutup oleh syarat "semua benar" itu sendiri.
--
--   sisanya                   -> 'sederhana'
--       Latihan biasa, asesmen dan try out yang dibuat tutor di Sora. Persis
--       alasan 138 memilih parameter alih-alih mengubah satu fungsi untuk
--       semua orang: nilai kuis yang sudah berjalan tidak boleh bergeser
--       karena pilot butuh aturan lain.
--
-- LANTAINYA. 138 mewajibkan pemanggil yang MENJUMLAHKAN memasang `max(0, …)`,
-- karena satu butir Benar-Salah di 'pengukuran' boleh bernilai negatif dan
-- memotongnya per butir akan menghapus koreksi yang baru saja dipasang.
-- Kewajiban itu tidak pernah dipenuhi siapa pun. Dua tempat menjumlahkan skor
-- paket, dan keduanya diperbaiki di sini:
--
--   `skor_paket_topik()`  (149) — Skor Putaran 1 dan skor akhir, yang
--                          menentukan `tuntas` dan mengisi layar tutor.
--   `topik_paket_state()` (146) — angka per paket di layar keluarga, yang
--                          lewat `persenDari()` bisa menjadi persen negatif.
--
-- Yang TIDAK perlu lantai, dan sengaja tidak disentuh: trigger retest (164,
-- 165) dan penempatan (173) menjumlahkan skor sesi probe dan penempatan —
-- keduanya tetap 'sederhana' di atas, jadi tidak ada nilai negatif yang bisa
-- sampai ke sana. Menambah lantai di situ berarti menjaga keadaan yang tidak
-- bisa terjadi, dan menyembunyikannya kalau suatu hari terjadi.
--
-- YANG SUDAH TERCATAT TIDAK BERUBAH. `practice_answers.score` disimpan, bukan
-- dihitung ulang; migrasi ini hanya mengubah cara jawaban BERIKUTNYA dinilai.
-- Selama uji coba masih memakai butir dummy, jalan yang bersih adalah
-- mengosongkan hasil uji coba sesudah migrasi ini — bukan menambal dua arti
-- yang hidup di kolom yang sama. Itu keputusan yang diambil di luar migrasi.
--
-- DUA HAL DARI 138 MASIH TERBUKA, dan tetap terbuka di sini:
--   1. `statement_grid` dinilai sama di kedua skema. Bentuknya deret
--      Benar-Salah, tapi FR5 tidak menyebutnya — pertanyaan untuk tim konten.
--   2. `true_false_two_tier` punya aturan skoring dan tidak punya bentuk soal:
--      ia tidak ada di `TipeSoal` (`lib/belajar/tipe-soal.ts`), tidak dirender
--      `InputSoal`, tidak ada di daftar tipe migrasi 061, dan nol butir
--      memakainya. Tuntutan ketiga FR5 belum bisa dipakai siapa pun.
--
-- Jalankan SESUDAH 174.
-- ============================================================

-- 1. Jawaban dinilai dengan skema sesinya --------------------------------------
--
-- Menggantikan versi migrasi 152. Yang berubah hanya dua baris: sesinya ikut
-- ditanya paketnya, dan skema itu diteruskan ke `nilai_jawaban()`. Sisanya —
-- gerbang kewarasan waktu, urutan opsi — disalin apa adanya.
create or replace function practice_record_answer(
  p_session_id uuid,
  p_item_id uuid,
  p_response jsonb,
  p_access_code text default '',
  p_waktu_mulai timestamptz default null,
  p_jeda_ms integer default null,
  p_urutan_opsi jsonb default null
)
returns table (skor numeric, skor_maks numeric, benar boolean, pembahasan text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_mulai_sesi timestamptz;
  v_paket uuid;
  v_skema text;
  v_tipe text;
  v_opsi jsonb;
  v_kunci jsonb;
  v_bobot numeric;
  v_pembahasan text;
  v_nilai numeric;
  v_waktu_mulai timestamptz;
  v_jeda integer;
begin
  select ps.learner_id, ps.started_at, ps.paket_topik_id
    into v_learner, v_mulai_sesi, v_paket
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
    and p_item_id = any (ps.item_ids);

  if v_learner is null then return; end if;

  -- Skema ditentukan SESINYA, bukan butirnya: satu paket tidak menilai
  -- separuh soalnya dengan aturan yang berbeda, dan butir yang sama bisa
  -- muncul di paket pilot hari ini dan di try out tutor besok.
  v_skema := case when v_paket is not null then 'pengukuran' else 'sederhana' end;

  select b.type,
         b.options,
         b.correct_answer,
         case when coalesce(b.weight, 0) = 0 then 1 else b.weight end,
         b.explanation
    into v_tipe, v_opsi, v_kunci, v_bobot, v_pembahasan
  from question_bank_items b
  where b.id = p_item_id;

  if v_tipe is null then return; end if;

  v_nilai := nilai_jawaban(v_tipe, v_opsi, v_kunci, p_response, v_bobot, v_skema);
  if v_nilai is null then return; end if;

  -- Gerbang kewarasan waktu, bukan gerbang keamanan. Yang ditolak: waktu mulai
  -- di masa depan, dan waktu mulai yang mendahului sesinya sendiri. Keduanya
  -- mustahil, dan keduanya menghasilkan durasi yang akan diam-diam masuk ke
  -- rata-rata sebagai angka besar. Yang ditolak jadi null — "tidak tahu" adalah
  -- keadaan yang bisa dihitung; angka ngawur tidak.
  v_waktu_mulai := case
    when p_waktu_mulai is null then null
    when p_waktu_mulai > now() + interval '1 minute' then null
    when v_mulai_sesi is not null and p_waktu_mulai < v_mulai_sesi - interval '1 minute' then null
    else p_waktu_mulai
  end;

  v_jeda := case when p_jeda_ms is null or p_jeda_ms < 0 then null else p_jeda_ms end;

  -- `is_correct` tetap berarti NILAI PENUH, tidak digeser jadi "nilainya di
  -- atas nol". Jawaban multi-select yang benar sebagian memang belum benar,
  -- dan pembukaan putaran berikutnya (146) memilih butir yang belum penuh —
  -- melonggarkan artinya di sini akan membuat butir setengah benar tidak
  -- pernah ditawarkan lagi.
  insert into practice_answers (
    session_id, learner_id, question_bank_item_id, response, is_correct, score, max_score,
    waktu_mulai_item, jeda_ms, urutan_opsi
  )
  values (
    p_session_id, v_learner, p_item_id, p_response, v_nilai >= v_bobot, v_nilai, v_bobot,
    v_waktu_mulai, v_jeda, p_urutan_opsi
  );

  return query select v_nilai, v_bobot, v_nilai >= v_bobot, v_pembahasan;
end;
$$;

comment on function practice_record_answer(uuid, uuid, jsonb, text, timestamptz, integer, jsonb) is
  'Mencatat satu jawaban dan menilainya di server. Skemanya ditentukan sesinya: sesi paket peta memakai ''pengukuran'' (FR5), sisanya ''sederhana''.';

-- 2. Lantai pada Skor Putaran 1 dan skor akhir ---------------------------------
--
-- Menggantikan versi migrasi 149. Yang berubah: `greatest(0, …)` pada kedua
-- penjumlahan, memenuhi kewajiban yang ditulis 138.
--
-- Lantainya di PEMBILANG, bukan di hasil baginya — keduanya menghasilkan angka
-- yang sama, tapi yang pertama menyatakan maksudnya: yang tidak boleh negatif
-- adalah perolehan anak atas paket itu, bukan pecahannya.
create or replace function skor_paket_topik(
  p_learner_id uuid,
  p_paket_id uuid
)
returns table (
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with sesi as (
    select s.id,
           s.finished_at,
           row_number() over (order by s.started_at, s.id) as putaran
    from practice_sessions s
    where s.learner_id = p_learner_id
      and s.paket_topik_id = p_paket_id
  ),
  -- `distinct on` per butir, bukan `sum` atas semua baris: 114 menyisipkan
  -- jawaban tanpa kunci unik, jadi satu soal bisa punya dua baris karena
  -- ketukan ganda. Menjumlahkan semuanya membuat penyebutnya melar dan skornya
  -- turun tanpa sebab.
  jawaban_putaran_1 as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    where sesi.putaran = 1
    order by a.question_bank_item_id, a.answered_at desc
  ),
  -- Skor akhir: keadaan TERAKHIR tiap butir, lintas putaran. Putaran berikutnya
  -- hanya memuat butir yang nilainya belum penuh (146), jadi jawaban terakhir
  -- sebuah butir memang keadaan akhirnya — termasuk nilai sebagian multi-select,
  -- sesuai FR5.
  jawaban_akhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    order by a.question_bank_item_id, a.answered_at desc
  )
  select
    coalesce((select max(sesi.putaran) from sesi), 0)::integer,
    coalesce((select bool_or(sesi.finished_at is not null) from sesi where sesi.putaran = 1), false),
    (select count(*) from paket_topik_item i where i.paket_id = p_paket_id)::integer,
    (select count(*) from jawaban_putaran_1)::integer,
    -- Penyebutnya bobot butir yang DIJAWAB, bukan bobot seluruh paket. Sesi yang
    -- selesai normal menjawab semuanya, jadi keduanya sama; yang berbeda cuma
    -- sesi yang ditinggalkan, dan di situ `butir_terjawab_putaran_1` yang
    -- memberi tahu pembacanya bahwa angka ini tidak mewakili paket penuh.
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_putaran_1),
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_akhir);
$$;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1 dan skor akhir sebuah paket peta untuk satu murid (FR5), berlantai nol seperti diminta skema ''pengukuran''. Dihitung, tidak disimpan. TANPA gerbang — pemanggil dari aplikasi memakai topik_skor_paket().';

-- 3. Lantai pada angka paket di layar keluarga ---------------------------------
--
-- Menggantikan versi migrasi 146. Yang berubah satu baris: `sum(j.score)`
-- berlantai nol. Penggolongan per butir di bawahnya TIDAK disentuh — ia sudah
-- benar apa adanya, karena `score <= 0` memang sudah masuk "salah", dan
-- `hasilSoal()` di sisi React membaca angka negatif dengan cara yang sama.
create or replace function topik_paket_state(
  p_topik_id text,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  jumlah bigint,
  benar bigint,
  sebagian bigint,
  salah bigint,
  belum bigint,
  skor numeric,
  maks numeric,
  putaran bigint,
  terkunci boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  paket as (
    select p.id, p.jenis, p.level_bloom, p.nomor
    from paket_topik p
    where p.topik_id = p_topik_id
      and (select learner from me) is not null
  ),
  -- Jawaban terakhir tiap butir, HANYA dari putaran yang selesai. Putaran yang
  -- ditinggalkan di tengah tidak bernilai — tidak menaikkan, tidak menurunkan.
  jawaban as (
    select distinct on (a.question_bank_item_id, s.paket_topik_id)
           s.paket_topik_id, a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
      and s.paket_topik_id is not null
    order by a.question_bank_item_id, s.paket_topik_id, a.answered_at desc
  ),
  putaran as (
    select s.paket_topik_id, count(*) as n
    from practice_sessions s
    where s.learner_id = (select learner from me)
      and s.paket_topik_id is not null
      and s.finished_at is not null
    group by s.paket_topik_id
  )
  select k.id,
         k.jenis,
         k.level_bloom,
         k.nomor,
         count(i.item_id),
         count(*) filter (
           where j.question_bank_item_id is not null
             and coalesce(j.max_score, 0) > 0
             and coalesce(j.score, 0) >= j.max_score
         ),
         count(*) filter (
           where j.question_bank_item_id is not null
             and coalesce(j.score, 0) > 0
             and coalesce(j.score, 0) < coalesce(j.max_score, 0)
         ),
         count(*) filter (
           where j.question_bank_item_id is not null
             and (coalesce(j.score, 0) <= 0 or coalesce(j.max_score, 0) <= 0)
         ),
         count(*) filter (where j.question_bank_item_id is null),
         greatest(0, coalesce(sum(j.score), 0)),
         coalesce(sum(j.max_score), 0),
         coalesce(max(p.n), 0),
         bool_or(l.paket_id is not null)
  from paket k
  cross join lateral topik_paket_items(k.id, coalesce(p_access_code, ''), p_learner_id) i
  left join jawaban j
    on j.question_bank_item_id = i.item_id and j.paket_topik_id = k.id
  left join putaran p on p.paket_topik_id = k.id
  left join paket_topik_kunci l
    on l.paket_id = k.id and l.learner_id = (select learner from me)
  group by k.id, k.jenis, k.level_bloom, k.nomor
  order by k.jenis desc, k.nomor;
$$;

comment on function topik_paket_state(text, text, uuid) is
  'Keadaan tiap paket sebuah topik untuk satu murid: jumlah butir, hasil per butir, skor berlantai nol, putaran, dan kuncinya.';

-- 4. Hak -----------------------------------------------------------------------
--
-- `create or replace` mempertahankan hak yang sudah ada; ditulis ulang di sini
-- supaya berkas ini bisa dibaca tanpa membuka 146 dan 149 lebih dulu.
revoke all on function skor_paket_topik(uuid, uuid) from public, anon, authenticated;
grant execute on function practice_record_answer(uuid, uuid, jsonb, text, timestamptz, integer, jsonb) to anon, authenticated;
grant execute on function topik_paket_state(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
