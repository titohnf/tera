import { anakOrRedirect } from '@/lib/keluarga'
import { IsiHasil } from '@/components/tryout/RiwayatKemampuan'
import RemahRoti from '@/components/siswa/RemahRoti'
import { muatMasukanAnak } from '@/lib/tryout/hasil-anak'
import { susunRiwayat } from '@/lib/tryout/riwayat-kemampuan'

export const metadata = { title: 'Laporan Try Out' }
export const dynamic = 'force-dynamic'

/**
 * Laporan Try Out untuk orang tua: kemampuan anak per bidang dan topik. Khusus siswa bimbel yang
 * punya laporan keluarga; siswa kode, langganan, dan umum hanya melihat detail dan pembahasan.
 * Tanpa pembanding nasional atau rata-rata peserta dan tanpa rincian indikator (itu untuk admin).
 */
export default async function LaporanTryOutKeluarga({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  const masukan = (await muatMasukanAnak(studentId)).sort((a, b) => b.dikirim.localeCompare(a.dikirim))

  return (
    <div className="space-y-4">
      <RemahRoti item={[{ label: 'Try Out', href: `/keluarga/${studentId}/tryout` }, { label: 'Laporan Try Out' }]} />
      <h1 className="text-xl font-bold tracking-tight text-gray-900">Laporan Try Out</h1>
      {masukan.length === 0 ? (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
          <p className="font-semibold tracking-tight text-gray-900">Belum ada laporan try out</p>
          <p className="mt-1 text-sm text-gray-500">
            Laporan muncul di sini setelah anak mengerjakan try out dan hasilnya dibuka oleh admin Bimbel Tera, biasanya setelah semua sesi try out selesai.
          </p>
        </div>
      ) : (
        masukan.map((m) => {
          const [mapel] = susunRiwayat([m])
          if (!mapel) return null
          return (
            <section key={m.quizId} className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
              <h2 className="font-semibold tracking-tight text-gray-900">{m.judul}</h2>
              <IsiHasil m={mapel} hrefDetail={`/keluarga/${studentId}/tryout/${m.quizId}`} />
            </section>
          )
        })
      )}
    </div>
  )
}
