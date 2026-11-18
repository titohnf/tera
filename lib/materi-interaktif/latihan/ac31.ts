import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { diagram } from '../gambar'

/**
 * Bahan latihan AC-31 (Penyajian dan ukuran data: diagram batang, skala,
 * rata-rata, median, modus, jangkauan, pencilan).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * sumbu diagram (mendatar = kategori, tegak = nilai), membaca diagram
 * (terbanyak, tersedikit, total, selisih), rata-rata (jumlah : banyak data),
 * median (urutkan dulu; genap = rata-rata dua nilai tengah), modus, jangkauan,
 * skala sumbu (mulai dari 0, interval konsisten, sesuai rentang data), pencilan
 * (mengubah rata-rata banyak, median sedikit, modus tidak terpengaruh besar
 * nilai), memilih ukuran, memeriksa, rancang (nilai ke-n untuk rata-rata,
 * nilai tengah, modus, jangkauan, skala). Salah paham: dibagi n + 1, median
 * tanpa mengurutkan, sumbu mulai bukan 0, interval tidak konsisten, interval
 * terlalu besar, rata-rata sama berarti sebaran sama, rata-rata pasti salah satu
 * nilai data, median selalu lebih baik, menambah pencilan pasti mengubah median.
 *
 * Jawaban desimal ditulis dengan koma.
 *
 * `GEN.rata`, `GEN.median`, `GEN.modus`, `GEN.jangkauan` (dari daftar nilai),
 * `GEN.baca` (membaca diagram batang), `GEN.rancangRata` (nilai yang hilang
 * untuk rata-rata tertentu), `GEN.rancangMax` (nilai terbesar dari jangkauan).
 */
const JS = String.raw`
function jmlH(a){var s=0;a.forEach(function(x){s+=x});return s}
function skH(mx){var st=mx<=10?2:(mx<=20?5:(mx<=50?10:(mx<=100?20:50)));return {st:st,hi:Math.ceil((mx+1)/st)*st}}
function dgH(nama,nil){var sk=skH(Math.max.apply(null,nil));return {k:'diagram',d:nil.map(function(v,i){return {l:nama?nama[i]:'S'+(i+1),v:v}}),lo:0,hi:sk.hi,langkah:sk.st,nilai:true,anim:false}}
GEN.rata=function(){
  var n=rnd(4,6),a,t=0;
  do{a=[];for(var i=0;i<n;i++)a.push(rnd(10,19)*5);t++}while(jmlH(a)%n!==0&&t<400);
  if(jmlH(a)%n!==0)return GEN.rata();
  return {t:'isi',q:'Nilai ulangan '+n+' siswa: '+a.join(', ')+'. Berapa rata-rata nilai tersebut?',a:[String(jmlH(a)/n)],e:'Jumlah '+jmlH(a)+' dibagi banyak data '+n+' = '+(jmlH(a)/n)+'.',g:dgH(null,a)};
};
GEN.median=function(){
  var n=[5,7][rnd(0,1)],a=[];
  for(var i=0;i<n;i++)a.push(rnd(4,19)*5);
  var u=a.slice().sort(function(p,q){return p-q});
  return {t:'isi',q:'Data nilai: '+a.join(', ')+'. Berapa median data tersebut?',a:[String(u[(n-1)/2])],e:'Urutkan: '+u.join(', ')+'. Nilai tengahnya '+u[(n-1)/2]+'.',g:dgH(null,a)};
};
GEN.modus=function(){
  var n=rnd(5,7),a=[],m=rnd(4,19)*5,t=0;
  a.push(m);a.push(m);
  while(a.length<n){var x=rnd(4,19)*5;if(x!==m&&a.indexOf(x)<0)a.push(x);if(++t>300)return GEN.modus()}
  a.sort(function(){return Math.random()-.5});
  return {t:'isi',q:'Data nilai: '+a.join(', ')+'. Berapa modus data tersebut?',a:[String(m)],e:m+' muncul dua kali, paling sering.',g:dgH(null,a)};
};
GEN.jangkauan=function(){
  var n=rnd(4,6),a=[];
  for(var i=0;i<n;i++)a.push(rnd(4,19)*5);
  var mx=Math.max.apply(null,a),mn=Math.min.apply(null,a);
  if(mx===mn)return GEN.jangkauan();
  return {t:'isi',q:'Data nilai: '+a.join(', ')+'. Berapa jangkauan (range) data tersebut?',a:[String(mx-mn)],e:'Jangkauan = '+mx+' - '+mn+' = '+(mx-mn)+'.',g:dgH(null,a)};
};
GEN.baca=function(){
  var N=['Ali','Budi','Citra','Doni'],v=[rnd(3,12),rnd(3,12),rnd(3,12),rnd(3,12)],j=rnd(0,2);
  if(j===0)return {t:'isi',q:'Diagram batang menampilkan jumlah buku yang dibaca 4 siswa: Ali '+v[0]+', Budi '+v[1]+', Citra '+v[2]+', Doni '+v[3]+'. Berapa total buku yang dibaca keempat siswa?',a:[String(jmlH(v))],e:v.join(' + ')+' = '+jmlH(v)+'.',g:dgH(N,v)};
  if(j===1)return {t:'isi',q:'Diagram batang menampilkan jumlah kelereng 4 anak: Ali '+v[0]+', Budi '+v[1]+', Citra '+v[2]+', Doni '+v[3]+'. Berapa selisih kelereng terbanyak dan tersedikit?',a:[String(Math.max.apply(null,v)-Math.min.apply(null,v))],e:'Terbanyak dikurangi tersedikit.',g:dgH(N,v)};
  return {t:'isi',q:'Diagram batang menampilkan hasil panen 4 hari (kg): '+v.join(', ')+'. Berapa panen terbanyak (kg)?',a:[String(Math.max.apply(null,v))],e:'Batang tertinggi: '+Math.max.apply(null,v)+'.',g:dgH(['H1','H2','H3','H4'],v)};
};
GEN.rancangRata=function(){
  var n=rnd(4,6),m=rnd(14,18)*5,a=[],i;
  for(i=0;i<n-1;i++)a.push(rnd(12,19)*5);
  var x=m*n-jmlH(a);
  if(x<30||x>110)return GEN.rancangRata();
  return {t:'isi',q:'Kamu merancang '+n+' nilai ulangan dengan rata-rata tepat '+m+'. Jika '+(n-1)+' nilai pertama adalah '+a.join(', ')+', berapa nilai terakhir yang dibutuhkan?',a:[String(x)],e:'Jumlah = '+n+' x '+m+' = '+(n*m)+'. Nilai terakhir = '+(n*m)+' - '+jmlH(a)+' = '+x+'.'};
};
GEN.rancangMax=function(){
  var mn=rnd(3,10)*5,j=rnd(3,10)*5;
  return {t:'isi',q:'Kamu merancang sekumpulan nilai dengan jangkauan tepat '+j+'. Jika nilai terkecil '+mn+', berapa nilai terbesar yang harus kamu rancang?',a:[String(mn+j)],e:'Terbesar = terkecil + jangkauan = '+mn+' + '+j+' = '+(mn+j)+'.'};
};
`

export const DATA_AC31: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pada diagram batang, sumbu mendatar biasanya menampilkan kategori.', true, 'Misalnya nama anak.', diagram([{ l: 'Ali', v: 6 }, { l: 'Budi', v: 9 }, { l: 'Citra', v: 4 }, { l: 'Doni', v: 7 }], { lo: 0, hi: 10, langkah: 2, nilai: true, anim: false })),
    bs('Pada diagram batang, sumbu tegak biasanya menampilkan nilai atau frekuensi.', true, 'Tinggi batang dibaca pada sumbu tegak.'),
    bs('Rata-rata = jumlah semua data dibagi banyaknya data.', true, '60 + 70 + 70 + 80 + 90 = 370, 370 : 5 = 74.'),
    bs('Rata-rata 60, 70, dan 80 dicari dengan 210 : 4 = 52,5.', false, 'Ada 3 data, jadi 210 : 3 = 70.'),
    bs('Median dicari dengan mengurutkan data lebih dulu, lalu mengambil nilai tengah.', true, '60, 70, 70, 80, 90: median 70.'),
    bs('Median boleh diambil dari nilai di tengah urutan penulisan tanpa mengurutkan.', false, 'Urutkan dulu, baru ambil nilai tengah.'),
    bs('Pada data genap, median adalah rata-rata dua nilai tengah.', true, '2, 4, 6, 9: (4 + 6) : 2 = 5.'),
    bs('Modus adalah nilai yang paling sering muncul.', true, '70 muncul dua kali pada 60, 70, 70, 80, 90.'),
    bs('Jangkauan = nilai terbesar dikurangi nilai terkecil.', true, '90 − 60 = 30.'),
    bs('Modus, rata-rata, dan median bisa memberi nilai yang berbeda untuk data yang sama.', true, 'Data 60, 70, 70, 80, 90: rata-rata 74, median 70, modus 70.'),
    bs('Sumbu tegak diagram batang sebaiknya dimulai dari 0.', true, 'Agar tinggi batang sebanding dengan nilai.'),
    bs('Sumbu yang dimulai dari 50 untuk data 55–70 membuat perbedaan tampak lebih kecil dari sebenarnya.', false, 'Perbedaan justru tampak lebih besar.'),
    bs('Skala 0, 10, 30, 100 dengan jarak garis sama adalah skala yang baik.', false, 'Interval harus konsisten.'),
    bs('Skala per 100 untuk data 5 sampai 25 membuat batang sulit dibaca.', true, 'Skala harus sesuai rentang data.'),
    bs('Skala sumbu mengubah nilai data sebenarnya.', false, 'Hanya kesan visualnya yang berubah.'),
    bs('Satu pencilan (outlier) mengubah rata-rata cukup banyak.', true, '75, 78, 80, 82, 200: rata-rata 103.'),
    bs('Menambah pencilan pasti mengubah median sebanyak rata-rata.', false, 'Median hanya bergeser sedikit.'),
    bs('Rata-rata selalu salah satu nilai dalam data.', false, 'Rata-rata 78 dari 70, 85, 70, 90, 75 bukan nilai data.'),
    bs('Dua kelompok dengan rata-rata sama pasti memiliki sebaran sama.', false, 'Jangkauannya bisa sangat berbeda.'),
  ],
  debat: [
    debat('Wati dan Rian mencari rata-rata 60, 70, 80.', ['Wati: "210 : 4 = 52,5."', 'Rian: "210 : 3 = 70."'], 1, 'Bagi dengan banyak data.'),
    debat('Dedi dan Sinta mencari median 9, 4, 6, 2.', ['Dedi: "Ambil dua angka tengah tulisan: 4 dan 6."', 'Sinta: "Urutkan 2, 4, 6, 9 lalu (4 + 6) : 2 = 5."'], 1, 'Urutkan dulu.'),
    debat('Made dan Eka membahas sumbu diagram data 91–95.', ['Made: "Mulai dari 90 supaya beda terlihat jelas."', 'Eka: "Mulai dari 0 agar jujur."'], 1, 'Sumbu mulai 90 menyesatkan.'),
    debat('Rian dan Kiki membahas dua kelompok dengan rata-rata 80.', ['Rian: "Sebaran pasti sama."', 'Kiki: "Belum tentu; jangkauannya bisa berbeda."'], 1, '70–90 lawan 40–120.'),
    debat('Fajar dan Gita membahas data dengan pencilan.', ['Fajar: "Rata-rata paling mewakili."', 'Gita: "Median lebih tahan terhadap pencilan."'], 1, 'Pencilan menarik rata-rata.'),
    debat('Hadi dan Ira membahas modus.', ['Hadi: "Modus bergantung pada seberapa besar nilai."', 'Ira: "Modus hanya bergantung pada seberapa sering muncul."'], 1, 'Modus = paling sering.'),
  ],
  bank: [
    isi('Nilai ulangan 5 siswa: 60, 70, 70, 80, 90. Berapa rata-ratanya?', '74', '370 : 5 = 74.', diagram([60, 70, 70, 80, 90].map((v, i) => ({ l: 'S' + (i + 1), v })), { lo: 0, hi: 100, langkah: 20, nilai: true, anim: false })),
    isi('Nilai ulangan 5 siswa: 60, 70, 70, 80, 90. Berapa mediannya?', '70', 'Urut: 60, 70, 70, 80, 90.'),
    isi('Nilai ulangan 5 siswa: 60, 70, 70, 80, 90. Berapa modusnya?', '70', '70 muncul dua kali.'),
    isi('Nilai Made 70, Wati 85, Rian 70, Sinta 90, Dedi 75. Berapa rata-ratanya?', '78', '390 : 5 = 78.'),
    isi('Nilai Made 70, Wati 85, Rian 70, Sinta 90, Dedi 75. Berapa mediannya?', '75', 'Urut: 70, 70, 75, 85, 90.'),
    isi('Nilai Made 70, Wati 85, Rian 70, Sinta 90, Dedi 75. Berapa modusnya?', '70', '70 muncul dua kali.'),
    isi('Nilai Made 70, Wati 85, Rian 70, Sinta 90, Dedi 75. Berapa jangkauannya?', '20', '90 − 70 = 20.'),
    isi('Nilai ulangan 4 siswa: 65, 75, 85, 95. Berapa rata-ratanya?', '80', '320 : 4 = 80.'),
    isi('Diagram menampilkan kelereng 4 anak: Ali 6, Budi 9, Citra 4, Doni 7. Berapa total kelereng?', '26', '6 + 9 + 4 + 7 = 26.', diagram([{ l: 'Ali', v: 6 }, { l: 'Budi', v: 9 }, { l: 'Citra', v: 4 }, { l: 'Doni', v: 7 }], { lo: 0, hi: 10, langkah: 2, nilai: true, anim: false })),
    isi('Diagram buku: Ani 5, Budi 8, Citra 3, Doni 6. Berapa total buku?', '22', '5 + 8 + 3 + 6 = 22.'),
    isi('Panen mangga 3 hari: 12, 15, 18 kg. Berapa rata-rata per hari?', '15', '45 : 3 = 15.'),
    isi('Rancang 4 nilai berjangkauan tepat 35, nilai terkecil 45. Berapa nilai terbesar?', '80', '45 + 35 = 80.'),
    isi('Rancang 4 nilai rata-rata 75. Tiga nilai pertama 70, 80, 75. Berapa nilai keempat?', '75', '300 − 225 = 75.'),
    isi('Rancang 4 nilai rata-rata 80. Tiga nilai pertama 75, 85, 80. Berapa nilai keempat?', '80', '320 − 240 = 80.'),
    isi('Rancang 6 nilai rata-rata 70. Jumlah lima nilai pertama 340. Berapa nilai keenam?', '80', '420 − 340 = 80.'),
    isi('Rancang 5 data bermedian 60 dengan empat data lain 40, 50, 70, 80. Berapa nilai tengahnya?', '60', 'Urutan 40, 50, 60, 70, 80.'),
    isi('Skala 0, 250, 500, 750, 1000 untuk data 200–950. Berapa banyak garis skala (tidak termasuk 0)?', '4', '250, 500, 750, 1000.'),
    pg('Nilai 75, 78, 80, 82, 200 dengan 200 salah input (seharusnya 82). Rata-rata sebelum diperbaiki?', ['103', '79,4', '95', '80'], 0, '515 : 5 = 103.', diagram([75, 78, 80, 82, 200].map((v, i) => ({ l: 'S' + (i + 1), v })), { lo: 0, hi: 250, langkah: 50, nilai: true, anim: false })),
    pg('Wati membagi jumlah 60, 70, 80 dengan 4. Kesalahannya...', ['Banyak data 3, bukan 4', 'Tidak ada kesalahan', 'Seharusnya dikali'], 0, '210 : 3 = 70.'),
    pg('Sinta membagi jumlah 4 nilai dengan 5. Kesalahannya...', ['Banyak data 4, bukan 5', 'Tidak ada kesalahan'], 0, 'Bagi dengan banyak data.'),
    pg('Dedi mencari median 9, 4, 6, 2 tanpa mengurutkan. Kesalahannya...', ['Data harus diurutkan dulu', 'Tidak ada kesalahan'], 0, '2, 4, 6, 9: median 5.'),
    pg('Made memulai sumbu dari 50 untuk data 60–75. Akibatnya...', ['Perbedaan antar batang tampak lebih besar daripada sebenarnya', 'Perbedaan tampak lebih kecil', 'Data berubah'], 0, 'Mulai dari 0.'),
    pg('Rian memakai interval 100 (0, 100, 200, 300) untuk data 5–25. Akibatnya...', ['Batang sangat pendek dan sulit dibaca', 'Batang sangat tinggi'], 0, 'Skala harus sesuai rentang.'),
    pg('Skala paling sesuai untuk hasil panen 8–45 kg adalah...', ['0, 10, 20, 30, 40, 50', '0, 100, 200', '40, 45, 50'], 0, 'Dimulai dari 0, interval konsisten.'),
    pg('Untuk pendapatan tipikal toko dengan satu bulan yang sangat tinggi, ukuran yang paling sesuai...', ['median', 'rata-rata', 'jumlah'], 0, 'Median tahan pencilan.'),
    pg('Sinta: "Rata-rata sama, jadi sebaran pasti sama." Benarkah?', ['Salah, 70–90 dan 40–120 sama-sama rata-rata 80', 'Benar'], 0, 'Jangkauan berbeda.'),
    pg('Rian: "Rata-rata selalu salah satu nilai data." Benarkah?', ['Salah, rata-rata bisa bukan nilai data', 'Benar'], 0, 'Misalnya 78.'),
    pg('Dedi: "Median selalu lebih baik daripada rata-rata." Benarkah?', ['Salah, pilihannya bergantung pada data dan tujuan', 'Benar'], 0, 'Tidak selalu.'),
    gen('rata'),
    gen('rata'),
    gen('median'),
    gen('modus'),
    gen('jangkauan'),
    gen('baca'),
    gen('baca'),
    gen('rancangRata'),
    gen('rancangMax'),
  ],
}
