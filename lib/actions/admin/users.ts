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
  const level = (formData.get('level') as string) || null
  const gradeRaw = (formData.get('grade') as string) || null
  const grade = gradeRaw ? Number(gradeRaw) : null
  const parentName = (formData.get('parent_name') as string)?.trim() || null

  if (!fullName) return { error: 'Nama lengkap wajib diisi' }
  if (!email) return { error: 'Email wajib diisi' }
  if (!password || password.length < 6) return { error: 'Password minimal 6 karakter' }
  if (!['admin', 'tutor', 'student', 'parent'].includes(role)) return { error: 'Role tidak valid' }

  // Creates auth user — trigger auto-creates profile via handle_new_user
  const { data: authData, error: authError } = await ctx.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (authError) return { error: authError.message }

  // Update profile with phone, level, grade, parent_name (trigger doesn't include these)
  const extra: Record<string, string | number | null> = { updated_at: new Date().toISOString() }
  if (phone) extra.phone = phone
  if (role === 'student') {
    extra.level = level
    extra.grade = grade
    extra.parent_name = parentName
  }
  await ctx.admin.from('profiles').update(extra).eq('id', authData.user.id)

  revalidatePath('/admin/users')
  redirect(`/admin/users/${authData.user.id}`)
}

export async function updateUser(userId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null
  const role = formData.get('role') as string
  const level = (formData.get('level') as string) || null
  const gradeRaw = (formData.get('grade') as string) || null
  const grade = gradeRaw ? Number(gradeRaw) : null
  const parentName = (formData.get('parent_name') as string)?.trim() || null

  if (!fullName) return { error: 'Nama lengkap wajib diisi' }
  if (!['admin', 'tutor', 'student', 'parent'].includes(role)) return { error: 'Role tidak valid' }

  const { error } = await ctx.admin
    .from('profiles')
    .update({
      full_name: fullName, phone, role,
      level: role === 'student' ? level : null,
      grade: role === 'student' ? grade : null,
      parent_name: role === 'student' ? parentName : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath('/admin/users')
  return null
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
