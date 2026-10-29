-- ============================================================
-- Satu paket = satu sumber soal (satu Google Form / satu bank soal tutor)
--
-- Sampai 202 sebuah topik dibagi menjadi paket dengan memotong butirnya
-- sepuluh-sepuluh berdasarkan urutan dibuat. Itu mengaburkan asal soal: dua
-- asesmen berbeda bisa tercampur dalam satu paket, dan satu asesmen terbelah
-- dua. Padahal tutor membuat soalnya SEBAGAI asesmen (Google Form) atau bank
-- soal per topik, dan itulah satuan yang dikenal anak, tutor, dan keluarga.
--
-- Sekarang tiap butir boleh membawa `paket_kunci` ("form:<id berkas Drive>" atau
-- "doc:<id berkas Drive>"). Butir yang kuncinya sama dalam satu topik menjadi
-- satu paket, diurutkan dari yang terlama. Butir TANPA kunci tetap dipotong
-- sepuluh-sepuluh seperti dulu, jadi bank soal lama tidak berubah.
--
-- `paket_butir()` adalah SATU-SATUNYA tempat keanggotaan paket dihitung.
-- `practice_paket_items` (isi paket, dipakai juga oleh keadaan paket, membuka
-- sesi, dan mengunci) dan `practice_topic_progress` (jumlah paket per topik)
-- sama-sama membacanya — dua salinan aturan penomoran pernah menyimpang.
--
-- Fungsi ini tidak punya gerbang akses sendiri: pemanggilnya (semuanya
-- `security definer` dengan gerbang `practice_actor()`) yang menyaring. Karena
-- itu eksekusinya dicabut dari peran biasa.
-- ============================================================

alter table question_bank_items
  add column if not exists paket_kunci text;

comment on column question_bank_items.paket_kunci is
  'Sumber paket: butir ber-kunci sama di satu topik menjadi satu paket. Null = dipotong sepuluh-sepuluh (perilaku lama). Diisi sinkron soal Drive: form:<id> atau doc:<id>.';

create index if not exists question_bank_items_paket_kunci_idx
  on question_bank_items (paket_kunci) where paket_kunci is not null;

create or replace function paket_butir(
  p_group_id uuid default null,
  p_hanya_publik boolean default false
)
returns table (group_id uuid, item_id uuid, paket_index integer, ord integer)
language sql
stable
security definer
set search_path = public
as $$
  with dasar as (
    select t.group_id, b.id as item_id, b.created_at, b.paket_kunci,
           -- Hanya butir tanpa kunci yang dipotong sepuluh-sepuluh.
           row_number() over (
             partition by t.group_id, (b.paket_kunci is null)
             order by b.created_at, b.id
           ) as rn_bebas
    from question_curriculum_tags t
    join question_bank_items b on b.id = t.question_bank_item_id
    where (p_group_id is null or t.group_id = p_group_id)
      -- Disaring SEBELUM dinomori (lihat 134): menyaring sesudahnya membuat paket
      -- berisi butir yang tak terlihat tanpa sebab yang bisa dijelaskan.
      and b.type not in ('essay', 'upload_file')
      and b.status_verifikasi = 'aktif'
      and (not p_hanya_publik or b.is_public)
  ),
  berkunci as (
    select *, coalesce(paket_kunci, 'bebas:' || ((rn_bebas - 1) / 10)::text) as k
    from dasar
  ),
  awal as (
    select *, min(created_at) over (partition by group_id, k) as awal_k
    from berkunci
  )
  select group_id,
         item_id,
         (dense_rank() over (partition by group_id order by awal_k, k))::integer,
         (row_number() over (partition by group_id, k order by created_at, item_id))::integer
  from awal;
$$;

revoke execute on function paket_butir(uuid, boolean) from public, anon, authenticated;

-- Isi tiap paket ------------------------------------------------------------

create or replace function practice_paket_items(
  p_group_id uuid,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (paket_index integer, item_id uuid, ord integer)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  )
  select pb.paket_index, pb.item_id, pb.ord
  from paket_butir(p_group_id, practice_only_public(coalesce(p_access_code, ''), p_learner_id)) pb
  where (select learner from me) is not null;
$$;

-- Jumlah paket per topik, untuk label kartu mapel di menu Belajar --------------
--
-- Satu baris per topik yang punya minimal satu paket aktif. Kartu mapel
-- menjumlahkannya, dan menghitung topik serta materinya sendiri.

create or replace function practice_paket_per_topik(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (group_id uuid, subject_id uuid, grade_level text, paket bigint)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  )
  select pb.group_id, g.subject_id, g.grade_level, count(distinct pb.paket_index)
  from paket_butir(null, practice_only_public(coalesce(p_access_code, ''), p_learner_id)) pb
  join curriculum_topic_groups g on g.id = pb.group_id
  where (select learner from me) is not null
  group by pb.group_id, g.subject_id, g.grade_level;
$$;

grant execute on function practice_paket_per_topik(text, uuid) to authenticated;

-- Penguasaan per topik: jumlah paket kini dari paket_butir() ----------------------

drop function if exists practice_topic_progress(text, uuid, uuid);

create or replace function practice_topic_progress(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_subject_id uuid default null
)
returns table (
  group_id uuid,
  answered bigint,
  total bigint,
  score numeric,
  max_score numeric,
  max_available numeric,
  first_score numeric,
  correct bigint,
  partial bigint,
  wrong bigint,
  paket_total bigint,
  paket_tuntas bigint,
  paket_sempurna bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  pool as (
    select distinct g.id as group_id, b.id as item_id, b.weight
    from curriculum_topic_groups g
    join question_curriculum_tags t on t.group_id = g.id
    join question_bank_items b on b.id = t.question_bank_item_id
    where (select learner from me) is not null
      and (p_subject_id is null or g.subject_id = p_subject_id)
      and b.type not in ('essay', 'upload_file')
      -- Hanya butir `aktif` yang sampai ke murid (PRD Tahap 0 FR1, migrasi
      -- 141). Disaring SEBELUM dinomori, dengan alasan yang sama persis yang
      -- sudah ditulis di `practice_paket_items` untuk esai: menyaringnya
      -- sesudah membuat paket berisi sembilan soal tanpa sebab yang terlihat.
      -- Akibatnya keanggotaan paket bergeser saat sebuah butir dinaikkan ke
      -- `aktif` — itu memang harganya, dan lebih murah daripada menyajikan
      -- butir yang kunci jawabannya belum diverifikasi siapa pun.
      and b.status_verifikasi = 'aktif'
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  ),
  terakhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
    order by a.question_bank_item_id, a.answered_at desc
  ),
  pertama as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
    order by a.question_bank_item_id, a.answered_at asc
  ),
  -- Nomor paket dari `paket_butir()` (203), bukan lagi dipotong sepuluh-sepuluh
  -- di sini: satu angka kebenaran untuk keanggotaan paket.
  paket as (
    select pb.group_id, pb.paket_index, pb.item_id
    from paket_butir(null, practice_only_public(coalesce(p_access_code, ''), p_learner_id)) pb
    join pool p on p.group_id = pb.group_id and p.item_id = pb.item_id
  ),
  paket_selesai as (
    select k.group_id,
           k.paket_index,
           bool_and(
             t.question_bank_item_id is not null
             and coalesce(t.max_score, 0) > 0
             and coalesce(t.score, 0) >= t.max_score
           ) as sempurna
    from paket k
    left join terakhir t on t.question_bank_item_id = k.item_id
    group by k.group_id, k.paket_index
  ),
  paket_ringkas as (
    select ps.group_id,
           count(*) as jumlah,
           count(*) filter (where ps.sempurna) as sempurna,
           count(*) filter (
             where ps.sempurna
                or exists (
                  select 1 from practice_paket_locks l
                  where l.learner_id = (select learner from me)
                    and l.group_id = ps.group_id
                    and l.paket_index = ps.paket_index
                )
           ) as tuntas
    from paket_selesai ps
    group by ps.group_id
  )
  select p.group_id,
         count(t.question_bank_item_id),
         count(*),
         coalesce(sum(t.score), 0),
         coalesce(sum(t.max_score), 0),
         coalesce(sum(p.weight), 0),
         coalesce(sum(f.score), 0),
         count(*) filter (
           where t.question_bank_item_id is not null
             and coalesce(t.max_score, 0) > 0
             and coalesce(t.score, 0) >= t.max_score
         ),
         count(*) filter (
           where t.question_bank_item_id is not null
             and coalesce(t.score, 0) > 0
             and coalesce(t.score, 0) < coalesce(t.max_score, 0)
         ),
         count(*) filter (
           where t.question_bank_item_id is not null
             and (coalesce(t.score, 0) <= 0 or coalesce(t.max_score, 0) <= 0)
         ),
         coalesce(max(pr.jumlah), 0),
         coalesce(max(pr.tuntas), 0),
         coalesce(max(pr.sempurna), 0)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  left join paket_ringkas pr on pr.group_id = p.group_id
  group by p.group_id;
$$;

notify pgrst, 'reload schema';
