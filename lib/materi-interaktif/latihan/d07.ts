import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { luasAlj } from '../gambar'

/**
 * Bahan latihan D-07 (Aljabar: bentuk aljabar dan sifat operasi).
 *
 * Konsep yang diuji bank soal topik ini: istilah (variabel, koefisien,
 * konstanta, suku), suku sejenis (variabel dan pangkat sama; 5xy dan 5yx
 * sejenis; 2x dan 2x^2 tidak), menyederhanakan dengan menjumlahkan koefisien,
 * substitusi, sifat distributif a(b + c) = ab + ac (termasuk tanda negatif),
 * menjabarkan dua kurung, bentuk ekuivalen (4(x+2)-2 = 4x+6), keliling dan
 * luas dengan bentuk aljabar, faktorisasi sederhana, dan memeriksa klaim
 * ekuivalen (satu nilai x tidak cukup). Salah paham: 3(x+2) = 3x+2, 2x+3y =
 * 5xy, 7p-3p = 4, -(2x-5) = -2x-5, (x+2)(x+3) = x^2+6, 5(x-2) = 5x-2.
 *
 * Jawaban bentuk aljabar diketik tanpa spasi bermakna (spasi diabaikan),
 * dengan tanda minus biasa: 4x+11, -3x+12. Pangkat tidak diminta diketik;
 * soal berpangkat memakai pilihan.
 *
 * `GEN.gabungSuku`, `GEN.jabarkan`, `GEN.jabarNegatif`, `GEN.substitusi`,
 * `GEN.duaKurung`, `GEN.kelilingLuas`.
 */
const JS = String.raw`
function sukuD(k,v){if(k===0)return '';return (k===1?'':(k===-1?'-':String(k)))+v}
function bentukD(a,b){
  var t=sukuD(a,'x');
  if(b>0)t+=(t?'+':'')+b;else if(b<0)t+=String(b);
  return t||'0';
}
GEN.gabungSuku=function(){
  var a=rnd(3,9),b=rnd(2,6),c=rnd(1,2),d=rnd(1,5),e=rnd(1,4);
  var kx=a-c,kk=d+e;
  return {t:'isi',q:'Sederhanakan: '+a+'x + '+d+' - '+c+'x + '+e+'.',a:[bentukD(kx,kk)],e:'Suku x: '+a+'x - '+c+'x = '+kx+'x. Konstanta: '+d+' + '+e+' = '+kk+'. Hasil '+bentukD(kx,kk)+'.'};
};
GEN.jabarkan=function(){
  var k=rnd(2,9),m=rnd(1,9);
  return {t:'isi',q:'Jabarkan: '+k+'(x + '+m+').',a:[bentukD(k,k*m)],e:k+' x x = '+k+'x dan '+k+' x '+m+' = '+(k*m)+'. Hasil '+bentukD(k,k*m)+'.',g:{k:'luasalj',w:['x',m],h:[k]}};
};
GEN.jabarNegatif=function(){
  var k=rnd(2,7),m=rnd(1,8);
  return {t:'isi',q:'Jabarkan: -'+k+'(x - '+m+').',a:[bentukD(-k,k*m)],e:'(-'+k+') x x = -'+k+'x dan (-'+k+') x (-'+m+') = +'+(k*m)+'. Hasil '+bentukD(-k,k*m)+'.'};
};
GEN.substitusi=function(){
  var a=rnd(2,9),b=rnd(1,9),x=rnd(2,9),neg=rnd(0,1);
  return {t:'isi',q:'Jika x = '+x+', berapa nilai dari '+a+'x '+(neg?'- ':'+ ')+b+'?',a:[String(a*x+(neg?-b:b))],e:a+' x '+x+' = '+(a*x)+', lalu '+(neg?'dikurangi ':'ditambah ')+b+' = '+(a*x+(neg?-b:b))+'.'};
};
GEN.duaKurung=function(){
  var k=rnd(2,5),m=rnd(1,6),j=rnd(2,5),n=rnd(1,6);
  var a=k+j,b=k*m+j*n;
  return {t:'isi',q:'Sederhanakan: '+k+'(x + '+m+') + '+j+'(x + '+n+').',a:[bentukD(a,b)],e:k+'x + '+(k*m)+' + '+j+'x + '+(j*n)+' = '+bentukD(a,b)+'.'};
};
GEN.kelilingLuas=function(){
  var m=rnd(2,9),l=rnd(2,6),u=rnd(0,1);
  return u?{t:'isi',q:'Persegi panjang berpanjang (x + '+m+') cm dan berlebar '+l+' cm. Tulis bentuk paling sederhana untuk LUASNYA.',a:[bentukD(l,l*m)],e:'Luas = '+l+'(x + '+m+') = '+bentukD(l,l*m)+'.',g:{k:'luasalj',w:['x',m],h:[l]}}:{t:'isi',q:'Persegi panjang berpanjang (x + '+m+') cm dan berlebar '+l+' cm. Tulis bentuk paling sederhana untuk KELILINGNYA.',a:[bentukD(2,2*m+2*l)],e:'Keliling = 2(x + '+m+' + '+l+') = '+bentukD(2,2*m+2*l)+'.'};
};
`

export const DATA_D07: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pada 5x + 3, huruf x disebut variabel.', true, 'Variabel = huruf pengganti bilangan.'),
    bs('Pada 7y, angka 7 disebut koefisien.', true, 'Angka yang menempel pada variabel.'),
    bs('Pada 4x + 9, angka 9 disebut konstanta.', true, 'Tanpa variabel.'),
    bs('Bagian bentuk aljabar yang dipisahkan tanda + atau − disebut suku.', true, '3x + 5y − 2 punya 3 suku.'),
    bs('5x dan 3x adalah suku sejenis.', true, 'Variabel dan pangkatnya sama.'),
    bs('2x dan 2x² adalah suku sejenis karena sama-sama memuat x.', false, 'Pangkatnya berbeda.'),
    bs('5xy dan 5yx adalah suku sejenis.', true, 'xy = yx.'),
    bs('4m dan −4m adalah suku sejenis.', true, 'Variabel sama; koefisien boleh negatif.'),
    bs('2x + 3y dapat disederhanakan menjadi 5xy.', false, 'x dan y tidak sejenis.'),
    bs('7p − 3p = 4.', false, '7p − 3p = 4p.'),
    bs('6x − 2x + 3 − 1 = 4x + 2.', true, '4x dan 2.'),
    bs('3(x + 2) sama dengan 3x + 2 untuk semua x.', false, '3(x + 2) = 3x + 6.', luasAlj([3], ['x', 2]) ),
    bs('2(x + 3) sama dengan 2x + 6 untuk semua x.', true, 'Sifat distributif.'),
    bs('−2(x − 5) = −2x + 10.', true, '(−2)(−5) = +10.'),
    bs('−(2x − 5) = −2x − 5.', false, 'Minus mengubah semua suku: −2x + 5.'),
    bs('(x + 2)(x + 3) = x² + 6.', false, 'Lupa hasil kali silang: x² + 5x + 6.', luasAlj(['x', 3], ['x', 2])),
    bs('(2x + 1)(x + 3) = 2x² + 7x + 3.', true, '2x² + 6x + x + 3.', luasAlj(['x', 'x', 3], ['x', 1])),
    bs('6x + 9 dapat ditulis 3(2x + 3).', true, 'Faktor persekutuan 3.'),
    bs('Cukup satu nilai x yang menghasilkan nilai sama untuk memastikan dua bentuk ekuivalen.', false, 'x + x dan x × x sama pada x = 2 tetapi berbeda pada x = 3.'),
    bs('Jika umur Andi x tahun dan kakaknya 5 tahun lebih tua, jumlah umur mereka 2x + 5.', true, 'x + (x + 5).'),
  ],
  debat: [
    debat('Dedi dan Eka menjabarkan 5(x − 2) + 3x.', ['Dedi: "5x − 2 + 3x = 8x − 2."', 'Eka: "5x − 10 + 3x = 8x − 10."'], 1, '5 dikalikan juga ke −2.'),
    debat('Gita dan Hadi mengerjakan (x + 2)(x + 3).', ['Gita: "x² + 6."', 'Hadi: "x² + 3x + 2x + 6 = x² + 5x + 6."'], 1, 'Ada hasil kali silang.', luasAlj(['x', 3], ['x', 2])),
    debat('Ira dan Joni menyederhanakan 2x + 3y.', ['Ira: "5xy."', 'Joni: "Sudah paling sederhana."'], 1, 'x dan y tidak sejenis.'),
    debat('Kiki dan Lani menjabarkan −(2x − 5).', ['Kiki: "−2x − 5."', 'Lani: "−2x + 5."'], 1, 'Minus berlaku untuk semua suku.'),
    debat('Made dan Nia menguji 3(x + 2) = 3x + 2 dengan x = 0.', ['Made: "Pada x = 0 hasilnya 6 lawan 2, tidak sama, jadi keliru."', 'Nia: "Coba satu nilai yang cocok saja sudah cukup."'], 0, 'Satu nilai yang berbeda sudah membuktikan tidak ekuivalen.'),
    debat('Oka dan Putri memeriksa x + x dan x × x di x = 2.', ['Oka: "Sama-sama 4, jadi ekuivalen."', 'Putri: "Coba x = 3: 6 dan 9, jadi tidak."'], 1, 'Satu nilai cocok belum cukup.'),
  ],
  bank: [
    isi('Pada 5x + 3, huruf x disebut ...', ['variabel'], 'Variabel.'),
    isi('Pada 7y, angka 7 disebut ...', ['koefisien'], 'Koefisien.'),
    isi('Pada 4x + 9, angka 9 disebut ...', ['konstanta'], 'Konstanta.'),
    isi('Bagian aljabar yang dipisahkan tanda + atau − disebut ...', ['suku'], 'Suku.'),
    isi('Bentuk 3x + 5y − 2 memiliki ... suku.', '3', 'Tiga suku.'),
    isi('Jika x = 3, nilai 2x + 5 adalah ...', '11', '2 × 3 + 5.'),
    isi('Jika a = 4, nilai 5a − 3 adalah ...', '17', '20 − 3.'),
    isi('Jika x = 5, nilai 3x − 4 adalah ...', '11', '15 − 4.'),
    isi('Sederhanakan 5x + 3x.', ['8x'], '5 + 3 = 8.'),
    isi('Sederhanakan 7y − 2y + 4y.', ['9y'], '7 − 2 + 4 = 9.'),
    isi('Sederhanakan 6a + 4a − a.', ['9a'], '9a.'),
    isi('Sederhanakan 8m − 3m + 5m.', ['10m'], '10m.'),
    isi('Sederhanakan 6x − 2x + 3 − 1.', ['4x+2'], '4x + 2.'),
    isi('Sederhanakan 6x + 9 − 2x.', ['4x+9'], '4x + 9.'),
    isi('Sederhanakan 4x + 3y − x + 2y.', ['3x+5y'], '3x + 5y.'),
    isi('Sederhanakan 2(x + 5).', ['2x+10'], '2x + 10.', luasAlj([ 'x', 5 ], [2])),
    isi('Sederhanakan 4(a + 3).', ['4a+12'], '4a + 12.'),
    isi('Sederhanakan −3(x − 4).', ['-3x+12'], '−3x + 12.'),
    isi('Lengkapi: 3(2p − 4) = ...p − 12. Isi angka di depan p.', '6', '3 × 2p = 6p.'),
    isi('Sederhanakan 3(x + 2) + x.', ['4x+6'], '3x + 6 + x.'),
    isi('Sederhanakan 2(x + 3) − (x − 1).', ['x+7'], '2x + 6 − x + 1.'),
    isi('Sederhanakan 3(2x + 1) − 2(x − 4).', ['4x+11'], '6x + 3 − 2x + 8.'),
    isi('Sederhanakan 3(x + 4) − (x − 2).', ['2x+14'], '3x + 12 − x + 2.'),
    isi('Persegi panjang berpanjang (x + 5) cm dan berlebar 3 cm. Tulis keliling paling sederhana.', ['2x+16'], '2(x + 5 + 3).'),
    isi('Persegi panjang berpanjang (x + 5) cm dan berlebar 3 cm. Tulis luas paling sederhana.', ['3x+15'], '3(x + 5).', luasAlj(['x', 5], [3])),
    isi('Keliling persegi (8x + 12) cm. Tulis panjang sisinya.', ['2x+3'], '(8x + 12) : 4.'),
    isi('Hasil perkalian dengan 4 adalah 4x + 20. Bentuk sebelum dikali 4?', ['x+5'], 'Bagi tiap suku dengan 4.'),
    isi('Keliling persegi panjang (2x + 18), lebar 4. Tulis panjangnya.', ['x+5'], 'Setengah keliling x + 9; dikurang 4.'),
    isi('Luas persegi panjang (5x + 15), panjang (x + 3). Berapa lebarnya?', '5', '5x + 15 = 5(x + 3).'),
    pg('Jabarkan (x + 2)(x + 3).', ['x² + 5x + 6', 'x² + 6', 'x² + 5x + 5', '2x + 5'], 0, 'x² + 3x + 2x + 6.', luasAlj(['x', 3], ['x', 2])),
    pg('Jabarkan (2x + 1)(x + 3).', ['2x² + 7x + 3', '2x² + 3', '2x² + 6x + 3', '3x + 4'], 0, '2x² + 6x + x + 3.'),
    pg('Jabarkan (x + 4)(x + 2).', ['x² + 6x + 8', 'x² + 8', 'x² + 6x + 6', '2x + 6'], 0, 'x² + 2x + 4x + 8.'),
    pg('Luas taman (2x + 3) m dan (x + 1) m setelah dijabarkan...', ['2x² + 5x + 3', '2x² + 3', '3x + 4', '2x² + 4x + 3'], 0, '2x² + 2x + 3x + 3.'),
    pg('Pasangan suku sejenis...', ['5x dan 3x', '2x dan 2x²', '3x dan 3y', '4 dan 4x'], 0, 'Variabel dan pangkat sama.'),
    pg('Pasangan suku sejenis berikut adalah ...', ['5xy dan 5yx', '5x dan 5y', '5x dan 5x²', '5xy dan 5x'], 0, 'xy = yx.'),
    pg('Bentuk yang sudah paling sederhana...', ['5x + 3y − 2', '4x + 3x − 2y', '6a + 2a', '3x + 2x'], 0, 'Tidak ada suku sejenis lagi.'),
    pg('Bentuk yang sama dengan 4x + 6...', ['4(x + 2) − 2', '4x + 2', '10x', '2(x + 6)'], 0, '4x + 8 − 2.'),
    pg('Bentuk yang sama dengan 6x + 9...', ['3(2x + 3)', '3(2x + 9)', '6(x + 9)', '9x'], 0, 'Dijabarkan 6x + 9.'),
    pg('Siswa: "5(x − 2) + 3x → 5x − 2 + 3x." Kesalahannya...', ['5 tidak dikalikan ke −2', 'Penjumlahan salah', 'Tidak ada kesalahan', 'Tanda x salah'], 0, 'Seharusnya 5x − 10 + 3x.'),
    pg('Siswa: "4(x − 5) + 2x = 4x − 5 + 2x = 6x − 5." Penilaian...', ['Keliru; 4 harus dikalikan ke −5 juga', 'Benar'], 0, '4x − 20 + 2x = 6x − 20.'),
    pg('Siswa: "(x + 2)(x + 3) = x² + 6." Penilaian...', ['Salah; lupa hasil kali silang', 'Benar'], 0, 'x² + 5x + 6.'),
    pg('"−(2x − 5) = −2x − 5." Penilaian...', ['Salah; seharusnya −2x + 5', 'Benar'], 0, 'Minus ke semua suku.'),
    pg('Memeriksa dua bentuk ekuivalen dengan satu nilai x yang cocok...', ['belum cukup', 'sudah cukup', 'selalu salah', 'tidak boleh'], 0, 'Dua bentuk bisa kebetulan sama.'),
    gen('gabungSuku'),
    gen('jabarkan'),
    gen('jabarNegatif'),
    gen('substitusi'),
    gen('duaKurung'),
    gen('kelilingLuas'),
  ],
}
