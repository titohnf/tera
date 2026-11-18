import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { setara } from '../gambar'

/**
 * Bahan latihan AC-24 (Persamaan satu langkah dan operasi kebalikan).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * istilah (persamaan, variabel n, kotak atau segitiga sebagai nilai yang
 * belum diketahui), operasi kebalikan keempat operasi (tambah lawannya kurang,
 * kali lawannya bagi), menyelesaikan n + a = b, n - a = b, a x n = b, n : a =
 * b, cerita ke persamaan (kelereng, tangki, pensil, uang, buku), memeriksa
 * dengan substitusi, rancang persamaan (cari b atau a agar n tertentu jadi
 * solusi), sifat kesetaraan (tambah atau kali kedua ruas tetap seimbang,
 * menukar ruas tidak mengubah n, solusi satu langkah unik), dan salah paham:
 * n + 5 = 12 dijumlah jadi 17, 4 x n = 20 jadi 80, n : 5 = 3 jadi 0,6,
 * n - 3 = 9 jadi 6, semua persamaan dikurangi, makin besar a makin besar n,
 * dan arah cerita tertukar (n + 5 = 12 untuk "memberikan 5").
 *
 * Jawaban angka ditulis tanpa titik ribuan (titik dibuang saat mencocokkan).
 *
 * `GEN.tambah`, `GEN.kurang`, `GEN.kali`, `GEN.bagi` menyelesaikan n; `GEN.cerita`
 * cerita satu langkah; `GEN.rancang` mencari b atau a agar n tertentu jadi solusi.
 */
const JS = String.raw`
GEN.tambah=function(){
  var a=rnd(3,19),n=rnd(5,40);
  return {t:'isi',q:'Tentukan nilai n pada persamaan n + '+a+' = '+(n+a)+'.',a:[String(n)],e:'Kebalikan penjumlahan adalah pengurangan: n = '+(n+a)+' - '+a+' = '+n+'.',g:{k:'setara',kb:1,ku:Math.min(a,12),kn:Math.min(n+a,20)}};
};
GEN.kurang=function(){
  var a=rnd(3,19),b=rnd(4,30);
  return {t:'isi',q:'Tentukan nilai n pada persamaan n - '+a+' = '+b+'.',a:[String(a+b)],e:'Kebalikan pengurangan adalah penjumlahan: n = '+b+' + '+a+' = '+(a+b)+'. Mengurangkan '+b+' - '+a+' adalah salah arah.'};
};
GEN.kali=function(){
  var a=rnd(2,9),n=rnd(3,12);
  return {t:'isi',q:'Tentukan nilai n pada persamaan '+a+' x n = '+(a*n)+'.',a:[String(n)],e:'Kebalikan perkalian adalah pembagian: n = '+(a*n)+' : '+a+' = '+n+'.',g:{k:'setara',kb:Math.min(a,6),kn:Math.min(a*n,24),kel:Math.min(a,6)===a&&a*n<=24?a:0,sorot:true}};
};
GEN.bagi=function(){
  var a=rnd(2,9),b=rnd(3,12);
  return {t:'isi',q:'Tentukan nilai n pada persamaan n : '+a+' = '+b+'. Nilai n = ...',a:[String(a*b)],e:'Kebalikan pembagian adalah perkalian: n = '+b+' x '+a+' = '+(a*b)+', bukan '+b+' : '+a+'.'};
};
GEN.cerita=function(){
  var n=rnd(8,60),a=rnd(3,15),j=rnd(0,3);
  if(j===0)return {t:'isi',q:'Wati punya beberapa kelereng. Setelah diberi '+a+' kelereng lagi, ia punya '+(n+a)+' kelereng. Berapa kelereng Wati mula-mula?',a:[String(n)],e:'Persamaan: n + '+a+' = '+(n+a)+', jadi n = '+(n+a)+' - '+a+' = '+n+'.'};
  if(j===1)return {t:'isi',q:'Sebuah toko punya beberapa buku. Setelah terjual '+a+' buku, tersisa '+n+' buku. Berapa buku mula-mula?',a:[String(n+a)],e:'Persamaan: n - '+a+' = '+n+', jadi n = '+n+' + '+a+' = '+(n+a)+'.'};
  var k=rnd(2,9),h=rnd(2,9)*500;
  if(j===2)return {t:'isi',q:'Harga '+k+' buah pensil yang sama adalah Rp'+titikRibu(k*h)+'. Berapa rupiah harga satu pensil?',a:[String(h)],e:'Persamaan: '+k+' x n = '+titikRibu(k*h)+', jadi n = '+titikRibu(k*h)+' : '+k+' = '+titikRibu(h)+'.'};
  return {t:'isi',q:'Sejumlah uang dibagi rata kepada '+k+' anak dan masing-masing mendapat Rp'+titikRibu(h)+'. Berapa rupiah uang mula-mula?',a:[String(k*h)],e:'Persamaan: n : '+k+' = '+titikRibu(h)+', jadi n = '+titikRibu(h)+' x '+k+' = '+titikRibu(k*h)+'.'};
};
GEN.rancang=function(){
  var n=rnd(5,30),a=rnd(2,12),j=rnd(0,2);
  if(j===0)return {t:'isi',q:'Tentukan nilai b agar persamaan n + '+a+' = b memiliki solusi n = '+n+'.',a:[String(n+a)],e:'Masukkan n = '+n+': b = '+n+' + '+a+' = '+(n+a)+'.'};
  if(j===1)return {t:'isi',q:'Tentukan nilai b agar persamaan n - '+a+' = b memiliki solusi n = '+(n+a)+'.',a:[String(n)],e:'Masukkan n = '+(n+a)+': b = '+(n+a)+' - '+a+' = '+n+'.'};
  return {t:'isi',q:'Tentukan nilai a agar persamaan a x n = '+(a*n)+' memiliki solusi n = '+n+'.',a:[String(a)],e:'a = '+(a*n)+' : '+n+' = '+a+'.'};
};
`

export const DATA_AC24: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Persamaan adalah kalimat matematika yang menyatakan dua ekspresi bernilai sama, ditandai tanda "=".', true, '5 + 3 = 8 adalah persamaan.'),
    bs('Pada n + 5 = 12, huruf n mewakili nilai yang belum diketahui.', true, 'n disebut variabel.', setara({ kb: 1, ku: 5, kn: 12 })),
    bs('Operasi kebalikan dari penjumlahan adalah pengurangan.', true, 'Menambah 5 dibatalkan dengan mengurangi 5.'),
    bs('Operasi kebalikan dari perkalian adalah pembagian.', true, '4 × n = 20 diselesaikan dengan 20 : 4.'),
    bs('Operasi kebalikan dari pengurangan adalah penjumlahan.', true, 'n - 3 = 9 diselesaikan dengan 9 + 3.'),
    bs('Untuk menyelesaikan n + 5 = 12, kita menjumlahkan 5 dan 12.', false, 'Gunakan kebalikannya: n = 12 - 5 = 7.', setara({ kb: 1, ku: 5, kn: 12 })),
    bs('Pada 4 × n = 20, nilai n = 80.', false, 'Membagi: n = 20 : 4 = 5. Mengalikan 4 × 20 adalah salah arah.', setara({ kb: 4, kn: 20, kel: 4, sorot: true })),
    bs('Pada n : 5 = 3, nilai n = 0,6.', false, 'Kebalikan pembagian adalah perkalian: n = 3 × 5 = 15.'),
    bs('Pada n - 3 = 9, nilai n = 6.', false, 'n = 9 + 3 = 12. Memeriksa: 12 - 3 = 9.'),
    bs('Semua jenis persamaan diselesaikan dengan pengurangan.', false, 'Setiap jenis memakai operasi kebalikannya masing-masing.'),
    bs('n = 9 adalah solusi n - 4 = 5.', true, 'Periksa: 9 - 4 = 5, kedua ruas sama.'),
    bs('Menambah bilangan yang sama pada kedua sisi persamaan membuat persamaan tetap seimbang.', true, 'Seperti neraca: tambah yang sama di kedua pan.', setara({ angkaL: 15, angkaR: 15 })),
    bs('Mengalikan kedua ruas persamaan dengan bilangan yang sama menjaga kesetaraan.', true, 'Kedua sisi tetap sama nilainya.'),
    bs('Menukar ruas kiri dan kanan (n + 5 = 12 menjadi 12 = n + 5) mengubah nilai n.', false, 'Nilai n tetap 7.'),
    bs('Persamaan satu langkah hanya punya satu jawaban yang benar.', true, 'n + 5 = 12 hanya terpenuhi oleh n = 7.'),
    bs('Pada a × n = b dengan b tetap, makin besar a makin besar n.', false, '2 × n = 12 → n = 6, tetapi 6 × n = 12 → n = 2.'),
  ],
  debat: [
    debat('Made dan Wati menyelesaikan n + 5 = 12.', ['Made: "n = 17, karena 12 + 5."', 'Wati: "n = 7, karena 12 - 5."'], 1, 'Gunakan operasi kebalikan: pengurangan.', setara({ kb: 1, ku: 5, kn: 12 })),
    debat('Rian dan Sinta menyelesaikan 4 × n = 20.', ['Rian: "n = 80."', 'Sinta: "n = 5, karena 20 : 4."'], 1, 'Periksa: 4 × 5 = 20.', setara({ kb: 4, kn: 20, kel: 4, sorot: true })),
    debat('Kiki dan Dedi menyelesaikan n : 6 = 4.', ['Kiki: "n = 0,67, bagi 4 dengan 6."', 'Dedi: "n = 24, karena 4 × 6."'], 1, '24 : 6 = 4.'),
    debat('Ani dan Budi menulis persamaan cerita "memberikan 5 kelereng, tersisa 12".', ['Ani: "n + 5 = 12."', 'Budi: "n - 5 = 12, karena kelerengnya berkurang."'], 1, 'Memberikan berarti berkurang, jadi n - 5 = 12 dan n = 17.'),
    debat('Eka dan Fajar menukar ruas persamaan n + 5 = 12.', ['Eka: "12 = n + 5, nilai n tetap 7."', 'Fajar: "n berubah jadi 17."'], 0, 'Kesetaraan tidak berubah ketika ruas ditukar.'),
    debat('Gita dan Hadi membahas persamaan pembagian n : a = b.', ['Gita: "Selalu dibagi: n = b : a."', 'Hadi: "Selalu dikali: n = b × a."'], 1, 'Kebalikan pembagian adalah perkalian.'),
  ],
  bank: [
    isi('Berapa nilai kotak pada persamaan □ + 2 = 6?', '4', '6 - 2 = 4.'),
    isi('Tentukan nilai x pada persamaan x + 1 = 5.', '4', '5 - 1 = 4.'),
    isi('Tentukan nilai n pada persamaan n + 9 = 14.', '5', '14 - 9 = 5.', setara({ kb: 1, ku: 9, kn: 14 })),
    isi('Tentukan nilai n pada persamaan n + 7 = 15.', '8', '15 - 7 = 8.'),
    isi('Tentukan nilai n pada persamaan n + 13 = 20.', '7', '20 - 13 = 7.'),
    isi('Tentukan nilai n pada persamaan 6 × n = 48.', '8', '48 : 6 = 8.'),
    isi('Tentukan nilai n pada persamaan 5 × n = 35.', '7', '35 : 5 = 7.'),
    isi('Tentukan nilai n pada persamaan n : 3 = 7. Nilai n = ...', '21', '7 × 3 = 21.'),
    isi('Tentukan nilai n pada persamaan n : 4 = 6. Nilai n = ...', '24', '6 × 4 = 24.'),
    isi('Tiga kotak bernilai sama dijumlahkan hasilnya 15 (□ + □ + □ = 15). Berapa nilai satu kotak?', '5', '15 : 3 = 5.'),
    isi('Harga 6 pensil yang sama adalah Rp18.000. Berapa rupiah harga satu pensil?', '3000', '18.000 : 6 = 3.000.'),
    isi('Sejumlah uang dibagi rata kepada 4 anak, masing-masing Rp25.000. Berapa rupiah uang mula-mula?', '100000', '25.000 × 4 = 100.000.'),
    isi('Sebuah toko punya n buku. Setelah terjual 15 buku, tersisa 32 buku. Berapa buku mula-mula?', '47', 'n - 15 = 32, n = 32 + 15 = 47.'),
    isi('Dedi punya beberapa kelereng. Setelah diberi 8 lagi ia punya 20. Berapa kelereng mula-mula?', '12', 'n + 8 = 20, n = 12.'),
    isi('Kamu punya Rp45.000 dari menjual n kue seharga Rp5.000 per kue. Berapa kue terjual?', '9', '5.000 × n = 45.000, n = 9.'),
    isi('Tentukan nilai b agar n + 8 = b memiliki solusi n = 15.', '23', '15 + 8 = 23.'),
    isi('Tentukan nilai b agar n - 12 = b memiliki solusi n = 30.', '18', '30 - 12 = 18.'),
    isi('Tentukan nilai a agar n : 6 = a memiliki solusi n = 48.', '8', '48 : 6 = 8.'),
    pg('Tentukan nilai n pada n - 8 = 11.', ['19', '3', '88', '1,375'], 0, 'n = 11 + 8 = 19.'),
    pg('Tentukan nilai n pada n - 6 = 9.', ['15', '3', '54', '1,5'], 0, 'n = 9 + 6 = 15.'),
    pg('Tentukan nilai n pada 7 × n = 63.', ['9', '8', '56', '441'], 0, '63 : 7 = 9.'),
    pg('Made punya n kelereng, diberi 4 lagi sehingga total 10. Persamaan yang tepat adalah...', ['n + 4 = 10', 'n - 4 = 10', '4 × n = 10', 'n : 4 = 10'], 0, 'Diberi berarti bertambah.'),
    pg('Wati punya n kelereng, mendapat 7 lagi sehingga total 15. Persamaan yang tepat adalah...', ['n + 7 = 15', 'n - 7 = 15', '7 × n = 15', 'n : 7 = 15'], 0, 'Bertambah 7.'),
    pg('Tangki n liter ditambah 15 liter menjadi 40 liter. Berapa n?', ['25', '55', '600', '2,67'], 0, 'n + 15 = 40, n = 25.'),
    pg('Dedi punya uang, dibelikan mainan Rp12.000, tersisa Rp8.000. Uang mula-mula...', ['Rp20.000', 'Rp4.000', 'Rp96.000', 'Rp8.000'], 0, 'n - 12.000 = 8.000, n = 20.000.'),
    pg('Manakah nilai a yang membuat a × n = 42 memiliki n = 6?', ['7', '6', '36', '48'], 0, '42 : 6 = 7.'),
    pg('Manakah nilai a yang membuat a × n = 36 memiliki n = 4?', ['9', '4', '32', '40'], 0, '36 : 4 = 9.'),
    pg('Manakah persamaan yang nilai n-nya 6?', ['n + 4 = 10', 'n - 4 = 10', 'n : 3 = 3', 'n : 2 = 2'], 0, '6 + 4 = 10.'),
    pg('Kiki mengklaim n = 9 solusi n - 4 = 5. Apakah benar?', ['Benar, 9 - 4 = 5', 'Salah, n = 1', 'Salah, n = 20'], 0, 'Substitusi: kedua ruas sama.'),
    pg('Sinta: "Semua persamaan n : a = b diselesaikan dengan b : a." Apakah benar?', ['Salah, n = b × a', 'Benar', 'Benar hanya untuk bilangan genap'], 0, 'Kebalikan pembagian adalah perkalian.'),
    pg('Pada persamaan 5 × n = 45, manakah cara yang benar?', ['Membagi 45 dengan 5', 'Mengalikan 45 dengan 5', 'Mengurangi 45 dengan 5'], 0, 'Kebalikan perkalian adalah pembagian.'),
    gen('tambah'),
    gen('kurang'),
    gen('kali'),
    gen('bagi'),
    gen('cerita'),
    gen('cerita'),
    gen('rancang'),
    gen('rancang'),
  ],
}
