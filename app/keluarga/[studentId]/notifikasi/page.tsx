import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'

/**
 * Notifikasi keluarga — masih kosong, dan mengatakannya terus terang.
 *
 * Tempatnya sudah ada di bilah navigasi bawah, isinya belum. Yang mengisi nanti
 * bukan tabel notifikasi baru melainkan kejadian yang sudah tercatat di
 * database: sesi dibatalkan atau dijadwal ulang (`sessions.status`,
 * `session_change_requests`), tagihan terbit dan mendekati jatuh tempo
 * (`invoices.issued_at`, `due_date`), dan laporan bulanan yang baru terbit.
 * `lib/notifications.ts` sudah melakukan hal serupa untuk tutor dan admin, tapi
 * ia memakai `createAdminClient()` — jalur keluarga tidak boleh menumpang itu
 * (lihat alasannya di `keluargaContext`), jadi versinya harus ditulis ulang di
 * atas klien ber-RLS.
 *
 * Sampai itu ada, layar ini tidak berpura-pura punya isi. Menampilkan daftar
 * contoh atau angka lencana palsu akan mengajari orang tua bahwa lonceng ini
 * boleh diabaikan — kebiasaan yang mahal untuk diperbaiki nanti.
 */
export default async function NotifikasiAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Notifikasi</h1>

      <div className="rounded-xl bg-white p-8 text-center shadow ring-1 ring-gray-900/5">
        <svg
          className="w-10 h-10 mx-auto text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <p className="text-sm text-gray-500 mt-3">Belum ada notifikasi.</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Perubahan jadwal dan tagihan baru akan muncul di sini.
        </p>
        <Link
          href={`/keluarga/${studentId}/jadwal`}
          className="inline-block mt-4 text-sm font-medium text-blue-600"
        >
          Lihat jadwal →
        </Link>
      </div>
    </div>
  )
}
