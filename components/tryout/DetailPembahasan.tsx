import IsiSoal from '@/components/belajar/IsiSoal'
import { RincianJawaban } from '@/components/belajar/TinjauanSesi'
import PenelusurSoal, { type HasilButir, type ItemSoal } from '@/components/tryout/PenelusurSoal'
import type { OpsiSoal, TipeSoal } from '@/lib/belajar/tipe-soal'
import type { DataTryOut, TeksSoal } from '@/lib/reports/tryout-data'
import { tanggalWib } from '@/lib/tryout/paket'
import { tanggalPanjang } from '@/lib/waktu-relatif'

const EPS = 1e-6
const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Gambar dibatasi ukurannya (masih bisa diperbesar bila diketuk): soal bergambar tidak boleh memenuhi layar. */
const GAMBAR_SOAL = '[&_button]:max-w-sm [&_img]:max-h-64 [&_img]:object-contain'
const GAMBAR_PILIHAN = '[&_button]:max-w-[12rem] [&_img]:max-h-40 [&_img]:object-contain'

const teksSama = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string' && a.trim() === b.trim()

function Pembahasan({ teks }: { teks: string | null }) {
  if (!teks) return null
  return (
    <div className="mt-4 rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold text-gray-500">Pembahasan</p>
      <IsiSoal text={teks} className="mt-1 text-sm leading-relaxed text-gray-700" />
    </div>
  )
}

/** Isi satu kartu soal: soal, pilihan (dengan penanda jawaban anak dan kunci), dan pembahasan. */
function IsiKartu({ teks, hasil, id, bobot }: { teks: TeksSoal; hasil: HasilButir; id: string; bobot: number }) {
  const pilihan = (teks.opsi as { choices?: unknown } | null)?.choices
  const daftar = Array.isArray(pilihan) ? pilihan.filter((v): v is string => typeof v === 'string') : []
  const bisaDitandai = teks.tipe === 'mcq_single' && daftar.length > 0 && daftar.some((p) => teksSama(p, teks.kunci))
  const bergambar = daftar.some((p) => /\[gambar:/i.test(p))

  return (
    <div>
      <IsiSoal text={teks.prompt} className={`text-[15px] leading-relaxed text-gray-900 ${GAMBAR_SOAL}`} />

      {bisaDitandai ? (
        <>
          <ol className={`mt-4 grid gap-2 ${bergambar ? 'sm:grid-cols-2' : ''}`}>
            {daftar.map((p, i) => {
              const anak = teksSama(p, teks.jawaban)
              const kunci = teksSama(p, teks.kunci)
              const bingkai = kunci ? 'border-emerald-300 bg-emerald-50' : anak ? 'border-rose-300 bg-rose-50' : 'border-gray-200 bg-white'
              const huruf = kunci ? 'bg-emerald-600 text-white' : anak ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
              return (
                <li key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${bingkai}`}>
                  <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${huruf}`}>{String.fromCharCode(65 + i)}</span>
                  <span className={`min-w-0 flex-1 text-sm text-gray-800 ${GAMBAR_PILIHAN}`}>
                    <IsiSoal text={p} />
                    {(anak || kunci) && (
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {anak && <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-gray-200">Jawaban anak</span>}
                        {kunci && <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">Jawaban benar</span>}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ol>
          {hasil === 'belum' && <p className="mt-3 text-sm text-gray-500">Soal ini dilewati.</p>}
          <Pembahasan teks={teks.pembahasan} />
        </>
      ) : (
        <>
          {daftar.length > 0 && (
            <ol className={`mt-3 space-y-1.5 text-sm text-gray-700 ${GAMBAR_PILIHAN}`}>
              {daftar.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 shrink-0 font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                  <span className="min-w-0 flex-1">
                    <IsiSoal text={p} />
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className={GAMBAR_PILIHAN}>
            <RincianJawaban
              soal={{ id, tipe: teks.tipe as TipeSoal, prompt: teks.prompt, opsi: teks.opsi as OpsiSoal, bobot }}
              jawaban={teks.jawaban}
              kunci={teks.kunci}
              pembahasan={teks.pembahasan}
              hasil={hasil}
              nama="anak"
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Detail dan pembahasan satu try out: ringkasan hasil, lalu soal satu per nomor dengan jawaban anak,
 * jawaban benar, dan pembahasannya. Tanpa analisis per topik (itu di Laporan Try Out keluarga).
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

  const hitung = { benar: 0, sebagian: 0, salah: 0, belum: 0 }
  const items: ItemSoal[] = [...data.soal]
    .sort((a, b) => a.nomor - b.nomor)
    .map((s) => {
      const teks = data.teks[s.id]
      const dijawab = teks && teks.jawaban !== null && teks.jawaban !== undefined
      const skor = skorSoal.get(s.id) ?? 0
      const hasil: HasilButir = !dijawab ? 'belum' : skor >= s.bobot - EPS ? 'benar' : skor <= EPS ? 'salah' : 'sebagian'
      hitung[hasil] += 1
      return {
        nomor: s.nomor,
        hasil,
        isi: teks ? <IsiKartu teks={teks} hasil={hasil} id={s.id} bobot={s.bobot} /> : <p className="text-sm text-gray-400">Soal ini tidak dapat ditampilkan.</p>,
      }
    })

  const ringkas: { label: string; n: number; kelas: string }[] = [
    { label: 'Benar', n: hitung.benar, kelas: 'bg-emerald-50 text-emerald-700' },
    { label: 'Sebagian', n: hitung.sebagian, kelas: 'bg-amber-50 text-amber-700' },
    { label: 'Salah', n: hitung.salah, kelas: 'bg-rose-50 text-rose-700' },
    { label: 'Dilewati', n: hitung.belum, kelas: 'bg-gray-100 text-gray-600' },
  ]

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500">Detail dan Pembahasan</p>
            <h1 className="mt-0.5 text-lg font-semibold leading-snug tracking-tight text-gray-900">{data.judul}</h1>
            {dikirim && <p className="mt-0.5 text-sm text-gray-500">Dikerjakan {tanggalPanjang(tanggalWib(dikirim))}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">Skor akhir</p>
            <p className="text-3xl font-semibold tabular-nums leading-tight text-gray-900">{nilai !== null ? fmt(nilai) : '—'}</p>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {ringkas.map((r) => (
            <li key={r.label} className={`rounded-lg px-2 py-1.5 text-center ${r.kelas}`}>
              <p className="text-lg font-semibold tabular-nums leading-tight">{r.n}</p>
              <p className="text-[11px] font-medium">{r.label}</p>
            </li>
          ))}
        </ul>
      </div>

      <PenelusurSoal items={items} />
    </div>
  )
}
