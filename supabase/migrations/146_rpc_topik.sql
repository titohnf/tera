-- ============================================================
-- Fungsi penyaji jalur peta kompetensi
--
-- Kembaran keluarga `practice_paket_*` (migrasi 134) yang berkunci topik, bukan
-- grup kurikulum. FUNGSI BARU, bukan menambah argumen ke yang lama: `p_group_id
-- uuid` dan `p_topik_id text` pada nama fungsi yang sama membuat PostgREST
-- memilih overload berdasarkan argumen mana yang kebetulan disebut pemanggil,
-- dan "kebetulan" bukan cara memilih fungsi yang menentukan nilai anak orang.
--
-- ⚠️ GERBANG BERBAYAR. Setiap fungsi di sini memanggil `practice_actor()` untuk
-- memastikan pemanggilnya berhak bertindak atas nama pelajar itu, DAN
-- `practice_only_public()` untuk menyaring butir non-publik bagi akun mandiri
-- yang tidak berlangganan. Yang kedua mudah terlewat karena ketiadaannya tidak
-- pernah memunculkan galat — yang terjadi cuma bank soal berbayar terbuka ke
-- akun gratis, diam-diam. Jalur grup menurunkannya dari `question_bank_items`
-- lewat join; jalur ini harus menyebutnya sendiri.
--
-- SYARAT PENGHAPUSAN keluarga `practice_paket_*`, supaya duplikasi ini jadi
-- utang yang punya syarat lunas alih-alih utang abadi: keduanya dihapus ketika
-- tidak ada lagi `question_curriculum_tags` untuk mapel Matematika DAN tidak
-- ada `practice_sessions.paket_group_id` dari 90 hari terakhir. Sampai itu
-- terjadi, keluarga lama tetap melayani IPA, IPS, dan Bahasa — yang memang
-- tidak punya peta kompetensi, dan tidak apa-apa.
-- ============================================================

-- 1. Isi sebuah paket ---------------------------------------------------------
--
-- Keanggotaan dibaca dari `paket_topik_item`, bukan dihitung `row_number()`.
-- Yang tetap dihitung di sini penyaringnya: butir yang belum `aktif` atau sudah
-- `ditarik` tidak keluar, dan butir non-publik tidak keluar untuk akun yang
-- hanya berhak atas soal publik.
create or replace function topik_paket_items(
  p_paket_id uuid,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (item_id uuid, ord integer)
language sql
stable
security definer
set search_path = public
as $$
  select i.question_bank_item_id, i.ord
  from paket_topik_item i
  join question_bank_items b on b.id = i.question_bank_item_id
  where i.paket_id = p_paket_id
    and practice_actor(coalesce(p_access_code, ''), p_learner_id) is not null
    and b.status_verifikasi = 'aktif'
    and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  order by i.ord;
$$;

-- 2. Keadaan tiap paket sebuah topik ------------------------------------------
--
-- Satu baris per paket: berapa butirnya, berapa yang sudah benar SEKARANG,
-- sudah berapa putaran, dan apakah kuncinya sudah dibuka. Bentuknya menyalin
-- `practice_paket_state` (134) supaya layar yang sama bisa merender keduanya.
create or replace function topik_paket_state(
  p_topik_id text,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  jumlah bigint,
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
  paket as (
    select p.id, p.jenis, p.level_bloom, p.nomor
    from paket_topik p
    where p.topik_id = p_topik_id
      and (select learner from me) is not null
  ),
  -- Jawaban terakhir tiap butir, HANYA dari putaran yang selesai. Putaran yang
  -- ditinggalkan di tengah tidak bernilai — tidak menaikkan, tidak menurunkan.
  jawaban as (
    select distinct on (a.question_bank_item_id, s.paket_topik_id)
           s.paket_topik_id, a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
      and s.paket_topik_id is not null
    order by a.question_bank_item_id, s.paket_topik_id, a.answered_at desc
  ),
  putaran as (
    select s.paket_topik_id, count(*) as n
    from practice_sessions s
    where s.learner_id = (select learner from me)
      and s.paket_topik_id is not null
      and s.finished_at is not null
    group by s.paket_topik_id
  )
  select k.id,
         k.jenis,
         k.level_bloom,
         k.nomor,
         count(i.item_id),
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
         bool_or(l.paket_id is not null)
  from paket k
  cross join lateral topik_paket_items(k.id, coalesce(p_access_code, ''), p_learner_id) i
  left join jawaban j
    on j.question_bank_item_id = i.item_id and j.paket_topik_id = k.id
  left join putaran p on p.paket_topik_id = k.id
  left join paket_topik_kunci l
    on l.paket_id = k.id and l.learner_id = (select learner from me)
  group by k.id, k.jenis, k.level_bloom, k.nomor
  order by k.jenis desc, k.nomor;
$$;

-- 3. Membuka satu putaran -----------------------------------------------------
--
-- Isinya butir paket itu yang BELUM penuh nilainya. Putaran pertama otomatis
-- memuat semuanya, karena belum ada satu pun yang bernilai.
--
-- Null berarti tidak bisa dibuka, dan pemanggilnya tidak perlu membedakan
-- sebabnya di layar: paketnya terkunci, sudah benar semua, atau bukan miliknya.
--
-- Paket UJIAN hanya boleh dibuka sekali: dokumen fondasi Bagian 3.7 menuntut
-- satu titik data bersih tanpa pengulangan, dan pengulangan diam-diam merusak
-- justru satu-satunya angka yang dipakai mengklaim kemampuan mandiri.
create or replace function topik_open_paket_session(
  p_paket_id uuid,
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
  v_jenis text;
  v_subject uuid;
  v_items uuid[];
  v_session uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  select p.jenis into v_jenis from paket_topik p where p.id = p_paket_id;
  if v_jenis is null then return null; end if;

  if exists (
    select 1 from paket_topik_kunci l
    where l.learner_id = v_learner and l.paket_id = p_paket_id
  ) then
    return null;
  end if;

  if v_jenis = 'ujian' and exists (
    select 1 from practice_sessions s
    where s.learner_id = v_learner and s.paket_topik_id = p_paket_id
  ) then
    return null;
  end if;

  select id into v_subject from subjects where name = 'Matematika' limit 1;

  select array_agg(i.item_id order by i.ord)
    into v_items
  from topik_paket_items(p_paket_id, coalesce(p_access_code, ''), p_learner_id) i
  left join lateral (
    select a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = v_learner
      and s.finished_at is not null
      and s.paket_topik_id = p_paket_id
      and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) j on true
  where j.score is null
     or coalesce(j.max_score, 0) <= 0
     or coalesce(j.score, 0) < j.max_score;

  if v_items is null or cardinality(v_items) = 0 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids, paket_topik_id)
  values
    -- `group_ids` sengaja kosong: sesi jalur peta tidak berpangkal pada grup
    -- kurikulum manapun, dan mengisinya dengan grup hasil terjemahan hanya
    -- akan membuat sesi ini ikut terhitung di kemajuan topik kurikulum.
    (v_learner, v_subject, '{}'::uuid[], cardinality(v_items), v_items, p_paket_id)
  returning id into v_session;

  return v_session;
end;
$$;

-- 4. Mengunci paket -----------------------------------------------------------

create or replace function topik_lock_paket(
  p_paket_id uuid,
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

  -- `on conflict do nothing` supaya membuka kunci dua kali tidak memundurkan
  -- `locked_at` — waktu pertama itulah yang benar.
  insert into paket_topik_kunci (learner_id, paket_id)
  values (v_learner, p_paket_id)
  on conflict (learner_id, paket_id) do nothing;

  return true;
end;
$$;

-- 5. Topik yang tersedia untuk murid ------------------------------------------
--
-- Yang muncul di hadapan murid hanya topik yang `aktif` DAN punya minimal satu
-- paket berisi. Syarat kedua yang mencegah peta menyala sebagai satu kotak
-- berisi dan delapan belas kotak abu-abu — keadaan yang membuat murid merasa
-- aplikasinya rusak, padahal isinya memang belum ditulis.
--
-- `prasyarat_terpenuhi` MEMBERI TAHU, bukan memblokir. Di Tahap 0 tidak ada
-- placement test, jadi murid kelas 8 yang belum pernah menyentuh D-02 tidak
-- boleh terkunci dari D-08 hanya karena sistem belum sempat mengukurnya.
-- Layar memakainya untuk menyusun urutan dan memberi keterangan, bukan
-- mematikan tombol.
create or replace function topik_tersedia(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  topik_id text,
  nama text,
  elemen text,
  jenjang_kelas text,
  penanda_remediasi text,
  urutan int,
  jumlah_paket bigint,
  prasyarat_terpenuhi boolean,
  prasyarat_kurang text[]
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
    select coalesce((select nilai::text::numeric from pengaturan where kunci = 'ambang_mastery'), 0.75) as nilai
  ),
  -- Penguasaan tiap topik dari jawaban terakhir tiap butir di seluruh paket
  -- topik itu. Butir yang belum pernah dijawab terhitung belum dikuasai —
  -- penyebutnya seluruh butir paket, bukan yang kebetulan sudah disentuh.
  nilai_topik as (
    select p.topik_id,
           sum(coalesce(j.score, 0)) as skor,
           sum(coalesce(j.max_score, b.weight)) as maks
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    join question_bank_items b on b.id = i.question_bank_item_id
    left join lateral (
      select a.score, a.max_score
      from practice_answers a
      join practice_sessions s on s.id = a.session_id
      where a.learner_id = (select learner from me)
        and s.finished_at is not null
        and a.question_bank_item_id = i.question_bank_item_id
      order by a.answered_at desc
      limit 1
    ) j on true
    where p.jenis = 'latihan'
    group by p.topik_id
  ),
  tuntas as (
    select n.topik_id
    from nilai_topik n, ambang
    where n.maks > 0 and n.skor / n.maks >= ambang.nilai
  ),
  berisi as (
    select p.topik_id, count(distinct p.id) as jumlah
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    group by p.topik_id
  )
  select t.id,
         t.nama,
         t.elemen,
         t.jenjang_kelas,
         t.penanda_remediasi,
         t.urutan,
         coalesce(k.jumlah, 0),
         not exists (
           select 1 from topik_prasyarat pr
           where pr.topik_id = t.id and pr.prasyarat_id not in (select topik_id from tuntas)
         ),
         coalesce(
           array(
             select pr.prasyarat_id from topik_prasyarat pr
             where pr.topik_id = t.id and pr.prasyarat_id not in (select topik_id from tuntas)
             order by pr.prasyarat_id
           ),
           '{}'::text[]
         )
  from topik t
  join berisi k on k.topik_id = t.id
  where t.aktif
    and (select learner from me) is not null
  order by t.urutan;
$$;

notify pgrst, 'reload schema';
