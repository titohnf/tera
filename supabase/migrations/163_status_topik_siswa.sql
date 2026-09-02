-- ============================================================
-- Mesin keadaan topik: status yang dicatat, bukan disimpulkan ulang tiap layar
--
-- FR13 menuntut setiap pasangan murid–topik punya satu status dari enam
-- keadaan di Mesin Jalur Belajar Bagian 2, dan sebuah `evaluasi_unlock` yang
-- berjalan SYNCHRONOUS saat paket selesai — bukan job terjadwal — supaya topik
-- yang baru terbuka terlihat seketika, bukan sesudah jeda yang terasa aneh.
--
-- SATU DEFINISI, DUA BENTUK. Yang menentukan status adalah `status_topik_murid`
-- (fungsi, murni, dihitung dari jawaban); yang menyimpannya adalah
-- `status_topik_siswa` (tabel, ditulis `evaluasi_unlock`). Tabelnya bukan
-- kebenaran kedua melainkan CETAKAN dari yang pertama, plus satu hal yang tidak
-- bisa dihitung: KAPAN status itu berubah. Stempel waktu itulah yang membuat
-- "topik ini sudah tuntas sejak kapan" bisa dijawab — dan FR11 butuh jawaban
-- itu untuk menjadwalkan retest pertama.
--
-- Yang DIBACA aplikasi selalu tabelnya, tidak pernah fungsinya: fungsinya
-- memanggil `skor_paket_topik`, dan hak panggil itu sudah dicabut dari browser
-- di migrasi 149 justru supaya Skor Putaran 1 tidak bisa ditanyakan dari sana.
-- Keduanya tidak bisa berbeda arti karena yang satu ditulis dari yang lain;
-- yang bisa terjadi cuma tabelnya tertinggal satu sesi, dan trigger di Bagian 4
-- yang menutup celah itu.
--
-- Konsekuensi yang perlu diketahui: murid yang belum pernah menyelesaikan satu
-- sesi pun belum punya baris sama sekali. Itu bukan "statusnya tidak diketahui"
-- melainkan "belum ada yang perlu dicatat" — pembacanya memperlakukan ketiadaan
-- baris sebagai keadaan awal, bukan sebagai galat.
--
-- `tuntas` MEMAKAI SKOR PUTARAN 1, dan itu bukan detail. Mesin Jalur Belajar
-- Bagian 2 menuliskannya eksplisit, dan alasannya sama dengan alasan FR7
-- memakai angka yang sama: anak yang lolos sesudah enam kali mengulang belum
-- menguasai topiknya, dan skor akhir menyembunyikan justru anak yang paling
-- butuh pendampingan. `topik_tersedia` (146) hari ini menyimpulkan penguasaan
-- dari JAWABAN TERAKHIR tiap butir — angka yang lebih murah hati. Keduanya
-- sengaja dibiarkan berdampingan untuk sekarang, dan itu keputusan yang perlu
-- dibaca sebagai keputusan:
--
--   * `topik_tersedia` menjawab "apa yang boleh dibuka murid hari ini", dan
--     jawabannya MEMBERI TAHU, tidak memblokir (146 Bagian 5) — Tahap 0 tidak
--     punya placement test, jadi mengetatkannya berarti mengunci anak dari
--     topik yang belum sempat diukur sistem;
--   * `status_topik_murid` menjawab "sejauh mana topik ini benar-benar
--     dikuasai", dan dari sanalah retest serta rekomendasi Tahap 1 berpangkal.
--
-- Menyatukan keduanya berarti mengetatkan prasyarat di tengah pilot yang sedang
-- berjalan, untuk anak-anak yang sudah terlanjur mengerjakan. Itu keputusan
-- produk, bukan keputusan migrasi.
--
-- YANG TIDAK DIBANGUN DI SINI: formula skor rekomendasi dan bounded choice
-- maksimal tiga pilihan (Mesin Jalur Belajar Bagian 3). FR13 menaruhnya di luar
-- cakupan Tahap 0 dengan alasan yang masih berlaku — satu topik aktif berarti
-- tidak ada yang bisa bersaing dengan apa pun.
--
-- Jalankan SESUDAH 149 (`skor_paket_topik`, `notifikasi_eskalasi`).
-- ============================================================

-- 1. Tabelnya -----------------------------------------------------------------

create table if not exists status_topik_siswa (
  learner_id uuid not null references learners(id) on delete cascade,
  topik_id text not null references topik(id) on delete cascade,
  status text not null check (status in (
    'terkunci', 'siap_dikerjakan', 'sedang_dikerjakan',
    'tuntas', 'butuh_pengulangan', 'eskalasi_tutor'
  )),
  -- Ditulis FR11: topik lanjutan yang prasyaratnya gagal retest ditandai perlu
  -- diperiksa ulang meski statusnya `tuntas`. Berdiri sebagai kolom sendiri,
  -- bukan status ketujuh, karena ia BERLAKU BERSAMAAN dengan `tuntas` — bukan
  -- menggantikannya.
  perlu_verifikasi_ulang boolean not null default false,
  -- Kapan statusnya terakhir BERUBAH, bukan kapan barisnya terakhir disentuh.
  -- `evaluasi_unlock` hanya memundurkan-majukan kolom ini saat nilainya benar-
  -- benar berbeda; tanpa itu, "tuntas sejak kapan" akan bergeser tiap kali
  -- murid menyelesaikan paket topik lain.
  waktu_perubahan_status timestamptz not null default now(),
  primary key (learner_id, topik_id)
);

comment on table status_topik_siswa is
  'Mesin keadaan topik per murid (PRD FR13, Mesin Jalur Belajar Bagian 2). Cetakan dari `status_topik_murid()` plus stempel waktu perubahan — bukan kebenaran kedua.';
comment on column status_topik_siswa.waktu_perubahan_status is
  'Kapan status ini terakhir BERUBAH. Dipakai FR11 untuk menjadwalkan retest pertama sejak topik tuntas.';

create index if not exists status_topik_siswa_topik_idx
  on status_topik_siswa(topik_id, status);

alter table status_topik_siswa enable row level security;

-- Murid dan keluarganya boleh membaca miliknya sendiri: status topik adalah
-- kabar yang memang untuk mereka ("terkunci", "tuntas"), dan tidak satu pun
-- dari enam nilainya mengandung angka. Yang tetap tertutup adalah apa yang
-- MENYEBABKAN statusnya — itu tinggal di `skor_paket_topik`, yang haknya sudah
-- dicabut dari publik di migrasi 149.
drop policy if exists "Murid membaca status topiknya" on status_topik_siswa;
create policy "Murid membaca status topiknya" on status_topik_siswa
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

-- Ditulis HANYA oleh `evaluasi_unlock`, yang `security definer`. Tidak ada
-- policy insert/update/delete untuk siapa pun: sebuah status yang bisa ditulis
-- tangan adalah status yang bisa berbeda dari jawaban yang melahirkannya.

-- 2. Definisinya --------------------------------------------------------------
--
-- Urutan pemeriksaan adalah urutan KEGENTINGAN, bukan urutan kronologis. Anak
-- yang sedang dieskalasi tetap `eskalasi_tutor` meski paket ketiganya kebetulan
-- sudah tuntas — Mesin Jalur Belajar Bagian 4 poin 3 justru meminta sistem
-- menahan diri di rantai itu sampai tutor menindaklanjuti, dan status yang
-- berganti sendiri jadi `tuntas` akan menghapus alasan penahanan itu.
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
  -- Skor tiap paket LATIHAN topik ini. Paket ujian tidak ikut menentukan
  -- ketuntasan topik: ia mengukur hal yang berbeda (dokumen fondasi Bagian
  -- 4.2, selisih latihan–ujian sebagai metrik tersendiri), dan menjadikannya
  -- syarat berarti topik tidak pernah tuntas sebelum ujiannya ditulis.
  paket as (
    select p.topik_id, p.id as paket_id, s.skor_putaran_1, s.skor_akhir
    from paket_topik p
    left join lateral skor_paket_topik(p_learner_id, p.id) s on true
    where p.jenis = 'latihan'
  ),
  agregat as (
    select topik_id,
           count(*) as paket_total,
           count(skor_putaran_1) as paket_dikerjakan,
           count(*) filter (
             where skor_putaran_1 >= (select nilai from ambang)
           ) as paket_lolos_putaran_1,
           count(*) filter (
             where skor_akhir is not null
               and skor_akhir < (select nilai from ambang)
           ) as paket_akhir_di_bawah
    from paket group by topik_id
  ),
  -- Eskalasi yang BELUM dijawab tutor. Yang sudah dijawab bukan lagi keadaan
  -- yang sedang berlangsung — ia riwayat, dan riwayat tidak menahan apa pun.
  eskalasi as (
    select distinct p.topik_id
    from notifikasi_eskalasi n
    join paket_topik p on p.id = any(n.paket_pemicu)
    where n.learner_id = p_learner_id
      and n.waktu_tutor_merespons is null
  ),
  -- Sebuah topik `tuntas` membuka topik yang menjadikannya prasyarat. Topik
  -- tanpa prasyarat sama sekali selalu terbuka.
  tuntas as (
    select topik_id from agregat
    where paket_total > 0 and paket_lolos_putaran_1 = paket_total
  )
  select t.id,
         case
           when e.topik_id is not null then 'eskalasi_tutor'
           when tt.topik_id is not null then 'tuntas'
           when a.paket_akhir_di_bawah > 0
                and a.paket_dikerjakan = a.paket_total then 'butuh_pengulangan'
           when coalesce(a.paket_dikerjakan, 0) > 0 then 'sedang_dikerjakan'
           when not exists (
             select 1 from topik_prasyarat pr
             where pr.topik_id = t.id
               and pr.prasyarat_id not in (select topik_id from tuntas)
           ) then 'siap_dikerjakan'
           else 'terkunci'
         end,
         false
  from topik t
  left join agregat a on a.topik_id = t.id
  left join tuntas tt on tt.topik_id = t.id
  left join eskalasi e on e.topik_id = t.id;
$$;

comment on function status_topik_murid(uuid) is
  'Status enam keadaan tiap topik untuk satu murid (PRD FR13). Definisi TUNGGAL; `status_topik_siswa` adalah cetakannya. `tuntas` memakai Skor Putaran 1, bukan skor akhir.';

-- 3. Menuliskannya ------------------------------------------------------------
--
-- `perlu_verifikasi_ulang` sengaja TIDAK ikut ditimpa di sini: ia tidak
-- dihitung dari jawaban melainkan ditulis oleh retest yang gagal (FR11,
-- migrasi berikutnya). Menyalinnya dari fungsi di atas — yang selalu
-- mengembalikan `false` — akan menghapus penanda itu tiap kali murid
-- menyelesaikan paket apa pun.
create or replace function evaluasi_unlock(p_learner_id uuid)
returns void
language sql
security definer
set search_path = public
set row_security = off
as $$
  insert into status_topik_siswa (learner_id, topik_id, status)
  select p_learner_id, s.topik_id, s.status
  from status_topik_murid(p_learner_id) s
  on conflict (learner_id, topik_id) do update
    set status = excluded.status,
        waktu_perubahan_status = case
          when status_topik_siswa.status is distinct from excluded.status
          then now() else status_topik_siswa.waktu_perubahan_status
        end
    where status_topik_siswa.status is distinct from excluded.status;
$$;

comment on function evaluasi_unlock(uuid) is
  'Menyegarkan cetakan status seluruh topik seorang murid (PRD FR13, Mesin Jalur Belajar Bagian 6). Synchronous — dipanggil dari trigger penyelesaian sesi, bukan job terjadwal.';

-- 4. Kapan ia berjalan --------------------------------------------------------
--
-- Trigger terpisah dari `periksa_eskalasi_dua_paket`, bukan tambahan di
-- dalamnya, dan urutannya penting: nama trigger menentukan urutan jalan di
-- Postgres, dan `status_...` jatuh sesudah `periksa_...` secara alfabet. Itu
-- yang membuat baris eskalasi yang baru lahir sudah terlihat oleh
-- `status_topik_murid` saat ia dipanggil — tanpa itu, anak yang baru saja
-- dieskalasi akan tercatat `butuh_pengulangan` sampai paket berikutnya.
create or replace function status_topik_sesudah_sesi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.finished_at is null or old.finished_at is not null then return new; end if;
  perform evaluasi_unlock(new.learner_id);
  return new;
end;
$$;

drop trigger if exists status_topik_sesudah_sesi on practice_sessions;
create trigger status_topik_sesudah_sesi
  after update of finished_at on practice_sessions
  for each row execute function status_topik_sesudah_sesi();

-- 5. Hak ----------------------------------------------------------------------
--
-- `status_topik_murid` memanggil `skor_paket_topik`, yang haknya dicabut dari
-- publik di 149 justru supaya Skor Putaran 1 tidak bisa ditanyakan dari
-- browser. Fungsi ini tidak mengembalikan angka itu — hanya kata — jadi ia
-- boleh dipanggil; yang tidak boleh adalah menanyakannya untuk anak orang lain,
-- dan itu dijaga pemanggilnya di lapisan aplikasi lewat `practice_actor`.
revoke all on function status_topik_sesudah_sesi() from public;
revoke all on function evaluasi_unlock(uuid) from public, anon, authenticated;
revoke all on function status_topik_murid(uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';
