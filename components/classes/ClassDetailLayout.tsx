import type { ReactNode } from 'react'
import Link from 'next/link'
import { getAvatarColor } from '@/lib/avatarColor'

const DAY_NAMES: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
}

type SlotInfo = {
  slot_index: number
  day_of_week: number | null
  start_time: string | null
  subject_ids: string[]
}

type TutorSubjectRow = { subjectName: string; tutorName: string; tutorAvatarUrl?: string | null; isMainTutor: boolean; tutorIsActive?: boolean }

type StudentInfo = {
  id: string
  full_name: string
  avatar_url?: string | null
  href?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

/**
 * Shared class-detail hero + sidebar, used identically by the admin page and
 * both tutor POVs (main tutor / co-subject tutor). Rendered once here so the
 * three call sites can't drift out of visual sync the way hand-duplicated
 * copies repeatedly did.
 */
export default function ClassDetailLayout({
  breadcrumb,
  className,
  level,
  classType,
  isActive,
  jenisLabel,
  semester,
  academicYear,
  startDate,
  endDate,
  fmtDate,
  classSlots,
  subjectMap,
  tutorsBySubject,
  enrolledStudents,
  actions,
  children,
}: {
  breadcrumb: ReactNode
  className: string
  level: string | null
  classType: string | null
  isActive: boolean
  jenisLabel: string
  semester: number | null
  academicYear: string | null
  startDate: string | null
  endDate: string | null
  fmtDate: (iso: string) => string
  classSlots: SlotInfo[]
  subjectMap: Map<string, string>
  tutorsBySubject: TutorSubjectRow[]
  enrolledStudents: StudentInfo[]
  actions?: ReactNode
  children: ReactNode
}) {
  const semesterLabel = semester ? `SM ${semester}${academicYear ? ` ${academicYear}` : ''}` : '—'

  // Group by subject so a substitute covering the same subject as the main
  // tutor shows up alongside them under one heading, instead of a duplicate
  // subject block of its own.
  const tutorsBySubjectGrouped = tutorsBySubject.reduce<{ subjectName: string; tutors: { tutorName: string; tutorAvatarUrl: string | null; isMainTutor: boolean; tutorIsActive: boolean }[] }[]>(
    (groups, row) => {
      let group = groups.find(g => g.subjectName === row.subjectName)
      if (!group) {
        group = { subjectName: row.subjectName, tutors: [] }
        groups.push(group)
      }
      group.tutors.push({ tutorName: row.tutorName, tutorAvatarUrl: row.tutorAvatarUrl ?? null, isMainTutor: row.isMainTutor, tutorIsActive: row.tutorIsActive ?? true })
      return groups
    },
    []
  )
  for (const group of tutorsBySubjectGrouped) {
    group.tutors.sort((a, b) => Number(b.isMainTutor) - Number(a.isMainTutor))
  }

  const infoRows = [
    { label: 'Tipe', value: classType === 'group' ? 'Grup' : classType === 'private' ? 'Privat' : classType === 'yayasan' ? 'Yayasan' : '—' },
    { label: 'Jenjang', value: level ?? '—' },
    { label: 'Jenis', value: jenisLabel },
    { label: 'Semester', value: semesterLabel },
    { label: 'Tanggal Mulai', value: startDate ? fmtDate(startDate) : '—' },
    { label: 'Tanggal Selesai', value: endDate ? fmtDate(endDate) : '—' },
  ]

  return (
    <div className="space-y-5">
      {breadcrumb}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Kolom utama — min-w-0 keeps this grid track pinned to 1fr instead
            of growing to fit wide content (e.g. the nowrap filter row),
            which would otherwise widen the whole layout. */}
        <div className="space-y-4 min-w-0">
          <div className="bg-white rounded-2xl shadow ring-1 ring-gray-900/5 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900">{className}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {enrolledStudents.length > 0 && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Siswa Terdaftar <span className="text-gray-600 font-normal normal-case">({enrolledStudents.length})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {enrolledStudents.map(s => {
                    const avatar = s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.full_name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-blue-700">{getInitials(s.full_name)}</span>
                      </div>
                    )
                    return s.href ? (
                      <Link
                        key={s.id}
                        href={s.href}
                        className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        {avatar}
                        <span className="text-sm text-gray-700">{s.full_name}</span>
                      </Link>
                    ) : (
                      <div key={s.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                        {avatar}
                        <span className="text-sm text-gray-700">{s.full_name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {children}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Detail Kelas
            </p>
            <div className="grid grid-cols-[max-content_1rem_1fr] gap-y-1.5 text-sm">
              {infoRows.map(({ label, value }) => (
                <div key={label} className="contents">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-gray-300 text-center">:</span>
                  <span className="text-gray-800 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {classSlots.length > 0 && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Jadwal Mingguan
              </p>
              <div className="space-y-1.5">
                {classSlots.map(slot => {
                  const slotSubject = (slot.subject_ids ?? []).map(id => subjectMap.get(id)).filter(Boolean).join(', ') || '—'
                  return (
                    <div key={slot.slot_index} className="grid grid-cols-[3.25rem_1fr] gap-x-2 text-sm">
                      <span className="font-medium text-gray-700">{slot.day_of_week !== null ? DAY_NAMES[slot.day_of_week] : '—'}</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 tabular-nums">{slot.start_time ? slot.start_time.slice(0, 5) : '—'}</span>
                        <span className="text-gray-800 text-right">{slotSubject}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {tutorsBySubjectGrouped.length > 0 && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tutor
              </p>
              <div className="divide-y divide-gray-100">
                {tutorsBySubjectGrouped.map(group => (
                  <div key={group.subjectName} className="py-2 first:pt-0 last:pb-0 space-y-0.5">
                    <p className="text-sm font-medium text-gray-800">{group.subjectName}</p>
                    {group.tutors.map(t => (
                      <div key={t.tutorName} className="flex items-center justify-between mt-0.5 gap-2">
                        <span className="text-sm text-gray-400">{t.isMainTutor ? 'Utama' : 'Pengganti'}</span>
                        <span className="flex items-center gap-1.5">
                          {t.tutorAvatarUrl ? (
                            <img src={t.tutorAvatarUrl} alt={t.tutorName} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(t.tutorName)}`}>
                              <span className="text-[9px] font-semibold text-white">{getInitials(t.tutorName)}</span>
                            </div>
                          )}
                          <span className="text-sm text-gray-700">{t.tutorName}</span>
                          {!t.tutorIsActive && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                              Nonaktif
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {actions && (
            <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Action
              </p>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
