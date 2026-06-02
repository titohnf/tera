import { createAdminClient } from './server-admin'
import type { StudentCriticalInput } from '../studentCritical'

export async function fetchCriticalEvaluationData(): Promise<StudentCriticalInput[]> {
  const admin = createAdminClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    studentsRes,
    classStudentsRes,
    classesRes,
    sessionsThisMonthRes,
    attendancesThisMonthRes,
    allSessionsRes,
    upcomingSessionsRes,
    invoicesRes,
    scoresRes,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('role', 'student'),

    admin
      .from('class_students')
      .select('student_id, class_id')
      .eq('is_active', true),

    admin
      .from('classes')
      .select('id, class_type, level, tutor_id, profiles!tutor_id(id)')
      .eq('is_active', true),

    admin
      .from('sessions')
      .select('id, class_id, scheduled_at')
      .eq('status', 'completed')
      .gte('scheduled_at', startOfMonth),

    admin
      .from('attendances')
      .select('session_id, student_id, status')
      .gte('created_at', startOfMonth),

    // Most recent session per student (limit large, we filter in JS)
    admin
      .from('sessions')
      .select('id, class_id, scheduled_at')
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: false })
      .limit(2000),

    // Upcoming scheduled sessions
    admin
      .from('sessions')
      .select('id, class_id, scheduled_at')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .order('scheduled_at', { ascending: true }),

    admin
      .from('invoices')
      .select('student_id, due_date, total_due, status')
      .in('status', ['unpaid', 'overdue']),

    admin
      .from('assessments')
      .select('student_id, score, created_at')
      .order('created_at', { ascending: false }),
  ])

  const students = studentsRes.data ?? []
  const classStudents = classStudentsRes.data ?? []
  const classes = classesRes.data ?? []
  const sessionsThisMonth = sessionsThisMonthRes.data ?? []
  const attendancesThisMonth = attendancesThisMonthRes.data ?? []
  const allSessions = allSessionsRes.data ?? []
  const upcomingSessions = upcomingSessionsRes.data ?? []
  const invoices = invoicesRes.data ?? []
  const scores = scoresRes.data ?? []

  // Build lookup maps
  const classMap = new Map(classes.map(c => [c.id, c]))

  // student → set of active class IDs
  const studentClassIds = new Map<string, string[]>()
  for (const cs of classStudents) {
    const existing = studentClassIds.get(cs.student_id) ?? []
    existing.push(cs.class_id)
    studentClassIds.set(cs.student_id, existing)
  }

  // class → sessions this month (for student attendance lookup)
  const sessionsByClass = new Map<string, string[]>()
  for (const s of sessionsThisMonth) {
    const existing = sessionsByClass.get(s.class_id) ?? []
    existing.push(s.id)
    sessionsByClass.set(s.class_id, existing)
  }

  // attendance: session_id → student_id → status
  const attendanceBySession = new Map<string, Map<string, string>>()
  for (const a of attendancesThisMonth) {
    if (!attendanceBySession.has(a.session_id)) {
      attendanceBySession.set(a.session_id, new Map())
    }
    attendanceBySession.get(a.session_id)!.set(a.student_id, a.status)
  }

  // class → last completed session date
  const lastSessionByClass = new Map<string, Date>()
  for (const s of allSessions) {
    const existing = lastSessionByClass.get(s.class_id)
    const date = new Date(s.scheduled_at)
    if (!existing || date > existing) {
      lastSessionByClass.set(s.class_id, date)
    }
  }

  // class → next scheduled session date
  const nextSessionByClass = new Map<string, Date>()
  for (const s of upcomingSessions) {
    if (!nextSessionByClass.has(s.class_id)) {
      nextSessionByClass.set(s.class_id, new Date(s.scheduled_at))
    }
  }

  // student → invoices
  const invoicesByStudent = new Map<string, typeof invoices>()
  for (const inv of invoices) {
    const existing = invoicesByStudent.get(inv.student_id) ?? []
    existing.push(inv)
    invoicesByStudent.set(inv.student_id, existing)
  }

  // student → scores (sorted newest first)
  const scoresByStudent = new Map<string, number[]>()
  for (const assessment of scores) {
    const existing = scoresByStudent.get(assessment.student_id) ?? []
    existing.push(assessment.score)
    scoresByStudent.set(assessment.student_id, existing)
  }

  const daysBetween = (a: Date, b: Date) =>
    Math.floor((b.getTime() - a.getTime()) / 86_400_000)

  return students.map((student): StudentCriticalInput => {
    const enrolledAt = new Date(student.created_at)
    const classIds = studentClassIds.get(student.id) ?? []
    const hasActiveClass = classIds.length > 0

    // Collect all session IDs this month for student's classes
    const studentSessionIds = classIds.flatMap(cid => sessionsByClass.get(cid) ?? [])

    // Attendance this month
    let hadirCount = 0
    let totalCount = 0
    for (const sessionId of studentSessionIds) {
      const studentAttendances = attendanceBySession.get(sessionId)
      if (studentAttendances?.has(student.id)) {
        totalCount++
        const status = studentAttendances.get(student.id)!
        if (status === 'present' || status === 'late') hadirCount++
      }
    }
    const attendanceRateThisMonth = totalCount >= 4
      ? Math.round((hadirCount / totalCount) * 100)
      : null
    const sessionCountThisMonth = totalCount

    // Last session date (most recent across all classes)
    let lastSessionDate: Date | null = null
    for (const cid of classIds) {
      const d = lastSessionByClass.get(cid)
      if (d && (!lastSessionDate || d > lastSessionDate)) lastSessionDate = d
    }

    // Next scheduled session date
    let nextScheduledSessionDate: Date | null = null
    for (const cid of classIds) {
      const d = nextSessionByClass.get(cid)
      if (d && (!nextScheduledSessionDate || d < nextScheduledSessionDate)) {
        nextScheduledSessionDate = d
      }
    }

    // Tutor active: check if any class has a linked tutor profile
    let tutorIsActive = true
    if (hasActiveClass) {
      const allTutorsActive = classIds.every(cid => {
        const cls = classMap.get(cid)
        if (!cls) return true
        if (!cls.tutor_id) return false
        // profiles join returns null if tutor not found
        return cls.profiles !== null
      })
      tutorIsActive = allTutorsActive
    }

    // Invoice data
    const studentInvoices = invoicesByStudent.get(student.id) ?? []
    let maxOverdueDays = 0
    let totalOutstanding = 0
    for (const inv of studentInvoices) {
      totalOutstanding += inv.total_due ?? 0
      if (inv.due_date) {
        const dueDate = new Date(inv.due_date)
        if (dueDate < now) {
          const days = daysBetween(dueDate, now)
          if (days > maxOverdueDays) maxOverdueDays = days
        }
      }
    }

    // Scores
    const studentScores = scoresByStudent.get(student.id) ?? []
    const latestScore = studentScores[0] ?? null
    const previousScore = studentScores[1] ?? null

    // Monthly base rate: use first class's class_type to estimate
    let monthlyBaseRate = 500_000
    if (classIds.length > 0) {
      const cls = classMap.get(classIds[0])
      if (cls?.class_type === 'private') monthlyBaseRate = 800_000
      else if (cls?.class_type === 'group') monthlyBaseRate = 400_000
    }

    return {
      studentId: student.id,
      studentName: student.full_name,
      isActive: true, // all profiles fetched are active students
      enrolledAt,
      attendanceRateThisMonth,
      sessionCountThisMonth,
      latestScore,
      previousScore,
      scoreHistory: studentScores.slice(0, 6),
      lastSessionDate,
      hasActiveClass,
      daysSinceEnrollment: daysBetween(enrolledAt, now),
      nextScheduledSessionDate,
      tutorIsActive,
      maxOverdueDays,
      totalOutstanding,
      monthlyBaseRate,
    }
  })
}
