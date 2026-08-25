import { belajarContext } from '@/lib/belajar/konteks'
import { mapelLatihan } from '@/lib/belajar/sesi'
import PemilihLatihan from '@/components/belajar/PemilihLatihan'

/**
 * Pintu masuk permukaan belajar: memilih apa yang mau dilatih.
 *
 * `belajarContext()` selalu baris pertama — ia yang memutuskan atas nama siapa
 * halaman ini dibuka, dan ia pula yang memulangkan orang yang tidak berhak.
 * Sesi belum dibuat di sini; itu terjadi saat tombol "Mulai Latihan" ditekan,
 * dan sejak detik itu tempatnya pindah ke `/belajar/[sesiId]`.
 */
export default async function BelajarBeranda({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>
}) {
  const { anak } = await searchParams
  const { learnerId, namaPelajar, hanyaPublik } = await belajarContext(anak)
  const mapel = await mapelLatihan(learnerId)

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow ring-1 ring-gray-900/5">
        <p className="text-sm font-semibold text-gray-900">Berlatih sebagai {namaPelajar}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-500">
          {hanyaPublik
            ? 'Soal-soal yang terbuka untuk langganan.'
            : 'Seluruh bank soal bimbel.'}
        </p>
      </div>

      <PemilihLatihan mapel={mapel} anak={anak} />
    </div>
  )
}
