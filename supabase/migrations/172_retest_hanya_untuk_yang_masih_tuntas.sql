-- ============================================================
-- Retest hanya ditawarkan untuk topik yang MASIH tuntas
--
-- Saudara kandung migrasi 170, ditemukan dengan cara yang sama: sebuah penanda
-- yang hanya berarti bagi topik tuntas ternyata hidup lebih lama daripada
-- ketuntasannya sendiri. Di 170 penandanya `perlu_verifikasi_ulang`; di sini
-- barisnya `jadwal_retest`.
--
-- CARA MENEMUKANNYA. Migrasi 171 menambahkan paket C4–C6 ke topik yang tadinya
-- hanya punya C1–C3. Seorang murid yang sudah menuntaskan D-02, D-03, dan D-08
-- seketika turun ke `sedang_dikerjakan` — benar dan memang seharusnya begitu,
-- karena `tuntas` menuntut SELURUH paket latihan lolos di Putaran 1, dan
-- sekarang paketnya bertambah tiga. Yang tidak ikut turun: ketiga baris
-- `jadwal_retest` yang lahir sewaktu topik itu masih tuntas.
--
-- AKIBATNYA BUKAN SEKADAR BARIS YATIM. Pada 16 September `retest_jatuh_tempo`
-- akan menawarkan "pengecekan ulang" untuk topik yang penguasaannya sudah
-- tidak berlaku — dan retest adalah PEMBUKTIAN ULANG, sesuatu yang mustahil
-- dilakukan terhadap ketuntasan yang tidak ada. Lebih buruk lagi ujungnya:
-- probe itu bisa gagal, `catat_hasil_retest` menuliskan `hasil_terakhir =
-- 'gagal'`, dan topiknya jatuh ke `butuh_pengulangan` — anak dihukum karena
-- paket yang belum ada waktu ia mengerjakannya.
--
-- Menambahkan level Bloom ke sebuah topik bukan kejadian sekali seumur hidup.
-- Setiap kali bank soal tumbuh, keadaan ini terulang.
--
-- BARISNYA TIDAK DIHAPUS. Yang dihapus kehilangan riwayat intervalnya, dan
-- murid yang menuntaskan lagi topik itu akan mulai dari interval awal seolah
-- ia belum pernah membuktikan apa pun. Yang benar adalah TIDAK MENAWARKANNYA
-- selama topiknya belum tuntas; begitu tuntas lagi, jadwalnya melanjutkan dari
-- tempat ia berhenti.
--
-- DIPASANG DI KEDUA GERBANG, bukan salah satu. `retest_jatuh_tempo` yang
-- menampilkan dan `retest_buka_sesi` yang membuka adalah dua pintu ke ruangan
-- yang sama; menutup satu saja menyisakan alamat yang masih bisa diketuk.
--
-- Status dibaca dari `status_topik_siswa`, cetakan yang disegarkan
-- `evaluasi_unlock` di akhir tiap sesi. Baris yang TIDAK ADA diperlakukan sama
-- dengan tidak tuntas — bukan sebaliknya. Topik yang belum pernah dievaluasi
-- juga tidak punya ketuntasan untuk dibuktikan ulang, dan sebuah `coalesce`
-- yang murah hati di sini akan mengembalikan persis lubang yang sedang ditutup.
--
-- Jalankan SESUDAH 171.
-- ============================================================

create or replace function retest_jatuh_tempo(
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  topik_id text,
  nama text,
  tanggal_retest_berikutnya date,
  mendesak boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select j.topik_id, t.nama, j.tanggal_retest_berikutnya,
         coalesce(s.perlu_verifikasi_ulang, false)
  from jadwal_retest j
  join topik t on t.id = j.topik_id
  -- `join`, bukan `left join`: topik tanpa baris cetakan tidak punya
  -- ketuntasan yang bisa dibuktikan ulang.
  join status_topik_siswa s
    on s.learner_id = j.learner_id and s.topik_id = j.topik_id
  where j.learner_id = practice_actor(coalesce(p_access_code, ''), p_learner_id)
    and s.status = 'tuntas'
    and (j.tanggal_retest_berikutnya <= current_date
         or s.perlu_verifikasi_ulang)
  order by s.perlu_verifikasi_ulang desc,
           j.tanggal_retest_berikutnya;
$$;

comment on function retest_jatuh_tempo(text, uuid) is
  'Topik yang sudah waktunya dibuktikan ulang oleh pemanggil (PRD FR11). Hanya topik yang MASIH berstatus tuntas. `mendesak` berarti verifikasi yang dipicu kegagalan prasyarat, yang mengabaikan jadwal.';

create or replace function retest_buka_sesi(
  p_topik_id text,
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

  -- Retest hanya untuk topik yang MASIH tuntas, punya jadwal, dan memang sudah
  -- waktunya: jatuh tempo, atau ditandai perlu diverifikasi ulang (yang
  -- mengabaikan jadwal — dokumen Bagian 5.1: verifikasi ini mendesak).
  if not exists (
    select 1 from jadwal_retest j
    join status_topik_siswa s
      on s.learner_id = j.learner_id and s.topik_id = j.topik_id
    where j.learner_id = v_learner
      and j.topik_id = p_topik_id
      and s.status = 'tuntas'
      and (j.tanggal_retest_berikutnya <= current_date
           or s.perlu_verifikasi_ulang)
  ) then
    return null;
  end if;

  -- Satu probe berjalan pada satu waktu.
  if exists (
    select 1 from practice_sessions s
    where s.learner_id = v_learner
      and s.probe_topik_id = p_topik_id
      and s.finished_at is null
  ) then
    return (
      select s.id from practice_sessions s
      where s.learner_id = v_learner
        and s.probe_topik_id = p_topik_id
        and s.finished_at is null
      order by s.started_at desc limit 1
    );
  end if;

  select id into v_subject from subjects where name = 'Matematika' limit 1;

  with kolam as (
    select ip.question_bank_item_id as item_id,
           (
             select max(s.started_at)
             from practice_answers a
             join practice_sessions s on s.id = a.session_id
             where a.learner_id = v_learner
               and s.probe_topik_id = p_topik_id
               and a.question_bank_item_id = ip.question_bank_item_id
           ) as terakhir_dilihat
    from item_probe ip
    join question_bank_items b on b.id = ip.question_bank_item_id
    where ip.topik_id = p_topik_id
      -- Hanya butir `aktif` yang sampai ke murid (FR1), sama seperti di
      -- seluruh jalur penyaji lain.
      and b.status_verifikasi = 'aktif'
  )
  select array_agg(item_id order by terakhir_dilihat nulls first, random())
    into v_items
  from (select * from kolam order by terakhir_dilihat nulls first, random() limit 5) pilih;

  -- Dokumen Bagian 3: 3-5 soal. Kolam yang belum berisi tiga butir aktif belum
  -- bisa memprobe apa pun, dan sesi berisi satu soal akan melahirkan angka
  -- lolos/gagal yang tidak berhak disebut pengukuran.
  if v_items is null or cardinality(v_items) < 3 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids, probe_topik_id)
  values
    (v_learner, v_subject, '{}'::uuid[], cardinality(v_items), v_items, p_topik_id)
  returning id into v_session;

  return v_session;
end;
$$;

comment on function retest_buka_sesi(text, text, uuid) is
  'Membuka sesi probe retest sebuah topik (PRD FR11), atau null kalau belum waktunya. Hanya topik yang MASIH berstatus tuntas.';

notify pgrst, 'reload schema';
