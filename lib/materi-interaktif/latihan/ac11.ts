import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bar, pola, timbang } from '../gambar'

/**
 * Bahan latihan AC-11 (Mengisi nilai yang belum diketahui; pra-aljabar).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * arti kotak (bilangan yang belum diketahui, bisa di awal, tengah, atau akhir
 * kalimat), OPERASI KEBALIKAN tiap bentuk (□ + 5 = 12 dihitung 12 − 5;
 * 20 − □ = 8 dihitung 20 − 8; □ − 6 = 10 dihitung 10 + 6; □ × 5 = 35
 * dihitung 35 : 5), kalimat DUA langkah (2 × □ + 3 = 11: kurangi dulu, lalu
 * bagi), memeriksa dengan memasukkan nilainya, pola bilangan dan aturannya (+,
 * −, ×, bahkan × lalu +), cerita "mula-mula", membuat soal dari nilai kotak
 * (menentukan hasil di ruas kanan), dan salah paham: kotak selalu 0, kotak sama
 * dengan bilangan di sebelahnya, menebak yang "mendekati", dan pola yang
 * "selalu ditambah".
 *
 * `GEN.kotak` membuat soal acak enam bentuk, lengkap dengan penjelasan operasi
 * kebaliknya dan timbangan bila bentuknya cocok.
 */
const JS = String.raw`
GEN.kotak=function(){
  var K='□',f=rnd(1,6),a,b,x,q,e,g=null;
  if(f===1){a=rnd(3,12);x=rnd(3,15);b=a+x;q=K+' + '+a+' = '+b;e='Kebalikan dari tambah '+a+' adalah kurang '+a+': '+b+' − '+a+' = '+x+'.';g={k:'timbang',kantong:1,plus:a,minus:0,kanan:b}}
  else if(f===2){a=rnd(3,12);x=rnd(3,15);b=a+x;q=a+' + '+K+' = '+b;e='Yang belum diketahui = jumlah − yang diketahui: '+b+' − '+a+' = '+x+'.';g={k:'timbang',kantong:1,plus:a,minus:0,kanan:b}}
  else if(f===3){a=rnd(3,12);b=rnd(5,20);x=a+b;q=K+' − '+a+' = '+b;e='Kebalikan dari kurang '+a+' adalah tambah '+a+': '+b+' + '+a+' = '+x+'.';g={k:'timbang',kantong:1,plus:0,minus:a,kanan:b}}
  else if(f===4){b=rnd(3,12);x=rnd(3,12);a=b+x;q=a+' − '+K+' = '+b;e='Pada '+a+' − '+K+' = '+b+', hitung '+a+' − '+b+' = '+x+'.'}
  else if(f===5){a=rnd(3,9);x=rnd(3,9);b=a*x;q=a+' × '+K+' = '+b;e='Kebalikan dari kali '+a+' adalah bagi '+a+': '+b+' : '+a+' = '+x+'.';g={k:'timbang',kantong:a,plus:0,minus:0,kanan:b}}
  else{a=rnd(3,9);x=rnd(3,9);b=a*x;q=b+' : '+K+' = '+a;e='Pada '+b+' : '+K+' = '+a+', hitung '+b+' : '+a+' = '+x+'.'}
  var it={t:'isi',q:'Carilah nilai kotak: '+q,a:[String(x)],e:e};
  if(g)it.g=g;
  return it;
};
`

export const DATA_AC11: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Kotak (□) dalam kalimat matematika mewakili bilangan yang belum diketahui.', true, 'Kotak menyimpan bilangan yang masih dicari.', timbang(1, 5, 0, 12)),
    bs('Pada □ − 4 = 9, bilangan yang belum diketahui berada di awal kalimat.', true, 'Kotak ada sebelum tanda kurang, jadi di awal kalimat.', timbang(1, 0, 4, 9)),
    bs('Untuk mencari kotak pada □ + 5 = 12, hitung 12 − 5.', true, 'Kebalikan dari tambah 5 adalah kurang 5. Kotaknya 7.', timbang(1, 5, 0, 12)),
    bs('Untuk mencari kotak pada 20 − □ = 8, hitung 20 − 8.', true, '20 − 12 = 8, jadi kotaknya 20 − 8 = 12.'),
    bs('Untuk mencari kotak pada □ − 6 = 10, hitung 10 + 6.', true, 'Kebalikan dari kurang 6 adalah tambah 6. Kotaknya 16.', timbang(1, 0, 6, 10)),
    bs('Untuk mencari kotak pada □ × 5 = 35, hitung 35 : 5.', true, 'Kebalikan dari kali adalah bagi. Kotaknya 7.', timbang(5, 0, 0, 35)),
    bs('Pembagian tidak bisa dipakai untuk mencari kotak pada kalimat perkalian.', false, 'Justru pembagian adalah kebalikan dari perkalian.'),
    bs('Kotak pada kalimat matematika selalu berarti jawabannya 0.', false, 'Kotak bisa bilangan apa saja yang membuat kalimatnya benar.'),
    bs('Nilai kotak pada 9 − □ = 9 pasti 0.', true, '9 − 0 = 9. Tidak ada yang berkurang.'),
    bs('Pada 2 × □ + 3 = 11, langkah pertama adalah mengurangkan 3 dari 11, lalu membagi hasilnya dengan 2.', true, '11 − 3 = 8, lalu 8 : 2 = 4.', timbang(2, 3, 0, 11)),
    bs('Pola 6, 12, 18, 24 punya aturan bertambah 6 setiap langkah.', true, '6 + 6 = 12, 12 + 6 = 18, 18 + 6 = 24.', pola(['6', '12', '18', '24'])),
    bs('Pola 3, 6, 12, 24 bisa dilanjutkan dengan ditambah 6 terus-menerus.', false, 'Aturannya dikali 2. Setelah 24 datang 48, bukan 30.', pola(['3', '6', '12', '24', '0'], [4])),
    bs('Kotak selalu bernilai sama dengan bilangan yang ada di sebelahnya.', false, 'Pada □ + 5 = 12 kotaknya 7, bukan 5 dan bukan 12.'),
  ],
  debat: [
    debat('Cinta dan Dito mencari kotak pada 9 × □ = 72.', ['Cinta: "Kotaknya 7, karena 9 × 7 = 63 sudah dekat dengan 72."', 'Dito: "Kotaknya 8, karena 72 : 9 = 8 dan 9 × 8 = 72 tepat."'], 1, 'Nilai kotak harus membuat kalimatnya TEPAT benar, bukan sekadar mendekati.', timbang(9, 0, 0, 72)),
    debat('Dedi dan Eka mencari kotak pada 9 + □ = 15.', ['Dedi: "Kotaknya 24, karena 9 + 15 = 24."', 'Eka: "Kotaknya 6, karena 15 − 9 = 6."'], 1, 'Yang dicari bukan jumlah, melainkan bagian yang hilang: 15 − 9.', timbang(1, 9, 0, 15)),
    debat('Rani dan Beni mencari kotak pada □ + 5 = 12.', ['Rani: "Kotaknya 17, karena 12 + 5 = 17."', 'Beni: "Kotaknya 7, karena 12 − 5 = 7."'], 1, 'Pakai operasi kebalikan. Kebalikan dari tambah adalah kurang.', timbang(1, 5, 0, 12)),
    debat('Rian dan Sari melanjutkan pola 4, 8, 16, 32.', ['Rian: "Ditambah 8 terus, jadi berikutnya 40."', 'Sari: "Dikali 2 terus, jadi berikutnya 64."'], 1, '4 × 2 = 8, 8 × 2 = 16, 16 × 2 = 32. Aturannya dikali 2.', pola(['4', '8', '16', '32', '0'], [4])),
    debat('Dedi dan Eka mencari kotak pada 15 − □ = 7.', ['Dedi: "Kotaknya 22, karena 15 + 7 = 22."', 'Eka: "Kotaknya 8, karena 15 − 7 = 8."'], 1, 'Pada a − □ = b, kotaknya a − b. Periksa: 15 − 8 = 7.'),
    debat('Mari dan Nina membahas □ + □ = 14 (kedua kotak sama).', ['Mari: "Tiap kotak 7, karena 7 + 7 = 14."', 'Nina: "Tiap kotak 14, karena hasilnya 14."'], 0, '7 + 7 = 14. Kedua kotak bernilai sama, jadi dibagi dua.'),
  ],
  bank: [
    isi('Carilah nilai kotak: 6 + □ = 15', '9', '15 − 6 = 9. Periksa: 6 + 9 = 15.', timbang(1, 6, 0, 15)),
    isi('Carilah nilai kotak: □ − 7 = 14', '21', 'Kebalikan dari kurang 7 adalah tambah 7: 14 + 7 = 21.', timbang(1, 0, 7, 14)),
    isi('Carilah nilai kotak: □ + 18 = 40', '22', '40 − 18 = 22.', timbang(1, 18, 0, 40)),
    isi('Carilah nilai kotak: 13 + □ = 31', '18', '31 − 13 = 18.'),
    isi('Carilah nilai kotak: □ × 6 = 54', '9', '54 : 6 = 9.', timbang(6, 0, 0, 54)),
    isi('Carilah nilai kotak: 7 × □ = 63', '9', '63 : 7 = 9.', timbang(7, 0, 0, 63)),
    isi('Carilah nilai kotak: 72 : □ = 9', '8', '72 : 9 = 8. Periksa: 72 : 8 = 9.'),
    isi('Carilah nilai kotak: 56 : □ = 7', '8', '56 : 7 = 8.'),
    isi('Carilah nilai kotak: 5 × □ + 4 = 29', '5', 'Dua langkah. 29 − 4 = 25, lalu 25 : 5 = 5.', timbang(5, 4, 0, 29)),
    isi('Carilah nilai kotak: 3 × □ − 2 = 19', '7', 'Dua langkah. 19 + 2 = 21, lalu 21 : 3 = 7.', timbang(3, 0, 2, 19)),
    isi('Carilah nilai kotak: 4 × □ + 6 = 30', '6', 'Dua langkah. 30 − 6 = 24, lalu 24 : 4 = 6.', timbang(4, 6, 0, 30)),
    isi('Sebuah tas berisi kelereng. Setelah ditambah 8 kelereng, jumlahnya 31. Berapa kelereng mula-mula?', '23', '□ + 8 = 31, jadi 31 − 8 = 23.', bar([{ l: '?', v: 23, w: 'abu' }, { l: '+8', v: 8, w: 'hijau' }], '31')),
    isi('Penjual punya sejumlah apel. Setelah terjual 17 buah, sisanya 26. Berapa apel mula-mula?', '43', '□ − 17 = 26, jadi 26 + 17 = 43.', bar([{ l: 'terjual 17', v: 17, w: 'merah' }, { l: 'sisa 26', v: 26 }], '?')),
    isi('Made punya sejumlah kelereng. Dibagi rata ke 5 teman, masing-masing dapat 4, dan sisa 3 untuk Made. Berapa kelereng mula-mula?', '23', 'Dua langkah. 5 × 4 = 20, lalu 20 + 3 = 23.', bar([{ l: '5 × 4 = 20', v: 20 }, { l: 'sisa 3', v: 3, w: 'merah' }], '?')),
    isi('Lengkapi pola: 6, 12, 18, □, 30. Berapa bilangan yang hilang?', '24', 'Aturannya bertambah 6. 18 + 6 = 24.', pola(['6', '12', '18', '0', '30'], [3])),
    isi('Lengkapi pola: 100, 90, 80, □, 60. Berapa bilangan yang hilang?', '70', 'Aturannya berkurang 10. 80 − 10 = 70.', pola(['100', '90', '80', '0', '60'], [3])),
    isi('Pola dengan aturan "dikali 2" dimulai dari 3. Berapa bilangan KEEMPAT? (3 adalah bilangan pertama)', '24', '3, 6, 12, 24. Bilangan keempat 24.', pola(['3', '6', '12', '0'], [3])),
    isi('Pola 4, 9, 19, 39 mengikuti aturan "dikali 2 lalu ditambah 1". Berapa bilangan berikutnya?', '79', '39 × 2 = 78, lalu 78 + 1 = 79.', pola(['4', '9', '19', '39', '0'], [4])),
    pg('Untuk mencari kotak pada □ + 9 = 20, operasi kebalikan yang tepat adalah...', ['kurang: 20 − 9', 'tambah: 20 + 9', 'kali: 20 × 9', 'bagi: 20 : 9'], 0, 'Kebalikan dari tambah adalah kurang. Kotaknya 11.', timbang(1, 9, 0, 20)),
    pg('Untuk mencari kotak pada □ × 5 = 35, operasi kebalikan yang tepat adalah...', ['bagi: 35 : 5', 'kali: 35 × 5', 'kurang: 35 − 5', 'tambah: 35 + 5'], 0, 'Kebalikan dari kali adalah bagi. Kotaknya 7.', timbang(5, 0, 0, 35)),
    pg('Pada kalimat 5 + □ = 12, kotak (□) menunjukkan...', ['bilangan yang belum diketahui', 'bilangan 0', 'tanda sama dengan', 'hasil akhir'], 0, 'Kotak mewakili bilangan yang masih dicari.', timbang(1, 5, 0, 12)),
    pg('Manakah kalimat yang nilai kotaknya TEPAT 6?', ['5 + □ = 11', '□ × 4 = 20', '18 : □ = 6', '□ − 3 = 4'], 0, '5 + 6 = 11. Yang lain: kotaknya 5, 3, dan 7.'),
    isi('Kamu ingin membuat kalimat "20 + □ = ..." yang nilai kotaknya TEPAT 7. Berapa hasil yang harus dituliskan di ruas kanan?', '27', '20 + 7 = 27.'),
    isi('Kamu ingin membuat kalimat "□ × 8 = ..." yang nilai kotaknya TEPAT 7. Berapa hasil yang harus dituliskan?', '56', '7 × 8 = 56.'),
    isi('Kamu ingin membuat kalimat "□ − 12 = ..." yang nilai kotaknya TEPAT 30. Berapa hasil yang harus dituliskan?', '18', '30 − 12 = 18.'),
    isi('Kamu ingin membuat kalimat dua langkah "3 × □ + 2 = ..." yang nilai kotaknya TEPAT 5. Berapa hasil akhirnya?', '17', '3 × 5 = 15, lalu 15 + 2 = 17.'),
    pg('Pola 3, 6, 12, 24 dilanjutkan dengan aturan yang benar. Bilangan berikutnya adalah...', ['48', '30', '36', '27'], 0, 'Aturannya dikali 2: 24 × 2 = 48.', pola(['3', '6', '12', '24', '0'], [4])),
    gen('kotak'),
    gen('kotak'),
    gen('kotak'),
    gen('kotak'),
  ],
}
