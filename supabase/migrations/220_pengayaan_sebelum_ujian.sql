-- ============================================================
-- Pengayaan lebih dulu daripada ujian dalam langkah berikutnya
--
-- MASUKAN LAPANGAN, 15 November 2026. Tutor dan siswa melaporkan bahwa selesai
-- paket wajib terakhir (mis. Level 2 pada AC-01) langsung disodori tombol ke
-- Tantangan Akhir, dan ujiannya terasa terlalu sulit. Wajar: ujian mencampur
-- soal dari SELURUH level (189), termasuk level di atas cakupan topik, padahal
-- anak baru dituntut berlatih sampai level tertinggi dalam cakupan. Ujiannya
-- hanya dibuka sekali seumur hidup, jadi percobaan yang kurang siap mahal.
--
-- 193 sengaja TIDAK memasukkan pengayaan ke urutan normal, dengan alasan
-- "menunda ujian bagi setiap anak yang sudah siap". Alasan itu ditimbang ulang:
-- yang dipertaruhkan di sisi lain adalah ujian sekali seumur hidup yang
-- dikerjakan tanpa persiapan. Maka urutannya berubah, tetapi tidak menjadi
-- pagar:
--
--   1. Paket wajib terendah yang belum lolos ambang.
--   2. Kalau yang itu terkunci: pengayaan terendah yang belum lolos dan tidak
--      terkunci (sama seperti 193).
--   3. Kalau seluruh wajib lolos: pengayaan terendah yang belum lolos dan tidak
--      terkunci. BARU di 220.
--   4. Kalau tidak ada pengayaan tersisa: ujiannya, selama belum dikerjakan.
--   5. Tidak ada.
--
-- Ujian TIDAK dikunci di balik pengayaan. Gerbangnya tetap 189 (seluruh paket
-- wajib lolos), dan fungsi ini hanya mengubah apa yang DIREKOMENDASIKAN. Supaya
-- layar bisa menawarkan ujian sebagai pilihan kedua, dua kolom ditambahkan:
-- `pengayaan` (langkahnya paket pengayaan) dan `ujian_paket_id` (ujian yang
-- masih menunggu). Keduanya mengubah bentuk keluaran, jadi fungsinya di-drop
-- dan dibuat ulang, dan grant-nya dipasang lagi.
--
-- KONSEKUENSI YANG DISENGAJA: anak yang tidak lolos pengayaan ditawari
-- mengulangnya, bukan ujian, sampai lolos. Ujian tetap terbuka lewat pilihan
-- kedua dan daftar paket.
-- ============================================================

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
  pernah_dikerjakan boolean,
  -- Paket langkahnya pengayaan (di luar cakupan Bloom). Baru ada sejak 220:
  -- layar perlu tahu bahwa yang direkomendasikan bukan paket wajib.
  pengayaan boolean,
  -- Paket ujian yang masih menunggu, selama seluruh paket wajib sudah lolos
  -- dan ujiannya belum pernah dibuka; null kalau tidak. Memungkinkan layar
  -- menawarkan ujian sebagai pilihan KEDUA di samping pengayaan yang
  -- direkomendasikan, tanpa menebak id paketnya.
  ujian_paket_id uuid
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
  -- Seluruh paket latihan topik ini, wajib maupun pengayaan, beserta nilainya.
  -- Satu CTE untuk keduanya supaya aturan "belum lolos" di bawah ditulis sekali
  -- saja: versi pertama berkas ini menulisnya dua kali dan yang kedua telanjur
  -- berbeda dari yang pertama.
  latihan as (
    select p.topik_id, p.id as paket_id, p.level_bloom, p.nomor,
           -- Pengayaan = di luar cakupan Bloom topiknya (182). Topik tanpa
           -- cakupan tidak punya pengayaan sama sekali: di sana seluruh paket
           -- latihan berstatus wajib.
           (
             t.bloom_min is not null
             and p.level_bloom is not null
             and p.level_bloom not between t.bloom_min and t.bloom_maks
           ) as pengayaan,
           -- Belum lolos, dengan aturan yang sama persis seperti ketuntasan
           -- (192): nilai AKHIR, dan seluruh butirnya terjawab.
           (
             coalesce(s.butir_paket, 0) = 0
             or coalesce(s.butir_terjawab, 0) < s.butir_paket
             or coalesce(s.skor_akhir, 0) < (select nilai from ambang)
           ) as belum_lolos
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    left join lateral skor_paket_topik((select learner from me), p.id) s on true
    where p.jenis = 'latihan'
  ),
  belum as (
    select distinct on (l.topik_id)
           l.topik_id, l.paket_id
    from latihan l
    where not l.pengayaan
      and l.belum_lolos
    order by l.topik_id, l.level_bloom nulls last, l.nomor
  ),
  -- Cadangan untuk jeda, bukan bagian urutan. Terkuncinya disaring DI SINI:
  -- lihat catatan kepala berkas tentang kenapa menyaringnya sesudah memilih
  -- akan melahirkan buntu yang sama.
  pengayaan as (
    select distinct on (l.topik_id)
           l.topik_id, l.paket_id
    from latihan l
    where l.pengayaan
      and l.belum_lolos
      and not paket_terkunci((select learner from me), l.paket_id)
    order by l.topik_id, l.level_bloom nulls last, l.nomor
  ),
  ujian as (
    select p.topik_id, p.id as paket_id
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    where p.jenis = 'ujian'
      and not exists (
        select 1 from practice_sessions s
        where s.learner_id = (select learner from me)
          and s.paket_topik_id = p.id
      )
  ),
  -- Satu paket per topik, dipilih di satu tempat. `jenis` dan `level_bloom`
  -- tidak lagi dibawa masing-masing cabang lalu di-coalesce: begitu cabangnya
  -- tiga, menyalin dua kolom di tiap cabang adalah tiga kesempatan untuk
  -- memasangkan paket dari satu cabang dengan level dari cabang lain. Yang
  -- dipilih cuma id-nya, sisanya dibaca ulang dari `paket_topik`.
  pilih as (
    select t.id as topik_id,
           u.paket_id as ujian_paket_id,
           case
             -- Seluruh wajib lolos: pengayaan dulu, baru ujian (220).
             when b.paket_id is null then coalesce(g.paket_id, u.paket_id)
             when paket_terkunci((select learner from me), b.paket_id)
               then coalesce(g.paket_id, b.paket_id)
             else b.paket_id
           end as paket_id
    from topik_dipakai t
    left join belum b on b.topik_id = t.id
    -- Ujiannya cuma dilirik kalau tidak ada lagi paket wajib yang tersisa.
    left join ujian u on u.topik_id = t.id and b.topik_id is null
    left join pengayaan g on g.topik_id = t.id
  )
  select k.topik_id,
         k.paket_id,
         p.jenis,
         p.level_bloom,
         exists (
           select 1
           from practice_sessions s
           join paket_topik pp on pp.id = s.paket_topik_id
           where s.learner_id = (select learner from me)
             and pp.topik_id = k.topik_id
             and s.finished_at is not null
         ),
         coalesce(paket_terkunci((select learner from me), k.paket_id), false),
         paket_buka_pada((select learner from me), k.paket_id),
         coalesce(
           (
             select s.putaran > 0
             from skor_paket_topik((select learner from me), k.paket_id) s
           ),
           false
         ),
         coalesce(
           (select l.pengayaan from latihan l where l.paket_id = k.paket_id),
           false
         ),
         k.ujian_paket_id
  from pilih k
  left join paket_topik p on p.id = k.paket_id;
$$;

comment on function topik_langkah_berikutnya(text, uuid, text) is
  'Paket berikutnya yang direkomendasikan alur Misi untuk tiap topik aktif (190-193, diubah 220): paket wajib terendah yang belum lolos; kalau terkunci, pengayaan terendah yang tidak terkunci; kalau seluruh wajib lolos, pengayaan terendah yang belum lolos dan tidak terkunci, baru ujiannya. Menawarkan urutan, tidak memagari. ujian_paket_id memuat ujian yang masih menunggu, supaya bisa ditawarkan sebagai pilihan kedua.';

grant execute on function topik_langkah_berikutnya(text, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
