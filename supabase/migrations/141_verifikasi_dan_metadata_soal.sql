-- ============================================================
-- FR1: butir soal punya riwayat verifikasi, dan metadata yang membuatnya bisa
-- diukur
--
-- Bank soal hari ini menyimpan cukup untuk MENYAJIKAN sebuah soal (tipe,
-- pertanyaan, opsi, kunci, bobot, pembahasan, bloom_level) tapi belum cukup
-- untuk MEMPERCAYAINYA sebagai instrumen ukur. Dua hal yang hilang:
--
--   1. Jejak verifikasi. Dokumen fondasi Bagian 3.12 menempatkan verifikasi
--      matematis independen sebagai langkah yang "wajib, tidak boleh dilewati",
--      dengan alasan yang tidak berlebihan: kunci jawaban yang salah
--      meruntuhkan validitas seluruh sistem pengukuran yang dibangun di atasnya.
--      Tanpa kolom status, "sudah diverifikasi belum?" cuma bisa dijawab dari
--      ingatan orang.
--   2. Metadata pengukuran — penjelasan per opsi (untuk analisis distraktor),
--      pola SOLO, elemen proses, tag konteks PISA, label kategori.
--
-- SATU PERUBAHAN PERILAKU YANG PERLU DISADARI. Sesudah migrasi ini, butir baru
-- lahir sebagai `draf` dan TIDAK muncul di undian latihan mandiri sampai
-- statusnya `aktif`. Untuk butir yang sudah ada, migrasi ini mengisi `aktif`
-- (backfill) supaya tidak ada yang hilang dari layar murid gara-gara kolom
-- baru. Hari ini backfill itu tidak menyentuh apa pun — `question_bank_items`
-- kosong — tapi ia yang membuat migrasi ini tetap benar kalau dijalankan di
-- lingkungan yang banknya terisi.
--
-- Cadangan `soal-2026-08-30` sengaja TIDAK dikecualikan dari aturan itu: kalau
-- ke-32 butirnya dipulihkan nanti, mereka mendarat sebagai `draf`. Itu memang
-- keadaan yang benar — tidak satu pun punya `bloom_level` maupun pembahasan,
-- jadi tidak ada yang bisa lolos jadi instrumen ukur tanpa ditulis ulang.
-- ============================================================

-- 1. Status verifikasi ----------------------------------------------------------

alter table question_bank_items
  add column if not exists status_verifikasi text not null default 'draf';

-- Backfill sebelum constraint dipasang: baris lama lahir sebelum kolom ini ada,
-- dan memaksanya jadi draf berarti menarik soal yang sudah dipakai murid dari
-- peredaran tanpa ada yang meminta.
-- Tanpa `where`: setiap baris yang ADA pada detik ini lahir sebelum kolomnya,
-- dan itulah definisi "butir lama" yang dimaksud. Baris yang datang sesudah
-- migrasi mengambil default `draf` seperti seharusnya.
update question_bank_items set status_verifikasi = 'aktif';

alter table question_bank_items
  drop constraint if exists question_bank_items_status_verifikasi_check;
alter table question_bank_items
  add constraint question_bank_items_status_verifikasi_check
  check (status_verifikasi in ('draf', 'terverifikasi_matematis', 'direview_pedagogis', 'aktif', 'ditarik'));

create index if not exists question_bank_items_status_idx
  on question_bank_items(status_verifikasi);

comment on column question_bank_items.status_verifikasi is
  'Tahap verifikasi butir (FR1). Hanya `aktif` yang boleh sampai ke murid.';

-- Transisi tidak boleh melompat ------------------------------------------------
--
-- PRD FR1 meminta lompatan "ditolak sistem atau minimal diberi peringatan".
-- Dipilih ditolak, dan dijaga di database alih-alih di satu layar: yang menulis
-- ke tabel ini ada dua aplikasi, dan aturan yang cuma hidup di satu formulir
-- adalah aturan yang bisa dilewati lewat formulir yang lain.
--
-- Yang diizinkan:
--   maju satu langkah   draf → terverifikasi_matematis → direview_pedagogis → aktif
--   ditarik kapan saja  apa pun → ditarik
--   dihidupkan lagi     ditarik → draf (mulai dari awal, bukan kembali ke aktif)
--   mundur satu langkah supaya reviewer bisa mengembalikan pekerjaan
--
-- Yang ditolak: draf → aktif, dan seluruh lompatan sejenis.
create or replace function jaga_transisi_status_soal()
returns trigger
language plpgsql
as $$
declare
  v_urutan constant text[] := array['draf', 'terverifikasi_matematis', 'direview_pedagogis', 'aktif'];
  v_lama int;
  v_baru int;
begin
  if new.status_verifikasi is not distinct from old.status_verifikasi then
    return new;
  end if;

  -- Menarik butir dari peredaran selalu boleh: kunci jawaban yang ternyata
  -- salah harus bisa dihentikan detik itu juga, bukan sesudah melewati alur.
  if new.status_verifikasi = 'ditarik' then
    return new;
  end if;

  if old.status_verifikasi = 'ditarik' then
    if new.status_verifikasi = 'draf' then
      return new;
    end if;
    raise exception
      'Butir yang ditarik hanya bisa dihidupkan lagi sebagai draf, bukan langsung ke %',
      new.status_verifikasi;
  end if;

  v_lama := array_position(v_urutan, old.status_verifikasi);
  v_baru := array_position(v_urutan, new.status_verifikasi);

  if abs(v_baru - v_lama) > 1 then
    raise exception
      'Status soal tidak boleh melompat dari % ke % — lewati tahapannya berurutan',
      old.status_verifikasi, new.status_verifikasi;
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_transisi_status_soal on question_bank_items;
create trigger jaga_transisi_status_soal
  before update of status_verifikasi on question_bank_items
  for each row execute function jaga_transisi_status_soal();

-- 2. Metadata pengukuran --------------------------------------------------------

alter table question_bank_items
  -- Pembahasan PER OPSI, bukan satu paragraf untuk seluruh soal. Ini yang
  -- membuat analisis distraktor mungkin (dokumen fondasi Bagian 3.10):
  -- "opsi B paling sering dipilih" hanya berguna kalau ada yang menuliskan
  -- miskonsepsi apa yang diwakili opsi B. Kolom `explanation` yang lama tetap
  -- dipakai untuk pembahasan umum.
  add column if not exists penjelasan_per_opsi jsonb,
  -- Pola SOLO yang dirancang untuk soal multi-select (dokumen fondasi 2.3).
  add column if not exists pola_solo text,
  -- Elemen Proses resmi CP Matematika yang ditekankan butir ini. Array: satu
  -- soal boleh menekankan lebih dari satu.
  add column if not exists elemen_proses text[],
  -- Konteks gaya PISA, hanya relevan C4 ke atas — jadi kosong untuk seluruh
  -- butir pilot yang berhenti di C3.
  add column if not exists tag_konteks_pisa text,
  -- Label dua kategori pada soal Benar-Salah. Contoh soal resmi TKA
  -- menunjukkan labelnya tidak selalu "Benar/Salah" literal (bisa
  -- "Mungkin/Tidak Mungkin") — lihat Rubrik Bagian 4.2.
  add column if not exists label_kategori jsonb,
  add column if not exists sumber_pembuatan text not null default 'manual',
  -- Butir paralel: variasi angka/konteks dari butir yang sudah tervalidasi
  -- (dokumen fondasi Bagian 3.9). Menunjuk induknya, bukan sebaliknya.
  add column if not exists item_paralel_dari_id uuid references question_bank_items(id) on delete set null;

alter table question_bank_items
  drop constraint if exists question_bank_items_pola_solo_check;
alter table question_bank_items
  add constraint question_bank_items_pola_solo_check
  check (pola_solo is null or pola_solo in ('unistruktural', 'multistruktural', 'relasional'));

alter table question_bank_items
  drop constraint if exists question_bank_items_konteks_pisa_check;
alter table question_bank_items
  add constraint question_bank_items_konteks_pisa_check
  check (tag_konteks_pisa is null or tag_konteks_pisa in ('personal', 'occupational', 'societal', 'scientific'));

alter table question_bank_items
  drop constraint if exists question_bank_items_sumber_check;
alter table question_bank_items
  add constraint question_bank_items_sumber_check
  check (sumber_pembuatan in ('manual', 'ai_generated_verified'));

-- Array dijaga isinya, bukan cuma tipenya: `text[]` tanpa ini menerima salah
-- ketik apa pun, dan elemen proses yang salah eja tidak akan pernah muncul di
-- laporan mana pun — hilang diam-diam, bukan gagal.
alter table question_bank_items
  drop constraint if exists question_bank_items_elemen_proses_check;
alter table question_bank_items
  add constraint question_bank_items_elemen_proses_check
  check (
    elemen_proses is null
    or elemen_proses <@ array['penalaran', 'pemecahan_masalah', 'komunikasi', 'representasi', 'koneksi']::text[]
  );

create index if not exists question_bank_items_paralel_idx
  on question_bank_items(item_paralel_dari_id);

-- 3. Hanya butir `aktif` yang sampai ke murid -----------------------------------
--
-- Penjagaan FR1 dipasang DI SUMBER UNDIAN, bukan di layar yang memanggilnya.
-- Sama persis dengan alasan trigger di atas: ada lebih dari satu pemanggil, dan
-- satu-satunya tempat yang tidak bisa dilewati siapa pun adalah tempat soalnya
-- diambil.
--
-- Selebihnya fungsi ini tidak berubah — urutan undian (belum pernah dijawab
-- dulu, lalu yang masih salah, lalu yang paling lama tak disentuh) dan gerbang
-- `practice_only_public` tetap apa adanya.
create or replace function practice_draw_questions(
  p_access_code text,
  p_group_ids uuid[],
  p_limit integer,
  p_learner_id uuid default null
)
returns table (id uuid, type text, prompt text, options jsonb, weight numeric, stimulus_images text[])
language sql
volatile
security definer
set search_path = public
as $$
  with me as (
    select a.learner_id
    from (select practice_actor(p_access_code, p_learner_id) as learner_id) a
    where a.learner_id is not null
  ),
  pool as (
    select distinct b.id, b.type, b.prompt, b.options, b.weight, b.stimulus_images
    from question_bank_items b
    join question_curriculum_tags t on t.question_bank_item_id = b.id
    cross join me
    where (p_group_ids is null
       or cardinality(p_group_ids) = 0
       or t.group_id = any (p_group_ids))
      and (b.is_public or not practice_only_public(p_access_code, p_learner_id))
      and b.status_verifikasi = 'aktif'
  ),
  history as (
    select pa.question_bank_item_id,
           bool_or(coalesce(pa.is_correct, false)) as ever_correct,
           max(pa.answered_at) as last_seen
    from practice_answers pa
    join me on me.learner_id = pa.learner_id
    group by pa.question_bank_item_id
  )
  select pool.id, pool.type, pool.prompt, pool.options, pool.weight, pool.stimulus_images
  from pool
  left join history on history.question_bank_item_id = pool.id
  order by
    case
      when history.question_bank_item_id is null then 0
      when not history.ever_correct then 1
      else 2
    end,
    history.last_seen nulls first,
    random()
  limit greatest(coalesce(p_limit, 10), 1);
$$;

notify pgrst, 'reload schema';
