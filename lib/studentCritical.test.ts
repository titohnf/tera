// @ts-nocheck
/**
 * Unit tests untuk evaluateStudentCritical() dan evaluateBatchCritical()
 * Jalankan dengan: npx vitest (install dulu: npm i -D vitest)
 */
import { describe, it, expect } from 'vitest'
import {
  evaluateStudentCritical,
  evaluateBatchCritical,
  getCriticalStudentIds,
  type StudentCriticalInput,
} from './studentCritical'

const now = new Date()
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86_400_000)

const BASE: StudentCriticalInput = {
  studentId: 'student-1',
  studentName: 'Budi Santoso',
  isActive: true,
  enrolledAt: daysAgo(30),
  attendanceRateThisMonth: 85,
  sessionCountThisMonth: 6,
  latestScore: 80,
  previousScore: 78,
  scoreHistory: [80, 78, 76, 74], // index 0 = terbaru, NAIK dari kiri ke kanan (tidak kritis)
  lastSessionDate: daysAgo(3),
  hasActiveClass: true,
  daysSinceEnrollment: 30,
  nextScheduledSessionDate: daysFromNow(3),
  tutorIsActive: true,
  maxOverdueDays: 0,
  totalOutstanding: 0,
  monthlyBaseRate: 500_000,
}

// ─── Guard Tests ──────────────────────────────────────────────────────────────

describe('KC-01 guard tests', () => {
  it('tidak aktif jika sessionCount < 4 meski kehadiran 0%', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 0,
      sessionCountThisMonth: 3,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-01')
  })

  it('tidak aktif jika isActive = false', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      isActive: false,
      attendanceRateThisMonth: 20,
      sessionCountThisMonth: 5,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-01')
  })

  it('tidak aktif jika kehadiran tepat 50%', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 50,
      sessionCountThisMonth: 4,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-01')
  })
})

describe('KC-02 guard tests', () => {
  it('tidak aktif jika hanya 1 asesmen (latestScore ada tapi previousScore null)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      latestScore: 60,
      previousScore: null,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-02')
  })

  it('tidak aktif jika penurunan tepat 20 poin (batas adalah > 20)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      latestScore: 60,
      previousScore: 80,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-02')
  })
})

describe('KC-03 guard tests', () => {
  it('tidak aktif jika hanya 3 data nilai (butuh minimal 4)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      scoreHistory: [60, 65, 70],
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-03')
  })

  it('tidak aktif jika tren campuran (bukan turun konsisten)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      scoreHistory: [60, 65, 60, 75], // tidak semua turun berurut
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-03')
  })
})

describe('KC-04 guard tests', () => {
  it('tidak aktif jika isActive = false', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      isActive: false,
      lastSessionDate: daysAgo(30),
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-04')
  })

  it('tidak aktif jika tepat 21 hari (batas adalah > 21)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      lastSessionDate: daysAgo(21),
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KC-04')
  })
})

describe('KK-01 guard tests', () => {
  it('tidak aktif jika overdue tepat 30 hari (batas adalah > 30, bukan >= 30)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      maxOverdueDays: 30,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).not.toContain('KK-01')
  })
})

// ─── Positive Tests ───────────────────────────────────────────────────────────

describe('KC-01 positive', () => {
  it('aktif jika kehadiran 49%, sesi >= 4', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 49,
      sessionCountThisMonth: 4,
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KC-01')
  })
})

describe('KC-02 positive', () => {
  it('aktif jika nilai turun 25 poin (80 → 55)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      previousScore: 80,
      latestScore: 55,
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KC-02')
  })
})

describe('KC-03 positive', () => {
  it('aktif jika history [60, 65, 70, 75] (terbaru=60, turun berurut)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      scoreHistory: [60, 65, 70, 75],
      latestScore: 60,
      previousScore: 65,
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KC-03')
  })

  it('tidak aktif jika KC-02 sudah aktif (KC-03 di-suppress)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      previousScore: 80,
      latestScore: 55,
      scoreHistory: [55, 65, 70, 75],
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).toContain('KC-02')
    expect(codes).not.toContain('KC-03')
  })
})

describe('KC-04 positive', () => {
  it('aktif jika lastSessionDate 22 hari lalu dan isActive = true', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      lastSessionDate: daysAgo(22),
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KC-04')
  })
})

describe('KL-01 positive', () => {
  it('aktif jika daysSinceEnrollment = 8 dan tidak punya kelas aktif', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      hasActiveClass: false,
      daysSinceEnrollment: 8,
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KL-01')
  })
})

describe('KK-01 positive', () => {
  it('aktif jika maxOverdueDays = 31', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      maxOverdueDays: 31,
    }
    const result = evaluateStudentCritical(input)
    expect(result.criticalConditions.map(c => c.code)).toContain('KK-01')
  })
})

// ─── Priority Tests ───────────────────────────────────────────────────────────

describe('priority: level lebih rendah menang', () => {
  it('KC-01 (L1) + KL-01 (L2) + KK-01 (L3) → primaryCondition = KC-01', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 40,
      sessionCountThisMonth: 5,
      hasActiveClass: false,
      daysSinceEnrollment: 10,
      maxOverdueDays: 35,
    }
    const result = evaluateStudentCritical(input)
    expect(result.primaryCondition?.code).toBe('KC-01')
  })

  it('KC-04 (today) + KC-03 (this-week) → primaryCondition = KC-04 (urgency today menang)', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      lastSessionDate: daysAgo(25),
      scoreHistory: [60, 65, 70, 75],
      latestScore: 60,
      previousScore: 65,
    }
    const result = evaluateStudentCritical(input)
    const codes = result.criticalConditions.map(c => c.code)
    expect(codes).toContain('KC-04')
    expect(codes).toContain('KC-03')
    expect(result.primaryCondition?.code).toBe('KC-04')
  })

  it('KC-01 (today) beats KC-03 (this-week) even at same level', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 40,
      sessionCountThisMonth: 5,
      scoreHistory: [60, 65, 70, 75],
      latestScore: 60,
      previousScore: 65,
    }
    const result = evaluateStudentCritical(input)
    expect(result.primaryCondition?.code).toBe('KC-01')
  })
})

// ─── isCritical Tests ─────────────────────────────────────────────────────────

describe('isCritical flag', () => {
  it('false jika tidak ada kondisi kritis', () => {
    const result = evaluateStudentCritical(BASE)
    expect(result.isCritical).toBe(false)
    expect(result.highestLevel).toBeNull()
    expect(result.primaryCondition).toBeNull()
  })

  it('true jika ada setidaknya satu kondisi kritis', () => {
    const input: StudentCriticalInput = { ...BASE, maxOverdueDays: 35 }
    const result = evaluateStudentCritical(input)
    expect(result.isCritical).toBe(true)
    expect(result.highestLevel).not.toBeNull()
    expect(result.primaryCondition).not.toBeNull()
  })

  it('highestLevel = 1 jika ada kondisi KC-*', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 40,
      sessionCountThisMonth: 5,
    }
    const result = evaluateStudentCritical(input)
    expect(result.highestLevel).toBe(1)
  })

  it('criticalConditions kosong dan warningConditions ada jika hanya warning aktif', () => {
    const input: StudentCriticalInput = {
      ...BASE,
      attendanceRateThisMonth: 60,
      sessionCountThisMonth: 5,
    }
    const result = evaluateStudentCritical(input)
    expect(result.isCritical).toBe(false)
    expect(result.criticalConditions).toHaveLength(0)
    expect(result.warningConditions.map(w => w.code)).toContain('W-ATT')
  })
})

// ─── Summary Tests ────────────────────────────────────────────────────────────

describe('evaluateBatchCritical summary', () => {
  it('totalCritical menghitung hanya siswa yang isCritical = true', () => {
    const students: StudentCriticalInput[] = [
      { ...BASE, studentId: 's1', maxOverdueDays: 35 },          // kritis
      { ...BASE, studentId: 's2' },                               // tidak kritis
      { ...BASE, studentId: 's3', attendanceRateThisMonth: 40, sessionCountThisMonth: 5 }, // kritis
    ]
    const { summary } = evaluateBatchCritical(students)
    expect(summary.totalCritical).toBe(2)
  })

  it('byLevel menghitung unique students per level (bukan total kondisi)', () => {
    const students: StudentCriticalInput[] = [
      {
        ...BASE,
        studentId: 's1',
        attendanceRateThisMonth: 40,
        sessionCountThisMonth: 5,
        lastSessionDate: daysAgo(25),
      }, // KC-01 + KC-04 (2 kondisi L1, tapi 1 siswa)
      {
        ...BASE,
        studentId: 's2',
        hasActiveClass: false,
        daysSinceEnrollment: 10,
      }, // KL-01 (1 kondisi L2)
    ]
    const { summary } = evaluateBatchCritical(students)
    expect(summary.byLevel.level1).toBe(1)
    expect(summary.byLevel.level2).toBe(1)
  })

  it('mostCommonCondition mengembalikan kode kondisi paling sering muncul', () => {
    const students: StudentCriticalInput[] = [
      { ...BASE, studentId: 's1', maxOverdueDays: 35 }, // KK-01
      { ...BASE, studentId: 's2', maxOverdueDays: 40 }, // KK-01
      { ...BASE, studentId: 's3', attendanceRateThisMonth: 40, sessionCountThisMonth: 5 }, // KC-01
    ]
    const { summary } = evaluateBatchCritical(students)
    expect(summary.mostCommonCondition).toBe('KK-01')
  })

  it('getCriticalStudentIds hanya mengembalikan ID siswa yang kritis', () => {
    const students: StudentCriticalInput[] = [
      { ...BASE, studentId: 's1', maxOverdueDays: 35 },
      { ...BASE, studentId: 's2' },
      { ...BASE, studentId: 's3', maxOverdueDays: 40 },
    ]
    const { results } = evaluateBatchCritical(students)
    const ids = getCriticalStudentIds(results)
    expect(ids).toEqual(['s1', 's3'])
    expect(ids).not.toContain('s2')
  })
})
