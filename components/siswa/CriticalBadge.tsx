import type { StudentCriticalResult } from '@/lib/studentCritical'

const LEVEL_STYLES: Record<number, { bg: string; text: string; dot: string }> = {
  1: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  2: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

export default function CriticalBadge({ result }: { result: StudentCriticalResult }) {
  if (!result.isCritical || !result.primaryCondition) return null

  const level = result.highestLevel!
  const style = LEVEL_STYLES[level]
  const extraCount = result.criticalConditions.length - 1
  const tooltip = 'Kondisi kritis:\n' + result.criticalConditions.map(c => `• ${c.label}`).join('\n')

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      title={tooltip}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {result.primaryCondition.label}
      {extraCount > 0 && <span className="opacity-60">+{extraCount}</span>}
    </span>
  )
}
