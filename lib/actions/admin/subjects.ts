'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | { success: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

export async function createSubject(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const name = (formData.get('name') as string)?.trim()
  const levels = formData.getAll('level') as string[]
  const level = levels.length > 0 ? levels : null
  const curricula = formData.getAll('curriculum') as string[]
  const curriculum = curricula.length > 0 ? curricula : null
  if (!name) return { error: 'Nama mata pelajaran wajib diisi' }

  const { error } = await ctx.admin.from('subjects').insert({ name, level, curriculum })
  if (error) return { error: error.message }
  revalidatePath('/admin/subjects')
  return { success: `Mata pelajaran "${name}" berhasil ditambahkan` }
}

export async function updateSubject(subjectId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const name = (formData.get('name') as string)?.trim()
  const levels = formData.getAll('level') as string[]
  const level = levels.length > 0 ? levels : null
  const curricula = formData.getAll('curriculum') as string[]
  const curriculum = curricula.length > 0 ? curricula : null
  if (!name) return { error: 'Nama mata pelajaran wajib diisi' }

  const { error } = await ctx.admin.from('subjects').update({ name, level, curriculum }).eq('id', subjectId)
  if (error) return { error: error.message }
  revalidatePath('/admin/subjects')
  return { success: 'Berhasil diperbarui' }
}

export async function deleteSubject(subjectId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { count } = await ctx.admin
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', subjectId)

  if ((count ?? 0) > 0) return { error: 'Tidak bisa dihapus — masih digunakan oleh kelas' }

  const { error } = await ctx.admin.from('subjects').delete().eq('id', subjectId)
  if (error) return { error: error.message }
  revalidatePath('/admin/subjects')
  return { success: 'Mata pelajaran dihapus' }
}
