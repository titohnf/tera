-- ============================================================
-- Putaran pertama yang bisa dibaca, dan eskalasi yang punya alamat
--
-- Migrasi 145–147 membuat paket pengukuran bisa dikerjakan; 148 memastikan
-- butirnya tidak bocor ke latihan bebas. Yang belum ada adalah hal yang
-- membuat semua itu jadi PENGUKURAN dan bukan sekadar latihan yang rapi:
-- angka Putaran 1, dan apa yang terjadi ketika angka itu rendah dua kali
-- berturut-turut.
--
-- KENAPA PUTARAN 1, bukan skor akhir. PRD FR5 dan FR7 keduanya bersandar pada
-- pemisahan ini, dan alasannya ada di dokumen fondasi Bagian 3.4: anak yang
-- skor akhirnya bagus KARENA mengulang enam kali adalah anak yang paling butuh
-- pendampingan, dan skor akhir justru menyembunyikannya. Skor akhir dipakai
-- untuk berbicara dengan anak; Putaran 1 dipakai untuk mengambil keputusan
-- tentang anak. Dua angka, dua kegunaan, tidak boleh saling menimpa.
--
-- TIDAK ADA KOLOM `skor_putaran_1`. Putaran sebuah paket sudah terbaca dari
-- data yang ada: migrasi 134 menetapkan "beberapa sesi dengan paket yang sama =
-- beberapa putaran", dan 146 meneruskan bentuk itu ke jalur peta lewat
-- `practice_sessions.paket_topik_id`. Menyimpan angkanya sebagai kolom berarti
-- membuat salinan yang bisa berbeda dari sumbernya — persis yang ditolak Skema
-- Data Bagian 4 untuk metrik turunan. Jadi ia dihitung, bukan disimpan.
--
-- YANG BERUBAH PERILAKUNYA. Satu: murid tanpa tutor penanggung jawab tidak lagi
-- bisa membuka paket peta (FR9) — gerbang yang dijanjikan migrasi 139 tapi
-- belum pernah dipasang. Dua: menyelesaikan putaran pertama sebuah paket
-- latihan sekarang bisa melahirkan baris `notifikasi_eskalasi`. Keduanya hanya
-- menyentuh jalur `paket_topik_id`; latihan bebas tidak berubah sama sekali.
--
-- YANG BELUM: pengiriman notifikasinya. PRD Bagian 8 poin 3 (kanal teknis
-- eskalasi) masih pertanyaan terbuka, jadi yang dibangun di sini adalah
-- jejaknya — tabel yang bisa dibaca permukaan tutor. Begitu kanalnya diputuskan
-- (in-app, WhatsApp, surel), yang perlu ditambahkan cuma pengirimnya, bukan
-- pendeteksinya.
-- ============================================================

-- 1. Skor Putaran 1 dan skor akhir, per paket ---------------------------------
--
-- Dua fungsi, sengaja. Yang pertama (`skor_paket_topik`) menghitung dan TIDAK
-- bertanya siapa yang bertanya — ia dipakai dari dalam trigger, tempat tidak
-- ada `auth.uid()` yang bermakna. Yang kedua (`topik_skor_paket`) adalah
-- permukaan pelaporan, dan ia bertanya.
--
-- Pemisahan ini bukan gaya. FR3 melarang Skor Putaran 1 muncul di antarmuka
-- murid "dalam bentuk apa pun", dan sebuah fungsi Postgres di skema `public`
-- adalah antarmuka: PostgREST menyajikannya ke browser mana pun yang punya
-- anon key. Maka yang menghitung dicabut haknya dari `public` di bagian bawah
-- migrasi ini, dan yang menyajikan menggantinya dengan gerbang admin/tutor
-- penanggung jawab. Tanpa itu, kebijakan visibilitas skor cuma sopan santun di
-- sisi React yang bisa dilewati dengan satu panggilan `fetch`.

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
  -- Skor akhir: keadaan TERAKHIR tiap butir, lintas putaran. Putaran berikutnya
  -- hanya memuat butir yang nilainya belum penuh (146), jadi jawaban terakhir
  -- sebuah butir memang keadaan akhirnya — termasuk nilai sebagian multi-select,
  -- sesuai FR5.
  jawaban_akhir as (
    select distinct on (a.question_bank_item_id)
           a.question_bank_item_id, a.score, a.max_score
    from sesi
    join practice_answers a on a.session_id = sesi.id
    order by a.question_bank_item_id, a.answered_at desc
  )
  -- `sesi.putaran`, tidak pernah `putaran` telanjang: nama keluaran fungsi ikut
  -- terlihat di badannya, dan nama yang bisa dibaca dua arah membuat penerjemah
  -- mengeluh "column reference is ambiguous" — persis kegagalan yang ditambal
  -- migrasi 147.
  select
    coalesce((select max(sesi.putaran) from sesi), 0)::integer,
    coalesce((select bool_or(sesi.finished_at is not null) from sesi where sesi.putaran = 1), false),
    (select count(*) from paket_topik_item i where i.paket_id = p_paket_id)::integer,
    (select count(*) from jawaban_putaran_1)::integer,
    -- Penyebutnya bobot butir yang DIJAWAB, bukan bobot seluruh paket. Sesi yang
    -- selesai normal menjawab semuanya, jadi keduanya sama; yang berbeda cuma
    -- sesi yang ditinggalkan, dan di situ `butir_terjawab_putaran_1` yang
    -- memberi tahu pembacanya bahwa angka ini tidak mewakili paket penuh.
    (select sum(coalesce(score, 0)) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_putaran_1),
    (select sum(coalesce(score, 0)) / nullif(sum(coalesce(max_score, 0)), 0)
       from jawaban_akhir);
$$;

comment on function skor_paket_topik(uuid, uuid) is
  'Skor Putaran 1 dan skor akhir sebuah paket peta untuk satu murid (FR5). Dihitung, tidak disimpan. TANPA gerbang — hak eksekusinya dicabut dari publik; pemanggil dari aplikasi memakai topik_skor_paket().';

-- Permukaan pelaporan: satu baris per paket sebuah topik (FR8).
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
  order by p.jenis desc, p.nomor;
$$;

comment on function topik_skor_paket(uuid, text) is
  'Skor Putaran 1 & skor akhir semua paket sebuah topik untuk satu murid (FR8). Hanya admin dan tutor penanggung jawab murid itu — Skor Putaran 1 tidak boleh sampai ke murid (FR3).';

-- 2. Gerbang penanggung jawab (FR9) -------------------------------------------
--
-- Migrasi 139 membuat kolomnya nullable dan menutup catatannya dengan janji:
-- "yang menegakkan wajib terisi sebelum paket pertama adalah gerbang di jalur
-- paket Bloom, bukan skema". Ini gerbangnya.
--
-- TRIGGER, BUKAN SYARAT DI DALAM `topik_open_paket_session`. Alasan yang sama
-- dengan migrasi 148: syarat yang ditulis di badan satu fungsi hanya berlaku
-- untuk fungsi itu, dan fungsi kedua yang membuka sesi paket — yang belum
-- ditulis siapa pun hari ini — akan lahir tanpa membawanya. Trigger berlaku
-- untuk setiap baris, termasuk yang disisipkan tangan di SQL Editor.
--
-- MENGGAGALKAN, bukan diam-diam mengembalikan null. Penolakan lain di 146
-- (paket terkunci, ujian yang sudah pernah dikerjakan) adalah keadaan yang
-- wajar dan sudah punya tempat di layar. Yang ini kesalahan penyiapan pilot,
-- dan orang yang perlu tahu adalah admin — bukan anak yang mengetuk tombol dan
-- mendapati tidak terjadi apa-apa.
create or replace function jaga_paket_topik_punya_penanggung_jawab()
returns trigger
language plpgsql
as $$
begin
  if new.paket_topik_id is not null
     and not exists (
       select 1 from learners l
       where l.id = new.learner_id
         and l.tutor_penanggung_jawab_id is not null
     )
  then
    raise exception
      'Murid ini belum punya tutor penanggung jawab, jadi paket pengukuran belum bisa dibuka (PRD FR9). Isi dulu penanggung jawabnya di data murid.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_paket_topik_punya_penanggung_jawab on practice_sessions;
create trigger jaga_paket_topik_punya_penanggung_jawab
  before insert on practice_sessions
  for each row execute function jaga_paket_topik_punya_penanggung_jawab();

-- 3. Jejak eskalasi (FR7) -----------------------------------------------------
--
-- Skema Data Bagian 3.8: tanpa tabel ini, SOP eskalasi tidak bisa diverifikasi
-- berjalan atau tidak — dan SOP yang tidak bisa diperiksa sama saja dengan
-- tidak ada.
create table if not exists notifikasi_eskalasi (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references learners(id) on delete cascade,
  -- DISALIN, bukan dibaca lewat join saat ditampilkan. Kalau penanggung jawab
  -- murid berganti bulan depan, riwayat harus tetap berkata siapa yang dulu
  -- ditagih tanggung jawabnya — itu inti sebuah jejak audit (139 Bagian 1).
  tutor_penanggung_jawab_id uuid references profiles(id) on delete set null,
  pemicu text not null default 'dua_paket_berturut_di_bawah_ambang'
    check (pemicu in ('dua_paket_berturut_di_bawah_ambang')),
  paket_pemicu uuid[] not null default '{}',
  -- Ambang yang berlaku SAAT itu ikut disimpan: `pengaturan.ambang_mastery`
  -- boleh diubah tim konten kapan saja, dan notifikasi lama yang dibaca ulang
  -- setahun kemudian harus tetap bisa menjelaskan dirinya sendiri.
  ambang_berlaku numeric,
  skor_pemicu numeric[] not null default '{}',
  waktu_notifikasi_terkirim timestamptz not null default now(),
  waktu_tutor_merespons timestamptz,
  catatan_tindak_lanjut text
);

comment on table notifikasi_eskalasi is
  'Jejak audit SOP eskalasi tutor (PRD FR7, Skema Data 3.8). Append-only: baris tidak pernah dihapus, dan yang boleh berubah hanya kolom respons tutor.';

create index if not exists notifikasi_eskalasi_learner_idx
  on notifikasi_eskalasi(learner_id, waktu_notifikasi_terkirim desc);
create index if not exists notifikasi_eskalasi_tutor_idx
  on notifikasi_eskalasi(tutor_penanggung_jawab_id, waktu_notifikasi_terkirim desc);

-- Satu pasang paket hanya boleh memicu sekali. Tanpa ini, membuka ulang halaman
-- hasil atau menyelesaikan sesi yang sama dua kali akan menumpuk notifikasi
-- untuk keadaan yang sama, dan tutor belajar mengabaikannya.
create unique index if not exists notifikasi_eskalasi_pemicu_unik
  on notifikasi_eskalasi(learner_id, pemicu, paket_pemicu);

alter table notifikasi_eskalasi enable row level security;

-- Murid dan keluarganya TIDAK melihat tabel ini sama sekali. Isinya berpangkal
-- pada Skor Putaran 1, dan sebuah baris "kamu dieskalasi" adalah cara paling
-- telanjang untuk membocorkan angka yang FR3 larang ditampilkan. Yang dilihat
-- murid adalah pesannya (framing tidak menghukum, FR7) — teks, bukan tabel.
drop policy if exists "Admin mengelola eskalasi" on notifikasi_eskalasi;
create policy "Admin mengelola eskalasi" on notifikasi_eskalasi
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Tutor membaca eskalasi miliknya" on notifikasi_eskalasi;
create policy "Tutor membaca eskalasi miliknya" on notifikasi_eskalasi
  for select using (tutor_penanggung_jawab_id = auth.uid());

drop policy if exists "Tutor menjawab eskalasi miliknya" on notifikasi_eskalasi;
create policy "Tutor menjawab eskalasi miliknya" on notifikasi_eskalasi
  for update using (tutor_penanggung_jawab_id = auth.uid())
  with check (tutor_penanggung_jawab_id = auth.uid());

-- Append-only, ditegakkan bukan disepakati (NFR Auditability). Kebijakan RLS di
-- atas sudah tidak memberi hak hapus kepada siapa pun kecuali admin; trigger
-- ini menutup admin juga, karena "tidak boleh dihapus" di dokumen itu tentang
-- datanya, bukan tentang perannya.
create or replace function jaga_eskalasi_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'Baris notifikasi_eskalasi tidak boleh dihapus — ia jejak audit SOP eskalasi (PRD Bagian 7).'
      using errcode = 'check_violation';
  end if;

  -- Yang boleh berubah cuma jawaban tutornya. Sisanya adalah keadaan yang
  -- sudah terjadi, dan yang sudah terjadi tidak disunting.
  if new.learner_id is distinct from old.learner_id
     or new.tutor_penanggung_jawab_id is distinct from old.tutor_penanggung_jawab_id
     or new.pemicu is distinct from old.pemicu
     or new.paket_pemicu is distinct from old.paket_pemicu
     or new.ambang_berlaku is distinct from old.ambang_berlaku
     or new.skor_pemicu is distinct from old.skor_pemicu
     or new.waktu_notifikasi_terkirim is distinct from old.waktu_notifikasi_terkirim
  then
    raise exception
      'Hanya waktu_tutor_merespons dan catatan_tindak_lanjut yang boleh disunting pada notifikasi_eskalasi.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists jaga_eskalasi_append_only on notifikasi_eskalasi;
create trigger jaga_eskalasi_append_only
  before update or delete on notifikasi_eskalasi
  for each row execute function jaga_eskalasi_append_only();

-- 4. SLA 24 jam kerja ---------------------------------------------------------
--
-- FR7 menuntut `status_sla` dihitung otomatis, "terlambat kalau tutor belum
-- merespons lebih dari 24 jam kerja". Dokumen tidak pernah mendefinisikan jam
-- kerja, jadi ini definisinya, dan ia sebuah asumsi yang boleh dibantah:
-- **jam kerja = jam mana pun pada hari yang bukan Minggu dan bukan hari libur
-- di tabel `holidays`**, dihitung dalam WIB.
--
-- Yang sengaja TIDAK dilakukan: membatasi ke jam buka bimbel (mis. 13.00–21.00).
-- Eskalasi bukan pekerjaan yang harus dikerjakan di tempat — membalas "sudah
-- saya hubungi orang tuanya" bisa dilakukan malam hari — dan jam buka yang
-- ditanam di SQL akan salah untuk cabang berikutnya. Kalau kelak ternyata perlu
-- lebih ketat, angkanya sudah ada di `pengaturan`, bukan di kode.
insert into pengaturan (kunci, nilai, keterangan) values
  (
    'sla_eskalasi_jam_kerja',
    '24'::jsonb,
    'Batas waktu tutor merespons eskalasi, dihitung dalam jam kerja — hari selain Minggu dan hari libur (PRD FR7).'
  )
on conflict (kunci) do nothing;

create or replace function jam_kerja_berlalu(
  p_mulai timestamptz,
  p_sampai timestamptz default now()
)
returns integer
language sql
stable
set search_path = public
as $$
  -- Satu baris per jam. Untuk volume pilot (5–10 murid) ini murah, dan
  -- bentuknya bisa dibaca ulang setahun lagi tanpa menerjemahkan aritmetika
  -- tanggal di kepala. Kalau suatu saat mahal, yang diganti perhitungannya,
  -- bukan definisinya.
  select count(*)::integer
  from generate_series(
         date_trunc('hour', p_mulai),
         p_sampai,
         interval '1 hour'
       ) as jam
  where extract(dow from jam at time zone 'Asia/Jakarta') <> 0
    and not exists (
      select 1 from holidays h
      where h.holiday_date = (jam at time zone 'Asia/Jakarta')::date
    );
$$;

comment on function jam_kerja_berlalu(timestamptz, timestamptz) is
  'Jam kerja yang berlalu antara dua waktu: jam pada hari selain Minggu dan hari libur (holidays), dalam WIB. Dipakai status SLA eskalasi (FR7).';

-- Tampilan, bukan kolom: `status_sla` berubah sendiri seiring waktu berjalan,
-- dan kolom yang harus dijaga tetap benar oleh sebuah job terjadwal adalah
-- kolom yang suatu hari akan salah pada Sabtu malam.
create or replace view eskalasi_dengan_sla
with (security_invoker = on)
as
select n.*,
       case
         when n.waktu_tutor_merespons is not null then 'terpenuhi'
         when jam_kerja_berlalu(n.waktu_notifikasi_terkirim)
              > coalesce((select (p.nilai #>> '{}')::numeric from pengaturan p
                          where p.kunci = 'sla_eskalasi_jam_kerja'), 24)
           then 'terlambat'
         else 'menunggu'
       end as status_sla
from notifikasi_eskalasi n;

comment on view eskalasi_dengan_sla is
  'notifikasi_eskalasi + status_sla yang dihitung saat dibaca (FR7). security_invoker: RLS tabelnya tetap berlaku bagi pembacanya.';

-- 5. Pendeteksi: dua paket latihan berturut-turut di bawah ambang -------------
--
-- Trigger pada sesi yang baru saja selesai, bukan pekerjaan yang dititipkan ke
-- aplikasi. Alasannya sama dengan gerbang di Bagian 2: pendeteksi yang harus
-- diingat pemanggilnya adalah pendeteksi yang akan terlewat, dan yang terlewat
-- di sini adalah anak yang dua kali berturut-turut kesulitan tanpa ada yang
-- tahu.
--
-- "BERTURUT-TURUT" = nomor paket berdampingan dalam topik yang sama (FR7,
-- keputusan eksplisit). Untuk pilot satu topik dengan urutan C1→C2→C3 dan tanpa
-- retake, tidak ada tafsir kedua.
--
-- Diperiksa hanya saat PUTARAN 1 sebuah paket selesai. Putaran berikutnya tidak
-- mengubah Skor Putaran 1 — itu justru inti angka ini — jadi memeriksanya lagi
-- cuma akan menemukan keadaan yang sama untuk kedua kalinya.
create or replace function periksa_eskalasi_dua_paket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paket record;
  v_sebelumnya uuid;
  v_ambang numeric;
  v_skor_ini numeric;
  v_skor_sebelumnya numeric;
  v_tutor uuid;
begin
  if new.paket_topik_id is null then return new; end if;
  if new.finished_at is null or old.finished_at is not null then return new; end if;

  select p.id, p.topik_id, p.jenis, p.nomor into v_paket
  from paket_topik p where p.id = new.paket_topik_id;

  -- Paket ujian tidak punya putaran kedua dan tidak masuk hitungan "dua paket
  -- latihan berturut-turut". Selisih latihan–ujian adalah metrik tersendiri
  -- (dokumen fondasi Bagian 4.2), bukan pemicu eskalasi.
  if v_paket.jenis <> 'latihan' then return new; end if;

  if exists (
    select 1 from practice_sessions s
    where s.learner_id = new.learner_id
      and s.paket_topik_id = new.paket_topik_id
      and s.id <> new.id
      and (s.started_at, s.id) < (new.started_at, new.id)
  ) then
    return new;  -- bukan putaran pertama
  end if;

  select p.id into v_sebelumnya
  from paket_topik p
  where p.topik_id = v_paket.topik_id
    and p.jenis = 'latihan'
    and p.nomor = v_paket.nomor - 1;

  if v_sebelumnya is null then return new; end if;

  select (nilai #>> '{}')::numeric into v_ambang
  from pengaturan where kunci = 'ambang_mastery';
  v_ambang := coalesce(v_ambang, 0.75);

  select skor_putaran_1 into v_skor_ini
  from skor_paket_topik(new.learner_id, new.paket_topik_id);
  select skor_putaran_1 into v_skor_sebelumnya
  from skor_paket_topik(new.learner_id, v_sebelumnya);

  -- Paket sebelumnya yang belum pernah dikerjakan bukan paket yang gagal.
  -- `null` di sini berarti "belum ada angkanya", dan diam adalah jawaban yang
  -- benar untuk pertanyaan yang belum punya data.
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
$$;

drop trigger if exists periksa_eskalasi_dua_paket on practice_sessions;
create trigger periksa_eskalasi_dua_paket
  after update of finished_at on practice_sessions
  for each row execute function periksa_eskalasi_dua_paket();

-- 6. Siapa boleh memanggil apa ------------------------------------------------
--
-- Postgres memberi hak eksekusi setiap fungsi baru kepada PUBLIC, dan di
-- Supabase PUBLIC termasuk `anon` — artinya setiap fungsi di skema ini lahir
-- terbuka ke browser. Untuk `skor_paket_topik` itu tidak bisa dibiarkan: ia
-- mengembalikan Skor Putaran 1 tanpa bertanya siapa pemanggilnya, karena
-- pemanggilnya seharusnya cuma trigger di atas.
-- `anon` dan `authenticated` disebut sendiri, tidak cukup mengandalkan
-- pencabutan dari PUBLIC: Supabase memasang `alter default privileges` yang
-- memberi EXECUTE kepada kedua peran itu secara langsung untuk setiap fungsi
-- baru di skema `public`, dan hak yang diberikan langsung tidak ikut tercabut
-- saat hak PUBLIC dicabut.
revoke all on function skor_paket_topik(uuid, uuid) from public, anon, authenticated;
revoke all on function jaga_paket_topik_punya_penanggung_jawab() from public;
revoke all on function jaga_eskalasi_append_only() from public;
revoke all on function periksa_eskalasi_dua_paket() from public;

grant execute on function topik_skor_paket(uuid, text) to authenticated;
grant execute on function jam_kerja_berlalu(timestamptz, timestamptz) to authenticated;

notify pgrst, 'reload schema';
