import { createAdminClient } from '@/lib/supabase/server-admin'
import { coversSession } from '@/lib/enrollment'

/**
 * Enam bulan terakhir sebagai `YYYY-MM`, terbaru dulu — jendela laporan yang
 * ditawarkan halaman admin maupun portal keluarga.
 *
 * Dipusatkan di sini karena kedua halaman itu harus menawarkan bulan yang sama:
 * begitu keduanya menghitung sendiri, admin dan orang tua bisa melihat daftar
 * bulan yang berbeda dan mengira lawan bicaranya salah lihat.
 *
 * Menerima `sekarang` alih-alih membaca jam sendiri: membaca jam saat render
 * dilarang lint `react-hooks/purity`, jadi pemanggil menyiapkannya lebih dulu
 * (lihat `bulanIni` di lib/keluarga.ts).
 */
export function jendelaLaporan(sekarang: { tahun: number; bulan: number }): string[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(sekarang.tahun, sekarang.bulan - 1 - i, 1))
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  })
}

export type LaporanStudent = {
  id: string
  full_name: string | null
  nickname: string | null
  level: string | null
  grade: string | null
  parent_name: string | null
  parent_phone: string | null
}

export type LaporanClass = {
  id: string
  name: string
  level: string | null
  tutor_name: string | null
}

export type LaporanSession = {
  id: string
  class_id: string
  class_name: string
  scheduled_at: string
  topic: string | null
  custom_theme: string | null
  custom_learning_outcomes: string[] | null
  attendance_status: string | null
  attitude_note: string | null
  subject_name: string | null
  tutor_name: string | null
}

export type LaporanAssessment = {
  id: string
  /** Sesi tempat asesmen digelar; pemaut catatan performanya. */
  session_id: string | null
  title: string
  class_name: string
  scheduled_at: string | null
  max_score: number
  score: number | null
  feedback: string | null
  subject_name: string | null
}

export type LaporanNote = {
  id: string
  session_id: string
  category: string
  body: string
  tutor_name: string | null
  scheduled_at: string | null
  created_at: string
}

/** Nama kategori catatan performa di basis data (bahasa Inggris) → label tampilan Indonesia. */
export const LABEL_KATEGORI_CATATAN: Record<string, string> = {
  Attitude: 'Sikap',
  Progress: 'Perkembangan',
  Recommendation: 'Rekomendasi',
}

export function labelKategori(kategori: string): string {
  return LABEL_KATEGORI_CATATAN[kategori] ?? kategori
}

export type LaporanReportNotes = {
  mastered: string | null
  needs_practice: string | null
  other_notes: string | null
}

export type LaporanBulananData = {
  student: LaporanStudent
  month: string
  monthLabel: string
  classes: LaporanClass[]
  sessions: LaporanSession[]
  attendanceSummary: {
    total: number
    present: number
    late: number
    absent: number
    excused: number
    pct: number | null
  }
  assessments: LaporanAssessment[]
  /** Rekap nilai asesmen per mapel: rata-rata, tertinggi, dan terendah — semuanya persen. */
  nilaiByMapel: { mapel: string; rataRata: number; tertinggi: number; terendah: number; jumlah: number }[]
  /** Tutor performance notes, excluding Attitude (shown inline on sessions instead). Web-only — not rendered in the PDF. */
  performanceNotes: LaporanNote[]
  reportNotes: LaporanReportNotes | null
}

export function monthRange(month: string) {
  const [year, mon] = month.split('-').map(Number)
  const start = new Date(year, mon - 1, 1)
  const end = new Date(year, mon, 1)
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
  }
}

export function groupNotesByCategory(notes: LaporanNote[]): { category: string; notes: LaporanNote[] }[] {
  const groups = new Map<string, LaporanNote[]>()
  for (const n of notes) {
    if (!groups.has(n.category)) groups.set(n.category, [])
    groups.get(n.category)!.push(n)
  }
  return Array.from(groups.entries()).map(([category, groupNotes]) => ({ category, notes: groupNotes }))
}

export async function getLaporanBulananData(studentId: string, month: string): Promise<LaporanBulananData | null> {
  const admin = createAdminClient()
  const { startIso, endIso, label } = monthRange(month)

  const { data: studentData } = await admin
    .from('profiles')
    .select('id, full_name, nickname, level, grade, parent_name, parent_phone')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  const student = studentData as LaporanStudent | null
  if (!student) return null

  type EnrollRow = {
    enrolled_at: string
    unenrolled_at: string | null
    is_active: boolean
    classes: {
      id: string
      name: string
      level: string | null
      profiles: { full_name: string } | null
    } | null
  }

  const { data: enrollData } = await admin
    .from('class_students')
    .select('enrolled_at, unenrolled_at, is_active, classes(id, name, level, profiles!tutor_id(full_name))')
    .eq('student_id', studentId) as unknown as { data: EnrollRow[] | null }

  const enrollments = (enrollData ?? []).filter(e => e.classes !== null)

  const classes: LaporanClass[] = enrollments
    .map(e => e.classes!)
    .map(c => ({ id: c.id, name: c.name, level: c.level, tutor_name: c.profiles?.full_name ?? null }))

  // Rentang keanggotaan per kelas, dipakai membuang sesi di luar masa siswa
  // ikut kelas itu — siswa yang baru masuk Agustus tidak boleh membawa sesi
  // Juli ke laporannya.
  const windowByClass = new Map(enrollments.map(e => [e.classes!.id, e]))

  const classIds = classes.map(c => c.id)
  const classNameMap = new Map(classes.map(c => [c.id, c.name]))

  type SessionRow = {
    id: string
    class_id: string
    scheduled_at: string
    topic: string | null
    custom_theme: string | null
    custom_learning_outcomes: string[] | null
    subject_id: string | null
    subjects: { name: string } | null
    profiles: { full_name: string } | null
  }

  const { data: sessionData } = classIds.length > 0
    ? await admin
      .from('sessions')
      .select('id, class_id, scheduled_at, topic, custom_theme, custom_learning_outcomes, subject_id, subjects(name), profiles!tutor_id(full_name)')
      .in('class_id', classIds)
      .eq('status', 'completed')
      .gte('scheduled_at', startIso)
      .lt('scheduled_at', endIso)
      .order('scheduled_at', { ascending: true }) as unknown as { data: SessionRow[] | null }
    : { data: [] as SessionRow[] }

  const sessionRows = (sessionData ?? []).filter(s => {
    const window = windowByClass.get(s.class_id)
    return window ? coversSession(window, s.scheduled_at) : false
  })
  const sessionIds = sessionRows.map(s => s.id)

  const { data: attendanceData } = sessionIds.length > 0
    ? await admin
      .from('attendances')
      .select('session_id, status')
      .eq('student_id', studentId)
      .in('session_id', sessionIds) as unknown as { data: { session_id: string; status: string }[] | null }
    : { data: [] as { session_id: string; status: string }[] }

  const attendanceMap = new Map((attendanceData ?? []).map(a => [a.session_id, a.status]))

  type NoteRow = {
    id: string
    session_id: string
    category: string
    body: string
    created_at: string
    sessions: { scheduled_at: string } | null
    profiles: { full_name: string } | null
  }

  let allNotes: NoteRow[] = []
  if (sessionIds.length > 0) {
    const { data: noteData } = await admin
      .from('performance_notes')
      .select('id, session_id, category, body, created_at, sessions(scheduled_at), profiles!tutor_id(full_name)')
      .eq('student_id', studentId)
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true }) as unknown as { data: NoteRow[] | null }
    allNotes = noteData ?? []
  }

  const attitudeBySession = new Map<string, string>()
  for (const n of allNotes) {
    if (n.category === 'Attitude') attitudeBySession.set(n.session_id, n.body)
  }

  const sessions: LaporanSession[] = sessionRows.map(s => ({
    id: s.id,
    class_id: s.class_id,
    class_name: classNameMap.get(s.class_id) ?? '—',
    scheduled_at: s.scheduled_at,
    topic: s.topic,
    custom_theme: s.custom_theme,
    custom_learning_outcomes: s.custom_learning_outcomes,
    attendance_status: attendanceMap.get(s.id) ?? null,
    attitude_note: attitudeBySession.get(s.id) ?? null,
    subject_name: s.subjects?.name ?? null,
    tutor_name: s.profiles?.full_name ?? null,
  }))

  const attendanceStatuses = sessions.map(s => s.attendance_status)
  const attendanceSummary = {
    total: sessions.length,
    present: attendanceStatuses.filter(s => s === 'present').length,
    late: attendanceStatuses.filter(s => s === 'late').length,
    absent: attendanceStatuses.filter(s => s === 'absent').length,
    excused: attendanceStatuses.filter(s => s === 'excused').length,
    pct: sessions.length > 0
      ? Math.round((attendanceStatuses.filter(s => s === 'present' || s === 'late').length / sessions.length) * 100)
      : null,
  }

  type AssessmentRow = {
    id: string
    session_id: string
    title: string
    max_score: number
    sessions: {
      scheduled_at: string
      class_id: string
      subject_id: string | null
      subjects: { name: string } | null
    } | null
  }
  type AssessmentResultRow = { assessment_id: string; score: number | null; feedback: string | null }

  let assessments: LaporanAssessment[] = []
  if (sessionIds.length > 0) {
    const { data: assessmentData } = await admin
      .from('assessments')
      .select('id, session_id, title, max_score, sessions(scheduled_at, class_id, subject_id, subjects(name))')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true }) as unknown as { data: AssessmentRow[] | null }

    const assessmentRows = assessmentData ?? []
    const assessmentIds = assessmentRows.map(a => a.id)

    const { data: resultData } = assessmentIds.length > 0
      ? await admin
        .from('assessment_results')
        .select('assessment_id, score, feedback')
        .eq('student_id', studentId)
        .in('assessment_id', assessmentIds) as unknown as { data: AssessmentResultRow[] | null }
      : { data: [] as AssessmentResultRow[] }

    const resultMap = new Map((resultData ?? []).map(r => [r.assessment_id, r]))

    assessments = assessmentRows.map(a => ({
      id: a.id,
      session_id: a.session_id,
      title: a.title,
      class_name: classNameMap.get(a.sessions?.class_id ?? '') ?? '—',
      scheduled_at: a.sessions?.scheduled_at ?? null,
      max_score: a.max_score,
      score: resultMap.get(a.id)?.score ?? null,
      feedback: resultMap.get(a.id)?.feedback ?? null,
      subject_name: a.sessions?.subjects?.name ?? null,
    }))
  }

  const nilaiByMapel: { mapel: string; rataRata: number; tertinggi: number; terendah: number; jumlah: number }[] = []
  {
    const perMapel = new Map<string, { total: number; jumlah: number; tertinggi: number; terendah: number }>()
    for (const a of assessments) {
      if (a.score === null || a.max_score === 0) continue
      const pct = (a.score / a.max_score) * 100
      const mapel = a.subject_name ?? 'Tanpa mapel'
      const cur = perMapel.get(mapel) ?? { total: 0, jumlah: 0, tertinggi: pct, terendah: pct }
      cur.total += pct
      cur.jumlah += 1
      if (pct > cur.tertinggi) cur.tertinggi = pct
      if (pct < cur.terendah) cur.terendah = pct
      perMapel.set(mapel, cur)
    }
    for (const [mapel, cur] of perMapel) {
      if (cur.jumlah === 0) continue
      nilaiByMapel.push({
        mapel,
        rataRata: Math.round(cur.total / cur.jumlah),
        tertinggi: Math.round(cur.tertinggi),
        terendah: Math.round(cur.terendah),
        jumlah: cur.jumlah,
      })
    }
    nilaiByMapel.sort((x, y) => x.mapel.localeCompare(y.mapel, 'id'))
  }

  const performanceNotes: LaporanNote[] = allNotes
    .filter(n => n.category !== 'Attitude')
    .map(n => ({
      id: n.id,
      session_id: n.session_id,
      category: n.category,
      body: n.body,
      tutor_name: n.profiles?.full_name ?? null,
      scheduled_at: n.sessions?.scheduled_at ?? null,
      created_at: n.created_at,
    }))

  const { data: reportNotesData } = await admin
    .from('monthly_report_notes')
    .select('mastered, needs_practice, other_notes')
    .eq('student_id', studentId)
    .eq('month', month)
    .maybeSingle() as unknown as { data: LaporanReportNotes | null }

  return {
    student,
    month,
    monthLabel: label,
    classes,
    sessions,
    attendanceSummary,
    assessments,
    nilaiByMapel,
    performanceNotes,
    reportNotes: reportNotesData ?? null,
  }
}
