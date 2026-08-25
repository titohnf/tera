import Link from 'next/link'
import { belajarContext } from '@/lib/belajar/konteks'
import { mapelLatihan, sesiTertunda } from '@/lib/belajar/sesi'
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
  const [mapel, tertunda] = await Promise.all([
    mapelLatihan(learnerId),
    sesiTertunda(learnerId),
  ])

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

      {/* Satu-satunya pintu menuju sesi yang belum selesai. Undiannya tersimpan
          sejak migrasi 114, tapi rute sesi tidak ditautkan dari mana pun —
          tanpa kartu ini, anak yang menutup tab kehilangan sesinya bukan karena
          datanya hilang melainkan karena tidak ada jalan kembali. */}
      {tertunda && (
        <Link
          href={`/belajar/${tertunda.sesiId}`}
          className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 shadow ring-1 ring-blue-200 transition hover:ring-blue-300 active:bg-blue-100"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-blue-900">
              Lanjutkan latihan
            </span>
            <span className="block text-sm text-blue-700/80">
              {tertunda.sudahDijawab} dari {tertunda.jumlahSoal} soal sudah dijawab.
            </span>
          </span>
          <span className="shrink-0 text-blue-600" aria-hidden>
            →
          </span>
        </Link>
      )}

      <PemilihLatihan mapel={mapel} anak={anak} />
    </div>
  )
}
