-- ============================================================
-- Hasil try out untuk akun yang login (bukan hanya pemegang kode)
--
-- Migrasi 229 membuat `hasil_peserta_tryout(kode)`. Satu aplikasi berarti
-- orang yang punya akun (mandiri atau siswa) harus bisa melihat hasil yang
-- sama di berandanya tanpa kode. Isi fungsinya dipindah ke
-- `hasil_tryout_learner(learner)` (internal), lalu dua pintu memanggilnya:
--   * hasil_peserta_tryout(kode)  - peserta berkode (anon), seperti sebelumnya
--   * hasil_tryout_saya()         - akun yang login, lewat learners.profile_id
-- Aturannya tetap: hanya percobaan terkirim pada paket `kind = 'tryout'` yang
-- hasilnya dibuka admin; tanpa kunci jawaban.
-- ADITIF dalam perilaku: hasil_peserta_tryout memberi keluaran yang sama.
-- ============================================================

create or replace function hasil_tryout_learner(p_learner uuid, p_nama text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_paket jsonb := '[]'::jsonb;
  v_menunggu jsonb := '[]'::jsonb;
  q record;
begin
  for q in
    select z.id, z.title, z.settings, a.id as attempt_id, a.submitted_at, a.total_score
    from attempts a
    join quizzes z on z.id = a.quiz_id
    where a.learner_id = p_learner
      and a.submitted_at is not null
      and z.kind = 'tryout'
    order by a.submitted_at desc
  loop
    if coalesce((q.settings ->> 'hasil_dibuka')::boolean, false) is not true then
      v_menunggu := v_menunggu || jsonb_build_object('judul', q.title, 'quiz_id', q.id);
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
                   'id', s.id, 'nomor', s.n, 'bobot', s.weight, 'kompetensi', s.kompetensi,
                   'skor', s.skor, 'skor_rata', s.rata
                 ) order by s.n), '[]'::jsonb)
        from (
          select qs.id, qs.weight, qs.kompetensi,
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

  return jsonb_build_object('nama', p_nama, 'paket', v_paket, 'menunggu', v_menunggu);
end $$;

revoke all on function hasil_tryout_learner(uuid, text) from public, anon, authenticated;

create or replace function hasil_peserta_tryout(p_kode text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_learner learners%rowtype;
begin
  select * into v_learner
  from learners
  where kode_peserta_bersih(p_kode) <> '' and upper(access_code) = kode_peserta_bersih(p_kode)
  limit 1;
  if not found then
    return null;
  end if;
  return hasil_tryout_learner(v_learner.id, v_learner.name);
end $$;

create or replace function hasil_tryout_saya()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_learner learners%rowtype;
begin
  if auth.uid() is null then
    return null;
  end if;
  select * into v_learner from learners where profile_id = auth.uid();
  if not found then
    return jsonb_build_object('nama', null, 'paket', '[]'::jsonb, 'menunggu', '[]'::jsonb);
  end if;
  return hasil_tryout_learner(v_learner.id, v_learner.name);
end $$;

grant execute on function hasil_peserta_tryout(text) to anon, authenticated;
grant execute on function hasil_tryout_saya() to authenticated;
