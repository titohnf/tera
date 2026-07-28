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
  classes: { name: string } | null
  subjects: { name: string } | null
  tutor: { id: string; full_name: string; phone: string | null } | null
}

export type TutorGroup = {
  tutorId: string
  tutorName: string
  tutorPhone: string | null
  items: { time: string; className: string; subjectName: string | null }[]
}

export async function getTutorGroupsForDate(admin: SupabaseClient, dateStr: string): Promise<TutorGroup[]> {
  const { start, end } = wibDayRangeUtc(dateStr)

  const { data: sessions } = await admin
    .from('sessions')
    .select(`
      id, scheduled_at, status,
      classes(name),
      subjects(name),
      tutor:profiles!tutor_id(id, full_name, phone)
    `)
    .neq('status', 'cancelled')
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true }) as unknown as { data: SessionRow[] | null }

  const groups = new Map<string, TutorGroup>()
  for (const s of sessions ?? []) {
    if (!s.tutor) continue
    const time = new Date(s.scheduled_at).toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
    })
    const className = stripClassUniqueTag(s.classes?.name ?? 'Kelas')
    const group = groups.get(s.tutor.id) ?? { tutorId: s.tutor.id, tutorName: s.tutor.full_name, tutorPhone: s.tutor.phone, items: [] }
    group.items.push({ time, className, subjectName: s.subjects?.name ?? null })
    groups.set(s.tutor.id, group)
  }

  return Array.from(groups.values())
    .sort((a, b) => a.tutorName.localeCompare(b.tutorName))
    .map(g => ({ ...g, items: g.items.sort((a, b) => a.time.localeCompare(b.time)) }))
}

// WhatsApp only renders "@<number>" as a real (notifying) mention when the
// message is sent inside a group the number is a participant of — but that
// requires the number in full international form, digits only, no leading
// 0/+. Numbers we can't confidently normalize fall back to a plain name so
// we never emit a mention that silently fails to resolve.
function normalizePhoneForMention(phone: string): string | null {
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  return null
}

export function buildDailyMessageText(dateLabel: string, tutorGroups: TutorGroup[]): string {
  const lines = [`*Jadwal Mengajar - ${dateLabel}*`, '']

  if (tutorGroups.length === 0) {
    lines.push('Tidak ada kelas terjadwal hari ini.')
  } else {
    for (const group of tutorGroups) {
      const normalizedPhone = group.tutorPhone ? normalizePhoneForMention(group.tutorPhone) : null
      const tutorLabel = normalizedPhone ? `@${normalizedPhone}` : group.tutorName
      lines.push(`*${tutorLabel}*`)
      for (const item of group.items) {
        const subjectSuffix = item.subjectName ? ` (${item.subjectName})` : ''
        lines.push(`- ${item.time} ${item.className}${subjectSuffix}`)
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
