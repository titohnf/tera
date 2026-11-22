import { Check, Lightbulb, X } from 'lucide-react'
import IsiSoal from '@/components/belajar/IsiSoal'
import RumusTeks from '@/components/belajar/RumusTeks'
import { RincianJawaban } from '@/components/belajar/TinjauanSesi'
import { LABEL_HASIL, type HasilButir } from '@/components/tryout/hasil-butir'
import PenelusurSoal, { type ItemSoal } from '@/components/tryout/PenelusurSoal'
import type { OpsiSoal, TipeSoal } from '@/lib/belajar/tipe-soal'
import type { DataTryOut, TeksSoal } from '@/lib/reports/tryout-data'
import { tahunAjaran } from '@/lib/tryout/judul'
import { tanggalWib } from '@/lib/tryout/paket'
import { tanggalPanjang } from '@/lib/waktu-relatif'

const EPS = 1e-6
const fmt = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Batas ukuran gambar di dalam soal. Pemilihnya sengaja sempit (`&>button`, `button>img`) supaya
 * tidak mengenai jendela perbesar milik IsiSoal; pemilih `_img` yang lebar ikut membatasi gambar
 * yang diperbesar sehingga ia tampak sama saja. Tanpa `w-full`, gambar tegak tidak dilebarkan
 * mengikuti kotaknya (kotak kosong di kiri-kanan gambar).
 */
const GAMBAR_SOAL = '[&>button]:max-w-full [&_button>img]:w-auto [&_button>img]:max-w-full [&_button>img]:max-h-[32rem]'
const GAMBAR_PILIHAN = '[&>button]:max-w-full [&_button>img]:w-auto [&_button>img]:max-w-full [&_button>img]:max-h-72'

/** "1 jam 5 menit", "42 menit 10 detik", atau "35 detik". */
function lamaTeks(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const j = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const d = total % 60
  if (j > 0) return m > 0 ? `${j} jam ${m} menit` : `${j} jam`
  if (m > 0) return d > 0 ? `${m} menit ${d} detik` : `${m} menit`
  return `${d} detik`
}

const jamWib = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const teksSama = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string' && a.trim() === b.trim()
/** Apakah pilihan `p` termasuk dalam `nilai` (satu teks, atau daftar teks untuk pilihan jamak). */
const termasuk = (nilai: unknown, p: string) => (Array.isArray(nilai) ? nilai.some((v) => teksSama(v, p)) : teksSama(nilai, p))

/**
 * Prompt soal. Butir hasil impor memisahkan bacaan dan pertanyaannya dengan baris `[pertanyaan]`;
 * penanda itu bukan bagian soal, jadi diganti garis pemisah.
 */
function Prompt({ teks }: { teks: string }) {
  const bagian = teks.split(/^[ \t]*\[pertanyaan\][ \t]*$/im).map((b) => b.trim()).filter(Boolean)
  return (
    <div>
      {bagian.map((b, i) => (
        <div key={i} className={i > 0 ? 'mt-4 border-t border-gray-100 pt-4' : ''}>
          <IsiSoal text={b} className={`text-[15px] leading-relaxed text-gray-900 ${GAMBAR_SOAL}`} />
        </div>
      ))}
    </div>
  )
}

function Pembahasan({ teks }: { teks: string | null }) {
  if (!teks) return null
  return (
    <div className="mt-5 rounded-xl border-l-4 border-slate-300 bg-slate-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <Lightbulb size={16} className="text-slate-500" aria-hidden />
        Pembahasan
      </p>
      <IsiSoal text={teks} className="mt-2 text-[15px] leading-7 text-gray-700" />
    </div>
  )
}

/** Isi satu kartu soal: soal, pilihan (dengan penanda jawaban anak dan kunci), dan pembahasan. */
export function IsiKartu({ teks, hasil, id, bobot }: { teks: TeksSoal; hasil: HasilButir; id: string; bobot: number }) {
  const pilihan = (teks.opsi as { choices?: unknown } | null)?.choices
  const daftar = Array.isArray(pilihan) ? pilihan.filter((v): v is string => typeof v === 'string') : []
  const bisaDitandai = (teks.tipe === 'mcq_single' || teks.tipe === 'mcq_multi') && daftar.length > 0 && daftar.some((p) => termasuk(teks.kunci, p))
  const bergambar = daftar.some((p) => /\[gambar:/i.test(p))

  // Kisi pernyataan: tiap pernyataan dengan jawaban anak dan kuncinya (Benar/Salah menurut `answer_labels`).
  const kisi = (() => {
    if (teks.tipe !== 'statement_grid') return null
    const o = teks.opsi as { statements?: unknown; answer_labels?: unknown } | null
    const pernyataan = Array.isArray(o?.statements) ? (o.statements as unknown[]).filter((v): v is string => typeof v === 'string') : []
    const label = Array.isArray(o?.answer_labels) && o.answer_labels.length >= 2 ? (o.answer_labels as string[]) : ['Benar', 'Salah']
    const kunciBaris = (teks.kunci as { answers?: unknown } | null)?.answers
    if (pernyataan.length === 0 || !Array.isArray(kunciBaris) || !Array.isArray(teks.jawaban)) return null
    const nama = (v: unknown) => (v === true ? label[0] : v === false ? label[1] : '—')
    return pernyataan.map((pernyataan, i) => ({
      pernyataan,
      anak: nama((teks.jawaban as unknown[])[i]),
      kunci: nama(kunciBaris[i]),
      cocok: (teks.jawaban as unknown[])[i] === kunciBaris[i],
    }))
  })()

  return (
    <div>
      <Prompt teks={teks.prompt} />

      {kisi ? (
        <>
          <ul className="mt-4 space-y-2">
            {kisi.map((r, i) => (
              <li key={i} className={`rounded-xl border p-3 ${r.cocok ? 'border-emerald-300 bg-emerald-50/70' : 'border-rose-300 bg-rose-50/70'}`}>
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-gray-800">
                    <RumusTeks text={r.pernyataan} />
                  </p>
                  {r.cocok ? <Check size={20} strokeWidth={2.5} className="mt-0.5 shrink-0 text-emerald-600" aria-label="Benar" /> : <X size={20} strokeWidth={2.5} className="mt-0.5 shrink-0 text-rose-600" aria-label="Salah" />}
                </div>
                <p className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">Jawaban anak: {r.anak}</span>
                  {!r.cocok && <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Jawaban benar: {r.kunci}</span>}
                </p>
              </li>
            ))}
          </ul>
          <Pembahasan teks={teks.pembahasan} />
        </>
      ) : bisaDitandai ? (
        <>
          <ol className={`mt-4 grid gap-2 ${bergambar ? 'sm:grid-cols-2' : ''}`}>
            {daftar.map((p, i) => {
              const anak = termasuk(teks.jawaban, p)
              const kunci = termasuk(teks.kunci, p)
              const bingkai = kunci ? 'border-emerald-300 bg-emerald-50/70' : anak ? 'border-rose-300 bg-rose-50/70' : 'border-gray-200 bg-white'
              const huruf = kunci ? 'bg-emerald-600 text-white' : anak ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600'
              return (
                <li key={i} className={`flex items-start gap-3 rounded-xl border p-3 ${bingkai}`}>
                  <span className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${huruf}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="min-w-0 flex-1 text-[15px] leading-relaxed text-gray-800">
                    <IsiSoal text={p} className={GAMBAR_PILIHAN} />
                    {(anak || kunci) && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {anak && <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">Jawaban anak</span>}
                        {kunci && <span className="rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Jawaban benar</span>}
                      </span>
                    )}
                  </span>
                  {kunci && <Check size={20} strokeWidth={2.5} className="mt-1 shrink-0 text-emerald-600" aria-label="Jawaban benar" />}
                  {!kunci && anak && <X size={20} strokeWidth={2.5} className="mt-1 shrink-0 text-rose-600" aria-label="Jawaban anak, salah" />}
                </li>
              )
            })}
          </ol>
          {teks.tipe === 'mcq_multi' && <p className="mt-3 text-xs text-gray-500">Soal ini punya lebih dari satu jawaban benar.</p>}
          {hasil === 'belum' && <p className="mt-3 text-sm text-gray-500">Anak melewati soal ini.</p>}
          <Pembahasan teks={teks.pembahasan} />
        </>
      ) : (
        <>
          {daftar.length > 0 && (
            <ol className="mt-3 space-y-1.5 text-sm text-gray-700">
              {daftar.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 shrink-0 font-medium text-gray-500">{String.fromCharCode(65 + i)}.</span>
                  <span className="min-w-0 flex-1">
                    <IsiSoal text={p} className={GAMBAR_PILIHAN} />
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div>
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
  mulai,
}: {
  data: DataTryOut
  attemptId: string
  nilai: number | null
  dikirim?: string
  /** Saat anak mulai mengerjakan; bersama `dikirim` memberi lama pengerjaan. */
  mulai?: string | null
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

  const ringkas: { kunci: HasilButir; n: number; kelas: string }[] = [
    { kunci: 'benar', n: hitung.benar, kelas: 'bg-emerald-50 text-emerald-700' },
    { kunci: 'sebagian', n: hitung.sebagian, kelas: 'bg-amber-50 text-amber-700' },
    { kunci: 'salah', n: hitung.salah, kelas: 'bg-rose-50 text-rose-700' },
    { kunci: 'belum', n: hitung.belum, kelas: 'bg-gray-100 text-gray-600' },
  ]

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Detail dan Pembahasan</p>
            <h1 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-gray-900 sm:text-xl">{data.judul}</h1>
            <p className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {data.info.jenjang}
                {data.info.kelas ? ` · Kelas ${data.info.kelas}` : ''} · TA {tahunAjaran(data.info.bukaPada ?? dikirim ?? Date.now())}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {[data.info.menit ? `${data.info.menit} menit` : null, data.soal.length ? `${data.soal.length} soal` : null].filter(Boolean).join(' · ')}
              </span>
            </p>
            {dikirim && (
              <p className="mt-2.5 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                <span>
                  Dikerjakan <b className="font-semibold text-gray-900">{tanggalPanjang(tanggalWib(dikirim))}</b>
                </span>
                {mulai && new Date(dikirim) > new Date(mulai) && (
                  <span>
                    Waktu pengerjaan <b className="font-semibold text-gray-900">{lamaTeks(new Date(dikirim).getTime() - new Date(mulai).getTime())}</b>{' '}
                    <span className="whitespace-nowrap">({jamWib(mulai)}–{jamWib(dikirim)} WIB)</span>
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">Skor akhir</p>
            <p className="text-4xl font-semibold tabular-nums leading-none tracking-tight text-gray-900">{nilai !== null ? fmt(nilai) : '—'}</p>
          </div>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ringkas.map((r) => (
            <li key={r.kunci} className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 ${r.kelas}`}>
              <span className="text-sm font-medium">{LABEL_HASIL[r.kunci]}</span>
              <span className="text-xl font-semibold tabular-nums leading-none">{r.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <PenelusurSoal items={items} />
    </div>
  )
}
