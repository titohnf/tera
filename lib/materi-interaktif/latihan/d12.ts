import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { pyth } from '../gambar'

/**
 * Bahan latihan D-12 (Geometri: Teorema Pythagoras).
 *
 * Konsep yang diuji bank soal topik ini: hipotenusa (sisi di depan sudut
 * siku-siku, selalu terpanjang) dan kaki, c^2 = a^2 + b^2 (hanya segitiga
 * siku-siku; setelah c^2 ambil akar), triple Pythagoras (3-4-5, 5-12-13,
 * 8-15-17, 7-24-25, 20-21-29 dan kelipatannya), mencari kaki (a^2 = c^2 -
 * b^2), bentuk akar paling sederhana (2 akar 5, 3 akar 2, akar 61, diagonal
 * persegi s akar 2), kebalikan Pythagoras dan jenis segitiga (a^2 + b^2
 * dibanding c^2: sama = siku-siku, lebih besar = lancip, lebih kecil =
 * tumpul), dan cerita (tangga, kabel, TV, taman, kapal, segitiga sama kaki).
 * Salah paham: lupa akar (c = 169), hipotenusa salah tempat, menjumlahkan
 * kaki langsung, sama berarti tumpul, 4,5,6 dianggap tumpul, sisi terpanjang
 * sembarang segitiga disebut hipotenusa.
 *
 * Jawaban angka tanpa satuan; bentuk akar lewat pilihan.
 *
 * `GEN.hipotenusa`, `GEN.kakiLain`, `GEN.tanggaTinggi`, `GEN.diagonalLayar`,
 * `GEN.kuadratC`, `GEN.tripleKali`.
 */
const JS = String.raw`
var TRP=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[20,21,29],[9,40,41],[12,35,37],[11,60,61]];
GEN.hipotenusa=function(){
  var q=TRP[rnd(0,TRP.length-1)],k=rnd(1,2)*(q[2]>30?1:1),a=q[0]*k,b=q[1]*k,c=q[2]*k;
  return {t:'isi',q:'Segitiga siku-siku memiliki dua sisi siku-siku '+a+' cm dan '+b+' cm. Berapa cm hipotenusanya?',a:[String(c)],e:a+'^2 + '+b+'^2 = '+(a*a)+' + '+(b*b)+' = '+(c*c)+'; c = '+c+'.',g:{k:'pyth',a:a*24/Math.max(a,b),b:b*24/Math.max(a,b),polos:true,lab:{a:String(a),b:String(b),c:'?'}}};
};
GEN.kakiLain=function(){
  var q=TRP[rnd(0,TRP.length-1)],k=rnd(1,2),u=rnd(0,1),c=q[2]*k,m=q[u]*k,n=q[1-u]*k;
  return {t:'isi',q:'Segitiga siku-siku memiliki hipotenusa '+c+' cm dan satu sisi siku-siku '+m+' cm. Berapa cm sisi siku-siku yang lain?',a:[String(n)],e:c+'^2 - '+m+'^2 = '+(c*c)+' - '+(m*m)+' = '+(n*n)+'; sisi = '+n+'.'};
};
GEN.tanggaTinggi=function(){
  var q=TRP[rnd(0,3)],k=rnd(1,3),c=q[2]*k,j=q[0]*k,t=q[1]*k;
  return {t:'isi',q:'Sebuah tangga sepanjang '+c+' m disandarkan pada tembok. Jarak kaki tangga ke tembok '+j+' m. Berapa meter tinggi tembok yang dicapai ujung atas tangga?',a:[String(t)],e:'t^2 = '+c+'^2 - '+j+'^2 = '+(t*t)+'; t = '+t+' m.',g:{k:'pyth',a:t,b:j,polos:true,lab:{a:'?',b:j+' m',c:c+' m'}}};
};
GEN.diagonalLayar=function(){
  var q=TRP[rnd(0,3)],k=rnd(1,4),l=q[0]*k,t=q[1]*k;
  return {t:'isi',q:'Layar televisi berbentuk persegi panjang dengan lebar '+l+' inci dan tinggi '+t+' inci. Berapa inci ukuran diagonalnya?',a:[String(q[2]*k)],e:'sqrt('+(l*l)+' + '+(t*t)+') = sqrt('+(q[2]*q[2]*k*k)+') = '+(q[2]*k)+'.'};
};
GEN.kuadratC=function(){
  var a=rnd(2,15),b=rnd(2,15);
  return {t:'isi',q:'Segitiga siku-siku dengan kaki '+a+' cm dan '+b+' cm. Berapa nilai c kuadrat (c adalah hipotenusa)?',a:[String(a*a+b*b)],e:a+'^2 + '+b+'^2 = '+(a*a)+' + '+(b*b)+' = '+(a*a+b*b)+'.',g:{k:'pyth',a:a*12/Math.max(a,b),b:b*12/Math.max(a,b),luas:true,lab:{a:String(a*a),b:String(b*b),c:'?'}}};
};
GEN.tripleKali=function(){
  var q=[[3,4,5],[5,12,13],[8,15,17]][rnd(0,2)],k=rnd(2,5);
  return {t:'isi',q:'Triple Pythagoras '+q[0]+'-'+q[1]+'-'+q[2]+' dikalikan '+k+'. Berapa bilangan terbesar pada triple yang baru?',a:[String(q[2]*k)],e:q[2]+' x '+k+' = '+(q[2]*k)+'.'};
};
`

export const DATA_D12: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Hipotenusa adalah sisi di depan sudut siku-siku.', true, 'Sisi miring.'),
    bs('Hipotenusa selalu sisi terpendek pada segitiga siku-siku.', false, 'Hipotenusa terpanjang.'),
    bs('Pada segitiga PQR siku-siku di Q, hipotenusanya PR.', true, 'Di depan sudut Q.', pyth(3, 4, { polos: true, lab: { a: 'PQ', b: 'QR', c: 'PR' } })),
    bs('Dua sisi yang mengapit sudut siku-siku disebut kaki.', true, 'Kaki atau sisi siku-siku.'),
    bs('Rumus c² = a² + b² hanya berlaku untuk segitiga siku-siku.', true, 'Bukan sembarang segitiga.'),
    bs('Setelah menghitung c² = 169, jawabannya c = 169.', false, 'Ambil akar: c = 13.'),
    bs('3, 4, 5 adalah triple Pythagoras.', true, '9 + 16 = 25.', pyth(3, 4, { luas: true })),
    bs('6, 8, 10 adalah triple Pythagoras.', true, 'Kelipatan 3-4-5.'),
    bs('5-12-13 jika dikalikan 4 menjadi 20-48-52 tetap triple Pythagoras.', true, 'Rasio sisi tidak berubah.'),
    bs('Jika a² + b² = c², segitiga pasti siku-siku.', true, 'Kebalikan Pythagoras.'),
    bs('Segitiga bersisi 9, 40, 41 siku-siku karena 81 + 1.600 = 1.681 = 41².', true, 'Sama.'),
    bs('Segitiga bersisi 5, 6, 7 siku-siku.', false, '25 + 36 = 61 ≠ 49.'),
    bs('Segitiga bersisi 5, 6, 7 adalah segitiga lancip.', true, '61 > 49.'),
    bs('Segitiga bersisi 4, 5, 6 adalah segitiga tumpul.', false, '16 + 25 = 41 > 36: lancip.'),
    bs('Segitiga bersisi 33, 56, 65 adalah segitiga tumpul.', false, '33² + 56² = 65²: siku-siku.'),
    bs('Segitiga bersisi 10, 15, 20 adalah segitiga siku-siku.', false, '325 ≠ 400: tumpul.'),
    bs('Diagonal persegi bersisi s adalah s√2.', true, '√(s² + s²).'),
    bs('Bentuk akar hasil Pythagoras selalu bisa disederhanakan lebih lanjut.', false, '√34 sudah paling sederhana.'),
    bs('√20 = 2√5.', true, '√4 × √5.'),
    bs('Pada sembarang segitiga, sisi terpanjang boleh disebut hipotenusa.', false, 'Hanya pada segitiga siku-siku.'),
  ],
  debat: [
    debat('Dedi dan Eka menghitung segitiga siku-siku dengan kaki 5 dan 12.', ['Dedi: "c = 25 + 144 = 169."', 'Eka: "c² = 169, jadi c = 13."'], 1, 'Ambil akar.', pyth(5, 12, { luas: true })),
    debat('Gita dan Hadi menilai sisi 4, 5, 6.', ['Gita: "16 + 25 = 41 > 36, lancip."', 'Hadi: "41 > 36, tumpul."'], 0, 'Lebih besar berarti lancip.'),
    debat('Ira dan Joni menyederhanakan √20.', ['Ira: "2√10."', 'Joni: "2√5."'], 1, '20 = 4 × 5.'),
    debat('Kiki dan Lani mencari kaki segitiga siku-siku berhipotenusa 13 dan kaki 5.', ['Kiki: "13 − 5 = 8."', 'Lani: "√(169 − 25) = 12."'], 1, 'Gunakan kuadrat.'),
    debat('Made dan Nia menghitung tinggi tangga 10 m yang kakinya 6 m dari tembok.', ['Made: "10 + 6 = 16 m."', 'Nia: "√(100 − 36) = 8 m."'], 1, 'Tangga adalah hipotenusa.', pyth(8, 6, { polos: true, lab: { a: '?', b: '6 m', c: '10 m' } })),
    debat('Oka dan Putri menilai sisi 33, 56, 65.', ['Oka: "Siku-siku, karena 33² + 56² = 65²."', 'Putri: "Tumpul."'], 0, 'Sama berarti siku-siku.'),
  ],
  bank: [
    isi('Sisi miring segitiga siku-siku disebut ... (hipotenusa)', ['hipotenusa'], 'Di depan sudut siku-siku.'),
    isi('Pada segitiga PQR siku-siku di Q, sisi miringnya adalah ... (dua huruf)', ['PR', 'RP'], 'Di depan Q.'),
    isi('Pada segitiga LMN siku-siku di M, sisi miringnya adalah ... (dua huruf)', ['LN', 'NL'], 'Di depan M.'),
    isi('Pada segitiga XYZ siku-siku di X, sisi miringnya adalah ... (dua huruf)', ['YZ', 'ZY'], 'Di depan X.'),
    isi('Kaki 3 cm dan 4 cm. Berapa cm hipotenusanya?', '5', '9 + 16 = 25.', pyth(3, 4, { luas: true })),
    isi('Kaki 6 cm dan 8 cm. Berapa cm hipotenusanya?', '10', '100.'),
    isi('Kaki 9 cm dan 12 cm. Berapa cm hipotenusanya?', '15', '225.'),
    isi('Kaki 7 cm dan 24 cm. Berapa cm hipotenusanya?', '25', '625.'),
    isi('Kaki 12 cm dan 16 cm. Berapa cm hipotenusanya?', '20', '400.'),
    isi('Kaki 20 cm dan 21 cm. Berapa cm hipotenusanya?', '29', '841.'),
    isi('Kaki 12 cm dan 35 cm. Berapa cm hipotenusanya?', '37', '1.369.'),
    isi('Kaki 11 cm dan 60 cm. Berapa cm hipotenusanya?', '61', '3.721.'),
    isi('Hipotenusa 13 cm dan satu kaki 5 cm. Berapa cm kaki yang lain?', '12', '169 − 25 = 144.'),
    isi('Hipotenusa 17 cm dan satu kaki 8 cm. Berapa cm kaki yang lain?', '15', '289 − 64 = 225.'),
    isi('Hipotenusa 26 cm dan satu kaki 10 cm. Berapa cm kaki yang lain?', '24', '676 − 100.'),
    isi('Hipotenusa 53 cm dan satu kaki 28 cm. Berapa cm kaki yang lain?', '45', '2.809 − 784.'),
    isi('Tangga 10 m, kaki 6 m dari tembok. Berapa meter tinggi yang dicapai?', '8', '100 − 36.', pyth(8, 6, { polos: true, lab: { a: '?', b: '6 m', c: '10 m' } })),
    isi('Tangga 52 m, kaki 20 m dari tembok. Berapa meter tinggi yang dicapai?', '48', '2.704 − 400.'),
    isi('Layar TV lebar 18 inci dan tinggi 24 inci. Berapa inci diagonalnya?', '30', '324 + 576 = 900.'),
    isi('Tiang 15 m ditambatkan ke titik 20 m dari kaki tiang. Berapa meter kabelnya?', '25', '225 + 400.'),
    isi('Taman 12 m × 9 m. Berapa meter jalan setapak diagonal?', '15', '144 + 81.'),
    isi('Perahu berlayar 5 km ke barat lalu 12 km ke utara. Berapa km jarak lurus dari awal?', '13', '25 + 144.'),
    isi('Segitiga sama kaki: kaki 10 cm, alas 12 cm. Berapa cm tingginya?', '8', 'Setengah alas 6; 100 − 36.'),
    isi('Rumus c kuadrat sama dengan a kuadrat ditambah b kuadrat. Berapa c kuadrat bila a = 5 dan b = 6?', '61', '25 + 36.'),
    pg('Teorema Pythagoras menyatakan bahwa dalam segitiga siku-siku ...', ['kuadrat hipotenusa sama dengan jumlah kuadrat kedua kaki', 'hipotenusa sama dengan jumlah kedua kaki', 'jumlah semua sudut 180°', 'kuadrat kaki sama dengan hipotenusa'], 0, 'c² = a² + b².'),
    pg('Hipotenusa segitiga siku-siku berkaki 2 cm dan 4 cm adalah ...', ['2√5 cm', '√6 cm', '6 cm', '4√5 cm'], 0, '√20 = 2√5.'),
    pg('Hipotenusa segitiga siku-siku berkaki 3 cm dan 3 cm adalah ...', ['3√2 cm', '6 cm', '√6 cm', '9 cm'], 0, '√18 = 3√2.'),
    pg('Hipotenusa segitiga siku-siku berkaki 5 cm dan 6 cm adalah ...', ['√61 cm', '11 cm', '√11 cm', '30 cm'], 0, '25 + 36 = 61.'),
    pg('Diagonal persegi bersisi 6 cm adalah ...', ['6√2 cm', '12 cm', '6 cm', '36 cm'], 0, 's√2.'),
    pg('Diagonal persegi panjang 5 cm × 3 cm adalah ...', ['√34 cm', '8 cm', '√8 cm', '34 cm'], 0, '25 + 9 = 34.'),
    pg('Bentuk sederhana √45 adalah ...', ['3√5', '9√5', '3√15', '5√3'], 0, '45 = 9 × 5.'),
    pg('Rumus mencari kaki a bila c dan b diketahui ...', ['a² = c² − b²', 'a² = c² + b²', 'a = c − b', 'a² = b² − c²'], 0, 'Pindah ruas.'),
    pg('Tiga bilangan yang merupakan triple Pythagoras ...', ['3, 4, 5', '4, 5, 6', '5, 6, 7', '2, 3, 4'], 0, '9 + 16 = 25.'),
    pg('Kelipatan 3-4-5 yang juga triple Pythagoras ...', ['6, 8, 10', '6, 8, 11', '5, 7, 9', '9, 12, 16'], 0, 'Dikali 2.'),
    pg('Tangga A 17 m (kaki 8 m) dan tangga B 25 m (kaki 7 m). Yang lebih tinggi ...', ['Tangga B (24 m lawan 15 m)', 'Tangga A', 'Sama', 'Tidak dapat dihitung'], 0, '√(625 − 49) = 24.'),
    pg('Siswa: "c² = 169, jadi c = 169." Kesalahannya ...', ['Lupa mengambil akar kuadrat', 'Salah menjumlah', 'Seharusnya c = 169/2', 'Tidak ada kesalahan'], 0, 'c = 13.'),
    pg('Siswa menyederhanakan √20 menjadi 2√10. Kesalahannya ...', ['Salah memilih faktor kuadrat sempurna (20 = 4 × 5)', 'Tidak ada kesalahan', 'Salah mengurangi', 'Salah mengalikan'], 0, '2√5.'),
    pg('Segitiga bersisi 5, 6, 7 adalah ...', ['lancip', 'siku-siku', 'tumpul', 'sama sisi'], 0, '61 > 49.'),
    pg('Segitiga bersisi 10, 15, 20 adalah ...', ['tumpul', 'siku-siku', 'lancip', 'sama kaki'], 0, '325 < 400.'),
    gen('hipotenusa'),
    gen('kakiLain'),
    gen('tanggaTinggi'),
    gen('diagonalLayar'),
    gen('kuadratC'),
    gen('tripleKali'),
  ],
}
