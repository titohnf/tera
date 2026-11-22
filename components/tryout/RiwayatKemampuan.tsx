import type { ButirRiwayat, RiwayatMapel, StatusButir, TopikPerTryOut } from '@/lib/tryout/riwayat-kemampuan'
import IsiSoal from '@/components/belajar/IsiSoal'
import { RincianJawaban } from '@/components/belajar/TinjauanSesi'
import type { OpsiSoal, TipeSoal } from '@/lib/belajar/tipe-soal'
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
  sebagian: { teks: '◐', kelas: 'bg-amber-100 text-amber-800', sr: 'sebagian benar' },
  salah: { teks: '✗', kelas: 'bg-red-100 text-red-700', sr: 'salah' },
}

/** Satu nomor soal: baris yang bisa dibuka untuk membaca soalnya. */
function Butir({ butir }: { butir: ButirRiwayat }) {
  const t = TANDA[butir.status]
  const teks = butir.teks
  const pilihan = (teks?.opsi as { choices?: unknown } | null)?.choices
  const daftarPilihan = Array.isArray(pilihan) ? pilihan.filter((v): v is string => typeof v === 'string') : []
  return (
    <details className="group py-0.5">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-1 py-1.5 hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
        <span className="inline-block w-3 shrink-0 text-gray-400 transition-transform group-open:rotate-90" aria-hidden>
          ▸
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800">Soal nomor {butir.nomor}</span>
        <span className={`inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${t.kelas}`} aria-label={t.sr} title={t.sr}>
          {t.teks}
        </span>
      </summary>
      <div className="mb-2 ml-6 mt-1 rounded-lg bg-slate-50 p-3">
        {teks ? (
          <>
            <IsiSoal text={teks.prompt} className="text-sm leading-relaxed text-gray-900" />
            {daftarPilihan.length > 0 && (
              <ol className="mt-2 space-y-1 text-sm text-gray-700">
                {daftarPilihan.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-5 shrink-0 font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                    <span className="min-w-0 flex-1">{p}</span>
                  </li>
                ))}
              </ol>
            )}
            <RincianJawaban
              soal={{ id: String(butir.nomor), tipe: teks.tipe as TipeSoal, prompt: teks.prompt, opsi: teks.opsi as OpsiSoal, bobot: 1 }}
              jawaban={teks.jawaban}
              kunci={teks.kunci}
              pembahasan={teks.pembahasan}
              hasil={teks.jawaban === null || teks.jawaban === undefined ? 'belum' : butir.status}
              nama="anak"
            />
          </>
        ) : (
          <p className="text-sm text-gray-400">Soal ini tidak dapat ditampilkan.</p>
        )}
      </div>
    </details>
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
                                      <div className="mt-1 divide-y divide-gray-50">
                                        {x.butir.map((bt) => (
                                          <Butir key={bt.nomor} butir={bt} />
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
                <p className="text-xs text-gray-400">✓ benar · ◐ sebagian benar · ✗ salah · ketuk nomor untuk melihat soal, jawaban, dan pembahasan</p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
