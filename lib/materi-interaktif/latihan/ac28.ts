import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { balok } from '../gambar'

/**
 * Bahan latihan AC-28 (Volume dan luas permukaan kubus, balok, dan bangun
 * ruang gabungan).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * rumus volume kubus (s x s x s) dan balok (p x l x t), luas permukaan kubus
 * (6 x s x s) dan balok (2 x (pl + pt + lt)), satuan (volume pangkat tiga,
 * luas permukaan pangkat dua), kubus sebagai balok khusus (tetapi balok belum
 * tentu kubus), bangun gabungan (volume dijumlahkan tanpa pengurangan; luas
 * permukaan = jumlah dikurangi DUA kali luas bidang yang menempel), cerita
 * (kotak penyimpanan, toko), memeriksa, rancang (cari tinggi dari volume,
 * rusuk dari volume atau luas permukaan, tinggi dari luas permukaan), dan
 * sifat (membagi dengan cara lain tetap memberi volume sama; menambah balok
 * kecil selalu menambah volume). Salah paham: p + l + t, 5 sisi, rumus luas
 * permukaan untuk volume, satuan persegi untuk volume, luas permukaan gabungan
 * dijumlah penuh, dikurangi hanya satu kali, balok pasti kubus.
 *
 * Jawaban angka ditulis tanpa satuan.
 *
 * `GEN.volKubus`, `GEN.volBalok`, `GEN.lpKubus`, `GEN.lpBalok`, `GEN.volGab`
 * (dua balok ditumpuk), `GEN.lpGab` (luas permukaan dua balok ditumpuk satu
 * alas), `GEN.cariTinggi` (dari volume), `GEN.cariRusuk` (dari volume atau
 * luas permukaan kubus).
 */
const JS = String.raw`
function lpH(p,l,t){return 2*(p*l+p*t+l*t)}
GEN.volKubus=function(){
  var s=rnd(2,9);
  return {t:'isi',q:'Sebuah kubus memiliki panjang rusuk '+s+' cm. Berapa volume kubus tersebut (cm kubik)?',a:[String(s*s*s)],e:'Volume = '+s+' x '+s+' x '+s+' = '+(s*s*s)+'.',g:{k:'balok',p:s,l:s,t:s,grid:s<=6,lab:{p:s+' cm',l:s+' cm',t:s+' cm'}}};
};
GEN.volBalok=function(){
  var p=rnd(4,12),l=rnd(3,9),t=rnd(2,8);
  return {t:'isi',q:'Sebuah balok memiliki panjang '+p+' cm, lebar '+l+' cm, dan tinggi '+t+' cm. Berapa volume balok tersebut (cm kubik)?',a:[String(p*l*t)],e:'Volume = '+p+' x '+l+' x '+t+' = '+(p*l*t)+'. Bukan '+p+' + '+l+' + '+t+'.',g:{k:'balok',p:p,l:l,t:t,grid:p<=12&&l<=9&&t<=8,lab:{p:p+' cm',l:l+' cm',t:t+' cm'}}};
};
GEN.lpKubus=function(){
  var s=rnd(2,9);
  return {t:'isi',q:'Sebuah kubus memiliki panjang rusuk '+s+' cm. Berapa luas permukaan kubus tersebut (cm persegi)?',a:[String(6*s*s)],e:'Luas permukaan = 6 x '+s+' x '+s+' = '+(6*s*s)+'. Kubus punya 6 sisi sama besar.',g:{k:'balok',p:s,l:s,t:s,lab:{p:s+' cm',l:s+' cm',t:s+' cm'}}};
};
GEN.lpBalok=function(){
  var p=rnd(4,10),l=rnd(3,8),t=rnd(2,7);
  return {t:'isi',q:'Sebuah balok memiliki panjang '+p+' cm, lebar '+l+' cm, dan tinggi '+t+' cm. Berapa luas permukaan balok tersebut (cm persegi)? (Petunjuk: 2 x (pl + pt + lt))',a:[String(lpH(p,l,t))],e:'2 x ('+(p*l)+' + '+(p*t)+' + '+(l*t)+') = '+lpH(p,l,t)+'.',g:{k:'balok',p:p,l:l,t:t,lab:{p:p+' cm',l:l+' cm',t:t+' cm'}}};
};
GEN.volGab=function(){
  var p=rnd(4,10),l=rnd(3,8),t1=rnd(3,8),t2=rnd(2,6);
  return {t:'isi',q:'Dua balok disusun bertumpuk: balok bawah berukuran panjang '+p+' cm, lebar '+l+' cm, tinggi '+t1+' cm; balok atas berukuran panjang '+p+' cm, lebar '+l+' cm, tinggi '+t2+' cm (menempel penuh). Berapa volume total bangun gabungan (cm kubik)?',a:[String(p*l*(t1+t2))],e:p+' x '+l+' x '+t1+' = '+(p*l*t1)+' dan '+p+' x '+l+' x '+t2+' = '+(p*l*t2)+'. Dijumlahkan: '+(p*l*(t1+t2))+'.',g:{k:'balok',p:p,l:l,t:t1,atas:{p:p,l:l,t:t2},lab:{p:p+' cm',l:l+' cm',t:t1+' cm',ta:t2+' cm'}}};
};
GEN.lpGab=function(){
  var p=rnd(4,9),l=rnd(3,7),t1=rnd(3,7),t2=rnd(2,5);
  var LA=lpH(p,l,t1),LB=lpH(p,l,t2),L=LA+LB-2*p*l;
  return {t:'isi',q:'Dua balok disusun bertumpuk dengan alas yang sama: balok bawah panjang '+p+' cm, lebar '+l+' cm, tinggi '+t1+' cm; balok atas panjang '+p+' cm, lebar '+l+' cm, tinggi '+t2+' cm (menempel penuh). Berapa luas permukaan total bangun gabungan (cm persegi)?',a:[String(L)],e:'Luas permukaan bawah '+LA+' dan atas '+LB+'. Bidang menempel '+(p*l)+' terhitung dua kali di setiap bagian, jadi '+LA+' + '+LB+' - 2 x '+(p*l)+' = '+L+'.',g:{k:'balok',p:p,l:l,t:t1,atas:{p:p,l:l,t:t2},tempel:true,lab:{p:p+' cm',l:l+' cm',t:t1+' cm',ta:t2+' cm'}}};
};
GEN.cariTinggi=function(){
  var p=rnd(5,12),l=rnd(3,8),t=rnd(2,9);
  return {t:'isi',q:'Kamu ingin merancang balok dengan volume tepat '+(p*l*t)+' cm kubik. Jika panjangnya '+p+' cm dan lebarnya '+l+' cm, berapa tinggi yang dibutuhkan (cm)?',a:[String(t)],e:'Tinggi = '+(p*l*t)+' : ('+p+' x '+l+') = '+(p*l*t)+' : '+(p*l)+' = '+t+'.',g:{k:'balok',p:p,l:l,t:t,lab:{p:p+' cm',l:l+' cm',t:'?'}}};
};
GEN.cariRusuk=function(){
  var s=rnd(2,9);
  if(rnd(0,1)===0)return {t:'isi',q:'Kamu ingin merancang kubus dengan volume tepat '+(s*s*s)+' cm kubik. Berapa panjang rusuknya (cm)?',a:[String(s)],e:s+' x '+s+' x '+s+' = '+(s*s*s)+', jadi rusuknya '+s+' cm.',g:{k:'balok',p:s,l:s,t:s,lab:{p:'?',l:'?',t:'?'}}};
  return {t:'isi',q:'Kamu ingin merancang kubus dengan luas permukaan tepat '+(6*s*s)+' cm persegi. Berapa panjang rusuknya (cm)? (Petunjuk: 6 x s x s, jadi s x s = luas permukaan : 6)',a:[String(s)],e:'s x s = '+(6*s*s)+' : 6 = '+(s*s)+', jadi s = '+s+'.',g:{k:'balok',p:s,l:s,t:s,lab:{p:'?',l:'?',t:'?'}}};
};
`

export const DATA_AC28: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Volume kubus berusuk s adalah s × s × s.', true, 'Kubus berusuk 4 cm berisi 64 cm kubik.', balok(4, 4, 4, { grid: true, lab: { p: '4 cm', l: '4 cm', t: '4 cm' } })),
    bs('Volume balok adalah panjang × lebar × tinggi.', true, '9 × 4 × 5 = 180.', balok(9, 4, 5, { grid: true, lab: { p: '9 cm', l: '4 cm', t: '5 cm' } })),
    bs('Volume balok 5 × 4 × 3 adalah 12 cm kubik, yaitu 5 + 4 + 3.', false, 'Dikalikan: 5 × 4 × 3 = 60.', balok(5, 4, 3, { grid: true, lab: { p: '5 cm', l: '4 cm', t: '3 cm' } })),
    bs('Luas permukaan kubus berusuk s adalah 6 × s × s.', true, 'Kubus punya 6 sisi persegi yang sama.', balok(3, 3, 3, { lab: { p: '3 cm', l: '3 cm', t: '3 cm' } })),
    bs('Luas permukaan kubus dihitung dengan mengalikan luas satu sisi dengan 5.', false, 'Kubus punya 6 sisi, bukan 5.', balok(5, 5, 5)),
    bs('Luas permukaan balok = 2 × (pl + pt + lt).', true, 'Ada tiga pasang sisi yang sama.', balok(9, 5, 4, { lab: { p: '9 cm', l: '5 cm', t: '4 cm' } })),
    bs('Rumus 2 × (pl + pt + lt) dipakai untuk mencari volume balok.', false, 'Itu rumus luas permukaan balok.'),
    bs('Satuan volume adalah pangkat tiga, misalnya cm kubik.', true, 'Satuan luas permukaan adalah pangkat dua, misalnya cm persegi.'),
    bs('Volume kubus berusuk 6 cm dapat ditulis 216 cm persegi.', false, 'Volume memakai satuan cm kubik.'),
    bs('Kubus adalah balok khusus dengan panjang = lebar = tinggi.', true, 'Rumus p × l × t tetap berlaku untuk kubus.'),
    bs('Setiap balok pasti juga kubus.', false, 'Balok 6 × 4 × 3 bukan kubus.'),
    bs('Volume bangun gabungan boleh dihitung dengan menjumlahkan volume tiap bagian tanpa pengurangan.', true, 'Ruang di dalam tetap terisi penuh.', balok(10, 8, 6, { atas: { p: 10, l: 8, t: 4 } })),
    bs('Luas permukaan bangun gabungan boleh dihitung dengan menjumlahkan penuh luas permukaan kedua bagian.', false, 'Bidang yang menempel tidak lagi menjadi permukaan.', balok(10, 8, 6, { atas: { p: 10, l: 8, t: 4 }, tempel: true })),
    bs('Luas permukaan gabungan = jumlah luas permukaan dikurangi DUA kali luas bidang yang menempel.', true, 'Bidang itu hilang dari kedua bagian.'),
    bs('Membagi bangun gabungan dengan cara lain tetap memberi volume total yang sama.', true, 'Selama seluruh bangun tercakup tanpa tumpang tindih.'),
    bs('Menambah balok kecil pada sisi bangun ruang (tanpa tumpang tindih) tidak pernah mengurangi volume.', true, 'Volume total bertambah.'),
  ],
  debat: [
    debat('Dedi dan Sinta menghitung volume balok 5 × 4 × 3.', ['Dedi: "12, karena 5 + 4 + 3."', 'Sinta: "60, karena 5 × 4 × 3."'], 1, 'Volume dikalikan.', balok(5, 4, 3, { grid: true })),
    debat('Rian dan Made menghitung luas permukaan kubus berusuk 5 cm.', ['Rian: "125, satu sisi × 5."', 'Made: "150, satu sisi × 6."'], 1, 'Kubus punya 6 sisi.', balok(5, 5, 5)),
    debat('Wati dan Kiki membahas volume kubus berusuk 6 cm.', ['Wati: "216 cm persegi."', 'Kiki: "216 cm kubik."'], 1, 'Satuan volume adalah kubik.'),
    debat('Made dan Eka menghitung luas permukaan dua balok yang ditumpuk.', ['Made: "Jumlahkan penuh keduanya."', 'Eka: "Kurangi dua kali luas bidang yang menempel."'], 1, 'Bidang menempel tidak lagi di permukaan.', balok(10, 8, 6, { atas: { p: 10, l: 8, t: 4 }, tempel: true })),
    debat('Fajar dan Gita membahas hubungan kubus dan balok.', ['Fajar: "Kubus adalah balok, jadi setiap balok pasti kubus."', 'Gita: "Kubus balok khusus, tetapi balok belum tentu kubus."'], 1, 'Balok 6 × 4 × 3 bukan kubus.'),
    debat('Hadi dan Ira membahas volume bangun gabungan dan luas permukaannya.', ['Hadi: "Volume dijumlah, luas permukaan harus dikurangi bidang menempel."', 'Ira: "Keduanya cukup dijumlah."'], 0, 'Bidang menempel hanya memengaruhi luas permukaan.'),
  ],
  bank: [
    isi('Sebuah kubus berusuk 6 cm. Berapa volumenya (cm kubik)?', '216', '6 × 6 × 6 = 216.', balok(6, 6, 6, { lab: { p: '6 cm', l: '6 cm', t: '6 cm' } })),
    isi('Sebuah kubus berusuk 4 cm. Berapa volumenya?', '64', '4 × 4 × 4 = 64.', balok(4, 4, 4, { grid: true })),
    isi('Sebuah kubus berusuk 7 cm. Berapa volumenya?', '343', '7 × 7 × 7 = 343.'),
    isi('Balok panjang 10, lebar 6, tinggi 5 cm. Berapa volumenya?', '300', '10 × 6 × 5 = 300.', balok(10, 6, 5, { lab: { p: '10 cm', l: '6 cm', t: '5 cm' } })),
    isi('Balok panjang 10, lebar 5, tinggi 4 cm. Berapa volumenya?', '200', '10 × 5 × 4 = 200.'),
    isi('Kotak penyimpanan balok panjang 12, lebar 8, tinggi 6 cm. Berapa volumenya?', '576', '12 × 8 × 6 = 576.'),
    isi('Balok panjang 9, lebar 5, tinggi 4 cm. Berapa luas permukaannya (cm persegi)?', '202', '2 × (45 + 36 + 20) = 202.', balok(9, 5, 4, { lab: { p: '9 cm', l: '5 cm', t: '4 cm' } })),
    isi('Kubus berusuk 3 cm. Berapa luas permukaannya?', '54', '6 × 3 × 3 = 54.', balok(3, 3, 3)),
    isi('Kubus berusuk 5 cm. Berapa luas permukaannya?', '150', '6 × 5 × 5 = 150.', balok(5, 5, 5)),
    isi('Balok 6 × 4 × 3 cm. Berapa volumenya (cm kubik)?', '72', '6 × 4 × 3 = 72.'),
    isi('Balok 6 × 4 × 3 cm. Berapa luas permukaannya (cm persegi)?', '108', '2 × (24 + 18 + 12) = 108.'),
    isi('Dua kubus berusuk 4 cm ditumpuk. Berapa volume totalnya?', '128', '64 + 64 = 128.', balok(4, 4, 4, { atas: { p: 4, l: 4, t: 4 } })),
    isi('Dua balok ditumpuk: bawah 10 × 8 × 6 cm, atas 10 × 8 × 4 cm. Berapa volume total?', '800', '480 + 320 = 800.', balok(10, 8, 6, { atas: { p: 10, l: 8, t: 4 } })),
    isi('Dua kubus berusuk 5 cm dan 3 cm ditumpuk. Berapa volume total?', '152', '125 + 27 = 152.', balok(5, 5, 5, { atas: { p: 3, l: 3, t: 3 } })),
    isi('Rancang balok bervolume 240 cm³ dengan panjang 10 cm dan lebar 6 cm. Berapa tingginya?', '4', '240 : 60 = 4.'),
    isi('Rancang balok bervolume 180 cm³ dengan panjang 9 cm dan lebar 5 cm. Berapa tingginya?', '4', '180 : 45 = 4.'),
    isi('Rancang wadah balok bervolume 360 cm³, panjang dan lebar 6 cm. Berapa tingginya?', '10', '360 : 36 = 10.'),
    isi('Rancang kubus bervolume 125 cm³. Berapa rusuknya?', '5', '5 × 5 × 5 = 125.'),
    isi('Rancang kubus bervolume 216 cm³. Berapa rusuknya?', '6', '6 × 6 × 6 = 216.'),
    isi('Rancang kubus berluas permukaan 96 cm². Berapa rusuknya?', '4', '96 : 6 = 16, akar kuadrat 16 = 4.'),
    isi('Rancang kotak balok berluas permukaan 184 cm², panjang 8, lebar 5. Berapa tingginya?', '4', '2 × (40 + 8t + 5t) = 184 → 13t = 52 → t = 4.'),
    pg('Wati menghitung luas permukaan kubus berusuk 5 cm dengan mengalikan luas satu sisi dengan 5. Apa kesalahannya?', ['Kubus punya 6 sisi, bukan 5', 'Tidak ada kesalahan', 'Seharusnya dibagi'], 0, '6 × 25 = 150.'),
    pg('Rian memakai 6 × s × s untuk volume kubus 6 cm dan menulis 216 cm persegi. Apa kesalahannya?', ['Itu rumus luas permukaan; volume memakai s × s × s dan cm kubik', 'Tidak ada kesalahan'], 0, 'Volume = isi, satuannya kubik.'),
    pg('Sinta menulis volume balok "120 cm persegi". Apa yang kurang tepat?', ['Satuan volume seharusnya cm kubik', 'Seharusnya cm', 'Tidak ada'], 0, 'Volume memakai satuan pangkat tiga.'),
    pg('Sinta menjumlahkan panjang, lebar, dan tinggi untuk volume balok. Apa yang salah?', ['Volume seharusnya dikalikan', 'Seharusnya dikurangi', 'Tidak ada'], 0, 'p × l × t.'),
    pg('Made menjumlahkan penuh luas permukaan dua balok yang ditumpuk. Akibatnya...', ['hasilnya terlalu besar karena bidang menempel ikut dihitung', 'hasilnya terlalu kecil', 'hasilnya benar'], 0, 'Kurangi dua kali bidang menempel.'),
    pg('Manakah bangun ruang gabungan dengan kubus atau balok?', ['Dua balok ditumpuk satu di atas yang lain', 'Sebuah kubus tunggal', 'Sebuah lingkaran'], 0, 'Gabungan terdiri dari dua atau lebih bangun.', balok(10, 8, 6, { atas: { p: 10, l: 8, t: 4 } })),
    pg('Dedi: "Volume gabungan dijumlah, jadi luas permukaan gabungan juga cukup dijumlah." Benarkah?', ['Salah, luas permukaan harus dikurangi bidang menempel', 'Benar'], 0, 'Dua kali bidang yang menempel.'),
    pg('Dua kubus berusuk 4 cm ditumpuk. Berapa volume totalnya?', ['128', '64', '256', '16'], 0, '64 + 64.'),
    gen('volKubus'),
    gen('volBalok'),
    gen('volBalok'),
    gen('lpKubus'),
    gen('lpBalok'),
    gen('volGab'),
    gen('lpGab'),
    gen('cariTinggi'),
    gen('cariRusuk'),
  ],
}
