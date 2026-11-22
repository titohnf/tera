import type { ButirRiwayat, RiwayatMapel, StatusButir, TopikPerTryOut } from '@/lib/tryout/riwayat-kemampuan'
import Link from 'next/link'
import { tanggalWib } from '@/lib/tryout/paket'
import { tanggalPanjang } from '@/lib/waktu-relatif'

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const bulat = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 })

function tingkat(p: number | null): { label: string; warna: string; batang: string } {
  if (p === null) return { label: 'Belum ada data', warna: 'text-gray-500', batang: 'bg-gray-300' }
  if (p >= 75) return { label: 'Sudah kuat', warna: 'text-green-700', batang: 'bg-green-600' }
  if (p >= 50) return { label: 'Cukup', warna: 'text-amber-700', batang: 'bg-amber-500' }
  return { label: 'Perlu dilatih', warna: 'text-red-700', batang: 'bg-red-500' }
}

const TANDA: Record<StatusButir, { teks: string; kelas: string; sr: string }> = {
  benar: { teks: '✓', kelas: 'bg-green-100 text-green-800', sr: 'benar' },
  sebagian: { teks: '◐', kelas: 'bg-amber-100 text-amber-800', sr: 'benar sebagian' },
  salah: { teks: '✗', kelas: 'bg-red-100 text-red-700', sr: 'salah' },
}

/** Satu nomor soal sebagai tanda kecil; mengetuknya membuka soal itu di halaman detail dan pembahasan. */
function Butir({ butir, hrefDetail }: { butir: ButirRiwayat; hrefDetail?: string }) {
  const t = TANDA[butir.status]
  const isi = (
    <>
      <span className="font-medium tabular-nums text-gray-800">No. {butir.nomor}</span>
      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ${t.kelas}`} aria-label={t.sr} title={t.sr}>
        {t.teks}
      </span>
    </>
  )
  const kelas = 'inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs ring-1 ring-gray-200'
  return hrefDetail ? (
    <Link href={`${hrefDetail}#soal-${butir.nomor}`} className={`${kelas} hover:bg-gray-50`}>
      {isi}
    </Link>
  ) : (
    <span className={kelas}>{isi}</span>
  )
}

function RingkasTopik({ sel }: { sel: TopikPerTryOut }) {
  const t = tingkat(sel.persen)
  return (
    <span className={`text-xs font-medium ${t.warna}`}>
      {sel.benar} dari {sel.total} soal benar · {t.label}
    </span>
  )
}

/**
 * Hasil satu try out untuk orang tua dan anak, dipasang di dalam kartu try out itu: nilai, lalu
 * kemampuan per bidang dan per topik. Tanpa pembanding nasional atau rata-rata peserta (itu untuk admin).
 */
export function IsiHasil({ m, hrefDetail }: { m: RiwayatMapel; hrefDetail?: string }) {
  const terakhir = m.tryOut.length - 1
  const to = m.tryOut[terakhir]
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
        <div>
          <p className="text-xs text-gray-500">Dikerjakan {tanggalPanjang(tanggalWib(to.dikirim))}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-semibold tabular-nums text-gray-900">{to.nilai !== null ? fmt(to.nilai) : '—'}</span>
          <span className="ml-1 text-xs text-gray-400">/ 100</span>
        </div>
      </div>

            {m.bidang.length === 0 ? (
              <p className="text-sm text-gray-400">Rincian per topik belum tersedia untuk try out ini.</p>
            ) : (
              <div className="space-y-5">
                {m.bidang.map((b) => {
                  const p = b.persenPerTryOut[terakhir] ?? null
                  const t = tingkat(p)
                  return (
                    <div key={b.kunci}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">{b.nama}</p>
                        <p className={`shrink-0 text-sm font-semibold ${t.warna}`}>{t.label}</p>
                      </div>
                      <div className="mt-1.5 h-2.5 rounded-full bg-gray-100" role="img" aria-label={`${b.nama}: ${t.label}${p !== null ? `, ${bulat(p)} persen` : ''}`}>
                        {p !== null && <div className={`h-full rounded-full ${t.batang}`} style={{ width: `${Math.max(2, Math.min(100, p))}%` }} />}
                      </div>

                      <div className="mt-3 space-y-2">
                        {b.topik.map((topik) => {
                          const sel = topik.perTryOut[terakhir]
                          return (
                            <details key={topik.kunci} className="group rounded-lg border border-gray-100" open>
                              <summary className="flex cursor-pointer list-none items-start gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
                                <span className="mt-0.5 inline-block w-3 shrink-0 text-gray-400 transition-transform group-open:rotate-90" aria-hidden>
                                  ▸
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-medium text-gray-800">{topik.nama}</span>
                                  {sel && <RingkasTopik sel={sel} />}
                                </span>
                              </summary>
                              <div className="space-y-3 border-t border-gray-100 px-3 py-2">
                                {topik.perTryOut.map((x, i) =>
                                  x ? (
                                    <div key={i}>
                                      <p className="text-xs font-semibold text-gray-500">
                                        {m.tryOut[i].label}
                                        <span className="ml-2 font-normal">
                                          {x.benar} dari {x.total} soal benar
                                        </span>
                                      </p>
                                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {x.butir.map((bt) => (
                                          <Butir key={bt.nomor} butir={bt} hrefDetail={hrefDetail} />
                                        ))}
                                      </div>
                                    </div>
                                  ) : null,
                                )}
                              </div>
                            </details>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                <p className="text-xs text-gray-400">✓ benar · ◐ benar sebagian · ✗ salah · ketuk nomor untuk membuka soal dan pembahasannya</p>
              </div>
            )}
    </div>
  )
}
