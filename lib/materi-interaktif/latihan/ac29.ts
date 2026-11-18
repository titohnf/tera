import { bs, debat, gen, isi, kata, pg, type DataMateri } from '../bersama'
import { sudut } from '../gambar'

/**
 * Bahan latihan AC-29 (Sudut: jenis, pengukuran, dan hubungan antar sudut).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * jenis sudut (lancip, siku-siku, tumpul, lurus, refleks), derajat dan busur
 * derajat, jumlah sudut segitiga (180) dan segiempat (360, dua segitiga),
 * sudut berpenyiku (90) dan berpelurus (180), bertolak belakang (sama besar),
 * sudut di sekitar titik (360) dan di satu sisi garis lurus (180), cerita
 * (jarum jam, tangga, tanjakan), rancang (sudut ketiga atau keempat, tanjakan,
 * perpotongan). Salah paham: kaki lebih panjang berarti sudut lebih besar,
 * membaca skala yang salah (130 bukan 50), menilai dengan mata (88 dikira
 * siku-siku, 95 dikira lancip), keempat sudut perpotongan sama, bersebelahan
 * sama besar, berpenyiku selalu sama, jumlah segiempat 180, bertolak belakang
 * berjumlah 180.
 *
 * Jawaban angka ditulis tanpa tanda derajat; jenis sudut dengan satu kata.
 *
 * `GEN.pelurus`, `GEN.penyiku` (sudut pasangan), `GEN.segitiga` (sudut ketiga),
 * `GEN.segiempat` (sudut keempat), `GEN.putaran` (sudut ketiga di sekitar titik
 * atau satu sisi garis), `GEN.jenis` (nama jenis sudut), `GEN.tolak` (sudut
 * bertolak belakang dari sudut bersebelahan).
 */
const JS = String.raw`
function jenisH(d){return d<90?'lancip':(d===90?'siku-siku':(d<180?'tumpul':(d===180?'lurus':'refleks')))}
GEN.pelurus=function(){
  var a=rnd(20,160);
  while(a===90)a=rnd(20,160);
  return {t:'isi',q:'Dua sudut saling berpelurus (jumlahnya 180 derajat). Jika salah satu sudut '+a+' derajat, berapa derajat sudut yang satunya?',a:[String(180-a)],e:'180 - '+a+' = '+(180-a)+'.',g:{k:'sudut',mode:'pelurus',deg:a,labA:a+'°',labB:'?'}};
};
GEN.penyiku=function(){
  var a=rnd(10,80);
  while(a===45)a=rnd(10,80);
  return {t:'isi',q:'Dua sudut saling berpenyiku (jumlahnya 90 derajat). Jika salah satu sudut '+a+' derajat, berapa derajat sudut yang satunya?',a:[String(90-a)],e:'90 - '+a+' = '+(90-a)+'.',g:{k:'sudut',mode:'penyiku',deg:a,labA:a+'°',labB:'?'}};
};
GEN.segitiga=function(){
  var a=rnd(20,100),b=rnd(20,150-a>20?150-a:30);
  if(a+b>=170)b=20;
  return {t:'isi',q:'Sebuah segitiga memiliki dua sudut '+a+' derajat dan '+b+' derajat. Berapa derajat sudut ketiganya?',a:[String(180-a-b)],e:'180 - '+a+' - '+b+' = '+(180-a-b)+'.',g:{k:'sudut',mode:'segitiga',a:a,b:b,labA:a+'°',labB:b+'°',labC:'?'}};
};
GEN.segiempat=function(){
  var a=rnd(70,110),b=rnd(70,110),c=rnd(70,110);
  return {t:'isi',q:'Sebuah segiempat memiliki tiga sudut '+a+' derajat, '+b+' derajat, dan '+c+' derajat. Berapa derajat sudut keempatnya?',a:[String(360-a-b-c)],e:'360 - '+(a+b+c)+' = '+(360-a-b-c)+'. Segiempat = dua segitiga = 360.',g:{k:'sudut',mode:'segiempat',labA:a+'°',labB:b+'°',labC:c+'°',labD:'?'}};
};
GEN.putaran=function(){
  var tot=rnd(0,1)===0?360:180,a=rnd(30,tot===360?150:70),b=rnd(30,tot===360?150:70),c=tot-a-b;
  if(c<20)return GEN.putaran();
  var q=tot===360?'Tiga sudut mengelilingi satu titik penuh. Jika sudut pertama '+a+' derajat dan sudut kedua '+b+' derajat, berapa derajat sudut ketiga?':'Tiga sudut berada pada satu sisi garis lurus. Jika sudut pertama '+a+' derajat dan sudut kedua '+b+' derajat, berapa derajat sudut ketiga?';
  return {t:'isi',q:q,a:[String(c)],e:tot+' - '+a+' - '+b+' = '+c+'.',g:{k:'sudut',mode:'putaran',sudut:[{v:a,l:a+'°'},{v:b,l:b+'°'},{v:c,l:'?'}]}};
};
GEN.jenis=function(){
  var d=[rnd(10,89),90,rnd(91,179),180,rnd(181,350)][rnd(0,4)];
  return {t:'isi',q:'Sebuah sudut besarnya '+d+' derajat. Termasuk jenis sudut apakah sudut ini? (jawab satu kata: lancip, siku-siku, tumpul, lurus, atau refleks)',a:[jenisH(d)],e:d+' derajat termasuk sudut '+jenisH(d)+'.',g:d<=180?{k:'sudut',mode:'busur',deg:d,lab:d+'°'}:null};
};
GEN.tolak=function(){
  var b=rnd(20,160);
  while(b===90)b=rnd(20,160);
  return {t:'isi',q:'Dua garis berpotongan. Sudut A bersebelahan dengan sudut B yang besarnya '+b+' derajat. Berapa derajat sudut C yang bertolak belakang dengan sudut A?',a:[String(180-b)],e:'A = 180 - '+b+' = '+(180-b)+'. C bertolak belakang dengan A, jadi C = '+(180-b)+'.',g:{k:'sudut',mode:'silang',deg:180-b,labA:'A',labB:'B='+b+'°',labC:'C=?',labD:'D'}};
};
`

export const DATA_AC29: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Sudut yang besarnya tepat 90 derajat disebut sudut siku-siku.', true, 'Seperti sudut pojok buku.', sudut('satu', { deg: 90, lab: '90°' })),
    bs('Sudut kurang dari 90 derajat disebut sudut lancip.', true, '40° adalah sudut lancip.', sudut('satu', { deg: 40, lab: '40°' })),
    bs('Sudut lebih dari 90 derajat dan kurang dari 180 derajat disebut sudut tumpul.', true, '95° adalah sudut tumpul.', sudut('satu', { deg: 95, lab: '95°' })),
    bs('Sudut 180 derajat disebut sudut lurus.', true, 'Kedua kakinya membentuk garis lurus.'),
    bs('Sudut lebih dari 180 derajat dan kurang dari 360 derajat disebut sudut refleks.', true, 'Misalnya 250°.'),
    bs('Besar sudut diukur dengan busur derajat dan dinyatakan dalam derajat.', true, 'Mulailah dari angka 0 pada garis dasar.', sudut('busur', { deg: 50, lab: '50°' })),
    bs('Sudut dengan kaki lebih panjang pasti lebih besar.', false, 'Besar sudut hanya bergantung pada putaran di antara kedua kaki.', sudut('satu', { deg: 50, kaki: 1, lab: '50°' })),
    bs('Sudut yang terlihat seperti siku-siku pasti tepat 90 derajat.', false, 'Mata bisa keliru; ukur dengan busur derajat. Bisa saja 88°.'),
    bs('Sudut 95 derajat termasuk sudut tumpul walaupun terlihat tidak terlalu besar.', true, '95° lebih dari 90°.'),
    bs('Jumlah ketiga sudut dalam sebarang segitiga adalah 180 derajat.', true, 'Berlaku untuk segitiga lancip, siku-siku, dan tumpul.', sudut('segitiga', { a: 50, b: 60, labA: '50°', labB: '60°', labC: '70°' })),
    bs('Jumlah keempat sudut dalam sebarang segiempat adalah 360 derajat.', true, 'Segiempat terdiri dari dua segitiga.', sudut('segiempat', { labA: '100°', labB: '85°', labC: '95°', labD: '80°', diagonal: true })),
    bs('Jumlah sudut segiempat adalah 180 derajat karena jumlah sudut segitiga 180 derajat.', false, 'Segiempat dibagi menjadi DUA segitiga: 360°.'),
    bs('Dua sudut berpenyiku berjumlah 90 derajat.', true, '35° dan 55°.', sudut('penyiku', { deg: 35, labA: '35°', labB: '55°' })),
    bs('Dua sudut berpelurus berjumlah 180 derajat.', true, '65° dan 115°.', sudut('pelurus', { deg: 65, labA: '65°', labB: '115°' })),
    bs('Dua sudut bertolak belakang selalu sama besar.', true, 'Pada dua garis berpotongan, sudut berhadapan sama.', sudut('silang', { deg: 72, labA: '72°', labB: '108°', labC: '72°', labD: '108°' })),
    bs('Keempat sudut hasil perpotongan dua garis selalu sama besar.', false, 'Hanya yang bertolak belakang. Yang bersebelahan berjumlah 180°.', sudut('silang', { deg: 72, labA: '72°', labB: '108°', labC: '72°', labD: '108°' })),
    bs('Sudut yang bersebelahan pada perpotongan dua garis selalu sama besar.', false, 'Mereka berpelurus: jumlahnya 180°.'),
    bs('Sudut yang mengelilingi satu titik penuh berjumlah 360 derajat.', true, 'Satu putaran penuh.', sudut('putaran', { sudut: [{ v: 120, l: '120°' }, { v: 150, l: '150°' }, { v: 90, l: '90°' }] })),
    bs('Dua sudut berpenyiku pasti sama besar.', false, 'Berpenyiku hanya berarti jumlahnya 90°, misalnya 35° dan 55°.'),
  ],
  debat: [
    debat('Made dan Wati membandingkan dua sudut 50° dengan kaki panjang dan pendek.', ['Made: "Yang berkaki panjang lebih besar."', 'Wati: "Sama besar, kaki tidak mengubah sudut."'], 1, 'Besar sudut adalah putaran di antara kaki.', sudut('satu', { deg: 50, lab: '50°' })),
    debat('Dedi dan Sinta membahas sudut 95°.', ['Dedi: "Lancip, kelihatannya kecil."', 'Sinta: "Tumpul, karena lebih dari 90°."'], 1, 'Gunakan ukuran, bukan mata.', sudut('satu', { deg: 95, lab: '95°' })),
    debat('Rian dan Kiki mengukur sudut lancip.', ['Rian: "Terbaca 130°."', 'Kiki: "Sudut lancip kurang dari 90°, bacaan benar 50° pada skala yang tepat."'], 1, 'Mulailah dari 0 pada kaki yang berimpit dengan garis dasar.', sudut('busur', { deg: 50 })),
    debat('Made dan Eka membahas dua garis berpotongan.', ['Made: "Keempat sudut selalu sama."', 'Eka: "Hanya sudut bertolak belakang yang sama."'], 1, 'Yang bersebelahan berjumlah 180°.', sudut('silang', { deg: 72, labA: '72°', labB: '108°', labC: '72°', labD: '108°' })),
    debat('Sinta dan Dedi membahas jumlah sudut segiempat.', ['Sinta: "180°, sama dengan segitiga."', 'Dedi: "360°, karena dua segitiga."'], 1, 'Diagonal membagi segiempat menjadi dua segitiga.', sudut('segiempat', { labA: '90°', labB: '90°', labC: '90°', labD: '90°', a: 90, diagonal: true })),
    debat('Dedi dan Fajar membahas sudut berpenyiku.', ['Dedi: "Karena bertolak belakang sama besar, berpenyiku juga selalu sama."', 'Fajar: "Berpenyiku hanya berjumlah 90°, tidak harus sama."'], 1, '35° dan 55° berpenyiku.'),
  ],
  bank: [
    kata('Sudut yang besarnya tepat 90 derajat disebut sudut ...', ['siku-siku'], '90° = siku-siku.'),
    kata('Sudut yang besarnya kurang dari 90 derajat disebut sudut ...', ['lancip'], 'Kurang dari 90° = lancip.'),
    kata('Sudut yang besarnya lebih dari 90 derajat tetapi kurang dari 180 derajat disebut sudut ...', ['tumpul'], 'Tumpul.'),
    kata('Sudut yang besarnya 180 derajat disebut sudut ...', ['lurus'], 'Lurus.'),
    kata('Sudut yang besarnya lebih dari 180 derajat dan kurang dari 360 derajat disebut sudut ...', ['refleks', 'reflek'], 'Refleks.'),
    kata('Alat untuk mengukur besar sudut dalam derajat adalah ...', ['busur derajat', 'busur'], 'Busur derajat.'),
    isi('Jumlah ketiga sudut dalam segitiga adalah ... derajat.', '180', 'Selalu 180°.'),
    isi('Jumlah keempat sudut dalam segiempat adalah ... derajat.', '360', 'Dua segitiga.'),
    isi('Sebuah sudut 40 derajat. Termasuk jenis sudut apakah? (satu kata)', ['lancip'], '40° < 90°.'),
    isi('Dua sudut berpelurus. Jika salah satu 65 derajat, berapa yang satunya?', '115', '180 - 65 = 115.', sudut('pelurus', { deg: 65, labA: '65°', labB: '?' })),
    isi('Dua sudut berpelurus. Jika salah satu 75 derajat, berapa yang satunya?', '105', '180 - 75 = 105.'),
    isi('Garis lurus dibagi dua sudut. Salah satunya 110 derajat. Berapa yang satunya?', '70', '180 - 110 = 70.'),
    isi('Dua sudut berpenyiku. Jika salah satu 35 derajat, berapa yang satunya?', '55', '90 - 35 = 55.', sudut('penyiku', { deg: 35, labA: '35°', labB: '?' })),
    isi('Dua sudut berpenyiku. Jika salah satu 42 derajat, berapa yang satunya?', '48', '90 - 42 = 48.'),
    isi('Segitiga memiliki dua sudut 50 dan 60 derajat. Berapa sudut ketiga?', '70', '180 - 110 = 70.', sudut('segitiga', { a: 50, b: 60, labA: '50°', labB: '60°', labC: '?' })),
    isi('Segitiga memiliki dua sudut 55 dan 65 derajat. Berapa sudut ketiga?', '60', '180 - 120 = 60.'),
    isi('Segitiga memiliki sudut 25 derajat dan 90 derajat. Berapa sudut ketiga?', '65', '180 - 115 = 65.'),
    isi('Segiempat memiliki tiga sudut 90, 90, dan 90 derajat. Berapa sudut keempat?', '90', '360 - 270 = 90.'),
    isi('Segiempat memiliki tiga sudut 80, 100, dan 90 derajat. Berapa sudut keempat?', '90', '360 - 270 = 90.'),
    isi('Segiempat memiliki tiga sudut 100, 85, dan 95 derajat. Berapa sudut keempat?', '80', '360 - 280 = 80.'),
    isi('Tiga sudut mengelilingi satu titik penuh: 120 dan 150 derajat, dan satu lagi. Berapa yang satu lagi?', '90', '360 - 270 = 90.', sudut('putaran', { sudut: [{ v: 120, l: '120°' }, { v: 150, l: '150°' }, { v: 90, l: '?' }] })),
    isi('Tiga sudut pada satu sisi garis lurus: 50 dan 80 derajat, dan satu lagi. Berapa yang satu lagi?', '50', '180 - 130 = 50.'),
    isi('Rancang segitiga dengan sudut 100 dan 35 derajat. Berapa sudut ketiga?', '45', '180 - 135 = 45.'),
    isi('Rancang segitiga dengan sudut 90 dan 35 derajat. Berapa sudut ketiga?', '55', '180 - 125 = 55.'),
    isi('Rancang tanjakan berpenyiku dengan sudut 62 derajat. Berapa sudut tanjakan?', '28', '90 - 62 = 28 (lancip).'),
    isi('Dua sudut bertolak belakang. Sudut yang bersebelahan dengan keduanya 115 derajat. Berapa sudut keduanya?', '65', '180 - 115 = 65.'),
    isi('Dua garis berpotongan membentuk sudut A = 72 derajat. Berapa sudut C yang bertolak belakang dengan A?', '72', 'Bertolak belakang sama besar.', sudut('silang', { deg: 72, labA: 'A=72°', labB: 'B', labC: 'C', labD: 'D' })),
    pg('Jarum jam menunjukkan pukul 3 tepat. Sudut antara jarum pendek dan panjang termasuk sudut...', ['siku-siku', 'lancip', 'tumpul', 'refleks'], 0, '90°.'),
    pg('Tangga bersandar membentuk sudut 60 derajat dengan lantai. Jenis sudutnya...', ['lancip', 'siku-siku', 'tumpul', 'lurus'], 0, '60° < 90°.'),
    pg('Rian mengira keempat sudut perpotongan dua garis selalu sama. Koreksi yang tepat...', ['Hanya sudut bertolak belakang yang sama besar', 'Benar, selalu sama', 'Semua berjumlah 90°'], 0, 'Yang bersebelahan berjumlah 180°.'),
    pg('Wati membaca 130° untuk sudut lancip. Kesalahannya...', ['Membaca skala yang salah; seharusnya 50°', 'Alatnya salah', 'Bacaannya benar'], 0, 'Mulai dari 0 pada garis dasar.'),
    pg('Made: "Sudut dengan kaki panjang lebih besar." Benarkah?', ['Salah, sudut hanya bergantung pada putaran', 'Benar'], 0, 'Panjang kaki tidak memengaruhi.'),
    pg('Rian: "Jumlah sudut segiempat juga 180°." Benarkah?', ['Salah, 360°', 'Benar'], 0, 'Dua segitiga.'),
    pg('Manakah tiga sudut yang bisa membentuk segitiga?', ['60, 60, 60', '90, 60, 60', '100, 50, 40', '70, 70, 70'], 0, 'Jumlahnya harus 180.'),
    gen('pelurus'),
    gen('penyiku'),
    gen('segitiga'),
    gen('segiempat'),
    gen('putaran'),
    gen('jenis'),
    gen('tolak'),
  ],
}
