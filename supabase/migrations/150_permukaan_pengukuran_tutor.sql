-- ============================================================
-- Yang dilihat tutor: Putaran 1, selisih latihan–ujian, dan eskalasi miliknya
--
-- Migrasi 149 membuat angkanya ada dan eskalasinya lahir sendiri. Tanpa migrasi
-- ini, keduanya cuma bisa dibaca dari SQL Editor — dan SOP yang hanya bisa
-- dijalankan oleh orang yang punya akses database bukan SOP, melainkan
-- kebiasaan satu orang.
--
-- TIGA FUNGSI, BUKAN TIGA IZIN BACA TABEL. Yang dibutuhkan halaman tutor ada di
-- tabel yang tutor memang tidak boleh baca lepas: `learners` (kebijakannya
-- sejak 061 cuma admin dan keluarga), `paket_topik` (145, admin saja), dan
-- Skor Putaran 1 yang sengaja dicabut haknya di 149. Menambah kebijakan RLS
-- untuk tutor pada ketiganya akan membuka jauh lebih banyak dari yang halaman
-- ini butuh — seluruh murid Tera, bukan murid yang jadi tanggung jawabnya.
--
-- Maka yang dibuka adalah tiga jawaban, bukan tiga tabel. Gerbangnya sama di
-- ketiganya: admin, atau tutor yang namanya tertulis sebagai penanggung jawab
-- murid itu. `is_class_tutor()` sengaja TIDAK ikut — mengajar sesi seseorang
-- bukan hal yang sama dengan bertanggung jawab atas pengukurannya (139
-- Bagian 1), dan Skor Putaran 1 bukan angka yang disebar ke setiap tutor yang
-- kebetulan pernah mengajar anak itu.
-- ============================================================

-- 1. Murid yang jadi tanggung jawabku -----------------------------------------
--
-- Yang tersaring bukan cuma "murid tutor ini", tapi murid yang PUNYA
-- penanggung jawab sama sekali. Untuk admin itu artinya daftar roster pilot,
-- bukan seluruh murid bimbel — halaman ini tentang Tahap 0, dan menampilkan 800
-- murid yang tidak pernah menyentuh paket pengukuran cuma membuat yang delapan
-- jadi sulit ditemukan.
create or replace function tutor_murid_pengukuran()
returns table (
  learner_id uuid,
  nama text,
  eskalasi_terbuka integer,
  eskalasi_terakhir timestamptz,
  paket_selesai integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select l.id,
         coalesce(p.full_name, l.name),
         (select count(*) from notifikasi_eskalasi n
           where n.learner_id = l.id and n.waktu_tutor_merespons is null)::integer,
         (select max(n.waktu_notifikasi_terkirim) from notifikasi_eskalasi n
           where n.learner_id = l.id),
         -- Paket yang sudah punya sesi selesai, bukan sesi yang sudah dibuka:
         -- membuka paket lalu meninggalkannya bukan kemajuan, dan angka yang
         -- menghitungnya sebagai kemajuan akan membuat tutor mengira anaknya
         -- sedang berjalan padahal berhenti.
         (select count(distinct s.paket_topik_id) from practice_sessions s
           where s.learner_id = l.id
             and s.paket_topik_id is not null
             and s.finished_at is not null)::integer
  from learners l
  left join profiles p on p.id = l.profile_id
  where l.tutor_penanggung_jawab_id is not null
    and (is_admin() or l.tutor_penanggung_jawab_id = auth.uid())
  order by coalesce(p.full_name, l.name);
$$;

comment on function tutor_murid_pengukuran() is
  'Roster pilot yang jadi tanggung jawab pemanggil (PRD FR8/FR9). Admin melihat seluruh murid yang punya penanggung jawab.';

-- 2. Rapor pengukuran satu murid ----------------------------------------------
--
-- Satu baris per paket, semua topik yang sudah punya paket. Kolom yang membuat
-- halaman ini ada gunanya adalah dua yang berdampingan: `skor_putaran_1` dan
-- `skor_akhir`. Selisih besar di antara keduanya adalah anak yang sampai ke
-- jawaban benar lewat banyak percobaan — bukan kabar buruk, tapi kabar yang
-- tidak boleh hilang di balik satu angka akhir yang terlihat bagus (dokumen
-- fondasi Bagian 4.2, "selisih latihan–ujian" dan "attempts-to-resolve").
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
  skor_akhir numeric
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select t.id, t.nama, p.id, p.jenis, p.level_bloom, p.nomor,
         s.putaran, s.putaran_1_selesai, s.butir_paket,
         s.butir_terjawab_putaran_1, s.skor_putaran_1, s.skor_akhir
  from paket_topik p
  join topik t on t.id = p.topik_id
  cross join lateral skor_paket_topik(p_learner_id, p.id) s
  where is_admin()
     or exists (
          select 1 from learners l
          where l.id = p_learner_id
            and l.tutor_penanggung_jawab_id = auth.uid()
        )
  -- `jenis desc`: 'latihan' sebelum 'ujian', urutan yang sama dengan
  -- `topik_paket_state` (146) supaya kedua permukaan tidak saling bertentangan
  -- soal mana yang lebih dulu.
  order by t.urutan, p.jenis desc, p.nomor;
$$;

comment on function tutor_pengukuran_paket(uuid) is
  'Skor Putaran 1 & skor akhir tiap paket seorang murid, untuk halaman tutor (PRD FR8). Gerbang: admin atau tutor penanggung jawab murid itu.';

-- 3. Eskalasi yang harus kujawab ----------------------------------------------
--
-- View `eskalasi_dengan_sla` (149) sudah bisa dibaca tutor lewat RLS, tapi ia
-- tidak tahu nama murid — dan `learners` tidak terbaca tutor. Fungsi ini yang
-- menyatukan keduanya, supaya halaman tidak perlu satu kueri lagi ke tabel yang
-- memang tertutup baginya.
create or replace function tutor_eskalasi(p_belum_dijawab boolean default false)
returns table (
  id uuid,
  learner_id uuid,
  nama text,
  pemicu text,
  paket_pemicu uuid[],
  label_pemicu text,
  ambang_berlaku numeric,
  skor_pemicu numeric[],
  waktu_notifikasi_terkirim timestamptz,
  waktu_tutor_merespons timestamptz,
  catatan_tindak_lanjut text,
  status_sla text
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select n.id, n.learner_id, coalesce(pr.full_name, l.name),
         n.pemicu, n.paket_pemicu,
         -- Paket dirangkai jadi satu label di sini, bukan di React: yang tahu
         -- sebuah paket bernama "C2" atau "Ujian" adalah baris `paket_topik`,
         -- dan mengirim id mentah ke browser berarti browser harus bertanya
         -- lagi ke tabel yang tidak boleh ia baca.
         (select string_agg(
                   case when k.jenis = 'ujian' then 'Ujian'
                        else 'C' || k.level_bloom end,
                   ' → ' order by ord.i)
            from unnest(n.paket_pemicu) with ordinality as ord(paket_id, i)
            join paket_topik k on k.id = ord.paket_id),
         n.ambang_berlaku, n.skor_pemicu,
         n.waktu_notifikasi_terkirim, n.waktu_tutor_merespons,
         n.catatan_tindak_lanjut, n.status_sla
  from eskalasi_dengan_sla n
  join learners l on l.id = n.learner_id
  left join profiles pr on pr.id = l.profile_id
  where (is_admin() or n.tutor_penanggung_jawab_id = auth.uid())
    and (not p_belum_dijawab or n.waktu_tutor_merespons is null)
  order by n.waktu_notifikasi_terkirim desc;
$$;

comment on function tutor_eskalasi(boolean) is
  'Eskalasi yang jadi tanggung jawab pemanggil, lengkap dengan nama murid dan status SLA (PRD FR7/FR8).';

-- 4. Menjawab sebuah eskalasi -------------------------------------------------
--
-- Tutor sudah punya hak UPDATE lewat kebijakan RLS di 149, jadi aplikasi bisa
-- saja menulis langsung. Fungsi ini tetap dibuat karena satu hal yang tidak
-- bisa dijamin dari sisi aplikasi: `waktu_tutor_merespons` harus waktu SAAT
-- dijawab, dan waktu yang dikirim browser adalah waktu yang bisa keliru — jam
-- laptop yang salah, atau permintaan yang diulang setengah jam kemudian.
-- Sebuah jejak audit yang stempel waktunya berasal dari luar bukan jejak audit.
--
-- Menjawab dua kali tidak memundurkan stempel pertama, alasan yang sama dengan
-- `practice_finish_session` (114): yang dicatat adalah kapan tutor MULAI
-- merespons, dan catatan yang diperbaiki kemudian tidak mengubah fakta itu.
create or replace function eskalasi_jawab(
  p_id uuid,
  p_catatan text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update notifikasi_eskalasi n
     set waktu_tutor_merespons = coalesce(n.waktu_tutor_merespons, now()),
         catatan_tindak_lanjut = coalesce(nullif(btrim(p_catatan), ''), n.catatan_tindak_lanjut)
   where n.id = p_id
     and (is_admin() or n.tutor_penanggung_jawab_id = auth.uid())
  returning n.id into v_id;

  return v_id is not null;
end;
$$;

comment on function eskalasi_jawab(uuid, text) is
  'Tutor menandai sebuah eskalasi sudah direspons (PRD FR7). Stempel waktunya dari server, dan tidak pernah dimundurkan.';

-- 5. Hak eksekusi -------------------------------------------------------------
--
-- Keempatnya bergerbang di dalam badannya sendiri, jadi `authenticated` cukup;
-- `anon` tidak, karena tidak ada satu pun jawaban di sini yang pantas diberikan
-- kepada pemanggil tanpa identitas.
revoke all on function tutor_murid_pengukuran() from public, anon;
revoke all on function tutor_pengukuran_paket(uuid) from public, anon;
revoke all on function tutor_eskalasi(boolean) from public, anon;
revoke all on function eskalasi_jawab(uuid, text) from public, anon;

grant execute on function tutor_murid_pengukuran() to authenticated;
grant execute on function tutor_pengukuran_paket(uuid) to authenticated;
grant execute on function tutor_eskalasi(boolean) to authenticated;
grant execute on function eskalasi_jawab(uuid, text) to authenticated;

notify pgrst, 'reload schema';
