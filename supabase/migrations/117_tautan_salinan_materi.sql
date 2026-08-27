-- Tautan salinan, bukan cuma tanda bahwa salinannya ada.
--
-- Migrasi 058 menyimpan satu hal saja: id berkas SUMBER yang sudah pernah
-- disalin ke folder "Materi dan Bank Soal". Id salinannya dibuang begitu saja
-- (`runResourceDuplication` memanggil files.copy dengan `fields: 'id'` lalu
-- tidak memakai hasilnya). Akibatnya centang hijau di /admin/materi-latihan-soal
-- berkata "sudah diduplikat" sementara tautan yang diklik tetap menuju berkas
-- sumber — berkas milik tutor, yang justru meminta izin akses saat dibuka.
-- Centang yang benar tapi tautan yang salah lebih menyesatkan daripada tidak
-- ada centang sama sekali.
--
-- Yang disimpan tautan penuhnya, bukan idnya. Bentuk tautan yang benar
-- tergantung jenis berkas — salinan Google Docs asli hidup di
-- docs.google.com/document/d/.../edit, salinan .docx/.pptx/.pdf di
-- drive.google.com/file/d/.../view — dan Drive sendiri yang tahu bedanya
-- lewat `webViewLink`. Menyusunnya sendiri dari id berarti menebak.
alter table curriculum_resource_duplications add column copy_link text;

-- Isian untuk 20 berkas yang disalin di putaran pertama. Pasangannya diambil
-- dari kolom "Link Hasil Duplikat" pada spreadsheet "Link Materi dan Bank Soal
-- (Lengkap)" di folder yang sama — catatan manual yang dibuat saat penyalinan
-- itu berjalan, satu-satunya tempat pasangan ini pernah tercatat.
update curriculum_resource_duplications as d
set copy_link = v.copy_link
from (values
  ('15TX-wUs1PQZURCAZQtkREIVCyqbOEwEo', 'https://drive.google.com/file/d/1xSgbIw-aJjK4PZY460aM2GyHCYXq9c0G/view'),
  ('1d3hDi0NO4yLtLJbh755yB6euMn7wkpaAdK_GqQtvizk', 'https://docs.google.com/document/d/13LeCvH2NtWj3W5d9PWeYJDiixgdP7FmFFVkpSQkrVZ8/edit'),
  ('1mHpvfrX9a-GAyRwQJecILMTtfsfuUBy6', 'https://drive.google.com/file/d/1IPVloq3B6z4SvuuNfBP8HAQC3oVMWAJt/view'),
  ('1auYj4uVTNbvpatsIj54PkAHH5rCvgbdS', 'https://drive.google.com/file/d/1LTa4DvjHFQUToEiED85i7bUfbnztRQXV/view'),
  ('1QPTKx2qgiZiIdvaKbSymzcBjAMenW83Y', 'https://drive.google.com/file/d/1jd3CBxwbRus8Ag4rjNtnO8duMduSNDy9/view'),
  ('15X609W6_NI3EzKxxF8aW1rCPi0JOgCvg', 'https://drive.google.com/file/d/1Os2mK-X23S90at9avro7DgJA5XBrYuaW/view'),
  ('1AKYLnzm6Vzjaa5unpE1Aa2ZPafizIB4O', 'https://drive.google.com/file/d/1hVSJR33KfmOTRykLsTcdAY5C9_W9Q0Ai/view'),
  ('1vl7DpGERumSwHgw6bXX_u9WsvXMB7RwpIWf14HgjZ90', 'https://docs.google.com/document/d/1aDrXyGVwHFTIYdy1rMFcJqn23RAM_5T55ecM4ZIeXOU/edit'),
  ('1miHzBBPo_CIdJN-kdw0M50SiTk9a8xZ2', 'https://drive.google.com/file/d/1ALTJ439pYj7uAs_KGKeght6wccmMKYvb/view'),
  ('1TfHX6zqkqFu742pG4Ik3XKKUk5OrA4X84C4iPttOHY0', 'https://docs.google.com/document/d/1ui-TyBIZDsqGHvNoT46mcnJE7pjOV1P8bc-SxU58yjA/edit'),
  ('14-9SfPnbMyw_L2v7aW5lwY7YTdTAaI70', 'https://drive.google.com/file/d/1v394PPfz1nNe9-TlPYysqLyNJwP_4c1l/view'),
  ('1pzNZLClKZgWtFZh2JOjVFjRACJzc1ugp', 'https://drive.google.com/file/d/1uaIWb3OGkKDAaACzCLStFpH2MDEG9Els/view'),
  ('19rqXb_7HXLjFOIAXHYer5tOKKEChI0Ub', 'https://drive.google.com/file/d/1E73pwV2uAVK03YnlYnjxQCcvuQiULwGx/view'),
  ('1708MtaYm5zhXb6azIGZ38TjnO8iQl3a0', 'https://drive.google.com/file/d/16CRyZ4AXQGdLCntIuhZKA9N8p2bwcecN/view'),
  ('18iRS2f2UAZtuMLPMs9YX24Owibkp2VKv', 'https://drive.google.com/file/d/1jDLA56rhS9UfG_Gynxh8eTiibZ1rwOui/view'),
  ('1g1VeoeL5Pi-Uyw9cZGD6l0x_mm-CrN_L', 'https://drive.google.com/file/d/1PmsyV3UJ0cofYGbpIGOLokNnM7CWwdYv/view'),
  ('1Hvsk-ZbF5WJ5PeHjBkn6KBkpjwvjakQT', 'https://drive.google.com/file/d/1spDO3xaEwZuUpR4xOQCt8eL3znwtnpaU/view'),
  ('1JLTPOsZXCbNLLlNDPHRgZ6bX8CoSfe0I', 'https://drive.google.com/file/d/1F7_he49ouKeEuLjKEHRQF3tjAD3s7WTF/view'),
  ('1qyBJ6-KlRLwIS-KXGvvUJliUu46o1mrs', 'https://drive.google.com/file/d/1RjiQXlN65PDMJpzrvK9opwB36S5-Je7j/view'),
  ('1bfuWHv4tRjO6ZX2juDkUFCSHw5In6kuf', 'https://drive.google.com/file/d/1tG17nZNC8GIyreaeq8_aYgF9acDyuY2O/view')
) as v(drive_file_id, copy_link)
where d.drive_file_id = v.drive_file_id;
