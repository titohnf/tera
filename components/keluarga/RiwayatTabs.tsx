import Link from 'next/link'

/**
 * Dua halaman di bawah "Riwayat": Jadwal Kelas dan Laporan.
 *
 * Bilah navigasi bawah cuma punya empat tempat, dan keduanya menjawab
 * pertanyaan yang sama — "apa yang sudah terjadi" — jadi keduanya berbagi satu
 * tempat di sana dan dipisahkan di sini.
 *
 * Sengaja bukan komponen klien: yang sedang aktif sudah diketahui oleh halaman
 * yang merendernya, jadi tidak ada gunanya mengirim `usePathname` ke browser
 * untuk menghitung ulang hal yang sama.
 */
export default function RiwayatTabs({
  studentId,
  aktif,
}: {
  studentId: string
  aktif: 'jadwal' | 'laporan'
}) {
  const tabs = [
    { key: 'jadwal', label: 'Jadwal Kelas', href: `/keluarga/${studentId}/jadwal` },
    { key: 'laporan', label: 'Laporan', href: `/keluarga/${studentId}/laporan` },
  ]

  return (
    <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1">
      {tabs.map((t) => {
        const ini = t.key === aktif
        return (
          <Link
            key={t.key}
            href={t.href}
            aria-current={ini ? 'page' : undefined}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
              ini ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
