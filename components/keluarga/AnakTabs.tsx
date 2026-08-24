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
 *
 * Yang tertulis di tab adalah nama panggilan, bukan nama lengkap: tiga nama
 * lengkap tidak muat dalam satu baris selebar 390px, dan yang ketiga hanya
 * ketahuan ada kalau bilahnya digeser mendatar — gerakan yang jarang ditemukan
 * sendiri. Aturan panggilan-atau-kata-pertama ada di `lib/nama`, sama dengan
 * yang dipakai pesan harian WhatsApp.
 */
export default function AnakTabs({
  anak,
  aktif,
}: {
  anak: { id: string; full_name: string; nama_pendek: string }[]
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
              {/* Nama lengkapnya tetap terbaca alat bantu layar dan tooltip:
                  dua anak berpanggilan mirip tidak boleh jadi tebak-tebakan. */}
              <span title={a.full_name}>{a.nama_pendek}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
