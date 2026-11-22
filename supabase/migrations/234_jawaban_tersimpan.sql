-- ============================================================
-- Jawaban yang sudah tersimpan di server, untuk melanjutkan percobaan
--
-- Layar ujian Sora menyimpan jawaban ke database tiap kali peserta menjawab, tetapi
-- pemulihan setelah muat ulang hanya membaca salinan di perangkat. Bila salinan itu hilang
-- (peramban dibersihkan, koneksi putus saat pengiriman, pindah perangkat), peserta kembali
-- ke halaman persiapan, menekan Mulai, dan dapat percobaan yang sama dengan jawaban kosong
-- di layar padahal jawabannya masih ada di server. Fungsi ini mengembalikan jawaban itu.
--
-- Hanya untuk percobaan yang belum dikirim (id percobaan adalah rahasia yang sama dengan
-- yang dipakai simpan_jawaban). Yang dikembalikan hanya jawaban peserta sendiri: tanpa kunci,
-- tanpa skor. ADITIF dan aman dijalankan kapan saja.
-- ============================================================

create or replace function jawaban_tersimpan(p_attempt uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'responses', coalesce((select jsonb_object_agg(an.question_id::text, an.response)
                           from answers an where an.attempt_id = a.id), '{}'::jsonb),
    'index', coalesce(a.current_question_index, 0)
  )
  from attempts a
  where a.id = p_attempt and a.submitted_at is null;
$$;

grant execute on function jawaban_tersimpan(uuid) to anon, authenticated;
