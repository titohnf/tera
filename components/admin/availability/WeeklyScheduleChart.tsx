const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const SESSION_DURATION_MIN = 90

const CLASS_PALETTE = [
  'bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500',
  'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
]

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export type WeeklyScheduleChartProps = {
  availability: { day: number; startTime: string; endTime: string }[]
  classes: { day: number; classId: string; subjectName: string; startMin: number | null }[]
}

export default function WeeklyScheduleChart({ availability, classes }: WeeklyScheduleChartProps) {
  const availByDay = new Map<number, { startTime: string; endTime: string }>()
  for (const a of availability) availByDay.set(a.day, a)

  const classByDay = new Map<number, WeeklyScheduleChartProps['classes']>()
  for (const c of classes) {
    if (!classByDay.has(c.day)) classByDay.set(c.day, [])
    classByDay.get(c.day)!.push(c)
  }

  const classColorMap = new Map<string, string>()
  ;[...new Set(classes.map(c => c.classId))].forEach((id, i) => {
    classColorMap.set(id, CLASS_PALETTE[i % CLASS_PALETTE.length])
  })

  const days = [0, 1, 2, 3, 4, 5, 6].filter(d => availByDay.has(d) || classByDay.has(d))

  if (days.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-10">Belum ada ketersediaan atau jadwal kelas.</p>
  }

  const rangeStart = Math.floor(Math.min(...days.map(d => {
    const a = availByDay.get(d)
    return a ? timeToMinutes(a.startTime) : 999
  }).filter(v => v < 999)) / 60) * 60

  const rangeEnd = Math.ceil(Math.max(...days.map(d => {
    const a = availByDay.get(d)
    const dayClasses = classByDay.get(d) ?? []
    const classEnd = dayClasses.map(c => c.startMin !== null ? c.startMin + SESSION_DURATION_MIN : 0)
    return Math.max(a ? timeToMinutes(a.endTime) : 0, ...classEnd)
  })) / 60) * 60

  const totalMin = rangeEnd - rangeStart
  const leftPct = (min: number) => `${((min - rangeStart) / totalMin) * 100}%`
  const widthPct = (dur: number) => `${(dur / totalMin) * 100}%`
  const hours: number[] = []
  for (let h = rangeStart / 60; h <= rangeEnd / 60; h++) hours.push(h)
  const ROW_H = 44

  return (
    <div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 480 }}>
          <div className="relative ml-20 mb-2" style={{ height: 16 }}>
            {hours.map(h => (
              <span
                key={h}
                className="absolute text-[10px] text-gray-400 -translate-x-1/2"
                style={{ left: leftPct(h * 60) }}
              >
                {h.toString().padStart(2, '0')}:00
              </span>
            ))}
          </div>

          <div className="space-y-1.5">
            {days.map(day => {
              const avail = availByDay.get(day)
              const dayClasses = classByDay.get(day) ?? []
              return (
                <div key={day} className="flex items-center gap-2">
                  <div className="w-20 shrink-0 text-right">
                    <span className="text-sm font-medium text-gray-600">{DAYS_FULL[day]}</span>
                  </div>
                  <div className="flex-1 relative rounded overflow-hidden bg-slate-100" style={{ height: ROW_H }}>
                    {hours.map(h => (
                      <div
                        key={h}
                        className="absolute top-0 bottom-0 border-l border-white/60"
                        style={{ left: leftPct(h * 60) }}
                      />
                    ))}
                    {avail && (
                      <div
                        className="absolute top-0 bottom-0 bg-green-100 border-x border-green-300"
                        style={{
                          left: leftPct(timeToMinutes(avail.startTime)),
                          width: widthPct(timeToMinutes(avail.endTime) - timeToMinutes(avail.startTime)),
                        }}
                      />
                    )}
                    {dayClasses.map((cls, i) => {
                      if (cls.startMin === null) return null
                      const color = classColorMap.get(cls.classId) ?? 'bg-blue-500'
                      return (
                        <div
                          key={i}
                          className={`absolute top-1 bottom-1 ${color} rounded px-2 flex items-center overflow-hidden`}
                          style={{ left: leftPct(cls.startMin), width: widthPct(SESSION_DURATION_MIN) }}
                        >
                          <p className="text-[11px] text-white font-semibold truncate leading-tight">{cls.subjectName}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />
          <span className="text-xs text-gray-500">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-xs text-gray-500">Kelas aktif (90 mnt)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-100" />
          <span className="text-xs text-gray-500">Tidak tersedia</span>
        </div>
      </div>
    </div>
  )
}
