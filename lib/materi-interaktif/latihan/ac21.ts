import { bs, debat, gen, isi, kata, pg, type DataMateri } from '../bersama'
import { faktor, papan } from '../gambar'

/**
 * Bahan latihan AC-21 (Faktor, bilangan prima, KPK dan FPB).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * bilangan prima (tepat dua faktor; 1 bukan prima; 2 satu-satunya prima
 * genap) dan komposit (lebih dari dua faktor, 15 komposit), arah faktor dan
 * kelipatan (3 faktor dari 12, bukan kelipatan), faktorisasi prima (pohon
 * faktor, semua faktor prima, 2 x 15 belum lengkap), faktor persekutuan dan
 * FPB (yang TERBESAR: FPB(20,30)=10 bukan 5, FPB(14,21)=7 bukan 1, FPB
 * selalu <= bilangan yang kecil), saling prima, KPK (kelipatan persekutuan
 * terkecil; KPK >= bilangan yang besar; dua prima berbeda: hasil kali; satu
 * kelipatan yang lain: KPK = yang besar), FPB x KPK = hasil kali dua
 * bilangan, cerita pembagian rata (FPB) dan lampu atau bus bersamaan (KPK),
 * serta salah paham: FPB dua bilangan berbeda selalu 1, bilangan prima pasti
 * FPB 1, makin besar bilangan makin besar FPB, KPK harus lewat faktorisasi.
 *
 * `GEN.fpb` FPB (daftar atau cerita kantong), `GEN.kpk` KPK (daftar atau
 * cerita lampu/bus), `GEN.fakpri` faktorisasi prima, `GEN.prima` pilih
 * bilangan prima.
 *
 * Jawaban faktorisasi prima ditulis "2 x 2 x 3" (tanda x atau tanda kali,
 * spasi bebas, dari yang terkecil).
 */
const JS = String.raw`
function gcdG(a,b){return b?gcdG(b,a%b):a}
function lcmG(a,b){return a/gcdG(a,b)*b}
function priG(n){var r=[],p=2;while(n>1){if(n%p===0){r.push(p);n/=p}else p++}return r}
GEN.fpb=function(){
  var P=[[12,18],[8,12],[16,24],[18,24],[20,30],[24,36],[30,45],[15,25],[14,21],[9,15],[28,42],[36,48],[12,30],[40,60]],p=P[rnd(0,P.length-1)],a=p[0],b=p[1],f=gcdG(a,b),mode=rnd(0,2);
  if(mode===0)return {t:'isi',q:'Tentukan FPB (Faktor Persekutuan Terbesar) dari '+a+' dan '+b+'.',a:[String(f)],e:'Faktor sama dari '+a+' dan '+b+', yang terbesar: '+f+'.',g:[{k:'faktor',n:a,semua:true},{k:'faktor',n:b,semua:true}]};
  var N=[['pensil','penghapus'],['permen','cokelat'],['apel','jeruk'],['buku','pensil']],n=N[rnd(0,N.length-1)];
  return {t:'isi',q:'Ada '+a+' '+n[0]+' dan '+b+' '+n[1]+'. Semuanya dibagi rata ke beberapa kantong tanpa sisa, isi tiap kantong sama. Berapa kantong PALING BANYAK yang bisa dibuat?',a:[String(f)],e:'Jumlah kantong harus faktor dari '+a+' dan '+b+'. Yang paling banyak adalah FPB = '+f+'.',g:[{k:'faktor',n:a,semua:true},{k:'faktor',n:b,semua:true}]};
};
GEN.kpk=function(){
  var P=[[4,6],[3,5],[4,10],[6,8],[6,9],[5,6],[8,12],[10,15],[9,12],[12,15],[15,20],[6,10],[4,14],[5,12]],p=P[rnd(0,P.length-1)],a=p[0],b=p[1],m=lcmG(a,b),mode=rnd(0,2);
  var g={k:'papan',n:Math.min(m+6,66),a:a,b:b,kol:10};
  if(mode===0)return {t:'isi',q:'Tentukan KPK (Kelipatan Persekutuan Terkecil) dari '+a+' dan '+b+'.',a:[String(m)],e:'Kelipatan '+a+' dan '+b+' yang sama, yang terkecil: '+m+'.',g:g};
  var N=[['Lampu A','Lampu B','detik'],['Bus A','Bus B','menit'],['Motor A','Motor B','menit']],n=N[rnd(0,N.length-1)];
  return {t:'isi',q:n[0]+' muncul tiap '+a+' '+n[2]+' dan '+n[1]+' tiap '+b+' '+n[2]+'. Keduanya muncul bersamaan pada '+n[2]+' ke-0. Pada '+n[2]+' ke berapa keduanya bersamaan lagi untuk pertama kali?',a:[String(m)],e:'Cari kelipatan persekutuan terkecil dari '+a+' dan '+b+': '+m+'.',g:g};
};
GEN.fakpri=function(){
  var L=[12,18,20,24,28,30,36,45,50,60,72,42],n=L[rnd(0,L.length-1)],r=priG(n);
  return {t:'isi',q:'Uraikan '+n+' menjadi faktorisasi prima (format a x b x c, dari yang terkecil).',a:[r.join(' x '),r.join(' × ')],e:n+' = '+r.join(' × ')+'. Semua faktornya bilangan prima.',g:{k:'faktor',n:n}};
};
GEN.prima=function(){
  var P=[7,11,13,17,19,23,29,31,37,41,43,47],K=[9,15,21,25,27,33,35,39,45,49,51,14,16,18,22,26],p=P[rnd(0,P.length-1)],o=[p],t=0;
  while(o.length<4&&t<200){var c=K[rnd(0,K.length-1)];t++;if(o.indexOf(c)<0)o.push(c)}
  var s=shuffle(o),i=s.indexOf(p),k=s.filter(function(x){return x!==p})[0],q=priG(k);
  return {t:'pg',q:'Manakah yang merupakan bilangan PRIMA?',o:s.map(String),a:i,e:p+' hanya punya faktor 1 dan '+p+'. Yang lain komposit, misalnya '+k+' = '+q.join(' × ')+'.'};
};
`

export const DATA_AC21: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Bilangan prima memiliki tepat dua faktor, yaitu 1 dan dirinya sendiri.', true, '13 hanya punya faktor 1 dan 13.', faktor(13, { semua: true })),
    bs('Bilangan 1 termasuk bilangan prima.', false, '1 hanya punya satu faktor. Prima harus punya tepat dua faktor.'),
    bs('2 adalah satu-satunya bilangan prima yang genap.', true, 'Bilangan genap lain habis dibagi 2, jadi punya lebih dari dua faktor.'),
    bs('15 adalah bilangan prima karena ganjil.', false, 'Faktor 15: 1, 3, 5, 15. Ganjil belum tentu prima.', faktor(15, { semua: true })),
    bs('Bilangan komposit memiliki lebih dari dua faktor.', true, '12 punya 6 faktor, jadi komposit.', faktor(12, { semua: true })),
    bs('30 = 2 × 3 × 5 adalah faktorisasi prima dari 30.', true, '2, 3, dan 5 semuanya bilangan prima dan hasil kalinya 30.'),
    bs('30 = 2 × 15 sudah faktorisasi prima yang lengkap.', false, '15 bukan prima. Lanjutkan: 15 = 3 × 5.'),
    bs('4 × 9 adalah faktorisasi prima dari 36.', false, '4 dan 9 bukan bilangan prima. Faktorisasi primanya 2 × 2 × 3 × 3.'),
    bs('FPB dari 20 dan 30 adalah 5.', false, 'Faktor sama: 1, 2, 5, 10. Yang TERBESAR 10.', faktor(20, { semua: true })),
    bs('FPB dari 14 dan 21 adalah 7.', true, 'Faktor sama: 1 dan 7. Yang terbesar 7, bukan 1.'),
    bs('FPB dua bilangan SELALU lebih kecil dari atau sama dengan bilangan yang paling kecil.', true, 'FPB adalah faktor dari kedua bilangan, jadi tidak lebih besar daripada yang kecil.'),
    bs('KPK dua bilangan SELALU lebih besar dari atau sama dengan bilangan yang paling besar.', true, 'KPK adalah kelipatan dari kedua bilangan, jadi tidak lebih kecil daripada yang besar.', papan(30, { a: 4, b: 6 })),
    bs('FPB dua bilangan yang berbeda selalu 1.', false, 'FPB(14, 21) = 7. Hanya pasangan saling prima yang FPB-nya 1.'),
    bs('3 dan 5 sama-sama prima, maka KPK-nya 3 × 5 = 15.', true, 'Dua bilangan prima berbeda tidak punya faktor sama, KPK = hasil kali.', papan(20, { a: 3, b: 5 })),
    bs('FPB × KPK dua bilangan selalu sama dengan hasil kali kedua bilangan itu.', true, '12 dan 18: 6 × 36 = 216 = 12 × 18.'),
    bs('3 adalah kelipatan dari 12.', false, '3 adalah FAKTOR dari 12. Kelipatan 12: 12, 24, 36, ...', faktor(12, { semua: true })),
  ],
  debat: [
    debat('Made dan Wati mencari FPB dari 20 dan 30.', ['Made: "FPB-nya 5."', 'Wati: "FPB-nya 10. Faktor sama: 1, 2, 5, 10, terbesar 10."'], 1, '5 memang faktor sama, tetapi bukan yang terbesar.', faktor(20, { semua: true })),
    debat('Kiki dan Rian membahas bilangan 5 dan 25.', ['Kiki: "25 adalah faktor dari 5."', 'Rian: "25 adalah kelipatan dari 5, karena 5 × 5 = 25."'], 1, 'Faktor tidak lebih besar daripada bilangannya.', papan(30, { a: 5 })),
    debat('Ani dan Beno mencari KPK dari 9 dan 12.', ['Ani: "KPK-nya 108, yaitu 9 × 12."', 'Beno: "KPK-nya 36. Kelipatan sama pertama."'], 1, '36 adalah kelipatan 9 dan 12 yang terkecil. 108 juga kelipatan, tetapi bukan yang terkecil.', papan(40, { a: 9, b: 12 })),
    debat('Cici dan Dedi membahas bilangan prima.', ['Cici: "Jika salah satu bilangan prima, FPB-nya pasti 1."', 'Dedi: "Tidak pasti. FPB(3, 9) = 3."'], 1, 'Jika bilangan lain kelipatan prima itu, FPB-nya prima itu sendiri.'),
    debat('Eka dan Fajar membahas 15 dan 45.', ['Eka: "FPB-nya 15 dan KPK-nya 45, karena 45 kelipatan 15."', 'Fajar: "FPB-nya 45."'], 0, 'FPB tidak boleh lebih besar daripada bilangan yang kecil.'),
    debat('Gita dan Hadi membahas bilangan 17.', ['Gita: "17 tidak punya faktorisasi prima."', 'Hadi: "17 sudah prima, jadi faktorisasi primanya 17 sendiri."'], 1, 'Bilangan prima ditulis sebagai dirinya sendiri.'),
  ],
  bank: [
    isi('Uraikan 20 menjadi faktorisasi prima: 20 = 2 x 2 x ___.', '5', '20 = 2 × 2 × 5.', faktor(20)),
    isi('Tentukan FPB dari 8 dan 12.', '4', 'Faktor 8: 1, 2, 4, 8. Faktor 12: 1, 2, 3, 4, 6, 12. Terbesar yang sama: 4.', [faktor(8, { semua: true }), faktor(12, { semua: true })]),
    isi('Tentukan FPB dari 15 dan 25.', '5', 'Faktor sama: 1 dan 5. Terbesar: 5.', [faktor(15, { semua: true }), faktor(25, { semua: true })]),
    isi('Tentukan FPB dari 12 dan 18.', '6', 'Faktor sama: 1, 2, 3, 6. Terbesar: 6.', [faktor(12, { semua: true }), faktor(18, { semua: true })]),
    isi('Tentukan KPK dari 6 dan 8.', '24', 'Kelipatan 6: 6, 12, 18, 24. Kelipatan 8: 8, 16, 24.', papan(30, { a: 6, b: 8 })),
    isi('Tentukan KPK dari 4 dan 6.', '12', 'Kelipatan 4: 4, 8, 12. Kelipatan 6: 6, 12.', papan(24, { a: 4, b: 6 })),
    isi('Sebuah bilangan memiliki faktorisasi prima 2 x 2 x 2 x 3. Berapa bilangan itu?', '24', '2 × 2 × 2 × 3 = 24.', faktor(24)),
    isi('Ada 24 apel dan 36 jeruk dibagi rata ke beberapa keranjang tanpa sisa. Berapa keranjang PALING BANYAK?', '12', 'FPB(24, 36) = 12.', [faktor(24, { semua: true }), faktor(36, { semua: true })]),
    isi('Bus A berangkat tiap 15 menit dan bus B tiap 20 menit, berangkat bersamaan pada menit ke-0. Pada menit ke berapa keduanya bersamaan lagi?', '60', 'KPK(15, 20) = 60.', papan(66, { a: 15, b: 20, kol: 10 })),
    isi('Berapa FPB dari 14 dan 21?', '7', 'Faktor 14: 1, 2, 7, 14. Faktor 21: 1, 3, 7, 21. Terbesar yang sama: 7.', [faktor(14, { semua: true }), faktor(21, { semua: true })]),
    isi('Berapa FPB dari 9 dan 15?', '3', 'Faktor sama: 1 dan 3. Terbesar: 3.', [faktor(9, { semua: true }), faktor(15, { semua: true })]),
    kata('KPK adalah singkatan dari "Kelipatan Persekutuan ___".', ['terkecil'], 'KPK = Kelipatan Persekutuan TERKECIL.'),
    kata('FPB adalah singkatan dari "Faktor Persekutuan ___".', ['terbesar'], 'FPB = Faktor Persekutuan TERBESAR.'),
    pg('Manakah yang merupakan bilangan prima?', ['7', '9', '15', '21'], 0, '7 hanya punya faktor 1 dan 7.'),
    pg('Uraikan 12 menjadi faktorisasi prima. Manakah yang tepat?', ['2 × 2 × 3', '2 × 6', '3 × 4', '2 × 2 × 2 × 3'], 0, '12 = 2 × 2 × 3. Semua faktornya prima.', faktor(12)),
    pg('Rian mencari FPB 24 dan 36 dengan daftar faktor dan menyimpulkan 6. Apa yang salah?', ['Faktor sama termasuk 12, yang lebih besar dari 6, jadi FPB-nya 12', 'Rian benar, FPB-nya 6', 'FPB-nya 4'], 0, 'FPB harus yang TERBESAR dari faktor persekutuan: 12.', [faktor(24, { semua: true }), faktor(36, { semua: true })]),
    pg('Kamu ingin mencari bilangan yang jika dipasangkan dengan 12 menghasilkan FPB 6. Manakah yang memenuhi?', ['18', '12', '9', '24'], 0, 'FPB(12, 18) = 6. FPB(12, 12) = 12, FPB(12, 9) = 3, FPB(12, 24) = 12.'),
    pg('Kamu ingin sepasang bilangan yang KPK-nya 24. Manakah yang memenuhi?', ['8 dan 12', '6 dan 10', '4 dan 5', '9 dan 15'], 0, 'KPK(8, 12) = 24. Yang lain: 30, 20, 45.', papan(30, { a: 8, b: 12 })),
    pg('Manakah pasangan bilangan yang saling prima (FPB = 1)?', ['8 dan 15', '12 dan 18', '6 dan 10', '9 dan 15'], 0, 'FPB(8, 15) = 1. Yang lain FPB-nya 6, 2, dan 3.'),
    pg('Made berkata "FPB(3, 9) = 3, jadi jika salah satu bilangan prima, FPB-nya tidak selalu 1." Apakah tepat?', ['Tepat, karena 9 kelipatan 3', 'Salah, FPB-nya pasti 1', 'Salah, FPB-nya 9'], 0, 'Jika bilangan lain kelipatan prima itu, FPB-nya prima itu sendiri.'),
    pg('Wati: "Jika satu bilangan kelipatan bilangan lain, KPK keduanya sama dengan bilangan yang lebih besar." Apakah selalu benar?', ['Ya, bilangan besar itu sudah kelipatan keduanya', 'Tidak, KPK-nya hasil kali', 'Tidak, KPK-nya jumlah'], 0, 'Contoh: KPK(5, 15) = 15.', papan(30, { a: 5, b: 15 })),
    pg('Kiki: "FPB(15, 15) = 15 dan KPK(15, 15) = 15." Apakah benar?', ['Benar', 'FPB-nya 1', 'KPK-nya 225'], 0, 'Faktor terbesar dan kelipatan terkecil dari 15 adalah 15 sendiri.'),
    pg('Wati: "Makin besar kedua bilangan, makin besar FPB-nya." Apakah selalu benar?', ['Salah. FPB(17, 19) = 1, sedangkan FPB(4, 6) = 2', 'Benar untuk semua pasangan', 'Benar hanya untuk bilangan genap'], 0, 'FPB bergantung pada faktor sama, bukan besar bilangan.'),
    pg('Rian: "KPK HARUS dicari dengan faktorisasi prima, daftar kelipatan tidak boleh." Apakah benar?', ['Tidak, kedua metode benar dan hasilnya sama', 'Benar, hanya faktorisasi prima', 'Benar, hanya daftar kelipatan'], 0, 'Daftar kelipatan dan faktorisasi prima memberi KPK yang sama.'),
    pg('Temanmu mencari FPB dan KPK dari 10 dan 15: FPB 5, KPK 30. Apakah benar?', ['Benar', 'FPB-nya 1', 'KPK-nya 150'], 0, '10 = 2 × 5, 15 = 3 × 5. FPB = 5, KPK = 2 × 3 × 5 = 30.'),
    pg('Made punya 18 permen dan 24 cokelat. Dibagi rata ke kantong tanpa sisa. Berapa kantong paling banyak?', ['6', '3', '18', '24'], 0, 'FPB(18, 24) = 6.', [faktor(18, { semua: true }), faktor(24, { semua: true })]),
    gen('fpb'),
    gen('fpb'),
    gen('fpb'),
    gen('kpk'),
    gen('kpk'),
    gen('kpk'),
    gen('fakpri'),
    gen('fakpri'),
    gen('prima'),
    gen('prima'),
  ],
}
