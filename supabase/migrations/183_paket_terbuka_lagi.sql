-- ============================================================
-- Paket yang terkunci membuka sendiri sesudah jeda, dan ketuntasan boleh
-- diraih ulang
--
-- KEADAAN YANG MEMBUAT MIGRASI INI ADA. Seorang murid mengerjakan D-02: C1 dan
-- C2 dibebaskan tes penempatan, C3 lolos dengan skor penuh, C4 berhenti di 0,25
-- lalu kuncinya dibuka. Peta menampilkan "Perlu diulang", dan itu benar menurut
-- aturannya — tapi tidak ada satu pun jalan untuk mengulanginya. Baris di
-- `paket_topik_kunci` tidak pernah dihapus oleh apa pun kecuali migrasi 179
-- yang mengosongkan hasil uji coba, dan `topik_open_paket_session` menolak
-- membuka paket yang punya baris itu. Layar menyuruh mengulang sesuatu yang
-- terkunci selamanya.
--
-- Lebih dalam dari kuncinya: ketuntasan dinilai dari SKOR PUTARAN 1, dan
-- putaran 1 dihitung dari seluruh sesi paket itu sejak awal waktu. Angka 0,25
-- itu sejarah yang tidak ditulis ulang oleh apa pun, jadi seandainya kuncinya
-- dibuka pun, D-02 tetap tidak akan pernah bisa `tuntas`. `butuh_pengulangan`
-- yang di dokumen adalah keadaan yang bisa dilalui, di kode adalah keadaan
-- akhir.
--
-- DUA PERUBAHAN, DAN KEDUANYA DIPERLUKAN. Membuka kuncinya saja tidak cukup —
-- anak akan mengerjakan ulang tanpa angkanya bisa berubah. Mengulang penilaian
-- saja juga tidak cukup — paketnya tidak bisa dibuka. Jadi:
--
--   1. Kunci paket LATIHAN kedaluwarsa sendiri sesudah jeda. Tidak ada tombol,
--      tidak ada tutor yang harus ingat, tidak ada job terjadwal: kuncinya
--      dibandingkan dengan `now()` saat ditanya.
--   2. Penilaian dipotong per SIKLUS. Kunci yang kedaluwarsa menutup satu
--      siklus dan membuka siklus berikutnya, dan Putaran 1 dihitung ulang dari
--      dalam siklus yang sedang berjalan.
--
-- UJIAN TIDAK IKUT, dan itu disengaja. "Satu putaran, tanpa retry" adalah
-- definisi kolam ujian di Protokol Uji Coba Bagian 4; ujian yang membuka
-- sendiri sesudah sehari bukan ujian. Kuncinya tetap permanen di sana.
--
-- YANG BELUM DIJAWAB MIGRASI INI, disebut supaya tidak dikira sudah beres:
-- siklus baru menyajikan BUTIR YANG SAMA. Paket latihan hari ini menyajikan
-- seluruh isinya (`jumlah_butir_sampel` null), jadi tidak ada butir cadangan
-- yang bisa diambil — anak akan bertemu soal yang kuncinya sudah pernah ia
-- lihat, dan itu bukti yang lebih lemah daripada yang seharusnya. Menyiapkan
-- cadangan berarti paket latihan ikut bersampel seperti paket ujian, dan itu
-- keputusan tentang ukuran paket dan kuota bentuk soal — pekerjaan tersendiri,
-- yang juga menuntut tim konten menulis lebih banyak butir per topik.
-- ============================================================

-- 1. Berapa lama jedanya -------------------------------------------------------
--
-- Di `pengaturan`, bukan ditanam di kode, dengan alasan yang sama seperti
-- `ambang_mastery` dan interval retest: angkanya keputusan pedagogis yang akan
-- dikalibrasi sesudah pilot nyata, dan mengubahnya tidak boleh menuntut
-- migrasi.
--
-- 24 jam sebagai titik awal. Cukup panjang supaya kunci jawaban tidak lagi
-- segar di ingatan — itu seluruh gunanya menunggu — dan cukup pendek supaya
-- anak yang datang tiap hari tidak kehilangan topiknya. Sengaja sekeluarga
-- dengan `sla_eskalasi_jam_kerja`, yang juga 24.
insert into pengaturan (kunci, nilai, keterangan)
values (
  'jeda_buka_paket_jam',
  '24'::jsonb,
  'Berapa jam sebuah paket latihan terkunci sesudah kuncinya dibuka, sebelum ia terbuka sendiri untuk siklus berikutnya. Tidak berlaku untuk paket ujian, yang kuncinya permanen.'
)
on conflict (kunci) do nothing;

create or replace function jeda_buka_paket()
returns interval
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select ((nilai #>> '{}')::numeric || ' hours')::interval
       from pengaturan where kunci = 'jeda_buka_paket_jam'),
    interval '24 hours'
  );
$$;

comment on function jeda_buka_paket() is
  'Lama sebuah paket latihan terkunci sesudah kuncinya dibuka. Dari `pengaturan`, bawaan 24 jam.';

-- 2. Kunci boleh terjadi lebih dari sekali --------------------------------------
--
-- Kunci pertama menutup siklus 1, kunci kedua menutup siklus 2, dan seterusnya.
-- Barisnya TIDAK pernah dihapus saat kedaluwarsa: yang dicatat adalah fakta
-- bahwa kunci pernah dibuka pada suatu waktu, dan menghapusnya berarti membuang
-- satu-satunya jejak yang bisa menjawab "sudah berapa kali anak ini menyerah di
-- paket ini" — pertanyaan yang justru paling perlu dijawab sebelum jedanya
-- dikalibrasi.
alter table paket_topik_kunci
  add column if not exists siklus smallint not null default 1;

alter table paket_topik_kunci
  drop constraint if exists paket_topik_kunci_pkey;

alter table paket_topik_kunci
  add constraint paket_topik_kunci_pkey
  primary key (learner_id, paket_id, siklus);

comment on column paket_topik_kunci.siklus is
  'Siklus keberapa yang ditutup kunci ini. 1 = kunci pertama. Baris lama otomatis bernilai 1.';

-- 3. Dua pertanyaan, dijawab di satu tempat ------------------------------------
--
-- Sebelum ini, "paket ini terkunci?" ditanyakan dengan `exists (select 1 from
-- paket_topik_kunci ...)` di lima tempat berbeda. Selama jawabannya "ada
-- barisnya atau tidak", menyalinnya lima kali cuma bertele-tele. Sesudah
-- jawabannya melibatkan waktu dan jenis paket, lima salinan adalah lima tempat
-- yang bisa berbeda pendapat tentang apakah seorang anak boleh bekerja.
create or replace function paket_terkunci(p_learner_id uuid, p_paket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from paket_topik_kunci l
    join paket_topik p on p.id = l.paket_id
    where l.learner_id = p_learner_id
      and l.paket_id = p_paket_id
      and (p.jenis <> 'latihan' or l.locked_at + jeda_buka_paket() > now())
  );
$$;

comment on function paket_terkunci(uuid, uuid) is
  'Apakah paket ini sedang tertutup bagi murid ini. Latihan: kuncinya kedaluwarsa sesudah `jeda_buka_paket()`. Ujian: permanen.';

-- Batas siklus: kapan siklus yang sedang berjalan DIMULAI.
--
-- Kunci yang MASIH berlaku sengaja tidak menghitung. Selama paketnya tertutup,
-- yang berlaku adalah nilai yang sudah diperoleh — itu arti "kuncinya dibuka,
-- nilainya berhenti di situ". Siklus baru lahir saat kuncinya kedaluwarsa,
-- bukan saat kuncinya dipasang.
create or replace function batas_siklus_paket(p_learner_id uuid, p_paket_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select max(l.locked_at)
  from paket_topik_kunci l
  join paket_topik p on p.id = l.paket_id
  where l.learner_id = p_learner_id
    and l.paket_id = p_paket_id
    and p.jenis = 'latihan'
    and l.locked_at + jeda_buka_paket() <= now();
$$;

comment on function batas_siklus_paket(uuid, uuid) is
  'Kapan siklus berjalan sebuah paket dimulai: waktu kunci kedaluwarsa yang terakhir, atau NULL kalau paketnya belum pernah dikunci-lalu-terbuka.';

-- Kapan ia terbuka lagi. NULL kalau tidak sedang terkunci, dan NULL juga untuk
-- ujian — di sana tidak ada waktu yang bisa dijanjikan, dan menjanjikannya
-- kepada anak adalah kebohongan yang akan ditagih besok.
create or replace function paket_buka_pada(p_learner_id uuid, p_paket_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select max(l.locked_at) + jeda_buka_paket()
  from paket_topik_kunci l
  join paket_topik p on p.id = l.paket_id
  where l.learner_id = p_learner_id
    and l.paket_id = p_paket_id
    and p.jenis = 'latihan'
    and l.locked_at + jeda_buka_paket() > now();
$$;

comment on function paket_buka_pada(uuid, uuid) is
  'Kapan paket latihan yang sedang terkunci akan terbuka sendiri. NULL kalau tidak terkunci, atau kalau paketnya ujian.';

-- 4. Mengunci paket, kini bersiklus ---------------------------------------------
--
-- Menggantikan versi migrasi 146. `on conflict do nothing` di sana menjaga agar
-- membuka kunci dua kali tidak memundurkan `locked_at`; di sini penjaganya
-- berbeda karena barisnya memang boleh bertambah — yang tidak boleh adalah
-- kunci kedua di dalam siklus yang sama.
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

  -- Sudah tertutup: tidak ada yang perlu dicatat, dan mencatatnya lagi akan
  -- memundurkan waktu terbukanya — anak menekan "lihat kunci" dua kali menunggu
  -- dua kali lebih lama.
  if paket_terkunci(v_learner, p_paket_id) then
    return true;
  end if;

  insert into paket_topik_kunci (learner_id, paket_id, siklus)
  select v_learner, p_paket_id, coalesce(max(l.siklus), 0) + 1
  from paket_topik_kunci l
  where l.learner_id = v_learner and l.paket_id = p_paket_id
  on conflict (learner_id, paket_id, siklus) do nothing;

  return true;
end;
$$;

comment on function topik_lock_paket(uuid, text, uuid) is
  'Mencatat bahwa murid membuka kunci jawaban sebuah paket, menutup siklus yang sedang berjalan (PRD FR3).';

-- 5. Skor paket, dihitung dari siklus yang berjalan ------------------------------
--
-- Menggantikan versi migrasi 177. Yang bertambah satu klausa di CTE `sesi`.
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
      -- SIKLUS BERJALAN SAJA. Putaran 1 sebuah siklus baru harus benar-benar
      -- putaran pertama; kalau sesi siklus lama ikut terhitung, `row_number()`
      -- tidak akan pernah mengembalikan 1 lagi dan ketuntasan yang boleh
      -- diraih ulang tidak pernah bisa diraih.
      and s.started_at > coalesce(
        batas_siklus_paket(p_learner_id, p_paket_id), '-infinity'::timestamptz
      )
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
  'Skor Putaran 1 dan skor akhir sebuah paket peta untuk satu murid (FR5), dihitung dari siklus yang sedang berjalan, berlantai nol. TANPA gerbang — pemanggil dari aplikasi memakai topik_skor_paket().';

-- 6. Membuka satu putaran ------------------------------------------------------
--
-- Menggantikan versi migrasi 177. Dua perubahan: gerbang kuncinya kini
-- bertanya kepada `paket_terkunci()`, dan penyaring "nilainya belum penuh"
-- hanya melihat siklus yang berjalan.
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

  if paket_terkunci(v_learner, p_paket_id) then
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
        -- Nilai dari siklus yang sudah lewat tidak menyaring apa pun. Tanpa
        -- baris ini, paket yang baru terbuka hanya menyodorkan butir yang dulu
        -- SALAH — dan Putaran 1 siklus baru akan dinilai atas sebagian paket,
        -- angka yang tidak sebanding dengan ambang yang dipakai menguji.
        and s.started_at > coalesce(
          batas_siklus_paket(v_learner, p_paket_id), '-infinity'::timestamptz
        )
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
  'Membuka satu putaran sebuah paket peta: butir yang belum penuh nilainya di siklus berjalan, atau seluruh isinya di siklus baru. NULL = tidak bisa dibuka.';

-- 7. Keadaan paket di layar murid ----------------------------------------------
--
-- Menggantikan versi migrasi 177. `terkunci` kini menanyakan waktunya, dan
-- kolom baru `buka_pada` menyebutkan kapan ia terbuka lagi — tanpa itu, anak
-- melihat baris mati tanpa satu kata pun tentang kapan ia hidup kembali, yang
-- persis keadaan yang membuat migrasi ini ditulis.
--
-- DROP dulu, karena bentuk keluarannya berubah: `create or replace` tidak bisa
-- menambah kolom pada `returns table`.
drop function if exists topik_paket_state(text, text, uuid);

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
  terkunci boolean,
  buka_pada timestamptz
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
      and s.started_at > coalesce(
        batas_siklus_paket((select learner from me), s.paket_topik_id),
        '-infinity'::timestamptz
      )
    order by a.question_bank_item_id, s.paket_topik_id, a.answered_at desc
  ),
  putaran as (
    select s.paket_topik_id, count(*) as n
    from practice_sessions s
    where s.learner_id = (select learner from me)
      and s.paket_topik_id is not null
      and s.finished_at is not null
      and s.started_at > coalesce(
        batas_siklus_paket((select learner from me), s.paket_topik_id),
        '-infinity'::timestamptz
      )
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
         paket_terkunci((select learner from me), k.id),
         paket_buka_pada((select learner from me), k.id)
  from paket k
  left join lateral paket_butir_murid(
    (select learner from me), k.id, coalesce(p_access_code, '')
  ) i on true
  left join jawaban j
    on j.question_bank_item_id = i.item_id and j.paket_topik_id = k.id
  left join putaran p on p.paket_topik_id = k.id
  group by k.id, k.jenis, k.level_bloom, k.nomor, k.jumlah_butir_sampel
  order by k.jenis desc, k.nomor;
$$;

comment on function topik_paket_state(text, text, uuid) is
  'Keadaan tiap paket sebuah topik untuk satu murid di siklus yang berjalan: banyak butir, hasil per butir, skor berlantai nol, putaran, kuncinya, dan kapan kuncinya terbuka lagi.';

-- 8. Butir yang diserahkan, dan kemajuan yang dilihat keluarga -------------------
--
-- Keduanya menanyakan hal yang sama dengan cara lamanya: "ada barisnya di
-- `paket_topik_kunci`?" Dibiarkan begitu, paket yang sudah terbuka kembali akan
-- tetap menyebut butirnya "menyerah lihat kunci" dan tetap dihitung tuntas di
-- layar Penguasaan — dua layar yang menyatakan urusannya selesai, di atas paket
-- yang justru sedang menunggu dikerjakan lagi.
--
-- Menggantikan versi migrasi 153 dan 161. Yang berubah hanya predikat kuncinya;
-- sisanya disalin apa adanya.
create or replace function status_butir_paket(
  p_learner_id uuid,
  p_paket_id uuid
)
returns table (
  question_bank_item_id uuid,
  ord integer,
  pernah_dijawab boolean,
  skor numeric,
  skor_maks numeric,
  status text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  with terkunci as (
    select paket_terkunci(p_learner_id, p_paket_id) as ya
  ),
  -- Keadaan TERAKHIR tiap butir, lintas putaran — sama seperti skor akhir di
  -- 149. `distinct on` karena 114 menyisipkan jawaban tanpa kunci unik.
  jawaban as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
      and s.started_at > coalesce(
        batas_siklus_paket(p_learner_id, p_paket_id), '-infinity'::timestamptz
      )
    where s.paket_topik_id = p_paket_id
      and a.learner_id = p_learner_id
    order by a.question_bank_item_id, a.answered_at desc
  )
  select i.question_bank_item_id,
         i.ord,
         j.question_bank_item_id is not null,
         j.score,
         j.max_score,
         case
           when j.score is not null
            and coalesce(j.max_score, 0) > 0
            and j.score >= j.max_score then 'tuntas'
           -- Butir yang belum pernah dijawab pun ikut terhitung menyerah kalau
           -- kuncinya sudah dibuka: paketnya tidak bisa dibuka lagi, jadi butir
           -- itu memang berakhir tanpa pernah dikerjakan sampai selesai.
           when (select ya from terkunci) then 'menyerah_lihat_kunci'
           else 'belum_tuntas'
         end
  from paket_topik_item i
  left join jawaban j on j.question_bank_item_id = i.question_bank_item_id
  where i.paket_id = p_paket_id
  order by i.ord;
$$;

comment on function status_butir_paket(uuid, uuid) is
  'Status akhir tiap butir sebuah paket untuk satu murid di siklus berjalan (PRD FR3): tuntas, menyerah_lihat_kunci, atau belum_tuntas. Tanpa gerbang.';

create or replace function topik_kemajuan(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  topik_id text,
  nama text,
  elemen text,
  jenjang_kelas text,
  subject_id uuid,
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
  -- Butir yang BOLEH ditemui pemanggil ini, satu baris per (paket, butir).
  -- Saringannya sama persis dengan `topik_paket_items()` supaya penyebut di
  -- sini tidak pernah berasal dari kumpulan yang lain daripada yang benar-benar
  -- disodorkan ke anaknya.
  pool as (
    select p.topik_id, p.id as paket_id, b.id as item_id, b.weight
    from paket_topik p
    join paket_topik_item i on i.paket_id = p.id
    join question_bank_items b on b.id = i.question_bank_item_id
    join topik t on t.id = p.topik_id
    where (select learner from me) is not null
      and t.aktif
      and p.jenis = 'latihan'
      and b.status_verifikasi = 'aktif'
      and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  ),
  -- Jawaban TERAKHIR tiap butir, hanya dari putaran yang selesai dan hanya dari
  -- sesi jalur peta. Putaran yang ditinggalkan di tengah tidak bernilai, dan
  -- sesi jalur grup tidak boleh ikut menghitung — 148 menjamin butirnya memang
  -- terpisah, tapi menyebutnya di sini membuat jaminan itu tidak perlu
  -- dipercaya dari jauh.
  terakhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where a.learner_id = (select learner from me)
      and s.finished_at is not null
      and s.paket_topik_id is not null
    order by a.question_bank_item_id, a.answered_at desc
  ),
  -- Paket yang seluruh butirnya sudah benar, dan paket yang tidak bisa
  -- dikerjakan lagi (sempurna ATAU kuncinya sudah dibuka) — pembedaan yang
  -- migrasi 135 jelaskan panjang lebar untuk jalur grup, dan berlaku sama di
  -- sini.
  paket_selesai as (
    select k.topik_id,
           k.paket_id,
           bool_and(
             t.question_bank_item_id is not null
             and coalesce(t.max_score, 0) > 0
             and coalesce(t.score, 0) >= t.max_score
           ) as sempurna
    from pool k
    left join terakhir t on t.question_bank_item_id = k.item_id
    group by k.topik_id, k.paket_id
  ),
  paket_ringkas as (
    select ps.topik_id,
           count(*) as jumlah,
           count(*) filter (where ps.sempurna) as sempurna,
           count(*) filter (
             where ps.sempurna
                or paket_terkunci((select learner from me), ps.paket_id)
           ) as tuntas
    from paket_selesai ps
    group by ps.topik_id
  ),
  -- Mapel dipinjam dari kurikulum bimbel lewat `topik_grup`, yang menurut
  -- komentarnya sendiri memang ada untuk pelabelan. Gunanya di sini: rubrik
  -- penguasaan per mapel (`mastery_rubric_for`) bisa dipakai ulang, sehingga
  -- "Baik" dan "Istimewa" berarti sama di kedua paruh layar Penguasaan.
  -- `min` karena sebuah topik boleh menyeberang ke beberapa grup; seluruh
  -- pemetaan D-01 hari ini bermuara ke mapel yang sama.
  mapel as (
    select tg.topik_id, min(g.subject_id::text)::uuid as subject_id
    from topik_grup tg
    join curriculum_topic_groups g on g.id = tg.group_id
    group by tg.topik_id
  )
  select p.topik_id,
         max(tp.nama),
         max(tp.elemen::text),
         max(tp.jenjang_kelas),
         max(m.subject_id::text)::uuid,
         count(t.question_bank_item_id),
         count(*),
         coalesce(sum(t.score), 0),
         coalesce(sum(t.max_score), 0),
         coalesce(sum(p.weight), 0),
         -- Sengaja null. Lihat kepala berkas: ini Skor Putaran 1.
         null::numeric,
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
  join topik tp on tp.id = p.topik_id
  left join terakhir t on t.question_bank_item_id = p.item_id
  left join paket_ringkas pr on pr.topik_id = p.topik_id
  left join mapel m on m.topik_id = p.topik_id
  group by p.topik_id;
$$;

comment on function topik_kemajuan(text, uuid) is
  'Kemajuan tiap topik peta untuk satu murid, untuk layar Penguasaan keluarga. Paket yang kuncinya sudah kedaluwarsa dihitung belum tuntas lagi.';

-- 9. Hak eksekusi ---------------------------------------------------------------
--
-- `topik_paket_state` di-drop di atas, jadi grantnya ikut hilang bersamanya dan
-- harus dipasang ulang — tanpa ini seluruh peta murid berhenti memuat.
grant execute on function topik_paket_state(text, text, uuid) to anon, authenticated;

-- Fungsi bantu tidak diberikan kepada siapa pun. Ketiganya dipanggil dari dalam
-- fungsi `security definer` yang sudah bergerbang, dan ketiganya menerima
-- `learner_id` mentah — memberikannya ke `anon` berarti menyediakan cara
-- menanyakan keadaan anak orang lain satu per satu.
revoke all on function paket_terkunci(uuid, uuid) from public, anon, authenticated;
revoke all on function batas_siklus_paket(uuid, uuid) from public, anon, authenticated;
revoke all on function paket_buka_pada(uuid, uuid) from public, anon, authenticated;
revoke all on function jeda_buka_paket() from public, anon;

notify pgrst, 'reload schema';
