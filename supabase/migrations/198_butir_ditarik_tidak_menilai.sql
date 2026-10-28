-- ============================================================
-- Butir yang ditarik berhenti ikut menilai murid
--
-- Menarik butir artinya menghentikannya karena ada yang salah padanya — kunci
-- yang keliru, angka yang tidak konsisten. Tapi sampai sekarang yang berhenti
-- cuma PENYAJIANNYA: `paket_butir_murid` dan `practice_draw_questions` sudah
-- menyaring `aktif`, sedangkan perhitungan nilai tidak. Akibatnya jawaban atas
-- butir yang ditarik tetap ikut menentukan Skor Putaran 1, nilai akhir,
-- ketuntasan topik, dan pemicu eskalasi tutor — nilai anak dikurangi oleh
-- soal yang justru sudah dinyatakan salah.
--
-- DUA PERBAIKAN, keduanya `create or replace` dengan tanda tangan yang sama:
--
--   1. `skor_paket_topik` hanya menghitung jawaban atas butir `aktif`, dan
--      ukuran paketnya (butir yang dihitung sebagai "seluruh paket") ikut
--      menyaring yang sama — termasuk untuk paket ujian yang daftar butirnya
--      dibekukan di sesi pertama. Tanpa yang kedua, butir ujian yang ditarik
--      masih dihitung sebagai bagian paket tapi jawabannya tidak, dan Skor
--      Putaran 1 ujian itu menjadi kosong.
--   2. `topik_tersedia` menghitung penguasaan topik (untuk prasyarat) hanya
--      dari butir `aktif`. Sebelumnya butir ditarik yang belum pernah dijawab
--      tetap masuk penyebut dengan nilai nol.
--
-- YANG BERUBAH UNTUK MURID: bila sebuah butir ditarik, skor dan ketuntasan
-- yang sudah dihitung bisa bergeser — naik bila jawabannya salah, turun bila
-- benar. Itu disengaja. Hari ini tidak ada butir yang ditarik, jadi migrasi ini
-- tidak mengubah satu angka pun sekarang.
--
-- YANG TIDAK BERUBAH: jawaban murid tetap tersimpan, dan tinjauan sesi lama
-- (`practice_session_review`) tetap menampilkan butir yang ditarik.
-- `semai_paket_topik` juga tetap memasukkan butir ditarik ke susunan paket;
-- yang disaring adalah penyajian dan penilaian, bukan keanggotaan.
--
-- Jalankan SESUDAH 197.
-- ============================================================

-- 1. Skor paket ---------------------------------------------------------------

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
  skor_akhir numeric,
  -- Berapa butir paket ini yang sudah punya jawaban di siklus berjalan, dari
  -- putaran mana pun. Dipakai gerbang ketuntasan (192) untuk membedakan "nilai
  -- akhirnya bagus" dari "nilai akhirnya bagus atas tiga butir dari delapan".
  butir_terjawab integer
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
      -- SIKLUS BERJALAN SAJA. Putaran 1 sebuah siklus baru harus benar-benar
      -- putaran pertama; kalau sesi siklus lama ikut terhitung, `row_number()`
      -- tidak akan pernah mengembalikan 1 lagi dan ketuntasan yang boleh
      -- diraih ulang tidak pernah bisa diraih.
      and s.started_at > coalesce(
        batas_siklus_paket(p_learner_id, p_paket_id), '-infinity'::timestamptz
      )
      -- SESI YANG DITINGGALKAN BUKAN PUTARAN (191). Dua syarat, dan keduanya
      -- perlu: sesi tanpa jawaban adalah ketukan yang tidak jadi, dan sesi yang
      -- belum selesai adalah pekerjaan yang masih berjalan. Salah satunya saja
      -- tidak cukup — sesi yang dijawab separuh lalu ditinggalkan lolos syarat
      -- pertama, dan sesi kosong yang kebetulan pernah dibuka halaman hasilnya
      -- lolos syarat kedua.
      and s.finished_at is not null
      and exists (
        select 1 from practice_answers a where a.session_id = s.id
      )
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
    join question_bank_items b
      on b.id = a.question_bank_item_id and b.status_verifikasi = 'aktif'
    where sesi.putaran = 1
    order by a.question_bank_item_id, a.answered_at desc
  ),
  jawaban_akhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    join question_bank_items b
      on b.id = a.question_bank_item_id and b.status_verifikasi = 'aktif'
    order by a.question_bank_item_id, a.answered_at desc
  ),
  ukuran as (
    select coalesce(
      nullif(
        (select count(*)
         from paket_butir_murid(p_learner_id, p_paket_id) pb
         join question_bank_items b
           on b.id = pb.item_id and b.status_verifikasi = 'aktif'),
        0
      ),
      (select p.jumlah_butir_sampel from paket_topik p where p.id = p_paket_id),
      0
    )::integer as butir
  )
  select
    coalesce((select max(sesi.putaran) from sesi), 0)::integer,
    coalesce((select bool_or(sesi.finished_at is not null) from sesi where sesi.putaran = 1), false),
    (select butir from ukuran),
    (select count(*) from jawaban_putaran_1)::integer,
    -- PENJAGA PUTARAN PENUH (191). Putaran pertama yang tidak mencakup seluruh
    -- butir paket tidak punya Skor Putaran 1 — bukan nol, melainkan tidak ada,
    -- karena yang belum diukur bukan yang bernilai nol.
    case
      when (select butir from ukuran) > 0
       and (select count(*) from jawaban_putaran_1) < (select butir from ukuran)
      then null
      else (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
              from jawaban_putaran_1)
    end,
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_akhir),
    (select count(*) from jawaban_akhir)::integer;
$$;

revoke all on function skor_paket_topik(uuid, uuid) from public, anon, authenticated;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1, skor akhir, dan banyak butir terjawab sebuah paket topik untuk satu murid di siklus berjalan. Putaran dihitung dari sesi yang selesai dan berisi jawaban saja (191); hanya jawaban atas butir aktif yang dihitung (198).';

-- 2. Penguasaan topik untuk prasyarat ----------------------------------------

create or replace function topik_tersedia(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  topik_id text,
  nama text,
  elemen text,
  jenjang_kelas text,
  penanda_remediasi text,
  urutan int,
  jumlah_paket bigint,
  prasyarat_terpenuhi boolean,
  prasyarat_kurang text[]
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  ambang as (
    select coalesce((select nilai::text::numeric from pengaturan where kunci = 'ambang_mastery'), 0.75) as nilai
  ),
  -- Penguasaan tiap topik dari jawaban terakhir tiap butir di seluruh paket
  -- topik itu. Butir yang belum pernah dijawab terhitung belum dikuasai —
  -- penyebutnya seluruh butir paket, bukan yang kebetulan sudah disentuh.
  nilai_topik as (
    select p.topik_id,
           sum(coalesce(j.score, 0)) as skor,
           sum(coalesce(j.max_score, b.weight)) as maks
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    join question_bank_items b on b.id = i.question_bank_item_id
    left join lateral (
      select a.score, a.max_score
      from practice_answers a
      join practice_sessions s on s.id = a.session_id
      where a.learner_id = (select learner from me)
        and s.finished_at is not null
        and a.question_bank_item_id = i.question_bank_item_id
      order by a.answered_at desc
      limit 1
    ) j on true
    where p.jenis = 'latihan'
      and b.status_verifikasi = 'aktif'
    group by p.topik_id
  ),
  tuntas as (
    select n.topik_id
    from nilai_topik n, ambang
    where n.maks > 0 and n.skor / n.maks >= ambang.nilai
  ),
  berisi as (
    select p.topik_id, count(distinct p.id) as jumlah
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    group by p.topik_id
  )
  select t.id,
         t.nama,
         t.elemen,
         t.jenjang_kelas,
         t.penanda_remediasi,
         t.urutan,
         coalesce(k.jumlah, 0),
         not exists (
           select 1 from topik_prasyarat pr
           where pr.topik_id = t.id and pr.prasyarat_id not in (select topik_id from tuntas)
         ),
         coalesce(
           array(
             select pr.prasyarat_id from topik_prasyarat pr
             where pr.topik_id = t.id and pr.prasyarat_id not in (select topik_id from tuntas)
             order by pr.prasyarat_id
           ),
           '{}'::text[]
         )
  from topik t
  join berisi k on k.topik_id = t.id
  where t.aktif
    and (select learner from me) is not null
  order by t.urutan;
$$;

-- 3. Cetakan status disegarkan ------------------------------------------------
--
-- Definisi skor berubah, jadi cetakan yang tertinggal menampilkan status lama
-- sampai anaknya kebetulan menyelesaikan paket berikutnya.
do $$
declare v_learner uuid;
begin
  for v_learner in select distinct learner_id from status_topik_siswa loop
    perform evaluasi_unlock(v_learner);
  end loop;
end $$;

notify pgrst, 'reload schema';
