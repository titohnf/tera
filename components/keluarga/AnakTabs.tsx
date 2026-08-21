'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Bilah pemilih anak di puncak portal keluarga.
 *
 * Menggantikan halaman daftar anak yang berdiri sendiri: memilih anak bukan
 * tujuan, ia cuma saklar yang dipakai berkali-kali dalam satu kunjungan.
 * Menaruhnya sebagai layar tersendiri berarti orang tua beranak dua harus
 * kembali ke daftar setiap kali ingin membandingkan sesuatu.
 *
 * Berpindah anak MEMPERTAHANKAN halaman yang sedang dibuka: dari Tagihan anak
 * pertama, ketukan di tab kedua mendarat di Tagihan anak kedua, bukan di
 * berandanya. Itulah pertanyaan yang sebenarnya sedang dijawab orang tua saat
 * mereka berpindah — "kalau yang ini bagaimana?".
 *
 * Query string sengaja dibuang: `?month=2026-07` masih masuk akal untuk anak
 * lain, tapi id sesi atau tagihan di query tidak, dan yang aman untuk semua
 * kasus adalah membuka halaman itu dalam keadaan awalnya.
 *
 * Tidak dirender sama sekali untuk keluarga beranak satu — 20 dari 23 keluarga
 * — dan `app/keluarga/[studentId]/layout.tsx` yang memutuskannya.
 */
export default function AnakTabs({
  anak,
  aktif,
}: {
  anak: { id: string; full_name: string }[]
  aktif: string
}) {
  const pathname = usePathname()
  const awalan = `/keluarga/${aktif}`
  const sisa = pathname.startsWith(awalan) ? pathname.slice(awalan.length) : ''

  return (
    <nav
      aria-label="Pilih anak"
      className="sticky top-0 z-30 bg-white border-b border-gray-200 overflow-x-auto"
    >
      <div className="max-w-5xl mx-auto flex">
        {anak.map((a) => {
          const ini = a.id === aktif
          return (
            <Link
              key={a.id}
              href={`/keluarga/${a.id}${sisa}`}
              aria-current={ini ? 'page' : undefined}
              className={`flex-1 min-w-[8rem] text-center whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                ini
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {a.full_name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
