alter table class_slots add column if not exists tutor_ids uuid[] not null default '{}';

-- Backfill: every existing slot has exactly one subject/tutor pair.
update class_slots set tutor_ids = array[tutor_id] where tutor_id is not null and tutor_ids = '{}';

drop policy if exists "Tutors view their class slots" on class_slots;
create policy "Tutors view their class slots" on class_slots
  for select using (tutor_id = auth.uid() or auth.uid() = any(tutor_ids));
