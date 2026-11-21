import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { kartesius, panahRelasi } from '../gambar'

/**
 * Bahan latihan D-13 (Aljabar: relasi, fungsi, koordinat Kartesius).
 *
 * Konsep yang diuji bank soal topik ini: relasi sebagai pasangan berurutan,
 * domain (masukan, daerah asal), range (keluaran yang benar-benar muncul),
 * fungsi (tiap anggota domain tepat satu pasangan; range boleh sama semua),
 * f(x) dibaca nilai fungsi untuk masukan x dan menghitung f(a) (juga negatif
 * dan kuadrat), mencari range dari domain tertentu, pola linear f(x) = ax + b,
 * koordinat (x, y) dengan urutan penting, sumbu-x mendatar dan sumbu-y tegak,
 * kuadran I sampai IV (berlawanan arah jarum jam), titik asal, jarak ke sumbu
 * (nilai mutlak), jarak dua titik yang sejajar sumbu, titik tengah, luas
 * segitiga pada bidang, dan cerita (taksi, sewa, pulsa, ongkir, dua rumus
 * dibandingkan atau disamakan). Salah paham: domain dan range tertukar,
 * (3, 5) sama dengan (5, 3), jarak negatif atau nol, setiap relasi fungsi,
 * titik yang "mungkin" ada pada grafik.
 *
 * Jawaban angka tanpa titik ribuan; koordinat dan himpunan lewat pilihan.
 *
 * `GEN.nilaiFungsi`, `GEN.jarakVertikal`, `GEN.jarakMendatar`,
 * `GEN.biayaFungsi`, `GEN.cariMasukan`, `GEN.samaBiaya`, `GEN.banyakRange`.
 */
const JS = String.raw`
function mnD(n){return String(n).replace('-','−')}
GEN.nilaiFungsi=function(){
  var a=rnd(2,7),b=rnd(1,9),neg=rnd(0,1)?-1:1,x=neg*rnd(1,6),sgn=rnd(0,1);
  var v=a*x+(sgn?b:-b);
  return {t:'isi',q:'Diketahui f(x) = '+a+'x '+(sgn?'+ ':'- ')+b+'. Berapakah nilai f('+x+')?',a:[String(v)],e:'f('+x+') = '+a+' x ('+x+') '+(sgn?'+ ':'- ')+b+' = '+v+'.'};
};
GEN.jarakVertikal=function(){
  var x=rnd(-6,6),y1=rnd(-8,8),y2=rnd(-8,8);
  if(y1===y2)y2=y1+5;
  return {t:'isi',q:'Titik A('+x+', '+y1+') dan titik B('+x+', '+y2+') memiliki nilai x yang sama. Berapa jarak antara A dan B?',a:[String(Math.abs(y1-y2))],e:'Jarak = |'+y1+' - ('+y2+')| = '+Math.abs(y1-y2)+'. Garis AB sejajar sumbu-y.',g:{k:'kartesius',r:10,garis:[[x,y1,x,y2]],titik:[{x:x,y:y1,l:'A'},{x:x,y:y2,l:'B'}]}};
};
GEN.jarakMendatar=function(){
  var y=rnd(-6,6),x1=rnd(-8,8),x2=rnd(-8,8);
  if(x1===x2)x2=x1+6;
  return {t:'isi',q:'Titik C('+x1+', '+y+') dan titik D('+x2+', '+y+') memiliki nilai y yang sama. Berapa jarak antara C dan D?',a:[String(Math.abs(x1-x2))],e:'Jarak = |'+x1+' - ('+x2+')| = '+Math.abs(x1-x2)+'. Garis CD sejajar sumbu-x.',g:{k:'kartesius',r:10,garis:[[x1,y,x2,y]],titik:[{x:x1,y:y,l:'C'},{x:x2,y:y,l:'D'}]}};
};
GEN.biayaFungsi=function(){
  var a=rnd(2,9)*1000,b=rnd(2,6)*1000,x=rnd(3,15);
  return {t:'isi',q:'Biaya sewa dirumuskan f(x) = '+titikRibu(a)+' + '+titikRibu(b)+'x dengan x lama sewa (jam). Berapa rupiah biaya untuk '+x+' jam?',a:[String(a+b*x)],e:titikRibu(a)+' + '+titikRibu(b)+' x '+x+' = '+titikRibu(a+b*x)+'.'};
};
GEN.cariMasukan=function(){
  var a=rnd(2,9)*1000,b=rnd(2,6)*500,x=rnd(3,14);
  return {t:'isi',q:'Ongkir dirumuskan f(x) = '+titikRibu(a)+' + '+titikRibu(b)+'x dengan x berat paket (kg). Jika ongkir yang dibayar Rp'+titikRibu(a+b*x)+', berapa kg beratnya?',a:[String(x)],e:titikRibu(b)+'x = '+titikRibu(a+b*x)+' - '+titikRibu(a)+' = '+titikRibu(b*x)+'; x = '+x+'.'};
};
GEN.samaBiaya=function(){
  var x=rnd(4,20),m1=rnd(3,6)*100,m2=m1+rnd(1,3)*100,c2=rnd(1,4)*1000,c1=c2+(m2-m1)*x;
  return {t:'isi',q:'Percetakan P: f(x) = '+titikRibu(c1)+' + '+m1+'x. Percetakan Q: g(x) = '+titikRibu(c2)+' + '+m2+'x (x jumlah lembar). Untuk berapa lembar biaya keduanya sama?',a:[String(x)],e:titikRibu(c1)+' + '+m1+'x = '+titikRibu(c2)+' + '+m2+'x; '+titikRibu(c1-c2)+' = '+(m2-m1)+'x; x = '+x+'.'};
};
GEN.banyakRange=function(){
  var a=rnd(2,5),b=rnd(1,6),n=rnd(3,6);
  return {t:'isi',q:'Diketahui f(x) = '+a+'x + '+b+' dengan domain {0, 1, 2, ..., '+(n-1)+'} ('+n+' anggota). Berapa banyak anggota range yang berbeda?',a:[String(n)],e:'Tiap x memberi hasil berbeda, jadi '+n+' anggota range.'};
};
`

export const DATA_D13: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Domain adalah himpunan nilai masukan (daerah asal).', true, 'Nilai x.'),
    bs('Range adalah himpunan nilai x yang dimasukkan ke relasi.', false, 'Range adalah keluaran yang muncul.'),
    bs('Domain adalah himpunan nilai keluaran, range adalah himpunan nilai masukan.', false, 'Tertukar.'),
    bs('Relasi {(1,2), (2,3), (3,4)} adalah fungsi.', true, 'Tiap domain satu pasangan.', panahRelasi([1, 2, 3], [2, 3, 4], [[0, 0], [1, 1], [2, 2]])),
    bs('Relasi {(1,2), (1,5), (2,6)} adalah fungsi.', false, '1 dipasangkan dengan 2 dan 5.', panahRelasi([1, 2], [2, 5, 6], [[0, 0], [0, 1], [1, 2]])),
    bs('Relasi {(2,7), (4,7), (6,7)} adalah fungsi walau hasilnya sama semua.', true, 'Tiap domain tetap satu pasangan.'),
    bs('Setiap relasi berupa pasangan berurutan pasti fungsi.', false, 'Syaratnya tiap domain tepat satu pasangan.'),
    bs('Jika domain 3 muncul dengan dua pasangan berbeda, relasinya bukan fungsi.', true, 'Satu x dua y.'),
    bs('Notasi f(x) dibaca nilai fungsi f untuk masukan x.', true, 'Bukan f dikali x.'),
    bs('Untuk f(x) = 6x − 4, nilai f(3) adalah 14.', true, '18 − 4.'),
    bs('Untuk f(x) = x² − 1, nilai f(−3) adalah 8.', true, '9 − 1.'),
    bs('Sumbu mendatar disebut sumbu-x dan sumbu tegak disebut sumbu-y.', true, 'Titik ditulis (x, y).', kartesius(5, {})),
    bs('Titik (3, 5) sama dengan titik (5, 3).', false, 'Urutan (x, y) berbeda.', kartesius(6, { bantu: true, titik: [{ x: 3, y: 5, l: '(3, 5)' }, { x: 5, y: 3, l: '(5, 3)', w: 'biru' }] })),
    bs('Titik (−3, 5) terletak di kuadran II.', true, 'x negatif, y positif.'),
    bs('Titik (4, −2) terletak di kuadran IV.', true, 'x positif, y negatif.'),
    bs('Titik (−7, −2) terletak di kuadran III.', true, 'Keduanya negatif.'),
    bs('Titik (0, 0) disebut titik asal.', true, 'Perpotongan sumbu.'),
    bs('Jarak titik (0, −15) ke sumbu-x adalah −15.', false, 'Jarak positif: 15.'),
    bs('Jarak titik (1, 2) dan (1, −2) adalah 0.', false, 'Jaraknya 4.'),
    bs('Titik tengah (2, 4) dan (8, 10) adalah (5, 7).', true, 'Rata-rata tiap koordinat.'),
  ],
  debat: [
    debat('Dedi dan Eka menilai {(1,1), (2,1), (1,3)}.', ['Dedi: "Fungsi."', 'Eka: "Bukan; 1 dipasangkan dengan 1 dan 3."'], 1, 'Satu domain dua pasangan.'),
    debat('Gita dan Hadi menilai {(2,3), (4,3), (6,3)}.', ['Gita: "Bukan fungsi, hasilnya sama semua."', 'Hadi: "Fungsi; tiap domain satu pasangan."'], 1, 'Range boleh sama.'),
    debat('Ira dan Joni menghitung jarak (3, 7) dan (3, −2).', ['Ira: "−9."', 'Joni: "9, jarak tidak negatif."'], 1, '|7 − (−2)| = 9.'),
    debat('Kiki dan Lani menjawab kuadran titik (−3, 5).', ['Kiki: "Kuadran II."', 'Lani: "Kuadran IV."'], 0, 'x negatif, y positif.', kartesius(6, { kuadran: true, titik: [{ x: -3, y: 5, l: 'P' }] })),
    debat('Made dan Nia menilai titik (2, 7) pada grafik f(x) = 3x − 1.', ['Made: "Mungkin ada, jadi f(2) = 7."', 'Nia: "f(2) = 5, jadi (2, 7) bukan titik grafik."'], 1, 'Hitung dulu.'),
    debat('Oka dan Putri menentukan domain dan range.', ['Oka: "Domain adalah x, range adalah y."', 'Putri: "Domain adalah y, range adalah x."'], 0, 'Domain masukan, range keluaran.'),
  ],
  bank: [
    isi('Himpunan nilai masukan suatu relasi disebut ... (domain / range)', ['domain'], 'Daerah asal.'),
    isi('Garis mendatar pada bidang Kartesius disebut sumbu ... (x / y)', ['x'], 'Sumbu-x.'),
    isi('Garis tegak pada bidang Kartesius disebut sumbu ... (x / y)', ['y'], 'Sumbu-y.'),
    isi('Bidang Kartesius dibagi menjadi empat daerah yang disebut ...', ['kuadran'], 'Kuadran.'),
    isi('Relasi {(1,2), (2,4), (3,6)}. Berapa banyak anggota domain?', '3', '1, 2, 3.', panahRelasi([1, 2, 3], [2, 4, 6], [[0, 0], [1, 1], [2, 2]])),
    isi('f(x) = 3x + 2 dengan domain {0, 1, 2, 3}. Berapa banyak anggota range yang berbeda?', '4', '2, 5, 8, 11.'),
    isi('f(x) = 6x − 4. Berapa f(3)?', '14', '18 − 4.'),
    isi('f(x) = x + 9. Berapa f(−3)?', '6', '−3 + 9.'),
    isi('f(x) = 2x + 3. Berapa f(4)?', '11', '8 + 3.'),
    isi('f(x) = 3x − 5. Berapa f(2)?', '1', '6 − 5.'),
    isi('f(x) = 4x − 3. Berapa f(5)?', '17', '20 − 3.'),
    isi('f(x) = x² − 1. Berapa f(−3)?', '8', '9 − 1.'),
    isi('Pasangan (1,5), (2,8), (3,11), (4,14) mengikuti f(x) = ax + b. Berapa f(6)?', '20', 'a = 3, b = 2.'),
    isi('Jarak titik (0, −15) ke sumbu-x adalah ...', '15', '|−15|.'),
    isi('Jarak titik (−6, 0) ke sumbu-y adalah ...', '6', '|−6|.'),
    isi('Jarak titik (0, −8) ke sumbu-x adalah ...', '8', '|−8|.'),
    isi('Titik A(2, 3) dan B(2, 9). Berapa jarak AB?', '6', '|9 − 3|.'),
    isi('Titik C(−4, 5) dan D(3, 5). Berapa jarak CD?', '7', '|3 − (−4)|.'),
    isi('Titik (5, −2) dan (5, 11). Berapa jaraknya?', '13', '|11 − (−2)|.'),
    isi('A(3, 2), B(3, 10), C(9, 2) membentuk segitiga siku-siku di A. Berapa satuan luasnya?', '24', '½ × 8 × 6.'),
    isi('Ongkos taksi f(x) = 8.000 + 4.000x. Berapa rupiah untuk 12 km?', '56000', '8.000 + 48.000.'),
    isi('Biaya sewa f(x) = 5.000 + 2.000x, anggaran Rp29.000. Berapa jam maksimal?', '12', '2.000x ≤ 24.000.'),
    isi('Paket data f(x) = 15.000 + 2.500x dan total Rp40.000. Berapa GB tambahan?', '10', '2.500x = 25.000.'),
    isi('Ongkir f(x) = 10.000 + 3.000x dan Rp31.000 dibayar. Berapa kg beratnya?', '7', '3.000x = 21.000.'),
    isi('Ongkir f(x) = 12.000 + 3.500x dan Rp47.000 dibayar. Berapa kg beratnya?', '10', '3.500x = 35.000.'),
    isi('P: f(x) = 2.000 + 500x dan Q: g(x) = 1.000 + 600x. Untuk berapa lembar biayanya sama?', '10', '100x = 1.000.'),
    pg('Relasi disebut fungsi jika ...', ['setiap anggota domain dipasangkan dengan tepat satu anggota range', 'setiap anggota range punya satu pasangan', 'domain dan range sama banyak', 'hasilnya selalu berbeda'], 0, 'Tepat satu pasangan.'),
    pg('Domain dan range relasi {(2,6), (3,9), (4,12)} adalah ...', ['{2, 3, 4} dan {6, 9, 12}', '{6, 9, 12} dan {2, 3, 4}', '{2, 3, 4} dan {2, 3, 4}', '{6, 9, 12} dan {6, 9, 12}'], 0, 'Domain x, range y.'),
    pg('Range f(x) = 2x − 1 untuk domain {−2, −1, 0, 1, 2} adalah ...', ['{−5, −3, −1, 1, 3}', '{−2, −1, 0, 1, 2}', '{−3, −1, 1, 3, 5}', '{−4, −2, 0, 2, 4}'], 0, 'Hitung tiap f(x).'),
    pg('Range f(x) = x² − 4 untuk domain {−2, −1, 0, 1, 2} adalah ...', ['{−4, −3, 0}', '{0, −3, −4, −3, 0}', '{−2, −1, 0, 1, 2}', '{0, 4}'], 0, 'Nilai kembar ditulis sekali.'),
    pg('Range f(x) = 3x + 1 untuk domain {−1, 0, 1, 2} adalah ...', ['{−2, 1, 4, 7}', '{−1, 0, 1, 2}', '{−3, 1, 4, 7}', '{−2, 1, 3, 7}'], 0, 'Hitung tiap f(x).'),
    pg('Manakah relasi yang fungsi? A={(1,2),(2,3),(3,4)} B={(1,2),(1,5),(2,6)} C={(2,7),(4,7),(6,7)} D={(1,1),(2,1),(1,3)}', ['A dan C', 'B dan D', 'A dan B', 'hanya C'], 0, 'Tiap domain tepat satu pasangan.'),
    pg('Titik (−7, −2) terletak di kuadran ...', ['III', 'I', 'II', 'IV'], 0, 'Keduanya negatif.'),
    pg('Titik (5, −9) terletak di kuadran ...', ['IV', 'I', 'II', 'III'], 0, 'x positif, y negatif.'),
    pg('Titik tengah (2, 4) dan (8, 10) adalah ...', ['(5, 7)', '(10, 14)', '(6, 6)', '(4, 5)'], 0, 'Rata-rata tiap koordinat.'),
    pg('Titik E(1, 2) dan F(1, −3) berada pada garis yang sejajar dengan ...', ['sumbu-y', 'sumbu-x', 'tidak ada', 'diagonal'], 0, 'x sama: garis tegak.'),
    pg('Toko A f(x) = 1.000 + 900x, Toko B g(x) = 1.200 + 850x. Untuk 8 paket yang lebih murah ...', ['Toko B (8.000 lawan 8.200)', 'Toko A', 'Sama', 'Tidak dapat dihitung'], 0, '1.200 + 6.800.'),
    pg('Vendor A f(x) = 3.000 + 700x, Vendor B g(x) = 2.000 + 900x. Untuk 10 unit yang lebih murah ...', ['Vendor A (10.000 lawan 11.000)', 'Vendor B', 'Sama', 'Tidak dapat dihitung'], 0, 'A: 10.000; B: 11.000.'),
    pg('Siswa: "Jarak (3, 7) dan (3, −2) adalah −9." Penilaian ...', ['Salah; jarak 9', 'Benar'], 0, 'Jarak positif.'),
    pg('Siswa: "Titik (2, 7) mungkin pada grafik f(x) = 3x − 1, jadi f(2) = 7." Penilaian ...', ['Salah; f(2) = 5', 'Benar'], 0, 'Hitung dulu.'),
    gen('nilaiFungsi'),
    gen('jarakVertikal'),
    gen('jarakMendatar'),
    gen('biayaFungsi'),
    gen('cariMasukan'),
    gen('samaBiaya'),
    gen('banyakRange'),
  ],
}
