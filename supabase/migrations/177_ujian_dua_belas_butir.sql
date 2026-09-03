-- ============================================================
-- Paket ujian: 12 butir, diacak untuk tiap murid
--
-- Sesudah 176, kolam ujian membentang C1–C6 — dan paket ujiannya ikut membesar
-- jadi 22–26 butir, D-01 bahkan 36. Sebabnya `semai_paket_topik` MENURUNKAN
-- susunan paket dari bank: seluruh butir ujian sebuah topik jadi satu paket.
-- Protokol Uji Coba Bagian 3 menyebut 12 butir untuk 25–30 menit, dan angka 30
-- itu pula yang sudah dipakai `durasi_ujian_menit` sejak migrasi 154. Ujian 36
-- butir dengan timer 30 menit bukan ujian yang sama.
--
-- KEPUTUSANNYA: kolam tetap utuh, yang dipilih adalah SAJIANNYA. Dua belas
-- butir diambil dari kolam itu untuk tiap murid, sekali, saat ujiannya dibuka.
--
-- KENAPA PER MURID, bukan satu sampel tetap per topik. Paket ujian hanya boleh
-- dikerjakan sekali dan tidak punya putaran kedua — ia satu-satunya pengukuran
-- di jalur ini yang tidak memberi kesempatan memperbaiki. Sampel tetap berarti
-- dua belas butir yang sama untuk seluruh angkatan, dan begitu satu anak
-- selesai lebih dulu, dua belas butir itu berhenti mengukur apa pun. Sampel per
-- murid membuat bocornya satu lembar soal tidak membocorkan ujiannya.
--
-- BERJENJANG, BUKAN ACAK RATA. Dokumen fondasi Bagian 3.7 meminta paket ujian
-- MENCAMPUR level tanpa memberi tahu muridnya. Dua belas butir yang diambil
-- acak rata dari kolam yang isinya 76 butir C4–C6 dan 216 butir C1–C3 bisa
-- jatuh seluruhnya di level rendah — dan pilot akan mengulang persis kesalahan
-- yang baru saja diperbaiki 176, kali ini secara kebetulan, per murid.
--
-- Maka jatahnya dibagi per level lebih dulu: `ceil(12 / banyak level yang ada
-- di kolam)`. Untuk topik yang kolamnya lengkap C1–C6 itu berarti 2 butir per
-- level; untuk empat topik yang kolamnya masih C1–C3 (D-02, D-03, D-04, D-08 —
-- lihat 176) berarti 4 per level. Kekurangannya baru ditambal acak dari sisa
-- kolam, dan urutan akhirnya diacak lagi supaya levelnya tidak terbaca dari
-- nomor soal.
--
-- YANG DIPILIH DISIMPAN, TIDAK DIHITUNG ULANG. Sampelnya hidup di
-- `practice_sessions.item_ids` — tempat yang memang sudah menyimpan isi sebuah
-- sesi sejak awal, dan satu-satunya sesi ujian yang boleh ada bagi seorang
-- murid pada satu paket. Tidak ada tabel sampel tersendiri: dua tempat yang
-- menyimpan jawaban atas pertanyaan yang sama ("dua belas butir mana yang
-- didapat anak ini") adalah dua tempat yang bisa berbeda.
--
-- AKIBAT YANG MERAMBAT, dan inilah bagian yang paling mudah terlewat: begitu
-- isi ujian berbeda antar-murid, PENYEBUTNYA tidak boleh lagi seluruh kolam.
-- Tanpa perbaikan di bawah, layar keluarga akan menampilkan "12 dari 36" untuk
-- ujian yang sudah dikerjakan seluruhnya, dan `butir_paket` di layar tutor akan
-- ikut berbohong. Tiga fungsi diubah karenanya — `topik_paket_state` (175),
-- `skor_paket_topik` (175), dan `topik_isi_paket` (161) — semuanya lewat satu
-- definisi baru: `paket_butir_murid()`.
--
-- SATU PERUBAHAN TAMPILAN YANG DISENGAJA: ujian yang BELUM dibuka tidak
-- menampilkan petak soal sama sekali, sedangkan jumlahnya tetap tertulis 12.
-- Sebelumnya ia menampilkan 24 petak abu-abu. Itu memang lebih jujur: sebelum
-- ujiannya dibuka, belum ada dua belas butir yang menjadi miliknya — kartunya
-- menyebut berapa yang akan datang, bukan yang mana.
--
-- Jalankan SESUDAH 176.
-- ============================================================

-- 1. Berapa butir yang disajikan sebuah paket ---------------------------------
--
-- NULL berarti "sajikan seluruh isinya" — itu paket latihan, dan perilakunya
-- tidak berubah sedikit pun. Angka berarti "ambil sebanyak ini dari isinya".
alter table paket_topik
  add column if not exists jumlah_butir_sampel smallint
    check (jumlah_butir_sampel is null or jumlah_butir_sampel > 0);

comment on column paket_topik.jumlah_butir_sampel is
  'Banyak butir yang disajikan kepada seorang murid, diambil acak berjenjang dari isi paket (Protokol Uji Coba Bagian 3: 12 butir per ujian). NULL = seluruh isi paket disajikan, seperti paket latihan.';

update paket_topik set jumlah_butir_sampel = 12
where jenis = 'ujian' and jumlah_butir_sampel is null;

-- 2. Butir yang berlaku bagi seorang murid ------------------------------------
--
-- Definisi TUNGGAL dari "isi paket ini bagi anak ini", dipakai penyaji maupun
-- penghitung. Untuk paket biasa ia isi paketnya; untuk paket bersampel ia dua
-- belas butir yang benar-benar didapat anak itu — dan KOSONG kalau ujiannya
-- belum dibuka, karena memang belum ada yang menjadi miliknya.
--
-- Tanpa gerbangnya sendiri: ia dipanggil hanya dari fungsi yang sudah bertanya
-- siapa pemanggilnya. Haknya dicabut dari publik di bagian bawah.
create or replace function paket_butir_murid(
  p_learner_id uuid,
  p_paket_id uuid,
  p_access_code text default ''
)
returns table (item_id uuid, ord integer)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with paket as (
    select p.id, p.jumlah_butir_sampel
    from paket_topik p where p.id = p_paket_id
  ),
  sesi as (
    -- Sesi PERTAMA, bukan yang terakhir: paket ujian hanya boleh punya satu,
    -- dan kalau suatu hari ada dua, yang berlaku adalah yang menetapkan
    -- sampelnya lebih dulu.
    select s.item_ids
    from practice_sessions s
    where s.learner_id = p_learner_id and s.paket_topik_id = p_paket_id
    order by s.started_at, s.id
    limit 1
  )
  -- Paket bersampel yang sudah dibuka: dua belas butir milik anak itu.
  --
  -- Penyaring `status_verifikasi` sengaja TIDAK dipakai di cabang ini. Butir
  -- yang ditarik sesudah ujiannya dikerjakan tetap harus tampil — ia benar-
  -- benar ditanyakan kepada anak itu, dan menghilangkannya dari layar akan
  -- membuat jawabannya menggantung tanpa soal. Penyaringan terjadi saat
  -- sampelnya diambil, bukan setiap kali layarnya dibuka.
  select u.item_id, u.ord::integer
  from sesi
  cross join lateral unnest(sesi.item_ids) with ordinality as u(item_id, ord)
  where (select jumlah_butir_sampel from paket) is not null

  union all

  -- Paket biasa: seluruh isinya, dengan penyaring yang sama seperti
  -- `topik_paket_items` — butir yang ditarik tidak keluar, dan butir non-publik
  -- tidak keluar untuk akun yang hanya berhak atas soal publik.
  select i.question_bank_item_id, i.ord
  from paket_topik_item i
  join question_bank_items b on b.id = i.question_bank_item_id
  where i.paket_id = p_paket_id
    and (select jumlah_butir_sampel from paket) is null
    and b.status_verifikasi = 'aktif'
    and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id));
$$;

comment on function paket_butir_murid(uuid, uuid, text) is
  'Butir sebuah paket yang berlaku bagi seorang murid: isi paketnya, atau sampel dua belas butir yang sudah ditetapkan sesi ujiannya. Kosong untuk paket bersampel yang belum dibuka.';

-- 3. Membuka putaran, kini dengan sampel --------------------------------------
--
-- Menggantikan versi migrasi 146. Yang bertambah satu cabang: paket bersampel
-- mengambil dua belas butir berjenjang, paket biasa tetap memuat butir yang
-- nilainya belum penuh seperti sebelumnya.
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
  v_sampel smallint;
  v_level_ada integer;
  v_jatah integer;
  v_kurang integer;
  v_inti uuid[];
  v_tambahan uuid[];
  v_subject uuid;
  v_items uuid[];
  v_session uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return null; end if;

  select p.jenis, p.jumlah_butir_sampel into v_jenis, v_sampel
  from paket_topik p where p.id = p_paket_id;
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

  if v_sampel is null then
    -- Paket biasa: seluruh isinya yang nilainya belum penuh. Persis 146.
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
  else
    -- Paket bersampel. Penyaring "nilainya belum penuh" sengaja TIDAK dipakai:
    -- paket bersampel hari ini hanya paket ujian, dan ujian yang sudah punya
    -- sesi sudah ditolak beberapa baris di atas — jadi tidak ada nilai
    -- sebelumnya yang bisa menyaring apa pun, dan memakainya hanya akan
    -- membuat sampel bergantung pada keadaan yang tidak pernah ada.
    select count(distinct b.bloom_level)
      into v_level_ada
    from topik_paket_items(p_paket_id, coalesce(p_access_code, ''), p_learner_id) i
    join question_bank_items b on b.id = i.item_id
    where b.bloom_level is not null;

    -- Jatah per level, dibulatkan ke atas: dengan 12 butir dan 6 level jadi 2,
    -- dengan 3 level jadi 4. Kolam tanpa level sama sekali jatuh ke jatah 12,
    -- yang membuat cabang berjenjangnya kosong dan seluruhnya ditambal acak.
    v_jatah := case
      when coalesce(v_level_ada, 0) = 0 then v_sampel
      else ceil(v_sampel::numeric / v_level_ada)::integer
    end;

    -- Ditulis dalam tiga langkah dengan variabel, bukan satu rangkaian CTE:
    -- jumlah yang kurang harus dihitung SESUDAH inti terbentuk, dan sebuah
    -- `limit` yang menoleh ke CTE lain adalah tempat paling mudah untuk salah
    -- membaca maksudnya setahun dari sekarang.
    --
    -- `order by urut` sebelum dipotong: jatah yang dibulatkan ke atas bisa
    -- melebihi 12 (lima level × 3 = 15), dan memotong tanpa urutan berarti
    -- sebuah level bisa hilang seluruhnya karena kebetulan. Dengan urutan ini,
    -- setiap level mendapat butir pertamanya sebelum level mana pun mendapat
    -- yang kedua.
    select array_agg(pilih.item_id)
      into v_inti
    from (
      select berjenjang.item_id
      from (
        select i.item_id,
               row_number() over (
                 partition by b.bloom_level order by random()
               ) as urut
        from topik_paket_items(p_paket_id, coalesce(p_access_code, ''), p_learner_id) i
        join question_bank_items b on b.id = i.item_id
        where b.bloom_level is not null
      ) berjenjang
      where berjenjang.urut <= v_jatah
      order by berjenjang.urut, random()
      limit v_sampel
    ) pilih;

    v_kurang := v_sampel - coalesce(cardinality(v_inti), 0);

    -- Penambal: butir mana pun yang belum terpilih, termasuk butir tanpa level
    -- Bloom — kolam yang butirnya tidak berlevel tetap harus bisa melahirkan
    -- ujian, dan lebih baik dua belas butir tak berjenjang daripada ujian yang
    -- gagal dibuka.
    if v_kurang > 0 then
      select array_agg(sisa.item_id)
        into v_tambahan
      from (
        select i.item_id
        from topik_paket_items(p_paket_id, coalesce(p_access_code, ''), p_learner_id) i
        where not (i.item_id = any (coalesce(v_inti, '{}'::uuid[])))
        order by random()
        limit v_kurang
      ) sisa;
    end if;

    -- Urutan akhirnya diacak lagi: kalau butir C1 selalu di depan, murid bisa
    -- membaca level soalnya dari nomornya — persis yang dilarang Bagian 3.7.
    select array_agg(gabungan.id order by random())
      into v_items
    from unnest(
      coalesce(v_inti, '{}'::uuid[]) || coalesce(v_tambahan, '{}'::uuid[])
    ) as gabungan(id);

  end if;

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

comment on function topik_open_paket_session(uuid, text, uuid) is
  'Membuka satu putaran paket peta. Paket latihan memuat butir yang nilainya belum penuh; paket ujian mengambil sampel acak berjenjang sebanyak `jumlah_butir_sampel` dan menyimpannya di sesi itu.';

-- 4. Keadaan paket di layar keluarga, dengan penyebut yang benar ---------------
--
-- Menggantikan versi migrasi 175. Dua perubahan, keduanya karena sampel:
--
--   a. Isinya dibaca dari `paket_butir_murid`, bukan `topik_paket_items` —
--      ujian yang sudah dibuka dinilai atas dua belas butir miliknya, bukan
--      atas seluruh kolam.
--   b. `left join lateral`, bukan `cross join`: ujian yang belum dibuka tidak
--      punya satu butir pun, dan `cross join` akan membuat barisnya hilang dari
--      peta — paket yang lenyap dari layar, bukan paket yang belum dikerjakan.
--      Jumlahnya lalu diambil dari `jumlah_butir_sampel`: kartunya menyebut
--      berapa butir yang akan datang, meski belum tahu yang mana.
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
    select p.id, p.jenis, p.level_bloom, p.nomor, p.jumlah_butir_sampel
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
         -- Ujian yang belum dibuka: yang disebut jumlahnya adalah ukuran
         -- sampelnya, bukan nol dan bukan seluruh kolam.
         case
           when count(i.item_id) = 0 and k.jumlah_butir_sampel is not null
           then k.jumlah_butir_sampel::bigint
           else count(i.item_id)
         end,
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
         case
           when count(i.item_id) = 0 and k.jumlah_butir_sampel is not null
           then k.jumlah_butir_sampel::bigint
           else count(*) filter (where i.item_id is not null and j.question_bank_item_id is null)
         end,
         -- Lantai nol, seperti dipasang 175: satu butir Benar-Salah di skema
         -- 'pengukuran' boleh bernilai negatif, jumlah sebuah paket tidak.
         greatest(0, coalesce(sum(j.score), 0)),
         coalesce(sum(j.max_score), 0),
         coalesce(max(p.n), 0),
         bool_or(l.paket_id is not null)
  from paket k
  left join lateral paket_butir_murid(
    (select learner from me), k.id, coalesce(p_access_code, '')
  ) i on true
  left join jawaban j
    on j.question_bank_item_id = i.item_id and j.paket_topik_id = k.id
  left join putaran p on p.paket_topik_id = k.id
  left join paket_topik_kunci l
    on l.paket_id = k.id and l.learner_id = (select learner from me)
  group by k.id, k.jenis, k.level_bloom, k.nomor, k.jumlah_butir_sampel
  order by k.jenis desc, k.nomor;
$$;

comment on function topik_paket_state(text, text, uuid) is
  'Keadaan tiap paket sebuah topik untuk satu murid: banyak butir yang berlaku baginya, hasil per butir, skor berlantai nol, putaran, dan kuncinya.';

-- 5. Skor paket, dengan penyebut yang sama -------------------------------------
--
-- Menggantikan versi migrasi 175. Satu perubahan: `butir_paket` dihitung dari
-- butir yang berlaku bagi murid ini, bukan dari seluruh isi paket. Angka itu
-- dipakai layar tutor untuk menjawab "berapa butir paket ini" — dan sejak
-- ujiannya bersampel, jawaban yang benar berbeda untuk tiap anak.
create or replace function skor_paket_topik(
  p_learner_id uuid,
  p_paket_id uuid
)
returns table (
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with sesi as (
    select s.id,
           s.finished_at,
           row_number() over (order by s.started_at, s.id) as putaran
    from practice_sessions s
    where s.learner_id = p_learner_id
      and s.paket_topik_id = p_paket_id
  ),
  -- `distinct on` per butir, bukan `sum` atas semua baris: 114 menyisipkan
  -- jawaban tanpa kunci unik, jadi satu soal bisa punya dua baris karena
  -- ketukan ganda. Menjumlahkan semuanya membuat penyebutnya melar dan skornya
  -- turun tanpa sebab.
  jawaban_putaran_1 as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    where sesi.putaran = 1
    order by a.question_bank_item_id, a.answered_at desc
  ),
  jawaban_akhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    order by a.question_bank_item_id, a.answered_at desc
  )
  select
    coalesce((select max(sesi.putaran) from sesi), 0)::integer,
    coalesce((select bool_or(sesi.finished_at is not null) from sesi where sesi.putaran = 1), false),
    coalesce(
      nullif((select count(*) from paket_butir_murid(p_learner_id, p_paket_id)), 0),
      (select p.jumlah_butir_sampel from paket_topik p where p.id = p_paket_id),
      0
    )::integer,
    (select count(*) from jawaban_putaran_1)::integer,
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_putaran_1),
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_akhir);
$$;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1 dan skor akhir sebuah paket peta untuk satu murid (FR5), berlantai nol, dengan `butir_paket` mengikuti butir yang berlaku bagi murid itu. TANPA gerbang — pemanggil dari aplikasi memakai topik_skor_paket().';

-- 6. Petak soal di layar keluarga ---------------------------------------------
--
-- Menggantikan versi migrasi 161. Ujian menampilkan dua belas petak miliknya,
-- bukan seluruh kolam — dan tidak menampilkan apa pun sebelum dibuka.
create or replace function topik_isi_paket(
  p_topik_id text,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  item_id uuid,
  ord integer
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select practice_actor(coalesce(p_access_code, ''), p_learner_id) as learner
  )
  select p.id, p.jenis, p.level_bloom, p.nomor, i.item_id, i.ord
  from paket_topik p
  cross join lateral paket_butir_murid(
    (select learner from me), p.id, coalesce(p_access_code, '')
  ) i
  where p.topik_id = p_topik_id
    and (select learner from me) is not null
  order by p.jenis desc, p.nomor, i.ord;
$$;

-- 7. Paket ujian yang lahir kemudian ikut membawa ukurannya --------------------
--
-- Menggantikan versi migrasi 145. Satu baris yang bertambah: paket ujian baru
-- lahir dengan `jumlah_butir_sampel = 12`. Tanpa itu, topik yang dibuka setahun
-- dari sekarang akan diam-diam kembali menyajikan seluruh kolamnya — cacat yang
-- sama persis, ditemukan lagi dari awal.
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

  -- Paket ujian: satu, mencampur level (dokumen fondasi Bagian 3.7), dan
  -- menyajikan dua belas di antaranya kepada tiap murid (Protokol Bagian 3).
  if exists (
    select 1 from question_bank_items b
    where b.topik_id = p_topik_id and b.peruntukan = 'ujian'
  ) then
    select p.id into v_paket
    from paket_topik p
    where p.topik_id = p_topik_id and p.jenis = 'ujian' and p.nomor = 1;

    if v_paket is null then
      insert into paket_topik (topik_id, jenis, level_bloom, nomor, jumlah_butir_sampel)
      values (p_topik_id, 'ujian', null, 1, 12)
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

-- 8. Hak -----------------------------------------------------------------------
revoke all on function paket_butir_murid(uuid, uuid, text) from public, anon, authenticated;
revoke all on function skor_paket_topik(uuid, uuid) from public, anon, authenticated;
grant execute on function topik_paket_state(text, text, uuid) to anon, authenticated;
grant execute on function topik_isi_paket(text, text, uuid) to anon, authenticated;
grant execute on function topik_open_paket_session(uuid, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
