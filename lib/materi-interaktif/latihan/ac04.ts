import { bs, debat, isi, kata, pg, type DataMateri } from '../bersama'

/**
 * Bahan latihan AC-04 (Pola bukan bilangan: gambar, warna, suara).
 *
 * Konsep yang diuji bank soal topik ini: SATUAN POLA (bagian terkecil yang
 * berulang, bisa 2, 3, atau 4 unsur), melanjutkan pola di akhir, mengisi bagian
 * yang HILANG DI TENGAH (dengan melihat posisi dalam satu putaran, bukan
 * menyalin unsur sebelumnya), pola gabungan (warna + bentuk, ukuran + warna),
 * pola bunyi, dan posisi ke-n (unsur ke-7 pada satuan 3 unsur = unsur ke-1).
 */
export const DATA_AC04: DataMateri = {
  fakta: [
    bs('Satuan pola adalah bagian terkecil yang berulang.', true, 'Pola "merah, biru, merah, biru" berulang dari "merah, biru".'),
    bs('Satuan pola selalu terdiri dari tepat dua unsur.', false, 'Bisa 2, 3, 4, atau lebih. "Merah, biru, hijau" punya 3 unsur.'),
    bs('Pola "A, A, B, A, A, B" punya satuan pola "A, A, B".', true, '"A, A, B" adalah bagian terkecil yang berulang.'),
    bs('Pola "kuning, hijau, kuning, hijau" punya satuan pola "kuning, hijau".', true, 'Dua unsur yang berulang.'),
    bs('Untuk mengisi bagian yang hilang di tengah, kita perlu tahu posisinya dalam satu putaran satuan pola.', true, 'Cari tempat kosong itu urutan ke berapa dalam satuan polanya.'),
    bs('Pada pola dengan satuan 3 unsur, unsur ke-7 sama dengan unsur ke-1.', true, 'Dua putaran penuh = 6 unsur. Unsur ke-7 mulai putaran baru, sama dengan unsur ke-1.'),
    bs('Cara mengisi pola: pilih unsur yang paling banyak muncul.', false, 'Jangan menebak dari yang terbanyak. Lihat satuan polanya.'),
    bs('Pola "tepuk, tepuk, diam, tepuk, tepuk, diam" adalah pola bunyi yang berulang.', true, 'Satuan polanya "tepuk, tepuk, diam".'),
    bs('Pola bisa dibuat dari warna, bentuk, ukuran, dan bunyi.', true, 'Apa pun yang berulang secara teratur membentuk pola.'),
    bs('Pada pola "merah-segitiga, biru-lingkaran, merah-segitiga, ...", satuan polanya adalah "merah-segitiga, biru-lingkaran".', true, 'Warna dan bentuk berubah bersama sebagai satu unsur.'),
  ],
  debat: [
    debat('Pola bunyi: tepuk, diam, diam, tepuk, ___, diam, tepuk, diam, diam.', ['Bono: "Yang hilang tepuk, karena sebelum kosong ada tepuk."', 'Rani: "Satuan polanya tepuk, diam, diam. Tempat kosong urutan ke-2, jadi diam."'], 1, 'Jangan menyalin unsur sebelumnya. Lihat urutan ke berapa tempat kosong dalam satuan pola.'),
    debat('Pola: A, A, B, A, A, B, A, A, B.', ['Lia: "Satuan polanya A, A, B."', 'Ali: "Satuan polanya A, B."'], 0, 'A, A, B adalah bagian terkecil yang berulang utuh.'),
    debat('Pola: hijau-panjang, hijau-panjang, merah-pendek, hijau-panjang, hijau-panjang, merah-pendek.', ['Sinta: "Satuan polanya hijau-panjang, merah-pendek."', 'Beni: "Satuan polanya hijau-panjang, hijau-panjang, merah-pendek."'], 1, 'Satuannya 3 unsur. Kalau hanya 2 unsur, polanya tidak berulang dengan benar.'),
    debat('Pola: merah, biru, hijau, merah, ___, hijau, merah, biru, hijau.', ['Rara: "Yang hilang merah, karena di sebelumnya merah."', 'Dini: "Satuannya merah, biru, hijau. Tempat kosong urutan ke-2, jadi biru."'], 1, 'Tempat kosong ada di urutan ke-2 dalam satu putaran. Urutan ke-2 adalah biru.'),
    debat('Pola dengan satuan 4 unsur.', ['Tia: "Unsur ke-8 sama dengan unsur ke-4 dalam satuan pola."', 'Dodi: "Unsur ke-8 sama dengan unsur ke-8 dalam satuan pola."'], 0, 'Satuan pola hanya punya 4 unsur. Putaran ke-2 berakhir di unsur ke-8, sama dengan unsur ke-4.'),
  ],
  bank: [
    pg('Pola: merah, biru, merah, biru, merah, ___. Apa warna selanjutnya?', ['biru', 'merah', 'hijau', 'kuning'], 0, 'Satuan polanya merah, biru. Setelah merah datang biru.'),
    pg('Pola: kuning, kuning, hijau, kuning, kuning, hijau, ___, ___. Dua unsur berikutnya adalah...', ['kuning, kuning', 'hijau, kuning', 'kuning, hijau', 'hijau, hijau'], 0, 'Satuan polanya kuning, kuning, hijau. Putaran baru dimulai: kuning, kuning.'),
    pg('Pola: merah, biru, hijau, merah, ___, hijau, merah, biru, hijau. Apa yang hilang?', ['biru', 'merah', 'hijau', 'kuning'], 0, 'Satuannya merah, biru, hijau. Tempat kosong ada di urutan ke-2: biru.'),
    pg('Pola bunyi: ketuk, ketuk, diam, ketuk, ketuk, ___, ketuk, ketuk, diam. Apa bunyi yang hilang?', ['diam', 'ketuk', 'tepuk', 'petik'], 0, 'Satuannya ketuk, ketuk, diam. Tempat kosong di urutan ke-3: diam.'),
    kata('Pola: besar, kecil, kecil, besar, kecil, ___, besar, kecil, kecil. Isilah bagian yang hilang.', ['kecil'], 'Satuannya besar, kecil, kecil. Urutan ke-3 adalah kecil.'),
    pg('Pola: kotak, bulat, kotak, bulat, kotak, bulat. Satuan polanya adalah...', ['kotak, bulat', 'kotak', 'kotak, bulat, kotak', 'bulat, kotak, bulat'], 0, 'Bagian terkecil yang berulang adalah kotak, bulat.'),
    pg('Pola gabungan: merah-segitiga, biru-lingkaran, merah-segitiga, biru-lingkaran, merah-segitiga, ___.', ['biru-lingkaran', 'merah-segitiga', 'biru-segitiga', 'merah-lingkaran'], 0, 'Warna dan bentuk berubah bersama. Setelah merah-segitiga datang biru-lingkaran.'),
    pg('Satuan polanya merah, kuning, biru, hijau. Pola: merah, kuning, biru, hijau, merah, kuning, biru, hijau, merah, ___. Apa yang berikutnya?', ['kuning', 'merah', 'biru', 'hijau'], 0, 'Putaran ke-3 baru mulai dengan merah. Berikutnya urutan ke-2: kuning.'),
    isi('Satuan pola punya 3 unsur. Unsur ke-7 sama dengan unsur ke berapa dalam satuan pola?', '1', '6 unsur = 2 putaran penuh. Unsur ke-7 memulai putaran baru, jadi sama dengan unsur ke-1.'),
    isi('Satuan pola punya 4 unsur. Unsur ke-8 sama dengan unsur ke berapa dalam satuan pola?', '4', '8 unsur = 2 putaran penuh. Unsur terakhir sama dengan unsur ke-4.'),
    pg('Kamu ingin membuat pola dengan satuan "kuning, kuning, hijau, biru" yang diulang dua kali. Deretan manakah yang tepat?', ['kuning, kuning, hijau, biru, kuning, kuning, hijau, biru', 'kuning, hijau, biru, kuning, hijau, biru', 'kuning, kuning, hijau, hijau, biru, biru', 'biru, hijau, kuning, kuning, biru, hijau'], 0, 'Tulis satuannya utuh, lalu ulangi persis dua kali.'),
    pg('Pola: bintang, bulan, bulan, bintang, bulan, bulan, ___. Apa bentuk selanjutnya?', ['bintang', 'bulan', 'matahari', 'awan'], 0, 'Satuannya bintang, bulan, bulan. Putaran baru dimulai dengan bintang.'),
    kata('Pola: segitiga, segitiga, persegi, segitiga, segitiga, persegi, ___. Isilah dengan satu kata.', ['segitiga'], 'Satuannya segitiga, segitiga, persegi. Putaran baru dimulai dengan segitiga.'),
  ],
}
