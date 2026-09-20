'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { rosterForSession } from '@/lib/enrollment'
import { materiKurikulumSesi } from '@/lib/materi-sesi'

/**
 * Boleh melihat / memicu penyelesaian sesi ini?
 *
 * Berkas ini `'use server'`, jadi setiap fungsi yang diekspornya adalah titik
 * masuk yang bisa dipanggil siapa pun yang punya sesi login — id server action
 * bukan rahasia dari orang yang bisa memuat bundel halaman. Sebelumnya
 * keduanya berjalan dengan service role tanpa satu pun pemeriksaan, dan
 * `checkAndCompleteSession()` MENGUBAH status sesi. Yang menahannya hanya
 * kebetulan bahwa tidak ada orang tak dikenal yang punya akun — persis asumsi
 * yang gugur begitu pendaftaran mandiri dibuka.
 *
 * Tidak memakai `isSessionTutor()`: fungsi itu mengunci sesi yang payroll-nya
 * sudah disetujui, sedangkan halaman tutor memanggil pemeriksa ini justru untuk
 * MENAMPILKAN keadaan sesi lama. Yang dibutuhkan di sini cuma "sesi ini memang
 * urusanmu".
 */
async function bolehLihatSesi(
  admin: ReturnType<typeof createAdminClient>,
  sessionId: string,
): Promise<boolean> {
  const user = await getUser()
  if (!user) return false

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return true

  const { data: session } = await admin
    .from('sessions')
    .select('tutor_id')
    .eq('id', sessionId)
    .single()
  return session?.tutor_id === user.id
}

/**
 * Sejak kapan pembahasan soal ikut menahan penyelesaian jurnal.
 *
 * Aturan ini lahir September 2026, dan sesi-sesi sebelumnya sudah lama selesai
 * dan digaji. Menagihkannya surut berarti ratusan sesi lama serentak berubah
 * jadi "belum lengkap" — panel review payroll-nya tersembunyi, dan tutor
 * diminta melengkapi pekerjaan yang saat dikerjakan memang belum diminta.
 * Jadi batas ini tanggal, bukan sakelar.
 *
 * Waktunya +07:00 karena `scheduled_at` selalu dibaca orang sebagai jam
 * setempat: sesi 1 September pagi harus jatuh di sisi "wajib", dan dengan UTC
 * sesi sebelum pukul 07.00 justru jatuh ke sisi sebelumnya.
 */
const PEMBAHASAN_WAJIB_SEJAK = new Date('2026-09-01T00:00:00+07:00')

/** Tautan yang benar-benar terisi, bukan sekadar kolom yang ada. */
function adaTautan(url: string | null | undefined): boolean {
  return !!url?.trim()
}

export type CompletionCheck = {
  studentCount: number
  hasTopic: boolean
  attendanceCount: number
  presentLateCount: number
  notesCount: number
  materialsCount: number
  /**
   * Materi kurikulum untuk topik sesi ini — yang muncul sendiri untuk murid dan
   * yang membuat kolom lampiran tutor terkunci. Tidak pernah berupa baris
   * `materials`, jadi harus dihitung terpisah.
   */
  materiKurikulumCount: number
  assessmentsCount: number
  gradedCount: number
  /** Jumlah nilai yang wajib terisi = jumlah asesmen × siswa yang hadir/telat */
  gradesRequired: number
  /** Pembahasan yang sudah terisi, dari asesmen maupun kartu latihan soal. */
  pembahasanCount: number
  /** Berapa yang seharusnya ada: satu per asesmen/topik yang punya soal. */
  pembahasanRequired: number
  /** Sesi ini sudah kena aturan pembahasan? Lihat PEMBAHASAN_WAJIB_SEJAK. */
  pembahasanWajib: boolean
  hasAllAttendance: boolean
  hasAllNotes: boolean
  hasMaterials: boolean
  hasAssessments: boolean
  hasPembahasan: boolean
  canComplete: boolean
}

export async function getSessionCompletionStatus(sessionId: string): Promise<CompletionCheck | null> {
  const admin = createAdminClient()
  if (!(await bolehLihatSesi(admin, sessionId))) return null

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, topic, class_id, scheduled_at, curriculum_topic_id, selected_cp_ids, cp_urls, cp_pembahasan_urls')
    .eq('id', sessionId)
    .single()

  if (!session) return null

  const [
    { data: enrollments },
    { count: attendanceCount },
    { data: presentLateAttendances },
    { data: notedStudents },
    { count: materialsCount },
    { data: assessmentList },
  ] = await Promise.all([
    // Jumlah siswa yang dinilai per sesi ini, bukan seluruh anggota kelas:
    // siswa yang baru bergabung setelah sesi ini tidak boleh ikut menahan
    // penyelesaian sesi karena presensinya kosong.
    admin.from('class_students').select('enrolled_at, unenrolled_at, is_active').eq('class_id', session.class_id),
    admin.from('attendances').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('attendances').select('student_id').eq('session_id', sessionId).in('status', ['present', 'late']),
    // A student may have up to one note per category — count distinct students, not rows
    admin.from('performance_notes').select('student_id').eq('session_id', sessionId),
    admin.from('materials').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
    admin.from('assessments').select('id, link_url, pembahasan_url').eq('session_id', sessionId),
  ])

  // Materi yang datang dari Kurikulum tidak pernah menjadi baris `materials`:
  // begitu topiknya bermateri, `MaterialUploader` justru MENGUNCI kolom lampiran
  // dan memberi tahu tutor bahwa bahannya sudah otomatis muncul untuk murid.
  // Menghitung baris `materials` saja karena itu menagih tutor atas pekerjaan
  // yang sengaja dilarang dikerjakannya — lencana "Materi" merah selamanya, dan
  // sesi yang tidak pernah bisa diselesaikan.
  const materiKurikulum = await materiKurikulumSesi(
    admin,
    session.curriculum_topic_id ?? null,
    session.selected_cp_ids ?? [],
  )
  const notesCount = new Set((notedStudents ?? []).map(n => n.student_id)).size

  const sc = rosterForSession(enrollments ?? [], session.scheduled_at).length
  const assessmentIds = (assessmentList ?? []).map(a => a.id)
  const assessmentsCount = assessmentIds.length
  const presentLateIds = (presentLateAttendances ?? []).map(a => a.student_id)
  const presentLateCount = presentLateIds.length

  // Only students who actually attended need a score — an absent student has
  // nothing to be assessed on, so their blank row must not block completion.
  let gradedCount = 0
  if (assessmentIds.length > 0 && presentLateCount > 0) {
    const { count } = await admin
      .from('assessment_results')
      .select('*', { count: 'exact', head: true })
      .in('assessment_id', assessmentIds)
      .in('student_id', presentLateIds)
      .not('score', 'is', null)
    gradedCount = count ?? 0
  }
  const gradesRequired = assessmentsCount * presentLateCount

  // SETIAP asesmen wajib punya pembahasan, punya tautan soal atau tidak: soal
  // yang dikerjakan di kertas pun tetap perlu dibahas, dan "tidak ada tautan
  // soal" terlalu mudah dipakai untuk melewati tagihan ini.
  //
  // Kartu latihan soal per topik beda: kartunya ADA untuk setiap CP yang
  // dipilih, jadi menagih semuanya berarti menagih topik yang memang tidak
  // diberi latihan soal. Di sana yang ditagih hanya kartu yang URL soalnya
  // sudah terisi.
  const cpUrls: Record<string, string> = session.cp_urls ?? {}
  const cpPembahasanUrls: Record<string, string> = session.cp_pembahasan_urls ?? {}

  const topikBersoal = Object.entries(cpUrls).filter(([, url]) => adaTautan(url))

  const pembahasanRequired = assessmentsCount + topikBersoal.length
  const pembahasanCount =
    (assessmentList ?? []).filter(a => adaTautan(a.pembahasan_url)).length +
    topikBersoal.filter(([key]) => adaTautan(cpPembahasanUrls[key])).length

  const pembahasanWajib = new Date(session.scheduled_at) >= PEMBAHASAN_WAJIB_SEJAK
  const hasPembahasan = pembahasanCount >= pembahasanRequired

  const hasTopic = !!(session.topic?.trim())
  const hasAllAttendance = (attendanceCount ?? 0) >= sc && sc > 0
  // Notes required for present/late students; skip only if attendance is fully submitted and none are present/late
  const hasAllNotes = !hasAllAttendance
    ? false
    : presentLateCount === 0
      ? true
      : notesCount >= presentLateCount
  const hasMaterials = (materialsCount ?? 0) + materiKurikulum.length >= 1
  // Mirrors the notes rule: needs at least 1 assessment with every attending
  // student graded, and is skipped entirely when nobody attended.
  const hasAssessments = !hasAllAttendance
    ? false
    : presentLateCount === 0
      ? true
      : assessmentsCount >= 1 && gradedCount >= gradesRequired
  const canComplete = hasTopic && hasAllAttendance && hasAllNotes && hasMaterials && hasAssessments
    && (!pembahasanWajib || hasPembahasan)

  return {
    studentCount: sc,
    hasTopic,
    attendanceCount: attendanceCount ?? 0,
    presentLateCount,
    notesCount,
    materialsCount: materialsCount ?? 0,
    materiKurikulumCount: materiKurikulum.length,
    assessmentsCount,
    gradedCount,
    gradesRequired,
    pembahasanCount,
    pembahasanRequired,
    pembahasanWajib,
    hasAllAttendance,
    hasAllNotes,
    hasMaterials,
    hasAssessments,
    hasPembahasan,
    canComplete,
  }
}

/**
 * Auto-complete a session when all required items are filled:
 * topic, attendance for every student, notes for every student,
 * at least 1 material, and at least 1 assessment.
 */
export async function checkAndCompleteSession(sessionId: string) {
  const admin = createAdminClient()
  if (!(await bolehLihatSesi(admin, sessionId))) return

  const check = await getSessionCompletionStatus(sessionId)
  if (!check?.canComplete) return

  const { data: session } = await admin
    .from('sessions')
    .select('status')
    .eq('id', sessionId)
    .single()

  if (!session) return
  if (session.status === 'completed' || session.status === 'cancelled') return

  await admin
    .from('sessions')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}
