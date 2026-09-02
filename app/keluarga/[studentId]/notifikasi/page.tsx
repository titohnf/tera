import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { notifikasiAnak } from '@/lib/keluarga-notifikasi'
import NotifikasiList from '@/components/keluarga/NotifikasiList'

/**
 * Notifikasi keluarga.
 *
 * Isinya dirakit dari kejadian yang sudah tercatat — sesi batal, sesi baru,
 * tagihan terbit, tagihan jatuh tempo, catatan laporan — bukan dari tabel
 * notifikasi tersendiri. Aturannya, dan yang sengaja ditinggalkan, ada di
 * `lib/keluarga-notifikasi`.
 *
 * Kalau tidak ada apa-apa, layar ini mengatakannya terus terang. Menampilkan
 * daftar contoh atau angka lencana palsu akan mengajari orang tua bahwa lonceng
 * ini boleh diabaikan — kebiasaan yang mahal untuk diperbaiki nanti.
 */
export default async function NotifikasiAnak({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const { items, sekarang } = await notifikasiAnak(studentId)

  return (
    <div className="space-y-5">
      {/* Judulnya ada di bilah atas (`HeaderKeluarga`), tidak diulang di sini. */}
      {items.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-kartu">
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
      ) : (
        <>
          <div className="rounded-xl bg-white shadow-kartu overflow-hidden">
            <NotifikasiList items={items} sekarangIso={sekarang} />
          </div>
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            Kabar dari 30 hari terakhir. Untuk yang lebih lama, buka Jadwal atau Tagihan.
          </p>
        </>
      )}
    </div>
  )
}
