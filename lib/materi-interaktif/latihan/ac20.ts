import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { desimal, pita, seratus } from '../gambar'

/**
 * Bahan latihan AC-20 (Mengurutkan bilangan bentuk berbeda: cacah, pecahan,
 * desimal, persentase).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * persen = per seratus, tempat desimal (persepuluhan, perseratusan,
 * perseribuan), ubah pecahan ke desimal dan persen (kalikan sampai penyebut
 * 100, atau bagi: 3/8 = 0,375 = 37,5%), persen ke desimal (geser koma dua
 * langkah ke kiri) dan sebaliknya, bandingkan dan urutkan bentuk berbeda
 * dengan menyamakan bentuk (0,3; 1/4; 28%), diskon 25% lawan 3/10, dan salah
 * paham: 5/8 ditulis 0,58, 1/8 ditulis 8%, 5% ditulis 0,5, 0,3 sama dengan 3,
 * 0,45 dibaca 45 persepuluhan, 0,3 lebih kecil dari 1/5 karena 3 < 5, makin
 * banyak digit makin besar, dan digit pertama sama berarti sama besar.
 *
 * Jawaban desimal ditulis dengan koma. Soal "... persen" meminta ANGKA saja
 * (papan angka), supaya tidak perlu mengetik tanda persen.
 *
 * `GEN.pecPersen` pecahan ke persen, `GEN.persenDes` persen ke desimal,
 * `GEN.desPersen` desimal ke persen, `GEN.banding` pecahan lawan desimal.
 */
const JS = String.raw`
function koma2(p){return p<10?'0,0'+p:(p%10===0?'0,'+(p/10):'0,'+p)}
GEN.pecPersen=function(){
  var D=[2,4,5,10,20,25,50],d=D[rnd(0,D.length-1)],w=rnd(1,d-1),k=100/d,p=w*k;
  return {t:'isi',q:'Pecahan '+w+'/'+d+' sama dengan berapa persen? (tulis angkanya saja)',a:[String(p)],e:'Ubah penyebut menjadi 100: '+d+' × '+k+' = 100, jadi '+w+' × '+k+' = '+p+'. '+w+'/'+d+' = '+p+'/100 = '+p+'%.',g:{k:'pita',baris:[{n:d,w:w,l:w+'/'+d},{n:100,w:p,l:p+'%'}],sejajar:true}};
};
GEN.persenDes=function(){
  var p=rnd(1,99);
  return {t:'isi',q:'Ubah '+p+'% menjadi bilangan desimal.',a:[koma2(p)],e:p+'% = '+p+'/100. Geser koma dua langkah ke kiri: '+koma2(p)+'.',g:{k:'seratus',p:p}};
};
GEN.desPersen=function(){
  var p=rnd(1,99);
  return {t:'isi',q:'Ubah '+koma2(p)+' menjadi persen. (tulis angkanya saja)',a:[String(p)],e:koma2(p)+' = '+p+'/100 = '+p+'%. Koma digeser dua langkah ke kanan.',g:{k:'desimal',s:koma2(p)}};
};
GEN.banding=function(){
  var D=[4,5,8,10,20,25],d=D[rnd(0,D.length-1)],w=rnd(1,d-1),v=Math.round(w/d*1000),x,t=0;
  do{x=rnd(5,95)*10;t++}while(x===v&&t<50);
  var des=String(x/1000).replace('.',','),pecT=w+'/'+d,idx=v>x?0:1;
  return {t:'pg',q:'Manakah yang lebih besar, '+pecT+' atau '+des+'?',o:[pecT,des,'Sama besar'],a:idx,e:pecT+' = '+String(v/1000).replace('.',',')+' dan '+des+'. Setelah sama-sama desimal: '+(idx===0?pecT+' lebih besar.':des+' lebih besar.'),g:{k:'pita',baris:[{n:1000,w:v,l:pecT},{n:1000,w:x,l:des}],sejajar:true}};
};
`

export const DATA_AC20: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Tanda persen (%) berarti "per seratus".', true, '25% = 25 dari 100 petak.', seratus(25)),
    bs('50%, 1/2, dan 0,5 adalah tiga penulisan untuk nilai yang sama.', true, 'Setengah bisa ditulis sebagai pecahan, persen, atau desimal.', seratus(50)),
    bs('Bilangan 0,3 nilainya sama dengan 3.', false, '0,3 kurang dari 1, sedangkan 3 lebih dari 1.', desimal('0,3')),
    bs('Pada bilangan 0,4 angka 4 berada pada tempat persepuluhan.', true, 'Angka pertama setelah koma adalah persepuluhan: 0,4 = 4/10.', desimal('0,4')),
    bs('Bilangan 0,45 dibaca "45 persepuluhan".', false, 'Dua angka setelah koma berarti perseratusan: 45 perseratusan.', desimal('0,45')),
    bs('0,7 lebih besar daripada 0,65.', true, '0,7 = 0,70, dan 70 perseratusan lebih banyak dari 65.', pita([{ n: 100, w: 70, l: '0,7' }, { n: 100, w: 65, l: '0,65' }], { sejajar: true })),
    bs('Makin banyak angka di belakang koma, makin besar nilai bilangan desimal itu.', false, '0,7 lebih besar daripada 0,65 walau angkanya lebih sedikit.', pita([{ n: 100, w: 70, l: '0,7' }, { n: 100, w: 65, l: '0,65' }], { sejajar: true })),
    bs('25% sama dengan 1/4.', true, '25/100 disederhanakan menjadi 1/4.', seratus(25)),
    bs('Untuk mengubah persen menjadi desimal, koma digeser dua langkah ke kiri.', true, '45% = 45/100 = 0,45.'),
    bs('5% sama dengan 0,5.', false, '5% = 5/100 = 0,05.', seratus(5)),
    bs('3/10 sama dengan 30%.', true, '3/10 = 30/100 = 30%.', pita([{ n: 10, w: 3, l: '3/10' }, { n: 100, w: 30, l: '30%' }], { sejajar: true })),
    bs('Pecahan 1/8 sama dengan 8%.', false, '1 : 8 = 0,125 = 12,5%.'),
    bs('Untuk membandingkan bilangan berbentuk berbeda, ubah dulu ke bentuk yang sama.', true, 'Misalnya semuanya diubah menjadi desimal atau semuanya menjadi persen.'),
    bs('0,6 dan 60% adalah nilai yang sama.', true, '60% = 60/100 = 0,6.', pita([{ n: 100, w: 60, l: '0,6' }, { n: 100, w: 60, l: '60%' }], { sejajar: true })),
  ],
  debat: [
    debat('Ayu dan Beno mengubah 5% menjadi desimal.', ['Ayu: "0,5, koma digeser satu langkah."', 'Beno: "0,05, koma digeser dua langkah."'], 1, '5% = 5/100 = 0,05.', seratus(5)),
    debat('Cici dan Dedi membandingkan 0,3 dan 1/5.', ['Cici: "0,3 lebih kecil, karena 3 lebih kecil daripada 5."', 'Dedi: "Ubah dulu: 1/5 = 0,2, jadi 0,3 lebih besar."'], 1, 'Bentuknya berbeda, jadi harus disamakan dulu sebelum dibandingkan.', pita([{ n: 10, w: 3, l: '0,3' }, { n: 5, w: 1, l: '1/5' }], { sejajar: true })),
    debat('Eka dan Fajar membahas 0,08 dan 8%.', ['Eka: "Nilainya sama, keduanya 8/100."', 'Fajar: "Beda. 0,08 lebih kecil."'], 0, '8% = 8/100 = 0,08.', seratus(8)),
    debat('Gita dan Hadi mengubah 3/8 menjadi desimal.', ['Gita: "0,38, tulis 3 dan 8 berdampingan."', 'Hadi: "0,375, karena 3 : 8 = 0,375."'], 1, 'Pecahan berarti pembagian: 3 dibagi 8.', pita([{ n: 8, w: 3, l: '3/8' }, { n: 1000, w: 375, l: '0,375' }], { sejajar: true })),
    debat('Ira dan Joni membandingkan 0,65 dan 0,6.', ['Ira: "Sama besar, digit pertamanya sama-sama 6."', 'Joni: "Beda. 0,6 = 0,60, jadi 0,65 lebih besar."'], 1, 'Bandingkan semua tempat, bukan hanya digit pertama.', pita([{ n: 100, w: 65, l: '0,65' }, { n: 100, w: 60, l: '0,6' }], { sejajar: true })),
    debat('Kiki dan Lala membandingkan diskon Toko A 20% dan Toko B 1/4.', ['Kiki: "A lebih besar, karena 20 lebih besar daripada 4."', 'Lala: "B lebih besar. 1/4 = 25%, lebih dari 20%."'], 1, 'Samakan bentuknya dulu. 1/4 = 25%.', pita([{ n: 100, w: 20, l: 'A 20%' }, { n: 4, w: 1, l: 'B 1/4' }], { sejajar: true })),
  ],
  bank: [
    isi('Pecahan 9/20 sama dengan berapa persen? (tulis angkanya saja)', '45', '20 × 5 = 100, jadi 9 × 5 = 45. 9/20 = 45%.', pita([{ n: 20, w: 9, l: '9/20' }, { n: 100, w: 45, l: '?%' }], { sejajar: true })),
    isi('Pecahan 3/25 sama dengan berapa persen? (tulis angkanya saja)', '12', '25 × 4 = 100, jadi 3 × 4 = 12.', pita([{ n: 25, w: 3, l: '3/25' }, { n: 100, w: 12, l: '?%' }], { sejajar: true })),
    isi('Ubah 0,35 menjadi persen. (tulis angkanya saja)', '35', '0,35 = 35/100 = 35%.', desimal('0,35')),
    isi('Ubah 0,6 menjadi persen. (tulis angkanya saja)', '60', '0,6 = 0,60 = 60/100 = 60%.', desimal('0,6')),
    isi('Kamu merancang pecahan berpenyebut 20 yang senilai dengan 35%. Berapa pembilangnya?', '7', '35% = 35/100. 100 : 5 = 20, jadi 35 : 5 = 7.', pita([{ n: 100, w: 35, l: '35%' }, { n: 20, w: 7, l: '?/20' }], { sejajar: true })),
    isi('Ubah pecahan 3/4 menjadi bilangan desimal.', ['0,75'], '3 : 4 = 0,75.', pita([{ n: 4, w: 3, l: '3/4' }, { n: 100, w: 75, l: '0,75' }], { sejajar: true })),
    isi('Ubah pecahan 2/5 menjadi bilangan desimal.', ['0,4'], '2/5 = 4/10 = 0,4.'),
    isi('Ubah 5% menjadi bilangan desimal.', ['0,05'], '5% = 5/100 = 0,05.', seratus(5)),
    isi('Ubah 47% menjadi bilangan desimal.', ['0,47'], '47% = 47/100 = 0,47.', seratus(47)),
    isi('Ubah pecahan 5/8 menjadi bilangan desimal (tuliskan hasil bagi penuh).', ['0,625'], '5 : 8 = 0,625.'),
    isi('Kamu merancang bentuk desimal yang senilai dengan 13/20. Tuliskan hasilnya.', ['0,65'], '13/20 = 65/100 = 0,65.', pita([{ n: 20, w: 13, l: '13/20' }, { n: 100, w: 65, l: '?' }], { sejajar: true })),
    pg('Tanda persen (%) berarti...', ['per seratus', 'per sepuluh', 'per satu', 'per seribu'], 0, 'Persen = per seratus.', seratus(30)),
    pg('Pada bilangan 0,9 angka 9 berada pada tempat...', ['persepuluhan', 'perseratusan', 'perseribuan', 'satuan'], 0, 'Angka pertama setelah koma: persepuluhan.', desimal('0,9')),
    pg('Manakah yang lebih besar, 0,5 atau 4/10?', ['0,5', '4/10', 'Sama besar'], 0, '4/10 = 0,4, lebih kecil daripada 0,5.', pita([{ n: 10, w: 5, l: '0,5' }, { n: 10, w: 4, l: '4/10' }], { sejajar: true })),
    pg('Urutkan dari yang TERKECIL ke TERBESAR: 0,4; 3/10; 45%.', ['3/10, 0,4, 45%', '0,4, 3/10, 45%', '45%, 0,4, 3/10', '3/10, 45%, 0,4'], 0, 'Dalam desimal: 0,3; 0,4; 0,45.', pita([{ n: 100, w: 40, l: '0,4' }, { n: 10, w: 3, l: '3/10' }, { n: 100, w: 45, l: '45%' }])),
    pg('Manakah yang senilai dengan 3/5?', ['60%', '35%', '3,5%', '5%'], 0, '3/5 = 6/10 = 60/100 = 60%.', pita([{ n: 5, w: 3, l: '3/5' }, { n: 100, w: 60, l: '60%' }], { sejajar: true })),
    pg('Toko A memberi diskon 15% dan Toko B memberi diskon 1/5 dari harga yang sama. Toko mana yang diskonnya lebih besar?', ['Toko B', 'Toko A', 'Sama besar'], 0, '1/5 = 20%, lebih besar daripada 15%.', pita([{ n: 100, w: 15, l: 'A 15%' }, { n: 5, w: 1, l: 'B 1/5' }], { sejajar: true })),
    pg('Manakah yang PALING BESAR di antara 0,35; 1/3; dan 34%?', ['0,35', '1/3', '34%', 'Ketiganya sama besar'], 0, 'Dalam desimal: 0,35; 0,333...; 0,34.', pita([{ n: 100, w: 35, l: '0,35' }, { n: 3, w: 1, l: '1/3' }, { n: 100, w: 34, l: '34%' }])),
    pg('Manakah pernyataan yang tepat tentang 0,4; 2/5; dan 40%?', ['Ketiganya sama besar', '0,4 yang paling besar', '2/5 yang paling besar', '40% yang paling besar'], 0, '2/5 = 4/10 = 0,4 dan 40% = 0,4.', pita([{ n: 10, w: 4, l: '0,4' }, { n: 5, w: 2, l: '2/5' }, { n: 100, w: 40, l: '40%' }], { sejajar: true })),
    pg('Rian mengubah 7% menjadi "7,0" hanya dengan menghapus tanda persen. Apa yang salah?', ['Persen berarti per seratus: 7% = 7/100 = 0,07', 'Tidak ada yang salah', 'Seharusnya menjadi 0,7', 'Seharusnya menjadi 70'], 0, 'Koma harus digeser dua langkah ke kiri.', seratus(7)),
    pg('Kiki mengira 0,2 sama nilainya dengan 2. Apa yang salah?', ['0,2 kurang dari 1, sedangkan 2 lebih dari 1', 'Tidak ada yang salah', '0,2 lebih besar daripada 2', 'Koma tidak berpengaruh'], 0, '0,2 = 2/10, jauh lebih kecil daripada 2.', desimal('0,2')),
    gen('pecPersen'),
    gen('pecPersen'),
    gen('pecPersen'),
    gen('persenDes'),
    gen('persenDes'),
    gen('desPersen'),
    gen('desPersen'),
    gen('banding'),
    gen('banding'),
  ],
}
