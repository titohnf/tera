import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { pola, tabel } from '../gambar'

/**
 * Bahan latihan AC-12 (Pola gambar dan bilangan sederhana; tambah-kurang
 * sampai 100).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * pengertian pola, pola gambar berulang dan posisi ke-n lewat KELOMPOK
 * berulang (ke-25 pada kelompok 5 sama dengan ke-5; sisa pembagian menentukan
 * posisi), pola bilangan dengan selisih tetap (naik dan turun), pola
 * BERGANTIAN (+4 lalu -3), pola dengan selisih yang BERTAMBAH (+2, +3, +4),
 * suku ke-n ("jumlahkan sebanyak n - 1 kali"), tabel posisi-nilai, cerita
 * pola (menabung, parkir), merancang pola dari syarat (mencapai tepat 50 pada
 * suku keempat), dan salah paham: "cukup lihat satu bilangan terakhir", "suku
 * ke-8 cukup dikira-kira", "2, 4, 8, 16 berselisih tetap", "pola menurun selalu
 * positif".
 *
 * `GEN.lanjut` dan `GEN.sukuN` membuat soal acak (bilangan berikutnya dan suku
 * ke-n) lengkap dengan penjelasan dan gambar.
 */
const JS = String.raw`
GEN.lanjut=function(){
  var d=rnd(3,15)*(rnd(0,1)?1:-1),a=d>0?rnd(5,60):rnd(70,140),t=[],i;
  for(i=0;i<5;i++)t.push(a+i*d);
  var tok=t.slice(0,4).map(String);tok.push('0');
  var e='Selisihnya '+(d>0?'+'+d:'−'+(-d))+' setiap langkah. '+t[3]+(d>0?' + ':' − ')+Math.abs(d)+' = '+t[4]+'.';
  return {t:'isi',q:'Lengkapi pola: '+t.slice(0,4).join(', ')+', □. Berapa bilangan berikutnya?',a:[String(t[4])],e:e,g:{k:'pola',s:tok,hilang:[4]}};
};
GEN.sukuN=function(){
  var a=rnd(3,15),d=rnd(3,9),n=rnd(6,10),ans=a+(n-1)*d;
  return {t:'isi',q:'Pola '+a+', '+(a+d)+', '+(a+2*d)+', '+(a+3*d)+', ... Berapa bilangan pada posisi ke-'+n+'?',a:[String(ans)],e:'Selisihnya '+d+'. Dari posisi 1 ke posisi '+n+' ada '+(n-1)+' langkah: '+a+' + '+(n-1)+' × '+d+' = '+ans+'.',g:{k:'tabel',baris:[['posisi',1,2,3,4,n],['nilai',a,a+d,a+2*d,a+3*d,'?']]}};
};
`

const u3 = ['lingkaran', 'lingkaran', 'segitiga']

export const DATA_AC12: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Susunan bilangan atau gambar yang berulang atau berubah mengikuti aturan tertentu disebut pola.', true, 'Pola punya aturan yang bisa ditemukan.', pola(['merah', 'biru', 'merah', 'biru'])),
    bs('Pada pola 100, 90, 80, 70, aturannya berkurang 10 setiap langkah.', true, '100 − 10 = 90, 90 − 10 = 80, 80 − 10 = 70.', pola(['100', '90', '80', '70'])),
    bs('Pola 4, 8, 12, 16 dan pola 2, 6, 10, 14 sama-sama bertambah 4 setiap langkah, walau bilangan awalnya berbeda.', true, 'Aturannya sama (+4). Yang berbeda hanya bilangan pertamanya.', [pola(['4', '8', '12', '16']), pola(['2', '6', '10', '14'])]),
    bs('Untuk menentukan bilangan berikutnya, cukup melihat satu bilangan terakhir saja.', false, 'Kita perlu tahu selisih atau aturannya, jadi lihat paling sedikit dua bilangan.', pola(['5', '9', '6', '10', '7', '0'], [5])),
    bs('Pada pola gambar yang berulang setiap 5 gambar, gambar ke-25 sama dengan gambar ke-5.', true, '25 : 5 = 5 tanpa sisa, jadi gambar ke-25 adalah gambar terakhir dalam kelompok, sama dengan ke-5.', pola(['bunga', 'bunga', 'daun', 'daun', 'matahari'])),
    bs('Pada pola lingkaran, persegi, lingkaran, persegi, ..., gambar ke-9 adalah lingkaran.', true, 'Gambar bernomor ganjil adalah lingkaran: ke-1, ke-3, ..., ke-9.', pola(['lingkaran', 'persegi', 'lingkaran', 'persegi', 'lingkaran', 'persegi', 'lingkaran', 'persegi', 'lingkaran'], [], 9)),
    bs('Pola 2, 4, 8, 16 mempunyai selisih yang tetap.', false, 'Selisihnya +2, +4, +8: tidak tetap. Aturannya dikali 2.', pola(['2', '4', '8', '16'])),
    bs('Pola 30, 27, 24, 21 akan terus menghasilkan bilangan positif tanpa batas.', false, 'Terus dikurangi 3, lama-lama sampai 0, lalu di bawah 0.', pola(['30', '27', '24', '21'])),
    bs('Untuk mencari suku ke-10 dari pola 5, 8, 11, 14, jumlahkan 3 sebanyak 9 kali ke bilangan pertama.', true, 'Dari suku ke-1 ke suku ke-10 ada 9 langkah. 5 + 9 × 3 = 32.', tabel([['posisi', 1, 2, 3, 4, 10], ['nilai', 5, 8, 11, 14, '?']])),
    bs('Pola 5, 9, 6, 10, 7, 11 bergantian +4 lalu −3.', true, '5 + 4 = 9, 9 − 3 = 6, 6 + 4 = 10, 10 − 3 = 7.', pola(['5', '9', '6', '10', '7', '11'])),
    bs('Pola 2, 4, 7, 11, 16 mempunyai selisih yang bertambah 1 setiap langkah.', true, 'Selisihnya +2, +3, +4, +5.', pola(['2', '4', '7', '11', '16'])),
    bs('Menebak bilangan ke-8 dengan mengira-ngira "mendekati" sudah cukup.', false, 'Hitung dengan aturan pola: bilangan pertama + 7 kali selisih.'),
  ],
  debat: [
    debat('Doni dan Eka mencari bilangan posisi ke-8 dari pola 4, 9, 14, 19.', ['Doni: "44, karena bilangannya sudah cukup besar."', 'Eka: "39. Dari posisi 1 ke 8 ada 7 langkah: 4 + 7 × 5 = 39."'], 1, 'Jangan menebak. Pakai aturan: +5 sebanyak 7 kali dari bilangan pertama.', tabel([['posisi', 1, 2, 3, 4, 8], ['nilai', 4, 9, 14, 19, '?']])),
    debat('Rani dan Beni membahas pola 2, 4, 8, 16.', ['Rani: "Bertambah 2, lalu 4, lalu 8. Jadi selisihnya tetap."', 'Beni: "Selisihnya berubah-ubah. Aturannya dikali 2."'], 1, '2 × 2 = 4, 4 × 2 = 8, 8 × 2 = 16. Selisih tetap hanya untuk pola tambah atau kurang yang sama.', pola(['2', '4', '8', '16'])),
    debat('Wulan dan Tono membahas pola gambar yang berulang setiap 5 gambar.', ['Wulan: "Gambar ke-25 sama dengan gambar ke-5, karena 25 habis dibagi 5."', 'Tono: "Tidak bisa dipastikan, harus digambar semuanya."'], 0, 'Kelompok 5 gambar berulang. Posisi 5, 10, 15, 20, 25 semuanya gambar terakhir dalam kelompok.', pola(['bunga', 'bunga', 'daun', 'daun', 'matahari'])),
    debat('Kiki dan Sari mencari gambar ke-7 pada pola lingkaran, lingkaran, segitiga, lingkaran, lingkaran, segitiga.', ['Kiki: "Aku gambar satu per satu sampai ke-7."', 'Sari: "Satu kelompok ada 3 gambar. 7 = 2 × 3 + 1, jadi sama dengan gambar ke-1: lingkaran."'], 1, 'Cara terbaik adalah memakai kelompok berulang dan sisa pembagiannya.', pola([...u3, ...u3, 'lingkaran'], [], 7)),
    debat('Rudi dan Lina mencari suku ke-8 dari pola 6, 11, 16, 21.', ['Rudi: "6 + 8 × 5 = 46."', 'Lina: "6 + 7 × 5 = 41, karena dari suku ke-1 ke suku ke-8 ada 7 langkah."'], 1, 'Suku pertama sudah ada, jadi langkahnya n − 1.', tabel([['posisi', 1, 2, 3, 4, 8], ['nilai', 6, 11, 16, 21, '?']])),
    debat('Sinta dan Dedi membahas pola 30, 27, 24, 21.', ['Sinta: "Pasti positif terus."', 'Dedi: "Suatu saat jadi 0, lalu di bawah 0."'], 1, 'Pola yang terus dikurangi akhirnya melewati 0.', pola(['30', '27', '24', '21'])),
  ],
  bank: [
    isi('Lengkapi pola: 45, 50, 55, □, 65. Berapa bilangan yang hilang?', '60', 'Bertambah 5. 55 + 5 = 60.', pola(['45', '50', '55', '0', '65'], [3])),
    isi('Lengkapi pola: 24, 36, 48, □, 72. Berapa bilangan yang hilang?', '60', 'Bertambah 12. 48 + 12 = 60.', pola(['24', '36', '48', '0', '72'], [3])),
    isi('Lengkapi pola: 140, 130, 120, □. Berapa bilangan berikutnya?', '110', 'Berkurang 10. 120 − 10 = 110.', pola(['140', '130', '120', '0'], [3])),
    isi('Pola 150, 138, 126, □ berkurang 12 setiap langkah. Berapa bilangan berikutnya?', '114', '126 − 12 = 114.', pola(['150', '138', '126', '0'], [3])),
    isi('Lengkapi pola: 200, 185, 170, □. Berapa bilangan berikutnya?', '155', 'Berkurang 15. 170 − 15 = 155.', pola(['200', '185', '170', '0'], [3])),
    isi('Sebuah pola dimulai dari 3 dengan aturan bergantian "+5" lalu "+2". Berapa bilangan KEEMPAT?', '15', '3, lalu +5 = 8, lalu +2 = 10, lalu +5 = 15.', pola(['3', '8', '10', '0'], [3])),
    isi('Pola 6, 10, 7, 11, 8, 12, □ bergantian "+4" lalu "−3". Berapa bilangan berikutnya?', '9', 'Setelah 12 (hasil +4) datang −3: 12 − 3 = 9.', pola(['6', '10', '7', '11', '8', '12', '0'], [6])),
    isi('Pola 3, 5, 8, 12, 17, □ selisihnya bertambah 1 setiap langkah. Berapa bilangan berikutnya?', '23', 'Selisihnya +2, +3, +4, +5, lalu +6. 17 + 6 = 23.', pola(['3', '5', '8', '12', '17', '0'], [5])),
    isi('Pola 4, 7, 10, 13, ... Berapa bilangan pada posisi ke-9?', '28', 'Selisihnya 3. Dari posisi 1 ke 9 ada 8 langkah: 4 + 8 × 3 = 28.', tabel([['posisi', 1, 2, 3, 4, 9], ['nilai', 4, 7, 10, 13, '?']])),
    isi('Pola 6, 13, 20, 27, ... Berapa bilangan pada posisi ke-6?', '41', 'Selisihnya 7. Ada 5 langkah: 6 + 5 × 7 = 41.', tabel([['posisi', 1, 2, 3, 4, 6], ['nilai', 6, 13, 20, 27, '?']])),
    isi('Buatlah pola yang dimulai dari 8 dengan aturan bertambah 6 setiap langkah. Berapa bilangan pada posisi ke-5?', '32', '8, 14, 20, 26, 32.'),
    isi('Kamu membuat pola menurun yang dimulai dari 100 dan mencapai TEPAT 55 pada suku keenam. Berapa selisih (pengurangan) tiap langkah?', '9', 'Dari suku ke-1 ke suku ke-6 ada 5 langkah. 100 − 55 = 45, lalu 45 : 5 = 9.'),
    isi('Sebuah gedung parkir menambah 4 mobil setiap 10 menit. Pada menit ke-0 ada 12 mobil. Berapa mobil pada menit ke-30?', '24', 'Dalam 30 menit ada 3 kali tambah 4: 12 + 3 × 4 = 24.', pola(['12', '16', '20', '0'], [3])),
    isi('Rina menabung tiap minggu dengan pola: minggu 1 Rp8.000, minggu 2 Rp16.000, minggu 3 Rp24.000. Berapa ribu rupiah tabungannya pada minggu ke-5?', ['40', '40000'], 'Bertambah 8 ribu tiap minggu. Minggu 4 = 32, minggu 5 = 40.', tabel([['minggu', 1, 2, 3, 5], ['Rp ribu', 8, 16, 24, '?']])),
    isi('Kamu membuat pola dimulai dari 2 dengan selisih bertambah 2 setiap langkah (+2, +4, +6, ...). Berapa bilangan KELIMA?', '22', '2, 4, 8, 14, 22.', pola(['2', '4', '8', '14', '0'], [4])),
    isi('Pola gambar lingkaran, lingkaran, segitiga berulang. Jika dilanjutkan sampai gambar ke-12, berapa banyak segitiga?', '4', 'Kelompok 3 gambar. 12 : 3 = 4 kelompok, tiap kelompok 1 segitiga.', pola([...u3, ...u3, ...u3, ...u3], [], 6)),
    pg('Pola gambar: matahari, bulan, bulan, matahari, bulan, bulan, ... Gambar ke-11 adalah...', ['bulan', 'matahari', 'bintang', 'awan'], 0, 'Kelompok 3 gambar. 11 = 3 × 3 + 2, jadi sama dengan gambar ke-2 dalam kelompok: bulan.', pola(['matahari', 'bulan', 'bulan', 'matahari', 'bulan', 'bulan', 'matahari', 'bulan', 'bulan'], [], 9)),
    pg('Aturan pola pada 7, 14, 21, 28 adalah...', ['bertambah 7', 'bertambah 14', 'dikali 7', 'bertambah 6'], 0, '14 − 7 = 7, 21 − 14 = 7, 28 − 21 = 7.', pola(['7', '14', '21', '28'])),
    pg('Kelompok berulang pada pola persegi, persegi, lingkaran, persegi, persegi, lingkaran adalah...', ['persegi, persegi, lingkaran', 'persegi, lingkaran', 'lingkaran, persegi', 'persegi, persegi'], 0, 'Bagian terkecil yang berulang utuh adalah persegi, persegi, lingkaran.', pola(['persegi', 'persegi', 'lingkaran', 'persegi', 'persegi', 'lingkaran'])),
    pg('Mengapa mengira-ngira bilangan pada posisi ke-8 itu tidak tepat?', ['karena harus dihitung dengan aturan polanya', 'karena suku ke-8 selalu 44', 'karena bilangan besar boleh ditebak', 'karena pola tidak punya aturan'], 0, 'Pola punya aturan, jadi suku ke-n bisa dihitung dengan pasti.'),
    pg('Tabel: posisi 1 → 7, posisi 2 → 12, posisi 3 → 17, posisi 4 → 22. Berapa nilai pada posisi 6?', ['32', '27', '37', '30'], 0, 'Selisihnya 5. Dari posisi 1 ke 6 ada 5 langkah: 7 + 5 × 5 = 32.', tabel([['posisi', 1, 2, 3, 4, 6], ['nilai', 7, 12, 17, 22, '?']])),
    pg('Aturan manakah yang, jika dimulai dari 10, menghasilkan bilangan KETIGA sama dengan 22?', ['bertambah 6', 'bertambah 4', 'bertambah 12', 'dikali 2'], 0, '10, 16, 22. Bertambah 6 membuat suku ketiga 22.'),
    gen('lanjut'),
    gen('lanjut'),
    gen('sukuN'),
    gen('sukuN'),
  ],
}
