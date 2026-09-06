-- ============================================================
-- Cakupan Bloom per topik: batas KETUNTASAN, bukan batas pengukuran
--
-- TEMUAN. Learning Progression menetapkan level Bloom yang dicakup tiap topik,
-- dan hampir tak satu pun sampai C6: D-01 cukup C1-C3, D-02 sampai C4, D-18
-- justru MULAI di C3. Hanya D-17 yang benar-benar C1-C6. Di basis data ke-19
-- topik Fase D punya enam paket latihan tanpa kecuali — 38 dari 114 paket,
-- sepertiganya, di luar cakupan itu.
--
-- KEBERATAN YANG BENAR, dan yang mengubah bentuk migrasi ini. Bacaan pertama
-- saya: paket berlebih itu dibuang. Keberatannya: sistem ini SUDAH lebih maju
-- daripada dokumennya, dan mengukur sampai C6 di seluruh topik adalah kemajuan,
-- bukan kekeliruan. Itu benar. Yang keliru bukan keberadaan paket C5-C6-nya,
-- melainkan apa yang mereka LAKUKAN terhadap ketuntasan.
--
-- Dokumen itu sendiri memisahkan keduanya, di kolom yang berbeda:
--
--   "Level Bloom dicakup"  — sampai mana topik ini menuntut
--   "Kriteria naik"        — "Skor Putaran 1 >=75% pada LEVEL TERTINGGI YANG
--                             DICAKUP"
--
-- Kalimat kedua menetapkan apa yang MENENTUKAN KELULUSAN. Ia tidak pernah
-- melarang mengukur lebih jauh. Maka itu pula yang dibangun di sini: ukur
-- sampai C6 di mana pun butirnya ada, tetapi ketuntasan sebuah topik dinilai
-- dari paket yang ada DI DALAM cakupannya.
--
-- KENAPA PEMBEDAAN INI BUKAN SOAL SELERA. `tuntas` menuntut SELURUH paket
-- latihan lolos di putaran pertama. Dengan enam paket di topik yang mestinya
-- berhenti di C3, anak dituntut menguasai mengevaluasi dan mencipta pada
-- materi yang kurikulumnya tidak memintanya — ia tertahan di topik yang
-- sebenarnya sudah ia kuasai. Dan sejak migrasi 181 akibatnya merambat:
-- `kelas_setara` dihitung dari topik mana yang tuntas, jadi ketuntasan yang
-- terlalu galak membuat klaim kesetaraan MENGECILKAN kemampuan anak secara
-- sistematis — kebalikan dari kekhawatiran biasa tentang klaim yang
-- mengada-ada.
--
-- TES PENEMPATAN TIDAK MENUTUP CELAH INI, meski sekilas tampak begitu. Ia
-- memangkas dari BAWAH — `LEVEL_MAKSIMAL_DIBEBASKAN = 2` di migrasi 173,
-- dibatasi sengaja karena delapan butir adalah bukti tipis. Ketidakcocokannya
-- ada di ATAS. Anak cakap pada D-01 dibebaskan C1-C2, lalu tetap wajib melewati
-- C3, C4, C5, dan C6; tiga paket terakhir itu persis yang placement tidak bisa
-- sentuh. Keduanya bergerak di ujung yang berlawanan dan tidak pernah bertemu.
--
-- ------------------------------------------------------------
-- YANG **TIDAK** DILAKUKAN BERKAS INI, dan sengaja:
--
--   Tidak ada paket yang dihapus. Paket C5-C6 di topik yang cakupannya berhenti
--   lebih awal tetap ada, tetap bisa dikerjakan, tetap dinilai, dan tetap
--   tampil di layar tutor. Ia jadi PENGAYAAN dan bahan diagnosis — persis yang
--   dimaksud "lebih maju daripada dokumen".
--
--   `semai_paket_topik` tidak diubah. Ia tetap melahirkan paket untuk setiap
--   level yang ada butirnya, jadi topik yang butirnya diperluas kelak tetap
--   mendapat paketnya tanpa ada yang perlu ingat menyalakan sesuatu.
--
--   Butir ujian tidak dipangkas. Paket ujian tidak pernah menentukan `tuntas`
--   sama sekali — ia pemeriksa independen — jadi mencampur level di luar
--   cakupan di sana adalah diagnosis, bukan gerbang.
--
-- YANG DILAKUKAN: dua fungsi berhenti menghitung paket di luar cakupan.
-- `status_topik_murid` untuk ketuntasan, dan `periksa_eskalasi_dua_paket`
-- supaya level pengayaan tidak melahirkan alarm — "anak ini tersendat" yang
-- dipicu C6 pada topik yang berhenti di C3 adalah tutor yang dipanggil untuk
-- masalah yang tidak ada.
--
-- EF-17 SENGAJA TANPA RENTANG. Dokumennya menulis "(belum ditentukan)" dan
-- menandainya gap riset di Bagian 5. NULL di sini berarti "belum diputuskan",
-- dan yang belum diputuskan tidak menyaring apa pun: seluruh paketnya
-- menentukan ketuntasan, seperti sebelum berkas ini ada.
--
-- Jalankan SESUDAH 181.
-- ============================================================

-- 1. Kolom cakupannya -----------------------------------------------------------
alter table topik add column if not exists bloom_min smallint
  check (bloom_min is null or bloom_min between 1 and 6);
alter table topik add column if not exists bloom_maks smallint
  check (bloom_maks is null or bloom_maks between 1 and 6);

alter table topik drop constraint if exists topik_bloom_rentang_masuk_akal;
alter table topik add constraint topik_bloom_rentang_masuk_akal
  check (bloom_min is null or bloom_maks is null or bloom_min <= bloom_maks);

comment on column topik.bloom_min is
  'Level Bloom terendah yang dicakup topik ini (Learning Progression, kolom "Level Bloom dicakup"). NULL = belum ditentukan dokumennya.';
comment on column topik.bloom_maks is
  'Level Bloom tertinggi yang dicakup topik ini. Batas KETUNTASAN, bukan batas pengukuran: paket di luar rentang ini tetap ada dan tetap dinilai sebagai pengayaan, hanya tidak ikut menentukan `tuntas` maupun eskalasi.';

-- 2. Rentangnya, dari dokumen ---------------------------------------------------
update topik t set bloom_min = v.min_, bloom_maks = v.maks_
from (values
  ('AC-01', 1, 2),
  ('AC-02', 1, 2),
  ('AC-03', 1, 3),
  ('AC-04', 1, 2),
  ('AC-05', 1, 2),
  ('AC-06', 1, 2),
  ('AC-07', 1, 2),
  ('AC-08', 1, 2),
  ('AC-09', 1, 3),
  ('AC-10', 1, 4),
  ('AC-11', 1, 3),
  ('AC-12', 1, 3),
  ('AC-13', 1, 3),
  ('AC-14', 2, 4),
  ('AC-15', 1, 3),
  ('AC-16', 2, 4),
  ('AC-17', 1, 3),
  ('AC-18', 1, 3),
  ('AC-19', 1, 4),
  ('AC-20', 2, 4),
  ('AC-21', 1, 4),
  ('AC-22', 2, 4),
  ('AC-23', 2, 5),
  ('AC-24', 2, 4),
  ('AC-25', 1, 4),
  ('AC-26', 2, 5),
  ('AC-27', 3, 5),
  ('AC-28', 2, 5),
  ('AC-29', 2, 4),
  ('AC-30', 1, 3),
  ('AC-31', 3, 5),
  ('D-01', 1, 3),
  ('D-02', 1, 4),
  ('D-03', 1, 4),
  ('D-04', 1, 3),
  ('D-05', 1, 4),
  ('D-06', 1, 3),
  ('D-07', 1, 4),
  ('D-08', 1, 5),
  ('D-09', 1, 4),
  ('D-10', 1, 4),
  ('D-11', 1, 3),
  ('D-12', 1, 5),
  ('D-13', 1, 4),
  ('D-14', 1, 5),
  ('D-15', 1, 4),
  ('D-16', 1, 4),
  ('D-17', 1, 6),
  ('D-18', 3, 5),
  ('D-19', 1, 4),
  ('EF-01', 2, 5),
  ('EF-02', 2, 5),
  ('EF-03', 2, 5),
  ('EF-04', 2, 5),
  ('EF-05', 1, 4),
  ('EF-06', 3, 5),
  ('EF-07', 3, 6),
  ('EF-08', 3, 5),
  ('EF-09', 3, 6),
  ('EF-10', 3, 5),
  ('EF-11', 3, 6),
  ('EF-12', 3, 6),
  ('EF-13', 2, 5),
  ('EF-14', 3, 5),
  ('EF-15', 3, 5),
  ('EF-16', 3, 6)
) as v(id, min_, maks_)
where t.id = v.id;

-- 3. Ketuntasan dinilai dari paket di dalam cakupannya ---------------------------
--
-- Menggantikan versi migrasi 173. Yang bertambah satu klausa di CTE `paket`:
-- paket latihan di luar rentang topiknya tidak ikut dihitung. Sisanya —
-- pembebasan oleh tes penempatan, retest yang gagal, eskalasi yang belum
-- direspons — disalin apa adanya.
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
    select p.topik_id, p.id as paket_id, s.skor_putaran_1, s.skor_akhir,
           -- Dibebaskan tes penempatan: levelnya tidak melebihi yang lolos, DAN
           -- paketnya belum disentuh. Bukti yang diukur mengalahkan bukti yang
           -- diduga.
           (s.skor_putaran_1 is null
            and p.level_bloom is not null
            and p.level_bloom <= coalesce(pt.level_tertinggi_lolos, 0)) as dibebaskan
    from paket_topik p
    join topik t on t.id = p.topik_id
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    left join penempatan_topik pt
      on pt.learner_id = p_learner_id and pt.topik_id = p.topik_id
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
           count(*) filter (
             where skor_putaran_1 is not null or dibebaskan
           ) as paket_dikerjakan,
           count(*) filter (
             where skor_putaran_1 >= (select nilai from ambang) or dibebaskan
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
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13, FR11, Dokumen Fondasi 3.1). Ketuntasan dihitung dari paket latihan DI DALAM cakupan Bloom topiknya; paket di luar cakupan adalah pengayaan dan tidak menahan.';

-- 4. Eskalasi juga berhenti di batas yang sama ----------------------------------
--
-- Menggantikan versi migrasi 149. Dua paket berturut di bawah ambang memanggil
-- tutor — dan paket pengayaan tidak boleh memanggilnya. Seorang anak yang
-- tersendat di C6 pada topik yang kurikulumnya berhenti di C3 bukan anak yang
-- tersendat; ia anak yang sedang mengerjakan sesuatu yang tidak diminta darinya.
create or replace function periksa_eskalasi_dua_paket()
returns trigger
language plpgsql
security definer
set search_path = public
as $esk$
declare
  v_paket record;
  v_sebelumnya uuid;
  v_ambang numeric;
  v_skor_ini numeric;
  v_skor_sebelumnya numeric;
  v_tutor uuid;
  v_min smallint;
  v_maks smallint;
begin
  if new.paket_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select p.id, p.topik_id, p.jenis, p.nomor, p.level_bloom into v_paket
  from paket_topik p where p.id = new.paket_topik_id;

  if v_paket.jenis <> 'latihan' then return new; end if;

  select bloom_min, bloom_maks into v_min, v_maks from topik where id = v_paket.topik_id;

  -- Paket pengayaan tidak memicu apa pun.
  if v_min is not null and v_paket.level_bloom is not null
     and (v_paket.level_bloom < v_min or v_paket.level_bloom > v_maks) then
    return new;
  end if;

  if exists (
    select 1 from practice_sessions s
    where s.learner_id = new.learner_id
      and s.paket_topik_id = new.paket_topik_id
      and s.id <> new.id
      and (s.started_at, s.id) < (new.started_at, new.id)
  ) then
    return new;  -- bukan putaran pertama
  end if;

  -- Paket sebelumnya yang di dalam cakupan. Untuk topik yang mulai di C3
  -- (D-18), paket C2 bukan "paket sebelumnya" — ia bukan bagian dari
  -- kurikulum topik itu sama sekali.
  select p.id into v_sebelumnya
  from paket_topik p
  where p.topik_id = v_paket.topik_id
    and p.jenis = 'latihan'
    and p.nomor = v_paket.nomor - 1
    and (v_min is null or p.level_bloom is null
         or p.level_bloom between v_min and v_maks);

  if v_sebelumnya is null then return new; end if;

  select (nilai #>> '{}')::numeric into v_ambang
  from pengaturan where kunci = 'ambang_mastery';
  v_ambang := coalesce(v_ambang, 0.75);

  select skor_putaran_1 into v_skor_ini
  from skor_paket_topik(new.learner_id, new.paket_topik_id);
  select skor_putaran_1 into v_skor_sebelumnya
  from skor_paket_topik(new.learner_id, v_sebelumnya);

  -- Paket sebelumnya yang belum pernah dikerjakan bukan paket yang gagal.
  if v_skor_ini is null or v_skor_sebelumnya is null then return new; end if;
  if v_skor_ini >= v_ambang or v_skor_sebelumnya >= v_ambang then return new; end if;

  select l.tutor_penanggung_jawab_id into v_tutor
  from learners l where l.id = new.learner_id;

  insert into notifikasi_eskalasi
    (learner_id, tutor_penanggung_jawab_id, pemicu, paket_pemicu,
     ambang_berlaku, skor_pemicu)
  values
    (new.learner_id, v_tutor, 'dua_paket_berturut_di_bawah_ambang',
     array[v_sebelumnya, new.paket_topik_id],
     v_ambang, array[v_skor_sebelumnya, v_skor_ini])
  on conflict (learner_id, pemicu, paket_pemicu) do nothing;

  return new;
end;
$esk$;

notify pgrst, 'reload schema';
