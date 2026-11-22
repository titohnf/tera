import { redirect } from 'next/navigation'
import { anakOrRedirect } from '@/lib/keluarga'
import { TabelHasil } from '@/components/tryout/RiwayatKemampuan'
import { muatMasukanAnak, muatTeksMasukan } from '@/lib/tryout/hasil-anak'
import { soalPerSel } from '@/components/tryout/SoalPerSel'
import { susunRiwayat } from '@/lib/tryout/riwayat-kemampuan'

export const metadata = { title: 'Try Out' }
export const dynamic = 'force-dynamic'

/**
 * Laporan Try Out untuk orang tua: skor dan kemampuan anak per bidang dan topik. Tampilan keluarga
 * memantau; mengerjakan try out dan membahas soalnya ada di tampilan siswa (`/siswa/<anak>/tryout`).
 * Tanpa pembanding nasional atau rata-rata peserta dan tanpa rincian indikator (itu untuk admin).
 * Hasil muncul di sini setelah admin membuka hasilnya.
 */
export default async function TryOutKeluargaPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<{ mapel?: string }>
}) {
  const { studentId } = await params
  const { mapel: kunciMapel } = await searchParams
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

  // Hanya ada rincian per mapel. Tanpa `?mapel=` (atau dengan kunci yang tidak dikenal) arahkan ke mapel pertama.
  const semua = susunRiwayat(masukan)
  const dipilih = semua.find((x) => x.kunci === kunciMapel)
  if (!dipilih) redirect(`/keluarga/${studentId}/tryout?mapel=${encodeURIComponent(semua[0].kunci)}`)

  // Soal dimuat hanya untuk try out mapel ini, supaya halaman tetap ringan.
  const kuis = new Set(dipilih.tryOut.map((t) => t.quizId))
  const denganTeks = await muatTeksMasukan(masukan.filter((x) => kuis.has(x.quizId)))
  const mapel = susunRiwayat(denganTeks).find((x) => x.kunci === dipilih.kunci) ?? dipilih

  return (
    <section className="space-y-3 rounded-xl bg-white p-4 shadow-kartu">
      <h2 className="text-base font-semibold tracking-tight text-gray-900">{mapel.judul}</h2>
      <TabelHasil m={mapel} soal={soalPerSel(mapel)} />
    </section>
  )
}
