import type { SupabaseClient } from '@supabase/supabase-js'
import { stripClassUniqueTag } from '@/lib/format-class-name'

// Sessions are stored as scheduled_at in UTC; admin enters/reads times in
// WIB (Asia/Jakarta, UTC+7, no DST). Compute the WIB day boundaries in UTC
// the same way lib/actions/admin/sessions.ts does for creating sessions.
function wibDayRangeUtc(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, -7, 0, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d + 1, -7, 0, 0, 0))
  return { start, end }
}

export function todayWib(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return wib.toISOString().slice(0, 10)
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${DAY_NAMES[dayOfWeek]}, ${d} ${MONTH_NAMES[m - 1]} ${y}`
}

type SessionRow = {
  id: string
  scheduled_at: string
  status: string
  class_id: string
  classes: { name: string; class_type: string | null; level: string | null } | null
  subjects: { name: string } | null
  tutor: { id: string; full_name: string; nickname: string | null } | null
}

export type TutorGroup = {
  tutorId: string
  tutorName: string
  /** WhatsApp mention handle, e.g. "Tutor_Jannah" (no leading "@"). */
  tutorMention: string
  items: {
    time: string
    /** Full class name minus the internal uniqueness tag (used by the admin UI). */
    className: string
    /** Parent/tutor-facing label, e.g. "Kelas Privat Jasmine". */
    classLabel: string
    /** Grade + level, e.g. "4 SD". Null when the class has neither. */
    gradeLevel: string | null
    subjectName: string | null
  }[]
}

const CLASS_TYPE_LABELS: Record<string, string> = {
  private: 'Privat',
  group: 'Grup',
  yayasan: 'Yayasan',
}

/** First word of a name — the fallback when a profile has no nickname. */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

function shortName(profile: { full_name: string; nickname: string | null }): string {
  return profile.nickname?.trim() || firstName(profile.full_name)
}

/**
 * WhatsApp mentions are typed by hand in the group, so the handle has to be
 * predictable: the tutor's nickname when set, otherwise the first word of
 * their full name (e.g. "Rifka Fauziah Azis" -> "Tutor_Rifka").
 */
function tutorMentionHandle(tutor: { full_name: string; nickname: string | null }): string {
  return `Tutor_${shortName(tutor).replace(/\s+/g, '_')}`
}

/** "16:00" in WIB — toLocaleTimeString('id-ID') renders "16.00", which the message format doesn't use. */
function wibTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta',
  })
}

export async function getTutorGroupsForDate(admin: SupabaseClient, dateStr: string): Promise<TutorGroup[]> {
  const { start, end } = wibDayRangeUtc(dateStr)

  const { data: sessions } = await admin
    .from('sessions')
    .select(`
      id, scheduled_at, status, class_id,
      classes(name, class_type, level),
      subjects(name),
      tutor:profiles!tutor_id(id, full_name, nickname)
    `)
    .neq('status', 'cancelled')
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true }) as unknown as { data: SessionRow[] | null }

  // The message names the students ("Kelas Privat Jasmine", "Kelas Grup
  // Birru & Maryam") rather than echoing the internal class name, so pull the
  // active enrollments for the classes scheduled today.
  const classIds = [...new Set((sessions ?? []).map(s => s.class_id).filter(Boolean))]
  const studentsByClass = new Map<string, { full_name: string; nickname: string | null; grade: number | null }[]>()
  if (classIds.length > 0) {
    const { data: enrollments } = await admin
      .from('class_students')
      .select('class_id, profiles!student_id(full_name, nickname, grade)')
      .in('class_id', classIds)
      .eq('is_active', true) as unknown as {
        data: { class_id: string; profiles: { full_name: string; nickname: string | null; grade: number | null } | null }[] | null
      }
    for (const e of enrollments ?? []) {
      if (!e.profiles) continue
      const list = studentsByClass.get(e.class_id) ?? []
      list.push(e.profiles)
      studentsByClass.set(e.class_id, list)
    }
  }

  const groups = new Map<string, TutorGroup>()
  for (const s of sessions ?? []) {
    if (!s.tutor) continue

    const students = studentsByClass.get(s.class_id) ?? []
    const typeLabel = CLASS_TYPE_LABELS[s.classes?.class_type ?? ''] ?? ''
    const studentLabel = students.map(shortName).join(' & ')
    const classLabel = ['Kelas', typeLabel, studentLabel].filter(Boolean).join(' ').trim()

    // Grades only make it into the label when every student in the class
    // shares one (a mixed-grade group would be misleading otherwise).
    const grades = [...new Set(students.map(st => st.grade).filter((g): g is number => g != null))]
    const grade = grades.length === 1 ? String(grades[0]) : null
    const gradeLevel = [grade, s.classes?.level].filter(Boolean).join(' ') || null

    const group = groups.get(s.tutor.id) ?? {
      tutorId: s.tutor.id,
      tutorName: s.tutor.full_name,
      tutorMention: tutorMentionHandle(s.tutor),
      items: [],
    }
    group.items.push({
      time: wibTimeLabel(s.scheduled_at),
      className: stripClassUniqueTag(s.classes?.name ?? 'Kelas'),
      classLabel: classLabel || stripClassUniqueTag(s.classes?.name ?? 'Kelas'),
      gradeLevel,
      subjectName: s.subjects?.name ?? null,
    })
    groups.set(s.tutor.id, group)
  }

  return Array.from(groups.values())
    .sort((a, b) => a.tutorName.localeCompare(b.tutorName))
    .map(g => ({ ...g, items: g.items.sort((a, b) => a.time.localeCompare(b.time)) }))
}

export function buildDailyMessageText(dateLabel: string, tutorGroups: TutorGroup[]): string {
  const lines = [`*Jadwal Mengajar - ${dateLabel}*`, '']

  if (tutorGroups.length === 0) {
    lines.push('Tidak ada kelas terjadwal hari ini.')
  } else {
    for (const group of tutorGroups) {
      lines.push(`*${group.tutorName}* @${group.tutorMention}`)
      for (const item of group.items) {
        const parts = [item.classLabel, item.gradeLevel, item.subjectName, `${item.time} WIB`]
        lines.push(`• ${parts.filter(Boolean).join(', ')}`)
      }
      lines.push('')
    }
  }

  lines.push('Semangat mengajar!')
  return lines.join('\n')
}

export function buildWhatsappShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
