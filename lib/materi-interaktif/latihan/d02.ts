import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { garisrat, pita, seratus } from '../gambar'

/**
 * Bahan latihan D-02 (Bilangan rasional: pecahan, desimal, persen, urutan,
 * operasi, dan persen dalam keseharian).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * pecahan, desimal, dan persen sebagai wajah berbeda untuk nilai yang sama
 * (3/4 = 0,75 = 75%; 0,125 = 1/8; 40% = 2/5; 0,08 = 8%), persen = per seratus
 * dan pecahan ke persen dengan membagi lalu kali 100%, membandingkan dan
 * mengurutkan bentuk campuran dan bilangan negatif, empat operasi (pecahan
 * dengan penyebut sama, desimal dengan koma sejajar, pembagian pecahan =
 * kali kebalikan), persen dari, diskon, pajak, persen bertingkat (naik 20%
 * lalu turun 10%; diskon 10% dua kali), alokasi uang (pecahan dan persen),
 * pertumbuhan. Salah paham: 5/8 = 5 x 8 = 40%, 3/4 : 1/2 = 3/4 - 1/2, 0,45 >
 * 0,6 karena digitnya lebih banyak, membandingkan pembilang saja, -0,6 >
 * -0,45, jarak -3/4 ke 0 lebih kecil, diskon bertingkat dijumlah, persen
 * dihitung dari nilai awal padahal dari nilai yang sudah berubah.
 *
 * Jawaban desimal ditulis dengan koma; persen ditulis angkanya saja (35 atau
 * 35%); pecahan ditulis p/q dalam bentuk paling sederhana; uang tanpa titik
 * ribuan.
 *
 * `GEN.pecPersen`, `GEN.persenPec`, `GEN.persenDes`, `GEN.desPersen`,
 * `GEN.persenDari`, `GEN.diskon`, `GEN.pajak`, `GEN.jumlahPec`, `GEN.kurangDes`,
 * `GEN.kaliDes`, `GEN.bertingkat`.
 */
const JS = String.raw`
function gcdR(a,b){return b?gcdR(b,a%b):a}
function kmR(x){return String(Math.round(x*1000)/1000).replace('.',',')}
function pecR(p,q){var g=gcdR(p,q);return q/g===1?String(p/g):(p/g)+'/'+(q/g)}
GEN.pecPersen=function(){
  var D=[2,4,5,8,10,20,25,40,50],d=D[rnd(0,D.length-1)],w=rnd(1,d-1),p=w*100/d;
  if(gcdR(w,d)!==1)return GEN.pecPersen();
  return {t:'isi',q:'Ubah pecahan '+w+'/'+d+' menjadi bentuk persen. (tulis angkanya saja)',a:[kmR(p)],e:w+' : '+d+' = '+kmR(w/d)+', dikali 100% = '+kmR(p)+'%.',g:{k:'pita',baris:[{n:d,w:w,l:w+'/'+d}]}};
};
GEN.persenPec=function(){
  var P=[10,15,20,25,30,35,40,45,50,60,75,80],p=P[rnd(0,P.length-1)];
  return {t:'isi',q:'Nyatakan '+p+'% sebagai pecahan paling sederhana.',a:[pecR(p,100)],e:p+'/100 = '+pecR(p,100)+'.',g:{k:'seratus',p:p}};
};
GEN.persenDes=function(){
  var p=rnd(1,99);
  return {t:'isi',q:'Ubah '+p+'% menjadi bentuk desimal.',a:[kmR(p/100)],e:p+'% = '+p+'/100 = '+kmR(p/100)+'.',g:{k:'seratus',p:p}};
};
GEN.desPersen=function(){
  var p=rnd(1,99);
  return {t:'isi',q:'Ubah '+kmR(p/100)+' menjadi bentuk persen. (tulis angkanya saja)',a:[String(p)],e:kmR(p/100)+' x 100% = '+p+'%.',g:{k:'seratus',p:p}};
};
GEN.persenDari=function(){
  var P=[10,20,25,30,40,50,60,75],p=P[rnd(0,P.length-1)],n=rnd(2,30)*10;
  return {t:'isi',q:'Berapa '+p+'% dari '+n+'?',a:[kmR(p*n/100)],e:kmR(p/100)+' x '+n+' = '+kmR(p*n/100)+'.',g:{k:'seratus',p:p}};
};
GEN.diskon=function(){
  var h=rnd(4,30)*5000,P=[10,15,20,25,30,40,50],p=P[rnd(0,P.length-1)];
  return {t:'isi',q:'Sebuah baju berharga Rp'+titikRibu(h)+' didiskon '+p+'%. Berapa rupiah harga baju setelah diskon?',a:[String(h-h*p/100)],e:'Potongan '+p+'% x '+titikRibu(h)+' = '+titikRibu(h*p/100)+'. Harga akhir '+titikRibu(h)+' - '+titikRibu(h*p/100)+' = '+titikRibu(h-h*p/100)+'.',g:{k:'seratus',p:p}};
};
GEN.pajak=function(){
  var h=rnd(4,40)*5000,P=[5,8,10,11,12],p=P[rnd(0,P.length-1)];
  return {t:'isi',q:'Sebuah barang berharga Rp'+titikRibu(h)+' dikenai pajak '+p+'%. Berapa rupiah harga akhir setelah ditambah pajak?',a:[String(h+h*p/100)],e:'Pajak '+p+'% x '+titikRibu(h)+' = '+titikRibu(h*p/100)+'. Harga akhir '+titikRibu(h+h*p/100)+'.',g:{k:'seratus',p:p}};
};
GEN.jumlahPec=function(){
  var Q=[[2,3,1,6],[1,2,3,8],[1,4,3,8],[2,5,1,10],[3,4,1,8],[1,3,1,6],[5,6,1,3],[3,10,1,5]],q=Q[rnd(0,Q.length-1)],a=q[0],b=q[1],c=q[2],d=q[3],den=b*d/gcdR(b,d),num=a*den/b+c*den/d;
  return {t:'isi',q:'Hitung hasil dari '+a+'/'+b+' + '+c+'/'+d+' (tulis pecahan paling sederhana).',a:[pecR(num,den)],e:'Samakan penyebut '+den+': '+(a*den/b)+'/'+den+' + '+(c*den/d)+'/'+den+' = '+num+'/'+den+' = '+pecR(num,den)+'.',g:{k:'pita',baris:[{n:den,w:a*den/b,l:a+'/'+b},{n:den,w:c*den/d,l:c+'/'+d,warna:'kuning'}]}};
};
GEN.kurangDes=function(){
  var x=rnd(30,99)/10,y=rnd(11,Math.floor(x*10)-5)/10,r=Math.round((x-y)*100)/100;
  return {t:'isi',q:'Hitung hasil dari '+kmR(x)+' - '+kmR(y)+'.',a:[kmR(r)],e:'Sejajarkan koma: '+kmR(x)+' - '+kmR(y)+' = '+kmR(r)+'.',g:{k:'garisrat',lo:0,hi:Math.ceil(x),bagi:2,jejak:[x,r]}};
};
GEN.kaliDes=function(){
  var a=rnd(2,9),b=rnd(2,9);
  return {t:'isi',q:'Hitung hasil dari '+kmR(a/10)+' x '+kmR(b/10)+'.',a:[kmR(a*b/100)],e:a+' x '+b+' = '+(a*b)+', dua angka di belakang koma: '+kmR(a*b/100)+'.',g:{k:'seratus',p:a*b}};
};
GEN.bertingkat=function(){
  var h=rnd(2,10)*10000,u=[10,20,25,30][rnd(0,3)],d=[10,20,25][rnd(0,2)],naik=h+h*u/100,akhir=naik-naik*d/100;
  return {t:'isi',q:'Harga barang Rp'+titikRibu(h)+' dinaikkan '+u+'%, lalu didiskon '+d+'% dari harga yang baru. Berapa rupiah harga akhirnya?',a:[String(akhir)],e:'Naik '+u+'%: '+titikRibu(naik)+'. Diskon '+d+'% dari '+titikRibu(naik)+' = '+titikRibu(naik*d/100)+'. Harga akhir '+titikRibu(akhir)+'. Persen kedua dihitung dari harga yang sudah berubah.'};
};
`

export const DATA_D02: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pecahan 3/4 dan desimal 0,75 mewakili nilai yang sama.', true, '3 : 4 = 0,75.', seratus(75)),
    bs('25% sama dengan 1/4.', true, '25/100 = 1/4.', seratus(25)),
    bs('50% artinya 50 dari 100 bagian.', true, 'Persen berarti per seratus.', seratus(50)),
    bs('0,75 adalah bentuk pecahan.', false, '0,75 adalah bentuk desimal; 3/4 bentuk pecahannya.'),
    bs('Setiap bilangan desimal berhenti (0,5 atau 0,25) dapat dinyatakan sebagai pecahan.', true, '0,5 = 1/2 dan 0,25 = 1/4.'),
    bs('Pecahan diubah menjadi persen dengan mengalikannya dengan 100%.', true, '3/8 = 0,375 = 37,5%.'),
    bs('5/8 = 40% karena 5 × 8 = 40.', false, '5/8 = 5 : 8 = 0,625 = 62,5%.', pita([{ n: 8, w: 5, l: '5/8' }])),
    bs('Untuk mengubah persen menjadi desimal, persen dibagi 100.', true, '35% = 0,35.'),
    bs('0,45 lebih besar daripada 0,6 karena angka di belakang komanya lebih banyak.', false, '0,6 = 0,60 lebih besar daripada 0,45.', garisrat(0, 1, 20, { titik: [{ v: 0.45, l: '0,45' }, { v: 0.6, l: '0,6', w: 'biru' }] })),
    bs('3/8 lebih besar daripada 40%.', false, '3/8 = 37,5% < 40%.'),
    bs('Untuk membandingkan 2/3 dan 3/5 cukup membandingkan pembilangnya.', false, '2/3 ≈ 0,67 lebih besar daripada 3/5 = 0,6.'),
    bs('-0,6 lebih kecil daripada -0,45.', true, '-0,6 lebih jauh ke kiri pada garis bilangan.', garisrat(-1, 0, 20, { titik: [{ v: -0.6, l: '−0,6' }, { v: -0.45, l: '−0,45', w: 'biru' }] })),
    bs('Karena -3/4 < -1/2, jarak -3/4 ke 0 juga lebih kecil daripada jarak -1/2 ke 0.', false, 'Jaraknya 3/4, lebih besar daripada 1/2.'),
    bs('3/4 : 1/2 dikerjakan dengan 3/4 − 1/2.', false, 'Pembagian = kali kebalikan: 3/4 × 2 = 3/2.'),
    bs('Hasil kali pecahan positif kurang dari 1 dengan bilangan lain selalu lebih besar dari bilangan itu.', false, '3/4 × 8 = 6, lebih kecil dari 8.'),
    bs('Diskon 10% dua kali berturut-turut sama dengan diskon 20% sekali.', false, '100.000 → 90.000 → 81.000, sedangkan diskon 20% memberi 80.000.'),
    bs('Menaikkan harga 20% lalu mendiskon 10% sama dengan menaikkan harga 10%.', false, '10.000 → 12.000 → 10.800, naik 8%.'),
    bs('Menaikkan harga 25% lalu mendiskon 20% dari harga baru mengembalikan harga ke semula.', true, '100 → 125 → 100.'),
    bs('Mengalikan pecahan dengan kebalikannya selalu menghasilkan 1 (selama bukan nol).', true, '3/4 × 4/3 = 1.'),
  ],
  debat: [
    debat('Made dan Wati mengubah 5/8 menjadi persen.', ['Made: "5 × 8 = 40%."', 'Wati: "5 : 8 = 0,625 = 62,5%."'], 1, 'Pecahan dibagi dulu.', pita([{ n: 8, w: 5, l: '5/8' }])),
    debat('Rian dan Sinta membandingkan 0,45 dan 0,6.', ['Rian: "0,45 lebih besar, angkanya lebih banyak."', 'Sinta: "0,6 = 0,60, jadi 0,6 lebih besar."'], 1, 'Samakan banyak angka.', garisrat(0, 1, 20, { titik: [{ v: 0.45, l: '0,45' }, { v: 0.6, l: '0,6', w: 'biru' }] })),
    debat('Dedi dan Eka menghitung 3/4 : 1/2.', ['Dedi: "3/4 − 1/2 = 1/4."', 'Eka: "3/4 × 2 = 3/2."'], 1, 'Bagi dengan pecahan = kali kebalikan.'),
    debat('Kiki dan Fajar membahas diskon bertingkat 10% + 10%.', ['Kiki: "Sama dengan diskon 20%."', 'Fajar: "Harga akhir 81.000, bukan 80.000."'], 1, 'Diskon kedua dihitung dari harga yang sudah turun.'),
    debat('Gita dan Hadi membandingkan 2/3 dan 3/5.', ['Gita: "3/5 lebih besar, pembilangnya 3."', 'Hadi: "2/3 lebih besar, 0,67 > 0,6."'], 1, 'Penyebut ikut menentukan.'),
    debat('Ira dan Joni menghitung diskon 50% dari Rp100.000 dan potongan langsung Rp50.000.', ['Ira: "Sama untuk harga ini, tetapi tidak sama untuk harga lain."', 'Joni: "Selalu sama untuk semua harga."'], 0, '50% dari Rp300.000 adalah 150.000, bukan 50.000.'),
  ],
  bank: [
    isi('Bentuk desimal dari 3/4 adalah 0,...', '75', '3 : 4 = 0,75.', seratus(75)),
    isi('Bentuk pecahan paling sederhana dari 25% adalah ...', ['1/4'], '25/100 = 1/4.', seratus(25)),
    isi('Ubah pecahan 7/20 menjadi persen. (angkanya saja)', ['35', '35%'], '7/20 = 35/100.', pita([{ n: 20, w: 7, l: '7/20' }])),
    isi('Ubah 7/10 menjadi persen. (angkanya saja)', ['70', '70%'], '7/10 = 70%.'),
    isi('0,08 dalam bentuk persen adalah ...%', '8', '0,08 = 8/100.', seratus(8)),
    isi('40% dalam pecahan paling sederhana adalah ...', ['2/5'], '40/100 = 2/5.', seratus(40)),
    isi('Bentuk pecahan paling sederhana dari 0,125 adalah ...', ['1/8'], '125/1000 = 1/8.'),
    isi('Untuk mengubah persen menjadi desimal, persen dibagi dengan ...', '100', 'Per seratus.'),
    isi('Hitung 1/2 + 3/8.', ['7/8'], '4/8 + 3/8 = 7/8.', pita([{ n: 8, w: 4, l: '1/2' }, { n: 8, w: 3, l: '3/8', warna: 'kuning' }])),
    isi('Hitung 2/3 + 1/6 (paling sederhana).', ['5/6'], '4/6 + 1/6 = 5/6.'),
    isi('Hitung -3/4 + 1/2.', ['-1/4'], '-3/4 + 2/4 = -1/4.', garisrat(-2, 1, 4, { jejak: [-0.75, -0.25] })),
    isi('Hitung 0,9 - 0,35.', ['0,55'], '0,90 - 0,35 = 0,55.', garisrat(0, 1, 20, { jejak: [0.9, 0.55] })),
    isi('Hitung 4,25 - 1,8.', ['2,45'], '4,25 - 1,80 = 2,45.'),
    isi('Hitung 0,5 × 0,4.', ['0,2', '0,20'], '5 × 4 = 20, dua angka di belakang koma: 0,20.', seratus(20)),
    isi('Tali 2,5 meter dipotong 3/4 meter. Berapa meter sisanya?', ['1,75'], '2,5 - 0,75 = 1,75.', garisrat(0, 3, 4, { jejak: [2.5, 1.75] })),
    isi('Berapa 20% dari 150?', '30', '0,2 × 150 = 30.'),
    isi('Baju Rp120.000 didiskon 15%. Berapa rupiah harganya sekarang?', '102000', '120.000 - 18.000 = 102.000.'),
    isi('Baju Rp80.000 didiskon 25%. Berapa rupiah harga akhir?', '60000', '80.000 - 20.000 = 60.000.'),
    isi('Barang Rp250.000 dikenai pajak 8%. Berapa rupiah harga akhir?', '270000', '250.000 + 20.000 = 270.000.'),
    isi('Uang saku Rp150.000: 2/5 tabungan, 30% jajan, sisanya transportasi. Berapa rupiah untuk transportasi?', '45000', '60.000 + 45.000 = 105.000; sisa 45.000.'),
    isi('Bu Sari punya Rp400.000: 3/8 sembako, 20% uang awal transportasi, sisanya ditabung. Berapa rupiah ditabung?', '170000', '400.000 - 150.000 - 80.000 = 170.000.'),
    isi('Tanaman 40 cm tumbuh 15% lalu 10% dari tinggi baru. Berapa cm sekarang?', ['50,6'], '46 + 4,6 = 50,6.'),
    pg('Manakah pecahan yang senilai dengan 0,6?', ['3/5', '2/3', '5/8', '4/5'], 0, '0,6 = 6/10 = 3/5.'),
    pg('Manakah pecahan yang senilai dengan 0,5?', ['1/2', '1/4', '2/5', '3/4'], 0, '0,5 = 1/2.'),
    pg('Manakah urutan terkecil ke terbesar untuk 0,4 ; 3/8 ; 35%?', ['35%, 3/8, 0,4', '0,4, 3/8, 35%', '3/8, 35%, 0,4', '35%, 0,4, 3/8'], 0, '0,35 < 0,375 < 0,4.'),
    pg('Urutan terkecil ke terbesar untuk -3/4, -0,4, dan 1/5?', ['-3/4, -0,4, 1/5', '-0,4, -3/4, 1/5', '1/5, -0,4, -3/4', '-3/4, 1/5, -0,4'], 0, '-0,75 < -0,4 < 0,2.', garisrat(-1, 1, 20, { titik: [{ v: -0.75, l: '−3/4' }, { v: -0.4, l: '−0,4', w: 'biru' }, { v: 0.2, l: '1/5', w: 'kuning' }] })),
    pg('Hasil 3/4 : 1/2 adalah ...', ['3/2', '1/4', '3/8', '2/3'], 0, '3/4 × 2 = 3/2.'),
    pg('Hasil 0,9 - 0,35 adalah ...', ['0,55', '0,65', '0,45', '1,25'], 0, '0,90 - 0,35 = 0,55.'),
    pg('Siswa menghitung 5/8 sebagai 5 × 8 = 40%. Penilaian yang tepat...', ['Salah; pecahan harus dibagi: 5 : 8 = 0,625 = 62,5%', 'Benar'], 0, 'Bagi, lalu kali 100%.'),
    pg('Made menghitung 3/4 : 1/2 dengan 3/4 - 1/2 = 1/4. Kekeliruannya...', ['Pembagian diperlakukan sebagai pengurangan', 'Tidak ada kekeliruan'], 0, 'Kali kebalikan.'),
    pg('Siswa: "Diskon 10% ditambah diskon 10% sama dengan diskon 20%." Penilaian...', ['Salah; diskon kedua dihitung dari harga yang sudah turun (19% total)', 'Benar'], 0, '81.000 lawan 80.000.'),
    pg('Toko A diskon 25% untuk Rp120.000. Toko B potongan Rp32.000. Yang benar...', ['Toko B memberi potongan lebih besar', 'Toko A memberi potongan lebih besar', 'Sama besar'], 0, '25% = 30.000 < 32.000.'),
    pg('Pedagang: "Naik 25% lalu diskon 20% dari harga baru sama dengan harga awal." Penilaian...', ['Benar: 100 → 125 → 100', 'Salah, lebih mahal', 'Salah, lebih murah'], 0, '1,25 × 0,8 = 1.'),
    pg('Rina Rp200.000: 1/4 untuk buku, lalu 30% dari SISA untuk alat tulis. Yang benar...', ['Alat tulis Rp45.000', 'Alat tulis Rp60.000', 'Sisa setelah buku Rp100.000'], 0, 'Sisa 150.000, 30% = 45.000.'),
    pg('Bentuk persen dari pecahan diperoleh dengan mengalikan pecahan dengan ...', ['100%', '10%', '1/100', '1000%'], 0, 'Kali 100%.'),
    gen('pecPersen'),
    gen('persenPec'),
    gen('persenDes'),
    gen('desPersen'),
    gen('persenDari'),
    gen('diskon'),
    gen('pajak'),
    gen('jumlahPec'),
    gen('kurangDes'),
    gen('kaliDes'),
    gen('bertingkat'),
  ],
}
