import { bs, debat, gen, isi, kata, pg, type DataMateri } from '../bersama'
import { pita } from '../gambar'

/**
 * Bahan latihan AC-18 (Bandingkan dan urutkan pecahan; pecahan senilai).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * arti pecahan sebagai SATU nilai (w bagian dari n bagian sama besar),
 * pembilang dan penyebut, membandingkan pecahan berpenyebut sama (lihat
 * pembilang) dan berpembilang sama (penyebut lebih kecil berarti lebih besar),
 * menyamakan penyebut untuk penyebut berbeda, mengurutkan, pecahan SENILAI
 * (kalikan pembilang DAN penyebut dengan bilangan yang sama), menyederhanakan
 * (bagi dengan faktor persekutuan), serta salah paham: 1/5 lebih besar dari
 * 1/3 karena 5 > 3, pembilang besar pasti pecahan besar, menambah bilangan
 * yang sama pada pembilang dan penyebut tidak mengubah nilai, mengalikan
 * hanya pembilang, perkalian pembilang dan penyebut terpisah, dan bentuk
 * sederhana selalu berangka lebih kecil.
 *
 * `GEN.senilai` pecahan senilai dengan pita, `GEN.sederhana` menyederhanakan,
 * `GEN.banding` membandingkan dua pecahan berpenyebut berbeda.
 */
const JS = String.raw`
function fpbG(a,b){return b?fpbG(b,a%b):a}
GEN.senilai=function(){
  var w,n,k=rnd(2,5);
  do{n=rnd(2,9);w=rnd(1,n-1)}while(fpbG(w,n)!==1);
  var cari=rnd(0,1)===0;
  var g={k:'pita',baris:[{n:n,w:w,l:w+'/'+n},{n:n*k,w:w*k,tebal:k,l:cari?'?/'+(n*k):w*k+'/?'}],sejajar:true};
  if(cari)return {t:'isi',q:w+'/'+n+' senilai dengan ?/'+(n*k)+'. Berapa pembilangnya?',a:[String(w*k)],e:'Penyebut dikali '+k+' ('+n+' × '+k+' = '+(n*k)+'), jadi pembilang juga dikali '+k+': '+w+' × '+k+' = '+(w*k)+'.',g:g};
  return {t:'isi',q:w+'/'+n+' senilai dengan '+(w*k)+'/?. Berapa penyebutnya?',a:[String(n*k)],e:'Pembilang dikali '+k+' ('+w+' × '+k+' = '+(w*k)+'), jadi penyebut juga dikali '+k+': '+n+' × '+k+' = '+(n*k)+'.',g:g};
};
GEN.sederhana=function(){
  var a,b,k=rnd(2,4);
  do{b=rnd(3,8);a=rnd(1,b-1)}while(fpbG(a,b)!==1);
  return {t:'isi',q:'Sederhanakan pecahan '+(a*k)+'/'+(b*k)+' sampai bentuk paling sederhana.',a:[a+'/'+b],e:'Bagi pembilang dan penyebut dengan '+k+': '+(a*k)+' : '+k+' = '+a+' dan '+(b*k)+' : '+k+' = '+b+'. Hasilnya '+a+'/'+b+'.',g:{k:'pita',baris:[{n:b*k,w:a*k,tebal:k,l:(a*k)+'/'+(b*k)},{n:b,w:a,l:'?'}],sejajar:true}};
};
GEN.banding=function(){
  var n1,n2,w1,w2,p=0;
  do{n1=rnd(2,9);n2=rnd(2,9);w1=rnd(1,n1-1);w2=rnd(1,n2-1);p++}while((n1===n2||w1*n2===w2*n1)&&p<200);
  var idx=w1*n2>w2*n1?0:1,d=n1*n2;
  return {t:'pg',q:'Manakah yang lebih besar, '+w1+'/'+n1+' atau '+w2+'/'+n2+'?',o:[w1+'/'+n1,w2+'/'+n2,'Sama besar'],a:idx,e:'Samakan penyebut menjadi '+d+': '+w1+'/'+n1+' = '+(w1*n2)+'/'+d+' dan '+w2+'/'+n2+' = '+(w2*n1)+'/'+d+'. Yang pembilangnya lebih besar, itu yang lebih besar.',g:{k:'pita',baris:[{n:n1,w:w1,l:w1+'/'+n1},{n:n2,w:w2,l:w2+'/'+n2}],sejajar:true}};
};
`

export const DATA_AC18: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pecahan 3/5 dibaca "tiga perlima" dan menyatakan SATU nilai, bukan dua angka terpisah.', true, '3/5 berarti 3 bagian dari 5 bagian yang sama besar.', pita([{ n: 5, w: 3, l: '3/5' }])),
    bs('Pada pecahan 5/8, angka 5 adalah pembilang.', true, 'Pembilang di atas garis, menunjukkan banyak bagian yang diambil.', pita([{ n: 8, w: 5, l: '5/8' }])),
    bs('Penyebut menunjukkan banyak bagian sama besar yang membentuk satu keseluruhan.', true, 'Pada 5/8, keseluruhannya dibagi menjadi 8 bagian sama besar.', pita([{ n: 8, w: 5, l: '5/8' }])),
    bs('Pada pecahan 3/8 dan 5/8 (penyebut sama), 5/8 lebih besar karena pembilangnya lebih besar.', true, 'Bagian sama besar, 5 bagian lebih banyak dari 3 bagian.', pita([{ n: 8, w: 3, l: '3/8' }, { n: 8, w: 5, l: '5/8' }], { sejajar: true })),
    bs('Jika pembilangnya sama, pecahan dengan penyebut lebih besar adalah pecahan yang lebih besar.', false, '1/3 lebih besar daripada 1/5: bagian makin banyak, tiap bagian makin kecil.', pita([{ n: 3, w: 1, l: '1/3' }, { n: 5, w: 1, l: '1/5' }], { sejajar: true })),
    bs('Pecahan dengan pembilang lebih besar selalu merupakan pecahan yang lebih besar.', false, '3/10 lebih kecil daripada 2/3, walau 3 lebih besar daripada 2.', pita([{ n: 10, w: 3, l: '3/10' }, { n: 3, w: 2, l: '2/3' }], { sejajar: true })),
    bs('1/2 dan 2/4 adalah pecahan senilai.', true, 'Bagian berwarnanya sama panjang.', pita([{ n: 2, w: 1, l: '1/2' }, { n: 4, w: 2, tebal: 2, l: '2/4' }], { sejajar: true })),
    bs('2/3 senilai dengan 4/6, diperoleh dengan mengalikan pembilang dan penyebut dengan 2.', true, 'Kalikan pembilang DAN penyebut dengan bilangan yang sama.', pita([{ n: 3, w: 2, l: '2/3' }, { n: 6, w: 4, tebal: 2, l: '4/6' }], { sejajar: true })),
    bs('Menambah 1 pada pembilang dan penyebut 1/2 menghasilkan 2/3 yang nilainya tetap sama.', false, '2/3 lebih besar daripada 1/2. Yang menjaga nilai adalah mengalikan, bukan menambah.', pita([{ n: 2, w: 1, l: '1/2' }, { n: 3, w: 2, l: '2/3' }], { sejajar: true })),
    bs('Mengalikan hanya pembilang 5/6 dengan 2 menghasilkan pecahan senilai.', false, '10/6 lebih besar dari 1. Pembilang dan penyebut harus sama-sama dikali.'),
    bs('Menyederhanakan pecahan dilakukan dengan membagi pembilang dan penyebut dengan faktor persekutuan.', true, '6/8 dibagi 2 menjadi 3/4.', pita([{ n: 8, w: 6, tebal: 2, l: '6/8' }, { n: 4, w: 3, l: '3/4' }], { sejajar: true })),
    bs('Bentuk paling sederhana dari 6/9 adalah 2/3.', true, '6 : 3 = 2 dan 9 : 3 = 3.', pita([{ n: 9, w: 6, tebal: 3, l: '6/9' }, { n: 3, w: 2, l: '2/3' }], { sejajar: true })),
    bs('Pecahan 4/7 sudah dalam bentuk paling sederhana.', true, '4 dan 7 tidak punya faktor persekutuan selain 1.'),
    bs('Untuk membandingkan pecahan berpenyebut berbeda, samakan dulu penyebutnya.', true, '2/3 = 8/12 dan 3/4 = 9/12, jadi 3/4 lebih besar.', pita([{ n: 3, w: 2, l: '2/3' }, { n: 4, w: 3, l: '3/4' }], { sejajar: true })),
  ],
  debat: [
    debat('Ayu dan Beno membandingkan 1/4 dan 1/6.', ['Ayu: "1/6 lebih besar, karena 6 lebih besar daripada 4."', 'Beno: "1/4 lebih besar. Dibagi 6 bagian, tiap bagian lebih kecil."'], 1, 'Penyebut lebih besar berarti potongan lebih kecil.', pita([{ n: 4, w: 1, l: '1/4' }, { n: 6, w: 1, l: '1/6' }], { sejajar: true })),
    debat('Cici dan Dedi membandingkan 3/4 dan 5/8.', ['Cici: "3/4 lebih kecil karena 3 lebih kecil daripada 5."', 'Dedi: "3/4 = 6/8, jadi lebih besar daripada 5/8."'], 1, 'Penyebut berbeda tidak boleh dibandingkan lewat pembilangnya saja.', pita([{ n: 4, w: 3, l: '3/4' }, { n: 8, w: 5, l: '5/8' }], { sejajar: true })),
    debat('Eka dan Fajar mencari pecahan senilai 1/2.', ['Eka: "2/3 senilai 1/2, karena kedua angkanya ditambah 1."', 'Fajar: "Bukan. 1/2 senilai 2/4, kedua angkanya dikali 2."'], 1, 'Nilai terjaga bila pembilang dan penyebut dikali bilangan yang sama.', pita([{ n: 2, w: 1, l: '1/2' }, { n: 3, w: 2, l: '2/3' }], { sejajar: true })),
    debat('Gita dan Hadi menyederhanakan 4/10.', ['Gita: "2/5, kedua angkanya dibagi 2."', 'Hadi: "2/10, hanya pembilangnya dibagi 2."'], 0, 'Pembilang dan penyebut harus dibagi bilangan yang sama.', pita([{ n: 10, w: 4, tebal: 2, l: '4/10' }, { n: 5, w: 2, l: '2/5' }], { sejajar: true })),
    debat('Ira dan Joni membahas bentuk sederhana.', ['Ira: "Bentuk sederhana selalu berangka lebih kecil daripada bentuk aslinya."', 'Joni: "Tidak selalu. 3/4 sudah sederhana, angkanya tidak berubah."'], 1, 'Pecahan yang sudah sederhana tidak bisa disederhanakan lagi.'),
    debat('Kiki dan Lala membandingkan 20/40 dengan 2/4.', ['Kiki: "20/40 lebih besar, angkanya lebih besar."', 'Lala: "Sama besar. Keduanya senilai 1/2."'], 1, '20/40 dan 2/4 sama-sama bisa disederhanakan menjadi 1/2.', pita([{ n: 4, w: 2, l: '2/4' }, { n: 8, w: 4, tebal: 2, l: '4/8' }], { sejajar: true })),
  ],
  bank: [
    isi('Sebuah kue dibagi menjadi 8 bagian sama besar. Ana memakan 3 bagian. Tuliskan pecahan bagian yang dimakan Ana (contoh bentuk: 1/2).', ['3/8'], '3 bagian dari 8 bagian sama besar: 3/8.', pita([{ n: 8, w: 3, l: '?' }])),
    isi('Sebuah pita dibagi 9 bagian sama panjang. Budi memotong 4 bagian. Tuliskan pecahannya.', ['4/9'], '4 dari 9 bagian: 4/9.', pita([{ n: 9, w: 4, l: '?' }])),
    isi('2/5 senilai dengan ?/20. Berapa pembilangnya?', '8', '5 × 4 = 20, jadi 2 × 4 = 8.', pita([{ n: 5, w: 2, l: '2/5' }, { n: 20, w: 8, tebal: 4, l: '?/20' }], { sejajar: true })),
    isi('3/7 senilai dengan ?/21. Berapa pembilangnya?', '9', '7 × 3 = 21, jadi 3 × 3 = 9.', pita([{ n: 7, w: 3, l: '3/7' }, { n: 21, w: 9, tebal: 3, l: '?/21' }], { sejajar: true })),
    isi('4/9 senilai dengan 12/?. Berapa penyebutnya?', '27', '4 × 3 = 12, jadi 9 × 3 = 27.', pita([{ n: 9, w: 4, l: '4/9' }, { n: 27, w: 12, tebal: 3, l: '12/?' }], { sejajar: true })),
    isi('Sederhanakan 9/12 sampai bentuk paling sederhana.', ['3/4'], 'Bagi 9 dan 12 dengan 3: 3/4.', pita([{ n: 12, w: 9, tebal: 3, l: '9/12' }, { n: 4, w: 3, l: '?' }], { sejajar: true })),
    isi('Sederhanakan 12/20 sampai bentuk paling sederhana.', ['3/5'], 'Bagi 12 dan 20 dengan 4: 3/5.', pita([{ n: 20, w: 12, tebal: 4, l: '12/20' }, { n: 5, w: 3, l: '?' }], { sejajar: true })),
    isi('Sederhanakan 18/27 sampai bentuk paling sederhana.', ['2/3'], 'Bagi 18 dan 27 dengan 9: 2/3.', pita([{ n: 27, w: 18, tebal: 9, l: '18/27' }, { n: 3, w: 2, l: '?' }], { sejajar: true })),
    isi('Kamu merancang pecahan senilai 5/6 dengan pembilang 15. Berapa penyebutnya?', '18', '5 × 3 = 15, jadi 6 × 3 = 18.', pita([{ n: 6, w: 5, l: '5/6' }, { n: 18, w: 15, tebal: 3, l: '15/?' }], { sejajar: true })),
    isi('Tuliskan pecahan paling sederhana yang senilai dengan 24/36.', ['2/3'], 'Bagi 24 dan 36 dengan 12: 2/3.', pita([{ n: 36, w: 24, tebal: 12, l: '24/36' }, { n: 3, w: 2, l: '?' }], { sejajar: true })),
    kata('Apakah 6/8 dan 9/12 senilai? Jawab "ya" atau "tidak".', ['ya'], 'Keduanya sama dengan 3/4.', pita([{ n: 8, w: 6, l: '6/8' }, { n: 12, w: 9, l: '9/12' }], { sejajar: true })),
    pg('Pada pecahan 7/9, angka 7 disebut...', ['pembilang', 'penyebut', 'bilangan bulat', 'sisa'], 0, 'Pembilang ada di atas garis pecahan.', pita([{ n: 9, w: 7, l: '7/9' }])),
    pg('Pada pecahan 7/9, angka 9 disebut...', ['penyebut', 'pembilang', 'bilangan asli', 'koma'], 0, 'Penyebut di bawah garis: banyak bagian sama besar.', pita([{ n: 9, w: 7, l: '7/9' }])),
    pg('Manakah yang lebih besar, 5/12 atau 9/12?', ['9/12', '5/12', 'Sama besar'], 0, 'Penyebut sama, jadi lihat pembilangnya.', pita([{ n: 12, w: 5, l: '5/12' }, { n: 12, w: 9, l: '9/12' }], { sejajar: true })),
    pg('Urutkan dari yang TERKECIL ke TERBESAR: 4/9, 1/9, 7/9.', ['1/9, 4/9, 7/9', '7/9, 4/9, 1/9', '4/9, 1/9, 7/9', '1/9, 7/9, 4/9'], 0, 'Penyebut sama, urutkan pembilangnya: 1, 4, 7.', pita([{ n: 9, w: 4, l: '4/9' }, { n: 9, w: 1, l: '1/9' }, { n: 9, w: 7, l: '7/9' }])),
    pg('Manakah pecahan yang senilai dengan 1/4?', ['3/12', '2/6', '1/5', '2/9'], 0, '1 × 3 = 3 dan 4 × 3 = 12.', pita([{ n: 4, w: 1, l: '1/4' }, { n: 12, w: 3, tebal: 3, l: '3/12' }], { sejajar: true })),
    pg('Made punya 3/4 loyang kue dan Wati punya 5/8 loyang kue (ukuran sama). Siapa yang punya lebih banyak?', ['Made', 'Wati', 'Sama banyak'], 0, '3/4 = 6/8, dan 6/8 lebih besar daripada 5/8.', pita([{ n: 4, w: 3, l: 'Made' }, { n: 8, w: 5, l: 'Wati' }], { sejajar: true })),
    pg('Manakah yang lebih besar, 3/7 atau 3/5?', ['3/5', '3/7', 'Sama besar'], 0, 'Pembilang sama, penyebut lebih kecil berarti potongan lebih besar.', pita([{ n: 7, w: 3, l: '3/7' }, { n: 5, w: 3, l: '3/5' }], { sejajar: true })),
    pg('Wati punya 3/5 botol sirup dan ibu punya 7/10 botol (ukuran sama). Siapa yang punya lebih banyak?', ['Ibu', 'Wati', 'Sama banyak'], 0, '3/5 = 6/10, dan 7/10 lebih besar.', pita([{ n: 5, w: 3, l: 'Wati' }, { n: 10, w: 7, l: 'Ibu' }], { sejajar: true })),
    pg('Rani mengubah 1/2 menjadi 3/4 dengan menambah 2 pada pembilang dan penyebut. Apa yang salah?', ['Menambah tidak menjaga nilai. Harus dikali dengan bilangan yang sama', 'Tidak ada yang salah', 'Seharusnya ditambah 3', 'Seharusnya hanya penyebut yang diubah'], 0, '1/2 senilai 2/4, bukan 3/4.', pita([{ n: 2, w: 1, l: '1/2' }, { n: 4, w: 3, l: '3/4' }], { sejajar: true })),
    pg('Sinta membandingkan 2/5 dan 3/7 dengan alasan "2 < 3 dan 5 < 7, jadi 2/5 lebih besar". Apa kesalahan Sinta?', ['Ia membandingkan pembilang dan penyebut secara terpisah. Samakan penyebut: 14/35 lawan 15/35', 'Tidak ada kesalahan', 'Seharusnya penyebut dikurangi', 'Seharusnya pembilang dijumlahkan'], 0, '2/5 = 14/35 dan 3/7 = 15/35, jadi 3/7 lebih besar.', pita([{ n: 5, w: 2, l: '2/5' }, { n: 7, w: 3, l: '3/7' }], { sejajar: true })),
    pg('Cara tepat memeriksa apakah 3/4 dan 9/12 senilai adalah...', ['mengalikan pembilang DAN penyebut 3/4 dengan 3, lalu melihat hasilnya 9/12', 'menjumlahkan 3 + 4 dan 9 + 12', 'melihat apakah penyebutnya sama', 'melihat apakah pembilangnya lebih besar'], 0, '3 × 3 = 9 dan 4 × 3 = 12.', pita([{ n: 4, w: 3, l: '3/4' }, { n: 12, w: 9, tebal: 3, l: '9/12' }], { sejajar: true })),
    pg('Urutkan dari yang TERKECIL ke TERBESAR: 2/3, 3/5, 5/6.', ['3/5, 2/3, 5/6', '2/3, 3/5, 5/6', '5/6, 2/3, 3/5', '3/5, 5/6, 2/3'], 0, 'Penyebut 30: 2/3 = 20/30, 3/5 = 18/30, 5/6 = 25/30.', pita([{ n: 3, w: 2, l: '2/3' }, { n: 5, w: 3, l: '3/5' }, { n: 6, w: 5, l: '5/6' }], { sejajar: false })),
    pg('Manakah pecahan yang sudah paling sederhana?', ['3/5', '4/6', '6/9', '10/15'], 0, '3 dan 5 tidak punya faktor persekutuan selain 1. Yang lain masih bisa disederhanakan menjadi 2/3.'),
    gen('senilai'),
    gen('senilai'),
    gen('senilai'),
    gen('sederhana'),
    gen('sederhana'),
    gen('sederhana'),
    gen('banding'),
    gen('banding'),
    gen('banding'),
  ],
}
