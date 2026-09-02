import Link from 'next/link'

/**
 * Bilah tab halaman Laporan keluarga: "Progres Kelas", "Latihan Mandiri", dan
 * "Ketuntasan Materi".
 *
 * Ketiga tab adalah LAYAR TERPISAH — `/laporan` untuk Progres Kelas,
 * `/penguasaan` untuk Latihan Mandiri, dan `/ketuntasan` untuk Ketuntasan
 * Materi — yang disatukan di mata pembaca oleh bilah ini. Memilih tab berarti
 * berpindah alamat, dan dengan begitu:
 *
 * - tiap tab tetap halaman server dengan kuerinya sendiri, dan isi yang tidak
 *   sedang dibuka tidak pernah dibayar dengan jaringan yang tidak terlihat;
 * - tab yang aktif punya alamat yang bisa dibagikan dan dibuka ulang;
 * - pemilihan bulan di tab Progres Kelas (`?month=`) tetap hidup di alamat, tanpa
 *   keadaan ganda yang harus dijaga berdua antara peramban dan server.
 *
 * Dulu Laporan dan Penguasaan adalah dua menu terpisah di beranda. Menyatukan
 * keduanya di bawah satu menu "Laporan" berarti menaruh bilah ini di puncak
 * kedua layar, dan menautkannya dengan tautan alih-alih keadaan lokal — pola
 * yang sama dengan `SiswaTabs` di portal admin. Ketuntasan Materi (seksi Misi
 * yang pindah ke tabnya sendiri) ikut menumpang bilah yang sama.
 */
export default function TabLaporan({
  studentId,
  aktif,
}: {
  studentId: string
  aktif: 'aktivitas' | 'kompetensi' | 'ketuntasan'
}) {
  // Kuncinya mengikuti nama rutenya, labelnya mengikuti kata yang dipakai
  // orang tua. Keduanya sengaja tidak dipaksa sama: mengganti tulisan di layar
  // tidak boleh menuntut tiga halaman ikut mengganti nilai `aktif`-nya.
  const tab = [
    { key: 'aktivitas' as const, label: 'Progres Kelas' },
    { key: 'kompetensi' as const, label: 'Latihan Mandiri' },
    { key: 'ketuntasan' as const, label: 'Ketuntasan Materi' },
  ]

  const tujuan: Record<(typeof tab)[number]['key'], string> = {
    aktivitas: `/keluarga/${studentId}/laporan`,
    kompetensi: `/keluarga/${studentId}/penguasaan`,
    ketuntasan: `/keluarga/${studentId}/ketuntasan`,
  }

  return (
    <div className="flex border-b border-slate-100 overflow-x-auto">
      {tab.map((t) => (
        <Link
          key={t.key}
          href={tujuan[t.key]}
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
