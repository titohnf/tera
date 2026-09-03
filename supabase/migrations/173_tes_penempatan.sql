-- ============================================================
-- Tes penempatan per topik (Dokumen Fondasi Bagian 3.1)
--
-- Bagian 2.6 menandainya "Diadopsi penuh", Bagian 7 menaruhnya di Tahap 1
-- (MVP) sebaris dengan skor Putaran 1 dan paket ujian — jadi ia bukan fitur
-- lanjutan yang tertunda, melainkan bagian fondasi yang belum pernah dibangun.
-- Sampai hari ini ia hanya muncul di kode sebagai PENGANDAIAN: "Tanpa placement
-- test, satu-satunya yang sistem tahu adalah apa yang sudah ia ukur sendiri."
--
-- APA YANG DIMINTA DOKUMENNYA, persis: "Tes penempatan singkat (5–10 soal
-- campuran level) dijalankan untuk menghindari siswa yang sudah kompeten
-- dipaksa mengerjakan C1–C2 yang sudah pasti dikuasai."
--
-- Tiga hal ikut ditentukan kalimat itu, dan ketiganya dipatuhi di sini:
--
--   1. PER TOPIK, bukan sekali di awal untuk seluruh peta. Ia jalan "sebelum
--      siswa memulai 6 paket Bloom pada suatu topik".
--   2. TUGASNYA MEMBEBASKAN, bukan menilai. Yang dihindari adalah pekerjaan
--      yang sia-sia, bukan akses yang belum pantas.
--   3. C1–C2 SAJA. Itu batas yang dokumennya tuliskan sendiri, dan ia tidak
--      dilonggarkan di sini. Delapan soal adalah bukti yang tipis; membiarkan
--      bukti setipis itu membebaskan setengah topik berarti mengklaim lebih
--      dari yang diukur. `LEVEL_MAKSIMAL_DIBEBASKAN` di bawah menegakkannya.
--
-- PRASYARAT TETAP MEMBERI TAHU, BUKAN MEMBLOKIR. Placement hanya MENGURANGI
-- pekerjaan; tidak ada pintu yang ditutup olehnya. Premis yang tertulis di
-- empat tempat lain di kode tetap berlaku apa adanya.
--
-- YANG DOKUMENNYA TIDAK JAWAB, dan diputuskan di sini: paket yang dilewati
-- tidak punya Skor Putaran 1, padahal `tuntas` menuntut SELURUH paket latihan
-- lolos di putaran pertama. Keputusannya: paket yang dibebaskan DIHITUNG LOLOS.
-- Skor placement adalah bukti mandiri yang bahkan lebih bersih daripada Putaran
-- 1 — tidak ada retry sama sekali di dalamnya. Alternatifnya, menuntut paket
-- yang sudah terbukti dikuasai tetap dikerjakan sebelum topiknya boleh tuntas,
-- akan membatalkan seluruh guna placement itu sendiri.
--
-- TAPI BUKTI YANG DIUKUR MENGALAHKAN BUKTI YANG DIDUGA. Kalau anak toh
-- mengerjakan paket yang sudah dibebaskan, skor sungguhannya yang berlaku —
-- pembebasan hanya berlaku selama paketnya belum disentuh. Lihat `dibebaskan`
-- di `status_topik_murid`.
--
-- Jalankan SESUDAH 172.
-- ============================================================

-- 1. Kolam butirnya ------------------------------------------------------------
--
-- Kolam tersendiri, bukan meminjam butir latihan. Butir penempatan dipakai
-- SEBELUM anak berlatih, dan butir yang sama muncul lagi di paket C1 beberapa
-- menit kemudian akan mengubah paket itu jadi ujian ingatan jangka pendek.
alter table question_bank_items
  drop constraint if exists question_bank_items_peruntukan_check;
alter table question_bank_items
  add constraint question_bank_items_peruntukan_check
  check (peruntukan is null or peruntukan in ('latihan', 'ujian', 'probe', 'penempatan'));

comment on column question_bank_items.peruntukan is
  'Kolam tempat butir ini ditulis: latihan, ujian, probe, atau penempatan (Dokumen Fondasi Bagian 3.1). NULL = di luar cakupan pilot.';

-- 2. Sesinya -------------------------------------------------------------------
alter table practice_sessions
  add column if not exists penempatan_topik_id text references topik(id) on delete set null;

comment on column practice_sessions.penempatan_topik_id is
  'Sesi ini tes penempatan untuk topik tersebut (Dokumen Fondasi Bagian 3.1). Sejajar dengan `probe_topik_id`: keduanya sesi yang bukan paket.';

-- 3. Hasilnya ------------------------------------------------------------------
create table if not exists penempatan_topik (
  learner_id uuid not null references learners(id) on delete cascade,
  topik_id text not null references topik(id) on delete cascade,
  -- 0 berarti tidak ada level yang dibebaskan — tes sudah dikerjakan, hasilnya
  -- tidak membebaskan apa pun. Dibedakan dari "belum pernah tes" (tidak ada
  -- barisnya sama sekali), karena keduanya menuntut tawaran layar yang berbeda.
  level_tertinggi_lolos smallint not null default 0
    check (level_tertinggi_lolos between 0 and 6),
  skor numeric not null,
  jumlah_soal integer not null,
  waktu timestamptz not null default now(),
  primary key (learner_id, topik_id)
);

comment on table penempatan_topik is
  'Hasil tes penempatan seorang murid pada sebuah topik (Dokumen Fondasi Bagian 3.1). Satu baris per murid per topik; tesnya sekali saja.';

alter table penempatan_topik enable row level security;

drop policy if exists "Murid membaca hasil penempatannya" on penempatan_topik;
create policy "Murid membaca hasil penempatannya" on penempatan_topik
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

-- Ditulis HANYA oleh triggernya, yang `security definer`. Tidak ada policy
-- tulis untuk siapa pun: hasil penempatan yang bisa ditulis pemanggil adalah
-- hasil yang bisa dikarang, dan yang dipertaruhkan adalah paket yang boleh
-- dilewati anak.

-- 4. Membuka sesinya -----------------------------------------------------------
create or replace function penempatan_buka_sesi(
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

  -- SEKALI SAJA. Tes penempatan yang boleh diulang berhenti menjadi penempatan
  -- dan berubah jadi jalan pintas: ulangi sampai kebetulan lolos, lalu lewati
  -- paketnya. Yang ingin diukur di sini kemampuan yang SUDAH ada sebelum
  -- topiknya dimulai, dan itu keadaan yang hanya terjadi satu kali.
  if exists (
    select 1 from penempatan_topik pt
    where pt.learner_id = v_learner and pt.topik_id = p_topik_id
  ) then
    return null;
  end if;

  -- Sesi yang belum selesai dilanjutkan, bukan dilahirkan kembar.
  if exists (
    select 1 from practice_sessions s
    where s.learner_id = v_learner
      and s.penempatan_topik_id = p_topik_id
      and s.finished_at is null
  ) then
    return (
      select s.id from practice_sessions s
      where s.learner_id = v_learner
        and s.penempatan_topik_id = p_topik_id
        and s.finished_at is null
      order by s.started_at desc limit 1
    );
  end if;

  -- SUDAH TERLANJUR MENGERJAKAN berarti tidak ada lagi yang bisa dibebaskan.
  -- Menawarkan penempatan kepada anak yang sudah menggarap paketnya adalah
  -- menawarkan jalan memutar yang ujungnya sama.
  if exists (
    select 1
    from practice_sessions s
    join paket_topik p on p.id = s.paket_topik_id
    where s.learner_id = v_learner and p.topik_id = p_topik_id
  ) then
    return null;
  end if;

  select id into v_subject from subjects where name = 'Matematika' limit 1;

  -- Empat butir C1 dan empat butir C2: delapan soal, di dalam rentang 5–10 yang
  -- diminta dokumennya, dan cukup untuk membuat "semuanya benar" bukan
  -- kebetulan. Diacak per murid, bukan tetap.
  select array_agg(id order by random())
    into v_items
  from (
    (select b.id from question_bank_items b
      where b.topik_id = p_topik_id and b.peruntukan = 'penempatan'
        and b.bloom_level = 1 and b.status_verifikasi = 'aktif'
      order by random() limit 4)
    union all
    (select b.id from question_bank_items b
      where b.topik_id = p_topik_id and b.peruntukan = 'penempatan'
        and b.bloom_level = 2 and b.status_verifikasi = 'aktif'
      order by random() limit 4)
  ) pilih;

  -- Kolam yang belum lengkap tidak bisa menempatkan siapa pun: lolosnya satu
  -- level dinilai dari SELURUH butir level itu, dan "seluruh" dari dua butir
  -- adalah klaim yang terlalu murah.
  if v_items is null or cardinality(v_items) < 8 then return null; end if;

  insert into practice_sessions
    (learner_id, subject_id, group_ids, question_count, item_ids, penempatan_topik_id)
  values
    (v_learner, v_subject, '{}'::uuid[], cardinality(v_items), v_items, p_topik_id)
  returning id into v_session;

  return v_session;
end;
$$;

comment on function penempatan_buka_sesi(text, text, uuid) is
  'Membuka sesi tes penempatan sebuah topik (Dokumen Fondasi Bagian 3.1), atau null kalau sudah pernah dites, sudah terlanjur mengerjakan paketnya, atau kolamnya belum lengkap.';

-- 5. Menghitung hasilnya sesudah sesi selesai ----------------------------------
create or replace function penempatan_sesudah_sesi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_level smallint;
  v_lolos smallint := 0;
  v_skor numeric;
  v_maks numeric;
  v_salah integer;
begin
  if new.penempatan_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select coalesce(sum(a.score), 0), coalesce(sum(a.max_score), 0)
    into v_skor, v_maks
  from practice_answers a where a.session_id = new.id;

  if coalesce(v_maks, 0) <= 0 then return new; end if;

  -- SEMUA BENAR, bukan ambang 75%. Dengan empat butir per level, 75% berarti
  -- "boleh salah satu" — dan satu kesalahan di C1 adalah justru tanda bahwa
  -- levelnya belum boleh dilewati. Dokumennya membebaskan yang "sudah PASTI
  -- dikuasai"; kepastian itu yang diukur di sini.
  --
  -- Berhenti pada level pertama yang meleset: melewati C2 sementara C1 goyah
  -- akan meninggalkan lubang yang justru paling mahal di kemudian hari.
  for v_level in 1..2 loop
    select count(*)
      into v_salah
    from practice_answers a
    join question_bank_items b on b.id = a.question_bank_item_id
    where a.session_id = new.id
      and b.bloom_level = v_level
      and not a.is_correct;
    exit when v_salah > 0;
    v_lolos := v_level;
  end loop;

  insert into penempatan_topik (learner_id, topik_id, level_tertinggi_lolos, skor, jumlah_soal)
  values (new.learner_id, new.penempatan_topik_id, v_lolos, v_skor / v_maks, new.question_count)
  on conflict (learner_id, topik_id) do nothing;

  -- Status topiknya ikut disegarkan: paket yang barusan dibebaskan mengubah
  -- hitungan `tuntas` seketika, dan cetakan yang tertinggal satu sesi akan
  -- menampilkan peta yang tidak cocok dengan apa yang baru saja terjadi.
  perform evaluasi_unlock(new.learner_id);
  return new;
end;
$$;

-- Namanya 'z' dengan alasan yang sama seperti `z_retest_sesudah_sesi`: ia
-- memanggil `evaluasi_unlock`, jadi harus jalan sesudah trigger lain selesai.
drop trigger if exists z_penempatan_sesudah_sesi on practice_sessions;
create trigger z_penempatan_sesudah_sesi
  after update of finished_at on practice_sessions
  for each row execute function penempatan_sesudah_sesi();

-- 6. Status topik yang tahu soal penempatan ------------------------------------
--
-- Menggantikan versi migrasi 164. Yang bertambah satu suku: paket yang
-- DIBEBASKAN placement dihitung lolos putaran pertama.
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
    select p.topik_id, p.id as paket_id, s.skor_putaran_1, s.skor_akhir,
           -- Dibebaskan tes penempatan: levelnya tidak melebihi yang lolos, DAN
           -- paketnya belum disentuh. Bukti yang diukur mengalahkan bukti yang
           -- diduga — anak yang tetap mengerjakan paket bebasnya dinilai dari
           -- pekerjaannya sendiri, bukan dari tes delapan soal.
           (s.skor_putaran_1 is null
            and p.level_bloom is not null
            and p.level_bloom <= coalesce(pt.level_tertinggi_lolos, 0)) as dibebaskan
    from paket_topik p
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    left join penempatan_topik pt
      on pt.learner_id = p_learner_id and pt.topik_id = p.topik_id
    where p.jenis = 'latihan'
  ),
  agregat as (
    select pk.topik_id,
           count(*) as paket_total,
           count(*) filter (
             where skor_putaran_1 is not null or dibebaskan
           ) as paket_dikerjakan,
           count(*) filter (
             where skor_putaran_1 >= (select nilai from ambang) or dibebaskan
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
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13, diperluas FR11 dan Dokumen Fondasi 3.1). Definisi TUNGGAL; `status_topik_siswa` cetakannya. `tuntas` memakai Skor Putaran 1, dibatalkan retest terakhir yang gagal, dan menghitung paket yang dibebaskan tes penempatan sebagai lolos.';

-- 7. Hak -----------------------------------------------------------------------
revoke all on function penempatan_sesudah_sesi() from public;
revoke all on function status_topik_murid(uuid) from public, anon, authenticated;
grant execute on function penempatan_buka_sesi(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
