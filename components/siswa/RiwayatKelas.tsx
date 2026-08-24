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
 *
 * Dua bentuk: kartu di bawah `sm`, tabel di atasnya. Tabelnya kini boleh
 * menampilkan Mulai dan Selesai di semua ukuran, karena ponsel tidak lagi
 * memakainya.
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
  garisPemisah = true,
}: {
  kelas: KelasLampau[]
  classHref?: (id: string) => string
  /**
   * Garis tipis di atas ringkasan. Perlu saat ia menempel di bawah tabel sesi
   * dalam satu kartu (halaman admin); mengganggu saat ia sendirian di dalam
   * kartunya, karena garis di puncak kartu terbaca seperti sisa potongan.
   */
  garisPemisah?: boolean
}) {
  if (kelas.length === 0) return null

  return (
    <div className={garisPemisah ? 'pt-4 border-t border-slate-100' : ''}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Riwayat Kelas ({kelas.length})
      </p>
      {/* Ponsel: satu kelas satu kartu. Tabelnya sudah menyembunyikan Mulai dan
          Selesai di bawah `sm`, tapi yang tersisa pun masih menggeser mendatar —
          dan justru dua tanggal itulah yang menjawab "anak saya ikut kelas ini
          kapan". Di kartu keduanya muat tanpa menyingkirkan apa pun. */}
      <div className="sm:hidden space-y-2">
        {kelas.map((cls) => {
          const isi = (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-700">{cls.name}</p>
                  {cls.subject_names.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{cls.subject_names.join(', ')}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold text-gray-700 tabular-nums">
                  {cls.jumlahSesi} <span className="text-xs font-normal text-gray-400">sesi</span>
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-slate-100">
                {tanggal(cls.mulai)} — {tanggal(cls.selesai)}
              </p>
            </div>
          )
          return classHref ? (
            <Link key={cls.id} href={classHref(cls.id)} className="block">
              {isi}
            </Link>
          ) : (
            <div key={cls.id}>{isi}</div>
          )
        })}
      </div>

      <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="pl-4 pr-3 py-2.5 text-left">Kelas</th>
              <th className="px-3 py-2.5 text-center">Total Sesi</th>
              <th className="px-3 py-2.5 text-left">Mulai</th>
              <th className="px-3 py-2.5 text-left">Selesai</th>
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
                  <td className="px-3 py-2.5 text-gray-500">
                    {bungkus(tanggal(cls.mulai))}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500">
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
