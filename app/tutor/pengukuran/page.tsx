import Link from 'next/link'
import { daftarEskalasi, muridPengukuran } from '@/lib/pengukuran/tutor'
import KartuEskalasi from '@/components/pengukuran/KartuEskalasi'

export const metadata = { title: 'Pengukuran' }

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Permukaan tutor untuk pilot Tahap 0 (PRD FR7 & FR8).
 *
 * Eskalasi lebih dulu, roster di bawahnya. Urutan itu disengaja: yang menuntut
 * tindakan hari ini adalah eskalasi, dan daftar murid yang baik-baik saja tidak
 * boleh menjadi hal pertama yang harus dilewati untuk menemukannya.
 *
 * Tidak ada keputusan akses di halaman ini — `tutor_*` (150) yang memutuskan,
 * dan yang pulang sudah tersaring ke murid yang jadi tanggung jawab pemanggil.
 */
export default async function PengukuranPage() {
  const [murid, eskalasi] = await Promise.all([muridPengukuran(), daftarEskalasi()])

  const terbuka = eskalasi.filter(e => e.waktuDirespons === null)
  const sudah = eskalasi.filter(e => e.waktuDirespons !== null)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pengukuran</h1>
        <p className="mt-1 text-sm text-gray-500">
          Murid yang jadi tanggung jawabmu di pilot latihan mandiri, dan eskalasi yang menunggu
          responsmu.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">
          Perlu ditangani{terbuka.length > 0 ? ` (${terbuka.length})` : ''}
        </h2>
        {terbuka.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
            Tidak ada eskalasi yang menunggu. Ini kabar baik, bukan layar kosong.
          </p>
        ) : (
          <div className="space-y-3">
            {terbuka.map(e => (
              <KartuEskalasi key={e.id} eskalasi={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Murid</h2>
        {murid.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow ring-1 ring-gray-900/5">
            Belum ada murid yang tercatat sebagai tanggung jawabmu. Penanggung jawab diisi admin di
            data murid — dan tanpanya, murid tidak bisa memulai paket pengukuran.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow ring-1 ring-gray-900/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-2.5 font-medium">Nama</th>
                  <th className="px-5 py-2.5 font-medium">Paket selesai</th>
                  <th className="px-5 py-2.5 font-medium">Eskalasi terbuka</th>
                  <th className="px-5 py-2.5 font-medium">Eskalasi terakhir</th>
                </tr>
              </thead>
              <tbody>
                {murid.map(m => (
                  <tr key={m.learnerId} className="border-t border-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/tutor/pengukuran/${m.learnerId}`}
                        className="font-medium text-gray-900 hover:text-blue-700"
                      >
                        {m.nama}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{m.paketSelesai}</td>
                    <td className="px-5 py-3">
                      {m.eskalasiTerbuka > 0 ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                          {m.eskalasiTerbuka}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {m.eskalasiTerakhir ? tanggal(m.eskalasiTerakhir) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {sudah.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Sudah ditangani</h2>
          <div className="space-y-3">
            {sudah.map(e => (
              <KartuEskalasi key={e.id} eskalasi={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
