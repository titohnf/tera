-- ============================================================
-- PERFORMANCE NOTES — SEPARATE BY CATEGORY
-- Previously all categories (Attitude, Progress, Recommendation)
-- were flattened into a single body per (session_id, student_id),
-- losing the per-category split on reload. Store one row per
-- category instead so each stays independently editable.
-- ============================================================
alter table performance_notes add column category text not null default '_';

update performance_notes pn
set category = coalesce(
  (select pnt.category from performance_note_templates pnt where pnt.id = pn.template_id),
  '_'
);

alter table performance_notes drop constraint performance_notes_session_id_student_id_key;
alter table performance_notes add constraint performance_notes_session_id_student_id_category_key
  unique (session_id, student_id, category);
