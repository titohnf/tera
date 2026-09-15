-- ============================================================
-- Pengayaan mengisi jeda: alur tidak lagi buntu di paket yang terkunci
--
-- GEJALANYA, dari pangkalan ini pada 7 September 2026. Topik D-01 (Bilangan
-- Bulat) punya cakupan Bloom 1–3, jadi paket wajibnya C1–C3 dan C4–C6 berdiri
-- sebagai pengayaan (182). Seorang murid menutup Paket C3 pukul 05:57 tanpa
-- lolos ambang; kuncinya berlaku 24 jam (183). Sejak detik itu kartu D-01 di
-- Misi cuma berbunyi "Paket C3 sedang terkunci" dan tidak menawarkan apa pun
-- sampai besok — padahal C4, C5, dan C6 ada, tidak terkunci, dan boleh
-- dikerjakan hari itu juga.
--
-- Anaknya tidak benar-benar terhalang: daftar paket di halaman topik tetap
-- memuat ketiganya. Tapi menemukannya jadi tugas dia sendiri, dan itu persis
-- kebalikan dari alasan alur Misi dibangun. Layar yang berkata "tidak ada
-- apa-apa untukmu hari ini" sementara ada tiga paket menganggur bukan cuma
-- kurang membantu — ia salah.
--
-- SEBABNYA ADA DI SINI, bukan di layar. Sampai 192, CTE `wajib` menyaring paket
-- dengan `level_bloom between bloom_min and bloom_maks`, jadi pengayaan tidak
-- pernah ikut jadi kandidat. Lalu `ujian` cuma dilirik kalau `belum` kosong, dan
-- `belum` tidak kosong: C3 masih di sana, belum lolos ambang. Langkahnya
-- berhenti di satu paket yang kebetulan sedang terkunci, dan fungsinya tidak
-- punya jalan lain untuk ditempuh.
--
-- PERBAIKANNYA SEMPIT DENGAN SENGAJA. Pengayaan TIDAK dimasukkan ke urutan
-- normal. Ia cuma dipanggil pada satu keadaan: paket wajib yang terpilih sedang
-- terkunci. Begitu kuncinya kedaluwarsa besok, langkahnya kembali ke paket
-- wajib itu tanpa ada yang perlu dibereskan.
--
-- Alasan tidak memasukkannya ke urutan normal: urutan "seluruh wajib lolos,
-- baru ujian" adalah keputusan 189, dan menyelipkan tiga paket pengayaan di
-- antaranya berarti menunda ujian bagi setiap anak yang sudah siap — harga yang
-- dibayar semua orang untuk menambal keadaan yang cuma dialami sebagian. Yang
-- benar-benar rusak adalah jeda 24 jam yang kosong, jadi cuma itu yang ditambal.
--
-- URUTAN LENGKAPNYA SEKARANG:
--
--   1. Paket wajib terendah yang belum lolos ambang.
--   2. Kalau yang itu sedang terkunci — pengayaan terendah yang belum lolos
--      ambang DAN tidak sedang terkunci.
--   3. Kalau seluruh wajib sudah lolos — ujiannya, selama belum dikerjakan.
--   4. Tidak ada.
--
-- Langkah 2 menyaring `paket_terkunci` di dalam CTE-nya sendiri, bukan sesudah
-- memilih. Kalau tidak, seorang anak yang C3-nya terkunci DAN C4-nya baru saja
-- ia tutup akan dilempar dari satu paket terkunci ke paket terkunci berikutnya
-- — buntu yang sama dengan satu ketukan tambahan.
--
-- PENGAYAAN YANG SUDAH LOLOS AMBANG tidak ditawarkan lagi, sama seperti wajib.
-- Ia memang tidak menahan ketuntasan (182), tapi menawarkan ulang sesuatu yang
-- sudah dikuasai bukan mengisi jeda melainkan membuang waktu anak.
--
-- TOPIK TANPA CAKUPAN BLOOM (`bloom_min` null) tidak punya pengayaan sama
-- sekali: di sana seluruh paket latihan berstatus wajib. Syarat `bloom_min is
-- not null` di CTE-nya membuat itu eksplisit alih-alih bergantung pada perilaku
-- `between` terhadap null.
--
-- REVISI 7 SEPTEMBER 2026, SESUDAH VERSI PERTAMA BERKAS INI TELANJUR DIJALANKAN.
-- Versi itu disalin dari 191 dan karenanya memutar balik aturan 192: "belum
-- lolos" kembali diukur dengan Skor Putaran 1, bukan nilai akhir. Akibatnya
-- langsung terlihat di layar — D-01 yang paket wajibnya sudah diperbaiki sampai
-- 88% dan 83% ditawarkan mengulang C1 lagi, persis penyakit yang 192 hapus.
--
-- Berkas ini `create or replace`, jadi menjalankannya sekali lagi memperbaiki
-- keadaan itu; tidak ada yang perlu dibereskan terlebih dulu. Aturan "belum
-- lolos" di bawah sekarang disalin dari 192 dan dipakai DUA CTE — wajib dan
-- pengayaan — supaya berikutnya tidak ada lagi satu aturan yang hidup di dua
-- tempat dengan bunyi berbeda.
--
-- YANG TIDAK BERUBAH: bentuk baris keluarannya, seluruh kolomnya, dan artinya.
-- `terkunci` dan `buka_pada` tetap milik paket yang DITAWARKAN — yang sesudah
-- migrasi ini hampir selalu bernilai false untuk jalur pengayaan, karena
-- terkuncinya sudah disaring di hulu. Signature-nya juga tidak berubah, jadi
-- tidak perlu drop dan grantnya tidak hilang.
-- ============================================================

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
           case
             when b.paket_id is null then u.paket_id
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
         )
  from pilih k
  left join paket_topik p on p.id = k.paket_id;
$$;

comment on function topik_langkah_berikutnya(text, uuid, text) is
  'Paket berikutnya yang ditawarkan alur Misi untuk tiap topik aktif (190, 191, aturannya mengikuti 192, diperluas 193): paket wajib terendah yang belum lolos ambang; kalau paket itu sedang terkunci, paket pengayaan terendah yang belum lolos ambang dan tidak terkunci; kalau seluruh wajib lolos, ujiannya; lalu tidak ada. Menawarkan urutan, tidak memagari.';

notify pgrst, 'reload schema';
