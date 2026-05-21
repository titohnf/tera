'use client'

interface Props {
  classLevel: string | null
  tutorName: string | null
  date: Date
  durationMinutes: number
  location: string | null
  subjects: string | null
  displayStatus: string
}

export default function SessionInfoCard({
  classLevel: _classLevel,
  tutorName,
  date,
  durationMinutes,
  location,
  subjects,
}: Props) {
  const startStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const endStr = new Date(date.getTime() + durationMinutes * 60_000)
    .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeRange = `${startStr} – ${endStr} (${durationMinutes} menit)`

  const infoRows = [
    { label: 'Tutor',          value: tutorName ?? '—' },
    { label: 'Mata Pelajaran', value: subjects ?? '—' },
    { label: 'Tanggal',        value: dateStr },
    { label: 'Waktu',          value: timeRange },
    { label: 'Lokasi',         value: location ?? '—' },
  ]

  return (
    <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
      {/* Title */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Detail Sesi
      </p>

      {/* Info — label kiri, nilai kanan */}
      <div className="grid grid-cols-[max-content_1rem_1fr] gap-y-1.5 text-sm mb-4">
        {infoRows.map(({ label, value }) => (
          <div key={label} className="contents">
            <span className="text-gray-400">{label}</span>
            <span className="text-gray-300 text-center">:</span>
            <span className="text-gray-800 text-right">{value}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
