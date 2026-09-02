-- ============================================================
-- Halaman hasil bisa bertanya: sesi ini paket peta yang mana?
--
-- Halaman hasil seluruhnya ditulis untuk jalur grup. Ia menanyakan
-- `paket_group_id` sesi, dan untuk sesi jalur peta jawabannya null — sejak itu
-- semua turunannya ikut kosong: nilai paket, jumlah soal yang masih salah,
-- tautan kembali ke daftar paket, dan gerbang "kunci hanya untuk paket yang
-- sudah terkunci".
--
-- Akibatnya bukan halaman yang setengah terisi, melainkan halaman yang salah:
-- anak yang menjawab benar 5 dari 8 melihat angka besar bertuliskan 0%, karena
-- persentasenya jatuh ke rincian per topik kurikulum — dan butir peta memang
-- sengaja tidak punya tag kurikulum sejak migrasi 148. Angka itu bukan nol
-- karena ia salah semua; ia nol karena tidak ada yang dihitung.
--
-- Yang hilang cuma satu pertanyaan, dan ini jawabannya. Sesudah ini halaman
-- hasil bisa memilih jalur yang benar dengan satu kali tanya, tanpa perlu
-- membaca `paket_topik` (yang RLS-nya admin saja, dan memang tidak boleh
-- dibuka untuk keluarga).
--
-- Nama topiknya ikut supaya rincian di bawah nilai punya sesuatu untuk
-- disebut. Tanpa itu, satu-satunya kalimat yang bisa ditulis halaman adalah
-- "tidak ada rincian topik untuk sesi ini" — benar secara harfiah, dan tidak
-- berguna bagi siapa pun.
-- ============================================================

create or replace function sesi_paket_topik(
  p_session_id uuid,
  p_access_code text default ''
)
returns table (
  paket_id uuid,
  topik_id text,
  topik_nama text,
  jenis text,
  level_bloom smallint,
  nomor integer
)
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select k.id, t.id, t.nama, k.jenis, k.level_bloom, k.nomor
  from practice_sessions s
  join paket_topik k on k.id = s.paket_topik_id
  join topik t on t.id = k.topik_id
  where s.id = p_session_id
    and s.learner_id = practice_actor(coalesce(p_access_code, ''), s.learner_id);
$$;

comment on function sesi_paket_topik(uuid, text) is
  'Paket peta sebuah sesi, atau kosong kalau sesi itu bukan jalur peta. Gerbangnya practice_actor(), sama seperti seluruh keluarga topik_*.';

revoke all on function sesi_paket_topik(uuid, text) from public;
grant execute on function sesi_paket_topik(uuid, text) to anon, authenticated;

notify pgrst, 'reload schema';
