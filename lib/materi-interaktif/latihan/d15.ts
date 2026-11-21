import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { diagram } from '../gambar'

/**
 * Bahan latihan D-15 (Aljabar: barisan dan deret).
 *
 * Konsep yang diuji bank soal topik ini: barisan aritmetika (beda tetap, boleh
 * negatif) dan geometri (rasio tetap, boleh pecahan), suku pertama a, suku
 * ke-n (Un = a + (n-1)b; Un = a r^(n-1)), mencari beda, rasio, dan a dari dua
 * suku, deret (jumlah suku), Sn aritmetika = n/2 (2a + (n-1)b) = n/2 (a + Un),
 * Sn geometri = a(r^n - 1)/(r - 1), mengenali jenis (bukan keduanya untuk
 * kuadrat; konstan keduanya), dan cerita (kursi bertingkat, gaji, tabungan,
 * bakteri, virus). Salah paham: selisih yang teratur dianggap aritmetika,
 * lupa membagi 2, rumus aritmetika untuk deret geometri, rasio selalu > 1,
 * barisan mengecil bukan geometri.
 *
 * Jawaban angka tanpa titik ribuan; boleh bilangan negatif ditulis dengan -.
 *
 * `GEN.unAritmetika`, `GEN.unGeometri`, `GEN.snAritmetika`, `GEN.snGeometri`,
 * `GEN.cariBeda`, `GEN.kursiBertingkat`, `GEN.lipatTumbuh`.
 */
const JS = String.raw`
GEN.unAritmetika=function(){
  var a=rnd(2,15),b=rnd(2,9)*(rnd(0,3)?1:-1),n=rnd(5,12),s=[],i;
  for(i=0;i<4;i++)s.push(a+i*b);
  return {t:'isi',q:'Diketahui barisan aritmetika '+s.join(', ')+', ... Berapakah suku ke-'+n+' (U'+n+')?',a:[String(a+(n-1)*b)],e:'U'+n+' = '+a+' + '+(n-1)+' x ('+b+') = '+(a+(n-1)*b)+'.'};
};
GEN.unGeometri=function(){
  var a=rnd(1,6),r=rnd(2,3),n=rnd(4,6);
  return {t:'isi',q:'Diketahui barisan geometri dengan suku pertama a = '+a+' dan rasio r = '+r+'. Berapakah suku ke-'+n+' (U'+n+')?',a:[String(a*Math.pow(r,n-1))],e:'U'+n+' = '+a+' x '+r+'^'+(n-1)+' = '+(a*Math.pow(r,n-1))+'.'};
};
GEN.snAritmetika=function(){
  var a=rnd(1,9),b=rnd(2,7),n=rnd(5,12);
  return {t:'isi',q:'Diketahui deret aritmetika dengan suku pertama a = '+a+' dan beda b = '+b+'. Berapakah jumlah '+n+' suku pertama (S'+n+')?',a:[String(n*(2*a+(n-1)*b)/2)],e:'S'+n+' = '+n+'/2 x (2 x '+a+' + '+(n-1)+' x '+b+') = '+(n*(2*a+(n-1)*b)/2)+'.'};
};
GEN.snGeometri=function(){
  var a=rnd(1,5),r=rnd(2,3),n=rnd(3,5),s=a*(Math.pow(r,n)-1)/(r-1);
  return {t:'isi',q:'Diketahui deret geometri dengan suku pertama a = '+a+' dan rasio r = '+r+'. Berapakah jumlah '+n+' suku pertama (S'+n+')?',a:[String(s)],e:'S'+n+' = '+a+' x ('+r+'^'+n+' - 1) / ('+r+' - 1) = '+s+'.'};
};
GEN.cariBeda=function(){
  var a=rnd(1,9),b=rnd(2,7),m=rnd(2,4),n=m+rnd(3,5),u=rnd(0,1);
  return {t:'isi',q:'Pada barisan aritmetika diketahui U'+m+' = '+(a+(m-1)*b)+' dan U'+n+' = '+(a+(n-1)*b)+'. Berapakah '+(u?'suku pertama (a)':'beda (b)')+'?',a:[String(u?a:b)],e:'b = ('+(a+(n-1)*b)+' - '+(a+(m-1)*b)+') : '+(n-m)+' = '+b+'. a = '+(a+(m-1)*b)+' - '+(m-1)+' x '+b+' = '+a+'.'};
};
GEN.kursiBertingkat=function(){
  var a=rnd(3,20),b=rnd(2,6),n=rnd(5,10);
  return {t:'isi',q:'Kursi di sebuah aula disusun bertingkat: baris pertama '+a+' kursi dan tiap baris berikutnya bertambah '+b+' kursi. Jika ada '+n+' baris, berapa total kursi?',a:[String(n*(2*a+(n-1)*b)/2)],e:'S'+n+' = '+n+'/2 x (2 x '+a+' + '+(n-1)+' x '+b+') = '+(n*(2*a+(n-1)*b)/2)+'.'};
};
GEN.lipatTumbuh=function(){
  var a=rnd(2,20)*5,r=[2,3][rnd(0,1)],n=rnd(3,5);
  return {t:'isi',q:'Jumlah pengunjung situs pada hari pertama '+a+' orang dan berlipat '+r+' setiap hari. Berapa pengunjung pada hari ke-'+n+'?',a:[String(a*Math.pow(r,n-1))],e:a+' x '+r+'^'+(n-1)+' = '+(a*Math.pow(r,n-1))+'.'};
};
`

export const DATA_D15: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Barisan aritmetika memiliki selisih tetap antara dua suku berurutan yang disebut beda.', true, 'Misalnya 4, 9, 14, 19: beda 5.', diagram([{ l: 'U1', v: 4 }, { l: 'U2', v: 9 }, { l: 'U3', v: 14 }, { l: 'U4', v: 19 }], { lo: 0, hi: 20, langkah: 5, nilai: true })),
    bs('Barisan geometri memiliki perbandingan tetap antara dua suku berurutan yang disebut rasio.', true, '3, 9, 27, 81: rasio 3.'),
    bs('Deret adalah jumlah dari suku-suku suatu barisan.', true, 'Barisan dijumlahkan.'),
    bs('Barisan 3, 9, 27, 81 adalah aritmetika karena selisihnya (6, 18, 54) bertambah teratur.', false, 'Selisih tidak tetap; rasio tetap 3: geometri.'),
    bs('Barisan 1, 4, 9, 16, 25 adalah aritmetika maupun geometri.', false, 'Selisih 3, 5, 7, 9 tidak tetap; rasio tidak tetap.'),
    bs('Barisan 50, 44, 38, 32 adalah aritmetika dengan beda −6.', true, 'Beda boleh negatif.'),
    bs('Barisan yang suku-sukunya mengecil tidak mungkin geometri.', false, 'Rasio antara 0 dan 1 mengecilkan suku.'),
    bs('Setiap barisan geometri memiliki rasio lebih besar dari 1.', false, 'Rasio bisa 1/2 atau 1.'),
    bs('Barisan 7, 7, 7, 7 dapat dianggap aritmetika (beda 0) sekaligus geometri (rasio 1).', true, 'Memenuhi kedua definisi.'),
    bs('Rumus suku ke-n aritmetika adalah Un = a + (n − 1)b.', true, 'U10 untuk a = 6, b = 4 adalah 42.'),
    bs('Rumus suku ke-n geometri adalah Un = a × r^(n − 1).', true, 'U4 untuk a = 2, r = 3 adalah 54.'),
    bs('Sn = n/2 (2a + (n − 1)b) dapat ditulis Sn = n/2 (a + Un).', true, 'Karena Un = a + (n − 1)b.'),
    bs('Sn aritmetika dihitung dengan n(2a + (n − 1)b) tanpa dibagi 2.', false, 'Harus dibagi 2.'),
    bs('Jumlah 4 suku pertama geometri a = 2, r = 3 adalah 80.', true, '2 + 6 + 18 + 54.'),
    bs('Deret geometri dapat dihitung dengan rumus deret aritmetika.', false, 'Rumus harus sesuai jenisnya.'),
    bs('Pada barisan geometri dengan r = 1/2, suku makin kecil mendekati nol.', true, 'Tidak pernah mencapai nol.'),
    bs('Jumlah 10 suku pertama aritmetika a = 3, b = 5 adalah 255.', true, '5 × 51.'),
    bs('Barisan 100, 90, 80, 70 adalah aritmetika dengan beda −10.', true, 'Selisih tetap.'),
    bs('Barisan 5, 10, 20, 40 adalah geometri dengan rasio 2.', true, 'Perbandingan tetap.'),
    bs('Untuk menentukan jenis barisan, cukup menebak dari angka yang bertambah.', false, 'Periksa selisih atau perbandingannya.'),
  ],
  debat: [
    debat('Dedi dan Eka menilai barisan 1, 2, 4, 8, 16.', ['Dedi: "Aritmetika, selisihnya 1, 2, 4, 8 teratur."', 'Eka: "Geometri, rasionya tetap 2."'], 1, 'Rasio tetap 2.'),
    debat('Gita dan Hadi menghitung S5 untuk a = 2, b = 4.', ['Gita: "5 × (4 + 16) = 100."', 'Hadi: "5/2 × (4 + 16) = 50."'], 1, 'Jangan lupa membagi 2.'),
    debat('Ira dan Joni menilai barisan 1, 4, 9, 16, 25.', ['Ira: "Aritmetika."', 'Joni: "Bukan aritmetika maupun geometri."'], 1, 'Selisih 3, 5, 7, 9.'),
    debat('Kiki dan Lani menghitung S4 deret geometri a = 3, r = 2.', ['Kiki: "Pakai rumus aritmetika."', 'Lani: "3(2⁴ − 1)/(2 − 1) = 45."'], 1, 'Rumus geometri.'),
    debat('Made dan Nia membahas barisan 100, 50, 25.', ['Made: "Bukan geometri karena mengecil."', 'Nia: "Geometri dengan rasio 0,5."'], 1, 'Rasio boleh pecahan.'),
    debat('Oka dan Putri mencari U7 dari 10, 7, 4, 1.', ['Oka: "−8."', 'Putri: "28."'], 0, '10 + 6 × (−3) = −8.'),
  ],
  bank: [
    isi('Selisih tetap antara dua suku berurutan pada barisan aritmetika disebut ...', ['beda'], 'Beda.'),
    isi('Perbandingan tetap antara dua suku berurutan pada barisan geometri disebut ...', ['rasio'], 'Rasio.'),
    isi('Pada barisan aritmetika 2, 5, 8, 11, suku pertama (a) adalah ...', '2', 'Suku pertama.'),
    isi('Barisan aritmetika 9, 15, 21, 27. Berapa bedanya?', '6', '15 − 9.'),
    isi('Barisan aritmetika 7, 12, 17, 22. Berapa bedanya?', '5', '12 − 7.'),
    isi('Barisan geometri 5, 15, 45. Berapa rasionya?', '3', '15 : 5.'),
    isi('Barisan geometri 4, 8, 16, 32. Berapa rasionya?', '2', '8 : 4.'),
    isi('Barisan geometri 100, 50, 25. Berapa rasionya? (dengan koma)', ['0,5', '1/2'], '50 : 100.'),
    isi('Barisan aritmetika a = 6, b = 4. Berapa U10?', '42', '6 + 36.'),
    isi('Barisan aritmetika a = 5, b = 6. Berapa U6?', '35', '5 + 30.'),
    isi('Barisan aritmetika a = 4, b = 3. Berapa U6?', '19', '4 + 15.'),
    isi('Barisan aritmetika a = 3, b = 7. Berapa U8?', '52', '3 + 49.'),
    isi('Barisan aritmetika 20, 14, 8, 2. Berapa U6?', '-10', '20 − 30.'),
    isi('Barisan aritmetika 10, 7, 4, 1. Berapa U7?', '-8', '10 − 18.'),
    isi('Barisan geometri a = 2, r = 3. Berapa U4?', '54', '2 × 27.'),
    isi('Barisan geometri a = 4, r = 2. Berapa U5?', '64', '4 × 16.'),
    isi('Barisan geometri a = 3, r = 2. Berapa U5?', '48', '3 × 16.'),
    isi('Barisan geometri a = 5, r = 2. Berapa U6?', '160', '5 × 32.'),
    isi('Deret aritmetika a = 3, b = 5. Berapa S10?', '255', '5(6 + 45).'),
    isi('Deret geometri a = 2, r = 3. Berapa S4?', '80', '2 + 6 + 18 + 54.'),
    isi('Deret geometri a = 1, r = 2. Berapa S6?', '63', '2⁶ − 1.'),
    isi('Aritmetika U3 = 11 dan U7 = 23. Berapa beda?', '3', '12 : 4.'),
    isi('Aritmetika U3 = 11 dan U7 = 23. Berapa suku pertama?', '5', '11 − 6.'),
    isi('Aritmetika U2 = 9 dan U9 = 44. Berapa beda?', '5', '35 : 7.'),
    isi('Aritmetika U2 = 9 dan U9 = 44. Berapa suku pertama?', '4', '9 − 5.'),
    isi('Geometri positif U2 = 6 dan U4 = 54. Berapa rasionya?', '3', 'r² = 9.'),
    isi('Deret aritmetika a = 2 dan S5 = 50. Berapa U5?', '18', '5/2 (2 + U5) = 50.'),
    isi('Aula: baris pertama 5 kursi, tiap baris bertambah 3, 8 baris. Berapa total kursi?', '124', '4 × 31.'),
    isi('Bioskop: baris depan 20 kursi, tiap baris bertambah 4, 10 baris. Berapa total kursi?', '380', '5 × 76.'),
    isi('Gedung: baris pertama 8 kursi, tiap baris bertambah 5, 7 baris. Berapa total kursi?', '161', '7/2 × 46.'),
    isi('Piramida buah 1, 3, 5, 7, ... ada 6 lapisan. Berapa total buah?', '36', '6².'),
    isi('Bakteri 10 mula-mula, berlipat dua tiap jam. Berapa setelah 5 jam?', '320', '10 × 32.'),
    isi('Pengunjung hari pertama 50, berlipat dua tiap hari. Berapa pada hari ke-4?', '400', '50 × 8.'),
    isi('Virus berlipat tiga tiap hari, hari pertama 2 orang. Berapa pada hari ke-4?', '54', '2 × 27.'),
    isi('Gaji Rp2.000.000 naik Rp150.000 per bulan. Berapa rupiah pada bulan ke-13?', '3800000', '2.000.000 + 12 × 150.000.'),
    isi('Menabung Rp10.000, bertambah Rp5.000 tiap minggu, 10 minggu. Berapa rupiah total?', '325000', '5 × 65.000.'),
    pg('Barisan 4, 9, 14, 19 adalah ...', ['aritmetika dengan beda 5', 'geometri dengan rasio 5', 'bukan keduanya', 'geometri dengan rasio 2'], 0, 'Selisih 5.'),
    pg('Barisan 8, 16, 32, 64 adalah ...', ['geometri dengan rasio 2', 'aritmetika dengan beda 8', 'bukan keduanya', 'aritmetika dengan beda 2'], 0, 'Rasio 2.'),
    pg('Barisan 1, 4, 9, 16, 25 adalah ...', ['bukan aritmetika maupun geometri', 'aritmetika', 'geometri', 'aritmetika dengan beda 4'], 0, 'Selisihnya 3, 5, 7, 9.'),
    pg('Barisan −3, −1, 1, 3 adalah ...', ['aritmetika dengan beda 2', 'geometri', 'aritmetika dengan beda −2', 'bukan keduanya'], 0, 'Selisih 2.'),
    pg('Rumus jumlah n suku pertama deret aritmetika adalah ...', ['Sn = n/2 (2a + (n − 1)b)', 'Sn = n(2a + (n − 1)b)', 'Sn = a + (n − 1)b', 'Sn = a r^(n − 1)'], 0, 'Dibagi 2.'),
    pg('Rumus jumlah n suku pertama deret geometri (r > 1) adalah ...', ['Sn = a(rⁿ − 1)/(r − 1)', 'Sn = n/2 (2a + (n − 1)b)', 'Sn = a rⁿ', 'Sn = a(1 − r)'], 0, 'Rumus geometri.'),
    pg('Siswa menghitung S5 (a = 2, b = 4) dengan 5(4 + 16) = 100. Kesalahannya ...', ['Lupa membagi 2; yang benar 50', 'Salah menjumlah', 'Tidak ada kesalahan', 'Seharusnya 200'], 0, 'S5 = 50.'),
    pg('Siswa memakai rumus aritmetika untuk deret geometri. Kesalahannya ...', ['Salah rumus; harus rumus deret geometri', 'Tidak ada kesalahan', 'Salah menjumlah', 'Seharusnya dikurang'], 0, 'Jenis menentukan rumus.'),
    pg('Tabungan Rp500.000 tumbuh dengan faktor 1,2 tiap tahun. Setelah 3 tahun ...', ['Rp864.000', 'Rp800.000', 'Rp600.000', 'Rp1.500.000'], 0, '500.000 × 1,728.'),
    gen('unAritmetika'),
    gen('unGeometri'),
    gen('snAritmetika'),
    gen('snGeometri'),
    gen('cariBeda'),
    gen('kursiBertingkat'),
    gen('lipatTumbuh'),
  ],
}
