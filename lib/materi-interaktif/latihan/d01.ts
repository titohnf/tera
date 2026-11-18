import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { garisbil } from '../gambar'

/**
 * Bahan latihan D-01 (Bilangan bulat: operasi dan sifat dasar).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * himpunan bilangan bulat (negatif, nol, positif; bukan pecahan atau desimal),
 * urutan di garis bilangan (-17 lebih kecil dari -9, titik tengah -5 dan -1),
 * nilai mutlak (jarak ke 0, tidak pernah negatif; |-5| = |5| tetapi -5 bukan
 * 5) dan lawan bilangan, empat operasi (pengurangan = penjumlahan dengan
 * lawan, tanda hasil kali dan bagi, banyak faktor negatif), urutan operasi
 * (kali dan bagi dahulu, kurung), sifat komutatif, asosiatif, distributif,
 * cerita (suhu, selam, pendaki, saldo, stok, kartu poin, selisih gol),
 * klaim tentang tanda (jumlah tiga negatif lebih kecil, tiga faktor negatif =
 * negatif, empat = positif), dan rancang (pasangan dengan jumlah dan hasil
 * kali tertentu, rangkaian kartu). Salah paham: -17 > -9, makin kecil bilangan
 * makin kecil jaraknya ke 0, |-5| = |5| berarti -5 = 5, urutan operasi dari
 * kiri ke kanan, -4 x (6 - 9) dijumlah penuh, (-2)+(-2)+(-2) disamakan dengan
 * (-2) x 3 hanya karena angkanya sama.
 *
 * Jawaban negatif ditulis dengan tanda minus biasa (-15).
 *
 * `GEN.tambah`, `GEN.kurang`, `GEN.kali`, `GEN.bagi`, `GEN.campur`,
 * `GEN.distribusi`, `GEN.mutlak`, `GEN.lawan`, `GEN.cerita`.
 */
const JS = String.raw`
function sgn(v,pa){return v<0&&pa?'('+v+')':String(v)}
GEN.tambah=function(){
  var a=rnd(-15,15),b=rnd(-15,15);
  if(a===0||b===0)return GEN.tambah();
  return {t:'isi',q:'Hitung hasil dari '+a+' + '+sgn(b,true)+'.',a:[String(a+b)],e:a+' + '+sgn(b,true)+' = '+(a+b)+'. Bilangan negatif menggeser titik ke kiri.',g:{k:'garisbil',lo:Math.min(a,b,a+b)-2,hi:Math.max(a,b,a+b,0)+2,jejak:[a,a+b]}};
};
GEN.kurang=function(){
  var a=rnd(-12,12),b=rnd(-12,12);
  if(b>=0)b=-rnd(2,12);
  return {t:'isi',q:'Hitung hasil dari '+a+' - ('+b+').',a:[String(a-b)],e:a+' - ('+b+') = '+a+' + '+(-b)+' = '+(a-b)+'. Mengurangi bilangan negatif sama dengan menambah lawannya.',g:{k:'garisbil',lo:Math.min(a,a-b,0)-2,hi:Math.max(a,a-b,0)+2,jejak:[a,a-b]}};
};
GEN.kali=function(){
  var a=rnd(-9,9),b=rnd(-9,9);
  if(a===0||b===0)return GEN.kali();
  return {t:'isi',q:'Hitung hasil dari '+sgn(a,true)+' x '+sgn(b,true)+'.',a:[String(a*b)],e:'Tanda '+(a*b<0?'berbeda':'sama')+', hasil '+(a*b<0?'negatif':'positif')+': '+(a*b)+'.'};
};
GEN.bagi=function(){
  var b=rnd(-9,9),q=rnd(-9,9);
  if(b===0||q===0)return GEN.bagi();
  return {t:'isi',q:'Hitung hasil dari '+(b*q)+' : '+sgn(b,true)+'.',a:[String(q)],e:(b*q)+' : '+sgn(b,true)+' = '+q+', karena '+q+' x '+sgn(b,true)+' = '+(b*q)+'.'};
};
GEN.campur=function(){
  var b=rnd(2,6),q=rnd(-6,6),c=rnd(2,6),d=rnd(-6,6);
  if(q===0||d===0)return GEN.campur();
  return {t:'isi',q:'Hitung hasil dari '+(b*q)+' : '+sgn(b,true)+' + '+c+' x '+sgn(d,true)+'.',a:[String(q+c*d)],e:'Kali dan bagi dahulu: '+q+' dan '+(c*d)+'. Jumlah: '+(q+c*d)+'.'};
};
GEN.distribusi=function(){
  var a=rnd(-6,6),b=rnd(2,9),c=rnd(1,b-1);
  if(a===0)return GEN.distribusi();
  return {t:'isi',q:'Dengan sifat distributif, hitung '+sgn(a,true)+' x ('+b+' - '+c+').',a:[String(a*(b-c))],e:'('+a+' x '+b+') - ('+a+' x '+c+') = '+(a*b)+' - ('+(a*c)+') = '+(a*(b-c))+'.'};
};
GEN.mutlak=function(){
  var v=rnd(-20,-1);
  return {t:'isi',q:'Berapa nilai mutlak dari '+v+'?',a:[String(-v)],e:'Nilai mutlak adalah jarak ke 0, jadi |'+v+'| = '+(-v)+'.',g:{k:'garisbil',lo:v-2,hi:3,titik:[{v:v,w:'merah'}],mutlak:v}};
};
GEN.lawan=function(){
  var v=rnd(-15,15);
  if(v===0)return GEN.lawan();
  return {t:'isi',q:'Lawan (invers penjumlahan) dari bilangan '+v+' adalah ...',a:[String(-v)],e:v+' + ('+(-v)+') = 0, jadi lawannya '+(-v)+'.'};
};
GEN.cerita=function(){
  var s=rnd(-12,-2),n=rnd(5,14),t=rnd(2,9);
  return {t:'isi',q:'Suhu suatu ruangan pagi hari tercatat '+s+' derajat Celsius. Siang hari suhu naik '+n+' derajat, lalu malam hari turun '+t+' derajat. Berapa suhu pada malam hari (derajat Celsius)?',a:[String(s+n-t)],e:s+' + '+n+' - '+t+' = '+(s+n-t)+'.',g:{k:'garisbil',lo:Math.min(s,s+n,s+n-t)-2,hi:Math.max(s,s+n,s+n-t)+2,jejak:[s,s+n,s+n-t]}};
};
`

const gb = (lo: number, hi: number, o: Parameters<typeof garisbil>[2] = {}) => garisbil(lo, hi, o)

export const DATA_D01: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Himpunan bilangan bulat terdiri atas bilangan bulat negatif, nol, dan bilangan bulat positif.', true, '..., -2, -1, 0, 1, 2, ...', gb(-5, 5)),
    bs('Bilangan -3 / 4 dan 2,5 termasuk bilangan bulat.', false, 'Pecahan dan desimal bukan bilangan bulat.'),
    bs('-17 lebih besar daripada -9.', false, '-17 berada di kiri -9 pada garis bilangan, jadi lebih kecil.', gb(-20, 0, { titik: [{ v: -17, w: 'merah' }, { v: -9, w: 'biru' }] })),
    bs('-20 lebih besar daripada -12.', false, '-12 di sebelah kanan -20, jadi -12 yang lebih besar.', gb(-22, 0, { titik: [{ v: -20, w: 'merah' }, { v: -12, w: 'biru' }] })),
    bs('Nilai mutlak suatu bilangan bulat tidak pernah negatif.', true, 'Nilai mutlak adalah jarak ke 0.', gb(-12, 3, { titik: [{ v: -8, w: 'merah' }], mutlak: -8 })),
    bs('Karena |-5| = |5| = 5, maka -5 = 5.', false, 'Nilai mutlak sama, tetapi letaknya berbeda dari 0.', gb(-7, 7, { titik: [{ v: -5, w: 'merah' }, { v: 5, w: 'biru' }] })),
    bs('Karena -10 lebih kecil daripada -3, jarak -10 ke 0 juga lebih kecil.', false, 'Jaraknya 10, lebih besar dari 3.', gb(-12, 2, { titik: [{ v: -10, w: 'merah' }, { v: -3, w: 'biru' }] })),
    bs('Bilangan -1 adalah lawan dari bilangan 1.', true, '1 + (-1) = 0.'),
    bs('Pengurangan 7 - 12 sama dengan penjumlahan 7 + (-12).', true, 'Kurang sama dengan tambah lawannya.', gb(-8, 9, { jejak: [7, -5] })),
    bs('5 - (-9) = -4.', false, '5 - (-9) = 5 + 9 = 14.', gb(-2, 16, { jejak: [5, 14] })),
    bs('Hasil kali dua bilangan bulat negatif selalu positif.', true, '(-4) x (-3) = 12.'),
    bs('Hasil kali tiga bilangan bulat negatif selalu negatif.', true, 'Tanda berbalik tiga kali: negatif.'),
    bs('Hasil kali empat bilangan bulat negatif selalu positif.', true, 'Banyak faktor negatif genap: positif.'),
    bs('Jumlah tiga bilangan bulat negatif selalu lebih kecil daripada masing-masing bilangan itu.', true, 'Misalnya (-2) + (-3) + (-4) = -9, lebih kecil dari -2, -3, dan -4.'),
    bs('Hasil -4 x (6 - 9) dapat ditulis (-4 x 6) + (-4 x 9).', false, 'Harus dikurangi: (-4 x 6) - (-4 x 9) = -24 + 36 = 12.'),
    bs('Pada -5 - 3 x (-4) + 2, perkalian dikerjakan lebih dulu.', true, '3 x (-4) = -12, lalu -5 + 12 + 2 = 9.'),
    bs('Sifat komutatif penjumlahan: a + b = b + a.', true, '-3 + 5 = 5 + (-3).'),
    bs('Mengalikan bilangan bulat dengan -1 mengubah tandanya tanpa mengubah nilai mutlaknya.', true, '(-1) x 7 = -7, |-7| = |7|.'),
    bs('(-2) + (-2) + (-2) sama dengan (-2) x 3.', true, 'Penjumlahan berulang sama dengan perkalian, karena penjumlahan berulangnya, bukan hanya angkanya.'),
  ],
  debat: [
    debat('Made dan Wati membandingkan -17 dan -9.', ['Made: "-17 lebih besar, angkanya lebih besar."', 'Wati: "-9 lebih besar, ia lebih ke kanan."'], 1, 'Makin ke kanan makin besar.', gb(-20, 0, { titik: [{ v: -17, w: 'merah' }, { v: -9, w: 'biru' }] })),
    debat('Rian dan Sinta membahas |-5| dan |5|.', ['Rian: "Sama-sama 5, jadi -5 = 5."', 'Sinta: "Jaraknya sama, tetapi -5 dan 5 berbeda."'], 1, 'Letaknya berbeda dari 0.', gb(-7, 7, { titik: [{ v: -5, w: 'merah' }, { v: 5, w: 'biru' }] })),
    debat('Dedi dan Eka menghitung -5 - 3 x (-4) + 2.', ['Dedi: "-15, dikerjakan dari kiri."', 'Eka: "9, perkalian dahulu."'], 1, '3 x (-4) = -12, -5 + 12 + 2 = 9.'),
    debat('Kiki dan Fajar menghitung -4 x (6 - 9).', ['Kiki: "-24 + (-36) = -60."', 'Fajar: "-24 - (-36) = 12."'], 1, 'Distribusi mengikuti tanda minus pada 6 - 9.'),
    debat('Gita dan Hadi membahas hasil kali tiga bilangan negatif.', ['Gita: "Positif, karena negatif kali negatif."', 'Hadi: "Negatif, tanda berbalik tiga kali."'], 1, 'Banyak faktor negatif ganjil: negatif.'),
    debat('Ira dan Joni membahas 5 - (-9).', ['Ira: "-4."', 'Joni: "14, karena kurang negatif = tambah positif."'], 1, '5 + 9 = 14.', gb(-2, 16, { jejak: [5, 14] })),
  ],
  bank: [
    isi('Nilai mutlak dari -12 adalah ...', '12', 'Jarak -12 ke 0 adalah 12.', gb(-14, 2, { titik: [{ v: -12, w: 'merah' }], mutlak: -12 })),
    isi('Lawan (invers penjumlahan) dari bilangan -8 adalah ...', '8', '-8 + 8 = 0.'),
    isi('Titik tengah antara -5 dan -1 pada garis bilangan adalah ...', '-3', 'Jarak ke kedua ujung sama (2).', gb(-7, 1, { titik: [{ v: -3, w: 'merah' }, { v: -5, w: 'biru' }, { v: -1, w: 'biru' }] })),
    isi('Nyatakan pengurangan 7 - 12 sebagai penjumlahan 7 + ...', '-12', 'Kurang 12 sama dengan tambah (-12).'),
    isi('Nyatakan pengurangan 4 - 11 sebagai penjumlahan: 4 + ...', '-11', 'Tambah lawannya.'),
    isi('Nyatakan pengurangan 9 - 14 sebagai penjumlahan: 9 + ...', '-14', 'Tambah lawannya.'),
    isi('Sifat distributif: 7 x (5 - 2) = (7 x 5) - (7 x ...)', '2', '7 x 5 - 7 x 2 = 21.'),
    isi('Hitung hasil dari -8 + 15 - 6.', '1', '-8 + 15 = 7, 7 - 6 = 1.', gb(-10, 9, { jejak: [-8, 7, 1] })),
    isi('Hitung hasil dari 5 - (-9).', '14', '5 + 9 = 14.', gb(-2, 16, { jejak: [5, 14] })),
    isi('Hitung hasil dari (-14) + 9 - (-6).', '1', '-14 + 9 + 6 = 1.'),
    isi('Hitung hasil dari 6 - (-11) + (-4).', '13', '6 + 11 - 4 = 13.'),
    isi('Suhu pagi -6 derajat, siang naik 10 derajat, malam turun 4 derajat. Berapa suhu malam?', '0', '-6 + 10 - 4 = 0.', gb(-8, 6, { jejak: [-6, 4, 0] })),
    isi('Suhu pagi -3 derajat, siang naik 11, malam turun 8. Berapa suhu malam?', '0', '-3 + 11 - 8 = 0.'),
    isi('Penyelam berada di -8 meter lalu turun 5 meter lagi: -8 + (...) = ... meter. Isi hasil akhirnya.', '-13', '-8 + (-5) = -13.', gb(-15, 2, { jejak: [-8, -13] })),
    isi('Andi berutang Rp15.000 lalu menabung Rp15.000. Berapa keadaan keuangannya (Rp)?', '0', 'Impas.'),
    isi('Pendaki di +200 m turun 350 m ke lembah lalu naik 120 m. Berapa ketinggiannya (m)?', '-30', '200 - 350 + 120 = -30.'),
    isi('Kartu Rian berturut-turut: -4, +7, -9, +12, -3. Berapa skor akhir?', '3', '-4 + 7 - 9 + 12 - 3 = 3.', gb(-8, 8, { jejak: [0, -4, 3, -6, 6, 3] })),
    isi('Pada kartu yang sama, berapa skor TERTINGGI setelah tiap kartu?', '6', 'Skor: -4, 3, -6, 6, 3.'),
    isi('Stok: Senin berkurang 15, Selasa bertambah 9, Rabu berkurang 6. Berapa total perubahan?', '-12', '-15 + 9 - 6 = -12.'),
    pg('Hasil dari (-4) x 6 : (-3) adalah ...', ['8', '-8', '-48', '48'], 0, '-24 : (-3) = 8.'),
    pg('Hasil dari (-8) x (-5) : 4 adalah ...', ['10', '-10', '40', '-40'], 0, '40 : 4 = 10.'),
    pg('Hasil dari -12 : (-4) + 3 x (-2) adalah ...', ['-3', '-9', '9', '-12'], 0, '3 + (-6) = -3.'),
    pg('Hasil dari -30 : 6 + (-4) x (-2) adalah ...', ['3', '13', '-13', '-3'], 0, '-5 + 8 = 3.'),
    pg('Hasil dari (-18) : 3 + (-2) x 5 adalah ...', ['-16', '4', '-4', '16'], 0, '-6 + (-10) = -16.'),
    pg('Hasil dari (-11) + 6 adalah ...', ['-5', '5', '-17', '17'], 0, 'Selisih 5, tanda mengikuti 11 yang lebih besar nilai mutlaknya.'),
    pg('Dengan sifat distributif, -3 x (7 - 2) = ...', ['-15', '-23', '-19', '15'], 0, '-21 + 6 = -15.'),
    pg('Penjabaran benar dari 4 x (5 - 3) adalah ...', ['(4 x 5) - (4 x 3)', '(4 x 5) - 3', '4 x 5 - 4 + 3', '4 - (5 x 3)'], 0, 'Kalikan 4 ke setiap suku.'),
    pg('Di antara -2, 5, -7, 3, manakah yang paling dekat dengan 0?', ['-2', '5', '-7', '3'], 0, '|-2| = 2 terkecil.', gb(-9, 7, { titik: [{ v: -2, w: 'merah' }, { v: -7, w: 'biru' }, { v: 3, w: 'biru' }, { v: 5, w: 'biru' }] })),
    pg('Manakah pasangan (a, b) dengan a + b = -3 dan a x b = -10?', ['(2, -5)', '(5, -8)', '(-2, -1)', '(7, -10)'], 0, '2 + (-5) = -3, 2 x (-5) = -10.'),
    pg('Bilangan manakah yang seluruh anggotanya bilangan bulat?', ['-7, 0, 15', '-7, 1/2, 15', '-3, 2,5, 8', '0, 3/4, -9'], 0, 'Tidak ada pecahan atau desimal.'),
    pg('Siswa menghitung -6 x (4 - 7): 4 - 7 = -3, lalu -6 x (-3) = 18. Penilaian yang tepat...', ['Kedua langkah benar, hasilnya 18', 'Langkah 1 salah', 'Langkah 2 salah'], 0, 'Negatif kali negatif = positif.'),
    pg('Siswa: "Karena |-5| = |5|, -5 = 5." Tanggapan yang tepat...', ['Salah. Jarak sama tidak berarti bilangannya sama', 'Benar'], 0, 'Letaknya berbeda.'),
    pg('Siswa: "(-2) + (-2) + (-2) = (-2) x 3 karena sama-sama angka -2 dan 3." Tanggapan...', ['Benar, tetapi alasan yang tepat adalah penjumlahan berulang sama dengan perkalian', 'Salah'], 0, 'Tiga kali -2.'),
    pg('Bu Rina: "Karena -10 lebih kecil dari -3, jarak -10 ke 0 juga lebih kecil." Penilaian...', ['Salah. Jaraknya 10, lebih besar dari 3', 'Benar'], 0, 'Urutan dan jarak berbeda.'),
    gen('tambah'),
    gen('tambah'),
    gen('kurang'),
    gen('kurang'),
    gen('kali'),
    gen('bagi'),
    gen('campur'),
    gen('distribusi'),
    gen('mutlak'),
    gen('lawan'),
    gen('cerita'),
  ],
}
