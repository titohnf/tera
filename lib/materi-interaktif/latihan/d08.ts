import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { pita, petak } from '../gambar'

/**
 * Bahan latihan D-08 (Bilangan: bilangan berpangkat, bentuk akar, notasi
 * ilmiah).
 *
 * Konsep yang diuji bank soal topik ini: basis dan pangkat, a^0 = 1, pangkat
 * negatif = kebalikan (bukan negatif), (-3)^2 positif dan (-2)^3 negatif,
 * sifat pangkat (kali: jumlah; bagi: kurang; pangkat dari pangkat: kali),
 * akar kuadrat dan pangkat tiga sebagai kebalikan pangkat, akar bukan
 * penjumlahan (sqrt(9+16) tidak sama dengan sqrt9 + sqrt16), menyederhanakan
 * akar (sqrt50 = 5 sqrt2), akar sejenis dijumlah, akar kuadrat sempurna
 * rasional, notasi ilmiah a x 10^n dengan 1 <= a < 10 (besar dan kecil),
 * operasi notasi ilmiah. Salah paham: (a^2)^3 = a^5, (a+b)^2 = a^2+b^2,
 * sqrt2 + sqrt3 = sqrt5, 5 sqrt3 = 3 sqrt5, sqrt9 irasional, 2^-2 = -4.
 *
 * Bentuk bersuperskrip dan akar sulit diketik, jadi butir tentang bentuk itu
 * memakai pilihan; isian hanya untuk angka biasa.
 *
 * `GEN.pangkat`, `GEN.pangkatNeg`, `GEN.akarKuadrat`, `GEN.akarTiga`,
 * `GEN.kaliPangkat`, `GEN.koefIlmiah`, `GEN.pangkatIlmiah`.
 */
const JS = String.raw`
GEN.pangkat=function(){
  var b=rnd(2,6),n=rnd(2,4),neg=rnd(0,1)&&b<=4;
  if(b>=5&&n>3)n=3;
  var v=Math.pow(b,n),sg2=neg&&n%2===1?-1:1;
  var supm={'2':'²','3':'³','4':'⁴'};
  return {t:'isi',q:'Hitunglah: '+(neg?'(-'+b+')':b)+supm[n]+'.',a:[String(sg2*v)],e:(neg?'(-'+b+')':b)+supm[n]+' = '+(sg2*v)+'.'+(neg?(n%2?' Pangkat ganjil: hasil negatif.':' Pangkat genap: hasil positif.'):'')};
};
GEN.pangkatNeg=function(){
  var b=rnd(2,5),n=rnd(1,3),d=Math.pow(b,n);
  return {t:'isi',q:'Nyatakan '+b+(n===1?'⁻¹':'⁻'+(n===2?'²':'³'))+' sebagai pecahan 1/..., isi penyebutnya.',a:[String(d)],e:b+' pangkat -'+n+' = 1/'+b+(n===1?'':(n===2?'²':'³'))+' = 1/'+d+'.',g:{k:'pita',baris:[{n:d,w:1,l:'1/'+d}]}};
};
GEN.akarKuadrat=function(){
  var n=rnd(2,15);
  return {t:'isi',q:'Hitunglah √'+(n*n)+'.',a:[String(n)],e:n+' x '+n+' = '+(n*n)+', jadi akarnya '+n+'.',g:{k:'petak',n:Math.min(n,9)}};
};
GEN.akarTiga=function(){
  var n=rnd(2,9);
  return {t:'isi',q:'Hitunglah ∛'+(n*n*n)+'.',a:[String(n)],e:n+'³ = '+(n*n*n)+', jadi akar pangkat tiganya '+n+'.'};
};
GEN.kaliPangkat=function(){
  var b=rnd(2,3),m=rnd(2,4),n=rnd(2,4);
  return {t:'isi',q:'Berapa nilai '+b+'^'+m+' x '+b+'^'+n+'? (hitung hasil akhirnya)',a:[String(Math.pow(b,m+n))],e:'Basis sama dikali: pangkat dijumlah '+(m+n)+'. '+b+'^'+(m+n)+' = '+Math.pow(b,m+n)+'.'};
};
GEN.koefIlmiah=function(){
  var a=rnd(11,99)/10,n=rnd(2,7),v=Math.round(a*Math.pow(10,n));
  var s=String(a).replace('.',',');
  return {t:'isi',q:'Bilangan '+titikRibu(v)+' ditulis a x 10 pangkat '+n+' (notasi ilmiah). Berapa a? (dengan koma)',a:[s],e:titikRibu(v)+' = '+s+' x 10^'+n+', koma digeser '+n+' tempat.'};
};
GEN.pangkatIlmiah=function(){
  var a=rnd(1,9),n=rnd(3,8),d=Math.pow(10,n),v=a*d;
  return {t:'isi',q:'Bilangan '+titikRibu(v)+' ditulis a x 10 pangkat n dengan 1 <= a < 10. Berapa n?',a:[String(n)],e:titikRibu(v)+' = '+a+' x 10^'+n+'.'};
};
`

export const DATA_D08: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pada 2⁵, angka 5 disebut pangkat (eksponen).', true, '2 adalah basis.'),
    bs('Pada 3⁴, angka 3 disebut basis (bilangan pokok).', true, '3 dikalikan 4 kali.'),
    bs('a⁰ = 1 untuk setiap a yang bukan nol.', true, '7⁰ = 1.'),
    bs('3⁻² menghasilkan bilangan negatif.', false, '3⁻² = 1/9.', pita([{ n: 9, w: 1, l: '1/9' }])),
    bs('2⁻² = −4.', false, 'Pangkat negatif berarti kebalikan: 1/4.'),
    bs('Untuk basis positif lebih dari 1, pangkat negatif yang makin besar menghasilkan nilai makin kecil mendekati 0.', true, '0,5; 0,25; 0,125.'),
    bs('(−3)² menghasilkan bilangan negatif.', false, '(−3)² = 9.'),
    bs('(−2)³ = −8.', true, 'Pangkat ganjil dengan basis negatif tetap negatif.'),
    bs('2³ × 2⁴ = 2⁷.', true, 'Pangkat dijumlahkan.'),
    bs('5⁶ ÷ 5⁴ = 5².', true, 'Pangkat dikurangkan.'),
    bs('(2³)² = 2⁵.', false, 'Pangkat dikalikan: 2⁶ = 64.'),
    bs('(a + b)² = a² + b² untuk semua a dan b.', false, '(a + b)² = a² + 2ab + b².'),
    bs('Akar kuadrat adalah kebalikan dari pangkat dua.', true, '√(n²) = n.', petak(4)),
    bs('∛27 dibaca akar pangkat tiga dari 27.', true, 'Hasilnya 3.'),
    bs('√(9 + 16) = √9 + √16.', false, '√25 = 5, sedangkan 3 + 4 = 7.'),
    bs('√(4 × 9) = √4 × √9.', true, '6 = 2 × 3.'),
    bs('√9 irasional karena ada tanda akar.', false, '√9 = 3, bilangan rasional.'),
    bs('√50 = 5√2.', true, '√25 × √2.'),
    bs('√2 + √3 = √5.', false, 'Akar tidak sejenis tidak dapat dijumlahkan.'),
    bs('3√2 + 5√2 = 8√2.', true, 'Koefisien akar sejenis dijumlahkan.'),
    bs('5√3 dan 3√5 bernilai sama.', false, '8,66 lawan 6,71.'),
    bs('4.500 dalam notasi ilmiah adalah 4,5 × 10³.', true, 'Koma digeser 3 tempat.'),
    bs('Notasi ilmiah a × 10ⁿ mensyaratkan 1 ≤ a < 10.', true, 'Misalnya 8 × 10⁵.'),
    bs('0,00042 = 4,2 × 10⁻⁴.', true, 'Koma digeser 4 tempat ke kanan.'),
  ],
  debat: [
    debat('Dedi dan Eka menghitung (2³)⁴.', ['Dedi: "2⁷."', 'Eka: "2¹², pangkat dikalikan."'], 1, 'Pangkat dari pangkat dikalikan.'),
    debat('Gita dan Hadi menilai 2⁻².', ['Gita: "−4."', 'Hadi: "1/4."'], 1, 'Pangkat negatif berarti kebalikan.', pita([{ n: 4, w: 1, l: '1/4' }])),
    debat('Ira dan Joni menghitung √(9 + 16).', ['Ira: "3 + 4 = 7."', 'Joni: "√25 = 5."'], 1, 'Jumlahkan dulu di dalam akar.'),
    debat('Kiki dan Lani menjumlahkan √2 + √3.', ['Kiki: "√5."', 'Lani: "Tidak bisa disatukan karena tidak sejenis."'], 1, 'Hanya akar sejenis yang dijumlahkan.'),
    debat('Made dan Nia menulis 0,00042 dalam notasi ilmiah.', ['Made: "4,2 × 10⁴."', 'Nia: "4,2 × 10⁻⁴."'], 1, 'Bilangan kecil: pangkat negatif.'),
    debat('Oka dan Putri menilai √9.', ['Oka: "Irasional, ada tanda akar."', 'Putri: "3, rasional."'], 1, 'Akar bilangan kuadrat sempurna rasional.'),
  ],
  bank: [
    isi('Pada 5³, angka 5 disebut ... (basis / pangkat)', ['basis'], '5 adalah basis; 3 adalah pangkat.'),
    isi('Nilai a⁰ untuk a ≠ 0 adalah ...', '1', 'Selalu 1.'),
    isi('Hitunglah 2³.', '8', '2 × 2 × 2.'),
    isi('Hitunglah (−2)³.', '-8', 'Pangkat ganjil negatif.'),
    isi('Hitunglah 3⁴.', '81', '3 × 3 × 3 × 3.'),
    isi('Hitunglah (−3)³.', '-27', '−27.'),
    isi('Hitunglah 4³.', '64', '4 × 4 × 4.'),
    isi('Hitunglah 5⁰.', '1', 'Bilangan berpangkat nol.'),
    isi('Hitunglah √16.', '4', '4 × 4.'),
    isi('Hitunglah √81.', '9', '9 × 9.'),
    isi('Hitunglah √100.', '10', '10 × 10.'),
    isi('Hitunglah ∛27.', '3', '3³ = 27.'),
    isi('Hitunglah ∛64.', '4', '4³ = 64.'),
    isi('Hasil 2³ × 2⁴ adalah ...', '128', '2⁷ = 128.'),
    isi('Hasil 3² × 3³ adalah ...', '243', '3⁵ = 243.'),
    isi('Hasil (2³)² adalah ...', '64', '2⁶ = 64.'),
    isi('Hasil 5⁶ ÷ 5⁴ adalah ...', '25', '5² = 25.'),
    isi('Notasi ilmiah 25.000 adalah a × 10ⁿ. Berapa a? (dengan koma)', ['2,5'], 'Koma digeser 4 tempat.'),
    isi('Notasi ilmiah 25.000 adalah a × 10ⁿ. Berapa n?', '4', '4 tempat.'),
    isi('Notasi ilmiah 3.200 adalah a × 10ⁿ. Berapa n?', '3', '3,2 × 10³.'),
    isi('Cahaya 3 × 10⁸ m/detik. Berapa koefisien untuk 2 detik (dalam a × 10⁸)?', '6', '3 × 2 = 6.'),
    isi('Startup 3,5 × 10⁹ rupiah jadi 2 kali lipat. Koefisien barunya (a × 10⁹)?', '7', '3,5 × 2 = 7.'),
    isi('Bakteri 2,4 × 10⁶ jadi 2 kali lipat. Koefisien barunya?', ['4,8'], '2,4 × 2 = 4,8.'),
    isi('Sisi taman persegi adalah 4√3 m, yaitu √n m. Berapa n (luas taman)?', '48', '16 × 3 = 48.'),
    pg('Pada 6³, angka 6 disebut ...', ['basis (bilangan pokok)', 'pangkat (eksponen)', 'koefisien', 'konstanta'], 0, 'Basis.'),
    pg('2⁻² sama dengan ...', ['1/4', '−4', '−1/4', '4'], 0, 'Kebalikan dari 2².'),
    pg('Bentuk umum notasi ilmiah adalah ...', ['a × 10ⁿ dengan 1 ≤ a < 10', 'a × 10ⁿ dengan 0 < a < 1', 'a + 10ⁿ', 'a × 10ⁿ dengan a bilangan apa pun'], 0, 'Syarat 1 ≤ a < 10.'),
    pg('Notasi ilmiah yang benar untuk 4.500 adalah ...', ['4,5 × 10³', '45 × 10²', '0,45 × 10⁴', '4,5 × 10²'], 0, 'Koma digeser 3 tempat.'),
    pg('Notasi ilmiah yang tepat untuk 0,0006 adalah ...', ['6 × 10⁻⁴', '6 × 10⁴', '0,6 × 10⁻³', '60 × 10⁻⁵'], 0, 'Koma digeser 4 tempat ke kanan.'),
    pg('Notasi ilmiah diameter virus 0,00000012 m adalah ...', ['1,2 × 10⁻⁷', '1,2 × 10⁻⁶', '1,2 × 10⁷', '12 × 10⁻⁸'], 0, '7 tempat.'),
    pg('Bentuk sederhana √50 adalah ...', ['5√2', '25√2', '2√5', '10√5'], 0, '√25 × √2.'),
    pg('Bentuk sederhana √72 adalah ...', ['6√2', '36√2', '8√3', '2√36'], 0, '√36 × √2.'),
    pg('Bentuk sederhana √98 adalah ...', ['7√2', '49√2', '14√7', '2√49'], 0, '√49 × √2.'),
    pg('Bentuk sederhana √48 adalah ...', ['4√3', '16√3', '3√4', '12'], 0, '√16 × √3.'),
    pg('Bentuk sederhana √32 adalah ...', ['4√2', '16√2', '2√4', '8√2'], 0, '√16 × √2.'),
    pg('Hasil 3√2 + 5√2 adalah ...', ['8√2', '8√4', '15√2', '8'], 0, 'Koefisien dijumlah.'),
    pg('Bentuk yang bernilai sama dengan √48...', ['4√3', '√16 × √3', '2√12', '12√4'], 0, 'Semua 6,93 kecuali satu.'),
    pg('Hasil (2 × 10³) × (3 × 10²) adalah ...', ['6 × 10⁵', '6 × 10⁶', '5 × 10⁵', '6 × 10¹'], 0, '2 × 3 = 6; 3 + 2 = 5.'),
    pg('Hasil (4 × 10³) ÷ (2 × 10¹) adalah ...', ['2 × 10²', '2 × 10⁴', '8 × 10²', '2 × 10³'], 0, '4 : 2 = 2; 3 − 1 = 2.'),
    pg('Hasil 5 × 10⁸ + 2 × 10⁸ adalah ...', ['7 × 10⁸', '7 × 10¹⁶', '10 × 10⁸', '7 × 10⁰'], 0, 'Pangkat sama: jumlahkan koefisien.'),
    pg('Pernyataan yang keliru...', ['√(a + b) = √a + √b untuk semua a, b ≥ 0', '√(4 × 9) = √4 × √9', 'a² × a³ = a⁵', '√9 = 3'], 0, 'Akar tidak dapat dipecah dari penjumlahan.'),
    pg('Siswa: "(a²)³ = a⁵." Penilaian...', ['Salah; a⁶', 'Benar'], 0, 'Pangkat dikalikan.'),
    pg('Siswa: "(a + b)² = a² + b²." Penilaian...', ['Salah; ada suku 2ab', 'Benar'], 0, 'a² + 2ab + b².'),
    pg('Siswa: "√2 + √3 = √5." Penilaian...', ['Salah; akar tidak sejenis', 'Benar'], 0, '1,41 + 1,73 ≠ 2,24.'),
    pg('Siswa: "0,00042 = 4,2 × 10⁻⁴." Penilaian...', ['Benar', 'Salah'], 0, 'Koma digeser 4 tempat.'),
    pg('Siswa: "√9 irasional karena ada tanda akar." Penilaian...', ['Salah; √9 = 3', 'Benar'], 0, 'Rasional.'),
    gen('pangkat'),
    gen('pangkatNeg'),
    gen('akarKuadrat'),
    gen('akarTiga'),
    gen('kaliPangkat'),
    gen('koefIlmiah'),
    gen('pangkatIlmiah'),
  ],
}
