-- ============================================================
-- Asesmen ujian Misi yang topiknya sudah diganti ikut dihapus
--
-- Di 217, asesmen ujian lama hanya dihapus bila belum ada nilainya. Tetapi
-- nilai yang diisi sistem dari hasil ujian siswa juga "nilai", jadi sesi yang
-- topiknya sudah diganti tetap tersangkut pada asesmen ujian Misi lama (dan
-- pembahasannya yang wajib). Sekarang hanya nilai yang diketik tutor yang
-- menahan penghapusan.
-- ============================================================

create or replace function sinkron_ujian_misi(p_session uuid)
returns void
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_tutor uuid;
  v_kelas uuid;
  v_jadwal timestamptz;
  v_topik_ids text[];
begin
  select s.tutor_id, s.class_id, s.scheduled_at into v_tutor, v_kelas, v_jadwal
  from sessions s where s.id = p_session;
  if v_tutor is null then return; end if;

  -- Topik Misi yang dipilih sesi: dari topik utama dan CP yang dicentang.
  select coalesce(array_agg(distinct g.topik_id), '{}') into v_topik_ids
  from sessions s
  join curriculum_topics c
    on c.id = s.curriculum_topic_id or c.id = any(coalesce(s.selected_cp_ids, '{}'))
  join curriculum_topic_groups g on g.id = c.group_id
  where s.id = p_session and g.topik_id is not null;

  -- Asesmen topik yang sudah diganti: hapus, kecuali ada nilai yang DIKETIK
  -- tutor (`graded_by` terisi). Nilai hasil sistem (`graded_by` kosong) bukan
  -- alasan menahannya: itu salinan hasil ujian di Misi yang tetap tersimpan di
  -- sana dan akan terisi lagi kalau topiknya dipilih ulang. Menahannya membuat
  -- sesi tersangkut pada asesmen topik yang sudah tidak dipakai.
  delete from assessments a
  where a.session_id = p_session
    and a.topik_id is not null
    and not (a.topik_id = any(v_topik_ids))
    and not exists (
      select 1 from assessment_results r
      where r.assessment_id = a.id and r.graded_by is not null
    );

  insert into assessments (session_id, created_by, title, description, max_score, topik_id)
  select p_session, v_tutor, 'Ujian ' || t.id || ' · ' || t.nama,
         'Dikerjakan siswa di Misi. Nilai terisi otomatis dari hasil ujian.', 100, t.id
  from topik t
  where t.id = any(v_topik_ids)
  on conflict (session_id, topik_id) where topik_id is not null do nothing;

  -- Nilai: ujian putaran pertama, dalam skala 0-100. Hanya siswa yang sudah
  -- menuntaskan putaran itu (skor_putaran_1 null = belum dihitung), dan hanya
  -- baris yang belum dinilai tutor.
  insert into assessment_results (assessment_id, student_id, score, graded_at)
  select a.id, cs.student_id, round(sk.skor_putaran_1 * 100, 2), now()
  from assessments a
  join class_students cs
    on cs.class_id = v_kelas
   and cs.enrolled_at <= v_jadwal
   and (cs.unenrolled_at is null or cs.unenrolled_at > v_jadwal)
  join learners l on l.profile_id = cs.student_id
  join lateral (
    select p.id from paket_topik p
    where p.topik_id = a.topik_id and p.jenis = 'ujian'
    order by p.nomor limit 1
  ) pk on true
  join lateral skor_paket_topik(l.id, pk.id) sk on sk.skor_putaran_1 is not null
  where a.session_id = p_session and a.topik_id is not null
  on conflict (assessment_id, student_id) do update
    set score = excluded.score, graded_at = excluded.graded_at
    where assessment_results.graded_by is null;
end;
$$;

revoke all on function sinkron_ujian_misi(uuid) from public, anon, authenticated;
grant execute on function sinkron_ujian_misi(uuid) to service_role;

notify pgrst, 'reload schema';
