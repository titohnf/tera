-- ============================================================
-- Putaran adalah yang benar-benar dikerjakan, bukan yang sempat dibuka
--
-- GEJALANYA: seorang anak menyelesaikan Paket C1, tapi alur Misi (190) tetap
-- menawarkan C1. Bukan alurnya yang salah — ia bertanya "sudah lolos belum",
-- dan `skor_paket_topik` menjawab NULL untuk paket yang jelas-jelas sudah
-- dikerjakan.
--
-- SEBABNYA: `putaran` dihitung dari SETIAP baris `practice_sessions`, termasuk
-- sesi yang dibuka lalu ditinggalkan tanpa satu jawaban pun. Data anak yang
-- melaporkan gejala ini persis begitu:
--
--   3 Sep 06:18  sesi dibuka, 0 jawaban, tidak diselesaikan   <- dihitung "putaran 1"
--   3 Sep 15:31  sesi dibuka, 0 jawaban, tidak diselesaikan
--   6 Sep 05:53  sesi dibuka, 0 jawaban, tidak diselesaikan
--   6 Sep 05:53  sesi dibuka, 8 jawaban, SELESAI              <- putaran yang sesungguhnya
--   6 Sep 05:54  sesi dibuka, 0 jawaban, tidak diselesaikan
--
-- `jawaban_putaran_1` mencari jawaban di sesi bernomor 1 — sesi 3 September
-- yang kosong — dan tidak menemukan apa pun. Skor Putaran 1 jadi NULL, dan NULL
-- tidak pernah melewati ambang. Akibatnya BUKAN cuma alur yang mandek:
-- `status_topik_murid` memakai angka yang sama, jadi topik anak ini tidak akan
-- pernah `tuntas`, dan ujiannya (189) tidak akan pernah terbuka. Satu ketukan
-- yang tidak disengaja pada bulan lalu mengunci sebuah topik selamanya.
--
-- Cacat yang sama sudah pernah lewat sekali. Kepala migrasi 184 mencatatnya
-- pada fitur yang berbeda: "syarat 'belum ada paket yang digarap' memeriksa
-- keberadaan sesi, bukan adanya jawaban". Ia dicatat, tapi tidak dicari di
-- tempat lain. Ini tempat lain itu.
--
-- YANG DIPERBAIKI, DUA HAL:
--
-- SATU. Sesi yang tidak diselesaikan DAN sesi tanpa jawaban tidak lagi
-- terhitung sebagai putaran. `topik_paket_state` sudah lama begitu — komentarnya
-- sendiri berbunyi "putaran yang ditinggalkan di tengah tidak bernilai, tidak
-- menaikkan dan tidak menurunkan" — sementara `skor_paket_topik` tidak pernah
-- ikut. Dua fungsi yang membaca tabel yang sama dengan aturan yang berbeda:
-- yang satu berkata paketnya 8/8 benar, yang lain berkata skornya tidak ada.
--
-- DUA. Skor Putaran 1 hanya berlaku untuk putaran yang BENAR-BENAR PENUH. Tanpa
-- ini, anak yang menjawab tiga butir dengan benar lalu berhenti pulang membawa
-- Skor Putaran 1 = 100% atas tiga butir dari delapan — dan `tuntas` yang lahir
-- dari sepertiga paket adalah ketuntasan yang tidak pernah diukur. Ambangnya
-- 0,75 dari SELURUH paket; penyebut yang menyusut mengikuti apa yang sempat
-- dikerjakan membuat ambang itu tidak berarti apa-apa.
--
-- YANG TIDAK BERUBAH: sesi yang sedang berjalan tetap tidak dihitung sampai
-- selesai, dan itu memang yang diinginkan — angka yang bergerak di tengah
-- pengerjaan adalah angka yang mengukur kecepatan mengetuk, bukan penguasaan.
--
-- SIAPA YANG IKUT BERUBAH ANGKANYA. Semua yang membaca fungsi ini: ketuntasan
-- topik (184), gerbang ujian (189), alur Misi (190), layar pengukuran tutor,
-- dan pemicu eskalasi. Arah perubahannya dua-duanya bisa: anak yang tersandera
-- sesi kosong akhirnya mendapat skornya, sedangkan anak yang `tuntas` karena
-- putaran pertama yang tidak penuh kehilangannya. Yang kedua jarang dan memang
-- seharusnya tidak pernah terjadi.
--
-- Jalankan SESUDAH 190.
-- ============================================================

-- 1. Skor paket: putaran yang benar-benar dikerjakan ---------------------------
--
-- Salinan versi 183 dengan dua syarat tambahan di `sesi` dan satu penjaga di
-- Skor Putaran 1. Sisanya — batas siklus, `distinct on` per butir untuk ketukan
-- ganda, lantai nol — tidak disentuh.
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
    where sesi.putaran = 1
    order by a.question_bank_item_id, a.answered_at desc
  ),
  jawaban_akhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    order by a.question_bank_item_id, a.answered_at desc
  ),
  ukuran as (
    select coalesce(
      nullif((select count(*) from paket_butir_murid(p_learner_id, p_paket_id)), 0),
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
       from jawaban_akhir);
$$;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1 dan skor akhir sebuah paket topik untuk satu murid, di siklus yang berjalan. Putaran dihitung dari sesi yang SELESAI dan berisi jawaban saja (191); Skor Putaran 1 hanya ada untuk putaran yang mencakup seluruh butir paket.';

-- 2. Cetakan status disegarkan --------------------------------------------------
--
-- Angka yang barusan berubah mengubah `tuntas` sebagian murid — ke dua arah.
-- Cetakan yang tertinggal akan menampilkan status lama di layar tutor dan
-- keluarga sampai anaknya kebetulan menyelesaikan paket berikutnya.
do $$
declare v_learner uuid;
begin
  for v_learner in select distinct learner_id from status_topik_siswa loop
    perform evaluasi_unlock(v_learner);
  end loop;
end $$;

-- 3. Langkah berikutnya tahu bedanya "lanjut" dan "ulangi" ----------------------
--
-- Salinan 190 dengan satu kolom tambahan. Ia ikut di berkas ini karena
-- perbaikan di atas yang membuatnya bisa dipercaya: sebelum 191, "pernah
-- dikerjakan" akan bernilai true untuk paket yang cuma pernah dibuka lalu
-- ditinggalkan, dan layar akan menyuruh anak mengulangi sesuatu yang belum
-- pernah ia kerjakan.
--
-- Return type-nya berubah, jadi harus di-drop dulu — dan grantnya ikut hilang
-- bersamanya, seperti yang sudah dua kali dialami `topik_paket_state`.
drop function if exists topik_langkah_berikutnya(text, uuid, text);

create or replace function topik_langkah_berikutnya(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_topik_id text default null
)
returns table (
  topik_id text,
  -- NULL berarti tidak ada langkah tersisa: seluruh paket wajib lolos dan
  -- ujiannya sudah dikerjakan.
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  -- Topik ini pernah punya sesi yang selesai, apa pun paketnya.
  sudah_mulai boolean,
  -- Keadaan paket langkahnya, supaya layar tidak perlu bertanya dua kali.
  terkunci boolean,
  buka_pada timestamptz,
  -- Paket langkahnya sendiri sudah pernah dikerjakan sampai selesai.
  --
  -- Yang dibedakan olehnya "lanjut" dari "ulangi": langkah yang menunjuk paket
  -- yang baru saja dikerjakan anak berarti paketnya belum lolos ambang, dan
  -- layar yang tetap berkata "Lanjut: Paket C1" pada anak yang baru menutup
  -- Paket C1 terbaca seperti aplikasi yang tidak mengikuti.
  pernah_dikerjakan boolean
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
    select coalesce(
      (select (nilai #>> '{}')::numeric from pengaturan where kunci = 'ambang_mastery'),
      0.75
    ) as nilai
  ),
  topik_dipakai as (
    select t.id, t.bloom_min, t.bloom_maks
    from topik t
    where t.aktif
      and (p_topik_id is null or t.id = p_topik_id)
      and (select learner from me) is not null
  ),
  wajib as (
    select p.topik_id, p.id as paket_id, p.jenis, p.level_bloom, p.nomor,
           s.skor_putaran_1
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    left join lateral skor_paket_topik((select learner from me), p.id) s on true
    where p.jenis = 'latihan'
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
  ),
  belum as (
    select distinct on (w.topik_id)
           w.topik_id, w.paket_id, w.jenis, w.level_bloom
    from wajib w
    where w.skor_putaran_1 is null
       or w.skor_putaran_1 < (select nilai from ambang)
    order by w.topik_id, w.level_bloom nulls last, w.nomor
  ),
  ujian as (
    select p.topik_id, p.id as paket_id, p.jenis, p.level_bloom
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    where p.jenis = 'ujian'
      and not exists (
        select 1 from practice_sessions s
        where s.learner_id = (select learner from me)
          and s.paket_topik_id = p.id
      )
  )
  select t.id,
         coalesce(b.paket_id, u.paket_id),
         coalesce(b.jenis, u.jenis),
         coalesce(b.level_bloom, u.level_bloom),
         exists (
           select 1
           from practice_sessions s
           join paket_topik p on p.id = s.paket_topik_id
           where s.learner_id = (select learner from me)
             and p.topik_id = t.id
             and s.finished_at is not null
         ),
         coalesce(
           paket_terkunci((select learner from me), coalesce(b.paket_id, u.paket_id)),
           false
         ),
         paket_buka_pada((select learner from me), coalesce(b.paket_id, u.paket_id)),
         coalesce(
           (
             select s.putaran > 0
             from skor_paket_topik(
               (select learner from me), coalesce(b.paket_id, u.paket_id)
             ) s
           ),
           false
         )
  from topik_dipakai t
  left join belum b on b.topik_id = t.id
  -- Ujiannya cuma dilirik kalau tidak ada lagi paket wajib yang tersisa.
  left join ujian u on u.topik_id = t.id and b.topik_id is null;
$$;

comment on function topik_langkah_berikutnya(text, uuid, text) is
  'Paket berikutnya yang ditawarkan alur Misi untuk tiap topik aktif (190, diperluas 191): paket wajib terendah yang belum lolos ambang, lalu ujiannya, lalu tidak ada. `pernah_dikerjakan` membedakan melanjutkan dari mengulangi. Menawarkan urutan, tidak memagari.';

grant execute on function topik_langkah_berikutnya(text, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
