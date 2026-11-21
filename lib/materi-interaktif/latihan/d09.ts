import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { garisbil, setara } from '../gambar'

/**
 * Bahan latihan D-09 (Aljabar: PLSV dan pertidaksamaan linear satu variabel).
 *
 * Konsep yang diuji bank soal topik ini: istilah (ruas kiri dan kanan,
 * koefisien, konstanta, penyelesaian), PLSV lawan pertidaksamaan, operasi
 * yang sama pada kedua ruas (x + 4 = 9: kurangi 4; memindah ruas membalik
 * operasi), menyelesaikan x + a = b, ax = b, ax + b = c, a(x + m) = n,
 * variabel di kedua ruas, memeriksa penyelesaian dengan substitusi pada KEDUA
 * ruas, pertidaksamaan dengan membalik tanda saat dikali atau dibagi negatif,
 * pertidaksamaan setara (4x - 5 < 3x + 2 sama dengan x < 7), menyatakan
 * penyelesaian bilangan bulat, dan cerita (umur, tiket, diskon, uang, laju).
 * Salah paham: x + 2 = 9 menjadi x = 9 + 2, 3(x - 2) menjadi 3x - 2,
 * lupa membalik tanda, cukup memeriksa satu ruas.
 *
 * Jawaban pertidaksamaan diketik seperti x>4 atau x<-5 (spasi diabaikan);
 * persamaan boleh diketik angka saja.
 *
 * `GEN.plsvTambah`, `GEN.plsvKali`, `GEN.plsvDua`, `GEN.plsvKurung`,
 * `GEN.plsvDuaRuas`, `GEN.ptlsv`, `GEN.ptlsvNegatif`, `GEN.diskonAwal`.
 */
const JS = String.raw`
GEN.plsvTambah=function(){
  var x=rnd(3,20),a=rnd(2,12),m=rnd(0,1);
  return m?{t:'isi',q:'Selesaikan persamaan: x - '+a+' = '+x+'. Berapa x?',a:[String(x+a),'x='+(x+a)],e:'Tambah '+a+' di kedua ruas: x = '+(x+a)+'.'}:{t:'isi',q:'Selesaikan persamaan: x + '+a+' = '+(x+a)+'. Berapa x?',a:[String(x),'x='+x],e:'Kurangi '+a+' di kedua ruas: x = '+x+'.',g:{k:'setara',kb:1,ku:Math.min(a,8),kn:Math.min(x+a,18)}};
};
GEN.plsvKali=function(){
  var a=rnd(2,9),x=rnd(2,12);
  return {t:'isi',q:'Selesaikan persamaan: '+a+'x = '+(a*x)+'. Berapa x?',a:[String(x),'x='+x],e:'Bagi kedua ruas dengan '+a+': x = '+x+'.'};
};
GEN.plsvDua=function(){
  var a=rnd(2,6),b=rnd(1,9),x=rnd(2,9);
  return {t:'isi',q:'Selesaikan persamaan: '+a+'x + '+b+' = '+(a*x+b)+'. Berapa x?',a:[String(x),'x='+x],e:a+'x = '+(a*x+b)+' - '+b+' = '+(a*x)+'; x = '+x+'.',g:{k:'setara',kb:a,ku:Math.min(b,6),kn:Math.min(a*x+b,20)}};
};
GEN.plsvKurung=function(){
  var k=rnd(2,5),m=rnd(1,6),x=rnd(2,9);
  return {t:'isi',q:'Selesaikan persamaan: '+k+'(x + '+m+') = '+(k*(x+m))+'. Berapa x?',a:[String(x),'x='+x],e:k+'x + '+(k*m)+' = '+(k*(x+m))+'; '+k+'x = '+(k*x)+'; x = '+x+'.'};
};
GEN.plsvDuaRuas=function(){
  var c=rnd(1,3),a=c+rnd(2,4),x=rnd(2,8),b=rnd(1,9),d=a*x+b-c*x;
  return {t:'isi',q:'Selesaikan persamaan: '+a+'x + '+b+' = '+c+'x + '+d+'. Berapa x?',a:[String(x),'x='+x],e:'Kumpulkan: '+(a-c)+'x = '+(d-b)+'; x = '+x+'.'};
};
GEN.ptlsv=function(){
  var a=rnd(2,6),n=rnd(2,9),ge=rnd(0,1),op=ge?'≥':'>',ty=ge?'>=':'>';
  return {t:'isi',q:'Selesaikan pertidaksamaan '+a+'x '+op+' '+(a*n)+'. Ketik jawaban seperti x'+ty+'angka.',a:['x'+ty+n,'x'+op+n],e:'Dibagi '+a+' (positif), tanda tetap: x '+op+' '+n+'.'};
};
GEN.ptlsvNegatif=function(){
  var a=rnd(2,6),n=rnd(2,9);
  return {t:'isi',q:'Selesaikan pertidaksamaan -'+a+'x > '+(a*n)+'. Ketik jawaban seperti x<angka.',a:['x<-'+n],e:'Dibagi -'+a+' (negatif), tanda dibalik: x < -'+n+'.',g:{k:'garisbil',lo:-n-3,hi:3,titik:[{v:-n,l:'−'+n}]}};
};
GEN.diskonAwal=function(){
  var P=[20,25,40,50],p=P[rnd(0,3)],h=rnd(5,30)*10000,akhir=h*(100-p)/100;
  return {t:'isi',q:'Setelah didiskon '+p+'%, harga sebuah barang menjadi Rp'+titikRibu(akhir)+'. Berapa rupiah harga awalnya?',a:[String(h)],e:(100-p)+'% dari harga awal = '+titikRibu(akhir)+'; harga awal = '+titikRibu(h)+'.'};
};
`

export const DATA_D09: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('2x + 3 = 7 adalah persamaan linear satu variabel (PLSV).', true, 'Pangkat x adalah 1 dan ada tanda =.', setara({ kb: 2, ku: 3, kn: 7 })),
    bs('x² + 1 = 5 adalah PLSV.', false, 'Pangkat x adalah 2, bukan linear.'),
    bs('x < 5 disebut pertidaksamaan.', true, 'Tidak memakai tanda =.'),
    bs('Pada 2x + 3 = 7, ruas kirinya adalah 2x + 3.', true, 'Yang di sebelah kiri tanda sama dengan.'),
    bs('Penyelesaian persamaan adalah nilai variabel yang membuat persamaan bernilai benar.', true, 'Penyelesaian atau akar.'),
    bs('x = 5 adalah penyelesaian 2x − 3 = 8.', false, '2(5) − 3 = 7, bukan 8.'),
    bs('x = 6 adalah penyelesaian 3x − 8 = 10.', true, '3(6) − 8 = 10.'),
    bs('Untuk x + 4 = 9, kedua ruas dikurangi 4.', true, 'x = 5.'),
    bs('x + 2 = 9 menjadi x = 9 + 2 saat memindahkan 2.', false, 'Seharusnya x = 9 − 2.'),
    bs('Untuk 5x = 20, kedua ruas boleh dibagi 5.', true, 'x = 4.'),
    bs('3(x − 2) = 15 dimulai dengan 3x − 2 = 15.', false, 'Seharusnya 3x − 6 = 15.'),
    bs('Untuk membuktikan x = 3 menyelesaikan 3x + 2 = x + 8, cukup memeriksa satu ruas.', false, 'Kedua ruas harus sama (11 dan 11).'),
    bs('3x + 2 = x + 8 dan 2x + 2 = 8 memiliki penyelesaian yang sama.', true, 'Keduanya x = 3.'),
    bs('Membagi kedua ruas pertidaksamaan dengan bilangan positif tidak mengubah tanda.', true, '5x > 15 menjadi x > 3.'),
    bs('Membagi kedua ruas pertidaksamaan dengan bilangan negatif tidak mengubah tanda.', false, 'Tandanya dibalik.'),
    bs('−2x > 10 memberi x > −5.', false, 'Tanda dibalik: x < −5.', garisbil(-8, 2, { titik: [{ v: -5, l: '−5' }] })),
    bs('−3x ≤ 12 memberi x ≥ −4.', true, 'Tanda dibalik.'),
    bs('Dikali bilangan negatif dua kali berturut-turut, arah tanda kembali seperti semula.', true, 'Dibalik dua kali.'),
    bs('4x − 5 < 3x + 2 setara dengan x < 7.', true, 'Kurangi 3x dan tambah 5.'),
    bs('x = 4 memenuhi 2x + 1 > 8.', true, '9 > 8.'),
  ],
  debat: [
    debat('Dedi dan Eka memindahkan 2 pada x + 2 = 9.', ['Dedi: "x = 9 + 2 = 11."', 'Eka: "x = 9 − 2 = 7."'], 1, 'Memindah ruas membalik operasi.'),
    debat('Gita dan Hadi mengerjakan 3(x − 2) = 15.', ['Gita: "3x − 2 = 15."', 'Hadi: "3x − 6 = 15."'], 1, 'Kalikan ke semua suku.'),
    debat('Ira dan Joni menyelesaikan −2x > 10.', ['Ira: "x > −5."', 'Joni: "x < −5."'], 1, 'Dibagi bilangan negatif, tanda dibalik.', garisbil(-8, 2, { titik: [{ v: -5, l: '−5' }] })),
    debat('Kiki dan Lani menguji x = 3 untuk 3x + 2 = x + 8.', ['Kiki: "Ruas kiri 11, cukup."', 'Lani: "Ruas kanan juga 11, baru terbukti."'], 1, 'Periksa kedua ruas.'),
    debat('Made dan Nia mencari harga awal barang yang setelah diskon 20% Rp80.000.', ['Made: "80.000 + 20% = 96.000."', 'Nia: "0,8p = 80.000, p = 100.000."'], 1, 'Diskon dihitung dari harga awal.'),
    debat('Oka dan Putri menjawab kecepatan maksimal 120 km dalam 3 jam.', ['Oka: "40 km/jam."', 'Putri: "360 km/jam."'], 0, '120 : 3 = 40.'),
  ],
  bank: [
    isi('Pada 4x − 7 = 9, koefisien dari x adalah ...', '4', 'Angka di depan x.'),
    isi('Selesaikan x + 7 = 15.', ['8', 'x=8'], '15 − 7.'),
    isi('Selesaikan x − 6 = 11.', ['17', 'x=17'], '11 + 6.'),
    isi('Selesaikan x + 5 = 12.', ['7', 'x=7'], '12 − 5.'),
    isi('Selesaikan x − 4 = 9.', ['13', 'x=13'], '9 + 4.'),
    isi('Selesaikan x + 9 = 20.', ['11', 'x=11'], '20 − 9.'),
    isi('Selesaikan 3x = 15.', ['5', 'x=5'], '15 : 3.'),
    isi('Selesaikan 4x = 28.', ['7', 'x=7'], '28 : 4.'),
    isi('Selesaikan 5x = 35.', ['7', 'x=7'], '35 : 5.'),
    isi('Jika x/2 = 6, maka x = ...', '12', '6 × 2.'),
    isi('Jika x/3 = 9, maka x = ...', '27', '9 × 3.'),
    isi('Selesaikan 2x + 3 = 11.', ['4', 'x=4'], '2x = 8.', setara({ kb: 2, ku: 3, kn: 11 })),
    isi('Selesaikan 2(x + 3) = 10.', ['2', 'x=2'], '2x + 6 = 10; x = 2.'),
    isi('Selesaikan 3(x − 2) = 15.', ['7', 'x=7'], '3x − 6 = 15; x = 7.'),
    isi('Selesaikan 4(x − 1) = 16.', ['5', 'x=5'], '4x − 4 = 16; x = 5.'),
    isi('Selesaikan 3x + 2 = x + 8.', ['3', 'x=3'], '2x = 6.'),
    isi('Selesaikan 5x − 3 = 2x + 9.', ['4', 'x=4'], '3x = 12.'),
    isi('Selesaikan pertidaksamaan 2x > 8. Ketik seperti x>angka.', ['x>4'], 'x > 4.'),
    isi('Selesaikan pertidaksamaan 4x > 16. Ketik seperti x>angka.', ['x>4'], 'x > 4.'),
    isi('Selesaikan pertidaksamaan 3x ≤ 21. Ketik seperti x<=angka.', ['x<=7', 'x≤7'], 'x ≤ 7.'),
    isi('Selesaikan pertidaksamaan −3x ≤ 12. Ketik seperti x>=angka.', ['x>=-4', 'x≥-4'], 'Tanda dibalik: x ≥ −4.'),
    isi('Persamaan ax + 5 = 17 memiliki penyelesaian x = 4. Berapa a?', ['3', 'a=3'], '4a = 12.'),
    isi('Umur Ayah 3 kali umur Andi, selisih 24 tahun. Berapa tahun umur Ayah?', '36', '2x = 24; x = 12; Ayah 36.'),
    isi('Tiket dewasa 2 kali tiket anak. 3 dewasa + 2 anak = Rp64.000. Berapa rupiah satu tiket anak?', '8000', '8x = 64.000.'),
    isi('Harga awal p, diskon 20%, jadi Rp80.000. Berapa harga awal?', '100000', '0,8p = 80.000.'),
    isi('Sepatu didiskon 25% menjadi Rp150.000. Berapa harga awalnya?', '200000', '0,75p = 150.000.'),
    isi('Jarak maksimal 120 km dalam 3 jam. Berapa kecepatan maksimal (km/jam)?', '40', '120 : 3.'),
    isi('Tangki 200 liter dikuras 15 liter per menit. Setelah berapa menit minimal (bulat) sisa kurang dari 50 liter?', '11', 't > 10, jadi 11.'),
    pg('Apakah x = 2 penyelesaian 3x + 1 = 7?', ['Ya, karena 3(2) + 1 = 7', 'Tidak, hasilnya 9', 'Tidak, hasilnya 5', 'Tidak dapat ditentukan'], 0, 'Substitusi.'),
    pg('Penyelesaian −2x > 10 adalah ...', ['x < −5', 'x > −5', 'x < 5', 'x > 5'], 0, 'Tanda dibalik.'),
    pg('Penyelesaian −4x < 20 adalah ...', ['x > −5', 'x < −5', 'x > 5', 'x < 5'], 0, 'Tanda dibalik.'),
    pg('Nilai x yang memenuhi −2x + 3 > 7 adalah ...', ['x = −3', 'x = 0', 'x = 2', 'x = 5'], 0, '−2x > 4; x < −2.'),
    pg('Bilangan bulat terkecil x yang memenuhi 2x + 1 > 8 adalah ...', ['4', '3', '5', '8'], 0, 'x > 3,5.'),
    pg('Budi punya Rp50.000, buku Rp8.000, sisa minimal Rp10.000. Buku maksimal...', ['5 buku', '6 buku', '4 buku', '7 buku'], 0, '8.000x ≤ 40.000.'),
    pg('Bilangan ganjil terkecil yang memenuhi 2x + 3 > 11 adalah ...', ['5', '4', '3', '7'], 0, 'x > 4.'),
    pg('Siswa: "3(x − 2) = 15 → 3x − 2 = 15." Kesalahannya...', ['3 tidak dikalikan ke −2', 'Salah menjumlah', 'Tidak ada kesalahan', 'Tanda x salah'], 0, '3x − 6.'),
    pg('Siswa menjawab −2x > 10 dengan x > −5. Kesalahannya...', ['Lupa membalik tanda saat membagi bilangan negatif', 'Salah menghitung 10 : 2', 'Tidak ada kesalahan', 'Seharusnya x = −5'], 0, 'x < −5.'),
    pg('Siswa: "4x − 1 = 2x + 7 setara dengan 2x = 8." Penilaian...', ['Benar', 'Salah'], 0, 'Kurangi 2x dan tambah 1.'),
    pg('Siswa: "x = 3 membuat ruas kiri 11, cukup." Penilaian...', ['Salah; ruas kanan juga harus diperiksa', 'Benar'], 0, 'Kedua ruas.'),
    gen('plsvTambah'),
    gen('plsvKali'),
    gen('plsvDua'),
    gen('plsvKurung'),
    gen('plsvDuaRuas'),
    gen('ptlsv'),
    gen('ptlsvNegatif'),
    gen('diskonAwal'),
  ],
}
