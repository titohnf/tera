-- ============================================================
-- Batas waktu paket ujian, sebagai keterangan bukan sebagai pagar
--
-- FR4 menuntut timer keseluruhan paket ujian aktif (target 25–30 menit,
-- Protokol Uji Coba Bagian 3), dan pada kalimat berikutnya membatasi
-- tuntutannya: untuk Tahap 0 sistem CUKUP menandai apakah pengerjaan selesai
-- dalam batas waktu — belum perlu memaksa submit otomatis, dan validasi sisi
-- klien sudah memadai. Alasannya ditulis eksplisit di PRD: peserta pilot
-- kelompok kecil yang terpantau tutor, bukan ujian berisiko tinggi.
--
-- Maka yang dibangun di sini cuma satu hal: KAPAN batasnya. Penegakannya tidak
-- ada, dan ketiadaannya disengaja — timer yang memaksa submit di tengah
-- kalimat, pada pilot yang justru sedang mengukur berapa lama sebuah soal
-- dikerjakan, akan merusak angka yang sedang dikumpulkan (FR6).
--
-- SATU ANGKA UNTUK SEMUA PAKET UJIAN, bukan kolom `durasi_menit` per paket.
-- Tahap 0 punya tepat satu paket ujian, dan kolom per paket berarti kolom yang
-- harus diisi setiap kali paket disemai — yang berakhir sebagai null yang tidak
-- pernah diisi siapa pun, lalu timer yang tidak pernah muncul. Begitu topik
-- kedua dibuka dan durasinya benar-benar berbeda, yang ditambah kolomnya,
-- dengan angka ini sebagai bawaannya. Menambah kolom pada saat itu lebih murah
-- daripada menjaga kolom kosong selama pilot.
-- ============================================================

insert into pengaturan (kunci, nilai, keterangan) values
  (
    'durasi_ujian_menit',
    '30'::jsonb,
    'Batas waktu satu paket ujian, menit (PRD FR4; Protokol Uji Coba Bagian 3 menyebut 25–30 untuk 12 butir). Indikator saja — tidak ada submit paksa di Tahap 0.'
  )
on conflict (kunci) do nothing;

-- Kapan sesi ini seharusnya berakhir. Null berarti tidak ada batas: sesi
-- latihan, sesi latihan bebas, atau sesi peta yang paketnya bukan ujian.
--
-- Dihitung dari `started_at` sesi, bukan dari waktu halaman dibuka. Anak yang
-- menutup tab lalu kembali dua puluh menit kemudian menemukan sisa waktunya
-- sudah berjalan — dan itu memang arti sebuah ujian berbatas waktu. Kalau
-- dihitung dari pembukaan halaman, menutup dan membuka lagi jadi cara memulai
-- ulang jamnya.
create or replace function sesi_batas_waktu(
  p_session_id uuid,
  p_access_code text default ''
)
returns timestamptz
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select s.started_at
       + make_interval(mins => coalesce(
           (select (p.nilai #>> '{}')::int from pengaturan p where p.kunci = 'durasi_ujian_menit'),
           30
         ))
  from practice_sessions s
  join paket_topik k on k.id = s.paket_topik_id
  where s.id = p_session_id
    and k.jenis = 'ujian'
    and s.learner_id = practice_actor(coalesce(p_access_code, ''), s.learner_id);
$$;

comment on function sesi_batas_waktu(uuid, text) is
  'Batas waktu sebuah sesi paket ujian (PRD FR4). Null untuk sesi lain. Dihitung dari started_at, jadi menutup tab tidak memulai ulang jamnya.';

revoke all on function sesi_batas_waktu(uuid, text) from public;
grant execute on function sesi_batas_waktu(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
