'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

type State = { error: string } | { success: string } | null

export async function updateProfile(_prev: State, formData: FormData): Promise<State> {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi.' }

  const full_name = formData.get('full_name')?.toString().trim()
  const phone = formData.get('phone')?.toString().trim() || null

  if (!full_name) return { error: 'Nama lengkap wajib diisi.' }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ full_name, phone }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: 'Profil berhasil diperbarui.' }
}

export async function changePassword(_prev: State, formData: FormData): Promise<State> {
  const password = formData.get('password')?.toString()
  const confirm = formData.get('confirm')?.toString()

  if (!password || password.length < 8) return { error: 'Password minimal 8 karakter.' }
  if (password !== confirm) return { error: 'Konfirmasi password tidak cocok.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: 'Password berhasil diubah.' }
}
