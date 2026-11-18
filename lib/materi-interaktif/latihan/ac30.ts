import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { jam, lini } from '../gambar'

/**
 * Bahan latihan AC-30 (Waktu: durasi, waktu mulai, dan waktu selesai).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * 1 jam = 60 menit (90 menit = 1 jam 30 menit), durasi = waktu selesai
 * dikurangi waktu mulai, meminjam 60 menit bila menit selesai lebih kecil,
 * cara lain lewat total menit sejak tengah malam, waktu selesai = mulai +
 * durasi dan waktu mulai = selesai - durasi, melewati tengah malam (23.00
 * sampai 01.00 = 2 jam), kegiatan berurutan dijumlahkan, notasi 12 dan 24
 * jam, memeriksa dengan menjumlahkan kembali, rancang jadwal (sesi, sisa
 * waktu). Salah paham: 7.45 + 30 = 7.75, menghitung "jam 8, 9, 10" sebagai 3
 * jam, mengurangkan menit negatif, menjumlahkan dua pukul, 01 - 23 = -22,
 * menit seperti desimal, 60 menit tidak perlu diubah menjadi 1 jam.
 *
 * Jawaban pukul ditulis seperti 10.45 (titik diabaikan saat mencocokkan);
 * jawaban durasi ditulis "a jam b menit" atau jumlah menit.
 *
 * `GEN.durasi` durasi dari dua pukul (a jam b menit), `GEN.menit` durasi dalam
 * menit, `GEN.selesai` pukul selesai, `GEN.mulai` pukul mulai, `GEN.malam`
 * pukul selesai setelah tengah malam, `GEN.total` total tiga kegiatan, `GEN.sesi`
 * sisa durasi untuk sesi kedua.
 */
const JS = String.raw`
function pdH(m){return m<10?'0'+m:String(m)}
function jmH(t){var T=((t%1440)+1440)%1440,h=Math.floor(T/60),m=T%60;return (h===0?'00':String(h))+'.'+pdH(m)}
function durH(m){var h=Math.floor(m/60),n=m%60;return h===0?n+' menit':(n===0?h+' jam':h+' jam '+n+' menit')}
GEN.durasi=function(){
  var h1=rnd(6,14),m1=rnd(0,11)*5,D=rnd(8,40)*5,b=h1*60+m1+D;
  while(D%60===0)D+=5;b=h1*60+m1+D;
  var a=h1*60+m1;
  return {t:'isi',q:'Sebuah kegiatan berlangsung dari pukul '+jmH(a)+' sampai pukul '+jmH(b)+'. Berapa lama kegiatan tersebut? (tulis dalam bentuk "a jam b menit", atau "b menit" bila kurang dari 1 jam)',a:[durH(D)],e:'Selesai dikurangi mulai: '+jmH(b)+' - '+jmH(a)+' = '+durH(D)+'. Bila menit selesai lebih kecil, pinjam 60 menit.',g:{k:'lini',a:a,b:b,lab:{a:jmH(a),b:jmH(b)}}};
};
GEN.menit=function(){
  var h1=rnd(5,13),m1=rnd(0,11)*5,D=rnd(6,40)*5,a=h1*60+m1,b=a+D;
  return {t:'isi',q:'Sebuah kegiatan berlangsung dari pukul '+jmH(a)+' sampai pukul '+jmH(b)+'. Berapa menit lama kegiatan itu?',a:[String(D)],e:jmH(b)+' - '+jmH(a)+' = '+durH(D)+' = '+D+' menit.',g:{k:'lini',a:a,b:b,lab:{a:jmH(a),b:jmH(b)}}};
};
GEN.selesai=function(){
  var h=rnd(6,15),m=rnd(0,11)*5,D=rnd(4,30)*5,a=h*60+m,b=a+D;
  return {t:'isi',q:'Sebuah kegiatan dimulai pukul '+jmH(a)+' dan berdurasi '+durH(D)+'. Pukul berapa kegiatan tersebut berakhir? (tulis seperti 10.45)',a:[jmH(b)],e:'Waktu selesai = mulai + durasi = '+jmH(a)+' + '+durH(D)+' = '+jmH(b)+'. Bila menit melebihi 59, ubah menjadi jam.',g:{k:'lini',a:a,b:b,lab:{a:jmH(a),b:'?'}}};
};
GEN.mulai=function(){
  var h=rnd(8,17),m=rnd(0,11)*5,D=rnd(4,30)*5,b=h*60+m,a=b-D;
  return {t:'isi',q:'Kamu merancang kegiatan yang harus selesai tepat pukul '+jmH(b)+' dan berdurasi '+durH(D)+'. Pukul berapa kegiatan tersebut harus dimulai? (tulis seperti 8.20)',a:[jmH(a)],e:'Waktu mulai = selesai - durasi = '+jmH(b)+' - '+durH(D)+' = '+jmH(a)+'.',g:{k:'lini',a:a,b:b,lab:{a:'?',b:jmH(b)}}};
};
GEN.malam=function(){
  var h=rnd(22,23),m=rnd(0,11)*5,D=rnd(7,30)*5,a=h*60+m,b=a+D;
  if(b<1440)return GEN.malam();
  return {t:'isi',q:'Sebuah kegiatan dimulai pukul '+jmH(a)+' (malam) dan berdurasi '+durH(D)+', sehingga berakhir keesokan harinya. Pukul berapa kegiatan berakhir dalam notasi 24 jam? (tulis seperti 01.40)',a:[jmH(b),jmH(b).replace(/^0/,'')],e:jmH(a)+' + '+durH(D)+' = '+Math.floor(b/60)+'.'+pdH(b%60)+', dikurangi 24 jam = '+jmH(b)+' keesokan harinya.',g:{k:'lini',a:a,b:b,lab:{a:jmH(a),b:'?'}}};
};
GEN.total=function(){
  var x=rnd(3,12)*5,y=rnd(2,8)*10,z=rnd(3,10)*5;
  return {t:'isi',q:'Tiga kegiatan berlangsung berturut-turut tanpa jeda: '+x+' menit, '+y+' menit, dan '+z+' menit. Berapa total durasi seluruhnya (menit)?',a:[String(x+y+z)],e:x+' + '+y+' + '+z+' = '+(x+y+z)+' menit = '+durH(x+y+z)};
};
GEN.sesi=function(){
  var T=[120,150,180,240][rnd(0,3)],s1=rnd(4,Math.floor(T/5)-4)*5;
  return {t:'isi',q:'Kamu merancang total waktu belajar '+durH(T)+' ('+T+' menit) yang dibagi menjadi dua sesi. Sesi pertama berdurasi '+s1+' menit. Berapa menit durasi sesi kedua agar totalnya tepat '+T+' menit?',a:[String(T-s1)],e:T+' - '+s1+' = '+(T-s1)+' menit.'};
};
`

export const DATA_AC30: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('1 jam sama dengan 60 menit.', true, 'Satu putaran jarum panjang.', jam(480, '8.00')),
    bs('1 jam sama dengan 100 menit.', false, 'Waktu berbasis 60, bukan 100.'),
    bs('90 menit sama dengan 1 jam 30 menit.', true, '90 = 60 + 30.'),
    bs('120 menit sama dengan 2 jam.', true, '120 : 60 = 2.'),
    bs('Durasi suatu kegiatan adalah selisih antara waktu selesai dan waktu mulai.', true, 'Waktu selesai dikurangi waktu mulai.', lini(500, 605, { a: '8.20', b: '10.05' })),
    bs('Durasi dari pukul 8.00 sampai 10.00 adalah 3 jam karena ada jam 8, 9, dan 10.', false, 'Durasi adalah selisih: 10 − 8 = 2 jam.', lini(480, 600, { a: '8.00', b: '10.00' })),
    bs('Pukul 7.45 ditambah 30 menit adalah pukul 7.75.', false, '45 + 30 = 75 menit = 1 jam 15 menit, jadi 8.15. Menit tidak boleh 75.', jam(465, '7.45')),
    bs('Bila menit selesai lebih kecil dari menit mulai, kita meminjam 60 menit (1 jam).', true, '8.20 sampai 10.05: 5 + 60 = 65, 65 − 20 = 45, jam 9 − 8 = 1, jadi 1 jam 45 menit.'),
    bs('Pukul 14.00 dalam notasi 24 jam sama dengan pukul 2 siang.', true, '14 − 12 = 2.'),
    bs('Waktu selesai = waktu mulai + durasi.', true, '9.00 + 1 jam 45 menit = 10.45.'),
    bs('Waktu mulai = waktu selesai − durasi.', true, '10.00 − 1 jam 40 menit = 8.20.'),
    bs('Untuk mencari durasi, waktu mulai dan waktu selesai dijumlahkan.', false, 'Dikurangi: selesai − mulai.'),
    bs('Dari pukul 23.00 sampai 01.00 keesokan harinya durasinya 2 jam.', true, '1 jam sampai 24.00 dan 1 jam lagi.', lini(1380, 1500, { a: '23.00', b: '01.00' })),
    bs('Durasi dari pukul 23.00 sampai 01.00 dapat dihitung langsung 01 − 23 = −22 jam.', false, 'Melewati tengah malam; tambah 24: 25 − 23 = 2 jam.'),
    bs('Cara lain menghitung durasi adalah mengubah kedua pukul menjadi menit sejak tengah malam lalu mengurangkan.', true, '9.30 = 570 dan 12.10 = 730, selisih 160 menit = 2 jam 40 menit.'),
    bs('Total durasi kegiatan berurutan tanpa jeda sama dengan jumlah durasi masing-masing.', true, '45 + 80 + 30 = 155 menit.'),
    bs('Hasil 60 menit pada penjumlahan tidak perlu diubah menjadi 1 jam.', false, '60 menit = 1 jam. Menit tidak boleh mencapai 60 pada penulisan pukul.'),
    bs('Cara mengecek durasi adalah menjumlahkan durasi ke waktu mulai dan membandingkan dengan waktu selesai.', true, '8.20 + 1 jam 45 menit = 10.05.'),
  ],
  debat: [
    debat('Wati dan Rian menghitung pukul 7.45 ditambah 30 menit.', ['Wati: "Pukul 7.75."', 'Rian: "Pukul 8.15, karena 75 menit = 1 jam 15 menit."'], 1, 'Menit berbasis 60.', jam(465, '7.45')),
    debat('Made dan Dedi menghitung durasi pukul 8.00 sampai 10.00.', ['Made: "3 jam, jam 8, 9, dan 10."', 'Dedi: "2 jam, 10 − 8."'], 1, 'Durasi adalah selisih.', lini(480, 600, { a: '8.00', b: '10.00' })),
    debat('Rian dan Sinta menghitung durasi 8.20 sampai 10.05.', ['Rian: "2 jam −15 menit, bingung."', 'Sinta: "Pinjam 60 menit: 1 jam 45 menit."'], 1, '65 − 20 = 45 dan jam 9 − 8 = 1.', lini(500, 605, { a: '8.20', b: '10.05' })),
    debat('Dedi dan Wati menghitung durasi 23.00 sampai 01.00.', ['Dedi: "01 − 23 = −22."', 'Wati: "23.00 ke 24.00 satu jam, 24.00 ke 01.00 satu jam: 2 jam."'], 1, 'Melewati tengah malam.', lini(1380, 1500, { a: '23.00', b: '01.00' })),
    debat('Dedi dan Fajar mencari durasi pukul 5.00 sampai 7.40.', ['Dedi: "5.00 + 7.40 = 12 jam 40 menit."', 'Fajar: "7.40 − 5.00 = 2 jam 40 menit."'], 1, 'Durasi adalah selisih, bukan jumlah.', lini(300, 460, { a: '5.00', b: '7.40' })),
    debat('Gita dan Hadi membahas pukul 5.50 ditambah 25 menit.', ['Gita: "Pukul 5.75."', 'Hadi: "Pukul 6.15."'], 1, '50 + 25 = 75 menit = 1 jam 15 menit.', jam(350, '5.50')),
  ],
  bank: [
    isi('1 jam = ___ menit.', '60', '1 jam = 60 menit.', jam(60, '1.00')),
    isi('120 menit sama dengan berapa jam?', '2', '120 : 60 = 2.'),
    isi('Sebuah kegiatan dari pukul 6.00 sampai pukul 8.15. Berapa menit lamanya?', '135', '2 jam 15 menit = 135 menit.', lini(360, 495, { a: '6.00', b: '8.15' })),
    isi('Sebuah kegiatan dari pukul 10.00 sampai pukul 10.45. Berapa menit lamanya?', '45', '45 menit.', lini(600, 645, { a: '10.00', b: '10.45' })),
    isi('Kegiatan dimulai pukul 8.00 dan berdurasi 1 jam 20 menit. Berakhir pukul berapa (angka menitnya saja)?', '20', 'Berakhir 9.20.'),
    isi('Kegiatan dimulai pukul 8.30 dan berdurasi 45 menit. Berakhir pukul berapa (angka menitnya saja)?', '15', '8.30 + 45 menit = 9.15.'),
    isi('Les dari pukul 7.50 sampai 9.20. Berapa jam dan berapa menit? (tulis a jam b menit)', ['1 jam 30 menit'], '9.20 − 7.50: pinjam 60 menit, 80 − 50 = 30 menit dan 8 − 7 = 1 jam. Jadi 1 jam 30 menit.', lini(470, 560, { a: '7.50', b: '9.20' })),
    isi('Kelas dari pukul 7.40 sampai 9.10. Berapa lamanya? (tulis a jam b menit)', ['1 jam 30 menit'], '1 jam 30 menit.'),
    isi('Rapat dari pukul 6.50 sampai 8.05. Berapa lamanya? (tulis a jam b menit)', ['1 jam 15 menit'], '1 jam 15 menit.'),
    isi('Ani belajar dari pukul 7.00 sampai 9.30. Berapa lamanya? (tulis a jam b menit)', ['2 jam 30 menit'], '2 jam 30 menit.'),
    isi('Kegiatan harus selesai pukul 10.00 dan berdurasi 1 jam 40 menit. Mulai pukul berapa? (tulis seperti 8.20)', ['8.20'], '10.00 − 1 jam 40 menit = 8.20.', lini(500, 600, { a: '?', b: '10.00' })),
    isi('Kegiatan harus selesai pukul 11.00 dan berdurasi 1 jam 25 menit. Mulai pukul berapa (angka menitnya saja)?', '35', 'Mulai 9.35.'),
    isi('Tiga kegiatan berturut-turut mulai pukul 7.00: 50, 40, dan 30 menit. Selesai pukul berapa (angka jamnya saja)?', '9', '120 menit = 2 jam, selesai 9.00.'),
    isi('Kegiatan dimulai 6.45 dan harus selesai tepat 9.00. Berapa menit maksimal durasinya?', '135', '15 + 120 = 135.'),
    isi('Total waktu belajar 3 jam dibagi dua sesi. Sesi pertama 1 jam 45 menit. Berapa menit sesi kedua?', '75', '180 − 105 = 75.'),
    isi('Total latihan 2 jam dibagi dua sesi. Sesi pertama 55 menit. Berapa menit sesi kedua?', '65', '120 − 55 = 65.'),
    isi('Kegiatan dimulai 23.10 dan berdurasi 2 jam 30 menit. Berakhir pukul berapa (angka jamnya saja, notasi 24 jam)?', ['1', '01'], '23.10 + 2.30 = 25.40 = 01.40 keesokan harinya.'),
    isi('Kegiatan ketiga: total 4 jam, kegiatan pertama 1 jam 15 menit, kedua 1 jam 45 menit. Berapa jam kegiatan ketiga?', '1', '4 − 3 = 1 jam.'),
    pg('Sebuah perjalanan bus dari pukul 14.30 sampai 17.00. Berapa lamanya?', ['2 jam 30 menit', '2 jam', '3 jam', '2 jam 40 menit'], 0, '17.00 − 14.30 = 2 jam 30 menit.', lini(870, 1020, { a: '14.30', b: '17.00' })),
    pg('Acara dari pukul 9.20 sampai 11.50. Berapa lamanya?', ['2 jam 30 menit', '2 jam 40 menit', '2 jam', '3 jam 30 menit'], 0, '11.50 − 9.20 = 2 jam 30 menit.'),
    pg('Pertunjukan dari pukul 8.15 sampai 10.45. Berapa lamanya?', ['2 jam 30 menit', '2 jam 45 menit', '3 jam', '2 jam 15 menit'], 0, '2 jam 30 menit.'),
    pg('Film dari pukul 13.00 sampai 15.20. Berapa lamanya?', ['2 jam 20 menit', '2 jam', '2 jam 40 menit', '1 jam 20 menit'], 0, '2 jam 20 menit.'),
    pg('Kereta dari pukul 22.00 sampai 23.30. Berapa lamanya?', ['1 jam 30 menit', '1 jam', '2 jam 30 menit', '1 jam 20 menit'], 0, '1 jam 30 menit.'),
    pg('Kegiatan dimulai pukul 9.00 dan berdurasi 1 jam 45 menit. Berakhir pukul...', ['10.45', '10.15', '9.45', '11.00'], 0, '9.00 + 1.45 = 10.45.'),
    pg('Pukul 14.00 dalam notasi 24 jam sama dengan...', ['pukul 2 siang', 'pukul 4 siang', 'pukul 2 malam', 'pukul 12 siang'], 0, '14 − 12 = 2.'),
    pg('Wati menghitung 6.40 + 30 menit = 6.70. Apa kesalahannya?', ['70 menit melebihi 60; 70 menit = 1 jam 10 menit, jadi 7.10', 'Tidak ada kesalahan', 'Seharusnya 6.10'], 0, 'Menit tidak berbasis 100.', jam(400, '6.40')),
    pg('Rian menghitung durasi 7.45 ke 9.15 dengan 15 − 45 = −30 dan bingung. Cara yang benar...', ['Pinjam 60 menit: 75 − 45 = 30, jam 8 − 7 = 1, jadi 1 jam 30 menit', 'Biarkan −30 menit', 'Jumlahkan kedua pukul'], 0, 'Meminjam 60 menit.', lini(465, 555, { a: '7.45', b: '9.15' })),
    pg('Made menghitung durasi 9.50 ke 10.05 dengan 05 − 50. Cara yang benar...', ['Pinjam 60 menit: 65 − 50 = 15 menit', 'Hasilnya −45 menit', 'Jumlahkan'], 0, '15 menit.', lini(590, 605, { a: '9.50', b: '10.05' })),
    pg('Dedi: "Durasi kegiatan berurutan tidak pernah perlu pengurangan." Benarkah?', ['Salah, mencari durasi satu kegiatan tetap memakai pengurangan', 'Benar'], 0, 'Selesai − mulai.'),
    gen('durasi'),
    gen('durasi'),
    gen('menit'),
    gen('selesai'),
    gen('selesai'),
    gen('mulai'),
    gen('malam'),
    gen('total'),
    gen('sesi'),
  ],
}
