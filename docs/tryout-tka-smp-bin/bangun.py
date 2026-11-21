# Menyusun butir try out TKA SMP Bahasa Indonesia dari soal-mentah.json.
#   python3 docs/tryout-tka-smp-bin/bangun.py
# Keluaran: butir-impor-tryout-smp-bin.json, peta-kompetensi.json, kunci-buatan-claude.json, tinjauan-kunci.md
import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mentah = {x['nomor']: x for x in json.load(open('soal-mentah.json'))}
URL = json.load(open('url-gambar.json'))
T, F = True, False

# ---- KUNCI (dibuat Claude; situs tidak menampilkan kunci). idx = indeks pilihan (mulai 0); grid = True untuk kolom pertama.
KUNCI = {
 1: dict(idx=[0,2], alasan='Teks: sensor LiDAR = "sistem pemindaian laser atau pendeteksi rintangan sekitar". Pemantau jarak jauh = Fleet Management System; gerak mandiri = navigasi otonom.'),
 2: dict(idx=1, alasan='Urutan menurut teks: perancangan desain, perakitan komponen mekanik dan elektronik, pemasangan sistem sensor dan pemrograman, uji coba.'),
 3: dict(grid=[T,F,T], alasan='Istilah (navigasi otonom, LiDAR, Fleet Management System) dijelaskan dan ada glosarium; istilahnya teknis, bukan istilah yang familiar.'),
 4: dict(idx=[0,1], alasan='Teks: kombucha bermanfaat menguatkan sistem imunitas dan sumber prebiotik yang tinggi. Fermentasi dan aliran udara bukan khasiat bagi tubuh.'),
 5: dict(idx=0, alasan='Infografik langkah 5: kain kasa mencegah serangga/kotoran masuk sambil memungkinkan udara mengalir.'),
 6: dict(idx=3, periksa=True, alasan='Infografik langkah 6: fermentasi butuh tempat hangat (24-29 C). Tanpa itu fermentasi tidak berlangsung sehingga gula tidak terpakai. Pilihan 2 dan 3 mengaitkan penyebab dengan cahaya, padahal syaratnya suhu. Soal ambigu.'),
 7: dict(idx=1, alasan='Infografik, bagian Tujuan: mengetahui pengaruh larutan asam asetat (cuka) terhadap biodegradasi bioplastik dibandingkan plastik konvensional.'),
 8: dict(grid=[T,T,F], alasan='Kesimpulan infografik: cuka mempercepat biodegradasi bioplastik (massa turun lebih cepat). Polyethylene adalah plastik konvensional yang sulit terurai.'),
 9: dict(grid=[F,T,T], alasan='Elvina menilai warna infografik (visual), bukan bahasa. Nake (kalimat perintah sederhana, efektivitas) dan Ratna (kejelasan rincian kalimat) menilai bahasa.'),
 10: dict(idx=2, alasan='Memilih barang berkualitas membuat awet sehingga tidak perlu terus membeli: menghemat pengeluaran (manfaat ekonomi).'),
 11: dict(idx=2, alasan='Gambar kedua: anak laki-laki menabung dan senang, anak perempuan sedih dengan kaos kaki sobek: anak laki-laki lebih hemat.'),
 12: dict(grid=[F,T,F], alasan='Gambar kedua: anak perempuan sedih (kaos kaki sobek); anak laki-laki senang menabung dengan kaos kaki berkualitas, bukan kualitas biasa.'),
 13: dict(idx=[1,3], periksa=True, alasan='Brosur menjelaskan pengelolaan laut oleh pemerintah dan mengajak berperan dalam pelestarian. Keindahan hanya pembuka; nama taman adalah contoh.'),
 14: dict(idx=3, alasan='Brosur: Taman Konservasi Maritim mempertahankan warisan budaya maritim dan kearifan lokal.'),
 15: dict(grid=[T,F,F], periksa=True, alasan='Peta menegaskan lokasi di Indonesia. Peta hanya gambar umum seluruh Indonesia, tidak menandai persebaran atau letak kawasan tertentu.'),
 16: dict(grid=[F,T,F], alasan='Teks: Aku tidak tahu hukuman Seno dan yakin ia tak sanggup membayar denda; ia tidak pernah bertemu lagi dengan Aku; ia ditangkap sebelum membawa ikan keluar pulau.'),
 17: dict(idx=[0,1,2], periksa=True, alasan='Jika patuh: tetap warga dan nelayan pulau yang menantikan Saun Ta\'et. Pilihan 1 menyebut upacara "esok harinya", yang tidak dinyatakan jelas di teks. Pilihan 4 bertentangan dengan aturan (hanya Juni dan Desember).'),
 18: dict(idx=1, alasan='Seno mengebom ikan karena serakah/iri: keserakahan merusak alam (terumbu karang) dan hubungan dengan warga.'),
 19: dict(idx=[1,2], alasan='Lobi tetap pekerja: mengumpulkan nektar bersama Tawi dan memindahkannya ke sarang; tidak menggantikan ratu.'),
 20: dict(grid=[T,F,T], alasan='Tawi rajin dan bijaksana menegur Lobi; Lobi iri pada ratu. Tubuh Tawi ramping, bukan gendut.'),
 21: dict(grid=[F,T,T], alasan='Ratu tidak dibuang. Sarang lebah sebaiknya didekati dengan hati-hati (bisa disengat); tanaman berbunga menyediakan nektar.'),
 22: dict(idx=[1,2,3], periksa=True, alasan='Larik "suara kalong menghalau petang", "sebelum surya berlalu", dan "suara bedug bertalu-talu" menggambarkan petang. "Hamparan waktu" tidak spesifik.'),
 23: dict(grid=[T,T,F], periksa=True, alasan='Belalang berloncatan di semak: rindu yang bergejolak/tidak tenang namun indah, timbul tenggelam. Bukan keputusasaan.'),
 24: dict(grid=[T,F,T], periksa=True, alasan='Puisi merenungkan kenangan dan rindu lewat suara dan gerak alam. "Ketulusan meski tak sesuai harapan" tidak ada di puisi.'),
 25: dict(idx=3, alasan='Urutan teks: air mata nenek jatuh, muncul gundukan tanah, nenek menanam di gundukan, muncul emas berkilau.'),
 26: dict(grid=[T,T,F], alasan='Jika warga adil, nenek tidak sedih sehingga tidak ada gundukan dan emas; nenek tetap bertani/menanam seperti biasa.'),
 27: dict(grid=[F,T,T], alasan='Nenek membagi emas sama rata (tidak membalas), tidak tega merahasiakannya, dan perilakunya terpuji.'),
 28: dict(idx=3, alasan='Pak Hasan: ketupat bukan hanya untuk yang beragama Islam; semua orang boleh makan.'),
 29: dict(idx=[0,1], alasan='Ketupat makanan khas Lebaran dan sengaja disiapkan menyambut Lebaran; tidak ada kewajiban membagikan atau syarat.'),
 30: dict(idx=[0,1], alasan='Gambar: anak-anak memegang janur dan menganyam ketupat bersama ibu (membantu dan membuat ketupat bersama).'),
}

# ---- PETA KOMPETENSI (halaman daya serap: elemen > kelompok > indikator, % nasional)
EL = {'T':('Pemahaman Tekstual',61.62),'E':('Evaluasi dan Apresiasi',60.93),'I':('Pemahaman Inferensial',60.46)}
G = lambda el, nama, pct, inds: [(el, nama, pct, n, i, p) for n, i, p in inds]
DAFTAR = (
 G('T','Mengidentifikasi penggunaan istilah dalam berbagai bidang.',60.05,[(1,'Mengidentifikasi makna penggunaan istilah bidang tertentu dalam teks.',60.05)]) +
 G('T','Menyusun kerangka atau bagan berdasarkan bagian-bagian penting dalam teks.',64.44,[(2,'Menentukan bagan kerangka isi/informasi dalam teks.',64.44)]) +
 G('T','Mengidentifikasi informasi penting yang tersurat dalam teks.',59.67,[(4,'Mengidentifikasi informasi penting yang tersurat dalam teks.',59.67)]) +
 G('T','Mengidentifikasi objek dan/atau latar berdasarkan kosakata yang digunakan dalam teks fiksi atau nonfiksi.',62.33,[(22,'Menentukan kosakata yang sesuai dengan latar dalam teks.',62.33)]) +
 G('E','Menilai kesesuaian dan/atau keakuratan unsur, kebahasaan, atau isi berdasarkan perbandingan informasi dalam dan/atau antarteks.',59.23,[(3,'Menilai ketepatan penggunaan bahasa dalam teks.',59.71),(9,'Menilai penggunaan bahasa (diksi, efektivitas, dsb) dalam teks.',57.84),(12,'Menilai ketepatan antara ilustrasi dengan isi teks.',63.01),(15,'Menilai kesesuaian pendukung visual (grafik, tabel, dll) dalam menyampaikan pesan/topik dalam teks.',57.13),(30,'Menilai kesesuaian antara ilustrasi dengan isi teks.',58.46)]) +
 G('E','Menilai relevansi peristiwa dalam teks dengan kehidupan sehari-hari.',62.50,[(18,'Merefleksikan peristiwa dari teks dalam kehidupan sehari-hari.',59.84),(21,'Merefleksikan pengetahuan baru dari teks dalam kehidupan sehari-hari.',65.15)]) +
 G('E','Memprediksi peristiwa dalam teks.',64.52,[(26,'Menentukan prediksi cerita berdasarkan rangkaian peristiwa dalam teks.',64.52)]) +
 G('E','Menyimpulkan respons emosional terhadap unsur teks fiksi.',62.71,[(27,'Menentukan respons emosional berdasarkan konflik/peristiwa yang dialami tokoh dalam teks.',62.71)]) +
 G('I','Menjelaskan kelogisan hubungan antarperistiwa, antargagasan, dan/atau antarinformasi dalam dan/atau antarteks.',62.29,[(5,'Menjelaskan kelogisan hubungan sebab dan akibat dalam teks.',62.06),(8,'Menjelaskan hubungan logis (sebab-akibat, perbandingan, atau pertentangan) dalam teks.',63.82),(11,'Membandingkan (persamaan atau perbedaan) informasi dalam teks.',62.04),(20,'Menyimpulkan perbedaan unsur intrinsik dalam teks.',61.23)]) +
 G('I','Memprediksi peristiwa dalam teks.',59.45,[(6,'Memprediksi kemungkinan peristiwa jika ada perubahan/penghapusan informasi dalam teks.',58.67),(17,'Menyusun prediksi berdasarkan unsur intrinsik dalam teks.',61.83),(19,'Menyusun inferensi/kesimpulan berdasarkan unsur intrinsik dalam teks.',55.44),(29,'Menyusun kesimpulan berdasarkan unsur-unsur pendukung teks.',61.84)]) +
 G('I','Menyimpulkan ide pokok, gagasan pendukung, tokoh, peristiwa, latar, dan/atau nilai-nilai dalam dan/atau antarteks.',59.98,[(7,'Menyimpulkan tujuan penulis dalam teks.',62.09),(14,'Menyimpulkan isi atau substansi dalam teks.',62.42),(16,'Menjelaskan perubahan unsur intrinsik dalam teks.',58.03),(24,'Menentukan pesan/amanat dalam teks.',62.21),(28,'Mengidentifikasi perubahan pada unsur intrinsik dalam teks.',55.17)]) +
 G('I','Menyimpulkan ide pokok, gagasan pendukung, amanat, tokoh, peristiwa, dan/atau nilai-nilai dalam teks.',61.63,[(10,'Menjelaskan ide pendukung yang sesuai ide pokok dalam teks.',63.07),(13,'Menjelaskan ide pokok atau fokus utama teks.',60.18)]) +
 G('I','Menjelaskan bahasa kias dan citraan yang digunakan dalam teks fiksi.',60.86,[(23,'Menjelaskan makna bahasa kias dalam teks.',60.86)]) +
 G('I','Menyusun kerangka atau bagan berdasarkan bagian-bagian penting dalam teks.',56.85,[(25,'Menentukan kerangka kronologis peristiwa dalam teks.',56.85)])
)
SUMBER_PETA = 'Pusat Asesmen Pendidikan, daya serap TKA SMP Bahasa Indonesia 2025/2026 (nasional)'
peta = {}
for el, l2, p2, n, ind, pi in DAFTAR:
    en, ep = EL[el]
    # Bahasa Indonesia hanya tiga tingkat (kompetensi > kelompok > indikator): sub-elemen disamakan dengan elemen,
    # dan analisis melewati tingkat yang namanya sama dengan induknya.
    peta[str(n)] = {'elemen': {'nama': en, 'nasional': ep}, 'subelemen': {'nama': en, 'nasional': ep}, 'kompetensi': {'nama': l2, 'nasional': p2}, 'indikator': {'nama': ind, 'nomor': n, 'nasional': pi}, 'sumber': SUMBER_PETA}
assert sorted(map(int, peta)) == list(range(1, 31))

# ---- merakit butir
def teks_img(stem, imgs, urutan, opsi=False):
    out = stem
    for i in range(len(imgs)):
        ext = imgs[i].rsplit('.', 1)[1]
        nama = f's{urutan:02d}_{i}.{ext}'
        out = out.replace(f'[IMG{i}]', f'[gambar: {URL[nama]}]')
    return out

def bersihkan(stem):
    paras, sumber, keluar = re.split(r'\n\s*\n', stem), [], []
    for p in paras:
        baris = [l.strip() for l in p.split('\n')]
        simpan = []
        for l in baris:
            if re.match(r'^\s*-?\s*(\d+\.\s*)?(https?://|www\.)', l): sumber.append(l.strip()); continue
            simpan.append(l)
        t = '\n'.join(simpan).strip()
        if not t: continue
        if re.match(r'^Sumber', t, re.I) and len(t) < 60: sumber.append(t); continue
        if re.match(r'^(Rahmawati|Tim Abdi Guru|Situs Kementerian|Canva\.com|Cerita dikembangkan dari)', t): sumber.append(t); continue
        keluar.append(t)
    return '\n\n'.join(keluar), sumber

def pecah_pertanyaan(teks):
    baris = teks.split('\n')
    inst = next((i for i, l in enumerate(baris) if l.strip().startswith('Klik pada')), len(baris))
    q = max(i for i in range(inst) if baris[i].strip())
    konteks = '\n'.join(baris[:q]).strip()
    pertanyaan = '\n'.join(l.strip() for l in baris[q:] if l.strip())
    return konteks, pertanyaan

butir, tinjau = [], []
for n in range(1, 31):
    h = mentah[n]; k = h['kartu'][0]; u = h['urutan']; kn = KUNCI[n]
    teks, sumber = bersihkan(k['stem'])
    teks = teks_img(teks, k['imgs'], u)
    konteks, pertanyaan = pecah_pertanyaan(teks)
    prompt = (konteks + '\n\n' if konteks else '') + '[pertanyaan]\n\n' + pertanyaan
    bentuk = k['bentuk']
    if 'Kategori' in bentuk:
        tipe = 'statement_grid'
        t = k['teksPenuh']
        m = re.search(r'Pernyataan\t([^\t\n]+)\t([^\t\n]+)', t)
        lab = [m.group(1).strip(), m.group(2).strip()]
        sisa = t[m.end():]
        pern = [l.strip() for l in sisa.split('\n') if l.strip()]
        assert len(pern) == 3 and len(kn['grid']) == 3, (n, pern)
        options = {'statements': pern, 'answer_labels': lab, 'statement_label': 'Pernyataan'}
        benar = {'answers': kn['grid'], 'grading_mode': 'proportional'}
        jawab = [lab[0] if a else lab[1] for a in kn['grid']]
    else:
        pilihan = []
        for oi, o in enumerate(k['opsi']):
            if o['imgs']:
                ext = o['imgs'][0].rsplit('.', 1)[1]
                pilihan.append(f"[gambar: {URL[f's{u:02d}_o{oi}.{ext}']}]")
            else: pilihan.append(o['teks'].strip())
        assert len(pilihan) == 4, (n, pilihan)
        options = {'choices': pilihan}
        if 'MCMA' in bentuk:
            tipe = 'mcq_multi'; benar = [pilihan[i] for i in kn['idx']]; jawab = [pilihan[i] for i in kn['idx']]
        else:
            tipe = 'mcq_single'; benar = pilihan[kn['idx']]; jawab = benar
    expl = kn['alasan'] + (' [Kunci buatan Claude; PERIKSA.]' if kn.get('periksa') else ' [Kunci buatan Claude.]')
    sumber = [x for x in sumber if x and not re.match(r'^Sumber[^:]*:?\s*$', x.strip('- ').strip(), re.I)]
    if sumber: expl += ' Sumber bacaan: ' + ' | '.join(x.strip('- ') for x in sumber)
    butir.append({'type': tipe, 'prompt': prompt, 'options': options, 'correct_answer': benar, 'weight': 1, 'sumber_pembuatan': 'manual', 'status_verifikasi': 'draf', 'explanation': expl})
    tinjau.append((n, tipe, jawab, kn['alasan'], bool(kn.get('periksa')), pertanyaan.split('\n')[0]))

json.dump({'format': 'tera/butir-impor@1', 'catatan': 'Try out TKA SMP Bahasa Indonesia, 30 contoh soal resmi Pusat Asesmen Pendidikan (daya serap TKA 2025/2026), nomor soal = nomor indikator. Kunci dibuat Claude dan WAJIB ditinjau manusia sebelum dipakai. Tanpa topik dan tanpa kolam, jadi tidak masuk paket latihan.', 'butir': butir}, open('butir-impor-tryout-smp-bin.json', 'w'), ensure_ascii=False, indent=1)
json.dump(peta, open('peta-kompetensi.json', 'w'), ensure_ascii=False, indent=1)
json.dump({'catatan': 'Kunci dikerjakan Claude dari soal contoh Pusat Asesmen (daya serap TKA SMP Bahasa Indonesia 2025/2026); situs tidak menampilkan kunci. WAJIB ditinjau manusia sebelum diaktifkan. Bertanda periksa = ambigu atau bergantung pada penafsiran/gambar.', 'kunci': {str(n): {'tipe': t, 'jawaban': j, 'alasan': a, 'periksa': p} for n, t, j, a, p, _ in tinjau}}, open('kunci-buatan-claude.json', 'w'), ensure_ascii=False, indent=1)
md = ['# Tinjauan kunci: Try Out TKA Bahasa Indonesia SMP', '', 'Kunci dibuat Claude (situs sumber tidak menampilkan kunci). Mohon tinjau, terutama yang bertanda **PERIKSA**.', '', '| No | Jenis | Pertanyaan | Kunci | Alasan | |', '|---|---|---|---|---|---|']
for n, t, j, a, p, q in sorted(tinjau, key=lambda x: (not x[4], x[0])):
    md.append(f"| {n} | {t} | {q[:70]} | {', '.join(j) if isinstance(j, list) else j} | {a} | {'**PERIKSA**' if p else ''} |")
open('tinjauan-kunci.md', 'w').write('\n'.join(md) + '\n')
from collections import Counter
print('butir', len(butir), Counter(b['type'] for b in butir), 'periksa', sum(1 for x in tinjau if x[4]))
