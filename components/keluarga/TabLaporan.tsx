import Link from 'next/link'

/**
 * Bilah tab halaman Laporan keluarga: "Aktivitas Kelas" dan "Kompetensi".
 *
 * Kedua tab adalah LAYAR TERPISAH — `/laporan` untuk Aktivitas Kelas,
 * `/penguasaan` untuk Kompetensi — yang disatukan di mata pembaca oleh bilah
 * ini. Memilih tab berarti berpindah alamat, dan dengan begitu:
 *
 * - tiap tab tetap halaman server dengan kuerinya sendiri, dan isi yang tidak
 *   sedang dibuka tidak pernah dibayar dengan jaringan yang tidak terlihat;
 * - tab yang aktif punya alamat yang bisa dibagikan dan dibuka ulang;
 * - pemilihan bulan di tab Aktivitas (`?month=`) tetap hidup di alamat, tanpa
 *   keadaan ganda yang harus dijaga berdua antara peramban dan server.
 *
 * Dulu Laporan dan Penguasaan adalah dua menu terpisah di beranda. Menyatukan
 * keduanya di bawah satu menu "Laporan" berarti menaruh bilah ini di puncak
 * kedua layar, dan menautkannya dengan tautan alih-alih keadaan lokal — pola
 * yang sama dengan `SiswaTabs` di portal admin.
 */
export default function TabLaporan({
  studentId,
  aktif,
}: {
  studentId: string
  aktif: 'aktivitas' | 'kompetensi'
}) {
  const tab = [
    { key: 'aktivitas' as const, label: 'Aktivitas Kelas' },
    { key: 'kompetensi' as const, label: 'Kompetensi' },
  ]

  return (
    <div className="flex border-b border-slate-100 overflow-x-auto">
      {tab.map((t) => (
        <Link
          key={t.key}
          href={
            t.key === 'aktivitas'
              ? `/keluarga/${studentId}/laporan`
              : `/keluarga/${studentId}/penguasaan`
          }
          className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            aktif === t.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}
