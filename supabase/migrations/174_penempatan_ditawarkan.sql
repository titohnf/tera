-- ============================================================
-- Satu definisi untuk "tes penempatan boleh ditawarkan"
--
-- Migrasi 173 menaruh syaratnya di `penempatan_buka_sesi`, dan layar Misi
-- menyusun ulang syarat yang sama di TypeScript untuk memutuskan apakah
-- kartunya muncul. Dua salinan aturan yang sama adalah dua tempat yang harus
-- berubah bersama — dan yang satu tidak akan meledak kalau lupa diubah, cuma
-- menawarkan tombol yang menolak saat ditekan.
--
-- Salinan yang di TypeScript juga TIDAK PERNAH BEKERJA. Ia menghitung isi
-- kolam dengan membaca `question_bank_items` langsung, dan satu-satunya policy
-- pada tabel itu (migrasi 061) memberi hak baca kepada admin saja. Untuk
-- keluarga yang membuka layar Misi, kueri itu selalu pulang kosong, kolamnya
-- selalu terbaca nol, dan kartunya tidak pernah muncul untuk siapa pun.
-- Ditemukan di peramban: kartunya tidak ada di topik yang seharusnya
-- menawarkannya.
--
-- Yang benar adalah bertanya kepada yang memang tahu. Fungsi ini `security
-- definer`, memuat syarat yang sama persis dengan `penempatan_buka_sesi`, dan
-- menjadi satu-satunya jawaban atas pertanyaan "topik mana yang boleh
-- ditawarkan tes penempatan".
--
-- Jalankan SESUDAH 173.
-- ============================================================

create or replace function penempatan_ditawarkan(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (topik_id text)
language sql
stable
security definer
set search_path = public
as $$
  with aku as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner_id
  ),
  kolam as (
    select b.topik_id,
           count(*) filter (where b.bloom_level = 1) as c1,
           count(*) filter (where b.bloom_level = 2) as c2
    from question_bank_items b
    where b.peruntukan = 'penempatan' and b.status_verifikasi = 'aktif'
    group by b.topik_id
  )
  select k.topik_id
  from kolam k, aku
  where aku.learner_id is not null
    -- Kolamnya lengkap: empat butir di tiap level yang boleh dibebaskan.
    and k.c1 >= 4 and k.c2 >= 4
    -- Belum pernah dites.
    and not exists (
      select 1 from penempatan_topik pt
      where pt.learner_id = aku.learner_id and pt.topik_id = k.topik_id
    )
    -- Belum ada paket topik ini yang digarap. Menawarkan penempatan sesudah
    -- anak mulai mengerjakan adalah menawarkan jalan memutar yang ujungnya sama.
    and not exists (
      select 1
      from practice_sessions s
      join paket_topik p on p.id = s.paket_topik_id
      where s.learner_id = aku.learner_id and p.topik_id = k.topik_id
    );
$$;

comment on function penempatan_ditawarkan(text, uuid) is
  'Topik yang tes penempatannya masih boleh dibuka oleh pemanggil (Dokumen Fondasi Bagian 3.1). Syaratnya sama persis dengan `penempatan_buka_sesi` — ini definisi tunggalnya, supaya layar tidak menawarkan tombol yang menolak saat ditekan.';

grant execute on function penempatan_ditawarkan(text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
