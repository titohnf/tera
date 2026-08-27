-- ============================================================
-- Materi yang siap dibaca ditandai di barisnya sendiri
--
-- Sampai sekarang "materi ini bisa dibuka anak atau tidak" dijawab dengan
-- bertanya ke `curriculum_resource_duplications`: ada `pdf_path`-nya berarti
-- PDF-nya duduk di bucket `materi`, dan itu yang disajikan. Ukuran itu benar
-- selama bucket adalah tempat berkasnya berada.
--
-- Sejak materi berkumpul di `Materi Kurikulum/` pada Drive milik akun bimbel,
-- bucket turun jadi jaring pengaman dan akan dikosongkan. Begitu itu terjadi,
-- `pdf_path` lenyap untuk SEMUA baris — dan ukuran lama menjawab "tidak ada
-- satu pun materi yang bisa dibaca". Bukan error, bukan halaman rusak: cuma
-- angka nol di seluruh mapel, jenis kegagalan yang paling lama tidak ketahuan
-- karena tidak ada yang mengeluh selain anak yang menyangka memang belum ada.
--
-- Jadi ukurannya dipindahkan ke sini, ke baris materinya sendiri, dan berhenti
-- bergantung pada tempat berkasnya kebetulan disimpan hari ini.
--
-- KENAPA TIMESTAMP, BUKAN BOOLEAN. Yang perlu diketahui bukan cuma "siap",
-- melainkan "siap, dan itu diperiksa kapan". Sebuah berkas Drive bisa dihapus,
-- dipindahkan keluar folder, atau izinnya dicabut tanpa memberi tahu siapa pun,
-- dan satu-satunya cara tahu penandaan ini basi adalah melihat umurnya. Boolean
-- `true` yang ditulis tiga bulan lalu terlihat persis sama dengan yang ditulis
-- pagi tadi.
--
-- Null berarti BELUM TERBUKTI, bukan rusak. Baris baru lahir null — admin baru
-- memasukkan tautannya, pemindainya belum berjalan — dan selama null materinya
-- tidak disebut kepada anak. Diam lebih baik daripada menjanjikan bahan yang
-- berakhir di layar "Anda memerlukan akses".
--
-- Yang mengisi kolom ini `scripts/pindai-materi-drive.mjs`, dijalankan dengan
-- kunci service account. Ia tidak bisa diisi dari dalam aplikasi: memeriksa
-- satu berkas menuntut satu panggilan Drive API, dan halaman yang menampilkan
-- daftar mapel tidak boleh menunggu lima puluh panggilan sebelum menggambar.
-- ============================================================

alter table curriculum_resources
  add column if not exists readable_at timestamptz;

comment on column curriculum_resources.readable_at is
  'Kapan terakhir dipastikan berkasnya benar-benar bisa diambil dan ditampilkan '
  '(PDF atau Google Docs di folder bimbel). Null = belum terbukti, dan selama '
  'null materinya tidak ditampilkan ke pelajar. Diisi scripts/pindai-materi-drive.mjs.';

-- Setiap kueri materi di permukaan belajar menyaring dengan kolom ini, dan
-- selalu bersama `kind`. Parsial karena baris yang null memang tidak pernah
-- dicari — yang dicari justru yang sudah terbukti.
create index if not exists curriculum_resources_readable_idx
  on curriculum_resources (kind, group_id)
  where readable_at is not null;

-- Isian awal: yang PDF-nya sudah ada di bucket hari ini memang terbukti bisa
-- dibaca — itu persis ukuran yang dipakai sampai detik ini, dan menuliskannya
-- ke kolom baru membuat perpindahan ini tidak mengubah apa pun yang dilihat
-- anak. Pemindai akan memperbaruinya dengan keadaan Drive yang sebenarnya.
update curriculum_resources r
set readable_at = now()
from curriculum_resource_duplications d
where r.kind = 'materi'
  and d.pdf_path is not null
  and r.link_url like '%' || d.drive_file_id || '%'
  and r.readable_at is null;
