import { bs, debat, gen, isi, pg, type DataMateri } from '../bersama'
import { bar, penggaris, tabel, takar, timbangan, ubah } from '../gambar'

/**
 * Bahan latihan AC-15 (Satuan baku panjang, volume, dan berat).
 *
 * Konsep yang diuji bank soal topik ini (dibaca dari `question_bank_items`):
 * satuan baku yang PAS untuk tiap benda (cm untuk pensil, kg untuk semangka,
 * gram untuk telur, ton untuk truk, km untuk jarak, liter untuk cairan), hasil
 * ukur harus disertai SATUAN, hubungan antarsatuan (1 km = 1.000 m, 1 m =
 * 100 cm, 1 kg = 1.000 g, 1 liter = 1.000 ml, 1 ton = 1.000 kg), arah ubah
 * (besar ke kecil dikali, kecil ke besar dibagi; cara pintas geser koma
 * berlaku untuk panjang, berat, dan volume), konversi DUA langkah (mm ke m,
 * km ke cm, ton ke gram), membandingkan setelah menyamakan satuan, serta
 * menjumlah dan mengurang ukuran berbeda satuan. Salah paham yang diuji: angka
 * besar berarti ukuran besar (3 kg dianggap lebih ringan dari 500 g), 3 km =
 * 300 m (salah faktor), dan satuan lupa ditulis. Ada pula soal "kamu merancang
 * soal" (kerja mundur dari jawaban yang diinginkan).
 *
 * `GEN.ubah` soal ubah satuan acak (dua arah, kadang desimal), `GEN.gabung`
 * jumlah atau selisih kg dan g, `GEN.banding` membandingkan kg dengan g.
 * Jawaban desimal ditulis dengan koma (penilai membuang titik dan spasi).
 */
const JS = String.raw`
GEN.ubah=function(){
  var T=[['km','m',1000],['kg','g',1000],['liter','ml',1000],['m','cm',100],['ton','kg',1000],['cm','mm',10]],t=T[rnd(0,5)],f=t[2];
  var base=rnd(1,9),h=rnd(0,1)?rnd(1,9):0,tampil=base+(h?','+h:''),v=(base*10+h)*f/10,turun=rnd(0,1)===1,q,a,e,g;
  if(turun){
    q=tampil+' '+t[0]+' sama dengan berapa '+t[1]+'?';a=String(v);
    e=tampil+' × '+fmtId(f)+' = '+fmtId(v)+'. '+t[1]+' satuan yang lebih kecil, jadi angkanya jadi lebih besar (dikali '+fmtId(f)+').';
    g={k:'ubah',dari:tampil+' '+t[0],ke:'? '+t[1],f:'× '+fmtId(f)};
  }else{
    q=fmtId(v)+' '+t[1]+' sama dengan berapa '+t[0]+'? (tulis dengan koma bila perlu)';a=tampil;
    e=fmtId(v)+' : '+fmtId(f)+' = '+tampil+'. '+t[0]+' satuan yang lebih besar, jadi angkanya jadi lebih kecil (dibagi '+fmtId(f)+').';
    g={k:'ubah',dari:fmtId(v)+' '+t[1],ke:'? '+t[0],f:'÷ '+fmtId(f)};
  }
  return {t:'isi',q:q,a:[a],e:e,g:g};
};
GEN.gabung=function(){
  var a=rnd(2,6),b=rnd(1,9)*100,N=['Ibu','Ayah','Kakak','Nenek'],n=N[rnd(0,3)];
  if(rnd(0,1)===0){
    return {t:'isi',q:n+' membeli '+a+' kg gula dan '+b+' g garam. Berapa gram berat belanjaan seluruhnya?',a:[String(a*1000+b)],e:a+' kg = '+fmtId(a*1000)+' g. Lalu '+fmtId(a*1000)+' + '+b+' = '+fmtId(a*1000+b)+' g. Satuannya disamakan dulu.',g:{k:'bar',bagian:[{l:a+' kg',v:a*1000,w:'biru'},{l:b+' g',v:b,w:'kuning'}],atas:'? g'}};
  }
  return {t:'isi',q:'Sebuah karung beras beratnya '+a+' kg. Diambil '+b+' g. Berapa gram beras yang tersisa?',a:[String(a*1000-b)],e:a+' kg = '+fmtId(a*1000)+' g. Lalu '+fmtId(a*1000)+' − '+b+' = '+fmtId(a*1000-b)+' g.',g:{k:'bar',bagian:[{l:'diambil '+b+' g',v:b,w:'merah'},{l:'sisa',v:a*1000-b,w:'hijau'}],atas:a+' kg = '+fmtId(a*1000)+' g'}};
};
GEN.banding=function(){
  var a=rnd(2,5),d=rnd(-3,3)*100,b=a*1000+d,N=['Made','Dewi','Rani','Budi'],i=rnd(0,3),j=(i+rnd(1,3))%4,idx=d<0?0:(d>0?1:2);
  var e=a+' kg = '+fmtId(a*1000)+' g. Bandingkan '+fmtId(a*1000)+' g dengan '+fmtId(b)+' g: '+(d<0?N[i]+' lebih banyak.':d>0?N[j]+' lebih banyak.':'sama banyak.');
  return {t:'pg',q:N[i]+' punya '+a+' kg beras dan '+N[j]+' punya '+fmtId(b)+' g beras. Siapa yang punya lebih banyak?',o:[N[i],N[j],'Sama banyak'],a:idx,e:e,g:{k:'tabel',baris:[[N[i],a+' kg'],[N[j],fmtId(b)+' g']]}};
};
`

export const DATA_AC15: DataMateri = {
  jsTopik: JS,
  fakta: [
    bs('Meter, sentimeter, dan kilometer adalah satuan baku untuk mengukur panjang.', true, 'Ketiganya mengukur panjang: cm untuk benda kecil, m untuk benda sedang, km untuk jarak jauh.', penggaris(8, 10, { sat: 'cm', l: 'pensil' })),
    bs('Kilogram dan gram adalah satuan baku untuk mengukur berat.', true, 'Berat diukur dengan timbangan, satuannya gram dan kilogram.', timbangan(2, 5, { sat: 'kg' })),
    bs('Liter dan mililiter dipakai untuk mengukur volume zat cair.', true, 'Air, susu, dan minyak ditakar dengan liter atau mililiter.', takar(1.5, 2, { sat: 'liter', langkah: 0.5 })),
    bs('Kilometer cocok dipakai untuk mengukur panjang sebuah buku tulis.', false, 'Kilometer terlalu besar untuk buku. Buku diukur dengan sentimeter.', penggaris(21, 25, { sat: 'cm', l: 'buku', langkah: 5 })),
    bs('Ton cocok dipakai untuk menimbang sebutir jeruk.', false, 'Satu ton sama dengan 1.000 kg, hanya cocok untuk benda sangat berat seperti truk. Jeruk ditimbang dengan gram.', timbangan(150, 1000, { sat: 'gram' })),
    bs('1 kilometer sama dengan 1.000 meter.', true, 'Kilo artinya seribu.', ubah('1 km', '1.000 m', '× 1.000')),
    bs('1 meter sama dengan 10 sentimeter.', false, '1 meter sama dengan 100 sentimeter.', penggaris(100, 100, { sat: 'cm', l: '1 meter', langkah: 10 })),
    bs('Mengubah satuan besar menjadi satuan kecil membuat angkanya lebih besar (dikalikan).', true, 'Satuannya lebih kecil, jadi butuh lebih banyak. 2 kg menjadi 2.000 g.', ubah('2 kg', '2.000 g', '× 1.000')),
    bs('Mengubah satuan kecil menjadi satuan besar dilakukan dengan membagi.', true, '3.000 ml dibagi 1.000 menjadi 3 liter.', ubah('3.000 ml', '3 liter', '÷ 1.000')),
    bs('Hasil mengukur panjang pensil yang ditulis "15" saja sudah lengkap.', false, 'Tanpa satuan, tidak jelas apakah 15 cm, 15 m, atau 15 km.', penggaris(15, 20, { l: 'pensil: 15 ...', langkah: 5 })),
    bs('500 mililiter sama dengan setengah liter.', true, 'Setengah dari 1.000 ml adalah 500 ml.', takar(0.5, 1, { sat: 'liter', langkah: 0.25 })),
    bs('2 kg lebih berat daripada 1.500 g.', true, '2 kg = 2.000 g, dan 2.000 g lebih besar daripada 1.500 g.', tabel([['Kantong A', '2 kg'], ['Kantong B', '1.500 g']])),
    bs('Karena 3 lebih kecil daripada 400, maka 3 kg pasti lebih ringan daripada 400 g.', false, 'Satuannya beda. 3 kg = 3.000 g, lebih berat daripada 400 g.', ubah('3 kg', '3.000 g', '× 1.000')),
    bs('Untuk menjumlahkan 2 kg dan 300 g, samakan dulu satuannya.', true, '2 kg = 2.000 g, lalu 2.000 + 300 = 2.300 g.', bar([{ l: '2 kg', v: 2000, w: 'biru' }, { l: '300 g', v: 300, w: 'kuning' }], '? g')),
  ],
  debat: [
    debat('Ina dan Bayu membandingkan 4 kg beras dengan 800 g gula.', ['Ina: "4 kg pasti lebih ringan, karena 4 lebih kecil daripada 800."', 'Bayu: "Samakan satuan dulu. 4 kg = 4.000 g, jadi beras lebih berat."'], 1, 'Angka saja tidak cukup. Bandingkan setelah satuannya sama.', ubah('4 kg', '4.000 g', '× 1.000')),
    debat('Rafi dan Mita mengubah 6 km menjadi meter.', ['Rafi: "6 km = 600 m, kalikan 100."', 'Mita: "6 km = 6.000 m, kalikan 1.000."'], 1, '1 km = 1.000 m, bukan 100 m. Jadi 6 × 1.000 = 6.000 m.', ubah('6 km', '6.000 m', '× 1.000')),
    debat('Tono dan Putri mengubah 7.000 g menjadi kilogram.', ['Tono: "7 kg, karena dibagi 1.000."', 'Putri: "7.000.000 kg, karena dikali 1.000."'], 0, 'Gram lebih kecil daripada kilogram, jadi dibagi 1.000.', ubah('7.000 g', '7 kg', '÷ 1.000')),
    debat('Dani dan Sari mengukur panjang meja dan menulis hasilnya "120".', ['Dani: "Sudah lengkap, semua orang tahu satuannya."', 'Sari: "Belum. Harus ada satuan, misalnya 120 cm."'], 1, 'Tanpa satuan, 120 bisa berarti 120 cm, 120 m, atau 120 km.', penggaris(120, 150, { l: 'meja: 120 ...', langkah: 30 })),
    debat('Gita dan Hari membahas setengah liter minyak.', ['Gita: "Setengah liter sama dengan 500 ml."', 'Hari: "Setengah liter sama dengan 50 ml."'], 0, '1 liter = 1.000 ml, setengahnya 500 ml.', takar(0.5, 1, { sat: 'liter', langkah: 0.25 })),
    debat('Joko dan Nia membahas cara pintas menggeser koma.', ['Joko: "Hanya berlaku untuk satuan panjang."', 'Nia: "Berlaku untuk panjang, berat, dan volume, asal faktornya 10, 100, atau 1.000."'], 1, 'Cara pintasnya sama untuk semua jenis satuan yang faktornya kelipatan 10.', ubah('3,5 km', '3.500 m', 'koma → 3 langkah')),
  ],
  bank: [
    isi('Sebuah pita panjangnya 4 meter. Berapa sentimeter panjang pita itu?', '400', '4 × 100 = 400 cm.', penggaris(4, 5, { sat: 'm', l: 'pita' })),
    isi('Jarum timbangan menunjuk 6 kg. Berapa gram berat benda itu?', '6000', '6 × 1.000 = 6.000 g.', timbangan(6, 10, { sat: 'kg' })),
    isi('Sebuah gelas takar berisi 2 liter air. Berapa mililiter air di dalamnya?', '2000', '2 × 1.000 = 2.000 ml.', takar(2, 3, { sat: 'liter', langkah: 1 })),
    isi('Jarak dua desa 3.500 meter. Berapa kilometer jarak itu? (tulis dengan koma)', '3,5', '3.500 : 1.000 = 3,5 km.', ubah('3.500 m', '? km', '÷ 1.000')),
    isi('Seutas tali panjangnya 750 cm. Berapa meter panjang tali itu? (tulis dengan koma)', '7,5', '750 : 100 = 7,5 m.', ubah('750 cm', '? m', '÷ 100')),
    isi('Jarak rumah Adi ke pasar adalah 1,2 km. Berapa meter jarak itu?', '1200', '1,2 × 1.000 = 1.200 m. Koma bergeser tiga langkah ke kanan.', ubah('1,2 km', '? m', '× 1.000')),
    isi('Sebuah ikan beratnya 2,4 kg. Berapa gram berat ikan itu?', '2400', '2,4 × 1.000 = 2.400 g.', timbangan(2.4, 5, { sat: 'kg' })),
    isi('Sebuah jalan sepanjang 2 km. Berapa sentimeter panjangnya? (km ke m, lalu m ke cm)', '200000', '2 km = 2.000 m. Lalu 2.000 × 100 = 200.000 cm.', ubah('2 km', '? cm', '× 1.000 lalu × 100')),
    isi('Sebuah truk membawa 5 ton jagung. Berapa kilogram jagung itu?', '5000', '1 ton = 1.000 kg, jadi 5 × 1.000 = 5.000 kg.', ubah('5 ton', '? kg', '× 1.000')),
    isi('Satu liter sirup dituang ke gelas-gelas kecil berisi 200 ml. Berapa gelas yang terisi penuh?', '5', '1 liter = 1.000 ml. 1.000 : 200 = 5 gelas.', takar(1, 1, { sat: 'liter', langkah: 0.2 })),
    isi('Kamu menyusun soal ubah satuan, jawabannya harus tepat 3.500 ml. Berapa liter yang kamu tulis di soal? (tulis dengan koma)', '3,5', '3,5 liter × 1.000 = 3.500 ml.', ubah('? liter', '3.500 ml', '× 1.000')),
    isi('Kamu menyusun soal, jawabannya harus tepat 9.000 m. Berapa kilometer yang kamu tulis di soal?', '9', '9 km × 1.000 = 9.000 m.', ubah('? km', '9.000 m', '× 1.000')),
    isi('Seutas tali 5 meter dipotong 80 cm. Berapa sentimeter tali yang tersisa?', '420', '5 m = 500 cm. Lalu 500 − 80 = 420 cm.', bar([{ l: '80 cm', v: 80, w: 'merah' }, { l: 'sisa', v: 420, w: 'hijau' }], '5 m = 500 cm')),
    isi('Sebuah bak berkapasitas 40 liter. Bak sudah diisi 12.000 ml. Berapa liter lagi agar penuh?', '28', '12.000 ml = 12 liter. Lalu 40 − 12 = 28 liter.', takar(12, 40, { sat: 'liter', langkah: 10 })),
    pg('Satuan yang paling tepat untuk mengukur panjang jalan tol adalah...', ['kilometer', 'sentimeter', 'gram', 'mililiter'], 0, 'Jarak jauh diukur dengan kilometer.', ubah('1 km', '1.000 m', '× 1.000')),
    pg('Satuan yang paling tepat untuk berat seekor sapi adalah...', ['kilogram (kg)', 'kilometer (km)', 'mililiter (ml)', 'sentimeter (cm)'], 0, 'Berat memakai gram, kilogram, atau ton. Sapi berat, jadi kilogram.', timbangan(400, 1000, { sat: 'kg' })),
    pg('Dari liter menjadi mililiter, yang dilakukan adalah...', ['mengalikan dengan 1.000', 'membagi dengan 1.000', 'menambah 1.000', 'mengurangi 1.000'], 0, 'Mililiter satuan yang lebih kecil, jadi angkanya lebih besar.', ubah('2 liter', '2.000 ml', '× 1.000')),
    pg('Dari sentimeter menjadi meter, yang dilakukan adalah...', ['membagi dengan 100', 'mengalikan dengan 100', 'mengalikan dengan 1.000', 'membagi dengan 10'], 0, '1 m = 100 cm. Dari satuan kecil ke besar dibagi 100.', ubah('300 cm', '3 m', '÷ 100')),
    pg('Manakah yang sama dengan 2,5 kg?', ['2.500 g', '250 g', '25 g', '25.000 g'], 0, '2,5 × 1.000 = 2.500 g.', timbangan(2.5, 5, { sat: 'kg' })),
    pg('Manakah pasangan ukuran yang SAMA?', ['3 m dan 300 cm', '2 km dan 200 m', '5 kg dan 500 g', '4 liter dan 400 ml'], 0, '3 m = 300 cm. Yang lain: 2 km = 2.000 m, 5 kg = 5.000 g, 4 liter = 4.000 ml.'),
    pg('Pita merah panjangnya 1,5 m dan pita biru 140 cm. Manakah yang lebih panjang?', ['pita merah', 'pita biru', 'sama panjang'], 0, '1,5 m = 150 cm, lebih panjang daripada 140 cm.', tabel([['Pita merah', '1,5 m'], ['Pita biru', '140 cm']])),
    pg('Wati mengubah 800 cm menjadi meter dengan membagi 1.000. Apakah itu tepat?', ['Tidak, cm ke m dibagi 100, hasilnya 8 m', 'Ya, hasilnya 0,8 m', 'Ya, hasilnya 80 m', 'Tidak, harus dikali 100'], 0, '1 m = 100 cm, jadi dibagi 100: 800 : 100 = 8 m.', ubah('800 cm', '? m', '÷ 100')),
    pg('1 ton sama dengan berapa gram? (1 ton = 1.000 kg dan 1 kg = 1.000 g)', ['1.000.000 g', '1.000 g', '100.000 g', '10.000 g'], 0, 'Dua langkah: 1.000 × 1.000 = 1.000.000 g.', ubah('1 ton', '? g', '× 1.000 lalu × 1.000')),
    gen('ubah'),
    gen('ubah'),
    gen('ubah'),
    gen('gabung'),
    gen('gabung'),
    gen('banding'),
    gen('banding'),
  ],
}
