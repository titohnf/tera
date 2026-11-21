/**
 * Keterangan sebuah paket try out untuk ditampilkan: jenjang, kelas, mata pelajaran,
 * dan jadwal. Disimpan di `quizzes.settings` (`jenjang`, `kelas`, `mapel`) dan, untuk paket
 * lama yang belum memilikinya, dibaca dari judul ("Try Out TKA Matematika SMP Kelas 9").
 */
export const URUTAN_JENJANG = ['SD', 'SMP', 'SMA'] as const

export interface InfoPaket {
  jenjang: string
  kelas: string | null
  mapel: string
  menit: number | null
  bukaPada: string | null
  tutupPada: string | null
}

type Settings = Record<string, unknown> | null | undefined

export function infoPaket(judul: string, settings: Settings): InfoPaket {
  const s = settings ?? {}
  const m = judul.match(/^(?:Try ?Out\s+)?(?:TKA\s+)?(.+?)\s+(SD|SMP|SMA)(?:\s+Kelas\s+(\d+))?\s*$/i)
  const teks = (k: string) => (typeof s[k] === 'string' && (s[k] as string).trim() ? (s[k] as string).trim() : null)
  return {
    jenjang: (teks('jenjang') ?? m?.[2] ?? 'Lainnya').toUpperCase(),
    kelas: teks('kelas') ?? m?.[3] ?? null,
    mapel: teks('mapel') ?? m?.[1] ?? judul,
    menit: typeof s.time_limit_minutes === 'number' ? s.time_limit_minutes : null,
    bukaPada: teks('opens_at'),
    tutupPada: teks('closes_at'),
  }
}

export function urutJenjang(j: string): number {
  const i = (URUTAN_JENJANG as readonly string[]).indexOf(j)
  return i === -1 ? 99 : i
}

/** Matematika dulu, lalu Bahasa Indonesia, lalu sisanya menurut abjad. */
export function urutMapel(m: string): number {
  const x = m.toLowerCase()
  if (x.includes('matematika')) return 0
  if (x.includes('indonesia')) return 1
  return 2
}

const ZONA = 'Asia/Jakarta'

/** "10.00" (WIB). */
export function jamWib(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: ZONA })
}

/** "Minggu, 22 November" (WIB). */
export function hariWib(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA })
}

export const tanggalWib = (iso: string | number | Date) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: ZONA })

/** Nilai untuk <input type="datetime-local"> dalam WIB, atau ''. */
export function keInputWib(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const t = d.toLocaleDateString('en-CA', { timeZone: ZONA })
  const j = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: ZONA })
  return `${t}T${j}`
}
