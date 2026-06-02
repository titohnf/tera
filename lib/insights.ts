import type { Period } from './dateRange'

export type InsightSeverity = 'critical' | 'danger' | 'warning' | 'info' | 'ok'

export interface InsightMetrics {
  period: Period

  // Operasional
  tutorCount: number
  activeTutorCount: number
  utilizationRate: number
  sessionCountThisMonth: number
  currentDayOfMonth: number
  attendanceRate: number | null
  attendanceSessionCount: number

  // Akademik
  assessmentCount: number
  passingRate: number | null
  avgScoreHistory: number[]
  studentTutorRatio: number
  studentsWithoutSession: number
  churnRate: number
  churnRateLastMonth: number // -1 jika tidak ada data

  // Keuangan
  revenueThisMonth: number
  outstandingAmount: number
  maxOverdueDays: number
  draftInvoiceCount: number
  studentsWithoutInvoice: number
  avgRevenuePerStudent: number
  baseRate: number
  allInvoicesPaid: boolean
  inactiveStudentOutstanding: number

  // Growth & Retensi
  newStudentsThisMonth: number
  newStudentsLastMonth: number // -1 jika bulan pertama
  newStudentsPrevMonth: number // -1 jika tidak ada data
  retentionRate: number
  retentionRateLastMonth: number // -1 jika tidak ada data
  cycleCompleted: boolean
  referralTrackingEnabled: boolean
  inactiveStudentsWithBalance: number
  bimbelAgeMonths: number

  // Siswa Kritis
  criticalStudentCount: number
}

export interface Insight {
  id: string
  severity: InsightSeverity
  message: string
  action?: { label: string; href: string }
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  critical: 0,
  danger: 1,
  warning: 2,
  info: 3,
  ok: 4,
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getActiveInsights(m: InsightMetrics): Insight[] {
  const insights: Insight[] = []
  const noTutor = m.tutorCount === 0
  const isCurrent = false
  // Mid-month gate: only relevant for current period (historical periods are always "complete")
  const pastMidMonth = isCurrent ? m.currentDayOfMonth > 14 : false
  const pastFirstWeek = isCurrent ? m.currentDayOfMonth > 7 : false

  // ─── OPERASIONAL ─────────────────────────────────────────────────────────

  // OP-01
  if (m.tutorCount === 0) {
    insights.push({
      id: 'OP-01',
      severity: 'critical',
      message: 'Belum ada tutor terdaftar — bimbel tidak bisa beroperasi',
      action: { label: 'Daftarkan Tutor', href: '/admin/users/new' },
    })
  }

  if (!noTutor) {
    // OP-02: hanya relevan di bulan berjalan (CTA "segera" tidak berlaku untuk historis)
    const op02Active = isCurrent && m.activeTutorCount === 0 && pastMidMonth

    // OP-02
    if (op02Active) {
      insights.push({
        id: 'OP-02',
        severity: 'critical',
        message: 'Semua tutor tidak mengajar bulan ini — jadwalkan sesi segera',
        action: { label: 'Buat Jadwal Sesi', href: '/admin/sessions/new' },
      })
    }

    // OP-03
    if (m.utilizationRate > 90) {
      insights.push({
        id: 'OP-03',
        severity: 'danger',
        message: `Utilisasi tutor ${m.utilizationRate}% — risiko burnout, pertimbangkan rekrut tutor baru`,
        action: { label: 'Lihat Ketersediaan Tutor', href: '/admin/availability' },
      })
    }

    // OP-04 (guard: jangan bersamaan dengan OP-02)
    if (!op02Active && m.utilizationRate < 50 && m.utilizationRate > 0 && pastFirstWeek) {
      insights.push({
        id: 'OP-04',
        severity: 'warning',
        message: `Utilisasi tutor hanya ${m.utilizationRate}% — kapasitas tutor banyak yang tidak terpakai`,
        action: { label: 'Lihat Jadwal', href: '/admin/classes' },
      })
    }

    // OP-05: hanya relevan di bulan berjalan dan jika OP-02 tidak aktif (keduanya berbicara soal "tidak ada sesi")
    if (!op02Active && isCurrent && m.sessionCountThisMonth === 0 && pastMidMonth) {
      insights.push({
        id: 'OP-05',
        severity: 'critical',
        message: 'Tidak ada sesi terlaksana bulan ini padahal sudah melewati pertengahan bulan',
        action: { label: 'Buat Jadwal Sesi', href: '/admin/sessions/new' },
      })
    }
  }

  // OP-06
  if (m.attendanceRate !== null && m.attendanceRate < 70 && m.attendanceSessionCount >= 3) {
    insights.push({
      id: 'OP-06',
      severity: 'warning',
      message: `Tingkat kehadiran ${m.attendanceRate}% — tinjau jadwal atau hubungi siswa yang sering absen`,
      action: { label: 'Lihat Laporan Kehadiran', href: '/admin/attendance' },
    })
  }

  // OP-07
  if (m.sessionCountThisMonth > 0 && m.attendanceSessionCount < 3) {
    insights.push({
      id: 'OP-07',
      severity: 'info',
      message: 'Data kehadiran belum cukup untuk dianalisis — butuh minimal 3 sesi',
    })
  }

  // ─── AKADEMIK (disembunyikan jika OP-01 aktif) ───────────────────────────

  if (!noTutor) {
    const ak01Active = m.assessmentCount > 0 && m.passingRate !== null && m.passingRate < 40

    // AK-01
    if (ak01Active) {
      insights.push({
        id: 'AK-01',
        severity: 'critical',
        message: `Passing rate ${m.passingRate}% — lebih dari separuh siswa jauh di bawah target nilai`,
        action: { label: 'Lihat Laporan Nilai', href: '/admin/reports' },
      })
    }

    // AK-02 (guard: jangan bersamaan dengan AK-01)
    if (!ak01Active && m.assessmentCount > 0 && m.passingRate !== null && m.passingRate >= 40 && m.passingRate < 60) {
      insights.push({
        id: 'AK-02',
        severity: 'danger',
        message: `Passing rate ${m.passingRate}% — banyak siswa belum mencapai target nilai`,
        action: { label: 'Lihat Laporan Nilai', href: '/admin/reports' },
      })
    }

    // AK-03
    if (
      m.avgScoreHistory.length >= 3 &&
      m.avgScoreHistory[0] < m.avgScoreHistory[1] &&
      m.avgScoreHistory[1] < m.avgScoreHistory[2]
    ) {
      insights.push({
        id: 'AK-03',
        severity: 'warning',
        message: 'Rata-rata nilai turun selama 2 periode berturut-turut — tinjau metode pengajaran',
        action: { label: 'Lihat Tren Nilai', href: '/admin/reports' },
      })
    }

    // AK-04
    if (m.assessmentCount === 0) {
      insights.push({
        id: 'AK-04',
        severity: 'info',
        message: 'Belum ada asesmen diinput — metrik nilai tidak dapat ditampilkan',
        action: { label: 'Input Nilai Asesmen', href: '/admin/reports' },
      })
    }

    // AK-05
    if (m.studentTutorRatio > 15) {
      insights.push({
        id: 'AK-05',
        severity: 'danger',
        message: `Rasio siswa/tutor ${m.studentTutorRatio.toFixed(1)}:1 — tutor tidak bisa memberi perhatian cukup`,
        action: { label: 'Tambah Tutor', href: '/admin/users/new' },
      })
    }

    // AK-06
    if (m.studentTutorRatio > 0 && m.studentTutorRatio < 3) {
      insights.push({
        id: 'AK-06',
        severity: 'info',
        message: `Rasio siswa/tutor ${m.studentTutorRatio.toFixed(1)}:1 — biaya tutor tidak efisien, fokus akuisisi siswa baru`,
      })
    }

    // AK-07
    if (m.studentsWithoutSession > 0) {
      insights.push({
        id: 'AK-07',
        severity: 'warning',
        message: `${m.studentsWithoutSession} siswa aktif belum memiliki sesi terjadwal — risiko churn dan keluhan orang tua`,
        action: { label: 'Jadwalkan Sesi', href: '/admin/sessions/new' },
      })
    }

    const churnSpiked = m.churnRateLastMonth >= 0 && m.churnRate - m.churnRateLastMonth > 10
    const ak08Active = m.churnRate > 20 || churnSpiked

    // AK-08
    if (ak08Active) {
      insights.push({
        id: 'AK-08',
        severity: 'critical',
        message: `Churn naik drastis ke ${m.churnRate}% — kemungkinan ada masalah sistemik yang perlu segera diselesaikan`,
        action: { label: 'Lihat Data Siswa', href: '/admin/users?role=student' },
      })
    }

    // AK-09 (guard: jangan bersamaan dengan AK-08)
    if (!ak08Active && m.churnRate >= 10 && m.churnRate <= 20) {
      insights.push({
        id: 'AK-09',
        severity: 'danger',
        message: `Churn ${m.churnRate}% — siswa keluar lebih cepat dari yang masuk`,
        action: { label: 'Lihat Data Siswa', href: '/admin/users?role=student' },
      })
    }
  }

  // ─── KEUANGAN ────────────────────────────────────────────────────────────

  const keu01Active = m.maxOverdueDays > 30 && m.outstandingAmount > 0

  // KEU-01
  if (keu01Active) {
    insights.push({
      id: 'KEU-01',
      severity: 'critical',
      message: `Ada tagihan yang sudah ${m.maxOverdueDays} hari belum dibayar — semakin lama, semakin sulit ditagih`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // KEU-02 (guard: jangan bersamaan dengan KEU-01)
  if (!keu01Active && m.outstandingAmount > m.revenueThisMonth * 2 && m.outstandingAmount > 0) {
    insights.push({
      id: 'KEU-02',
      severity: 'danger',
      message: `Tagihan belum dibayar ${formatRupiah(m.outstandingAmount)} — lebih dari 2x revenue bulan ini`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // KEU-03 (guard: jangan bersamaan dengan KEU-01)
  if (!keu01Active && m.maxOverdueDays >= 7 && m.maxOverdueDays <= 30 && m.outstandingAmount > 0) {
    insights.push({
      id: 'KEU-03',
      severity: 'warning',
      message: `Ada invoice yang sudah ${m.maxOverdueDays} hari melewati jatuh tempo — kirim reminder segera`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // KEU-04
  if (m.studentsWithoutInvoice > 0) {
    insights.push({
      id: 'KEU-04',
      severity: 'warning',
      message: `${m.studentsWithoutInvoice} siswa aktif bulan ini belum memiliki invoice — penagihan terlewat`,
      action: { label: 'Buat Invoice', href: '/admin/invoices/new' },
    })
  }

  // KEU-05
  if (m.draftInvoiceCount > 0) {
    insights.push({
      id: 'KEU-05',
      severity: 'info',
      message: `${m.draftInvoiceCount} invoice masih draft dan belum dikirim ke orang tua`,
      action: { label: 'Lihat Invoice Draft', href: '/admin/invoices' },
    })
  }

  // KEU-06 (guard: jangan bersamaan dengan KEU-04, hanya bulan berjalan)
  if (isCurrent && m.studentsWithoutInvoice === 0 && m.revenueThisMonth === 0 && pastMidMonth && m.tutorCount > 0) {
    insights.push({
      id: 'KEU-06',
      severity: 'danger',
      message: 'Belum ada pembayaran masuk bulan ini — cek status pengiriman semua invoice',
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // KEU-07
  if (m.baseRate > 0 && m.avgRevenuePerStudent > 0 && m.avgRevenuePerStudent < m.baseRate * 0.7) {
    insights.push({
      id: 'KEU-07',
      severity: 'warning',
      message: `Rata-rata revenue per siswa (${formatRupiah(m.avgRevenuePerStudent)}) jauh di bawah tarif — cek diskon atau nominal invoice`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // KEU-08
  const keu08Active =
    (m.allInvoicesPaid && m.revenueThisMonth === 0) ||
    (m.revenueThisMonth > 0 && m.outstandingAmount === 0 && !m.allInvoicesPaid)
  if (keu08Active) {
    insights.push({
      id: 'KEU-08',
      severity: 'warning',
      message: 'Ditemukan inkonsistensi data keuangan — kemungkinan ada transaksi yang tidak ter-record dengan benar',
      action: { label: 'Audit Data Keuangan', href: '/admin/invoices' },
    })
  }

  // KEU-09
  if (m.inactiveStudentOutstanding > 0) {
    insights.push({
      id: 'KEU-09',
      severity: 'info',
      message: `Ada ${formatRupiah(m.inactiveStudentOutstanding)} tagihan dari siswa yang sudah tidak aktif`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // ─── GROWTH & RETENSI ────────────────────────────────────────────────────

  const gr01Active =
    m.newStudentsThisMonth === 0 &&
    m.newStudentsLastMonth !== -1 &&
    m.newStudentsLastMonth === 0

  // GR-01
  if (gr01Active) {
    insights.push({
      id: 'GR-01',
      severity: 'danger',
      message: 'Tidak ada siswa baru dalam 2 bulan terakhir — pipeline akuisisi perlu dievaluasi',
    })
  }

  // GR-02 (guard: jangan bersamaan dengan GR-01, hanya jika ada 3 bulan data)
  if (
    !gr01Active &&
    m.newStudentsLastMonth !== -1 &&
    m.newStudentsPrevMonth !== -1 &&
    m.newStudentsThisMonth < m.newStudentsLastMonth &&
    m.newStudentsLastMonth < m.newStudentsPrevMonth
  ) {
    insights.push({
      id: 'GR-02',
      severity: 'warning',
      message: 'Pertumbuhan siswa baru melambat 2 bulan berturut-turut — tinjau kanal akuisisi',
    })
  }

  // GR-03
  if (!m.referralTrackingEnabled && m.newStudentsThisMonth > 0) {
    insights.push({
      id: 'GR-03',
      severity: 'info',
      message: 'Sumber pendaftaran siswa baru belum dicatat — CAC dan efektivitas pemasaran tidak bisa dihitung',
    })
  }

  const gr04Active = m.retentionRateLastMonth !== -1 && m.retentionRateLastMonth - m.retentionRate > 20

  // GR-04
  if (gr04Active) {
    insights.push({
      id: 'GR-04',
      severity: 'critical',
      message: `Retensi turun ${Math.round(m.retentionRateLastMonth - m.retentionRate)} poin dalam sebulan — kemungkinan ada kejadian pemicu yang perlu segera diatasi`,
      action: { label: 'Lihat Data Siswa', href: '/admin/users?role=student' },
    })
  }

  // GR-05 (guard: jangan bersamaan dengan GR-04)
  if (!gr04Active && m.retentionRate < 80 && m.bimbelAgeMonths >= 2) {
    insights.push({
      id: 'GR-05',
      severity: 'danger',
      message: `Retensi ${m.retentionRate}% — lebih dari 1 dari 5 siswa tidak bertahan`,
      action: { label: 'Lihat Data Siswa', href: '/admin/users?role=student' },
    })
  }

  // GR-06
  if (!m.cycleCompleted) {
    insights.push({
      id: 'GR-06',
      severity: 'info',
      message: 'Belum ada siklus kelas yang selesai — tingkat re-enrollment belum bisa dihitung',
    })
  }

  // GR-07
  if (m.inactiveStudentsWithBalance > 0) {
    insights.push({
      id: 'GR-07',
      severity: 'info',
      message: `${m.inactiveStudentsWithBalance} siswa non-aktif masih memiliki tagihan terbuka`,
      action: { label: 'Lihat Invoice', href: '/admin/invoices' },
    })
  }

  // GR-08
  if (m.retentionRate === 100 && m.bimbelAgeMonths < 3) {
    insights.push({
      id: 'GR-08',
      severity: 'ok',
      message: 'Retensi 100% di bulan awal — manfaatkan untuk minta testimoni dan referral dari orang tua',
    })
  }

  // ─── SISWA KRITIS ────────────────────────────────────────────────────────

  // SK-01
  if (m.criticalStudentCount > 0) {
    insights.push({
      id: 'SK-01',
      severity: 'critical',
      message: `${m.criticalStudentCount} siswa dalam kondisi kritis — perlu tindak lanjut segera`,
      action: { label: 'Lihat Siswa Kritis', href: '/admin/siswa?filter=kritis' },
    })
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
