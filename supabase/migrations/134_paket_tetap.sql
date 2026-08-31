-- ============================================================
-- Paket: pembagian TETAP bank soal, bukan sekumpulan undian
--
-- Migrasi 133 salah menebak apa itu paket. Di sana paket = satu sesi, yaitu
-- sepuluh soal yang kebetulan terundi bersama; dua orang yang mengerjakan
-- "Paket 1" topik yang sama mengerjakan soal yang berbeda, dan mengulang sebuah
-- paket berarti mengundi sepuluh soal lain lagi. Yang benar sebaliknya: PAKET
-- ADALAH PEMBAGIAN BANK SOALNYA. Topik dengan 20 soal punya dua paket yang
-- isinya tetap — Paket 1 soal ke-1 sampai ke-10, Paket 2 soal ke-11 sampai
-- ke-20 — dan "Paket 1" berarti soal yang sama bagi siapa pun, kapan pun.
--
-- Yang berubah karena itu:
--
-- 1. TIDAK ADA UNDIAN untuk latihan topik. `practice_draw_questions` memilih
--    soal berdasarkan riwayat; paket tidak memilih apa pun, ia sudah ditentukan
--    urutannya. Undiannya tetap hidup untuk pemakai lain fungsi itu.
--
-- 2. SATU PAKET DIKERJAKAN BERKALI-KALI, dan putaran kedua hanya memuat soal
--    yang MASIH salah. Anak yang benar 6 dari 10 mengerjakan 4 soal di putaran
--    berikutnya, bukan sepuluh-sepuluhnya lagi. Nilai paket karena itu tidak
--    pernah "dipilih dari percobaan mana": ia keadaan sekarang dari kesepuluh
--    soal itu, dan ia hanya bisa naik.
--
-- 3. PUTARAN YANG DITINGGALKAN TIDAK BERNILAI. Yang dihitung cuma jawaban dari
--    sesi yang `finished_at`-nya terisi. Anak yang menutup tab di soal ketiga
--    tidak menambah maupun mengurangi apa pun — dan itu juga yang membuat
--    "mengulang" tidak pernah berisiko.
--
-- 4. MEMBUKA KUNCI MENGUNCI PAKETNYA. Sesudah kuncinya terbaca, paket itu tidak
--    bisa dikerjakan lagi dan nilainya berhenti di situ. Ini yang membuat
--    seluruh alurnya punya taruhan: selama kunci belum dibuka, mencoba lagi
--    selalu menguntungkan; begitu dibuka, yang tersisa tinggal belajar dari
--    pembahasannya. Tanpa penguncian, "lihat kunci lalu ulangi" adalah jalan
--    pintas menuju 100% yang tidak mengajarkan apa pun.
--
-- URUTAN SOALNYA `created_at` lalu `id` — tetap, dan tetap DALAM ARTI YANG
-- PENTING: soal yang ditambahkan kemudian selalu mendarat di belakang, jadi
-- keanggotaan paket yang sudah ada tidak pernah bergeser. Mengurutkan dengan
-- sesuatu yang bisa disunting (bobot, judul) akan membuat "Paket 1" berubah isi
-- diam-diam, dan nilai yang tersimpan jadi nilai atas soal yang berbeda.
--
-- Sisa yang tidak genap sepuluh jadi paket terakhir yang lebih kecil. Aturan
-- yang bisa ditebak, dan paket kerdil itu hilang sendiri begitu banknya
-- bertambah.
-- ============================================================

-- 1. Sesi tahu ia paket yang mana --------------------------------------------
--
-- `paket_of` dari 133 dibuang: dalam model ini "perbaikan" bukan jenis sesi
-- tersendiri melainkan PUTARAN BERIKUTNYA dari paket yang sama, dan yang
-- mengikatnya cukup pasangan (topik, nomor paket).

alter table practice_sessions drop column if exists paket_of;

alter table practice_sessions
  add column if not exists paket_group_id uuid references curriculum_topic_groups(id) on delete set null,
  add column if not exists paket_index integer;

create index if not exists practice_sessions_paket_idx
  on practice_sessions(learner_id, paket_group_id, paket_index);

comment on column practice_sessions.paket_group_id is
  'Topik paketnya. Null untuk sesi lama yang lahir sebelum paket ada.';
comment on column practice_sessions.paket_index is
  'Nomor paket di topik itu, mulai 1. Beberapa sesi dengan nomor sama = beberapa putaran.';

-- 2. Kunci yang sudah dibuka --------------------------------------------------
--
-- Tabelnya sengaja cuma mencatat FAKTA "kunci paket ini sudah dibuka", tanpa
-- menyimpan nilai beku. Nilainya tetap dihitung dari jawaban seperti biasa —
-- yang berhenti bukan angkanya melainkan kemampuan menambah putaran, dan angka
-- yang disalin ke tempat kedua cepat atau lambat berbeda dari sumbernya.

create table if not exists practice_paket_locks (
  learner_id uuid not null references learners(id) on delete cascade,
  group_id uuid not null references curriculum_topic_groups(id) on delete cascade,
  paket_index integer not null,
  locked_at timestamptz not null default now(),
  primary key (learner_id, group_id, paket_index)
);

alter table practice_paket_locks enable row level security;

-- Tanpa satu pun policy: seluruh jalan masuknya lewat fungsi `security definer`
-- di bawah, yang gerbangnya `practice_actor()` — sama dengan seluruh keluarga
-- `practice_*`. Policy `using (true)` di tabel ini akan membiarkan siapa pun
-- yang punya anon key mengunci paket milik anak orang lain.

-- 3. Isi tiap paket -----------------------------------------------------------

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
  ),
  kumpulan as (
    select b.id as item_id,
           row_number() over (order by b.created_at, b.id) as rn
    from question_curriculum_tags t
    join question_bank_items b on b.id = t.question_bank_item_id
    where t.group_id = p_group_id
      and (select learner from me) is not null
      -- Tipe tanpa nilai otomatis disaring SEBELUM dinomori. Menyaringnya
      -- sesudah akan membuat paket berisi sembilan soal tanpa alasan yang bisa
      -- dilihat, dan keanggotaannya bergeser begitu satu soal esai ditambahkan.
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
  )
  select ((rn - 1) / 10 + 1)::integer,
         item_id,
         ((rn - 1) % 10 + 1)::integer
  from kumpulan;
$$;

-- 4. Keadaan tiap paket -------------------------------------------------------
--
-- Satu baris per paket: berapa soalnya, berapa yang sudah benar SEKARANG,
-- sudah berapa putaran, dan apakah kuncinya sudah dibuka.

create or replace function practice_paket_state(
  p_group_id uuid,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  paket_index integer,
  total bigint,
  benar bigint,
  sebagian bigint,
  salah bigint,
  belum bigint,
  skor numeric,
  maks numeric,
  putaran bigint,
  terkunci boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  ),
  isi as (
    select * from practice_paket_items(p_group_id, coalesce(p_access_code, ''), p_learner_id)
  ),
  -- Jawaban terakhir tiap soal, HANYA dari putaran yang selesai. Putaran yang
  -- ditinggalkan di tengah tidak bernilai — tidak menaikkan, tidak menurunkan.
  jawaban as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
      and s.paket_group_id = p_group_id
    order by a.question_bank_item_id, a.answered_at desc
  ),
  putaran as (
    select s.paket_index, count(*) as n
    from practice_sessions s
    where s.learner_id = (select learner from me)
      and s.paket_group_id = p_group_id
      and s.finished_at is not null
    group by s.paket_index
  ),
  kunci as (
    select l.paket_index
    from practice_paket_locks l
    where l.learner_id = (select learner from me)
      and l.group_id = p_group_id
  )
  select i.paket_index,
         count(*),
         count(*) filter (
           where j.question_bank_item_id is not null
             and coalesce(j.max_score, 0) > 0
             and coalesce(j.score, 0) >= j.max_score
         ),
         count(*) filter (
           where j.question_bank_item_id is not null
             and coalesce(j.score, 0) > 0
             and coalesce(j.score, 0) < coalesce(j.max_score, 0)
         ),
         count(*) filter (
           where j.question_bank_item_id is not null
             and (coalesce(j.score, 0) <= 0 or coalesce(j.max_score, 0) <= 0)
         ),
         count(*) filter (where j.question_bank_item_id is null),
         coalesce(sum(j.score), 0),
         coalesce(sum(j.max_score), 0),
         coalesce(max(p.n), 0),
         bool_or(k.paket_index is not null)
  from isi i
  left join jawaban j on j.question_bank_item_id = i.item_id
  left join putaran p on p.paket_index = i.paket_index
  left join kunci k on k.paket_index = i.paket_index
  group by i.paket_index
  order by i.paket_index;
$$;

-- 5. Membuka satu putaran -----------------------------------------------------
--
-- Isinya soal paket itu yang BELUM penuh nilainya. Putaran pertama otomatis
-- memuat semuanya, karena belum ada satu pun yang bernilai.
--
-- Null berarti tidak bisa dibuka, dan pemanggilnya tidak perlu membedakan
-- sebabnya di layar: paketnya terkunci, sudah benar semua, atau bukan miliknya.

create or replace function practice_open_paket_session(
  p_group_id uuid,
  p_paket_index integer,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_subject uuid;
  v_items uuid[];
  v_session uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  if exists (
    select 1 from practice_paket_locks l
    where l.learner_id = v_learner
      and l.group_id = p_group_id
      and l.paket_index = p_paket_index
  ) then
    return null;
  end if;

  select g.subject_id into v_subject
  from curriculum_topic_groups g where g.id = p_group_id;

  select array_agg(i.item_id order by i.ord)
    into v_items
  from practice_paket_items(p_group_id, coalesce(p_access_code, ''), p_learner_id) i
  left join lateral (
    select a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = v_learner
      and s.finished_at is not null
      and s.paket_group_id = p_group_id
      and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) j on true
  where i.paket_index = p_paket_index
    and (
      j.score is null
      or coalesce(j.max_score, 0) <= 0
      or coalesce(j.score, 0) < j.max_score
    );

  if v_items is null or cardinality(v_items) = 0 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids, paket_group_id, paket_index)
  values
    (v_learner, v_subject, array[p_group_id], cardinality(v_items), v_items,
     p_group_id, p_paket_index)
  returning id into v_session;

  return v_session;
end;
$$;

-- 6. Mengunci paket -----------------------------------------------------------
--
-- Dipanggil saat kuncinya dibuka. `on conflict do nothing` supaya membuka kunci
-- dua kali tidak memundurkan `locked_at` — waktu pertama itulah yang benar.

create or replace function practice_lock_paket(
  p_group_id uuid,
  p_paket_index integer,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return false; end if;

  insert into practice_paket_locks (learner_id, group_id, paket_index)
  values (v_learner, p_group_id, p_paket_index)
  on conflict (learner_id, group_id, paket_index) do nothing;

  return true;
end;
$$;

-- 7. Kemajuan topik, dihitung ulang di atas paket -----------------------------
--
-- `paket_avg` dari 133 dibuang bersama tebakan yang melahirkannya. Gantinya dua
-- cacah yang punya arti langsung sekarang bahwa paketnya tetap: berapa paket di
-- topik ini, dan berapa yang sudah SELESAI — yaitu benar semua atau terkunci.
-- Itulah yang jadi keyakinan: "3 dari 4 paket tuntas" mengatakan seberapa
-- banyak topik ini sudah benar-benar dihadapi, dan ia punya penyebut.
--
-- Nilainya sendiri kembali ke bentuk migrasi 129 — nilai tiap soal dibagi bobot
-- seluruh soal topik — dengan satu tambahan: hanya jawaban dari putaran yang
-- SELESAI yang dihitung.

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
  paket_tuntas bigint
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
  -- Hanya dari putaran yang selesai, sejalan dengan `practice_paket_state`.
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
  -- Paket per topik, dan mana yang sudah selesai. Sebuah paket selesai kalau
  -- seluruh soalnya sudah benar ATAU kuncinya sudah dibuka — dua-duanya berarti
  -- tidak ada lagi yang bisa dikerjakan di sana.
  paket as (
    select p.group_id,
           ((row_number() over (partition by p.group_id order by b.created_at, b.id) - 1) / 10 + 1)
             as paket_index,
           p.item_id
    from pool p
    join question_bank_items b on b.id = p.item_id
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
         coalesce(max(pr.tuntas), 0)
  from pool p
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join pertama f on f.question_bank_item_id = p.item_id
  left join paket_ringkas pr on pr.group_id = p.group_id
  group by p.group_id;
$$;

-- 8. Yang digantikan ----------------------------------------------------------
--
-- Sesi perbaikan (132) tidak lagi jadi bentuk tersendiri: putaran berikutnya
-- sebuah paket SUDAH hanya memuat soal yang salah, jadi "perbaiki" dan
-- "kerjakan lagi" adalah satu tombol yang sama.

drop function if exists practice_open_retry_session(uuid, text);

notify pgrst, 'reload schema';
