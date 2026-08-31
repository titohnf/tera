import Link from 'next/link'
import { anakOrRedirect } from '@/lib/keluarga'
import { getLaporanBulananData } from '@/lib/reports/laporan-bulanan'
import LaporanBulananView from '@/components/laporan/LaporanBulananView'
import { createClient } from '@/lib/supabase/server'
import { bulanIni } from '@/lib/waktu'

/**
 * Laporan bulanan yang dilihat keluarga — laporan yang SAMA dengan yang dibuka
 * admin, bukan ringkasannya.
 *
 * Sebelumnya halaman ini hanya membaca tiga kolom `monthly_report_notes`
 * (`mastered`, `needs_practice`, `other_notes`), sementara admin membuka rekap
 * penuh: kehadiran, materi per sesi, nilai asesmen, dan catatan tutor. Dua menu
 * bernama sama dengan isi berbeda — dan yang membandingkannya adalah orang tua
 * yang menelepon menanyakan laporan yang katanya sudah dikirim.
 *
 * Bulannya mengikuti jendela enam bulan yang sama dengan halaman admin, BUKAN
 * hanya bulan yang punya baris `monthly_report_notes`. Pembatasan itu sempat
 * saya pasang dengan alasan "biar yang belum diperiksa tidak terbaca", dan
 * hasilnya justru kebalikan dari tujuan halaman ini: tabel itu masih kosong
 * untuk semua murid, jadi orang tua melihat "belum ada laporan" sementara admin
 * membuka rekap penuh untuk bulan yang sama.
 *
 * Rekap ini memang bukan tulisan yang dikarang: kehadiran, materi, dan nilai
 * adalah catatan yang sudah terjadi. Yang perlu ditulis admin cuma "Catatan
 * Tambahan", dan bagian itu memang tampil kosong sampai diisi.
 */
export default async function LaporanAnak({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { studentId } = await params
  const { month } = await searchParams
  await anakOrRedirect(studentId)
  const supabase = await createClient()

  const sekarang = await bulanIni()
  const bulanOpsi = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(sekarang.tahun, sekarang.bulan - 1 - i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  })

  const bulanDipilih = bulanOpsi.includes(month ?? '') ? (month as string) : bulanOpsi[0]

  const { data: catatanRow } = await supabase
    .from('monthly_report_notes')
    .select('mastered, needs_practice, other_notes')
    .eq('student_id', studentId)
    .eq('month', bulanDipilih)
    .maybeSingle()

  const report = await getLaporanBulananData(studentId, bulanDipilih)

  const namaBulan = (m: string) => {
    const [y, mo] = m.split('-').map(Number)
    return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }

  const bagian = [
    { key: 'mastered' as const, judul: 'Sudah dikuasai' },
    { key: 'needs_practice' as const, judul: 'Masih perlu latihan' },
    { key: 'other_notes' as const, judul: 'Catatan lain' },
  ]

  return (
    <div className="space-y-6">
      {/* Judul dan panah kembalinya ada di bilah atas (`HeaderKeluarga`).
          Barisnya sendiri hanya lahir kalau ada yang bisa diunduh — pembungkus
          kosong tetap memakan satu jarak `space-y-6` di puncak halaman. */}
      {report && (
        <div className="flex justify-end">
          <a
            href={`/api/laporan-bulanan/${studentId}/pdf?month=${bulanDipilih}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Unduh PDF
          </a>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {bulanOpsi.map((b) => (
          <Link
            key={b}
            href={`/keluarga/${studentId}/laporan?month=${b}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ${
              b === bulanDipilih
                ? 'bg-blue-600 text-white ring-blue-600'
                : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {namaBulan(b)}
          </Link>
        ))}
      </div>

      {!report ? (
        <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow-kartu">
          Belum ada data untuk bulan ini.
        </p>
      ) : (
        <LaporanBulananView
          report={report}
          catatanTambahan={
            <div className="space-y-3">
              {bagian.map((s) => {
                const isi = catatanRow?.[s.key] as string | null
                if (!isi) return null
                return (
                  <div key={s.key}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      {s.judul}
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{isi}</p>
                  </div>
                )
              })}
              {bagian.every((s) => !catatanRow?.[s.key]) && (
                <p className="text-sm text-gray-400">Belum ada catatan tambahan untuk bulan ini.</p>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
