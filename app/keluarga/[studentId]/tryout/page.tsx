import { anakOrRedirect } from '@/lib/keluarga'
import { IsiHasil } from '@/components/tryout/RiwayatKemampuan'
import { muatMasukanAnak } from '@/lib/tryout/hasil-anak'
import { susunRiwayat } from '@/lib/tryout/riwayat-kemampuan'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

/**
 * Laporan Try Out untuk orang tua: skor dan kemampuan anak per bidang dan topik. Tampilan keluarga
 * memantau; mengerjakan try out dan membahas soalnya ada di tampilan siswa (`/siswa/<anak>/tryout`).
 * Tanpa pembanding nasional atau rata-rata peserta dan tanpa rincian indikator (itu untuk admin).
 * Hasil muncul di sini setelah admin membuka hasilnya.
 */
export default async function TryOutKeluargaPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  await anakOrRedirect(studentId)
  const masukan = (await muatMasukanAnak(studentId)).sort((a, b) => b.dikirim.localeCompare(a.dikirim))

  if (masukan.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <p className="font-semibold tracking-tight text-gray-900">Belum ada laporan try out</p>
        <p className="mt-1 text-sm text-gray-500">
          Laporan muncul di sini setelah anak mengerjakan try out dan hasilnya dibuka oleh admin Bimbel Tera, biasanya setelah semua sesi try out selesai.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {masukan.map((m) => {
        const [mapel] = susunRiwayat([m])
        if (!mapel) return null
        return (
          <section key={m.quizId} className="space-y-3 rounded-xl bg-white p-4 shadow-kartu">
            <h2 className="font-semibold tracking-tight text-gray-900">{m.judul}</h2>
            <IsiHasil m={mapel} />
          </section>
        )
      })}
    </div>
  )
}
