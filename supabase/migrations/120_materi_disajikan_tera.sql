-- ============================================================
-- Materi disajikan Tera, bukan ditautkan ke Drive
--
-- Tiga migrasi terakhir mengejar hal yang sama dari arah yang salah. 117
-- membetulkan tautannya (ke salinan, bukan berkas sumber), 118 dan 119
-- membetulkan siapa yang boleh membacanya. Yang tidak bisa dibetulkan dari
-- database: berkas Drive dijaga oleh identitas GOOGLE, sedangkan yang kita
-- kenal adalah identitas TERA. Selama materinya berupa tautan Drive, cuma ada
-- dua pilihan — dibuka untuk siapa saja yang punya tautannya, atau dibagikan
-- satu per satu ke alamat Gmail yang belum tentu dipakai anaknya saat membuka
-- halaman. Keduanya menjawab pertanyaan yang berbeda dari yang ditanyakan.
--
-- Jadi berkasnya dipindahkan ke sisi kita. Salinan di Drive dibaca sekali oleh
-- service account, dijadikan PDF, dan disimpan di bucket privat ini. Yang
-- menyajikannya `/api/materi/[id]`, yang memeriksa sesi Tera lebih dulu. Drive
-- tetap tertutup rapat — tidak ada satu pun berkas yang perlu dibuka untuk
-- "siapa saja yang punya link".
--
-- KENAPA PDF, bukan berkas aslinya. Materi yang ada berbentuk .docx, .pptx,
-- .pdf, dan Google Docs. Browser cuma bisa MENAMPILKAN yang terakhir dan PDF;
-- .docx dan .pptx akan terunduh, bukan terbaca — dan bingkai pratinjau Drive,
-- yang selama ini menutupi perbedaan itu, justru yang sedang kita tinggalkan
-- karena ia menuntut login Google. Konversinya sekali, saat pemindahan.
--
-- Bucket PRIVAT, tidak seperti `avatars` (035) dan `quiz-uploads` (061) yang
-- keduanya publik. Bucket publik akan mengulangi persis masalah "siapa saja
-- yang punya link" yang sedang ditinggalkan, cuma dengan nama host berbeda.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('materi', 'materi', false)
on conflict (id) do nothing;

-- Tidak ada policy `select` untuk siapa pun di sini, dan itu disengaja.
-- Satu-satunya pembaca adalah `/api/materi/[id]`, yang memakai service role
-- SETELAH memutuskan sendiri bahwa pemintanya berhak — dan keputusan itu
-- diambil dengan menanyakan `curriculum_resources` lewat client sesi, jadi
-- yang menegakkannya tetap policy 057/076/119, bukan kode rutenya.
--
-- Menaruh policy storage yang setara di sini akan membuat aturan yang sama
-- ditulis dua kali di dua tempat yang bisa berbeda pendapat. Yang paling
-- mungkin terjadi kemudian: salah satunya diperbarui, satunya tidak.
create policy "Admins manage materi files"
  on storage.objects for all
  using (bucket_id = 'materi' and is_admin());

-- Di mana PDF-nya duduk. Menumpang tabel duplikasi karena kuncinya sama —
-- id berkas SUMBER — dan karena berkas yang sama bisa ditautkan dari banyak
-- baris materi sekaligus (lihat 058). Satu PDF per berkas, bukan per baris.
alter table curriculum_resource_duplications add column pdf_path text;

notify pgrst, 'reload schema';
