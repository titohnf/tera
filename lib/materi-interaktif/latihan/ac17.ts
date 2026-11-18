import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { faktor, papan } from '../gambar'

/**
 * Bahan latihan AC-17 (Kelipatan dan faktor).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * kelipatan = hasil kali dengan bilangan asli (kelipatan ke-n, empat kelipatan
 * pertama), faktor = bilangan yang membagi habis, faktor dan kelipatan BUKAN
 * hal yang sama (faktor terbatas dan berpasangan, kelipatan tak terbatas),
 * 1 dan bilangan itu sendiri selalu faktor, pembagian rata tanpa sisa (jumlah
 * kelompok yang mungkin), kelipatan persekutuan dan yang terkecil (lonceng,
 * lampu, bus), faktor persekutuan, banyak faktor (prima tepat 2, 15 punya 4,
 * 49 punya 3), serta salah paham: bilangan besar pasti banyak faktor, hasil
 * kali dua bilangan selalu kelipatan bersama TERKECIL, 1 bilangan prima, dan
 * bilangan ganjil punya faktor genap.
 *
 * `GEN.kelipatan` kelipatan ke-k, `GEN.faktor` banyak faktor, `GEN.kpk`
 * kelipatan bersama terkecil dari cerita dua benda berulang.
 */
const JS = String.raw`
GEN.kelipatan=function(){
  var n=rnd(3,9),k=rnd(3,Math.min(9,Math.floor(60/n)));
  return {t:'isi',q:'Berapa kelipatan ke-'+k+' dari '+n+'?',a:[String(n*k)],e:'Kelipatan ke-'+k+' dari '+n+' adalah '+n+' × '+k+' = '+(n*k)+'.',g:{k:'papan',n:60,a:n,sorot:[n*k]}};
};
GEN.faktor=function(){
  var L=[12,16,18,20,24,28,30,36,40,45,48],n=L[rnd(0,L.length-1)],c=0,i;
  for(i=1;i<=n;i++)if(n%i===0)c++;
  return {t:'isi',q:'Berapa banyak faktor dari '+n+'?',a:[String(c)],e:'Faktor '+n+' berpasangan: setiap pembagi tanpa sisa dihitung. Totalnya '+c+'.',g:{k:'faktor',n:n}};
};
GEN.kpk=function(){
  var P=[[3,4],[4,6],[6,9],[4,10],[5,6],[6,8],[3,10],[8,12]],p=P[rnd(0,P.length-1)],a=p[0],b=p[1],m=a;
  while(m%b!==0)m+=a;
  var N=['Lampu merah','Lonceng A','Bus kota'],M=['lampu biru','lonceng B','bus desa'],j=rnd(0,2);
  return {t:'isi',q:N[j]+' berbunyi atau berangkat setiap '+a+' menit dan '+M[j]+' setiap '+b+' menit. Keduanya bersamaan pada menit ke-0. Pada menit ke berapa keduanya bersamaan lagi untuk pertama kali?',a:[String(m)],e:'Cari kelipatan '+a+' dan kelipatan '+b+' yang sama, yang terkecil: '+m+'.',g:{k:'papan',n:m+6,a:a,b:b,kol:10}};
};
`

export const DATA_AC17: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Kelipatan 5 adalah hasil kali 5 dengan bilangan asli: 5, 10, 15, 20, ...', true, 'Kelipatan = bilangan itu dikali 1, 2, 3, dan seterusnya.', papan(30, { a: 5 })),
    bs('7 adalah faktor dari 45.', false, '45 : 7 bersisa, jadi 7 tidak membagi habis 45.'),
    bs('6 adalah faktor dari 42.', true, '42 : 6 = 7 tanpa sisa.'),
    bs('Faktor dari 18 adalah 1, 2, 3, 6, 9, dan 18.', true, 'Faktor berpasangan: 1 × 18, 2 × 9, 3 × 6.', faktor(18)),
    bs('Kelipatan suatu bilangan banyaknya tidak terbatas.', true, 'Kita bisa mengalikan dengan 1, 2, 3, ... tanpa henti.', papan(40, { a: 6 })),
    bs('Faktor suatu bilangan banyaknya terbatas.', true, 'Faktor tidak mungkin lebih besar daripada bilangan itu.', faktor(12, { semua: true })),
    bs('Faktor dari 10 dan kelipatan dari 10 adalah hal yang sama.', false, 'Faktor 10: 1, 2, 5, 10 (membagi 10). Kelipatan 10: 10, 20, 30, ... (hasil kali 10).', faktor(10, { semua: true })),
    bs('Angka 1 adalah faktor dari setiap bilangan asli.', true, 'Setiap bilangan habis dibagi 1.'),
    bs('Setiap bilangan adalah faktor dari dirinya sendiri.', true, 'N : N = 1, tanpa sisa.'),
    bs('12 dan 24 sama-sama kelipatan dari 4 dan kelipatan dari 6.', true, '12 = 4 × 3 = 6 × 2, dan 24 = 4 × 6 = 6 × 4.', papan(30, { a: 4, b: 6 })),
    bs('Hasil kali dua bilangan selalu menjadi kelipatan bersama yang TERKECIL.', false, '6 × 9 = 54 memang kelipatan bersama, tetapi yang terkecil adalah 18.', papan(60, { a: 6, b: 9 })),
    bs('Bilangan prima memiliki tepat dua faktor, yaitu 1 dan dirinya sendiri.', true, '13 hanya punya faktor 1 dan 13.', faktor(13, { semua: true })),
    bs('Bilangan yang lebih besar selalu punya lebih banyak faktor daripada bilangan yang lebih kecil.', false, '17 hanya punya 2 faktor, sedangkan 12 punya 6.', faktor(12, { semua: true })),
    bs('Kelipatan 6 pasti juga kelipatan 2 dan kelipatan 3.', true, '6 = 2 × 3, jadi kelipatan 6 otomatis kelipatan 2 dan 3.', papan(36, { a: 6 })),
  ],
  debat: [
    debat('Ana dan Beno membahas bilangan 6 dan 24.', ['Ana: "24 adalah faktor dari 6."', 'Beno: "24 adalah kelipatan dari 6, karena 6 × 4 = 24."'], 1, 'Faktor tidak pernah lebih besar daripada bilangannya. 24 hasil kali 6 dengan 4.', papan(30, { a: 6, sorot: [24] })),
    debat('Cici dan Dedi membahas faktor dan kelipatan 20.', ['Cici: "Faktor dari 20 dan kelipatan dari 20 sama saja."', 'Dedi: "Beda. Faktor membagi 20, kelipatan adalah hasil kali 20."'], 1, 'Faktor 20: 1, 2, 4, 5, 10, 20. Kelipatan 20: 20, 40, 60, ...', faktor(20, { semua: true })),
    debat('Eka dan Fajar membahas bilangan 1.', ['Eka: "1 bilangan prima, faktornya hanya 1."', 'Fajar: "Bukan. Prima harus punya tepat dua faktor."'], 1, '1 hanya punya satu faktor, jadi bukan prima.'),
    debat('Gita dan Hadi mencari kelipatan bersama terkecil dari 4 dan 10.', ['Gita: "40, hasil kali 4 × 10."', 'Hadi: "20, karena 20 kelipatan 4 dan 10."'], 1, '20 juga kelipatan 4 dan 10, dan lebih kecil dari 40.', papan(40, { a: 4, b: 10 })),
    debat('Ira dan Joni membahas bilangan ganjil.', ['Ira: "Bilangan ganjil tidak pernah punya faktor genap."', 'Joni: "Bisa. 15 punya faktor 2."'], 0, 'Faktor 15 hanya 1, 3, 5, 15. Bilangan genap hanya membagi bilangan genap.', faktor(15, { semua: true })),
    debat('Kiki dan Lala menjumlahkan dua kelipatan 5, misalnya 20 + 35.', ['Kiki: "Hasilnya selalu kelipatan 5."', 'Lala: "Belum tentu."'], 0, '20 + 35 = 55 = 5 × 11. Jumlah dua kelipatan 5 selalu kelipatan 5.', papan(60, { a: 5, sorot: [55] })),
  ],
  bank: [
    isi('Tuliskan 4 kelipatan pertama dari 5, dipisahkan koma.', ['5,10,15,20'], '5 × 1, 5 × 2, 5 × 3, 5 × 4.', papan(30, { a: 5 })),
    isi('Berapa kelipatan ke-6 dari 7?', '42', '7 × 6 = 42.', papan(60, { a: 7, sorot: [42] })),
    isi('Tuliskan semua faktor dari 14, dari yang terkecil, dipisahkan koma.', ['1,2,7,14'], '14 = 1 × 14 = 2 × 7.', faktor(14)),
    isi('Semua faktor dari 32 adalah 1, 2, 4, ___, 16, dan 32.', '8', '32 = 4 × 8, jadi 8 faktor yang hilang.', faktor(32)),
    isi('Berapa banyak faktor dari 36?', '9', '1, 2, 3, 4, 6, 9, 12, 18, 36: ada 9.', faktor(36)),
    isi('Berapa banyak faktor dari 49?', '3', '49 = 1 × 49 = 7 × 7. Faktornya 1, 7, 49.', faktor(49)),
    isi('Bilangan terkecil (lebih dari 0) yang kelipatan 6 sekaligus kelipatan 4 adalah...', '12', 'Kelipatan 6: 6, 12, ... Kelipatan 4: 4, 8, 12. Yang sama pertama: 12.', papan(24, { a: 6, b: 4 })),
    isi('Bilangan terkecil (lebih dari 0) yang kelipatan 8 sekaligus kelipatan 12 adalah...', '24', 'Kelipatan 8: 8, 16, 24. Kelipatan 12: 12, 24.', papan(36, { a: 8, b: 12 })),
    isi('Dua lampu berkedip bersama sekarang. Lampu A tiap 6 detik, lampu B tiap 10 detik. Setelah berapa detik keduanya berkedip bersama lagi?', '30', 'Kelipatan 6: 6, 12, 18, 24, 30. Kelipatan 10: 10, 20, 30. Yang sama pertama: 30.', papan(36, { a: 6, b: 10 })),
    isi('Sebuah bus berangkat setiap 12 menit mulai pukul 06.00. Pada menit ke berapa setelah pukul 06.00 bus berangkat untuk ke-5 kalinya?', '60', 'Kelipatan ke-5 dari 12: 12 × 5 = 60 menit.', papan(60, { a: 12, kol: 10 })),
    isi('Tuliskan faktor persekutuan dari 16 dan 24 selain 1, dari yang terkecil, dipisahkan koma.', ['2,4,8'], 'Faktor 16: 1, 2, 4, 8, 16. Faktor 24: 1, 2, 3, 4, 6, 8, 12, 24. Yang sama: 1, 2, 4, 8.'),
    isi('Berapa banyak cara berbeda membagi 24 kue rata ke dalam kotak tanpa sisa (jumlah kotaknya berbeda-beda)?', '8', 'Jumlah kotak harus faktor 24: 1, 2, 3, 4, 6, 8, 12, 24. Ada 8.', faktor(24)),
    isi('Bilangan terkecil yang punya tepat 2 faktor adalah...', '2', 'Faktor 2 hanya 1 dan 2. Bilangan 1 hanya punya satu faktor.'),
    isi('Sebutkan satu bilangan prima antara 30 dan 40.', ['31', '37'], '31 dan 37 hanya punya faktor 1 dan dirinya sendiri.'),
    pg('Manakah yang merupakan faktor dari 30?', ['5', '7', '8', '9'], 0, '30 : 5 = 6 tanpa sisa.', faktor(30)),
    pg('Manakah yang merupakan kelipatan 8?', ['56', '58', '46', '34'], 0, '8 × 7 = 56.', papan(60, { a: 8 })),
    pg('Made berkata "45 adalah kelipatan 9". Alasan yang tepat adalah...', ['45 = 9 × 5, hasil kali 9 dengan bilangan asli', '45 habis membagi 9', '9 lebih besar daripada 45', '45 dan 9 sama-sama ganjil'], 0, 'Kelipatan 9 adalah hasil kali 9 dengan bilangan asli.', papan(50, { a: 9, sorot: [45] })),
    pg('Sebanyak 28 pensil dibagi rata tanpa sisa kepada beberapa siswa. Jumlah siswa mana yang TIDAK mungkin?', ['6', '4', '7', '14'], 0, '28 : 6 bersisa. Faktor 28: 1, 2, 4, 7, 14, 28.', faktor(28)),
    pg('Manakah bilangan yang punya tepat 4 faktor?', ['14', '16', '11', '25'], 0, '14: 1, 2, 7, 14. Bilangan 16 punya 5, 11 punya 2, 25 punya 3.', faktor(14, { semua: true })),
    pg('Bilangan terkecil yang kelipatan 9 sekaligus kelipatan 12 adalah...', ['36', '108', '18', '72'], 0, 'Kelipatan 9: 9, 18, 27, 36. Kelipatan 12: 12, 24, 36.', papan(40, { a: 9, b: 12 })),
    pg('Made berkata "Kelipatan 8 pasti kelipatan 2 dan kelipatan 4". Apakah tepat?', ['Tepat, karena 8 = 2 × 4', 'Salah, kelipatan 8 tidak berhubungan dengan 2', 'Salah, hanya kelipatan 2', 'Salah, hanya kelipatan 4'], 0, 'Karena 8 kelipatan 2 dan 4, semua kelipatan 8 juga kelipatan 2 dan 4.', papan(40, { a: 8 })),
    pg('Bayu menjumlahkan 20 dan 35, sama-sama kelipatan 5. Apakah hasilnya kelipatan 5?', ['Ya, 55 = 5 × 11', 'Tidak, 55 ganjil', 'Tidak, hasil harus lebih kecil'], 0, 'Jumlah dua kelipatan 5 selalu kelipatan 5.', papan(60, { a: 5, sorot: [20, 35, 55] })),
    pg('Dua bilangan genap yang berbeda, apakah pasti punya faktor persekutuan selain 1?', ['Ya, 2 adalah faktor kedua bilangan', 'Tidak pernah', 'Hanya jika keduanya kembar'], 0, 'Semua bilangan genap habis dibagi 2.'),
    gen('kelipatan'),
    gen('kelipatan'),
    gen('kelipatan'),
    gen('faktor'),
    gen('faktor'),
    gen('kpk'),
    gen('kpk'),
  ],
}
