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

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <Chip
        active={!!counts.topic}
        label={counts.topic ? `Topik: ${counts.topic}` : 'Topik'}
        activeClass="bg-green-50 text-green-700 border-green-200 max-w-[180px]"
        inactiveClass="bg-amber-50 text-amber-600 border-amber-200"
        maxW="max-w-[180px]"
      />
      <Chip
        active={counts.hasMaterials}
        label="Materi"
        activeClass="bg-green-50 text-green-700 border-green-200"
        inactiveClass="bg-amber-50 text-amber-600 border-amber-200"
      />
      <Chip
        active={counts.hasAttendance}
        label="Presensi"
        activeClass="bg-green-50 text-green-700 border-green-200"
        inactiveClass="bg-red-50 text-red-600 border-red-200"
      />
      <Chip
        active={counts.hasNotes}
        label="Catatan"
        activeClass="bg-green-50 text-green-700 border-green-200"
        inactiveClass="bg-red-50 text-red-600 border-red-200"
      />
      <Chip
        active={counts.hasAssessments}
        label="Asesmen & Nilai"
        activeClass="bg-green-50 text-green-700 border-green-200"
        inactiveClass="bg-amber-50 text-amber-600 border-amber-200"
      />
    </div>
  )
}
