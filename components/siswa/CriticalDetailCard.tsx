import type { StudentCriticalResult, StudentCriticalInput } from '@/lib/studentCritical'
import { interpolateCriticalMessage } from '@/lib/studentCritical'

interface CriticalDetailCardProps {
  result: StudentCriticalResult
  input: StudentCriticalInput
}

const LEVEL_META: Record<number, { label: string; border: string; headerBg: string; headerText: string; badgeBg: string; badgeText: string }> = {
  1: {
    label: 'Risiko Churn',
    border: 'border-red-200',
    headerBg: 'bg-red-50',
    headerText: 'text-red-800',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
  },
  2: {
    label: 'Masalah Layanan',
    border: 'border-orange-200',
    headerBg: 'bg-orange-50',
    headerText: 'text-orange-800',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
  },
  3: {
    label: 'Masalah Keuangan',
    border: 'border-yellow-200',
    headerBg: 'bg-yellow-50',
    headerText: 'text-yellow-800',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-700',
  },
}

const URGENCY_LABEL: Record<string, string> = {
  today: 'Hari ini',
  'this-week': 'Minggu ini',
}

export default function CriticalDetailCard({ result, input }: CriticalDetailCardProps) {
  if (!result.isCritical) return null

  const topLevel = result.highestLevel!
  const meta = LEVEL_META[topLevel]

  return (
    <div className={`rounded-xl border ${meta.border} overflow-hidden mb-6`}>
      <div className={`px-4 py-3 ${meta.headerBg} flex items-center justify-between`}>
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
        {result.criticalConditions.map(cond => {
          const condMeta = LEVEL_META[cond.level]
          const description = interpolateCriticalMessage(cond, input)

          return (
            <div key={cond.code} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${condMeta.badgeBg} ${condMeta.badgeText}`}>
                      {cond.code}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{cond.label}</span>
                    <span className="text-xs text-gray-400">{URGENCY_LABEL[cond.urgency]}</span>
                  </div>
                  <p className="text-sm text-gray-600">{description}</p>
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
        })}
      </div>

      {result.warningConditions.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
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
