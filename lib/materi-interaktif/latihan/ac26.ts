import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { gabungan } from '../gambar'

/**
 * Bahan latihan AC-26 (Luas dan keliling bangun datar gabungan: persegi
 * panjang dan segitiga).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * arti bangun gabungan, rumus luas segitiga (setengah x alas x tinggi) dan
 * tinggi yang tegak lurus alas, membagi bangun menjadi bangun sederhana
 * (rumah, trapesium, layang-layang dari dua segitiga, anak panah), luas total
 * = jumlah luas bagian, keliling = garis terluar (sisi yang menyatu tidak
 * dihitung; keliling penuh dikurangi dua kali sisi menyatu), sisi menyatu tetap
 * bagian luas, cerita (taman, kolam, rumah, layang-layang), memeriksa dengan
 * menjumlahkan ulang, rancang (cari luas atap, tinggi, atau tinggi bawah
 * layang-layang), dan sifat (menambah bagian tidak mengurangi luas; membagi
 * dengan cara lain tetap memberi luas sama). Salah paham: p x l langsung,
 * keliling penuh dijumlah, sisi miring sebagai tinggi, luas dikali, rumus
 * keliling dikurangi satu kali, dan menambah segitiga selalu menambah keliling
 * (tidak selalu).
 *
 * Jawaban angka ditulis tanpa satuan; desimal dengan koma (titik dibuang).
 *
 * `GEN.segitiga` luas segitiga, `GEN.rumahLuas` luas total rumah (persegi
 * panjang + atap), `GEN.samping` luas total persegi panjang + segitiga di
 * sisi lebar, `GEN.rumahKel` keliling rumah, `GEN.cariAtap` luas atap dari
 * luas total, `GEN.cariTinggi` tinggi atap dari luas atap.
 */
const JS = String.raw`
GEN.segitiga=function(){
  var a=rnd(4,14),t=rnd(3,12);
  if((a*t)%2)t++;
  return {t:'isi',q:'Sebuah segitiga memiliki alas '+a+' cm dan tinggi '+t+' cm. Berapa luas segitiga tersebut (cm persegi)?',a:[String(a*t/2)],e:'Luas = 1/2 x '+a+' x '+t+' = '+(a*t/2)+' cm persegi.',g:{k:'gabungan',jenis:'tri',a:a,t:t,lab:{a:a+' cm',t:t+' cm'}}};
};
GEN.rumahLuas=function(){
  var p=rnd(6,14),l=rnd(4,10),t=rnd(2,7);
  if((p*t)%2)t++;
  return {t:'isi',q:'Sebuah bangun berbentuk rumah: persegi panjang (panjang '+p+' cm, lebar '+l+' cm) dengan atap segitiga (alas '+p+' cm, tinggi '+t+' cm). Berapa luas total bangun tersebut (cm persegi)?',a:[String(p*l+p*t/2)],e:'Persegi panjang '+p+' x '+l+' = '+(p*l)+', segitiga 1/2 x '+p+' x '+t+' = '+(p*t/2)+'. Jumlah: '+(p*l+p*t/2)+'.',g:{k:'gabungan',jenis:'rumah',p:p,l:l,t:t,lab:{p:p+' cm',l:l+' cm',t:t+' cm'},pisah:true}};
};
GEN.samping=function(){
  var p=rnd(6,14),l=rnd(4,10),t=rnd(2,8);
  if((l*t)%2)t++;
  return {t:'isi',q:'Sebuah bangun gabungan terdiri dari persegi panjang (panjang '+p+' cm, lebar '+l+' cm) dan segitiga (alas '+l+' cm, tinggi '+t+' cm) yang menempel pada salah satu sisi lebarnya. Berapa luas total (cm persegi)?',a:[String(p*l+l*t/2)],e:p+' x '+l+' = '+(p*l)+' dan 1/2 x '+l+' x '+t+' = '+(l*t/2)+'. Jumlah: '+(p*l+l*t/2)+'.',g:{k:'gabungan',jenis:'samping',p:p,l:l,t:t,lab:{p:p+' cm',l:l+' cm',t:t+' cm'},pisah:true}};
};
GEN.rumahKel=function(){
  var p=rnd(6,12),l=rnd(4,9),m=rnd(5,9);
  return {t:'isi',q:'Sebuah bangun berbentuk rumah: persegi panjang (panjang '+p+' cm, lebar '+l+' cm) dengan atap segitiga sama kaki (alas '+p+' cm, dua sisi miring masing-masing '+m+' cm). Berapa keliling total bangun tersebut (cm)? (Ingat: sisi yang menyatu tidak dihitung.)',a:[String(2*l+p+2*m)],e:'Keliling = '+l+' + '+l+' + '+p+' + '+m+' + '+m+' = '+(2*l+p+2*m)+'. Sisi atas persegi panjang dan alas segitiga tidak dihitung.',g:{k:'gabungan',jenis:'rumah',p:p,l:l,t:Math.round(Math.sqrt(Math.max(m*m-p*p/4,4))*10)/10,lab:{p:p+' cm',l:l+' cm',m:m+' cm'},pisah:true}};
};
GEN.cariAtap=function(){
  var p=rnd(6,12),l=rnd(5,10),ta=rnd(2,6)*2,at=p*ta/2;
  return {t:'isi',q:'Kamu merancang bangun rumah dengan luas total tepat '+(p*l+at)+' cm persegi. Bagian persegi panjang berukuran '+p+' cm x '+l+' cm. Berapa luas atap segitiga yang harus ditambahkan (cm persegi)?',a:[String(at)],e:(p*l+at)+' - '+(p*l)+' = '+at+' cm persegi.',g:{k:'gabungan',jenis:'rumah',p:p,l:l,t:ta,lab:{p:p+' cm',l:l+' cm',t:'?'},pisah:true}};
};
GEN.cariTinggi=function(){
  var a=rnd(3,8)*2,ta=rnd(3,9),at=a*ta/2;
  return {t:'isi',q:'Atap segitiga memiliki luas '+at+' cm persegi dan alas '+a+' cm. Berapa tinggi atap tersebut (cm)?',a:[String(ta)],e:'1/2 x '+a+' x t = '+at+', jadi t = '+(at*2)+' : '+a+' = '+ta+'.',g:{k:'gabungan',jenis:'tri',a:a,t:ta,lab:{a:a+' cm',t:'?'}}};
};
`

export const DATA_AC26: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Bangun datar gabungan terbentuk dari dua atau lebih bangun datar sederhana yang digabung.', true, 'Misalnya rumah: persegi panjang dan segitiga.', gabungan('rumah', { p: 10, l: 6, t: 4 }, { p: '10 cm', l: '6 cm', t: '4 cm' }, { pisah: true })),
    bs('Luas segitiga = ½ × alas × tinggi.', true, 'Segitiga adalah setengah persegi panjang beralas dan bertinggi sama.', gabungan('tri', { a: 8, t: 5 }, { a: '8 cm', t: '5 cm' })),
    bs('Segitiga beralas 8 cm dan tinggi 5 cm memiliki luas 20 cm persegi.', true, '½ × 8 × 5 = 20.', gabungan('tri', { a: 8, t: 5 }, { a: '8 cm', t: '5 cm' })),
    bs('Tinggi segitiga adalah panjang sisi miringnya.', false, 'Tinggi diukur tegak lurus terhadap alas.', gabungan('tri', { a: 6, t: 8 }, { a: '6 cm', t: '8 cm', m: '10 cm' })),
    bs('Segitiga beralas 6 cm, tinggi 8 cm, sisi miring 10 cm memiliki luas 30 cm persegi.', false, 'Pakai tinggi 8: ½ × 6 × 8 = 24.', gabungan('tri', { a: 6, t: 8 }, { a: '6 cm', t: '8 cm', m: '10 cm' })),
    bs('Langkah pertama menghitung luas bangun gabungan adalah membaginya menjadi bangun sederhana.', true, 'Lalu hitung tiap bagian dan jumlahkan.'),
    bs('Luas bangun tidak beraturan boleh langsung dihitung dengan panjang terpanjang × lebar terlebar.', false, 'Rumus p × l hanya untuk persegi panjang.'),
    bs('Luas total bangun gabungan adalah jumlah luas bagian-bagiannya.', true, '49 + 14 = 63.', gabungan('rumah', { p: 7, l: 7, t: 4 }, { p: '7 cm', l: '7 cm', t: '4 cm' }, { pisah: true })),
    bs('Luas total bangun gabungan dihitung dengan mengalikan luas kedua bagiannya.', false, 'Luas ditambahkan, bukan dikali.'),
    bs('Membagi bangun gabungan dengan cara berbeda tetap memberi luas total yang sama.', true, 'Luas total tidak bergantung pada cara membagi.'),
    bs('Keliling bangun gabungan dihitung dengan menelusuri garis terluarnya.', true, 'Sisi yang menyatu ada di dalam bangun.'),
    bs('Keliling bangun gabungan sama dengan jumlah keliling penuh kedua bangun penyusunnya.', false, 'Sisi yang menyatu terhitung dua kali dan tidak seharusnya dihitung.'),
    bs('Keliling gabungan = jumlah keliling kedua bangun dikurangi DUA kali sisi yang menyatu.', true, 'Sisi menyatu ada di kedua keliling, dan keduanya harus dibuang.'),
    bs('Sisi yang menyatu tetap ikut menjadi bagian dari LUAS bangun gabungan.', true, 'Luas adalah isi bangun, bukan hanya tepi.'),
    bs('Menambah segitiga tanpa tumpang tindih tidak pernah mengurangi luas total.', true, 'Luas total bertambah atau tetap.'),
    bs('Menambah segitiga pada sebuah sisi SELALU menambah keliling total.', false, 'Bila sisi baru lebih pendek dari sisi yang tertutup, keliling bisa berkurang.'),
    bs('Cara memeriksa luas gabungan adalah menjumlahkan lagi luas tiap bagiannya.', true, 'Cocokkan dengan luas total.'),
  ],
  debat: [
    debat('Rian dan Wati menghitung luas segitiga beralas 6 cm, tinggi 8 cm, sisi miring 10 cm.', ['Rian: "½ × 6 × 10 = 30."', 'Wati: "½ × 6 × 8 = 24, tinggi harus tegak lurus."'], 1, 'Sisi miring bukan tinggi.', gabungan('tri', { a: 6, t: 8 }, { a: '6 cm', t: '8 cm', m: '10 cm' })),
    debat('Dedi dan Sinta menghitung luas rumah: persegi panjang 60 cm² dan atap 20 cm².', ['Dedi: "60 × 20 = 1.200."', 'Sinta: "60 + 20 = 80."'], 1, 'Luas bagian dijumlahkan.', gabungan('rumah', { p: 10, l: 6, t: 4 }, { p: '10 cm', l: '6 cm', t: '4 cm' }, { pisah: true })),
    debat('Made dan Kiki menghitung keliling rumah (persegi panjang 10 × 6, atap sisi miring 7).', ['Made: "Jumlahkan keliling penuh: 32 + 24 = 56."', 'Kiki: "36, karena sisi menyatu tidak dihitung."'], 1, '56 − 2 × 10 = 36.', gabungan('rumah', { p: 10, l: 6, t: 5 }, { p: '10 cm', l: '6 cm', m: '7 cm' }, { pisah: true })),
    debat('Eka dan Fajar membahas bangun tidak beraturan.', ['Eka: "Kalikan panjang terpanjang dan lebar terlebar."', 'Fajar: "Bagi dulu menjadi bangun sederhana."'], 1, 'Rumus p × l hanya untuk persegi panjang.'),
    debat('Gita dan Hadi membahas layang-layang dari dua segitiga (alas 8, tinggi 3 dan 6).', ['Gita: "½ × 8 × 3 + ½ × 8 × 6 = 36."', 'Hadi: "8 × 3 × 6 = 144."'], 0, 'Dua luas segitiga dijumlahkan.', gabungan('layang', { a: 8, t: 3, t2: 6 }, { a: '8 cm', t: '3 cm', t2: '6 cm' })),
    debat('Ira dan Joni membahas cara membagi bangun.', ['Ira: "Cara membagi berbeda bisa memberi luas total berbeda."', 'Joni: "Luas total tetap sama."'], 1, 'Selama seluruh bangun tercakup tanpa tumpang tindih.'),
  ],
  bank: [
    isi('Sebuah segitiga beralas 8 cm dan tinggi 5 cm. Berapa luasnya (cm persegi)?', '20', '½ × 8 × 5 = 20.', gabungan('tri', { a: 8, t: 5 }, { a: '8 cm', t: '5 cm' })),
    isi('Sebuah segitiga beralas 10 cm dan tinggi 6 cm. Berapa luasnya?', '30', '½ × 10 × 6 = 30.', gabungan('tri', { a: 10, t: 6 }, { a: '10 cm', t: '6 cm' })),
    isi('Sebuah segitiga beralas 9 cm dan tinggi 8 cm. Berapa luasnya?', '36', '½ × 9 × 8 = 36.', gabungan('tri', { a: 9, t: 8 }, { a: '9 cm', t: '8 cm' })),
    isi('Segitiga beralas 6 cm, sisi miring 10 cm, tinggi 8 cm. Berapa luasnya?', '24', '½ × 6 × 8 = 24.', gabungan('tri', { a: 6, t: 8 }, { a: '6 cm', t: '8 cm', m: '10 cm' })),
    isi('Persegi sisi 5 cm dengan segitiga (alas 5 cm, tinggi 4 cm) menempel di satu sisinya. Berapa luas total?', '35', '25 + 10 = 35.', gabungan('rumah', { p: 5, l: 5, t: 4 }, { p: '5 cm', l: '5 cm', t: '4 cm' }, { pisah: true })),
    isi('Persegi sisi 7 cm dengan segitiga (alas 7 cm, tinggi 4 cm). Berapa luas total?', '63', '49 + 14 = 63.', gabungan('rumah', { p: 7, l: 7, t: 4 }, { p: '7 cm', l: '7 cm', t: '4 cm' }, { pisah: true })),
    isi('Persegi panjang 9 × 4 cm dengan segitiga (alas 4 cm, tinggi 3 cm) di sisi lebarnya. Berapa luas total?', '42', '36 + 6 = 42.', gabungan('samping', { p: 9, l: 4, t: 3 }, { p: '9 cm', l: '4 cm', t: '3 cm' }, { pisah: true })),
    isi('Rumah: persegi panjang 12 × 7 cm dan atap segitiga alas 12 cm, tinggi 4 cm. Berapa luas total?', '108', '84 + 24 = 108.', gabungan('rumah', { p: 12, l: 7, t: 4 }, { p: '12 cm', l: '7 cm', t: '4 cm' }, { pisah: true })),
    isi('Persegi 6 cm dan segitiga sama kaki di ujungnya (alas 6 cm, tinggi 4 cm). Berapa luas total?', '48', '36 + 12 = 48.', gabungan('samping', { p: 6, l: 6, t: 4 }, { p: '6 cm', l: '6 cm', t: '4 cm' }, { pisah: true })),
    isi('Layang-layang dari dua segitiga beralas 8 cm; tinggi atas 3 cm, tinggi bawah 6 cm. Berapa luas total?', '36', '12 + 24 = 36.', gabungan('layang', { a: 8, t: 3, t2: 6 }, { a: '8 cm', t: '3 cm', t2: '6 cm' })),
    isi('Rumah: persegi panjang 8 × 5 cm, atap sama kaki alas 8 cm, sisi miring 6 cm. Berapa keliling total (cm)?', '30', '5 + 5 + 8 + 6 + 6 = 30.', gabungan('rumah', { p: 8, l: 5, t: 4.5 }, { p: '8 cm', l: '5 cm', m: '6 cm' }, { pisah: true })),
    isi('Sisi-sisi sebuah bangun datar 5 cm, 6 cm, 7 cm, dan 8 cm. Berapa kelilingnya?', '26', '5 + 6 + 7 + 8 = 26.'),
    isi('Rumah bergaris persegi panjang 10 × 6 cm, atap sisi miring 7 cm tiap sisi, alas 10 cm. Berapa keliling total (cm)?', '36', '6 + 6 + 10 + 7 + 7 = 36.', gabungan('rumah', { p: 10, l: 6, t: 5 }, { p: '10 cm', l: '6 cm', m: '7 cm' }, { pisah: true })),
    isi('Kamu merancang rumah dengan luas total 130 cm persegi. Persegi panjangnya 10 × 10 cm. Berapa luas atap yang ditambahkan?', '30', '130 − 100 = 30.'),
    isi('Atap luasnya 30 cm persegi, alasnya 10 cm. Berapa tinggi atap?', '6', '½ × 10 × t = 30, t = 6.'),
    isi('Rumah dirancang luas total 150 cm persegi, persegi panjangnya 12 × 10 cm. Berapa luas atap?', '30', '150 − 120 = 30.'),
    isi('Taman luas total 96 m², bagian persegi panjang 72 m², alas segitiga 8 m. Berapa tinggi segitiga (m)?', '6', 'Luas segitiga 24, ½ × 8 × t = 24, t = 6.'),
    isi('Layang-layang dua segitiga beralas 14 cm; tinggi atas 3 cm; luas total 84 cm². Berapa tinggi segitiga bawah (cm)?', '9', '21 + ½ × 14 × t = 84, t = 9.', gabungan('layang', { a: 14, t: 3, t2: 9 }, { a: '14 cm', t: '3 cm', t2: '?' })),
    pg('Langkah PERTAMA menghitung luas bangun gabungan adalah...', ['membagi menjadi bangun sederhana', 'langsung mengalikan semua sisi', 'menjumlahkan semua sisi'], 0, 'Bagi dulu agar rumus luasnya diketahui.'),
    pg('Sinta menjumlahkan keliling penuh kedua bangun, termasuk sisi yang menyatu. Apa kesalahannya?', ['Sisi yang menyatu bukan batas terluar, sehingga harus dibuang (dua kali)', 'Tidak ada kesalahan', 'Seharusnya dikalikan'], 0, 'Kurangi dua kali sisi menyatu.'),
    pg('Wati memakai sisi miring sebagai tinggi segitiga. Apa kesalahannya?', ['Tinggi harus tegak lurus alas, bukan sisi miring', 'Tinggi memang sisi miring', 'Seharusnya memakai alas'], 0, 'Tinggi tegak lurus alas.', gabungan('tri', { a: 6, t: 8 }, { a: '6 cm', t: '8 cm', m: '10 cm' })),
    pg('Dedi mengalikan luas persegi panjang dan luas segitiga. Apa kesalahannya?', ['Luas total adalah jumlahnya, bukan hasil kali', 'Tidak ada kesalahan', 'Seharusnya dikurangi'], 0, 'Luas bagian dijumlahkan.'),
    pg('Taman gabungan persegi panjang 12 × 6 m dan segitiga (alas 6 m, tinggi 4 m). Berapa luas total (m persegi)?', ['84', '72', '78', '96'], 0, '72 + 12 = 84.', gabungan('samping', { p: 12, l: 6, t: 4 }, { p: '12 m', l: '6 m', t: '4 m' }, { pisah: true })),
    pg('Manakah bangun yang termasuk bangun gabungan dengan segitiga sebagai salah satu bagiannya?', ['rumah: persegi panjang dengan atap segitiga', 'lingkaran', 'persegi biasa'], 0, 'Rumah terdiri dari persegi panjang dan segitiga.'),
    pg('Made: "Luas gabungan selalu bisa dijumlah tanpa mengurangi apa pun asal tidak tumpang tindih." Benarkah?', ['Benar', 'Salah, harus dikurangi sisi menyatu'], 0, 'Luas bagian yang tidak tumpang tindih cukup dijumlahkan.'),
    pg('Rian: "Keliling gabungan = keliling A + keliling B dikurangi SATU kali sisi menyatu." Benarkah?', ['Salah, harus dua kali', 'Benar'], 0, 'Sisi menyatu muncul di kedua keliling.'),
    gen('segitiga'),
    gen('segitiga'),
    gen('rumahLuas'),
    gen('rumahLuas'),
    gen('samping'),
    gen('rumahKel'),
    gen('rumahKel'),
    gen('cariAtap'),
    gen('cariTinggi'),
  ],
}
