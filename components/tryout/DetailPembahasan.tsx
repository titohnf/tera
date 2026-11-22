import { Check, Lightbulb, X } from 'lucide-react'
import IsiSoal from '@/components/belajar/IsiSoal'
import { RincianJawaban } from '@/components/belajar/TinjauanSesi'
import PenelusurSoal, { LABEL_HASIL, type HasilButir, type ItemSoal } from '@/components/tryout/PenelusurSoal'
import type { OpsiSoal, TipeSoal } from '@/lib/belajar/tipe-soal'
import type { DataTryOut, TeksSoal } from '@/lib/reports/tryout-data'
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

  const total = items.length
  const segmen: { kunci: HasilButir; n: number; batang: string; titik: string }[] = [
    { kunci: 'benar', n: hitung.benar, batang: 'bg-emerald-500', titik: 'bg-emerald-500' },
    { kunci: 'sebagian', n: hitung.sebagian, batang: 'bg-amber-400', titik: 'bg-amber-400' },
    { kunci: 'salah', n: hitung.salah, batang: 'bg-rose-400', titik: 'bg-rose-400' },
    { kunci: 'belum', n: hitung.belum, batang: 'bg-gray-300', titik: 'bg-gray-300' },
  ]

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-900/5 sm:p-5">
        <div className="flex items-center gap-4 sm:gap-5">
          <CincinSkor nilai={nilai} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Detail dan Pembahasan</p>
            <h1 className="mt-1.5 text-lg font-semibold leading-snug tracking-tight text-gray-900 sm:text-xl">{data.judul}</h1>
            {dikirim && (
              <p className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500">
                <span>
                  Dikerjakan <b className="font-semibold text-gray-900">{tanggalPanjang(tanggalWib(dikirim))}</b>
                </span>
                {mulai && new Date(dikirim) > new Date(mulai) && (
                  <span>
                    Waktu pengerjaan <b className="font-semibold text-gray-900">{lamaTeks(new Date(dikirim).getTime() - new Date(mulai).getTime())}</b> ({jamWib(mulai)}–{jamWib(dikirim)} WIB)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div
              role="img"
              aria-label={segmen.map((x) => `${LABEL_HASIL[x.kunci]} ${x.n}`).join(', ')}
              className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-gray-100"
            >
              {segmen.filter((x) => x.n > 0).map((x) => (
                <span key={x.kunci} className={`h-full first:rounded-l-full last:rounded-r-full ${x.batang}`} style={{ width: `${(x.n / total) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              {segmen.map((x) => (
                <li key={x.kunci} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${x.titik}`} aria-hidden />
                  <span className="text-gray-600">{LABEL_HASIL[x.kunci]}</span>
                  <span className="ml-auto font-semibold tabular-nums text-gray-900 sm:ml-0">{x.n}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <PenelusurSoal items={items} />
    </div>
  )
}

/** Skor akhir sebagai cincin: terisi sebanyak skornya, berwarna menurut tingkatnya. */
function CincinSkor({ nilai }: { nilai: number | null }) {
  const ukuran = 88
  const tebal = 8
  const r = (ukuran - tebal) / 2
  const keliling = 2 * Math.PI * r
  const persen = nilai === null ? 0 : Math.min(100, Math.max(0, nilai))
  const warna = nilai === null ? 'text-gray-300' : persen >= 75 ? 'text-emerald-500' : persen >= 50 ? 'text-amber-500' : 'text-rose-500'
  return (
    <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }} role="img" aria-label={nilai !== null ? `Skor akhir ${fmt(nilai)} dari 100` : 'Skor akhir belum tersedia'}>
      <svg width={ukuran} height={ukuran} viewBox={`0 0 ${ukuran} ${ukuran}`} className={`-rotate-90 ${warna}`} aria-hidden>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" strokeWidth={tebal} className="stroke-gray-100" />
        {persen > 0 && (
          <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="currentColor" strokeWidth={tebal} strokeLinecap="round" strokeDasharray={`${(persen / 100) * keliling} ${keliling}`} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold tabular-nums leading-none text-gray-900">{nilai !== null ? fmt(nilai) : '—'}</span>
        <span className="mt-1 text-[11px] text-gray-500">skor akhir</span>
      </div>
    </div>
  )
}
