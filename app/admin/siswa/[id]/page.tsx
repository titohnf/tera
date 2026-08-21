import { createAdminClient } from '@/lib/supabase/server-admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { coversSession } from '@/lib/enrollment'
import { sekarangIso, bulanIni } from '@/lib/waktu'
import { todayWib } from '@/lib/daily-message'
import { jendelaLaporan } from '@/lib/reports/laporan-bulanan'
import { evaluateStudentCritical } from '@/lib/studentCritical'
import CriticalDetailCard from '@/components/siswa/CriticalDetailCard'
import StudentStatusButton from '@/components/admin/siswa/StudentStatusButton'
import DeleteStudentButton from '@/components/admin/siswa/DeleteStudentButton'
import JadwalTable from '@/components/siswa/JadwalTable'
import SiswaTabs from '@/components/siswa/SiswaTabs'
import TagihanList, { type PembayaranRow } from '@/components/siswa/TagihanList'
import SiswaSidebar from '@/components/siswa/SiswaSidebar'
import RiwayatKelas from '@/components/siswa/RiwayatKelas'
import PerformaTabs, { type SubjectStats } from '@/components/admin/siswa/PerformaTabs'

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  full_name: string | null
  nickname: string | null
  email: string | null
  phone: string | null
  level: string | null
  grade: string | null
  birth_date: string | null
  parent_name: string | null
  parent_phone: string | null
  created_at: string
  avatar_url: string | null
  is_active: boolean
}

type EnrolledClass = {
  id: string
  name: string
  level: string | null
  is_active: boolean
  tutor: { full_name: string } | null
  schedule_days: number[]
  schedule_time: string | null
  subject_names: string[]
  enrolled_at: string | null
}

type SessionRow = {
  id: string
  cancellation_reason?: string | null
  class_id: string
  scheduled_at: string
  topic: string | null
  status: string
  subject_id: string | null
}

type AttendanceRow = {
  session_id: string
  status: string
}

type InvoiceRow = {
  id: string
  invoice_number: string
  total_due: number
  status: string
  due_date: string | null
  issued_at: string | null
  notes: string | null
  classes: { name: string } | null
}

type AssessmentRow = {
  id: string
  title: string
  max_score: number
  session_id: string
  sessions: { scheduled_at: string; topic: string | null; class_id: string } | null
}

type AssessmentResultRow = {
  assessment_id: string
  score: number | null
  feedback: string | null
}

/**
 * Tab-nya sama persis dengan beranda anak di portal keluarga
 * (`app/keluarga/[studentId]/page.tsx`) — termasuk "Laporan", yang dulu di sini
 * bernama "Catatan" dan memuat daftar catatan performa mentah. Admin dan orang
 * tua yang saling menelepon sambil melihat layar berbeda harus lebih dulu
 * sepakat mereka sedang melihat hal yang sama; itu tidak mungkin kalau tab
 * ketiganya saja sudah berbeda isi.
 *
 * Catatan performanya tidak hilang: Laporan Bulanan membacanya dari tabel yang
 * sama (`performance_notes`, lihat lib/reports/laporan-bulanan.ts) dan
 * mengelompokkannya per kategori — jadi admin kini membacanya per bulan, di
 * halaman yang sama dengan yang dibuka orang tua.
 */
type Tab = 'jadwal' | 'tagihan' | 'laporan'

const TABS: { key: Tab; label: string }[] = [
  { key: 'jadwal',    label: 'Kelas' },
  { key: 'tagihan',   label: 'Tagihan' },
  { key: 'laporan',   label: 'Laporan' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

const DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const STATUS_SESSION: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'Terjadwal',  cls: 'bg-blue-50 text-blue-500' },
  completed:  { label: 'Selesai',   cls: 'bg-green-50 text-green-600' },
  cancelled:  { label: 'Dibatalkan', cls: 'bg-red-50 text-red-400' },
}

const ATTENDANCE_STATUS: Record<string, { label: string; cls: string }> = {
  present: { label: 'Hadir',      cls: 'bg-green-50 text-green-600' },
  late:    { label: 'Terlambat',  cls: 'bg-yellow-50 text-yellow-600' },
  absent:  { label: 'Absen',      cls: 'bg-red-50 text-red-400' },
  excused: { label: 'Izin',       cls: 'bg-gray-100 text-gray-400' },
}

function toSlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SiswaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab: rawTab } = await searchParams
  const activeTab: Tab = (TABS.some(t => t.key === rawTab) ? rawTab : 'jadwal') as Tab

  const sekarang = await sekarangIso()
  const admin = createAdminClient()

  let student: Profile | null = null

  if (isUUID(id)) {
    const { data } = await admin
      .from('profiles')
      .select('id, full_name, nickname, email, phone, level, grade, birth_date, parent_name, parent_phone, created_at, avatar_url, is_active')
      .eq('id', id)
      .eq('role', 'student')
      .single()
    student = data as Profile | null
  } else {
    const { data: all } = await admin
      .from('profiles')
      .select('id, full_name, nickname, email, phone, level, grade, birth_date, parent_name, parent_phone, created_at, avatar_url, is_active')
      .eq('role', 'student')
    student = (all as Profile[] | null)?.find(s => toSlug(s.full_name ?? '') === id) ?? null
  }

  if (!student) notFound()
  const profile = student
  const studentId = profile.id
  const urlSlug = toSlug(profile.full_name ?? '') || studentId

  type RawEnroll = {
    is_active: boolean
    enrolled_at: string | null
    unenrolled_at: string | null
    classes: {
      id: string
      name: string
      level: string | null
      is_active: boolean
      schedule_days: number[] | null
      schedule_time: string | null
      profiles: { full_name: string } | null
    } | null
  }

  const allEnrollResult = await (admin
    .from('class_students')
    .select('is_active, enrolled_at, unenrolled_at, classes(id, name, level, is_active, schedule_days, schedule_time, profiles!tutor_id(full_name))')
    .eq('student_id', studentId) as unknown as Promise<{ data: RawEnroll[] | null }>)

  const allEnrollRaw: RawEnroll[] = allEnrollResult.data ?? []

  const toClass = (e: RawEnroll): EnrolledClass | null => {
    if (!e.classes) return null
    return {
      id: e.classes.id,
      name: e.classes.name,
      level: e.classes.level,
      is_active: e.classes.is_active,
      tutor: e.classes.profiles ? { full_name: e.classes.profiles.full_name } : null,
      schedule_days: e.classes.schedule_days ?? [],
      schedule_time: e.classes.schedule_time ?? null,
      subject_names: [],
      enrolled_at: e.enrolled_at ?? null,
    }
  }

  const enrolledClasses: EnrolledClass[] = allEnrollRaw.filter(e => e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)
  const historicalClasses: EnrolledClass[] = allEnrollRaw.filter(e => !e.is_active).map(toClass).filter((c): c is EnrolledClass => c !== null)

  const allClassIds = allEnrollRaw.map(e => e.classes?.id).filter((cid): cid is string => !!cid)
  const activeClassIds = enrolledClasses.map(c => c.id)

  // Rentang keanggotaan per kelas, dipakai membuang sesi di luar masa siswa
  // ikut kelas itu — siswa yang baru masuk Agustus tidak boleh melihat jadwal
  // Juli kelasnya di tab Kelas, ikut terhitung di statistik, atau muncul di
  // riwayat nilainya.
  const windowByClass = new Map(
    allEnrollRaw.filter(e => e.classes).map(e => [e.classes!.id, e] as const),
  )
  const inWindow = (s: { class_id: string; scheduled_at: string }) => {
    const window = windowByClass.get(s.class_id)
    return window ? coversSession(window, s.scheduled_at) : false
  }

  // Fetch class subjects via two explicit queries (avoids FK join ambiguity in PostgREST)
  if (allClassIds.length > 0) {
    const { data: csRows } = await admin
      .from('class_subjects')
      .select('class_id, subject_id')
      .in('class_id', allClassIds) as unknown as { data: { class_id: string; subject_id: string }[] | null }

    const subjIdsForClasses = [...new Set((csRows ?? []).map(r => r.subject_id))]
    const subjNameMapForClasses = new Map<string, string>()
    if (subjIdsForClasses.length > 0) {
      const { data: subjRows } = await admin
        .from('subjects')
        .select('id, name')
        .in('id', subjIdsForClasses) as unknown as { data: { id: string; name: string }[] | null }
      for (const r of subjRows ?? []) subjNameMapForClasses.set(r.id, r.name)
    }

    const csMap = new Map<string, string[]>()
    for (const row of csRows ?? []) {
      const name = subjNameMapForClasses.get(row.subject_id)
      if (name) {
        const arr = csMap.get(row.class_id) ?? []
        arr.push(name)
        csMap.set(row.class_id, arr)
      }
    }
    for (const cls of [...enrolledClasses, ...historicalClasses]) {
      cls.subject_names = csMap.get(cls.id) ?? []
    }
  }

  const [sessionsRes, attendancesRes, invoicesRes, sesiLewatRes] = await Promise.all([
    allClassIds.length > 0
      ? admin.from('sessions').select('id, class_id, scheduled_at, topic, status, cancellation_reason, subject_id').in('class_id', allClassIds).eq('status', 'completed').order('scheduled_at', { ascending: false }).limit(200) as unknown as Promise<{ data: SessionRow[] | null }>
      : Promise.resolve({ data: [] as SessionRow[] }),
    admin.from('attendances').select('session_id, status').eq('student_id', studentId) as unknown as Promise<{ data: AttendanceRow[] | null }>,
    admin.from('invoices').select('id, invoice_number, total_due, status, due_date, issued_at, notes, classes(name)').eq('student_id', studentId).order('issued_at', { ascending: false }).limit(24) as unknown as Promise<{ data: InvoiceRow[] | null }>,
    // Sesi yang sudah LEWAT dan tidak dibatalkan — apa pun statusnya.
    //
    // Dipakai khusus untuk "kapan terakhir siswa ini les" (W-SESI dan KC-04),
    // dan sengaja terpisah dari kueri `completed` di atas yang menyuapi
    // statistik kehadiran. Dulu keduanya satu: sesi yang sudah berlangsung tapi
    // absensinya belum diisi masih berstatus `scheduled`, jadi tidak dihitung,
    // dan siswa yang les kemarin bisa dilaporkan "tidak ada sesi dalam 8 hari".
    // Yang diukur jadinya kerajinan tutor mengisi absensi, bukan apakah
    // siswanya masih les.
    allClassIds.length > 0
      ? admin.from('sessions').select('class_id, scheduled_at').in('class_id', allClassIds).neq('status', 'cancelled').lte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: false }).limit(50) as unknown as Promise<{ data: { class_id: string; scheduled_at: string }[] | null }>
      : Promise.resolve({ data: [] as { class_id: string; scheduled_at: string }[] }),
  ])

  const sessions: SessionRow[] = (sessionsRes.data ?? []).filter(inWindow)
  const sesiLewatTerakhir = (sesiLewatRes.data ?? []).filter(inWindow)[0] ?? null
  const attendances: AttendanceRow[] = attendancesRes.data ?? []
  const invoices: InvoiceRow[] = invoicesRes.data ?? []

  // Pembayaran per tagihan, untuk baris yang bisa dibuka di tab Tagihan.
  const { data: pembayaranRows } = invoices.length > 0
    ? await admin
        .from('invoice_payments')
        .select('id, invoice_id, amount, paid_at')
        .in('invoice_id', invoices.map(i => i.id)) as unknown as { data: PembayaranRow[] | null }
    : { data: null }
  const pembayaran: PembayaranRow[] = pembayaranRows ?? []

  const sessionIds = sessions.map(s => s.id)
  let assessments: AssessmentRow[] = []
  let assessmentResults: AssessmentResultRow[] = []

  if (sessionIds.length > 0) {
    const assessRes = await admin.from('assessments').select('id, title, max_score, session_id, sessions(scheduled_at, topic, class_id)').in('session_id', sessionIds) as unknown as { data: AssessmentRow[] | null }
    assessments = assessRes.data ?? []
    if (assessments.length > 0) {
      const aIds = assessments.map(a => a.id)
      const resRes = await admin.from('assessment_results').select('assessment_id, score, feedback').eq('student_id', studentId).in('assessment_id', aIds) as unknown as { data: AssessmentResultRow[] | null }
      assessmentResults = resRes.data ?? []
    }
  }

  type UpcomingSession = { id: string; class_id: string; scheduled_at: string; topic: string | null; status: string; cancellation_reason: string | null; subject_id: string | null; profiles: { full_name: string } | null }

  let upcomingSessions: UpcomingSession[] = []
  let nextScheduledSessionDate: Date | null = null

  if (activeClassIds.length > 0) {
    const nowIso = new Date().toISOString()
    const { data: allSessionsData } = await admin
      .from('sessions')
      .select('id, class_id, scheduled_at, topic, status, cancellation_reason, subject_id, profiles!tutor_id(full_name)')
      .in('class_id', activeClassIds)
      .order('scheduled_at', { ascending: false }) as unknown as { data: UpcomingSession[] | null }
    upcomingSessions = (allSessionsData ?? []).filter(inWindow)

    // Sesi terjadwal TERDEKAT — yang paling kecil tanggalnya, bukan yang
    // pertama ditemukan.
    //
    // Kueri di atas mengurutkan menurun (`ascending: false`) demi tabel jadwal,
    // jadi `.find()` di sini dulu memungut sesi terjadwal yang PALING JAUH.
    // Akibatnya KL-02 ("Tidak ada sesi terjadwal dalam 14 hari ke depan")
    // menyala untuk siswa yang sebenarnya punya sesi minggu depan, asalkan sesi
    // terakhir di rangkaiannya lebih dari 14 hari lagi. Halaman daftar siswa
    // sudah benar sejak awal — ia mengambil yang terkecil, lihat
    // lib/supabase/studentCriticalQueries.ts:183 — sehingga kedua halaman
    // menampilkan status berbeda untuk siswa yang sama.
    const terjadwal = upcomingSessions.filter(
      s => s.status === 'scheduled' && s.scheduled_at >= nowIso,
    )
    if (terjadwal.length > 0) {
      const terdekat = terjadwal.reduce((a, b) => (a.scheduled_at <= b.scheduled_at ? a : b))
      nextScheduledSessionDate = new Date(terdekat.scheduled_at)
    }
  }

  const sessionSubjectIds = [...new Set([
    ...sessions.map(s => s.subject_id),
    ...upcomingSessions.map(s => s.subject_id),
  ].filter((id): id is string => !!id))]
  const subjectNameMap = new Map<string, string>()
  if (sessionSubjectIds.length > 0) {
    const { data: subjectRows } = await admin
      .from('subjects')
      .select('id, name')
      .in('id', sessionSubjectIds) as unknown as { data: { id: string; name: string }[] | null }
    for (const s of subjectRows ?? []) subjectNameMap.set(s.id, s.name)
  }

  // Patch enrolled + historical classes: fill missing subject_name from session-level subject_id
  const classSubjectFromSessionsMap = new Map<string, string>()
  for (const s of [...sessions, ...upcomingSessions]) {
    if (!classSubjectFromSessionsMap.has(s.class_id) && s.subject_id) {
      const name = subjectNameMap.get(s.subject_id)
      if (name) classSubjectFromSessionsMap.set(s.class_id, name)
    }
  }
  for (const cls of [...enrolledClasses, ...historicalClasses]) {
    if (cls.subject_names.length === 0) {
      const name = classSubjectFromSessionsMap.get(cls.id)
      if (name) cls.subject_names = [name]
    }
  }

  // Build session-level tutor map (session_id → first name)
  const sessionTutorMap: Record<string, string> = {}
  for (const s of upcomingSessions) {
    if (s.profiles?.full_name) {
      sessionTutorMap[s.id] = s.profiles.full_name
    }
  }

  const historicalClassIds = historicalClasses.map(c => c.id)
  const historicalSessionStats = new Map<string, { count: number; firstDate: string; lastDate: string }>()
  if (historicalClassIds.length > 0) {
    const { data: histData } = await admin
      .from('sessions')
      .select('class_id, scheduled_at')
      .in('class_id', historicalClassIds)
      .eq('status', 'completed')
      .order('scheduled_at', { ascending: true }) as unknown as { data: { class_id: string; scheduled_at: string }[] | null }
    for (const s of (histData ?? []).filter(inWindow)) {
      const existing = historicalSessionStats.get(s.class_id)
      if (!existing) {
        historicalSessionStats.set(s.class_id, { count: 1, firstDate: s.scheduled_at, lastDate: s.scheduled_at })
      } else {
        existing.count++
        if (s.scheduled_at > existing.lastDate) existing.lastDate = s.scheduled_at
      }
    }
  }

  const attendanceMap = new Map<string, string>()
  for (const a of attendances) attendanceMap.set(a.session_id, a.status)

  const classNameMap = new Map<string, string>()
  for (const c of enrolledClasses) classNameMap.set(c.id, c.name)

  const resultMap = new Map<string, AssessmentResultRow>()
  for (const r of assessmentResults) resultMap.set(r.assessment_id, r)

  // Hari ini menurut WIB, bukan UTC. `toISOString()` polos meleset satu hari
  // antara pukul 00:00–06:59 WIB, dan di jam-jam itu tagihan yang jatuh tempo
  // kemarin belum terhitung terlambat.
  const today = todayWib()
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const hadirCount = completedSessions.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const hadirPct = completedSessions.length > 0 ? Math.round((hadirCount / completedSessions.length) * 100) : null
  const overdueInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.due_date && inv.due_date < today)
  const unpaidTotal = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((s, i) => s + i.total_due, 0)
  const paidTotal = invoices.filter(inv => inv.status === 'paid').reduce((s, i) => s + i.total_due, 0)

  const now2 = new Date()
  const startOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1)
  const sessionsThisMonth = completedSessions.filter(s => new Date(s.scheduled_at) >= startOfMonth)
  const hadirThisMonth = sessionsThisMonth.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
  const attendanceRateThisMonth = sessionsThisMonth.length >= 4 ? Math.round((hadirThisMonth / sessionsThisMonth.length) * 100) : null

  const sortedAssessmentScores = assessments.filter(a => resultMap.get(a.id)?.score != null).sort((a, b) => (b.sessions?.scheduled_at ?? '').localeCompare(a.sessions?.scheduled_at ?? '')).map(a => resultMap.get(a.id)!.score as number)

  const comprehensionLevels = assessmentResults.map(r => r.feedback).filter((f): f is string => /^L[0-5]$/.test(f ?? ''))
  const avgComprehensionLevel = comprehensionLevels.length > 0
    ? `L${Math.round(comprehensionLevels.reduce((sum, l) => sum + parseInt(l[1]), 0) / comprehensionLevels.length)}`
    : null

  const classAllSubjectsMap = new Map<string, string[]>()
  for (const c of [...enrolledClasses, ...historicalClasses]) {
    if (c.subject_names.length > 0) classAllSubjectsMap.set(c.id, c.subject_names)
  }

  const sessionsBySubject = new Map<string, SessionRow[]>()
  for (const s of completedSessions) {
    const subj =
      (s.subject_id && subjectNameMap.get(s.subject_id)) ||
      classAllSubjectsMap.get(s.class_id)?.[0] ||
      'Lainnya'
    if (!sessionsBySubject.has(subj)) sessionsBySubject.set(subj, [])
    sessionsBySubject.get(subj)!.push(s)
  }

  const subjectStats: SubjectStats[] = Array.from(sessionsBySubject.entries()).map(([subject, subSessions]) => {
    const hadir = subSessions.filter(s => { const st = attendanceMap.get(s.id); return st === 'present' || st === 'late' }).length
    const subSessionIds = new Set(subSessions.map(s => s.id))
    const subLevels = assessments
      .filter(a => subSessionIds.has(a.session_id))
      .map(a => resultMap.get(a.id)?.feedback)
      .filter((f): f is string => /^L[0-5]$/.test(f ?? ''))
    return {
      subject,
      totalSessions: subSessions.length,
      attendanceRate: subSessions.length > 0 ? Math.round((hadir / subSessions.length) * 100) : null,
      avgComprehension: subLevels.length > 0
        ? `L${Math.round(subLevels.reduce((sum, l) => sum + parseInt(l[1]), 0) / subLevels.length)}`
        : null,
    }
  })

  const tutorIsActive = enrolledClasses.length === 0 || enrolledClasses.some(c => c.tutor !== null)
  const lastSessionDate = sesiLewatTerakhir ? new Date(sesiLewatTerakhir.scheduled_at) : null
  const enrolledAt = new Date(profile.created_at)
  const daysBetween = (a: Date, b: Date) => Math.floor((b.getTime() - a.getTime()) / 86_400_000)

  const criticalInput = {
    studentId: profile.id,
    studentName: profile.full_name ?? '',
    // Dulu dipaku `true`. Akibatnya siswa yang sudah dinonaktifkan tetap
    // dievaluasi seolah masih les — semua aturan churn dan layanan disaring
    // dengan `input.isActive` (lihat lib/studentCritical.ts), jadi ia bisa
    // muncul sebagai "Belum di Kelas" atau "Tidak Ada Sesi" justru karena
    // memang sudah berhenti.
    isActive: profile.is_active ?? true,
    enrolledAt,
    attendanceRateThisMonth,
    sessionCountThisMonth: sessionsThisMonth.length,
    latestScore: sortedAssessmentScores[0] ?? null,
    previousScore: sortedAssessmentScores[1] ?? null,
    scoreHistory: sortedAssessmentScores.slice(0, 6),
    lastSessionDate,
    hasActiveClass: enrolledClasses.length > 0,
    daysSinceEnrollment: daysBetween(enrolledAt, now2),
    nextScheduledSessionDate,
    tutorIsActive,
    maxOverdueDays: overdueInvoices.length > 0 ? Math.max(...overdueInvoices.map(inv => daysBetween(new Date(inv.due_date!), now2))) : 0,
    totalOutstanding: unpaidTotal,
    monthlyBaseRate: 500_000,
  }

  const criticalResult = evaluateStudentCritical(criticalInput)
  const tabUrl = (t: Tab) => `/admin/siswa/${urlSlug}?tab=${t}`

  // Jendela bulan yang SAMA dengan yang dilihat orang tua — keduanya memanggil
  // `jendelaLaporan`, supaya admin dan orang tua tidak pernah menyebut daftar
  // bulan yang berbeda saat saling menelepon.
  const laporan = jendelaLaporan(await bulanIni())

  // ─── Schedule table ───────────────────────────────────────────────────────────
  const CLASS_PALETTE = [
    'bg-blue-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500',
    'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
  ]
  const classColorMap = new Map<string, string>()
  enrolledClasses.forEach((cls, i) => classColorMap.set(cls.id, CLASS_PALETTE[i % CLASS_PALETTE.length]))

  const schedClassByDay = new Map<number, { classId: string }[]>()
  for (const cls of enrolledClasses) {
    for (const day of cls.schedule_days) {
      if (!schedClassByDay.has(day)) schedClassByDay.set(day, [])
      schedClassByDay.get(day)!.push({ classId: cls.id })
    }
  }

  const schedDays = [0, 1, 2, 3, 4, 5, 6].filter(d => schedClassByDay.has(d))

  const tabCounts: Partial<Record<Tab, number>> = {
    jadwal: enrolledClasses.length + historicalClasses.length,
    tagihan: invoices.length,
    laporan: laporan.length,
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/siswa" className="hover:text-blue-600 transition-colors">Siswa</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{profile.full_name ?? '(tanpa nama)'}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="col-span-2 space-y-5">

          {/* Profile card */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                {profile.avatar_url ? (
                  <Image src={profile.avatar_url} alt={profile.full_name ?? ''} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-semibold text-blue-700">{getInitials(profile.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-gray-900">{profile.full_name ?? '(tanpa nama)'}</h1>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {profile.is_active ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                {(profile.nickname || profile.grade) && (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {profile.nickname && (
                      <span className="text-sm text-gray-500">{profile.nickname}</span>
                    )}
                    {profile.grade && (
                      <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        Kelas {profile.grade}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Link
                href={`/admin/users/${studentId}/edit`}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Edit
              </Link>
            </div>
          </div>

          {/* Status kritis, tepat di bawah nama.
              Sempat tinggal di kolom kanan, tapi kolom itu sempit: deskripsi
              kondisi, baris tindakan, dan tautan "Tangani" saling berdesakan
              sampai tiap kondisi jadi beberapa baris pecah. Di kolom utama ia
              muat dalam satu baris per kondisi, dan tetap terbaca lebih dulu
              sebelum tab mana pun dibuka. */}
          <CriticalDetailCard result={criticalResult} input={criticalInput} />

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 overflow-hidden">
            {/* Tab nav */}
            <SiswaTabs
              tabs={TABS.map(t => ({ ...t, count: tabCounts[t.key] }))}
              active={activeTab}
              hrefFor={t => tabUrl(t as Tab)}
            />

            {/* Tab: Jadwal */}
            {activeTab === 'jadwal' && (
              <div className="p-5 space-y-6">
                {/* Tidak ada lagi daftar "Kelas Aktif" di sini. Ia dulu hadir
                    demi tombol Keluar per kelas; begitu tombol itu pindah ke
                    dialog "Nonaktifkan Siswa", yang tersisa cuma pengulangan —
                    kelasnya sudah didaftar di kolom kanan, tutornya sudah
                    tertulis di tiap sesi pada tabel di bawah. */}
                <div>
                  <JadwalTable
                    sekarangIso={sekarang}
                    showAdminLinks
                    sessions={upcomingSessions}
                    enrolledClasses={enrolledClasses.map(c => ({ id: c.id, name: c.name, is_active: c.is_active, subject_name: c.subject_names[0] ?? null, tutor: c.tutor }))}
                    subjectNameMap={Object.fromEntries(subjectNameMap)}
                    attendanceMap={Object.fromEntries(attendanceMap)}
                    sessionTutorMap={sessionTutorMap}
                    studentId={studentId}
                  />
                </div>

                <RiwayatKelas
                  kelas={historicalClasses.map(c => {
                    const stats = historicalSessionStats.get(c.id)
                    return {
                      id: c.id,
                      name: c.name,
                      subject_names: c.subject_names,
                      jumlahSesi: stats?.count ?? 0,
                      mulai: stats?.firstDate ?? null,
                      selesai: stats?.lastDate ?? null,
                    }
                  })}
                  classHref={id => `/admin/classes/${id}`}
                />
              </div>
            )}

            {/* Tab: Tagihan */}
            {activeTab === 'tagihan' && (
              <div>
                <div className="p-5">
                  <TagihanList tagihan={invoices} pembayaran={pembayaran} hariIni={today} untuk="admin" />
                </div>
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href={`/admin/invoices/new?student_id=${studentId}`} className="text-sm font-medium text-blue-600 hover:underline">
                    + Buat Tagihan
                  </Link>
                </div>
              </div>
            )}

            {/* Tab: Laporan — bentuk dan isinya sama dengan tab Laporan di
                portal keluarga, hanya tautannya menuju halaman admin. */}
            {activeTab === 'laporan' && (
              <div className="p-5">
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                  {laporan.map(m => {
                    const [y, mo] = m.split('-').map(Number)
                    return (
                      <li key={m}>
                        <Link
                          href={`/admin/laporan-bulanan?student_id=${studentId}&month=${m}`}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          <span className="text-sm text-gray-800">
                            {new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString('id-ID', {
                              month: 'long',
                              year: 'numeric',
                              timeZone: 'UTC',
                            })}
                          </span>
                          <span className="text-xs text-blue-600">Buka →</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SiswaSidebar
            kelasAktif={enrolledClasses.filter(c => c.is_active)}
            totalSesi={completedSessions.length}
            hadirPersen={hadirPct}
            sudahBayar={paidTotal}
            belumBayar={unpaidTotal}
            bergabung={profile.created_at}
            studentId={studentId}
            classHref={id => `/admin/classes/${id}`}
          />

          {/* Aksi */}
          <div className="bg-white rounded-xl shadow ring-1 ring-gray-900/5 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Aksi</h2>
            <div className="space-y-2">
              <Link
                href={`/admin/invoices/new?student_id=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Buat Tagihan
              </Link>
              <Link
                href={`/admin/sessions/new?studentId=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                + Jadwalkan Sesi
              </Link>
              <Link
                href={`/admin/laporan-bulanan?student_id=${studentId}`}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Laporan Bulanan
              </Link>
              <StudentStatusButton
                userId={studentId}
                isActive={profile.is_active ?? true}
                studentName={profile.full_name ?? 'Siswa'}
                kelasAktif={enrolledClasses.map(c => ({ id: c.id, name: c.name }))}
              />
              {/* Dipisah garis supaya tidak tertekan saat yang dimaksud
                  sebenarnya "nonaktifkan" — yang ini tidak bisa dibatalkan. */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <DeleteStudentButton
                  userId={studentId}
                  studentName={profile.full_name ?? 'Siswa'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
