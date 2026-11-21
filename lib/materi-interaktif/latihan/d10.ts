import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bayangan, gabungan, tabel } from '../gambar'

/**
 * Bahan latihan D-10 (Geometri: kekongruenan dan kesebangunan).
 *
 * Konsep yang diuji bank soal topik ini: kongruen (bentuk dan ukuran sama
 * persis) lawan sebangun (sudut sama, sisi sebanding), simbol (kongruen dan
 * sebangun), korespondensi dari urutan huruf, faktor skala (skala 1 berarti
 * kongruen; skala diperkecil 0,5 atau 1/3), bangun yang pasti sebangun
 * (lingkaran, persegi, segitiga sama sisi) dan yang tidak (persegi panjang,
 * luas sama), syarat kongruen segitiga (SSS, SAS dengan sudut diapit),
 * syarat sebangun (AA, sisi sebanding), garis tinggi pada segitiga siku-siku,
 * menghitung panjang dengan faktor skala (foto diperbesar, trapesium), metode
 * bayangan (tongkat dan pohon), cermin datar, skala peta dan denah (cm ke m,
 * luas), miniatur. Salah paham: sisi sebanding berarti kongruen, bentuk mirip
 * berarti kongruen, keliling sama berarti kongruen, luas sama berarti
 * sebangun, AA berarti kongruen, 500 m : 2.000 = 0,25 cm.
 *
 * Jawaban angka tanpa satuan.
 *
 * `GEN.sisiSkala`, `GEN.faktorSkala`, `GEN.fotoSebangun`, `GEN.tinggiBayangan`,
 * `GEN.petaMeter`, `GEN.maketCm`, `GEN.sisiKecil`.
 */
const JS = String.raw`
function kmD(x){return String(Math.round(x*100)/100).replace('.',',')}
GEN.sisiSkala=function(){
  var k=[2,3,4,5][rnd(0,3)],a=rnd(3,12);
  return {t:'isi',q:'Segitiga ABC sebangun dengan segitiga DEF dengan faktor skala '+k+' (ABC ke DEF). Jika AB = '+a+' cm, berapa cm panjang DE?',a:[String(a*k)],e:'DE = '+a+' x '+k+' = '+(a*k)+' cm.',g:{k:'tabel',baris:[['','ABC','DEF'],['sisi',a,'?']]}};
};
GEN.sisiKecil=function(){
  var k=[2,3,4,5][rnd(0,3)],b=rnd(2,9)*k;
  return {t:'isi',q:'Segitiga PQR sebangun dengan segitiga STU dengan faktor skala 1/'+k+' (PQR ke STU). Jika PQ = '+b+' cm, berapa cm panjang ST?',a:[String(b/k)],e:'ST = '+b+' : '+k+' = '+(b/k)+' cm.'};
};
GEN.faktorSkala=function(){
  var k=[2,3,4,5][rnd(0,3)],a=rnd(3,9);
  return {t:'isi',q:'Segitiga ABC sebangun dengan segitiga DEF. Jika AB = '+a+' cm dan DE = '+(a*k)+' cm, berapa faktor skala dari ABC ke DEF?',a:[String(k)],e:(a*k)+' : '+a+' = '+k+'.'};
};
GEN.fotoSebangun=function(){
  var k=[2,3,4,5][rnd(0,3)],l=rnd(2,6),p=l+rnd(1,5);
  return {t:'isi',q:'Sebuah foto berukuran lebar '+l+' cm dan panjang '+p+' cm diperbesar sebangun sehingga lebarnya '+(l*k)+' cm. Berapa cm panjang foto sekarang?',a:[String(p*k)],e:'Skala '+(l*k)+' : '+l+' = '+k+'. Panjang '+p+' x '+k+' = '+(p*k)+' cm.',g:{k:'tabel',baris:[['','Lebar','Panjang'],['Asli',l,p],['Baru',l*k,'?']]}};
};
GEN.tinggiBayangan=function(){
  var T=[[1,1.5,12],[1.2,1.6,20],[2,2.5,15],[1.5,2,16],[1,2,14]],q=T[rnd(0,T.length-1)],h=q[0]*q[2]/q[1];
  return {t:'isi',q:'Tongkat setinggi '+kmD(q[0])+' m membuat bayangan '+kmD(q[1])+' m. Pada saat yang sama sebuah tiang membuat bayangan '+q[2]+' m. Berapa meter tinggi tiang?',a:[kmD(h)],e:'Tinggi : '+q[2]+' = '+kmD(q[0])+' : '+kmD(q[1])+'; tinggi = '+kmD(h)+' m.',g:{k:'bayangan',a:{h:q[0],b:q[1],lh:kmD(q[0])+' m',lb:kmD(q[1])+' m'},c:{h:h,b:q[2],lh:'?',lb:q[2]+' m'},nama:['tongkat','tiang']}};
};
GEN.petaMeter=function(){
  var S=[1000,2000,5000,10000,20000],s=S[rnd(0,S.length-1)],c=rnd(2,9),m=c*s/100;
  return {t:'isi',q:'Peta berskala 1 : '+titikRibu(s)+'. Jarak dua titik pada peta '+c+' cm. Berapa meter jarak sebenarnya?',a:[String(m).replace('.',',')],e:c+' x '+titikRibu(s)+' = '+titikRibu(c*s)+' cm = '+String(m).replace('.',',')+' m.'};
};
GEN.maketCm=function(){
  var S=[20,25,50,100],s=S[rnd(0,3)],m=rnd(2,12)*s/100;
  return {t:'isi',q:'Miniatur gedung berskala 1 : '+s+'. Tinggi gedung sebenarnya '+String(m).replace('.',',')+' m. Berapa cm tinggi miniatur?',a:[String(m*100/s).replace('.',',')],e:String(m).replace('.',',')+' m = '+(m*100)+' cm; '+(m*100)+' : '+s+' = '+String(m*100/s).replace('.',',')+' cm.'};
};
`

export const DATA_D10: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Dua bangun kongruen memiliki bentuk dan ukuran yang sama persis.', true, 'Kongruen = sama persis.'),
    bs('Dua bangun sebangun memiliki sudut bersesuaian sama besar dan sisi bersesuaian sebanding.', true, 'Ukuran boleh berbeda.'),
    bs('Dua bangun yang kongruen pasti sebangun.', true, 'Skala 1.'),
    bs('Dua bangun yang sebangun pasti kongruen.', false, 'Skala bisa bukan 1.'),
    bs('Simbol ≅ menyatakan kongruen dan ~ menyatakan sebangun.', true, 'Dua simbol berbeda.'),
    bs('Pada △PQR ≅ △XYZ, titik P bersesuaian dengan X, Q dengan Y, dan R dengan Z.', true, 'Urutan huruf menentukan korespondensi.'),
    bs('Faktor skala 1 antara dua bangun sebangun berarti keduanya kongruen.', true, 'Ukuran sama.'),
    bs('Dua bangun dengan sisi sebanding berskala 1 : 3 disebut kongruen.', false, 'Itu sebangun.', gabungan('tri', { a: 6, t: 4 }, { a: '6', t: '4' })),
    bs('Pada dua bangun sebangun, semua sisi bersesuaian harus sama panjang.', false, 'Cukup sebanding.'),
    bs('Dua persegi sebarang pasti sebangun.', true, 'Semua sudut 90° dan sisi sebanding.'),
    bs('Dua persegi panjang sebarang pasti sebangun.', false, 'Rasio panjang dan lebar bisa berbeda.'),
    bs('Dua persegi panjang berluas sama pasti sebangun.', false, '2 × 8 dan 4 × 4 luasnya 16.'),
    bs('Semua segitiga sama sisi sebangun.', true, 'Semua sudutnya 60°.'),
    bs('Semua lingkaran sebangun.', true, 'Hanya ukuran jari-jari yang berbeda.'),
    bs('Segitiga bersisi 5, 6, 7 cm kongruen dengan segitiga bersisi 5, 6, 7 cm (SSS).', true, 'Tiga pasang sisi sama.'),
    bs('Segitiga bersisi 5, 6, 7 cm kongruen dengan segitiga bersisi 5, 6, 8 cm.', false, 'Sisi ketiga berbeda.'),
    bs('SAS memerlukan sudut yang diapit kedua sisi yang sama.', true, 'Sudutnya harus di antara kedua sisi.'),
    bs('Dua segitiga dengan dua sudut yang sama (AA) pasti kongruen.', false, 'AA hanya menjamin sebangun.'),
    bs('Segitiga dengan keliling sama pasti kongruen.', false, 'Sisinya bisa berbeda.'),
    bs('Pada metode bayangan, tongkat dan pohon beserta bayangannya membentuk segitiga sebangun.', true, 'Sudut matahari sama.', bayangan({ h: 1.2, b: 1.6, lh: '1,2 m', lb: '1,6 m' }, { h: 15, b: 20, lh: '?', lb: '20 m' })),
  ],
  debat: [
    debat('Dedi dan Eka menilai △ABC dan △DEF yang sisinya sebanding skala 2.', ['Dedi: "Sebanding, jadi kongruen."', 'Eka: "Skala bukan 1, jadi sebangun saja."'], 1, 'Kongruen menuntut skala 1.'),
    debat('Gita dan Hadi menilai dua persegi panjang berluas sama.', ['Gita: "Luas sama, jadi sebangun."', 'Hadi: "Belum tentu; rasio sisinya bisa berbeda."'], 1, 'Luas sama bukan syarat sebangun.'),
    debat('Ira dan Joni menghitung tinggi tiang: tongkat 1,2 m, bayangan 1,6 m, bayangan tiang 20 m.', ['Ira: "20 + 1,2 − 1,6 = 19,6 m."', 'Joni: "20 × 1,2 : 1,6 = 15 m."'], 1, 'Perbandingan, bukan penjumlahan.', bayangan({ h: 1.2, b: 1.6, lh: '1,2 m', lb: '1,6 m' }, { h: 15, b: 20, lh: '?', lb: '20 m' })),
    debat('Kiki dan Lani menghitung jarak: peta 1 : 2.000, jarak sebenarnya 500 m.', ['Kiki: "500 : 2.000 = 0,25 cm."', 'Lani: "50.000 cm : 2.000 = 25 cm."'], 1, 'Ubah satuan lebih dulu.'),
    debat('Made dan Nia menilai dua segitiga dengan dua sudut yang sama.', ['Made: "Pasti kongruen."', 'Nia: "Pasti sebangun, belum tentu kongruen."'], 1, 'AA menjamin sebangun.'),
    debat('Oka dan Putri membahas skala 1 : 100 pada denah kamar 3 cm × 4 cm.', ['Oka: "Luas sebenarnya 12 m²."', 'Putri: "Luas sebenarnya 1.200 m²."'], 0, '3 m × 4 m.'),
  ],
  bank: [
    isi('Simbol yang menyatakan dua bangun sebangun adalah ... (ketik ~)', ['~'], 'Simbol ~ untuk sebangun.'),
    isi('Perbandingan sisi bersesuaian pada dua bangun sebangun disebut faktor ...', ['skala'], 'Faktor skala.'),
    isi('Sisi sepanjang 14 cm diperkecil sebangun dengan faktor skala 0,5. Berapa cm sisi barunya?', '7', '14 × 0,5.'),
    isi('△ABC ~ △DEF dengan skala 2 dan AB = 5 cm. Berapa cm DE?', '10', '5 × 2.'),
    isi('△ABC ~ △DEF dengan skala 2 dan AC = 7 cm. Berapa cm DF?', '14', '7 × 2.'),
    isi('△ABC ~ △DEF dengan skala 3 dan AB = 9 cm. Berapa cm DE?', '27', '9 × 3.'),
    isi('△ABC ~ △DEF dengan skala 4 dan AB = 7 cm. Berapa cm DE?', '28', '7 × 4.'),
    isi('△ABC ~ △DEF dengan skala 1/2 dan AB = 10 cm. Berapa cm DE?', '5', '10 : 2.'),
    isi('△PQR ~ △STU dengan skala 1/3 dan PQ = 18 cm. Berapa cm ST?', '6', '18 : 3.'),
    isi('△PQR ~ △STU dengan skala 0,25 dan PQ = 12 cm. Berapa cm ST?', '3', '12 × 0,25.'),
    isi('AB = 6 cm dan DE = 18 cm (△ABC ~ △DEF). Berapa faktor skala ABC ke DEF?', '3', '18 : 6.'),
    isi('KL = 8 cm dan NO = 20 cm. Berapa faktor skala dari KLM ke NOP? (dengan koma)', ['2,5'], '20 : 8 = 2,5.'),
    isi('△PQR ~ △STU: PQ = 4, ST = 12, QR = 6. Berapa cm TU?', '18', 'Skala 3; 6 × 3.', tabel([['', 'PQR', 'STU'], ['sisi 1', 'PQ = 4', 'ST = 12'], ['sisi 2', 'QR = 6', 'TU = ?']])),
    isi('Dua trapesium sebangun dengan skala 1,5. Sisi 8 cm. Berapa cm sisi bersesuaian pada trapesium hasil?', '12', '8 × 1,5.'),
    isi('Foto lebar 4 cm dan panjang 6 cm diperbesar sehingga lebarnya 10 cm. Berapa cm panjangnya?', '15', 'Skala 2,5.'),
    isi('Foto lebar 5 cm dan panjang 8 cm diperbesar sehingga lebarnya 15 cm. Berapa cm panjangnya?', '24', 'Skala 3.'),
    isi('Foto 10 × 15 cm dicetak poster berlebar 40 cm. Berapa cm panjang poster?', '60', 'Skala 4.'),
    isi('Tongkat 1,2 m berbayangan 1,6 m. Pohon berbayangan 20 m. Berapa meter tinggi pohon?', '15', '20 × 1,2 : 1,6.', bayangan({ h: 1.2, b: 1.6, lh: '1,2 m', lb: '1,6 m' }, { h: 15, b: 20, lh: '?', lb: '20 m' })),
    isi('Tongkat 1 m berbayangan 1,5 m. Tiang lampu berbayangan 18 m. Berapa meter tinggi tiang?', '12', '18 : 1,5.'),
    isi('Peta 1 : 5.000, jarak peta 8 cm. Berapa meter jarak sebenarnya?', '400', '40.000 cm.'),
    isi('Peta 1 : 10.000, jarak peta 6 cm. Berapa meter jarak sebenarnya?', '600', '60.000 cm.'),
    isi('Peta 1 : 2.000, jarak sebenarnya 500 m. Berapa cm jarak pada peta?', '25', '50.000 : 2.000.'),
    isi('Denah skala 1 : 100, kamar 3 cm × 4 cm. Berapa m² luas sebenarnya?', '12', '3 m × 4 m.'),
    isi('Miniatur skala 1 : 50, gedung 25 m. Berapa cm tinggi miniatur?', '50', '2.500 : 50.'),
    pg('Dua bangun datar kongruen jika ...', ['bentuk DAN ukurannya sama persis', 'bentuknya sama saja', 'luasnya sama', 'kelilingnya sama'], 0, 'Sama persis.'),
    pg('Pada △MNO ≅ △RST (M↔R, N↔S, O↔T), sisi yang bersesuaian dengan MN adalah ...', ['RS', 'ST', 'RT', 'MR'], 0, 'M↔R dan N↔S.'),
    pg('Pada △DEF ~ △GHI (D↔G, E↔H, F↔I), sisi yang bersesuaian dengan EF adalah ...', ['HI', 'GH', 'GI', 'DF'], 0, 'E↔H dan F↔I.'),
    pg('Pasangan bangun yang PASTI sebangun ...', ['Semua lingkaran', 'Semua persegi panjang', 'Semua jajar genjang', 'Semua trapesium'], 0, 'Lingkaran semua sebangun.'),
    pg('Kondisi yang menjamin dua segitiga kongruen ...', ['Tiga pasang sisi bersesuaian sama (SSS)', 'Dua sudut sama (AA)', 'Keliling sama', 'Luas sama'], 0, 'SSS.'),
    pg('Pasangan segitiga yang pasti kongruen menurut SAS ...', ['PQ = ST = 5, QR = TU = 7, ∠Q = ∠T = 40°', 'PQ = ST = 5, ∠Q = ∠T = 40°', 'dua sudut sama', 'luas sama'], 0, 'Sudut diapit kedua sisi.'),
    pg('Pada segitiga siku-siku ABC (siku di C), garis tinggi CD membentuk ...', ['△ACD ~ △CBD ~ △ABC', 'hanya △ACD ~ △ABC', 'segitiga kongruen', 'tidak ada hubungan'], 0, 'Ketiganya sebangun.'),
    pg('Siswa: "Bentuk tampak mirip, jadi kongruen." Penilaian...', ['Tidak tepat; kongruen menuntut ukuran sama juga', 'Tepat'], 0, 'Periksa ukuran.'),
    pg('Siswa: "Sisi sebanding skala 2:1, jadi kongruen." Penilaian...', ['Salah; itu sebangun', 'Benar'], 0, 'Skala bukan 1.'),
    pg('Siswa: "AA berarti kongruen." Penilaian...', ['Salah; AA hanya menjamin sebangun', 'Benar'], 0, 'Ukuran bisa berbeda.'),
    pg('Skala 1 : 100: luas pada gambar dibanding luas asli adalah 1 : ...', ['10.000', '100', '1.000', '200'], 0, 'Kuadrat skala.'),
    gen('sisiSkala'),
    gen('sisiKecil'),
    gen('faktorSkala'),
    gen('fotoSebangun'),
    gen('tinggiBayangan'),
    gen('petaMeter'),
    gen('maketCm'),
  ],
}
