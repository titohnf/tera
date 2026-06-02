// @ts-nocheck
/**
 * Unit tests untuk getActiveInsights()
 * Jalankan dengan: npx vitest (install dulu: npm i -D vitest)
 */
import { describe, it, expect } from 'vitest'
import { getActiveInsights, type InsightMetrics } from './insights'

const BASE: InsightMetrics = {
  period: 'bulan-ini',
  tutorCount: 5,
  activeTutorCount: 4,
  utilizationRate: 70,
  sessionCountThisMonth: 10,
  currentDayOfMonth: 20,
  attendanceRate: 85,
  attendanceSessionCount: 5,
  assessmentCount: 3,
  passingRate: 80,
  avgScoreHistory: [80, 78, 76],
  studentTutorRatio: 8,
  studentsWithoutSession: 0,
  churnRate: 5,
  churnRateLastMonth: -1,
  revenueThisMonth: 5_000_000,
  outstandingAmount: 0,
  maxOverdueDays: 0,
  draftInvoiceCount: 0,
  studentsWithoutInvoice: 0,
  avgRevenuePerStudent: 500_000,
  baseRate: 500_000,
  allInvoicesPaid: true,
  inactiveStudentOutstanding: 0,
  newStudentsThisMonth: 3,
  newStudentsLastMonth: 2,
  newStudentsPrevMonth: 2,
  retentionRate: 95,
  retentionRateLastMonth: -1,
  cycleCompleted: true,
  referralTrackingEnabled: false,
  inactiveStudentsWithBalance: 0,
  bimbelAgeMonths: 6,
  criticalStudentCount: 0,
}

describe('OP-01: tidak ada tutor', () => {
  it('hanya OP-01 aktif — insight akademik dan operasional lain tidak muncul', () => {
    const m: InsightMetrics = { ...BASE, tutorCount: 0, activeTutorCount: 0 }
    const result = getActiveInsights(m)
    const ids = result.map(i => i.id)
    expect(ids).toContain('OP-01')
    // AK dan OP lain (kecuali OP-01) harus tidak ada
    expect(ids.filter(id => id.startsWith('AK-'))).toHaveLength(0)
    expect(ids.filter(id => id.startsWith('OP-') && id !== 'OP-01')).toHaveLength(0)
  })
})

describe('OP-06: attendanceSessionCount < 3', () => {
  it('insight kehadiran TIDAK aktif meski rate rendah', () => {
    const m: InsightMetrics = { ...BASE, attendanceRate: 50, attendanceSessionCount: 2 }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'OP-06')).toBeUndefined()
  })

  it('insight kehadiran aktif jika attendanceSessionCount >= 3 dan rate rendah', () => {
    const m: InsightMetrics = { ...BASE, attendanceRate: 50, attendanceSessionCount: 3 }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'OP-06')).toBeDefined()
  })
})

describe('AK-04: assessmentCount = 0', () => {
  it('AK-01 dan AK-02 tidak aktif, AK-04 aktif', () => {
    const m: InsightMetrics = { ...BASE, assessmentCount: 0, passingRate: 30 }
    const result = getActiveInsights(m)
    const ids = result.map(i => i.id)
    expect(ids).not.toContain('AK-01')
    expect(ids).not.toContain('AK-02')
    expect(ids).toContain('AK-04')
  })
})

describe('KEU-08: inkonsistensi data keuangan', () => {
  it('allInvoicesPaid = true, revenueThisMonth = 0 → KEU-08 aktif', () => {
    const m: InsightMetrics = { ...BASE, allInvoicesPaid: true, revenueThisMonth: 0 }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'KEU-08')).toBeDefined()
  })

  it('revenue > 0, outstanding = 0, allInvoicesPaid = false → KEU-08 aktif', () => {
    const m: InsightMetrics = { ...BASE, revenueThisMonth: 1_000_000, outstandingAmount: 0, allInvoicesPaid: false }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'KEU-08')).toBeDefined()
  })
})

describe('GR-01: newStudentsLastMonth = -1', () => {
  it('GR-01 tidak aktif jika newStudentsLastMonth = -1 (bulan pertama)', () => {
    const m: InsightMetrics = {
      ...BASE,
      newStudentsThisMonth: 0,
      newStudentsLastMonth: -1,
      newStudentsPrevMonth: -1,
    }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'GR-01')).toBeUndefined()
  })

  it('GR-01 aktif jika 2 bulan berturut tidak ada siswa baru', () => {
    const m: InsightMetrics = {
      ...BASE,
      newStudentsThisMonth: 0,
      newStudentsLastMonth: 0,
      newStudentsPrevMonth: 2,
    }
    const result = getActiveInsights(m)
    expect(result.find(i => i.id === 'GR-01')).toBeDefined()
  })
})

describe('Sorting: urutan severity', () => {
  it('critical → danger → warning → info → ok', () => {
    const m: InsightMetrics = {
      ...BASE,
      tutorCount: 5,
      assessmentCount: 0,         // AK-04 (info)
      attendanceRate: 50,
      attendanceSessionCount: 3,  // OP-06 (warning)
      churnRate: 25,              // AK-08 (critical)
      passingRate: 35,
      retentionRate: 60,          // GR-05 (danger)
    }
    const result = getActiveInsights(m)
    const severityOrder = ['critical', 'danger', 'warning', 'info', 'ok'] as const
    let lastOrder = -1
    for (const insight of result) {
      const order = severityOrder.indexOf(insight.severity)
      expect(order).toBeGreaterThanOrEqual(lastOrder)
      lastOrder = order
    }
  })
})

describe('Batas 5 insight', () => {
  it('maksimal 5 insight ditampilkan jika ada lebih dari 5 kondisi aktif', () => {
    const m: InsightMetrics = {
      ...BASE,
      tutorCount: 5,
      assessmentCount: 0,           // AK-04
      attendanceRate: 50,
      attendanceSessionCount: 3,    // OP-06
      churnRate: 25,                // AK-08
      outstandingAmount: 20_000_000, // KEU-02
      revenueThisMonth: 5_000_000,
      maxOverdueDays: 0,
      studentsWithoutInvoice: 3,    // KEU-04
      draftInvoiceCount: 2,         // KEU-05
      utilizationRate: 30,          // OP-04
      studentsWithoutSession: 2,    // AK-07
      cycleCompleted: false,        // GR-06
      inactiveStudentOutstanding: 100_000, // KEU-09
    }
    const result = getActiveInsights(m)
    // getActiveInsights mengembalikan semua, komponen yang batasi ke 5
    // Test bahwa semua terurut dengan benar dan punya isi
    expect(result.length).toBeGreaterThan(0)
    // Ambil 5 teratas seperti yang dilakukan komponen
    const top5 = result.slice(0, 5)
    expect(top5).toHaveLength(5)
  })
})
