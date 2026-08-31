-- ============================================================
-- Perbaikan `semai_paket_topik`: nama keluaran bentrok dengan nama kolom
--
-- Versi di migrasi 145 gagal dengan "column reference paket_id is ambiguous".
-- Sebabnya halus: `paket_id` adalah nama kolom KELUARAN fungsi (`returns table
-- (paket_id uuid, …)`), dan plpgsql memperlakukan nama keluaran sebagai
-- variabel. Begitu `on conflict (paket_id, question_bank_item_id)` ditulis
-- tanpa kualifikasi, penerjemah tidak tahu yang dimaksud kolom tabel atau
-- variabel keluaran — dan memilih mengeluh alih-alih menebak.
--
-- Diperbaiki dengan `#variable_conflict use_column`: di dalam fungsi ini, nama
-- yang bisa dibaca dua arah selalu berarti KOLOM. Itu yang benar di sini —
-- setiap nama bermasalah di badan fungsi ini memang merujuk kolom, dan
-- keluarannya hanya diisi lewat `return query` di ujung.
--
-- Alternatifnya menamai keluaran `out_paket_id` supaya tidak mungkin bentrok.
-- Tidak dipilih karena nama itu ikut terlihat oleh pemanggil lewat PostgREST,
-- dan menukar kejelasan di permukaan demi menghindari satu baris direktif
-- adalah pertukaran yang salah arah.
--
-- Selebihnya fungsinya sama persis dengan 145.
-- ============================================================

create or replace function semai_paket_topik(p_topik_id text)
returns table (paket_id uuid, jenis text, level_bloom smallint, jumlah_butir bigint)
language plpgsql
volatile
security definer
set search_path = public
as $$
#variable_conflict use_column
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
      returning paket_topik.id into v_paket;
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
    on conflict on constraint paket_topik_item_pkey do nothing;
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
      returning paket_topik.id into v_paket;
    end if;

    if not exists (select 1 from practice_sessions s where s.paket_topik_id = v_paket) then
      insert into paket_topik_item (paket_id, question_bank_item_id, ord)
      select v_paket, b.id, row_number() over (order by b.created_at, b.id)
      from question_bank_items b
      where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
      on conflict on constraint paket_topik_item_pkey do nothing;
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

notify pgrst, 'reload schema';
