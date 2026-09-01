import Link from 'next/link'
import { notFound } from 'next/navigation'
import { daftarEskalasi, muridPengukuran, paketPengukuran } from '@/lib/pengukuran/tutor'
import RaporPaket from '@/components/pengukuran/RaporPaket'
import KartuEskalasi from '@/components/pengukuran/KartuEskalasi'

export const metadata = { title: 'Rapor Pengukuran' }

/**
 * Rapor pengukuran satu murid (FR8).
 *
 * Namanya diambil dari daftar roster, bukan dari `learners` langsung: tutor
 * memang tidak boleh membaca tabel itu, dan murid yang tidak muncul di roster
 * adalah murid yang bukan tanggung jawab pemanggil. Maka ketiadaan nama di
 * daftar itu sekaligus jawaban akhirnya — 404, bukan halaman kosong yang
 * menyiratkan "ada, tapi kamu tidak boleh lihat".
 */
export default async function RaporMuridPage({
  params,
}: {
  params: Promise<{ learnerId: string }>
}) {
  const { learnerId } = await params
  const roster = await muridPengukuran()
  const murid = roster.find(m => m.learnerId === learnerId)
  if (!murid) notFound()

  const [paket, eskalasi] = await Promise.all([
    paketPengukuran(learnerId),
    daftarEskalasi(),
  ])
  const miliknya = eskalasi.filter(e => e.learnerId === learnerId)

  return (
    <div>
      <Link href="/tutor/pengukuran" className="text-sm text-gray-500 hover:text-blue-700">
        ← Pengukuran
      </Link>

      <div className="mb-6 mt-2">
        <h1 className="text-xl font-semibold text-gray-900">{murid.nama}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Skor percobaan pertama dan skor akhir tiap paket. Angka Putaran 1 hanya untuk kamu — murid
          tidak pernah melihatnya, dan menyebutkannya sebagai &ldquo;nilai&rdquo; di depan anaknya
          akan membuat percobaan pertama terasa seperti ujian.
        </p>
      </div>

      <RaporPaket paket={paket} />

      {miliknya.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Riwayat eskalasi</h2>
          <div className="space-y-3">
            {miliknya.map(e => (
              <KartuEskalasi key={e.id} eskalasi={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
