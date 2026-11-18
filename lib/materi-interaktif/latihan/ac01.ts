import { bs, debat, isi, kata, pg, type DataMateri } from '../bersama'
import { ikat, nilai } from '../gambar'

/**
 * Bahan latihan AC-01 (Bilangan cacah sampai 100; komposisi dan dekomposisi).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * membaca/menulis bilangan (tujuh puluh lima = 75), nilai tempat dan NILAI
 * angka (4 pada 46 = 40), uraian puluhan-satuan termasuk yang tidak standar
 * (3 puluhan + 14 satuan = 44), 24 tidak sama dengan 42, angka 0 di satuan,
 * membandingkan lewat puluhan dulu, dan "cara paling praktis" memakai ikatan.
 * Soal di bawah memakai angka dan konteks sendiri, bukan salinan bank.
 */
export const DATA_AC01: DataMateri = {
  fakta: [
    bs('Pada bilangan 47, angka 4 bernilai 40.', true, '4 ada di tempat puluhan. 4 puluhan = 40.', nilai(47, 2, 0, true)),
    bs('Bilangan 36 dan 63 sama nilainya karena memakai angka yang sama.', false, 'Letak angkanya beda. 36 = 3 puluhan 6 satuan. 63 = 6 puluhan 3 satuan.', [nilai(36, 2), nilai(63, 2)]),
    bs('Bilangan "tujuh puluh" ditulis 70.', true, 'Tujuh puluh = 7 puluhan, tanpa satuan, jadi 70.', nilai(70, 2, 0, true)),
    bs('Pada bilangan 80, angka 0 berarti tidak ada satuan lepas.', true, '80 = 8 puluhan penuh. Tidak ada lidi lepas.', ikat(8, 0, '80 = 8 ikat, tanpa lidi lepas')),
    bs('2 puluhan + 13 satuan sama nilainya dengan 3 puluhan + 3 satuan.', true, '13 satuan = 1 puluhan + 3 satuan. Jadi 2 puluhan + 1 puluhan + 3 = 33.', ikat(2, 13, '2 ikat + 13 lidi lepas')),
    bs('Bilangan 52 hanya punya satu cara uraian: 5 puluhan + 2 satuan.', false, 'Masih ada 4 puluhan + 12 satuan, atau 3 puluhan + 22 satuan. Nilainya tetap 52.', [ikat(5, 2, '5 ikat + 2 lepas'), ikat(4, 12, '4 ikat + 12 lepas')]),
    bs('Bilangan dua angka dengan puluhan lebih banyak pasti lebih besar.', true, 'Bandingkan puluhan dulu. 5 puluhan lebih banyak dari 4 puluhan, bahkan jika satuannya lebih kecil.', [nilai(39, 2, 0), nilai(41, 2, 0)]),
    bs('4 ikat dan 5 lepas ditulis 4 + 5 = 9.', false, '1 ikat = 10. 4 ikat = 40. 40 + 5 = 45.', ikat(4, 5)),
    bs('Bilangan "sembilan puluh" ditulis 90.', true, 'Sembilan puluh = 9 puluhan = 90.', ikat(9, 0, '9 ikat')),
    bs('Pada bilangan 18, angka 8 bernilai 80.', false, '8 ada di tempat satuan. Nilainya 8. Yang bernilai 80 adalah 8 di bilangan 85.', nilai(18, 2, 1, true)),
  ],
  debat: [
    debat('Dito dan Sari membahas bilangan 24 dan 42.', ['Dito: "24 dan 42 sama saja, angkanya sama-sama 2 dan 4."', 'Sari: "Beda. Letak angkanya berbeda, jadi nilainya berbeda."'], 1, '24 = 2 puluhan 4 satuan. 42 = 4 puluhan 2 satuan. Letak angka menentukan nilainya.', [nilai(24, 2), nilai(42, 2)]),
    debat('Sari punya 5 ikat lidi (tiap ikat 10 lidi) dan 3 lidi lepas.', ['Budi: "Berarti lidinya 5 + 3 = 8."', 'Cika: "5 ikat = 50. Ditambah 3 lepas jadi 53."'], 1, 'Satu ikat berisi 10 lidi. 5 ikat = 50 lidi.', ikat(5, 3)),
    debat('Rani menguraikan bilangan 56.', ['Rani: "56 = 5 satuan dan 6 puluhan."', 'Toni: "56 = 5 puluhan dan 6 satuan."'], 1, 'Angka di kiri (5) ada di tempat puluhan. Angka di kanan (6) ada di tempat satuan.', nilai(56, 2)),
    debat('Seorang anak membaca bilangan 40 sebagai "empat".', ['Ani: "Salah. 40 dibaca empat puluh, karena 4 ada di tempat puluhan."', 'Beni: "Benar. Angka 0 tidak dihitung, jadi tinggal empat."'], 0, 'Angka 0 menjaga angka 4 tetap di tempat puluhan. 4 puluhan = 40.', nilai(40, 2, 0)),
    debat('Made menyusun 45 kelereng: 4 ikat dan 5 lepas. Wayan menyusun 3 ikat dan 15 lepas.', ['Made: "Jumlah kita sama, sama-sama 45."', 'Wayan: "Beda. Susunan kita berbeda."'], 0, 'Susunannya boleh beda, nilainya sama. 15 lepas = 1 ikat + 5 lepas.', [ikat(4, 5, 'Made'), ikat(3, 15, 'Wayan')]),
  ],
  bank: [
    pg('Bilangan "enam puluh tiga" ditulis dengan lambang...', ['63', '603', '36', '630'], 0, 'Enam puluh = 60. Tiga = 3. Jadi 63.', ikat(6, 3, 'enam puluh tiga')),
    pg('Pada bilangan 71, angka 7 menempati tempat...', ['puluhan', 'satuan', 'ratusan', 'ribuan'], 0, 'Angka di sebelah kiri adalah puluhan. 7 puluhan = 70.', nilai(71, 2, 0)),
    isi('Bilangan yang terdiri dari 4 puluhan dan 6 satuan adalah...', '46', '40 + 6 = 46.', ikat(4, 6)),
    isi('Ada 6 ikat sedotan (tiap ikat 10 sedotan) dan 4 sedotan lepas. Berapa sedotan seluruhnya?', '64', '6 ikat = 60. 60 + 4 = 64.', ikat(6, 4, 'sedotan')),
    isi('Bilangan 78 terdiri dari berapa puluhan?', '7', '78 = 7 puluhan + 8 satuan.', nilai(78, 2)),
    isi('Berapa nilai angka 6 pada bilangan 65?', '60', '6 ada di tempat puluhan. Nilainya 60, bukan 6.', nilai(65, 2, 0)),
    isi('3 puluhan + 14 satuan = ...', '44', '14 satuan = 1 puluhan + 4. Jadi 4 puluhan + 4 = 44.', ikat(3, 14)),
    isi('2 puluhan + 17 satuan = ...', '37', '17 satuan = 1 puluhan + 7. Jadi 3 puluhan + 7 = 37.', ikat(2, 17)),
    isi('Bilangan 84 = 7 puluhan + ... satuan', '14', 'Satu puluhan dipecah jadi 10 satuan. 4 + 10 = 14 satuan.', ikat(8, 4, '84')),
    pg('P = 5 puluhan + 18 satuan. Q = 6 puluhan + 9 satuan. Mana yang lebih besar?', ['P', 'Q', 'Sama besar', 'Tidak bisa ditentukan'], 1, 'P = 50 + 18 = 68. Q = 60 + 9 = 69. Q lebih besar.', [ikat(5, 18, 'P'), ikat(6, 9, 'Q')]),
    pg('Pada bilangan 90, angka satuannya 0. Artinya...', ['tidak ada satuan lepas', 'tidak ada puluhan', 'bilangannya 9', 'bilangannya 0'], 0, '90 = 9 puluhan dan 0 satuan. Semuanya sudah terikat.', ikat(9, 0, '90')),
    pg('Toko menjual permen dalam bungkus isi 10. Made ingin tepat 76 permen dengan bungkus sebanyak mungkin. Berapa bungkus dan berapa permen lepas?', ['7 bungkus dan 6 lepas', '6 bungkus dan 16 lepas', '8 bungkus dan 4 lepas', '76 lepas'], 0, '76 = 7 puluhan + 6 satuan. Cara paling praktis memakai puluhan sebanyak mungkin.'),
    isi('Kamu ingin menunjukkan 52 dengan TEPAT 3 ikat sedotan. Berapa sedotan lepas yang dibutuhkan?', '22', '3 ikat = 30. 52 − 30 = 22 sedotan lepas.', ikat(3, 0, '3 ikat')),
    kata('Bilangan 29 dan 92 ___ nilainya. (sama / berbeda)', ['berbeda', 'beda'], 'Letak angkanya beda. 29 = 2 puluhan 9 satuan. 92 = 9 puluhan 2 satuan.', [nilai(29, 2), nilai(92, 2)]),
  ],
}
