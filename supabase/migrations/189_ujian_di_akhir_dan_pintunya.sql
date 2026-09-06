-- ============================================================
-- Ujian di akhir daftar, dan pintunya menunggu latihan selesai
--
-- Dua perbaikan yang kebetulan mengenai baris yang sama, dan lebih jujur
-- dikerjakan sekaligus daripada dua kali menyentuh fungsi yang itu-itu juga.
--
-- SATU: URUTANNYA TERBALIK SEJAK 145, DAN TIDAK ADA YANG MENGHENDAKINYA.
-- Seluruh penyaji paket ditutup `order by jenis desc`, dan niatnya tertulis di
-- 150:
--
--   -- `jenis desc`: 'latihan' sebelum 'ujian', urutan yang sama dengan
--   -- `topik_paket_state` (146) supaya kedua permukaan tidak saling
--   -- bertentangan soal mana yang lebih dulu.
--
-- Komentar itu salah membaca kodenya sendiri: 'latihan' < 'ujian', jadi `desc`
-- justru menaruh ujian LEBIH DULU. Kekeliruan arah lahir tanpa komentar di
-- 145:234 dan tersalin apa adanya ke 146, 147, 149, 150, 152, 153, 161, 175,
-- 177, 178, dan 183 — sebelas berkas yang tidak satu pun membela "ujian dulu"
-- sebagai keputusan. Yang dipasang di sini `(jenis = 'ujian')` — ekspresi yang
-- menjelaskan dirinya sendiri, tidak bergantung pada abjad, dan tidak bisa
-- terbalik lagi kalau kelak ada jenis ketiga. `level_bloom nulls last` ikut
-- karena urutan C1..C6 tidak boleh bergantung pada nomor yang kebetulan
-- sejalan.
--
-- DUA: UJIAN TIDAK LAGI BISA DIBUKA SEBELUM LATIHANNYA TUNTAS.
-- Sampai sebelum ini ujian hanya dijaga satu hal — "sekali seumur hidup"
-- (183). Digabung dengan posisinya di puncak daftar, itu kombinasi yang paling
-- mahal yang bisa dirakit: anak yang membuka topik baru dan mengetuk kartu
-- teratas menghanguskan satu-satunya kesempatan ujiannya sebelum mengerjakan
-- satu paket latihan pun. Tidak ada putaran kedua, tidak ada pembatalan.
--
-- SYARATNYA "SELURUH PAKET LATIHAN DI DALAM CAKUPAN", BUKAN "C1 SAMPAI C6".
-- 182 memberi angkanya: banyak topik cakupannya berhenti di C3, dan paket
-- C4-C6 di sana sengaja dibiarkan hidup sebagai PENGAYAAN. Syarat "semua level
-- tuntas" berarti ujian di topik-topik itu tidak akan pernah bisa dibuka
-- seumur hidup aplikasinya. Yang dipakai di sini kondisi yang sudah ada
-- definisinya — paket latihan dalam cakupan Bloom yang lolos Putaran 1, persis
-- yang dipakai `status_topik_murid` (184) memutuskan `tuntas` — jadi tidak ada
-- aturan kedua yang harus diingat bersamaan.
--
-- INI SATU-SATUNYA GERBANG KERAS DI JALUR PETA, dan pengecualiannya beralasan.
-- Prasyarat topik MEMBERI TAHU dan tidak memblokir (146 Bagian 5) karena
-- melanggarnya cuma berarti soal yang lebih sulit — kerugiannya sebesar satu
-- sesi yang boleh diulang. Membuka ujian terlalu dini menghanguskan pengukuran
-- independen sebuah topik, dan tidak ada cara memulihkannya.
--
-- YANG TIDAK BERUBAH: ujian tetap TIDAK menentukan ketuntasan (163, 182). Ia
-- pemeriksa independen, dan gerbang ini justru yang membuat selisih
-- latihan-ujian (Fondasi 4.2) berarti — keduanya kini diukur pada anak yang
-- sudah belajar, bukan pada anak yang kebetulan mengetuk duluan.
--
-- TIGA: PAKET PENGAYAAN DIBEDAKAN DARI PAKET WAJIB.
-- Gerbang di atas menuntut "semua paket wajib tuntas", dan sebuah tuntutan yang
-- tidak bisa dilihat batasnya adalah tuntutan yang tidak bisa dipenuhi dengan
-- tenang: layar hari ini menampilkan C1 sampai C6 sebagai enam baris sederajat,
-- padahal 182 sudah lama memutuskan hanya sebagian di antaranya yang menentukan
-- ketuntasan. Anak yang melihat enam baris akan mengira enam-enamnya wajib —
-- dan yang berhenti di C4 pada topik yang cakupannya berhenti di C3 mengerjakan
-- dua paket tambahan yang tidak pernah diminta siapa pun.
--
-- `pengayaan` MEMULANGKAN CAKUPAN ITU KE LAYAR, tanpa memindahkan keputusannya
-- ke sana: penyaringnya satu ekspresi yang sama dengan yang dipakai
-- `status_topik_murid` dan `ujian_menunggu_latihan`, dan layar cuma membacanya.
-- Paket di LUAR cakupan bisa berada di bawah maupun di atasnya — 184 mencatat
-- 14 topik mulai di C2 dan 13 mulai di C3 — jadi urutannya memakai kolom itu
-- sendiri, bukan level Bloom-nya, supaya yang wajib selalu berdiri lebih dulu.
--
-- EMPAT: PENYEBUT YANG DIBACA ORANG TUA IKUT BERHENTI MENGHITUNG PENGAYAAN.
-- `topik_kemajuan` menghitung SELURUH paket latihan, termasuk yang di luar
-- cakupan. Selama layar tidak membedakan keduanya, itu cuma angka yang murah
-- hati; begitu layar anak berkata "C4 tidak wajib", ia jadi dua cerita tentang
-- satu topik dalam satu keluarga — peta anak berkata topiknya tuntas pada hari
-- layar orang tua berkata 4 dari 6 paket. Preseden penanganannya sudah ada di
-- layar itu sendiri: paket ujian pun dikeluarkan dari penyebut, dan
-- ketiadaannya disebutkan dengan satu kalimat alih-alih disembunyikan.
--
-- AKIBATNYA ANGKA YANG SUDAH TERLANJUR DIBACA BISA BERGERAK, dan hampir selalu
-- NAIK: yang hilang dari penyebut justru paket yang paling jarang dikerjakan.
-- Tidak ada data yang berubah — yang berubah pertanyaannya, dari "berapa banyak
-- yang sudah dikerjakan dari semua yang ada" menjadi "berapa banyak dari yang
-- memang diminta".
--
-- Jalankan SESUDAH 184 (`status_topik_murid` tanpa suku pembebasan).
-- ============================================================

-- 1. Ujian yang masih menunggu latihannya --------------------------------------
--
-- Satu fungsi, dipakai dua tempat: pembuka sesi memakainya sebagai gerbang,
-- penyaji paket memakainya sebagai kabar untuk layar. Menyalin syaratnya ke
-- dua tempat berarti layar yang suatu hari mempersilakan pintu yang sebenarnya
-- tertutup.
--
-- MEMULANGKAN FALSE UNTUK UJIAN YANG SUDAH DIKERJAKAN. Sesudah sesinya ada,
-- tidak ada lagi yang ditunggu — dan tanpa baris itu, layar akan menempeli
-- ujian yang sudah selesai dengan kalimat "terbuka setelah latihanmu tuntas".
create or replace function ujian_menunggu_latihan(p_learner_id uuid, p_paket_id uuid)
returns boolean
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
  ujian as (
    select p.topik_id
    from paket_topik p
    where p.id = p_paket_id
      and p.jenis = 'ujian'
      and p_learner_id is not null
      and not exists (
        select 1 from practice_sessions s
        where s.learner_id = p_learner_id and s.paket_topik_id = p.id
      )
  )
  select exists (
    select 1
    from paket_topik p
    join topik t on t.id = p.topik_id
    join ujian u on u.topik_id = p.topik_id
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    where p.jenis = 'latihan'
      -- Paket PENGAYAAN tidak menahan ujian, dengan penyaring yang sama persis
      -- seperti di `status_topik_murid`: rentang NULL berarti belum
      -- diputuskan, dan yang belum diputuskan tidak menyaring apa pun.
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
      and (
        s.skor_putaran_1 is null
        or s.skor_putaran_1 < (select nilai from ambang)
      )
  );
$$;

comment on function ujian_menunggu_latihan(uuid, uuid) is
  'Apakah paket ujian ini masih menunggu paket latihan topiknya tuntas (migrasi 189). False untuk paket bukan-ujian, dan untuk ujian yang sudah pernah dikerjakan.';

-- Tidak diberikan kepada siapa pun: ia menerima `learner_id` mentah dan
-- memulangkan kesimpulan atas Skor Putaran 1, angka yang tidak pernah
-- menyeberang ke murid. Pemanggilnya dua fungsi `security definer` yang
-- gerbangnya `practice_actor()`.
revoke all on function ujian_menunggu_latihan(uuid, uuid) from public, anon, authenticated;

-- 2. Pembuka sesi: gerbangnya ---------------------------------------------------
--
-- Salinan versi 183 dengan satu blok tambahan sesudah pemeriksaan "ujian ini
-- sudah pernah dibuka". Sisanya — sampel berjenjang, penambal, siklus paket —
-- tidak disentuh.
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

  -- Gerbang ujian (189). Sesudah pemeriksaan "sudah pernah dibuka" di atas,
  -- supaya murid yang sudah mengerjakan ujiannya tidak dikabari ia belum boleh
  -- mengerjakannya.
  --
  -- MEMBLOKIR, tidak sekadar memberi tahu — satu-satunya gerbang keras di
  -- seluruh jalur peta, dan alasannya khusus ujian: ia sekali seumur topik,
  -- tidak punya putaran kedua, dan tidak bisa dibatalkan. Prasyarat topik boleh
  -- dilanggar karena melanggarnya cuma berarti soal yang lebih sulit; membuka
  -- ujian terlalu dini menghanguskan satu-satunya pengukuran independen topik
  -- itu, dan tidak ada cara memulihkannya.
  --
  -- Kalimatnya dilempar sebagai check_violation supaya sampai apa adanya ke
  -- layar murid — jalur yang sudah dibuka 155 dan diteruskan `bukaPaketTopik`.
  if ujian_menunggu_latihan(v_learner, p_paket_id) then
    raise exception
      'Ujian topik ini terbuka setelah semua paket wajibnya tuntas. Selesaikan dulu paket yang tersisa ya — ujiannya cuma bisa dikerjakan sekali, jadi lebih baik saat kamu sudah siap.'
      using errcode = 'check_violation';
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
  'Membuka satu putaran sebuah paket topik. Ujian ditolak kalau paket latihan topiknya belum tuntas (189) atau sudah pernah dikerjakan; paket latihan yang terkunci menunggu jedanya habis.';

-- 3. Penyaji paket: urutannya, dan kabar gerbangnya -----------------------------
--
-- Return type-nya bertambah satu kolom, jadi ia harus di-drop dulu — dan
-- grantnya ikut hilang bersamanya, seperti yang sudah dialami 183. Dipasang
-- ulang di bagian terakhir berkas ini; tanpa itu seluruh peta murid berhenti
-- memuat.
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
  buka_pada timestamptz,
  -- Ujian yang masih menunggu paket latihannya. Kolom sendiri, bukan digabung
  -- ke `terkunci`: yang itu berarti "kuncinya sudah dibuka, nilainya berhenti
  -- di situ", dan layar mengucapkan keduanya dengan kalimat yang berbeda.
  menunggu_latihan boolean,
  -- Paket latihan di LUAR cakupan Bloom topiknya: boleh dikerjakan, tidak
  -- menentukan ketuntasan, tidak menahan ujian. False untuk paket ujian, dan
  -- untuk topik yang cakupannya belum diputuskan (rentang NULL) — di sana
  -- seluruh paket masih wajib, seperti sebelum 182 ada.
  pengayaan boolean
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
    select p.id, p.jenis, p.level_bloom, p.nomor, p.jumlah_butir_sampel,
           (
             p.jenis = 'latihan'
             and t.bloom_min is not null
             and p.level_bloom is not null
             and p.level_bloom not between t.bloom_min and t.bloom_maks
           ) as pengayaan
    from paket_topik p
    join topik t on t.id = p.topik_id
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
         paket_buka_pada((select learner from me), k.id),
         ujian_menunggu_latihan((select learner from me), k.id),
         k.pengayaan
  from paket k
  left join lateral paket_butir_murid(
    (select learner from me), k.id, coalesce(p_access_code, '')
  ) i on true
  left join jawaban j
    on j.question_bank_item_id = i.item_id and j.paket_topik_id = k.id
  left join putaran p on p.paket_topik_id = k.id
  group by k.id, k.jenis, k.level_bloom, k.nomor, k.jumlah_butir_sampel, k.pengayaan
  -- Wajib lebih dulu, pengayaan sesudahnya, ujian paling akhir. `pengayaan`
  -- mendahului level Bloom karena paket di luar cakupan bisa berada di BAWAH
  -- cakupan juga: topik yang mulai di C3 punya C1 dan C2 sebagai pengayaan, dan
  -- mengurutkannya menurut level akan menaruh keduanya di depan paket wajib.
  order by (k.jenis = 'ujian'), k.pengayaan, k.level_bloom nulls last, k.nomor;
$$;

comment on function topik_paket_state(text, text, uuid) is
  'Keadaan tiap paket sebuah topik untuk satu murid di siklus yang berjalan: banyak butir, hasil per butir, skor berlantai nol, putaran, kuncinya, kapan kuncinya terbuka lagi, apakah ujiannya masih menunggu paket wajib, dan apakah ia paket pengayaan (189). Urut wajib, pengayaan, lalu ujian.';

-- 4. Permukaan lain yang ikut terbalik urutannya --------------------------------
--
-- Keempatnya cuma berganti `order by`. Mereka ikut di berkas ini karena urutan
-- yang berbeda antara layar murid dan layar tutor adalah cacat tersendiri:
-- tutor yang menyebut "paket paling atas" dan murid yang membukanya akan
-- membicarakan dua paket yang berbeda.

-- Isi paket untuk layar Penguasaan keluarga (177).
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
  order by (p.jenis = 'ujian'), p.level_bloom nulls last, p.nomor, i.ord;
$$;

-- Skor per paket satu topik, untuk tutor penanggung jawab (149).
create or replace function topik_skor_paket(
  p_learner_id uuid,
  p_topik_id text
)
returns table (
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
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
  select p.id, p.jenis, p.level_bloom, p.nomor,
         s.putaran, s.putaran_1_selesai, s.butir_paket,
         s.butir_terjawab_putaran_1, s.skor_putaran_1, s.skor_akhir
  from paket_topik p
  cross join lateral skor_paket_topik(p_learner_id, p.id) s
  where p.topik_id = p_topik_id
    -- Gerbang. Bukan `practice_actor()` seperti fungsi penyaji lain di 146:
    -- yang ini mengembalikan Skor Putaran 1, dan murid maupun keluarganya
    -- justru pihak yang tidak boleh melihatnya (FR3). Yang boleh: admin, dan
    -- tutor yang namanya tertulis sebagai penanggung jawab murid ini.
    and (
      is_admin()
      or exists (
        select 1 from learners l
        where l.id = p_learner_id
          and l.tutor_penanggung_jawab_id = auth.uid()
      )
    )
  order by (p.jenis = 'ujian'), p.level_bloom nulls last, p.nomor;
$$;

-- Seluruh paket seorang murid di layar pengukuran tutor (153).
create or replace function tutor_pengukuran_paket(p_learner_id uuid)
returns table (
  topik_id text,
  topik_nama text,
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  nomor integer,
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric,
  detik_per_butir numeric,
  butir_menyerah integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select t.id, t.nama, p.id, p.jenis, p.level_bloom, p.nomor,
         s.putaran, s.putaran_1_selesai, s.butir_paket,
         s.butir_terjawab_putaran_1, s.skor_putaran_1, s.skor_akhir,
         (
           select avg(
             greatest(
               extract(epoch from a.answered_at - a.waktu_mulai_item)
                 - coalesce(a.jeda_ms, 0) / 1000.0,
               0
             )
           )
           from practice_answers a
           join practice_sessions ps on ps.id = a.session_id
           where ps.paket_topik_id = p.id
             and a.learner_id = p_learner_id
             and a.waktu_mulai_item is not null
         ),
         (
           select count(*)::integer
           from status_butir_paket(p_learner_id, p.id) b
           where b.status = 'menyerah_lihat_kunci'
         )
  from paket_topik p
  join topik t on t.id = p.topik_id
  cross join lateral skor_paket_topik(p_learner_id, p.id) s
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.tutor_penanggung_jawab_id = auth.uid()
        )
  order by t.urutan, (p.jenis = 'ujian'), p.level_bloom nulls last, p.nomor;
$$;

-- Laporan yang dipulangkan penyemai paket (178). Bukan permukaan murid, tapi
-- ia dibaca saat topik baru disemai, dan dua urutan yang berbeda di layar yang
-- berbeda adalah persis yang membuat 150 salah menulis komentarnya.
create or replace function semai_paket_topik(p_topik_id text)
returns table (paket_id uuid, jenis text, level_bloom smallint, jumlah_butir bigint)
language plpgsql
volatile
security definer
set search_path = public
as $semai$
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
    order by (p.jenis = 'ujian'), p.level_bloom nulls last, p.nomor;
end;
$semai$;

-- 5. Kemajuan yang dibaca keluarga ----------------------------------------------
--
-- Salinan versi 183 dengan satu penyaring tambahan di `pool`. Ia memberi makan
-- dua layar sekaligus — rincian topik di Penguasaan dan tab Ketuntasan — jadi
-- keduanya berhenti menghitung pengayaan pada saat yang sama.

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
      -- Paket PENGAYAAN tidak ikut, sejak 189. Penyaring yang sama dengan
      -- `status_topik_murid` (184) dan `ujian_menunggu_latihan`: kalau paket di
      -- luar cakupan tidak menentukan ketuntasan, ia juga tidak boleh menjadi
      -- penyebut angka yang dibaca orang tua sebagai ketuntasan. Sebelum ini
      -- keduanya berselisih tanpa suara — peta anak berkata topiknya tuntas
      -- pada hari layar orang tua berkata 4 dari 6 paket.
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
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
  'Kemajuan tiap topik peta untuk satu murid, untuk layar Penguasaan keluarga. Menghitung paket latihan DI DALAM cakupan Bloom topiknya saja (189); paket yang kuncinya sudah kedaluwarsa dihitung belum tuntas lagi.';

-- 6. Hak eksekusi ---------------------------------------------------------------

grant execute on function topik_paket_state(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
