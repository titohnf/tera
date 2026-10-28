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
 *   2. PETA keputusan manual (`lib/materi-pemetaan.json`) — jalur folder yang
 *      pernah diputuskan seseorang, berlaku juga untuk subfoldernya. Berkas baru
 *      di folder yang sama ikut terdaftar tanpa ditanya lagi. Folder bernama
 *      `Ringkasan` di bawah kelas adalah aturan tetap: tujuannya satu topik
 *      Review yang ditentukan admin per mapel dan kelas.
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

  // Peta berlaku untuk folder yang dipetakan DAN semua subfolder di dalamnya:
  // dicoba dari jalur terpanjang ke terpendek, jadi entri yang lebih spesifik
  // menang atas yang lebih umum.
  let dariPeta: string | undefined
  for (let n = jalur.length; n >= 2 && !dariPeta; n--) {
    dariPeta = indeks.peta.get(normalisasi(kunciJalur(jalur.slice(0, n))))
  }
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

// ════════════════════════════════════════════════════════════════════════════
// Menjalankan pemetaan: baca Drive, daftarkan ke katalog, tandai siap dibaca.
//
// Satu modul dipakai tiga pemanggil — skrip CLI, tombol "Sinkronkan sekarang" di
// halaman admin, dan tugas harian — supaya aturannya tidak pernah menyimpang
// antara yang dijalankan tangan dan yang dijalankan mesin. Klien Drive dan
// database DISUNTIKKAN, bukan diimpor: pemanggilnya berbeda (kunci dari berkas,
// dari env aplikasi) dan modul ini tidak boleh peduli.
//
// Tidak ada yang menulis ke Drive, dan tidak ada yang dihapus dari katalog.
// ════════════════════════════════════════════════════════════════════════════

import type { drive_v3 } from 'googleapis'

/** Sengaja longgar: dua klien Supabase dengan generic berbeda (lihat lib/materi-sesi.ts). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = { from: (tabel: string) => any }

/** Folder bimbel di Drive — sama dengan scripts/rapikan-materi-drive.mjs. */
export const AKAR_BIMBEL = '1uYbssLlmPq1oaKKdTqWJBuSd63SRXs4v'

export type BerkasDrive = { id: string; name: string; mimeType: string; jalur: string[]; ids: string[] }

async function isiFolder(drive: drive_v3.Drive, id: string) {
  const out: drive_v3.Schema$File[] = []
  let token: string | undefined
  do {
    const r = await drive.files.list({
      q: `'${id}' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 200,
      pageToken: token,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })
    out.push(...(r.data.files ?? []))
    token = r.data.nextPageToken ?? undefined
  } while (token)
  return out
}

/**
 * Semua PDF di bawah "Materi Kurikulum", dengan jalur dan id folder tiap segmen.
 * Satu tingkat folder sekali jalan, banyak folder sekaligus: pohonnya ratusan
 * folder, dan menelusurinya satu per satu memakan beberapa menit.
 */
export async function ambilBerkasMateri(drive: drive_v3.Drive): Promise<BerkasDrive[]> {
  const akar = (await isiFolder(drive, AKAR_BIMBEL)).find(f => f.name === 'Materi Kurikulum')
  if (!akar?.id) throw new Error('Folder "Materi Kurikulum" tidak ditemukan di folder bimbel.')
  const berkas: BerkasDrive[] = []
  let tingkat = [{ id: akar.id, jalur: [] as string[], ids: [] as string[] }]
  while (tingkat.length) {
    const hasil: { f: (typeof tingkat)[number]; isi: drive_v3.Schema$File[] }[] = []
    for (let i = 0; i < tingkat.length; i += 8) {
      const potong = tingkat.slice(i, i + 8)
      const isi = await Promise.all(potong.map(f => isiFolder(drive, f.id)))
      potong.forEach((f, j) => hasil.push({ f, isi: isi[j] }))
    }
    tingkat = []
    for (const { f, isi } of hasil) {
      for (const x of isi) {
        if (!x.id || !x.name) continue
        if (x.mimeType === 'application/vnd.google-apps.folder') {
          tingkat.push({ id: x.id, jalur: [...f.jalur, x.name], ids: [...f.ids, x.id] })
        } else if (x.mimeType === 'application/pdf' || /\.pdf$/i.test(x.name)) {
          berkas.push({ id: x.id, name: x.name, mimeType: x.mimeType ?? '', jalur: f.jalur, ids: f.ids })
        }
      }
    }
  }
  return berkas
}

/** Sama dengan `extractDriveFileId()` di aplikasi; ditulis ulang agar modul ini berdiri sendiri. */
export function idBerkas(url: string | null | undefined): string | null {
  try {
    const u = new URL(url ?? '')
    if (!['docs.google.com', 'drive.google.com'].includes(u.hostname)) return null
    if (u.pathname.includes('/forms/d/e/')) return null
    return u.pathname.match(/\/d\/([a-zA-Z0-9_-]{15,})/)?.[1] ?? null
  } catch {
    return null
  }
}

const BISA_TAMPIL = new Set([
  'application/pdf',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
])

const NAMA_JENIS: Record<string, string> = {
  'application/vnd.google-apps.folder': 'folder Drive, bukan berkas',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
}

/** Bentuk yang benar-benar tampil di halaman, dan nama yang dikenali manusia untuk yang tidak. */
export function jenisBerkas(mime: string): { tampil: boolean; nama: string } {
  return { tampil: BISA_TAMPIL.has(mime), nama: NAMA_JENIS[mime] ?? (mime || 'jenis tak dikenal') }
}

async function paralel<T, R>(daftar: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const hasil: R[] = new Array(daftar.length)
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(n, daftar.length) }, async () => {
      while (i < daftar.length) {
        const k = i++
        hasil[k] = await fn(daftar[k])
      }
    }),
  )
  return hasil
}

export type HasilPindai = {
  total: number
  siap: number
  belum: { judul: string; sebab: string }[]
  menyala: number
  padam: number
  /** Gagal diperiksa karena kendala sementara — tandanya TIDAK diubah. */
  tidakPasti: number
}

/**
 * Menandai materi mana yang benar-benar bisa dibaca anak (`readable_at`, migrasi
 * 127): tautannya menunjuk berkas Drive, service account boleh membacanya, dan
 * bentuknya tampil di browser. Dua arah — yang berkasnya hilang atau izinnya
 * dicabut BERHENTI dijanjikan. Kegagalan sementara (jaringan, kuota) tidak
 * dianggap "tidak bisa dibaca": tandanya dibiarkan, dan dihitung terpisah.
 */
export async function pindaiMateri(opsi: { db: Db; drive: drive_v3.Drive; tulis: boolean }): Promise<HasilPindai> {
  const { db, drive, tulis } = opsi
  const { data, error } = await db.from('curriculum_resources').select('id, title, link_url, readable_at').eq('kind', 'materi')
  if (error) throw new Error(`Gagal membaca katalog materi: ${error.message}`)
  const materi = (data ?? []) as { id: string; title: string; link_url: string; readable_at: string | null }[]

  type Putusan = { r: (typeof materi)[number]; siap: boolean; sebab?: string; pasti: boolean }
  const putusan = await paralel(materi, 8, async (r): Promise<Putusan> => {
    const fileId = idBerkas(r.link_url)
    if (!fileId) return { r, siap: false, sebab: 'bukan tautan berkas Drive', pasti: true }
    try {
      const { data: meta } = await drive.files.get({ fileId, fields: 'mimeType, name, trashed', supportsAllDrives: true })
      if (meta.trashed) return { r, siap: false, sebab: 'ada di Sampah Drive', pasti: true }
      const j = jenisBerkas(meta.mimeType ?? '')
      return j.tampil
        ? { r, siap: true, pasti: true }
        : { r, siap: false, sebab: `${j.nama} — akan terunduh, bukan tampil di halaman`, pasti: true }
    } catch (e) {
      const kode = (e as { code?: number }).code
      if (kode === 404) return { r, siap: false, sebab: 'berkasnya tidak ada', pasti: true }
      if (kode === 403) return { r, siap: false, sebab: 'service account tidak boleh membaca', pasti: true }
      return { r, siap: false, sebab: 'gagal diperiksa', pasti: false }
    }
  })

  const siap = putusan.filter(p => p.siap)
  const belum = putusan.filter(p => !p.siap && p.pasti)
  const nyala = siap.filter(p => !p.r.readable_at)
  const padam = belum.filter(p => p.r.readable_at)

  if (tulis) {
    const stempel = new Date().toISOString()
    const tandai = async (ids: string[], nilai: string | null) => {
      for (let i = 0; i < ids.length; i += 100) {
        const { error: e } = await db.from('curriculum_resources').update({ readable_at: nilai }).in('id', ids.slice(i, i + 100))
        if (e) throw new Error(`Gagal menandai materi: ${e.message}`)
      }
    }
    await tandai(siap.map(p => p.r.id), stempel)
    await tandai(padam.map(p => p.r.id), null)
  }

  return {
    total: materi.length,
    siap: siap.length,
    belum: belum.map(p => ({ judul: p.r.title, sebab: p.sebab ?? '' })),
    menyala: nyala.length,
    padam: padam.length,
    tidakPasti: putusan.filter(p => !p.pasti).length,
  }
}

export type HasilSinkron = {
  tulis: boolean
  berkasDrive: number
  sudahTerdaftar: number
  /** Yang akan (atau sudah, bila `tulis`) didaftarkan. */
  baru: { judul: string; topik: string; cara: CaraCocok }[]
  ambigu: { jalur: string; calon: string[] }[]
  kodeAsing: { jalur: string; kode: string }[]
  /** Satu baris per FOLDER: yang perlu diputuskan folder-nya, bukan tiap berkas. */
  tanpaCocok: { jalur: string; berkas: number; saran: string | null }[]
  /** Materi terdaftar yang berkasnya tidak lagi ada di Materi Kurikulum. Hanya dilaporkan. */
  hilang: string[]
  /** Folder topik yang cocok — dipakai CLI untuk `--beri-kode`. */
  folderCocok: { id: string; jalur: string[]; nama: string; kode: string }[]
  pindai: HasilPindai
}

/**
 * Menyamakan katalog materi dengan folder "Materi Kurikulum": daftarkan yang
 * cocok (kode → peta → nama persis, lihat `cocokkan`), lalu pindai ulang
 * keterbacaannya. Aman diulang — berkas yang file id-nya sudah ada dilewati.
 */
export async function sinkronkanMateri(opsi: {
  db: Db
  drive: drive_v3.Drive
  peta: Pemetaan[]
  tulis: boolean
}): Promise<HasilSinkron> {
  const { db, drive, peta, tulis } = opsi
  const { data: grupData, error: eGrup } = await db
    .from('curriculum_topic_groups')
    .select('id, curriculum, subject_id, grade_level, semester, theme, topic, subjects(name)')
  if (eGrup) throw new Error(`Gagal membaca grup topik: ${eGrup.message}`)
  const grup = (grupData ?? []) as GrupTopik[]
  const indeks = bangunIndeks(grup, peta)

  const berkas = await ambilBerkasMateri(drive)
  const { data: katalogData } = await db.from('curriculum_resources').select('id, kind, title, link_url')
  const katalog = (katalogData ?? []) as { id: string; kind: string; title: string; link_url: string | null }[]
  const idDalam = (u: string | null) => u?.match(/[-\w]{25,}/g) ?? []
  const terdaftar = new Set(katalog.flatMap(r => idDalam(r.link_url)))

  const baru: { b: BerkasDrive; g: GrupTopik; cara: CaraCocok }[] = []
  const ambigu: HasilSinkron['ambigu'] = []
  const kodeAsing: HasilSinkron['kodeAsing'] = []
  const sisa: BerkasDrive[] = []
  const folderCocok = new Map<string, HasilSinkron['folderCocok'][number]>()
  let sudah = 0

  for (const b of berkas) {
    const h = cocokkan(b.jalur, indeks)
    if (h.status === 'cocok' && b.ids[2] && !folderCocok.has(b.ids[2])) {
      folderCocok.set(b.ids[2], { id: b.ids[2], jalur: b.jalur.slice(0, 3), nama: b.jalur[2], kode: kodeTopik(h.grup.id) })
    }
    if (terdaftar.has(b.id)) { sudah++; continue }
    if (h.status === 'cocok') baru.push({ b, g: h.grup, cara: h.cara })
    else if (h.status === 'ambigu') ambigu.push({ jalur: b.jalur.join(' / '), calon: h.calon.map(c => `${kodeTopik(c.id)} ${c.theme}`) })
    else if (h.status === 'tak-ada') sisa.push(b)
    else kodeAsing.push({ jalur: b.jalur.join(' / '), kode: h.kode })
  }

  if (tulis && baru.length) {
    const baris = baru.map(({ b, g }) => ({
      subject_id: g.subject_id,
      curriculum: g.curriculum,
      grade_level: g.grade_level,
      semester: g.semester,
      theme: g.theme,
      topic: g.topic,
      group_id: g.id,
      kind: 'materi',
      title: judulDariNama(b.name),
      link_url: `https://drive.google.com/file/d/${b.id}/view`,
    }))
    for (let i = 0; i < baris.length; i += 25) {
      const { error } = await db.from('curriculum_resources').insert(baris.slice(i, i + 25))
      if (error) throw new Error(`Gagal mendaftarkan materi (paket mulai ${i}): ${error.message}`)
    }
  }

  const perFolder = new Map<string, BerkasDrive[]>()
  for (const b of sisa) {
    const k = kunciJalur(b.jalur)
    perFolder.set(k, [...(perFolder.get(k) ?? []), b])
  }
  const tanpaCocok = [...perFolder].map(([jalur, daftar]) => {
    const [mapel, kelas, ...sisaJalur] = jalur.split('/')
    const topik = sisaJalur.at(-1) ?? ''
    const kolam = grup.filter(g => g.subjects?.name === mapel && g.grade_level === (kelas?.match(/Kelas\s+\d+/i)?.[0] ?? kelas))
    const terdekat = kolam.map(g => ({ g, s: kemiripan(g.topic, topik) })).sort((x, y) => y.s - x.s)[0]
    return {
      jalur,
      berkas: daftar.length,
      saran: terdekat ? `${kodeTopik(terdekat.g.id)} (${terdekat.s.toFixed(2)}): ${terdekat.g.theme} / ${terdekat.g.topic}` : null,
    }
  })

  const idDiDrive = new Set(berkas.map(b => b.id))
  const hilang = katalog
    .filter(r => r.kind === 'materi' && idDalam(r.link_url).length && !idDalam(r.link_url).some(i => idDiDrive.has(i)))
    .map(r => r.title)

  // Pindai SESUDAH mendaftarkan, supaya baris baru langsung ditandai siap dibaca.
  const pindai = await pindaiMateri({ db, drive, tulis })

  return {
    tulis,
    berkasDrive: berkas.length,
    sudahTerdaftar: sudah,
    baru: baru.map(({ b, g, cara }) => ({ judul: judulDariNama(b.name), topik: `${g.theme} / ${g.topic}`, cara })),
    ambigu,
    kodeAsing,
    tanpaCocok,
    hilang,
    folderCocok: [...folderCocok.values()],
    pindai,
  }
}
