import IsiSoal from '@/components/belajar/IsiSoal'
import { RincianJawaban } from '@/components/belajar/TinjauanSesi'
import type { OpsiSoal, TipeSoal } from '@/lib/belajar/tipe-soal'
import type { DataTryOut } from '@/lib/reports/tryout-data'
import { tanggalWib } from '@/lib/tryout/paket'
import { tanggalPanjang } from '@/lib/waktu-relatif'

const EPS = 1e-6
type Hasil = 'benar' | 'sebagian' | 'salah' | 'belum'

const NADA: Record<Hasil, { judul: string; teks: string; petak: string }> = {
  benar: { judul: 'Benar', teks: 'text-emerald-700', petak: 'bg-emerald-100 text-emerald-800' },
  sebagian: { judul: 'Sebagian benar', teks: 'text-amber-700', petak: 'bg-amber-100 text-amber-800' },
  salah: { judul: 'Belum tepat', teks: 'text-rose-700', petak: 'bg-rose-100 text-rose-700' },
  belum: { judul: 'Belum dijawab', teks: 'text-gray-500', petak: 'bg-gray-100 text-gray-600' },
}

const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Halaman detail dan pembahasan satu try out: soal berurutan nomor, masing-masing dengan jawaban
 * anak, jawaban benar, dan pembahasannya. Tanpa analisis per topik (itu di Laporan Try Out keluarga).
 * Semua soal terbuka; nomornya jadi jangkar `#soal-N`.
 */
export default function DetailPembahasan({
  data,
  attemptId,
  nilai,
  dikirim,
}: {
  data: DataTryOut
  attemptId: string
  nilai: number | null
  dikirim?: string
}) {
  const skorSoal = new Map<string, number>()
  for (const s of data.skor) if (s.attemptId === attemptId) skorSoal.set(s.questionId, (skorSoal.get(s.questionId) ?? 0) + s.skor)

  const butir = [...data.soal]
    .sort((a, b) => a.nomor - b.nomor)
    .map((s) => {
      const teks = data.teks[s.id]
      const dijawab = teks && teks.jawaban !== null && teks.jawaban !== undefined
      const skor = skorSoal.get(s.id) ?? 0
      const hasil: Hasil = !dijawab ? 'belum' : skor >= s.bobot - EPS ? 'benar' : skor <= EPS ? 'salah' : 'sebagian'
      return { s, teks, hasil }
    })

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">{data.judul}</h1>
          <p className="mt-0.5 text-sm text-gray-500">Detail dan pembahasan{dikirim ? ` · dikerjakan ${tanggalPanjang(tanggalWib(dikirim))}` : ''}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-500">Skor akhir</p>
          <p className="text-2xl font-semibold tabular-nums leading-tight text-gray-900">{nilai !== null ? fmt(nilai) : '—'}</p>
        </div>
      </div>

      <nav aria-label="Nomor soal" className="flex flex-wrap gap-1.5">
        {butir.map(({ s, hasil }) => (
          <a key={s.id} href={`#soal-${s.nomor}`} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums ${NADA[hasil].petak}`}>
            {s.nomor}
          </a>
        ))}
      </nav>

      <div className="space-y-3">
        {butir.map(({ s, teks, hasil }) => {
          const pilihan = (teks?.opsi as { choices?: unknown } | null)?.choices
          const daftar = Array.isArray(pilihan) ? pilihan.filter((v): v is string => typeof v === 'string') : []
          return (
            <article key={s.id} id={`soal-${s.nomor}`} className="scroll-mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-sm font-semibold tabular-nums ${NADA[hasil].petak}`}>{s.nomor}</span>
                <p className={`text-sm font-semibold ${NADA[hasil].teks}`}>{NADA[hasil].judul}</p>
              </div>
              {teks ? (
                <>
                  <IsiSoal text={teks.prompt} className="mt-3 text-[15px] leading-relaxed text-gray-900" />
                  {daftar.length > 0 && (
                    <ol className="mt-2 space-y-1 text-sm text-gray-700">
                      {daftar.map((p, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="w-5 shrink-0 font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                          <span className="min-w-0 flex-1">{p}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  <RincianJawaban
                    soal={{ id: s.id, tipe: teks.tipe as TipeSoal, prompt: teks.prompt, opsi: teks.opsi as OpsiSoal, bobot: s.bobot }}
                    jawaban={teks.jawaban}
                    kunci={teks.kunci}
                    pembahasan={teks.pembahasan}
                    hasil={hasil}
                    nama="anak"
                  />
                </>
              ) : (
                <p className="mt-3 text-sm text-gray-400">Soal ini tidak dapat ditampilkan.</p>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
