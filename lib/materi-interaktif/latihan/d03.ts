import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bar, tabel } from '../gambar'

/**
 * Bahan latihan D-03 (Rasio, proporsi, perbandingan senilai dan berbalik nilai).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * membaca rasio (3 : 5 dibaca "3 berbanding 5"), menyederhanakan dan
 * rasio senilai (12 : 18 = 2 : 3), urutan rasio (A : B lawan B : A), rasio
 * sebagai pecahan a/b, rasio bukan selisih, mencari nilai dari rasio dan satu
 * nilai (4 : 7 dengan 20), membagi total menurut rasio (2 : 3 : 5; keliling
 * dan luas), perbandingan senilai (hasil bagi tetap) dan berbalik nilai
 * (hasil kali tetap; pekerja dan hari), harga satuan (3 pensil lawan 5
 * pensil), skala peta dan maket (1 : 500.000; cm ke km; luas ikut kuadrat),
 * campuran dengan harga rata-rata, untung : modal. Salah paham: rasio dianggap
 * selisih, setengah pekerja setengah hari, membandingkan harga total bukan
 * harga satuan, 300.000 cm = 30 km, skala luas sama dengan skala panjang,
 * untung : modal 1 : 4 dianggap 25% dari harga jual, dua besaran sama-sama
 * naik pasti senilai, penyebut skala lebih kecil dianggap maket lebih kecil.
 *
 * Jawaban angka tanpa titik ribuan; uang tanpa Rp; pecahan ditulis p/q.
 *
 * `GEN.sederhana`, `GEN.cariRasio`, `GEN.bagiDua`, `GEN.bagiTiga`,
 * `GEN.skalaKm`, `GEN.maket`, `GEN.berbalik`, `GEN.senilai`.
 */
const JS = String.raw`
function gcdD(a,b){return b?gcdD(b,a%b):a}
GEN.sederhana=function(){
  var P=[[2,3],[3,4],[3,5],[2,5],[4,5],[5,6],[3,7],[5,8]],p=P[rnd(0,P.length-1)],k=rnd(2,9);
  return {t:'isi',q:'Sederhanakan rasio '+(p[0]*k)+' : '+(p[1]*k)+' menjadi bentuk paling sederhana. (tulis dengan tanda titik dua)',a:[p[0]+':'+p[1],p[0]+' : '+p[1]],e:'Bagi keduanya dengan '+k+': '+p[0]+' : '+p[1]+'.',g:{k:'bar',bagian:[{l:String(p[0]*k),v:p[0],w:'biru'},{l:String(p[1]*k),v:p[1],w:'merah'}]}};
};
GEN.cariRasio=function(){
  var P=[[2,3],[3,4],[4,7],[3,5],[5,8],[2,5]],p=P[rnd(0,P.length-1)],k=rnd(2,9),u=rnd(0,1);
  return {t:'isi',q:'Perbandingan kelereng Dodi dan Eka adalah '+p[0]+' : '+p[1]+'. Jika kelereng '+(u?'Eka':'Dodi')+' '+(p[u]*k)+' butir, berapa butir kelereng '+(u?'Dodi':'Eka')+'?',a:[String(p[1-u]*k)],e:'Satu bagian = '+(p[u]*k)+' : '+p[u]+' = '+k+'. Jawaban '+p[1-u]+' x '+k+' = '+(p[1-u]*k)+'.',g:{k:'bar',bagian:[{l:'Dodi '+p[0],v:p[0],w:'biru'},{l:'Eka '+p[1],v:p[1],w:'merah'}]}};
};
GEN.bagiDua=function(){
  var P=[[2,3],[3,4],[1,4],[2,5],[3,5],[4,5]],p=P[rnd(0,P.length-1)],k=rnd(2,12)*1000,tot=(p[0]+p[1])*k,u=rnd(0,1);
  return {t:'isi',q:'Uang Rina dan Sinta berbanding '+p[0]+' : '+p[1]+', jumlahnya Rp'+titikRibu(tot)+'. Berapa rupiah uang '+(u?'Sinta':'Rina')+'?',a:[String(p[u]*k)],e:'Jumlah bagian '+(p[0]+p[1])+'; satu bagian '+titikRibu(k)+'. '+(u?'Sinta':'Rina')+' '+p[u]+' x '+titikRibu(k)+' = '+titikRibu(p[u]*k)+'.',g:{k:'bar',atas:'Rp'+titikRibu(tot),bagian:[{l:'Rina '+p[0],v:p[0],w:'biru'},{l:'Sinta '+p[1],v:p[1],w:'merah'}]}};
};
GEN.bagiTiga=function(){
  var P=[[2,3,5],[3,4,5],[1,2,3],[2,2,3],[1,3,4]],p=P[rnd(0,P.length-1)],k=rnd(2,9)*2,tot=(p[0]+p[1]+p[2])*k,u=2;
  return {t:'isi',q:'Umur Andi, Bella, dan Caca berbanding '+p[0]+' : '+p[1]+' : '+p[2]+', jumlahnya '+tot+' tahun. Berapa tahun selisih umur Caca dan Andi?',a:[String((p[2]-p[0])*k)],e:'Satu bagian '+tot+' : '+(p[0]+p[1]+p[2])+' = '+k+'. Selisih '+(p[2]-p[0])+' bagian = '+((p[2]-p[0])*k)+'.',g:{k:'bar',atas:tot+' tahun',bagian:[{l:'Andi '+p[0],v:p[0],w:'biru'},{l:'Bella '+p[1],v:p[1],w:'merah'},{l:'Caca '+p[2],v:p[2],w:'hijau'}]}};
};
GEN.skalaKm=function(){
  var S=[50000,100000,200000,500000,1000000,2000000],s=S[rnd(0,S.length-1)],c=rnd(2,9),km=c*s/100000;
  return {t:'isi',q:'Peta berskala 1 : '+titikRibu(s)+'. Jarak dua kota pada peta '+c+' cm. Berapa km jarak sebenarnya?',a:[String(km).replace('.',',')],e:c+' x '+titikRibu(s)+' = '+titikRibu(c*s)+' cm = '+String(km).replace('.',',')+' km (dibagi 100.000).',g:{k:'tabel',baris:[['Di peta','Sebenarnya'],[c+' cm','? km']]}};
};
GEN.maket=function(){
  var S=[100,200,250,400,500],s=S[rnd(0,S.length-1)],m=rnd(2,12)*s/100*4;
  return {t:'isi',q:'Maket berskala 1 : '+s+'. Tinggi gedung sebenarnya '+m+' meter. Berapa cm tinggi maket?',a:[String(m*100/s).replace('.',',')],e:m+' m = '+titikRibu(m*100)+' cm. '+titikRibu(m*100)+' : '+s+' = '+String(m*100/s).replace('.',',')+' cm.'};
};
GEN.berbalik=function(){
  var P=[[6,10,12],[8,6,4],[12,8,6],[5,12,10],[4,15,6],[10,9,15],[9,8,6]],p=P[rnd(0,P.length-1)],hari=p[0]*p[1]/p[2];
  return {t:'isi',q:p[0]+' pekerja menyelesaikan sebuah proyek dalam '+p[1]+' hari. Jika pekerja menjadi '+p[2]+' orang (kecepatan sama), berapa hari yang dibutuhkan?',a:[String(hari)],e:'Pekerja x hari tetap: '+p[0]+' x '+p[1]+' = '+(p[0]*p[1])+'. '+(p[0]*p[1])+' : '+p[2]+' = '+hari+' hari.',g:{k:'tabel',baris:[['Pekerja','Hari'],[p[0],p[1]],[p[2],'?']]}};
};
GEN.senilai=function(){
  var v=[40,45,50,60,75,80][rnd(0,5)],t1=rnd(2,5),t2=t1+rnd(2,4);
  return {t:'isi',q:'Sebuah mobil menempuh '+(v*t1)+' km dalam '+t1+' jam dengan kecepatan tetap. Berapa km jarak yang ditempuh dalam '+t2+' jam?',a:[String(v*t2)],e:'Kecepatan '+(v*t1)+' : '+t1+' = '+v+' km/jam. '+v+' x '+t2+' = '+(v*t2)+' km.',g:{k:'tabel',baris:[['Waktu (jam)','Jarak (km)'],[t1,v*t1],[t2,'?']]}};
};
`

export const DATA_D03: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Rasio 3 : 5 dibaca "3 berbanding 5".', true, 'Tanda titik dua dibaca "berbanding".', bar([{ l: '3', v: 3, w: 'biru' }, { l: '5', v: 5, w: 'merah' }])),
    bs('Rasio membandingkan dua besaran dengan pembagian, bukan pengurangan.', true, '12 : 4 berarti 12 adalah 3 kali 4, bukan 8 lebih banyak.'),
    bs('Rasio 12 : 18 senilai dengan 2 : 3.', true, 'Bagi keduanya dengan 6.', bar([{ l: '12', v: 12, w: 'biru' }, { l: '18', v: 18, w: 'merah' }])),
    bs('Rasio uang Rani dan adik 5 : 3 berarti uang Rani Rp5.000 lebih banyak.', false, 'Rasio hanya perbandingan, bukan selisih. Rani 5 bagian, adik 3 bagian.'),
    bs('Rasio kelereng merah dan biru 3 : 4 berarti kelereng merah lebih banyak.', false, '3 lebih kecil daripada 4, jadi merah lebih sedikit.'),
    bs('Rasio A : B = 3 : 5 sama dengan B : A = 5 : 3.', true, 'Dibalik urutannya.'),
    bs('Rasio a : b dapat ditulis sebagai pecahan a/b.', true, '3 : 5 = 3/5.'),
    bs('Pada perbandingan senilai, hasil bagi kedua besaran selalu tetap.', true, 'Kecepatan = jarak : waktu tetap.', tabel([['Jarak', 'Waktu'], ['180', '3'], ['300', '5']])),
    bs('Pada perbandingan berbalik nilai, hasil kali kedua besaran selalu tetap.', true, 'Pekerja × hari tetap.', tabel([['Pekerja', 'Hari'], ['6', '10'], ['12', '5']])),
    bs('Banyak pekerja dan hari penyelesaian (pekerjaan sama) adalah perbandingan senilai.', false, 'Pekerja bertambah, hari berkurang: berbalik nilai.'),
    bs('Jarak tempuh dan waktu pada kecepatan tetap adalah perbandingan senilai.', true, 'Keduanya naik bersama dengan hasil bagi tetap.'),
    bs('Jika 10 pekerja butuh 6 hari, maka 5 pekerja butuh 3 hari.', false, '10 × 6 = 60; 60 : 5 = 12 hari.'),
    bs('Dua besaran yang sama-sama naik pasti senilai.', false, 'Harus berbanding tetap. Tinggi badan dan umur sama-sama naik tetapi tidak senilai.'),
    bs('3 kaos Rp150.000 pasti lebih murah daripada 5 kaos Rp240.000 karena 150.000 < 240.000.', false, 'Harga per kaos: 50.000 lawan 48.000.', tabel([['Toko', 'Banyak', 'Harga'], ['Saya', '3', '150.000'], ['Sebelah', '5', '240.000']])),
    bs('Skala 1 : 500.000 berarti 1 cm di peta mewakili 500.000 cm di lapangan.', true, '500.000 cm = 5 km.'),
    bs('Jarak 6 cm pada peta berskala 1 : 50.000 adalah 30 km.', false, '6 × 50.000 = 300.000 cm = 3 km.'),
    bs('1 km sama dengan 100.000 cm.', true, '1 km = 1.000 m = 100.000 cm.'),
    bs('Skala 1 : 100 membuat luas pada gambar 100 kali lebih kecil.', false, 'Luas 100 × 100 = 10.000 kali lebih kecil.'),
    bs('Skala 1 : 150 menghasilkan maket yang lebih besar daripada skala 1 : 200.', true, 'Penyebut lebih kecil, ukuran maket lebih besar.'),
    bs('Rasio untung : modal = 1 : 4 berarti untung 25% dari modal.', true, '1/4 = 25% dari modal. Dari harga jual hanya 1/5 = 20%.'),
  ],
  debat: [
    debat('Dedi dan Eka membahas rasio uang 5 : 3.', ['Dedi: "Berarti uang Rani Rp5.000 lebih banyak."', 'Eka: "Rasio tidak memberi selisih; hanya perbandingan."'], 1, 'Rasio bukan selisih.', bar([{ l: 'Rani 5', v: 5, w: 'biru' }, { l: 'Adik 3', v: 3, w: 'merah' }])),
    debat('Gita dan Hadi menghitung pekerja: 10 orang butuh 6 hari, 5 orang butuh ...', ['Gita: "3 hari, karena setengah."', 'Hadi: "12 hari, karena 60 pekerja-hari dibagi 5."'], 1, 'Berbalik nilai.'),
    debat('Ira dan Joni membandingkan harga 4 buku Rp20.000 dengan 7 buku Rp38.500.', ['Ira: "Toko 7 buku lebih mahal totalnya, jadi lebih mahal."', 'Joni: "Bandingkan per buku: 5.000 lawan 5.500."'], 1, 'Cari harga satuan.'),
    debat('Kiki dan Lani membaca peta 1 : 50.000 dengan jarak 6 cm.', ['Kiki: "300.000 cm = 30 km."', 'Lani: "300.000 cm = 3 km."'], 1, '1 km = 100.000 cm.'),
    debat('Made dan Nia menilai skala 1 : 100.', ['Made: "Luas gambar 100 kali lebih kecil."', 'Nia: "Luas 10.000 kali lebih kecil."'], 1, 'Luas = panjang × lebar.'),
    debat('Oka dan Putri membahas untung : modal = 1 : 4.', ['Oka: "Untung 25% dari harga jual."', 'Putri: "Untung 25% dari modal; dari harga jual 20%."'], 1, 'Harga jual = 5 bagian.'),
  ],
  bank: [
    isi('Rasio 3 : 5 dibaca "3 ... 5". Isi dengan satu kata.', ['berbanding'], 'Tanda : dibaca berbanding.'),
    isi('Jika A : B = 3 : 5, maka B : A = ... (tulis dengan tanda titik dua)', ['5:3', '5 : 3'], 'Urutan dibalik.'),
    isi('Rasio a : b dapat ditulis dalam bentuk pecahan sebagai ...', ['a/b'], 'Pembilang a, penyebut b.'),
    isi('Pada perbandingan senilai, hasil bagi kedua besaran selalu ... (tetap / berubah)', ['tetap'], 'Hasil bagi tetap.'),
    isi('Pada perbandingan berbalik nilai, hasil kali kedua besaran selalu ... (tetap / berubah)', ['tetap'], 'Hasil kali tetap.'),
    isi('Sederhanakan rasio 21 : 28. (tulis dengan tanda titik dua)', ['3:4', '3 : 4'], 'Bagi 7.', bar([{ l: '21', v: 3, w: 'biru' }, { l: '28', v: 4, w: 'merah' }])),
    isi('Rasio panjang : lebar persegi panjang 4 : 3. Jika lebar 15 cm, berapa cm panjangnya?', '20', '15 : 3 = 5; 4 × 5 = 20.', bar([{ l: 'p 4', v: 4, w: 'biru' }, { l: 'l 3', v: 3, w: 'merah' }])),
    isi('Uang Andi : Budi = 2 : 3. Uang Andi Rp40.000. Berapa rupiah uang Budi?', '60000', '40.000 : 2 = 20.000; 3 × 20.000 = 60.000.', bar([{ l: 'Andi 2', v: 2, w: 'biru' }, { l: 'Budi 3', v: 3, w: 'merah' }])),
    isi('Tepung : gula = 5 : 2. Gula 250 gram. Berapa gram tepung?', '625', '250 : 2 = 125; 5 × 125 = 625.'),
    isi('Rasio uang Ani : Budi : Citra = 2 : 3 : 5, total Rp200.000. Berapa rupiah uang Citra?', '100000', '10 bagian; satu bagian 20.000; Citra 5 × 20.000.', bar([{ l: 'Ani 2', v: 2, w: 'biru' }, { l: 'Budi 3', v: 3, w: 'merah' }, { l: 'Citra 5', v: 5, w: 'hijau' }])),
    isi('Panjang : lebar = 5 : 3, keliling 64 cm. Berapa cm panjangnya?', '20', 'Setengah keliling 32 = 8 bagian; satu bagian 4; panjang 20.'),
    isi('Panjang : lebar = 5 : 3, keliling 64 cm. Berapa cm² luasnya?', '240', '20 × 12 = 240.'),
    isi('Sirup : air = 2 : 5 untuk 490 ml minuman. Berapa ml sirup?', '140', '490 : 7 = 70; 2 × 70 = 140.'),
    isi('Beras A : B = 3 : 2 untuk 25 kg. Berapa kg beras A?', '15', '25 : 5 = 5; 3 × 5 = 15.'),
    isi('Beras A 15 kg Rp10.000/kg dan B 10 kg Rp14.000/kg. Berapa rupiah biaya seluruhnya?', '290000', '150.000 + 140.000 = 290.000.'),
    isi('Biaya bahan Rp290.000 untuk 25 kg, dijual untung Rp1.000 per kg. Berapa rupiah harga jual per kg?', '12600', '290.000 : 25 = 11.600; 11.600 + 1.000 = 12.600.'),
    isi('Mobil 180 km dalam 3 jam. Berapa jam untuk 300 km (kecepatan tetap)?', '5', '180 : 3 = 60 km/jam; 300 : 60 = 5.', tabel([['Jarak', 'Waktu'], ['180', '3'], ['300', '?']])),
    isi('Dengan kecepatan 60 km/jam, berapa jam untuk menempuh 90 km?', ['1,5'], '90 : 60 = 1,5 jam.'),
    isi('6 pekerja menyelesaikan proyek dalam 10 hari. Berapa hari jika 12 pekerja?', '5', '6 × 10 = 60; 60 : 12 = 5.', tabel([['Pekerja', 'Hari'], ['6', '10'], ['12', '?']])),
    isi('8 pekerja menyelesaikan proyek dalam 6 hari. Berapa hari jika tinggal 4 pekerja?', '12', '48 : 4 = 12.'),
    isi('Kereta 240 km dalam 4 jam. Berapa km dalam 7 jam (kecepatan sama)?', '420', '60 × 7 = 420.'),
    isi('Peta berskala 1 : 500.000. Berapa km jarak sebenarnya untuk 1 cm di peta?', '5', '500.000 cm = 5 km.'),
    isi('Skala 1 : 2.000.000 dan jarak peta 4 cm. Berapa km jarak sebenarnya?', '80', '8.000.000 cm = 80 km.'),
    isi('Maket berskala 1 : 200. Tinggi gedung asli 24 m. Berapa cm tinggi maket?', '12', '2.400 : 200 = 12.'),
    isi('Maket 1 : 200. Panjang gedung asli 40 m. Berapa cm panjang maket?', '20', '4.000 : 200 = 20.'),
    pg('Manakah contoh perbandingan senilai?', ['Banyak liter bensin dan jarak tempuh (konsumsi tetap)', 'Banyak pekerja dan waktu penyelesaian', 'Kecepatan dan waktu tempuh untuk jarak tetap', 'Banyak keran dan waktu mengisi bak'], 0, 'Dua-duanya naik bersama dengan hasil bagi tetap.'),
    pg('Manakah contoh perbandingan berbalik nilai?', ['Banyak pekerja dan waktu penyelesaian (pekerjaan sama)', 'Banyak liter bensin dan jarak tempuh', 'Banyak buku dan harga total', 'Waktu dan jarak pada kecepatan tetap'], 0, 'Pekerja naik, waktu turun.'),
    pg('Pada perbandingan berbalik nilai, jika satu besaran bertambah maka besaran lain ...', ['berkurang', 'bertambah juga', 'tetap', 'menjadi nol'], 0, 'Hasil kali tetap.'),
    pg('Siswa: "Rasio 5 : 3 berarti selisihnya 2." Penilaian...', ['Salah; rasio bukan selisih', 'Benar'], 0, 'Rasio membandingkan dengan pembagian.'),
    pg('Siswa: "4 pekerja 15 hari, jadi 8 pekerja 30 hari." Penilaian...', ['Salah; 8 pekerja butuh 7,5 hari', 'Benar'], 0, '60 : 8 = 7,5.'),
    pg('Siswa: "300.000 cm = 30 km." Penilaian...', ['Salah; 300.000 cm = 3 km', 'Benar'], 0, 'Bagi 100.000.', tabel([['Di peta', 'Sebenarnya'], ['6 cm', '? km']])),
    pg('Toko C 4 buku Rp20.000, toko D 7 buku Rp38.500. Yang benar...', ['Toko C lebih murah per buku', 'Toko D lebih murah per buku', 'Sama saja'], 0, '5.000 lawan 5.500 per buku.'),
    pg('Toko A 3 pensil Rp7.500, Toko B 5 pensil Rp11.500. Yang benar...', ['Toko B lebih murah per pensil', 'Toko A lebih murah per pensil', 'Sama saja'], 0, '2.500 lawan 2.300.'),
    pg('Penjual: "Untung : modal = 1 : 4, jadi untungku 25% dari harga jual." Penilaian...', ['Salah; 25% dari modal, dari harga jual 20%', 'Benar'], 0, 'Harga jual 5 bagian.'),
    pg('Skala 1 : 100. Luas pada gambar dibandingkan luas asli adalah 1 : ...', ['10.000', '100', '1.000', '200'], 0, '100 × 100 = 10.000.'),
    pg('Rasio kelereng merah : biru = 3 : 4. Merah 3 butir, biru ...', ['4 butir', '3 butir', '7 butir', '1 butir'], 0, 'Satu bagian = 1.'),
    pg('Resep 4 orang: 300 g beras. Untuk 10 orang butuh ...', ['750 g', '600 g', '1.200 g', '350 g'], 0, '300 × 2,5 = 750.'),
    pg('Resep A 6 : 2 dan B 9 : 3. Pernyataan yang tepat...', ['Proporsinya sama (3 : 1)', 'A lebih banyak tepung', 'B lebih banyak gula (dibanding tepung)', 'Tidak dapat dibandingkan'], 0, 'Keduanya 3 : 1.'),
    pg('Skala 1 : 150 dibandingkan 1 : 200 untuk gedung yang sama...', ['maket lebih besar', 'maket lebih kecil', 'maket sama besar', 'tidak dapat ditentukan'], 0, 'Penyebut lebih kecil, ukuran lebih besar.'),
    gen('sederhana'),
    gen('cariRasio'),
    gen('bagiDua'),
    gen('bagiTiga'),
    gen('skalaKm'),
    gen('maket'),
    gen('berbalik'),
    gen('senilai'),
  ],
}
