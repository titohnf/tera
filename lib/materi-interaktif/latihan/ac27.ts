import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { gabungan, petak } from '../gambar'

/**
 * Bahan latihan AC-27 (Menentukan ukuran dari luas).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * arti "menentukan ukuran dari luas" (kebalikan mencari luas), persegi
 * panjang (panjang atau lebar = luas : ukuran yang diketahui), persegi
 * (sisi = akar kuadrat dari luas), segitiga (alas atau tinggi = 2 x luas :
 * ukuran yang diketahui), satuan luas (1 m persegi = 10.000 cm persegi; samakan
 * satuan dulu), cerita (taman, ruangan, bendera, kebun), memeriksa dengan
 * memasukkan kembali ke rumus luas, rancang (pasangan panjang-lebar berluas
 * sama, segitiga beralas sama tinggi), dan sifat (persegi panjang cukup dibagi,
 * segitiga perlu dikali 2, satuan harus konsisten). Salah paham: luas dikali
 * ukuran, persegi dibagi 2, lupa dikali 2 pada segitiga, lupa konversi satuan,
 * dan satuan tidak ditulis.
 *
 * Jawaban angka ditulis tanpa satuan dan tanpa titik ribuan.
 *
 * `GEN.lebar` persegi panjang, `GEN.sisi` persegi, `GEN.tinggi` segitiga,
 * `GEN.satuan` ruangan berluas m persegi dengan sisi dalam cm, `GEN.rancangPP`
 * pasangan panjang-lebar, `GEN.rancangSeg` segitiga dari luas dan alas.
 */
const JS = String.raw`
GEN.lebar=function(){
  var k=rnd(4,15),x=rnd(3,12),L=k*x,nm=rnd(0,1)===0?['panjang','lebar']:['lebar','panjang'];
  var pj=nm[0]==='panjang'?k:x,lb=nm[0]==='panjang'?x:k;
  return {t:'isi',q:'Luas suatu persegi panjang adalah '+L+' cm persegi, dan '+nm[0]+'nya '+k+' cm. Berapa '+nm[1]+' persegi panjang tersebut (cm)?',a:[String(x)],e:nm[1]+' = luas : '+nm[0]+' = '+L+' : '+k+' = '+x+'. Periksa: '+k+' x '+x+' = '+L+'.',g:{k:'gabungan',jenis:'pp',p:pj,l:lb,lab:{p:nm[0]==='panjang'?k+' cm':'?',l:nm[0]==='panjang'?'?':k+' cm',isi:'luas '+L}}};
};
GEN.sisi=function(){
  var s=rnd(3,15);
  return {t:'isi',q:'Luas suatu persegi adalah '+(s*s)+' cm persegi. Berapa panjang sisi persegi tersebut (cm)?',a:[String(s)],e:'Sisi = akar kuadrat dari luas. '+s+' x '+s+' = '+(s*s)+', bukan '+(s*s)+' : 2.',g:s<=12?{k:'petak',n:s}:null};
};
GEN.tinggi=function(){
  var a=rnd(4,12),t=rnd(3,12);
  if((a*t)%2)t++;
  var L=a*t/2,alasDiketahui=rnd(0,1)===0;
  if(alasDiketahui)return {t:'isi',q:'Luas suatu segitiga adalah '+L+' cm persegi, dan alasnya '+a+' cm. Berapa tinggi segitiga tersebut (cm)?',a:[String(t)],e:'Tinggi = (2 x '+L+') : '+a+' = '+(2*L)+' : '+a+' = '+t+'. Jangan lupa mengalikan luas dengan 2.',g:{k:'gabungan',jenis:'tri',a:a,t:t,lab:{a:a+' cm',t:'?'}}};
  return {t:'isi',q:'Luas suatu segitiga adalah '+L+' cm persegi, dan tingginya '+t+' cm. Berapa alas segitiga tersebut (cm)?',a:[String(a)],e:'Alas = (2 x '+L+') : '+t+' = '+(2*L)+' : '+t+' = '+a+'.',g:{k:'gabungan',jenis:'tri',a:a,t:t,lab:{a:'?',t:t+' cm'}}};
};
GEN.satuan=function(){
  var D=[[1,50,200],[1,100,100],[2,200,100],[3,300,100],[4,200,200],[4,160,250],[5,250,200],[6,300,200],[2,125,160],[3,150,200]],d=D[rnd(0,D.length-1)];
  return {t:'isi',q:'Sebuah ruangan memiliki luas '+d[0]+' meter persegi, dan salah satu sisinya diketahui '+d[1]+' cm. Berapa sisi lainnya (cm)? (Ingat: samakan dulu satuan luas dengan satuan sisi, 1 m persegi = 10.000 cm persegi.)',a:[String(d[2])],e:d[0]+' m persegi = '+titikRibu(d[0]*10000)+' cm persegi. '+titikRibu(d[0]*10000)+' : '+d[1]+' = '+d[2]+' cm.',g:{k:'petak',n:10}};
};
GEN.rancangPP=function(){
  var p=rnd(8,20),l=rnd(3,12);
  return {t:'isi',q:'Kamu ingin merancang persegi panjang dengan luas tepat '+(p*l)+' cm persegi. Jika panjangnya kamu tetapkan '+p+' cm, berapa lebar yang dibutuhkan (cm)?',a:[String(l)],e:'Lebar = '+(p*l)+' : '+p+' = '+l+'.',g:{k:'gabungan',jenis:'pp',p:p,l:l,lab:{p:p+' cm',l:'?',isi:'luas '+(p*l)}}};
};
GEN.rancangSeg=function(){
  var a=rnd(5,16),t=rnd(3,12);
  if((a*t)%2)t++;
  return {t:'isi',q:'Kamu ingin merancang segitiga dengan luas tepat '+(a*t/2)+' cm persegi. Jika alasnya kamu tetapkan '+a+' cm, berapa tinggi yang dibutuhkan (cm)?',a:[String(t)],e:'Tinggi = (2 x '+(a*t/2)+') : '+a+' = '+t+'.',g:{k:'gabungan',jenis:'tri',a:a,t:t,lab:{a:a+' cm',t:'?'}}};
};
`

export const DATA_AC27: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Menentukan ukuran dari luas berarti mencari ukuran yang belum diketahui jika luas dan ukuran lain diketahui.', true, 'Itu kebalikan dari mencari luas.'),
    bs('Lebar persegi panjang = luas : panjang.', true, '48 : 8 = 6.', gabungan('pp', { p: 8, l: 6 }, { p: '8 cm', l: '? cm', isi: 'luas 48' })),
    bs('Lebar persegi panjang = luas × panjang.', false, 'Kebalikan dari kali adalah bagi.', gabungan('pp', { p: 8, l: 6 }, { p: '8 cm', l: '? cm', isi: 'luas 48' })),
    bs('Sisi persegi dicari dengan akar kuadrat dari luasnya.', true, 'Luas 81 cm² berarti sisi 9 cm.', petak(9)),
    bs('Sisi persegi dicari dengan membagi luasnya dengan 2.', false, 'Luas 36 cm² berarti sisi 6 cm, bukan 18.', petak(6)),
    bs('Alas segitiga = (2 × luas) : tinggi.', true, 'Dua segitiga membentuk persegi panjang.', gabungan('tri', { a: 10, t: 5 }, { a: '? cm', t: '5 cm' })),
    bs('Alas segitiga = luas : tinggi saja.', false, 'Harus mengalikan luas dengan 2 dulu.', gabungan('tri', { a: 10, t: 5 }, { a: '? cm', t: '5 cm' })),
    bs('1 meter persegi sama dengan 10.000 cm persegi.', true, '100 cm × 100 cm = 10.000 cm².', petak(10)),
    bs('1 meter persegi sama dengan 100 cm persegi.', false, 'Luas adalah satuan panjang dipangkatkan dua: 100 × 100.', petak(10)),
    bs('Satuan luas dan satuan sisi harus disamakan dulu sebelum menghitung ukuran dari luas.', true, '2 m² dan 200 cm: ubah 2 m² menjadi 20.000 cm².'),
    bs('Jika satuan luas dan sisi sudah sama, tidak perlu konversi tambahan.', true, 'Misalnya cm² dan cm.'),
    bs('Operasi kebalikan dari perkalian adalah pembagian.', true, 'Itulah sebabnya luas dibagi ukuran yang diketahui.'),
    bs('Untuk persegi panjang, cukup membagi luas dengan ukuran yang diketahui.', true, 'Tidak perlu langkah tambahan jika satuannya sama.'),
    bs('Untuk segitiga, cukup membagi luas dengan ukuran yang diketahui.', false, 'Segitiga memakai ½, jadi luas dikali 2 dulu.'),
    bs('Memeriksa hasil dilakukan dengan memasukkan kembali ukuran ke rumus luas dan membandingkannya.', true, '6 × 8 = 48.'),
    bs('Satuan boleh dihilangkan dari jawaban ukuran karena angkanya sudah benar.', false, 'Jawaban sebaiknya memakai satuan, misalnya 7 cm.'),
  ],
  debat: [
    debat('Rian dan Wati mencari lebar persegi panjang berluas 54 cm² dan panjang 6 cm.', ['Rian: "54 × 6 = 324 cm."', 'Wati: "54 : 6 = 9 cm."'], 1, 'Operasi kebalikan dari kali adalah bagi.', gabungan('pp', { p: 6, l: 9 }, { p: '6 cm', l: '? cm', isi: 'luas 54' })),
    debat('Wati dan Dedi mencari sisi persegi berluas 36 cm².', ['Wati: "36 : 2 = 18 cm."', 'Dedi: "6 cm, karena 6 × 6 = 36."'], 1, 'Sisi persegi adalah akar kuadrat dari luas.', petak(6)),
    debat('Made dan Sinta mencari alas segitiga berluas 20 cm² dan tinggi 5 cm.', ['Made: "20 : 5 = 4 cm."', 'Sinta: "(2 × 20) : 5 = 8 cm."'], 1, 'Luas segitiga = ½ × alas × tinggi.', gabungan('tri', { a: 8, t: 5 }, { a: '? cm', t: '5 cm' })),
    debat('Sinta dan Dedi membahas ruangan berluas 2 m² dan sisi 200 cm.', ['Sinta: "2 : 200 = 0,01."', 'Dedi: "20.000 : 200 = 100 cm."'], 1, 'Samakan satuan luas dulu.'),
    debat('Kiki dan Eka membahas persegi panjang dan segitiga.', ['Kiki: "Keduanya cukup luas dibagi ukuran yang diketahui."', 'Eka: "Segitiga perlu luas dikali 2 dulu."'], 1, 'Persegi panjang cukup dibagi, segitiga perlu ×2.'),
    debat('Fajar dan Gita memeriksa lebar 7 cm untuk luas 56 cm² dan panjang 8 cm.', ['Fajar: "8 × 7 = 56, benar."', 'Gita: "Salah, harus 8 + 7."'], 0, 'Periksa dengan rumus luas.', gabungan('pp', { p: 8, l: 7 }, { p: '8 cm', l: '7 cm', isi: 'luas 56' })),
  ],
  bank: [
    isi('Luas persegi panjang 48 cm², panjangnya 8 cm. Berapa lebarnya (cm)?', '6', '48 : 8 = 6.', gabungan('pp', { p: 8, l: 6 }, { p: '8 cm', l: '? cm', isi: 'luas 48' })),
    isi('Luas persegi panjang 90 cm², lebarnya 6 cm. Berapa panjangnya (cm)?', '15', '90 : 6 = 15.', gabungan('pp', { p: 15, l: 6 }, { p: '? cm', l: '6 cm', isi: 'luas 90' })),
    isi('Luas persegi panjang 72 cm², lebarnya 8 cm. Berapa panjangnya?', '9', '72 : 8 = 9.'),
    isi('Taman persegi panjang luasnya 120 m², panjang 15 m. Berapa lebarnya (m)?', '8', '120 : 15 = 8.'),
    isi('Taman persegi panjang luasnya 96 m², panjang 12 m. Berapa lebarnya (m)?', '8', '96 : 12 = 8.'),
    isi('Luas persegi 81 cm². Berapa sisinya (cm)?', '9', '9 × 9 = 81.', petak(9)),
    isi('Luas persegi 64 cm². Berapa sisinya (cm)?', '8', '8 × 8 = 64.', petak(8)),
    isi('Luas persegi 49 cm². Berapa sisinya (cm)?', '7', '7 × 7 = 49.', petak(7)),
    isi('Luas persegi 100 cm². Berapa sisinya (cm)?', '10', '10 × 10 = 100.', petak(10)),
    isi('Kamu merancang persegi berluas 144 cm². Berapa sisinya (cm)?', '12', '12 × 12 = 144.', petak(12)),
    isi('Luas segitiga 24 cm², alas 8 cm. Berapa tingginya (cm)?', '6', '(2 × 24) : 8 = 6.', gabungan('tri', { a: 8, t: 6 }, { a: '8 cm', t: '? cm' })),
    isi('Luas segitiga 36 cm², alas 12 cm. Berapa tingginya (cm)?', '6', '(2 × 36) : 12 = 6.'),
    isi('Luas segitiga 32 cm², alas 8 cm. Berapa tingginya (cm)?', '8', '(2 × 32) : 8 = 8.'),
    isi('Luas segitiga 50 cm², tinggi 10 cm. Berapa alasnya (cm)?', '10', '(2 × 50) : 10 = 10.'),
    isi('Luas segitiga 42 cm², alas 7 cm. Berapa tingginya (cm)?', '12', '(2 × 42) : 7 = 12.'),
    isi('Ruangan luasnya 2 m², salah satu sisi 200 cm. Berapa sisi lainnya (cm)?', '100', '20.000 : 200 = 100.', petak(10)),
    isi('Ruangan luasnya 6 m², salah satu sisi 300 cm. Berapa sisi lainnya (cm)?', '200', '60.000 : 300 = 200.', petak(10)),
    isi('Ruangan luasnya 4 m², salah satu sisi 160 cm. Berapa sisi lainnya (cm)?', '250', '40.000 : 160 = 250.'),
    isi('Persegi panjang luasnya 1 m² dan panjangnya 100 cm. Berapa lebarnya (cm)?', '100', '10.000 : 100 = 100.'),
    isi('Kamu merancang bendera segitiga berluas 150 cm² dengan tinggi 20 cm. Berapa alasnya (cm)?', '15', '(2 × 150) : 20 = 15.'),
    isi('Kamu merancang persegi panjang berluas 96 cm² dengan panjang 16 cm. Berapa lebarnya?', '6', '96 : 16 = 6.'),
    isi('Segitiga berluas 98 cm² dengan alas sama panjang dengan tinggi. Berapa alasnya (cm)?', '14', 'alas × alas = 196, jadi 14.'),
    pg('Kamu merancang segitiga berluas 60 cm² dengan alas 15 cm. Berapa tingginya?', ['8', '4', '900', '40'], 0, '(2 × 60) : 15 = 8.'),
    pg('Luas segitiga 45 cm², tinggi 9 cm. Berapa alasnya?', ['10', '5', '405', '90'], 0, '(2 × 45) : 9 = 10.'),
    pg('Luas persegi panjang 84 m². Kiki membagi 84 dengan panjang 12 m dan mendapat lebar 7 m. Cara memeriksa yang benar adalah...', ['12 × 7 = 84', '12 + 7 = 19', '84 − 12 = 72'], 0, 'Masukkan kembali ke rumus luas.'),
    pg('Made mencari alas segitiga berluas 16 cm², tinggi 4 cm dengan 16 : 4 = 4. Apa kesalahannya?', ['Lupa mengalikan luas dengan 2 dulu; alas yang benar 8 cm', 'Tidak ada kesalahan', 'Seharusnya dikali'], 0, '(2 × 16) : 4 = 8.'),
    pg('Rian mencari lebar berluas 54 cm² dan panjang 6 cm dengan 54 × 6. Apa kesalahannya?', ['Operasi kebalikan dari kali adalah bagi; lebar 9 cm', 'Tidak ada kesalahan', 'Seharusnya dijumlah'], 0, '54 : 6 = 9.'),
    pg('Sinta langsung membagi 2 dengan 200 untuk ruangan berluas 2 m² dan sisi 200 cm. Apa kesalahannya?', ['Satuan belum disamakan; seharusnya 20.000 : 200 = 100 cm', 'Tidak ada kesalahan', 'Seharusnya 2 × 200'], 0, 'Ubah m² ke cm² dulu.'),
    pg('Manakah pasangan (panjang, lebar) yang luasnya tepat 60 cm²?', ['panjang 12, lebar 5', 'panjang 8, lebar 8', 'panjang 20, lebar 2', 'panjang 9, lebar 6'], 0, '12 × 5 = 60.'),
    pg('Made: "Untuk bangun apa pun, luas selalu cukup dibagi ukuran yang diketahui." Benarkah?', ['Salah. Persegi memakai akar, segitiga dikali 2 dulu', 'Benar untuk semua bangun'], 0, 'Setiap bangun punya rumus kebalikan sendiri.'),
    pg('Wati: "Mengalikan luas dengan 2 hanya perlu untuk segitiga." Benarkah?', ['Benar, karena rumus segitiga memakai ½', 'Salah, semua bangun perlu ×2'], 0, 'Persegi panjang tidak memakai ½.'),
    gen('lebar'),
    gen('lebar'),
    gen('sisi'),
    gen('tinggi'),
    gen('tinggi'),
    gen('satuan'),
    gen('satuan'),
    gen('rancangPP'),
    gen('rancangSeg'),
  ],
}
