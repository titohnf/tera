-- ============================================================
-- Retest terjadwal: penguasaan yang dibuktikan ulang, bukan diasumsikan
--
-- FR11 dan dokumen Retest Terjadwal. Topik yang tuntas dijadwalkan diperiksa
-- lagi sesudah jeda; lolos melebarkan jedanya, gagal mengembalikan topiknya ke
-- `butuh_pengulangan` dan menandai topik lanjutan yang berdiri di atasnya.
--
-- KENAPA SEKARANG, padahal Bagian 3 PRD menuliskannya sebagai Non-Goal Tahap 0.
-- PRD bertentangan dengan dirinya sendiri di titik ini: Bagian 9 menandainya
-- "Aktif" dan FR11 menulis acceptance criteria lengkapnya, dan dokumen Retest
-- Terjadwal Bagian 8 menjelaskan alasannya — durasi pilot 2-3 minggu berpotensi
-- cukup untuk satu siklus retest D-01, dan itu kesempatan mengumpulkan data
-- retest nyata pertama untuk mengalibrasi angka-angka yang hari ini masih
-- default operasional. Konfliknya diselesaikan ke arah membangun.
--
-- ------------------------------------------------------------------
-- KENAPA STATUS TOPIK IKUT DIDEFINISIKAN ULANG DI SINI
--
-- Migrasi 163 menetapkan `tuntas` = Skor Putaran 1 seluruh paket latihan di
-- atas ambang, dan `status_topik_siswa` cuma cetakan dari perhitungan itu.
-- Kegagalan retest menuntut status berubah jadi `butuh_pengulangan` — dan
-- menuliskannya langsung ke tabel akan ditimpa `evaluasi_unlock` berikutnya,
-- karena Skor Putaran 1 tidak berubah (paket yang selesai tidak bisa dibuka
-- ulang, FR3). Dua kebenaran, dan yang menang adalah yang kebetulan menulis
-- terakhir.
--
-- Maka yang diubah definisinya, bukan cetakannya: sebuah topik yang retest
-- TERAKHIRNYA gagal adalah topik yang penguasaannya sudah terbukti tidak solid,
-- apa pun kata Skor Putaran 1 dari bulan lalu. Itu justru arti retest.
--
-- ------------------------------------------------------------------
-- KENAPA `item_probe` TABEL KEANGGOTAAN, BUKAN BANK SOAL KETIGA
--
-- Skema Data menamainya entitas tersendiri (rename dari `item_placement`).
-- Di sini ia keanggotaan di atas `question_bank_items`, sama seperti
-- `paket_topik_item` (145): satu bank soal, banyak peruntukan. Butir probe
-- tetap butir yang ditulis, diverifikasi, dan ditarik lewat alur FR1 yang sama
-- — dan sebuah bank kedua berarti alur verifikasi kedua yang harus diingat.
--
-- ROTASI, karena itu inti probe. Dokumen Bagian 3 meminta butir yang dipakai
-- berbeda dari yang pernah dilihat murid, supaya retest tidak mengukur ingatan
-- atas jawaban spesifik. Itulah kenapa probe TIDAK bisa jadi `paket_topik`
-- dengan keanggotaan tetap: yang tetap tidak pernah berotasi.
--
-- Jalankan SESUDAH 163.
-- ============================================================

-- 1. Kolam butir probe --------------------------------------------------------

create table if not exists item_probe (
  topik_id text not null references topik(id) on delete cascade,
  question_bank_item_id uuid not null references question_bank_items(id) on delete cascade,
  dibuat_pada timestamptz not null default now(),
  primary key (topik_id, question_bank_item_id)
);

comment on table item_probe is
  'Kolam butir probe per topik (PRD FR11, Retest Terjadwal Bagian 3). Dipakai retest DAN placement Tahap 1 — satu kolam, dua tujuan. Keanggotaan di atas question_bank_items, bukan bank soal terpisah.';

create index if not exists item_probe_butir_idx on item_probe(question_bank_item_id);

alter table item_probe enable row level security;

-- Tidak terbaca murid. Isinya identitas butir, dan daftar butir probe sebuah
-- topik adalah persis yang tidak boleh diketahui orang yang akan diprobe.
drop policy if exists "Admin mengelola kolam probe" on item_probe;
create policy "Admin mengelola kolam probe" on item_probe
  for all using (is_admin()) with check (is_admin());

-- Butir probe tidak boleh sekaligus jadi anggota paket topik: keduanya kolam
-- yang harus terpisah dengan alasan yang sama seperti pemisahan latihan–ujian
-- di 145. Probe yang butirnya baru saja dikerjakan di paket latihan mengukur
-- ingatan minggu lalu, bukan penguasaan yang bertahan.
create or replace function jaga_probe_bukan_anggota_paket()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from paket_topik_item i
    where i.question_bank_item_id = new.question_bank_item_id
  ) then
    raise exception
      'Butir % sudah jadi anggota paket topik, jadi ia tidak boleh masuk kolam probe.',
      new.question_bank_item_id;
  end if;
  return new;
end;
$$;

drop trigger if exists jaga_probe_bukan_anggota_paket on item_probe;
create trigger jaga_probe_bukan_anggota_paket
  before insert or update on item_probe
  for each row execute function jaga_probe_bukan_anggota_paket();

-- 2. Jadwalnya ----------------------------------------------------------------

create table if not exists jadwal_retest (
  learner_id uuid not null references learners(id) on delete cascade,
  topik_id text not null references topik(id) on delete cascade,
  tanggal_retest_berikutnya date not null,
  interval_saat_ini_hari int not null check (interval_saat_ini_hari > 0),
  -- Hasil retest TERAKHIR. Null berarti belum pernah diretest — bukan "gagal",
  -- dan pembedaan itu yang menjaga topik yang baru tuntas tidak langsung
  -- terbaca sebagai topik yang goyah.
  hasil_terakhir text check (hasil_terakhir in ('lolos', 'gagal')),
  waktu_retest_terakhir timestamptz,
  dibuat_pada timestamptz not null default now(),
  primary key (learner_id, topik_id)
);

comment on table jadwal_retest is
  'Jadwal pembuktian ulang penguasaan sebuah topik (PRD FR11). Satu baris per murid-topik, dibuat saat topik pertama kali tuntas.';
comment on column jadwal_retest.tanggal_retest_berikutnya is
  'Jatuh tempo. Keterlambatan TIDAK menambah beban apa pun — dokumen Retest Terjadwal Bagian 4.3 melarang penalti; yang tertunda cuma gilirannya.';

create index if not exists jadwal_retest_jatuh_tempo_idx
  on jadwal_retest(tanggal_retest_berikutnya);

alter table jadwal_retest enable row level security;

drop policy if exists "Murid membaca jadwal retestnya" on jadwal_retest;
create policy "Murid membaca jadwal retestnya" on jadwal_retest
  for select using (
    is_admin()
    or learner_id in (select id from learners where profile_id = auth.uid())
    or exists (
      select 1 from learners l
      where l.id = learner_id
        and l.profile_id is not null
        and family_covers_student(l.profile_id)
    )
    or exists (
      select 1 from learners l
      where l.id = learner_id and l.tutor_penanggung_jawab_id = auth.uid()
    )
  );

-- 3. Sesi probe ---------------------------------------------------------------
--
-- Probe menumpang `practice_sessions`, bukan tabel sesi sendiri: yang
-- membedakannya dari sesi lain cuma dari mana butirnya datang dan apa artinya
-- saat selesai, sementara seluruh sisanya — jawaban, waktu per butir, urutan
-- opsi yang diacak — persis sama. Kolom ini yang membedakannya, dan ia
-- nullable karena hampir semua sesi bukan probe.
alter table practice_sessions
  add column if not exists probe_topik_id text references topik(id) on delete set null;

comment on column practice_sessions.probe_topik_id is
  'Topik yang sedang diprobe (PRD FR11). Null untuk sesi biasa. Sesi probe tidak punya paket_topik_id dan tidak pernah masuk hitungan kemajuan paket.';

create index if not exists practice_sessions_probe_idx
  on practice_sessions(learner_id, probe_topik_id)
  where probe_topik_id is not null;

-- 4. Angka kebijakan ----------------------------------------------------------

create or replace function interval_awal_topik(p_topik_id text)
returns int
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select (p.nilai ->> case when t.penanda_remediasi = 'ekstra_wajib'
                               then 'ekstra_wajib' else 'biasa' end)::int
      from pengaturan p, topik t
      where p.kunci = 'retest_interval_awal_hari' and t.id = p_topik_id
    ),
    14
  );
$$;

comment on function interval_awal_topik(text) is
  'Interval retest pertama sebuah topik, hari (FR11): 7 untuk topik EKSTRA WAJIB, 14 untuk topik biasa. Angkanya dari `pengaturan`, bukan ditanam di kode.';

-- 5. Jadwal pertama, saat topik pertama kali tuntas ----------------------------
--
-- Trigger pada `status_topik_siswa`, bukan tambahan di dalam `evaluasi_unlock`:
-- yang melahirkan jadwal adalah PERUBAHAN status jadi `tuntas`, dan tabel
-- itulah satu-satunya tempat perubahan itu terlihat. Menaruhnya di dalam
-- `evaluasi_unlock` berarti mengulang perbandingan yang sudah dilakukan klausa
-- `on conflict` di sana.
--
-- `on conflict do nothing`: topik yang tuntas, gagal retest, lalu tuntas lagi
-- tidak memulai jadwal dari awal — jadwalnya sudah ada dan sudah dikelola
-- `catat_hasil_retest`.
create or replace function jadwalkan_retest_saat_tuntas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'tuntas' then return new; end if;

  insert into jadwal_retest
    (learner_id, topik_id, tanggal_retest_berikutnya, interval_saat_ini_hari)
  values
    (new.learner_id, new.topik_id,
     current_date + interval_awal_topik(new.topik_id),
     interval_awal_topik(new.topik_id))
  on conflict (learner_id, topik_id) do nothing;

  return new;
end;
$$;

drop trigger if exists jadwalkan_retest_saat_tuntas on status_topik_siswa;
create trigger jadwalkan_retest_saat_tuntas
  after insert or update of status on status_topik_siswa
  for each row execute function jadwalkan_retest_saat_tuntas();

-- 6. Membuka sesi probe -------------------------------------------------------
--
-- ROTASI: butir yang pernah dilihat murid ini di probe sebelumnya dikecualikan
-- lebih dulu. Kalau kolamnya habis — dan pada kolam kecil itu akan terjadi —
-- kekecualiannya dilepas alih-alih mengembalikan sesi kosong. Probe yang
-- butirnya berulang masih jauh lebih berguna daripada retest yang tidak pernah
-- bisa dikerjakan, dan urutan `order by` di bawah tetap mendahulukan yang
-- paling lama tidak dipakai.
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

  -- Retest hanya untuk topik yang punya jadwal, dan hanya kalau memang sudah
  -- waktunya: jatuh tempo, atau topiknya ditandai perlu diverifikasi ulang
  -- (yang mengabaikan jadwal — dokumen Bagian 5.1: verifikasi ini mendesak).
  if not exists (
    select 1 from jadwal_retest j
    left join status_topik_siswa s
      on s.learner_id = j.learner_id and s.topik_id = j.topik_id
    where j.learner_id = v_learner
      and j.topik_id = p_topik_id
      and (j.tanggal_retest_berikutnya <= current_date
           or coalesce(s.perlu_verifikasi_ulang, false))
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
  'Membuka satu sesi probe retest, 3-5 butir berotasi (PRD FR11, Retest Terjadwal Bagian 3). Null berarti belum waktunya, kolamnya belum cukup, atau bukan miliknya.';

-- 7. Mencatat hasilnya --------------------------------------------------------
--
-- Lolos: interval melebar (x faktor, dibatasi maksimum), penanda verifikasi
-- ulang dilepas — dokumen Bagian 5.1 menghitung probe verifikasi sebagai satu
-- siklus retest yang sah, bukan pengecualian.
--
-- Gagal: interval RESET PENUH ke interval awal, bukan dikurangi separuh
-- (Bagian 2.2 — kegagalan berarti penguasaan terbukti tidak solid, jadi siklus
-- pembuktiannya diulang penuh), dan setiap topik lanjutan yang menjadikan topik
-- ini prasyarat langsung DAN sedang berstatus `tuntas` ditandai perlu
-- diverifikasi ulang.
--
-- Penjalarannya SELANGKAH, bukan transitif: topik yang ditandai baru menular
-- lebih jauh kalau verifikasinya sendiri benar-benar gagal. Fondasi yang goyah
-- tidak otomatis berarti seluruh bangunan di atasnya roboh (Bagian 5.1).
create or replace function catat_hasil_retest(
  p_learner_id uuid,
  p_topik_id text,
  p_lolos boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_faktor numeric;
  v_maks int;
  v_interval int;
begin
  select coalesce((nilai #>> '{}')::numeric, 2) into v_faktor
  from pengaturan where kunci = 'retest_faktor_pelebaran';
  select coalesce((nilai #>> '{}')::int, 90) into v_maks
  from pengaturan where kunci = 'retest_interval_maksimum_hari';

  if p_lolos then
    select least(round(interval_saat_ini_hari * coalesce(v_faktor, 2))::int,
                 coalesce(v_maks, 90))
      into v_interval
    from jadwal_retest
    where learner_id = p_learner_id and topik_id = p_topik_id;
  else
    v_interval := interval_awal_topik(p_topik_id);
  end if;

  update jadwal_retest
     set interval_saat_ini_hari = v_interval,
         tanggal_retest_berikutnya = current_date + v_interval,
         hasil_terakhir = case when p_lolos then 'lolos' else 'gagal' end,
         waktu_retest_terakhir = now()
   where learner_id = p_learner_id and topik_id = p_topik_id;

  if p_lolos then
    update status_topik_siswa
       set perlu_verifikasi_ulang = false
     where learner_id = p_learner_id and topik_id = p_topik_id;
  else
    update status_topik_siswa
       set perlu_verifikasi_ulang = true
     where learner_id = p_learner_id
       and status = 'tuntas'
       and topik_id in (
         select pr.topik_id from topik_prasyarat pr
         where pr.prasyarat_id = p_topik_id
       );
  end if;

  -- Statusnya sendiri dihitung ulang, bukan ditulis tangan: `hasil_terakhir`
  -- yang barusan disimpan adalah salah satu masukan `status_topik_murid`, jadi
  -- satu panggilan ini sudah menurunkan topiknya ke `butuh_pengulangan`.
  perform evaluasi_unlock(p_learner_id);
end;
$$;

comment on function catat_hasil_retest(uuid, text, boolean) is
  'Menerapkan hasil sebuah retest: interval berikutnya, penanda verifikasi ulang topik lanjutan, dan status topiknya (PRD FR11, Retest Terjadwal Bagian 2.2 & 5.1).';

-- 8. Menghubungkannya ke sesi yang selesai ------------------------------------
--
-- Ambangnya SATU untuk seluruh sistem (`ambang_mastery`), bukan ambang khusus
-- retest — dokumen Bagian 3 menegaskannya: "konsisten satu ambang di seluruh
-- sistem".
create or replace function retest_sesudah_sesi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_skor numeric;
  v_maks numeric;
  v_ambang numeric;
begin
  if new.probe_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select coalesce(sum(a.score), 0), coalesce(sum(a.max_score), 0)
    into v_skor, v_maks
  from practice_answers a where a.session_id = new.id;

  if coalesce(v_maks, 0) <= 0 then return new; end if;

  select coalesce((nilai #>> '{}')::numeric, 0.75) into v_ambang
  from pengaturan where kunci = 'ambang_mastery';

  perform catat_hasil_retest(
    new.learner_id, new.probe_topik_id,
    (v_skor / v_maks) >= coalesce(v_ambang, 0.75)
  );
  return new;
end;
$$;

-- Namanya dimulai 'z' supaya ia jalan PALING AKHIR di antara trigger
-- `after update of finished_at` pada tabel ini: `catat_hasil_retest` memanggil
-- `evaluasi_unlock`, dan hasilnya cuma benar kalau eskalasi dan status sudah
-- selesai dihitung lebih dulu.
drop trigger if exists z_retest_sesudah_sesi on practice_sessions;
create trigger z_retest_sesudah_sesi
  after update of finished_at on practice_sessions
  for each row execute function retest_sesudah_sesi();

-- 9. Definisi status yang tahu soal retest ------------------------------------
--
-- Menggantikan versi migrasi 163. Yang bertambah satu suku: retest terakhir
-- yang gagal mengalahkan `tuntas` yang dihitung dari Skor Putaran 1. Alasannya
-- ditulis di kepala berkas ini.
create or replace function status_topik_murid(p_learner_id uuid)
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
    select p.topik_id, p.id as paket_id, s.skor_putaran_1, s.skor_akhir
    from paket_topik p
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    where p.jenis = 'latihan'
  ),
  agregat as (
    select pk.topik_id,
           count(*) as paket_total,
           count(skor_putaran_1) as paket_dikerjakan,
           count(*) filter (
             where skor_putaran_1 >= (select nilai from ambang)
           ) as paket_lolos_putaran_1,
           count(*) filter (
             where skor_akhir is not null
               and skor_akhir < (select nilai from ambang)
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
      and a.paket_lolos_putaran_1 = a.paket_total
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
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13, diperluas FR11). Definisi TUNGGAL; `status_topik_siswa` cetakannya. `tuntas` memakai Skor Putaran 1, dan dibatalkan oleh retest terakhir yang gagal.';

-- 10. Apa yang jatuh tempo ----------------------------------------------------

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
  left join status_topik_siswa s
    on s.learner_id = j.learner_id and s.topik_id = j.topik_id
  where j.learner_id = practice_actor(coalesce(p_access_code, ''), p_learner_id)
    and (j.tanggal_retest_berikutnya <= current_date
         or coalesce(s.perlu_verifikasi_ulang, false))
  -- Yang mendesak lebih dulu: verifikasi yang dipicu kegagalan prasyarat
  -- mengabaikan jadwal normal (Bagian 5.1).
  order by coalesce(s.perlu_verifikasi_ulang, false) desc,
           j.tanggal_retest_berikutnya;
$$;

comment on function retest_jatuh_tempo(text, uuid) is
  'Topik yang sudah waktunya dibuktikan ulang oleh pemanggil (PRD FR11). `mendesak` berarti verifikasi yang dipicu kegagalan prasyarat, yang mengabaikan jadwal.';

-- 11. Hak ---------------------------------------------------------------------

revoke all on function jaga_probe_bukan_anggota_paket() from public;
revoke all on function jadwalkan_retest_saat_tuntas() from public;
revoke all on function retest_sesudah_sesi() from public;
revoke all on function catat_hasil_retest(uuid, text, boolean) from public, anon, authenticated;
revoke all on function status_topik_murid(uuid) from public, anon, authenticated;

grant execute on function retest_buka_sesi(text, text, uuid) to anon, authenticated;
grant execute on function retest_jatuh_tempo(text, uuid) to anon, authenticated;
grant execute on function interval_awal_topik(text) to authenticated;

notify pgrst, 'reload schema';
