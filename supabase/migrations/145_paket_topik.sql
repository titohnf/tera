-- ============================================================
-- Paket yang keanggotaannya ditulis, bukan dihitung
--
-- Migrasi 134 menetapkan paket sebagai pembagian TETAP bank sebuah grup per
-- sepuluh butir, dihitung `row_number()`. Untuk latihan bebas itu bentuk yang
-- tepat: tidak ada kurator, dan sepuluh adalah angka yang jujur karena tidak
-- berpura-pura punya alasan pedagogis.
--
-- Paket pengukuran menuntut yang sebaliknya. PRD Tahap 0 FR2 meminta tiga paket
-- latihan — satu per level Bloom, 8 butir masing-masing — dan satu paket ujian
-- 12 butir yang mengikuti blueprint. Tidak satu pun bisa diungkapkan oleh
-- aturan "sepuluh berikutnya": 8/8/8 bukan 10/10/4, dan urutan `created_at`
-- tidak tahu apa-apa tentang level Bloom.
--
-- Maka keanggotaan ditulis sebagai baris. Tiga akibat yang disengaja:
--
-- 1. **Celah exposure yang ditagih migrasi 140 tertutup.** Selama isi paket
--    dihitung dari "semua soal di grup ini", 12 butir ujian yang kebetulan
--    setopik ikut terseret ke latihan. Dengan keanggotaan eksplisit, tidak ada
--    lagi kueri yang bisa menyeretnya — butir ujian tidak pernah menjadi baris
--    di paket latihan.
-- 2. **Paket tidak bergeser saat bank bertambah.** Menambah butir ke-25 tidak
--    mengubah isi paket manapun; ia baru masuk kalau kurator memasukkannya.
-- 3. **Butir yang ditarik tetap hilang dari layar.** Keanggotaan tidak sama
--    dengan penyajian — penyaring `status_verifikasi = 'aktif'` hidup di fungsi
--    penyaji (migrasi berikutnya), jadi butir yang ditarik lenyap dari paket
--    tanpa keanggotaannya diutak-atik. Paket boleh menyajikan tujuh dari
--    delapan butir; itu keadaan yang benar, bukan paket yang rusak.
--
-- Keluarga `practice_paket_*` (134) TIDAK disentuh dan tetap melayani mapel
-- yang tidak punya peta kompetensi.
-- ============================================================

-- 1. Paket --------------------------------------------------------------------

create table if not exists paket_topik (
  id uuid primary key default gen_random_uuid(),
  topik_id text not null references topik(id) on delete restrict,
  jenis text not null default 'latihan' check (jenis in ('latihan', 'ujian')),
  -- Diisi untuk paket latihan (satu level per paket, dokumen fondasi Bagian
  -- 3.2); NULL untuk paket ujian, yang justru MENCAMPUR level supaya murid
  -- tidak diberi tahu "sekarang soal C3" (dokumen fondasi Bagian 3.7).
  level_bloom smallint check (level_bloom is null or level_bloom between 1 and 6),
  nomor int not null,
  dibuat_pada timestamptz not null default now(),
  unique (topik_id, jenis, nomor)
);

comment on table paket_topik is
  'Paket berbasis peta kompetensi: 3 paket latihan per level Bloom + paket ujian (PRD FR2). Bukan pembagian per sepuluh seperti practice_paket_* di migrasi 134.';

create table if not exists paket_topik_item (
  paket_id uuid not null references paket_topik(id) on delete cascade,
  question_bank_item_id uuid not null references question_bank_items(id) on delete restrict,
  ord int not null,
  primary key (paket_id, question_bank_item_id),
  unique (paket_id, ord)
);

create index if not exists paket_topik_item_butir_idx
  on paket_topik_item(question_bank_item_id);

-- `on delete restrict` pada butirnya: menghapus soal yang sudah jadi anggota
-- paket akan meninggalkan paket berlubang tanpa ada yang tahu. Yang benar
-- adalah menariknya (`status_verifikasi = 'ditarik'`), yang membuatnya hilang
-- dari penyajian sambil meninggalkan jejaknya utuh.

-- Butir ujian tidak boleh jadi anggota paket latihan, dan sebaliknya.
--
-- Protokol Uji Coba Bagian 4 menuntut kedua kolam eksklusif. `peruntukan`
-- (migrasi 142) sudah menyatakan niat penulisnya per butir; trigger ini yang
-- membuat niat itu tidak bisa dilanggar saat paket disusun — termasuk oleh
-- tangan yang menyusunnya manual di SQL Editor setahun dari sekarang.
create or replace function jaga_peruntukan_paket()
returns trigger
language plpgsql
as $$
declare
  v_jenis text;
  v_peruntukan text;
begin
  select p.jenis into v_jenis from paket_topik p where p.id = new.paket_id;
  select b.peruntukan into v_peruntukan
  from question_bank_items b where b.id = new.question_bank_item_id;

  -- Butir tanpa peruntukan boleh masuk ke mana saja: ia ditulis sebelum kolam
  -- pilot dibedakan, dan memaksanya memilih sekarang bukan urusan trigger.
  if v_peruntukan is not null and v_peruntukan <> v_jenis then
    raise exception
      'Butir berperuntukan % tidak boleh masuk paket %  — kedua kolam harus eksklusif (Protokol Uji Coba Bagian 4)',
      v_peruntukan, v_jenis;
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_peruntukan_paket on paket_topik_item;
create trigger jaga_peruntukan_paket
  before insert or update on paket_topik_item
  for each row execute function jaga_peruntukan_paket();

-- 2. Sesi menunjuk paketnya ---------------------------------------------------

alter table practice_sessions
  add column if not exists paket_topik_id uuid references paket_topik(id) on delete set null;

create index if not exists practice_sessions_paket_topik_idx
  on practice_sessions(learner_id, paket_topik_id);

comment on column practice_sessions.paket_topik_id is
  'Paket peta kompetensi yang sedang dikerjakan. Null untuk sesi latihan bebas, yang memakai paket_group_id.';

-- 3. Kunci jawaban yang sudah dibuka ------------------------------------------
--
-- Bentuknya menyalin `practice_paket_locks` (134) beserta alasannya: yang
-- dicatat cuma FAKTA bahwa kuncinya sudah dibuka, tanpa membekukan nilai —
-- angka yang disalin ke tempat kedua cepat atau lambat berbeda dari sumbernya.

create table if not exists paket_topik_kunci (
  learner_id uuid not null references learners(id) on delete cascade,
  paket_id uuid not null references paket_topik(id) on delete cascade,
  locked_at timestamptz not null default now(),
  primary key (learner_id, paket_id)
);

-- 4. RLS ----------------------------------------------------------------------

alter table paket_topik enable row level security;
alter table paket_topik_item enable row level security;
alter table paket_topik_kunci enable row level security;

-- Susunan paket dikelola admin. Murid tidak pernah membacanya langsung: seluruh
-- jalan masuknya lewat fungsi `security definer` di migrasi berikutnya, yang
-- gerbangnya `practice_actor()` — sama dengan seluruh keluarga `practice_*`.
drop policy if exists "Admin mengelola paket topik" on paket_topik;
create policy "Admin mengelola paket topik" on paket_topik
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Admin mengelola isi paket topik" on paket_topik_item;
create policy "Admin mengelola isi paket topik" on paket_topik_item
  for all using (is_admin()) with check (is_admin());

-- `paket_topik_kunci` sengaja tanpa satu pun policy, persis seperti
-- `practice_paket_locks`: policy `using (true)` di sini akan membiarkan
-- pemegang anon key mengunci paket milik anak orang lain.

-- 5. Penyemaian dari bank ------------------------------------------------------
--
-- Menyusun paket dengan tangan untuk 36 butir bisa saja, tapi tim konten sudah
-- menyatakan level Bloom dan peruntukan tiap butir saat menulisnya — menyuruh
-- mereka menyatakannya ulang sebagai susunan paket berarti menanyakan hal yang
-- sama dua kali, dan dua jawaban yang bisa berbeda.
--
-- Fungsi ini menurunkan susunan itu: satu paket latihan per level Bloom, satu
-- paket ujian berisi seluruh butir ujian. Kurator tetap bisa menyusun ulang
-- sesudahnya — yang disemai baris biasa, bukan baris istimewa.
--
-- AMAN DIULANG: paket yang sudah pernah dikerjakan (punya sesi) dilewati, jadi
-- menjalankan ulang sesudah butir baru diaktifkan hanya menambah yang belum
-- ada, bukan mengacak-acak paket yang sedang dikerjakan murid.
create or replace function semai_paket_topik(p_topik_id text)
returns table (paket_id uuid, jenis text, level_bloom smallint, jumlah_butir bigint)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_paket uuid;
  v_level smallint;
begin
  -- Paket latihan: satu per level Bloom yang benar-benar ada butirnya.
  for v_level in
    select distinct b.bloom_level
    from question_bank_items b
    where b.topik_id = p_topik_id
      and coalesce(b.peruntukan, 'latihan') = 'latihan'
      and b.bloom_level is not null
    order by 1
  loop
    select p.id into v_paket
    from paket_topik p
    where p.topik_id = p_topik_id and p.jenis = 'latihan' and p.nomor = v_level;

    if v_paket is null then
      insert into paket_topik (topik_id, jenis, level_bloom, nomor)
      values (p_topik_id, 'latihan', v_level, v_level)
      returning id into v_paket;
    elsif exists (select 1 from practice_sessions s where s.paket_topik_id = v_paket) then
      continue;
    end if;

    insert into paket_topik_item (paket_id, question_bank_item_id, ord)
    select v_paket, b.id,
           row_number() over (order by b.created_at, b.id)
    from question_bank_items b
    where b.topik_id = p_topik_id
      and coalesce(b.peruntukan, 'latihan') = 'latihan'
      and b.bloom_level = v_level
    on conflict (paket_id, question_bank_item_id) do nothing;
  end loop;

  -- Paket ujian: satu, mencampur level (dokumen fondasi Bagian 3.7).
  if exists (
    select 1 from question_bank_items b
    where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
  ) then
    select p.id into v_paket
    from paket_topik p
    where p.topik_id = p_topik_id and p.jenis = 'ujian' and p.nomor = 1;

    if v_paket is null then
      insert into paket_topik (topik_id, jenis, level_bloom, nomor)
      values (p_topik_id, 'ujian', null, 1)
      returning id into v_paket;
    end if;

    if not exists (select 1 from practice_sessions s where s.paket_topik_id = v_paket) then
      insert into paket_topik_item (paket_id, question_bank_item_id, ord)
      select v_paket, b.id, row_number() over (order by b.created_at, b.id)
      from question_bank_items b
      where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
      on conflict (paket_id, question_bank_item_id) do nothing;
    end if;
  end if;

  return query
    select p.id, p.jenis, p.level_bloom, count(i.question_bank_item_id)
    from paket_topik p
    left join paket_topik_item i on i.paket_id = p.id
    where p.topik_id = p_topik_id
    group by p.id, p.jenis, p.level_bloom, p.nomor
    order by p.jenis desc, p.nomor;
end;
$$;

comment on function semai_paket_topik(text) is
  'Menyusun paket sebuah topik dari bank: satu paket latihan per level Bloom, satu paket ujian. Aman diulang — paket yang sudah dikerjakan dilewati.';

notify pgrst, 'reload schema';
