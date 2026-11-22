# Menyusun butir try out TKA SD Bahasa Indonesia dari soal-mentah.json.
#   python3 docs/tryout-tka-sd-bin/bangun.py
# Keluaran: butir-impor-tryout-sd-bin.json, peta-kompetensi.json, kunci-buatan-claude.json, tinjauan-kunci.md
# Nomor soal = nomor indikator (1-30).
import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mentah = {x['nomor']: x for x in json.load(open('soal-mentah.json'))}
URL = json.load(open('url-gambar.json'))
T, F = True, False

# ---- KUNCI (dibuat Claude; situs sumber tidak menampilkan kunci). idx = indeks pilihan (mulai 0); grid = True untuk kolom pertama.
KUNCI = {
 1: dict(idx=1, alasan='Teks: lokasi dekat Pantai Congot; zona menarik Pasir Mendit, Jembatan Api-Api, Pantai Kadilangu; satwa burung kuntul, kepiting, udang, biawak. Hanya bagan kedua yang semuanya sesuai (ayunan, gazebo, dan menara pandang adalah spot foto, bukan zona).'),
 2: dict(idx=[1,2], periksa=True, alasan='"Permata tersembunyi" = tempat indah yang belum banyak dikenal, tetapi punya banyak spot menarik. "Tidak mudah dijangkau" tidak disebut di teks.'),
 3: dict(grid=[T,T,F], alasan='Teks hanya membahas hutan mangrove Kulon Progo, jadi Amara dan Bima tepat. Satu hutan tidak mewakili seluruh hutan mangrove Indonesia, jadi Jena kurang tepat.'),
 4: dict(idx=[1,2], alasan='Bakwan unik karena dipengaruhi berbagai budaya (Cina, Jepang, Portugis) dan punya nama berbeda di tiap daerah. Isinya tidak sama dengan makanan Jepang (tempura).'),
 5: dict(grid=[F,T,F], alasan='Awalnya bakwan dari daging dan tepung digoreng (Sebelum). Kini berisi aneka sayuran dan bisa ditambah udang, sosis, atau bakso (Sesudah).'),
 6: dict(idx=[1,2], alasan='Salma mengajak peduli lingkungan dimulai dari hal kecil seperti membawa botol sendiri. "Bebas memilih gaya hidup" bukan pesan cerita.'),
 7: dict(idx=0, alasan='"Kita nggak bisa terus tutup mata soal sampah plastik": tutup mata = mengabaikan masalah sampah.'),
 8: dict(grid=[T,F,T], periksa=True, alasan='Dalam cerita teman-teman membawa botol minum sendiri dan Salma mengajak peduli sampah plastik. Menggunakan botol isi ulang dan mengajak membatasi minuman kemasan sesuai. Membeli botol untuk teman-teman tidak ada di cerita (mereka hanya membantu mencarikan botol untuk Alvin).'),
 9: dict(idx=3, alasan='Teks: meteor akan habis terbakar di langit.'),
 10: dict(idx=[0,2], periksa=True, alasan='Tokoh Aku senang menghabiskan waktu dengan ayah menonton hujan meteor, dan ia berharap langit cerah supaya meteor jelas terlihat. Menulis buku harian sambil melihat meteor tidak disebutkan.'),
 11: dict(idx=0, alasan='Teks: saat bermain dengan Heksagonal, Giga menirukan bentuk bunga.'),
 12: dict(idx=[0,1], alasan='Teks: bersama Pasukan Kotak, Giga menirukan roket, ikan, dan menara. Bendera termasuk bentuk segitiga.'),
 13: dict(idx=2, alasan='Teks: ini kedua kalinya ke Pulau Kemaro; pertama kali mereka naik kapal dari bawah jembatan Musi.'),
 14: dict(idx=[0,2], alasan='Karena hujan, barongsai dan penerbangan lampion dibatalkan, namun mereka tetap menikmati dengan berkeliling pulau dan mencoba makanan khas Imlek. Berjalan di jembatan ponton terjadi sebelum hujan turun.'),
 15: dict(idx=0, alasan='Cerita mengajarkan menerima rencana yang batal dan tetap menikmati: berlapang dada dan menyusun rencana lain.'),
 16: dict(idx=1, alasan='Seluruh teks membahas ciri-ciri kota berkelanjutan dan mengajak menjaganya: fokus utama pentingnya kota berkelanjutan. Pilihan lain hanya sebagian rincian.'),
 17: dict(idx=0, alasan='Pengelolaan sampah yang baik membuat kota bersih; pilihan lain tidak berkaitan dengan sampah.'),
 18: dict(idx=[0,1], periksa=True, alasan='Gambar kota tidak menampilkan taman atau lapangan hijau dan tidak ada kendaraan listrik; keduanya ciri kota berkelanjutan di teks. Keberadaan manusia di jalan bukan ciri yang disebut teks.'),
 19: dict(idx=0, alasan='Teks: ketua adat akan memotong rambut gimbal Rara.'),
 20: dict(idx=3, alasan='Rara sadar keadaan orang tuanya, meminta maaf, dan menerima hanya meminta buku cerita: ikhlas.'),
 21: dict(idx=[0,2], periksa=True, alasan='Pelajaran dari cerita: mempertimbangkan kemampuan orang tua dan perlu tidaknya barang, bukan memaksa meminta langsung dibelikan.'),
 22: dict(idx=3, periksa=True, alasan='Peribahasa "bersakit-sakit dahulu, bersenang-senang kemudian": Erni menasihati Arul bahwa ia harus mau belajar kalau ingin nilai ujiannya bagus lagi. Pilihan 1 menyiratkan Arul sudah belajar, padahal belum.'),
 23: dict(idx=2, alasan='Setelah diajak Reno dan teman-temannya, Arul mengangguk: ia akhirnya mau belajar bersama.'),
 24: dict(grid=[T,F,T], periksa=True, alasan='Arul berubah setelah belajar bersama teman (1 benar). Yakin pada kemampuan diri tanpa belajar sambil tetap bermain bola justru membuat nilainya jelek (2 salah). Bertanya saat guru menjelaskan tidak ada di cerita tetapi sejalan dengan pesan cerita (3 benar), sehingga layak dicek.'),
 25: dict(idx=[0,1], alasan='"Mengarungi laut" dan "melempar jala" menunjukkan pekerjaan nelayan. Memperbaiki perahu adalah alasan Kamal.'),
 26: dict(idx=0, alasan='Setelah ditegur, Kamal melawan rasa malasnya dan melaut setiap hari.'),
 27: dict(grid=[F,T,T], alasan='Yunus tidak hanya sabar: ia menegur keras dan akhirnya menemani Kamal sampai bisa melaut sendiri. Jadi Johan tidak sesuai; Simon dan Maria sesuai.'),
 28: dict(idx=2, alasan='Teks: Lianne suka sekali menggambar.'),
 29: dict(idx=2, periksa=True, alasan='Setelah gagal di matematika, basket, dan menyanyi, Lianne terus melatih gambarnya sampai menang lomba: pantang menyerah. "Lapang dada" lebih menggambarkan Mama yang akhirnya menerima.'),
 30: dict(grid=[T,F,T], periksa=True, alasan='Dinda bisa ikut sedih karena keunikan Lianne tidak diakui, dan kecewa karena Lianne harus menjadi orang lain di depan mamanya. Marahnya Lianne bukan karena teman-teman lebih unggul.'),
}

# ---- PETA KOMPETENSI (halaman daya serap SD Bahasa Indonesia 2025/2026: kompetensi > kelompok > indikator, % nasional)
EL = {'T': ('Pemahaman Tekstual', 59.47), 'I': ('Pemahaman Inferensial', 58.83), 'E': ('Evaluasi dan Apresiasi', 62.96)}
G = lambda el, nama, pct, inds: [(el, nama, pct, n, i, p) for n, i, p in inds]
DAFTAR = (
 G('T', 'Menyusun kembali informasi dari teks dalam bentuk ikhtisar/bagan.', 54.51, [(1, 'Menentukan bagan kerangka isi/informasi dalam teks.', 54.51)]) +
 G('T', 'Mengidentifikasi informasi tersurat dalam teks.', 60.36, [(9, 'Menentukan informasi tersurat pada teks.', 63.25), (11, 'Menentukan informasi tersurat pada teks.', 56.51), (12, 'Menentukan informasi tersurat dalam teks.', 64.43), (13, 'Menentukan informasi tersurat pada teks.', 59.20), (19, 'Menentukan informasi tersurat pada teks.', 63.36), (28, 'Menentukan informasi tersurat dalam teks.', 55.41)]) +
 G('T', 'Mengidentifikasi objek berdasarkan kosakata yang digunakan dalam teks fiksi atau nonfiksi.', 59.10, [(25, 'Menentukan kosakata yang sesuai dengan objek dalam teks.', 59.10)]) +
 G('I', 'Menjelaskan makna ungkapan yang digunakan dalam teks.', 57.92, [(2, 'Menentukan makna ungkapan dalam teks.', 58.46), (7, 'Menjelaskan makna ungkapan atau idiom dalam teks.', 54.55), (22, 'Menentukan makna ungkapan/peribahasa sederhana dalam teks.', 60.75)]) +
 G('I', 'Menyimpulkan ide pokok, gagasan pendukung, amanat, tokoh, peristiwa, dan/atau nilai-nilai dalam teks.', 59.20, [(4, 'Menyusun kesimpulan untuk menentukan relevansi isi dalam teks.', 62.12), (6, 'Menyimpulkan nilai-nilai yang terdapat dalam teks.', 64.56), (10, 'Menyusun inferensi atau kesimpulan isi dalam teks.', 60.98), (14, 'Menyusun kesimpulan berdasarkan unsur intrinsik dalam teks.', 59.25), (16, 'Menjelaskan ide pokok atau fokus utama teks.', 58.00), (17, 'Menyimpulkan isi atau substansi dalam teks.', 59.84), (20, 'Menyimpulkan perasaan dan sifat tokoh dalam teks.', 52.72), (29, 'Menyimpulkan sifat atau karakter tokoh dalam teks.', 56.16)]) +
 G('I', 'Menyimpulkan perubahan sederhana pada objek, karakter, dan/atau latar dalam teks fiksi atau nonfiksi.', 58.74, [(5, 'Menyimpulkan perbedaan informasi dalam teks.', 61.47), (23, 'Menyimpulkan perubahan karakter atau watak tokoh dalam teks.', 60.17), (26, 'Menyimpulkan perubahan karakter tokoh dalam teks.', 54.58)]) +
 G('E', 'Menilai kesesuaian antarunsur dan/atau antarinformasi dalam teks.', 63.62, [(3, 'Menentukan kesesuaian antara judul dengan isi teks.', 62.59), (18, 'Menilai kesesuaian antara ilustrasi dengan isi teks.', 64.66)]) +
 G('E', 'Menilai relevansi peristiwa dalam teks dengan kehidupan sehari-hari berdasarkan pengalaman atau pengetahuan pribadi.', 62.37, [(8, 'Merefleksi peristiwa/kejadian dalam teks dengan kehidupan sehari-hari.', 55.50), (15, 'Merefleksikan pengetahuan baru dari teks dalam kehidupan sehari-hari.', 61.99), (21, 'Merefleksikan pengetahuan baru dari teks dengan kehidupan sehari-hari.', 65.39), (24, 'Merefleksikan nilai-nilai keteladanan dalam teks.', 66.57)]) +
 G('E', 'Menyimpulkan respons emosional terhadap unsur teks fiksi.', 63.47, [(27, 'Menentukan respons emosional terhadap peristiwa/konflik yang dialami tokoh dalam teks.', 63.57), (30, 'Menentukan respons emosional dari peristiwa/konflik dalam teks.', 63.37)])
)
SUMBER_PETA = 'Pusat Asesmen Pendidikan, daya serap TKA SD Bahasa Indonesia 2025/2026 (nasional)'
peta = {}
for el, l2, p2, n, ind, pi in DAFTAR:
    en, ep = EL[el]
    # Bahasa Indonesia hanya tiga tingkat: sub-elemen disamakan dengan elemen (analisis melewati tingkat bernama sama dengan induknya).
    peta[str(n)] = {'elemen': {'nama': en, 'nasional': ep}, 'subelemen': {'nama': en, 'nasional': ep}, 'kompetensi': {'nama': l2, 'nasional': p2}, 'indikator': {'nama': ind, 'nomor': n, 'nasional': pi}, 'sumber': SUMBER_PETA}
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
            if re.search(r'https?://|www\.', l): sumber.append(l.strip()); continue
            if re.match(r'^(Ilustrasi Gambar oleh|Terinspirasi dari tulisan)', l): sumber.append(l.strip()); continue
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

def perbaiki(n, t): return t

butir, tinjau = [], []
for n in range(1, 31):
    h = mentah[n]; k = h['kartu'][0]; u = h['urutan']; kn = KUNCI[n]
    teks, sumber = bersihkan(k['stem'])
    for i in range(len(k['imgs'])):
        teks = teks.replace(f'[IMG{i}]', f"[gambar: {gambar_url(u, 's', i, k['imgs'])}]")
    teks = rapikan(perbaiki(n, teks))
    bentuk = k['bentuk']
    statement_label = 'Pernyataan'
    konteks, pertanyaan = pecah_pertanyaan(teks)
    prompt = (konteks + '\n\n[pertanyaan]\n\n' if konteks else '') + pertanyaan
    if 'Kategori' in bentuk:
        tipe = 'statement_grid'
        baris = [l.strip() for l in k['tabel'].split('\n') if l.strip().startswith('|')]
        kepala = [c.strip() for c in baris[0].strip('|').split('|')]
        lab = [kepala[1], kepala[2]]
        pern = [b.strip().strip('|').split('|')[0].strip() for b in baris[1:]]
        assert len(pern) == 3 and len(kn['grid']) == 3, (n, pern)
        options = {'statements': pern, 'answer_labels': lab, 'statement_label': statement_label}
        benar = {'answers': kn['grid'], 'grading_mode': 'proportional'}
        jawab = [lab[0] if a else lab[1] for a in kn['grid']]
    else:
        pilihan = []
        for oi, o in enumerate(k['opsi']):
            if o['imgs']:
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

json.dump({'format': 'tera/butir-impor@1', 'catatan': 'Try out TKA SD Bahasa Indonesia, 30 contoh soal resmi Pusat Asesmen Pendidikan (daya serap TKA 2025/2026), nomor soal = nomor indikator. Kunci dibuat Claude (kebanyakan hasil hitungan) dan WAJIB ditinjau manusia, terutama yang bertanda PERIKSA.', 'butir': butir},
          open('butir-impor-tryout-sd-bin.json', 'w'), ensure_ascii=False, indent=1)
json.dump(peta, open('peta-kompetensi.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'catatan': 'Kunci dikerjakan Claude dari soal contoh Pusat Asesmen (daya serap TKA SD Bahasa Indonesia 2025/2026); situs tidak menampilkan kunci. Bertanda periksa = bergantung penafsiran.',
           'kunci': {str(n): {'jenis': t, 'jawaban': j, 'alasan': a, 'periksa': p} for n, t, j, a, p, q in tinjau}},
          open('kunci-buatan-claude.json', 'w'), ensure_ascii=False, indent=1)
md = ['# Tinjauan kunci: Try Out TKA Bahasa Indonesia SD', '', 'Kunci dibuat Claude (situs sumber tidak menampilkan kunci). Mohon tinjau yang bertanda **PERIKSA**.', '',
      '| No | Jenis | Pertanyaan | Kunci | Alasan | |', '|---|---|---|---|---|---|']
for n, t, j, a, p, q in sorted(tinjau, key=lambda x: (not x[4], x[0])):
    md.append(f"| {n} | {t} | {q[:70].replace('|', '/')} | {', '.join(j) if isinstance(j, list) else j} | {a} | {'**PERIKSA**' if p else ''} |")
open('tinjauan-kunci.md', 'w').write('\n'.join(md) + '\n')
from collections import Counter
print('butir', len(butir), Counter(b['type'] for b in butir), 'periksa', sum(1 for x in tinjau if x[4]))
