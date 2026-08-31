-- ============================================================
-- Skor berhenti datang dari pemanggil
--
-- Migrasi 136 menaruh aturan penilaian di database, tapi belum ada yang
-- memanggilnya. Migrasi ini memindahkan kedua pemakainya ke sana, dan dengan
-- begitu menghapus alasan terakhir kedua salinan TypeScript itu ada.
--
-- SEKALIGUS MENUTUP SATU LUBANG. `practice_record_answer` (114) menerima
-- `p_score`, `p_max_score`, dan `p_is_correct` dari pemanggilnya. Gerbangnya
-- memeriksa bahwa sesinya milik orang itu dan soalnya memang diundi untuk sesi
-- itu — tapi tidak pernah memeriksa ANGKANYA. Siapa pun yang memegang anon key
-- bisa memanggil fungsi ini untuk sesinya sendiri dan menuliskan nilai
-- sempurna tanpa menjawab apa pun. Selama catatan latihan cuma umpan balik
-- untuk murid sendiri, itu bisa didiamkan; begitu Skor Putaran 1 jadi dasar
-- kriteria mastery dan pemicu eskalasi tutor (PRD Tahap 0 FR5/FR7), angka yang
-- bisa dikarang bukan lagi soal kejujuran murid melainkan soal validitas
-- seluruh pengukurannya.
--
-- Sesudah ini fungsinya membaca kunci sendiri dari `question_bank_items` dan
-- menghitung sendiri. Yang boleh datang dari browser tinggal JAWABANNYA.
--
-- URUTAN DEPLOY. Tanda tangan `practice_record_answer` berubah, jadi Tera yang
-- masih terpasang akan memanggil fungsi yang sudah tidak ada di antara migrasi
-- ini dan deploy berikutnya. Hari ini jendela itu tidak berbahaya —
-- `question_bank_items` kosong (bank soal percobaan dikosongkan, lihat commit
-- `3bd2131` di repo form), jadi tidak ada sesi latihan yang bisa berjalan sama
-- sekali. Kalau migrasi ini dijalankan lagi di lingkungan yang bank soalnya
-- terisi, jalankan bersamaan dengan deploy Tera, bukan sebelumnya.
-- ============================================================

-- 1. Menilai banyak jawaban sekaligus ------------------------------------------
--
-- Untuk Sora, yang menilai seluruh isi satu percobaan di satu tempat
-- (`finalizeAttempt`). Memanggil `nilai_jawaban()` satu per satu lewat
-- PostgREST berarti satu perjalanan jaringan per soal — dua puluh soal jadi
-- dua puluh perjalanan, di jalur yang sebelumnya nol. Masukan dan keluarannya
-- array supaya urutannya yang jadi pengikat, bukan id soal: pemanggilnya sudah
-- memegang daftarnya sendiri dan tidak butuh dikembalikan.
--
-- `null` di keluaran berarti tidak dinilai otomatis, sama seperti
-- `nilai_jawaban()` tunggal.
create or replace function nilai_jawaban_banyak(p_daftar jsonb)
returns jsonb
language sql
immutable
parallel safe
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(
        nilai_jawaban(
          s.item ->> 'tipe',
          s.item -> 'opsi',
          s.item -> 'kunci',
          s.item -> 'jawaban',
          (s.item ->> 'bobot')::numeric
        )
      )
      order by s.ord
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(
         case when jsonb_typeof(p_daftar) = 'array' then p_daftar else '[]'::jsonb end
       ) with ordinality as s(item, ord);
$$;

comment on function nilai_jawaban_banyak(jsonb) is
  'Menilai sederet jawaban sekaligus; keluaran sejajar indeks dengan masukan. null = tidak dinilai otomatis.';

-- 2. Mencatat jawaban, dengan skor yang dihitung sendiri ------------------------
--
-- Tanda tangan lama dibuang, bukan dibiarkan hidup berdampingan: selama ia
-- masih ada, ia tetap jadi pintu untuk menuliskan skor karangan, dan pintu yang
-- sengaja ditinggalkan terbuka bukan pintu yang tertutup.
drop function if exists practice_record_answer(uuid, uuid, jsonb, boolean, numeric, numeric, text);

create or replace function practice_record_answer(
  p_session_id uuid,
  p_item_id uuid,
  p_response jsonb,
  p_access_code text default ''
)
returns table (skor numeric, skor_maks numeric, benar boolean, pembahasan text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_tipe text;
  v_opsi jsonb;
  v_kunci jsonb;
  v_bobot numeric;
  v_pembahasan text;
  v_nilai numeric;
begin
  -- Gerbang yang sama persis seperti sebelumnya: sesinya milik orang ini, dan
  -- soalnya memang diundi untuk sesi ini.
  select ps.learner_id
    into v_learner
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id)
    and p_item_id = any (ps.item_ids);

  if v_learner is null then return; end if;

  -- Bobot nol dibaca sebagai satu. Ini MEMPERTAHANKAN perilaku pemanggilnya
  -- hari ini (`Number(kunci.weight) || 1` di `lib/belajar/sesi.ts`), bukan
  -- pendapat baru tentang berapa nilai soal berbobot nol — kalau itu memang
  -- perlu diperbaiki, perbaikannya keputusan tersendiri, bukan ekor diam-diam
  -- dari perpindahan ini.
  select b.type,
         b.options,
         b.correct_answer,
         case when coalesce(b.weight, 0) = 0 then 1 else b.weight end,
         b.explanation
    into v_tipe, v_opsi, v_kunci, v_bobot, v_pembahasan
  from question_bank_items b
  where b.id = p_item_id;

  if v_tipe is null then return; end if;

  v_nilai := nilai_jawaban(v_tipe, v_opsi, v_kunci, p_response, v_bobot);

  -- Tipe yang tidak bisa dinilai mesin tidak pernah diundi ke latihan. Kalau
  -- toh sampai, yang benar adalah menolak mencatat — bukan mencatat nol, yang
  -- akan terbaca sebagai "dijawab salah".
  if v_nilai is null then return; end if;

  insert into practice_answers (
    session_id, learner_id, question_bank_item_id, response, is_correct, score, max_score
  )
  values (
    p_session_id, v_learner, p_item_id, p_response, v_nilai >= v_bobot, v_nilai, v_bobot
  );

  -- Pembahasannya ikut pulang supaya pemanggilnya tidak perlu memanggil
  -- `practice_answer_key()` lagi hanya untuk itu. Satu perjalanan, bukan dua —
  -- dan kunci jawabannya sendiri tidak pernah ikut keluar.
  return query select v_nilai, v_bobot, v_nilai >= v_bobot, v_pembahasan;
end;
$$;

comment on function practice_record_answer(uuid, uuid, jsonb, text) is
  'Menilai lalu mencatat satu jawaban. Skornya dihitung di sini dari kunci di database — pemanggil hanya menyetor jawaban.';

-- `practice_answer_key()` tidak lagi punya pemanggil sesudah ini. Ia SENGAJA
-- tidak dibuang di sini: fungsi itu terbuka lewat PostgREST sejak migrasi 061,
-- dan membuangnya bersamaan dengan perubahan tanda tangan di atas berarti dua
-- hal yang bisa gagal dalam satu langkah. Pembuangannya pekerjaan tersendiri.

notify pgrst, 'reload schema';
