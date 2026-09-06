-- ============================================================
-- Langkah berikutnya sebuah topik: satu alur, bukan prasmanan
--
-- Sampai sebelum ini, membuka topik berarti disodori daftar: C1 sampai C6 plus
-- ujiannya, pilih sendiri. Daftar itu jujur tapi tidak menjawab pertanyaan yang
-- membawa anak ke sana — "sekarang aku harus apa" — dan anak yang harus
-- memilih lebih dulu sebelum boleh mulai membayar ongkos keputusan pada setiap
-- kunjungan, untuk keputusan yang jawabannya hampir selalu sama: yang paling
-- bawah yang belum lolos.
--
-- Fungsi ini menjawabnya SEKALI, di satu tempat. Tiga permukaan memakainya —
-- kartu topik di peta, halaman transisi sebelum sesi dibuka, dan tombol
-- "Lanjut" di layar hasil — dan tanpa fungsi bersama, ketiganya akan menyusun
-- aturan yang sama dari kepingan yang sama dan suatu hari berselisih tentang
-- paket mana yang sedang dikerjakan seorang anak.
--
-- ATURANNYA: paket wajib TERENDAH YANG BELUM LOLOS. Bukan "yang belum pernah
-- dikerjakan" — anak yang mengerjakan C1 dengan nilai di bawah ambang belum
-- selesai dengan C1, dan alur yang melangkah ke C2 karenanya meninggalkan
-- lubang yang baru ketahuan saat ujiannya tidak mau terbuka. "Lolos" di sini
-- persis definisi yang dipakai `status_topik_murid` (184): Skor Putaran 1 di
-- atas `ambang_mastery`, dihitung pada paket di dalam cakupan Bloom topiknya.
--
-- SESUDAH SELURUH PAKET WAJIB LOLOS, langkahnya ujian — kalau belum pernah
-- dikerjakan. Sesudah itu tidak ada langkah lagi: barisnya tetap pulang dengan
-- `paket_id` NULL, dan layar yang menerimanya mengucapkan "topik ini selesai",
-- bukan menghilang tanpa kabar.
--
-- PAKET PENGAYAAN TIDAK PERNAH JADI LANGKAH. Ia di luar cakupan, tidak
-- menentukan ketuntasan (182), dan menaruhnya di alur berarti menuntut
-- pekerjaan yang tidak pernah diminta siapa pun. Ia tetap bisa dikerjakan dari
-- daftar paket — alur ini menawarkan jalan, bukan memagari halaman.
--
-- YANG TIDAK DIBANGUN DI SINI, DAN SENGAJA: gerbang urutan. Tidak ada yang
-- melarang anak membuka C3 sebelum C1 dari daftar paket. Alur ini URUTAN YANG
-- DITAWARKAN, bukan pintu yang dikunci — prinsip yang sama dengan prasyarat
-- topik di 146, dan alasannya di sini bahkan lebih kuat: gerbang urutan yang
-- keras akan menyandera seluruh topik pada satu paket yang kuncinya terlanjur
-- dibuka anak. Satu-satunya gerbang keras di jalur ini tetap ujian (189), yang
-- kerugiannya memang tidak bisa dipulihkan.
--
-- `sudah_mulai` MEMBEDAKAN KUNJUNGAN PERTAMA dari kunjungan berikutnya, dan itu
-- yang dipakai layar untuk memutuskan apakah ketukan pada kartu topik langsung
-- membuka soal atau mampir dulu di halaman yang menyebutkan paket mana yang
-- akan dikerjakan. Anak yang belum pernah menyentuh topiknya tidak punya apa
-- pun untuk dibaca di halaman transisi — "kamu akan mengerjakan Paket C1"
-- adalah kalimat yang menunda tanpa memberi tahu apa-apa.
--
-- Jalankan SESUDAH 189.
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
  buka_pada timestamptz
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
         paket_buka_pada((select learner from me), coalesce(b.paket_id, u.paket_id))
  from topik_dipakai t
  left join belum b on b.topik_id = t.id
  -- Ujiannya cuma dilirik kalau tidak ada lagi paket wajib yang tersisa.
  left join ujian u on u.topik_id = t.id and b.topik_id is null;
$$;

comment on function topik_langkah_berikutnya(text, uuid, text) is
  'Paket berikutnya yang ditawarkan alur Misi untuk tiap topik aktif (migrasi 190): paket wajib terendah yang belum lolos ambang, lalu ujiannya, lalu tidak ada. Menawarkan urutan, tidak memagari — daftar paket tetap bisa membuka paket mana pun.';

grant execute on function topik_langkah_berikutnya(text, uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
