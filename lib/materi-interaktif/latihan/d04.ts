import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { diagram, baris } from '../gambar'

/**
 * Bahan latihan D-04 (Data: perumusan pertanyaan, penyajian, dan interpretasi
 * dasar).
 *
 * Konsep yang diuji bank soal topik ini: pertanyaan statistik (jawaban
 * bervariasi antar individu), jenis data (kategorik, numerik diskrit dari
 * menghitung, numerik kontinu dari mengukur), cara mengumpulkan (observasi,
 * angket/survei), memilih diagram (batang untuk membandingkan kategori, garis
 * untuk tren, lingkaran untuk bagian dari 100%, piktogram), membaca data
 * (tertinggi, terendah, selisih, total), piktogram berskala (4,5 x 6 = 27),
 * sumbu tegak yang tidak dimulai dari 0 menyesatkan, rumusan pertanyaan survei
 * yang netral, sampel representatif dan proporsional (10% dari tiap angkatan),
 * dan kesimpulan yang wajar. Salah paham: es krim menyebabkan tenggelam,
 * persen lebih besar berarti jumlah lebih besar, lingkaran selalu terbaik,
 * piktogram harus kelipatan skala, observasi sama dengan angket, menyimpulkan
 * di luar data.
 *
 * `GEN.piktogram`, `GEN.selisihData`, `GEN.totalData`, `GEN.sampelProp`,
 * `GEN.persenJumlah`.
 */
const JS = String.raw`
GEN.piktogram=function(){
  var per=[2,4,5,6,8,10][rnd(0,5)],n=rnd(2,7)+(rnd(0,1)?0.5:0),tot=per*n,E=['🍎','📚','☂️'],e=E[rnd(0,2)];
  return {t:'isi',q:'Pada piktogram, satu simbol mewakili '+per+' buah. Tergambar '+String(n).replace('.',',')+' simbol. Berapa buah yang diwakili?',a:[String(tot).replace('.',',')],e:String(n).replace('.',',')+' x '+per+' = '+String(tot).replace('.',',')+'.',g:{k:'baris',baris:[{e:e,n:Math.ceil(n),l:'1 simbol = '+per}]}};
};
GEN.selisihData=function(){
  var a=[],i;for(i=0;i<5;i++)a.push(rnd(40,99));
  var mx=Math.max.apply(null,a),mn=Math.min.apply(null,a),L=['Sen','Sel','Rab','Kam','Jum'];
  return {t:'isi',q:'Nilai ulangan 5 siswa: '+a.join(', ')+'. Berapa selisih nilai tertinggi dan terendah?',a:[String(mx-mn)],e:mx+' - '+mn+' = '+(mx-mn)+'.',g:{k:'diagram',d:a.map(function(v,j){return {l:'S'+(j+1),v:v}}),lo:0,hi:100,langkah:20,nilai:true}};
};
GEN.totalData=function(){
  var a=[],i,s=0;for(i=0;i<5;i++){var v=rnd(8,60);a.push(v);s+=v}
  var L=['Sen','Sel','Rab','Kam','Jum'];
  return {t:'isi',q:'Pengunjung perpustakaan selama 5 hari: '+a.join(', ')+'. Berapa total pengunjung?',a:[String(s)],e:a.join(' + ')+' = '+s+'.',g:{k:'diagram',d:a.map(function(v,j){return {l:L[j],v:v}}),lo:0,hi:60,langkah:20,nilai:true}};
};
GEN.sampelProp=function(){
  var P=[10,15,20,25],p=P[rnd(0,3)],n=rnd(5,20)*20;
  return {t:'isi',q:'Sebuah dusun berpenduduk '+n+' warga. Survei memakai sampel proporsional '+p+'%. Berapa warga yang diambil?',a:[String(n*p/100).replace('.',',')],e:p+'% x '+n+' = '+String(n*p/100).replace('.',',')+'.'};
};
GEN.persenJumlah=function(){
  var A=[10,20,30,40][rnd(0,3)],pa=[80,90,60][rnd(0,2)],B=A*rnd(4,10),pb=[50,60,70][rnd(0,2)];
  return {t:'isi',q:'Sekolah A: '+pa+'% dari '+A+' peserta lulus. Sekolah B: '+pb+'% dari '+B+' peserta lulus. Berapa siswa lulus di Sekolah B?',a:[String(B*pb/100).replace('.',',')],e:pb+'% x '+B+' = '+String(B*pb/100).replace('.',',')+'. (A: '+(A*pa/100)+' siswa; persen besar belum tentu jumlah besar.)'};
};
`

export const DATA_D04: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Pertanyaan statistik adalah pertanyaan yang jawabannya diharapkan bervariasi antar individu.', true, 'Contoh: berapa lama tiap siswa sampai ke sekolah?'),
    bs('"Berapa 4 + 5?" adalah pertanyaan statistik.', false, 'Jawabannya selalu 9, tidak bervariasi.'),
    bs('Data warna favorit siswa adalah data kategorik.', true, 'Berupa label, bukan angka hasil ukur.'),
    bs('Data tinggi badan dalam cm termasuk numerik kontinu.', true, 'Hasil mengukur, bisa desimal.'),
    bs('Jumlah saudara kandung tiap siswa adalah data numerik diskrit.', true, 'Hasil menghitung, selalu bilangan bulat.'),
    bs('Data berat badan adalah data diskrit karena angka.', false, 'Berat diukur dan bisa desimal: kontinu.'),
    bs('Observasi dan angket adalah cara mengumpulkan data yang persis sama.', false, 'Observasi mengamati langsung; angket mengajukan pertanyaan.'),
    bs('Angket (kuesioner) adalah daftar pertanyaan tertulis untuk responden.', true, 'Itu cara survei.'),
    bs('Diagram batang cocok untuk membandingkan jumlah antar kategori yang terpisah.', true, 'Misalnya peminat 4 ekstrakurikuler.', diagram([{ l: 'Pramuka', v: 30 }, { l: 'Basket', v: 22 }, { l: 'Musik', v: 18 }, { l: 'Robot', v: 25 }], { lo: 0, hi: 40, langkah: 10, nilai: true })),
    bs('Diagram garis cocok untuk perubahan data dari waktu ke waktu.', true, 'Misalnya suhu 7 hari berturut-turut.'),
    bs('Diagram lingkaran cocok untuk bagian dari keseluruhan 100%.', true, 'Misalnya persentase jenis kendaraan.'),
    bs('Diagram lingkaran selalu pilihan terbaik untuk semua data.', false, 'Jenis diagram mengikuti jenis data dan tujuannya.'),
    bs('Piktogram cocok untuk membedakan tepat 137 dan 138 siswa.', false, 'Piktogram memberi gambaran, kurang tepat untuk selisih satu satuan.'),
    bs('Jika 1 simbol = 6 buku, 4,5 simbol mewakili 27 buku.', true, '4,5 × 6 = 27.', baris([{ e: '📚', n: 5, l: '1 simbol = 6' }])),
    bs('Piktogram tidak bisa dipakai bila jumlah data bukan kelipatan skala.', false, 'Boleh memakai simbol setengah atau seperempat.'),
    bs('Diagram batang dengan sumbu tegak dimulai dari 90 dan data 92 sampai 98 bisa menyesatkan.', true, 'Selisih kecil tampak besar.', diagram([{ l: 'A', v: 92 }, { l: 'B', v: 98 }, { l: 'C', v: 95 }], { lo: 90, hi: 100, langkah: 2, nilai: true })),
    bs('Sumbu tegak yang dimulai dari 0 membuat tinggi batang sebanding dengan nilainya.', true, 'Itu cara yang jujur.'),
    bs('Menanyakan "kantin yang murah dan enak ini sebaiknya buka lebih lama, setuju?" adalah pertanyaan netral.', false, 'Kata "murah dan enak" mengarahkan jawaban.'),
    bs('Mewawancarai 10 siswa yang kebetulan lewat sudah mewakili seluruh siswa sekolah.', false, 'Sampel kecil dan belum tentu mewakili.'),
    bs('80% dari 20 peserta lulus lebih banyak daripada 75% dari 200 peserta lulus.', false, '16 siswa lawan 150 siswa.'),
    bs('Penjualan es krim naik bersama kejadian tenggelam, jadi es krim menyebabkan tenggelam.', false, 'Keduanya naik karena musim panas; berhubungan belum tentu sebab-akibat.'),
    bs('Data penjualan 5 hari boleh dipakai untuk memastikan penjualan setiap akhir pekan.', false, 'Jangan menyimpulkan di luar data.'),
  ],
  debat: [
    debat('Dedi dan Eka menilai diagram batang sepatu 45, 50, 48 dengan sumbu mulai dari 40.', ['Dedi: "Merek B jauh lebih laris."', 'Eka: "Selisihnya hanya 5; sumbu terpotong membesarkannya."'], 1, 'Mulai sumbu dari 0.', diagram([{ l: 'A', v: 45 }, { l: 'B', v: 50 }, { l: 'C', v: 48 }], { lo: 40, hi: 55, langkah: 5, nilai: true })),
    debat('Gita dan Hadi membaca piktogram (1 simbol = 6 buku) dengan 4,5 simbol.', ['Gita: "4,5 × 6 = 24 buku."', 'Hadi: "4,5 × 6 = 27 buku."'], 1, '4 × 6 = 24 ditambah setengah simbol 3.'),
    debat('Ira dan Joni membandingkan Sekolah A (80% dari 20) dan B (75% dari 200).', ['Ira: "A lebih banyak lulusan, 80% > 75%."', 'Joni: "A 16 siswa, B 150 siswa."'], 1, 'Kalikan persen dengan jumlah peserta.'),
    debat('Kiki dan Lani membahas es krim dan tenggelam.', ['Kiki: "Es krim menyebabkan tenggelam."', 'Lani: "Keduanya naik karena musim panas."'], 1, 'Berhubungan belum tentu sebab-akibat.'),
    debat('Made dan Nia memilih diagram untuk pengunjung perpustakaan tiap minggu setahun.', ['Made: "Diagram lingkaran, bisa dijadikan persen."', 'Nia: "Diagram garis, karena berurutan waktu."'], 1, 'Data waktu cocok diagram garis.'),
    debat('Oka dan Putri merancang sampel survei OSIS.', ['Oka: "Siswa kelas 9 di dekat ruang OSIS saja."', 'Putri: "10% proporsional dari tiap angkatan."'], 1, 'Sampel harus mewakili semua kelompok.'),
  ],
  bank: [
    isi('Pertanyaan yang jawabannya bervariasi antar individu disebut pertanyaan ...', ['statistik'], 'Perlu data untuk menjawabnya.'),
    isi('Data warna favorit termasuk data ... (kategorik / numerik)', ['kategorik'], 'Berupa label.'),
    isi('Data jumlah saudara kandung termasuk numerik ... (diskrit / kontinu)', ['diskrit'], 'Dihitung, bilangan bulat.'),
    isi('Data tinggi badan termasuk numerik ... (diskrit / kontinu)', ['kontinu'], 'Diukur, bisa desimal.'),
    isi('Mengamati langsung kejadian tanpa bertanya disebut ...', ['observasi'], 'Itu observasi.'),
    isi('Daftar pertanyaan tertulis kepada responden disebut ... (kuesioner)', ['angket'], 'Angket atau kuesioner.'),
    isi('Diagram yang memakai gambar untuk mewakili jumlah disebut ...', ['piktogram'], 'Satu simbol mewakili sekian data.'),
    isi('Diagram berbentuk lingkaran disebut diagram ...', ['lingkaran'], 'Menunjukkan bagian dari keseluruhan.'),
    isi('Warna favorit 20 siswa: Merah 6, Biru 5, Hijau 4, Kuning 5. Berapa siswa memilih merah atau biru?', '11', '6 + 5 = 11.', diagram([{ l: 'Merah', v: 6, w: 'merah' }, { l: 'Biru', v: 5, w: 'biru' }, { l: 'Hijau', v: 4, w: 'hijau' }, { l: 'Kuning', v: 5, w: 'kuning' }], { lo: 0, hi: 8, langkah: 2, nilai: true })),
    isi('Nilai: Andi 80, Budi 75, Citra 90, Dewi 85, Eka 70. Berapa selisih nilai tertinggi dan terendah?', '20', '90 - 70 = 20.'),
    isi('Penjualan buku: Senin 15, Selasa 20, Rabu 12, Kamis 25. Berapa total buku terjual?', '72', '15 + 20 + 12 + 25 = 72.', diagram([{ l: 'Sen', v: 15 }, { l: 'Sel', v: 20 }, { l: 'Rab', v: 12 }, { l: 'Kam', v: 25 }], { lo: 0, hi: 30, langkah: 10, nilai: true })),
    isi('Satu simbol apel mewakili 5 apel. Tergambar 4 simbol. Berapa apel?', '20', '4 × 5 = 20.'),
    isi('Satu simbol payung mewakili 4 payung. Tergambar 3,5 simbol. Berapa payung?', '14', '3,5 × 4 = 14.'),
    isi('Satu simbol buku mewakili 6 buku. Tergambar 3 simbol. Berapa buku?', '18', '3 × 6 = 18.'),
    isi('Satu simbol buku mewakili 6 buku. Tergambar 4,5 simbol. Berapa buku?', '27', '4,5 × 6 = 27.'),
    isi('Sampel proporsional 10% dari 300 siswa kelas 7. Berapa siswa diambil?', '30', '10% × 300 = 30.'),
    isi('Sampel proporsional 15% dari 240 warga. Berapa warga diambil?', '36', '0,15 × 240 = 36.'),
    isi('Sekolah 300, 280, 260 siswa; sampel proporsional 10%. Berapa total sampel?', '84', '30 + 28 + 26 = 84.'),
    isi('Sumbu tegak diagram sepatu dimulai dari 40. Merek A = 45, B = 50, C = 48. Berapa selisih penjualan B dan A?', '5', '50 - 45 = 5.', diagram([{ l: 'A', v: 45 }, { l: 'B', v: 50 }, { l: 'C', v: 48 }], { lo: 40, hi: 55, langkah: 5, nilai: true })),
    isi('Kunjungan seminggu: 45, 38, 50, 42, 60, 20, 15. Berapa total kunjungan?', '270', '45+38+50+42+60+20+15 = 270.'),
    isi('Suhu 5 hari: 28, 30, 27, 31, 29. Berapa selisih suhu tertinggi dan terendah?', '4', '31 - 27 = 4.'),
    pg('Manakah pertanyaan statistik?', ['Berapa lama waktu tiap siswa sampai ke sekolah?', 'Berapa jumlah hari dalam seminggu?', 'Berapa 12 × 3?', 'Apa ibu kota Indonesia?'], 0, 'Jawabannya bervariasi antar siswa.'),
    pg('Untuk membandingkan peminat 4 ekstrakurikuler, diagram yang paling sesuai...', ['Diagram batang', 'Diagram garis', 'Diagram lingkaran', 'Tidak perlu diagram'], 0, 'Batang membandingkan kategori.'),
    pg('Untuk perubahan suhu kota 7 hari berturut-turut, diagram yang paling sesuai...', ['Diagram garis', 'Diagram batang', 'Diagram lingkaran', 'Piktogram'], 0, 'Garis menunjukkan tren waktu.'),
    pg('Untuk persentase jenis kendaraan ke sekolah dari seluruh siswa...', ['Diagram lingkaran', 'Diagram garis', 'Piktogram', 'Tabel saja'], 0, 'Bagian dari 100%.'),
    pg('Kombinasi (jenis data, diagram) yang paling sesuai...', ['Olahraga favorit (kategorik) dan diagram batang', 'Suhu tiap jam dan diagram lingkaran', 'Warna favorit dan diagram garis', 'Tinggi badan dan piktogram'], 0, 'Kategorik dibandingkan dengan batang.'),
    pg('Siswa menghitung 4,5 × 6 = 24 untuk piktogram. Penilaian...', ['Keliru; 4,5 × 6 = 27', 'Benar'], 0, '4,5 × 6 = 27.'),
    pg('Diagram sepatu dengan sumbu mulai dari 40 (data 45 sampai 50) menimbulkan kesan...', ['selisih tampak lebih besar daripada sebenarnya', 'selisih tampak lebih kecil', 'tidak berpengaruh', 'data hilang'], 0, 'Sumbu terpotong.'),
    pg('Cara memperbaiki diagram dengan sumbu terpotong...', ['Mulai sumbu dari 0 dan skala konsisten', 'Mulai dari angka terkecil', 'Hapus judul', 'Perkecil batang'], 0, 'Batang harus sebanding nilainya.'),
    pg('Pertanyaan survei yang paling tepat tentang ekstrakurikuler...', ['Ekskul apa yang paling ingin kamu ikuti tahun depan? (pilih satu)', 'Bukankah ekskul pramuka paling seru?', 'Apa kamu suka sekolah?', 'Ekskul mana yang menurut guru bagus?'], 0, 'Jelas, netral, datanya bisa dibandingkan.'),
    pg('OSIS hanya menyurvei siswa kelas 9 di dekat ruang OSIS. Masalahnya...', ['Tidak mewakili kelas 7 dan 8', 'Terlalu banyak sampel', 'Tidak ada masalah', 'Pertanyaannya terlalu panjang'], 0, 'Sampel tidak representatif.'),
    pg('Sekolah A 80% dari 20 lulus; B 75% dari 200 lulus. Yang benar...', ['B punya lulusan lebih banyak', 'A punya lulusan lebih banyak', 'Sama banyak', 'Tidak dapat dihitung'], 0, '16 lawan 150.'),
    pg('Siswa: "Es krim menyebabkan tenggelam." Penilaian...', ['Keliru; keduanya naik karena musim panas', 'Benar'], 0, 'Korelasi bukan sebab.'),
    pg('Siswa memilih diagram lingkaran untuk pengunjung 52 minggu. Penilaian...', ['Kurang tepat; data waktu cocok diagram garis', 'Tepat sekali'], 0, 'Lingkaran untuk bagian dari keseluruhan.'),
    pg('"Jumat tertinggi, jadi tiap akhir pekan pasti terlaku." Penilaian...', ['Keliru; data belum mencakup akhir pekan', 'Benar'], 0, 'Jangan keluar dari data.'),
    gen('piktogram'),
    gen('selisihData'),
    gen('totalData'),
    gen('sampelProp'),
    gen('persenJumlah'),
  ],
}
