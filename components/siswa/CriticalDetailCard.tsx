import type { StudentCriticalResult, StudentCriticalInput, CriticalCondition } from '@/lib/studentCritical'
import { interpolateCriticalMessage } from '@/lib/studentCritical'

interface CriticalDetailCardProps {
  result: StudentCriticalResult
  input: StudentCriticalInput
}

/**
 * Latarnya putih untuk semua level — yang menandai derajatnya tinggal garis
 * tepi dan lencananya. Kartu ini kini duduk di kolom utama, berderet dengan
 * kartu identitas dan kartu tab yang sama-sama putih; blok berwarna penuh di
 * tengah deretan itu terbaca seperti galat halaman, bukan seperti keterangan.
 */
const LEVEL_META: Record<number, { label: string; border: string; badgeBg: string; badgeText: string }> = {
  1: {
    label: 'Risiko Churn',
    border: 'border-red-200',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  2: {
    label: 'Masalah Layanan',
    border: 'border-orange-200',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  3: {
    label: 'Masalah Keuangan',
    border: 'border-yellow-200',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
  },
}

/**
 * Peringatan bukan level 1/2/3 — `buildWarningCondition` menandainya level 3
 * semata supaya muat di tipe yang sama, bukan karena ia soal keuangan. Jadi ia
 * memakai warna netral sendiri, bukan LEVEL_META, agar tidak terbaca sebagai
 * "Masalah Keuangan" yang kuning.
 */
const WARNING_META = { badgeBg: 'bg-slate-200', badgeText: 'text-slate-600' }

const URGENCY_LABEL: Record<string, string> = {
  today: 'Hari ini',
  'this-week': 'Minggu ini',
}

function BarisKondisi({
  cond,
  input,
  badgeBg,
  badgeText,
}: {
  cond: CriticalCondition
  input: StudentCriticalInput
  badgeBg: string
  badgeText: string
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${badgeBg} ${badgeText}`}>
              {cond.code}
            </span>
            <span className="text-sm font-medium text-gray-800">{cond.label}</span>
            <span className="text-xs text-gray-400">{URGENCY_LABEL[cond.urgency]}</span>
          </div>
          <p className="text-sm text-gray-600">{interpolateCriticalMessage(cond, input)}</p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-medium">Tindakan:</span> {cond.suggestedAction}
          </p>
        </div>
        <a
          href={cond.actionLink}
          className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Tangani →
        </a>
      </div>
    </div>
  )
}

/**
 * Kartu status siswa di kolom kanan halaman detail admin.
 *
 * Kartunya berdiri di atas peringatan saja, bukan cuma kondisi kritis. Dulu ia
 * membuka dengan `if (!result.isCritical) return null`, sementara `isCritical`
 * hanya menghitung `criticalConditions` — sehingga siswa dengan kehadiran 55%
 * dan tagihan telat tiga minggu menampilkan halaman yang sama persis dengan
 * siswa yang benar-benar bersih: kosong. Peringatannya hanya terlihat kalau
 * kebetulan ada kondisi kritis lain yang menyeret kartunya muncul, yaitu justru
 * saat ia paling tidak penting.
 *
 * Sekarang halaman tanpa kartu berarti satu hal saja, dan artinya bisa
 * dipercaya: tidak ada kondisi kritis MAUPUN peringatan.
 */
export default function CriticalDetailCard({ result, input }: CriticalDetailCardProps) {
  const adaPeringatan = result.warningConditions.length > 0
  if (!result.isCritical && !adaPeringatan) return null

  // Hanya peringatan: kartu yang sama, dinada abu-abu supaya tidak berteriak
  // sekeras kondisi kritis, dan diberi judul yang menyebut derajatnya.
  if (!result.isCritical) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Perlu Dipantau</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              Belum kritis
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {result.warningConditions.length} peringatan
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {result.warningConditions.map(w => (
            <BarisKondisi key={w.code} cond={w} input={input} {...WARNING_META} />
          ))}
        </div>
      </div>
    )
  }

  const meta = LEVEL_META[result.highestLevel!]

  return (
    <div className={`bg-white rounded-xl border ${meta.border} overflow-hidden`}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Siswa Butuh Perhatian</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.badgeBg} ${meta.badgeText}`}>
            {meta.label}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {result.criticalConditions.length} kondisi kritis
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {result.criticalConditions.map(cond => (
          <BarisKondisi
            key={cond.code}
            cond={cond}
            input={input}
            badgeBg={LEVEL_META[cond.level].badgeBg}
            badgeText={LEVEL_META[cond.level].badgeText}
          />
        ))}
      </div>

      {adaPeringatan && (
        <div className="border-t border-slate-100 px-4 py-2">
          <p className="text-xs text-gray-500 font-medium mb-1">Peringatan tambahan:</p>
          <div className="flex flex-wrap gap-2">
            {result.warningConditions.map(w => (
              <span key={w.code} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {w.code}: {w.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
