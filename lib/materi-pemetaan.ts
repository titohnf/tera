/**
 * Menghubungkan berkas materi di Drive dengan topik kurikulum Tera.
 *
 * Masalah yang diselesaikan: nama folder di Drive diketik tutor, sedangkan topik
 * di Tera punya struktur "Tema / Topik" dan penamaannya sendiri. Tanpa pengenal
 * bersama, satu-satunya jalan adalah menebak dari teks — dan menebak salah
 * berarti anak membaca bahan yang keliru, kegagalan yang tidak tampak sebagai
 * kegagalan. Pencocokan kemiripan sudah pernah dicoba dan menaruh "Bangun
 * Datar — Keliling & Luas" di topik "Data" hanya karena sama-sama memuat kata
 * itu. Karena itu urutan di bawah TIDAK PERNAH menebak.
 *
 * Urutan pencocokan, dari yang paling pasti:
 *
 *   1. KODE di jalur folder — `[t-9f3a2c]` di nama folder mana pun. Pengenal
 *      yang sama persis dengan yang ditampilkan di halaman admin Materi dan
 *      Latihan Soal. Menang atas semua yang lain.
 *   2. PETA keputusan manual (`scripts/materi-pemetaan.json`) — jalur folder
 *      yang pernah diputuskan seseorang. Berkas baru di folder yang sama ikut
 *      terdaftar tanpa ditanya lagi.
 *   3. NAMA PERSIS — mapel, kelas, dan topik sama setelah dinormalkan.
 *
 * Yang tidak lolos ketiganya TIDAK didaftarkan; ia dilaporkan, dan manusia yang
 * memutuskan.
 *
 * Kodenya diturunkan dari id grup topik (6 karakter pertama UUID), bukan kolom
 * baru: tidak perlu migrasi, dan tidak berubah selama grupnya ada. Enam
 * karakter cukup — tidak ada bentrokan di 560 grup, dan `periksaKode` menolak
 * bila suatu hari ada.
 */

export type GrupTopik = {
  id: string
  curriculum: string
  subject_id: string
  grade_level: string
  semester: number
  theme: string
  topic: string
  subjects: { name: string } | null
}

/** `t-9f3a2c` — selalu huruf kecil. */
export function kodeTopik(groupId: string): string {
  return `t-${groupId.replace(/-/g, '').slice(0, 6).toLowerCase()}`
}

const POLA_KODE = /\[(t-[0-9a-f]{6})\]/i

/** Kode di salah satu segmen jalur folder, atau null. Segmen terdalam menang. */
export function bacaKode(jalur: string[]): string | null {
  for (let i = jalur.length - 1; i >= 0; i--) {
    const m = jalur[i].match(POLA_KODE)
    if (m) return m[1].toLowerCase()
  }
  return null
}

/** Nama folder tanpa kodenya — untuk membandingkan dengan nama topik. */
export function tanpaKode(nama: string): string {
  return nama.replace(POLA_KODE, '').replace(/\s+/g, ' ').trim()
}

/**
 * Huruf kecil, tanda baca jadi spasi. Drive mengganti `/`, `?`, dan `:` di nama
 * folder dengan `-`, jadi "Better? & Spot" dan "Better- & Spot" harus sama.
 */
export function normalisasi(s: string | null | undefined): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** "Kelas 5 SD" dan "Kelas 5" sama-sama dibaca "Kelas 5". */
export function kelasDari(s: string): string {
  return (s.match(/Kelas\s+\d+/i)?.[0] ?? s).replace(/\s+/g, ' ')
}

/** "18. Materi_7 SMP_IPA_Pengenalan Gaya.docx.pdf" → "Materi_7 SMP_IPA_Pengenalan Gaya" */
export function judulDariNama(nama: string): string {
  return nama
    .replace(/\.(docx?|pptx?)?\.?pdf$/i, '')
    .replace(/\.pdf$/i, '')
    .replace(/^\d+\.\s*/, '')
    .trim()
}

/** Kunci jalur folder untuk peta manual: segmen digabung `/`, tanpa kode. */
export function kunciJalur(jalur: string[]): string {
  return jalur.map(tanpaKode).join('/')
}

export type CaraCocok = 'kode' | 'peta' | 'nama'

export type HasilCocok =
  | { status: 'cocok'; grup: GrupTopik; cara: CaraCocok }
  | { status: 'ambigu'; calon: GrupTopik[] }
  | { status: 'kode-tak-dikenal'; kode: string }
  | { status: 'peta-tak-dikenal'; kode: string }
  | { status: 'tak-ada' }

export type Pemetaan = {
  /** Jalur folder (dari "Materi Kurikulum"), segmen dipisah `/`. */
  jalur: string
  /** Kode topik tujuan, `t-xxxxxx`. */
  kode: string
  /** Catatan manusia: topik yang dituju. Tidak dipakai mesin. */
  topik?: string
}

export type IndeksTopik = {
  perKode: Map<string, GrupTopik>
  perNama: Map<string, GrupTopik[]>
  peta: Map<string, string>
}

/** Melempar bila dua grup berbagi kode — itu berarti kodenya harus diperpanjang. */
export function periksaKode(grup: GrupTopik[]): void {
  const lihat = new Map<string, string>()
  for (const g of grup) {
    const k = kodeTopik(g.id)
    const lain = lihat.get(k)
    if (lain && lain !== g.id) {
      throw new Error(`Kode ${k} dipakai dua grup topik (${lain} dan ${g.id}). Perpanjang kodenya.`)
    }
    lihat.set(k, g.id)
  }
}

export function bangunIndeks(grup: GrupTopik[], peta: Pemetaan[]): IndeksTopik {
  periksaKode(grup)
  const perKode = new Map(grup.map(g => [kodeTopik(g.id), g]))
  const perNama = new Map<string, GrupTopik[]>()
  for (const g of grup) {
    const k = [normalisasi(g.subjects?.name), normalisasi(g.grade_level), normalisasi(g.topic)].join('|')
    perNama.set(k, [...(perNama.get(k) ?? []), g])
  }
  return {
    perKode,
    perNama,
    peta: new Map(peta.map(p => [normalisasi(p.jalur), p.kode.toLowerCase()])),
  }
}

/** Jalur lengkap: [Mapel, Kelas, Topik, ...subfolder]. */
export function cocokkan(jalur: string[], indeks: IndeksTopik): HasilCocok {
  const kode = bacaKode(jalur)
  if (kode) {
    const grup = indeks.perKode.get(kode)
    return grup ? { status: 'cocok', grup, cara: 'kode' } : { status: 'kode-tak-dikenal', kode }
  }

  const dariPeta = indeks.peta.get(normalisasi(kunciJalur(jalur)))
  if (dariPeta) {
    const grup = indeks.perKode.get(dariPeta)
    return grup ? { status: 'cocok', grup, cara: 'peta' } : { status: 'peta-tak-dikenal', kode: dariPeta }
  }

  const [mapel, kelas, ...sisa] = jalur.map(tanpaKode)
  // Topiknya folder ketiga; berkas di bawah subfolder tambahan (mis. "TKA Kelas 6")
  // dicoba juga dengan folder paling dalamnya.
  for (const t of [sisa[0], sisa.at(-1)].filter((x): x is string => !!x)) {
    const calon = indeks.perNama.get([normalisasi(mapel), normalisasi(kelasDari(kelas ?? '')), normalisasi(t)].join('|')) ?? []
    if (calon.length === 1) return { status: 'cocok', grup: calon[0], cara: 'nama' }
    if (calon.length > 1) return { status: 'ambigu', calon }
  }
  return { status: 'tak-ada' }
}

/** Kemiripan kata, hanya untuk MENYARANKAN di laporan — tidak pernah dipakai mendaftarkan. */
export function kemiripan(a: string, b: string): number {
  const ta = new Set(normalisasi(a).split(' ').filter(w => w.length > 2))
  const tb = new Set(normalisasi(b).split(' ').filter(w => w.length > 2))
  const irisan = [...ta].filter(x => tb.has(x)).length
  return irisan / (ta.size + tb.size - irisan || 1)
}
