-- ============================================================
-- Hasil try out untuk peserta berkode
--
-- Peserta luar (migrasi 227) masuk dengan kode, tanpa akun. Setelah try out
-- mereka perlu bisa melihat hasilnya tanpa akun juga: skor, capaian per bidang
-- dibanding nasional dan peserta lain, dan kompetensi yang perlu diperkuat.
-- Halamannya di Sora: /hasil/<kode>.
--
-- Fungsi ini security definer dan hanya membuka hasil MILIK pemegang kode itu:
--   * hanya percobaan yang sudah dikirim, pada paket `kind = 'tryout'`;
--   * hanya bila admin sudah membuka hasilnya (`quizzes.settings.hasil_dibuka`
--     bernilai true), supaya sesi pertama tidak membocorkan ke sesi kedua;
--   * per soal hanya skor dan peta kompetensinya. TIDAK ada kunci jawaban,
--     pilihan, atau pembahasan.
-- Rata-rata peserta lain berupa agregat per soal (tanpa nama).
--
-- ADITIF: satu fungsi baru. Aman dijalankan kapan saja.
-- ============================================================

create or replace function hasil_peserta_tryout(p_kode text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_learner learners%rowtype;
  v_paket jsonb := '[]'::jsonb;
  v_menunggu jsonb := '[]'::jsonb;
  q record;
begin
  select * into v_learner
  from learners
  where kode_peserta_bersih(p_kode) <> '' and upper(access_code) = kode_peserta_bersih(p_kode)
  limit 1;
  if not found then
    return null;
  end if;

  for q in
    select z.id, z.title, z.settings, a.id as attempt_id, a.submitted_at, a.total_score
    from attempts a
    join quizzes z on z.id = a.quiz_id
    where a.learner_id = v_learner.id
      and a.submitted_at is not null
      and z.kind = 'tryout'
    order by a.submitted_at desc
  loop
    if coalesce((q.settings ->> 'hasil_dibuka')::boolean, false) is not true then
      v_menunggu := v_menunggu || jsonb_build_object('judul', q.title);
      continue;
    end if;

    v_paket := v_paket || jsonb_build_object(
      'quiz_id', q.id,
      'judul', q.title,
      'dikirim', q.submitted_at,
      'skor', q.total_score,
      'jumlah_peserta', (select count(*) from attempts x where x.quiz_id = q.id and x.submitted_at is not null),
      'soal', (
        select coalesce(jsonb_agg(
                 jsonb_build_object(
                   'id', s.id,
                   'nomor', s.n,
                   'bobot', s.weight,
                   'kompetensi', s.kompetensi,
                   'skor', s.skor,
                   'skor_rata', s.rata
                 ) order by s.n), '[]'::jsonb)
        from (
          select qs.id,
                 qs.weight,
                 qs.kompetensi,
                 row_number() over (order by qs.order_index, qs.id) as n,
                 coalesce(an.manual_score, an.auto_score, 0) as skor,
                 (select avg(coalesce(y.manual_score, y.auto_score, 0))
                    from answers y
                    join attempts ay on ay.id = y.attempt_id
                   where y.question_id = qs.id and ay.submitted_at is not null) as rata
          from questions qs
          left join answers an on an.question_id = qs.id and an.attempt_id = q.attempt_id
          where qs.quiz_id = q.id
        ) s
      )
    );
  end loop;

  return jsonb_build_object('nama', v_learner.name, 'paket', v_paket, 'menunggu', v_menunggu);
end $$;

comment on function hasil_peserta_tryout(text) is
  'Hasil try out milik pemegang kode peserta (hanya paket yang hasilnya dibuka admin). Tanpa kunci jawaban.';

grant execute on function hasil_peserta_tryout(text) to anon, authenticated;
