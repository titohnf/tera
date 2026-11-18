import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bar, blok, garis, gabung, kolom } from '../gambar'

/**
 * Bahan latihan AC-09 (Tambah-kurang bilangan cacah sampai 1.000).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * istilah (tanda tambah/kurang, jumlah, selisih, kata kunci cerita seperti
 * "sisa" dan "terjual"), MENYIMPAN (simpanan satuan ke puluhan, tulis digit
 * satuannya saja), MENDEKATKAN lupa menyimpan, MEMINJAM (nilai 10 di kolom
 * sebelahnya, puluhan berkurang 1), meminjam melewati angka 0 (704 − 258),
 * salah paham "angka atas lebih kecil, hasilnya 0", perkiraan yang BUKAN jawaban
 * pasti (398 + 503 sekitar 900, tetapi 901), memeriksa dengan operasi kebalikan,
 * cerita satu dan dua langkah, dan merancang soal (bilangan yang hilang).
 *
 * `GEN.tambah3` dan `GEN.kurang3` membuat soal bersusun acak (penjumlahan selalu
 * menyimpan di satuan; pengurangan selalu meminjam sekali) lengkap dengan
 * penjelasan langkahnya dan gambar soal bersusun.
 */
const JS = String.raw`
function digitG(n){return [Math.floor(n/100)%10,Math.floor(n/10)%10,n%10]}
GEN.tambah3=function(){
  var a,b,da,db;
  do{a=rnd(120,480);b=rnd(120,480);da=digitG(a);db=digitG(b)}while(da[2]+db[2]<10||a+b>=1000);
  var s=da[2]+db[2],c1=1,p=da[1]+db[1]+c1,c2=p>=10?1:0,hasil=a+b,tanda=[{kol:2,teks:'1'}];
  if(c2)tanda.push({kol:1,teks:'1'});
  var e='Satuan: '+da[2]+' + '+db[2]+' = '+s+', tulis '+(s%10)+' dan simpan 1. Puluhan: '+da[1]+' + '+db[1]+' + 1 = '+p+(c2?', tulis '+(p%10)+' dan simpan 1':', tulis '+p)+'. Jadi '+hasil+'.';
  return {t:'isi',q:a+' + '+b+' = ...',a:[String(hasil)],e:e,g:{k:'kolom',a:a,b:b,op:'+',tanda:tanda}};
};
GEN.kurang3=function(){
  var a,b,da,db;
  do{a=rnd(300,900);b=rnd(100,a-60);da=digitG(a);db=digitG(b)}while(!(da[2]<db[2]&&da[1]>=1&&da[1]-1>=db[1]&&da[0]>=db[0]));
  var hasil=a-b;
  var e='Satuan '+da[2]+' kurang dari '+db[2]+', pinjam 1 puluhan: '+(da[2]+10)+' − '+db[2]+' = '+(da[2]+10-db[2])+'. Puluhan sekarang '+(da[1]-1)+'. Jadi '+hasil+'. Periksa: '+hasil+' + '+b+' = '+a+'.';
  return {t:'isi',q:a+' − '+b+' = ...',a:[String(hasil)],e:e,g:{k:'kolom',a:a,b:b,op:'-',tanda:[{kol:2,teks:'−1'},{kol:3,teks:'+10'}]}};
};
`

export const DATA_AC09: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Tanda + dibaca "tambah" dan tanda − dibaca "kurang".', true, 'Tambah untuk menggabungkan, kurang untuk mengambil.', gabung('\u{1F4E6}', 3, 2, '+')),
    bs('Hasil dari pengurangan disebut "selisih".', true, '500 − 200 = 300. Angka 300 adalah selisihnya.', kolom(500, 200, '-', { hasil: 300 })),
    bs('Kata "jumlah" dan "seluruhnya" dalam soal cerita biasanya menunjukkan penjumlahan.', true, 'Jumlah dan seluruhnya berarti digabung semua: tambah.', bar([{ l: '150', v: 150 }, { l: '80', v: 80, w: 'hijau' }], 'jumlah = ?')),
    bs('Kata "sisa" dan "terjual" biasanya menunjukkan pengurangan.', true, 'Terjual membuat barang berkurang. Yang tinggal adalah sisa.', bar([{ l: 'terjual 120', v: 120, w: 'merah' }, { l: 'sisa ?', v: 180, w: 'abu' }], 'semula 300')),
    bs('Pada 48 + 27, satuan 8 + 7 = 15, jadi kita tulis 15 di tempat satuan.', false, 'Tempat satuan hanya boleh satu angka. Tulis 5, lalu simpan 1 ke puluhan.', kolom(48, 27, '+', { hasil: 75, tanda: [{ kol: 2, teks: '1' }] })),
    bs('Simpanan dari penjumlahan satuan ditambahkan ke puluhan.', true, 'Simpanan 1 itu adalah 1 puluhan. Jangan dibuang.', kolom(67, 25, '+', { hasil: 92, tanda: [{ kol: 2, teks: '1' }] })),
    bs('Meminjam 1 puluhan berarti puluhan berkurang 1 dan satuan bertambah 10.', true, '1 puluhan dipecah menjadi 10 satuan.', kolom(52, 18, '-', { hasil: 34, tanda: [{ kol: 2, teks: '−1' }, { kol: 3, teks: '+10' }] })),
    bs('Kalau angka atas lebih kecil dari angka bawah pada satu tempat, hasilnya langsung 0.', false, 'Jangan langsung 0. Pinjam 1 dari kolom sebelahnya, lalu kurangi.', kolom(63, 28, '-', { hasil: 35, tanda: [{ kol: 2, teks: '−1' }, { kol: 3, teks: '+10' }] })),
    bs('Pada 703 − 258, puluhan atas adalah 0, jadi pinjam dulu dari ratusan.', true, '0 puluhan tidak bisa dipinjam. Ratusan dipecah menjadi 10 puluhan dulu.', kolom(703, 258, '-', { hasil: 445, tanda: [{ kol: 1, teks: '−1' }, { kol: 2, teks: '+10 −1' }, { kol: 3, teks: '+10' }] })),
    bs('Perkiraan 398 + 503 ≈ 900 berarti hasil pastinya tepat 900.', false, 'Perkiraan hanya untuk mengecek. Hasil pastinya 901.', kolom(398, 503, '+', { hasil: 901, tanda: [{ kol: 2, teks: '1' }, { kol: 1, teks: '1' }] })),
    bs('Penjumlahan 456 + 287 = 743 bisa diperiksa dengan 743 − 287 = 456.', true, 'Penjumlahan dan pengurangan saling berkebalikan.', [kolom(456, 287, '+', { hasil: 743 }), kolom(743, 287, '-', { hasil: 456 })]),
    bs('800 − 350 = 550.', false, 'Puluhan 0 kurang dari 5: pinjam dari ratusan. Hasilnya 450. Periksa: 450 + 350 = 800.', kolom(800, 350, '-', { hasil: 450, tanda: [{ kol: 1, teks: '−1' }, { kol: 2, teks: '+10' }] })),
  ],
  debat: [
    debat('Dito dan Eka menghitung 463 + 289.', ['Dito: "Hasilnya 742. Simpanan dari satuan tidak kupakai di puluhan."', 'Eka: "Hasilnya 752. Puluhan: 6 + 8 + 1 simpanan = 15."'], 1, 'Simpanan harus ikut dijumlahkan di kolom berikutnya. 463 + 289 = 752.', kolom(463, 289, '+', { hasil: 752, tanda: [{ kol: 2, teks: '1' }, { kol: 1, teks: '1' }] })),
    debat('Andi dan Beni menghitung 900 − 450.', ['Andi: "Hasilnya 550. 9 − 4 = 5, 0 − 5 dianggap 0, 0 − 0 = 0."', 'Beni: "Hasilnya 450. Puluhan 0 kurang dari 5, jadi pinjam dari ratusan."'], 1, '0 − 5 tidak boleh dianggap 0. Pinjam dari ratusan: 900 − 450 = 450.', kolom(900, 450, '-', { hasil: 450, tanda: [{ kol: 1, teks: '−1' }, { kol: 2, teks: '+10' }] })),
    debat('Sari dan Dedi menghitung 842 − 576. Satuan 2 kurang dari 6.', ['Sari: "Langsung pinjam dari ratusan."', 'Dedi: "Puluhan 4 masih bisa dipinjam. Pinjam dari puluhan dulu."'], 1, 'Pinjam dari kolom di sebelah kirinya selama masih ada isinya. Puluhan 4 bisa dipinjam.', blok(842, '842')),
    debat('Budi dan Citra memperkirakan 398 + 503.', ['Budi: "Kira-kira 900, jadi hasil pastinya pasti 900."', 'Citra: "900 hanya perkiraan. Hitung dulu hasil pastinya: 901."'], 1, 'Perkiraan dipakai untuk mengecek kewajaran, bukan sebagai jawaban pasti.', kolom(398, 503, '+', { hasil: 901, tanda: [{ kol: 2, teks: '1' }, { kol: 1, teks: '1' }] })),
    debat('Sari dan Toni memeriksa 530 − 275 = 255.', ['Sari: "Periksa dengan menjumlah: 255 + 275 harus 530."', 'Toni: "Pengurangan tidak bisa diperiksa."'], 0, 'Operasi kebalikan dipakai untuk memeriksa. 255 + 275 = 530, cocok.', [kolom(530, 275, '-', { hasil: 255 }), kolom(255, 275, '+', { hasil: 530 })]),
    debat('Made dan Wayan membahas meminjam 1 puluhan (52 − 18).', ['Made: "Nilai yang dipinjam ke satuan adalah 1."', 'Wayan: "Nilainya 10 satuan, karena 1 puluhan = 10 satuan."'], 1, '1 puluhan sama dengan 10 satuan. Satuan 2 jadi 12.', kolom(52, 18, '-', { hasil: 34, tanda: [{ kol: 2, teks: '−1' }, { kol: 3, teks: '+10' }] })),
  ],
  bank: [
    isi('248 + 175 = ...', '423', 'Satuan: 8 + 5 = 13, tulis 3 simpan 1. Puluhan: 4 + 7 + 1 = 12, tulis 2 simpan 1. Ratusan: 2 + 1 + 1 = 4.', kolom(248, 175, '+', { tanda: [{ kol: 2, teks: '1' }, { kol: 1, teks: '1' }] })),
    isi('367 + 285 = ...', '652', 'Satuan: 7 + 5 = 12, tulis 2 simpan 1. Puluhan: 6 + 8 + 1 = 15, tulis 5 simpan 1. Ratusan: 3 + 2 + 1 = 6.', kolom(367, 285, '+')),
    isi('705 − 268 = ...', '437', 'Puluhan 0, jadi pinjam dari ratusan dulu. Satuan 15 − 8 = 7. Puluhan 9 − 6 = 3. Ratusan 6 − 2 = 4.', kolom(705, 268, '-')),
    isi('830 − 457 = ...', '373', 'Satuan: pinjam, 10 − 7 = 3. Puluhan: 2 kurang dari 5, pinjam ratusan, 12 − 5 = 7. Ratusan: 7 − 4 = 3.', kolom(830, 457, '-')),
    isi('600 − 245 = ...', '355', 'Pinjam dari ratusan dua kali: 5 puluhan lalu 10 satuan. 10 − 5 = 5, 9 − 4 = 5, 5 − 2 = 3.', kolom(600, 245, '-')),
    isi('512 − 237 = ...', '275', 'Satuan: pinjam, 12 − 7 = 5. Puluhan: 0 − 3 kurang, pinjam ratusan, 10 − 3 = 7. Ratusan: 4 − 2 = 2.', kolom(512, 237, '-')),
    isi('Gudang punya 450 kotak. Sebanyak 170 kotak dikirim, lalu datang 220 kotak baru. Berapa kotak sekarang?', '500', 'Dua langkah: 450 − 170 = 280. Lalu 280 + 220 = 500.', bar([{ l: '450', v: 450 }, { l: '−170', v: 170, w: 'merah' }, { l: '+220', v: 220, w: 'hijau' }])),
    isi('Toko punya 380 buku. Terjual 145 buku. Berapa sisa buku?', '235', '"Terjual" berarti berkurang: 380 − 145 = 235.', bar([{ l: 'terjual 145', v: 145, w: 'merah' }, { l: 'sisa ?', v: 235, w: 'abu' }], '380 buku')),
    isi('Andi punya 268 kartu. Kakaknya memberi 135 kartu lagi. Berapa jumlah kartu Andi?', '403', '"Jumlah" berarti digabung: 268 + 135 = 403.', bar([{ l: '268', v: 268 }, { l: '135', v: 135, w: 'hijau' }], 'jumlah = ?')),
    isi('Perpustakaan punya 520 buku. Dipinjam 185 buku, lalu menerima 60 buku baru. Berapa buku sekarang?', '395', '520 − 185 = 335. Lalu 335 + 60 = 395.', bar([{ l: '520', v: 520 }, { l: '−185', v: 185, w: 'merah' }, { l: '+60', v: 60, w: 'hijau' }])),
    pg('Manakah penjumlahan yang membutuhkan proses MENYIMPAN?', ['136 + 252', '248 + 135', '401 + 328', '320 + 140'], 1, '8 + 5 = 13: lebih dari 9, jadi simpan 1. Yang lain tiap kolomnya kurang dari 10.'),
    pg('Pada 164 − 59, satuan 4 kurang dari 9. Kita pinjam 1 dari kolom...', ['puluhan', 'ratusan', 'satuan', 'tidak perlu meminjam'], 0, 'Puluhan 6 masih bisa dipinjam. 14 − 9 = 5.', kolom(164, 59, '-', { sorot: 3 })),
    pg('Pada 703 − 258, puluhan atas adalah 0. Langkah pertama yang tepat adalah...', ['pinjam dari ratusan lebih dulu', 'tulis 0 saja', 'tukar bilangan atas dan bawah', 'tambah 258'], 0, 'Puluhan kosong tidak bisa dipinjam. Ratusan dipecah jadi 10 puluhan dulu.', blok(703, '703')),
    pg('Membulatkan ke ratusan terdekat: 212 + 489 kira-kira sama dengan...', ['700', '600', '800', '1.000'], 0, '212 ≈ 200 dan 489 ≈ 500. Jadi 200 + 500 = 700.', garis(400, 500, 10, { lab: 50, titik: [{ v: 489, l: '489' }], busur: [{ dari: 489, ke: 500, l: '≈ 500' }] })),
    pg('Cara yang tepat untuk memeriksa 628 − 359 = 269 adalah...', ['269 + 359 = 628', '628 + 359 = 269', '359 − 269 = 628', '269 + 628 = 359'], 0, 'Pengurangan diperiksa dengan penjumlahan: hasil + yang dikurangkan = bilangan awal.', kolom(628, 359, '-', { hasil: 269 })),
    pg('Kata yang menunjukkan pengurangan dalam soal cerita adalah...', ['sisa', 'jumlah', 'seluruhnya', 'total'], 0, '"Sisa" berarti yang tinggal setelah diambil.', bar([{ l: 'diambil 40', v: 40, w: 'merah' }, { l: 'sisa ?', v: 60, w: 'abu' }], '100')),
    isi('Bilangan pertama 725. Hasil akhir pengurangan TEPAT 400. Berapa bilangan kedua yang dikurangkan?', '325', '725 − 400 = 325. Periksa: 400 + 325 = 725.', bar([{ l: '400', v: 400, w: 'hijau' }, { l: '?', v: 325, w: 'abu' }], '725')),
    isi('Dua barang harganya jika dijumlahkan Rp900. Barang pertama Rp560. Berapa rupiah harga barang kedua?', '340', '900 − 560 = 340.', bar([{ l: '560', v: 560 }, { l: '?', v: 340, w: 'abu' }], 'Rp900')),
    isi('Hasil akhir penjumlahan 950 dan salah satu bilangannya 478. Berapa bilangan lainnya?', '472', '950 − 478 = 472. Periksa: 478 + 472 = 950.', bar([{ l: '478', v: 478 }, { l: '?', v: 472, w: 'abu' }], '950')),
    pg('Sinta menghitung 265 + 48 tetapi lupa menyimpan 1 dari satuan. Akibatnya hasilnya...', ['lebih kecil 10 dari hasil seharusnya', 'lebih besar 10', 'tetap sama', 'lebih kecil 100'], 0, 'Simpanan itu bernilai 1 puluhan = 10. Hasil benar 313, tanpa simpanan 303.', kolom(265, 48, '+', { hasil: 313, tanda: [{ kol: 2, teks: '1' }] })),
    gen('tambah3'),
    gen('tambah3'),
    gen('kurang3'),
    gen('kurang3'),
  ],
}
