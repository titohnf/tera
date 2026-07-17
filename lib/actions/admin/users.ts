'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
    const { error: enrollErr } = await ctx.admin
      .from('class_students')
      .update({ is_active: false })
      .eq('student_id', userId)
      .eq('is_active', true)

    if (enrollErr) return { error: enrollErr.message }
  }

  revalidatePath(`/admin/siswa/${userId}`)
  revalidatePath('/admin/siswa')
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
