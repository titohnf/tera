'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

const COMMON_SUBJECTS = [
  { name: 'Matematika',       level: ['SD', 'SMP', 'SMA'] },
  { name: 'Bahasa Indonesia', level: ['SD', 'SMP', 'SMA'] },
  { name: 'Bahasa Inggris',   level: ['SD', 'SMP', 'SMA'] },
  { name: 'IPA',              level: ['SD', 'SMP'] },
  { name: 'IPS',              level: ['SD', 'SMP'] },
  { name: 'Fisika',           level: ['SMA'] },
  { name: 'Kimia',            level: ['SMA'] },
  { name: 'Biologi',          level: ['SMA'] },
  { name: 'Geografi',         level: ['SMA'] },
  { name: 'Ekonomi',          level: ['SMA'] },
  { name: 'Sosiologi',        level: ['SMA'] },
  { name: 'Sejarah',          level: ['SMP', 'SMA'] },
  { name: 'PPKn',             level: ['SD', 'SMP', 'SMA'] },
  { name: 'Agama',            level: ['SD', 'SMP', 'SMA'] },
  { name: 'Informatika',      level: ['SMP', 'SMA'] },
  { name: 'Prakarya',         level: ['SMP'] },
  { name: 'Seni Budaya',      level: ['SMP', 'SMA'] },
  { name: 'PJOK',             level: ['SD', 'SMP', 'SMA'] },
  { name: 'Bahasa Daerah',    level: ['SD', 'SMP'] },
  { name: 'Calistung',        level: ['SD'] },
]

export async function seedCommonSubjects(): Promise<{ error?: string; added?: number }> {
  const user = await getUser()
  if (!user) return { error: 'Tidak diizinkan' }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Tidak diizinkan' }

  const { data: existing } = await admin.from('subjects').select('name')
  const existingNames = new Set((existing ?? []).map(s => s.name))

  const toInsert = COMMON_SUBJECTS.filter(s => !existingNames.has(s.name))
  if (toInsert.length === 0) return { added: 0 }

  const { error } = await admin.from('subjects').insert(toInsert)
  if (error) return { error: error.message }

  revalidatePath('/admin/subjects')
  return { added: toInsert.length }
}
