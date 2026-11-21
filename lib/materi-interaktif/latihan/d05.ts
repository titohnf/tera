import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { diagram, tabel } from '../gambar'

/**
 * Bahan latihan D-05 (Data: mean, median, modus, jangkauan).
 *
 * Konsep yang diuji bank soal topik ini: mean = jumlah : banyak data (bisa
 * desimal), median = nilai tengah SETELAH diurutkan (ganjil: satu nilai; genap:
 * rata-rata dua nilai tengah), modus = nilai tersering (bisa dua atau tidak
 * ada), jangkauan = terbesar - terkecil, pengaruh nilai ekstrem (mean dan
 * jangkauan terseret, median bertahan), memilih ukuran tipikal, mencari data
 * yang hilang dari mean (jumlah = mean x banyak), menyusun data dengan syarat
 * (mean dan modus, median dan jangkauan), mean jauh di atas median berarti
 * data miring ke nilai besar, jangkauan sama belum tentu sebaran sama,
 * jangkauan 0 berarti semua nilai sama. Salah paham: median tanpa mengurutkan,
 * data genap diambil salah satu nilai tengah, modus = nilai terbesar atau
 * angka pertama yang berulang, bimodal berarti salah, mean terbaik untuk
 * semua data, mean = median = modus selalu.
 *
 * `GEN.meanData`, `GEN.medianGanjil`, `GEN.medianGenap`, `GEN.jangkauan`,
 * `GEN.modusData`, `GEN.dataHilang`.
 */
const JS = String.raw`
function urutD(a){return a.slice().sort(function(x,y){return x-y})}
function dKmR(x){return String(Math.round(x*100)/100).replace('.',',')}
GEN.meanData=function(){
  var n=rnd(4,6),m=rnd(15,40),a=[],i,s=0;
  for(i=0;i<n-1;i++){var v=m+rnd(-5,5);a.push(v);s+=v}
  a.push(m*n-s);
  return {t:'isi',q:'Hitung mean dari data berikut: '+a.join(', ')+'.',a:[String(m)],e:'Jumlah '+(m*n)+' dibagi '+n+' = '+m+'.',g:{k:'diagram',d:a.map(function(v,j){return {l:'D'+(j+1),v:v}}),lo:0,hi:Math.ceil((Math.max.apply(null,a)+1)/10)*10,langkah:10,nilai:true,garis:[{v:m,l:'mean'}]}};
};
GEN.medianGanjil=function(){
  var n=[5,7][rnd(0,1)],a=[],i;
  for(i=0;i<n;i++)a.push(rnd(5,60));
  var u=urutD(a);
  return {t:'isi',q:'Tentukan median dari data berikut: '+a.join(', ')+'.',a:[String(u[(n-1)/2])],e:'Urutkan: '+u.join(', ')+'. Nilai tengah = '+u[(n-1)/2]+'.'};
};
GEN.medianGenap=function(){
  var n=[4,6][rnd(0,1)],a=[],i;
  for(i=0;i<n;i++)a.push(rnd(2,40));
  var u=urutD(a),m=(u[n/2-1]+u[n/2])/2;
  return {t:'isi',q:'Tentukan median dari data berikut: '+a.join(', ')+'. (boleh desimal dengan koma)',a:[dKmR(m)],e:'Urutkan: '+u.join(', ')+'. Dua nilai tengah '+u[n/2-1]+' dan '+u[n/2]+'; rata-ratanya '+dKmR(m)+'.'};
};
GEN.jangkauan=function(){
  var a=[],i;for(i=0;i<5;i++)a.push(rnd(10,60));
  var mx=Math.max.apply(null,a),mn=Math.min.apply(null,a);
  return {t:'isi',q:'Hitung jangkauan dari data berikut: '+a.join(', ')+'.',a:[String(mx-mn)],e:mx+' - '+mn+' = '+(mx-mn)+'.',g:{k:'diagram',d:a.map(function(v,j){return {l:'D'+(j+1),v:v,w:v===mx?'merah':(v===mn?'hijau':'biru')}}),lo:0,hi:Math.ceil((mx+1)/10)*10,langkah:20,nilai:true}};
};
GEN.modusData=function(){
  var m=rnd(60,90),b=[m+5,m-10,m+10,m-5,m+15],a=[m,m,m,b[0],b[1],b[2]],i;
  for(i=a.length-1;i>0;i--){var j=rnd(0,i),t=a[i];a[i]=a[j];a[j]=t}
  return {t:'isi',q:'Nilai ulangan: '+a.join(', ')+'. Berapa modusnya?',a:[String(m)],e:'Nilai '+m+' muncul 3 kali, paling sering.'};
};
GEN.dataHilang=function(){
  var n=rnd(4,6),m=rnd(25,50),a=[],i,s=0;
  for(i=0;i<n-1;i++){var v=m+rnd(-6,6);a.push(v);s+=v}
  var x=m*n-s;
  return {t:'isi',q:'Mean '+n+' data adalah '+m+'. '+(n-1)+' data di antaranya: '+a.join(', ')+'. Berapa data yang satu lagi?',a:[String(x)],e:'Jumlah seluruhnya '+n+' x '+m+' = '+(m*n)+'. Data yang hilang '+(m*n)+' - '+s+' = '+x+'.'};
};
`

export const DATA_D05: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Jangkauan adalah selisih nilai terbesar dan nilai terkecil.', true, 'Terbesar dikurangi terkecil.'),
    bs('Mean diperoleh dengan menjumlahkan semua data lalu membaginya dengan banyak data.', true, '5, 7, 9, 11, 13: 45 : 5 = 9.'),
    bs('Modus adalah nilai yang paling besar dalam data.', false, 'Modus adalah nilai yang paling sering muncul.'),
    bs('Sebelum menentukan median, data harus diurutkan.', true, 'Median adalah nilai tengah setelah diurutkan.'),
    bs('Median 8, 3, 6 adalah 3 karena angka tengah tulisan asli.', false, 'Urutkan: 3, 6, 8; median 6.'),
    bs('Untuk banyak data genap, median adalah rata-rata dua nilai tengah.', true, '4, 6, 8, 10: (6 + 8) : 2 = 7.', tabel([['Urut', '4', '6', '8', '10']])),
    bs('Untuk banyak data genap, median diambil salah satu dari dua nilai tengah.', false, 'Keduanya dirata-ratakan.'),
    bs('Untuk banyak data ganjil, median adalah satu nilai tengah tunggal.', true, 'Tidak perlu dirata-ratakan.'),
    bs('Data dapat memiliki lebih dari satu modus.', true, '4, 4, 5, 6, 6, 7 punya modus 4 dan 6.'),
    bs('Data 3, 5, 7, 9, 11 tidak memiliki modus.', true, 'Semua nilai muncul satu kali.'),
    bs('Data bimodal berarti datanya salah.', false, 'Dua modus adalah hasil yang sah.'),
    bs('Mean bisa desimal walau semua data bilangan bulat.', true, 'Mean 2 dan 3 adalah 2,5.'),
    bs('Mean, median, dan modus selalu sama untuk data apa pun.', false, 'Biasanya berbeda.'),
    bs('Satu nilai yang sangat besar menaikkan mean jauh lebih banyak daripada median.', true, '5, 5, 6, 6, 6, 50: mean 13, median 6.', diagram([{ l: 'D1', v: 5 }, { l: 'D2', v: 5 }, { l: 'D3', v: 6 }, { l: 'D4', v: 6 }, { l: 'D5', v: 6 }, { l: 'D6', v: 50 }], { lo: 0, hi: 60, langkah: 20, nilai: true, garis: [{ v: 13, l: 'mean' }] })),
    bs('Mean selalu ukuran pemusatan terbaik untuk semua data.', false, 'Untuk data dengan nilai ekstrem, median lebih mewakili.'),
    bs('Median 5 juta dan mean 8 juta berarti kebanyakan karyawan bergaji sekitar 8 juta.', false, 'Mean tertarik gaji tinggi; kebanyakan sekitar 5 juta.'),
    bs('Jangkauan 0 berarti semua nilai dalam data sama.', true, 'Terbesar sama dengan terkecil.'),
    bs('Dua kelas berjangkauan sama pasti sebarannya identik.', false, 'Jangkauan hanya memakai dua nilai ujung.'),
    bs('Jika 5 bilangan bermean 20, jumlah kelima bilangan itu 100.', true, '5 × 20 = 100.'),
    bs('Menambah suhu ekstrem 40 °C pada 30, 32, 29, 35, 31 menaikkan jangkauan dari 6 menjadi 11.', true, '40 − 29 = 11.'),
  ],
  debat: [
    debat('Dedi dan Eka mencari median 8, 3, 6.', ['Dedi: "3, angka di tengah."', 'Eka: "Urutkan dulu: 3, 6, 8; mediannya 6."'], 1, 'Urutkan dulu.', tabel([['Urut', '3', '6', '8']])),
    debat('Gita dan Hadi mencari modus 4, 4, 5, 6, 6, 7.', ['Gita: "Modusnya 4 saja."', 'Hadi: "Ada dua modus: 4 dan 6."'], 1, 'Dua nilai sama-sama tersering.'),
    debat('Ira dan Joni menanggapi median Rp5 juta dan mean Rp8 juta.', ['Ira: "Kebanyakan bergaji sekitar 8 juta."', 'Joni: "Ada gaji besar yang menarik mean; kebanyakan sekitar 5 juta."'], 1, 'Mean tertarik nilai ekstrem.'),
    debat('Kiki dan Lani memilih ukuran untuk nilai kelas dengan beberapa nilai 0 karena sakit.', ['Kiki: "Mean, karena memakai semua data."', 'Lani: "Median, karena tahan nilai ekstrem."'], 1, 'Untuk nilai tipikal, median lebih sesuai.'),
    debat('Made dan Nia membandingkan dua kelas berjangkauan sama.', ['Made: "Sebarannya pasti identik."', 'Nia: "Belum tentu; jangkauan hanya melihat nilai terbesar dan terkecil."'], 1, 'Nilai di antaranya bisa berbeda.'),
    debat('Oka dan Putri menghitung median 4, 8, 6, 10.', ['Oka: "Mediannya 6."', 'Putri: "Urutkan 4, 6, 8, 10, lalu (6 + 8) : 2 = 7."'], 1, 'Data genap: rata-rata dua nilai tengah.'),
  ],
  bank: [
    isi('Jumlah seluruh data dibagi banyak data menghasilkan ... (mean / median / modus)', ['mean'], 'Itu rata-rata.'),
    isi('Nilai yang paling sering muncul disebut ...', ['modus'], 'Modus.'),
    isi('Nilai tengah data yang sudah diurutkan disebut ...', ['median'], 'Median.'),
    isi('Selisih nilai terbesar dan terkecil disebut ...', ['jangkauan', 'range'], 'Jangkauan.'),
    isi('Sebelum menentukan median, data harus ... terlebih dahulu.', ['diurutkan'], 'Diurutkan dari kecil ke besar.'),
    isi('Hitung mean dari 5, 7, 9, 11, 13.', '9', '45 : 5 = 9.'),
    isi('Hitung mean dari 6, 10, 8, 12, 14.', '10', '50 : 5 = 10.'),
    isi('Hitung mean dari 12, 16, 14, 18, 20.', '16', '80 : 5 = 16.'),
    isi('Tentukan median dari 12, 7, 15, 9, 10.', '10', '7, 9, 10, 12, 15.'),
    isi('Tentukan median dari 4, 8, 6, 10.', '7', '(6 + 8) : 2 = 7.', tabel([['Urut', '4', '6', '8', '10']])),
    isi('Tentukan median dari 18, 22, 15, 30, 25.', '22', '15, 18, 22, 25, 30.'),
    isi('Hitung jangkauan dari 23, 45, 12, 38, 27.', '33', '45 - 12 = 33.'),
    isi('Suhu 5 hari: 25, 19, 30, 22, 27. Berapa jangkauan?', '11', '30 - 19 = 11.'),
    isi('Jangkauan lima nilai 6, 6, 6, 6, 6 adalah ...', '0', 'Terbesar sama dengan terkecil.'),
    isi('Mean 5 bilangan adalah 20. Empat bilangan: 15, 18, 22, 25. Bilangan kelima?', '20', '100 - 80 = 20.'),
    isi('Mean 4 data adalah 25. Tiga data: 20, 22, 28. Data keempat?', '30', '100 - 70 = 30.'),
    isi('Mean tinggi 4 siswa 155 cm. Tiga siswa: 150, 158, 152. Berapa cm tinggi siswa keempat?', '160', '620 - 460 = 160.'),
    isi('Penjualan roti 4 minggu: 40, 45, 42, 48. Agar mean 5 minggu minimal 45, minggu kelima minimal berapa?', '50', '225 - 175 = 50.'),
    isi('Data 5, 5, 6, 6, 6, 50. Berapa median?', '6', '5, 5, 6, 6, 6, 50: dua nilai tengah 6 dan 6.'),
    isi('Data 20, 20, 25, 30, 35, 120. Berapa median? (koma)', ['27,5'], '(25 + 30) : 2 = 27,5.'),
    isi('Nilai 60, 70, 72, 74, 150. Nilai 150 keliru dan diganti 79. Berapa mean sekarang?', '71', '355 : 5 = 71.'),
    pg('Modus data 70, 80, 70, 90, 70, 85 adalah ...', ['70', '90', '80', '85'], 0, '70 muncul 3 kali.'),
    pg('Modus data 6, 7, 6, 8, 9, 6 adalah ...', ['6', '9', '7', '8'], 0, '6 muncul 3 kali.'),
    pg('Median dari 9, 2, 5 adalah ...', ['5, karena 2, 5, 9 tengahnya 5', '2', '9', '9, nilai terbesar'], 0, 'Urutkan dulu.'),
    pg('Modus data 4, 4, 5, 6, 6, 7...', ['4 dan 6 (bimodal)', '4', '6', 'tidak ada'], 0, 'Dua nilai tersering.'),
    pg('Pernyataan yang benar tentang modus...', ['Modus bisa tidak ada bila semua nilai berbeda', 'Modus selalu nilai terbesar', 'Modus selalu ada satu', 'Modus sama dengan mean'], 0, 'Modus bisa tidak ada.'),
    pg('Kepala sekolah ingin melaporkan nilai tipikal, ada beberapa nilai 0 karena sakit. Ukuran yang cocok...', ['Median', 'Mean', 'Jangkauan', 'Nilai terkecil'], 0, 'Median tahan nilai ekstrem.'),
    pg('Pemilik toko sepatu ingin tahu ukuran yang paling banyak diminati. Ukuran statistik yang cocok...', ['Modus', 'Mean', 'Jangkauan', 'Median'], 0, 'Modus = paling sering.'),
    pg('Median 60 dan mean 75. Kesimpulan yang tepat...', ['Mean tertarik nilai besar; kebanyakan siswa sekitar 60', 'Kebanyakan siswa sekitar 75', 'Data pasti salah', 'Mean selalu benar'], 0, 'Mean jauh di atas median: ada nilai besar.'),
    pg('Kelas A: 70, 75, 80, 85, 90. Kelas B: 60, 70, 80, 90, 100. Yang benar...', ['Mean dan median sama (80), jangkauan B lebih besar', 'Jangkauan sama', 'Mean B lebih besar', 'Median A lebih kecil'], 0, 'Jangkauan A 20, B 40.', tabel([['', 'Mean', 'Median', 'Jangkauan'], ['A', '80', '80', '20'], ['B', '80', '80', '40']])),
    pg('Data lima bilangan dengan mean 10 dan modus 8...', ['8, 8, 9, 11, 14', '8, 9, 10, 11, 12', '10, 10, 10, 10, 10', '6, 8, 9, 11, 16'], 0, 'Jumlah 50 dan 8 muncul dua kali.'),
    pg('Data lima bilangan yang mean-nya sama dengan mediannya...', ['10, 20, 30, 40, 50', '1, 2, 3, 4, 100', '5, 5, 5, 5, 50', '2, 4, 6, 8, 40'], 0, 'Keduanya 30.'),
    pg('Siswa: "Jangkauan sama berarti sebaran identik." Penilaian...', ['Salah; jangkauan hanya memakai nilai terbesar dan terkecil', 'Benar'], 0, 'Nilai di antaranya bisa berbeda.'),
    pg('Siswa: "Bimodal berarti data salah." Penilaian...', ['Salah; dua modus adalah hasil yang sah', 'Benar'], 0, 'Boleh ada lebih dari satu modus.'),
    pg('Nilai 40 ditambahkan ke suhu 30, 32, 29, 35, 31. Jangkauan menjadi...', ['11', '6', '40', '5'], 0, '40 - 29 = 11.'),
    gen('meanData'),
    gen('medianGanjil'),
    gen('medianGenap'),
    gen('jangkauan'),
    gen('modusData'),
    gen('dataHilang'),
  ],
}
