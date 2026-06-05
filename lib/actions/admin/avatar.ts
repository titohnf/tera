'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export async function uploadAvatarAdmin(userId: string, formData: FormData): Promise<{ error?: string; url?: string }> {
  const caller = await getUser()
  if (!caller) return { error: 'Tidak terautentikasi.' }

  const admin = createAdminClient()
  const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', caller.id).single()
  if (callerProfile?.role !== 'admin') return { error: 'Tidak diizinkan.' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'File tidak ditemukan.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Hanya JPG, PNG, atau WebP yang diizinkan.' }
  if (file.size > MAX_SIZE) return { error: 'Ukuran foto maksimal 5MB.' }

  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await admin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)

  if (dbError) return { error: dbError.message }

  revalidatePath(`/admin/users/${userId}`)
  revalidatePath(`/admin/siswa`)
  revalidatePath(`/admin/siswa/${userId}`)
  return { url: avatarUrl }
}
