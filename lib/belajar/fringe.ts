import type { TopikPeta } from './topik-peta'

/**
 * Membagi peta jadi tiga: yang siap dikerjakan sekarang, yang belum, yang sudah.
 *
 * KENAPA TIGA DAN BUKAN SATU DAFTAR. `topik_prasyarat` (migrasi 143) bukan
 * rantai melainkan DAG: empat topik Fase D sengaja tidak punya prasyarat sama
 * sekali — D-01, D-04, D-06, D-19 — dan komentar migrasi itu menyatakannya
 * harfiah, "keempatnya BOLEH DIKERJAKAN PARALEL, urutan nomor ID bukan urutan
 * wajib". Frontier grafnya disimulasikan selebar 4 sampai 7 topik sepanjang
 * penuntasan Fase D, rata-rata 5,1, dan tidak pernah menyempit jadi satu sampai
 * topik yang terakhir.
 *
 * Akibatnya sebuah misi "satu topik terendah, satu per satu" MUSTAHIL tanpa
 * sistem mengarang urutan di antara keempat akar itu — dan mengarang urutan
 * persis yang dokumen sumbernya larang. Yang bisa dilakukan adalah
 * mempersempit, bukan menunggal: tampilkan apa yang siap, lipat sisanya.
 *
 * Ini bentuk yang sama dengan `outer fringe` pada Knowledge Space Theory —
 * himpunan yang "siap dipelajari" — dan sebagaimana di sana, yang memilih di
 * dalam himpunan itu tetap anaknya. Pilihan itu bukan kelonggaran: ia yang
 * membuat layar ini tetap menghormati aturan lama peta ini, bahwa prasyarat
 * MEMBERI TAHU dan tidak MEMBLOKIR.
 *
 * DUA DEFINISI "TUNTAS" BERTEMU DI BERKAS INI, dan itu bukan kelalaian yang
 * bisa diperbaiki dari sisi TypeScript:
 *
 *   `status === 'tuntas'`   dari `status_topik_murid` (migrasi 163) — SELURUH
 *                           paket latihan lolos di putaran pertama
 *   `prasyaratTerpenuhi`    dari `topik_tersedia` (migrasi 146) — skor agregat
 *                           seluruh butir topik itu melewati ambang
 *
 * Yang kedua lebih longgar. Jadi sebuah topik bisa berada di `belum` padahal
 * prasyaratnya sudah lolos menurut ukuran yang satunya, atau sebaliknya masuk
 * `siap` sementara label statusnya belum berbunyi "Tuntas". Menyeragamkannya
 * berarti mengubah salah satu RPC, dan keduanya sudah dipakai hal lain —
 * `kelas_setara` di migrasi 181 bergantung pada yang pertama. Dicatat di sini
 * supaya yang menemukan kejanggalannya di layar tahu tempatnya bukan di sini.
 */

export type Kelompok = 'siap' | 'belum' | 'tuntas'

export interface PetaTerkelompok {
  /** Frontier: prasyaratnya terpenuhi dan topiknya belum tuntas. */
  siap: TopikPeta[]
  /** Prasyaratnya belum lengkap. TETAP BISA DIBUKA — cuma terlipat. */
  belum: TopikPeta[]
  tuntas: TopikPeta[]
}

/**
 * Urutan di dalam frontier.
 *
 * `sedang_dikerjakan` lebih dulu daripada apa pun: yang sudah dimulai punya
 * tarikan penyelesaian yang tidak dimiliki topik yang masih kosong, dan
 * menguburnya di bawah tawaran baru adalah cara termurah membuat orang
 * meninggalkan pekerjaan yang hampir selesai.
 *
 * `butuh_pengulangan` menyusul karena itulah corrective loop-nya Bloom — inti
 * mekanismenya, bukan hukumannya.
 *
 * `eskalasi_tutor` JUSTRU PALING BAWAH, dan itu sengaja meski ia terdengar
 * paling mendesak. Topik yang tereskalasi sedang menunggu manusia; anak tidak
 * bisa membukanya sendiri betapapun ia mau. Menaruhnya di puncak berarti
 * memimpin layar dengan satu-satunya baris yang tidak bisa ia tindaklanjuti —
 * dan baris itu kebetulan juga yang menandai ia baru saja tersendat.
 */
const PRIORITAS: Record<string, number> = {
  sedang_dikerjakan: 0,
  butuh_pengulangan: 1,
  siap_dikerjakan: 2,
  eskalasi_tutor: 4,
}

/** Topik yang belum punya cetakan status sama sekali — belum pernah disentuh. */
const PRIORITAS_TANPA_STATUS = 3

const prioritas = (t: TopikPeta) =>
  t.status === null ? PRIORITAS_TANPA_STATUS : PRIORITAS[t.status] ?? PRIORITAS_TANPA_STATUS

/**
 * Kelompok sebuah topik.
 *
 * `tuntas` diperiksa lebih dulu daripada prasyarat, dan urutan itu penting:
 * anak bisa menuntaskan sebuah topik TANPA prasyaratnya lengkap (karena
 * prasyarat tidak memblokir), dan topik seperti itu harus mendarat di "sudah
 * tuntas" — bukan di "belum siap", tempat ia akan berdiri sebagai baris yang
 * membantah dirinya sendiri.
 */
export function kelompokTopik(t: TopikPeta): Kelompok {
  if (t.status === 'tuntas') return 'tuntas'
  return t.prasyaratTerpenuhi ? 'siap' : 'belum'
}

/**
 * Peta jadi tiga kelompok.
 *
 * `topik` DIANGGAP SUDAH URUT menurut kurikulum — `topik_tersedia` memulangkan
 * `order by t.urutan` — dan `sort` di sini stabil (dijamin spesifikasi sejak
 * ES2019), jadi urutan itu bertahan sebagai kunci kedua di dalam tiap
 * prioritas. Tidak ada nomor urut yang perlu ikut menyeberang dari server.
 *
 * TIDAK MENYARING RETEST. Yang jatuh tempo sudah punya rumahnya sendiri di
 * `KartuRetest`, di atas seluruh peta ini — memasukkannya juga ke frontier
 * berarti satu topik yang sama muncul dua kali di satu layar.
 */
export function kelompokkanPeta(topik: TopikPeta[]): PetaTerkelompok {
  const hasil: PetaTerkelompok = { siap: [], belum: [], tuntas: [] }
  for (const t of topik) hasil[kelompokTopik(t)].push(t)
  hasil.siap.sort((a, b) => prioritas(a) - prioritas(b))
  return hasil
}

/**
 * "Bilangan Bulat: operasi & sifat dasar (D-01) dan Bilangan Rasional (D-02)".
 *
 * `prasyarat_kurang` dari `topik_tersedia` berisi ID, bukan nama — jadi
 * keterangan prasyarat dulu berbunyi "lebih mudah kalau D-02 dan D-08 sudah
 * dituntaskan dulu", yang menyuruh anak mencocokkan kode dengan daftar di
 * layar yang lain. Namanya dipulangkan oleh baris topik yang lain di peta yang
 * sama, jadi tidak ada yang perlu diminta ke server.
 *
 * Kodenya IKUT DISEBUT, tidak diganti: ia yang tercetak di baris topiknya, dan
 * keterangan yang cuma memakai nama membuat anak mencari baris yang salah pada
 * dua topik yang namanya berawal sama.
 *
 * Prasyarat yang namanya tidak dikenal pulang sebagai kodenya saja — itu topik
 * yang tidak ikut di peta anak ini (belum `aktif`, atau paketnya masih kosong),
 * dan menebak namanya lebih buruk daripada menyebut kodenya.
 */
export function sebutPrasyarat(kurang: string[], nama: Map<string, string>): string {
  const bagian = kurang.map(id => {
    const n = nama.get(id)
    return n ? `${namaPendek(n)} (${id})` : id
  })
  if (bagian.length <= 1) return bagian.join('')
  return `${bagian.slice(0, -1).join(', ')} dan ${bagian[bagian.length - 1]}`
}

/** Panjang nama topik yang masih enak dibaca di tengah kalimat, dalam karakter. */
const BATAS_NAMA = 40

/**
 * "Bilangan Rasional: pecahan, desimal…" dari nama topik selengkapnya.
 *
 * Nama topik di `topik` ditulis untuk dibaca sebagai baris tabel Learning
 * Progression, bukan untuk disisipkan ke tengah kalimat: yang terpanjang di
 * Fase D 61 karakter, dan keterangan prasyarat yang memuat DUA di antaranya
 * (D-12, D-14, D-17) menjadi tiga baris teks kecil berwarna di bawah sebuah
 * baris topik. Migrasi 180 membawa 67 topik Fase A–F, jadi yang terpanjang
 * belum tentu yang sekarang.
 *
 * DIPOTONG DI BATAS KATA, dan kodenya tetap menyusul di belakangnya — itu yang
 * membuat pemotongan ini aman: yang hilang cuma ekor keterangan, sedangkan
 * identitas topiknya tetap utuh dan tetap cocok dengan kode di barisnya
 * sendiri. Memotong tanpa menyebut kode akan meninggalkan anak dengan nama
 * setengah yang tidak bisa ia temukan di mana pun.
 *
 * Tidak memotong di tengah kata terakhir yang utuh: `slice` di batas spasi
 * terdekat sebelum ambangnya, dan kalau kata pertamanya sendiri sudah lebih
 * panjang daripada ambang, biarkan ia lewat — nama tanpa spasi sepanjang itu
 * lebih baik tampil apa adanya daripada terpotong jadi bukan kata.
 */
export function namaPendek(nama: string): string {
  if (nama.length <= BATAS_NAMA) return nama
  const spasi = nama.lastIndexOf(' ', BATAS_NAMA)
  if (spasi <= 0) return nama
  // Tanda baca yang tertinggal di ujung potongan ikut dibuang. Dua bentuk
  // muncul di data yang ada: koma ("pecahan, desimal,") yang disusul elipsis
  // membaca seperti daftar yang terhenti, dan kata penghubung yang menggantung
  // ("penyajian &…") yang membaca seperti kalimat yang terputus di tengah.
  return `${nama.slice(0, spasi).replace(/[\s,;:.&\/+-]+$/, '')}…`
}
