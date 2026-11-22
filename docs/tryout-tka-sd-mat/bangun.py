# Menyusun butir try out TKA SD Matematika dari soal-mentah.json.
#   python3 docs/tryout-tka-sd-mat/bangun.py
# Keluaran: butir-impor-tryout-sd-mat.json, peta-kompetensi.json, kunci-buatan-claude.json, tinjauan-kunci.md
# Nomor soal = nomor indikator (1-30), jadi urutan paket = urutan indikator di halaman daya serap.
import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mentah = {x['nomor']: x for x in json.load(open('soal-mentah.json'))}
URL = json.load(open('url-gambar.json'))
T, F = True, False

# ---- KUNCI (dibuat Claude; situs sumber tidak menampilkan kunci). idx = indeks pilihan (mulai 0); grid = True untuk kolom pertama (Benar).
# Hampir semuanya hasil hitungan yang bisa diperiksa ulang. `periksa` = bergantung pada penafsiran gambar/kalimat.
KUNCI = {
 1: dict(grid=[T,F,T], alasan='Potongan 1/6: objek utuh tersusun dari 6 potongan yang sama persis. Gambar 1 (6 persegi panjang sama) dan Gambar 3 (6 persegi panjang sama, disusun bergeser) benar. Gambar 2 salah karena dua kolom tengahnya lebih sempit sehingga potongannya tidak sama.'),
 2: dict(idx=2, alasan='PLTU 1/2 = 50%, PLTA 0,075 = 7,5%, PLTG 5%, PLTGU 30%, PLTD 3/40 = 7,5%. Terbesar: PLTU.'),
 3: dict(idx=[0,1], alasan='Jumlah keluarga harus membagi 150 karung dan tiap keluarga mendapat lebih dari satu karung: 150 : 30 = 5 dan 150 : 25 = 6 (bisa); 150 : 20 = 7,5 (tidak bisa).'),
 4: dict(idx=3, alasan='Karung jenis B = 3 kg. 1.500 : 3 = 500 karung. Dibagikan 450 karung, sisa 500 - 450 = 50 karung.'),
 5: dict(idx=0, alasan='Kentang yang dibuat keripik = 100 - 4 kg. Tiap kg menjadi 6 bungkus: (100 - 4) x 6. Tiap kardus 12 bungkus: dibagi 12. Jadi (100 - 4) x 6 : 12.'),
 6: dict(idx=2, alasan='3 7/6 = 25/6. 3/25 x 25/6 = 1/2. 135 : 15 = 9. Hasil 9 1/2.'),
 7: dict(grid=[F,T,T], alasan='Diagram alir: bilangan + 5, lalu (dibagi 3 bila kelipatan 6, atau dikurangi 5), terakhir dikali 2. Hasil akhir selalu genap, jadi (1) salah. Masukan 0: 0 + 5 = 5, bukan kelipatan 6, 5 - 5 = 0, 0 x 2 = 0, jadi (2) benar. Hasil akhir selalu dikali 2 sehingga selalu kelipatan dua, jadi (3) benar.'),
 8: dict(idx=0, alasan='Diamagnetik awal 25 - 12 - 7 = 6 benda. Menjadi 9 benda, berarti ditambah 9 - 6 = 3 benda.'),
 9: dict(idx=[1,2], alasan='Dua hari: A 2 x 94 = 188, B 2 x 82 = 164, C 2 x 96 = 192. Terpakai = dihasilkan - sisa: A 188 - 42 = 146, B 164 - 13 = 151, C 192 - 30 = 162. Lebih dari 150 watt: kincir B dan C.'),
 10: dict(idx=2, alasan='Satu porsi salmon mengandung sekitar 20 gram protein. 80 : 20 = 4 porsi.'),
 11: dict(grid=[T,F,T], alasan='Satu resep: 2 gelas susu = 400 ml, 4 sendok teh cuka = 20 ml, garam 4 gr. Lima resep: susu 2.000 ml, cuka 100 ml, garam 20 gr. (1) benar: garam 20 gr. (2) salah: cuka tersedia 140 ml, justru lebih 40 ml. (3) benar: susu 2.000 ml sudah cukup.'),
 12: dict(idx=[0,1,2], periksa=True, alasan='Linda tiap 8 hari, Vidya tiap 6 hari: bertemu lagi tiap KPK(8, 6) = 24 hari. 10 Agustus + 24 hari = 3 September; + 48 hari = 27 September; + 72 hari = 21 Oktober. Ketiga pilihan benar (jarang sebuah soal memuat semua pilihan benar, jadi layak dicek ulang).'),
 13: dict(grid=[T,T,F], alasan='Huruf E bangun datar bersudut 12: 12 sisi dan 12 titik sudut. Sudut siku-siku (90 derajat) ada 8; empat sudut lainnya 270 derajat. Jadi 10 sudut siku-siku salah.'),
 14: dict(grid=[T,F,F], periksa=True, alasan='Dari gambar berpetak: bagian tengah persegi panjang 6 x 3 satuan, ditambah 3 segitiga (atas, kanan, bawah). Jadi 3 segitiga dan 1 persegi panjang. Pilihan lain tidak sesuai susunan yang tergambar. Catatan: sebuah persegi panjang bisa dipotong menjadi segitiga dan trapesium, tetapi susunan yang digambar adalah 3 segitiga dan 1 persegi panjang.'),
 15: dict(idx=3, periksa=True, alasan='Kubus terlihat ada 13 (menara 4, kubus belakang kanan 1, tumpukan kiri 2, deretan depan 6). Menara dan kubus belakang kanan berdiri di atas bagian yang tersembunyi, dan masing-masing minimal 1 kubus di bawahnya. Total minimal 13 + 2 = 15, satu-satunya pilihan yang mungkin.'),
 16: dict(idx=[0,2], alasan='Tinggi tiang bendera 8 meter masuk akal. Jarak rumah ke sekolah 30 milimeter (3 cm) tidak masuk akal. Lebar buku tulis sekitar 20 cm masuk akal.'),
 17: dict(idx=1, alasan='Isi botol berurutan dari paling sedikit: A 450 ml, D 470 ml, B 530 ml, C 540 ml. Hanya gambar kedua yang urutannya A < D < B < C.'),
 18: dict(grid=[T,F,T], alasan='Bawang putih 250 g dan cabai 250 g: neraca seimbang (Gambar 1 benar). Tepung terigu 500 g lebih ringan dari ayam 1.500 g, tetapi Gambar 2 memperlihatkan terigu lebih berat (salah). Tepung tapioka 1.250 g lebih berat dari terigu 500 g, dan Gambar 3 memperlihatkan hal itu (benar).'),
 19: dict(idx=0, alasan='Mulai pukul 08.15 (jarum pendek di antara 8 dan 9, jarum panjang di 3). Selesai pukul 10.25 (jarum pendek di antara 10 dan 11, jarum panjang di 5). Lama memasak 10.25 - 08.15 = 2 jam 10 menit.'),
 20: dict(idx=3, alasan='Keliling = 12 + 10 + 4 + 20 + 4 + 10 = 60 cm (sisi miring 10 cm ada dua, sisi tegak 4 cm ada dua).'),
 21: dict(idx=1, alasan='Segi banyak tersusun dari 10 segitiga yang sama (terlihat dari susunan petaknya; luas segi banyak kira-kira 9,8 kali luas satu segitiga). 10 x 16 = 160 cm persegi.'),
 22: dict(idx=1, alasan='Luas tempat 4.800 cm persegi. Luas lukisan: A 60 x 60 = 3.600, B 90 x 80 = 7.200, C 40 x 80 = 3.200, D 40 x 40 = 1.600, E 60 x 80 = 4.800. Lukisan C dan D: 3.200 + 1.600 = 4.800 cm persegi, pas.'),
 23: dict(idx=1, alasan='Keset jenis 2 berbentuk persegi panjang, jadi punya 4 sudut dan 4 hiasan.'),
 24: dict(grid=[T,F,F], periksa=True, alasan='Berat keset: jenis 1 = 800 g, jenis 2 = 1.200 g, jenis 3 = 1.500 g. Batas 10 kg = 10.000 g, memakai dua jenis berbeda dan jumlah dimaksimalkan. Jenis 1 + jenis 2: 11 x 800 + 1 x 1.200 = 10.000 g, jadi 12 keset. Jenis 1 + jenis 3 paling banyak 11 keset (10 x 800 + 1.500 = 9.500 g). 13 keset tidak mungkin. Jumlah maksimum 12, jadi hanya 12 yang benar; 7 dan 6 tidak maksimum.'),
 25: dict(idx=[1,2], periksa=True, alasan='Gunting B terbuka lebih lebar daripada gunting A (35 derajat) dan masih sudut lancip (kurang dari 90 derajat). Maka 51 derajat dan 63 derajat mungkin; 29 derajat lebih kecil dari 35 derajat sehingga tidak mungkin. Dari gambar sudut B kira-kira 50 derajat.'),
 26: dict(idx=2, periksa=True, alasan='Jumlah dua cabang: Januari 500 + 500 = 1.000; Februari 1.000 + 500 = 1.500; Maret 750 + 1.500 = 2.250; April 1.200 + 2.000 = 3.200; Mei 1.500 + 2.500 = 4.000. Hanya gambar ketiga yang urutannya benar untuk Maret (2.250) dan Mei (4.000) dengan April sekitar 3.250 (terbaca dari grafik kira-kira 3.200). Gambar pertama Maret salah (2.100), kedua April 3.000 (jauh), keempat Mei 3.000 (lebih rendah dari April).'),
 27: dict(idx=[0,1], alasan='Screen time hari sekolah: 1 + 0,5 + 1 + 2,5 + 2 = 7 jam. Batas 2 jam, jadi harus dikurangi paling sedikit 5 jam. Pengurangan 6 jam dan 5 jam memenuhi; 4 jam masih menyisakan 3 jam (melebihi batas).'),
 28: dict(idx=1, alasan='Batang Telur Gulung berada di angka 23.'),
 29: dict(grid=[T,T,F], periksa=True, alasan='Tonga punya 9 gunung berapi aktif dengan 450 Mw, jadi tiap gunung paling sedikit 450 : 9 = 50 Mw. Rusia 27 gunung: 27 x 50 = 1.350 Mw (benar). Vanuatu 9 gunung: 9 x 50 = 450 Mw (benar). Papua Nugini 13 gunung: 13 x 50 = 650 Mw, bukan 550 Mw (salah). Pernyataan 3 bisa dibaca "setidaknya 550 Mw" yang secara harfiah benar, tetapi yang ditanyakan adalah nilai minimum yang tepat, yaitu 650 Mw.'),
 30: dict(idx=1, alasan='Bus penuh 72 siswa. 6A 25 siswa dan 6B 24 siswa: 72 - 25 - 24 = 23 siswa untuk 6C.'),
}

# ---- PETA KOMPETENSI (halaman daya serap SD Matematika 2025/2026: elemen > sub-elemen > kompetensi > indikator, % nasional)
EL = {'B': ('Bilangan', 43.13), 'G': ('Geometri dan Pengukuran', 41.91), 'D': ('Data dan Ketidakpastian', 47.07)}
SUB = {
 'BR': ('B', 'Bilangan Rasional', 43.13),
 'OG': ('G', 'Objek Geometri', 41.74),
 'PK': ('G', 'Pengukuran', 41.98),
 'PD': ('D', 'Penyajian dan Penggunaan Data', 47.07),
}
K = lambda sub, nama, pct, inds: [(sub, nama, pct, n, i, p) for n, i, p in inds]
DAFTAR = (
 K('BR', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait pecahan senilai menggunakan gambar dan simbol matematika', 38.87, [(1, 'Menentukan representasi pecahan dari bagian suatu objek utuh.', 38.87)]) +
 K('BR', 'Mengurutkan beberapa bilangan yang dinyatakan dalam bentuk berbeda (bilangan cacah, pecahan, desimal, dan persentase)', 37.71, [(2, 'Mengurutkan beberapa bilangan yang dinyatakan dalam bentuk berbeda.', 37.71)]) +
 K('BR', 'Menentukan faktor suatu bilangan cacah dan mengenal bilangan prima', 38.97, [(3, 'Membandingkan dan mengurutkan berbagai jenis bilangan yang meliputi pecahan, bilangan cacah, desimal, serta persentase.', 38.97)]) +
 K('BR', 'Menggunakan penjumlahan/pengurangan/perkalian/pembagian dua bilangan cacah (bilangan dan hasil operasi maks. empat angka), termasuk mengestimasi hasil operasi', 44.44, [(4, 'Menggunakan operasi bilangan cacah (maks. empat angka) dan menyatakannya dalam berbagai bentuk.', 44.44)]) +
 K('BR', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait operasi penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah', 42.37, [(5, 'Memodelkan masalah kontekstual ke dalam bentuk kalimat matematika yang melibatkan bilangan cacah.', 44.51), (7, 'Mengevaluasi kebenaran hasil operasi aritmetika bilangan cacah pada diagram alir.', 40.23)]) +
 K('BR', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait operasi penjumlahan dan pengurangan bilangan pecahan, serta operasi perkalian dan pembagian bilangan pecahan dengan bilangan asli', 44.75, [(6, 'Menentukan hasil operasi hitung campuran yang melibatkan pecahan dan bilangan asli.', 44.75)]) +
 K('BR', 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan (dalam bentuk sederhana)', 43.74, [(8, 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan dalam bentuk sederhana (soal 1).', 44.76), (9, 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan dalam bentuk sederhana (soal 2).', 42.72)]) +
 K('BR', 'Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan, pengurangan, perkalian, dan pembagian (dalam bentuk sederhana)', 45.92, [(10, 'Menyelesaikan persamaan sederhana menggunakan berbagai bentuk operasi bilangan (dalam bentuk sederhana).', 44.43), (11, 'Mengevaluasi informasi dengan menggunakan persamaan sederhana dengan operasi penjumlahan, pengurangan, perkalian, dan pembagian.', 47.41)]) +
 K('BR', 'Menentukan KPK dan FPB', 48.77, [(12, 'Menentukan KPK dan FPB dari informasi.', 48.77)]) +
 K('OG', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait bentuk bangun datar', 41.89, [(13, 'Membedakan ciri-ciri berbagai jenis bangun datar.', 42.85), (14, 'Mengidentifikasi berbagai bangun datar penyusun suatu bangun segi banyak.', 40.94)]) +
 K('OG', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait konstruksi bangun ruang dan visualisasi spasial (bagian depan, atas, dan samping)', 41.60, [(15, 'Menyelesaikan masalah terkait konstruksi bangun ruang dan visualisasi spasial.', 41.60)]) +
 K('OG', 'Mengidentifikasi ciri-ciri dari segiempat, segitiga, segibanyak, dan lingkaran', 41.58, [(23, 'Mengidentifikasi bentuk gambar benda berdasarkan ciri-ciri dari segiempat, segitiga, segibanyak, dan lingkaran.', 41.58)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait panjang benda menggunakan satuan baku', 39.85, [(16, 'Mengidentifikasi kelogisan penggunaan satuan baku panjang dalam masalah pengukuran.', 39.85)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait volume benda menggunakan satuan baku', 42.30, [(17, 'Menentukan representasi visual dari volume benda menggunakan satuan baku.', 42.30)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait berat benda menggunakan satuan baku', 41.34, [(18, 'Menentukan representasi kesetimbangan neraca berdasarkan perbandingan berat benda.', 41.34)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait waktu', 47.76, [(19, 'Menentukan durasi suatu aktivitas berdasarkan keterangan waktu pada jam analog.', 47.76)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait keliling dan luas bangun datar (segitiga, segiempat, dan segi banyak)', 43.57, [(20, 'Menghitung keliling bangun datar segi banyak tidak beraturan yang diketahui panjang semua sisinya.', 43.88), (21, 'Menentukan luas bangun datar segi banyak yang terbentuk dari gabungan beberapa segitiga.', 43.26)]) +
 K('PK', 'Menghitung keliling dan luas persegi panjang bila diketahui panjang dan lebarnya, dan menghitung panjang atau lebar bila diketahui luas/keliling dan salah satu sisinya', 37.75, [(22, 'Menggunakan konsep keliling atau luas persegi/persegi panjang dalam menyelesaikan permasalahan.', 37.75)]) +
 K('PK', 'Menentukan panjang dan berat benda menggunakan satuan baku (termasuk menentukan satuan yang tepat)', 35.64, [(24, 'Menganalisis/mengevaluasi pernyataan berdasarkan konsep pengukuran panjang dan berat benda menggunakan satuan baku.', 35.64)]) +
 K('PK', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait besar sudut', 46.03, [(25, 'Menentukan besar sudut yang terbentuk dari ilustrasi masalah kontekstual berdasarkan jenis sudutnya.', 46.03)]) +
 K('PD', 'Kemampuan memahami, mengaplikasikan, dan bernalar yang lebih tinggi untuk menyelesaikan permasalahan terkait pengambilan informasi dan penggunaan data', 48.04, [(26, 'Mengidentifikasi kesalahan penyajian data dalam bentuk diagram batang.', 48.04)]) +
 K('PD', 'Menyajikan, menganalisis, dan menginterpretasi data dalam bentuk diagram batang atau tabel', 46.82, [(27, 'Menginterpretasi informasi diagram atau tabel untuk menyelesaikan permasalahan yang disajikan.', 48.87), (28, 'Menginterpretasi data berdasarkan kategori tertentu.', 48.66), (29, 'Menyelesaikan permasalahan berkaitan dengan penyajian data dalam bentuk diagram batang atau tabel.', 44.35), (30, 'Menginterpretasi data diagram batang atau tabel untuk menyelesaikan permasalahan.', 45.40)])
)
SUMBER_PETA = 'Pusat Asesmen Pendidikan, daya serap TKA SD Matematika 2025/2026 (nasional)'
peta = {}
for sub, l3, p3, n, ind, pi in DAFTAR:
    el, sn, sp = SUB[sub]
    en, ep = EL[el]
    peta[str(n)] = {'elemen': {'nama': en, 'nasional': ep}, 'subelemen': {'nama': sn, 'nasional': sp},
                    'kompetensi': {'nama': l3, 'nasional': p3}, 'indikator': {'nama': ind, 'nomor': n, 'nasional': pi}, 'sumber': SUMBER_PETA}
assert sorted(map(int, peta)) == list(range(1, 31))

# ---- merakit butir
def gambar_url(u, jenis, i, imgs):
    sumber = imgs[0] if jenis == 'o' else imgs[i]   # gambar pilihan: satu gambar per pilihan, bernomor menurut pilihan
    ext = sumber.rsplit('.', 1)[1].lower()
    return URL[f's{u:02d}_{jenis}{i}.{ext}']

def rapikan(t):
    t = t.replace('\r', '')
    # tiap penanda gambar menempati satu baris sendiri
    t = re.sub(r'[ \t]*(\[gambar: [^\]]+\])[ \t]*', r'\n\1\n', t)
    t = re.sub(r'[ \t]+\n', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def bersihkan(stem):
    paras, sumber, keluar = re.split(r'\n\s*\n', stem.replace('\r', '')), [], []
    for p in paras:
        baris = [l.strip() for l in p.split('\n')]
        simpan = []
        for l in baris:
            if re.match(r'^\s*-?\s*(\d+\.\s*)?(https?://|www\.)', l): sumber.append(l.strip()); continue
            simpan.append(l)
        t = '\n'.join(x for x in simpan if x).strip()
        if not t: continue
        if re.match(r'^Sumber', t, re.I) and len(t) < 60: sumber.append(t); continue
        keluar.append(t)
    return '\n\n'.join(keluar), sumber

INSTR = re.compile(r'^(Klik pada|Pilih semua|Pilih Benar|Tentukan Benar|Jawaban benar)', re.I)
def pecah_pertanyaan(teks):
    paras = [p for p in re.split(r'\n\s*\n', teks) if p.strip()]
    idx = len(paras) - 1
    while idx > 0 and INSTR.match(paras[idx].strip()): idx -= 1
    if re.fullmatch(r'\[gambar: [^\]]+\]', paras[idx].strip()): idx += 1   # jangan mulai pertanyaan dari sebuah gambar
    return '\n\n'.join(paras[:idx]).strip(), '\n\n'.join(paras[idx:]).strip()

# perbaikan teks yang kehilangan tanda pangkat/derajat saat diratakan dari HTML (<sup>)
def perbaiki(n, t):
    if n == 21: t = re.sub(r'(\d) cm2\b', r'\1 cm²', t)
    if n == 22: t = t.replace('4.800 cm2', '4.800 cm²')
    if n == 25 and re.fullmatch(r'\d{2}0\.?', t.strip()): t = t.strip()[:-2 if t.strip().endswith('.') else -1] + '°'
    return t

butir, tinjau = [], []
for n in range(1, 31):
    h = mentah[n]; k = h['kartu'][0]; u = h['urutan']; kn = KUNCI[n]
    teks, sumber = bersihkan(k['stem'])
    for i in range(len(k['imgs'])):
        teks = teks.replace(f'[IMG{i}]', f"[gambar: {gambar_url(u, 's', i, k['imgs'])}]")
    teks = rapikan(perbaiki(n, teks))
    bentuk = k['bentuk']
    statement_label = 'Pernyataan'
    if n == 6:   # pecahan dan bilangan campuran ditulis sebagai rumus, bukan gambar
        teks = 'Hasil dari $\\frac{3}{25} \\times 3\\frac{7}{6} + 135 : 15$ adalah ....'
    if n in (1, 18):   # gambar pada baris tabel tidak bisa tampil di dalam tabel pernyataan: gambar dipindah ke soal
        g = [gambar_url(u, 't', i, k['imgsTabel']) for i in range(3)]
        tambah = '\n\n'.join(f'Gambar {i + 1}\n\n[gambar: {g[i]}]' for i in range(3))
        teks = teks.replace('Tentukan Benar atau Salah pada setiap gambar berikut!', '').strip() + '\n\n' + tambah
    konteks, pertanyaan = pecah_pertanyaan(teks)
    if n in (1, 18):   # pertanyaan dimulai dari kalimat tanya, gambar pilihan ikut di sisi pertanyaan
        pol = 'Manakah dari gambar berikut ini yang merupakan gambar objek utuh tersebut?' if n == 1 else 'Bagaimana hubungan berat bahan-bahan tersebut jika ditimbang menggunakan neraca?'
        i0 = teks.index(pol)
        konteks, pertanyaan = teks[:i0].strip(), teks[i0:].strip() + '\n\nTentukan Benar atau Salah pada setiap gambar berikut!'
    prompt = (konteks + '\n\n[pertanyaan]\n\n' if konteks else '') + pertanyaan
    if 'Kategori' in bentuk:
        tipe = 'statement_grid'
        baris = [l.strip() for l in k['tabel'].split('\n') if l.strip().startswith('|')]
        kepala = [c.strip() for c in baris[0].strip('|').split('|')]
        lab = [kepala[1], kepala[2]]
        if n in (1, 18):
            pern = [f'Gambar {i + 1} ' + ('adalah gambar objek utuh tersebut.' if n == 1 else 'menggambarkan hubungan berat yang benar.') for i in range(3)]
            statement_label = 'Gambar'
        else:
            pern = [b.strip('|').split('|')[0].strip() for b in baris[1:]]
        assert len(pern) == 3 and len(kn['grid']) == 3, (n, pern)
        options = {'statements': pern, 'answer_labels': lab, 'statement_label': statement_label}
        benar = {'answers': kn['grid'], 'grading_mode': 'proportional'}
        jawab = [lab[0] if a else lab[1] for a in kn['grid']]
    else:
        pilihan = []
        for oi, o in enumerate(k['opsi']):
            if n == 6:
                pilihan.append(['$2\\frac{1}{2}$', '$9\\frac{1}{30}$', '$9\\frac{1}{2}$', '$\\frac{32}{225}$'][oi])
            elif o['imgs']:
                pilihan.append(f"[gambar: {gambar_url(u, 'o', oi, o['imgs'])}]")
            else:
                pilihan.append(perbaiki(n, o['teks'].strip()))
        multi = 'MCMA' in bentuk
        assert len(pilihan) == (3 if multi else 4), (n, pilihan)
        options = {'choices': pilihan}
        if multi:
            tipe = 'mcq_multi'; benar = [pilihan[i] for i in kn['idx']]; jawab = benar
        else:
            tipe = 'mcq_single'; benar = pilihan[kn['idx']]; jawab = benar
    expl = kn['alasan'] + (' [Kunci buatan Claude; PERIKSA.]' if kn.get('periksa') else ' [Kunci buatan Claude.]')
    sumber = [x for x in sumber if x and not re.match(r'^Sumber[^:]*:?\s*$', x.strip('- ').strip(), re.I)]
    if sumber: expl += ' Sumber: ' + ' | '.join(x.strip('- ') for x in sumber)
    butir.append({'type': tipe, 'prompt': prompt, 'options': options, 'correct_answer': benar, 'weight': 1,
                  'sumber_pembuatan': 'manual', 'status_verifikasi': 'draf', 'explanation': expl})
    tinjau.append((n, tipe, jawab, kn['alasan'], bool(kn.get('periksa')), (pertanyaan.split('\n')[0] if pertanyaan else '')))

json.dump({'format': 'tera/butir-impor@1', 'catatan': 'Try out TKA SD Matematika, 30 contoh soal resmi Pusat Asesmen Pendidikan (daya serap TKA 2025/2026), nomor soal = nomor indikator. Kunci dibuat Claude (kebanyakan hasil hitungan) dan WAJIB ditinjau manusia, terutama yang bertanda PERIKSA.', 'butir': butir},
          open('butir-impor-tryout-sd-mat.json', 'w'), ensure_ascii=False, indent=1)
json.dump(peta, open('peta-kompetensi.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'catatan': 'Kunci dikerjakan Claude dari soal contoh Pusat Asesmen (daya serap TKA SD Matematika 2025/2026); situs tidak menampilkan kunci. Bertanda periksa = bergantung penafsiran.',
           'kunci': {str(n): {'jenis': t, 'jawaban': j, 'alasan': a, 'periksa': p} for n, t, j, a, p, q in tinjau}},
          open('kunci-buatan-claude.json', 'w'), ensure_ascii=False, indent=1)
md = ['# Tinjauan kunci: Try Out TKA Matematika SD', '', 'Kunci dibuat Claude (situs sumber tidak menampilkan kunci), kebanyakan hasil hitungan yang bisa diperiksa ulang. Mohon tinjau yang bertanda **PERIKSA**.', '',
      '| No | Jenis | Pertanyaan | Kunci | Alasan | |', '|---|---|---|---|---|---|']
for n, t, j, a, p, q in sorted(tinjau, key=lambda x: (not x[4], x[0])):
    md.append(f"| {n} | {t} | {q[:70].replace('|', '/')} | {', '.join(j) if isinstance(j, list) else j} | {a} | {'**PERIKSA**' if p else ''} |")
open('tinjauan-kunci.md', 'w').write('\n'.join(md) + '\n')
from collections import Counter
print('butir', len(butir), Counter(b['type'] for b in butir), 'periksa', sum(1 for x in tinjau if x[4]))
