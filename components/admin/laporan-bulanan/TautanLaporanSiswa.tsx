import Link from 'next/link'

/**
 * Pintasan antar tiga menu Laporan Belajar untuk SISWA YANG SAMA.
 *
 * Tiap menu menyimpan siswa terpilihnya di `?student_id=`, jadi berpindah menu
 * dulu berarti mencari ulang nama yang sama. Di sini `student_id` dibawa.
 *
 * Progres Kelas hanya untuk siswa bimbel: ia membaca kehadiran dan nilai kelas,
 * dan pelanggan langganan (role `mandiri`) tidak punya keduanya, jadi tautannya
 * tidak ditampilkan untuk mereka.
 */
export type MenuLaporan = 'kelas' | 'mandiri' | 'misi'

export default function TautanLaporanSiswa({
  studentId,
  aktif,
  bimbel,
  bulan,
}: {
  studentId: string
  aktif: MenuLaporan
  /** Siswa bimbel (bukan pelanggan langganan). */
  bimbel: boolean
  /** Bulan Progres Kelas yang dibawa (YYYY-MM); kosong = bulan berjalan. */
  bulan?: string
}) {
  const menu: { kunci: MenuLaporan; label: string; href: string; tampil: boolean }[] = [
    {
      kunci: 'kelas',
      label: 'Progres Kelas',
      href: `/admin/laporan-bulanan?student_id=${studentId}${bulan ? `&month=${bulan}` : ''}`,
      tampil: bimbel,
    },
    { kunci: 'mandiri', label: 'Latihan Mandiri', href: `/admin/rekap-penguasaan?student_id=${studentId}`, tampil: true },
    { kunci: 'misi', label: 'Ketuntasan Materi', href: `/admin/misi?student_id=${studentId}`, tampil: true },
  ]

  return (
    <nav aria-label="Laporan belajar siswa ini" className="flex flex-wrap gap-1.5">
      {menu
        .filter(m => m.tampil)
        .map(m =>
          m.kunci === aktif ? (
            <span
              key={m.kunci}
              aria-current="page"
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
            >
              {m.label}
            </span>
          ) : (
            <Link
              key={m.kunci}
              href={m.href}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-slate-50 hover:text-gray-900"
            >
              {m.label}
            </Link>
          ),
        )}
    </nav>
  )
}
