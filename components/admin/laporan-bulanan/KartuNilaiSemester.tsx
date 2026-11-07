import type { RangkumanKelas } from '@/lib/reports/ringkasan-laporan'
import { GrafikNilaiBulanan, MAKS_SERI } from '@/components/keluarga/BilahRapor'

/**
 * Rata-rata nilai asesmen per mapel dan grafik nilai bulanannya — kartu
 * "Progres Kelas" yang sama dengan yang dilihat keluarga di menu Rapor, supaya
 * admin membuka laporan satu siswa dengan gambaran yang sama dengan orang tuanya.
 */
export default function KartuNilaiSemester({
  kelas,
  bulan,
  semesterLabel,
}: {
  kelas: RangkumanKelas[] | null
  bulan: string[]
  semesterLabel: string
}) {
  const bergrafik = (kelas ?? []).filter(m => m.nilaiBulanan.some(v => v != null))
  const tampil = bergrafik.slice(0, MAKS_SERI)
  const sisa = bergrafik.length - tampil.length

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5 mb-6">
      <p className="font-semibold text-gray-900">Nilai Asesmen</p>
      <p className="mt-0.5 text-xs text-gray-400">Rata-rata nilai asesmen {semesterLabel}</p>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {kelas === null ? (
          <p className="text-sm text-gray-400">Belum terdaftar di kelas mana pun.</p>
        ) : kelas.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada sesi yang selesai.</p>
        ) : (
          <>
            <div className="flex divide-x divide-slate-100">
              {kelas.map(m => (
                <div key={m.mapel} className="min-w-0 flex-1 px-3 first:pl-0 last:pr-0">
                  <p className="truncate text-xs text-gray-400">{m.mapel}</p>
                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
                    {/* Em dash, bukan nol: belum pernah diasesmen bukan berarti bernilai nol. */}
                    {m.rataRata ?? '—'}
                  </p>
                </div>
              ))}
            </div>
            {tampil.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <GrafikNilaiBulanan
                  seri={tampil.map(m => ({ mapel: m.mapel, nilai: m.nilaiBulanan }))}
                  bulan={bulan}
                />
                {sisa > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Grafik menampilkan {MAKS_SERI} mapel dengan sesi terbanyak; {sisa} mapel lain
                    tidak digambar.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
