-- ============================================================
-- Berapa lama sebuah soal dikerjakan, dan dalam urutan apa opsinya terlihat
--
-- Dua tagihan PRD yang sama-sama tentang MENCATAT KEADAAN, bukan mengubah
-- perilaku: FR6 (waktu per butir) dan bagian FR3 yang menuntut urutan opsi
-- diacak ulang tiap putaran serta urutannya dicatat.
--
-- KENAPA WAKTU. Protokol Uji Coba Bagian 6 dan 8 menjadikan "total waktu
-- efektif per soal" sebagai kriteria keluar pilot — angka yang dipakai
-- memproyeksikan kebutuhan produksi saat ekspansi. Yang tersimpan hari ini
-- cuma `answered_at`, jadi durasi butir hanya bisa ditaksir dari selisih antar
-- jawaban: butir pertama tiap sesi tidak punya angka sama sekali, dan setiap
-- anak yang meninggalkan layarnya sebentar mencemari butir sesudahnya.
--
-- KENAPA BUKAN `sesi_jeda_log`. Skema Data Bagian 3.2b merancang tabel jeda
-- tingkat SESI, bersandar pada `sesi_pengerjaan.status = 'dijeda'`. Keadaan itu
-- tidak ada di sini: `practice_sessions` tidak punya status, dan sesi yang
-- ditinggalkan cuma sesi yang belum `finished_at`. Membangun tabel untuk
-- keadaan yang tidak pernah ditulis siapa pun berarti tabel yang selalu kosong,
-- dan angka waktu yang tetap salah.
--
-- Yang dipakai sebagai gantinya: jeda dicatat PER BUTIR, dalam milidetik, dari
-- lamanya halaman tidak terlihat selagi butir itu terbuka. Itu justru
-- granularitas yang dibutuhkan — yang mau dijawab Protokol adalah "berapa lama
-- satu soal dikerjakan", dan jeda tingkat sesi tetap harus dibagi-bagi ke butir
-- sebelum bisa menjawabnya.
--
-- WAKTU DARI BROWSER, DAN ITU DISADARI. Jam yang mengirimnya adalah jam laptop
-- anak; ia bisa salah, dan orang yang ingin terlihat cepat bisa mengarangnya.
-- Untuk Tahap 0 itu diterima dengan alasan yang sama seperti keputusan timer
-- sisi klien di FR4: peserta pilot kelompok kecil yang terpantau, dan angka ini
-- dipakai memperkirakan beban produksi konten — bukan menilai anak. Yang tetap
-- dijaga: nilai yang mustahil ditolak di gerbang, supaya satu jam yang ngawur
-- tidak menyeret rata-ratanya.
-- ============================================================

-- 1. Kolom ---------------------------------------------------------------------

alter table practice_answers
  add column if not exists waktu_mulai_item timestamptz,
  add column if not exists jeda_ms integer,
  add column if not exists urutan_opsi jsonb;

comment on column practice_answers.waktu_mulai_item is
  'Kapan butir ini mulai terlihat di layar (FR6). Dari browser; null untuk jawaban lama dan untuk waktu yang tidak masuk akal.';
comment on column practice_answers.jeda_ms is
  'Lama halaman tidak terlihat selagi butir ini terbuka, milidetik (FR6). Pengganti sesi_jeda_log pada granularitas butir.';
comment on column practice_answers.urutan_opsi is
  'Urutan opsi seperti yang DILIHAT anaknya saat menjawab (FR3). Hanya jejak; penilaian membandingkan teks, tidak pernah posisi.';

-- 2. Pencatat jawaban ----------------------------------------------------------
--
-- Fungsinya DIHAPUS lalu dibuat ulang, bukan ditambahi argumen lewat `create or
-- replace`. Argumen baru menghasilkan tanda tangan baru, dan dua overload
-- bernama sama membuat PostgREST memilih berdasarkan argumen mana yang
-- kebetulan disebut pemanggil — peringatan yang sudah ditulis migrasi 146, dan
-- di sini akibatnya akan lebih halus lagi: yang lama tetap bekerja, cuma diam
-- diam tidak pernah mencatat waktu.
drop function if exists practice_record_answer(uuid, uuid, jsonb, text);

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
  v_tipe text;
  v_opsi jsonb;
  v_kunci jsonb;
  v_bobot numeric;
  v_pembahasan text;
  v_nilai numeric;
  v_waktu_mulai timestamptz;
  v_jeda integer;
begin
  select ps.learner_id, ps.started_at
    into v_learner, v_mulai_sesi
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
    and p_item_id = any (ps.item_ids);

  if v_learner is null then return; end if;

  select b.type,
         b.options,
         b.correct_answer,
         case when coalesce(b.weight, 0) = 0 then 1 else b.weight end,
         b.explanation
    into v_tipe, v_opsi, v_kunci, v_bobot, v_pembahasan
  from question_bank_items b
  where b.id = p_item_id;

  if v_tipe is null then return; end if;

  v_nilai := nilai_jawaban(v_tipe, v_opsi, v_kunci, p_response, v_bobot);
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

-- 3. Waktu efektif, sampai ke rapor tutor --------------------------------------
--
-- `tutor_pengukuran_paket` (150) ikut dibuat ulang supaya angkanya punya tempat
-- untuk muncul. Fungsi yang mengembalikan angka tanpa ada layar yang
-- membacanya adalah angka yang tidak pernah diperiksa, dan Protokol menuntut
-- angka ini DIUKUR, bukan tersedia.
--
-- Rata-rata, bukan jumlah: yang ditanyakan Protokol Bagian 6 adalah waktu per
-- SOAL. Dan hanya dari butir yang punya `waktu_mulai_item` — butir lama tidak
-- ikut menurunkan rata-rata dengan nol yang menyamar sebagai kecepatan.
drop function if exists tutor_pengukuran_paket(uuid);

create or replace function tutor_pengukuran_paket(p_learner_id uuid)
returns table (
  topik_id text,
  topik_nama text,
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric,
  detik_per_butir numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select t.id, t.nama, p.id, p.jenis, p.level_bloom, p.nomor,
         s.putaran, s.putaran_1_selesai, s.butir_paket,
         s.butir_terjawab_putaran_1, s.skor_putaran_1, s.skor_akhir,
         (
           select avg(
             greatest(
               extract(epoch from a.answered_at - a.waktu_mulai_item)
                 - coalesce(a.jeda_ms, 0) / 1000.0,
               0
             )
           )
           from practice_answers a
           join practice_sessions ps on ps.id = a.session_id
           where ps.paket_topik_id = p.id
             and a.learner_id = p_learner_id
             and a.waktu_mulai_item is not null
         )
  from paket_topik p
  join topik t on t.id = p.topik_id
  cross join lateral skor_paket_topik(p_learner_id, p.id) s
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.tutor_penanggung_jawab_id = auth.uid()
        )
  order by t.urutan, p.jenis desc, p.nomor;
$$;

comment on function tutor_pengukuran_paket(uuid) is
  'Skor Putaran 1, skor akhir, dan waktu efektif rata-rata per butir tiap paket seorang murid (PRD FR8, FR6). Gerbang: admin atau tutor penanggung jawab.';

revoke all on function tutor_pengukuran_paket(uuid) from public, anon;
grant execute on function tutor_pengukuran_paket(uuid) to authenticated;

notify pgrst, 'reload schema';
