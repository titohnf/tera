import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { blok, kelompok, larik } from '../gambar'

/**
 * Bahan latihan AC-10 (Operasi kali-bagi bilangan cacah).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * istilah (kali, bagi, hasil kali, hasil bagi), perkalian sebagai penjumlahan
 * berulang, tukar urutan (3 x 5 = 5 x 3, tetapi pembagian tidak boleh ditukar),
 * bagi sama rata, pembagian sebagai KEBALIKAN perkalian dan cara memeriksanya,
 * pembagian dengan SISA (29 : 4 = 7 sisa 1) dan memeriksanya (hasil bagi x
 * pembagi + sisa), habis dibagi, x0 dan x1, perkalian dua angka (34 x 6 dengan
 * penguraian), pembagian bertingkat (96 : 8), perkiraan, cerita dua langkah
 * (perkalian lalu pembagian), merancang soal (bilangan yang hilang), dan salah
 * paham "45 : 5 = 8 karena 5 x 8 = 40 mendekati 45".
 *
 * `GEN.kali2` membuat soal dua angka x satu angka acak lengkap dengan
 * penguraiannya; `GEN.sisa` membuat soal "berapa sisanya" acak.
 */
const JS = String.raw`
GEN.kali2=function(){
  var a=rnd(12,48),b=rnd(3,9),pu=Math.floor(a/10)*10,sa=a%10;
  return {t:'isi',q:a+' × '+b+' = ...',a:[String(a*b)],e:'Uraikan: '+pu+' × '+b+' = '+(pu*b)+' dan '+sa+' × '+b+' = '+(sa*b)+'. Jumlahnya '+(a*b)+'.',g:{k:'blok',n:a}};
};
GEN.sisa=function(){
  var d=rnd(4,7),q=rnd(4,8),r=rnd(1,d-1),n=d*q+r;
  return {t:'isi',q:n+' dibagi '+d+' sama dengan '+q+' dengan sisa berapa?',a:[String(r)],e:d+' × '+q+' = '+(d*q)+'. Lalu '+n+' − '+(d*q)+' = '+r+'. Sisanya '+r+'.',g:{k:'kelompok',e:'\u{1F36A}',jumlah:d,n:q,sisa:r}};
};
`

export const DATA_AC10: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Simbol × dibaca "kali" dan simbol : dibaca "bagi".', true, 'Kali untuk menggandakan kelompok, bagi untuk membagi sama rata.', larik(2, 3)),
    bs('Hasil dari perkalian disebut hasil kali, dan hasil dari pembagian disebut hasil bagi.', true, '4 × 5 = 20: 20 adalah hasil kali. 20 : 4 = 5: 5 adalah hasil bagi.'),
    bs('4 × 6 sama artinya dengan 6 + 6 + 6 + 6.', true, '4 × 6 berarti 4 kelompok yang masing-masing 6.', kelompok('\u{1F34E}', 4, 6, { plus: true })),
    bs('7 × 3 hasilnya sama dengan 3 × 7.', true, 'Perkalian boleh ditukar urutannya. Keduanya 21.', [larik(7, 3), larik(3, 7)]),
    bs('Karena 5 × 6 = 30, maka 30 : 6 = 5.', true, 'Pembagian adalah kebalikan perkalian.', larik(5, 6)),
    bs('Membagi sama rata berarti setiap kelompok mendapat bagian yang sama banyak.', true, '12 kue ke 3 piring: tiap piring 4.', kelompok('\u{1F36A}', 3, 4)),
    bs('Jika suatu bilangan habis dibagi, sisanya 0.', true, '20 : 4 = 5 tanpa sisa, karena semua kue terbagi.', kelompok('\u{1F36C}', 4, 5)),
    bs('29 : 4 = 7 sisa 1.', true, '4 × 7 = 28. Sisanya 29 − 28 = 1.', kelompok('\u{1F36A}', 4, 7, { sisa: 1 })),
    bs('Pembagian selalu menghasilkan bilangan yang lebih kecil dari bilangan yang dibagi.', false, 'Tidak selalu. 8 : 1 = 8, hasilnya sama besar.', kelompok('\u{1F34E}', 1, 8)),
    bs('Bilangan apa pun dikalikan 0, hasilnya bilangan itu sendiri.', false, 'Hasilnya 0. 4 piring yang masing-masing berisi 0 tetap kosong.', kelompok('\u{1F34E}', 4, 0)),
    bs('Bilangan apa pun dikalikan 1, hasilnya tetap bilangan itu.', true, '1 piring berisi 7 apel: totalnya 7.', kelompok('\u{1F34E}', 1, 7)),
    bs('10 : 100 = 10, sama saja dengan 100 : 10 = 10.', false, 'Pembagian tidak boleh ditukar. 100 : 10 = 10, tetapi 10 tidak bisa dibagi rata ke 100 menjadi 10.'),
    bs('Untuk memeriksa 84 : 7 = 12, kalikan 12 × 7 dan hasilnya harus 84.', true, '12 × 7 = 84. Cocok!'),
    bs('Pada pembagian bersisa: hasil bagi × pembagi + sisa = bilangan yang dibagi.', true, '7 × 4 + 1 = 29.', kelompok('\u{1F36A}', 4, 7, { sisa: 1 })),
  ],
  debat: [
    debat('Rian dan Sari menghitung 45 : 5.', ['Rian: "Hasilnya 8, karena 5 × 8 = 40 sudah mendekati 45."', 'Sari: "Hasilnya 9, karena 5 × 9 = 45 tepat."'], 1, 'Hasil bagi harus membuat perkaliannya TEPAT. 5 × 9 = 45.', larik(5, 9)),
    debat('Dito dan Eka menghitung 56 : 8.', ['Dito: "Hasilnya 6, karena 8 × 7 = 56 dekat dengan 6."', 'Eka: "Hasilnya 7, karena 8 × 7 = 56 tepat."'], 1, 'Perkalian kebalikannya harus pas: 8 × 7 = 56, jadi 56 : 8 = 7.', larik(8, 7)),
    debat('Wati dan Dedi membahas 100 : 10.', ['Wati: "100 : 10 = 10, dan 10 : 100 juga 10. Cuma dibalik."', 'Dedi: "Pembagian tidak boleh dibalik. 10 : 100 bukan 10."'], 1, 'Pada pembagian, urutan bilangan menentukan hasilnya. Hanya perkalian yang boleh ditukar.'),
    debat('Made dan Beni menghitung 34 × 6.', ['Made: "30 × 6 = 180, lalu ditambah 4. Hasilnya 184."', 'Beni: "30 × 6 = 180 dan 4 × 6 = 24. Jumlahnya 204."'], 1, 'Kedua bagian harus dikalikan dengan 6, bukan hanya satu bagian.', blok(34, '34')),
    debat('Budi dan Cika menghitung 29 dibagi 4.', ['Budi: "Hasilnya 7 sisa 3."', 'Cika: "Hasilnya 7 sisa 1. 4 × 7 = 28, dan 29 − 28 = 1."'], 1, 'Sisa adalah bilangan yang tersisa setelah mengambil 7 kelompok berisi 4.', kelompok('\u{1F36A}', 4, 7, { sisa: 1 })),
    debat('Sinta dan Toni memeriksa 15 × 12 = 180.', ['Sinta: "Bagi 180 dengan 12, harus ketemu 15."', 'Toni: "Perkalian tidak bisa diperiksa dengan pembagian."'], 0, 'Kali dan bagi saling berkebalikan. 180 : 12 = 15, cocok.'),
    debat('Lina dan Gino membahas 4 × 6.', ['Lina: "4 × 6 = 4 + 6."', 'Gino: "4 × 6 = 6 + 6 + 6 + 6."'], 1, '4 × 6 berarti 4 kelompok yang masing-masing 6, bukan 4 ditambah 6.', kelompok('\u{1F34E}', 4, 6, { plus: true })),
  ],
  bank: [
    isi('8 × 7 = ...', '56', '8 baris × 7 titik. 7 ditambah 8 kali = 56.', larik(8, 7)),
    isi('6 × 9 = ...', '54', '6 × 9 sama dengan 9 × 6 = 54.', larik(6, 9)),
    isi('72 : 9 = ...', '8', '9 × 8 = 72, jadi 72 : 9 = 8.', larik(9, 8)),
    isi('Toko menjual telur dalam kotak berisi 12 butir. Jika ada 7 kotak, berapa butir telur seluruhnya?', '84', '7 × 12 = 84.', larik(7, 12)),
    isi('Sebuah kotak berisi 6 kue. Ada 9 kotak. Berapa kue seluruhnya?', '54', '9 × 6 = 54.', larik(9, 6)),
    isi('Ibu membagi 20 permen sama rata kepada 4 anak. Berapa permen tiap anak?', '5', '20 : 4 = 5, karena 4 × 5 = 20.', kelompok('\u{1F36C}', 4, 5)),
    isi('Ada 5 kelompok, setiap kelompok berisi 3 kelereng. Berapa kelereng seluruhnya?', '15', '5 × 3 = 15.', kelompok('\u{1F535}', 5, 3, { plus: true })),
    isi('34 × 5 = ...', '170', '30 × 5 = 150 dan 4 × 5 = 20. Jumlahnya 170.', blok(34, '34')),
    isi('23 × 4 = ...', '92', '20 × 4 = 80 dan 3 × 4 = 12. Jumlahnya 92.', blok(23, '23')),
    isi('156 : 12 = ...', '13', '12 × 13 = 156. Periksa: 13 × 12 = 156.'),
    isi('Sebanyak 126 buku dibagi sama rata ke 6 rak. Berapa buku di setiap rak?', '21', '6 × 21 = 126, jadi 126 : 6 = 21.'),
    isi('Bilangan yang dibagi 84 dan hasil baginya TEPAT 12. Berapa pembaginya?', '7', '84 : 7 = 12, karena 7 × 12 = 84.'),
    isi('Kamu menyusun 5 baris kursi sama banyak sehingga totalnya TEPAT 45. Berapa kursi tiap baris?', '9', '45 : 5 = 9. Periksa: 5 × 9 = 45.', larik(5, 9)),
    isi('Pabrik membuat 6 loyang, tiap loyang 8 roti. Roti dimasukkan ke kantong berisi 4 roti. Berapa kantong yang diperlukan?', '12', 'Dua langkah. 6 × 8 = 48 roti. Lalu 48 : 4 = 12 kantong.'),
    isi('Peternak punya 4 kandang, tiap kandang 9 ayam. Ayam dijual dalam kelompok berisi 6 ekor. Berapa kelompok?', '6', '4 × 9 = 36 ayam. Lalu 36 : 6 = 6 kelompok.'),
    isi('38 : 5 = 7 sisa 3. Pemeriksaannya: 7 × 5 + 3 = ...', '38', '7 × 5 = 35, lalu 35 + 3 = 38. Cocok dengan bilangan yang dibagi.', kelompok('\u{1F36A}', 5, 7, { sisa: 3 })),
    isi('36 × 7 = ...', '252', '30 × 7 = 210 dan 6 × 7 = 42. Jumlahnya 252.', blok(36, '36')),
    pg('Simbol "×" dalam matematika disebut...', ['kali', 'tambah', 'bagi', 'sama dengan'], 0, 'Simbol × dibaca kali.'),
    pg('Hasil dari operasi pembagian disebut...', ['hasil bagi', 'hasil kali', 'jumlah', 'selisih'], 0, '20 : 4 = 5. Angka 5 adalah hasil bagi.'),
    pg('5 × 4 dapat diartikan sebagai penjumlahan berulang...', ['4 + 4 + 4 + 4 + 4', '5 + 5 + 5 + 5', '5 + 4', '4 + 4 + 4 + 4'], 0, '5 kelompok yang masing-masing 4.', kelompok('\u{1F34E}', 5, 4, { plus: true })),
    pg('Manakah pembagian berikut yang menghasilkan SISA?', ['25 : 5', '32 : 4', '37 : 6', '48 : 8'], 2, '6 × 6 = 36, jadi 37 : 6 = 6 sisa 1. Yang lain habis dibagi.'),
    pg('Manakah perkalian yang hasilnya TEPAT 48?', ['6 × 8', '7 × 7', '5 × 9', '4 × 11'], 0, '6 × 8 = 48. 7 × 7 = 49, 5 × 9 = 45, 4 × 11 = 44.', larik(6, 8)),
    pg('Kamu ingin membuat soal cerita perkalian dengan hasil TEPAT 63, salah satu bilangannya 9. Bilangan lainnya...', ['7', '6', '8', '54'], 0, '9 × 7 = 63.', larik(9, 7)),
    pg('40 dibagi suatu bilangan menghasilkan SISA TEPAT 4. Pembagi yang tepat adalah...', ['9', '8', '7', '5'], 0, '40 : 9 = 4 sisa 4. Pembagi lain: 8 dan 5 habis, 7 bersisa 5.'),
    pg('48 × 11 diperkirakan 50 × 10 = 500. Hasil pastinya 528. Apa manfaat perkiraan?', ['mengecek apakah hasil pasti masuk akal', 'menggantikan hasil pasti', 'membuat hasilnya jadi 500', 'tidak berguna'], 0, 'Perkiraan membantu mengecek kewajaran, bukan sebagai jawaban pasti.'),
    pg('47 dibagi 6 sama dengan 7 dengan sisa berapa?', ['5', '6', '1', '4'], 0, '6 × 7 = 42. Sisanya 47 − 42 = 5.', kelompok('\u{1F36A}', 6, 7, { sisa: 5 })),
    gen('kali2'),
    gen('kali2'),
    gen('sisa'),
    gen('sisa'),
  ],
}
