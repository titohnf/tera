export interface SessionCounts {
  topic: string | null
  hasMaterials: boolean
  hasAssessments: boolean
  hasAttendance: boolean
  hasNotes: boolean
  hasGradedAssessments: boolean
}

function Chip({
  active,
  label,
  activeClass,
  inactiveClass,
  maxW,
}: {
  active: boolean
  label: string
  activeClass: string
  inactiveClass: string
  maxW?: string
}) {
  return active ? (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${activeClass} ${maxW ?? ''}`}>
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className={maxW ? 'truncate' : ''}>{label}</span>
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${inactiveClass}`}>
      <span className="w-3 h-3 flex items-center justify-center shrink-0 leading-none">–</span>
      {label}
    </span>
  )
}

export default function SessionStatusChips({
  status,
  counts,
}: {
  status: string
  counts: SessionCounts
}) {
  if (status === 'cancelled') return null

  const activeClass = 'bg-green-50 text-green-700 border-green-200'
  const inactiveClass = 'bg-gray-50 text-gray-500 border-gray-200'

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <Chip active={!!counts.topic} label="Topik" activeClass={activeClass} inactiveClass={inactiveClass} />
      <Chip active={counts.hasMaterials} label="Materi" activeClass={activeClass} inactiveClass={inactiveClass} />
      <Chip active={counts.hasAttendance} label="Presensi" activeClass={activeClass} inactiveClass={inactiveClass} />
      <Chip active={counts.hasNotes} label="Catatan" activeClass={activeClass} inactiveClass={inactiveClass} />
      <Chip active={counts.hasGradedAssessments} label="Asesmen & Nilai" activeClass={activeClass} inactiveClass={inactiveClass} />
    </div>
  )
}
