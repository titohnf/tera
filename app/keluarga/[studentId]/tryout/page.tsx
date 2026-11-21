import { anakOrRedirect } from '@/lib/keluarga'
import { learnerAnak } from '@/lib/belajar/sesi'
import PohonKompetensi from '@/components/laporan/PohonKompetensi'
import { muatTryOut, tryOutSiswa } from '@/lib/reports/tryout-data'
import { indikatorTerlemah, sisipkanPembanding, susunPohon } from '@/lib/reports/kompetensi-tryout'
import { tanggalPanjang } from '@/lib/waktu-relatif'

export const metadata = { title: 'Hasil Try Out' }

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Pembanding rata-rata kelas hanya ditampilkan bila pesertanya cukup banyak sehingga tidak menunjuk satu anak. */
const MIN_PESERTA_PEMBANDING = 3

/**
 * Hasil Try Out seorang anak: nilainya, dan di kompetensi mana ia kuat dan perlu
 * dilatih, dibandingkan dengan capaian nasional dan rata-rata teman try out yang
 * sama. Susunannya mengikuti halaman daya serap Pusmendik.
 *
 * Yang tampil HANYA angka anak ini dan rata-rata kelas — tidak ada nama atau
 * nilai anak lain. Data kelas dibaca lewat klien admin setelah `anakOrRedirect`
 * memastikan keluarga ini memang berhak atas anak ini.
 *
 * Hasil muncul di sini setelah admin menautkan percobaan ke siswa
 * (Panel admin → Hasil Try Out).
 */
export default async function TryOutKeluargaPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params
  await anakOrRedirect(studentId)

  const learnerId = await learnerAnak(studentId)
  const riwayat = learnerId ? await tryOutSiswa(learnerId) : []

  // Satu kartu per try out, memakai percobaan TERBARU anak ini di try out itu.
  const terbaruPerKuis = new Map<string, { attemptId: string; dikirim: string }>()
  for (const r of riwayat) if (!terbaruPerKuis.has(r.quizId)) terbaruPerKuis.set(r.quizId, { attemptId: r.attemptId, dikirim: r.dikirim })

  const kartu = []
  for (const [quizId, p] of terbaruPerKuis) {
    const data = await muatTryOut(quizId)
    if (!data) continue
    const semuaId = data.percobaan.map((x) => x.id)
    const saya = data.percobaan.find((x) => x.id === p.attemptId)
    if (!saya) continue
    const nilai = data.bobotTotal > 0 && saya.skor !== null ? (saya.skor / data.bobotTotal) * 100 : null
    const rataKelas =
      semuaId.length >= MIN_PESERTA_PEMBANDING && data.bobotTotal > 0
        ? (data.percobaan.reduce((n, x) => n + (x.skor ?? 0), 0) / semuaId.length / data.bobotTotal) * 100
        : null
    const pohonKelas = susunPohon(data.soal, data.skor, semuaId)
    const pohonAnak = sisipkanPembanding(
      susunPohon(data.soal, data.skor, [p.attemptId]),
      semuaId.length >= MIN_PESERTA_PEMBANDING ? pohonKelas : [],
    )
    kartu.push({ data, dikirim: p.dikirim, nilai, rataKelas, pohonAnak, terlemah: indikatorTerlemah(pohonAnak, 3) })
  }

  if (kartu.length === 0) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-kartu">
        <p className="font-semibold tracking-tight text-gray-900">Belum ada hasil try out</p>
        <p className="mt-1 text-sm text-gray-500">
          Hasil try out muncul di sini setelah anak mengerjakan try out dan hasilnya ditautkan ke akunnya oleh admin Bimbel Tera.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {kartu.map((k) => (
        <div key={k.data.id} className="space-y-4 rounded-xl bg-white p-4 shadow-kartu">
          <div>
            <p className="font-semibold tracking-tight text-gray-900">{k.data.judul}</p>
            <p className="mt-0.5 text-xs text-gray-400">Dikerjakan {tanggalPanjang(k.dikirim)}</p>
          </div>

          <div className="flex items-end gap-6">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-gray-900">{k.nilai !== null ? fmt(k.nilai) : '—'}</p>
              <p className="text-xs text-gray-400">nilai dari 100</p>
            </div>
            {k.rataKelas !== null && (
              <div>
                <p className="text-lg font-medium tabular-nums text-gray-600">{fmt(k.rataKelas)}</p>
                <p className="text-xs text-gray-400">rata-rata peserta</p>
              </div>
            )}
          </div>

          {k.data.tanpaKolomKompetensi || k.pohonAnak.length === 0 ? (
            <p className="text-sm text-gray-400">Rincian per kompetensi belum tersedia untuk try out ini.</p>
          ) : (
            <>
              {k.terlemah.length > 0 && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm font-medium text-gray-800">Perlu dilatih lebih banyak</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-gray-600">
                    {k.terlemah.map((t) => (
                      <li key={t.kunci}>{t.nama}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">Capaian per kompetensi</p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Bilah biru adalah capaian anak. Garis hitam adalah capaian nasional peserta TKA. Ketuk satu baris untuk melihat rinciannya.
                </p>
                <div className="mt-2">
                  <PohonKompetensi pohon={k.pohonAnak} labelPembanding={k.rataKelas !== null ? 'Rata-rata peserta' : undefined} />
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
