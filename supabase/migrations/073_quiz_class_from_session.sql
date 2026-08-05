-- ============================================================
-- Kuis bersesi selalu tahu kelasnya
--
-- `quiz_roster()` mencari murid lewat `quizzes.class_id`. Kuis yang dibuat dari
-- sebuah sesi hanya mengisi `session_id`, sehingga rosternya kosong, murid
-- jatuh ke mode tamu — dan attempt tamu justru DITOLAK untuk kuis bersesi
-- (policy di migrasi 071). Hasilnya jalan buntu yang sunyi: murid tidak bisa
-- mengerjakan dan tidak ada pesan yang menjelaskan kenapa.
--
-- Dijaga trigger, bukan hanya diperbaiki di sisi aplikasi, karena kuis bersesi
-- bisa lahir dari beberapa tempat: dasbor tutor, halaman sesi Tera nanti, atau
-- skrip. Satu tempat yang menjamin lebih murah daripada tiga tempat yang harus
-- ingat.
--
-- Kelas hanya diisi kalau masih kosong. Kuis yang sengaja diarahkan ke kelas
-- lain (mis. sesi gabungan) tidak ditimpa.
-- ============================================================

create or replace function fill_quiz_class_from_session()
returns trigger
language plpgsql
as $$
begin
  if new.session_id is not null and new.class_id is null then
    select s.class_id into new.class_id from sessions s where s.id = new.session_id;
  end if;
  return new;
end $$;

drop trigger if exists quiz_class_from_session on quizzes;
create trigger quiz_class_from_session
  before insert or update of session_id, class_id on quizzes
  for each row execute function fill_quiz_class_from_session();

-- Kuis bersesi yang terlanjur dibuat sebelum trigger ini ada.
update quizzes q
set class_id = s.class_id
from sessions s
where q.session_id = s.id
  and q.class_id is null;
