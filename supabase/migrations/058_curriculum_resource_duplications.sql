-- Tracks which Google Drive files behind a materi/bank soal/asesmen link
-- have already been duplicated into the shared "Materi dan Bank Soal"
-- Drive folder (a manual, one-off copy process — see admin request in
-- app history). Keyed by the source file's Drive file ID (extracted from
-- the docs.google.com/drive.google.com link), not by our own row ids,
-- since the same underlying file can be linked from multiple sessions/rows.
create table curriculum_resource_duplications (
  id uuid primary key default uuid_generate_v4(),
  drive_file_id text not null unique,
  duplicated_at timestamptz not null default now()
);

alter table curriculum_resource_duplications enable row level security;

create policy "Admins manage curriculum resource duplications"
  on curriculum_resource_duplications for all using (is_admin());

-- Seed: the 20 files successfully copied in the initial one-off duplication
-- pass (the other 5 source files couldn't be read — sharing too restrictive
-- for the copying account — and 8 Google Forms links were skipped since
-- their published /forms/d/e/ URLs don't expose the form's real file id).
insert into curriculum_resource_duplications (drive_file_id) values
  ('15TX-wUs1PQZURCAZQtkREIVCyqbOEwEo'),
  ('1d3hDi0NO4yLtLJbh755yB6euMn7wkpaAdK_GqQtvizk'),
  ('1mHpvfrX9a-GAyRwQJecILMTtfsfuUBy6'),
  ('1auYj4uVTNbvpatsIj54PkAHH5rCvgbdS'),
  ('1QPTKx2qgiZiIdvaKbSymzcBjAMenW83Y'),
  ('15X609W6_NI3EzKxxF8aW1rCPi0JOgCvg'),
  ('1AKYLnzm6Vzjaa5unpE1Aa2ZPafizIB4O'),
  ('1vl7DpGERumSwHgw6bXX_u9WsvXMB7RwpIWf14HgjZ90'),
  ('1miHzBBPo_CIdJN-kdw0M50SiTk9a8xZ2'),
  ('1TfHX6zqkqFu742pG4Ik3XKKUk5OrA4X84C4iPttOHY0'),
  ('14-9SfPnbMyw_L2v7aW5lwY7YTdTAaI70'),
  ('1pzNZLClKZgWtFZh2JOjVFjRACJzc1ugp'),
  ('19rqXb_7HXLjFOIAXHYer5tOKKEChI0Ub'),
  ('1708MtaYm5zhXb6azIGZ38TjnO8iQl3a0'),
  ('18iRS2f2UAZtuMLPMs9YX24Owibkp2VKv'),
  ('1g1VeoeL5Pi-Uyw9cZGD6l0x_mm-CrN_L'),
  ('1Hvsk-ZbF5WJ5PeHjBkn6KBkpjwvjakQT'),
  ('1JLTPOsZXCbNLLlNDPHRgZ6bX8CoSfe0I'),
  ('1qyBJ6-KlRLwIS-KXGvvUJliUu46o1mrs'),
  ('1bfuWHv4tRjO6ZX2juDkUFCSHw5In6kuf')
on conflict (drive_file_id) do nothing;
