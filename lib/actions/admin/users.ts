'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { dayToIso } from '@/lib/enrollment'
import { todayWib } from '@/lib/daily-message'

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function createUser(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string)
  const phone = (formData.get('phone') as string)?.trim() || null
  const role = formData.get('role') as string
  const nickname = (formData.get('nickname') as string)?.trim() || null
  const birthDate = (formData.get('birth_date') as string) || null
  const level = (formData.get('level') as string) || null
  const gradeRaw = (formData.get('grade') as string) || null
  const grade = gradeRaw ? Number(gradeRaw) : null
  const parentName = (formData.get('parent_name') as string)?.trim() || null
  const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
  const avatarFile = formData.get('avatar') as File | null

  if (!fullName) return { error: 'Nama lengkap wajib diisi' }
  if (!email) return { error: 'Email wajib diisi' }
  if (!password || password.length < 6) return { error: 'Password minimal 6 karakter' }
  if (!['admin', 'tutor', 'student', 'parent'].includes(role)) return { error: 'Role tidak valid' }

  const { data: authData, error: authError } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id
  const extra: Record<string, string | number | null> = { role, updated_at: new Date().toISOString() }
  if (phone) extra.phone = phone
  if (nickname) extra.nickname = nickname
  if (birthDate) extra.birth_date = birthDate
  if (role === 'student') {
    extra.level = level
    extra.grade = grade
    extra.parent_name = parentName
    if (parentPhone) extra.parent_phone = parentPhone
  }

  // Upload avatar if provided
  if (avatarFile && avatarFile.size > 0) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (ALLOWED.includes(avatarFile.type)) {
      const ext = avatarFile.type === 'image/webp' ? 'webp' : avatarFile.type === 'image/png' ? 'png' : 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await ctx.admin.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (!uploadErr) {
        const { data: { publicUrl } } = ctx.admin.storage.from('avatars').getPublicUrl(path)
        extra.avatar_url = `${publicUrl}?t=${Date.now()}`
      }
    }
  }

  await ctx.admin.from('profiles').update(extra).eq('id', userId)

  revalidatePath('/admin/users')
  redirect(`/admin/users/${userId}`)
}

export async function updateUser(userId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const role = formData.get('role') as string
  const nickname = (formData.get('nickname') as string)?.trim() || null
  const birthDate = (formData.get('birth_date') as string) || null
  const level = (formData.get('level') as string) || null
  const gradeRaw = (formData.get('grade') as string) || null
  const grade = gradeRaw ? Number(gradeRaw) : null
  const parentName = (formData.get('parent_name') as string)?.trim() || null
  const parentPhone = (formData.get('parent_phone') as string)?.trim() || null
  const avatarFile = formData.get('avatar') as File | null

  if (!fullName) return { error: 'Nama lengkap wajib diisi' }
  if (!['admin', 'tutor', 'student', 'parent'].includes(role)) return { error: 'Role tidak valid' }

  const updates: Record<string, string | number | null> = {
    full_name: fullName, phone, role, nickname, birth_date: birthDate || null,
    level: role === 'student' ? level : null,
    grade: role === 'student' ? grade : null,
    parent_name: role === 'student' ? parentName : null,
    parent_phone: role === 'student' ? (parentPhone || null) : null,
    updated_at: new Date().toISOString(),
  }

  if (avatarFile && avatarFile.size > 0) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (ALLOWED.includes(avatarFile.type)) {
      const ext = avatarFile.type === 'image/webp' ? 'webp' : avatarFile.type === 'image/png' ? 'png' : 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await ctx.admin.storage.from('avatars').upload(path, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (!uploadErr) {
        const { data: { publicUrl } } = ctx.admin.storage.from('avatars').getPublicUrl(path)
        updates.avatar_url = `${publicUrl}?t=${Date.now()}`
      }
    }
  }

  const { error } = await ctx.admin
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  revalidatePath('/admin/siswa')
  redirect(`/admin/users/${userId}`)
}

export async function sendPasswordResetEmail(userId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: profile } = await ctx.admin.from('profiles').select('email').eq('id', userId).single()
  if (!profile) return { error: 'Pengguna tidak ditemukan' }

  const { error } = await ctx.admin.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
  })

  if (error) return { error: error.message }
  return null
}

export async function setStudentIsActive(userId: string, isActive: boolean): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .eq('role', 'student')

  if (error) return { error: error.message }

  if (!isActive) {
    // `unenrolled_at` wajib ikut diisi, bukan sekadar is_active.
    //
    // coversSession() di lib/enrollment.ts memperlakukan baris non-aktif yang
    // unenrolled_at-nya kosong sebagai "tanggal keluar tidak diketahui", dan
    // rentang seperti itu dianggap KOSONG — tidak ada satu pun sesi yang
    // dianggap miliknya. Tanpa baris ini, menonaktifkan siswa membuat seluruh
    // riwayatnya (sesi, kehadiran, nilai, riwayat kelas) lenyap dari halaman
    // detailnya, padahal maksud tombol ini cuma berhenti les.
    //
    // Tanggal keluarnya adalah hari ini: sampai hari ini ia masih tercatat
    // ikut, sesudahnya tidak. Ini konvensi yang sama dengan unenrollStudent()
    // di lib/actions/admin/classes.ts.
    const { error: enrollErr } = await ctx.admin
      .from('class_students')
      .update({ is_active: false, unenrolled_at: dayToIso(todayWib()) })
      .eq('student_id', userId)
      .eq('is_active', true)

    if (enrollErr) return { error: enrollErr.message }
  }

  revalidatePath(`/admin/siswa/${userId}`)
  revalidatePath('/admin/siswa')
  return null
}

export type StudentDeletionImpact = {
  studentName: string
  enrollments: number
  attendances: number
  assessmentResults: number
  performanceNotes: number
  reportNotes: number
  invoices: number
  paymentCount: number
  paymentTotal: number
  familyLinks: number
  practiceRecords: number
}

/**
 * Apa saja yang akan ikut terhapus bersama seorang siswa.
 *
 * Dipanggil sebelum dialog konfirmasi tampil. Menghapus siswa memicu cascade
 * yang panjang dan tidak terlihat dari layar mana pun, jadi angkanya
 * ditunjukkan lebih dulu — terutama pembayaran, karena laporan Laba Rugi bulan
 * bersangkutan ikut berubah begitu invoicenya hilang.
 */
export async function getStudentDeletionImpact(
  userId: string,
): Promise<{ error: string } | StudentDeletionImpact> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: profile } = await ctx.admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'Siswa tidak ditemukan' }
  if (profile.role !== 'student') return { error: 'Hanya profil siswa yang bisa dihapus di sini' }

  const { data: invoices } = await ctx.admin
    .from('invoices')
    .select('id, invoice_payments(amount)')
    .eq('student_id', userId) as unknown as {
      data: { id: string; invoice_payments: { amount: number }[] | null }[] | null
    }

  const invoiceRows = invoices ?? []
  const payments = invoiceRows.flatMap(i => i.invoice_payments ?? [])

  const countOf = async (table: string, column: string) => {
    const { count } = await ctx.admin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(column, userId)
    return count ?? 0
  }

  const [
    enrollments, attendances, assessmentResults, performanceNotes, reportNotes,
    familyLinks, practiceRecords,
  ] = await Promise.all([
    countOf('class_students', 'student_id'),
    countOf('attendances', 'student_id'),
    countOf('assessment_results', 'student_id'),
    countOf('performance_notes', 'student_id'),
    countOf('monthly_report_notes', 'student_id'),
    countOf('family_students', 'student_id'),
    countOf('learners', 'profile_id'),
  ])

  return {
    studentName: profile.full_name ?? '',
    enrollments,
    attendances,
    assessmentResults,
    performanceNotes,
    reportNotes,
    invoices: invoiceRows.length,
    paymentCount: payments.length,
    paymentTotal: payments.reduce((s, p) => s + (Number(p.amount) || 0), 0),
    familyLinks,
    practiceRecords,
  }
}

/**
 * Menghapus siswa beserta seluruh jejaknya. Tidak bisa dibatalkan.
 *
 * Disediakan untuk data uji coba, bukan untuk siswa yang berhenti — untuk itu
 * ada Nonaktifkan Siswa, yang menyimpan riwayatnya.
 *
 * `confirmName` harus sama persis dengan nama siswa. Tombol hapus terletak di
 * dekat tombol nonaktifkan, dan keduanya tidak bisa dibedakan lagi setelah
 * ditekan, jadi yang membedakannya adalah usaha mengetik nama.
 */
export async function deleteStudent(userId: string, confirmName: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: profile } = await ctx.admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single()

  if (!profile) return { error: 'Siswa tidak ditemukan' }
  if (profile.role !== 'student') return { error: 'Hanya profil siswa yang bisa dihapus di sini' }

  const expected = (profile.full_name ?? '').trim().toLowerCase()
  if (confirmName.trim().toLowerCase() !== expected) {
    return { error: 'Nama yang diketik tidak sama dengan nama siswa' }
  }

  // Invoice memakai `on delete set null` pada student_id supaya riwayat
  // keuangan selamat saat profil hilang. Untuk penghapusan yang disengaja itu
  // justru salah: invoicenya akan tertinggal tanpa pemilik, tetap membawa
  // student_name, dan tetap terhitung di Laba Rugi. Jadi dihapus lebih dulu —
  // invoice_payments ikut lewat cascade dari invoice_id.
  const { error: invoiceErr } = await ctx.admin.from('invoices').delete().eq('student_id', userId)
  if (invoiceErr) return { error: invoiceErr.message }

  // Sisanya (class_students, attendances, assessment_results,
  // performance_notes, monthly_report_notes, family_students, learners,
  // notification_logs) ikut lewat cascade dari profiles.
  const { error: profileErr } = await ctx.admin.from('profiles').delete().eq('id', userId)
  if (profileErr) return { error: profileErr.message }

  // Sejak migrasi 076 profil siswa tidak selalu punya akun login — yang punya
  // login adalah akun keluarga. Kalau akunnya memang ada, hapus juga supaya
  // emailnya bebas dipakai lagi; kalau tidak ada, bukan kegagalan.
  await ctx.admin.auth.admin.deleteUser(userId).catch(() => undefined)

  // Avatar tidak ikut cascade karena berada di storage, bukan di database.
  const { data: avatarFiles } = await ctx.admin.storage.from('avatars').list(userId)
  if (avatarFiles && avatarFiles.length > 0) {
    await ctx.admin.storage.from('avatars').remove(avatarFiles.map(f => `${userId}/${f.name}`))
  }

  revalidatePath('/admin/siswa')
  revalidatePath('/admin/users')
  revalidatePath('/admin')
  return null
}

export async function setTutorIsActive(userId: string, isActive: boolean): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .eq('role', 'tutor')

  if (error) return { error: error.message }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/tutor')
  return null
}

export type AvailabilitySlot = { day_of_week: number; start_time: string; end_time: string }

export async function adminUpdateTutorAvailability(
  tutorId: string,
  slots: AvailabilitySlot[]
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  for (const s of slots) {
    if (s.start_time >= s.end_time) {
      return { error: 'Jam selesai harus lebih dari jam mulai' }
    }
  }

  const { error: deleteError } = await ctx.admin
    .from('tutor_availability')
    .delete()
    .eq('tutor_id', tutorId)

  if (deleteError) return { error: deleteError.message }

  if (slots.length > 0) {
    const { error: insertError } = await ctx.admin
      .from('tutor_availability')
      .insert(slots.map(s => ({ tutor_id: tutorId, ...s })))

    if (insertError) return { error: insertError.message }
  }

  revalidatePath(`/admin/users/${tutorId}`)
  revalidatePath('/admin/availability')
  return null
}

export async function adminUpdateTutorSubjects(
  tutorId: string,
  selections: { subject_id: string; level: string }[]
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error: deleteError } = await ctx.admin
    .from('tutor_subjects')
    .delete()
    .eq('tutor_id', tutorId)

  if (deleteError) return { error: deleteError.message }

  if (selections.length > 0) {
    const { error: insertError } = await ctx.admin
      .from('tutor_subjects')
      .insert(selections.map(s => ({ tutor_id: tutorId, subject_id: s.subject_id, level: s.level })))

    if (insertError) return { error: insertError.message }
  }

  revalidatePath(`/admin/users/${tutorId}`)
  revalidatePath(`/admin/users/${tutorId}/edit`)
  revalidatePath('/admin/availability')
  return null
}
