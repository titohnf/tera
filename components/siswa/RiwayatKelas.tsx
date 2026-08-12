import Link from 'next/link'

/**
 * Kelas yang sudah tidak diikuti lagi, diringkas di bawah tabel sesi.
 *
 * Tabel sesi hanya memuat kelas AKTIF — di kedua portal. Tanpa ringkasan ini,
 * kelas yang sudah selesai lenyap sama sekali dari pandangan: orang tua tidak
 * bisa lagi menunjukkan bahwa anaknya pernah ikut kelas itu, dan admin
 * kehilangan jejaknya saat menjawab pertanyaan tentang tagihan lama.
 *
 * `classHref` menentukan apakah barisnya bisa diklik: admin menuju halaman
 * kelas, keluarga tidak punya halaman itu.
 */

export type KelasLampau = {
  id: string
  name: string
  subject_names: string[]
  jumlahSesi: number
  mulai: string | null
  selesai: string | null
}

function tanggal(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function RiwayatKelas({
  kelas,
  classHref,
}: {
  kelas: KelasLampau[]
  classHref?: (id: string) => string
}) {
  if (kelas.length === 0) return null

  return (
    <div className="pt-4 border-t border-slate-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Riwayat Kelas ({kelas.length})
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="pl-4 pr-3 py-2.5 text-left">Kelas</th>
              <th className="px-3 py-2.5 text-center">Total Sesi</th>
              <th className="px-3 py-2.5 text-left hidden sm:table-cell">Mulai</th>
              <th className="px-3 py-2.5 text-left hidden sm:table-cell">Selesai</th>
              {classHref && <th className="pr-3 pl-2 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kelas.map((cls) => {
              const bungkus = (isi: React.ReactNode) =>
                classHref ? (
                  <Link href={classHref(cls.id)} className="block">
                    {isi}
                  </Link>
                ) : (
                  isi
                )
              return (
                <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                  <td className="pl-4 pr-3 py-2.5">
                    {bungkus(
                      <>
                        <p className="font-medium text-gray-700">{cls.name}</p>
                        {cls.subject_names.length > 0 && (
                          <p className="text-xs text-gray-400">{cls.subject_names.join(', ')}</p>
                        )}
                      </>,
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-gray-700">
                    {bungkus(cls.jumlahSesi)}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                    {bungkus(tanggal(cls.mulai))}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                    {bungkus(tanggal(cls.selesai))}
                  </td>
                  {classHref && (
                    <td className="pr-3 pl-2 py-2.5 text-right">
                      <Link href={classHref(cls.id)}>
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
