-- ============================================================
-- Beban belajar harian: sistem yang menyarankan berhenti, dan tidak pernah
-- memaksa
--
-- FR10 dan dokumen Manajemen Beban Belajar Bagian 2. Data mentahnya sudah
-- lengkap sejak migrasi 152 — kapan tiap butir mulai terlihat, berapa lama
-- halamannya sempat tidak terlihat, kapan dijawab. Yang belum ada adalah CARA
-- MEMBACANYA untuk menjawab satu pertanyaan: kapan sebaiknya berhenti.
--
-- TIDAK PERNAH MEMBLOKIR. Itu bukan kelonggaran melainkan syarat (dokumen
-- fondasi Bagian 3.2), dan bentuknya di skema ini: tidak ada satu pun fungsi di
-- berkas ini yang bisa menolak membuka sesi. Yang paling jauh bisa dilakukannya
-- adalah mengembalikan sebuah kalimat.
--
-- DUA KATEGORI YANG SENGAJA TIDAK SETARA:
--
--   * RINGAN — "sudah 12 menit, mau lanjut atau istirahat?" Berpangkal pada
--     rentang atensi anak SMP (10-12 menit), boleh muncul berkali-kali sehari,
--     dan TIDAK dihitung terhadap batas. Ia pengingat ritme, bukan pembatasan;
--     menghitungnya terhadap batas akan menghabiskan jatah nudge hari itu untuk
--     hal yang tidak pernah dimaksudkan membatasi. Dihitung di browser, tempat
--     satu-satunya jam yang tahu berapa lama layarnya benar-benar terbuka.
--
--   * FORMAL — kuantitas dan kelelahan kognitif. MAKSIMUM DUA PER HARI, lalu
--     berhenti sama sekali untuk sisa hari itu. Bukan berulang dengan kalimat
--     yang sama, dan bukan pula meningkat jadi lebih memaksa (Bagian 2.2 poin
--     4): sistem yang terus menegur sesudah dua kali ditolak sudah bukan
--     menyarankan, ia mendesak.
--
-- KENAPA `nudge_log` ADA. Batas "dua per hari" mustahil ditegakkan tanpa
-- mengingat apa yang sudah ditampilkan, dan mengingatnya di browser berarti
-- batas itu hilang setiap kali anak berpindah perangkat atau membuka jendela
-- penyamaran. Tabelnya kecil dan berumur satu hari; ia bukan profil anak.
--
-- EMPAT SINYAL FORMAL, dua di antaranya ambangnya BELUM TERVALIDASI RISET
-- (jumlah paket ≥4, total waktu ≥60 menit) dan dokumen itu sendiri menandainya
-- begitu. Keduanya tetap dipasang sebagai default operasional, dan ditaruh di
-- `pengaturan` supaya kalibrasi ulangnya tidak menuntut deploy.
--
-- Yang TIDAK dibangun: interleaving lintas topik (Bagian 3). FR10 menaruhnya di
-- luar Tahap 0 dengan alasan yang masih berlaku — satu topik aktif berarti
-- tidak ada topik lain untuk diselingi.
--
-- Jalankan SESUDAH 152.
-- ============================================================

-- 1. Angka yang boleh dikalibrasi ---------------------------------------------

insert into pengaturan (kunci, nilai, keterangan) values
  (
    'beban_paket_per_hari',
    '4'::jsonb,
    'Jumlah paket dalam sehari yang memicu nudge formal (FR10). BELUM DIVALIDASI RISET — default operasional, wajib dikalibrasi dari data pemakaian nyata (Manajemen Beban Belajar Bagian 7).'
  ),
  (
    'beban_menit_per_hari',
    '60'::jsonb,
    'Total waktu aktif sehari, menit, yang memicu nudge formal (FR10). BELUM DIVALIDASI RISET — sama seperti di atas.'
  ),
  (
    'beban_menit_tanpa_jeda',
    '12'::jsonb,
    'Durasi kerja tanpa jeda, menit, yang memicu nudge RINGAN (FR10). Berpangkal pada rentang atensi siswa SMP 10-12 menit — satu-satunya ambang di FR10 yang punya rujukan riset langsung.'
  )
on conflict (kunci) do nothing;

-- 2. Apa yang sudah ditampilkan hari ini --------------------------------------

create table if not exists nudge_log (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  -- Tanggal WIB, bukan `now()::date` yang mengikuti zona server: "hari ini"
  -- bagi anak yang mengerjakan soal jam sebelas malam harus hari yang sama
  -- dengan yang ia rasakan, bukan hari berikutnya menurut UTC.
  tanggal date not null default (now() at time zone 'Asia/Jakarta')::date,
  kategori text not null check (kategori in ('ringan', 'formal')),
  sinyal text not null check (sinyal in (
    'tanpa_jeda', 'paket_per_hari', 'menit_per_hari',
    'performa_menurun', 'menyerah_meningkat'
  )),
  waktu timestamptz not null default now()
);

comment on table nudge_log is
  'Nudge beban belajar yang sudah ditampilkan (PRD FR10). Ada semata untuk menegakkan batas dua nudge formal per hari — bukan profil anak, dan tidak dibaca oleh apa pun selain penegak batas itu.';

create index if not exists nudge_log_harian_idx
  on nudge_log(learner_id, tanggal, kategori);

alter table nudge_log enable row level security;

-- Tidak terbaca siapa pun dari browser. Yang menulis dan membacanya cuma fungsi
-- `security definer` di bawah, dan tidak ada layar yang perlu menampilkan
-- riwayat teguran seorang anak kepada siapa pun.
drop policy if exists "Admin membaca nudge" on nudge_log;
create policy "Admin membaca nudge" on nudge_log
  for select using (is_admin());

-- 3. Membaca sinyalnya --------------------------------------------------------
--
-- Satu fungsi, empat sinyal, dan urutan pemeriksaannya adalah urutan seberapa
-- langsung sinyal itu berbicara tentang KEADAAN ANAKNYA — bukan tentang
-- hitungan. Kelelahan yang terbaca dari jawabannya sendiri didahulukan atas
-- "sudah empat paket": yang pertama tentang anak yang ada sekarang, yang kedua
-- tentang angka yang kebetulan tercapai.
create or replace function beban_belajar(
  p_sesi_id uuid,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns table (
  sinyal text,
  pesan text,
  nudge_ke int
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_hari date := (now() at time zone 'Asia/Jakarta')::date;
  v_formal int;
  v_sinyal text;
  v_paket int;
  v_menit numeric;
  v_akurasi_akhir numeric;
  v_akurasi_awal numeric;
  v_waktu_akhir numeric;
  v_waktu_awal numeric;
  v_menyerah_akhir numeric;
  v_menyerah_paket numeric;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return; end if;

  -- Batas dua per hari, diperiksa DULU. Tidak ada gunanya menghitung empat
  -- sinyal untuk keadaan yang sudah pasti tidak menghasilkan apa-apa.
  select count(*) into v_formal
  from nudge_log
  where learner_id = v_learner and tanggal = v_hari and kategori = 'formal';

  if v_formal >= 2 then return; end if;

  -- Sinyal 1: performa menurun DALAM PAKET INI. Dua syarat sekaligus, bukan
  -- salah satu — anak yang memang lambat tapi stabil bukan anak yang lelah,
  -- dan versi sebelumnya dokumen ini memakai ATAU lalu ditegur karena itu.
  with jawaban as (
    select a.score, a.max_score,
           extract(epoch from (a.answered_at - a.waktu_mulai_item))
             - coalesce(a.jeda_ms, 0) / 1000.0 as detik,
           row_number() over (order by a.answered_at desc) as urut
    from practice_answers a
    where a.session_id = p_sesi_id
      and a.waktu_mulai_item is not null
      and a.answered_at is not null
  )
  select avg(case when urut <= 5 then score / nullif(max_score, 0) end),
         avg(case when urut between 6 and 10 then score / nullif(max_score, 0) end),
         avg(case when urut <= 5 then detik end),
         avg(case when urut between 6 and 10 then detik end)
    into v_akurasi_akhir, v_akurasi_awal, v_waktu_akhir, v_waktu_awal
  from jawaban where urut <= 10;

  if v_akurasi_awal is not null and v_akurasi_akhir is not null
     and v_waktu_awal is not null and v_waktu_akhir is not null
     and v_waktu_awal > 0
     and (v_akurasi_awal - v_akurasi_akhir) >= 0.20
     and v_waktu_akhir >= v_waktu_awal * 1.5
  then
    v_sinyal := 'performa_menurun';
  end if;

  -- Sinyal 2: menyerah meningkat. Proporsi lima butir terakhir dibanding
  -- seluruh sesi ini; naik dua kali lipat berarti anak berhenti mencoba.
  if v_sinyal is null then
    with jawaban as (
      select a.score, a.max_score,
             row_number() over (order by a.answered_at desc) as urut
      from practice_answers a
      where a.session_id = p_sesi_id and a.answered_at is not null
    )
    select avg(case when urut <= 5
                    then case when coalesce(score, 0) <= 0 then 1.0 else 0.0 end end),
           avg(case when coalesce(score, 0) <= 0 then 1.0 else 0.0 end)
      into v_menyerah_akhir, v_menyerah_paket
    from jawaban;

    if v_menyerah_paket is not null and v_menyerah_paket > 0
       and v_menyerah_akhir >= v_menyerah_paket * 2
    then
      v_sinyal := 'menyerah_meningkat';
    end if;
  end if;

  -- Sinyal 3: jumlah paket hari ini.
  if v_sinyal is null then
    select count(*) into v_paket
    from practice_sessions s
    where s.learner_id = v_learner
      and (s.started_at at time zone 'Asia/Jakarta')::date = v_hari;

    if v_paket >= coalesce(
         (select (nilai #>> '{}')::int from pengaturan where kunci = 'beban_paket_per_hari'),
         4)
    then
      v_sinyal := 'paket_per_hari';
    end if;
  end if;

  -- Sinyal 4: total waktu AKTIF hari ini — jeda tiap butir sudah dipotong,
  -- jadi anak yang meninggalkan tabnya menyala tidak dihitung sedang belajar.
  if v_sinyal is null then
    select coalesce(sum(
             greatest(0,
               extract(epoch from (a.answered_at - a.waktu_mulai_item))
                 - coalesce(a.jeda_ms, 0) / 1000.0)
           ), 0) / 60.0
      into v_menit
    from practice_answers a
    join practice_sessions s on s.id = a.session_id
    where s.learner_id = v_learner
      and a.waktu_mulai_item is not null
      and a.answered_at is not null
      and (a.answered_at at time zone 'Asia/Jakarta')::date = v_hari;

    if v_menit >= coalesce(
         (select (nilai #>> '{}')::numeric from pengaturan where kunci = 'beban_menit_per_hari'),
         60)
    then
      v_sinyal := 'menit_per_hari';
    end if;
  end if;

  if v_sinyal is null then return; end if;

  -- Kalimatnya menjelaskan KENAPA, bukan cuma menyuruh berhenti (Bagian 2.2):
  -- anak yang paham alasan sebuah jeda lebih mungkin menerimanya sukarela
  -- daripada anak yang cuma diperintah. Yang kedua sedikit lebih tegas, dan
  -- berhenti di situ.
  return query select
    v_sinyal,
    case when v_formal = 0
      then 'Kamu udah kerja keras hari ini! Otak butuh istirahat biar yang udah dipelajari nempel beneran — lanjut besok yuk?'
      else 'Masih semangat ya! Tapi biasanya belajar lebih nempel kalau nggak dipaksain terus dalam sehari. Yakin mau lanjut?'
    end,
    v_formal + 1;
end;
$$;

comment on function beban_belajar(uuid, text, uuid) is
  'Nudge beban belajar yang pantas ditampilkan sesudah sebuah sesi, atau tidak ada baris sama sekali (PRD FR10). Tidak pernah memblokir apa pun — yang paling jauh bisa dilakukannya adalah mengembalikan sebuah kalimat.';

-- 4. Mencatat bahwa ia sudah ditampilkan --------------------------------------
--
-- Terpisah dari pembacanya, dan itu disengaja: `beban_belajar` `stable` supaya
-- boleh dipanggil dari komponen server mana pun tanpa efek samping, dan sebuah
-- nudge yang tercatat karena halamannya kebetulan dirender ulang akan
-- menghabiskan jatah dua-per-hari tanpa satu pun kalimat sampai ke anaknya.
create or replace function catat_nudge(
  p_kategori text,
  p_sinyal text,
  p_access_code text default '',
  p_learner_id uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
begin
  v_learner := practice_actor(coalesce(p_access_code, ''), p_learner_id);
  if v_learner is null then return; end if;

  insert into nudge_log (learner_id, kategori, sinyal)
  values (v_learner, p_kategori, p_sinyal);
end;
$$;

comment on function catat_nudge(text, text, text, uuid) is
  'Mencatat satu nudge yang benar-benar sampai ke layar anak (PRD FR10). Dipanggil terpisah dari pembacanya supaya render ulang tidak menghabiskan jatah dua-per-hari.';

grant execute on function beban_belajar(uuid, text, uuid) to anon, authenticated;
grant execute on function catat_nudge(text, text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
