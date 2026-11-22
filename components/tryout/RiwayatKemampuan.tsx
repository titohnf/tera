import type { RiwayatMapel, TopikPerTryOut } from '@/lib/tryout/riwayat-kemampuan'
import { tanggalPanjang } from '@/lib/waktu-relatif'

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const bulat = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 0 })

function tingkat(p: number | null): { label: string; warna: string; batang: string } {
  if (p === null) return { label: 'Belum ada data', warna: 'text-gray-500', batang: 'bg-gray-300' }
  if (p >= 75) return { label: 'Sudah kuat', warna: 'text-green-700', batang: 'bg-green-600' }
  if (p >= 50) return { label: 'Cukup', warna: 'text-amber-700', batang: 'bg-amber-500' }
  return { label: 'Perlu dilatih', warna: 'text-red-700', batang: 'bg-red-500' }
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
 * Kemampuan anak per mata pelajaran, untuk orang tua dan anak. Tiap try out menambah satu bagian di
 * bawah topik yang sama, jadi perkembangan terbaca dari atas ke bawah (Try Out 1, 2, 3 ...). Hanya
 * milik anak itu sendiri: tanpa pembanding nasional atau rata-rata peserta (itu untuk admin).
 */
export default function RiwayatKemampuan({ riwayat }: { riwayat: RiwayatMapel[] }) {
  return (
    <div className="space-y-5">
      {riwayat.map((m) => {
        const terakhir = m.tryOut.length - 1
        return (
          <section key={m.kunci} className="space-y-4 rounded-xl bg-white p-4 shadow-kartu">
            <div>
              <h3 className="font-semibold tracking-tight text-gray-900">{m.judul}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {m.tryOut.map((to) => (
                  <div key={to.quizId} id={`hasil-${to.quizId}`} className="scroll-mt-4 rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-gray-500">{to.label}</p>
                    <p className="text-xl font-semibold tabular-nums text-gray-900">{to.nilai !== null ? fmt(to.nilai) : '—'}</p>
                    <p className="text-[11px] text-gray-400">{tanggalPanjang(to.dikirim)}</p>
                  </div>
                ))}
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
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
