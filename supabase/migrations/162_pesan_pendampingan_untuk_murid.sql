-- ============================================================
-- Pesan pendampingan: separuh FR7 yang menghadap murid
--
-- Migrasi 149 membangun pendeteksinya — dua paket latihan berturut-turut yang
-- Skor Putaran 1-nya di bawah ambang melahirkan baris `notifikasi_eskalasi`.
-- Yang dibangun waktu itu berhenti di jejaknya, karena FR7 menyisakan dua hal
-- ke tim di luar engineering: kanal notifikasinya (PRD Bagian 8 poin 3) dan
-- copy teks framing untuk murid (poin 6).
--
-- Kanalnya sudah diputuskan: lonceng tutor yang sudah berdiri. Yang tersisa
-- adalah kalimat yang dibaca ANAKNYA sesudah paket kedua itu, dan FR7 membagi
-- tugasnya dengan jelas — "tim konten menyediakan copy teks final, engineering
-- menyediakan mekanisme menampilkannya". Migrasi ini menyediakan mekanismenya,
-- dan menaruh teksnya di `pengaturan` supaya penggantinya tidak butuh deploy.
-- Teks bawaan di bawah adalah teks yang MASIH BOLEH DIGANTI, bukan keputusan
-- editorial yang diam-diam diambil di sini.
--
-- KENAPA FUNGSI, BUKAN SELECT BIASA. Anak dan keluarganya tidak boleh membaca
-- `notifikasi_eskalasi` sama sekali (kebijakan RLS 149): isinya berpangkal
-- pada Skor Putaran 1, dan satu baris "kamu dieskalasi" adalah cara paling
-- telanjang membocorkan angka yang FR3 larang. Maka yang menyeberang ke browser
-- bukan barisnya melainkan SATU KALIMAT — tanpa angka, tanpa nama paket, tanpa
-- ambang. Fungsi ini tidak punya bentuk lain untuk mengembalikan sesuatu yang
-- lebih dari itu, dan itulah gunanya ia berupa `returns text`.
--
-- APA YANG MEMBUATNYA MUNCUL. Sesi yang baru saja ditutup harus (a) milik
-- pemanggil, dan (b) paketnya adalah paket PEMICU — anggota terakhir
-- `paket_pemicu`, yaitu paket kedua dari dua yang berturut-turut. Anggota
-- pertamanya sengaja tidak ikut: kalimat ini kalimat sesudah paket kedua, dan
-- menampilkannya lagi di halaman hasil paket pertama berarti anak membacanya
-- untuk keadaan yang belum terjadi saat itu.
--
-- Jalankan SESUDAH 149 (tabelnya) dan 139 (tabel `pengaturan`).
-- ============================================================

-- 1. Teksnya, milik tim konten ------------------------------------------------
--
-- `on conflict do nothing`: kalau tim konten sudah menuliskan versinya sendiri
-- lewat baris ini, menjalankan ulang migrasi tidak boleh menimpanya.
insert into pengaturan (kunci, nilai, keterangan)
values (
  'teks_framing_eskalasi',
  to_jsonb('Bagian ini memang belum klik, dan itu hal yang biasa — sebagian topik memang lebih mudah kalau dijelaskan langsung. Tutormu sudah tahu dan akan menemanimu di sesi berikutnya. Sementara itu kamu boleh lanjut mengerjakan seperti biasa.'::text),
  'Kalimat yang dibaca murid sesudah dua paket latihan berturut-turut di bawah ambang (FR7). Framing tidak menghukum, dan TIDAK BOLEH menyebut "Putaran 1" atau angka apa pun — kebijakan visibilitas skor, dokumen fondasi Bagian 3.3. Teks bawaan berasal dari engineering sebagai penampung; yang final ditulis tim konten.'
)
on conflict (kunci) do nothing;

-- 2. Mekanisme menampilkannya -------------------------------------------------

create or replace function pesan_pendampingan(
  p_access_code text,
  p_learner_id uuid default null,
  p_sesi_id uuid default null
)
returns text
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select (p.nilai #>> '{}')
  from practice_sessions s
  join notifikasi_eskalasi n
    on n.learner_id = s.learner_id
   and s.paket_topik_id = n.paket_pemicu[array_upper(n.paket_pemicu, 1)]
  cross join lateral (
    select nilai from pengaturan where kunci = 'teks_framing_eskalasi'
  ) p
  where s.id = p_sesi_id
    -- Gerbangnya `practice_actor`, sama seperti seluruh jalur belajar: satu
    -- tempat yang menjawab "siapa yang sedang bertanya", dan sesi yang bukan
    -- miliknya tidak pernah cocok.
    and s.learner_id = practice_actor(p_access_code, p_learner_id)
  limit 1;
$$;

comment on function pesan_pendampingan(text, uuid, uuid) is
  'Kalimat framing tidak menghukum untuk murid sesudah paket pemicu eskalasi (PRD FR7). Mengembalikan TEKS saja — tidak pernah skor, ambang, maupun keberadaan barisnya untuk paket lain. Null berarti tidak ada yang perlu dikatakan.';

grant execute on function pesan_pendampingan(text, uuid, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
