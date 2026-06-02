// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentCriticalInput {
  studentId: string
  studentName: string
  isActive: boolean
  enrolledAt: Date

  // Level 1 — Churn
  attendanceRateThisMonth: number | null
  sessionCountThisMonth: number
  latestScore: number | null
  previousScore: number | null
  scoreHistory: number[]
  lastSessionDate: Date | null

  // Level 2 — Layanan
  hasActiveClass: boolean
  daysSinceEnrollment: number
  nextScheduledSessionDate: Date | null
  tutorIsActive: boolean

  // Level 3 — Keuangan
  maxOverdueDays: number
  totalOutstanding: number
  monthlyBaseRate: number
}

export interface CriticalCondition {
  code: string
  level: 1 | 2 | 3
  label: string
  description: string
  urgency: 'today' | 'this-week'
  suggestedAction: string
  actionLink: string
}

export interface StudentCriticalResult {
  studentId: string
  isCritical: boolean
  criticalConditions: CriticalCondition[]
  highestLevel: 1 | 2 | 3 | null
  primaryCondition: CriticalCondition | null
  warningConditions: CriticalCondition[]
}

// ─── Condition Definitions ────────────────────────────────────────────────────

interface ConditionDef {
  code: string
  level: 1 | 2 | 3
  label: string
  description: string
  urgency: 'today' | 'this-week'
  suggestedAction: string
  actionLink: string
}

const CONDITION_DEFS: Record<string, ConditionDef> = {
  'KC-01': {
    code: 'KC-01', level: 1, label: 'Jarang Hadir',
    description: 'Kehadiran {attendanceRateThisMonth}% bulan ini ({sessionCountThisMonth} sesi)',
    urgency: 'today',
    suggestedAction: 'Hubungi orang tua untuk konfirmasi kelanjutan',
    actionLink: '/admin/siswa/{studentId}?tab=sesi',
  },
  'KC-02': {
    code: 'KC-02', level: 1, label: 'Nilai Turun Drastis',
    description: 'Nilai turun {delta} poin dari asesmen sebelumnya ({previousScore} → {latestScore})',
    urgency: 'today',
    suggestedAction: 'Jadwalkan sesi remedial dengan tutor',
    actionLink: '/admin/siswa/{studentId}?tab=nilai',
  },
  'KC-03': {
    code: 'KC-03', level: 1, label: 'Tren Nilai Menurun',
    description: 'Nilai turun 3 asesmen berturut-turut',
    urgency: 'this-week',
    suggestedAction: 'Evaluasi metode belajar bersama tutor',
    actionLink: '/admin/siswa/{studentId}?tab=nilai',
  },
  'KC-04': {
    code: 'KC-04', level: 1, label: 'Tidak Ada Sesi',
    description: 'Tidak ada sesi dalam {daysSinceLastSession} hari terakhir',
    urgency: 'today',
    suggestedAction: 'Jadwalkan sesi segera atau konfirmasi status aktif',
    actionLink: '/admin/sessions/new?studentId={studentId}',
  },
  'KL-01': {
    code: 'KL-01', level: 2, label: 'Belum di Kelas',
    description: 'Sudah {daysSinceEnrollment} hari sejak daftar, belum terdaftar di kelas manapun',
    urgency: 'today',
    suggestedAction: 'Daftarkan ke kelas yang sesuai jenjang',
    actionLink: '/admin/classes?action=tambah-siswa&studentId={studentId}',
  },
  'KL-02': {
    code: 'KL-02', level: 2, label: 'Kelas Tanpa Jadwal',
    description: 'Tidak ada sesi terjadwal dalam 14 hari ke depan',
    urgency: 'this-week',
    suggestedAction: 'Buat jadwal sesi untuk kelas ini',
    actionLink: '/admin/sessions/new?studentId={studentId}',
  },
  'KL-03': {
    code: 'KL-03', level: 2, label: 'Tutor Tidak Aktif',
    description: 'Tutor yang mengajar kelas ini sudah tidak aktif',
    urgency: 'today',
    suggestedAction: 'Assign tutor pengganti segera',
    actionLink: '/admin/classes?action=ganti-tutor&studentId={studentId}',
  },
  'KK-01': {
    code: 'KK-01', level: 3, label: 'Tagihan Sangat Terlambat',
    description: 'Invoice sudah {maxOverdueDays} hari melewati jatuh tempo',
    urgency: 'today',
    suggestedAction: 'Hubungi orang tua langsung via telepon',
    actionLink: '/admin/invoices?student_id={studentId}',
  },
  'KK-02': {
    code: 'KK-02', level: 3, label: 'Tagihan Menumpuk',
    description: 'Outstanding {totalOutstanding} — lebih dari 2x tarif bulanan',
    urgency: 'this-week',
    suggestedAction: 'Diskusikan skema cicilan dengan orang tua',
    actionLink: '/admin/invoices?student_id={studentId}',
  },
}

// Warning conditions (not counted as critical)
const WARNING_DEFS: Record<string, Omit<ConditionDef, 'level'>> = {
  'W-ATT': {
    code: 'W-ATT', label: 'Kehadiran Rendah',
    description: 'Kehadiran {attendanceRateThisMonth}% bulan ini (50–70%)',
    urgency: 'this-week',
    suggestedAction: 'Pantau kehadiran minggu depan',
    actionLink: '/admin/siswa/{studentId}?tab=sesi',
  },
  'W-INV': {
    code: 'W-INV', label: 'Tagihan Terlambat',
    description: 'Invoice terlambat {maxOverdueDays} hari (7–30 hari)',
    urgency: 'this-week',
    suggestedAction: 'Kirim pengingat tagihan',
    actionLink: '/admin/invoices?student_id={studentId}',
  },
  'W-SESI': {
    code: 'W-SESI', label: 'Jarang Sesi',
    description: 'Tidak ada sesi dalam {daysSinceLastSession} hari (8–20 hari)',
    urgency: 'this-week',
    suggestedAction: 'Konfirmasi jadwal sesi berikutnya',
    actionLink: '/admin/sessions/new?studentId={studentId}',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000)
}

function buildCriticalCondition(code: string, studentId: string): CriticalCondition {
  const def = CONDITION_DEFS[code]
  if (!def) throw new Error(`Unknown condition: ${code}`)
  return {
    code: def.code,
    level: def.level,
    label: def.label,
    description: def.description,
    urgency: def.urgency,
    suggestedAction: def.suggestedAction,
    actionLink: def.actionLink.replace(/{studentId}/g, studentId),
  }
}

function buildWarningCondition(code: string, studentId: string): CriticalCondition {
  const def = WARNING_DEFS[code]
  if (!def) throw new Error(`Unknown warning: ${code}`)
  return {
    code: def.code,
    level: 3, // lowest level — warnings live in warningConditions, not criticalConditions
    label: def.label,
    description: def.description,
    urgency: def.urgency,
    suggestedAction: def.suggestedAction,
    actionLink: def.actionLink.replace(/{studentId}/g, studentId),
  }
}

const URGENCY_ORDER: Record<'today' | 'this-week', number> = { today: 0, 'this-week': 1 }

function sortConditions(conditions: CriticalCondition[]): CriticalCondition[] {
  return [...conditions].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  })
}

// ─── Core Evaluation ──────────────────────────────────────────────────────────

export function evaluateStudentCritical(input: StudentCriticalInput): StudentCriticalResult {
  const now = new Date()
  const daysSinceLastSession = input.lastSessionDate
    ? daysBetween(input.lastSessionDate, now)
    : null
  const daysUntilNextSession = input.nextScheduledSessionDate
    ? Math.max(0, daysBetween(now, input.nextScheduledSessionDate))
    : null

  // ── Critical conditions ───────────────────────────────────────────────────

  // KC-01: Kehadiran sangat rendah
  const kc01Active =
    input.isActive &&
    input.attendanceRateThisMonth !== null &&
    input.attendanceRateThisMonth < 50 &&
    input.sessionCountThisMonth >= 4

  // KC-02: Nilai turun drastis
  const kc02Active =
    input.isActive &&
    input.latestScore !== null &&
    input.previousScore !== null &&
    input.previousScore - input.latestScore > 20

  // KC-03: Nilai turun 3 kali berturut-turut (4 data, index 0 = terbaru)
  const kc03Active =
    input.isActive &&
    !kc02Active && // suppress if KC-02 active (same cause)
    input.scoreHistory.length >= 4 &&
    input.scoreHistory[0] < input.scoreHistory[1] &&
    input.scoreHistory[1] < input.scoreHistory[2] &&
    input.scoreHistory[2] < input.scoreHistory[3]

  // KC-04: Tidak ada sesi sangat lama (> 21 hari)
  const kc04Active =
    input.isActive &&
    daysSinceLastSession !== null &&
    daysSinceLastSession > 21

  // KL-01: Terdaftar tapi belum punya kelas (> 7 hari)
  const kl01Active =
    input.isActive &&
    !input.hasActiveClass &&
    input.daysSinceEnrollment > 7

  // KL-02: Punya kelas tapi tidak ada sesi terjadwal dalam 14 hari ke depan
  const kl02Active =
    input.isActive &&
    input.hasActiveClass &&
    (daysUntilNextSession === null || daysUntilNextSession > 14)

  // KL-03: Tutor kelas tidak aktif
  const kl03Active =
    input.isActive &&
    input.hasActiveClass &&
    !input.tutorIsActive

  // KK-01: Invoice overdue sangat lama (> 30 hari)
  const kk01Active = input.maxOverdueDays > 30

  // KK-02: Outstanding sangat tinggi (> 2x tarif bulanan)
  const kk02Active = input.totalOutstanding > 2 * input.monthlyBaseRate

  // Build critical conditions list
  const criticalConditions: CriticalCondition[] = []
  if (kc01Active) criticalConditions.push(buildCriticalCondition('KC-01', input.studentId))
  if (kc02Active) criticalConditions.push(buildCriticalCondition('KC-02', input.studentId))
  if (kc03Active) criticalConditions.push(buildCriticalCondition('KC-03', input.studentId))
  if (kc04Active) criticalConditions.push(buildCriticalCondition('KC-04', input.studentId))
  if (kl01Active) criticalConditions.push(buildCriticalCondition('KL-01', input.studentId))
  if (kl02Active) criticalConditions.push(buildCriticalCondition('KL-02', input.studentId))
  if (kl03Active) criticalConditions.push(buildCriticalCondition('KL-03', input.studentId))
  if (kk01Active) criticalConditions.push(buildCriticalCondition('KK-01', input.studentId))
  if (kk02Active) criticalConditions.push(buildCriticalCondition('KK-02', input.studentId))

  const sorted = sortConditions(criticalConditions)

  // ── Warning conditions (not critical) ────────────────────────────────────

  const warningConditions: CriticalCondition[] = []

  // W-ATT: Kehadiran 50–70%
  if (
    input.isActive &&
    input.attendanceRateThisMonth !== null &&
    input.attendanceRateThisMonth >= 50 &&
    input.attendanceRateThisMonth < 70 &&
    input.sessionCountThisMonth >= 4 &&
    !kc01Active
  ) {
    warningConditions.push(buildWarningCondition('W-ATT', input.studentId))
  }

  // W-INV: Invoice overdue 7–30 hari
  if (input.maxOverdueDays >= 7 && input.maxOverdueDays <= 30 && !kk01Active) {
    warningConditions.push(buildWarningCondition('W-INV', input.studentId))
  }

  // W-SESI: Tidak ada sesi 8–20 hari
  if (
    input.isActive &&
    daysSinceLastSession !== null &&
    daysSinceLastSession >= 8 &&
    daysSinceLastSession <= 20 &&
    !kc04Active
  ) {
    warningConditions.push(buildWarningCondition('W-SESI', input.studentId))
  }

  const isCritical = sorted.length > 0
  const highestLevel = sorted.length > 0 ? sorted[0].level : null
  const primaryCondition = sorted[0] ?? null

  return {
    studentId: input.studentId,
    isCritical,
    criticalConditions: sorted,
    highestLevel,
    primaryCondition,
    warningConditions,
  }
}

// ─── Batch Evaluation ─────────────────────────────────────────────────────────

export function evaluateBatchCritical(students: StudentCriticalInput[]): {
  results: StudentCriticalResult[]
  summary: {
    totalCritical: number
    byLevel: { level1: number; level2: number; level3: number }
    byCondition: Record<string, number>
    mostCommonCondition: string
  }
} {
  const results = students.map(s => evaluateStudentCritical(s))

  const criticalResults = results.filter(r => r.isCritical)
  const byCondition: Record<string, number> = {}

  let level1 = 0, level2 = 0, level3 = 0

  for (const result of criticalResults) {
    for (const cond of result.criticalConditions) {
      byCondition[cond.code] = (byCondition[cond.code] ?? 0) + 1
      if (cond.level === 1) level1++
      else if (cond.level === 2) level2++
      else if (cond.level === 3) level3++
    }
  }

  // Deduplicate level counts (count unique students per level, not total condition occurrences)
  const level1Students = new Set(
    criticalResults
      .filter(r => r.criticalConditions.some(c => c.level === 1))
      .map(r => r.studentId)
  ).size
  const level2Students = new Set(
    criticalResults
      .filter(r => r.criticalConditions.some(c => c.level === 2))
      .map(r => r.studentId)
  ).size
  const level3Students = new Set(
    criticalResults
      .filter(r => r.criticalConditions.some(c => c.level === 3))
      .map(r => r.studentId)
  ).size

  const mostCommonCondition =
    Object.entries(byCondition).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''

  return {
    results,
    summary: {
      totalCritical: criticalResults.length,
      byLevel: {
        level1: level1Students,
        level2: level2Students,
        level3: level3Students,
      },
      byCondition,
      mostCommonCondition,
    },
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getCriticalStudentIds(results: StudentCriticalResult[]): string[] {
  return results.filter(r => r.isCritical).map(r => r.studentId)
}

export function interpolateCriticalMessage(
  condition: CriticalCondition,
  student: StudentCriticalInput
): string {
  const now = new Date()
  const daysSinceLastSession = student.lastSessionDate
    ? Math.floor(daysBetween(student.lastSessionDate, now))
    : 0
  const delta = Math.round((student.previousScore ?? 0) - (student.latestScore ?? 0))

  return condition.description
    .replace('{attendanceRateThisMonth}', String(Math.round(student.attendanceRateThisMonth ?? 0)))
    .replace('{sessionCountThisMonth}', String(student.sessionCountThisMonth))
    .replace('{latestScore}', String(student.latestScore ?? 0))
    .replace('{previousScore}', String(student.previousScore ?? 0))
    .replace('{delta}', String(delta))
    .replace('{daysSinceLastSession}', String(daysSinceLastSession))
    .replace('{daysSinceEnrollment}', String(student.daysSinceEnrollment))
    .replace('{maxOverdueDays}', String(student.maxOverdueDays))
    .replace('{totalOutstanding}', formatRupiah(student.totalOutstanding))
}
