import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { gabung, kerangka, garis } from '../gambar'

/**
 * Bahan latihan AC-03 (Tambah-kurang bilangan cacah sampai 20).
 *
 * Konsep yang diuji bank soal topik ini: istilah (tanda tambah/kurang, jumlah,
 * selisih), strategi "buat sepuluh" (9 + 4: 9 + 1 = 10, lalu 10 + 3) dan
 * mengurangi lewat sepuluh (13 − 5: 13 − 3 = 10, lalu 10 − 2), salah paham
 * MENEMPEL angka (8 + 5 = 85) dan mengurangi satuan saja (3 − 5), sifat tukar
 * tempat penjumlahan (tidak berlaku untuk pengurangan), + 0 dan − 0, bilangan
 * yang hilang (___ + 5 = 12; 14 − ___ = 6) dan soal cerita satu atau dua
 * langkah.
 *
 * `GEN.tambah` dan `GEN.kurang` membuat soal berangka acak lengkap dengan
 * penjelasan strateginya.
 */
const JS = String.raw`
GEN.tambah=function(){
  var a=rnd(6,9),b=rnd(4,9),s=a+b,sisa=b-(10-a);
  return {t:'isi',q:a+' + '+b+' = ...',a:[String(s)],g:{k:'kerangka',isi:a,luar:b,kerangka:1},e:'Buat sepuluh: '+a+' + '+(10-a)+' = 10, lalu 10 + '+sisa+' = '+s+'.'};
};
GEN.kurang=function(){
  var a=rnd(12,17),sat=a-10,b=rnd(5,9);
  while(b<=sat)b=rnd(5,9);
  var r=a-b;
  return {t:'isi',q:a+' − '+b+' = ...',a:[String(r)],g:{k:'kerangka',isi:10,luar:sat,kerangka:1},e:'Kurangi sampai 10: '+a+' − '+sat+' = 10, lalu 10 − '+(b-sat)+' = '+r+'.'};
};
`

export const DATA_AC03: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Tanda + dibaca "tambah".', true, 'Tanda + berarti menambah atau menggabungkan.', gabung('\u{1F34E}', 3, 2, '+')),
    bs('Hasil dari penjumlahan disebut "jumlah".', true, '5 + 4 = 9. Angka 9 adalah jumlahnya.', gabung('\u{1F34E}', 5, 4, '+')),
    bs('Hasil dari pengurangan disebut "selisih".', true, '9 − 3 = 6. Angka 6 adalah selisihnya.', gabung('\u{1F34E}', 9, 3, '-')),
    bs('8 + 5 bisa ditulis 85.', false, 'Menjumlah berarti menghitung nilainya: 8 + 5 = 13. Tidak boleh ditempel.', gabung('\u{1F36C}', 8, 5, '+')),
    bs('Untuk 9 + 4, ubah 4 menjadi 1 + 3. Lalu 9 + 1 = 10 dan 10 + 3 = 13.', true, 'Itu cara "buat sepuluh". Genapkan dulu ke 10, baru tambah sisanya.', kerangka(9, 4)),
    bs('7 + 6 hasilnya sama dengan 6 + 7.', true, 'Penjumlahan boleh ditukar urutannya. Hasilnya tetap 13.', [gabung('\u{1F34E}', 7, 6, '+'), gabung('\u{1F34E}', 6, 7, '+')]),
    bs('9 − 4 hasilnya sama dengan 4 − 9.', false, 'Pengurangan tidak boleh ditukar. 9 − 4 = 5, sedangkan 4 − 9 tidak bisa dihitung dengan cara yang sama.', garis(0, 10, 1, { lab: 1, busur: [{ dari: 9, ke: 5, l: '−4' }] })),
    bs('13 − 5 dihitung dengan 3 − 5 saja karena 3 adalah satuannya.', false, '3 lebih kecil dari 5. Kurangi dulu sampai 10: 13 − 3 = 10, lalu 10 − 2 = 8.', kerangka(10, 3)),
    bs('12 − 0 = 12.', true, 'Dikurangi 0, nilainya tidak berubah.', gabung('\u2B50', 12, 0, '-')),
    bs('15 + 0 = 15.', true, 'Ditambah 0, nilainya tidak berubah.', gabung('\u2B50', 15, 0, '+')),
    bs('Pada 14 − ___ = 6, angka yang hilang adalah 8.', true, '14 − 6 = 8. Jadi 14 − 8 = 6.', garis(0, 14, 1, { lab: 2, titik: [{ v: 14, l: '14' }, { v: 6, l: '6' }] })),
  ],
  debat: [
    debat('Sari dan Toni menghitung 9 + 4.', ['Sari: "9 + 4 = 94. Angkanya ditempel."', 'Toni: "9 + 4 = 13. Aku buat 9 + 1 = 10, lalu 10 + 3."'], 1, 'Menjumlah itu menghitung nilainya, bukan menempel angka.', kerangka(9, 4)),
    debat('Fajar dan Gina menghitung 13 − 6.', ['Fajar: "Kurangi satuannya saja: 3 − 6. Aku tulis 3."', 'Gina: "13 − 3 = 10, lalu 10 − 3 = 7. Jawabannya 7."'], 1, '3 lebih kecil dari 6, jadi kurangi sampai 10 dulu. Hasilnya 7.', kerangka(10, 3)),
    debat('Rani dan Dika membahas pengurangan.', ['Rani: "8 − 3 sama dengan 3 − 8."', 'Dika: "Tidak sama. Pengurangan tidak boleh ditukar."'], 1, 'Penjumlahan boleh ditukar, pengurangan tidak.', garis(0, 10, 1, { lab: 1, busur: [{ dari: 8, ke: 5, l: '−3' }] })),
    debat('Made membeli 7 layang-layang lagi, sekarang punya 15. Berapa layang-layang Made sebelumnya?', ['Made: "7 + 15 = 22."', 'Wayan: "15 − 7 = 8. Sebelumnya 8."'], 1, 'Yang dicari adalah jumlah awal: kurangkan yang ditambahkan. 15 − 7 = 8.'),
    debat('Deni mengerjakan 16 − 8.', ['Deni: "16 − 8 = 68. Angkanya ditempel."', 'Eka: "16 − 8 = 8. Aku hitung nilainya."'], 1, 'Menempel angka bukan mengurangi. 16 − 6 = 10, lalu 10 − 2 = 8.', gabung('\u2B50', 16, 8, '-')),
  ],
  bank: [
    pg('Hasil dari pengurangan disebut...', ['selisih', 'jumlah', 'hasil kali', 'sisa bagi'], 0, 'Hasil pengurangan adalah selisih.', gabung('\u{1F34E}', 9, 3, '-')),
    pg('Hasil dari penjumlahan disebut...', ['jumlah', 'selisih', 'hasil kali', 'sisa bagi'], 0, 'Hasil penjumlahan adalah jumlah.', gabung('\u{1F34E}', 5, 4, '+')),
    isi('Dina punya 9 permen. Ibu memberinya 6 permen lagi. Berapa permen Dina sekarang?', '15', '9 + 6 = 15.', gabung('\u{1F36C}', 9, 6, '+')),
    isi('Rian punya 17 kelereng. Sebanyak 8 kelereng hilang. Berapa sisanya?', '9', '17 − 8 = 9.', gabung('\u26BD', 17, 8, '-')),
    isi('Pada soal ___ + 5 = 12, angka yang tepat mengisi tempat kosong adalah...', '7', '12 − 5 = 7. Jadi 7 + 5 = 12.', garis(0, 12, 1, { lab: 2, titik: [{ v: 12, l: '12' }] })),
    isi('Made punya beberapa layang-layang. Setelah membeli 7 lagi, ia punya 15. Berapa layang-layang Made sebelumnya?', '8', '15 − 7 = 8.'),
    isi('Wati punya 15 kue. Ia memberi adiknya beberapa kue, sekarang tersisa 9. Berapa kue yang diberikan?', '6', '15 − 9 = 6.'),
    isi('Ani punya 6 kelereng. Ia diberi 8 lagi, lalu memberikan 5 ke temannya. Berapa kelereng Ani sekarang?', '9', 'Dua langkah. 6 + 8 = 14. Lalu 14 − 5 = 9.'),
    pg('Manakah yang hasilnya SAMA dengan 8 + 6?', ['6 + 8', '8 + 5', '6 − 8', '15 + 0'], 0, 'Penjumlahan boleh ditukar. 6 + 8 = 8 + 6 = 14.', [gabung('\u{1F34E}', 8, 6, '+'), gabung('\u{1F34E}', 6, 8, '+')]),
    pg('Cara yang benar untuk menghitung 14 − 6 adalah...', ['14 − 4 = 10, lalu 10 − 2 = 8', '4 − 6 = 2, tulis 2', '14 − 6 = 146', '6 − 14 = 8'], 0, 'Kurangi sampai 10 dulu: 14 − 4 = 10. Sisanya 2 lagi: 10 − 2 = 8.', kerangka(10, 4)),
    isi('14 − ___ = 6', '8', '14 − 6 = 8. Jadi yang hilang 8.', garis(0, 14, 1, { lab: 2, titik: [{ v: 14, l: '14' }, { v: 6, l: '6' }] })),
    gen('tambah'),
    gen('tambah'),
    gen('kurang'),
    gen('kurang'),
  ],
}
