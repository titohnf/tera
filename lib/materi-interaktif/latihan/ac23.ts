import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { pita } from '../gambar'

/**
 * Bahan latihan AC-23 (Pecahan campuran dan operasi bilangan bulat dengan
 * pecahan).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * istilah (pecahan campuran, bagian bilangan bulat, pecahan biasa, pecahan
 * tidak wajar), bilangan bulat = pecahan berpenyebut 1, campuran ke biasa
 * ((bulat x penyebut) + pembilang, penyebut tetap), biasa ke campuran (bagi,
 * sisa jadi pembilang), bulat x pecahan (hanya pembilang dikali), bulat :
 * pecahan (kali kebalikannya; hasil lebih besar bila pecahan kurang dari 1),
 * tambah dan kurang bulat dengan pecahan (pinjam satu utuh), soal cerita
 * (gelas jus, tali, tepung, kain), sifat (kali komutatif, bagi tidak), dan
 * soal rancang. Salah paham: 2 1/3 ditulis 2/3, 9/4 ditulis 4 1/4, 2 x 3/5 =
 * 6/10, 10 : 1/5 = 2, 6 : 1 1/2 = 6, 5 - 2 3/4 = 3 3/4, 2 + 3/4 = 5/4, dan
 * dibagi pecahan pasti lebih kecil.
 *
 * Jawaban pecahan ditulis "p/d", campuran ditulis "q p/d" (spasi bebas).
 *
 * `GEN.keBiasa` campuran ke biasa, `GEN.keCampur` biasa ke campuran,
 * `GEN.kaliBP` bulat x pecahan, `GEN.bagiBP` bulat : pecahan (atau cerita
 * gelas), `GEN.kurangBP` bulat dikurang campuran.
 */
const JS = String.raw`
function campH(q,w,d){return q>0?(w>0?q+' '+w+'/'+d:String(q)):w+'/'+d}
function gcdH(a,b){return b?gcdH(b,a%b):a}
function utuhH(total,d){
  var rows=[],sisa=total,i=0;
  while(sisa>0){var w=Math.min(d,sisa);rows.push({n:d,w:w,l:sisa>=d?String(i+1):w+'/'+d,warna:sisa>=d?'biru':'hijau'});sisa-=w;i++}
  return rows;
}
GEN.keBiasa=function(){
  var a=rnd(1,5),d=rnd(2,8),b=rnd(1,d-1);
  return {t:'isi',q:'Ubah pecahan campuran '+a+' '+b+'/'+d+' menjadi pecahan biasa.',a:[(a*d+b)+'/'+d],e:'('+a+' x '+d+') + '+b+' = '+(a*d+b)+', penyebut tetap '+d+', jadi '+(a*d+b)+'/'+d+'.',g:{k:'pita',baris:utuhH(a*d+b,d)}};
};
GEN.keCampur=function(){
  var d=rnd(2,8),n=rnd(d+1,6*d),t=0;
  while(n%d===0&&t++<50)n=rnd(d+1,6*d);
  if(n%d===0)n++;
  return {t:'isi',q:'Ubah pecahan biasa '+n+'/'+d+' menjadi pecahan campuran.',a:[campH(Math.floor(n/d),n%d,d)],e:n+' : '+d+' = '+Math.floor(n/d)+' sisa '+(n%d)+', jadi '+campH(Math.floor(n/d),n%d,d)+'.',g:{k:'pita',baris:utuhH(n,d)}};
};
GEN.kaliBP=function(){
  var d,w,k,p,t=0;
  do{d=[3,4,5,6,7,8][rnd(0,5)];w=rnd(1,d-1);k=rnd(2,8);p=k*w;t++}while(!(p%d===0||gcdH(p,d)===1)&&t<200);
  var utuh=p%d===0,ans=utuh?String(p/d):p+'/'+d,urut=rnd(0,1)===0;
  return {t:'isi',q:'Hitunglah '+(urut?k+' x '+w+'/'+d:w+'/'+d+' x '+k)+(utuh?'.':' (nyatakan sebagai pecahan biasa).'),a:[ans],e:k+' x '+w+'/'+d+' = ('+k+' x '+w+')/'+d+' = '+p+'/'+d+(utuh?' = '+p/d:'')+'. Hanya pembilang yang dikali.',g:{k:'pita',baris:utuhH(p,d)}};
};
GEN.bagiBP=function(){
  var d=rnd(2,6),w=rnd(1,Math.min(3,d-1)),k=w*rnd(2,8),h=k/w*d;
  if(rnd(0,1)===0)return {t:'isi',q:'Hitunglah '+k+' : '+w+'/'+d+'.',a:[String(h)],e:k+' : '+w+'/'+d+' = '+k+' x '+d+'/'+w+' = '+h+'.',g:{k:'pita',baris:[{n:d,w:d,l:'1'}]}};
  return {t:'isi',q:'Ada '+k+' liter jus dibagi ke gelas-gelas berisi '+w+'/'+d+' liter. Berapa gelas yang terisi?',a:[String(h)],e:k+' : '+w+'/'+d+' = '+h+' gelas.',g:{k:'pita',baris:[{n:d,w:d,l:'1'}]}};
};
GEN.kurangBP=function(){
  var a=rnd(3,9),m=rnd(0,a-2),d=rnd(2,8),w=rnd(1,d-1),q=a-m-1;
  return {t:'isi',q:'Hitunglah '+a+' - '+(m>0?m+' ':'')+w+'/'+d+' (tulis sebagai pecahan campuran).',a:[campH(q,d-w,d)],e:'Pinjam 1 utuh: '+a+' = '+(a-1)+' '+d+'/'+d+'. Lalu '+(a-1)+' '+d+'/'+d+' - '+(m>0?m+' ':'')+w+'/'+d+' = '+campH(q,d-w,d)+'.',g:{k:'pita',baris:utuhH(a*d,d)}};
};
`

export const DATA_AC23: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Bilangan 2 3/4 disebut pecahan campuran.', true, 'Gabungan bilangan bulat (2) dan pecahan (3/4).', pita([{ n: 4, w: 4, l: '1' }, { n: 4, w: 4, l: '2' }, { n: 4, w: 3, l: '3/4', warna: 'hijau' }])),
    bs('Pada pecahan campuran 3 1/2, angka 3 disebut bagian bilangan bulat.', true, 'Bagian bulat adalah angka di depan pecahan.'),
    bs('Pecahan 7/3 disebut pecahan tidak wajar karena pembilangnya lebih besar dari penyebutnya.', true, '7 > 3, jadi nilainya lebih dari 1.'),
    bs('Pecahan biasa memiliki pembilang yang lebih kecil daripada penyebutnya.', true, '3/4 adalah pecahan biasa.'),
    bs('Setiap bilangan bulat dapat ditulis sebagai pecahan berpenyebut 1.', true, '6 = 6/1.'),
    bs('Saat mengubah campuran menjadi pecahan biasa, penyebutnya tetap.', true, '2 1/3 = 7/3, penyebut tetap 3.', pita([{ n: 3, w: 3, l: '1' }, { n: 3, w: 3, l: '2' }, { n: 3, w: 1, l: '1/3', warna: 'hijau' }])),
    bs('2 1/3 sama dengan 2/3.', false, 'Bagian bulat tidak boleh dibuang. 2 1/3 = 7/3.'),
    bs('9/4 = 4 1/4.', false, '9 : 4 = 2 sisa 1, jadi 9/4 = 2 1/4.', pita([{ n: 4, w: 4, l: '1' }, { n: 4, w: 4, l: '2' }, { n: 4, w: 1, l: '1/4', warna: 'hijau' }])),
    bs('2 × 3/5 = 6/10.', false, 'Hanya pembilang yang dikali: 2 × 3/5 = 6/5.'),
    bs('3 × 2/5 = 6/5.', true, 'Pembilang 3 × 2 = 6, penyebut tetap 5.'),
    bs('6 : 1/2 = 3.', false, 'Dalam 1 utuh ada 2 setengah, jadi 6 : 1/2 = 12.', pita([{ n: 2, w: 2, l: '1' }])),
    bs('10 : 1/5 sama saja dengan 10 : 5.', false, '10 : 1/5 = 10 × 5 = 50.'),
    bs('Membagi bilangan bulat dengan pecahan kurang dari 1 menghasilkan bilangan yang lebih besar.', true, '8 : 1/2 = 16, lebih besar dari 8.'),
    bs('Mengalikan bilangan bulat dengan pecahan kurang dari 1 menghasilkan bilangan yang lebih kecil.', true, '9 × 2/3 = 6, lebih kecil dari 9.'),
    bs('5 - 2 3/4 = 3 3/4.', false, 'Harus meminjam 1 utuh: 4 4/4 - 2 3/4 = 2 1/4.'),
    bs('2 + 3/4 = 5/4.', false, 'Bilangan bulat tidak dijumlahkan ke pembilang. Hasilnya 2 3/4.'),
    bs('Perkalian bilangan bulat dengan pecahan bersifat komutatif: 4 × 2/3 = 2/3 × 4.', true, 'Urutan boleh dibalik.'),
    bs('Pembagian bilangan bulat dengan pecahan bersifat komutatif.', false, '8 : 1/2 = 16, tetapi 1/2 : 8 = 1/16.'),
  ],
  debat: [
    debat('Kiki dan Rian menghitung 2 × 3/5.', ['Kiki: "6/10, kedua bilangan dikali 2."', 'Rian: "6/5, hanya pembilang yang dikali."'], 1, 'Ukuran bagian (penyebut) tidak berubah.'),
    debat('Made dan Wati menghitung 5 - 2 3/4.', ['Made: "3 3/4."', 'Wati: "2 1/4, karena meminjam satu utuh."'], 1, '2 1/4 + 2 3/4 = 5.', pita([{ n: 4, w: 4, l: '1' }, { n: 4, w: 4, l: '2' }, { n: 4, w: 1, l: '1/4', warna: 'hijau' }])),
    debat('Dedi dan Sinta membahas 8 : 1/2.', ['Dedi: "Hasilnya lebih kecil dari 8."', 'Sinta: "Hasilnya 16, lebih besar dari 8."'], 1, 'Ada 2 setengah dalam tiap utuh.', pita([{ n: 2, w: 2, l: '1' }])),
    debat('Sinta dan Budi mengubah 9/4.', ['Sinta: "4 1/4."', 'Budi: "2 1/4, karena 9 : 4 = 2 sisa 1."'], 1, 'Hasil bagi menjadi bagian bulat.'),
    debat('Rian dan Ani menghitung 2 + 3/4.', ['Rian: "5/4, 2 + 3 di atas 4."', 'Ani: "2 3/4."'], 1, 'Bilangan bulat dan pecahan hanya digabung.'),
    debat('Wati dan Made menghitung 6 : 1 1/2.', ['Wati: "6, bagi 6 dengan 1 saja."', 'Made: "4, karena 1 1/2 = 3/2 dan 6 × 2/3 = 4."'], 1, 'Bagian pecahan tidak boleh diabaikan.'),
  ],
  bank: [
    isi('Ubah pecahan campuran 1 1/2 menjadi pecahan biasa.', ['3/2'], '(1 × 2) + 1 = 3, penyebut tetap 2.', pita([{ n: 2, w: 2, l: '1' }, { n: 2, w: 1, l: '1/2', warna: 'hijau' }])),
    isi('Ubah 2 1/3 menjadi pecahan biasa.', ['7/3'], '(2 × 3) + 1 = 7.'),
    isi('Ubah 3 1/4 menjadi pecahan biasa: 3 1/4 = ___/4', '13', '(3 × 4) + 1 = 13.'),
    isi('Ubah pecahan biasa 7/2 menjadi pecahan campuran.', ['3 1/2'], '7 : 2 = 3 sisa 1.'),
    isi('Ubah 17/5 menjadi pecahan campuran.', ['3 2/5'], '17 : 5 = 3 sisa 2.'),
    isi('Ubah 11/4 menjadi pecahan campuran: 11/4 = 2 ___/4', '3', '11 : 4 = 2 sisa 3.'),
    isi('Hitunglah 4 - 1/3 (nyatakan sebagai pecahan biasa).', ['11/3'], '3 3/3 - 1/3 = 3 2/3 = 11/3.'),
    isi('Hitunglah 5 - 2/3 (nyatakan sebagai pecahan biasa).', ['13/3'], '4 3/3 - 2/3 = 4 1/3 = 13/3.'),
    isi('Hitunglah 3 + 1/4 (nyatakan sebagai pecahan campuran).', ['3 1/4'], 'Gabungkan: 3 utuh dan 1/4.'),
    isi('Hitunglah 6 : 1/2.', '12', '6 × 2 = 12.'),
    isi('Hitunglah 8 : 1/4.', '32', '8 × 4 = 32.'),
    isi('Tali 5 meter dipotong 2/5 bagian untuk kerajinan. Berapa meter yang dipakai?', '2', '5 × 2/5 = 10/5 = 2.'),
    isi('Ada 4 liter jus dibagi ke gelas berisi 1/2 liter. Berapa gelas?', '8', '4 : 1/2 = 8.'),
    isi('Kamu punya 10 meter kain, dipotong 1 1/4 meter masing-masing. Berapa potongan paling banyak?', '8', '1 1/4 = 5/4, 10 × 4/5 = 8.'),
    isi('Rancang pecahan campuran berpenyebut 5 yang setara dengan 17/5.', ['3 2/5'], '17 : 5 = 3 sisa 2.'),
    isi('Rancang pecahan campuran yang jika dikurangkan dari 5 menghasilkan 2 1/4.', ['2 3/4'], '5 - 2 1/4 = 2 3/4.'),
    isi('Rancang bilangan bulat yang jika dikalikan 2/5 menghasilkan 6.', '15', '6 : 2/5 = 15.'),
    isi('Rancang bilangan bulat yang jika dibagi 2/3 menghasilkan 15.', '10', '15 × 2/3 = 10.'),
    pg('Hitunglah 3 × 2/5.', ['6/5', '6/15', '5/6', '2/15'], 0, 'Hanya pembilang dikali.'),
    pg('Hitunglah 3 × 1/4.', ['3/4', '4/3', '1/12', '3/12'], 0, '3 × 1 = 3, penyebut tetap 4.'),
    pg('Hitunglah 2/3 × 9.', ['6', '5', '7', '4'], 0, '9 : 3 = 3, 3 × 2 = 6.'),
    pg('Wati punya 3 3/4 kg gula dan memakai 1 1/2 kg. Berapa sisanya?', ['2 1/4 kg', '2 1/2 kg', '2 3/4 kg', '1 1/4 kg'], 0, '3 3/4 - 1 1/2 = 2 1/4.'),
    pg('Kiki punya 3 kg tepung dan memakai 1 3/4 kg. Berapa sisanya?', ['1 1/4 kg', '1 3/4 kg', '2 1/4 kg', '2 3/4 kg'], 0, '2 4/4 - 1 3/4 = 1 1/4.'),
    pg('Rian berkata 4 × 2 1/3 = 9 1/3. Apakah benar?', ['Benar: 4 × 7/3 = 28/3 = 9 1/3', 'Salah, 8 1/3', 'Salah, 9'], 0, 'Ubah dulu 2 1/3 = 7/3.'),
    pg('Manakah yang senilai dengan 3 1/2?', ['7/2', '10/3', '17/5', '9/2'], 0, '3 1/2 = 7/2.'),
    pg('Cara mengubah pecahan campuran menjadi pecahan biasa yang benar adalah...', ['(bulat × penyebut) + pembilang menjadi pembilang baru, penyebut tetap', 'bulat + pembilang, penyebut tetap', 'bulat × pembilang, penyebut tetap'], 0, 'Itu cara yang tepat.'),
    pg('Bilangan bulat yang dikalikan 3/4 menghasilkan 9 adalah...', ['12', '9', '6', '16'], 0, '9 : 3/4 = 12.'),
    pg('Pecahan yang membuat 12 dibagi dengannya menghasilkan 18 adalah...', ['2/3', '3/4', '1/2', '4/3'], 0, '12 : 2/3 = 12 × 3/2 = 18.'),
    pg('Dedi: "Dibagi pecahan lebih dari 1, hasil selalu lebih kecil dari bilangan bulatnya." Apakah benar?', ['Benar, misalnya 6 : 3/2 = 4', 'Salah, selalu lebih besar'], 0, 'Membagi dengan bilangan lebih dari 1 memperkecil.'),
    gen('keBiasa'),
    gen('keBiasa'),
    gen('keCampur'),
    gen('keCampur'),
    gen('kaliBP'),
    gen('kaliBP'),
    gen('bagiBP'),
    gen('bagiBP'),
    gen('kurangBP'),
    gen('kurangBP'),
  ],
}
