-- ============================================================
-- Ketuntasan pindah ke nilai akhir: pengulangan akhirnya dihitung
--
-- Sampai sebelum ini `tuntas` ditentukan Skor Putaran 1 — nilai percobaan
-- pertama. Alasannya masuk akal di atas kertas: mengukur penguasaan sebelum
-- anak melihat kuncinya. Yang tidak diperhitungkan adalah akibatnya di layar
-- dan di dalam kepala anak.
--
-- GEJALANYA: anak mengerjakan Paket C1, 1/8 di putaran pertama. Ia mengulang
-- soal yang salah sampai 7/8. Layarnya berkata 88%, statusnya berkata belum
-- tuntas, dan mengulang berapa kali pun tidak akan mengubahnya — Skor Putaran 1
-- terkunci untuk siklus itu. Pemilik produk bertanya dengan tepat: "kalau yang
-- dianggap cuma percobaan pertama, untuk apa ada pengulangan?"
--
-- Pertanyaan itu tidak punya jawaban yang jujur. Sistem menyuruh anak mengulang
-- lalu membuang hasilnya, sambil menampilkan angka yang bukan angka yang
-- memutuskan. Itu bukan cacat tampilan melainkan kontradiksi desain: satu
-- permukaan berpura-pura jadi dua hal sekaligus, alat belajar dan alat ukur.
--
-- PEMBAGIAN PERANNYA SEKARANG TEGAS:
--
--   Paket latihan = permukaan BELAJAR. Boleh diulang, dan hasil pengulangannya
--   DIHITUNG. Inilah corrective loop yang jadi inti mastery learning; ia
--   kehilangan seluruh maknanya kalau hasilnya dibuang.
--
--   Paket ujian (189) dan retest terjadwal (164) = permukaan MENGUKUR. Kolam
--   soal terpisah, butir yang belum pernah dilihat anak, sekali kerjakan.
--   Kekhawatiran "nilai akhir terkontaminasi hafalan" sudah dijaga di sini, dan
--   membangun penjaga kedua di paket latihan cuma pekerjaan ganda.
--
--   Skor Putaran 1 = SINYAL DIAGNOSTIK, bukan gerbang. Ia tetap dihitung, tetap
--   disimpan, tetap tampil di layar pengukuran tutor. Pertanyaannya sah — "apa
--   yang sudah dikuasai anak ini sebelum sesi tadi" — tapi itu bukan pertanyaan
--   kelulusan.
--
-- SELESAI BERARTI SELURUH BUTIRNYA DIJAWAB. Kolom baru `butir_terjawab`
-- menjaga lubang yang ikut pindah bersama gerbangnya: tanpa itu, anak yang
-- menjawab tiga butir dengan benar lalu berhenti pulang membawa nilai akhir
-- 100% atas tiga dari delapan. Penjaga yang sama sudah dipasang untuk Skor
-- Putaran 1 di 191.
--
-- ESKALASI IKUT PINDAH, DAN ITU SYARAT, BUKAN TAMBAHAN. Kalau ketuntasan
-- memakai nilai akhir sementara eskalasi tetap memakai Skor Putaran 1, seorang
-- anak bisa berstatus `tuntas` DAN dieskalasi pada saat yang sama — persis
-- pesan campur aduk yang membuat orang tua menelepon dan bertanya apakah
-- aplikasinya rusak. Dengan keduanya memakai nilai akhir, dua keadaan itu jadi
-- saling meniadakan dengan sendirinya: topik yang punya paket di bawah ambang
-- tidak mungkin tuntas.
--
-- Yang hilang dari eskalasi: kecepatan. Alarm lama berbunyi tepat sesudah
-- percobaan pertama yang buruk; alarm baru menunggu anak selesai mencoba
-- memperbaiki. Itu memang lebih lambat, dan memang lebih benar — yang perlu
-- ditemani tutor adalah anak yang sudah berusaha dan tetap tersendat, bukan
-- anak yang percobaan pertamanya jelek.
--
-- DAMPAK DATANYA DIHITUNG DULU, BUKAN DITEBAK. Dari 10 pasangan murid × paket
-- wajib yang pernah disentuh di pangkalan ini: satu berubah jadi tuntas (D-01
-- C1, 13% → 88% — kasus yang melahirkan migrasi ini), dan TIDAK ADA satu pun
-- yang kehilangan status tuntasnya. Radius ledakannya nol.
--
-- Jalankan SESUDAH 191.
-- ============================================================

-- 1. Skor paket: berapa butir yang sudah dijawab ------------------------------
--
-- Return type-nya bertambah satu kolom, jadi harus di-drop dulu. Fungsi lain
-- yang memanggilnya menyebut kolom per nama, bukan posisi, jadi tidak ada yang
-- ikut rusak — dan semuanya di-recreate di bawah.
drop function if exists skor_paket_topik(uuid, uuid);

create function skor_paket_topik(
  p_learner_id uuid,
  p_paket_id uuid
)
returns table (
  putaran integer,
  putaran_1_selesai boolean,
  butir_paket integer,
  butir_terjawab_putaran_1 integer,
  skor_putaran_1 numeric,
  skor_akhir numeric,
  -- Berapa butir paket ini yang sudah punya jawaban di siklus berjalan, dari
  -- putaran mana pun. Dipakai gerbang ketuntasan (192) untuk membedakan "nilai
  -- akhirnya bagus" dari "nilai akhirnya bagus atas tiga butir dari delapan".
  butir_terjawab integer
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
      -- SESI YANG DITINGGALKAN BUKAN PUTARAN (191). Dua syarat, dan keduanya
      -- perlu: sesi tanpa jawaban adalah ketukan yang tidak jadi, dan sesi yang
      -- belum selesai adalah pekerjaan yang masih berjalan. Salah satunya saja
      -- tidak cukup — sesi yang dijawab separuh lalu ditinggalkan lolos syarat
      -- pertama, dan sesi kosong yang kebetulan pernah dibuka halaman hasilnya
      -- lolos syarat kedua.
      and s.finished_at is not null
      and exists (
        select 1 from practice_answers a where a.session_id = s.id
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
  ),
  ukuran as (
    select coalesce(
      nullif((select count(*) from paket_butir_murid(p_learner_id, p_paket_id)), 0),
      (select p.jumlah_butir_sampel from paket_topik p where p.id = p_paket_id),
      0
    )::integer as butir
  )
  select
    coalesce((select max(sesi.putaran) from sesi), 0)::integer,
    coalesce((select bool_or(sesi.finished_at is not null) from sesi where sesi.putaran = 1), false),
    (select butir from ukuran),
    (select count(*) from jawaban_putaran_1)::integer,
    -- PENJAGA PUTARAN PENUH (191). Putaran pertama yang tidak mencakup seluruh
    -- butir paket tidak punya Skor Putaran 1 — bukan nol, melainkan tidak ada,
    -- karena yang belum diukur bukan yang bernilai nol.
    case
      when (select butir from ukuran) > 0
       and (select count(*) from jawaban_putaran_1) < (select butir from ukuran)
      then null
      else (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
              from jawaban_putaran_1)
    end,
    (select greatest(0, sum(coalesce(score, 0))) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_akhir),
    (select count(*) from jawaban_akhir)::integer;
$$;
-- Di-drop di atas, jadi hak aksesnya ikut hilang dan harus dicabut ulang. Ia
-- memulangkan Skor Putaran 1 — angka yang FR3 larang sampai ke murid — jadi
-- yang benar memang tidak diberikan kepada siapa pun dari luar; pemanggilnya
-- fungsi `security definer` yang sudah bergerbang.
revoke all on function skor_paket_topik(uuid, uuid) from public, anon, authenticated;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1, skor akhir, dan banyak butir terjawab sebuah paket topik untuk satu murid di siklus berjalan. Putaran dihitung dari sesi yang selesai dan berisi jawaban saja (191).';

-- 2. Ketuntasan: nilai akhir, bukan percobaan pertama -------------------------
--
-- Salinan 184 dengan penyaring ketuntasan yang diganti. Sisanya — cakupan
-- Bloom, retest gagal membatalkan tuntas, prasyarat menentukan siap/terkunci —
-- tidak disentuh.
drop function if exists status_topik_murid(uuid);

create function status_topik_murid(p_learner_id uuid)
returns table (
  topik_id text,
  status text,
  perlu_verifikasi_ulang boolean
)
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
  paket as (
    select p.topik_id, p.id as paket_id, s.skor_akhir,
           s.butir_paket, s.butir_terjawab
    from paket_topik p
    join topik t on t.id = p.topik_id
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    where p.jenis = 'latihan'
      -- Paket PENGAYAAN tidak menentukan ketuntasan. Rentang yang NULL berarti
      -- belum diputuskan, dan yang belum diputuskan tidak menyaring apa pun.
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
  ),
  -- SELESAI = seluruh butirnya sudah dijawab. Tanpa syarat ini, anak yang
  -- menjawab tiga butir dengan benar lalu berhenti pulang membawa skor akhir
  -- 100% atas tiga dari delapan — dan ambang 0,75 berhenti berarti apa pun
  -- kalau penyebutnya ikut menyusut mengikuti apa yang sempat dikerjakan.
  -- Penjaga yang sama sudah dipasang untuk Skor Putaran 1 di 191; ia ikut
  -- pindah bersama gerbangnya.
  agregat as (
    select pk.topik_id,
           count(*) as paket_total,
           count(*) filter (where coalesce(butir_terjawab, 0) > 0) as paket_dikerjakan,
           count(*) filter (
             where butir_paket > 0
               and butir_terjawab >= butir_paket
               and skor_akhir >= (select nilai from ambang)
           ) as paket_lolos,
           count(*) filter (
             where butir_paket > 0
               and butir_terjawab >= butir_paket
               and coalesce(skor_akhir, 0) < (select nilai from ambang)
           ) as paket_akhir_di_bawah
    from paket pk group by pk.topik_id
  ),
  eskalasi as (
    select distinct p.topik_id
    from notifikasi_eskalasi n
    join paket_topik p on p.id = any(n.paket_pemicu)
    where n.learner_id = p_learner_id
      and n.waktu_tutor_merespons is null
  ),
  retest_gagal as (
    select j.topik_id from jadwal_retest j
    where j.learner_id = p_learner_id and j.hasil_terakhir = 'gagal'
  ),
  tuntas as (
    select a.topik_id from agregat a
    where a.paket_total > 0
      and a.paket_lolos = a.paket_total
      and a.topik_id not in (select rg2.topik_id from retest_gagal rg2)
  )
  select t.id,
         case
           when e.topik_id is not null then 'eskalasi_tutor'
           when rg.topik_id is not null then 'butuh_pengulangan'
           when tt.topik_id is not null then 'tuntas'
           when a.paket_akhir_di_bawah > 0
                and a.paket_dikerjakan = a.paket_total then 'butuh_pengulangan'
           when coalesce(a.paket_dikerjakan, 0) > 0 then 'sedang_dikerjakan'
           when not exists (
             select 1 from topik_prasyarat pr
             where pr.topik_id = t.id
               and pr.prasyarat_id not in (select tt2.topik_id from tuntas tt2)
           ) then 'siap_dikerjakan'
           else 'terkunci'
         end,
         false
  from topik t
  left join agregat a on a.topik_id = t.id
  left join tuntas tt on tt.topik_id = t.id
  left join eskalasi e on e.topik_id = t.id
  left join retest_gagal rg on rg.topik_id = t.id;
$$;
comment on function status_topik_murid(uuid) is
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13). Sejak 192 `tuntas` memakai NILAI AKHIR paket latihan di dalam cakupan Bloom — seluruh butirnya dijawab dan nilainya di atas ambang — bukan lagi Skor Putaran 1. Dibatalkan retest terakhir yang gagal.';

revoke all on function status_topik_murid(uuid) from public, anon, authenticated;

-- 3. Gerbang ujian memakai aturan yang sama -----------------------------------

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
      -- Aturan yang sama dengan `status_topik_murid` (192): lolos berarti
      -- seluruh butirnya sudah dijawab DAN nilai akhirnya di atas ambang.
      and (
        coalesce(s.butir_paket, 0) = 0
        or coalesce(s.butir_terjawab, 0) < s.butir_paket
        or coalesce(s.skor_akhir, 0) < (select nilai from ambang)
      )
  );
$$;
comment on function ujian_menunggu_latihan(uuid, uuid) is
  'Apakah paket ujian ini masih menunggu paket latihan topiknya tuntas (189, aturannya mengikuti 192). False untuk paket bukan-ujian, dan untuk ujian yang sudah pernah dikerjakan.';

revoke all on function ujian_menunggu_latihan(uuid, uuid) from public, anon, authenticated;

-- 4. Alur Misi memakai aturan yang sama ---------------------------------------
--
-- Satu-satunya perubahan: "belum lolos" sekarang berarti nilai akhir, bukan
-- Skor Putaran 1. Akibat yang paling terasa di layar: sesudah anak memperbaiki
-- soal-soal yang salah sampai nilainya di atas ambang, alurnya benar-benar
-- pindah ke paket berikutnya — sesuatu yang sebelum ini mustahil terjadi tanpa
-- membuka kunci jawaban dan menunggu jedanya habis.
drop function if exists topik_langkah_berikutnya(text, uuid, text);

create or replace function topik_langkah_berikutnya(
  p_access_code text default '',
  p_learner_id uuid default null,
  p_topik_id text default null
)
returns table (
  topik_id text,
  -- NULL berarti tidak ada langkah tersisa: seluruh paket wajib lolos dan
  -- ujiannya sudah dikerjakan.
  paket_id uuid,
  jenis text,
  level_bloom smallint,
  -- Topik ini pernah punya sesi yang selesai, apa pun paketnya.
  sudah_mulai boolean,
  -- Keadaan paket langkahnya, supaya layar tidak perlu bertanya dua kali.
  terkunci boolean,
  buka_pada timestamptz,
  -- Paket langkahnya sendiri sudah pernah dikerjakan sampai selesai.
  --
  -- Yang dibedakan olehnya "lanjut" dari "ulangi": langkah yang menunjuk paket
  -- yang baru saja dikerjakan anak berarti paketnya belum lolos ambang, dan
  -- layar yang tetap berkata "Lanjut: Paket C1" pada anak yang baru menutup
  -- Paket C1 terbaca seperti aplikasi yang tidak mengikuti.
  pernah_dikerjakan boolean
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
    select coalesce(
      (select (nilai #>> '{}')::numeric from pengaturan where kunci = 'ambang_mastery'),
      0.75
    ) as nilai
  ),
  topik_dipakai as (
    select t.id, t.bloom_min, t.bloom_maks
    from topik t
    where t.aktif
      and (p_topik_id is null or t.id = p_topik_id)
      and (select learner from me) is not null
  ),
  wajib as (
    select p.topik_id, p.id as paket_id, p.jenis, p.level_bloom, p.nomor,
           s.skor_akhir, s.butir_paket, s.butir_terjawab
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    left join lateral skor_paket_topik((select learner from me), p.id) s on true
    where p.jenis = 'latihan'
      and (
        t.bloom_min is null
        or p.level_bloom is null
        or p.level_bloom between t.bloom_min and t.bloom_maks
      )
  ),
  belum as (
    select distinct on (w.topik_id)
           w.topik_id, w.paket_id, w.jenis, w.level_bloom
    from wajib w
    -- Belum lolos, dengan aturan yang sama persis seperti ketuntasan (192).
    where coalesce(w.butir_paket, 0) = 0
       or coalesce(w.butir_terjawab, 0) < w.butir_paket
       or coalesce(w.skor_akhir, 0) < (select nilai from ambang)
    order by w.topik_id, w.level_bloom nulls last, w.nomor
  ),
  ujian as (
    select p.topik_id, p.id as paket_id, p.jenis, p.level_bloom
    from paket_topik p
    join topik_dipakai t on t.id = p.topik_id
    where p.jenis = 'ujian'
      and not exists (
        select 1 from practice_sessions s
        where s.learner_id = (select learner from me)
          and s.paket_topik_id = p.id
      )
  )
  select t.id,
         coalesce(b.paket_id, u.paket_id),
         coalesce(b.jenis, u.jenis),
         coalesce(b.level_bloom, u.level_bloom),
         exists (
           select 1
           from practice_sessions s
           join paket_topik p on p.id = s.paket_topik_id
           where s.learner_id = (select learner from me)
             and p.topik_id = t.id
             and s.finished_at is not null
         ),
         coalesce(
           paket_terkunci((select learner from me), coalesce(b.paket_id, u.paket_id)),
           false
         ),
         paket_buka_pada((select learner from me), coalesce(b.paket_id, u.paket_id)),
         coalesce(
           (
             select s.putaran > 0
             from skor_paket_topik(
               (select learner from me), coalesce(b.paket_id, u.paket_id)
             ) s
           ),
           false
         )
  from topik_dipakai t
  left join belum b on b.topik_id = t.id
  -- Ujiannya cuma dilirik kalau tidak ada lagi paket wajib yang tersisa.
  left join ujian u on u.topik_id = t.id and b.topik_id is null;
$$;
comment on function topik_langkah_berikutnya(text, uuid, text) is
  'Paket berikutnya yang ditawarkan alur Misi untuk tiap topik aktif (190, 191, aturannya mengikuti 192): paket wajib terendah yang belum lolos, lalu ujiannya, lalu tidak ada.';

grant execute on function topik_langkah_berikutnya(text, uuid, text) to anon, authenticated;

-- 5. Eskalasi tutor: yang tersendat, bukan yang percobaan pertamanya jelek -----

create or replace function periksa_eskalasi_dua_paket()
returns trigger
language plpgsql
security definer
set search_path = public
as $esk$
declare
  v_paket record;
  v_sebelumnya uuid;
  v_ambang numeric;
  v_skor_ini numeric;
  v_skor_sebelumnya numeric;
  v_tutor uuid;
  v_min smallint;
  v_maks smallint;
begin
  if new.paket_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select p.id, p.topik_id, p.jenis, p.nomor, p.level_bloom into v_paket
  from paket_topik p where p.id = new.paket_topik_id;

  if v_paket.jenis <> 'latihan' then return new; end if;

  select bloom_min, bloom_maks into v_min, v_maks from topik where id = v_paket.topik_id;

  -- Paket pengayaan tidak memicu apa pun.
  if v_min is not null and v_paket.level_bloom is not null
     and (v_paket.level_bloom < v_min or v_paket.level_bloom > v_maks) then
    return new;
  end if;

  -- SYARAT "PUTARAN PERTAMA SAJA" DICABUT (192). Selama pemicunya Skor
  -- Putaran 1, alarm memang hanya masuk akal pada putaran pertama. Sejak
  -- pemicunya nilai AKHIR, memeriksa cuma di putaran pertama berarti memanggil
  -- tutor untuk anak yang barusan mulai dan belum sempat memperbaiki apa pun —
  -- persis anak yang paling tidak butuh dipanggil. Sekarang tiap putaran yang
  -- ditutup ikut diperiksa, dan `on conflict do nothing` di bawah yang menjaga
  -- notifikasinya tidak lahir dua kali.

  -- Paket sebelumnya yang di dalam cakupan. Untuk topik yang mulai di C3
  -- (D-18), paket C2 bukan "paket sebelumnya" — ia bukan bagian dari
  -- kurikulum topik itu sama sekali.
  select p.id into v_sebelumnya
  from paket_topik p
  where p.topik_id = v_paket.topik_id
    and p.jenis = 'latihan'
    and p.nomor = v_paket.nomor - 1
    and (v_min is null or p.level_bloom is null
         or p.level_bloom between v_min and v_maks);

  if v_sebelumnya is null then return new; end if;

  select (nilai #>> '{}')::numeric into v_ambang
  from pengaturan where kunci = 'ambang_mastery';
  v_ambang := coalesce(v_ambang, 0.75);

  -- Nilai AKHIR, bukan Skor Putaran 1 (192) — dan hanya untuk paket yang
  -- seluruh butirnya sudah dijawab. Anak yang tersendat adalah anak yang sudah
  -- mencoba memperbaiki dan tetap di bawah ambang, bukan anak yang percobaan
  -- pertamanya jelek. Yang pertama butuh ditemani; yang kedua sedang belajar.
  select skor_akhir into v_skor_ini
  from skor_paket_topik(new.learner_id, new.paket_topik_id)
  where butir_paket > 0 and butir_terjawab >= butir_paket;
  select skor_akhir into v_skor_sebelumnya
  from skor_paket_topik(new.learner_id, v_sebelumnya)
  where butir_paket > 0 and butir_terjawab >= butir_paket;

  -- Paket yang belum selesai dikerjakan bukan paket yang gagal.
  if v_skor_ini is null or v_skor_sebelumnya is null then return new; end if;
  if v_skor_ini >= v_ambang or v_skor_sebelumnya >= v_ambang then return new; end if;

  select l.tutor_penanggung_jawab_id into v_tutor
  from learners l where l.id = new.learner_id;

  insert into notifikasi_eskalasi
    (learner_id, tutor_penanggung_jawab_id, pemicu, paket_pemicu,
     ambang_berlaku, skor_pemicu)
  values
    (new.learner_id, v_tutor, 'dua_paket_berturut_di_bawah_ambang',
     array[v_sebelumnya, new.paket_topik_id],
     v_ambang, array[v_skor_sebelumnya, v_skor_ini])
  on conflict (learner_id, pemicu, paket_pemicu) do nothing;

  return new;
end;
$esk$;
-- 6. Cetakan status disegarkan ------------------------------------------------
--
-- Definisi `tuntas` berubah, jadi cetakan yang tertinggal akan menampilkan
-- status lama di layar tutor dan keluarga sampai anaknya kebetulan
-- menyelesaikan paket berikutnya.
do $$
declare v_learner uuid;
begin
  for v_learner in select distinct learner_id from status_topik_siswa loop
    perform evaluasi_unlock(v_learner);
  end loop;
end $$;

notify pgrst, 'reload schema';
