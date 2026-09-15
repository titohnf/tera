-- ============================================================
-- Kapan invoice dan pengingatnya terakhir dikirim ke orang tua
--
-- GEJALANYA, 15 September 2026. Albirru dan Qirania sudah mencicil, tapi
-- invoicenya berlabel "Terkirim", sementara lima siswa lain yang juga dikirimi
-- pesan hari itu tetap "Angsuran". Status mereka tertimpa `sent` beberapa menit
-- sesudah pesan dikirim, dan satu-satunya jalan di kode yang bisa menulis
-- `sent` di atas invoice berpembayaran adalah "Kirim Ulang Invoice". Admin
-- yakin yang dikirim pengingat. Tidak ada satu pun catatan yang bisa memutus
-- mana yang benar: `status` hanya menyimpan keadaan tagihan, bukan riwayat
-- pengiriman, dan "Kirim Pengingat" tidak meninggalkan jejak apa pun.
--
-- DUA KOLOM, BUKAN SATU. Mengirim invoice dan mengirim pengingat adalah dua
-- pesan WhatsApp yang berbeda isinya, dan pertanyaan admin juga dua: "tagihan
-- ini sudah sampai ke orang tua belum" dan "kapan terakhir diingatkan".
-- Menggabungkannya membuat pengingat kemarin terbaca seolah invoice baru
-- dikirim kemarin.
--
-- Keduanya dicatat server saat tombolnya ditekan, jadi artinya "admin membuka
-- WhatsApp dengan pesan itu", bukan jaminan pesannya benar-benar terkirim —
-- WhatsApp tidak memberi tahu aplikasi apa pun soal itu.
--
-- Invoice lama dibiarkan null. Tidak ada data yang bisa dipakai untuk mengisi
-- mundur, dan tanggal karangan lebih buruk daripada "belum tercatat".
-- ============================================================

alter table invoices
  add column if not exists sent_at timestamptz,
  add column if not exists reminded_at timestamptz;

comment on column invoices.sent_at is
  'Terakhir kali "Kirim Invoice"/"Kirim Ulang Invoice" ditekan. Null = belum tercatat (termasuk semua invoice sebelum migrasi 195).';
comment on column invoices.reminded_at is
  'Terakhir kali "Kirim Pengingat" ditekan. Null = belum tercatat.';
