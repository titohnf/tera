-- ============================================================
-- Mengulang yang salah saja
--
-- Sesudah 131, sepuluh soal berakhir di halaman yang menyebut nomor mana yang
-- salah, apa jawaban anaknya, dan apa kuncinya. Yang tidak ada di halaman itu
-- adalah pintu keluar yang paling masuk akal sesudah membacanya: mengerjakan
-- ULANG soal yang salah tadi. Yang tersedia cuma "Ulangi Topik Ini", yang
-- mengundi sepuluh soal baru — termasuk mengundi ulang soal yang sudah benar,
-- dan belum tentu memuat satu pun soal yang barusan salah.
--
-- Fungsi ini membuka sesi baru yang isinya PERSIS soal yang belum penuh
-- nilainya di sesi sumber. Sesi baru, bukan sesi lama yang dibuka lagi:
-- `practice_answers` itu catatan yang bertambah, tidak pernah disunting, dan
-- riwayat "pernah salah lalu diperbaiki" justru bahan yang dipakai halaman
-- rincian topik untuk berkata "5 soal pernah dijawab ulang, 3 membaik".
--
-- Yang ikut: nilainya kurang dari penuh (termasuk yang dapat sebagian), DAN
-- soal yang tidak terjawab sama sekali. Yang terakhir cuma bisa terjadi pada
-- sesi lama yang ditinggalkan lalu tertutup — tapi soal yang tidak dijawab
-- jelas bukan soal yang sudah dikuasai, dan melewatkannya di sesi perbaikan
-- berarti soal itu tidak akan pernah kembali kecuali kebetulan terundi.
--
-- Urutannya mengikuti urutan di sesi sumber (`ord`), bukan diacak: anak yang
-- baru saja membaca "nomor 4, 7, dan 9 salah" mengerjakan ketiganya dalam
-- urutan yang sama dengan yang baru dibacanya.
--
-- `subject_id` dan `group_ids` disalin dari sesi sumber supaya sesi perbaikan
-- tetap punya asal-usul: halaman hasilnya butuh keduanya untuk "Ulangi Topik
-- Ini", dan sesi tanpa topik adalah sesi yang tidak bisa dilanjutkan ke mana
-- pun.
--
-- Gerbangnya sama dengan 131 — `practice_actor()` DAN sesi sumber yang sudah
-- selesai. Sesi yang masih berjalan tidak punya "soal yang salah"; yang ada
-- baru soal yang belum dijawab.
-- ============================================================

create or replace function practice_open_retry_session(
  p_session_id uuid,
  p_access_code text default ''
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_learner uuid;
  v_items uuid[];
  v_subject uuid;
  v_groups uuid[];
  v_session uuid;
begin
  select ps.learner_id, ps.subject_id, ps.group_ids
    into v_learner, v_subject, v_groups
  from practice_sessions ps
  where ps.id = p_session_id
    and ps.finished_at is not null
    and ps.learner_id = practice_actor(coalesce(p_access_code, ''), ps.learner_id);

  if v_learner is null then return null; end if;

  select array_agg(i.item_id order by i.ord)
    into v_items
  from practice_sessions ps
  cross join lateral unnest(ps.item_ids) with ordinality as i(item_id, ord)
  left join lateral (
    select a.score, a.max_score
    from practice_answers a
    where a.session_id = ps.id and a.question_bank_item_id = i.item_id
    order by a.answered_at desc
    limit 1
  ) pa on true
  where ps.id = p_session_id
    -- Belum penuh nilainya, ATAU belum dijawab sama sekali. `max_score <= 0`
    -- ikut dianggap belum penuh, sejalan dengan migrasi 130: soal berbobot nol
    -- yang dijawab nol bukan soal yang sudah dikuasai.
    and (
      pa.score is null
      or coalesce(pa.max_score, 0) <= 0
      or coalesce(pa.score, 0) < pa.max_score
    );

  if v_items is null or cardinality(v_items) = 0 then return null; end if;

  insert into practice_sessions (learner_id, subject_id, group_ids, question_count, item_ids)
  values (v_learner, v_subject, coalesce(v_groups, '{}'), cardinality(v_items), v_items)
  returning id into v_session;

  return v_session;
end;
$$;

notify pgrst, 'reload schema';
