import Link from 'next/link'

/**
 * Komponen dasar bahasa desain Tera Siswa (lihat `docs/desain-siswa.md`).
 * Server-aman: tanpa state, tanpa 'use client'.
 */

/** Kartu: garis 2px dengan tepi bawah 4px. Tanpa bayangan lembut, gradien, atau hiasan. */
export const KARTU = 'rounded-2xl border-2 border-b-4 border-slate-200 border-b-slate-300 bg-white'

/** Kartu yang bisa diketuk: turun 2px dan tebingnya menipis saat ditekan. */
export const KARTU_TEKAN = `${KARTU} transition active:translate-y-0.5 active:border-b-2`

const VARIAN = {
  /** Aksi utama di latar terang. */
  biru: { kelas: 'bg-tera text-white', tebing: '#0048b8' },
  /** Aksi di atas kartu berwarna; `tebing` mengikuti warna tua kartunya. */
  putih: { kelas: 'bg-white text-slate-900', tebing: 'rgba(15,23,42,0.28)' },
} as const

/**
 * Tombol bertebing — HANYA untuk aksi utama satu layar. Tanpa `href` ia sebuah
 * `<span>`, untuk tombol yang tinggal di dalam kartu yang sudah berupa tautan.
 */
export function TombolTebing({
  href,
  varian = 'biru',
  tebing,
  kelas = '',
  children,
}: {
  href?: string
  varian?: keyof typeof VARIAN
  /** Menimpa warna tebing, mis. warna tua kartu mapel. */
  tebing?: string
  kelas?: string
  children: React.ReactNode
}) {
  const v = VARIAN[varian]
  const gaya = { ['--tebing' as string]: tebing ?? v.tebing } as React.CSSProperties
  const dasar = `tebing flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3.5 text-base font-extrabold ${v.kelas} ${kelas}`
  return href ? (
    <Link href={href} className={dasar} style={gaya}>
      {children}
    </Link>
  ) : (
    <span className={dasar} style={gaya}>
      {children}
    </span>
  )
}

/** Pita kemajuan. Isinya emas karena emas berarti "tuntas" di seluruh aplikasi. */
export function PitaKemajuan({ persen, pada = 'terang' }: { persen: number; pada?: 'terang' | 'warna' }) {
  const p = Math.max(0, Math.min(100, persen))
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full ${pada === 'warna' ? 'bg-black/20' : 'bg-slate-200'}`}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-amber-300" style={{ width: `${p}%` }} />
    </div>
  )
}
