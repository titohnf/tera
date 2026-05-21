'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

type State = { error: string } | { success: string } | null

export async function createAnnouncement(_prev: State, formData: FormData): Promise<State> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi.' }

  const title = formData.get('title')?.toString().trim()
  const body = formData.get('body')?.toString().trim()
  const rolesRaw = formData.getAll('target_roles') as string[]
  const target_roles = rolesRaw.length > 0 ? rolesRaw : null

  if (!title || !body) return { error: 'Judul dan isi wajib diisi.' }

  const admin = createAdminClient()
  const { error } = await admin.from('announcements').insert({
    title,
    body,
    target_roles,
    created_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/admin/announcements')
  return { success: 'Pengumuman berhasil dibuat.' }
}

export async function updateAnnouncement(id: string, _prev: State, formData: FormData): Promise<State> {
  const title = formData.get('title')?.toString().trim()
  const body = formData.get('body')?.toString().trim()
  const rolesRaw = formData.getAll('target_roles') as string[]
  const target_roles = rolesRaw.length > 0 ? rolesRaw : null

  if (!title || !body) return { error: 'Judul dan isi wajib diisi.' }

  const admin = createAdminClient()
  const { error } = await admin.from('announcements').update({ title, body, target_roles }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/announcements')
  return { success: 'Pengumuman diperbarui.' }
}

export async function toggleAnnouncement(id: string, is_active: boolean): Promise<void> {
  const admin = createAdminClient()
  await admin.from('announcements').update({ is_active }).eq('id', id)
  revalidatePath('/admin/announcements')
}

export async function deleteAnnouncement(id: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const { error } = await admin.from('announcements').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/announcements')
  return {}
}
