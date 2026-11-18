/**
 * Pustaka gambar untuk bahan latihan (stasiun mesin di `bersama.ts`).
 *
 * KENAPA ADA. Bahan latihan yang berupa teks saja terasa seperti ujian dan
 * menyulitkan anak yang baru membaca. Setiap butir boleh membawa `g`: satu
 * gambar (atau daftar gambar) yang menjelaskan soalnya secara visual. Gambar
 * digambar lewat SVG/HTML oleh skrip di halaman, tanpa berkas gambar, mengikuti
 * warna dan mode gelap halaman.
 *
 * BENTUK. `g` adalah objek `{ k: 'jenis', ...parameter }`. Jenis yang ada ada di
 * `GBR` pada `JS_GAMBAR` di bawah; di sisi TypeScript, pembangun kecil (`ikat`,
 * `nilai`, `pola`, ...) menjaga bahan topik tetap ringkas dan terbaca.
 * Jenis yang tidak dikenal membuat halaman menampilkan galat di konsol dan
 * pengujian per-butir gagal, jadi salah ketik tidak lolos diam-diam.
 *
 * Aturan menulis berkas ini sama dengan berkas materi: JANGAN memakai backtick
 * atau "${" di dalam string JS/CSS (isinya `String.raw`).
 */

export type Gambar = { k: string; [parameter: string]: unknown }
export type GambarItem = Gambar | Gambar[]

/* ---------- pembangun untuk bahan topik ---------- */
export const ikat = (t: number, l: number, label?: string): Gambar => ({ k: 'ikat', t, l, ...(label ? { label } : {}) })
export const nilai = (n: number, d = 4, sorot?: number, ket = false): Gambar => ({ k: 'nilai', n, d, ...(sorot === undefined ? {} : { sorot }), ket })
export const baris = (b: { e: string; n: number; l: string }[], skala?: string): Gambar => ({ k: 'baris', baris: b, ...(skala ? { skala } : {}) })
export const pola = (s: string[], hilang: number[] = [], kol?: number): Gambar => ({ k: 'pola', s, hilang, ...(kol ? { kol } : {}) })
export const bangun = (b: string, w = 'biru', l?: string): Gambar => ({ k: 'bangun', b, w, ...(l ? { l } : {}) })
export const bangunDaftar = (daftar: { b: string; w?: string; l?: string; r?: number }[]): Gambar => ({ k: 'bangun', daftar })
export const garis = (a: number, b: number, langkah: number, o: { lab?: number; titik?: { v: number; w?: string; l?: string }[]; busur?: { dari: number; ke: number; l?: string }[] } = {}): Gambar => ({ k: 'garis', a, b, langkah, ...o })
export const kerangka = (isi: number, luar = 0, k = 1): Gambar => ({ k: 'kerangka', isi, luar, kerangka: k })
export const gabung = (e: string, a: number, b: number, op: '+' | '-'): Gambar => ({ k: 'gabung', e, a, b, op })
export const pecahan = (daftar: { b: string; n: number; w: number[]; u?: 'besar' | 'kecil'; l?: string }[]): Gambar => ({ k: 'pecahan', daftar })
export const neraca = (kiri: string, kanan: string, turun: 'kiri' | 'kanan' | null, kiriL = '', kananL = ''): Gambar => ({ k: 'neraca', kiri, kanan, turun, kiriL, kananL })
export const batang = (b: { l: string; n: number; w?: string }[], satuan = '', sejajar = true): Gambar => ({ k: 'batang', baris: b, satuan, sejajar })
export const tali = (n: number, satuan = 'jengkal'): Gambar => ({ k: 'tali', n, satuan })
export const lomba = (b: { l: string; e?: string; m: number; s: number; w?: string }[]): Gambar => ({ k: 'lomba', baris: b })
export const hadap = (bola: 'rani' | 'dodi' | 'tengah' | null = null, n1 = 'Rani', n2 = 'Dodi'): Gambar => ({ k: 'hadap', bola, n1, n2 })
export const antri = (n: string[], samping = false): Gambar => ({ k: 'antri', n, samping })
export const meja = (atas: string, bawah: string): Gambar => ({ k: 'meja', atas, bawah })
export const dalam = (dalamE: string, luarE: string): Gambar => ({ k: 'dalam', dalam: dalamE, luar: luarE })
export const susun = (items: { l: string; w?: string }[], arah: 'tegak' | 'datar' = 'tegak'): Gambar => ({ k: 'susun', items, arah })
export const kartu = (d: number[]): Gambar => ({ k: 'kartu', d })
export const blok = (n: number, label?: string): Gambar => ({ k: 'blok', n, ...(label ? { label } : {}) })
/** Soal bersusun. `tanda`: catatan kecil di atas kolom (kol 0 = ribuan ... 3 = satuan), mis. simpanan "1" atau pinjaman "+10". */
export const kolom = (a: number, b: number, op: '+' | '-', o: { hasil?: number; tanda?: { kol: number; teks: string }[]; sorot?: number } = {}): Gambar => ({ k: 'kolom', a, b, op, ...o })
/** Larik titik r baris x c kolom (perkalian). `sorot`: banyak baris pertama yang dinyalakan. */
export const larik = (r: number, c: number, sorot?: number): Gambar => ({ k: 'larik', r, c, ...(sorot === undefined ? {} : { sorot }) })
/** k kelompok (piring) masing-masing n benda; `plus` menulis tanda + di antaranya; `sisa` benda yang tidak kebagian. */
export const kelompok = (e: string, k: number, n: number, o: { sisa?: number; plus?: boolean } = {}): Gambar => ({ k: 'kelompok', e, jumlah: k, n, ...o })
/** Timbangan seimbang untuk kalimat dengan kotak: k kantong "?", p butir tambahan, m butir yang dikurangkan di kiri; n butir di kanan. */
export const timbang = (k: number, p: number, m: number, n: number): Gambar => ({ k: 'timbang', kantong: k, plus: p, minus: m, kanan: n })
/** Tabel mendatar: tiap baris diawali label, mis. posisi dan nilai suku pola. */
export const tabel = (baris: (string | number)[][]): Gambar => ({ k: 'tabel', baris })
/** Jaring-jaring: kubus, tabung, limas, atau prisma. */
export const jaring = (jenis: 'kubus' | 'tabung' | 'limas' | 'prisma'): Gambar => ({ k: 'jaring', jenis })
/** Dua tampak sebuah benda: dari atas dan dari samping (nama bangun datar). */
export const pandang = (atas: string, samping: string): Gambar => ({ k: 'pandang', atas, samping })
/** Tumpukan kubus satuan (isometrik). `h`: peta tinggi (baris x kolom). `lapisan`: tampilkan hanya z < lapisan. `baru`: lapisan yang baru diletakkan (animasi). */
export const tumpuk = (h: number[][], o: { lapisan?: number; baru?: number } = {}): Gambar => ({ k: 'tumpuk', h, ...o })
/** Tampak tumpukan kubus dari 'atas', 'depan', atau 'samping'. */
export const tampak = (h: number[][], dari: 'atas' | 'depan' | 'samping', angka = false): Gambar => ({ k: 'tampak', h, dari, angka })
/** Bangun ruang yang dipotong lurus: arah 'mendatar' | 'tegak' | 'miring'; pos 0..1 letak potongan. */
export const potong = (b: string, arah: 'mendatar' | 'tegak' | 'miring', pos = 0.5, w = 'biru'): Gambar => ({ k: 'potong', b, arah, pos, w })
export const bar = (bagian: { l: string; v: number; w?: string }[], atas?: string): Gambar => ({ k: 'bar', bagian, ...(atas ? { atas } : {}) })
/**
 * diagram batang. lo/hi: rentang sumbu tegak (lo bisa bukan 0), langkah: jarak label,
 * label: daftar label sendiri, rata: label digambar berjarak SAMA walau nilainya tidak
 * (diagram yang salah), tanpaAngka: sumbu tanpa angka, lebar: pengali lebar tiap batang,
 * sorot: bagian yang ditandai ('judul' | 'tegak' | 'datar' | 'kategori' | 'skala' | 'batang'),
 * tandai: indeks batang yang disorot, nilai: tulis angka di atas batang, anim: batang tumbuh,
 * garis: garis putus-putus mendatar pada nilai tertentu (mis. rata-rata) dengan tulisan l.
 */
export const diagram = (
  d: { l: string; v: number; w?: string }[],
  o: { lo?: number; hi: number; langkah?: number; label?: number[]; rata?: boolean; tanpaAngka?: boolean; lebar?: number[]; judul?: string; sat?: string; nilai?: boolean; sorot?: string; tandai?: number[]; anim?: boolean; garis?: { v: number; l: string }[] },
): Gambar => ({ k: 'diagram', d, ...o })

/**
 * pita pecahan: tiap baris n bagian sama besar, w bagian berwarna. tebal: garis tebal tiap
 * kelipatan sekian bagian (untuk menunjukkan bagian yang dibelah atau digabung).
 * ukuran: lebar relatif tiap bagian bila bagian TIDAK sama besar (n diabaikan).
 * sejajar: garis putus-putus di ujung bagian berwarna baris pertama, melintasi semua baris.
 */
export const pita = (baris: { n: number; w: number; l?: string; tebal?: number; warna?: string; ukuran?: number[] }[], o: { sejajar?: boolean; anim?: boolean } = {}): Gambar => ({ k: 'pita', baris, ...o })
/** garis bilangan 0..m dibagi n bagian sama; titik: {k: bagian ke-k dari 0, l: label}; nomor: angka bagian di bawah tanda */
export const garispec = (m: number, n: number, o: { titik?: { k: number; l?: string; w?: string }[]; nomor?: boolean } = {}): Gambar => ({ k: 'garispec', m, n, ...o })
/** garis bilangan untuk pembulatan: n di antara dua kelipatan satuan t (puluhan, ratusan, ribuan); ke: bola sudah berada di hasil bulat */
export const bulat = (n: number, t: 'puluhan' | 'ratusan' | 'ribuan', ke = false): Gambar => ({ k: 'bulat', n, t, ke })
/** neraca: kb kotak berlabel l (default n) + ku satuan di kiri, kn satuan di kanan (kel kelompok sama banyak); sorot: kotak dan kelompok pertama; angkaL/angkaR: pan berisi angka; sud: derajat miring */
export const setara = (o: { kb?: number; ku?: number; kn?: number; kel?: number; l?: string; sorot?: boolean; angkaL?: number; angkaR?: number; sud?: number }): Gambar => ({ k: 'setara', ...o })
/** persegi petak n x n; isi: hanya isi x isi petak di pojok yang berwarna (default semua) */
export const petak = (n: number, isi?: number): Gambar => ({ k: 'petak', n, ...(isi === undefined ? {} : { isi }) })
/** kubus n x n x n digambar sebagai n lapisan, tiap lapisan n x n petak */
export const lapis = (n: number): Gambar => ({ k: 'lapis', n })
/**
 * bangun gabungan persegi panjang + segitiga, diberi label ukuran.
 * jenis: 'rumah' (atap segitiga di atas, alas = p), 'samping' (segitiga sama kaki di sisi kanan, alas = l),
 * 'siku' (segitiga siku-siku di sisi kanan, alas mendatar a, trapesium), 'layang' (dua segitiga beralas a berimpit, tinggi t dan t2),
 * 'tri' (segitiga tunggal beralas a, tinggi t), 'pp' (persegi panjang p x l saja; lab.isi: tulisan di tengah). lab: teks label untuk p, l, a, t, t2, m (miring).
 * sorot: 'persegi' atau 'seg' menebalkan satu bagian; pisah: garis putus-putus sisi yang menyatu.
 */
export const gabungan = (
  jenis: 'rumah' | 'samping' | 'siku' | 'layang' | 'tri' | 'pp',
  d: { p?: number; l?: number; a?: number; t?: number; t2?: number },
  lab: { p?: string; l?: string; a?: string; t?: string; t2?: string; m?: string; isi?: string } = {},
  o: { sorot?: 'persegi' | 'seg'; pisah?: boolean } = {},
): Gambar => ({ k: 'gabungan', jenis, ...d, lab, ...o })
/**
 * balok (atau kubus) p x l x t dalam proyeksi miring: sisi depan biru, samping hijau, atas kuning.
 * atas: balok lain yang ditumpuk di pojok depan-kiri; grid: garis satuan; isi: hanya sebanyak itu lapisan (tinggi) yang digambar;
 * sorot: 'depan' | 'samping' | 'atas' (sisi lain dipudarkan); tempel: tandai bidang yang menempel. lab: p, l, t, ta.
 */
export const balok = (
  p: number, l: number, t: number,
  o: { atas?: { p: number; l: number; t: number }; grid?: boolean; isi?: number; sorot?: 'depan' | 'samping' | 'atas'; tempel?: boolean; lab?: { p?: string; l?: string; t?: string; ta?: string } } = {},
): Gambar => ({ k: 'balok', p, l, t, ...o })
/**
 * sudut. mode: 'satu' (sudut deg dengan busur; kaki: panjang kaki 0.4 sampai 1; r: jari-jari busur), 'busur' (busur derajat dengan sinar pada deg),
 * 'pelurus' / 'penyiku' (dua sudut berdampingan, deg = sudut pertama), 'silang' (dua garis berpotongan, deg = sudut pertama),
 * 'putaran' (sudut mengelilingi titik; sudut: daftar {v, l}), 'segitiga' (a, b sudut alas; lab: tiga label), 'segiempat' (lab: empat label; diagonal).
 * lab: label ('50°', '?'); labA, labB, labC, labD untuk mode dengan beberapa sudut.
 */
export const sudut = (
  mode: 'satu' | 'busur' | 'pelurus' | 'penyiku' | 'silang' | 'putaran' | 'segitiga' | 'segiempat',
  o: { deg?: number; lab?: string; labA?: string; labB?: string; labC?: string; labD?: string; kaki?: number; r?: number; sudut?: { v: number; l: string }[]; a?: number; b?: number; diagonal?: boolean } = {},
): Gambar => ({ k: 'sudut', mode, ...o })
/** jam dinding analog yang menunjuk menit ke-t sejak tengah malam; lab: tulisan digital di bawah */
export const jam = (t: number, lab?: string): Gambar => ({ k: 'jam', t, ...(lab ? { lab } : {}) })
/** garis waktu dari menit a ke menit b (b boleh melewati tengah malam); lab: label a, b, dan durasi d */
export const lini = (a: number, b: number, lab: { a?: string; b?: string; d?: string } = {}): Gambar => ({ k: 'lini', a, b, lab })
/** papan seratus: p dari 100 petak diwarnai (persen); sorot: petak terakhir yang ditandai */
export const seratus = (p: number): Gambar => ({ k: 'seratus', p })
/** bilangan desimal dalam kolom tempat (satuan, persepuluhan, perseratusan, perseribuan); s ditulis dengan koma, mis. "0,375" */
export const desimal = (s: string): Gambar => ({ k: 'desimal', s })
/** papan bilangan 1..n; kelipatan a berwarna biru, kelipatan b kuning, keduanya hijau; sorot: angka yang dilingkari */
export const papan = (n: number, o: { a?: number; b?: number; kol?: number; sorot?: number[] } = {}): Gambar => ({ k: 'papan', n, ...o })
/** semua faktor n; default berupa pasangan (1 x 12, 2 x 6, ...), semua: daftar faktor tunggal */
export const faktor = (n: number, o: { semua?: boolean } = {}): Gambar => ({ k: 'faktor', n, ...o })

/** penggaris: benda sepanjang n satuan, diletakkan mulai dari 0 */
export const penggaris = (n: number, maks: number, o: { sat?: string; l?: string; w?: string; langkah?: number } = {}): Gambar => ({ k: 'penggaris', n, maks, ...o })
/** gelas takar berisi n (dari maks) */
export const takar = (n: number, maks: number, o: { sat?: string; w?: string; langkah?: number } = {}): Gambar => ({ k: 'takar', n, maks, ...o })
/** timbangan berjarum: menunjuk n dari maks */
export const timbangan = (n: number, maks: number, o: { sat?: string; l?: string } = {}): Gambar => ({ k: 'timbangan', n, maks, ...o })
/** dua kotak dihubungkan panah pengubah satuan, mis. ubah('3 km', '? m', '× 1.000') */
export const ubah = (dari: string, ke: string, f: string): Gambar => ({ k: 'ubah', dari, ke, f })

export const CSS_GAMBAR = String.raw`
/* pustaka gambar bahan latihan (awalan mq-) */
.mq-gambar{display:flex;flex-direction:column;gap:10px;align-items:center;background:var(--card);border:2px solid var(--line);border-radius:20px;padding:12px;color:var(--ink)}
.mq-gambar:empty{display:none}
.mq-gambar>*{max-width:100%}
.mq-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;align-items:flex-end}
.mq-kolom{display:flex;flex-direction:column;align-items:center;gap:4px}
.mq-cap{font-family:var(--display);font-weight:800;font-size:1rem;text-align:center}
.mq-skala{font-family:var(--display);font-weight:800;font-size:1.05rem;background:var(--soft);border:2px dashed var(--lidi);border-radius:12px;padding:2px 12px;align-self:center}
.mq-baris{display:flex;flex-direction:column;gap:2px;width:100%}
.mq-br{display:flex;align-items:center;gap:8px;border-bottom:2px dashed var(--line);padding:3px 0;min-height:46px}
.mq-bl{font-family:var(--display);font-weight:800;font-size:1.05rem;width:5.2em;flex:none}
.mq-bi{display:flex;flex-wrap:wrap;gap:3px;font-size:1.7rem;line-height:1.1;flex:1}
.mq-bn{font-family:var(--display);font-weight:800;color:var(--muted);flex:none}
.mq-pola{display:grid;gap:5px;justify-content:center;width:100%}
.mq-pc{aspect-ratio:1;min-width:0;border-radius:12px;border:2px solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:1.7rem;line-height:1}
.mq-pc svg{width:100%;height:100%}
.mq-pc .angka{font-family:var(--display);font-weight:800;font-size:1.15rem;line-height:1}
.mq-pc.q{border:2px dashed var(--ikat);background:var(--soft);font-family:var(--display);font-weight:800}
.mq-nilai{display:flex;gap:6px;justify-content:center}
.mq-nk{display:flex;flex-direction:column;align-items:center;gap:3px;border:2px solid var(--line);border-radius:14px;padding:6px 4px;min-width:64px;background:var(--card)}
.mq-nk .nm{font-size:.78rem;font-family:var(--display);font-weight:800;color:#fff;border-radius:99px;padding:0 7px}
.mq-nk .dg{font-family:var(--display);font-weight:800;font-size:2.4rem;line-height:1;font-variant-numeric:tabular-nums}
.mq-nk .vl{font-size:.8rem;color:var(--muted);font-variant-numeric:tabular-nums}
.mq-nk.sorot{border-color:var(--ikat);background:var(--soft);box-shadow:0 0 0 3px rgba(217,79,61,.25)}
.mq-gab{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.7rem;line-height:1.15}
.mq-gab .grup{display:flex;flex-wrap:wrap;gap:2px;max-width:230px;justify-content:center}
.mq-gab .op{font-family:var(--display);font-weight:800;font-size:2rem;color:var(--ikat)}
.mq-gab .coret{opacity:.28;filter:grayscale(1);position:relative}
.mq-kartu{display:flex;gap:10px;justify-content:center}
.mq-kartu span{width:58px;height:74px;border:3px solid var(--ink);border-radius:12px;background:var(--soft);font-family:var(--display);font-weight:800;font-size:2.2rem;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 var(--ink)}
.mq-lomba{display:flex;flex-direction:column;gap:8px;width:100%}
.mq-lr{display:grid;grid-template-columns:5.6em 1fr;gap:8px;align-items:center}
.mq-lr .lb{font-family:var(--display);font-weight:800;font-size:1.05rem}
.mq-lr .tr{position:relative;height:22px;border-radius:99px;background:var(--line)}
.mq-lr .tr i{position:absolute;top:0;bottom:0;border-radius:99px;border:2px solid var(--ink)}
.mq-blok{display:flex;gap:16px;align-items:flex-end;justify-content:center;flex-wrap:wrap}
.mq-bg{display:flex;flex-direction:column;align-items:center;gap:4px}
.mq-bg .isi{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;max-width:116px;min-height:16px}
.mq-bg .r .b{width:30px;height:30px;background:#4a7bd0;border:2px solid currentColor;border-radius:5px}
.mq-bg .p .b{width:10px;height:34px;background:#2e9a63;border:2px solid currentColor;border-radius:3px}
.mq-bg .s .b{width:11px;height:11px;background:#e0a93b;border:2px solid currentColor;border-radius:3px}
.mq-bg .cap{font-size:.82rem;color:var(--muted);font-weight:800}
.mq-kol{display:grid;grid-template-columns:34px repeat(4,46px);gap:2px 4px;font-family:var(--display);font-weight:800;font-size:2.2rem;line-height:1.15;font-variant-numeric:tabular-nums;justify-items:center;align-items:center}
.mq-kol .c{width:100%;text-align:center;border-radius:8px}
.mq-kol .c.sorot{background:var(--soft);box-shadow:0 0 0 2px var(--lidi)}
.mq-kol .t{font-size:1.1rem;color:var(--ikat);min-height:1.3em;animation:kedip 1.6s ease-in-out infinite}
.mq-kol .op{font-size:2rem;color:var(--ikat)}
.mq-kol .gr{grid-column:1 / -1;width:100%;border-top:4px solid var(--ink);border-radius:2px;margin:2px 0}
.mq-kol .q{color:var(--ikat)}
.mq-gambar>*{animation:masukG .4s ease-out}
@keyframes masukG{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}
@keyframes kedip{50%{transform:translateY(-3px);opacity:.55}}
.mq-larik{display:grid;gap:4px;justify-content:center}
.mq-larik .dt{width:100%;aspect-ratio:1;border-radius:50%;border:2px solid var(--ink);background:var(--ikat)}
.mq-larik .dt.b{background:var(--rb,#4a7bd0)}
.mq-larik .dt.mati{background:var(--line)}
.mq-kel{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}
.mq-kel .plus{font-family:var(--display);font-weight:800;font-size:1.6rem;color:var(--ikat)}
.mq-kel .piring{min-width:60px;min-height:60px;max-width:96px;border-radius:50%;border:3px solid var(--ink);background:var(--soft);display:flex;flex-wrap:wrap;gap:1px;justify-content:center;align-content:center;font-size:1.1rem;line-height:1.1;padding:5px}
.mq-kel .piring b{font-family:var(--display);font-size:1.5rem}
.mq-kel .sisa{min-width:60px;min-height:60px;border-radius:16px;border:3px dashed var(--ikat);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.1rem;padding:4px 8px}
.mq-kel .sisa small{color:var(--ikat);font-weight:800}
.mq-tabel{border-collapse:collapse;font-family:var(--display);font-weight:800;font-size:1.15rem;font-variant-numeric:tabular-nums}
.mq-tabel td{border:2px solid var(--ink);padding:4px 10px;text-align:center;min-width:2.2em}
.mq-tabel td:first-child{background:var(--soft);text-align:left}
.mq-tabel td.q{color:var(--ikat)}
.kb.baru{animation:turunKb .5s ease-out}
@keyframes turunKb{from{transform:translateY(-26px);opacity:0}to{transform:none;opacity:1}}
.mq-tampak{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-end}
.pc{transition:transform .9s cubic-bezier(.4,1.2,.5,1)}
.mq-lr .sk{grid-column:2;display:flex;justify-content:space-between;font-size:.8rem;color:var(--muted);margin-top:-4px}
.tb{transform-box:fill-box;transform-origin:50% 100%;animation:tumbuh .7s ease-out both}
@keyframes tumbuh{from{transform:scaleY(0)}}
.pt{transform-box:fill-box;transform-origin:0 50%;animation:melebar .8s ease-out both}
@keyframes melebar{from{transform:scaleX(0)}}
.mq-100{display:grid;grid-template-columns:repeat(10,1fr);gap:2px;width:100%;max-width:200px}
.mq-100 i{aspect-ratio:1;border:1.5px solid var(--line);border-radius:3px;background:var(--card)}
.mq-100 i.a{background:#4a7bd0;border-color:#4a7bd0}
.mq-koma{font-family:var(--display);font-weight:800;font-size:2.6rem;align-self:flex-end;color:var(--ikat);line-height:1}
.mq-nr{width:100%;max-width:340px;margin:0 auto;display:flex;flex-direction:column;align-items:center}
.mq-nr .bar{width:100%;display:flex;gap:6%;justify-content:center;transition:transform .7s;transform-origin:50% 100%;align-items:stretch}
.mq-nr .pan{width:47%;min-height:64px;display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-content:flex-end;padding:4px 4px 6px;border-bottom:6px solid var(--ink);border-radius:0 0 14px 14px;background:var(--card)}
.mq-nr .kt{min-width:30px;height:30px;border-radius:8px;border:2px solid var(--ink);background:var(--rb,#e0a93b);display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:800;color:#2b2a33}
.mq-nr .u{width:14px;height:14px;border-radius:50%;background:#4a7bd0;border:2px solid var(--ink);display:block}
.mq-nr .gr{display:flex;flex-wrap:wrap;gap:2px;padding:3px;border:2px dashed var(--line);border-radius:8px;max-width:100%}
.mq-nr .so{box-shadow:0 0 0 3px var(--ikat)}
.mq-nr .ang{font-family:var(--display);font-weight:800;font-size:1.8rem;align-self:center}
.mq-nr .tg{width:0;height:0;border-left:16px solid transparent;border-right:16px solid transparent;border-bottom:34px solid var(--ink);margin-top:-2px}
.mq-kd{display:grid;gap:2px;width:100%;max-width:260px;margin:0 auto}
.mq-kd i{aspect-ratio:1;border-radius:3px;border:1.5px solid var(--line);background:var(--card);display:block;transition:background .25s}
.mq-kd i.a{background:#4a7bd0;border-color:#2f5ba5}
.mq-ls{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.mq-ls .ly{display:grid;gap:1px;padding:2px;border:2px solid var(--ink);border-radius:4px;background:var(--card)}
.mq-ls .ly i{width:9px;height:9px;background:#2e9a63;display:block;border-radius:1px}
.mq-papan{display:grid;gap:3px;width:100%;max-width:340px}
.mq-papan .pk{aspect-ratio:1;border:2px solid var(--line);border-radius:8px;font-family:var(--display);font-weight:800;font-size:.8rem;display:flex;align-items:center;justify-content:center;background:var(--card);color:var(--ink);transition:background .25s}
.mq-papan .pk.a{background:#4a7bd0;color:#fff;border-color:#4a7bd0}
.mq-papan .pk.b{background:#e0a93b;color:#2b2a33;border-color:#b97f12}
.mq-papan .pk.ab{background:#2e9a63;color:#fff;border-color:#2e9a63}
.mq-papan .pk.so{box-shadow:0 0 0 3px var(--ikat)}
.mq-fak{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.mq-fak span{border:2px solid var(--ikat);background:var(--soft);border-radius:12px;padding:2px 10px;font-family:var(--display);font-weight:800;font-size:1.05rem;font-variant-numeric:tabular-nums}
.mq-ubah{display:flex;align-items:center;gap:10px;justify-content:center;font-family:var(--display);font-weight:800;font-size:1.6rem}
.mq-ubah .kt{border:3px solid var(--ink);border-radius:14px;padding:6px 14px;background:var(--soft);font-variant-numeric:tabular-nums}
.mq-ubah .kt.q{border-style:dashed;border-color:var(--ikat);color:var(--ikat)}
.mq-ubah .pn{display:flex;flex-direction:column;align-items:center;color:var(--ikat);line-height:1.1}
.mq-ubah .pn small{font-size:1rem}
`

export const JS_GAMBAR = String.raw`
/* ---- pustaka gambar bahan latihan (GBR) ---- */
var NSG='http://www.w3.org/2000/svg';
var PL={merah:'#d94f3d',biru:'#4a7bd0',hijau:'#2e9a63',kuning:'#e0a93b',ungu:'#c75ba0',abu:'#9b95ab',roti:'#f4d79a',oranye:'#ef8a3c'};
function sg(tag,a,p){var e=document.createElementNS(NSG,tag);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function kanvas(w,h,maks){var s=sg('svg',{viewBox:'0 0 '+w+' '+h,'aria-hidden':'true'});s.style.width='100%';s.style.maxWidth=(maks||w*1.5)+'px';s.style.height='auto';s.style.display='block';s.style.margin='0 auto';return s}
function tks(p,x,y,t,o){o=o||{};var e=sg('text',{x:x,y:y,'text-anchor':o.a||'middle','font-size':o.s||12,'font-weight':800,fill:o.c||'currentColor'},p);e.textContent=t;return e}
function garisan(e,w){e.setAttribute('stroke','currentColor');e.setAttribute('stroke-width',w||3);e.setAttribute('stroke-linejoin','round');e.setAttribute('stroke-linecap','round');return e}
function titikRibu(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
var GBR={};

/* deretan emoji dengan nama; dipakai piktogram dan hitungan */
GBR.baris=function(g){
  var w=el('div','mq-baris');
  if(g.skala)w.appendChild(el('div','mq-skala',g.skala));
  g.baris.forEach(function(b){
    var r=el('div','mq-br');r.appendChild(el('span','mq-bl',b.l));
    var ic=el('span','mq-bi');for(var i=0;i<b.n;i++)ic.appendChild(el('span',null,b.e));
    r.appendChild(ic);w.appendChild(r);
  });
  return w;
};

/* ikatan sepuluh dan satuan lepas */
GBR.ikat=function(g){
  var t=g.t||0,l=g.l||0,W=320,x=8,y=6,H=64,items=[],i;
  for(i=0;i<t;i++)items.push(46);
  for(i=0;i<l;i++)items.push(10);
  var pos=[];
  items.forEach(function(w,k){if(x+w>W-8){x=8;y+=H+6}pos.push([x,y,k<t]);x+=w+(w>20?8:4)});
  var s=kanvas(W,y+H+6,360);
  pos.forEach(function(p){
    if(p[2]){
      for(var j=0;j<10;j++)sg('rect',{x:p[0]+j*4.2,y:p[1],width:3.2,height:H-8,rx:1.6,fill:'#e0a93b',stroke:'#b97f12','stroke-width':.6},s);
      sg('rect',{x:p[0]-2,y:p[1]+(H-8)/2-6,width:46,height:12,rx:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':1.5},s);
    }else sg('rect',{x:p[0],y:p[1],width:3.2,height:H-8,rx:1.6,fill:'#e0a93b',stroke:'#b97f12','stroke-width':.6},s);
  });
  var c=el('div','mq-kolom');c.appendChild(s);
  if(g.label)c.appendChild(el('div','mq-cap',g.label));
  return c;
};

/* kolom nilai tempat; sorot = indeks kolom dari kiri yang ditandai */
GBR.nilai=function(g){
  var d=g.d||4,nama=['Puluh ribuan','Ribuan','Ratusan','Puluhan','Satuan'].slice(5-d),war=['#7a5bd0','#4a7bd0','#d94f3d','#2e9a63','#c78a12'].slice(5-d);
  var s=String(g.n),pad=new Array(d-s.length+1).join(' ')+s;
  var w=el('div','mq-nilai');
  for(var i=0;i<d;i++){
    var ch=pad.charAt(i),k=el('div','mq-nk'+(g.sorot===i?' sorot':''));
    var nm=el('span','nm',nama[i]);nm.style.background=war[i];k.appendChild(nm);
    k.appendChild(el('span','dg',ch===' '?'':ch));
    if(g.ket&&ch!==' ')k.appendChild(el('span','vl',titikRibu(+ch*Math.pow(10,d-1-i))));
    w.appendChild(k);
  }
  return w;
};

/* bangun datar dan bangun ruang */
function bangunSvg(b,warna,rot){
  var svg0=sg('svg',{viewBox:'0 0 120 120','aria-hidden':'true'}),c=PL[warna]||PL.biru;
  var s=rot?sg('g',{transform:'rotate('+rot+' 60 60)'},svg0):svg0;
  function poli(pts,fill,ov,op){garisan(sg('polygon',{points:pts,fill:fill},s));if(ov)sg('polygon',{points:pts,fill:ov,'fill-opacity':op},s)}
  if(b==='lingkaran')garisan(sg('circle',{cx:60,cy:60,r:48,fill:c},s));
  else if(b==='persegi')garisan(sg('rect',{x:16,y:16,width:88,height:88,rx:4,fill:c},s));
  else if(b==='persegi panjang')garisan(sg('rect',{x:6,y:32,width:108,height:56,rx:4,fill:c},s));
  else if(b==='segitiga')poli('60,12 112,104 8,104',c);
  else if(b==='bola'){garisan(sg('circle',{cx:60,cy:60,r:46,fill:c},s));sg('ellipse',{cx:44,cy:42,rx:13,ry:8,fill:'#fff','fill-opacity':.45,transform:'rotate(-35 44 42)'},s)}
  else if(b==='kubus'){poli('22,44 80,44 80,104 22,104',c);poli('22,44 44,22 102,22 80,44',c,'#fff',.4);poli('80,44 102,22 102,82 80,104',c,'#000',.25)}
  else if(b==='balok'){poli('8,50 84,50 84,100 8,100',c);poli('8,50 30,26 106,26 84,50',c,'#fff',.4);poli('84,50 106,26 106,76 84,100',c,'#000',.25)}
  else if(b==='tabung'){
    garisan(sg('ellipse',{cx:60,cy:94,rx:30,ry:11,fill:c},s));sg('rect',{x:30,y:30,width:60,height:64,fill:c},s);
    garisan(sg('line',{x1:30,y1:30,x2:30,y2:94},s));garisan(sg('line',{x1:90,y1:30,x2:90,y2:94},s));
    garisan(sg('ellipse',{cx:60,cy:30,rx:30,ry:11,fill:c},s));sg('ellipse',{cx:60,cy:30,rx:30,ry:11,fill:'#fff','fill-opacity':.4},s);
  }else if(b==='kerucut'){garisan(sg('ellipse',{cx:60,cy:96,rx:36,ry:12,fill:c},s));poli('24,96 96,96 60,14',c);sg('polygon',{points:'60,14 96,96 60,96',fill:'#000','fill-opacity':.2},s)}
  else if(b==='jajargenjang')poli('30,34 112,34 90,92 8,92',c);
  else if(b==='belahketupat')poli('60,2 102,60 60,118 18,60',c);
  else if(b==='trapesium')poli('40,32 82,32 112,92 8,92',c);
  else if(b==='segitigasiku')poli('16,14 16,104 106,104',c);
  else if(b==='limas'){
    poli('18,98 90,106 112,80 40,72',c,'#fff',.55);poli('62,12 18,98 90,106',c);poli('62,12 90,106 112,80',c,'#000',.25);
    garisan(sg('line',{x1:18,y1:98,x2:40,y2:72,'stroke-dasharray':'4 4'},s),2);garisan(sg('line',{x1:40,y1:72,x2:112,y2:80,'stroke-dasharray':'4 4'},s),2);garisan(sg('line',{x1:62,y1:12,x2:40,y2:72,'stroke-dasharray':'4 4'},s),2);
  }else if(b==='prisma'){
    poli('46,76 110,76 82,24 18,24',c,'#fff',.4);poli('12,102 76,102 46,50',c);poli('76,102 110,76 82,24 46,50',c,'#000',.25);
    garisan(sg('line',{x1:12,y1:102,x2:46,y2:76,'stroke-dasharray':'4 4'},s),2);
  }
  else throw new Error('bangun tidak dikenal: '+b);
  return svg0;
}
GBR.bangun=function(g){
  var w=el('div','mq-row');
  (g.daftar||[g]).forEach(function(d){
    var c=el('div','mq-kolom'),s=bangunSvg(d.b,d.w,d.r);s.style.width='104px';s.style.height='104px';c.appendChild(s);
    if(d.l)c.appendChild(el('div','mq-cap',d.l));w.appendChild(c);
  });
  return w;
};

/* deretan pola; token seperti "merah", "biru-lingkaran", "besar", "kuning-panjang", "tepuk" */
var BENTUK_TOKEN=['segitiga','lingkaran','bulat','persegi','kotak','bintang','bulan','oval','persegipanjang'];
var UKURAN_TOKEN=['besar','kecil','panjang','pendek'];
var BUNYI_TOKEN={tepuk:'\u{1F44F}',ketuk:'\u{1F941}',diam:'\u{1F92B}',hati:'\u2764\uFE0F',awan:'\u2601\uFE0F',bunga:'\u{1F338}',daun:'\u{1F343}',matahari:'\u2600\uFE0F'};
function tokenNode(tok){
  if(/^-?\d+$/.test(tok)){var n=el('span','angka',tok);return n}
  var p=tok.split('-'),w=null,b=null,u=null,e=null;
  p.forEach(function(x){
    if(PL[x]&&x!=='roti'&&x!=='abu')w=x;
    else if(BENTUK_TOKEN.indexOf(x)>=0)b=x;
    else if(UKURAN_TOKEN.indexOf(x)>=0)u=x;
    else if(BUNYI_TOKEN[x])e=x;
    else throw new Error('token pola tidak dikenal: '+tok);
  });
  if(e)return document.createTextNode(BUNYI_TOKEN[e]);
  var s=sg('svg',{viewBox:'0 0 40 40','aria-hidden':'true'}),c=PL[w]||(b==='bulan'||b==='bintang'?PL.kuning:PL.abu);
  var f=u==='kecil'?0.55:1,gr=sg('g',{transform:'translate(20 20) scale('+f+') translate(-20 -20)'},s);
  if(u==='panjang'||u==='pendek'){garisan(sg('rect',{x:u==='panjang'?3:12,y:14,width:u==='panjang'?34:16,height:12,rx:4,fill:c},gr),2);return s}
  if(b==='segitiga')garisan(sg('polygon',{points:'20,5 36,33 4,33',fill:c},gr),2.5);
  else if(b==='persegi'||b==='kotak')garisan(sg('rect',{x:7,y:7,width:26,height:26,rx:3,fill:c},gr),2.5);
  else if(b==='bintang')garisan(sg('polygon',{points:'20,3 25,15 38,15 28,23 32,36 20,28 8,36 12,23 2,15 15,15',fill:c},gr),2);
  else if(b==='bulan')garisan(sg('path',{d:'M26 5 A16 16 0 1 0 26 35 A12 12 0 1 1 26 5 Z',fill:c},gr),2);
  else if(b==='oval')garisan(sg('ellipse',{cx:20,cy:20,rx:16,ry:10,fill:c},gr),2.5);
  else if(b==='persegipanjang')garisan(sg('rect',{x:4,y:11,width:32,height:18,rx:3,fill:c},gr),2.5);
  else garisan(sg('circle',{cx:20,cy:20,r:14,fill:c},gr),2.5);
  return s;
}
GBR.pola=function(g){
  var w=el('div','mq-pola'),kol=g.kol||Math.min(g.s.length,9);
  w.style.gridTemplateColumns='repeat('+kol+',minmax(0,44px))';
  g.s.forEach(function(t,i){
    var c;
    if((g.hilang||[]).indexOf(i)>=0)c=el('div','mq-pc q','?');
    else{c=el('div','mq-pc');c.appendChild(tokenNode(t))}
    w.appendChild(c);
  });
  return w;
};

/* garis bilangan dengan titik dan busur lompatan */
GBR.garis=function(g){
  var a=g.a,b=g.b,st=g.langkah||1,W=320,top=g.busur?44:8,y=top+26,s=kanvas(W,y+36,440),x0=30,x1=W-30;
  var X=function(v){return x0+(v-a)/(b-a)*(x1-x0)};
  garisan(sg('line',{x1:x0-6,y1:y,x2:x1+6,y2:y},s),3);
  var n=Math.round((b-a)/st),lab=g.lab||(n<=22?st:Math.ceil(n/8)*st);
  for(var v=a;v<=b+1e-9;v+=st){
    var par=Math.abs((v-a)/lab-Math.round((v-a)/lab))<1e-9;
    garisan(sg('line',{x1:X(v),y1:y-(par?9:5),x2:X(v),y2:y+(par?9:5)},s),par?2.5:1.5);
    if(par)tks(s,X(v),y+24,titikRibu(v),{s:11});
  }
  (g.busur||[]).forEach(function(r){
    var xa=X(r.dari),xb=X(r.ke),mid=(xa+xb)/2,tinggi=Math.max(24,Math.min(34,10+Math.abs(xb-xa)/6));
    sg('path',{d:'M'+xa+' '+(y-4)+' Q'+mid+' '+(y-4-tinggi*1.6)+' '+xb+' '+(y-4),fill:'none',stroke:'#d94f3d','stroke-width':3,'stroke-linecap':'round'},s);
    sg('polygon',{points:xb+','+(y-3)+' '+(xb-6)+','+(y-12)+' '+(xb+6)+','+(y-12),fill:'#d94f3d'},s);
    if(r.l)tks(s,mid,y-8-tinggi*0.8-4,r.l,{s:12,c:'#d94f3d'});
  });
  (g.titik||[]).forEach(function(t){
    sg('circle',{cx:X(t.v),cy:y,r:7,fill:PL[t.w||'merah'],stroke:'currentColor','stroke-width':2.5},s);
    if(t.l)tks(s,X(t.v),y-14,t.l,{s:12});
  });
  return s;
};

/* kerangka sepuluh: sepuluh kotak, titik terisi, titik di luar */
GBR.kerangka=function(g){
  var fr=g.kerangka||1,cell=28,gap=4,fw=5*(cell+gap)+8,W=fr*fw+8+(g.luar?cell*3:0),s=kanvas(W,2*(cell+gap)+16,Math.max(300,W*1.4)),k,n=0;
  for(var f=0;f<fr;f++){
    for(k=0;k<10;k++){
      var cx=8+f*fw+(k%5)*(cell+gap),cy=8+Math.floor(k/5)*(cell+gap);
      garisan(sg('rect',{x:cx,y:cy,width:cell,height:cell,rx:5,fill:'none'},s),2);
      if(n<g.isi){sg('circle',{cx:cx+cell/2,cy:cy+cell/2,r:cell/2-4,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s)}
      n++;
    }
  }
  for(k=0;k<(g.luar||0);k++)sg('circle',{cx:8+fr*fw+10+(k%3)*(cell-2),cy:16+Math.floor(k/3)*(cell-2),r:cell/2-4,fill:'#e0a93b',stroke:'currentColor','stroke-width':2},s);
  return s;
};

/* gabung (+) atau ambil (-) dari sekelompok benda */
GBR.gabung=function(g){
  var w=el('div','mq-gab');
  function grup(n,coret){var d=el('div','grup');for(var i=0;i<n;i++)d.appendChild(el('span',coret&&i>=g.a-g.b?'coret':null,g.e));return d}
  if(g.op==='+'){w.appendChild(grup(g.a));w.appendChild(el('span','op','+'));w.appendChild(grup(g.b))}
  else{w.appendChild(grup(g.a,true));w.appendChild(el('span','op','−'+g.b))}
  return w;
};

/* bentuk terbelah: utuh dibagi n bagian sama besar, sebagian diwarnai */
function belah(d){
  var s=sg('svg',{viewBox:'0 0 100 100','aria-hidden':'true'}),L=[],b=d.b,i;
  if(b==='lingkaran'){
    if(d.n===2){L.push(['path',{d:'M50 10 A40 40 0 0 0 50 90 Z'}]);L.push(['path',{d:'M50 10 A40 40 0 0 1 50 90 Z'}])}
    else{L.push(['path',{d:'M50 50 L10 50 A40 40 0 0 1 50 10 Z'}]);L.push(['path',{d:'M50 50 L50 10 A40 40 0 0 1 90 50 Z'}]);L.push(['path',{d:'M50 50 L90 50 A40 40 0 0 1 50 90 Z'}]);L.push(['path',{d:'M50 50 L50 90 A40 40 0 0 1 10 50 Z'}])}
  }else{
    var x=b==='persegi'?14:5,y=b==='persegi'?14:22,w=b==='persegi'?72:90,h=b==='persegi'?72:56;
    if(d.n===2){L.push(['rect',{x:x,y:y,width:w/2,height:h}]);L.push(['rect',{x:x+w/2,y:y,width:w/2,height:h}])}
    else for(i=0;i<4;i++)L.push(['rect',{x:x+(i%2)*w/2,y:y+Math.floor(i/2)*h/2,width:w/2,height:h/2}]);
  }
  L.forEach(function(p,k){var e=garisan(sg(p[0],p[1],s),3);e.setAttribute('fill',(d.w||[]).indexOf(k)>=0?'#d94f3d':'#f4d79a')});
  return s;
}
GBR.pecahan=function(g){
  var w=el('div','mq-row');
  g.daftar.forEach(function(d){
    var c=el('div','mq-kolom'),s=belah(d);s.style.width=(d.u==='kecil'?78:d.u==='besar'?132:104)+'px';c.appendChild(s);
    if(d.l)c.appendChild(el('div','mq-cap',d.l));w.appendChild(c);
  });
  return w;
};

/* neraca: sisi yang turun lebih berat */
GBR.neraca=function(g){
  var s=kanvas(300,190,380),rot=g.turun==='kiri'?-9:g.turun==='kanan'?9:0,r=rot*Math.PI/180,cx=150,cy=70,L=110;
  var xl=cx-L*Math.cos(r),yl=cy-L*Math.sin(r),xr=cx+L*Math.cos(r),yr=cy+L*Math.sin(r);
  garisan(sg('polygon',{points:cx+','+cy+' '+(cx-22)+',172 '+(cx+22)+',172',fill:'#c78a12'},s),2.5);
  garisan(sg('line',{x1:xl,y1:yl,x2:xr,y2:yr},s),5);
  sg('circle',{cx:cx,cy:cy,r:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s);
  [[xl,yl,g.kiri,g.kiriL],[xr,yr,g.kanan,g.kananL]].forEach(function(p){
    garisan(sg('line',{x1:p[0]-34,y1:p[1],x2:p[0]+34,y2:p[1]},s),4);
    var t=sg('text',{x:p[0],y:p[1]-8,'text-anchor':'middle','font-size':36},s);t.textContent=p[2];
    if(p[3])tks(s,p[0],p[1]+20,p[3],{s:12});
  });
  return s;
};

/* batang satuan tidak baku: tiap kotak = satu satuan */
GBR.batang=function(g){
  var maks=0;g.baris.forEach(function(b){maks=Math.max(maks,b.n)});
  var u=Math.min(26,Math.floor(230/maks)),lab=78,W=lab+maks*u+14,H=g.baris.length*34+(g.satuan?22:6),s=kanvas(W,H,Math.max(300,W*1.3));
  g.baris.forEach(function(b,i){
    var y=6+i*34;tks(s,lab-8,y+17,b.l,{a:'end',s:12});
    for(var k=0;k<b.n;k++)garisan(sg('rect',{x:lab+k*u,y:y,width:u,height:24,fill:PL[b.w||'kuning']},s),2);
  });
  if(g.sejajar)sg('line',{x1:lab,y1:2,x2:lab,y2:H-(g.satuan?18:2),stroke:'#d94f3d','stroke-width':2,'stroke-dasharray':'4 3'},s);
  if(g.satuan)tks(s,lab,H-6,'1 kotak = 1 '+g.satuan,{a:'start',s:11});
  return s;
};

/* tali yang sama: lurus dan dilingkarkan */
GBR.tali=function(g){
  var s=kanvas(300,150,380);
  tks(s,150,16,'Tali diluruskan: '+g.n+' '+g.satuan,{s:12});
  var x0=30,x1=270;
  sg('line',{x1:x0,y1:34,x2:x1,y2:34,stroke:'#b97f12','stroke-width':7,'stroke-linecap':'round'},s);
  for(var i=0;i<=g.n;i++)sg('line',{x1:x0+(x1-x0)*i/g.n,y1:26,x2:x0+(x1-x0)*i/g.n,y2:42,stroke:'currentColor','stroke-width':2},s);
  tks(s,150,76,'Tali yang sama, dilingkarkan:',{s:12});
  sg('path',{d:'M110 128 C110 92 190 92 190 118 C190 140 120 140 128 112 C134 96 170 98 168 116',fill:'none',stroke:'#b97f12','stroke-width':7,'stroke-linecap':'round'},s);
  tks(s,230,122,'?',{s:26,c:'#d94f3d'});
  return s;
};

/* lomba waktu: tiap baris punya waktu mulai (m) dan lama (s) */
GBR.lomba=function(g){
  var maks=0;g.baris.forEach(function(b){maks=Math.max(maks,b.m+b.s)});
  var w=el('div','mq-lomba');
  g.baris.forEach(function(b){
    var r=el('div','mq-lr');r.appendChild(el('div','lb',(b.e?b.e+' ':'')+b.l));
    var tr=el('div','tr'),bar=el('i');bar.style.left=(b.m/maks*100)+'%';bar.style.width=(b.s/maks*100)+'%';bar.style.background=PL[b.w||'hijau'];
    tr.appendChild(bar);r.appendChild(tr);w.appendChild(r);
  });
  return w;
};

/* dua anak berhadapan, dilihat dari atas */
GBR.hadap=function(g){
  var s=kanvas(300,190,420);
  function orang(x,warna,nama,hadap,kananAtas){
    garisan(sg('circle',{cx:x,cy:95,r:22,fill:warna},s));
    sg('polygon',{points:hadap>0?(x+22)+',88 '+(x+34)+',95 '+(x+22)+',102':(x-22)+',88 '+(x-34)+',95 '+(x-22)+',102',fill:'currentColor'},s);
    tks(s,x,100,nama,{s:13,c:'#fff'});
    var yKa=kananAtas?53:137,yKi=kananAtas?137:53,dx=hadap>0?-14:14,an=hadap>0?'end':'start';
    garisan(sg('circle',{cx:x,cy:yKa,r:8,fill:'none'},s),2.5);garisan(sg('circle',{cx:x,cy:yKi,r:8,fill:'none'},s),2.5);
    tks(s,x+dx,yKa+4,'kanan',{a:an,s:11});tks(s,x+dx,yKi+4,'kiri',{a:an,s:11});
  }
  orang(70,'#4a7bd0',g.n1,1,false);orang(230,'#2e9a63',g.n2,-1,true);
  var b=g.bola,pos=b==='rani'?[70,137]:b==='dodi'?[230,137]:b==='tengah'?[150,95]:null;
  if(pos)garisan(sg('circle',{cx:pos[0],cy:pos[1],r:10,fill:'#d94f3d'},s),2.5);
  return s;
};

/* barisan anak (menghadap ke kanan): antri satu baris atau berdampingan */
GBR.antri=function(g){
  var n=g.n.length,s=kanvas(300,g.samping?150:120,400);
  function orang(x,y,nama,warna){
    garisan(sg('circle',{cx:x,cy:y,r:20,fill:warna},s));
    sg('polygon',{points:(x+20)+','+(y-7)+' '+(x+31)+','+y+' '+(x+20)+','+(y+7),fill:'currentColor'},s);
    tks(s,x,y+4,nama.charAt(0),{s:14,c:'#fff'});tks(s,x,y+36,nama,{s:11});
  }
  var war=['#4a7bd0','#2e9a63','#c75ba0','#e0a93b'];
  if(g.samping)g.n.forEach(function(nm,i){orang(130,34+i*70,nm,war[i%4])});
  else{var sp=Math.min(90,200/Math.max(1,n-1));g.n.forEach(function(nm,i){orang(246-i*sp,56,nm,war[i%4])})}
  tks(s,150,g.samping?146:112,'semua menghadap ke sini →',{s:11});
  return s;
};

/* meja: benda di atas dan di bawah meja */
GBR.meja=function(g){
  var s=kanvas(300,170,380);
  garisan(sg('rect',{x:60,y:78,width:180,height:10,rx:3,fill:'#b97f12'},s),2.5);
  garisan(sg('line',{x1:78,y1:88,x2:78,y2:150},s),5);garisan(sg('line',{x1:222,y1:88,x2:222,y2:150},s),5);
  var a=sg('text',{x:150,y:70,'text-anchor':'middle','font-size':44},s);a.textContent=g.atas;
  var b=sg('text',{x:150,y:140,'text-anchor':'middle','font-size':44},s);b.textContent=g.bawah;
  return s;
};

/* kotak berisi satu benda, benda lain di luar */
GBR.dalam=function(g){
  var s=kanvas(300,150,380);
  garisan(sg('rect',{x:50,y:40,width:110,height:80,rx:6,fill:'#f4d79a','fill-opacity':.55},s),3);
  var a=sg('text',{x:105,y:96,'text-anchor':'middle','font-size':44},s);a.textContent=g.dalam;
  var b=sg('text',{x:225,y:96,'text-anchor':'middle','font-size':44},s);b.textContent=g.luar;
  tks(s,105,136,'kotak',{s:12});
  return s;
};

/* tumpukan kotak berlabel dari atas ke bawah (tegak) atau kiri ke kanan (datar) */
GBR.susun=function(g){
  var n=g.items.length,tegak=g.arah!=='datar',s=kanvas(tegak?200:300,tegak?n*42+8:70,tegak?260:420);
  g.items.forEach(function(it,i){
    var x=tegak?30:8+i*96,y=tegak?6+i*42:12,w=tegak?140:88;
    garisan(sg('rect',{x:x,y:y,width:w,height:34,rx:8,fill:PL[it.w||['biru','hijau','kuning','merah'][i%4]]},s),3);
    tks(s,x+w/2,y+22,it.l,{s:14,c:'#fff'});
  });
  return s;
};

/* kartu angka */
GBR.kartu=function(g){
  var w=el('div','mq-kartu');g.d.forEach(function(x){w.appendChild(el('span',null,String(x)))});return w;
};

/* balok nilai tempat: ratusan (kotak biru), puluhan (batang hijau), satuan (kubus kuning) */
GBR.blok=function(g){
  var n=g.n,jum=[Math.floor(n/100)%10,Math.floor(n/10)%10,n%10],kls=['r','p','s'],nama=['ratusan','puluhan','satuan'];
  var w=el('div','mq-blok');
  jum.forEach(function(j,i){
    var d=el('div','mq-bg'),isi=el('div','isi '+kls[i]);
    for(var k=0;k<j;k++)isi.appendChild(el('span','b'));
    d.appendChild(isi);d.appendChild(el('div','cap',j+' '+nama[i]));w.appendChild(d);
  });
  if(g.label){var c=el('div','mq-kolom');c.appendChild(w);c.appendChild(el('div','mq-cap',g.label));return c}
  return w;
};

/* larik titik: r baris, c kolom; baris bergantian warna agar mudah dihitung per baris */
GBR.larik=function(g){
  var w=el('div','mq-larik');w.style.gridTemplateColumns='repeat('+g.c+',minmax(0,22px))';
  for(var i=0;i<g.r*g.c;i++){
    var baris=Math.floor(i/g.c),k=el('span','dt'+(baris%2?' b':'')+(g.sorot!==undefined&&baris>=g.sorot?' mati':''));
    w.appendChild(k);
  }
  var c=el('div','mq-kolom');c.appendChild(w);c.appendChild(el('div','mq-cap',g.r+' baris \u00d7 '+g.c+' kolom'));
  return c;
};

/* kelompok sama banyak (piring), boleh dengan tanda +, boleh dengan sisa yang tak kebagian */
GBR.kelompok=function(g){
  var w=el('div','mq-kel'),i,j;
  for(i=0;i<g.jumlah;i++){
    if(g.plus&&i>0)w.appendChild(el('span','plus','+'));
    var p=el('div','piring');
    if(g.n>8)p.appendChild(el('b',null,String(g.n)));
    else for(j=0;j<g.n;j++)p.appendChild(el('span',null,g.e));
    w.appendChild(p);
  }
  if(g.sisa){
    var s=el('div','sisa'),r=el('span');
    for(j=0;j<g.sisa;j++)r.appendChild(el('span',null,g.e));
    s.appendChild(r);s.appendChild(el('small',null,'sisa '+g.sisa));w.appendChild(s);
  }
  return w;
};

/* timbangan seimbang dengan kantong berisi "?" (nilai kotak yang belum diketahui) */
GBR.timbang=function(g){
  var s=kanvas(300,176,420),cx=150,cy=52,L=95;
  garisan(sg('polygon',{points:cx+','+cy+' '+(cx-22)+',168 '+(cx+22)+',168',fill:'#c78a12'},s),2.5);
  garisan(sg('line',{x1:cx-L,y1:cy,x2:cx+L,y2:cy},s),5);
  sg('circle',{cx:cx,cy:cy,r:6,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s);
  function pan(x,benda,angka){
    garisan(sg('line',{x1:x,y1:cy,x2:x-40,y2:cy+62},s),1.5);garisan(sg('line',{x1:x,y1:cy,x2:x+40,y2:cy+62},s),1.5);
    garisan(sg('line',{x1:x-46,y1:cy+62,x2:x+46,y2:cy+62},s),4);
    if(angka){sg('circle',{cx:x,cy:cy+36,r:20,fill:'#fff3d0',stroke:'currentColor','stroke-width':2.5},s);tks(s,x,cy+43,String(angka),{s:20});return}
    var baris=0,kol=0,lebar=46;
    benda.forEach(function(b){
      var w=b==='k'?26:15;
      if(kol+w>lebar*2-6){baris++;kol=0}
      var bx=x-lebar+4+kol,by=cy+62-4-baris*22;
      if(b==='k'){
        garisan(sg('rect',{x:bx,y:by-26,width:24,height:26,rx:7,fill:'#b97f12'},s),2);tks(s,bx+12,by-8,'?',{s:16,c:'#fff'});
      }else if(b==='p'){sg('circle',{cx:bx+7,cy:by-7,r:6.5,fill:'#d94f3d',stroke:'currentColor','stroke-width':2},s)}
      else{sg('circle',{cx:bx+7,cy:by-7,r:6.5,fill:'none',stroke:'#d94f3d','stroke-width':2,'stroke-dasharray':'3 2'},s);tks(s,bx+7,by-3.5,'\u2212',{s:11,c:'#d94f3d'})}
      kol+=w+2;
    });
  }
  var kiri=[],i;
  for(i=0;i<(g.kantong||0);i++)kiri.push('k');
  for(i=0;i<(g.plus||0);i++)kiri.push('p');
  for(i=0;i<(g.minus||0);i++)kiri.push('m');
  var kn=[];for(i=0;i<(g.kanan||0);i++)kn.push('p');
  pan(cx-L,kiri,0);
  if(kn.length>12)pan(cx+L,[],g.kanan);else pan(cx+L,kn,0);
  return s;
};

/* tabel: baris pertama biasanya "posisi", baris kedua "nilai"; sel "?" ditandai */
GBR.tabel=function(g){
  var t=el('table','mq-tabel');
  g.baris.forEach(function(b){
    var tr=el('tr');
    b.forEach(function(x,i){tr.appendChild(el('td',i>0&&String(x)==='?'?'q':null,String(x)))});
    t.appendChild(tr);
  });
  return t;
};

/* jaring-jaring: bentuk datar yang jika dilipat menjadi bangun ruang */
GBR.jaring=function(g){
  var s=kanvas(240,150,320),c='#4a7bd0',j=g.jenis;
  function kt(x,y,w,h,w2){garisan(sg('rect',{x:x,y:y,width:w,height:h,fill:PL[w2||'biru'],'fill-opacity':.85},s),2.5)}
  function sg3(a,w2){garisan(sg('polygon',{points:a,fill:PL[w2||'kuning'],'fill-opacity':.85},s),2.5)}
  if(j==='kubus'){var u=30,x0=60,y0=8;[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]].forEach(function(p){kt(x0+p[0]*u,y0+p[1]*u,u,u)})}
  else if(j==='tabung'){
    kt(40,52,160,46,'hijau');
    garisan(sg('circle',{cx:80,cy:30,r:22,fill:PL.biru,'fill-opacity':.85},s),2.5);
    garisan(sg('circle',{cx:160,cy:120,r:22,fill:PL.biru,'fill-opacity':.85},s),2.5);
  }else if(j==='limas'){
    kt(90,50,50,50,'hijau');
    sg3('90,50 140,50 115,8');sg3('140,50 140,100 182,75');sg3('140,100 90,100 115,142');sg3('90,100 90,50 48,75');
  }else{
    kt(60,45,40,60,'hijau');kt(100,45,40,60,'hijau');kt(140,45,40,60,'hijau');
    sg3('100,45 140,45 120,8','biru');sg3('100,105 140,105 120,142','biru');
  }
  return s;
};

/* dua tampak benda: dari atas dan dari samping */
GBR.pandang=function(g){
  var w=el('div','mq-row');
  [['tampak atas',g.atas],['tampak samping',g.samping]].forEach(function(x){
    var c=el('div','mq-kolom'),s=bangunSvg(x[1],'kuning');s.style.width='96px';s.style.height='96px';c.appendChild(s);
    c.appendChild(el('div','mq-cap',x[0]));w.appendChild(c);
  });
  return w;
};

/* tumpukan kubus satuan dalam proyeksi isometrik, digambar dari belakang ke depan */
var LAPIS=['#4a7bd0','#2e9a63','#e0a93b','#d94f3d','#c75ba0'];
function jumlahTumpuk(h){var t=0;h.forEach(function(r){r.forEach(function(v){t+=v})});return t}
GBR.tumpuk=function(g){
  var h=g.h,R=h.length,C=h[0].length,u=g.u||20,vh=u,mz=0,i,j,z;
  h.forEach(function(r){r.forEach(function(v){mz=Math.max(mz,v)})});
  var lim=g.lapisan===undefined?mz:g.lapisan;
  var sel=[];for(i=0;i<R;i++)for(j=0;j<C;j++)sel.push([i,j]);
  sel.sort(function(a,b){return (a[0]+a[1])-(b[0]+b[1])||a[0]-b[0]});
  var pad=6,x0=-(R-1)*u-u-pad,y0=-mz*vh-pad,W=(R-1)*u+(C-1)*u+2*u+2*pad,H=(R-1+C-1)*u/2+u+mz*vh+2*pad;
  var s=sg('svg',{viewBox:x0+' '+y0+' '+W+' '+H,'aria-hidden':'true'});
  s.style.width='100%';s.style.maxWidth=Math.min(W*2.4,340)+'px';s.style.height='auto';s.style.display='block';s.style.margin='0 auto';
  function poli(pts,warna,ov,op,kel){
    garisan(sg('polygon',{points:pts,fill:warna},kel),1.6);
    if(ov)sg('polygon',{points:pts,fill:ov,'fill-opacity':op},kel);
  }
  sel.forEach(function(c){
    var ri=c[0],ci=c[1],hh=h[ri][ci],sx=(ci-ri)*u,sy=(ci+ri)*u/2;
    for(z=0;z<Math.min(hh,lim);z++){
      var oy=sy-(z+1)*vh,col=LAPIS[z%5],kel=sg('g',{'class':'kb'+(g.baru===z?' baru':'')},s);
      poli(sx+','+oy+' '+(sx+u)+','+(oy+u/2)+' '+sx+','+(oy+u)+' '+(sx-u)+','+(oy+u/2),col,'#fff',.4,kel);
      poli((sx-u)+','+(oy+u/2)+' '+sx+','+(oy+u)+' '+sx+','+(oy+u+vh)+' '+(sx-u)+','+(oy+u/2+vh),col,null,0,kel);
      poli(sx+','+(oy+u)+' '+(sx+u)+','+(oy+u/2)+' '+(sx+u)+','+(oy+u/2+vh)+' '+sx+','+(oy+u+vh),col,'#000',.28,kel);
    }
  });
  return s;
};

/* tampak 2D tumpukan kubus: atas (kotak terisi), depan (tinggi tiap kolom), samping (tinggi tiap baris) */
GBR.tampak=function(g){
  var h=g.h,R=h.length,C=h[0].length,mz=0,sl=24,i,j,nm,cols,tinggi,nilai=[];
  h.forEach(function(r){r.forEach(function(v){mz=Math.max(mz,v)})});
  if(g.dari==='atas'){cols=C;tinggi=R;nm='tampak atas'}
  else if(g.dari==='depan'){
    cols=C;tinggi=mz;nm='tampak depan';
    for(j=0;j<C;j++){var m1=0;for(i=0;i<R;i++)m1=Math.max(m1,h[i][j]);nilai.push(m1)}
  }else{
    cols=R;tinggi=mz;nm='tampak samping';
    for(i=0;i<R;i++){var m2=0;for(j=0;j<C;j++)m2=Math.max(m2,h[i][j]);nilai.push(m2)}
  }
  var s=sg('svg',{viewBox:'0 0 '+(cols*sl+4)+' '+(tinggi*sl+4),'aria-hidden':'true'});
  s.style.width=Math.min(cols*sl*1.6+8,200)+'px';s.style.height='auto';
  if(g.dari==='atas'){
    for(i=0;i<R;i++)for(j=0;j<C;j++){
      if(h[i][j]>0){
        garisan(sg('rect',{x:2+j*sl,y:2+i*sl,width:sl,height:sl,fill:'#e0a93b','fill-opacity':.8},s),2);
        if(g.angka)tks(s,2+j*sl+sl/2,2+i*sl+sl/2+5,String(h[i][j]),{s:13});
      }
    }
  }else{
    nilai.forEach(function(v,k){
      for(var z=0;z<v;z++)garisan(sg('rect',{x:2+k*sl,y:2+(tinggi-1-z)*sl,width:sl,height:sl,fill:'#4a7bd0','fill-opacity':.8},s),2);
    });
  }
  var w=el('div','mq-kolom');w.appendChild(s);w.appendChild(el('div','mq-cap',nm));
  return w;
};

/* bangun ruang yang dipotong lurus: dua potongan, boleh dijauhkan (celah) */
var potongNo=0;
function potongSvg(b,arah,pos,celah,warna,garis){
  var id='pt'+(potongNo++),s=sg('svg',{viewBox:'0 0 200 150','aria-hidden':'true'}),defs=sg('defs',{},s);
  var a=sg('clipPath',{id:id+'a'},defs),c=sg('clipPath',{id:id+'b'},defs),yc=10+pos*104,xc=46+pos*108,d;
  if(arah==='mendatar'){sg('rect',{x:0,y:0,width:200,height:yc},a);sg('rect',{x:0,y:yc,width:200,height:150-yc},c);d=[0,-1,0,1]}
  else if(arah==='tegak'){sg('rect',{x:0,y:0,width:xc,height:150},a);sg('rect',{x:xc,y:0,width:200-xc,height:150},c);d=[-1,0,1,0]}
  else{sg('polygon',{points:'-20,-44 300,-44 300,276'},a);sg('polygon',{points:'-20,-44 300,276 -20,276'},c);d=[0.7,-0.7,-0.7,0.7]}
  var inti=function(){var x=bangunSvg(b,warna);x.setAttribute('x',40);x.setAttribute('y',16);x.setAttribute('width',120);x.setAttribute('height',120);return x};
  var g1=sg('g',{'class':'pc'},s),g2=sg('g',{'class':'pc'},s);
  var k1=sg('g',{'clip-path':'url(#'+id+'a)'},g1),k2=sg('g',{'clip-path':'url(#'+id+'b)'},g2);
  k1.appendChild(inti());k2.appendChild(inti());
  if(garis){
    var gp=arah==='mendatar'?[36,yc,164,yc]:arah==='tegak'?[xc,10,xc,142]:[40,16,160,136];
    sg('line',{x1:gp[0],y1:gp[1],x2:gp[2],y2:gp[3],stroke:'#d94f3d','stroke-width':3,'stroke-dasharray':'7 5','stroke-linecap':'round'},s);
    s._garis=s.lastChild;
  }
  s._ps=[g1,g2,d];
  s._geser=function(f){
    g1.style.transform='translate('+(d[0]*f)+'px,'+(d[1]*f)+'px)';
    g2.style.transform='translate('+(d[2]*f)+'px,'+(d[3]*f)+'px)';
  };
  s._geser(celah||0);
  return s;
}
GBR.potong=function(g){
  var s=potongSvg(g.b,g.arah,g.pos,10,g.w);s.style.width='200px';s.style.maxWidth='100%';s.style.height='auto';
  return s;
};

/* soal bersusun: penjumlahan atau pengurangan, dengan catatan simpanan/pinjaman di atas kolom */
GBR.kolom=function(g){
  var w=el('div','mq-kol');
  function digit(n){var t=String(n);return new Array(5-t.length).join(' ')+t}
  function baris(op,teks,kls){
    w.appendChild(el('span','op',op));
    for(var i=0;i<4;i++){
      var ch=teks.charAt(i);
      w.appendChild(el('span','c'+(g.sorot===i?' sorot':'')+((kls||ch==='?')?' q':''),ch===' '?' ':ch));
    }
  }
  if(g.tanda&&g.tanda.length){
    w.appendChild(el('span'));
    for(var i=0;i<4;i++){
      var t=null;g.tanda.forEach(function(x){if(x.kol===i)t=x});
      w.appendChild(el('span','t',t?t.teks:' '));
    }
  }
  baris('',digit(g.a));
  baris(g.op==='+'?'+':'−',digit(g.b));
  w.appendChild(el('span','gr'));
  if(g.hasil===undefined||g.hasil===null)baris('','   ?','q');
  else baris('',digit(g.hasil));
  return w;
};

/* model batang untuk soal cerita: bagian-bagian yang menyusun satu keseluruhan */
GBR.bar=function(g){
  var tot=0;g.bagian.forEach(function(b){tot+=b.v});
  var W=300,x0=10,lebar=W-20,s=kanvas(W,g.atas?92:58,400),x=x0,y=g.atas?40:8;
  if(g.atas){garisan(sg('path',{d:'M'+x0+' 32 L'+x0+' 24 L'+(x0+lebar)+' 24 L'+(x0+lebar)+' 32',fill:'none'},s),2.5);tks(s,W/2,16,g.atas,{s:13})}
  g.bagian.forEach(function(b){
    var wd=b.v/tot*lebar;
    garisan(sg('rect',{x:x,y:y,width:wd,height:38,fill:PL[b.w||'biru']},s),2.5);
    tks(s,x+wd/2,y+24,b.l,{s:13,c:'#fff'});x+=wd;
  });
  return s;
};

/* angka gaya Indonesia: titik ribuan, koma desimal, paling banyak 3 desimal */
function fmtId(n){
  var t=String(Math.round(n*1000)/1000),p=t.split('.');
  return titikRibu(p[0])+(p[1]?','+p[1]:'');
}

/* penggaris: benda sepanjang n satuan dari titik 0; _ke(v) mengubah panjangnya */
GBR.penggaris=function(g){
  var maks=g.maks||Math.ceil(g.n),W=300,x0=12,u=(W-24)/maks,st=g.langkah||(maks>20?5:1),s=kanvas(W,96,420);
  var ob=garisan(sg('rect',{x:x0,y:8,width:g.n*u,height:24,rx:5,fill:PL[g.w||'kuning']},s),2.5);
  var lb=g.l?tks(s,x0+6,25,g.l,{a:'start',s:12,c:'#2b2a33'}):null;
  var pg=garisan(sg('rect',{x:x0,y:40,width:maks*u,height:40,rx:4},s),2);pg.style.fill='var(--soft)';
  var mn=st>=10?st/5:(st<1?st:1);
  for(var i=0;i<=maks+1e-9;i+=mn){
    var besar=Math.abs(i/st-Math.round(i/st))<1e-9,x=x0+i*u;
    sg('line',{x1:x,y1:40,x2:x,y2:besar?60:52,stroke:'currentColor','stroke-width':besar?2:1.4},s);
    if(besar)tks(s,x,74,fmtId(i),{s:11});
  }
  if(g.sat)tks(s,W-12,36,g.sat,{a:'end',s:11,c:'#6b6878'});
  s._ke=function(v){ob.setAttribute('width',Math.max(0,v)*u)};
  return s;
};

/* gelas takar: isi n dari maks; _ke(v) mengubah isinya */
GBR.takar=function(g){
  var maks=g.maks,st=g.langkah||maks/4,x0=34,x1=106,top=12,bot=138,s=kanvas(190,166,230);
  var cair=sg('rect',{x:x0+1.5,y:bot-1.5,width:x1-x0-3,height:0,fill:PL[g.w||'biru'],opacity:.78},s);
  garisan(sg('path',{d:'M'+x0+' '+top+' L'+x0+' '+bot+' L'+x1+' '+bot+' L'+x1+' '+top,fill:'none'},s),3);
  for(var v=0;v<=maks+1e-9;v+=st){
    var y=bot-v/maks*(bot-top);
    sg('line',{x1:x0,y1:y,x2:x0+(v?14:0),y2:y,stroke:'currentColor','stroke-width':2},s);
    if(v)tks(s,x1+8,y+4,fmtId(v),{a:'start',s:11});
  }
  if(g.sat)tks(s,(x0+x1)/2,bot+17,g.sat,{s:12,c:'#6b6878'});
  s._ke=function(v){var h=Math.max(0,Math.min(1,v/maks))*(bot-top-3);cair.setAttribute('y',bot-1.5-h);cair.setAttribute('height',h)};
  s._ke(g.n);
  return s;
};

/* timbangan berjarum: menunjuk n dari maks; _ke(v) menggerakkan jarum */
GBR.timbangan=function(g){
  var maks=g.maks,cx=110,cy=112,r=86,s=kanvas(220,150,300);
  var bd=garisan(sg('path',{d:'M'+(cx-r)+' '+cy+' A'+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+' Z'},s),3);bd.style.fill='var(--soft)';
  for(var i=0;i<=10;i++){
    var a=Math.PI*(1-i/10),c=Math.cos(a),n=Math.sin(a),k=(i%5===0)?12:6;
    sg('line',{x1:cx+(r-4)*c,y1:cy-(r-4)*n,x2:cx+(r-4-k)*c,y2:cy-(r-4-k)*n,stroke:'currentColor','stroke-width':2},s);
    if(i%5===0)tks(s,cx+(r-28)*c,cy-(r-28)*n+(i%10===0?-2:4),fmtId(maks*i/10),{s:11});
  }
  if(g.sat)tks(s,cx,cy-34,g.sat,{s:12,c:'#6b6878'});
  var jr=garisan(sg('line',{x1:cx,y1:cy,x2:cx,y2:cy-r+14,stroke:'#d94f3d'},s),4);
  sg('circle',{cx:cx,cy:cy,r:6,fill:'#d94f3d'},s);
  var br=sg('rect',{x:cx-r-6,y:cy+4,width:2*r+12,height:10,rx:4,fill:'#b97f12'},s);
  var tx=tks(s,cx,cy+34,'',{s:15});
  s._ke=function(v){
    var a=Math.PI*(1-Math.max(0,Math.min(1,v/maks)));
    jr.setAttribute('x2',cx+(r-14)*Math.cos(a));jr.setAttribute('y2',cy-(r-14)*Math.sin(a));
    tx.textContent=fmtId(v)+(g.sat?' '+g.sat:'');
  };
  s._ke(g.n);
  return s;
};

/* diagram batang (lihat parameter di gambar.ts: diagram) */
GBR.diagram=function(g){
  var d=g.d,n=d.length,W=300,H=g.judul?204:188,x0=46,x1=292,yb=g.judul?152:136,yt=g.judul?36:20,pw=(x1-x0)/n,ph=yb-yt,lo=g.lo||0,hi=g.hi,lab=g.label||null,ME='#d94f3d';
  var s=kanvas(W,H,440),tick=[],v,i;
  if(lab)tick=lab.slice();else if(g.langkah){for(v=lo;v<=hi+1e-9;v+=g.langkah)tick.push(Math.round(v*1000)/1000)}
  var kk=Math.max(1,tick.length-1);
  function py(x){
    if(g.rata&&lab){
      for(var j=0;j<kk;j++){if(x<=lab[j+1]||j===kk-1)return yb-(j+(x-lab[j])/(lab[j+1]-lab[j]))/kk*ph}
    }
    return yb-(x-lo)/(hi-lo)*ph;
  }
  if(g.judul){
    var jt=tks(s,W/2,16,g.judul,{s:13});
    if(g.sorot==='judul'){sg('rect',{x:W/2-g.judul.length*4.2-6,y:3,width:g.judul.length*8.4+12,height:19,rx:5,fill:'none',stroke:ME,'stroke-width':2.5,'stroke-dasharray':'5 3'},s)}
  }
  tick.forEach(function(t,j){
    var y=g.rata?yb-j/kk*ph:py(t);
    var ln=sg('line',{x1:x0,y1:y,x2:x1,y2:y,'stroke-width':1},s);ln.style.stroke='var(--line)';
    sg('line',{x1:x0-4,y1:y,x2:x0,y2:y,stroke:'currentColor','stroke-width':2},s);
    if(!g.tanpaAngka)tks(s,x0-7,y+4,fmtId(t),{a:'end',s:11});
  });
  if(g.sat)tks(s,x0-7,yt-9,g.sat,{a:'end',s:10,c:'#6b6878'});
  garisan(sg('line',{x1:x0,y1:yt-4,x2:x0,y2:yb},s),2.5);
  garisan(sg('line',{x1:x0,y1:yb,x2:x1,y2:yb},s),2.5);
  d.forEach(function(b,j){
    var wb=Math.min(pw*0.96,pw*0.6*(g.lebar?g.lebar[j]:1)),cx=x0+pw*(j+.5),top=Math.max(yt-4,py(b.v)),war=PL[b.w||['biru','kuning','hijau','merah','ungu'][j%5]];
    var r=sg('rect',{x:cx-wb/2,y:top,width:wb,height:Math.max(0,yb-top),fill:war,stroke:(g.sorot==='batang'||(g.tandai&&g.tandai.indexOf(j)>=0))?ME:'currentColor','stroke-width':(g.sorot==='batang'||(g.tandai&&g.tandai.indexOf(j)>=0))?3.5:2},s);
    if(g.anim!==false){r.setAttribute('class','tb');r.style.animationDelay=(j*0.12)+'s'}
    if(g.nilai)tks(s,cx,top-4,fmtId(b.v),{s:12});
    var sp=b.l.length>7&&b.l.indexOf(' ')>0,fs=n>4?9.5:11;
    if(sp){var q=b.l.indexOf(' ');tks(s,cx,yb+14,b.l.slice(0,q),{s:fs});tks(s,cx,yb+25,b.l.slice(q+1),{s:fs})}
    else tks(s,cx,yb+15,b.l,{s:fs});
  });
  if(g.garis)g.garis.forEach(function(q){var y=py(q.v);sg('line',{x1:x0,y1:y,x2:x1,y2:y,stroke:ME,'stroke-width':2.4,'stroke-dasharray':'6 4'},s);tks(s,x1-2,y+13,q.l,{a:'end',s:11,c:ME})});
  if(g.sorot==='tegak')sg('line',{x1:x0,y1:yt-4,x2:x0,y2:yb,stroke:ME,'stroke-width':5,'stroke-linecap':'round',opacity:.85},s);
  if(g.sorot==='datar')sg('line',{x1:x0,y1:yb,x2:x1,y2:yb,stroke:ME,'stroke-width':5,'stroke-linecap':'round',opacity:.85},s);
  if(g.sorot==='skala')sg('rect',{x:2,y:yt-8,width:x0-6,height:ph+16,rx:6,fill:'none',stroke:ME,'stroke-width':2.5,'stroke-dasharray':'5 3'},s);
  if(g.sorot==='kategori')sg('rect',{x:x0,y:yb+3,width:x1-x0,height:26,rx:6,fill:'none',stroke:ME,'stroke-width':2.5,'stroke-dasharray':'5 3'},s);
  return s;
};

/* pita pecahan (lihat parameter di gambar.ts: pita) */
GBR.pita=function(g){
  var R=g.baris,W=320,x0=56,wd=W-x0-8,hr=30,gp=14,H=R.length*(hr+gp)+2,s=kanvas(W,H,440),y0=6;
  R.forEach(function(b,i){
    var y=y0+i*(hr+gp)-4,m=b.tebal||1,war=PL[b.warna||['biru','kuning','hijau','merah'][i%4]],j;
    var uk=b.ukuran||[];if(!uk.length){for(j=0;j<b.n;j++)uk.push(1)}
    var tot=0;uk.forEach(function(v){tot+=v});
    var xs=[0],n=uk.length;uk.forEach(function(v){xs.push(xs[xs.length-1]+v/tot*wd)});
    var bg=sg('rect',{x:x0,y:y,width:wd,height:hr},s);bg.style.fill='var(--card)';
    if(b.w>0){
      var r=sg('rect',{x:x0,y:y,width:xs[b.w],height:hr,fill:war,opacity:.9},s);
      if(g.anim!==false)r.setAttribute('class','pt');
    }
    for(j=1;j<n;j++){
      var tebal=(j%m===0),pw=wd/n,tk=m>1&&tebal;
      if(!tk&&pw<3.2&&!b.ukuran)continue;
      sg('line',{x1:x0+xs[j],y1:y,x2:x0+xs[j],y2:y+hr,stroke:'currentColor','stroke-width':(tebal&&m>1)||b.ukuran?2.6:1,opacity:tebal&&m>1||b.ukuran?1:.45},s);
    }
    garisan(sg('rect',{x:x0,y:y,width:wd,height:hr,fill:'none'},s),2.5);
    if(b.l)tks(s,x0-7,y+hr/2+5,b.l,{a:'end',s:14});
  });
  if(g.sejajar&&R.length>1){
    var b0=R[0],u0=b0.ukuran||null,xe=u0?0:wd/b0.n*b0.w;
    if(u0){var t0=0,c0=0;u0.forEach(function(v,q){t0+=v;if(q<b0.w)c0+=v});xe=c0/t0*wd}
    sg('line',{x1:x0+xe,y1:y0-8,x2:x0+xe,y2:H,stroke:'#d94f3d','stroke-width':2,'stroke-dasharray':'5 4'},s);
  }
  return s;
};

/* garis bilangan 0..m dibagi n bagian sama besar; _ke(k) memindahkan titik pertama */
GBR.garispec=function(g){
  var m=g.m,n=g.n,W=320,x0=18,x1=302,y=50,u=(x1-x0)/n,s=kanvas(W,112,440),per=n/m,i;
  garisan(sg('line',{x1:x0-6,y1:y,x2:x1+6,y2:y},s),3);
  for(i=0;i<=n;i++){
    var x=x0+i*u,mj=(Math.abs(i/per-Math.round(i/per))<1e-9);
    sg('line',{x1:x,y1:y-(mj?10:6),x2:x,y2:y+(mj?10:6),stroke:'currentColor','stroke-width':mj?3:1.8},s);
    if(mj)tks(s,x,y+(g.nomor&&n<=16?42:30),String(Math.round(i/per)),{s:14});
    else if(g.nomor&&n<=16)tks(s,x,y+21,String(i),{s:9,c:'#6b6878'});
    if(mj&&g.nomor&&i>0&&n<=16)tks(s,x,y+21,String(i),{s:9,c:'#6b6878'});
  }
  var pts=[];
  (g.titik||[]).forEach(function(t,j){
    var c=sg('circle',{cx:x0+t.k*u,cy:y,r:7.5,fill:PL[t.w||(j?'biru':'merah')],stroke:'currentColor','stroke-width':2.2},s);
    var l=t.l?tks(s,x0+t.k*u,y-17,t.l,{s:13}):null;pts.push([c,l]);
  });
  s._ke=function(k){if(pts[0]){pts[0][0].setAttribute('cx',x0+k*u);if(pts[0][1])pts[0][1].setAttribute('x',x0+k*u)}};
  return s;
};

/* papan seratus: p petak berwarna */
GBR.seratus=function(g){
  var w=el('div','mq-100'),i;
  for(i=0;i<100;i++)w.appendChild(el('i',i<g.p?'a':''));
  return w;
};

/* bilangan desimal pada kolom tempat */
GBR.desimal=function(g){
  var w=el('div','mq-nilai'),p=g.s.split(','),nama=['persepuluhan','perseratusan','perseribuan','per sepuluh ribuan'],war=['#4a7bd0','#2e9a63','#c78a12','#7a5bd0'],i;
  var k0=el('div','mq-nk'),n0=el('span','nm','satuan');n0.style.background='#d94f3d';k0.appendChild(n0);k0.appendChild(el('span','dg',p[0]));w.appendChild(k0);
  w.appendChild(el('span','mq-koma',','));
  var f=p[1]||'';
  for(i=0;i<f.length;i++){
    var k=el('div','mq-nk'),n=el('span','nm',nama[i]);n.style.background=war[i];k.appendChild(n);k.appendChild(el('span','dg',f.charAt(i)));w.appendChild(k);
  }
  return w;
};

/* papan bilangan 1..n dengan kelipatan berwarna */
GBR.papan=function(g){
  var w=el('div','mq-papan'),kol=g.kol||10;w.style.gridTemplateColumns='repeat('+kol+',1fr)';
  for(var i=1;i<=g.n;i++){
    var a=g.a&&i%g.a===0,b=g.b&&i%g.b===0,kl='pk'+(a&&b?' ab':(a?' a':(b?' b':'')))+((g.sorot&&g.sorot.indexOf(i)>=0)?' so':'');
    w.appendChild(el('span',kl,String(i)));
  }
  return w;
};

/* garis bilangan pembulatan: n antara dua kelipatan satuan, titik tengah ditandai */
GBR.bulat=function(g){
  var u=g.t==='ribuan'?1000:(g.t==='ratusan'?100:10),lo=Math.floor(g.n/u)*u,hi=lo+u,mid=lo+u/2,x0=30,x1=290,y=52,s=kanvas(320,100,440);
  function px(v){return x0+(v-lo)/u*(x1-x0)}
  garisan(sg('line',{x1:x0-8,y1:y,x2:x1+8,y2:y},s),3);
  [lo,mid,hi].forEach(function(v,i){
    sg('line',{x1:px(v),y1:y-9,x2:px(v),y2:y+9,stroke:'currentColor','stroke-width':i===1?2:3},s);
    tks(s,px(v),y+28,titikRibu(v),{s:i===1?11:13,c:i===1?'#6b6878':'currentColor'});
  });
  var r=Math.round(g.n/u)*u,atas=g.n%u>=u/2;
  sg('rect',{x:atas?px(mid):x0,y:y-4,width:(x1-x0)/2,height:8,fill:PL.hijau,'fill-opacity':.28},s);
  var nilai=g.ke?r:g.n,c=sg('circle',{cx:px(nilai),cy:y,r:8,fill:PL.merah,stroke:'currentColor','stroke-width':2.2},s),l=tks(s,px(nilai),y-16,titikRibu(nilai),{s:13});
  s._ke=function(v){c.setAttribute('cx',px(v));l.setAttribute('x',px(v));l.textContent=titikRibu(v)};
  return s;
};

/* setara: dua pan berisi kotak dan satuan, atau angka */
GBR.setara=function(g){
  var w=el('div','mq-nr'),bar=el('div','bar'),L=el('div','pan'),R=el('div','pan'),i,j;
  bar.style.transform='rotate('+(g.sud||0)+'deg)';
  if(g.angkaL!=null){L.appendChild(el('b','ang',String(g.angkaL)));R.appendChild(el('b','ang',String(g.angkaR)))}
  else{
    for(i=0;i<(g.kb||0);i++)L.appendChild(el('span','kt'+(g.sorot&&i===0?' so':''),g.l||'n'));
    for(i=0;i<(g.ku||0);i++)L.appendChild(el('i','u'));
    if(g.kel){var per=g.kn/g.kel;for(j=0;j<g.kel;j++){var gr=el('b','gr'+(g.sorot&&j===0?' so':''));for(i=0;i<per;i++)gr.appendChild(el('i','u'));R.appendChild(gr)}}
    else for(i=0;i<(g.kn||0);i++)R.appendChild(el('i','u'));
  }
  bar.appendChild(L);bar.appendChild(R);w.appendChild(bar);w.appendChild(el('div','tg'));
  return w;
};

/* persegi petak n x n, isi x isi berwarna */
GBR.petak=function(g){
  var w=el('div','mq-kd'),n=g.n,k=g.isi===undefined?n:g.isi,i,j;w.style.gridTemplateColumns='repeat('+n+',1fr)';
  for(i=0;i<n;i++)for(j=0;j<n;j++)w.appendChild(el('i',i<k&&j<k?'a':''));
  return w;
};

/* kubus sebagai n lapisan n x n petak */
GBR.lapis=function(g){
  var w=el('div','mq-ls'),n=g.n,a,i,j;
  for(a=0;a<n;a++){
    var ly=el('div','ly');ly.style.gridTemplateColumns='repeat('+n+',9px)';
    for(i=0;i<n*n;i++)ly.appendChild(el('i'));
    w.appendChild(ly);
  }
  return w;
};

/* bangun gabungan persegi panjang dan segitiga dengan label */
GBR.gabungan=function(g){
  var j=g.jenis,p=g.p||0,l=g.l||0,a=g.a||0,t=g.t||0,t2=g.t2||0,lab=g.lab||{},W,H,R=null,T=[],T2=null,sh=null,s=kanvas(320,214,440);
  if(j==='rumah'){W=p;H=l+t;R=[0,t,p,l];T=[[0,t],[p,t],[p/2,0]];sh=[[0,t],[p,t]]}
  else if(j==='samping'){W=p+t;H=l;R=[0,0,p,l];T=[[p,0],[p,l],[p+t,l/2]];sh=[[p,0],[p,l]]}
  else if(j==='siku'){W=p+a;H=l;R=[0,0,p,l];T=[[p,0],[p,l],[p+a,l]];sh=[[p,0],[p,l]]}
  else if(j==='layang'){W=a;H=t+t2;T=[[0,t],[a,t],[a/2,0]];T2=[[0,t],[a,t],[a/2,t+t2]];sh=[[0,t],[a,t]]}
  else if(j==='pp'){W=p;H=l;R=[0,0,p,l]}
  else{W=a;H=t;T=[[0,t],[a,t],[a/2,0]]}
  var u=Math.min(220/W,140/H),ox=(320-W*u)/2,oy=(176-H*u)/2+8;
  function X(v){return ox+v*u}function Y(v){return oy+v*u}
  function poli(pts,war,op){var e=sg('polygon',{points:pts.map(function(q){return X(q[0])+','+Y(q[1])}).join(' '),fill:war,'fill-opacity':op},s);garisan(e,2.6);return e}
  var oR=g.sorot==='seg'?.25:.9,oT=g.sorot==='persegi'?.25:.9;
  if(R)poli([[R[0],R[1]],[R[0]+R[2],R[1]],[R[0]+R[2],R[1]+R[3]],[R[0],R[1]+R[3]]],PL.biru,oR);
  if(T.length)poli(T,PL.kuning,oT);if(T2)poli(T2,PL.hijau,oT);
  if(sh&&(g.pisah||j!=='tri')){sg('line',{x1:X(sh[0][0]),y1:Y(sh[0][1]),x2:X(sh[1][0]),y2:Y(sh[1][1]),stroke:'#d94f3d','stroke-width':3,'stroke-dasharray':'6 4'},s)}
  function garisTinggi(x1,y1,x2,y2){sg('line',{x1:X(x1),y1:Y(y1),x2:X(x2),y2:Y(y2),stroke:'currentColor','stroke-width':1.8,'stroke-dasharray':'4 3'},s)}
  if(j==='pp'){
    if(lab.p)tks(s,X(p/2),Y(H)+17,lab.p,{s:13});
    if(lab.l)tks(s,X(0)-6,Y(l/2)+5,lab.l,{a:'end',s:13});
    if(lab.isi)tks(s,X(p/2),Y(l/2)+6,lab.isi,{s:15,c:'#fff'});
  }else if(j==='rumah'){
    if(lab.p)tks(s,X(p/2),Y(H)+17,lab.p,{s:13});
    if(lab.l)tks(s,X(0)-6,Y(t+l/2)+5,lab.l,{a:'end',s:13});
    if(lab.t){garisTinggi(p/2,0,p/2,t);tks(s,X(p/2)-5,Y(t/2)+4,lab.t,{a:'end',s:13})}
    if(lab.m)tks(s,X(p*.75)+8,Y(t/2)-2,lab.m,{a:'start',s:13});
  }else if(j==='samping'){
    if(lab.p)tks(s,X(p/2),Y(H)+17,lab.p,{s:13});
    if(lab.l)tks(s,X(0)-6,Y(l/2)+5,lab.l,{a:'end',s:13});
    if(lab.t){garisTinggi(p,l/2,p+t,l/2);tks(s,X(p+t/2),Y(l/2)-6,lab.t,{s:13})}
    if(lab.m)tks(s,X(p+t*.55)+4,Y(l*.8)+12,lab.m,{a:'start',s:13});
  }else if(j==='siku'){
    if(lab.p)tks(s,X(p/2),Y(0)-8,lab.p,{s:13});
    if(lab.l)tks(s,X(0)-6,Y(l/2)+5,lab.l,{a:'end',s:13});
    if(lab.a)tks(s,X(p+a/2),Y(l)+17,lab.a,{s:13});
    if(lab.t)tks(s,X(p)-6,Y(l/2)+5,lab.t,{a:'end',s:13});
  }else if(j==='layang'){
    if(lab.a)tks(s,X(0)-6,Y(t)+5,lab.a,{a:'end',s:13});
    if(lab.t){garisTinggi(a/2,0,a/2,t);tks(s,X(a/2)-5,Y(t/2)+4,lab.t,{a:'end',s:13})}
    if(lab.t2){garisTinggi(a/2,t,a/2,t+t2);tks(s,X(a/2)-5,Y(t+t2/2)+4,lab.t2,{a:'end',s:13})}
  }else{
    if(lab.a)tks(s,X(a/2),Y(t)+17,lab.a,{s:13});
    if(lab.t){garisTinggi(a/2,0,a/2,t);tks(s,X(a/2)-5,Y(t/2)+4,lab.t,{a:'end',s:13})}
    if(lab.m)tks(s,X(a*.75)+8,Y(t/2)-2,lab.m,{a:'start',s:13});
  }
  return s;
};

/* balok dalam proyeksi miring dengan sisi berwarna */
GBR.balok=function(g){
  var p=g.p,l=g.l,t=g.t,A=g.atas||null,lab=g.lab||{},s=kanvas(320,214,440),f=.45,tot=t+(A?A.t:0),W=p+f*l,H=tot+f*l;
  var u=Math.min(205/W,125/H),ox=(320-W*u)/2,oy=(214+H*u)/2-10;
  function X(x,y){return ox+(x+f*y)*u}function Y(y,z){return oy-(z+f*y)*u}
  function pts(a){return a.map(function(q){return X(q[0],q[1])+','+Y(q[1],q[2])}).join(' ')}
  function sisi(a,war,op,nm){var o=g.sorot&&g.sorot!==nm?.28:op;garisan(sg('polygon',{points:pts(a),fill:war,'fill-opacity':o},s),2.4)}
  function garis(x1,y1,z1,x2,y2,z2){sg('line',{x1:X(x1,y1),y1:Y(y1,z1),x2:X(x2,y2),y2:Y(y2,z2),stroke:'currentColor','stroke-width':.9,opacity:.55},s)}
  function kotak(x0,y0,z0,bp,bl,bt,gr){
    sisi([[x0,y0,z0],[x0+bp,y0,z0],[x0+bp,y0,z0+bt],[x0,y0,z0+bt]],PL.biru,.9,'depan');
    sisi([[x0+bp,y0,z0],[x0+bp,y0+bl,z0],[x0+bp,y0+bl,z0+bt],[x0+bp,y0,z0+bt]],PL.hijau,.9,'samping');
    sisi([[x0,y0,z0+bt],[x0+bp,y0,z0+bt],[x0+bp,y0+bl,z0+bt],[x0,y0+bl,z0+bt]],PL.kuning,.9,'atas');
    if(gr){var i;
      for(i=1;i<bp;i++){garis(x0+i,y0,z0,x0+i,y0,z0+bt);garis(x0+i,y0,z0+bt,x0+i,y0+bl,z0+bt)}
      for(i=1;i<bt;i++){garis(x0,y0,z0+i,x0+bp,y0,z0+i);garis(x0+bp,y0,z0+i,x0+bp,y0+bl,z0+i)}
      for(i=1;i<bl;i++){garis(x0+bp,y0+i,z0,x0+bp,y0+i,z0+bt);garis(x0,y0+i,z0+bt,x0+bp,y0+i,z0+bt)}
    }
  }
  var tb=g.isi!==undefined?g.isi:t,gr=!!g.grid&&p<=12&&l<=12&&t<=12;
  kotak(0,0,0,p,l,tb,gr);
  if(A){
    kotak(0,0,t,A.p,A.l,A.t,gr&&A.p<=12);
    if(g.tempel)sg('polygon',{points:pts([[0,0,t],[A.p,0,t],[A.p,A.l,t],[0,A.l,t]]),fill:'#d94f3d','fill-opacity':.55,stroke:'#d94f3d','stroke-width':2.5,'stroke-dasharray':'5 3'},s);
  }
  if(lab.p)tks(s,X(p/2,0),Y(0,0)+16,lab.p,{s:13});
  if(lab.t)tks(s,X(0,0)-6,Y(0,t/2)+5,lab.t,{a:'end',s:13});
  if(lab.l)tks(s,X(p,l/2)+8,Y(l/2,0)+4,lab.l,{a:'start',s:13});
  if(lab.ta&&A)tks(s,X(0,0)-6,Y(0,t+A.t/2)+5,lab.ta,{a:'end',s:13});
  return s;
};

/* sudut dalam berbagai tampilan */
GBR.sudut=function(g){
  var m=g.mode,s=kanvas(320,200,440),cx=160,cy=150,R=Math.PI/180;
  function P(x,y,r,d){return [x+r*Math.cos(d*R),y-r*Math.sin(d*R)]}
  function garisA(x1,y1,x2,y2,w,c){return sg('line',{x1:x1,y1:y1,x2:x2,y2:y2,stroke:c||'currentColor','stroke-width':w||3,'stroke-linecap':'round'},s)}
  function busur(x,y,r,d1,d2,war){
    var a=P(x,y,r,d1),b=P(x,y,r,d2),sp=['M',x,y,'L',a[0],a[1],'A',r,r,0,(d2-d1)>180?1:0,0,b[0],b[1],'Z'].join(' ');
    var e=sg('path',{d:sp,fill:war,'fill-opacity':.35,stroke:war,'stroke-width':2},s);return e;
  }
  function labS(x,y,r,d,t){if(t)tks(s,P(x,y,r,d)[0],P(x,y,r,d)[1]+5,t,{s:14})}
  if(m==='satu'){
    var L=105*(g.kaki||1),d=g.deg,r=g.r||38;cx=60;cy=150;
    busur(cx,cy,r,0,d,PL.merah);
    garisA(cx,cy,cx+L,cy);var q=P(cx,cy,L,d);garisA(cx,cy,q[0],q[1]);
    labS(cx,cy,r+20,d/2,g.lab);
  }else if(m==='busur'){
    var d2=g.deg,Rr=130;cx=160;cy=165;
    sg('path',{d:'M '+(cx-Rr)+' '+cy+' A '+Rr+' '+Rr+' 0 0 1 '+(cx+Rr)+' '+cy+' Z',fill:'#9bd0e8','fill-opacity':.25,stroke:'currentColor','stroke-width':2},s);
    for(var k=0;k<=180;k+=10){
      var a1=P(cx,cy,Rr,k),a2=P(cx,cy,Rr-(k%30===0?14:8),k);garisA(a1[0],a1[1],a2[0],a2[1],1.5);
      if(k%30===0){var o1=P(cx,cy,Rr-26,k),i1=P(cx,cy,Rr-46,k);tks(s,o1[0],o1[1]+4,String(k),{s:11});tks(s,i1[0],i1[1]+4,String(180-k),{s:10,c:'#6b6878'})}
    }
    garisA(cx-Rr,cy,cx+Rr,cy,2.5);
    var t=P(cx,cy,Rr+10,d2);garisA(cx,cy,t[0],t[1],3,PL.merah);sg('circle',{cx:cx,cy:cy,r:4,fill:'currentColor'},s);
    if(g.lab)tks(s,cx,cy+18,g.lab,{s:14});
  }else if(m==='pelurus'||m==='penyiku'){
    var d3=g.deg,Lh=110,top=m==='pelurus'?180:90;cx=m==='pelurus'?160:90;cy=150;
    busur(cx,cy,42,0,d3,PL.biru);busur(cx,cy,42,d3,top,PL.hijau);
    garisA(cx,cy,cx+Lh,cy);var e3=P(cx,cy,Lh,d3);garisA(cx,cy,e3[0],e3[1]);
    if(m==='pelurus')garisA(cx-Lh,cy,cx,cy);else garisA(cx,cy,cx,cy-Lh);
    labS(cx,cy,64,d3/2,g.labA);labS(cx,cy,64,(d3+top)/2,g.labB);
  }else if(m==='silang'){
    var d4=g.deg,Ls=95;cx=160;cy=100;
    garisA(cx-Ls,cy,cx+Ls,cy);var e4=P(cx,cy,Ls,d4),f4=P(cx,cy,Ls,d4+180);garisA(f4[0],f4[1],e4[0],e4[1]);
    busur(cx,cy,34,0,d4,PL.biru);busur(cx,cy,34,d4,180,PL.hijau);busur(cx,cy,34,180,180+d4,PL.biru);busur(cx,cy,34,180+d4,360,PL.hijau);
    labS(cx,cy,56,d4/2,g.labA);labS(cx,cy,56,(d4+180)/2,g.labB);labS(cx,cy,56,180+d4/2,g.labC);labS(cx,cy,56,(180+d4+360)/2,g.labD);
  }else if(m==='putaran'){
    var ds=g.sudut||[],cum=0,war=[PL.biru,PL.hijau,PL.kuning,PL.ungu];cx=160;cy=100;
    ds.forEach(function(x,i){busur(cx,cy,52,cum,cum+x.v,war[i%4]);labS(cx,cy,72,cum+x.v/2,x.l);cum+=x.v});
    cum=0;ds.forEach(function(x){var e=P(cx,cy,88,cum);garisA(cx,cy,e[0],e[1],2.5);cum+=x.v});
    sg('circle',{cx:cx,cy:cy,r:4,fill:'currentColor'},s);
  }else if(m==='segitiga'){
    var a=g.a*R,b=g.b*R,AC=Math.sin(b)/Math.sin(a+b),Cx=AC*Math.cos(a),Cy=AC*Math.sin(a);
    var minx=Math.min(0,Cx),maxx=Math.max(1,Cx),h=Cy,u=Math.min(240/(maxx-minx),130/h),ox=(320-(maxx-minx)*u)/2-minx*u,oy=170;
    var A=[ox,oy],B=[ox+u,oy],C=[ox+Cx*u,oy-Cy*u];
    sg('polygon',{points:[A,B,C].map(function(q){return q.join(',')}).join(' '),fill:PL.kuning,'fill-opacity':.45,stroke:'currentColor','stroke-width':2.8,'stroke-linejoin':'round'},s);
    tks(s,A[0]+(Cx<0?14:24),A[1]-8,(g.labA||''),{s:13});tks(s,B[0]-24,B[1]-8,(g.labB||''),{s:13});tks(s,C[0],C[1]+24,(g.labC||''),{s:13});
  }else{
    var Q=[[50,160],[270,160],[245,40],[75,55]],rect=g.a===90;if(rect)Q=[[60,165],[260,165],[260,45],[60,45]];
    sg('polygon',{points:Q.map(function(q){return q.join(',')}).join(' '),fill:PL.hijau,'fill-opacity':.4,stroke:'currentColor','stroke-width':2.8,'stroke-linejoin':'round'},s);
    if(g.diagonal)sg('line',{x1:Q[0][0],y1:Q[0][1],x2:Q[2][0],y2:Q[2][1],stroke:'#d94f3d','stroke-width':2.5,'stroke-dasharray':'6 4'},s);
    var L4=[g.labA,g.labB,g.labC,g.labD],off=[[22,-9],[-22,-9],[-22,22],[22,24]];
    Q.forEach(function(q,i){tks(s,q[0]+off[i][0],q[1]+off[i][1],L4[i]||'',{s:13})});
  }
  return s;
};

/* jam dinding analog; _ke(t) menggerakkan jarum ke menit ke-t sejak tengah malam */
GBR.jam=function(g){
  var s=kanvas(220,214,300),cx=110,cy=100,r=84,i;
  garisan(sg('circle',{cx:cx,cy:cy,r:r,fill:'none'},s),4);
  for(i=0;i<60;i++){var a=i*6,p1=[cx+Math.sin(a*Math.PI/180)*(r-(i%5===0?10:5)),cy-Math.cos(a*Math.PI/180)*(r-(i%5===0?10:5))],p2=[cx+Math.sin(a*Math.PI/180)*r,cy-Math.cos(a*Math.PI/180)*r];sg('line',{x1:p1[0],y1:p1[1],x2:p2[0],y2:p2[1],stroke:'currentColor','stroke-width':i%5===0?2.4:1,opacity:i%5===0?1:.5},s)}
  for(i=1;i<=12;i++){var b=i*30;tks(s,cx+Math.sin(b*Math.PI/180)*(r-24),cy-Math.cos(b*Math.PI/180)*(r-24)+5,String(i),{s:13})}
  var hh=sg('line',{x1:cx,y1:cy,x2:cx,y2:cy-44,stroke:'currentColor','stroke-width':5,'stroke-linecap':'round'},s);
  var mm=sg('line',{x1:cx,y1:cy,x2:cx,y2:cy-66,stroke:PL.merah,'stroke-width':3,'stroke-linecap':'round'},s);
  sg('circle',{cx:cx,cy:cy,r:4.5,fill:'currentColor'},s);
  var tx=g.lab?tks(s,cx,cy+r+22,g.lab,{s:16}):null;
  function atur(t){var m=((t%60)+60)%60,h=((t/60)%12+12)%12;hh.setAttribute('transform','rotate('+(h*30+m*0.5)+' '+cx+' '+cy+')');mm.setAttribute('transform','rotate('+(m*6)+' '+cx+' '+cy+')')}
  atur(g.t);
  s._ke=function(t){atur(t);if(tx){var T=Math.round(((t%1440)+1440)%1440),H=Math.floor(T/60),M=T%60;tx.textContent=H+'.'+(M<10?'0'+M:M)}};
  return s;
};

/* garis waktu antara dua pukul */
GBR.lini=function(g){
  var a=g.a,b=g.b;if(b<a)b+=1440;
  var h0=Math.floor(a/60),h1=Math.ceil(b/60),n=h1-h0,st=n>8?2:1,x0=22,w=276,s=kanvas(320,120,440),y=62,lab=g.lab||{};
  function X(v){return x0+(v-h0*60)/(n*60)*w}
  function jm(v){var T=((v%1440)+1440)%1440,H=Math.floor(T/60);return String(H)}
  sg('rect',{x:X(a),y:y-7,width:X(b)-X(a),height:14,fill:PL.hijau,'fill-opacity':.55},s);
  garisan(sg('line',{x1:x0-6,y1:y,x2:x0+w+6,y2:y},s),3);
  for(var i=0;i<=n;i+=st){var x=X((h0+i)*60);sg('line',{x1:x,y1:y-8,x2:x,y2:y+8,stroke:'currentColor','stroke-width':2.2},s);tks(s,x,y+26,jm((h0+i)*60),{s:12,c:'#6b6878'})}
  [[a,lab.a],[b,lab.b]].forEach(function(q){sg('circle',{cx:X(q[0]),cy:y,r:6.5,fill:PL.merah,stroke:'currentColor','stroke-width':2.2},s);if(q[1])tks(s,X(q[0]),y-18,q[1],{s:13})});
  if(lab.d)tks(s,(X(a)+X(b))/2,y+48,lab.d,{s:14});
  return s;
};

/* semua faktor sebuah bilangan, berpasangan atau tunggal */
GBR.faktor=function(g){
  var w=el('div','mq-fak'),n=g.n,i;
  for(i=1;i<=n;i++){
    if(n%i!==0)continue;
    if(g.semua)w.appendChild(el('span',null,String(i)));
    else if(i<=n/i)w.appendChild(el('span',null,i+' × '+(n/i)));
  }
  return w;
};

/* dua kotak dengan panah pengubah satuan */
GBR.ubah=function(g){
  var w=el('div','mq-ubah');
  w.appendChild(el('span','kt',g.dari));
  var p=el('span','pn');p.appendChild(el('span',null,'→'));p.appendChild(el('small',null,g.f));w.appendChild(p);
  w.appendChild(el('span','kt q',g.ke));
  return w;
};

function gambarItem(g,wadah){
  clear(wadah);
  if(!g)return;
  (Array.isArray(g)?g:[g]).forEach(function(x){
    if(!GBR[x.k])throw new Error('jenis gambar tidak dikenal: '+x.k);
    wadah.appendChild(GBR[x.k](x));
  });
}
`
