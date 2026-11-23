'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { GAYA_KEMBALI, JudulBilah, KELAS_BILAH, PanahKiri } from './BilahJudul'

/** Judul layar dari segmen rute di bawah beranda rangka. */
function judulLayar(segmen: string[]): string {
  const [utama, ...sisa] = segmen
  switch (utama) {
    case 'misi':
      return 'Misi'
    case 'materi':
      return 'Materi'
    case 'tryout':
      return sisa.length > 0 ? 'Pembahasan' : 'Try Out'
    case 'akun':
      return 'Akun'
    case 'langganan':
      return 'Langganan'
    default:
      return 'Tera'
  }
}

/**
 * Bilah atas rangka siswa/pelanggan/umum.
 *
 * Di beranda: `beranda` (header berlogo, dirender server oleh layout). Di layar
 * lain: bilah judul berpanah kembali, sama bentuknya dengan header permukaan
 * belajar — pengganti remah roti yang di ponsel memakan baris dan sulit
 * disentuh. Judul dan tujuan kembali dihitung dari alamat (sinkron, tanpa
 * kedipan): kembali selalu satu tingkat ke atas, kecuali di layar Misi yang
 * mapelnya sudah dipilih (`?mapel=`), yang kembali ke pilihan mapel.
 */
export default function BilahAtas({
  dasar,
  beranda,
  akar = {},
}: {
  dasar: string
  beranda: React.ReactNode
  /** Tab di bilah bawah (segmen rute → judul): berjudul tanpa panah kembali. */
  akar?: Record<string, string>
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const sisa = pathname.startsWith(dasar) ? pathname.slice(dasar.length).split('/').filter(Boolean) : []
  if (sisa.length === 0) return <>{beranda}</>
  if (sisa.length === 1 && akar[sisa[0]]) {
    return (
      <header className={KELAS_BILAH}>
        <JudulBilah>{akar[sisa[0]]}</JudulBilah>
      </header>
    )
  }

  const induk =
    sisa.length === 1 && params.get('mapel') ? pathname : `${dasar}${sisa.length > 1 ? '/' + sisa.slice(0, -1).join('/') : ''}`
  return (
    <header className={KELAS_BILAH}>
      <Link href={induk} aria-label="Kembali" className={GAYA_KEMBALI}>
        <PanahKiri />
      </Link>
      <JudulBilah>{judulLayar(sisa)}</JudulBilah>
    </header>
  )
}
