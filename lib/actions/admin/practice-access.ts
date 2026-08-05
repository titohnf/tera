'use server'

import { createAdminClient } from '@/lib/supabase/server-admin'
import { getUser } from '@/lib/supabase/get-user'
import { revalidatePath } from 'next/cache'

export type ActionState = { error: string } | null

async function verifyAdmin() {
  const user = await getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { user, admin }
}

// Tanpa karakter yang mudah tertukar saat didiktekan (0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(length = 6): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

/**
 * Kode unik lintas seluruh learner, jadi tabrakan diulang alih-alih dibiarkan
 * gagal diam-diam — pola yang sama dipakai share code kuis.
 */
async function issueUniqueCode(
  admin: ReturnType<typeof createAdminClient>,
  learnerId: string,
): Promise<ActionState> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await admin
      .from('learners')
      .update({ access_code: generateCode() })
      .eq('id', learnerId)
    if (!error) return null
  }
  return { error: 'Gagal menerbitkan kode, coba lagi' }
}

/**
 * Menyiapkan akses latihan untuk seorang murid Tera: membuat baris `learners`
 * kalau belum ada, lalu menerbitkan kodenya. Nama disalin dari profil supaya
 * halaman latihan tidak perlu membaca `profiles` (yang tertutup untuk anon).
 */
export async function enablePracticeForStudent(profileId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: profile } = await ctx.admin
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', profileId)
    .single()

  if (!profile) return { error: 'Murid tidak ditemukan' }
  if (profile.role !== 'student') return { error: 'Hanya murid yang bisa diberi akses latihan' }

  const { data: existing } = await ctx.admin
    .from('learners')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle()

  let learnerId = existing?.id as string | undefined

  if (!learnerId) {
    const { data: created, error } = await ctx.admin
      .from('learners')
      .insert({ profile_id: profileId, name: profile.full_name })
      .select('id')
      .single()
    if (error || !created) return { error: error?.message ?? 'Gagal membuat data latihan' }
    learnerId = created.id as string
  }

  const result = await issueUniqueCode(ctx.admin, learnerId)
  revalidatePath('/admin/latihan-mandiri')
  return result
}

/** Menerbitkan ulang kode — dipakai kalau kode lama bocor atau terlupa. */
export async function reissueCode(learnerId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const result = await issueUniqueCode(ctx.admin, learnerId)
  revalidatePath('/admin/latihan-mandiri')
  return result
}

/**
 * Mencabut kode tanpa menghapus learner: riwayat latihannya tetap utuh untuk
 * Laporan Bulanan, murid hanya tidak bisa masuk lagi.
 */
export async function revokeCode(learnerId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { error } = await ctx.admin
    .from('learners')
    .update({ access_code: null })
    .eq('id', learnerId)
  if (error) return { error: error.message }
  revalidatePath('/admin/latihan-mandiri')
  return null
}

/**
 * Murid dari luar Tera: tidak punya profil, tidak masuk kelas, tidak muncul di
 * Laporan Bulanan — hanya berlatih. Inilah sebabnya `learners.profile_id` boleh
 * null.
 */
export async function createExternalLearner(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Nama wajib diisi' }

  const { data: created, error } = await ctx.admin
    .from('learners')
    .insert({ name, profile_id: null })
    .select('id')
    .single()

  if (error || !created) return { error: error?.message ?? 'Gagal menambah murid luar' }

  const result = await issueUniqueCode(ctx.admin, created.id as string)
  revalidatePath('/admin/latihan-mandiri')
  return result
}

/** Hanya untuk murid luar; murid Tera dilepas aksesnya lewat revokeCode. */
export async function deleteExternalLearner(learnerId: string): Promise<ActionState> {
  const ctx = await verifyAdmin()
  if (!ctx) return { error: 'Tidak diizinkan' }

  const { data: learner } = await ctx.admin
    .from('learners')
    .select('profile_id')
    .eq('id', learnerId)
    .single()

  if (!learner) return { error: 'Data tidak ditemukan' }
  if (learner.profile_id) {
    return { error: 'Murid Tera tidak dihapus dari sini — cabut kodenya saja' }
  }

  const { error } = await ctx.admin.from('learners').delete().eq('id', learnerId)
  if (error) return { error: error.message }
  revalidatePath('/admin/latihan-mandiri')
  return null
}
