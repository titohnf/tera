-- ============================================================
-- Cabut tes penempatan (173 dan 174)
--
-- Dokumen Fondasi Bagian 3.1 memintanya, Bagian 2.6 menandainya "Diadopsi
-- penuh", dan Bagian 7 menaruhnya di Tahap 1. Ia dibangun apa adanya di 173.
-- Yang membatalkannya bukan pembacaan ulang dokumennya, melainkan tiga angka
-- yang baru bisa dihitung sesudah 182 menetapkan cakupan Bloom tiap topik.
--
-- SATU. Delapan butir untuk membebaskan enam belas. Paket latihan berisi 8
-- butir per level, jadi C1-C2 seluruhnya 16 butir. Hemat bersihnya 8 — dan
-- hanya bagi anak yang 8/8 sempurna, karena pembebasan menuntut SELURUH butir
-- satu level benar (173 menjelaskan kenapa: dengan empat butir per level,
-- ambang 0,75 berarti "boleh salah satu", dan satu kesalahan di C1 justru
-- tanda bahwa levelnya belum boleh dilewati). Anak yang meleset satu butir
-- pulang membawa 24 butir, bukan 16.
--
-- DUA. Seperempat peta tidak bisa dibebaskan sama sekali. Cakupan Bloom per
-- topik (182) memberi angka yang persis: dari 67 topik, hanya 39 punya C1 DAN
-- C2 di dalam cakupannya; 14 topik mulai di C2 dan paling banter membebaskan
-- satu level; 13 topik mulai di C3 dan tidak bisa membebaskan apa pun — meski
-- delapan butir penempatannya tetap harus ditulis. 182 sudah menuliskan
-- gejalanya sendiri, tanpa menghitungnya: "keduanya bergerak di ujung yang
-- berlawanan dan tidak pernah bertemu."
--
-- TIGA. Kolam terpisah, jadi biayanya tambahan murni. Butir penempatan tidak
-- boleh meminjam butir latihan (173, dan alasannya masih benar: butir yang
-- sama muncul lagi di paket C1 beberapa menit kemudian mengubah paket itu jadi
-- ujian ingatan jangka pendek). Maka 8 butir per topik itu bukan sebagian dari
-- ~52 butir wajib sebuah topik, ia tambahan 8 di atasnya — 424 butir untuk
-- seluruh peta, untuk menghemat butir yang jumlahnya lebih kecil dari itu.
--
-- YANG TIDAK BISA DILAKUKAN SEBAGAI JALAN TENGAH, dan sudah ditimbang:
--
--   Membebaskan TANPA memberi kredit ketuntasan. Terdengar seperti separuh
--   fitur yang gratis: lewati paketnya demi UX, jangan klaim apa pun soal
--   penguasaan. Tapi `tuntas` menuntut SELURUH paket latihan dalam cakupan
--   lolos Putaran 1; paket yang dilewati tanpa kredit tidak akan pernah lolos,
--   dan topiknya tidak akan pernah tuntas. Kredit itu bukan tempelan yang bisa
--   dilepas — ia satu-satunya yang membuat pembebasan tidak beracun.
--
--   Menaikkan langit-langit ke C3. Rasionya memang membaik (8 butir
--   membebaskan 24), tapi alasannya salah: `LEVEL_MAKSIMAL_DIBEBASKAN = 2` di
--   173 lahir dari pertimbangan BUKTI ("delapan butir adalah bukti yang
--   tipis"), bukan dari pertimbangan anggaran. Melonggarkan ambang bukti supaya
--   ekonominya masuk adalah menukar validitas pengukuran dengan validitas
--   anggaran, dan yang dipertaruhkan tetap paket yang boleh dilewati anak.
--
-- YANG TIDAK IKUT DICABUT. Kebutuhan tutor mengetahui posisi murid baru itu
-- nyata, dan ia tidak pernah bergantung pada fitur ini: kolam `probe` (168)
-- sudah ada, sudah C2-C3, dan sudah dipakai jalur retest.
--
-- SATU CACAT YANG IKUT TERKUBUR, dicatat supaya tidak lahir lagi kalau fitur
-- ini kelak dibangkitkan: syarat "belum ada paket topik ini yang digarap" di
-- 173 dan 174 memeriksa KEBERADAAN sesi, bukan adanya jawaban. Anak yang cuma
-- membuka paket lalu keluar tanpa menjawab satu soal pun kehilangan tawaran
-- penempatannya permanen. Kalau ia dibangkitkan, yang diperiksa mestinya
-- `practice_answers`, dan diperiksa di kedua tempat sekaligus.
--
-- Jalankan SESUDAH 183.
-- ============================================================

-- 1. Turunkan pintunya lebih dulu ---------------------------------------------
--
-- Fungsi tawaran dan pembuka dicabut sebelum apa pun yang lain, supaya tidak
-- ada sesi penempatan baru yang lahir di tengah migrasi ini.
drop function if exists penempatan_ditawarkan(text, uuid);
drop function if exists penempatan_buka_sesi(text, text, uuid);

drop trigger if exists z_penempatan_sesudah_sesi on practice_sessions;
drop function if exists penempatan_sesudah_sesi();

-- 2. Ketuntasan tanpa suku `dibebaskan` ---------------------------------------
--
-- Salinan versi 182 dikurangi satu suku dan satu join. Yang lain — cakupan
-- Bloom sebagai penyaring paket pengayaan, retest yang gagal membatalkan
-- tuntas, eskalasi yang belum dijawab tutor — tetap apa adanya.
create or replace function status_topik_murid(p_learner_id uuid)
returns table (
  topik_id text,
  status text,
  perlu_verifikasi_ulang boolean
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with ambang as (
    select coalesce(
      (select (nilai #>> '{}')::numeric from pengaturan where kunci = 'ambang_mastery'),
      0.75
    ) as nilai
  ),
  paket as (
    select p.topik_id, p.id as paket_id, s.skor_putaran_1, s.skor_akhir
    from paket_topik p
    join topik t on t.id = p.topik_id
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    where p.jenis = 'latihan'
      -- Paket PENGAYAAN tidak menentukan ketuntasan. Rentang yang NULL berarti
      -- belum diputuskan, dan yang belum diputuskan tidak menyaring apa pun.
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
  ),
  agregat as (
    select pk.topik_id,
           count(*) as paket_total,
           count(*) filter (where skor_putaran_1 is not null) as paket_dikerjakan,
           count(*) filter (
             where skor_putaran_1 >= (select nilai from ambang)
           ) as paket_lolos_putaran_1,
           count(*) filter (
             where skor_akhir is not null
               and skor_akhir < (select nilai from ambang)
           ) as paket_akhir_di_bawah
    from paket pk group by pk.topik_id
  ),
  eskalasi as (
    select distinct p.topik_id
    from notifikasi_eskalasi n
    join paket_topik p on p.id = any(n.paket_pemicu)
    where n.learner_id = p_learner_id
      and n.waktu_tutor_merespons is null
  ),
  retest_gagal as (
    select j.topik_id from jadwal_retest j
    where j.learner_id = p_learner_id and j.hasil_terakhir = 'gagal'
  ),
  tuntas as (
    select a.topik_id from agregat a
    where a.paket_total > 0
      and a.paket_lolos_putaran_1 = a.paket_total
      and a.topik_id not in (select rg2.topik_id from retest_gagal rg2)
  )
  select t.id,
         case
           when e.topik_id is not null then 'eskalasi_tutor'
           when rg.topik_id is not null then 'butuh_pengulangan'
           when tt.topik_id is not null then 'tuntas'
           when a.paket_akhir_di_bawah > 0
                and a.paket_dikerjakan = a.paket_total then 'butuh_pengulangan'
           when coalesce(a.paket_dikerjakan, 0) > 0 then 'sedang_dikerjakan'
           when not exists (
             select 1 from topik_prasyarat pr
             where pr.topik_id = t.id
               and pr.prasyarat_id not in (select tt2.topik_id from tuntas tt2)
           ) then 'siap_dikerjakan'
           else 'terkunci'
         end,
         false
  from topik t
  left join agregat a on a.topik_id = t.id
  left join tuntas tt on tt.topik_id = t.id
  left join eskalasi e on e.topik_id = t.id
  left join retest_gagal rg on rg.topik_id = t.id;
$$;

comment on function status_topik_murid(uuid) is
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13, diperluas FR11 dan migrasi 182). Definisi TUNGGAL; `status_topik_siswa` cetakannya. `tuntas` memakai Skor Putaran 1 pada paket DI DALAM cakupan Bloom topiknya, dan dibatalkan retest terakhir yang gagal.';

revoke all on function status_topik_murid(uuid) from public, anon, authenticated;

-- 3. Cetakannya disegarkan -----------------------------------------------------
--
-- Pembebasan yang barusan hilang mengubah hitungan `tuntas` seorang murid, dan
-- cetakan yang tertinggal akan menampilkan topik tuntas yang paketnya tidak
-- pernah dikerjakan. Semua murid yang punya baris cetakan disegarkan.
do $$
declare v_learner uuid;
begin
  for v_learner in select distinct learner_id from status_topik_siswa loop
    perform evaluasi_unlock(v_learner);
  end loop;
end $$;

-- 4. Sesi penempatan dan hasilnya ----------------------------------------------
--
-- Sesi penempatan bukan paket dan bukan probe; tanpa kolomnya ia jadi sesi
-- tanpa asal yang muncul di riwayat latihan sebagai baris yang tidak bisa
-- dijelaskan. Dihapus bersama jawabannya, bukan ditinggalkan menggantung.
delete from practice_answers a
 using practice_sessions s
 where a.session_id = s.id
   and s.penempatan_topik_id is not null;

delete from practice_sessions s
 where s.penempatan_topik_id is not null;

drop table if exists penempatan_topik;

alter table practice_sessions drop column if exists penempatan_topik_id;

-- 5. Kolam butirnya ------------------------------------------------------------
--
-- Ke-152 butir penempatan lahir dalam satu tumpukan mesin pada 3 September 2026
-- dan tidak pernah dikerjakan siapa pun sesudah bagian 4 di atas. Dihapus, dan
-- 'penempatan' dicabut dari nilai yang diizinkan supaya kolam kelima tidak
-- diam-diam terisi lagi.
delete from question_bank_items where peruntukan = 'penempatan';

alter table question_bank_items
  drop constraint if exists question_bank_items_peruntukan_check;
alter table question_bank_items
  add constraint question_bank_items_peruntukan_check
  check (peruntukan is null or peruntukan in ('latihan', 'ujian', 'probe'));

comment on column question_bank_items.peruntukan is
  'Kolam tempat butir ini ditulis: latihan, ujian, atau probe. NULL = di luar cakupan pilot.';

notify pgrst, 'reload schema';
