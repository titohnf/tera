import { bs, debat, isi, kata, pg, type DataMateri } from '../bersama'

/**
 * Bahan latihan AC-08 (Bilangan cacah sampai 10.000).
 *
 * Konsep yang diuji bank soal topik ini: nilai tempat ribuan-ratusan-puluhan-
 * satuan, NILAI sebuah angka (7 pada 3.742 = 700), angka 0 sebagai penjaga
 * tempat (8.020 bukan 820; 2.007 bukan 270; 4.005 bukan 45), membaca dan
 * menulis bilangan, uraian (5.608 = 5.000 + 600 + 8), geser ke kanan nilainya
 * 10 kali lebih kecil, 9.999 sebelum 10.000, membandingkan dan mengurutkan
 * (mulai dari ribuan, lalu ratusan, dan seterusnya; 3.099 < 3.100), letak di
 * antara dua bilangan, dan menyusun bilangan terbesar atau terkecil dari kartu
 * angka (angka pertama tidak boleh 0).
 */
export const DATA_AC08: DataMateri = {
  fakta: [
    bs('Bilangan 10.000 dibaca "sepuluh ribu".', true, '10.000 = 10 ribuan = sepuluh ribu.'),
    bs('Pada bilangan 4.052, angka 0 di tempat ratusan boleh dihilangkan sehingga menjadi 452.', false, 'Angka 0 menjaga tempat. 4.052 dan 452 adalah dua bilangan yang berbeda.'),
    bs('Setiap kali bergeser satu tempat ke kanan (misalnya dari ribuan ke ratusan), nilainya menjadi 10 kali lebih kecil.', true, '1.000 ke 100 ke 10 ke 1: tiap langkah ke kanan dibagi 10.'),
    bs('Bilangan cacah tepat setelah 9.999 adalah 10.000.', true, '9.999 + 1 = 10.000.'),
    bs('8.999 lebih besar daripada 9.000.', false, 'Ribuannya 8 lebih kecil dari 9. Jadi 8.999 lebih kecil.'),
    bs('3.099 lebih besar dari 3.100 karena angka satuan 9 lebih besar dari 0.', false, 'Bandingkan dari ribuan dulu, lalu ratusan. Ratusan 0 lebih kecil dari 1, jadi 3.099 lebih kecil.'),
    bs('8.500 dan 8.050 pasti bernilai sama karena digit-digitnya sama.', false, 'Letak angkanya berbeda. 8.500 = 8 ribuan 5 ratusan. 8.050 = 8 ribuan 5 puluhan.'),
    bs('Jika dua bilangan empat angka punya ribuan yang sama, lihat ratusannya berikutnya.', true, 'Bandingkan dari kiri ke kanan: ribuan, ratusan, puluhan, satuan.'),
    bs('Bilangan 6.708 dibaca "enam ribu tujuh ratus delapan".', true, '6 ribuan, 7 ratusan, 0 puluhan, 8 satuan.'),
    bs('Bilangan empat angka yang paling besar adalah 9.999.', true, 'Kalau ditambah 1 menjadi 10.000, yang sudah lima angka.'),
    bs('Pada bilangan 5.702, angka 7 bernilai 700.', true, '7 ada di tempat ratusan. 7 ratusan = 700.'),
    bs('Pada bilangan 7.025, angka 2 bernilai 2.', false, '2 ada di tempat puluhan. Nilainya 20.'),
  ],
  debat: [
    debat('Nadia menulis "delapan ribu dua puluh" sebagai 820.', ['Nadia: "820. Aku tulis angkanya saja."', 'Beni: "8.020. Ratusannya 0, puluhannya 2."'], 1, '8 ribuan, 0 ratusan, 2 puluhan, 0 satuan = 8.020.'),
    debat('Made menulis "dua ribu tujuh" sebagai 270.', ['Made: "270."', 'Wayan: "2.007. Ratusan dan puluhan 0, satuannya 7."'], 1, '2 ribuan + 7 satuan = 2.007. Angka 0 menjaga ratusan dan puluhan.'),
    debat('Dimas dan Rini membandingkan 4.560 dan 4.605.', ['Dimas: "4.560 lebih besar, karena sama-sama diawali 4."', 'Rini: "Ribuan sama. Ratusan 5 lebih kecil dari 6. Jadi 4.560 lebih kecil."'], 1, 'Kalau satu tempat sama, lihat tempat berikutnya di kanannya.'),
    debat('Toni dan Lisa membandingkan 3.099 dan 3.100.', ['Toni: "3.099 lebih besar, karena 9 lebih besar dari 0."', 'Lisa: "3.100 lebih besar. Ratusan 1 lebih besar dari 0."'], 1, 'Mulai dari tempat paling kiri yang berbeda, bukan dari satuan.'),
    debat('Rini mengurutkan 4.532, 4.352, 4.523, 4.325 dari terkecil.', ['Rini: "Aku lihat satuannya saja: 2, 2, 3, 5."', 'Dedi: "Mulai dari ribuan, lalu ratusan, puluhan, dan satuan."'], 1, 'Urutan bilangan ditentukan oleh tempat paling kiri yang berbeda.'),
    debat('Lina menulis "empat ribu lima" sebagai 45. Bayu menulisnya 4.005.', ['Lina: "45. Itu sudah benar."', 'Bayu: "4.005. Ribuannya 4, ratusan dan puluhan 0, satuannya 5."'], 1, '45 hanya empat puluh lima. 4.005 baru empat ribu lima.'),
    debat('Randi ingin bilangan SEKECIL MUNGKIN dari kartu 0, 4, 8, 1.', ['Randi: "0.148, karena 0 paling kecil."', 'Sari: "1.048. Angka pertama tidak boleh 0."'], 1, 'Angka 0 di depan membuat bilangannya bukan lagi empat angka.'),
  ],
  bank: [
    pg('Bilangan "lima ribu dua ratus tiga puluh satu" ditulis dengan angka...', ['5.231', '5.321', '5.213', '5.132'], 0, '5 ribuan, 2 ratusan, 3 puluhan, 1 satuan.'),
    pg('Angka 6.130 dibaca...', ['enam ribu seratus tiga puluh', 'enam ribu tiga ratus sepuluh', 'enam ratus tiga puluh', 'enam ribu satu ratus tiga'], 0, '6 ribuan, 1 ratusan, 3 puluhan.'),
    pg('Nilai angka 7 pada bilangan 3.742 adalah...', ['700', '70', '7', '7.000'], 0, '7 ada di tempat ratusan. Nilainya 700.'),
    isi('Berapa nilai angka 3 pada bilangan 7.934?', '30', '3 ada di tempat puluhan. Nilainya 30.'),
    isi('Tuliskan dengan angka: "tujuh ribu empat puluh dua".', '7042', '7 ribuan, 0 ratusan, 4 puluhan, 2 satuan = 7.042.'),
    isi('Tuliskan dengan angka: "sembilan ribu lima".', '9005', '9 ribuan + 5 satuan. Ratusan dan puluhan 0. Jadi 9.005.'),
    isi('4.205 = 4.000 + ___ + 5', '200', 'Angka 2 ada di tempat ratusan. Nilainya 200.'),
    isi('Pada bilangan 8.147, angka di tempat ribuan adalah...', '8', 'Angka paling kiri pada bilangan empat angka ada di tempat ribuan.'),
    kata('Bilangan 6.050 dibaca "enam ribu ___ puluh".', ['lima'], '6.050: 6 ribuan, 0 ratusan, 5 puluhan. Dibaca enam ribu lima puluh.'),
    pg('Tanda yang tepat untuk 5.480 ... 5.408 adalah...', ['>', '<', '=', 'tidak dapat dibandingkan'], 0, 'Ribuan sama (5). Ratusan sama (4). Puluhan 8 lebih besar dari 0. Jadi 5.480 lebih besar.'),
    pg('Urutan dari TERKECIL ke TERBESAR untuk 3.870, 3.780, 3.807, 3.708 adalah...', ['3.708, 3.780, 3.807, 3.870', '3.870, 3.807, 3.780, 3.708', '3.708, 3.807, 3.780, 3.870', '3.780, 3.708, 3.807, 3.870'], 0, 'Ribuan sama. Urutkan dari ratusan: 7, 7, 8, 8. Lalu puluhan.'),
    pg('Bilangan yang terletak di ANTARA 7.400 dan 7.500 adalah...', ['7.450', '7.350', '7.550', '7.399'], 0, '7.450 lebih besar dari 7.400 dan lebih kecil dari 7.500.'),
    isi('Kartu angka 6, 2, 8, 0 dipakai sekali. Angka pertama tidak boleh 0. Berapa bilangan TERKECIL yang bisa disusun?', '2068', 'Angka pertama terkecil yang bukan 0 adalah 2. Lalu 0, 6, 8: 2.068.'),
    isi('Kartu angka 4, 9, 1, 7 dipakai sekali. Berapa bilangan TERBESAR yang bisa disusun?', '9741', 'Urutkan dari yang terbesar: 9, 7, 4, 1.'),
    pg('Bilangan 5.000 + 600 + 8 ditulis...', ['5.608', '5.680', '5.068', '5.860'], 0, '5 ribuan, 6 ratusan, 0 puluhan, 8 satuan.'),
    isi('Sebuah bilangan terdiri dari 3 ribuan, 0 ratusan, 7 puluhan, dan 2 satuan. Tuliskan bilangannya.', '3072', '3.000 + 0 + 70 + 2 = 3.072.'),
    isi('Bilangan cacah tepat sebelum 6.000 adalah...', '5999', '6.000 − 1 = 5.999.'),
  ],
}
