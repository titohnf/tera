-- ============================================================
-- Kemajuan jalur peta, supaya orang tua bisa melihatnya
--
-- Sejak migrasi 148 butir ber-`topik_id` dilarang punya
-- `question_curriculum_tags`. Itu disengaja, dan akibatnya juga: untuk
-- Matematika, peta kompetensi jadi satu-satunya jalan. Tapi seluruh permukaan
-- Penguasaan keluarga berkunci grup — `practice_topic_progress` (135) dan
-- pembacaan langsung `question_curriculum_tags` — sehingga hasil pengerjaan di
-- jalur peta tidak muncul di sana sama sekali. Makin banyak anak mengerjakan,
-- makin kosong laporan yang dilihat orang tuanya.
--
-- Dua fungsi di sini menutup itu. FUNGSI BARU, bukan melebarkan `practice_*`:
-- keluarga itu dipakai bersama repo `form` (Sora) terhadap database yang sama,
-- dan disiplin "fungsi bersama tidak berubah arti demi satu pemakainya" sudah
-- ditulis berulang di migrasi 092, 110, 122, 124, 128, dan 146.
--
-- ⚠️ GERBANG BERBAYAR, sama seperti seluruh keluarga `topik_*` (146): tiap
-- fungsi memanggil `practice_actor()` untuk memastikan pemanggilnya berhak
-- bertindak atas nama pelajar itu, DAN `practice_only_public()` untuk menyaring
-- butir non-publik bagi akun mandiri yang tidak berlangganan. Yang kedua mudah
-- terlewat karena ketiadaannya tidak pernah memunculkan galat.
--
-- PENYEBUTNYA PAKET `latihan` SAJA, sama persis dengan `nilai_topik` di
-- `topik_tersedia()`. Kalau laporan ikut menghitung paket ujian sementara peta
-- tidak, peta anak akan berkata "tuntas" pada hari yang sama laporan orang
-- tuanya berkata 60% — dua layar, satu keluarga, dua angka yang dua-duanya
-- mengaku penguasaan. Paket ujian dilaporkan terpisah di halaman rincian,
-- lewat `topik_paket_state()` yang memang memulangkan semua jenis.
--
-- `first_score` SELALU NULL DI SINI, dan itu bukan kelalaian. Di jalur grup
-- kolom itu menghidupkan baris "Naik dari X%" — tidak berbahaya, karena
-- latihan bebas tidak dipakai mengklaim apa pun. Di jalur peta, nilai jawaban
-- PERTAMA tiap butir adalah Skor Putaran 1: angka yang PRD FR3 larang
-- ditampilkan ke murid "dalam bentuk apa pun", dan yang migrasi 149 sengaja
-- `revoke` dari `public` dengan alasan bahwa fungsi di skema `public` adalah
-- antarmuka. Kolomnya tetap ada supaya bentuknya sama dengan
-- `practice_topic_progress` dan satu pembangun baris di layar bisa melayani
-- keduanya — tapi isinya tidak pernah keluar dari database. Yang berhak
-- melihatnya tetap tutor, lewat `topik_skor_paket()` (149).
-- ============================================================

-- 1. Kemajuan per topik -------------------------------------------------------
--
-- Bentuk kolomnya menyalin `practice_topic_progress` (135) persis. Itu bukan
-- kerapian: halaman Penguasaan merender dua sumber berdampingan, dan begitu
-- keduanya melewati pembangun baris yang sama, keduanya tidak bisa diam-diam
-- berbeda arti. Yang ditambahkan di depan hanya identitas topiknya.
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
                or exists (
                  select 1 from paket_topik_kunci l
                  where l.learner_id = (select learner from me)
                    and l.paket_id = ps.paket_id
                )
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

-- 2. Keanggotaan seluruh paket sebuah topik -----------------------------------
--
-- Kembaran `topik_paket_items()` untuk SELURUH paket topik sekaligus. Ada
-- supaya halaman rincian tidak memanggil fungsi itu sekali per paket, dan
-- supaya barisnya membawa identitas paketnya — jalur grup bisa berkunci nomor
-- urut, jalur topik tidak: paketnya dibedakan jenis dan level Bloom.
--
-- Berbeda dari fungsi di atas, ini memulangkan paket UJIAN juga. Halaman
-- rincian memang harus menampilkannya — yang tidak boleh cuma ikut jadi
-- penyebut angka penguasaan.
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
  select p.id, p.jenis, p.level_bloom, p.nomor, i.question_bank_item_id, i.ord
  from paket_topik p
  join paket_topik_item i on i.paket_id = p.id
  join question_bank_items b on b.id = i.question_bank_item_id
  where p.topik_id = p_topik_id
    and practice_actor(coalesce(p_access_code, ''), p_learner_id) is not null
    and b.status_verifikasi = 'aktif'
    and (b.is_public or not practice_only_public(coalesce(p_access_code, ''), p_learner_id))
  order by p.jenis desc, p.nomor, i.ord;
$$;

grant execute on function topik_kemajuan(text, uuid) to anon, authenticated;
grant execute on function topik_isi_paket(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
